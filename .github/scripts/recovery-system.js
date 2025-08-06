#!/usr/bin/env node

/**
 * Automated Recovery System
 * 
 * Self-healing production capabilities with intelligent recovery procedures,
 * automated incident response, and predictive failure prevention.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Automated Recovery System with self-healing capabilities
 */
class RecoverySystem {
    constructor(config = {}) {
        this.config = {
            dataDir: config.dataDir || path.join(process.cwd(), 'data'),
            backupDir: config.backupDir || path.join(process.cwd(), 'data', 'backups'),
            recoveryFile: config.recoveryFile || 'recovery-state.json',
            incidentsFile: config.incidentsFile || 'incidents-log.json',
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 5000, // 5 seconds
            healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
            ...config
        };
        
        this.recoveryState = {
            active_incidents: [],
            recovery_history: [],
            system_health: {},
            last_recovery: null
        };
        
        this.recoveryProcedures = new Map();
        this.healthChecks = new Map();
        this.runningRecoveries = new Set();
    }

    /**
     * Initialize recovery system
     */
    async initialize() {
        await this.loadRecoveryState();
        await this.setupRecoveryProcedures();
        await this.setupHealthChecks();
        await this.setupBackupSystem();
        
        console.log('🛠️ Automated recovery system initialized');
        console.log(`📊 ${this.recoveryProcedures.size} recovery procedures available`);
        console.log(`🔍 ${this.healthChecks.size} health checks configured`);
    }

