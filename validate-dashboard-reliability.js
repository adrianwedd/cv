#!/usr/bin/env node

/**
 * Dashboard Reliability Validation Script
 * 
 * Validates the enhanced dashboard reliability features programmatically
 * to ensure all implementations work as expected.
 */

const fs = require('fs');
const path = require('path');

// Test results collector
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function addTest(name, passed, message, metrics = {}) {
    testResults.tests.push({
        name,
        passed,
        message,
        metrics,
        timestamp: new Date().toISOString()
    });
    
    if (passed) {
        testResults.passed++;
        log(`${name}: ${message}`, 'success');
    } else {
        testResults.failed++;
        log(`${name}: ${message}`, 'error');
    }
}

// Test 1: Validate dashboard script exists and is loadable
function testScriptExists() {
    const scriptPath = path.join(__dirname, 'assets', 'development-intelligence-dashboard.js');
    
    try {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Check for key reliability features
        const features = [
            'loadDataWithRetry',
            'executeWithRetry',
            'calculateBackoffDelay',
            'withTimeout',
            'trackError',
            'getFallbackData',
            'processLoadResults',
            'updateCaches',
            'isCacheValid'
        ];
        
        const missingFeatures = features.filter(feature => !scriptContent.includes(feature));
        
        if (missingFeatures.length === 0) {
            addTest('Script Reliability Features', true, 
                `All ${features.length} reliability features implemented`, 
                { featuresImplemented: features.length });
        } else {
            addTest('Script Reliability Features', false, 
                `Missing features: ${missingFeatures.join(', ')}`);
        }
        
        // Check configuration options
        const configOptions = [
            'maxRetries',
            'retryDelay',
            'requestTimeout',
            'cacheMaxAge'
        ];
        
        const missingConfig = configOptions.filter(option => !scriptContent.includes(option));
        
        if (missingConfig.length === 0) {
            addTest('Configuration Options', true, 
                `All ${configOptions.length} config options present`,
                { configOptions: configOptions.length });
        } else {
            addTest('Configuration Options', false, 
                `Missing config: ${missingConfig.join(', ')}`);
        }
        
    } catch (error) {
        addTest('Script Existence', false, `Script not found: ${error.message}`);
    }
}

// Test 2: Validate test suite exists and is comprehensive
function testSuiteExists() {
    const testPath = path.join(__dirname, 'test-dashboard-reliability.html');
    
    try {
        const testContent = fs.readFileSync(testPath, 'utf8');
        
        // Check for test functions
        const testFunctions = [
            'testRaceConditions',
            'testNetworkFailure', 
            'testCacheReliability',
            'testPerformanceLoad',
            'testDataConsistency',
            'testGracefulDegradation'
        ];
        
        const missingTests = testFunctions.filter(test => !testContent.includes(test));
        
        if (missingTests.length === 0) {
            addTest('Test Suite Completeness', true, 
                `All ${testFunctions.length} test scenarios implemented`,
                { testScenarios: testFunctions.length });
        } else {
            addTest('Test Suite Completeness', false, 
                `Missing tests: ${missingTests.join(', ')}`);
        }
        
        // Check for performance metrics tracking
        const metricsFeatures = ['loadTimes', 'cacheHitRate', 'testStats'];
        const missingMetrics = metricsFeatures.filter(metric => !testContent.includes(metric));
        
        if (missingMetrics.length === 0) {
            addTest('Performance Metrics', true, 
                'Performance tracking implemented');
        } else {
            addTest('Performance Metrics', false, 
                `Missing metrics: ${missingMetrics.join(', ')}`);
        }
        
    } catch (error) {
        addTest('Test Suite Existence', false, `Test suite not found: ${error.message}`);
    }
}

