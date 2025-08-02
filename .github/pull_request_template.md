# Pull Request: Enterprise CV System

## 📋 Change Summary
<!-- Provide a brief description of changes in this PR -->

## 🎯 Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)  
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration/Infrastructure change
- [ ] 🧪 Test improvements
- [ ] ♻️ Code refactoring (no functional changes)

## 🧪 Testing Checklist
<!-- All items must be checked before merge -->

### Core Testing Requirements
- [ ] All existing tests pass (`npm test`)
- [ ] New code has appropriate test coverage
- [ ] Manual testing completed for changed functionality

### Enterprise Test Suites (6/6 Required)
- [ ] **Unit Tests**: Basic functionality tests pass
- [ ] **Performance Tests**: Core Web Vitals within acceptable limits  
- [ ] **Mobile Tests**: Responsive design and touch interactions validated
- [ ] **Dashboard Tests**: Interactive components and data visualization working
- [ ] **Accessibility Tests**: WCAG 2.1 AA compliance maintained (`npm run test:accessibility`)
- [ ] **Cross-Browser Tests**: Chromium/Firefox/WebKit compatibility confirmed (`npm run test:cross-browser`)

### Quality Assurance
- [ ] Code follows existing style and conventions
- [ ] No console errors or warnings in browser
- [ ] CV generation works end-to-end (`npm run generate`)
- [ ] All formats generate successfully (HTML, PDF, DOCX, LaTeX, ATS)

## 🔒 Security Checklist
- [ ] No hardcoded secrets or API keys
- [ ] Dependencies updated and vulnerability-free
- [ ] No sensitive data exposed in logs
- [ ] Authentication/authorization unchanged or properly tested

## 📱 Device/Browser Testing
- [ ] **Desktop**: Chrome, Firefox, Safari, Edge
- [ ] **Mobile**: iOS Safari, Chrome Mobile
- [ ] **Accessibility**: Screen reader compatible
- [ ] **Performance**: <2 second load time on 3G

## 🔗 Related Issues
<!-- Link to GitHub issues this PR addresses -->
Closes #
Related to #

## 🧬 Code Review Focus Areas
<!-- Help reviewers focus on specific areas -->
- [ ] Algorithm/logic changes
- [ ] UI/UX modifications  
- [ ] API integrations
- [ ] Performance optimizations
- [ ] Security considerations

## 📊 Before/After Metrics
<!-- Include relevant metrics if applicable -->

### Performance Impact
- **Load Time**: Before: X.Xs → After: X.Xs
- **Bundle Size**: Before: X KB → After: X KB
- **Test Coverage**: Before: X% → After: X%

### Screenshots (if UI changes)
<!-- Add screenshots for visual changes -->

## 🚀 Deployment Notes
- [ ] No database migrations required
- [ ] No environment variable changes
- [ ] No breaking API changes
- [ ] Safe to deploy immediately after merge

## ✅ Final Checklist
- [ ] PR title follows semantic commit format
- [ ] All tests passing in CI/CD pipeline
- [ ] Documentation updated (if applicable)
- [ ] CLAUDE.md updated with any architectural changes
- [ ] Ready for production deployment

---

**By submitting this PR, I confirm:**
- All tests have been run and pass
- Code follows project standards and conventions  
- This change is safe for production deployment
- Documentation is up to date

/cc @adrianwedd