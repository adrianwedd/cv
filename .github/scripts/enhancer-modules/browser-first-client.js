#!/usr/bin/env node

/**
 * Browser-First Claude Client for Enhancement Pipeline
 * 
 * Integrates browser-based authentication with the existing claude-enhancer.js pipeline.
 * Provides seamless fallback to OAuth and API key authentication.
 * 
 * Features:
 * - FREE Claude AI usage through browser session automation
 * - Headless Chrome optimized for CI environments
 * - Intelligent fallback chain (Browser → OAuth → API Key)
 * - Cost tracking and usage analytics
 * - Robust error handling and recovery
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

import crypto from 'crypto';
import { ClaudeBrowserClient } from '../claude-browser-client.js';
import { sleep } from '../utils/apiClient.js';

/**
 * Browser-First Claude Client with API compatibility
 */
class BrowserFirstClient {
    constructor(config = {}) {
        this.config = config;
        this.browserClient = null;
        this.requestCount = 0;
        this.tokenUsage = {
            input_tokens: 0,
            output_tokens: 0,
            total: 0
        };
        this.authMethod = 'unknown';
        this.costSavings = 0;
        this.sessionId = crypto.randomUUID();
        this.startTime = Date.now();
    }

    /**
     * Check if running in CI environment
     */
    isCI() {
        return process.env.CI === 'true' || 
               process.env.GITHUB_ACTIONS === 'true' || 
               process.env.SKIP_BROWSER_TESTS === 'true';
    }

    /**
     * Initialize the appropriate client based on available credentials
     */
    async initialize() {
        console.log('🔐 Initializing browser-first authentication...');
        console.log(`📋 Session ID: ${this.sessionId}`);
        
        // Skip browser initialization in CI environments
        if (this.isCI()) {
            console.log('⏭️  SKIPPING BROWSER INITIALIZATION - CI ENVIRONMENT DETECTED');
            console.log('   Environment variables:');
            console.log(`   CI: ${process.env.CI}`);
            console.log(`   GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS}`);
            console.log(`   SKIP_BROWSER_TESTS: ${process.env.SKIP_BROWSER_TESTS}`);
            console.log('🔄 Browser authentication unavailable, enhancement will use fallback method');
            this.authMethod = 'ci_skip_fallback_required';
            return this;
        }
        
        // Try browser authentication first
        if (this.hasBrowserCredentials()) {
            try {
                console.log('🍪 Attempting browser authentication...');
                this.browserClient = new ClaudeBrowserClient({ 
                    headless: process.env.CI ? true : false, // Visible in local dev, headless in CI
                    timeout: 45000, // Increased timeout for CI stability
                    args: this.getChromeArgs()
                });
                
                // Test browser authentication
                await this.browserClient.initialize();
                const testResult = await this.browserClient.test();
                if (testResult && testResult.skipped) {
                    console.log(`⚠️  Browser authentication skipped: ${testResult.reason}`);
                    this.authMethod = 'fallback';
                } else if (testResult && testResult.success !== false) {
                    console.log('✅ Browser authentication successful - FREE AI enhancement!');
                    console.log(`💰 Cost savings: 100% (Estimated: $${this.getEstimatedAPICost()}/month)`);
                    this.authMethod = 'browser_authenticated';
                    return this;
                }
                
                console.log('⚠️ Browser authentication failed:', testResult.message);
                await this.browserClient.close();
                this.browserClient = null;
            } catch (error) {
                console.log('⚠️ Browser authentication error:', error.message);
                if (this.browserClient) {
                    await this.browserClient.close();
                    this.browserClient = null;
                }
            }
        } else {
            console.log('🔍 Browser credentials not available');
            this.logCredentialStatus();
        }
        
        // Browser authentication failed or not available
        console.log('🔄 Browser authentication unavailable, enhancement will use fallback method');
        this.authMethod = 'fallback_required';
        return this;
    }

    /**
     * Get Chrome arguments optimized for different environments
     */
    getChromeArgs() {
        const baseArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ];

        // Additional CI-specific args
        if (process.env.CI) {
            baseArgs.push(
                '--single-process',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            );
        }

