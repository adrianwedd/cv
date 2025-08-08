/**
 * Progressive Loading & Mobile Optimization System
 * 
 * Advanced progressive enhancement system optimized for the stunning dark mode
 * frontend redesign, with intelligent mobile-first optimizations and adaptive
 * loading strategies for optimal Core Web Vitals performance.
 * 
 * Features:
 * - Adaptive loading based on device capabilities
 * - Smart image optimization and lazy loading
 * - Network-aware content delivery
 * - Battery and performance monitoring
 * - Critical rendering path optimization
 * - Mobile-first progressive enhancement
 * - Intersection observer with fallbacks
 * - Service worker integration
 */

class ProgressiveLoader {
    constructor() {
        this.deviceCapabilities = this.detectDeviceCapabilities();
        this.networkInfo = this.detectNetworkInfo();
        this.loadingStrategy = this.determineLoadingStrategy();
        this.performanceMetrics = this.initializeMetrics();
        
        this.config = {
            // Progressive loading thresholds
            criticalViewportHeight: 1.5, // 1.5x viewport height for critical content
            lazyLoadThreshold: 2.0,       // 2x viewport height for lazy loading
            preloadThreshold: 0.5,        // 0.5x viewport height for preloading
            
            // Mobile optimizations
            mobileImageQuality: 0.8,      // 80% quality for mobile images
            mobilePrefetchLimit: 3,       // Max 3 prefetch requests on mobile
            mobileChunkSize: 15000,       // 15KB max chunks for mobile
            
            // Performance budgets
            maxCriticalTime: 1500,        // 1.5s for critical content
            maxLazyLoadTime: 3000,        // 3s for lazy content
            maxRetries: 2,                // Max retry attempts
            
            // Battery awareness
            lowBatteryThreshold: 0.2,     // 20% battery threshold
            reduceAnimationsThreshold: 0.15, // 15% battery threshold
        };

        this.init();
    }

    /**
     * Initialize progressive loading system
     */
    init() {
        
        
        
        
        // Initialize core systems
        this.setupCriticalPathOptimization();
        this.setupProgressiveEnhancement();
        this.setupMobileOptimizations();
        this.setupNetworkAwareLoading();
        this.setupPerformanceMonitoring();
        
        // Register service worker if available
        this.registerServiceWorker();
        
        
    }

    /**
     * Detect device capabilities for optimization decisions
     */
    detectDeviceCapabilities() {
        const capabilities = {
            type: 'desktop',
            memory: navigator.deviceMemory || 4,
            cores: navigator.hardwareConcurrency || 4,
            touchSupported: 'ontouchstart' in window,
            retina: window.devicePixelRatio > 1.5,
            webp: false,
            avif: false
        };

        // Detect device type
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            capabilities.type = 'mobile';
        } else if (/iPad|Android(?=.*Tablet)/i.test(navigator.userAgent)) {
            capabilities.type = 'tablet';
        }

        // Detect image format support
        capabilities.webp = this.supportsImageFormat('webp');
        capabilities.avif = this.supportsImageFormat('avif');

