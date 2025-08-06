# Session Wrap-up Template

Use this template for consistent, high-quality session documentation and closure.

## 🎯 **SESSION WRAP-UP PROMPT**

*Copy this prompt and customize for each session completion:*

---

**COMPREHENSIVE SESSION CLOSURE REQUEST**

Please perform a complete session wrap-up following these priorities:

### 📋 **GitHub Issues Management**
1. **Issue Grooming**: Use the cv-groomer agent to:
   - Analyze and update all relevant GitHub issues
   - Close completed features/fixes with achievement documentation
   - Create strategic follow-up issues for discovered opportunities
   - Update issue priorities and labels for clarity
   - Generate comprehensive backlog health assessment

2. **Achievement Documentation**: For each completed objective:
   - Link to specific commits and code changes
   - Document technical implementation details
   - Record performance improvements and metrics
   - Note any architectural decisions or patterns established

### 📖 **Documentation Updates**
3. **CLAUDE.md Optimization**: 
   - Add **brief** session insights to "Critical System Insights & Learnings (Recent)" section
   - Focus on production architecture status and key technical achievements
   - Highlight operational excellence patterns learned
   - Keep historical details in PREVIOUS_SESSION_WRAPUPS.md

### 🧠 **Context Efficiency Analysis**
3.5. **Session Performance Metrics**:
   - **Context Usage**: [X%] of available context window utilized efficiently
   - **Key Files Read**: [count] - optimize for <10 per session for speed
   - **Tool Calls**: [count] - batch operations where possible
   - **Knowledge Reuse**: [X%] - how much prior session knowledge was leveraged
   - **Bootstrap Time**: [X minutes] - time from start to productive work
   - **Objective Completion Rate**: [X/Y objectives] - success percentage vs estimates

4. **NEXT_SESSION_PLAN.md Creation**:
   - Strategic planning for next development session
   - Priority ranking based on business value and technical readiness
   - Clear success criteria and implementation estimates
   - Consideration of system dependencies and prerequisites

### 💾 **Session Export**
5. **Session Summary Export**: Create comprehensive session documentation in `~/.claude/logs/`:
   - Session date, duration, and primary objectives
   - Major achievements with technical details and impact metrics
   - Challenges encountered and resolution strategies
   - System status improvements and reliability gains
   - Cost optimization results and infrastructure enhancements
   - Strategic recommendations for future development

### 🔄 **Git Flow Management**
6. **Repository Management**: Following proper git flow:
   - Commit all documentation updates with descriptive messages
   - Push to feature branch (not main) with proper branch naming
   - Ensure clean working directory and proper change isolation
   - Consider PR creation for complex changes requiring review

---

## 📊 **SESSION IMPACT TEMPLATE**

*Use this structure for consistent session impact documentation:*

### ✅ **PRIMARY OBJECTIVES ACHIEVED**
- [ ] Objective 1: [Brief description] - [Impact/metrics]
- [ ] Objective 2: [Brief description] - [Impact/metrics]  
- [ ] Objective 3: [Brief description] - [Impact/metrics]

### 🎯 **SYSTEM IMPROVEMENTS**
- **Reliability**: [Before/after metrics - e.g., 3/6 → 4/6 systems operational (+33% improvement)]
- **Performance**: [Specific improvements - e.g., CI time reduction, response times]
- **Cost Optimization**: [Cost savings or efficiency gains achieved]
- **Architecture**: [Modernization or structural improvements]

### 📈 **System Health Trending**
- **Previous Session**: [X/6] systems operational
- **Current Session**: [Y/6] systems operational ([+/-Z%] change)
- **Target Next Session**: [Z/6] systems operational
- **Reliability Trajectory**: [Improving/Stable/Declining] - [specific trend analysis]
- **Critical Systems Status**: [List any systems requiring urgent attention]

### 🔧 **TECHNICAL DELIVERABLES**
- **Code Changes**: [Files modified, lines of code, new components]
- **Infrastructure**: [New systems deployed, monitoring improvements]
- **Testing**: [Test coverage improvements, CI/CD enhancements]
- **Documentation**: [Knowledge capture, setup guides, architectural documentation]

### 🚀 **PRODUCTION READINESS**
- **Deployment Status**: [What's ready for production vs staging]
- **Monitoring**: [Health checks, alerting, analytics implemented]
- **Security**: [Authentication, authorization, data protection measures]
- **Scalability**: [Performance considerations, resource optimization]

### 💡 **STRATEGIC INSIGHTS**
- **Lessons Learned**: [Key technical or process insights]
- **Best Practices**: [Patterns established for future development]
- **Risk Mitigation**: [Preventive measures implemented]
- **Opportunities Identified**: [Future enhancements or optimizations discovered]

### 📈 **NEXT SESSION PRIORITIES**
1. **High Priority**: [Critical items requiring immediate attention]
2. **Medium Priority**: [Important enhancements with clear business value]
3. **Low Priority**: [Nice-to-have improvements or exploratory work]

---

## 🎨 **DOCUMENTATION STYLE GUIDELINES**

### Tone & Format
- **Concise & Specific**: Focus on measurable achievements and technical specifics
- **Business Value**: Always connect technical work to business impact
- **Action-Oriented**: Use active voice and concrete outcomes
- **Metric-Driven**: Include specific numbers, percentages, and performance data

### Technical Detail Level
- **Architecture Changes**: High-level patterns and design decisions
- **Performance Metrics**: Specific before/after measurements  
- **System Status**: Clear operational vs degraded vs failed categorization
- **Implementation Notes**: Key technical details for future reference

### Strategic Focus
- **Cost Optimization**: Always consider and document cost implications
- **Production Readiness**: Assess and communicate deployment status
- **Scalability**: Consider future growth and maintenance requirements
- **Risk Management**: Document potential issues and mitigation strategies

---

## 🔄 **REUSABLE SESSION CLOSURE CHECKLIST**

### Pre-Closure Validation
- [ ] All primary session objectives addressed
- [ ] System status improvements documented with metrics
- [ ] Cost optimization impacts calculated and recorded
- [ ] Technical debt or risks identified and documented
- [ ] Production readiness assessed for all deliverables

### Documentation Completion
- [ ] GitHub issues updated with achievement details
- [ ] CLAUDE.md optimized with brief session insights
- [ ] PREVIOUS_SESSION_WRAPUPS.md updated with detailed session history
- [ ] NEXT_SESSION_PLAN.md created with strategic priorities
- [ ] Session export saved to ~/.claude/logs/ with comprehensive details

### Git & Repository Management
- [ ] All changes committed with descriptive messages
- [ ] Feature branch pushed following git flow principles
- [ ] Working directory clean and properly organized
- [ ] No sensitive information or credentials committed
- [ ] Documentation links and references validated

### Quality Assurance
- [ ] Technical deliverables tested and validated
- [ ] Documentation accuracy verified
- [ ] System monitoring and health checks operational
- [ ] Performance metrics captured and analyzed
- [ ] Strategic recommendations prioritized and scheduled

---

**USAGE**: Copy the "SESSION WRAP-UP PROMPT" section and customize with session-specific details. Use the templates and checklists to ensure comprehensive, consistent session closure that maximizes knowledge capture and sets up future development success.

*This template ensures every session delivers maximum value through systematic documentation, strategic planning, and proper technical governance.*