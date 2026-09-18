/**
 * Envío de avisos push web (web-push / VAPID). SOLO del lado del servidor.
 *
 * Lee VAPID_PRIVATE_KEY y VAPID_SUBJECT del entorno; la pública vive en el
 * código (push-vapid.ts). Si falta la privada no se manda nada y se avisa.
 */
import webpush from 'web-push';
import { VAPID_PUBLICA } from './push-vapid';

export interface SuscripcionPush {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PayloadPush {
  title: string;
  body?: string | null;
  url?: string | null;
  tag?: string;
}

let configurado = false;

/** Configura web-push una vez. Devuelve el motivo si no se puede. */
export function prepararPush(): { ok: true } | { ok: false; motivo: string } {
  if (configurado) return { ok: true };
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!privada) return { ok: false, motivo: 'falta VAPID_PRIVATE_KEY en el entorno' };
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:soportenoema@gmail.com';
  try {
    webpush.setVapidDetails(subject, VAPID_PUBLICA, privada);
  } catch (e) {
    return { ok: false, motivo: `VAPID inválido: ${e instanceof Error ? e.message : String(e)}` };
  }
  configurado = true;
  return { ok: true };
}

/**
 * Manda un push a una suscripción. `muerta` = el navegador ya no la reconoce
 * (404/410): hay que borrarla de push_suscripciones.
 */
export async function enviarPush(
  s: SuscripcionPush,
  payload: PayloadPush,
): Promise<{ ok: true } | { ok: false; muerta: boolean; error: string }> {
  const prep = prepararPush();
  if (!prep.ok) return { ok: false, muerta: false, error: prep.motivo };
  try {
    await webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24, urgency: 'high' },
    );
    return { ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return {
      ok: false,
      muerta: status === 404 || status === 410,
      error: `${status ?? ''} ${e instanceof Error ? e.message : String(e)}`.trim(),
    };
  }
}
