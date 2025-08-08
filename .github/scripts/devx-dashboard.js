#!/usr/bin/env node

/**
 * DevX Dashboard - Integrated Development Monitoring and Operations Hub
 * 
 * Provides unified interface for:
 * - Real-time system health monitoring
 * - Development workflow status
 * - Performance metrics and analytics
 * - Authentication status and management
 * - Quick actions and automation triggers
 * 
 * Eliminates context switching between multiple monitoring tools
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createServer } from 'http';
import { parse } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DevXDashboard {
    constructor(options = {}) {
        this.port = options.port || 3333;
        this.dataDir = resolve(__dirname, 'data');
        this.refreshInterval = options.refreshInterval || 5000; // 5 seconds
        this.clients = new Set();
    }

    async start() {
        const server = createServer((req, res) => this.handleRequest(req, res));
        
        server.listen(this.port, () => {
            console.log(`🚀 DevX Dashboard running at http://localhost:${this.port}`);
            console.log(`📊 Real-time monitoring with ${this.refreshInterval}ms refresh`);
            console.log(`🔄 Press Ctrl+C to stop`);
        });

        // Start real-time data collection
        this.startDataCollection();

        return server;
    }

    async handleRequest(req, res) {
        const parsedUrl = parse(req.url, true);
        const pathname = parsedUrl.pathname;

        // CORS headers for development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        switch (pathname) {
            case '/':
                this.serveDashboard(res);
                break;
            case '/api/status':
                this.serveSystemStatus(res);
                break;
            case '/api/health':
                this.serveHealthData(res);
                break;
            case '/api/performance':
                this.servePerformanceData(res);
                break;
            case '/api/authentication':
                this.serveAuthenticationStatus(res);
                break;
            case '/api/workflows':
                this.serveWorkflowStatus(res);
                break;
            case '/api/actions':
                this.handleActions(req, res, parsedUrl.query);
                break;
            case '/sse':
                this.handleServerSentEvents(req, res);
                break;
            default:
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
        }
    }

    serveDashboard(res) {
        const dashboardHTML = this.generateDashboardHTML();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboardHTML);
    }

    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevX Dashboard - CV Enhancement System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px 30px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h1 {
            color: #2c3e50;
            font-size: 28px;
            font-weight: 700;
        }

        .header .subtitle {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 5px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        .status-healthy { background: #27ae60; }
        .status-warning { background: #f39c12; }
        .status-error { background: #e74c3c; }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .card-title {
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
        }

        .card-icon {
            font-size: 24px;
        }

        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
        }

        .metric:last-child {
            border-bottom: none;
        }

        .metric-label {
            color: #7f8c8d;
            font-size: 14px;
        }

        .metric-value {
            font-weight: 600;
            color: #2c3e50;
        }

        .actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }

        .action-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            text-align: center;
            display: inline-block;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .action-btn.success {
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
        }

        .action-btn.warning {
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        }

        .action-btn.danger {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #27ae60, #2ecc71);
            transition: width 0.5s ease;
        }

        .log-container {
            background: #2c3e50;
            color: #ecf0f1;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 15px;
        }

        .log-entry {
            margin-bottom: 5px;
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
        }

        @keyframes fadeIn {
            to { opacity: 1; }
        }

        .timestamp {
            color: #95a5a6;
        }

        .footer {
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 30px;
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .dashboard {
                padding: 15px;
            }
            
            .header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <div>
                <h1>🚀 DevX Dashboard</h1>
                <p class="subtitle">CV Enhancement System - Developer Experience Monitor</p>
            </div>
            <div class="status-indicator">
                <div class="status-dot status-healthy" id="systemStatus"></div>
                <span id="statusText">System Healthy</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <!-- System Health Card -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">System Health</span>
                    <span class="card-icon">🏥</span>
                </div>
                <div id="healthMetrics">
                    <div class="metric">
                        <span class="metric-label">Overall Health</span>
                        <span class="metric-value" id="overallHealth">Loading...</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="healthProgress"></div>
                    </div>
                </div>
            </div>

            <!-- Authentication Card -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Authentication</span>
                    <span class="card-icon">🔐</span>
                </div>
                <div id="authMetrics">
                    <div class="metric">
                        <span class="metric-label">Auth Method</span>
                        <span class="metric-value" id="authMethod">Loading...</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Status</span>
                        <span class="metric-value" id="authStatus">Loading...</span>
                    </div>
                </div>
            </div>

            <!-- Performance Card -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Performance</span>
                    <span class="card-icon">⚡</span>
                </div>
                <div id="performanceMetrics">
                    <div class="metric">
                        <span class="metric-label">Response Time</span>
                        <span class="metric-value" id="responseTime">Loading...</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Data Size</span>
                        <span class="metric-value" id="dataSize">Loading...</span>
                    </div>
                </div>
            </div>

            <!-- Workflow Status Card -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Workflows</span>
                    <span class="card-icon">🔄</span>
                </div>
                <div id="workflowMetrics">
                    <div class="metric">
                        <span class="metric-label">Active Workflows</span>
                        <span class="metric-value" id="activeWorkflows">Loading...</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Last Run</span>
                        <span class="metric-value" id="lastWorkflow">Loading...</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">Quick Actions</span>
                <span class="card-icon">⚡</span>
            </div>
            <div class="actions">
                <button class="action-btn success" onclick="runAction('health')">Health Check</button>
                <button class="action-btn" onclick="runAction('test')">Run Tests</button>
                <button class="action-btn" onclick="runAction('generate')">Generate CV</button>
                <button class="action-btn warning" onclick="runAction('auth')">Refresh Auth</button>
                <button class="action-btn danger" onclick="runAction('reset')">Reset Cache</button>
                <button class="action-btn" onclick="runAction('deploy')">Deploy</button>
            </div>
        </div>

        <!-- Activity Log -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">Activity Log</span>
                <span class="card-icon">📋</span>
            </div>
            <div class="log-container" id="activityLog">
                <div class="log-entry">
                    <span class="timestamp">[${new Date().toISOString()}]</span>
                    <span>DevX Dashboard initialized</span>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>DevX Dashboard - Eliminating Developer Workflow Friction</p>
        <p>Auto-refresh: ${this.refreshInterval}ms | Port: ${this.port}</p>
    </div>

    <script>
        // Real-time dashboard updates via Server-Sent Events
        const eventSource = new EventSource('/sse');
        
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            updateDashboard(data);
        };

        eventSource.onerror = function(event) {
            console.error('SSE connection error:', event);
            addLogEntry('Connection error - attempting reconnect...', 'error');
        };

        function updateDashboard(data) {
            // Update system status
            const statusDot = document.getElementById('systemStatus');
            const statusText = document.getElementById('statusText');
            
            if (data.overallHealth >= 80) {
                statusDot.className = 'status-dot status-healthy';
                statusText.textContent = 'System Healthy';
            } else if (data.overallHealth >= 60) {
                statusDot.className = 'status-dot status-warning';
                statusText.textContent = 'System Warning';
            } else {
                statusDot.className = 'status-dot status-error';
                statusText.textContent = 'System Error';
            }

            // Update health metrics
            document.getElementById('overallHealth').textContent = data.overallHealth + '%';
            document.getElementById('healthProgress').style.width = data.overallHealth + '%';

            // Update authentication
            document.getElementById('authMethod').textContent = data.authMethod || 'Unknown';
            document.getElementById('authStatus').textContent = data.authStatus || 'Unknown';

            // Update performance
            document.getElementById('responseTime').textContent = data.responseTime || 'N/A';
            document.getElementById('dataSize').textContent = data.dataSize || 'N/A';

            // Update workflows
            document.getElementById('activeWorkflows').textContent = data.activeWorkflows || '0';
            document.getElementById('lastWorkflow').textContent = data.lastWorkflow || 'Never';

            // Add activity log if present
            if (data.logEntry) {
                addLogEntry(data.logEntry.message, data.logEntry.level);
            }
        }

        function addLogEntry(message, level = 'info') {
            const logContainer = document.getElementById('activityLog');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const timestamp = new Date().toISOString().substring(11, 19);
            logEntry.innerHTML = \`
                <span class="timestamp">[\${timestamp}]</span>
                <span>\${message}</span>
            \`;
            
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;

            // Keep only last 50 entries
            while (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.firstChild);
            }
        }

        async function runAction(action) {
            addLogEntry(\`Running action: \${action}\`, 'info');
            
            try {
                const response = await fetch(\`/api/actions?action=\${action}\`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    addLogEntry(\`Action \${action} completed successfully\`, 'success');
                } else {
                    addLogEntry(\`Action \${action} failed: \${result.error}\`, 'error');
                }
            } catch (error) {
                addLogEntry(\`Action \${action} failed: \${error.message}\`, 'error');
            }
        }

        // Initial data load
        fetch('/api/status')
            .then(response => response.json())
            .then(data => updateDashboard(data))
            .catch(error => {
                console.error('Failed to load initial data:', error);
                addLogEntry('Failed to load initial dashboard data', 'error');
            });

        // Add welcome message
        setTimeout(() => {
            addLogEntry('Dashboard ready - monitoring system health', 'success');
        }, 1000);
    </script>
</body>
</html>`;
    }

    async serveSystemStatus(res) {
        try {
            const status = await this.collectSystemStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async collectSystemStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            overallHealth: 100,
            authMethod: 'Unknown',
            authStatus: 'Unknown',
            responseTime: 'N/A',
            dataSize: 'N/A',
            activeWorkflows: 0,
            lastWorkflow: 'Never'
        };

        try {
            // Check authentication status
            const envFile = resolve(__dirname, '.env');
            if (existsSync(envFile)) {
                const envContent = readFileSync(envFile, 'utf8');
                
                if (envContent.includes('CLAUDE_SESSION_KEY=') && envContent.match(/CLAUDE_SESSION_KEY=.+/)) {
                    status.authMethod = 'Browser';
                    status.authStatus = 'Configured';
                } else if (envContent.includes('CLAUDE_OAUTH_TOKEN=') && envContent.match(/CLAUDE_OAUTH_TOKEN=.+/)) {
                    status.authMethod = 'OAuth';
                    status.authStatus = 'Configured';
                } else if (envContent.includes('ANTHROPIC_API_KEY=') && envContent.match(/ANTHROPIC_API_KEY=.+/)) {
                    status.authMethod = 'API Key';
                    status.authStatus = 'Configured';
                } else {
                    status.authMethod = 'None';
                    status.authStatus = 'Not Configured';
                    status.overallHealth -= 25;
                }
            } else {
                status.authMethod = 'None';
                status.authStatus = 'No .env file';
                status.overallHealth -= 30;
            }

            // Check data directory size
            const dataDirSize = await this.getDirectorySize(this.dataDir);
            status.dataSize = this.formatFileSize(dataDirSize);

            // Check if dependencies are installed
            const nodeModules = resolve(__dirname, 'node_modules');
            if (!existsSync(nodeModules)) {
                status.overallHealth -= 25;
            }

            // Measure response time
            const start = Date.now();
            await new Promise(resolve => setTimeout(resolve, 1));
            status.responseTime = (Date.now() - start) + 'ms';

        } catch (error) {
            status.overallHealth -= 20;
            status.error = error.message;
        }

        return status;
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

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    handleServerSentEvents(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        this.clients.add(res);

        req.on('close', () => {
            this.clients.delete(res);
        });

        // Send initial data
        this.collectSystemStatus().then(status => {
            res.write(\`data: \${JSON.stringify(status)}\\n\\n\`);
        });
    }

    async handleActions(req, res, query) {
        const action = query.action;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        try {
            const result = await this.executeAction(action);
            res.end(JSON.stringify({ success: true, result }));
        } catch (error) {
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    }

    async executeAction(action) {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        switch (action) {
            case 'health':
                return await execAsync('node devx-cli.js health', { cwd: __dirname });
            case 'test':
                return await execAsync('npm test', { cwd: __dirname });
            case 'generate':
                return await execAsync('npm run generate', { cwd: __dirname });
            case 'auth':
                return await execAsync('node browser-auth-refresh.js', { cwd: __dirname });
            case 'reset':
                return await execAsync('rm -rf data/cache/* data/*.tmp', { cwd: __dirname });
            case 'deploy':
                return await execAsync('node devx-cli.js deploy', { cwd: __dirname });
            default:
                throw new Error(\`Unknown action: \${action}\`);
        }
    }

    startDataCollection() {
        // Collect and broadcast data every refresh interval
        setInterval(async () => {
            try {
                const status = await this.collectSystemStatus();
                
                // Broadcast to all connected clients
                this.clients.forEach(client => {
                    try {
                        client.write(\`data: \${JSON.stringify(status)}\\n\\n\`);
                    } catch (error) {
                        this.clients.delete(client);
                    }
                });
            } catch (error) {
                console.error('Data collection error:', error);
            }
        }, this.refreshInterval);
    }

    async serveHealthData(res) {
        // Placeholder for detailed health data
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Health data endpoint' }));
    }

    async servePerformanceData(res) {
        // Placeholder for performance data
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Performance data endpoint' }));
    }

    async serveAuthenticationStatus(res) {
        // Placeholder for authentication data
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Authentication data endpoint' }));
    }

    async serveWorkflowStatus(res) {
        // Placeholder for workflow data
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Workflow data endpoint' }));
    }
}

// CLI Entry Point
if (import.meta.url === \`file://\${process.argv[1]}\`) {
    const dashboard = new DevXDashboard({
        port: process.argv[2] || 3333,
        refreshInterval: 5000
    });
    
    dashboard.start().catch(error => {
        console.error('Failed to start DevX Dashboard:', error);
        process.exit(1);
    });
}

export default DevXDashboard;