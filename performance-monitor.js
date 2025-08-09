#!/usr/bin/env node
/**
 * Performance Monitor - Efficient Resource Usage Tracking
 * 
 * Optimized monitoring system that tracks system performance without
 * contributing to resource contention issues.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);

class PerformanceMonitor {
    constructor(options = {}) {
        this.config = {
            monitoringInterval: 60000,    // 1 minute (reduced from 30s)
            alertThresholds: {
                repositorySize: 100 * 1024 * 1024,  // 100MB
                jsonFileCount: 200,
                processCount: 5,
                fcpRegression: 2000,      // 2s FCP threshold
                lcpRegression: 4000,      // 4s LCP threshold  
                qualityDrop: 15           // 15-point quality drop
            },
            retentionPeriod: 86400000,    // 24 hours
            batchSize: 10,
            enableAlerts: true,
            enableTrends: true,
            ...options
        };

        this.metrics = [];
        this.alerts = [];
        this.isRunning = false;
        this.lastCleanup = 0;
    }

    async start() {
        if (this.isRunning) {
            console.log('⚠️ Performance monitor is already running');
            return;
        }

        console.log('📊 Starting Performance Monitor...');
        console.log(`   Monitoring interval: ${this.config.monitoringInterval/1000}s`);
        console.log(`   Data retention: ${this.config.retentionPeriod/3600000}h`);
        console.log(`   Alert thresholds configured: ${Object.keys(this.config.alertThresholds).length}`);

        this.isRunning = true;

        // Initial measurement
        await this.collectMetrics();

        // Start monitoring loop
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
                await this.processAlerts();
                await this.cleanupOldData();
            } catch (error) {
                console.error('❌ Monitoring error:', error.message);
            }
        }, this.config.monitoringInterval);

        // Cleanup old data every hour
        this.cleanupInterval = setInterval(async () => {
            await this.cleanupOldData();
        }, 3600000);

        console.log('✅ Performance Monitor is running');
    }

    async stop() {
        if (!this.isRunning) return;

        console.log('🛑 Stopping Performance Monitor...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.isRunning = false;
        console.log('✅ Performance Monitor stopped');
    }

    async collectMetrics() {
        const timestamp = Date.now();
        const metrics = {
            timestamp,
            system: await this.collectSystemMetrics(),
            performance: await this.collectPerformanceMetrics(),
            quality: await this.collectQualityMetrics(),
            processes: await this.collectProcessMetrics()
        };

        this.metrics.push(metrics);

        // Keep only recent metrics in memory
        this.metrics = this.metrics.filter(
            m => timestamp - m.timestamp <= this.config.retentionPeriod
        );

        // Save to disk periodically (every 10 measurements)
        if (this.metrics.length % this.config.batchSize === 0) {
            await this.saveMetricsBatch();
        }

        return metrics;
    }

    async collectSystemMetrics() {
        try {
            const [repositorySize, jsonFileCount, loadAverage] = await Promise.all([
                this.getRepositorySize(),
                this.getJsonFileCount(),
                this.getLoadAverage()
            ]);

            return {
                repositorySize,
                jsonFileCount,
                loadAverage,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime()
            };
        } catch (error) {
            console.warn('⚠️ System metrics collection failed:', error.message);
            return { repositorySize: 0, jsonFileCount: 0, loadAverage: 0 };
        }
    }

    async collectPerformanceMetrics() {
        try {
            // Read existing quality report if available
            const qualityReportPath = path.join(process.cwd(), 'quality-report.json');
            if (fs.existsSync(qualityReportPath)) {
                const data = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));
                return {
                    coreWebVitals: data.currentMetrics?.coreWebVitals || {},
                    overallScore: data.overview?.overallScore || 0,
                    trends: data.trends || {}
                };
            }
        } catch (error) {
            console.warn('⚠️ Performance metrics collection failed:', error.message);
        }

        return { coreWebVitals: {}, overallScore: 0, trends: {} };
    }

    async collectQualityMetrics() {
        try {
            const healthSummaryPath = path.join(process.cwd(), 'health-summary.json');
            if (fs.existsSync(healthSummaryPath)) {
                const data = JSON.parse(fs.readFileSync(healthSummaryPath, 'utf8'));
                return {
                    healthScore: data.healthScore || 0,
                    status: data.status || 'unknown',
                    dataIntegrity: data.dataIntegrity || '0%',
                    alerts: data.alerts || []
                };
            }
        } catch (error) {
            console.warn('⚠️ Quality metrics collection failed:', error.message);
        }

        return { healthScore: 0, status: 'unknown', dataIntegrity: '0%', alerts: [] };
    }

    async collectProcessMetrics() {
        try {
            const { stdout } = await execAsync('ps aux | grep -E "(node|quality|improvement|orchestrator)" | grep -v grep | wc -l');
            const processCount = parseInt(stdout.trim()) || 0;

            return {
                total: processCount,
                optimization: await this.countOptimizationProcesses()
            };
        } catch (error) {
            return { total: 0, optimization: 0 };
        }
    }

    async countOptimizationProcesses() {
        try {
            const { stdout } = await execAsync('ps aux | grep -E "(quality-feedback|recursive-improvement|predictive-maintenance)" | grep -v grep | wc -l');
            return parseInt(stdout.trim()) || 0;
        } catch (error) {
            return 0;
        }
    }

    async processAlerts() {
        if (!this.config.enableAlerts || this.metrics.length < 2) return;

        const current = this.metrics[this.metrics.length - 1];
        const previous = this.metrics[this.metrics.length - 2];

        const alerts = [];

        // Repository size alert
        if (current.system.repositorySize > this.config.alertThresholds.repositorySize) {
            alerts.push({
                type: 'repository_size',
                severity: 'high',
                message: `Repository size exceeded ${this.formatSize(this.config.alertThresholds.repositorySize)}: ${this.formatSize(current.system.repositorySize)}`,
                value: current.system.repositorySize,
                threshold: this.config.alertThresholds.repositorySize
            });
        }

        // JSON file count alert
        if (current.system.jsonFileCount > this.config.alertThresholds.jsonFileCount) {
            alerts.push({
                type: 'json_files',
                severity: 'medium',
                message: `JSON file count exceeded ${this.config.alertThresholds.jsonFileCount}: ${current.system.jsonFileCount}`,
                value: current.system.jsonFileCount,
                threshold: this.config.alertThresholds.jsonFileCount
            });
        }

        // Process count alert
        if (current.processes.total > this.config.alertThresholds.processCount) {
            alerts.push({
                type: 'process_count',
                severity: 'medium',
                message: `Process count exceeded ${this.config.alertThresholds.processCount}: ${current.processes.total}`,
                value: current.processes.total,
                threshold: this.config.alertThresholds.processCount
            });
        }

        // Performance regression alerts
        const currentFcp = current.performance.coreWebVitals?.fcp;
        const previousFcp = previous.performance.coreWebVitals?.fcp;
        
        if (currentFcp && previousFcp && currentFcp > previousFcp * 1.2) {
            alerts.push({
                type: 'fcp_regression',
                severity: 'high',
                message: `FCP performance regression: ${currentFcp.toFixed(0)}ms (was ${previousFcp.toFixed(0)}ms)`,
                value: currentFcp,
                previous: previousFcp
            });
        }

        // Quality drop alert
        const currentQuality = current.performance.overallScore;
        const previousQuality = previous.performance.overallScore;
        
        if (currentQuality && previousQuality && (previousQuality - currentQuality) > this.config.alertThresholds.qualityDrop) {
            alerts.push({
                type: 'quality_drop',
                severity: 'medium',
                message: `Quality score dropped by ${(previousQuality - currentQuality).toFixed(0)} points: ${currentQuality} (was ${previousQuality})`,
                value: currentQuality,
                previous: previousQuality
            });
        }

        // Log alerts
        for (const alert of alerts) {
            console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
            this.alerts.push({
                ...alert,
                timestamp: current.timestamp
            });
        }

        // Keep alert history limited
        this.alerts = this.alerts.filter(
            alert => current.timestamp - alert.timestamp <= this.config.retentionPeriod
        );

        return alerts;
    }

    async saveMetricsBatch() {
        try {
            const metricsDir = path.join(process.cwd(), 'monitoring');
            if (!fs.existsSync(metricsDir)) {
                fs.mkdirSync(metricsDir, { recursive: true });
            }

            const filename = `performance-metrics-${Date.now()}.json`;
            const filePath = path.join(metricsDir, filename);

            const data = {
                timestamp: Date.now(),
                config: this.config,
                metrics: this.metrics.slice(-this.config.batchSize),
                alerts: this.alerts.slice(-10) // Last 10 alerts
            };

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            // Also update current summary
            await this.updateCurrentSummary(data);

        } catch (error) {
            console.warn('⚠️ Failed to save metrics batch:', error.message);
        }
    }

    async updateCurrentSummary(data) {
        const summaryPath = path.join(process.cwd(), 'performance-summary.json');
        const latest = data.metrics[data.metrics.length - 1];
        
        if (!latest) return;

        const summary = {
            lastUpdate: latest.timestamp,
            system: latest.system,
            performance: {
                overallScore: latest.performance.overallScore,
                coreWebVitals: latest.performance.coreWebVitals,
                trends: this.calculateTrends(data.metrics)
            },
            alerts: {
                active: data.alerts.filter(alert => 
                    latest.timestamp - alert.timestamp <= 3600000 // Last hour
                ),
                total: data.alerts.length
            },
            health: {
                status: this.determineHealthStatus(latest, data.alerts),
                score: latest.quality.healthScore
            }
        };

        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    }

    calculateTrends(metrics) {
        if (metrics.length < 2) return {};

        const recent = metrics.slice(-5); // Last 5 measurements
        const trends = {};

        if (recent.length >= 2) {
            const first = recent[0];
            const last = recent[recent.length - 1];

            trends.repositorySize = this.calculateTrend(
                first.system.repositorySize,
                last.system.repositorySize
            );

            trends.overallScore = this.calculateTrend(
                first.performance.overallScore,
                last.performance.overallScore
            );

            if (first.performance.coreWebVitals?.fcp && last.performance.coreWebVitals?.fcp) {
                trends.fcp = this.calculateTrend(
                    first.performance.coreWebVitals.fcp,
                    last.performance.coreWebVitals.fcp,
                    true // Lower is better
                );
            }
        }

        return trends;
    }

    calculateTrend(oldValue, newValue, lowerIsBetter = false) {
        if (!oldValue || oldValue === 0) return { direction: 'stable', change: 0 };

        const change = ((newValue - oldValue) / oldValue) * 100;
        const threshold = 5; // 5% threshold for trend detection

        let direction = 'stable';
        if (Math.abs(change) > threshold) {
            if (lowerIsBetter) {
                direction = change < 0 ? 'improving' : 'declining';
            } else {
                direction = change > 0 ? 'improving' : 'declining';
            }
        }

        return {
            direction,
            change: Math.round(change * 10) / 10,
            oldValue,
            newValue
        };
    }

    determineHealthStatus(latest, alerts) {
        const activeAlerts = alerts.filter(alert => 
            latest.timestamp - alert.timestamp <= 3600000
        );

        const highSeverityAlerts = activeAlerts.filter(alert => alert.severity === 'high');
        
        if (highSeverityAlerts.length > 0) return 'critical';
        if (activeAlerts.length > 3) return 'warning';
        if (latest.performance.overallScore < 70) return 'degraded';
        
        return 'healthy';
    }

    async cleanupOldData() {
        const now = Date.now();
        
        // Only cleanup every 30 minutes to avoid excessive I/O
        if (now - this.lastCleanup < 1800000) return;
        
        try {
            const monitoringDir = path.join(process.cwd(), 'monitoring');
            if (!fs.existsSync(monitoringDir)) return;

            const files = fs.readdirSync(monitoringDir);
            const oldFiles = files.filter(filename => {
                const match = filename.match(/performance-metrics-(\d+)\.json/);
                if (!match) return false;
                
                const fileTimestamp = parseInt(match[1]);
                return now - fileTimestamp > this.config.retentionPeriod;
            });

            for (const filename of oldFiles) {
                const filePath = path.join(monitoringDir, filename);
                fs.unlinkSync(filePath);
            }

            if (oldFiles.length > 0) {
                console.log(`🧹 Cleaned up ${oldFiles.length} old monitoring files`);
            }

            this.lastCleanup = now;
        } catch (error) {
            console.warn('⚠️ Cleanup failed:', error.message);
        }
    }

    async getRepositorySize() {
        try {
            const { stdout } = await execAsync('du -sb . 2>/dev/null || echo "0"');
            return parseInt(stdout.split('\t')[0]) || 0;
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

    async getLoadAverage() {
        try {
            const { stdout } = await execAsync('uptime');
            const match = stdout.match(/load averages?:\s*([0-9.,\s]+)/);
            if (match) {
                const loads = match[1].trim().split(/[,\s]+/).map(parseFloat);
                return loads[0] || 0; // 1-minute load average
            }
        } catch (error) {
            // Fallback for systems without uptime command
        }
        return 0;
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Public API methods
    getCurrentMetrics() {
        return this.metrics[this.metrics.length - 1];
    }

    getActiveAlerts() {
        const now = Date.now();
        return this.alerts.filter(alert => now - alert.timestamp <= 3600000);
    }

    getHealthStatus() {
        const latest = this.getCurrentMetrics();
        if (!latest) return 'unknown';
        
        return this.determineHealthStatus(latest, this.alerts);
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    const monitor = new PerformanceMonitor({
        monitoringInterval: args.includes('--fast') ? 30000 : 60000,
        enableAlerts: !args.includes('--no-alerts'),
        enableTrends: !args.includes('--no-trends')
    });

    console.log('📊 Performance Monitor v1.0');
    console.log(`   Fast mode: ${args.includes('--fast') ? 'ON' : 'OFF'}`);
    console.log(`   Alerts: ${args.includes('--no-alerts') ? 'OFF' : 'ON'}`);
    console.log('');

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Performance Monitor...');
        await monitor.stop();
        process.exit(0);
    });

    monitor.start().catch(error => {
        console.error('❌ Performance Monitor failed to start:', error.message);
        process.exit(1);
    });
}

module.exports = PerformanceMonitor;