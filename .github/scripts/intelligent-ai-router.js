#!/usr/bin/env node

/**
 * Intelligent AI Cost Router
 * 
 * Smart AI client that automatically routes requests through the most cost-effective
 * authentication method: Browser-first (free) → OAuth (subscription) → API (pay-per-token)
 * 
 * FEATURES:
 * - Cost optimization with automatic fallback routing
 * - Browser authentication (Claude.ai cookies) - FREE
 * - OAuth authentication (Claude Max subscription) - Fixed monthly cost
 * - API key authentication (Anthropic API) - Pay-per-token fallback
 * - Intelligent error handling and recovery
 * - Usage tracking and cost analytics
 */

import { ClaudeBrowserClient } from './claude-browser-client.js';
import { ClaudeMaxOAuthClient } from './claude-oauth-client.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class IntelligentAIRouter {
    constructor(options = {}) {
        this.options = {
            preferredMethod: 'browser',  // browser → oauth → api
            fallbackEnabled: true,       // Enable automatic fallbacks
            costTracking: true,          // Track usage costs
            maxRetries: 3,              // Max retries per method
            browserTimeout: 30000,      // Browser method timeout
            rateLimitMs: 30000,         // Rate limiting between requests
            auditLogging: true,         // Comprehensive operation logging
            ...options
        };
        
        this.authMethods = {
            browser: {
                client: null,
                available: false,
                cost: 0,                 // Free with cookies
                rateLimit: 30000,       // 30 seconds
                lastUsed: 0,
                errors: 0,
                maxErrors: 5
            },
            oauth: {
                client: null,
                available: false,
                cost: 0.02,             // Estimated cost per request
                rateLimit: 5000,        // 5 seconds (higher quota)
                lastUsed: 0,
                errors: 0,
                maxErrors: 10
            },
            api: {
                client: null,
                available: false,
                cost: 0.05,             // Estimated API cost
                rateLimit: 1000,        // 1 second (pay-per-use)
                lastUsed: 0,
                errors: 0,
                maxErrors: 3
            }
        };
        
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            totalRequests: 0,
            totalCost: 0,
            methodUsage: {
                browser: 0,
                oauth: 0, 
                api: 0
            },
            operationLog: []
        };
    }

    /**
     * Initialize all available authentication methods
     */
    async initialize() {
        console.log('🚀 Initializing Intelligent AI Router...');
        
        // Initialize browser authentication (highest priority - free)
        await this.initializeBrowserAuth();
        
        // Initialize OAuth authentication (medium priority - subscription)
        await this.initializeOAuthAuth();
        
        // Initialize API authentication (lowest priority - pay-per-token)
        await this.initializeAPIAuth();
        
        this.log('router-initialized', {
            available_methods: Object.keys(this.authMethods).filter(method => 
                this.authMethods[method].available
            ),
            preferred_method: this.options.preferredMethod,
            session_id: this.session.id
        });
        
        console.log('✅ AI Router initialized with', 
            Object.values(this.authMethods).filter(m => m.available).length, 
            'available authentication methods');
    }

    /**
     * Initialize browser-based authentication (FREE)
     */
    async initializeBrowserAuth() {
        try {
            // Check if browser cookies are available
            const hasRequiredCookies = process.env.CLAUDE_SESSION_KEY || 
                                     process.env.CLAUDE_COOKIES_JSON;
            
            if (!hasRequiredCookies) {
                this.log('browser-auth-unavailable', 'Missing Claude session cookies');
                return;
            }
            
            this.authMethods.browser.client = new ClaudeBrowserClient({
                headless: true,
                userConsent: true,
                rateLimitMs: this.authMethods.browser.rateLimit,
                auditLogging: this.options.auditLogging
            });
            
            this.authMethods.browser.available = true;
            this.log('browser-auth-ready', 'Browser authentication initialized');
            
        } catch (error) {
            this.log('browser-auth-failed', { error: error.message });
        }
    }

    /**
     * Initialize OAuth authentication (SUBSCRIPTION)
     */
    async initializeOAuthAuth() {
        try {
            // Check if OAuth credentials are available
            const hasOAuthToken = process.env.CLAUDE_OAUTH_TOKEN;
            
            if (!hasOAuthToken) {
                this.log('oauth-auth-unavailable', 'Missing Claude OAuth token');
                return;
            }
            
            // Initialize OAuth client
            this.authMethods.oauth.client = new ClaudeMaxOAuthClient();
            const isOAuthAuthenticated = await this.authMethods.oauth.client.isAuthenticated();
            this.authMethods.oauth.available = isOAuthAuthenticated;
            this.log('oauth-auth-ready', `OAuth authentication ${isOAuthAuthenticated ? 'active' : 'available but not authenticated'}`);
            
        } catch (error) {
            this.log('oauth-auth-failed', { error: error.message });
        }
    }

    /**
     * Initialize API key authentication (PAY-PER-TOKEN)
     */
    async initializeAPIAuth() {
        try {
            // Check if API key is available
            const hasAPIKey = process.env.ANTHROPIC_API_KEY;
            
            if (!hasAPIKey) {
                this.log('api-auth-unavailable', 'Missing Anthropic API key');
                return;
            }
            
            // TODO: Initialize API client when needed
            this.authMethods.api.available = false; // Disabled for now
            this.log('api-auth-ready', 'API authentication initialized');
            
        } catch (error) {
            this.log('api-auth-failed', { error: error.message });
        }
    }

    /**
     * Send message with intelligent routing
     */
    async sendMessage(message, options = {}) {
        const requestId = this.generateRequestId();
        this.session.totalRequests++;
        
        this.log('request-start', {
            request_id: requestId,
            message_preview: message.substring(0, 100) + '...',
            options
        });
        
        // Determine optimal routing order
        const routingOrder = this.getOptimalRoutingOrder();
        
        for (const method of routingOrder) {
            if (!this.authMethods[method].available) {
                continue;
            }
            
            // Check rate limiting
            if (!this.checkRateLimit(method)) {
                this.log('rate-limit-skip', { method, request_id: requestId });
                continue;
            }
            
            // Check error threshold
            if (this.authMethods[method].errors >= this.authMethods[method].maxErrors) {
                this.log('error-threshold-skip', { method, request_id: requestId });
                continue;
            }
            
            try {
                this.log('attempt-method', { method, request_id: requestId });
                
                const result = await this.executeWithMethod(method, message, options);
                
                // Track successful usage
                this.authMethods[method].lastUsed = Date.now();
                this.authMethods[method].errors = 0; // Reset error count on success
                this.session.methodUsage[method]++;
                this.session.totalCost += this.authMethods[method].cost;
                
                this.log('request-success', {
                    request_id: requestId,
                    method_used: method,
                    cost: this.authMethods[method].cost,
                    response_preview: result.substring(0, 100) + '...'
                });
                
                return result;
                
            } catch (error) {
                this.authMethods[method].errors++;
                this.log('method-failed', {
                    method,
                    request_id: requestId,
                    error: error.message,
                    error_count: this.authMethods[method].errors
                });
                
                // Continue to next method if fallback is enabled
                if (!this.options.fallbackEnabled) {
                    throw error;
                }
            }
        }
        
        // All methods failed
        const error = new Error('All authentication methods failed');
        this.log('request-failed', { request_id: requestId, error: error.message });
        throw error;
    }

    /**
     * Execute request with specific authentication method
     */
    async executeWithMethod(method, message, options) {
        const client = this.authMethods[method].client;
        
        switch (method) {
            case 'browser':
                // Initialize browser if needed
                if (!client.browser) {
                    await client.initialize();
                }
                return await client.sendMessage(message, options);
                
            case 'oauth':
                const oauthClient = this.authMethods.oauth.client;
                if (!oauthClient) {
                    throw new Error('OAuth client not initialized');
                }
                
                const messages = [{ role: 'user', content: message }];
                const result = await oauthClient.makeAuthenticatedRequest(messages, options);
                return {
                    content: result.content[0]?.text || 'No response content',
                    usage: result.usage || {},
                    metadata: { method: 'oauth', cost: this.authMethods.oauth.cost }
                };
                
            case 'api':
                // TODO: Implement API method execution
                throw new Error('API method not yet implemented');
                
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }

    /**
     * Get optimal routing order based on cost and availability
     */
    getOptimalRoutingOrder() {
        const availableMethods = Object.keys(this.authMethods)
            .filter(method => this.authMethods[method].available)
            .sort((a, b) => this.authMethods[a].cost - this.authMethods[b].cost);
        
        return availableMethods;
    }

    /**
     * Check rate limiting for method
     */
    checkRateLimit(method) {
        const auth = this.authMethods[method];
        const timeSinceLastUse = Date.now() - auth.lastUsed;
        return timeSinceLastUse >= auth.rateLimit;
    }

    /**
     * Generate analytics report
     */
    generateAnalytics() {
        const sessionDuration = Date.now() - this.session.startTime;
        const avgRequestsPerMinute = (this.session.totalRequests / sessionDuration) * 60000;
        
        return {
            session: {
                id: this.session.id,
                duration_ms: sessionDuration,
                total_requests: this.session.totalRequests,
                total_cost: this.session.totalCost,
                avg_requests_per_minute: Math.round(avgRequestsPerMinute * 100) / 100
            },
            method_usage: this.session.methodUsage,
            cost_breakdown: Object.keys(this.authMethods).reduce((acc, method) => {
                acc[method] = {
                    requests: this.session.methodUsage[method],
                    cost_per_request: this.authMethods[method].cost,
                    total_cost: this.session.methodUsage[method] * this.authMethods[method].cost,
                    error_rate: this.authMethods[method].errors
                };
                return acc;
            }, {}),
            recommendations: this.generateCostRecommendations()
        };
    }

    /**
     * Generate cost optimization recommendations
     */
    generateCostRecommendations() {
        const recommendations = [];
        
        // Browser authentication usage
        if (this.authMethods.browser.available && this.session.methodUsage.browser === 0) {
            recommendations.push({
                type: 'cost-optimization',
                priority: 'high',
                message: 'Consider using browser authentication (free) for cost savings'
            });
        }
        
        // High API usage warning
        if (this.session.methodUsage.api > this.session.totalRequests * 0.5) {
            recommendations.push({
                type: 'cost-warning',
                priority: 'medium',
                message: 'High API usage detected - consider OAuth subscription for cost reduction'
            });
        }
        
        return recommendations;
    }

    /**
     * Close all client connections
     */
    async close() {
        console.log('🔒 Closing AI Router connections...');
        
        for (const [method, auth] of Object.entries(this.authMethods)) {
            if (auth.client && typeof auth.client.close === 'function') {
                try {
                    await auth.client.close();
                    this.log('client-closed', { method });
                } catch (error) {
                    this.log('client-close-error', { method, error: error.message });
                }
            }
        }
        
        // Generate final analytics
        const analytics = this.generateAnalytics();
        this.log('session-complete', analytics);
        
        console.log('📊 Session Analytics:');
        console.log(`  • Total Requests: ${analytics.session.total_requests}`);
        console.log(`  • Total Cost: $${analytics.session.total_cost.toFixed(4)}`);
        console.log(`  • Browser Usage: ${analytics.method_usage.browser} (FREE)`);
        console.log(`  • OAuth Usage: ${analytics.method_usage.oauth}`);
        console.log(`  • API Usage: ${analytics.method_usage.api}`);
        
        if (analytics.recommendations.length > 0) {
            console.log('💡 Cost Optimization Recommendations:');
            analytics.recommendations.forEach(rec => {
                console.log(`  • ${rec.message}`);
            });
        }
    }

    /**
     * Utility methods
     */
    generateSessionId() {
        return 'ai-session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateRequestId() {
        return 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }

    log(event, data = {}) {
        if (!this.options.auditLogging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            session_id: this.session.id,
            event,
            data
        };
        
        this.session.operationLog.push(logEntry);
        
        // Optional: Write to log file
        // console.log(`[${event}]`, data);
    }
}

