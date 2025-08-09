/**
 * High-Performance Service Worker for Adrian Wedd CV
 * 
 * Optimizations:
 * - Smart resource prioritization
 * - Intelligent cache invalidation
 * - Background sync for analytics
 * - Memory-efficient caching strategies
 * - Real-time performance monitoring
 * - Code-split resource handling
 */

const CACHE_VERSION = 'v6-optimized-' + '20250808';
const CACHE_NAMES = {
    critical: `cv-critical-${CACHE_VERSION}`,
    chunks: `cv-chunks-${CACHE_VERSION}`,
    static: `cv-static-${CACHE_VERSION}`,
    dynamic: `cv-dynamic-${CACHE_VERSION}`,
    api: `cv-api-${CACHE_VERSION}`,
    images: `cv-images-${CACHE_VERSION}`
};

// Critical path resources (highest priority)
const CRITICAL_RESOURCES = [
    '/',
    '/cv/',
    '/cv/index.html',
    '/cv/assets/script.js',
    '/cv/assets/styles.min.css',
    '/cv/assets/dynamic-loader.js',
    '/cv/manifest.json'
];

// Code-split chunks (medium priority, lazy loaded)
const CHUNK_RESOURCES = [
    '/cv/assets/chunks/performance-monitor.min.js',
    '/cv/assets/chunks/github-integration.min.js',
    '/cv/assets/chunks/data-visualizer.min.js',
    '/cv/assets/chunks/export-system.min.js'
];

// Static assets (low priority)
const STATIC_RESOURCES = [
    '/cv/assets/styles-beautiful.min.css',
    '/cv/assets/header-fixes.css',
    '/cv/assets/critical-fixes.css',
    '/cv/assets/beautiful-enhancements.min.js',
    '/cv/data/base-cv.json'
];

// Cache strategies with performance optimization
const CACHE_STRATEGIES = {
    // Critical resources: Cache first with network fallback
    critical: {
        strategy: 'cacheFirst',
        maxAge: 86400000, // 24 hours
        maxEntries: 20
    },
    
    // Code chunks: Cache first with background update
    chunks: {
        strategy: 'staleWhileRevalidate',
        maxAge: 43200000, // 12 hours
        maxEntries: 10
    },
    
    // Static assets: Cache first, long TTL
    static: {
        strategy: 'cacheFirst',
        maxAge: 604800000, // 7 days
        maxEntries: 50
    },
    
    // Dynamic content: Network first with cache fallback
    dynamic: {
        strategy: 'networkFirst',
        maxAge: 3600000, // 1 hour
        maxEntries: 30
    },
    
    // API responses: Stale while revalidate
    api: {
        strategy: 'staleWhileRevalidate',
        maxAge: 300000, // 5 minutes
        maxEntries: 20
    },
    
    // Images: Cache first, long TTL
    images: {
        strategy: 'cacheFirst',
        maxAge: 2592000000, // 30 days
        maxEntries: 100
    }
};

// Performance metrics
let metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    responseTime: [],
    chunkLoads: 0,
    criticalPathTime: 0
};

/**
 * Install Event - Progressive Asset Caching
 */
