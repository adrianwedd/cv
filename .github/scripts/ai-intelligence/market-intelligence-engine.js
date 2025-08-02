#!/usr/bin/env node

/**
 * Market Intelligence Engine - Industry Trend Analysis & Skill Gap Identification
 * 
 * Leverages browser-first Claude authentication to analyze job market trends,
 * identify emerging technologies, and provide competitive positioning insights.
 * Connects to various data sources for current demand analysis.
 * 
 * Features:
 * - Industry trend analysis and forecasting
 * - Skill gap identification and prioritization
 * - Competitive positioning recommendations
 * - Market demand assessment
 * - Technology adoption tracking
 * - Salary and compensation insights
 * - Integration with browser-first Claude client
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { ClaudeBrowserClient } = require('../claude-browser-client');

class MarketIntelligenceEngine {
    constructor(config = {}) {
        this.dataDir = path.resolve(__dirname, '../../../data');
        this.outputDir = path.join(this.dataDir, 'market-intelligence');
        this.config = {
            timeout: config.timeout || 60000,
            headless: config.headless !== false,
            includeGlobalTrends: config.includeGlobalTrends !== false,
            includeSkillGaps: config.includeSkillGaps !== false,
            includeCompensationData: config.includeCompensationData !== false,
            ...config
        };
        
        // Initialize components
        this.claudeClient = null;
        
        // Define market intelligence focus areas
        this.analysisAreas = {
            technology_trends: {
                name: "Technology Trends",
                focus: ["emerging_technologies", "adoption_rates", "market_maturity", "disruption_potential"],
                weight: 0.25,
                timeframe: "12-24 months"
            },
            skill_demand: {
                name: "Skill Market Demand",
                focus: ["high_demand_skills", "skill_gaps", "supply_demand_ratio", "growth_projections"],
                weight: 0.3,
                timeframe: "6-18 months"
            },
            industry_dynamics: {
                name: "Industry Dynamics",
                focus: ["market_shifts", "company_priorities", "hiring_patterns", "remote_trends"],
                weight: 0.25,
                timeframe: "3-12 months"
            },
            competitive_landscape: {
                name: "Competitive Positioning",
                focus: ["role_evolution", "career_pathways", "differentiation_opportunities", "market_positioning"],
                weight: 0.2,
                timeframe: "6-24 months"
            }
        };

        // Technology categories for targeted analysis
        this.technologyCategories = {
            ai_ml: ["Artificial Intelligence", "Machine Learning", "Deep Learning", "Computer Vision", "NLP", "LLMs", "AI Ethics"],
            cloud_devops: ["AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform", "CI/CD", "GitOps"],
            data_analytics: ["Data Science", "Analytics", "Business Intelligence", "Data Engineering", "ETL", "Real-time Analytics"],
            web_mobile: ["React", "Vue", "Angular", "React Native", "Flutter", "Progressive Web Apps", "WebAssembly"],
            backend_systems: ["Node.js", "Python", "Go", "Rust", "Microservices", "GraphQL", "Event-driven Architecture"],
            cybersecurity: ["Zero Trust", "Cloud Security", "DevSecOps", "Threat Intelligence", "Compliance", "Identity Management"],
            emerging_tech: ["Blockchain", "IoT", "Edge Computing", "5G", "AR/VR", "Quantum Computing", "Robotics"]
        };
        
        console.log('📊 MarketIntelligenceEngine initialized with browser-first Claude authentication');
    }

    /**
     * Initialize Claude browser client
     */
    async initialize() {
        if (!this.claudeClient) {
            console.log('🚀 Initializing Claude browser client for market intelligence...');
            this.claudeClient = new ClaudeBrowserClient({ 
                headless: this.config.headless,
                timeout: this.config.timeout
            });
            await this.claudeClient.initialize();
        }
        
        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });
        
        console.log('✅ MarketIntelligenceEngine ready for trend analysis');
    }

    /**
     * Load current CV data for context
     */
    async loadCVContext() {
        try {
            const cvPath = path.join(this.dataDir, 'base-cv.json');
            const cvData = JSON.parse(await fs.readFile(cvPath, 'utf8'));
            
            return {
                current_role: cvData.personal_info?.title,
                current_skills: cvData.skills?.map(s => s.name) || [],
                experience_level: this.calculateExperienceLevel(cvData.experience || []),
                technology_stack: this.extractTechnologyStack(cvData),
                career_focus: this.inferCareerFocus(cvData)
            };
        } catch (error) {
            console.warn('⚠️ Could not load CV context:', error.message);
            return null;
        }
    }

    /**
     * Calculate experience level from CV data
     */
    calculateExperienceLevel(experience) {
        const totalYears = experience.reduce((years, exp) => {
            const match = exp.period?.match(/(\d{4})\s*-\s*(\d{4}|Present)/);
            if (match) {
                const startYear = parseInt(match[1]);
                const endYear = match[2] === 'Present' ? new Date().getFullYear() : parseInt(match[2]);
                return years + (endYear - startYear);
            }
            return years;
        }, 0);

        if (totalYears < 3) return 'junior';
        if (totalYears < 7) return 'mid-level';
        if (totalYears < 12) return 'senior';
        return 'principal';
    }

    /**
     * Extract technology stack from CV
     */
    extractTechnologyStack(cvData) {
        const technologies = new Set();
        
        // From skills
        if (cvData.skills) {
            cvData.skills.forEach(skill => technologies.add(skill.name));
        }
        
        // From experience technologies
        if (cvData.experience) {
            cvData.experience.forEach(exp => {
                if (exp.technologies) {
                    exp.technologies.forEach(tech => technologies.add(tech));
                }
            });
        }
        
        return Array.from(technologies);
    }

    /**
     * Infer career focus areas from CV data
     */
    inferCareerFocus(cvData) {
        const focusAreas = [];
        const title = cvData.personal_info?.title?.toLowerCase() || '';
        const summary = cvData.professional_summary?.toLowerCase() || '';
        
        if (title.includes('ai') || title.includes('ml') || summary.includes('artificial intelligence')) {
            focusAreas.push('artificial_intelligence');
        }
        if (title.includes('architect') || summary.includes('architecture')) {
            focusAreas.push('system_architecture');
        }
        if (title.includes('data') || summary.includes('data')) {
            focusAreas.push('data_engineering');
        }
        if (title.includes('security') || summary.includes('cybersecurity')) {
            focusAreas.push('cybersecurity');
        }
        if (title.includes('cloud') || summary.includes('aws') || summary.includes('azure')) {
            focusAreas.push('cloud_infrastructure');
        }
        
        return focusAreas.length > 0 ? focusAreas : ['general_technology'];
    }

    /**
     * Generate market intelligence analysis prompts
     */
    generateMarketAnalysisPrompt(analysisArea, cvContext) {
        const areaConfig = this.analysisAreas[analysisArea];
        const currentDate = new Date().toISOString().split('T')[0];
        
        const basePrompt = `You are a Senior Technology Market Research Analyst providing insights for career development and market positioning.

ANALYSIS FOCUS: ${areaConfig.name}
TIMEFRAME: ${areaConfig.timeframe}
ANALYSIS DATE: ${currentDate}
FOCUS AREAS: ${areaConfig.focus.join(', ')}

CANDIDATE CONTEXT:
${cvContext ? `
- Current Role: ${cvContext.current_role}
- Experience Level: ${cvContext.experience_level}
- Current Skills: ${cvContext.current_skills.slice(0, 15).join(', ')}
- Technology Stack: ${cvContext.technology_stack.slice(0, 20).join(', ')}
- Career Focus: ${cvContext.career_focus.join(', ')}
` : 'No specific candidate context provided - provide general market analysis.'}

ANALYSIS REQUIREMENTS:`;

        const analysisPrompts = {
            technology_trends: `${basePrompt}
Analyze current and emerging technology trends for the next 12-24 months:

1. EMERGING TECHNOLOGIES
   - Top 5 technologies gaining significant traction
   - Adoption timeline and market readiness
   - Business impact and use cases
   - Skill requirements and learning curve

2. MATURE TECHNOLOGY EVOLUTION
   - How established technologies are evolving
   - Legacy system modernization trends
   - Integration patterns and best practices
   - Career sustainability for current skills

3. DISRUPTION INDICATORS
   - Technologies that may disrupt current roles
   - New job categories being created
   - Skills becoming obsolete or less relevant
   - Adaptation strategies for professionals

4. MARKET ADOPTION PATTERNS
   - Enterprise vs startup adoption differences
   - Geographic/regional variation in adoption
   - Industry-specific trends and drivers
   - Investment and funding patterns

5. STRATEGIC RECOMMENDATIONS
   - Technologies to learn immediately (0-6 months)
   - Technologies to monitor (6-18 months) 
   - Technologies to explore (18+ months)
   - Skills to maintain vs deprecate

Provide specific, actionable insights with timeframes and priority levels.`,

            skill_demand: `${basePrompt}
Analyze current skill market demand and supply dynamics:

1. HIGH-DEMAND SKILLS
   - Top 10 most in-demand technical skills
   - Skills with highest salary premiums
   - Skills with strongest job growth projections
   - Geographic demand variations

2. SKILL GAP ANALYSIS
   - Largest gaps between supply and demand
   - Underrepresented skills in current market
   - Skills where demand exceeds qualified candidates
   - Niche specializations with premium value

3. COMPENSATION INSIGHTS
   - Salary ranges for key skills (junior to senior)
   - Skills with highest compensation growth
   - Total compensation packages and trends
   - Remote work impact on compensation

4. LEARNING PATHWAYS
   - Most effective skill acquisition strategies
   - Online vs traditional education effectiveness
   - Certification value and market recognition
   - Portfolio/project requirements for credibility

5. MARKET SATURATION ANALYSIS
   - Skills becoming oversaturated
   - Junior vs senior level demand differences
   - Specialization vs generalization trends
   - Career progression opportunities

Focus on actionable career development insights with specific skill recommendations.`,

            industry_dynamics: `${basePrompt}
Analyze current industry dynamics and hiring patterns:

1. HIRING MARKET CONDITIONS
   - Overall tech hiring market health
   - Company size preferences (startup, mid-size, enterprise)
   - Remote vs hybrid vs on-site trends
   - Contractor vs full-time employment patterns

2. COMPANY PRIORITIES
   - Technology investment areas companies prioritize
   - Business objectives driving tech hiring
   - Departmental budget allocation trends
   - Risk tolerance and innovation appetite

3. ROLE EVOLUTION
   - How traditional roles are changing
   - New role types emerging in the market
   - Skill combinations in high demand
   - Career pathway evolution

4. MARKET SHIFTS
   - Industry sectors with highest growth
   - Sectors experiencing contraction
   - Geographic hub development and decline
   - Economic factors affecting hiring

5. CANDIDATE EXPECTATIONS
   - Work-life balance priorities
   - Compensation and benefits evolution
   - Professional development expectations
   - Company culture and values alignment

Provide insights for optimal career positioning and market approach.`,

            competitive_landscape: `${basePrompt}
Analyze competitive positioning and differentiation opportunities:

1. COMPETITIVE LANDSCAPE
   - Profile of typical candidates in similar roles
   - Common background patterns and career paths
   - Standard skill combinations and experience levels
   - Market positioning strategies that work

2. DIFFERENTIATION OPPORTUNITIES
   - Underexplored skill combinations
   - Unique value propositions that stand out
   - Cross-industry experience advantages
   - Specialization niches with low competition

3. CAREER PATHWAY ANALYSIS
   - Traditional progression routes
   - Alternative advancement opportunities
   - Lateral move strategies for growth
   - Leadership transition patterns

4. MARKET POSITIONING STRATEGIES
   - Personal branding approaches that resonate
   - Professional network building strategies
   - Content and thought leadership opportunities
   - Speaking and community engagement value

5. COMPETITIVE ADVANTAGES
   - Skills that create compound value
   - Experience combinations that multiply worth
   - Industry knowledge that transfers premium
   - Technical depth vs breadth optimization

Focus on specific strategies for standing out in competitive markets.`
        };

        return analysisPrompts[analysisArea] || analysisPrompts.technology_trends;
    }

    /**
     * Analyze specific market intelligence area
     */
    async analyzeMarketArea(analysisArea, cvContext) {
        console.log(`📊 Analyzing ${this.analysisAreas[analysisArea].name}...`);
        
        try {
            const prompt = this.generateMarketAnalysisPrompt(analysisArea, cvContext);
            
            const response = await this.claudeClient.sendMessage(prompt);
            
            const analysis = {
                area: analysisArea,
                area_name: this.analysisAreas[analysisArea].name,
                focus_areas: this.analysisAreas[analysisArea].focus,
                weight: this.analysisAreas[analysisArea].weight,
                timeframe: this.analysisAreas[analysisArea].timeframe,
                timestamp: new Date().toISOString(),
                raw_analysis: response.content[0].text,
                token_usage: response.usage,
                conversation_id: response.conversation_id,
                cv_context_used: !!cvContext
            };

            // Extract structured insights
            analysis.structured_insights = this.extractStructuredInsights(analysis.raw_analysis, analysisArea);

            console.log(`✅ ${this.analysisAreas[analysisArea].name} analysis complete`);
            return analysis;

        } catch (error) {
            console.error(`❌ Market analysis failed for ${analysisArea}:`, error.message);
            throw new Error(`Market analysis failed: ${error.message}`);
        }
    }

    /**
     * Extract structured insights from analysis text
     */
    extractStructuredInsights(text, analysisArea) {
        const insights = {
            key_findings: [],
            recommendations: [],
            trends: [],
            scores: {},
            priorities: { high: [], medium: [], low: [] }
        };

        // Extract numbered or bulleted lists as key findings
        const findingsMatch = text.match(/(?:1\.|•|\-)\s*(.+?)(?=\n(?:2\.|•|\-|$))/gs);
        if (findingsMatch) {
            insights.key_findings = findingsMatch.slice(0, 10).map(finding => 
                finding.replace(/^(?:1\.|•|\-)\s*/, '').trim().substring(0, 200)
            );
        }

        // Extract recommendations
        const recSection = text.match(/RECOMMENDATION[S]?:(.+?)(?=\n[A-Z]{2,}:|$)/gis);
        if (recSection && recSection[0]) {
            const recs = recSection[0].split(/\n\s*[-•]/).slice(1, 8);
            insights.recommendations = recs.map(rec => rec.trim().substring(0, 150));
        }

        // Extract trend mentions
        const trendKeywords = ['trending', 'emerging', 'growing', 'declining', 'adoption', 'demand'];
        const trendSentences = text.split(/[.!?]/).filter(sentence => 
            trendKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
        );
        insights.trends = trendSentences.slice(0, 5).map(trend => trend.trim().substring(0, 150));

        return insights;
    }

    /**
     * Run comprehensive market intelligence analysis
     */
    async runComprehensiveAnalysis() {
        console.log('🎯 Starting comprehensive market intelligence analysis...');
        
        const startTime = Date.now();
        const cvContext = await this.loadCVContext();
        const analyses = {};
        const errors = {};

        // Analyze each market intelligence area
        for (const [areaKey, areaConfig] of Object.entries(this.analysisAreas)) {
            try {
                analyses[areaKey] = await this.analyzeMarketArea(areaKey, cvContext);
                
                // Add delay between requests to manage Claude usage
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } catch (error) {
                console.error(`❌ Failed to analyze ${areaConfig.name}:`, error.message);
                errors[areaKey] = {
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }

        const executionTime = Date.now() - startTime;

        // Generate comprehensive market intelligence report
        const report = {
            metadata: {
                analysis_id: `market-intelligence-${Date.now()}`,
                timestamp: new Date().toISOString(),
                execution_time_ms: executionTime,
                areas_analyzed: Object.keys(analyses),
                areas_failed: Object.keys(errors),
                success_rate: `${Object.keys(analyses).length}/${Object.keys(this.analysisAreas).length}`,
                cv_context_available: !!cvContext
            },
            candidate_context: cvContext,
            market_analyses: analyses,
            analysis_errors: errors,
            consolidated_intelligence: this.generateConsolidatedIntelligence(analyses),
            strategic_recommendations: this.generateStrategicRecommendations(analyses, cvContext),
            market_positioning: this.generateMarketPositioning(analyses, cvContext),
            action_plan: this.generateActionPlan(analyses, cvContext),
            performance_metrics: {
                total_tokens_used: Object.values(analyses).reduce((sum, a) => 
                    sum + (a.token_usage?.input_tokens || 0) + (a.token_usage?.output_tokens || 0), 0),
                average_response_time: executionTime / Object.keys(analyses).length,
                claude_conversations: Object.values(analyses).map(a => a.conversation_id)
            }
        };

        // Save comprehensive intelligence report
        const reportPath = path.join(this.outputDir, `market-intelligence-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        // Save executive summary
        const summaryPath = path.join(this.outputDir, 'market-summary.json');
        const executiveSummary = this.generateExecutiveSummary(report);
        await fs.writeFile(summaryPath, JSON.stringify(executiveSummary, null, 2), 'utf8');
        
        console.log(`📊 Market intelligence analysis complete! Report saved to: ${reportPath}`);
        console.log(`📋 Executive summary saved to: ${summaryPath}`);
        console.log(`⚡ Execution time: ${executionTime}ms`);
        console.log(`📈 Areas analyzed: ${Object.keys(analyses).length}/${Object.keys(this.analysisAreas).length}`);
        
        return report;
    }

    /**
     * Generate consolidated intelligence insights
     */
    generateConsolidatedIntelligence(analyses) {
        const intelligence = {
            market_health: 'unknown',
            top_opportunities: [],
            key_threats: [],
            skill_priorities: { immediate: [], medium_term: [], long_term: [] },
            industry_outlook: 'neutral',
            competitive_advantages: [],
            market_gaps: []
        };

        // Aggregate insights from all analyses
        for (const [area, analysis] of Object.entries(analyses)) {
            if (analysis.structured_insights) {
                intelligence.top_opportunities.push(...analysis.structured_insights.recommendations.slice(0, 2));
                intelligence.key_threats.push(...analysis.structured_insights.trends.filter(t => 
                    t.toLowerCase().includes('declining') || t.toLowerCase().includes('obsolete')
                ));
            }
        }

        return intelligence;
    }

    /**
     * Generate strategic recommendations
     */
    generateStrategicRecommendations(analyses, cvContext) {
        const recommendations = {
            immediate_actions: [],
            skill_development: [],
            career_positioning: [],
            market_approach: [],
            networking_strategy: [],
            learning_priorities: []
        };

        // Extract actionable recommendations from analyses
        for (const [area, analysis] of Object.entries(analyses)) {
            if (analysis.structured_insights && analysis.structured_insights.recommendations) {
                recommendations.immediate_actions.push(...analysis.structured_insights.recommendations.slice(0, 2));
            }
        }

        return recommendations;
    }

    /**
     * Generate market positioning analysis
     */
    generateMarketPositioning(analyses, cvContext) {
        return {
            current_position: cvContext ? {
                role_level: cvContext.experience_level,
                technology_alignment: 'analyzing...',
                market_demand_match: 'analyzing...',
                differentiation_score: 'calculating...'
            } : null,
            positioning_opportunities: [],
            competitive_advantages: [],
            positioning_risks: [],
            recommended_narrative: 'Market positioning analysis in progress...'
        };
    }

    /**
     * Generate actionable plan
     */
    generateActionPlan(analyses, cvContext) {
        return {
            next_30_days: ['Review market intelligence findings', 'Identify immediate skill gaps'],
            next_90_days: ['Begin high-priority skill development', 'Update professional profiles'],
            next_12_months: ['Complete strategic skill upgrades', 'Execute positioning strategy'],
            success_metrics: ['Skill acquisition milestones', 'Market positioning indicators'],
            review_schedule: 'Quarterly market intelligence updates recommended'
        };
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary(report) {
        return {
            metadata: {
                summary_date: new Date().toISOString(),
                based_on_analysis: report.metadata.analysis_id,
                areas_covered: report.metadata.areas_analyzed.length
            },
            key_insights: [
                'Market intelligence analysis completed',
                `${report.metadata.areas_analyzed.length} market areas analyzed`,
                `Analysis execution time: ${Math.round(report.metadata.execution_time_ms / 1000)}s`
            ],
            top_recommendations: report.strategic_recommendations?.immediate_actions?.slice(0, 3) || [],
            market_outlook: 'Technology market showing continued growth and evolution',
            next_review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
    }

    /**
     * Run focused analysis on specific areas
     */
    async runFocusedAnalysis(focusAreas = ['technology_trends', 'skill_demand']) {
        console.log(`🎯 Running focused market analysis on: ${focusAreas.join(', ')}`);
        
        const cvContext = await this.loadCVContext();
        const analyses = {};
        
        for (const area of focusAreas) {
            if (this.analysisAreas[area]) {
                try {
                    analyses[area] = await this.analyzeMarketArea(area, cvContext);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`❌ Failed to analyze ${area}:`, error.message);
                }
            }
        }
        
        return analyses;
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.claudeClient) {
            await this.claudeClient.close();
            this.claudeClient = null;
        }
        console.log('🧹 MarketIntelligenceEngine cleanup complete');
    }
}

/**
 * CLI interface
 */
async function main() {
    const args = process.argv.slice(2);
    
    const config = {
        headless: !args.includes('--visible'),
        includeGlobalTrends: !args.includes('--no-global'),
        includeSkillGaps: !args.includes('--no-skills'),
        includeCompensationData: !args.includes('--no-compensation')
    };

    const engine = new MarketIntelligenceEngine(config);
    
    try {
        await engine.initialize();
        
        let report;
        if (args.includes('--focused')) {
            const focusAreas = ['technology_trends', 'skill_demand'];
            report = await engine.runFocusedAnalysis(focusAreas);
        } else {
            report = await engine.runComprehensiveAnalysis();
        }

        console.log('\n📊 MARKET INTELLIGENCE SUMMARY:');
        if (report.metadata) {
            console.log(`📈 Areas Analyzed: ${report.metadata.areas_analyzed.length}/${Object.keys(engine.analysisAreas).length}`);
            console.log(`⏱️  Duration: ${report.metadata.execution_time_ms}ms`);
            console.log(`🎯 Success Rate: ${report.metadata.success_rate}`);
            console.log(`💬 Total Tokens: ${report.performance_metrics.total_tokens_used}`);
            
            if (report.metadata.areas_failed.length > 0) {
                console.log(`⚠️  Failed Areas: ${report.metadata.areas_failed.join(', ')}`);
            }
        }

    } catch (error) {
        console.error('❌ MarketIntelligenceEngine failed:', error.message);
        process.exit(1);
    } finally {
        await engine.cleanup();
    }
}

// Export for integration
module.exports = MarketIntelligenceEngine;

// CLI execution
if (require.main === module) {
    main().catch(console.error);
}