/**
 * Advanced Mobile Experience Excellence
 * Implements touch interactions, gesture recognition, and mobile performance optimization
 */

class MobileExperienceEnhancer {
    constructor() {
        this.isMobile = this.detectMobileDevice();
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.gestureThreshold = {
            swipe: 50,
            pinch: 0.2,
            longPress: 500
        };
        this.performanceMetrics = {
            fcp: 0,
            lcp: 0,
            cls: 0,
            fid: 0
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Mobile Experience Enhancement');
        
        if (this.isMobile || this.isTouch) {
            this.enableMobileOptimizations();
            this.setupAdvancedTouchInteractions();
            this.setupGestureRecognition();
            this.setupHapticFeedback();
            this.optimizeScrolling();
            this.setupPullToRefresh();
            this.handleViewportHeight();
        }
        
        this.setupCoreWebVitalsMonitoring();
        this.setupImageOptimization();
        this.setupProgressiveEnhancement();
        
        console.log('✅ Mobile Experience Enhancement Complete');
    }

    detectMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone'];
        return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
               window.innerWidth <= 768;
    }

    enableMobileOptimizations() {
        document.documentElement.classList.add('mobile-device');
        
        // Optimize rendering for mobile
        document.documentElement.style.setProperty('--mobile-optimized', '1');
        
        // Enhance font rendering
        document.body.style.textRendering = 'optimizeSpeed';
        document.body.style.webkitFontSmoothing = 'antialiased';
        
        // Mobile-specific CSS variables
        this.setMobileViewportVariables();
    }

