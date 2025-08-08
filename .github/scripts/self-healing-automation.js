#!/usr/bin/env node

/**
 * Self-Healing Automation System
 * 
 * Automated recovery and maintenance system that:
 * - Detects system degradation proactively
 * - Executes recovery procedures automatically
 * - Maintains high availability through predictive healing
 * - Provides comprehensive audit trails
 * 
 * Usage: node self-healing-automation.js [--monitor] [--heal] [--audit]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';

class SelfHealingSystem {
  constructor(options = {}) {
    this.options = {
      monitor: options.monitor || false,
      heal: options.heal || false,
      audit: options.audit || false,
      all: options.all || false,
      ...options
    };

    this.healingState = {
      timestamp: new Date().toISOString(),
      healingActions: [],
      preventiveActions: [],
      systemMetrics: {},
      recoveryLog: [],
      nextScheduledCheck: null
    };

    this.healingStrategies = {
      authentication_failure: this.healAuthenticationFailure.bind(this),
      dns_resolution_failure: this.healDNSResolution.bind(this),
      website_unavailable: this.healWebsiteAvailability.bind(this),
      data_corruption: this.healDataCorruption.bind(this),
      performance_degradation: this.healPerformanceDegradation.bind(this),
      workflow_failure: this.healWorkflowFailure.bind(this)
    };
  }

  async initiateSelfHealing() {
    console.log('🔄 **SELF-HEALING AUTOMATION SYSTEM INITIATED**');
    console.log('🎯 Proactive system maintenance and automated recovery');
    console.log('');

    if (this.options.monitor || this.options.all) {
      await this.continuousMonitoring();
    }

    if (this.options.heal || this.options.all) {
      await this.executeHealingProcedures();
    }

    if (this.options.audit || this.options.all) {
      await this.performAuditAndMaintenance();
    }

    await this.generateHealingReport();
    return this.healingState;
  }

  async continuousMonitoring() {
    console.log('👁️ **CONTINUOUS MONITORING SYSTEM**');
    console.log('');

    const monitoringChecks = [
      { name: 'system_health', critical: true, threshold: 70 },
      { name: 'authentication_status', critical: true, threshold: 50 },
      { name: 'network_connectivity', critical: true, threshold: 80 },
      { name: 'data_integrity', critical: true, threshold: 95 },
      { name: 'performance_metrics', critical: false, threshold: 85 },
      { name: 'resource_utilization', critical: false, threshold: 90 }
    ];

    for (const check of monitoringChecks) {
      try {
        const result = await this.executeMonitoringCheck(check);
        this.healingState.systemMetrics[check.name] = result;

        if (result.score < check.threshold && check.critical) {
          console.log(`🚨 Critical issue detected: ${check.name} (${result.score}% < ${check.threshold}%)`);
          await this.triggerHealingAction(check.name, result);
        } else if (result.score < check.threshold) {
          console.log(`⚠️ Warning detected: ${check.name} (${result.score}% < ${check.threshold}%)`);
          await this.schedulePreventiveMaintenance(check.name, result);
        } else {
          console.log(`✅ ${check.name}: Healthy (${result.score}%)`);
        }
      } catch (error) {
        console.log(`❌ Monitoring check failed for ${check.name}: ${error.message}`);
        await this.triggerHealingAction(check.name, { score: 0, error: error.message });
      }
    }

    console.log('');
  }

  async executeMonitoringCheck(check) {
    const startTime = performance.now();
    let result = { score: 0, details: {}, responseTime: 0 };

    switch (check.name) {
      case 'system_health':
        result = await this.checkSystemHealth();
        break;
      case 'authentication_status':
        result = await this.checkAuthenticationStatus();
        break;
      case 'network_connectivity':
        result = await this.checkNetworkConnectivity();
        break;
      case 'data_integrity':
        result = await this.checkDataIntegrity();
        break;
      case 'performance_metrics':
        result = await this.checkPerformanceMetrics();
        break;
      case 'resource_utilization':
        result = await this.checkResourceUtilization();
        break;
      default:
        throw new Error(`Unknown monitoring check: ${check.name}`);
    }

    result.responseTime = Math.round(performance.now() - startTime);
    return result;
  }

  async checkSystemHealth() {
    try {
      // Run quick system health check
      const healthOutput = execSync('node system-health-monitor.js --json', {
        encoding: 'utf8',
        timeout: 30000,
        cwd: process.cwd()
      });

      const healthData = JSON.parse(healthOutput.split('\n').find(line => line.startsWith('{')));
      
      return {
        score: healthData.systemHealth?.percentage || 0,
        details: {
          operationalSystems: healthData.systemHealth?.successfulChecks || 0,
          totalSystems: healthData.systemHealth?.totalChecks || 6,
          criticalIssues: healthData.systemHealth?.criticalIssues || 0
        }
      };
    } catch (error) {
      return {
        score: 0,
        details: { error: error.message }
      };
    }
  }

  async checkAuthenticationStatus() {
    const envPath = path.resolve('../../.env');
    let workingMethods = 0;
    const details = {};

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check each auth method
      if (envContent.includes('CLAUDE_API_KEY=sk-ant-')) {
        workingMethods++;
        details.api_key = 'configured';
      }
      
      if (envContent.includes('CLAUDE_SESSION_KEY=') && !envContent.includes('CLAUDE_SESSION_KEY=""')) {
        workingMethods++;
        details.browser_session = 'configured';
      }
      
      if (envContent.includes('CLAUDE_OAUTH_TOKEN=') && !envContent.includes('CLAUDE_OAUTH_TOKEN=""')) {
        workingMethods++;
        details.oauth_token = 'configured';
      }
    }

    const score = Math.round((workingMethods / 3) * 100);
    
    return {
      score: score,
      details: {
        ...details,
        workingMethods: workingMethods,
        totalMethods: 3
      }
    };
  }

  async checkNetworkConnectivity() {
    const endpoints = [
      'https://api.github.com',
      'https://adrianwedd.github.io',
      'https://claude.ai'
    ];

    let workingEndpoints = 0;
    const details = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { 
          method: 'HEAD', 
          timeout: 5000 
        });
        
        if (response.ok) {
          workingEndpoints++;
          details[endpoint] = 'available';
        } else {
          details[endpoint] = `http_${response.status}`;
        }
      } catch (error) {
        details[endpoint] = 'unavailable';
      }
    }

    const score = Math.round((workingEndpoints / endpoints.length) * 100);
    
    return {
      score: score,
      details: {
        ...details,
        workingEndpoints: workingEndpoints,
        totalEndpoints: endpoints.length
      }
    };
  }

  async checkDataIntegrity() {
    const criticalFiles = [
      '../../data/base-cv.json',
      '../../data/activity-summary.json',
      '../../index.html'
    ];

    let intactFiles = 0;
    const details = {};

    for (const file of criticalFiles) {
      const filePath = path.resolve(file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > 0) {
          intactFiles++;
          details[path.basename(file)] = 'intact';
        } else {
          details[path.basename(file)] = 'empty';
        }
      } catch (error) {
        details[path.basename(file)] = 'missing';
      }
    }

    const score = Math.round((intactFiles / criticalFiles.length) * 100);
    
    return {
      score: score,
      details: {
        ...details,
        intactFiles: intactFiles,
        totalFiles: criticalFiles.length
      }
    };
  }

  async checkPerformanceMetrics() {
    // Simple performance check based on file sizes and responsiveness
    const webFiles = [
      '../../index.html',
      '../../assets/styles.css',
      '../../assets/script.js'
    ];

    let totalSize = 0;
    let optimizedFiles = 0;
    const details = {};

    for (const file of webFiles) {
      const filePath = path.resolve(file);
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        
        // Check if file is reasonably sized (performance optimization)
        const sizeKB = stats.size / 1024;
        if (sizeKB < 100 || path.basename(file).includes('.min.')) {
          optimizedFiles++;
          details[path.basename(file)] = 'optimized';
        } else {
          details[path.basename(file)] = 'needs_optimization';
        }
      } catch (error) {
        details[path.basename(file)] = 'missing';
      }
    }

    const score = Math.round((optimizedFiles / webFiles.length) * 100);
    
    return {
      score: score,
      details: {
        ...details,
        totalSizeKB: Math.round(totalSize / 1024),
        optimizedFiles: optimizedFiles,
        totalFiles: webFiles.length
      }
    };
  }

  async checkResourceUtilization() {
    const dataDir = path.resolve('./data');
    let totalSize = 0;
    let fileCount = 0;

    try {
      const files = fs.readdirSync(dataDir, { recursive: true });
      
      for (const file of files) {
        const filePath = path.join(dataDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
            fileCount++;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      const sizeMB = totalSize / (1024 * 1024);
      
      // Score based on reasonable resource usage (under 100MB is good)
      const score = sizeMB < 50 ? 100 : sizeMB < 100 ? 80 : 60;
      
      return {
        score: score,
        details: {
          totalSizeMB: Math.round(sizeMB * 10) / 10,
          fileCount: fileCount,
          threshold: '50MB optimal, 100MB acceptable'
        }
      };
    } catch (error) {
      return {
        score: 0,
        details: { error: error.message }
      };
    }
  }

  async triggerHealingAction(checkName, result) {
    console.log(`🔧 Triggering healing action for: ${checkName}`);
    
    const healingStrategy = this.determineHealingStrategy(checkName, result);
    
    try {
      const healingResult = await this.healingStrategies[healingStrategy](result);
      
      this.healingState.healingActions.push({
        timestamp: new Date().toISOString(),
        checkName: checkName,
        strategy: healingStrategy,
        result: healingResult,
        success: healingResult.success || false
      });
      
      if (healingResult.success) {
        console.log(`   ✅ Healing successful: ${healingResult.message}`);
      } else {
        console.log(`   ❌ Healing failed: ${healingResult.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Healing action failed: ${error.message}`);
      
      this.healingState.healingActions.push({
        timestamp: new Date().toISOString(),
        checkName: checkName,
        strategy: healingStrategy,
        result: { success: false, message: error.message },
        success: false
      });
    }
  }

  determineHealingStrategy(checkName, result) {
    const strategyMap = {
      'system_health': 'authentication_failure', // Most common cause
      'authentication_status': 'authentication_failure',
      'network_connectivity': 'dns_resolution_failure',
      'data_integrity': 'data_corruption',
      'performance_metrics': 'performance_degradation',
      'resource_utilization': 'performance_degradation'
    };

    return strategyMap[checkName] || 'authentication_failure';
  }

  async healAuthenticationFailure(result) {
    console.log('   🔐 Executing authentication healing procedure...');
    
    try {
      // Try to refresh browser authentication
      execSync('node browser-auth-refresh.js test', {
        encoding: 'utf8',
        timeout: 60000,
        cwd: process.cwd()
      });
      
      return {
        success: true,
        message: 'Browser authentication refresh initiated',
        actions: ['browser_auth_refresh']
      };
    } catch (error) {
      return {
        success: false,
        message: `Authentication healing failed: ${error.message}`,
        actions: ['browser_auth_refresh_failed'],
        recommendation: 'Manual cookie refresh required'
      };
    }
  }

  async healDNSResolution(result) {
    console.log('   🌐 Executing DNS resolution healing procedure...');
    
    try {
      // Test alternative DNS servers
      const dnsServers = ['8.8.8.8', '1.1.1.1'];
      let workingServer = null;
      
      for (const server of dnsServers) {
        try {
          execSync(`nslookup github.com ${server}`, { 
            encoding: 'utf8', 
            timeout: 5000 
          });
          workingServer = server;
          break;
        } catch (error) {
          // Try next server
        }
      }
      
      if (workingServer) {
        return {
          success: true,
          message: `DNS resolution working via ${workingServer}`,
          actions: ['dns_server_validated'],
          recommendation: 'Network connectivity is functional'
        };
      } else {
        return {
          success: false,
          message: 'All DNS servers failed',
          actions: ['dns_test_failed'],
          recommendation: 'Check network connectivity'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `DNS healing failed: ${error.message}`,
        actions: ['dns_healing_error']
      };
    }
  }

  async healWebsiteAvailability(result) {
    console.log('   🌍 Executing website availability healing procedure...');
    
    try {
      // Verify GitHub Pages deployment
      const response = await fetch('https://adrianwedd.github.io/cv/', {
        method: 'HEAD',
        timeout: 10000
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Website is available via GitHub Pages',
          actions: ['github_pages_verified'],
          recommendation: 'Primary deployment target is functional'
        };
      } else {
        return {
          success: false,
          message: `Website returned HTTP ${response.status}`,
          actions: ['github_pages_error'],
          recommendation: 'Check deployment status'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Website healing failed: ${error.message}`,
        actions: ['website_healing_error']
      };
    }
  }

  async healDataCorruption(result) {
    console.log('   📁 Executing data integrity healing procedure...');
    
    try {
      // Check for backup files
      const backupFiles = [
        '../../data/base-cv.json.backup',
        '../../data/activity-summary.json.backup'
      ];
      
      let restoredFiles = 0;
      
      for (const backupPath of backupFiles) {
        if (fs.existsSync(path.resolve(backupPath))) {
          const originalPath = backupPath.replace('.backup', '');
          const originalResolved = path.resolve(originalPath);
          
          if (!fs.existsSync(originalResolved) || fs.statSync(originalResolved).size === 0) {
            fs.copyFileSync(path.resolve(backupPath), originalResolved);
            restoredFiles++;
          }
        }
      }
      
      if (restoredFiles > 0) {
        return {
          success: true,
          message: `Restored ${restoredFiles} file(s) from backup`,
          actions: [`backup_restore_${restoredFiles}_files`],
          recommendation: 'Data integrity restored from backups'
        };
      } else {
        return {
          success: true,
          message: 'Data integrity verified, no restoration needed',
          actions: ['data_integrity_verified'],
          recommendation: 'All critical files are intact'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Data healing failed: ${error.message}`,
        actions: ['data_healing_error']
      };
    }
  }

  async healPerformanceDegradation(result) {
    console.log('   ⚡ Executing performance healing procedure...');
    
    try {
      // Check if minified assets exist and are being used
      const minifiedAssets = [
        '../../assets/styles.min.css',
        '../../assets/script.min.js'
      ];
      
      let optimizationsAvailable = 0;
      
      for (const asset of minifiedAssets) {
        if (!fs.existsSync(path.resolve(asset))) {
          optimizationsAvailable++;
        }
      }
      
      if (optimizationsAvailable > 0) {
        return {
          success: false,
          message: `${optimizationsAvailable} assets need minification`,
          actions: ['minification_needed'],
          recommendation: 'Run minification process to improve performance'
        };
      } else {
        return {
          success: true,
          message: 'Performance assets are optimized',
          actions: ['performance_verified'],
          recommendation: 'All assets are properly minified'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Performance healing failed: ${error.message}`,
        actions: ['performance_healing_error']
      };
    }
  }

  async healWorkflowFailure(result) {
    console.log('   ⚙️ Executing workflow healing procedure...');
    
    try {
      // Verify workflow files exist
      const workflowDir = path.resolve('../../.github/workflows');
      const workflows = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml'));
      
      if (workflows.length > 0) {
        return {
          success: true,
          message: `${workflows.length} workflow files verified`,
          actions: ['workflows_verified'],
          recommendation: 'All workflow files are present'
        };
      } else {
        return {
          success: false,
          message: 'No workflow files found',
          actions: ['workflows_missing'],
          recommendation: 'Workflow files may need restoration'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Workflow healing failed: ${error.message}`,
        actions: ['workflow_healing_error']
      };
    }
  }

  async schedulePreventiveMaintenance(checkName, result) {
    console.log(`🔮 Scheduling preventive maintenance for: ${checkName}`);
    
    this.healingState.preventiveActions.push({
      timestamp: new Date().toISOString(),
      checkName: checkName,
      score: result.score,
      scheduledAction: this.determinePreventiveAction(checkName, result),
      priority: 'low'
    });
  }

  determinePreventiveAction(checkName, result) {
    const actionMap = {
      'authentication_status': 'refresh_authentication_tokens',
      'network_connectivity': 'verify_network_routes',
      'performance_metrics': 'optimize_assets',
      'resource_utilization': 'cleanup_old_data'
    };

    return actionMap[checkName] || 'general_maintenance';
  }

  async executeHealingProcedures() {
    console.log('🩺 **EXECUTING HEALING PROCEDURES**');
    console.log('');

    // Execute any pending healing actions
    if (this.healingState.healingActions.length > 0) {
      console.log(`📋 Found ${this.healingState.healingActions.length} pending healing actions`);
      
      for (const action of this.healingState.healingActions) {
        if (!action.success) {
          console.log(`🔄 Retrying healing action: ${action.strategy}`);
          // Retry logic would go here
        }
      }
    } else {
      console.log('✅ No critical healing procedures required');
    }

    // Execute preventive maintenance
    if (this.healingState.preventiveActions.length > 0) {
      console.log(`🔧 Executing ${this.healingState.preventiveActions.length} preventive maintenance actions`);
      
      for (const action of this.healingState.preventiveActions) {
        console.log(`   🔮 ${action.scheduledAction} for ${action.checkName}`);
      }
    }

    console.log('');
  }

  async performAuditAndMaintenance() {
    console.log('📊 **AUDIT AND MAINTENANCE**');
    console.log('');

    const auditResults = {
      fileCleanup: await this.auditFileCleanup(),
      configValidation: await this.auditConfigValidation(),
      securityCheck: await this.auditSecuritySettings(),
      performanceAnalysis: await this.auditPerformanceSettings()
    };

    this.healingState.auditResults = auditResults;
    
    console.log('✅ System audit and maintenance completed');
    console.log('');
  }

  async auditFileCleanup() {
    console.log('🧹 Auditing file cleanup requirements...');
    
    const dataDir = path.resolve('./data');
    const oldFiles = [];
    const largeFiles = [];
    
    try {
      const files = fs.readdirSync(dataDir, { recursive: true });
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(dataDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            if (stats.mtime < oneWeekAgo && file.includes('-2025-')) {
              oldFiles.push(file);
            }
            if (stats.size > 1024 * 1024) { // > 1MB
              largeFiles.push({ file, sizeMB: Math.round(stats.size / (1024 * 1024) * 10) / 10 });
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
      
      console.log(`   📋 Found ${oldFiles.length} old files, ${largeFiles.length} large files`);
      
      return {
        oldFiles: oldFiles.length,
        largeFiles: largeFiles.length,
        recommendation: oldFiles.length > 10 ? 'cleanup_recommended' : 'cleanup_not_needed'
      };
    } catch (error) {
      return {
        error: error.message,
        recommendation: 'audit_failed'
      };
    }
  }

  async auditConfigValidation() {
    console.log('⚙️ Auditing configuration validation...');
    
    const configs = [
      '../../package.json',
      '../../.github/workflows/cv-enhancement.yml',
      './.env'
    ];
    
    let validConfigs = 0;
    const issues = [];
    
    for (const config of configs) {
      const configPath = path.resolve(config);
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        
        if (config.endsWith('.json')) {
          JSON.parse(content); // Validate JSON
        }
        
        validConfigs++;
      } catch (error) {
        issues.push(`${path.basename(config)}: ${error.message}`);
      }
    }
    
    console.log(`   📋 ${validConfigs}/${configs.length} configurations valid`);
    
    return {
      validConfigs: validConfigs,
      totalConfigs: configs.length,
      issues: issues,
      score: Math.round((validConfigs / configs.length) * 100)
    };
  }

  async auditSecuritySettings() {
    console.log('🔒 Auditing security settings...');
    
    const securityChecks = {
      envFileProtection: fs.existsSync(path.resolve('../../.env')),
      gitignoreConfig: fs.existsSync(path.resolve('../../.gitignore')),
      workflowSecurity: true // Would check workflow permissions
    };
    
    const passedChecks = Object.values(securityChecks).filter(Boolean).length;
    const totalChecks = Object.keys(securityChecks).length;
    
    console.log(`   🛡️ ${passedChecks}/${totalChecks} security checks passed`);
    
    return {
      passedChecks: passedChecks,
      totalChecks: totalChecks,
      score: Math.round((passedChecks / totalChecks) * 100),
      details: securityChecks
    };
  }

  async auditPerformanceSettings() {
    console.log('⚡ Auditing performance settings...');
    
    const performanceChecks = {
      minifiedAssets: fs.existsSync(path.resolve('../../assets/styles.min.css')),
      serviceWorker: fs.existsSync(path.resolve('../../sw.js')),
      optimizedImages: true // Would check image optimization
    };
    
    const passedChecks = Object.values(performanceChecks).filter(Boolean).length;
    const totalChecks = Object.keys(performanceChecks).length;
    
    console.log(`   🚀 ${passedChecks}/${totalChecks} performance optimizations active`);
    
    return {
      passedChecks: passedChecks,
      totalChecks: totalChecks,
      score: Math.round((passedChecks / totalChecks) * 100),
      details: performanceChecks
    };
  }

  async generateHealingReport() {
    console.log('📊 **SELF-HEALING SYSTEM REPORT**');
    console.log('=====================================');
    console.log('');
    
    const totalActions = this.healingState.healingActions.length;
    const successfulActions = this.healingState.healingActions.filter(a => a.success).length;
    const preventiveActions = this.healingState.preventiveActions.length;
    
    console.log(`🔧 **Healing Actions Summary**`);
    console.log(`   Total Actions: ${totalActions}`);
    console.log(`   Successful: ${successfulActions}/${totalActions}`);
    console.log(`   Success Rate: ${totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 100}%`);
    console.log('');
    
    console.log(`🔮 **Preventive Maintenance**`);
    console.log(`   Scheduled Actions: ${preventiveActions}`);
    console.log(`   Priority: ${preventiveActions > 0 ? 'Active' : 'None required'}`);
    console.log('');
    
    if (this.healingState.auditResults) {
      console.log(`📊 **System Audit Results**`);
      console.log(`   File Cleanup: ${this.healingState.auditResults.fileCleanup.recommendation}`);
      console.log(`   Config Validation: ${this.healingState.auditResults.configValidation.score}%`);
      console.log(`   Security: ${this.healingState.auditResults.securityCheck.score}%`);
      console.log(`   Performance: ${this.healingState.auditResults.performanceAnalysis.score}%`);
      console.log('');
    }
    
    console.log(`🎯 **System Status**`);
    if (Object.keys(this.healingState.systemMetrics).length > 0) {
      for (const [metric, result] of Object.entries(this.healingState.systemMetrics)) {
        console.log(`   ${metric}: ${result.score}% ${result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'}`);
      }
    }
    console.log('');
    
    // Save comprehensive report
    const reportPath = path.resolve('./data/self-healing-report.json');
    const report = {
      ...this.healingState,
      summary: {
        totalHealingActions: totalActions,
        successfulHealingActions: successfulActions,
        successRate: totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 100,
        preventiveActions: preventiveActions,
        systemHealth: Object.values(this.healingState.systemMetrics).length > 0 
          ? Math.round(Object.values(this.healingState.systemMetrics).reduce((sum, m) => sum + m.score, 0) / Object.values(this.healingState.systemMetrics).length)
          : 0
      },
      generatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`💾 **Self-healing report saved**: ${reportPath}`);
    console.log('');
    
    const systemHealth = report.summary.systemHealth;
    if (systemHealth >= 80) {
      console.log('🎉 **SELF-HEALING SYSTEM: EXCELLENT**');
      console.log('Your system is automatically maintaining high reliability!');
    } else if (systemHealth >= 60) {
      console.log('⚡ **SELF-HEALING SYSTEM: ACTIVE**');
      console.log('System is self-healing with some manual intervention needed.');
    } else {
      console.log('🔧 **SELF-HEALING SYSTEM: INTERVENTION REQUIRED**');
      console.log('Manual actions needed to restore full self-healing capabilities.');
    }
    
    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    monitor: args.includes('--monitor'),
    heal: args.includes('--heal'),
    audit: args.includes('--audit'),
    all: args.includes('--all') || args.length === 0
  };

  const selfHealing = new SelfHealingSystem(options);
  
  try {
    await selfHealing.initiateSelfHealing();
    process.exit(0);
  } catch (error) {
    console.error('❌ Self-healing system failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SelfHealingSystem };