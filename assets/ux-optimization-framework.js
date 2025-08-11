/**
 * UX Optimization Framework - Advanced A/B Testing & User Analytics System
 * 
 * Comprehensive system for user experience optimization including:
 * - A/B Testing Framework with statistical significance
 * - User Journey Analytics and Conversion Tracking
 * - Real-time Engagement Metrics
 * - Personalization Engine
 * - Advanced User Feedback Systems
 */

/**
 * A/B Testing Framework with Statistical Analysis
 */
class ABTestingFramework {
    constructor() {
        this.tests = new Map();
        this.userAssignments = new Map();
        this.analyticsEndpoint = '/api/ab-analytics';
        this.storageKey = 'ux_ab_tests';
        this.sessionId = this.generateSessionId();
        
        this.init();
    }

    init() {
        this.loadStoredAssignments();
        this.setupDefaultTests();
        this.startAnalyticsCollection();
        
        console.log('🧪 A/B Testing Framework initialized');
    }

    /**
     * Define A/B test configuration
     */
    setupDefaultTests() {
        // Test 1: Header Layout Optimization
        this.createTest('header-layout', {
            name: 'Header Layout Optimization',
            variants: {
                'control': { weight: 50, name: 'Current Layout' },
                'compact': { weight: 25, name: 'Compact Header' },
                'expanded': { weight: 25, name: 'Expanded Stats' }
            },
            metrics: ['engagement_time', 'scroll_depth', 'contact_clicks'],
            hypothesis: 'Compact header increases engagement by reducing visual clutter'
        });

        // Test 2: Call-to-Action Button Optimization
        this.createTest('cta-optimization', {
            name: 'CTA Button Optimization',
            variants: {
                'control': { weight: 33, name: 'Default CTAs' },
                'highlighted': { weight: 33, name: 'Highlighted CTAs' },
                'minimal': { weight: 34, name: 'Minimal CTAs' }
            },
            metrics: ['contact_conversion', 'download_rate', 'external_clicks'],
            hypothesis: 'Highlighted CTAs improve conversion rates by 15%'
        });

        // Test 3: Navigation Experience
        this.createTest('navigation-style', {
            name: 'Navigation Experience',
            variants: {
                'control': { weight: 50, name: 'Tab Navigation' },
                'sidebar': { weight: 50, name: 'Sidebar Navigation' }
            },
            metrics: ['section_views', 'session_duration', 'bounce_rate'],
            hypothesis: 'Sidebar navigation improves content discovery'
        });

        // Test 4: Content Loading Strategy
        this.createTest('loading-strategy', {
            name: 'Content Loading Strategy',
            variants: {
                'control': { weight: 50, name: 'Standard Loading' },
                'progressive': { weight: 50, name: 'Progressive Enhancement' }
            },
            metrics: ['first_contentful_paint', 'time_to_interactive', 'user_satisfaction'],
            hypothesis: 'Progressive loading improves perceived performance'
        });
    }

    /**
     * Create new A/B test
     */
    createTest(testId, config) {
        this.tests.set(testId, {
            ...config,
            id: testId,
            startDate: new Date().toISOString(),
            status: 'active',
            results: {
                participants: 0,
                conversions: new Map(),
                metrics: new Map()
            }
        });

        console.log(`🔬 Created A/B test: ${config.name}`);
    }

    /**
     * Get user's variant for a test
     */
    getVariant(testId) {
        // Check if user already assigned
        if (this.userAssignments.has(testId)) {
            return this.userAssignments.get(testId);
        }

        const test = this.tests.get(testId);
        if (!test || test.status !== 'active') {
            return 'control';
        }

        // Assign variant based on weights
        const variant = this.assignVariant(test.variants);
        this.userAssignments.set(testId, variant);
        this.saveAssignments();

        // Track assignment
        this.trackEvent('ab_test_assignment', {
            testId,
            variant,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });

        return variant;
    }

