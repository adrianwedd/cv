/**
 * Core Web Vitals Performance Monitor
 * Advanced mobile performance monitoring and optimization
 */

class CoreWebVitalsMonitor {
    constructor() {
        this.metrics = {
            lcp: { value: 0, rating: 'unknown' },
            fid: { value: 0, rating: 'unknown' },
            cls: { value: 0, rating: 'unknown' },
            fcp: { value: 0, rating: 'unknown' },
            ttfb: { value: 0, rating: 'unknown' },
            inp: { value: 0, rating: 'unknown' }
        };
        
        this.thresholds = {
            lcp: { good: 2500, needsImprovement: 4000 },
            fid: { good: 100, needsImprovement: 300 },
            cls: { good: 0.1, needsImprovement: 0.25 },
            fcp: { good: 1800, needsImprovement: 3000 },
            ttfb: { good: 800, needsImprovement: 1800 },
            inp: { good: 200, needsImprovement: 500 }
        };
        
        this.observers = new Map();
        this.isMonitoring = false;
        this.reportQueue = [];
        this.sessionId = this.generateSessionId();
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Core Web Vitals Monitor');
        
        this.setupPerformanceObservers();
        this.setupNavigationTiming();
        this.setupResourceTiming();
        this.setupUserInteractionTracking();
        this.setupMobileSpecificMetrics();
        this.setupRealTimeReporting();
        
        this.startMonitoring();
        
        console.log('✅ Core Web Vitals monitoring active');
    }

    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) {
            console.warn('⚠️ PerformanceObserver not supported');
            return;
        }

        // Largest Contentful Paint (LCP)
        this.observeLCP();
        
        // First Input Delay (FID) / Interaction to Next Paint (INP)
        this.observeInteractionMetrics();
        
        // Cumulative Layout Shift (CLS)
        this.observeCLS();
        
        // First Contentful Paint (FCP)
        this.observeFCP();
        
        // Long Tasks
        this.observeLongTasks();
    }

    observeLCP() {
        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                this.updateMetric('lcp', lastEntry.startTime);
                this.analyzeLCPElement(lastEntry.element);
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('lcp', observer);
        } catch (error) {
            console.warn('⚠️ LCP observer setup failed:', error);
        }
    }

    observeInteractionMetrics() {
        try {
            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((entryList) => {
                const firstInput = entryList.getEntries()[0];
                if (firstInput) {
                    const fidValue = firstInput.processingStart - firstInput.startTime;
                    this.updateMetric('fid', fidValue);
                    this.analyzeInteraction(firstInput);
                }
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', fidObserver);
            
            // Interaction to Next Paint (INP) - newer metric
            if ('PerformanceEventTiming' in window) {
                const inpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        if (entry.duration > this.metrics.inp.value) {
                            this.updateMetric('inp', entry.duration);
                        }
                    });
                });
                
                inpObserver.observe({ entryTypes: ['event'] });
                this.observers.set('inp', inpObserver);
            }
        } catch (error) {
            console.warn('⚠️ Interaction metrics observer setup failed:', error);
        }
    }

    observeCLS() {
        try {
            let clsValue = 0;
            const observer = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.updateMetric('cls', clsValue);
                        this.analyzeLayoutShift(entry);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('cls', observer);
        } catch (error) {
            console.warn('⚠️ CLS observer setup failed:', error);
        }
    }

    observeFCP() {
        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
                if (fcpEntry) {
                    this.updateMetric('fcp', fcpEntry.startTime);
                }
            });
            
            observer.observe({ entryTypes: ['paint'] });
            this.observers.set('fcp', observer);
        } catch (error) {
            console.warn('⚠️ FCP observer setup failed:', error);
        }
    }

    observeLongTasks() {
        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.analyzeLongTask(entry);
                });
            });
            
            observer.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', observer);
        } catch (error) {
            console.warn('⚠️ Long task observer setup failed:', error);
        }
    }

    setupNavigationTiming() {
        if ('performance' in window && 'timing' in performance) {
            window.addEventListener('load', () => {
                const timing = performance.timing;
                const ttfb = timing.responseStart - timing.navigationStart;
                this.updateMetric('ttfb', ttfb);
                
                this.analyzeNavigationTiming(timing);
            });
        }
    }

    setupResourceTiming() {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.analyzeResourceTiming(entry);
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', observer);
        }
    }

    setupUserInteractionTracking() {
        // Track user interactions for INP calculation
        ['click', 'keydown', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackInteraction(event);
            }, { passive: true, capture: true });
        });
    }

    setupMobileSpecificMetrics() {
        // Mobile-specific performance metrics
        this.trackViewportStability();
        this.trackScrollPerformance();
        this.trackTouchResponseTime();
        this.trackNetworkEffectiveness();
    }

    trackViewportStability() {
        let lastViewportWidth = window.innerWidth;
        let lastViewportHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            
            // Track viewport changes that might affect layout
            if (Math.abs(newWidth - lastViewportWidth) > 50 || 
                Math.abs(newHeight - lastViewportHeight) > 100) {
                this.reportCustomMetric('viewport_instability', {
                    from: { width: lastViewportWidth, height: lastViewportHeight },
                    to: { width: newWidth, height: newHeight }
                });
            }
            
            lastViewportWidth = newWidth;
            lastViewportHeight = newHeight;
        });
    }

    trackScrollPerformance() {
        let lastScrollTime = 0;
        let scrollDurations = [];
        
        window.addEventListener('scroll', () => {
            const currentTime = performance.now();
            if (lastScrollTime > 0) {
                const duration = currentTime - lastScrollTime;
                scrollDurations.push(duration);
                
                // Keep only recent measurements
                if (scrollDurations.length > 100) {
                    scrollDurations = scrollDurations.slice(-50);
                }
                
                // Report if scroll is consistently slow
                const avgDuration = scrollDurations.reduce((a, b) => a + b, 0) / scrollDurations.length;
                if (avgDuration > 16.67) { // More than 1 frame at 60fps
                    this.reportCustomMetric('slow_scroll', avgDuration);
                }
            }
            lastScrollTime = currentTime;
        }, { passive: true });
    }

    trackTouchResponseTime() {
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', () => {
            touchStartTime = performance.now();
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            if (touchStartTime > 0) {
                const responseTime = performance.now() - touchStartTime;
                this.reportCustomMetric('touch_response_time', responseTime);
            }
        }, { passive: true });
    }

    trackNetworkEffectiveness() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            this.reportCustomMetric('network_info', {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            });
            
            connection.addEventListener('change', () => {
                this.reportCustomMetric('network_change', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt
                });
            });
        }
    }

    setupRealTimeReporting() {
        // Report metrics in real-time for monitoring
        this.reportingInterval = setInterval(() => {
            this.sendQueuedReports();
        }, 5000); // Report every 5 seconds
        
        // Report on page unload
        window.addEventListener('beforeunload', () => {
            this.sendFinalReport();
        });
        
        // Report on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.sendQueuedReports();
            }
        });
    }

    updateMetric(name, value) {
        const metric = this.metrics[name];
        if (!metric) return;
        
        metric.value = value;
        metric.rating = this.getRating(name, value);
        metric.timestamp = Date.now();
        
        console.log(`📊 ${name.toUpperCase()}: ${Math.round(value)}${this.getUnit(name)} (${metric.rating})`);
        
        this.queueReport(name, metric);
        this.triggerOptimizations(name, metric);
        this.updateDashboard(name, metric);
    }

    getRating(metricName, value) {
        const thresholds = this.thresholds[metricName];
        if (!thresholds) return 'unknown';
        
        if (value <= thresholds.good) return 'good';
        if (value <= thresholds.needsImprovement) return 'needs-improvement';
        return 'poor';
    }

    getUnit(metricName) {
        const units = {
            lcp: 'ms',
            fid: 'ms',
            cls: '',
            fcp: 'ms',
            ttfb: 'ms',
            inp: 'ms'
        };
        return units[metricName] || '';
    }

    analyzeLCPElement(element) {
        if (!element) return;
        
        const elementInfo = {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            src: element.src || element.currentSrc,
            dimensions: {
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        };
        
        this.reportCustomMetric('lcp_element_analysis', elementInfo);
        
        // Suggest optimizations for LCP element
        this.suggestLCPOptimizations(element);
    }

    suggestLCPOptimizations(element) {
        const suggestions = [];
        
        if (element.tagName === 'IMG') {
            if (!element.loading || element.loading !== 'eager') {
                suggestions.push('Set loading="eager" for LCP image');
            }
            if (!element.fetchPriority || element.fetchPriority !== 'high') {
                suggestions.push('Add fetchpriority="high" to LCP image');
            }
            if (!element.srcset) {
                suggestions.push('Add responsive srcset to LCP image');
            }
        }
        
        if (element.tagName === 'H1' || element.tagName === 'H2') {
            suggestions.push('Consider using web fonts with font-display: swap');
        }
        
        if (suggestions.length > 0) {
            console.log('💡 LCP Optimization Suggestions:', suggestions);
            this.reportCustomMetric('lcp_suggestions', suggestions);
        }
    }

    analyzeInteraction(entry) {
        const interactionInfo = {
            type: entry.name,
            target: entry.target?.tagName,
            duration: entry.duration,
            processingTime: entry.processingStart - entry.startTime,
            presentationDelay: entry.startTime - entry.timeStamp
        };
        
        this.reportCustomMetric('interaction_analysis', interactionInfo);
        
        if (interactionInfo.processingTime > 50) {
            console.warn('⚠️ Slow interaction processing:', interactionInfo);
        }
    }

    analyzeLayoutShift(entry) {
        const shiftInfo = {
            value: entry.value,
            sources: entry.sources?.map(source => ({
                element: source.node?.tagName,
                previousRect: source.previousRect,
                currentRect: source.currentRect
            }))
        };
        
        this.reportCustomMetric('layout_shift_analysis', shiftInfo);
        
        // Identify common CLS causes
        this.identifyCLSCauses(entry);
    }

    identifyCLSCauses(entry) {
        const causes = [];
        
        if (entry.sources) {
            entry.sources.forEach(source => {
                if (source.node) {
                    const element = source.node;
                    
                    if (element.tagName === 'IMG' && !element.width && !element.height) {
                        causes.push('Image without dimensions causing layout shift');
                    }
                    
                    if (element.classList.contains('ad') || element.dataset.ad) {
                        causes.push('Advertisement insertion causing layout shift');
                    }
                    
                    if (window.getComputedStyle(element).fontDisplay === 'auto') {
                        causes.push('Font loading causing layout shift');
                    }
                }
            });
        }
        
        if (causes.length > 0) {
            console.warn('⚠️ CLS Causes identified:', causes);
            this.reportCustomMetric('cls_causes', causes);
        }
    }

    analyzeLongTask(entry) {
        const taskInfo = {
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: entry.attribution?.map(attr => ({
                name: attr.name,
                entryType: attr.entryType,
                startTime: attr.startTime,
                duration: attr.duration
            }))
        };
        
        if (entry.duration > 50) {
            console.warn('⚠️ Long task detected:', taskInfo);
            this.reportCustomMetric('long_task', taskInfo);
            this.suggestTaskOptimizations(taskInfo);
        }
    }

    suggestTaskOptimizations(taskInfo) {
        const suggestions = [
            'Break long tasks into smaller chunks',
            'Use requestIdleCallback for non-critical work',
            'Consider using web workers for heavy computation',
            'Implement code splitting and lazy loading'
        ];
        
        console.log('💡 Long Task Optimization Suggestions:', suggestions);
        this.reportCustomMetric('task_optimization_suggestions', suggestions);
    }

    analyzeNavigationTiming(timing) {
        const metrics = {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            connect: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            processing: timing.loadEventStart - timing.domContentLoadedEventStart,
            load: timing.loadEventEnd - timing.loadEventStart
        };
        
        this.reportCustomMetric('navigation_timing', metrics);
        
        // Identify bottlenecks
        Object.entries(metrics).forEach(([phase, duration]) => {
            if (duration > 1000) { // More than 1 second
                console.warn(`⚠️ Slow ${phase} phase:`, duration + 'ms');
            }
        });
    }

    analyzeResourceTiming(entry) {
        const resourceInfo = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || entry.decodedBodySize,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
        };
        
        // Report slow resources
        if (resourceInfo.duration > 1000) {
            console.warn('⚠️ Slow resource:', resourceInfo);
            this.reportCustomMetric('slow_resource', resourceInfo);
        }
        
        // Report large resources
        if (resourceInfo.size > 100000) { // > 100KB
            console.warn('⚠️ Large resource:', resourceInfo);
            this.reportCustomMetric('large_resource', resourceInfo);
        }
    }

    getResourceType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        const typeMap = {
            'js': 'script',
            'css': 'stylesheet',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'webp': 'image',
            'svg': 'image',
            'woff': 'font',
            'woff2': 'font',
            'ttf': 'font',
            'otf': 'font'
        };
        return typeMap[extension] || 'other';
    }

    trackInteraction(event) {
        const interactionStart = performance.now();
        
        requestAnimationFrame(() => {
            const interactionDuration = performance.now() - interactionStart;
            
            if (interactionDuration > 16) { // Longer than 1 frame at 60fps
                this.reportCustomMetric('slow_interaction', {
                    type: event.type,
                    target: event.target.tagName,
                    duration: interactionDuration
                });
            }
        });
    }

    triggerOptimizations(metricName, metric) {
        if (metric.rating === 'poor') {
            switch (metricName) {
                case 'lcp':
                    this.optimizeLCP();
                    break;
                case 'fid':
                case 'inp':
                    this.optimizeInteractions();
                    break;
                case 'cls':
                    this.optimizeCLS();
                    break;
                case 'fcp':
                    this.optimizeFCP();
                    break;
            }
        }
    }

    optimizeLCP() {
        // Implement LCP optimizations
        console.log('🔧 Applying LCP optimizations');
        
        // Preload LCP image if not already done
        const lcpImages = document.querySelectorAll('img:not([rel="preload"])');
        lcpImages.forEach(img => {
            if (this.isLikelyLCPElement(img)) {
                this.preloadImage(img.src || img.currentSrc);
            }
        });
    }

    optimizeInteractions() {
        // Implement interaction optimizations
        console.log('🔧 Applying interaction optimizations');
        
        // Reduce main thread work
        this.deferNonCriticalScripts();
    }

    optimizeCLS() {
        // Implement CLS optimizations
        console.log('🔧 Applying CLS optimizations');
        
        // Add dimensions to images without them
        const undimensionedImages = document.querySelectorAll('img:not([width]):not([height])');
        undimensionedImages.forEach(img => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                img.width = img.naturalWidth;
                img.height = img.naturalHeight;
            }
        });
    }

    optimizeFCP() {
        // Implement FCP optimizations
        console.log('🔧 Applying FCP optimizations');
        
        // Inline critical CSS if not already done
        this.inlineCriticalCSS();
    }

    isLikelyLCPElement(img) {
        const rect = img.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Element is in viewport and reasonably large
        return rect.top < viewport.height && 
               rect.left < viewport.width && 
               rect.width * rect.height > viewport.width * viewport.height * 0.1;
    }

    preloadImage(src) {
        if (!src) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        link.fetchPriority = 'high';
        document.head.appendChild(link);
    }

    deferNonCriticalScripts() {
        const scripts = document.querySelectorAll('script:not([defer]):not([async])');
        scripts.forEach(script => {
            if (!this.isCriticalScript(script)) {
                script.defer = true;
            }
        });
    }

    isCriticalScript(script) {
        const criticalPatterns = [
            'critical',
            'inline',
            'polyfill',
            'modernizr'
        ];
        
        return criticalPatterns.some(pattern => 
            script.src.includes(pattern) || script.id.includes(pattern)
        );
    }

    inlineCriticalCSS() {
        // This would typically be done at build time
        console.log('💡 Consider inlining critical CSS at build time');
    }

    updateDashboard(metricName, metric) {
        // Update visual dashboard if it exists
        const dashboard = document.getElementById('performance-dashboard');
        if (dashboard) {
            this.renderMetricInDashboard(dashboard, metricName, metric);
        }
    }

    renderMetricInDashboard(dashboard, metricName, metric) {
        const metricElement = dashboard.querySelector(`[data-metric="${metricName}"]`) ||
                             this.createMetricElement(metricName);
        
        metricElement.querySelector('.metric-value').textContent = 
            Math.round(metric.value) + this.getUnit(metricName);
        metricElement.className = `metric-item metric-${metric.rating}`;
        
        if (!metricElement.parentNode) {
            dashboard.appendChild(metricElement);
        }
    }

    createMetricElement(metricName) {
        const element = document.createElement('div');
        element.className = 'metric-item';
        element.dataset.metric = metricName;
        element.innerHTML = `
            <div class="metric-name">${metricName.toUpperCase()}</div>
            <div class="metric-value">0</div>
        `;
        return element;
    }

    queueReport(metricName, metric) {
        this.reportQueue.push({
            metric: metricName,
            value: metric.value,
            rating: metric.rating,
            timestamp: metric.timestamp,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    }

    reportCustomMetric(name, data) {
        this.reportQueue.push({
            type: 'custom',
            metric: name,
            data: data,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href
        });
    }

    sendQueuedReports() {
        if (this.reportQueue.length === 0) return;
        
        const reports = [...this.reportQueue];
        this.reportQueue = [];
        
        // Send to analytics
        this.sendToAnalytics(reports);
        
        // Log to console for development
        console.log('📊 Sending performance reports:', reports);
    }

    sendToAnalytics(reports) {
        // Google Analytics 4
        if (window.gtag) {
            reports.forEach(report => {
                gtag('event', 'web_vitals', {
                    metric_name: report.metric,
                    metric_value: Math.round(report.value || 0),
                    metric_rating: report.rating,
                    session_id: report.sessionId
                });
            });
        }
        
        // Custom analytics endpoint
        if (this.analyticsEndpoint) {
            fetch(this.analyticsEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reports)
            }).catch(error => {
                console.warn('Failed to send analytics:', error);
            });
        }
    }

    sendFinalReport() {
        this.sendQueuedReports();
        
        // Send final session summary
        const summary = {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            metrics: this.metrics,
            url: window.location.href,
            timestamp: Date.now()
        };
        
        if (navigator.sendBeacon && this.analyticsEndpoint) {
            navigator.sendBeacon(this.analyticsEndpoint, JSON.stringify(summary));
        }
    }

    startMonitoring() {
        this.isMonitoring = true;
        this.startTime = Date.now();
        console.log('🏁 Core Web Vitals monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear intervals
        if (this.reportingInterval) {
            clearInterval(this.reportingInterval);
        }
        
        console.log('🛑 Core Web Vitals monitoring stopped');
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Public API
    getMetrics() {
        return { ...this.metrics };
    }

    getMetric(name) {
        return this.metrics[name] ? { ...this.metrics[name] } : null;
    }

    isGoodPerformance() {
        const criticalMetrics = ['lcp', 'fid', 'cls'];
        return criticalMetrics.every(metric => 
            this.metrics[metric].rating === 'good'
        );
    }

    getPerformanceScore() {
        const weights = { lcp: 0.25, fid: 0.25, cls: 0.25, fcp: 0.25 };
        let score = 0;
        let totalWeight = 0;
        
        Object.entries(weights).forEach(([metric, weight]) => {
            const metricData = this.metrics[metric];
            if (metricData && metricData.rating !== 'unknown') {
                const ratings = { good: 100, 'needs-improvement': 50, poor: 0 };
                score += ratings[metricData.rating] * weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
    }
}

// Initialize Core Web Vitals monitoring
document.addEventListener('DOMContentLoaded', () => {
    window.coreWebVitals = new CoreWebVitalsMonitor();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoreWebVitalsMonitor;
}