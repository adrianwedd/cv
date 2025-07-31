#!/usr/bin/env node

/**
 * Advanced Prompt Constructor
 * 
 * Implements sophisticated prompt engineering techniques based on the research framework
 * in docs/research/claude-prompt-engineering-framework.md
 * 
 * Features:
 * - Multi-stage prompt construction with XML structuring
 * - Context-aware persona generation
 * - Dynamic creativity integration
 * - Evidence-based reasoning chains
 * - Structured output enforcement
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

/**
 * Advanced Prompt Constructor for AI Content Enhancement
 */
class AdvancedPromptConstructor {
    constructor(config) {
        this.config = config;
        this.creativityLevel = config.CREATIVITY_LEVEL || 'balanced';
        this.expertiseDatabase = this.initializeExpertiseDatabase();
        this.promptTemplates = this.initializePromptTemplates();
    }

    /**
     * Initialize comprehensive expertise database with domain-specific knowledge
     */
    initializeExpertiseDatabase() {
        return {
            senior_technical_recruiter: {
                name: "Alexandra Chen",
                title: "Senior Technical Recruiter",
                company: "Microsoft",
                expertise: "AI/ML talent acquisition, technical assessment, startup-to-enterprise scaling",
                specialization: "autonomous systems, machine learning, technical leadership evaluation",
                perspective: "market-aware, impact-focused, authenticity-driven",
                language_patterns: ["quantified impact", "technical depth indicators", "leadership progression markers"],
                avoid: ["generic tech buzzwords", "unsupported claims", "cookie-cutter descriptions"]
            },
            technical_assessment_specialist: {
                name: "Dr. Raj Patel",
                title: "Principal Technology Assessor",
                company: "Google DeepMind",
                expertise: "technical skill evaluation, emerging technology trends, AI engineering competencies",
                specialization: "polyglot development, architecture patterns, innovation capacity",
                perspective: "depth-over-breadth, practical application, continuous learning",
                language_patterns: ["specific frameworks", "measurable proficiency", "growth trajectory"],
                avoid: ["skill laundry lists", "unsupported expertise claims", "static categorization"]
            },
            executive_recruiter: {
                name: "Sarah Morrison",
                title: "Executive Search Partner",
                company: "Korn Ferry",
                expertise: "C-level placement, strategic leadership assessment, organizational impact evaluation",
                specialization: "technology leadership, transformation initiatives, cultural fit",
                perspective: "strategic impact, leadership philosophy, organizational influence",
                language_patterns: ["strategic outcomes", "leadership philosophy", "organizational transformation"],
                avoid: ["tactical descriptions", "individual contributor language", "generic leadership claims"]
            },
            technical_product_manager: {
                name: "Marcus Williams",
                title: "Director of Product Engineering",
                company: "OpenAI",
                expertise: "AI product development, technical strategy, user-centric innovation",
                specialization: "AI/ML product lifecycle, technical-business alignment, innovation frameworks",
                perspective: "user impact, technical feasibility, market differentiation",
                language_patterns: ["user value creation", "technical innovation", "market positioning"],
                avoid: ["feature lists", "technical jargon without context", "unfocused scope"]
            }
        };
    }

