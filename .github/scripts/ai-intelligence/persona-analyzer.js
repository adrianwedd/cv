#!/usr/bin/env node

/**
 * Persona Analyzer - Multi-Perspective CV Content Evaluation System
 * 
 * Leverages browser-first Claude authentication to analyze CV content from multiple
 * professional perspectives: recruiter, hiring manager, and peer professional.
 * Each persona provides specific feedback, scoring, and recommendations.
 * 
 * Features:
 * - Multi-persona content evaluation (recruiter, hiring manager, peer)
 * - Detailed scoring and feedback from each perspective
 * - Integration with existing browser-first Claude client
 * - Content guardian integration for authenticity protection
 * - Performance optimization for multiple AI requests
 * - Comprehensive reporting with actionable insights
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { ClaudeBrowserClient } = require('../claude-browser-client');
const ContentGuardian = require('../content-guardian');

class PersonaAnalyzer {
    constructor(config = {}) {
        this.dataDir = path.resolve(__dirname, '../../../data');
        this.outputDir = path.join(this.dataDir, 'ai-intelligence');
        this.config = {
            timeout: config.timeout || 45000,
            headless: config.headless !== false,
            enableGuardian: config.enableGuardian !== false,
            ...config
        };
        
        // Initialize components
        this.claudeClient = null;
        this.contentGuardian = this.config.enableGuardian ? new ContentGuardian() : null;
        
        // Define evaluation personas
        this.personas = {
            recruiter: {
                name: "Technical Recruiter",
                perspective: "recruitment_screening",
                focus: ["keyword_optimization", "ats_compatibility", "skills_presentation", "experience_relevance"],
                weight: 0.3
            },
            hiring_manager: {
                name: "Engineering Manager",
                perspective: "technical_leadership",
                focus: ["technical_depth", "leadership_potential", "problem_solving", "team_fit"],
                weight: 0.4
            },
            peer_professional: {
                name: "Senior Technical Professional",
                perspective: "peer_assessment",
                focus: ["technical_credibility", "industry_knowledge", "innovation_mindset", "career_progression"],
                weight: 0.3
            }
        };
        
        console.log('🎭 PersonaAnalyzer initialized with browser-first Claude authentication');
    }

    /**
     * Initialize Claude browser client
     */
    async initialize() {
        if (!this.claudeClient) {
            console.log('🚀 Initializing Claude browser client...');
            this.claudeClient = new ClaudeBrowserClient({ 
                headless: this.config.headless,
                timeout: this.config.timeout
            });
            await this.claudeClient.initialize();
        }
        
        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });
        
        console.log('✅ PersonaAnalyzer ready for multi-perspective analysis');
    }

    /**
     * Load CV data with content validation
     */
    async loadCVData() {
        try {
            const cvPath = path.join(this.dataDir, 'base-cv.json');
            const cvData = JSON.parse(await fs.readFile(cvPath, 'utf8'));
            
            // Validate content authenticity if guardian is enabled
            if (this.contentGuardian) {
                const validation = await this.contentGuardian.validateContent();
                if (!validation.valid) {
                    console.warn('⚠️ Content validation warnings detected - proceeding with caution');
                }
            }
            
            return cvData;
        } catch (error) {
            throw new Error(`Failed to load CV data: ${error.message}`);
        }
    }

    /**
     * Generate persona-specific prompts for CV evaluation
     */
    generatePersonaPrompt(persona, cvData, analysisType = 'comprehensive') {
        const personaConfig = this.personas[persona];
        const focusAreas = personaConfig.focus.join(', ');
        
        const basePrompt = `You are a ${personaConfig.name} evaluating this CV from a ${personaConfig.perspective} perspective.

PERSONA DETAILS:
- Role: ${personaConfig.name}
- Perspective: ${personaConfig.perspective}
- Primary Focus Areas: ${focusAreas}
- Evaluation Weight: ${(personaConfig.weight * 100)}%

CV CONTENT TO EVALUATE:
${JSON.stringify(cvData, null, 2)}

EVALUATION REQUIREMENTS:`;

        const analysisPrompts = {
            comprehensive: `${basePrompt}
Provide a comprehensive evaluation including:

1. OVERALL IMPRESSION (1-10 score)
   - First impression and standout elements
   - Professional presentation quality
   - Alignment with modern industry standards

2. STRENGTHS ANALYSIS
   - Top 3-5 strongest elements from your perspective
   - Specific examples that demonstrate competency
   - Unique value propositions that differentiate this candidate

3. IMPROVEMENT OPPORTUNITIES
   - Specific areas needing enhancement
   - Missing elements that would strengthen the CV
   - Formatting or presentation improvements

4. FOCUS AREA SCORING (1-10 for each)
   ${personaConfig.focus.map(area => `- ${area.replace('_', ' ').toUpperCase()}`).join('\n   ')}

5. ACTIONABLE RECOMMENDATIONS
   - 3-5 specific, implementable improvements
   - Priority ranking (High/Medium/Low)
   - Expected impact of each recommendation

6. COMPETITIVE POSITIONING
   - How this CV compares to typical candidates
   - Market positioning strengths and gaps
   - Differentiation opportunities

7. RED FLAGS OR CONCERNS
   - Any elements that raise questions
   - Potential barriers to advancement
   - Areas requiring clarification

RESPONSE FORMAT: Provide structured JSON with clear sections for each evaluation area.`,

            quick_scan: `${basePrompt}
Provide a focused 60-second scan evaluation:

1. QUICK SCORE (1-10): Overall impression
2. TOP 3 STRENGTHS: Most impressive elements
3. TOP 3 CONCERNS: Immediate improvement needs
4. PASS/INTERVIEW/REJECT: Recommendation with brief rationale

Keep response concise but actionable.`,

            targeted_feedback: `${basePrompt}
Focus specifically on these improvement areas:
1. Technical skills presentation and credibility
2. Experience narrative and achievement quantification
3. Market positioning and competitive differentiation

Provide specific, actionable feedback for each area with implementation guidance.`
        };

        return analysisPrompts[analysisType] || analysisPrompts.comprehensive;
    }

    /**
     * Analyze CV from single persona perspective
     */
    async analyzeFromPersona(persona, cvData, analysisType = 'comprehensive') {
        console.log(`🎭 Analyzing from ${this.personas[persona].name} perspective...`);
        
        try {
            const prompt = this.generatePersonaPrompt(persona, cvData, analysisType);
            
            const response = await this.claudeClient.sendMessage(prompt);
            
            const analysis = {
                persona: persona,
                persona_name: this.personas[persona].name,
                perspective: this.personas[persona].perspective,
                focus_areas: this.personas[persona].focus,
                weight: this.personas[persona].weight,
                analysis_type: analysisType,
                timestamp: new Date().toISOString(),
                raw_response: response.content[0].text,
                token_usage: response.usage,
                conversation_id: response.conversation_id
            };

            // Attempt to parse structured response
            try {
                const jsonMatch = analysis.raw_response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis.structured_analysis = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn(`⚠️ Could not parse structured response from ${persona}`);
                analysis.structured_analysis = null;
            }

            console.log(`✅ ${this.personas[persona].name} analysis complete`);
            return analysis;

        } catch (error) {
            console.error(`❌ Analysis failed for persona ${persona}:`, error.message);
            throw new Error(`Persona analysis failed: ${error.message}`);
        }
    }

    /**
     * Run comprehensive multi-persona analysis
     */
    async runComprehensiveAnalysis(analysisType = 'comprehensive') {
        console.log('🎯 Starting comprehensive multi-persona CV analysis...');
        
        const startTime = Date.now();
        const cvData = await this.loadCVData();
        const analyses = {};
        const errors = {};

        // Analyze from each persona perspective
        for (const [personaKey, personaConfig] of Object.entries(this.personas)) {
            try {
                analyses[personaKey] = await this.analyzeFromPersona(personaKey, cvData, analysisType);
                
                // Add delay between requests to avoid overwhelming Claude
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Failed to analyze from ${personaConfig.name} perspective:`, error.message);
                errors[personaKey] = {
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }

        const executionTime = Date.now() - startTime;

        // Generate comprehensive report
        const report = {
            metadata: {
                analysis_id: `persona-analysis-${Date.now()}`,
                timestamp: new Date().toISOString(),
                analysis_type: analysisType,
                execution_time_ms: executionTime,
                cv_version: cvData.metadata?.version || 'unknown',
                personas_analyzed: Object.keys(analyses),
                personas_failed: Object.keys(errors),
                success_rate: `${Object.keys(analyses).length}/${Object.keys(this.personas).length}`
            },
            cv_summary: {
                candidate_name: cvData.personal_info?.name,
                title: cvData.personal_info?.title,
                experience_years: cvData.experience?.length || 0,
                key_skills: cvData.skills?.slice(0, 10)?.map(s => s.name) || [],
                achievements_count: cvData.achievements?.length || 0
            },
            persona_analyses: analyses,
            analysis_errors: errors,
            consolidated_insights: this.generateConsolidatedInsights(analyses),
            recommendations: this.generatePrioritizedRecommendations(analyses),
            performance_metrics: {
                total_tokens_used: Object.values(analyses).reduce((sum, a) => 
                    sum + (a.token_usage?.input_tokens || 0) + (a.token_usage?.output_tokens || 0), 0),
                average_response_time: executionTime / Object.keys(analyses).length,
                claude_conversations: Object.values(analyses).map(a => a.conversation_id)
            }
        };

        // Save comprehensive report
        const reportPath = path.join(this.outputDir, `persona-analysis-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        console.log(`📊 Multi-persona analysis complete! Report saved to: ${reportPath}`);
        console.log(`⚡ Execution time: ${executionTime}ms`);
        console.log(`🎭 Personas analyzed: ${Object.keys(analyses).length}/${Object.keys(this.personas).length}`);
        
        return report;
    }

    /**
     * Generate consolidated insights from all persona analyses
     */
    generateConsolidatedInsights(analyses) {
        const insights = {
            consensus_strengths: [],
            consensus_concerns: [],
            persona_specific_insights: {},
            overall_scores: {},
            recommendation_themes: []
        };

        // Extract common themes and scoring
        for (const [persona, analysis] of Object.entries(analyses)) {
            const personaConfig = this.personas[persona];
            
            insights.persona_specific_insights[persona] = {
                perspective: personaConfig.perspective,
                weight: personaConfig.weight,
                key_focus: personaConfig.focus,
                primary_feedback: this.extractKeyPoints(analysis.raw_response)
            };

            // Attempt to extract scores if structured analysis available
            if (analysis.structured_analysis) {
                insights.overall_scores[persona] = analysis.structured_analysis.overall_score || null;
            }
        }

        return insights;
    }

    /**
     * Generate prioritized recommendations based on all persona feedback
     */
    generatePrioritizedRecommendations(analyses) {
        const recommendations = {
            high_priority: [],
            medium_priority: [],
            low_priority: [],
            persona_consensus: [],
            persona_specific: {}
        };

        // Extract recommendations from each persona
        for (const [persona, analysis] of Object.entries(analyses)) {
            const personaRecs = this.extractRecommendations(analysis.raw_response);
            recommendations.persona_specific[persona] = personaRecs;
        }

        return recommendations;
    }

    /**
     * Extract key points from analysis text
     */
    extractKeyPoints(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 20);
        return lines.slice(0, 5).map(line => line.trim().substring(0, 150));
    }

    /**
     * Extract recommendations from analysis text
     */
    extractRecommendations(text) {
        const recSections = text.toLowerCase().includes('recommendation') 
            ? text.split(/recommendations?:?/i)[1] || text
            : text;
        
        return recSections.split('\n')
            .filter(line => line.trim().length > 20)
            .slice(0, 5)
            .map(line => line.trim().substring(0, 200));
    }

    /**
     * Run quick scan analysis for rapid feedback
     */
    async runQuickScan() {
        console.log('⚡ Running quick persona scan analysis...');
        return await this.runComprehensiveAnalysis('quick_scan');
    }

    /**
     * Run targeted feedback analysis
     */
    async runTargetedAnalysis() {
        console.log('🎯 Running targeted persona feedback analysis...');
        return await this.runComprehensiveAnalysis('targeted_feedback');
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.claudeClient) {
            await this.claudeClient.close();
            this.claudeClient = null;
        }
        console.log('🧹 PersonaAnalyzer cleanup complete');
    }
}

