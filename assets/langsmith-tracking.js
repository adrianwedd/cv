/**
 * Browser-side LangSmith tracking integration for CV website
 * Automatically tracks page views, interactions, and performance
 */

(function(window, document) {
    'use strict';
    
    // Configuration - Only enable in development
    const CONFIG = {
        endpoint: 'http://localhost:8080', // LangSmith proxy endpoint
        project: 'adrianwedd-cv',
        sessionId: Math.random().toString(36).substring(7),
        startTime: new Date().toISOString(),
        debug: false,
        enabled: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    };
    
    // Utilities
    function log(...args) {
        if (CONFIG.debug) {
            
        }
    }
    
    function sendEvent(endpoint, data) {
        if (!CONFIG.enabled) {
            return; // Skip tracking in production
        }
        try {
            fetch(`${CONFIG.endpoint}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    sessionId: CONFIG.sessionId,
                    timestamp: new Date().toISOString(),
                    project: CONFIG.project
                })
            }).catch(error => {
                log('Failed to send event:', error);
            });
        } catch (error) {
            log('Error sending event:', error);
        }
    }
    
    // Track page view
    function trackPageView() {
        const pageData = {
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        sendEvent('/track/pageview', pageData);
        log('Page view tracked:', pageData);
    }
    
    // Track user interactions
    function trackInteraction(event) {
        const target = event.target;
        const data = {
            action: event.type,
            element: target.tagName.toLowerCase(),
            id: target.id || null,
            className: target.className || null,
            text: target.textContent ? target.textContent.trim().substring(0, 100) : null,
            href: target.href || null
        };
        
        sendEvent('/track/interaction', data);
        log('Interaction tracked:', data);
    }
    
    // Track external link clicks
    function trackExternalLink(event) {
        const target = event.target.closest('a');
        if (target && target.href && !target.href.startsWith(window.location.origin)) {
            const data = {
                url: target.href,
                text: target.textContent.trim().substring(0, 50),
                type: getLinkType(target.href)
            };
            
            sendEvent('/track/external-link', data);
            log('External link tracked:', data);
        }
    }
    
    // Determine link type
    function getLinkType(url) {
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            
            if (hostname.includes('github.com')) return 'github';
            if (hostname.includes('linkedin.com')) return 'linkedin';
            if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
            if (hostname.includes('email') || url.startsWith('mailto:')) return 'email';
            
            return 'external';
        } catch {
            return 'unknown';
        }
    }
    
    // Track performance metrics
    function trackPerformance() {
        if (!window.performance || !window.performance.timing) {
            log('Performance API not available');
            return;
        }
        
        const timing = window.performance.timing;
        const navigation = window.performance.navigation;
        
        const metrics = {
            // Core Web Vitals approximations
            fcp: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            lcp: timing.loadEventEnd - timing.loadEventStart,
            ttfb: timing.responseStart - timing.navigationStart,
            
            // Additional metrics
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            pageLoad: timing.loadEventEnd - timing.navigationStart,
            redirectTime: timing.redirectEnd - timing.redirectStart,
            dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
            connectTime: timing.connectEnd - timing.connectStart,
            
            // Navigation info
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount
        };
        
        sendEvent('/track/performance', { metrics });
        log('Performance tracked:', metrics);
    }
    
    // Track downloads
    function trackDownload(event) {
        const target = event.target.closest('a');
        if (target && target.href) {
            const url = target.href;
            const extension = url.split('.').pop()?.toLowerCase();
            
            if (['pdf', 'doc', 'docx', 'txt', 'zip', 'cv'].includes(extension)) {
                const data = {
                    format: extension,
                    url: url,
                    filename: url.split('/').pop(),
                    size: null // Would need server-side info
                };
                
                sendEvent('/track/download', data);
                log('Download tracked:', data);
            }
        }
    }
    
    // Track scroll depth
    let maxScrollDepth = 0;
    function trackScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
        
        if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;
            
            // Send milestone events
            if (scrollPercent >= 25 && scrollPercent < 50 && maxScrollDepth >= 25) {
                sendEvent('/track/scroll', { depth: '25%', percent: scrollPercent });
            } else if (scrollPercent >= 50 && scrollPercent < 75 && maxScrollDepth >= 50) {
                sendEvent('/track/scroll', { depth: '50%', percent: scrollPercent });
            } else if (scrollPercent >= 75 && scrollPercent < 90 && maxScrollDepth >= 75) {
                sendEvent('/track/scroll', { depth: '75%', percent: scrollPercent });
            } else if (scrollPercent >= 90 && maxScrollDepth >= 90) {
                sendEvent('/track/scroll', { depth: '90%', percent: scrollPercent });
            }
        }
    }
    
    // Track session end
    function trackSessionEnd() {
        const duration = new Date() - new Date(CONFIG.startTime);
        const data = {
            sessionId: CONFIG.sessionId,
            startTime: CONFIG.startTime,
            endTime: new Date().toISOString(),
            duration: duration,
            maxScrollDepth: maxScrollDepth,
            interactions: window.langsmithInteractionCount || 0
        };
        
        // Use sendBeacon for reliable delivery on page unload
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                `${CONFIG.endpoint}/track/session-end`,
                JSON.stringify(data)
            );
        } else {
            sendEvent('/track/session-end', data);
        }
        
        log('Session end tracked:', data);
    }
    
    // Initialize tracking
    function init() {
        if (!CONFIG.enabled) {
            console.log('LangSmith tracking disabled in production');
            return; // Skip all tracking in production
        }
        
        log('Initializing LangSmith tracking...');
        
        // Track initial page view
        trackPageView();
        
        // Set up event listeners
        document.addEventListener('click', function(event) {
            trackInteraction(event);
            trackExternalLink(event);
            trackDownload(event);
        });
        
        document.addEventListener('scroll', trackScrollDepth, { passive: true });
        
        // Track performance when page loads
        if (document.readyState === 'loading') {
            window.addEventListener('load', function() {
                setTimeout(trackPerformance, 100); // Small delay for accuracy
            });
        } else {
            setTimeout(trackPerformance, 100);
        }
        
        // Track session end
        window.addEventListener('beforeunload', trackSessionEnd);
        window.addEventListener('pagehide', trackSessionEnd);
        
        // Initialize interaction counter
        window.langsmithInteractionCount = 0;
        
        log('LangSmith tracking initialized');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for manual usage
    window.LangSmithTracking = {
        trackPageView,
        trackInteraction,
        trackPerformance,
        trackDownload,
        trackExternalLink,
        config: CONFIG
    };
    
})(window, document);
