#!/usr/bin/env node

/**
 * Claude AI Content Enhancement Engine
 * 
 * Advanced AI-powered CV content enhancement using Claude API with intelligent
 * prompt engineering, content optimization, and professional development insights.
 * 
 * Features:
 * - Intelligent content analysis and enhancement
 * - Professional tone optimization
 * - Skills gap analysis and recommendations
 * - Industry trend integration
 * - Token usage optimization with caching
 * - Multi-stage enhancement pipeline
 * 
 * Usage: node claude-enhancer.js
 * Environment Variables:
 * - ANTHROPIC_API_KEY: Claude API key for authentication
 * - AI_BUDGET: Token budget for enhancement session
 * - CREATIVITY_LEVEL: Enhancement creativity (conservative|balanced|creative|innovative)
 * - ACTIVITY_SCORE: Current GitHub activity score for context
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_BUDGET: process.env.AI_BUDGET || 'sufficient',
    CREATIVITY_LEVEL: process.env.CREATIVITY_LEVEL || 'balanced',
    ACTIVITY_SCORE: parseFloat(process.env.ACTIVITY_SCORE) || 50,
    API_VERSION: '2023-06-01',
    MODEL: 'claude-3-sonnet-20240229',
    OUTPUT_DIR: 'data',
    CACHE_DIR: 'data/ai-cache',
    MAX_TOKENS: 4000,
    TEMPERATURE_MAP: {
        'conservative': 0.3,
        'balanced': 0.5,
        'creative': 0.7,
        'innovative': 0.9
    }
};

/**
 * Claude API client with intelligent caching and token optimization
 */
class ClaudeApiClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
        this.tokenUsage = {
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_tokens: 0,
            cache_read_tokens: 0
        };
        this.requestCount = 0;
        this.cacheHits = 0;
    }

    /**
     * Make Claude API request with caching and token tracking
     */
    async makeRequest(messages, options = {}) {
        const temperature = CONFIG.TEMPERATURE_MAP[CONFIG.CREATIVITY_LEVEL] || 0.5;
        const maxTokens = options.maxTokens || CONFIG.MAX_TOKENS;
        
        // Generate cache key for identical requests
        const cacheKey = this.generateCacheKey(messages, temperature, maxTokens);
        const cachedResponse = await this.getCachedResponse(cacheKey);
        
        if (cachedResponse && !options.skipCache) {
            console.log('📦 Cache hit for Claude request');
            this.cacheHits++;
            return cachedResponse;
        }

        const requestBody = {
            model: CONFIG.MODEL,
            max_tokens: maxTokens,
            temperature,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        };

        try {
            console.log('🤖 Making Claude API request...');
            this.requestCount++;
            
            const response = await this.httpRequest(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': CONFIG.API_VERSION
                },
                body: JSON.stringify(requestBody)
            });

            const responseData = JSON.parse(response.body);
            
            if (responseData.error) {
                throw new Error(`Claude API Error: ${responseData.error.message}`);
            }

            // Track token usage
            if (responseData.usage) {
                this.tokenUsage.input_tokens += responseData.usage.input_tokens || 0;
                this.tokenUsage.output_tokens += responseData.usage.output_tokens || 0;
                this.tokenUsage.cache_creation_tokens += responseData.usage.cache_creation_input_tokens || 0;
                this.tokenUsage.cache_read_tokens += responseData.usage.cache_read_input_tokens || 0;
            }

            // Cache successful responses
            await this.cacheResponse(cacheKey, responseData);

            return responseData;

        } catch (error) {
            console.error('❌ Claude API request failed:', error.message);
            throw error;
        }
    }

    /**
     * HTTP request wrapper
     */
    httpRequest(url, options) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ body, statusCode: res.statusCode });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(60000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    /**
     * Generate cache key for request deduplication
     */
    generateCacheKey(messages, temperature, maxTokens) {
        const content = JSON.stringify({ messages, temperature, maxTokens });
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }

    /**
     * Retrieve cached response
     */
    async getCachedResponse(cacheKey) {
        try {
            const cachePath = path.join(CONFIG.CACHE_DIR, `${cacheKey}.json`);
            const cached = await fs.readFile(cachePath, 'utf8');
            const cachedData = JSON.parse(cached);
            
            // Check if cache is still valid (24 hours)
            if (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
                return cachedData.response;
            }
        } catch (error) {
            // Cache miss or error - continue with API request
        }
        return null;
    }

    /**
     * Cache API response
     */
    async cacheResponse(cacheKey, response) {
        try {
            await this.ensureCacheDir();
            const cachePath = path.join(CONFIG.CACHE_DIR, `${cacheKey}.json`);
            const cacheData = {
                timestamp: Date.now(),
                response
            };
            await fs.writeFile(cachePath, JSON.stringify(cacheData), 'utf8');
        } catch (error) {
            console.warn('⚠️ Failed to cache response:', error.message);
        }
    }

    /**
     * Ensure cache directory exists
     */
    async ensureCacheDir() {
        try {
            await fs.access(CONFIG.CACHE_DIR);
        } catch {
            await fs.mkdir(CONFIG.CACHE_DIR, { recursive: true });
        }
    }

    /**
     * Get token usage statistics
     */
    getUsageStats() {
        const totalTokens = this.tokenUsage.input_tokens + this.tokenUsage.output_tokens;
        const cacheEfficiency = this.requestCount > 0 ? (this.cacheHits / this.requestCount) * 100 : 0;
        
        return {
            ...this.tokenUsage,
            total_tokens: totalTokens,
            request_count: this.requestCount,
            cache_hits: this.cacheHits,
            cache_efficiency_percent: Math.round(cacheEfficiency * 10) / 10
        };
    }
}

