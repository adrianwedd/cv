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

import { promises as fs } from 'fs';
import path from 'path';
import { 
    ClaudeApiClient,
    QuotaExhaustedError,
    RateLimitExceededError,
    AuthenticationError,
    ServerError,
    NetworkError
} from './claude-api-client.js';
import {
    ProfessionalSummaryEnhancer,
    SkillsEnhancer,
    ExperienceEnhancer,
    ProjectsEnhancer
} from './content-enhancers.js';
import ContentGuardian from '../content-guardian.js';

/**
 * Main Enhancement Orchestrator
 * Coordinates all enhancement modules and manages the overall process
 */
class EnhancementOrchestrator {
    constructor(config) {
        this.config = config;
        
        // Use OAuth-first authentication manager if available, fallback to direct API client
        if (config.authManager) {
            this.authManager = config.authManager;
            this.apiClient = config.authManager; // Auth manager implements the same interface
        } else {
            this.apiClient = new ClaudeApiClient(config);
        }
        
        this.dataDir = path.join(process.cwd(), 'data');
        
        // Initialize enhancer modules with OAuth-aware client
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
            strategic_insights: {},
            fallback_mode: false,
            error_recovery: []
        };
        
        this.fallbackMode = false;
        this.errorRecoveryAttempts = [];
        
        // Initialize content guardian for protection
        this.contentGuardian = new ContentGuardian();
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
            // Pre-enhancement content validation
            console.log('🛡️ Validating content integrity...');
            const preValidation = await this.contentGuardian.validateContent();
            if (!preValidation.valid) {
                console.warn('⚠️ Content integrity issues detected - proceeding with caution');
                console.warn(`Violations: ${preValidation.violations.length}`);
            }
            
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
            
            // Record final results
            this.enhancementResults.fallback_mode = this.fallbackMode;
            this.enhancementResults.error_recovery = this.errorRecoveryAttempts;
            
