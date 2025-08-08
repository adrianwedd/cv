#!/usr/bin/env node

/**
 * Coordinated Git Operations Manager
 * 
 * Combines safe git operations with workflow coordination to prevent
 * conflicts between multiple GitHub Actions workflows.
 * 
 * This is the primary interface for all git operations in CI workflows.
 */

import SafeGitOperations from './safe-git-operations.js';
import WorkflowCoordinator from './workflow-coordinator.js';

class CoordinatedGitOperations {
  constructor(options = {}) {
    this.gitOps = new SafeGitOperations(options);
    this.coordinator = new WorkflowCoordinator(options);
    this.verbose = options.verbose !== false;
  }

  log(message, level = 'INFO') {
    if (this.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [GIT-COORD] [${level}] ${message}`);
    }
  }

  /**
   * Coordinated commit and push with full workflow synchronization
   */
  async coordinatedCommitPush(options = {}) {
    let coordinationResult;
    
    try {
      // Step 1: Coordinate with other workflows
      this.log('Starting coordinated git operation...');
      coordinationResult = await this.coordinator.coordinateWorkflow('git-commit-push');
      
      this.log(`Workflow coordination successful (waited ${coordinationResult.waitedMs}ms)`);
      
      // Step 2: Perform safe git operations
      const gitResult = await this.gitOps.safeCommitAndPush(options);
      
      // Step 3: Release coordination lock
      this.coordinator.releaseWorkflowLock(coordinationResult.lockFile);
      
      return {
        success: true,
        git: gitResult,
        coordination: {
          waitedMs: coordinationResult.waitedMs,
          lockFile: coordinationResult.lockFile
        }
      };
      
    } catch (error) {
      this.log(`Coordinated git operation failed: ${error.message}`, 'ERROR');
      
      // Release lock if we acquired one
      if (coordinationResult?.lockFile) {
        this.coordinator.releaseWorkflowLock(coordinationResult.lockFile);
      }
      
      throw error;
    }
  }

  /**
   * Quick status check without coordination
   */
  hasChanges() {
    return this.gitOps.hasChanges();
  }

  hasStagedChanges() {
    return this.gitOps.hasStagedChanges();
  }

  getCurrentBranch() {
    return this.gitOps.getCurrentBranch();
  }

  /**
   * Emergency operations (bypass coordination)
   */
  async emergencyCommitPush(options = {}) {
    this.log('Performing emergency git operation (bypassing coordination)', 'WARN');
    
    try {
      // Cleanup any stale locks first
      this.coordinator.emergencyCleanup();
      this.gitOps.emergencyCleanup();
      
      // Perform git operation
      return await this.gitOps.safeCommitAndPush(options);
      
    } catch (error) {
      this.log(`Emergency git operation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Get comprehensive status of git and workflow coordination
   */
  getStatus() {
    const gitChanges = this.gitOps.hasChanges();
    const stagedChanges = this.gitOps.hasStagedChanges();
    const currentBranch = this.gitOps.getCurrentBranch();
    const coordinationStatus = this.coordinator.getCoordinationStatus();
    
    return {
      git: {
        hasChanges: gitChanges,
        hasStagedChanges: stagedChanges,
        currentBranch: currentBranch
      },
      coordination: coordinationStatus,
      readyForOperation: gitChanges && coordinationStatus.totalActiveWorkflows <= 1
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const coordGit = new CoordinatedGitOperations();
  
  async function runCommand() {
    try {
      switch (command) {
        case 'commit-push':
          const message = args[1];
          if (!message) {
            console.error('Usage: coordinated-git-operations.js commit-push "commit message"');
            process.exit(1);
          }
          
          const commitOptions = {
            message: message,
            userEmail: args[2] || 'cv-enhancement@adrianwedd.com',
            userName: args[3] || 'adrianwedd(cv-enhancer)',
            addFiles: args[4] ? args[4].split(',') : ['.']
          };
          
          const result = await coordGit.coordinatedCommitPush(commitOptions);
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
          
        case 'emergency-commit-push':
          const emergencyMessage = args[1];
          if (!emergencyMessage) {
            console.error('Usage: coordinated-git-operations.js emergency-commit-push "commit message"');
            process.exit(1);
          }
          
          const emergencyOptions = {
            message: emergencyMessage,
            userEmail: args[2] || 'emergency@adrianwedd.com',
            userName: args[3] || 'adrianwedd(emergency)',
            addFiles: args[4] ? args[4].split(',') : ['.']
          };
          
          const emergencyResult = await coordGit.emergencyCommitPush(emergencyOptions);
          console.log(JSON.stringify(emergencyResult, null, 2));
          process.exit(emergencyResult.success ? 0 : 1);
          
        case 'status':
          const status = coordGit.getStatus();
          console.log(JSON.stringify(status, null, 2));
          break;
          
        case 'has-changes':
          const hasChanges = coordGit.hasChanges();
          console.log(hasChanges ? 'true' : 'false');
          process.exit(hasChanges ? 0 : 1);
          
        default:
          console.error('Usage: coordinated-git-operations.js <command> [args...]');
          console.error('Commands:');
          console.error('  commit-push "message" [email] [name] [files]');
          console.error('  emergency-commit-push "message" [email] [name] [files]');
          console.error('  status');
          console.error('  has-changes');
          process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
  
  runCommand();
}

export default CoordinatedGitOperations;