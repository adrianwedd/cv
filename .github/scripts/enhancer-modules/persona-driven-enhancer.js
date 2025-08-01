#!/usr/bin/env node

/**
 * Persona-Driven Enhancement System
 * 
 * Dynamic persona selection and orchestration for context-aware CV enhancement.
 * Leverages the Prompt Library v2.0 system with intelligent persona matching.
 * 
 * Features:
 * - Context-aware persona selection based on CV content analysis
 * - Multi-persona consensus for complex enhancements
 * - Persona specialization mapping for optimal results
 * - Enhancement quality scoring with persona effectiveness tracking
 * - Adaptive persona switching based on content type
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Persona expertise mapping for intelligent selection
 */
const PERSONA_EXPERTISE = {
    'senior-technical-recruiter': {
        specializations: ['technical_screening', 'skill_assessment', 'culture_fit'],
        sections: ['professional_summary', 'skills', 'technical_achievements'],
        keywords: ['technical', 'engineering', 'development', 'architecture', 'systems'],
        industries: ['technology', 'software', 'AI', 'ML', 'cloud'],
        seniority_focus: ['senior', 'lead', 'principal', 'staff'],
        effectiveness_score: 0.85
    },
    'technical-assessment-specialist': {
        specializations: ['skill_validation', 'proficiency_scoring', 'gap_analysis'],
        sections: ['skills', 'technical_projects', 'certifications'],
        keywords: ['proficiency', 'expertise', 'competency', 'certification', 'assessment'],
        industries: ['technology', 'engineering', 'data science'],
        seniority_focus: ['all'],
        effectiveness_score: 0.90
    },
    'executive-recruiter': {
        specializations: ['leadership', 'strategic_impact', 'business_value'],
        sections: ['professional_summary', 'experience', 'achievements'],
        keywords: ['leadership', 'strategy', 'impact', 'revenue', 'transformation'],
        industries: ['all'],
        seniority_focus: ['senior', 'director', 'VP', 'C-level'],
        effectiveness_score: 0.88
    },
    'technical-product-manager': {
        specializations: ['product_impact', 'user_value', 'technical_innovation'],
        sections: ['projects', 'product_achievements', 'innovations'],
        keywords: ['product', 'user', 'impact', 'innovation', 'solution'],
        industries: ['technology', 'product', 'startup'],
        seniority_focus: ['mid', 'senior', 'lead'],
        effectiveness_score: 0.87
    }
};

/**
 * Context analysis weights for persona selection
 */
const CONTEXT_WEIGHTS = {
    section_match: 0.3,
    keyword_relevance: 0.25,
    industry_alignment: 0.2,
    seniority_match: 0.15,
    historical_effectiveness: 0.1
};

/**
 * Persona-Driven Enhancement Orchestrator
 */
class PersonaDrivenEnhancer {
    constructor(promptLibrary = null, cvData = null, activityMetrics = null) {
        this.promptLibrary = promptLibrary;
        this.cvData = cvData;
        this.activityMetrics = activityMetrics;
        this.personaHistory = new Map();
        this.enhancementCache = new Map();
        this.initialized = false;
        
        // Track persona effectiveness over time
        this.personaMetrics = {
            usage_count: {},
            success_rate: {},
            quality_scores: {}
        };
    }

