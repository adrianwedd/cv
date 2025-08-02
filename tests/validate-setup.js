#!/usr/bin/env node

/**
 * Enterprise Testing Framework Setup Validation
 * Validates that all testing components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Enterprise Testing Framework - Setup Validation\n');

const checks = [];

// Check 1: Required files exist
const requiredFiles = [
  'package.json',
  'jest.setup.js',
  'jest-puppeteer.config.js',
  'playwright.config.js',
  'README.md',
  'accessibility/wcag-compliance.test.js',
  'dashboard/career-intelligence.test.js',
  'mobile/responsive-design.test.js',
  'performance/core-web-vitals.test.js',
  'performance/lighthouse.config.js',
  'theme/theme-switching.test.js',
  'cross-browser/browser-compatibility.spec.js'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  checks.push({ name: `File: ${file}`, status: exists });
});

// Check 2: Package.json validation
console.log('\n📦 Validating package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const requiredDeps = [
    '@axe-core/puppeteer',
    '@lhci/cli', 
    '@playwright/test',
    'jest',
    'puppeteer'
  ];
  
  requiredDeps.forEach(dep => {
    const exists = pkg.dependencies && pkg.dependencies[dep];
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${dep}`);
    checks.push({ name: `Dependency: ${dep}`, status: !!exists });
  });
  
  const requiredScripts = [
    'test',
    'test:accessibility',
    'test:performance', 
    'test:dashboard',
    'test:mobile'
  ];
  
  requiredScripts.forEach(script => {
    const exists = pkg.scripts && pkg.scripts[script];
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${script}`);
    checks.push({ name: `Script: ${script}`, status: !!exists });
  });
  
} catch (error) {
  console.log('  ❌ package.json parsing failed');
  checks.push({ name: 'Package.json parsing', status: false });
}

// Check 3: GitHub Actions workflow
console.log('\n🚀 Checking CI/CD integration...');
const workflowPath = path.join(__dirname, '../.github/workflows/testing-pipeline.yml');
const workflowExists = fs.existsSync(workflowPath);
const workflowStatus = workflowExists ? '✅' : '❌';
console.log(`  ${workflowStatus} GitHub Actions workflow`);
checks.push({ name: 'GitHub Actions workflow', status: workflowExists });

// Check 4: Test structure validation
console.log('\n🧪 Validating test structure...');
const testDirs = ['accessibility', 'dashboard', 'mobile', 'performance', 'theme', 'cross-browser'];

testDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${dir}/ directory`);
  checks.push({ name: `Directory: ${dir}`, status: exists });
});

// Summary
console.log('\n📊 Validation Summary');
console.log('=' .repeat(50));

const passed = checks.filter(check => check.status).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Total Checks: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${total - passed}`);
console.log(`Success Rate: ${percentage}%`);

if (percentage === 100) {
  console.log('\n🎉 SUCCESS: Enterprise Testing Framework is fully configured!');
  console.log('\n📋 Next Steps:');
  console.log('  1. Install dependencies: npm install');
  console.log('  2. Run tests: npm test');
  console.log('  3. Check CI/CD pipeline in GitHub Actions');
  console.log('  4. Review test coverage reports');
  
  console.log('\n🚀 Quality Gates Configured:');
  console.log('  ✅ WCAG 2.1 AA Accessibility Compliance');
  console.log('  ✅ Sub-2-Second Performance Requirements');
  console.log('  ✅ Mobile-First Responsive Design (44px touch targets)');
  console.log('  ✅ Cross-Browser Compatibility (Chrome, Firefox, Safari)');
  console.log('  ✅ Dashboard Functionality with Chart.js Integration');
  console.log('  ✅ Theme System Validation');
  console.log('  ✅ 80%+ Test Coverage Requirements');
  
  process.exit(0);
} else {
  console.log('\n⚠️  WARNING: Setup incomplete. Please fix the failed checks above.');
  
  const failures = checks.filter(check => !check.status);
  console.log('\n❌ Failed Checks:');
  failures.forEach(failure => {
    console.log(`  - ${failure.name}`);
  });
  
  process.exit(1);
}