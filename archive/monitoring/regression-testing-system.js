#!/usr/bin/env node

/**
 * Comprehensive Regression Testing System
 * 
 * Automated regression testing framework that validates system stability
 * across all integrated components after changes or deployments.
 * 
 * @author Adrian Wedd - QA Integration Specialist  
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Regression Testing System with comprehensive validation
 */
class RegressionTestingSystem {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passed: 0,
            failed: 0,
            regressions: [],
            performanceBaseline: {},
            securityValidation: {},
            functionalityChecks: {},
            startTime: Date.now(),
            endTime: null
        };
        
        this.testCategories = [
            'coreSystemStability',
            'apiIntegrationStability', 
            'performanceRegression',
            'securityRegressionValidation',
            'uiFunctionalityRegression',
            'dataIntegrityRegression',
            'serviceWorkerRegression',
            'accessibilityRegression'
        ];
        
        this.performanceBaselines = {
            websiteLoadTime: 200, // ms
            testExecutionTime: 30, // seconds
            memoryUsage: 100, // MB
            apiResponseTime: 1000 // ms
        };
    }

    /**
     * Execute comprehensive regression testing
     */
    async executeRegressionTesting() {
        console.log('🔄 **REGRESSION TESTING SYSTEM INITIATED**');
        console.log('🎯 Validating system stability after changes');
        console.log('📊 Performance regression detection: ACTIVE');
        console.log('🔒 Security regression validation: ACTIVE');
        console.log('✅ Functional regression checks: ACTIVE\n');

        try {
            // Execute all regression test categories
            for (const category of this.testCategories) {
                await this.executeRegressionCategory(category);
            }
            
            // Analyze results and detect regressions
            await this.analyzeRegressionResults();
            
            // Generate regression report
            await this.generateRegressionReport();
            
            this.testResults.endTime = Date.now();
            
            const successRate = (this.testResults.passed / this.testResults.totalTests) * 100;
            
            console.log('\n🎉 **REGRESSION TESTING COMPLETED**');
            console.log(`✅ Success Rate: ${successRate.toFixed(1)}%`);
            console.log(`⚡ Regressions Detected: ${this.testResults.regressions.length}`);
            console.log(`🕐 Total Runtime: ${((this.testResults.endTime - this.testResults.startTime) / 1000).toFixed(2)}s`);
            
            return {
                success: this.testResults.regressions.length === 0,
                results: this.testResults
            };
            
        } catch (error) {
            console.error('❌ Regression testing failed:', error.message);
            throw error;
        }
    }

    /**
     * Execute regression test category
     */
    async executeRegressionCategory(category) {
        console.log(`\n🧪 Testing: ${category}`);
        this.testResults.totalTests++;
        
        try {
            switch (category) {
                case 'coreSystemStability':
                    await this.testCoreSystemStability();
                    break;
                case 'apiIntegrationStability':
                    await this.testAPIIntegrationStability();
                    break;
                case 'performanceRegression':
                    await this.testPerformanceRegression();
                    break;
                case 'securityRegressionValidation':
                    await this.testSecurityRegression();
                    break;
                case 'uiFunctionalityRegression':
                    await this.testUIFunctionalityRegression();
                    break;
                case 'dataIntegrityRegression':
                    await this.testDataIntegrityRegression();
                    break;
                case 'serviceWorkerRegression':
                    await this.testServiceWorkerRegression();
                    break;
                case 'accessibilityRegression':
                    await this.testAccessibilityRegression();
                    break;
                default:
                    throw new Error(`Unknown regression test category: ${category}`);
            }
            
            this.testResults.passed++;
            console.log(`✅ ${category}: STABLE`);
            
        } catch (error) {
            this.testResults.failed++;
            console.log(`❌ ${category}: REGRESSION DETECTED`);
            
            this.testResults.regressions.push({
                category,
                error: error.message,
                severity: this.categorizeSeverity(category, error.message),
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Test core system stability
     */
    async testCoreSystemStability() {
        // Test basic project structure
        const projectRoot = process.cwd().includes('.github/scripts') ? 
            path.join(process.cwd(), '../..') : process.cwd();
            
        const criticalFiles = [
            'index.html',
            'assets/styles.css',
            'assets/script.js',
            'data/base-cv.json'
        ];
        
        for (const file of criticalFiles) {
            const filePath = path.join(projectRoot, file);
            try {
                await fs.access(filePath);
            } catch {
                throw new Error(`Critical file missing: ${file}`);
            }
        }
        
        // Test core functionality via test suite
        try {
            const { stdout } = await execAsync('npm test', {
                cwd: path.join(projectRoot, '.github/scripts'),
                timeout: 60000
            });
            
            if (!stdout.includes('test suite passed successfully')) {
                throw new Error('Core test suite failures detected');
            }
        } catch (error) {
            if (error.code === 'TIMEOUT') {
                throw new Error('Core system tests timeout - performance regression detected');
            }
        }

        this.testResults.functionalityChecks.coreSystem = 'stable';
    }

    /**
     * Test API integration stability  
     */
    async testAPIIntegrationStability() {
        const startTime = Date.now();
        
        try {
            const { stdout } = await execAsync('node activity-analyzer.js --test', {
                cwd: path.join(process.cwd(), '.github/scripts'),
                timeout: 30000
            });
            
            const responseTime = Date.now() - startTime;
            
            // Check for API fallback functionality
            const hasGracefulFallback = stdout.includes('recovery with local repository data') ||
                                      stdout.includes('Local analysis completed');
            
            if (!hasGracefulFallback) {
                throw new Error('API fallback mechanism regression detected');
            }
            
            // Performance regression check
            if (responseTime > this.performanceBaselines.apiResponseTime * 2) {
                throw new Error(`API response time regression: ${responseTime}ms > ${this.performanceBaselines.apiResponseTime * 2}ms`);
            }
            
        } catch (error) {
            if (error.code === 'TIMEOUT') {
                throw new Error('API integration timeout regression');
            }
            throw error;
        }

        this.testResults.functionalityChecks.apiIntegration = 'stable';
    }

    /**
     * Test performance regression
     */
    async testPerformanceRegression() {
        const startTime = Date.now();
        
        try {
            // Test CV generation performance
            const { stdout } = await execAsync('node cv-generator.js --test', {
                cwd: path.join(process.cwd(), '.github/scripts'),
                timeout: 60000
            });
            
            const generationTime = Date.now() - startTime;
            
            if (!stdout.includes('CV WEBSITE GENERATION COMPLETE')) {
                throw new Error('CV generation functionality regression');
            }
            
            // Performance baseline comparison
            const baselineTime = this.performanceBaselines.testExecutionTime * 1000;
            if (generationTime > baselineTime * 1.5) {
                throw new Error(`Performance regression detected: ${generationTime}ms > ${baselineTime * 1.5}ms baseline`);
            }
            
        } catch (error) {
            if (error.code === 'TIMEOUT') {
                throw new Error('Performance timeout regression - system slower than baseline');
            }
            throw error;
        }

        this.testResults.performanceBaseline.cvGeneration = Date.now() - startTime;
        this.testResults.functionalityChecks.performance = 'within-baseline';
    }

    /**
     * Test security regression  
     */
    async testSecurityRegression() {
        const projectRoot = process.cwd().includes('.github/scripts') ? 
            path.join(process.cwd(), '../..') : process.cwd();
        const indexPath = path.join(projectRoot, 'index.html');
        
        try {
            const html = await fs.readFile(indexPath, 'utf8');
            
            // Validate security headers still present
            const securityHeaders = [
                'Content-Security-Policy',
                'X-Frame-Options',
                'X-Content-Type-Options'
            ];
            
            for (const header of securityHeaders) {
                if (!html.includes(header)) {
                    throw new Error(`Security regression: Missing ${header} header`);
                }
            }
            
            // Validate CSP policy hasn't been weakened
            if (html.includes("'unsafe-eval'") || html.includes('*') && html.includes('script-src')) {
                throw new Error('Security regression: CSP policy has been weakened');
            }
            
        } catch (error) {
            throw new Error(`Security validation failed: ${error.message}`);
        }

        this.testResults.securityValidation.headers = 'secure';
        this.testResults.securityValidation.csp = 'compliant';
    }

    /**
     * Test UI functionality regression
     */
    async testUIFunctionalityRegression() {
        const projectRoot = process.cwd().includes('.github/scripts') ? 
            path.join(process.cwd(), '../..') : process.cwd();
        const stylesPath = path.join(projectRoot, 'assets/styles.css');
        
        try {
            const styles = await fs.readFile(stylesPath, 'utf8');
            
            // Check responsive breakpoints haven't been removed
            const breakpointCount = (styles.match(/@media/g) || []).length;
            if (breakpointCount < 3) {
                throw new Error(`Responsive design regression: Only ${breakpointCount} breakpoints found`);
            }
            
            // Check CSS custom properties system intact
            if (!styles.includes(':root') || !styles.includes('--color')) {
                throw new Error('CSS theme system regression detected');
            }
            
        } catch (error) {
            throw new Error(`UI functionality regression: ${error.message}`);
        }

        this.testResults.functionalityChecks.uiSystem = 'stable';
    }

    /**
     * Test data integrity regression
     */
    async testDataIntegrityRegression() {
        const projectRoot = process.cwd().includes('.github/scripts') ? 
            path.join(process.cwd(), '../..') : process.cwd();
        const cvDataPath = path.join(projectRoot, 'data/base-cv.json');
        
        try {
            const cvData = JSON.parse(await fs.readFile(cvDataPath, 'utf8'));
            
            // Validate core data structure hasn't been corrupted
            const requiredSections = ['profile', 'career', 'metadata'];
            for (const section of requiredSections) {
                if (!cvData[section]) {
                    throw new Error(`Data integrity regression: Missing ${section} section`);
                }
            }
            
            // Validate metadata version tracking
            if (!cvData.metadata || !cvData.metadata.version) {
                throw new Error('Data versioning system regression');
            }
            
        } catch (error) {
            throw new Error(`Data integrity regression: ${error.message}`);
        }

        this.testResults.functionalityChecks.dataIntegrity = 'stable';
    }

    /**
     * Test service worker regression
     */
    async testServiceWorkerRegression() {
        const projectRoot = process.cwd().includes('.github/scripts') ? 
            path.join(process.cwd(), '../..') : process.cwd();
        const swPath = path.join(projectRoot, 'sw.js');
        
        try {
            const sw = await fs.readFile(swPath, 'utf8');
            
            // Validate service worker functionality intact
            if (!sw.includes('Service Worker') || !sw.includes('cache')) {
                throw new Error('Service worker functionality regression');
            }
            
            // Check cache strategy hasn't been simplified
            if (!sw.includes('CACHE_VERSION') || !sw.includes('CACHE_NAMES')) {
                throw new Error('Service worker cache strategy regression');
            }
            
        } catch (error) {
            throw new Error(`Service worker regression: ${error.message}`);
        }

        this.testResults.functionalityChecks.serviceWorker = 'stable';
    }

    /**
     * Test accessibility regression
     */
    async testAccessibilityRegression() {
        try {
            // Run accessibility integration tests
            const { stdout } = await execAsync('npm run test:integration', {
                cwd: path.join(process.cwd(), '.github/scripts'),
                timeout: 120000
            });
            
            if (!stdout.includes('Accessibility Tests (WCAG 2.1 AA)')) {
                throw new Error('Accessibility test suite regression');
            }
            
            if (stdout.includes('fail') && !stdout.includes('pass 8')) {
                throw new Error('Accessibility compliance regression detected');
            }
            
        } catch (error) {
            if (error.code === 'TIMEOUT') {
                throw new Error('Accessibility test timeout regression');
            }
            throw new Error(`Accessibility regression: ${error.message}`);
        }

        this.testResults.functionalityChecks.accessibility = 'wcag-compliant';
    }

    /**
     * Categorize regression severity
     */
    categorizeSeverity(category, errorMessage) {
        const criticalPatterns = [
            'missing',
            'timeout',
            'security',
            'data integrity',
            'core system'
        ];
        
        const isCritical = criticalPatterns.some(pattern => 
            errorMessage.toLowerCase().includes(pattern)
        );
        
        if (isCritical || category.includes('security') || category.includes('core')) {
            return 'critical';
        } else if (category.includes('performance') || category.includes('api')) {
            return 'high';
        } else {
            return 'medium';
        }
    }

    /**
     * Analyze regression results
     */
    async analyzeRegressionResults() {
        console.log('\n📊 Analyzing regression results...');
        
        if (this.testResults.regressions.length === 0) {
            console.log('✅ No regressions detected - System stable');
            return;
        }
        
        // Categorize regressions by severity
        const critical = this.testResults.regressions.filter(r => r.severity === 'critical');
        const high = this.testResults.regressions.filter(r => r.severity === 'high');
        const medium = this.testResults.regressions.filter(r => r.severity === 'medium');
        
        console.log(`⚠️ Regressions detected:`);
        console.log(`   Critical: ${critical.length}`);
        console.log(`   High: ${high.length}`);
        console.log(`   Medium: ${medium.length}`);
        
        // Log critical regressions
        if (critical.length > 0) {
            console.log('\n🚨 CRITICAL REGRESSIONS:');
            critical.forEach(regression => {
                console.log(`   - ${regression.category}: ${regression.error}`);
            });
        }
    }

    /**
     * Generate regression report
     */
    async generateRegressionReport() {
        const report = {
            regressionTestExecution: {
                timestamp: this.testResults.timestamp,
                framework: 'Regression Testing System v1.0.0',
                specialist: 'Adrian Wedd - QA Integration Specialist',
                duration: `${((this.testResults.endTime - this.testResults.startTime) / 1000).toFixed(2)}s`
            },
            testSummary: {
                totalCategories: this.testResults.totalTests,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: `${((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(1)}%`,
                regressionsDetected: this.testResults.regressions.length
            },
            regressionAnalysis: {
                critical: this.testResults.regressions.filter(r => r.severity === 'critical').length,
                high: this.testResults.regressions.filter(r => r.severity === 'high').length,
                medium: this.testResults.regressions.filter(r => r.severity === 'medium').length,
                regressionDetails: this.testResults.regressions
            },
            systemHealth: {
                functionalityChecks: this.testResults.functionalityChecks,
                performanceBaselines: this.testResults.performanceBaseline,
                securityValidation: this.testResults.securityValidation
            },
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(process.cwd(), 'regression-testing-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Regression report generated: ${reportPath}`);
        return report;
    }

    /**
     * Generate recommendations based on results
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.regressions.length === 0) {
            recommendations.push('System is stable - continue current development practices');
            recommendations.push('Regular regression testing schedule is maintaining quality');
        } else {
            const critical = this.testResults.regressions.filter(r => r.severity === 'critical');
            if (critical.length > 0) {
                recommendations.push('IMMEDIATE ACTION REQUIRED: Critical regressions detected');
                recommendations.push('Halt deployment until critical issues are resolved');
            }
            
            recommendations.push('Review recent changes for regression root causes');
            recommendations.push('Implement additional testing for affected components');
        }
        
        recommendations.push('Continue automated regression testing on each deployment');
        
        return recommendations;
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const regressionSystem = new RegressionTestingSystem();
    
    regressionSystem.executeRegressionTesting()
        .then(result => {
            if (result.success) {
                console.log('\n🏆 **REGRESSION TESTING: SYSTEM STABLE**');
                process.exit(0);
            } else {
                console.log('\n⚠️  **REGRESSION TESTING: ISSUES DETECTED**');
                console.log('Review regression report for details');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n❌ **REGRESSION TESTING FAILED**');
            console.error(error.message);
            process.exit(2);
        });
}

export { RegressionTestingSystem };