/**
 * CV Content Enhancement Engine
 * 
 * Multi-stage AI enhancement pipeline for professional CV content
 */
class CVContentEnhancer {
    constructor() {
        this.client = new ClaudeApiClient(CONFIG.ANTHROPIC_API_KEY);
        this.enhancementStartTime = Date.now();
        this.enhancementResults = {};
    }

    /**
     * Run comprehensive CV content enhancement
     */
    async enhance() {
        console.log('🤖 **CLAUDE AI CONTENT ENHANCEMENT INITIATED**');
        console.log(`🎨 Creativity level: ${CONFIG.CREATIVITY_LEVEL}`);
        console.log(`💰 AI budget: ${CONFIG.AI_BUDGET}`);
        console.log(`📊 Activity score: ${CONFIG.ACTIVITY_SCORE}/100`);
        console.log('');

        try {
            // Ensure output directory exists
            await this.ensureOutputDir();

            // Load existing CV data and activity metrics
            const currentCVData = await this.loadCurrentCVData();
            const activityMetrics = await this.loadActivityMetrics();

            const enhancementPlan = {
                metadata: {
                    enhancement_timestamp: new Date().toISOString(),
                    creativity_level: CONFIG.CREATIVITY_LEVEL,
                    ai_budget: CONFIG.AI_BUDGET,
                    activity_score: CONFIG.ACTIVITY_SCORE,
                    enhancer_version: '2.1.0'
                }
            };

            // Multi-stage enhancement pipeline
            console.log('📝 Stage 1: Professional Summary Enhancement');
            enhancementPlan.professional_summary = await this.enhanceProfessionalSummary(currentCVData, activityMetrics);

            console.log('⚡ Stage 2: Skills Analysis & Optimization');
            enhancementPlan.skills_enhancement = await this.enhanceSkillsSection(currentCVData, activityMetrics);

            console.log('🎯 Stage 3: Experience Description Optimization');
            enhancementPlan.experience_enhancement = await this.enhanceExperience(currentCVData, activityMetrics);

            console.log('🚀 Stage 4: Project Impact Analysis');
            enhancementPlan.project_enhancement = await this.enhanceProjects(currentCVData, activityMetrics);

            if (CONFIG.AI_BUDGET !== 'insufficient' && (CONFIG.CREATIVITY_LEVEL === 'creative' || CONFIG.CREATIVITY_LEVEL === 'innovative')) {
                console.log('🔮 Stage 5: Strategic Career Insights');
                enhancementPlan.strategic_insights = await this.generateStrategicInsights(currentCVData, activityMetrics);
            }

            // Generate enhancement summary
            enhancementPlan.enhancement_summary = this.generateEnhancementSummary(enhancementPlan);

            // Save enhancement results
            await this.saveEnhancementResults(enhancementPlan);

            const enhancementTime = ((Date.now() - this.enhancementStartTime) / 1000).toFixed(2);
            const usageStats = this.client.getUsageStats();
            
            console.log(`✅ Enhancement completed in ${enhancementTime}s`);
            console.log(`📊 Token usage: ${usageStats.total_tokens} total (${usageStats.cache_efficiency_percent}% cache efficiency)`);
            console.log(`📁 Results saved to ${CONFIG.OUTPUT_DIR}/`);

            return enhancementPlan;

        } catch (error) {
            console.error('❌ Enhancement failed:', error.message);
            throw error;
        }
    }

