#!/usr/bin/env node

/**
 * Simple test for browser auth refresh system
 */

import { BrowserAuthRefresh } from './browser-auth-refresh.js';

async function test() {
    console.log('🧪 Testing Browser Auth Refresh System...');
    
    try {
        const refreshSystem = new BrowserAuthRefresh({
            headless: true,
            healthCheckInterval: 60000 // 1 minute for testing
        });
        
        console.log('✅ BrowserAuthRefresh instance created');
        
        await refreshSystem.initialize();
        console.log('✅ System initialized');
        
        const report = refreshSystem.generateStatusReport();
        console.log('✅ Status report generated');
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

test().catch(console.error);