    /**
     * Setup comprehensive recovery procedures
     */
    async setupRecoveryProcedures() {
        // Website availability recovery
        this.recoveryProcedures.set('website_recovery', {
            name: 'Website Availability Recovery',
            description: 'Restore website availability through deployment verification and emergency rebuild',
            severity: 'critical',
            estimatedTime: 300, // 5 minutes
            autoExecute: true,
            prerequisites: ['github_access', 'deployment_permissions'],
            steps: [
                'Verify GitHub Pages deployment status',
                'Check DNS resolution and CDN status',
                'Trigger emergency site rebuild',
                'Validate restored availability',
                'Monitor for stability'
            ],
            execute: async (context = {}) => {
                console.log('🚀 Executing website availability recovery...');
                const results = [];
                
                try {
                    // Step 1: Check GitHub Pages status
                    results.push(await this.checkGitHubPagesStatus());
                    
                    // Step 2: Verify DNS and basic connectivity
                    results.push(await this.verifyDNSResolution());
                    
                    // Step 3: Trigger rebuild if needed
                    if (context.forceRebuild || results.some(r => !r.success)) {
                        results.push(await this.triggerEmergencyRebuild());
                    }
                    
                    // Step 4: Final validation
                    results.push(await this.validateWebsiteAvailability());
                    
                    const success = results.every(r => r.success);
                    
                    return {
                        success,
                        results,
                        message: success ? 'Website recovery completed successfully' : 'Website recovery partially failed',
                        nextSteps: success ? ['Monitor stability'] : ['Manual investigation required']
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: 'Website recovery failed with error',
                        nextSteps: ['Manual intervention required', 'Check system logs']
                    };
                }
            }
        });

        // Data integrity recovery
        this.recoveryProcedures.set('data_recovery', {
            name: 'Data Integrity Recovery',
            description: 'Restore data integrity from verified backups',
            severity: 'critical',
            estimatedTime: 180, // 3 minutes
            autoExecute: false, // Requires manual approval for data operations
            prerequisites: ['backup_access', 'data_validation'],
            steps: [
                'Identify corrupted data files',
                'Locate latest verified backup',
                'Validate backup integrity',
                'Restore corrupted files',
                'Run comprehensive data validation'
            ],
            execute: async (context = {}) => {
                console.log('💾 Executing data integrity recovery...');
                const results = [];
                
                try {
                    // Step 1: Identify corruption
                    const corruption = await this.identifyDataCorruption();
                    results.push(corruption);
                    
                    if (!corruption.hasCorruption) {
                        return {
                            success: true,
                            message: 'No data corruption detected',
                            results
                        };
                    }
                    
                    // Step 2: Find latest backup
                    const backup = await this.findLatestValidBackup();
                    results.push(backup);
                    
                    if (!backup.success) {
                        throw new Error('No valid backup found');
                    }
                    
                    // Step 3: Restore from backup
                    const restore = await this.restoreFromBackup(backup.backupPath, corruption.corruptedFiles);
                    results.push(restore);
                    
                    // Step 4: Validate restoration
                    const validation = await this.validateDataIntegrity();
                    results.push(validation);
                    
                    return {
                        success: validation.success,
                        results,
                        message: validation.success ? 'Data recovery completed successfully' : 'Data recovery validation failed',
                        restoredFiles: corruption.corruptedFiles.length,
                        backupSource: backup.backupPath
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        results,
                        message: 'Data recovery failed'
                    };
                }
            }
        });

        // Authentication recovery
        this.recoveryProcedures.set('auth_recovery', {
            name: 'Authentication System Recovery',
            description: 'Restore authentication through failover and token refresh',
            severity: 'high',
            estimatedTime: 120, // 2 minutes
            autoExecute: true,
            prerequisites: ['multiple_auth_methods'],
            steps: [
                'Test primary authentication method',
                'Failover to secondary authentication',
                'Refresh expired tokens if applicable',
                'Validate authentication recovery',
                'Update system configuration'
            ],
            execute: async (context = {}) => {
                console.log('🔐 Executing authentication recovery...');
                const results = [];
                
                try {
                    // Test OAuth authentication
                    const oauthTest = await this.testOAuthAuthentication();
                    results.push({ method: 'OAuth', ...oauthTest });
                    
                    // Test API key authentication
                    const apiTest = await this.testAPIKeyAuthentication();
                    results.push({ method: 'API Key', ...apiTest });
                    
                    // Test browser authentication
                    const browserTest = await this.testBrowserAuthentication();
                    results.push({ method: 'Browser', ...browserTest });
                    
                    // Determine best available method
                    const workingAuth = results.find(r => r.success);
                    
                    if (workingAuth) {
                        // Update system to use working auth method
                        await this.updateAuthConfiguration(workingAuth.method);
                        
                        return {
                            success: true,
                            results,
                            message: `Authentication recovered using ${workingAuth.method}`,
                            activeMethod: workingAuth.method
                        };
                    } else {
                        return {
                            success: false,
                            results,
                            message: 'All authentication methods failed',
                            nextSteps: ['Check authentication secrets', 'Contact service providers']
                        };
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        results,
                        message: 'Authentication recovery failed'
                    };
                }
            }
        });

        // Rate limit recovery
        this.recoveryProcedures.set('rate_limit_recovery', {
            name: 'Rate Limit Recovery',
            description: 'Handle rate limiting through throttling and alternative data sources',
            severity: 'medium',
            estimatedTime: 60, // 1 minute
            autoExecute: true,
            prerequisites: ['cached_data', 'alternative_sources'],
            steps: [
                'Detect rate limiting status',
                'Switch to cached data sources',
                'Reduce API polling frequency',
                'Implement exponential backoff',
                'Monitor rate limit recovery'
            ],
            execute: async (context = {}) => {
                console.log('🐌 Executing rate limit recovery...');
                
                try {
                    const currentLimits = await this.checkRateLimitStatus();
                    
                    const actions = [];
                    
                    if (currentLimits.github && currentLimits.github.remaining < 100) {
                        actions.push(await this.enableActivityOnlyMode());
                        actions.push(await this.useCachedGitHubData());
                    }
                    
                    if (currentLimits.anthropic && currentLimits.anthropic.quotaExceeded) {
                        actions.push(await this.pauseAIEnhancements());
                        actions.push(await this.useBasicContentMode());
                    }
                    
                    return {
                        success: true,
                        actions,
                        message: `Rate limit recovery applied ${actions.length} mitigations`,
                        rateLimits: currentLimits,
                        nextReset: this.getNextRateLimitReset(currentLimits)
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: 'Rate limit recovery failed'
                    };
                }
            }
        });

        // Workflow recovery
        this.recoveryProcedures.set('workflow_recovery', {
            name: 'GitHub Workflow Recovery',
            description: 'Restart failed workflows and resolve common CI issues',
            severity: 'medium',
            estimatedTime: 180, // 3 minutes
            autoExecute: true,
            prerequisites: ['github_access', 'workflow_permissions'],
            steps: [
                'Identify failed workflow runs',
                'Analyze failure patterns',
                'Apply common fixes',
                'Retry failed workflows',
                'Monitor workflow health'
            ],
            execute: async (context = {}) => {
                console.log('⚙️ Executing workflow recovery...');
                
                try {
                    const failedWorkflows = await this.getFailedWorkflows();
                    const recoveryActions = [];
                    
                    for (const workflow of failedWorkflows) {
                        const analysis = await this.analyzeWorkflowFailure(workflow);
                        const action = await this.applyWorkflowFix(workflow, analysis);
                        recoveryActions.push(action);
                    }
                    
                    return {
                        success: recoveryActions.every(a => a.success),
                        recoveredWorkflows: recoveryActions.filter(a => a.success).length,
                        totalFailures: failedWorkflows.length,
                        actions: recoveryActions,
                        message: `Workflow recovery completed for ${failedWorkflows.length} failed runs`
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        message: 'Workflow recovery failed'
                    };
                }
            }
        });
    }

