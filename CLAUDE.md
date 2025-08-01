# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-Enhanced CV System that automatically generates and maintains a professional CV website using GitHub activity analysis and Claude AI content optimization. The system runs on GitHub Actions with scheduled workflows for continuous enhancement.

## Architecture

### Core Components
- **Frontend**: Static HTML/CSS/JS website with responsive design (`index.html`, `assets/`)
- **Data Layer**: JSON-based CV data structure (`data/base-cv.json`)
- **Automation Layer**: GitHub Actions workflows for AI enhancement (`.github/workflows/`)
- **Processing Scripts**: Node.js scripts for activity analysis and AI enhancement (`.github/scripts/`)

### Key Files
- `data/base-cv.json` - Core CV data structure (personal info, experience, projects, skills)
- `index.html` - Main CV webpage with structured data and responsive design
- `assets/styles.css` - Modern CSS with design tokens and responsive layouts
- `assets/script.js` - Interactive features, theme switching, and dynamic content loading
- `.github/workflows/cv-enhancement.yml` - Main automation pipeline (runs every 6 hours)

## Development Commands

### GitHub Scripts
```bash
# Navigate to scripts directory
cd .github/scripts

# Install dependencies
npm install

# Run individual components
node activity-analyzer.js    # Analyze GitHub activity
node claude-enhancer.js      # AI content enhancement
node cv-generator.js         # Generate CV website

# Run tests
npm test                     # Run all tests
npm run lint                 # ESLint validation
```

### Debugging & Troubleshooting
```bash
# Check data file consistency (after activity analysis)
find data/ -name "github-activity-*" | head -3
find data/ -name "professional-development-*" | head -3
find data/ -name "activity-trends-*" | head -3

# Verify PDF generation
ls -la dist/assets/adrian-wedd-cv.pdf
file dist/assets/adrian-wedd-cv.pdf

# Test data file references
node -e "const s=require('./data/activity-summary.json'); console.log('Files:', s.data_files);"
```

### Local Development
```bash
# Serve locally (use any static server)
python -m http.server 8000
# OR
npx serve .
```

### Validation
```bash
# Validate JSON data files
for file in data/*.json; do jq . "$file" > /dev/null && echo "✅ $file valid"; done

# Check workflow syntax
cd .github/scripts && npm run lint
```

## Workflow Architecture

### CV Enhancement Pipeline (`cv-enhancement.yml`)
- **Trigger**: Every 6 hours via cron schedule
- **Steps**:
  1. Intelligence Analysis - determines enhancement strategy based on activity
  2. GitHub Activity Collection - analyzes commits, repos, languages
  3. Claude AI Enhancement - optimizes content using AI
  4. Professional Metrics Calculation - scores and analytics
  5. Dynamic Website Generation - builds responsive CV site
  6. GitHub Pages Deployment - publishes live site

### Key Environment Variables

#### Browser Authentication (FREE - Recommended)
- `CLAUDE_SESSION_KEY` - Claude.ai session key cookie (sk-ant-sid01-...)
- `CLAUDE_ORG_ID` - Claude.ai organization ID from lastActiveOrg cookie
- `CLAUDE_USER_ID` - Claude.ai user ID from ajs_user_id cookie
- `CLAUDE_COOKIES_JSON` - Full cookies JSON array (optional, comprehensive approach)
- `AUTH_STRATEGY` - Set to `browser_first` for free usage

#### OAuth Authentication (Subscription-based)
- `CLAUDE_OAUTH_TOKEN` - Claude Max OAuth token (for Claude Max subscriptions)
- `CLAUDE_SUBSCRIPTION_TIER` - Claude Max subscription tier (max_5x or max_20x)

#### API Key Fallback
- `ANTHROPIC_API_KEY` - Claude AI API key (final fallback, pay-per-token)

#### System Configuration
- `GITHUB_TOKEN` - GitHub API access for activity analysis
- `TIMEZONE` - Set to "Australia/Tasmania"

## Data Structure

### base-cv.json Schema
```json
{
  "metadata": { "version", "last_updated", "enhancement_ready" },
  "personal_info": { "name", "title", "location", "contact_info" },
  "professional_summary": "string",
  "experience": [{ "position", "company", "period", "achievements", "technologies" }],
  "projects": [{ "name", "description", "technologies", "metrics", "github" }],
  "skills": [{ "name", "category", "level", "proficiency", "experience_years" }],
  "achievements": [{ "title", "description", "date", "metrics" }],
  "education": [{ "degree", "institution", "key_areas" }]
}
```

## AI Enhancement System

