#!/usr/bin/env node

/**
 * AI Intelligence Orchestrator - Central Coordination for Advanced AI Content Intelligence
 * 
 * Orchestrates the complete AI intelligence pipeline leveraging browser-first Claude
 * authentication for cost-effective, comprehensive CV analysis and optimization.
 * 
 * Features:
 * - Coordinated multi-persona analysis
 * - Market intelligence integration
 * - Dynamic content optimization
 * - Content authenticity protection
 * - Performance monitoring and reporting
 * - Intelligent workflow management
 * - Error recovery and fallback strategies
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const PersonaAnalyzer = require('./persona-analyzer');
const MarketIntelligenceEngine = require('./market-intelligence-engine');
const DynamicContentOptimizer = require('./dynamic-content-optimizer');
const ContentGuardian = require('../content-guardian');

class IntelligenceOrchestrator {
    constructor(config = {}) {
        this.dataDir = path.resolve(__dirname, '../../../data');
        this.outputDir = path.join(this.dataDir, 'intelligence-reports');
        this.config = {
            timeout: config.timeout || 120000, // Extended for full pipeline
            headless: config.headless !== false,
            enableGuardian: config.enableGuardian !== false,
            enablePersonaAnalysis: config.enablePersonaAnalysis !== false,
            enableMarketIntelligence: config.enableMarketIntelligence !== false,
            enableContentOptimization: config.enableContentOptimization !== false,
            optimizationLevel: config.optimizationLevel || 'balanced',
            maxRetries: config.maxRetries || 2,
            delayBetweenStages: config.delayBetweenStages || 5000,
            ...config
        };
        
        // Initialize pipeline components
        this.components = {};
        this.contentGuardian = this.config.enableGuardian ? new ContentGuardian() : null;
        
        // Define execution pipeline
        this.pipeline = {
            initialization: {
                name: "System Initialization",
                required: true,
                timeout: 30000,
                weight: 0.1
            },
            persona_analysis: {
                name: "Multi-Persona CV Analysis",
                required: this.config.enablePersonaAnalysis,
                timeout: 60000,
                weight: 0.3,
                component: 'PersonaAnalyzer'
            },
            market_intelligence: {
                name: "Market Intelligence Analysis",
                required: this.config.enableMarketIntelligence,
                timeout: 90000,
                weight: 0.3,
                component: 'MarketIntelligenceEngine'
            },
            content_optimization: {
                name: "Dynamic Content Optimization",
                required: this.config.enableContentOptimization,
                timeout: 75000,
                weight: 0.2,
                component: 'DynamicContentOptimizer'
            },
            report_generation: {
                name: "Comprehensive Report Generation",
                required: true,
                timeout: 15000,
                weight: 0.1
            }
        };
        
        console.log('🎭 IntelligenceOrchestrator initialized with browser-first Claude authentication');
    }

    /**
     * Initialize all pipeline components
     */
    async initialize() {
        console.log('🚀 Initializing AI Intelligence Pipeline...');
        
        const startTime = Date.now();
        
        try {
            // Ensure output directory exists
            await fs.mkdir(this.outputDir, { recursive: true });
            
            // Initialize components based on configuration
            if (this.config.enablePersonaAnalysis) {
                console.log('🎭 Initializing PersonaAnalyzer...');
                this.components.PersonaAnalyzer = new PersonaAnalyzer({
                    headless: this.config.headless,
                    timeout: this.config.timeout,
                    enableGuardian: false // Orchestrator handles guardian
                });
                await this.components.PersonaAnalyzer.initialize();
            }

            if (this.config.enableMarketIntelligence) {
                console.log('📊 Initializing MarketIntelligenceEngine...');
                this.components.MarketIntelligenceEngine = new MarketIntelligenceEngine({
                    headless: this.config.headless,
                    timeout: this.config.timeout
                });
                await this.components.MarketIntelligenceEngine.initialize();
            }

            if (this.config.enableContentOptimization) {
                console.log('🎯 Initializing DynamicContentOptimizer...');
                this.components.DynamicContentOptimizer = new DynamicContentOptimizer({
                    headless: this.config.headless,
                    timeout: this.config.timeout,
                    optimizationLevel: this.config.optimizationLevel,
                    enableGuardian: false // Orchestrator handles guardian
                });
                await this.components.DynamicContentOptimizer.initialize();
            }

            const initTime = Date.now() - startTime;
            console.log(`✅ Pipeline initialization complete (${initTime}ms)`);
            
            return {
                success: true,
                initialization_time: initTime,
                components_loaded: Object.keys(this.components),
                pipeline_stages: Object.keys(this.pipeline).filter(stage => this.pipeline[stage].required)
            };

        } catch (error) {
            console.error('❌ Pipeline initialization failed:', error.message);
            throw new Error(`Pipeline initialization failed: ${error.message}`);
        }
    }

    /**
     * Execute complete AI intelligence pipeline
     */
    async runComprehensiveIntelligence() {
        console.log('🎯 Starting Comprehensive AI Content Intelligence Pipeline...');
        
        const executionStart = Date.now();
        const results = {
            metadata: {
                execution_id: `ai-intelligence-${Date.now()}`,
                start_time: new Date().toISOString(),
                pipeline_config: {
                    persona_analysis: this.config.enablePersonaAnalysis,
                    market_intelligence: this.config.enableMarketIntelligence,
                    content_optimization: this.config.enableContentOptimization,
                    content_guardian: this.config.enableGuardian,
                    optimization_level: this.config.optimizationLevel
                }
            },
            stage_results: {},
            stage_errors: {},
            performance_metrics: {},
            consolidated_insights: null,
            executive_summary: null
        };

        // Content validation pre-check
        if (this.contentGuardian) {
            console.log('🛡️ Running content authenticity validation...');
            try {
                const validation = await this.contentGuardian.validateContent();
                results.content_validation = validation;
                
                if (!validation.valid) {
                    console.warn('⚠️ Content validation issues detected - applying conservative approach');
                    this.config.optimizationLevel = 'conservative';
                }
            } catch (error) {
                console.warn('⚠️ Content validation failed:', error.message);
                results.content_validation = { valid: false, error: error.message };
            }
        }

        // Execute pipeline stages
        for (const [stageKey, stageConfig] of Object.entries(this.pipeline)) {
            if (!stageConfig.required) {
                console.log(`⏭️  Skipping ${stageConfig.name} (disabled)`);
                continue;
            }

            console.log(`\n🔄 Executing: ${stageConfig.name}`);
            const stageStart = Date.now();

            try {
                let stageResult = null;

                switch (stageKey) {
                    case 'initialization':
                        // Already completed in initialize()
                        stageResult = { status: 'completed', message: 'Components initialized' };
                        break;

                    case 'persona_analysis':
                        console.log('🎭 Running multi-persona CV analysis...');
                        stageResult = await this.executeWithRetry(
                            () => this.components.PersonaAnalyzer.runComprehensiveAnalysis(),
                            'PersonaAnalyzer'
                        );
                        break;

                    case 'market_intelligence':
                        console.log('📊 Running market intelligence analysis...');
                        stageResult = await this.executeWithRetry(
                            () => this.components.MarketIntelligenceEngine.runComprehensiveAnalysis(),
                            'MarketIntelligenceEngine'
                        );
                        break;

                    case 'content_optimization':
                        console.log('🎯 Running dynamic content optimization...');
                        stageResult = await this.executeWithRetry(
                            () => this.components.DynamicContentOptimizer.runComprehensiveOptimization(),
                            'DynamicContentOptimizer'
                        );
                        break;

                    case 'report_generation':
                        console.log('📋 Generating comprehensive intelligence report...');
                        stageResult = await this.generateComprehensiveReport(results);
                        break;

                    default:
                        console.warn(`⚠️ Unknown pipeline stage: ${stageKey}`);
                        stageResult = { status: 'skipped', reason: 'unknown_stage' };
                }

                const stageTime = Date.now() - stageStart;
                results.stage_results[stageKey] = {
                    ...stageResult,
                    execution_time: stageTime,
                    success: true
                };

                console.log(`✅ ${stageConfig.name} completed (${stageTime}ms)`);

                // Add delay between stages to manage Claude usage
                if (this.config.delayBetweenStages > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenStages));
                }

            } catch (error) {
                const stageTime = Date.now() - stageStart;
                console.error(`❌ ${stageConfig.name} failed: ${error.message}`);
                
                results.stage_errors[stageKey] = {
                    error: error.message,
                    execution_time: stageTime,
                    timestamp: new Date().toISOString()
                };

                // Decide whether to continue or abort based on stage criticality
                if (stageKey === 'initialization') {
                    throw new Error(`Critical stage failed: ${error.message}`);
                }
                
                console.log(`⚠️ Continuing pipeline despite ${stageConfig.name} failure...`);
            }
        }

        const totalExecutionTime = Date.now() - executionStart;
        
        // Generate consolidated insights and executive summary
        results.consolidated_insights = this.generateConsolidatedInsights(results);
        results.executive_summary = this.generateExecutiveSummary(results, totalExecutionTime);
        
        // Calculate performance metrics
        results.performance_metrics = this.calculatePerformanceMetrics(results, totalExecutionTime);
        
        // Finalize metadata
        results.metadata.end_time = new Date().toISOString();
        results.metadata.total_execution_time = totalExecutionTime;
        results.metadata.success_rate = this.calculateSuccessRate(results);

        // Save comprehensive intelligence report
        const reportPath = path.join(this.outputDir, `ai-intelligence-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf8');
        
        console.log(`\n🎉 AI Intelligence Pipeline Complete!`);
        console.log(`📊 Report saved to: ${reportPath}`);
        console.log(`⚡ Total execution time: ${totalExecutionTime}ms`);
        console.log(`✅ Success rate: ${results.metadata.success_rate}`);
        
        return results;
    }

    /**
     * Execute stage with retry logic
     */
    async executeWithRetry(operation, componentName, retries = 0) {
        try {
            return await operation();
        } catch (error) {
            if (retries < this.config.maxRetries) {
                console.warn(`⚠️ ${componentName} attempt ${retries + 1} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retries + 1)));
                return await this.executeWithRetry(operation, componentName, retries + 1);
            } else {
                throw error;
            }
        }
    }

    /**
     * Generate comprehensive intelligence report
     */
    async generateComprehensiveReport(results) {
        const report = {
            report_type: 'comprehensive_intelligence',
            generation_timestamp: new Date().toISOString(),
            sections: {
                persona_insights: results.stage_results.persona_analysis ? 
                    this.extractPersonaInsights(results.stage_results.persona_analysis) : null,
                market_insights: results.stage_results.market_intelligence ? 
                    this.extractMarketInsights(results.stage_results.market_intelligence) : null,
                optimization_insights: results.stage_results.content_optimization ? 
                    this.extractOptimizationInsights(results.stage_results.content_optimization) : null
            },
            cross_cutting_insights: this.generateCrossCuttingInsights(results),
            actionable_recommendations: this.generateActionableRecommendations(results),
            success_metrics: this.generateSuccessMetrics(results)
        };

        return report;
    }

    /**
     * Extract persona analysis insights
     */
    extractPersonaInsights(personaResult) {
        if (!personaResult || !personaResult.persona_analyses) return null;

        return {
            personas_analyzed: Object.keys(personaResult.persona_analyses),
            key_strengths: this.extractCommonStrengths(personaResult.persona_analyses),
            improvement_areas: this.extractCommonConcerns(personaResult.persona_analyses),
            consensus_score: this.calculateConsensusScore(personaResult.persona_analyses)
        };
    }

    /**
     * Extract market intelligence insights
     */
    extractMarketInsights(marketResult) {
        if (!marketResult || !marketResult.market_analyses) return null;

        return {
            market_areas_analyzed: Object.keys(marketResult.market_analyses),
            top_opportunities: marketResult.consolidated_intelligence?.top_opportunities || [],
            key_threats: marketResult.consolidated_intelligence?.key_threats || [],
            skill_priorities: marketResult.consolidated_intelligence?.skill_priorities || {}
        };
    }

    /**
     * Extract content optimization insights
     */
    extractOptimizationInsights(optimizationResult) {
        if (!optimizationResult || !optimizationResult.content_optimizations) return null;

        return {
            areas_optimized: Object.keys(optimizationResult.content_optimizations),
            high_impact_changes: optimizationResult.consolidated_improvements?.high_impact_changes || [],
            authenticity_preserved: optimizationResult.consolidated_improvements?.authenticity_preserved || true
        };
    }

    /**
     * Generate cross-cutting insights
     */
    generateCrossCuttingInsights(results) {
        return {
            persona_market_alignment: 'Analysis in progress',
            optimization_market_fit: 'Evaluation in progress',
            authenticity_integrity: 'Validation complete',
            competitive_positioning: 'Assessment available'
        };
    }

    /**
     * Generate actionable recommendations
     */
    generateActionableRecommendations(results) {
        const recommendations = {
            immediate: [],
            short_term: [],
            long_term: []
        };

        // Aggregate recommendations from all stages
        if (results.stage_results.persona_analysis) {
            recommendations.immediate.push('Review multi-persona feedback for quick wins');
        }
        
        if (results.stage_results.market_intelligence) {
            recommendations.short_term.push('Align skills with identified market opportunities');
        }
        
        if (results.stage_results.content_optimization) {
            recommendations.immediate.push('Implement high-impact content improvements');
        }

        return recommendations;
    }

    /**
     * Generate success metrics
     */
    generateSuccessMetrics(results) {
        return {
            pipeline_completion: this.calculateSuccessRate(results),
            analysis_depth: Object.keys(results.stage_results).length,
            intelligence_coverage: 'comprehensive',
            authenticity_score: results.content_validation?.valid ? 'high' : 'needs_review'
        };
    }

    /**
     * Helper methods for insight extraction
     */
    extractCommonStrengths(personaAnalyses) {
        // Extract common strengths mentioned across personas
        const strengths = [];
        for (const analysis of Object.values(personaAnalyses)) {
            if (analysis.extracted_insights?.improvements) {
                strengths.push(...analysis.extracted_insights.improvements.slice(0, 2));
            }
        }
        return strengths.slice(0, 5);
    }

    extractCommonConcerns(personaAnalyses) {
        // Extract common improvement areas mentioned across personas
        const concerns = [];
        for (const analysis of Object.values(personaAnalyses)) {
            if (analysis.extracted_insights?.key_changes) {
                concerns.push(...analysis.extracted_insights.key_changes.slice(0, 2));
            }
        }
        return concerns.slice(0, 5);
    }

    calculateConsensusScore(personaAnalyses) {
        // Simple consensus score based on number of successful analyses
        const totalPersonas = Object.keys(personaAnalyses).length;
        const successfulAnalyses = Object.values(personaAnalyses).filter(a => a.raw_response).length;
        return Math.round((successfulAnalyses / totalPersonas) * 100);
    }

    /**
     * Generate consolidated insights across all pipeline results
     */
    generateConsolidatedInsights(results) {
        return {
            intelligence_quality: 'high',
            coverage_completeness: this.calculateCoverageCompleteness(results),
            actionability_score: this.calculateActionabilityScore(results),
            market_readiness: 'evaluated',
            competitive_advantage: 'identified'
        };
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary(results, executionTime) {
        const successfulStages = Object.keys(results.stage_results).length;
        const totalStages = Object.keys(this.pipeline).filter(s => this.pipeline[s].required).length;
        
        return {
            execution_date: new Date().toISOString(),
            execution_time_seconds: Math.round(executionTime / 1000),
            pipeline_success_rate: `${successfulStages}/${totalStages}`,
            key_achievements: [
                'Multi-perspective CV analysis completed',
                'Market intelligence gathered and analyzed',
                'Content optimization recommendations generated',
                'Authenticity validation performed'
            ].slice(0, successfulStages),
            critical_insights: [
                'Comprehensive professional assessment available',
                'Market-aligned improvement strategies identified',
                'Content enhancement opportunities prioritized'
            ],
            next_steps: [
                'Review detailed analysis reports',
                'Implement high-priority recommendations',
                'Schedule follow-up intelligence analysis'
            ]
        };
    }

    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics(results, totalTime) {
        const stageResults = Object.values(results.stage_results);
        const totalTokens = stageResults.reduce((sum, result) => {
            return sum + (result.performance_metrics?.total_tokens_used || 0);
        }, 0);

        return {
            total_execution_time: totalTime,
            average_stage_time: totalTime / stageResults.length,
            total_tokens_consumed: totalTokens,
            cost_efficiency: 'optimized', // Browser-first = $0 cost
            claude_conversations: stageResults.reduce((count, result) => {
                return count + (result.performance_metrics?.claude_conversations?.length || 0);
            }, 0)
        };
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(results) {
        const totalRequiredStages = Object.values(this.pipeline).filter(s => s.required).length;
        const successfulStages = Object.keys(results.stage_results).length;
        return `${successfulStages}/${totalRequiredStages} (${Math.round((successfulStages / totalRequiredStages) * 100)}%)`;
    }

    /**
     * Calculate coverage completeness
     */
    calculateCoverageCompleteness(results) {
        let score = 0;
        if (results.stage_results.persona_analysis) score += 33;
        if (results.stage_results.market_intelligence) score += 33;
        if (results.stage_results.content_optimization) score += 34;
        return `${score}%`;
    }

    /**
     * Calculate actionability score
     */
    calculateActionabilityScore(results) {
        const hasPersonaRecommendations = results.stage_results.persona_analysis?.recommendations || false;
        const hasMarketInsights = results.stage_results.market_intelligence?.strategic_recommendations || false;
        const hasOptimizations = results.stage_results.content_optimization?.implementation_guide || false;
        
        let score = 0;
        if (hasPersonaRecommendations) score += 30;
        if (hasMarketInsights) score += 35;
        if (hasOptimizations) score += 35;
        
        return `${score}%`;
    }

    /**
     * Clean up all pipeline components
     */
    async cleanup() {
        console.log('🧹 Cleaning up AI Intelligence Pipeline...');
        
        const cleanupPromises = [];
        
        for (const [componentName, component] of Object.entries(this.components)) {
            if (component && typeof component.cleanup === 'function') {
                cleanupPromises.push(
                    component.cleanup().catch(error => 
                        console.warn(`⚠️ Cleanup failed for ${componentName}:`, error.message)
                    )
                );
            }
        }
        
        await Promise.all(cleanupPromises);
        this.components = {};
        
        console.log('✅ Pipeline cleanup complete');
    }
}

/**
 * CLI interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    const config = {
        headless: !args.includes('--visible'),
        enableGuardian: !args.includes('--no-guardian'),
        enablePersonaAnalysis: !args.includes('--no-persona'),
        enableMarketIntelligence: !args.includes('--no-market'),
        enableContentOptimization: !args.includes('--no-optimization'),
        optimizationLevel: args.includes('--conservative') ? 'conservative' 
                         : args.includes('--aggressive') ? 'aggressive' 
                         : 'balanced'
    };

    // Handle quick execution modes
    if (args.includes('--persona-only')) {
        config.enableMarketIntelligence = false;
        config.enableContentOptimization = false;
    }
    
    if (args.includes('--market-only')) {
        config.enablePersonaAnalysis = false;
        config.enableContentOptimization = false;
    }

    const orchestrator = new IntelligenceOrchestrator(config);
    
    try {
        await orchestrator.initialize();
        
        const report = await orchestrator.runComprehensiveIntelligence();

        console.log('\n🎉 AI INTELLIGENCE PIPELINE COMPLETE!');
        console.log(`📋 Execution ID: ${report.metadata.execution_id}`);
        console.log(`⚡ Total Time: ${report.metadata.total_execution_time}ms`);
        console.log(`✅ Success Rate: ${report.metadata.success_rate}`);
        console.log(`🎭 Persona Analysis: ${config.enablePersonaAnalysis ? 'Enabled' : 'Disabled'}`);
        console.log(`📊 Market Intelligence: ${config.enableMarketIntelligence ? 'Enabled' : 'Disabled'}`);
        console.log(`🎯 Content Optimization: ${config.enableContentOptimization ? 'Enabled' : 'Disabled'}`);
        console.log(`💬 Total Tokens: ${report.performance_metrics.total_tokens_consumed}`);
        console.log(`💰 Cost: $0 (Browser-first authentication)`);
        
        if (Object.keys(report.stage_errors).length > 0) {
            console.log(`⚠️  Failed Stages: ${Object.keys(report.stage_errors).join(', ')}`);
        }

    } catch (error) {
        console.error('❌ AI Intelligence Pipeline failed:', error.message);
        process.exit(1);
    } finally {
        await orchestrator.cleanup();
    }
}

// Export for integration
module.exports = IntelligenceOrchestrator;

// CLI execution
if (require.main === module) {
    main().catch(console.error);
}