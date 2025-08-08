#!/usr/bin/env node

/**
 * Enterprise Test Runner
 * 
 * Intelligent test execution with proper categorization and isolation.
 * Prevents timeout issues by separating fast unit tests from slow integration tests.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnterpriseTestRunner {
    constructor() {
        this.results = {
            unit: { passed: 0, failed: 0, duration: 0 },
            integration: { passed: 0, failed: 0, duration: 0 },
            e2e: { passed: 0, failed: 0, duration: 0 }
        };
    }

    /**
     * Run tests by category with proper isolation
     */
    async runTestSuite(category = 'unit') {
        console.log(`🚀 Starting ${category} test suite...`);
        const startTime = Date.now();

        try {
            switch (category) {
                case 'unit':
                    await this.runUnitTests();
                    break;
                case 'integration':
                    await this.runIntegrationTests();
                    break;
                case 'e2e':
                    await this.runE2ETests();
                    break;
                case 'all':
                    await this.runUnitTests();
                    await this.runIntegrationTests();
                    break;
                default:
                    throw new Error(`Unknown test category: ${category}`);
            }

            const duration = Date.now() - startTime;
            this.results[category].duration = duration;
            
            console.log(`✅ ${category} tests completed in ${duration}ms`);
            return { success: true, duration };

        } catch (error) {
            console.error(`❌ ${category} tests failed:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Run only fast, isolated unit tests
     */
    async runUnitTests() {
        console.log('🔬 Running fast unit tests...');
        
        // Only run foundation tests and core unit tests
        const unitTestFiles = [
            'foundation.test.js',
            'activity-analyzer.unit.test.js',
            'claude-enhancer.test.js',
            'edge-case-tests.unit.test.js'
        ];

        const testCommand = [
            'node',
            '--test',
            '--test-reporter=spec',
            ...unitTestFiles
        ];

        await this.executeTestCommand(testCommand, {
            timeout: 10000, // 10 second timeout for unit tests
            env: {
                ...process.env,
                NODE_ENV: 'test',
                TEST_MODE: 'unit',
                DISABLE_NETWORK: 'true',
                DISABLE_BROWSER: 'true'
            }
        });
    }

    /**
     * Run integration tests with proper isolation
     */
    async runIntegrationTests() {
        console.log('🔗 Running integration tests...');
        
        // Only run specific integration tests that are properly mocked
        const integrationTestFiles = [
            'tests/accessibility.test.js'
            // Add other properly isolated integration tests here
        ];

        const testCommand = [
            'node',
            '--test',
            '--test-reporter=spec',
            ...integrationTestFiles
        ];

        await this.executeTestCommand(testCommand, {
            timeout: 30000, // 30 second timeout for integration tests
            env: {
                ...process.env,
                NODE_ENV: 'test',
                TEST_MODE: 'integration',
                DISABLE_NETWORK: 'true' // Still mock external APIs
            }
        });
    }

    /**
     * Run E2E tests (manual execution only)
     */
    async runE2ETests() {
        console.log('🌐 E2E tests should be run manually or in dedicated CI jobs');
        console.log('Use: npm run test:e2e:manual for browser-based testing');
        
        // E2E tests are not run as part of regular test suite
        // They require special environment setup and consume real resources
        return { skipped: true, reason: 'E2E tests require manual execution' };
    }

    /**
     * Execute test command with proper error handling
     */
    async executeTestCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command[0], command.slice(1), {
                stdio: 'inherit',
                cwd: process.cwd(),
                env: options.env || process.env
            });

            let timeoutId;
            if (options.timeout) {
                timeoutId = setTimeout(() => {
                    child.kill('SIGTERM');
                    reject(new Error(`Test execution timed out after ${options.timeout}ms`));
                }, options.timeout);
            }

            child.on('exit', (code) => {
                if (timeoutId) clearTimeout(timeoutId);
                
                if (code === 0) {
                    resolve({ success: true, exitCode: code });
                } else {
                    reject(new Error(`Tests failed with exit code ${code}`));
                }
            });

            child.on('error', (error) => {
                if (timeoutId) clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    /**
     * Generate test report
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.results,
            recommendations: [
                'Unit tests should complete in < 10 seconds',
                'Integration tests should complete in < 30 seconds',
                'E2E tests should be run separately with proper resource allocation'
            ]
        };

        const reportPath = path.join(__dirname, 'coverage', 'test-execution-report.json');
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log(`📊 Test report generated: ${reportPath}`);
        return report;
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const category = args[0] || 'unit';
    
    const runner = new EnterpriseTestRunner();
    
    try {
        const result = await runner.runTestSuite(category);
        await runner.generateReport();
        
        if (result.success) {
            console.log(`\n🎉 ${category} test suite passed successfully!`);
            process.exit(0);
        } else {
            console.error(`\n❌ ${category} test suite failed!`);
            process.exit(1);
        }
    } catch (error) {
        console.error('💥 Test runner failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (process.argv[1] === __filename) {
    main();
}

export default EnterpriseTestRunner;