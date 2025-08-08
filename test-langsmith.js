/**
 * Test LangSmith Integration for adrianwedd-cv Project
 */

require('dotenv').config({ path: '.env.langsmith' });
const { CVLangSmithTracker } = require('./langsmith-integration');

async function testLangSmithIntegration() {
    
    
    
    // Verify environment
    
    
    
    
    
    
    
    const tracker = new CVLangSmithTracker();
    
    if (process.env.LANGSMITH_TRACING !== 'true') {
        
        
        return;
    }
    
    
    
    // Test 1: Page View
    
    await tracker.trackPageView('home', {
        referrer: 'https://google.com',
        userAgent: 'Test Browser 1.0',
        sessionId: 'test-session-123'
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 2: User Interaction
    
    await tracker.trackInteraction('click', 'contact-button', {
        sessionId: 'test-session-123',
        timestamp: new Date().toISOString()
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 3: Performance Metrics
    
    await tracker.trackPerformance({
        fcp: 1200,
        lcp: 2500,
        cls: 0.05,
        ttfb: 800,
        fid: 50
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 4: CV Download
    
    await tracker.trackDownload('pdf', {
        sessionId: 'test-session-123',
        referrer: 'https://linkedin.com'
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 5: External Link
    
    await tracker.trackExternalLink('https://github.com/adrianwedd', 'github', {
        sessionId: 'test-session-123'
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 6: Session Analytics
    
    await tracker.trackSession({
        sessionId: 'test-session-123',
        startTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        endTime: new Date().toISOString(),
        duration: 300000,
        pagesViewed: 5,
        interactions: 12,
        userAgent: 'Test Browser 1.0',
        referrer: 'https://google.com'
    });
    
    
    
    
    
    
    
    
    
    
}

// Run the test
testLangSmithIntegration().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});