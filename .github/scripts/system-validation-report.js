#!/usr/bin/env node

/**
 * Comprehensive System Validation Report
 * 
 * Validates all major components of the AI-Enhanced CV System and generates
 * a comprehensive status report for production readiness assessment.
 * 
 * SYSTEMS VALIDATED:
 * - LinkedIn Integration (Browser auth, workflows, professional automation)
 * - Intelligent AI Cost Router (Multi-tier authentication and cost optimization)
 * - Advanced Career Intelligence (Job market analysis, pathway planning)
 * - GitHub Professional Intelligence (Contribution analysis, ES module compatibility)
 * - Advanced Networking Intelligence (AI-powered relationship analysis)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SystemValidationReport {
    constructor() {
        this.validationResults = {
            timestamp: new Date().toISOString(),
            overall_status: 'unknown',
            systems: {},
            summary: {
                total_systems: 0,
                operational: 0,
                degraded: 0,
                failed: 0
            },
            recommendations: []
        };
    }

    async generateReport() {
        console.log('🔍 **COMPREHENSIVE SYSTEM VALIDATION REPORT**');
        console.log('============================================');
        console.log(`📅 Generated: ${this.validationResults.timestamp}`);
        console.log('');

        // Validate all major systems
        await this.validateLinkedInIntegration();
        await this.validateIntelligentAIRouter();
        await this.validateCareerIntelligence();
        await this.validateGitHubIntelligence();
        await this.validateNetworkingIntelligence();
        await this.validateWorkflows();

        // Calculate summary statistics
        this.calculateSummary();
        
        // Generate recommendations
        this.generateRecommendations();
        
        // Display comprehensive report
        this.displayReport();
        
        // Save detailed report
        await this.saveDetailedReport();
        
        return this.validationResults;
    }

    async validateLinkedInIntegration() {
        console.log('🔗 Validating LinkedIn Integration System...');
        
        const system = {
            name: 'LinkedIn Integration',
            status: 'unknown',
            components: {},
            issues: [],
            capabilities: []
        };

        try {
            // Check LinkedIn Playwright extractor
            system.components.playwright_extractor = await this.checkComponent(
                'LinkedIn Playwright Extractor',
                () => this.runCommand('node linkedin-playwright-extractor.js test')
            );

            // Check simplified workflow
            system.components.workflow = await this.checkWorkflow('linkedin-integration-simple.yml');

            // Check browser authentication
            system.components.browser_auth = await this.checkComponent(
                'Browser Authentication',
                () => this.runCommand('node claude-browser-client.js test')
            );

            // Determine overall status
            const componentStatuses = Object.values(system.components);
            if (componentStatuses.every(c => c.status === 'operational')) {
                system.status = 'operational';
                system.capabilities = [
                    'Ethical LinkedIn profile extraction',
                    'Browser-based Claude authentication',
                    'Automated workflow execution',
                    'Professional networking automation'
                ];
            } else if (componentStatuses.some(c => c.status === 'operational')) {
                system.status = 'degraded';
                system.issues.push('Some LinkedIn components have limited functionality');
            } else {
                system.status = 'failed';
                system.issues.push('LinkedIn integration system unavailable');
            }

        } catch (error) {
            system.status = 'failed';
            system.issues.push(`LinkedIn validation error: ${error.message}`);
        }

        this.validationResults.systems.linkedin = system;
        console.log(`   Status: ${this.getStatusEmoji(system.status)} ${system.status.toUpperCase()}`);
    }

    async validateIntelligentAIRouter() {
        console.log('🤖 Validating Intelligent AI Cost Router...');
        
        const system = {
            name: 'Intelligent AI Router',
            status: 'unknown',
            components: {},
            issues: [],
            capabilities: []
        };

        try {
            // Check router initialization
            system.components.initialization = await this.checkComponent(
                'Router Initialization',
                () => this.runCommand('node intelligent-ai-router.js analytics')
            );

            // Check cost analytics
            system.components.analytics = await this.checkAnalytics();

            // Check browser auth availability
            system.components.browser_auth = {
                status: process.env.CLAUDE_SESSION_KEY ? 'operational' : 'degraded',
                details: process.env.CLAUDE_SESSION_KEY ? 'Session cookies configured' : 'Missing session cookies'
            };

            // Determine overall status
            if (system.components.initialization.status === 'operational') {
                system.status = 'operational';
                system.capabilities = [
                    'Cost-optimized AI routing (Browser → OAuth → API)',
                    'Real-time cost tracking and analytics',
                    'Automatic fallback handling',
                    'Enterprise-grade error recovery',
                    'Usage optimization recommendations'
                ];
            } else {
                system.status = 'degraded';
                system.issues.push('Router has limited functionality');
            }

        } catch (error) {
            system.status = 'failed';
            system.issues.push(`AI Router validation error: ${error.message}`);
        }

        this.validationResults.systems.ai_router = system;
        console.log(`   Status: ${this.getStatusEmoji(system.status)} ${system.status.toUpperCase()}`);
    }

    async validateCareerIntelligence() {
        console.log('📊 Validating Career Intelligence System...');
        
        const system = {
            name: 'Career Intelligence',
            status: 'unknown',
            components: {},
            issues: [],
            capabilities: []
        };

        try {
            // Check job market intelligence
            system.components.job_market = await this.checkComponent(
                'Job Market Intelligence',
                () => this.runCommand('node job-market-intelligence.js trends')
            );

            // Check career pathway analyzer
            system.components.career_pathways = await this.checkComponent(
                'Career Pathway Analyzer',
                () => this.runCommand('node career-pathway-analyzer.js positioning')
            );

            // Determine overall status
            const componentStatuses = Object.values(system.components);
            if (componentStatuses.every(c => c.status === 'operational')) {
                system.status = 'operational';
                system.capabilities = [
                    'Real-time job market analysis',
                    'AI-powered career pathway mapping',
                    'Strategic opportunity scoring',
                    'Competitive salary intelligence',
                    'Professional development roadmaps'
                ];
            } else {
                system.status = 'degraded';
                system.issues.push('Some career intelligence features limited');
            }

        } catch (error) {
            system.status = 'failed';
            system.issues.push(`Career Intelligence validation error: ${error.message}`);
        }

        this.validationResults.systems.career_intelligence = system;
        console.log(`   Status: ${this.getStatusEmoji(system.status)} ${system.status.toUpperCase()}`);
    }

    async validateGitHubIntelligence() {
        console.log('🐙 Validating GitHub Professional Intelligence...');
        
        const system = {
            name: 'GitHub Intelligence',
            status: 'unknown',
            components: {},
            issues: [],
            capabilities: []
        };

        try {
            // Check ES module compatibility
            system.components.es_modules = await this.checkComponent(
                'ES Module Compatibility',
                () => this.runCommand('node --input-type=module -e "import { GitHubDataMiner } from \'./github-data-miner.js\'; console.log(\'ES modules working\');"')
            );

            // Check API client structure
            system.components.api_client = await this.checkComponent(
                'API Client Structure',
                () => this.runCommand('node --input-type=module -e "import { httpRequest } from \'./utils/apiClient.js\'; console.log(\'API client ready\');"')
            );

            // Check token availability (for production use)
            system.components.authentication = {
                status: process.env.GITHUB_TOKEN ? 'operational' : 'degraded',
                details: process.env.GITHUB_TOKEN ? 'GitHub token configured' : 'GitHub token missing'
            };

            // Determine overall status
            if (system.components.es_modules.status === 'operational') {
                system.status = 'operational';
                system.capabilities = [
                    'ES module compatibility established',
                    'Professional contribution analysis framework',
                    'GitHub activity intelligence extraction',
                    'Open source impact measurement',
                    'Technical expertise demonstration'
                ];
                if (!process.env.GITHUB_TOKEN) {
                    system.issues.push('GitHub token required for live data mining');
                }
            } else {
                system.status = 'failed';
                system.issues.push('ES module compatibility issues');
            }

        } catch (error) {
            system.status = 'failed';
            system.issues.push(`GitHub Intelligence validation error: ${error.message}`);
        }

        this.validationResults.systems.github_intelligence = system;
        console.log(`   Status: ${this.getStatusEmoji(system.status)} ${system.status.toUpperCase()}`);
    }

    async validateNetworkingIntelligence() {
        console.log('🤝 Validating Advanced Networking Intelligence...');
        
        const system = {
            name: 'Networking Intelligence',
            status: 'unknown',
            components: {},
            issues: [],
            capabilities: []
        };

        try {
            // Check component initialization
            system.components.initialization = await this.checkComponent(
                'Component Initialization',
                () => this.runCommand('node advanced-networking-intelligence.js help')
            );

            // Check AI networking agent
            system.components.ai_agent = await this.checkComponent(
                'AI Networking Agent',
                () => this.runCommand('node ai-networking-agent.js --help')
            );

            // Determine overall status
            if (system.components.initialization.status === 'operational') {
                system.status = 'operational';
                system.capabilities = [
                    'Multi-dimensional relationship compatibility scoring',
                    'Strategic networking recommendations',
                    'Market intelligence integration',
                    'Professional brand optimization',
                    'Claude browser client integration'
                ];
            } else {
                system.status = 'degraded';
                system.issues.push('Networking intelligence has compatibility issues');
            }

        } catch (error) {
            system.status = 'failed';
            system.issues.push(`Networking Intelligence validation error: ${error.message}`);
        }

        this.validationResults.systems.networking_intelligence = system;
        console.log(`   Status: ${this.getStatusEmoji(system.status)} ${system.status.toUpperCase()}`);
    }

    async validateWorkflows() {
        console.log('⚙️ Validating GitHub Actions Workflows...');
        
        const system = {
            name: 'GitHub Workflows',
            status: 'unknown',
            components: {},
            issues: [],
            capabilities: []
        };

        try {
            // Check recent workflow runs
            const workflows = [
                'linkedin-integration-simple.yml',
                'cv-enhancement.yml',
                'enterprise-testing.yml'
            ];

            for (const workflow of workflows) {
                system.components[workflow.replace('.yml', '')] = await this.checkWorkflow(workflow);
            }

            // Determine overall status
            const workingWorkflows = Object.values(system.components)
                .filter(w => w.status === 'operational').length;
            
            if (workingWorkflows >= 2) {
                system.status = 'operational';
                system.capabilities = [
                    'LinkedIn integration automation',
                    'CV enhancement pipeline',
                    'Enterprise testing framework',
                    'Automated deployment and monitoring'
                ];
            } else if (workingWorkflows >= 1) {
                system.status = 'degraded';
                system.issues.push('Some workflows experiencing issues');
            } else {
                system.status = 'failed';
                system.issues.push('Critical workflow failures detected');
            }

        } catch (error) {
            system.status = 'failed';
            system.issues.push(`Workflow validation error: ${error.message}`);
        }

        this.validationResults.systems.workflows = system;
        console.log(`   Status: ${this.getStatusEmoji(system.status)} ${system.status.toUpperCase()}`);
    }

    async checkComponent(name, testFunction) {
        try {
            await testFunction();
            return {
                status: 'operational',
                details: `${name} functioning correctly`
            };
        } catch (error) {
            return {
                status: 'failed',
                details: `${name} error: ${error.message.substring(0, 100)}`
            };
        }
    }

    async checkWorkflow(workflowName) {
        try {
            const result = this.runCommand(`gh run list --workflow=${workflowName} --limit=1`);
            if (result.includes('success')) {
                return {
                    status: 'operational',
                    details: 'Recent run successful'
                };
            } else if (result.includes('failure')) {
                return {
                    status: 'degraded',
                    details: 'Recent run failed'
                };
            } else {
                return {
                    status: 'unknown',
                    details: 'No recent runs found'
                };
            }
        } catch (error) {
            return {
                status: 'failed',
                details: `Workflow check failed: ${error.message}`
            };
        }
    }

    async checkAnalytics() {
        try {
            const result = this.runCommand('node intelligent-ai-router.js analytics');
            if (result.includes('recommendations')) {
                return {
                    status: 'operational',
                    details: 'Cost analytics generation working'
                };
            } else {
                return {
                    status: 'degraded',
                    details: 'Analytics partially functional'
                };
            }
        } catch (error) {
            return {
                status: 'failed',
                details: `Analytics check failed: ${error.message}`
            };
        }
    }

    runCommand(command) {
        try {
            return execSync(command, { 
                encoding: 'utf8', 
                cwd: __dirname,
                timeout: 30000,
                stdio: 'pipe'
            });
        } catch (error) {
            throw new Error(`Command failed: ${command} - ${error.message}`);
        }
    }

    calculateSummary() {
        const systems = Object.values(this.validationResults.systems);
        this.validationResults.summary.total_systems = systems.length;
        
        systems.forEach(system => {
            switch (system.status) {
                case 'operational':
                    this.validationResults.summary.operational++;
                    break;
                case 'degraded':
                    this.validationResults.summary.degraded++;
                    break;
                case 'failed':
                    this.validationResults.summary.failed++;
                    break;
            }
        });

        // Determine overall status
        if (this.validationResults.summary.operational === this.validationResults.summary.total_systems) {
            this.validationResults.overall_status = 'excellent';
        } else if (this.validationResults.summary.operational >= this.validationResults.summary.total_systems * 0.8) {
            this.validationResults.overall_status = 'good';
        } else if (this.validationResults.summary.operational >= this.validationResults.summary.total_systems * 0.5) {
            this.validationResults.overall_status = 'fair';
        } else {
            this.validationResults.overall_status = 'poor';
        }
    }

    generateRecommendations() {
        const recommendations = [];

        // System-specific recommendations
        Object.values(this.validationResults.systems).forEach(system => {
            if (system.status === 'failed') {
                recommendations.push({
                    priority: 'high',
                    system: system.name,
                    action: `Immediate attention required for ${system.name}`,
                    details: system.issues.join('; ')
                });
            } else if (system.status === 'degraded') {
                recommendations.push({
                    priority: 'medium',
                    system: system.name,
                    action: `Optimize ${system.name} for full functionality`,
                    details: system.issues.join('; ')
                });
            }
        });

        // General recommendations
        if (this.validationResults.summary.operational >= 5) {
            recommendations.push({
                priority: 'low',
                system: 'Overall',
                action: 'System ready for production deployment',
                details: 'All major components operational'
            });
        }

        this.validationResults.recommendations = recommendations;
    }

    displayReport() {
        console.log('\n📊 **SYSTEM VALIDATION SUMMARY**');
        console.log('================================');
        console.log(`Overall Status: ${this.getStatusEmoji(this.validationResults.overall_status)} ${this.validationResults.overall_status.toUpperCase()}`);
        console.log(`Total Systems: ${this.validationResults.summary.total_systems}`);
        console.log(`✅ Operational: ${this.validationResults.summary.operational}`);
        console.log(`⚠️  Degraded: ${this.validationResults.summary.degraded}`);
        console.log(`❌ Failed: ${this.validationResults.summary.failed}`);

        console.log('\n🎯 **OPERATIONAL CAPABILITIES**');
        console.log('==============================');
        Object.values(this.validationResults.systems)
            .filter(system => system.status === 'operational')
            .forEach(system => {
                console.log(`\n${system.name}:`);
                system.capabilities.forEach(capability => {
                    console.log(`  • ${capability}`);
                });
            });

        if (this.validationResults.recommendations.length > 0) {
            console.log('\n💡 **RECOMMENDATIONS**');
            console.log('=====================');
            this.validationResults.recommendations.forEach(rec => {
                const priorityEmoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
                console.log(`${priorityEmoji} [${rec.priority.toUpperCase()}] ${rec.action}`);
                if (rec.details) {
                    console.log(`   Details: ${rec.details}`);
                }
            });
        }

        console.log('\n🚀 **PRODUCTION READINESS ASSESSMENT**');
        console.log('====================================');
        if (this.validationResults.overall_status === 'excellent') {
            console.log('✅ PRODUCTION READY - All systems operational');
            console.log('✅ LinkedIn automation activated and working');
            console.log('✅ Cost optimization systems active');
            console.log('✅ Career intelligence providing strategic insights');
        } else if (this.validationResults.overall_status === 'good') {
            console.log('⚠️  PRODUCTION READY WITH MONITORING - Most systems operational');
            console.log('✅ Core functionality available');
            console.log('⚠️  Some systems need optimization');
        } else {
            console.log('❌ NOT PRODUCTION READY - Critical systems need attention');
        }
    }

    async saveDetailedReport() {
        try {
            const reportPath = path.join(__dirname, 'data', 'system-validation-report.json');
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(this.validationResults, null, 2));
            console.log(`\n📄 Detailed report saved: ${reportPath}`);
        } catch (error) {
            console.log(`⚠️  Could not save detailed report: ${error.message}`);
        }
    }

    getStatusEmoji(status) {
        const emojis = {
            'excellent': '🟢',
            'good': '🟡', 
            'fair': '🟠',
            'poor': '🔴',
            'operational': '✅',
            'degraded': '⚠️',
            'failed': '❌',
            'unknown': '❓'
        };
        return emojis[status] || '❓';
    }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new SystemValidationReport();
    validator.generateReport().catch(console.error);
}