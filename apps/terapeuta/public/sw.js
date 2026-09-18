/**
 * Service worker de NOEMA (PWA).
 *
 * Deliberadamente MÍNIMO: no cachea páginas ni datos (es una app de salud con
 * información privada). Solo habilita la instalación y sirve una página de
 * cortesía cuando no hay conexión. Todo lo demás va siempre a la red, así que
 * nunca muestra contenido viejo ni rompe las Server Actions.
 */
const OFFLINE_URL = '/offline.html';
const CACHE = 'noema-offline-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo interceptamos navegaciones (abrir páginas). El resto pasa directo.
  if (req.mode !== 'navigate') return;
  event.respondWith(
    fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r ?? Response.error())),
  );
});

// ── Avisos push (web-push / VAPID) ───────────────────────────────────────────
// El servidor (/api/push/despachar) manda un JSON {title, body, url, tag}.
// Aquí solo se muestra la notificación; no se cachea nada.
self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { body: event.data ? event.data.text() : '' };
  }
  const titulo = datos.title || 'NOEMA';
  const opciones = {
    body: datos.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: datos.tag || undefined,
    data: { url: datos.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

// Al tocar la notificación: enfocar una ventana abierta de la app (y llevarla a
// la URL del aviso) o abrir una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ('focus' in v) {
          if ('navigate' in v) v.navigate(destino).catch(() => {});
          return v.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
