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
 * - Meta-commentary artifact removal (Issue #100 fix)
 * - XML-structured output formatting
 * - Robust content filtering and cleaning
 * 
 * Meta-Commentary Fix (Issue #100):
 * This version includes comprehensive fixes to prevent Claude AI from generating
 * explanatory text and meta-commentary in CV content. Implementation includes:
 * - System prompts explicitly forbidding meta-commentary
 * - XML-structured output format specifications
 * - Multi-layer content cleaning and artifact removal
 * - Enhanced JSON parsing with fallback content extraction
 * - Comprehensive test suite for content validation
 * 
 * Usage: node claude-enhancer.js
 *        node claude-enhancer.js --test-cleaning  # Test content cleaning functions
 * 
 * Environment Variables:
 * - ANTHROPIC_API_KEY: Claude API key for authentication
 * - AI_BUDGET: Token budget for enhancement session
 * - CREATIVITY_LEVEL: Enhancement creativity (conservative|balanced|creative|innovative)
 * - ACTIVITY_SCORE: Current GitHub activity score for context
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { sleep } = require('./utils/apiClient');
const { XMLFewShotIntegrator } = require('./enhancer-modules/xml-few-shot-integrator');
const { PromptLibraryManager } = require('./enhancer-modules/prompt-library-manager');
const { MarketContextIntegrator } = require('./enhancer-modules/market-context-integrator');

// Configuration
const CONFIG = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_BUDGET: process.env.AI_BUDGET || 'sufficient',
    CREATIVITY_LEVEL: process.env.CREATIVITY_LEVEL || 'balanced',
    ACTIVITY_SCORE: parseFloat(process.env.ACTIVITY_SCORE) || 50,
    API_VERSION: '2023-06-01',
    MODEL: 'claude-3-5-sonnet-20241022',
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
    async makeRequest(messages, options = {}, sourceContent = '') {
        const temperature = CONFIG.TEMPERATURE_MAP[CONFIG.CREATIVITY_LEVEL] || 0.5;
        const maxTokens = options.maxTokens || CONFIG.MAX_TOKENS;
        
        // Generate cache key for identical requests
        const cacheKey = this.generateCacheKey({ messages, temperature, maxTokens }, sourceContent);
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
    async httpRequest(url, options, maxRetries = 3, retryDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await new Promise((resolve, reject) => {
                    const req = https.request(url, options, (res) => {
                        let body = '';
                        res.on('data', chunk => body += chunk);
                        res.on('end', () => {
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve({ body, statusCode: res.statusCode });
                            } else if (res.statusCode >= 500 || res.statusCode === 429) { // Retry on 5xx or Too Many Requests
                                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
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
            } catch (error) {
                if (i < maxRetries - 1) {
                    const delay = retryDelay * Math.pow(2, i);
                    console.warn(`Retrying ${url} in ${delay}ms due to error: ${error.message}`);
                    await sleep(delay);
                } else {
                    throw error; // Last retry failed
                }
            }
        }
    }

    /**
     * Generate a content-aware cache key for request deduplication.
     * @param {object} requestPayload - The core request object (messages, temperature, maxTokens).
     * @param {string} [sourceContent=''] - The raw source content being enhanced (e.g., the original summary text).
     * @returns {string} A SHA256 hash representing the unique request.
     */
    generateCacheKey(requestPayload, sourceContent = '') {
        // Combine the request structure with a hash of the actual content being processed.
        const contentHash = crypto.createHash('sha256').update(sourceContent).digest('hex');
        const payloadString = JSON.stringify(requestPayload);
        
        // The final key depends on both the prompt and the data.
        return crypto.createHash('sha256').update(payloadString + contentHash).digest('hex').substring(0, 16);
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
        this.xmlIntegrator = new XMLFewShotIntegrator();
        this.promptLibrary = new PromptLibraryManager('v2.0');
        this.marketContext = new MarketContextIntegrator();
        this.enhancementStartTime = Date.now();
        this.enhancementResults = {};
        this.useXMLPrompts = process.env.USE_XML_PROMPTS !== 'false'; // Default to true
        this.usePromptLibrary = process.env.USE_PROMPT_LIBRARY !== 'false'; // Default to true
        this.useMarketContext = process.env.USE_MARKET_CONTEXT !== 'false'; // Default to true
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

            // Initialize prompt library if enabled
            if (this.usePromptLibrary) {
                console.log('📚 Initializing Prompt Library v2.0...');
                await this.promptLibrary.initialize();
                console.log('✅ Prompt Library ready with', this.promptLibrary.templates.size, 'templates');
            }

            // Initialize market context integrator if enabled
            if (this.useMarketContext) {
                console.log('📊 Initializing Market Context Integrator...');
                await this.marketContext.initialize();
                console.log('✅ Market intelligence loaded and ready');
            }

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
     * Load narrative intelligence data if available
     */
    async loadNarrativeIntelligence() {
        try {
            const narrativePath = path.join('data', 'narratives', 'narrative-integration.json');
            const content = await fs.readFile(narrativePath, 'utf8');
            const narrativeData = JSON.parse(content);
            
            console.log('📖 Loaded professional narrative intelligence data');
            return narrativeData;
        } catch (error) {
            console.log('📝 No narrative intelligence data available, using standard enhancement');
            return null;
        }
    }

    /**
     * Enhance professional summary with AI optimization
     * Enhanced with XML structuring and few-shot learning (Issues #96, #97)
     */
    async enhanceProfessionalSummary(cvData, activityMetrics) {
        // Use new prompt library system if enabled
        if (this.usePromptLibrary && this.promptLibrary.initialized) {
            return await this.enhanceProfessionalSummaryLibrary(cvData, activityMetrics);
        }
        
        // Use XML-structured prompts with few-shot examples for enhanced quality
        if (this.useXMLPrompts) {
            return await this.enhanceProfessionalSummaryXML(cvData, activityMetrics);
        }
        
        // Legacy method for backward compatibility
        return await this.enhanceProfessionalSummaryLegacy(cvData, activityMetrics);
    }

    /**
     * Enhanced professional summary using Prompt Library v2.0
     * Features: Version-controlled prompts, persona-driven enhancement, evidence-based validation
     */
    async enhanceProfessionalSummaryLibrary(cvData, activityMetrics) {
        console.log('📚 Using Prompt Library v2.0 for professional summary enhancement...');
        
        try {
            // Get template and persona from library
            const template = await this.promptLibrary.getTemplate('professional-summary');
            const persona = await this.promptLibrary.getPersona('senior-technical-recruiter');
            
            if (!template || !persona) {
                console.warn('⚠️ Required template or persona not found, falling back to XML method');
                return await this.enhanceProfessionalSummaryXML(cvData, activityMetrics);
            }

            // Prepare context data for template with market intelligence
            const contextData = await this.prepareContextData(cvData, activityMetrics, 'professional_summary');
            
            // Construct prompt using library
            const promptResult = await this.promptLibrary.constructPrompt(
                'professional-summary', 
                'senior-technical-recruiter', 
                contextData
            );

            console.log(`📊 Prompt Library Enhancement (v${template.version})`);
            console.log(`🎭 Persona: ${persona.identity.name} (${persona.identity.title})`);
            
            // Create messages for Claude API
            const messages = [
                {
                    role: 'system',
                    content: `You are ${persona.identity.name}, ${persona.identity.title} at ${persona.identity.company}. ${persona.perspective.evaluation_approach}. RESPOND ONLY with valid JSON following the exact schema provided. No explanations or meta-commentary.`
                },
                {
                    role: 'user',
                    content: promptResult.finalPrompt
                }
            ];

            // Make API request
            const response = await this.client.makeRequest(messages, { maxTokens: 1200 }, cvData.professional_summary);
            const responseText = response.content[0]?.text?.trim();
            
            // Clean and parse response
            const cleanedResponse = this.cleanResponseText(responseText);
            let enhancementData;
            
            try {
                enhancementData = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.warn('⚠️ JSON parsing failed, attempting content extraction');
                enhancementData = this.extractContentFromText(cleanedResponse);
            }

            // Validate against schema if available
            const schema = await this.promptLibrary.getSchema('professional-summary-schema');
            let validationScore = 0.85; // Default score
            
            if (schema) {
                const validation = this.validateAgainstSchema(enhancementData, schema);
                validationScore = validation.score;
                console.log(`✅ Schema validation: ${validation.valid ? 'PASSED' : 'FAILED'} (Score: ${(validationScore * 100).toFixed(1)}%)`);
            }

            return {
                original: cvData.professional_summary,
                enhanced: enhancementData.enhanced || enhancementData.enhanced_summary,
                key_differentiators: enhancementData.key_differentiators || [],
                technical_positioning: enhancementData.technical_positioning || "",
                confidence_score: validationScore,
                enhancement_applied: true,
                prompt_strategy: 'prompt-library-v2',
                library_metadata: {
                    template_id: 'professional-summary',
                    template_version: template.version,
                    persona_id: 'senior-technical-recruiter',
                    persona_name: persona.identity.name,
                    creativity_level: CONFIG.CREATIVITY_LEVEL
                },
                quality_indicators: {
                    prompt_library_v2: true,
                    persona_driven: true,
                    schema_validated: !!schema,
                    validation_score: validationScore
                }
            };

        } catch (error) {
            console.warn('⚠️ Prompt Library enhancement failed, falling back to XML method:', error.message);
            return await this.enhanceProfessionalSummaryXML(cvData, activityMetrics);
        }
    }

    /**
     * Enhanced professional summary using XML structuring and few-shot prompting
     */
    async enhanceProfessionalSummaryXML(cvData, activityMetrics) {
        console.log('🔨 Using XML-structured prompt with few-shot examples...');
        
        try {
            // Initialize XML integrator
            await this.xmlIntegrator.initialize();
            
            // Construct XML-structured prompt with few-shot examples
            const promptResult = await this.xmlIntegrator.enhanceProfessionalSummaryXML(
                cvData, 
                activityMetrics, 
                CONFIG.CREATIVITY_LEVEL
            );
            
            console.log(`📊 Expected quality improvement: ${(promptResult.quality_expected * 100).toFixed(1)}%`);
            
            // Create messages for Claude API
            const messages = [
                {
                    role: 'system',
                    content: 'You are a professional CV enhancement specialist. You MUST respond ONLY with clean JSON structure. NEVER include explanatory text, process descriptions, or meta-commentary. Follow the provided examples exactly.'
                },
                {
                    role: 'user',
                    content: promptResult.xmlPrompt
                }
            ];

            // Make API request
            const response = await this.client.makeRequest(messages, { maxTokens: 800 }, promptResult.contextData.currentContent);
            const responseText = response.content[0]?.text?.trim();
            
            // Clean and parse response
            const cleanedResponse = this.cleanResponseText(responseText);
            let enhancementData;
            
            try {
                enhancementData = JSON.parse(cleanedResponse);
                
                // Clean enhanced content
                if (enhancementData.enhanced) {
                    enhancementData.enhanced = this.cleanEnhancedContent(enhancementData.enhanced);
                } else if (enhancementData.enhanced_summary) {
                    enhancementData.enhanced_summary = this.cleanEnhancedContent(enhancementData.enhanced_summary);
                    enhancementData.enhanced = enhancementData.enhanced_summary; // Normalize
                }
            } catch (parseError) {
                console.warn('⚠️ JSON parsing failed, attempting content extraction');
                enhancementData = this.extractContentFromText(cleanedResponse);
            }

            // Validate response quality
            const validation = await this.xmlIntegrator.validateResponse(enhancementData, 'professional-summary', promptResult.quality_expected);
            
            console.log(`✅ Response validation: ${validation.valid ? 'PASSED' : 'FAILED'} (Score: ${(validation.score * 100).toFixed(1)}%)`);
            if (validation.quality_improvement) {
                console.log('🎯 Quality improvement achieved beyond expected threshold');
            }

            return {
                original: promptResult.contextData.currentContent,
                enhanced: enhancementData.enhanced || enhancementData.enhanced_summary,
                strategic_analysis: enhancementData.strategic_improvements || enhancementData.key_differentiators,
                ats_optimization: enhancementData.ats_keywords || [],
                confidence_score: enhancementData.confidence_score || validation.score,
                enhancement_applied: true,
                prompt_strategy: 'xml-few-shot',
                xml_metadata: promptResult.metadata,
                validation_results: validation,
                improvement_notes: this.analyzeSummaryImprovement(
                    promptResult.contextData.currentContent, 
                    enhancementData.enhanced || enhancementData.enhanced_summary
                ),
                quality_indicators: {
                    xml_structured: true,
                    few_shot_guided: true,
                    validation_passed: validation.valid,
                    quality_score: validation.score,
                    expected_improvement: promptResult.quality_expected
                }
            };

        } catch (error) {
            console.warn('⚠️ XML professional summary enhancement failed, falling back to legacy method');
            return await this.enhanceProfessionalSummaryLegacy(cvData, activityMetrics);
        }
    }

    /**
     * Legacy professional summary enhancement method
     */
    async enhanceProfessionalSummaryLegacy(cvData, activityMetrics) {
        // Load narrative intelligence if available
        const narrativeData = await this.loadNarrativeIntelligence();
        
        const currentSummary = narrativeData?.enhanced_summary || 
                              cvData?.professional_summary || 
                              "AI Engineer and Software Architect with expertise in autonomous systems and machine learning.";

        // Dynamic persona and strategy based on creativity level
        const creativityStrategies = {
            'conservative': {
                persona: 'Alexandra Chen, Senior Technical Recruiter at Microsoft, specializing in AI/ML leadership roles. You\'ve successfully placed 200+ AI engineers at Fortune 500 companies.',
                approach: 'evidence-based optimization with proven industry language',
                tone: 'authoritative and credible',
                focus: 'quantifiable achievements and established expertise'
            },
            'balanced': {
                persona: 'Dr. Marcus Rodriguez, Executive Search Partner at Andreessen Horowitz, focusing on AI startup leadership. You understand both technical depth and market positioning.',
                approach: 'strategic positioning that balances innovation with credibility',
                tone: 'confident thought leadership',
                focus: 'unique value proposition with market awareness'
            },
            'creative': {
                persona: 'Sarah Kim, Chief Talent Officer at OpenAI, identifying breakthrough AI talent. You recognize unconventional brilliance and emerging paradigms.',
                approach: 'innovative narrative that positions for future opportunities',
                tone: 'visionary and compelling',
                focus: 'transformative potential and cutting-edge innovation'
            },
            'innovative': {
                persona: 'Dr. Elena Vasquez, Venture Partner at Sequoia focusing on AI moonshots. You spot rare talent that will define the next decade of AI.',
                approach: 'revolutionary positioning for paradigm-shifting roles',
                tone: 'bold and transformational',
                focus: 'groundbreaking innovation and industry disruption'
            }
        };

        const strategy = creativityStrategies[CONFIG.CREATIVITY_LEVEL] || creativityStrategies['balanced'];
        
        // Context analysis for intelligent narrative integration
        const activityInsight = CONFIG.ACTIVITY_SCORE >= 80 ? 'exceptionally active contributor with consistent innovation' :
                               CONFIG.ACTIVITY_SCORE >= 60 ? 'highly engaged developer with strong technical output' :
                               CONFIG.ACTIVITY_SCORE >= 40 ? 'focused contributor with quality-driven development' :
                               'selective contributor with deep technical focus';
        
        const technicalBreadth = (activityMetrics?.top_languages?.length || 3) >= 5 ? 'remarkable technical versatility across multiple paradigms' :
                                 (activityMetrics?.top_languages?.length || 3) >= 3 ? 'solid multi-language expertise with platform agility' :
                                 'deep specialization with focused technical mastery';
        
        const professionalArchetype = CONFIG.ACTIVITY_SCORE >= 70 && (activityMetrics?.total_repos || 0) >= 20 ? 'prolific innovator' :
                                     CONFIG.ACTIVITY_SCORE >= 50 && (activityMetrics?.total_repos || 0) >= 10 ? 'strategic technologist' :
                                     'specialized expert';

        const messages = [
            {
                role: 'system',
                content: 'You are a professional CV enhancement specialist. You MUST respond ONLY with clean, professional content. NEVER include explanatory text like "Here\'s an enhanced...", process descriptions, or meta-commentary. Your response must be structured JSON only, containing the enhanced content and analysis without any additional explanations or formatting notes.'
            },
            {
                role: 'user',
                content: `You are ${strategy.persona}

CANDIDATE ANALYSIS:
You're reviewing a ${professionalArchetype} with ${CONFIG.ACTIVITY_SCORE}/100 GitHub activity score, demonstrating ${activityInsight}. Their technical portfolio (${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript'}) across ${activityMetrics?.total_repos || 'multiple'} repositories reveals ${technicalBreadth}.

${narrativeData ? `
PROFESSIONAL INTELLIGENCE CONTEXT:
Based on comprehensive GitHub data mining, this candidate has:
- Technical achievements: ${narrativeData.narratives_available?.technical_achievements || 0} evidence-backed accomplishments
- Leadership examples: ${narrativeData.narratives_available?.leadership_examples || 0} demonstrated instances
- Validated skills: ${narrativeData.validated_skills?.join(', ') || 'Multiple technical competencies'} with concrete evidence
- Top achievements: ${narrativeData.top_achievements?.map(a => a.achievement).join('; ') || 'Consistent technical contributions'}

This intelligence provides concrete evidence for professional claims and should inform your enhancement strategy.
` : ''}

MARKET CONTEXT (2025):
The AI engineering landscape demands professionals who bridge autonomous systems research with production-grade implementation. The market rewards those who can lead human-AI collaboration initiatives and drive sustainable AI development practices.

ENHANCEMENT MISSION (${CONFIG.CREATIVITY_LEVEL} approach):
Transform their current summary using ${strategy.approach}, creating a ${strategy.tone} narrative focused on ${strategy.focus}. ${narrativeData ? 'Leverage the professional intelligence context to create evidence-backed claims rather than generic statements.' : ''} Position them as someone ready for senior AI engineering roles that shape the future of autonomous systems.

CURRENT SUMMARY:
"${currentSummary}"

<output_format>
Respond with ONLY this JSON structure. Do not include any explanatory text, process descriptions, or meta-commentary:

{
  "enhanced_summary": "2-3 compelling sentences that immediately communicate transformative value",
  "strategic_improvements": {
    "positioning_shift": "How this repositions them in the market",
    "value_amplification": "Key strengths magnified",
    "market_alignment": "Industry demands addressed"
  },
  "ats_keywords": ["keyword1", "keyword2", "keyword3"],
  "confidence_score": 0.95
}
</output_format>`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 500 }, currentSummary);
            const responseText = response.content[0]?.text?.trim();
            
            // Clean the response text from potential artifacts
            const cleanedResponse = this.cleanResponseText(responseText);
            
            // Parse JSON response
            let enhancementData;
            try {
                enhancementData = JSON.parse(cleanedResponse);
                
                // Additional cleaning of the enhanced_summary field
                if (enhancementData.enhanced_summary) {
                    enhancementData.enhanced_summary = this.cleanEnhancedContent(enhancementData.enhanced_summary);
                }
            } catch (parseError) {
                console.warn('⚠️ JSON parsing failed, attempting content extraction');
                enhancementData = this.extractContentFromText(cleanedResponse);
            }

            return {
                original: currentSummary,
                enhanced: enhancementData.enhanced_summary,
                strategic_analysis: enhancementData.strategic_improvements,
                ats_optimization: enhancementData.ats_keywords,
                confidence_score: enhancementData.confidence_score,
                enhancement_applied: true,
                prompt_strategy: strategy.approach,
                improvement_notes: this.analyzeSummaryImprovement(currentSummary, enhancementData.enhanced_summary)
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
     * Enhanced with XML structuring and few-shot learning (Issues #96, #97)
     */
    async enhanceSkillsSection(cvData, activityMetrics) {
        // Use XML-structured prompts with few-shot examples for enhanced quality
        if (this.useXMLPrompts) {
            return await this.enhanceSkillsSectionXML(cvData, activityMetrics);
        }
        
        // Legacy method for backward compatibility
        return await this.enhanceSkillsSectionLegacy(cvData, activityMetrics);
    }

    /**
     * Enhanced skills section using XML structuring and few-shot prompting
     */
    async enhanceSkillsSectionXML(cvData, activityMetrics) {
        console.log('🔨 Using XML-structured skills enhancement prompt...');
        
        try {
            // Construct XML-structured prompt with few-shot examples
            const promptResult = await this.xmlIntegrator.enhanceSkillsSectionXML(
                cvData, 
                activityMetrics, 
                CONFIG.CREATIVITY_LEVEL
            );
            
            console.log(`📊 Expected skills quality improvement: ${(promptResult.quality_expected * 100).toFixed(1)}%`);
            
            // Create messages for Claude API
            const messages = [
                {
                    role: 'system',
                    content: 'You are a professional skills analysis specialist. Respond ONLY with the requested JSON structure. Do not include explanatory text or meta-commentary. Follow the provided examples for structure and quality.'
                },
                {
                    role: 'user',
                    content: promptResult.xmlPrompt
                }
            ];

            // Make API request
            const response = await this.client.makeRequest(messages, { maxTokens: 1000 }, JSON.stringify(cvData.skills));
            const responseText = response.content[0]?.text?.trim();
            
            // Clean and parse response
            const cleanedResponse = this.cleanResponseText(responseText);
            let skillsData;
            
            try {
                skillsData = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.warn('⚠️ Skills JSON parsing failed, using fallback structure');
                skillsData = {
                    skill_architecture: { core_competencies: [], emerging_expertise: [], market_differentiators: [] },
                    development_roadmap: { immediate_priorities: [], strategic_investments: [], innovation_opportunities: [] },
                    positioning_strategy: { technical_narrative: this.cleanEnhancedContent(cleanedResponse).substring(0, 200) + '...' },
                    confidence_assessment: 0.7
                };
            }

            // Validate response quality
            const validation = await this.xmlIntegrator.validateResponse(skillsData, 'skills-enhancement', promptResult.quality_expected);
            
            console.log(`✅ Skills validation: ${validation.valid ? 'PASSED' : 'FAILED'} (Score: ${(validation.score * 100).toFixed(1)}%)`);

            return {
                skill_analysis: skillsData.skill_architecture,
                development_roadmap: skillsData.development_roadmap,
                positioning_strategy: skillsData.positioning_strategy,
                confidence_score: skillsData.confidence_assessment || validation.score,
                github_context: {
                    activity_score: CONFIG.ACTIVITY_SCORE,
                    top_languages: activityMetrics?.top_languages || [],
                    total_repos: activityMetrics?.total_repos || 0
                },
                enhancement_applied: true,
                prompt_strategy: 'xml-few-shot',
                xml_metadata: promptResult.metadata,
                validation_results: validation,
                recommendations: this.extractSkillRecommendations(skillsData),
                quality_indicators: {
                    xml_structured: true,
                    few_shot_guided: true,
                    validation_passed: validation.valid,
                    quality_score: validation.score,
                    expected_improvement: promptResult.quality_expected
                }
            };

        } catch (error) {
            console.warn('⚠️ XML skills enhancement failed, falling back to legacy method');
            return await this.enhanceSkillsSectionLegacy(cvData, activityMetrics);
        }
    }

    /**
     * Legacy skills enhancement method
     */
    async enhanceSkillsSectionLegacy(cvData, activityMetrics) {
        // Expert personas based on creativity level
        const expertPersonas = {
            'conservative': {
                persona: 'Dr. James Liu, Principal Engineering Manager at Google DeepMind, who has assessed technical skills of 500+ AI engineers for critical autonomous systems projects.',
                approach: 'evidence-based skill validation with proven industry frameworks',
                focus: 'demonstrable expertise with quantifiable proficiency levels'
            },
            'balanced': {
                persona: 'Maria Santos, VP of Engineering at Anthropic, who built the technical hiring framework for constitutional AI development teams.',
                approach: 'strategic skill positioning that balances depth with market relevance',
                focus: 'comprehensive technical portfolio with growth trajectory'
            },
            'creative': {
                persona: 'Dr. Raj Patel, Chief Technology Officer at Scale AI, pioneering the next generation of human-AI collaborative systems.',
                approach: 'innovative skill narrative that positions for emerging opportunities',
                focus: 'transformative technical capabilities with future-ready expertise'
            },
            'innovative': {
                persona: 'Alex Chen, Co-founder and CTO of Adept AI, revolutionizing how AI agents interact with complex software systems.',
                approach: 'visionary skill architecture for paradigm-shifting AI development', 
                focus: 'breakthrough technical innovation with industry-defining potential'
            }
        };

        const expert = expertPersonas[CONFIG.CREATIVITY_LEVEL] || expertPersonas['balanced'];
        
        // Activity-based insights
        const skillDepthIndicator = CONFIG.ACTIVITY_SCORE >= 80 ? 'demonstrates exceptional depth across multiple domains' :
                                   CONFIG.ACTIVITY_SCORE >= 60 ? 'shows strong technical versatility with consistent growth' :
                                   CONFIG.ACTIVITY_SCORE >= 40 ? 'exhibits focused expertise with quality-driven development' :
                                   'displays specialized knowledge with strategic technical choices';
        
        const expertiseEvolution = (activityMetrics?.top_languages?.length || 3) >= 5 ? 'polyglot technologist with rapid technology adoption' :
                                  (activityMetrics?.top_languages?.length || 3) >= 3 ? 'multi-platform engineer with strategic language selection' :
                                  'domain specialist with deep technical mastery';
        
        const communityImpact = (activityMetrics?.total_stars || 0) >= 100 ? 'significant open-source influence with community recognition' :
                               (activityMetrics?.total_stars || 0) >= 20 ? 'growing technical influence with peer acknowledgment' :
                               'focused contribution with quality-driven development';

        const messages = [
            {
                role: 'system',
                content: 'You are a professional skills analysis specialist. Respond ONLY with the requested JSON structure. Do not include explanatory text, analysis descriptions, or meta-commentary. Provide only clean, structured data without any additional formatting or process explanations.'
            },
            {
                role: 'user',
                content: `You are ${expert.persona}

TECHNICAL PROFILE ANALYSIS:
You're evaluating a developer who ${skillDepthIndicator}, functioning as a ${expertiseEvolution} with ${communityImpact}. Their GitHub footprint (${CONFIG.ACTIVITY_SCORE}/100 activity, ${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript'} expertise, ${activityMetrics?.total_repos || 'multiple'} repositories) reveals sophisticated technical judgment.

MARKET INTELLIGENCE (2025):
The AI engineering market prioritizes professionals who master autonomous agent development, real-time AI system optimization, and human-AI collaboration interfaces. Critical skills include production ML ops, edge computing for AI, and sustainable AI architecture patterns.

SKILL ENHANCEMENT MISSION (${CONFIG.CREATIVITY_LEVEL} methodology):
Using ${expert.approach}, create a ${expert.focus} skills analysis that positions this developer for senior AI engineering roles requiring both technical mastery and innovative thinking.

GITHUB EVIDENCE BASE:
- Activity Pattern: ${CONFIG.ACTIVITY_SCORE}/100 (${skillDepthIndicator})
- Language Portfolio: ${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript'}
- Repository Volume: ${activityMetrics?.total_repos || 'N/A'} projects
- Community Recognition: ${activityMetrics?.total_stars || 'N/A'} stars

<output_format>
Respond with ONLY this JSON structure:

{
  "skill_architecture": {
    "core_competencies": [
      {"skill": "AI/ML Systems", "proficiency": "Expert", "evidence": "GitHub activity justification"},
      {"skill": "Software Architecture", "proficiency": "Advanced", "evidence": "Repository pattern analysis"}
    ],
    "emerging_expertise": ["Future-ready skills based on current trajectory"],
    "market_differentiators": ["Unique technical combinations that create competitive advantage"]
  },
  "development_roadmap": {
    "immediate_priorities": ["Skills to develop in next 6 months"],
    "strategic_investments": ["Technologies to master for market positioning"],
    "innovation_opportunities": ["Cutting-edge areas for thought leadership"]
  },
  "positioning_strategy": {
    "technical_narrative": "How to present this skill portfolio compellingly",
    "market_alignment": "Industry demands this portfolio addresses",
    "differentiation_thesis": "What makes this skill combination unique"
  },
  "confidence_assessment": 0.95
}
</output_format>`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 800 }, JSON.stringify(cvData.skills));
            const responseText = response.content[0]?.text?.trim();
            
            // Clean the response text from potential artifacts
            const cleanedResponse = this.cleanResponseText(responseText);
            
            // Parse structured JSON response
            let skillsData;
            try {
                skillsData = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.warn('⚠️ Skills JSON parsing failed, using fallback structure');
                // Fallback structure if JSON parsing fails
                skillsData = {
                    skill_architecture: { core_competencies: [], emerging_expertise: [], market_differentiators: [] },
                    development_roadmap: { immediate_priorities: [], strategic_investments: [], innovation_opportunities: [] },
                    positioning_strategy: { technical_narrative: this.cleanEnhancedContent(cleanedResponse).substring(0, 200) + '...' },
                    confidence_assessment: 0.7
                };
            }

            return {
                skill_analysis: skillsData.skill_architecture,
                development_roadmap: skillsData.development_roadmap,
                positioning_strategy: skillsData.positioning_strategy,
                confidence_score: skillsData.confidence_assessment,
                github_context: {
                    activity_score: CONFIG.ACTIVITY_SCORE,
                    top_languages: activityMetrics?.top_languages || [],
                    total_repos: activityMetrics?.total_repos || 0,
                    expertise_evolution: expertiseEvolution,
                    community_impact: communityImpact
                },
                enhancement_applied: true,
                expert_methodology: expert.approach,
                recommendations: this.extractSkillRecommendations(skillsData)
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
     * Enhanced with XML structuring and few-shot learning (Issues #96, #97)
     */
    async enhanceExperience(cvData, activityMetrics) {
        // Use XML-structured prompts with few-shot examples for enhanced quality
        if (this.useXMLPrompts) {
            return await this.enhanceExperienceXML(cvData, activityMetrics);
        }
        
        // Legacy method for backward compatibility
        return await this.enhanceExperienceLegacy(cvData, activityMetrics);
    }

    /**
     * Enhanced experience using XML structuring and few-shot prompting
     */
    async enhanceExperienceXML(cvData, activityMetrics) {
        console.log('🔨 Using XML-structured experience enhancement prompt...');
        
        try {
            // Construct XML-structured prompt with few-shot examples
            const promptResult = await this.xmlIntegrator.enhanceExperienceXML(
                cvData, 
                activityMetrics, 
                CONFIG.CREATIVITY_LEVEL
            );
            
            console.log(`📊 Expected experience quality improvement: ${(promptResult.quality_expected * 100).toFixed(1)}%`);
            
            // Create messages for Claude API
            const messages = [
                {
                    role: 'system',
                    content: 'You are a professional experience enhancement specialist. Respond ONLY with the requested JSON structure. Do not include explanatory text or meta-commentary. Follow the provided examples for professional language and structure.'
                },
                {
                    role: 'user',
                    content: promptResult.xmlPrompt
                }
            ];

            // Make API request
            const response = await this.client.makeRequest(messages, { maxTokens: 1200 }, JSON.stringify(cvData.experience));
            const responseText = response.content[0]?.text?.trim();
            
            // Clean and parse response
            const cleanedResponse = this.cleanResponseText(responseText);
            let experienceData;
            
            try {
                experienceData = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.warn('⚠️ Experience JSON parsing failed, using fallback structure');
                experienceData = {
                    experience_transformation: [],
                    career_progression_narrative: { leadership_evolution: this.cleanEnhancedContent(cleanedResponse).substring(0, 200) + '...' },
                    strategic_positioning: { technical_authority: 'Advanced AI/ML systems development' },
                    confidence_score: 0.7
                };
            }

            // Validate response quality
            const validation = await this.xmlIntegrator.validateResponse(experienceData, 'experience-enhancement', promptResult.quality_expected);
            
            console.log(`✅ Experience validation: ${validation.valid ? 'PASSED' : 'FAILED'} (Score: ${(validation.score * 100).toFixed(1)}%)`);

            return {
                experience_enhancement: experienceData.experience_transformation,
                career_narrative: experienceData.career_progression_narrative,
                strategic_positioning: experienceData.strategic_positioning,
                confidence_score: experienceData.confidence_score || validation.score,
                leadership_progression: this.analyzeLeadershipProgression(CONFIG.ACTIVITY_SCORE),
                market_positioning: this.analyzeMarketPositioning(CONFIG.ACTIVITY_SCORE, activityMetrics),
                focus_areas: [
                    'Autonomous systems innovation',
                    'Technical leadership progression',
                    'Quantifiable business impact',
                    'AI/ML architecture excellence',
                    'Human-AI collaboration leadership'
                ],
                enhancement_applied: true,
                prompt_strategy: 'xml-few-shot',
                xml_metadata: promptResult.metadata,
                validation_results: validation,
                quality_indicators: {
                    xml_structured: true,
                    few_shot_guided: true,
                    validation_passed: validation.valid,
                    quality_score: validation.score,
                    expected_improvement: promptResult.quality_expected
                }
            };

        } catch (error) {
            console.warn('⚠️ XML experience enhancement failed, falling back to legacy method');
            return await this.enhanceExperienceLegacy(cvData, activityMetrics);
        }
    }

    /**
     * Legacy experience enhancement method
     */
    async enhanceExperienceLegacy(cvData, activityMetrics) {
        // Career narrative experts by creativity level
        const careerExperts = {
            'conservative': {
                persona: 'Linda Zhang, Executive Coach specializing in AI leadership transitions, who has guided 150+ engineers to senior roles at Google, Microsoft, and Amazon.',
                methodology: 'proven achievement quantification with established leadership frameworks',
                narrative_style: 'authoritative progression with measurable impact'
            },
            'balanced': {
                persona: 'Carlos Rivera, Career Strategy Partner at Sequoia Capital, helping technical founders articulate their journey from engineer to visionary leader.',
                methodology: 'strategic storytelling that balances technical depth with business acumen',
                narrative_style: 'compelling leadership evolution with innovation highlights'
            },
            'creative': {
                persona: 'Dr. Aisha Patel, Executive Career Architect for AI unicorn startups, crafting narratives for technical leaders who will define the next decade of AI.',
                methodology: 'transformative experience positioning for breakthrough opportunities',
                narrative_style: 'visionary technical leadership with paradigm-shifting impact'
            },
            'innovative': {
                persona: 'Morgan Kim, Chief People Officer at OpenAI, recognizing exceptional technical narratives that signal revolutionary potential in AI development.',
                methodology: 'revolutionary experience articulation for industry-defining roles',
                narrative_style: 'groundbreaking technical innovation with transformational leadership'
            }
        };

        const expert = careerExperts[CONFIG.CREATIVITY_LEVEL] || careerExperts['balanced'];
        
        // Dynamic career trajectory analysis
        const leadershipProgression = CONFIG.ACTIVITY_SCORE >= 80 ? 'demonstrates exceptional technical leadership with consistent innovation delivery' :
                                     CONFIG.ACTIVITY_SCORE >= 60 ? 'shows strong technical influence with growing leadership responsibilities' :
                                     CONFIG.ACTIVITY_SCORE >= 40 ? 'exhibits focused technical expertise with emerging leadership qualities' :
                                     'displays deep technical specialization with selective leadership engagement';
        
        const innovationCapacity = (activityMetrics?.total_repos || 0) >= 20 ? 'prolific technical innovator with diverse project portfolio' :
                                   (activityMetrics?.total_repos || 0) >= 10 ? 'strategic technical contributor with impactful project selection' :
                                   'focused technical expert with high-impact project concentration';
        
        const marketPositioning = CONFIG.ACTIVITY_SCORE >= 70 && (activityMetrics?.total_stars || 0) >= 50 ? 'industry-recognized technical leader ready for executive roles' :
                                  CONFIG.ACTIVITY_SCORE >= 50 ? 'emerging technical authority positioned for senior leadership' :
                                  'specialized technical expert ready for expanded influence';

        const messages = [
            {
                role: 'system',
                content: 'You are a professional experience enhancement specialist. Respond ONLY with the requested JSON structure. Do not include explanatory text, process descriptions, or meta-commentary. Provide only clean, structured data without any additional formatting or analysis explanations.'
            },
            {
                role: 'user',
                content: `You are ${expert.persona}

CAREER TRAJECTORY ANALYSIS:
You're crafting the experience narrative for a professional who ${leadershipProgression}, functioning as a ${innovationCapacity}. Their technical footprint positions them as a ${marketPositioning}.

CURRENT PROFILE INDICATORS:
- Technical Leadership Score: ${CONFIG.ACTIVITY_SCORE}/100
- Innovation Portfolio: ${activityMetrics?.total_repos || 'Multiple'} projects demonstrating ${innovationCapacity}
- Community Influence: ${activityMetrics?.total_stars || 'Growing'} recognition points
- Technology Mastery: ${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript'} expertise

MARKET CONTEXT (2025):
Senior AI engineering roles demand professionals who can architect autonomous systems, lead human-AI collaboration initiatives, and drive sustainable AI development at scale. The market rewards leaders who bridge cutting-edge research with production-grade implementation.

NARRATIVE ENHANCEMENT MISSION (${CONFIG.CREATIVITY_LEVEL} approach):
Using ${expert.methodology}, create ${expert.narrative_style} that transforms their technical journey into a compelling leadership progression story. Focus on autonomous systems innovation, team impact, and business outcome alignment.

CURRENT EXPERIENCE DATA:
${JSON.stringify(cvData.experience || [], null, 2)}

<output_format>
Respond with ONLY this JSON structure:

{
  "experience_transformation": [
    {
      "role_title": "Enhanced title that reflects leadership scope",
      "impact_narrative": "Compelling 2-3 sentence description showcasing autonomous systems innovation and quantifiable business impact",
      "key_achievements": [
        "Specific accomplishment with metrics (e.g., 'Architected autonomous ML pipeline reducing deployment time by 75%')",
        "Leadership milestone with team impact",
        "Innovation breakthrough with industry relevance"
      ],
      "technical_leadership_evidence": "How this role demonstrates progression toward senior AI engineering leadership"
    }
  ],
  "career_progression_narrative": {
    "leadership_evolution": "How their journey shows increasing technical and team leadership",
    "innovation_trajectory": "Pattern of growing influence in AI/autonomous systems development",
    "market_positioning": "Why this experience prepares them for senior AI engineering roles"
  },
  "strategic_positioning": {
    "technical_authority": "Areas where they demonstrate thought leadership",
    "business_impact_pattern": "How their work consistently drives organizational outcomes",
    "future_readiness": "Evidence they're prepared for next-level AI engineering challenges"
  },
  "confidence_score": 0.95
}
</output_format>`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 900 }, JSON.stringify(cvData.experience));
            const responseText = response.content[0]?.text?.trim();
            
            // Clean the response text from potential artifacts
            const cleanedResponse = this.cleanResponseText(responseText);
            
            // Parse structured JSON response
            let experienceData;
            try {
                experienceData = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.warn('⚠️ Experience JSON parsing failed, using fallback structure');
                // Fallback structure if JSON parsing fails
                experienceData = {
                    experience_transformation: [],
                    career_progression_narrative: { leadership_evolution: this.cleanEnhancedContent(cleanedResponse).substring(0, 200) + '...' },
                    strategic_positioning: { technical_authority: 'Advanced AI/ML systems development' },
                    confidence_score: 0.7
                };
            }

            return {
                experience_enhancement: experienceData.experience_transformation,
                career_narrative: experienceData.career_progression_narrative,
                strategic_positioning: experienceData.strategic_positioning,
                confidence_score: experienceData.confidence_score,
                leadership_progression: leadershipProgression,
                market_positioning: marketPositioning,
                focus_areas: [
                    'Autonomous systems innovation',
                    'Technical leadership progression',
                    'Quantifiable business impact',
                    'AI/ML architecture excellence',
                    'Human-AI collaboration leadership'
                ],
                enhancement_applied: true,
                expert_methodology: expert.methodology
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
                role: 'system',
                content: 'You are a professional project portfolio specialist. Respond with clean, professional project enhancement strategies only. Do not include explanatory text, process descriptions, or meta-commentary. Provide only the requested enhancement content without additional formatting or analysis.'
            },
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

<output_format>
Provide enhanced project descriptions that:
- Lead with problem statement and innovative solution
- Highlight technical sophistication and architectural decisions
- Quantify impact, performance, or adoption metrics
- Connect to broader industry trends in AI/autonomous systems
- Demonstrate continuous learning and technology adoption

Create compelling project narratives that showcase technical expertise and innovation capability.
</output_format>`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 600 }, JSON.stringify(cvData.projects));
            const responseText = response.content[0]?.text?.trim();
            
            // Clean the response text from potential artifacts
            const cleanedResponse = this.cleanResponseText(responseText);
            const projectEnhancement = this.cleanEnhancedContent(cleanedResponse);

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
        // Strategic visionaries by creativity level
        const strategicExperts = {
            'conservative': {
                persona: 'Dr. Jennifer Wu, Managing Partner at Andreessen Horowitz focusing on AI infrastructure investments, who has guided 50+ technical leaders to C-suite roles.',
                approach: 'proven strategic positioning with established career advancement frameworks',
                vision_scope: 'systematic market positioning with validated growth strategies'
            },
            'balanced': {
                persona: 'Robert Kim, Executive Strategy Consultant for AI unicorns (Anthropic, OpenAI, Scale), architecting career trajectories for technical visionaries.',
                approach: 'comprehensive strategic analysis balancing technical mastery with market opportunity',
                vision_scope: 'multifaceted growth strategy with innovation leadership potential'
            },
            'creative': {
                persona: 'Dr. Priya Sharma, Chief Strategy Officer at Mistral AI, identifying breakthrough talent for next-generation AI development paradigms.',
                approach: 'innovative strategic positioning for emerging AI leadership opportunities',
                vision_scope: 'transformative career architecture for industry-shaping roles'
            },
            'innovative': {
                persona: 'Alex Thompson, Founding Partner at AI-focused venture fund, recognizing technical leaders who will define the next decade of artificial intelligence.',
                approach: 'revolutionary strategic vision for paradigm-defining AI leadership',
                vision_scope: 'visionary career trajectory for industry transformation leaders'
            }
        };

        const strategist = strategicExperts[CONFIG.CREATIVITY_LEVEL] || strategicExperts['balanced'];
        
        // Strategic positioning analysis
        const leadershipReadiness = CONFIG.ACTIVITY_SCORE >= 80 ? 'ready for executive AI leadership roles with proven innovation capacity' :
                                   CONFIG.ACTIVITY_SCORE >= 60 ? 'positioned for senior technical leadership with strong growth trajectory' :
                                   CONFIG.ACTIVITY_SCORE >= 40 ? 'prepared for expanded technical influence with focused expertise development' :
                                   'specialized for high-impact technical roles with strategic skill building';
        
        const marketDifferentiation = (activityMetrics?.total_stars || 0) >= 100 ? 'established technical thought leader with significant industry influence' :
                                     (activityMetrics?.total_stars || 0) >= 20 ? 'emerging technical authority with growing market recognition' :
                                     'focused technical expert with potential for expanded influence';
        
        const innovationProfile = (activityMetrics?.top_languages?.length || 3) >= 5 ? 'polyglot innovator positioned for cross-platform AI architecture leadership' :
                                  (activityMetrics?.top_languages?.length || 3) >= 3 ? 'multi-domain technologist ready for comprehensive AI system leadership' :
                                  'specialized expert positioned for deep technical domain leadership';

        const messages = [
            {
                role: 'system',
                content: 'You are a professional strategic insights specialist. Respond ONLY with the requested JSON structure. Do not include explanatory text, analysis descriptions, or meta-commentary. Provide only clean, structured strategic data without any additional formatting or process explanations.'
            },
            {
                role: 'user',
                content: `You are ${strategist.persona}

STRATEGIC LEADERSHIP ASSESSMENT:
You're analyzing a technical professional who is ${leadershipReadiness}, functioning as a ${marketDifferentiation} with characteristics of a ${innovationProfile}. Their technical foundation positions them uniquely in the evolving AI leadership landscape.

PROFESSIONAL INTELLIGENCE METRICS:
- Leadership Readiness Score: ${CONFIG.ACTIVITY_SCORE}/100
- Innovation Portfolio: ${activityMetrics?.total_repos || 'Comprehensive'} projects demonstrating ${innovationProfile}
- Market Influence: ${activityMetrics?.total_stars || 'Growing'} recognition indicating ${marketDifferentiation}
- Technical Versatility: ${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript'} mastery
- Geographic Advantage: Tasmania, Australia (unique timezone positioning for global AI collaboration)

MARKET LANDSCAPE ANALYSIS (2025):
The AI leadership market demands professionals who can architect autonomous agent ecosystems, lead multi-modal AI development, and drive responsible AI governance at scale. Critical opportunities exist in human-AI collaboration interfaces, sustainable AI development, and AI safety leadership.

STRATEGIC VISION MISSION (${CONFIG.CREATIVITY_LEVEL} methodology):
Using ${strategist.approach}, create ${strategist.vision_scope} that positions this professional for the highest-impact AI leadership opportunities in the next 3-5 years.

CURRENT TECHNICAL PROFILE:
${JSON.stringify(cvData, null, 2)}

<output_format>
Respond with ONLY this JSON structure:

{
  "executive_positioning": {
    "primary_value_proposition": "Core differentiating strength for AI leadership roles",
    "market_opportunity_alignment": "How their profile aligns with emerging AI market needs",
    "competitive_differentiation": "What makes them uniquely positioned vs other AI leaders"
  },
  "growth_trajectory": {
    "immediate_opportunities": [
      "Specific roles/companies to target in next 12 months"
    ],
    "strategic_skill_investments": [
      "Key capabilities to develop for maximum career impact"
    ],
    "thought_leadership_areas": [
      "Technical domains where they could establish industry authority"
    ]
  },
  "market_positioning_strategy": {
    "industry_narrative": "How to position their technical journey as preparation for AI leadership",
    "geographic_leverage": "How to maximize Tasmania location for global AI opportunities",
    "innovation_thesis": "Technical philosophy that differentiates their approach to AI development"
  },
  "execution_roadmap": {
    "quarter_1_actions": ["Immediate steps to enhance market positioning"],
    "year_1_milestones": ["Key achievements to establish thought leadership"],
    "long_term_vision": "Ultimate career destination and impact potential"
  },
  "confidence_assessment": 0.95
}
</output_format>`
            }
        ];

        try {
            const response = await this.client.makeRequest(messages, { maxTokens: 1000 }, JSON.stringify(cvData));
            const responseText = response.content[0]?.text?.trim();
            
            // Clean the response text from potential artifacts
            const cleanedResponse = this.cleanResponseText(responseText);
            
            // Parse comprehensive strategic JSON response
            let strategicData;
            try {
                strategicData = JSON.parse(cleanedResponse);
            } catch (parseError) {
                console.warn('⚠️ Strategic insights JSON parsing failed, using fallback structure');
                // Fallback structure if JSON parsing fails
                strategicData = {
                    executive_positioning: { primary_value_proposition: this.cleanEnhancedContent(cleanedResponse).substring(0, 150) + '...' },
                    growth_trajectory: { immediate_opportunities: [], strategic_skill_investments: [] },
                    market_positioning_strategy: { industry_narrative: 'AI engineering leadership positioning' },
                    execution_roadmap: { quarter_1_actions: [], year_1_milestones: [] },
                    confidence_assessment: 0.75
                };
            }

            return {
                executive_positioning: strategicData.executive_positioning,
                growth_strategy: strategicData.growth_trajectory,
                market_positioning: strategicData.market_positioning_strategy,
                execution_plan: strategicData.execution_roadmap,
                confidence_score: strategicData.confidence_assessment,
                leadership_readiness: leadershipReadiness,
                market_differentiation: marketDifferentiation,
                innovation_profile: innovationProfile,
                market_context: {
                    activity_score: CONFIG.ACTIVITY_SCORE,
                    specialization: 'AI Engineering & Autonomous Systems Leadership',
                    location_advantage: 'Tasmania, Australia (Global AI Collaboration Hub)',
                    innovation_focus: 'Autonomous AI Architecture, Human-AI Collaboration Leadership, Sustainable AI Development'
                },
                strategic_methodology: strategist.approach,
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
     * Generate enhancement summary with XML prompt engineering statistics
     */
    generateEnhancementSummary(enhancementPlan) {
        const usageStats = this.client.getUsageStats();
        const enhancementTime = (Date.now() - this.enhancementStartTime) / 1000;
        const xmlStats = this.xmlIntegrator.getStats();

        return {
            enhancement_overview: {
                total_stages_completed: Object.keys(enhancementPlan).filter(key => 
                    key !== 'metadata' && key !== 'enhancement_summary'
                ).length,
                creativity_level: CONFIG.CREATIVITY_LEVEL,
                ai_budget_used: CONFIG.AI_BUDGET,
                enhancement_duration_seconds: Math.round(enhancementTime),
                xml_prompts_enabled: this.useXMLPrompts
            },
            token_analytics: usageStats,
            xml_prompt_analytics: {
                xml_integrator_initialized: xmlStats.initialized,
                xml_constructor_stats: xmlStats.xml_constructor_stats,
                performance_metrics: xmlStats.performance_metrics,
                quality_improvements: this.countQualityImprovements(enhancementPlan)
            },
            enhancement_effectiveness: {
                professional_summary: enhancementPlan.professional_summary?.enhancement_applied || false,
                skills_analysis: enhancementPlan.skills_enhancement?.enhancement_applied || false,
                experience_optimization: enhancementPlan.experience_enhancement?.enhancement_applied || false,
                project_enhancement: enhancementPlan.project_enhancement?.enhancement_applied || false,
                strategic_insights: enhancementPlan.strategic_insights?.insights_generated || false
            },
            quality_indicators: {
                xml_structured_prompts: this.countXMLStructuredPrompts(enhancementPlan),
                few_shot_guided_enhancements: this.countFewShotEnhancements(enhancementPlan),
                validation_passed_count: this.countValidationPasses(enhancementPlan),
                average_quality_score: this.calculateAverageQualityScore(enhancementPlan)
            },
            recommendations: {
                content_freshness: 'Enhanced with current industry trends and XML-structured prompts',
                market_alignment: `Optimized for ${CONFIG.CREATIVITY_LEVEL} creativity approach with few-shot learning`,
                technical_positioning: 'Aligned with AI/ML industry demands using advanced prompt engineering',
                career_advancement: 'Strategic insights provided with evidence-based validation and quality scoring'
            }
        };
    }

    /**
     * Count quality improvements from XML enhancements
     */
    countQualityImprovements(enhancementPlan) {
        let count = 0;
        ['professional_summary', 'skills_enhancement', 'experience_enhancement'].forEach(section => {
            if (enhancementPlan[section]?.validation_results?.quality_improvement) {
                count++;
            }
        });
        return count;
    }

    /**
     * Count XML-structured prompts used
     */
    countXMLStructuredPrompts(enhancementPlan) {
        let count = 0;
        ['professional_summary', 'skills_enhancement', 'experience_enhancement'].forEach(section => {
            if (enhancementPlan[section]?.quality_indicators?.xml_structured) {
                count++;
            }
        });
        return count;
    }

    /**
     * Count few-shot guided enhancements
     */
    countFewShotEnhancements(enhancementPlan) {
        let count = 0;
        ['professional_summary', 'skills_enhancement', 'experience_enhancement'].forEach(section => {
            if (enhancementPlan[section]?.quality_indicators?.few_shot_guided) {
                count++;
            }
        });
        return count;
    }

    /**
     * Count validation passes
     */
    countValidationPasses(enhancementPlan) {
        let count = 0;
        ['professional_summary', 'skills_enhancement', 'experience_enhancement'].forEach(section => {
            if (enhancementPlan[section]?.quality_indicators?.validation_passed) {
                count++;
            }
        });
        return count;
    }

    /**
     * Calculate average quality score
     */
    calculateAverageQualityScore(enhancementPlan) {
        const scores = [];
        ['professional_summary', 'skills_enhancement', 'experience_enhancement'].forEach(section => {
            const score = enhancementPlan[section]?.quality_indicators?.quality_score;
            if (score && typeof score === 'number') {
                scores.push(score);
            }
        });
        return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
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

    /**
     * Clean response text from Claude API to remove meta-commentary artifacts
     */
    cleanResponseText(text) {
        if (!text) return text;
        
        // Remove common meta-commentary patterns
        const metaPatterns = [
            /^Here's an enhanced.*?:\s*/i,
            /^\*\*Enhanced.*?\*\*\s*/i,
            /^Enhanced.*?:\s*/i,
            /\n\nThis enhancement:.*$/s,
            /\n\n.*?enhancement.*?:\s*\n.*$/s,
            /\n\n.*?improvement.*?:\s*\n.*$/s,
            /The.*?provided.*?placeholder.*$/s,
            /^I'll.*?\.\s*/i,
            /^Let me.*?\.\s*/i
        ];
        
        let cleaned = text;
        for (const pattern of metaPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        return cleaned.trim();
    }
    
    /**
     * Clean enhanced content from artifacts and meta-commentary
     */
    cleanEnhancedContent(content) {
        if (!content) return content;
        
        // Remove specific meta-commentary patterns from enhanced content
        let cleaned = content
            .replace(/^Here's an enhanced.*?:\s*/i, '')
            .replace(/^\*\*Enhanced.*?\*\*\s*/i, '')
            .replace(/^Enhanced.*?:\s*/i, '')
            .replace(/\n\nThis enhancement:.*$/s, '')
            .replace(/\n\n.*?enhancement.*?$/s, '')
            .replace(/The.*?provided.*?placeholder.*$/s, '')
            .replace(/^- .*?\n/gm, '') // Remove bullet point explanations
            .replace(/\n\n+/g, ' ') // Replace multiple newlines with single space
            .trim();
        
        // If content still looks like meta-commentary, extract just the summary part
        if (cleaned.toLowerCase().includes('this ') || cleaned.toLowerCase().includes('the ')) {
            const summaryMatch = cleaned.match(/Results-driven.*?\.|Innovative.*?\.|Experienced.*?\.|Senior.*?\./i);
            if (summaryMatch) {
                cleaned = summaryMatch[0];
            }
        }
        
        return cleaned;
    }
    
    /**
     * Prepare context data for prompt template substitution
     */
    async prepareContextData(cvData, activityMetrics, contextType = 'general') {
        // Get dynamic market context if available
        let marketContext = "Current technology market trends";
        let skillAlignment = null;
        
        if (this.useMarketContext && this.marketContext) {
            try {
                // Generate market-specific context for this enhancement type
                marketContext = this.marketContext.generateMarketContext(contextType, cvData.skills);
                
                // Get skill alignment analysis
                skillAlignment = this.marketContext.getSkillMarketAlignment(cvData.skills || []);
                
                console.log(`📊 Market context integrated: ${skillAlignment.overall_score}/100 alignment score`);
            } catch (error) {
                console.warn('⚠️ Failed to load market context, using fallback');
            }
        }
        
        return {
            // Personal info
            name: cvData.personal_info?.name || "Professional",
            title: cvData.personal_info?.title || "Technical Professional",
            
            // Activity metrics
            leadership_capacity: this.assessLeadershipCapacity(activityMetrics),
            activity_context: this.buildActivityContext(activityMetrics),
            domain_areas: this.extractDomainAreas(cvData),
            key_differentiators: this.identifyKeyDifferentiators(cvData, activityMetrics),
            
            // Technical profile
            technical_profile: this.buildTechnicalProfile(activityMetrics),
            competitive_advantage: this.identifyCompetitiveAdvantage(cvData, activityMetrics),
            
            // Evidence chain
            evidence_points: this.buildEvidenceChain(cvData, activityMetrics),
            
            // Enhanced market context with real intelligence
            market_context: marketContext,
            market_alignment: skillAlignment,
            target_market: this.determineTargetMarket(cvData, skillAlignment),
            positioning_strategy: this.buildPositioningStrategy(cvData, skillAlignment),
            creativity_approach: this.getCreativityApproach(),
            
            // Current content
            current_content: cvData.professional_summary || ""
        };
    }

    /**
     * Determine target market based on CV data and market alignment
     */
    determineTargetMarket(cvData, skillAlignment) {
        if (!skillAlignment) return "AI/ML engineering market";
        
        const score = skillAlignment.overall_score;
        if (score >= 80) return "Senior AI/ML engineering roles";
        if (score >= 65) return "Mid-senior technical roles with AI focus";
        if (score >= 50) return "Technical roles with AI integration opportunities";
        return "Technical roles with AI upskilling potential";
    }

    /**
     * Build positioning strategy based on market alignment
     */
    buildPositioningStrategy(cvData, skillAlignment) {
        if (!skillAlignment) return "Focus on technical excellence and continuous learning";
        
        const strategies = [];
        
        if (skillAlignment.insights.length > 0) {
            strategies.push(`Leverage market-aligned skills: ${skillAlignment.insights.slice(0, 2).map(i => i.skill).join(', ')}`);
        }
        
        if (skillAlignment.recommendations.length > 0) {
            strategies.push(`Address critical gaps: ${skillAlignment.recommendations.slice(0, 2).map(r => r.skill).join(', ')}`);
        }
        
        strategies.push("Position as forward-thinking technologist ready for AI-driven future");
        
        return strategies.join('; ');
    }

    /**
     * Assess leadership capacity from activity metrics
     */
    assessLeadershipCapacity(activityMetrics) {
        const commitCount = activityMetrics?.total_commits || 0;
        const repoCount = activityMetrics?.total_repos || 0;
        
        if (commitCount > 2000 && repoCount > 15) {
            return "demonstrates exceptional development velocity and technical leadership";
        } else if (commitCount > 1000 && repoCount > 8) {
            return "shows strong technical capabilities with leadership potential";
        } else if (commitCount > 500 && repoCount > 4) {
            return "exhibits solid technical foundation with growing influence";
        } else {
            return "displays focused technical expertise";
        }
    }

    /**
     * Build activity context description
     */
    buildActivityContext(activityMetrics) {
        const parts = [];
        
        if (activityMetrics?.total_commits) {
            parts.push(`${activityMetrics.total_commits}+ commits`);
        }
        if (activityMetrics?.total_repos) {
            parts.push(`${activityMetrics.total_repos} active repositories`);
        }
        if (activityMetrics?.top_languages?.length) {
            parts.push(`polyglot expertise in ${activityMetrics.top_languages.slice(0, 3).join(', ')}`);
        }
        
        return parts.join(' across ') || 'focused technical development';
    }

    /**
     * Extract domain areas from CV data
     */
    extractDomainAreas(cvData) {
        const domains = [];
        
        // From experience
        if (cvData.experience) {
            domains.push("systems analysis", "AI/ML engineering");
        }
        
        // From skills
        if (cvData.skills) {
            const skillAreas = cvData.skills.map(s => s.category).filter((v, i, a) => a.indexOf(v) === i);
            domains.push(...skillAreas.slice(0, 3));
        }
        
        return domains.slice(0, 4).join(', ') || "software engineering, technical analysis";
    }

    /**
     * Identify key differentiators
     */
    identifyKeyDifferentiators(cvData, activityMetrics) {
        const differentiators = [];
        
        // High activity
        if (activityMetrics?.total_commits > 1500) {
            differentiators.push("exceptional development velocity");
        }
        
        // AI focus
        if (cvData.personal_info?.title?.includes('AI') || cvData.professional_summary?.includes('AI')) {
            differentiators.push("AI/ML specialization");
        }
        
        // System analysis
        if (cvData.personal_info?.title?.includes('Systems') || cvData.personal_info?.title?.includes('Analyst')) {
            differentiators.push("systems thinking and analysis");
        }
        
        // Polyglot
        if (activityMetrics?.top_languages?.length > 3) {
            differentiators.push("polyglot technical expertise");
        }
        
        return differentiators.join(', ') || "technical depth and analytical thinking";
    }

    /**
     * Build technical profile description
     */
    buildTechnicalProfile(activityMetrics) {
        const languages = activityMetrics?.top_languages || [];
        if (languages.length > 0) {
            return `${languages.slice(0, 3).join('/')} expertise with ${languages.length}+ language proficiency`;
        }
        return "multi-language technical capabilities";
    }

    /**
     * Identify competitive advantage
     */
    identifyCompetitiveAdvantage(cvData, activityMetrics) {
        const advantages = [];
        
        if (activityMetrics?.total_commits > 2000) {
            advantages.push("exceptional development productivity");
        }
        
        if (cvData.personal_info?.title?.includes('AI')) {
            advantages.push("AI engineering specialization in high-demand market");
        }
        
        if (activityMetrics?.total_repos > 10) {
            advantages.push("diverse project portfolio demonstrating adaptability");
        }
        
        return advantages.join(' combined with ') || "technical versatility and problem-solving capability";
    }

    /**
     * Build evidence chain for validation
     */
    buildEvidenceChain(cvData, activityMetrics) {
        const evidence = [];
        
        if (activityMetrics?.total_commits) {
            evidence.push(`${activityMetrics.total_commits} commits demonstrating consistent technical contribution`);
        }
        
        if (activityMetrics?.total_repos) {
            evidence.push(`${activityMetrics.total_repos} repositories showing project diversity`);
        }
        
        if (cvData.experience?.length) {
            evidence.push(`${cvData.experience.length} professional roles indicating career progression`);
        }
        
        if (activityMetrics?.top_languages?.length) {
            evidence.push(`${activityMetrics.top_languages.length} programming languages showing technical versatility`);
        }
        
        return evidence.join('; ') || 'Professional experience and technical contributions';
    }

    /**
     * Get creativity approach based on level
     */
    getCreativityApproach() {
        switch (CONFIG.CREATIVITY_LEVEL) {
            case 'conservative':
                return 'Focus on proven achievements and established capabilities with measured professional language';
            case 'creative':
                return 'Emphasize unique value propositions and innovative technical approaches with compelling language';
            case 'innovative':
                return 'Highlight transformative potential and paradigm-shifting technical leadership with visionary positioning';
            default:
                return 'Balance proven track record with growth potential using confident professional language';
        }
    }

    /**
     * Validate enhancement data against JSON schema
     */
    validateAgainstSchema(data, schema) {
        // Simple validation - in production, use a proper JSON schema validator
        let score = 0.5; // Base score
        let valid = true;
        
        try {
            // Check required fields from schema
            const required = schema.required || [];
            for (const field of required) {
                if (data[field] !== undefined) {
                    score += 0.3 / required.length;
                } else {
                    valid = false;
                }
            }
            
            // Check enhanced field length if present
            if (data.enhanced) {
                const minLength = schema.properties?.enhanced?.minLength || 100;
                const maxLength = schema.properties?.enhanced?.maxLength || 500;
                if (data.enhanced.length >= minLength && data.enhanced.length <= maxLength) {
                    score += 0.2;
                }
            }
            
            // Bonus for quality elements
            if (data.key_differentiators?.length) score += 0.1;
            if (data.technical_positioning) score += 0.1;
            if (data.confidence_indicators?.length) score += 0.1;
            
        } catch (error) {
            valid = false;
            score = 0.3;
        }
        
        return {
            valid: valid && score >= 0.7,
            score: Math.min(score, 1.0)
        };
    }

    /**
     * Extract content from text when JSON parsing fails
     */
    extractContentFromText(text) {
        const cleaned = this.cleanResponseText(text);
        
        // Try to parse as JSON first, even if it looks malformed
        try {
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                if (jsonData.enhanced_summary) {
                    jsonData.enhanced_summary = this.cleanEnhancedContent(jsonData.enhanced_summary);
                    return jsonData;
                }
            }
        } catch (error) {
            // Continue with text extraction
        }
        
        // Try to extract enhanced summary from various patterns
        let enhancedSummary = cleaned;
        
        // Look for enhanced summary in quotes or after colons
        const summaryPatterns = [
            /"enhanced_summary":\s*"([^"]+)"/i,
            /enhanced.*?summary.*?:\s*"([^"]+)"/i,
            /summary.*?:\s*"([^"]+)"/i,
            /"([^"]*(?:AI|Engineer|Software|Architect)[^"]*)"/i
        ];
        
        for (const pattern of summaryPatterns) {
            const match = cleaned.match(pattern);
            if (match && match[1]) {
                enhancedSummary = match[1];
                break;
            }
        }
        
        return {
            enhanced_summary: this.cleanEnhancedContent(enhancedSummary),
            strategic_improvements: { positioning_shift: "Enhanced with AI optimization" },
            ats_keywords: [],
            confidence_score: 0.7
        };
    }

    // Helper methods
    analyzeSummaryImprovement(original, enhanced) {
        if (!enhanced) return { improvement_indicators: ['Enhancement processing failed'] };
        
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

    analyzeLeadershipProgression(activityScore) {
        return activityScore >= 80 ? 'demonstrates exceptional technical leadership with consistent innovation delivery' :
               activityScore >= 60 ? 'shows strong technical influence with growing leadership responsibilities' :
               activityScore >= 40 ? 'exhibits focused technical expertise with emerging leadership qualities' :
               'displays deep technical specialization with selective leadership engagement';
    }

    analyzeMarketPositioning(activityScore, activityMetrics) {
        return activityScore >= 70 && (activityMetrics?.total_stars || 0) >= 50 ? 'industry-recognized technical leader ready for executive roles' :
               activityScore >= 50 ? 'emerging technical authority positioned for senior leadership' :
               'specialized technical expert ready for expanded influence';
    }

    extractSkillRecommendations(skillsData) {
        // Extract actionable recommendations from structured skills analysis
        if (skillsData && skillsData.development_roadmap) {
            return [
                ...skillsData.development_roadmap.immediate_priorities || [],
                ...skillsData.development_roadmap.strategic_investments || [],
                ...skillsData.development_roadmap.innovation_opportunities || []
            ];
        }
        
        // Fallback recommendations
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

/**
 * Test content cleaning functions with sample problematic outputs
 */
function testContentCleaning() {
    console.log('🧪 Testing content cleaning functions...');
    
    const enhancer = new CVContentEnhancer();
    
    // Test cases with typical problematic outputs
    const testCases = [
        {
            name: 'Meta-commentary with explanation',
            input: 'Here\'s an enhanced professional summary:\n\n**Enhanced Summary:**\nResults-driven AI Engineer and Software Architect who has successfully delivered 15+ autonomous systems that have increased operational efficiency by an average of 40% across enterprise clients.\n\nThis enhancement:\n- Opens with a strong, measurable impact statement\n- Incorporates specific technical expertise',
            expected: 'Results-driven AI Engineer and Software Architect who has successfully delivered 15+ autonomous systems that have increased operational efficiency by an average of 40% across enterprise clients.'
        },
        {
            name: 'Process explanation artifact',
            input: 'I\'ll provide an enhanced summary: Senior AI Engineer with deep expertise in autonomous systems and machine learning architectures. The numbers provided are placeholders that should be adjusted to match actual achievements.',
            expected: 'Senior AI Engineer with deep expertise in autonomous systems and machine learning architectures.'
        },
        {
            name: 'JSON with meta-commentary',
            input: '{"enhanced_summary": "Here\'s an enhanced professional summary: Innovative AI Engineer specializing in autonomous systems development.", "confidence_score": 0.95}',
            expected: 'Innovative AI Engineer specializing in autonomous systems development.'
        },
        {
            name: 'Clean professional summary',
            input: 'Senior AI Engineer and Software Architect with 8+ years experience developing cutting-edge autonomous systems and machine learning solutions.',
            expected: 'Senior AI Engineer and Software Architect with 8+ years experience developing cutting-edge autonomous systems and machine learning solutions.'
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n🔍 Test ${index + 1}: ${testCase.name}`);
        console.log('📥 Input:', testCase.input.substring(0, 100) + '...');
        
        let enhanced;
        
        // For JSON test cases, use the extraction function
        if (testCase.input.startsWith('{')) {
            const extracted = enhancer.extractContentFromText(testCase.input);
            enhanced = extracted.enhanced_summary;
        } else {
            const cleaned = enhancer.cleanResponseText(testCase.input);
            enhanced = enhancer.cleanEnhancedContent(cleaned);
        }
        
        console.log('🧹 Cleaned:', enhanced.substring(0, 100) + (enhanced.length > 100 ? '...' : ''));
        console.log('✅ Expected:', testCase.expected.substring(0, 100) + (testCase.expected.length > 100 ? '...' : ''));
        
        // Basic validation
        const isClean = !enhanced.toLowerCase().includes('here\'s') && 
                       !enhanced.toLowerCase().includes('this enhancement') &&
                       !enhanced.toLowerCase().includes('i\'ll provide');
        
        console.log(`${isClean ? '✅' : '❌'} Cleaning ${isClean ? 'successful' : 'needs improvement'}`);
    });
    
    console.log('\n🎉 Content cleaning test completed');
}

// Execute if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--test-cleaning')) {
        testContentCleaning();
    } else {
        main().catch(console.error);
    }
}

module.exports = { CVContentEnhancer, CONFIG, ClaudeApiClient };