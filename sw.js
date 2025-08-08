/**
 * Advanced Service Worker for Adrian Wedd CV
 * 
 * Features:
 * - Stale-while-revalidate caching strategy
 * - Cache prioritization by resource type  
 * - Background sync for performance data
 * - Intelligent cache eviction
 * - Performance monitoring and optimization
 */

const CACHE_VERSION = 'v5-nocache-' + Date.now(); // Force new cache
const CACHE_NAMES = {
    static: `cv-static-${CACHE_VERSION}`,
    dynamic: `cv-dynamic-${CACHE_VERSION}`,
    api: `cv-api-${CACHE_VERSION}`,
    images: `cv-images-${CACHE_VERSION}`
};

// Critical resources for immediate caching
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/assets/styles.min.css',
    '/assets/script.min.js',
    '/manifest.json'
];

// Additional assets for background caching
const EXTENDED_ASSETS = [
    '/career-intelligence.html',
    '/watch-me-work.html',
    '/assets/pwa-mobile.css',
    '/assets/career-intelligence.js',
    '/assets/pwa-enhancements.js',
    '/data/base-cv.json',
    '/data/activity-summary.json'
];

// Cache strategies by resource type
const CACHE_STRATEGIES = {
    document: 'networkFirst',
    script: 'cacheFirst', 
    style: 'cacheFirst',
    image: 'cacheFirst',
    api: 'staleWhileRevalidate',
    font: 'cacheFirst'
};

// Performance monitoring
let performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    averageResponseTime: 0
};

/**
 * Install Event - Progressive Caching
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical assets immediately
            caches.open(CACHE_NAMES.static).then(cache => {
                console.log('[SW] Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
            }),
            
            // Cache extended assets in background
            caches.open(CACHE_NAMES.dynamic).then(cache => {
                console.log('[SW] Background caching extended assets');
                return Promise.allSettled(
                    EXTENDED_ASSETS.map(asset => 
                        cache.add(asset).catch(err => 
                            console.warn(`[SW] Failed to cache ${asset}:`, err)
                        )
                    )
                );
            })
        ]).then(() => {
            console.log('[SW] Installation complete, skipping waiting');
            self.skipWaiting();
        })
    );
});

/**
 * Activate Event - Cache Cleanup & Optimization
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            cleanupOldCaches(),
            
            // Initialize performance monitoring
            initializePerformanceMonitoring(),
            
            // Claim all clients
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Activation complete');
        })
    );
});

/**
 * Fetch Event - Intelligent Caching Strategy
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    event.respondWith(handleRequest(request));
});

/**
 * Background Sync - Performance Data Collection
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'performance-sync') {
        event.waitUntil(syncPerformanceData());
    }
});

/**
 * Handle Request with Appropriate Strategy
 */
async function handleRequest(request) {
    const startTime = performance.now();
    const resourceType = getResourceType(request);
    const strategy = CACHE_STRATEGIES[resourceType] || 'networkFirst';
    
    try {
        let response;
        
        switch (strategy) {
            case 'cacheFirst':
                response = await cacheFirstStrategy(request);
                break;
            case 'networkFirst':
                response = await networkFirstStrategy(request);
                break;
            case 'staleWhileRevalidate':
                response = await staleWhileRevalidateStrategy(request);
                break;
            default:
                response = await networkFirstStrategy(request);
        }
        
        // Track performance metrics
        const endTime = performance.now();
        updatePerformanceMetrics(endTime - startTime, response);
        
        return response;
        
    } catch (error) {
        console.error('[SW] Request failed:', error);
        return handleOfflineFallback(request);
    }
}

/**
 * Cache-First Strategy (for static assets)
 */
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        performanceMetrics.cacheHits++;
        
        // Background update for better performance
        if (shouldBackgroundUpdate(request)) {
            backgroundUpdate(request);
        }
        
        return cached;
    }
    
    // Fetch and cache
    const response = await fetch(request);
    if (response.ok) {
        const cache = await getCacheByResourceType(request);
        cache.put(request, response.clone());
    }
    
    performanceMetrics.cacheMisses++;
    return response;
}

/**
 * Network-First Strategy (for documents)
 */
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);
        performanceMetrics.networkRequests++;
        
        if (response.ok) {
            const cache = await getCacheByResourceType(request);
            cache.put(request, response.clone());
        }
        
        return response;
        
    } catch (error) {
        // Fallback to cache
        const cached = await caches.match(request);
        if (cached) {
            performanceMetrics.cacheHits++;
            return cached;
        }
        throw error;
    }
}

/**
 * Stale-While-Revalidate Strategy (for API data)
 */
