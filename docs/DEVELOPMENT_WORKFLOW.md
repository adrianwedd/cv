# Enterprise Development Workflow

## 🎯 Overview
This document outlines the enterprise-grade Git workflow for the AI-Enhanced CV System, ensuring production safety, quality assurance, and team collaboration.

## 🌊 Git Flow Architecture

### Branch Structure
```
main (protected)           ← Production deployments only
  ↑ PR required
develop (protected)        ← Integration & staging deployments  
  ↑ PR required
feature/issue-123         ← Individual development work
hotfix/critical-fix       ← Emergency production fixes
release/v2.1.0            ← Release preparation
```

### Branch Protection Rules
- **main**: Requires PR review + all CI checks pass + admin enforcement
- **develop**: Requires PR review + all CI checks pass
- **Direct commits blocked**: All changes must go through pull requests

## 🚀 Development Process

### 1. Starting New Work
```bash
# Update local repository
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/issue-123-add-accessibility-tests

# Work on changes...
git add .
git commit -m "feat: implement WCAG 2.1 AA accessibility tests

- Add comprehensive accessibility test suite
- Include heading hierarchy validation
- Implement ARIA compliance checks
- Add mobile touch target validation

Closes #123"
```

### 2. Pull Request Creation
```bash
# Push feature branch
git push origin feature/issue-123-add-accessibility-tests

# Create PR via GitHub CLI
gh pr create \
  --title "feat: Add Enterprise Accessibility Test Suite (Issue #123)" \
  --body-file .github/pull_request_template.md \
  --base develop \
  --head feature/issue-123-add-accessibility-tests
```

### 3. PR Review Process
1. **Automated Validation** - All CI checks must pass
2. **Code Review** - At least 1 approving review required
3. **Testing Validation** - All 6 enterprise test suites must pass
4. **Security Scan** - CodeQL and dependency checks must pass
5. **Manual Verification** - QA testing if applicable

### 4. Merge & Deployment
```bash
# After approval, merge to develop
# (Done via GitHub UI with squash merge)

# For production deployment (develop → main)
gh pr create \
  --title "release: Deploy v2.1.0 to Production" \
  --base main \
  --head develop \
  --body "Production deployment with enterprise testing validation"
```

## 🧪 CI/CD Pipeline Integration

### Pull Request Validation
Every PR triggers comprehensive validation:
- **Security Scanning**: CodeQL analysis + dependency audit
- **Enterprise Testing**: All 6 test suites (Unit, Performance, Mobile, Dashboard, Accessibility, Cross-Browser)
- **End-to-End Validation**: Complete CV generation test
- **Performance Audit**: Lighthouse performance analysis

### Branch-Specific Workflows
- **develop**: Deploys to staging environment for integration testing
- **main**: Deploys to production with additional approval gates
- **feature/***: Runs validation tests only

## 📋 Commit Standards

### Commit Message Format
```
type(scope): brief description

Detailed explanation of changes made and why.
Include any breaking changes or important notes.

Closes #123
Co-authored-by: Claude <noreply@anthropic.com>
```

### Commit Types
- `feat`: New features or enhancements
- `fix`: Bug fixes
- `docs`: Documentation updates
- `test`: Test additions or modifications
- `refactor`: Code refactoring without functional changes
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes
- `build`: Build system or dependency changes

## 🔒 Security & Compliance

### Required Checks
All PRs must pass:
- ✅ CodeQL security analysis
- ✅ Dependency vulnerability scan
- ✅ Secret detection scan
- ✅ All 6 enterprise test suites
- ✅ Performance benchmarks
- ✅ Code review approval

### Branch Protection Enforcement
- **No direct commits** to protected branches
- **All checks required** before merge
- **Admin enforcement** - even administrators must follow process
- **Stale review dismissal** on new commits

## 🎯 Testing Requirements

### Enterprise Test Suite (6/6 Required)
1. **Unit Tests**: Core functionality validation
2. **Performance Tests**: Core Web Vitals compliance
3. **Mobile Tests**: Responsive design and touch interactions
4. **Dashboard Tests**: Interactive components and data visualization  
5. **Accessibility Tests**: WCAG 2.1 AA compliance
6. **Cross-Browser Tests**: Chromium, Firefox, WebKit compatibility

### Test Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:accessibility    # WCAG 2.1 AA compliance
npm run test:cross-browser    # Multi-browser validation
npm run test:integration      # Full integration testing

# Generate CV (end-to-end test)
npm run generate
```

## 🚨 Emergency Procedures

### Hotfix Process
For critical production issues:
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make minimal fix
git commit -m "fix: resolve critical security vulnerability

- Patch XSS vulnerability in contact form
- Update input sanitization
- Add security test coverage

CRITICAL: Deploy immediately after review"

# Create emergency PR
gh pr create --title "HOTFIX: Critical Security Fix" --base main
```

### Rollback Procedure
If production deployment fails:
1. **Immediate**: Revert via GitHub UI
2. **Investigation**: Analyze logs and test results
3. **Fix Forward**: Create hotfix PR with solution
4. **Post-Mortem**: Document incident and improve process

## 📊 Quality Metrics

### Success Criteria
- **Test Coverage**: >95% for all enterprise test suites
- **Performance**: <2 second load time on 3G
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Security**: Zero high/critical vulnerabilities
- **Cross-Browser**: 100% compatibility with latest 2 versions

### Monitoring
- **CI/CD Success Rate**: Target >98%
- **Deployment Frequency**: Track deployment velocity
- **Lead Time**: Measure feature delivery time
- **Recovery Time**: Monitor incident resolution speed

## 🔄 Workflow Automation

### GitHub Actions Integration
- **Automatic Testing**: All PRs trigger full test suite
- **Security Scanning**: Weekly and on-demand scans
- **Dependency Updates**: Automated Dependabot PRs
- **Performance Monitoring**: Continuous Lighthouse audits

### Quality Gates
- **Pre-merge**: All tests pass + security clean + performance valid
- **Post-merge**: Deployment success + monitoring alerts
- **Production**: Health checks + performance metrics + error rates

## 👥 Team Collaboration

### Code Review Guidelines
- **Review Focus**: Logic, security, performance, maintainability
- **Response Time**: Reviews within 24 hours
- **Constructive Feedback**: Specific suggestions with examples
- **Knowledge Sharing**: Explain complex decisions

### Communication
- **PR Comments**: Technical discussions and clarifications
- **Issues**: Feature requests and bug reports
- **Discussions**: Architecture and process improvements
- **Documentation**: Keep CLAUDE.md updated with changes

---

## ✅ Quick Reference

### Daily Workflow
1. `git checkout develop && git pull origin develop`
2. `git checkout -b feature/issue-X-description`
3. Make changes + comprehensive testing
4. `git commit -m "type: description"` 
5. `git push origin feature/issue-X-description`
6. Create PR with full template
7. Wait for reviews + CI validation
8. Merge via GitHub UI

### Emergency Workflow  
1. `git checkout main && git pull origin main`
2. `git checkout -b hotfix/critical-issue`
3. Make minimal fix + test
4. Create emergency PR to main
5. Get immediate review + deploy
6. Follow up with proper fix to develop

**Remember**: Quality and security are never compromised for speed. Every change must meet enterprise standards.