        return baseArgs;
    }

    /**
     * Check if browser credentials are available
     */
    hasBrowserCredentials() {
        const hasSessionKey = !!(process.env.CLAUDE_SESSION_KEY);
        const hasOrgId = !!(process.env.CLAUDE_ORG_ID);
        const hasUserId = !!(process.env.CLAUDE_USER_ID);
        
        return hasSessionKey && hasOrgId;
    }

    /**
     * Log credential availability status
     */
    logCredentialStatus() {
        console.log('🔍 Credential Status:');
        console.log(`   CLAUDE_SESSION_KEY: ${process.env.CLAUDE_SESSION_KEY ? '✅ Available' : '❌ Missing'}`);
        console.log(`   CLAUDE_ORG_ID: ${process.env.CLAUDE_ORG_ID ? '✅ Available' : '❌ Missing'}`);
        console.log(`   CLAUDE_USER_ID: ${process.env.CLAUDE_USER_ID ? '✅ Available' : '❌ Missing'}`);
        console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Available (fallback)' : '❌ Missing'}`);
    }

    /**
     * Estimate monthly API costs that would be saved
     */
    getEstimatedAPICost() {
        // Estimate based on typical CV enhancement usage
        const monthlyRequests = 30; // Daily enhancements
        const avgTokensPerRequest = 25000; // Conservative estimate
        const costPerMToken = 3; // Claude 3.5 Sonnet pricing
        
        return ((monthlyRequests * avgTokensPerRequest * costPerMToken) / 1000000).toFixed(2);
    }

    /**
     * Make request compatible with existing claude-enhancer.js API
     */
    async makeRequest(messages, options = {}, sourceContent = '') {
        if (this.browserClient && this.authMethod === 'browser_authenticated') {
            return await this.makeBrowserRequest(messages, options, sourceContent);
        } else {
            throw new Error('Browser authentication not available - enhancement will use fallback method');
        }
    }

    /**
     * Make browser-based request
     */
    async makeBrowserRequest(messages, options = {}, sourceContent = '') {
        try {
            console.log('🤖 Making browser-based Claude request...');
            
            // Convert messages to browser format
            const prompt = this.formatMessagesForBrowser(messages);
            
            // Make request through browser
            const response = await this.browserClient.sendMessage(prompt, options);
            
            // Track usage (estimated)
            const inputTokens = Math.ceil(prompt.length / 4); // Rough estimate
            const outputTokens = Math.ceil(response.content[0].text.length / 4);
            
            this.tokenUsage.input_tokens += inputTokens;
            this.tokenUsage.output_tokens += outputTokens;
            this.tokenUsage.total += inputTokens + outputTokens;
            this.requestCount++;
            
            // Calculate cost savings
            const estimatedAPICost = (inputTokens + outputTokens) * 0.000003; // $3/1M tokens
            this.costSavings += estimatedAPICost;
            
            console.log(`📊 Browser request completed: ~${inputTokens} input, ~${outputTokens} output tokens`);
            console.log(`💰 Estimated cost saved: $${estimatedAPICost.toFixed(4)}`);
            
            return {
                content: response.content,
                usage: {
                    input_tokens: inputTokens,
                    output_tokens: outputTokens
                },
                conversation_id: response.conversation_id,
                auth_method: 'browser_authenticated',
                cost_estimate: 0, // Browser method is free!
                cost_savings: this.costSavings
            };
            
        } catch (error) {
            console.error('❌ Browser request failed:', error.message);
            throw error;
        }
    }

    /**
     * Format messages array for browser client
     */
    formatMessagesForBrowser(messages) {
        return messages
            .map(msg => {
                if (msg.role === 'system') return `System: ${msg.content}`;
                if (msg.role === 'user') return `Human: ${msg.content}`;
                if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
                return msg.content;
            })
            .join('\n\n');
    }

    /**
     * Get comprehensive authentication and usage status
     */
    getAuthStatus() {
        const sessionDuration = Math.round((Date.now() - this.startTime) / 1000);
        
        return {
            method: this.authMethod,
            available: this.authMethod === 'browser_authenticated',
            sessionId: this.sessionId,
            sessionDuration: sessionDuration,
            requestCount: this.requestCount,
            tokenUsage: this.tokenUsage,
            costSavings: this.costSavings,
            estimatedMonthlySavings: this.getEstimatedAPICost(),
            credentialStatus: {
                hasSessionKey: !!(process.env.CLAUDE_SESSION_KEY),
                hasOrgId: !!(process.env.CLAUDE_ORG_ID),
                hasUserId: !!(process.env.CLAUDE_USER_ID),
                hasAPIKey: !!(process.env.ANTHROPIC_API_KEY)
            }
        };
    }

    /**
     * Get cache key (compatibility method)
     */
    generateCacheKey(payload, sourceContent) {
        const input = JSON.stringify(payload) + sourceContent;
        return crypto.createHash('sha256').update(input).digest('hex');
    }

    /**
     * Test authentication and browser setup
     */
    async testAuthentication() {
        try {
            // Skip in CI environments
            if (this.isCI()) {
                return {
                    success: true,
                    method: 'ci_skip',
                    message: 'Browser authentication test skipped in CI environment',
                    status: this.getAuthStatus(),
                    skipped: true
                };
            }
            
            await this.initialize();
            if (this.authMethod === 'browser_authenticated') {
                // Test with a simple message using the browser client directly
                const testResult = await this.browserClient.test();
                
                return {
                    success: true,
                    method: 'browser_authenticated',
                    response: testResult.content ? testResult.content[0]?.text : 'Test completed',
                    status: this.getAuthStatus()
                };
            } else {
                return {
                    success: false,
                    method: 'fallback_required',
                    message: 'Browser authentication not available',
                    status: this.getAuthStatus()
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: this.getAuthStatus()
            };
        }
    }

    /**
     * Generate session report for analytics
     */
    generateSessionReport() {
        const status = this.getAuthStatus();
        const sessionDuration = Math.round((Date.now() - this.startTime) / 1000);
        
        return {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            authMethod: status.method,
            duration: sessionDuration,
            requestCount: status.requestCount,
            tokenUsage: status.tokenUsage,
            costSavings: status.costSavings,
            success: status.available,
            environment: this.isCI() ? 'ci' : 'local',
            ciSkipped: this.isCI()
        };
    }

    /**
     * Clean up resources
     */
    async close() {
        if (this.browserClient) {
            console.log('🔒 Closing browser client...');
            await this.browserClient.close();
            this.browserClient = null;
        }
        
        // Log final session statistics
        const report = this.generateSessionReport();
        console.log('📊 Browser Authentication Session Summary:');
        console.log(`   Duration: ${report.duration}s`);
        console.log(`   Requests: ${report.requestCount}`);
        console.log(`   Tokens: ${report.tokenUsage.total}`);
        console.log(`   Cost Savings: $${report.costSavings.toFixed(4)}`);
    }
}

export { BrowserFirstClient };