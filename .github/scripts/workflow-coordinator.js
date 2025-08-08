#!/usr/bin/env node

/**
 * Workflow Coordination Manager
 * 
 * Provides centralized coordination for multiple GitHub Actions workflows
 * to prevent simultaneous git operations and resource conflicts.
 * 
 * Features:
 * - Global workflow lock management
 * - Priority-based workflow scheduling  
 * - Resource conflict detection
 * - Workflow health monitoring
 * - Emergency coordination override
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WorkflowCoordinator {
  constructor(options = {}) {
    this.lockDir = options.lockDir || '.github/workflow-locks';
    this.maxWaitTime = options.maxWaitTime || 1800000; // 30 minutes
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.verbose = options.verbose !== false;
    this.workflowPriorities = {
      'cv-enhancement': 100,           // Highest priority
      'continuous-enhancement': 80,    // High priority
      'activity-tracker': 60,         // Medium priority
      'watch-me-work-refresh': 40,    // Lower priority
      'default': 20                   // Default priority
    };
    
    this.ensureLockDir();
  }

  log(message, level = 'INFO') {
    if (this.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [COORDINATOR] [${level}] ${message}`);
    }
  }

  ensureLockDir() {
    if (!fs.existsSync(this.lockDir)) {
      fs.mkdirSync(this.lockDir, { recursive: true });
      this.log('Created workflow lock directory');
    }
  }

  /**
   * Get current workflow information from environment
   */
  getCurrentWorkflow() {
    return {
      name: process.env.GITHUB_WORKFLOW || 'unknown',
      runId: process.env.GITHUB_RUN_ID || 'unknown',
      runNumber: process.env.GITHUB_RUN_NUMBER || 'unknown',
      actor: process.env.GITHUB_ACTOR || 'unknown',
      ref: process.env.GITHUB_REF || 'unknown',
      eventName: process.env.GITHUB_EVENT_NAME || 'unknown',
      sha: process.env.GITHUB_SHA || 'unknown'
    };
  }

  /**
   * Get priority for a workflow
   */
  getWorkflowPriority(workflowName) {
    const normalizedName = workflowName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    for (const [pattern, priority] of Object.entries(this.workflowPriorities)) {
      if (normalizedName.includes(pattern)) {
        return priority;
      }
    }
    
    return this.workflowPriorities.default;
  }

  /**
   * Check if a workflow should wait for higher priority workflows
   */
  shouldWaitForHigherPriority(currentWorkflow) {
    const currentPriority = this.getWorkflowPriority(currentWorkflow.name);
    const lockFiles = fs.readdirSync(this.lockDir).filter(f => f.endsWith('.lock'));
    
    for (const lockFile of lockFiles) {
      try {
        const lockPath = path.join(this.lockDir, lockFile);
        const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        
        // Skip our own locks
        if (lockData.runId === currentWorkflow.runId) continue;
        
        // Check if lock is still valid
        const lockAge = Date.now() - lockData.timestamp;
        if (lockAge > this.maxWaitTime) {
          this.log(`Removing stale lock: ${lockFile}`, 'WARN');
          fs.unlinkSync(lockPath);
          continue;
        }
        
        // Check priority
        const lockPriority = this.getWorkflowPriority(lockData.workflow);
        if (lockPriority > currentPriority) {
          return {
            shouldWait: true,
            higherPriorityWorkflow: lockData.workflow,
            lockFile: lockFile,
            estimatedWaitTime: Math.min(this.maxWaitTime - lockAge, this.maxWaitTime)
          };
        }
      } catch (error) {
        this.log(`Error reading lock file ${lockFile}: ${error.message}`, 'WARN');
        // Remove corrupted lock file
        try {
          fs.unlinkSync(path.join(this.lockDir, lockFile));
        } catch (e) {
          this.log(`Could not remove corrupted lock file: ${e.message}`, 'ERROR');
        }
      }
    }
    
    return { shouldWait: false };
  }

  /**
   * Create a workflow coordination lock
   */
  createWorkflowLock(operation = 'workflow-execution') {
    const workflow = this.getCurrentWorkflow();
    const lockFile = path.join(this.lockDir, `${workflow.name}-${workflow.runId}.lock`);
    
    const lockData = {
      workflow: workflow.name,
      runId: workflow.runId,
      runNumber: workflow.runNumber,
      operation: operation,
      priority: this.getWorkflowPriority(workflow.name),
      timestamp: Date.now(),
      actor: workflow.actor,
      ref: workflow.ref,
      eventName: workflow.eventName,
      sha: workflow.sha.substring(0, 7)
    };

    fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
    this.log(`Workflow lock created: ${path.basename(lockFile)}`);
    
    return lockFile;
  }

  /**
   * Wait for higher priority workflows to complete
   */
  async waitForCoordination() {
    const workflow = this.getCurrentWorkflow();
    const startTime = Date.now();
    
    this.log(`Starting workflow coordination for: ${workflow.name} (run ${workflow.runNumber})`);
    
    while (Date.now() - startTime < this.maxWaitTime) {
      const waitResult = this.shouldWaitForHigherPriority(workflow);
      
      if (!waitResult.shouldWait) {
        this.log('Coordination complete - proceeding with workflow execution');
        return { success: true, waited: Date.now() - startTime };
      }
      
      const waitTimeRemaining = waitResult.estimatedWaitTime;
      this.log(
        `Waiting for higher priority workflow: ${waitResult.higherPriorityWorkflow} ` +
        `(${Math.round(waitTimeRemaining / 1000)}s remaining)`
      );
      
      // Wait for check interval before rechecking
      await new Promise(resolve => setTimeout(resolve, this.checkInterval));
    }
    
    this.log(`Coordination timeout after ${Math.round((Date.now() - startTime) / 1000)}s`, 'WARN');
    return { 
      success: false, 
      timeout: true, 
      waited: Date.now() - startTime 
    };
  }

  /**
   * Release workflow lock
   */
  releaseWorkflowLock(lockFile) {
    try {
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
        this.log(`Workflow lock released: ${path.basename(lockFile)}`);
      }
    } catch (error) {
      this.log(`Failed to release workflow lock: ${error.message}`, 'WARN');
    }
  }

  /**
   * Get current workflow coordination status
   */
  getCoordinationStatus() {
    const lockFiles = fs.readdirSync(this.lockDir).filter(f => f.endsWith('.lock'));
    const activeWorkflows = [];
    
    for (const lockFile of lockFiles) {
      try {
        const lockPath = path.join(this.lockDir, lockFile);
        const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        
        // Check if lock is still valid
        const lockAge = Date.now() - lockData.timestamp;
        if (lockAge > this.maxWaitTime) {
          fs.unlinkSync(lockPath);
          continue;
        }
        
        activeWorkflows.push({
          ...lockData,
          lockAge: lockAge,
          file: lockFile
        });
      } catch (error) {
        this.log(`Error reading lock file ${lockFile}: ${error.message}`, 'WARN');
      }
    }
    
    // Sort by priority
    activeWorkflows.sort((a, b) => b.priority - a.priority);
    
    return {
      totalActiveWorkflows: activeWorkflows.length,
      activeWorkflows: activeWorkflows,
      highestPriority: activeWorkflows[0]?.priority || 0,
      oldestWorkflow: activeWorkflows.reduce((oldest, current) => 
        current.lockAge > (oldest?.lockAge || 0) ? current : oldest, null
      )
    };
  }

  /**
   * Emergency cleanup - remove all locks and force coordination reset
   */
  emergencyCleanup() {
    this.log('Performing emergency workflow coordination cleanup', 'WARN');
    
    try {
      const lockFiles = fs.readdirSync(this.lockDir).filter(f => f.endsWith('.lock'));
      
      for (const lockFile of lockFiles) {
        const lockPath = path.join(this.lockDir, lockFile);
        fs.unlinkSync(lockPath);
        this.log(`Removed lock file: ${lockFile}`);
      }
      
      this.log(`Emergency cleanup completed - removed ${lockFiles.length} lock files`);
      return { success: true, removedLocks: lockFiles.length };
    } catch (error) {
      this.log(`Emergency cleanup failed: ${error.message}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  /**
   * Full workflow coordination lifecycle
   */
  async coordinateWorkflow(operation = 'workflow-execution') {
    let lockFile;
    
    try {
      // Wait for coordination
      const waitResult = await this.waitForCoordination();
      
      if (!waitResult.success) {
        if (waitResult.timeout) {
          this.log('Proceeding after coordination timeout - may cause conflicts', 'WARN');
        } else {
          throw new Error('Workflow coordination failed');
        }
      }
      
      // Create our lock
      lockFile = this.createWorkflowLock(operation);
      
      return {
        success: true,
        lockFile: lockFile,
        waitedMs: waitResult.waited,
        coordinationStatus: this.getCoordinationStatus()
      };
      
    } catch (error) {
      this.log(`Workflow coordination error: ${error.message}`, 'ERROR');
      
      if (lockFile) {
        this.releaseWorkflowLock(lockFile);
      }
      
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const coordinator = new WorkflowCoordinator();
  
  async function runCommand() {
    try {
      switch (command) {
        case 'coordinate':
          const operation = args[1] || 'workflow-execution';
          const result = await coordinator.coordinateWorkflow(operation);
          console.log(JSON.stringify(result, null, 2));
          break;
          
        case 'status':
          const status = coordinator.getCoordinationStatus();
          console.log(JSON.stringify(status, null, 2));
          break;
          
        case 'cleanup':
          const cleanupResult = coordinator.emergencyCleanup();
          console.log(JSON.stringify(cleanupResult, null, 2));
          break;
          
        case 'wait':
          const waitResult = await coordinator.waitForCoordination();
          console.log(JSON.stringify(waitResult, null, 2));
          process.exit(waitResult.success ? 0 : 1);
          
        default:
          console.error('Usage: workflow-coordinator.js <command> [args...]');
          console.error('Commands: coordinate, status, cleanup, wait');
          process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
  
  runCommand();
}

module.exports = WorkflowCoordinator;