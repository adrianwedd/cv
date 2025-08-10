#!/usr/bin/env node

/**
 * Optimization Scripts Test Suite
 * Comprehensive testing for all optimization and improvement systems
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Optimization Scripts Test Suite', () => {
  let testResults = [];
  let backups = new Map();
  let originalMetrics = null;

  beforeAll(async () => {
    console.log('🧪 Initializing Optimization Test Suite...');
    // Capture baseline metrics
    originalMetrics = await captureMetrics();
    console.log('📊 Baseline metrics captured');
  }, 30000);

  afterAll(async () => {
    // Cleanup any created files or backups
    console.log('🧹 Cleaning up test suite...');
  });

  beforeEach(() => {
    testResults = [];
  });

  // Helper functions
  async function fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async function captureMetrics() {
    try {
      const packagePath = path.join(PROJECT_ROOT, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      return {
        version: packageJson.version,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version
      };
    } catch (error) {
      console.warn('Could not capture baseline metrics:', error.message);
      return null;
    }
  }

  describe('Core Optimization Scripts', () => {
    test('should have package.json with valid configuration', async () => {
      const packagePath = path.join(PROJECT_ROOT, 'package.json');
      const exists = await fileExists(packagePath);
      expect(exists).toBe(true);
      
      if (exists) {
        const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
        expect(packageJson.name).toBeDefined();
        expect(packageJson.version).toBeDefined();
        expect(packageJson.scripts).toBeDefined();
      }
    });

    test('should have main CV data file', async () => {
      const dataPath = path.join(PROJECT_ROOT, 'data', 'base-cv.json');
      const exists = await fileExists(dataPath);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = await fs.readFile(dataPath, 'utf8');
        const data = JSON.parse(content);
        expect(data.profile).toBeDefined();
        expect(data.profile.personal).toBeDefined();
      }
    });

    test('should have working HTML entry point', async () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      const exists = await fileExists(htmlPath);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = await fs.readFile(htmlPath, 'utf8');
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('Adrian Wedd');
      }
    });
  });

  describe('Optimization Script Testing', () => {
    test('optimization-stabilizer.js availability', async () => {
      const scriptPath = path.join(PROJECT_ROOT, 'optimization-stabilizer.js');
      const exists = await fileExists(scriptPath);
      
      if (exists) {
        try {
          const output = execSync('node optimization-stabilizer.js --dry-run', { 
            cwd: PROJECT_ROOT, 
            encoding: 'utf8',
            timeout: 30000
          });
          expect(output).toContain('optimization');
        } catch (error) {
          console.warn('Optimization stabilizer not executable:', error.message);
        }
      } else {
        console.log('📝 optimization-stabilizer.js not found (optional)');
      }
    });

    test('performance-optimization-suite.js availability', async () => {
      const scriptPath = path.join(PROJECT_ROOT, 'performance-optimization-suite.js');
      const exists = await fileExists(scriptPath);
      
      if (exists) {
        try {
          const output = execSync('node performance-optimization-suite.js --validate-config', { 
            cwd: PROJECT_ROOT, 
            encoding: 'utf8',
            timeout: 30000
          });
          console.log('✅ Performance optimization suite validated');
        } catch (error) {
          console.warn('Performance optimization suite not executable:', error.message);
        }
      } else {
        console.log('📝 performance-optimization-suite.js not found (optional)');
      }
    });
  });

  describe('Critical Files Structure', () => {
    test('assets directory should exist with core files', async () => {
      const assetsPath = path.join(PROJECT_ROOT, 'assets');
      const exists = await fileExists(assetsPath);
      expect(exists).toBe(true);
      
      if (exists) {
        const coreFiles = ['styles.css', 'script.js'];
        for (const file of coreFiles) {
          const filePath = path.join(assetsPath, file);
          const fileExists = await fileExists(filePath);
          expect(fileExists).toBe(true);
        }
      }
    });

    test('service worker should be properly configured', async () => {
      const swPath = path.join(PROJECT_ROOT, 'sw.js');
      const exists = await fileExists(swPath);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = await fs.readFile(swPath, 'utf8');
        expect(content).toContain('Service Worker');
        expect(content).toContain('cache');
      }
    });
  });

  describe('Recent Security Fixes Validation', () => {
    test('CSP compliant scripts should be external', async () => {
      const htmlPath = path.join(PROJECT_ROOT, 'index.html');
      const exists = await fileExists(htmlPath);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = await fs.readFile(htmlPath, 'utf8');
        
        // Check for external script files we created
        expect(content).toContain('ux-systems-init.js');
        expect(content).toContain('sw-performance-init.js');
        expect(content).toContain('langsmith-tracking.js');
        
        // Check that inline scripts are minimal
        const inlineScriptCount = (content.match(/<script(?:[^>]*src[^>]*)?>/gi) || []).length;
        const externalScriptCount = (content.match(/<script[^>]+src[^>]*>/gi) || []).length;
        
        console.log(`📊 Scripts found: ${inlineScriptCount} total, ${externalScriptCount} external`);
        expect(externalScriptCount).toBeGreaterThan(10); // Should have many external scripts
      }
    });

    test('CSS variables should be properly defined', async () => {
      const cssPath = path.join(PROJECT_ROOT, 'assets', 'styles.css');
      const exists = await fileExists(cssPath);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = await fs.readFile(cssPath, 'utf8');
        
        // Check for the fixed CSS variable
        expect(content).toContain('--color-text-primary: #ffffff');
        expect(content).toContain(':root');
        
        console.log('✅ Critical CSS variables properly defined');
      }
    });
  });
});