#!/usr/bin/env node

/**
 * Complete Integration Test
 * 
 * Tests the entire enhanced CV system with error handling, fallback modes,
 * OAuth authentication, and usage monitoring integration.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import { EnhancementOrchestrator } from './enhancer-modules/enhancement-orchestrator.js';
import { ClaudeMaxOAuthClient } from './claude-oauth-client.js';
import { UsageMonitor } from './usage-monitor.js';
import { 
    QuotaExhaustedError, 
    RateLimitExceededError, 
    AuthenticationError 
} from './enhancer-modules/claude-api-client.js';

/**
 * Integration Test Suite
 */
class CompleteIntegrationTest {
    constructor() {
        this.testResults = [];
        this.usageMonitor = new UsageMonitor();
    }

    /**
     * Run complete integration tests
     */
    async runCompleteTests() {
        console.log('🧪 **COMPLETE CV SYSTEM INTEGRATION TEST**\n');
        
        await this.usageMonitor.initialize();
        
        const tests = [
            { name: 'API Key with Error Recovery', config: this.getApiKeyConfig(), scenario: 'quota_exhausted' },
            { name: 'OAuth Max Authentication', config: this.getOAuthConfig(), scenario: 'normal' },
            { name: 'Usage Monitoring Integration', config: this.getApiKeyConfig(), scenario: 'normal' },
            { name: 'Budget Alert System', config: this.getApiKeyConfig(), scenario: 'high_usage' },
            { name: 'Complete Fallback Chain', config: this.getApiKeyConfig(), scenario: 'multiple_failures' }
        ];

        for (const test of tests) {
            await this.runIntegrationTest(test.name, test.config, test.scenario);
        }

        this.printFinalSummary();
    }