            return this.enhancementResults;
            
        } catch (error) {
            return await this.handleEnhancementError(error);
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
     * Enhanced error handling for AI enhancement failures
     */
    async handleEnhancementError(error) {
        console.error('❌ Enhancement error encountered:', error.message);
        
        const errorType = error.constructor.name;
        const recoveryAttempt = {
            timestamp: new Date().toISOString(),
            error_type: errorType,
            message: error.message,
            recovery_action: null,
            success: false
        };

        // Handle specific error types with appropriate recovery strategies
        if (error instanceof QuotaExhaustedError) {
            recoveryAttempt.recovery_action = 'fallback_to_activity_only';
            console.log('🔄 API quota exhausted - switching to activity-only mode');
            this.fallbackMode = true;
            
        } else if (error instanceof RateLimitExceededError) {
            recoveryAttempt.recovery_action = 'retry_with_backoff';
            console.log('⏰ Rate limit exceeded - implementing backoff strategy');
            
        } else if (error instanceof AuthenticationError) {
            recoveryAttempt.recovery_action = 'fallback_to_activity_only';
            console.log('🔐 Authentication failed - switching to activity-only mode');
            this.fallbackMode = true;
            
        } else if (error instanceof ServerError || error instanceof NetworkError) {
            recoveryAttempt.recovery_action = 'retry_with_reduced_scope';
            console.log('🔧 Server/Network error - retrying with reduced scope');
            
        } else {
            recoveryAttempt.recovery_action = 'fallback_to_activity_only';
            console.log('❓ Unknown error - falling back to activity-only mode');
            this.fallbackMode = true;
        }

        this.errorRecoveryAttempts.push(recoveryAttempt);

        // Attempt recovery
        try {
            if (this.fallbackMode) {
                const result = await this.executeActivityOnlyMode();
                recoveryAttempt.success = true;
                console.log('✅ Successfully recovered using activity-only mode');
                return result;
            } else {
                // For retryable errors, attempt with reduced configuration
                const result = await this.executeReducedScopeEnhancement();
                recoveryAttempt.success = true;
                console.log('✅ Successfully recovered with reduced scope');
                return result;
            }
        } catch (recoveryError) {
            console.error('❌ Recovery attempt failed:', recoveryError.message);
            
            // Final fallback - return basic activity analysis
            console.log('🔄 Final fallback: returning basic activity analysis');
            return await this.executeMinimalMode();
        }
    }

    /**
     * Execute activity-only mode when AI enhancement fails
     */
    async executeActivityOnlyMode() {
        console.log('🔄 **ACTIVITY-ONLY MODE INITIATED**');
        
        try {
            // Load available data
            const cvData = await this.loadCVData();
            const activityMetrics = await this.loadActivityMetrics();
            
            // Generate basic enhancements using activity data only
            this.enhancementResults.enhancement_mode = 'activity-only';
            this.enhancementResults.fallback_mode = true;
            
            // Update CV with activity-based insights
            if (activityMetrics && activityMetrics.summary) {
                this.enhancementResults.enhancements.activity_summary = {
                    source: 'github_analysis',
                    content: this.generateActivityBasedSummary(activityMetrics),
                    confidence: 'high',
                    enhancement_type: 'data-driven'
                };
            }
            
            // Update skills based on detected technologies
            if (activityMetrics && activityMetrics.repository_breakdown) {
                this.enhancementResults.enhancements.detected_skills = {
                    source: 'repository_analysis',
                    content: this.extractSkillsFromActivity(activityMetrics),
                    confidence: 'high',
                    enhancement_type: 'data-driven'
                };
            }
            
            // Save and return results
            await this.saveEnhancementResults();
            
            console.log('✅ Activity-only mode completed successfully');
            return this.enhancementResults;
            
        } catch (error) {
            console.error('❌ Activity-only mode failed:', error.message);
            return await this.executeMinimalMode();
        }
    }

    /**
     * Execute reduced scope enhancement for retryable errors
     */
    async executeReducedScopeEnhancement() {
        console.log('🎯 **REDUCED SCOPE ENHANCEMENT INITIATED**');
        
        // Load data
        const cvData = await this.loadCVData();
        const activityMetrics = await this.loadActivityMetrics();
        
        // Only enhance the most critical section (professional summary)
        this.enhancementResults.enhancement_mode = 'reduced-scope';
        
        try {
            const summaryEnhancer = this.enhancers.professionalSummary;
            const enhancedSummary = await summaryEnhancer.enhance(
                cvData.professional_summary || '',
                { activityMetrics, scope: 'minimal' }
            );
            
            this.enhancementResults.enhancements.professional_summary = enhancedSummary;
            
            await this.saveEnhancementResults();
            console.log('✅ Reduced scope enhancement completed');
            
            return this.enhancementResults;
            
        } catch (error) {
            console.warn('⚠️ Reduced scope enhancement failed, falling back');
            return await this.executeActivityOnlyMode();
        }
    }

    /**
     * Execute minimal mode as final fallback
     */
    async executeMinimalMode() {
        console.log('⚡ **MINIMAL MODE - FINAL FALLBACK**');
        
        this.enhancementResults.enhancement_mode = 'minimal-fallback';
        this.enhancementResults.fallback_mode = true;
        
        // Return basic structure with timestamp
        this.enhancementResults.enhancements.status = {
            source: 'system',
            content: 'Enhancement completed in minimal mode due to API limitations',
            timestamp: new Date().toISOString(),
            enhancement_type: 'system-generated'
        };
        
        await this.saveEnhancementResults();
        
        console.log('⚡ Minimal mode completed - basic functionality maintained');
        return this.enhancementResults;
    }

    /**
     * Generate activity-based professional summary
     */
    generateActivityBasedSummary(activityMetrics) {
        const summary = activityMetrics.summary || {};
        const recentActivity = summary.activity_score || 0;
        const languages = summary.top_languages || [];
        const totalCommits = summary.total_commits || 0;
        
        let activitySummary = 'Software professional with demonstrated GitHub activity';
        
        if (totalCommits > 100) {
            activitySummary += ` showing ${totalCommits} commits across multiple projects`;
        }
        
        if (languages.length > 0) {
            const topLanguages = languages.slice(0, 3).map(l => l.name).join(', ');
            activitySummary += `. Primary technologies include ${topLanguages}`;
        }
        
        if (recentActivity > 70) {
            activitySummary += '. Recent high activity indicates active development and continuous learning.';
        } else if (recentActivity > 30) {
            activitySummary += '. Consistent development activity with regular contributions.';
        }
        
        return activitySummary;
    }

    /**
     * Extract skills from activity data
     */
    extractSkillsFromActivity(activityMetrics) {
        const skills = [];
        
        if (activityMetrics.summary && activityMetrics.summary.top_languages) {
            activityMetrics.summary.top_languages.forEach(lang => {
                skills.push({
                    name: lang.name,
                    category: 'Programming Languages',
                    level: lang.percentage > 20 ? 'Advanced' : lang.percentage > 10 ? 'Intermediate' : 'Beginner',
                    source: 'github_analysis',
                    evidence: `${lang.percentage}% of recent code`
                });
            });
        }
        
        return skills;
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
            
            // Post-enhancement content validation
            console.log('🛡️ Validating enhanced content...');
            const postValidation = await this.contentGuardian.validateContent();
            if (!postValidation.valid) {
                console.error('🚨 CONTENT INTEGRITY VIOLATIONS DETECTED AFTER ENHANCEMENT!');
                console.error(`Found ${postValidation.violations.length} violations:`);
                postValidation.violations.forEach((v, i) => {
                    console.error(`  ${i + 1}. ${v.type}: ${v.claim || v.match}`);
                });
                
                // Add validation results to enhancement results
                this.enhancementResults.content_validation = {
                    valid: false,
                    violations: postValidation.violations,
                    validation_timestamp: new Date().toISOString()
                };
                
                console.error('⚠️ Manual review required - potential AI hallucinations detected');
            } else {
                console.log('✅ Content validation passed - no hallucinations detected');
                this.enhancementResults.content_validation = {
                    valid: true,
                    violations: [],
                    validation_timestamp: new Date().toISOString()
                };
            }
            
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

export { EnhancementOrchestrator };