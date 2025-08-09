/**
 * Advanced Personalization Engine - Intelligent User Experience Adaptation
 * 
 * Features:
 * - Behavioral pattern recognition
 * - Dynamic content adaptation
 * - Preference learning
 * - Contextual recommendations
 * - Performance-based optimization
 */

class PersonalizationEngine {
    constructor() {
        this.userProfile = {
            id: this.generateUserId(),
            preferences: {},
            behaviors: [],
            interactions: new Map(),
            sessionHistory: [],
            deviceInfo: this.getDeviceInfo(),
            accessibility: {},
            engagement: {
                totalTime: 0,
                sessionCount: 0,
                returnVisits: 0,
                contentInteractions: new Map()
            }
        };
        
        this.personalizationRules = new Map();
        this.contentVariants = new Map();
        this.adaptationState = {};
        this.learningModels = new Map();
        
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.setupPersonalizationRules();
        this.setupContentVariants();
        this.setupBehaviorTracking();
        this.initializeLearningModels();
        this.applyPersonalization();
        
        console.log('🎭 Personalization Engine initialized');
    }

    /**
     * Setup personalization rules based on user behavior patterns
     */
    setupPersonalizationRules() {
        // Rule: Fast browser - optimize for speed
        this.personalizationRules.set('fast_browser', {
            condition: (profile) => profile.behaviors.includes('quick_navigation'),
            action: () => this.enableSpeedOptimizations(),
            priority: 8
        });

        // Rule: Deep reader - enhance content experience
        this.personalizationRules.set('deep_reader', {
            condition: (profile) => {
                const avgTime = profile.engagement.totalTime / Math.max(profile.engagement.sessionCount, 1);
                return avgTime > 120000; // 2+ minutes average
            },
            action: () => this.enhanceContentExperience(),
            priority: 7
        });

        // Rule: Mobile user - optimize for touch
        this.personalizationRules.set('mobile_user', {
            condition: (profile) => profile.deviceInfo.isMobile,
            action: () => this.optimizeForMobile(),
            priority: 9
        });

        // Rule: Accessibility needs - enhance accessibility
        this.personalizationRules.set('accessibility_user', {
            condition: (profile) => Object.keys(profile.accessibility).length > 0,
            action: () => this.enhanceAccessibility(),
            priority: 10
        });

        // Rule: Technical visitor - show advanced features
        this.personalizationRules.set('technical_visitor', {
            condition: (profile) => this.isTechnicalUser(profile),
            action: () => this.showAdvancedFeatures(),
            priority: 6
        });

        // Rule: Returning visitor - personalize content
        this.personalizationRules.set('returning_visitor', {
            condition: (profile) => profile.engagement.returnVisits > 2,
            action: () => this.personalizeForReturningUser(),
            priority: 5
        });
    }

    /**
     * Setup content variants for different user types
     */
    setupContentVariants() {
        // Professional summary variants
        this.contentVariants.set('professional_summary', {
            'technical': 'AI Engineer and Software Architect with 15+ autonomous systems delivered, achieving 40% average efficiency gains through advanced ML implementations and distributed computing architectures.',
            'business': 'Results-driven AI Engineer with proven track record of delivering innovative technology solutions that drive business growth and operational excellence.',
            'creative': 'Innovative AI Engineer passionate about creating intelligent systems that solve real-world problems and enhance human potential through technology.',
            'default': 'AI Engineer and Software Architect specializing in autonomous systems, machine learning, and innovative technology solutions.'
        });

        // Call-to-action variants
        this.contentVariants.set('primary_cta', {
            'technical': 'Explore Technical Projects →',
            'business': 'View Business Results →',
            'creative': 'See Creative Solutions →',
            'default': 'Get In Touch →'
        });

        // Navigation emphasis variants
        this.contentVariants.set('nav_emphasis', {
            'technical': 'projects',
            'business': 'achievements',
            'creative': 'projects',
            'recruiter': 'experience',
            'default': 'about'
        });
    }

