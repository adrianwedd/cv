/**
 * Advanced Image Optimization & Lazy Loading
 * Optimized for Core Web Vitals LCP improvement
 * Target: LCP < 2500ms (from current 2670ms)
 */

class ImageOptimizer {
    constructor() {
        this.images = new Map();
        this.intersectionObserver = null;
        this.performanceObserver = null;
        this.loadedImages = new Set();
        this.criticalImages = new Set();
        
        this.options = {
            rootMargin: '50px 0px',
            threshold: 0.01,
            // Load images slightly before they come into view
            loadOffset: 100
        };
        
        this.init();
    }

    init() {
        console.log('🖼️ Initializing Advanced Image Optimization');
        
        this.setupIntersectionObserver();
        this.setupPerformanceMonitoring();
        this.identifyCriticalImages();
        this.setupLazyLoading();
        this.setupProgressiveLoading();
        this.optimizeExistingImages();
        
        console.log('✅ Image Optimization initialized');
    }

    /**
     * Setup intersection observer for lazy loading
     */
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, this.options);
    }

    /**
     * Monitor LCP and image loading performance
     */
    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            this.performanceObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'largest-contentful-paint') {
                        console.log(`🚀 LCP: ${entry.startTime.toFixed(2)}ms`);
                        
                        // If LCP is an image, prioritize its optimization
                        if (entry.element && entry.element.tagName === 'IMG') {
                            this.criticalImages.add(entry.element);
                            this.prioritizeImage(entry.element);
                        }
                    }
                });
            });
            
            try {
                this.performanceObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (error) {
                console.warn('⚠️ Performance Observer not fully supported:', error);
            }
        }
    }

    /**
     * Identify critical above-the-fold images
     */
    identifyCriticalImages() {
        const viewportHeight = window.innerHeight;
        const images = document.querySelectorAll('img, [data-bg-image]');
        
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            
            // Image is in viewport or close to it
            if (rect.top < viewportHeight + 100) {
                this.criticalImages.add(img);
                img.dataset.critical = 'true';
                
                // Load critical images immediately
                if (img.dataset.src || img.dataset.bgImage) {
                    this.loadImage(img, true);
                }
            }
        });
        
        console.log(`🎯 Identified ${this.criticalImages.size} critical images`);
    }

    /**
     * Setup lazy loading for non-critical images
     */
    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src], [data-bg-image]');
        
        lazyImages.forEach(img => {
            // Skip critical images (already loaded)
            if (!this.criticalImages.has(img)) {
                // Add loading placeholder
                this.addLoadingPlaceholder(img);
                
                // Observe for intersection
                this.intersectionObserver.observe(img);
                
                // Store image data
                this.images.set(img, {
                    loaded: false,
                    loading: false,
                    src: img.dataset.src || img.dataset.bgImage,
                    alt: img.alt || 'Image',
                    critical: this.criticalImages.has(img)
                });
            }
        });
        
        console.log(`⏳ Setup lazy loading for ${lazyImages.length - this.criticalImages.size} images`);
    }

    /**
     * Add loading placeholder with skeleton animation
     */
    addLoadingPlaceholder(img) {
        // Don't add placeholder to critical images
        if (this.criticalImages.has(img)) return;
        
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder skeleton';
        placeholder.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
                rgba(255, 255, 255, 0.1) 25%, 
                rgba(255, 255, 255, 0.2) 50%, 
                rgba(255, 255, 255, 0.1) 75%);
            background-size: 200% 100%;
            animation: loading-shimmer 1.5s infinite;
            border-radius: inherit;
            z-index: 1;
        `;
        
        // Make parent relative for absolute positioning
        const parent = img.parentElement;
        if (parent && getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        
        img.style.opacity = '0';
        parent.appendChild(placeholder);
        
        // Store placeholder reference
        img.dataset.placeholder = 'true';
    }

    /**
     * Load image with progressive enhancement
     */
    async loadImage(img, priority = false) {
        const imageData = this.images.get(img);
        
        // Prevent duplicate loading
        if (!imageData || imageData.loading || imageData.loaded) {
            return;
        }
        
        imageData.loading = true;
        const src = imageData.src;
        
        if (!src) return;
        
        try {
            console.log(`📥 Loading image: ${src.substring(0, 50)}...`);
            
            // Preload the image
            const imageLoader = new Image();
            
            // Set up performance timing
            const startTime = performance.now();
            
            // Handle successful load
            imageLoader.onload = () => {
                const loadTime = performance.now() - startTime;
                console.log(`✅ Image loaded in ${loadTime.toFixed(2)}ms`);
                
                this.applyLoadedImage(img, src, imageLoader);
                imageData.loaded = true;
                imageData.loading = false;
                this.loadedImages.add(img);
                
                // Remove from observer
                this.intersectionObserver.unobserve(img);
            };
            
            // Handle load error
            imageLoader.onerror = () => {
                console.warn(`❌ Failed to load image: ${src}`);
                this.handleImageError(img);
                imageData.loading = false;
            };
            
            // Set loading priority for critical images
            if (priority || this.criticalImages.has(img)) {
                imageLoader.loading = 'eager';
                imageLoader.decoding = 'sync';
            } else {
                imageLoader.loading = 'lazy';
                imageLoader.decoding = 'async';
            }
            
            // Start loading
            imageLoader.src = src;
            
        } catch (error) {
            console.error('❌ Image loading error:', error);
            this.handleImageError(img);
            imageData.loading = false;
        }
    }

    /**
     * Apply loaded image with smooth transition
     */
    applyLoadedImage(img, src, imageLoader) {
        // Remove placeholder
        this.removePlaceholder(img);
        
        if (img.dataset.bgImage) {
            // Background image
            img.style.backgroundImage = `url(${src})`;
            img.style.backgroundSize = 'cover';
            img.style.backgroundPosition = 'center';
            img.classList.add('bg-loaded');
        } else {
            // Regular image
            img.src = src;
            img.classList.add('img-loaded');
        }
        
        // Add dimensions if available
        if (imageLoader.naturalWidth && imageLoader.naturalHeight) {
            img.setAttribute('width', imageLoader.naturalWidth);
            img.setAttribute('height', imageLoader.naturalHeight);
        }
        
        // Smooth fade-in animation
        requestAnimationFrame(() => {
            img.style.opacity = '1';
            img.style.transition = 'opacity 0.3s ease-in-out';
        });
        
        // Dispatch custom event
        img.dispatchEvent(new CustomEvent('imageLoaded', {
            detail: { src, loadTime: performance.now() }
        }));
    }

    /**
     * Remove loading placeholder
     */
    removePlaceholder(img) {
        const placeholder = img.parentElement?.querySelector('.image-placeholder');
        if (placeholder) {
            placeholder.style.opacity = '0';
            placeholder.style.transition = 'opacity 0.3s ease-out';
            
            setTimeout(() => {
                if (placeholder.parentElement) {
                    placeholder.remove();
                }
            }, 300);
        }
    }

    /**
     * Handle image loading errors
     */
    handleImageError(img) {
        this.removePlaceholder(img);
        
        // Add error class
        img.classList.add('img-error');
        
        // Show fallback if available
        const fallback = img.dataset.fallback;
        if (fallback) {
            img.src = fallback;
        } else {
            // Create error placeholder
            const errorDiv = document.createElement('div');
            errorDiv.className = 'image-error';
            errorDiv.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                border-radius: 4px;
                min-height: 100px;
            `;
            errorDiv.textContent = '📷 Image unavailable';
            
            img.style.display = 'none';
            img.parentElement?.appendChild(errorDiv);
        }
    }

    /**
     * Setup progressive loading (low-res to high-res)
     */
    setupProgressiveLoading() {
        const progressiveImages = document.querySelectorAll('img[data-src-small][data-src]');
        
        progressiveImages.forEach(img => {
            const smallSrc = img.dataset.srcSmall;
            const fullSrc = img.dataset.src;
            
            if (smallSrc && fullSrc) {
                // Load small version first
                this.loadProgressiveImage(img, smallSrc, fullSrc);
            }
        });
    }

    async loadProgressiveImage(img, smallSrc, fullSrc) {
        try {
            // Load low-res version first
            const smallImage = new Image();
            smallImage.onload = () => {
                img.src = smallSrc;
                img.classList.add('progressive-loading');
                img.style.filter = 'blur(2px)';
                img.style.transition = 'filter 0.3s ease-out';
                
                // Then load high-res version
                const fullImage = new Image();
                fullImage.onload = () => {
                    img.src = fullSrc;
                    img.style.filter = 'none';
                    img.classList.remove('progressive-loading');
                    img.classList.add('progressive-loaded');
                };
                fullImage.src = fullSrc;
            };
            smallImage.src = smallSrc;
            
        } catch (error) {
            console.warn('⚠️ Progressive loading failed:', error);
            // Fallback to regular loading
            this.loadImage(img);
        }
    }

    /**
     * Prioritize critical image loading
     */
    prioritizeImage(img) {
        // Increase loading priority
        img.loading = 'eager';
        img.decoding = 'sync';
        
        // Load immediately if not already loaded
        if (!this.loadedImages.has(img)) {
            this.loadImage(img, true);
        }
    }

    /**
     * Optimize existing images
     */
    optimizeExistingImages() {
        const existingImages = document.querySelectorAll('img[src]');
        
        existingImages.forEach(img => {
            // Add loading attribute for modern browsers
            if (!img.hasAttribute('loading')) {
                img.loading = this.criticalImages.has(img) ? 'eager' : 'lazy';
            }
            
            // Add decoding attribute
            if (!img.hasAttribute('decoding')) {
                img.decoding = this.criticalImages.has(img) ? 'sync' : 'async';
            }
            
            // Optimize dimensions
            this.optimizeImageDimensions(img);
        });
    }

    /**
     * Optimize image dimensions to prevent layout shift
     */
    optimizeImageDimensions(img) {
        // If image has no dimensions set, add them to prevent CLS
        if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
            img.addEventListener('load', () => {
                if (img.naturalWidth && img.naturalHeight) {
                    img.setAttribute('width', img.naturalWidth);
                    img.setAttribute('height', img.naturalHeight);
                }
            }, { once: true });
        }
        
        // Add aspect-ratio CSS for better layout stability
        if (img.width && img.height) {
            const aspectRatio = img.width / img.height;
            img.style.aspectRatio = aspectRatio.toString();
        }
    }

    /**
     * Preload critical images for next navigation
     */
    preloadCriticalImages(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        const images = section.querySelectorAll('img[data-src], [data-bg-image]');
        const preloadPromises = [];
        
        images.forEach(img => {
            const src = img.dataset.src || img.dataset.bgImage;
            if (src && !this.loadedImages.has(img)) {
                preloadPromises.push(this.loadImage(img, false));
            }
        });
        
        return Promise.all(preloadPromises);
    }

    /**
     * Get image loading statistics
     */
    getStats() {
        return {
            totalImages: this.images.size,
            loadedImages: this.loadedImages.size,
            criticalImages: this.criticalImages.size,
            loadingProgress: (this.loadedImages.size / this.images.size) * 100
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        this.images.clear();
        this.loadedImages.clear();
        this.criticalImages.clear();
        
        console.log('🧹 Image Optimizer cleaned up');
    }
}

// Add CSS for image loading animations
const style = document.createElement('style');
style.textContent = `
    @keyframes loading-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    
    .image-placeholder {
        animation: loading-shimmer 1.5s ease-in-out infinite;
    }
    
    .progressive-loading {
        transition: filter 0.3s ease-out;
    }
    
    .progressive-loaded {
        filter: none !important;
    }
    
    .img-loaded,
    .bg-loaded {
        opacity: 1 !important;
        transition: opacity 0.3s ease-in-out;
    }
    
    .img-error {
        opacity: 0.6;
        filter: grayscale(100%);
    }
    
    .image-error {
        background: rgba(255, 255, 255, 0.05);
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.4);
        font-size: 12px;
        min-height: 100px;
    }
    
    /* Optimize for CLS */
    img {
        height: auto;
        max-width: 100%;
    }
    
    img[width][height] {
        aspect-ratio: attr(width) / attr(height);
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageOptimizer = new ImageOptimizer();
    });
} else {
    window.imageOptimizer = new ImageOptimizer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageOptimizer;
}