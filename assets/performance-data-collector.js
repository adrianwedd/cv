/**
 * Performance Data Collector - Comprehensive Metrics Gathering
 */

class PerformanceDataCollector {
    constructor() {
        this.data = {
            navigation: {},
            resources: [],
            marks: [],
            measures: []
        };
        
        this.init();
    }

    init() {
        this.collectNavigationTiming();
        this.collectResourceTiming();
        this.collectUserTiming();
        
        // Collect data periodically
        setInterval(() => {
            this.collectResourceTiming();
            this.collectUserTiming();
        }, 10000);
    }

    collectNavigationTiming() {
        if (!performance.timing) return;
        
        const timing = performance.timing;
        
        this.data.navigation = {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            ssl: timing.secureConnectionStart ? timing.connectEnd - timing.secureConnectionStart : 0,
            ttfb: timing.responseStart - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            load: timing.loadEventEnd - timing.navigationStart,
            redirect: timing.redirectEnd - timing.redirectStart
        };
    }

    collectResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        
        this.data.resources = resources.map(resource => ({
            name: resource.name,
            duration: resource.duration,
            transferSize: resource.transferSize || 0,
            type: this.getResourceType(resource.name),
            cached: resource.transferSize === 0 && resource.decodedBodySize > 0
        }));
    }

    collectUserTiming() {
        this.data.marks = performance.getEntriesByType('mark');
        this.data.measures = performance.getEntriesByType('measure');
    }

    getResourceType(url) {
        if (url.match(/\.(css)$/i)) return 'css';
        if (url.match(/\.(js|mjs)$/i)) return 'script';
        if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
        if (url.match(/\.(json)$/i)) return 'xhr';
        return 'other';
    }

    getData() {
        return { ...this.data };
    }

    getResourceStats() {
        const resources = this.data.resources;
        const stats = {
            total: resources.length,
            byType: {},
            totalSize: 0,
            cachedCount: 0
        };
        
        resources.forEach(resource => {
            // Count by type
            stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;
            
            // Total size
            stats.totalSize += resource.transferSize;
            
            // Cached resources
            if (resource.cached) stats.cachedCount++;
        });
        
        stats.cacheHitRate = (stats.cachedCount / stats.total * 100).toFixed(1);
        
        return stats;
    }
}

// Global collector instance
window.performanceDataCollector = new PerformanceDataCollector();