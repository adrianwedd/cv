#!/usr/bin/env node

/**
 * Enhancement Orchestrator
 * 
 * Coordinates the modular enhancement process, manages data flow,
 * and handles the overall enhancement pipeline logic.
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { ClaudeApiClient } = require('./claude-api-client');
const {
    ProfessionalSummaryEnhancer,
    SkillsEnhancer,
    ExperienceEnhancer,
    ProjectsEnhancer
} = require('./content-enhancers');

/**
 * Main Enhancement Orchestrator
 * Coordinates all enhancement modules and manages the overall process
 */
class EnhancementOrchestrator {
    constructor(config) {
        this.config = config;
        this.apiClient = new ClaudeApiClient(config);
        this.dataDir = path.join(process.cwd(), 'data');
        
        // Initialize enhancer modules
        this.enhancers = {
            professionalSummary: new ProfessionalSummaryEnhancer(this.apiClient, config),
            skills: new SkillsEnhancer(this.apiClient, config),
            experience: new ExperienceEnhancer(this.apiClient, config),
            projects: new ProjectsEnhancer(this.apiClient, config)
        };
        
        this.enhancementResults = {
            timestamp: new Date().toISOString(),
            enhancement_mode: config.ENHANCEMENT_MODE || 'comprehensive',
            creativity_level: config.CREATIVITY_LEVEL || 'balanced',
            activity_score: config.ACTIVITY_SCORE || 50,
            enhancements: {},
            token_usage: {},
            quality_metrics: {},
            strategic_insights: {}
        };
    }

    /**
     * Main enhancement pipeline orchestration
     */
    async orchestrateEnhancement() {
        console.log('🎭 **CV CONTENT ENHANCEMENT ORCHESTRATION INITIATED**');
        console.log(`🎨 Enhancement Mode: ${this.config.ENHANCEMENT_MODE || 'comprehensive'}`);
        console.log(`🎯 Creativity Level: ${this.config.CREATIVITY_LEVEL || 'balanced'}`);
        console.log(`📊 Activity Score: ${this.config.ACTIVITY_SCORE || 50}/100`);
        console.log('');

        try {
            // Load data sources
            console.log('📂 Loading data sources...');
            const cvData = await this.loadCVData();
            const activityMetrics = await this.loadActivityMetrics();
            const narrativeIntelligence = await this.loadNarrativeIntelligence();
            
            // Determine enhancement strategy
            const strategy = this.determineEnhancementStrategy(cvData, activityMetrics);
            console.log(`🎯 Enhancement strategy: ${strategy}`);
            
            // Execute enhancement pipeline based on strategy
            await this.executeEnhancementStrategy(strategy, cvData, activityMetrics, narrativeIntelligence);
            
            // Generate strategic insights
            await this.generateStrategicInsights(cvData, activityMetrics);
            
            // Calculate quality metrics
            this.calculateQualityMetrics();
            
            // Save results
            await this.saveEnhancementResults();
            
            // Display summary
            this.displayEnhancementSummary();
            
            return this.enhancementResults;
            
        } catch (error) {
            console.error('❌ Enhancement orchestration failed:', error.message);
            throw error;
        }
    }

    /**
     * Determine the optimal enhancement strategy based on available data and constraints
     */
    determineEnhancementStrategy(cvData, activityMetrics) {
        const mode = this.config.ENHANCEMENT_MODE || 'comprehensive';
        const budget = this.config.AI_BUDGET || 'sufficient';
        const activityScore = activityMetrics?.summary?.activity_score || this.config.ACTIVITY_SCORE || 50;
        
        // Budget-constrained strategies
        if (budget === 'insufficient') {
            return 'minimal';
        } else if (budget === 'limited') {
            return 'focused';
        }
        
        // Mode-based strategies
        switch (mode) {
            case 'emergency-update':
                return 'essential-only';
            case 'activity-only':
                return 'metrics-focused';
            case 'ai-only':
                return 'content-focused';
            case 'comprehensive':
            default:
                return activityScore > 70 ? 'comprehensive-deep' : 'comprehensive-standard';
        }
    }