        return capabilities;
    }

    /**
     * Detect network information for adaptive loading
     */
    detectNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            effectiveType: connection?.effectiveType || '4g',
            downlink: connection?.downlink || 10,
            rtt: connection?.rtt || 100,
            saveData: connection?.saveData || false
        };
    }

    /**
     * Determine optimal loading strategy based on device and network
     */
    determineLoadingStrategy() {
        const { type, memory, cores } = this.deviceCapabilities;
        const { effectiveType, saveData } = this.networkInfo;

        // Data saver mode
        if (saveData) return 'minimal';

        // Low-end device optimization
        if (type === 'mobile' && memory < 2 && cores < 4) return 'conservative';

        // Slow network optimization  
        if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'conservative';

        // 3G optimization
        if (effectiveType === '3g') return 'balanced';

        // High-end devices and fast networks
        return 'aggressive';
    }

    /**
     * Initialize performance metrics tracking
     */
    initializeMetrics() {
        return {
            criticalContentTime: 0,
            lazyLoadedItems: 0,
            totalLoadTime: 0,
            cacheHitRate: 0,
            networkRequests: 0,
            bytesTransferred: 0,
            errorRate: 0
        };
    }

    /**
     * Setup critical rendering path optimization
     */
    setupCriticalPathOptimization() {
        

        // Prioritize above-the-fold content
        this.prioritizeCriticalContent();
        
        // Defer non-critical resources
        this.deferNonCriticalResources();
        
        // Optimize web fonts loading
        this.optimizeFontLoading();
        
        // Setup resource hints
        this.setupResourceHints();
    }

    /**
     * Prioritize critical above-the-fold content
     */
    prioritizeCriticalContent() {
        const criticalSections = document.querySelectorAll('[data-critical="true"]');
        const viewportHeight = window.innerHeight;
        const criticalThreshold = viewportHeight * this.config.criticalViewportHeight;

        criticalSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            
            // If section is within critical viewport
            if (rect.top < criticalThreshold) {
                section.classList.add('critical-content');
                this.loadCriticalContent(section);
            }
        });
    }

    /**
     * Load critical content with high priority
     */
    async loadCriticalContent(element) {
        const startTime = performance.now();
        
        try {
            // Load critical data chunks
            const criticalData = await this.fetchCriticalData();
            
            // Render immediately without lazy loading
            this.renderCriticalSection(element, criticalData);
            
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.criticalContentTime = Math.max(
                this.performanceMetrics.criticalContentTime, 
                loadTime
            );
            
            }ms`);
            
        } catch (error) {
            console.error('❌ Critical content loading failed:', error);
            this.fallbackCriticalContent(element);
        }
    }

    /**
     * Setup progressive enhancement layers
     */
    setupProgressiveEnhancement() {
        

        // Layer 1: Basic HTML content (no-JS fallback)
        this.enhanceBasicContent();
        
        // Layer 2: CSS enhancements
        this.enhanceStyling();
        
        // Layer 3: JavaScript interactivity
        this.enhanceInteractivity();
        
        // Layer 4: Advanced features
        this.enhanceAdvancedFeatures();
    }

    /**
     * Enhance basic content for no-JS users
     */
    enhanceBasicContent() {
        // Ensure all content is accessible without JavaScript
        document.body.classList.add('js-enabled');
        
        // Show enhanced navigation
        const nav = document.querySelector('.main-nav');
        if (nav) nav.classList.add('enhanced');
        
        // Progressive disclosure for complex content
        this.setupProgressiveDisclosure();
    }

    /**
     * Setup progressive disclosure patterns
     */
    setupProgressiveDisclosure() {
        const collapsibleSections = document.querySelectorAll('[data-progressive="collapsible"]');
        
        collapsibleSections.forEach(section => {
            const summary = section.querySelector('[data-summary]');
            const details = section.querySelector('[data-details]');
            
            if (summary && details) {
                // Hide details initially on mobile
                if (this.deviceCapabilities.type === 'mobile') {
                    details.hidden = true;
                    summary.setAttribute('role', 'button');
                    summary.setAttribute('tabindex', '0');
                    
                    summary.addEventListener('click', () => {
                        details.hidden = !details.hidden;
                        summary.setAttribute('aria-expanded', !details.hidden);
                    });
                }
            }
        });
    }

    /**
     * Setup mobile-specific optimizations
     */
    setupMobileOptimizations() {
        if (this.deviceCapabilities.type !== 'mobile') return;
        
        

        // Reduce image quality for mobile
        this.optimizeMobileImages();
        
        // Implement touch-friendly interactions
        this.setupTouchOptimizations();
        
        // Optimize for smaller viewports
        this.setupViewportOptimizations();
        
        // Battery-aware optimizations
        this.setupBatteryOptimizations();
    }

    /**
     * Optimize images for mobile devices
     */
    optimizeMobileImages() {
        const images = document.querySelectorAll('img[data-mobile-optimized]');
        
        images.forEach(img => {
            const mobileSrc = img.dataset.mobileSrc;
            const webpSrc = img.dataset.webpSrc;
            
            // Use WebP on supported devices
            if (this.deviceCapabilities.webp && webpSrc) {
                img.src = webpSrc;
            } else if (mobileSrc) {
                img.src = mobileSrc;
            }
            
            // Add lazy loading
            img.loading = 'lazy';
            
            // Add intersection observer for advanced lazy loading
            this.setupAdvancedImageLazyLoading(img);
        });
    }

    /**
     * Setup advanced image lazy loading with intersection observer
     */
    setupAdvancedImageLazyLoading(img) {
        if (!window.IntersectionObserver) return;
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    
                    // Preload higher quality version
                    this.preloadHighQualityImage(image);
                    
                    // Stop observing
                    imageObserver.unobserve(image);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        imageObserver.observe(img);
    }

    /**
     * Setup network-aware loading
     */
    setupNetworkAwareLoading() {
        

        // Listen for network changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.networkInfo = this.detectNetworkInfo();
                this.adaptToNetworkChange();
            });
        }
        
        // Implement adaptive loading based on network
        this.implementAdaptiveLoading();
    }

    /**
     * Adapt loading strategy when network changes
     */
    adaptToNetworkChange() {
        const newStrategy = this.determineLoadingStrategy();
        
        if (newStrategy !== this.loadingStrategy) {
            
            this.loadingStrategy = newStrategy;
            
            // Adjust ongoing loading operations
            this.adjustLoadingOperations();
        }
    }

    /**
     * Implement adaptive loading based on current strategy
     */
    implementAdaptiveLoading() {
        const strategies = {
            minimal: () => this.implementMinimalLoading(),
            conservative: () => this.implementConservativeLoading(),
            balanced: () => this.implementBalancedLoading(),
            aggressive: () => this.implementAggressiveLoading()
        };
        
        const implementation = strategies[this.loadingStrategy];
        if (implementation) {
            implementation();
        }
    }

    /**
     * Implement minimal loading for data saver mode
     */
    implementMinimalLoading() {
        
        
        // Disable autoplay
        document.querySelectorAll('video[autoplay]').forEach(video => {
            video.removeAttribute('autoplay');
        });
        
        // Use lower quality images
        document.querySelectorAll('img').forEach(img => {
            const lowQualitySrc = img.dataset.lowQualitySrc;
            if (lowQualitySrc) {
                img.src = lowQualitySrc;
            }
        });
        
        // Reduce prefetching
        this.config.mobilePrefetchLimit = 1;
    }

    /**
     * Setup performance monitoring for progressive loading
     */
    setupPerformanceMonitoring() {
        

        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Track progressive loading metrics
        this.trackProgressiveMetrics();
        
        // Setup real user monitoring
        this.setupRealUserMonitoring();
    }

    /**
     * Monitor Core Web Vitals specifically for progressive loading
     */
    monitorCoreWebVitals() {
        // First Contentful Paint (FCP)
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    const fcp = entry.startTime;
                    }ms`);
                    
                    // Adjust strategy if FCP is slow
                    if (fcp > 2000 && this.loadingStrategy === 'aggressive') {
                        this.loadingStrategy = 'balanced';
                        
                    }
                }
            }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            const lcp = lastEntry.startTime;
            
            }ms`);
            
            // Optimize LCP if needed
            if (lcp > 2500) {
                this.optimizeLCP();
            }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            
            if (clsValue > 0.1) {
                this.reduceCLS();
            }
        }).observe({ entryTypes: ['layout-shift'] });
    }

    /**
     * Setup battery-aware optimizations
     */
    setupBatteryOptimizations() {
        if (!navigator.getBattery) return;
        
        navigator.getBattery().then(battery => {
            const applyBatteryOptimizations = () => {
                if (battery.level < this.config.lowBatteryThreshold) {
                    
                    this.implementBatteryConservation();
                }
                
                if (battery.level < this.config.reduceAnimationsThreshold) {
                    this.reduceAnimations();
                }
            };
            
            // Apply initial optimizations
            applyBatteryOptimizations();
            
            // Listen for battery changes
            battery.addEventListener('levelchange', applyBatteryOptimizations);
        });
    }

    /**
     * Implement battery conservation measures
     */
    implementBatteryConservation() {
        // Reduce refresh rates
        this.config.maxCriticalTime *= 1.5;
        this.config.maxLazyLoadTime *= 2;
        
        // Disable non-essential animations
        document.body.classList.add('reduced-motion');
        
        // Reduce image quality further
        document.querySelectorAll('img').forEach(img => {
            if (img.dataset.batteryOptimized) {
                img.src = img.dataset.batteryOptimized;
            }
        });
    }

    /**
     * Register service worker for advanced caching
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            
            // Setup service worker messaging for progressive loading
            this.setupServiceWorkerMessaging(registration);
            
        } catch (error) {
            console.warn('⚠️ Service worker registration failed:', error);
        }
    }

    /**
     * Setup service worker messaging for coordinated caching
     */
    setupServiceWorkerMessaging(registration) {
        if (registration.active) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, data } = event.data;
                
                switch (type) {
                    case 'CACHE_HIT':
                        this.performanceMetrics.cacheHitRate++;
                        break;
                    case 'NETWORK_REQUEST':
                        this.performanceMetrics.networkRequests++;
                        this.performanceMetrics.bytesTransferred += data.size || 0;
                        break;
                }
            });
        }
    }

    // Utility methods for loading strategies
    implementConservativeLoading() {
        
        this.config.mobilePrefetchLimit = 2;
        this.config.mobileChunkSize = 10000; // 10KB chunks
    }

    implementBalancedLoading() {
        
        // Use default configuration
    }

    implementAggressiveLoading() {
        
        this.config.mobilePrefetchLimit = 5;
        this.config.mobileChunkSize = 25000; // 25KB chunks
        
        // Preload next sections
        this.preloadNextSections();
    }

    preloadNextSections() {
        const sections = document.querySelectorAll('.lazy-section:not(.loaded)');
        const preloadCount = Math.min(sections.length, 2);
        
        for (let i = 0; i < preloadCount; i++) {
            if (sections[i]) {
                this.preloadSection(sections[i]);
            }
        }
    }

    async preloadSection(section) {
        const chunkName = section.dataset.section;
        if (!chunkName) return;
        
        try {
            const data = await fetch(`data/optimized/chunks/${chunkName}.json`);
            // Cache for immediate use when section becomes visible
            this.cachePreloadedData(chunkName, await data.json());
        } catch (error) {
            console.warn(`⚠️ Preload failed for ${chunkName}:`, error);
        }
    }

    cachePreloadedData(chunkName, data) {
        if ('caches' in window) {
            caches.open('preloaded-chunks').then(cache => {
                const response = new Response(JSON.stringify(data));
                cache.put(`chunks/${chunkName}.json`, response);
            });
        }
    }

    // Performance optimization methods
    optimizeLCP() {
        
        
        // Preload LCP element if it's an image
        const lcpCandidates = document.querySelectorAll('img, video, [data-lcp]');
        lcpCandidates.forEach(element => {
            if (this.isInViewport(element)) {
                element.setAttribute('fetchpriority', 'high');
            }
        });
    }

    reduceCLS() {
        
        
        // Add explicit dimensions to images
        document.querySelectorAll('img:not([width]):not([height])').forEach(img => {
            // Prevent layout shift by reserving space
            img.style.aspectRatio = '16/9'; // Default aspect ratio
        });
    }

    reduceAnimations() {
        document.body.classList.add('prefers-reduced-motion');
        
        // Disable CSS animations
        const style = document.createElement('style');
        style.textContent = `
            .prefers-reduced-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Utility methods
    supportsImageFormat(format) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    async fetchCriticalData() {
        try {
            const response = await fetch('data/optimized/chunks/critical.json');
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Critical data fetch failed, using fallback');
            return { personal_info: {}, professional_summary: '' };
        }
    }

    renderCriticalSection(element, data) {
        // Implement critical section rendering
        const personalInfo = data.personal_info || {};
        element.innerHTML = `
            <div class="hero-content">
                <h1>${personalInfo.name || 'Adrian Wedd'}</h1>
                <p class="title">${personalInfo.title || 'Systems Analyst & Technology Professional'}</p>
                <p class="summary">${data.professional_summary || ''}</p>
            </div>
        `;
    }

    fallbackCriticalContent(element) {
        element.innerHTML = `
            <div class="hero-content fallback">
                <h1>Adrian Wedd</h1>
                <p class="title">Systems Analyst & Technology Professional</p>
                <p class="summary">Loading professional profile...</p>
            </div>
        `;
    }

    // Additional enhancement methods
    enhanceStyling() {
        // Apply progressive styling enhancements
        document.body.classList.add('styling-enhanced');
    }

    enhanceInteractivity() {
        // Add interactive enhancements
        document.body.classList.add('interactive-enhanced');
    }

    enhanceAdvancedFeatures() {
        // Enable advanced features for capable devices
        if (this.loadingStrategy === 'aggressive') {
            document.body.classList.add('advanced-features');
        }
    }

    setupTouchOptimizations() {
        // Add touch-friendly enhancements
        document.body.classList.add('touch-optimized');
    }

    setupViewportOptimizations() {
        // Optimize for mobile viewports
        document.body.classList.add('mobile-optimized');
    }

    setupResourceHints() {
        // Add preconnect hints for external resources
        const preconnects = ['https://api.github.com', 'https://fonts.googleapis.com'];
        preconnects.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    optimizeFontLoading() {
        // Implement font display swap for better FCP
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'Inter';
                font-display: swap;
                /* Additional font properties */
            }
        `;
        document.head.appendChild(style);
    }

    deferNonCriticalResources() {
        // Defer non-critical CSS and JS
        document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])').forEach(link => {
            link.setAttribute('media', 'print');
            link.addEventListener('load', () => {
                link.setAttribute('media', 'all');
            });
        });
    }

    trackProgressiveMetrics() {
        // Track metrics specific to progressive loading
        setInterval(() => {
            
        }, 30000);
    }

    setupRealUserMonitoring() {
        // Implement RUM for progressive loading insights
        window.addEventListener('beforeunload', () => {
            // Send metrics to analytics endpoint
            navigator.sendBeacon('/analytics/progressive-loading', JSON.stringify(this.performanceMetrics));
        });
    }

    preloadHighQualityImage(image) {
        const highQualitySrc = image.dataset.highQualitySrc;
        if (highQualitySrc && this.loadingStrategy === 'aggressive') {
            const highQualityImage = new Image();
            highQualityImage.onload = () => {
                image.src = highQualitySrc;
            };
            highQualityImage.src = highQualitySrc;
        }
    }

    adjustLoadingOperations() {
        // Adjust ongoing operations based on new strategy
        if (this.loadingStrategy === 'minimal') {
            // Cancel non-essential requests
            this.cancelNonEssentialRequests();
        }
    }

    cancelNonEssentialRequests() {
        // Implementation for canceling non-essential network requests
        
    }
}

// Initialize progressive loading system
let progressiveLoader;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        progressiveLoader = new ProgressiveLoader();
    });
} else {
    progressiveLoader = new ProgressiveLoader();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveLoader;
}