async function staleWhileRevalidateStrategy(request) {
    const cache = await getCacheByResourceType(request);
    const cached = await cache.match(request);
    
    // Always attempt network update in background
    const networkPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => null);
    
    // Return cached immediately if available
    if (cached) {
        performanceMetrics.cacheHits++;
        networkPromise; // Don't await, let it update in background
        return cached;
    }
    
    // Wait for network if no cache
    const networkResponse = await networkPromise;
    if (networkResponse) {
        performanceMetrics.networkRequests++;
        return networkResponse;
    }
    
    throw new Error('No cached response and network failed');
}

/**
 * Get appropriate cache by resource type
 */
async function getCacheByResourceType(request) {
    const resourceType = getResourceType(request);
    
    switch (resourceType) {
        case 'image':
            return caches.open(CACHE_NAMES.images);
        case 'api':
            return caches.open(CACHE_NAMES.api);
        case 'script':
        case 'style':
        case 'font':
            return caches.open(CACHE_NAMES.static);
        default:
            return caches.open(CACHE_NAMES.dynamic);
    }
}

/**
 * Determine resource type from request
 */
function getResourceType(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // API endpoints
    if (pathname.includes('/data/') || pathname.includes('/api/')) {
        return 'api';
    }
    
    // Static assets by extension
    if (pathname.match(/\.(js|mjs)$/)) return 'script';
    if (pathname.match(/\.(css)$/)) return 'style';
    if (pathname.match(/\.(woff2?|ttf|eot)$/)) return 'font';
    if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/)) return 'image';
    if (pathname.match(/\.(html?)$/)) return 'document';
    
    // Default for other requests
    return 'document';
}

/**
 * Background update for better performance
 */
function backgroundUpdate(request) {
    fetch(request).then(response => {
        if (response.ok) {
            getCacheByResourceType(request).then(cache => {
                cache.put(request, response.clone());
            });
        }
    }).catch(() => {
        // Silent fail for background updates
    });
}

/**
 * Check if resource should be updated in background
 */
function shouldBackgroundUpdate(request) {
    const url = new URL(request.url);
    
    // Update API data more frequently
    if (getResourceType(request) === 'api') {
        return true;
    }
    
    // Skip background updates for very static assets
    const staticExtensions = ['.woff2', '.woff', '.ttf'];
    return !staticExtensions.some(ext => url.pathname.includes(ext));
}

/**
 * Handle offline fallbacks
 */
async function handleOfflineFallback(request) {
    const resourceType = getResourceType(request);
    
    // For documents, return cached index.html
    if (resourceType === 'document') {
        const cached = await caches.match('/index.html');
        if (cached) return cached;
    }
    
    // For other resources, try to find any cached version
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Create offline response
    return new Response('Offline - Resource not available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache'
        })
    });
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
    const currentCaches = Object.values(CACHE_NAMES);
    const allCaches = await caches.keys();
    
    const deletionPromises = allCaches
        .filter(cacheName => !currentCaches.includes(cacheName))
        .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
        });
    
    await Promise.all(deletionPromises);
}

/**
 * Initialize performance monitoring
 */
function initializePerformanceMonitoring() {
    // Reset metrics
    performanceMetrics = {
        cacheHits: 0,
        cacheMisses: 0,
        networkRequests: 0,
        averageResponseTime: 0,
        startTime: Date.now()
    };
    
    // Schedule periodic cache cleanup
    setInterval(performCacheCleanup, 60000); // Every minute
    
    console.log('[SW] Performance monitoring initialized');
}

/**
 * Update performance metrics
 */
function updatePerformanceMetrics(responseTime, response) {
    const isFromCache = response && response.headers.get('X-Cache') === 'HIT';
    
    if (responseTime > 0) {
        const currentAvg = performanceMetrics.averageResponseTime;
        const totalRequests = performanceMetrics.cacheHits + 
                             performanceMetrics.cacheMisses + 
                             performanceMetrics.networkRequests;
        
        performanceMetrics.averageResponseTime = 
            (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
    }
}

/**
 * Perform intelligent cache cleanup
 */
async function performCacheCleanup() {
    const maxCacheSize = 50 * 1024 * 1024; // 50MB limit
    
    for (const cacheName of Object.values(CACHE_NAMES)) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length > 100) { // Too many cached items
            // Remove oldest 20% of cached items
            const itemsToRemove = keys.slice(0, Math.floor(keys.length * 0.2));
            await Promise.all(itemsToRemove.map(request => cache.delete(request)));
            
            console.log(`[SW] Cleaned up ${itemsToRemove.length} items from ${cacheName}`);
        }
    }
}

/**
 * Sync performance data with main application
 */
async function syncPerformanceData() {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
        client.postMessage({
            type: 'PERFORMANCE_UPDATE',
            data: performanceMetrics
        });
    });
}

console.log('[SW] Advanced Service Worker loaded');