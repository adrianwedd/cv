#!/usr/bin/env node

/**
 * DevX Automation - Workflow Automation Engine
 * 
 * Eliminates manual workflow steps through intelligent automation:
 * - Automated testing on file changes
 * - Smart deployment workflows
 * - Health monitoring with auto-recovery
 * - Performance optimization triggers
 * - Authentication refresh automation
 * - Error handling and self-healing capabilities
 * 
 * Reduces manual intervention and context switching
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { watch } from 'fs';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class DevXAutomation {
    constructor(options = {}) {
        this.config = {
            watchPatterns: ['*.js', '*.json', '*.md'],
            testOnChange: true,
            autoHealthCheck: true,
            healthCheckInterval: 300000, // 5 minutes
            authRefreshInterval: 900000, // 15 minutes
            autoRecovery: true,
            verboseLogging: options.verbose || false,
            ...options
        };

        this.state = {
            isRunning: false,
            lastHealthCheck: null,
            lastAuthCheck: null,
            consecutiveFailures: 0,
            activeWatchers: new Set(),
            runningProcesses: new Set()
        };

        this.automationRules = [
            {
                name: 'Test on File Change',
                enabled: this.config.testOnChange,
                trigger: 'fileChange',
                patterns: ['*.js', '*.test.js'],
                action: this.runTests.bind(this),
                debounce: 2000
            },
            {
                name: 'Health Check Monitor',
                enabled: this.config.autoHealthCheck,
                trigger: 'interval',
                interval: this.config.healthCheckInterval,
                action: this.performHealthCheck.bind(this)
            },
            {
                name: 'Authentication Refresh',
                enabled: true,
                trigger: 'interval',
                interval: this.config.authRefreshInterval,
                action: this.refreshAuthentication.bind(this)
            },
            {
                name: 'Performance Monitor',
                enabled: true,
                trigger: 'interval',
                interval: 600000, // 10 minutes
                action: this.monitorPerformance.bind(this)
            },
            {
                name: 'Auto Recovery',
                enabled: this.config.autoRecovery,
                trigger: 'error',
                action: this.attemptRecovery.bind(this)
            }
        ];

        this.debounceTimers = new Map();
    }

    async start() {
        console.log(`${colors.cyan}🤖 DevX Automation Engine Starting...${colors.reset}`);
        console.log(`${colors.blue}═════════════════════════════════════${colors.reset}\n`);

        this.state.isRunning = true;

        // Initialize automation rules
        for (const rule of this.automationRules) {
            if (rule.enabled) {
                await this.initializeRule(rule);
            }
        }

        console.log(`${colors.green}✅ Automation engine operational with ${this.automationRules.filter(r => r.enabled).length} active rules${colors.reset}`);
        console.log(`${colors.cyan}📊 Monitoring system for automated workflow optimization${colors.reset}`);
        console.log(`${colors.yellow}🔄 Press Ctrl+C to stop automation${colors.reset}\n`);

        // Handle graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());

        // Keep process running
        return new Promise(() => {});
    }

    async initializeRule(rule) {
        this.log(`🔧 Initializing: ${rule.name}`, 'info');

        switch (rule.trigger) {
            case 'fileChange':
                this.setupFileWatcher(rule);
                break;
            case 'interval':
                this.setupIntervalTrigger(rule);
                break;
            case 'error':
                this.setupErrorHandler(rule);
                break;
            default:
                this.log(`⚠️ Unknown trigger type: ${rule.trigger}`, 'warning');
        }
    }

    setupFileWatcher(rule) {
        const watchPaths = [
            __dirname,
            resolve(__dirname, '../../data'),
            resolve(__dirname, '../../assets')
        ];

        for (const watchPath of watchPaths) {
            if (existsSync(watchPath)) {
                const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
                    if (filename && this.matchesPatterns(filename, rule.patterns)) {
                        this.handleFileChange(rule, filename);
                    }
                });

                this.state.activeWatchers.add(watcher);
                this.log(`👀 Watching ${watchPath} for changes`, 'info');
            }
        }
    }

    setupIntervalTrigger(rule) {
        const intervalId = setInterval(async () => {
            if (this.state.isRunning) {
                try {
                    await rule.action();
                } catch (error) {
                    this.log(`❌ Interval rule failed: ${rule.name} - ${error.message}`, 'error');
                    await this.handleError(rule, error);
                }
            }
        }, rule.interval);

        // Store interval ID for cleanup
        rule.intervalId = intervalId;
    }

    setupErrorHandler(rule) {
        process.on('uncaughtException', async (error) => {
            this.log(`💥 Uncaught exception: ${error.message}`, 'error');
            await rule.action(error);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            this.log(`🚫 Unhandled rejection: ${reason}`, 'error');
            await rule.action(reason);
        });
    }

    handleFileChange(rule, filename) {
        const key = `${rule.name}-${filename}`;
        
        // Clear existing debounce timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        // Set new debounce timer
        const timer = setTimeout(async () => {
            this.log(`📁 File changed: ${filename} - triggering ${rule.name}`, 'info');
            
            try {
                await rule.action(filename);
            } catch (error) {
                this.log(`❌ File change rule failed: ${error.message}`, 'error');
                await this.handleError(rule, error);
            }
            
            this.debounceTimers.delete(key);
        }, rule.debounce || 1000);

        this.debounceTimers.set(key, timer);
    }

    async runTests(filename) {
        if (filename && filename.includes('.test.js')) {
            this.log(`🧪 Running specific test: ${filename}`, 'info');
            await execAsync(`npm test -- ${filename}`, { cwd: __dirname });
        } else {
            this.log('🧪 Running full test suite due to code changes', 'info');
            const { stdout, stderr } = await execAsync('npm test', { cwd: __dirname });
            
            if (stderr && !stderr.includes('warning')) {
                throw new Error(`Test failures: ${stderr}`);
            }
            
            this.log('✅ Tests passed', 'success');
        }
    }

    async performHealthCheck() {
        this.log('🏥 Performing automated health check', 'info');
        
        try {
            const { stdout } = await execAsync('node devx-cli.js health --silent', { cwd: __dirname });
            
            const healthMatch = stdout.match(/Overall System Health: (\d+)%/);
            const healthPercentage = healthMatch ? parseInt(healthMatch[1]) : 0;

            this.state.lastHealthCheck = {
                timestamp: new Date().toISOString(),
                health: healthPercentage,
                status: healthPercentage >= 80 ? 'healthy' : healthPercentage >= 60 ? 'warning' : 'critical'
            };

            if (healthPercentage < 60) {
                this.log(`⚠️ Low system health: ${healthPercentage}% - triggering recovery`, 'warning');
                await this.attemptRecovery(new Error(`Low system health: ${healthPercentage}%`));
            } else {
                this.log(`✅ System health: ${healthPercentage}%`, 'success');
                this.state.consecutiveFailures = 0;
            }

        } catch (error) {
            this.log(`❌ Health check failed: ${error.message}`, 'error');
            this.state.consecutiveFailures++;
            
            if (this.state.consecutiveFailures >= 3) {
                await this.attemptRecovery(error);
            }
        }
    }

    async refreshAuthentication() {
        this.log('🔐 Checking authentication status', 'info');

        try {
            const envFile = resolve(__dirname, '.env');
            if (!existsSync(envFile)) {
                this.log('⚠️ No .env file found - skipping auth refresh', 'warning');
                return;
            }

            const envContent = readFileSync(envFile, 'utf8');
            const authStrategy = envContent.match(/AUTH_STRATEGY=(.+)/)?.[1] || 'browser_first';

            if (authStrategy === 'browser_first') {
                // Check browser auth health
                const authHealthFile = resolve(__dirname, 'data/browser-auth-state.json');
                if (existsSync(authHealthFile)) {
                    const authHealth = JSON.parse(readFileSync(authHealthFile, 'utf8'));
                    
                    if (!authHealth.isHealthy) {
                        this.log('🔄 Browser auth unhealthy - attempting refresh', 'warning');
                        await execAsync('node browser-auth-refresh.js --auto', { cwd: __dirname });
                        this.log('✅ Browser auth refresh completed', 'success');
                    }
                }
            }

            this.state.lastAuthCheck = new Date().toISOString();

        } catch (error) {
            this.log(`❌ Auth refresh failed: ${error.message}`, 'error');
        }
    }

    async monitorPerformance() {
        this.log('⚡ Monitoring system performance', 'info');

        try {
            // Check data directory size
            const dataDir = resolve(__dirname, 'data');
            const size = await this.getDirectorySize(dataDir);
            const sizeInMB = (size / 1024 / 1024).toFixed(1);

            if (size > 500 * 1024 * 1024) { // 500MB
                this.log(`🗑️ Data directory large (${sizeInMB}MB) - triggering cleanup`, 'warning');
                await this.performCleanup();
            }

            // Monitor memory usage
            const memUsage = process.memoryUsage();
            const memInMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);

            if (memUsage.heapUsed > 512 * 1024 * 1024) { // 512MB
                this.log(`🧠 High memory usage (${memInMB}MB) - triggering GC`, 'warning');
                if (global.gc) {
                    global.gc();
                    this.log('✅ Garbage collection completed', 'success');
                }
            }

        } catch (error) {
            this.log(`❌ Performance monitoring failed: ${error.message}`, 'error');
        }
    }

    async attemptRecovery(error) {
        this.log(`🚑 Attempting system recovery for: ${error.message}`, 'warning');

        const recoveryActions = [
            {
                name: 'Clear Cache',
                action: () => execAsync('rm -rf data/cache/* data/*.tmp', { cwd: __dirname })
            },
            {
                name: 'Restart Services',
                action: () => this.restartServices()
            },
            {
                name: 'Refresh Dependencies',
                action: () => execAsync('npm install', { cwd: __dirname })
            },
            {
                name: 'Reset Authentication',
                action: () => execAsync('node devx-cli.js auth browser --auto', { cwd: __dirname })
            }
        ];

        let recoverySuccessful = false;

        for (const action of recoveryActions) {
            try {
                this.log(`🔧 Recovery action: ${action.name}`, 'info');
                await action.action();
                this.log(`✅ ${action.name} completed`, 'success');
                
                // Test if recovery was successful
                await this.performHealthCheck();
                if (this.state.lastHealthCheck?.health >= 70) {
                    recoverySuccessful = true;
                    break;
                }
            } catch (recoveryError) {
                this.log(`❌ Recovery action failed: ${action.name} - ${recoveryError.message}`, 'error');
            }
        }

        if (recoverySuccessful) {
            this.log('🎉 System recovery successful', 'success');
            this.state.consecutiveFailures = 0;
        } else {
            this.log('💀 System recovery failed - manual intervention required', 'error');
            this.createIncidentReport(error);
        }
    }

    async restartServices() {
        // Kill any running processes
        for (const process of this.state.runningProcesses) {
            try {
                process.kill('SIGTERM');
            } catch (error) {
                // Process may already be dead
            }
        }
        
        this.state.runningProcesses.clear();
        this.log('🔄 Services restarted', 'info');
    }

    async performCleanup() {
        const cleanupTargets = [
            'data/cache',
            'data/*.tmp',
            'data/ai-enhancement-*.json',
            'coverage/*'
        ];

        for (const target of cleanupTargets) {
            try {
                await execAsync(`rm -rf ${target}`, { cwd: __dirname });
                this.log(`🗑️ Cleaned up: ${target}`, 'info');
            } catch (error) {
                this.log(`⚠️ Cleanup failed for ${target}: ${error.message}`, 'warning');
            }
        }

        this.log('✅ System cleanup completed', 'success');
    }

    createIncidentReport(error) {
        const incident = {
            id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            systemState: {
                consecutiveFailures: this.state.consecutiveFailures,
                lastHealthCheck: this.state.lastHealthCheck,
                lastAuthCheck: this.state.lastAuthCheck
            },
            automationRules: this.automationRules.filter(r => r.enabled).map(r => r.name),
            recommendedActions: [
                'Check system logs for detailed error information',
                'Verify authentication configuration',
                'Ensure all dependencies are properly installed',
                'Consider manual system reset: devx reset --force'
            ]
        };

        const incidentPath = resolve(__dirname, 'data', `incident-report-${incident.id}.json`);
        writeFileSync(incidentPath, JSON.stringify(incident, null, 2));
        
        this.log(`📄 Incident report created: ${incident.id}`, 'info');
    }

    async getDirectorySize(dirPath) {
        if (!existsSync(dirPath)) return 0;
        
        const fs = await import('fs/promises');
        let size = 0;
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = resolve(dirPath, item);
                try {
                    const stats = await fs.stat(itemPath);
                    
                    if (stats.isDirectory()) {
                        size += await this.getDirectorySize(itemPath);
                    } else {
                        size += stats.size;
                    }
                } catch {
                    // Skip inaccessible files
                }
            }
        } catch {
            // Skip inaccessible directories
        }
        
        return size;
    }

    matchesPatterns(filename, patterns) {
        return patterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filename);
        });
    }

    async handleError(rule, error) {
        this.log(`⚠️ Rule error in ${rule.name}: ${error.message}`, 'error');
        
        if (this.config.autoRecovery) {
            const recoveryRule = this.automationRules.find(r => r.trigger === 'error');
            if (recoveryRule) {
                await recoveryRule.action(error);
            }
        }
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString().substring(11, 19);
        const colors_map = {
            info: colors.cyan,
            success: colors.green,
            warning: colors.yellow,
            error: colors.red
        };

        const color = colors_map[level] || colors.cyan;
        console.log(`${color}[${timestamp}] ${message}${colors.reset}`);

        // Write to log file if verbose
        if (this.config.verboseLogging) {
            const logFile = resolve(__dirname, 'data', 'automation.log');
            const logEntry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
            
            try {
                const fs = require('fs');
                fs.appendFileSync(logFile, logEntry);
            } catch (error) {
                // Silently fail - don't break automation for logging issues
            }
        }
    }

    async shutdown() {
        console.log(`\n${colors.yellow}🛑 Shutting down automation engine...${colors.reset}`);
        
        this.state.isRunning = false;

        // Clear all intervals
        for (const rule of this.automationRules) {
            if (rule.intervalId) {
                clearInterval(rule.intervalId);
            }
        }

        // Close file watchers
        for (const watcher of this.state.activeWatchers) {
            watcher.close();
        }

        // Terminate running processes
        for (const process of this.state.runningProcesses) {
            process.kill('SIGTERM');
        }

        console.log(`${colors.green}✅ Automation engine shut down gracefully${colors.reset}`);
        process.exit(0);
    }
}

// CLI Entry Point
if (import.meta.url === `file://${process.argv[1]}`) {
    const automation = new DevXAutomation({
        verbose: process.argv.includes('--verbose'),
        testOnChange: !process.argv.includes('--no-test-on-change'),
        autoHealthCheck: !process.argv.includes('--no-health-check')
    });
    
    automation.start().catch(error => {
        console.error(`${colors.red}Automation engine failed: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

export default DevXAutomation;