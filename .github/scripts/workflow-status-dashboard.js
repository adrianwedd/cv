#!/usr/bin/env node

/**
 * Workflow Status Dashboard Generator
 * 
 * Creates rich status dashboards and badge systems for GitHub Actions workflows.
 * Generates real-time status reports with deployment URLs, performance metrics,
 * and visual indicators for CI excellence.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Workflow Status Dashboard Generator
 */
class WorkflowStatusDashboard {
    constructor(config = {}) {
        this.config = {
            dataDir: config.dataDir || path.join(process.cwd(), 'data'),
            outputDir: config.outputDir || path.join(process.cwd(), 'dist'),
            statusFile: 'workflow-status.json',
            dashboardFile: 'status-dashboard.html',
            badgeDir: 'badges',
            ...config
        };
        
        this.workflowStatus = {
            last_run: null,
            current_status: 'unknown',
            jobs: {},
            metrics: {},
            deployment: {},
            costs: {},
            badges: {}
        };
    }

    /**
     * Update workflow status from GitHub Actions context
     */
    async updateWorkflowStatus(context) {
        const {
            sessionId,
            enhancementStrategy,
            activityScore,
            aiStatus,
            buildStatus,
            deploymentUrl,
            environment,
            tokensUsed,
            actualCost,
            authMethod
        } = context;

        this.workflowStatus = {
            last_run: new Date().toISOString(),
            session_id: sessionId,
            current_status: this.calculateOverallStatus(context),
            jobs: {
                intelligence_analysis: {
                    status: 'success',
                    strategy: enhancementStrategy,
                    activity_score: activityScore,
                    outputs: { strategy: enhancementStrategy, score: activityScore }
                },
                data_collection: {
                    status: context.dataStatus || 'success',
                    outputs: { repos: context.repoCount, languages: context.languages }
                },
                ai_enhancement: {
                    status: aiStatus || 'success',
                    auth_method: authMethod,
                    tokens_used: tokensUsed || 0,
                    cost: actualCost || 0,
                    outputs: { status: aiStatus, tokens: tokensUsed, cost: actualCost }
                },
                website_build: {
                    status: buildStatus || 'success',
                    assets: context.assetCount || 0,
                    size: context.buildSize || '0',
                    outputs: { status: buildStatus, assets: context.assetCount }
                },
                deployment: {
                    status: deploymentUrl ? 'success' : 'failed',
                    url: deploymentUrl,
                    environment: environment,
                    outputs: { url: deploymentUrl, environment: environment }
                }
            },
            metrics: {
                activity_score: activityScore || 0,
                tokens_used: tokensUsed || 0,
                estimated_cost: context.estimatedCost || 0,
                actual_cost: actualCost || 0,
                build_assets: context.assetCount || 0,
                success_rate: this.calculateSuccessRate(context)
            },
            deployment: {
                url: deploymentUrl,
                environment: environment,
                status: deploymentUrl ? 'deployed' : 'failed',
                last_deploy: new Date().toISOString()
            },
            costs: {
                estimated: context.estimatedCost || 0,
                actual: actualCost || 0,
                auth_method: authMethod,
                savings_vs_api: this.calculateSavings(authMethod, tokensUsed || 0)
            }
        };

        // Generate badges
        await this.generateBadges();
        
        // Save status
        await this.saveStatus();
        
        return this.workflowStatus;
    }

