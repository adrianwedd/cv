#!/usr/bin/env node
/**
 * 🏥 Repository Health Monitor
 * Automated health assessment and monitoring system
 * 
 * Features:
 * - Continuous health score calculation
 * - Automated issue tracking and analysis
 * - Technical debt monitoring
 * - Test coverage assessment
 * - Performance metrics collection
 * - Automated alerts and recommendations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Repository Health Monitoring System
 */
class RepositoryHealthMonitor {
    constructor() {
        this.healthMetrics = {
            structure: 0,
            issues: 0,
            techDebt: 0,
            testing: 0,
            cicd: 0,
            security: 0,
            performance: 0
        };
        this.alerts = [];
        this.recommendations = [];
        this.timestamp = new Date().toISOString();
    }

    /**
     * Main health assessment execution
     */
    async assessHealth() {
        console.log('🏥 **REPOSITORY HEALTH MONITOR INITIATED**');
        console.log(`📅 Assessment Time: ${new Date().toLocaleString()}`);
        console.log('');

        try {
            // Parallel health assessments
            await Promise.all([
                this.assessStructure(),
                this.assessIssues(),
                this.assessTechnicalDebt(),
                this.assessTesting(),
                this.assessCICD(),
                this.assessSecurity(),
                this.assessPerformance()
            ]);

            const overallScore = this.calculateOverallScore();
            await this.generateReport(overallScore);
            await this.generateAlerts(overallScore);

            return overallScore;

        } catch (error) {
            console.error('❌ Health assessment failed:', error.message);
            return 0;
        }
    }

    /**
     * Assess repository structure and organization
     */
    async assessStructure() {
        console.log('📁 Assessing repository structure...');
        
        let score = 0;
        const checks = [
            { path: '.github/workflows', weight: 20, name: 'CI/CD workflows' },
            { path: 'data', weight: 15, name: 'Data directory' },
            { path: 'assets', weight: 15, name: 'Assets directory' },
            { path: 'README.md', weight: 10, name: 'README documentation' },
            { path: 'CLAUDE.md', weight: 10, name: 'Claude documentation' },
            { path: 'package.json', weight: 10, name: 'Package configuration' },
            { path: '.github/scripts', weight: 20, name: 'Scripts directory' }
        ];

        for (const check of checks) {
            try {
                const fullPath = path.join(projectRoot, check.path);
                await fs.access(fullPath);
                score += check.weight;
                console.log(`  ✅ ${check.name}: Found`);
            } catch {
                console.log(`  ❌ ${check.name}: Missing`);
                this.recommendations.push(`Create missing ${check.name}`);
            }
        }

        // Check for documentation quality
        try {
            const readmeContent = await fs.readFile(path.join(projectRoot, 'README.md'), 'utf8');
            if (readmeContent.length > 1000) {
                score += 10;
                console.log('  ✅ Comprehensive README detected');
            }
        } catch {
            this.recommendations.push('Enhance README documentation');
        }

        this.healthMetrics.structure = score;
        console.log(`📁 Structure Score: ${score}/100`);
        console.log('');
    }

    /**
     * Assess GitHub issues and project management
     */
    async assessIssues() {
        console.log('📋 Assessing issue management...');
        
        let score = 70; // Base score for existing system
        
        try {
            // Check for issue templates
            try {
                await fs.access(path.join(projectRoot, '.github/ISSUE_TEMPLATE'));
                score += 15;
                console.log('  ✅ Issue templates found');
            } catch {
                console.log('  ⚠️ Issue templates missing');
                this.recommendations.push('Create GitHub issue templates');
            }

            // Check for automated labeling
            const workflowsDir = path.join(projectRoot, '.github/workflows');
            const workflows = await fs.readdir(workflowsDir);
            const hasIssueWorkflow = workflows.some(file => 
                file.includes('issue') || file.includes('label')
            );
            
            if (hasIssueWorkflow) {
                score += 15;
                console.log('  ✅ Issue automation detected');
            } else {
                console.log('  ⚠️ Issue automation missing');
                this.recommendations.push('Implement automated issue labeling');
            }

        } catch (error) {
            console.log('  ⚠️ Issue assessment partially failed');
            score -= 10;
        }

        this.healthMetrics.issues = Math.max(0, Math.min(100, score));
        console.log(`📋 Issue Management Score: ${this.healthMetrics.issues}/100`);
        console.log('');
    }

