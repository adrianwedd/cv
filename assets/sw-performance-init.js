/**
 * Service Worker and Performance Monitoring Initialization
 * Extracted from inline script to comply with CSP
 */

// Service worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/cv/sw.js')
        .then(r => console.log('SW registered'))
        .catch(() => {});
}

// Performance monitoring
if ('PerformanceObserver' in window) {
    new PerformanceObserver(l => 
        l.getEntries().forEach(e => 
            e.entryType === 'largest-contentful-paint' && 
            console.log(e.startTime + 'ms')
        )
    ).observe({entryTypes: ['largest-contentful-paint']});
}