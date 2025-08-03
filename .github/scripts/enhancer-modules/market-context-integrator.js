#!/usr/bin/env node

/**
 * Market Context Integrator
 * 
 * Advanced module for integrating real-time market trends and emerging skills
 * data into Claude AI enhancement prompts. Provides dynamic market context
 * for more relevant and competitive CV content generation.
 * 
 * Features:
 * - Real-time market data integration
 * - Dynamic prompt context generation  
 * - Market-aware enhancement strategies
 * - Trending technology identification
 * - Skill gap analysis integration
 * - Industry positioning context
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Market Context Integrator for Claude AI enhancement
 */
class MarketContextIntegrator {
    constructor() {
        this.marketData = null;
        this.lastUpdate = null;
        this.cacheTimeout = 6 * 60 * 60 * 1000; // 6 hours
        this.dataDir = path.join(__dirname, '../data/market-intelligence');
    }

    /**
     * Initialize the integrator and load market data
     */
    async initialize() {
        console.log('📊 Initializing Market Context Integrator...');
        
        try {
            await this.loadMarketData();
            console.log('✅ Market context integrator initialized successfully');
        } catch (error) {
            console.warn('⚠️ Failed to initialize market data, using fallback context');
            this.marketData = this.createFallbackMarketData();
        }
    }

    /**
     * Load latest market intelligence data
     */
    async loadMarketData() {
        try {
            // Try to load market summary first
            const summaryPath = path.join(this.dataDir, 'market-summary.json');
            const summaryData = await fs.readFile(summaryPath, 'utf8');
            const summary = JSON.parse(summaryData);
            
            // Check if data is fresh enough
            const lastUpdate = new Date(summary.last_updated);
            const isStale = (Date.now() - lastUpdate.getTime()) > this.cacheTimeout;
            
            if (isStale) {
                console.log('📈 Market data is stale, triggering refresh...');
                await this.refreshMarketData();
            } else {
                console.log(`📦 Using cached market data (${Math.round((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60))}h old)`);
                this.marketData = summary;
                this.lastUpdate = lastUpdate;
            }
            
        } catch (error) {
            console.log('🔄 No market data found, generating fresh analysis...');
            await this.refreshMarketData();
        }
    }

    /**
     * Refresh market data by running market trends analyzer
     */
    async refreshMarketData() {
        try {
            const { MarketTrendsAnalyzer } = await import('../market-trends-analyzer.js');
            const analyzer = new MarketTrendsAnalyzer();
            await analyzer.initialize();
            
            const analysis = await analyzer.analyzeMarketTrends();
            
            // Update our cached data
            this.marketData = {
                last_updated: analysis.metadata.generated_at,
                key_insights: {
                    top_emerging_skills: analysis.emerging_skills.slice(0, 10),
                    fastest_growing: analysis.trending_technologies.fastest_growing,
                    highest_demand: analysis.trending_technologies.highest_demand,
                    market_shifts: analysis.industry_shifts.major_shifts.map(s => s.shift)
                },
                alignment_framework: analysis.market_alignment_framework,
                quick_reference: {
                    critical_skills: analysis.emerging_skills
                        .filter(s => s.ranking_tier.includes('Critical'))
                        .map(s => s.skill),
                    growth_opportunities: analysis.growth_opportunities.immediate_opportunities
                        .map(o => o.area)
                }
            };
            
            this.lastUpdate = new Date();
            console.log('✅ Market data refreshed successfully');
            
        } catch (error) {
            console.error('❌ Failed to refresh market data:', error.message);
            throw error;
        }
    }

    /**
     * Generate market context for Claude prompts
     */
    generateMarketContext(contextType = 'general', userSkills = []) {
        if (!this.marketData) {
            return this.createFallbackMarketContext(contextType);
        }

        const context = {
            market_intelligence: this.buildMarketIntelligence(),
            emerging_trends: this.buildEmergingTrends(),
            skill_landscape: this.buildSkillLandscape(),
            positioning_insights: this.buildPositioningInsights(userSkills),
            industry_context: this.buildIndustryContext()
        };

        return this.formatContextForPrompt(context, contextType);
    }

