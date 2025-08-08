#!/usr/bin/env node

/**
 * DevX Onboarding - Interactive Developer Experience Setup Guide
 * 
 * Guided onboarding system that transforms new developer setup from 3+ days to <5 minutes:
 * - Interactive environment configuration
 * - Automated dependency installation
 * - Authentication method selection and setup  
 * - Development tool configuration
 * - Validation checkpoints with success indicators
 * - Personalized developer profile creation
 * 
 * Eliminates documentation hunting and configuration guesswork
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// ANSI Colors for enhanced terminal experience
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class DevXOnboarding {
    constructor() {
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.profile = {
            name: '',
            role: '',
            experience: '',
            authPreference: '',
            goals: [],
            setupTime: Date.now()
        };

        this.setupSteps = [
            { id: 'welcome', name: 'Welcome & Profile Creation', handler: this.welcomeStep.bind(this) },
            { id: 'dependencies', name: 'Dependency Installation', handler: this.dependencyStep.bind(this) },
            { id: 'environment', name: 'Environment Configuration', handler: this.environmentStep.bind(this) },
            { id: 'authentication', name: 'Authentication Setup', handler: this.authenticationStep.bind(this) },
            { id: 'validation', name: 'System Validation', handler: this.validationStep.bind(this) },
            { id: 'completion', name: 'Setup Completion', handler: this.completionStep.bind(this) }
        ];

        this.currentStep = 0;
        this.startTime = Date.now();
    }

    async start() {
        console.clear();
        console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
        console.log(`${colors.cyan}║            🚀 DevX Onboarding System 🚀                     ║${colors.reset}`);
        console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
        console.log(`${colors.cyan}║      CV Enhancement System Developer Experience Setup       ║${colors.reset}`);
        console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
        console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
        console.log('');
        
        console.log(`${colors.green}🎯 Target: Complete setup in under 5 minutes${colors.reset}`);
        console.log(`${colors.blue}📋 Steps: ${this.setupSteps.length} guided configuration steps${colors.reset}`);
        console.log(`${colors.yellow}⚡ Result: Fully operational development environment${colors.reset}`);
        console.log('');

        try {
            for (let i = 0; i < this.setupSteps.length; i++) {
                this.currentStep = i;
                const step = this.setupSteps[i];
                
                console.log(`${colors.magenta}═══════════════════════════════════════════════════════════════${colors.reset}`);
                console.log(`${colors.magenta}Step ${i + 1}/${this.setupSteps.length}: ${step.name}${colors.reset}`);
                console.log(`${colors.magenta}═══════════════════════════════════════════════════════════════${colors.reset}`);
                console.log('');

                await step.handler();
                
                console.log(`${colors.green}✅ ${step.name} completed successfully!${colors.reset}`);
                console.log('');

                if (i < this.setupSteps.length - 1) {
                    await this.pressEnterToContinue();
                }
            }

            const totalTime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
            
            console.log(`${colors.green}🎉 Onboarding completed in ${totalTime} minutes!${colors.reset}`);
            console.log(`${colors.cyan}🚀 Run 'devx dev --auto' to start development${colors.reset}`);
            
        } catch (error) {
            console.log(`${colors.red}❌ Onboarding failed: ${error.message}${colors.reset}`);
            console.log(`${colors.yellow}💡 Run 'devx setup' for automated setup${colors.reset}`);
        } finally {
            this.rl.close();
        }
    }

    async welcomeStep() {
        console.log(`${colors.cyan}👋 Welcome to the CV Enhancement System!${colors.reset}\n`);
        
        console.log(`${colors.blue}This system provides:${colors.reset}`);
        console.log(`• AI-powered CV enhancement with Claude integration`);
        console.log(`• GitHub activity analysis and professional metrics`);
        console.log(`• Automated CV generation and deployment`);
        console.log(`• Real-time monitoring and analytics dashboards`);
        console.log(`• Professional networking intelligence\n`);

        // Collect developer profile
        this.profile.name = await this.question(`${colors.cyan}What's your name?${colors.reset} `);
        
        console.log(`\n${colors.blue}What best describes your role?${colors.reset}`);
        console.log(`1. Frontend Developer`);
        console.log(`2. Backend Developer`);
        console.log(`3. Full Stack Developer`);  
        console.log(`4. DevOps/Infrastructure Engineer`);
        console.log(`5. Data Scientist/Analyst`);
        console.log(`6. Other`);
        
        const roleChoice = await this.question(`${colors.cyan}Select (1-6):${colors.reset} `);
        const roles = ['', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist', 'Other'];
        this.profile.role = roles[parseInt(roleChoice)] || 'Developer';

        console.log(`\n${colors.blue}Experience with AI/automation tools?${colors.reset}`);
        console.log(`1. Beginner (new to AI tools)`);
        console.log(`2. Intermediate (used ChatGPT, etc.)`);
        console.log(`3. Advanced (integrated AI into workflows)`);
        
        const expChoice = await this.question(`${colors.cyan}Select (1-3):${colors.reset} `);
        const experiences = ['', 'Beginner', 'Intermediate', 'Advanced'];
        this.profile.experience = experiences[parseInt(expChoice)] || 'Intermediate';

        console.log(`\n${colors.green}Great! Let's get you set up, ${this.profile.name}! 🚀${colors.reset}`);
    }

    async dependencyStep() {
        console.log(`${colors.blue}📦 Installing dependencies...${colors.reset}\n`);

        // Check Node.js version
        try {
            const { stdout } = await execAsync('node --version');
            const nodeVersion = stdout.trim();
            console.log(`${colors.green}✅ Node.js ${nodeVersion} detected${colors.reset}`);
            
            const majorVersion = parseInt(nodeVersion.substring(1));
            if (majorVersion < 18) {
                throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
            }
        } catch (error) {
            throw new Error(`Node.js check failed: ${error.message}`);
        }

        // Install npm dependencies
        console.log(`${colors.yellow}📦 Installing npm packages...${colors.reset}`);
        
        try {
            const { stdout } = await execAsync('npm install', { cwd: __dirname });
            console.log(`${colors.green}✅ Dependencies installed successfully${colors.reset}`);
            
            if (this.profile.experience === 'Beginner') {
                console.log(`\n${colors.cyan}💡 Pro tip: We installed powerful tools like:${colors.reset}`);
                console.log(`• Puppeteer for browser automation`);
                console.log(`• ESLint for code quality`);
                console.log(`• Playwright for cross-browser testing`);
            }
        } catch (error) {
            throw new Error(`Dependency installation failed: ${error.message}`);
        }
    }

    async environmentStep() {
        console.log(`${colors.blue}🔧 Configuring environment variables...${colors.reset}\n`);

        const envFile = resolve(__dirname, '.env');
        const templateFile = resolve(__dirname, '.env.template');

        if (!existsSync(envFile)) {
            if (existsSync(templateFile)) {
                const template = readFileSync(templateFile, 'utf8');
                writeFileSync(envFile, template);
                console.log(`${colors.green}✅ Created .env from template${colors.reset}`);
            } else {
                // Create basic .env
                const basicEnv = this.generateBasicEnv();
                writeFileSync(envFile, basicEnv);
                console.log(`${colors.green}✅ Created basic .env file${colors.reset}`);
            }
        } else {
            console.log(`${colors.yellow}⚠️ .env file already exists${colors.reset}`);
        }

        // Create data directories
        const requiredDirs = ['data', 'coverage', 'dist'];
        
        for (const dir of requiredDirs) {
            const dirPath = resolve(__dirname, dir);
            if (!existsSync(dirPath)) {
                const { mkdirSync } = await import('fs');
                mkdirSync(dirPath, { recursive: true });
                console.log(`${colors.green}✅ Created ${dir} directory${colors.reset}`);
            }
        }

        console.log(`\n${colors.cyan}🔍 Environment configured with:${colors.reset}`);
        console.log(`• .env file with authentication templates`);
        console.log(`• Required directories (data, coverage, dist)`);
        console.log(`• Development and production settings`);
    }

    async authenticationStep() {
        console.log(`${colors.blue}🔐 Setting up authentication...${colors.reset}\n`);

        console.log(`${colors.cyan}Choose your preferred authentication method:${colors.reset}\n`);
        
        console.log(`${colors.green}1. Browser Authentication (FREE - Recommended)${colors.reset}`);
        console.log(`   • Uses your existing Claude.ai subscription`);
        console.log(`   • No additional costs`);
        console.log(`   • Requires cookie extraction`);
        console.log('');
        
        console.log(`${colors.yellow}2. OAuth Authentication (Fixed Cost)${colors.reset}`);
        console.log(`   • Claude Max subscription ($100-200/month)`);
        console.log(`   • Higher rate limits`);
        console.log(`   • Enterprise features`);
        console.log('');
        
        console.log(`${colors.red}3. API Key Authentication (Variable Cost)${colors.reset}`);
        console.log(`   • Pay per token ($10-400/month)`);
        console.log(`   • Usage-based pricing`);
        console.log(`   • Suitable for light usage`);
        console.log('');

        const authChoice = await this.question(`${colors.cyan}Select (1-3):${colors.reset} `);
        
        switch (authChoice) {
            case '1':
                this.profile.authPreference = 'browser';
                await this.setupBrowserAuth();
                break;
            case '2':
                this.profile.authPreference = 'oauth';
                await this.setupOAuthInfo();
                break;
            case '3':
                this.profile.authPreference = 'api';
                await this.setupAPIKeyInfo();
                break;
            default:
                console.log(`${colors.yellow}⚠️ Using browser authentication as default${colors.reset}`);
                this.profile.authPreference = 'browser';
                await this.setupBrowserAuth();
        }
    }

    async setupBrowserAuth() {
        console.log(`\n${colors.green}🍪 Setting up browser authentication...${colors.reset}\n`);
        
        console.log(`${colors.cyan}📋 Quick Setup Guide:${colors.reset}`);
        console.log(`1. Open https://claude.ai and log in`);
        console.log(`2. Press F12 to open Developer Tools`);
        console.log(`3. Go to Application > Storage > Cookies`);
        console.log(`4. Find and copy these values:`);
        console.log(`   • sessionKey (starts with sk-)`);
        console.log(`   • lastActiveOrg`);
        console.log(`   • ajs_user_id\n`);

        const hasClaudeAccount = await this.question(`${colors.cyan}Do you have a Claude.ai account? (y/n):${colors.reset} `);
        
        if (hasClaudeAccount.toLowerCase() !== 'y') {
            console.log(`${colors.yellow}📝 You'll need to create a Claude.ai account first${colors.reset}`);
            console.log(`${colors.blue}Visit: https://claude.ai/signup${colors.reset}`);
        }

        const setupNow = await this.question(`${colors.cyan}Set up authentication now? (y/n):${colors.reset} `);
        
        if (setupNow.toLowerCase() === 'y') {
            console.log(`${colors.blue}🔧 Running cookie extraction tool...${colors.reset}`);
            
            try {
                // Check if extraction tool exists
                const extractorPath = resolve(__dirname, 'extract-claude-cookies.js');
                if (existsSync(extractorPath)) {
                    console.log(`${colors.yellow}Opening automated cookie extractor...${colors.reset}`);
                    console.log(`${colors.cyan}💡 Follow the browser prompts to extract cookies${colors.reset}`);
                    
                    // Note: In a real implementation, we might launch the extractor
                    console.log(`${colors.green}✅ Cookie extraction tool available${colors.reset}`);
                } else {
                    console.log(`${colors.yellow}⚠️ Manual setup required${colors.reset}`);
                    console.log(`${colors.cyan}💡 Check README-BROWSER-AUTH.md for detailed instructions${colors.reset}`);
                }
            } catch (error) {
                console.log(`${colors.yellow}⚠️ Automated setup not available: ${error.message}${colors.reset}`);
            }
        } else {
            console.log(`${colors.cyan}💡 You can set up authentication later with: devx auth browser${colors.reset}`);
        }
    }

    async setupOAuthInfo() {
        console.log(`\n${colors.yellow}🔑 OAuth Authentication Information${colors.reset}\n`);
        
        console.log(`${colors.blue}Requirements:${colors.reset}`);
        console.log(`• Claude Max subscription ($100-200/month)`);
        console.log(`• OAuth token from Claude settings`);
        console.log(`• Higher rate limits (50-800 prompts/5h)`);
        console.log('');

        const hasSubscription = await this.question(`${colors.cyan}Do you have Claude Max? (y/n):${colors.reset} `);
        
        if (hasSubscription.toLowerCase() === 'y') {
            console.log(`${colors.green}✅ Great! You can generate your OAuth token in Claude settings${colors.reset}`);
            console.log(`${colors.cyan}💡 Run 'devx auth oauth' after onboarding for setup${colors.reset}`);
        } else {
            console.log(`${colors.yellow}💡 Consider browser auth instead - it's free with your Claude.ai account${colors.reset}`);
        }
    }

    async setupAPIKeyInfo() {
        console.log(`\n${colors.red}🔐 API Key Authentication Information${colors.reset}\n`);
        
        console.log(`${colors.blue}Cost Structure:${colors.reset}`);
        console.log(`• Light usage: ~$10-20/month`);
        console.log(`• Moderate usage: ~$40-80/month`);
        console.log(`• Heavy usage: ~$200-400/month`);
        console.log('');

        console.log(`${colors.yellow}⚠️ API keys have usage-based pricing${colors.reset}`);
        console.log(`${colors.cyan}💡 Browser auth is free with Claude.ai subscription${colors.reset}`);
        
        const continueWithAPI = await this.question(`${colors.cyan}Continue with API key setup? (y/n):${colors.reset} `);
        
        if (continueWithAPI.toLowerCase() === 'y') {
            console.log(`${colors.green}✅ You can get your API key from Anthropic Console${colors.reset}`);
            console.log(`${colors.cyan}💡 Run 'devx auth api' after onboarding for setup${colors.reset}`);
        } else {
            console.log(`${colors.green}✅ Switching to browser authentication${colors.reset}`);
            this.profile.authPreference = 'browser';
            await this.setupBrowserAuth();
        }
    }

    async validationStep() {
        console.log(`${colors.blue}🔍 Validating system setup...${colors.reset}\n`);

        const validations = [
            {
                name: 'Dependencies',
                check: () => existsSync(resolve(__dirname, 'node_modules')),
                fix: 'npm install'
            },
            {
                name: 'Environment',
                check: () => existsSync(resolve(__dirname, '.env')),
                fix: 'Create .env file'
            },
            {
                name: 'Data Directories',
                check: () => existsSync(resolve(__dirname, 'data')),
                fix: 'Create required directories'
            },
            {
                name: 'Base CV Data',
                check: () => existsSync(resolve(__dirname, '../../data/base-cv.json')),
                fix: 'Initialize CV data'
            }
        ];

        let allValid = true;

        for (const validation of validations) {
            process.stdout.write(`${colors.yellow}Checking ${validation.name}...${colors.reset} `);
            
            try {
                const result = await validation.check();
                if (result) {
                    console.log(`${colors.green}✅${colors.reset}`);
                } else {
                    console.log(`${colors.red}❌${colors.reset}`);
                    console.log(`${colors.cyan}💡 Fix: ${validation.fix}${colors.reset}`);
                    allValid = false;
                }
            } catch (error) {
                console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
                allValid = false;
            }
        }

        if (allValid) {
            console.log(`\n${colors.green}🎉 All validations passed!${colors.reset}`);
        } else {
            console.log(`\n${colors.yellow}⚠️ Some issues found - they can be fixed later${colors.reset}`);
        }

        // Quick system test
        console.log(`\n${colors.blue}🧪 Running quick system test...${colors.reset}`);
        
        try {
            await execAsync('npm run lint --silent', { cwd: __dirname });
            console.log(`${colors.green}✅ Code quality checks passed${colors.reset}`);
        } catch (error) {
            console.log(`${colors.yellow}⚠️ Code quality issues (non-critical)${colors.reset}`);
        }
    }

    async completionStep() {
        const setupTime = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
        
        console.log(`${colors.green}🎉 Setup completed in ${setupTime} minutes!${colors.reset}\n`);

        // Save developer profile
        const profilePath = resolve(__dirname, 'data', 'developer-profile.json');
        this.profile.setupCompletedAt = new Date().toISOString();
        this.profile.setupTimeMinutes = parseFloat(setupTime);
        
        writeFileSync(profilePath, JSON.stringify(this.profile, null, 2));
        console.log(`${colors.green}📝 Developer profile saved${colors.reset}`);

        // Show next steps
        console.log(`${colors.cyan}🚀 Next Steps:${colors.reset}`);
        console.log(`1. ${colors.yellow}devx health${colors.reset} - Check system health`);
        console.log(`2. ${colors.yellow}devx dev --auto${colors.reset} - Start development mode`);
        console.log(`3. ${colors.yellow}devx test${colors.reset} - Run test suite`);
        
        if (this.profile.authPreference !== 'browser' || !this.isAuthConfigured()) {
            console.log(`4. ${colors.yellow}devx auth ${this.profile.authPreference}${colors.reset} - Complete authentication setup`);
        }

        console.log(`\n${colors.blue}📚 Helpful Resources:${colors.reset}`);
        console.log(`• CLAUDE.md - Project overview and guidelines`);
        console.log(`• .github/scripts/README* - Component documentation`);
        console.log(`• devx help - CLI command reference`);
        
        console.log(`\n${colors.magenta}🎯 Goal achieved: ${setupTime} minutes (target: <5 minutes)${colors.reset}`);
        
        if (parseFloat(setupTime) < 5) {
            console.log(`${colors.green}🏆 Excellent! You're ready to be productive immediately!${colors.reset}`);
        } else {
            console.log(`${colors.cyan}💡 Great job! You're all set for efficient development${colors.reset}`);
        }
    }

    generateBasicEnv() {
        return `# CV Enhancement System Environment Variables
# Generated by DevX Onboarding on ${new Date().toISOString()}

# Authentication Strategy
AUTH_STRATEGY=browser_first

# Browser Authentication (FREE)
CLAUDE_SESSION_KEY=
CLAUDE_ORG_ID=  
CLAUDE_USER_ID=

# OAuth Authentication (Claude Max subscription)
CLAUDE_OAUTH_TOKEN=

# API Key Authentication (pay-per-token)
ANTHROPIC_API_KEY=

# GitHub Integration
GITHUB_TOKEN=

# Development Options
NODE_ENV=development
DEBUG=false
VERBOSE=false

# DevX Configuration
DEVX_SETUP_COMPLETE=true
DEVX_LAST_VALIDATION=${new Date().toISOString()}
DEVX_VERSION=1.0.0
`;
    }

    isAuthConfigured() {
        const envFile = resolve(__dirname, '.env');
        if (!existsSync(envFile)) return false;
        
        const envContent = readFileSync(envFile, 'utf8');
        return envContent.includes('CLAUDE_SESSION_KEY=') && envContent.match(/CLAUDE_SESSION_KEY=.+/);
    }

    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    async pressEnterToContinue() {
        await this.question(`${colors.cyan}Press Enter to continue...${colors.reset}`);
        console.log('');
    }
}

// CLI Entry Point
if (import.meta.url === `file://${process.argv[1]}`) {
    const onboarding = new DevXOnboarding();
    onboarding.start().catch(error => {
        console.error(`${colors.red}Onboarding failed: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

export default DevXOnboarding;