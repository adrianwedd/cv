
/**
 * Resource Performance Monitor - Real-time Loading Analytics
 */

class ResourceMonitor {
    constructor() {
        this.metrics = {
            preloadHits: 0,
            preloadMisses: 0,
            totalLoadTime: 0,
            resourceCount: 0,
            cacheHitRate: 0
        };
        
        this.startTime = performance.now();
        this.init();
    }

    init() {
        this.observeResources();
        this.trackCacheHits();
        
        // Report metrics after initial load
        window.addEventListener('load', () => {
            setTimeout(() => this.reportMetrics(), 1000);
        });
    }

    observeResources() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.processResourceEntry(entry);
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    processResourceEntry(entry) {
        this.metrics.resourceCount++;
        this.metrics.totalLoadTime += entry.duration;
        
        // Check if resource was preloaded
        if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
            this.metrics.preloadHits++;
        } else if (entry.transferSize > 0) {
            this.metrics.preloadMisses++;
        }
    }

    trackCacheHits() {
        const originalFetch = window.fetch;
        const monitor = this;
        
        window.fetch = function(...args) {
            const startTime = performance.now();
            
            return originalFetch.apply(this, args).then(response => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Fast responses likely from cache
                if (duration < 50) {
                    monitor.metrics.cacheHitRate++;
                }
                
                return response;
            });
        };
    }

    reportMetrics() {
        const totalTime = performance.now() - this.startTime;
        const avgLoadTime = this.metrics.totalLoadTime / this.metrics.resourceCount || 0;
        
        
        
        
        
        
        }ms`);
        }ms`);
        
        // Calculate preload efficiency
        const totalPreloadAttempts = this.metrics.preloadHits + this.metrics.preloadMisses;
        if (totalPreloadAttempts > 0) {
            const efficiency = (this.metrics.preloadHits / totalPreloadAttempts * 100).toFixed(1);
            
        }
    }
}

// Initialize resource monitoring
new ResourceMonitor();
