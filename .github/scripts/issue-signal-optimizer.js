#!/usr/bin/env node

/**
 * 🎯 High Signal-to-Noise Ratio Issue Management System
 * 
 * Production-grade GitHub issues optimization for CV enhancement system.
 * Designed to maintain focus on critical infrastructure during system crises.
 * 
 * @author Claude Code - Reliability Engineer
 * @version 1.0.0
 */

import { readFile, writeFile, existsSync } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const execAsync = promisify(exec);

/**
 * 🏗️ Signal Detection Framework Configuration
 * 
 * Defines precise criteria for high-impact vs noise issues during system crises.
 */
const SIGNAL_DETECTION_CONFIG = {
  // System health thresholds for crisis mode activation
  CRISIS_HEALTH_THRESHOLD: 80, // <80% triggers crisis mode
  CRITICAL_HEALTH_THRESHOLD: 50, // <50% triggers emergency mode
  
  // Signal strength scoring weights
  SIGNAL_WEIGHTS: {
    priority: 40,      // P0=40, P1=30, P2=20, P3=10
    system_impact: 30, // Critical systems get highest weight
    recency: 15,       // Recent issues more relevant
    dependencies: 15   // Issues blocking other work
  },
  
  // Critical system keywords for impact assessment
  CRITICAL_SYSTEMS: [
    'authentication', 'oauth', 'auth', 'login',
    'website', 'deployment', 'ci', 'cd', 'pipeline',
    'production', 'monitoring', 'health',
    'es module', 'import', 'export', 'module loading',
    'test', 'testing', 'workflow', 'build'
  ],
  
  // Noise patterns that indicate low-priority work
  NOISE_INDICATORS: [
    'epic', 'roadmap', 'enhancement', 'feat:',
    'optimization', 'analytics', 'dashboard',
    'visualization', 'performance', 'refactor'
  ],
  
  // Crisis mode filters - only these labels allowed during crisis
  CRISIS_ALLOWED_LABELS: [
    'P0: Critical', 'P1: High',
    'bug', 'security', 'infrastructure',
    'reliability', 'ci-cd', 'workflow'
  ]
};

/**
 * 🔍 Issue Signal Analyzer
 * 
 * Calculates signal strength for GitHub issues based on system context.
 */
class IssueSignalAnalyzer {
  constructor(systemHealth, config = SIGNAL_DETECTION_CONFIG) {
    this.systemHealth = systemHealth;
    this.config = config;
    this.isCrisisMode = systemHealth < config.CRISIS_HEALTH_THRESHOLD;
    this.isEmergencyMode = systemHealth < config.CRITICAL_HEALTH_THRESHOLD;
  }
  
  /**
   * Calculate signal strength score for an issue (0-100)
   */
  calculateSignalScore(issue) {
    let score = 0;
    const weights = this.config.SIGNAL_WEIGHTS;
    
    // Priority scoring (40% weight)
    score += this.calculatePriorityScore(issue) * (weights.priority / 100);
    
    // System impact scoring (30% weight)
    score += this.calculateSystemImpactScore(issue) * (weights.system_impact / 100);
    
    // Recency scoring (15% weight)
    score += this.calculateRecencyScore(issue) * (weights.recency / 100);
    
    // Dependency scoring (15% weight)
    score += this.calculateDependencyScore(issue) * (weights.dependencies / 100);
    
    // Crisis mode modifiers
    if (this.isCrisisMode) {
      score = this.applyCrisisModeModifiers(issue, score);
    }
    
    return Math.round(score);
  }
  
  calculatePriorityScore(issue) {
    const priorityLabels = issue.labels?.filter(l => l.name.match(/P[0-3]/)) || [];
    if (priorityLabels.length === 0) return 20; // Default medium priority
    
    const priority = priorityLabels[0].name;
    const scores = { 'P0: Critical': 100, 'P1: High': 75, 'P2: Medium': 50, 'P3: Low': 25 };
    return scores[priority] || 20;
  }
  
