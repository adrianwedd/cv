# 🧪 Enterprise Testing Framework

Comprehensive testing suite for the AI-Enhanced CV System with enterprise-grade quality assurance, accessibility compliance, and performance monitoring.

## 📋 Overview

This testing framework provides:

- **🔬 Unit Testing** with Jest and comprehensive coverage reporting
- **♿ WCAG 2.1 AA Accessibility Testing** with axe-core automation
- **⚡ Performance Testing** with Lighthouse CI and Core Web Vitals monitoring
- **📱 Mobile & Responsive Testing** across multiple device configurations
- **🌐 Cross-Browser Compatibility** testing with Playwright
- **🎨 Theme Validation** for dark/light mode functionality
- **📊 Dashboard Testing** for interactive Chart.js components
- **🚀 CI/CD Integration** with GitHub Actions pipeline

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.x (for local server)
- Chrome/Chromium (for Puppeteer tests)

### Installation

```bash
cd tests
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:accessibility
npm run test:performance
npm run test:dashboard
npm run test:mobile

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 📁 Test Structure

```
tests/
├── accessibility/          # WCAG 2.1 AA compliance tests
│   └── wcag-compliance.test.js
├── dashboard/              # Dashboard functionality tests
│   └── career-intelligence.test.js
├── mobile/                 # Mobile and responsive design tests
│   └── responsive-design.test.js
├── performance/            # Performance and Core Web Vitals tests
│   ├── core-web-vitals.test.js
│   └── lighthouse.config.js
├── theme/                  # Theme switching tests
│   └── theme-switching.test.js
├── cross-browser/          # Cross-browser compatibility tests
│   └── browser-compatibility.spec.js
├── jest.setup.js           # Jest configuration
├── jest-puppeteer.config.js # Puppeteer settings
├── playwright.config.js    # Playwright configuration
└── package.json           # Test dependencies
```

## 🧪 Test Suites

### 1. Accessibility Testing (WCAG 2.1 AA)

**File**: `accessibility/wcag-compliance.test.js`  
**Technology**: axe-core + Puppeteer  
**Coverage**: 
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation and focus management
- Screen reader compatibility with ARIA landmarks
- Heading hierarchy validation
- Form labeling and error associations
- Touch target sizes (44px minimum)
- Skip navigation links

**Key Tests**:
```javascript
// WCAG 2.1 AA compliance validation
test('should pass WCAG 2.1 AA compliance', async () => {
  const results = await new AxePuppeteer(page)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toHaveLength(0);
});
```

### 2. Performance Testing (Core Web Vitals)

**File**: `performance/core-web-vitals.test.js`  
**Technology**: Lighthouse CI + Puppeteer  
**Thresholds**:
- **Load Time**: < 2 seconds (enterprise requirement)
- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8 seconds
- **TTFB (Time to First Byte)**: < 600ms

**Configuration**: `performance/lighthouse.config.js`
```javascript
assertions: {
  'categories:performance': ['error', { minScore: 0.9 }],
  'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
  'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
}
```

### 3. Mobile & Responsive Design Testing

**File**: `mobile/responsive-design.test.js`  
**Technology**: Puppeteer with device emulation  
**Viewports Tested**:
- Mobile: 375×667px (iPhone-like)
- Small Mobile: 320×568px (iPhone SE)
- Large Mobile: 414×896px (iPhone Pro)
- Tablet: 768×1024px (iPad-like)

**Key Validations**:
- Touch target minimum size (44px)
- Responsive layout adaptation
- Text readability across screen sizes
- Touch interaction responsiveness (< 100ms)
- Menu accessibility on mobile

### 4. Dashboard Functionality Testing

**File**: `dashboard/career-intelligence.test.js`  
**Technology**: Jest + Puppeteer with Chart.js mocking  
**Coverage**:
- Interactive chart rendering and responsiveness
- Metric counter animations
- Data loading and error handling
- Theme integration with charts
- Mobile dashboard optimization
- Performance under 2-second load requirement

### 5. Theme System Testing

**File**: `theme/theme-switching.test.js`  
**Technology**: Puppeteer with localStorage persistence testing  
**Features Tested**:
- Light/dark theme toggling
- CSS custom property updates
- localStorage persistence across sessions
- System preference detection (`prefers-color-scheme`)
- Theme-specific contrast ratios
- Chart theme synchronization

### 6. Cross-Browser Compatibility

**File**: `cross-browser/browser-compatibility.spec.js`  
**Technology**: Playwright  
**Browsers Tested**:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Android)
- Mobile Safari (iOS)

**Compatibility Areas**:
- JavaScript execution consistency
- CSS Grid and Flexbox support
- Form input handling
- Touch event support
- Media query responsiveness

## 🔧 Configuration Files

### Jest Configuration (`jest.setup.js`)

```javascript
// Global test utilities and mocks
global.testUtils = {
  waitFor: (condition, timeout = 5000) => { /* ... */ },
  mockFetch: (response, options = {}) => { /* ... */ }
};

