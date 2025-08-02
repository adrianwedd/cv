#!/usr/bin/env node

/**
 * Prompt Library Manager
 * 
 * Version-controlled prompt library management system for Claude AI interactions.
 * Provides structured access to personas, templates, schemas, and examples.
 * 
 * Features:
 * - YAML persona loading and parsing
 * - XML template processing with placeholder substitution
 * - JSON schema validation
 * - Version management and caching
 * - Template compilation and optimization
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Prompt Library Manager for version-controlled prompt templates
 */
class PromptLibraryManager {
    constructor(version = 'v2.0', basePath = null) {
        this.version = version;
        this.basePath = basePath || path.join(__dirname, '../../../prompts/claude', version);
        this.cache = new Map();
        this.personas = new Map();
        this.templates = new Map();
        this.schemas = new Map();
        
        this.initialized = false;
    }

    /**
     * Initialize the prompt library by loading all components
     */
    async initialize() {
        if (this.initialized) return;

        console.log(`📚 Initializing Prompt Library ${this.version}...`);
        
        try {
            await this.loadPersonas();
            await this.loadTemplates();
            await this.loadSchemas();
            
            this.initialized = true;
            console.log(`✅ Prompt Library ${this.version} initialized successfully`);
            console.log(`   - Personas: ${this.personas.size}`);
            console.log(`   - Templates: ${this.templates.size}`);
            console.log(`   - Schemas: ${this.schemas.size}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize prompt library:', error.message);
            throw error;
        }
    }

    /**
     * Load all persona definitions from YAML files
     */
    async loadPersonas() {
        const personasPath = path.join(this.basePath, 'personas');
        
        try {
            const files = await fs.readdir(personasPath);
            const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
            
            for (const file of yamlFiles) {
                const filePath = path.join(personasPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                const persona = this.parseYAML(content);
                
                this.personas.set(persona.persona_id, {
                    ...persona,
                    _file: file,
                    _loaded: new Date()
                });
            }
            
            console.log(`📋 Loaded ${yamlFiles.length} personas`);
        } catch (error) {
            console.warn('⚠️ Failed to load personas:', error.message);
        }
    }

    /**
     * Simple YAML parser for persona files (handles the specific structure we use)
     */
    parseYAML(yamlContent) {
        const lines = yamlContent.split('\n');
        const result = {};
        const stack = [result];
        let currentLevel = 0;
        
        for (let line of lines) {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || line.trim() === '') continue;
            
            const indent = line.match(/^( *)/)[1].length;
            const content = line.trim();
            
            if (content.includes(':')) {
                const [key, value] = content.split(':', 2);
                const cleanKey = key.trim().replace(/['"]/g, '');
                const cleanValue = value ? value.trim().replace(/^['"](.*)['"]$/, '$1') : '';
                
                // Handle level changes
                const level = Math.floor(indent / 2);
                while (stack.length > level + 1) {
                    stack.pop();
                }
                
                const current = stack[stack.length - 1];
                
                if (cleanValue === '' || cleanValue === '[]' || cleanValue === '{}') {
                    // This is a parent key
                    current[cleanKey] = cleanValue === '[]' ? [] : {};
                    stack.push(current[cleanKey]);
                } else {
                    // This is a value
                    current[cleanKey] = cleanValue;
                }
            } else if (content.startsWith('-')) {
                // Array item
                const value = content.substring(1).trim().replace(/^['"](.*)['"]$/, '$1');
                const current = stack[stack.length - 1];
                if (Array.isArray(current)) {
                    current.push(value);
                }
            }
        }
        
        return result;
    }

    /**
     * Load all template definitions from XML files
     */
    async loadTemplates() {
        const templatesPath = path.join(this.basePath, 'templates');
        
        try {
            const files = await fs.readdir(templatesPath);
            const xmlFiles = files.filter(file => file.endsWith('.xml'));
            
            for (const file of xmlFiles) {
                const filePath = path.join(templatesPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                const template = this.parseXMLTemplate(content);
                
                this.templates.set(template.id, {
                    ...template,
                    _file: file,
                    _loaded: new Date(),
                    _raw_xml: content
                });
            }
            
            console.log(`📄 Loaded ${xmlFiles.length} templates`);
        } catch (error) {
            console.warn('⚠️ Failed to load templates:', error.message);
        }
    }

    /**
     * Load all schema definitions from JSON files
     */
    async loadSchemas() {
        const schemasPath = path.join(this.basePath, 'schemas');
        
        try {
            // Check if schemas directory exists
            await fs.access(schemasPath);
            
            const files = await fs.readdir(schemasPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            for (const file of jsonFiles) {
                const filePath = path.join(schemasPath, file);
                const content = await fs.readFile(filePath, 'utf8');
                const schema = JSON.parse(content);
                
                const schemaId = file.replace('.json', '');
                this.schemas.set(schemaId, {
                    ...schema,
                    _file: file,
                    _loaded: new Date()
                });
            }
            
            console.log(`🔧 Loaded ${jsonFiles.length} schemas`);
        } catch (error) {
            console.log('📝 Schemas directory not found, skipping schema loading');
        }
    }

    /**
     * Parse XML template into structured object (simplified parser)
     */
    parseXMLTemplate(xmlContent) {
        // Extract basic attributes
        const idMatch = xmlContent.match(/id="([^"]+)"/);
        const versionMatch = xmlContent.match(/version="([^"]+)"/);
        const personaMatch = xmlContent.match(/persona="([^"]+)"/);
        const createdMatch = xmlContent.match(/created="([^"]+)"/);
        
        // Extract prompt structure content
        const promptStructureMatch = xmlContent.match(/<prompt_structure>(.*?)<\/prompt_structure>/s);
        const promptStructure = promptStructureMatch ? promptStructureMatch[1].trim() : '';
        
        // Extract placeholders
        const placeholdersMatch = xmlContent.match(/<placeholders>(.*?)<\/placeholders>/s);
        const placeholders = placeholdersMatch ? this.extractSimplePlaceholders(placeholdersMatch[1]) : {};
        
        const result = {
            id: idMatch ? idMatch[1] : 'unknown',
            version: versionMatch ? versionMatch[1] : '1.0',
            persona: personaMatch ? personaMatch[1] : 'default',
            created: createdMatch ? createdMatch[1] : new Date().toISOString(),
            prompt_structure: promptStructure,
            placeholders: placeholders
        };

        return result;
    }

    /**
     * Extract placeholders from XML content (simplified)
     */
    extractSimplePlaceholders(placeholderContent) {
        const placeholders = {};
        const placeholderMatches = placeholderContent.match(/<placeholder[^>]*>/g);
        
        if (placeholderMatches) {
            placeholderMatches.forEach(match => {
                const nameMatch = match.match(/name="([^"]+)"/);
                const requiredMatch = match.match(/required="([^"]+)"/);
                const sourceMatch = match.match(/source="([^"]+)"/);
                const defaultMatch = match.match(/default="([^"]+)"/);
                
                if (nameMatch) {
                    placeholders[nameMatch[1]] = {
                        required: requiredMatch ? requiredMatch[1] === 'true' : false,
                        source: sourceMatch ? sourceMatch[1] : null,
                        default: defaultMatch ? defaultMatch[1] : null
                    };
                }
            });
        }
        
        return placeholders;
    }


    /**
     * Get persona definition by ID
     */
    async getPersona(personaId) {
        await this.initialize();
        
        const persona = this.personas.get(personaId);
        if (!persona) {
            throw new Error(`Persona not found: ${personaId}`);
        }
        
        return persona;
    }

    /**
     * Get template definition by ID
     */
    async getTemplate(templateId) {
        await this.initialize();
        
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        return template;
    }

    /**
     * Get schema definition by ID
     */
    async getSchema(schemaId) {
        await this.initialize();
        
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            console.warn(`Schema not found: ${schemaId}`);
            return null;
        }
        
        return schema;
    }

    /**
     * Construct complete prompt from template and context data
     */
    async constructPrompt(templateId, contextData = {}) {
        const template = await this.getTemplate(templateId);
        const persona = await this.getPersona(template.persona);
        
        console.log(`🔨 Constructing prompt: ${templateId} with persona: ${template.persona}`);
        
        try {
            // Build persona definition
            const personaDefinition = this.buildPersonaDefinition(persona, contextData);
            
            // Extract prompt structure
            let promptContent = template._raw_xml;
            
            // Replace placeholders
            const replacements = {
                persona_definition: personaDefinition,
                ...this.buildContextReplacements(contextData),
                ...this.buildCreativityReplacements(persona, contextData.creativityLevel),
                ...this.buildEvidenceReplacements(contextData)
            };
            
            // Perform placeholder substitution
            for (const [placeholder, value] of Object.entries(replacements)) {
                const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
                promptContent = promptContent.replace(regex, value);
            }
            
            // Extract the actual prompt content from XML structure
            const finalPrompt = this.extractPromptContent(promptContent);
            
            return {
                prompt: finalPrompt,
                metadata: {
                    template_id: templateId,
                    template_version: template.version,
                    persona_id: template.persona,
                    persona_version: persona.version,
                    constructed_at: new Date().toISOString(),
                    placeholders_used: Object.keys(replacements)
                }
            };
            
        } catch (error) {
            console.error(`❌ Failed to construct prompt ${templateId}:`, error.message);
            throw error;
        }
    }

    /**
     * Build persona definition from YAML data
     */
    buildPersonaDefinition(persona, contextData) {
        const creativityLevel = contextData.creativityLevel || 'balanced';
        const creativityAdaptation = persona.creativity_adaptations?.[creativityLevel] || {};
        
        return `<expert_persona>
            <identity>
                You are ${persona.identity.name}, ${persona.identity.title} at ${persona.identity.company}.
                You have ${persona.identity.experience_years} years of experience in ${persona.identity.specialization}.
            </identity>
            
            <expertise>
                Your primary domains include: ${Array.isArray(persona.expertise.primary_domains) ? persona.expertise.primary_domains.join(', ') : 'technical expertise'}.
                You utilize ${Array.isArray(persona.expertise.assessment_frameworks) ? persona.expertise.assessment_frameworks.join(', ') : 'standard assessment frameworks'} for evaluation.
            </expertise>
            
            <perspective>
                Your evaluation approach is ${persona.perspective.evaluation_approach}.
                You prioritize ${Array.isArray(persona.perspective.decision_criteria) ? persona.perspective.decision_criteria.join(', ') : 'quality and accuracy'} in your assessments.
                You actively avoid ${Array.isArray(persona.perspective.red_flags) ? persona.perspective.red_flags.join(', ') : 'common issues'}.
            </perspective>
            
            <creativity_adaptation>
                Focus: ${creativityAdaptation.focus || 'Balanced approach'}
                Tone: ${creativityAdaptation.tone || 'Professional and authentic'}
                Approach: ${creativityAdaptation.approach || 'Evidence-based evaluation'}
            </creativity_adaptation>
            
            <contextual_lens>
                ${this.generateContextualAdjustments(persona, contextData)}
            </contextual_lens>
        </expert_persona>`;
    }

    /**
     * Generate contextual adjustments based on activity data
     */
    generateContextualAdjustments(persona, contextData) {
        const adjustments = [];
        
        if (contextData.activityMetrics) {
            const activityScore = contextData.activityMetrics.summary?.activity_score || 0;
            const languageCount = contextData.activityMetrics.top_languages?.length || 0;
            
            // Activity-based adjustments
            if (activityScore > 80) {
                adjustments.push("This professional demonstrates exceptional development velocity and technical leadership capacity");
            } else if (activityScore > 60) {
                adjustments.push("This professional shows strong technical competency with clear growth trajectory");
            } else {
                adjustments.push("This professional exhibits focused expertise with potential for strategic expansion");
            }
            
            // Technical breadth adjustments
            if (languageCount > 7) {
                adjustments.push("Their polyglot expertise across multiple paradigms indicates architectural thinking");
            } else if (languageCount > 5) {
                adjustments.push("Their multi-language proficiency suggests adaptability and learning agility");
            }
        }
        
        // Domain-specific adjustments from persona contextual lens
        if (persona.contextual_lens?.ai_engineering_focus) {
            adjustments.push(persona.contextual_lens.ai_engineering_focus);
        }
        
        return adjustments.length > 0 ? adjustments.join('. ') + '.' : 'Standard evaluation approach applies.';
    }

    /**
     * Build context replacements for template placeholders
     */
    buildContextReplacements(contextData) {
        const replacements = {};
        
        // Activity context
        if (contextData.activityMetrics) {
            const commits = contextData.activityMetrics.summary?.total_commits || 0;
            const languages = contextData.activityMetrics.top_languages?.length || 0;
            
            if (commits > 100) {
                replacements.activity_context = `high development velocity (${commits} commits, ${languages} languages)`;
            } else if (commits > 50) {
                replacements.activity_context = `consistent development activity (${commits} commits across ${languages} languages)`;
            } else {
                replacements.activity_context = `focused development presence (${commits} commits)`;
            }
        }
        
        // Leadership capacity
        if (contextData.activityMetrics) {
            const activity = contextData.activityMetrics.summary?.activity_score || 0;
            if (activity > 80) {
                replacements.leadership_capacity = 'demonstrates technical leadership at scale';
            } else if (activity > 60) {
                replacements.leadership_capacity = 'shows emerging technical leadership';
            } else {
                replacements.leadership_capacity = 'exhibits strong individual contributor capabilities';
            }
        }
        
        // Domain areas
        if (contextData.cvData?.experience) {
            const roles = contextData.cvData.experience.slice(0, 2).map(exp => exp.position);
            replacements.domain_areas = roles.join(', ') || 'AI engineering, autonomous systems, and scalable architecture development';
        }
        
        return replacements;
    }

    /**
     * Build creativity-based replacements
     */
    buildCreativityReplacements(persona, creativityLevel = 'balanced') {
        const adaptation = persona.creativity_adaptations?.[creativityLevel] || {};
        
        return {
            creativity_approach: adaptation.focus || 'Balanced approach combining proven capabilities with growth potential',
            creativity_tone: adaptation.tone || 'Professional and authentic',
            creativity_method: adaptation.approach || 'Evidence-based evaluation with forward-looking perspective'
        };
    }

    /**
     * Build evidence-based replacements
     */
    buildEvidenceReplacements(contextData) {
        const replacements = {};
        
        if (contextData.evidencePoints && Array.isArray(contextData.evidencePoints)) {
            const evidenceChain = contextData.evidencePoints.map((point, index) => 
                `<evidence_point id="${index + 1}">
                    <observation>${point.observation}</observation>
                    <inference>${point.inference}</inference>
                    <support_level>${point.confidence}</support_level>
                </evidence_point>`
            ).join('\n');
            
            replacements.evidence_points = evidenceChain;
        } else {
            replacements.evidence_points = '<evidence_point id="1"><observation>Standard evaluation criteria apply</observation><inference>Professional assessment based on available information</inference><support_level>medium</support_level></evidence_point>';
        }
        
        return replacements;
    }

    /**
     * Extract the actual prompt content from XML structure
     */
    extractPromptContent(xmlContent) {
        try {
            // Extract content between prompt_structure tags
            const match = xmlContent.match(/<prompt_structure>(.*?)<\/prompt_structure>/s);
            return match ? match[1].trim() : xmlContent;
            
        } catch (error) {
            console.warn('⚠️ Failed to extract prompt content from XML, using raw content');
            return xmlContent;
        }
    }

    /**
     * List available personas
     */
    async listPersonas() {
        await this.initialize();
        return Array.from(this.personas.keys());
    }

    /**
     * List available templates
     */
    async listTemplates() {
        await this.initialize();
        return Array.from(this.templates.keys());
    }

    /**
     * List available schemas
     */
    async listSchemas() {
        await this.initialize();
        return Array.from(this.schemas.keys());
    }

    /**
     * Get library statistics
     */
    async getStats() {
        await this.initialize();
        
        return {
            version: this.version,
            base_path: this.basePath,
            personas: this.personas.size,
            templates: this.templates.size,
            schemas: this.schemas.size,
            initialized: this.initialized,
            cache_size: this.cache.size
        };
    }
}

module.exports = { PromptLibraryManager };