#!/usr/bin/env node

/**
 * Monitoring Dashboard - Real-Time System Status & Alerts
 * Provides comprehensive monitoring with visual dashboard and alerting
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { performance } from 'perf_hooks';

class MonitoringDashboard {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3000,
      refreshInterval: options.refreshInterval || 30000, // 30 seconds
      alertThresholds: {
        system_health: 80,
        performance_budget: 70,
        response_time: 2000,
        ...options.alertThresholds
      },
      enableAlerts: options.enableAlerts !== false,
      ...options
    };

    this.dashboardState = {
      lastUpdate: null,
      systemHealth: {},
      performanceMetrics: {},
      activeAlerts: [],
      incidents: [],
      uptime: process.uptime()
    };

    this.alertCallbacks = [];
  }

  async startDashboard() {
    console.log('📊 **MONITORING DASHBOARD STARTING**');
    console.log(`🌐 Dashboard Port: ${this.options.port}`);
    console.log(`🔄 Refresh Interval: ${this.options.refreshInterval}ms`);
    console.log('');

    // Initial data collection
    await this.collectMetrics();

    // Start HTTP server for dashboard
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.options.port, () => {
      console.log(`📊 Monitoring Dashboard available at: http://localhost:${this.options.port}`);
    });

    // Start monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics().catch(console.error);
    }, this.options.refreshInterval);

    // Graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    return {
      port: this.options.port,
      url: `http://localhost:${this.options.port}`,
      dashboard: this
    };
  }

  async collectMetrics() {
    const startTime = performance.now();
    
    try {
      // Collect system health metrics
      await this.collectSystemHealth();
      
      // Collect performance metrics
      await this.collectPerformanceMetrics();
      
      // Load recent incidents
      await this.loadRecentIncidents();
      
      // Check for alerts
      if (this.options.enableAlerts) {
        await this.checkAlerts();
      }
      
      this.dashboardState.lastUpdate = new Date().toISOString();
      this.dashboardState.uptime = process.uptime();
      
      const collectionTime = Math.round(performance.now() - startTime);
      console.log(`📊 Metrics collected in ${collectionTime}ms`);
      
    } catch (error) {
      console.error('❌ Metrics collection failed:', error.message);
    }
  }

  async collectSystemHealth() {
    try {
      const { SystemHealthMonitor } = await import('./system-health-monitor.js');
      const healthMonitor = new SystemHealthMonitor({ detailed: false });
      const healthResults = await healthMonitor.checkSystem();
      
      this.dashboardState.systemHealth = {
        overall_status: healthResults.overall_status,
        operational_percentage: healthResults.performance_metrics.operational_percentage,
        systems: healthResults.systems,
        alerts: healthResults.alerts,
        timestamp: healthResults.timestamp
      };
      
    } catch (error) {
      this.dashboardState.systemHealth = {
        overall_status: 'unknown',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async collectPerformanceMetrics() {
    try {
      const { PerformanceMonitor } = await import('./performance-monitor.js');
      const perfMonitor = new PerformanceMonitor({ detailed: false });
      const perfResults = await perfMonitor.startMonitoring();
      
      this.dashboardState.performanceMetrics = {
        site_accessible: perfResults.metrics.production.accessible,
        response_time: perfResults.metrics.production.response_time,
        core_web_vitals: perfResults.core_web_vitals,
        performance_budget: perfResults.performance_budget,
        alerts: perfResults.alerts,
        timestamp: perfResults.timestamp
      };
      
    } catch (error) {
      this.dashboardState.performanceMetrics = {
        site_accessible: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async loadRecentIncidents() {
    try {
      const dataDir = path.resolve('data');
      if (!fs.existsSync(dataDir)) {
        this.dashboardState.incidents = [];
        return;
      }
      
      const incidentFiles = fs.readdirSync(dataDir)
        .filter(file => file.startsWith('incident-report-'))
        .sort((a, b) => b.localeCompare(a)) // Most recent first
        .slice(0, 5); // Last 5 incidents
      
      this.dashboardState.incidents = incidentFiles.map(file => {
        const filePath = path.join(dataDir, file);
        const incident = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return {
          id: incident.incident_details.id,
          timestamp: incident.incident_details.timestamp,
          status: incident.incident_details.status,
          severity: incident.incident_details.severity
        };
      });
      
    } catch (error) {
      this.dashboardState.incidents = [];
    }
  }

  async checkAlerts() {
    const alerts = [];
    const now = new Date();
    
    // System health alerts
    if (this.dashboardState.systemHealth.operational_percentage < this.options.alertThresholds.system_health) {
      alerts.push({
        id: 'system_health_low',
        severity: 'warning',
        title: 'System Health Below Threshold',
        message: `Only ${this.dashboardState.systemHealth.operational_percentage}% of systems operational`,
        timestamp: now.toISOString(),
        category: 'system_health'
      });
    }
    
    // Performance alerts
    if (this.dashboardState.performanceMetrics.response_time > this.options.alertThresholds.response_time) {
      alerts.push({
        id: 'high_response_time',
        severity: 'warning',
        title: 'High Response Time',
        message: `Response time: ${this.dashboardState.performanceMetrics.response_time}ms`,
        timestamp: now.toISOString(),
        category: 'performance'
      });
    }
    
    // Site accessibility alert
    if (!this.dashboardState.performanceMetrics.site_accessible) {
      alerts.push({
        id: 'site_inaccessible',
        severity: 'critical',
        title: 'Site Inaccessible',
        message: 'Production site is not responding',
        timestamp: now.toISOString(),
        category: 'accessibility'
      });
    }
    
    // Performance budget alerts
    if (this.dashboardState.performanceMetrics.performance_budget?.budget_compliance < this.options.alertThresholds.performance_budget) {
      alerts.push({
        id: 'performance_budget_exceeded',
        severity: 'info',
        title: 'Performance Budget Exceeded',
        message: `Budget compliance: ${this.dashboardState.performanceMetrics.performance_budget.budget_compliance}%`,
        timestamp: now.toISOString(),
        category: 'performance_budget'
      });
    }
    
    // Update active alerts
    this.dashboardState.activeAlerts = alerts;
    
    // Trigger alert callbacks for new alerts
    const newAlerts = alerts.filter(alert => 
      !this.previousAlerts?.some(prev => prev.id === alert.id)
    );
    
    if (newAlerts.length > 0) {
      this.triggerAlertCallbacks(newAlerts);
    }
    
    this.previousAlerts = alerts;
  }

  triggerAlertCallbacks(alerts) {
    alerts.forEach(alert => {
      console.log(`🚨 ALERT: ${alert.title} - ${alert.message}`);
      
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Alert callback error:', error.message);
        }
      });
    });
  }

  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.options.port}`);
    
    switch (url.pathname) {
      case '/':
        this.serveDashboard(res);
        break;
      case '/api/status':
        this.serveStatusAPI(res);
        break;
      case '/api/health':
        this.serveHealthAPI(res);
        break;
      case '/api/performance':
        this.servePerformanceAPI(res);
        break;
      case '/api/alerts':
        this.serveAlertsAPI(res);
        break;
      default:
        this.serve404(res);
        break;
    }
  }

  serveDashboard(res) {
    const html = this.generateDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveStatusAPI(res) {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(this.dashboardState, null, 2));
  }

  serveHealthAPI(res) {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(this.dashboardState.systemHealth, null, 2));
  }

  servePerformanceAPI(res) {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(this.dashboardState.performanceMetrics, null, 2));
  }

  serveAlertsAPI(res) {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(this.dashboardState.activeAlerts, null, 2));
  }

  serve404(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  generateDashboardHTML() {
    const statusColor = {
      excellent: '#10B981',
      good: '#F59E0B', 
      degraded: '#EF4444',
      critical: '#DC2626',
      unknown: '#6B7280'
    }[this.dashboardState.systemHealth.overall_status] || '#6B7280';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV System Monitoring Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1F2937; color: #F9FAFB; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header .status { font-size: 1.2rem; padding: 10px 20px; border-radius: 20px; display: inline-block; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #374151; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card h3 { font-size: 1.3rem; margin-bottom: 15px; color: #F3F4F6; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .metric-label { color: #D1D5DB; }
        .metric-value { font-weight: bold; }
        .alert { background: #FEF3C7; color: #92400E; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
        .alert-critical { background: #FEE2E2; color: #991B1B; }
        .alert-warning { background: #FEF3C7; color: #92400E; }
        .alert-info { background: #DBEAFE; color: #1E40AF; }
        .refresh { position: fixed; top: 20px; right: 20px; background: #3B82F6; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; }
        .uptime { text-align: center; margin-top: 20px; color: #9CA3AF; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CV System Monitoring Dashboard</h1>
            <div class="status" style="background-color: ${statusColor}; color: white;">
                ${this.dashboardState.systemHealth.overall_status?.toUpperCase() || 'UNKNOWN'}
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🔍 System Health</h3>
                <div class="metric">
                    <span class="metric-label">Overall Status:</span>
                    <span class="metric-value">${this.dashboardState.systemHealth.overall_status || 'Unknown'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Operational Systems:</span>
                    <span class="metric-value">${this.dashboardState.systemHealth.operational_percentage || 0}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Check:</span>
                    <span class="metric-value">${new Date(this.dashboardState.systemHealth.timestamp || Date.now()).toLocaleTimeString()}</span>
                </div>
            </div>
            
            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span class="metric-label">Site Status:</span>
                    <span class="metric-value">${this.dashboardState.performanceMetrics.site_accessible ? '🟢 Online' : '🔴 Offline'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time:</span>
                    <span class="metric-value">${this.dashboardState.performanceMetrics.response_time || 'Unknown'}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Performance Budget:</span>
                    <span class="metric-value">${this.dashboardState.performanceMetrics.performance_budget?.budget_compliance || 0}%</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🚨 Active Alerts</h3>
                ${this.dashboardState.activeAlerts.length === 0 
                  ? '<p style="color: #10B981;">No active alerts ✅</p>'
                  : this.dashboardState.activeAlerts.map(alert => 
                      `<div class="alert alert-${alert.severity}">
                         <strong>${alert.title}</strong><br>
                         ${alert.message}
                       </div>`
                    ).join('')
                }
            </div>
            
            <div class="card">
                <h3>📋 Recent Incidents</h3>
                ${this.dashboardState.incidents.length === 0
                  ? '<p style="color: #10B981;">No recent incidents ✅</p>'
                  : this.dashboardState.incidents.map(incident =>
                      `<div style="margin-bottom: 10px; padding: 5px; background: #4B5563; border-radius: 3px;">
                         <strong>${incident.id}</strong> - ${incident.status}<br>
                         <small>${new Date(incident.timestamp).toLocaleString()}</small>
                       </div>`
                    ).join('')
                }
            </div>
        </div>
        
        <div class="uptime">
            Dashboard uptime: ${Math.floor(this.dashboardState.uptime / 60)}m ${Math.floor(this.dashboardState.uptime % 60)}s
            <br>
            Last updated: ${new Date(this.dashboardState.lastUpdate || Date.now()).toLocaleString()}
        </div>
    </div>
    
    <a href="javascript:location.reload()" class="refresh">🔄 Refresh</a>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
        
        // Real-time updates via API
        setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                console.log('Dashboard data updated:', data.lastUpdate);
            } catch (error) {
                console.error('Failed to fetch updates:', error);
            }
        }, 10000);
    </script>
</body>
</html>`;
  }

  async shutdown() {
    console.log('🛑 Shutting down monitoring dashboard...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Monitoring dashboard stopped');
    process.exit(0);
  }

  async exportMetrics() {
    const exportData = {
      timestamp: new Date().toISOString(),
      dashboard_state: this.dashboardState,
      configuration: {
        port: this.options.port,
        refresh_interval: this.options.refreshInterval,
        alert_thresholds: this.options.alertThresholds
      }
    };

    const outputPath = path.resolve('data/monitoring-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`📁 Metrics exported to: ${outputPath}`);
    
    return exportData;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    port: parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1]) || 3000,
    refreshInterval: parseInt(args.find(arg => arg.startsWith('--refresh='))?.split('=')[1]) || 30000,
    enableAlerts: !args.includes('--no-alerts')
  };

  const dashboard = new MonitoringDashboard(options);
  
  // Setup alert handlers
  dashboard.onAlert((alert) => {
    console.log(`🔔 Alert triggered: ${alert.title}`);
    
    // Example: could integrate with Slack, email, etc.
    if (alert.severity === 'critical') {
      console.log('🚨 CRITICAL ALERT - Immediate attention required!');
    }
  });

  try {
    const result = await dashboard.startDashboard();
    console.log('✅ Monitoring dashboard started successfully');
    console.log(`🌐 Access dashboard at: ${result.url}`);
    console.log('');
    console.log('API Endpoints:');
    console.log(`  - Status: ${result.url}/api/status`);
    console.log(`  - Health: ${result.url}/api/health`);
    console.log(`  - Performance: ${result.url}/api/performance`);
    console.log(`  - Alerts: ${result.url}/api/alerts`);
    console.log('');
    console.log('Press Ctrl+C to stop the dashboard');
    
  } catch (error) {
    console.error('❌ Failed to start monitoring dashboard:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MonitoringDashboard };