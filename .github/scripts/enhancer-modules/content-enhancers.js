#!/usr/bin/env node

/**
 * Content Enhancement Modules v2.0
 * 
 * Advanced specialized enhancers using sophisticated prompt engineering techniques.
 * Implements the research framework from docs/research/claude-prompt-engineering-framework.md
 * 
 * Features:
 * - Advanced prompt construction with XML structuring
 * - Context-aware persona generation
 * - Evidence-based reasoning chains
 * - Dynamic creativity integration
 * - Structured output validation
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

const { ClaudeApiClient } = require('./claude-api-client');
const { AdvancedPromptConstructor } = require('./advanced-prompt-constructor');

/**
 * Professional Summary Enhancer
 */
class ProfessionalSummaryEnhancer {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
        this.promptConstructor = new AdvancedPromptConstructor(config);
    }

    async enhance(cvData, activityMetrics) {
        console.log('📝 Enhancing professional summary with advanced prompt engineering...');
        
        try {
            const prompt = this.promptConstructor.constructProfessionalSummaryPrompt(cvData, activityMetrics);
            const messages = [{ role: 'user', content: prompt }];
            
            const response = await this.apiClient.makeRequest(messages, {
                max_tokens: 1200,
                temperature: this.getTemperatureForCreativity(),
                model: 'claude-3-5-sonnet-20241022'
            }, 'professional_summary_enhancement');
            
            const result = this.parseAndValidateResponse(response, cvData);
            console.log('✅ Professional summary enhanced using advanced prompting techniques');
            return result;
            
        } catch (error) {
            console.warn('⚠️ Professional summary enhancement failed:', error.message);
            return { 
                enhanced: cvData.professional_summary,
                enhancement_notes: 'Enhancement failed, using original content',
                confidence_score: 0
            };
        }
    }

    getTemperatureForCreativity() {
        const temperatures = {
            conservative: 0.3,
            balanced: 0.5,
            creative: 0.7,
            innovative: 0.9
        };
        return temperatures[this.config.CREATIVITY_LEVEL] || 0.5;
    }

    parseAndValidateResponse(response, originalData) {
        try {
            const content = response.content?.[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                
                // Validation checks
                const validated = this.validateEnhancement(parsed, originalData);
                
                return {
                    ...validated,
                    confidence_score: this.calculateConfidenceScore(validated),
                    enhancement_method: 'advanced_prompt_engineering',
                    creativity_level: this.config.CREATIVITY_LEVEL
                };
            }
            
            // Fallback parsing
            return this.extractFallbackContent(content, originalData);
            
        } catch (error) {
            console.warn('⚠️ Response parsing failed:', error.message);
            return { 
                enhanced: originalData.professional_summary,
                enhancement_notes: 'Parsing failed, using original content'
            };
        }
    }

    validateEnhancement(parsed, originalData) {
        // Ensure required fields exist
        const validated = {
            enhanced: parsed.enhanced || originalData.professional_summary,
            key_differentiators: Array.isArray(parsed.key_differentiators) ? parsed.key_differentiators : [],
            technical_positioning: parsed.technical_positioning || '',
            confidence_indicators: parsed.confidence_indicators || [],
            enhancement_rationale: parsed.enhancement_rationale || 'Standard enhancement applied'
        };

        // Quality checks
        if (validated.enhanced) {
            // Check for generic language
            const genericTerms = ['cutting-edge', 'seamlessly', 'innovative solutions', 'synergistic', 'paradigm'];
            const hasGenericTerms = genericTerms.some(term => 
                validated.enhanced.toLowerCase().includes(term.toLowerCase())
            );
            
            if (hasGenericTerms) {
                validated.quality_warnings = validated.quality_warnings || [];
                validated.quality_warnings.push('Contains generic language terms');
            }

            // Check length (should be 2-3 sentences)
            const sentenceCount = (validated.enhanced.match(/[.!?]+/g) || []).length;
            if (sentenceCount < 2 || sentenceCount > 4) {
                validated.quality_warnings = validated.quality_warnings || [];
                validated.quality_warnings.push(`Sentence count (${sentenceCount}) outside optimal range (2-3)`);
            }
        }

        return validated;
    }

    calculateConfidenceScore(validated) {
        let score = 100;
        
        // Deduct for quality issues
        if (validated.quality_warnings?.length > 0) {
            score -= validated.quality_warnings.length * 15;
        }

        // Deduct if missing key components
        if (!validated.key_differentiators || validated.key_differentiators.length < 2) {
            score -= 20;
        }

        if (!validated.technical_positioning) {
            score -= 15;
        }

        return Math.max(0, Math.min(100, score));
    }

    extractFallbackContent(content, originalData) {
        // Try to extract meaningful content even if JSON parsing fails
        const lines = content.split('\n').filter(line => line.trim());
        const enhanced = lines.find(line => line.length > 50) || originalData.professional_summary;
        
        return {
            enhanced,
            enhancement_notes: 'Fallback extraction used due to parsing issues',
            confidence_score: 30
        };
    }

}

