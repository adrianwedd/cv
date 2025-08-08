# Anthropic Best Practices for Claude Agents (2025)

*Official guidelines implemented for the Elite Agent Roster*

## 🎯 **Core Design Principles**

### **1. Simplicity First**
> "Start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic systems only when simpler solutions fall short."

**Implementation**:
- Begin with direct Claude prompts before delegating to specialized agents
- Use sub-agents only when task complexity exceeds single-agent capabilities
- Maintain clear, explicit instructions without over-engineering

### **2. Transparency Through Planning**
> "Prioritize transparency by explicitly showing the agent's planning steps."

**Implementation**:
- Each agent must articulate their approach before execution
- Use structured thinking: `<analysis>`, `<plan>`, `<execution>`, `<validation>`
- Provide clear progress indicators and decision rationales

### **3. Strategic Tool Documentation**
> "Carefully craft your agent-computer interface (ACI) through thorough tool documentation and testing."

**Implementation**:
- Precise tool specifications for each agent
- Test-driven development with expected input/output pairs
- Clear success criteria and validation methods

## 🏗️ **Sub-Agent Architecture Guidelines**

### **Context Isolation**
- Each sub-agent operates in separate context window
- Prevents context pollution in main conversation
- Maintains focus on high-level objectives
- Enables longer overall sessions

### **Single Responsibility Principle**
- Each agent has one clear, narrow specialization
- Detailed system prompts with specific constraints
- Focused expertise areas prevent capability overlap

### **Resource Scaling Rules**
```
Simple tasks:     1 agent, 3-10 tool calls
Direct comparisons: 2-4 agents, 10-15 calls each  
Complex research:   10+ agents, divided responsibilities
```

## 📋 **Agent Specification Format** 

Following Anthropic's recommended structure:

```xml
<agent_definition>
  <role>Clear role assignment and persona</role>
  <specialization>Narrow, well-defined expertise area</specialization>
  <tools>Specific tools with defined purposes</tools>
  <success_criteria>Measurable outcomes and deliverables</success_criteria>
  <delegation_triggers>When to invoke this agent</delegation_triggers>
  <context_isolation>How agent maintains separate context</context_isolation>
</agent_definition>
```

## 🎨 **Claude 4 Optimization Techniques**

### **Explicit Instructions**
- Be specific about desired output format
- Request "above and beyond" behavior explicitly if needed
- Provide context/motivation behind instructions

### **XML Structure Tags**
```xml
<task_context>Background information and requirements</task_context>
<tone_context>Communication style and approach</tone_context>
<examples>3-5 diverse, relevant examples</examples>
<thinking>Step-by-step reasoning process</thinking>
<output>Structured response format</output>
```

### **Multi-Shot Prompting**
- Include 3-5 diverse, relevant examples
- Show exact desired behavior patterns
- More examples = better performance for complex tasks

## 🔄 **Performance Optimization Patterns**

### **Test-Driven Agent Development**
1. Define expected input/output pairs
2. Write tests based on success criteria
3. Avoid mock implementations during development
4. Iterate based on empirical results

### **Visual Feedback Integration**
- Leverage Claude's visual processing capabilities
- Use screenshots for UI development reference
- Include diagrams for system architecture discussions
- Iterate outputs 2-3 times for significant improvement

### **Thinking Time Allocation**
- Include "Think step by step" in complex prompts
- Allow processing time before final outputs
- Use structured reasoning chains
- Encourage explicit problem-solving approaches

## 🎯 **Elite Agent Roster Implementation**

### **Agent Naming Convention**
- **Persona Name** (`technical-id`)
- Memorable tagline reflecting specialization
- Clear capability boundaries
- Success-oriented messaging

### **Delegation Strategy**
```
Level 1: Direct Claude prompt (simple tasks)
Level 2: Single specialized agent (focused expertise)
Level 3: Multi-agent coordination (complex workflows)
Level 4: Recursive sub-agent delegation (research/analysis)
```

### **Quality Metrics**
- Task completion accuracy
- Context preservation efficiency
- Tool usage optimization
- User satisfaction indicators
- Performance iteration improvements

## 🚀 **Production Implementation Standards**

### **Agent Initialization**
```markdown
## Agent: {Agent Name}
**Specialization**: {Core expertise area}
**Context**: {Current task requirements}
**Success Criteria**: {Measurable outcomes}
**Tools Available**: {Specific tool list}

<thinking>
Analyzing task requirements...
Planning approach...
Identifying optimal strategy...
</thinking>

<execution>
Step-by-step implementation...
</execution>
```

### **Quality Assurance**
- Each agent must demonstrate expertise through examples
- Clear escalation paths when limitations reached
- Comprehensive documentation of capabilities
- Regular performance evaluation and optimization

### **Integration Points**
- Seamless handoffs between agents
- Shared context management protocols
- Consistent output formatting standards
- Error handling and recovery procedures

## 🎭 **Elite Agent Personas (Anthropic Standard + Epic Flair)**

Following the "Start with Claude-generated agents and iteratively customize" approach:

### **The Anthropic-Approved Balance**
- **Technical Precision** ✅ (Clear specialization, measurable outcomes)
- **Memorable Personas** ✅ (Superpowers make agents more intuitive to select)  
- **Professional Excellence** ✅ (Production-ready capabilities)
- **Fun Factor** ✅ (Emoji and flair improve user experience)

**Anthropic's Actual Guidance**: *"Being specific about your desired output can help enhance results"* - and our users desire engaging, memorable agents they can easily identify and deploy!

### **Implementation Strategy**
1. **🎯 Core Competency** (Anthropic standards): Narrow specialization, clear success criteria
2. **⚡ Signature Superpowers** (User experience): Memorable capabilities that map to tools
3. **🎨 Epic Persona** (Engagement): Taglines and flair that make selection intuitive
4. **📊 Measurable Outcomes** (Production readiness): Concrete deliverables and metrics

### **The Best of Both Worlds**
```xml
<agent_definition>
  <persona>🛡️ Fortress Guardian</persona>
  <tagline>"Zero-trust by design, security through verification"</tagline>
  <superpowers>OAuth penetration testing, compliance archaeology, threat modeling mastery</superpowers>
  <anthropic_core>
    <specialization>Authentication security, data protection compliance</specialization>
    <tools>Grep (vulnerability scanning), Read (security audit), Bash (testing)</tools>
    <success_criteria>Vulnerability reports, compliance validation, implementation</success_criteria>
  </anthropic_core>
</agent_definition>
```

This implementation embodies Anthropic's 2025 technical excellence while maintaining the innovative spirit, user engagement, and memorable experiences that make our Elite Agent Roster both **professionally excellent** and **delightfully usable**! 🚀

---

*Based on official Anthropic documentation, Claude Code best practices, and multi-agent research system guidelines (2025)*