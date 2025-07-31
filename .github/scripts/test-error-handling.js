#!/usr/bin/env node

/**
 * Error Handling Test Suite
 * 
 * Tests current error handling capabilities and simulates various API failure scenarios
 * including 429 rate limits, quota exhaustion, network failures, and authentication issues.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const { ClaudeApiClient } = require('./enhancer-modules/claude-api-client');

/**
 * Mock HTTP responses for testing different error scenarios
 */
class MockHttpClient {
    constructor(scenario) {
        this.scenario = scenario;
        this.requestCount = 0;
    }

    async request(url, options, body) {
        this.requestCount++;
        
        switch (this.scenario) {
            case 'rate_limit_429':
                return {
                    statusCode: 429,
                    headers: {
                        'retry-after': '60',
                        'x-ratelimit-remaining': '0',
                        'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 3600
                    },
                    body: JSON.stringify({
                        error: {
                            type: 'rate_limit_error',
                            message: 'Rate limit exceeded. Please wait 60 seconds before retrying.'
                        }
                    })
                };

            case 'quota_exhausted':
                return {
                    statusCode: 400,
                    headers: {},
                    body: JSON.stringify({
                        error: {
                            type: 'invalid_request_error',
                            message: 'Your credit balance is too low to access the Anthropic API. Please go to Console to top up your credit balance.'
                        }
                    })
                };

            case 'authentication_error':
                return {
                    statusCode: 401,
                    headers: {},
                    body: JSON.stringify({
                        error: {
                            type: 'authentication_error',
                            message: 'Invalid API key provided'
                        }
                    })
                };

            case 'server_error':
                return {
                    statusCode: 500,
                    headers: {},
                    body: JSON.stringify({
                        error: {
                            type: 'api_error',
                            message: 'Internal server error'
                        }
                    })
                };

            case 'network_timeout':
                throw new Error('ETIMEDOUT: Network timeout');

            case 'success_after_retry':
                if (this.requestCount <= 2) {
                    return {
                        statusCode: 429,
                        headers: { 'retry-after': '1' },
                        body: JSON.stringify({
                            error: {
                                type: 'rate_limit_error',
                                message: 'Rate limit exceeded'
                            }
                        })
                    };
                }
                // Fall through to success case

            case 'success':
            default:
                return {
                    statusCode: 200,
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        id: 'msg_test123',
                        type: 'message',
                        role: 'assistant',
                        content: [{ type: 'text', text: 'Test response' }],
                        model: 'claude-3-5-sonnet-20241022',
                        stop_reason: 'end_turn',
                        usage: {
                            input_tokens: 10,
                            output_tokens: 5
                        }
                    })
                };
        }
    }
}

/**
 * Enhanced API Client with better error handling
 */
class EnhancedClaudeApiClient extends ClaudeApiClient {
    constructor(config, mockClient = null) {
        super(config);
        this.mockClient = mockClient;
        this.fallbackMode = false;
        this.quotaExhausted = false;
    }

    /**
     * Enhanced HTTP request with comprehensive error handling
     */
    async httpRequest(url, options, body) {
        if (this.mockClient) {
            return this.mockClient.request(url, options, body);
        }
        
        // Use original implementation for real requests
        return super.httpRequest ? super.httpRequest(url, options, body) : 
               this.makeHttpRequest(url, options, body);
    }

    /**
     * Make request with enhanced error handling and fallback logic
     */
    async makeRequest(messages, options = {}, sourceContent = '') {
        if (this.quotaExhausted) {
            throw new QuotaExhaustedError('API quota exhausted - using fallback mode');
        }

        try {
            return await super.makeRequest(messages, options, sourceContent);
        } catch (error) {
            return this.handleApiError(error, messages, options, sourceContent);
        }
    }

