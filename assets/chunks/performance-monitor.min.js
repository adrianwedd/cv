/**
 * Performance Monitor - Lazy Loaded Chunk
 * Advanced performance tracking and optimization
 */

(function(window) {
    'use strict';
    
    class PerformanceMonitor {
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
            console.log('📊 Initializing Performance Monitor...');
            
            this.setupPerformanceObserver();
            this.trackCoreWebVitals();
            this.startResourceMonitoring();
        }

        setupPerformanceObserver() {
            if ('PerformanceObserver' in window) {
                // Track layout shifts (CLS)
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                                this.metrics.coreWebVitals.cls = (this.metrics.coreWebVitals.cls || 0) + entry.value;
                            }
                        }
                    });
                    
                    observer.observe({ entryTypes: ['layout-shift'] });
                } catch (e) {
                    console.warn('Could not observe layout shifts:', e);
                }
            }
        }

        trackCoreWebVitals() {
            // Largest Contentful Paint (LCP)
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        this.metrics.coreWebVitals.lcp = lastEntry.startTime;
                    });
                    
                    observer.observe({ entryTypes: ['largest-contentful-paint'] });
                } catch (e) {
                    console.warn('Could not observe LCP:', e);
                }
            }
            
            // First Input Delay (FID)
            if ('PerformanceEventTiming' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.name === 'first-input') {
                                this.metrics.coreWebVitals.fid = entry.processingStart - entry.startTime;
                                break;
                            }
                        }
                    });
                    
                    observer.observe({ entryTypes: ['first-input'] });
                } catch (e) {
                    console.warn('Could not observe FID:', e);
                }
            }
        }

        startResourceMonitoring() {
            // Monitor resource loading performance
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.transferSize > 50000) { // Log large resources
                                console.log(`⚠️ Large resource: ${entry.name} (${(entry.transferSize / 1024).toFixed(2)}KB)`);
                            }
                        }
                    });
                    
                    observer.observe({ entryTypes: ['resource'] });
                } catch (e) {
                    console.warn('Could not observe resources:', e);
                }
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
    
    // Expose to global scope
    window.PerformanceMonitor = PerformanceMonitor;
    
})(window);