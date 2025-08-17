/**
 * Mobile Touch Enhancements & Micro-Interactions
 * Optimized for 60fps performance and delightful user experience
 * Targets: Mobile Experience 95+/100, Core Web Vitals "Good" thresholds
 */

class MobileTouchEnhancements {
    constructor() {
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.viewportHeight = window.innerHeight;
        this.observers = [];
        this.rafId = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Mobile Touch Enhancements');
        
        if (this.isTouch) {
            document.documentElement.classList.add('touch-device');
            console.log('📱 Touch device detected');
        }
        
        this.setupViewportFix();
        this.setupTouchFeedback();
        this.setupMagneticEffects();
        this.setupScrollEnhancements();
        this.setupGestureHandling();
        this.setupPerformanceOptimizations();
        this.setupMicroInteractions();
        
        console.log('✅ Mobile Touch Enhancements initialized');
    }

    /**
     * Fix viewport height on mobile devices
     */
    setupViewportFix() {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight, { passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        }, { passive: true });
    }

    /**
     * Enhanced touch feedback with haptic-like response
     */
    setupTouchFeedback() {
        const touchElements = document.querySelectorAll(
            '.nav-item, .contact-link, .project-card, .stat-item, .skill-item, .achievement-card'
        );
        
        touchElements.forEach(element => {
            // Make element a ripple container
            element.classList.add('ripple-container');
            
            // Touch start - immediate feedback
            element.addEventListener('touchstart', (e) => {
                this.handleTouchStart(e, element);
            }, { passive: true });
            
            // Touch end - release feedback
            element.addEventListener('touchend', () => {
                this.handleTouchEnd(element);
            }, { passive: true });
            
            // Touch cancel - cleanup
            element.addEventListener('touchcancel', () => {
                this.handleTouchEnd(element);
            }, { passive: true });
        });
    }

    handleTouchStart(event, element) {
        // Scale down effect
        element.style.transform = 'scale(0.96)';
        element.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Create ripple effect
        if (event.touches && event.touches[0]) {
            this.createRippleEffect(event.touches[0], element);
        }
        
        // Add active class
        element.classList.add('touch-active');
    }

    handleTouchEnd(element) {
        // Release scale effect
        element.style.transform = '';
        element.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        // Remove active class
        setTimeout(() => {
            element.classList.remove('touch-active');
        }, 200);
    }

    createRippleEffect(touch, element) {
        const rect = element.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 1000;
        `;
        
        element.appendChild(ripple);
        
        // Animate ripple
        requestAnimationFrame(() => {
            ripple.style.animation = 'ripple 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }

    /**
     * Magnetic hover effects for desktop/trackpad
     */
    setupMagneticEffects() {
        if (this.isTouch) return; // Skip on touch devices
        
        const magneticElements = document.querySelectorAll('.contact-link, .project-card');
        
        magneticElements.forEach(element => {
            element.classList.add('magnetic');
            
            let isHovering = false;
            
            element.addEventListener('mouseenter', () => {
                isHovering = true;
                element.style.setProperty('--magnetic-x', '0px');
                element.style.setProperty('--magnetic-y', '0px');
            });
            
            element.addEventListener('mousemove', (e) => {
                if (!isHovering) return;
                
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) * 0.15;
                const deltaY = (e.clientY - centerY) * 0.15;
                
                element.style.setProperty('--magnetic-x', `${deltaX}px`);
                element.style.setProperty('--magnetic-y', `${deltaY}px`);
            });
            
            element.addEventListener('mouseleave', () => {
                isHovering = false;
                element.style.setProperty('--magnetic-x', '0px');
                element.style.setProperty('--magnetic-y', '0px');
            });
        });
    }

    /**
     * Enhanced scroll behavior for mobile
     */
    setupScrollEnhancements() {
        // Smooth momentum scrolling for iOS
        if (this.isIOS) {
            document.documentElement.style.webkitOverflowScrolling = 'touch';
        }
        
        // Optimize navigation scrolling
        const navigation = document.querySelector('.nav-items');
        if (navigation) {
            navigation.style.webkitOverflowScrolling = 'touch';
            navigation.style.scrollbarWidth = 'none';
            navigation.style.msOverflowStyle = 'none';
        }
        
        // Scroll snap for sections
        this.setupScrollSnap();
        
        // Prevent overscroll bounce
        this.preventOverscrollBounce();
    }

    setupScrollSnap() {
        const sections = document.querySelectorAll('.section');
        if (sections.length > 0) {
            sections.forEach(section => {
                section.style.scrollMarginTop = '80px';
            });
        }
    }

    preventOverscrollBounce() {
        let startY = 0;
        let isAtTop = false;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
            isAtTop = window.scrollY === 0;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].pageY;
            
            // Prevent pull-to-refresh when at top
            if (isAtTop && currentY > startY + 5) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Advanced gesture handling
     */
    setupGestureHandling() {
        let startX = 0;
        let startY = 0;
        let currentSection = 0;
        const sections = document.querySelectorAll('.section');
        
        // Swipe navigation between sections
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Only handle horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next section
                    this.navigateToNextSection();
                } else {
                    // Swipe right - previous section
                    this.navigateToPreviousSection();
                }
            }
        }, { passive: true });
        
        // Double tap to scroll to top
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                this.scrollToTop();
            }
            
            lastTap = currentTime;
        }, { passive: false });
    }

    navigateToNextSection() {
        const navItems = document.querySelectorAll('.nav-item');
        const currentActive = document.querySelector('.nav-item.active');
        
        if (currentActive) {
            const currentIndex = Array.from(navItems).indexOf(currentActive);
            const nextIndex = (currentIndex + 1) % navItems.length;
            
            if (navItems[nextIndex]) {
                navItems[nextIndex].click();
                this.showNavigationFeedback('next');
            }
        }
    }

    navigateToPreviousSection() {
        const navItems = document.querySelectorAll('.nav-item');
        const currentActive = document.querySelector('.nav-item.active');
        
        if (currentActive) {
            const currentIndex = Array.from(navItems).indexOf(currentActive);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
            
            if (navItems[prevIndex]) {
                navItems[prevIndex].click();
                this.showNavigationFeedback('prev');
            }
        }
    }

    showNavigationFeedback(direction) {
        // Visual feedback for swipe navigation
        const feedback = document.createElement('div');
        feedback.className = 'swipe-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            ${direction === 'next' ? 'right: 20px' : 'left: 20px'};
            transform: translateY(-50%);
            background: rgba(59, 130, 246, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            animation: swipeFeedback 0.8s ease-out;
        `;
        feedback.textContent = direction === 'next' ? '→' : '←';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 800);
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Show feedback
        const feedback = document.createElement('div');
        feedback.className = 'scroll-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            animation: scrollFeedback 1s ease-out;
        `;
        feedback.textContent = '↑ Scrolled to top';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }

    /**
     * Performance optimizations
     */
    setupPerformanceOptimizations() {
        // Passive event listeners for better scroll performance
        document.addEventListener('touchmove', () => {}, { passive: true });
        document.addEventListener('wheel', () => {}, { passive: true });
        
        // Optimize animations for 60fps
        this.setupRAFOptimizations();
        
        // Preload critical elements
        this.preloadCriticalElements();
    }

    setupRAFOptimizations() {
        let ticking = false;
        
        const updateAnimations = () => {
            // Update any continuous animations here
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateAnimations);
                ticking = true;
            }
        };
        
        // Throttle scroll events
        window.addEventListener('scroll', requestTick, { passive: true });
    }

    preloadCriticalElements() {
        const criticalImages = document.querySelectorAll('img[data-critical]');
        criticalImages.forEach(img => {
            if (!img.src && img.dataset.src) {
                img.src = img.dataset.src;
            }
        });
    }

    /**
     * Delightful micro-interactions
     */
    setupMicroInteractions() {
        this.setupLoadingAnimations();
        this.setupHoverEnhancements();
        this.setupFocusEnhancements();
        this.setupScrollAnimations();
    }

    setupLoadingAnimations() {
        // Staggered entrance animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const animateOnScroll = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.classList.add('animate-in');
                    animateOnScroll.unobserve(element);
                }
            });
        }, observerOptions);
        
        // Observe elements for scroll animations
        const animatableElements = document.querySelectorAll(
            '.stat-item, .timeline-item, .project-card, .achievement-card'
        );
        
        animatableElements.forEach((element, index) => {
            element.style.setProperty('--animation-delay', `${index * 0.1}s`);
            animateOnScroll.observe(element);
        });
        
        this.observers.push(animateOnScroll);
    }

    setupHoverEnhancements() {
        if (this.isTouch) return; // Skip hover effects on touch devices
        
        const hoverElements = document.querySelectorAll('.project-card, .achievement-card');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.classList.add('floating');
            });
            
            element.addEventListener('mouseleave', () => {
                element.classList.remove('floating');
            });
        });
    }

    setupFocusEnhancements() {
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Focus trap for modal-like elements
        this.setupFocusTrapping();
    }

    setupFocusTrapping() {
        const focusableElements = 'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select';
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active, .overlay.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                }
            }
        });
    }

    setupScrollAnimations() {
        // Parallax-like scroll effects for hero section
        let ticking = false;
        
        const updateScrollEffects = () => {
            const scrollY = window.scrollY;
            const header = document.querySelector('.header');
            
            if (header) {
                const opacity = Math.max(0, 1 - scrollY / 300);
                header.style.setProperty('--scroll-opacity', opacity);
            }
            
            ticking = false;
        };
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        console.log('🧹 Mobile Touch Enhancements cleaned up');
    }
}

// Add required CSS animations
const touchStyle = document.createElement('style');
touchStyle.textContent = `
    @keyframes swipeFeedback {
        0% { transform: translateY(-50%) scale(0.5); opacity: 0; }
        50% { transform: translateY(-50%) scale(1.1); opacity: 1; }
        100% { transform: translateY(-50%) scale(1); opacity: 0; }
    }
    
    @keyframes scrollFeedback {
        0% { transform: translateX(-50%) translateY(-10px); opacity: 0; }
        50% { transform: translateX(-50%) translateY(0); opacity: 1; }
        100% { transform: translateX(-50%) translateY(-10px); opacity: 0; }
    }
    
    @keyframes animate-in {
        from { 
            opacity: 0; 
            transform: translateY(20px); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0); 
        }
    }
    
    .animate-in {
        animation: animate-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: var(--animation-delay, 0s);
    }
    
    .touch-active {
        background: rgba(255, 255, 255, 0.1) !important;
    }
    
    .keyboard-navigation *:focus {
        outline: 3px solid #60a5fa !important;
        outline-offset: 2px !important;
    }
`;
document.head.appendChild(touchStyle);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileTouchEnhancements = new MobileTouchEnhancements();
    });
} else {
    window.mobileTouchEnhancements = new MobileTouchEnhancements();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileTouchEnhancements;
}