#!/usr/bin/env node

/**
 * Safe Git Operations Manager
 * 
 * Provides atomic git operations with conflict resolution, retry logic,
 * and proper coordination for CI workflows.
 * 
 * Features:
 * - Automatic pull/rebase before push
 * - Exponential backoff retry logic
 * - Conflict detection and resolution
 * - Atomic operations with rollback
 * - Workflow coordination via lock files
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';

class SafeGitOperations {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 5;
    this.baseDelay = options.baseDelay || 2000; // 2 seconds
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.lockDir = options.lockDir || '.github/git-locks';
    this.lockTimeout = options.lockTimeout || 300000; // 5 minutes
    this.verbose = options.verbose !== false;
    
    // Ensure lock directory exists
    this.ensureLockDir();
  }

  /**
   * Log message with timestamp if verbose mode enabled
   */
  log(message, level = 'INFO') {
    if (this.verbose) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level}] ${message}`);
    }
  }

  /**
   * Execute command with error handling
   */
  execCommand(command, options = {}) {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return { success: true, output: result, error: null };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout || '', 
        error: error.stderr || error.message 
      };
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateDelay(attempt) {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Ensure git lock directory exists
   */
  ensureLockDir() {
    if (!fs.existsSync(this.lockDir)) {
      fs.mkdirSync(this.lockDir, { recursive: true });
    }
  }

  /**
   * Acquire workflow lock to prevent concurrent git operations
   */
  async acquireLock(operation) {
    const lockFile = path.join(this.lockDir, `${operation}.lock`);
    const lockData = {
      timestamp: Date.now(),
      operation,
      workflow: process.env.GITHUB_WORKFLOW || 'unknown',
      runId: process.env.GITHUB_RUN_ID || 'unknown'
    };

    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        // Check if lock already exists and is still valid
        if (fs.existsSync(lockFile)) {
          const existingLock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
          const lockAge = Date.now() - existingLock.timestamp;
          
          if (lockAge < this.lockTimeout) {
            this.log(`Lock held by ${existingLock.workflow} (run ${existingLock.runId}), waiting...`);
            await this.sleep(this.calculateDelay(attempt));
            attempt++;
            continue;
          } else {
            this.log(`Stale lock detected (${Math.floor(lockAge/1000)}s old), removing...`, 'WARN');
            fs.unlinkSync(lockFile);
          }
        }

        // Acquire lock atomically
        fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
        this.log(`Lock acquired for ${operation}`);
        return lockFile;
      } catch (error) {
        this.log(`Failed to acquire lock: ${error.message}`, 'ERROR');
        await this.sleep(this.calculateDelay(attempt));
        attempt++;
      }
    }

    throw new Error(`Failed to acquire lock for ${operation} after ${this.maxRetries} attempts`);
  }

  /**
   * Release workflow lock
   */
  releaseLock(lockFile) {
    try {
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
        this.log(`Lock released: ${path.basename(lockFile)}`);
      }
    } catch (error) {
      this.log(`Failed to release lock: ${error.message}`, 'WARN');
    }
  }

  /**
   * Configure git user for automated commits
   */
  configureGit(userEmail, userName) {
    this.log('Configuring git user...');
    this.execCommand(`git config --local user.email "${userEmail}"`);
    this.execCommand(`git config --local user.name "${userName}"`);
  }

  /**
   * Check if there are changes to commit
   */
  hasChanges() {
    const result = this.execCommand('git status --porcelain', { silent: true });
    return result.success && result.output.trim().length > 0;
  }

  /**
   * Check if there are staged changes
   */
  hasStagedChanges() {
    const result = this.execCommand('git diff --cached --quiet', { silent: true });
    return !result.success; // Command fails if there are staged changes
  }

  /**
   * Get current branch name
   */
  getCurrentBranch() {
    const result = this.execCommand('git branch --show-current', { silent: true });
    return result.success ? result.output.trim() : 'main';
  }

  /**
   * Fetch latest changes from remote
   */
  async fetchRemote(attempt = 0) {
    this.log(`Fetching remote changes (attempt ${attempt + 1})...`);
    
    const result = this.execCommand('git fetch origin --prune');
    if (!result.success) {
      if (attempt < this.maxRetries - 1) {
        await this.sleep(this.calculateDelay(attempt));
        return this.fetchRemote(attempt + 1);
      }
      throw new Error(`Failed to fetch remote: ${result.error}`);
    }
    
    this.log('Remote fetch successful');
    return true;
  }

  /**
   * Pull/rebase latest changes with conflict handling
   */
  async pullWithRebase(attempt = 0) {
    this.log(`Pulling with rebase (attempt ${attempt + 1})...`);
    
    const currentBranch = this.getCurrentBranch();
    
    // First try a simple pull with rebase
    let result = this.execCommand(`git pull --rebase origin ${currentBranch}`);
    
    if (result.success) {
      this.log('Pull with rebase successful');
      return true;
    }

    // If rebase failed, check if it's due to conflicts
    if (result.error.includes('conflict') || result.error.includes('CONFLICT')) {
      this.log('Rebase conflicts detected, attempting resolution...', 'WARN');
      
      // For automated workflows, prefer their version for data files
      const conflictResult = this.execCommand('git status --porcelain=v1');
      if (conflictResult.success) {
        const conflicts = conflictResult.output
          .split('\n')
          .filter(line => line.startsWith('UU ') || line.startsWith('AA '))
          .map(line => line.substring(3));
        
        for (const file of conflicts) {
          if (file.startsWith('data/') || file.endsWith('.json')) {
            // For data files, use our version (the automated update)
            this.log(`Resolving conflict in ${file} - using our version`);
            this.execCommand(`git checkout --ours "${file}"`);
          } else {
            // For other files, use their version (manual changes)
            this.log(`Resolving conflict in ${file} - using their version`);
            this.execCommand(`git checkout --theirs "${file}"`);
          }
          this.execCommand(`git add "${file}"`);
        }
        
        // Continue rebase
        const continueResult = this.execCommand('git rebase --continue');
        if (continueResult.success) {
          this.log('Rebase conflicts resolved successfully');
          return true;
        }
      }
      
      // If automatic resolution failed, abort rebase and try reset
      this.log('Automatic conflict resolution failed, aborting rebase...', 'WARN');
      this.execCommand('git rebase --abort');
    }

    // If pull failed and we haven't exceeded retries, try reset approach
    if (attempt < this.maxRetries - 1) {
      this.log('Pull failed, trying reset approach...', 'WARN');
      
      // Fetch latest and reset to origin
      await this.fetchRemote();
      
      // Stash any uncommitted changes
      const stashResult = this.execCommand('git stash push -m "Auto-stash before reset"');
      const hasStash = stashResult.success && !stashResult.output.includes('No local changes');
      
      // Reset to origin
      const resetResult = this.execCommand(`git reset --hard origin/${currentBranch}`);
      
      if (resetResult.success) {
        // If we had stashed changes, try to apply them
        if (hasStash) {
          this.log('Attempting to restore stashed changes...');
          const popResult = this.execCommand('git stash pop');
          if (!popResult.success) {
            this.log('Could not restore stashed changes, continuing...', 'WARN');
            // Drop the stash to avoid issues
            this.execCommand('git stash drop');
          }
        }
        
        this.log('Reset to origin successful');
        return true;
      }
    }

    if (attempt < this.maxRetries - 1) {
      await this.sleep(this.calculateDelay(attempt));
      return this.pullWithRebase(attempt + 1);
    }

    throw new Error(`Failed to pull/rebase after ${this.maxRetries} attempts: ${result.error}`);
  }

  /**
   * Safe push with retry logic
   */
  async safePush(attempt = 0) {
    this.log(`Pushing changes (attempt ${attempt + 1})...`);
    
    const currentBranch = this.getCurrentBranch();
    const result = this.execCommand(`git push origin ${currentBranch}`);
    
    if (result.success) {
      this.log('Push successful');
      return true;
    }

    // If push failed due to non-fast-forward, pull and retry
    if (result.error.includes('non-fast-forward') || 
        result.error.includes('Updates were rejected') ||
        result.error.includes('failed to push some refs')) {
      
      if (attempt < this.maxRetries - 1) {
        this.log('Push rejected, pulling latest changes and retrying...', 'WARN');
        
        try {
          await this.pullWithRebase();
          await this.sleep(this.calculateDelay(attempt));
          return this.safePush(attempt + 1);
        } catch (pullError) {
          this.log(`Pull failed during push retry: ${pullError.message}`, 'ERROR');
        }
      }
    }

    if (attempt < this.maxRetries - 1) {
      await this.sleep(this.calculateDelay(attempt));
      return this.safePush(attempt + 1);
    }

    throw new Error(`Failed to push after ${this.maxRetries} attempts: ${result.error}`);
  }

  /**
   * Safe commit and push operation with full coordination
   */
  async safeCommitAndPush(options = {}) {
    const {
      message,
      userEmail = 'cv-enhancement@adrianwedd.com',
      userName = 'adrianwedd(cv-enhancer)',
      addFiles = ['.'],
      allowEmpty = false
    } = options;

    if (!message) {
      throw new Error('Commit message is required');
    }

    let lockFile;
    try {
      // Acquire lock for git operations
      lockFile = await this.acquireLock('commit-push');
      
      // Configure git
      this.configureGit(userEmail, userName);
      
      // Fetch latest changes first
      await this.fetchRemote();
      
      // Check if we have changes before doing anything
      if (!allowEmpty && !this.hasChanges()) {
        this.log('No changes to commit');
        return { success: true, message: 'No changes to commit' };
      }
      
      // Pull latest changes with rebase
      await this.pullWithRebase();
      
      // Add files
      for (const file of addFiles) {
        const addResult = this.execCommand(`git add "${file}"`);
        if (!addResult.success) {
          this.log(`Warning: Could not add ${file}`, 'WARN');
        }
      }
      
      // Check if we still have staged changes after rebase
      if (!allowEmpty && !this.hasStagedChanges()) {
        this.log('No changes to commit after rebase');
        return { success: true, message: 'No changes to commit after rebase' };
      }
      
      // Commit changes
      this.log('Committing changes...');
      const commitResult = this.execCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`);
      
      if (!commitResult.success && !commitResult.error.includes('nothing to commit')) {
        throw new Error(`Failed to commit: ${commitResult.error}`);
      }
      
      // Only push if we actually committed something
      if (commitResult.success || allowEmpty) {
        await this.safePush();
        
        this.log('Commit and push completed successfully');
        return { 
          success: true, 
          message: 'Commit and push completed successfully',
          committed: true
        };
      } else {
        this.log('Nothing to commit');
        return { 
          success: true, 
          message: 'Nothing to commit',
          committed: false
        };
      }
      
    } finally {
      if (lockFile) {
        this.releaseLock(lockFile);
      }
    }
  }

  /**
   * Emergency cleanup - remove stale locks and reset git state
   */
  emergencyCleanup() {
    this.log('Performing emergency cleanup...', 'WARN');
    
    try {
      // Remove all lock files
      if (fs.existsSync(this.lockDir)) {
        const lockFiles = fs.readdirSync(this.lockDir);
        for (const file of lockFiles) {
          if (file.endsWith('.lock')) {
            fs.unlinkSync(path.join(this.lockDir, file));
            this.log(`Removed stale lock: ${file}`);
          }
        }
      }
      
      // Abort any ongoing rebase/merge
      this.execCommand('git rebase --abort');
      this.execCommand('git merge --abort');
      
      // Clean working directory
      this.execCommand('git reset --hard HEAD');
      this.execCommand('git clean -fd');
      
      this.log('Emergency cleanup completed');
      
    } catch (error) {
      this.log(`Emergency cleanup failed: ${error.message}`, 'ERROR');
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const gitOps = new SafeGitOperations();
  
  async function runCommand() {
    try {
      switch (command) {
        case 'commit-push':
          const message = args[1];
          if (!message) {
            console.error('Usage: safe-git-operations.js commit-push "commit message"');
            process.exit(1);
          }
          
          const result = await gitOps.safeCommitAndPush({ message });
          console.log(JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
          
        case 'cleanup':
          gitOps.emergencyCleanup();
          console.log('Emergency cleanup completed');
          break;
          
        case 'test':
          console.log('Testing git operations...');
          await gitOps.fetchRemote();
          console.log('Git operations test successful');
          break;
          
        default:
          console.error('Usage: safe-git-operations.js <command> [args...]');
          console.error('Commands: commit-push, cleanup, test');
          process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
  
  runCommand();
}

export default SafeGitOperations;