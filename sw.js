// Service Worker - Cache Strategy & Offline Support
const CACHE_NAME = 'blobby-v1.0.0';
const RUNTIME_CACHE = 'blobby-runtime-v1.0.0';
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/animations.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/assets/css/navbar.css',
  '/assets/css/responsive.css',
  '/main.js'
];

// Install: Cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch((error) => {
        console.warn('Cache addAll failed:', error);
        // Continue even if some assets fail to cache
        return Promise.all(
          CRITICAL_ASSETS.map((url) =>
            cache.add(url).catch((err) => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains (except APIs we want to cache)
  if (url.origin !== location.origin) {
    // Cache social media icons but don't fail on network error
    if (request.destination === 'image') {
      event.respondWith(
        caches.match(request).then((response) => {
          return response || fetch(request).then((fetchResponse) => {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, fetchResponse.clone()));
            return fetchResponse;
          });
        }).catch(() => {
          // Return a placeholder or cached version
          return caches.match(request);
        })
      );
    }
    return;
  }

  // Stale-while-revalidate for HTML, CSS, JS
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        const fetchPromise = fetch(request).then((fetchResponse) => {
          if (fetchResponse.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, fetchResponse.clone()));
          }
          return fetchResponse;
        }).catch(() => response || new Response('Offline', { status: 503 }));

        return response || fetchPromise;
      })
    );
  } else {
    // Network first for images and other assets
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
  }
});

// Message handler for cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});
