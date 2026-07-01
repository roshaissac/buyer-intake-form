/* ============================================================
   Service Worker — Buyer Intake Form
   Caches core assets so the form loads fast and works offline
   ============================================================ */

const CACHE = 'buyer-intake-v4';
// index.html is now a single self-contained file (CSS + engine inlined).
// thank-you.html still uses the shared stylesheet. Every path below must
// exist, or cache.addAll() rejects and the SW install fails.
const ASSETS = [
  '/',
  '/index.html',
  '/thank-you.html',
  '/css/style.css',
  '/assets/fraunces-latin-var.woff2',
  '/icons/dreamhouse-logo.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first for form submissions, cache first for assets
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
