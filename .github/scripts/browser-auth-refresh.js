#!/usr/bin/env node

/**
 * Browser Authentication Token Refresh System
 * 
 * Automatically detects expired Claude.ai session cookies and provides
 * multiple refresh strategies for seamless authentication renewal.
 * 
 * Features:
 * - Automatic expiration detection
 * - Headless browser session renewal
 * - GitHub secrets synchronization
 * - Health monitoring with alerts
 * - Multiple refresh strategies
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BrowserAuthRefresh {
    constructor(options = {}) {
        this.config = {
            healthCheckInterval: options.healthCheckInterval || 300000, // 5 minutes
            expirationWarningDays: options.expirationWarningDays || 7,
            maxRetries: options.maxRetries || 3,
            headless: options.headless !== false,
            ...options
        };

        this.authState = {
            lastCheck: null,
            lastRefresh: null,
            refreshCount: 0,
            errors: [],
            isHealthy: false,
            nextCheck: null
        };

        this.requiredCookies = [
            'CLAUDE_SESSION_KEY',
            'CLAUDE_ORG_ID', 
            'CLAUDE_USER_ID'
        ];

        this.envPath = path.join(__dirname, '.env');
        this.statePath = path.join(__dirname, 'data', 'browser-auth-state.json');
    }

    /**
     * Initialize the refresh system
     */
    async initialize() {
        console.log('🔄 Initializing Browser Auth Refresh System...');
        
        // Ensure data directory exists
        await this.ensureDataDirectory();
        
        // Load previous state
        await this.loadState();
        
        // Initial health check
        await this.performHealthCheck();
        
        console.log('✅ Browser Auth Refresh System initialized');
    }

    /**
     * Ensure data directory exists
     */
    async ensureDataDirectory() {
        const dataDir = path.dirname(this.statePath);
        try {
            await fs.access(dataDir);
        } catch (error) {
            await fs.mkdir(dataDir, { recursive: true });
        }
    }

    /**
     * Load previous state
     */
    async loadState() {
        try {
            const stateContent = await fs.readFile(this.statePath, 'utf8');
            this.authState = { ...this.authState, ...JSON.parse(stateContent) };
        } catch (error) {
            // No previous state, start fresh
            await this.saveState();
        }
    }

    /**
     * Save current state
     */
    async saveState() {
        await fs.writeFile(this.statePath, JSON.stringify(this.authState, null, 2));
    }

    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        console.log('🏥 Performing authentication health check...');
        this.authState.lastCheck = new Date().toISOString();
        
        try {
            const results = await Promise.all([
                this.checkCookieValidity(),
                this.checkSessionHealth(),
                this.checkGitHubSecrets(),
                this.testBrowserClient()
            ]);

            const [cookiesValid, sessionHealthy, secretsConfigured, clientWorking] = results;
            
            this.authState.isHealthy = cookiesValid && sessionHealthy && clientWorking;
            
            // Calculate next check time
            this.authState.nextCheck = new Date(Date.now() + this.config.healthCheckInterval).toISOString();
            
            await this.saveState();
            
            if (!this.authState.isHealthy) {
                console.log('⚠️ Authentication health issues detected');
                await this.handleUnhealthyAuth();
            } else {
                console.log('✅ Authentication health check passed');
            }
            
            return this.authState.isHealthy;
            
        } catch (error) {
            this.authState.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message,
                type: 'health_check'
            });
            
            console.error('❌ Health check failed:', error.message);
            await this.saveState();
            return false;
        }
    }

    /**
     * Check cookie validity and expiration
     */
    async checkCookieValidity() {
        try {
            // Check environment variables
            const envCookies = this.getEnvironmentCookies();
            if (!envCookies.valid) {
                return false;
            }

            // Validate session key format
            const sessionKey = process.env.CLAUDE_SESSION_KEY;
            if (!sessionKey || !sessionKey.startsWith('sk-ant-sid01-')) {
                console.log('⚠️ Invalid session key format');
                return false;
            }

            // Extract timestamp from session key if possible
            try {
                // Session keys contain encoded timestamp information
                const keyPart = sessionKey.split('-')[3] || '';
                if (keyPart.length > 10) {
                    // This is a rough heuristic - actual key parsing would require Claude's internal format
                    const possibleTimestamp = parseInt(keyPart.substring(0, 10));
                    if (possibleTimestamp > 1000000000) {
                        const keyDate = new Date(possibleTimestamp * 1000);
                        const daysSinceKey = (Date.now() - keyDate.getTime()) / (1000 * 60 * 60 * 24);
                        
                        if (daysSinceKey > 30) {
                            console.log(`⚠️ Session key is ${Math.round(daysSinceKey)} days old`);
                            return false;
                        }
                    }
                }
            } catch (error) {
                // Ignore key parsing errors, continue with other checks
            }

            return true;
        } catch (error) {
            console.error('❌ Cookie validity check failed:', error.message);
            return false;
        }
    }

    /**
     * Get environment cookies with validation
     */
    getEnvironmentCookies() {
        const cookies = {};
        let valid = true;

        for (const cookieName of this.requiredCookies) {
            const value = process.env[cookieName];
            if (!value || value.includes('your-') || value.includes('NOT_FOUND')) {
                valid = false;
            } else {
                cookies[cookieName] = value;
            }
        }

        return { cookies, valid };
    }

    /**
     * Test session health with actual API call
     */
    async checkSessionHealth() {
        try {
            const { ClaudeBrowserClient } = await import('./claude-browser-client.js');
            const client = new ClaudeBrowserClient({ headless: true, timeout: 10000 });
            
            await client.initialize();
            
            // Quick test message
            const response = await client.sendMessage('Hi', { max_tokens: 10 });
            await client.close();
            
            return response && response.content && response.content.length > 0;
        } catch (error) {
            console.log('⚠️ Session health check failed:', error.message);
            return false;
        }
    }

    /**
     * Check GitHub secrets configuration
     */
    async checkGitHubSecrets() {
        try {
            const result = execSync('gh secret list', { encoding: 'utf8', stdio: 'pipe' });
            const secrets = result.split('\n').map(line => line.split('\t')[0]);
            
            return this.requiredCookies.every(cookie => secrets.includes(cookie));
        } catch (error) {
            return false;
        }
    }

    /**
     * Test browser client functionality
     */
    async testBrowserClient() {
        try {
            const { ClaudeBrowserAuthManager } = await import('./claude-browser-auth-manager.js');
            const authManager = new ClaudeBrowserAuthManager();
            
            await authManager.initialize();
            
            const result = await authManager.makeRequest([
                { role: 'user', content: 'Test message' }
            ], { max_tokens: 10, timeout: 15000 });
            
            await authManager.close();
            return result && result.content;
        } catch (error) {
            return false;
        }
    }

    /**
     * Handle unhealthy authentication state
     */
    async handleUnhealthyAuth() {
        console.log('🔧 Handling unhealthy authentication...');
        
        // Try different refresh strategies
        const strategies = [
            this.refreshViaHeadlessBrowser.bind(this),
            this.refreshViaManualInstructions.bind(this),
            this.refreshViaGitHubSecrets.bind(this)
        ];

        for (const [index, strategy] of strategies.entries()) {
            try {
                console.log(`🔄 Attempting refresh strategy ${index + 1}/${strategies.length}...`);
                const success = await strategy();
                
                if (success) {
                    this.authState.lastRefresh = new Date().toISOString();
                    this.authState.refreshCount++;
                    await this.saveState();
                    
                    console.log('✅ Authentication refreshed successfully');
                    return true;
                }
            } catch (error) {
                console.log(`❌ Refresh strategy ${index + 1} failed:`, error.message);
                this.authState.errors.push({
                    timestamp: new Date().toISOString(),
                    error: error.message,
                    type: `refresh_strategy_${index + 1}`
                });
            }
        }

        console.log('❌ All refresh strategies failed');
        await this.notifyAuthFailure();
        return false;
    }

    /**
     * Refresh via headless browser automation
     */
    async refreshViaHeadlessBrowser() {
        console.log('🤖 Attempting headless browser refresh...');
        
        try {
            const puppeteer = await import('puppeteer');
            
            const browser = await puppeteer.default.launch({
                headless: this.config.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Navigate to Claude.ai
            await page.goto('https://claude.ai', { waitUntil: 'networkidle2' });
            
            // Check if already logged in or needs login
            try {
                await page.waitForSelector('.chat-input', { timeout: 5000 });
                console.log('✅ Already logged in, extracting fresh cookies...');
                
                // Extract fresh cookies
                const cookies = await page.cookies();
                const claudeCookies = this.extractClaudeCookies(cookies);
                
                if (claudeCookies.valid) {
                    await this.updateEnvironmentCookies(claudeCookies.cookies);
                    await this.updateGitHubSecrets(claudeCookies.cookies);
                    
                    await browser.close();
                    return true;
                }
            } catch (error) {
                console.log('ℹ️ Not logged in, manual intervention required');
            }
            
            await browser.close();
            return false;
            
        } catch (error) {
            throw new Error(`Headless browser refresh failed: ${error.message}`);
        }
    }

    /**
     * Extract Claude-specific cookies from browser cookies
     */
    extractClaudeCookies(cookies) {
        const cookieMap = {};
        let valid = true;

        const mappings = {
            'sessionKey': 'CLAUDE_SESSION_KEY',
            'lastActiveOrg': 'CLAUDE_ORG_ID',
            'ajs_user_id': 'CLAUDE_USER_ID'
        };

        for (const cookie of cookies) {
            if (mappings[cookie.name]) {
                cookieMap[mappings[cookie.name]] = cookie.value;
            }
        }

        // Validate we got all required cookies
        for (const required of this.requiredCookies) {
            if (!cookieMap[required] || cookieMap[required].includes('NOT_FOUND')) {
                valid = false;
                break;
            }
        }

        return { cookies: cookieMap, valid };
    }

    /**
     * Update environment cookies
     */
    async updateEnvironmentCookies(cookies) {
        try {
            let envContent = '';
            
            // Try to read existing .env
            try {
                envContent = await fs.readFile(this.envPath, 'utf8');
            } catch (error) {
                // Create new .env
                envContent = '# Claude.ai Session Cookies (Auto-refreshed)\n';
            }

            // Update or add cookie values
            for (const [key, value] of Object.entries(cookies)) {
                const pattern = new RegExp(`^${key}=.*$`, 'm');
                const newLine = `${key}=${value}`;
                
                if (pattern.test(envContent)) {
                    envContent = envContent.replace(pattern, newLine);
                } else {
                    envContent += `\n${newLine}`;
                }
            }

            await fs.writeFile(this.envPath, envContent);
            console.log('✅ Environment cookies updated');
            
        } catch (error) {
            throw new Error(`Failed to update environment cookies: ${error.message}`);
        }
    }

    /**
     * Update GitHub secrets
     */
    async updateGitHubSecrets(cookies) {
        try {
            for (const [key, value] of Object.entries(cookies)) {
                execSync(`gh secret set ${key} --body "${value}"`, { stdio: 'pipe' });
            }
            console.log('✅ GitHub secrets updated');
        } catch (error) {
            console.log('⚠️ Could not update GitHub secrets:', error.message);
        }
    }

    /**
     * Refresh via manual instructions
     */
    async refreshViaManualInstructions() {
        console.log('📋 Manual refresh instructions required...');
        
        const instructions = `
🔄 **MANUAL COOKIE REFRESH REQUIRED**

Your Claude.ai session cookies have expired. Please refresh them manually:

1. **Open Claude.ai in your browser**
   → https://claude.ai
   → Make sure you're logged in

2. **Extract fresh cookies using browser console:**
   → Press F12 (Developer Tools)
   → Go to Console tab
   → Paste and run this code:

   \`\`\`javascript
   const cookies = document.cookie.split(';').reduce((acc, cookie) => {
     const [name, value] = cookie.trim().split('=');
     if (['sessionKey', 'lastActiveOrg', 'ajs_user_id'].includes(name)) {
       acc[name] = value;
     }
     return acc;
   }, {});
   
   console.log('🍪 COPY THESE VALUES:');
   console.log('CLAUDE_SESSION_KEY=' + (cookies.sessionKey || 'NOT_FOUND'));
   console.log('CLAUDE_ORG_ID=' + (cookies.lastActiveOrg || 'NOT_FOUND'));
   console.log('CLAUDE_USER_ID=' + (cookies.ajs_user_id || 'NOT_FOUND'));
   \`\`\`

3. **Update your .env file** with the new values
4. **Run:** node browser-auth-refresh.js test
5. **Update GitHub secrets:** node setup-claude-cookies.js

⏰ **Next check:** ${this.authState.nextCheck}
`;

        console.log(instructions);
        
        // Create instruction file for reference
        await fs.writeFile(
            path.join(__dirname, 'data', 'manual-refresh-instructions.md'),
            instructions
        );

        return false; // Manual intervention required
    }

    /**
     * Refresh via GitHub secrets (if available)
     */
    async refreshViaGitHubSecrets() {
        console.log('🔄 Attempting GitHub secrets refresh...');
        
        // This is mainly for workflow environments where secrets are available
        // but local environment needs updating
        
        const hasGitHubSecrets = await this.checkGitHubSecrets();
        if (!hasGitHubSecrets) {
            return false;
        }

        console.log('ℹ️ GitHub secrets are available but cannot be read directly');
        console.log('💡 Secrets will be used automatically in GitHub Actions workflows');
        
        return false; // Cannot directly read GitHub secrets
    }

    /**
     * Notify of authentication failure
     */
    async notifyAuthFailure() {
        const alertData = {
            timestamp: new Date().toISOString(),
            type: 'authentication_failure',
            severity: 'high',
            message: 'Browser authentication refresh failed',
            details: {
                lastSuccessfulRefresh: this.authState.lastRefresh,
                consecutiveFailures: this.authState.errors.length,
                nextCheck: this.authState.nextCheck
            },
            recommendedActions: [
                'Extract fresh cookies from claude.ai manually',
                'Update .env file with new cookie values',
                'Run browser-auth-refresh.js test to verify',
                'Update GitHub secrets if needed'
            ]
        };

        await fs.writeFile(
            path.join(__dirname, 'data', 'auth-failure-alert.json'),
            JSON.stringify(alertData, null, 2)
        );

        console.log('🚨 Authentication failure alert created');
    }

    /**
     * Start continuous monitoring
     */
    async startMonitoring() {
        console.log('📡 Starting continuous authentication monitoring...');
        
        const monitor = setInterval(async () => {
            try {
                await this.performHealthCheck();
                
                if (!this.authState.isHealthy) {
                    console.log('⚠️ Unhealthy authentication detected, attempting refresh...');
                    await this.handleUnhealthyAuth();
                }
            } catch (error) {
                console.error('❌ Monitoring error:', error.message);
            }
        }, this.config.healthCheckInterval);

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping authentication monitoring...');
            clearInterval(monitor);
            process.exit(0);
        });

        console.log(`✅ Monitoring started (checking every ${this.config.healthCheckInterval/1000}s)`);
    }

    /**
     * Generate status report
     */
    generateStatusReport() {
        const report = {
            timestamp: new Date().toISOString(),
            isHealthy: this.authState.isHealthy,
            lastCheck: this.authState.lastCheck,
            lastRefresh: this.authState.lastRefresh,
            refreshCount: this.authState.refreshCount,
            nextCheck: this.authState.nextCheck,
            recentErrors: this.authState.errors.slice(-5),
            configuration: {
                healthCheckInterval: `${this.config.healthCheckInterval/1000}s`,
                expirationWarningDays: this.config.expirationWarningDays,
                headless: this.config.headless
            }
        };

        console.log('📊 **BROWSER AUTH REFRESH STATUS REPORT**');
        console.log(`🏥 Health Status: ${report.isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        console.log(`🕐 Last Check: ${report.lastCheck || 'Never'}`);
        console.log(`🔄 Last Refresh: ${report.lastRefresh || 'Never'}`);
        console.log(`📈 Refresh Count: ${report.refreshCount}`);
        console.log(`⏰ Next Check: ${report.nextCheck || 'Not scheduled'}`);
        console.log(`⚠️ Recent Errors: ${report.recentErrors.length}`);

        return report;
    }
}

/**
 * CLI Interface
 */
async function main() {
    const command = process.argv[2];
    const refreshSystem = new BrowserAuthRefresh();

    try {
        switch (command) {
            case 'health':
                await refreshSystem.initialize();
                const isHealthy = await refreshSystem.performHealthCheck();
                console.log(`\n🏥 Authentication Health: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
                break;

            case 'refresh':
                await refreshSystem.initialize();
                const success = await refreshSystem.handleUnhealthyAuth();
                console.log(`\n🔄 Refresh Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
                break;

            case 'monitor':
                await refreshSystem.initialize();
                await refreshSystem.startMonitoring();
                break;

            case 'status':
                await refreshSystem.initialize();
                refreshSystem.generateStatusReport();
                break;

            case 'test':
                await refreshSystem.initialize();
                const testResult = await refreshSystem.performHealthCheck();
                console.log(`\n🧪 Test Result: ${testResult ? '✅ PASSED' : '❌ FAILED'}`);
                break;

            default:
                console.log(`
🔄 **BROWSER AUTHENTICATION REFRESH SYSTEM**

Commands:
  health    - Perform authentication health check
  refresh   - Force authentication refresh
  monitor   - Start continuous monitoring
  status    - Show detailed status report  
  test      - Test current authentication

Features:
  ✅ Automatic session expiration detection
  ✅ Multiple refresh strategies (headless browser, manual, GitHub secrets)
  ✅ Health monitoring with configurable intervals
  ✅ GitHub secrets synchronization
  ✅ Comprehensive error handling and alerts

Configuration:
  Health Check Interval: ${refreshSystem.config.healthCheckInterval/1000}s
  Expiration Warning: ${refreshSystem.config.expirationWarningDays} days
  Headless Mode: ${refreshSystem.config.headless}
                `);
                break;
        }
    } catch (error) {
        console.error('❌ Command failed:', error.message);
        process.exit(1);
    }
}

export { BrowserAuthRefresh };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch(console.error);
}