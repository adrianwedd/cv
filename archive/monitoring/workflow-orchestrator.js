#!/usr/bin/env node

/**
 * Workflow Orchestration System
 * 
 * Prevents concurrent workflow conflicts through distributed locking,
 * implements serialization, and provides automated recovery mechanisms.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Distributed workflow lock manager
 */
class WorkflowOrchestrator {
    constructor(config = {}) {
        this.config = {
            lockDir: config.lockDir || path.join(process.cwd(), 'data', 'locks'),
            maxLockAge: config.maxLockAge || 3600000, // 1 hour default
            retryInterval: config.retryInterval || 5000, // 5 seconds
            maxRetries: config.maxRetries || 12, // 1 minute total
            ...config
        };
    }

    /**
     * Initialize orchestrator and ensure lock directory exists
     */
    async initialize() {
        try {
            await fs.mkdir(this.config.lockDir, { recursive: true });
            console.log('🔒 Workflow orchestrator initialized');
            
            // Clean up stale locks on startup
            await this.cleanupStaleLocks();
        } catch (error) {
            console.error('❌ Failed to initialize workflow orchestrator:', error.message);
            throw error;
        }
    }

    /**
     * Acquire distributed lock for workflow
     */
    async acquireLock(workflowName, metadata = {}) {
        const lockFile = path.join(this.config.lockDir, `${workflowName}.lock`);
        const lockData = {
            workflowName,
            pid: process.pid,
            hostname: process.env.GITHUB_RUNNER_NAME || 'local',
            runId: process.env.GITHUB_RUN_ID || 'local-' + Date.now(),
            acquiredAt: new Date().toISOString(),
            metadata
        };

        let retries = 0;
        while (retries < this.config.maxRetries) {
            try {
                // Check if lock already exists
                try {
                    const existingLock = await fs.readFile(lockFile, 'utf8');
                    const lockInfo = JSON.parse(existingLock);
                    
                    // Check if lock is stale
                    const lockAge = Date.now() - new Date(lockInfo.acquiredAt).getTime();
                    if (lockAge > this.config.maxLockAge) {
                        console.log(`🕒 Removing stale lock for ${workflowName} (age: ${Math.round(lockAge / 60000)}min)`);
                        await fs.unlink(lockFile);
                    } else {
                        console.log(`⏱️ Workflow ${workflowName} locked by run ${lockInfo.runId}, waiting...`);
                        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval));
                        retries++;
                        continue;
                    }
                } catch (readError) {
                    // Lock file doesn't exist, proceed to create
                }

                // Create lock atomically
                await fs.writeFile(lockFile, JSON.stringify(lockData, null, 2), { flag: 'wx' });
                console.log(`🔒 Acquired lock for workflow: ${workflowName}`);
                return {
                    workflowName,
                    lockFile,
                    lockData,
                    release: () => this.releaseLock(lockFile)
                };

            } catch (error) {
                if (error.code === 'EEXIST') {
                    // Another process created the lock, retry
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, this.config.retryInterval));
                } else {
                    throw error;
                }
            }
        }

        throw new Error(`Failed to acquire lock for ${workflowName} after ${this.config.maxRetries} retries`);
    }

    /**
     * Release workflow lock
     */
    async releaseLock(lockFile) {
        try {
            await fs.unlink(lockFile);
            console.log(`🔓 Released workflow lock: ${path.basename(lockFile)}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('⚠️ Failed to release lock:', error.message);
            }
        }
    }

    /**
     * Clean up stale locks
     */
    async cleanupStaleLocks() {
        try {
            const lockFiles = await fs.readdir(this.config.lockDir);
            let cleaned = 0;

            for (const lockFile of lockFiles) {
                if (!lockFile.endsWith('.lock')) continue;

                const lockPath = path.join(this.config.lockDir, lockFile);
                try {
                    const lockData = JSON.parse(await fs.readFile(lockPath, 'utf8'));
                    const lockAge = Date.now() - new Date(lockData.acquiredAt).getTime();

                    if (lockAge > this.config.maxLockAge) {
                        await fs.unlink(lockPath);
                        cleaned++;
                        console.log(`🧹 Cleaned stale lock: ${lockFile} (age: ${Math.round(lockAge / 60000)}min)`);
                    }
                } catch (error) {
                    // Invalid lock file, remove it
                    await fs.unlink(lockPath);
                    cleaned++;
                    console.log(`🧹 Removed invalid lock file: ${lockFile}`);
                }
            }

            if (cleaned > 0) {
                console.log(`✅ Cleaned ${cleaned} stale lock(s)`);
            }
        } catch (error) {
            console.error('⚠️ Failed to cleanup stale locks:', error.message);
        }
    }

    /**
     * Execute workflow with distributed locking
     */
    async executeWithLock(workflowName, workflowFunction, metadata = {}) {
        let lock = null;
        try {
            await this.initialize();
            lock = await this.acquireLock(workflowName, metadata);
            
            console.log(`🚀 Executing workflow: ${workflowName}`);
            const startTime = Date.now();
            
            const result = await workflowFunction();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Workflow ${workflowName} completed in ${duration}ms`);
            
            return result;
        } catch (error) {
            console.error(`❌ Workflow ${workflowName} failed:`, error.message);
            throw error;
        } finally {
            if (lock) {
                await lock.release();
            }
        }
    }

    /**
     * Get current lock status
     */
    async getLockStatus() {
        try {
            const lockFiles = await fs.readdir(this.config.lockDir);
            const locks = [];

            for (const lockFile of lockFiles) {
                if (!lockFile.endsWith('.lock')) continue;

                const lockPath = path.join(this.config.lockDir, lockFile);
                try {
                    const lockData = JSON.parse(await fs.readFile(lockPath, 'utf8'));
                    const lockAge = Date.now() - new Date(lockData.acquiredAt).getTime();
                    
                    locks.push({
                        ...lockData,
                        lockFile,
                        ageMs: lockAge,
                        isStale: lockAge > this.config.maxLockAge
                    });
                } catch (error) {
                    console.warn(`⚠️ Invalid lock file: ${lockFile}`);
                }
            }

            return {
                activeLocks: locks.filter(l => !l.isStale).length,
                staleLocks: locks.filter(l => l.isStale).length,
                locks
            };
        } catch (error) {
            console.error('Failed to get lock status:', error.message);
            return { activeLocks: 0, staleLocks: 0, locks: [] };
        }
    }
}

