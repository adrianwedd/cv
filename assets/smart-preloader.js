/**
 * Minimal Smart Resource Preloader - Clean version without syntax errors
 */

class SmartResourcePreloader {
    constructor() {
        this.preloadedResources = new Set();
        this.init();
    }

    init() {
        this.detectConnection();
        this.preloadCriticalResources();
    }

    detectConnection() {
        if ('connection' in navigator) {
            this.connectionType = navigator.connection.effectiveType;
        } else {
            this.connectionType = '4g'; // Default assumption
        }
    }

    preloadCriticalResources() {
        // Only preload essential resources
        const criticalResources = [
            'assets/styles.min.css',
            'data/base-cv.json'
        ];

        criticalResources.forEach(resource => {
            this.preloadResource(resource);
        });
    }

    preloadResource(href) {
        if (this.preloadedResources.has(href)) {
            return;
        }

        const link = document.createElement('link');
        
        if (href.endsWith('.js')) {
            link.rel = 'preload';
            link.as = 'script';
        } else if (href.endsWith('.json')) {
            link.rel = 'preload';
            link.as = 'fetch';
            link.crossOrigin = 'anonymous';
        } else if (href.endsWith('.css')) {
            link.rel = 'preload';
            link.as = 'style';
        }
        
        link.href = href;
        
        link.onload = () => {
            console.log('Preloaded: ' + href);
        };
        
        link.onerror = () => {
            console.warn('Failed to preload: ' + href);
        };
        
        document.head.appendChild(link);
        this.preloadedResources.add(href);
    }

    preload(href) {
        this.preloadResource(href);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.smartPreloader = new SmartResourcePreloader();
    });
} else {
    window.smartPreloader = new SmartResourcePreloader();
}