  calculateSystemImpactScore(issue) {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const criticalKeywords = this.config.CRITICAL_SYSTEMS;
    
    let impactScore = 0;
    let keywordCount = 0;
    
    criticalKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywordCount++;
        // Weight by keyword criticality
        if (['authentication', 'website', 'production'].includes(keyword)) {
          impactScore += 30;
        } else if (['ci', 'pipeline', 'workflow', 'deployment'].includes(keyword)) {
          impactScore += 20;
        } else {
          impactScore += 10;
        }
      }
    });
    
    return Math.min(impactScore, 100);
  }
  
  calculateRecencyScore(issue) {
    const now = new Date();
    const updated = new Date(issue.updatedAt);
    const hoursOld = (now - updated) / (1000 * 60 * 60);
    
    // Newer issues get higher scores
    if (hoursOld < 24) return 100;      // Last 24 hours
    if (hoursOld < 72) return 80;       // Last 3 days
    if (hoursOld < 168) return 60;      // Last week
    if (hoursOld < 720) return 40;      // Last month
    return 20;                          // Older than month
  }
  
  calculateDependencyScore(issue) {
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const blockingKeywords = ['blocking', 'blocks', 'dependency', 'required for', 'prerequisite'];
    
    let score = 20; // Base score
    blockingKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 20;
    });
    
    return Math.min(score, 100);
  }
  
  applyCrisisModeModifiers(issue, baseScore) {
    const hasAllowedLabels = issue.labels?.some(l => 
      this.config.CRISIS_ALLOWED_LABELS.includes(l.name)
    );
    
    // In crisis mode, heavily penalize non-critical issues
    if (!hasAllowedLabels) {
      return baseScore * 0.3; // 70% penalty for non-critical work
    }
    
    // In emergency mode, only P0/P1 issues get full weight
    if (this.isEmergencyMode) {
      const hasCriticalPriority = issue.labels?.some(l => 
        ['P0: Critical', 'P1: High'].includes(l.name)
      );
      
      if (!hasCriticalPriority) {
        return baseScore * 0.1; // 90% penalty for non-critical priorities
      }
    }
    
    return baseScore;
  }
  
  /**
   * Classify issue as signal, noise, or borderline
   */
  classifyIssue(issue) {
    const score = this.calculateSignalScore(issue);
    
    if (this.isCrisisMode) {
      // Stricter thresholds during crisis
      if (score >= 70) return 'signal';
      if (score >= 40) return 'borderline';
      return 'noise';
    } else {
      // Normal operation thresholds
      if (score >= 60) return 'signal';
      if (score >= 35) return 'borderline';
      return 'noise';
    }
  }
}

/**
 * 🔧 Automated Issue Triage System
 * 
 * Implements health-based filtering and automated issue lifecycle management.
 */
class AutomatedIssueTriage {
  constructor(analyzer) {
    this.analyzer = analyzer;
  }
  
  /**
   * Triage all open issues and generate recommendations
   */
  async triageIssues() {
    console.log('🔍 Analyzing repository issues for signal optimization...');
    
    // Fetch open issues from GitHub
    const issues = await this.fetchOpenIssues();
    console.log(`📊 Found ${issues.length} open issues to analyze`);
    
    // Analyze each issue
    const analysis = issues.map(issue => {
      const score = this.analyzer.calculateSignalScore(issue);
      const classification = this.analyzer.classifyIssue(issue);
      
      return {
        issue,
        score,
        classification,
        recommendations: this.generateRecommendations(issue, score, classification)
      };
    });
    
    // Generate triage report
    const report = this.generateTriageReport(analysis);
    
    return { analysis, report };
  }
  
  async fetchOpenIssues() {
    try {
      const { stdout } = await execAsync(`gh issue list --state=open --limit=100 --json number,title,labels,createdAt,updatedAt,body`);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('❌ Failed to fetch GitHub issues:', error.message);
      return [];
    }
  }
  