    setMobileViewportVariables() {
        const updateViewport = () => {
            const vh = window.innerHeight * 0.01;
            const vw = window.innerWidth * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            document.documentElement.style.setProperty('--vw', `${vw}px`);
            document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
            document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`);
        };

        updateViewport();
        window.addEventListener('resize', this.debounce(updateViewport, 100));
        window.addEventListener('orientationchange', () => {
            setTimeout(updateViewport, 500);
        });
    }

    setupAdvancedTouchInteractions() {
        console.log('🔧 Setting up advanced touch interactions');
        
        // Enhanced ripple effects with better performance
        this.setupEnhancedRipples();
        
        // Advanced touch feedback
        this.setupTouchFeedback();
        
        // Touch gesture recognition
        this.setupTouchGestures();
        
        // Long press detection
        this.setupLongPress();
    }

    setupEnhancedRipples() {
        const rippleElements = document.querySelectorAll('.nav-item, .contact-link, .stat-item, .project-card, .achievement-card');
        
        rippleElements.forEach(element => {
            this.addRippleEffect(element);
        });
    }

    addRippleEffect(element) {
        if (!element.classList.contains('ripple-enhanced')) {
            element.classList.add('ripple-enhanced');
            
            element.addEventListener('touchstart', (e) => {
                this.createAdvancedRipple(e, element);
            }, { passive: true });
        }
    }

    createAdvancedRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const size = Math.max(rect.width, rect.height);
        
        const ripple = document.createElement('div');
        ripple.classList.add('advanced-ripple');
        ripple.style.cssText = `
            position: absolute;
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%);
            pointer-events: none;
            z-index: 10;
            transform: scale(0);
            opacity: 1;
            will-change: transform, opacity;
        `;
        
        // Ensure element can contain the ripple
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        element.style.overflow = 'hidden';
        
        element.appendChild(ripple);
        
        // Animate the ripple
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(1)';
            ripple.style.opacity = '0';
            ripple.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out';
        });
        
        // Cleanup
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }

    setupTouchFeedback() {
        const touchElements = document.querySelectorAll('button, .btn, .nav-item, .contact-link, .card, .project-card');
        
        touchElements.forEach(element => {
            let touchStartTime = 0;
            
            element.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                element.style.transform = 'scale(0.97)';
                element.style.transition = 'transform 0.1s ease';
                
                // Provide haptic feedback if available
                this.triggerHapticFeedback('light');
            }, { passive: true });
            
            element.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                
                element.style.transform = '';
                element.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // Different feedback for long press
                if (touchDuration > this.gestureThreshold.longPress) {
                    this.triggerHapticFeedback('medium');
                }
            }, { passive: true });
            
            element.addEventListener('touchcancel', () => {
                element.style.transform = '';
                element.style.transition = 'transform 0.2s ease';
            }, { passive: true });
        });
    }

    setupGestureRecognition() {
        let startX, startY, startTime;
        let isTracking = false;
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTime = Date.now();
                isTracking = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isTracking || e.touches.length !== 1) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            // Detect horizontal swipe for navigation
            if (Math.abs(deltaX) > this.gestureThreshold.swipe && Math.abs(deltaY) < 100) {
                if (Math.abs(deltaX) > Math.abs(deltaY) * 2) {
                    this.handleSwipeGesture(deltaX > 0 ? 'right' : 'left', e);
                    isTracking = false;
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            isTracking = false;
        }, { passive: true });
    }

    handleSwipeGesture(direction, event) {
        const currentSection = window.cvApp?.currentSection || 'about';
        const sections = ['about', 'experience', 'projects', 'skills', 'achievements'];
        const currentIndex = sections.indexOf(currentSection);
        
        let targetIndex;
        if (direction === 'right' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else if (direction === 'left' && currentIndex < sections.length - 1) {
            targetIndex = currentIndex + 1;
        }
        
        if (targetIndex !== undefined) {
            this.triggerHapticFeedback('medium');
            this.showSwipeIndicator(direction);
            
            // Navigate to the target section
            setTimeout(() => {
                if (window.cvApp && window.cvApp.navigateToSection) {
                    window.cvApp.navigateToSection(sections[targetIndex]);
                }
            }, 150);
        }
    }

    showSwipeIndicator(direction) {
        const indicator = document.createElement('div');
        indicator.className = 'swipe-indicator';
        indicator.innerHTML = direction === 'left' ? '→' : '←';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            ${direction === 'left' ? 'right' : 'left'}: 20px;
            transform: translateY(-50%);
            font-size: 2rem;
            color: rgba(255, 255, 255, 0.8);
            background: rgba(59, 130, 246, 0.8);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: swipeIndicator 0.6s ease-out forwards;
            pointer-events: none;
        `;
        
        // Add animation styles if not exists
        if (!document.querySelector('#swipe-indicator-styles')) {
            const style = document.createElement('style');
            style.id = 'swipe-indicator-styles';
            style.textContent = `
                @keyframes swipeIndicator {
                    0% { opacity: 0; transform: translateY(-50%) scale(0.5); }
                    50% { opacity: 1; transform: translateY(-50%) scale(1.1); }
                    100% { opacity: 0; transform: translateY(-50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 600);
    }

    setupLongPress() {
        const longPressElements = document.querySelectorAll('.project-card, .achievement-card');
        
        longPressElements.forEach(element => {
            let longPressTimer;
            let startTime;
            
            element.addEventListener('touchstart', (e) => {
                startTime = Date.now();
                longPressTimer = setTimeout(() => {
                    this.handleLongPress(element, e);
                }, this.gestureThreshold.longPress);
            }, { passive: true });
            
            element.addEventListener('touchend', () => {
                clearTimeout(longPressTimer);
            }, { passive: true });
            
            element.addEventListener('touchmove', () => {
                clearTimeout(longPressTimer);
            }, { passive: true });
        });
    }

    handleLongPress(element, event) {
        this.triggerHapticFeedback('heavy');
        
        // Show context menu or additional actions
        this.showContextMenu(element, event);
    }

    showContextMenu(element, event) {
        const menu = document.createElement('div');
        menu.className = 'touch-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${event.touches[0].clientY}px;
            left: ${event.touches[0].clientX}px;
            background: rgba(30, 30, 30, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
            z-index: 10000;
            transform: scale(0.8);
            opacity: 0;
            transition: all 0.2s ease;
        `;
        
        const actions = this.getContextActions(element);
        menu.innerHTML = actions.map(action => 
            `<div class="context-action" data-action="${action.id}" style="
                padding: 8px 16px;
                color: #ffffff;
                font-size: 14px;
                cursor: pointer;
                border-radius: 4px;
                white-space: nowrap;
            ">${action.label}</div>`
        ).join('');
        
        document.body.appendChild(menu);
        
        // Animate in
        requestAnimationFrame(() => {
            menu.style.transform = 'scale(1)';
            menu.style.opacity = '1';
        });
        
        // Handle actions
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleContextAction(action, element);
                this.hideContextMenu(menu);
            }
        });
        
        // Auto-hide after delay
        setTimeout(() => {
            this.hideContextMenu(menu);
        }, 3000);
        
        // Hide on touch outside
        const hideOnTouch = (e) => {
            if (!menu.contains(e.target)) {
                this.hideContextMenu(menu);
                document.removeEventListener('touchstart', hideOnTouch);
            }
        };
        document.addEventListener('touchstart', hideOnTouch);
    }

    getContextActions(element) {
        if (element.classList.contains('project-card')) {
            return [
                { id: 'share', label: '📤 Share Project' },
                { id: 'details', label: '🔍 View Details' },
                { id: 'bookmark', label: '⭐ Bookmark' }
            ];
        } else if (element.classList.contains('achievement-card')) {
            return [
                { id: 'share', label: '📤 Share Achievement' },
                { id: 'verify', label: '✅ Verify Credentials' }
            ];
        }
        return [];
    }

    handleContextAction(action, element) {
        this.triggerHapticFeedback('light');
        
        switch (action) {
            case 'share':
                this.shareContent(element);
                break;
            case 'details':
                this.showDetails(element);
                break;
            case 'bookmark':
                this.bookmarkItem(element);
                break;
            case 'verify':
                this.verifyCredentials(element);
                break;
        }
    }

    hideContextMenu(menu) {
        menu.style.transform = 'scale(0.8)';
        menu.style.opacity = '0';
        setTimeout(() => {
            if (menu.parentNode) {
                menu.remove();
            }
        }, 200);
    }

    setupHapticFeedback() {
        // Check if device supports haptic feedback
        this.hasHapticFeedback = 'vibrate' in navigator || 
                                  (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function');
    }

    triggerHapticFeedback(intensity = 'light') {
        if (!this.hasHapticFeedback) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [50],
            success: [10, 50, 10],
            error: [100, 100, 100]
        };
        
        if (navigator.vibrate && patterns[intensity]) {
            navigator.vibrate(patterns[intensity]);
        }
    }

    optimizeScrolling() {
        // Enable momentum scrolling on iOS
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Optimize scroll performance
        let ticking = false;
        let lastScrollTop = 0;
        
        const optimizedScroll = () => {
            const scrollTop = window.pageYOffset;
            const scrollDelta = scrollTop - lastScrollTop;
            
            // Hide/show navigation on scroll
            const navigation = document.querySelector('.navigation');
            if (navigation) {
                if (scrollDelta > 5 && scrollTop > 100) {
                    navigation.style.transform = 'translateY(-100%)';
                } else if (scrollDelta < -5) {
                    navigation.style.transform = 'translateY(0)';
                }
            }
            
            lastScrollTop = scrollTop;
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(optimizedScroll);
                ticking = true;
            }
        }, { passive: true });
    }

    setupPullToRefresh() {
        let startY = 0;
        let pullDistance = 0;
        let isPulling = false;
        const pullThreshold = 80;
        
        let pullIndicator;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                isPulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling || window.scrollY > 0) return;
            
            pullDistance = e.touches[0].pageY - startY;
            
            if (pullDistance > 0) {
                e.preventDefault();
                
                if (!pullIndicator) {
                    pullIndicator = this.createPullIndicator();
                }
                
                const progress = Math.min(pullDistance / pullThreshold, 1);
                this.updatePullIndicator(pullIndicator, progress, pullDistance >= pullThreshold);
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (isPulling && pullDistance >= pullThreshold) {
                this.triggerRefresh();
            }
            
            if (pullIndicator) {
                this.hidePullIndicator(pullIndicator);
                pullIndicator = null;
            }
            
            isPulling = false;
            pullDistance = 0;
        });
    }

    createPullIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: rgba(59, 130, 246, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            z-index: 10000;
            transition: all 0.3s ease;
        `;
        indicator.innerHTML = '↓';
        document.body.appendChild(indicator);
        return indicator;
    }

    updatePullIndicator(indicator, progress, canRefresh) {
        const translateY = -60 + (progress * 80);
        indicator.style.transform = `translateX(-50%) translateY(${translateY}px) rotate(${progress * 180}deg)`;
        indicator.style.background = canRefresh ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.9)';
        indicator.innerHTML = canRefresh ? '↻' : '↓';
    }

    hidePullIndicator(indicator) {
        indicator.style.transform = 'translateX(-50%) translateY(-60px)';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 300);
    }

    async triggerRefresh() {
        this.triggerHapticFeedback('success');
        
        // Show loading state
        const indicator = document.querySelector('.pull-to-refresh-indicator');
        if (indicator) {
            indicator.innerHTML = '⟳';
            indicator.style.animation = 'spin 1s linear infinite';
        }
        
        // Refresh data
        try {
            if (window.cvApp && window.cvApp.refreshLiveData) {
                await window.cvApp.refreshLiveData();
            }
            
            // Show success feedback
            setTimeout(() => {
                this.showRefreshSuccess();
            }, 500);
        } catch (error) {
            console.error('Refresh failed:', error);
            this.showRefreshError();
        }
    }

    showRefreshSuccess() {
        const toast = this.createToast('✅ Content refreshed', 'success');
        this.showToast(toast);
    }

    showRefreshError() {
        const toast = this.createToast('❌ Refresh failed', 'error');
        this.showToast(toast);
    }

    handleViewportHeight() {
        // Handle mobile browser viewport changes (especially iOS Safari)
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        
        window.addEventListener('resize', this.debounce(setViewportHeight, 100));
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 500);
        });
        
        // Handle iOS Safari bottom bar
        if (this.isIOS()) {
            window.addEventListener('scroll', this.throttle(() => {
                setViewportHeight();
            }, 100));
        }
    }

    setupCoreWebVitalsMonitoring() {
        console.log('📊 Setting up Core Web Vitals monitoring');
        
        // Largest Contentful Paint (LCP)
        this.observeLCP();
        
        // First Input Delay (FID)
        this.observeFID();
        
        // Cumulative Layout Shift (CLS)
        this.observeCLS();
        
        // First Contentful Paint (FCP)
        this.observeFCP();
        
        // Mobile-specific metrics
        this.setupMobileMetrics();
    }

    observeLCP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.performanceMetrics.lcp = lastEntry.startTime;
                this.reportMetric('LCP', lastEntry.startTime);
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    observeFID() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((entryList) => {
                const firstInput = entryList.getEntries()[0];
                this.performanceMetrics.fid = firstInput.processingStart - firstInput.startTime;
                this.reportMetric('FID', this.performanceMetrics.fid);
            });
            
            observer.observe({ entryTypes: ['first-input'] });
        }
    }

    observeCLS() {
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            const observer = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.performanceMetrics.cls = clsValue;
                this.reportMetric('CLS', clsValue);
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }

    observeFCP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const firstPaint = entries.find(entry => entry.name === 'first-contentful-paint');
                if (firstPaint) {
                    this.performanceMetrics.fcp = firstPaint.startTime;
                    this.reportMetric('FCP', firstPaint.startTime);
                }
            });
            
            observer.observe({ entryTypes: ['paint'] });
        }
    }

    setupMobileMetrics() {
        // Network Information API
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.reportMetric('Network', {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            });
        }
        
        // Device Memory API
        if ('deviceMemory' in navigator) {
            this.reportMetric('Device Memory', `${navigator.deviceMemory}GB`);
        }
        
        // Hardware Concurrency
        this.reportMetric('CPU Cores', navigator.hardwareConcurrency || 'unknown');
    }

    reportMetric(name, value) {
        console.log(`📱 Mobile Metric - ${name}:`, value);
        
        // Report to analytics if available
        if (window.gtag) {
            gtag('event', 'mobile_performance', {
                metric_name: name,
                metric_value: typeof value === 'number' ? Math.round(value) : value,
                custom_parameter: 'mobile_experience'
            });
        }
        
        // Show performance warnings for mobile
        this.checkPerformanceThresholds(name, value);
    }

    checkPerformanceThresholds(name, value) {
        const thresholds = {
            LCP: 2500, // 2.5s
            FID: 100, // 100ms
            CLS: 0.1, // 0.1
            FCP: 1800 // 1.8s
        };
        
        if (thresholds[name] && typeof value === 'number') {
            if (value > thresholds[name]) {
                console.warn(`⚠️ ${name} exceeds mobile threshold: ${value}ms > ${thresholds[name]}ms`);
                
                // Suggest optimizations
                this.suggestOptimizations(name, value);
            } else {
                console.log(`✅ ${name} within mobile threshold: ${value}ms <= ${thresholds[name]}ms`);
            }
        }
    }

    suggestOptimizations(metric, value) {
        const suggestions = {
            LCP: ['Optimize largest image', 'Reduce server response time', 'Eliminate render-blocking resources'],
            FID: ['Minimize main thread work', 'Reduce JavaScript execution time', 'Use web workers'],
            CLS: ['Add size attributes to images', 'Reserve space for ads', 'Avoid inserting content above existing content'],
            FCP: ['Inline critical CSS', 'Eliminate render-blocking resources', 'Reduce server response times']
        };
        
        if (suggestions[metric]) {
            console.log(`💡 ${metric} Optimization Suggestions:`, suggestions[metric]);
        }
    }

    setupImageOptimization() {
        console.log('🖼️ Setting up advanced image optimization');
        
        // Lazy loading for images
        this.setupLazyLoading();
        
        // WebP detection and replacement
        this.setupWebPSupport();
        
        // Responsive images optimization
        this.setupResponsiveImages();
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            // Observe all images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (src) {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        }
    }

    setupWebPSupport() {
        // Test WebP support
        const testWebP = () => {
            return new Promise((resolve) => {
                const webP = new Image();
                webP.onload = webP.onerror = () => {
                    resolve(webP.height === 2);
                };
                webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            });
        };
        
        testWebP().then(supported => {
            if (supported) {
                document.documentElement.classList.add('webp-supported');
                this.replaceWithWebP();
            } else {
                document.documentElement.classList.add('webp-not-supported');
            }
        });
    }

    replaceWithWebP() {
        // Replace images with WebP versions if available
        const images = document.querySelectorAll('img[src$=".jpg"], img[src$=".jpeg"], img[src$=".png"]');
        
        images.forEach(img => {
            const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            
            // Test if WebP version exists
            const testImg = new Image();
            testImg.onload = () => {
                img.src = webpSrc;
                img.classList.add('webp-optimized');
            };
            testImg.onerror = () => {
                // Keep original format
            };
            testImg.src = webpSrc;
        });
    }

    setupResponsiveImages() {
        // Create responsive images with srcset
        const images = document.querySelectorAll('img:not([srcset])');
        
        images.forEach(img => {
            if (img.dataset.responsive !== 'false') {
                this.makeImageResponsive(img);
            }
        });
    }

    makeImageResponsive(img) {
        const src = img.src;
        if (!src) return;
        
        // Generate srcset for different screen densities
        const baseName = src.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const extension = src.match(/\.(jpg|jpeg|png|webp)$/i)?.[0] || '.jpg';
        
        const srcset = [
            `${src} 1x`,
            `${baseName}@2x${extension} 2x`,
            `${baseName}@3x${extension} 3x`
        ].join(', ');
        
        img.setAttribute('srcset', srcset);
        img.classList.add('responsive-image');
    }

    setupProgressiveEnhancement() {
        console.log('⚡ Setting up progressive enhancement');
        
        // Progressive loading for non-critical features
        this.loadNonCriticalFeatures();
        
        // Adaptive loading based on connection
        this.setupAdaptiveLoading();
        
        // Service worker for offline experience
        this.registerServiceWorker();
    }

    loadNonCriticalFeatures() {
        // Load features based on interaction or idle time
        const features = [
            { name: 'analytics', load: () => this.loadAnalytics(), priority: 'low' },
            { name: 'animations', load: () => this.loadAdvancedAnimations(), priority: 'medium' },
            { name: 'social-sharing', load: () => this.loadSocialSharing(), priority: 'low' }
        ];
        
        // Load high priority features immediately
        features.filter(f => f.priority === 'high').forEach(f => f.load());
        
        // Load medium priority features after initial render
        setTimeout(() => {
            features.filter(f => f.priority === 'medium').forEach(f => f.load());
        }, 1000);
        
        // Load low priority features on idle or interaction
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                features.filter(f => f.priority === 'low').forEach(f => f.load());
            });
        } else {
            setTimeout(() => {
                features.filter(f => f.priority === 'low').forEach(f => f.load());
            }, 3000);
        }
    }

    setupAdaptiveLoading() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            if (connection.effectiveType === '2g' || connection.saveData) {
                // Reduce features for slow connections
                document.documentElement.classList.add('reduced-features');
                console.log('📱 Enabling reduced features mode for slow connection');
            }
            
            // Monitor connection changes
            connection.addEventListener('change', () => {
                this.adaptToConnection(connection);
            });
        }
    }

    adaptToConnection(connection) {
        if (connection.effectiveType === '2g' || connection.saveData) {
            // Disable heavy features
            this.disableHeavyFeatures();
        } else {
            // Re-enable features for faster connections
            this.enableAllFeatures();
        }
    }

    disableHeavyFeatures() {
        document.documentElement.classList.add('reduced-features');
        // Disable animations, reduce image quality, etc.
    }

    enableAllFeatures() {
        document.documentElement.classList.remove('reduced-features');
        // Re-enable all features
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator && 'caches' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered successfully');
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }
    }

    // Utility methods
    debounce(func, wait) {
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

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    createToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `mobile-toast mobile-toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: calc(100vw - 40px);
        `;
        toast.textContent = message;
        return toast;
    }

    showToast(toast) {
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // Auto hide
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    // Placeholder methods for progressive enhancement
    loadAnalytics() {
        console.log('📈 Loading analytics...');
    }

    loadAdvancedAnimations() {
        console.log('✨ Loading advanced animations...');
    }

    loadSocialSharing() {
        console.log('📱 Loading social sharing...');
    }

    shareContent(element) {
        if (navigator.share) {
            const title = element.querySelector('h3')?.textContent || 'Adrian Wedd CV';
            const text = element.querySelector('p')?.textContent || 'Check out this professional CV';
            
            navigator.share({
                title: title,
                text: text,
                url: window.location.href
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback to copy link
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast(this.createToast('✅ Link copied to clipboard', 'success'));
            });
        }
    }

    showDetails(element) {
        // Show modal with detailed information
        console.log('🔍 Showing details for:', element);
    }

    bookmarkItem(element) {
        // Add to bookmarks/favorites
        console.log('⭐ Bookmarking:', element);
        this.showToast(this.createToast('⭐ Added to bookmarks', 'success'));
    }

    verifyCredentials(element) {
        // Show verification information
        console.log('✅ Verifying credentials for:', element);
    }
}

// Initialize Mobile Experience Enhancement
document.addEventListener('DOMContentLoaded', () => {
    // Wait for critical resources to load
    setTimeout(() => {
        window.mobileEnhancer = new MobileExperienceEnhancer();
        console.log('🎯 Mobile Experience Enhancement Initialized');
    }, 500);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileExperienceEnhancer;
}