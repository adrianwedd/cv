// Service Worker Configuration
const CACHE_NAME = 'cv-cache-v1';
const PRECACHE_ASSETS = [
  "chunks/critical.json",
  "assets/critical.css"
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/chunks/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        fetch(event.request).then((fetchResponse) => {
                            cache.put(event.request, fetchResponse.clone());
                        });
                        return response;
                    }
                    return fetch(event.request).then((fetchResponse) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
    }
});