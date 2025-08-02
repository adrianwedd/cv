#!/usr/bin/env node

/**
 * AI Intelligence System Test Suite
 * 
 * Comprehensive testing framework for the Advanced AI Content Intelligence system
 * including persona analysis, market intelligence, content optimization, and
 * orchestration components.
 * 
 * Test Categories:
 * - Unit tests for individual components
 * - Integration tests for component interaction
 * - End-to-end pipeline testing
 * - Performance and reliability testing
 * - Content authenticity validation
 * - Error handling and recovery testing
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const assert = require('assert');

// Import components to test
const PersonaAnalyzer = require('./persona-analyzer');
const MarketIntelligenceEngine = require('./market-intelligence-engine');
const DynamicContentOptimizer = require('./dynamic-content-optimizer');
const IntelligenceOrchestrator = require('./intelligence-orchestrator');
const ContentGuardian = require('../content-guardian');

class AIIntelligenceTestSuite {
    constructor(config = {}) {
        this.dataDir = path.resolve(__dirname, '../../../data');
        this.testOutputDir = path.join(this.dataDir, 'test-results');
        this.config = {
            runIntegrationTests: config.runIntegrationTests !== false,
            runPerformanceTests: config.runPerformanceTests !== false,
            runE2ETests: config.runE2ETests !== false,
            headless: config.headless !== false,
            timeout: config.timeout || 30000,
            ...config
        };
        
        this.testResults = {
            total_tests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            performance_metrics: {},
            start_time: null,
            end_time: null
        };
        
        console.log('🧪 AIIntelligenceTestSuite initialized');
    }

    /**
     * Run complete test suite
     */
    async runAllTests() {
        console.log('🚀 Starting AI Intelligence System Test Suite...');
        this.testResults.start_time = new Date().toISOString();
        
        try {
            // Ensure test output directory exists
            await fs.mkdir(this.testOutputDir, { recursive: true });
            
            // Run test categories in order
            await this.runUnitTests();
            
            if (this.config.runIntegrationTests) {
                await this.runIntegrationTests();
            }
            
            if (this.config.runPerformanceTests) {
                await this.runPerformanceTests();
            }
            
            if (this.config.runE2ETests) {
                await this.runEndToEndTests();
            }
            
            this.testResults.end_time = new Date().toISOString();
            
            // Generate test report
            await this.generateTestReport();
            
            console.log('\n🎉 Test Suite Complete!');
            this.printTestSummary();
            
            return this.testResults;
            
        } catch (error) {
            console.error('❌ Test suite execution failed:', error.message);
            this.testResults.errors.push({
                test: 'test_suite_execution',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Run unit tests for individual components
     */
    async runUnitTests() {
        console.log('\n📋 Running Unit Tests...');
        const unitTests = [
            () => this.testContentGuardianValidation(),
            () => this.testPersonaAnalyzerInitialization(),
            () => this.testMarketIntelligenceConfiguration(),
            () => this.testContentOptimizerConfiguration(),
            () => this.testOrchestratorConfiguration(),
            () => this.testDataStructures(),
            () => this.testPromptGeneration(),
            () => this.testInsightExtraction()
        ];

        for (const test of unitTests) {
            await this.runTest(test);
        }
    }

    /**
     * Run integration tests
     */
    async runIntegrationTests() {
        console.log('\n🔗 Running Integration Tests...');
        const integrationTests = [
            () => this.testPersonaAnalyzerDataLoading(),
            () => this.testMarketIntelligenceDataFlow(),
            () => this.testContentOptimizerIntegration(),
            () => this.testGuardianIntegration(),
            () => this.testComponentCommunication()
        ];

        for (const test of integrationTests) {
            await this.runTest(test);
        }
    }

    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        console.log('\n⚡ Running Performance Tests...');
        const performanceTests = [
            () => this.testInitializationPerformance(),
            () => this.testMemoryUsage(),
            () => this.testTimeoutHandling(),
            () => this.testConcurrentOperations()
        ];

        for (const test of performanceTests) {
            await this.runTest(test);
        }
    }

    /**
     * Run end-to-end tests
     */
    async runEndToEndTests() {
        console.log('\n🔄 Running End-to-End Tests...');
        
        // Note: E2E tests require Claude authentication and will consume tokens
        console.log('⚠️ E2E tests require valid Claude authentication and will consume tokens');
        
        if (process.env.SKIP_E2E_TESTS === 'true') {
            console.log('⏭️ Skipping E2E tests (SKIP_E2E_TESTS=true)');
            this.testResults.skipped += 3;
            return;
        }

        const e2eTests = [
            () => this.testPersonaAnalysisPipeline(),
            () => this.testMarketIntelligencePipeline(),
            () => this.testFullOrchestrationPipeline()
        ];

        for (const test of e2eTests) {
            await this.runTest(test);
        }
    }

    /**
     * Helper method to run individual tests with error handling
     */
    async runTest(testFunction) {
        const testName = testFunction.name || 'anonymous_test';
        this.testResults.total_tests++;
        
        try {
            console.log(`  🧪 ${testName}...`);
            const startTime = Date.now();
            
            await testFunction();
            
            const duration = Date.now() - startTime;
            this.testResults.passed++;
            console.log(`    ✅ PASS (${duration}ms)`);
            
        } catch (error) {
            this.testResults.failed++;
            this.testResults.errors.push({
                test: testName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.log(`    ❌ FAIL: ${error.message}`);
        }
    }

    // UNIT TESTS

    async testContentGuardianValidation() {
        const guardian = new ContentGuardian();
        assert(guardian, 'ContentGuardian should initialize');
        assert(guardian.protectedCategories.length > 0, 'Should have protected categories');
        assert(guardian.hallucinationPatterns.length > 0, 'Should have hallucination patterns');
    }

    async testPersonaAnalyzerInitialization() {
        const analyzer = new PersonaAnalyzer({ headless: true });
        assert(analyzer, 'PersonaAnalyzer should initialize');
        assert(analyzer.personas, 'Should have personas defined');
        assert(Object.keys(analyzer.personas).length === 3, 'Should have 3 personas');
        assert(analyzer.personas.recruiter, 'Should have recruiter persona');
        assert(analyzer.personas.hiring_manager, 'Should have hiring manager persona');
        assert(analyzer.personas.peer_professional, 'Should have peer professional persona');
    }

    async testMarketIntelligenceConfiguration() {
        const engine = new MarketIntelligenceEngine({ headless: true });
        assert(engine, 'MarketIntelligenceEngine should initialize');
        assert(engine.analysisAreas, 'Should have analysis areas defined');
        assert(engine.technologyCategories, 'Should have technology categories');
        assert(Object.keys(engine.analysisAreas).length === 4, 'Should have 4 analysis areas');
    }

    async testContentOptimizerConfiguration() {
        const optimizer = new DynamicContentOptimizer({ headless: true });
        assert(optimizer, 'DynamicContentOptimizer should initialize');
        assert(optimizer.optimizationStrategies, 'Should have optimization strategies');
        assert(optimizer.optimizationAreas, 'Should have optimization areas');
        assert(Object.keys(optimizer.optimizationStrategies).length === 3, 'Should have 3 strategies');
    }

    async testOrchestratorConfiguration() {
        const orchestrator = new IntelligenceOrchestrator({ 
            headless: true,
            enablePersonaAnalysis: false,
            enableMarketIntelligence: false,
            enableContentOptimization: false
        });
        assert(orchestrator, 'IntelligenceOrchestrator should initialize');
        assert(orchestrator.pipeline, 'Should have pipeline defined');
        assert(Object.keys(orchestrator.pipeline).length === 5, 'Should have 5 pipeline stages');
    }

    async testDataStructures() {
        // Test CV data loading
        try {
            const cvPath = path.join(this.dataDir, 'base-cv.json');
            const cvData = JSON.parse(await fs.readFile(cvPath, 'utf8'));
            assert(cvData.personal_info, 'CV should have personal_info');
            assert(cvData.experience, 'CV should have experience');
            assert(cvData.skills, 'CV should have skills');
        } catch (error) {
            throw new Error(`CV data structure test failed: ${error.message}`);
        }
    }

    async testPromptGeneration() {
        const analyzer = new PersonaAnalyzer({ headless: true });
        const mockCV = { personal_info: { name: 'Test User' }, skills: [] };
        
        const prompt = analyzer.generatePersonaPrompt('recruiter', mockCV);
        assert(prompt.includes('Technical Recruiter'), 'Prompt should include persona name');
        assert(prompt.includes('recruitment_screening'), 'Prompt should include perspective');
        assert(prompt.length > 500, 'Prompt should be substantial');
    }

    async testInsightExtraction() {
        const optimizer = new DynamicContentOptimizer({ headless: true });
        const mockResponse = `
        Key changes made:
        - Enhanced value proposition
        - Improved skill presentation
        - Added market alignment
        
        Rationale:
        - Better positioning for current market
        - Increased ATS compatibility
        `;
        
        const insights = optimizer.extractOptimizationInsights(mockResponse);
        assert(insights.key_changes.length > 0, 'Should extract key changes');
        assert(insights.rationale.length > 0, 'Should extract rationale');
    }

    // INTEGRATION TESTS

    async testPersonaAnalyzerDataLoading() {
        const analyzer = new PersonaAnalyzer({ headless: true });
        const cvData = await analyzer.loadCVData();
        assert(cvData, 'Should load CV data');
        assert(cvData.personal_info, 'CV data should have personal_info');
    }

    async testMarketIntelligenceDataFlow() {
        const engine = new MarketIntelligenceEngine({ headless: true });
        const cvContext = await engine.loadCVContext();
        
        if (cvContext) {
            assert(cvContext.current_role, 'CV context should have current role');
            assert(cvContext.current_skills, 'CV context should have current skills');
            assert(cvContext.experience_level, 'CV context should have experience level');
        }
    }

    async testContentOptimizerIntegration() {
        const optimizer = new DynamicContentOptimizer({ 
            headless: true,
            enableGuardian: false 
        });
        
        // Test loading dependencies
        const cvData = await optimizer.loadCVData();
        assert(cvData, 'Should load CV data');
        
        // Test market intelligence loading (may be null if not available)
        const marketData = await optimizer.loadMarketIntelligence();
        // Market data may be null if no analysis has been run
        
        // Test persona analysis loading (may be null if not available)
        const personaData = await optimizer.loadPersonaAnalysis();
        // Persona data may be null if no analysis has been run
    }

    async testGuardianIntegration() {
        const guardian = new ContentGuardian();
        
        // Test validation
        const validation = await guardian.validateContent();
        assert(typeof validation.valid === 'boolean', 'Validation should return boolean');
        
        if (!validation.valid) {
            assert(Array.isArray(validation.violations), 'Should have violations array');
        }
    }

    async testComponentCommunication() {
        // Test that components can be initialized together
        const components = {};
        
        components.guardian = new ContentGuardian();
        components.analyzer = new PersonaAnalyzer({ headless: true, enableGuardian: false });
        components.engine = new MarketIntelligenceEngine({ headless: true });
        components.optimizer = new DynamicContentOptimizer({ headless: true, enableGuardian: false });
        
        assert(Object.keys(components).length === 4, 'All components should initialize');
    }

    // PERFORMANCE TESTS

    async testInitializationPerformance() {
        const startTime = Date.now();
        
        const orchestrator = new IntelligenceOrchestrator({
            headless: true,
            enablePersonaAnalysis: false,
            enableMarketIntelligence: false,
            enableContentOptimization: false
        });
        
        const initTime = Date.now() - startTime;
        assert(initTime < 5000, `Initialization should be under 5s, was ${initTime}ms`);
        
        this.testResults.performance_metrics.initialization_time = initTime;
    }

    async testMemoryUsage() {
        const initialMemory = process.memoryUsage();
        
        // Create multiple components
        const components = [];
        for (let i = 0; i < 5; i++) {
            components.push(new PersonaAnalyzer({ headless: true }));
        }
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Should not use excessive memory (arbitrary threshold of 100MB)
        assert(memoryIncrease < 100 * 1024 * 1024, `Memory usage should be reasonable, increased by ${memoryIncrease} bytes`);
        
        this.testResults.performance_metrics.memory_increase = memoryIncrease;
    }

    async testTimeoutHandling() {
        const analyzer = new PersonaAnalyzer({ 
            headless: true, 
            timeout: 1000 // Very short timeout
        });
        
        // Test that timeout configuration is respected
        assert(analyzer.config.timeout === 1000, 'Timeout should be configured correctly');
    }

    async testConcurrentOperations() {
        // Test that multiple components can exist simultaneously
        const startTime = Date.now();
        
        const components = await Promise.all([
            Promise.resolve(new PersonaAnalyzer({ headless: true })),
            Promise.resolve(new MarketIntelligenceEngine({ headless: true })),
            Promise.resolve(new DynamicContentOptimizer({ headless: true }))
        ]);
        
        const concurrentTime = Date.now() - startTime;
        assert(components.length === 3, 'All components should initialize concurrently');
        assert(concurrentTime < 2000, `Concurrent initialization should be fast, was ${concurrentTime}ms`);
        
        this.testResults.performance_metrics.concurrent_init_time = concurrentTime;
    }

    // E2E TESTS (Require Claude authentication)

    async testPersonaAnalysisPipeline() {
        console.log('    ⚠️ This test requires Claude authentication and may consume tokens');
        
        const analyzer = new PersonaAnalyzer({ 
            headless: true,
            timeout: 60000
        });
        
        try {
            await analyzer.initialize();
            
            // Test quick scan (less token usage)
            const result = await analyzer.runQuickScan();
            
            assert(result, 'Should return analysis result');
            assert(result.metadata, 'Result should have metadata');
            assert(result.persona_analyses, 'Result should have persona analyses');
            
            await analyzer.cleanup();
            
        } catch (error) {
            // If authentication fails, skip the test
            if (error.message.includes('cookie') || error.message.includes('authentication')) {
                console.log('    ⏭️ Skipping E2E test - authentication not available');
                this.testResults.skipped++;
                this.testResults.total_tests--;
                return;
            }
            throw error;
        }
    }

    async testMarketIntelligencePipeline() {
        console.log('    ⚠️ This test requires Claude authentication and may consume tokens');
        
        const engine = new MarketIntelligenceEngine({ 
            headless: true,
            timeout: 90000
        });
        
        try {
            await engine.initialize();
            
            // Test focused analysis (less token usage)
            const result = await engine.runFocusedAnalysis(['technology_trends']);
            
            assert(result, 'Should return analysis result');
            assert(Object.keys(result).length > 0, 'Should have analysis results');
            
            await engine.cleanup();
            
        } catch (error) {
            // If authentication fails, skip the test
            if (error.message.includes('cookie') || error.message.includes('authentication')) {
                console.log('    ⏭️ Skipping E2E test - authentication not available');
                this.testResults.skipped++;
                this.testResults.total_tests--;
                return;
            }
            throw error;
        }
    }

    async testFullOrchestrationPipeline() {
        console.log('    ⚠️ This test requires Claude authentication and will consume significant tokens');
        
        const orchestrator = new IntelligenceOrchestrator({
            headless: true,
            enablePersonaAnalysis: false, // Disable to reduce token usage
            enableMarketIntelligence: false, // Disable to reduce token usage
            enableContentOptimization: true, // Test one component
            optimizationLevel: 'conservative'
        });
        
        try {
            await orchestrator.initialize();
            
            const result = await orchestrator.runComprehensiveIntelligence();
            
            assert(result, 'Should return orchestration result');
            assert(result.metadata, 'Result should have metadata');
            assert(result.executive_summary, 'Result should have executive summary');
            
            await orchestrator.cleanup();
            
        } catch (error) {
            // If authentication fails, skip the test
            if (error.message.includes('cookie') || error.message.includes('authentication')) {
                console.log('    ⏭️ Skipping E2E test - authentication not available');
                this.testResults.skipped++;
                this.testResults.total_tests--;
                return;
            }
            throw error;
        }
    }

    /**
     * Generate comprehensive test report
     */
    async generateTestReport() {
        const report = {
            test_suite: 'AI Intelligence System',
            execution_date: new Date().toISOString(),
            configuration: this.config,
            results: {
                total_tests: this.testResults.total_tests,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                skipped: this.testResults.skipped,
                success_rate: `${Math.round((this.testResults.passed / this.testResults.total_tests) * 100)}%`,
                execution_time: this.calculateExecutionTime()
            },
            performance_metrics: this.testResults.performance_metrics,
            errors: this.testResults.errors,
            recommendations: this.generateTestRecommendations()
        };

        const reportPath = path.join(this.testOutputDir, `ai-intelligence-test-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        console.log(`📊 Test report saved to: ${reportPath}`);
        return report;
    }

    /**
     * Calculate total execution time
     */
    calculateExecutionTime() {
        if (this.testResults.start_time && this.testResults.end_time) {
            const start = new Date(this.testResults.start_time);
            const end = new Date(this.testResults.end_time);
            return end - start;
        }
        return 0;
    }

    /**
     * Generate test recommendations
     */
    generateTestRecommendations() {
        const recommendations = [];
        
        if (this.testResults.failed > 0) {
            recommendations.push('Review failed tests and address underlying issues');
        }
        
        if (this.testResults.performance_metrics.initialization_time > 3000) {
            recommendations.push('Consider optimizing component initialization performance');
        }
        
        if (this.testResults.errors.some(e => e.error.includes('authentication'))) {
            recommendations.push('Ensure Claude authentication is properly configured for E2E tests');
        }
        
        return recommendations;
    }

    /**
     * Print test summary to console
     */
    printTestSummary() {
        const successRate = Math.round((this.testResults.passed / this.testResults.total_tests) * 100);
        
        console.log(`\n📊 TEST SUMMARY:`);
        console.log(`  Total Tests: ${this.testResults.total_tests}`);
        console.log(`  ✅ Passed: ${this.testResults.passed}`);
        console.log(`  ❌ Failed: ${this.testResults.failed}`);
        console.log(`  ⏭️ Skipped: ${this.testResults.skipped}`);
        console.log(`  📈 Success Rate: ${successRate}%`);
        console.log(`  ⏱️ Execution Time: ${this.calculateExecutionTime()}ms`);
        
        if (Object.keys(this.testResults.performance_metrics).length > 0) {
            console.log(`\n⚡ PERFORMANCE METRICS:`);
            for (const [metric, value] of Object.entries(this.testResults.performance_metrics)) {
                console.log(`  ${metric}: ${value}${typeof value === 'number' ? 'ms' : ''}`);
            }
        }
        
        if (this.testResults.errors.length > 0) {
            console.log(`\n❌ ERRORS:`);
            this.testResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.test}: ${error.error}`);
            });
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    const config = {
        runIntegrationTests: !args.includes('--no-integration'),
        runPerformanceTests: !args.includes('--no-performance'),
        runE2ETests: !args.includes('--no-e2e'),
        headless: !args.includes('--visible')
    };

    // Set environment variable to skip E2E tests if requested
    if (args.includes('--skip-e2e')) {
        process.env.SKIP_E2E_TESTS = 'true';
    }

    const testSuite = new AIIntelligenceTestSuite(config);
    
    try {
        const results = await testSuite.runAllTests();
        
        // Exit with error code if tests failed
        if (results.failed > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Export for integration
module.exports = AIIntelligenceTestSuite;

// CLI execution
if (require.main === module) {
    main().catch(console.error);
}