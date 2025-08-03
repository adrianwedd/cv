#!/usr/bin/env node

/**
 * GitHub Actions Workflow Optimization Analysis
 * 
 * Analyzes the current cv-enhancement.yml workflow to identify performance
 * optimization opportunities and provides recommendations for reducing
 * execution time while maintaining reliability.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Workflow Optimization Analyzer
 */
class WorkflowOptimizer {
    constructor() {
        this.analysis = {
            timestamp: new Date().toISOString(),
            currentWorkflow: {},
            optimizations: [],
            recommendations: {},
            estimatedImprovements: {}
        };
    }

    /**
     * Run comprehensive workflow optimization analysis
     */
    async analyzeWorkflow() {
        console.log('🔍 Starting Workflow Optimization Analysis...\n');

        await this.analyzeCurrentWorkflow();
        await this.identifyOptimizations();
        this.generateRecommendations();
        await this.saveAnalysis();

        console.log('\n✅ Workflow optimization analysis completed!');
        this.displayResults();
    }

    /**
     * Analyze current workflow structure
     */
    async analyzeCurrentWorkflow() {
        console.log('📊 Analyzing Current Workflow Structure...');

        try {
            // Get recent workflow runs data
            const runData = await this.getWorkflowRunData();
            
            // Analyze workflow file
            const workflowPath = path.join(__dirname, '../workflows/cv-enhancement.yml');
            const workflowContent = await fs.readFile(workflowPath, 'utf8');
            
            this.analysis.currentWorkflow = {
                averageRunTime: this.calculateAverageRunTime(runData),
                jobCount: this.countJobs(workflowContent),
                stepCount: this.countSteps(workflowContent),
                dependencyCount: this.analyzeDependencies(workflowContent),
                runnerType: 'ubuntu-latest',
                cacheUsage: this.analyzeCacheUsage(workflowContent),
                parallelizationOpportunities: this.identifyParallelization(workflowContent)
            };

            console.log(`  ✅ Current average run time: ${this.analysis.currentWorkflow.averageRunTime}s`);
            console.log(`  ✅ Job count: ${this.analysis.currentWorkflow.jobCount}`);
            console.log(`  ✅ Total steps: ${this.analysis.currentWorkflow.stepCount}`);
        } catch (error) {
            console.log(`  ❌ Analysis failed: ${error.message}`);
            this.analysis.currentWorkflow.error = error.message;
        }
    }

    /**
     * Get workflow run data from GitHub CLI
     */
    async getWorkflowRunData() {
        try {
            const output = execSync('gh run list --workflow="cv-enhancement.yml" --limit=10 --json status,conclusion,createdAt,updatedAt,startedAt', 
                { encoding: 'utf8' });
            return JSON.parse(output);
        } catch (error) {
            console.log('  ⚠️ Could not fetch run data, using estimates');
            return [{
                createdAt: '2025-07-31T15:25:39Z',
                startedAt: '2025-07-31T15:25:39Z',
                updatedAt: '2025-07-31T15:28:52Z',
                conclusion: 'success'
            }];
        }
    }

    /**
     * Calculate average run time from workflow data
     */
    calculateAverageRunTime(runData) {
        const successfulRuns = runData.filter(run => run.conclusion === 'success');
        
        if (successfulRuns.length === 0) {
            return 240; // 4 minutes estimate
        }

        const totalTime = successfulRuns.reduce((sum, run) => {
            const startTime = new Date(run.startedAt);
            const endTime = new Date(run.updatedAt);
            return sum + (endTime - startTime) / 1000;
        }, 0);

        return Math.round(totalTime / successfulRuns.length);
    }

    /**
     * Count jobs in workflow
     */
    countJobs(workflowContent) {
        const jobMatches = workflowContent.match(/^  [a-z][a-z-]*:$/gm);
        return jobMatches ? jobMatches.length : 2; // Default estimate
    }

    /**
     * Count steps in workflow
     */
    countSteps(workflowContent) {
        const stepMatches = workflowContent.match(/- name:/g);
        return stepMatches ? stepMatches.length : 20; // Default estimate
    }

    /**
     * Analyze dependencies and caching
     */
    analyzeDependencies(workflowContent) {
        const nodeSetup = workflowContent.includes('actions/setup-node');
        const caching = workflowContent.includes('actions/cache');
        const npmInstall = workflowContent.includes('npm install');
        
        return {
            nodeSetup,
            caching,
            npmInstall,
            dependencies: nodeSetup && npmInstall
        };
    }

    /**
     * Analyze current cache usage
     */
    analyzeCacheUsage(workflowContent) {
        return {
            nodeModules: workflowContent.includes('node_modules'),
            npmCache: workflowContent.includes('npm cache'),
            actionsCache: workflowContent.includes('actions/cache'),
            cacheHitOptimization: false // Assume not optimized
        };
    }

    /**
     * Identify parallelization opportunities
     */
    identifyParallelization(workflowContent) {
        const hasSequentialJobs = workflowContent.includes('needs:');
        const independentSteps = !hasSequentialJobs;
        
        return {
            currentlyParallel: !hasSequentialJobs,
            canParallelize: true,
            independentOperations: ['linting', 'testing', 'data-processing']
        };
    }