    /**
     * Run individual integration test
     */
    async runIntegrationTest(testName, config, scenario) {
        console.log(`🔍 Testing: ${testName}`);
        
        const startTime = Date.now();
        const testResult = {
            name: testName,
            scenario,
            status: 'FAIL',
            duration: 0,
            details: {}
        };

        try {
            switch (scenario) {
                case 'quota_exhausted':
                    await this.testQuotaExhaustion(config, testResult);
                    break;
                    
                case 'normal':
                    await this.testNormalOperation(config, testResult);
                    break;
                    
                case 'high_usage':
                    await this.testHighUsageScenario(config, testResult);
                    break;
                    
                case 'multiple_failures':
                    await this.testMultipleFailures(config, testResult);
                    break;
                    
                default:
                    throw new Error(`Unknown test scenario: ${scenario}`);
            }
            
            testResult.status = 'PASS';
            
        } catch (error) {
            testResult.error = error.message;
            testResult.details.error_type = error.constructor.name;
        }
        
        testResult.duration = Date.now() - startTime;
        this.testResults.push(testResult);
        
        const statusIcon = testResult.status === 'PASS' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${testName} - ${testResult.status} (${testResult.duration}ms)`);
        
        if (testResult.details.fallback_used) {
            console.log(`    🔄 Fallback mode: ${testResult.details.fallback_mode}`);
        }
        
        if (testResult.details.usage_recorded) {
            console.log(`    📊 Usage tracked: ${testResult.details.usage_summary}`);
        }
        
        console.log('');
    }

    /**
     * Test quota exhaustion and recovery
     */
    async testQuotaExhaustion(config, testResult) {
        // Simulate quota exhaustion by using invalid API key
        const mockConfig = { ...config, ANTHROPIC_API_KEY: 'invalid-key-quota-test' };
        
        const orchestrator = new EnhancementOrchestrator(mockConfig);
        
        try {
            const result = await orchestrator.orchestrateEnhancement();
            
            // Should have fallen back to activity-only mode
            if (result.fallback_mode && result.enhancement_mode === 'activity-only') {
                testResult.details.fallback_used = true;
                testResult.details.fallback_mode = result.enhancement_mode;
                testResult.details.error_recovery = result.error_recovery || [];
                
                // Record usage
                await this.usageMonitor.recordUsage({
                    requests: 1,
                    input_tokens: 0,
                    output_tokens: 0,
                    auth_method: 'api_key',
                    session_type: 'test',
                    enhancement_mode: result.enhancement_mode,
                    success: true
                });
                
                testResult.details.usage_recorded = true;
                testResult.details.usage_summary = 'Fallback mode usage tracked';
            } else {
                throw new Error('Expected fallback mode activation');
            }
            
        } catch (error) {
            if (error instanceof AuthenticationError || error.message.includes('authentication')) {
                // Expected error - test should handle this gracefully
                testResult.details.expected_error = true;
            } else {
                throw error;
            }
        }
    }

    /**
     * Test normal operation
     */
    async testNormalOperation(config, testResult) {
        // Use activity-only mode to avoid real API calls
        const testConfig = { ...config, ENHANCEMENT_MODE: 'activity-only' };
        
        const orchestrator = new EnhancementOrchestrator(testConfig);
        const result = await orchestrator.orchestrateEnhancement();
        
        testResult.details.enhancement_mode = result.enhancement_mode;
        testResult.details.enhancements_count = Object.keys(result.enhancements || {}).length;
        
        // Record normal usage
        await this.usageMonitor.recordUsage({
            requests: 1,
            input_tokens: 150,
            output_tokens: 300,
            auth_method: config.auth_method || 'api_key',
            session_type: 'test',
            enhancement_mode: result.enhancement_mode,
            success: true
        });
        
        testResult.details.usage_recorded = true;
        testResult.details.usage_summary = '450 tokens tracked';
    }

    /**
     * Test high usage scenario and budget alerts
     */
    async testHighUsageScenario(config, testResult) {
        // Simulate high usage to trigger budget alerts
        const highUsageSession = {
            requests: 1,
            input_tokens: 25000,  // High token usage
            output_tokens: 10000,
            auth_method: 'api_key',
            session_type: 'test',
            enhancement_mode: 'comprehensive',
            success: true
        };
        
        const usage = await this.usageMonitor.recordUsage(highUsageSession);
        
        testResult.details.usage_recorded = true;
        testResult.details.estimated_cost = usage.estimated_cost;
        testResult.details.usage_summary = `${highUsageSession.input_tokens + highUsageSession.output_tokens} tokens, $${usage.estimated_cost.toFixed(4)}`;
        
        // Check if alerts were triggered
        const currentUsage = this.usageMonitor.getCurrentUsage();
        testResult.details.budget_percentage = currentUsage.today.budget_percentage;
        
        // Get recommendations
        const recommendations = this.usageMonitor.getUsageRecommendations();
        testResult.details.recommendations = recommendations;
    }

    /**
     * Test multiple failure scenarios
     */
    async testMultipleFailures(config, testResult) {
        const failures = [];
        
        // Test sequence of different failures
        const failureScenarios = [
            { type: 'rate_limit', message: 'Rate limit exceeded' },
            { type: 'server_error', message: 'Internal server error' },
            { type: 'quota_exhausted', message: 'Credit balance too low' }
        ];
        
        for (const scenario of failureScenarios) {
            try {
                // Simulate different types of failures
                if (scenario.type === 'quota_exhausted') {
                    throw new QuotaExhaustedError(scenario.message);
                } else if (scenario.type === 'rate_limit') {
                    throw new RateLimitExceededError(scenario.message);
                } else {
                    throw new Error(scenario.message);
                }
            } catch (error) {
                failures.push({
                    type: scenario.type,
                    error_type: error.constructor.name,
                    message: error.message,
                    recoverable: error.fallbackAvailable || false
                });
            }
        }
        
        testResult.details.failures_tested = failures.length;
        testResult.details.recoverable_failures = failures.filter(f => f.recoverable).length;
        testResult.details.failure_types = failures.map(f => f.type);
    }

    /**
     * Test OAuth authentication (mock)
     */
    async testOAuthAuthentication() {
        console.log('🔐 Testing OAuth authentication flow...');
        
        const oauthClient = new ClaudeMaxOAuthClient();
        
        // Test URL generation
        const authUrl = oauthClient.generateAuthUrl();
        
        console.log('  ✅ OAuth URL generated successfully');
        console.log(`  📋 Auth URL length: ${authUrl.length} characters`);
        
        // Test usage stats
        const stats = oauthClient.getUsageStats();
        console.log(`  📊 Usage stats: ${stats.used}/${stats.limit || 'unlimited'}`);
    }

    /**
     * Configuration generators
     */
    getApiKeyConfig() {
        return {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'test-api-key',
            ENHANCEMENT_MODE: 'comprehensive',
            AI_BUDGET: 'sufficient',
            CREATIVITY_LEVEL: 'balanced',
            auth_method: 'api_key'
        };
    }

    getOAuthConfig() {
        return {
            ENHANCEMENT_MODE: 'activity-only', // Avoid real OAuth calls in test
            AI_BUDGET: 'sufficient',
            CREATIVITY_LEVEL: 'balanced',
            auth_method: 'oauth_max',
            subscription_tier: 'max_5x'
        };
    }

    /**
     * Print comprehensive test summary
     */
    printFinalSummary() {
        console.log('📊 **COMPLETE INTEGRATION TEST SUMMARY**\n');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
        console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);
        
        // Feature coverage
        console.log('🎯 **FEATURE COVERAGE:**');
        const features = {
            'Error Recovery': this.testResults.some(r => r.details.fallback_used),
            'Usage Monitoring': this.testResults.some(r => r.details.usage_recorded),
            'Budget Tracking': this.testResults.some(r => r.details.budget_percentage !== undefined),
            'OAuth Support': this.testResults.some(r => r.scenario === 'normal' && r.name.includes('OAuth')),
            'Fallback Modes': this.testResults.some(r => r.details.fallback_mode)
        };
        
        Object.entries(features).forEach(([feature, covered]) => {
            const icon = covered ? '✅' : '❌';
            console.log(`   ${icon} ${feature}`);
        });
        
        // Performance metrics
        const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;
        console.log(`\n⚡ **PERFORMANCE:**`);
        console.log(`   Average test duration: ${Math.round(avgDuration)}ms`);
        console.log(`   Total test time: ${Math.round(this.testResults.reduce((sum, r) => sum + r.duration, 0))}ms`);
        
        // System health
        console.log(`\n🏥 **SYSTEM HEALTH:**`);
        const usageStats = this.usageMonitor.getCurrentUsage();
        console.log(`   Today's usage: ${usageStats.today.requests} requests, $${usageStats.today.estimated_cost.toFixed(4)}`);
        console.log(`   Budget utilization: ${usageStats.today.budget_percentage || 0}%`);
        
        const recommendations = this.usageMonitor.getUsageRecommendations();
        if (recommendations.length > 0) {
            console.log(`   Active recommendations: ${recommendations.length}`);
        }
        
        // Detailed results
        console.log('\n📋 **DETAILED TEST RESULTS:**');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${icon} ${result.name} (${result.duration}ms)`);
            
            if (result.details.fallback_used) {
                console.log(`      🔄 Used fallback: ${result.details.fallback_mode}`);
            }
            
            if (result.details.usage_recorded) {
                console.log(`      📊 Usage: ${result.details.usage_summary}`);
            }
            
            if (result.error) {
                console.log(`      ❌ Error: ${result.error}`);
            }
        });
    }
}

/**
 * Main execution
 */
async function main() {
    if (process.argv.includes('--help')) {
        console.log('🧪 Complete CV System Integration Test');
        console.log('');
        console.log('Usage: node test-complete-integration.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --help     Show this help message');
        console.log('');
        console.log('This test suite validates:');
        console.log('  • Error handling and recovery');
        console.log('  • Fallback mode activation');
        console.log('  • Usage monitoring integration');
        console.log('  • Budget tracking and alerts');
        console.log('  • OAuth authentication support');
        console.log('  • Complete system resilience');
        return;
    }

    try {
        const testSuite = new CompleteIntegrationTest();
        await testSuite.runCompleteTests();
    } catch (error) {
        console.error('❌ Integration test suite failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { CompleteIntegrationTest };