#!/usr/bin/env node

/**
 * Market Trends Integration Test
 * 
 * Test script to validate the integration of market trends analysis
 * with CV enhancement pipeline. Tests both market analysis and
 * context integration components.
 * 
 * Usage: node test-market-trends-integration.js [--verbose] [--market-only] [--context-only]
 */

import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Test the market trends analyzer
async function testMarketTrendsAnalyzer() {
    console.log('🧪 Testing Market Trends Analyzer...');
    
    try {
        // Dynamic import with proper syntax
        const module = await import('./market-trends-analyzer.js');
        const MarketTrendsAnalyzer = module.MarketTrendsAnalyzer || module.default;
        const analyzer = new MarketTrendsAnalyzer();
        
        console.log('  ✓ Initializing analyzer...');
        await analyzer.initialize();
        
        console.log('  ✓ Running skills analysis...');
        const skills = await analyzer.identifyEmergingSkills();
        console.log(`    Found ${skills.length} emerging skills`);
        
        if (skills.length > 0) {
            console.log('    Top 3 emerging skills:');
            skills.slice(0, 3).forEach((skill, i) => {
                console.log(`      ${i + 1}. ${skill.skill} (${skill.category}) - Score: ${skill.overall_score}`);
            });
        }
        
        console.log('  ✓ Testing CV alignment assessment...');
        const testCVData = {
            skills: [
                { name: 'Python', category: 'Programming Languages', level: 85 },
                { name: 'JavaScript', category: 'Programming Languages', level: 80 },
                { name: 'React', category: 'Frontend', level: 75 }
            ]
        };
        
        const alignment = await analyzer.assessCVMarketAlignment(testCVData);
        console.log(`    CV alignment score: ${alignment.overall_score}/100`);
        console.log(`    Market position: ${alignment.market_position}`);
        
        return { success: true, analyzer, alignment };
    } catch (error) {
        console.error('  ❌ Market analyzer test failed:', error.message);
        return { success: false, error };
    }
}

// Test the market context integrator
async function testMarketContextIntegrator() {
    console.log('\n🧪 Testing Market Context Integrator...');
    
    try {
        // Dynamic import with proper syntax
        const module = await import('./enhancer-modules/market-context-integrator.js');
        const MarketContextIntegrator = module.MarketContextIntegrator || module.default;
        const integrator = new MarketContextIntegrator();
        
        console.log('  ✓ Initializing integrator...');
        await integrator.initialize();
        
        console.log('  ✓ Testing context generation...');
        const testSkills = ['Python', 'JavaScript', 'React'];
        
        const generalContext = integrator.generateMarketContext('general', testSkills);
        console.log(`    General context length: ${generalContext.length} characters`);
        
        const professionalContext = integrator.generateMarketContext('professional_summary', testSkills);
        console.log(`    Professional summary context length: ${professionalContext.length} characters`);
        
        const skillsContext = integrator.generateMarketContext('skills_assessment', testSkills);
        console.log(`    Skills assessment context length: ${skillsContext.length} characters`);
        
        console.log('  ✓ Testing skill alignment scoring...');
        const alignment = integrator.getSkillMarketAlignment(testSkills);
        console.log(`    Alignment score: ${alignment.overall_score}/100`);
        console.log(`    Insights: ${alignment.insights.length} market-aligned skills`);
        console.log(`    Recommendations: ${alignment.recommendations.length} improvement suggestions`);
        
        return { success: true, integrator, contexts: { generalContext, professionalContext, skillsContext }, alignment };
    } catch (error) {
        console.error('  ❌ Context integrator test failed:', error.message);
        return { success: false, error };
    }
}

// Test the integration with activity analyzer
async function testActivityAnalyzerIntegration() {
    console.log('\n🧪 Testing Activity Analyzer Integration...');
    
    try {
        // Check if we can load the updated activity analyzer
        const pathModule = await import('path');
        const activityAnalyzerPath = pathModule.join(__dirname, 'activity-analyzer.js');
        
        // Load the module and find the class
        const activityModule = await import('./activity-analyzer.js');
        console.log('  ✓ Activity analyzer module loaded successfully');
        
        // Use the exported ActivityAnalyzer class
        const { ActivityAnalyzer } = activityModule;
        const analyzer = new ActivityAnalyzer();
        
        // Mock repository data for testing
        const mockRepos = [
            { name: 'test-python-project', language: 'Python', updated_at: new Date().toISOString() },
            { name: 'test-js-project', language: 'JavaScript', updated_at: new Date().toISOString() },
            { name: 'test-react-app', language: 'TypeScript', updated_at: new Date().toISOString() }
        ];
        
        console.log('  ✓ Testing market alignment assessment...');
        const alignment = await analyzer.assessMarketAlignment(mockRepos);
        
        console.log(`    Overall score: ${alignment.overall_score}/100`);
        console.log(`    Market position: ${alignment.market_position}`);
        console.log(`    Top strengths: ${alignment.top_strengths.length} identified`);
        console.log(`    Critical gaps: ${alignment.critical_gaps.length} identified`);
        
        if (alignment.market_insights) {
            console.log(`    Trending technologies: ${alignment.market_insights.trending_in_portfolio.length} found`);
            console.log(`    Competitive positioning: ${alignment.market_insights.competitive_positioning}`);
        }
        
        return { success: true, alignment };
    } catch (error) {
        console.error('  ❌ Activity analyzer integration test failed:', error.message);
        return { success: false, error };
    }
}