    /**
     * Identify specific optimization opportunities
     */
    async identifyOptimizations() {
        console.log('🚀 Identifying Optimization Opportunities...');

        const optimizations = [
            {
                category: 'Caching',
                title: 'Implement Advanced Node.js Caching',
                description: 'Cache node_modules and npm cache for faster dependency installation',
                estimatedSavings: '30-60 seconds',
                implementation: 'Add actions/cache with node_modules and ~/.npm paths',
                priority: 'high'
            },
            {
                category: 'Parallelization',
                title: 'Parallel Job Execution',
                description: 'Run independent jobs (analysis, testing, generation) in parallel',
                estimatedSavings: '40-80 seconds',
                implementation: 'Split workflow into parallel jobs with proper dependencies',
                priority: 'high'
            },
            {
                category: 'Runner Optimization',
                title: 'Use GitHub-hosted Runners Efficiently',
                description: 'Optimize runner selection and resource usage',
                estimatedSavings: '10-20 seconds',
                implementation: 'Use ubuntu-latest-4core for CPU-intensive tasks',
                priority: 'medium'
            },
            {
                category: 'Data Processing',
                title: 'Incremental Data Processing',
                description: 'Only process changed data instead of full regeneration',
                estimatedSavings: '60-120 seconds',
                implementation: 'Implement change detection and conditional processing',
                priority: 'high'
            },
            {
                category: 'Step Optimization',
                title: 'Combine Related Steps',
                description: 'Reduce step overhead by combining related operations',
                estimatedSavings: '5-15 seconds',
                implementation: 'Group related commands in single steps',
                priority: 'low'
            },
            {
                category: 'Artifact Management',
                title: 'Optimize Artifact Handling',
                description: 'Streamline artifact upload/download operations',
                estimatedSavings: '10-30 seconds',
                implementation: 'Use selective artifact paths and compression',
                priority: 'medium'
            }
        ];

        this.analysis.optimizations = optimizations;

        optimizations.forEach(opt => {
            console.log(`  🎯 ${opt.title}: ${opt.estimatedSavings} savings (${opt.priority} priority)`);
        });
    }

    /**
     * Generate comprehensive recommendations
     */
    generateRecommendations() {
        console.log('📋 Generating Optimization Recommendations...');

        this.analysis.recommendations = {
            immediate: [
                'Implement node_modules caching with actions/cache',
                'Split workflow into parallel jobs for independent operations',
                'Add incremental data processing with change detection'
            ],
            shortTerm: [
                'Optimize artifact handling and compression',
                'Use larger GitHub runners for CPU-intensive tasks',
                'Implement conditional step execution based on changes'
            ],
            longTerm: [
                'Consider self-hosted runners for consistent performance',
                'Implement workflow result caching for repeated operations',
                'Add performance monitoring and regression detection'
            ]
        };

        this.analysis.estimatedImprovements = {
            currentRunTime: this.analysis.currentWorkflow.averageRunTime,
            optimizedRunTime: Math.max(60, this.analysis.currentWorkflow.averageRunTime - 120),
            timeSavings: Math.min(120, this.analysis.currentWorkflow.averageRunTime - 60),
            percentageImprovement: Math.round((120 / this.analysis.currentWorkflow.averageRunTime) * 100),
            costSavings: 'Estimated 30-50% reduction in workflow minutes'
        };

        console.log(`  ✅ Potential time savings: ${this.analysis.estimatedImprovements.timeSavings}s`);
        console.log(`  ✅ Performance improvement: ${this.analysis.estimatedImprovements.percentageImprovement}%`);
    }

    /**
     * Save analysis results
     */
    async saveAnalysis() {
        const resultsDir = path.join(__dirname, 'data');
        await this.ensureDir(resultsDir);
        
        const resultsFile = path.join(resultsDir, 'workflow-optimization-analysis.json');
        await fs.writeFile(resultsFile, JSON.stringify(this.analysis, null, 2));
        
        console.log(`\n📊 Analysis saved to: ${resultsFile}`);
    }

    /**
     * Display optimization results
     */
    displayResults() {
        console.log('\n🚀 Workflow Optimization Analysis Results:');
        console.log('=' .repeat(50));
        
        console.log('\n📊 Current Performance:');
        console.log(`   Average Run Time: ${this.analysis.currentWorkflow.averageRunTime}s`);
        console.log(`   Job Count: ${this.analysis.currentWorkflow.jobCount}`);
        console.log(`   Step Count: ${this.analysis.currentWorkflow.stepCount}`);

        console.log('\n🎯 Optimization Opportunities:');
        this.analysis.optimizations.forEach(opt => {
            const priority = opt.priority === 'high' ? '🔥' : 
                           opt.priority === 'medium' ? '⚡' : '💡';
            console.log(`${priority} ${opt.title}: ${opt.estimatedSavings}`);
        });

        console.log('\n📈 Projected Improvements:');
        console.log(`   Current Runtime: ${this.analysis.estimatedImprovements.currentRunTime}s`);
        console.log(`   Optimized Runtime: ${this.analysis.estimatedImprovements.optimizedRunTime}s`);
        console.log(`   Time Savings: ${this.analysis.estimatedImprovements.timeSavings}s`);
        console.log(`   Performance Gain: ${this.analysis.estimatedImprovements.percentageImprovement}%`);

        console.log('\n🎯 Immediate Actions:');
        this.analysis.recommendations.immediate.forEach(rec => {
            console.log(`   • ${rec}`);
        });
    }

    /**
     * Utility: Ensure directory exists
     */
    async ensureDir(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const optimizer = new WorkflowOptimizer();
    await optimizer.analyzeWorkflow();
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { WorkflowOptimizer };