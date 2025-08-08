#!/usr/bin/env node

/**
 * Authentication System Health Check
 * 
 * Quick verification of authentication system components
 * for CV enhancement pipeline
 */

import fs from 'fs';
import path from 'path';

class AuthSystemHealthCheck {
    constructor() {
        this.results = {
            browserAuth: { status: 'unknown', details: [] },
            oauthAuth: { status: 'unknown', details: [] },
            apiKeyAuth: { status: 'unknown', details: [] },
            secrets: { status: 'unknown', details: [] },
            esModules: { status: 'unknown', details: [] }
        };
    }

    async runHealthCheck() {
        console.log('🏥 **AUTHENTICATION SYSTEM HEALTH CHECK**');
        console.log('=========================================');
        
        await this.checkBrowserAuth();
        await this.checkOAuthAuth();
        await this.checkAPIKeyAuth();
        await this.checkSecrets();
        await this.checkESModules();
        
        this.generateReport();
        return this.getOverallHealth();
    }

    async checkBrowserAuth() {
        console.log('\n🍪 Checking Browser Authentication...');
        
        try {
            // Check for browser credentials
            const hasSessionKey = !!(process.env.CLAUDE_SESSION_KEY);
            const hasOrgId = !!(process.env.CLAUDE_ORG_ID);
            const hasUserId = !!(process.env.CLAUDE_USER_ID);
            
            if (hasSessionKey && hasOrgId) {
                this.results.browserAuth.status = 'healthy';
                this.results.browserAuth.details.push('✅ Browser credentials available');
                console.log('   ✅ Browser credentials configured');
            } else {
                this.results.browserAuth.status = 'degraded';
                this.results.browserAuth.details.push('⚠️ Browser credentials incomplete');
                console.log('   ⚠️ Browser credentials missing or incomplete');
            }
            
            // Check browser client file
            const browserClientExists = fs.existsSync('./claude-browser-client.js');
            if (browserClientExists) {
                this.results.browserAuth.details.push('✅ Browser client file exists');
            } else {
                this.results.browserAuth.details.push('❌ Browser client file missing');
            }
            
        } catch (error) {
            this.results.browserAuth.status = 'failed';
            this.results.browserAuth.details.push(`❌ Error: ${error.message}`);
            console.log(`   ❌ Error: ${error.message}`);
        }
    }

    async checkOAuthAuth() {
        console.log('\n🔐 Checking OAuth Authentication...');
        
        try {
            const oauthClientExists = fs.existsSync('./claude-oauth-client.js');
            if (oauthClientExists) {
                this.results.oauthAuth.status = 'healthy';
                this.results.oauthAuth.details.push('✅ OAuth client available');
                console.log('   ✅ OAuth client file exists');
            } else {
                this.results.oauthAuth.status = 'failed';
                this.results.oauthAuth.details.push('❌ OAuth client missing');
                console.log('   ❌ OAuth client file missing');
            }
            
            const hasOAuthToken = !!(process.env.CLAUDE_OAUTH_TOKEN);
            if (hasOAuthToken) {
                this.results.oauthAuth.details.push('✅ OAuth token configured');
            } else {
                this.results.oauthAuth.details.push('⚠️ OAuth token not configured');
            }
            
        } catch (error) {
            this.results.oauthAuth.status = 'failed';
            this.results.oauthAuth.details.push(`❌ Error: ${error.message}`);
        }
    }

    async checkAPIKeyAuth() {
        console.log('\n🔑 Checking API Key Authentication...');
        
        try {
            const hasAPIKey = !!(process.env.ANTHROPIC_API_KEY);
            if (hasAPIKey) {
                this.results.apiKeyAuth.status = 'healthy';
                this.results.apiKeyAuth.details.push('✅ API key configured');
                console.log('   ✅ API key available as fallback');
            } else {
                this.results.apiKeyAuth.status = 'degraded';
                this.results.apiKeyAuth.details.push('⚠️ API key not configured');
                console.log('   ⚠️ API key not configured');
            }
            
        } catch (error) {
            this.results.apiKeyAuth.status = 'failed';
            this.results.apiKeyAuth.details.push(`❌ Error: ${error.message}`);
        }
    }

