#!/usr/bin/env node

/**
 * Recursive Improvement Orchestrator
 * Master control system that coordinates all improvement systems
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class RecursiveImprovementOrchestrator {
    constructor() {
        this.systems = new Map();
        this.metrics = {
            improvementsImplemented: 0,
            qualityScore: 0,
            systemHealth: 0,
            predictionAccuracy: 0,
            automationLevel: 0
        };
        this.isRunning = false;
        this.startTime = new Date();
    }

    async initialize() {
        console.log('🚀 Initializing Recursive Improvement Orchestrator...');
        
        // Register improvement systems
        this.registerSystems();
        
        // Load system configuration
        await this.loadConfiguration();
        
        // Initialize metrics tracking
        await this.initializeMetrics();
        
        console.log('✅ Recursive Improvement Orchestrator ready');
        console.log(`📊 Managing ${this.systems.size} improvement systems`);
    }

    registerSystems() {
        this.systems.set('quality-feedback', {
            name: 'Quality Feedback System',
            script: 'quality-feedback-system.js',
            status: 'stopped',
            process: null,
            metrics: ['qualityScore', 'improvementsImplemented'],
            priority: 'high',
            restartOnFailure: true
        });

        this.systems.set('predictive-maintenance', {
            name: 'Predictive Maintenance System', 
            script: 'predictive-maintenance.js',
            status: 'stopped',
            process: null,
            metrics: ['predictionAccuracy', 'maintenanceScheduled'],
            priority: 'high',
            restartOnFailure: true
        });

        this.systems.set('performance-monitor', {
            name: 'Performance Monitor',
            script: 'health-monitor.js',
            status: 'stopped',
            process: null,
            metrics: ['systemHealth', 'performanceScore'],
            priority: 'medium',
            restartOnFailure: false
        });

        this.systems.set('langsmith-proxy', {
            name: 'LangSmith Telemetry Proxy',
            command: 'npm start',
            workingDir: 'monitoring/langsmith-proxy',
            status: 'stopped',
            process: null,
            metrics: ['telemetryEvents', 'dataQuality'],
            priority: 'medium',
            restartOnFailure: true
        });
    }

    async loadConfiguration() {
        try {
            const configPath = path.join(__dirname, 'orchestrator-config.json');
            const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
            this.config = { ...this.getDefaultConfig(), ...config };
        } catch (error) {
            console.log('📝 No configuration found, using defaults');
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            improvementInterval: 60000,      // 1 minute
            healthCheckInterval: 30000,      // 30 seconds
            metricsCollection: 15000,        // 15 seconds
            autoRestart: true,
            maxRestartAttempts: 3,
            qualityThreshold: 95,
            performanceThreshold: 90,
            enableLearning: true,
            enablePrediction: true,
            emergencyShutdownScore: 50
        };
    }

    async initializeMetrics() {
        this.metrics = {
            improvementsImplemented: 0,
            qualityScore: 0,
            systemHealth: 100,
            predictionAccuracy: 0,
            automationLevel: 85,
            uptime: 0,
            totalOptimizations: 0,
            errorRate: 0,
            learningEfficiency: 0
        };

        // Start metrics collection
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.metricsCollection);
    }

    async startAllSystems() {
        console.log('🎯 Starting all improvement systems...');
        
        const startPromises = Array.from(this.systems.entries()).map(async ([key, system]) => {
            try {
                await this.startSystem(key);
                console.log(`✅ Started: ${system.name}`);
                return { key, success: true };
            } catch (error) {
                console.error(`❌ Failed to start ${system.name}:`, error.message);
                return { key, success: false, error: error.message };
            }
        });

        const results = await Promise.all(startPromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`🎯 System startup: ${successful} successful, ${failed} failed`);
        
        if (successful > 0) {
            this.isRunning = true;
            await this.startOrchestrationCycle();
        }
    }

    async startSystem(systemKey) {
        const system = this.systems.get(systemKey);
        if (!system) throw new Error(`System ${systemKey} not found`);

        if (system.status === 'running') {
            console.log(`⚠️ System ${system.name} already running`);
            return;
        }

        console.log(`🚀 Starting ${system.name}...`);

        try {
            if (system.command) {
                // Start with custom command (e.g., npm start)
                const [cmd, ...args] = system.command.split(' ');
                const options = {
                    cwd: system.workingDir ? path.join(__dirname, system.workingDir) : __dirname,
                    stdio: ['ignore', 'pipe', 'pipe']
                };
                
                system.process = spawn(cmd, args, options);
            } else {
                // Start Node.js script
                system.process = spawn('node', [system.script, 'start'], {
                    cwd: __dirname,
                    stdio: ['ignore', 'pipe', 'pipe']
                });
            }

            system.process.stdout.on('data', (data) => {
                console.log(`[${systemKey}] ${data.toString().trim()}`);
            });

            system.process.stderr.on('data', (data) => {
                console.error(`[${systemKey}] ERROR: ${data.toString().trim()}`);
            });

            system.process.on('exit', (code) => {
                console.log(`[${systemKey}] Process exited with code ${code}`);
                system.status = 'stopped';
                system.process = null;

                if (system.restartOnFailure && this.isRunning && code !== 0) {
                    console.log(`🔄 Auto-restarting ${system.name}...`);
                    setTimeout(() => {
                        this.startSystem(systemKey);
                    }, 5000);
                }
            });

            system.status = 'running';
            system.startedAt = new Date().toISOString();
            system.restartCount = (system.restartCount || 0);

        } catch (error) {
            system.status = 'failed';
            system.error = error.message;
            throw error;
        }
    }

    async stopSystem(systemKey) {
        const system = this.systems.get(systemKey);
        if (!system || !system.process) return;

        console.log(`🛑 Stopping ${system.name}...`);
        system.process.kill('SIGTERM');
        
        // Give it 5 seconds to gracefully shut down
        setTimeout(() => {
            if (system.process && !system.process.killed) {
                system.process.kill('SIGKILL');
            }
        }, 5000);

        system.status = 'stopped';
        system.process = null;
    }

    async stopAllSystems() {
        console.log('🛑 Stopping all systems...');
        
        const stopPromises = Array.from(this.systems.keys()).map(key => this.stopSystem(key));
        await Promise.all(stopPromises);
        
        this.isRunning = false;
        
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
    }

    async startOrchestrationCycle() {
        console.log('🔄 Starting recursive improvement orchestration...');

        const orchestrationCycle = async () => {
            try {
                // Collect system metrics
                await this.collectMetrics();
                
                // Analyze system performance
                const analysis = await this.analyzeSystemPerformance();
                
                // Make improvement decisions
                const decisions = await this.makeImprovementDecisions(analysis);
                
                // Execute improvements
                await this.executeImprovements(decisions);
                
                // Learn from results
                await this.learnFromResults(decisions);
                
                // Generate status report
                await this.generateStatusReport();
                
                // Schedule next cycle
                if (this.isRunning) {
                    setTimeout(orchestrationCycle, this.config.improvementInterval);
                }

            } catch (error) {
                console.error('❌ Error in orchestration cycle:', error.message);
                if (this.isRunning) {
                    setTimeout(orchestrationCycle, this.config.improvementInterval * 2);
                }
            }
        };

        // Start first cycle
        await orchestrationCycle();
    }

    async collectMetrics() {
        try {
            // Update uptime
            this.metrics.uptime = Math.round((new Date() - this.startTime) / 1000 / 60); // minutes

            // Collect quality metrics
            try {
                const qualityReport = JSON.parse(await fs.readFile('quality-report.json', 'utf8'));
                this.metrics.qualityScore = qualityReport.overview?.overallScore || 0;
            } catch (e) { /* ignore */ }

            // Collect system health
            const runningSystemsCount = Array.from(this.systems.values()).filter(s => s.status === 'running').length;
            this.metrics.systemHealth = Math.round((runningSystemsCount / this.systems.size) * 100);

            // Calculate automation level
            this.metrics.automationLevel = Math.min(100, 
                (this.metrics.improvementsImplemented * 5) + 
                (this.metrics.systemHealth * 0.5) + 
                (this.metrics.qualityScore * 0.3)
            );

        } catch (error) {
            console.error('❌ Error collecting metrics:', error.message);
        }
    }

    async analyzeSystemPerformance() {
        const analysis = {
            overallHealth: this.metrics.systemHealth,
            qualityTrend: this.calculateQualityTrend(),
            systemStability: this.calculateSystemStability(),
            improvementVelocity: this.calculateImprovementVelocity(),
            recommendations: []
        };

        // Generate recommendations based on analysis
        if (analysis.overallHealth < 80) {
            analysis.recommendations.push({
                type: 'system-health',
                priority: 'high',
                action: 'restart_failed_systems',
                description: 'System health below threshold, restart failed systems'
            });
        }

        if (this.metrics.qualityScore < this.config.qualityThreshold) {
            analysis.recommendations.push({
                type: 'quality',
                priority: 'medium',
                action: 'optimize_quality',
                description: 'Quality score below threshold, initiate optimization'
            });
        }

        if (this.metrics.improvementsImplemented === 0 && this.metrics.uptime > 10) {
            analysis.recommendations.push({
                type: 'stagnation',
                priority: 'medium',
                action: 'trigger_improvements',
                description: 'No improvements detected, trigger optimization cycle'
            });
        }

        return analysis;
    }

    calculateQualityTrend() {
        // Simplified trend calculation
        return this.metrics.qualityScore >= this.config.qualityThreshold ? 'improving' : 'stable';
    }

    calculateSystemStability() {
        const failedSystems = Array.from(this.systems.values()).filter(s => s.status === 'failed').length;
        return Math.max(0, 100 - (failedSystems * 25));
    }

    calculateImprovementVelocity() {
        return this.metrics.uptime > 0 ? this.metrics.improvementsImplemented / this.metrics.uptime : 0;
    }

    async makeImprovementDecisions(analysis) {
        const decisions = [];

        analysis.recommendations.forEach(rec => {
            decisions.push({
                ...rec,
                timestamp: new Date().toISOString(),
                confidence: this.calculateConfidence(rec),
                autoExecute: rec.priority === 'high' || this.config.enableLearning
            });
        });

        // Add autonomous improvement decisions
        if (this.config.enableLearning && this.metrics.qualityScore > 95) {
            decisions.push({
                type: 'autonomous',
                priority: 'low',
                action: 'explore_optimizations',
                description: 'High quality achieved, explore additional optimizations',
                confidence: 0.6,
                autoExecute: true,
                timestamp: new Date().toISOString()
            });
        }

        return decisions;
    }

    calculateConfidence(recommendation) {
        let confidence = 0.7; // Base confidence

        if (recommendation.priority === 'high') confidence += 0.2;
        if (this.metrics.systemHealth > 90) confidence += 0.1;
        if (this.metrics.uptime > 60) confidence += 0.1; // More confidence after 1 hour

        return Math.min(1.0, confidence);
    }

    async executeImprovements(decisions) {
        for (const decision of decisions) {
            if (decision.autoExecute && decision.confidence > 0.5) {
                console.log(`🔧 Executing: ${decision.description}`);
                
                try {
                    await this.executeImprovement(decision);
                    this.metrics.improvementsImplemented++;
                    console.log(`✅ Completed: ${decision.action}`);
                } catch (error) {
                    console.error(`❌ Failed to execute ${decision.action}:`, error.message);
                    this.metrics.errorRate++;
                }
            }
        }
    }

    async executeImprovement(decision) {
        switch (decision.action) {
            case 'restart_failed_systems':
                await this.restartFailedSystems();
                break;
            case 'optimize_quality':
                await this.triggerQualityOptimization();
                break;
            case 'trigger_improvements':
                await this.triggerSystemImprovements();
                break;
            case 'explore_optimizations':
                await this.exploreOptimizations();
                break;
            default:
                console.log(`⚠️ Unknown improvement action: ${decision.action}`);
        }
    }

    async restartFailedSystems() {
        const failedSystems = Array.from(this.systems.entries())
            .filter(([key, system]) => system.status === 'failed' || system.status === 'stopped');

        for (const [key, system] of failedSystems) {
            if (system.priority === 'high') {
                await this.startSystem(key);
            }
        }
    }

    async triggerQualityOptimization() {
        // Simulate triggering additional quality optimizations
        console.log('📈 Triggering quality optimization cycle...');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async triggerSystemImprovements() {
        // Simulate triggering system-wide improvements
        console.log('⚡ Triggering system improvements...');
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    async exploreOptimizations() {
        // Simulate exploring new optimization opportunities
        console.log('🔍 Exploring new optimization opportunities...');
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    async learnFromResults(decisions) {
        // Learn from the executed decisions to improve future decisions
        if (!this.config.enableLearning) return;

        const successfulDecisions = decisions.filter(d => d.autoExecute && !d.failed);
        const failedDecisions = decisions.filter(d => d.autoExecute && d.failed);

        this.metrics.learningEfficiency = successfulDecisions.length > 0 ? 
            (successfulDecisions.length / decisions.length) * 100 : 0;

        // Store learning data for future reference
        const learningData = {
            timestamp: new Date().toISOString(),
            successfulPatterns: successfulDecisions.map(d => ({ type: d.type, action: d.action })),
            failurePatterns: failedDecisions.map(d => ({ type: d.type, action: d.action, error: d.error })),
            metrics: { ...this.metrics }
        };

        try {
            await fs.writeFile('learning-data.json', JSON.stringify(learningData, null, 2));
        } catch (error) {
            console.error('❌ Failed to save learning data:', error.message);
        }
    }

    async generateStatusReport() {
        const report = {
            timestamp: new Date().toISOString(),
            orchestrator: {
                running: this.isRunning,
                uptime: this.metrics.uptime,
                improvementsImplemented: this.metrics.improvementsImplemented
            },
            systems: Object.fromEntries(
                Array.from(this.systems.entries()).map(([key, system]) => [
                    key, {
                        name: system.name,
                        status: system.status,
                        priority: system.priority,
                        startedAt: system.startedAt,
                        restartCount: system.restartCount || 0
                    }
                ])
            ),
            metrics: this.metrics,
            performance: {
                qualityScore: this.metrics.qualityScore,
                systemHealth: this.metrics.systemHealth,
                automationLevel: this.metrics.automationLevel,
                learningEfficiency: this.metrics.learningEfficiency
            }
        };

        await fs.writeFile('orchestrator-status.json', JSON.stringify(report, null, 2));
        
        // Log summary every 10 cycles (10 minutes by default)
        if (this.metrics.uptime % 10 === 0) {
            console.log(`📊 Status: Quality ${this.metrics.qualityScore}/100, Health ${this.metrics.systemHealth}%, Improvements ${this.metrics.improvementsImplemented}`);
        }
    }

    async getStatus() {
        const systemStatuses = Object.fromEntries(
            Array.from(this.systems.entries()).map(([key, system]) => [
                key, system.status
            ])
        );

        return {
            orchestrator: {
                running: this.isRunning,
                uptime: this.metrics.uptime,
                startTime: this.startTime.toISOString()
            },
            systems: systemStatuses,
            metrics: this.metrics,
            summary: {
                totalSystems: this.systems.size,
                runningSystems: Object.values(systemStatuses).filter(s => s === 'running').length,
                overallScore: Math.round((this.metrics.qualityScore + this.metrics.systemHealth + this.metrics.automationLevel) / 3)
            }
        };
    }
}

// CLI usage
if (require.main === module) {
    const orchestrator = new RecursiveImprovementOrchestrator();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'start';
    
    switch (command) {
        case 'start':
            orchestrator.initialize().then(() => {
                orchestrator.startAllSystems();
                
                // Graceful shutdown
                process.on('SIGINT', () => {
                    console.log('\n👋 Shutting down recursive improvement orchestrator...');
                    orchestrator.stopAllSystems().then(() => {
                        process.exit(0);
                    });
                });
                
                console.log('🎯 Recursive Improvement Orchestrator running. Press Ctrl+C to stop.');
            });
            break;
            
        case 'status':
            orchestrator.initialize().then(async () => {
                const status = await orchestrator.getStatus();
                console.log('🎯 Orchestrator Status:');
                console.log(JSON.stringify(status, null, 2));
            });
            break;
            
        case 'stop':
            console.log('🛑 Stopping all systems...');
            orchestrator.initialize().then(() => {
                orchestrator.stopAllSystems();
            });
            break;
            
        default:
            console.log('Recursive Improvement Orchestrator Commands:');
            console.log('  start  - Start all improvement systems');
            console.log('  status - Show orchestrator status');
            console.log('  stop   - Stop all systems');
    }
}

module.exports = RecursiveImprovementOrchestrator;