    /**
     * Initialize advanced prompt templates with XML structuring
     */
    initializePromptTemplates() {
        return {
            professional_summary: {
                template: `<prompt_structure>
                    <persona>{persona_definition}</persona>
                    <context_integration>{narrative_context}</context_integration>
                    <enhancement_philosophy>{creativity_strategy}</enhancement_philosophy>
                    <quality_framework>{quality_criteria}</quality_framework>
                    <output_specification>{structured_output}</output_specification>
                    <reasoning_chain>{evidence_chain}</reasoning_chain>
                </prompt_structure>`,
                creativity_adaptations: {
                    conservative: "Focus on proven achievements and established capabilities",
                    balanced: "Balance proven track record with emerging capabilities and potential",
                    creative: "Emphasize innovation potential and unique value propositions",
                    innovative: "Highlight transformative thinking and paradigm-shifting approaches"
                }
            },
            skills_assessment: {
                template: `<prompt_structure>
                    <persona>{persona_definition}</persona>
                    <technical_context>{skill_narrative}</technical_context>
                    <assessment_framework>{proficiency_model}</assessment_framework>
                    <market_relevance>{industry_alignment}</market_relevance>
                    <output_specification>{skills_schema}</output_specification>
                    <validation_criteria>{accuracy_checks}</validation_criteria>
                </prompt_structure>`,
                creativity_adaptations: {
                    conservative: "Emphasize established, proven technical capabilities",
                    balanced: "Include both core competencies and emerging skill development",
                    creative: "Highlight innovative applications and cross-domain expertise",
                    innovative: "Focus on breakthrough thinking and technology leadership potential"
                }
            },
            experience_enhancement: {
                template: `<prompt_structure>
                    <persona>{persona_definition}</persona>
                    <career_narrative>{progression_context}</career_narrative>
                    <impact_framework>{achievement_model}</impact_framework>
                    <leadership_assessment>{influence_indicators}</leadership_assessment>
                    <output_specification>{experience_schema}</output_specification>
                    <quantification_strategy>{metrics_approach}</quantification_strategy>
                </prompt_structure>`,
                creativity_adaptations: {
                    conservative: "Focus on documented achievements and established responsibilities",
                    balanced: "Combine proven accomplishments with growth trajectory indicators",
                    creative: "Emphasize innovative approaches and transformative contributions",
                    innovative: "Highlight visionary thinking and paradigm-changing initiatives"
                }
            },
            projects_showcase: {
                template: `<prompt_structure>
                    <persona>{persona_definition}</persona>
                    <technical_narrative>{innovation_context}</technical_narrative>
                    <value_framework>{impact_model}</value_framework>
                    <differentiation_strategy>{uniqueness_factors}</differentiation_strategy>
                    <output_specification>{projects_schema}</output_specification>
                    <market_positioning>{competitive_context}</market_positioning>
                </prompt_structure>`,
                creativity_adaptations: {
                    conservative: "Emphasize proven technical implementations and reliable outcomes",
                    balanced: "Balance technical innovation with practical business impact",
                    creative: "Highlight novel approaches and creative problem-solving",
                    innovative: "Focus on breakthrough innovations and disruptive potential"
                }
            }
        };
    }

    /**
     * Build comprehensive persona definition with expertise depth
     */
    buildPersonaDefinition(expertiseType, contextData) {
        const expert = this.expertiseDatabase[expertiseType];
        if (!expert) {
            throw new Error(`Unknown expertise type: ${expertiseType}`);
        }

        const contextualAdjustments = this.generateContextualAdjustments(expert, contextData);
        
        return `<expert_persona>
            <identity>
                You are ${expert.name}, ${expert.title} at ${expert.company}.
                You have ${expert.expertise}, with deep specialization in ${expert.specialization}.
            </identity>
            
            <perspective>
                Your evaluation approach is ${expert.perspective}.
                You prioritize ${expert.language_patterns.join(', ')} in your assessments.
                You actively avoid ${expert.avoid.join(', ')}.
            </perspective>
            
            <contextual_lens>
                ${contextualAdjustments}
            </contextual_lens>
            
            <evaluation_style>
                Creativity Level: ${this.creativityLevel}
                ${this.getCreativityInstructions()}
            </evaluation_style>
        </expert_persona>`;
    }

    /**
     * Generate contextual adjustments based on activity data
     */
    generateContextualAdjustments(expert, contextData) {
        const activityScore = contextData?.activityMetrics?.summary?.activity_score || 0;
        const languageCount = contextData?.activityMetrics?.top_languages?.length || 0;
        const repoCount = contextData?.activityMetrics?.total_repos || 0;

        const adjustments = [];

        // Activity-based adjustments
        if (activityScore > 80) {
            adjustments.push("This professional demonstrates exceptional development velocity and technical leadership capacity");
        } else if (activityScore > 60) {
            adjustments.push("This professional shows strong technical competency with growth trajectory");
        } else {
            adjustments.push("This professional exhibits focused expertise with potential for expansion");
        }

        // Technical breadth adjustments
        if (languageCount > 7 && repoCount > 15) {
            adjustments.push("Their polyglot expertise across multiple paradigms indicates architectural thinking");
        } else if (languageCount > 5) {
            adjustments.push("Their multi-language proficiency suggests adaptability and learning agility");
        }

        // Domain-specific adjustments
        if (expert.specialization.includes('AI') || expert.specialization.includes('autonomous')) {
            adjustments.push("Given the AI engineering focus, emphasize innovation capacity and next-generation thinking");
        }

        return adjustments.join('. ') + '.';
    }

