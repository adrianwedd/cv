#!/usr/bin/env node

/**
 * Advanced XML Prompt Constructor
 * 
 * Issue #97: XML Tag Structuring for Enhanced AI Output Quality
 * Issue #96: Few-Shot Prompting Integration for Consistency
 * 
 * This module implements sophisticated XML-structured prompt engineering with
 * few-shot examples to dramatically improve Claude AI output quality and consistency.
 * 
 * Key Features:
 * - Structured XML prompt formatting for clarity
 * - Few-shot examples for consistent output patterns
 * - Evidence-based reasoning chains
 * - Output validation and quality scoring
 * - Template-based prompt construction
 * - Dynamic example selection based on context
 * 
 * @author Adrian Wedd
 * @version 2.1.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Advanced XML-structured prompt constructor with few-shot learning
 */
class AdvancedXMLPromptConstructor {
    constructor() {
        this.templates = new Map();
        this.fewShotExamples = new Map();
        this.validationSchemas = new Map();
        this.qualityMetrics = new Map();
        
        this.initialized = false;
    }

    /**
     * Initialize the constructor with templates and examples
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🔨 Initializing Advanced XML Prompt Constructor...');
        
        await this.loadFewShotExamples();
        await this.loadValidationSchemas();
        
        this.initialized = true;
        console.log('✅ Advanced XML Prompt Constructor initialized');
    }

    /**
     * Load few-shot examples for different content types
     */
    async loadFewShotExamples() {
        // Professional Summary Few-Shot Examples
        this.fewShotExamples.set('professional-summary', {
            conservative: {
                input: {
                    current_summary: "AI Engineer with experience in machine learning systems.",
                    activity_score: 65,
                    languages: ["Python", "JavaScript", "Go"],
                    evidence: ["5 ML projects", "2 years experience", "strong GitHub activity"]
                },
                expected_output: {
                    enhanced_summary: "AI Engineer with 2+ years developing production machine learning systems, demonstrated through 5 ML projects and consistent GitHub contributions across Python, JavaScript, and Go ecosystems.",
                    key_differentiators: ["Production ML system development", "Multi-language proficiency", "Consistent delivery track record"],
                    technical_positioning: "Mid-level AI Engineer positioned for senior individual contributor roles with proven delivery capabilities",
                    confidence_indicators: ["5 documented ML projects", "Multi-language GitHub activity", "65/100 activity score indicating consistent contribution"],
                    market_relevance: "Aligns with market demand for experienced ML engineers with proven delivery capabilities"
                }
            },
            balanced: {
                input: {
                    current_summary: "Software architect specializing in autonomous systems and distributed computing.",
                    activity_score: 78,
                    languages: ["Python", "Rust", "TypeScript", "C++"],
                    evidence: ["Led 3 autonomous systems projects", "15+ repositories", "Industry recognition"]
                },
                expected_output: {
                    enhanced_summary: "Software Architect driving autonomous systems innovation with 15+ open-source projects and leadership in 3 production autonomous systems, spanning high-performance computing in Rust/C++ and intelligent interfaces in Python/TypeScript.",
                    key_differentiators: ["Autonomous systems architecture leadership", "High-performance computing expertise", "Open-source innovation track record", "Cross-domain technical bridging"],
                    technical_positioning: "Senior technical leader positioned for autonomous systems architecture and technical leadership roles",
                    confidence_indicators: ["3 autonomous systems projects led", "15+ repositories indicating prolific development", "78/100 activity score showing technical leadership", "Multi-paradigm language mastery"],
                    market_relevance: "Strongly aligned with growing demand for autonomous systems architects and technical leaders in AI infrastructure"
                }
            },
            creative: {
                input: {
                    current_summary: "ML researcher transitioning to industry applications of AI agents.",
                    activity_score: 85,
                    languages: ["Python", "Julia", "JavaScript", "Rust"],
                    evidence: ["PhD in ML", "20+ research papers", "Novel algorithms developed"]
                },
                expected_output: {
                    enhanced_summary: "ML Researcher bridging cutting-edge algorithmic innovation with practical AI agent systems, bringing 20+ research publications and novel algorithm development expertise to transform theoretical breakthroughs into production-ready autonomous solutions.",
                    key_differentiators: ["Research-to-production bridge expertise", "Novel algorithm development capability", "AI agent system specialization", "Academic-industry translation skills"],
                    technical_positioning: "Technical innovator positioned for senior research engineering roles in AI agent development and algorithmic innovation",
                    confidence_indicators: ["20+ peer-reviewed publications", "PhD-level theoretical foundation", "85/100 activity score indicating exceptional productivity", "Multi-paradigm expertise across research and production languages"],
                    market_relevance: "Perfectly positioned for the emerging AI agent market where theoretical innovation meets practical implementation"
                }
            }
        });

        // Skills Enhancement Few-Shot Examples
        this.fewShotExamples.set('skills-enhancement', {
            conservative: {
                input: {
                    current_skills: ["Python", "Machine Learning", "Docker", "AWS"],
                    activity_evidence: ["50+ commits in Python", "ML projects deployed", "Container orchestration experience"],
                    activity_score: 60
                },
                expected_output: {
                    skill_architecture: {
                        core_competencies: [
                            { skill: "Python Development", proficiency: "Advanced", evidence: "50+ commits demonstrating consistent Python usage across projects" },
                            { skill: "Machine Learning Systems", proficiency: "Intermediate-Advanced", evidence: "Multiple ML projects with production deployment evidence" },
                            { skill: "Container Orchestration", proficiency: "Intermediate", evidence: "Docker implementation across projects with AWS deployment patterns" }
                        ],
                        emerging_expertise: ["MLOps pipeline development", "Cloud architecture optimization"],
                        market_differentiators: ["Production ML deployment experience", "Full-stack ML system development"]
                    },
                    development_roadmap: {
                        immediate_priorities: ["Advanced MLOps practices", "Kubernetes orchestration"],
                        strategic_investments: ["AI system architecture", "Real-time ML serving"],
                        innovation_opportunities: ["Edge ML deployment", "AutoML system development"]
                    }
                }
            }
        });

        // Experience Enhancement Few-Shot Examples
        this.fewShotExamples.set('experience-enhancement', {
            balanced: {
                input: {
                    experience: [{
                        position: "Senior Software Engineer",
                        company: "TechCorp",
                        period: "2022-2024",
                        achievements: ["Built ML pipeline", "Led team of 3", "Improved performance by 40%"]
                    }],
                    activity_score: 75
                },
                expected_output: {
                    experience_transformation: [{
                        role_title: "Senior Software Engineer - ML Systems Architecture",
                        impact_narrative: "Architected and delivered production ML pipeline serving 100K+ daily users, leading a 3-engineer team to achieve 40% performance improvement through innovative caching and optimization strategies.",
                        key_achievements: [
                            "Designed scalable ML pipeline architecture serving 100K+ daily users with 99.9% uptime",
                            "Led cross-functional team of 3 engineers in implementing performance optimization resulting in 40% latency reduction",
                            "Established MLOps practices that reduced deployment cycle time from 2 weeks to 2 days"
                        ],
                        technical_leadership_evidence: "Demonstrated technical leadership through team coordination, architectural decision-making, and measurable system performance improvements"
                    }]
                }
            }
        });

        console.log(`📚 Loaded few-shot examples for ${this.fewShotExamples.size} content types`);
    }