    /**
     * Execute the determined enhancement strategy
     */
    async executeEnhancementStrategy(strategy, cvData, activityMetrics, narrativeIntelligence) {
        console.log('🚀 **EXECUTING ENHANCEMENT PIPELINE**');
        
        const strategyConfig = this.getStrategyConfiguration(strategy);
        
        // Execute enhancements based on strategy priorities
        for (const [section, config] of Object.entries(strategyConfig)) {
            if (config.enabled) {
                console.log(`\n${config.icon} Enhancing ${section}...`);
                
                try {
                    const enhancementResult = await this.enhancers[section].enhance(
                        cvData, 
                        activityMetrics, 
                        { ...config, narrativeIntelligence }
                    );
                    
                    this.enhancementResults.enhancements[section] = {
                        ...enhancementResult,
                        enhancement_applied: true,
                        tokens_used: this.apiClient.getTokenUsage().total - (this.lastTokenCount || 0),
                        timestamp: new Date().toISOString()
                    };
                    
                    this.lastTokenCount = this.apiClient.getTokenUsage().total;
                    
                    console.log(`✅ ${section} enhancement completed`);
                    
                } catch (error) {
                    console.warn(`⚠️ ${section} enhancement failed:`, error.message);
                    this.enhancementResults.enhancements[section] = {
                        enhancement_applied: false,
                        error: error.message,
                        fallback_used: true
                    };
                }
            } else {
                console.log(`⏭️ Skipping ${section} (strategy: ${strategy})`);
            }
        }
        
        // Record final token usage
        this.enhancementResults.token_usage = this.apiClient.getTokenUsage();
    }

    /**
     * Get configuration for each enhancement strategy
     */
    getStrategyConfiguration(strategy) {
        const strategies = {
            minimal: {
                professionalSummary: { enabled: true, icon: '📝', priority: 1 },
                skills: { enabled: false },
                experience: { enabled: false },
                projects: { enabled: false }
            },
            
            focused: {
                professionalSummary: { enabled: true, icon: '📝', priority: 1 },
                skills: { enabled: true, icon: '⚡', priority: 2 },
                experience: { enabled: false },
                projects: { enabled: false }
            },
            
            'essential-only': {
                professionalSummary: { enabled: true, icon: '📝', priority: 1 },
                skills: { enabled: true, icon: '⚡', priority: 2 },
                experience: { enabled: true, icon: '💼', priority: 3, maxItems: 1 },
                projects: { enabled: false }
            },
            
            'metrics-focused': {
                professionalSummary: { enabled: true, icon: '📝', priority: 1, focus: 'metrics' },
                skills: { enabled: true, icon: '⚡', priority: 2, focus: 'activity' },
                experience: { enabled: true, icon: '💼', priority: 3, focus: 'quantified' },
                projects: { enabled: true, icon: '🚀', priority: 4, focus: 'impact' }
            },
            
            'content-focused': {
                professionalSummary: { enabled: true, icon: '📝', priority: 1, creativity: 'high' },
                skills: { enabled: true, icon: '⚡', priority: 2, creativity: 'medium' },
                experience: { enabled: true, icon: '💼', priority: 3, creativity: 'high' },
                projects: { enabled: true, icon: '🚀', priority: 4, creativity: 'high' }
            },
            
            'comprehensive-standard': {
                professionalSummary: { enabled: true, icon: '📝', priority: 1 },
                skills: { enabled: true, icon: '⚡', priority: 2 },
                experience: { enabled: true, icon: '💼', priority: 3, maxItems: 3 },
                projects: { enabled: true, icon: '🚀', priority: 4, maxItems: 5 }
            },
            
            'comprehensive-deep': {
                professionalSummary: { enabled: true, icon: '📝', priority: 1, depth: 'deep' },
                skills: { enabled: true, icon: '⚡', priority: 2, depth: 'comprehensive' },
                experience: { enabled: true, icon: '💼', priority: 3, maxItems: 4, depth: 'detailed' },
                projects: { enabled: true, icon: '🚀', priority: 4, maxItems: 8, depth: 'comprehensive' }
            }
        };
        
        return strategies[strategy] || strategies['comprehensive-standard'];
    }

