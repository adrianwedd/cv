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
**Implementation**: Chrome browser automation with session cookies
**Files**: `claude-browser-client.js`, `claude-browser-auth-manager.js`

**How it works:**
- Uses Puppeteer to automate Chrome browser
- Uses Claude.ai web interface directly
- Requires valid Claude.ai session cookies
- No token counting or API charges

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

**Note**: Currently blocked by Cloudflare protection. Browser automation is more reliable.

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
- Budget tracking with daily limits
- Session limits to prevent overuse
- Caching to optimize API calls
- Browser mode has no token limits

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
- All usage levels: $0 (uses existing Claude.ai subscription)
- Limitation: Must maintain valid session cookies

This system maintains a CV that evolves with professional development through automation while preserving developer control over content and presentation.

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
1. Verify file existence before referencing in workflows
2. Use logging in critical workflow steps
3. Test CSS changes across browsers and themes
4. Validate JSON structure after AI enhancement
5. Monitor workflow failures for race conditions and timeouts

## Key System Components

### Content Guardian System
- **Files**: `.github/scripts/content-guardian.js`, `data/protected-content.json`
- **Purpose**: Protection against AI-generated fabricated content
- **Usage**: `node content-guardian.js --validate` to check content integrity

### Position Description Ingester
- **File**: `.github/scripts/position-description-ingester.js`
- **Purpose**: Analyze job descriptions for CV customization
- **Usage**: `node position-description-ingester.js --text "job description"`
- **Output**: Targeting insights saved to `data/targeting/`

## System Architecture

### Authentication Priority Chain
1. Browser-based authentication (FREE) - Primary method
2. Claude Max OAuth - Subscription-based option
3. API Key - Pay-per-token fallback
4. Activity-only mode - Final fallback (GitHub data only)

### Error Recovery System
- Multi-tier fallback with automatic retry strategies
- Custom error classes: `QuotaExhaustedError`, `RateLimitExceededError`, `AuthenticationError`
- Graceful degradation ensuring some output is always produced
- Complete audit trails for all errors and recovery attempts

### Implementation Patterns
- **Modular Architecture**: Separate concerns for authentication, monitoring, and visualization
- **Configuration Management**: Environment variables and JSON config files
- **Comprehensive Testing**: Test suites covering error scenarios and recovery flows
- **Cost Optimization**: Real-time tracking with budget alerts and optimization recommendations