    /**
     * Assess technical debt and code quality
     */
    async assessTechnicalDebt() {
        console.log('🔧 Assessing technical debt...');
        
        let score = 100;
        let debtItems = 0;

        try {
            // Find TODO/FIXME markers
            const searchCommand = `find ${projectRoot} -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec grep -l "TODO\\|FIXME\\|XXX\\|HACK" {} \\;`;
            const debtFiles = execSync(searchCommand, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
            
            debtItems += debtFiles.length;
            score -= Math.min(30, debtFiles.length * 2);
            
            console.log(`  📊 Technical debt markers: ${debtFiles.length} files`);

            // Check for large files (>2000 lines)
            const jsFiles = execSync(`find ${projectRoot} -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*"`, { encoding: 'utf8' })
                .trim().split('\n').filter(Boolean);
            
            const largeFiles = [];
            for (const file of jsFiles) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const lines = content.split('\n').length;
                    if (lines > 2000) {
                        largeFiles.push({ file: path.relative(projectRoot, file), lines });
                        score -= 5;
                        debtItems++;
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            }

            if (largeFiles.length > 0) {
                console.log(`  📊 Large files detected: ${largeFiles.length}`);
                largeFiles.forEach(({ file, lines }) => {
                    console.log(`    - ${file}: ${lines} lines`);
                });
                this.recommendations.push('Modularize large files for better maintainability');
            }

            // Check for debugging code
            const debugFiles = execSync(`find ${projectRoot} -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" -exec grep -l "console\\.log\\|console\\.error\\|debugger" {} \\;`, { encoding: 'utf8' })
                .trim().split('\n').filter(Boolean);
            
            if (debugFiles.length > 5) {
                score -= Math.min(15, debugFiles.length);
                debtItems += debugFiles.length;
                console.log(`  📊 Debug code found: ${debugFiles.length} files`);
                this.recommendations.push('Remove debugging code from production files');
            }

        } catch (error) {
            console.log('  ⚠️ Technical debt assessment partially failed');
            score = 65; // Default moderate score
        }

        this.healthMetrics.techDebt = Math.max(0, Math.min(100, score));
        
        if (debtItems > 10) {
            this.alerts.push({
                level: 'warning',
                message: `High technical debt detected: ${debtItems} items need attention`
            });
        }

        console.log(`🔧 Technical Debt Score: ${this.healthMetrics.techDebt}/100`);
        console.log('');
    }

    /**
     * Assess testing infrastructure and coverage
     */
    async assessTesting() {
        console.log('🧪 Assessing testing infrastructure...');
        
        let score = 0;

        try {
            // Count total JavaScript files
            const allJsFiles = execSync(`find ${projectRoot} -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*"`, { encoding: 'utf8' })
                .trim().split('\n').filter(Boolean);

            // Count test files
            const testFiles = execSync(`find ${projectRoot} -name "*test*.js" -o -name "*.test.js" -o -name "*spec*.js" | grep -v node_modules`, { encoding: 'utf8' })
                .trim().split('\n').filter(Boolean);

            const testCoverageRatio = testFiles.length / allJsFiles.length;
            score += Math.min(40, testCoverageRatio * 200); // Up to 40 points for coverage ratio

            console.log(`  📊 JavaScript files: ${allJsFiles.length}`);
            console.log(`  📊 Test files: ${testFiles.length}`);
            console.log(`  📊 Coverage ratio: ${(testCoverageRatio * 100).toFixed(1)}%`);

            // Check for package.json test script
            try {
                const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, '.github/scripts/package.json'), 'utf8'));
                if (packageJson.scripts && packageJson.scripts.test) {
                    score += 20;
                    console.log('  ✅ Test script configured');
                } else {
                    console.log('  ❌ Test script missing');
                }
            } catch {
                console.log('  ⚠️ Package.json assessment failed');
            }

            // Check for testing frameworks
            try {
                const hasJest = execSync(`grep -r "jest\\|describe\\|it\\|test" ${projectRoot}/.github/scripts --include="*.js" | wc -l`, { encoding: 'utf8' }).trim();
                if (parseInt(hasJest) > 0) {
                    score += 20;
                    console.log('  ✅ Testing framework detected');
                } else {
                    console.log('  ⚠️ Testing framework unclear');
                }
            } catch {
                console.log('  ⚠️ Testing framework detection failed');
            }