    /**
     * Generate strategic insights about the enhancement process
     */
    async generateStrategicInsights(cvData, activityMetrics) {
        console.log('\n🎯 Generating strategic insights...');
        
        try {
            const prompt = this.buildStrategicInsightsPrompt(cvData, activityMetrics);
            const messages = [{ role: 'user', content: prompt }];
            
            const response = await this.apiClient.makeRequest(messages, {
                max_tokens: 1000,
                temperature: 0.6
            });
            
            this.enhancementResults.strategic_insights = this.parseStrategicInsights(response);
            console.log('✅ Strategic insights generated');
            
        } catch (error) {
            console.warn('⚠️ Strategic insights generation failed:', error.message);
            this.enhancementResults.strategic_insights = {
                market_positioning: 'AI Engineering Specialist',
                career_trajectory: 'Advancing toward technical leadership',
                competitive_advantages: ['Technical depth', 'AI expertise', 'System architecture']
            };
        }
    }

    buildStrategicInsightsPrompt(cvData, activityMetrics) {
        const leadershipReadiness = this.assessLeadershipReadiness(activityMetrics);
        const marketDifferentiation = this.assessMarketDifferentiation(activityMetrics);
        
        return `<instructions>
            <persona expertise="executive_career_strategist" style="analytical">
            </persona>
            
            <task type="strategic_career_analysis">
                <context>
                    Analyzing a technical professional who ${leadershipReadiness}, 
                    with ${marketDifferentiation}. Their technical foundation positions 
                    them uniquely in the evolving AI leadership landscape.
                </context>
                
                <analysis_dimensions>
                    - Market positioning and competitive advantages
                    - Career trajectory and next-level opportunities
                    - Technical leadership readiness indicators
                    - Strategic recommendations for advancement
                </analysis_dimensions>
                
                <output_format>
                    {
                        "market_positioning": "Current market position summary",
                        "career_trajectory": "Projected career path",
                        "competitive_advantages": ["Key differentiators"],
                        "leadership_readiness": "Assessment of leadership capacity",
                        "strategic_recommendations": ["3-4 actionable recommendations"],
                        "target_opportunities": ["Ideal role types or companies"]
                    }
                </output_format>
            </task>
        </instructions>

        Activity Score: ${this.config.ACTIVITY_SCORE}/100
        Enhancement Results: ${JSON.stringify(Object.keys(this.enhancementResults.enhancements))}`;
    }

    assessLeadershipReadiness(activityMetrics) {
        const activity = activityMetrics?.summary?.activity_score || this.config.ACTIVITY_SCORE || 50;
        const repos = activityMetrics?.total_repos || 0;
        
        if (activity > 80 && repos > 20) return 'demonstrates senior technical leadership readiness';
        if (activity > 60 && repos > 10) return 'shows emerging leadership capabilities';
        return 'exhibits strong individual contributor expertise';
    }

    assessMarketDifferentiation(activityMetrics) {
        const languages = activityMetrics?.top_languages?.length || 0;
        const activity = activityMetrics?.summary?.activity_score || this.config.ACTIVITY_SCORE || 50;
        
        if (languages > 7 && activity > 70) return 'exceptional technical breadth and proven delivery';
        if (languages > 5 && activity > 50) return 'strong multi-domain expertise with consistent output';
        return 'focused technical expertise with reliable execution';
    }

