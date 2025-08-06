# Authentication Setup Guide

Complete setup instructions for all Claude AI authentication methods.

## Authentication Methods (Priority Order)

### 1. Browser-Based Authentication (FREE) ⭐ **RECOMMENDED**
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

### 2. OAuth Authentication (Subscription-based) ✅ **PRODUCTION READY**
**Cost**: $100-200/month (Claude Max subscription)
**Usage**: 50-800 prompts per 5-hour window
**Implementation**: PKCE OAuth flow with Claude Max subscriptions - **ES modules converted**
**Files**: `claude-oauth-client.js`, `claude-auth-manager.js`

**Production Setup Commands:**
```bash
# Test OAuth authentication status
cd .github/scripts
node claude-oauth-client.js status

# Start OAuth login flow
node claude-oauth-client.js login

# Complete authentication with authorization code
node claude-oauth-client.js token <code> <state>

# Test OAuth with AI Router
node intelligent-ai-router.js test "OAuth integration test"
```

### 3. Session-Based API Authentication (FREE, Limited)
**Cost**: $0/month (direct API calls with cookies)
**Status**: Currently blocked by Cloudflare protection
**Implementation**: Direct HTTP requests to Claude.ai API using session cookies
**File**: `claude-session-client.js`

**Note**: This method currently returns HTTP 403 due to Cloudflare bot protection. Browser automation is more reliable.

### 4. API Key Authentication (Pay-per-token)
**Cost**: $0.02-0.05 per request (variable pricing)
**Usage**: Pay-per-token model
**Implementation**: Direct Anthropic API calls
**Use Case**: Final fallback when other methods fail

## Browser Authentication Quick Setup (5 minutes)

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

## Advanced Cookie Export

For better reliability, export all cookies:
```javascript
// Run in browser console on claude.ai
JSON.stringify(document.cookie.split(';').map(c => {
  const [name, value] = c.trim().split('=');
  return { name, value, domain: '.claude.ai' };
}))
```

## Troubleshooting

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

## Cost Analysis

**Traditional API Usage** (monthly estimates):
- Light usage (50 requests): ~$10-20
- Moderate usage (200 requests): ~$40-80
- Heavy usage (1000+ requests): ~$200-400

**Browser Authentication**:
- **All usage levels**: $0 (uses your existing Claude.ai subscription)
- **Savings**: 100% of Claude AI costs
- **Limitation**: Must maintain valid session cookies

## Environment Variables

### Browser Authentication (FREE - Recommended)
- `CLAUDE_SESSION_KEY` - Claude.ai session key cookie (sk-ant-sid01-...)
- `CLAUDE_ORG_ID` - Claude.ai organization ID from lastActiveOrg cookie
- `CLAUDE_USER_ID` - Claude.ai user ID from ajs_user_id cookie
- `CLAUDE_COOKIES_JSON` - Full cookies JSON array (optional, comprehensive approach)
- `AUTH_STRATEGY` - Set to `browser_first` for free usage

### OAuth Authentication (Subscription-based)
- `CLAUDE_OAUTH_TOKEN` - Claude Max OAuth token (for Claude Max subscriptions)
- `CLAUDE_SUBSCRIPTION_TIER` - Claude Max subscription tier (max_5x or max_20x)

### API Key Fallback
- `ANTHROPIC_API_KEY` - Claude AI API key (final fallback, pay-per-token)

### System Configuration
- `GITHUB_TOKEN` - GitHub API access for activity analysis
- `TIMEZONE` - Set to "Australia/Tasmania"
