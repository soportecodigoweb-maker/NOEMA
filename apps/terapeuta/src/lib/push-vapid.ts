/**
 * Llave PÚBLICA VAPID de los avisos push web.
 *
 * Es un PAR con VAPID_PRIVATE_KEY (solo en el .env del VPS). Si se regenera
 * una hay que regenerar las dos (`npx web-push generate-vapid-keys`) y todos
 * los dispositivos deben volver a activar los avisos.
 */
export const VAPID_PUBLICA =
  'BKlf5i7jXupzU8NwYWG8Pp8_xYkJlR2X3BL0G2tWfXt1kdHYsA_sqyL2KqK1Q-Bfs2BCCdBGISzMpYJJa2u6ZjU';

/** Convierte la llave base64url a Uint8Array (formato que pide PushManager). */
export function vapidPublicaBytes(): Uint8Array {
  const base64 = (VAPID_PUBLICA + '='.repeat((4 - (VAPID_PUBLICA.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
