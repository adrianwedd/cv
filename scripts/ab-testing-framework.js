/**
 * A/B Testing Framework for Continuous UX Optimization
 * 
 * Features:
 * - Multi-variant testing capabilities
 * - Statistical significance calculations
 * - User segmentation and targeting
 * - Real-time experiment monitoring
 * - Automatic traffic allocation
 * - Performance impact measurement
 */

class ABTestingFramework {
    constructor() {
        this.config = {
            enabled: true,
            defaultTrafficSplit: 50, // 50/50 split
            minSampleSize: 100,
            confidenceLevel: 0.95,
            significanceThreshold: 0.05,
            experimentDuration: 14, // days
            storageKey: 'ab-testing-data',
            analyticsEndpoint: 'http://localhost:8080/ab-analytics'
        };

        this.experiments = new Map();
        this.userSegment = null;
        this.activeExperiments = [];
        this.results = new Map();
        
        this.init();
    }

    async init() {
        console.log('🧪 Initializing A/B Testing Framework');

        // Load existing experiments
        this.loadExperiments();

        // Determine user segment
        this.determineUserSegment();

        // Set up predefined experiments
        this.setupPredefinedExperiments();

        // Start active experiments
        this.startActiveExperiments();

        // Set up event tracking
        this.setupEventTracking();

        // Set up result monitoring
        this.setupResultMonitoring();

        console.log('✅ A/B Testing Framework initialized');
    }

