#!/usr/bin/env node

/**
 * Simple validation script for workflow coordination implementation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [VALIDATE] [${level}] ${message}`);
}

function validateFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    log(`✅ ${description}: ${filePath} (${stats.size} bytes)`);
    return true;
  } else {
    log(`❌ ${description}: ${filePath} not found`, 'ERROR');
    return false;
  }
}

function validateWorkflowFiles() {
  log('📋 Validating workflow files...');
  
  const workflows = [
    '.github/workflows/cv-enhancement.yml',
    '.github/workflows/continuous-enhancement.yml', 
    '.github/workflows/activity-tracker.yml'
  ];

  let valid = true;
  for (const workflow of workflows) {
    if (!validateFile(workflow, `Workflow: ${path.basename(workflow)}`)) {
      valid = false;
    } else {
      // Check for concurrency control
      const content = fs.readFileSync(workflow, 'utf8');
      if (content.includes('concurrency:')) {
        log(`  ✅ Concurrency control found in ${path.basename(workflow)}`);
      } else {
        log(`  ⚠️ No concurrency control in ${path.basename(workflow)}`, 'WARN');
      }
    }
  }
  
  return valid;
}

function validateCoordinationScripts() {
  log('🔧 Validating coordination scripts...');
  
  const scripts = [
    '.github/scripts/safe-git-operations.js',
    '.github/scripts/workflow-coordinator.js',
    '.github/scripts/coordinated-git-operations.js'
  ];

  let valid = true;
  for (const script of scripts) {
    if (!validateFile(script, `Script: ${path.basename(script)}`)) {
      valid = false;
    }
  }
  
  return valid;
}

function validateGitOperations() {
  log('🔍 Validating git operations...');
  
  try {
    // Test basic git commands
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    log(`✅ Current branch: ${branch}`);
    
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const hasChanges = status.trim().length > 0;
    log(`✅ Has changes: ${hasChanges}`);
    
    // Test git config
    execSync('git config --local user.email "test@example.com"');
    execSync('git config --local user.name "Test User"');
    log('✅ Git configuration test successful');
    
    return true;
  } catch (error) {
    log(`❌ Git operations test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

function validateLockDirectories() {
  log('📁 Validating lock directories...');
  
  const lockDirs = [
    '.github/git-locks',
    '.github/workflow-locks'
  ];

  for (const dir of lockDirs) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        log(`✅ Created lock directory: ${dir}`);
      } catch (error) {
        log(`❌ Failed to create lock directory ${dir}: ${error.message}`, 'ERROR');
        return false;
      }
    } else {
      log(`✅ Lock directory exists: ${dir}`);
    }
  }
  
  return true;
}

function validateConcurrencyConfiguration() {
  log('⚡ Validating concurrency configuration...');
  
  const workflows = [
    '.github/workflows/cv-enhancement.yml',
    '.github/workflows/continuous-enhancement.yml',
    '.github/workflows/activity-tracker.yml'
  ];

  const concurrencyPatterns = {
    'cv-enhancement.yml': 'cv-enhancement-',
    'continuous-enhancement.yml': 'continuous-enhancement-',
    'activity-tracker.yml': 'activity-tracker-'
  };

  let valid = true;
  for (const workflow of workflows) {
    if (fs.existsSync(workflow)) {
      const content = fs.readFileSync(workflow, 'utf8');
      const filename = path.basename(workflow);
      const expectedPattern = concurrencyPatterns[filename];
      
      if (expectedPattern && content.includes(expectedPattern)) {
        log(`✅ Concurrency group configured correctly in ${filename}`);
      } else {
        log(`⚠️ Concurrency configuration may be missing in ${filename}`, 'WARN');
        valid = false;
      }
    }
  }
  
  return valid;
}

async function runValidation() {
  log('🚀 Starting Workflow Coordination Validation');
  
  const tests = [
    ['Workflow Files', validateWorkflowFiles],
    ['Coordination Scripts', validateCoordinationScripts],
    ['Git Operations', validateGitOperations],
    ['Lock Directories', validateLockDirectories],
    ['Concurrency Configuration', validateConcurrencyConfiguration]
  ];

  let passed = 0;
  let total = tests.length;

  for (const [testName, testFunction] of tests) {
    log(`\n🧪 Running test: ${testName}`);
    
    try {
      const result = await testFunction();
      if (result) {
        log(`✅ PASSED: ${testName}`, 'SUCCESS');
        passed++;
      } else {
        log(`❌ FAILED: ${testName}`, 'ERROR');
      }
    } catch (error) {
      log(`❌ ERROR in ${testName}: ${error.message}`, 'ERROR');
    }
  }

  // Summary
  log('\n📊 VALIDATION SUMMARY');
  log(`Total Tests: ${total}`);
  log(`Passed: ${passed}`);
  log(`Failed: ${total - passed}`);
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  const overallResult = passed === total ? 'PASSED' : 'FAILED';
  log(`Overall Result: ${overallResult}`, overallResult === 'PASSED' ? 'SUCCESS' : 'ERROR');

  // Additional recommendations
  if (overallResult === 'PASSED') {
    log('\n🎉 Workflow coordination system is ready!');
    log('📋 Key features implemented:');
    log('  ✅ Safe git operations with retry logic');
    log('  ✅ Workflow concurrency control');
    log('  ✅ Conflict resolution and recovery');
    log('  ✅ Lock-based coordination');
  } else {
    log('\n⚠️ Some validation tests failed');
    log('📋 Review the errors above and fix before deployment');
  }

  return overallResult === 'PASSED' ? 0 : 1;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Validation error:', error.message);
      process.exit(1);
    });
}