    /**
     * Assign variant based on weighted distribution
     */
    assignVariant(variants) {
        const random = Math.random() * 100;
        let cumulative = 0;

        for (const [variantId, config] of Object.entries(variants)) {
            cumulative += config.weight;
            if (random <= cumulative) {
                return variantId;
            }
        }

        return 'control';
    }

    /**
     * Track conversion for a test
     */
    trackConversion(testId, metricName, value = 1) {
        const variant = this.userAssignments.get(testId);
        if (!variant) return;

        const test = this.tests.get(testId);
        if (!test) return;

        this.trackEvent('ab_test_conversion', {
            testId,
            variant,
            metricName,
            value,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });

        // Update local results
        if (!test.results.conversions.has(variant)) {
            test.results.conversions.set(variant, new Map());
        }
        
        const variantConversions = test.results.conversions.get(variant);
        const currentValue = variantConversions.get(metricName) || 0;
        variantConversions.set(metricName, currentValue + value);

        console.log(`📊 Conversion tracked: ${testId}/${variant}/${metricName} = ${value}`);
    }

    /**
     * Calculate statistical significance
     */
    calculateSignificance(testId) {
        const test = this.tests.get(testId);
        if (!test) return null;

        const results = {};
        
        for (const metric of test.metrics) {
            const variantData = {};
            
            for (const [variant, conversions] of test.results.conversions) {
                const conversionValue = conversions.get(metric) || 0;
                const participants = this.getParticipantCount(testId, variant);
                
                variantData[variant] = {
                    conversions: conversionValue,
                    participants,
                    rate: participants > 0 ? conversionValue / participants : 0
                };
            }

            results[metric] = this.performTTest(variantData);
        }

        return results;
    }

    /**
     * Perform basic t-test for statistical significance
     */
    performTTest(variantData) {
        const variants = Object.keys(variantData);
        if (variants.length < 2) return null;

        const control = variantData[variants[0]];
        const variant = variantData[variants[1]];

        if (!control || !variant || control.participants < 30 || variant.participants < 30) {
            return { significant: false, confidence: 0, reason: 'Insufficient sample size' };
        }

        // Simplified t-test calculation
        const pooledStdError = Math.sqrt(
            (control.rate * (1 - control.rate) / control.participants) +
            (variant.rate * (1 - variant.rate) / variant.participants)
        );

        if (pooledStdError === 0) {
            return { significant: false, confidence: 0, reason: 'No variation in data' };
        }

        const tStatistic = Math.abs(control.rate - variant.rate) / pooledStdError;
        const confidence = this.tStatisticToConfidence(tStatistic);

        return {
            significant: confidence > 0.95,
            confidence,
            tStatistic,
            controlRate: control.rate,
            variantRate: variant.rate,
            lift: ((variant.rate - control.rate) / control.rate) * 100
        };
    }

    /**
     * Convert t-statistic to confidence level (simplified)
     */
    tStatisticToConfidence(tStat) {
        // Simplified confidence calculation
        if (tStat > 2.58) return 0.99;
        if (tStat > 1.96) return 0.95;
        if (tStat > 1.645) return 0.90;
        if (tStat > 1.28) return 0.80;
        return 0.5;
    }

    /**
     * Get participant count for variant
     */
    getParticipantCount(testId, variant) {
        // This would be retrieved from analytics in production
        return Math.floor(Math.random() * 1000) + 100;
    }

    /**
     * Apply variant styling/behavior
     */
    applyVariant(testId) {
        const variant = this.getVariant(testId);
        
        switch (testId) {
            case 'header-layout':
                this.applyHeaderVariant(variant);
                break;
            case 'cta-optimization':
                this.applyCTAVariant(variant);
                break;
            case 'navigation-style':
                this.applyNavigationVariant(variant);
                break;
            case 'loading-strategy':
                this.applyLoadingVariant(variant);
                break;
        }

        document.body.setAttribute(`data-test-${testId}`, variant);
        return variant;
    }

    applyHeaderVariant(variant) {
        const header = document.querySelector('.header');
        if (!header) return;

        switch (variant) {
            case 'compact':
                header.classList.add('header-compact');
                document.documentElement.style.setProperty('--header-padding', '1rem 0');
                break;
            case 'expanded':
                header.classList.add('header-expanded');
                document.documentElement.style.setProperty('--header-padding', '3rem 0');
                break;
        }
    }