/**
 * CLI interface
 */
async function main() {
    const args = process.argv.slice(2);
    const analysisType = args.includes('--quick') ? 'quick_scan' 
                      : args.includes('--targeted') ? 'targeted_feedback' 
                      : 'comprehensive';
    
    const config = {
        headless: !args.includes('--visible'),
        enableGuardian: !args.includes('--no-guardian')
    };

    const analyzer = new PersonaAnalyzer(config);
    
    try {
        await analyzer.initialize();
        
        let report;
        switch (analysisType) {
            case 'quick_scan':
                report = await analyzer.runQuickScan();
                break;
            case 'targeted_feedback':
                report = await analyzer.runTargetedAnalysis();
                break;
            default:
                report = await analyzer.runComprehensiveAnalysis();
        }

        console.log('\n📋 ANALYSIS SUMMARY:');
        console.log(`🎭 Personas: ${report.metadata.personas_analyzed.length}/${Object.keys(analyzer.personas).length}`);
        console.log(`⏱️  Duration: ${report.metadata.execution_time_ms}ms`);
        console.log(`🎯 Success Rate: ${report.metadata.success_rate}`);
        console.log(`💬 Total Tokens: ${report.performance_metrics.total_tokens_used}`);
        
        if (report.metadata.personas_failed.length > 0) {
            console.log(`⚠️  Failed Personas: ${report.metadata.personas_failed.join(', ')}`);
        }

    } catch (error) {
        console.error('❌ PersonaAnalyzer failed:', error.message);
        process.exit(1);
    } finally {
        await analyzer.cleanup();
    }
}

// Export for integration
module.exports = PersonaAnalyzer;

// CLI execution
if (require.main === module) {
    main().catch(console.error);
}