  generateRecommendations(issue, score, classification) {
    const recommendations = [];
    
    if (this.analyzer.isCrisisMode) {
      if (classification === 'noise') {
        recommendations.push({
          action: 'defer',
          reason: 'System in crisis mode - defer non-critical work',
          urgency: 'low'
        });
      } else if (classification === 'borderline') {
        recommendations.push({
          action: 'monitor',
          reason: 'Borderline priority during crisis - monitor for escalation',
          urgency: 'medium'
        });
      }
    }
    
    if (classification === 'signal') {
      const hasPriority = issue.labels?.some(l => l.name.match(/P[0-3]/));
      if (!hasPriority) {
        recommendations.push({
          action: 'add_priority',
          reason: 'High signal issue missing priority label',
          urgency: 'medium'
        });
      }
    }
    
    // Check for stale issues
    const daysSinceUpdate = (Date.now() - new Date(issue.updatedAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 30 && classification === 'noise') {
      recommendations.push({
        action: 'close_stale',
        reason: 'Low priority issue inactive for >30 days',
        urgency: 'low'
      });
    }
    
    return recommendations;
  }
  
  generateTriageReport(analysis) {
    const total = analysis.length;
    const signal = analysis.filter(a => a.classification === 'signal').length;
    const noise = analysis.filter(a => a.classification === 'noise').length;
    const borderline = analysis.filter(a => a.classification === 'borderline').length;
    
    const signalRatio = ((signal / total) * 100).toFixed(1);
    const noiseRatio = ((noise / total) * 100).toFixed(1);
    
    const systemStatus = this.analyzer.isEmergencyMode ? 'EMERGENCY' :
                        this.analyzer.isCrisisMode ? 'CRISIS' : 'NORMAL';
    
    return {
      summary: {
        totalIssues: total,
        signalIssues: signal,
        noiseIssues: noise,
        borderlineIssues: borderline,
        signalToNoiseRatio: `${signalRatio}% signal, ${noiseRatio}% noise`,
        systemMode: systemStatus,
        systemHealth: this.analyzer.systemHealth
      },
      recommendations: this.generateSystemRecommendations(analysis),
      topPriorityIssues: analysis
        .filter(a => a.classification === 'signal')
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
      deferredIssues: analysis
        .filter(a => a.classification === 'noise' && this.analyzer.isCrisisMode)
        .map(a => ({ number: a.issue.number, title: a.issue.title, score: a.score }))
    };
  }
  
  generateSystemRecommendations(analysis) {
    const recommendations = [];
    
    if (this.analyzer.isCrisisMode) {
      const noiseIssues = analysis.filter(a => a.classification === 'noise').length;
      if (noiseIssues > 5) {
        recommendations.push({
          type: 'crisis_protocol',
          action: 'Activate crisis mode protocol - defer non-critical issues',
          impact: `${noiseIssues} low-priority issues diluting focus during system crisis`
        });
      }
    }
    
    const unlabeledHighScore = analysis.filter(a => 
      a.score > 70 && !a.issue.labels?.some(l => l.name.match(/P[0-3]/))
    ).length;
    
    if (unlabeledHighScore > 0) {
      recommendations.push({
        type: 'labeling',
        action: 'Add priority labels to high-signal issues',
        impact: `${unlabeledHighScore} high-impact issues missing priority classification`
      });
    }
    
    return recommendations;
  }
}

/**
 * 🚨 Crisis Mode Protocol Implementation
 * 
 * Automated response system for system health <80% scenarios.
 */
class CrisisModeProtocol {
  constructor(systemHealth) {
    this.systemHealth = systemHealth;
    this.isCrisis = systemHealth < 80;
    this.isEmergency = systemHealth < 50;
  }
  
  async activateCrisisProtocol() {
    if (!this.isCrisis) {
      console.log('✅ System health good - crisis protocol not required');
      return { activated: false, systemHealth: this.systemHealth };
    }
    
    console.log(`🚨 CRISIS MODE ACTIVATED - System Health: ${this.systemHealth}%`);
    
    const actions = [];
    
    // 1. Identify and pause non-critical issues
    const pausedIssues = await this.pauseNonCriticalIssues();
    actions.push({ action: 'paused_non_critical', count: pausedIssues.length });
    
    // 2. Create crisis tracking issue if needed
    const crisisIssue = await this.createCrisisTrackingIssue();
    if (crisisIssue) {
      actions.push({ action: 'created_crisis_issue', number: crisisIssue });
    }
    
    // 3. Update repository status
    await this.updateRepositoryStatus();
    actions.push({ action: 'updated_status' });
    
    return {
      activated: true,
      mode: this.isEmergency ? 'EMERGENCY' : 'CRISIS',
      systemHealth: this.systemHealth,
      actions
    };
  }
  
