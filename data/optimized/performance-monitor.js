/**
 * CV Performance Monitor
 * Tracks Core Web Vitals and custom performance metrics
 */
class CVPerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        this.trackCoreWebVitals();
        this.trackCustomMetrics();
        this.setupReporting();
    }

    trackCoreWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.fcp = entry.startTime;
                     + 'ms');
                }
            }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;
             + 'ms');
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    this.metrics.cls = (this.metrics.cls || 0) + entry.value;
                }
            }
            );
        }).observe({ entryTypes: ['layout-shift'] });
    }

    trackCustomMetrics() {
        // Track data loading times
        this.trackDataLoadTimes();
        
        // Track user interactions
        this.trackInteractionMetrics();
    }

    trackDataLoadTimes() {
        const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name.includes('chunks/')) {
                    const chunkName = entry.name.split('/').pop().replace('.json', '');
                    this.metrics[`chunk_${chunkName}`] = entry.duration;
                     + 'ms');
                }
            }
        });
        observer.observe({ entryTypes: ['resource'] });
    }

    trackInteractionMetrics() {
        // Track first interaction
        let firstInteraction = true;
        document.addEventListener('click', () => {
            if (firstInteraction) {
                this.metrics.first_interaction = performance.now();
                firstInteraction = false;
                 + 'ms');
            }
        });
    }

    setupReporting() {
        // Report metrics after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.reportMetrics();
            }, 5000); // Wait 5 seconds for all metrics
        });
    }

    reportMetrics() {
        const report = {
            timestamp: Date.now(),
            url: window.location.href,
            metrics: this.metrics,
            performance_grade: this.calculateGrade()
        };

        
        
        // Send to analytics (if configured)
        if (window.gtag) {
            window.gtag('event', 'performance_metrics', {
                custom_parameters: report
            });
        }
    }

    calculateGrade() {
        const { fcp, lcp, cls } = this.metrics;
        let grade = 100;

        if (fcp > 1500) grade -= 20; // Target: <1.5s
        if (lcp > 2500) grade -= 30; // Target: <2.5s  
        if (cls > 0.1) grade -= 25;  // Target: <0.1

        return Math.max(0, grade);
    }
}

// Initialize performance monitoring
new CVPerformanceMonitor();