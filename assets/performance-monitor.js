/**
 * Comprehensive Performance Monitor & Core Web Vitals Tracker
 * 
 * Enterprise-grade performance monitoring system designed for the stunning
 * dark mode CV frontend, providing real-time insights into Core Web Vitals,
 * custom performance metrics, and optimization opportunities.
 * 
 * Features:
 * - Core Web Vitals monitoring (FCP, LCP, CLS, FID, TTFB)
 * - Custom CV-specific performance metrics
 * - Real User Monitoring (RUM) with analytics integration
 * - Performance budgets and automated alerting
 * - A/B testing framework for optimizations
 * - Network and device capability tracking
 * - Automated performance regression detection
 * - Detailed performance reporting and visualization
 */

class CVPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.performanceBudget = this.initializePerformanceBudget();
        this.sessionId = this.generateSessionId();
        this.startTime = performance.now();
        
        this.config = {
            // Core Web Vitals thresholds (Google recommendations)
            thresholds: {
                FCP: { good: 1800, needsImprovement: 3000 },      // First Contentful Paint
                LCP: { good: 2500, needsImprovement: 4000 },      // Largest Contentful Paint
                CLS: { good: 0.1, needsImprovement: 0.25 },       // Cumulative Layout Shift
                FID: { good: 100, needsImprovement: 300 },        // First Input Delay
                TTFB: { good: 800, needsImprovement: 1800 }       // Time to First Byte
            },
            
            // Custom CV metrics thresholds
            customThresholds: {
                criticalDataLoad: { good: 1000, needsImprovement: 2000 },
                lazyChunkLoad: { good: 500, needsImprovement: 1000 },
                imageLoadTime: { good: 1000, needsImprovement: 2000 },
                interactionResponse: { good: 50, needsImprovement: 100 }
            },
            
            // Reporting configuration
            reporting: {
                batchSize: 10,
                batchTimeout: 30000,    // 30 seconds
                enableRealTimeReporting: true,
                enablePerformanceBudgetAlerts: true
            },
            
            // A/B testing configuration
            abTesting: {
                enabled: true,
                variants: ['control', 'optimized'],
                trafficSplit: 0.5
            }
        };

        this.init();
    }

    /**
     * Initialize performance monitoring system
     */
    init() {
        console.log('📊 **CV PERFORMANCE MONITOR INITIATED**');
        console.log(`🆔 Session ID: ${this.sessionId}`);
        console.log(`🎯 Monitoring Core Web Vitals + Custom CV Metrics`);
        
        // Initialize core monitoring systems
        this.initializeCoreWebVitalsMonitoring();
        this.initializeCustomMetricsMonitoring();
        this.initializeNetworkMonitoring();
        this.initializeUserInteractionMonitoring();
        this.initializeResourceTimingMonitoring();
        
        // Setup reporting and analytics
        this.initializeReporting();
        this.initializePerformanceBudgetMonitoring();
        
        // Setup A/B testing framework
        if (this.config.abTesting.enabled) {
            this.initializeABTesting();
        }
        
        // Start performance data collection
        this.startDataCollection();
        
        console.log('✅ Performance monitoring system initialized');
    }

    /**
     * Initialize Core Web Vitals monitoring
     */
    initializeCoreWebVitalsMonitoring() {
        console.log('⚡ Initializing Core Web Vitals monitoring...');

        // First Contentful Paint (FCP)
        this.observePaintMetrics();
        
        // Largest Contentful Paint (LCP)
        this.observeLargestContentfulPaint();
        
        // Cumulative Layout Shift (CLS)
        this.observeLayoutShift();
        
        // First Input Delay (FID) / Interaction to Next Paint (INP)
        this.observeInputDelay();
        
        // Time to First Byte (TTFB)
        this.measureTimeToFirstByte();
    }

    /**
     * Observe paint metrics (FCP, FMP)
     */
    observePaintMetrics() {
        if (!window.PerformanceObserver) return;

        const paintObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.recordMetric('FCP', entry.startTime, 'ms');
                    this.evaluateMetric('FCP', entry.startTime);
                    console.log(`🎨 FCP: ${entry.startTime.toFixed(2)}ms ${this.getPerformanceGrade('FCP', entry.startTime)}`);
                }
            }
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
    }

    /**
     * Observe Largest Contentful Paint
     */
    observeLargestContentfulPaint() {
        if (!window.PerformanceObserver) return;

        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.recordMetric('LCP', lastEntry.startTime, 'ms');
            this.evaluateMetric('LCP', lastEntry.startTime);
            
            // Identify LCP element for optimization opportunities
            this.identifyLCPElement(lastEntry);
            
            console.log(`🖼️ LCP: ${lastEntry.startTime.toFixed(2)}ms ${this.getPerformanceGrade('LCP', lastEntry.startTime)}`);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
    }

    /**
     * Observe Cumulative Layout Shift
     */
    observeLayoutShift() {
        if (!window.PerformanceObserver) return;

        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    
                    // Track individual layout shifts for debugging
                    this.recordLayoutShiftDetails(entry);
                }
            }
            
            this.recordMetric('CLS', clsValue, 'score');
            this.evaluateMetric('CLS', clsValue);
            console.log(`📐 CLS: ${clsValue.toFixed(4)} ${this.getPerformanceGrade('CLS', clsValue)}`);
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
    }

    /**
     * Observe First Input Delay and interactions
     */
    observeInputDelay() {
        if (!window.PerformanceObserver) return;

        // First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                const fid = entry.processingStart - entry.startTime;
                this.recordMetric('FID', fid, 'ms');
                this.evaluateMetric('FID', fid);
                console.log(`⚡ FID: ${fid.toFixed(2)}ms ${this.getPerformanceGrade('FID', fid)}`);
            }
        });
        
        try {
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', fidObserver);
        } catch (error) {
            console.warn('⚠️ FID observation not supported:', error.message);
        }

        // Interaction to Next Paint (modern alternative to FID)
        this.observeInteractionToNextPaint();
    }

    /**
     * Observe Interaction to Next Paint (INP)
     */
    observeInteractionToNextPaint() {
        let interactions = [];
        
        const eventObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.interactionId) {
                    interactions.push(entry);
                    
                    // Calculate interaction delay
                    const interactionDelay = entry.processingStart - entry.startTime;
                    this.recordMetric('interaction_delay', interactionDelay, 'ms');
                    
                    // Track specific interaction types
                    this.trackInteractionType(entry);
                }
            }
            
            // Calculate INP (98th percentile of interactions)
            if (interactions.length >= 10) {
                const inp = this.calculateINP(interactions);
                this.recordMetric('INP', inp, 'ms');
                console.log(`🎯 INP: ${inp.toFixed(2)}ms`);
            }
        });
        
        try {
            eventObserver.observe({ entryTypes: ['event'] });
            this.observers.set('interaction', eventObserver);
        } catch (error) {
            console.warn('⚠️ Event observation not supported:', error.message);
        }
    }

    /**
     * Measure Time to First Byte
     */
    measureTimeToFirstByte() {
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry) {
            const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
            this.recordMetric('TTFB', ttfb, 'ms');
            this.evaluateMetric('TTFB', ttfb);
            console.log(`⚡ TTFB: ${ttfb.toFixed(2)}ms ${this.getPerformanceGrade('TTFB', ttfb)}`);
        }
    }

    /**
     * Initialize custom CV-specific metrics monitoring
     */
    initializeCustomMetricsMonitoring() {
        console.log('🔧 Initializing custom CV metrics monitoring...');

        // Monitor lazy chunk loading performance
        this.monitorLazyChunkLoading();
        
        // Monitor critical data loading
        this.monitorCriticalDataLoading();
        
        // Monitor image loading performance
        this.monitorImageLoading();
        
        // Monitor navigation performance
        this.monitorNavigationPerformance();
        
        // Monitor mobile-specific metrics
        if (this.isMobileDevice()) {
            this.monitorMobileSpecificMetrics();
        }
    }

    /**
     * Monitor lazy chunk loading performance
     */
    monitorLazyChunkLoading() {
        // Override fetch for chunk loading monitoring
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0];
            
            if (typeof url === 'string' && url.includes('/chunks/')) {
                const chunkName = url.split('/').pop().replace('.json', '');
                const startTime = performance.now();
                
                try {
                    const response = await originalFetch(...args);
                    const loadTime = performance.now() - startTime;
                    
                    this.recordMetric(`chunk_load_${chunkName}`, loadTime, 'ms');
                    this.evaluateCustomMetric('lazyChunkLoad', loadTime);
                    
                    console.log(`📦 Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
                    
                    return response;
                } catch (error) {
                    this.recordMetric(`chunk_error_${chunkName}`, 1, 'count');
                    throw error;
                }
            }
            
            return originalFetch(...args);
        };
    }

    /**
     * Monitor critical data loading
     */
    monitorCriticalDataLoading() {
        const criticalLoadStart = performance.now();
        
        // Monitor when critical content is loaded
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            node.classList && node.classList.contains('critical-content')) {
                            
                            const criticalLoadTime = performance.now() - criticalLoadStart;
                            this.recordMetric('critical_data_load', criticalLoadTime, 'ms');
                            this.evaluateCustomMetric('criticalDataLoad', criticalLoadTime);
                            
                            console.log(`⚡ Critical data loaded in ${criticalLoadTime.toFixed(2)}ms`);
                            observer.disconnect();
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Monitor image loading performance
     */
    monitorImageLoading() {
        const images = document.querySelectorAll('img');
        
        images.forEach((img, index) => {
            const startTime = performance.now();
            
            const handleImageLoad = () => {
                const loadTime = performance.now() - startTime;
                this.recordMetric(`image_load_${index}`, loadTime, 'ms');
                this.evaluateCustomMetric('imageLoadTime', loadTime);
                
                // Remove event listeners
                img.removeEventListener('load', handleImageLoad);
                img.removeEventListener('error', handleImageError);
            };
            
            const handleImageError = () => {
                this.recordMetric(`image_error_${index}`, 1, 'count');
                img.removeEventListener('load', handleImageLoad);
                img.removeEventListener('error', handleImageError);
            };
            
            if (img.complete) {
                handleImageLoad();
            } else {
                img.addEventListener('load', handleImageLoad);
                img.addEventListener('error', handleImageError);
            }
        });
    }

    /**
     * Monitor navigation performance
     */
    monitorNavigationPerformance() {
        const navigationStart = performance.now();
        
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-section]');
            if (navLink) {
                const section = navLink.dataset.section;
                const navStartTime = performance.now();
                
                // Monitor navigation completion
                const checkNavigation = () => {
                    const targetElement = document.getElementById(section);
                    if (targetElement && targetElement.classList.contains('loaded')) {
                        const navTime = performance.now() - navStartTime;
                        this.recordMetric(`navigation_${section}`, navTime, 'ms');
                        console.log(`🧭 Navigation to ${section}: ${navTime.toFixed(2)}ms`);
                    } else {
                        setTimeout(checkNavigation, 100);
                    }
                };
                
                setTimeout(checkNavigation, 100);
            }
        });
    }

    /**
     * Monitor mobile-specific metrics
     */
    monitorMobileSpecificMetrics() {
        console.log('📱 Initializing mobile-specific metrics...');

        // Touch response time
        let touchStartTime = 0;
        document.addEventListener('touchstart', () => {
            touchStartTime = performance.now();
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (touchStartTime) {
                const touchResponseTime = performance.now() - touchStartTime;
                this.recordMetric('touch_response', touchResponseTime, 'ms');
            }
        }, { passive: true });

        // Viewport stability
        this.monitorViewportStability();
        
        // Battery impact (if available)
        this.monitorBatteryImpact();
    }

    /**
     * Initialize network monitoring
     */
    initializeNetworkMonitoring() {
        console.log('🌐 Initializing network monitoring...');

        // Monitor connection changes
        if (navigator.connection) {
            const connection = navigator.connection;
            
            this.recordMetric('network_type', connection.effectiveType, 'string');
            this.recordMetric('network_downlink', connection.downlink, 'mbps');
            this.recordMetric('network_rtt', connection.rtt, 'ms');
            
            connection.addEventListener('change', () => {
                this.recordMetric('network_change', {
                    type: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    timestamp: performance.now()
                }, 'object');
                
                console.log(`📶 Network changed: ${connection.effectiveType}`);
            });
        }

        // Monitor resource loading over network
        this.monitorResourceTiming();
    }

    /**
     * Monitor resource timing for network performance insights
     */
    monitorResourceTiming() {
        const resourceObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name.includes('.json') || entry.name.includes('.js') || entry.name.includes('.css')) {
                    const resourceData = {
                        name: entry.name.split('/').pop(),
                        duration: entry.duration,
                        transferSize: entry.transferSize,
                        encodedBodySize: entry.encodedBodySize,
                        decodedBodySize: entry.decodedBodySize,
                        compressionRatio: entry.encodedBodySize > 0 ? 
                            (1 - entry.transferSize / entry.encodedBodySize) * 100 : 0
                    };
                    
                    this.recordMetric(`resource_${resourceData.name}`, resourceData, 'object');
                }
            }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
    }

    /**
     * Initialize performance budget monitoring
     */
    initializePerformanceBudgetMonitoring() {
        console.log('💰 Initializing performance budget monitoring...');

        setInterval(() => {
            this.checkPerformanceBudgets();
        }, 10000); // Check every 10 seconds
    }

    /**
     * Check performance budgets and alert on violations
     */
    checkPerformanceBudgets() {
        const budgetViolations = [];

        // Check Core Web Vitals budgets
        Object.keys(this.config.thresholds).forEach(metric => {
            const value = this.getMetricValue(metric);
            if (value !== null) {
                const threshold = this.config.thresholds[metric];
                if (value > threshold.needsImprovement) {
                    budgetViolations.push({
                        metric,
                        value,
                        threshold: threshold.needsImprovement,
                        severity: 'high'
                    });
                } else if (value > threshold.good) {
                    budgetViolations.push({
                        metric,
                        value,
                        threshold: threshold.good,
                        severity: 'medium'
                    });
                }
            }
        });

        // Check custom metrics budgets
        Object.keys(this.config.customThresholds).forEach(metric => {
            const value = this.getMetricValue(metric);
            if (value !== null) {
                const threshold = this.config.customThresholds[metric];
                if (value > threshold.needsImprovement) {
                    budgetViolations.push({
                        metric,
                        value,
                        threshold: threshold.needsImprovement,
                        severity: 'high'
                    });
                }
            }
        });

        if (budgetViolations.length > 0) {
            this.reportBudgetViolations(budgetViolations);
        }
    }

    /**
     * Initialize A/B testing framework
     */
    initializeABTesting() {
        const variant = Math.random() < this.config.abTesting.trafficSplit ? 
            this.config.abTesting.variants[1] : this.config.abTesting.variants[0];
        
        this.recordMetric('ab_test_variant', variant, 'string');
        document.body.dataset.abVariant = variant;
        
        console.log(`🧪 A/B Test Variant: ${variant}`);
    }

    /**
     * Initialize reporting system
     */
    initializeReporting() {
        console.log('📊 Initializing reporting system...');

        this.reportingBatch = [];
        this.lastReportTime = performance.now();

        // Batch reporting to avoid performance impact
        setInterval(() => {
            this.sendBatchedReport();
        }, this.config.reporting.batchTimeout);

        // Send report on page unload
        window.addEventListener('beforeunload', () => {
            this.sendFinalReport();
        });

        // Send report on visibility change (page backgrounded)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendBatchedReport();
            }
        });
    }

    /**
     * Start continuous data collection
     */
    startDataCollection() {
        console.log('🔄 Starting continuous data collection...');

        // Collect memory usage if available
        if (performance.memory) {
            setInterval(() => {
                this.recordMetric('memory_used', performance.memory.usedJSHeapSize, 'bytes');
                this.recordMetric('memory_total', performance.memory.totalJSHeapSize, 'bytes');
                this.recordMetric('memory_limit', performance.memory.jsHeapSizeLimit, 'bytes');
            }, 5000);
        }

        // Collect timing metrics
        setInterval(() => {
            this.recordMetric('session_duration', performance.now() - this.startTime, 'ms');
        }, 1000);
    }

    // Utility methods
    recordMetric(name, value, unit = '') {
        const timestamp = performance.now();
        const metric = {
            name,
            value,
            unit,
            timestamp,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        this.metrics.set(name, metric);
        
        // Add to reporting batch
        if (this.config.reporting.enableRealTimeReporting) {
            this.addToReportingBatch(metric);
        }
    }

    getMetricValue(name) {
        const metric = this.metrics.get(name);
        return metric ? metric.value : null;
    }

    evaluateMetric(metricName, value) {
        const threshold = this.config.thresholds[metricName];
        if (!threshold) return 'unknown';

        if (value <= threshold.good) return 'good';
        if (value <= threshold.needsImprovement) return 'needs-improvement';
        return 'poor';
    }

    evaluateCustomMetric(metricName, value) {
        const threshold = this.config.customThresholds[metricName];
        if (!threshold) return 'unknown';

        if (value <= threshold.good) return 'good';
        if (value <= threshold.needsImprovement) return 'needs-improvement';
        return 'poor';
    }

    getPerformanceGrade(metricName, value) {
        const grade = this.evaluateMetric(metricName, value);
        const gradeEmojis = {
            good: '✅',
            'needs-improvement': '⚠️',
            poor: '❌',
            unknown: '❓'
        };
        return gradeEmojis[grade];
    }

    generateSessionId() {
        return 'cv_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    initializePerformanceBudget() {
        return {
            FCP: 1800,
            LCP: 2500,
            CLS: 0.1,
            FID: 100,
            TTFB: 800,
            totalPageSize: 500000, // 500KB
            imageLoadTime: 1000,
            scriptExecutionTime: 50
        };
    }

    // Advanced monitoring methods
    identifyLCPElement(entry) {
        if (entry.element) {
            this.recordMetric('lcp_element', {
                tagName: entry.element.tagName,
                id: entry.element.id,
                className: entry.element.className,
                src: entry.element.src || entry.element.currentSrc
            }, 'object');
        }
    }

    recordLayoutShiftDetails(entry) {
        this.recordMetric('layout_shift_detail', {
            value: entry.value,
            sources: entry.sources?.map(source => ({
                node: source.node?.tagName,
                previousRect: source.previousRect,
                currentRect: source.currentRect
            }))
        }, 'object');
    }

    trackInteractionType(entry) {
        this.recordMetric(`interaction_${entry.name}`, entry.duration, 'ms');
    }

    calculateINP(interactions) {
        const sorted = interactions.map(i => i.duration).sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.98);
        return sorted[index] || 0;
    }

    monitorViewportStability() {
        let lastViewportChange = 0;
        let viewportChanges = 0;

        window.addEventListener('resize', () => {
            const now = performance.now();
            if (now - lastViewportChange > 100) {
                viewportChanges++;
                this.recordMetric('viewport_changes', viewportChanges, 'count');
            }
            lastViewportChange = now;
        });
    }

    monitorBatteryImpact() {
        if (!navigator.getBattery) return;

        navigator.getBattery().then(battery => {
            this.recordMetric('battery_level', battery.level, 'percentage');
            this.recordMetric('battery_charging', battery.charging, 'boolean');

            battery.addEventListener('levelchange', () => {
                this.recordMetric('battery_level', battery.level, 'percentage');
            });
        });
    }

    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    addToReportingBatch(metric) {
        this.reportingBatch.push(metric);
        
        if (this.reportingBatch.length >= this.config.reporting.batchSize) {
            this.sendBatchedReport();
        }
    }

    sendBatchedReport() {
        if (this.reportingBatch.length === 0) return;

        const report = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            metrics: [...this.reportingBatch],
            deviceInfo: this.getDeviceInfo(),
            performanceSummary: this.generatePerformanceSummary()
        };

        // Send to analytics endpoint (implement based on your analytics service)
        this.sendToAnalytics(report);
        
        // Clear batch
        this.reportingBatch = [];
    }

    sendFinalReport() {
        // Send final batch
        this.sendBatchedReport();
        
        // Send session summary
        const sessionSummary = {
            sessionId: this.sessionId,
            duration: performance.now() - this.startTime,
            finalMetrics: Object.fromEntries(this.metrics),
            performanceGrade: this.calculateOverallPerformanceGrade()
        };

        navigator.sendBeacon('/analytics/session-end', JSON.stringify(sessionSummary));
    }

    sendToAnalytics(report) {
        // Implementation depends on your analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metrics', {
                custom_parameter: report
            });
        }

        // Or send to custom analytics endpoint
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/analytics/performance', JSON.stringify(report));
        }
        
        console.log('📊 Performance report sent:', report);
    }

    reportBudgetViolations(violations) {
        console.warn('💰 Performance Budget Violations:', violations);
        
        violations.forEach(violation => {
            const emoji = violation.severity === 'high' ? '🚨' : '⚠️';
            console.warn(`${emoji} ${violation.metric}: ${violation.value} > ${violation.threshold}`);
        });

        // Send alert to monitoring service
        this.sendToAnalytics({
            type: 'budget_violation',
            violations,
            timestamp: Date.now(),
            sessionId: this.sessionId
        });
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    generatePerformanceSummary() {
        const coreMetrics = ['FCP', 'LCP', 'CLS', 'FID', 'TTFB'];
        const summary = {};

        coreMetrics.forEach(metric => {
            const value = this.getMetricValue(metric);
            if (value !== null) {
                summary[metric] = {
                    value,
                    grade: this.evaluateMetric(metric, value)
                };
            }
        });

        return summary;
    }

    calculateOverallPerformanceGrade() {
        const grades = Object.values(this.generatePerformanceSummary()).map(m => m.grade);
        const gradeScores = { good: 3, 'needs-improvement': 2, poor: 1, unknown: 0 };
        
        const avgScore = grades.reduce((sum, grade) => sum + gradeScores[grade], 0) / grades.length;
        
        if (avgScore >= 2.5) return 'good';
        if (avgScore >= 1.5) return 'needs-improvement';
        return 'poor';
    }

    // Public API methods
    getPerformanceReport() {
        return {
            sessionId: this.sessionId,
            metrics: Object.fromEntries(this.metrics),
            summary: this.generatePerformanceSummary(),
            overallGrade: this.calculateOverallPerformanceGrade(),
            deviceInfo: this.getDeviceInfo()
        };
    }

    forceReport() {
        this.sendBatchedReport();
    }

    logPerformanceSummary() {
        const summary = this.generatePerformanceSummary();
        console.log('📊 **PERFORMANCE SUMMARY**');
        Object.entries(summary).forEach(([metric, data]) => {
            console.log(`  ${metric}: ${data.value.toFixed(2)}ms ${this.getPerformanceGrade(metric, data.value)}`);
        });
        console.log(`  Overall Grade: ${this.calculateOverallPerformanceGrade()}`);
    }
}

// Initialize performance monitoring
let cvPerformanceMonitor;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cvPerformanceMonitor = new CVPerformanceMonitor();
    });
} else {
    cvPerformanceMonitor = new CVPerformanceMonitor();
}

// Export for module usage and global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CVPerformanceMonitor;
}

// Global access for debugging
window.cvPerformanceMonitor = cvPerformanceMonitor;