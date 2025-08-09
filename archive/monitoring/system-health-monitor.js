#!/usr/bin/env node

/**
 * System Health Monitor - Comprehensive Reliability Validation
 * Monitors all 6 critical systems: OAuth, Content Guardian, CV Generator, Analytics, Historical Verification, Elite Agents
 * 
 * Usage: node system-health-monitor.js [--detailed] [--json] [--alerts]
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

class SystemHealthMonitor {
  constructor(options = {}) {
    this.options = {
      detailed: options.detailed || false,
      json: options.json || false,
      alerts: options.alerts || false,
      timeout: options.timeout || 30000,
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      systems: {},
      performance_metrics: {},
      alerts: [],
      recommendations: []
    };

    this.systemChecks = [
      { id: 'oauth', name: '🔐 OAuth Authentication System', critical: true },
      { id: 'content_guardian', name: '🛡️ Content Guardian', critical: true },
      { id: 'cv_generator', name: '🎨 CV Generator', critical: true },
      { id: 'analytics', name: '📊 Analytics System', critical: true },
      { id: 'historical_verification', name: '📈 Historical Verification', critical: true },
      { id: 'elite_agents', name: '🤖 Elite Agents', critical: true }
    ];
  }

  async checkSystem() {
    console.log('🔍 **SYSTEM HEALTH MONITOR INITIATED**');
    console.log('📊 Validating all 6 critical systems...');
    console.log('');

    const startTime = performance.now();

    for (const system of this.systemChecks) {
      try {
        console.log(`🔍 Checking ${system.name}...`);
        const systemResult = await this.checkIndividualSystem(system);
        this.results.systems[system.id] = systemResult;
        
        const status = systemResult.operational ? '✅' : '❌';
        console.log(`${status} ${system.name}: ${systemResult.status}`);
        
        if (this.options.detailed) {
          console.log(`   - Health Score: ${systemResult.health_score}/100`);
          console.log(`   - Response Time: ${systemResult.response_time}ms`);
          if (systemResult.issues.length > 0) {
            console.log(`   - Issues: ${systemResult.issues.join(', ')}`);
          }
        }
      } catch (error) {
        console.error(`❌ ${system.name}: Health check failed - ${error.message}`);
        this.results.systems[system.id] = {
          operational: false,
          status: 'health_check_failed',
          health_score: 0,
          response_time: 0,
          issues: [error.message],
          critical: system.critical
        };
      }
    }

    const totalTime = performance.now() - startTime;
    this.results.performance_metrics = {
      total_check_time: Math.round(totalTime),
      systems_checked: this.systemChecks.length,
      operational_systems: Object.values(this.results.systems).filter(s => s.operational).length
    };

    this.calculateOverallStatus();
    this.generateAlerts();
    this.generateRecommendations();

    await this.saveResults();
    this.displayResults();

    return this.results;
  }

  async checkIndividualSystem(system) {
    const startTime = performance.now();
    let result = {
      operational: false,
      status: 'unknown',
      health_score: 0,
      response_time: 0,
      issues: [],
      critical: system.critical,
      details: {}
    };

    try {
      switch (system.id) {
        case 'oauth':
          result = await this.checkOAuthSystem();
          break;
        case 'content_guardian':
          result = await this.checkContentGuardian();
          break;
        case 'cv_generator':
          result = await this.checkCVGenerator();
          break;
        case 'analytics':
          result = await this.checkAnalytics();
          break;
        case 'historical_verification':
          result = await this.checkHistoricalVerification();
          break;
        case 'elite_agents':
          result = await this.checkEliteAgents();
          break;
        default:
          throw new Error(`Unknown system: ${system.id}`);
      }

      result.response_time = Math.round(performance.now() - startTime);
      result.critical = system.critical;
      
    } catch (error) {
      result = {
        operational: false,
        status: 'error',
        health_score: 0,
        response_time: Math.round(performance.now() - startTime),
        issues: [error.message],
        critical: system.critical,
        details: { error: error.message }
      };
    }

    return result;
  }

  async checkOAuthSystem() {
    const issues = [];
    let healthScore = 0;
    let operational = false;

    // Check OAuth client exists (relative to current working directory)
    const oauthClientPath = path.resolve('claude-oauth-client.js');
    if (!fs.existsSync(oauthClientPath)) {
      issues.push('OAuth client file missing');
    } else {
      healthScore += 30;
    }

    // Check auth manager
    const authManagerPath = path.resolve('claude-auth-manager.js');
    if (!fs.existsSync(authManagerPath)) {
      issues.push('Auth manager missing');
    } else {
      healthScore += 30;
    }

    // Check usage monitor
    const usageMonitorPath = path.resolve('usage-monitor.js');
    if (!fs.existsSync(usageMonitorPath)) {
      issues.push('Usage monitor missing');
    } else {
      healthScore += 20;
    }

    // Check configuration
    const hasOAuthToken = !!process.env.CLAUDE_OAUTH_TOKEN;
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const hasBrowserAuth = !!(process.env.CLAUDE_SESSION_KEY || process.env.CLAUDE_COOKIES_JSON);
    
    if (!hasOAuthToken && !hasApiKey && !hasBrowserAuth) {
      issues.push('No authentication configured');
    } else {
      healthScore += 20;
    }

    operational = healthScore >= 60;

    return {
      operational,
      status: operational ? 'operational' : 'degraded',
      health_score: healthScore,
      issues,
      details: {
        oauth_configured: hasOAuthToken,
        api_key_available: hasApiKey,
        browser_auth_available: hasBrowserAuth,
        files_present: {
          oauth_client: fs.existsSync(oauthClientPath),
          auth_manager: fs.existsSync(authManagerPath),
          usage_monitor: fs.existsSync(usageMonitorPath)
        }
      }
    };
  }

  async checkContentGuardian() {
    const issues = [];
    let healthScore = 0;
    let operational = false;

    // Check Content Guardian file
    const guardianPath = path.resolve('.github/scripts/content-guardian.js');
    if (!fs.existsSync(guardianPath)) {
      issues.push('Content Guardian missing');
    } else {
      healthScore += 40;
    }

    // Check protected content registry
    const protectedContentPath = path.resolve('data/protected-content.json');
    if (!fs.existsSync(protectedContentPath)) {
      issues.push('Protected content registry missing');
    } else {
      try {
        const protectedData = JSON.parse(fs.readFileSync(protectedContentPath, 'utf8'));
        if (protectedData.achievements && Array.isArray(protectedData.achievements)) {
          healthScore += 30;
        } else {
          issues.push('Protected content registry invalid structure');
        }
      } catch (error) {
        issues.push('Protected content registry corrupted');
      }
    }

    // Check validation reports
    const validationPath = path.resolve('data/latest-validation-report.json');
    if (fs.existsSync(validationPath)) {
      healthScore += 30;
    } else {
      issues.push('No recent validation reports');
    }

    operational = healthScore >= 70;

    return {
      operational,
      status: operational ? 'operational' : 'degraded',
      health_score: healthScore,
      issues,
      details: {
        guardian_present: fs.existsSync(guardianPath),
        protected_registry_present: fs.existsSync(protectedContentPath),
        validation_reports_present: fs.existsSync(validationPath)
      }
    };
  }

  async checkCVGenerator() {
    const issues = [];
    let healthScore = 0;
    let operational = false;

    // Check CV Generator
    const generatorPath = path.resolve('.github/scripts/cv-generator.js');
    if (!fs.existsSync(generatorPath)) {
      issues.push('CV Generator missing');
    } else {
      healthScore += 40;
    }

    // Check base CV data
    const baseCVPath = path.resolve('data/base-cv.json');
    if (!fs.existsSync(baseCVPath)) {
      issues.push('Base CV data missing');
    } else {
      try {
        const cvData = JSON.parse(fs.readFileSync(baseCVPath, 'utf8'));
        if (cvData.personal_info && cvData.experience) {
          healthScore += 30;
        } else {
          issues.push('Base CV data invalid structure');
        }
      } catch (error) {
        issues.push('Base CV data corrupted');
      }
    }

    // Check generated website
    const websitePath = path.resolve('index.html');
    if (!fs.existsSync(websitePath)) {
      issues.push('Generated website missing');
    } else {
      healthScore += 30;
    }

    operational = healthScore >= 70;

    return {
      operational,
      status: operational ? 'operational' : 'degraded',
      health_score: healthScore,
      issues,
      details: {
        generator_present: fs.existsSync(generatorPath),
        base_data_present: fs.existsSync(baseCVPath),
        website_present: fs.existsSync(websitePath)
      }
    };
  }

  async checkAnalytics() {
    const issues = [];
    let healthScore = 0;
    let operational = false;

    // Check Activity Analyzer
    const analyzerPath = path.resolve('.github/scripts/activity-analyzer.js');
    if (!fs.existsSync(analyzerPath)) {
      issues.push('Activity Analyzer missing');
    } else {
      healthScore += 25;
    }

    // Check Usage Monitor
    const usageMonitorPath = path.resolve('.github/scripts/usage-monitor.js');
    if (!fs.existsSync(usageMonitorPath)) {
      issues.push('Usage Monitor missing');
    } else {
      healthScore += 25;
    }

    // Check Activity Summary
    const activitySummaryPath = path.resolve('data/activity-summary.json');
    if (!fs.existsSync(activitySummaryPath)) {
      issues.push('Activity summary missing');
    } else {
      healthScore += 25;
    }

    // Check Usage Tracking
    const usageTrackingPath = path.resolve('.github/scripts/data/usage-tracking.json');
    if (!fs.existsSync(usageTrackingPath)) {
      issues.push('Usage tracking missing');
    } else {
      healthScore += 25;
    }

    operational = healthScore >= 75;

    return {
      operational,
      status: operational ? 'operational' : 'degraded',
      health_score: healthScore,
      issues,
      details: {
        analyzer_present: fs.existsSync(analyzerPath),
        usage_monitor_present: fs.existsSync(usageMonitorPath),
        activity_summary_present: fs.existsSync(activitySummaryPath),
        usage_tracking_present: fs.existsSync(usageTrackingPath)
      }
    };
  }

  async checkHistoricalVerification() {
    const issues = [];
    let healthScore = 0;
    let operational = false;

    // Check Historical Verifier
    const verifierPath = path.resolve('.github/scripts/historical-cv-verifier.js');
    if (!fs.existsSync(verifierPath)) {
      issues.push('Historical verifier missing');
    } else {
      healthScore += 30;
    }

    // Check Claim Verifier
    const claimVerifierPath = path.resolve('.github/scripts/claim-verifier.js');
    if (!fs.existsSync(claimVerifierPath)) {
      issues.push('Claim verifier missing');
    } else {
      healthScore += 30;
    }

    // Check Verification Data
    const verificationDir = path.resolve('.github/scripts/data/verification');
    if (!fs.existsSync(verificationDir)) {
      issues.push('Verification data directory missing');
    } else {
      const verificationFiles = fs.readdirSync(verificationDir).filter(f => f.endsWith('.json'));
      if (verificationFiles.length > 0) {
        healthScore += 40;
      } else {
        issues.push('No verification data available');
      }
    }

    operational = healthScore >= 70;

    return {
      operational,
      status: operational ? 'operational' : 'degraded',
      health_score: healthScore,
      issues,
      details: {
        historical_verifier_present: fs.existsSync(verifierPath),
        claim_verifier_present: fs.existsSync(claimVerifierPath),
        verification_data_available: fs.existsSync(verificationDir)
      }
    };
  }

  async checkEliteAgents() {
    const issues = [];
    let healthScore = 0;
    let operational = false;

    // Check Agents Directory
    const agentsDir = path.resolve('agents');
    if (!fs.existsSync(agentsDir)) {
      issues.push('Elite agents directory missing');
    } else {
      const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      if (agentFiles.length >= 9) {
        healthScore += 40;
      } else {
        issues.push(`Only ${agentFiles.length}/9 elite agents available`);
        healthScore += Math.floor((agentFiles.length / 9) * 40);
      }
    }

    // Check AI Intelligence Orchestrator
    const orchestratorPath = path.resolve('.github/scripts/ai-enhanced-orchestrator.js');
    if (!fs.existsSync(orchestratorPath)) {
      issues.push('AI Intelligence Orchestrator missing');
    } else {
      healthScore += 30;
    }

    // Check AI Intelligence Data
    const intelligenceDir = path.resolve('.github/scripts/data/intelligence');
    if (!fs.existsSync(intelligenceDir)) {
      issues.push('Intelligence data directory missing');
    } else {
      healthScore += 30;
    }

    operational = healthScore >= 70;

    return {
      operational,
      status: operational ? 'operational' : 'degraded',
      health_score: healthScore,
      issues,
      details: {
        agents_directory_present: fs.existsSync(agentsDir),
        orchestrator_present: fs.existsSync(orchestratorPath),
        intelligence_data_present: fs.existsSync(intelligenceDir)
      }
    };
  }

  calculateOverallStatus() {
    const systems = Object.values(this.results.systems);
    const operationalSystems = systems.filter(s => s.operational);
    const criticalSystems = systems.filter(s => s.critical);
    const operationalCritical = criticalSystems.filter(s => s.operational);

    const operationalPercentage = (operationalSystems.length / systems.length) * 100;
    const criticalPercentage = (operationalCritical.length / criticalSystems.length) * 100;

    if (criticalPercentage === 100 && operationalPercentage >= 90) {
      this.results.overall_status = 'excellent';
    } else if (criticalPercentage >= 80 && operationalPercentage >= 70) {
      this.results.overall_status = 'good';
    } else if (criticalPercentage >= 60) {
      this.results.overall_status = 'degraded';
    } else {
      this.results.overall_status = 'critical';
    }

    this.results.performance_metrics.operational_percentage = Math.round(operationalPercentage);
    this.results.performance_metrics.critical_percentage = Math.round(criticalPercentage);
  }

  generateAlerts() {
    const systems = Object.entries(this.results.systems);
    
    for (const [systemId, system] of systems) {
      if (!system.operational && system.critical) {
        this.results.alerts.push({
          severity: 'critical',
          system: systemId,
          message: `Critical system ${systemId} is not operational`,
          issues: system.issues
        });
      } else if (!system.operational) {
        this.results.alerts.push({
          severity: 'warning',
          system: systemId,
          message: `System ${systemId} is degraded`,
          issues: system.issues
        });
      } else if (system.health_score < 80) {
        this.results.alerts.push({
          severity: 'info',
          system: systemId,
          message: `System ${systemId} health score below optimal (${system.health_score}/100)`,
          issues: system.issues
        });
      }
    }
  }

  generateRecommendations() {
    const systems = Object.entries(this.results.systems);
    
    for (const [systemId, system] of systems) {
      if (!system.operational) {
        this.results.recommendations.push({
          priority: system.critical ? 'high' : 'medium',
          system: systemId,
          action: `Restore ${systemId} system to operational status`,
          details: system.issues
        });
      } else if (system.health_score < 80) {
        this.results.recommendations.push({
          priority: 'low',
          system: systemId,
          action: `Improve ${systemId} system health score`,
          details: system.issues
        });
      }
    }
  }

  async saveResults() {
    const outputPath = path.resolve('.github/scripts/data/system-health.json');
    
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    
    if (this.options.detailed) {
      console.log(`📁 Health report saved to: ${outputPath}`);
    }
  }

  displayResults() {
    if (this.options.json) {
      console.log(JSON.stringify(this.results, null, 2));
      return;
    }

    console.log('');
    console.log('🎯 **SYSTEM HEALTH MONITOR RESULTS**');
    console.log('=====================================');
    console.log('');

    // Overall Status
    const statusEmoji = {
      excellent: '🟢',
      good: '🟡',
      degraded: '🟠',
      critical: '🔴'
    };

    console.log(`📊 **Overall Status**: ${statusEmoji[this.results.overall_status]} ${this.results.overall_status.toUpperCase()}`);
    console.log(`🎯 **Operational Systems**: ${this.results.performance_metrics.operational_systems}/${this.results.performance_metrics.systems_checked}`);
    console.log(`📈 **Critical Systems Health**: ${this.results.performance_metrics.critical_percentage}%`);
    console.log(`⚡ **Total Check Time**: ${this.results.performance_metrics.total_check_time}ms`);
    console.log('');

    // System Details
    if (this.options.detailed) {
      console.log('🔍 **System Details**:');
      for (const [systemId, system] of Object.entries(this.results.systems)) {
        const statusIcon = system.operational ? '✅' : '❌';
        const systemName = this.systemChecks.find(s => s.id === systemId)?.name || systemId;
        console.log(`${statusIcon} ${systemName}: ${system.health_score}/100 (${system.status})`);
        
        if (system.issues.length > 0) {
          console.log(`   Issues: ${system.issues.join(', ')}`);
        }
      }
      console.log('');
    }

    // Alerts
    if (this.results.alerts.length > 0) {
      console.log('🚨 **Active Alerts**:');
      for (const alert of this.results.alerts) {
        const alertIcon = { critical: '🔴', warning: '⚠️', info: 'ℹ️' }[alert.severity];
        console.log(`${alertIcon} ${alert.message}`);
      }
      console.log('');
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('💡 **Recommendations**:');
      for (const rec of this.results.recommendations) {
        const priorityIcon = { high: '🔥', medium: '⚡', low: '💡' }[rec.priority];
        console.log(`${priorityIcon} ${rec.action}`);
      }
      console.log('');
    }

    if (this.results.alerts.length === 0 && this.results.overall_status === 'excellent') {
      console.log('✨ **All systems operational and healthy!**');
      console.log('');
    }

    console.log('=====================================');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    detailed: args.includes('--detailed'),
    json: args.includes('--json'),
    alerts: args.includes('--alerts')
  };

  const monitor = new SystemHealthMonitor(options);
  
  try {
    const results = await monitor.checkSystem();
    
    // Exit with appropriate code
    const criticalIssues = results.alerts.filter(a => a.severity === 'critical').length;
    const operationalPercentage = results.performance_metrics.operational_percentage;
    
    if (criticalIssues > 0) {
      process.exit(2); // Critical issues
    } else if (operationalPercentage < 80) {
      process.exit(1); // Degraded performance
    } else {
      process.exit(0); // All good
    }
  } catch (error) {
    console.error('❌ System health check failed:', error.message);
    process.exit(3);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SystemHealthMonitor };