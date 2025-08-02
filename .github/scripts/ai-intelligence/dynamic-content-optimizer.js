#!/usr/bin/env node

/**
 * Dynamic Content Optimizer - Intelligent CV Content Adaptation Engine
 * 
 * Leverages browser-first Claude authentication to adapt CV content based on
 * market intelligence insights and persona feedback while maintaining authenticity
 * through content guardian integration.
 * 
 * Features:
 * - Market-driven content optimization
 * - Persona feedback integration
 * - Authenticity preservation through content guardian
 * - Before/after comparison reporting
 * - Target audience customization
 * - Skills and experience enhancement
 * - Professional narrative optimization
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { ClaudeBrowserClient } = require('../claude-browser-client');
const ContentGuardian = require('../content-guardian');

class DynamicContentOptimizer {
    constructor(config = {}) {
        this.dataDir = path.resolve(__dirname, '../../../data');
        this.intelligenceDir = path.join(this.dataDir, 'ai-intelligence');
        this.outputDir = path.join(this.dataDir, 'optimizations');
        this.config = {
            timeout: config.timeout || 45000,
            headless: config.headless !== false,
            enableGuardian: config.enableGuardian !== false,
            preserveAuthenticity: config.preserveAuthenticity !== false,
            targetAudience: config.targetAudience || 'general',
            optimizationLevel: config.optimizationLevel || 'balanced', // conservative, balanced, aggressive
            ...config
        };
        
        // Initialize components
        this.claudeClient = null;
        this.contentGuardian = this.config.enableGuardian ? new ContentGuardian() : null;
        
        // Define optimization strategies
        this.optimizationStrategies = {
            conservative: {
                name: "Conservative Enhancement",
                description: "Minimal changes, focus on polish and clarity",
                risk_level: "low",
                authenticity_priority: "highest",
                change_threshold: 0.2
            },
            balanced: {
                name: "Balanced Optimization",
                description: "Moderate enhancements based on market insights",
                risk_level: "medium",
                authenticity_priority: "high",
                change_threshold: 0.4
            },
            aggressive: {
                name: "Market-Driven Transformation",
                description: "Comprehensive optimization for maximum impact",
                risk_level: "medium-high",
                authenticity_priority: "medium",
                change_threshold: 0.6
            }
        };

        // Content optimization areas
        this.optimizationAreas = {
            professional_summary: {
                weight: 0.3,
                focus: ["value_proposition", "market_positioning", "key_strengths", "career_narrative"]
            },
            skills_presentation: {
                weight: 0.25,
                focus: ["skill_prioritization", "market_demand_alignment", "proficiency_indicators", "skill_grouping"]
            },
            experience_enhancement: {
                weight: 0.25,
                focus: ["achievement_quantification", "impact_articulation", "technology_highlighting", "responsibility_clarity"]
            },
            achievements_optimization: {
                weight: 0.15,
                focus: ["relevance_ranking", "impact_measurement", "credibility_enhancement", "differentiation"]
            },
            keywords_integration: {
                weight: 0.05,
                focus: ["ats_optimization", "industry_terminology", "skill_keywords", "role_specific_language"]
            }
        };
        
        console.log('🎯 DynamicContentOptimizer initialized with browser-first Claude authentication');
    }

    /**
     * Initialize Claude browser client and load intelligence data
     */
    async initialize() {
        if (!this.claudeClient) {
            console.log('🚀 Initializing Claude browser client for content optimization...');
            this.claudeClient = new ClaudeBrowserClient({ 
                headless: this.config.headless,
                timeout: this.config.timeout
            });
            await this.claudeClient.initialize();
        }
        
        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });
        
        console.log('✅ DynamicContentOptimizer ready for intelligent content enhancement');
    }

    /**
     * Load current CV data
     */
    async loadCVData() {
        try {
            const cvPath = path.join(this.dataDir, 'base-cv.json');
            const cvData = JSON.parse(await fs.readFile(cvPath, 'utf8'));
            
            // Validate content authenticity if guardian is enabled
            if (this.contentGuardian) {
                const validation = await this.contentGuardian.validateContent();
                if (!validation.valid) {
                    console.warn('⚠️ Content validation warnings detected - applying conservative optimization');
                    this.config.optimizationLevel = 'conservative';
                }
            }
            
            return cvData;
        } catch (error) {
            throw new Error(`Failed to load CV data: ${error.message}`);
        }
    }

    /**
     * Load market intelligence insights
     */
    async loadMarketIntelligence() {
        try {
            // Load latest market intelligence report
            const intelligenceFiles = await fs.readdir(this.intelligenceDir);
            const marketFiles = intelligenceFiles
                .filter(file => file.startsWith('market-intelligence-') && file.endsWith('.json'))
                .sort()
                .reverse();
            
            if (marketFiles.length === 0) {
                console.warn('⚠️ No market intelligence data found - optimization will be general');
                return null;
            }

            const latestMarketFile = path.join(this.intelligenceDir, marketFiles[0]);
            const marketData = JSON.parse(await fs.readFile(latestMarketFile, 'utf8'));
            
            console.log(`📊 Loaded market intelligence from: ${marketFiles[0]}`);
            return marketData;
        } catch (error) {
            console.warn('⚠️ Could not load market intelligence:', error.message);
            return null;
        }
    }

    /**
     * Load persona analysis insights
     */
    async loadPersonaAnalysis() {
        try {
            // Load latest persona analysis report
            const intelligenceFiles = await fs.readdir(this.intelligenceDir);
            const personaFiles = intelligenceFiles
                .filter(file => file.startsWith('persona-analysis-') && file.endsWith('.json'))
                .sort()
                .reverse();
            
            if (personaFiles.length === 0) {
                console.warn('⚠️ No persona analysis data found - optimization will be general');
                return null;
            }

            const latestPersonaFile = path.join(this.intelligenceDir, personaFiles[0]);
            const personaData = JSON.parse(await fs.readFile(latestPersonaFile, 'utf8'));
            
            console.log(`🎭 Loaded persona analysis from: ${personaFiles[0]}`);
            return personaData;
        } catch (error) {
            console.warn('⚠️ Could not load persona analysis:', error.message);
            return null;
        }
    }

    /**
     * Generate optimization prompts based on intelligence data
     */
    generateOptimizationPrompt(area, cvData, marketIntelligence, personaAnalysis) {
        const areaConfig = this.optimizationAreas[area];
        const strategy = this.optimizationStrategies[this.config.optimizationLevel];
        
        const basePrompt = `You are an expert CV Content Optimization Specialist with deep knowledge of current market trends and recruiting practices.

OPTIMIZATION TASK: ${area.replace('_', ' ').toUpperCase()}
STRATEGY: ${strategy.name}
APPROACH: ${strategy.description}
AUTHENTICITY PRIORITY: ${strategy.authenticity_priority}
FOCUS AREAS: ${areaConfig.focus.join(', ')}

CURRENT CV CONTENT:
${JSON.stringify(cvData, null, 2)}

MARKET INTELLIGENCE CONTEXT:
${marketIntelligence ? `
- Market Health: ${marketIntelligence.consolidated_intelligence?.market_health || 'unknown'}
- Top Opportunities: ${marketIntelligence.consolidated_intelligence?.top_opportunities?.slice(0, 3).join(', ') || 'analyzing...'}
- Key Skills in Demand: ${marketIntelligence.consolidated_intelligence?.skill_priorities?.immediate?.slice(0, 5).join(', ') || 'analyzing...'}
- Industry Outlook: ${marketIntelligence.consolidated_intelligence?.industry_outlook || 'neutral'}
` : 'No market intelligence data available - use general best practices.'}

PERSONA FEEDBACK CONTEXT:
${personaAnalysis ? `
- Recruiter Perspective: ${personaAnalysis.persona_analyses?.recruiter?.structured_analysis?.overall_impression || 'No specific feedback'}
- Hiring Manager Perspective: ${personaAnalysis.persona_analyses?.hiring_manager?.structured_analysis?.overall_impression || 'No specific feedback'}
- Peer Professional Perspective: ${personaAnalysis.persona_analyses?.peer_professional?.structured_analysis?.overall_impression || 'No specific feedback'}
- Common Recommendations: ${personaAnalysis.recommendations?.high_priority?.slice(0, 3).join(', ') || 'No specific recommendations'}
` : 'No persona analysis data available - use general optimization principles.'}

OPTIMIZATION REQUIREMENTS:`;

        const areaPrompts = {
            professional_summary: `${basePrompt}
Optimize the professional summary with these specific goals:

1. VALUE PROPOSITION ENHANCEMENT
   - Strengthen unique value proposition based on market positioning
   - Align with current industry priorities and trends
   - Emphasize competitive advantages and differentiators
   - Ensure authentic representation of genuine experience

2. MARKET POSITIONING OPTIMIZATION
   - Position candidate effectively within current market context
   - Highlight skills and experience that align with market demand
   - Address any market gaps or opportunities identified
   - Balance technical depth with leadership/business impact

3. NARRATIVE FLOW IMPROVEMENT
   - Ensure logical progression and compelling storytelling
   - Connect past experience to future career aspirations
   - Highlight career growth and learning trajectory
   - Maintain authentic voice and personality

4. KEYWORD INTEGRATION
   - Integrate relevant industry keywords naturally
   - Optimize for ATS systems without keyword stuffing
   - Balance technical terms with accessible language
   - Ensure keywords reflect actual capabilities

CRITICAL CONSTRAINTS:
- NEVER fabricate experience, achievements, or qualifications
- Maintain factual accuracy of all claims and statements
- Preserve authentic career narrative and personal voice
- Only enhance presentation, clarity, and market alignment

RESPONSE FORMAT:
{
  "original_summary": "Current professional summary text",
  "optimized_summary": "Enhanced professional summary text", 
  "key_changes": ["List of specific changes made"],
  "rationale": ["Explanation for each major change"],
  "market_alignment": "How optimization aligns with market trends",
  "authenticity_check": "Confirmation all changes are factually accurate",
  "impact_assessment": "Expected improvement in professional presentation"
}`,

            skills_presentation: `${basePrompt}
Optimize the skills presentation and organization:

1. SKILL PRIORITIZATION
   - Reorder skills based on current market demand
   - Highlight high-demand skills identified in market analysis
   - Group related skills for better comprehension
   - Balance technical skills with soft skills

2. PROFICIENCY INDICATORS
   - Add appropriate proficiency levels where missing
   - Align proficiency claims with actual experience
   - Include years of experience for key technologies
   - Highlight certifications and formal training

3. MARKET DEMAND ALIGNMENT
   - Emphasize skills with highest market value
   - Add emerging technologies from market trends
   - De-emphasize outdated or low-demand skills
   - Include skill combinations that create competitive advantage

4. PRESENTATION OPTIMIZATION
   - Improve categorization and grouping
   - Enhance readability and scannability
   - Add context for specialized or niche skills
   - Optimize for both human readers and ATS systems

RESPONSE FORMAT: Provide optimized skills structure with rationale for changes.`,

            experience_enhancement: `${basePrompt}
Enhance the experience section presentation and impact:

1. ACHIEVEMENT QUANTIFICATION
   - Add metrics and measurable outcomes where possible
   - Highlight business impact and value creation
   - Quantify scope, scale, and results of work
   - Balance technical achievements with business outcomes

2. TECHNOLOGY HIGHLIGHTING
   - Emphasize technologies with high market demand
   - Add context for technology choices and implementations
   - Highlight technical leadership and architecture decisions
   - Connect technology usage to business outcomes

3. RESPONSIBILITY CLARITY
   - Clarify role scope and decision-making authority
   - Highlight leadership and collaboration aspects
   - Emphasize problem-solving and innovation examples
   - Connect daily responsibilities to career growth

4. NARRATIVE COHERENCE
   - Ensure logical career progression story
   - Highlight continuous learning and adaptation
   - Connect experiences to broader career narrative
   - Emphasize transferable skills and growth mindset

RESPONSE FORMAT: Provide enhanced experience descriptions with improvement rationale.`,

            achievements_optimization: `${basePrompt}
Optimize achievements for maximum impact and credibility:

1. RELEVANCE RANKING
   - Prioritize achievements most relevant to target roles
   - Align with market trends and industry priorities
   - Emphasize achievements that demonstrate growth
   - Remove or de-emphasize less relevant accomplishments

2. IMPACT MEASUREMENT
   - Add quantifiable metrics where possible
   - Highlight business value and stakeholder impact
   - Demonstrate scope and scale of achievements
   - Connect achievements to organizational success

3. CREDIBILITY ENHANCEMENT
   - Ensure all achievements are verifiable and accurate
   - Add context that supports credibility
   - Remove any claims that might seem inflated
   - Balance confidence with authenticity

4. DIFFERENTIATION FOCUS
   - Highlight unique or uncommon achievements
   - Emphasize achievements that stand out in the market
   - Connect achievements to competitive advantages
   - Show progression and continuous improvement

RESPONSE FORMAT: Provide optimized achievements list with enhancement explanations.`,

            keywords_integration: `${basePrompt}
Optimize keyword integration throughout the CV:

1. ATS OPTIMIZATION
   - Integrate relevant keywords naturally throughout content
   - Avoid keyword stuffing while ensuring coverage
   - Balance technical terms with role-specific language
   - Optimize for common job posting terminology

2. INDUSTRY TERMINOLOGY
   - Use current and relevant industry language
   - Replace outdated terms with modern equivalents
   - Ensure terminology aligns with target role level
   - Balance technical depth with accessibility

3. SKILL KEYWORDS
   - Integrate high-demand skill keywords from market analysis
   - Use both full names and common abbreviations
   - Include related and complementary skill terms
   - Ensure keyword usage reflects actual capabilities

4. NATURAL INTEGRATION
   - Integrate keywords seamlessly into existing content
   - Maintain natural language flow and readability
   - Avoid obvious keyword manipulation
   - Preserve authentic voice and writing style

RESPONSE FORMAT: Provide keyword integration strategy with specific recommendations.`
        };

        return areaPrompts[area] || areaPrompts.professional_summary;
    }

    /**
     * Optimize specific content area
     */
    async optimizeContentArea(area, cvData, marketIntelligence, personaAnalysis) {
        console.log(`🎯 Optimizing ${area.replace('_', ' ')}...`);
        
        try {
            const prompt = this.generateOptimizationPrompt(area, cvData, marketIntelligence, personaAnalysis);
            
            const response = await this.claudeClient.sendMessage(prompt);
            
            const optimization = {
                area: area,
                area_name: area.replace('_', ' ').toUpperCase(),
                strategy: this.config.optimizationLevel,
                timestamp: new Date().toISOString(),
                raw_response: response.content[0].text,
                token_usage: response.usage,
                conversation_id: response.conversation_id,
                market_context_used: !!marketIntelligence,
                persona_context_used: !!personaAnalysis
            };

            // Attempt to parse structured response
            try {
                const jsonMatch = optimization.raw_response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    optimization.structured_optimization = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn(`⚠️ Could not parse structured response for ${area}`);
                optimization.structured_optimization = null;
            }

            // Extract key changes and rationale even if structured parsing fails
            optimization.extracted_insights = this.extractOptimizationInsights(optimization.raw_response);

            console.log(`✅ ${area.replace('_', ' ')} optimization complete`);
            return optimization;

        } catch (error) {
            console.error(`❌ Optimization failed for ${area}:`, error.message);
            throw new Error(`Content optimization failed: ${error.message}`);
        }
    }

    /**
     * Extract optimization insights from response text
     */
    extractOptimizationInsights(text) {
        const insights = {
            key_changes: [],
            rationale: [],
            improvements: [],
            market_alignment: null
        };

        // Extract key changes
        const changesMatch = text.match(/(?:key_changes|changes|modifications):(.+?)(?=\n[a-z_]+:|$)/gis);
        if (changesMatch && changesMatch[0]) {
            insights.key_changes = changesMatch[0].split(/\n\s*[-•]/).slice(1, 6)
                .map(change => change.trim().replace(/["\[\]]/g, '').substring(0, 150));
        }

        // Extract rationale
        const rationaleMatch = text.match(/(?:rationale|reasoning|justification):(.+?)(?=\n[a-z_]+:|$)/gis);
        if (rationaleMatch && rationaleMatch[0]) {
            insights.rationale = rationaleMatch[0].split(/\n\s*[-•]/).slice(1, 4)
                .map(reason => reason.trim().replace(/["\[\]]/g, '').substring(0, 200));
        }

        // Extract improvement mentions
        const improvementKeywords = ['improve', 'enhance', 'strengthen', 'optimize', 'better'];
        const improvementSentences = text.split(/[.!?]/).filter(sentence => 
            improvementKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
        );
        insights.improvements = improvementSentences.slice(0, 3).map(imp => imp.trim().substring(0, 150));

        return insights;
    }

    /**
     * Run comprehensive content optimization
     */
    async runComprehensiveOptimization() {
        console.log('🎯 Starting comprehensive CV content optimization...');
        
        const startTime = Date.now();
        const cvData = await this.loadCVData();
        const marketIntelligence = await this.loadMarketIntelligence();
        const personaAnalysis = await this.loadPersonaAnalysis();
        
        const optimizations = {};
        const errors = {};

        // Optimize each content area
        for (const [areaKey, areaConfig] of Object.entries(this.optimizationAreas)) {
            try {
                optimizations[areaKey] = await this.optimizeContentArea(
                    areaKey, cvData, marketIntelligence, personaAnalysis
                );
                
                // Add delay between requests to manage Claude usage
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } catch (error) {
                console.error(`❌ Failed to optimize ${areaKey}:`, error.message);
                errors[areaKey] = {
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }

        const executionTime = Date.now() - startTime;

        // Generate comprehensive optimization report
        const report = {
            metadata: {
                optimization_id: `content-optimization-${Date.now()}`,
                timestamp: new Date().toISOString(),
                execution_time_ms: executionTime,
                strategy: this.config.optimizationLevel,
                target_audience: this.config.targetAudience,
                areas_optimized: Object.keys(optimizations),
                areas_failed: Object.keys(errors),
                success_rate: `${Object.keys(optimizations).length}/${Object.keys(this.optimizationAreas).length}`,
                intelligence_context: {
                    market_data_used: !!marketIntelligence,
                    persona_data_used: !!personaAnalysis,
                    content_guardian_enabled: !!this.contentGuardian
                }
            },
            original_cv: cvData,
            optimization_context: {
                market_intelligence_summary: marketIntelligence ? {
                    analysis_date: marketIntelligence.metadata?.timestamp,
                    areas_analyzed: marketIntelligence.metadata?.areas_analyzed?.length || 0,
                    key_opportunities: marketIntelligence.consolidated_intelligence?.top_opportunities?.slice(0, 3) || []
                } : null,
                persona_analysis_summary: personaAnalysis ? {
                    analysis_date: personaAnalysis.metadata?.timestamp,
                    personas_analyzed: personaAnalysis.metadata?.personas_analyzed?.length || 0,
                    success_rate: personaAnalysis.metadata?.success_rate
                } : null
            },
            content_optimizations: optimizations,
            optimization_errors: errors,
            consolidated_improvements: this.generateConsolidatedImprovements(optimizations),
            implementation_guide: this.generateImplementationGuide(optimizations),
            before_after_comparison: this.generateBeforeAfterComparison(cvData, optimizations),
            performance_metrics: {
                total_tokens_used: Object.values(optimizations).reduce((sum, opt) => 
                    sum + (opt.token_usage?.input_tokens || 0) + (opt.token_usage?.output_tokens || 0), 0),
                average_response_time: executionTime / Object.keys(optimizations).length,
                claude_conversations: Object.values(optimizations).map(opt => opt.conversation_id)
            }
        };

        // Save comprehensive optimization report
        const reportPath = path.join(this.outputDir, `content-optimization-${Date.now()}.json`);
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        console.log(`🎯 Content optimization complete! Report saved to: ${reportPath}`);
        console.log(`⚡ Execution time: ${executionTime}ms`);
        console.log(`📝 Areas optimized: ${Object.keys(optimizations).length}/${Object.keys(this.optimizationAreas).length}`);
        
        return report;
    }

    /**
     * Generate consolidated improvements summary
     */
    generateConsolidatedImprovements(optimizations) {
        const improvements = {
            high_impact_changes: [],
            common_themes: [],
            market_alignments: [],
            authenticity_preserved: true,
            overall_enhancement_score: 0
        };

        // Aggregate improvements from all optimizations
        for (const [area, optimization] of Object.entries(optimizations)) {
            if (optimization.extracted_insights) {
                improvements.high_impact_changes.push(...optimization.extracted_insights.improvements.slice(0, 2));
                improvements.common_themes.push(...optimization.extracted_insights.key_changes.slice(0, 1));
            }
        }

        return improvements;
    }

    /**
     * Generate implementation guide
     */
    generateImplementationGuide(optimizations) {
        return {
            immediate_actions: [
                'Review optimization recommendations',
                'Validate all suggested changes for accuracy',
                'Implement high-priority improvements first'
            ],
            implementation_order: [
                'professional_summary',
                'skills_presentation', 
                'experience_enhancement',
                'achievements_optimization',
                'keywords_integration'
            ],
            quality_checks: [
                'Verify all claims remain factually accurate',
                'Ensure natural language flow',
                'Test ATS compatibility if relevant',
                'Review overall narrative coherence'
            ],
            success_metrics: [
                'Improved professional presentation',
                'Better market alignment',
                'Enhanced readability and impact',
                'Maintained authenticity and accuracy'
            ]
        };
    }

    /**
     * Generate before/after comparison
     */
    generateBeforeAfterComparison(originalCV, optimizations) {
        return {
            comparison_date: new Date().toISOString(),
            areas_compared: Object.keys(optimizations),
            key_improvements: 'Optimization analysis complete',
            preservation_check: 'Authenticity validation required',
            implementation_impact: 'Improved market positioning and professional presentation'
        };
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.claudeClient) {
            await this.claudeClient.close();
            this.claudeClient = null;
        }
        console.log('🧹 DynamicContentOptimizer cleanup complete');
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
        preserveAuthenticity: !args.includes('--no-auth-check'),
        optimizationLevel: args.includes('--conservative') ? 'conservative' 
                         : args.includes('--aggressive') ? 'aggressive' 
                         : 'balanced',
        targetAudience: args.find(arg => arg.startsWith('--audience='))?.split('=')[1] || 'general'
    };

    const optimizer = new DynamicContentOptimizer(config);
    
    try {
        await optimizer.initialize();
        
        const report = await optimizer.runComprehensiveOptimization();

        console.log('\n🎯 CONTENT OPTIMIZATION SUMMARY:');
        console.log(`📝 Strategy: ${report.metadata.strategy}`);
        console.log(`📊 Areas Optimized: ${report.metadata.areas_optimized.length}/${Object.keys(optimizer.optimizationAreas).length}`);
        console.log(`⏱️  Duration: ${report.metadata.execution_time_ms}ms`);
        console.log(`🎯 Success Rate: ${report.metadata.success_rate}`);
        console.log(`💬 Total Tokens: ${report.performance_metrics.total_tokens_used}`);
        console.log(`🛡️  Content Guardian: ${report.metadata.intelligence_context.content_guardian_enabled ? 'Enabled' : 'Disabled'}`);
        
        if (report.metadata.areas_failed.length > 0) {
            console.log(`⚠️  Failed Areas: ${report.metadata.areas_failed.join(', ')}`);
        }

    } catch (error) {
        console.error('❌ DynamicContentOptimizer failed:', error.message);
        process.exit(1);
    } finally {
        await optimizer.cleanup();
    }
}

// Export for integration
module.exports = DynamicContentOptimizer;

// CLI execution
if (require.main === module) {
    main().catch(console.error);
}