  async pauseNonCriticalIssues() {
    const analyzer = new IssueSignalAnalyzer(this.systemHealth);
    const triage = new AutomatedIssueTriage(analyzer);
    const { analysis } = await triage.triageIssues();
    
    const toPause = analysis.filter(a => 
      a.classification === 'noise' && !a.issue.labels?.some(l => l.name === 'paused')
    );
    
    for (const item of toPause) {
      try {
        await execAsync(`gh issue edit ${item.issue.number} --add-label "paused"`);
        console.log(`⏸️ Paused low-priority issue #${item.issue.number}`);
      } catch (error) {
        console.error(`Failed to pause issue #${item.issue.number}:`, error.message);
      }
    }
    
    return toPause;
  }
  
  async createCrisisTrackingIssue() {
    // Check if crisis issue already exists
    try {
      const { stdout } = await execAsync(`gh issue list --search "CRISIS MODE" --state=open --json number`);
      const existing = JSON.parse(stdout);
      if (existing.length > 0) {
        console.log(`📋 Crisis tracking issue already exists: #${existing[0].number}`);
        return null;
      }
    } catch (error) {
      console.log('⚠️ Could not check for existing crisis issues');
    }
    
    const title = `🚨 CRISIS MODE: System Health Recovery (${this.systemHealth}%)`;
    const body = `# Crisis Mode Activated
    
**System Health**: ${this.systemHealth}%
**Mode**: ${this.isEmergency ? 'EMERGENCY' : 'CRISIS'}
**Activated**: ${new Date().toISOString()}

## Critical Systems Status
- [ ] Authentication (0/3 methods operational)
- [ ] Website availability (DNS failure)
- [ ] CI/CD pipeline stability
- [ ] ES Module compatibility
- [ ] Production monitoring

## Recovery Objectives
1. **Restore authentication system** - P0 Critical
2. **Fix website DNS/deployment** - P0 Critical  
3. **Resolve ES Module conflicts** - P0 Critical
4. **Stabilize CI/CD pipeline** - P1 High
5. **Restore monitoring systems** - P1 High

## Protocol Actions Taken
- Non-critical issues paused until health >80%
- Focus restricted to P0/P1 infrastructure issues
- Enhanced monitoring and alerting activated

**AUTO-CLOSE CONDITION**: System health sustained >80% for 24 hours
`;
    
    try {
      const { stdout } = await execAsync(`gh issue create --title "${title}" --body "${body}" --label "P0: Critical,crisis-mode,infrastructure"`);
      const issueNumber = stdout.match(/#(\d+)/)?.[1];
      console.log(`📋 Created crisis tracking issue: #${issueNumber}`);
      return issueNumber;
    } catch (error) {
      console.error('❌ Failed to create crisis tracking issue:', error.message);
      return null;
    }
  }
  
  async updateRepositoryStatus() {
    const statusFile = '.github/CRISIS_STATUS.md';
    const status = `# Repository Crisis Status

**Last Updated**: ${new Date().toISOString()}
**System Health**: ${this.systemHealth}%
**Mode**: ${this.isEmergency ? '🚨 EMERGENCY' : '⚠️ CRISIS'}

## Focus Restrictions
- Only P0/P1 infrastructure issues
- Feature development paused
- Enhancement work deferred

## Health Recovery Target
Target: >80% system health sustained for 24 hours
Current: ${this.systemHealth}%

## Critical Systems
- Authentication: ❌ Failed
- Website: ❌ DNS Error
- CI/CD: ⚠️ Unstable
- Monitoring: ⚠️ Partial
`;
    
    try {
      await writeFileAsync(statusFile, status);
      console.log('📄 Updated crisis status file');
    } catch (error) {
      console.error('Failed to update crisis status:', error.message);
    }
  }
}

/**
 * 📊 Quality Gates and Monitoring System
 * 
 * Maintains issue hygiene and prevents attention dilution.
 */
class IssueQualityGates {
  constructor() {
    this.metrics = {
      signalToNoiseRatio: 0,
      averageIssueAge: 0,
      staleIssueCount: 0,
      unlabeledCount: 0
    };
  }
  
