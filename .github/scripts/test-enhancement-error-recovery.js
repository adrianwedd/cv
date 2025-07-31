#!/usr/bin/env node

/**
 * Enhancement Error Recovery Test
 * 
 * Tests the complete enhancement pipeline with error recovery and fallback modes
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const { EnhancementOrchestrator } = require('./enhancer-modules/enhancement-orchestrator');
const { 
    QuotaExhaustedError, 
    RateLimitExceededError, 
    AuthenticationError,
    ServerError,
    NetworkError
} = require('./enhancer-modules/claude-api-client');

/**
 * Test configuration with different error scenarios
 */
const testConfigs = {
    quota_exhausted: {
        ANTHROPIC_API_KEY: 'test-key-quota-exhausted',
        ENHANCEMENT_MODE: 'comprehensive',
        AI_BUDGET: 'sufficient',
        CREATIVITY_LEVEL: 'balanced'
    },
    rate_limited: {
        ANTHROPIC_API_KEY: 'test-key-rate-limited',
        ENHANCEMENT_MODE: 'comprehensive',
        AI_BUDGET: 'sufficient',
        CREATIVITY_LEVEL: 'balanced'
    },
    auth_failed: {
        ANTHROPIC_API_KEY: 'invalid-key',
        ENHANCEMENT_MODE: 'comprehensive',
        AI_BUDGET: 'sufficient',
        CREATIVITY_LEVEL: 'balanced'
    },
    normal_success: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'test-key',
        ENHANCEMENT_MODE: 'activity-only',  // Use activity-only to avoid real API calls
        AI_BUDGET: 'sufficient',
        CREATIVITY_LEVEL: 'balanced'
    }
};

/**
 * Mock the API client to simulate different error conditions
 */
class MockEnhancementOrchestrator extends EnhancementOrchestrator {
    constructor(config, errorScenario) {
        super(config);
        this.errorScenario = errorScenario;
        this.mockCallCount = 0;
    }

    /**
     * Override the enhancement execution to simulate errors
     */
    async executeEnhancementStrategy(strategy, cvData, activityMetrics, narrativeIntelligence) {
        this.mockCallCount++;
        
        // Simulate different error scenarios
        switch (this.errorScenario) {
            case 'quota_exhausted':
                if (this.mockCallCount === 1) {
                    throw new QuotaExhaustedError('API quota exhausted for testing');
                }
                break;
                
            case 'rate_limited':
                if (this.mockCallCount === 1) {
                    throw new RateLimitExceededError('Rate limit exceeded for testing');
                }
                break;
                
            case 'auth_failed':
                if (this.mockCallCount === 1) {
                    throw new AuthenticationError('Authentication failed for testing');
                }
                break;
                
            case 'server_error':
                if (this.mockCallCount === 1) {
                    throw new ServerError('Server error for testing');
                }
                break;
                
            case 'network_error':
                if (this.mockCallCount === 1) {
                    throw new NetworkError('Network error for testing');
                }
                break;
        }
        
        // If no error or after recovery, execute normally
        console.log(`✅ Enhancement strategy executed successfully (attempt ${this.mockCallCount})`);
    }
}

/**
 * Test suite for error recovery
 */
class ErrorRecoveryTestSuite {
    constructor() {
        this.testResults = [];
    }

    /**
     * Run all error recovery tests
     */
    async runAllTests() {
        console.log('🧪 **ENHANCEMENT ERROR RECOVERY TEST SUITE**\n');

        const tests = [
            { name: 'Quota Exhausted Recovery', scenario: 'quota_exhausted' },
            { name: 'Rate Limit Recovery', scenario: 'rate_limited' },
            { name: 'Authentication Error Recovery', scenario: 'auth_failed' },
            { name: 'Server Error Recovery', scenario: 'server_error' },
            { name: 'Network Error Recovery', scenario: 'network_error' },
            { name: 'Normal Operation', scenario: 'normal_success' }
        ];

        for (const test of tests) {
            await this.runRecoveryTest(test.name, test.scenario);
        }

        this.printSummary();
    }