    /**
     * Comprehensive API error handling with fallback strategies
     */
    async handleApiError(error, messages, options, sourceContent) {
        const errorMessage = error.message.toLowerCase();
        
        // Rate limit handling (429)
        if (error.message.includes('429') || errorMessage.includes('rate limit')) {
            console.warn('⏰ Rate limit hit - implementing exponential backoff');
            return this.handleRateLimit(error, messages, options, sourceContent);
        }
        
        // Quota/Credit exhaustion
        if (errorMessage.includes('credit balance') || 
            errorMessage.includes('quota') || 
            errorMessage.includes('insufficient funds')) {
            console.error('💳 API credits exhausted');
            this.quotaExhausted = true;
            throw new QuotaExhaustedError('API quota exhausted', error);
        }
        
        // Authentication errors
        if (error.message.includes('401') || errorMessage.includes('authentication')) {
            console.error('🔐 Authentication failed - check API key');
            throw new AuthenticationError('Invalid API key', error);
        }
        
        // Server errors (5xx) - retry with backoff
        if (error.message.includes('500') || error.message.includes('502') || 
            error.message.includes('503') || error.message.includes('504')) {
            console.warn('🔧 Server error - retrying with backoff');
            return this.handleServerError(error, messages, options, sourceContent);
        }
        
        // Network timeouts
        if (errorMessage.includes('timeout') || errorMessage.includes('etimedout')) {
            console.warn('📡 Network timeout - retrying');
            return this.handleNetworkError(error, messages, options, sourceContent);
        }
        
        // Unknown error - rethrow
        console.error('❌ Unknown API error:', error.message);
        throw error;
    }

    /**
     * Handle rate limiting with exponential backoff
     */
    async handleRateLimit(error, messages, options, sourceContent, attempt = 1) {
        const maxAttempts = 3;
        if (attempt > maxAttempts) {
            throw new RateLimitExceededError('Max rate limit retries exceeded', error);
        }

        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 60000); // Max 60 seconds
        console.log(`⏳ Rate limit retry ${attempt}/${maxAttempts} in ${backoffMs}ms`);
        
        await this.sleep(backoffMs);
        
        try {
            return await super.makeRequest(messages, options, sourceContent);
        } catch (retryError) {
            if (retryError.message.includes('429')) {
                return this.handleRateLimit(retryError, messages, options, sourceContent, attempt + 1);
            }
            throw retryError;
        }
    }

    /**
     * Handle server errors with retry logic
     */
    async handleServerError(error, messages, options, sourceContent, attempt = 1) {
        const maxAttempts = 2;
        if (attempt > maxAttempts) {
            throw new ServerError('Max server error retries exceeded', error);
        }

        const backoffMs = 2000 * attempt;
        console.log(`🔧 Server error retry ${attempt}/${maxAttempts} in ${backoffMs}ms`);
        
        await this.sleep(backoffMs);
        
        try {
            return await super.makeRequest(messages, options, sourceContent);
        } catch (retryError) {
            return this.handleServerError(retryError, messages, options, sourceContent, attempt + 1);
        }
    }

    /**
     * Handle network errors with retry logic
     */
    async handleNetworkError(error, messages, options, sourceContent, attempt = 1) {
        const maxAttempts = 2;
        if (attempt > maxAttempts) {
            throw new NetworkError('Max network error retries exceeded', error);
        }

        const backoffMs = 1000 * attempt;
        console.log(`📡 Network error retry ${attempt}/${maxAttempts} in ${backoffMs}ms`);
        
        await this.sleep(backoffMs);
        
        try {
            return await super.makeRequest(messages, options, sourceContent);
        } catch (retryError) {
            return this.handleNetworkError(retryError, messages, options, sourceContent, attempt + 1);
        }
    }

    /**
     * Sleep utility for backoff delays
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if fallback mode should be enabled
     */
    shouldUseFallback() {
        return this.quotaExhausted || this.fallbackMode;
    }

    /**
     * Enable fallback mode for quota exhaustion scenarios
     */
    enableFallbackMode() {
        this.fallbackMode = true;
        console.log('🔄 Enabled fallback mode - switching to activity-only processing');
    }
}

/**
 * Custom error classes for better error handling
 */
class QuotaExhaustedError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'QuotaExhaustedError';
        this.originalError = originalError;
        this.recoverable = false;
        this.fallbackAvailable = true;
    }
}

class RateLimitExceededError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'RateLimitExceededError';
        this.originalError = originalError;
        this.recoverable = true;
        this.fallbackAvailable = true;
    }
}

class AuthenticationError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'AuthenticationError';
        this.originalError = originalError;
        this.recoverable = false;
        this.fallbackAvailable = true;
    }
}

class ServerError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'ServerError';
        this.originalError = originalError;
        this.recoverable = true;
        this.fallbackAvailable = true;
    }
}

class NetworkError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
        this.recoverable = true;
        this.fallbackAvailable = true;
    }
}

/**
 * Test Suite Runner
 */
class ErrorHandlingTestSuite {
    constructor() {
        this.testResults = [];
    }