// Test the full enhancement pipeline integration (if API key available)
async function testEnhancementPipelineIntegration() {
    console.log('\n🧪 Testing Enhancement Pipeline Integration...');
    
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('  ⚠️ No ANTHROPIC_API_KEY found, skipping enhancement pipeline test');
        return { success: true, skipped: true, reason: 'No API key' };
    }
    
    try {
        const enhancerPath = './claude-enhancer.js';
        
        // Just test that the enhanced module can be loaded
        console.log('  ✓ Loading enhanced Claude enhancer...');
        const enhancerModule = await import(enhancerPath);
        
        // Use the exported CVContentEnhancer class
        const { CVContentEnhancer } = enhancerModule;
        
        console.log('  ✓ Creating enhancer instance...');
        const enhancer = new CVContentEnhancer();
        
        // Test context preparation
        console.log('  ✓ Testing context preparation...');
        const mockCVData = {
            personal_info: { name: 'Test User', title: 'Software Developer' },
            skills: [
                { name: 'Python', category: 'Programming Languages', level: 85 },
                { name: 'JavaScript', category: 'Programming Languages', level: 80 }
            ],
            professional_summary: 'Experienced software developer...'
        };
        
        const mockActivityMetrics = {
            total_commits: 500,
            total_repos: 10,
            languages: ['Python', 'JavaScript']
        };
        
        const contextData = await enhancer.prepareContextData(mockCVData, mockActivityMetrics, 'professional_summary');
        
        console.log(`    Context prepared with market intelligence: ${contextData.market_context ? 'Yes' : 'No'}`);
        console.log(`    Market alignment included: ${contextData.market_alignment ? 'Yes' : 'No'}`);
        console.log(`    Target market: ${contextData.target_market}`);
        console.log(`    Positioning strategy: ${contextData.positioning_strategy && contextData.positioning_strategy.length > 0 ? 'Generated' : 'Missing'}`);
        
        return { success: true, contextData };
    } catch (error) {
        console.error('  ❌ Enhancement pipeline integration test failed:', error.message);
        return { success: false, error };
    }
}

// Generate test report
async function generateTestReport(results) {
    const timestamp = new Date().toISOString();
    const report = {
        test_execution: {
            timestamp,
            test_suite: 'Market Trends Integration Test',
            environment: {
                node_version: process.version,
                has_api_key: !!process.env.ANTHROPIC_API_KEY,
                working_directory: process.cwd()
            }
        },
        test_results: results,
        summary: {
            total_tests: Object.keys(results).length,
            passed: Object.values(results).filter(r => r.success).length,
            failed: Object.values(results).filter(r => !r.success).length,
            skipped: Object.values(results).filter(r => r.skipped).length
        }
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'data', `market-integration-test-${timestamp.split('T')[0]}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Test report saved: ${reportPath}`);
    return report;
}

// Main test execution
async function runTests() {
    const args = process.argv.slice(2);
    const verbose = args.includes('--verbose');
    const marketOnly = args.includes('--market-only');
    const contextOnly = args.includes('--context-only');
    
    console.log('🚀 Market Trends Integration Test Suite');
    console.log('=' .repeat(50));
    
    const results = {};
    
    if (!contextOnly) {
        results.market_analyzer = await testMarketTrendsAnalyzer();
    }
    
    if (!marketOnly) {
        results.context_integrator = await testMarketContextIntegrator();
        results.activity_integration = await testActivityAnalyzerIntegration();
        results.enhancement_pipeline = await testEnhancementPipelineIntegration();
    }
    
    // Generate report
    const report = await generateTestReport(results);
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Passed: ${report.summary.passed}`);
    console.log(`   ❌ Failed: ${report.summary.failed}`);
    console.log(`   ⚠️  Skipped: ${report.summary.skipped}`);
    console.log(`   📋 Total: ${report.summary.total_tests}`);
    
    if (verbose) {
        console.log('\n🔍 Detailed Results:');
        Object.entries(results).forEach(([testName, result]) => {
            const status = result.success ? '✅' : result.skipped ? '⚠️' : '❌';
            console.log(`   ${status} ${testName}: ${result.success ? 'PASSED' : result.skipped ? 'SKIPPED' : 'FAILED'}`);
            if (!result.success && result.error) {
                console.log(`      Error: ${result.error.message}`);
            }
        });
    }
    
    // Exit with appropriate code
    const exitCode = report.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = {
    testMarketTrendsAnalyzer,
    testMarketContextIntegrator,
    testActivityAnalyzerIntegration,
    testEnhancementPipelineIntegration
};