    loadExperiments() {
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                if (data.experiments) {
                    data.experiments.forEach(exp => {
                        this.experiments.set(exp.id, exp);
                    });
                }
                if (data.results) {
                    Object.entries(data.results).forEach(([key, value]) => {
                        this.results.set(key, value);
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to load A/B testing data:', error);
        }
    }

    saveExperiments() {
        try {
            const data = {
                experiments: Array.from(this.experiments.values()),
                results: Object.fromEntries(this.results.entries()),
                timestamp: Date.now()
            };
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save A/B testing data:', error);
        }
    }

    determineUserSegment() {
        // Create user segment based on various factors
        const factors = {
            userAgent: navigator.userAgent,
            screenSize: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            referrer: document.referrer,
            timestamp: Date.now()
        };

        // Generate consistent user ID based on fingerprint
        this.userId = this.generateUserFingerprint(factors);
        
        // Determine device type
        const deviceType = this.getDeviceType();
        
        // Determine traffic source
        const trafficSource = this.getTrafficSource();

        this.userSegment = {
            userId: this.userId,
            deviceType: deviceType,
            trafficSource: trafficSource,
            screenSize: factors.screenSize,
            language: factors.language,
            timezone: factors.timezone,
            isReturning: this.isReturningUser(),
            sessionStart: Date.now()
        };

        console.log('👤 User segment determined:', this.userSegment);
    }

    generateUserFingerprint(factors) {
        const fingerprint = Object.values(factors).join('|');
        return this.simpleHash(fingerprint);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
            return 'mobile';
        }
        if (/tablet|ipad/i.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }

    getTrafficSource() {
        const referrer = document.referrer.toLowerCase();
        if (!referrer) return 'direct';
        
        if (referrer.includes('google')) return 'google';
        if (referrer.includes('linkedin')) return 'linkedin';
        if (referrer.includes('github')) return 'github';
        if (referrer.includes('facebook')) return 'facebook';
        if (referrer.includes('twitter')) return 'twitter';
        
        return 'referral';
    }

    isReturningUser() {
        const visitCount = localStorage.getItem('cv-visit-count') || '0';
        const count = parseInt(visitCount) + 1;
        localStorage.setItem('cv-visit-count', count.toString());
        return count > 1;
    }

    setupPredefinedExperiments() {
        // Experiment 1: Header Design Variations
        this.createExperiment({
            id: 'header-design-v1',
            name: 'Header Design Optimization',
            description: 'Testing different header layouts for better engagement',
            variants: [
                {
                    id: 'control',
                    name: 'Original Header',
                    weight: 50,
                    changes: {} // No changes for control
                },
                {
                    id: 'compact-header',
                    name: 'Compact Header',
                    weight: 50,
                    changes: {
                        css: `
                            .header { padding: 1rem 0; }
                            .profile-image { width: 60px; height: 60px; }
                            .name { font-size: 1.5rem; }
                        `
                    }
                }
            ],
            targetSegments: ['all'],
            metrics: ['header-engagement', 'time-to-scroll', 'navigation-clicks'],
            startDate: Date.now(),
            endDate: Date.now() + (14 * 24 * 60 * 60 * 1000) // 14 days
        });

        // Experiment 2: Call-to-Action Button Variations
        this.createExperiment({
            id: 'cta-buttons-v1',
            name: 'CTA Button Optimization',
            description: 'Testing different call-to-action button styles',
            variants: [
                {
                    id: 'control',
                    name: 'Original Buttons',
                    weight: 33,
                    changes: {}
                },
                {
                    id: 'prominent-cta',
                    name: 'Prominent CTA',
                    weight: 33,
                    changes: {
                        css: `
                            .cta-button, a[href*="pdf"], button[id*="download"] {
                                background: linear-gradient(135deg, #f59e0b, #d97706) !important;
                                transform: scale(1.1);
                                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
                                animation: pulse 2s infinite;
                            }
                            @keyframes pulse {
                                0% { box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
                                50% { box-shadow: 0 8px 20px rgba(245, 158, 11, 0.5); }
                                100% { box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
                            }
                        `
                    }
                },
                {
                    id: 'minimal-cta',
                    name: 'Minimal CTA',
                    weight: 34,
                    changes: {
                        css: `
                            .cta-button, a[href*="pdf"], button[id*="download"] {
                                background: none !important;
                                border: 2px solid var(--color-primary);
                                color: var(--color-primary);
                                transition: all 0.3s ease;
                            }
                            .cta-button:hover, a[href*="pdf"]:hover, button[id*="download"]:hover {
                                background: var(--color-primary) !important;
                                color: white;
                            }
                        `
                    }
                }
            ],
            targetSegments: ['all'],
            metrics: ['cta-clicks', 'cv-downloads', 'conversion-rate'],
            startDate: Date.now(),
            endDate: Date.now() + (21 * 24 * 60 * 60 * 1000) // 21 days
        });

        // Experiment 3: Skills Section Layout
        this.createExperiment({
            id: 'skills-layout-v1',
            name: 'Skills Section Layout',
            description: 'Testing grid vs list layout for skills',
            variants: [
                {
                    id: 'control',
                    name: 'Current Grid Layout',
                    weight: 50,
                    changes: {}
                },
                {
                    id: 'list-layout',
                    name: 'List Layout with Progress Bars',
                    weight: 50,
                    changes: {
                        css: `
                            .skills-container {
                                display: block !important;
                            }
                            .skill-item {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 1rem;
                                padding: 0.75rem;
                                background: var(--color-surface);
                                border-radius: var(--radius-sm);
                            }
                            .skill-item::after {
                                content: '';
                                width: 100px;
                                height: 4px;
                                background: var(--color-primary);
                                border-radius: 2px;
                                opacity: 0.7;
                            }
                        `
                    }
                }
            ],
            targetSegments: ['desktop', 'tablet'],
            metrics: ['skills-section-time', 'skills-interactions', 'section-completion'],
            startDate: Date.now(),
            endDate: Date.now() + (10 * 24 * 60 * 60 * 1000) // 10 days
        });

        // Experiment 4: Mobile Navigation
        this.createExperiment({
            id: 'mobile-nav-v1',
            name: 'Mobile Navigation Optimization',
            description: 'Testing hamburger menu vs bottom navigation',
            variants: [
                {
                    id: 'control',
                    name: 'Standard Navigation',
                    weight: 50,
                    changes: {}
                },
                {
                    id: 'bottom-nav',
                    name: 'Bottom Navigation',
                    weight: 50,
                    changes: {
                        css: `
                            @media (max-width: 768px) {
                                .navigation {
                                    position: fixed;
                                    bottom: 0;
                                    left: 0;
                                    right: 0;
                                    background: var(--color-surface);
                                    border-radius: 0;
                                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                                    margin: 0;
                                    padding: 0.5rem;
                                    z-index: 1000;
                                }
                                .nav-items {
                                    justify-content: space-around;
                                }
                                .nav-item {
                                    font-size: 0.75rem;
                                    padding: 0.5rem 0.25rem;
                                    text-align: center;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    min-width: 60px;
                                }
                                body {
                                    padding-bottom: 80px;
                                }
                            }
                        `
                    }
                }
            ],
            targetSegments: ['mobile'],
            metrics: ['navigation-usage', 'section-views', 'mobile-engagement'],
            startDate: Date.now(),
            endDate: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        });
    }

    createExperiment(config) {
        const experiment = {
            ...config,
            status: 'draft',
            participants: 0,
            conversions: new Map(),
            metrics: new Map(),
            createdAt: Date.now()
        };

        this.experiments.set(config.id, experiment);
        this.saveExperiments();
        
        console.log('🧪 Created experiment:', config.name);
        return experiment;
    }

    startActiveExperiments() {
        const now = Date.now();
        
        this.experiments.forEach((experiment, id) => {
            if (experiment.startDate <= now && 
                experiment.endDate > now && 
                this.isUserEligible(experiment)) {
                
                this.activateExperiment(id);
            }
        });
    }

    isUserEligible(experiment) {
        // Check if user segment matches target segments
        if (experiment.targetSegments.includes('all')) {
            return true;
        }

        return experiment.targetSegments.some(segment => {
            switch (segment) {
                case 'mobile':
                    return this.userSegment.deviceType === 'mobile';
                case 'desktop':
                    return this.userSegment.deviceType === 'desktop';
                case 'tablet':
                    return this.userSegment.deviceType === 'tablet';
                case 'returning':
                    return this.userSegment.isReturning;
                case 'new':
                    return !this.userSegment.isReturning;
                default:
                    return this.userSegment.trafficSource === segment;
            }
        });
    }

    activateExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        // Determine which variant to assign
        const variant = this.assignVariant(experiment);
        if (!variant) return;

        // Apply the variant
        this.applyVariant(experiment, variant);

        // Track participation
        this.trackParticipation(experimentId, variant.id);

        // Add to active experiments
        this.activeExperiments.push({
            experimentId,
            variantId: variant.id,
            startTime: Date.now()
        });

        console.log(`🎯 Activated experiment: ${experiment.name} (${variant.name})`);
    }

    assignVariant(experiment) {
        // Use consistent assignment based on user ID
        const hash = this.simpleHash(this.userId + experiment.id);
        const randomValue = (hash % 100) + 1; // 1-100
        
        let cumulativeWeight = 0;
        for (const variant of experiment.variants) {
            cumulativeWeight += variant.weight;
            if (randomValue <= cumulativeWeight) {
                return variant;
            }
        }
        
        // Fallback to control
        return experiment.variants[0];
    }

    applyVariant(experiment, variant) {
        if (!variant.changes) return;

        // Apply CSS changes
        if (variant.changes.css) {
            this.applyCSSChanges(experiment.id, variant.changes.css);
        }

        // Apply HTML changes
        if (variant.changes.html) {
            this.applyHTMLChanges(variant.changes.html);
        }

        // Apply JavaScript changes
        if (variant.changes.js) {
            this.applyJSChanges(variant.changes.js);
        }

        // Apply attribute changes
        if (variant.changes.attributes) {
            this.applyAttributeChanges(variant.changes.attributes);
        }
    }

    applyCSSChanges(experimentId, css) {
        const style = document.createElement('style');
        style.id = `ab-test-${experimentId}`;
        style.textContent = css;
        document.head.appendChild(style);
    }

    applyHTMLChanges(changes) {
        changes.forEach(change => {
            const element = document.querySelector(change.selector);
            if (element) {
                if (change.type === 'replace') {
                    element.innerHTML = change.content;
                } else if (change.type === 'append') {
                    element.insertAdjacentHTML('beforeend', change.content);
                } else if (change.type === 'prepend') {
                    element.insertAdjacentHTML('afterbegin', change.content);
                }
            }
        });
    }

    applyJSChanges(jsCode) {
        try {
            const script = document.createElement('script');
            script.textContent = jsCode;
            document.body.appendChild(script);
        } catch (error) {
            console.warn('Failed to apply JS changes:', error);
        }
    }

    applyAttributeChanges(changes) {
        changes.forEach(change => {
            const elements = document.querySelectorAll(change.selector);
            elements.forEach(element => {
                element.setAttribute(change.attribute, change.value);
            });
        });
    }

    setupEventTracking() {
        // Track conversion events
        this.setupConversionTracking();

        // Track engagement metrics
        this.setupEngagementTracking();

        // Track custom experiment metrics
        this.setupCustomMetricTracking();
    }

    setupConversionTracking() {
        // Primary conversions
        document.addEventListener('click', (event) => {
            // CV download
            if (event.target.matches('a[href*="pdf"], button[id*="download"]')) {
                this.trackConversion('cv-download');
            }

            // Contact interactions
            if (event.target.matches('a[href^="mailto:"], a[href^="tel:"]')) {
                this.trackConversion('contact-interaction');
            }

            // Social links
            if (event.target.matches('a[href*="linkedin"], a[href*="github"]')) {
                this.trackConversion('social-interaction');
            }

            // CTA buttons (any custom CTA)
            if (event.target.classList.contains('cta-button')) {
                this.trackConversion('cta-clicks');
            }
        });
    }

    setupEngagementTracking() {
        // Track time spent in sections
        let sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.trackMetric('section-view', {
                        section: entry.target.id,
                        timestamp: Date.now()
                    });
                }
            });
        }, { threshold: 0.5 });

        // Observe all sections
        document.querySelectorAll('.section').forEach(section => {
            sectionObserver.observe(section);
        });

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.trackMetric('scroll-depth', { percentage: Math.round(scrollPercent) });
            }
        });

        // Track time on page
        this.startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - this.startTime;
            this.trackMetric('time-on-page', { duration: timeOnPage });
        });
    }

    setupCustomMetricTracking() {
        // Header engagement tracking
        const header = document.querySelector('.header');
        if (header) {
            header.addEventListener('click', () => {
                this.trackMetric('header-engagement', { type: 'click' });
            });
        }

        // Navigation tracking
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.addEventListener('click', () => {
                this.trackMetric('navigation-clicks', { 
                    section: navItem.textContent,
                    timestamp: Date.now()
                });
            });
        });

        // Skills interaction tracking
        document.querySelectorAll('.skill-item').forEach(skill => {
            skill.addEventListener('click', () => {
                this.trackMetric('skills-interactions', {
                    skill: skill.textContent,
                    timestamp: Date.now()
                });
            });
        });
    }

    trackParticipation(experimentId, variantId) {
        const experiment = this.experiments.get(experimentId);
        if (experiment) {
            experiment.participants++;
            
            // Initialize variant metrics if not exists
            if (!experiment.metrics.has(variantId)) {
                experiment.metrics.set(variantId, {
                    participants: 0,
                    conversions: new Map(),
                    customMetrics: new Map()
                });
            }

            const variantMetrics = experiment.metrics.get(variantId);
            variantMetrics.participants++;

            this.saveExperiments();
        }

        // Send to analytics
        this.sendAnalytics('participation', {
            experimentId,
            variantId,
            userId: this.userId,
            timestamp: Date.now(),
            userSegment: this.userSegment
        });
    }

    trackConversion(conversionType) {
        this.activeExperiments.forEach(activeExp => {
            const experiment = this.experiments.get(activeExp.experimentId);
            const variantMetrics = experiment.metrics.get(activeExp.variantId);

            if (!variantMetrics.conversions.has(conversionType)) {
                variantMetrics.conversions.set(conversionType, 0);
            }

            variantMetrics.conversions.set(
                conversionType, 
                variantMetrics.conversions.get(conversionType) + 1
            );

            this.saveExperiments();

            // Send to analytics
            this.sendAnalytics('conversion', {
                experimentId: activeExp.experimentId,
                variantId: activeExp.variantId,
                conversionType,
                userId: this.userId,
                timestamp: Date.now()
            });

            console.log(`📊 Conversion tracked: ${conversionType} for ${experiment.name}`);
        });
    }

    trackMetric(metricName, data) {
        this.activeExperiments.forEach(activeExp => {
            const experiment = this.experiments.get(activeExp.experimentId);
            
            // Only track metrics that are defined for this experiment
            if (experiment.metrics && experiment.metrics.includes(metricName)) {
                const variantMetrics = experiment.metrics.get(activeExp.variantId);

                if (!variantMetrics.customMetrics.has(metricName)) {
                    variantMetrics.customMetrics.set(metricName, []);
                }

                variantMetrics.customMetrics.get(metricName).push({
                    ...data,
                    timestamp: Date.now()
                });

                this.saveExperiments();
            }
        });
    }

    setupResultMonitoring() {
        // Calculate results every 5 minutes
        setInterval(() => {
            this.calculateResults();
        }, 5 * 60 * 1000);

        // Check for statistical significance every hour
        setInterval(() => {
            this.checkStatisticalSignificance();
        }, 60 * 60 * 1000);
    }

    calculateResults() {
        this.experiments.forEach((experiment, experimentId) => {
            if (experiment.status !== 'running') return;

            const results = {
                experimentId,
                name: experiment.name,
                status: experiment.status,
                participants: experiment.participants,
                variants: [],
                lastUpdated: Date.now()
            };

            experiment.variants.forEach(variant => {
                const metrics = experiment.metrics.get(variant.id);
                if (!metrics) return;

                const variantResult = {
                    id: variant.id,
                    name: variant.name,
                    participants: metrics.participants,
                    conversions: Object.fromEntries(metrics.conversions.entries()),
                    conversionRates: {},
                    customMetrics: {}
                };

                // Calculate conversion rates
                metrics.conversions.forEach((conversions, type) => {
                    variantResult.conversionRates[type] = 
                        metrics.participants > 0 ? conversions / metrics.participants : 0;
                });

                // Process custom metrics
                metrics.customMetrics.forEach((values, metricName) => {
                    variantResult.customMetrics[metricName] = {
                        count: values.length,
                        average: values.length > 0 ? 
                            values.reduce((sum, val) => sum + (val.value || 1), 0) / values.length : 0
                    };
                });

                results.variants.push(variantResult);
            });

            this.results.set(experimentId, results);
        });

        this.saveExperiments();
    }

    checkStatisticalSignificance() {
        this.results.forEach((results, experimentId) => {
            const experiment = this.experiments.get(experimentId);
            if (!experiment || experiment.status !== 'running') return;

            // Check each conversion type for significance
            const significanceResults = new Map();

            Object.keys(results.variants[0]?.conversionRates || {}).forEach(conversionType => {
                const significance = this.calculateStatisticalSignificance(
                    results.variants,
                    conversionType
                );

                significanceResults.set(conversionType, significance);

                if (significance.isSignificant) {
                    console.log(`📈 Statistical significance reached for ${experiment.name} - ${conversionType}`);
                    console.log(`Winner: ${significance.winner.name} with ${(significance.winner.conversionRate * 100).toFixed(2)}% conversion rate`);
                    
                    // Optionally auto-conclude experiment
                    if (experiment.autoStop) {
                        this.concludeExperiment(experimentId, significance);
                    }
                }
            });

            // Update results with significance data
            results.significance = Object.fromEntries(significanceResults.entries());
            this.results.set(experimentId, results);
        });
    }

    calculateStatisticalSignificance(variants, conversionType) {
        if (variants.length !== 2) {
            return { isSignificant: false, message: 'Only supports 2-variant tests currently' };
        }

        const [control, treatment] = variants;
        
        const controlRate = control.conversionRates[conversionType] || 0;
        const treatmentRate = treatment.conversionRates[conversionType] || 0;
        
        const controlParticipants = control.participants;
        const treatmentParticipants = treatment.participants;

        // Check minimum sample size
        if (controlParticipants < this.config.minSampleSize || 
            treatmentParticipants < this.config.minSampleSize) {
            return {
                isSignificant: false,
                message: 'Insufficient sample size',
                sampleSizeNeeded: this.config.minSampleSize - Math.min(controlParticipants, treatmentParticipants)
            };
        }

        // Calculate Z-score for two-proportion test
        const pooledRate = (control.conversions[conversionType] + treatment.conversions[conversionType]) / 
                          (controlParticipants + treatmentParticipants);
        
        const standardError = Math.sqrt(
            pooledRate * (1 - pooledRate) * (1/controlParticipants + 1/treatmentParticipants)
        );

        const zScore = Math.abs(treatmentRate - controlRate) / standardError;
        const criticalValue = 1.96; // for 95% confidence level
        
        const isSignificant = zScore > criticalValue;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

        const winner = treatmentRate > controlRate ? treatment : control;
        const improvement = Math.abs(treatmentRate - controlRate) / controlRate * 100;

        return {
            isSignificant,
            pValue,
            zScore,
            improvement: improvement.toFixed(2),
            winner: {
                name: winner.name,
                conversionRate: winner === treatment ? treatmentRate : controlRate
            },
            confidence: this.config.confidenceLevel
        };
    }

    normalCDF(x) {
        // Approximation of normal cumulative distribution function
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    concludeExperiment(experimentId, significance) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        experiment.status = 'concluded';
        experiment.endDate = Date.now();
        experiment.conclusion = {
            winner: significance.winner,
            improvement: significance.improvement,
            confidence: significance.confidence,
            conclusionDate: Date.now()
        };

        // Remove CSS changes
        const styleElement = document.getElementById(`ab-test-${experimentId}`);
        if (styleElement) {
            styleElement.remove();
        }

        this.saveExperiments();

        console.log(`🏆 Experiment concluded: ${experiment.name}`);
        console.log(`Winner: ${significance.winner.name} (+${significance.improvement}%)`);

        // Send conclusion to analytics
        this.sendAnalytics('experiment-concluded', {
            experimentId,
            winner: significance.winner,
            improvement: significance.improvement
        });
    }

    async sendAnalytics(type, data) {
        try {
            await fetch(this.config.analyticsEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data, timestamp: Date.now() })
            });
        } catch (error) {
            console.warn('Failed to send A/B testing analytics:', error);
        }
    }

    // Public API methods
    getExperiment(experimentId) {
        return this.experiments.get(experimentId);
    }

    getResults(experimentId) {
        return this.results.get(experimentId);
    }

    getAllResults() {
        return Object.fromEntries(this.results.entries());
    }

    forceVariant(experimentId, variantId) {
        // For testing purposes - force a specific variant
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return false;

        const variant = experiment.variants.find(v => v.id === variantId);
        if (!variant) return false;

        this.applyVariant(experiment, variant);
        return true;
    }

    stopExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (experiment) {
            experiment.status = 'stopped';
            experiment.endDate = Date.now();
            this.saveExperiments();

            // Remove CSS changes
            const styleElement = document.getElementById(`ab-test-${experimentId}`);
            if (styleElement) {
                styleElement.remove();
            }
        }
    }

    generateReport() {
        const report = {
            summary: {
                totalExperiments: this.experiments.size,
                activeExperiments: this.activeExperiments.length,
                concludedExperiments: Array.from(this.experiments.values()).filter(e => e.status === 'concluded').length
            },
            experiments: Array.from(this.results.values()),
            userSegment: this.userSegment,
            generatedAt: Date.now()
        };

        return report;
    }
}

// Initialize and expose globally
window.abTesting = new ABTestingFramework();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ABTestingFramework;
}