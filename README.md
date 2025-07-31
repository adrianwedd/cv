# 🚀 Adrian Wedd - Dynamic CV Repository

**Intelligent, GitHub-Integrated Professional Portfolio with AI-Powered Content Enhancement**

<div align="center">

[![CV Build Status](https://github.com/adrianwedd/cv/workflows/🚀%20CV%20Auto-Enhancement%20Pipeline/badge.svg)](https://github.com/adrianwedd/cv/actions)
[![GitHub release](https://img.shields.io/github/release/adrianwedd/cv.svg)](https://github.com/adrianwedd/cv/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live CV](https://img.shields.io/badge/🌐_Live_CV-adrianwedd.github.io-success)](https://adrianwedd.github.io/cv)

[![Claude AI](https://img.shields.io/badge/🤖_AI-Claude_Enhanced-blue)](https://claude.ai)
[![GitHub Activity](https://img.shields.io/badge/📊_Activity-Tracked_Daily-brightgreen)](https://github.com/adrianwedd/cv)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Security Policy](https://img.shields.io/badge/Security-Policy-red.svg)](SECURITY.md)

</div>

## 🎯 **Project Overview**

This repository represents a next-generation approach to professional CV management, combining:

- **🤖 AI-Powered Content Enhancement** - Claude AI integration for intelligent content optimization
- **📊 GitHub Activity Analytics** - Real-time integration of professional development metrics
- **🔄 Automated CI/CD Pipeline** - Sophisticated GitHub Actions for continuous CV enhancement
- **📱 Responsive Modern Design** - Professional, accessible, and mobile-optimized presentation
- **📈 Dynamic Metrics Tracking** - Live professional development insights and analytics

## 🏗️ **Architecture Overview**

```
cv/
├── 📄 index.html              # Main CV webpage (responsive design)
├── 🎨 assets/
│   ├── styles.css             # Modern CSS with dark/light themes
│   ├── script.js              # Interactive features and animations
│   └── base-cv.json           # Dynamic CV data (AI & activity enhanced)
├── 📊 .github/
│   ├── workflows/
│   │   ├── cv-enhancement.yml    # Main CV enrichment workflow
│   │   └── activity-tracker.yml  # GitHub activity integration
│   └── scripts/
│       ├── activity-analyzer.js  # GitHub metrics processor
│       ├── claude-enhancer.js    # AI content enhancement
│       └── cv-generator.js       # Dynamic CV compilation
├── 📂 data/
│   ├── base-cv.json           # Static CV foundation
│   ├── activity-metrics.json  # GitHub activity data
│   └── ai-enhancements.json   # Claude-generated improvements
├── 📚 docs/
│   ├── ARCHITECTURE.md        # Detailed system architecture
│   ├── CI-WORKFLOWS.md        # Workflow documentation
│   └── CUSTOMIZATION.md       # Personalization guide
└── 🔧 config/
    ├── cv-config.yml          # CV structure configuration
    └── ai-prompts.yml         # Claude enhancement prompts
```

## ✨ **Key Features**

### 🤖 **AI-Powered Enhancement**
- **Intelligent Content Optimization**: Claude AI analyzes and enhances CV content for maximum impact
- **💰 Zero-Cost AI Usage**: Browser automation provides free Claude AI access (saves $200-400/month)
- **Professional Tone Refinement**: Automatic improvement of descriptions and summaries
- **Skills Gap Analysis**: AI-driven recommendations for professional development
- **Industry Trend Integration**: Dynamic updates based on current tech landscape
- **🔐 Multiple Authentication Methods**: Browser automation, OAuth, and API key fallbacks

### 📊 **GitHub Activity Integration**
- **Live Commit Analytics**: Real-time tracking of coding activity and contributions
- **Repository Insights**: Automatic analysis of project complexity and impact
- **Language Proficiency Tracking**: Dynamic skill assessment based on code contributions
- **Collaboration Metrics**: Team contributions and open-source engagement analysis

### 🔄 **Automated CI/CD Pipeline**
The system leverages sophisticated GitHub Actions for continuous integration and delivery of your CV. For detailed information on the workflows, their schedules, and purposes, please refer to the [Workflow Documentation](docs/workflows.md).

### 📱 **Modern Professional Presentation**
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing
- **Interactive Elements**: Smooth animations and professional transitions
- **Accessibility First**: WCAG 2.1 AA compliance with screen reader support
- **Print Optimization**: Professional PDF generation capabilities

## 🚀 **Quick Start**

### 1. **Repository Setup**
```bash
# Create new repository
gh repo create adrianwedd/cv --public --description "AI-Enhanced Dynamic Professional CV"

# Clone and setup
git clone https://github.com/adrianwedd/cv.git
cd cv

# Enable GitHub Pages
gh api repos/adrianwedd/cv -X PATCH -f has_pages=true
gh api repos/adrianwedd/cv/pages -X POST -f source.branch=main -f source.path=/
```

### 2. **Configure Authentication**

#### **🆓 Browser Authentication (Recommended - FREE)**
```bash
# Navigate to scripts directory
cd .github/scripts

# Copy environment template
cp .env.example .env

# Extract cookies from claude.ai (see CLAUDE.md for detailed instructions)
# Edit .env with your Claude.ai session cookies

# Test authentication
node claude-browser-client.js test --visible

# Save cookies to GitHub secrets
node setup-claude-cookies.js
```

#### **💳 Alternative: API Key Authentication**
```bash
# Add required GitHub secrets for API-based usage
gh secret set ANTHROPIC_API_KEY --body "your-claude-api-key"
gh secret set PERSONAL_ACCESS_TOKEN --body "your-github-token-with-repo-access"

# Optional: Configure custom domain
gh secret set CUSTOM_DOMAIN --body "cv.adrianwedd.com"
```

> **💡 Cost Comparison**: Browser authentication saves $200-400/month compared to API usage!

### 3. **Customize Configuration**
```bash
# Edit base CV data
vim data/base-cv.json

# Configure AI enhancement prompts
vim config/ai-prompts.yml

# Customize CV structure
vim config/cv-config.yml
```

### 4. **Enable Workflows**
```bash
# Enable GitHub Actions
git add .
git commit -m "🚀 Initialize AI-Enhanced CV System"
git push origin main

# Manual trigger for immediate processing
gh workflow run cv-enhancement.yml
```

## 🎨 **Professional Design System**

### **Modern CSS Architecture**
- **Design Tokens**: Consistent spacing, typography, and color systems
- **Component Library**: Reusable CV section components
- **Responsive Grid**: Mobile-first design with progressive enhancement
- **Dark/Light Themes**: Professional appearance options

### **Interactive Features**
- **Smooth Animations**: Professional transitions and micro-interactions
- **Progressive Enhancement**: Core functionality without JavaScript
- **Print Optimization**: Professional PDF-ready styling
- **Performance First**: Optimized loading and rendering

## 📊 **Analytics & Insights**

### **Professional Development Metrics**
```json
{
  "coding_velocity": {
    "commits_per_week": 23,
    "languages_active": 8,
    "project_complexity_avg": 7.2
  },
  "collaboration": {
    "pull_requests_reviewed": 15,
    "issues_resolved": 8,
    "community_contributions": 12
  },
  "growth_indicators": {
    "new_technologies": ["Next.js", "Claude AI", "GitHub Actions"],
    "skill_progression": "Advanced → Expert (Python, JavaScript)",
    "industry_alignment": 94.2
  }
}
```

### **AI Enhancement Insights**
- **Content Optimization Score**: Tracking improvement in professional presentation
- **Industry Relevance Rating**: AI assessment of skills market alignment  
- **Professional Impact Analysis**: Quantified career progression indicators
- **Competitive Positioning**: Market differentiation analysis

## 🔒 **Security & Privacy**

### **Data Protection**
- **Minimal Data Collection**: Only public GitHub activity processed
- **Secure Token Management**: GitHub secrets for API access
- **Privacy First**: No personal data exposure beyond public repositories
- **GDPR Compliance**: Right to data portability and deletion

### **Rate Limit Management**
- **Intelligent Caching**: Efficient API usage with sophisticated caching
- **Token Conservation**: Smart processing to stay within limits
- **Graceful Degradation**: Functionality maintained during rate limits
- **Usage Analytics**: Comprehensive token usage tracking

## 🚀 **Advanced Customization**

### **AI Prompt Engineering**
```yaml
# config/ai-prompts.yml
enhancement_prompts:
  professional_summary:
    prompt: "Enhance this professional summary for maximum impact in the AI/software engineering field"
    max_tokens: 200
    temperature: 0.3
  
  skills_optimization:
    prompt: "Analyze and improve this skills section based on current industry trends"
    max_tokens: 150
    temperature: 0.4
```

### **Activity Processing Configuration**
```yaml
# config/cv-config.yml
activity_analysis:
  commit_weight: 1.0
  pr_review_weight: 1.5
  issue_resolution_weight: 1.2
  documentation_weight: 0.8
  
language_proficiency:
  calculation_method: "commit_frequency_weighted"
  minimum_commits: 10
  recency_factor: 0.7
```

## 📈 **Performance Optimization**

### **Build Process**
- **Asset Optimization**: Minified CSS/JS with critical path optimization
- **Image Processing**: Automatic WebP conversion with fallbacks
- **Caching Strategy**: Aggressive caching for static assets
- **CDN Integration**: GitHub Pages optimization

### **Runtime Performance**
- **Lazy Loading**: Progressive content loading for faster initial render
- **Service Worker**: Offline functionality and caching
- **Core Web Vitals**: Optimized for Google's performance metrics
- **Accessibility**: Screen reader optimization and keyboard navigation

## 🤝 **Contributing & Support**

### **Development Setup**
```bash
# Local development
npm install
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### **Workflow Testing**
```bash
# Test AI enhancement locally
node .github/scripts/claude-enhancer.js

# Test activity analysis
node .github/scripts/activity-analyzer.js

# Validate CV generation
node .github/scripts/cv-generator.js
```

## 📄 **License & Usage**

**MIT License** - Feel free to adapt this system for your own professional CV needs.

### **Attribution**
When using this system, please maintain attribution to:
- Original architecture by Adrian Wedd
- Claude AI integration methodology
- GitHub Actions workflow patterns

## 📚 **Documentation & Research**

For detailed information on the system's architecture, workflows, and underlying research, please refer to our comprehensive documentation:

- [**Full Documentation Site**](docs/index.md)
- [**Prompt Engineering Strategy**](docs/prompt_construction.md) (Practical Guide)
- [**Advanced Prompt & Pipeline Engineering Framework**](docs/research/claude-prompt-engineering-framework.md) (Research Paper)