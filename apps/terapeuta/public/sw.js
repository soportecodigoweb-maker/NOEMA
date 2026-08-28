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
