/**
 * WebP Image Optimization System
 * Automatically converts and serves WebP images with fallbacks
 */

class WebPOptimizer {
    constructor() {
        this.webpSupported = null;
        this.conversionQueue = [];
        this.isProcessing = false;
        this.cache = new Map();
        
        this.init();
    }

    async init() {
        console.log('🖼️ Initializing WebP Optimization System');
        
        // Test WebP support
        this.webpSupported = await this.testWebPSupport();
        
        if (this.webpSupported) {
            console.log('✅ WebP supported - enabling optimization');
            document.documentElement.classList.add('webp-supported');
            this.setupResponsiveImages();
            this.setupLazyLoading();
            this.optimizeExistingImages();
        } else {
            console.log('❌ WebP not supported - using fallback images');
            document.documentElement.classList.add('webp-not-supported');
            this.setupFallbackOptimization();
        }
    }

    async testWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    setupResponsiveImages() {
        // Create responsive images with WebP sources
        const images = document.querySelectorAll('img:not([data-webp-optimized])');
        
        images.forEach(img => {
            this.convertToResponsiveWebP(img);
        });
    }

    convertToResponsiveWebP(img) {
        if (img.dataset.webpOptimized) return;
        
        const originalSrc = img.src || img.dataset.src;
        if (!originalSrc) return;
        
        // Mark as processed
        img.dataset.webpOptimized = 'true';
        
        // Create picture element with WebP source
        const picture = document.createElement('picture');
        picture.className = img.className;
        
        // WebP source with responsive sizes
        const webpSource = document.createElement('source');
        webpSource.type = 'image/webp';
        webpSource.srcset = this.generateWebPSrcSet(originalSrc);
        webpSource.sizes = this.generateSizes(img);
        
        // Fallback source
        const fallbackSource = document.createElement('source');
        fallbackSource.type = this.getImageType(originalSrc);
        fallbackSource.srcset = this.generateFallbackSrcSet(originalSrc);
        fallbackSource.sizes = this.generateSizes(img);
        
        // Update img element
        img.src = originalSrc;
        img.alt = img.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        
        // Add responsive classes
        img.classList.add('responsive-image');
        
        // Build picture element
        picture.appendChild(webpSource);
        picture.appendChild(fallbackSource);
        picture.appendChild(img);
        
        // Replace original image
        if (img.parentNode) {
            img.parentNode.replaceChild(picture, img);
        }
    }

    generateWebPSrcSet(originalSrc) {
        const baseName = this.getBaseName(originalSrc);
        const sizes = [320, 480, 768, 1024, 1200, 1600];
        
        return sizes.map(size => {
            const webpUrl = `${baseName}-${size}w.webp`;
            return `${webpUrl} ${size}w`;
        }).join(', ');
    }

    generateFallbackSrcSet(originalSrc) {
        const baseName = this.getBaseName(originalSrc);
        const extension = this.getExtension(originalSrc);
        const sizes = [320, 480, 768, 1024, 1200, 1600];
        
        return sizes.map(size => {
            const fallbackUrl = `${baseName}-${size}w.${extension}`;
            return `${fallbackUrl} ${size}w`;
        }).join(', ');
    }

    generateSizes(img) {
        // Generate responsive sizes based on image context
        const container = img.closest('.container, .section-content, .project-card');
        
        if (img.classList.contains('profile-image')) {
            return '(max-width: 768px) 80px, 120px';
        } else if (img.classList.contains('project-image')) {
            return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw';
        } else if (container) {
            return '(max-width: 480px) 100vw, (max-width: 768px) 90vw, 80vw';
        }
        
        return '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw';
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target.tagName === 'IMG' ? entry.target : entry.target.querySelector('img');
                        if (img) {
                            this.loadResponsiveImage(img);
                            imageObserver.unobserve(entry.target);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            // Observe all picture elements and images with data-src
            document.querySelectorAll('picture, img[data-src]').forEach(element => {
                imageObserver.observe(element);
            });
        }
    }