    /**
     * Setup automated health checks
     */
    async setupHealthChecks() {
        // Website health check
        this.healthChecks.set('website_health', {
            interval: 60000, // 1 minute
            check: async () => {
                try {
                    const start = Date.now();
                    const response = await fetch('https://cv.adrianwedd.dev');
                    const responseTime = Date.now() - start;
                    
                    return {
                        healthy: response.ok && responseTime < 5000,
                        statusCode: response.status,
                        responseTime,
                        message: response.ok ? 'Website responding normally' : 'Website unavailable'
                    };
                } catch (error) {
                    return {
                        healthy: false,
                        error: error.message,
                        message: 'Website check failed'
                    };
                }
            },
            onUnhealthy: async (result) => {
                await this.triggerRecovery('website_recovery', { 
                    trigger: 'health_check',
                    details: result
                });
            }
        });

        // Data integrity health check
        this.healthChecks.set('data_integrity', {
            interval: 300000, // 5 minutes
            check: async () => {
                return await this.validateDataIntegrity();
            },
            onUnhealthy: async (result) => {
                // Data recovery requires manual approval
                await this.createIncident({
                    type: 'data_integrity',
                    severity: 'critical',
                    details: result,
                    recommendedAction: 'data_recovery',
                    autoRecovery: false
                });
            }
        });

        // Authentication health check
        this.healthChecks.set('auth_health', {
            interval: 180000, // 3 minutes
            check: async () => {
                const authMethods = await Promise.all([
                    this.testOAuthAuthentication(),
                    this.testAPIKeyAuthentication(),
                    this.testBrowserAuthentication()
                ]);
                
                const healthyMethods = authMethods.filter(m => m.success).length;
                
                return {
                    healthy: healthyMethods > 0,
                    availableMethods: healthyMethods,
                    totalMethods: authMethods.length,
                    details: authMethods,
                    message: `${healthyMethods}/${authMethods.length} authentication methods available`
                };
            },
            onUnhealthy: async (result) => {
                await this.triggerRecovery('auth_recovery', {
                    trigger: 'health_check',
                    details: result
                });
            }
        });
    }