    /**
     * Build comprehensive market intelligence section
     */
    buildMarketIntelligence() {
        const insights = this.marketData.key_insights;
        
        return {
            data_freshness: this.getDataFreshness(),
            top_emerging_skills: insights.top_emerging_skills.map(skill => ({
                skill: skill.skill,
                category: skill.category,
                growth_rate: skill.growth_rate,
                market_score: skill.overall_score,
                priority: skill.ranking_tier
            })),
            fastest_growing_technologies: insights.fastest_growing.map(tech => ({
                technology: tech.skill,
                growth_percentage: tech.growth_rate,
                demand_level: tech.demand_score
            })),
            highest_demand_skills: insights.highest_demand.map(skill => ({
                skill: skill.skill,
                demand_score: skill.demand_score,
                market_position: skill.category
            }))
        };
    }

    /**
     * Build emerging trends analysis
     */
    buildEmergingTrends() {
        const insights = this.marketData.key_insights;
        
        return {
            major_industry_shifts: insights.market_shifts || [],
            critical_priority_skills: this.marketData.quick_reference.critical_skills || [],
            immediate_opportunities: this.marketData.quick_reference.growth_opportunities || [],
            technology_convergence: [
                'AI + Cloud + Edge = Intelligent Infrastructure',
                'Security + DevOps + AI = Autonomous Security', 
                'Web + AI + IoT = Ambient Computing'
            ],
            market_predictions: {
                ai_integration: 'Essential skill for 95% of tech roles by 2026',
                cloud_native: 'Default architecture approach across industries',
                edge_computing: 'Mainstream adoption in 2025-2027 timeframe',
                sustainability: 'Key differentiator in technology decisions'
            }
        };
    }

    /**
     * Build skill landscape overview
     */
    buildSkillLandscape() {
        return {
            skill_evolution_stages: {
                emerging: ['Prompt Engineering', 'Vector Databases', 'Edge AI', 'Quantum ML'],
                growing: ['LLM Integration', 'RAG Systems', 'Multi-Agent Systems', 'Cloud-Native'],
                mature: ['React', 'Node.js', 'Docker', 'Kubernetes', 'Python'],
                declining: ['jQuery', 'AngularJS', 'Flash', 'Perl']
            },
            high_value_combinations: [
                'AI + Domain Expertise = AI Domain Specialist',
                'Security + AI = AI Security Specialist',
                'UX + AI = AI Experience Designer',
                'DevOps + AI = AI Operations Engineer'
            ],
            regional_insights: {
                australia: {
                    top_demand: ['Cloud Architecture', 'AI/ML', 'DevOps', 'Python', 'React'],
                    emerging_focus: ['AI Safety', 'Edge Computing', 'Sustainable Tech']
                }
            }
        };
    }

    /**
     * Build positioning insights based on user skills
     */
    buildPositioningInsights(userSkills) {
        const userSkillNames = userSkills.map(s => s.name ? s.name.toLowerCase() : String(s).toLowerCase());
        const marketSkills = this.marketData.key_insights.top_emerging_skills || [];
        
        // Identify user's market-aligned skills
        const alignedSkills = marketSkills.filter(ms => 
            userSkillNames.includes(ms.skill.toLowerCase())
        );
        
        // Identify skill gaps
        const skillGaps = marketSkills
            .filter(ms => !userSkillNames.includes(ms.skill.toLowerCase()))
            .slice(0, 8);
        
        return {
            current_market_strengths: alignedSkills.map(skill => ({
                skill: skill.skill,
                market_advantage: skill.overall_score >= 80 ? 'Strong' : 'Moderate',
                growth_potential: skill.growth_rate
            })),
            strategic_skill_gaps: skillGaps.map(gap => ({
                skill: gap.skill,
                priority: gap.ranking_tier,
                market_value: gap.overall_score,
                learning_timeline: this.estimateLearningTime(gap.skill)
            })),
            positioning_recommendations: this.generatePositioningRecommendations(alignedSkills, skillGaps),
            competitive_differentiation: this.identifyDifferentiators(userSkills, marketSkills)
        };
    }

