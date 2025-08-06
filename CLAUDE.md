# CLAUDE.md

Essential guidance for Claude Code when working with this AI-Enhanced CV System.

## Project Overview

AI-Enhanced CV System that automatically generates and maintains a professional CV website using GitHub activity analysis and Claude AI content optimization. Runs on GitHub Actions with scheduled workflows.

### 🚀 Quick Start for New Claude Sessions

**Bootstrap Checklist (5 minutes)**:
1. **Context**: Read this CLAUDE.md + check `NEXT_SESSION_PLAN.md` for priorities
2. **Health Check**: Run `cd .github/scripts && npm test` to verify system status
3. **Planning**: Use TodoWrite tool immediately to track session progress
4. **Git Status**: Check current branch and uncommitted changes

**System Status Quick Reference**:
- **Current Reliability**: 6/6 systems operational (OAuth, Content Guardian, CV Generator, Analytics, Historical Verification, Elite Agents)
- **Authentication**: OAuth-first → API key fallback → activity-only mode
- **Branch Strategy**: Work in feature branches, PR to main for production changes
- **Test Requirements**: Must pass `npm run lint` and `npm test` before completion

### 🎯 **ACTION-FIRST DEVELOPMENT PHILOSOPHY**

**CRITICAL**: This project prioritizes immediate action over planning summaries.

**✅ DO THIS**:
- Read `NEXT_SESSION_PLAN.md` and immediately start executing objectives
- Use TodoWrite tool to track progress, then begin implementation
- Take action first, document briefly afterward
- Provide concise status updates (1-2 lines max)

**❌ NOT THIS**:
- Long planning summaries before taking action
- Verbose explanations of what you're going to do
- Detailed session analysis without deliverables
- Hypothetical discussions instead of concrete implementation

### ⚡ **Elite Agent Roster**

Specialized agents following Anthropic's 2025 Claude Code guidelines. **Full details**: See `agents/` directory for complete specifications.

**Available Agents**:
- **🛡️ Fortress Guardian** (`security-auditor`) - Security & compliance
- **⚡ Performance Virtuoso** (`performance-engineer`) - Optimization & scaling
- **🌐 Integration Maestro** (`api-integration-specialist`) - API integration
- **🧪 Testing Alchemist** (`testing-strategist`) - Quality assurance
- **👑 Code Sovereign** (`code-reviewer`) - Code quality & architecture
- **📜 Knowledge Curator** (`documentation-curator`) - Documentation
- **🚀 Deployment Commander** (`deployment-engineer`) - Production ops
- **🎯 Repository Surgeon** (`repository-specialist`) - Project health
- **🏗️ Data Architect** (`data-architect`) - Data modeling

### 🎭 **Agent Selection Guide**

| Task Type | Primary Agent | Context |
| **Security Issue** | 🛡️ Fortress Guardian | Auth, data protection |
| **Performance Problem** | ⚡ Performance Virtuoso | Optimization, scaling |
| **API Integration** | 🌐 Integration Maestro | External services |
| **Testing Challenge** | 🧪 Testing Alchemist | Quality assurance |
| **Code Quality** | 👑 Code Sovereign | Architecture, patterns |
| **Documentation** | 📜 Knowledge Curator | Knowledge management |
| **Production Issues** | 🚀 Deployment Commander | Infrastructure |
| **Project Health** | 🎯 Repository Surgeon | Maintenance |
| **Data Problems** | 🏗️ Data Architect | Schema, validation |

## Architecture

### Core Components
- **Frontend**: Static HTML/CSS/JS website (`index.html`, `assets/`)
- **Data Layer**: JSON-based CV data (`data/base-cv.json`)
- **Automation**: GitHub Actions workflows (`.github/workflows/`)
- **Processing**: Node.js scripts (`.github/scripts/`)

### Key Files
- `data/base-cv.json` - Core CV data
- `index.html` - Main CV webpage
- `assets/styles.css` - Responsive CSS
- `assets/script.js` - Interactive features
- `.github/workflows/cv-enhancement.yml` - Main automation (6h schedule)

## Essential Commands

```bash
# Quick setup
cd .github/scripts && npm install

# Core operations
npm test                     # Run all tests
npm run lint                 # ESLint validation
node activity-analyzer.js    # Analyze GitHub activity
node cv-generator.js         # Generate CV website

# Local development
python -m http.server 8000   # Serve locally
```

## Workflow & Configuration

### CV Enhancement Pipeline
**Trigger**: Every 6 hours  
**Steps**: Intelligence Analysis → Activity Collection → AI Enhancement → Metrics → Website Generation → Deployment

### Key Environment Variables
- `CLAUDE_SESSION_KEY`, `CLAUDE_ORG_ID`, `CLAUDE_USER_ID` - Browser auth (FREE)
- `CLAUDE_OAUTH_TOKEN` - OAuth auth (subscription)
- `ANTHROPIC_API_KEY` - API fallback (pay-per-token)
- `GITHUB_TOKEN` - GitHub API access
- `AUTH_STRATEGY` - Set to `browser_first` for free usage

## Data Structure

**base-cv.json Schema**: metadata, personal_info, professional_summary, experience, projects, skills, achievements, education

## AI Authentication Priority

1. **Browser Auth (FREE)** - Uses existing Claude.ai subscription via cookies
2. **OAuth ($100-200/month)** - Claude Max subscription with 50-800 prompts/5h
3. **API Key** - Pay-per-token fallback

**Quick Browser Setup**:
1. Extract cookies from logged-in Claude.ai session
2. Run `node setup-claude-cookies.js` to save to GitHub secrets
3. Set `AUTH_STRATEGY=browser_first`

**Enhancement Modes**: Comprehensive, Activity-only, AI-only, Emergency

## Frontend Features

- Responsive CSS Grid/Flexbox layouts
- Progressive enhancement (no-JS support)
- Dark/light theme switching with localStorage
- Structured data for SEO
- Performance optimized (lazy loading, minimal JS)

## Development Guidelines

### Common Tasks
- **Update CV**: Edit `data/base-cv.json`
- **Styling**: Use CSS custom properties in `assets/styles.css`
- **Functionality**: ES6+ JavaScript in `assets/script.js`
- **Workflows**: Test changes carefully (run on schedule)

### Key Constraints
- Respect token budgets (browser mode: unlimited)
- GitHub API rate limits - use caching
- Workflows auto-commit - avoid conflicts
- Browser auth requires valid Claude.ai cookies

## Documentation

Detailed guides available in `docs/`:
- `AUTHENTICATION_SETUP.md` - Complete auth setup (browser, OAuth, API)
- `DEVELOPMENT_GUIDE.md` - Commands, debugging, best practices
- `SYSTEM_INSIGHTS.md` - Critical learnings and patterns

This system maintains a living CV that evolves through intelligent automation while preserving developer control.

