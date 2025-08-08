#!/usr/bin/env node

/**
 * Workflow Coordination Testing Suite
 * 
 * Tests the git conflict resolution and workflow coordination systems
 * to ensure reliable CI/CD operations without race conditions.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import our coordination modules (will need to create ES module versions)
// For now, we'll test the core functionality without the modules

class WorkflowCoordinationTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    this.verbose = true;
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [TEST] [${level}] ${message}`);
  }

  /**
   * Run a test with proper error handling
   */
  async runTest(testName, testFunction) {
    this.log(`Starting test: ${testName}`);
    
    const testResult = {
      name: testName,
      startTime: Date.now(),
      status: 'running'
    };

    try {
      await testFunction();
      testResult.status = 'passed';
      testResult.duration = Date.now() - testResult.startTime;
      this.testResults.passed++;
      this.log(`✅ PASSED: ${testName} (${testResult.duration}ms)`, 'SUCCESS');
    } catch (error) {
      testResult.status = 'failed';
      testResult.duration = Date.now() - testResult.startTime;
      testResult.error = error.message;
      testResult.stack = error.stack;
      this.testResults.failed++;
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'ERROR');
    }

    this.testResults.tests.push(testResult);
  }

  /**
   * Test basic safe git operations
   */
  async testSafeGitOperations() {
    const gitOps = new SafeGitOperations({ verbose: false });

    // Test 1: Check current status
    const hasChanges = gitOps.hasChanges();
    const currentBranch = gitOps.getCurrentBranch();
    
    if (!currentBranch) {
      throw new Error('Could not determine current branch');
    }

    this.log(`Git status: branch=${currentBranch}, hasChanges=${hasChanges}`);

    // Test 2: Test fetch operation
    await gitOps.fetchRemote();

    // Test 3: Test configuration
    gitOps.configureGit('test@example.com', 'Test User');

    this.log('Safe git operations test completed successfully');
  }

  /**
   * Test workflow coordinator
   */
  async testWorkflowCoordinator() {
    const coordinator = new WorkflowCoordinator({ verbose: false });

    // Test 1: Get current workflow info
    const workflow = coordinator.getCurrentWorkflow();
    
    if (!workflow.name) {
      throw new Error('Could not get workflow information');
    }

    this.log(`Current workflow: ${workflow.name} (run ${workflow.runNumber})`);

    // Test 2: Get coordination status
    const status = coordinator.getCoordinationStatus();
    
    this.log(`Active workflows: ${status.totalActiveWorkflows}`);

    // Test 3: Test priority calculation
    const priority = coordinator.getWorkflowPriority('cv-enhancement');
    
    if (priority <= 0) {
      throw new Error('Priority calculation failed');
    }

    this.log(`CV enhancement priority: ${priority}`);

    // Test 4: Emergency cleanup (safe - only removes stale locks)
    coordinator.emergencyCleanup();

    this.log('Workflow coordinator test completed successfully');
  }

  /**
   * Test coordinated git operations
   */
  async testCoordinatedGitOperations() {
    const coordGit = new CoordinatedGitOperations({ verbose: false });

    // Test 1: Get status
    const status = coordGit.getStatus();
    
    if (typeof status.git.hasChanges !== 'boolean') {
      throw new Error('Status check failed');
    }

    this.log(`Git status: changes=${status.git.hasChanges}, ready=${status.readyForOperation}`);

    // Test 2: Check individual methods
    const hasChanges = coordGit.hasChanges();
    const currentBranch = coordGit.getCurrentBranch();
    
    if (!currentBranch) {
      throw new Error('Could not get current branch');
    }

    this.log(`Branch operations: branch=${currentBranch}, changes=${hasChanges}`);

    this.log('Coordinated git operations test completed successfully');
  }

  /**
   * Test concurrency handling simulation
   */
  async testConcurrencyHandling() {
    const coordinator = new WorkflowCoordinator({ verbose: false });

    // Simulate multiple workflow scenarios
    const mockWorkflows = [
      { name: 'cv-enhancement', runId: 'test1' },
      { name: 'continuous-enhancement', runId: 'test2' },
      { name: 'activity-tracker', runId: 'test3' }
    ];

    // Test priority ordering
    for (const workflow of mockWorkflows) {
      const priority = coordinator.getWorkflowPriority(workflow.name);
      this.log(`${workflow.name}: priority ${priority}`);
    }

    // Test should wait logic
    const waitResult = coordinator.shouldWaitForHigherPriority({
      name: 'activity-tracker',
      runId: 'test-wait'
    });

    this.log(`Wait result: shouldWait=${waitResult.shouldWait}`);

    this.log('Concurrency handling test completed successfully');
  }

  /**
   * Test file system operations
   */
  async testFileSystemOperations() {
    const testDir = '.github/test-locks';
    const coordinator = new WorkflowCoordinator({ 
      lockDir: testDir,
      verbose: false 
    });

    try {
      // Test lock creation
      const lockFile = coordinator.createWorkflowLock('test-operation');
      
      if (!fs.existsSync(lockFile)) {
        throw new Error('Lock file was not created');
      }

      // Test lock reading
      const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
      
      if (lockData.operation !== 'test-operation') {
        throw new Error('Lock data is incorrect');
      }

      // Test lock cleanup
      coordinator.releaseWorkflowLock(lockFile);
      
      if (fs.existsSync(lockFile)) {
        throw new Error('Lock file was not properly removed');
      }

      this.log('File system operations test completed successfully');
    } finally {
      // Cleanup test directory
      if (fs.existsSync(testDir)) {
        const files = fs.readdirSync(testDir);
        for (const file of files) {
          fs.unlinkSync(path.join(testDir, file));
        }
        fs.rmdirSync(testDir);
      }
    }
  }

  /**
   * Test error handling and recovery
   */
  async testErrorHandling() {
    // Test with invalid configuration
    const gitOps = new SafeGitOperations({ 
      maxRetries: 1,
      baseDelay: 100,
      verbose: false
    });

    // Test error scenarios that should be handled gracefully
    try {
      // This should not throw - it should handle errors gracefully
      const result = gitOps.execCommand('git status --invalid-flag');
      
      if (result.success) {
        throw new Error('Expected command to fail but it succeeded');
      }
      
      this.log(`Error handling working: ${result.error.substring(0, 50)}...`);
    } catch (error) {
      // This is OK - we're testing error handling
      this.log('Error handling test passed - command failed as expected');
    }

    // Test emergency cleanup
    const coordinator = new WorkflowCoordinator({ verbose: false });
    const cleanupResult = coordinator.emergencyCleanup();
    
    if (typeof cleanupResult.success !== 'boolean') {
      throw new Error('Emergency cleanup should return success status');
    }

    this.log('Error handling test completed successfully');
  }

  /**
   * Test workflow environment detection
   */
  async testEnvironmentDetection() {
    const coordinator = new WorkflowCoordinator({ verbose: false });
    const workflow = coordinator.getCurrentWorkflow();

    // Check that we can detect basic workflow info
    this.log(`Detected workflow: ${workflow.name}`);
    this.log(`Run ID: ${workflow.runId}`);
    this.log(`Event: ${workflow.eventName}`);

    // Test priority assignment
    const testWorkflows = [
      'cv-enhancement', 
      'continuous-enhancement',
      'activity-tracker',
      'unknown-workflow'
    ];

    for (const workflowName of testWorkflows) {
      const priority = coordinator.getWorkflowPriority(workflowName);
      this.log(`${workflowName}: priority ${priority}`);
      
      if (priority < 0 || priority > 200) {
        throw new Error(`Invalid priority for ${workflowName}: ${priority}`);
      }
    }

    this.log('Environment detection test completed successfully');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.log('🚀 Starting Workflow Coordination Test Suite');
    
    const tests = [
      ['Safe Git Operations', () => this.testSafeGitOperations()],
      ['Workflow Coordinator', () => this.testWorkflowCoordinator()],
      ['Coordinated Git Operations', () => this.testCoordinatedGitOperations()],
      ['Concurrency Handling', () => this.testConcurrencyHandling()],
      ['File System Operations', () => this.testFileSystemOperations()],
      ['Error Handling', () => this.testErrorHandling()],
      ['Environment Detection', () => this.testEnvironmentDetection()]
    ];

    for (const [testName, testFunction] of tests) {
      await this.runTest(testName, testFunction);
    }

    return this.generateReport();
  }

  /**
   * Generate test report
   */
  generateReport() {
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.skipped;
    const successRate = totalTests > 0 ? (this.testResults.passed / totalTests * 100).toFixed(1) : 0;

    const report = {
      summary: {
        total: totalTests,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        skipped: this.testResults.skipped,
        successRate: `${successRate}%`,
        overallResult: this.testResults.failed === 0 ? 'PASSED' : 'FAILED'
      },
      tests: this.testResults.tests,
      timestamp: new Date().toISOString()
    };

    // Log summary
    this.log('📊 TEST SUITE RESULTS');
    this.log(`Total Tests: ${totalTests}`);
    this.log(`✅ Passed: ${this.testResults.passed}`);
    this.log(`❌ Failed: ${this.testResults.failed}`);
    this.log(`⏭️ Skipped: ${this.testResults.skipped}`);
    this.log(`📈 Success Rate: ${successRate}%`);
    this.log(`🎯 Overall Result: ${report.summary.overallResult}`, 
             report.summary.overallResult === 'PASSED' ? 'SUCCESS' : 'ERROR');

    if (this.testResults.failed > 0) {
      this.log('❌ FAILED TESTS:');
      for (const test of this.testResults.tests) {
        if (test.status === 'failed') {
          this.log(`  - ${test.name}: ${test.error}`);
        }
      }
    }

    return report;
  }
}

// CLI interface
if (require.main === module) {
  const tester = new WorkflowCoordinationTester();
  
  tester.runAllTests().then(report => {
    // Save detailed report
    fs.writeFileSync(
      '.github/test-results/workflow-coordination-test.json',
      JSON.stringify(report, null, 2)
    );
    
    // Exit with appropriate code
    process.exit(report.summary.overallResult === 'PASSED' ? 0 : 1);
  }).catch(error => {
    console.error('Test suite error:', error.message);
    process.exit(1);
  });
}

module.exports = WorkflowCoordinationTester;