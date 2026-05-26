/**
 * Edge Function: stripe-checkout
 *
 * Crea una sesión de Stripe Checkout para que el terapeuta active su suscripción.
 * Usa modelo "metered billing" — Stripe Subscription con cantidad reportada
 * mensualmente desde un cron (Fase post-MVP, por ahora cantidad fija = pacientes_activos).
 *
 * POST /functions/v1/stripe-checkout
 */
import { createClient } from 'jsr:@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-ignore Deno
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Sin autenticación.' }, 401);
    }

    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // @ts-ignore
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    // @ts-ignore
    const stripePriceId = Deno.env.get('STRIPE_PRICE_ID_PACIENTE');
    // @ts-ignore
    const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3006';

    if (!stripeKey || !stripePriceId) {
      return json(
        {
          error:
            'Stripe no configurado. Define STRIPE_SECRET_KEY y STRIPE_PRICE_ID_PACIENTE en los secrets de Supabase.',
        },
        503,
      );
    }

    // Validar usuario
    const userClient = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Sesión inválida.' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Obtener o crear stripe_customer_id
    const { data: terapeuta } = await admin
      .from('terapeutas')
      .select('stripe_customer_id, titulo')
      .eq('profile_id', user.id)
      .single();

    if (!terapeuta) {
      return json({ error: 'No eres terapeuta registrado.' }, 403);
    }

    let customerId = terapeuta.stripe_customer_id;
    if (!customerId) {
      // Crear customer en Stripe
      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email ?? '',
          'metadata[profile_id]': user.id,
        }),
      });
      const customer = await customerRes.json();
      if (!customer.id) {
        console.error('Error creando customer:', customer);
        return json({ error: 'Error al conectar con Stripe.' }, 502);
      }
      customerId = customer.id;
      await admin
        .from('terapeutas')
        .update({ stripe_customer_id: customerId })
        .eq('profile_id', user.id);
    }

    // Contar pacientes activos para cantidad inicial
    const { count: pacientesCount } = await admin
      .from('vinculaciones')
      .select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id)
      .eq('estado', 'activa');

    // Crear sesión de Checkout
    const params = new URLSearchParams({
      customer: customerId!,
      mode: 'subscription',
      'line_items[0][price]': stripePriceId,
      'line_items[0][quantity]': String(Math.max(pacientesCount ?? 0, 1)),
      success_url: `${siteUrl}/ajustes?stripe=success`,
      cancel_url: `${siteUrl}/ajustes?stripe=cancel`,
      'subscription_data[trial_period_days]': '30',
      'subscription_data[metadata][profile_id]': user.id,
      allow_promotion_codes: 'true',
    });

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const session = await sessionRes.json();
    if (!session.url) {
      console.error('Error creando session:', session);
      return json({ error: 'Error al iniciar Checkout.' }, 502);
    }

    return json({ ok: true, url: session.url });
  } catch (e) {
    console.error(e);
    return json({ error: 'Error interno.' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