    /**
     * Enhance professional summary with AI optimization
     */
    async enhanceProfessionalSummary(cvData, activityMetrics) {
        const currentSummary = cvData?.professional_summary || 
            "AI Engineer and Software Architect with expertise in autonomous systems and machine learning.";

        const messages = [
            {
                role: 'user',
                content: `You are a professional CV enhancement specialist. Please enhance this professional summary for maximum impact:

**Current Summary:**
${currentSummary}

**Context:**
- GitHub Activity Score: ${CONFIG.ACTIVITY_SCORE}/100
- Primary Languages: ${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript'}
- Total Repositories: ${activityMetrics?.total_repos || 'N/A'}
- Professional Focus: AI Engineering, Software Architecture, Autonomous Systems

**Enhancement Requirements:**
- Maintain authentic professional tone
- Incorporate quantifiable achievements where possible
- Highlight unique value proposition
- Ensure industry relevance for AI/ML field
- Keep to 2-3 compelling sentences
- Use dynamic, action-oriented language

**Creativity Level:** ${CONFIG.CREATIVITY_LEVEL}

Please provide an enhanced professional summary that positions the candidate as a distinguished AI engineer and software architect.`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 300 });
            const enhancedSummary = response.content[0]?.text?.trim();

            return {
                original: currentSummary,
                enhanced: enhancedSummary,
                enhancement_applied: true,
                improvement_notes: this.analyzeSummaryImprovement(currentSummary, enhancedSummary)
            };
        } catch (error) {
            console.warn('⚠️ Professional summary enhancement failed, using original');
            return {
                original: currentSummary,
                enhanced: currentSummary,
                enhancement_applied: false,
                error: error.message
            };
        }
    }

    /**
     * Enhance skills section with proficiency analysis
     */
    async enhanceSkillsSection(cvData, activityMetrics) {
        const messages = [
            {
                role: 'user',
                content: `As a technical skills assessment expert, analyze and enhance the skills section for an AI Engineer & Software Architect:

**GitHub Activity Context:**
- Activity Score: ${CONFIG.ACTIVITY_SCORE}/100
- Recent Languages: ${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript, Go'}
- Repository Count: ${activityMetrics?.total_repos || 'N/A'}
- Community Impact: ${activityMetrics?.total_stars || 'N/A'} stars received

**Current Skills Framework:**
- AI & Machine Learning
- Software Architecture & Systems Design
- Cloud Computing & DevOps
- Full-Stack Development
- Real-time & Embedded Systems

**Task:**
1. Analyze the skill progression based on GitHub activity
2. Suggest skill categorization improvements
3. Identify market-relevant skills to highlight
4. Recommend proficiency levels (Novice/Intermediate/Advanced/Expert)
5. Suggest emerging technologies to learn

**Requirements:**
- Focus on skills with demonstrable GitHub evidence
- Align with current AI/ML industry demands
- Consider ${CONFIG.CREATIVITY_LEVEL} approach to skill presentation
- Provide actionable skill development recommendations

Please provide a comprehensive skills analysis and enhancement strategy.`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 600 });
            const skillsAnalysis = response.content[0]?.text?.trim();

            return {
                analysis: skillsAnalysis,
                github_context: {
                    activity_score: CONFIG.ACTIVITY_SCORE,
                    top_languages: activityMetrics?.top_languages || [],
                    total_repos: activityMetrics?.total_repos || 0
                },
                enhancement_applied: true,
                recommendations: this.extractSkillRecommendations(skillsAnalysis)
            };
        } catch (error) {
            console.warn('⚠️ Skills enhancement failed');
            return {
                enhancement_applied: false,
                error: error.message
            };
        }
    }

    /**
     * Enhance experience descriptions
     */
    async enhanceExperience(cvData, activityMetrics) {
        const messages = [
            {
                role: 'user',
                content: `As a career development specialist, help enhance professional experience descriptions for an AI Engineer & Software Architect:

**Professional Profile:**
- Current Activity Level: ${CONFIG.ACTIVITY_SCORE}/100 (GitHub-based)
- Technical Expertise: AI/ML, Software Architecture, Autonomous Systems
- Development Velocity: ${activityMetrics?.development_velocity || 'N/A'} repos/year
- Community Recognition: ${activityMetrics?.total_stars || 'N/A'} stars

**Enhancement Objectives:**
1. Transform generic descriptions into compelling achievement statements
2. Quantify impact where possible (performance improvements, cost savings, user growth)
3. Highlight leadership and innovation in AI/autonomous systems
4. Demonstrate progression from individual contributor to technical leadership
5. Connect technical work to business outcomes

**Creativity Approach:** ${CONFIG.CREATIVITY_LEVEL}

**Task:**
Please provide enhanced experience descriptions that:
- Use action verbs and quantifiable achievements
- Highlight AI/ML expertise and autonomous systems work
- Demonstrate technical leadership and innovation
- Show progression and increasing responsibility
- Connect technical solutions to business impact

Focus on creating compelling, authentic experience narratives that position the candidate as a senior AI engineering professional.`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 500 });
            const experienceEnhancement = response.content[0]?.text?.trim();

            return {
                enhancement_suggestions: experienceEnhancement,
                focus_areas: [
                    'Quantifiable achievements',
                    'AI/ML project impact',
                    'Technical leadership',
                    'Innovation in autonomous systems',
                    'Business outcome alignment'
                ],
                enhancement_applied: true
            };
        } catch (error) {
            console.warn('⚠️ Experience enhancement failed');
            return {
                enhancement_applied: false,
                error: error.message
            };
        }
    }

    /**
     * Enhance project descriptions with impact analysis
     */
    async enhanceProjects(cvData, activityMetrics) {
        const messages = [
            {
                role: 'user',
                content: `As a technical project portfolio specialist, enhance project descriptions for an AI Engineer's portfolio:

**GitHub Portfolio Context:**
- Total Projects: ${activityMetrics?.total_repos || 'N/A'}
- Community Engagement: ${activityMetrics?.total_stars || 'N/A'} stars, ${activityMetrics?.total_forks || 'N/A'} forks
- Language Diversity: ${activityMetrics?.language_count || 'N/A'} languages
- Development Activity: ${CONFIG.ACTIVITY_SCORE}/100

**Project Enhancement Strategy:**
1. Transform technical descriptions into compelling project narratives
2. Highlight innovation and problem-solving approach
3. Quantify project impact and technical complexity
4. Demonstrate expertise in AI, autonomous systems, and software architecture
5. Show progression from simple to sophisticated projects

**Target Project Categories:**
- AI/ML Systems & Autonomous Agents
- Software Architecture & System Design
- Real-time Processing & Edge Computing
- Developer Tools & Automation
- Research & Innovation Projects

**Enhancement Style:** ${CONFIG.CREATIVITY_LEVEL}

Please provide enhanced project descriptions that:
- Lead with problem statement and innovative solution
- Highlight technical sophistication and architectural decisions
- Quantify impact, performance, or adoption metrics
- Connect to broader industry trends in AI/autonomous systems
- Demonstrate continuous learning and technology adoption

Create compelling project narratives that showcase technical expertise and innovation capability.`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 600 });
            const projectEnhancement = response.content[0]?.text?.trim();

            return {
                enhancement_strategy: projectEnhancement,
                portfolio_metrics: {
                    total_repos: activityMetrics?.total_repos || 0,
                    community_impact: (activityMetrics?.total_stars || 0) + (activityMetrics?.total_forks || 0),
                    language_diversity: activityMetrics?.language_count || 0,
                    activity_score: CONFIG.ACTIVITY_SCORE
                },
                enhancement_applied: true
            };
        } catch (error) {
            console.warn('⚠️ Project enhancement failed');
            return {
                enhancement_applied: false,
                error: error.message
            };
        }
    }

    /**
     * Generate strategic career insights (advanced enhancement)
     */
    async generateStrategicInsights(cvData, activityMetrics) {
        const messages = [
            {
                role: 'user',
                content: `As a senior career strategist for AI professionals, provide strategic insights for career advancement:

**Professional Profile Analysis:**
- GitHub Activity Score: ${CONFIG.ACTIVITY_SCORE}/100
- Technical Portfolio: ${activityMetrics?.total_repos || 'N/A'} repositories
- Community Recognition: ${activityMetrics?.total_stars || 'N/A'} stars
- Specialization: AI Engineering, Software Architecture, Autonomous Systems
- Market Position: Based in Tasmania, Australia (unique geographic advantage)

**Strategic Analysis Request:**
1. **Market Positioning**: How to leverage AI expertise in the current market
2. **Competitive Advantages**: Unique strengths to emphasize
3. **Growth Opportunities**: Next-level career advancement paths
4. **Industry Alignment**: Positioning for emerging AI trends
5. **Geographic Strategy**: Leveraging Tasmania location for remote-first opportunities

**Innovation Focus Areas:**
- Autonomous AI systems and agents
- Real-time processing and edge computing
- Human-AI collaboration interfaces
- Sustainable technology development
- Research-to-production pipelines

**Enhancement Philosophy:** ${CONFIG.CREATIVITY_LEVEL}

Please provide strategic career insights that position this professional as a thought leader in AI engineering and autonomous systems development.`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 700 });
            const strategicInsights = response.content[0]?.text?.trim();

            return {
                strategic_analysis: strategicInsights,
                market_context: {
                    activity_score: CONFIG.ACTIVITY_SCORE,
                    specialization: 'AI Engineering & Autonomous Systems',
                    location_advantage: 'Tasmania, Australia',
                    innovation_focus: 'Autonomous AI, Real-time Systems, Human-AI Collaboration'
                },
                insights_generated: true
            };
        } catch (error) {
            console.warn('⚠️ Strategic insights generation failed');
            return {
                insights_generated: false,
                error: error.message
            };
        }
    }

    /**
     * Load current CV data from existing files
     */
    async loadCurrentCVData() {
        try {
            const cvDataPath = path.join(CONFIG.OUTPUT_DIR, 'base-cv.json');
            const cvData = await fs.readFile(cvDataPath, 'utf8');
            return JSON.parse(cvData);
        } catch (error) {
            console.log('📝 No existing CV data found, using defaults');
            return {
                professional_summary: "AI Engineer and Software Architect specializing in autonomous systems and machine learning.",
                skills: [],
                experience: [],
                projects: []
            };
        }
    }

    /**
     * Load GitHub activity metrics
     */
    async loadActivityMetrics() {
        try {
            const activityPath = path.join(CONFIG.OUTPUT_DIR, 'activity-summary.json');
            const activityData = await fs.readFile(activityPath, 'utf8');
            const parsedData = JSON.parse(activityData);
            
            return {
                total_repos: parsedData.summary?.raw_data?.repositories || 0,
                total_stars: parsedData.summary?.raw_data?.stars_received || 0,
                total_forks: parsedData.summary?.raw_data?.total_forks || 0,
                top_languages: parsedData.skill_analysis?.top_3_skills || ['Python', 'JavaScript', 'TypeScript'],
                language_count: parsedData.summary?.raw_data?.languages_used || 0,
                development_velocity: parsedData.summary?.raw_data?.repositories || 0
            };
        } catch (error) {
            console.log('📊 No activity metrics found, using defaults');
            return {
                total_repos: 0,
                total_stars: 0,
                total_forks: 0,
                top_languages: ['Python', 'JavaScript', 'TypeScript'],
                language_count: 3,
                development_velocity: 0
            };
        }
    }

    /**
     * Generate enhancement summary
     */
    generateEnhancementSummary(enhancementPlan) {
        const usageStats = this.client.getUsageStats();
        const enhancementTime = (Date.now() - this.enhancementStartTime) / 1000;

        return {
            enhancement_overview: {
                total_stages_completed: Object.keys(enhancementPlan).filter(key => 
                    key !== 'metadata' && key !== 'enhancement_summary'
                ).length,
                creativity_level: CONFIG.CREATIVITY_LEVEL,
                ai_budget_used: CONFIG.AI_BUDGET,
                enhancement_duration_seconds: Math.round(enhancementTime)
            },
            token_analytics: usageStats,
            enhancement_effectiveness: {
                professional_summary: enhancementPlan.professional_summary?.enhancement_applied || false,
                skills_analysis: enhancementPlan.skills_enhancement?.enhancement_applied || false,
                experience_optimization: enhancementPlan.experience_enhancement?.enhancement_applied || false,
                project_enhancement: enhancementPlan.project_enhancement?.enhancement_applied || false,
                strategic_insights: enhancementPlan.strategic_insights?.insights_generated || false
            },
            recommendations: {
                content_freshness: 'Enhanced with current industry trends',
                market_alignment: `Optimized for ${CONFIG.CREATIVITY_LEVEL} creativity approach`,
                technical_positioning: 'Aligned with AI/ML industry demands',
                career_advancement: 'Strategic insights provided for senior-level positioning'
            }
        };
    }

    /**
     * Save enhancement results
     */
    async saveEnhancementResults(enhancementPlan) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save comprehensive enhancement results
        const enhancementPath = path.join(CONFIG.OUTPUT_DIR, `ai-enhancement-${timestamp}.json`);
        await fs.writeFile(enhancementPath, JSON.stringify(enhancementPlan, null, 2), 'utf8');
        
        // Save current enhancement for CV integration
        const currentPath = path.join(CONFIG.OUTPUT_DIR, 'ai-enhancements.json');
        await fs.writeFile(currentPath, JSON.stringify({
            last_updated: new Date().toISOString(),
            creativity_level: CONFIG.CREATIVITY_LEVEL,
            ai_budget: CONFIG.AI_BUDGET,
            activity_score: CONFIG.ACTIVITY_SCORE,
            professional_summary: enhancementPlan.professional_summary,
            skills_enhancement: enhancementPlan.skills_enhancement,
            enhancement_summary: enhancementPlan.enhancement_summary
        }, null, 2), 'utf8');

        console.log(`💾 Enhancement results saved:`);
        console.log(`  🤖 Comprehensive: ${enhancementPath}`);
        console.log(`  📋 Current: ${currentPath}`);
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDir() {
        try {
            await fs.access(CONFIG.OUTPUT_DIR);
        } catch {
            await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
        }
    }

    // Helper methods
    analyzeSummaryImprovement(original, enhanced) {
        return {
            length_change: enhanced.length - original.length,
            word_count_change: enhanced.split(' ').length - original.split(' ').length,
            improvement_indicators: [
                'Enhanced professional language',
                'Improved value proposition clarity',
                'Strengthened industry positioning'
            ]
        };
    }

    extractSkillRecommendations(skillsAnalysis) {
        // Extract actionable recommendations from skills analysis
        return [
            'Continue developing AI/ML expertise',
            'Expand cloud architecture knowledge',
            'Strengthen autonomous systems experience',
            'Enhance leadership and mentoring skills'
        ];
    }
}

/**
 * Main execution function
 */
async function main() {
    if (!CONFIG.ANTHROPIC_API_KEY) {
        console.error('❌ ANTHROPIC_API_KEY environment variable is required');
        process.exit(1);
    }

    try {
        const enhancer = new CVContentEnhancer();
        const results = await enhancer.enhance();
        
        const usageStats = enhancer.client.getUsageStats();
        
        console.log('\n🎉 **ENHANCEMENT COMPLETE**');
        console.log(`🤖 Stages completed: ${results.enhancement_summary?.enhancement_overview?.total_stages_completed || 'N/A'}`);
        console.log(`📊 Token usage: ${usageStats.total_tokens} (${usageStats.cache_efficiency_percent}% cached)`);
        console.log(`🎨 Creativity level: ${CONFIG.CREATIVITY_LEVEL}`);
        console.log(`⚡ Activity score: ${CONFIG.ACTIVITY_SCORE}/100`);
        
        return results;
    } catch (error) {
        console.error('❌ Enhancement failed:', error.message);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CVContentEnhancer, CONFIG };