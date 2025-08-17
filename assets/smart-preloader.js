
/**
 * Smart Resource Preloader - Intelligent Loading Strategy
 * 
 * Features:
 * - Connection type detection
 * - Viewport-based preloading
 * - User interaction prediction
 * - Memory-efficient resource management
 */

class SmartResourcePreloader {
    constructor() {
        this.connectionType = this.getConnectionType();
        this.isLowEndDevice = this.isLowEndDevice();
        this.preloadedResources = new Set();
        
        this.resourcePriorities = {
            critical: ['assets/script.critical.min.js', 'data/base-cv.json'],
            important: ['assets/chunks/performance-monitor.min.js'],
            deferred: ['assets/chunks/export-system.min.js']
        };
        
        this.init();
    }

    init() {
        `);
        
        // Preload based on connection and device capabilities
        this.adaptivePreloading();
        
        // Set up interaction-based preloading
        this.setupInteractionPreloading();
        
        // Monitor resource usage
        this.monitorResourceUsage();
    }

    getConnectionType() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const type = connection.effectiveType || connection.type || 'unknown';
            return type;
        }
        return 'unknown';
    }

    isLowEndDevice() {
        // Detect low-end devices based on available indicators
        if ('deviceMemory' in navigator && navigator.deviceMemory <= 2) {
            return true;
        }
        
        if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 2) {
            return true;
        }
        
        // Fallback: check user agent for known low-end patterns
        const ua = navigator.userAgent.toLowerCase();
        return ua.includes('android') && (ua.includes('chrome/') && parseInt(ua.split('chrome/')[1]) < 70);
    }

    adaptivePreloading() {
        // Adjust preloading strategy based on connection and device
        if (this.connectionType === '4g' && !this.isLowEndDevice) {
            // Aggressive preloading for good connections
            this.preloadResourceGroup('critical');
            
            setTimeout(() => {
                this.preloadResourceGroup('important');
            }, 1000);
            
            setTimeout(() => {
                this.preloadResourceGroup('deferred');
            }, 3000);
            
        } else if (this.connectionType === '3g' || this.connectionType === '2g') {
            // Conservative preloading for slower connections
            this.preloadResourceGroup('critical');
            
            // Only preload important resources on user interaction
            this.setupDeferredPreloading('important');
            
        } else {
            // Default strategy for unknown connections
            this.preloadResourceGroup('critical');
        }
    }

    preloadResourceGroup(priority) {
        const resources = this.resourcePriorities[priority] || [];
        
        resources.forEach(resource => {
            this.preloadResource(resource);
        });
        
        
    }

    preloadResource(href) {
        if (this.preloadedResources.has(href)) {
            return; // Already preloaded
        }
        
        const link = document.createElement('link');
        
        // Determine preload type based on file extension
        if (href.endsWith('.js')) {
            if (href.includes('/chunks/')) {
                link.rel = 'modulepreload';
            } else {
                link.rel = 'preload';
                link.as = 'script';
            }
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

    setupInteractionPreloading() {
        // Preload resources when user shows intent to navigate
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(navItem => {
            navItem.addEventListener('mouseenter', () => {
                const section = navItem.dataset.section;
                this.preloadSectionResources(section);
            }, { once: true, passive: true });
        });
        
        // Preload export resources when user hovers over download links
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('a[href*="pdf"], a[href*="download"]')) {
                this.preloadResource('assets/chunks/export-system.min.js');
            }
        }, { passive: true });
    }

    setupDeferredPreloading(priority) {
        // Wait for user interaction before preloading
        const interactionEvents = ['click', 'touchstart', 'scroll'];
        
        const loadOnInteraction = () => {
            this.preloadResourceGroup(priority);
            
            // Remove listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, loadOnInteraction);
            });
        };
        
        interactionEvents.forEach(event => {
            document.addEventListener(event, loadOnInteraction, { 
                once: true, 
                passive: true 
            });
        });
    }

    preloadSectionResources(section) {
        const sectionResources = {
            'projects': ['assets/chunks/data-visualizer.min.js'],
            'skills': ['assets/chunks/data-visualizer.min.js'],
            'experience': ['data/activity-summary.json'],
            'achievements': ['data/ai-enhancements.json']
        };
        
        const resources = sectionResources[section] || [];
        resources.forEach(resource => {
            this.preloadResource(resource);
        });
    }

    monitorResourceUsage() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.initiatorType === 'link' && 
                        (entry.name.includes('preload') || entry.name.includes('modulepreload'))) {
                        
                        const loadTime = entry.responseEnd - entry.requestStart;
                        console.log('Preload timing: ' + entry.name + ' (' + loadTime + 'ms)');
                    }
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    // Public API for manual resource preloading
    preload(href) {
        this.preloadResource(href);
    }

    getPreloadedResources() {
        return Array.from(this.preloadedResources);
    }
}

// Global initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.smartPreloader = new SmartResourcePreloader();
    });
} else {
    window.smartPreloader = new SmartResourcePreloader();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartResourcePreloader;
}