    /**
     * Run individual error recovery test
     */
    async runRecoveryTest(testName, scenario) {
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            const config = testConfigs[scenario] || testConfigs.normal_success;
            const orchestrator = new MockEnhancementOrchestrator(config, scenario);
            
            const startTime = Date.now();
            const result = await orchestrator.orchestrateEnhancement();
            const duration = Date.now() - startTime;

            // Analyze the result
            const analysis = this.analyzeResult(result, scenario);

            this.testResults.push({
                test: testName,
                scenario,
                status: analysis.success ? 'PASS' : 'FAIL',
                duration,
                enhancement_mode: result.enhancement_mode,
                fallback_used: result.fallback_mode,
                error_recovery_count: result.error_recovery?.length || 0,
                analysis
            });

            const statusIcon = analysis.success ? '✅' : '❌';
            console.log(`  ${statusIcon} ${testName} - ${analysis.success ? 'PASSED' : 'FAILED'} (${duration}ms)`);
            console.log(`    Mode: ${result.enhancement_mode}, Fallback: ${result.fallback_mode || false}`);
            
            if (result.error_recovery && result.error_recovery.length > 0) {
                console.log(`    Recovery attempts: ${result.error_recovery.length}`);
                result.error_recovery.forEach((recovery, i) => {
                    const recoveryIcon = recovery.success ? '✅' : '❌';
                    console.log(`      ${recoveryIcon} ${recovery.recovery_action}: ${recovery.error_type}`);
                });
            }
            
            console.log('');

        } catch (error) {
            this.testResults.push({
                test: testName,
                scenario,
                status: 'FAIL',
                error: error.constructor.name,
                message: error.message
            });

            console.log(`  ❌ ${testName} - FAILED (Unhandled error: ${error.constructor.name})`);
            console.log(`    Message: ${error.message}\n`);
        }
    }

    /**
     * Analyze test result to determine success criteria
     */
    analyzeResult(result, scenario) {
        const analysis = {
            success: false,
            reasons: []
        };

        // Check if the result has valid structure
        if (!result || typeof result !== 'object') {
            analysis.reasons.push('Invalid result structure');
            return analysis;
        }

        // For error scenarios, expect fallback mode or successful recovery
        const errorScenarios = ['quota_exhausted', 'auth_failed', 'rate_limited', 'server_error', 'network_error'];
        
        if (errorScenarios.includes(scenario)) {
            // Should have either successfully recovered or used fallback mode
            if (result.fallback_mode) {
                analysis.success = true;
                analysis.reasons.push('Successfully activated fallback mode');
            } else if (result.error_recovery && result.error_recovery.some(r => r.success)) {
                analysis.success = true;
                analysis.reasons.push('Successfully recovered from error');
            } else {
                analysis.reasons.push('Failed to activate fallback or recover from error');
            }
        } else {
            // Normal operation should complete without fallback
            if (!result.fallback_mode && result.enhancement_mode) {
                analysis.success = true;
                analysis.reasons.push('Normal operation completed successfully');
            } else {
                analysis.reasons.push('Unexpected fallback mode in normal operation');
            }
        }

        // Check for expected data structure
        if (result.enhancements && typeof result.enhancements === 'object') {
            analysis.reasons.push('Valid enhancements structure');
        } else {
            analysis.reasons.push('Missing or invalid enhancements structure');
            analysis.success = false;
        }

        return analysis;
    }

    /**
     * Print comprehensive test summary
     */
    printSummary() {
        console.log('📊 **ERROR RECOVERY TEST RESULTS SUMMARY**\n');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
        console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

        // Show recovery statistics
        const recoveryTests = this.testResults.filter(r => r.error_recovery_count > 0);
        if (recoveryTests.length > 0) {
            console.log('🔄 **ERROR RECOVERY STATISTICS:**');
            recoveryTests.forEach(test => {
                console.log(`   • ${test.test}: ${test.error_recovery_count} recovery attempts`);
            });
            console.log('');
        }

        // Show fallback usage
        const fallbackTests = this.testResults.filter(r => r.fallback_used);
        if (fallbackTests.length > 0) {
            console.log('🔄 **FALLBACK MODE USAGE:**');
            fallbackTests.forEach(test => {
                console.log(`   • ${test.test}: ${test.enhancement_mode} mode`);
            });
            console.log('');
        }

        // Show detailed analysis
        console.log('📋 **DETAILED ANALYSIS:**');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${icon} ${result.test}:`);
            
            if (result.analysis && result.analysis.reasons) {
                result.analysis.reasons.forEach(reason => {
                    console.log(`      • ${reason}`);
                });
            }
            
            if (result.error) {
                console.log(`      • Error: ${result.error} - ${result.message}`);
            }
        });
    }
}

/**
 * Main execution
 */
async function main() {
    if (process.argv.includes('--help')) {
        console.log('🧪 Enhancement Error Recovery Test Suite');
        console.log('');
        console.log('Usage: node test-enhancement-error-recovery.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --help     Show this help message');
        console.log('');
        console.log('This script tests error recovery capabilities for:');
        console.log('  • API quota exhaustion recovery');
        console.log('  • Rate limiting recovery');
        console.log('  • Authentication failure recovery');
        console.log('  • Server error recovery');
        console.log('  • Network error recovery');
        console.log('  • Fallback mode activation');
        console.log('  • Activity-only mode operation');
        return;
    }

    try {
        const testSuite = new ErrorRecoveryTestSuite();
        await testSuite.runAllTests();
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ErrorRecoveryTestSuite, MockEnhancementOrchestrator };