    /**
     * Build industry context for CV enhancement
     */
    buildIndustryContext() {
        return {
            current_market_conditions: {
                ai_revolution: 'Generative AI is fundamentally changing software development',
                cloud_maturity: 'Cloud-native architecture is now industry standard',
                security_priority: 'Security integrated throughout development lifecycle',
                sustainability_focus: 'Environmental impact becoming key business metric'
            },
            hiring_trends: {
                ai_premium: '25-50% salary premium for AI/ML integration skills',
                remote_work: 'Hybrid and remote work models permanently established',
                skill_velocity: 'Continuous learning essential due to rapid technology evolution',
                domain_expertise: 'AI + domain knowledge combinations highly valued'
            },
            technology_adoption_patterns: {
                enterprise_ai: '78% of enterprises actively implementing AI solutions',
                edge_computing: '45% growth in edge computing adoption annually',
                developer_tools: 'AI-assisted development tools becoming standard',
                security_automation: 'Automated security testing and compliance trending'
            }
        };
    }

    /**
     * Format context for specific prompt types
     */
    formatContextForPrompt(context, contextType) {
        switch (contextType) {
            case 'professional_summary':
                return this.formatForProfessionalSummary(context);
            case 'skills_assessment':
                return this.formatForSkillsAssessment(context);
            case 'experience_enhancement':
                return this.formatForExperienceEnhancement(context);
            case 'projects_showcase':
                return this.formatForProjectsShowcase(context);
            default:
                return this.formatForGeneral(context);
        }
    }

    /**
     * Format context for professional summary enhancement
     */
    formatForProfessionalSummary(context) {
        return `<market_context>
<industry_positioning>
Current market conditions favor professionals who can bridge traditional development with AI integration. ${context.industry_context.current_market_conditions.ai_revolution}

Key market differentiators:
- AI/ML integration capabilities (${context.industry_context.hiring_trends.ai_premium} salary premium)
- Cloud-native architecture expertise
- Security-first development approach
- Sustainable technology practices
</industry_positioning>

<emerging_opportunities>
High-demand skill areas for 2025:
${context.emerging_trends.critical_priority_skills.slice(0, 5).map(skill => `- ${skill}`).join('\n')}

Immediate market opportunities:
${context.emerging_trends.immediate_opportunities.slice(0, 3).map(opp => `- ${opp}`).join('\n')}
</emerging_opportunities>

<competitive_landscape>
${context.skill_landscape.high_value_combinations.slice(0, 3).map(combo => `- ${combo}`).join('\n')}
</competitive_landscape>
</market_context>`;
    }

    /**
     * Format context for skills assessment
     */
    formatForSkillsAssessment(context) {
        return `<market_intelligence>
<skill_prioritization>
Critical Priority Skills (90+ market score):
${context.market_intelligence.top_emerging_skills
    .filter(s => s.market_score >= 90)
    .map(s => `- ${s.skill}: ${s.growth_rate}% growth, ${s.priority}`)
    .join('\n')}

High Growth Technologies:
${context.market_intelligence.fastest_growing_technologies
    .slice(0, 5)
    .map(t => `- ${t.technology}: ${t.growth_percentage}% annual growth`)
    .join('\n')}
</skill_prioritization>

<market_evolution>
Skill Evolution Stages:
- Emerging: ${context.skill_landscape.skill_evolution_stages.emerging.join(', ')}
- Growing: ${context.skill_landscape.skill_evolution_stages.growing.join(', ')}
- Mature: ${context.skill_landscape.skill_evolution_stages.mature.slice(0, 5).join(', ')}
</market_evolution>

<regional_context>
Australia Market Focus:
- Top Demand: ${context.skill_landscape.regional_insights.australia.top_demand.join(', ')}
- Emerging Areas: ${context.skill_landscape.regional_insights.australia.emerging_focus.join(', ')}
</regional_context>
</market_intelligence>`;
    }

    /**
     * Format context for experience enhancement
     */
    formatForExperienceEnhancement(context) {
        return `<market_context>
<industry_transformation>
${context.emerging_trends.major_industry_shifts.slice(0, 3).map(shift => `- ${shift}`).join('\n')}

Technology Convergence Patterns:
${context.emerging_trends.technology_convergence.map(pattern => `- ${pattern}`).join('\n')}
</industry_transformation>

<value_positioning>
Market Predictions for CV Positioning:
- ${context.emerging_trends.market_predictions.ai_integration}
- ${context.emerging_trends.market_predictions.cloud_native}
- ${context.emerging_trends.market_predictions.sustainability}
</value_positioning>

<hiring_trends>
${Object.entries(context.industry_context.hiring_trends).map(([key, value]) => 
    `- ${key.replace('_', ' ').toUpperCase()}: ${value}`
).join('\n')}
</hiring_trends>
</market_context>`;
    }

