/**
 * Test LangSmith Integration for adrianwedd-cv Project
 */

require('dotenv').config({ path: '.env.langsmith' });
const { CVLangSmithTracker } = require('./langsmith-integration');

async function testLangSmithIntegration() {
    console.log('🧪 Testing LangSmith Integration for adrianwedd-cv\n');
    console.log('================================================');
    
    // Verify environment
    console.log('📋 Environment Configuration:');
    console.log(`  API Key: ${process.env.LANGSMITH_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Project: ${process.env.LANGSMITH_PROJECT}`);
    console.log(`  Endpoint: ${process.env.LANGSMITH_ENDPOINT}`);
    console.log(`  Tracing: ${process.env.LANGSMITH_TRACING}`);
    console.log('');
    
    const tracker = new CVLangSmithTracker();
    
    if (process.env.LANGSMITH_TRACING !== 'true') {
        console.log('⚠️  LangSmith tracing is disabled. Enable it to send data.');
        console.log('  Set LANGSMITH_TRACING=true in .env.langsmith');
        return;
    }
    
    console.log('🚀 Sending test events to LangSmith...\n');
    
    // Test 1: Page View
    console.log('1️⃣ Testing page view tracking...');
    await tracker.trackPageView('home', {
        referrer: 'https://google.com',
        userAgent: 'Test Browser 1.0',
        sessionId: 'test-session-123'
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 2: User Interaction
    console.log('2️⃣ Testing interaction tracking...');
    await tracker.trackInteraction('click', 'contact-button', {
        sessionId: 'test-session-123',
        timestamp: new Date().toISOString()
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 3: Performance Metrics
    console.log('3️⃣ Testing performance tracking...');
    await tracker.trackPerformance({
        fcp: 1200,
        lcp: 2500,
        cls: 0.05,
        ttfb: 800,
        fid: 50
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 4: CV Download
    console.log('4️⃣ Testing download tracking...');
    await tracker.trackDownload('pdf', {
        sessionId: 'test-session-123',
        referrer: 'https://linkedin.com'
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 5: External Link
    console.log('5️⃣ Testing external link tracking...');
    await tracker.trackExternalLink('https://github.com/adrianwedd', 'github', {
        sessionId: 'test-session-123'
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 6: Session Analytics
    console.log('6️⃣ Testing session tracking...');
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
    
    console.log('\n✅ Test events sent successfully!');
    console.log('');
    console.log('📊 View your data in LangSmith:');
    console.log(`   https://smith.langchain.com/o/adrianwedd/projects/p/${process.env.LANGSMITH_PROJECT}`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('  1. Check LangSmith dashboard for the test events');
    console.log('  2. Add browser tracking to your index.html');
    console.log('  3. Deploy monitoring infrastructure with ./setup-monitoring.sh');
}

// Run the test
testLangSmithIntegration().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});