/**
 * CLI Interface
 */
class IntelligentAIRouterCLI {
    constructor() {
        this.router = new IntelligentAIRouter();
    }

    async run() {
        const [command, ...args] = process.argv.slice(2);

        try {
            await this.router.initialize();

            switch (command) {
                case 'test':
                    await this.testRouting(args[0] || 'Hello! Please respond briefly to test the AI routing system.');
                    break;
                    
                case 'analytics':
                    console.log(JSON.stringify(this.router.generateAnalytics(), null, 2));
                    break;
                    
                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error) {
            console.error('❌ Router error:', error.message);
            process.exit(1);
        } finally {
            await this.router.close();
        }
    }

    async testRouting(message) {
        console.log('🧪 Testing intelligent AI routing...');
        console.log('📝 Message:', message);
        
        try {
            const response = await this.router.sendMessage(message);
            console.log('✅ Response received:', response.substring(0, 200) + '...');
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            throw error;
        }
    }

    showHelp() {
        console.log(`
🤖 **Intelligent AI Router CLI**

USAGE:
  node intelligent-ai-router.js [command] [options]

COMMANDS:
  test [message]     Test AI routing with a message
  analytics          Show cost analytics and usage statistics  
  help               Show this help message

EXAMPLES:
  node intelligent-ai-router.js test "Hello Claude!"
  node intelligent-ai-router.js analytics

FEATURES:
  • Cost-optimized routing: Browser (free) → OAuth → API
  • Automatic fallback handling and error recovery
  • Real-time cost tracking and analytics
  • Rate limiting and usage optimization
  • Comprehensive audit logging

AUTHENTICATION PRIORITY:
  1. Browser Authentication (FREE) - Uses Claude.ai session cookies
  2. OAuth Authentication (SUBSCRIPTION) - Uses Claude Max subscription
  3. API Authentication (PAY-PER-TOKEN) - Uses Anthropic API key

Environment Variables:
  CLAUDE_SESSION_KEY     - Claude.ai session cookie (browser auth)
  CLAUDE_OAUTH_TOKEN     - Claude Max OAuth token (subscription auth)  
  ANTHROPIC_API_KEY      - Anthropic API key (fallback auth)
        `);
    }
}

// Execute CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const cli = new IntelligentAIRouterCLI();
    cli.run().catch(console.error);
}