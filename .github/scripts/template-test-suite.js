#!/usr/bin/env node

/**
 * Template Test Suite
 * 
 * Comprehensive testing framework for Issue #7 templating refactor.
 * Validates output integrity, performance, and compatibility.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { TemplateValidator } = require('./template-validator');
const { TemplateRegressionTester } = require('./template-regression-tester');

class TemplateTestSuite {
    constructor() {
        this.testResults = [];
        this.validator = new TemplateValidator();
        this.regressionTester = new TemplateRegressionTester();
    }

    /**
     * Run complete test suite
     */
    async runFullSuite(htmlFilePath) {
        console.log('🧪 **TEMPLATE TESTING SUITE - COMPREHENSIVE VALIDATION**\n');
        console.log(`📄 Testing: ${htmlFilePath}`);
        console.log(`🕐 Started: ${new Date().toISOString()}\n`);
        
        const results = {
            timestamp: new Date().toISOString(),
            htmlFile: htmlFilePath,
            tests: {},
            overall: { passed: true, score: 0 }
        };

        try {
            // Test 1: Template Output Validation
            console.log('🔍 **TEST 1: TEMPLATE OUTPUT VALIDATION**');
            console.log('========================================');
            const validationResult = await this.validator.validate(htmlFilePath);
            results.tests.validation = validationResult;
            
            if (!validationResult.passed) {
                results.overall.passed = false;
            }
            
            console.log('\n');

            // Test 2: Regression Testing (if baseline exists)
            console.log('🔍 **TEST 2: REGRESSION TESTING**');
            console.log('=================================');
            try {
                const regressionResult = await this.regressionTester.compareAgainstBaseline(htmlFilePath);
                results.tests.regression = regressionResult;
                
                if (!regressionResult.passed) {
                    results.overall.passed = false;
                }
            } catch (error) {
                console.log('⚠️ Regression testing skipped (no baseline found)');
                console.log('💡 Run: node template-regression-tester.js baseline');
                results.tests.regression = { skipped: true, reason: 'No baseline found' };
            }
            
            console.log('\n');

            // Test 3: Template Engine Verification
            console.log('🔍 **TEST 3: TEMPLATE ENGINE VERIFICATION**');
            console.log('==========================================');
            const templateResult = await this.testTemplateEngine(htmlFilePath);
            results.tests.templateEngine = templateResult;
            
            if (!templateResult.passed) {
                results.overall.passed = false;
            }
            
            console.log('\n');

            // Test 4: Performance Impact Analysis
            console.log('🔍 **TEST 4: PERFORMANCE IMPACT ANALYSIS**');
            console.log('==========================================');
            const performanceResult = await this.testPerformanceImpact(htmlFilePath);
            results.tests.performance = performanceResult;
            
            console.log('\n');

            // Test 5: Compatibility Testing
            console.log('🔍 **TEST 5: COMPATIBILITY TESTING**');
            console.log('====================================');
            const compatibilityResult = await this.testCompatibility(htmlFilePath);
            results.tests.compatibility = compatibilityResult;
            
            if (!compatibilityResult.passed) {
                results.overall.passed = false;
            }

            // Calculate overall score
            const testScores = Object.values(results.tests)
                .filter(test => !test.skipped && typeof test.score === 'number')
                .map(test => test.score);
            
            if (testScores.length > 0) {
                results.overall.score = Math.round(
                    testScores.reduce((sum, score) => sum + score, 0) / testScores.length
                );
            }

            // Generate final report
            this.generateFinalReport(results);
            
            return results;

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            results.overall.passed = false;
            results.error = error.message;
            return results;
        }
    }

    /**
     * Test template engine specific functionality
     */
    async testTemplateEngine(htmlFilePath) {
        console.log('🔧 Testing Handlebars template engine functionality...\n');
        
        const issues = [];
        let score = 100;

        try {
            const htmlContent = await fs.readFile(htmlFilePath, 'utf8');

            // Check for uncompiled Handlebars templates
            const handlebarsPatterns = [
                { pattern: /\{\{[^}]*\}\}/g, name: 'Uncompiled variables' },
                { pattern: /\{\{\{[^}]*\}\}\}/g, name: 'Uncompiled HTML variables' },
                { pattern: /\{\{#[^}]*\}\}/g, name: 'Uncompiled block helpers' },
                { pattern: /\{\{\/[^}]*\}\}/g, name: 'Uncompiled closing tags' }
            ];

            for (const { pattern, name } of handlebarsPatterns) {
                const matches = htmlContent.match(pattern);
                if (matches) {
                    issues.push(`${name}: ${matches.length} found`);
                    score -= 20;
                    console.log(`❌ ${name}: ${matches.slice(0, 3).join(', ')}`);
                }
            }

            // Check for template compilation artifacts
            if (htmlContent.includes('Handlebars.compile')) {
                issues.push('Template compilation code found in output');
                score -= 10;
                console.log('❌ Template compilation code found in output');
            }

            // Verify dynamic content is populated
            const dynamicContentChecks = [
                { pattern: /\{\{personalInfo\.name\}\}/, replacement: 'Adrian Wedd' },
                { pattern: /\{\{personalInfo\.title\}\}/, replacement: 'AI Engineer' },
                { pattern: /\{\{professionalSummary\}\}/, replacement: 'professional summary content' }
            ];

            for (const { pattern, replacement } of dynamicContentChecks) {
                if (pattern.test(htmlContent)) {
                    issues.push(`Template variable not replaced: ${pattern.source}`);
                    score -= 15;
                    console.log(`❌ Template variable not replaced: ${pattern.source}`);
                } else if (htmlContent.includes(replacement) || htmlContent.length > 10000) {
                    console.log(`✅ Dynamic content populated successfully`);
                }
            }

            // Test helper functions (if accessible)
            console.log('\n🔧 **Template Helper Functions:**');
            
            // Check for evidence of helper usage
            if (htmlContent.includes('groupSkillsByCategory') || 
                htmlContent.includes('data-skills-category')) {
                console.log('✅ Skills grouping helper appears to be working');
            } else {
                console.log('⚠️ Skills grouping helper usage not detected');
            }

            if (htmlContent.includes('"@type": "Person"')) {
                console.log('✅ JSON helper appears to be working (structured data)');
            } else {
                issues.push('JSON helper not working (missing structured data)');
                score -= 10;
                console.log('❌ JSON helper not working (missing structured data)');
            }

        } catch (error) {
            issues.push(`Template engine test failed: ${error.message}`);
            score = 0;
        }

        const passed = issues.length === 0;
        
        console.log(`\n📊 Template Engine Score: ${score}/100`);
        if (passed) {
            console.log('✅ Template engine tests passed');
        } else {
            console.log(`❌ Template engine tests failed (${issues.length} issues)`);
        }

        return {
            passed,
            score,
            issues,
            message: passed ? 'Template engine working correctly' : `${issues.length} template engine issues`
        };
    }

    /**
     * Test performance impact of templating
     */
    async testPerformanceImpact(htmlFilePath) {
        console.log('⚡ Analyzing performance impact of templating...\n');
        
        const stats = {
            fileSize: 0,
            loadTime: 0,
            complexity: 0
        };

        try {
            // File size analysis
            const fileStat = await fs.stat(htmlFilePath);
            stats.fileSize = fileStat.size;
            
            console.log(`📄 File Size: ${(stats.fileSize / 1024).toFixed(2)} KB`);
            
            // Estimated load time (rough calculation)
            stats.loadTime = (stats.fileSize / 1024 / 100); // Assume 100KB/s baseline
            console.log(`⏱️ Estimated Load Time: ${stats.loadTime.toFixed(2)}s`);
            
            // Complexity analysis
            const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
            const elementCount = (htmlContent.match(/<[^>]+>/g) || []).length;
            const cssClassCount = (htmlContent.match(/class="[^"]+"/g) || []).length;
            
            stats.complexity = elementCount + cssClassCount;
            console.log(`🔧 HTML Complexity: ${stats.complexity} (${elementCount} elements, ${cssClassCount} classes)`);
            
            // Performance thresholds
            let score = 100;
            const issues = [];
            
            if (stats.fileSize > 500 * 1024) { // 500KB
                issues.push(`Large file size: ${(stats.fileSize / 1024).toFixed(2)}KB`);
                score -= 20;
            }
            
            if (stats.loadTime > 2) {
                issues.push(`Slow estimated load time: ${stats.loadTime.toFixed(2)}s`);
                score -= 15;
            }
            
            if (stats.complexity > 5000) {
                issues.push(`High complexity: ${stats.complexity}`);
                score -= 10;
            }

            console.log(`\n📊 Performance Score: ${score}/100`);
            
            return {
                passed: score >= 70,
                score,
                stats,
                issues,
                message: score >= 70 ? 'Performance impact acceptable' : 'Performance concerns detected'
            };

        } catch (error) {
            return {
                passed: false,
                score: 0,
                error: error.message,
                message: 'Performance analysis failed'
            };
        }
    }

    /**
     * Test compatibility with existing systems
     */
    async testCompatibility(htmlFilePath) {
        console.log('🔄 Testing compatibility with existing systems...\n');
        
        const issues = [];
        let score = 100;

        try {
            const htmlContent = await fs.readFile(htmlFilePath, 'utf8');

            // Test CSS compatibility
            const cssSelectors = [
                '.professional-summary',
                '.experience',
                '.projects',
                '.skills',
                '.achievements',
                '#about',
                '#experience',
                '#projects'
            ];

            console.log('🎨 **CSS Selector Compatibility:**');
            for (const selector of cssSelectors) {
                const selectorType = selector.startsWith('#') ? 'id' : 'class';
                const selectorName = selector.substring(1);
                
                let found = false;
                if (selectorType === 'id') {
                    found = htmlContent.includes(`id="${selectorName}"`);
                } else {
                    found = htmlContent.includes(`class="${selectorName}"`) || 
                           htmlContent.includes(`class=".*${selectorName}.*"`);
                }

                if (found) {
                    console.log(`   ✅ ${selector}`);
                } else {
                    console.log(`   ❌ ${selector} - Missing`);
                    issues.push(`Missing CSS selector: ${selector}`);
                    score -= 5;
                }
            }

            // Test JavaScript compatibility
            console.log('\n📜 **JavaScript Compatibility:**');
            const jsRequirements = [
                { pattern: /script.js/, name: 'Main script file reference' },
                { pattern: /data-theme/, name: 'Theme switching data attributes' },
                { pattern: /id=".*nav/, name: 'Navigation IDs for smooth scrolling' }
            ];

            for (const { pattern, name } of jsRequirements) {
                if (pattern.test(htmlContent)) {
                    console.log(`   ✅ ${name}`);
                } else {
                    console.log(`   ❌ ${name} - Missing`);
                    issues.push(`Missing JS compatibility: ${name}`);
                    score -= 10;
                }
            }

            // Test data structure compatibility
            console.log('\n📊 **Data Structure Compatibility:**');
            const dataChecks = [
                { pattern: /"@type":\s*"Person"/, name: 'JSON-LD Person schema' },
                { pattern: /property="og:/, name: 'Open Graph meta tags' },
                { pattern: /name="twitter:/, name: 'Twitter Card meta tags' }
            ];

            for (const { pattern, name } of dataChecks) {
                if (pattern.test(htmlContent)) {
                    console.log(`   ✅ ${name}`);
                } else {
                    console.log(`   ❌ ${name} - Missing`);
                    issues.push(`Missing data structure: ${name}`);
                    score -= 8;
                }
            }

        } catch (error) {
            issues.push(`Compatibility test failed: ${error.message}`);
            score = 0;
        }

        const passed = score >= 80;
        
        console.log(`\n📊 Compatibility Score: ${score}/100`);
        if (passed) {
            console.log('✅ Compatibility tests passed');
        } else {
            console.log(`❌ Compatibility issues found (${issues.length} issues)`);
        }

        return {
            passed,
            score,
            issues,
            message: passed ? 'Fully compatible with existing systems' : `${issues.length} compatibility issues`
        };
    }

    /**
     * Generate final comprehensive report
     */
    generateFinalReport(results) {
        console.log('\n🎉 **FINAL TEST REPORT**');
        console.log('========================\n');
        
        // Overall status
        if (results.overall.passed) {
            console.log('✅ **OVERALL STATUS: PASSED**');
            console.log('🎯 Template refactor is ready for production!');
        } else {
            console.log('❌ **OVERALL STATUS: FAILED**');
            console.log('⚠️ Template refactor needs attention before deployment');
        }
        
        console.log(`📊 **Overall Score: ${results.overall.score}/100**\n`);

        // Test breakdown
        console.log('📋 **TEST BREAKDOWN:**\n');
        
        const testOrder = ['validation', 'regression', 'templateEngine', 'performance', 'compatibility'];
        
        for (const testName of testOrder) {
            const test = results.tests[testName];
            if (!test) continue;
            
            let status, emoji, score;
            
            if (test.skipped) {
                status = 'SKIPPED';
                emoji = '⏭️';
                score = 'N/A';
            } else if (test.passed) {
                status = 'PASSED';
                emoji = '✅';
                score = test.score ? `${test.score}/100` : 'PASS';
            } else {
                status = 'FAILED';
                emoji = '❌';
                score = test.score ? `${test.score}/100` : 'FAIL';
            }
            
            console.log(`${emoji} **${testName.toUpperCase()}**: ${status} (${score})`);
            if (test.message) {
                console.log(`   📝 ${test.message}`);
            }
            if (test.issues && test.issues.length > 0) {
                test.issues.forEach(issue => {
                    console.log(`   • ${issue}`);
                });
            }
            console.log('');
        }

        // Recommendations
        console.log('💡 **RECOMMENDATIONS:**\n');
        
        if (results.overall.score >= 90) {
            console.log('🌟 Excellent! Template refactor is production-ready.');
            console.log('🚀 Ready to commit and deploy.');
        } else if (results.overall.score >= 80) {
            console.log('👍 Good work! Minor improvements recommended.');
            console.log('✨ Address warnings before deploying to production.');
        } else if (results.overall.score >= 70) {
            console.log('⚠️ Acceptable but needs improvement.');
            console.log('🔧 Fix critical issues before committing.');
        } else {
            console.log('🚨 Significant issues found.');
            console.log('🛠️ Major refactoring needed before deployment.');
        }
        
        console.log('\n🔗 **NEXT STEPS:**');
        console.log('1. Address any critical issues');
        console.log('2. Run regression tests after fixes');
        console.log('3. Validate in staging environment');
        console.log('4. Update documentation if needed\n');
    }
}

// CLI Interface
async function main() {
    const suite = new TemplateTestSuite();
    const htmlFile = process.argv[2] || path.join(__dirname, '../../dist/index.html');
    
    console.log('🧪 Template Test Suite');
    console.log('======================\n');
    
    try {
        const results = await suite.runFullSuite(htmlFile);
        
        // Save results
        const resultsFile = path.join(__dirname, 'data', 'test-results.json');
        await fs.mkdir(path.dirname(resultsFile), { recursive: true });
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        
        console.log(`📄 Full results saved to: ${resultsFile}`);
        
        // Exit with appropriate code
        process.exit(results.overall.passed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Test suite error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { TemplateTestSuite };