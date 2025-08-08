# Security Policy

## Supported Versions

Currently supporting security updates for:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously in the AI-Enhanced CV System. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT Create a Public Issue**
Security vulnerabilities should not be reported via public GitHub issues to prevent exploitation.

### 2. **Report Via Private Channel**
Please report security vulnerabilities by:
- Email: [Create a security report issue that will be private]
- Include "SECURITY" in the subject line

### 3. **Provide Details**
When reporting, please include:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes (optional)

### 4. **Response Timeline**
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Resolution Target**: Within 30 days for critical issues

## Security Best Practices

### For Contributors
1. **Never commit secrets** (API keys, tokens, passwords)
2. **Use environment variables** for sensitive configuration
3. **Validate all inputs** in scripts and workflows
4. **Review dependencies** for known vulnerabilities

### For Users
1. **Keep your fork updated** with security patches
2. **Rotate API keys regularly**
3. **Use GitHub Secrets** for workflow credentials
4. **Monitor workflow logs** for exposed data

## Security Features

### Currently Implemented
- ✅ GitHub Secrets for API credentials
- ✅ Dependabot vulnerability scanning
- ✅ No hardcoded secrets in codebase
- ✅ Input validation in enhancement scripts

### Planned Enhancements
- 🔄 GitHub code scanning integration
- 🔄 Secret scanning alerts
- 🔄 Security audit workflow
- 🔄 Dependency license checking

## Known Security Considerations

### API Key Management
- All API keys should be stored in GitHub Secrets
- Never log or output API keys in workflows
- Use minimal permission scopes

### Data Privacy
- CV data is public by design
- No personal data beyond what's intentionally shared
- GitHub activity is already public information

### Third-Party Dependencies
- Regular dependency updates via Dependabot
- NPM audit run during CI/CD pipeline
- Minimal dependency footprint

## Security Checklist for PRs

- [ ] No hardcoded credentials
- [ ] No sensitive data in logs
- [ ] Dependencies updated
- [ ] Input validation present
- [ ] Error messages don't leak sensitive info

## Contact

For security concerns, please use the private reporting methods above.
For general questions, use GitHub Discussions or Issues.

---

Thank you for helping keep the AI-Enhanced CV System secure! 🔒