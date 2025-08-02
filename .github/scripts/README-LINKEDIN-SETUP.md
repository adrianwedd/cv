# LinkedIn Integration Setup Guide

This guide provides comprehensive instructions for setting up LinkedIn integration with your CV automation system.

## 🚀 Quick Setup (5 minutes)

### Prerequisites

1. **GitHub CLI installed and authenticated**
   ```bash
   gh --version
   gh auth login
   ```

2. **Repository access**
   ```bash
   cd /path/to/your/cv-repository
   gh repo view  # Verify you're in the correct repo
   ```

### Automated Setup

Run the interactive setup script:

```bash
cd .github/scripts
node setup-linkedin-credentials.js setup
```

The script will guide you through:
- ✅ User consent verification
- 🔗 LinkedIn profile configuration
- 🍪 Session cookies setup (optional)
- 🤖 AI integration (optional)
- 🔐 Secure GitHub Secrets configuration

## 📋 Manual Setup

If you prefer manual configuration:

### 1. Required GitHub Secrets

Set these secrets via GitHub CLI or repository settings:

```bash
# Required for basic integration
gh secret set LINKEDIN_USER_CONSENT --body "true"
gh secret set LINKEDIN_PROFILE_URL --body "https://linkedin.com/in/yourname"
gh secret set LINKEDIN_PROFILE_USERNAME --body "yourname"

# Optional for enhanced functionality
gh secret set LINKEDIN_SESSION_COOKIES --body "your_li_at_cookie_value"
gh secret set GEMINI_API_KEY --body "your_gemini_api_key"
```

### 2. Extracting LinkedIn Session Cookies

For full functionality, extract your LinkedIn session cookies:

1. **Log into LinkedIn** in your browser
2. **Open Developer Tools** (F12)
3. **Navigate to Application → Cookies**
4. **Find `li_at` cookie** (value starts with `AQE...`)
5. **Copy the entire cookie value**

### 3. Gemini API Key (Optional)

For AI-powered networking analysis:

1. **Visit Google Cloud Console**: https://console.cloud.google.com/
2. **Enable Generative AI API**
3. **Create API credentials**
4. **Copy your API key**

## 🔧 Configuration Management

### Validate Current Setup

Check your current LinkedIn integration configuration:

```bash
node setup-linkedin-credentials.js validate
```

### Update Credentials

To update existing credentials:

```bash
# Update individual secrets
gh secret set LINKEDIN_SESSION_COOKIES --body "new_cookie_value"

# Or run full setup again
node setup-linkedin-credentials.js setup
```

### Remove LinkedIn Integration

To completely remove LinkedIn integration:

```bash
node setup-linkedin-credentials.js remove
```

## 🧪 Testing Your Setup

### Test LinkedIn Profile Access

```bash
cd .github/scripts
node linkedin-playwright-extractor.js test
```

### Test Full Integration

```bash
# Test LinkedIn profile synchronization (dry run)
node linkedin-profile-synchronizer.js sync https://linkedin.com/in/yourname --dry-run

# Test AI networking analysis
node ai-networking-agent.js analyze https://linkedin.com/in/yourname
```

### Manual Workflow Trigger

Test the complete workflow:

```bash
gh workflow run linkedin-integration.yml -f sync_mode=analysis-only -f dry_run=true
```

## 🔒 Security & Privacy

### Data Protection

- **Credentials stored as GitHub Secrets** - encrypted and only accessible to workflows
- **Session cookies expire** - LinkedIn sessions have built-in expiration
- **User consent required** - explicit consent verification for all operations
- **Rate limiting enforced** - respectful automation with 45-second intervals
- **Audit logging enabled** - comprehensive operation tracking

### Consent Management

Your consent controls:
- ✅ **Profile analysis** - analyze public profile information
- ✅ **Content synchronization** - sync CV data with LinkedIn
- ✅ **AI recommendations** - generate networking insights
- ❌ **Automatic posting** - no automated content creation
- ❌ **Connection requests** - no automated networking actions

### Revoking Consent

To revoke consent and disable LinkedIn integration:

```bash
gh secret set LINKEDIN_USER_CONSENT --body "false"
```

Or remove all LinkedIn secrets:

```bash
node setup-linkedin-credentials.js remove
```

## 🎯 Workflow Integration

### Automatic Triggers

LinkedIn integration runs:
- **Scheduled**: Monday, Wednesday, Friday at 9 AM UTC
- **CV Updates**: When `data/base-cv.json` is modified
- **Manual**: Via GitHub Actions workflow dispatch

### Workflow Modes

- **`bidirectional`** - Full CV ↔ LinkedIn synchronization
- **`cv-to-linkedin`** - Update LinkedIn from CV data
- **`linkedin-to-cv`** - Extract LinkedIn data to CV
- **`analysis-only`** - Professional analytics only

### Environment Variables

The following environment variables control LinkedIn integration:

```yaml
ETHICAL_FRAMEWORK: "enabled"        # Ethical automation enforcement
AUDIT_LOGGING: "comprehensive"     # Complete operation logging
RATE_LIMIT_MS: "45000"            # 45 seconds between operations
MAX_UPDATES_PER_SESSION: "5"      # Safety limit on profile changes
```

## 📊 Dashboard Integration

LinkedIn integration data appears in:

- **Main CV Dashboard** - Professional metrics and activity
- **Networking Dashboard** - LinkedIn-specific insights and recommendations
- **Status Dashboard** - Integration health and performance

## 🚨 Troubleshooting

### Common Issues

**❌ "User consent not provided"**
```bash
gh secret set LINKEDIN_USER_CONSENT --body "true"
```

**❌ "LinkedIn profile access limited"**
- Check session cookies are valid and not expired
- Verify profile URL is correct and accessible

**❌ "Authentication setup failed"**
- Ensure GitHub CLI is authenticated: `gh auth status`
- Verify repository permissions for secrets

**❌ "AI analysis failed"**
- Check Gemini API key is valid
- Verify API quotas and billing status

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Test with debug output
DEBUG=linkedin:* node linkedin-profile-synchronizer.js sync --dry-run

# Check workflow logs
gh run list --workflow=linkedin-integration.yml
gh run view --log
```

### Support

For additional support:
1. Check GitHub Actions workflow logs
2. Review audit logs in `data/linkedin-audit/`
3. Validate credentials with `setup-linkedin-credentials.js validate`
4. Test individual components separately

## 📈 Expected Results

After successful setup, you'll have:

- ✅ **Automated LinkedIn Profile Sync** - CV data stays synchronized with LinkedIn
- 🤖 **AI-Powered Networking Insights** - Intelligent recommendations and analysis
- 📊 **Professional Analytics Dashboard** - Real-time networking metrics
- 🔒 **Ethical Automation Framework** - Respectful, consent-based integration
- 📋 **Comprehensive Audit Trails** - Complete operation transparency

Your LinkedIn integration will respect all ethical guidelines while providing powerful professional development automation capabilities.

---

> 🤖 Generated with [Claude Code](https://claude.ai/code)