#!/usr/bin/env node

/**
 * Claude Max OAuth Client
 * 
 * Implements PKCE OAuth 2.0 authentication for Claude Max subscriptions
 * Allows using Claude Max subscription quota instead of API credits
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');

/**
 * Claude Max OAuth Client with PKCE authentication
 */
class ClaudeMaxOAuthClient {
    constructor(config = {}) {
        this.clientId = config.CLIENT_ID || '9d1c250a-e61b-44d9-88ed-5944d1962f5e'; // OpenCode client ID
        this.redirectUri = config.REDIRECT_URI || 'http://localhost:8080/callback';
        this.scope = config.SCOPE || 'read write';
        this.tokenStorage = config.TOKEN_STORAGE || path.join(process.cwd(), 'data', 'oauth-tokens.json');
        
        // OAuth endpoints
        this.authUrl = 'https://claude.ai/oauth/authorize';
        this.tokenUrl = 'https://claude.ai/oauth/token';
        this.apiUrl = 'https://api.anthropic.com/v1/messages';
        
        // Session state
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.usageQuota = {
            used: 0,
            limit: null,
            resetTime: null
        };
    }

    /**
     * Generate PKCE code verifier and challenge
     */
    generatePKCE() {
        // Generate code verifier (43-128 chars, URL safe)
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        
        // Generate code challenge using S256 method
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
        
        return {
            codeVerifier,
            codeChallenge,
            codeChallengeMethod: 'S256'
        };
    }

