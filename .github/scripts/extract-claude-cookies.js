#!/usr/bin/env node

/**
 * Extract Claude.ai Cookies Helper
 * 
 * This script helps you extract and configure Claude.ai session cookies
 * for both local development and GitHub Actions.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ClaudeCookieExtractor {
    constructor() {
        this.envPath = path.join(__dirname, '.env');
        this.requiredCookies = [
            'CLAUDE_SESSION_KEY',
            'CLAUDE_ORG_ID', 
            'CLAUDE_USER_ID'
        ];
    }

    /**
     * Check if GitHub secrets are available
     */
    async checkGitHubSecrets() {
        try {
            const result = execSync('gh secret list', { encoding: 'utf8' });
            const secrets = result.split('\n').map(line => line.split('\t')[0]);
            
            const claudeSecrets = secrets.filter(secret => 
                secret.startsWith('CLAUDE_') && secret !== 'CLAUDE_COOKIES_JSON'
            );
            
            console.log('🔐 Found GitHub secrets:', claudeSecrets);
            return claudeSecrets.length >= 3;
        } catch (error) {
            console.log('⚠️ GitHub CLI not available or not authenticated');
            return false;
        }
    }

    /**
     * Extract cookies from GitHub secrets for local use
     */
    async extractFromGitHubSecrets() {
        console.log('🔄 Attempting to extract cookies from GitHub secrets...');
        
        try {
            // This won't work directly since secrets are encrypted,
            // but we can check if they exist
            await this.checkGitHubSecrets();
            console.log('✅ GitHub secrets are configured');
            console.log('💡 For local testing, you need to extract cookies manually from claude.ai');
            return false;
        } catch (error) {
            console.log('❌ Cannot extract from GitHub secrets:', error.message);
            return false;
        }
    }

    /**
     * Display cookie extraction instructions
     */
    displayExtractionInstructions() {
        console.log(`
🍪 **COOKIE EXTRACTION INSTRUCTIONS**

1. **Open Claude.ai in your browser**
   - Go to https://claude.ai
   - Make sure you're logged in

2. **Open Developer Tools**
   - Press F12 or Ctrl+Shift+I (Windows/Linux)
   - Press Cmd+Option+I (Mac)

3. **Navigate to Cookies**
   - Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
   - Click "Cookies" → "https://claude.ai"

4. **Copy these cookie values:**
   - sessionKey (starts with 'sk-ant-sid01-')
   - lastActiveOrg (UUID format)
   - ajs_user_id (UUID format)

5. **Alternative: Use Browser Console**
   Run this in the browser console on claude.ai:

   \`\`\`javascript
   // Copy this code and run it in browser console on claude.ai
   const cookies = document.cookie.split(';').reduce((acc, cookie) => {
     const [name, value] = cookie.trim().split('=');
     if (['sessionKey', 'lastActiveOrg', 'ajs_user_id'].includes(name)) {
       acc[name] = value;
     }
     return acc;
   }, {});
   
   console.log('🍪 Copy these values to your .env file:');
   console.log('CLAUDE_SESSION_KEY=' + (cookies.sessionKey || 'NOT_FOUND'));
   console.log('CLAUDE_ORG_ID=' + (cookies.lastActiveOrg || 'NOT_FOUND'));
   console.log('CLAUDE_USER_ID=' + (cookies.ajs_user_id || 'NOT_FOUND'));
   \`\`\`
        `);
    }

    /**
     * Check current environment configuration
     */
    async checkEnvironmentConfig() {
        try {
            const envExists = await fs.access(this.envPath).then(() => true).catch(() => false);
            
            if (!envExists) {
                console.log('⚠️ No .env file found');
                return false;
            }

            const envContent = await fs.readFile(this.envPath, 'utf8');
            const hasClaudeCookies = this.requiredCookies.some(cookie => 
                envContent.includes(cookie) && 
                !envContent.includes(`${cookie}=your-`) &&
                !envContent.includes(`${cookie}=NOT_FOUND`)
            );

            if (hasClaudeCookies) {
                console.log('✅ Claude cookies found in .env file');
                return true;
            } else {
                console.log('⚠️ .env file exists but missing Claude cookies');
                return false;
            }
        } catch (error) {
            console.log('❌ Error checking environment:', error.message);
            return false;
        }
    }

    /**
     * Create template .env file
     */
    async createEnvTemplate() {
        const template = `# Claude.ai Session Authentication
# Extract these values from claude.ai cookies

# Required cookies (get from browser developer tools)
CLAUDE_SESSION_KEY=your-session-key-here
CLAUDE_ORG_ID=your-org-id-here  
CLAUDE_USER_ID=your-user-id-here

# Optional: Cloudflare cookies (improves reliability)
CLAUDE_CF_BM=your-cf-bm-cookie-here

# GitHub token for local testing
GITHUB_TOKEN=ghp_dummy_token

# API key fallback
ANTHROPIC_API_KEY=your-api-key-here
`;

        try {
            await fs.writeFile(this.envPath, template);
            console.log('✅ Created .env template file');
            console.log('📝 Edit .env and add your actual cookie values');
        } catch (error) {
            console.log('❌ Error creating .env template:', error.message);
        }
    }

    /**
     * Test authentication with current configuration
     */
    async testAuthentication() {
        console.log('🧪 Testing authentication...');
        
        try {
            // Load environment variables from .env
            const envContent = await fs.readFile(this.envPath, 'utf8');
            const envVars = {};
            
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0 && !line.trim().startsWith('#')) {
                    const value = valueParts.join('=').trim();
                    envVars[key.trim()] = value;
                }
            });

            // Check if we have required cookies
            const hasAllCookies = this.requiredCookies.every(cookie => 
                envVars[cookie] && 
                !envVars[cookie].includes('your-') &&
                !envVars[cookie].includes('NOT_FOUND')
            );

            if (!hasAllCookies) {
                console.log('⚠️ Missing required cookies in .env file');
                return false;
            }

            console.log('✅ All required cookies found in .env');
            
            // Test the browser client
            const { execSync } = require('child_process');
            try {
                execSync('node claude-browser-client.js test', { 
                    stdio: 'inherit',
                    env: { ...process.env, ...envVars }
                });
                console.log('✅ Browser authentication test passed!');
                return true;
            } catch (error) {
                console.log('❌ Browser authentication test failed');
                console.log('💡 Try running: node claude-browser-client.js test --visible');
                return false;
            }
        } catch (error) {
            console.log('❌ Test failed:', error.message);
            return false;
        }
    }

    /**
     * Main setup workflow
     */
    async run() {
        console.log('🚀 **CLAUDE COOKIE EXTRACTION & SETUP**\n');

        // Check current state
        const hasGitHubSecrets = await this.checkGitHubSecrets();
        const hasEnvConfig = await this.checkEnvironmentConfig();

        if (hasEnvConfig) {
            console.log('🎉 Environment already configured!');
            const testPassed = await this.testAuthentication();
            if (testPassed) {
                console.log('✅ Authentication is working perfectly!');
                return;
            }
        }

        if (hasGitHubSecrets && !hasEnvConfig) {
            console.log('✅ GitHub secrets configured, but local environment needs setup');
        }

        // Create template if needed
        if (!hasEnvConfig) {
            await this.createEnvTemplate();
        }

        // Display instructions
        this.displayExtractionInstructions();

        console.log(`
📋 **NEXT STEPS:**

1. Extract cookies using the instructions above
2. Edit .env file with your actual cookie values
3. Run: node extract-claude-cookies.js test
4. Once working locally, run: node setup-claude-cookies.js

💡 **For GitHub Actions:**
   - Cookies are already configured in repository secrets
   - Workflows will use browser_first authentication automatically
   - No additional setup needed for CI/CD

🔧 **Commands:**
   node extract-claude-cookies.js test    # Test current setup
   node claude-browser-client.js test     # Test browser client
   node setup-claude-cookies.js           # Update GitHub secrets
        `);
    }

    /**
     * Test command
     */
    async test() {
        console.log('🧪 **AUTHENTICATION TEST**\n');
        
        const hasEnvConfig = await this.checkEnvironmentConfig();
        if (!hasEnvConfig) {
            console.log('❌ No valid .env configuration found');
            console.log('💡 Run: node extract-claude-cookies.js');
            return;
        }

        await this.testAuthentication();
    }
}

// Command line interface
async function main() {
    const extractor = new ClaudeCookieExtractor();
    const command = process.argv[2];

    if (command === 'test') {
        await extractor.test();
    } else {
        await extractor.run();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ClaudeCookieExtractor;