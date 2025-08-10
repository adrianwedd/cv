#!/usr/bin/env node

/**
 * Unified Developer Experience Dashboard
 * 
 * Central command center for developer workflow optimization and productivity analytics.
 * Consolidates insights from workflow analysis, issue management, and team productivity metrics.
 * 
 * Features:
 * - Real-time workflow health monitoring
 * - Team productivity analytics and insights
 * - Issue management efficiency tracking
 * - Automated optimization recommendations
 * - Interactive CLI interface with live updates
 * - Integration with existing DevX tools
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI Colors and formatting
const colors = {
    reset: '\\x1b[0m',
    bright: '\\x1b[1m',
    dim: '\\x1b[2m',
    red: '\\x1b[31m',
    green: '\\x1b[32m',
    yellow: '\\x1b[33m',
    blue: '\\x1b[34m',
    magenta: '\\x1b[35m',
    cyan: '\\x1b[36m',
    white: '\\x1b[37m',
    bgRed: '\\x1b[41m',
    bgGreen: '\\x1b[42m',
    bgYellow: '\\x1b[43m',
    bgBlue: '\\x1b[44m'
};

class UnifiedDevXDashboard {
    constructor() {
        this.config = {
            refreshInterval: 5000, // 5 seconds
            dataRetention: 24 * 60 * 60 * 1000, // 24 hours
            alertThresholds: {
                workflowSuccessRate: 0.95,
                issueResolutionTime: 72, // hours
                teamUtilization: 0.85,
                qualityScore: 0.8
            }
        };
        
        this.dashboard = {
            workflows: {},
            issues: {},
            team: {},
            productivity: {},
            alerts: []
        };
        
        this.isRunning = false;
        this.rl = null;
    }

    /**
     * Start the interactive dashboard
     */
    async start() {
        console.clear();
        this.printHeader();
        
        this.isRunning = true;
        this.rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Initial data load
        await this.refreshData();
        
        // Start refresh cycle
        this.startRefreshCycle();
        
        // Start interactive mode
        this.startInteractiveMode();
    }

    /**
     * Print dashboard header
     */
    printHeader() {
        const header = `
${colors.cyan}╭─────────────────────────────────────────────────────────────────────────────╮
│                    🚀 UNIFIED DEVELOPER EXPERIENCE DASHBOARD                 │
│                         Flow State Optimization Center                       │
╰─────────────────────────────────────────────────────────────────────────────╯${colors.reset}

${colors.dim}Last updated: ${new Date().toLocaleString()}${colors.reset}
        `;
        
        console.log(header);
    }

    /**
     * Refresh all dashboard data
     */
    async refreshData() {
        try {
            await Promise.all([
                this.loadWorkflowMetrics(),
                this.loadIssueMetrics(),
                this.loadTeamMetrics(),
                this.loadProductivityMetrics(),
                this.generateAlerts()
            ]);
            
            this.renderDashboard();
            
        } catch (error) {
            console.error(`${colors.red}❌ Error refreshing data: ${error.message}${colors.reset}`);
        }
    }

    /**
     * Load workflow performance metrics
     */
    async loadWorkflowMetrics() {
        // Simulate workflow analysis - in real implementation would query GitHub API
        const workflowData = {
            totalWorkflows: 27,
            activeWorkflows: 15,
            successRate: 0.92,
            averageRunTime: 12.5, // minutes
            failureRate: 0.08,
            costPerMonth: 245, // USD
            topFailingWorkflows: [
                { name: 'Production Deployment', failures: 3 },
                { name: 'Performance Testing', failures: 2 },
                { name: 'Security Scanning', failures: 1 }
            ],
            recentRuns: [
                { workflow: 'Staging Deployment', status: 'success', duration: 8.2 },
                { workflow: 'Quality Gates', status: 'success', duration: 15.1 },
                { workflow: 'Documentation Check', status: 'failure', duration: 2.3 }
            ]
        };
        
        // Load optimization recommendations
        const optimizationFile = resolve(__dirname, 'data/workflow-consolidation-report.json');
        if (existsSync(optimizationFile)) {
            try {
                const optimization = JSON.parse(readFileSync(optimizationFile, 'utf8'));
                workflowData.optimization = {
                    potentialSavings: optimization.consolidationPlan?.strategy?.estimatedSavings || {},
                    consolidationOpportunity: optimization.analysis?.totalWorkflows || 0,
                    targetWorkflows: 4
                };
            } catch (error) {
                console.warn('Could not load workflow optimization data');
            }
        }
        
        this.dashboard.workflows = workflowData;
    }

    /**
     * Load issue management metrics
     */
    async loadIssueMetrics() {
        // Simulate issue analysis - in real implementation would query GitHub API
        const issueData = {
            totalOpen: 10,
            highPriority: 3,
            averageResolutionTime: 48, // hours
            qualityScore: 0.75,
            automationRate: 0.60,
            recentIssues: [
                { number: 269, title: 'CSP Policy Violations', priority: 'High', age: 4, automated: true },
                { number: 259, title: 'CV Layout Recovery', priority: 'High', age: 6, automated: true },
                { number: 252, title: 'Technical Debt Analysis', priority: 'Medium', age: 7, automated: false }
            ]
        };
        
        // Load analysis log if available
        const analysisFile = resolve(__dirname, 'data/issue-analysis-log.jsonl');
        if (existsSync(analysisFile)) {
            try {
                const logs = readFileSync(analysisFile, 'utf8')
                    .split('\\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line));
                
                if (logs.length > 0) {
                    issueData.analyzed = logs.length;
                    issueData.averageQualityScore = logs.reduce((sum, log) => 
                        sum + log.analysis.qualityScore, 0) / logs.length;
                    issueData.automationRate = logs.filter(log => 
                        log.recommendations.actionsCount > 0).length / logs.length;
                }
            } catch (error) {
                console.warn('Could not load issue analysis data');
            }
        }
        
        this.dashboard.issues = issueData;
    }

    /**
     * Load team productivity metrics
     */
    async loadTeamMetrics() {
        // Load team workload data
        const workloadFile = resolve(__dirname, 'data/team-workload.json');
        let workloadData = {
            'security': 20,
            'performance': 35,
            'frontend': 45,
            'backend': 40,
            'devops': 25,
            'documentation': 15
        };
        
        if (existsSync(workloadFile)) {
            try {
                workloadData = JSON.parse(readFileSync(workloadFile, 'utf8'));
            } catch (error) {
                console.warn('Could not load team workload data');
            }
        }
        
        const teamData = {
            totalTeams: Object.keys(workloadData).length,
            averageUtilization: Object.values(workloadData).reduce((sum, val) => sum + val, 0) / 
                                Object.values(workloadData).length / 100,
            workloadDistribution: workloadData,
            bottlenecks: Object.entries(workloadData)
                .filter(([team, workload]) => workload > 80)
                .map(([team, workload]) => ({ team, utilization: workload / 100 })),
            availableCapacity: Object.entries(workloadData)
                .filter(([team, workload]) => workload < 60)
                .map(([team, workload]) => ({ team, capacity: (100 - workload) / 100 }))
        };
        
        this.dashboard.team = teamData;
    }

    /**
     * Load productivity metrics
     */
    async loadProductivityMetrics() {
        // Simulate productivity analysis
        const productivityData = {
            developmentVelocity: {
                commitsPerDay: 8.5,
                prsPerWeek: 12,
                deploymentFrequency: 2.3, // per day
                leadTime: 4.2 // hours
            },
            qualityMetrics: {
                testCoverage: 0.85,
                codeReviewTime: 3.2, // hours
                bugEscapeRate: 0.05,
                technicalDebtRatio: 0.15
            },
            developerExperience: {
                setupTime: 180, // minutes (target: < 5)
                contextSwitches: 12, // per day (target: < 3)
                manualInterventions: 8, // per week (target: < 1)
                satisfactionScore: 0.78 // (target: > 0.9)
            },
            optimization: {
                timeToFirstCommit: 45, // minutes after setup
                cicdEfficiency: 0.88,
                automationCoverage: 0.72,
                errorRecoveryTime: 25 // minutes
            }
        };
        
        this.dashboard.productivity = productivityData;
    }

    /**
     * Generate alerts based on thresholds
     */
    async generateAlerts() {
        const alerts = [];
        
        // Workflow alerts
        if (this.dashboard.workflows.successRate < this.config.alertThresholds.workflowSuccessRate) {
            alerts.push({
                type: 'warning',
                category: 'workflows',
                message: `Workflow success rate (${(this.dashboard.workflows.successRate * 100).toFixed(1)}%) below threshold`,
                action: 'Review failing workflows and implement fixes'
            });
        }
        
        // Issue management alerts
        if (this.dashboard.issues.averageResolutionTime > this.config.alertThresholds.issueResolutionTime) {
            alerts.push({
                type: 'warning',
                category: 'issues',
                message: `Average issue resolution time (${this.dashboard.issues.averageResolutionTime}h) exceeds SLA`,
                action: 'Optimize issue triage and assignment process'
            });
        }
        
        // Team utilization alerts
        const highUtilizationTeams = this.dashboard.team.bottlenecks.filter(
            team => team.utilization > this.config.alertThresholds.teamUtilization
        );
        
        if (highUtilizationTeams.length > 0) {
            alerts.push({
                type: 'critical',
                category: 'team',
                message: `${highUtilizationTeams.length} team(s) over-utilized: ${highUtilizationTeams.map(t => t.team).join(', ')}`,
                action: 'Redistribute workload or add capacity'
            });
        }
        
        // Developer experience alerts
        if (this.dashboard.productivity.developerExperience.setupTime > 300) {
            alerts.push({
                type: 'info',
                category: 'devx',
                message: 'Developer setup time exceeds target (5 minutes)',
                action: 'Implement DevX onboarding automation'
            });
        }
        
        this.dashboard.alerts = alerts;
    }

    /**
     * Render the complete dashboard
     */
    renderDashboard() {
        console.clear();
        this.printHeader();
        
        // Workflow Health Section
        this.renderWorkflowSection();
        
        // Issue Management Section
        this.renderIssueSection();
        
        // Team Productivity Section
        this.renderTeamSection();
        
        // Developer Experience Section
        this.renderDevXSection();
        
        // Alerts Section
        this.renderAlertsSection();
        
        // Action Menu
        this.renderActionMenu();
    }

    /**
     * Render workflow health section
     */
    renderWorkflowSection() {
        const w = this.dashboard.workflows;
        
        console.log(`${colors.blue}╭─ WORKFLOW HEALTH ────────────────────────────────────────────────────────╮${colors.reset}`);
        console.log(`│ Total: ${w.totalWorkflows.toString().padEnd(3)} │ Active: ${w.activeWorkflows.toString().padEnd(3)} │ Success: ${colors.green}${(w.successRate * 100).toFixed(1)}%${colors.reset} │ Cost: ${colors.yellow}$${w.costPerMonth}/mo${colors.reset} │`);
        
        if (w.optimization) {
            const savings = w.optimization.potentialSavings.maintenanceHours || 0;
            console.log(`│ ${colors.cyan}💡 Optimization: ${w.optimization.consolidationOpportunity} → ${w.optimization.targetWorkflows} workflows, ${savings}h/mo savings${colors.reset}     │`);
        }
        
        console.log(`│                                                                         │`);
        console.log(`│ Recent Runs:                                                            │`);
        
        w.recentRuns.forEach(run => {
            const status = run.status === 'success' ? 
                `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
            const duration = `${run.duration}m`.padStart(6);
            console.log(`│   ${status} ${run.workflow.padEnd(25)} ${duration}                           │`);
        });
        
        console.log(`${colors.blue}╰─────────────────────────────────────────────────────────────────────────╯${colors.reset}`);
        console.log();
    }

    /**
     * Render issue management section
     */
    renderIssueSection() {
        const i = this.dashboard.issues;
        
        console.log(`${colors.magenta}╭─ ISSUE MANAGEMENT ───────────────────────────────────────────────────────╮${colors.reset}`);
        console.log(`│ Open: ${i.totalOpen.toString().padEnd(3)} │ High Priority: ${i.highPriority.toString().padEnd(2)} │ Avg Resolution: ${i.averageResolutionTime}h │ Quality: ${(i.qualityScore * 100).toFixed(0)}% │`);
        console.log(`│ Automation Rate: ${colors.cyan}${(i.automationRate * 100).toFixed(0)}%${colors.reset} │ Analyzed Issues: ${i.analyzed || 0}                        │`);
        console.log(`│                                                                         │`);
        console.log(`│ Recent Issues:                                                          │`);
        
        i.recentIssues.forEach(issue => {
            const priority = issue.priority === 'High' ? 
                `${colors.red}H${colors.reset}` : `${colors.yellow}M${colors.reset}`;
            const automated = issue.automated ? `${colors.green}🤖${colors.reset}` : '  ';
            console.log(`│   ${priority} #${issue.number.toString().padEnd(3)} ${issue.title.substring(0, 35).padEnd(35)} ${issue.age}d ${automated} │`);
        });
        
        console.log(`${colors.magenta}╰─────────────────────────────────────────────────────────────────────────╯${colors.reset}`);
        console.log();
    }

    /**
     * Render team productivity section
     */
    renderTeamSection() {
        const t = this.dashboard.team;
        
        console.log(`${colors.green}╭─ TEAM PRODUCTIVITY ──────────────────────────────────────────────────────╮${colors.reset}`);
        console.log(`│ Teams: ${t.totalTeams} │ Avg Utilization: ${(t.averageUtilization * 100).toFixed(0)}% │ Bottlenecks: ${t.bottlenecks.length} │ Available: ${t.availableCapacity.length}     │`);
        console.log(`│                                                                         │`);
        console.log(`│ Team Workload:                                                          │`);
        
        Object.entries(t.workloadDistribution).forEach(([team, workload]) => {
            const utilization = workload / 100;
            let color = colors.green;
            if (utilization > 0.8) color = colors.red;
            else if (utilization > 0.6) color = colors.yellow;
            
            const bar = this.renderProgressBar(utilization, 20);
            console.log(`│   ${team.padEnd(12)} ${color}${bar}${colors.reset} ${workload.toString().padStart(3)}%                │`);
        });
        
        console.log(`${colors.green}╰─────────────────────────────────────────────────────────────────────────╯${colors.reset}`);
        console.log();
    }

    /**
     * Render developer experience section
     */
    renderDevXSection() {
        const p = this.dashboard.productivity;
        
        console.log(`${colors.cyan}╭─ DEVELOPER EXPERIENCE ───────────────────────────────────────────────────╮${colors.reset}`);
        console.log(`│ Setup Time: ${p.developerExperience.setupTime}min │ Context Switches: ${p.developerExperience.contextSwitches}/day │ Satisfaction: ${(p.developerExperience.satisfactionScore * 100).toFixed(0)}%    │`);
        console.log(`│ Manual Interventions: ${p.developerExperience.manualInterventions}/week │ Lead Time: ${p.developmentVelocity.leadTime}h                   │`);
        console.log(`│                                                                         │`);
        console.log(`│ Optimization Progress:                                                  │`);
        
        const optimizations = [
            { label: 'CI/CD Efficiency', value: p.optimization.cicdEfficiency, target: 0.95 },
            { label: 'Automation Coverage', value: p.optimization.automationCoverage, target: 0.90 },
            { label: 'Test Coverage', value: p.qualityMetrics.testCoverage, target: 0.90 }
        ];
        
        optimizations.forEach(opt => {
            const progress = opt.value / opt.target;
            let color = progress >= 1 ? colors.green : progress >= 0.8 ? colors.yellow : colors.red;
            const bar = this.renderProgressBar(progress, 15);
            console.log(`│   ${opt.label.padEnd(18)} ${color}${bar}${colors.reset} ${(opt.value * 100).toFixed(0)}%/${(opt.target * 100).toFixed(0)}%      │`);
        });
        
        console.log(`${colors.cyan}╰─────────────────────────────────────────────────────────────────────────╯${colors.reset}`);
        console.log();
    }

    /**
     * Render alerts section
     */
    renderAlertsSection() {
        if (this.dashboard.alerts.length === 0) {
            console.log(`${colors.green}✅ No active alerts - all systems optimal${colors.reset}`);
            console.log();
            return;
        }
        
        console.log(`${colors.red}╭─ ALERTS ─────────────────────────────────────────────────────────────────╮${colors.reset}`);
        
        this.dashboard.alerts.forEach((alert, index) => {
            let icon = '⚠️ ';
            let color = colors.yellow;
            
            if (alert.type === 'critical') {
                icon = '🚨 ';
                color = colors.red;
            } else if (alert.type === 'info') {
                icon = 'ℹ️ ';
                color = colors.blue;
            }
            
            console.log(`│ ${color}${icon}${alert.message.padEnd(65)}${colors.reset} │`);
            console.log(`│   ${colors.dim}→ ${alert.action.padEnd(63)}${colors.reset} │`);
            
            if (index < this.dashboard.alerts.length - 1) {
                console.log(`│                                                                         │`);
            }
        });
        
        console.log(`${colors.red}╰─────────────────────────────────────────────────────────────────────────╯${colors.reset}`);
        console.log();
    }

    /**
     * Render action menu
     */
    renderActionMenu() {
        console.log(`${colors.white}╭─ ACTIONS ────────────────────────────────────────────────────────────────╮${colors.reset}`);
        console.log(`│ [1] Optimize Workflows   [2] Analyze Issues     [3] Team Report          │`);
        console.log(`│ [4] Run DevX Setup       [5] Generate Report    [6] Settings             │`);
        console.log(`│ [r] Refresh              [q] Quit               [h] Help                  │`);
        console.log(`${colors.white}╰─────────────────────────────────────────────────────────────────────────╯${colors.reset}`);
        console.log();
        console.log(`${colors.dim}Enter command:${colors.reset} `);
    }

    /**
     * Start interactive mode
     */
    startInteractiveMode() {
        this.rl.on('line', async (input) => {
            const command = input.trim().toLowerCase();
            
            switch (command) {
                case '1':
                    await this.executeWorkflowOptimization();
                    break;
                case '2':
                    await this.executeIssueAnalysis();
                    break;
                case '3':
                    await this.generateTeamReport();
                    break;
                case '4':
                    await this.runDevXSetup();
                    break;
                case '5':
                    await this.generateComprehensiveReport();
                    break;
                case '6':
                    await this.showSettings();
                    break;
                case 'r':
                case 'refresh':
                    await this.refreshData();
                    break;
                case 'h':
                case 'help':
                    this.showHelp();
                    break;
                case 'q':
                case 'quit':
                case 'exit':
                    this.stop();
                    break;
                default:
                    console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
                    setTimeout(() => this.renderDashboard(), 1000);
                    break;
            }
        });
    }

    /**
     * Execute workflow optimization
     */
    async executeWorkflowOptimization() {
        console.log(`${colors.cyan}🔧 Starting workflow optimization...${colors.reset}`);
        
        try {
            // Run workflow consolidator
            const consolidator = spawn('node', [
                resolve(__dirname, 'workflow-consolidator.js'),
                '--dry-run'
            ], { stdio: 'inherit' });
            
            consolidator.on('close', (code) => {
                if (code === 0) {
                    console.log(`${colors.green}✅ Workflow optimization completed${colors.reset}`);
                } else {
                    console.log(`${colors.red}❌ Workflow optimization failed${colors.reset}`);
                }
                
                setTimeout(() => this.refreshData(), 2000);
            });
            
        } catch (error) {
            console.error(`${colors.red}Error running workflow optimization: ${error.message}${colors.reset}`);
            setTimeout(() => this.renderDashboard(), 2000);
        }
    }

    /**
     * Execute issue analysis
     */
    async executeIssueAnalysis() {
        console.log(`${colors.magenta}🧠 Starting intelligent issue analysis...${colors.reset}`);
        
        try {
            // Run intelligent issue manager
            const analyzer = spawn('node', [
                resolve(__dirname, 'intelligent-issue-manager.js')
            ], { stdio: 'inherit' });
            
            analyzer.on('close', (code) => {
                if (code === 0) {
                    console.log(`${colors.green}✅ Issue analysis completed${colors.reset}`);
                } else {
                    console.log(`${colors.red}❌ Issue analysis failed${colors.reset}`);
                }
                
                setTimeout(() => this.refreshData(), 2000);
            });
            
        } catch (error) {
            console.error(`${colors.red}Error running issue analysis: ${error.message}${colors.reset}`);
            setTimeout(() => this.renderDashboard(), 2000);
        }
    }

    /**
     * Generate team productivity report
     */
    async generateTeamReport() {
        console.log(`${colors.green}📊 Generating team productivity report...${colors.reset}`);
        
        const report = {
            timestamp: new Date().toISOString(),
            teamMetrics: this.dashboard.team,
            recommendations: [],
            actionItems: []
        };
        
        // Generate recommendations based on team data
        this.dashboard.team.bottlenecks.forEach(bottleneck => {
            report.recommendations.push({
                team: bottleneck.team,
                issue: 'High utilization',
                recommendation: 'Consider redistributing workload or adding team members',
                priority: 'High'
            });
        });
        
        this.dashboard.team.availableCapacity.forEach(available => {
            if (available.capacity > 0.4) {
                report.recommendations.push({
                    team: available.team,
                    opportunity: 'Available capacity',
                    recommendation: 'Consider assigning additional responsibilities or cross-training',
                    priority: 'Medium'
                });
            }
        });
        
        const reportPath = resolve(__dirname, 'data/team-productivity-report.json');
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`${colors.green}✅ Team report saved to: ${reportPath}${colors.reset}`);
        setTimeout(() => this.renderDashboard(), 2000);
    }

    /**
     * Run DevX setup automation
     */
    async runDevXSetup() {
        console.log(`${colors.blue}🚀 Running DevX environment setup...${colors.reset}`);
        
        try {
            // Run DevX onboarding
            const setup = spawn('node', [
                resolve(__dirname, 'devx-onboarding.js'),
                '--automated'
            ], { stdio: 'inherit' });
            
            setup.on('close', (code) => {
                if (code === 0) {
                    console.log(`${colors.green}✅ DevX setup completed successfully${colors.reset}`);
                } else {
                    console.log(`${colors.red}❌ DevX setup encountered issues${colors.reset}`);
                }
                
                setTimeout(() => this.refreshData(), 2000);
            });
            
        } catch (error) {
            console.error(`${colors.red}Error running DevX setup: ${error.message}${colors.reset}`);
            setTimeout(() => this.renderDashboard(), 2000);
        }
    }

    /**
     * Generate comprehensive optimization report
     */
    async generateComprehensiveReport() {
        console.log(`${colors.cyan}📋 Generating comprehensive optimization report...${colors.reset}`);
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                workflowHealth: this.calculateHealthScore(this.dashboard.workflows),
                issueManagement: this.calculateHealthScore(this.dashboard.issues),
                teamProductivity: this.calculateHealthScore(this.dashboard.team),
                developerExperience: this.calculateHealthScore(this.dashboard.productivity)
            },
            metrics: this.dashboard,
            recommendations: this.generateOptimizationRecommendations(),
            actionPlan: this.generateActionPlan()
        };
        
        const reportPath = resolve(__dirname, 'data/unified-devx-report.json');
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`${colors.green}✅ Comprehensive report saved to: ${reportPath}${colors.reset}`);
        console.log(`\\n${colors.cyan}Report Summary:${colors.reset}`);
        console.log(`  Workflow Health: ${this.formatHealthScore(report.summary.workflowHealth)}`);
        console.log(`  Issue Management: ${this.formatHealthScore(report.summary.issueManagement)}`);
        console.log(`  Team Productivity: ${this.formatHealthScore(report.summary.teamProductivity)}`);
        console.log(`  Developer Experience: ${this.formatHealthScore(report.summary.developerExperience)}`);
        
        setTimeout(() => this.renderDashboard(), 3000);
    }

    /**
     * Show settings menu
     */
    async showSettings() {
        console.clear();
        console.log(`${colors.cyan}⚙️ Dashboard Settings${colors.reset}`);
        console.log('='.repeat(50));
        console.log(`Refresh Interval: ${this.config.refreshInterval / 1000}s`);
        console.log(`Data Retention: ${this.config.dataRetention / (1000 * 60 * 60)}h`);
        console.log(`\\nAlert Thresholds:`);
        Object.entries(this.config.alertThresholds).forEach(([key, value]) => {
            console.log(`  ${key}: ${typeof value === 'number' && value < 1 ? (value * 100).toFixed(1) + '%' : value}`);
        });
        console.log(`\\nPress any key to return to dashboard...`);
        
        this.rl.once('line', () => {
            this.renderDashboard();
        });
    }

    /**
     * Show help information
     */
    showHelp() {
        console.clear();
        console.log(`${colors.cyan}📚 DevX Dashboard Help${colors.reset}`);
        console.log('='.repeat(50));
        console.log(`
${colors.bright}COMMANDS:${colors.reset}
  [1] Optimize Workflows   - Run workflow consolidation analysis
  [2] Analyze Issues      - Execute intelligent issue management
  [3] Team Report         - Generate team productivity insights
  [4] Run DevX Setup      - Execute developer environment setup
  [5] Generate Report     - Create comprehensive optimization report
  [6] Settings           - View and modify dashboard settings
  [r] Refresh            - Update all dashboard data
  [q] Quit              - Exit the dashboard
  [h] Help              - Show this help information

${colors.bright}METRICS EXPLAINED:${colors.reset}
  • Workflow Health: Success rates, execution times, and optimization opportunities
  • Issue Management: Resolution times, quality scores, and automation rates
  • Team Productivity: Workload distribution, capacity utilization, and bottlenecks
  • Developer Experience: Setup times, context switches, and satisfaction scores

${colors.bright}HEALTH SCORES:${colors.reset}
  🟢 Excellent (90-100%)  🟡 Good (70-89%)  🔴 Needs Attention (<70%)
        `);
        console.log(`Press any key to return to dashboard...`);
        
        this.rl.once('line', () => {
            this.renderDashboard();
        });
    }

    /**
     * Start automatic refresh cycle
     */
    startRefreshCycle() {
        setInterval(async () => {
            if (this.isRunning) {
                await this.refreshData();
            }
        }, this.config.refreshInterval);
    }

    /**
     * Stop the dashboard
     */
    stop() {
        this.isRunning = false;
        if (this.rl) {
            this.rl.close();
        }
        console.log(`${colors.green}\\n👋 DevX Dashboard stopped. Keep optimizing!${colors.reset}`);
        process.exit(0);
    }

    /**
     * Utility: Render progress bar
     */
    renderProgressBar(progress, width = 20) {
        const filled = Math.round(progress * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    /**
     * Utility: Calculate health score
     */
    calculateHealthScore(section) {
        // Simplified health score calculation
        if (section.successRate !== undefined) {
            return section.successRate;
        } else if (section.qualityScore !== undefined) {
            return section.qualityScore;
        } else if (section.averageUtilization !== undefined) {
            return 1 - Math.abs(section.averageUtilization - 0.75); // Optimal around 75%
        } else {
            return 0.8; // Default
        }
    }

    /**
     * Utility: Format health score
     */
    formatHealthScore(score) {
        const percentage = (score * 100).toFixed(0) + '%';
        if (score >= 0.9) return `${colors.green}🟢 ${percentage}${colors.reset}`;
        if (score >= 0.7) return `${colors.yellow}🟡 ${percentage}${colors.reset}`;
        return `${colors.red}🔴 ${percentage}${colors.reset}`;
    }

    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendations() {
        const recommendations = [];
        
        // Workflow recommendations
        if (this.dashboard.workflows.successRate < 0.95) {
            recommendations.push({
                category: 'workflows',
                priority: 'High',
                title: 'Improve Workflow Reliability',
                description: 'Address failing workflows to increase success rate above 95%',
                impact: 'High',
                effort: 'Medium'
            });
        }
        
        // Issue management recommendations
        if (this.dashboard.issues.automationRate < 0.8) {
            recommendations.push({
                category: 'issues',
                priority: 'Medium',
                title: 'Increase Issue Automation',
                description: 'Implement intelligent issue triage to reduce manual overhead',
                impact: 'Medium',
                effort: 'Low'
            });
        }
        
        // Team productivity recommendations
        if (this.dashboard.team.bottlenecks.length > 0) {
            recommendations.push({
                category: 'team',
                priority: 'High',
                title: 'Address Team Bottlenecks',
                description: `Redistribute workload for ${this.dashboard.team.bottlenecks.length} over-utilized team(s)`,
                impact: 'High',
                effort: 'High'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate action plan
     */
    generateActionPlan() {
        return [
            {
                phase: 'Immediate (Week 1)',
                actions: [
                    'Run workflow consolidation analysis',
                    'Implement intelligent issue triage',
                    'Address critical team bottlenecks'
                ]
            },
            {
                phase: 'Short-term (Month 1)',
                actions: [
                    'Deploy consolidated workflows',
                    'Optimize developer onboarding process',
                    'Implement predictive performance monitoring'
                ]
            },
            {
                phase: 'Long-term (Month 2-3)',
                actions: [
                    'Complete DevX transformation',
                    'Achieve target metrics across all areas',
                    'Implement advanced automation features'
                ]
            }
        ];
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const dashboard = new UnifiedDevXDashboard();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        dashboard.stop();
    });
    
    dashboard.start().catch(console.error);
}

export default UnifiedDevXDashboard;