#!/usr/bin/env node

/**
 * Workflow Consolidator - GitHub Actions Optimization Tool
 * 
 * Analyzes and consolidates GitHub workflows to reduce complexity and improve maintainability.
 * Part of the Developer Experience optimization initiative.
 * 
 * Features:
 * - Analyzes existing workflows for consolidation opportunities
 * - Generates consolidated workflow configurations
 * - Provides impact analysis and recommendations
 * - Creates backup and rollback strategies
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class WorkflowConsolidator {
    constructor() {
        this.workflowsDir = resolve(__dirname, '../workflows');
        this.backupDir = resolve(__dirname, 'data/workflow-backups');
        this.workflows = [];
        this.consolidationPlan = {
            corePipeline: [],
            qualityGates: [],
            specialized: [],
            deprecated: []
        };
    }

    /**
     * Main analysis and consolidation orchestrator
     */
    async run(options = {}) {
        console.log(`${colors.cyan}🔍 GitHub Workflow Consolidation Analysis${colors.reset}`);
        console.log('=' .repeat(50));
        
        try {
            await this.analyzeExistingWorkflows();
            await this.categorizeWorkflows();
            await this.generateConsolidationPlan();
            
            if (options.dryRun !== false) {
                await this.generateConsolidatedWorkflows();
                await this.createImplementationGuide();
            }
            
            await this.generateReport();
            
            console.log(`${colors.green}✅ Workflow consolidation analysis completed${colors.reset}`);
            
        } catch (error) {
            console.error(`${colors.red}❌ Consolidation failed: ${error.message}${colors.reset}`);
            process.exit(1);
        }
    }

    /**
     * Analyze all existing workflows
     */
    async analyzeExistingWorkflows() {
        console.log(`${colors.blue}📊 Analyzing existing workflows...${colors.reset}`);
        
        if (!existsSync(this.workflowsDir)) {
            throw new Error('Workflows directory not found');
        }

        const workflowFiles = readdirSync(this.workflowsDir)
            .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

        console.log(`Found ${workflowFiles.length} workflow files`);

        for (const file of workflowFiles) {
            try {
                const content = readFileSync(join(this.workflowsDir, file), 'utf8');
                const workflow = parse(content);
                
                this.workflows.push({
                    filename: file,
                    name: workflow.name || file,
                    content: workflow,
                    triggers: this.analyzeTriggers(workflow.on),
                    jobs: Object.keys(workflow.jobs || {}),
                    dependencies: this.analyzeDependencies(workflow),
                    complexity: this.calculateComplexity(workflow),
                    category: this.inferCategory(workflow, file)
                });
                
                console.log(`  ✅ Analyzed: ${workflow.name || file}`);
            } catch (error) {
                console.warn(`  ⚠️ Failed to parse ${file}: ${error.message}`);
            }
        }
    }

    /**
     * Categorize workflows for consolidation
     */
    async categorizeWorkflows() {
        console.log(`${colors.blue}🏷️ Categorizing workflows...${colors.reset}`);

        const categories = {
            corePipeline: [
                'production-deployment', 'staging-deployment', 'testing-pipeline',
                'continuous-enhancement', 'cv-enhancement'
            ],
            qualityGates: [
                'docs-check', 'security-scanning', 'performance-testing',
                'code-quality-monitor', 'auto-merge', 'ci-failure-handler'
            ],
            specialized: [
                'canary-deployment', 'blue-green-deployment', 'linkedin-integration',
                'data-refresh-pipeline', 'monitoring', 'infrastructure-management'
            ]
        };

        for (const workflow of this.workflows) {
            let assigned = false;
            
            for (const [category, patterns] of Object.entries(categories)) {
                if (patterns.some(pattern => 
                    workflow.filename.includes(pattern) || 
                    workflow.name.toLowerCase().includes(pattern)
                )) {
                    this.consolidationPlan[category].push(workflow);
                    assigned = true;
                    break;
                }
            }
            
            if (!assigned) {
                this.consolidationPlan.deprecated.push(workflow);
            }
        }

        // Log categorization results
        for (const [category, workflows] of Object.entries(this.consolidationPlan)) {
            console.log(`  ${category}: ${workflows.length} workflows`);
        }
    }

    /**
     * Generate consolidation strategy
     */
    async generateConsolidationPlan() {
        console.log(`${colors.blue}📋 Generating consolidation plan...${colors.reset}`);
        
        const plan = {
            totalWorkflows: this.workflows.length,
            targetWorkflows: 4, // Core, Quality, Specialized, Maintenance
            consolidationRatio: Math.round((1 - 4/this.workflows.length) * 100),
            estimatedSavings: {
                maintenanceHours: Math.round(this.workflows.length * 2 - 4 * 2), // 2 hrs per workflow maintenance
                computeMinutes: Math.round(this.workflows.length * 50 - 4 * 120), // Longer but fewer workflows
                contextSwitching: Math.round(this.workflows.length * 0.5 - 4 * 0.5) // Time to understand each workflow
            },
            riskAssessment: {
                complexity: 'Medium', // Consolidating 27 workflows is complex
                testingRequired: 'Extensive',
                rollbackStrategy: 'Required'
            }
        };
        
        console.log(`  Target reduction: ${plan.consolidationRatio}% (${this.workflows.length} → ${plan.targetWorkflows})`);
        console.log(`  Estimated maintenance savings: ${plan.estimatedSavings.maintenanceHours} hours/month`);
        
        this.consolidationPlan.strategy = plan;
    }

    /**
     * Generate consolidated workflow files
     */
    async generateConsolidatedWorkflows() {
        console.log(`${colors.blue}🏗️ Generating consolidated workflows...${colors.reset}`);

        // Core Development Pipeline
        await this.generateCorePipeline();
        
        // Quality Assurance Pipeline  
        await this.generateQualityPipeline();
        
        // Specialized Operations Pipeline
        await this.generateSpecializedPipeline();
        
        // Maintenance Pipeline
        await this.generateMaintenancePipeline();
    }

    /**
     * Generate core development pipeline
     */
    async generateCorePipeline() {
        const corePipeline = {
            name: '🚀 Core Development Pipeline',
            on: {
                push: { branches: ['main', 'develop'] },
                pull_request: { branches: ['main', 'develop'] },
                workflow_dispatch: {
                    inputs: {
                        deployment_target: {
                            description: 'Deployment Target',
                            required: false,
                            default: 'staging',
                            type: 'choice',
                            options: ['staging', 'production', 'canary']
                        },
                        skip_tests: {
                            description: 'Skip Tests',
                            required: false,
                            default: false,
                            type: 'boolean'
                        }
                    }
                }
            },
            concurrency: {
                group: '${{ github.workflow }}-${{ github.ref }}',
                'cancel-in-progress': true
            },
            env: {
                NODE_VERSION: '18',
                DEPLOYMENT_TIMEOUT: '30m'
            },
            jobs: {
                'orchestrator': {
                    name: '🎯 Pipeline Orchestrator',
                    'runs-on': 'ubuntu-latest',
                    outputs: {
                        'deploy-staging': '${{ steps.decisions.outputs.deploy-staging }}',
                        'deploy-production': '${{ steps.decisions.outputs.deploy-production }}',
                        'run-tests': '${{ steps.decisions.outputs.run-tests }}',
                        'skip-deployment': '${{ steps.decisions.outputs.skip-deployment }}'
                    },
                    steps: [
                        {
                            name: '📥 Checkout Repository',
                            uses: 'actions/checkout@v4',
                            with: { 'fetch-depth': 2 }
                        },
                        {
                            name: '🧠 Pipeline Decision Engine',
                            id: 'decisions',
                            run: `
                                # Intelligent pipeline routing based on changes and context
                                echo "Analyzing pipeline requirements..."
                                
                                # Detect file changes
                                CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
                                
                                # Deployment decisions
                                if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
                                  echo "deploy-production=true" >> $GITHUB_OUTPUT
                                elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
                                  echo "deploy-staging=true" >> $GITHUB_OUTPUT
                                fi
                                
                                # Test decisions
                                if [[ "${{ inputs.skip_tests }}" == "true" ]]; then
                                  echo "run-tests=false" >> $GITHUB_OUTPUT
                                else
                                  echo "run-tests=true" >> $GITHUB_OUTPUT
                                fi
                                
                                echo "Pipeline routing completed"
                            `
                        }
                    ]
                },
                
                'testing-suite': {
                    name: '🧪 Comprehensive Testing',
                    'runs-on': 'ubuntu-latest',
                    needs: 'orchestrator',
                    if: '${{ needs.orchestrator.outputs.run-tests == \'true\' }}',
                    strategy: {
                        matrix: {
                            'test-type': ['unit', 'integration', 'e2e', 'performance']
                        }
                    },
                    steps: [
                        {
                            name: '📥 Checkout Repository',
                            uses: 'actions/checkout@v4'
                        },
                        {
                            name: '🔧 Setup Node.js',
                            uses: 'actions/setup-node@v4',
                            with: {
                                'node-version': '${{ env.NODE_VERSION }}',
                                cache: 'npm'
                            }
                        },
                        {
                            name: '📦 Install Dependencies',
                            run: 'npm ci'
                        },
                        {
                            name: '🧪 Run ${{ matrix.test-type }} Tests',
                            run: `
                                case "${{ matrix.test-type }}" in
                                  "unit")
                                    cd tests && npm run test:ci
                                    ;;
                                  "integration")
                                    cd .github/scripts && npm run test:integration
                                    ;;
                                  "e2e")
                                    cd tests && npm run test:e2e
                                    ;;
                                  "performance")
                                    cd tests && npm run lighthouse
                                    ;;
                                esac
                            `
                        }
                    ]
                },
                
                'staging-deployment': {
                    name: '🚀 Staging Deployment',
                    'runs-on': 'ubuntu-latest',
                    needs: ['orchestrator', 'testing-suite'],
                    if: '${{ needs.orchestrator.outputs.deploy-staging == \'true\' }}',
                    environment: 'staging',
                    steps: [
                        {
                            name: '📥 Checkout Repository', 
                            uses: 'actions/checkout@v4'
                        },
                        {
                            name: '🏗️ Build and Deploy to Staging',
                            run: `
                                echo "🚀 Deploying to staging environment..."
                                # Consolidate staging deployment logic here
                                cd .github/scripts
                                npm ci
                                node cv-generator.js --env=staging
                            `,
                            env: {
                                GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                                STAGING_ENV: 'true'
                            }
                        }
                    ]
                },
                
                'production-deployment': {
                    name: '🌟 Production Deployment',
                    'runs-on': 'ubuntu-latest',
                    needs: ['orchestrator', 'testing-suite'],
                    if: '${{ needs.orchestrator.outputs.deploy-production == \'true\' }}',
                    environment: 'production',
                    steps: [
                        {
                            name: '📥 Checkout Repository',
                            uses: 'actions/checkout@v4'
                        },
                        {
                            name: '🌟 Deploy to Production',
                            run: `
                                echo "🌟 Deploying to production environment..."
                                # Consolidate production deployment logic here
                                cd .github/scripts
                                npm ci
                                node cv-generator.js --env=production
                            `,
                            env: {
                                GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
                                PRODUCTION_ENV: 'true'
                            }
                        }
                    ]
                }
            }
        };

        this.writeWorkflow('core-development-pipeline.yml', corePipeline);
        console.log('  ✅ Generated core development pipeline');
    }

    /**
     * Generate quality assurance pipeline
     */
    async generateQualityPipeline() {
        const qualityPipeline = {
            name: '🛡️ Quality Assurance Pipeline',
            on: {
                pull_request: { branches: ['main', 'develop'] },
                push: { branches: ['main'] },
                schedule: [{ cron: '0 6 * * *' }], // Daily quality checks
                workflow_dispatch: {}
            },
            jobs: {
                'security-scan': {
                    name: '🔒 Security Analysis',
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        { name: '📥 Checkout', uses: 'actions/checkout@v4' },
                        { 
                            name: '🔒 Security Scan',
                            run: `
                                echo "🔒 Running security analysis..."
                                # Consolidate security scanning logic
                                npm audit --audit-level=moderate
                            `
                        }
                    ]
                },
                
                'code-quality': {
                    name: '📏 Code Quality Analysis',
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        { name: '📥 Checkout', uses: 'actions/checkout@v4' },
                        {
                            name: '📏 Quality Analysis',
                            run: `
                                echo "📏 Analyzing code quality..."
                                # Consolidate linting and quality checks
                                cd .github/scripts && npm run lint
                                cd tests && npm run lint
                            `
                        }
                    ]
                },
                
                'documentation-check': {
                    name: '📝 Documentation Validation',
                    'runs-on': 'ubuntu-latest', 
                    steps: [
                        { name: '📥 Checkout', uses: 'actions/checkout@v4' },
                        {
                            name: '📝 Document Links',
                            uses: 'gaurav-nelson/github-action-markdown-link-check@v1',
                            with: {
                                'use-quiet-mode': 'yes',
                                'config-file': '.github/linters/markdown-link-check-config.json'
                            }
                        }
                    ]
                }
            }
        };

        this.writeWorkflow('quality-assurance-pipeline.yml', qualityPipeline);
        console.log('  ✅ Generated quality assurance pipeline');
    }

    /**
     * Generate specialized operations pipeline
     */
    async generateSpecializedPipeline() {
        const specializedPipeline = {
            name: '⚙️ Specialized Operations Pipeline',
            on: {
                workflow_dispatch: {
                    inputs: {
                        operation: {
                            description: 'Operation Type',
                            required: true,
                            type: 'choice',
                            options: ['data-refresh', 'monitoring-setup', 'infrastructure-test', 'linkedin-sync']
                        }
                    }
                },
                schedule: [
                    { cron: '0 */6 * * *' } // Every 6 hours for data refresh
                ]
            },
            jobs: {
                'operation-router': {
                    name: '🎯 Operation Router',
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        { name: '📥 Checkout', uses: 'actions/checkout@v4' },
                        {
                            name: '⚙️ Execute Specialized Operation',
                            run: `
                                echo "⚙️ Executing: ${{ inputs.operation || 'data-refresh' }}"
                                
                                cd .github/scripts
                                npm ci
                                
                                case "${{ inputs.operation || 'data-refresh' }}" in
                                  "data-refresh")
                                    echo "🔄 Refreshing data pipeline..."
                                    node activity-analyzer.js
                                    ;;
                                  "monitoring-setup")
                                    echo "📊 Setting up monitoring..."
                                    cd ../../monitoring && ./setup.sh
                                    ;;
                                  "infrastructure-test")
                                    echo "🏗️ Testing infrastructure..."
                                    node production-resilience-tester.js
                                    ;;
                                  "linkedin-sync")
                                    echo "💼 Syncing LinkedIn data..."
                                    node linkedin-playwright-extractor.js
                                    ;;
                                esac
                            `,
                            env: {
                                GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
                            }
                        }
                    ]
                }
            }
        };

        this.writeWorkflow('specialized-operations-pipeline.yml', specializedPipeline);
        console.log('  ✅ Generated specialized operations pipeline');
    }

    /**
     * Generate maintenance pipeline
     */
    async generateMaintenancePipeline() {
        const maintenancePipeline = {
            name: '🔧 Maintenance Pipeline',
            on: {
                schedule: [
                    { cron: '0 2 * * 1' } // Weekly on Monday at 2 AM
                ],
                workflow_dispatch: {}
            },
            jobs: {
                'dependency-updates': {
                    name: '📦 Dependency Management',
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        { name: '📥 Checkout', uses: 'actions/checkout@v4' },
                        {
                            name: '📦 Update Dependencies',
                            run: `
                                echo "📦 Managing dependencies..."
                                # Consolidate dependency management
                                npm audit fix --force
                                cd .github/scripts && npm audit fix --force
                                cd ../tests && npm audit fix --force
                            `
                        }
                    ]
                },
                
                'cleanup': {
                    name: '🧹 Repository Cleanup',
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        { name: '📥 Checkout', uses: 'actions/checkout@v4' },
                        {
                            name: '🧹 Cleanup Tasks',
                            run: `
                                echo "🧹 Cleaning up repository..."
                                # Consolidate cleanup tasks
                                find . -name "*.log" -mtime +7 -delete
                                find . -name "*.tmp" -delete
                                node .github/scripts/data-retention-manager.js
                            `
                        }
                    ]
                }
            }
        };

        this.writeWorkflow('maintenance-pipeline.yml', maintenancePipeline);
        console.log('  ✅ Generated maintenance pipeline');
    }

    /**
     * Create implementation guide
     */
    async createImplementationGuide() {
        const guide = `# Workflow Consolidation Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the consolidated workflow strategy, reducing from ${this.workflows.length} workflows to 4 core pipelines.

## Pre-Implementation Checklist
- [ ] Backup existing workflows
- [ ] Test consolidated workflows in feature branch
- [ ] Update repository settings and branch protection rules
- [ ] Communicate changes to development team
- [ ] Prepare rollback strategy

## Implementation Steps

### Step 1: Backup Existing Workflows
\`\`\`bash
mkdir -p .github/workflow-backups
cp .github/workflows/*.yml .github/workflow-backups/
\`\`\`

### Step 2: Deploy Consolidated Workflows
1. Replace existing workflows with consolidated versions:
   - core-development-pipeline.yml
   - quality-assurance-pipeline.yml  
   - specialized-operations-pipeline.yml
   - maintenance-pipeline.yml

### Step 3: Update Branch Protection Rules
Update branch protection settings to reference new workflow names:
- Core Development Pipeline
- Quality Assurance Pipeline

### Step 4: Test and Validate
- [ ] Test staging deployment
- [ ] Test production deployment  
- [ ] Verify all quality gates
- [ ] Validate specialized operations

## Rollback Strategy
If issues arise:
\`\`\`bash
# Restore original workflows
cp .github/workflow-backups/*.yml .github/workflows/
git add .github/workflows/
git commit -m "Rollback: Restore original workflows"
\`\`\`

## Expected Benefits
- ${this.consolidationPlan.strategy.consolidationRatio}% reduction in workflow complexity
- ${this.consolidationPlan.strategy.estimatedSavings.maintenanceHours} hours/month maintenance savings
- Improved developer experience and reduced context switching
- Simplified debugging and troubleshooting

## Monitoring Success
Track these metrics after implementation:
- Workflow execution time
- Success/failure rates
- Developer satisfaction scores
- Maintenance time required

## Support
For issues during implementation:
1. Check workflow logs in GitHub Actions
2. Verify environment variables and secrets
3. Test individual jobs using workflow_dispatch
4. Rollback if necessary using above procedure
`;

        writeFileSync(resolve(__dirname, 'data/workflow-consolidation-guide.md'), guide);
        console.log('  ✅ Generated implementation guide');
    }

    /**
     * Generate comprehensive consolidation report
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: {
                totalWorkflows: this.workflows.length,
                categorization: {
                    corePipeline: this.consolidationPlan.corePipeline.length,
                    qualityGates: this.consolidationPlan.qualityGates.length,
                    specialized: this.consolidationPlan.specialized.length,
                    deprecated: this.consolidationPlan.deprecated.length
                }
            },
            consolidationPlan: this.consolidationPlan.strategy,
            recommendations: [
                'Implement consolidated workflows in feature branch first',
                'Test all pipelines thoroughly before production deployment',
                'Update documentation and team training materials',
                'Monitor workflow performance and adjust as needed',
                'Consider further optimizations after 30-day evaluation period'
            ],
            nextSteps: [
                'Review generated workflow files',
                'Test consolidated pipelines in development',
                'Update branch protection rules',
                'Deploy to production with monitoring'
            ]
        };

        const reportPath = resolve(__dirname, 'data/workflow-consolidation-report.json');
        writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Console summary
        console.log(`\n${colors.green}📊 Consolidation Analysis Complete${colors.reset}`);
        console.log(`${colors.cyan}Current workflows: ${report.analysis.totalWorkflows}${colors.reset}`);
        console.log(`${colors.cyan}Target workflows: 4${colors.reset}`);
        console.log(`${colors.cyan}Reduction: ${this.consolidationPlan.strategy.consolidationRatio}%${colors.reset}`);
        console.log(`${colors.cyan}Estimated monthly savings: ${this.consolidationPlan.strategy.estimatedSavings.maintenanceHours} hours${colors.reset}`);
        console.log(`\n📁 Report saved: ${reportPath}`);
    }

    /**
     * Helper method to write workflow files
     */
    writeWorkflow(filename, workflow) {
        const outputDir = resolve(__dirname, 'data/consolidated-workflows');
        if (!existsSync(outputDir)) {
            require('fs').mkdirSync(outputDir, { recursive: true });
        }
        
        const yamlContent = require('yaml').stringify(workflow);
        writeFileSync(join(outputDir, filename), yamlContent);
    }

    /**
     * Analyze workflow triggers
     */
    analyzeTriggers(on) {
        if (!on) return [];
        
        const triggers = [];
        if (typeof on === 'string') {
            triggers.push(on);
        } else if (typeof on === 'object') {
            triggers.push(...Object.keys(on));
        }
        return triggers;
    }

    /**
     * Analyze workflow dependencies
     */
    analyzeDependencies(workflow) {
        const dependencies = new Set();
        
        if (workflow.jobs) {
            for (const job of Object.values(workflow.jobs)) {
                if (job.needs) {
                    const needs = Array.isArray(job.needs) ? job.needs : [job.needs];
                    needs.forEach(dep => dependencies.add(dep));
                }
            }
        }
        
        return Array.from(dependencies);
    }

    /**
     * Calculate workflow complexity score
     */
    calculateComplexity(workflow) {
        let score = 0;
        
        // Base complexity
        score += Object.keys(workflow.jobs || {}).length * 2;
        
        // Trigger complexity
        const triggers = this.analyzeTriggers(workflow.on);
        score += triggers.length;
        
        // Environment variables
        if (workflow.env) {
            score += Object.keys(workflow.env).length * 0.5;
        }
        
        // Strategy matrix
        for (const job of Object.values(workflow.jobs || {})) {
            if (job.strategy && job.strategy.matrix) {
                score += 5; // Matrix jobs add significant complexity
            }
        }
        
        return Math.round(score);
    }

    /**
     * Infer workflow category from name and content
     */
    inferCategory(workflow, filename) {
        const name = (workflow.name || filename).toLowerCase();
        
        if (name.includes('deploy') || name.includes('production') || name.includes('staging')) {
            return 'deployment';
        } else if (name.includes('test') || name.includes('quality') || name.includes('security')) {
            return 'quality';
        } else if (name.includes('monitor') || name.includes('maintenance') || name.includes('cleanup')) {
            return 'maintenance';
        } else {
            return 'specialized';
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const consolidator = new WorkflowConsolidator();
    const options = {
        dryRun: process.argv.includes('--dry-run')
    };
    
    consolidator.run(options).catch(console.error);
}

export default WorkflowConsolidator;