    async checkSecrets() {
        console.log('\n🤫 Checking Required Secrets...');
        
        const requiredSecrets = [
            'GITHUB_TOKEN',
            'CLAUDE_SESSION_KEY',
            'CLAUDE_ORG_ID',
            'ANTHROPIC_API_KEY'
        ];
        
        const optionalSecrets = [
            'CLAUDE_USER_ID',
            'CLAUDE_OAUTH_TOKEN',
            'LINKEDIN_SESSION_COOKIES',
            'LINKEDIN_USER_CONSENT',
            'GEMINI_API_KEY'
        ];
        
        let requiredCount = 0;
        let optionalCount = 0;
        
        for (const secret of requiredSecrets) {
            if (process.env[secret]) {
                requiredCount++;
                this.results.secrets.details.push(`✅ ${secret}`);
            } else {
                this.results.secrets.details.push(`❌ ${secret} (required)`);
            }
        }
        
        for (const secret of optionalSecrets) {
            if (process.env[secret]) {
                optionalCount++;
                this.results.secrets.details.push(`✅ ${secret} (optional)`);
            }
        }
        
        if (requiredCount === requiredSecrets.length) {
            this.results.secrets.status = 'healthy';
            console.log(`   ✅ ${requiredCount}/${requiredSecrets.length} required secrets configured`);
        } else {
            this.results.secrets.status = 'degraded';
            console.log(`   ⚠️ ${requiredCount}/${requiredSecrets.length} required secrets configured`);
        }
        
        console.log(`   📊 ${optionalCount}/${optionalSecrets.length} optional secrets configured`);
    }

    async checkESModules() {
        console.log('\n📦 Checking ES Module Compatibility...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            if (packageJson.type === 'module') {
                this.results.esModules.status = 'healthy';
                this.results.esModules.details.push('✅ Package configured as ES module');
                console.log('   ✅ Package.json configured for ES modules');
            } else {
                this.results.esModules.status = 'degraded';
                this.results.esModules.details.push('⚠️ Package not configured as ES module');
            }
            
            // Check key files for ES module syntax
            const keyFiles = [
                'claude-browser-client.js',
                'claude-oauth-client.js',
                'enhancer-modules/browser-first-client.js'
            ];
            
            for (const file of keyFiles) {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    const hasESImports = content.includes('import ') && content.includes('export ');
                    const hasCommonJS = content.includes('require(') || content.includes('module.exports');
                    
                    if (hasESImports && !hasCommonJS) {
                        this.results.esModules.details.push(`✅ ${file} - ES modules`);
                    } else if (hasCommonJS) {
                        this.results.esModules.details.push(`⚠️ ${file} - CommonJS detected`);
                        this.results.esModules.status = 'degraded';
                    }
                } else {
                    this.results.esModules.details.push(`❌ ${file} - missing`);
                }
            }
            
        } catch (error) {
            this.results.esModules.status = 'failed';
            this.results.esModules.details.push(`❌ Error: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 **HEALTH CHECK SUMMARY**');
        console.log('===========================');
        
        Object.entries(this.results).forEach(([component, result]) => {
            const statusEmoji = {
                'healthy': '✅',
                'degraded': '⚠️',
                'failed': '❌',
                'unknown': '❓'
            }[result.status] || '❓';
            
            console.log(`\n${statusEmoji} ${component.toUpperCase()}: ${result.status.toUpperCase()}`);
            result.details.forEach(detail => console.log(`   ${detail}`));
        });
    }

    getOverallHealth() {
        const statusCounts = {};
        Object.values(this.results).forEach(result => {
            statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
        });
        
        if (statusCounts.failed > 0) {
            return { status: 'critical', message: 'Critical authentication system failures detected' };
        } else if (statusCounts.degraded > 2) {
            return { status: 'degraded', message: 'Multiple authentication issues need attention' };
        } else if (statusCounts.healthy >= 3) {
            return { status: 'healthy', message: 'Authentication system operational' };
        } else {
            return { status: 'warning', message: 'Authentication system needs configuration' };
        }
    }
}

async function main() {
    const healthCheck = new AuthSystemHealthCheck();
    const result = await healthCheck.runHealthCheck();
    
    console.log('\n🎯 **OVERALL STATUS**');
    console.log('===================');
    const statusEmoji = {
        'healthy': '✅',
        'warning': '⚠️',
        'degraded': '⚠️',
        'critical': '❌'
    }[result.status] || '❓';
    
    console.log(`${statusEmoji} ${result.status.toUpperCase()}: ${result.message}`);
    
    if (result.status === 'healthy') {
        console.log('\n🚀 Authentication system is ready for CI/CD deployment!');
    } else {
        console.log('\n🔧 Recommendations:');
        console.log('   1. Configure missing environment variables');
        console.log('   2. Update any CommonJS files to ES modules');
        console.log('   3. Test browser authentication manually');
        console.log('   4. Ensure API key fallback is configured');
    }
    
    return result.status === 'healthy' ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .then(exitCode => process.exit(exitCode))
        .catch(error => {
            console.error('❌ Health check failed:', error);
            process.exit(1);
        });
}

export { AuthSystemHealthCheck };