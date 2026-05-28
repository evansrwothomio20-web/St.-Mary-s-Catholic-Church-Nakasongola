const CACHE_NAME = 'ama-tualu-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.json',
  '/assets/Ama-Tualu-Logo-Symbol.png',
  '/assets/Ama-Tualu-Logo.png',
  '/assets/community-event-1.jpeg',
  '/assets/community-event-2.jpeg',
  '/assets/community-event-3.jpeg',
  '/assets/community-event-4.jpeg',
  '/assets/community-event-5.jpeg'
];

// Install event: cache essential files and activate immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches and take control of clients
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', event => {
  const request = event.request;

  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clonedResponse));
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return networkResponse;
      });
    })
  );
});