    applyCTAVariant(variant) {
        const ctas = document.querySelectorAll('.contact-link, .footer-link');
        
        switch (variant) {
            case 'highlighted':
                ctas.forEach(cta => cta.classList.add('cta-highlighted'));
                break;
            case 'minimal':
                ctas.forEach(cta => cta.classList.add('cta-minimal'));
                break;
        }
    }

    applyNavigationVariant(variant) {
        const navigation = document.querySelector('.navigation');
        
        if (variant === 'sidebar') {
            navigation?.classList.add('navigation-sidebar');
            document.body.classList.add('sidebar-navigation');
        }
    }

    applyLoadingVariant(variant) {
        if (variant === 'progressive') {
            document.body.classList.add('progressive-loading');
        }
    }

    /**
     * Track analytics event
     */
    trackEvent(eventType, data) {
        // Store locally for demo purposes
        const events = JSON.parse(localStorage.getItem('ux_analytics_events') || '[]');
        events.push({ eventType, data, timestamp: Date.now() });
        
        // Keep only last 1000 events
        if (events.length > 1000) {
            events.splice(0, events.length - 1000);
        }
        
        localStorage.setItem('ux_analytics_events', JSON.stringify(events));

        // In production, send to analytics endpoint
        console.log(`📈 Analytics Event: ${eventType}`, data);
    }

    /**
     * Storage management
     */
    loadStoredAssignments() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const assignments = JSON.parse(stored);
                this.userAssignments = new Map(Object.entries(assignments));
            } catch (error) {
                console.warn('Failed to load A/B test assignments:', error);
            }
        }
    }

    saveAssignments() {
        const assignments = Object.fromEntries(this.userAssignments);
        localStorage.setItem(this.storageKey, JSON.stringify(assignments));
    }

    generateSessionId() {
        return 'ux_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    startAnalyticsCollection() {
        // Start collecting analytics data
        setTimeout(() => {
            this.collectPerformanceMetrics();
        }, 2000);
    }

    collectPerformanceMetrics() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            
            this.trackEvent('performance_metrics', {
                firstContentfulPaint: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
                timeToInteractive: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart
            });
        }
    }

    /**
     * Get test results for admin dashboard
     */
    getTestResults(testId = null) {
        if (testId) {
            const test = this.tests.get(testId);
            return test ? { [testId]: { ...test, significance: this.calculateSignificance(testId) } } : null;
        }

        const results = {};
        for (const [id, test] of this.tests) {
            results[id] = { ...test, significance: this.calculateSignificance(id) };
        }
        return results;
    }
}

/**
 * User Journey Analytics & Conversion Tracking
 */
class UserJourneyAnalytics {
    constructor() {
        this.journeyData = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            interactions: [],
            pageviews: [],
            conversions: [],
            userAgent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            referrer: document.referrer
        };
        
        this.conversionGoals = new Map();
        this.heatmapData = new Map();
        this.scrollData = [];
        
