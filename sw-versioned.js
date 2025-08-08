
// Cache-Busting Service Worker
// Generated: 2025-08-08T17:01:42.460Z
// Asset Version: 1.0.0

const CACHE_NAME = 'cv-assets-v1.0.0';
const ASSET_MANIFEST = {
  "version": "1.0.0",
  "generated": "2025-08-08T17:01:42.459Z",
  "assets": {
    "script-consolidated.js": {
      "versioned": "script-consolidated-016a9c50.js",
      "hash": "016a9c50",
      "size": 837841,
      "lastModified": "2025-08-08T17:00:45.111Z",
      "path": "/assets/versioned/script-consolidated-016a9c50.js"
    },
    "script-consolidated.min.js": {
      "versioned": "script-consolidated.min-af56f0f8.js",
      "hash": "af56f0f8",
      "size": 503177,
      "lastModified": "2025-08-08T17:00:45.121Z",
      "path": "/assets/versioned/script-consolidated.min-af56f0f8.js"
    },
    "styles-consolidated.css": {
      "versioned": "styles-consolidated-3d2a55d6.css",
      "hash": "3d2a55d6",
      "size": 301769,
      "lastModified": "2025-08-08T17:00:45.106Z",
      "path": "/assets/versioned/styles-consolidated-3d2a55d6.css"
    },
    "styles-consolidated.min.css": {
      "versioned": "styles-consolidated.min-c4fc059a.css",
      "hash": "c4fc059a",
      "size": 244355,
      "lastModified": "2025-08-08T17:00:45.125Z",
      "path": "/assets/versioned/styles-consolidated.min-c4fc059a.css"
    }
  },
  "integrity": {
    "script-consolidated-016a9c50.js": "sha256-016a9c509cebaaa54bc4d1afe9e67138095d57dc25747a147dbffa7312c4c7e5",
    "script-consolidated.min-af56f0f8.js": "sha256-af56f0f8783e00ed059719a7774f305196b5f20409408ebf35eb61381dc5bfde",
    "styles-consolidated-3d2a55d6.css": "sha256-3d2a55d65a0331b5498b6c00031d1fb8749d390a0fd45491727ca425cf1af3d1",
    "styles-consolidated.min-c4fc059a.css": "sha256-c4fc059a7e8b8eed1aafc966762e87456f61f3f88096458cb46ba4b1d21783ea"
  },
  "cacheBusting": {
    "strategy": "hash-based",
    "maxAge": 31536000,
    "immutable": true
  }
};

// Assets to cache with versioning
const VERSIONED_ASSETS = [
  '/assets/versioned/script-consolidated-016a9c50.js',
  '/assets/versioned/script-consolidated.min-af56f0f8.js',
  '/assets/versioned/styles-consolidated-3d2a55d6.css',
  '/assets/versioned/styles-consolidated.min-c4fc059a.css'
];

// Install event - cache versioned assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        
        return cache.addAll(VERSIONED_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('cv-assets-') && cacheName !== CACHE_NAME)
            .map(cacheName => {
              
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve cached assets with cache busting
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle versioned assets
  if (url.pathname.includes('/assets/versioned/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            // Add immutable cache headers
            const headers = new Headers(response.headers);
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: headers
            });
          }
          
          // If not in cache, fetch with cache-busting headers
          return fetch(event.request, {
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
        })
    );
  }
  
  // Handle non-versioned assets with cache busting
  else if (url.pathname.includes('/assets/')) {
    event.respondWith(
      fetch(event.request, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
    );
  }
});

// Message event for manual cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_ASSETS') {
    // Force update of cached assets
    caches.delete(CACHE_NAME)
      .then(() => {
        return caches.open(CACHE_NAME);
      })
      .then(cache => {
        return cache.addAll(VERSIONED_ASSETS);
      });
  }
});
