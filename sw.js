const CACHE_NAME = 'cv-cache-v2';
const urlsToCache = [
    '/cv/',
    '/cv/index.html',
    '/cv/assets/styles.css',
    '/cv/assets/script.js',
    '/cv/assets/pwa-mobile.css',
    '/cv/data/base-cv.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache).catch(error => {
                console.error('Cache addAll failed:', error);
                // Cache individual files that exist
                return Promise.allSettled(
                    urlsToCache.map(url => 
                        fetch(url).then(response => {
                            if (response.ok) {
                                return cache.put(url, response);
                            }
                        }).catch(err => console.warn(`Failed to cache ${url}:`, err))
                    )
                );
            });
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});