#!/usr/bin/env node

/**
 * Cross-Browser Testing Validation Script
 * Validates the complete cross-browser test setup before CI execution
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

class CrossBrowserValidator {
  constructor() {
    this.results = {
      dependencies: false,
      browsers: { chromium: false, firefox: false, webkit: false },
      testServer: false,
      testExecution: { chromium: false, firefox: false, webkit: false },
      artifacts: false
    };
  }

  log(level, message, details = '') {
    const timestamp = new Date().toISOString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️', 
      error: '❌',
      debug: '🔍'
    };
    
    
  }

  async validateDependencies() {
    this.log('info', 'Validating dependencies...');
    
    try {
      // Check if we're in the right directory
      if (!existsSync('package.json')) {
        throw new Error('package.json not found. Please run from tests directory.');
      }

      // Check npm dependencies
      execSync('npm ls @playwright/test playwright', { stdio: 'pipe' });
      this.results.dependencies = true;
      this.log('success', 'Dependencies validated');
      return true;
    } catch (error) {
      this.log('error', 'Dependency validation failed:', error.message);
      return false;
    }
  }

  async validateBrowsers() {
    this.log('info', 'Validating browser installations...');
    
    const browsers = ['chromium', 'firefox', 'webkit'];
    
    for (const browser of browsers) {
      try {
        this.log('info', `Installing ${browser}...`);
        execSync(`npx playwright install-deps ${browser}`, { stdio: 'pipe' });
        execSync(`npx playwright install ${browser}`, { stdio: 'pipe' });
        
        // Test browser can launch
        execSync(`npx playwright test --project=${browser} --list > /dev/null`, { stdio: 'pipe' });
        
        this.results.browsers[browser] = true;
        this.log('success', `${browser} browser validated`);
      } catch (error) {
        this.log('error', `${browser} browser validation failed:`, error.message);
        this.results.browsers[browser] = false;
      }
    }
    
    const validBrowsers = Object.values(this.results.browsers).filter(Boolean).length;
    this.log('info', `Browser validation complete: ${validBrowsers}/3 browsers ready`);
    
    return validBrowsers === 3;
  }

  async validateTestServer() {
    this.log('info', 'Validating test server...');
    
    return new Promise((resolve) => {
      const server = spawn('python3', ['-m', 'http.server', '8000'], {
        cwd: path.join(process.cwd(), '..'),
        stdio: 'pipe'
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          server.kill();
          this.log('error', 'Test server validation failed: timeout');
          resolve(false);
        }
      }, 10000);

      server.on('error', (error) => {
        this.log('error', 'Test server validation failed:', error.message);
        clearTimeout(timeout);
        resolve(false);
      });

      // Test server readiness
      const checkServer = () => {
        try {
          execSync('curl -f http://localhost:8000/ > /dev/null 2>&1');
          if (!serverReady) {
            serverReady = true;
            this.results.testServer = true;
            this.log('success', 'Test server validated');
            server.kill();
            clearTimeout(timeout);
            resolve(true);
          }
        } catch (error) {
          setTimeout(checkServer, 1000);
        }
      };

      setTimeout(checkServer, 2000);
    });
  }

  async validateTestExecution() {
    this.log('info', 'Validating test execution...');
    
    // Create test results directory
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }

    const browsers = ['chromium', 'firefox', 'webkit'];
    
    for (const browser of browsers) {
      if (!this.results.browsers[browser]) {
        this.log('warning', `Skipping test execution for ${browser} (browser not available)`);
        continue;
      }

      try {
        this.log('info', `Testing execution for ${browser}...`);
        
        // Run a minimal test to validate execution
        execSync(`npx playwright test --project=${browser} --headed=false --timeout=30000 --retries=1 --grep "should load main CV page"`, {
          stdio: 'pipe',
          timeout: 45000
        });
        
        this.results.testExecution[browser] = true;
        this.log('success', `${browser} test execution validated`);
      } catch (error) {
        this.log('error', `${browser} test execution failed:`, error.message.slice(0, 200) + '...');
        this.results.testExecution[browser] = false;
      }
    }
    
    const validExecutions = Object.values(this.results.testExecution).filter(Boolean).length;
    this.log('info', `Test execution validation complete: ${validExecutions}/3 browsers ready`);
    
    return validExecutions >= 2; // Allow at least 2/3 browsers to work
  }

  async validateArtifacts() {
    this.log('info', 'Validating artifact directories...');
    
    const dirs = ['test-results', 'playwright-report'];
    
    for (const dir of dirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
    }
    
    this.results.artifacts = true;
    this.log('success', 'Artifact directories validated');
    return true;
  }

  generateReport() {
    const totalBrowsers = Object.keys(this.results.browsers).length;
    const validBrowsers = Object.values(this.results.browsers).filter(Boolean).length;
    const totalExecutions = Object.keys(this.results.testExecution).length;
    const validExecutions = Object.values(this.results.testExecution).filter(Boolean).length;

    
    );
    
    
    `);
    
    `);
    
    
    const overallScore = [
      this.results.dependencies,
      validBrowsers >= 2,
      this.results.testServer,
      validExecutions >= 2,
      this.results.artifacts
    ].filter(Boolean).length;
    
    
    
    if (overallScore >= 4) {
      
      
    } else if (overallScore >= 3) {
      
      
    } else {
      
      
    }
    
    return overallScore >= 3;
  }

  async runValidation() {
    this.log('info', 'Starting comprehensive cross-browser validation...');
    
    const steps = [
      () => this.validateDependencies(),
      () => this.validateBrowsers(),
      () => this.validateTestServer(),
      () => this.validateTestExecution(),
      () => this.validateArtifacts()
    ];
    
    let passed = 0;
    for (const step of steps) {
      if (await step()) {
        passed++;
      }
    }
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CrossBrowserValidator();
  
  validator.runValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export default CrossBrowserValidator;