/**
 * Skills Section Enhancer
 */
class SkillsEnhancer {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
        this.promptConstructor = new AdvancedPromptConstructor(config);
    }

    async enhance(cvData, activityMetrics) {
        console.log('⚡ Enhancing skills section with advanced assessment framework...');
        
        try {
            const prompt = this.promptConstructor.constructSkillsAssessmentPrompt(cvData, activityMetrics);
            const messages = [{ role: 'user', content: prompt }];
            
            const response = await this.apiClient.makeRequest(messages, {
                max_tokens: 1800,
                temperature: this.getTemperatureForCreativity(),
                model: 'claude-3-5-sonnet-20241022'
            }, 'skills_assessment');
            
            const result = this.parseAndValidateSkillsResponse(response, cvData, activityMetrics);
            console.log('✅ Skills enhanced using advanced assessment framework');
            return result;
            
        } catch (error) {
            console.warn('⚠️ Skills enhancement failed:', error.message);
            return { 
                enhanced_skills: cvData.skills,
                enhancement_notes: 'Enhancement failed, using original skills',
                confidence_score: 0
            };
        }
    }

    getTemperatureForCreativity() {
        const temperatures = {
            conservative: 0.2,
            balanced: 0.4,
            creative: 0.6,
            innovative: 0.8
        };
        return temperatures[this.config.CREATIVITY_LEVEL] || 0.4;
    }

    parseAndValidateSkillsResponse(response, originalData, activityMetrics) {
        try {
            const content = response.content?.[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const validated = this.validateSkillsEnhancement(parsed, originalData, activityMetrics);
                
                return {
                    ...validated,
                    confidence_score: this.calculateSkillsConfidenceScore(validated, activityMetrics),
                    enhancement_method: 'advanced_assessment_framework',
                    creativity_level: this.config.CREATIVITY_LEVEL
                };
            }
            
            return this.extractFallbackSkills(content, originalData);
            
        } catch (error) {
            console.warn('⚠️ Skills response parsing failed:', error.message);
            return { 
                enhanced_skills: originalData.skills,
                enhancement_notes: 'Parsing failed, using original skills'
            };
        }
    }

    validateSkillsEnhancement(parsed, originalData, activityMetrics) {
        const validated = {
            enhanced_skills: Array.isArray(parsed.enhanced_skills) ? parsed.enhanced_skills : [],
            skill_categories: parsed.skill_categories || {},
            emerging_capabilities: Array.isArray(parsed.emerging_capabilities) ? parsed.emerging_capabilities : [],
            market_alignment: parsed.market_alignment || '',
            development_recommendations: Array.isArray(parsed.development_recommendations) ? parsed.development_recommendations : []
        };

        // Cross-validate skills with activity data
        const activityLanguages = activityMetrics?.top_languages || [];
        validated.validation_results = this.crossValidateWithActivity(validated.enhanced_skills, activityLanguages);

        // Ensure skills have required structure
        validated.enhanced_skills = validated.enhanced_skills.map(skill => ({
            name: skill.name || 'Unknown Skill',
            category: skill.category || 'Other',
            level: skill.level || 'Intermediate',
            proficiency: Math.min(100, Math.max(0, skill.proficiency || 70)),
            experience_years: Math.max(0, skill.experience_years || 1),
            recent_activity: Boolean(skill.recent_activity),
            evidence: skill.evidence || []
        }));

        return validated;
    }

    crossValidateWithActivity(skills, activityLanguages) {
        const results = {
            validated_skills: [],
            unsupported_skills: [],
            missing_active_skills: []
        };

        // Check which skills are supported by activity
        skills.forEach(skill => {
            const isSupported = activityLanguages.some(lang => 
                lang.toLowerCase().includes(skill.name.toLowerCase()) ||
                skill.name.toLowerCase().includes(lang.toLowerCase())
            );

            if (isSupported) {
                results.validated_skills.push(skill.name);
            } else if (skill.recent_activity) {
                results.unsupported_skills.push(skill.name);
            }
        });

        // Check for active languages not in skills
        activityLanguages.forEach(lang => {
            const isInSkills = skills.some(skill => 
                skill.name.toLowerCase().includes(lang.toLowerCase()) ||
                lang.toLowerCase().includes(skill.name.toLowerCase())
            );

            if (!isInSkills) {
                results.missing_active_skills.push(lang);
            }
        });

        return results;
    }

    calculateSkillsConfidenceScore(validated, activityMetrics) {
        let score = 100;

        // Deduct for validation issues
        if (validated.validation_results) {
            const { unsupported_skills, missing_active_skills } = validated.validation_results;
            score -= (unsupported_skills.length * 10);
            score -= (missing_active_skills.length * 5);
        }

        // Deduct if missing key components
        if (!validated.enhanced_skills || validated.enhanced_skills.length === 0) {
            score -= 50;
        }

        if (!validated.market_alignment) {
            score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    extractFallbackSkills(content, originalData) {
        return {
            enhanced_skills: originalData.skills || [],
            enhancement_notes: 'Fallback extraction used due to parsing issues',
            confidence_score: 20
        };
    }

}

/**
 * Experience Enhancer
 */
class ExperienceEnhancer {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
    }

    async enhance(cvData, activityMetrics) {
        console.log('💼 Enhancing experience section...');
        
        const experiences = cvData.experience || [];
        const enhancedExperiences = [];
        
        for (const [index, experience] of experiences.entries()) {
            if (index >= 3) break; // Enhance top 3 experiences to manage token usage
            
            try {
                const enhanced = await this.enhanceSingleExperience(experience, activityMetrics, index);
                enhancedExperiences.push(enhanced);
            } catch (error) {
                console.warn(`⚠️ Failed to enhance experience ${index}:`, error.message);
                enhancedExperiences.push(experience);
            }
        }
        
        return { enhanced_experience: enhancedExperiences };
    }

    async enhanceSingleExperience(experience, activityMetrics, index) {
        const prompt = this.buildExperiencePrompt(experience, activityMetrics, index);
        const messages = [{ role: 'user', content: prompt }];
        
        const response = await this.apiClient.makeRequest(messages, {
            max_tokens: 800,
            temperature: 0.7
        });
        
        return this.parseExperienceResponse(response, experience);
    }

    buildExperiencePrompt(experience, activityMetrics, index) {
        const progression = this.assessLeadershipProgression(index);
        const capacity = this.evaluateInnovationCapacity(activityMetrics);
        
        return `<instructions>
            <persona expertise="executive_recruiter" style="${this.config.CREATIVITY_LEVEL}">
            </persona>
            
            <task type="experience_enhancement">
                <context>
                    Enhancing experience entry for a professional who ${progression}, 
                    functioning as ${capacity}. Position: ${experience.position} at ${experience.company}
                </context>
                
                <enhancement_focus>
                    - Quantify impact and achievements
                    - Highlight technical leadership moments
                    - Connect to current AI engineering trajectory
                    - Use active voice and specific metrics
                </enhancement_focus>
                
                <output_format>
                    {
                        "enhanced_description": "Enhanced role description",
                        "enhanced_achievements": ["Quantified achievement bullets"],
                        "technical_highlights": ["Key technical contributions"],
                        "leadership_indicators": ["Leadership/influence examples"]
                    }
                </output_format>
            </task>
        </instructions>

        Original Experience:
        Position: ${experience.position}
        Company: ${experience.company}
        Period: ${experience.period}
        Description: ${experience.description}
        Achievements: ${JSON.stringify(experience.achievements || [])}
        Technologies: ${JSON.stringify(experience.technologies || [])}`;
    }

    assessLeadershipProgression(index) {
        if (index === 0) return 'demonstrates current technical leadership and strategic thinking';
        if (index === 1) return 'shows progressive leadership development and impact scaling';
        return 'exhibits foundational expertise with growing influence';
    }

    evaluateInnovationCapacity(activityMetrics) {
        const activity = activityMetrics?.summary?.activity_score || 0;
        
        if (activity > 80) return 'a technical innovator driving next-generation solutions';
        if (activity > 60) return 'an experienced practitioner with innovation focus';
        return 'a skilled professional contributing to technical advancement';
    }

    parseExperienceResponse(response, originalExperience) {
        try {
            const content = response.content?.[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    ...originalExperience,
                    description: parsed.enhanced_description || originalExperience.description,
                    achievements: parsed.enhanced_achievements || originalExperience.achievements,
                    technical_highlights: parsed.technical_highlights,
                    leadership_indicators: parsed.leadership_indicators
                };
            }
            
            return originalExperience;
        } catch {
            return originalExperience;
        }
    }
}