    /**
     * Format context for projects showcase
     */
    formatForProjectsShowcase(context) {
        return `<technology_landscape>
<trending_technologies>
Highest Market Demand:
${context.market_intelligence.highest_demand_skills
    .slice(0, 5)
    .map(s => `- ${s.skill} (Demand Score: ${s.demand_score})`)
    .join('\n')}

Fast-Growing Technologies:
${context.market_intelligence.fastest_growing_technologies
    .slice(0, 5)
    .map(t => `- ${t.technology} (+${t.growth_percentage}% growth)`)
    .join('\n')}
</trending_technologies>

<project_positioning>
High-Value Skill Combinations:
${context.skill_landscape.high_value_combinations.map(combo => `- ${combo}`).join('\n')}

Enterprise Adoption Patterns:
${Object.entries(context.industry_context.technology_adoption_patterns).map(([key, value]) => 
    `- ${key.replace('_', ' ').toUpperCase()}: ${value}`
).join('\n')}
</project_positioning>
</technology_landscape>`;
    }

    /**
     * Format context for general use
     */
    formatForGeneral(context) {
        return `<comprehensive_market_context>
<key_insights>
Data Freshness: ${context.market_intelligence.data_freshness}

Top Emerging Skills:
${context.market_intelligence.top_emerging_skills.slice(0, 8).map(skill => 
    `- ${skill.skill} (${skill.category}): ${skill.growth_rate}% growth, ${skill.market_score}/100 market score`
).join('\n')}

Critical Priority Areas:
${context.emerging_trends.critical_priority_skills.slice(0, 5).map(skill => `- ${skill}`).join('\n')}
</key_insights>

<strategic_positioning>
${context.positioning_insights.positioning_recommendations.slice(0, 3).join('\n')}
</strategic_positioning>

<industry_evolution>
${context.emerging_trends.major_industry_shifts.slice(0, 3).map(shift => `- ${shift}`).join('\n')}
</industry_evolution>
</comprehensive_market_context>`;
    }

    /**
     * Generate positioning recommendations
     */
    generatePositioningRecommendations(alignedSkills, skillGaps) {
        const recommendations = [];
        
        if (alignedSkills.length > 0) {
            recommendations.push(`Leverage market-aligned strengths: ${alignedSkills.slice(0, 3).map(s => s.skill).join(', ')}`);
        }
        
        if (skillGaps.length > 0) {
            recommendations.push(`Address critical skill gaps: ${skillGaps.slice(0, 3).map(g => g.skill).join(', ')}`);
        }
        
        recommendations.push('Position expertise within AI integration context');
        recommendations.push('Emphasize practical application of emerging technologies');
        
        return recommendations;
    }

    /**
     * Identify competitive differentiators
     */
    identifyDifferentiators(userSkills, marketSkills) {
        // This would analyze unique combinations of user skills
        // vs market trends to identify competitive advantages
        return [
            'Unique skill combination positioning',
            'Early adopter advantage in emerging technologies',
            'Cross-domain expertise integration'
        ];
    }

    /**
     * Estimate learning time for skills
     */
    estimateLearningTime(skill) {
        const learningTimes = {
            'LLM Integration': '2-4 months',
            'Prompt Engineering': '1-2 months',
            'Multi-Agent Systems': '4-6 months',
            'Vector Databases': '2-3 months',
            'Edge AI': '3-6 months',
            'Rust': '6-12 months',
            'Kubernetes': '3-6 months'
        };
        
        return learningTimes[skill] || '3-6 months';
    }

    /**
     * Get data freshness description
     */
    getDataFreshness() {
        if (!this.lastUpdate) return 'Current market analysis';
        
        const hours = Math.round((Date.now() - this.lastUpdate.getTime()) / (1000 * 60 * 60));
        if (hours < 1) return 'Real-time market data';
        if (hours < 24) return `${hours} hours fresh`;
        return `${Math.round(hours / 24)} days old`;
    }