    /**
     * Load validation schemas for output quality assurance
     */
    async loadValidationSchemas() {
        this.validationSchemas.set('professional-summary', {
            required_fields: ['enhanced_summary', 'key_differentiators', 'technical_positioning'],
            field_constraints: {
                enhanced_summary: { min_length: 100, max_length: 500, sentence_count: [2, 3] },
                key_differentiators: { min_items: 2, max_items: 5 },
                technical_positioning: { min_length: 50, max_length: 200 }
            },
            quality_criteria: {
                no_generic_terms: ['cutting-edge', 'seamlessly', 'innovative solutions', 'synergistic'],
                required_specificity: ['languages', 'technologies', 'quantified_impact'],
                evidence_traceability: true
            }
        });

        this.validationSchemas.set('skills-enhancement', {
            required_fields: ['skill_architecture', 'development_roadmap'],
            field_constraints: {
                'skill_architecture.core_competencies': { min_items: 3, max_items: 8 },
                'development_roadmap.immediate_priorities': { min_items: 2, max_items: 4 }
            },
            quality_criteria: {
                evidence_based: true,
                specific_technologies: true,
                growth_oriented: true
            }
        });

        console.log(`🔧 Loaded validation schemas for ${this.validationSchemas.size} content types`);
    }

    /**
     * Construct XML-structured prompt with few-shot examples
     */
    async constructXMLPrompt(promptType, contextData, creativityLevel = 'balanced') {
        await this.initialize();

        console.log(`🔨 Constructing XML prompt: ${promptType} (${creativityLevel})`);

        const fewShotExamples = this.getFewShotExamples(promptType, creativityLevel);
        const validationSchema = this.validationSchemas.get(promptType);

        const xmlPrompt = this.buildXMLStructure({
            promptType,
            contextData,
            creativityLevel,
            fewShotExamples,
            validationSchema
        });

        return {
            prompt: xmlPrompt,
            metadata: {
                prompt_type: promptType,
                creativity_level: creativityLevel,
                few_shot_examples_used: fewShotExamples ? fewShotExamples.length : 0,
                validation_schema_applied: !!validationSchema,
                constructed_at: new Date().toISOString()
            }
        };
    }

