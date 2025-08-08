
/**
 * Performance Monitor - Lazy Loaded Chunk
 * Advanced performance tracking and optimization
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0,
            coreWebVitals: {}
        };
        
        this.init();
    }

    init() {
        
        
        this.setupPerformanceObserver();
        this.trackCoreWebVitals();
        this.startResourceMonitoring();
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Track layout shifts (CLS)
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                        this.metrics.coreWebVitals.cls = (this.metrics.coreWebVitals.cls || 0) + entry.value;
                    }
                }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }

    trackCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.coreWebVitals.lcp = lastEntry.startTime;
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // First Input Delay (FID)
        if ('PerformanceEventTiming' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-input') {
                        this.metrics.coreWebVitals.fid = entry.processingStart - entry.startTime;
                        break;
                    }
                }
            });
            
            observer.observe({ entryTypes: ['first-input'] });
        }
    }

    startResourceMonitoring() {
        // Monitor resource loading performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.transferSize > 50000) { // Log large resources
                        .toFixed(2)}KB)`);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            navigationTiming: performance.timing,
            resourceCount: performance.getEntriesByType('resource').length
        };
    }
}