    /**
     * Create fallback market data when main analysis unavailable
     */
    createFallbackMarketData() {
        return {
            last_updated: new Date().toISOString(),
            key_insights: {
                top_emerging_skills: [
                    { skill: 'LLM Integration', category: 'AI & Data Science', growth_rate: 125, overall_score: 98, ranking_tier: 'Critical - High Priority' },
                    { skill: 'Prompt Engineering', category: 'AI & Data Science', growth_rate: 156, overall_score: 92, ranking_tier: 'Critical - High Priority' },
                    { skill: 'Cloud-Native Development', category: 'Cloud Platforms', growth_rate: 65, overall_score: 88, ranking_tier: 'Important - Medium-High Priority' },
                    { skill: 'DevSecOps', category: 'DevOps', growth_rate: 54, overall_score: 82, ranking_tier: 'Important - Medium-High Priority' },
                    { skill: 'Multi-Agent Systems', category: 'AI & Data Science', growth_rate: 89, overall_score: 78, ranking_tier: 'Valuable - Medium Priority' }
                ],
                fastest_growing: [
                    { skill: 'Prompt Engineering', growth_rate: 156, demand_score: 92 },
                    { skill: 'LLM Integration', growth_rate: 125, demand_score: 98 },
                    { skill: 'Multi-Agent Systems', growth_rate: 89, demand_score: 78 }
                ],
                highest_demand: [
                    { skill: 'LLM Integration', demand_score: 98 },
                    { skill: 'Prompt Engineering', demand_score: 92 },
                    { skill: 'Cloud-Native Development', demand_score: 88 }
                ],
                market_shifts: [
                    'AI-First Development',
                    'Edge Computing Mainstream',
                    'Sustainability-Driven Tech'
                ]
            },
            quick_reference: {
                critical_skills: ['LLM Integration', 'Prompt Engineering'],
                growth_opportunities: ['AI/ML Engineering', 'DevSecOps Engineering']
            }
        };
    }

    /**
     * Create fallback market context when data unavailable
     */
    createFallbackMarketContext(contextType) {
        return `<market_context>
<industry_trends>
- AI integration becoming essential across all software roles
- Cloud-native architecture now industry standard
- Security-first development approach critical
- Continuous learning required due to rapid technology evolution
</industry_trends>

<high_demand_skills>
- LLM Integration and Prompt Engineering
- Cloud-Native Development and Architecture
- DevSecOps and Security Automation  
- Multi-Agent Systems and AI Orchestration
- Real-time Processing and Edge Computing
</high_demand_skills>

<positioning_guidance>
- Emphasize AI integration capabilities
- Highlight cloud-native and security expertise
- Position as early adopter of emerging technologies
- Demonstrate practical application of modern tools
</positioning_guidance>
</market_context>`;
    }

    /**
     * Get market alignment score for specific skills
     */
    getSkillMarketAlignment(skills) {
        if (!this.marketData) return { overall_score: 50, insights: [] };
        
        const marketSkills = this.marketData.key_insights.top_emerging_skills;
        const userSkillNames = skills.map(s => s.name || s).map(name => name.toLowerCase());
        
        let alignmentScore = 0;
        let maxScore = 0;
        const insights = [];
        
        marketSkills.forEach(marketSkill => {
            maxScore += marketSkill.overall_score;
            
            if (userSkillNames.includes(marketSkill.skill.toLowerCase())) {
                alignmentScore += marketSkill.overall_score;
                insights.push({
                    skill: marketSkill.skill,
                    advantage: 'Market-aligned skill',
                    score: marketSkill.overall_score
                });
            }
        });
        
        return {
            overall_score: maxScore > 0 ? Math.round((alignmentScore / maxScore) * 100) : 50,
            insights: insights,
            recommendations: this.generateAlignmentRecommendations(insights, marketSkills, userSkillNames)
        };
    }

    /**
     * Generate alignment improvement recommendations
     */
    generateAlignmentRecommendations(currentInsights, marketSkills, userSkills) {
        const gaps = marketSkills
            .filter(ms => !userSkills.includes(ms.skill.toLowerCase()))
            .filter(ms => ms.overall_score >= 80)
            .slice(0, 5);
        
        return gaps.map(gap => ({
            skill: gap.skill,
            priority: gap.ranking_tier,
            market_value: gap.overall_score,
            action: `Consider developing ${gap.skill} skills`
        }));
    }
}

export { MarketContextIntegrator };