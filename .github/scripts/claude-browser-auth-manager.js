#!/usr/bin/env node

/**
 * Claude Browser Authentication Manager
 * 
 * Integration layer that adds browser-based authentication to the existing
 * authentication management system as a cost-effective alternative to API keys.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const { ClaudeAuthManager } = require('./claude-auth-manager');
const { ClaudeBrowserClient } = require('./claude-browser-client');

/**
 * Extended authentication manager with browser support
 */
class ClaudeBrowserAuthManager extends ClaudeAuthManager {
    constructor(config = {}) {
        super(config);
        
        // Add browser client as an authentication method
        this.browserClient = null;
        this.config.auth_strategy = config.auth_strategy || process.env.AUTH_STRATEGY || 'browser_first';
    }

    /**
     * Initialize with browser support
     */
    async initialize() {
        await super.initialize();
        
        // Override auth method determination to include browser
        if (this.config.auth_strategy === 'browser_first') {
            await this.determineBrowserAuthMethod();
        }
    }

    /**
     * Determine if browser authentication is available and preferred
     */
    async determineBrowserAuthMethod() {
        // Check if we have session cookies available
        const hasSessionCookies = process.env.CLAUDE_SESSION_KEY && 
                                 process.env.CLAUDE_ORG_ID;
        
        if (hasSessionCookies) {
            try {
                console.log('🤖 Testing browser authentication...');
                
                // Initialize browser client for testing
                const testClient = new ClaudeBrowserClient({ headless: true });
                await testClient.initialize();
                
                // Quick test message
                const testResponse = await testClient.sendMessage('Hi', { timeout: 10000 });
                await testClient.close();
                
                if (testResponse && testResponse.content[0].text) {
                    this.authState.current_method = 'browser';
                    console.log('✅ Browser authentication successful');
                    return;
                }
            } catch (error) {
                console.warn('⚠️ Browser authentication failed:', error.message);
            }
        }
        
        // Fall back to parent class auth determination
        await this.determineAuthMethod();
    }

    /**
     * Make request with browser support
     */
    async makeRequest(messages, options = {}) {
        await this.ensureAuthenticated();
        
        try {
            let result;
            
            if (this.authState.current_method === 'browser') {
                result = await this.makeBrowserRequest(messages, options);
                this.authState.usage_stats.browser_requests = 
                    (this.authState.usage_stats.browser_requests || 0) + 1;
                
            } else {
                // Use parent class for other auth methods
                return await super.makeRequest(messages, options);
            }
            
            // Record usage
            await this.recordUsage(result, options);
            await this.saveAuthState();
            
            return result;
            
        } catch (error) {
            return await this.handleAuthError(error, messages, options);
        }
    }

    /**
     * Make browser-based request
     */
    async makeBrowserRequest(messages, options) {
        if (!this.browserClient) {
            this.browserClient = new ClaudeBrowserClient({ 
                headless: options.headless !== false 
            });
            await this.browserClient.initialize();
        }
        
        try {
            return await this.browserClient.makeRequest(messages, options);
        } catch (error) {
            // Close and retry once
            if (this.browserClient) {
                await this.browserClient.close();
                this.browserClient = null;
            }
            
            // One retry
            this.browserClient = new ClaudeBrowserClient({ 
                headless: options.headless !== false 
            });
            await this.browserClient.initialize();
            return await this.browserClient.makeRequest(messages, options);
        }
    }

    /**
     * Enhanced auth status with browser support
     */
    getAuthStatus() {
        const status = super.getAuthStatus();
        
        // Add browser-specific stats
        status.usage_stats.browser_requests = 
            this.authState.usage_stats.browser_requests || 0;
        
        return status;
    }

    /**
     * Generate enhanced auth report
     */
    generateAuthReport() {
        const status = this.getAuthStatus();
        const usage = this.usageMonitor.getCurrentUsage();
        
        console.log('🤖 **BROWSER-ENHANCED AUTHENTICATION REPORT**\n');
        
        // Current method
        console.log('📊 **CURRENT STATUS:**');
        console.log(`   Authentication Method: ${status.current_method.toUpperCase()}`);
        console.log(`   Fallback Active: ${status.fallback_active ? 'Yes' : 'No'}`);
        
        // Usage distribution
        console.log('\n📈 **USAGE DISTRIBUTION:**');
        const totalRequests = (status.usage_stats.oauth_requests || 0) + 
                             (status.usage_stats.api_key_requests || 0) + 
                             (status.usage_stats.browser_requests || 0);
        
        if (totalRequests > 0) {
            const browserPercent = Math.round(((status.usage_stats.browser_requests || 0) / totalRequests) * 100);
            const oauthPercent = Math.round(((status.usage_stats.oauth_requests || 0) / totalRequests) * 100);
            const apiPercent = Math.round(((status.usage_stats.api_key_requests || 0) / totalRequests) * 100);
            
            console.log(`   🤖 Browser Requests: ${status.usage_stats.browser_requests || 0} (${browserPercent}%)`);
            console.log(`   🔐 OAuth Requests: ${status.usage_stats.oauth_requests || 0} (${oauthPercent}%)`);
            console.log(`   🔑 API Key Requests: ${status.usage_stats.api_key_requests || 0} (${apiPercent}%)`);
        }
        
        // Cost analysis
        console.log('\n💰 **COST ANALYSIS:**');
        console.log(`   Today's Cost: $${usage.today.estimated_cost.toFixed(4)}`);
        console.log(`   Monthly Cost: $${usage.month.estimated_cost.toFixed(2)}`);
        
        if (status.usage_stats.browser_requests > 0) {
            console.log(`   💡 Browser requests: FREE (${status.usage_stats.browser_requests} requests saved)`);
            const savedCost = (status.usage_stats.browser_requests * 0.02); // Rough estimate
            console.log(`   💰 Estimated savings: $${savedCost.toFixed(2)}`);
        }
    }

    /**
     * Cleanup browser resources
     */
    async close() {
        if (this.browserClient) {
            await this.browserClient.close();
            this.browserClient = null;
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const command = process.argv[2];
    const authManager = new ClaudeBrowserAuthManager();
    
    try {
        switch (command) {
            case 'status':
                await authManager.initialize();
                authManager.generateAuthReport();
                break;
                
            case 'test':
                await authManager.initialize();
                try {
                    const result = await authManager.makeRequest([
                        { role: 'user', content: 'Hello! Please respond briefly to test browser authentication.' }
                    ], { max_tokens: 50 });
                    
                    console.log('✅ Browser auth test successful');
                    console.log(`📝 Response: ${result.content[0].text}`);
                    console.log(`🤖 Method used: ${authManager.authState.current_method}`);
                } catch (error) {
                    console.error('❌ Test failed:', error.message);
                }
                break;
                
            default:
                console.log('🤖 **CLAUDE BROWSER AUTHENTICATION MANAGER**\n');
                console.log('Usage:');
                console.log('  node claude-browser-auth-manager.js status  - Show enhanced auth status');
                console.log('  node claude-browser-auth-manager.js test    - Test browser authentication');
                console.log('');
                console.log('Authentication priority (browser_first):');
                console.log('  1. Browser Session (FREE)');
                console.log('  2. Claude Max OAuth (subscription)');
                console.log('  3. API Key (pay-per-token)');
                console.log('  4. Activity-only mode (final fallback)');
                break;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await authManager.close();
    }
}

module.exports = { ClaudeBrowserAuthManager };

if (require.main === module) {
    main().catch(console.error);
}