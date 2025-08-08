// Ultra-optimized service worker for 100/100 performance
const CACHE_VERSION = 'v5-ultra';
const CACHE_NAME = `cv-ultra-${CACHE_VERSION}`;

// Critical assets for immediate caching
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/assets/styles.micro.css',
    '/assets/script.ultra.js'
];

// Install event - cache critical assets immediately
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CRITICAL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(name => name.startsWith('cv-') && name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    // Skip non-GET requests and external domains
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                
                return fetch(event.request).then(fetchResponse => {
                    // Don't cache non-successful responses
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    // Cache successful responses
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));

                    return fetchResponse;
                }).catch(() => {
                    // Return offline page or basic response if available
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});