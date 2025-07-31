#!/usr/bin/env node

/**
 * Claude Authentication Manager
 * 
 * Manages OAuth-first authentication strategy with intelligent API key fallback.
 * Implements 24-hour fallback logic and usage optimization for Claude Max subscriptions.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { ClaudeMaxOAuthClient, MaxQuotaExhaustedError } = require('./claude-oauth-client');
const { 
    ClaudeApiClient, 
    QuotaExhaustedError, 
    RateLimitExceededError, 
    AuthenticationError 
} = require('./enhancer-modules/claude-api-client');
const { UsageMonitor } = require('./usage-monitor');

/**
 * Authentication Manager with OAuth-first strategy
 */
class ClaudeAuthManager {
    constructor(config = {}) {
        this.config = {
            // Authentication strategy
            auth_strategy: config.auth_strategy || process.env.AUTH_STRATEGY || 'api_key_first',
            fallback_delay_hours: config.fallback_delay_hours || 24,
            oauth_retry_interval_hours: config.oauth_retry_interval_hours || 4,
            max_oauth_failures: config.max_oauth_failures || 3,
            
            // OAuth configuration
            oauth_token: config.CLAUDE_OAUTH_TOKEN || process.env.CLAUDE_OAUTH_TOKEN,
            subscription_tier: config.subscription_tier || 'max_5x',
            
            // API key fallback
            api_key: config.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
            
            // Storage
            state_file: config.state_file || path.join(process.cwd(), 'data', 'auth-state.json'),
            
            ...config
        };
        
        // Initialize clients
        this.oauthClient = new ClaudeMaxOAuthClient({
            CLIENT_ID: this.config.oauth_client_id,
            TOKEN_STORAGE: path.join(path.dirname(this.config.state_file), 'oauth-tokens.json')
        });
        
        this.apiKeyClient = new ClaudeApiClient({
            ANTHROPIC_API_KEY: this.config.api_key,
            MODEL: 'claude-3-5-sonnet-20241022'
        });
        
        this.usageMonitor = new UsageMonitor();
        
        // Authentication state
        this.authState = {
            current_method: null,
            oauth_failures: 0,
            last_oauth_failure: null,
            fallback_activated: false,
            fallback_start_time: null,
            last_oauth_retry: null,
            usage_stats: {
                oauth_requests: 0,
                api_key_requests: 0,
                fallback_activations: 0
            }
        };
    }

    /**
     * Initialize authentication manager
     */
    async initialize() {
        await this.loadAuthState();
        await this.usageMonitor.initialize();
        
        // Determine initial authentication method
        await this.determineAuthMethod();
        
        console.log(`🔐 Auth Manager initialized: ${this.authState.current_method} mode`);
    }

    /**
     * Make authenticated request with OAuth-first strategy
     */
    async makeRequest(messages, options = {}) {
        await this.ensureAuthenticated();
        
        try {
            let result;
            
            if (this.authState.current_method === 'oauth_max') {
                result = await this.makeOAuthRequest(messages, options);
                this.authState.usage_stats.oauth_requests++;
                
                // Reset OAuth failure count on success
                this.authState.oauth_failures = 0;
                
            } else if (this.authState.current_method === 'api_key') {
                result = await this.makeApiKeyRequest(messages, options);
                this.authState.usage_stats.api_key_requests++;
                
            } else {
                throw new Error('No valid authentication method available');
            }
            
            // Record usage
            await this.recordUsage(result, options);
            
            // Save state
            await this.saveAuthState();
            
            return result;
            
        } catch (error) {
            return await this.handleAuthError(error, messages, options);
        }
    }

    /**
     * Make OAuth request
     */
    async makeOAuthRequest(messages, options) {
        try {
            return await this.oauthClient.makeAuthenticatedRequest(messages, options);
        } catch (error) {
            if (error instanceof MaxQuotaExhaustedError) {
                console.log('📊 Claude Max quota exhausted - waiting for reset');
                throw error;
            }
            throw error;
        }
    }

    /**
     * Make API key request
     */
    async makeApiKeyRequest(messages, options) {
        return await this.apiKeyClient.makeRequest(messages, options);
    }