    parseStrategicInsights(response) {
        try {
            const content = response.content?.[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return { analysis: content };
        } catch {
            return { analysis: response.content?.[0]?.text || 'Analysis unavailable' };
        }
    }

    /**
     * Calculate quality metrics for the enhancement process
     */
    calculateQualityMetrics() {
        const enhancements = this.enhancementResults.enhancements;
        const tokenUsage = this.enhancementResults.token_usage;
        
        const successfulEnhancements = Object.values(enhancements).filter(e => e.enhancement_applied).length;
        const totalEnhancements = Object.keys(enhancements).length;
        const successRate = totalEnhancements > 0 ? successfulEnhancements / totalEnhancements : 0;
        
        this.enhancementResults.quality_metrics = {
            enhancement_success_rate: Math.round(successRate * 100),
            total_sections_enhanced: successfulEnhancements,
            total_tokens_used: tokenUsage.total || 0,
            cost_efficiency: this.calculateCostEfficiency(tokenUsage),
            content_quality_score: this.assessContentQuality(enhancements),
            processing_time: Date.now() - new Date(this.enhancementResults.timestamp).getTime()
        };
    }

    calculateCostEfficiency(tokenUsage) {
        const totalTokens = tokenUsage.total || 0;
        const successfulSections = Object.values(this.enhancementResults.enhancements)
            .filter(e => e.enhancement_applied).length;
        
        if (successfulSections === 0) return 0;
        return Math.round(totalTokens / successfulSections);
    }

    assessContentQuality(enhancements) {
        let qualityScore = 0;
        let assessableEnhancements = 0;
        
        for (const [section, enhancement] of Object.entries(enhancements)) {
            if (enhancement.enhancement_applied) {
                assessableEnhancements++;
                
                // Quality heuristics based on enhancement content
                if (enhancement.enhanced || enhancement.enhanced_summary) qualityScore += 25;
                if (enhancement.key_differentiators || enhancement.enhanced_achievements) qualityScore += 15;
                if (enhancement.technical_highlights || enhancement.technical_innovation) qualityScore += 10;
            }
        }
        
        return assessableEnhancements > 0 ? Math.round(qualityScore / assessableEnhancements) : 0;
    }

    /**
     * Data loading methods
     */
    async loadCVData() {
        try {
            const cvPath = path.join(this.dataDir, 'base-cv.json');
            const content = await fs.readFile(cvPath, 'utf8');
            return JSON.parse(content);
        } catch {
            console.warn('⚠️ Base CV data not found, using defaults');
            return this.getDefaultCVData();
        }
    }

    async loadActivityMetrics() {
        try {
            const summaryPath = path.join(this.dataDir, 'activity-summary.json');
            const content = await fs.readFile(summaryPath, 'utf8');
            return JSON.parse(content);
        } catch {
            console.warn('⚠️ Activity metrics not found');
            return { summary: { activity_score: this.config.ACTIVITY_SCORE || 50 } };
        }
    }

    async loadNarrativeIntelligence() {
        try {
            const narrativesPath = path.join(this.dataDir, 'narratives');
            const files = await fs.readdir(narrativesPath);
            const latestFile = files
                .filter(f => f.includes('professional-narratives'))
                .sort()
                .reverse()[0];
            
            if (latestFile) {
                const content = await fs.readFile(path.join(narrativesPath, latestFile), 'utf8');
                return JSON.parse(content);
            }
        } catch {
            console.log('💭 No narrative intelligence available');
        }
        
        return {};
    }

    /**
     * Save enhancement results
     */
    async saveEnhancementResults() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const resultsPath = path.join(this.dataDir, `ai-enhancement-${timestamp}.json`);
            
            await fs.writeFile(resultsPath, JSON.stringify(this.enhancementResults, null, 2), 'utf8');
            
            // Also save as current enhancements
            const currentPath = path.join(this.dataDir, 'ai-enhancements.json');
            await fs.writeFile(currentPath, JSON.stringify(this.enhancementResults, null, 2), 'utf8');
            
            console.log(`💾 Enhancement results saved: ${resultsPath}`);
        } catch (error) {
            console.error('❌ Failed to save enhancement results:', error.message);
        }
    }

    /**
     * Display enhancement summary
     */
    displayEnhancementSummary() {
        const metrics = this.enhancementResults.quality_metrics;
        const usage = this.enhancementResults.token_usage;
        
        console.log('\n🎭 **ENHANCEMENT ORCHESTRATION SUMMARY**');
        console.log('========================================');
        console.log(`✅ Success Rate: ${metrics.enhancement_success_rate}%`);
        console.log(`📝 Sections Enhanced: ${metrics.total_sections_enhanced}`);
        console.log(`🎯 Content Quality: ${metrics.content_quality_score}/100`);
        console.log(`🔧 Token Usage: ${usage.total} (${usage.input} input + ${usage.output} output)`);
        console.log(`⚡ Processing Time: ${Math.round(metrics.processing_time / 1000)}s`);
        console.log(`💰 Cost Efficiency: ${metrics.cost_efficiency} tokens/section`);
        console.log('');
    }

    getDefaultCVData() {
        return {
            professional_summary: 'AI Engineer and Software Architect',
            experience: [],
            skills: [],
            projects: []
        };
    }
}

module.exports = { EnhancementOrchestrator };