    /**
     * Build comprehensive XML-structured prompt
     */
    buildXMLStructure({ promptType, contextData, creativityLevel, fewShotExamples, validationSchema }) {
        return `<prompt_engineering_framework>
    <meta_instructions>
        You are a professional ${promptType} enhancement specialist. You MUST respond with ONLY the requested JSON structure. 
        NEVER include explanatory text, process descriptions, or meta-commentary.
        Follow the examples provided and ensure your response matches the quality standards.
    </meta_instructions>

    <expert_context>
        <persona>
            ${this.buildPersonaContext(promptType, creativityLevel)}
        </persona>
        
        <evaluation_framework>
            <approach>${this.getCreativityApproach(creativityLevel)}</approach>
            <quality_focus>${this.getQualityFocus(creativityLevel)}</quality_focus>
            <market_context>Current AI/ML engineering market demands professionals who bridge theoretical knowledge with production implementation</market_context>
        </evaluation_framework>
    </expert_context>

    <candidate_analysis>
        <technical_profile>
            <activity_score>${contextData.activityScore || 'N/A'}/100</activity_score>
            <languages>${contextData.languages?.join(', ') || 'Multiple technologies'}</languages>
            <repositories>${contextData.repositories || 'N/A'}</repositories>
            <specialization>${contextData.specialization || 'AI/ML engineering and software architecture'}</specialization>
        </technical_profile>
        
        <evidence_base>
            ${this.buildEvidenceChain(contextData.evidence || [])}
        </evidence_base>
        
        <positioning_context>
            ${this.buildPositioningContext(contextData)}
        </positioning_context>
    </candidate_analysis>

    <few_shot_learning>
        <instruction>Study these examples to understand the expected quality and format:</instruction>
        ${this.renderFewShotExamples(fewShotExamples)}
    </few_shot_learning>

    <current_content>
        <content_to_enhance>
            ${this.formatContentForEnhancement(contextData.currentContent, promptType)}
        </content_to_enhance>
    </current_content>

    <enhancement_requirements>
        <quality_standards>
            ${this.buildQualityStandards(validationSchema)}
        </quality_standards>
        
        <output_specification>
            ${this.buildOutputSpecification(promptType, validationSchema)}
        </output_specification>
        
        <validation_criteria>
            ${this.buildValidationCriteria(validationSchema)}
        </validation_criteria>
    </enhancement_requirements>

    <response_instructions>
        <format>JSON only - no additional text or explanations</format>
        <quality>Match or exceed the few-shot examples in specificity and professional language</quality>
        <evidence>Ensure every claim is traceable to the provided evidence base</evidence>
        <authenticity>Balance confidence with authenticity - avoid unsupported superlatives</authenticity>
    </response_instructions>
</prompt_engineering_framework>`;
    }

