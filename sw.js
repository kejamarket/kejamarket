const CACHE_NAME = 'kejamarket-v31-offline-ready';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',

  // CSS Stylesheets
  '/css/style.css',
  '/css/map.css',
  '/css/monetization.css',
  '/css/verification.css',
  '/css/recently-added.css',
  '/css/simplified-management.css',
  '/css/communication-system.css',
  '/css/enhanced-portal.css',
  '/css/admin-dashboard.css',

  // Vendor: Fonts
  '/vendor/fonts/plus-jakarta-sans.css',
  '/vendor/fonts/plus-jakarta-sans-400.woff2',
  '/vendor/fonts/plus-jakarta-sans-500.woff2',
  '/vendor/fonts/plus-jakarta-sans-600.woff2',
  '/vendor/fonts/plus-jakarta-sans-700.woff2',
  '/vendor/fonts/plus-jakarta-sans-800.woff2',

  // Vendor: FontAwesome 6.5.1
  '/vendor/fontawesome/css/all.min.css',
  '/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  '/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  '/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  '/vendor/fontawesome/webfonts/fa-v4compatibility.woff2',

  // Vendor: Leaflet Maps
  '/vendor/leaflet/leaflet.css',
  '/vendor/leaflet/leaflet.js',
  '/vendor/leaflet/images/marker-icon.png',
  '/vendor/leaflet/images/marker-icon-2x.png',
  '/vendor/leaflet/images/marker-shadow.png',
  '/vendor/leaflet/images/layers.png',
  '/vendor/leaflet/images/layers-2x.png',

  // Vendor: Chart.js
  '/vendor/chartjs/chart.min.js',

  // Core & Feature JavaScript Files
  '/js/offline-manager.js',
  '/js/auth.js',
  '/js/reviews.js',
  '/js/data/locations.js',
  '/js/data/seedListings.js',
  '/js/comments.js',
  '/js/map.js',
  '/js/watermark.js',
  '/js/landlord.js',
  '/js/landlord-portal.js',
  '/js/service-portal.js',
  '/js/user-dashboard.js',
  '/js/verification.js',
  '/js/enhanced-landlord-portal.js',
  '/js/simplified-property-management.js',
  '/js/communication-system.js',
  '/js/messages-interface.js',
  '/js/recently-added.js',
  '/js/botSimulator.js',
  '/js/monetization.js',
  '/js/app.js',
  '/js/instagram-integration.js',
  '/js/admin.js',

  // Icons and Fallbacks
  '/icons/offline-placeholder.svg',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/apple-touch-icon.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: Cache all critical app shell & static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use individual caching to prevent single-asset failure from breaking install
      const cachePromises = STATIC_ASSETS.map(async (asset) => {
        try {
          const response = await fetch(asset, { cache: 'no-cache' });
          if (response && response.ok) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn(`[SW] Pre-caching asset skipped: ${asset}`, err);
        }
      });
      await Promise.all(cachePromises);
      console.log('[SW] Essential app shell pre-cached successfully.');
    })
  );
});

// Activate: Clean up older cache iterations
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Query-aware caching, app shell navigation fallback, and image fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never intercept non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. Handle API calls: network only, return JSON offline notification if network fails
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: 'You are currently offline. This action requires an active internet connection.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Navigation requests (HTML pages)
  // Try network first, falling back to cached index.html or offline.html
  if (req.mode === 'navigate' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          // Check if the specific page was cached
          const cachedPage = await caches.match(req, { ignoreSearch: true });
          if (cachedPage) return cachedPage;

          // Otherwise, serve cached root app shell (index.html)
          const appShell = await caches.match('/', { ignoreSearch: true }) || await caches.match('/index.html', { ignoreSearch: true });
          if (appShell) return appShell;

          // Ultimate fallback to offline.html
          const offlinePage = await caches.match('/offline.html', { ignoreSearch: true });
          return offlinePage || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 4. Image requests (photos, avatars, external listing pictures)
  if (
    req.destination === 'image' ||
    /\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/i.test(url.pathname) ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('supabase')
  ) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cachedImage) => {
        if (cachedImage) return cachedImage;

        return fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(async () => {
            // Return branded offline SVG placeholder on image fetch error
            const fallback = await caches.match('/icons/offline-placeholder.svg', { ignoreSearch: true });
            return fallback || new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="#64748b">Offline</text></svg>', {
              status: 200,
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          });
      })
    );
    return;
  }

  // 5. Static Assets (CSS, JS, Fonts)
  // Stale-While-Revalidate with ignoreSearch to handle ?v= query params
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cachedRes); // Fall back to cache on network error

      // Return cached version immediately if available, while refreshing in background
      return cachedRes || fetchPromise;
    })
  );
});