// Mock Chart.js for dashboard tests
global.Chart = { register: jest.fn() };
```

### Puppeteer Configuration (`jest-puppeteer.config.js`)

```javascript
module.exports = {
  launch: {
    headless: process.env.CI ? true : 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  server: {
    command: 'cd .. && python -m http.server 8000',
    port: 8000
  }
};
```

### Lighthouse Configuration (`performance/lighthouse.config.js`)

Enterprise-grade performance thresholds with comprehensive Core Web Vitals monitoring.

## 🚀 CI/CD Integration

### GitHub Actions Pipeline

**File**: `.github/workflows/testing-pipeline.yml`

**Pipeline Stages**:
1. **Quality Gate Analysis** - Change detection and test matrix building
2. **Unit Tests** - Jest with 80%+ coverage requirement
3. **Accessibility Tests** - WCAG 2.1 AA compliance validation
4. **Performance Tests** - Core Web Vitals and Lighthouse CI
5. **Mobile Tests** - Multi-device responsive design validation
6. **Cross-Browser Tests** - Playwright compatibility testing
7. **Dashboard Validation** - Chart.js functionality testing
8. **Security Scan** - Vulnerability assessment
9. **Test Summary** - Comprehensive reporting and PR comments

**Quality Gates**:
- ✅ **Unit Test Coverage**: 80%+ required
- ✅ **Performance**: Sub-2-second load times
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Mobile**: 44px touch targets, responsive design
- ✅ **Cross-Browser**: Chrome, Firefox, Safari compatibility

### Pipeline Triggers

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM UTC
```

## 📊 Test Reports and Metrics

### Coverage Reports
- **Format**: HTML, LCOV, and JSON
- **Location**: `tests/coverage/`
- **Upload**: Codecov integration for PR visualization
- **Threshold**: 80% minimum coverage across lines, branches, functions

### Performance Reports
- **Lighthouse HTML Reports**: Generated for each test run
- **Core Web Vitals JSON**: Detailed performance metrics
- **Historical Tracking**: Lighthouse CI server integration

### Accessibility Reports
- **axe-core Results**: Detailed WCAG violation reports
- **Screenshot Evidence**: Visual regression testing
- **Remediation Guides**: Specific fix recommendations

### Cross-Browser Reports
- **Playwright HTML Reports**: Interactive test result viewer
- **Video Recordings**: Failure replay capabilities
- **Screenshot Comparison**: Visual consistency validation

## 🛠️ Development Workflow

### Pre-Commit Testing
```bash
# Quick validation before committing
npm run test:ci

# Accessibility check
npm run test:accessibility

# Performance validation
npm run lighthouse
```

### Local Development
```bash
# Start development server
npm run dev  # (from root directory)

# Run tests in watch mode
cd tests
npm run test:watch

# Debug specific test
npm test -- --testNamePattern="should load dashboard"
```

### Pull Request Workflow

1. **Automated Testing**: All test suites run on PR creation
2. **Quality Gate Validation**: Must pass all critical tests
3. **Performance Regression Check**: Lighthouse CI comparison
4. **Accessibility Validation**: No new WCAG violations
5. **Cross-Browser Verification**: Compatibility across target browsers
6. **Test Summary Comment**: Detailed results posted to PR

## 🎯 Quality Standards

### Enterprise Testing Criteria

**Performance Standards**:
- ⚡ Load Time: < 2 seconds (99th percentile)
- 🎨 LCP: < 2.5 seconds (Core Web Vital)
- 🖱️ FID: < 100ms (interaction responsiveness)
- 📐 CLS: < 0.1 (layout stability)

**Accessibility Standards**:
- ♿ WCAG 2.1 AA: 100% compliance
- 🎯 Touch Targets: 44px minimum
- ⌨️ Keyboard Navigation: Full functionality
- 🔍 Screen Reader: Complete ARIA support

**Mobile Standards**:
- 📱 Responsive Design: 320px-1920px range
- 👆 Touch Friendly: Optimized interactions
- 🔄 Orientation Support: Portrait/landscape
- 🚀 Mobile Performance: < 3 seconds on 3G

**Browser Compatibility**:
- ✅ Chrome 90+ (Desktop & Mobile)
- ✅ Firefox 88+ (Desktop)
- ✅ Safari 14+ (Desktop & Mobile)
- ✅ Edge 90+ (Chromium-based)

## 🚨 Troubleshooting

### Common Issues

**Jest Tests Failing**:
```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Puppeteer Issues**:
```bash
# Install Chrome dependencies (Linux)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2

# Run in debug mode
npm test -- --testTimeout=0 --runInBand
```

**Lighthouse CI Failures**:
```bash
# Check server is running
curl http://localhost:8000

# Run lighthouse manually
npx lighthouse http://localhost:8000 --view
```

**Cross-Browser Test Issues**:
```bash
# Install Playwright browsers
npx playwright install

# Run specific browser
npx playwright test --project=chromium
```

### Debug Commands

```bash
# Verbose test output
npm test -- --verbose

# Run single test file
npm test accessibility/wcag-compliance.test.js

# Debug with Chrome DevTools
npm test -- --inspect-brk

# Run tests with specific timeout
npm test -- --testTimeout=30000
```

## 📈 Metrics and Monitoring

### Performance Monitoring
- **Core Web Vitals**: Continuous monitoring with historical trends
- **Load Time Tracking**: 95th percentile performance measurement
- **Resource Optimization**: Bundle size and request count monitoring
- **Memory Usage**: JavaScript heap size tracking

### Quality Metrics
- **Test Coverage**: Line, branch, function, and statement coverage
- **Accessibility Score**: Automated WCAG compliance percentage
- **Performance Score**: Lighthouse performance score trending
- **Browser Compatibility**: Success rate across target browsers

### Success Criteria
- 🎯 **Test Coverage**: 90%+ across all modules
- ⚡ **Performance Score**: 95+ Lighthouse score
- ♿ **Accessibility Score**: 100% WCAG 2.1 AA compliance
- 🌐 **Browser Success Rate**: 98%+ across target browsers
- 📱 **Mobile Performance**: Sub-3-second load on 3G networks

## 🔄 Continuous Improvement

### Monthly Reviews
- Performance trend analysis
- Accessibility audit updates
- Browser compatibility assessment
- Test coverage gap analysis

### Quarterly Updates
- Testing framework version updates
- New browser version compatibility
- Performance threshold adjustments
- Accessibility standard updates

---

## 📞 Support

For testing framework support:
- 📧 **Issues**: [GitHub Issues](https://github.com/adrianwedd/cv/issues)
- 📖 **Documentation**: This README and inline code comments
- 🛠️ **Debugging**: Use verbose test output and browser DevTools

**Enterprise Testing Framework v1.0**  
✅ Production-ready with comprehensive quality assurance
🚀 Integrated CI/CD pipeline with automated quality gates
📊 Real-time performance and accessibility monitoring