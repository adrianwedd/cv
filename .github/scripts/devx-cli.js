#!/usr/bin/env node

/**
 * DevX CLI - Unified Developer Experience Command Interface
 * 
 * Eliminates workflow friction by providing:
 * - One-command environment setup
 * - Integrated development operations  
 * - Automated validation and health checks
 * - Seamless tool integration
 * 
 * Target: Reduce setup time from 3+ days to <5 minutes
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// ANSI Colors for enhanced CLI experience
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

// Developer Experience State Management
class DevXState {
    constructor() {
        this.stateFile = resolve(__dirname, 'data', 'devx-state.json');
        this.state = this.loadState();
    }

    loadState() {
        if (existsSync(this.stateFile)) {
            try {
                return JSON.parse(readFileSync(this.stateFile, 'utf8'));
            } catch (error) {
                console.warn(`${colors.yellow}⚠️ Could not load DevX state, using defaults${colors.reset}`);
                return this.getDefaultState();
            }
        }
        return this.getDefaultState();
    }

    saveState() {
        try {
            writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
        } catch (error) {
            console.warn(`${colors.yellow}⚠️ Could not save DevX state: ${error.message}${colors.reset}`);
        }
    }

    getDefaultState() {
        return {
            version: '1.0.0',
            setupComplete: false,
            lastHealthCheck: null,
            authenticationStatus: 'unconfigured',
            environmentReady: false,
            developerProfile: null,
            preferences: {
                verboseOutput: false,
                autoHealthCheck: true,
                preferredAuthMethod: 'browser'
            },
            setupHistory: [],
            validationResults: {}
        };
    }

    updateSetupProgress(step, status, details = null) {
        this.state.setupHistory.push({
            step,
            status,
            details,
            timestamp: new Date().toISOString()
        });
        this.saveState();
    }
}

// Unified Developer CLI
class DevXCLI {
    constructor() {
        this.state = new DevXState();
        this.commands = {
            'setup': this.setupEnvironment.bind(this),
            'onboard': this.startOnboarding.bind(this),
            'health': this.healthCheck.bind(this),
            'auth': this.configureAuthentication.bind(this),
            'dev': this.startDevelopment.bind(this),
            'test': this.runTests.bind(this),
            'deploy': this.deploySystem.bind(this),
            'monitor': this.openMonitoring.bind(this),
            'dashboard': this.startDashboard.bind(this),
            'automate': this.startAutomation.bind(this),
            'reset': this.resetEnvironment.bind(this),
            'status': this.showStatus.bind(this),
            'help': this.showHelp.bind(this)
        };
    }

    async run(args) {
        const command = args[2] || 'help';
        const subCommand = args[3];
        const options = this.parseOptions(args.slice(4));

        console.log(`${colors.cyan}🚀 DevX CLI - Developer Experience Optimizer${colors.reset}`);
        console.log(`${colors.blue}═══════════════════════════════════════════════${colors.reset}\n`);

        if (this.commands[command]) {
            try {
                await this.commands[command](subCommand, options);
            } catch (error) {
                this.handleError(`Command '${command}' failed`, error);
            }
        } else {
            console.log(`${colors.red}❌ Unknown command: ${command}${colors.reset}\n`);
            this.showHelp();
        }
    }

    parseOptions(args) {
        const options = {};
        for (let i = 0; i < args.length; i += 2) {
            if (args[i] && args[i].startsWith('--')) {
                const key = args[i].slice(2);
                const value = args[i + 1] || true;
                options[key] = value;
            }
        }
        return options;
    }

    // ONE-COMMAND ENVIRONMENT SETUP
    async setupEnvironment(subCommand, options) {
        console.log(`${colors.green}🔧 Setting up complete development environment...${colors.reset}\n`);

        const setupSteps = [
            { name: 'Node.js Dependencies', handler: this.installDependencies.bind(this) },
            { name: 'Environment Variables', handler: this.setupEnvironmentVariables.bind(this) },
            { name: 'Authentication Configuration', handler: this.setupAuthentication.bind(this) },
            { name: 'Development Tools', handler: this.setupDevTools.bind(this) },
            { name: 'Health Validation', handler: this.validateSetup.bind(this) },
            { name: 'Developer Onboarding', handler: this.completeOnboarding.bind(this) }
        ];

        const startTime = Date.now();

        for (let i = 0; i < setupSteps.length; i++) {
            const step = setupSteps[i];
            const progress = `[${i + 1}/${setupSteps.length}]`;
            
            console.log(`${colors.yellow}${progress} ${step.name}...${colors.reset}`);
            
            try {
                await step.handler(options);
                console.log(`${colors.green}✅ ${step.name} complete${colors.reset}\n`);
                this.state.updateSetupProgress(step.name, 'success');
            } catch (error) {
                console.log(`${colors.red}❌ ${step.name} failed: ${error.message}${colors.reset}\n`);
                this.state.updateSetupProgress(step.name, 'failed', error.message);
                
                if (!options.continueOnError) {
                    throw error;
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`${colors.green}🎉 Environment setup complete in ${duration}s${colors.reset}`);
        console.log(`${colors.cyan}💡 Run 'devx dev' to start development${colors.reset}\n`);

        this.state.state.setupComplete = true;
        this.state.state.environmentReady = true;
        this.state.saveState();
    }

    async installDependencies(options) {
        console.log(`${colors.blue}📦 Installing Node.js dependencies...${colors.reset}`);
        
        if (!existsSync(resolve(__dirname, 'package.json'))) {
            throw new Error('package.json not found');
        }

        const { stdout } = await execAsync('npm install', { cwd: __dirname });
        
        if (options.verbose) {
            console.log(stdout);
        }
    }

    async setupEnvironmentVariables(options) {
        console.log(`${colors.blue}🔧 Configuring environment variables...${colors.reset}`);
        
        const envFile = resolve(__dirname, '.env');
        const envTemplate = resolve(__dirname, '.env.template');
        
        if (!existsSync(envFile)) {
            if (existsSync(envTemplate)) {
                const template = readFileSync(envTemplate, 'utf8');
                writeFileSync(envFile, template);
                console.log(`${colors.green}📝 Created .env from template${colors.reset}`);
            } else {
                // Create basic .env file
                const basicEnv = `# CV Enhancement System Environment Variables
# Authentication (choose one method)
AUTH_STRATEGY=browser_first

# Browser Authentication (FREE - uses Claude.ai subscription)
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
`;
                writeFileSync(envFile, basicEnv);
                console.log(`${colors.green}📝 Created basic .env file${colors.reset}`);
            }
        }
    }

    async setupAuthentication(options) {
        console.log(`${colors.blue}🔐 Configuring authentication...${colors.reset}`);
        
        const authMethod = options.auth || this.state.state.preferences.preferredAuthMethod;
        
        switch (authMethod) {
            case 'browser':
                await this.setupBrowserAuth(options);
                break;
            case 'oauth':
                await this.setupOAuthAuth(options);
                break;
            case 'api':
                await this.setupAPIKeyAuth(options);
                break;
            default:
                console.log(`${colors.yellow}⚠️ No authentication method specified, using browser auth${colors.reset}`);
                await this.setupBrowserAuth(options);
        }
    }

    async setupBrowserAuth(options) {
        console.log(`${colors.blue}🍪 Setting up browser authentication...${colors.reset}`);
        
        if (options.automated) {
            console.log(`${colors.yellow}⚠️ Browser auth requires manual cookie extraction${colors.reset}`);
            console.log(`${colors.cyan}💡 Run 'devx auth browser' for interactive setup${colors.reset}`);
            return;
        }

        console.log(`${colors.cyan}📋 Browser Authentication Setup:${colors.reset}`);
        console.log(`1. Open https://claude.ai in your browser`);
        console.log(`2. Log in to your Claude account`);
        console.log(`3. Run: node extract-claude-cookies.js`);
        console.log(`4. Update your .env file with the extracted values\n`);
    }

    async setupDevTools(options) {
        console.log(`${colors.blue}🛠️ Setting up development tools...${colors.reset}`);
        
        // Ensure required directories exist
        const requiredDirs = [
            resolve(__dirname, 'data'),
            resolve(__dirname, 'coverage'),
            resolve(__dirname, 'dist')
        ];

        for (const dir of requiredDirs) {
            if (!existsSync(dir)) {
                const { mkdirSync } = await import('fs');
                mkdirSync(dir, { recursive: true });
                console.log(`${colors.green}📁 Created directory: ${dir}${colors.reset}`);
            }
        }

        // Validate ESLint configuration
        try {
            await execAsync('npm run lint --silent');
            console.log(`${colors.green}✅ ESLint configuration valid${colors.reset}`);
        } catch (error) {
            console.log(`${colors.yellow}⚠️ ESLint issues detected (will fix during development)${colors.reset}`);
        }
    }

    async validateSetup(options) {
        console.log(`${colors.blue}🔍 Validating setup...${colors.reset}`);
        
        const validations = [
            { name: 'Dependencies', check: () => existsSync(resolve(__dirname, 'node_modules')) },
            { name: 'Environment', check: () => existsSync(resolve(__dirname, '.env')) },
            { name: 'Data Directory', check: () => existsSync(resolve(__dirname, 'data')) },
            { name: 'Test Suite', check: async () => {
                try {
                    await execAsync('npm test --silent');
                    return true;
                } catch {
                    return false;
                }
            }}
        ];

        const results = {};
        
        for (const validation of validations) {
            try {
                const result = typeof validation.check === 'function' ? 
                    await validation.check() : validation.check;
                results[validation.name] = result;
                
                if (result) {
                    console.log(`${colors.green}✅ ${validation.name}${colors.reset}`);
                } else {
                    console.log(`${colors.red}❌ ${validation.name}${colors.reset}`);
                }
            } catch (error) {
                results[validation.name] = false;
                console.log(`${colors.red}❌ ${validation.name}: ${error.message}${colors.reset}`);
            }
        }

        this.state.state.validationResults = results;
        this.state.saveState();
    }

    async completeOnboarding(options) {
        console.log(`${colors.blue}🎓 Completing developer onboarding...${colors.reset}`);
        
        const developerGuide = `
${colors.cyan}🎯 Developer Quick Start Guide${colors.reset}
${colors.blue}═══════════════════════════════${colors.reset}

${colors.green}✨ Common Commands:${colors.reset}
• devx dev              Start development mode
• devx test             Run test suite  
• devx health           System health check
• devx monitor          Open monitoring dashboard
• devx deploy           Deploy to production

${colors.green}🔧 Development Workflow:${colors.reset}
1. devx dev              # Start development
2. Make your changes    # Edit code
3. devx test            # Validate changes
4. devx deploy          # Deploy when ready

${colors.green}📚 Documentation:${colors.reset}
• README files in .github/scripts/
• CLAUDE.md for project overview
• Each script has inline documentation

${colors.green}🆘 Need Help?${colors.reset}
• devx help             # Show all commands
• devx status           # Current system status
• Check GitHub issues for known problems
        `;

        console.log(developerGuide);
    }

    // INTEGRATED HEALTH CHECKING
    async healthCheck(subCommand, options) {
        console.log(`${colors.green}🏥 Running comprehensive health check...${colors.reset}\n`);

        const healthChecks = [
            { name: 'System Dependencies', handler: this.checkDependencies.bind(this) },
            { name: 'Authentication Status', handler: this.checkAuthentication.bind(this) },
            { name: 'Data Integrity', handler: this.checkDataIntegrity.bind(this) },
            { name: 'Service Availability', handler: this.checkServices.bind(this) },
            { name: 'Performance Metrics', handler: this.checkPerformance.bind(this) }
        ];

        const results = {};
        let overallHealth = 100;

        for (const check of healthChecks) {
            try {
                console.log(`${colors.yellow}🔍 ${check.name}...${colors.reset}`);
                const result = await check.handler(options);
                results[check.name] = result;
                
                if (result.status === 'healthy') {
                    console.log(`${colors.green}✅ ${check.name}: ${result.message}${colors.reset}`);
                } else if (result.status === 'warning') {
                    console.log(`${colors.yellow}⚠️ ${check.name}: ${result.message}${colors.reset}`);
                    overallHealth -= 10;
                } else {
                    console.log(`${colors.red}❌ ${check.name}: ${result.message}${colors.reset}`);
                    overallHealth -= 25;
                }
            } catch (error) {
                results[check.name] = { status: 'error', message: error.message };
                console.log(`${colors.red}❌ ${check.name}: ${error.message}${colors.reset}`);
                overallHealth -= 25;
            }
            console.log('');
        }

        // Overall health summary
        const healthColor = overallHealth >= 80 ? colors.green : 
                           overallHealth >= 60 ? colors.yellow : colors.red;
        
        console.log(`${healthColor}🎯 Overall System Health: ${overallHealth}%${colors.reset}`);
        
        if (overallHealth < 80) {
            console.log(`${colors.cyan}💡 Run 'devx setup' to resolve issues${colors.reset}`);
        }

        this.state.state.lastHealthCheck = {
            timestamp: new Date().toISOString(),
            results,
            overallHealth
        };
        this.state.saveState();
    }

    async checkDependencies(options) {
        const nodeModules = resolve(__dirname, 'node_modules');
        const packageJson = resolve(__dirname, 'package.json');
        
        if (!existsSync(nodeModules)) {
            return { status: 'error', message: 'node_modules not found - run npm install' };
        }
        
        if (!existsSync(packageJson)) {
            return { status: 'error', message: 'package.json not found' };
        }
        
        try {
            const pkg = JSON.parse(readFileSync(packageJson, 'utf8'));
            const depCount = Object.keys(pkg.dependencies || {}).length;
            const devDepCount = Object.keys(pkg.devDependencies || {}).length;
            
            return { 
                status: 'healthy', 
                message: `${depCount + devDepCount} dependencies installed` 
            };
        } catch (error) {
            return { status: 'error', message: 'Cannot read package.json' };
        }
    }

    async checkAuthentication(options) {
        try {
            const envFile = resolve(__dirname, '.env');
            if (!existsSync(envFile)) {
                return { status: 'error', message: '.env file not found' };
            }

            const envContent = readFileSync(envFile, 'utf8');
            const hasClaudeAuth = envContent.includes('CLAUDE_SESSION_KEY=') && 
                                 envContent.match(/CLAUDE_SESSION_KEY=.+/);
            const hasOAuth = envContent.includes('CLAUDE_OAUTH_TOKEN=') &&
                           envContent.match(/CLAUDE_OAUTH_TOKEN=.+/);
            const hasAPIKey = envContent.includes('ANTHROPIC_API_KEY=') &&
                            envContent.match(/ANTHROPIC_API_KEY=.+/);

            if (hasClaudeAuth || hasOAuth || hasAPIKey) {
                const methods = [];
                if (hasClaudeAuth) methods.push('Browser');
                if (hasOAuth) methods.push('OAuth');  
                if (hasAPIKey) methods.push('API Key');
                
                return { 
                    status: 'healthy', 
                    message: `Configured: ${methods.join(', ')}` 
                };
            } else {
                return { 
                    status: 'warning', 
                    message: 'No authentication configured' 
                };
            }
        } catch (error) {
            return { status: 'error', message: 'Cannot check authentication' };
        }
    }

    async checkDataIntegrity(options) {
        const dataDir = resolve(__dirname, 'data');
        const baseCv = resolve(__dirname, '../../data/base-cv.json');
        
        if (!existsSync(dataDir)) {
            return { status: 'error', message: 'Data directory not found' };
        }
        
        if (!existsSync(baseCv)) {
            return { status: 'error', message: 'base-cv.json not found' };
        }
        
        try {
            const cvData = JSON.parse(readFileSync(baseCv, 'utf8'));
            const hasRequiredFields = cvData.personal_info && 
                                     cvData.professional_summary && 
                                     cvData.experience;
            
            if (hasRequiredFields) {
                return { status: 'healthy', message: 'CV data structure valid' };
            } else {
                return { status: 'warning', message: 'CV data incomplete' };
            }
        } catch (error) {
            return { status: 'error', message: 'Cannot parse CV data' };
        }
    }

    async checkServices(options) {
        // Check GitHub API availability
        try {
            const response = await fetch('https://api.github.com/rate_limit');
            if (response.ok) {
                return { status: 'healthy', message: 'GitHub API accessible' };
            } else {
                return { status: 'warning', message: 'GitHub API rate limited' };
            }
        } catch (error) {
            return { status: 'error', message: 'Cannot reach GitHub API' };
        }
    }

    async checkPerformance(options) {
        const dataDir = resolve(__dirname, 'data');
        
        try {
            const stats = await import('fs/promises').then(fs => fs.stat(dataDir));
            const sizeInMB = (await this.getDirectorySize(dataDir) / 1024 / 1024).toFixed(1);
            
            if (parseFloat(sizeInMB) > 500) {
                return { status: 'warning', message: `Data directory large: ${sizeInMB}MB` };
            } else {
                return { status: 'healthy', message: `Data directory: ${sizeInMB}MB` };
            }
        } catch (error) {
            return { status: 'error', message: 'Cannot check performance metrics' };
        }
    }

    async getDirectorySize(dirPath) {
        const fs = await import('fs/promises');
        let size = 0;
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = resolve(dirPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    size += await this.getDirectorySize(itemPath);
                } else {
                    size += stats.size;
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
        
        return size;
    }

    // UNIFIED DEVELOPMENT MODE
    async startDevelopment(subCommand, options) {
        console.log(`${colors.green}🚀 Starting unified development mode...${colors.reset}\n`);
        
        // Auto health check
        if (this.state.state.preferences.autoHealthCheck) {
            console.log(`${colors.blue}🔍 Running pre-development health check...${colors.reset}`);
            await this.healthCheck(null, { silent: true });
            console.log('');
        }

        const devServices = [
            { name: 'File Watcher', command: 'npm run dev:watch' },
            { name: 'Test Runner', command: 'npm run test:watch' },
            { name: 'Local Server', command: 'python -m http.server 8000', cwd: resolve(__dirname, '../../') }
        ];

        console.log(`${colors.cyan}🔧 Available Development Services:${colors.reset}`);
        devServices.forEach((service, i) => {
            console.log(`${i + 1}. ${service.name}`);
        });
        console.log(`A. Start All Services`);
        console.log(`Q. Quit\n`);

        // For automated mode, start all services
        if (options.auto) {
            console.log(`${colors.green}🚀 Starting all development services...${colors.reset}\n`);
            
            devServices.forEach(service => {
                this.startService(service.name, service.command, service.cwd);
            });
            
            console.log(`${colors.cyan}💡 Development environment ready!${colors.reset}`);
            console.log(`${colors.cyan}   Local server: http://localhost:8000${colors.reset}`);
            console.log(`${colors.cyan}   Press Ctrl+C to stop all services${colors.reset}\n`);
            
            // Keep process running
            process.on('SIGINT', () => {
                console.log(`\n${colors.yellow}🛑 Stopping development services...${colors.reset}`);
                process.exit(0);
            });
            
            return new Promise(() => {}); // Keep running
        }

        // Interactive mode would go here
        console.log(`${colors.yellow}💡 Run 'devx dev --auto' to start all services automatically${colors.reset}`);
    }

    startService(name, command, cwd = __dirname) {
        console.log(`${colors.green}▶️ Starting ${name}...${colors.reset}`);
        
        const child = spawn(command.split(' ')[0], command.split(' ').slice(1), {
            cwd,
            stdio: 'inherit',
            detached: false
        });

        child.on('error', (error) => {
            console.log(`${colors.red}❌ ${name} failed: ${error.message}${colors.reset}`);
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.log(`${colors.yellow}⚠️ ${name} exited with code ${code}${colors.reset}`);
            }
        });

        return child;
    }

    // SEAMLESS TESTING
    async runTests(subCommand, options) {
        console.log(`${colors.green}🧪 Running test suite...${colors.reset}\n`);

        const testSuites = [
            { name: 'Unit Tests', command: 'npm test' },
            { name: 'Integration Tests', command: 'npm run test:integration' },
            { name: 'Linting', command: 'npm run lint' }
        ];

        if (subCommand) {
            const suite = testSuites.find(s => s.name.toLowerCase().includes(subCommand.toLowerCase()));
            if (suite) {
                return await this.runSingleTest(suite, options);
            }
        }

        // Run all tests
        let allPassed = true;
        
        for (const suite of testSuites) {
            const result = await this.runSingleTest(suite, options);
            if (!result) allPassed = false;
        }

        if (allPassed) {
            console.log(`${colors.green}🎉 All tests passed!${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ Some tests failed${colors.reset}`);
            process.exit(1);
        }
    }

    async runSingleTest(suite, options) {
        console.log(`${colors.yellow}🔍 Running ${suite.name}...${colors.reset}`);
        
        try {
            const { stdout, stderr } = await execAsync(suite.command, { cwd: __dirname });
            
            if (options.verbose && stdout) {
                console.log(stdout);
            }
            
            console.log(`${colors.green}✅ ${suite.name} passed${colors.reset}\n`);
            return true;
        } catch (error) {
            console.log(`${colors.red}❌ ${suite.name} failed${colors.reset}`);
            
            if (options.verbose || options.showErrors) {
                console.log(error.stdout || error.stderr || error.message);
            }
            
            console.log('');
            return false;
        }
    }

    // INTEGRATED MONITORING
    async openMonitoring(subCommand, options) {
        console.log(`${colors.green}📊 Opening monitoring dashboard...${colors.reset}\n`);
        
        const monitoringOptions = [
            { name: 'System Health', path: 'data/reliability-dashboard.html' },
            { name: 'Performance Metrics', command: 'node performance-monitor.js' },
            { name: 'Usage Analytics', command: 'node usage-monitor-dashboard.js' },
            { name: 'Live Monitoring', command: 'node monitoring-dashboard.js --serve' }
        ];

        if (subCommand === 'health') {
            const healthDashboard = resolve(__dirname, 'data/reliability-dashboard.html');
            if (existsSync(healthDashboard)) {
                const open = await import('open');
                await open.default(`file://${healthDashboard}`);
                console.log(`${colors.green}🌐 Health dashboard opened in browser${colors.reset}`);
            } else {
                console.log(`${colors.yellow}⚠️ Health dashboard not found, generating...${colors.reset}`);
                await execAsync('node reliability-dashboard.js', { cwd: __dirname });
                console.log(`${colors.green}✅ Health dashboard generated${colors.reset}`);
            }
            return;
        }

        console.log(`${colors.cyan}📈 Available Monitoring Dashboards:${colors.reset}`);
        monitoringOptions.forEach((option, i) => {
            console.log(`${i + 1}. ${option.name}`);
        });
        
        console.log(`\n${colors.yellow}💡 Use 'devx monitor health' for quick health dashboard${colors.reset}`);
    }

    // SYSTEM STATUS
    async showStatus(subCommand, options) {
        console.log(`${colors.cyan}📋 System Status Overview${colors.reset}`);
        console.log(`${colors.blue}═════════════════════════${colors.reset}\n`);

        const status = {
            setup: this.state.state.setupComplete,
            environment: this.state.state.environmentReady,
            lastHealthCheck: this.state.state.lastHealthCheck,
            authentication: this.state.state.authenticationStatus
        };

        // Setup Status
        const setupStatus = status.setup ? 
            `${colors.green}✅ Complete${colors.reset}` : 
            `${colors.red}❌ Incomplete${colors.reset}`;
        console.log(`Setup Status: ${setupStatus}`);

        // Environment Status  
        const envStatus = status.environment ? 
            `${colors.green}✅ Ready${colors.reset}` : 
            `${colors.red}❌ Not Ready${colors.reset}`;
        console.log(`Environment: ${envStatus}`);

        // Last Health Check
        if (status.lastHealthCheck) {
            const healthAge = Math.floor((Date.now() - new Date(status.lastHealthCheck.timestamp)) / 1000 / 60);
            const healthColor = status.lastHealthCheck.overallHealth >= 80 ? colors.green :
                               status.lastHealthCheck.overallHealth >= 60 ? colors.yellow : colors.red;
            console.log(`Health: ${healthColor}${status.lastHealthCheck.overallHealth}%${colors.reset} (${healthAge}m ago)`);
        } else {
            console.log(`Health: ${colors.yellow}⚠️ Not checked${colors.reset}`);
        }

        // Quick Actions
        console.log(`\n${colors.cyan}🚀 Quick Actions:${colors.reset}`);
        
        if (!status.setup) {
            console.log(`• devx setup          Complete environment setup`);
        }
        
        console.log(`• devx health         Run health check`);
        console.log(`• devx dev --auto     Start development mode`);
        console.log(`• devx test           Run test suite`);
    }

    // AUTHENTICATION CONFIGURATION  
    async configureAuthentication(subCommand, options) {
        console.log(`${colors.green}🔐 Authentication Configuration${colors.reset}\n`);

        const authMethods = {
            'browser': 'Browser Authentication (FREE - uses Claude.ai subscription)',
            'oauth': 'OAuth Authentication (Claude Max subscription)',  
            'api': 'API Key Authentication (pay-per-token)'
        };

        if (!subCommand) {
            console.log(`${colors.cyan}Available Authentication Methods:${colors.reset}`);
            Object.entries(authMethods).forEach(([key, desc]) => {
                console.log(`• devx auth ${key}    ${desc}`);
            });
            console.log(`\n${colors.yellow}💡 Recommended: 'devx auth browser' for free usage${colors.reset}`);
            return;
        }

        switch (subCommand) {
            case 'browser':
                await this.configureBrowserAuth(options);
                break;
            case 'oauth':
                await this.configureOAuthAuth(options);
                break;
            case 'api':
                await this.configureAPIKeyAuth(options);
                break;
            default:
                console.log(`${colors.red}❌ Unknown auth method: ${subCommand}${colors.reset}`);
                console.log(`Available: browser, oauth, api`);
        }
    }

    async configureBrowserAuth(options) {
        console.log(`${colors.blue}🍪 Configuring Browser Authentication...${colors.reset}\n`);
        
        console.log(`${colors.cyan}📋 Browser Authentication Setup Guide:${colors.reset}`);
        console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
        console.log(`1. ${colors.green}Open https://claude.ai and log in${colors.reset}`);
        console.log(`2. ${colors.green}Press F12 to open Developer Tools${colors.reset}`);
        console.log(`3. ${colors.green}Go to Application tab > Storage > Cookies${colors.reset}`);
        console.log(`4. ${colors.green}Copy these cookie values:${colors.reset}`);
        console.log(`   • sessionKey (starts with sk-)`);
        console.log(`   • lastActiveOrg`);
        console.log(`   • ajs_user_id\n`);
        
        console.log(`${colors.cyan}🔧 Automated Setup (Recommended):${colors.reset}`);
        console.log(`${colors.yellow}node extract-claude-cookies.js${colors.reset}\n`);
        
        console.log(`${colors.cyan}🔄 Update Environment:${colors.reset}`);
        console.log(`${colors.yellow}node setup-claude-cookies.js${colors.reset}\n`);
        
        console.log(`${colors.cyan}✅ Verify Setup:${colors.reset}`);
        console.log(`${colors.yellow}devx health${colors.reset}\n`);
        
        if (options.interactive) {
            // Interactive setup would go here
            console.log(`${colors.yellow}💡 Use --interactive flag for guided setup (coming soon)${colors.reset}`);
        }
    }

    async configureOAuthAuth(options) {
        console.log(`${colors.blue}🔑 Configuring OAuth Authentication...${colors.reset}\n`);
        
        console.log(`${colors.cyan}📋 OAuth requires Claude Max subscription${colors.reset}`);
        console.log(`${colors.yellow}⚠️ Cost: $100-200/month vs free browser auth${colors.reset}\n`);
        
        console.log(`${colors.cyan}🔧 Setup Steps:${colors.reset}`);
        console.log(`1. Subscribe to Claude Max`);
        console.log(`2. Generate OAuth token in Claude settings`);
        console.log(`3. Run: node setup-claude-oauth.js`);
        console.log(`4. Verify: devx health\n`);
        
        console.log(`${colors.yellow}💡 Recommendation: Use browser auth instead for free usage${colors.reset}`);
    }

    async configureAPIKeyAuth(options) {
        console.log(`${colors.blue}🔐 Configuring API Key Authentication...${colors.reset}\n`);
        
        console.log(`${colors.cyan}📋 API Key is pay-per-token${colors.reset}`);
        console.log(`${colors.yellow}⚠️ Cost: $10-400/month depending on usage${colors.reset}\n`);
        
        console.log(`${colors.cyan}🔧 Setup Steps:${colors.reset}`);
        console.log(`1. Get API key from Anthropic Console`);
        console.log(`2. Add to .env: ANTHROPIC_API_KEY=your-key-here`);
        console.log(`3. Set AUTH_STRATEGY=api_key`);
        console.log(`4. Verify: devx health\n`);
        
        console.log(`${colors.yellow}💡 Recommendation: Use browser auth instead for free usage${colors.reset}`);
    }

    // DEPLOYMENT
    async deploySystem(subCommand, options) {
        console.log(`${colors.green}🚀 System Deployment${colors.reset}\n`);
        
        // Pre-deployment checks
        console.log(`${colors.yellow}🔍 Running pre-deployment checks...${colors.reset}`);
        await this.runTests(null, { silent: true });
        
        const deploySteps = [
            { name: 'Build Assets', command: 'npm run generate' },
            { name: 'Validate Output', command: 'npm run template:validate' },
            { name: 'Run Quality Checks', command: 'node comprehensive-quality-validator.js' },
            { name: 'Deploy to GitHub Pages', handler: this.deployToGitHub.bind(this) }
        ];

        for (const step of deploySteps) {
            console.log(`${colors.yellow}⚡ ${step.name}...${colors.reset}`);
            
            try {
                if (step.command) {
                    await execAsync(step.command, { cwd: __dirname });
                } else if (step.handler) {
                    await step.handler(options);
                }
                console.log(`${colors.green}✅ ${step.name} complete${colors.reset}`);
            } catch (error) {
                console.log(`${colors.red}❌ ${step.name} failed: ${error.message}${colors.reset}`);
                if (!options.continueOnError) {
                    throw error;
                }
            }
        }

        console.log(`${colors.green}🎉 Deployment complete!${colors.reset}`);
        console.log(`${colors.cyan}🌐 Site: https://adrianwedd.github.io/cv${colors.reset}`);
    }

    async deployToGitHub(options) {
        if (options.skipGit) {
            console.log(`${colors.yellow}⏭️ Skipping Git operations${colors.reset}`);
            return;
        }

        const commands = [
            'git add .',
            'git commit -m "🚀 DevX CLI deployment"',
            'git push origin main'
        ];

        for (const command of commands) {
            await execAsync(command, { cwd: resolve(__dirname, '../../') });
        }
    }

    // ENVIRONMENT RESET
    async resetEnvironment(subCommand, options) {
        console.log(`${colors.yellow}🔄 Resetting development environment...${colors.reset}\n`);
        
        if (!options.confirm && !options.force) {
            console.log(`${colors.red}⚠️ This will reset your entire development environment${colors.reset}`);
            console.log(`${colors.yellow}Add --force to confirm reset${colors.reset}`);
            return;
        }

        const resetSteps = [
            { name: 'Clear Node Modules', handler: () => this.removeDirectory(resolve(__dirname, 'node_modules')) },
            { name: 'Clear Data Directory', handler: () => this.clearDirectory(resolve(__dirname, 'data')) },
            { name: 'Clear Coverage', handler: () => this.removeDirectory(resolve(__dirname, 'coverage')) },
            { name: 'Reset State', handler: () => this.resetDevXState() },
            { name: 'Reinstall Dependencies', command: 'npm install' }
        ];

        for (const step of resetSteps) {
            console.log(`${colors.yellow}🗑️ ${step.name}...${colors.reset}`);
            
            try {
                if (step.command) {
                    await execAsync(step.command, { cwd: __dirname });
                } else if (step.handler) {
                    await step.handler();
                }
                console.log(`${colors.green}✅ ${step.name} complete${colors.reset}`);
            } catch (error) {
                console.log(`${colors.red}❌ ${step.name} failed: ${error.message}${colors.reset}`);
            }
        }

        console.log(`${colors.green}🎉 Environment reset complete!${colors.reset}`);
        console.log(`${colors.cyan}💡 Run 'devx setup' to reconfigure${colors.reset}`);
    }

    async removeDirectory(dirPath) {
        if (existsSync(dirPath)) {
            const { rmSync } = await import('fs');
            rmSync(dirPath, { recursive: true, force: true });
        }
    }

    async clearDirectory(dirPath) {
        if (existsSync(dirPath)) {
            const fs = await import('fs/promises');
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                if (!item.startsWith('.')) { // Keep hidden files
                    const itemPath = resolve(dirPath, item);
                    await fs.rm(itemPath, { recursive: true, force: true });
                }
            }
        }
    }

    resetDevXState() {
        this.state.state = this.state.getDefaultState();
        this.state.saveState();
    }

    // ONBOARDING SYSTEM
    async startOnboarding(subCommand, options) {
        console.log(`${colors.green}🎓 Starting interactive onboarding...${colors.reset}\n`);
        
        try {
            const { default: DevXOnboarding } = await import('./devx-onboarding.js');
            const onboarding = new DevXOnboarding();
            await onboarding.start();
        } catch (error) {
            console.log(`${colors.red}❌ Onboarding failed: ${error.message}${colors.reset}`);
            console.log(`${colors.cyan}💡 Try 'devx setup' for automated setup${colors.reset}`);
        }
    }

    // DASHBOARD SYSTEM
    async startDashboard(subCommand, options) {
        const port = options.port || 3333;
        console.log(`${colors.green}📊 Starting integrated development dashboard...${colors.reset}\n`);
        
        try {
            const { default: DevXDashboard } = await import('./devx-dashboard.js');
            const dashboard = new DevXDashboard({ port });
            await dashboard.start();
        } catch (error) {
            console.log(`${colors.red}❌ Dashboard failed to start: ${error.message}${colors.reset}`);
            console.log(`${colors.cyan}💡 Try 'devx monitor' for alternative monitoring${colors.reset}`);
        }
    }

    // AUTOMATION SYSTEM
    async startAutomation(subCommand, options) {
        console.log(`${colors.green}🤖 Starting workflow automation engine...${colors.reset}\n`);
        
        try {
            const { default: DevXAutomation } = await import('./devx-automation.js');
            const automation = new DevXAutomation({
                verbose: options.verbose || false,
                testOnChange: !options.noTestOnChange,
                autoHealthCheck: !options.noHealthCheck
            });
            
            await automation.start();
        } catch (error) {
            console.log(`${colors.red}❌ Automation engine failed: ${error.message}${colors.reset}`);
            console.log(`${colors.cyan}💡 Check system requirements and try again${colors.reset}`);
        }
    }

    // HELP SYSTEM
    showHelp() {
        const helpText = `
${colors.cyan}DevX CLI - Developer Experience Optimizer${colors.reset}
${colors.blue}══════════════════════════════════════════${colors.reset}

${colors.green}🚀 Core Commands:${colors.reset}
  setup                 One-command environment setup (<5 minutes)
  onboard               Interactive guided onboarding experience
  health                Comprehensive system health check  
  dev [--auto]          Start unified development mode
  test [suite]          Run test suites (unit, integration, lint)
  deploy                Build and deploy to production
  status                Show current system status

${colors.green}🔧 Advanced Features:${colors.reset}
  auth <method>         Configure authentication (browser|oauth|api)
  dashboard [--port]    Start integrated development dashboard
  monitor [dashboard]   Open monitoring dashboards  
  automate [options]    Start workflow automation engine
  reset --force         Reset entire environment

${colors.green}📚 Information:${colors.reset}
  help                  Show this help message

${colors.green}⚡ Quick Start (New Developers):${colors.reset}
  devx onboard          # Interactive 5-minute guided setup
  devx dashboard        # Open development monitoring hub
  devx automate         # Start workflow automation
  devx dev --auto       # Begin development

${colors.green}🎯 Daily Workflow (Experienced Developers):${colors.reset}
  devx health           # Check system status
  devx dev --auto       # Start development mode
  devx test             # Validate changes
  devx deploy           # Deploy when ready

${colors.green}🤖 Automation Features:${colors.reset}
  • Auto-testing on file changes
  • Health monitoring with recovery
  • Authentication refresh automation
  • Performance optimization triggers
  • Error handling and self-healing

${colors.yellow}💡 DevX Philosophy:${colors.reset}
  • Eliminate manual steps and context switching
  • One-command operations for complex workflows
  • Automated validation and recovery
  • Real-time monitoring and insights
  • Developer productivity first

${colors.cyan}🆘 Support & Documentation:${colors.reset}
  • CLAUDE.md - Project overview and guidelines
  • .github/scripts/README* - Component docs
  • devx status - Current system health
  • GitHub issues - Known problems and solutions
        `;

        console.log(helpText);
    }

    // ERROR HANDLING
    handleError(message, error) {
        console.log(`${colors.red}❌ ${message}${colors.reset}`);
        
        if (error.stack && process.env.DEBUG) {
            console.log(`${colors.red}${error.stack}${colors.reset}`);
        } else if (error.message) {
            console.log(`${colors.red}${error.message}${colors.reset}`);
        }
        
        console.log(`${colors.cyan}💡 Try 'devx health' to diagnose issues${colors.reset}`);
        console.log(`${colors.cyan}💡 Run with --verbose for detailed output${colors.reset}`);
        
        process.exit(1);
    }
}

// CLI Entry Point
if (import.meta.url === `file://${process.argv[1]}`) {
    const cli = new DevXCLI();
    cli.run(process.argv).catch(error => {
        console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

export default DevXCLI;