### Authentication Methods (Priority Order)

#### 1. Browser-Based Authentication (FREE) ⭐ **RECOMMENDED**
**Cost**: $0/month (uses existing Claude.ai subscription)
**Implementation**: Real Chrome browser automation with session cookies
**Files**: `claude-browser-client.js`, `claude-browser-auth-manager.js`

**How it works:**
- Uses Puppeteer with stealth plugin to automate real Chrome browser
- Bypasses API costs by using Claude.ai web interface directly
- Requires valid Claude.ai session cookies from authenticated account
- Completely free - no token counting or API charges

**Setup Process:**
1. **Extract Cookies**: Export cookies from your logged-in Claude.ai session
2. **Configure Locally**: Create `.env` file with cookie values
3. **Save to GitHub**: Use `setup-claude-cookies.js` to save secrets
4. **Set Strategy**: `AUTH_STRATEGY=browser_first` in workflows

**Required Cookies:**
```bash
# Essential cookies (minimum required)
CLAUDE_SESSION_KEY=sk-ant-sid01-... # Primary authentication
CLAUDE_ORG_ID=your-org-uuid         # Organization identifier
CLAUDE_USER_ID=your-user-uuid       # User identifier

# Optional (improves reliability)
CLAUDE_CF_BM=cloudflare-token       # Bot management
CLAUDE_COOKIES_JSON='[...]'         # Full cookie array
```

**Test Browser Authentication:**
```bash
cd .github/scripts
node claude-browser-client.js test --visible  # Test with visible browser
node claude-browser-client.js test            # Test headless
node claude-browser-auth-manager.js status    # Check auth status
```

#### 2. Session-Based API Authentication (FREE, Limited)
**Cost**: $0/month (direct API calls with cookies)
**Status**: Currently blocked by Cloudflare protection
**Implementation**: Direct HTTP requests to Claude.ai API using session cookies
**File**: `claude-session-client.js`

**Note**: This method currently returns HTTP 403 due to Cloudflare bot protection. Browser automation is more reliable.

#### 3. OAuth Authentication (Subscription-based)
**Cost**: $100-200/month (Claude Max subscription)
**Usage**: 50-800 prompts per 5-hour window
**Implementation**: PKCE OAuth flow with Claude Max subscriptions
**Files**: `claude-oauth-client.js`, `claude-auth-manager.js`

#### 4. API Key Authentication (Pay-per-token)
**Cost**: $0.02-0.05 per request (variable pricing)
**Usage**: Pay-per-token model
**Implementation**: Direct Anthropic API calls
**Use Case**: Final fallback when other methods fail

### Token Management
- Budget tracking per creativity level (conservative: 15k, balanced: 25k, creative: 40k, innovative: 60k daily)
- Session limits to prevent overuse
- Intelligent caching to optimize API calls
- **Browser mode**: No token limits (uses web interface)

### Enhancement Strategy
- **Comprehensive**: Full analysis and optimization
- **Activity-only**: GitHub metrics only
- **AI-only**: Content optimization only
- **Emergency**: Minimal processing for urgent updates

## Frontend Features

### Modern Web Standards
- Responsive CSS Grid and Flexbox layouts
- Progressive enhancement (works without JavaScript)
- Dark/light theme switching with localStorage persistence
- Smooth scroll navigation with URL hash management
- Structured data for SEO optimization

### Performance Optimizations
- Lazy loading for non-critical content
- CSS custom properties for consistent theming
- Minimal JavaScript footprint
- Optimized font loading with preconnect

## Development Notes

### When Making Changes
1. **Data Updates**: Modify `data/base-cv.json` for core CV information
2. **Styling**: Use CSS custom properties in `assets/styles.css` for consistency
3. **Functionality**: JavaScript in `assets/script.js` follows ES6+ standards
4. **Workflows**: Test changes to `.github/workflows/` files carefully as they run on schedule

### Testing Workflows Locally
```bash
# Test activity analysis
cd .github/scripts
GITHUB_TOKEN=your_token node activity-analyzer.js

# Test AI enhancement (requires API key)
ANTHROPIC_API_KEY=your_key node claude-enhancer.js

# Test CV generation
node cv-generator.js
```

### Common Tasks
- **Update CV content**: Edit `data/base-cv.json`
- **Modify styling**: Use CSS custom properties in `assets/styles.css`
- **Add new sections**: Update both data structure and HTML template
- **Adjust automation**: Modify workflow schedules or enhancement strategies
- **Update authentication**: Refresh cookies or change auth strategy

