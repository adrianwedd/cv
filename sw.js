/**
 * CV Website Service Worker
 * Provides offline functionality and optimized caching
 */

const CACHE_NAME = 'cv-cache-v3';
const CACHE_VERSION = '2025-08-06';
const APP_PREFIX = '/cv';

// Critical resources for offline functionality
const CRITICAL_RESOURCES = [
    `${APP_PREFIX}/`,
    `${APP_PREFIX}/index.html`,
    `${APP_PREFIX}/assets/styles.css`,
    `${APP_PREFIX}/assets/script.js`,
    `${APP_PREFIX}/assets/pwa-mobile.css`
];

// Data resources that can be cached opportunistically
const DATA_RESOURCES = [
    `${APP_PREFIX}/data/base-cv.json`,
    `${APP_PREFIX}/data/activity-summary.json`,
    `${APP_PREFIX}/data/ai-enhancements.json`
];

// Assets that should be cached on demand
const RUNTIME_CACHE_PATTERNS = [
    /^\/cv\/assets\/.*\.(css|js|png|jpg|svg|woff2?)$/,
    /^\/cv\/data\/.*\.json$/,
    /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
    /^https:\/\/api\.github\.com\/users\/adrianwedd.*/
];

/**
 * Install event - cache critical resources
 */
self.addEventListener('install', event => {
    console.log(`🔧 SW installing version ${CACHE_VERSION}`);
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            // Cache critical resources first
            const criticalResults = await Promise.allSettled(
                CRITICAL_RESOURCES.map(async url => {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log(`✅ Cached critical: ${url}`);
                        } else {
                            console.warn(`⚠️ Failed to cache critical ${url}: ${response.status}`);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error caching critical ${url}:`, error.message);
                    }
                })
            );
            
            // Cache data resources opportunistically
            const dataResults = await Promise.allSettled(
                DATA_RESOURCES.map(async url => {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log(`📊 Cached data: ${url}`);
                        }
                    } catch (error) {
                        console.log(`📊 Data not available: ${url}`);
                    }
                })
            );
            
            const criticalSuccesses = criticalResults.filter(r => r.status === 'fulfilled').length;
            console.log(`🎯 SW installed: ${criticalSuccesses}/${CRITICAL_RESOURCES.length} critical resources cached`);
            
            // Force activation of new service worker
            return self.skipWaiting();
        })
    );
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', event => {
    console.log(`🚀 SW activating version ${CACHE_VERSION}`);
    
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName.startsWith('cv-cache-') && cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log(`🗑️ Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ])
    );
});

/**
 * Fetch event - intelligent caching strategy
 */
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external URLs not in our cache patterns
    if (!url.pathname.startsWith(APP_PREFIX) && !RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(event.request.url))) {
        return;
    }
    
    event.respondWith(handleFetch(event.request));
});

/**
 * Intelligent fetch handling with multiple strategies
 */
async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Strategy 1: Cache First for static assets
        if (url.pathname.match(/\.(css|js|png|jpg|svg|woff2?)$/)) {
            return await cacheFirst(request);
        }
        
        // Strategy 2: Network First for data resources
        if (url.pathname.includes('/data/') || url.hostname === 'api.github.com') {
            return await networkFirst(request);
        }
        
        // Strategy 3: Cache First for main pages
        if (url.pathname === `${APP_PREFIX}/` || url.pathname === `${APP_PREFIX}/index.html`) {
            return await cacheFirst(request);
        }
        
        // Default: Network with cache fallback
        return await networkFirst(request);
        
    } catch (error) {
        console.warn('SW fetch error:', error);
        
        // Fallback to offline page if available
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match(`${APP_PREFIX}/index.html`);
            return offlineResponse || new Response('Offline - CV not available', { status: 503 });
        }
        
        return new Response('Resource not available offline', { status: 503 });
    }
}

/**
 * Cache First strategy - check cache, fallback to network
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

/**
 * Network First strategy - try network, fallback to cache
 */
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        // Network failed, try cache
        console.log(`Network failed for ${request.url}, trying cache`);
    }
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    throw new Error('Resource not available');
}

/**
 * Message handling for cache management
 */
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_STATS') {
        caches.open(CACHE_NAME).then(cache => {
            cache.keys().then(keys => {
                event.ports[0].postMessage({
                    type: 'CACHE_STATS_RESPONSE',
                    cacheSize: keys.length,
                    cacheName: CACHE_NAME,
                    version: CACHE_VERSION
                });
            });
        });
    }
});

console.log(`🎯 CV Service Worker v${CACHE_VERSION} loaded`);