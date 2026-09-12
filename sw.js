const CACHE_NAME = 'kejamarket-v23'; // Small PWA install button, one-touch install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/style.css',
  '/css/map.css',
  '/css/monetization.css',
  '/js/data/locations.js',
  '/js/data/seedListings.js',
  '/js/comments.js',
  '/js/reviews.js',
  '/js/map.js',
  '/js/landlord.js',
  '/js/botSimulator.js',
  '/js/monetization.js',
  '/js/admin.js',
  '/js/app.js',
  '/js/auth.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  // Force new service worker to activate immediately
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('Cache addAll:', err));
    })
  );
});

self.addEventListener('activate', (e) => {
  // Purge all previous caches immediately
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) {
            console.log('Purging old cache:', k);
            return caches.delete(k);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Never cache API calls
  if (e.request.url.includes('/api/')) {
    return;
  }

  // Network-first for HTML and JS files to always show freshest updates
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (e.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html');
          }
        });
      })
  );
});