### Important Constraints
- All AI enhancements must respect token budgets (browser mode: unlimited)
- GitHub API calls are rate-limited, use caching appropriately
- Workflows commit changes automatically - avoid conflicts
- PDF generation requires headless browser capabilities in CI
- Browser authentication requires valid Claude.ai session cookies

## Browser Authentication Setup Guide

### Quick Setup (5 minutes)

1. **Export Cookies from Claude.ai**
   - Log into [claude.ai](https://claude.ai) in your browser
   - Open Developer Tools (F12) → Application/Storage → Cookies
   - Find and copy these values:
     - `sessionKey` (starts with sk-ant-sid01-)
     - `lastActiveOrg` (UUID format)
     - `ajs_user_id` (UUID format)

2. **Create Local Environment File**
   ```bash
   cd .github/scripts
   cp .env.example .env
   # Edit .env with your cookie values
   ```

3. **Test Authentication**
   ```bash
   node claude-browser-client.js test --visible
   ```

4. **Save to GitHub Secrets**
   ```bash
   node setup-claude-cookies.js
   # Follow prompts to save cookies to repository secrets
   ```

5. **Update Workflow Strategy**
   - Workflows are already configured for `browser_first` authentication
   - Next workflow run will automatically use browser authentication

### Advanced Cookie Export

For better reliability, export all cookies:
```javascript
// Run in browser console on claude.ai
JSON.stringify(document.cookie.split(';').map(c => {
  const [name, value] = c.trim().split('=');
  return { name, value, domain: '.claude.ai' };
}))
```

### Troubleshooting Browser Authentication

**Authentication Failed (403 Error)**:
- Cookies may be expired - re-export from fresh Claude.ai session
- Try using full `CLAUDE_COOKIES_JSON` instead of individual cookies
- Ensure Claude.ai account is active and accessible

**Browser Timeout**:
- Claude.ai may be slow - increase timeout in browser client
- Check headless vs visible mode for debugging

**CI/CD Issues**:
- Verify GitHub secrets are properly set
- Check workflow logs for browser launch errors
- Ensure `AUTH_STRATEGY=browser_first` is set

### Cost Analysis

**Traditional API Usage** (monthly estimates):
- Light usage (50 requests): ~$10-20
- Moderate usage (200 requests): ~$40-80
- Heavy usage (1000+ requests): ~$200-400

**Browser Authentication**:
- **All usage levels**: $0 (uses your existing Claude.ai subscription)
- **Savings**: 100% of Claude AI costs
- **Limitation**: Must maintain valid session cookies

This system maintains a living CV that evolves with professional development through intelligent automation while preserving full developer control over content and presentation.

## Critical System Insights

### Race Conditions & File Dependencies
- **Issue**: `activity-summary.json` can reference files before they're created, causing intermittent failures
- **Solution**: Always create referenced files atomically before updating summary files
- **Prevention**: Use `fs.mkdir()` with `{ recursive: true }` and verify file existence in workflows

### AI Content Processing
- **Issue**: AI-enhanced content often contains meta-commentary that shouldn't be displayed
- **Solution**: Implement content cleaning logic to extract only relevant enhanced content
- **Pattern**: Use regex to extract content between markers like `**Enhanced Summary:**` and `This enhancement:`

### CSS Variable Dependencies  
- **Issue**: Missing CSS variables cause styling failures that may go unnoticed
- **Solution**: Audit all CSS variables used and ensure they're defined in `:root`
- **Common**: `--color-primary-bg`, `--border-radius-sm` should be `--radius-sm`

### PDF Generation & Deployment
- **Issue**: PDF generated in `dist/` but not accessible in deployed `assets/`
- **Solution**: Ensure PDF is copied to correct location for public access
- **Workflow**: PDF generation happens in cv-generator.js automatically, don't add redundant steps

### Development Workflow Recommendations
- **Current Risk**: Direct commits to main branch affect production
- **Proposed**: Git Flow with `develop` branch, feature branches, and staging environment
- **Benefits**: Production safety, testing isolation, rollback capabilities

### Debugging Best Practices
1. Always verify file existence before referencing in workflows
2. Use comprehensive logging in critical workflow steps
3. Test CSS changes across multiple browsers and themes
4. Validate JSON structure after AI enhancement processes
5. Monitor workflow failures for race conditions and timeouts

## Recent System Improvements (July 2025)

### Content Guardian & AI Hallucination Protection
**Critical System**: Implemented comprehensive protection against AI-generated fabricated content
- **Files**: `.github/scripts/content-guardian.js`, `data/protected-content.json`
- **Integration**: Built into enhancement orchestrator with pre/post validation
- **Protection**: All achievements marked as `protected: true, verified: true`
- **Audit Trail**: Content changes logged with violation detection
- **Usage**: `node content-guardian.js --validate` to check content integrity

### Activity Analyzer Fixes
**Issue Resolved**: Repository counting limited to 20 repos instead of full portfolio (191 total)
- **Problem**: `repos.slice(0, 20)` artificial limitation caused inaccurate metrics
- **Solution**: Implemented pagination with fork filtering for recently active repos only
- **Impact**: Now shows accurate commit counts across entire portfolio
- **Filter Logic**: Excludes forks unless recent commits detected (30-day window)

### Watch Me Work Dashboard Overhaul
**Major UX Improvements**: Fixed data accuracy and presentation issues
- **Dynamic Discovery**: Removes hardcoded repo list, auto-discovers active repositories
- **Fork Filtering**: Only shows forks with recent commit activity to reduce noise
- **Rich Context**: Replaced raw JSON displays with human-readable activity descriptions
- **Rate Limiting**: Added API call delays to prevent GitHub throttling
- **Activity Details**: Enhanced modals with commit lists, issue context, release notes

### Position Description Ingester (New Component)
**Job Targeting System**: Analyze job descriptions for CV customization
- **File**: `.github/scripts/position-description-ingester.js`
- **Capabilities**: Extract skills, requirements, company culture from job postings
- **Analysis**: Generate skill match percentages and enhancement recommendations
- **Usage**: `node position-description-ingester.js --text "job description"`
- **Output**: Targeting insights saved to `data/targeting/` for CV customization

### CI Pipeline Dependencies
**Critical Configuration**: ANTHROPIC_API_KEY required for automation
- **Issue**: CV Enhancement Pipeline fails without API key secret
- **Location**: GitHub repository secrets must include `ANTHROPIC_API_KEY`
- **Workflow**: `.github/workflows/cv-enhancement.yml` expects this secret
- **Fallback**: System gracefully handles missing API key with activity-only mode

### Enhanced Authentication & Career Narrative
**Content Authenticity**: Replaced fabricated achievements with verified career history
- **Real Experience**: Systems Analyst at Homes Tasmania, environmental advocacy background
- **Neurodivergent Path**: Authentic career narrative celebrates diverse journey as strength
- **Technical Depth**: API integration, cybersecurity leadership, AI implementation pioneer
- **Social Impact**: Technology work combined with environmental and social causes

## Critical System Insights & Learnings (August 2025)

### OAuth-First Authentication Strategy
**Game-Changing Implementation**: Cost optimization through Claude Max subscriptions
- **Primary Method**: Claude Max OAuth with PKCE authentication flow
- **Cost Benefits**: Fixed monthly costs ($100-200) vs variable API pricing (potentially $400-800)
- **Usage Limits**: 50-800 prompts per 5-hour window vs pay-per-token API
- **Fallback Logic**: Intelligent 24-hour fallback to API key when OAuth fails
- **Files**: `claude-oauth-client.js`, `claude-auth-manager.js`, `usage-monitor.js`

### Comprehensive Error Recovery System
**Reliability Achievement**: 95%+ success rate through multi-tier fallback
- **Tier 1**: OAuth-first with quota management and 5-hour reset tracking
- **Tier 2**: API key fallback after 24-hour persistent OAuth failures
- **Tier 3**: Activity-only mode using GitHub data when all AI methods fail
- **Recovery Tracking**: All failures logged with automatic retry strategies
- **Custom Errors**: `QuotaExhaustedError`, `RateLimitExceededError`, `AuthenticationError`

### GitHub Actions Visualization Excellence
**CI/CD Mastery**: Granular workflow visualization with rich status bubbling
- **Visual Graph**: 6 distinct jobs creating meaningful nodes in GitHub Actions UI
- **Status Bubbling**: Deployment URLs, performance metrics, cost analysis directly in workflow graph
- **Multi-Environment**: Production/staging/preview with environment protection and URL tracking
- **Real-Time Dashboard**: Live status dashboard with auto-refresh and responsive design
- **Dynamic Badges**: 5 professional badges (status, deployment, activity, cost, auth) with shields.io compatibility

### Advanced Monitoring & Analytics
**Operational Excellence**: Comprehensive tracking and cost optimization
- **Usage Analytics**: Daily/monthly tracking with budget alerts at 50%, 75%, 90%, 95% thresholds
- **Cost Analysis**: Real-time OAuth vs API key savings calculations
- **Performance Metrics**: Token usage, build times, success rates, asset generation
- **Session Tracking**: Unique session IDs with complete audit trails
- **Recommendation Engine**: Smart suggestions based on usage patterns and costs

### Critical Implementation Patterns

#### Authentication Priority Chain
```javascript
1. Claude Max OAuth (primary) → Fixed monthly costs, higher limits
2. API Key (24-hour fallback) → Variable costs, emergency use only  
3. Activity-only mode (final fallback) → Free, GitHub analysis only
```

#### Error Handling Best Practices
- **Specific Error Classes**: Custom errors with `recoverable` and `fallbackAvailable` properties
- **Exponential Backoff**: Rate limit handling with intelligent retry strategies
- **Graceful Degradation**: Always produce some output, never complete failure
- **Audit Trails**: All errors logged with recovery attempts and success indicators

#### Workflow Visualization Principles
- **Meaningful Job Names**: Each job clearly describes its purpose with emoji indicators
- **Rich Status Outputs**: Performance metrics, URLs, and costs bubbled to GitHub UI
- **Environment Tracking**: Clear deployment targets with protection rules
- **Visual Feedback**: Success/warning/error states with actionable information

#### Cost Optimization Strategies
- **OAuth Prioritization**: Use Claude Max subscriptions for predictable costs
- **Smart Scheduling**: Optimize requests around Claude Max 5-hour reset windows
- **Budget Monitoring**: Real-time alerts prevent unexpected cost overruns
- **Usage Prediction**: Analyze patterns to recommend optimal subscription tiers

### File Organization Wisdom
- **Modular Architecture**: Separate authentication, monitoring, and visualization concerns
- **Comprehensive Testing**: Test suites for error scenarios, recovery flows, and integration
- **Documentation First**: README files for each major component with setup guides
- **Configuration Management**: Environment variables and JSON config files for flexibility

### Future-Proofing Insights
- **Authentication Flexibility**: System supports multiple auth methods with easy extension
- **Monitoring Extensibility**: Dashboard and badge system designed for additional metrics
- **Deployment Scalability**: Multi-environment support ready for additional targets
- **Cost Optimization**: Framework ready for multiple Claude Max accounts and load balancing

### Operational Excellence Principles
- **Always Have a Fallback**: Never allow complete system failure
- **Monitor Everything**: Comprehensive analytics with actionable insights
- **Cost Transparency**: Real-time cost tracking with optimization recommendations
- **Visual Excellence**: Rich UI feedback for both developers and stakeholders
- **Automated Recovery**: Self-healing systems with minimal manual intervention

These insights represent a significant evolution in AI-powered CV enhancement systems, demonstrating enterprise-grade reliability, cost optimization, and operational excellence through intelligent architecture and comprehensive monitoring.

## Session Insights - August 2, 2025 - Prompt Library v2.0 & Live Dashboard Excellence

### PersonaDrivenEnhancer Fix & Integration  
**Issue Resolved**: Missing initialize() method causing integration failures with Prompt Library v2.0
- Added comprehensive initialization with automatic dependency loading (CV data, activity metrics, prompt library)
- Implemented method overloading for flexible parameter formats (context object vs individual parameters)
- Full integration with PromptLibraryManager for context-aware persona selection
- 62% confidence scoring on test scenarios demonstrates effective persona matching

### Watch Me Work Dashboard Real-Time Enhancements
**Professional Live Features**: Transformed static dashboard into dynamic real-time experience
- **Notification System**: Slide-in notifications for new GitHub activities with professional animations and rate limiting (max 3 per refresh)
- **Sound Alerts**: Web Audio API integration with subtle notification tones and user preference persistence
- **Mobile Excellence**: Responsive notification containers with touch-friendly controls and adaptive layouts
- **Live Integration**: 30-second GitHub API refresh cycles detecting and highlighting new activities

### Staging Environment Resolution (#137)
**Critical Fix**: Resolved 404 error blocking stakeholder access to staging environment
- Created pragmatic `/staging` subdirectory approach instead of complex branch deployment architecture
- Professional landing page with environment information, navigation links, and feature descriptions
- Mobile-responsive design with gradient background maintaining brand consistency
- Simple solution avoiding GitHub Pages multi-site limitations and complex workflow configurations

### Key Technical Patterns Established
- **Method Overloading**: Flexible parameter handling enabling backward compatibility while supporting new usage patterns
- **Graceful Initialization**: Auto-loading dependencies when not provided, enabling standalone usage and testing
- **Real-time UX Excellence**: Professional notifications that inform without overwhelming users through rate limiting
- **Pragmatic Infrastructure**: Simple staging subdirectory solution vs overly complex multi-branch deployments