/**
 * Projects Enhancer
 */
class ProjectsEnhancer {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
    }

    async enhance(cvData, activityMetrics) {
        console.log('🚀 Enhancing projects section...');
        
        const prompt = this.buildProjectsPrompt(cvData, activityMetrics);
        const messages = [{ role: 'user', content: prompt }];
        
        try {
            const response = await this.apiClient.makeRequest(messages, {
                max_tokens: 1200,
                temperature: 0.75
            });
            
            return this.parseProjectsResponse(response);
        } catch (error) {
            console.warn('⚠️ Projects enhancement failed:', error.message);
            return { enhanced_projects: cvData.projects };
        }
    }

    buildProjectsPrompt(cvData, activityMetrics) {
        const technicalDepth = this.assessTechnicalDepth(activityMetrics);
        const marketPosition = this.determineMarketPositioning(activityMetrics);
        
        return `<instructions>
            <persona expertise="technical_product_manager" style="${this.config.CREATIVITY_LEVEL}">
            </persona>
            
            <task type="projects_enhancement">
                <context>
                    Showcasing projects for a technical professional with ${technicalDepth}, 
                    positioned as ${marketPosition} in the AI engineering space.
                </context>
                
                <enhancement_strategy>
                    - Emphasize real-world impact and user value
                    - Highlight innovative technical approaches
                    - Include measurable outcomes where possible
                    - Connect to broader industry trends
                </enhancement_strategy>
                
                <output_format>
                    {
                        "enhanced_projects": [
                            {
                                "name": "project_name",
                                "enhanced_description": "compelling project description",
                                "technical_innovation": "unique technical aspects",
                                "business_impact": "measurable outcomes",
                                "technologies": ["tech_stack"],
                                "github_url": "repository_link"
                            }
                        ],
                        "portfolio_theme": "Overall portfolio positioning"
                    }
                </output_format>
            </task>
        </instructions>

        Current Projects: ${JSON.stringify(cvData.projects || [])}
        GitHub Activity: ${this.config.ACTIVITY_SCORE}/100`;
    }

    assessTechnicalDepth(activityMetrics) {
        const repos = activityMetrics?.total_repos || 0;
        const languages = activityMetrics?.top_languages?.length || 0;
        
        if (repos > 20 && languages > 7) return 'extensive full-stack development experience across multiple domains';
        if (repos > 10 && languages > 5) return 'strong technical breadth with deep specialization areas';
        return 'focused technical expertise with proven delivery capabilities';
    }

    determineMarketPositioning(activityMetrics) {
        const activity = activityMetrics?.summary?.activity_score || 0;
        
        if (activity > 80) return 'a recognized technical leader in AI engineering and autonomous systems';
        if (activity > 60) return 'an emerging expert in AI-driven solution architecture';
        return 'a skilled practitioner specializing in AI system development';
    }

    parseProjectsResponse(response) {
        try {
            const content = response.content?.[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return { enhanced_projects: [] };
        } catch {
            return { enhanced_projects: [] };
        }
    }
}

module.exports = {
    ProfessionalSummaryEnhancer,
    SkillsEnhancer,
    ExperienceEnhancer,
    ProjectsEnhancer
};