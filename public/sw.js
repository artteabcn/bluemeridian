const CACHE_NAME = 'app-shell-v1';
const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Only ever serve the static app-shell assets above from cache. Every page
// and API call goes straight to the network so Cloudflare Access and live
// shareholder/document data are never served stale from here.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!PRECACHE_URLS.includes(url.pathname)) return;

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