    /**
     * Calculate overall workflow status
     */
    calculateOverallStatus(context) {
        const statuses = [
            'success', // intelligence always succeeds
            context.dataStatus || 'success',
            context.aiStatus || 'success',
            context.buildStatus === 'success' ? 'success' : 'partial',
            context.deploymentUrl ? 'success' : 'failed'
        ];

        if (statuses.every(s => s === 'success')) return 'success';
        if (statuses.some(s => s === 'failed')) return 'failed';
        return 'partial';
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(context) {
        const jobs = [
            true, // intelligence
            (context.dataStatus || 'success') === 'success',
            (context.aiStatus || 'success') === 'success',
            (context.buildStatus || 'success') === 'success',
            !!context.deploymentUrl
        ];

        const successful = jobs.filter(Boolean).length;
        return Math.round((successful / jobs.length) * 100);
    }

    /**
     * Calculate cost savings for OAuth vs API key
     */
    calculateSavings(authMethod, tokens) {
        if (authMethod !== 'oauth_max' || !tokens) return 0;
        
        // Estimate API key cost for same token usage
        const apiCost = (tokens * 0.6 / 1000000 * 3) + (tokens * 0.4 / 1000000 * 15);
        const subscriptionCost = 100 / 30; // Daily cost of Max 5x
        
        return Math.max(0, apiCost - subscriptionCost);
    }

    /**
     * Generate status badges
     */
    async generateBadges() {
        const badges = {
            status: this.createStatusBadge(),
            deployment: this.createDeploymentBadge(),
            activity: this.createActivityBadge(),
            cost: this.createCostBadge(),
            auth: this.createAuthBadge()
        };

        this.workflowStatus.badges = badges;

        // Generate badge files
        await this.saveBadges(badges);
    }

    /**
     * Create status badge data
     */
    createStatusBadge() {
        const status = this.workflowStatus.current_status;
        const colors = {
            success: 'brightgreen',
            partial: 'yellow',
            failed: 'red',
            unknown: 'lightgrey'
        };

        return {
            schemaVersion: 1,
            label: 'CV Pipeline',
            message: status.charAt(0).toUpperCase() + status.slice(1),
            color: colors[status] || 'lightgrey',
            namedLogo: 'github-actions',
            logoColor: 'white'
        };
    }

    /**
     * Create deployment badge data
     */
    createDeploymentBadge() {
        const deployment = this.workflowStatus.deployment;
        const isDeployed = deployment.status === 'deployed';

        return {
            schemaVersion: 1,
            label: 'Deployment',
            message: isDeployed ? `Live (${deployment.environment})` : 'Failed',
            color: isDeployed ? 'brightgreen' : 'red',
            namedLogo: 'github-pages',
            logoColor: 'white'
        };
    }

    /**
     * Create activity badge data
     */
    createActivityBadge() {
        const score = this.workflowStatus.metrics.activity_score;
        const color = score >= 80 ? 'brightgreen' : 
                     score >= 60 ? 'green' :
                     score >= 40 ? 'yellow' : 'orange';

        return {
            schemaVersion: 1,
            label: 'Activity Score',
            message: `${score}/100`,
            color: color,
            namedLogo: 'github',
            logoColor: 'white'
        };
    }

    /**
     * Create cost badge data
     */
    createCostBadge() {
        const cost = this.workflowStatus.costs.actual;
        const authMethod = this.workflowStatus.costs.auth_method;
        
        let message, color;
        if (authMethod === 'oauth_max') {
            message = 'Fixed Cost';
            color = 'brightgreen';
        } else if (cost < 0.01) {
            message = `$${cost.toFixed(4)}`;
            color = 'green';
        } else if (cost < 0.05) {
            message = `$${cost.toFixed(3)}`;
            color = 'yellow';
        } else {
            message = `$${cost.toFixed(2)}`;
            color = 'orange';
        }

        return {
            schemaVersion: 1,
            label: 'Cost',
            message: message,
            color: color,
            namedLogo: 'anthropic',
            logoColor: 'white'
        };
    }

    /**
     * Create authentication badge data
     */
    createAuthBadge() {
        const authMethod = this.workflowStatus.costs.auth_method;
        const colors = {
            oauth_max: 'brightgreen',
            api_key: 'yellow',
            none: 'red'
        };

        const labels = {
            oauth_max: 'Claude Max',
            api_key: 'API Key',
            none: 'No Auth'
        };

        return {
            schemaVersion: 1,
            label: 'Auth Method',
            message: labels[authMethod] || 'Unknown',
            color: colors[authMethod] || 'lightgrey',
            namedLogo: 'anthropic',
            logoColor: 'white'
        };
    }

    /**
     * Generate status dashboard HTML
     */
    async generateDashboard() {
        const status = this.workflowStatus;
        const lastRun = new Date(status.last_run).toLocaleString();

        const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Pipeline Status Dashboard</title>
    <style>
        :root {
            --success: #28a745;
            --warning: #ffc107;
            --danger: #dc3545;
            --info: #17a2b8;
            --light: #f8f9fa;
            --dark: #343a40;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: var(--dark);
        }
        
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .header .subtitle {
            opacity: 0.9;
            font-size: 1.1em;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 30px;
        }
        
        .status-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid var(--info);
        }
        
        .status-card.success { border-left-color: var(--success); }
        .status-card.warning { border-left-color: var(--warning); }
        .status-card.danger { border-left-color: var(--danger); }
        
        .status-card h3 {
            margin: 0 0 15px 0;
            font-size: 1.2em;
            color: var(--dark);
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            font-weight: 500;
            color: #666;
        }
        
        .metric-value {
            font-weight: 600;
            color: var(--dark);
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge.success { background: var(--success); color: white; }
        .badge.warning { background: var(--warning); color: var(--dark); }
        .badge.danger { background: var(--danger); color: white; }
        
        .deployment-link {
            display: inline-block;
            background: var(--info);
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.3s;
        }
        
        .deployment-link:hover {
            background: #138496;
        }
        
        .last-updated {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #eee;
        }
        
        @media (max-width: 768px) {
            .status-grid {
                grid-template-columns: 1fr;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🚀 CV Pipeline Status</h1>
            <div class="subtitle">Real-time workflow monitoring and deployment tracking</div>
        </div>
        
        <div class="status-grid">
            <div class="status-card ${this.getStatusCardClass(status.current_status)}">
                <h3>🎯 Overall Status</h3>
                <div class="metric">
                    <span class="metric-label">Pipeline Status</span>
                    <span class="badge ${this.getStatusClass(status.current_status)}">${status.current_status}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate</span>
                    <span class="metric-value">${status.metrics.success_rate}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Session ID</span>
                    <span class="metric-value">${status.session_id || 'N/A'}</span>
                </div>
            </div>
            
            <div class="status-card success">
                <h3>📊 Performance Metrics</h3>
                <div class="metric">
                    <span class="metric-label">Activity Score</span>
                    <span class="metric-value">${status.metrics.activity_score}/100</span>
                </div>
                <div class="metric">
                    <span class="metric-label">AI Tokens Used</span>
                    <span class="metric-value">${status.metrics.tokens_used.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Build Assets</span>
                    <span class="metric-value">${status.metrics.build_assets}</span>
                </div>
            </div>
            
            <div class="status-card ${this.getStatusCardClass(status.deployment.status)}">
                <h3>🌐 Deployment</h3>
                <div class="metric">
                    <span class="metric-label">Environment</span>
                    <span class="metric-value">${status.deployment.environment || 'N/A'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Status</span>
                    <span class="badge ${this.getDeploymentStatusClass(status.deployment.status)}">${status.deployment.status}</span>
                </div>
                ${status.deployment.url ? `
                <div style="margin-top: 15px;">
                    <a href="${status.deployment.url}" class="deployment-link" target="_blank">
                        🔗 View Live Site
                    </a>
                </div>
                ` : ''}
            </div>
            
            <div class="status-card success">
                <h3>💰 Cost Analysis</h3>
                <div class="metric">
                    <span class="metric-label">Authentication</span>
                    <span class="metric-value">${this.getAuthMethodLabel(status.costs.auth_method)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Estimated Cost</span>
                    <span class="metric-value">$${status.costs.estimated.toFixed(4)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Actual Cost</span>
                    <span class="metric-value">$${status.costs.actual.toFixed(4)}</span>
                </div>
                ${status.costs.savings_vs_api > 0 ? `
                <div class="metric">
                    <span class="metric-label">Savings vs API</span>
                    <span class="metric-value" style="color: var(--success);">$${status.costs.savings_vs_api.toFixed(4)}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="last-updated">
            Last updated: ${lastRun}
        </div>
    </div>
    
    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 300000);
    </script>
</body>
</html>`;

        // Save dashboard
        const dashboardPath = path.join(this.config.outputDir, this.config.dashboardFile);
        await fs.mkdir(path.dirname(dashboardPath), { recursive: true });
        await fs.writeFile(dashboardPath, dashboardHTML);

        return dashboardPath;
    }

    /**
     * Helper methods for HTML generation
     */
    getStatusCardClass(status) {
        const classes = {
            success: 'success',
            partial: 'warning',
            failed: 'danger'
        };
        return classes[status] || '';
    }

    getStatusClass(status) {
        const classes = {
            success: 'success',
            partial: 'warning',
            failed: 'danger'
        };
        return classes[status] || '';
    }

    getDeploymentStatusClass(status) {
        return status === 'deployed' ? 'success' : 'danger';
    }

    getAuthMethodLabel(method) {
        const labels = {
            oauth_max: 'Claude Max OAuth',
            api_key: 'API Key',
            none: 'No Authentication'
        };
        return labels[method] || 'Unknown';
    }

    /**
     * Save badges as JSON files for shields.io
     */
    async saveBadges(badges) {
        const badgeDir = path.join(this.config.outputDir, this.config.badgeDir);
        await fs.mkdir(badgeDir, { recursive: true });

        for (const [name, badge] of Object.entries(badges)) {
            const badgePath = path.join(badgeDir, `${name}.json`);
            await fs.writeFile(badgePath, JSON.stringify(badge, null, 2));
        }
    }

    /**
     * Save workflow status
     */
    async saveStatus() {
        const statusPath = path.join(this.config.dataDir, this.config.statusFile);
        await fs.mkdir(this.config.dataDir, { recursive: true });
        await fs.writeFile(statusPath, JSON.stringify(this.workflowStatus, null, 2));
    }

    /**
     * Load existing workflow status
     */
    async loadStatus() {
        try {
            const statusPath = path.join(this.config.dataDir, this.config.statusFile);
            const data = await fs.readFile(statusPath, 'utf8');
            this.workflowStatus = JSON.parse(data);
        } catch (error) {
            // File doesn't exist, use defaults
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const command = process.argv[2];
    const dashboard = new WorkflowStatusDashboard();

    switch (command) {
        case 'update':
            // Update status from environment variables or command line args
            const context = {
                sessionId: process.env.SESSION_ID || process.argv[3],
                enhancementStrategy: process.env.ENHANCEMENT_STRATEGY || process.argv[4],
                activityScore: parseInt(process.env.ACTIVITY_SCORE) || parseInt(process.argv[5]) || 0,
                aiStatus: process.env.AI_STATUS || process.argv[6] || 'success',
                buildStatus: process.env.BUILD_STATUS || process.argv[7] || 'success',
                deploymentUrl: process.env.DEPLOYMENT_URL || process.argv[8],
                environment: process.env.ENVIRONMENT || process.argv[9] || 'production',
                tokensUsed: parseInt(process.env.TOKENS_USED) || parseInt(process.argv[10]) || 0,
                actualCost: parseFloat(process.env.ACTUAL_COST) || parseFloat(process.argv[11]) || 0,
                authMethod: process.env.AUTH_METHOD || process.argv[12] || 'api_key'
            };

            await dashboard.updateWorkflowStatus(context);
            console.log('✅ Workflow status updated');
            break;

        case 'dashboard':
            await dashboard.loadStatus();
            const dashboardPath = await dashboard.generateDashboard();
            console.log(`✅ Dashboard generated: ${dashboardPath}`);
            break;

        case 'badges':
            await dashboard.loadStatus();
            await dashboard.generateBadges();
            console.log('✅ Badges generated');
            break;

        case 'status':
            await dashboard.loadStatus();
            console.log('📊 Current Workflow Status:');
            console.log(JSON.stringify(dashboard.workflowStatus, null, 2));
            break;

        default:
            console.log('📊 **WORKFLOW STATUS DASHBOARD**\n');
            console.log('Usage:');
            console.log('  node workflow-status-dashboard.js update [args]  - Update status');
            console.log('  node workflow-status-dashboard.js dashboard      - Generate dashboard');
            console.log('  node workflow-status-dashboard.js badges        - Generate badges');
            console.log('  node workflow-status-dashboard.js status        - Show current status');
            console.log('');
            console.log('Update args: sessionId strategy activityScore aiStatus buildStatus');
            console.log('            deploymentUrl environment tokensUsed actualCost authMethod');
            break;
    }
}

module.exports = { WorkflowStatusDashboard };

if (require.main === module) {
    main().catch(console.error);
}