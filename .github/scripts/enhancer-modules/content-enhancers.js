#!/usr/bin/env node

/**
 * Content Enhancement Modules
 * 
 * Specialized enhancers for different CV sections.
 * Each enhancer contains domain-specific prompting and logic.
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

const { ClaudeApiClient } = require('./claude-api-client');

/**
 * Professional Summary Enhancer
 */
class ProfessionalSummaryEnhancer {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
    }

    async enhance(cvData, activityMetrics) {
        console.log('📝 Enhancing professional summary...');
        
        const prompt = this.buildSummaryPrompt(cvData, activityMetrics);
        const messages = [{ role: 'user', content: prompt }];
        
        try {
            const response = await this.apiClient.makeRequest(messages, {
                max_tokens: 1000,
                temperature: 0.8
            });
            
            return this.parseResponse(response);
        } catch (error) {
            console.warn('⚠️ Professional summary enhancement failed:', error.message);
            return { enhanced: cvData.professional_summary };
        }
    }

    buildSummaryPrompt(cvData, activityMetrics) {
        const activityContext = this.buildActivityContext(activityMetrics);
        const leadershipCapacity = this.assessLeadershipCapacity(activityMetrics);
        
        return `<instructions>
            <persona expertise="senior_technical_recruiter" style="${this.config.CREATIVITY_LEVEL}" context="ai_engineering">
            </persona>
            
            <task type="professional_summary_enhancement">
                <context_integration method="narrative_weaving">
                    You're evaluating a technical professional who ${leadershipCapacity}, 
                    with ${activityContext}. Their expertise spans AI engineering, 
                    autonomous systems, and scalable architecture development.
                </context_integration>
                
                <output_structure format="structured_json">
                    {
                        "enhanced": "Enhanced professional summary (2-3 sentences max)",
                        "key_differentiators": ["3-4 unique value propositions"],
                        "technical_positioning": "Market positioning statement",
                        "enhancement_notes": "Brief notes on changes made"
                    }
                </output_structure>
                
                <quality_criteria>
                    - Avoid generic AI language (no "cutting-edge", "seamlessly")
                    - Include specific technical depth indicators
                    - Balance confidence with authenticity
                    - Focus on unique value creation
                </quality_criteria>
            </task>
        </instructions>

        Current Summary: "${cvData.professional_summary}"
        
        Base Experience: ${JSON.stringify(cvData.experience?.slice(0, 2) || [])}`;
    }

    buildActivityContext(activityMetrics) {
        const commits = activityMetrics?.summary?.total_commits || 0;
        const languages = activityMetrics?.top_languages?.length || 0;
        const repos = activityMetrics?.total_repos || 0;
        
        if (commits > 100) return `high development velocity (${commits} commits, ${languages} languages, ${repos} repositories)`;
        if (commits > 50) return `consistent development activity (${commits} commits across ${languages} languages)`;
        return `active development presence (${commits} commits, ${languages} technical domains)`;
    }

    assessLeadershipCapacity(activityMetrics) {
        const activity = activityMetrics?.summary?.activity_score || 0;
        const repos = activityMetrics?.total_repos || 0;
        
        if (activity > 80 && repos > 20) return 'demonstrates technical leadership at scale';
        if (activity > 60 && repos > 10) return 'shows emerging technical leadership';
        return 'exhibits strong individual contributor capabilities';
    }

    parseResponse(response) {
        try {
            const content = response.content?.[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return { enhanced: content };
        } catch {
            return { enhanced: response.content?.[0]?.text || '' };
        }
    }
}

/**
 * Skills Section Enhancer
 */
class SkillsEnhancer {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
    }

    async enhance(cvData, activityMetrics) {
        console.log('⚡ Enhancing skills section...');
        
        const prompt = this.buildSkillsPrompt(cvData, activityMetrics);
        const messages = [{ role: 'user', content: prompt }];
        
        try {
            const response = await this.apiClient.makeRequest(messages, {
                max_tokens: 1500,
                temperature: 0.6
            });
            
            return this.parseSkillsResponse(response);
        } catch (error) {
            console.warn('⚠️ Skills enhancement failed:', error.message);
            return { enhanced_skills: cvData.skills };
        }
    }

    buildSkillsPrompt(cvData, activityMetrics) {
        const skillDepth = this.assessSkillDepth(activityMetrics);
        const expertise = this.determineExpertiseEvolution(activityMetrics);
        
        return `<instructions>
            <persona expertise="technical_assessment_specialist" style="${this.config.CREATIVITY_LEVEL}">
            </persona>
            
            <task type="skills_enhancement">
                <context>
                    Evaluating a developer who ${skillDepth}, functioning as ${expertise}.
                    Activity: ${this.config.ACTIVITY_SCORE}/100, Languages: ${activityMetrics?.top_languages?.join(', ') || 'Python, JavaScript, TypeScript'}
                </context>
                
                <enhancement_strategy>
                    - Organize skills by proficiency and market relevance
                    - Add specific frameworks and tools based on activity
                    - Include emerging technologies aligned with AI engineering
                    - Quantify experience levels where possible
                </enhancement_strategy>
                
                <output_format>
                    {
                        "enhanced_skills": [
                            {
                                "name": "skill_name",
                                "category": "Programming|Frameworks|Tools|Cloud|AI/ML",
                                "level": "Expert|Advanced|Intermediate|Familiar",
                                "proficiency": 85,
                                "experience_years": 3,
                                "recent_activity": true
                            }
                        ],
                        "skill_summary": "Brief overview of technical capabilities",
                        "emerging_skills": ["skills being developed"]
                    }
                </output_format>
            </task>
        </instructions>

        Current Skills: ${JSON.stringify(cvData.skills || [])}
        Activity Languages: ${JSON.stringify(activityMetrics?.top_languages || [])}`;
    }

    assessSkillDepth(activityMetrics) {
        const languages = activityMetrics?.top_languages?.length || 0;
        const repos = activityMetrics?.total_repos || 0;
        
        if (languages > 7 && repos > 15) return 'demonstrates polyglot expertise across multiple paradigms';
        if (languages > 5 && repos > 10) return 'shows strong multi-language proficiency';
        return 'exhibits focused technical expertise';
    }

    determineExpertiseEvolution(activityMetrics) {
        const activity = activityMetrics?.summary?.activity_score || 0;
        
        if (activity > 80) return 'a seasoned technologist with evolving AI specialization';
        if (activity > 60) return 'an advanced practitioner transitioning to AI leadership';
        return 'a skilled developer expanding into AI engineering';
    }

    parseSkillsResponse(response) {
        try {
            const content = response.content?.[0]?.text || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return { enhanced_skills: [] };
        } catch {
            return { enhanced_skills: [] };
        }
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