/**
 * LangSmith Integration for adrianwedd-cv Project
 * Tracks CV interactions, performance, and user engagement
 */

const { Client } = require('langsmith');
require('dotenv').config({ path: '.env.langsmith' });

class CVLangSmithTracker {
    constructor() {
        this.client = new Client({
            apiKey: process.env.LANGSMITH_API_KEY,
            apiUrl: process.env.LANGSMITH_ENDPOINT
        });
        this.projectName = process.env.LANGSMITH_PROJECT || 'adrianwedd-cv';
        this.tracingEnabled = process.env.LANGSMITH_TRACING === 'true';
    }

    /**
     * Track page view events
     */
    async trackPageView(page, metadata = {}) {
        if (!this.tracingEnabled) return;

        try {
            await this.client.createRun({
                project_name: this.projectName,
                name: 'cv_page_view',
                run_type: 'chain',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                inputs: {
                    page,
                    timestamp: new Date().toISOString(),
                    ...metadata
                },
                outputs: {
                    success: true
                },
                tags: ['cv', 'page-view', page],
                extra: {
                    environment: process.env.PROJECT_ENVIRONMENT || 'production',
                    version: process.env.PROJECT_VERSION || '2.0.0'
                }
            });
            console.log(`✅ Tracked page view: ${page}`);
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    }

    /**
     * Track user interactions
     */
    async trackInteraction(action, element, metadata = {}) {
        if (!this.tracingEnabled) return;

        try {
            await this.client.createRun({
                project_name: this.projectName,
                name: 'user_interaction',
                run_type: 'tool',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                inputs: {
                    action,
                    element,
                    ...metadata
                },
                outputs: {
                    tracked: true
                },
                tags: ['cv', 'interaction', action],
                extra: {
                    user_agent: metadata.userAgent,
                    session_id: metadata.sessionId
                }
            });
            console.log(`✅ Tracked interaction: ${action} on ${element}`);
        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    }

    /**
     * Track performance metrics
     */
    async trackPerformance(metrics) {
        if (!this.tracingEnabled) return;

        try {
            await this.client.createRun({
                project_name: this.projectName,
                name: 'performance_metrics',
                run_type: 'llm',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                inputs: {
                    metrics_type: 'web_vitals',
                    timestamp: new Date().toISOString()
                },
                outputs: metrics,
                tags: ['cv', 'performance', 'metrics'],
                extra: {
                    fcp: metrics.fcp,
                    lcp: metrics.lcp,
                    cls: metrics.cls,
                    ttfb: metrics.ttfb,
                    fid: metrics.fid
                }
            });
            console.log('✅ Tracked performance metrics');
        } catch (error) {
            console.error('Error tracking performance:', error);
        }
    }

    /**
     * Track CV downloads
     */
    async trackDownload(format = 'pdf', metadata = {}) {
        if (!this.tracingEnabled) return;

        try {
            await this.client.createRun({
                project_name: this.projectName,
                name: 'cv_download',
                run_type: 'chain',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                inputs: {
                    format,
                    timestamp: new Date().toISOString(),
                    ...metadata
                },
                outputs: {
                    success: true,
                    format
                },
                tags: ['cv', 'download', format],
                extra: {
                    referrer: metadata.referrer,
                    session_id: metadata.sessionId
                }
            });
            console.log(`✅ Tracked CV download: ${format}`);
        } catch (error) {
            console.error('Error tracking download:', error);
        }
    }

    /**
     * Track external link clicks
     */
    async trackExternalLink(url, linkType, metadata = {}) {
        if (!this.tracingEnabled) return;

        try {
            await this.client.createRun({
                project_name: this.projectName,
                name: 'external_link_click',
                run_type: 'tool',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                inputs: {
                    url,
                    link_type: linkType,
                    timestamp: new Date().toISOString(),
                    ...metadata
                },
                outputs: {
                    clicked: true
                },
                tags: ['cv', 'external-link', linkType],
                extra: {
                    destination: url,
                    link_category: linkType
                }
            });
            console.log(`✅ Tracked external link: ${linkType} -> ${url}`);
        } catch (error) {
            console.error('Error tracking external link:', error);
        }
    }

    /**
     * Track session analytics
     */
    async trackSession(sessionData) {
        if (!this.tracingEnabled) return;

        try {
            await this.client.createRun({
                project_name: this.projectName,
                name: 'session_analytics',
                run_type: 'chain',
                start_time: sessionData.startTime,
                end_time: sessionData.endTime || new Date().toISOString(),
                inputs: {
                    session_id: sessionData.sessionId,
                    user_agent: sessionData.userAgent,
                    referrer: sessionData.referrer
                },
                outputs: {
                    duration: sessionData.duration,
                    pages_viewed: sessionData.pagesViewed,
                    interactions: sessionData.interactions
                },
                tags: ['cv', 'session', 'analytics'],
                extra: sessionData
            });
            console.log(`✅ Tracked session: ${sessionData.sessionId}`);
        } catch (error) {
            console.error('Error tracking session:', error);
        }
    }
}

// Browser-side tracking code
const browserTracking = `
<script>
// LangSmith CV Tracking
(function() {
    const LANGSMITH_ENDPOINT = '${process.env.LANGSMITH_ENDPOINT || 'http://localhost:8080'}';
    const SESSION_ID = Math.random().toString(36).substring(7);
    const START_TIME = new Date().toISOString();
    
    // Track page view
    fetch(LANGSMITH_ENDPOINT + '/track/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            page: window.location.pathname,
            sessionId: SESSION_ID,
            referrer: document.referrer,
            userAgent: navigator.userAgent
        })
    });
    
    // Track performance metrics
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perf = window.performance.timing;
                const metrics = {
                    fcp: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
                    lcp: perf.loadEventEnd - perf.loadEventStart,
                    ttfb: perf.responseStart - perf.navigationStart,
                    domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
                    pageLoad: perf.loadEventEnd - perf.navigationStart
                };
                
                fetch(LANGSMITH_ENDPOINT + '/track/performance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        metrics,
                        sessionId: SESSION_ID
                    })
                });
            }, 0);
        });
    }
    
    // Track clicks
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a, button');
        if (target) {
            const data = {
                action: 'click',
                element: target.tagName,
                text: target.textContent.trim().substring(0, 50),
                href: target.href,
                sessionId: SESSION_ID
            };
            
            if (target.href && !target.href.startsWith(window.location.origin)) {
                // External link
                fetch(LANGSMITH_ENDPOINT + '/track/external', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Internal interaction
                fetch(LANGSMITH_ENDPOINT + '/track/interaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
        }
    });
    
    // Track session end
    window.addEventListener('beforeunload', function() {
        const duration = new Date() - new Date(START_TIME);
        navigator.sendBeacon(LANGSMITH_ENDPOINT + '/track/session', JSON.stringify({
            sessionId: SESSION_ID,
            startTime: START_TIME,
            endTime: new Date().toISOString(),
            duration: duration
        }));
    });
})();
</script>
`;

// Export for use
module.exports = {
    CVLangSmithTracker,
    browserTracking
};

// CLI usage
if (require.main === module) {
    const tracker = new CVLangSmithTracker();
    
    console.log('🔍 LangSmith CV Tracker Initialized');
    console.log('==================================');
    console.log(`Project: ${tracker.projectName}`);
    console.log(`Tracing: ${tracker.tracingEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Endpoint: ${process.env.LANGSMITH_ENDPOINT}`);
    console.log('');
    console.log('📊 Available tracking methods:');
    console.log('  - trackPageView(page, metadata)');
    console.log('  - trackInteraction(action, element, metadata)');
    console.log('  - trackPerformance(metrics)');
    console.log('  - trackDownload(format, metadata)');
    console.log('  - trackExternalLink(url, linkType, metadata)');
    console.log('  - trackSession(sessionData)');
    console.log('');
    console.log('💡 Add browser tracking to your HTML:');
    console.log('  Copy the browserTracking script to your index.html');
}