            // Run actual tests to check pass rate
            try {
                const testOutput = execSync('cd .github/scripts && npm test', { encoding: 'utf8', cwd: projectRoot });
                if (testOutput.includes('✅') || testOutput.includes('pass')) {
                    score += 20;
                    console.log('  ✅ Tests passing');
                } else {
                    console.log('  ⚠️ Test results unclear');
                }
            } catch (error) {
                console.log('  ❌ Tests failing or not runnable');
                this.alerts.push({
                    level: 'critical',
                    message: 'Test suite is failing - immediate attention required'
                });
            }

        } catch (error) {
            console.log('  ❌ Testing assessment failed');
            this.alerts.push({
                level: 'critical',
                message: 'Testing infrastructure needs immediate attention'
            });
        }

        this.healthMetrics.testing = Math.max(0, Math.min(100, score));
        
        if (this.healthMetrics.testing < 50) {
            this.recommendations.push('Implement comprehensive testing strategy');
            this.recommendations.push('Achieve 80%+ test coverage target');
        }

        console.log(`🧪 Testing Score: ${this.healthMetrics.testing}/100`);
        console.log('');
    }

    /**
     * Assess CI/CD pipeline health
     */
    async assessCICD() {
        console.log('🚀 Assessing CI/CD pipeline...');
        
        let score = 0;

        try {
            const workflowsDir = path.join(projectRoot, '.github/workflows');
            const workflows = await fs.readdir(workflowsDir);
            
            score += Math.min(30, workflows.length * 10); // Up to 30 points for workflows
            console.log(`  📊 Workflow files: ${workflows.length}`);

            // Check for main enhancement workflow
            const hasMainWorkflow = workflows.some(file => 
                file.includes('cv-enhancement') || file.includes('main')
            );
            
            if (hasMainWorkflow) {
                score += 25;
                console.log('  ✅ Main workflow detected');
            }

            // Check workflow complexity and features
            for (const workflow of workflows) {
                try {
                    const content = await fs.readFile(path.join(workflowsDir, workflow), 'utf8');
                    
                    if (content.includes('schedule:')) {
                        score += 10;
                        console.log(`  ✅ Scheduled automation in ${workflow}`);
                    }
                    
                    if (content.includes('timeout')) {
                        score += 5;
                        console.log(`  ✅ Timeout handling in ${workflow}`);
                    }
                    
                    if (content.includes('if:') || content.includes('needs:')) {
                        score += 10;
                        console.log(`  ✅ Conditional logic in ${workflow}`);
                    }
                } catch (error) {
                    // Skip unreadable workflows
                }
            }

            // Check for secrets configuration
            if (workflows.some(w => w.includes('secrets') || 
                execSync(`grep -l "secrets\\." ${path.join(workflowsDir, w)}`, { encoding: 'utf8' }).trim())) {
                score += 20;
                console.log('  ✅ Secrets management configured');
            }

        } catch (error) {
            console.log('  ❌ CI/CD assessment failed');
            score = 60; // Default score for basic setup
        }

        this.healthMetrics.cicd = Math.max(0, Math.min(100, score));
        console.log(`🚀 CI/CD Score: ${this.healthMetrics.cicd}/100`);
        console.log('');
    }

    /**
     * Assess security implementation
     */
    async assessSecurity() {
        console.log('🛡️ Assessing security implementation...');
        
        let score = 60; // Base score for existing system

        try {
            // Check for security headers implementation
            const indexPath = path.join(projectRoot, 'index.html');
            const indexContent = await fs.readFile(indexPath, 'utf8');
            
            if (indexContent.includes('Content-Security-Policy')) {
                score += 15;
                console.log('  ✅ CSP headers detected');
            }
            
            if (indexContent.includes('X-Frame-Options')) {
                score += 10;
                console.log('  ✅ Frame protection detected');
            }
            
            if (indexContent.includes('integrity=')) {
                score += 10;
                console.log('  ✅ SRI implementation detected');
            }

            // Check for authentication security
            const scriptsDir = path.join(projectRoot, '.github/scripts');
            const authFiles = execSync(`find ${scriptsDir} -name "*auth*.js" -o -name "*security*.js"`, { encoding: 'utf8' })
                .trim().split('\n').filter(Boolean);
            
            if (authFiles.length > 0) {
                score += 5;
                console.log(`  ✅ Authentication files: ${authFiles.length}`);
            }

        } catch (error) {
            console.log('  ⚠️ Security assessment partially failed');
        }

        this.healthMetrics.security = Math.max(0, Math.min(100, score));
        console.log(`🛡️ Security Score: ${this.healthMetrics.security}/100`);
        console.log('');
    }

    /**
     * Assess performance and optimization
     */
    async assessPerformance() {
        console.log('⚡ Assessing performance optimization...');
        
        let score = 70; // Base score for existing system

        try {
            // Check for minification
            const assetsDir = path.join(projectRoot, 'assets');
            const assets = await fs.readdir(assetsDir);
            
            const minifiedAssets = assets.filter(file => file.includes('.min.'));
            if (minifiedAssets.length > 0) {
                score += 15;
                console.log(`  ✅ Minified assets: ${minifiedAssets.length}`);
            }

            // Check for service worker
            if (assets.includes('sw.js') || await fs.access(path.join(projectRoot, 'sw.js')).then(() => true).catch(() => false)) {
                score += 10;
                console.log('  ✅ Service worker detected');
            }

            // Check for performance monitoring
            const perfFiles = execSync(`find ${projectRoot}/.github/scripts -name "*performance*.js" -o -name "*optimization*.js"`, { encoding: 'utf8' })
                .trim().split('\n').filter(Boolean);
            
            if (perfFiles.length > 0) {
                score += 5;
                console.log(`  ✅ Performance monitoring: ${perfFiles.length} files`);
            }

        } catch (error) {
            console.log('  ⚠️ Performance assessment partially failed');
        }

        this.healthMetrics.performance = Math.max(0, Math.min(100, score));
        console.log(`⚡ Performance Score: ${this.healthMetrics.performance}/100`);
        console.log('');
    }

    /**
     * Calculate weighted overall score
     */
    calculateOverallScore() {
        const weights = {
            structure: 0.15,
            issues: 0.15,
            techDebt: 0.20,
            testing: 0.25,
            cicd: 0.10,
            security: 0.10,
            performance: 0.05
        };

        let totalScore = 0;
        for (const [metric, score] of Object.entries(this.healthMetrics)) {
            totalScore += score * weights[metric];
        }

        return Math.round(totalScore);
    }

    /**
     * Generate comprehensive health report
     */
    async generateReport(overallScore) {
        console.log('📊 **REPOSITORY HEALTH REPORT**');
        console.log('================================');
        console.log('');

        // Overall status
        const status = overallScore >= 90 ? '🟢 EXCELLENT' :
                      overallScore >= 75 ? '🟡 GOOD' :
                      overallScore >= 60 ? '🟠 NEEDS ATTENTION' : '🔴 CRITICAL';

        console.log(`📈 **Overall Health Score**: ${overallScore}/100 ${status}`);
        console.log('');

        // Detailed breakdown
        console.log('📋 **Detailed Breakdown**:');
        for (const [metric, score] of Object.entries(this.healthMetrics)) {
            const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
            const name = metric.charAt(0).toUpperCase() + metric.slice(1);
            console.log(`  ${emoji} ${name}: ${score}/100`);
        }
        console.log('');

        // Recommendations
        if (this.recommendations.length > 0) {
            console.log('🎯 **Recommendations**:');
            this.recommendations.forEach((rec, i) => {
                console.log(`  ${i + 1}. ${rec}`);
            });
            console.log('');
        }

        // Save report to file
        const report = {
            timestamp: this.timestamp,
            overallScore,
            status: status.replace(/🟢|🟡|🟠|🔴/, '').trim(),
            metrics: this.healthMetrics,
            alerts: this.alerts,
            recommendations: this.recommendations
        };

        await fs.writeFile(
            path.join(projectRoot, 'data/repository-health.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('💾 Health report saved to data/repository-health.json');
        console.log('');
    }

    /**
     * Generate alerts based on health scores
     */
    async generateAlerts(overallScore) {
        // Critical alerts
        if (overallScore < 50) {
            this.alerts.push({
                level: 'critical',
                message: 'Repository health is critically low - immediate action required'
            });
        }

        if (this.healthMetrics.testing < 30) {
            this.alerts.push({
                level: 'critical',
                message: 'Testing infrastructure is critically insufficient'
            });
        }

        // Warning alerts
        if (overallScore < 75) {
            this.alerts.push({
                level: 'warning',
                message: 'Repository health is below optimal levels'
            });
        }

        if (this.healthMetrics.techDebt < 70) {
            this.alerts.push({
                level: 'warning',
                message: 'Technical debt accumulation detected'
            });
        }

        // Display alerts
        if (this.alerts.length > 0) {
            console.log('🚨 **HEALTH ALERTS**:');
            this.alerts.forEach(alert => {
                const emoji = alert.level === 'critical' ? '🚨' : '⚠️';
                console.log(`  ${emoji} ${alert.level.toUpperCase()}: ${alert.message}`);
            });
            console.log('');
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const monitor = new RepositoryHealthMonitor();
    
    monitor.assessHealth()
        .then(score => {
            console.log(`✅ Repository health assessment completed: ${score}/100`);
            process.exit(score >= 50 ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Health assessment failed:', error);
            process.exit(1);
        });
}

export default RepositoryHealthMonitor;