    /**
     * Build persona context based on prompt type and creativity level
     */
    buildPersonaContext(promptType, creativityLevel) {
        const personas = {
            'professional-summary': {
                conservative: 'Alexandra Chen, Senior Technical Recruiter at Microsoft with 8 years experience placing AI/ML professionals',
                balanced: 'Dr. Marcus Rodriguez, Executive Search Partner specializing in AI leadership roles',
                creative: 'Sarah Kim, Chief Talent Officer at OpenAI identifying breakthrough AI talent',
                innovative: 'Dr. Elena Vasquez, Venture Partner at Sequoia focusing on AI moonshots'
            },
            'skills-enhancement': {
                conservative: 'Dr. James Liu, Principal Engineering Manager at Google DeepMind',
                balanced: 'Maria Santos, VP of Engineering at Anthropic',
                creative: 'Dr. Raj Patel, CTO at Scale AI',
                innovative: 'Alex Chen, Co-founder and CTO of Adept AI'
            },
            'experience-enhancement': {
                conservative: 'Linda Zhang, Executive Coach specializing in AI leadership transitions',
                balanced: 'Carlos Rivera, Career Strategy Partner at Sequoia Capital',
                creative: 'Dr. Aisha Patel, Executive Career Architect for AI unicorn startups',
                innovative: 'Morgan Kim, Chief People Officer at OpenAI'
            }
        };

        return personas[promptType]?.[creativityLevel] || personas[promptType]?.balanced || 'Professional enhancement specialist';
    }

    /**
     * Get creativity approach based on level
     */
    getCreativityApproach(creativityLevel) {
        const approaches = {
            conservative: 'Evidence-based optimization with proven industry language',
            balanced: 'Strategic positioning that balances innovation with credibility',
            creative: 'Innovative narrative that positions for future opportunities',
            innovative: 'Revolutionary positioning for paradigm-shifting roles'
        };
        return approaches[creativityLevel] || approaches.balanced;
    }

    /**
     * Get quality focus based on creativity level
     */
    getQualityFocus(creativityLevel) {
        const focuses = {
            conservative: 'Quantifiable achievements and established expertise',
            balanced: 'Unique value proposition with market awareness',
            creative: 'Transformative potential and cutting-edge innovation',
            innovative: 'Groundbreaking innovation and industry disruption'
        };
        return focuses[creativityLevel] || focuses.balanced;
    }

    /**
     * Build evidence chain from provided evidence
     */
    buildEvidenceChain(evidence) {
        if (!evidence || evidence.length === 0) {
            return '<evidence_point>Standard professional evaluation based on available information</evidence_point>';
        }

        return evidence.map((item, index) => 
            `<evidence_point id="${index + 1}">
                <observation>${item.observation || item}</observation>
                <inference>${item.inference || 'Supports professional capability claims'}</inference>
                <confidence>${item.confidence || 'medium'}</confidence>
            </evidence_point>`
        ).join('\n        ');
    }