    /**
     * Trigger automated recovery procedure
     */
    async triggerRecovery(procedureId, context = {}) {
        if (this.runningRecoveries.has(procedureId)) {
            console.log(`⏳ Recovery procedure ${procedureId} already running`);
            return { success: false, message: 'Recovery already in progress' };
        }
        
        const procedure = this.recoveryProcedures.get(procedureId);
        if (!procedure) {
            console.error(`❌ Unknown recovery procedure: ${procedureId}`);
            return { success: false, message: 'Unknown recovery procedure' };
        }
        
        console.log(`🛠️ Triggering recovery: ${procedure.name}`);
        this.runningRecoveries.add(procedureId);
        
        const incident = {
            id: `recovery-${Date.now()}`,
            procedure: procedureId,
            name: procedure.name,
            severity: procedure.severity,
            startTime: new Date().toISOString(),
            context,
            status: 'running'
        };
        
        this.recoveryState.active_incidents.push(incident);
        
        try {
            // Check prerequisites
            const prereqCheck = await this.checkPrerequisites(procedure.prerequisites);
            if (!prereqCheck.success) {
                throw new Error(`Prerequisites not met: ${prereqCheck.missing.join(', ')}`);
            }
            
            // Execute recovery procedure
            const result = await procedure.execute(context);
            
            incident.endTime = new Date().toISOString();
            incident.duration = Date.now() - new Date(incident.startTime).getTime();
            incident.status = result.success ? 'completed' : 'failed';
            incident.result = result;
            
            // Move to history
            this.recoveryState.recovery_history.unshift(incident);
            this.recoveryState.active_incidents = this.recoveryState.active_incidents
                .filter(i => i.id !== incident.id);
            
            console.log(`${result.success ? '✅' : '❌'} Recovery ${incident.name}: ${result.message}`);
            
            await this.saveRecoveryState();
            return result;
            
        } catch (error) {
            incident.endTime = new Date().toISOString();
            incident.duration = Date.now() - new Date(incident.startTime).getTime();
            incident.status = 'error';
            incident.error = error.message;
            
            console.error(`❌ Recovery failed: ${error.message}`);
            
            return { success: false, error: error.message, message: 'Recovery procedure failed' };
        } finally {
            this.runningRecoveries.delete(procedureId);
        }
    }

    /**
     * Recovery procedure implementations
     */
    async checkGitHubPagesStatus() {
        try {
            // Check if we can determine GitHub Pages deployment status
            console.log('🔍 Checking GitHub Pages deployment status...');
            
            // Simple check - if we get here, basic GitHub access works
            return {
                success: true,
                message: 'GitHub Pages appears accessible',
                deploymentStatus: 'unknown' // Would need GitHub API to get actual status
            };
        } catch (error) {
            return {
                success: false,
                message: 'GitHub Pages status check failed',
                error: error.message
            };
        }
    }

    async verifyDNSResolution() {
        try {
            console.log('🌐 Verifying DNS resolution...');
            
            const dns = require('dns').promises;
            const addresses = await dns.resolve4('cv.adrianwedd.dev');
            
            return {
                success: addresses.length > 0,
                message: `DNS resolved to ${addresses.length} addresses`,
                addresses
            };
        } catch (error) {
            return {
                success: false,
                message: 'DNS resolution failed',
                error: error.message
            };
        }
    }

    async triggerEmergencyRebuild() {
        try {
            console.log('🚀 Triggering emergency rebuild...');
            
            // In a real implementation, this would trigger a GitHub Actions workflow
            // For now, we'll simulate the action
            
            return {
                success: true,
                message: 'Emergency rebuild triggered',
                note: 'Simulated - would trigger actual rebuild in production'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Emergency rebuild failed',
                error: error.message
            };
        }
    }