    /**
     * Get creativity-specific instructions
     */
    getCreativityInstructions() {
        const instructions = {
            conservative: `
                - Focus on substantiated, proven capabilities
                - Use precise, measured language
                - Emphasize reliability and established expertise
                - Avoid speculative or aspirational statements`,
            balanced: `
                - Balance proven track record with growth potential
                - Use confident but authentic language
                - Include both current capabilities and emerging skills
                - Maintain professional credibility while showing ambition`,
            creative: `
                - Emphasize unique value propositions and innovation
                - Use compelling, memorable language
                - Highlight creative problem-solving and novel approaches
                - Balance boldness with authenticity`,
            innovative: `
                - Focus on transformative potential and breakthrough thinking
                - Use visionary, forward-looking language
                - Emphasize paradigm-shifting approaches and disruptive innovation
                - Highlight thought leadership and industry influence potential`
        };

        return instructions[this.creativityLevel] || instructions.balanced;
    }

    /**
     * Build evidence-based reasoning chain
     */
    buildReasoningChain(evidencePoints) {
        return `<reasoning_chain>
            <evidence_analysis>
                ${evidencePoints.map((point, index) => 
                    `<evidence_point id="${index + 1}">
                        <observation>${point.observation}</observation>
                        <inference>${point.inference}</inference>
                        <support_level>${point.confidence}</support_level>
                    </evidence_point>`
                ).join('\n')}
            </evidence_analysis>
            
            <synthesis_instruction>
                Base your enhancement on the evidence chain above. Each claim should be 
                traceable to specific evidence points. Avoid assertions that lack supporting data.
            </synthesis_instruction>
        </reasoning_chain>`;
    }

    /**
     * Build structured output specification with validation
     */
    buildOutputSpecification(schemaType, additionalFields = {}) {
        const schemas = {
            professional_summary: {
                enhanced: "string: Enhanced professional summary (2-3 sentences, specific and compelling)",
                key_differentiators: "array: 3-4 unique value propositions based on evidence",
                technical_positioning: "string: Market positioning statement with specific expertise areas",
                confidence_indicators: "array: Specific evidence supporting each enhancement",
                enhancement_rationale: "string: Brief explanation of enhancement strategy used"
            },
            skills_assessment: {
                enhanced_skills: "array: Skill objects with name, category, level, proficiency_score, evidence",
                skill_categories: "object: Skills grouped by technical domain with proficiency summaries",
                emerging_capabilities: "array: Skills in development with learning trajectory indicators",
                market_alignment: "string: How skills align with current AI/ML market demands",
                development_recommendations: "array: Suggested skill development priorities"
            },
            experience_enhancement: {
                enhanced_description: "string: Compelling role description with specific impact indicators",
                quantified_achievements: "array: Achievement bullets with specific metrics and outcomes",
                technical_leadership: "array: Specific examples of technical influence and innovation",
                career_progression: "string: How this role fits in overall career trajectory",
                skills_demonstrated: "array: Key skills evidenced in this role"
            },
            projects_showcase: {
                enhanced_projects: "array: Project objects with enhanced descriptions and impact metrics",
                technical_innovations: "array: Unique technical approaches and solutions implemented",
                business_outcomes: "array: Measurable impacts and value creation examples",
                portfolio_narrative: "string: Overall story connecting projects to career trajectory",
                market_differentiation: "string: How projects position candidate uniquely in market"
            }
        };

        const schema = { ...schemas[schemaType], ...additionalFields };
        
        return `<output_specification>
            <format>JSON</format>
            <schema>
                {
                    ${Object.entries(schema).map(([key, description]) => 
                        `"${key}": "${description}"`
                    ).join(',\n                    ')}
                }
            </schema>
            <validation_requirements>
                - All string fields must be non-empty and substantive
                - Arrays must contain at least one meaningful element
                - Numeric scores must be justified with specific evidence
                - Claims must be traceable to provided evidence
                - Language must be professional, specific, and compelling
            </validation_requirements>
        </output_specification>`;
    }

    /**
     * Construct advanced prompt for professional summary enhancement
     */
    constructProfessionalSummaryPrompt(cvData, activityMetrics) {
        const template = this.promptTemplates.professional_summary;
        const persona = this.buildPersonaDefinition('senior_technical_recruiter', { cvData, activityMetrics });
        
        const narrativeContext = this.buildNarrativeContext(cvData, activityMetrics);
        const creativityStrategy = template.creativity_adaptations[this.creativityLevel];
        const qualityCriteria = this.buildQualityCriteria('professional_summary');
        const outputSpec = this.buildOutputSpecification('professional_summary');
        
        const evidencePoints = this.extractEvidencePoints(cvData, activityMetrics);
        const reasoningChain = this.buildReasoningChain(evidencePoints);

        return template.template
            .replace('{persona_definition}', persona)
            .replace('{narrative_context}', narrativeContext)
            .replace('{creativity_strategy}', creativityStrategy)
            .replace('{quality_criteria}', qualityCriteria)
            .replace('{structured_output}', outputSpec)
            .replace('{evidence_chain}', reasoningChain) + 
            `\n\n<source_content>
                <current_summary>${cvData.professional_summary || 'No current summary provided'}</current_summary>
                <experience_context>${JSON.stringify(cvData.experience?.slice(0, 2) || [], null, 2)}</experience_context>
                <activity_metrics>${JSON.stringify(activityMetrics?.summary || {}, null, 2)}</activity_metrics>
            </source_content>`;
    }