    /**
     * Build positioning context
     */
    buildPositioningContext(contextData) {
        const activityLevel = contextData.activityScore >= 80 ? 'exceptional' : 
                            contextData.activityScore >= 60 ? 'strong' : 
                            contextData.activityScore >= 40 ? 'focused' : 'specialized';
        
        return `<positioning>
            <activity_characterization>${activityLevel} development activity indicating ${this.getActivityImplication(activityLevel)}</activity_characterization>
            <market_positioning>${this.getMarketPositioning(contextData)}</market_positioning>
            <differentiation_opportunity>${this.getDifferentiationOpportunity(contextData)}</differentiation_opportunity>
        </positioning>`;
    }

    /**
     * Get activity implication
     */
    getActivityImplication(activityLevel) {
        const implications = {
            exceptional: 'technical leadership capacity and innovation potential',
            strong: 'consistent delivery capability and growth trajectory',
            focused: 'deep expertise with strategic development approach',
            specialized: 'concentrated expertise with quality-focused contributions'
        };
        return implications[activityLevel];
    }

    /**
     * Get market positioning
     */
    getMarketPositioning(contextData) {
        if (contextData.languages?.length >= 5) {
            return 'Polyglot technologist positioned for architecture and technical leadership roles';
        } else if (contextData.languages?.length >= 3) {
            return 'Multi-platform engineer ready for senior technical roles';
        } else {
            return 'Specialized expert positioned for domain leadership roles';
        }
    }

    /**
     * Get differentiation opportunity
     */
    getDifferentiationOpportunity(contextData) {
        const specializations = contextData.specialization || '';
        if (specializations.toLowerCase().includes('ai') || specializations.toLowerCase().includes('ml')) {
            return 'AI/ML specialization provides competitive advantage in high-growth market';
        }
        return 'Technical expertise provides foundation for expanded market opportunities';
    }

    /**
     * Render few-shot examples in XML format
     */
    renderFewShotExamples(examples) {
        if (!examples || examples.length === 0) {
            return '<example_set>No specific examples available for this context</example_set>';
        }

        return examples.map((example, index) => 
            `<example id="${index + 1}">
                <input>
                    ${JSON.stringify(example.input, null, 8).replace(/^/gm, '            ')}
                </input>
                <expected_output>
                    ${JSON.stringify(example.expected_output, null, 8).replace(/^/gm, '            ')}
                </expected_output>
                <quality_notes>
                    <note>Observe the specificity and evidence-based nature of the enhancement</note>
                    <note>Note the professional language without generic buzzwords</note>
                    <note>See how technical indicators are specifically identified</note>
                </quality_notes>
            </example>`
        ).join('\n        ');
    }

    /**
     * Format content for enhancement based on prompt type
     */
    formatContentForEnhancement(content, promptType) {
        switch (promptType) {
            case 'professional-summary':
                return `<current_summary>${content}</current_summary>`;
            case 'skills-enhancement':
                return `<current_skills>${JSON.stringify(content, null, 8)}</current_skills>`;
            case 'experience-enhancement':
                return `<current_experience>${JSON.stringify(content, null, 8)}</current_experience>`;
            default:
                return `<current_content>${content}</current_content>`;
        }
    }

    /**
     * Build quality standards section
     */
    buildQualityStandards(validationSchema) {
        if (!validationSchema) {
            return '<standard>Professional quality with evidence-based claims</standard>';
        }

        const standards = [];
        if (validationSchema.quality_criteria?.no_generic_terms) {
            standards.push(`<language_quality>Avoid generic terms: ${validationSchema.quality_criteria.no_generic_terms.join(', ')}</language_quality>`);
        }
        if (validationSchema.quality_criteria?.evidence_traceability) {
            standards.push('<evidence_requirement>Every claim must be traceable to provided evidence</evidence_requirement>');
        }
        if (validationSchema.quality_criteria?.required_specificity) {
            standards.push(`<specificity_requirement>Include specific technical indicators: ${validationSchema.quality_criteria.required_specificity.join(', ')}</specificity_requirement>`);
        }

        return standards.join('\n        ') || '<standard>Professional quality standards apply</standard>';
    }

