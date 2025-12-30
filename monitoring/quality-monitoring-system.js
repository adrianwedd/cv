/**
 * Phase 2 Quality Monitoring System
 * Continuous assessment of Core Web Vitals, accessibility, performance
 * 
 * Integrates with:
 * - Existing Core Web Vitals tracker
 * - LangSmith telemetry (localhost:8080)
 * - CV site monitoring (localhost:8000)
 * 
 * Success Targets:
 * - Core Web Vitals >90 scores
 * - 100% accessibility compliance
 * - >95/100 quality score continuously
 * - Automated regression detection
 */

class QualityMonitoringSystem {
    constructor() {
        this.config = {
            targetScores: {
                coreWebVitals: 90,
                accessibility: 100,
                overallQuality: 95
            },
            monitoringInterval: 5000, // 5 seconds
            regressionThreshold: 10, // 10 point drop triggers alert
            apiEndpoints: {
                langsmith: 'http://localhost:8080',
                cvSite: 'http://localhost:8000'
            },
            alertWebhooks: []
        };

        this.metrics = {
            coreWebVitals: {
                lcp: { current: null, baseline: null, trend: [] },
                fid: { current: null, baseline: null, trend: [] },
                cls: { current: null, baseline: null, trend: [] },
                fcp: { current: null, baseline: null, trend: [] }
            },
            accessibility: {
                score: { current: null, baseline: null, trend: [] },
                violations: { current: [], trend: [] }
            },
            performance: {
                score: { current: null, baseline: null, trend: [] },
                resourceTiming: { current: {}, trend: [] }
            },
            userExperience: {
                interactions: { current: [], trend: [] },
                errors: { current: [], trend: [] },
                satisfaction: { current: null, trend: [] }
            },
            quality: {
                overallScore: { current: null, baseline: null, trend: [] },
                lastRegression: null,
                alertsTriggered: []
            }
        };

        this.observers = new Map();
        this.isMonitoring = false;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Phase 2 Quality Monitoring System');
        
        // Set up Core Web Vitals monitoring
        this.setupCoreWebVitalsMonitoring();
        
        // Set up accessibility monitoring
        this.setupAccessibilityMonitoring();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        // Set up user experience tracking
        this.setupUserExperienceTracking();
        
        // Set up regression detection
        this.setupRegressionDetection();
        
        // Initialize real-time dashboard
        this.setupRealTimeDashboard();
        
        // Start continuous monitoring
        this.startMonitoring();
        
        console.log('✅ Quality monitoring system initialized');
    }

    setupCoreWebVitalsMonitoring() {
        // Integrate with existing Core Web Vitals tracker
        if (window.coreWebVitalsTracker) {
            document.addEventListener('core-web-vitals-update', (event) => {
                const { name, value, timestamp } = event.detail;
                this.updateMetric('coreWebVitals', name, value, timestamp);
            });
        }

        // Additional Core Web Vitals monitoring
        this.setupPerformanceObserver();
    }

    setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) return;

        try {
            // Monitor navigation timing
            const navObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.analyzeNavigationTiming(entry);
                }
            });
            navObserver.observe({ entryTypes: ['navigation'] });

            // Monitor resource timing
            const resObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.analyzeResourceTiming(entry);
                }
            });
            resObserver.observe({ entryTypes: ['resource'] });

            // Monitor long tasks
            const taskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.analyzeLongTask(entry);
                }
            });
            taskObserver.observe({ entryTypes: ['longtask'] });

        } catch (error) {
            console.warn('Performance observer setup failed:', error);
        }
    }

    setupAccessibilityMonitoring() {
        // Continuous accessibility monitoring
        this.accessibilityChecker = setInterval(() => {
            this.runAccessibilityCheck();
        }, 30000); // Check every 30 seconds
    }

    async runAccessibilityCheck() {
        try {
            const violations = [];
            
            // Check for missing alt attributes
            const images = document.querySelectorAll('img:not([alt])');
            if (images.length > 0) {
                violations.push({
                    type: 'missing-alt-text',
                    count: images.length,
                    severity: 'major'
                });
            }

            // Check for proper heading hierarchy
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const headingViolations = this.checkHeadingHierarchy(headings);
            violations.push(...headingViolations);

            // Check for proper ARIA labels
            const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
            const ariaViolations = this.checkAriaLabels(interactiveElements);
            violations.push(...ariaViolations);

            // Check color contrast
            const contrastViolations = await this.checkColorContrast();
            violations.push(...contrastViolations);

            // Calculate accessibility score
            const score = this.calculateAccessibilityScore(violations);
            this.updateMetric('accessibility', 'score', score);
            this.updateMetric('accessibility', 'violations', violations);

        } catch (error) {
            console.error('Accessibility check failed:', error);
        }
    }

    checkHeadingHierarchy(headings) {
        const violations = [];
        let lastLevel = 0;

        for (const heading of headings) {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > lastLevel + 1) {
                violations.push({
                    type: 'heading-hierarchy-skip',
                    element: heading,
                    severity: 'minor'
                });
            }
            lastLevel = level;
        }

        return violations;
    }

    checkAriaLabels(elements) {
        const violations = [];

        for (const element of elements) {
            if (!element.getAttribute('aria-label') && 
                !element.getAttribute('aria-labelledby') && 
                !element.textContent.trim()) {
                violations.push({
                    type: 'missing-aria-label',
                    element: element,
                    severity: 'major'
                });
            }
        }

        return violations;
    }

    async checkColorContrast() {
        // Simplified color contrast check
        // In production, would use a more sophisticated algorithm
        return [];
    }

    calculateAccessibilityScore(violations) {
        let score = 100;
        
        for (const violation of violations) {
            switch (violation.severity) {
                case 'major':
                    score -= 10;
                    break;
                case 'minor':
                    score -= 5;
                    break;
                case 'critical':
                    score -= 20;
                    break;
            }
        }

        return Math.max(0, score);
    }

    setupPerformanceMonitoring() {
        // Monitor performance metrics
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 10000); // Every 10 seconds
    }

    collectPerformanceMetrics() {
        if (!performance.timing) return;

        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];

        const metrics = {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            firstByte: timing.responseStart - timing.navigationStart,
            domInteractive: timing.domInteractive - timing.navigationStart
        };

        if (navigation) {
            metrics.transferSize = navigation.transferSize;
            metrics.encodedBodySize = navigation.encodedBodySize;
            metrics.decodedBodySize = navigation.decodedBodySize;
        }

        // Calculate performance score
        const score = this.calculatePerformanceScore(metrics);
        this.updateMetric('performance', 'score', score);
        this.updateMetric('performance', 'resourceTiming', metrics);
    }

    calculatePerformanceScore(metrics) {
        let score = 100;

        // Penalize slow loading times
        if (metrics.loadComplete > 3000) score -= 20;
        if (metrics.loadComplete > 5000) score -= 30;
        
        if (metrics.firstByte > 600) score -= 15;
        if (metrics.firstByte > 1200) score -= 25;

        if (metrics.domContentLoaded > 1500) score -= 10;
        if (metrics.domContentLoaded > 2500) score -= 20;

        return Math.max(0, score);
    }

    setupUserExperienceTracking() {
        // Track user interactions
        this.trackUserInteractions();
        
        // Track JavaScript errors
        this.trackJavaScriptErrors();
        
        // Track user satisfaction indicators
        this.trackSatisfactionIndicators();
    }

    trackUserInteractions() {
        const events = ['click', 'scroll', 'keypress', 'touch'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.logUserInteraction({
                    type: eventType,
                    timestamp: Date.now(),
                    target: event.target.tagName.toLowerCase(),
                    position: { x: event.clientX, y: event.clientY }
                });
            });
        });
    }

    trackJavaScriptErrors() {
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'javascript-error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'promise-rejection',
                message: event.reason.message || 'Unhandled promise rejection',
                timestamp: Date.now()
            });
        });
    }

    trackSatisfactionIndicators() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logSatisfactionEvent('page-hidden');
            } else {
                this.logSatisfactionEvent('page-visible');
            }
        });

        // Track time on page
        this.startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - this.startTime;
            this.logSatisfactionEvent('page-unload', { timeOnPage });
        });
    }

    setupRegressionDetection() {
        // Check for quality regressions every minute
        setInterval(() => {
            this.detectQualityRegressions();
        }, 60000);
    }

    detectQualityRegressions() {
        const currentQuality = this.calculateOverallQuality();
        const baseline = this.metrics.quality.overallScore.baseline;

        if (baseline && currentQuality < baseline - this.config.regressionThreshold) {
            this.triggerRegressionAlert({
                type: 'quality-regression',
                currentScore: currentQuality,
                baselineScore: baseline,
                drop: baseline - currentQuality,
                timestamp: Date.now()
            });
        }

        // Update current score
        this.updateMetric('quality', 'overallScore', currentQuality);
    }

    calculateOverallQuality() {
        const weights = {
            coreWebVitals: 0.4,
            accessibility: 0.3,
            performance: 0.3
        };

        let totalScore = 0;
        let totalWeight = 0;

        // Core Web Vitals score
        const cwvScore = this.getCoreWebVitalsScore();
        if (cwvScore !== null) {
            totalScore += cwvScore * weights.coreWebVitals;
            totalWeight += weights.coreWebVitals;
        }

        // Accessibility score
        const a11yScore = this.metrics.accessibility.score.current;
        if (a11yScore !== null) {
            totalScore += a11yScore * weights.accessibility;
            totalWeight += weights.accessibility;
        }

        // Performance score
        const perfScore = this.metrics.performance.score.current;
        if (perfScore !== null) {
            totalScore += perfScore * weights.performance;
            totalWeight += weights.performance;
        }

        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;
    }

    getCoreWebVitalsScore() {
        const { lcp, fid, cls } = this.metrics.coreWebVitals;
        let score = 100;

        // LCP scoring (good < 2.5s, needs improvement < 4s)
        if (lcp.current) {
            if (lcp.current > 4000) score -= 30;
            else if (lcp.current > 2500) score -= 15;
        }

        // FID scoring (good < 100ms, needs improvement < 300ms)
        if (fid.current) {
            if (fid.current > 300) score -= 30;
            else if (fid.current > 100) score -= 15;
        }

        // CLS scoring (good < 0.1, needs improvement < 0.25)
        if (cls.current !== null) {
            if (cls.current > 0.25) score -= 30;
            else if (cls.current > 0.1) score -= 15;
        }

        return Math.max(0, score);
    }

    setupRealTimeDashboard() {
        // Create dashboard elements
        this.createDashboardUI();
        
        // Update dashboard every 2 seconds
        setInterval(() => {
            this.updateDashboard();
        }, 2000);
    }

    createDashboardUI() {
        // Check if dashboard already exists
        if (document.getElementById('quality-dashboard')) return;

        const dashboard = document.createElement('div');
        dashboard.id = 'quality-dashboard';
        dashboard.className = 'quality-dashboard';
        dashboard.innerHTML = `
            <div class="quality-dashboard-header">
                <h3>Quality Monitor</h3>
                <button id="toggle-dashboard" class="dashboard-toggle">−</button>
            </div>
            <div class="quality-metrics">
                <div class="metric-card">
                    <h4>Overall Quality</h4>
                    <div class="metric-value" id="overall-score">--</div>
                    <div class="metric-target">Target: ${this.config.targetScores.overallQuality}</div>
                </div>
                <div class="metric-card">
                    <h4>Core Web Vitals</h4>
                    <div class="metric-value" id="cwv-score">--</div>
                    <div class="metric-target">Target: ${this.config.targetScores.coreWebVitals}</div>
                </div>
                <div class="metric-card">
                    <h4>Accessibility</h4>
                    <div class="metric-value" id="a11y-score">--</div>
                    <div class="metric-target">Target: ${this.config.targetScores.accessibility}</div>
                </div>
                <div class="metric-card">
                    <h4>Performance</h4>
                    <div class="metric-value" id="perf-score">--</div>
                    <div class="metric-details">
                        <div>LCP: <span id="lcp-value">--</span></div>
                        <div>FID: <span id="fid-value">--</span></div>
                        <div>CLS: <span id="cls-value">--</span></div>
                    </div>
                </div>
            </div>
            <div class="quality-alerts" id="quality-alerts"></div>
        `;

        // Add styles
        this.addDashboardStyles();

        // Add to page
        document.body.appendChild(dashboard);

        // Add toggle functionality
        document.getElementById('toggle-dashboard').addEventListener('click', () => {
            dashboard.classList.toggle('minimized');
        });
    }

    addDashboardStyles() {
        if (document.getElementById('quality-dashboard-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'quality-dashboard-styles';
        styles.textContent = `
            .quality-dashboard {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(26, 26, 27, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 16px;
                min-width: 320px;
                font-family: Inter, sans-serif;
                font-size: 14px;
                color: #fff;
                backdrop-filter: blur(8px);
                z-index: 10000;
                transition: all 0.3s ease;
            }
            
            .quality-dashboard.minimized .quality-metrics,
            .quality-dashboard.minimized .quality-alerts {
                display: none;
            }
            
            .quality-dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .quality-dashboard h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #2563eb;
            }
            
            .dashboard-toggle {
                background: none;
                border: none;
                color: #a3a3a3;
                font-size: 18px;
                cursor: pointer;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .quality-metrics {
                display: grid;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .metric-card {
                background: rgba(37, 99, 235, 0.1);
                border: 1px solid rgba(37, 99, 235, 0.2);
                border-radius: 6px;
                padding: 12px;
            }
            
            .metric-card h4 {
                margin: 0 0 8px 0;
                font-size: 13px;
                font-weight: 500;
                color: #a3a3a3;
            }
            
            .metric-value {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            
            .metric-target {
                font-size: 11px;
                color: #a3a3a3;
            }
            
            .metric-details {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                margin-top: 8px;
                font-size: 11px;
            }
            
            .metric-details > div {
                text-align: center;
                padding: 4px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .quality-alerts {
                max-height: 120px;
                overflow-y: auto;
            }
            
            .alert-item {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 8px;
                font-size: 12px;
            }
            
            .alert-item:last-child {
                margin-bottom: 0;
            }
            
            .score-excellent { color: #10b981; }
            .score-good { color: #f59e0b; }
            .score-poor { color: #ef4444; }
        `;

        document.head.appendChild(styles);
    }

    updateDashboard() {
        // Update overall score
        const overallScore = this.metrics.quality.overallScore.current;
        const overallElement = document.getElementById('overall-score');
        if (overallElement && overallScore !== null) {
            overallElement.textContent = overallScore;
            overallElement.className = `metric-value ${this.getScoreClass(overallScore)}`;
        }

        // Update Core Web Vitals score
        const cwvScore = this.getCoreWebVitalsScore();
        const cwvElement = document.getElementById('cwv-score');
        if (cwvElement && cwvScore !== null) {
            cwvElement.textContent = cwvScore;
            cwvElement.className = `metric-value ${this.getScoreClass(cwvScore)}`;
        }

        // Update accessibility score
        const a11yScore = this.metrics.accessibility.score.current;
        const a11yElement = document.getElementById('a11y-score');
        if (a11yElement && a11yScore !== null) {
            a11yElement.textContent = a11yScore;
            a11yElement.className = `metric-value ${this.getScoreClass(a11yScore)}`;
        }

        // Update performance score
        const perfScore = this.metrics.performance.score.current;
        const perfElement = document.getElementById('perf-score');
        if (perfElement && perfScore !== null) {
            perfElement.textContent = perfScore;
            perfElement.className = `metric-value ${this.getScoreClass(perfScore)}`;
        }

        // Update Core Web Vitals details
        const lcpElement = document.getElementById('lcp-value');
        if (lcpElement && this.metrics.coreWebVitals.lcp.current) {
            lcpElement.textContent = Math.round(this.metrics.coreWebVitals.lcp.current) + 'ms';
        }

        const fidElement = document.getElementById('fid-value');
        if (fidElement && this.metrics.coreWebVitals.fid.current) {
            fidElement.textContent = Math.round(this.metrics.coreWebVitals.fid.current) + 'ms';
        }

        const clsElement = document.getElementById('cls-value');
        if (clsElement && this.metrics.coreWebVitals.cls.current !== null) {
            clsElement.textContent = this.metrics.coreWebVitals.cls.current.toFixed(3);
        }

        // Update alerts
        this.updateAlerts();
    }

    getScoreClass(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 70) return 'score-good';
        return 'score-poor';
    }

    updateAlerts() {
        const alertsContainer = document.getElementById('quality-alerts');
        if (!alertsContainer) return;

        const recentAlerts = this.metrics.quality.alertsTriggered.slice(-3);
        alertsContainer.innerHTML = recentAlerts.map(alert => `
            <div class="alert-item">
                <strong>${alert.type}:</strong> ${alert.message}
            </div>
        `).join('');
    }

    startMonitoring() {
        this.isMonitoring = true;
        console.log('📊 Quality monitoring started');
        
        // Establish baseline metrics
        setTimeout(() => {
            this.establishBaselines();
        }, 10000); // Wait 10 seconds for initial measurements
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        // Clear intervals
        if (this.accessibilityChecker) {
            clearInterval(this.accessibilityChecker);
        }
        
        console.log('⏹️ Quality monitoring stopped');
    }

    establishBaselines() {
        console.log('📊 Establishing quality baselines');
        
        // Set baselines for all metrics
        Object.keys(this.metrics).forEach(category => {
            Object.keys(this.metrics[category]).forEach(metric => {
                if (this.metrics[category][metric].current !== null) {
                    this.metrics[category][metric].baseline = this.metrics[category][metric].current;
                }
            });
        });

        console.log('✅ Quality baselines established');
    }

    // Utility methods
    updateMetric(category, name, value, timestamp = Date.now()) {
        if (!this.metrics[category] || !this.metrics[category][name]) return;

        const metric = this.metrics[category][name];
        metric.current = value;
        metric.trend.push({ value, timestamp });

        // Keep only last 100 data points
        if (metric.trend.length > 100) {
            metric.trend = metric.trend.slice(-100);
        }
    }

    logUserInteraction(interaction) {
        this.metrics.userExperience.interactions.current.push(interaction);
        this.metrics.userExperience.interactions.trend.push(interaction);

        // Keep only last 1000 interactions
        if (this.metrics.userExperience.interactions.current.length > 1000) {
            this.metrics.userExperience.interactions.current = 
                this.metrics.userExperience.interactions.current.slice(-1000);
        }
    }

    logError(error) {
        this.metrics.userExperience.errors.current.push(error);
        this.metrics.userExperience.errors.trend.push(error);

        // Keep only last 500 errors
        if (this.metrics.userExperience.errors.current.length > 500) {
            this.metrics.userExperience.errors.current = 
                this.metrics.userExperience.errors.current.slice(-500);
        }

        // Trigger alert for critical errors
        this.triggerErrorAlert(error);
    }

    logSatisfactionEvent(event, data = {}) {
        const satisfactionEvent = { event, ...data, timestamp: Date.now() };
        this.metrics.userExperience.satisfaction.trend.push(satisfactionEvent);
    }

    triggerRegressionAlert(alert) {
        console.warn('🚨 Quality regression detected:', alert);
        
        alert.message = `Quality dropped by ${alert.drop} points (${alert.currentScore}/${alert.baselineScore})`;
        this.metrics.quality.alertsTriggered.push(alert);
        
        // Send to external monitoring if configured
        this.sendToExternalMonitoring('regression', alert);
    }

    triggerErrorAlert(error) {
        if (error.type === 'javascript-error') {
            const alert = {
                type: 'javascript-error',
                message: `JS Error: ${error.message}`,
                timestamp: error.timestamp
            };
            
            this.metrics.quality.alertsTriggered.push(alert);
            this.sendToExternalMonitoring('error', alert);
        }
    }

    async sendToExternalMonitoring(type, data) {
        // Send to LangSmith if available
        try {
            await fetch(`${this.config.apiEndpoints.langsmith}/quality-alert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data, timestamp: Date.now() })
            });
        } catch (error) {
            // LangSmith not available, continue silently
        }

        // Send to configured webhooks
        for (const webhook of this.config.alertWebhooks) {
            try {
                await fetch(webhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data, timestamp: Date.now() })
                });
            } catch (error) {
                console.warn('Failed to send alert to webhook:', webhook, error);
            }
        }
    }

    // Utility methods for navigation and resource timing analysis
    analyzeNavigationTiming(entry) {
        const metrics = {
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            dom: entry.domInteractive - entry.responseEnd,
            load: entry.loadEventEnd - entry.loadEventStart
        };

        this.updateMetric('performance', 'navigationTiming', metrics);
    }

    analyzeResourceTiming(entry) {
        // Track resource loading performance
        const resourceMetrics = {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: this.getResourceType(entry.name)
        };

        // Update resource timing trends
        if (!this.metrics.performance.resourceTiming.current.resources) {
            this.metrics.performance.resourceTiming.current.resources = [];
        }

        this.metrics.performance.resourceTiming.current.resources.push(resourceMetrics);
    }

    analyzeLongTask(entry) {
        // Track tasks that block the main thread for >50ms
        if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration + 'ms');
            
            const alert = {
                type: 'long-task',
                message: `Long task blocked main thread for ${Math.round(entry.duration)}ms`,
                duration: entry.duration,
                timestamp: Date.now()
            };

            this.metrics.quality.alertsTriggered.push(alert);
        }
    }

    getResourceType(url) {
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'stylesheet';
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
        if (url.includes('.woff') || url.includes('.ttf')) return 'font';
        return 'other';
    }

    // Public API methods
    getMetrics() {
        return JSON.parse(JSON.stringify(this.metrics));
    }

    getMetric(category, name) {
        return this.metrics[category]?.[name]?.current || null;
    }

    setTargetScore(metric, score) {
        this.config.targetScores[metric] = score;
    }

    addAlertWebhook(url) {
        this.config.alertWebhooks.push(url);
    }

    generateReport() {
        const now = Date.now();
        const overallScore = this.calculateOverallQuality();
        
        return {
            timestamp: now,
            overallScore: overallScore,
            coreWebVitals: {
                score: this.getCoreWebVitalsScore(),
                lcp: this.metrics.coreWebVitals.lcp.current,
                fid: this.metrics.coreWebVitals.fid.current,
                cls: this.metrics.coreWebVitals.cls.current,
                fcp: this.metrics.coreWebVitals.fcp.current
            },
            accessibility: {
                score: this.metrics.accessibility.score.current,
                violationCount: this.metrics.accessibility.violations.current.length
            },
            performance: {
                score: this.metrics.performance.score.current,
                resourceCount: this.metrics.performance.resourceTiming.current.resources?.length || 0
            },
            userExperience: {
                interactionCount: this.metrics.userExperience.interactions.current.length,
                errorCount: this.metrics.userExperience.errors.current.length
            },
            alerts: this.metrics.quality.alertsTriggered.slice(-10) // Last 10 alerts
        };
    }
}

// Initialize and expose globally
window.qualityMonitoringSystem = new QualityMonitoringSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QualityMonitoringSystem;
}