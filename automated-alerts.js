#!/usr/bin/env node

/**
 * Automated Health Checks and Alerting System
 * Monitors system health and sends automated alerts for issues
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

class AutomatedAlertSystem {
    constructor() {
        this.config = {
            checkInterval: 60000, // 1 minute for alerts
            alertRules: {
                repositorySize: {
                    critical: 500 * 1024 * 1024, // 500MB
                    warning: 450 * 1024 * 1024,  // 450MB
                    target: 400 * 1024 * 1024    // 400MB
                },
                healthScore: {
                    critical: 60,  // Below 60% is critical
                    warning: 80,   // Below 80% is warning
                    excellent: 95  // Above 95% is excellent
                },
                consecutiveFailures: {
                    critical: 5,   // 5 consecutive failures
                    warning: 3     // 3 consecutive failures
                },
                dataIntegrity: {
                    critical: 70,  // Below 70% integrity
                    warning: 85    // Below 85% integrity
                }
            },
            alertChannels: {
                console: true,
                file: true,
                dashboard: true
            },
            suppressionWindow: 5 * 60 * 1000 // 5 minutes between identical alerts
        };
        
        this.alertHistory = new Map();
        this.suppressedAlerts = new Map();
        this.metrics = {
            alertsSent: 0,
            criticalAlerts: 0,
            warningAlerts: 0,
            suppressedAlerts: 0
        };
    }

    async startAlertSystem() {
        console.log('🚨 Automated Alert System Starting...');
        console.log(`⏰ Check interval: ${this.config.checkInterval / 1000}s`);
        console.log(`📋 Alert channels: ${Object.keys(this.config.alertChannels).filter(ch => this.config.alertChannels[ch]).join(', ')}`);
        
        // Initial health check
        await this.performAlertCheck();
        
        // Schedule periodic checks
        setInterval(() => {
            this.performAlertCheck().catch(error => {
                console.error('❌ Alert check failed:', error.message);
            });
        }, this.config.checkInterval);
        
        // Clean up old alerts hourly
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 60 * 60 * 1000);
        
        console.log('✅ Automated Alert System Active');
        console.log('📊 Monitoring health metrics from: health-summary.json');
    }

    async performAlertCheck() {
        try {
            // Read current health metrics
            const healthData = await this.loadHealthData();
            if (!healthData) return;
            
            const alerts = [];
            
            // Check repository size
            alerts.push(...this.checkRepositorySize(healthData));
            
            // Check health score
            alerts.push(...this.checkHealthScore(healthData));
            
            // Check data integrity
            alerts.push(...this.checkDataIntegrity(healthData));
            
            // Check for performance degradation
            alerts.push(...this.checkPerformanceDegradation(healthData));
            
            // Process and send alerts
            for (const alert of alerts) {
                await this.processAlert(alert);
            }
            
            // Update metrics
            await this.updateAlertMetrics(alerts);
            
        } catch (error) {
            console.error('⚠️ Alert check error:', error.message);
        }
    }

    async loadHealthData() {
        const healthFiles = ['health-summary.json', 'health-metrics.json'];
        
        for (const file of healthFiles) {
            if (fs.existsSync(file)) {
                try {
                    const content = await fs.promises.readFile(file, 'utf8');
                    return JSON.parse(content);
                } catch (error) {
                    continue;
                }
            }
        }
        
        // Fallback: generate basic health data
        return await this.generateBasicHealthData();
    }

    async generateBasicHealthData() {
        try {
            const { stdout } = await execAsync('du -sk .');
            const size = parseInt(stdout.split('\t')[0]) * 1024;
            
            return {
                lastCheck: Date.now(),
                healthScore: size <= this.config.alertRules.repositorySize.target ? 95 : 75,
                repositorySize: `${(size/1024/1024).toFixed(1)}MB`,
                status: size <= this.config.alertRules.repositorySize.target ? 'excellent' : 'good',
                alerts: [],
                dataIntegrity: '100%'
            };
        } catch (error) {
            return null;
        }
    }

    checkRepositorySize(healthData) {
        const alerts = [];
        const sizeMatch = healthData.repositorySize?.match(/([0-9.]+)MB/);
        if (!sizeMatch) return alerts;
        
        const sizeMB = parseFloat(sizeMatch[1]);
        const sizeBytes = sizeMB * 1024 * 1024;
        
        if (sizeBytes >= this.config.alertRules.repositorySize.critical) {
            alerts.push({
                id: 'repo-size-critical',
                severity: 'critical',
                category: 'repository',
                title: 'Repository Size Critical',
                message: `Repository size (${sizeMB}MB) exceeds critical threshold`,
                current: `${sizeMB}MB`,
                threshold: `${this.config.alertRules.repositorySize.critical / 1024 / 1024}MB`,
                recommendation: 'Immediate cleanup required - run optimization suite',
                timestamp: Date.now()
            });
        } else if (sizeBytes >= this.config.alertRules.repositorySize.warning) {
            alerts.push({
                id: 'repo-size-warning',
                severity: 'warning',
                category: 'repository', 
                title: 'Repository Size Warning',
                message: `Repository size (${sizeMB}MB) approaching limit`,
                current: `${sizeMB}MB`,
                threshold: `${this.config.alertRules.repositorySize.warning / 1024 / 1024}MB`,
                recommendation: 'Consider running cleanup optimization',
                timestamp: Date.now()
            });
        }
        
        return alerts;
    }

    checkHealthScore(healthData) {
        const alerts = [];
        const healthScore = healthData.healthScore || 100;
        
        if (healthScore <= this.config.alertRules.healthScore.critical) {
            alerts.push({
                id: 'health-score-critical',
                severity: 'critical',
                category: 'system',
                title: 'System Health Critical',
                message: `Health score (${healthScore}%) is critically low`,
                current: `${healthScore}%`,
                threshold: `${this.config.alertRules.healthScore.critical}%`,
                recommendation: 'Immediate system diagnosis required',
                timestamp: Date.now()
            });
        } else if (healthScore <= this.config.alertRules.healthScore.warning) {
            alerts.push({
                id: 'health-score-warning', 
                severity: 'warning',
                category: 'system',
                title: 'System Health Warning',
                message: `Health score (${healthScore}%) needs attention`,
                current: `${healthScore}%`,
                threshold: `${this.config.alertRules.healthScore.warning}%`,
                recommendation: 'Review system metrics and optimize',
                timestamp: Date.now()
            });
        }
        
        return alerts;
    }

    checkDataIntegrity(healthData) {
        const alerts = [];
        const integrityMatch = healthData.dataIntegrity?.match(/([0-9.]+)%/);
        if (!integrityMatch) return alerts;
        
        const integrity = parseFloat(integrityMatch[1]);
        
        if (integrity <= this.config.alertRules.dataIntegrity.critical) {
            alerts.push({
                id: 'data-integrity-critical',
                severity: 'critical',
                category: 'data',
                title: 'Data Integrity Critical',
                message: `Data integrity (${integrity}%) is critically low`,
                current: `${integrity}%`,
                threshold: `${this.config.alertRules.dataIntegrity.critical}%`,
                recommendation: 'Run data validation and repair immediately',
                timestamp: Date.now()
            });
        } else if (integrity <= this.config.alertRules.dataIntegrity.warning) {
            alerts.push({
                id: 'data-integrity-warning',
                severity: 'warning',
                category: 'data',
                title: 'Data Integrity Warning',
                message: `Data integrity (${integrity}%) needs attention`,
                current: `${integrity}%`,
                threshold: `${this.config.alertRules.dataIntegrity.warning}%`,
                recommendation: 'Review data consistency and backup status',
                timestamp: Date.now()
            });
        }
        
        return alerts;
    }

    checkPerformanceDegradation(healthData) {
        const alerts = [];
        
        // Check if response times are degrading
        if (healthData.performance?.responseTime) {
            const responseTimeMatch = healthData.performance.responseTime.match(/([0-9.]+)ms/);
            if (responseTimeMatch) {
                const responseTime = parseFloat(responseTimeMatch[1]);
                if (responseTime > 2000) { // >2 seconds
                    alerts.push({
                        id: 'performance-degradation',
                        severity: 'warning',
                        category: 'performance',
                        title: 'Performance Degradation',
                        message: `Response time (${responseTime}ms) is slow`,
                        current: `${responseTime}ms`,
                        threshold: '2000ms',
                        recommendation: 'Review system load and optimize',
                        timestamp: Date.now()
                    });
                }
            }
        }
        
        return alerts;
    }

    async processAlert(alert) {
        // Check if alert should be suppressed
        if (this.isAlertSuppressed(alert)) {
            this.metrics.suppressedAlerts++;
            return;
        }
        
        // Send alert through configured channels
        if (this.config.alertChannels.console) {
            await this.sendConsoleAlert(alert);
        }
        
        if (this.config.alertChannels.file) {
            await this.sendFileAlert(alert);
        }
        
        if (this.config.alertChannels.dashboard) {
            await this.updateDashboardAlert(alert);
        }
        
        // Update metrics
        this.metrics.alertsSent++;
        if (alert.severity === 'critical') {
            this.metrics.criticalAlerts++;
        } else if (alert.severity === 'warning') {
            this.metrics.warningAlerts++;
        }
        
        // Record alert for suppression
        this.suppressedAlerts.set(alert.id, Date.now());
        this.alertHistory.set(alert.id, alert);
    }

    isAlertSuppressed(alert) {
        const lastSent = this.suppressedAlerts.get(alert.id);
        if (!lastSent) return false;
        
        return (Date.now() - lastSent) < this.config.suppressionWindow;
    }

    async sendConsoleAlert(alert) {
        const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
        const timestamp = new Date().toISOString().substr(11, 8);
        
        console.log(`\n${icon} ${alert.severity.toUpperCase()} ALERT - ${timestamp}`);
        console.log(`📋 ${alert.title}: ${alert.message}`);
        if (alert.current && alert.threshold) {
            console.log(`📊 Current: ${alert.current} | Threshold: ${alert.threshold}`);
        }
        console.log(`💡 Recommendation: ${alert.recommendation}`);
        console.log(`🏷️  Category: ${alert.category} | ID: ${alert.id}\n`);
    }

    async sendFileAlert(alert) {
        try {
            const alertsDir = './alerts';
            if (!fs.existsSync(alertsDir)) {
                await fs.promises.mkdir(alertsDir, { recursive: true });
            }
            
            // Append to alerts log
            const logEntry = {
                timestamp: new Date().toISOString(),
                ...alert
            };
            
            const logFile = path.join(alertsDir, 'alerts.jsonl');
            await fs.promises.appendFile(logFile, JSON.stringify(logEntry) + '\n');
            
            // Create/update current alerts file
            const currentAlertsFile = path.join(alertsDir, 'current-alerts.json');
            let currentAlerts = [];
            
            if (fs.existsSync(currentAlertsFile)) {
                try {
                    const content = await fs.promises.readFile(currentAlertsFile, 'utf8');
                    currentAlerts = JSON.parse(content);
                } catch (error) {
                    currentAlerts = [];
                }
            }
            
            // Update or add alert
            const existingIndex = currentAlerts.findIndex(a => a.id === alert.id);
            if (existingIndex >= 0) {
                currentAlerts[existingIndex] = { ...alert, lastUpdated: new Date().toISOString() };
            } else {
                currentAlerts.push({ ...alert, lastUpdated: new Date().toISOString() });
            }
            
            await fs.promises.writeFile(currentAlertsFile, JSON.stringify(currentAlerts, null, 2));
            
        } catch (error) {
            console.error('⚠️ Failed to write file alert:', error.message);
        }
    }

    async updateDashboardAlert(alert) {
        try {
            // Update dashboard alert status
            const dashboardAlerts = {
                lastUpdate: new Date().toISOString(),
                totalAlerts: this.metrics.alertsSent,
                criticalAlerts: this.metrics.criticalAlerts,
                warningAlerts: this.metrics.warningAlerts,
                suppressedAlerts: this.metrics.suppressedAlerts,
                latestAlert: alert
            };
            
            await fs.promises.writeFile('./dashboard-alerts.json', JSON.stringify(dashboardAlerts, null, 2));
            
        } catch (error) {
            console.error('⚠️ Failed to update dashboard alert:', error.message);
        }
    }

    async updateAlertMetrics(alerts) {
        try {
            const metrics = {
                ...this.metrics,
                lastCheck: new Date().toISOString(),
                activeAlerts: alerts.length,
                alertHistory: Array.from(this.alertHistory.values()).slice(-50), // Keep last 50
                systemStatus: this.calculateSystemStatus(alerts)
            };
            
            await fs.promises.writeFile('./alert-metrics.json', JSON.stringify(metrics, null, 2));
            
        } catch (error) {
            console.error('⚠️ Failed to update alert metrics:', error.message);
        }
    }

    calculateSystemStatus(currentAlerts) {
        if (currentAlerts.some(alert => alert.severity === 'critical')) {
            return { status: 'critical', message: 'System has critical issues requiring immediate attention' };
        } else if (currentAlerts.some(alert => alert.severity === 'warning')) {
            return { status: 'warning', message: 'System has warnings that should be addressed' };
        } else {
            return { status: 'healthy', message: 'All systems operational' };
        }
    }

    cleanupOldAlerts() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        let cleaned = 0;
        
        // Clean suppression cache
        for (const [alertId, timestamp] of this.suppressedAlerts) {
            if (timestamp < cutoff) {
                this.suppressedAlerts.delete(alertId);
                cleaned++;
            }
        }
        
        // Clean alert history
        for (const [alertId, alert] of this.alertHistory) {
            if (alert.timestamp < cutoff) {
                this.alertHistory.delete(alertId);
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} old alert suppressions`);
        }
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const alertSystem = new AutomatedAlertSystem();
    
    alertSystem.startAlertSystem().catch(error => {
        console.error('❌ Alert system failed to start:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🚨 Alert System Stopping...');
        console.log('📊 Alert metrics saved');
        process.exit(0);
    });
}

export default AutomatedAlertSystem;