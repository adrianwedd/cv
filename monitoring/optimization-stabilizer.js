#!/usr/bin/env node
/**
 * Optimization Stabilizer - Emergency Performance Recovery System
 * 
 * Prevents optimization conflicts and manages resource contention in the
 * recursive improvement framework through intelligent coordination.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class OptimizationStabilizer {
    constructor(options = {}) {
        this.config = {
            maxConcurrentProcesses: 2,
            optimizationCooldown: 300000, // 5 minutes
            measurementInterval: 300000,   // 5 minutes
            maxRepositorySize: 50 * 1024 * 1024, // 50MB
            maxJsonFiles: 100,
            conflictDetectionEnabled: true,
            autoCleanup: true,
            emergencyMode: false,
            ...options
        };

        this.optimizationHistory = new Map();
        this.activeProcesses = new Map();
        this.performanceBaseline = null;
        this.isStabilizing = false;

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        process.on('SIGINT', () => this.emergencyShutdown());
        process.on('SIGTERM', () => this.emergencyShutdown());
        process.on('uncaughtException', (error) => {
            console.error('🚨 Uncaught exception:', error.message);
            this.emergencyShutdown();
        });
    }

    async emergencyShutdown() {
        console.log('🛑 Emergency shutdown initiated...');
        await this.terminateAllOptimizationProcesses();
        console.log('✅ All optimization processes terminated');
        process.exit(0);
    }

    async start() {
        console.log('🔧 Starting Optimization Stabilizer...');
        
        // Emergency mode: immediate stabilization
        if (this.config.emergencyMode) {
            await this.performEmergencyStabilization();
        }

        // Establish performance baseline
        await this.establishBaseline();

        // Start monitoring and coordination
        await this.startCoordinatedOptimization();
    }

    async performEmergencyStabilization() {
        console.log('🚨 Emergency stabilization mode activated');
        
        // 1. Terminate all running optimization processes
        await this.terminateAllOptimizationProcesses();
        
        // 2. Clean up accumulated data bloat
        if (this.config.autoCleanup) {
            await this.performDataCleanup();
        }
        
        // 3. Reset optimization state
        this.optimizationHistory.clear();
        this.activeProcesses.clear();
        
        console.log('✅ Emergency stabilization completed');
    }

    async terminateAllOptimizationProcesses() {
        const relevantProcesses = [
            'quality-feedback-system.js',
            'recursive-improvement-orchestrator.js', 
            'predictive-maintenance.js',
            'health-monitor.js',
            'automated-alerts.js'
        ];

        for (const processName of relevantProcesses) {
            try {
                await execAsync(`pkill -f "${processName}"`);
                console.log(`🔄 Terminated processes matching: ${processName}`);
            } catch (error) {
                // Process may not be running, which is fine
            }
        }

        // Wait for processes to fully terminate
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async performDataCleanup() {
        console.log('🧹 Performing data cleanup...');
        
        const currentSize = await this.getRepositorySize();
        const jsonFileCount = await this.getJsonFileCount();
        
        console.log(`📊 Current state: ${this.formatSize(currentSize)}, ${jsonFileCount} JSON files`);
        
        if (currentSize > this.config.maxRepositorySize) {
            await this.cleanupMeasurementData();
        }
        
        const newSize = await this.getRepositorySize();
        const newJsonCount = await this.getJsonFileCount();
        
        console.log(`📊 After cleanup: ${this.formatSize(newSize)}, ${newJsonCount} JSON files`);
        console.log(`💾 Space saved: ${this.formatSize(currentSize - newSize)}`);
    }

    async cleanupMeasurementData() {
        const dataDir = process.cwd();
        const cleanupTargets = [
            'quality-history.json',
            'performance-metrics-*.json',
            'optimization-log-*.json',
            'measurement-data-*.json'
        ];

        for (const pattern of cleanupTargets) {
            if (pattern.includes('*')) {
                // Handle wildcard patterns
                const files = await this.findMatchingFiles(dataDir, pattern);
                for (const file of files) {
                    await this.archiveAndCleanFile(file);
                }
            } else {
                const filePath = path.join(dataDir, pattern);
                if (fs.existsSync(filePath)) {
                    await this.archiveAndCleanFile(filePath);
                }
            }
        }
    }

    async archiveAndCleanFile(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const filename = path.basename(filePath);
            
            // Keep only recent data (last 7 days for critical files)
            if (filename.includes('quality-history')) {
                await this.truncateQualityHistory(filePath);
                return;
            }
            
            // Archive large files
            if (stats.size > 1024 * 1024) { // 1MB
                const archiveDir = path.join(path.dirname(filePath), 'archive');
                if (!fs.existsSync(archiveDir)) {
                    fs.mkdirSync(archiveDir, { recursive: true });
                }
                
                const archivePath = path.join(archiveDir, `${filename}.${Date.now()}`);
                fs.renameSync(filePath, archivePath);
                console.log(`📦 Archived: ${filename} -> archive/`);
            }
        } catch (error) {
            console.warn(`⚠️ Could not clean file ${filePath}:`, error.message);
        }
    }

    async truncateQualityHistory(filePath) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(data)) {
                // Keep only last 50 measurements (roughly 4 hours at 5-min intervals)
                const recentData = data.slice(-50);
                fs.writeFileSync(filePath, JSON.stringify(recentData, null, 2));
                console.log(`🔄 Truncated quality history: ${data.length} -> ${recentData.length} measurements`);
            }
        } catch (error) {
            console.warn(`⚠️ Could not truncate quality history:`, error.message);
        }
    }

    async establishBaseline() {
        console.log('📊 Establishing performance baseline...');
        
        try {
            // Measure current Core Web Vitals
            const baseline = await this.measurePerformance();
            this.performanceBaseline = {
                ...baseline,
                timestamp: Date.now(),
                repositorySize: await this.getRepositorySize(),
                jsonFileCount: await this.getJsonFileCount()
            };
            
            console.log('📋 Performance Baseline:');
            console.log(`   FCP: ${baseline.coreWebVitals.fcp.toFixed(1)}ms`);
            console.log(`   LCP: ${baseline.coreWebVitals.lcp.toFixed(1)}ms`);
            console.log(`   CLS: ${baseline.coreWebVitals.cls.toFixed(3)}`);
            console.log(`   Overall Score: ${baseline.overallScore}/100`);
            console.log(`   Repository Size: ${this.formatSize(this.performanceBaseline.repositorySize)}`);
            
        } catch (error) {
            console.warn('⚠️ Could not establish baseline:', error.message);
            this.performanceBaseline = { overallScore: 0, timestamp: Date.now() };
        }
    }

    async startCoordinatedOptimization() {
        console.log('🎯 Starting coordinated optimization system...');
        
        // Start single-instance optimization process with conflict prevention
        setTimeout(() => this.runOptimizationCycle(), 5000); // Initial delay
        
        // Schedule regular coordination checks
        setInterval(() => this.coordinateOptimizations(), this.config.measurementInterval);
        
        console.log('✅ Optimization Stabilizer is running');
        console.log('   - Conflict detection: enabled');
        console.log(`   - Max concurrent processes: ${this.config.maxConcurrentProcesses}`);
        console.log(`   - Optimization cooldown: ${this.config.optimizationCooldown/1000}s`);
        console.log('   - Press Ctrl+C for graceful shutdown');
    }

    async coordinateOptimizations() {
        if (this.isStabilizing) return;
        
        try {
            this.isStabilizing = true;
            
            // 1. Check for resource limits
            const resourceCheck = await this.checkResourceLimits();
            if (!resourceCheck.passed) {
                console.log(`⚠️ Resource limits exceeded: ${resourceCheck.reason}`);
                await this.performDataCleanup();
                return;
            }
            
            // 2. Detect and terminate duplicate processes
            await this.manageDuplicateProcesses();
            
            // 3. Measure current performance
            const currentMetrics = await this.measurePerformance();
            
            // 4. Check for performance regressions
            const regressionCheck = this.detectPerformanceRegression(currentMetrics);
            if (regressionCheck.detected) {
                console.log(`📉 Performance regression detected: ${regressionCheck.metric} degraded by ${regressionCheck.percentage}%`);
                // Skip optimization this cycle to prevent further degradation
                return;
            }
            
            // 5. Run optimization if conditions are favorable
            await this.runOptimizationCycle();
            
        } catch (error) {
            console.error('❌ Coordination error:', error.message);
        } finally {
            this.isStabilizing = false;
        }
    }

    async runOptimizationCycle() {
        const activeCount = this.activeProcesses.size;
        
        if (activeCount >= this.config.maxConcurrentProcesses) {
            console.log(`⏸️ Skipping optimization: ${activeCount} processes already active`);
            return;
        }
        
        // Start quality feedback system with stabilization
        await this.startStabilizedQualitySystem();
    }

    async startStabilizedQualitySystem() {
        const processId = 'quality-system-stabilized';
        
        // Check optimization cooldown
        if (this.optimizationHistory.has('quality-optimization')) {
            const lastRun = this.optimizationHistory.get('quality-optimization');
            const timeSince = Date.now() - lastRun;
            
            if (timeSince < this.config.optimizationCooldown) {
                const waitTime = Math.ceil((this.config.optimizationCooldown - timeSince) / 1000);
                console.log(`⏳ Quality optimization on cooldown: ${waitTime}s remaining`);
                return;
            }
        }
        
        if (this.activeProcesses.has(processId)) {
            console.log('⏸️ Quality system already running');
            return;
        }
        
        console.log('🎯 Starting stabilized quality feedback system...');
        
        const childProcess = spawn('node', ['quality-feedback-system.js'], {
            stdio: 'inherit',
            env: {
                ...process.env,
                OPTIMIZATION_STABILIZER: 'true',
                MAX_ITERATIONS: '3',
                MEASUREMENT_INTERVAL: this.config.measurementInterval.toString()
            }
        });
        
        this.activeProcesses.set(processId, {
            process: childProcess,
            startTime: Date.now(),
            type: 'quality-optimization'
        });
        
        this.optimizationHistory.set('quality-optimization', Date.now());
        
        childProcess.on('exit', (code) => {
            this.activeProcesses.delete(processId);
            console.log(`✅ Quality system completed with code: ${code}`);
        });
        
        // Auto-terminate after reasonable time to prevent runaway processes
        setTimeout(() => {
            if (this.activeProcesses.has(processId)) {
                console.log('⏰ Auto-terminating long-running quality system...');
                childProcess.kill('SIGTERM');
                this.activeProcesses.delete(processId);
            }
        }, 600000); // 10 minutes max
    }

    async manageDuplicateProcesses() {
        try {
            const { stdout } = await execAsync('ps aux | grep -E "(quality|improvement|orchestrator)" | grep node | grep -v grep');
            const processes = stdout.trim().split('\n').filter(line => line.length > 0);
            
            if (processes.length > this.config.maxConcurrentProcesses) {
                console.log(`⚠️ Detected ${processes.length} optimization processes (max: ${this.config.maxConcurrentProcesses})`);
                
                // Terminate excess processes (keep newest)
                const processData = processes.map(line => {
                    const parts = line.trim().split(/\s+/);
                    return { pid: parts[1], command: line };
                }).slice(this.config.maxConcurrentProcesses);
                
                for (const proc of processData) {
                    try {
                        process.kill(proc.pid, 'SIGTERM');
                        console.log(`🔄 Terminated excess process: PID ${proc.pid}`);
                    } catch (error) {
                        // Process may have already terminated
                    }
                }
            }
        } catch (error) {
            // No processes found or other error - this is often normal
        }
    }

    detectPerformanceRegression(currentMetrics) {
        if (!this.performanceBaseline || !currentMetrics) {
            return { detected: false };
        }
        
        const baseline = this.performanceBaseline;
        const current = currentMetrics;
        
        // Check for significant degradations (>15%)
        const regressionThreshold = 0.15;
        
        const checks = [
            {
                metric: 'FCP',
                baseline: baseline.coreWebVitals?.fcp || 0,
                current: current.coreWebVitals?.fcp || 0,
                lowerIsBetter: true
            },
            {
                metric: 'LCP', 
                baseline: baseline.coreWebVitals?.lcp || 0,
                current: current.coreWebVitals?.lcp || 0,
                lowerIsBetter: true
            },
            {
                metric: 'Overall Score',
                baseline: baseline.overallScore || 0,
                current: current.overallScore || 0,
                lowerIsBetter: false
            }
        ];
        
        for (const check of checks) {
            if (check.baseline === 0) continue;
            
            const change = (check.current - check.baseline) / check.baseline;
            const isRegression = check.lowerIsBetter ? change > regressionThreshold : change < -regressionThreshold;
            
            if (isRegression) {
                return {
                    detected: true,
                    metric: check.metric,
                    percentage: Math.abs(change * 100).toFixed(1),
                    baseline: check.baseline,
                    current: check.current
                };
            }
        }
        
        return { detected: false };
    }

    async checkResourceLimits() {
        const currentSize = await this.getRepositorySize();
        const jsonFileCount = await this.getJsonFileCount();
        
        if (currentSize > this.config.maxRepositorySize) {
            return {
                passed: false,
                reason: `Repository size (${this.formatSize(currentSize)}) exceeds limit (${this.formatSize(this.config.maxRepositorySize)})`
            };
        }
        
        if (jsonFileCount > this.config.maxJsonFiles) {
            return {
                passed: false,
                reason: `JSON file count (${jsonFileCount}) exceeds limit (${this.config.maxJsonFiles})`
            };
        }
        
        return { passed: true };
    }

    async measurePerformance() {
        // Simple performance measurement using existing data
        try {
            const qualityReportPath = path.join(process.cwd(), 'quality-report.json');
            if (fs.existsSync(qualityReportPath)) {
                const data = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));
                return {
                    overallScore: data.overview?.overallScore || 0,
                    coreWebVitals: data.currentMetrics?.coreWebVitals || {},
                    timestamp: Date.now()
                };
            }
        } catch (error) {
            console.warn('⚠️ Could not measure performance:', error.message);
        }
        
        return {
            overallScore: 0,
            coreWebVitals: { fcp: 0, lcp: 0, cls: 0, fid: 0 },
            timestamp: Date.now()
        };
    }

    async getRepositorySize() {
        try {
            const { stdout } = await execAsync('du -s . 2>/dev/null || echo "0"');
            const sizeKB = parseInt(stdout.split('\t')[0]) || 0;
            return sizeKB * 1024; // Convert to bytes
        } catch (error) {
            return 0;
        }
    }

    async getJsonFileCount() {
        try {
            const { stdout } = await execAsync('find . -name "*.json" -type f | wc -l');
            return parseInt(stdout.trim()) || 0;
        } catch (error) {
            return 0;
        }
    }

    async findMatchingFiles(dir, pattern) {
        try {
            const { stdout } = await execAsync(`find "${dir}" -name "${pattern}" -type f`);
            return stdout.trim().split('\n').filter(line => line.length > 0);
        } catch (error) {
            return [];
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const emergencyMode = args.includes('--emergency') || args.includes('-e');
    const autoCleanup = !args.includes('--no-cleanup');
    
    const stabilizer = new OptimizationStabilizer({
        emergencyMode,
        autoCleanup,
        maxConcurrentProcesses: 2,
        optimizationCooldown: 300000, // 5 minutes
        measurementInterval: 300000   // 5 minutes
    });
    
    console.log('🔧 Optimization Stabilizer v1.0');
    console.log(`   Emergency mode: ${emergencyMode ? 'ON' : 'OFF'}`);
    console.log(`   Auto cleanup: ${autoCleanup ? 'ON' : 'OFF'}`);
    console.log('');
    
    stabilizer.start().catch(error => {
        console.error('❌ Stabilizer failed to start:', error.message);
        process.exit(1);
    });
}

module.exports = OptimizationStabilizer;