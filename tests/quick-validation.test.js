/**
 * Quick Validation Test Suite
 * Validates recent fixes and critical functionality
 */

const fs = require('fs').promises;
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Quick Validation - Recent Fixes', () => {
  describe('Security Fixes Validation', () => {
    test('CSP compliance - external scripts created', async () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      const content = await fs.readFile(htmlPath, 'utf8');
      
      // Verify our CSP-compliant external scripts exist
      expect(content).toContain('ux-systems-init.js');
      expect(content).toContain('sw-performance-init.js');
      expect(content).toContain('langsmith-tracking.js');
      
      // Verify CSP meta tag exists
      expect(content).toContain('Content-Security-Policy');
      
      console.log('✅ CSP compliance validated');
    });

    test('CSS variables fix validation', async () => {
      const cssPath = path.join(PROJECT_ROOT, 'assets', 'styles.css');
      const content = await fs.readFile(cssPath, 'utf8');
      
      // Verify the critical fix we made
      expect(content).toContain('--color-text-primary: #ffffff');
      expect(content).toContain(':root');
      
      console.log('✅ CSS variables fix validated');
    });

    test('Service worker path fix validation', async () => {
      const swInitPath = path.join(PROJECT_ROOT, 'assets', 'sw-performance-init.js');
      const content = await fs.readFile(swInitPath, 'utf8');
      
      // Verify the service worker path fix
      expect(content).toContain("register('/sw.js')");
      expect(content).not.toContain("register('/cv/sw.js')");
      
      console.log('✅ Service worker path fix validated');
    });
  });

  describe('Core File Structure', () => {
    test('essential files exist', async () => {
      const essentialFiles = [
        'index.html',
        'package.json',
        'sw.js',
        'assets/styles.css',
        'assets/script.js',
        'data/base-cv.json'
      ];

      for (const file of essentialFiles) {
        const filePath = path.join(PROJECT_ROOT, file);
        try {
          await fs.access(filePath);
          console.log(`✅ ${file} exists`);
        } catch (error) {
          fail(`Critical file missing: ${file}`);
        }
      }
    });

    test('new CSP-compliant scripts exist', async () => {
      const cspScripts = [
        'assets/ux-systems-init.js',
        'assets/sw-performance-init.js',
        'assets/langsmith-tracking.js'
      ];

      for (const script of cspScripts) {
        const scriptPath = path.join(PROJECT_ROOT, script);
        try {
          await fs.access(scriptPath);
          const content = await fs.readFile(scriptPath, 'utf8');
          expect(content.length).toBeGreaterThan(10);
          console.log(`✅ ${script} exists and has content`);
        } catch (error) {
          fail(`CSP script missing: ${script}`);
        }
      }
    });
  });

  describe('Data Integrity', () => {
    test('base CV data is valid JSON', async () => {
      const dataPath = path.join(PROJECT_ROOT, 'data', 'base-cv.json');
      const content = await fs.readFile(dataPath, 'utf8');
      
      const data = JSON.parse(content); // Will throw if invalid
      expect(data.profile).toBeDefined();
      expect(data.profile.personal).toBeDefined();
      expect(data.profile.personal.name).toBe('Adrian Wedd');
      
      console.log('✅ CV data structure validated');
    });

    test('package.json is valid', async () => {
      const packagePath = path.join(PROJECT_ROOT, 'package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      
      const pkg = JSON.parse(content);
      expect(pkg.name).toBe('cv-system');
      expect(pkg.version).toBeDefined();
      expect(pkg.scripts).toBeDefined();
      
      console.log('✅ Package.json structure validated');
    });
  });

  describe('DevX Tools Added', () => {
    test('new DevX optimization tools exist', async () => {
      const devxTools = [
        '.github/scripts/devx-implementation-guide.sh',
        '.github/scripts/intelligent-issue-manager.js',
        '.github/scripts/workflow-consolidator.js',
        '.github/scripts/unified-devx-dashboard.js'
      ];

      for (const tool of devxTools) {
        const toolPath = path.join(PROJECT_ROOT, tool);
        try {
          await fs.access(toolPath);
          const content = await fs.readFile(toolPath, 'utf8');
          expect(content.length).toBeGreaterThan(100);
          console.log(`✅ ${tool} exists`);
        } catch (error) {
          fail(`DevX tool missing: ${tool}`);
        }
      }
    });
  });
});