    /**
     * Build output specification section
     */
    buildOutputSpecification(promptType, validationSchema) {
        const specs = ['<format>JSON structure matching the few-shot examples</format>'];
        
        if (validationSchema?.required_fields) {
            specs.push(`<required_fields>${validationSchema.required_fields.join(', ')}</required_fields>`);
        }
        
        if (validationSchema?.field_constraints) {
            const constraints = Object.entries(validationSchema.field_constraints)
                .map(([field, constraint]) => `<field_constraint field="${field}">${JSON.stringify(constraint)}</field_constraint>`)
                .join('\n            ');
            specs.push(constraints);
        }

        return specs.join('\n        ');
    }

    /**
     * Build validation criteria section
     */
    buildValidationCriteria(validationSchema) {
        if (!validationSchema) {
            return '<criterion>Professional quality and accuracy</criterion>';
        }

        const criteria = [];
        if (validationSchema.field_constraints) {
            Object.entries(validationSchema.field_constraints).forEach(([field, constraints]) => {
                if (constraints.min_length) {
                    criteria.push(`<length_validation field="${field}">Minimum ${constraints.min_length} characters</length_validation>`);
                }
                if (constraints.sentence_count) {
                    criteria.push(`<structure_validation field="${field}">Must contain ${constraints.sentence_count[0]}-${constraints.sentence_count[1]} sentences</structure_validation>`);
                }
            });
        }

        return criteria.join('\n        ') || '<criterion>Standard professional validation applies</criterion>';
    }

    /**
     * Get few-shot examples for prompt type and creativity level
     */
    getFewShotExamples(promptType, creativityLevel) {
        const examples = this.fewShotExamples.get(promptType);
        if (!examples) return [];

        // Return examples that match creativity level, with fallbacks
        const selectedExamples = [];
        
        if (examples[creativityLevel]) {
            selectedExamples.push(examples[creativityLevel]);
        }
        
        // Add balanced example as fallback if not already included
        if (creativityLevel !== 'balanced' && examples.balanced) {
            selectedExamples.push(examples.balanced);
        }

        return selectedExamples;
    }

    /**
     * Validate output against schema
     */
    validateOutput(output, promptType) {
        const schema = this.validationSchemas.get(promptType);
        if (!schema) return { valid: true, score: 0.8 };

        const validationResults = {
            valid: true,
            errors: [],
            warnings: [],
            score: 1.0
        };

        // Check required fields
        if (schema.required_fields) {
            schema.required_fields.forEach(field => {
                if (!output[field]) {
                    validationResults.errors.push(`Missing required field: ${field}`);
                    validationResults.valid = false;
                    validationResults.score -= 0.3;
                }
            });
        }

        // Check field constraints
        if (schema.field_constraints) {
            Object.entries(schema.field_constraints).forEach(([field, constraints]) => {
                const value = this.getNestedValue(output, field);
                if (value && constraints.min_length && value.length < constraints.min_length) {
                    validationResults.warnings.push(`Field ${field} below minimum length`);
                    validationResults.score -= 0.1;
                }
            });
        }

        // Check quality criteria
        if (schema.quality_criteria?.no_generic_terms) {
            const text = JSON.stringify(output).toLowerCase();
            schema.quality_criteria.no_generic_terms.forEach(term => {
                if (text.includes(term.toLowerCase())) {
                    validationResults.warnings.push(`Contains generic term: ${term}`);
                    validationResults.score -= 0.1;
                }
            });
        }

        validationResults.score = Math.max(0, validationResults.score);
        return validationResults;
    }

    /**
     * Get nested object value by path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Get constructor statistics
     */
    getStats() {
        return {
            initialized: this.initialized,
            few_shot_examples: this.fewShotExamples.size,
            validation_schemas: this.validationSchemas.size,
            supported_prompt_types: Array.from(this.fewShotExamples.keys())
        };
    }
}

export { AdvancedXMLPromptConstructor };