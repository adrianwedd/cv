/**
 * Service Worker for Adrian Wedd CV
 * Provides offline caching, performance optimization, and PWA capabilities
 */

const CACHE_NAME = 'cv-cache-v1';
const STATIC_ASSETS = [
    '/cv/',
    '/cv/index.html',
    '/cv/assets/styles.css',
    '/cv/assets/script.js',
    '/cv/data/base-cv.json',
    '/cv/assets/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request).catch(() => {
                    // Fallback for offline scenarios
                    if (event.request.destination === 'document') {
                        return caches.match('/cv/index.html');
                    }
                });
            })
    );
});