    /**
     * Initialize the persona-driven enhancer with required dependencies
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🎭 Initializing Persona-Driven Enhancement System...');
        
        try {
            // Initialize prompt library if not provided
            if (!this.promptLibrary) {
                const { PromptLibraryManager } = require('./prompt-library-manager');
                this.promptLibrary = new PromptLibraryManager('v2.0');
                await this.promptLibrary.initialize();
            }

            // Load CV data if not provided
            if (!this.cvData) {
                const fs = require('fs').promises;
                const path = require('path');
                const cvPath = path.join(__dirname, '../../../data/base-cv.json');
                try {
                    const cvContent = await fs.readFile(cvPath, 'utf-8');
                    this.cvData = JSON.parse(cvContent);
                } catch (error) {
                    console.warn('⚠️ Could not load CV data, using minimal fallback');
                    this.cvData = { experience: [], skills: [], projects: [] };
                }
            }

            // Load activity metrics if not provided
            if (!this.activityMetrics) {
                try {
                    const activityPath = path.join(__dirname, '../../../data/activity-summary.json');
                    const activityContent = await fs.readFile(activityPath, 'utf-8');
                    this.activityMetrics = JSON.parse(activityContent);
                } catch (error) {
                    console.warn('⚠️ Could not load activity metrics, using minimal fallback');
                    this.activityMetrics = { score: 50, recent_activity: {} };
                }
            }

            this.initialized = true;
            console.log('✅ Persona-Driven Enhancement System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize PersonaDrivenEnhancer:', error);
            throw error;
        }
    }

    /**
     * Select optimal persona for given enhancement context (overloaded method)
     */
    async selectOptimalPersona(sectionOrContext, content = null, enhancementType = null) {
        // Handle both call formats: (contextObject) or (section, content, enhancementType)
        let section, actualContent, actualEnhancementType;
        
        if (typeof sectionOrContext === 'object' && sectionOrContext !== null) {
            // Context object format
            const context = sectionOrContext;
            section = context.section;
            actualContent = context.content;
            actualEnhancementType = context.enhancementType || 'standard';
        } else {
            // Individual parameters format
            section = sectionOrContext;
            actualContent = content;
            actualEnhancementType = enhancementType || 'standard';
        }
        console.log(`🎭 Selecting optimal persona for ${section} enhancement...`);
        
        const analysisContext = await this.analyzeContext(section, actualContent, actualEnhancementType);
        const personaScores = new Map();
        
        // Score each persona based on context
        for (const [personaId, expertise] of Object.entries(PERSONA_EXPERTISE)) {
            const score = this.calculatePersonaScore(personaId, expertise, analysisContext);
            personaScores.set(personaId, score);
        }
        
        // Sort by score and select top persona
        const sortedPersonas = Array.from(personaScores.entries())
            .sort((a, b) => b[1] - a[1]);
        
        const selectedPersona = sortedPersonas[0][0];
        const confidence = sortedPersonas[0][1];
        
        console.log(`✅ Selected persona: ${selectedPersona} (confidence: ${(confidence * 100).toFixed(1)}%)`);
        
        // Log alternatives for transparency
        if (sortedPersonas.length > 1) {
            console.log(`📊 Alternative personas:`);
            sortedPersonas.slice(1, 3).forEach(([persona, score]) => {
                console.log(`   - ${persona}: ${(score * 100).toFixed(1)}%`);
            });
        }
        
        return {
            name: selectedPersona,
            personaId: selectedPersona,
            confidence: Math.round(confidence * 100),
            rationale: this.generateSelectionRationale(selectedPersona, analysisContext)
        };
    }

    /**
     * Analyze context for persona selection
     */
    async analyzeContext(section, content, enhancementType) {
        const context = {
            section,
            enhancementType,
            content_length: content ? content.length : 0,
            keywords: this.extractKeywords(content),
            detected_industry: this.detectIndustry(this.cvData),
            seniority_level: this.detectSeniorityLevel(this.cvData),
            technical_depth: this.assessTechnicalDepth(content),
            business_focus: this.assessBusinessFocus(content)
        };
        
        // Add activity-based context
        if (this.activityMetrics) {
            context.activity_score = this.activityMetrics.summary?.activity_score || 0;
            context.primary_languages = this.activityMetrics.summary?.top_languages || [];
            context.contribution_velocity = this.activityMetrics.summary?.commits_per_day || 0;
        }
        
        return context;
    }

    /**
     * Calculate persona fitness score for given context
     */
    calculatePersonaScore(personaId, expertise, context) {
        let score = 0;
        
        // Section match scoring
        if (expertise.sections.includes(context.section)) {
            score += CONTEXT_WEIGHTS.section_match;
        }
        
        // Keyword relevance scoring
        const keywordMatches = context.keywords.filter(kw => 
            expertise.keywords.some(ek => kw.toLowerCase().includes(ek.toLowerCase()))
        ).length;
        const keywordScore = Math.min(keywordMatches / 5, 1); // Cap at 5 matches
        score += keywordScore * CONTEXT_WEIGHTS.keyword_relevance;
        
        // Industry alignment
        if (expertise.industries.includes('all') || 
            expertise.industries.includes(context.detected_industry)) {
            score += CONTEXT_WEIGHTS.industry_alignment;
        }
        
        // Seniority match
        if (expertise.seniority_focus.includes('all') ||
            expertise.seniority_focus.includes(context.seniority_level)) {
            score += CONTEXT_WEIGHTS.seniority_match;
        }
        
        // Historical effectiveness (if available)
        const historicalScore = this.getHistoricalEffectiveness(personaId, context.section);
        score += historicalScore * CONTEXT_WEIGHTS.historical_effectiveness;
        
        // Apply expertise effectiveness multiplier
        score *= expertise.effectiveness_score;
        
        return score;
    }

