/**
 * User Experience Feedback Loop System
 * Automated collection and analysis of user interaction data
 * 
 * Features:
 * - Behavioral analytics and heatmaps
 * - User journey tracking
 * - Engagement metrics
 * - Satisfaction scoring
 * - Real-time feedback collection
 */

class UserExperienceFeedbackLoop {
    constructor() {
        this.config = {
            trackingEnabled: true,
            heatmapEnabled: true,
            feedbackEnabled: true,
            analyticsEndpoint: 'http://localhost:8080/analytics',
            samplingRate: 1.0, // Track 100% of sessions
            storageKey: 'ux-feedback-data'
        };

        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            interactions: [],
            pageViews: [],
            errors: [],
            satisfaction: null,
            journey: []
        };

        this.heatmapData = {
            clicks: [],
            scrollDepth: {},
            mouseMoves: [],
            hovers: []
        };

        this.engagementMetrics = {
            timeOnPage: 0,
            scrollPercentage: 0,
            interactionCount: 0,
            bounceRate: 0,
            conversionEvents: []
        };

        this.feedbackWidgets = new Map();
        this.isTracking = false;

        this.init();
    }

    async init() {
        console.log('🔄 Initializing User Experience Feedback Loop');

        // Set up behavioral tracking
        this.setupBehavioralTracking();

        // Set up heatmap collection
        this.setupHeatmapCollection();

        // Set up user journey tracking
        this.setupJourneyTracking();

        // Set up engagement metrics
        this.setupEngagementTracking();

        // Set up feedback widgets
        this.setupFeedbackWidgets();

        // Set up real-time analytics
        this.setupRealTimeAnalytics();

        // Start tracking
        this.startTracking();

        console.log('✅ User Experience Feedback Loop initialized');
    }

    generateSessionId() {
        return 'ux-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    setupBehavioralTracking() {
        // Track all user interactions
        const events = [
            'click', 'dblclick', 'contextmenu',
            'mousedown', 'mouseup', 'mouseover', 'mouseout',
            'keydown', 'keyup', 'keypress',
            'scroll', 'resize',
            'focus', 'blur',
            'submit', 'change', 'input'
        ];

        events.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackInteraction(eventType, event);
            }, { passive: true });
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackVisibilityChange();
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.finalizeSession();
        });
    }

    trackInteraction(type, event) {
        if (!this.isTracking) return;

        const interaction = {
            type: type,
            timestamp: Date.now(),
            target: {
                tagName: event.target.tagName?.toLowerCase(),
                id: event.target.id,
                className: event.target.className,
                textContent: event.target.textContent?.substring(0, 100)
            },
            position: {
                x: event.clientX,
                y: event.clientY,
                pageX: event.pageX,
                pageY: event.pageY
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY
            },
            sessionTime: Date.now() - this.session.startTime
        };

        // Add additional data based on event type
        if (type === 'click' || type === 'dblclick') {
            interaction.button = event.button;
            interaction.ctrlKey = event.ctrlKey;
            interaction.shiftKey = event.shiftKey;
            interaction.altKey = event.altKey;
        }

        if (type === 'scroll') {
            interaction.scrollPercentage = this.calculateScrollPercentage();
        }

        if (type === 'keypress' || type === 'keydown') {
            interaction.key = event.key;
            interaction.code = event.code;
        }

        this.session.interactions.push(interaction);
        this.updateEngagementMetrics(interaction);

        // Real-time processing for critical events
        if (['click', 'scroll', 'submit'].includes(type)) {
            this.processInteractionRealTime(interaction);
        }
    }

    trackVisibilityChange() {
        const visibility = {
            timestamp: Date.now(),
            visible: !document.hidden,
            sessionTime: Date.now() - this.session.startTime
        };

        this.session.interactions.push({
            type: 'visibility-change',
            ...visibility
        });

        // Update time tracking
        if (document.hidden) {
            this.pauseTimeTracking();
        } else {
            this.resumeTimeTracking();
        }
    }

    setupHeatmapCollection() {
        if (!this.config.heatmapEnabled) return;

        // Track click heatmap
        document.addEventListener('click', (event) => {
            this.recordHeatmapClick(event);
        });

        // Track mouse movement (sampled)
        let mouseMoveThrottle = null;
        document.addEventListener('mousemove', (event) => {
            if (mouseMoveThrottle) return;
            
            mouseMoveThrottle = setTimeout(() => {
                this.recordMouseMove(event);
                mouseMoveThrottle = null;
            }, 100); // Sample every 100ms
        });

        // Track hover events
        document.addEventListener('mouseover', (event) => {
            this.recordHover(event);
        });

        // Track scroll depth
        window.addEventListener('scroll', () => {
            this.recordScrollDepth();
        }, { passive: true });
    }

    recordHeatmapClick(event) {
        const clickData = {
            x: event.clientX,
            y: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
            timestamp: Date.now(),
            target: event.target.tagName?.toLowerCase(),
            url: window.location.pathname
        };

        this.heatmapData.clicks.push(clickData);

        // Keep only last 1000 clicks for performance
        if (this.heatmapData.clicks.length > 1000) {
            this.heatmapData.clicks = this.heatmapData.clicks.slice(-1000);
        }
    }

    recordMouseMove(event) {
        const moveData = {
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now()
        };

        this.heatmapData.mouseMoves.push(moveData);

        // Keep only last 500 mouse moves for performance
        if (this.heatmapData.mouseMoves.length > 500) {
            this.heatmapData.mouseMoves = this.heatmapData.mouseMoves.slice(-500);
        }
    }

    recordHover(event) {
        const hoverData = {
            x: event.clientX,
            y: event.clientY,
            target: event.target.tagName?.toLowerCase(),
            targetId: event.target.id,
            timestamp: Date.now()
        };

        this.heatmapData.hovers.push(hoverData);

        // Keep only last 200 hovers
        if (this.heatmapData.hovers.length > 200) {
            this.heatmapData.hovers = this.heatmapData.hovers.slice(-200);
        }
    }

    recordScrollDepth() {
        const scrollPercentage = this.calculateScrollPercentage();
        const currentUrl = window.location.pathname;
        
        if (!this.heatmapData.scrollDepth[currentUrl]) {
            this.heatmapData.scrollDepth[currentUrl] = {
                maxDepth: 0,
                milestones: []
            };
        }

        const urlData = this.heatmapData.scrollDepth[currentUrl];
        
        if (scrollPercentage > urlData.maxDepth) {
            urlData.maxDepth = scrollPercentage;
        }

        // Record milestones (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        milestones.forEach(milestone => {
            if (scrollPercentage >= milestone && !urlData.milestones.includes(milestone)) {
                urlData.milestones.push(milestone);
                this.recordConversionEvent('scroll-milestone', { percentage: milestone });
            }
        });
    }

    calculateScrollPercentage() {
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );

        const viewportHeight = window.innerHeight;
        const scrollTop = window.scrollY;

        return Math.round(((scrollTop + viewportHeight) / documentHeight) * 100);
    }

    setupJourneyTracking() {
        // Track page navigation
        this.trackPageView();

        // Listen for hash changes (single-page app navigation)
        window.addEventListener('hashchange', () => {
            this.trackPageView();
        });

        // Listen for navigation within CV sections
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('nav-item')) {
                this.trackJourneyStep('section-navigation', {
                    section: event.target.textContent,
                    target: event.target.href
                });
            }
        });
    }

    trackPageView() {
        const pageView = {
            url: window.location.href,
            pathname: window.location.pathname,
            hash: window.location.hash,
            referrer: document.referrer,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.session.startTime,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };

        this.session.pageViews.push(pageView);
        this.trackJourneyStep('page-view', pageView);
    }

    trackJourneyStep(type, data) {
        const step = {
            type: type,
            data: data,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.session.startTime,
            sequenceNumber: this.session.journey.length + 1
        };

        this.session.journey.push(step);
    }

    setupEngagementTracking() {
        // Track time on page
        this.timeTracker = {
            active: true,
            lastActiveTime: Date.now(),
            totalActiveTime: 0
        };

        // Update engagement metrics periodically
        setInterval(() => {
            this.updateTimeEngagement();
        }, 1000); // Update every second

        // Track engagement events
        this.setupEngagementEvents();
    }

    updateTimeEngagement() {
        if (this.timeTracker.active && !document.hidden) {
            const now = Date.now();
            const timeSpent = now - this.timeTracker.lastActiveTime;
            this.timeTracker.totalActiveTime += timeSpent;
            this.timeTracker.lastActiveTime = now;

            this.engagementMetrics.timeOnPage = this.timeTracker.totalActiveTime;
        }
    }

    pauseTimeTracking() {
        this.timeTracker.active = false;
    }

    resumeTimeTracking() {
        this.timeTracker.active = true;
        this.timeTracker.lastActiveTime = Date.now();
    }

    setupEngagementEvents() {
        // Track specific engagement actions
        const engagementSelectors = {
            'cv-download': 'a[href*="pdf"], button[id*="download"]',
            'contact-interaction': 'a[href^="mailto:"], a[href^="tel:"]',
            'social-link': 'a[href*="linkedin"], a[href*="github"]',
            'project-view': '.project-item, .project-card',
            'skill-interaction': '.skill-item, .skill-tag'
        };

        Object.entries(engagementSelectors).forEach(([eventType, selector]) => {
            document.addEventListener('click', (event) => {
                if (event.target.matches(selector) || event.target.closest(selector)) {
                    this.recordConversionEvent(eventType, {
                        target: event.target,
                        timestamp: Date.now()
                    });
                }
            });
        });
    }

    recordConversionEvent(type, data) {
        const event = {
            type: type,
            data: data,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.session.startTime
        };

        this.engagementMetrics.conversionEvents.push(event);
        this.trackJourneyStep('conversion', event);

        // Real-time processing for important conversions
        if (['cv-download', 'contact-interaction'].includes(type)) {
            this.processConversionRealTime(event);
        }
    }

    setupFeedbackWidgets() {
        // Create satisfaction feedback widget
        this.createSatisfactionWidget();

        // Create quick feedback buttons
        this.createQuickFeedbackButtons();

        // Create exit-intent feedback
        this.setupExitIntentFeedback();
    }

    createSatisfactionWidget() {
        const widget = document.createElement('div');
        widget.id = 'satisfaction-widget';
        widget.className = 'feedback-widget satisfaction-widget';
        widget.innerHTML = `
            <div class="widget-header">
                <h4>How would you rate this CV?</h4>
                <button class="widget-close">×</button>
            </div>
            <div class="rating-container">
                <div class="rating-stars">
                    ${[1, 2, 3, 4, 5].map(star => `
                        <button class="star-rating" data-rating="${star}">⭐</button>
                    `).join('')}
                </div>
                <textarea placeholder="Optional feedback..." class="feedback-text"></textarea>
                <button class="submit-feedback">Submit</button>
            </div>
        `;

        this.addFeedbackWidgetStyles();
        document.body.appendChild(widget);

        // Add event listeners
        widget.querySelector('.widget-close').addEventListener('click', () => {
            widget.style.display = 'none';
        });

        widget.querySelectorAll('.star-rating').forEach(star => {
            star.addEventListener('click', (event) => {
                this.handleSatisfactionRating(parseInt(event.target.dataset.rating));
            });
        });

        widget.querySelector('.submit-feedback').addEventListener('click', () => {
            this.submitSatisfactionFeedback(widget);
        });

        this.feedbackWidgets.set('satisfaction', widget);

        // Show widget after 30 seconds
        setTimeout(() => {
            this.showFeedbackWidget('satisfaction');
        }, 30000);
    }

    createQuickFeedbackButtons() {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'quick-feedback-buttons';
        buttonsContainer.className = 'feedback-widget quick-feedback';
        buttonsContainer.innerHTML = `
            <div class="quick-feedback-prompt">Was this helpful?</div>
            <div class="quick-feedback-buttons">
                <button class="feedback-btn positive" data-feedback="helpful">👍 Yes</button>
                <button class="feedback-btn negative" data-feedback="not-helpful">👎 No</button>
            </div>
        `;

        document.body.appendChild(buttonsContainer);

        buttonsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('feedback-btn')) {
                this.handleQuickFeedback(event.target.dataset.feedback);
                buttonsContainer.style.display = 'none';
            }
        });

        this.feedbackWidgets.set('quick', buttonsContainer);

        // Show after user scrolls 50%
        window.addEventListener('scroll', () => {
            if (this.calculateScrollPercentage() > 50) {
                this.showFeedbackWidget('quick');
            }
        }, { once: true });
    }

    setupExitIntentFeedback() {
        let exitIntentTriggered = false;

        document.addEventListener('mouseleave', (event) => {
            if (!exitIntentTriggered && event.clientY <= 0) {
                exitIntentTriggered = true;
                this.showExitIntentFeedback();
            }
        });
    }

    showExitIntentFeedback() {
        const modal = document.createElement('div');
        modal.id = 'exit-intent-modal';
        modal.className = 'feedback-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Before you go...</h3>
                <p>What could we improve about this CV?</p>
                <div class="improvement-options">
                    <button class="option-btn" data-option="design">Design</button>
                    <button class="option-btn" data-option="content">Content</button>
                    <button class="option-btn" data-option="navigation">Navigation</button>
                    <button class="option-btn" data-option="performance">Performance</button>
                    <button class="option-btn" data-option="other">Other</button>
                </div>
                <textarea placeholder="Additional comments..." class="exit-feedback-text"></textarea>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.feedback-modal').remove()">Skip</button>
                    <button class="btn-primary" onclick="window.uxFeedback.submitExitFeedback(this.closest('.feedback-modal'))">Submit</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.feedbackWidgets.set('exit-intent', modal);
    }

    addFeedbackWidgetStyles() {
        if (document.getElementById('feedback-widget-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'feedback-widget-styles';
        styles.textContent = `
            .feedback-widget {
                position: fixed;
                background: rgba(26, 26, 27, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 16px;
                font-family: Inter, sans-serif;
                color: #fff;
                backdrop-filter: blur(8px);
                z-index: 9999;
                display: none;
            }
            
            .satisfaction-widget {
                bottom: 20px;
                right: 20px;
                width: 320px;
            }
            
            .quick-feedback {
                bottom: 20px;
                left: 20px;
                padding: 12px 16px;
            }
            
            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .widget-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .widget-close {
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
            
            .rating-stars {
                display: flex;
                gap: 4px;
                margin-bottom: 12px;
            }
            
            .star-rating {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .star-rating:hover {
                transform: scale(1.1);
            }
            
            .star-rating.selected {
                filter: brightness(1.2);
            }
            
            .feedback-text {
                width: 100%;
                min-height: 60px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                padding: 8px;
                color: #fff;
                font-family: inherit;
                font-size: 13px;
                margin-bottom: 12px;
                resize: vertical;
            }
            
            .submit-feedback, .btn-primary {
                background: #2563eb;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                font-size: 13px;
            }
            
            .quick-feedback-prompt {
                font-size: 13px;
                margin-bottom: 8px;
                color: #a3a3a3;
            }
            
            .quick-feedback-buttons {
                display: flex;
                gap: 8px;
            }
            
            .feedback-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #fff;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .feedback-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .feedback-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .modal-content {
                background: #1a1a1b;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                color: #fff;
                font-family: Inter, sans-serif;
            }
            
            .modal-content h3 {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .modal-content p {
                margin: 0 0 16px 0;
                color: #a3a3a3;
                font-size: 14px;
            }
            
            .improvement-options {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 16px;
            }
            
            .option-btn {
                background: rgba(37, 99, 235, 0.1);
                border: 1px solid rgba(37, 99, 235, 0.3);
                color: #2563eb;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .option-btn:hover, .option-btn.selected {
                background: #2563eb;
                color: white;
            }
            
            .exit-feedback-text {
                width: 100%;
                min-height: 60px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                padding: 8px;
                color: #fff;
                font-family: inherit;
                font-size: 13px;
                margin-bottom: 16px;
                resize: vertical;
            }
            
            .modal-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            
            .btn-secondary {
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #a3a3a3;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
        `;

        document.head.appendChild(styles);
    }

    setupRealTimeAnalytics() {
        // Send data to analytics endpoint every 30 seconds
        setInterval(() => {
            this.sendAnalyticsUpdate();
        }, 30000);

        // Send critical events immediately
        this.setupRealTimeEventProcessing();
    }

    setupRealTimeEventProcessing() {
        // Set up WebSocket connection for real-time updates (if available)
        try {
            this.analyticsSocket = new WebSocket('ws://localhost:8080/analytics-ws');
            
            this.analyticsSocket.onopen = () => {
                console.log('📊 Real-time analytics connected');
            };

            this.analyticsSocket.onerror = () => {
                console.log('⚠️ Real-time analytics not available, using HTTP fallback');
            };
        } catch (error) {
            console.log('⚠️ WebSocket not supported, using HTTP analytics');
        }
    }

    processInteractionRealTime(interaction) {
        // Send important interactions immediately
        if (this.analyticsSocket && this.analyticsSocket.readyState === WebSocket.OPEN) {
            this.analyticsSocket.send(JSON.stringify({
                type: 'interaction',
                sessionId: this.session.id,
                data: interaction
            }));
        }
    }

    processConversionRealTime(conversion) {
        // Send conversion events immediately
        const data = {
            type: 'conversion',
            sessionId: this.session.id,
            data: conversion,
            timestamp: Date.now()
        };

        if (this.analyticsSocket && this.analyticsSocket.readyState === WebSocket.OPEN) {
            this.analyticsSocket.send(JSON.stringify(data));
        } else {
            // HTTP fallback
            this.sendToAnalyticsHTTP('conversion', data);
        }
    }

    async sendAnalyticsUpdate() {
        const analyticsData = {
            sessionId: this.session.id,
            timestamp: Date.now(),
            session: this.session,
            heatmap: this.heatmapData,
            engagement: this.engagementMetrics,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        await this.sendToAnalyticsHTTP('session-update', analyticsData);
    }

    async sendToAnalyticsHTTP(type, data) {
        try {
            await fetch(this.config.analyticsEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, data })
            });
        } catch (error) {
            console.warn('Analytics HTTP request failed:', error);
            // Store data locally for later sync
            this.storeDataLocally(type, data);
        }
    }

    storeDataLocally(type, data) {
        try {
            const stored = JSON.parse(localStorage.getItem(this.config.storageKey) || '[]');
            stored.push({ type, data, timestamp: Date.now() });
            
            // Keep only last 100 entries
            if (stored.length > 100) {
                stored.splice(0, stored.length - 100);
            }
            
            localStorage.setItem(this.config.storageKey, JSON.stringify(stored));
        } catch (error) {
            console.warn('Failed to store analytics data locally:', error);
        }
    }

    // Feedback widget event handlers
    handleSatisfactionRating(rating) {
        this.session.satisfaction = rating;
        
        // Highlight selected stars
        const widget = this.feedbackWidgets.get('satisfaction');
        const stars = widget.querySelectorAll('.star-rating');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });

        this.recordConversionEvent('satisfaction-rating', { rating });
    }

    submitSatisfactionFeedback(widget) {
        const rating = this.session.satisfaction;
        const feedbackText = widget.querySelector('.feedback-text').value;

        const feedback = {
            type: 'satisfaction-feedback',
            rating: rating,
            text: feedbackText,
            timestamp: Date.now(),
            sessionId: this.session.id
        };

        this.recordConversionEvent('feedback-submitted', feedback);
        this.sendToAnalyticsHTTP('feedback', feedback);

        widget.innerHTML = `
            <div class="widget-header">
                <h4>Thank you for your feedback!</h4>
                <button class="widget-close">×</button>
            </div>
        `;

        setTimeout(() => {
            widget.style.display = 'none';
        }, 3000);
    }

    handleQuickFeedback(feedback) {
        this.recordConversionEvent('quick-feedback', { feedback });
        this.sendToAnalyticsHTTP('quick-feedback', { 
            feedback, 
            sessionId: this.session.id,
            timestamp: Date.now()
        });
    }

    submitExitFeedback(modal) {
        const selectedOptions = Array.from(modal.querySelectorAll('.option-btn.selected'))
            .map(btn => btn.dataset.option);
        const feedbackText = modal.querySelector('.exit-feedback-text').value;

        const exitFeedback = {
            type: 'exit-feedback',
            improvements: selectedOptions,
            text: feedbackText,
            timestamp: Date.now(),
            sessionId: this.session.id
        };

        this.recordConversionEvent('exit-feedback-submitted', exitFeedback);
        this.sendToAnalyticsHTTP('exit-feedback', exitFeedback);

        modal.remove();
    }

    showFeedbackWidget(widgetName) {
        const widget = this.feedbackWidgets.get(widgetName);
        if (widget && getComputedStyle(widget).display === 'none') {
            widget.style.display = 'block';
        }
    }

    updateEngagementMetrics(interaction) {
        this.engagementMetrics.interactionCount++;
        
        if (interaction.type === 'scroll') {
            this.engagementMetrics.scrollPercentage = Math.max(
                this.engagementMetrics.scrollPercentage,
                interaction.scrollPercentage || 0
            );
        }
    }

    startTracking() {
        this.isTracking = true;
        console.log('📊 User experience tracking started');

        // Load any stored data and attempt to sync
        this.syncStoredData();
    }

    stopTracking() {
        this.isTracking = false;
        this.finalizeSession();
        console.log('⏹️ User experience tracking stopped');
    }

    async syncStoredData() {
        try {
            const stored = JSON.parse(localStorage.getItem(this.config.storageKey) || '[]');
            
            for (const item of stored) {
                await this.sendToAnalyticsHTTP(item.type, item.data);
            }

            // Clear stored data after successful sync
            localStorage.removeItem(this.config.storageKey);
        } catch (error) {
            console.warn('Failed to sync stored analytics data:', error);
        }
    }

    finalizeSession() {
        // Calculate final metrics
        this.updateTimeEngagement();
        
        this.session.endTime = Date.now();
        this.session.totalTime = this.session.endTime - this.session.startTime;
        this.session.activeTime = this.timeTracker.totalActiveTime;

        // Calculate bounce rate (session < 30 seconds with < 2 interactions)
        if (this.session.totalTime < 30000 && this.engagementMetrics.interactionCount < 2) {
            this.engagementMetrics.bounceRate = 1;
        }

        // Send final session data
        this.sendToAnalyticsHTTP('session-end', {
            sessionId: this.session.id,
            session: this.session,
            engagement: this.engagementMetrics,
            heatmap: this.heatmapData
        });
    }

    // Public API methods
    getSessionData() {
        return {
            session: this.session,
            heatmap: this.heatmapData,
            engagement: this.engagementMetrics
        };
    }

    getHeatmapData() {
        return this.heatmapData;
    }

    getEngagementMetrics() {
        return this.engagementMetrics;
    }

    generateAnalyticsReport() {
        return {
            sessionId: this.session.id,
            duration: Date.now() - this.session.startTime,
            interactions: this.session.interactions.length,
            pageViews: this.session.pageViews.length,
            journeySteps: this.session.journey.length,
            conversionEvents: this.engagementMetrics.conversionEvents.length,
            scrollDepth: this.engagementMetrics.scrollPercentage,
            satisfaction: this.session.satisfaction,
            heatmapPoints: {
                clicks: this.heatmapData.clicks.length,
                hovers: this.heatmapData.hovers.length,
                mouseMoves: this.heatmapData.mouseMoves.length
            }
        };
    }
}

// Initialize and expose globally
window.uxFeedback = new UserExperienceFeedbackLoop();

// Add event listeners for modal interactions
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('option-btn')) {
        event.target.classList.toggle('selected');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserExperienceFeedbackLoop;
}