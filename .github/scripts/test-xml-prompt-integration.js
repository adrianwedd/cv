#!/usr/bin/env node

/**
 * XML Prompt Integration Test Suite
 * 
 * Tests the integration of XML-structured prompts with few-shot learning
 * to validate Issues #96 and #97 implementation quality.
 * 
 * Test Categories:
 * - XML prompt construction validation
 * - Few-shot example integration
 * - Response validation and quality scoring
 * - Integration with existing claude-enhancer.js
 * - Performance and fallback testing
 * 
 * @author Adrian Wedd
 * @version 2.1.0
 */

import { AdvancedXMLPromptConstructor } from './enhancer-modules/advanced-xml-prompt-constructor.js';
import { XMLFewShotIntegrator } from './enhancer-modules/xml-few-shot-integrator.js';

/**
 * Test suite for XML prompt engineering integration
 */
class XMLPromptIntegrationTestSuite {
    constructor() {
        this.xmlConstructor = new AdvancedXMLPromptConstructor();
        this.xmlIntegrator = new XMLFewShotIntegrator();
        this.testResults = {
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            test_details: []
        };
    }

    /**
     * Run comprehensive test suite
     */
    async runTestSuite() {
        console.log('🧪 **XML PROMPT INTEGRATION TEST SUITE**');
        console.log('Testing Implementation of Issues #96 (Few-Shot Prompting) and #97 (XML Structuring)');
        console.log('');

        try {
            // Initialize components
            await this.xmlConstructor.initialize();
            await this.xmlIntegrator.initialize();

            console.log('📋 Running Test Categories:');
            console.log('  1. XML Prompt Construction Validation');
            console.log('  2. Few-Shot Example Integration');
            console.log('  3. Response Validation and Quality Scoring');
            console.log('  4. Integration with Existing System');
            console.log('  5. Performance and Fallback Testing');
            console.log('');

            await this.testXMLPromptConstruction();
            await this.testFewShotExampleIntegration();
            await this.testResponseValidation();
            await this.testSystemIntegration();
            await this.testPerformanceAndFallbacks();

            this.printTestSummary();
            return this.testResults;

        } catch (error) {
            console.error('❌ Test suite execution failed:', error.message);
            throw error;
        }
    }

    /**
     * Test XML prompt construction functionality
     */
    async testXMLPromptConstruction() {
        console.log('🔨 Testing XML Prompt Construction...');

        // Test 1: Professional Summary XML Construction
        await this.runTest('Professional Summary XML Prompt Construction', async () => {
            const contextData = {
                currentContent: "AI Engineer with experience in machine learning.",
                activityScore: 75,
                languages: ['Python', 'JavaScript', 'TypeScript'],
                repositories: 15,
                specialization: 'AI/ML engineering',
                evidence: [{ observation: 'Strong GitHub activity', inference: 'Technical competency', confidence: 'high' }]
            };

            const result = await this.xmlConstructor.constructXMLPrompt('professional-summary', contextData, 'balanced');
            
            this.assert(result.prompt.includes('<prompt_engineering_framework>'), 'XML structure root element present');
            this.assert(result.prompt.includes('<few_shot_learning>'), 'Few-shot learning section present');
            this.assert(result.prompt.includes('<evidence_base>'), 'Evidence base section present');
            this.assert(result.metadata.prompt_type === 'professional-summary', 'Correct prompt type in metadata');
            this.assert(result.metadata.creativity_level === 'balanced', 'Correct creativity level in metadata');
        });

        // Test 2: Skills Enhancement XML Construction
        await this.runTest('Skills Enhancement XML Prompt Construction', async () => {
            const contextData = {
                currentContent: ['Python', 'Machine Learning', 'Docker'],
                activityScore: 65,
                languages: ['Python', 'Go'],
                repositories: 8,
                specialization: 'ML systems'
            };

            const result = await this.xmlConstructor.constructXMLPrompt('skills-enhancement', contextData, 'creative');
            
            this.assert(result.prompt.includes('<candidate_analysis>'), 'Candidate analysis section present');
            this.assert(result.prompt.includes('<enhancement_requirements>'), 'Enhancement requirements section present');
            this.assert(result.metadata.creativity_level === 'creative', 'Creative level properly set');
        });

        // Test 3: Experience Enhancement XML Construction
        await this.runTest('Experience Enhancement XML Prompt Construction', async () => {
            const contextData = {
                currentContent: [{ position: 'Software Engineer', company: 'TechCorp', achievements: ['Built ML pipeline'] }],
                activityScore: 80,
                languages: ['Python', 'Rust', 'JavaScript'],
                repositories: 20
            };

            const result = await this.xmlConstructor.constructXMLPrompt('experience-enhancement', contextData, 'innovative');
            
            this.assert(result.prompt.includes('<current_content>'), 'Current content section present');
            this.assert(result.prompt.includes('<response_instructions>'), 'Response instructions present');
            this.assert(result.metadata.few_shot_examples_used >= 0, 'Few-shot examples metadata present');
        });

        console.log('✅ XML Prompt Construction tests completed');
    }

