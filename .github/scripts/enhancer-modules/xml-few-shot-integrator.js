#!/usr/bin/env node

/**
 * XML Few-Shot Integration Module
 * 
 * Integration layer connecting the Advanced XML Prompt Constructor with 
 * the existing Claude Enhancer system. Provides seamless upgrade to 
 * XML-structured prompts with few-shot learning examples.
 * 
 * Features:
 * - Backward-compatible integration with existing claude-enhancer.js
 * - Dynamic prompt type detection and routing
 * - Quality validation and improvement scoring
 * - Performance monitoring and optimization
 * - Fallback mechanisms for robustness
 * 
 * @author Adrian Wedd
 * @version 2.1.0
 */

const { AdvancedXMLPromptConstructor } = require('./advanced-xml-prompt-constructor');

/**
 * Integration adapter for XML structured prompts with few-shot learning
 */
class XMLFewShotIntegrator {
    constructor() {
        this.xmlConstructor = new AdvancedXMLPromptConstructor();
        this.performanceMetrics = {
            prompts_constructed: 0,
            validation_passes: 0,
            quality_improvements: 0,
            fallback_uses: 0
        };
        
        this.initialized = false;
    }

    /**
     * Initialize the integrator
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🔗 Initializing XML Few-Shot Integrator...');
        await this.xmlConstructor.initialize();
        
        this.initialized = true;
        console.log('✅ XML Few-Shot Integrator ready');
    }

    /**
     * Enhanced professional summary with XML structuring and few-shot examples
     */
    async enhanceProfessionalSummaryXML(cvData, activityMetrics, creativityLevel = 'balanced') {
        await this.initialize();
        
        console.log('🔨 Constructing XML-structured professional summary prompt...');
        
        try {
            // Prepare context data for XML prompt construction
            const contextData = {
                currentContent: cvData?.professional_summary || "AI Engineer specializing in autonomous systems and machine learning.",
                activityScore: this.calculateActivityScore(activityMetrics),
                languages: activityMetrics?.top_languages || ['Python', 'JavaScript', 'TypeScript'],
                repositories: activityMetrics?.total_repos || 0,
                specialization: 'AI/ML engineering and autonomous systems development',
                evidence: this.extractEvidencePoints(cvData, activityMetrics)
            };

            // Construct XML-structured prompt with few-shot examples
            const promptResult = await this.xmlConstructor.constructXMLPrompt(
                'professional-summary',
                contextData,
                creativityLevel
            );

            this.performanceMetrics.prompts_constructed++;

            return {
                xmlPrompt: promptResult.prompt,
                metadata: promptResult.metadata,
                contextData: contextData,
                enhancementType: 'xml-few-shot',
                quality_expected: this.estimateQualityImprovement('professional-summary', creativityLevel)
            };

        } catch (error) {
            console.warn('⚠️ XML prompt construction failed, falling back to standard approach');
            this.performanceMetrics.fallback_uses++;
            return this.createFallbackPrompt('professional-summary', cvData, activityMetrics, creativityLevel);
        }
    }

    /**
     * Enhanced skills section with XML structuring
     */
    async enhanceSkillsSectionXML(cvData, activityMetrics, creativityLevel = 'balanced') {
        await this.initialize();
        
        console.log('🔨 Constructing XML-structured skills enhancement prompt...');
        
        try {
            const contextData = {
                currentContent: cvData?.skills || [],
                activityScore: this.calculateActivityScore(activityMetrics),
                languages: activityMetrics?.top_languages || ['Python', 'JavaScript', 'TypeScript'],
                repositories: activityMetrics?.total_repos || 0,
                specialization: 'AI/ML systems and software architecture',
                evidence: this.extractSkillsEvidence(cvData, activityMetrics)
            };

            const promptResult = await this.xmlConstructor.constructXMLPrompt(
                'skills-enhancement',
                contextData,
                creativityLevel
            );

            this.performanceMetrics.prompts_constructed++;

            return {
                xmlPrompt: promptResult.prompt,
                metadata: promptResult.metadata,
                contextData: contextData,
                enhancementType: 'xml-few-shot',
                quality_expected: this.estimateQualityImprovement('skills-enhancement', creativityLevel)
            };

        } catch (error) {
            console.warn('⚠️ XML skills prompt construction failed, using fallback');
            this.performanceMetrics.fallback_uses++;
            return this.createFallbackPrompt('skills-enhancement', cvData, activityMetrics, creativityLevel);
        }
    }