    /**
     * Handle authentication errors with fallback logic
     */
    async handleAuthError(error, messages, options) {
        console.warn(`⚠️ Auth error: ${error.constructor.name} - ${error.message}`);
        
        if (this.authState.current_method === 'oauth_max') {
            this.authState.oauth_failures++;
            this.authState.last_oauth_failure = new Date().toISOString();
            
            // Check if we should activate fallback
            if (this.shouldActivateFallback(error)) {
                await this.activateFallback();
                
                // Retry with API key
                if (this.authState.current_method === 'api_key') {
                    try {
                        return await this.makeApiKeyRequest(messages, options);
                    } catch (fallbackError) {
                        console.error('❌ API key fallback also failed');
                        throw fallbackError;
                    }
                }
            }
        }
        
        // If both methods fail, throw the original error
        throw error;
    }

    /**
     * Determine if fallback should be activated
     */
    shouldActivateFallback(error) {
        // Immediate fallback conditions
        const immediateConditions = [
            error instanceof AuthenticationError,
            error instanceof MaxQuotaExhaustedError,
            this.authState.oauth_failures >= this.config.max_oauth_failures
        ];
        
        if (immediateConditions.some(condition => condition)) {
            return true;
        }
        
        // 24-hour persistent failure condition
        if (this.authState.last_oauth_failure) {
            const failureAge = Date.now() - new Date(this.authState.last_oauth_failure).getTime();
            const fallbackThreshold = this.config.fallback_delay_hours * 60 * 60 * 1000;
            
            if (failureAge >= fallbackThreshold) {
                console.log(`⏰ OAuth failed for ${this.config.fallback_delay_hours} hours - activating fallback`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Activate API key fallback
     */
    async activateFallback() {
        if (!this.authState.fallback_activated) {
            console.log('🔄 Activating API key fallback mode');
            
            this.authState.fallback_activated = true;
            this.authState.fallback_start_time = new Date().toISOString();
            this.authState.usage_stats.fallback_activations++;
        }
        
        // Switch to API key if available
        if (this.config.api_key) {
            this.authState.current_method = 'api_key';
            console.log('🔑 Switched to API key authentication');
        } else {
            this.authState.current_method = 'none';
            console.log('⚠️ No API key available - system will use activity-only mode');
        }
        
        await this.saveAuthState();
    }

    /**
     * Check if we should retry OAuth authentication
     */
    async checkOAuthRetry() {
        if (!this.authState.fallback_activated) {
            return false;
        }
        
        // Check if enough time has passed since last retry
        const now = Date.now();
        const retryInterval = this.config.oauth_retry_interval_hours * 60 * 60 * 1000;
        
        if (this.authState.last_oauth_retry) {
            const timeSinceRetry = now - new Date(this.authState.last_oauth_retry).getTime();
            if (timeSinceRetry < retryInterval) {
                return false;
            }
        }
        
        console.log('🔄 Attempting OAuth retry...');
        this.authState.last_oauth_retry = new Date().toISOString();
        
        try {
            // Test OAuth authentication
            const isAuthenticated = await this.oauthClient.isAuthenticated();
            
            if (isAuthenticated) {
                // Test with a simple request
                await this.oauthClient.makeAuthenticatedRequest([
                    { role: 'user', content: 'Hello' }
                ], { max_tokens: 10 });
                
                // Success! Switch back to OAuth
                console.log('✅ OAuth retry successful - switching back to OAuth');
                this.authState.current_method = 'oauth_max';
                this.authState.oauth_failures = 0;
                this.authState.fallback_activated = false;
                this.authState.fallback_start_time = null;
                
                await this.saveAuthState();
                return true;
            }
        } catch (error) {
            console.log(`⚠️ OAuth retry failed: ${error.message}`);
        }
        
        await this.saveAuthState();
        return false;
    }

    /**
     * Determine appropriate authentication method
     */
    async determineAuthMethod() {
        // If currently in fallback mode, check for OAuth retry
        if (this.authState.fallback_activated) {
            const retrySuccessful = await this.checkOAuthRetry();
            if (retrySuccessful) {
                return;
            }
            
            // Continue with current fallback method
            if (this.config.api_key) {
                this.authState.current_method = 'api_key';
            } else {
                this.authState.current_method = 'none';
            }
            return;
        }
        
        // Try OAuth first
        if (this.config.oauth_token || await this.oauthClient.isAuthenticated()) {
            try {
                // Verify OAuth is working
                const usage = this.oauthClient.getUsageStats();
                
                // Check if quota is available
                if (usage.remaining === null || usage.remaining > 0) {
                    this.authState.current_method = 'oauth_max';
                    console.log('🔐 Using Claude Max OAuth authentication');
                    return;
                }
                
                console.log('📊 Claude Max quota exhausted, checking reset time...');
                if (usage.timeUntilReset && usage.timeUntilReset > 0) {
                    console.log(`⏰ Quota resets in ${usage.timeUntilReset} minutes`);
                    
                    // If reset is soon (< 30 minutes), wait for OAuth
                    if (usage.timeUntilReset <= 30) {
                        this.authState.current_method = 'oauth_max';
                        return;
                    }
                }
                
            } catch (error) {
                console.warn('⚠️ OAuth verification failed:', error.message);
            }
        }
        
        // Fallback to API key
        if (this.config.api_key) {
            this.authState.current_method = 'api_key';
            console.log('🔑 Using API key authentication');
        } else {
            this.authState.current_method = 'none';
            console.log('⚠️ No authentication method available');
        }
    }

    /**
     * Ensure we have valid authentication
     */
    async ensureAuthenticated() {
        if (!this.authState.current_method || this.authState.current_method === 'none') {
            await this.determineAuthMethod();
        }
        
        if (this.authState.current_method === 'oauth_max') {
            await this.oauthClient.ensureValidToken();
        }
    }

    /**
     * Record usage statistics
     */
    async recordUsage(result, options) {
        const usage = {
            requests: 1,
            input_tokens: result.usage?.input_tokens || 0,
            output_tokens: result.usage?.output_tokens || 0,
            cache_creation_tokens: result.usage?.cache_creation_input_tokens || 0,
            cache_read_tokens: result.usage?.cache_read_input_tokens || 0,
            auth_method: this.authState.current_method,
            session_type: options.session_type || 'enhancement',
            enhancement_mode: options.enhancement_mode || 'unknown',
            success: true
        };
        
        await this.usageMonitor.recordUsage(usage);
    }

    /**
     * Get current authentication status
     */
    getAuthStatus() {
        const status = {
            current_method: this.authState.current_method,
            fallback_active: this.authState.fallback_activated,
            oauth_failures: this.authState.oauth_failures,
            usage_stats: this.authState.usage_stats
        };
        
        if (this.authState.current_method === 'oauth_max') {
            status.oauth_usage = this.oauthClient.getUsageStats();
        }
        
        if (this.authState.fallback_activated) {
            const fallbackAge = Date.now() - new Date(this.authState.fallback_start_time).getTime();
            status.fallback_duration_hours = Math.round(fallbackAge / (1000 * 60 * 60));
        }
        
        return status;
    }

    /**
     * Generate authentication report
     */
    generateAuthReport() {
        const status = this.getAuthStatus();
        const usage = this.usageMonitor.getCurrentUsage();
        
        console.log('🔐 **AUTHENTICATION STATUS REPORT**\n');
        
        // Current method
        console.log('📊 **CURRENT STATUS:**');
        console.log(`   Authentication Method: ${status.current_method.toUpperCase()}`);
        console.log(`   Fallback Active: ${status.fallback_active ? 'Yes' : 'No'}`);
        
        if (status.fallback_active) {
            console.log(`   Fallback Duration: ${status.fallback_duration_hours} hours`);
        }
        
        // Usage distribution
        console.log('\n📈 **USAGE DISTRIBUTION:**');
        const totalRequests = status.usage_stats.oauth_requests + status.usage_stats.api_key_requests;
        if (totalRequests > 0) {
            const oauthPercent = Math.round((status.usage_stats.oauth_requests / totalRequests) * 100);
            const apiPercent = Math.round((status.usage_stats.api_key_requests / totalRequests) * 100);
            
            console.log(`   OAuth Requests: ${status.usage_stats.oauth_requests} (${oauthPercent}%)`);
            console.log(`   API Key Requests: ${status.usage_stats.api_key_requests} (${apiPercent}%)`);
            console.log(`   Fallback Activations: ${status.usage_stats.fallback_activations}`);
        }
        
        // OAuth status
        if (status.oauth_usage) {
            console.log('\n🎯 **CLAUDE MAX STATUS:**');
            console.log(`   Usage: ${status.oauth_usage.used}${status.oauth_usage.limit ? `/${status.oauth_usage.limit}` : ''}`);
            console.log(`   Reset Time: ${status.oauth_usage.resetTime?.toLocaleString() || 'Unknown'}`);
            console.log(`   Time Until Reset: ${status.oauth_usage.timeUntilReset || 0} minutes`);
        }
        
        // Cost analysis
        console.log('\n💰 **COST ANALYSIS:**');
        console.log(`   Today's Cost: $${usage.today.estimated_cost.toFixed(4)}`);
        console.log(`   Monthly Cost: $${usage.month.estimated_cost.toFixed(2)}`);
        
        if (this.config.subscription_tier) {
            const tierCosts = {
                pro: 20,
                max_5x: 100,
                max_20x: 200
            };
            const subscriptionCost = tierCosts[this.config.subscription_tier] || 0;
            console.log(`   Subscription Cost: $${subscriptionCost}/month`);
            
            if (usage.month.estimated_cost > subscriptionCost * 0.5) {
                console.log('   💡 Recommendation: OAuth usage is cost-effective');
            }
        }
    }

    /**
     * State persistence
     */
    async loadAuthState() {
        try {
            const data = await fs.readFile(this.config.state_file, 'utf8');
            this.authState = { ...this.authState, ...JSON.parse(data) };
        } catch (error) {
            // File doesn't exist, use defaults
        }
    }

    async saveAuthState() {
        try {
            await fs.mkdir(path.dirname(this.config.state_file), { recursive: true });
            await fs.writeFile(this.config.state_file, JSON.stringify(this.authState, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save auth state:', error.message);
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const command = process.argv[2];
    const authManager = new ClaudeAuthManager();
    
    switch (command) {
        case 'status':
            await authManager.initialize();
            authManager.generateAuthReport();
            break;
            
        case 'switch':
            const method = process.argv[3];
            if (!['oauth', 'api_key'].includes(method)) {
                console.error('❌ Usage: node claude-auth-manager.js switch <oauth|api_key>');
                process.exit(1);
            }
            
            await authManager.initialize();
            if (method === 'oauth') {
                await authManager.determineAuthMethod();
                console.log('🔄 Attempted switch to OAuth (subject to availability)');
            } else {
                await authManager.activateFallback();
                console.log('🔄 Switched to API key fallback mode');
            }
            break;
            
        case 'test':
            await authManager.initialize();
            try {
                const result = await authManager.makeRequest([
                    { role: 'user', content: 'Hello! Please respond briefly.' }
                ], { max_tokens: 50 });
                
                console.log('✅ Test request successful');
                console.log(`📝 Response: ${result.content[0].text}`);
                console.log(`🔐 Method used: ${authManager.authState.current_method}`);
            } catch (error) {
                console.error('❌ Test request failed:', error.message);
            }
            break;
            
        case 'reset':
            await authManager.initialize();
            authManager.authState = {
                current_method: null,
                oauth_failures: 0,
                last_oauth_failure: null,
                fallback_activated: false,
                fallback_start_time: null,
                last_oauth_retry: null,
                usage_stats: {
                    oauth_requests: 0,
                    api_key_requests: 0,
                    fallback_activations: 0
                }
            };
            await authManager.saveAuthState();
            console.log('🔄 Authentication state reset');
            break;
            
        default:
            console.log('🔐 **CLAUDE AUTHENTICATION MANAGER**\n');
            console.log('Usage:');
            console.log('  node claude-auth-manager.js status          - Show auth status');
            console.log('  node claude-auth-manager.js switch <method> - Switch auth method');
            console.log('  node claude-auth-manager.js test            - Test current auth');
            console.log('  node claude-auth-manager.js reset           - Reset auth state');
            console.log('');
            console.log('Authentication priority:');
            console.log('  1. Claude Max OAuth (primary)');
            console.log('  2. API Key (24-hour fallback)');
            console.log('  3. Activity-only mode (final fallback)');
            break;
    }
}

module.exports = { ClaudeAuthManager };

if (require.main === module) {
    main().catch(console.error);
}