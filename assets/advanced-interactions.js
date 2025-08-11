/**
 * Advanced Micro-Interactions & Performance-Optimized UX Patterns
 * 
 * Features:
 * - Smooth micro-interactions
 * - Performance-aware animations
 * - Touch gesture recognition
 * - Progressive enhancement
 * - Loading state optimizations
 * - Error handling with graceful feedback
 * - Comprehensive user onboarding
 */

class AdvancedInteractionSystem {
    constructor() {
        this.config = {
            performance: {
                preferReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
                deviceMemory: navigator.deviceMemory || 4,
                connectionSpeed: this.getConnectionSpeed(),
                enabledInteractions: new Set()
            },
            gestures: {
                swipeThreshold: 80,
                longPressThreshold: 500,
                doubleTapThreshold: 300,
                pinchThreshold: 0.1
            },
            feedback: {
                hapticEnabled: 'vibrate' in navigator,
                soundEnabled: false,
                visualEnabled: true
            }
        };
        
        this.state = {
            isLoading: false,
            currentGesture: null,
            interactionQueue: [],
            performanceMode: this.detectPerformanceMode(),
            lastInteraction: Date.now()
        };
        
        this.gestureHandlers = new Map();
        this.interactionObserver = null;
        
        this.init();
    }

    init() {
        this.setupPerformanceOptimizations();
        this.setupMicroInteractions();
        this.setupGestureRecognition();
        this.setupLoadingStates();
        this.setupErrorHandling();
        this.setupProgressiveEnhancement();
        this.setupUserOnboarding();
        this.monitorPerformance();
        
        console.log('✨ Advanced Interaction System initialized');
    }

    /**
     * Setup performance-aware interaction system
     */
    setupPerformanceOptimizations() {
        // Determine which interactions to enable based on device capabilities
        const enabledInteractions = new Set();
        
        if (this.state.performanceMode === 'high') {
            enabledInteractions.add('complex-animations');
            enabledInteractions.add('particle-effects');
            enabledInteractions.add('parallax');
            enabledInteractions.add('morphing-shapes');
        }
        
        if (this.state.performanceMode === 'medium') {
            enabledInteractions.add('smooth-transitions');
            enabledInteractions.add('hover-effects');
            enabledInteractions.add('scroll-effects');
        }
        
        // Always enable basic interactions
        enabledInteractions.add('basic-feedback');
        enabledInteractions.add('focus-indicators');
        enabledInteractions.add('loading-states');
        
        this.config.performance.enabledInteractions = enabledInteractions;
        
        console.log(`🚀 Performance mode: ${this.state.performanceMode}`, 
                   `Enabled interactions:`, Array.from(enabledInteractions));
    }

    /**
     * Setup smooth micro-interactions
     */
    setupMicroInteractions() {
        this.setupButtonInteractions();
        this.setupCardInteractions();
        this.setupNavigationInteractions();
        this.setupScrollInteractions();
        this.setupHoverEffects();
        this.setupFocusAnimations();
    }

    setupButtonInteractions() {
        const buttons = document.querySelectorAll('button, .nav-item, .contact-link, .project-link, [role="button"]');
        
        buttons.forEach(button => {
            // Enhanced click feedback
            button.addEventListener('mousedown', (e) => this.handleButtonPress(e, button));
            button.addEventListener('mouseup', () => this.handleButtonRelease(button));
            button.addEventListener('mouseleave', () => this.handleButtonRelease(button));
            
            // Touch interactions
            button.addEventListener('touchstart', (e) => this.handleTouchStart(e, button), { passive: true });
            button.addEventListener('touchend', (e) => this.handleTouchEnd(e, button), { passive: true });
            
            // Keyboard interactions
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.handleButtonPress(e, button);
                }
            });
            