        this.init();
    }

    init() {
        this.setupConversionGoals();
        this.setupEventTracking();
        this.setupScrollTracking();
        this.setupHeatmapTracking();
        this.trackPageView();
        
        console.log('🗺️ User Journey Analytics initialized');
    }

    setupConversionGoals() {
        // Define conversion goals
        this.conversionGoals.set('contact_interaction', {
            name: 'Contact Interaction',
            events: ['click'],
            selectors: ['.contact-link', '[href^="mailto:"]', '[href^="tel:"]'],
            value: 10
        });

        this.conversionGoals.set('cv_download', {
            name: 'CV Download',
            events: ['click'],
            selectors: ['[download]', '.footer-link[href*="cv"]'],
            value: 25
        });

        this.conversionGoals.set('project_exploration', {
            name: 'Project Exploration',
            events: ['click'],
            selectors: ['.project-link', '.project-card a'],
            value: 5
        });

        this.conversionGoals.set('deep_engagement', {
            name: 'Deep Engagement',
            events: ['time_threshold'],
            threshold: 120000, // 2 minutes
            value: 15
        });

        this.conversionGoals.set('content_completion', {
            name: 'Content Completion',
            events: ['scroll_threshold'],
            threshold: 80, // 80% scroll depth
            value: 8
        });
    }

    setupEventTracking() {
        document.addEventListener('click', (e) => this.trackInteraction('click', e));
        document.addEventListener('touchstart', (e) => this.trackInteraction('touch', e), { passive: true });
        document.addEventListener('keydown', (e) => this.trackInteraction('keyboard', e));
        
        // Track form interactions
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.trackInteraction('form_focus', e);
            }
        });

        // Track link clicks with additional context
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                this.trackLinkClick(link, e);
            }
        });

        // Track time-based engagement
        setInterval(() => {
            this.checkTimeBasedGoals();
        }, 10000); // Check every 10 seconds
    }

    setupScrollTracking() {
        let scrollDepth = 0;
        let maxScroll = 0;

        const throttledScroll = this.throttle(() => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track scroll milestones
                if (maxScroll >= 25 && scrollDepth < 25) {
                    this.trackEvent('scroll_milestone', { depth: 25 });
                    scrollDepth = 25;
                }
                if (maxScroll >= 50 && scrollDepth < 50) {
                    this.trackEvent('scroll_milestone', { depth: 50 });
                    scrollDepth = 50;
                }
                if (maxScroll >= 75 && scrollDepth < 75) {
                    this.trackEvent('scroll_milestone', { depth: 75 });
                    scrollDepth = 75;
                }
                if (maxScroll >= 90 && scrollDepth < 90) {
                    this.trackEvent('scroll_milestone', { depth: 90 });
                    this.checkScrollBasedGoals(90);
                    scrollDepth = 90;
                }
            }

            this.scrollData.push({
                timestamp: Date.now(),
                scrollPercent: Math.max(scrollPercent, 0),
                scrollTop,
                viewport: { width: window.innerWidth, height: window.innerHeight }
            });

            // Keep only recent scroll data
            if (this.scrollData.length > 100) {
                this.scrollData.splice(0, this.scrollData.length - 100);
            }
        }, 250);

        window.addEventListener('scroll', throttledScroll, { passive: true });
    }

    setupHeatmapTracking() {
        document.addEventListener('click', (e) => {
            const rect = document.documentElement.getBoundingClientRect();
            const x = Math.round((e.clientX / window.innerWidth) * 100);
            const y = Math.round((e.clientY / window.innerHeight) * 100);
            
            const key = `${x}-${y}`;
            const current = this.heatmapData.get(key) || 0;
            this.heatmapData.set(key, current + 1);

            this.trackEvent('heatmap_click', {
                x: e.clientX,
                y: e.clientY,
                relativeX: x,
                relativeY: y,
                element: e.target.tagName.toLowerCase(),
                className: e.target.className
            });
        });

        // Track mouse movements (sampled)
        let mouseMoveCount = 0;
        document.addEventListener('mousemove', this.throttle((e) => {
            mouseMoveCount++;
            if (mouseMoveCount % 10 === 0) { // Sample every 10th movement
                this.trackEvent('mouse_movement', {
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now()
                });
            }
        }, 100), { passive: true });
    }

    trackInteraction(type, event) {
        const element = event.target;
        const interaction = {
            type,
            timestamp: Date.now(),
            element: {
                tagName: element.tagName?.toLowerCase(),
                id: element.id,
                className: element.className,
                textContent: element.textContent?.substring(0, 100)
            },
            position: {
                x: event.clientX,
                y: event.clientY
            }
        };

        this.journeyData.interactions.push(interaction);
        this.checkConversionGoals(type, event);

        // Keep only recent interactions
        if (this.journeyData.interactions.length > 500) {
            this.journeyData.interactions.splice(0, this.journeyData.interactions.length - 500);
        }
    }

    trackLinkClick(link, event) {
        const linkData = {
            href: link.href,
            text: link.textContent.trim(),
            external: !link.href.includes(window.location.hostname),
            target: link.target,
            timestamp: Date.now()
        };

        this.trackEvent('link_click', linkData);
        
        // Track external links specially
        if (linkData.external) {
            this.trackConversion('external_link_click', 1);
        }
    }

    trackPageView() {
        const pageview = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            referrer: document.referrer,
            viewport: { width: window.innerWidth, height: window.innerHeight }
        };

        this.journeyData.pageviews.push(pageview);
        this.trackEvent('pageview', pageview);
    }

    checkConversionGoals(eventType, event) {
        for (const [goalId, goal] of this.conversionGoals) {
            if (goal.events.includes(eventType)) {
                if (goal.selectors && goal.selectors.some(selector => event.target.matches(selector))) {
                    this.trackConversion(goalId, goal.value);
                }
            }
        }
    }

    checkTimeBasedGoals() {
        const sessionTime = Date.now() - this.journeyData.startTime;
        
        for (const [goalId, goal] of this.conversionGoals) {
            if (goal.events.includes('time_threshold') && sessionTime >= goal.threshold) {
                if (!this.journeyData.conversions.find(c => c.goalId === goalId)) {
                    this.trackConversion(goalId, goal.value);
                }
            }
        }
    }

    checkScrollBasedGoals(scrollDepth) {
        for (const [goalId, goal] of this.conversionGoals) {
            if (goal.events.includes('scroll_threshold') && scrollDepth >= goal.threshold) {
                if (!this.journeyData.conversions.find(c => c.goalId === goalId)) {
                    this.trackConversion(goalId, goal.value);
                }
            }
        }
    }

    trackConversion(goalId, value) {
        const conversion = {
            goalId,
            value,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.journeyData.startTime
        };

        this.journeyData.conversions.push(conversion);
        this.trackEvent('conversion', conversion);

        console.log(`🎯 Conversion tracked: ${goalId} (value: ${value})`);
    }

    trackEvent(eventType, data) {
        // Store in local analytics
        const events = JSON.parse(localStorage.getItem('user_journey_events') || '[]');
        events.push({
            sessionId: this.journeyData.sessionId,
            eventType,
            data,
            timestamp: Date.now()
        });

        if (events.length > 2000) {
            events.splice(0, events.length - 2000);
        }

        localStorage.setItem('user_journey_events', JSON.stringify(events));
    }

    /**
     * Get journey summary
     */
    getJourneySummary() {
        const sessionDuration = Date.now() - this.journeyData.startTime;
        const totalConversionValue = this.journeyData.conversions.reduce((sum, conv) => sum + conv.value, 0);
        const maxScrollDepth = Math.max(...this.scrollData.map(d => d.scrollPercent), 0);

        return {
            sessionId: this.journeyData.sessionId,
            sessionDuration,
            interactionCount: this.journeyData.interactions.length,
            conversionCount: this.journeyData.conversions.length,
            conversionValue: totalConversionValue,
            maxScrollDepth,
            pageviews: this.journeyData.pageviews.length,
            userAgent: this.journeyData.userAgent,
            viewport: this.journeyData.viewport
        };
    }

    /**
     * Export journey data
     */
    exportJourneyData() {
        return {
            ...this.journeyData,
            scrollData: this.scrollData,
            heatmapData: Array.from(this.heatmapData.entries()),
            summary: this.getJourneySummary()
        };
    }

    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    generateSessionId() {
        return 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Real-time Engagement Metrics Dashboard
 */
class EngagementMetrics {
    constructor() {
        this.metrics = {
            attentionTime: 0,
            interactionCount: 0,
            scrollVelocity: [],
            mouseActivity: 0,
            keyboardActivity: 0,
            engagementScore: 0
        };
        
        this.isVisible = false;
        this.startTime = Date.now();
        this.lastActivityTime = Date.now();
        this.visibilityChanges = 0;
        
        this.init();
    }

    init() {
        this.setupVisibilityTracking();
        this.setupActivityTracking();
        this.startMetricsCalculation();
        this.createMetricsDashboard();
        
        console.log('📊 Engagement Metrics initialized');
    }

    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            this.visibilityChanges++;
            if (document.hidden) {
                this.isVisible = false;
            } else {
                this.isVisible = true;
                this.lastActivityTime = Date.now();
            }
        });

        // Assume visible initially
        this.isVisible = !document.hidden;
    }

    setupActivityTracking() {
        // Mouse activity
        document.addEventListener('mousemove', this.throttle(() => {
            this.metrics.mouseActivity++;
            this.lastActivityTime = Date.now();
        }, 100), { passive: true });

        // Keyboard activity
        document.addEventListener('keydown', () => {
            this.metrics.keyboardActivity++;
            this.lastActivityTime = Date.now();
        });

        // Scroll velocity tracking
        let lastScrollTime = Date.now();
        let lastScrollTop = window.pageYOffset;

        window.addEventListener('scroll', this.throttle(() => {
            const currentTime = Date.now();
            const currentScroll = window.pageYOffset;
            
            const timeDelta = currentTime - lastScrollTime;
            const scrollDelta = Math.abs(currentScroll - lastScrollTop);
            
            if (timeDelta > 0) {
                const velocity = scrollDelta / timeDelta;
                this.metrics.scrollVelocity.push(velocity);
                
                // Keep only recent velocity data
                if (this.metrics.scrollVelocity.length > 50) {
                    this.metrics.scrollVelocity.shift();
                }
            }
            
            lastScrollTime = currentTime;
            lastScrollTop = currentScroll;
            this.lastActivityTime = Date.now();
        }, 50), { passive: true });

        // Click interactions
        document.addEventListener('click', () => {
            this.metrics.interactionCount++;
            this.lastActivityTime = Date.now();
        });
    }

    startMetricsCalculation() {
        setInterval(() => {
            this.calculateEngagementScore();
            this.updateMetricsDashboard();
        }, 1000);

        // Calculate attention time
        setInterval(() => {
            if (this.isVisible && this.isRecentlyActive()) {
                this.metrics.attentionTime += 1000; // Add 1 second
            }
        }, 1000);
    }

    isRecentlyActive() {
        return (Date.now() - this.lastActivityTime) < 5000; // 5 seconds
    }

    calculateEngagementScore() {
        const sessionDuration = Date.now() - this.startTime;
        const attentionRatio = sessionDuration > 0 ? this.metrics.attentionTime / sessionDuration : 0;
        
        // Average scroll velocity
        const avgScrollVelocity = this.metrics.scrollVelocity.length > 0 
            ? this.metrics.scrollVelocity.reduce((sum, v) => sum + v, 0) / this.metrics.scrollVelocity.length 
            : 0;

        // Normalize metrics (0-100 scale)
        const normalizedAttention = Math.min(attentionRatio * 100, 100);
        const normalizedInteractions = Math.min(this.metrics.interactionCount * 2, 100);
        const normalizedActivity = Math.min((this.metrics.mouseActivity + this.metrics.keyboardActivity) / 10, 100);
        const normalizedScrollActivity = Math.min(avgScrollVelocity * 1000, 100);

        // Weighted engagement score
        this.metrics.engagementScore = Math.round(
            (normalizedAttention * 0.4) +
            (normalizedInteractions * 0.3) +
            (normalizedActivity * 0.2) +
            (normalizedScrollActivity * 0.1)
        );
    }

    createMetricsDashboard() {
        const dashboard = document.createElement('div');
        dashboard.id = 'engagement-dashboard';
        dashboard.className = 'engagement-dashboard';
        dashboard.innerHTML = `
            <div class="metrics-header">
                <h4>📊 Live Engagement</h4>
                <button class="metrics-toggle" aria-label="Toggle engagement dashboard">−</button>
            </div>
            <div class="metrics-content">
                <div class="metric-row">
                    <span class="metric-label">Engagement Score</span>
                    <span class="metric-value" id="engagement-score">0</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Attention Time</span>
                    <span class="metric-value" id="attention-time">0s</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Interactions</span>
                    <span class="metric-value" id="interaction-count">0</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Activity Level</span>
                    <div class="activity-bar">
                        <div class="activity-fill" id="activity-fill"></div>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .engagement-dashboard {
                position: fixed;
                top: 20px;
                left: 20px;
                background: var(--color-background-card);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-lg);
                padding: 1rem;
                min-width: 200px;
                z-index: var(--z-popover);
                font-size: 0.875rem;
                box-shadow: var(--shadow-card);
                transition: transform 0.3s ease;
            }
            
            .engagement-dashboard.minimized {
                transform: translateX(-180px);
            }
            
            .metrics-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
                color: var(--color-text-primary);
            }
            
            .metrics-header h4 {
                margin: 0;
                font-size: 0.875rem;
                font-weight: 600;
            }
            
            .metrics-toggle {
                background: none;
                border: none;
                color: var(--color-text-muted);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: var(--radius-sm);
                transition: background-color 0.2s ease;
            }
            
            .metrics-toggle:hover {
                background: var(--color-surface-hover);
            }
            
            .metric-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .metric-label {
                color: var(--color-text-secondary);
                font-size: 0.75rem;
            }
            
            .metric-value {
                color: var(--color-primary-light);
                font-weight: 600;
                font-size: 0.875rem;
            }
            
            .activity-bar {
                width: 60px;
                height: 6px;
                background: var(--color-surface);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .activity-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
                width: 0%;
                transition: width 0.3s ease;
            }
            
            @media (max-width: 768px) {
                .engagement-dashboard {
                    top: 10px;
                    left: 10px;
                    font-size: 0.75rem;
                    min-width: 180px;
                    padding: 0.75rem;
                }
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(dashboard);

        // Setup toggle functionality
        const toggle = dashboard.querySelector('.metrics-toggle');
        toggle.addEventListener('click', () => {
            dashboard.classList.toggle('minimized');
            toggle.textContent = dashboard.classList.contains('minimized') ? '+' : '−';
        });
    }

    updateMetricsDashboard() {
        const scoreElement = document.getElementById('engagement-score');
        const timeElement = document.getElementById('attention-time');
        const interactionElement = document.getElementById('interaction-count');
        const activityFill = document.getElementById('activity-fill');

        if (scoreElement) scoreElement.textContent = this.metrics.engagementScore;
        if (timeElement) timeElement.textContent = Math.round(this.metrics.attentionTime / 1000) + 's';
        if (interactionElement) interactionElement.textContent = this.metrics.interactionCount;
        
        if (activityFill) {
            const activityLevel = Math.min((this.metrics.mouseActivity + this.metrics.keyboardActivity) / 10, 100);
            activityFill.style.width = activityLevel + '%';
        }
    }

    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    getMetrics() {
        return {
            ...this.metrics,
            sessionDuration: Date.now() - this.startTime,
            visibilityChanges: this.visibilityChanges,
            isCurrentlyVisible: this.isVisible,
            isCurrentlyActive: this.isRecentlyActive()
        };
    }
}

// Initialize UX Optimization Framework
let abTestingFramework;
let userJourneyAnalytics;
let engagementMetrics;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize frameworks with slight delay to ensure DOM is ready
    setTimeout(() => {
        abTestingFramework = new ABTestingFramework();
        userJourneyAnalytics = new UserJourneyAnalytics();
        engagementMetrics = new EngagementMetrics();

        // Apply A/B test variants
        abTestingFramework.applyVariant('header-layout');
        abTestingFramework.applyVariant('cta-optimization');
        abTestingFramework.applyVariant('navigation-style');
        abTestingFramework.applyVariant('loading-strategy');

        console.log('🎯 UX Optimization Framework fully initialized');

        // Export to global scope for debugging
        window.uxOptimization = {
            abTesting: abTestingFramework,
            analytics: userJourneyAnalytics,
            engagement: engagementMetrics
        };
    }, 1000);
});

// Export modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ABTestingFramework,
        UserJourneyAnalytics,
        EngagementMetrics
    };
}