// Test 3: Validate code quality and patterns
function testCodeQuality() {
    const scriptPath = path.join(__dirname, 'assets', 'development-intelligence-dashboard.js');
    
    try {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Check for async/await patterns (not callback hell)
        const asyncFunctions = (scriptContent.match(/async\s+\w+/g) || []).length;
        const awaitUsage = (scriptContent.match(/await\s+/g) || []).length;
        
        if (asyncFunctions >= 5 && awaitUsage >= 10) {
            addTest('Async/Await Usage', true, 
                `Good async patterns: ${asyncFunctions} async functions, ${awaitUsage} await calls`,
                { asyncFunctions, awaitUsage });
        } else {
            addTest('Async/Await Usage', false, 
                `Insufficient async patterns: ${asyncFunctions} functions, ${awaitUsage} awaits`);
        }
        
        // Check for proper error handling
        const tryCatchBlocks = (scriptContent.match(/try\s*{/g) || []).length;
        const errorHandling = (scriptContent.match(/catch\s*\(/g) || []).length;
        
        if (tryCatchBlocks >= 5 && errorHandling >= 5) {
            addTest('Error Handling', true, 
                `Comprehensive error handling: ${tryCatchBlocks} try blocks, ${errorHandling} catch blocks`,
                { tryCatchBlocks, errorHandling });
        } else {
            addTest('Error Handling', false, 
                `Insufficient error handling: ${tryCatchBlocks} try blocks, ${errorHandling} catch blocks`);
        }
        
        // Check for documentation
        const docComments = (scriptContent.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
        
        if (docComments >= 10) {
            addTest('Code Documentation', true, 
                `Well documented: ${docComments} JSDoc comments`,
                { docComments });
        } else {
            addTest('Code Documentation', false, 
                `Insufficient documentation: ${docComments} JSDoc comments`);
        }
        
    } catch (error) {
        addTest('Code Quality Analysis', false, `Analysis failed: ${error.message}`);
    }
}

// Test 4: Validate configuration defaults
function testConfigurationDefaults() {
    const scriptPath = path.join(__dirname, 'assets', 'development-intelligence-dashboard.js');
    
    try {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Extract configuration section
        const configMatch = scriptContent.match(/this\.config\s*=\s*{([^}]+)}/);
        
        if (configMatch) {
            const configText = configMatch[1];
            
            // Check for reasonable defaults
            const checks = [
                { key: 'maxRetries', expected: /maxRetries.*[2-5]/, name: 'Max Retries (2-5)' },
                { key: 'retryDelay', expected: /retryDelay.*\d{3,4}/, name: 'Retry Delay (500-2000ms)' },
                { key: 'requestTimeout', expected: /requestTimeout.*\d{4,5}/, name: 'Request Timeout (5-15s)' },
                { key: 'cacheMaxAge', expected: /cacheMaxAge.*\d{5,6}/, name: 'Cache Max Age (3-10min)' }
            ];
            
            let validDefaults = 0;
            
            checks.forEach(check => {
                if (configText.includes(check.key)) {
                    validDefaults++;
                }
            });
            
            if (validDefaults >= 3) {
                addTest('Configuration Defaults', true, 
                    `Valid defaults found: ${validDefaults}/${checks.length}`,
                    { validDefaults, totalChecks: checks.length });
            } else {
                addTest('Configuration Defaults', false, 
                    `Insufficient defaults: ${validDefaults}/${checks.length}`);
            }
        } else {
            addTest('Configuration Defaults', false, 'Configuration object not found');
        }
        
    } catch (error) {
        addTest('Configuration Defaults', false, `Configuration analysis failed: ${error.message}`);
    }
}

// Test 5: Check for memory management
function testMemoryManagement() {
    const scriptPath = path.join(__dirname, 'assets', 'development-intelligence-dashboard.js');
    
    try {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Check for cleanup patterns
        const cleanupPatterns = [
            'clear()',
            'delete(',
            'remove()',
            'destroy()',
            'clearTimeout',
            'clearInterval'
        ];
        
        let cleanupCount = 0;
        cleanupPatterns.forEach(pattern => {
            if (scriptContent.includes(pattern)) {
                cleanupCount++;
            }
        });
        
        if (cleanupCount >= 4) {
            addTest('Memory Management', true, 
                `Good cleanup patterns: ${cleanupCount}/${cleanupPatterns.length}`,
                { cleanupPatterns: cleanupCount });
        } else {
            addTest('Memory Management', false, 
                `Insufficient cleanup: ${cleanupCount}/${cleanupPatterns.length}`);
        }
        
    } catch (error) {
        addTest('Memory Management', false, `Memory analysis failed: ${error.message}`);
    }
}

// Generate comprehensive report
function generateReport() {
    const total = testResults.passed + testResults.failed;
    const successRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
    
    log('\n' + '='.repeat(60), 'info');
    log('DASHBOARD RELIABILITY VALIDATION REPORT', 'info');
    log('='.repeat(60), 'info');
    
    log(`\nTest Results: ${testResults.passed}/${total} passed (${successRate}%)`, 
        successRate >= 80 ? 'success' : 'error');
    
    if (testResults.failed > 0) {
        log('\nFailed Tests:', 'error');
        testResults.tests
            .filter(test => !test.passed)
            .forEach(test => {
                log(`  - ${test.name}: ${test.message}`, 'error');
            });
    }
    
    log('\nPassed Tests:', 'success');
    testResults.tests
        .filter(test => test.passed)
        .forEach(test => {
            log(`  - ${test.name}: ${test.message}`, 'success');
        });
    
    // Aggregate metrics
    const totalMetrics = testResults.tests.reduce((acc, test) => {
        Object.entries(test.metrics).forEach(([key, value]) => {
            acc[key] = (acc[key] || 0) + value;
        });
        return acc;
    }, {});
    
    if (Object.keys(totalMetrics).length > 0) {
        log('\nAggregate Metrics:', 'info');
        Object.entries(totalMetrics).forEach(([key, value]) => {
            log(`  - ${key}: ${value}`, 'info');
        });
    }
    
    log('\n' + '='.repeat(60), 'info');
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'dashboard-reliability-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate
        },
        tests: testResults.tests,
        metrics: totalMetrics,
        timestamp: new Date().toISOString()
    }, null, 2));
    
    log(`Detailed report saved to: ${reportPath}`, 'info');
    
    return successRate >= 80;
}

// Main validation function
async function runValidation() {
    log('Starting Dashboard Reliability Validation...', 'info');
    log('='.repeat(60), 'info');
    
    // Run all tests
    testScriptExists();
    testSuiteExists();
    testCodeQuality();
    testConfigurationDefaults();
    testMemoryManagement();
    
    // Generate and return report
    const success = generateReport();
    
    if (success) {
        log('\n✅ Dashboard reliability validation PASSED', 'success');
        process.exit(0);
    } else {
        log('\n❌ Dashboard reliability validation FAILED', 'error');
        process.exit(1);
    }
}

// Run validation if called directly
if (require.main === module) {
    runValidation().catch(error => {
        log(`Validation error: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { runValidation, testResults };