#!/usr/bin/env node

/**
 * Deployment Monitoring & Real-Time Dashboard
 * Production-grade deployment tracking with enterprise metrics
 * 
 * Features:
 * - Real-time deployment status tracking
 * - Performance metrics collection
 * - Multi-environment health monitoring  
 * - Automated alerting and recovery
 * - Historical deployment analytics
 * - SLA monitoring and compliance
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// CONFIGURATION
// ========================================

const DEPLOYMENT_CONFIG = {
    environments: {
        production: {
            url: 'https://adrianwedd.github.io/cv',
            healthEndpoint: '/index.html',
            slaTarget: 99.9, // 99.9% uptime
            responseTimeTarget: 2000, // 2 seconds
            deploymentBranch: 'gh-pages'
        },
        staging: {
            url: 'https://adrianwedd.github.io/cv-staging',
            healthEndpoint: '/index.html',
            slaTarget: 95.0, // 95% uptime
            responseTimeTarget: 5000, // 5 seconds
            deploymentBranch: 'gh-pages-staging'
        },
        preview: {
            url: 'https://adrianwedd.github.io/cv-preview',
            healthEndpoint: '/index.html',
            slaTarget: 90.0, // 90% uptime
            responseTimeTarget: 10000, // 10 seconds
            deploymentBranch: 'gh-pages-preview'
        }
    },
    
    monitoring: {
        checkInterval: 60000, // 1 minute
        alertThreshold: 3, // Alert after 3 failures
        recoveryThreshold: 2, // Consider recovered after 2 successes
        maxRetries: 5,
        timeout: 30000, // 30 seconds
        historyRetention: 30 // 30 days
    },
    
    alerts: {
        email: process.env.ALERT_EMAIL || null,
        webhook: process.env.ALERT_WEBHOOK || null,
        slack: process.env.SLACK_WEBHOOK || null
    },
    
    dataDir: path.join(__dirname, 'data'),
    reportsDir: path.join(__dirname, '../dashboards')
};

// ========================================
// DEPLOYMENT MONITOR CLASS  
// ========================================

class DeploymentMonitor {
    constructor() {
        this.deployments = new Map();
        this.healthHistory = new Map();
        this.alerts = new Map();
        this.metrics = {
            totalDeployments: 0,
            successfulDeployments: 0,
            failedDeployments: 0,
            averageDeployTime: 0,
            uptimePercentage: 0,
            lastHealthCheck: null
        };
        
        console.log('🚀 Deployment Monitor initialized with enterprise-grade capabilities');
    }
    
    // ========================================
    // DEPLOYMENT TRACKING
    // ========================================
    
    async trackDeployment(deployment) {
        const deploymentId = this.generateDeploymentId();
        
        const deploymentData = {
            id: deploymentId,
            environment: deployment.environment,
            branch: deployment.branch || 'main',
            commit: deployment.commit,
            startTime: new Date(),
            status: 'deploying',
            metrics: {
                buildTime: null,
                deployTime: null,
                assetSize: null,
                bundleSize: null
            },
            healthChecks: [],
            alerts: []
        };
        
        this.deployments.set(deploymentId, deploymentData);
        this.metrics.totalDeployments++;
        
        console.log(`📊 Tracking deployment: ${deploymentId} (${deployment.environment})`);
        
        await this.saveDeploymentData();
        return deploymentId;
    }
    
    async updateDeployment(deploymentId, updates) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            console.error(`❌ Deployment not found: ${deploymentId}`);
            return false;
        }
        
        Object.assign(deployment, updates);
        
        if (updates.status === 'success') {
            this.metrics.successfulDeployments++;
            deployment.endTime = new Date();
            deployment.duration = deployment.endTime - deployment.startTime;
        } else if (updates.status === 'failed') {
            this.metrics.failedDeployments++;
            deployment.endTime = new Date();
            deployment.duration = deployment.endTime - deployment.startTime;
        }
        
        await this.saveDeploymentData();
        await this.generateMetrics();
        
        console.log(`📊 Updated deployment: ${deploymentId} (${updates.status || 'in-progress'})`);
        return true;
    }
    
    // ========================================
    // HEALTH MONITORING
    // ========================================
    
    async performHealthCheck(environment = 'production') {
        const config = DEPLOYMENT_CONFIG.environments[environment];
        if (!config) {
            console.error(`❌ Unknown environment: ${environment}`);
            return null;
        }
        
        const checkId = `health-${Date.now()}`;
        const startTime = Date.now();
        
        console.log(`🏥 Performing health check: ${environment} (${config.url})`);
        
        try {
            // Use dynamic import for node-fetch if available, fallback to basic approach
            let fetch;
            try {
                const fetchModule = await import('node-fetch');
                fetch = fetchModule.default;
            } catch {
                // Fallback to basic HTTP check using curl via child_process
                const { execSync } = await import('child_process');
                
                const curlCommand = `curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 30 "${config.url}" || echo "000|30.0"`;
                const result = execSync(curlCommand, { encoding: 'utf8', timeout: 35000 });
                const [httpCode, timeTotal] = result.trim().split('|');
                
                const responseTime = Math.round(parseFloat(timeTotal) * 1000);
                const isHealthy = httpCode === '200' && responseTime < config.responseTimeTarget;
                
                return this.recordHealthCheck(environment, {
                    id: checkId,
                    timestamp: new Date(),
                    success: isHealthy,
                    responseTime,
                    httpStatus: httpCode,
                    environment,
                    details: {
                        url: config.url,
                        method: 'GET',
                        timeout: 30000
                    }
                });
            }
            
            // If fetch is available, use it
            const response = await fetch(config.url + config.healthEndpoint, {
                method: 'GET',
                timeout: DEPLOYMENT_CONFIG.monitoring.timeout,
                headers: {
                    'User-Agent': 'DeploymentMonitor/1.0'
                }
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const isHealthy = response.ok && responseTime < config.responseTimeTarget;
            
            return this.recordHealthCheck(environment, {
                id: checkId,
                timestamp: new Date(),
                success: isHealthy,
                responseTime,
                httpStatus: response.status,
                environment,
                details: {
                    url: config.url + config.healthEndpoint,
                    method: 'GET',
                    headers: Object.fromEntries(response.headers.entries())
                }
            });
            
        } catch (error) {
            console.error(`❌ Health check failed for ${environment}:`, error.message);
            
            return this.recordHealthCheck(environment, {
                id: checkId,
                timestamp: new Date(),
                success: false,
                responseTime: Date.now() - startTime,
                httpStatus: 0,
                environment,
                error: error.message,
                details: {
                    url: config.url + config.healthEndpoint,
                    errorType: error.name
                }
            });
        }
    }
    
    async recordHealthCheck(environment, healthData) {
        if (!this.healthHistory.has(environment)) {
            this.healthHistory.set(environment, []);
        }
        
        const history = this.healthHistory.get(environment);
        history.push(healthData);
        
        // Maintain rolling window
        const maxHistory = 1000; // Keep last 1000 checks
        if (history.length > maxHistory) {
            history.splice(0, history.length - maxHistory);
        }
        
        // Update metrics
        this.updateHealthMetrics(environment, healthData);
        
        // Check for alerts
        await this.checkAlertConditions(environment, healthData);
        
        await this.saveHealthData();
        
        console.log(`🏥 Health check recorded: ${environment} (${healthData.success ? '✅' : '❌'} ${healthData.responseTime}ms)`);
        
        return healthData;
    }
    
    updateHealthMetrics(environment, healthData) {
        const history = this.healthHistory.get(environment) || [];
        const recentChecks = history.slice(-100); // Last 100 checks
        
        const successfulChecks = recentChecks.filter(check => check.success).length;
        const uptimePercentage = (successfulChecks / Math.max(recentChecks.length, 1)) * 100;
        
        const avgResponseTime = recentChecks.reduce((sum, check) => sum + check.responseTime, 0) / Math.max(recentChecks.length, 1);
        
        this.metrics.lastHealthCheck = healthData.timestamp;
        this.metrics.uptimePercentage = uptimePercentage;
        this.metrics.averageResponseTime = Math.round(avgResponseTime);
        
        console.log(`📊 ${environment} metrics: ${uptimePercentage.toFixed(1)}% uptime, ${Math.round(avgResponseTime)}ms avg response`);
    }
    
    // ========================================
    // ALERTING SYSTEM
    // ========================================
    
    async checkAlertConditions(environment, healthData) {
        const config = DEPLOYMENT_CONFIG.environments[environment];
        const alertKey = `${environment}-health`;
        
        if (!this.alerts.has(alertKey)) {
            this.alerts.set(alertKey, {
                consecutiveFailures: 0,
                consecutiveSuccesses: 0,
                isAlerting: false,
                lastAlert: null
            });
        }
        
        const alertState = this.alerts.get(alertKey);
        
        if (healthData.success) {
            alertState.consecutiveFailures = 0;
            alertState.consecutiveSuccesses++;
            
            // Check if we should clear the alert
            if (alertState.isAlerting && 
                alertState.consecutiveSuccesses >= DEPLOYMENT_CONFIG.monitoring.recoveryThreshold) {
                
                await this.sendRecoveryNotification(environment, healthData);
                alertState.isAlerting = false;
                alertState.consecutiveSuccesses = 0;
            }
        } else {
            alertState.consecutiveSuccesses = 0;
            alertState.consecutiveFailures++;
            
            // Check if we should trigger an alert
            if (!alertState.isAlerting && 
                alertState.consecutiveFailures >= DEPLOYMENT_CONFIG.monitoring.alertThreshold) {
                
                await this.sendFailureAlert(environment, healthData);
                alertState.isAlerting = true;
                alertState.lastAlert = new Date();
            }
        }
    }
    
    async sendFailureAlert(environment, healthData) {
        const config = DEPLOYMENT_CONFIG.environments[environment];
        const alertMessage = {
            type: 'deployment_failure',
            severity: 'high',
            environment,
            timestamp: new Date(),
            details: {
                url: config.url,
                responseTime: healthData.responseTime,
                httpStatus: healthData.httpStatus,
                consecutiveFailures: this.alerts.get(`${environment}-health`).consecutiveFailures,
                slaTarget: config.slaTarget,
                error: healthData.error
            },
            message: `🚨 DEPLOYMENT ALERT: ${environment} environment is unhealthy`,
            recommendedActions: [
                'Check deployment logs in GitHub Actions',
                'Verify DNS and CDN configuration',
                'Consider manual rollback if issues persist',
                'Monitor health checks for automatic recovery'
            ]
        };
        
        console.error(`🚨 ALERT: ${environment} environment failure detected`);
        
        await this.saveAlert(alertMessage);
        await this.notifyStakeholders(alertMessage);
    }
    
    async sendRecoveryNotification(environment, healthData) {
        const config = DEPLOYMENT_CONFIG.environments[environment];
        const recoveryMessage = {
            type: 'deployment_recovery',
            severity: 'info',
            environment,
            timestamp: new Date(),
            details: {
                url: config.url,
                responseTime: healthData.responseTime,
                httpStatus: healthData.httpStatus,
                uptimePercentage: this.metrics.uptimePercentage
            },
            message: `✅ RECOVERY: ${environment} environment has recovered`,
            summary: 'Service is now operating normally'
        };
        
        console.log(`✅ RECOVERY: ${environment} environment has recovered`);
        
        await this.saveAlert(recoveryMessage);
        await this.notifyStakeholders(recoveryMessage);
    }
    
    async notifyStakeholders(alert) {
        // Log alert locally
        console.log(`📢 Alert: ${alert.type} - ${alert.message}`);
        
        // In a real implementation, you would send notifications here:
        // - Email notifications
        // - Slack/Discord webhooks  
        // - SMS alerts for critical issues
        // - Integration with monitoring systems (DataDog, New Relic, etc.)
        
        // For now, just create an alert file
        const alertFile = path.join(DEPLOYMENT_CONFIG.dataDir, `alert-${Date.now()}.json`);
        await fs.writeFile(alertFile, JSON.stringify(alert, null, 2));
    }
    
    // ========================================
    // DASHBOARD GENERATION
    // ========================================
    
    async generateDashboard() {
        const dashboardData = {
            timestamp: new Date(),
            metrics: this.metrics,
            environments: {},
            recentDeployments: Array.from(this.deployments.values())
                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                .slice(0, 10),
            alerts: Array.from(this.alerts.entries()).map(([key, value]) => ({
                environment: key,
                ...value
            }))
        };
        
        // Generate environment-specific data
        for (const [env, config] of Object.entries(DEPLOYMENT_CONFIG.environments)) {
            const history = this.healthHistory.get(env) || [];
            const recentHistory = history.slice(-24); // Last 24 checks
            
            dashboardData.environments[env] = {
                url: config.url,
                slaTarget: config.slaTarget,
                currentHealth: recentHistory.length > 0 ? recentHistory[recentHistory.length - 1] : null,
                uptimePercentage: this.calculateUptime(history),
                averageResponseTime: this.calculateAverageResponseTime(recentHistory),
                healthTrend: recentHistory.map(check => ({
                    timestamp: check.timestamp,
                    success: check.success,
                    responseTime: check.responseTime
                })),
                lastDeployment: this.getLastDeployment(env)
            };
        }
        
        // Generate HTML dashboard
        const dashboardHtml = this.generateDashboardHTML(dashboardData);
        
        // Save dashboard files
        const dashboardDir = DEPLOYMENT_CONFIG.reportsDir;
        await fs.mkdir(dashboardDir, { recursive: true });
        
        await fs.writeFile(
            path.join(dashboardDir, 'deployment-dashboard.json'),
            JSON.stringify(dashboardData, null, 2)
        );
        
        await fs.writeFile(
            path.join(dashboardDir, 'deployment-dashboard.html'),
            dashboardHtml
        );
        
        console.log(`📊 Dashboard generated: ${dashboardDir}/deployment-dashboard.html`);
        
        return dashboardData;
    }
    
    generateDashboardHTML(data) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deployment Dashboard - Real-Time Monitoring</title>
    <style>
        :root {
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --info: #3b82f6;
            --bg-primary: #1f2937;
            --bg-secondary: #374151;
            --text-primary: #f9fafb;
            --text-secondary: #d1d5db;
            --border: #4b5563;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 20px;
        }
        
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, var(--info), var(--success));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .metric-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .metric-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .metric-change {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .environments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .environment-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .environment-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .environment-title {
            font-size: 1.25rem;
            font-weight: 600;
            text-transform: capitalize;
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .status-healthy {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
            border: 1px solid var(--success);
        }
        
        .status-degraded {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
            border: 1px solid var(--warning);
        }
        
        .status-unhealthy {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
            border: 1px solid var(--error);
        }
        
        .environment-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .stat-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .health-trend {
            height: 60px;
            background: var(--bg-primary);
            border-radius: 8px;
            padding: 8px;
            margin-bottom: 16px;
            position: relative;
            overflow: hidden;
        }
        
        .trend-bar {
            height: 4px;
            margin: 2px 0;
            border-radius: 2px;
            opacity: 0.7;
        }
        
        .trend-success { background: var(--success); }
        .trend-error { background: var(--error); }
        
        .deployments-section {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
        }
        
        .deployments-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .deployment-item {
            display: flex;
            justify-content: between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .deployment-item:last-child {
            border-bottom: none;
        }
        
        .deployment-info {
            flex: 1;
        }
        
        .deployment-env {
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .deployment-time {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .auto-refresh {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--info);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }
            
            .environments-grid {
                grid-template-columns: 1fr;
            }
            
            .environment-stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <button class="auto-refresh" onclick="location.reload()">🔄 Refresh</button>
        
        <div class="header">
            <h1>🚀 Deployment Dashboard</h1>
            <p>Real-time monitoring and deployment tracking</p>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 8px;">
                Last updated: ${new Date(data.timestamp).toLocaleString()}
            </p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Total Deployments</div>
                <div class="metric-value" style="color: var(--info)">${data.metrics.totalDeployments}</div>
                <div class="metric-change">Lifetime total</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Success Rate</div>
                <div class="metric-value" style="color: var(--success)">
                    ${data.metrics.totalDeployments > 0 ? 
                        ((data.metrics.successfulDeployments / data.metrics.totalDeployments) * 100).toFixed(1) : 0}%
                </div>
                <div class="metric-change">${data.metrics.successfulDeployments}/${data.metrics.totalDeployments} successful</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Uptime</div>
                <div class="metric-value" style="color: var(--success)">${data.metrics.uptimePercentage.toFixed(2)}%</div>
                <div class="metric-change">Last 100 checks</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Avg Response Time</div>
                <div class="metric-value" style="color: ${data.metrics.averageResponseTime > 2000 ? 'var(--warning)' : 'var(--success)'}">
                    ${data.metrics.averageResponseTime}ms
                </div>
                <div class="metric-change">Recent average</div>
            </div>
        </div>
        
        <div class="environments-grid">
            ${Object.entries(data.environments).map(([env, envData]) => `
                <div class="environment-card">
                    <div class="environment-header">
                        <h3 class="environment-title">${env}</h3>
                        <div class="status-indicator status-${envData.currentHealth?.success ? 'healthy' : 'unhealthy'}">
                            ${envData.currentHealth?.success ? '✅ Healthy' : '❌ Unhealthy'}
                        </div>
                    </div>
                    
                    <div class="environment-stats">
                        <div class="stat-item">
                            <div class="stat-value" style="color: var(--success)">${envData.uptimePercentage.toFixed(1)}%</div>
                            <div class="stat-label">Uptime</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" style="color: ${envData.averageResponseTime > 2000 ? 'var(--warning)' : 'var(--success)'}">
                                ${envData.averageResponseTime}ms
                            </div>
                            <div class="stat-label">Avg Response</div>
                        </div>
                    </div>
                    
                    <div class="health-trend">
                        ${envData.healthTrend.slice(-20).map(check => 
                            `<div class="trend-bar trend-${check.success ? 'success' : 'error'}"></div>`
                        ).join('')}
                    </div>
                    
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        <div>URL: <a href="${envData.url}" target="_blank" style="color: var(--info)">${envData.url}</a></div>
                        <div>SLA Target: ${envData.slaTarget}%</div>
                        ${envData.lastDeployment ? 
                            `<div>Last Deploy: ${new Date(envData.lastDeployment.startTime).toLocaleDateString()}</div>` : 
                            '<div>No recent deployments</div>'
                        }
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="deployments-section">
            <h3 class="deployments-title">📋 Recent Deployments</h3>
            ${data.recentDeployments.length > 0 ? 
                data.recentDeployments.map(deployment => `
                    <div class="deployment-item">
                        <div class="deployment-info">
                            <div class="deployment-env">${deployment.environment} - ${deployment.status}</div>
                            <div class="deployment-time">${new Date(deployment.startTime).toLocaleString()}</div>
                        </div>
                        <div class="status-indicator status-${deployment.status === 'success' ? 'healthy' : deployment.status === 'failed' ? 'unhealthy' : 'degraded'}">
                            ${deployment.status === 'success' ? '✅' : deployment.status === 'failed' ? '❌' : '⏳'} ${deployment.status}
                        </div>
                    </div>
                `).join('') : 
                '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No recent deployments</div>'
            }
        </div>
    </div>
    
    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => location.reload(), 300000);
        
        // Add real-time timestamp
        setInterval(() => {
            const now = new Date().toLocaleTimeString();
            document.title = \`Deployment Dashboard - \${now}\`;
        }, 1000);
    </script>
</body>
</html>`;
    }
    
    // ========================================
    // UTILITY METHODS
    // ========================================
    
    calculateUptime(history) {
        if (!history || history.length === 0) return 0;
        
        const successfulChecks = history.filter(check => check.success).length;
        return (successfulChecks / history.length) * 100;
    }
    
    calculateAverageResponseTime(history) {
        if (!history || history.length === 0) return 0;
        
        const totalResponseTime = history.reduce((sum, check) => sum + check.responseTime, 0);
        return Math.round(totalResponseTime / history.length);
    }
    
    getLastDeployment(environment) {
        const deployments = Array.from(this.deployments.values())
            .filter(d => d.environment === environment)
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        return deployments.length > 0 ? deployments[0] : null;
    }
    
    generateDeploymentId() {
        return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // ========================================
    // DATA PERSISTENCE
    // ========================================
    
    async saveDeploymentData() {
        await fs.mkdir(DEPLOYMENT_CONFIG.dataDir, { recursive: true });
        
        const deploymentsData = {
            deployments: Array.from(this.deployments.entries()),
            metrics: this.metrics,
            lastUpdated: new Date()
        };
        
        await fs.writeFile(
            path.join(DEPLOYMENT_CONFIG.dataDir, 'deployments.json'),
            JSON.stringify(deploymentsData, null, 2)
        );
    }
    
    async saveHealthData() {
        await fs.mkdir(DEPLOYMENT_CONFIG.dataDir, { recursive: true });
        
        const healthData = {
            history: Array.from(this.healthHistory.entries()),
            alerts: Array.from(this.alerts.entries()),
            lastUpdated: new Date()
        };
        
        await fs.writeFile(
            path.join(DEPLOYMENT_CONFIG.dataDir, 'health-monitoring.json'),
            JSON.stringify(healthData, null, 2)
        );
    }
    
    async saveAlert(alert) {
        await fs.mkdir(DEPLOYMENT_CONFIG.dataDir, { recursive: true });
        
        const alertFile = path.join(DEPLOYMENT_CONFIG.dataDir, `alert-${Date.now()}.json`);
        await fs.writeFile(alertFile, JSON.stringify(alert, null, 2));
        
        // Also append to alerts log
        const alertsLog = path.join(DEPLOYMENT_CONFIG.dataDir, 'alerts.json');
        let allAlerts = [];
        
        try {
            const existing = await fs.readFile(alertsLog, 'utf8');
            allAlerts = JSON.parse(existing);
        } catch {
            // File doesn't exist, start fresh
        }
        
        allAlerts.push(alert);
        
        // Keep only last 100 alerts
        if (allAlerts.length > 100) {
            allAlerts = allAlerts.slice(-100);
        }
        
        await fs.writeFile(alertsLog, JSON.stringify(allAlerts, null, 2));
    }
    
    async loadHistoricalData() {
        try {
            // Load deployments
            const deploymentsFile = path.join(DEPLOYMENT_CONFIG.dataDir, 'deployments.json');
            const deploymentsData = JSON.parse(await fs.readFile(deploymentsFile, 'utf8'));
            
            this.deployments = new Map(deploymentsData.deployments);
            this.metrics = deploymentsData.metrics;
            
            // Load health data
            const healthFile = path.join(DEPLOYMENT_CONFIG.dataDir, 'health-monitoring.json');
            const healthData = JSON.parse(await fs.readFile(healthFile, 'utf8'));
            
            this.healthHistory = new Map(healthData.history);
            this.alerts = new Map(healthData.alerts);
            
            console.log(`📊 Loaded historical data: ${this.deployments.size} deployments, ${this.healthHistory.size} environments`);
            
        } catch (error) {
            console.log('📊 No historical data found, starting fresh');
        }
    }
    
    // ========================================
    // CLI INTERFACE
    // ========================================
    
    async runCommand(command, args = []) {
        switch (command) {
            case 'health-check':
                const environment = args[0] || 'production';
                return await this.performHealthCheck(environment);
                
            case 'health-all':
                const results = {};
                for (const env of Object.keys(DEPLOYMENT_CONFIG.environments)) {
                    results[env] = await this.performHealthCheck(env);
                }
                return results;
                
            case 'dashboard':
                return await this.generateDashboard();
                
            case 'track-deployment':
                const deploymentInfo = {
                    environment: args[0] || 'production',
                    branch: args[1] || 'main',
                    commit: args[2] || 'unknown'
                };
                return await this.trackDeployment(deploymentInfo);
                
            case 'status':
                return {
                    deployments: this.deployments.size,
                    metrics: this.metrics,
                    environments: Object.keys(DEPLOYMENT_CONFIG.environments),
                    lastHealthCheck: this.metrics.lastHealthCheck
                };
                
            case 'monitor':
                console.log('🔄 Starting continuous monitoring...');
                return await this.startContinuousMonitoring();
                
            default:
                console.error(`❌ Unknown command: ${command}`);
                console.log('Available commands: health-check, health-all, dashboard, track-deployment, status, monitor');
                return null;
        }
    }
    
    async startContinuousMonitoring() {
        console.log(`🔄 Starting continuous monitoring (${DEPLOYMENT_CONFIG.monitoring.checkInterval}ms intervals)`);
        
        const monitoringLoop = async () => {
            try {
                // Perform health checks for all environments
                for (const env of Object.keys(DEPLOYMENT_CONFIG.environments)) {
                    await this.performHealthCheck(env);
                }
                
                // Generate updated dashboard
                await this.generateDashboard();
                
                console.log(`✅ Monitoring cycle completed at ${new Date().toISOString()}`);
                
            } catch (error) {
                console.error('❌ Monitoring cycle failed:', error);
            }
        };
        
        // Initial run
        await monitoringLoop();
        
        // Set up recurring monitoring
        setInterval(monitoringLoop, DEPLOYMENT_CONFIG.monitoring.checkInterval);
        
        return 'Continuous monitoring started';
    }
}

// ========================================
// CLI EXECUTION
// ========================================

async function main() {
    const monitor = new DeploymentMonitor();
    
    // Load any existing data
    await monitor.loadHistoricalData();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'status';
    const commandArgs = args.slice(1);
    
    try {
        const result = await monitor.runCommand(command, commandArgs);
        
        if (result && typeof result === 'object') {
            console.log('📊 Result:', JSON.stringify(result, null, 2));
        } else if (result) {
            console.log('📊 Result:', result);
        }
        
    } catch (error) {
        console.error('💥 Command failed:', error);
        process.exit(1);
    }
}

// Export for use as module
export { DeploymentMonitor };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}