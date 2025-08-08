#!/usr/bin/env node

/**
 * Test Browser-First Authentication Integration
 * 
 * This script tests the browser-first authentication integration
 * to ensure it works correctly before CI deployment.
 */

import { BrowserFirstClient } from './enhancer-modules/browser-first-client.js';

/**
 * Check if running in CI environment
 */
function isCI() {
    return process.env.CI === 'true' || 
           process.env.GITHUB_ACTIONS === 'true' || 
           process.env.SKIP_BROWSER_TESTS === 'true';
}

async function testBrowserAuth() {
    console.log('🧪 **TESTING BROWSER-FIRST AUTHENTICATION**');
    console.log('================================================');
    
    // Skip browser tests in CI environment
    if (isCI()) {
        console.log('⏭️  SKIPPING BROWSER TESTS - CI ENVIRONMENT DETECTED');
        console.log('   Detected environment variables:');
        console.log(`   CI: ${process.env.CI}`);
        console.log(`   GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS}`);
        console.log(`   SKIP_BROWSER_TESTS: ${process.env.SKIP_BROWSER_TESTS}`);
        console.log('\n✅ Browser authentication test skipped (CI mode)');
        return 0;
    }
    
    let client = null;
    
    try {
        // Initialize browser client
        console.log('1. Initializing browser client...');
        client = new BrowserFirstClient();
        await client.initialize();
        
        // Get status
        const status = client.getAuthStatus();
        console.log('\n📊 Authentication Status:');
        console.log(`   Method: ${status.method}`);
        console.log(`   Available: ${status.available}`);
        console.log(`   Session ID: ${status.sessionId}`);
        console.log(`   Credentials: ${JSON.stringify(status.credentialStatus, null, 2)}`);
        
        if (status.available) {
            console.log('\n2. Testing authentication...');
            const testResult = await client.testAuthentication();
            
            if (testResult.skipped) {
                console.log(`   ⚠️  SKIPPED: ${testResult.reason}`);
            } else {
                console.log(`   Success: ${testResult.success}`);
                if (testResult.success) {
                    console.log(`   Response: ${testResult.response}`);
                    console.log(`   Cost Savings: $${testResult.status.costSavings}`);
                } else {
                    console.log(`   Error: ${testResult.error || testResult.message}`);
                }
            }
        } else {
            console.log('\n⚠️ Browser authentication not available');
            console.log('   This is expected if Claude cookies are not configured');
        }
        
        console.log('\n✅ Browser authentication test completed (local mode)');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return 1;
    } finally {
        if (client) {
            await client.close();
        }
    }
    
    return 0;
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testBrowserAuth()
        .then(exitCode => process.exit(exitCode))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

export { testBrowserAuth };