    /**
     * Enhanced experience section with XML structuring
     */
    async enhanceExperienceXML(cvData, activityMetrics, creativityLevel = 'balanced') {
        await this.initialize();
        
        console.log('🔨 Constructing XML-structured experience enhancement prompt...');
        
        try {
            const contextData = {
                currentContent: cvData?.experience || [],
                activityScore: this.calculateActivityScore(activityMetrics),
                languages: activityMetrics?.top_languages || ['Python', 'JavaScript', 'TypeScript'],
                repositories: activityMetrics?.total_repos || 0,
                specialization: 'Technical leadership and AI system development',
                evidence: this.extractExperienceEvidence(cvData, activityMetrics)
            };

            const promptResult = await this.xmlConstructor.constructXMLPrompt(
                'experience-enhancement',
                contextData,
                creativityLevel
            );

            this.performanceMetrics.prompts_constructed++;

            return {
                xmlPrompt: promptResult.prompt,
                metadata: promptResult.metadata,
                contextData: contextData,
                enhancementType: 'xml-few-shot',
                quality_expected: this.estimateQualityImprovement('experience-enhancement', creativityLevel)
            };

        } catch (error) {
            console.warn('⚠️ XML experience prompt construction failed, using fallback');
            this.performanceMetrics.fallback_uses++;
            return this.createFallbackPrompt('experience-enhancement', cvData, activityMetrics, creativityLevel);
        }
    }

    /**
     * Validate and score Claude's response against expected quality
     */
    async validateResponse(response, promptType, expectedQuality = 0.8) {
        try {
            const validation = this.xmlConstructor.validateOutput(response, promptType);
            
            if (validation.valid && validation.score >= expectedQuality) {
                this.performanceMetrics.validation_passes++;
                
                if (validation.score > expectedQuality) {
                    this.performanceMetrics.quality_improvements++;
                }
            }

            return {
                ...validation,
                performance_metrics: this.getPerformanceMetrics(),
                quality_improvement: validation.score > expectedQuality
            };

        } catch (error) {
            console.warn('⚠️ Response validation failed:', error.message);
            return {
                valid: false,
                score: 0.5,
                errors: ['Validation process failed'],
                warnings: [],
                performance_metrics: this.getPerformanceMetrics()
            };
        }
    }

    /**
     * Calculate activity score from metrics
     */
    calculateActivityScore(activityMetrics) {
        if (!activityMetrics) return 50; // Default middle score

        // Use existing activity score if available
        if (activityMetrics.summary?.activity_score) {
            return activityMetrics.summary.activity_score;
        }

        // Calculate based on various metrics
        let score = 50; // Base score
        
        if (activityMetrics.total_repos) {
            score += Math.min(activityMetrics.total_repos * 2, 20); // Up to 20 points for repos
        }
        
        if (activityMetrics.total_stars) {
            score += Math.min(activityMetrics.total_stars / 2, 15); // Up to 15 points for stars
        }
        
        if (activityMetrics.top_languages) {
            score += Math.min(activityMetrics.top_languages.length * 3, 15); // Up to 15 points for language diversity
        }

        return Math.min(score, 100);
    }

    /**
     * Extract evidence points from CV data and activity metrics
     */
    extractEvidencePoints(cvData, activityMetrics) {
        const evidence = [];

        // GitHub activity evidence
        if (activityMetrics?.total_repos) {
            evidence.push({
                observation: `${activityMetrics.total_repos} repositories demonstrate consistent development activity`,
                inference: 'Shows prolific technical contribution and project experience',
                confidence: activityMetrics.total_repos > 10 ? 'high' : 'medium'
            });
        }

        // Language diversity evidence
        if (activityMetrics?.top_languages?.length) {
            evidence.push({
                observation: `Proficiency across ${activityMetrics.top_languages.length} programming languages: ${activityMetrics.top_languages.join(', ')}`,
                inference: 'Indicates technical versatility and adaptability',
                confidence: activityMetrics.top_languages.length > 5 ? 'high' : 'medium'
            });
        }

        // Community engagement evidence
        if (activityMetrics?.total_stars) {
            evidence.push({
                observation: `${activityMetrics.total_stars} stars received on open-source contributions`,
                inference: 'Demonstrates community recognition and code quality',
                confidence: activityMetrics.total_stars > 50 ? 'high' : 'medium'
            });
        }

        // Experience evidence
        if (cvData?.experience?.length) {
            evidence.push({
                observation: `${cvData.experience.length} professional roles with increasing responsibility`,
                inference: 'Shows career progression and sustained professional growth',
                confidence: 'high'
            });
        }

        return evidence.length > 0 ? evidence : [{
            observation: 'Professional technical background with AI/ML focus',
            inference: 'Positioned for senior technical roles',
            confidence: 'medium'
        }];
    }

