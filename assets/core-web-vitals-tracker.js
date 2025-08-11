/**
 * Core Web Vitals Tracker - Real-time Measurement
 * Tracks LCP, FID, CLS with high precision
 */

class CoreWebVitalsTracker {
    constructor() {
        this.metrics = {
            lcp: null,
            fid: null,
            cls: 0,
            fcp: null
        };
        
        this.observers = new Map();
        this.init();
    }

    init() {
        
        
        this.setupLCPObserver();
        this.setupFIDObserver();
        this.setupCLSObserver();
        this.setupFCPObserver();
        
        
    }

    setupLCPObserver() {
        if (!('PerformanceObserver' in window)) return;
        
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                this.metrics.lcp = lastEntry.startTime;
                this.dispatchUpdate('lcp', lastEntry.startTime);
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('lcp', observer);
            
        } catch (error) {
            console.warn('LCP observer failed:', error);
        }
    }

    setupFIDObserver() {
        if (!('PerformanceEventTiming' in window)) return;
        
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-input') {
                        const fid = entry.processingStart - entry.startTime;
                        this.metrics.fid = fid;
                        this.dispatchUpdate('fid', fid);
                        break;
                    }
                }
            });
            
            observer.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', observer);
            
        } catch (error) {
            console.warn('FID observer failed:', error);
        }
    }

    setupCLSObserver() {
        if (!('PerformanceObserver' in window)) return;
        
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        this.metrics.cls += entry.value;
                        this.dispatchUpdate('cls', this.metrics.cls);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('cls', observer);
            
        } catch (error) {
            console.warn('CLS observer failed:', error);
        }
    }

    setupFCPObserver() {
        if (!('PerformanceObserver' in window)) return;
        
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.fcp = entry.startTime;
                        this.dispatchUpdate('fcp', entry.startTime);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['paint'] });
            this.observers.set('fcp', observer);
            
        } catch (error) {
            console.warn('FCP observer failed:', error);
        }
    }

    dispatchUpdate(metricName, value) {
        const event = new CustomEvent('core-web-vitals-update', {
            detail: {
                name: metricName,
                value: value,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getMetric(name) {
        return this.metrics[name];
    }
}

// Global tracker instance
window.coreWebVitalsTracker = new CoreWebVitalsTracker();