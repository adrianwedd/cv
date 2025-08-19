/**
 * Progressive Mobile Loader
 * Optimizes mobile-first loading with intelligent prioritization
 */

class ProgressiveMobileLoader {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isSlowConnection = this.detectSlowConnection();
        this.connectionType = this.getConnectionType();
        this.loadingStrategy = this.determineLoadingStrategy();
        this.resourceQueue = {
            critical: [],
            important: [],
            deferred: [],
            lazy: []
        };
        this.loadedResources = new Set();
        this.loadingPromises = new Map();
        
        this.init();
    }

    init() {
        console.log('📱 Initializing Progressive Mobile Loader');
        console.log(`📊 Device: ${this.isMobile ? 'Mobile' : 'Desktop'}, Connection: ${this.connectionType}, Strategy: ${this.loadingStrategy}`);
        
        this.setupIntersectionObserver();
        this.prioritizeResources();
        this.startProgressiveLoading();
        this.setupConnectionMonitoring();
        
        console.log('✅ Progressive Mobile Loader initialized');
    }

    detectSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return connection.effectiveType === '2g' || 
                   connection.effectiveType === 'slow-2g' ||
                   connection.saveData === true ||
                   connection.downlink < 1.5;
        }
        
        // Fallback: estimate based on device capabilities
        const deviceMemory = navigator.deviceMemory || 4;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        
        return deviceMemory < 2 || hardwareConcurrency < 2;
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    determineLoadingStrategy() {
        if (this.isSlowConnection || (this.isMobile && this.connectionType === '2g')) {
            return 'minimal';
        } else if (this.isMobile && (this.connectionType === '3g' || this.connectionType === 'slow-2g')) {
            return 'conservative';
        } else if (this.isMobile) {
            return 'balanced';
        }
        return 'full';
    }

    prioritizeResources() {
        // Critical resources (load immediately)
        this.resourceQueue.critical = [
            '/assets/critical-mobile.css',
            '/assets/mobile-enhancements.js',
            '/data/base-cv.json'
        ];

        // Important resources (load after critical)
        this.resourceQueue.important = [
            '/assets/core-web-vitals.js',
            '/assets/styles.css',
            '/assets/script.js'
        ];

        // Deferred resources (load when idle or on interaction)
        this.resourceQueue.deferred = [
            '/assets/webp-optimizer.js',
            '/data/activity-summary.json',
            '/data/ai-enhancements.json'
        ];

        // Lazy resources (load only when needed)
        this.resourceQueue.lazy = [
            '/assets/performance-monitor.js',
            '/assets/analytics.js'
        ];

        // Adjust priorities based on strategy
        this.adjustPrioritiesForStrategy();
    }

    adjustPrioritiesForStrategy() {
        switch (this.loadingStrategy) {
            case 'minimal':
                // Only load absolute essentials
                this.resourceQueue.important = this.resourceQueue.important.slice(0, 1);
                this.resourceQueue.deferred = [];
                this.resourceQueue.lazy = [];
                break;
                
            case 'conservative':
                // Reduce non-essential resources
                this.resourceQueue.deferred = this.resourceQueue.deferred.slice(0, 1);
                this.resourceQueue.lazy = [];
                break;
                
            case 'balanced':
                // Load important resources but defer others
                break;
                
            case 'full':
                // Load everything (desktop or fast connection)
                this.resourceQueue.important = [
                    ...this.resourceQueue.important,
                    ...this.resourceQueue.deferred.slice(0, 2)
                ];
                break;
        }
    }

    async startProgressiveLoading() {
        console.log('🚀 Starting progressive loading');
        
        // Phase 1: Critical resources
        await this.loadResourceBatch('critical');
        this.notifyLoadingPhase('critical-complete');
        
        // Phase 2: Important resources (with delay for slow connections)
        const importantDelay = this.isSlowConnection ? 500 : 100;
        setTimeout(async () => {
            await this.loadResourceBatch('important');
            this.notifyLoadingPhase('important-complete');
        }, importantDelay);
        
        // Phase 3: Deferred resources (on idle)
        this.scheduleIdleLoading('deferred');
        
        // Phase 4: Lazy resources (on interaction)
        this.setupLazyLoading('lazy');
    }

    async loadResourceBatch(priority) {
        const resources = this.resourceQueue[priority];
        if (!resources.length) return;
        
        console.log(`📦 Loading ${priority} resources:`, resources);
        
        const loadPromises = resources.map(resource => this.loadResource(resource, priority));
        
        try {
            await Promise.allSettled(loadPromises);
            console.log(`✅ ${priority} resources loaded`);
        } catch (error) {
            console.warn(`⚠️ Some ${priority} resources failed to load:`, error);
        }
    }

    async loadResource(url, priority = 'normal') {
        if (this.loadedResources.has(url)) {
            return Promise.resolve();
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const loadPromise = this.performResourceLoad(url, priority);
        this.loadingPromises.set(url, loadPromise);
        
        try {
            await loadPromise;
            this.loadedResources.add(url);
            this.reportResourceMetric(url, 'loaded', priority);
        } catch (error) {
            console.warn(`❌ Failed to load ${url}:`, error);
            this.reportResourceMetric(url, 'failed', priority);
        }

        this.loadingPromises.delete(url);
        return loadPromise;
    }

    async performResourceLoad(url, priority) {
        const startTime = performance.now();
        
        try {
            if (url.endsWith('.css')) {
                await this.loadCSS(url, priority);
            } else if (url.endsWith('.js')) {
                await this.loadScript(url, priority);
            } else if (url.endsWith('.json')) {
                await this.loadJSON(url, priority);
            } else if (this.isImageUrl(url)) {
                await this.loadImage(url, priority);
            } else {
                await this.loadGeneric(url, priority);
            }
            
            const loadTime = performance.now() - startTime;
            this.reportResourceMetric(url, 'load_time', loadTime);
            
        } catch (error) {
            const loadTime = performance.now() - startTime;
            this.reportResourceMetric(url, 'load_error', loadTime);
            throw error;
        }
    }

    async loadCSS(url, priority) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
            
            // Set loading priority
            if (priority === 'critical') {
                link.setAttribute('data-priority', 'high');
            }
            
            document.head.appendChild(link);
        });
    }

    async loadScript(url, priority) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.defer = priority !== 'critical';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            
            // Set loading priority
            if (priority === 'critical') {
                script.setAttribute('data-priority', 'high');
            }
            
            document.head.appendChild(script);
        });
    }

    async loadJSON(url, priority) {
        const response = await fetch(url, {
            priority: priority === 'critical' ? 'high' : 'low'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${url} (${response.status})`);
        }
        
        return response.json();
    }

    async loadImage(url, priority) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            
            // Set loading priority
            if (priority === 'critical') {
                img.loading = 'eager';
                img.fetchPriority = 'high';
            } else {
                img.loading = 'lazy';
                img.fetchPriority = 'low';
            }
            
            img.src = url;
        });
    }

    async loadGeneric(url, priority) {
        const response = await fetch(url, {
            priority: priority === 'critical' ? 'high' : 'low'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load resource: ${url} (${response.status})`);
        }
        
        return response;
    }

    scheduleIdleLoading(priority) {
        const loadDeferred = () => {
            this.loadResourceBatch(priority);
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadDeferred, { timeout: 5000 });
        } else {
            setTimeout(loadDeferred, 2000);
        }
    }

    setupLazyLoading(priority) {
        const resources = this.resourceQueue[priority];
        if (!resources.length) return;

        // Load on first user interaction
        const events = ['click', 'scroll', 'keydown', 'touchstart'];
        const loadOnInteraction = () => {
            this.loadResourceBatch(priority);
            events.forEach(event => {
                document.removeEventListener(event, loadOnInteraction, { passive: true });
            });
        };

        events.forEach(event => {
            document.addEventListener(event, loadOnInteraction, { passive: true, once: true });
        });

        // Fallback: load after delay
        setTimeout(() => {
            loadOnInteraction();
        }, 10000);
    }

    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const lazyResource = element.dataset.lazySrc || element.dataset.src;
                    
                    if (lazyResource) {
                        this.loadResource(lazyResource, 'lazy');
                        this.intersectionObserver.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });

        // Observe elements with lazy loading attributes
        document.querySelectorAll('[data-lazy-src], [data-src]').forEach(element => {
            this.intersectionObserver.observe(element);
        });
    }

    setupConnectionMonitoring() {
        if (!('connection' in navigator)) return;

        const connection = navigator.connection;
        
        connection.addEventListener('change', () => {
            const newConnectionType = connection.effectiveType;
            const newIsSlowConnection = this.detectSlowConnection();
            
            console.log(`📡 Connection changed: ${this.connectionType} → ${newConnectionType}`);
            
            if (this.connectionType !== newConnectionType) {
                this.connectionType = newConnectionType;
                this.isSlowConnection = newIsSlowConnection;
                this.loadingStrategy = this.determineLoadingStrategy();
                
                this.adaptToConnection();
            }
        });
    }

    adaptToConnection() {
        console.log(`🔄 Adapting to connection: ${this.connectionType} (${this.loadingStrategy})`);
        
        if (this.isSlowConnection) {
            // Reduce resource loading
            this.pauseNonCriticalLoading();
        } else {
            // Resume normal loading
            this.resumeResourceLoading();
        }
        
        this.prioritizeResources();
    }

    pauseNonCriticalLoading() {
        console.log('⏸️ Pausing non-critical loading due to slow connection');
        
        // Cancel pending non-critical loads
        this.loadingPromises.forEach((promise, url) => {
            if (!this.resourceQueue.critical.includes(url)) {
                // Can't cancel promises, but we can mark them as low priority
                console.log(`🔽 Deprioritizing: ${url}`);
            }
        });
    }

    resumeResourceLoading() {
        console.log('▶️ Resuming normal resource loading');
        
        // Load any pending deferred resources
        if (this.resourceQueue.deferred.length > 0) {
            this.scheduleIdleLoading('deferred');
        }
    }

    notifyLoadingPhase(phase) {
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('progressiveLoadingPhase', {
            detail: { phase, strategy: this.loadingStrategy }
        }));
        
        console.log(`📋 Loading phase complete: ${phase}`);
    }

    reportResourceMetric(url, metric, value) {
        // Report to analytics
        if (window.gtag) {
            gtag('event', 'resource_loading', {
                resource_url: url.substring(url.lastIndexOf('/') + 1),
                metric_name: metric,
                metric_value: typeof value === 'number' ? Math.round(value) : value,
                loading_strategy: this.loadingStrategy,
                connection_type: this.connectionType,
                is_mobile: this.isMobile
            });
        }
        
        console.log(`📊 Resource Metric - ${url}: ${metric} = ${value}`);
    }

    isImageUrl(url) {
        return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url);
    }

    // Public API
    preloadResource(url, priority = 'normal') {
        return this.loadResource(url, priority);
    }

    preloadResources(urls, priority = 'normal') {
        return Promise.allSettled(urls.map(url => this.loadResource(url, priority)));
    }

    getLoadingMetrics() {
        return {
            strategy: this.loadingStrategy,
            connectionType: this.connectionType,
            isSlowConnection: this.isSlowConnection,
            isMobile: this.isMobile,
            loadedResources: Array.from(this.loadedResources),
            queueSizes: {
                critical: this.resourceQueue.critical.length,
                important: this.resourceQueue.important.length,
                deferred: this.resourceQueue.deferred.length,
                lazy: this.resourceQueue.lazy.length
            }
        };
    }

    // Adaptive image loading with WebP support
    async loadAdaptiveImage(element) {
        if (!element.dataset.src) return;

        const baseSrc = element.dataset.src;
        const webpSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        // Try WebP first if supported
        if (this.supportsWebP()) {
            try {
                await this.loadImage(webpSrc, 'normal');
                element.src = webpSrc;
                element.classList.add('webp-loaded');
                return;
            } catch (error) {
                console.log(`WebP failed, falling back to original: ${baseSrc}`);
            }
        }
        
        // Fallback to original format
        await this.loadImage(baseSrc, 'normal');
        element.src = baseSrc;
        element.classList.add('original-loaded');
    }

    supportsWebP() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        if (!('PerformanceObserver' in window)) return;

        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'resource') {
                    this.analyzeResourcePerformance(entry);
                }
            });
        });

        observer.observe({ entryTypes: ['resource'] });
    }

    analyzeResourcePerformance(entry) {
        const duration = entry.duration;
        const resourceType = this.getResourceType(entry.name);
        
        if (duration > 1000) {
            console.warn(`⚠️ Slow resource loading detected: ${entry.name} (${Math.round(duration)}ms)`);
            
            this.reportResourceMetric(entry.name, 'slow_loading', duration);
            
            // Suggest optimizations
            this.suggestResourceOptimization(entry);
        }
    }

    getResourceType(url) {
        if (url.includes('.css')) return 'stylesheet';
        if (url.includes('.js')) return 'script';
        if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
        if (url.includes('.json')) return 'data';
        return 'other';
    }

    suggestResourceOptimization(entry) {
        const suggestions = [];
        const resourceType = this.getResourceType(entry.name);
        
        switch (resourceType) {
            case 'stylesheet':
                suggestions.push('Consider inlining critical CSS');
                suggestions.push('Use preload for important stylesheets');
                break;
            case 'script':
                suggestions.push('Consider code splitting');
                suggestions.push('Use defer or async attributes');
                break;
            case 'image':
                suggestions.push('Optimize image compression');
                suggestions.push('Use responsive images with srcset');
                suggestions.push('Consider WebP format');
                break;
        }
        
        if (suggestions.length > 0) {
            console.log(`💡 Optimization suggestions for ${entry.name}:`, suggestions);
        }
    }
}

// Initialize progressive mobile loader
document.addEventListener('DOMContentLoaded', () => {
    window.progressiveMobileLoader = new ProgressiveMobileLoader();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveMobileLoader;
}