    /**
     * Run all error handling tests
     */
    async runAllTests() {
        console.log('🧪 **ERROR HANDLING TEST SUITE**\n');

        const tests = [
            { name: 'Rate Limit (429)', scenario: 'rate_limit_429' },
            { name: 'Quota Exhausted', scenario: 'quota_exhausted' },
            { name: 'Authentication Error', scenario: 'authentication_error' },
            { name: 'Server Error (5xx)', scenario: 'server_error' },
            { name: 'Network Timeout', scenario: 'network_timeout' },
            { name: 'Success After Retry', scenario: 'success_after_retry' },
            { name: 'Normal Success', scenario: 'success' }
        ];

        for (const test of tests) {
            await this.runTest(test.name, test.scenario);
        }

        this.printSummary();
    }

    /**
     * Run individual test scenario
     */
    async runTest(testName, scenario) {
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            const mockClient = new MockHttpClient(scenario);
            const apiClient = new EnhancedClaudeApiClient({
                ANTHROPIC_API_KEY: 'test-key',
                MODEL: 'claude-3-5-sonnet-20241022'
            }, mockClient);

            const messages = [{ role: 'user', content: 'Test message' }];
            
            const startTime = Date.now();
            const result = await apiClient.makeRequest(messages);
            const duration = Date.now() - startTime;

            this.testResults.push({
                test: testName,
                scenario,
                status: 'PASS',
                duration,
                result: 'Success',
                requests: mockClient.requestCount
            });

            console.log(`  ✅ ${testName} - PASSED (${duration}ms, ${mockClient.requestCount} requests)\n`);

        } catch (error) {
            const errorType = error.constructor.name;
            const isExpectedError = this.isExpectedError(scenario, errorType);
            const status = isExpectedError ? 'PASS' : 'FAIL';
            
            this.testResults.push({
                test: testName,
                scenario,
                status,
                error: errorType,
                message: error.message,
                fallbackAvailable: error.fallbackAvailable || false
            });

            if (isExpectedError) {
                console.log(`  ✅ ${testName} - PASSED (Expected ${errorType})`);
                if (error.fallbackAvailable) {
                    console.log(`    💡 Fallback mode available`);
                }
            } else {
                console.log(`  ❌ ${testName} - FAILED (Unexpected error: ${errorType})`);
                console.log(`    Message: ${error.message}`);
            }
            console.log('');
        }
    }

    /**
     * Check if error is expected for the scenario
     */
    isExpectedError(scenario, errorType) {
        const expectedErrors = {
            'rate_limit_429': ['RateLimitExceededError'],
            'quota_exhausted': ['QuotaExhaustedError'],
            'authentication_error': ['AuthenticationError'],
            'server_error': ['ServerError'],
            'network_timeout': ['NetworkError']
        };

        return expectedErrors[scenario]?.includes(errorType) || false;
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log('📊 **TEST RESULTS SUMMARY**\n');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
        console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

        // Show fallback capabilities
        const fallbackTests = this.testResults.filter(r => r.fallbackAvailable);
        if (fallbackTests.length > 0) {
            console.log('💡 **FALLBACK MODE AVAILABLE FOR:**');
            fallbackTests.forEach(test => {
                console.log(`   • ${test.test} (${test.error || 'Success'})`);
            });
            console.log('');
        }

        // Show detailed results
        console.log('📋 **DETAILED RESULTS:**');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            const details = result.error || `${result.duration}ms`;
            console.log(`   ${icon} ${result.test}: ${details}`);
        });
    }
}

/**
 * Main execution
 */
async function main() {
    if (process.argv.includes('--help')) {
        console.log('🧪 Error Handling Test Suite');
        console.log('');
        console.log('Usage: node test-error-handling.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --help     Show this help message');
        console.log('');
        console.log('This script tests error handling capabilities for:');
        console.log('  • Rate limiting (429 errors)');
        console.log('  • Quota exhaustion');
        console.log('  • Authentication failures');
        console.log('  • Server errors (5xx)');
        console.log('  • Network timeouts');
        console.log('  • Retry logic and backoff strategies');
        console.log('  • Fallback mode capabilities');
        return;
    }

    try {
        const testSuite = new ErrorHandlingTestSuite();
        await testSuite.runAllTests();
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Export for testing
module.exports = {
    EnhancedClaudeApiClient,
    ErrorHandlingTestSuite,
    QuotaExhaustedError,
    RateLimitExceededError,
    AuthenticationError,
    ServerError,
    NetworkError
};

if (require.main === module) {
    main().catch(console.error);
}