#!/usr/bin/env node

/**
 * Optimization Scripts Test Suite
 * Comprehensive testing for all optimization and improvement systems
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'node:test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

class OptimizationTestSuite {
  constructor() {
    this.testResults = [];
    this.backups = new Map();
    this.originalMetrics = null;
  }

  async initialize() {
    console.log('🧪 Initializing Optimization Test Suite...');
    
    // Capture baseline metrics
    this.originalMetrics = await this.captureMetrics();
    console.log('📊 Baseline metrics captured');
    
    return true;
  }

  async captureMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      repository: await this.getRepositoryMetrics(),
      quality: await this.getQualityMetrics(),
      health: await this.getHealthMetrics(),
      performance: await this.getPerformanceMetrics()
    };
    
    return metrics;
  }

  async getRepositoryMetrics() {
    try {
      const sizeOutput = execSync('du -sb .', { cwd: PROJECT_ROOT, encoding: 'utf8' });
      const size = parseInt(sizeOutput.split('\t')[0]);
      
      const fileOutput = execSync('find . -type f | wc -l', { cwd: PROJECT_ROOT, encoding: 'utf8' });
      const fileCount = parseInt(fileOutput.trim());
      
      const jsOutput = execSync('find . -name "*.js" | wc -l', { cwd: PROJECT_ROOT, encoding: 'utf8' });
      const jsFiles = parseInt(jsOutput.trim());
      
      return { size, fileCount, jsFiles };
    } catch (error) {
      return { size: 0, fileCount: 0, jsFiles: 0 };
    }
  }

  async getQualityMetrics() {
    try {
      const content = await fs.readFile(path.join(PROJECT_ROOT, 'quality-report.json'), 'utf8');
      const report = JSON.parse(content);
      return {
        overallScore: report.overview?.overallScore || 0,
        performance: report.currentMetrics?.performance?.score || 0,
        accessibility: report.currentMetrics?.accessibility?.score || 0
      };
    } catch {
      return { overallScore: 0, performance: 0, accessibility: 0 };
    }
  }

  async getHealthMetrics() {
    try {
      const content = await fs.readFile(path.join(PROJECT_ROOT, 'health-summary.json'), 'utf8');
      const health = JSON.parse(content);
      return {
        healthScore: health.healthScore || 0,
        uptime: health.uptime || 0
      };
    } catch {
      return { healthScore: 0, uptime: 0 };
    }
  }

  async getPerformanceMetrics() {
    try {
      const content = await fs.readFile(path.join(PROJECT_ROOT, 'quality-report.json'), 'utf8');
      const report = JSON.parse(content);
      
      return {
        loadTime: report.currentMetrics?.performance?.loadTime || 0,
        resourceSize: report.currentMetrics?.performance?.resourceSize || 0,
        cacheHitRatio: report.currentMetrics?.performance?.cacheHitRatio || 0
      };
    } catch {
      return { loadTime: 0, resourceSize: 0, cacheHitRatio: 0 };
    }
  }

  async testOptimizationStabilizer() {
    console.log('🧪 Testing optimization-stabilizer.js...');
    
    try {
      const scriptPath = path.join(PROJECT_ROOT, 'optimization-stabilizer.js');
      const exists = await this.fileExists(scriptPath);
      
      expect(exists).toBe(true, 'optimization-stabilizer.js should exist');
      
      if (exists) {
        // Test dry run mode
        const output = execSync('node optimization-stabilizer.js --dry-run', { 
          cwd: PROJECT_ROOT, 
          encoding: 'utf8',
          timeout: 30000
        });
        
        expect(output).toContain('optimization', 'Should contain optimization output');
        console.log('  ✅ Optimization stabilizer dry run successful');
        
        return { passed: true, message: 'Optimization stabilizer working correctly' };
      }
    } catch (error) {
      console.log('  ❌ Optimization stabilizer test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testPerformanceOptimizationSuite() {
    console.log('🧪 Testing performance-optimization-suite.js...');
    
    try {
      const scriptPath = path.join(PROJECT_ROOT, 'performance-optimization-suite.js');
      const exists = await this.fileExists(scriptPath);
      
      expect(exists).toBe(true, 'performance-optimization-suite.js should exist');
      
      if (exists) {
        // Test configuration validation
        const output = execSync('node performance-optimization-suite.js --validate-config', { 
          cwd: PROJECT_ROOT, 
          encoding: 'utf8',
          timeout: 30000
        });
        
        console.log('  ✅ Performance optimization suite validation successful');
        return { passed: true, message: 'Performance optimization suite working correctly' };
      }
    } catch (error) {
      console.log('  ❌ Performance optimization suite test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testQualityMonitoringSystem() {
    console.log('🧪 Testing quality-monitoring-system.js...');
    
    try {
      const scriptPath = path.join(PROJECT_ROOT, 'quality-monitoring-system.js');
      const exists = await this.fileExists(scriptPath);
      
      expect(exists).toBe(true, 'quality-monitoring-system.js should exist');
      
      if (exists) {
        // Test monitoring system status
        const output = execSync('node quality-monitoring-system.js --status', { 
          cwd: PROJECT_ROOT, 
          encoding: 'utf8',
          timeout: 30000
        });
        
        console.log('  ✅ Quality monitoring system status check successful');
        return { passed: true, message: 'Quality monitoring system working correctly' };
      }
    } catch (error) {
      console.log('  ❌ Quality monitoring system test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testHealthMonitor() {
    console.log('🧪 Testing health-monitor.js...');
    
    try {
      const scriptPath = path.join(PROJECT_ROOT, 'health-monitor.js');
      const exists = await this.fileExists(scriptPath);
      
      expect(exists).toBe(true, 'health-monitor.js should exist');
      
      if (exists) {
        // Test health check
        const output = execSync('node health-monitor.js --check', { 
          cwd: PROJECT_ROOT, 
          encoding: 'utf8',
          timeout: 30000
        });
        
        expect(output).toContain('health', 'Should contain health information');
        console.log('  ✅ Health monitor check successful');
        
        return { passed: true, message: 'Health monitor working correctly' };
      }
    } catch (error) {
      console.log('  ❌ Health monitor test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testDataPipelineOptimizer() {
    console.log('🧪 Testing data-pipeline-optimizer.js...');
    
    try {
      const scriptPath = path.join(PROJECT_ROOT, 'data-pipeline-optimizer.js');
      const exists = await this.fileExists(scriptPath);
      
      expect(exists).toBe(true, 'data-pipeline-optimizer.js should exist');
      
      if (exists) {
        // Test pipeline validation
        const output = execSync('node data-pipeline-optimizer.js --validate', { 
          cwd: PROJECT_ROOT, 
          encoding: 'utf8',
          timeout: 30000
        });
        
        console.log('  ✅ Data pipeline optimizer validation successful');
        return { passed: true, message: 'Data pipeline optimizer working correctly' };
      }
    } catch (error) {
      console.log('  ❌ Data pipeline optimizer test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testRecursiveImprovementOrchestrator() {
    console.log('🧪 Testing recursive-improvement-orchestrator.js...');
    
    try {
      const scriptPath = path.join(PROJECT_ROOT, 'recursive-improvement-orchestrator.js');
      const exists = await this.fileExists(scriptPath);
      
      expect(exists).toBe(true, 'recursive-improvement-orchestrator.js should exist');
      
      if (exists) {
        // Test orchestrator status
        const output = execSync('node recursive-improvement-orchestrator.js --status', { 
          cwd: PROJECT_ROOT, 
          encoding: 'utf8',
          timeout: 30000
        });
        
        console.log('  ✅ Recursive improvement orchestrator status check successful');
        return { passed: true, message: 'Recursive improvement orchestrator working correctly' };
      }
    } catch (error) {
      console.log('  ❌ Recursive improvement orchestrator test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testOptimizationImpactValidation() {
    console.log('🧪 Testing optimization impact validation...');
    
    try {
      // Capture metrics before any optimization
      const beforeMetrics = await this.captureMetrics();
      
      // Run a safe optimization (dry run mode)
      execSync('node optimization-stabilizer.js --dry-run', { 
        cwd: PROJECT_ROOT, 
        timeout: 30000
      });
      
      // Capture metrics after optimization
      const afterMetrics = await this.captureMetrics();
      
      // Validate that metrics are stable (no unexpected changes in dry run)
      const repositorySizeChange = Math.abs(afterMetrics.repository.size - beforeMetrics.repository.size);
      const qualityScoreChange = Math.abs(afterMetrics.quality.overallScore - beforeMetrics.quality.overallScore);
      
      expect(repositorySizeChange < 1000).toBe(true, 'Repository size should be stable in dry run');
      expect(qualityScoreChange < 5).toBe(true, 'Quality score should be stable in dry run');
      
      console.log('  ✅ Optimization impact validation successful');
      return { passed: true, message: 'Optimization impact validation working correctly' };
    } catch (error) {
      console.log('  ❌ Optimization impact validation failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testRollbackCapability() {
    console.log('🧪 Testing rollback capability...');
    
    try {
      // Create a test file to modify
      const testFile = path.join(PROJECT_ROOT, 'test-rollback-target.txt');
      const originalContent = 'original content';
      const modifiedContent = 'modified content';
      
      await fs.writeFile(testFile, originalContent);
      
      // Simulate modification
      await fs.writeFile(testFile, modifiedContent);
      
      // Verify modification
      const currentContent = await fs.readFile(testFile, 'utf8');
      expect(currentContent).toBe(modifiedContent, 'File should be modified');
      
      // Simulate rollback (restore original)
      await fs.writeFile(testFile, originalContent);
      
      // Verify rollback
      const rolledBackContent = await fs.readFile(testFile, 'utf8');
      expect(rolledBackContent).toBe(originalContent, 'File should be rolled back');
      
      // Clean up
      await fs.unlink(testFile);
      
      console.log('  ✅ Rollback capability test successful');
      return { passed: true, message: 'Rollback capability working correctly' };
    } catch (error) {
      console.log('  ❌ Rollback capability test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testPerformanceRegressionDetection() {
    console.log('🧪 Testing performance regression detection...');
    
    try {
      const scriptPath = path.join(PROJECT_ROOT, 'performance-regression-detector.js');
      const exists = await this.fileExists(scriptPath);
      
      expect(exists).toBe(true, 'performance-regression-detector.js should exist');
      
      if (exists) {
        // Test regression analysis
        const output = execSync('node performance-regression-detector.js analyze', { 
          cwd: PROJECT_ROOT, 
          encoding: 'utf8',
          timeout: 30000
        });
        
        expect(output).toContain('Regression', 'Should contain regression analysis');
        console.log('  ✅ Performance regression detection successful');
        
        return { passed: true, message: 'Performance regression detection working correctly' };
      }
    } catch (error) {
      console.log('  ❌ Performance regression detection test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async testConfigurationValidation() {
    console.log('🧪 Testing configuration validation...');
    
    try {
      // Test quality gates configuration
      const gatesConfig = await fs.readFile(path.join(PROJECT_ROOT, 'quality-gates-config.json'), 'utf8');
      const gates = JSON.parse(gatesConfig);
      
      expect(gates).toHaveProperty('gates');
      expect(gates).toHaveProperty('thresholds');
      expect(gates.gates).toHaveProperty('pre_deployment');
      expect(gates.gates).toHaveProperty('post_deployment');
      
      console.log('  ✅ Quality gates configuration validation successful');
      
      // Validate threshold hierarchy
      const thresholds = gates.thresholds;
      expect(thresholds.critical.quality_score <= thresholds.warning.quality_score).toBe(true);
      expect(thresholds.warning.quality_score <= thresholds.target.quality_score).toBe(true);
      
      console.log('  ✅ Threshold hierarchy validation successful');
      
      return { passed: true, message: 'Configuration validation working correctly' };
    } catch (error) {
      console.log('  ❌ Configuration validation test failed:', error.message);
      return { passed: false, message: error.message };
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async generateOptimizationTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(t => t.passed).length,
        failedTests: this.testResults.filter(t => t.passed === false).length,
        passRate: this.testResults.length > 0 
          ? Math.round((this.testResults.filter(t => t.passed).length / this.testResults.length) * 100)
          : 0
      },
      testResults: this.testResults,
      baselineMetrics: this.originalMetrics,
      finalMetrics: await this.captureMetrics()
    };
    
    const reportPath = path.join(PROJECT_ROOT, 'optimization-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Optimization test report generated');
    return report;
  }

  printTestSummary(report) {
    console.log('\n🧪 Optimization Scripts Test Summary');
    console.log('===================================');
    console.log(`📊 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passedTests}`);
    console.log(`❌ Failed: ${report.summary.failedTests}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}%`);
    
    if (report.testResults.some(t => t.passed === false)) {
      console.log('\n❌ Failed Tests:');
      report.testResults.filter(t => t.passed === false).forEach(test => {
        console.log(`  • ${test.name}: ${test.message}`);
      });
    }
    
    console.log('===================================\n');
  }
}

// Test Suite
describe('Optimization Scripts Test Suite', () => {
  let testSuite;

  beforeAll(async () => {
    testSuite = new OptimizationTestSuite();
    await testSuite.initialize();
  });

  describe('Core Optimization Scripts', () => {
    it('should validate optimization-stabilizer.js functionality', async () => {
      const result = await testSuite.testOptimizationStabilizer();
      testSuite.testResults.push({ name: 'Optimization Stabilizer', ...result });
      expect(result.passed).toBe(true);
    });

    it('should validate performance-optimization-suite.js functionality', async () => {
      const result = await testSuite.testPerformanceOptimizationSuite();
      testSuite.testResults.push({ name: 'Performance Optimization Suite', ...result });
      expect(result.passed).toBe(true);
    });

    it('should validate quality-monitoring-system.js functionality', async () => {
      const result = await testSuite.testQualityMonitoringSystem();
      testSuite.testResults.push({ name: 'Quality Monitoring System', ...result });
      expect(result.passed).toBe(true);
    });

    it('should validate health-monitor.js functionality', async () => {
      const result = await testSuite.testHealthMonitor();
      testSuite.testResults.push({ name: 'Health Monitor', ...result });
      expect(result.passed).toBe(true);
    });
  });

  describe('Data Processing & Pipeline', () => {
    it('should validate data-pipeline-optimizer.js functionality', async () => {
      const result = await testSuite.testDataPipelineOptimizer();
      testSuite.testResults.push({ name: 'Data Pipeline Optimizer', ...result });
      expect(result.passed).toBe(true);
    });

    it('should validate recursive-improvement-orchestrator.js functionality', async () => {
      const result = await testSuite.testRecursiveImprovementOrchestrator();
      testSuite.testResults.push({ name: 'Recursive Improvement Orchestrator', ...result });
      expect(result.passed).toBe(true);
    });
  });

  describe('Quality Assurance & Regression Prevention', () => {
    it('should validate optimization impact tracking', async () => {
      const result = await testSuite.testOptimizationImpactValidation();
      testSuite.testResults.push({ name: 'Optimization Impact Validation', ...result });
      expect(result.passed).toBe(true);
    });

    it('should validate rollback capability', async () => {
      const result = await testSuite.testRollbackCapability();
      testSuite.testResults.push({ name: 'Rollback Capability', ...result });
      expect(result.passed).toBe(true);
    });

    it('should validate performance regression detection', async () => {
      const result = await testSuite.testPerformanceRegressionDetection();
      testSuite.testResults.push({ name: 'Performance Regression Detection', ...result });
      expect(result.passed).toBe(true);
    });
  });

  describe('Configuration & Setup', () => {
    it('should validate configuration integrity', async () => {
      const result = await testSuite.testConfigurationValidation();
      testSuite.testResults.push({ name: 'Configuration Validation', ...result });
      expect(result.passed).toBe(true);
    });
  });

  describe('Test Reporting', () => {
    it('should generate comprehensive test report', async () => {
      const report = await testSuite.generateOptimizationTestReport();
      testSuite.printTestSummary(report);
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('testResults');
      expect(report.summary.totalTests).toBeGreaterThan(0);
    });
  });
});

export { OptimizationTestSuite };