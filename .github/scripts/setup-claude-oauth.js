#!/usr/bin/env node

/**
 * Claude Max OAuth Setup Script
 * 
 * Securely generates OAuth tokens and adds them to GitHub secrets
 * WITHOUT storing them in the codebase
 * 
 * Usage: node setup-claude-oauth.js
 */

const readline = require('readline');
const { execSync } = require('child_process');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class ClaudeOAuthSetup {
    constructor() {
        this.clientId = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'; // OpenCode client ID
        this.redirectUri = 'http://localhost:8080/callback';
        this.scope = 'openid profile';
        
        // OAuth endpoints
        this.authUrl = 'https://claude.ai/oauth/authorize';
        this.tokenUrl = 'https://claude.ai/oauth/token';
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    /**
     * Generate PKCE code verifier and challenge
     */
    generatePKCE() {
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
            
        return { codeVerifier, codeChallenge };
    }
    
    /**
     * Start local server to receive OAuth callback
     */
    startCallbackServer(codeVerifier) {
        return new Promise((resolve, reject) => {
            const server = http.createServer(async (req, res) => {
                const url = new URL(req.url, `http://${req.headers.host}`);
                
                if (url.pathname === '/callback') {
                    const code = url.searchParams.get('code');
                    const error = url.searchParams.get('error');
                    
                    if (error) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(`
                            <html>
                                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                                    <h1 style="color: #e74c3c;">❌ Authorization Failed</h1>
                                    <p>Error: ${error}</p>
                                    <p>You can close this window.</p>
                                </body>
                            </html>
                        `);
                        server.close();
                        reject(new Error(`OAuth error: ${error}`));
                        return;
                    }
                    
                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(`
                            <html>
                                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                                    <h1 style="color: #27ae60;">✅ Authorization Successful!</h1>
                                    <p>Exchanging code for tokens...</p>
                                    <p>You can close this window.</p>
                                </body>
                            </html>
                        `);
                        
                        server.close();
                        
                        // Exchange code for tokens
                        try {
                            const tokens = await this.exchangeCodeForTokens(code, codeVerifier);
                            resolve(tokens);
                        } catch (err) {
                            reject(err);
                        }
                    }
                }
            });
            
            server.listen(8080, () => {
                console.log('🌐 Callback server listening on http://localhost:8080');
            });
            
            // Timeout after 5 minutes
            setTimeout(() => {
                server.close();
                reject(new Error('OAuth timeout - no callback received'));
            }, 300000);
        });
    }
    
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForTokens(code, codeVerifier) {
        return new Promise((resolve, reject) => {
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
                client_id: this.clientId,
                code_verifier: codeVerifier
            });
            
            const url = new URL(this.tokenUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': params.toString().length
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const tokens = JSON.parse(data);
                        if (tokens.access_token) {
                            resolve(tokens);
                        } else {
                            reject(new Error(`Token exchange failed: ${data}`));
                        }
                    } catch (err) {
                        reject(new Error(`Invalid token response: ${data}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(params.toString());
            req.end();
        });
    }
    
    /**
     * Add secret to GitHub repository
     */
    async addToGitHubSecrets(tokenName, tokenValue) {
        try {
            // Check if gh CLI is available
            execSync('gh --version', { stdio: 'ignore' });
            
            // Get repository info
            const repoInfo = execSync('gh repo view --json nameWithOwner', { encoding: 'utf8' });
            const { nameWithOwner } = JSON.parse(repoInfo);
            
            console.log(`\n🔐 Adding ${tokenName} to GitHub secrets for ${nameWithOwner}...`);
            
            // Add secret using gh CLI (value is piped, not saved)
            execSync(`echo "${tokenValue}" | gh secret set ${tokenName} --repo ${nameWithOwner}`, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            console.log(`✅ Successfully added ${tokenName} to GitHub secrets!`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to add secret: ${error.message}`);
            console.log(`\n📋 Manual steps to add the secret:`);
            console.log(`1. Go to: https://github.com/${nameWithOwner}/settings/secrets/actions`);
            console.log(`2. Click "New repository secret"`);
            console.log(`3. Name: ${tokenName}`);
            console.log(`4. Value: [Token displayed above]`);
            return false;
        }
    }
    
    /**
     * Main setup flow
     */
    async setup() {
        console.log('🔐 Claude Max OAuth Setup');
        console.log('========================\n');
        
        console.log('This script will:');
        console.log('1. Open Claude.ai in your browser for authorization');
        console.log('2. Capture the OAuth tokens securely');
        console.log('3. Add them to GitHub secrets automatically');
        console.log('4. Never store tokens in your codebase\n');
        
        const answer = await this.prompt('Ready to proceed? (y/n): ');
        if (answer.toLowerCase() !== 'y') {
            console.log('Setup cancelled.');
            process.exit(0);
        }
        
        try {
            // Generate PKCE parameters
            const { codeVerifier, codeChallenge } = this.generatePKCE();
            const state = crypto.randomBytes(16).toString('base64url');
            
            // Build authorization URL
            const authParams = new URLSearchParams({
                response_type: 'code',
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                scope: this.scope,
                state: state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256'
            });
            
            const authorizationUrl = `${this.authUrl}?${authParams}`;
            
            console.log('\n🌐 Starting local callback server...');
            
            // Start callback server and wait for OAuth callback
            const tokenPromise = this.startCallbackServer(codeVerifier);
            
            console.log('\n🔗 Opening authorization URL in your browser...');
            console.log('If the browser doesn\'t open, visit this URL manually:');
            console.log(`\n${authorizationUrl}\n`);
            
            // Try to open browser
            try {
                const openCmd = process.platform === 'darwin' ? 'open' : 
                               process.platform === 'win32' ? 'start' : 'xdg-open';
                execSync(`${openCmd} "${authorizationUrl}"`);
            } catch (e) {
                console.log('⚠️  Could not open browser automatically');
            }
            
            console.log('⏳ Waiting for authorization...');
            const tokens = await tokenPromise;
            
            console.log('\n✅ OAuth tokens received successfully!');
            console.log(`   Access Token: ${tokens.access_token.substring(0, 20)}...`);
            if (tokens.refresh_token) {
                console.log(`   Refresh Token: ${tokens.refresh_token.substring(0, 20)}...`);
            }
            
            // Ask about tier
            const tier = await this.prompt('\nWhich Claude Max tier do you have? (5x/20x) [default: 5x]: ');
            const subscriptionTier = tier === '20x' ? 'max_20x' : 'max_5x';
            
            // Add to GitHub secrets
            console.log('\n📤 Adding tokens to GitHub secrets...');
            
            const accessAdded = await this.addToGitHubSecrets('CLAUDE_OAUTH_TOKEN', tokens.access_token);
            
            if (tokens.refresh_token) {
                await this.addToGitHubSecrets('CLAUDE_OAUTH_REFRESH_TOKEN', tokens.refresh_token);
            }
            
            await this.addToGitHubSecrets('CLAUDE_SUBSCRIPTION_TIER', subscriptionTier);
            
            if (accessAdded) {
                console.log('\n🎉 Setup complete! Your workflow can now use Claude Max OAuth.');
                console.log('\n📝 Next steps:');
                console.log('1. Push your changes to trigger a workflow run');
                console.log('2. Monitor the workflow to ensure OAuth is working');
                console.log('3. Check usage tracking to confirm cost savings');
            }
            
        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }
    
    /**
     * Prompt helper
     */
    prompt(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }
}

// Run setup
if (require.main === module) {
    const setup = new ClaudeOAuthSetup();
    setup.setup().catch(console.error);
}

module.exports = ClaudeOAuthSetup;