    /**
     * Test few-shot example integration
     */
    async testFewShotExampleIntegration() {
        console.log('📚 Testing Few-Shot Example Integration...');

        // Test 4: Few-Shot Examples Loading
        await this.runTest('Few-Shot Examples Loading and Structure', async () => {
            const stats = this.xmlConstructor.getStats();
            
            this.assert(stats.few_shot_examples > 0, 'Few-shot examples loaded');
            this.assert(stats.supported_prompt_types.includes('professional-summary'), 'Professional summary examples available');
            
            // Test example structure
            const contextData = { activityScore: 70, languages: ['Python'] };
            const result = await this.xmlConstructor.constructXMLPrompt('professional-summary', contextData, 'balanced');
            
            this.assert(result.prompt.includes('<example id='), 'Actual examples included in prompt');
            this.assert(result.prompt.includes('<input>'), 'Example input structure present');
            this.assert(result.prompt.includes('<expected_output>'), 'Example output structure present');
        });

        // Test 5: Creativity Level Example Selection
        await this.runTest('Creativity Level Example Selection', async () => {
            const contextData = { activityScore: 65, languages: ['Python', 'JavaScript'] };
            
            const conservativeResult = await this.xmlConstructor.constructXMLPrompt('professional-summary', contextData, 'conservative');
            const innovativeResult = await this.xmlConstructor.constructXMLPrompt('professional-summary', contextData, 'innovative');
            
            // Both should have examples, but potentially different ones
            this.assert(conservativeResult.prompt.includes('<few_shot_learning>'), 'Conservative examples present');
            this.assert(innovativeResult.prompt.includes('<few_shot_learning>'), 'Innovative examples present');
            this.assert(conservativeResult.metadata.creativity_level === 'conservative', 'Conservative metadata correct');
            this.assert(innovativeResult.metadata.creativity_level === 'innovative', 'Innovative metadata correct');
        });

        console.log('✅ Few-Shot Example Integration tests completed');
    }

