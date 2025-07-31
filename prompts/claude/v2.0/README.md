# Claude Prompt Library v2.0

**Version-Controlled Prompt Engineering System**

This directory contains a comprehensive, version-controlled library for managing Claude AI prompts as code. The system implements advanced prompt engineering techniques based on research from `docs/research/claude-prompt-engineering-framework.md`.

## 📁 Directory Structure

```
prompts/claude/v2.0/
├── README.md                 # This documentation
├── personas/                 # Expert persona definitions
│   ├── senior-technical-recruiter.yaml
│   ├── technical-assessment-specialist.yaml
│   ├── executive-recruiter.yaml
│   └── technical-product-manager.yaml
├── templates/                # Prompt templates with XML structure
│   ├── professional-summary.xml
│   ├── skills-assessment.xml
│   ├── experience-enhancement.xml
│   └── projects-showcase.xml
├── schemas/                  # Output schemas and validation
│   ├── professional-summary-schema.json
│   ├── skills-assessment-schema.json
│   ├── experience-enhancement-schema.json
│   └── projects-showcase-schema.json
└── examples/                 # Example prompts and responses
    ├── professional-summary-examples.md
    ├── skills-assessment-examples.md
    └── validation-examples.md
```

## 🎯 Design Principles

### 1. **Separation of Concerns**
- **Personas**: Domain expert definitions separate from templates
- **Templates**: Reusable prompt structures with placeholders
- **Schemas**: Output validation specifications
- **Examples**: Reference implementations and test cases

### 2. **Version Control Integration**
- All prompts tracked in Git with semantic versioning
- Clear changelog for prompt modifications
- Branch-based experimentation and A/B testing
- Rollback capabilities for prompt regressions

### 3. **Advanced Prompt Engineering**
- XML-structured prompts for clarity and parsing
- Evidence-based reasoning chains
- Context-aware persona integration
- Dynamic creativity level adaptation

### 4. **Quality Assurance**
- Comprehensive validation schemas
- Generic language detection
- Cross-validation with data sources
- Confidence scoring and quality metrics

## 🚀 Usage

### Loading Prompts Programmatically

```javascript
const { PromptLibrary } = require('./prompt-library-manager');

const library = new PromptLibrary('v2.0');
const template = await library.getTemplate('professional-summary');
const persona = await library.getPersona('senior-technical-recruiter');
const schema = await library.getSchema('professional-summary-schema');

const prompt = library.constructPrompt(template, persona, contextData);
```

### Prompt Template Structure

All templates follow this XML structure:

```xml
<prompt_structure version="2.0">
    <persona>{persona_definition}</persona>
    <context_integration>{narrative_context}</context_integration>
    <enhancement_philosophy>{creativity_strategy}</enhancement_philosophy>
    <quality_framework>{quality_criteria}</quality_framework>
    <output_specification>{structured_output}</output_specification>
    <reasoning_chain>{evidence_chain}</reasoning_chain>
</prompt_structure>
```

## 📊 Quality Metrics

Each prompt template includes:
- **Confidence Scoring**: 0-100 quality assessment
- **Generic Language Detection**: Automated flagging
- **Evidence Requirements**: Data validation rules
- **Fallback Strategies**: Error handling approaches

## 🔄 Version Management

### Current Version: v2.0
- Advanced XML-structured prompts
- Evidence-based reasoning integration
- Context-aware persona system
- Comprehensive validation framework

### Previous Versions
- v1.0: Basic prompt templates (legacy)

## 🛠️ Development Workflow

1. **Create/Modify Prompts**: Edit templates in appropriate directories
2. **Version Control**: Commit changes with semantic versioning
3. **Testing**: Use examples directory for validation
4. **Integration**: Update prompt library manager
5. **Deployment**: Integrate with enhancement orchestration

## 📝 Contributing

When adding new prompts:
1. Follow the XML template structure
2. Include comprehensive validation schemas
3. Add examples and test cases
4. Update this README with changes
5. Use semantic versioning for updates

## 📚 References

- [Claude Prompt Engineering Framework](../../../docs/research/claude-prompt-engineering-framework.md)
- [Advanced Prompt Constructor](../../../.github/scripts/enhancer-modules/advanced-prompt-constructor.js)
- [Content Enhancers v2.0](../../../.github/scripts/enhancer-modules/content-enhancers.js)

---

**Last Updated**: 2025-07-31  
**Version**: v2.0  
**Maintainer**: Adrian Wedd