    loadResponsiveImage(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
        
        // Load srcset if available
        const picture = img.closest('picture');
        if (picture) {
            const sources = picture.querySelectorAll('source[data-srcset]');
            sources.forEach(source => {
                if (source.dataset.srcset) {
                    source.srcset = source.dataset.srcset;
                    source.removeAttribute('data-srcset');
                }
            });
        }
        
        img.classList.add('loaded');
        
        // Fade in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        img.onload = () => {
            img.style.opacity = '1';
        };
    }

    optimizeExistingImages() {
        // Optimize images that are already loaded
        const images = document.querySelectorAll('img:not([data-webp-optimized])');
        
        images.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
                this.addImageOptimizations(img);
            } else {
                img.addEventListener('load', () => {
                    this.addImageOptimizations(img);
                });
            }
        });
    }

    addImageOptimizations(img) {
        // Add loading optimization attributes
        img.decoding = 'async';
        
        // Add responsive behavior
        if (!img.classList.contains('responsive-image')) {
            img.classList.add('responsive-image');
        }
        
        // Add intersection observer for additional optimizations
        this.observeImagePerformance(img);
    }

    observeImagePerformance(img) {
        // Monitor image performance
        const startTime = performance.now();
        
        img.addEventListener('load', () => {
            const loadTime = performance.now() - startTime;
            this.reportImageMetric(img, 'load_time', loadTime);
        });
        
        img.addEventListener('error', () => {
            this.reportImageMetric(img, 'load_error', true);
            this.handleImageError(img);
        });
    }

    handleImageError(img) {
        console.warn('❌ Image failed to load:', img.src);
        
        // Try fallback image
        const picture = img.closest('picture');
        if (picture) {
            const fallbackSource = picture.querySelector('source:last-of-type');
            if (fallbackSource && fallbackSource.srcset) {
                const fallbackUrl = fallbackSource.srcset.split(' ')[0];
                img.src = fallbackUrl;
                return;
            }
        }
        
        // Show placeholder
        this.showImagePlaceholder(img);
    }

    showImagePlaceholder(img) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            width: ${img.width || 200}px;
            height: ${img.height || 150}px;
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
        `;
        placeholder.textContent = 'Image unavailable';
        
        if (img.parentNode) {
            img.parentNode.replaceChild(placeholder, img);
        }
    }

    setupFallbackOptimization() {
        // For browsers that don't support WebP, optimize traditional formats
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            this.optimizeTraditionalImage(img);
        });
    }

    optimizeTraditionalImage(img) {
        // Add loading optimization
        img.loading = 'lazy';
        img.decoding = 'async';
        
        // Add responsive behavior
        if (!img.srcset && img.src) {
            img.srcset = this.generateFallbackSrcSet(img.src);
            img.sizes = this.generateSizes(img);
        }
        
        img.classList.add('optimized-fallback');
    }

    // Utility methods
    getBaseName(src) {
        return src.replace(/\.[^/.]+$/, '');
    }

    getExtension(src) {
        const match = src.match(/\.([^/.]+)$/);
        return match ? match[1] : 'jpg';
    }

    getImageType(src) {
        const ext = this.getExtension(src).toLowerCase();
        const typeMap = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml'
        };
        return typeMap[ext] || 'image/jpeg';
    }

    reportImageMetric(img, metric, value) {
        console.log(`📊 Image Metric - ${metric}:`, value, img.src);
        
        // Report to performance monitoring
        if (window.gtag) {
            gtag('event', 'image_performance', {
                metric_name: metric,
                metric_value: typeof value === 'number' ? Math.round(value) : value,
                image_src: img.src.substring(0, 100) // Truncate for privacy
            });
        }
    }

    // Public API
    async convertImage(src, options = {}) {
        const {
            quality = 80,
            width,
            height,
            format = 'webp'
        } = options;
        
        if (this.cache.has(src)) {
            return this.cache.get(src);
        }
        
        try {
            // In a real implementation, this would call a server endpoint
            // For now, we'll return the original source
            const optimizedSrc = src; // Placeholder
            
            this.cache.set(src, optimizedSrc);
            return optimizedSrc;
        } catch (error) {
            console.error('Image conversion failed:', error);
            return src; // Return original on failure
        }
    }

    preloadCriticalImages(urls) {
        urls.forEach(url => {
            if (this.webpSupported) {
                // Preload WebP version
                const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                this.preloadImage(webpUrl, url);
            } else {
                this.preloadImage(url);
            }
        });
    }

    preloadImage(src, fallback = null) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        
        if (fallback) {
            link.addEventListener('error', () => {
                // Preload fallback if WebP fails
                const fallbackLink = document.createElement('link');
                fallbackLink.rel = 'preload';
                fallbackLink.as = 'image';
                fallbackLink.href = fallback;
                document.head.appendChild(fallbackLink);
            });
        }
        
        document.head.appendChild(link);
    }

    generateImageVariants(src, widths = [320, 480, 768, 1024, 1200, 1600]) {
        const baseName = this.getBaseName(src);
        const extension = this.getExtension(src);
        
        const variants = {
            webp: widths.map(w => ({ width: w, src: `${baseName}-${w}w.webp` })),
            original: widths.map(w => ({ width: w, src: `${baseName}-${w}w.${extension}` }))
        };
        
        return variants;
    }

    // Progressive enhancement for images
    enhanceImagesProgressively() {
        // Start with low quality placeholders
        this.loadLowQualityPlaceholders();
        
        // Then load full quality images
        setTimeout(() => {
            this.loadFullQualityImages();
        }, 100);
    }

    loadLowQualityPlaceholders() {
        const images = document.querySelectorAll('img[data-lqip]');
        
        images.forEach(img => {
            if (img.dataset.lqip) {
                img.src = img.dataset.lqip;
                img.style.filter = 'blur(5px)';
                img.style.transition = 'filter 0.3s ease';
            }
        });
    }

    loadFullQualityImages() {
        const images = document.querySelectorAll('img[data-lqip]');
        
        images.forEach(img => {
            const fullSrc = img.dataset.src || img.dataset.fullSrc;
            if (fullSrc) {
                const fullImg = new Image();
                fullImg.onload = () => {
                    img.src = fullSrc;
                    img.style.filter = 'none';
                    img.classList.add('full-quality-loaded');
                };
                fullImg.src = fullSrc;
            }
        });
    }
}

// Initialize WebP Optimization
document.addEventListener('DOMContentLoaded', () => {
    window.webpOptimizer = new WebPOptimizer();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebPOptimizer;
}