self.addEventListener('install', (event) => {
    
    
    const startTime = performance.now();
    
    event.waitUntil(
        Promise.all([
            // Priority 1: Cache critical path resources immediately
            caches.open(CACHE_NAMES.critical).then(cache => {
                
                return cache.addAll(CRITICAL_RESOURCES.map(url => new Request(url, {
                    cache: 'reload' // Force fresh download during install
                })));
            }),
            
            // Priority 2: Cache chunks in background
            caches.open(CACHE_NAMES.chunks).then(cache => {
                
                return Promise.allSettled(
                    CHUNK_RESOURCES.map(url => 
                        cache.add(url).catch(err => 
                            console.warn(`[SW-OPT] Failed to cache chunk ${url}:`, err)
                        )
                    )
                );
            }),
            
            // Priority 3: Cache static assets (lowest priority)
            caches.open(CACHE_NAMES.static).then(cache => {
                
                return Promise.allSettled(
                    STATIC_RESOURCES.map(url => 
                        cache.add(url).catch(err => 
                            console.warn(`[SW-OPT] Failed to cache static ${url}:`, err)
                        )
                    )
                );
            })
        ]).then(() => {
            const installTime = performance.now() - startTime;
            metrics.criticalPathTime = installTime;
            }ms`);
            self.skipWaiting();
        })
    );
});

/**
 * Activate Event - Cache Optimization & Cleanup
 */
self.addEventListener('activate', (event) => {
    
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            cleanupOldCaches(),
            
            // Optimize cache sizes
            optimizeCacheSizes(),
            
            // Initialize performance monitoring
            initializeMetrics(),
            
            // Take control immediately
            self.clients.claim()
        ]).then(() => {
            
        })
    );
});

/**
 * Fetch Event - Intelligent Request Handling
 */
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome extensions
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    const startTime = performance.now();
    
    event.respondWith(
        handleRequest(request, startTime)
            .then(response => {
                recordMetrics(request, startTime, response);
                return response;
            })
            .catch(error => {
                console.error('[SW-OPT] Request failed:', error);
                return new Response('Offline', { status: 503 });
            })
    );
});

/**
 * Intelligent Request Handler
 */
async function handleRequest(request, startTime) {
    const url = new URL(request.url);
    const resourceType = getResourceType(url);
    const strategy = getStrategy(resourceType, url);
    
    metrics.networkRequests++;
    
    switch (strategy.strategy) {
        case 'cacheFirst':
            return handleCacheFirst(request, strategy, resourceType);
        
        case 'networkFirst':
            return handleNetworkFirst(request, strategy, resourceType);
        
        case 'staleWhileRevalidate':
            return handleStaleWhileRevalidate(request, strategy, resourceType);
        
        default:
            return fetch(request);
    }
}

/**
 * Cache First Strategy - Optimized for static assets
 */
async function handleCacheFirst(request, strategy, resourceType) {
    const cacheName = getCacheName(resourceType);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        metrics.cacheHits++;
        
        // Background update for chunks if needed
        if (resourceType === 'chunks') {
            updateChunkInBackground(request, cache);
        }
        
        return cachedResponse;
    }
    
    metrics.cacheMisses++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
        // Clone before caching
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
    }
    
    return networkResponse;
}

/**
 * Network First Strategy - For dynamic content
 */
async function handleNetworkFirst(request, strategy, resourceType) {
    const cacheName = getCacheName(resourceType);
    const cache = await caches.open(cacheName);
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('[SW-OPT] Network failed, falling back to cache:', error);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            metrics.cacheHits++;
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Stale While Revalidate - For API responses and chunks
 */
async function handleStaleWhileRevalidate(request, strategy, resourceType) {
    const cacheName = getCacheName(resourceType);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Update in background
    const networkUpdate = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(error => {
            console.warn('[SW-OPT] Background update failed:', error);
        });
    
    if (cachedResponse) {
        metrics.cacheHits++;
        // Fire and forget background update
        networkUpdate;
        return cachedResponse;
    }
    
    metrics.cacheMisses++;
    return networkUpdate;
}

/**
 * Background chunk update for performance
 */
async function updateChunkInBackground(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response.clone());
            metrics.chunkLoads++;
        }
    } catch (error) {
        console.warn('[SW-OPT] Background chunk update failed:', error);
    }
}

/**
 * Determine resource type for caching strategy
 */
function getResourceType(url) {
    const pathname = url.pathname.toLowerCase();
    
    // Critical path resources
    if (CRITICAL_RESOURCES.some(resource => pathname.includes(resource.replace('/cv', '')))) {
        return 'critical';
    }
    
    // Code chunks
    if (pathname.includes('/chunks/') || CHUNK_RESOURCES.some(chunk => pathname.includes(chunk.replace('/cv', '')))) {
        return 'chunks';
    }
    
    // API endpoints
    if (pathname.includes('/api/') || pathname.includes('github.com/api/') || pathname.endsWith('.json')) {
        return 'api';
    }
    
    // Images
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname)) {
        return 'images';
    }
    
    // CSS
    if (pathname.endsWith('.css')) {
        return 'static';
    }
    
    // JavaScript
    if (pathname.endsWith('.js')) {
        return 'static';
    }
    
    // HTML and dynamic content
    if (pathname.endsWith('.html') || pathname === '/' || pathname === '/cv/') {
        return 'dynamic';
    }
    
    return 'static';
}

/**
 * Get cache strategy based on resource type
 */
function getStrategy(resourceType, url) {
    return CACHE_STRATEGIES[resourceType] || CACHE_STRATEGIES.static;
}

/**
 * Get appropriate cache name
 */
function getCacheName(resourceType) {
    return CACHE_NAMES[resourceType] || CACHE_NAMES.static;
}

/**
 * Clean up old cache versions
 */
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const validCacheNames = Object.values(CACHE_NAMES);
    
    const deletePromises = cacheNames
        .filter(cacheName => !validCacheNames.includes(cacheName))
        .map(cacheName => {
            
            return caches.delete(cacheName);
        });
    
    await Promise.all(deletePromises);
    
}

/**
 * Optimize cache sizes to prevent memory issues
 */
async function optimizeCacheSizes() {
    for (const [resourceType, config] of Object.entries(CACHE_STRATEGIES)) {
        const cacheName = getCacheName(resourceType);
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length > config.maxEntries) {
            const excessCount = keys.length - config.maxEntries;
            const keysToDelete = keys.slice(0, excessCount);
            
            await Promise.all(keysToDelete.map(key => cache.delete(key)));
            
        }
    }
}

/**
 * Record performance metrics
 */
function recordMetrics(request, startTime, response) {
    const responseTime = performance.now() - startTime;
    metrics.responseTime.push(responseTime);
    
    // Keep only last 100 response times for memory efficiency
    if (metrics.responseTime.length > 100) {
        metrics.responseTime = metrics.responseTime.slice(-100);
    }
    
    // Calculate average response time
    metrics.averageResponseTime = metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length;
}

/**
 * Initialize performance monitoring
 */
function initializeMetrics() {
    // Reset metrics on activation
    metrics = {
        cacheHits: 0,
        cacheMisses: 0,
        networkRequests: 0,
        responseTime: [],
        chunkLoads: 0,
        criticalPathTime: metrics.criticalPathTime || 0,
        activatedAt: Date.now()
    };
    
    
}

/**
 * Background Sync for Analytics (when supported)
 */
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    self.addEventListener('sync', (event) => {
        if (event.tag === 'performance-sync') {
            event.waitUntil(syncPerformanceData());
        }
    });
}

/**
 * Sync performance data to analytics
 */
async function syncPerformanceData() {
    try {
        const performanceData = {
            ...metrics,
            timestamp: Date.now(),
            cacheVersion: CACHE_VERSION
        };
        
        // Send to analytics endpoint (implement as needed)
        
        
        // Could POST to /api/analytics/performance
        // await fetch('/api/analytics/performance', {
        //     method: 'POST',
        //     body: JSON.stringify(performanceData),
        //     headers: { 'Content-Type': 'application/json' }
        // });
        
    } catch (error) {
        console.error('[SW-OPT] Failed to sync performance data:', error);
    }
}

/**
 * Message handling for performance queries
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'GET_PERFORMANCE_METRICS':
            event.ports[0].postMessage({
                type: 'PERFORMANCE_METRICS',
                data: metrics
            });
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.keys().then(cacheNames => 
                    Promise.all(cacheNames.map(name => caches.delete(name)))
                ).then(() => {
                    event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
                })
            );
            break;
            
        case 'PRELOAD_CHUNKS':
            if (data && data.chunks) {
                event.waitUntil(preloadChunks(data.chunks));
            }
            break;
    }
});

/**
 * Preload specific chunks on demand
 */
async function preloadChunks(chunkUrls) {
    const cache = await caches.open(CACHE_NAMES.chunks);
    
    const preloadPromises = chunkUrls.map(async (url) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response.clone());
                
            }
        } catch (error) {
            console.warn(`[SW-OPT] Failed to preload chunk ${url}:`, error);
        }
    });
    
    await Promise.allSettled(preloadPromises);
    metrics.chunkLoads += chunkUrls.length;
}