    /**
     * Setup behavior tracking for learning user patterns
     */
    setupBehaviorTracking() {
        // Track navigation patterns
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                this.trackBehavior('navigation_click', {
                    section: navItem.dataset.section,
                    timestamp: Date.now()
                });
            }
        });

        // Track reading patterns
        let readingTime = 0;
        let isReading = false;
        
        const trackReading = () => {
            if (!document.hidden && this.isUserActive()) {
                readingTime += 1000;
                isReading = true;
            } else {
                if (isReading && readingTime > 5000) { // 5+ seconds of reading
                    this.trackBehavior('deep_reading', {
                        duration: readingTime,
                        section: this.getCurrentSection(),
                        timestamp: Date.now()
                    });
                }
                readingTime = 0;
                isReading = false;
            }
        };

        setInterval(trackReading, 1000);

        // Track interaction patterns
        document.addEventListener('click', (e) => {
            const element = e.target;
            if (element.matches('.project-link, .contact-link, .tech-tag, .skill-item')) {
                this.trackBehavior('content_interaction', {
                    type: element.className,
                    content: element.textContent?.trim(),
                    timestamp: Date.now()
                });
            }
        });

        // Track scroll behavior
        let scrollStartTime = Date.now();
        let isScrolling = false;

        window.addEventListener('scroll', this.throttle(() => {
            if (!isScrolling) {
                scrollStartTime = Date.now();
                isScrolling = true;
            }
        }, 100));

        window.addEventListener('scrollend', () => {
            if (isScrolling) {
                const scrollDuration = Date.now() - scrollStartTime;
                if (scrollDuration > 2000) { // Long scroll session
                    this.trackBehavior('exploratory_scrolling', {
                        duration: scrollDuration,
                        timestamp: Date.now()
                    });
                }
                isScrolling = false;
            }
        });
    }

    /**
     * Initialize machine learning models for user behavior prediction
     */
    initializeLearningModels() {
        // Simple user type classification model
        this.learningModels.set('user_type_classifier', {
            features: ['session_duration', 'interaction_count', 'technical_clicks', 'scroll_depth'],
            classes: ['technical', 'business', 'creative', 'recruiter'],
            classify: (features) => this.classifyUserType(features)
        });

        // Content preference model
        this.learningModels.set('content_preference', {
            features: ['section_time', 'interaction_depth', 'return_patterns'],
            predict: (features) => this.predictContentPreferences(features)
        });
    }

    /**
     * Track user behavior and learn patterns
     */
    trackBehavior(behaviorType, data) {
        const behavior = {
            type: behaviorType,
            data,
            timestamp: Date.now(),
            sessionId: this.userProfile.sessionHistory[this.userProfile.sessionHistory.length - 1]?.sessionId
        };

        this.userProfile.behaviors.push(behavior);

        // Update interaction counts
        const key = `${behaviorType}_${data.section || data.type || 'general'}`;
        const currentCount = this.userProfile.interactions.get(key) || 0;
        this.userProfile.interactions.set(key, currentCount + 1);

        // Learn from behavior
        this.updateLearningModels(behavior);

        // Keep only recent behaviors
        if (this.userProfile.behaviors.length > 1000) {
            this.userProfile.behaviors.splice(0, this.userProfile.behaviors.length - 1000);
        }

        this.saveUserProfile();
    }

    /**
     * Update machine learning models with new behavior data
     */
    updateLearningModels(behavior) {
        // Update user type classification
        const features = this.extractUserFeatures();
        const userType = this.learningModels.get('user_type_classifier').classify(features);
        
        if (userType !== this.userProfile.preferences.user_type) {
            this.userProfile.preferences.user_type = userType;
            this.triggerPersonalizationUpdate();
        }

        // Update content preferences
        const contentPrefs = this.learningModels.get('content_preference').predict(features);
        this.userProfile.preferences.content = contentPrefs;
    }

    /**
     * Extract features for machine learning models
     */
    extractUserFeatures() {
        const recentBehaviors = this.userProfile.behaviors.slice(-50); // Last 50 behaviors
        const currentSession = this.getCurrentSessionData();

        return {
            session_duration: currentSession.duration,
            interaction_count: recentBehaviors.length,
            technical_clicks: recentBehaviors.filter(b => 
                b.data.content?.match(/python|javascript|ai|ml|docker|api/i)).length,
            scroll_depth: this.getAverageScrollDepth(),
            section_preferences: this.getSectionPreferences(),
            device_type: this.userProfile.deviceInfo.type,
            return_frequency: this.userProfile.engagement.returnVisits
        };
    }

    /**
     * Classify user type based on behavior patterns
     */
    classifyUserType(features) {
        // Simple rule-based classification (in production, use ML model)
        const score = {
            technical: 0,
            business: 0,
            creative: 0,
            recruiter: 0
        };

        // Technical indicators
        if (features.technical_clicks > 5) score.technical += 3;
        if (features.section_preferences.projects > 0.3) score.technical += 2;
        if (features.session_duration > 180000) score.technical += 1; // 3+ minutes

        // Business indicators
        if (features.section_preferences.achievements > 0.3) score.business += 3;
        if (features.interaction_count > 20) score.business += 2;
        if (features.return_frequency > 1) score.business += 1;

        // Creative indicators
        if (features.section_preferences.projects > 0.4) score.creative += 2;
        if (features.scroll_depth > 80) score.creative += 2;
        if (features.session_duration > 240000) score.creative += 1; // 4+ minutes

        // Recruiter indicators
        if (features.section_preferences.experience > 0.4) score.recruiter += 3;
        if (features.section_preferences.achievements > 0.2) score.recruiter += 2;
        if (features.session_duration < 120000 && features.interaction_count > 10) score.recruiter += 2;

        // Return highest scoring type
        return Object.entries(score).reduce((a, b) => score[a[0]] > score[b[0]] ? a : b)[0];
    }

    /**
     * Apply personalization based on user profile
     */
    applyPersonalization() {
        // Apply rules in priority order
        const applicableRules = Array.from(this.personalizationRules.entries())
            .filter(([id, rule]) => rule.condition(this.userProfile))
            .sort((a, b) => b[1].priority - a[1].priority);

        applicableRules.forEach(([id, rule]) => {
            try {
                rule.action();
                console.log(`🎯 Applied personalization rule: ${id}`);
            } catch (error) {
                console.warn(`Failed to apply rule ${id}:`, error);
            }
        });

        // Apply content variants
        this.applyContentVariants();

        // Apply layout adaptations
        this.applyLayoutAdaptations();
    }

    /**
     * Apply content variants based on user type
     */
    applyContentVariants() {
        const userType = this.userProfile.preferences.user_type || 'default';

        // Update professional summary
        const summaryElement = document.getElementById('professional-summary');
        if (summaryElement) {
            const variants = this.contentVariants.get('professional_summary');
            if (variants[userType]) {
                summaryElement.textContent = variants[userType];
            }
        }

        // Update primary CTA
        const ctaElements = document.querySelectorAll('.primary-cta');
        const ctaVariants = this.contentVariants.get('primary_cta');
        if (ctaVariants[userType]) {
            ctaElements.forEach(cta => {
                cta.textContent = ctaVariants[userType];
            });
        }

        // Emphasize preferred navigation
        const navEmphasis = this.contentVariants.get('nav_emphasis');
        if (navEmphasis[userType]) {
            const targetNav = document.querySelector(`[data-section="${navEmphasis[userType]}"]`);
            if (targetNav) {
                targetNav.classList.add('nav-emphasized');
            }
        }
    }

    /**
     * Apply layout adaptations based on preferences
     */
    applyLayoutAdaptations() {
        const userType = this.userProfile.preferences.user_type;
        const deviceInfo = this.userProfile.deviceInfo;

        // Technical users get expanded project details
        if (userType === 'technical') {
            document.body.classList.add('technical-layout');
            this.expandTechnicalContent();
        }

        // Business users get emphasized achievements
        if (userType === 'business') {
            document.body.classList.add('business-layout');
            this.emphasizeBusinessResults();
        }

        // Mobile users get optimized touch targets
        if (deviceInfo.isMobile) {
            document.body.classList.add('mobile-optimized');
            this.optimizeTouchTargets();
        }

        // Accessibility users get enhanced features
        if (Object.keys(this.userProfile.accessibility).length > 0) {
            this.applyAccessibilityEnhancements();
        }
    }

    /**
     * Personalization Actions
     */
    enableSpeedOptimizations() {
        // Reduce animations for fast browsers
        document.body.classList.add('speed-optimized');
        
        // Preload critical resources
        this.preloadCriticalResources();
        
        // Enable instant navigation
        this.enableInstantNavigation();
    }

    enhanceContentExperience() {
        // Add reading progress indicator
        this.addReadingProgress();
        
        // Enable expanded content sections
        document.body.classList.add('enhanced-content');
        
        // Add content recommendations
        this.addContentRecommendations();
    }

    optimizeForMobile() {
        // Enhance touch interactions
        document.body.classList.add('touch-optimized');
        
        // Optimize font sizes
        this.optimizeMobileFonts();
        
        // Enable swipe navigation
        this.enableSwipeNavigation();
    }

    enhanceAccessibility() {
        // Improve focus indicators
        document.body.classList.add('accessibility-enhanced');
        
        // Add skip navigation
        this.enhanceSkipNavigation();
        
        // Improve color contrast
        this.enhanceColorContrast();
    }

    showAdvancedFeatures() {
        // Show developer tools
        document.body.classList.add('advanced-features');
        
        // Enable debug information
        this.enableDebugInfo();
        
        // Show technical metrics
        this.showTechnicalMetrics();
    }

    personalizeForReturningUser() {
        // Welcome back message
        this.showWelcomeBackMessage();
        
        // Restore previous section
        this.restorePreviousSection();
        
        // Suggest new content
        this.suggestNewContent();
    }

    /**
     * Implementation helpers
     */
    expandTechnicalContent() {
        const techTags = document.querySelectorAll('.tech-tag');
        techTags.forEach(tag => {
            tag.classList.add('tech-tag-expanded');
            // Add proficiency indicators
            const proficiency = this.getTechProficiency(tag.textContent);
            if (proficiency > 0) {
                tag.setAttribute('data-proficiency', proficiency);
            }
        });
    }

    emphasizeBusinessResults() {
        const achievements = document.querySelectorAll('.achievement-card');
        achievements.forEach(card => {
            card.classList.add('achievement-emphasized');
        });
        
        // Highlight metrics
        const metrics = document.querySelectorAll('.metric-value');
        metrics.forEach(metric => {
            metric.classList.add('metric-highlighted');
        });
    }

    optimizeTouchTargets() {
        const interactiveElements = document.querySelectorAll('button, .nav-item, .contact-link, a');
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.height < 44 || rect.width < 44) {
                element.classList.add('touch-target-optimized');
            }
        });
    }

    addReadingProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="reading-progress-fill"></div>';
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', this.throttle(() => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            const fill = progressBar.querySelector('.reading-progress-fill');
            if (fill) {
                fill.style.width = Math.min(scrollPercent, 100) + '%';
            }
        }, 100));
    }

    enableInstantNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                const section = item.dataset.section;
                if (section) {
                    // Preload section content
                    this.preloadSection(section);
                }
            });
        });
    }

    showWelcomeBackMessage() {
        const lastVisit = this.userProfile.sessionHistory[this.userProfile.sessionHistory.length - 2];
        if (lastVisit) {
            const timeSince = Date.now() - lastVisit.endTime;
            const timeString = this.formatTimeSince(timeSince);
            
            this.showNotification(`Welcome back! Last visit: ${timeString}`, 'welcome');
        }
    }

    /**
     * Utility methods
     */
    getDeviceInfo() {
        return {
            type: this.getDeviceType(),
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
            connection: navigator.connection ? navigator.connection.effectiveType : 'unknown',
            memory: navigator.deviceMemory || 4,
            cores: navigator.hardwareConcurrency || 4
        };
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/tablet|ipad/i.test(ua)) return 'tablet';
        if (/mobile|phone/i.test(ua)) return 'mobile';
        return 'desktop';
    }

    getCurrentSection() {
        const activeNav = document.querySelector('.nav-item.active');
        return activeNav ? activeNav.dataset.section : 'about';
    }

    getCurrentSessionData() {
        const currentSession = this.userProfile.sessionHistory[this.userProfile.sessionHistory.length - 1];
        return {
            duration: currentSession ? Date.now() - currentSession.startTime : 0,
            interactions: this.userProfile.behaviors.filter(b => 
                b.sessionId === currentSession?.sessionId).length
        };
    }

    getSectionPreferences() {
        const sectionCounts = {};
        this.userProfile.behaviors
            .filter(b => b.type === 'navigation_click')
            .forEach(b => {
                const section = b.data.section;
                sectionCounts[section] = (sectionCounts[section] || 0) + 1;
            });

        const total = Object.values(sectionCounts).reduce((sum, count) => sum + count, 0);
        const preferences = {};
        
        Object.entries(sectionCounts).forEach(([section, count]) => {
            preferences[section] = total > 0 ? count / total : 0;
        });

        return preferences;
    }

    getAverageScrollDepth() {
        const scrollBehaviors = this.userProfile.behaviors.filter(b => b.type === 'scroll_milestone');
        if (scrollBehaviors.length === 0) return 0;
        
        const totalDepth = scrollBehaviors.reduce((sum, b) => sum + (b.data.depth || 0), 0);
        return totalDepth / scrollBehaviors.length;
    }

    isTechnicalUser(profile) {
        const technicalKeywords = ['python', 'javascript', 'ai', 'ml', 'docker', 'api', 'github'];
        const interactions = Array.from(profile.interactions.keys());
        
        return interactions.some(key => 
            technicalKeywords.some(keyword => key.toLowerCase().includes(keyword)));
    }

    isUserActive() {
        return Date.now() - (this.lastActivityTime || 0) < 5000; // 5 seconds
    }

    getTechProficiency(tech) {
        // Mock proficiency data - in production, load from actual data
        const proficiencies = {
            'Python': 95,
            'JavaScript': 90,
            'TypeScript': 85,
            'React': 85,
            'Node.js': 88,
            'Docker': 82,
            'Kubernetes': 75,
            'AI': 88,
            'ML': 85
        };
        return proficiencies[tech] || Math.floor(Math.random() * 40) + 60;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `personalization-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    formatTimeSince(ms) {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'moments ago';
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

    /**
     * Profile management
     */
    loadUserProfile() {
        const stored = localStorage.getItem('user_personalization_profile');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.userProfile = { ...this.userProfile, ...parsed };
                this.userProfile.interactions = new Map(parsed.interactions || []);
            } catch (error) {
                console.warn('Failed to load user profile:', error);
            }
        }

        // Start new session
        this.startNewSession();
    }

    saveUserProfile() {
        try {
            const profileToSave = {
                ...this.userProfile,
                interactions: Array.from(this.userProfile.interactions.entries())
            };
            localStorage.setItem('user_personalization_profile', JSON.stringify(profileToSave));
        } catch (error) {
            console.warn('Failed to save user profile:', error);
        }
    }

    startNewSession() {
        const sessionId = this.generateSessionId();
        const session = {
            sessionId,
            startTime: Date.now(),
            endTime: null,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            viewport: { width: window.innerWidth, height: window.innerHeight }
        };

        this.userProfile.sessionHistory.push(session);
        this.userProfile.engagement.sessionCount++;

        // Determine if this is a return visit
        if (this.userProfile.sessionHistory.length > 1) {
            this.userProfile.engagement.returnVisits++;
        }

        // Keep only recent sessions
        if (this.userProfile.sessionHistory.length > 50) {
            this.userProfile.sessionHistory.splice(0, this.userProfile.sessionHistory.length - 50);
        }

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            session.endTime = Date.now();
            this.userProfile.engagement.totalTime += session.endTime - session.startTime;
            this.saveUserProfile();
        });

        this.saveUserProfile();
    }

    generateUserId() {
        const stored = localStorage.getItem('user_personalization_id');
        if (stored) return stored;
        
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_personalization_id', userId);
        return userId;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Public API
     */
    getUserProfile() {
        return { ...this.userProfile };
    }

    setUserPreference(key, value) {
        this.userProfile.preferences[key] = value;
        this.saveUserProfile();
        this.triggerPersonalizationUpdate();
    }

    triggerPersonalizationUpdate() {
        setTimeout(() => {
            this.applyPersonalization();
        }, 100);
    }

    getPersonalizationInsights() {
        return {
            userType: this.userProfile.preferences.user_type,
            engagementLevel: this.calculateEngagementLevel(),
            preferredSections: this.getSectionPreferences(),
            deviceOptimizations: this.getDeviceOptimizations(),
            accessibilityNeeds: this.userProfile.accessibility,
            sessionStats: {
                totalSessions: this.userProfile.engagement.sessionCount,
                totalTime: this.userProfile.engagement.totalTime,
                returnVisits: this.userProfile.engagement.returnVisits
            }
        };
    }

    calculateEngagementLevel() {
        const avgSessionTime = this.userProfile.engagement.totalTime / Math.max(this.userProfile.engagement.sessionCount, 1);
        const interactionRate = this.userProfile.interactions.size / Math.max(this.userProfile.engagement.sessionCount, 1);
        
        if (avgSessionTime > 300000 && interactionRate > 10) return 'high';
        if (avgSessionTime > 120000 && interactionRate > 5) return 'medium';
        return 'low';
    }

    getDeviceOptimizations() {
        const optimizations = [];
        
        if (this.userProfile.deviceInfo.isMobile) {
            optimizations.push('mobile_touch_targets', 'mobile_fonts', 'swipe_navigation');
        }
        
        if (this.userProfile.deviceInfo.connection === '2g' || this.userProfile.deviceInfo.memory < 2) {
            optimizations.push('performance_mode', 'reduced_animations');
        }
        
        if (this.userProfile.deviceInfo.cores < 4) {
            optimizations.push('lightweight_effects');
        }
        
        return optimizations;
    }
}

// Add personalization styles
const personalizationStyles = `
    <style>
    /* Personalization Notification Styles */
    .personalization-notification {
        position: fixed;
        top: 20px;
        right: -300px;
        background: var(--color-background-card);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        padding: 1rem 1.5rem;
        max-width: 280px;
        z-index: var(--z-popover);
        box-shadow: var(--shadow-card);
        transition: right 0.3s ease;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
    }
    
    .personalization-notification.show {
        right: 20px;
    }
    
    .personalization-notification.welcome {
        border-left: 4px solid var(--color-primary);
    }
    
    /* Technical Layout Adaptations */
    .technical-layout .tech-tag-expanded {
        position: relative;
        padding-right: 2rem;
    }
    
    .technical-layout .tech-tag-expanded::after {
        content: attr(data-proficiency) '%';
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.75rem;
        color: var(--color-primary-light);
        font-weight: 600;
    }
    
    /* Business Layout Adaptations */
    .business-layout .achievement-emphasized {
        border-left: 3px solid var(--color-accent);
        background: linear-gradient(135deg, var(--color-background-card), rgba(16, 185, 129, 0.05));
    }
    
    .business-layout .metric-highlighted {
        color: var(--color-accent);
        font-weight: 700;
    }
    
    /* Navigation Emphasis */
    .nav-emphasized {
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) !important;
        color: white !important;
        box-shadow: var(--shadow-glow);
    }
    
    /* Touch Optimization */
    .touch-target-optimized {
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* Reading Progress */
    .reading-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: rgba(0, 0, 0, 0.1);
        z-index: var(--z-fixed);
    }
    
    .reading-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
        width: 0%;
        transition: width 0.3s ease;
    }
    
    /* Enhanced Content */
    .enhanced-content .section-content {
        max-width: 900px;
        margin: 0 auto;
    }
    
    .enhanced-content .competency-item,
    .enhanced-content .achievement-card {
        transition: all 0.3s ease;
    }
    
    .enhanced-content .competency-item:hover,
    .enhanced-content .achievement-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-elevated);
    }
    
    /* Speed Optimizations */
    .speed-optimized * {
        transition-duration: 0.1s !important;
        animation-duration: 0.2s !important;
    }
    
    /* Accessibility Enhancements */
    .accessibility-enhanced *:focus {
        outline: 3px solid var(--color-primary) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.3) !important;
    }
    
    .accessibility-enhanced .nav-item,
    .accessibility-enhanced .contact-link {
        border: 2px solid transparent;
        transition: border-color 0.2s ease;
    }
    
    .accessibility-enhanced .nav-item:focus,
    .accessibility-enhanced .contact-link:focus {
        border-color: var(--color-primary);
    }
    
    /* Advanced Features */
    .advanced-features .stat-item::before {
        content: '🔬';
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        font-size: 0.75rem;
        opacity: 0.6;
    }
    
    .advanced-features .timeline-content::after {
        content: 'Tech Details Available';
        position: absolute;
        bottom: 0.5rem;
        right: 0.5rem;
        font-size: 0.6rem;
        color: var(--color-text-muted);
        opacity: 0.8;
    }
    
    /* Mobile Specific */
    @media (max-width: 768px) {
        .personalization-notification {
            right: -250px;
            max-width: 240px;
            padding: 0.75rem 1rem;
            font-size: 0.8rem;
        }
        
        .personalization-notification.show {
            right: 10px;
        }
        
        .touch-target-optimized {
            padding: 0.75rem 1rem;
        }
    }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', personalizationStyles);

// Export for global access
window.PersonalizationEngine = PersonalizationEngine;