    /**
     * Build narrative context from CV and activity data
     */
    buildNarrativeContext(cvData, activityMetrics) {
        const commits = activityMetrics?.summary?.total_commits || 0;
        const languages = activityMetrics?.top_languages?.length || 0;
        const activityScore = activityMetrics?.summary?.activity_score || 0;
        
        const contextElements = [];
        
        // Development velocity context
        if (commits > 100) {
            contextElements.push(`demonstrates exceptional development velocity with ${commits} commits across ${languages} languages`);
        } else if (commits > 50) {
            contextElements.push(`maintains consistent development activity with ${commits} commits in ${languages} technical domains`);
        } else {
            contextElements.push(`shows focused development presence with ${commits} commits`);
        }

        // Leadership capacity context
        if (activityScore > 80) {
            contextElements.push("exhibits technical leadership at scale with high-impact contributions");
        } else if (activityScore > 60) {
            contextElements.push("demonstrates emerging technical leadership with growing influence");
        } else {
            contextElements.push("shows strong individual contributor capabilities with growth potential");
        }

        // Domain expertise context
        const experienceAreas = cvData.experience?.map(exp => exp.position).slice(0, 2) || [];
        if (experienceAreas.length > 0) {
            contextElements.push(`brings expertise from roles including ${experienceAreas.join(' and ')}`);
        }

        return `<narrative_context>
            You are evaluating a technical professional who ${contextElements.join(', ')}.
            Their expertise trajectory spans AI engineering, autonomous systems, and scalable architecture development.
            The enhancement should reflect their unique combination of technical depth and innovation capacity.
        </narrative_context>`;
    }

    /**
     * Build quality criteria for specific enhancement types
     */
    buildQualityCriteria(enhancementType) {
        const criteria = {
            professional_summary: [
                "Avoid generic AI/tech language ('cutting-edge', 'seamlessly', 'innovative solutions')",
                "Include specific technical depth indicators (languages, domains, scale)",
                "Balance confidence with authenticity (no unsupported superlatives)",
                "Focus on unique value creation rather than role descriptions",
                "Ensure every claim is traceable to provided evidence",
                "Use active voice and specific, measurable language"
            ],
            skills_assessment: [
                "Organize skills by genuine proficiency level, not aspirational",
                "Include specific frameworks and tools evidenced in activity data",
                "Avoid skill laundry lists - focus on proven, market-relevant capabilities",
                "Quantify experience levels with realistic timelines",
                "Highlight emerging skills with clear development indicators"
            ],
            experience_enhancement: [
                "Quantify impact wherever possible with specific metrics",
                "Highlight technical leadership moments and influence",
                "Connect each role to overall career trajectory and AI focus",
                "Use active voice and specific achievement language",
                "Emphasize problem-solving approach and innovative thinking"
            ],
            projects_showcase: [
                "Emphasize real-world impact and user value over technical complexity",
                "Highlight innovative technical approaches with business context",
                "Include measurable outcomes and success metrics",
                "Connect projects to broader industry trends and market needs",
                "Demonstrate progression in technical sophistication and impact"
            ]
        };

        return `<quality_criteria>
            ${criteria[enhancementType]?.map(criterion => `<criterion>${criterion}</criterion>`).join('\n') || ''}
        </quality_criteria>`;
    }

    /**
     * Extract evidence points from data for reasoning chain
     */
    extractEvidencePoints(cvData, activityMetrics) {
        const evidencePoints = [];
        
        // Activity-based evidence
        const commits = activityMetrics?.summary?.total_commits || 0;
        const languages = activityMetrics?.top_languages?.length || 0;
        const activityScore = activityMetrics?.summary?.activity_score || 0;
        
        if (commits > 0) {
            evidencePoints.push({
                observation: `${commits} commits across ${languages} programming languages in recent period`,
                inference: commits > 100 ? "Indicates high development velocity and technical productivity" :
                          commits > 50 ? "Shows consistent development activity and technical engagement" :
                          "Demonstrates focused technical work and code contribution",
                confidence: commits > 100 ? "high" : commits > 50 ? "medium" : "low"
            });
        }

        // Experience-based evidence
        if (cvData.experience?.length > 0) {
            const recentRole = cvData.experience[0];
            evidencePoints.push({
                observation: `Current/recent role: ${recentRole.position} at ${recentRole.company}`,
                inference: "Indicates current professional level and domain expertise",
                confidence: "high"
            });
        }

        // Skills-based evidence
        if (cvData.skills?.length > 0) {
            const skillCount = cvData.skills.length;
            const skillCategories = [...new Set(cvData.skills.map(s => s.category))].length;
            evidencePoints.push({
                observation: `${skillCount} documented skills across ${skillCategories} categories`,
                inference: skillCategories > 4 ? "Suggests broad technical versatility" :
                          skillCategories > 2 ? "Indicates solid technical breadth" :
                          "Shows focused technical specialization",
                confidence: "medium"
            });
        }

        return evidencePoints;
    }