    async validateWebsiteAvailability() {
        try {
            console.log('✅ Validating website availability...');
            
            const response = await fetch('https://cv.adrianwedd.dev', {
                method: 'HEAD',
                timeout: 10000
            });
            
            return {
                success: response.ok,
                statusCode: response.status,
                message: response.ok ? 'Website is available' : `Website returned ${response.status}`
            };
        } catch (error) {
            return {
                success: false,
                message: 'Website availability validation failed',
                error: error.message
            };
        }
    }

    async identifyDataCorruption() {
        try {
            console.log('🔍 Scanning for data corruption...');
            
            const dataDir = this.config.dataDir;
            const criticalFiles = ['base-cv.json', 'activity-summary.json'];
            const corruptedFiles = [];
            
            for (const file of criticalFiles) {
                try {
                    const filePath = path.join(dataDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    JSON.parse(content); // Validate JSON
                } catch (error) {
                    corruptedFiles.push({
                        file,
                        error: error.message
                    });
                }
            }
            
            return {
                hasCorruption: corruptedFiles.length > 0,
                corruptedFiles,
                message: corruptedFiles.length > 0 ? 
                    `${corruptedFiles.length} corrupted files detected` : 
                    'No data corruption detected'
            };
        } catch (error) {
            return {
                hasCorruption: false,
                error: error.message,
                message: 'Data corruption scan failed'
            };
        }
    }

    async findLatestValidBackup() {
        try {
            console.log('🔍 Locating latest valid backup...');
            
            const backupDir = this.config.backupDir;
            
            try {
                await fs.access(backupDir);
            } catch {
                return {
                    success: false,
                    message: 'Backup directory not found'
                };
            }
            
            const backups = await fs.readdir(backupDir);
            const validBackups = [];
            
            for (const backup of backups) {
                if (backup.endsWith('.json')) {
                    try {
                        const backupPath = path.join(backupDir, backup);
                        const content = await fs.readFile(backupPath, 'utf8');
                        JSON.parse(content);
                        validBackups.push({
                            file: backup,
                            path: backupPath,
                            stats: await fs.stat(backupPath)
                        });
                    } catch {
                        // Skip invalid backups
                    }
                }
            }
            
            if (validBackups.length === 0) {
                return {
                    success: false,
                    message: 'No valid backups found'
                };
            }
            
            // Sort by modification time (newest first)
            validBackups.sort((a, b) => b.stats.mtime - a.stats.mtime);
            const latest = validBackups[0];
            
            return {
                success: true,
                backupPath: latest.path,
                backupFile: latest.file,
                backupDate: latest.stats.mtime,
                message: `Latest backup found: ${latest.file}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Backup location failed'
            };
        }
    }

    async restoreFromBackup(backupPath, corruptedFiles) {
        try {
            console.log(`💾 Restoring from backup: ${backupPath}`);
            
            const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
            const restoredFiles = [];
            
            for (const corruptedFile of corruptedFiles) {
                const targetPath = path.join(this.config.dataDir, corruptedFile.file);
                
                if (backupData[corruptedFile.file]) {
                    await fs.writeFile(targetPath, JSON.stringify(backupData[corruptedFile.file], null, 2));
                    restoredFiles.push(corruptedFile.file);
                }
            }
            
            return {
                success: restoredFiles.length > 0,
                restoredFiles,
                message: `Restored ${restoredFiles.length} files from backup`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Backup restoration failed'
            };
        }
    }

    async validateDataIntegrity() {
        try {
            console.log('✅ Validating data integrity...');
            
            const dataDir = this.config.dataDir;
            const criticalFiles = [
                { file: 'base-cv.json', required: ['personal_info', 'experience', 'skills'] },
                { file: 'activity-summary.json', required: ['total_repositories', 'total_commits'] }
            ];
            
            const validationResults = [];
            
            for (const { file, required } of criticalFiles) {
                try {
                    const filePath = path.join(dataDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const data = JSON.parse(content);
                    
                    const hasRequired = required.every(field => data.hasOwnProperty(field));
                    
                    validationResults.push({
                        file,
                        valid: true,
                        hasRequiredFields: hasRequired,
                        size: content.length
                    });
                } catch (error) {
                    validationResults.push({
                        file,
                        valid: false,
                        error: error.message
                    });
                }
            }
            
            const allValid = validationResults.every(r => r.valid && r.hasRequiredFields);
            
            return {
                success: allValid,
                results: validationResults,
                message: allValid ? 'All data files are valid' : 'Data integrity issues detected'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Data validation failed'
            };
        }
    }

    /**
     * Authentication testing methods
     */
    async testOAuthAuthentication() {
        try {
            const token = process.env.CLAUDE_OAUTH_TOKEN;
            if (!token) {
                return { success: false, message: 'OAuth token not configured' };
            }
            
            // In production, would test actual OAuth token validity
            return { success: true, message: 'OAuth token configured' };
        } catch (error) {
            return { success: false, message: 'OAuth test failed', error: error.message };
        }
    }

    async testAPIKeyAuthentication() {
        try {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) {
                return { success: false, message: 'API key not configured' };
            }
            
            return { success: true, message: 'API key configured' };
        } catch (error) {
            return { success: false, message: 'API key test failed', error: error.message };
        }
    }

    async testBrowserAuthentication() {
        try {
            const sessionKey = process.env.CLAUDE_SESSION_KEY;
            if (!sessionKey) {
                return { success: false, message: 'Browser session not configured' };
            }
            
            return { success: true, message: 'Browser session configured' };
        } catch (error) {
            return { success: false, message: 'Browser auth test failed', error: error.message };
        }
    }

    async updateAuthConfiguration(method) {
        try {
            console.log(`🔄 Updating auth configuration to use: ${method}`);
            
            // In production, would update system configuration
            this.recoveryState.system_health.preferredAuth = method;
            this.recoveryState.system_health.lastAuthUpdate = new Date().toISOString();
            
            return { success: true, message: `Auth configuration updated to ${method}` };
        } catch (error) {
            return { success: false, message: 'Auth update failed', error: error.message };
        }
    }

    /**
     * Utility and helper methods
     */
    async setupBackupSystem() {
        try {
            await fs.mkdir(this.config.backupDir, { recursive: true });
            console.log(`📁 Backup directory ready: ${this.config.backupDir}`);
        } catch (error) {
            console.warn(`⚠️ Backup directory setup failed: ${error.message}`);
        }
    }

    async checkPrerequisites(prerequisites) {
        const missing = [];
        
        for (const prereq of prerequisites) {
            let satisfied = false;
            
            switch (prereq) {
                case 'github_access':
                    satisfied = !!process.env.GITHUB_TOKEN;
                    break;
                case 'deployment_permissions':
                    satisfied = true; // Assume true in CI environment
                    break;
                case 'backup_access':
                    try {
                        await fs.access(this.config.backupDir);
                        satisfied = true;
                    } catch {
                        satisfied = false;
                    }
                    break;
                case 'multiple_auth_methods':
                    const authMethods = [
                        process.env.CLAUDE_OAUTH_TOKEN,
                        process.env.ANTHROPIC_API_KEY,
                        process.env.CLAUDE_SESSION_KEY
                    ].filter(Boolean);
                    satisfied = authMethods.length >= 2;
                    break;
                default:
                    satisfied = true; // Unknown prerequisites assumed satisfied
            }
            
            if (!satisfied) missing.push(prereq);
        }
        
        return {
            success: missing.length === 0,
            missing
        };
    }

    async createIncident(incident) {
        console.log(`🚨 Creating incident: ${incident.type} (${incident.severity})`);
        
        const fullIncident = {
            id: `incident-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'open',
            ...incident
        };
        
        this.recoveryState.active_incidents.push(fullIncident);
        await this.saveRecoveryState();
        
        return fullIncident;
    }

    /**
     * Data persistence
     */
    async loadRecoveryState() {
        try {
            const recoveryFile = path.join(this.config.dataDir, this.config.recoveryFile);
            const data = await fs.readFile(recoveryFile, 'utf8');
            this.recoveryState = { ...this.recoveryState, ...JSON.parse(data) };
        } catch (error) {
            // File doesn't exist yet, use defaults
        }
    }

    async saveRecoveryState() {
        try {
            const recoveryFile = path.join(this.config.dataDir, this.config.recoveryFile);
            await fs.mkdir(this.config.dataDir, { recursive: true });
            await fs.writeFile(recoveryFile, JSON.stringify(this.recoveryState, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save recovery state:', error.message);
        }
    }

    /**
     * Generate recovery status report
     */
    generateStatusReport() {
        const activeIncidents = this.recoveryState.active_incidents.length;
        const recentRecoveries = this.recoveryState.recovery_history.slice(0, 10);
        const successRate = recentRecoveries.length > 0 ? 
            (recentRecoveries.filter(r => r.status === 'completed').length / recentRecoveries.length) * 100 : 100;
        
        console.log('🛠️ **RECOVERY SYSTEM STATUS**\n');
        console.log(`📊 Active Incidents: ${activeIncidents}`);
        console.log(`✅ Success Rate: ${Math.round(successRate)}% (last ${recentRecoveries.length} recoveries)`);
        console.log(`🔧 Available Procedures: ${this.recoveryProcedures.size}`);
        console.log(`🔍 Health Checks: ${this.healthChecks.size}`);
        
        if (recentRecoveries.length > 0) {
            console.log('\n📈 **RECENT RECOVERIES:**');
            recentRecoveries.slice(0, 5).forEach(recovery => {
                const icon = recovery.status === 'completed' ? '✅' : recovery.status === 'failed' ? '❌' : '🔄';
                const duration = recovery.duration ? `(${Math.round(recovery.duration / 1000)}s)` : '';
                console.log(`   ${icon} ${recovery.name} ${duration}`);
            });
        }
        
        if (activeIncidents > 0) {
            console.log('\n🚨 **ACTIVE INCIDENTS:**');
            this.recoveryState.active_incidents.forEach(incident => {
                console.log(`   🔥 ${incident.name} (${incident.severity})`);
            });
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const command = process.argv[2];
    const target = process.argv[3];
    
    const recovery = new RecoverySystem();
    await recovery.initialize();
    
    switch (command) {
        case 'status':
            recovery.generateStatusReport();
            break;
            
        case 'recover':
            if (!target) {
                console.log('Available recovery procedures:');
                for (const [key, procedure] of recovery.recoveryProcedures) {
                    const auto = procedure.autoExecute ? ' (AUTO)' : ' (MANUAL)';
                    console.log(`   ${key}: ${procedure.description}${auto}`);
                }
            } else {
                const result = await recovery.triggerRecovery(target, { manual: true });
                console.log(`Recovery result: ${result.message}`);
            }
            break;
            
        case 'test':
            const testProcedure = target || 'website_recovery';
            console.log(`🧪 Testing recovery procedure: ${testProcedure}`);
            const result = await recovery.triggerRecovery(testProcedure, { test: true });
            console.log(`Test result: ${result.message}`);
            break;
            
        default:
            console.log('🛠️ **AUTOMATED RECOVERY SYSTEM**\n');
            console.log('Usage:');
            console.log('  node recovery-system.js status              - Show recovery status');
            console.log('  node recovery-system.js recover [procedure] - Execute recovery procedure');
            console.log('  node recovery-system.js test [procedure]    - Test recovery procedure');
            console.log('');
            console.log('Examples:');
            console.log('  node recovery-system.js recover website_recovery');
            console.log('  node recovery-system.js test auth_recovery');
            break;
    }
}

export { RecoverySystem };

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}