    /**
     * Extract relevant keywords from content
     */
    extractKeywords(content) {
        if (!content) return [];
        
        // Common tech and business keywords to look for
        const keywordPatterns = [
            /\b(AI|ML|machine learning|artificial intelligence)\b/gi,
            /\b(cloud|AWS|Azure|GCP|kubernetes|docker)\b/gi,
            /\b(leadership|strategy|management|director|executive)\b/gi,
            /\b(product|user experience|innovation|solution)\b/gi,
            /\b(revenue|growth|transformation|optimization)\b/gi,
            /\b(technical|engineering|architecture|development)\b/gi,
            /\b(data|analytics|insights|metrics)\b/gi
        ];
        
        const keywords = [];
        keywordPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                keywords.push(...matches.map(m => m.toLowerCase()));
            }
        });
        
        return [...new Set(keywords)]; // Remove duplicates
    }

    /**
     * Detect industry from CV data
     */
    detectIndustry(cvData) {
        const industryKeywords = {
            'technology': ['software', 'AI', 'ML', 'cloud', 'development', 'engineering'],
            'data science': ['data', 'analytics', 'machine learning', 'statistics'],
            'product': ['product management', 'user experience', 'product development'],
            'startup': ['startup', 'founding', 'entrepreneur', 'early-stage']
        };
        
        const cvText = JSON.stringify(cvData).toLowerCase();
        const industryCounts = {};
        
        for (const [industry, keywords] of Object.entries(industryKeywords)) {
            industryCounts[industry] = keywords.filter(kw => 
                cvText.includes(kw.toLowerCase())
            ).length;
        }
        
        // Return industry with most keyword matches
        return Object.entries(industryCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    /**
     * Detect seniority level from CV data
     */
    detectSeniorityLevel(cvData) {
        const seniorityIndicators = {
            'C-level': ['CEO', 'CTO', 'CFO', 'Chief', 'C-Suite'],
            'VP': ['VP', 'Vice President', 'Head of'],
            'director': ['Director', 'Head of', 'Lead'],
            'senior': ['Senior', 'Principal', 'Staff', 'Lead'],
            'mid': ['Engineer', 'Developer', 'Analyst'],
            'junior': ['Junior', 'Entry', 'Graduate']
        };
        
        const cvText = JSON.stringify(cvData);
        
        // Check from highest to lowest seniority
        for (const [level, indicators] of Object.entries(seniorityIndicators)) {
            if (indicators.some(indicator => cvText.includes(indicator))) {
                return level;
            }
        }
        
        return 'mid'; // Default
    }

    /**
     * Assess technical depth of content
     */
    assessTechnicalDepth(content) {
        if (!content) return 0;
        
        const technicalIndicators = [
            /\b(algorithm|data structure|system design|architecture)\b/gi,
            /\b(API|REST|GraphQL|microservice)\b/gi,
            /\b(performance|optimization|scalability)\b/gi,
            /\b(security|encryption|authentication)\b/gi
        ];
        
        let depth = 0;
        technicalIndicators.forEach(pattern => {
            if (pattern.test(content)) depth++;
        });
        
        return Math.min(depth / technicalIndicators.length, 1);
    }

    /**
     * Assess business focus of content
     */
    assessBusinessFocus(content) {
        if (!content) return 0;
        
        const businessIndicators = [
            /\b(revenue|profit|ROI|cost)\b/gi,
            /\b(strategy|growth|market|competitive)\b/gi,
            /\b(stakeholder|client|customer|user)\b/gi,
            /\b(leadership|team|management)\b/gi
        ];
        
        let focus = 0;
        businessIndicators.forEach(pattern => {
            if (pattern.test(content)) focus++;
        });
        
        return Math.min(focus / businessIndicators.length, 1);
    }

    /**
     * Get historical effectiveness of persona for section
     */
    getHistoricalEffectiveness(personaId, section) {
        const key = `${personaId}_${section}`;
        if (this.personaMetrics.quality_scores[key]) {
            const scores = this.personaMetrics.quality_scores[key];
            return scores.reduce((a, b) => a + b, 0) / scores.length;
        }
        return 0.5; // Default neutral score
    }

    /**
     * Generate selection rationale for transparency
     */
    generateSelectionRationale(personaId, context) {
        const expertise = PERSONA_EXPERTISE[personaId];
        const reasons = [];
        
        if (expertise.sections.includes(context.section)) {
            reasons.push(`specializes in ${context.section} enhancement`);
        }
        
        if (context.seniority_level && expertise.seniority_focus.includes(context.seniority_level)) {
            reasons.push(`expert in ${context.seniority_level}-level positioning`);
        }
        
        if (context.technical_depth > 0.7 && personaId.includes('technical')) {
            reasons.push('strong technical assessment capabilities');
        }
        
        if (context.business_focus > 0.7 && personaId.includes('executive')) {
            reasons.push('business impact focus aligns with content');
        }
        
        return reasons.join(', ');
    }

    /**
     * Enhance content with dynamically selected persona
     */
    async enhanceWithPersona(section, content, enhancementType) {
        // Select optimal persona
        const personaSelection = await this.selectOptimalPersona(section, content, enhancementType);
        
        // Load persona from library
        const persona = await this.promptLibrary.getPersona(personaSelection.personaId);
        if (!persona) {
            throw new Error(`Failed to load persona: ${personaSelection.personaId}`);
        }
        
        // Get appropriate template
        const templateMap = {
            'professional_summary': 'professional-summary',
            'skills': 'skills-assessment',
            'experience': 'experience-enhancement',
            'projects': 'projects-showcase'
        };
        
        const templateId = templateMap[section] || section;
        const template = await this.promptLibrary.getTemplate(templateId);
        
        if (!template) {
            throw new Error(`Failed to load template: ${templateId}`);
        }
        
        // Log persona usage
        console.log(`🎭 Using ${personaSelection.personaId} for ${section} enhancement`);
        console.log(`💡 Rationale: ${personaSelection.rationale}`);
        
        // Track usage
        this.trackPersonaUsage(personaSelection.personaId, section);
        
        return {
            persona: personaSelection.personaId,
            confidence: personaSelection.confidence,
            rationale: personaSelection.rationale,
            template: templateId
        };
    }

    /**
     * Track persona usage for effectiveness monitoring
     */
    trackPersonaUsage(personaId, section) {
        const key = `${personaId}_${section}`;
        
        // Increment usage count
        this.personaMetrics.usage_count[key] = 
            (this.personaMetrics.usage_count[key] || 0) + 1;
        
        // Initialize arrays if needed
        if (!this.personaMetrics.quality_scores[key]) {
            this.personaMetrics.quality_scores[key] = [];
        }
        
        // Store in history
        this.personaHistory.set(Date.now(), {
            personaId,
            section,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get multi-persona consensus for complex enhancements
     */
    async getMultiPersonaConsensus(section, content, enhancementType) {
        console.log(`🎭 Gathering multi-persona consensus for ${section}...`);
        
        // Get top 3 personas
        const context = await this.analyzeContext(section, content, enhancementType);
        const personaScores = new Map();
        
        for (const [personaId, expertise] of Object.entries(PERSONA_EXPERTISE)) {
            const score = this.calculatePersonaScore(personaId, expertise, context);
            personaScores.set(personaId, { id: personaId, score, expertise });
        }
        
        const topPersonas = Array.from(personaScores.entries())
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 3)
            .map(([id, data]) => ({ personaId: id, ...data }));
        
        console.log(`📋 Consensus panel:`);
        topPersonas.forEach(p => {
            console.log(`   - ${p.personaId}: ${(p.score * 100).toFixed(1)}%`);
        });
        
        return {
            primary: topPersonas[0],
            advisors: topPersonas.slice(1),
            consensus_confidence: topPersonas[0].score
        };
    }

    /**
     * Generate enhancement report
     */
    async generateEnhancementReport() {
        const report = {
            timestamp: new Date().toISOString(),
            persona_usage: this.personaMetrics.usage_count,
            effectiveness_scores: {},
            recommendations: []
        };
        
        // Calculate average effectiveness per persona
        for (const [key, scores] of Object.entries(this.personaMetrics.quality_scores)) {
            if (scores.length > 0) {
                report.effectiveness_scores[key] = 
                    scores.reduce((a, b) => a + b, 0) / scores.length;
            }
        }
        
        // Generate recommendations
        if (Object.keys(report.effectiveness_scores).length > 0) {
            const sortedScores = Object.entries(report.effectiveness_scores)
                .sort((a, b) => b[1] - a[1]);
            
            report.recommendations.push(
                `Most effective: ${sortedScores[0][0]} (${(sortedScores[0][1] * 100).toFixed(1)}%)`
            );
            
            if (sortedScores.length > 1 && sortedScores[sortedScores.length - 1][1] < 0.6) {
                report.recommendations.push(
                    `Consider avoiding: ${sortedScores[sortedScores.length - 1][0]}`
                );
            }
        }
        
        return report;
    }
}

module.exports = { PersonaDrivenEnhancer, PERSONA_EXPERTISE, CONTEXT_WEIGHTS };