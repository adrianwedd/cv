# Naming Conventions

This document establishes consistent naming conventions across the AI-Enhanced CV System to improve code maintainability, readability, and developer experience.

## 📋 **Convention Summary**

| Context | Convention | Examples | Rationale |
|---------|------------|----------|-----------|
| **Files & Directories** | `kebab-case` | `activity-analyzer.js`, `base-cv.json` | Web-friendly, consistent with existing pattern |
| **JavaScript Variables** | `camelCase` | `analysisStartTime`, `totalCommits` | Standard JavaScript convention |
| **JavaScript Functions** | `camelCase` | `analyzeUserProfile()`, `generateCV()` | Standard JavaScript convention |
| **JavaScript Classes** | `PascalCase` | `GitHubApiClient`, `CVGenerator` | Standard JavaScript convention |
| **JavaScript Constants** | `UPPER_SNAKE_CASE` | `MAX_TOKENS`, `API_ENDPOINTS` | Standard JavaScript convention |
| **JSON Keys** | `camelCase` | `totalCommits`, `lastUpdated` | Alignment with JavaScript variables |
| **CSS Classes** | `kebab-case` | `.skill-category`, `.cv-section` | Standard CSS convention |
| **CSS Custom Properties** | `kebab-case` | `--color-primary`, `--font-size-lg` | Standard CSS convention |

## 🎯 **Implementation Priority**

### **Phase 1: Critical Alignment (High Impact)**
Converting JSON structure from `snake_case` to `camelCase` to eliminate JavaScript conversion overhead.

**Target Files:**
- `data/base-cv.json`
- `data/activity-summary.json` 
- `data/ai-enhancements.json`
- All generated data files

**Benefits:**
- Eliminates mental context switching between JavaScript and JSON
- Reduces conversion overhead in data processing
- Improves code readability and maintainability
- Aligns with JavaScript object property conventions

### **Phase 2: Code Consistency (Medium Impact)**
Ensuring all new code follows established JavaScript conventions.

**Target Areas:**
- Variable declarations in all `.js` files
- Function naming across all scripts
- Class naming and method conventions
- Constant definitions and usage

### **Phase 3: Documentation & CSS (Low Impact)**
Completing convention alignment across all project assets.

**Target Areas:**
- CSS class names and custom properties
- Documentation file references
- Workflow naming conventions
- Template variable naming

## 🔄 **JSON Structure Migration**

### **Before (snake_case)**
```json
{
  "analysis_timestamp": "2025-07-31T19:15:57.275Z",
  "total_commits": 150,
  "net_lines_contributed": 45000,
  "cv_integration": {
    "data_freshness": "2025-07-31T18:00:00.000Z",
    "ready_for_enhancement": true
  }
}
```

### **After (camelCase)**
```json
{
  "analysisTimestamp": "2025-07-31T19:15:57.275Z",
  "totalCommits": 150,
  "netLinesContributed": 45000,
  "cvIntegration": {
    "dataFreshness": "2025-07-31T18:00:00.000Z",
    "readyForEnhancement": true
  }
}
```

## 📁 **File Naming Patterns**

### **Existing Patterns (Keep)**
- **Scripts**: `activity-analyzer.js`, `claude-enhancer.js`, `cv-generator.js`
- **Stylesheets**: `styles.css`, `watch-me-work.css`
- **Data Files**: `base-cv.json`, `activity-summary.json`
- **Configuration**: `package.json`, `mkdocs.yml` (external standards)

### **New File Guidelines**
- **JavaScript Modules**: `kebab-case.js` (e.g., `content-validator.js`)
- **JSON Data**: `kebab-case.json` (e.g., `skill-mappings.json`)
- **Documentation**: `UPPER_CASE.md` for root files, `kebab-case.md` for nested docs

## 🎨 **CSS Naming Standards**

### **Class Names**
```css
/* Component classes */
.cv-header { }
.skill-category { }
.project-card { }

/* State classes */
.is-active { }
.is-hidden { }
.has-icon { }

/* Utility classes */
.text-center { }
.margin-large { }
.color-primary { }
```

### **Custom Properties**
```css
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-secondary: #10b981;
  
  /* Typography */
  --font-family-heading: 'Inter', sans-serif;
  --font-size-base: 1rem;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  
  /* Layout */
  --container-width: 1200px;
  --border-radius: 0.5rem;
}
```

## 🔧 **Implementation Guidelines**

### **For New Development**
1. **Always use camelCase** for JavaScript variables and functions
2. **Always use camelCase** for JSON object keys
3. **Always use kebab-case** for file names and CSS classes
4. **Document any deviations** with clear rationale in code comments

### **For Refactoring Existing Code**
1. **Prioritize JSON structure conversion** (highest impact)
2. **Update corresponding JavaScript object access** when changing JSON keys
3. **Maintain backward compatibility** during transition period
4. **Test thoroughly** after any naming convention changes

### **External API Boundaries**
When integrating with external APIs that use different conventions:

```javascript
// Handle conversion at API boundary
function convertToInternalFormat(externalData) {
  return {
    totalCommits: externalData.total_commits,
    lastUpdated: externalData.last_updated,
    activityScore: externalData.activity_score
  };
}

// Convert back for external APIs if needed
function convertToExternalFormat(internalData) {
  return {
    total_commits: internalData.totalCommits,
    last_updated: internalData.lastUpdated,
    activity_score: internalData.activityScore
  };
}
```

## ✅ **Validation Checklist**

Before merging any code changes:

- [ ] JavaScript variables use `camelCase`
- [ ] JavaScript functions use `camelCase`
- [ ] JavaScript classes use `PascalCase`
- [ ] JavaScript constants use `UPPER_SNAKE_CASE`
- [ ] JSON object keys use `camelCase`
- [ ] File names use `kebab-case`
- [ ] CSS classes use `kebab-case`
- [ ] CSS custom properties use `kebab-case`
- [ ] No `snake_case` in internal JSON structures
- [ ] External API conversion handled at boundaries

## 🎯 **Success Metrics**

### **Developer Experience Improvements**
- **Reduced Cognitive Load**: No more context switching between naming conventions
- **Faster Development**: Consistent patterns reduce decision fatigue  
- **Fewer Bugs**: Elimination of conversion errors between JavaScript and JSON
- **Better Maintainability**: Clear, predictable naming patterns throughout codebase

### **Code Quality Metrics**
- **Zero snake_case** in internal JSON structures
- **100% consistency** in JavaScript naming conventions
- **Standardized** CSS class and custom property naming
- **Clear documentation** of any necessary deviations

---

**Status**: 📋 **DOCUMENTED** - Ready for systematic implementation across project
**Owner**: Development Team
**Last Updated**: August 1, 2025