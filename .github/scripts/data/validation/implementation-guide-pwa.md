# Progressive Web App Implementation Guide

## Web App Manifest

### Create manifest.json
```json
{
  "name": "Adrian Wedd - Professional CV",
  "short_name": "Adrian CV",
  "description": "Professional CV and portfolio",
  "start_url": "/cv/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Link in HTML
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#2563eb">
```

## Service Worker

### Basic Implementation (sw.js)
```javascript
const CACHE_NAME = 'cv-cache-v1';
const urlsToCache = [
  '/cv/',
  '/cv/index.html',
  '/cv/assets/styles.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

### Register in HTML
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/cv/sw.js');
}
```

## PWA Checklist

- [ ] Web app manifest complete
- [ ] Service worker registered
- [ ] Offline functionality
- [ ] App icons (192px, 512px)
- [ ] Standalone display mode
- [ ] Theme color specified
