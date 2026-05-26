/**
 * Edge Function: stripe-webhook
 *
 * Recibe webhooks de Stripe y sincroniza el estado del plan del terapeuta.
 *
 * Eventos manejados:
 *   - customer.subscription.created / updated → actualizar plan_estado
 *   - customer.subscription.deleted → marcar cancelada
 *   - invoice.paid → guardar en stripe_facturas
 *   - invoice.payment_failed → marcar pago_fallido
 *
 * IMPORTANTE:
 *   - Valida firma de Stripe con STRIPE_WEBHOOK_SECRET
 *   - Idempotente: guarda event.id y descarta duplicados
 */
import { createClient } from 'jsr:@supabase/supabase-js@2.47.10';

// @ts-ignore Deno
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // @ts-ignore
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // @ts-ignore
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // @ts-ignore
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  // @ts-ignore
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe no configurado', { status: 503 });
  }

  // Validar firma
  const signature = req.headers.get('stripe-signature');
  const payload = await req.text();
  if (!signature) {
    return new Response('Sin firma', { status: 401 });
  }

  let event: any;
  try {
    event = await verificarFirmaStripe(payload, signature, webhookSecret);
  } catch (e) {
    console.error('Firma inválida:', e);
    return new Response('Firma inválida', { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Idempotencia
  const { data: existente } = await admin
    .from('stripe_eventos')
    .select('id, procesado_at')
    .eq('id', event.id)
    .maybeSingle();
  if (existente?.procesado_at) {
    return new Response('OK (ya procesado)', { status: 200 });
  }

  // Guardar evento
  await admin
    .from('stripe_eventos')
    .upsert({ id: event.id, tipo: event.type, payload: event });

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const profileId = sub.metadata?.profile_id;
        if (profileId) {
          await admin
            .from('terapeutas')
            .update({
              stripe_subscription_id: sub.id,
              plan_estado: mapStripeStatus(sub.status),
              trial_termina_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            })
            .eq('profile_id', profileId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const profileId = sub.metadata?.profile_id;
        if (profileId) {
          await admin
            .from('terapeutas')
            .update({ plan_estado: 'cancelada', stripe_subscription_id: null })
            .eq('profile_id', profileId);
        }
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object;
        const profileId = inv.subscription_details?.metadata?.profile_id;
        if (profileId) {
          await admin.from('stripe_facturas').insert({
            id: inv.id,
            terapeuta_id: profileId,
            monto_centavos: inv.amount_paid,
            moneda: inv.currency,
            estado: 'paid',
            pacientes_count: inv.lines?.data?.[0]?.quantity ?? null,
            periodo_inicio: inv.lines?.data?.[0]?.period?.start
              ? new Date(inv.lines.data[0].period.start * 1000).toISOString()
              : null,
            periodo_fin: inv.lines?.data?.[0]?.period?.end
              ? new Date(inv.lines.data[0].period.end * 1000).toISOString()
              : null,
            url_factura: inv.hosted_invoice_url,
            url_pdf: inv.invoice_pdf,
            pagada_at: new Date().toISOString(),
          });
          await admin
            .from('terapeutas')
            .update({ plan_estado: 'activa' })
            .eq('profile_id', profileId);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object;
        const profileId = inv.subscription_details?.metadata?.profile_id;
        if (profileId) {
          await admin
            .from('terapeutas')
            .update({ plan_estado: 'pago_fallido' })
            .eq('profile_id', profileId);
        }
        break;
      }
    }

    // Marcar como procesado
    await admin
      .from('stripe_eventos')
      .update({ procesado_at: new Date().toISOString() })
      .eq('id', event.id);

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error('Error procesando evento:', e);
    return new Response('Error interno', { status: 500 });
  }
});

function mapStripeStatus(status: string): string {
  switch (status) {
    case 'active': return 'activa';
    case 'trialing': return 'trial';
    case 'past_due':
    case 'unpaid': return 'pago_fallido';
    case 'canceled':
    case 'incomplete_expired': return 'cancelada';
    default: return 'sin_pago';
  }
}

/**
 * Valida la firma de Stripe usando HMAC-SHA256.
 * Implementación nativa (sin importar paquete `stripe` que es pesado en Deno).
 */
async function verificarFirmaStripe(
  payload: string,
  signature: string,
  secret: string,
): Promise<any> {
  const parts = signature.split(',').reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const sigV1 = parts.v1;
  if (!timestamp || !sigV1) throw new Error('Firma malformada');

  const signedPayload = `${timestamp}.${payload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (expectedSig !== sigV1) throw new Error('Firma no coincide');

  return JSON.parse(payload);
}