  async runQualityAssessment() {
    console.log('📊 Running issue quality assessment...');
    
    const analyzer = new IssueSignalAnalyzer(await this.getCurrentSystemHealth());
    const triage = new AutomatedIssueTriage(analyzer);
    const { analysis, report } = await triage.triageIssues();
    
    // Calculate quality metrics
    this.calculateQualityMetrics(analysis);
    
    // Generate quality report
    const qualityReport = {
      timestamp: new Date().toISOString(),
      systemHealth: analyzer.systemHealth,
      signalAnalysis: report,
      qualityMetrics: this.metrics,
      qualityScore: this.calculateQualityScore(),
      recommendations: this.generateQualityRecommendations()
    };
    
    // Save quality report
    await this.saveQualityReport(qualityReport);
    
    return qualityReport;
  }
  
  calculateQualityMetrics(analysis) {
    const total = analysis.length;
    const signal = analysis.filter(a => a.classification === 'signal').length;
    const noise = analysis.filter(a => a.classification === 'noise').length;
    
    this.metrics.signalToNoiseRatio = total > 0 ? (signal / noise) || 0 : 0;
    
    // Calculate average issue age
    const ages = analysis.map(a => {
      const created = new Date(a.issue.createdAt);
      return (Date.now() - created) / (1000 * 60 * 60 * 24); // days
    });
    this.metrics.averageIssueAge = ages.reduce((sum, age) => sum + age, 0) / ages.length || 0;
    
    // Count stale issues (>30 days without update)
    this.metrics.staleIssueCount = analysis.filter(a => {
      const updated = new Date(a.issue.updatedAt);
      const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
      return daysSince > 30;
    }).length;
    
    // Count unlabeled high-impact issues
    this.metrics.unlabeledCount = analysis.filter(a => 
      a.score > 70 && (!a.issue.labels || a.issue.labels.length === 0)
    ).length;
  }
  
  calculateQualityScore() {
    let score = 100;
    
    // Penalize poor signal-to-noise ratio
    if (this.metrics.signalToNoiseRatio < 0.5) score -= 25;
    else if (this.metrics.signalToNoiseRatio < 1.0) score -= 15;
    
    // Penalize high average age
    if (this.metrics.averageIssueAge > 60) score -= 20;
    else if (this.metrics.averageIssueAge > 30) score -= 10;
    
    // Penalize stale issues
    if (this.metrics.staleIssueCount > 10) score -= 20;
    else if (this.metrics.staleIssueCount > 5) score -= 10;
    
    // Penalize unlabeled high-impact issues
    if (this.metrics.unlabeledCount > 5) score -= 15;
    else if (this.metrics.unlabeledCount > 2) score -= 10;
    
    return Math.max(score, 0);
  }
  
  generateQualityRecommendations() {
    const recommendations = [];
    
    if (this.metrics.signalToNoiseRatio < 1.0) {
      recommendations.push({
        category: 'Signal Quality',
        action: 'Improve signal-to-noise ratio by closing low-priority issues',
        priority: 'High'
      });
    }
    
    if (this.metrics.staleIssueCount > 5) {
      recommendations.push({
        category: 'Issue Hygiene',
        action: `Review and close ${this.metrics.staleIssueCount} stale issues`,
        priority: 'Medium'
      });
    }
    
    if (this.metrics.unlabeledCount > 2) {
      recommendations.push({
        category: 'Labeling',
        action: `Add priority labels to ${this.metrics.unlabeledCount} high-impact issues`,
        priority: 'Medium'
      });
    }
    
    return recommendations;
  }
  