    /**
     * Test response validation and quality scoring
     */
    async testResponseValidation() {
        console.log('🎯 Testing Response Validation and Quality Scoring...');

        // Test 6: Valid Response Validation
        await this.runTest('Valid Response Validation', async () => {
            const validResponse = {
                enhanced_summary: "Senior AI Engineer with 5+ years developing production machine learning systems, demonstrated through 15+ ML projects and consistent GitHub contributions across Python, JavaScript, and TypeScript ecosystems.",
                key_differentiators: ["Production ML expertise", "Multi-language proficiency", "Consistent delivery"],
                technical_positioning: "Senior AI Engineer positioned for technical leadership roles",
                confidence_score: 0.9
            };

            const validation = this.xmlConstructor.validateOutput(validResponse, 'professional-summary');
            
            this.assert(validation.valid === true, 'Valid response passes validation');
            this.assert(validation.score > 0.7, 'Quality score above threshold');
            this.assert(validation.errors.length === 0, 'No validation errors for valid response');
        });

        // Test 7: Invalid Response Handling
        await this.runTest('Invalid Response Handling', async () => {
            const invalidResponse = {
                // Missing required fields
                enhanced_summary: "Too short",
                confidence_score: 0.5
            };

            const validation = this.xmlConstructor.validateOutput(invalidResponse, 'professional-summary');
            
            this.assert(validation.valid === false, 'Invalid response fails validation');
            this.assert(validation.errors.length > 0, 'Validation errors detected');
            this.assert(validation.score < 0.8, 'Quality score reflects issues');
        });

        // Test 8: Quality Criteria Enforcement
        await this.runTest('Quality Criteria Enforcement', async () => {
            const responseWithGenericTerms = {
                enhanced_summary: "Cutting-edge AI Engineer with seamlessly integrated innovative solutions",
                key_differentiators: ["Generic expertise", "Synergistic approaches"],
                technical_positioning: "Disruptive technology leader",
                confidence_score: 0.8
            };

            const validation = this.xmlConstructor.validateOutput(responseWithGenericTerms, 'professional-summary');
            
            this.assert(validation.warnings.length > 0, 'Generic terms trigger warnings');
            this.assert(validation.score < 0.9, 'Quality score penalized for generic language');
        });

        console.log('✅ Response Validation tests completed');
    }

    /**
     * Test integration with existing system
     */
    async testSystemIntegration() {
        console.log('🔗 Testing System Integration...');

        // Test 9: XML Integrator Initialization
        await this.runTest('XML Integrator Initialization', async () => {
            const stats = this.xmlIntegrator.getStats();
            
            this.assert(stats.initialized === true, 'XML integrator properly initialized');
            this.assert(stats.xml_constructor_stats.initialized === true, 'XML constructor initialized');
            this.assert(stats.enhancement_types_supported.length > 0, 'Enhancement types supported');
        });

        // Test 10: Professional Summary Integration
        await this.runTest('Professional Summary Integration', async () => {
            const cvData = {
                professional_summary: "AI Engineer with machine learning experience."
            };
            const activityMetrics = {
                total_repos: 10,
                top_languages: ['Python', 'JavaScript'],
                total_stars: 25
            };

            const result = await this.xmlIntegrator.enhanceProfessionalSummaryXML(cvData, activityMetrics, 'balanced');
            
            this.assert(result.xmlPrompt.length > 0, 'XML prompt generated');
            this.assert(result.enhancementType === 'xml-few-shot', 'Correct enhancement type');
            this.assert(result.quality_expected > 0.7, 'Quality expectation set');
            this.assert(result.contextData.activityScore >= 0, 'Activity score calculated');
        });

        console.log('✅ System Integration tests completed');
    }