/**
 * Environment detection for CI vs browser operations
 */
class EnvironmentDetector {
    constructor() {
        this.isCI = !!(
            process.env.CI ||
            process.env.GITHUB_ACTIONS ||
            process.env.GITLAB_CI ||
            process.env.TRAVIS ||
            process.env.JENKINS_URL
        );
        
        this.isGitHubActions = !!process.env.GITHUB_ACTIONS;
        this.isBrowser = typeof window !== 'undefined';
        this.runnerType = this.detectRunnerType();
    }

    detectRunnerType() {
        if (this.isBrowser) return 'browser';
        if (process.env.GITHUB_ACTIONS) return 'github-actions';
        if (process.env.GITLAB_CI) return 'gitlab-ci';
        if (process.env.TRAVIS) return 'travis';
        if (process.env.JENKINS_URL) return 'jenkins';
        return 'local';
    }

    getEnvironmentConfig() {
        const config = {
            isCI: this.isCI,
            runnerType: this.runnerType,
            timeout: 300000, // 5 minutes default
            retryAttempts: 3,
            headless: true
        };

        // CI-specific configurations
        if (this.isGitHubActions) {
            config.timeout = 600000; // 10 minutes in CI
            config.retryAttempts = 2; // Fewer retries in CI
            config.headless = true; // Always headless in CI
            config.authStrategy = process.env.AUTH_STRATEGY || 'browser_first';
        }

        // Browser-specific configurations
        if (!this.isCI) {
            config.timeout = 120000; // 2 minutes locally
            config.retryAttempts = 5; // More retries locally
            config.headless = false; // Visible browser for debugging
        }

        return config;
    }

    logEnvironmentInfo() {
        console.log('🔍 Environment Detection:');
        console.log(`  - Runner Type: ${this.runnerType}`);
        console.log(`  - CI Environment: ${this.isCI}`);
        console.log(`  - GitHub Actions: ${this.isGitHubActions}`);
        console.log(`  - Process PID: ${process.pid}`);
        
        if (this.isGitHubActions) {
            console.log(`  - Run ID: ${process.env.GITHUB_RUN_ID}`);
            console.log(`  - Runner Name: ${process.env.GITHUB_RUNNER_NAME}`);
            console.log(`  - Workflow: ${process.env.GITHUB_WORKFLOW}`);
        }
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    const workflowName = process.argv[3];
    
    const orchestrator = new WorkflowOrchestrator();
    const detector = new EnvironmentDetector();

    try {
        switch (command) {
            case 'lock':
                if (!workflowName) {
                    console.error('Usage: workflow-orchestrator.js lock <workflow-name>');
                    process.exit(1);
                }
                const lock = await orchestrator.acquireLock(workflowName);
                console.log('Lock acquired. Press Ctrl+C to release.');
                process.on('SIGINT', async () => {
                    await lock.release();
                    process.exit(0);
                });
                break;

            case 'status':
                const status = await orchestrator.getLockStatus();
                console.log('🔒 Lock Status:');
                console.log(`  - Active Locks: ${status.activeLocks}`);
                console.log(`  - Stale Locks: ${status.staleLocks}`);
                if (status.locks.length > 0) {
                    console.log('  - Details:');
                    status.locks.forEach(lock => {
                        const age = Math.round(lock.ageMs / 60000);
                        console.log(`    • ${lock.workflowName}: ${lock.runId} (${age}min ${lock.isStale ? 'STALE' : 'active'})`);
                    });
                }
                break;

            case 'cleanup':
                await orchestrator.cleanupStaleLocks();
                break;

            case 'environment':
                detector.logEnvironmentInfo();
                const config = detector.getEnvironmentConfig();
                console.log('⚙️ Environment Configuration:');
                console.log(JSON.stringify(config, null, 2));
                break;

            default:
                console.log('Workflow Orchestrator v1.0.0');
                console.log('');
                console.log('Commands:');
                console.log('  lock <name>    - Acquire distributed lock');
                console.log('  status         - Show lock status');
                console.log('  cleanup        - Clean stale locks');
                console.log('  environment    - Show environment info');
        }
    } catch (error) {
        console.error('❌ Command failed:', error.message);
        process.exit(1);
    }
}

export { WorkflowOrchestrator, EnvironmentDetector };