    /**
     * Generate authorization URL for Claude Max OAuth
     */
    generateAuthUrl() {
        const pkce = this.generatePKCE();
        const state = crypto.randomBytes(16).toString('hex');
        
        // Store PKCE data for token exchange
        this.pkceData = {
            codeVerifier: pkce.codeVerifier,
            state
        };
        
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            scope: this.scope,
            state: state,
            code_challenge: pkce.codeChallenge,
            code_challenge_method: pkce.codeChallengeMethod
        });
        
        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(authorizationCode, state) {
        if (!this.pkceData || this.pkceData.state !== state) {
            throw new Error('Invalid state parameter - potential CSRF attack');
        }
        
        const tokenRequestBody = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.clientId,
            code: authorizationCode,
            redirect_uri: this.redirectUri,
            code_verifier: this.pkceData.codeVerifier
        });
        
        try {
            const response = await this.makeHttpRequest(
                this.tokenUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                },
                tokenRequestBody.toString()
            );
            
            const tokenData = JSON.parse(response.body);
            
            if (tokenData.error) {
                throw new Error(`OAuth token exchange failed: ${tokenData.error_description || tokenData.error}`);
            }
            
            // Store tokens
            this.accessToken = tokenData.access_token;
            this.refreshToken = tokenData.refresh_token;
            this.tokenExpiry = Date.now() + ((tokenData.expires_in || 3600) * 1000);
            
            // Save tokens securely
            await this.saveTokens();
            
            console.log('✅ OAuth authentication successful');
            console.log(`🔑 Access token expires in ${Math.round((this.tokenExpiry - Date.now()) / 1000 / 60)} minutes`);
            
            return {
                accessToken: this.accessToken,
                refreshToken: this.refreshToken,
                expiresAt: this.tokenExpiry
            };
            
        } catch (error) {
            console.error('❌ Token exchange failed:', error.message);
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const refreshRequestBody = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.clientId,
            refresh_token: this.refreshToken
        });
        
        try {
            const response = await this.makeHttpRequest(
                this.tokenUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                },
                refreshRequestBody.toString()
            );
            
            const tokenData = JSON.parse(response.body);
            
            if (tokenData.error) {
                throw new Error(`Token refresh failed: ${tokenData.error_description || tokenData.error}`);
            }
            
            // Update tokens
            this.accessToken = tokenData.access_token;
            if (tokenData.refresh_token) {
                this.refreshToken = tokenData.refresh_token;
            }
            this.tokenExpiry = Date.now() + ((tokenData.expires_in || 3600) * 1000);
            
            await this.saveTokens();
            
            console.log('🔄 Access token refreshed successfully');
            return this.accessToken;
            
        } catch (error) {
            console.error('❌ Token refresh failed:', error.message);
            throw error;
        }
    }

    /**
     * Make authenticated API request to Claude
     */
    async makeAuthenticatedRequest(messages, options = {}) {
        await this.ensureValidToken();
        
        const requestOptions = {
            model: options.model || 'claude-3-5-sonnet-20241022',
            max_tokens: options.max_tokens || 4000,
            temperature: options.temperature || 0.7,
            messages: messages
        };
        
        try {
            const response = await this.makeHttpRequest(
                this.apiUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`,
                        'anthropic-version': '2023-06-01'
                    }
                },
                JSON.stringify(requestOptions)
            );
            
            const result = JSON.parse(response.body);
            
            if (result.error) {
                // Handle quota exhaustion for Max subscriptions
                if (result.error.type === 'rate_limit_error' && 
                    result.error.message.includes('usage limit')) {
                    throw new MaxQuotaExhaustedError('Claude Max subscription quota exhausted', result.error);
                }
                throw new Error(`Claude API error: ${result.error.message}`);
            }
            
            // Update usage tracking
            this.updateUsageTracking(result);
            
            return result;
            
        } catch (error) {
            if (error.message.includes('401') || error.message.includes('403')) {
                console.log('🔑 Token expired or invalid, attempting refresh...');
                await this.refreshAccessToken();
                
                // Retry once with new token
                return this.makeAuthenticatedRequest(messages, options);
            }
            throw error;
        }
    }

    /**
     * Ensure we have a valid access token
     */
    async ensureValidToken() {
        // Load tokens if not in memory
        if (!this.accessToken) {
            await this.loadTokens();
        }
        
        // Check if token is expired
        if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry - 60000)) {
            if (this.refreshToken) {
                await this.refreshAccessToken();
            } else {
                throw new Error('No valid token available. Please re-authenticate.');
            }
        }
    }

    /**
     * Update usage tracking for Claude Max subscription
     */
    updateUsageTracking(result) {
        if (result.usage) {
            this.usageQuota.used += (result.usage.input_tokens || 0) + (result.usage.output_tokens || 0);
        }
        
        // Check response headers for quota information
        if (result.headers) {
            const quotaLimit = result.headers['x-quota-limit'];
            const quotaUsed = result.headers['x-quota-used'];
            const quotaReset = result.headers['x-quota-reset'];
            
            if (quotaLimit) this.usageQuota.limit = parseInt(quotaLimit);
            if (quotaUsed) this.usageQuota.used = parseInt(quotaUsed);
            if (quotaReset) this.usageQuota.resetTime = new Date(quotaReset);
        }
    }

    /**
     * Get current usage statistics
     */
    getUsageStats() {
        const resetTime = this.usageQuota.resetTime || new Date(Date.now() + 5 * 60 * 60 * 1000); // Default to 5 hours
        const timeUntilReset = Math.max(0, resetTime.getTime() - Date.now());
        
        return {
            used: this.usageQuota.used,
            limit: this.usageQuota.limit,
            remaining: this.usageQuota.limit ? this.usageQuota.limit - this.usageQuota.used : null,
            resetTime: resetTime,
            timeUntilReset: Math.ceil(timeUntilReset / 1000 / 60), // minutes
            percentageUsed: this.usageQuota.limit ? 
                Math.round((this.usageQuota.used / this.usageQuota.limit) * 100) : null
        };
    }

    /**
     * Save tokens securely to file
     */
    async saveTokens() {
        const tokenData = {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            tokenExpiry: this.tokenExpiry,
            usageQuota: this.usageQuota,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            await fs.mkdir(path.dirname(this.tokenStorage), { recursive: true });
            await fs.writeFile(this.tokenStorage, JSON.stringify(tokenData, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save tokens:', error.message);
        }
    }

    /**
     * Load tokens from file
     */
    async loadTokens() {
        try {
            const data = await fs.readFile(this.tokenStorage, 'utf8');
            const tokenData = JSON.parse(data);
            
            this.accessToken = tokenData.accessToken;
            this.refreshToken = tokenData.refreshToken;
            this.tokenExpiry = tokenData.tokenExpiry;
            this.usageQuota = tokenData.usageQuota || { used: 0, limit: null, resetTime: null };
            
            console.log('🔑 Loaded saved OAuth tokens');
            return true;
        } catch (error) {
            console.log('💡 No saved tokens found - authentication required');
            return false;
        }
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        await this.loadTokens();
        
        if (!this.accessToken) return false;
        
        // Check if token is expired
        if (this.tokenExpiry && Date.now() >= this.tokenExpiry - 60000) {
            if (this.refreshToken) {
                try {
                    await this.refreshAccessToken();
                    return true;
                } catch (error) {
                    return false;
                }
            }
            return false;
        }
        
        return true;
    }

    /**
     * Clear stored tokens (logout)
     */
    async logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.usageQuota = { used: 0, limit: null, resetTime: null };
        
        try {
            await fs.unlink(this.tokenStorage);
            console.log('🚪 Logged out successfully');
        } catch (error) {
            // File might not exist, which is fine
        }
    }

    /**
     * HTTP request utility
     */
    async makeHttpRequest(url, options, data) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = https.request(requestOptions, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(data);
            }
            
            req.end();
        });
    }
}

/**
 * Custom error for Claude Max quota exhaustion
 */
class MaxQuotaExhaustedError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'MaxQuotaExhaustedError';
        this.originalError = originalError;
        this.recoverable = false;
        this.fallbackAvailable = true;
        this.resetTime = this.extractResetTime(originalError);
    }
    
    extractResetTime(error) {
        // Try to extract reset time from error message
        if (error && error.message) {
            const match = error.message.match(/reset(?:s)? (?:at|in) (\d+)/i);
            if (match) {
                return new Date(parseInt(match[1]) * 1000);
            }
        }
        
        // Default to 5 hours from now (Claude Max reset window)
        return new Date(Date.now() + 5 * 60 * 60 * 1000);
    }
}

/**
 * CLI interface for OAuth authentication
 */
async function main() {
    const command = process.argv[2];
    const oauthClient = new ClaudeMaxOAuthClient();
    
    switch (command) {
        case 'login':
            console.log('🔐 **CLAUDE MAX OAUTH AUTHENTICATION**\n');
            
            const authUrl = oauthClient.generateAuthUrl();
            console.log('📋 Please visit this URL to authenticate:');
            console.log(`\n${authUrl}\n`);
            console.log('💡 After authentication, you will be redirected to localhost.');
            console.log('   Copy the authorization code from the URL and run:');
            console.log('   node claude-oauth-client.js token <authorization_code> <state>');
            break;
            
        case 'token':
            const code = process.argv[3];
            const state = process.argv[4];
            
            if (!code || !state) {
                console.error('❌ Usage: node claude-oauth-client.js token <code> <state>');
                process.exit(1);
            }
            
            try {
                await oauthClient.exchangeCodeForToken(code, state);
                console.log('✅ Authentication completed successfully!');
            } catch (error) {
                console.error('❌ Authentication failed:', error.message);
                process.exit(1);
            }
            break;
            
        case 'status':
            const isAuth = await oauthClient.isAuthenticated();
            if (isAuth) {
                const usage = oauthClient.getUsageStats();
                console.log('✅ Authenticated with Claude Max');
                console.log(`📊 Usage: ${usage.used}${usage.limit ? `/${usage.limit}` : ''} ${usage.percentageUsed ? `(${usage.percentageUsed}%)` : ''}`);
                console.log(`⏰ Reset in: ${usage.timeUntilReset} minutes`);
            } else {
                console.log('❌ Not authenticated');
            }
            break;
            
        case 'logout':
            await oauthClient.logout();
            break;
            
        case 'test':
            try {
                const result = await oauthClient.makeAuthenticatedRequest([
                    { role: 'user', content: 'Hello! Please respond with a short greeting.' }
                ]);
                console.log('✅ Test request successful');
                console.log('📝 Response:', result.content[0].text);
                
                const usage = oauthClient.getUsageStats();
                console.log(`📊 Updated usage: ${usage.used}${usage.limit ? `/${usage.limit}` : ''}`);
            } catch (error) {
                console.error('❌ Test request failed:', error.message);
            }
            break;
            
        default:
            console.log('🔐 **CLAUDE MAX OAUTH CLIENT**\n');
            console.log('Usage:');
            console.log('  node claude-oauth-client.js login      - Start OAuth login flow');
            console.log('  node claude-oauth-client.js token <code> <state> - Complete authentication');
            console.log('  node claude-oauth-client.js status     - Check authentication status');
            console.log('  node claude-oauth-client.js test       - Test API request');
            console.log('  node claude-oauth-client.js logout     - Clear stored tokens');
            break;
    }
}

module.exports = { ClaudeMaxOAuthClient, MaxQuotaExhaustedError };

if (require.main === module) {
    main().catch(console.error);
}