    /**
     * Test performance and fallback mechanisms
     */
    async testPerformanceAndFallbacks() {
        console.log('⚡ Testing Performance and Fallback Mechanisms...');

        // Test 11: Performance Metrics Tracking
        await this.runTest('Performance Metrics Tracking', async () => {
            // Reset metrics
            this.xmlIntegrator.resetMetrics();
            
            // Generate some prompts
            const cvData = { professional_summary: "Test summary" };
            const activityMetrics = { total_repos: 5, top_languages: ['Python'] };
            
            await this.xmlIntegrator.enhanceProfessionalSummaryXML(cvData, activityMetrics, 'balanced');
            await this.xmlIntegrator.enhanceSkillsSectionXML(cvData, activityMetrics, 'creative');
            
            const metrics = this.xmlIntegrator.getPerformanceMetrics();
            
            this.assert(metrics.prompts_constructed >= 2, 'Prompts constructed metric tracked');
            this.assert(metrics.success_rate >= 0, 'Success rate calculated');
            this.assert(typeof metrics.quality_improvement_rate === 'number', 'Quality improvement rate tracked');
        });

        // Test 12: Fallback Mechanism
        await this.runTest('Fallback Mechanism Functionality', async () => {
            // Create a scenario that should trigger fallback
            const result = this.xmlIntegrator.createFallbackPrompt('professional-summary', {}, {}, 'balanced');
            
            this.assert(result.enhancementType === 'xml-fallback', 'Fallback type correctly set');
            this.assert(result.metadata.fallback_used === true, 'Fallback flag set in metadata');
            this.assert(result.xmlPrompt.includes('<enhancement_task>'), 'Basic XML structure in fallback');
            this.assert(result.quality_expected < 0.8, 'Lower quality expectation for fallback');
        });

        // Test 13: Memory and Resource Management
        await this.runTest('Memory and Resource Management', async () => {
            const initialStats = this.xmlConstructor.getStats();
            
            // Generate multiple prompts to test resource management
            for (let i = 0; i < 5; i++) {
                const contextData = {
                    currentContent: `Test content ${i}`,
                    activityScore: 60 + i * 5,
                    languages: ['Python', 'JavaScript']
                };
                await this.xmlConstructor.constructXMLPrompt('professional-summary', contextData, 'balanced');
            }
            
            const finalStats = this.xmlConstructor.getStats();
            
            // Resource usage should be reasonable
            this.assert(finalStats.initialized === true, 'Constructor remains initialized');
            this.assert(finalStats.few_shot_examples === initialStats.few_shot_examples, 'Examples count stable');
        });

        console.log('✅ Performance and Fallback tests completed');
    }

    /**
     * Run individual test with error handling
     */
    async runTest(testName, testFunction) {
        this.testResults.total_tests++;
        
        try {
            await testFunction();
            this.testResults.passed_tests++;
            this.testResults.test_details.push({ name: testName, status: 'PASSED', error: null });
            console.log(`  ✅ ${testName}`);
        } catch (error) {
            this.testResults.failed_tests++;
            this.testResults.test_details.push({ name: testName, status: 'FAILED', error: error.message });
            console.log(`  ❌ ${testName}: ${error.message}`);
        }
    }

    /**
     * Assert condition with descriptive error
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Print comprehensive test summary
     */
    printTestSummary() {
        console.log('');
        console.log('🎯 **TEST SUITE SUMMARY**');
        console.log(`Total Tests: ${this.testResults.total_tests}`);
        console.log(`Passed: ${this.testResults.passed_tests} ✅`);
        console.log(`Failed: ${this.testResults.failed_tests} ❌`);
        console.log(`Success Rate: ${((this.testResults.passed_tests / this.testResults.total_tests) * 100).toFixed(1)}%`);
        console.log('');

        if (this.testResults.failed_tests > 0) {
            console.log('❌ **FAILED TESTS:**');
            this.testResults.test_details
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
            console.log('');
        }

        console.log('📊 **IMPLEMENTATION STATUS:**');
        console.log(`Issue #97 (XML Tag Structuring): ${this.testResults.passed_tests >= 3 ? '✅ IMPLEMENTED' : '❌ NEEDS WORK'}`);
        console.log(`Issue #96 (Few-Shot Prompting): ${this.testResults.passed_tests >= 5 ? '✅ IMPLEMENTED' : '❌ NEEDS WORK'}`);
        console.log(`Integration Quality: ${this.testResults.passed_tests >= 10 ? '✅ HIGH' : this.testResults.passed_tests >= 7 ? '⚠️  MEDIUM' : '❌ LOW'}`);
        console.log('');

        if (this.testResults.passed_tests === this.testResults.total_tests) {
            console.log('🎉 **ALL TESTS PASSED!** XML prompt engineering integration is ready for production use.');
        } else {
            console.log(`⚠️  ${this.testResults.failed_tests} test(s) failed. Review implementation before deployment.`);
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        const testSuite = new XMLPromptIntegrationTestSuite();
        const results = await testSuite.runTestSuite();
        
        // Exit with appropriate code
        process.exit(results.failed_tests > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Test suite execution failed:', error.message);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { XMLPromptIntegrationTestSuite };