            button.addEventListener('keyup', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.handleButtonRelease(button);
                }
            });
            
            // Add ripple effect capability
            if (this.config.performance.enabledInteractions.has('smooth-transitions')) {
                this.makeRippleable(button);
            }
        });
    }

    setupCardInteractions() {
        const cards = document.querySelectorAll('.project-card, .achievement-card, .timeline-content, .competency-item');
        
        cards.forEach(card => {
            // Hover tilt effect for high-performance devices
            if (this.config.performance.enabledInteractions.has('complex-animations')) {
                this.setupTiltEffect(card);
            }
            
            // Click feedback
            card.addEventListener('click', (e) => this.handleCardClick(e, card));
            
            // Intersection-based reveal animations
            if (this.interactionObserver) {
                this.interactionObserver.observe(card);
            }
        });
    }

    setupNavigationInteractions() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            // Enhanced navigation feedback
            item.addEventListener('click', (e) => this.handleNavigation(e, item));
            
            // Progress indicators
            this.createNavProgressIndicator(item);
        });
        
        // Smooth scroll to sections
        this.setupSmoothScrolling();
    }

    setupScrollInteractions() {
        let scrollTimeout;
        let isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                this.handleScrollStart();
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                this.handleScrollEnd();
            }, 150);
            
            this.updateScrollProgress();
        }, { passive: true });
        
        // Parallax effects for high-performance devices
        if (this.config.performance.enabledInteractions.has('parallax')) {
            this.setupParallaxEffects();
        }
    }

    setupHoverEffects() {
        if (!this.config.performance.enabledInteractions.has('hover-effects')) return;
        
        const hoverElements = document.querySelectorAll('.tech-tag, .interest-tag, .contact-link, .project-link');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => this.handleHoverStart(e, element));
            element.addEventListener('mouseleave', (e) => this.handleHoverEnd(e, element));
            element.addEventListener('mousemove', (e) => this.handleHoverMove(e, element));
        });
    }

    setupFocusAnimations() {
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        
        focusableElements.forEach(element => {
            element.addEventListener('focusin', (e) => this.handleFocusIn(e, element));
            element.addEventListener('focusout', (e) => this.handleFocusOut(e, element));
        });
    }

    /**
     * Gesture recognition system
     */
    setupGestureRecognition() {
        this.setupSwipeGestures();
        this.setupPinchGestures();
        this.setupLongPressGestures();
        this.setupDoubleTapGestures();
    }

    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (e.changedTouches.length !== 1) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            
            // Check for swipe
            if (Math.abs(deltaX) > this.config.gestures.swipeThreshold && 
                deltaTime < 500 && 
                Math.abs(deltaX) > Math.abs(deltaY * 2)) {
                
                const direction = deltaX > 0 ? 'right' : 'left';
                this.handleSwipe(direction, { deltaX, deltaY, deltaTime });
            }
        }, { passive: true });
    }

    setupPinchGestures() {
        let initialDistance = 0;
        let currentScale = 1;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialDistance;
                
                if (Math.abs(scale - currentScale) > this.config.gestures.pinchThreshold) {
                    currentScale = scale;
                    this.handlePinch(scale, e);
                }
            }
        }, { passive: true });
    }

    setupLongPressGestures() {
        let pressTimeout;
        let isLongPress = false;
        
        document.addEventListener('touchstart', (e) => {
            isLongPress = false;
            pressTimeout = setTimeout(() => {
                isLongPress = true;
                this.handleLongPress(e);
            }, this.config.gestures.longPressThreshold);
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            clearTimeout(pressTimeout);
        }, { passive: true });
        
        document.addEventListener('touchmove', () => {
            clearTimeout(pressTimeout);
        }, { passive: true });
    }

    setupDoubleTapGestures() {
        let lastTap = 0;
        let tapCount = 0;
        
        document.addEventListener('touchend', (e) => {
            const currentTime = Date.now();
            
            if (currentTime - lastTap < this.config.gestures.doubleTapThreshold) {
                tapCount++;
                if (tapCount === 2) {
                    this.handleDoubleTap(e);
                    tapCount = 0;
                }
            } else {
                tapCount = 1;
            }
            
            lastTap = currentTime;
        }, { passive: true });
    }

    /**
     * Loading state management
     */
    setupLoadingStates() {
        this.createLoadingIndicators();
        this.setupAsyncLoadingFeedback();
        this.setupProgressiveContentLoading();
    }

    createLoadingIndicators() {
        // Skeleton screens for initial load
        this.createSkeletonScreens();
        
        // Loading spinners for actions
        this.createActionSpinners();
        
        // Progress bars for file operations
        this.createProgressBars();
    }

    createSkeletonScreens() {
        const sections = document.querySelectorAll('.section-content');
        
        sections.forEach(section => {
            const skeleton = this.createSkeletonForContent(section);
            section.appendChild(skeleton);
            skeleton.style.display = 'none';
        });
    }

    setupAsyncLoadingFeedback() {
        // Intercept fetch requests to show loading states
        const originalFetch = window.fetch;
        
        window.fetch = (...args) => {
            this.showLoadingState();
            
            return originalFetch.apply(this, args)
                .then(response => {
                    this.hideLoadingState();
                    return response;
                })
                .catch(error => {
                    this.hideLoadingState();
                    this.showErrorState(error);
                    throw error;
                });
        };
    }

    setupProgressiveContentLoading() {
        // Load content in priority order
        this.loadCriticalContent();
        
        setTimeout(() => {
            this.loadSecondaryContent();
        }, 100);
        
        setTimeout(() => {
            this.loadEnhancementContent();
        }, 500);
    }

    /**
     * Error handling with user feedback
     */
    setupErrorHandling() {
        // Global error handling
        window.addEventListener('error', (e) => this.handleGlobalError(e));
        window.addEventListener('unhandledrejection', (e) => this.handleUnhandledRejection(e));
        
        // Network error handling
        window.addEventListener('offline', () => this.handleOffline());
        window.addEventListener('online', () => this.handleOnline());
        
        // User-friendly error messages
        this.setupUserErrorFeedback();
    }

    setupUserErrorFeedback() {
        // Create error notification system
        const errorContainer = document.createElement('div');
        errorContainer.id = 'error-notifications';
        errorContainer.className = 'error-notifications';
        document.body.appendChild(errorContainer);
    }

    /**
     * Progressive enhancement patterns
     */
    setupProgressiveEnhancement() {
        // Feature detection and enhancement
        this.enhanceBasedOnCapabilities();
        
        // Graceful degradation for older browsers
        this.setupGracefulDegradation();
        
        // Service worker integration
        this.setupServiceWorkerEnhancements();
    }

    enhanceBasedOnCapabilities() {
        // Intersection Observer
        if ('IntersectionObserver' in window) {
            this.interactionObserver = new IntersectionObserver(this.handleIntersection.bind(this));
        }
        
        // Web Animations API
        if ('animate' in Element.prototype) {
            this.config.performance.enabledInteractions.add('web-animations');
        }
        
        // CSS Custom Properties
        if (CSS.supports('color', 'var(--test)')) {
            this.config.performance.enabledInteractions.add('css-variables');
        }
        
        // Touch events
        if ('ontouchstart' in window) {
            this.config.performance.enabledInteractions.add('touch-gestures');
            document.body.classList.add('touch-device');
        }
    }

    /**
     * User onboarding system
     */
    setupUserOnboarding() {
        if (this.isFirstVisit()) {
            setTimeout(() => {
                this.startOnboarding();
            }, 2000);
        }
    }

    startOnboarding() {
        const onboardingSteps = [
            {
                target: '.header',
                title: 'Welcome to Adrian\'s CV',
                content: 'This is an interactive CV with live statistics and dynamic content.',
                position: 'bottom'
            },
            {
                target: '.navigation',
                title: 'Easy Navigation',
                content: 'Use these tabs to explore different sections. Try swiping on mobile!',
                position: 'bottom'
            },
            {
                target: '.live-stats',
                title: 'Live Statistics',
                content: 'These stats update automatically based on real GitHub activity.',
                position: 'bottom'
            },
            {
                target: '.contact-links',
                title: 'Get in Touch',
                content: 'Ready to connect? Use these links to reach out directly.',
                position: 'top'
            }
        ];
        
        this.createOnboardingTour(onboardingSteps);
    }

    createOnboardingTour(steps) {
        let currentStep = 0;
        
        const showStep = (stepIndex) => {
            if (stepIndex >= steps.length) {
                this.completeOnboarding();
                return;
            }
            
            const step = steps[stepIndex];
            const target = document.querySelector(step.target);
            
            if (!target) {
                showStep(stepIndex + 1);
                return;
            }
            
            this.showOnboardingStep(step, target, () => {
                showStep(stepIndex + 1);
            });
        };
        
        showStep(0);
    }

    /**
     * Interaction handlers
     */
    
    handleButtonPress(event, button) {
        if (this.config.performance.preferReducedMotion) return;
        
        // Visual feedback
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease';
        
        // Haptic feedback
        if (this.config.feedback.hapticEnabled && event.type === 'touchstart') {
            navigator.vibrate(10);
        }
        
        // Ripple effect
        if (this.config.performance.enabledInteractions.has('smooth-transitions')) {
            this.createRipple(event, button);
        }
    }

    handleButtonRelease(button) {
        button.style.transform = '';
        button.style.transition = 'transform 0.15s ease';
    }

    handleTouchStart(event, element) {
        this.state.lastInteraction = Date.now();
        this.addTouchVisualFeedback(element);
    }

    handleTouchEnd(event, element) {
        this.removeTouchVisualFeedback(element);
    }

    handleCardClick(event, card) {
        if (this.config.performance.enabledInteractions.has('smooth-transitions')) {
            this.animateCardClick(card);
        }
        
        // Track interaction
        this.trackInteraction('card_click', {
            cardType: card.className,
            timestamp: Date.now()
        });
    }

    handleNavigation(event, navItem) {
        // Show loading state
        this.showNavigationLoading(navItem);
        
        // Smooth transition
        setTimeout(() => {
            this.hideNavigationLoading(navItem);
            this.showNavigationSuccess(navItem);
        }, 150);
    }

    handleSwipe(direction, details) {
        console.log(`👆 Swipe ${direction} detected`, details);
        
        if (direction === 'left') {
            this.navigateToNextSection();
        } else if (direction === 'right') {
            this.navigateToPreviousSection();
        }
        
        this.showSwipeIndicator(direction);
    }

    handlePinch(scale, event) {
        console.log(`🤏 Pinch detected: ${scale}x`);
        
        if (scale > 1.5) {
            this.handleZoomIn(event);
        } else if (scale < 0.7) {
            this.handleZoomOut(event);
        }
    }

    handleLongPress(event) {
        console.log('👆 Long press detected');
        
        const target = event.target.closest('.project-card, .achievement-card, .contact-link');
        if (target) {
            this.showContextMenu(event, target);
        }
        
        // Haptic feedback
        if (this.config.feedback.hapticEnabled) {
            navigator.vibrate([50, 30, 50]);
        }
    }

    handleDoubleTap(event) {
        console.log('👆👆 Double tap detected');
        
        // Zoom to section or toggle details
        const section = event.target.closest('.section');
        if (section) {
            this.toggleSectionFocus(section);
        }
    }

    handleHoverStart(event, element) {
        if (this.config.performance.enabledInteractions.has('hover-effects')) {
            this.startHoverAnimation(element);
        }
    }

    handleHoverEnd(event, element) {
        if (this.config.performance.enabledInteractions.has('hover-effects')) {
            this.endHoverAnimation(element);
        }
    }

    handleHoverMove(event, element) {
        if (this.config.performance.enabledInteractions.has('complex-animations')) {
            this.updateHoverPosition(event, element);
        }
    }

    handleFocusIn(event, element) {
        this.showEnhancedFocus(element);
        this.announceToScreenReader(`Focused on ${this.getElementDescription(element)}`);
    }

    handleFocusOut(event, element) {
        this.hideEnhancedFocus(element);
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.animateElementEntry(entry.target);
            }
        });
    }

    /**
     * Animation and visual feedback methods
     */
    
    createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX || event.touches?.[0]?.clientX) - rect.left;
        const y = (event.clientY || event.touches?.[0]?.clientY) - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        // Animate the ripple
        if (this.config.performance.enabledInteractions.has('web-animations')) {
            ripple.animate([
                { transform: 'scale(0)', opacity: 1 },
                { transform: 'scale(4)', opacity: 0 }
            ], {
                duration: 300,
                easing: 'ease-out'
            }).onfinish = () => ripple.remove();
        } else {
            setTimeout(() => ripple.remove(), 300);
        }
    }

    setupTiltEffect(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);
            
            const tiltX = deltaY * -10; // Inverted for natural feeling
            const tiltY = deltaX * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    }

    animateElementEntry(element) {
        if (this.config.performance.preferReducedMotion) return;
        
        if (this.config.performance.enabledInteractions.has('web-animations')) {
            element.animate([
                { opacity: 0, transform: 'translateY(20px)' },
                { opacity: 1, transform: 'translateY(0px)' }
            ], {
                duration: 400,
                easing: 'ease-out',
                fill: 'forwards'
            });
        } else {
            element.style.animation = 'fadeInUp 400ms ease-out forwards';
        }
    }

    showLoadingState() {
        this.state.isLoading = true;
        document.body.classList.add('loading-state');
        
        // Show skeleton screens
        document.querySelectorAll('.skeleton-screen').forEach(skeleton => {
            skeleton.style.display = 'block';
        });
    }

    hideLoadingState() {
        this.state.isLoading = false;
        document.body.classList.remove('loading-state');
        
        // Hide skeleton screens
        document.querySelectorAll('.skeleton-screen').forEach(skeleton => {
            skeleton.style.display = 'none';
        });
    }

    showErrorState(error) {
        const notification = this.createErrorNotification(error.message || 'An error occurred');
        document.getElementById('error-notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Utility methods
     */
    
    detectPerformanceMode() {
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const connection = navigator.connection?.effectiveType;
        
        if (memory >= 8 && cores >= 8 && (!connection || connection === '4g')) {
            return 'high';
        } else if (memory >= 4 && cores >= 4) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    getConnectionSpeed() {
        const connection = navigator.connection;
        if (!connection) return 'unknown';
        
        return {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
        };
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    trackInteraction(type, data) {
        if (window.uxOptimization?.analytics) {
            window.uxOptimization.analytics.trackEvent('interaction', { type, ...data });
        }
    }

    announceToScreenReader(message) {
        if (window.accessibilityEnhancer) {
            window.accessibilityEnhancer.announce(message);
        }
    }

    isFirstVisit() {
        return !localStorage.getItem('cv_visited');
    }

    completeOnboarding() {
        localStorage.setItem('cv_visited', 'true');
        localStorage.setItem('onboarding_completed', Date.now().toString());
    }

    monitorPerformance() {
        // Monitor frame rate
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkPerformance = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30 && this.state.performanceMode === 'high') {
                    this.degradePerformance();
                } else if (fps > 50 && this.state.performanceMode === 'medium') {
                    this.enhancePerformance();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkPerformance);
        };
        
        requestAnimationFrame(checkPerformance);
    }

    degradePerformance() {
        this.state.performanceMode = 'medium';
        this.config.performance.enabledInteractions.delete('complex-animations');
        this.config.performance.enabledInteractions.delete('particle-effects');
        console.log('🐌 Performance degraded to medium mode');
    }

    enhancePerformance() {
        this.state.performanceMode = 'high';
        this.config.performance.enabledInteractions.add('complex-animations');
        this.config.performance.enabledInteractions.add('hover-effects');
        console.log('🚀 Performance enhanced to high mode');
    }

    // Export public API
    getInteractionState() {
        return {
            performanceMode: this.state.performanceMode,
            enabledInteractions: Array.from(this.config.performance.enabledInteractions),
            isLoading: this.state.isLoading,
            lastInteraction: this.state.lastInteraction
        };
    }
}

// Add interaction styles
const interactionStyles = `
<style>
/* Ripple Effect */
.ripple-effect {
    position: absolute;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
    animation: rippleAnimation 300ms ease-out;
    width: 20px;
    height: 20px;
    margin-left: -10px;
    margin-top: -10px;
}

@keyframes rippleAnimation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

/* Loading States */
.loading-state .skeleton-screen {
    display: block !important;
}

.skeleton-screen {
    background: linear-gradient(90deg, 
        var(--color-surface) 25%, 
        var(--color-surface-hover) 50%, 
        var(--color-surface) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: var(--radius-md);
    height: 20px;
    margin: 10px 0;
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Touch Feedback */
.touch-feedback {
    background: rgba(255, 255, 255, 0.1) !important;
    transform: scale(0.95) !important;
}

/* Enhanced Focus */
.enhanced-focus {
    outline: 3px solid var(--color-primary) !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2) !important;
    border-radius: var(--radius-sm) !important;
}

/* Hover Animations */
.hover-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3) !important;
    transform: translateY(-2px) !important;
}

/* Error Notifications */
.error-notifications {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: var(--z-tooltip);
    max-width: 300px;
}

.error-notification {
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    margin-bottom: 10px;
    box-shadow: var(--shadow-lg);
    animation: slideInRight 300ms ease;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Onboarding Styles */
.onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
}

.onboarding-tooltip {
    background: var(--color-background-card);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 20px;
    max-width: 300px;
    box-shadow: var(--shadow-elevated);
    position: absolute;
    z-index: var(--z-tooltip);
}

.onboarding-tooltip::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 10px solid transparent;
}

.onboarding-tooltip.bottom::after {
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--color-background-card);
}

.onboarding-tooltip.top::after {
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--color-background-card);
}

/* Swipe Indicator */
.swipe-indicator {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-primary);
    color: white;
    padding: 8px 16px;
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    z-index: var(--z-popover);
    animation: swipeIndication 2s ease-in-out;
}

@keyframes swipeIndication {
    0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
    10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Performance Optimizations */
.performance-mode-low * {
    animation-duration: 0.1s !important;
    transition-duration: 0.1s !important;
}

.performance-mode-low .ripple-effect,
.performance-mode-low .particle-effects,
.performance-mode-low .complex-animation {
    display: none !important;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
    .ripple-effect,
    .skeleton-screen,
    .hover-glow {
        animation: none !important;
        transition: none !important;
    }
}

/* High Contrast Support */
@media (prefers-contrast: high) {
    .ripple-effect {
        background: #ffffff !important;
    }
    
    .enhanced-focus {
        outline: 4px solid #ffffff !important;
        box-shadow: 0 0 0 8px #000000 !important;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', interactionStyles);

// Export for global access
window.AdvancedInteractionSystem = AdvancedInteractionSystem;