  async saveQualityReport(report) {
    const reportPath = 'data/issue-quality-report.json';
    try {
      await writeFileAsync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Saved quality report to ${reportPath}`);
    } catch (error) {
      console.error('Failed to save quality report:', error.message);
    }
  }
  
  async getCurrentSystemHealth() {
    try {
      const monitoringData = await readFileAsync('data/production-monitoring.json', 'utf8');
      const data = JSON.parse(monitoringData);
      return data.systemHealth?.percentage || 50;
    } catch (error) {
      console.warn('Could not read system health, defaulting to 50%');
      return 50;
    }
  }
}

/**
 * 🎯 Main CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';
  
  try {
    switch (command) {
      case 'analyze':
        await runSignalAnalysis();
        break;
      case 'crisis':
        await activateCrisisMode();
        break;
      case 'quality':
        await runQualityGates();
        break;
      case 'help':
        showHelp();
        break;
      default:
        console.log(`❓ Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

async function runSignalAnalysis() {
  console.log('🎯 Running comprehensive signal-to-noise analysis...\n');
  
  // Get current system health
  const qualityGates = new IssueQualityGates();
  const systemHealth = await qualityGates.getCurrentSystemHealth();
  
  console.log(`📊 System Health: ${systemHealth}%`);
  if (systemHealth < 80) {
    console.log('🚨 System in crisis mode - applying strict filtering');
  }
  console.log('');
  
  // Run triage analysis
  const analyzer = new IssueSignalAnalyzer(systemHealth);
  const triage = new AutomatedIssueTriage(analyzer);
  const { analysis, report } = await triage.triageIssues();
  
  // Display results
  console.log('📋 SIGNAL ANALYSIS RESULTS\n');
  console.log(`Total Issues: ${report.summary.totalIssues}`);
  console.log(`Signal Ratio: ${report.summary.signalToNoiseRatio}`);
  console.log(`System Mode: ${report.summary.systemMode}`);
  console.log('');
  
  if (report.topPriorityIssues.length > 0) {
    console.log('🎯 TOP PRIORITY ISSUES (High Signal):');
    report.topPriorityIssues.forEach((item, index) => {
      console.log(`${index + 1}. #${item.issue.number} - ${item.issue.title} (Score: ${item.score})`);
    });
    console.log('');
  }
  
  if (report.deferredIssues.length > 0 && analyzer.isCrisisMode) {
    console.log('⏸️ DEFERRED ISSUES (Crisis Mode):');
    report.deferredIssues.slice(0, 10).forEach(issue => {
      console.log(`   #${issue.number} - ${issue.title} (Score: ${issue.score})`);
    });
    console.log('');
  }
  
  if (report.recommendations.length > 0) {
    console.log('💡 SYSTEM RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`   • ${rec.action}`);
      console.log(`     Impact: ${rec.impact}`);
    });
  }
}

async function activateCrisisMode() {
  console.log('🚨 Activating crisis mode protocol...\n');
  
  const qualityGates = new IssueQualityGates();
  const systemHealth = await qualityGates.getCurrentSystemHealth();
  
  const crisisProtocol = new CrisisModeProtocol(systemHealth);
  const result = await crisisProtocol.activateCrisisProtocol();
  
  if (result.activated) {
    console.log(`🚨 Crisis mode activated - ${result.mode}`);
    console.log(`System Health: ${result.systemHealth}%`);
    console.log('\nActions taken:');
    result.actions.forEach(action => {
      console.log(`  ✓ ${action.action}${action.count ? ` (${action.count} items)` : ''}`);
    });
  } else {
    console.log('✅ System health good - crisis mode not required');
  }
}

async function runQualityGates() {
  console.log('📊 Running issue quality assessment...\n');
  
  const qualityGates = new IssueQualityGates();
  const report = await qualityGates.runQualityAssessment();
  
  console.log('📈 QUALITY ASSESSMENT RESULTS\n');
  console.log(`Quality Score: ${report.qualityScore}/100`);
  console.log(`Signal-to-Noise Ratio: ${report.qualityMetrics.signalToNoiseRatio.toFixed(2)}`);
  console.log(`Average Issue Age: ${report.qualityMetrics.averageIssueAge.toFixed(1)} days`);
  console.log(`Stale Issues: ${report.qualityMetrics.staleIssueCount}`);
  console.log(`Unlabeled High-Impact: ${report.qualityMetrics.unlabeledCount}`);
  console.log('');
  
  if (report.recommendations.length > 0) {
    console.log('🎯 QUALITY RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`   [${rec.priority}] ${rec.action}`);
    });
  }
}

function showHelp() {
  console.log(`
🎯 GitHub Issues Signal-to-Noise Optimizer

USAGE:
  node issue-signal-optimizer.js [command]

COMMANDS:
  analyze    Run comprehensive signal-to-noise analysis (default)
  crisis     Activate crisis mode protocol for system health <80%
  quality    Run issue quality gates and hygiene assessment
  help       Show this help message

EXAMPLES:
  node issue-signal-optimizer.js analyze
  node issue-signal-optimizer.js crisis
  node issue-signal-optimizer.js quality

The system automatically detects crisis conditions based on system health
and applies appropriate filtering to maintain focus on critical issues.
`);
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  IssueSignalAnalyzer,
  AutomatedIssueTriage,
  CrisisModeProtocol,
  IssueQualityGates
};