    /**
     * Construct skills assessment prompt
     */
    constructSkillsAssessmentPrompt(cvData, activityMetrics) {
        const template = this.promptTemplates.skills_assessment;
        const persona = this.buildPersonaDefinition('technical_assessment_specialist', { cvData, activityMetrics });
        
        const skillNarrative = this.buildSkillNarrative(cvData, activityMetrics);
        const proficiencyModel = this.buildProficiencyModel();
        const industryAlignment = this.buildIndustryAlignment();
        const skillsSchema = this.buildOutputSpecification('skills_assessment');
        const accuracyChecks = this.buildAccuracyChecks('skills');

        return template.template
            .replace('{persona_definition}', persona)
            .replace('{skill_narrative}', skillNarrative)
            .replace('{proficiency_model}', proficiencyModel)
            .replace('{industry_alignment}', industryAlignment)
            .replace('{skills_schema}', skillsSchema)
            .replace('{accuracy_checks}', accuracyChecks) +
            `\n\n<source_content>
                <current_skills>${JSON.stringify(cvData.skills || [], null, 2)}</current_skills>
                <activity_languages>${JSON.stringify(activityMetrics?.top_languages || [], null, 2)}</activity_languages>
                <repository_data>${JSON.stringify(activityMetrics?.summary || {}, null, 2)}</repository_data>
            </source_content>`;
    }

    // Additional helper methods for building specific prompt components...
    buildSkillNarrative(cvData, activityMetrics) {
        const languages = activityMetrics?.top_languages?.length || 0;
        const repos = activityMetrics?.total_repos || 0;
        const activityScore = activityMetrics?.summary?.activity_score || 0;

        return `<technical_context>
            This professional demonstrates ${languages > 7 ? 'polyglot expertise' : languages > 5 ? 'multi-language proficiency' : 'focused technical expertise'} 
            across ${repos} repositories with an activity score of ${activityScore}/100.
            They function as ${activityScore > 80 ? 'a seasoned technologist with evolving AI specialization' :
                            activityScore > 60 ? 'an advanced practitioner transitioning to AI leadership' :
                            'a skilled developer expanding into AI engineering'}.
        </technical_context>`;
    }

    buildProficiencyModel() {
        return `<assessment_framework>
            <proficiency_levels>
                <expert>5+ years, mentoring others, architectural decisions, innovation contributions</expert>
                <advanced>3-5 years, complex projects, independent problem-solving, some mentoring</advanced>
                <intermediate>1-3 years, guided complex work, growing autonomy, solid fundamentals</intermediate>
                <familiar>6-12 months, basic competency, requires guidance on complex tasks</familiar>
            </proficiency_levels>
            <evidence_requirements>
                Each skill level must be supported by activity evidence or documented experience.
                Recent activity in a technology indicates current engagement and proficiency maintenance.
            </evidence_requirements>
        </assessment_framework>`;
    }

    buildIndustryAlignment() {
        return `<market_relevance>
            Current AI/ML industry priorities: MLOps, LLM integration, autonomous systems, 
            ethical AI, edge computing, multimodal AI, vector databases, transformer architectures.
            Align skill enhancement with these market-relevant capabilities while maintaining authenticity.
        </market_relevance>`;
    }

    buildAccuracyChecks(type) {
        const checks = {
            skills: [
                "Verify each skill claim against activity evidence",
                "Ensure proficiency levels align with documented experience",
                "Cross-reference languages with repository activity",
                "Validate experience years against career timeline",
                "Confirm framework knowledge with project evidence"
            ]
        };

        return `<validation_criteria>
            ${checks[type]?.map(check => `<check>${check}</check>`).join('\n') || ''}
        </validation_criteria>`;
    }
}

module.exports = { AdvancedPromptConstructor };