    /**
     * Extract skills-specific evidence
     */
    extractSkillsEvidence(cvData, activityMetrics) {
        const evidence = [];

        if (activityMetrics?.top_languages) {
            activityMetrics.top_languages.forEach(lang => {
                evidence.push({
                    observation: `Active development in ${lang} with consistent commits`,
                    inference: `Demonstrates practical proficiency and ongoing development in ${lang}`,
                    confidence: 'high'
                });
            });
        }

        // Technical depth evidence
        if (activityMetrics?.total_repos > 5) {
            evidence.push({
                observation: `${activityMetrics.total_repos} repositories across multiple domains`,
                inference: 'Shows broad technical capability and architectural thinking',
                confidence: 'high'
            });
        }

        return evidence;
    }

    /**
     * Extract experience-specific evidence
     */
    extractExperienceEvidence(cvData, activityMetrics) {
        const evidence = [];

        if (cvData?.experience?.length) {
            cvData.experience.forEach((exp, index) => {
                evidence.push({
                    observation: `${exp.position} at ${exp.company} - ${exp.period}`,
                    inference: `Demonstrates ${index === 0 ? 'current' : 'progressive'} technical leadership and responsibility`,
                    confidence: 'high'
                });
            });
        }

        // Activity correlation with experience
        if (activityMetrics?.total_repos) {
            evidence.push({
                observation: `GitHub activity with ${activityMetrics.total_repos} repositories aligns with professional experience`,
                inference: 'Continuous learning and technical growth beyond formal roles',
                confidence: 'medium'
            });
        }

        return evidence;
    }

    /**
     * Estimate quality improvement from XML/few-shot approach
     */
    estimateQualityImprovement(promptType, creativityLevel) {
        const baseImprovement = {
            'professional-summary': 0.85,
            'skills-enhancement': 0.80,
            'experience-enhancement': 0.82
        };

        const creativityBonus = {
            'conservative': 0.0,
            'balanced': 0.05,
            'creative': 0.10,
            'innovative': 0.12
        };

        return (baseImprovement[promptType] || 0.75) + (creativityBonus[creativityLevel] || 0.05);
    }

    /**
     * Create fallback prompt for error cases
     */
    createFallbackPrompt(promptType, cvData, activityMetrics, creativityLevel) {
        return {
            xmlPrompt: this.createBasicXMLPrompt(promptType, cvData, creativityLevel),
            metadata: {
                prompt_type: promptType,
                creativity_level: creativityLevel,
                fallback_used: true,
                constructed_at: new Date().toISOString()
            },
            contextData: {
                currentContent: this.extractCurrentContent(cvData, promptType),
                activityScore: this.calculateActivityScore(activityMetrics),
                specialization: 'AI/ML engineering'
            },
            enhancementType: 'xml-fallback',
            quality_expected: 0.65
        };
    }

    /**
     * Create basic XML prompt structure
     */
    createBasicXMLPrompt(promptType, cvData, creativityLevel) {
        return `<enhancement_task>
    <task_type>${promptType}</task_type>
    <creativity_level>${creativityLevel}</creativity_level>
    <instruction>
        Enhance the provided ${promptType} with professional, specific language.
        Avoid generic terms and include quantifiable achievements where possible.
        Respond with JSON format only, no explanatory text.
    </instruction>
    <current_content>
        ${JSON.stringify(this.extractCurrentContent(cvData, promptType), null, 4)}
    </current_content>
</enhancement_task>`;
    }

    /**
     * Extract current content based on prompt type
     */
    extractCurrentContent(cvData, promptType) {
        switch (promptType) {
            case 'professional-summary':
                return cvData?.professional_summary || "AI Engineer specializing in autonomous systems.";
            case 'skills-enhancement':
                return cvData?.skills || ['Python', 'Machine Learning', 'Software Architecture'];
            case 'experience-enhancement':
                return cvData?.experience || [];
            default:
                return cvData || {};
        }
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const totalPrompts = this.performanceMetrics.prompts_constructed;
        return {
            ...this.performanceMetrics,
            success_rate: totalPrompts > 0 ? (totalPrompts - this.performanceMetrics.fallback_uses) / totalPrompts : 0,
            quality_improvement_rate: totalPrompts > 0 ? this.performanceMetrics.quality_improvements / totalPrompts : 0,
            validation_success_rate: totalPrompts > 0 ? this.performanceMetrics.validation_passes / totalPrompts : 0
        };
    }

    /**
     * Get integrator statistics
     */
    getStats() {
        return {
            initialized: this.initialized,
            xml_constructor_stats: this.xmlConstructor.getStats(),
            performance_metrics: this.getPerformanceMetrics(),
            enhancement_types_supported: ['professional-summary', 'skills-enhancement', 'experience-enhancement']
        };
    }

    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.performanceMetrics = {
            prompts_constructed: 0,
            validation_passes: 0,
            quality_improvements: 0,
            fallback_uses: 0
        };
    }
}

module.exports = { XMLFewShotIntegrator };