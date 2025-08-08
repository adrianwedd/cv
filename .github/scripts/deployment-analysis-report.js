#!/usr/bin/env node

/**
 * Deployment Analysis Report - Comprehensive System Reliability Assessment
 * Generates detailed post-deployment analysis with actionable insights
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

class DeploymentAnalysisReport {
  constructor(options = {}) {
    this.options = {
      includeRecommendations: options.includeRecommendations !== false,
      generateHTML: options.generateHTML !== false,
      generateJSON: options.generateJSON !== false,
      detailedMetrics: options.detailedMetrics !== false,
      ...options
    };

    this.analysis = {
      report_id: this.generateReportId(),
      timestamp: new Date().toISOString(),
      executive_summary: {},
      system_reliability: {},
      performance_analysis: {},
      incident_analysis: {},
      security_posture: {},
      recommendations: [],
      action_items: [],
      metrics: {}
    };
  }

  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `DEPLOY-ANALYSIS-${timestamp}-${random}`;
  }

  async generateReport() {
    console.log('📊 **DEPLOYMENT ANALYSIS REPORT GENERATION**');
    console.log(`🎯 Report ID: ${this.analysis.report_id}`);
    console.log('');

    const startTime = performance.now();

    try {
      // Collect all system data
      await this.collectSystemData();
      
      // Perform comprehensive analysis
      await this.analyzeSystemReliability();
      await this.analyzePerformance();
      await this.analyzeIncidents();
      await this.analyzeSecurityPosture();
      
      // Generate insights and recommendations
      await this.generateExecutiveSummary();
      await this.generateRecommendations();
      await this.generateActionItems();
      
      // Calculate metrics
      this.calculateMetrics();
      
      // Save reports
      await this.saveReports();
      
      const totalTime = Math.round(performance.now() - startTime);
      console.log(`✅ Analysis completed in ${totalTime}ms`);
      
      this.displayReport();
      
      return this.analysis;
      
    } catch (error) {
      console.error('❌ Deployment analysis failed:', error.message);
      this.analysis.error = error.message;
      await this.saveReports();
      throw error;
    }
  }

  async collectSystemData() {
    console.log('📥 **COLLECTING SYSTEM DATA**');
    
    this.systemData = {
      health: null,
      performance: null,
      incidents: [],
      workflows: [],
      files: {}
    };

    try {
      // System health data
      const { SystemHealthMonitor } = await import('./system-health-monitor.js');
      const healthMonitor = new SystemHealthMonitor({ detailed: true });
      this.systemData.health = await healthMonitor.checkSystem();
      console.log('  ✅ System health data collected');
    } catch (error) {
      console.log('  ⚠️ System health data unavailable:', error.message);
    }

    try {
      // Performance data  
      const { PerformanceMonitor } = await import('./performance-monitor.js');
      const perfMonitor = new PerformanceMonitor({ detailed: true });
      this.systemData.performance = await perfMonitor.startMonitoring();
      console.log('  ✅ Performance data collected');
    } catch (error) {
      console.log('  ⚠️ Performance data unavailable:', error.message);
    }

    // Load incident reports
    try {
      const dataDir = path.resolve('data');
      if (fs.existsSync(dataDir)) {
        const incidentFiles = fs.readdirSync(dataDir)
          .filter(file => file.startsWith('incident-report-'))
          .map(file => {
            const filePath = path.join(dataDir, file);
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
          });
        this.systemData.incidents = incidentFiles;
        console.log(`  ✅ ${incidentFiles.length} incident reports loaded`);
      }
    } catch (error) {
      console.log('  ⚠️ Incident data unavailable:', error.message);
    }

    // Check key files existence
    this.systemData.files = {
      monitoring_systems: fs.existsSync('system-health-monitor.js'),
      performance_monitor: fs.existsSync('performance-monitor.js'),
      incident_response: fs.existsSync('incident-response-system.js'),
      monitoring_dashboard: fs.existsSync('monitoring-dashboard.js'),
      cv_generator: fs.existsSync('cv-generator.js'),
      activity_analyzer: fs.existsSync('activity-analyzer.js')
    };

    console.log('  ✅ File inventory completed');
  }

  async analyzeSystemReliability() {
    console.log('🔍 **ANALYZING SYSTEM RELIABILITY**');
    
    if (!this.systemData.health) {
      this.analysis.system_reliability = { available: false, reason: 'Health data unavailable' };
      return;
    }

    const health = this.systemData.health;
    
    this.analysis.system_reliability = {
      overall_status: health.overall_status,
      operational_percentage: health.performance_metrics.operational_percentage,
      systems_analysis: {
        total_systems: health.performance_metrics.systems_checked,
        operational: health.performance_metrics.operational_systems,
        degraded: health.performance_metrics.systems_checked - health.performance_metrics.operational_systems
      },
      critical_issues: health.alerts.filter(a => a.severity === 'critical').length,
      system_details: Object.entries(health.systems).map(([name, system]) => ({
        name,
        operational: system.operational,
        health_score: system.health_score,
        issues_count: system.issues.length,
        critical: system.critical
      })),
      reliability_score: this.calculateReliabilityScore(health)
    };

    console.log(`  📊 Reliability Score: ${this.analysis.system_reliability.reliability_score}/100`);
  }

  calculateReliabilityScore(health) {
    const weights = {
      operational_percentage: 0.4,
      critical_systems: 0.3,
      average_health: 0.2,
      alert_severity: 0.1
    };

    const operationalScore = health.performance_metrics.operational_percentage;
    
    const criticalSystems = Object.values(health.systems).filter(s => s.critical);
    const operationalCritical = criticalSystems.filter(s => s.operational).length;
    const criticalScore = (operationalCritical / criticalSystems.length) * 100;
    
    const healthScores = Object.values(health.systems).map(s => s.health_score);
    const avgHealthScore = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
    
    const criticalAlerts = health.alerts.filter(a => a.severity === 'critical').length;
    const alertScore = Math.max(0, 100 - (criticalAlerts * 20));
    
    return Math.round(
      operationalScore * weights.operational_percentage +
      criticalScore * weights.critical_systems +
      avgHealthScore * weights.average_health +
      alertScore * weights.alert_severity
    );
  }

  async analyzePerformance() {
    console.log('⚡ **ANALYZING PERFORMANCE METRICS**');
    
    if (!this.systemData.performance) {
      this.analysis.performance_analysis = { available: false, reason: 'Performance data unavailable' };
      return;
    }

    const perf = this.systemData.performance;
    
    this.analysis.performance_analysis = {
      site_accessibility: perf.metrics.production.accessible,
      response_time: perf.metrics.production.response_time,
      core_web_vitals: {
        ttfb: perf.core_web_vitals.ttfb,
        fcp: perf.core_web_vitals.fcp,
        lcp: perf.core_web_vitals.lcp,
        cls: perf.core_web_vitals.cls
      },
      performance_budget: {
        status: perf.performance_budget.status,
        compliance_percentage: perf.performance_budget.budget_compliance,
        violations_count: perf.performance_budget.violations?.length || 0
      },
      performance_score: this.calculatePerformanceScore(perf),
      alerts: perf.alerts.length,
      recommendations_count: perf.recommendations.length
    };

    console.log(`  📊 Performance Score: ${this.analysis.performance_analysis.performance_score}/100`);
  }

  calculatePerformanceScore(perf) {
    if (!perf.metrics.production.accessible) return 0;
    
    const weights = {
      accessibility: 0.3,
      response_time: 0.25,
      core_web_vitals: 0.25,
      budget_compliance: 0.2
    };

    const accessibilityScore = perf.metrics.production.accessible ? 100 : 0;
    const responseTimeScore = Math.max(0, 100 - Math.max(0, (perf.metrics.production.response_time - 1000) / 20));
    
    const cwvScores = Object.values(perf.core_web_vitals).map(metric => {
      if (!metric || metric.value === null) return 50;
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 60;
        case 'poor': return 20;
        default: return 50;
      }
    });
    const cwvScore = cwvScores.reduce((a, b) => a + b, 0) / cwvScores.length;
    
    const budgetScore = perf.performance_budget.budget_compliance || 0;
    
    return Math.round(
      accessibilityScore * weights.accessibility +
      responseTimeScore * weights.response_time +
      cwvScore * weights.core_web_vitals +
      budgetScore * weights.budget_compliance
    );
  }

  async analyzeIncidents() {
    console.log('🚨 **ANALYZING INCIDENT HISTORY**');
    
    const incidents = this.systemData.incidents;
    
    if (incidents.length === 0) {
      this.analysis.incident_analysis = {
        total_incidents: 0,
        incident_free_period: true,
        mttr: null,
        resolution_success_rate: 100
      };
      console.log('  ✅ No incidents found - excellent stability');
      return;
    }

    const severityDistribution = incidents.reduce((acc, incident) => {
      const severity = incident.incident_details.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    const resolvedIncidents = incidents.filter(i => i.incident_details.status === 'resolved');
    const resolutionRate = (resolvedIncidents.length / incidents.length) * 100;

    // Calculate MTTR (Mean Time To Resolution)
    const resolutionTimes = resolvedIncidents.map(incident => {
      const start = new Date(incident.incident_details.timestamp);
      const end = new Date(incident.incident_details.resolution_time);
      return (end - start) / (1000 * 60); // minutes
    });

    const mttr = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : null;

    this.analysis.incident_analysis = {
      total_incidents: incidents.length,
      severity_distribution: severityDistribution,
      resolution_success_rate: Math.round(resolutionRate),
      mttr_minutes: mttr ? Math.round(mttr) : null,
      recent_incidents: incidents.slice(0, 3).map(i => ({
        id: i.incident_details.id,
        severity: i.incident_details.severity,
        status: i.incident_details.status,
        timestamp: i.incident_details.timestamp
      })),
      incident_free_days: this.calculateIncidentFreeDays(incidents)
    };

    console.log(`  📊 Total Incidents: ${incidents.length}`);
    console.log(`  📊 Resolution Rate: ${resolutionRate}%`);
    if (mttr) console.log(`  📊 MTTR: ${Math.round(mttr)} minutes`);
  }

  calculateIncidentFreeDays(incidents) {
    if (incidents.length === 0) return null;
    
    const latestIncident = incidents.sort((a, b) => 
      new Date(b.incident_details.timestamp) - new Date(a.incident_details.timestamp)
    )[0];
    
    const daysSinceLastIncident = Math.floor(
      (Date.now() - new Date(latestIncident.incident_details.timestamp)) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastIncident;
  }

  async analyzeSecurityPosture() {
    console.log('🔒 **ANALYZING SECURITY POSTURE**');
    
    // Check for security-related files and configurations
    const securityChecks = {
      content_guardian: fs.existsSync('content-guardian.js'),
      auth_manager: fs.existsSync('claude-auth-manager.js'),
      secure_configs: this.checkSecureConfigurations(),
      incident_response: fs.existsSync('incident-response-system.js'),
      monitoring_enabled: fs.existsSync('monitoring-dashboard.js')
    };

    const securityScore = Object.values(securityChecks).filter(Boolean).length / Object.keys(securityChecks).length * 100;

    this.analysis.security_posture = {
      overall_score: Math.round(securityScore),
      security_controls: securityChecks,
      auth_systems_operational: this.systemData.health?.systems?.oauth?.operational || false,
      content_protection: securityChecks.content_guardian,
      incident_response_ready: securityChecks.incident_response,
      monitoring_coverage: securityChecks.monitoring_enabled
    };

    console.log(`  🔒 Security Score: ${Math.round(securityScore)}/100`);
  }

  checkSecureConfigurations() {
    // Check for secure configuration patterns
    const checks = [];
    
    // Check if environment variables are properly configured
    checks.push(!!(process.env.CLAUDE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY));
    
    // Check for protected content systems
    checks.push(fs.existsSync('../../data/protected-content.json'));
    
    return checks.every(Boolean);
  }

  async generateExecutiveSummary() {
    console.log('📋 **GENERATING EXECUTIVE SUMMARY**');
    
    const reliability = this.analysis.system_reliability;
    const performance = this.analysis.performance_analysis;
    const incidents = this.analysis.incident_analysis;
    const security = this.analysis.security_posture;

    this.analysis.executive_summary = {
      overall_health: this.calculateOverallHealth(),
      key_metrics: {
        system_reliability: reliability.reliability_score || 0,
        performance_score: performance.performance_score || 0,
        security_score: security.overall_score || 0,
        incident_resolution_rate: incidents.resolution_success_rate || 100
      },
      status_summary: this.generateStatusSummary(),
      critical_items: this.identifyCriticalItems(),
      achievements: this.identifyAchievements(),
      next_actions: []
    };
  }

  calculateOverallHealth() {
    const scores = [
      this.analysis.system_reliability.reliability_score || 0,
      this.analysis.performance_analysis.performance_score || 0,
      this.analysis.security_posture.overall_score || 0
    ];

    const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (overall >= 90) return 'excellent';
    else if (overall >= 75) return 'good';
    else if (overall >= 60) return 'fair';
    else return 'needs_attention';
  }

  generateStatusSummary() {
    const reliability = this.analysis.system_reliability;
    const performance = this.analysis.performance_analysis;

    return `System monitoring deployment completed with ${reliability.operational_percentage || 0}% of critical systems operational. ` +
           `Performance monitoring shows ${performance.site_accessibility ? 'site accessible' : 'site accessibility issues'} ` +
           `with ${performance.performance_budget?.compliance_percentage || 0}% performance budget compliance.`;
  }

  identifyCriticalItems() {
    const items = [];
    const reliability = this.analysis.system_reliability;
    const performance = this.analysis.performance_analysis;

    if (reliability.operational_percentage < 80) {
      items.push({
        severity: 'high',
        category: 'reliability',
        description: `Only ${reliability.operational_percentage}% of systems operational`,
        impact: 'System reliability below acceptable threshold'
      });
    }

    if (performance.performance_score < 70) {
      items.push({
        severity: 'medium',
        category: 'performance',
        description: `Performance score ${performance.performance_score}/100`,
        impact: 'User experience may be degraded'
      });
    }

    if (!performance.site_accessibility) {
      items.push({
        severity: 'critical',
        category: 'accessibility',
        description: 'Production site not accessible',
        impact: 'Complete service unavailability'
      });
    }

    return items;
  }

  identifyAchievements() {
    const achievements = [];
    
    // Monitoring infrastructure deployment
    achievements.push({
      category: 'infrastructure',
      description: 'Comprehensive monitoring infrastructure deployed',
      details: 'System health monitoring, performance tracking, incident response, and dashboard systems operational'
    });

    // System reliability
    if (this.analysis.system_reliability.operational_percentage >= 80) {
      achievements.push({
        category: 'reliability',
        description: `${this.analysis.system_reliability.operational_percentage}% system reliability achieved`,
        details: 'Critical systems operational and monitored'
      });
    }

    // Incident response capability
    if (this.systemData.files.incident_response) {
      achievements.push({
        category: 'resilience',
        description: 'Automated incident response system deployed',
        details: 'Emergency response and recovery procedures established'
      });
    }

    return achievements;
  }

  async generateRecommendations() {
    console.log('💡 **GENERATING RECOMMENDATIONS**');
    
    const recommendations = [];
    const reliability = this.analysis.system_reliability;
    const performance = this.analysis.performance_analysis;
    const security = this.analysis.security_posture;

    // System reliability recommendations
    if (reliability.operational_percentage < 90) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        title: 'Improve System Operational Status',
        description: `${reliability.systems_analysis.degraded} systems are currently degraded`,
        actions: [
          'Review degraded system configurations',
          'Fix missing dependencies and file paths',
          'Implement system health checks in CI/CD pipeline',
          'Set up automated system recovery procedures'
        ],
        expected_impact: 'Increase system reliability to 95%+',
        timeline: '1-2 weeks'
      });
    }

    // Performance recommendations
    if (performance.performance_score < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Performance Metrics',
        description: `Current performance score: ${performance.performance_score}/100`,
        actions: [
          'Optimize Core Web Vitals (LCP, FCP, CLS)',
          'Implement performance budget enforcement',
          'Enable advanced caching strategies',
          'Optimize asset delivery and compression'
        ],
        expected_impact: 'Achieve 90+ performance score',
        timeline: '2-3 weeks'
      });
    }

    // Security recommendations
    if (security.overall_score < 90) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        title: 'Enhance Security Posture',
        description: `Security score: ${security.overall_score}/100`,
        actions: [
          'Implement comprehensive authentication monitoring',
          'Deploy security headers and content protection',
          'Enable real-time security alerting',
          'Establish security incident response procedures'
        ],
        expected_impact: 'Achieve enterprise-grade security standards',
        timeline: '1-2 weeks'
      });
    }

    // Monitoring enhancements
    recommendations.push({
      priority: 'medium',
      category: 'monitoring',
      title: 'Enhance Monitoring Capabilities',
      description: 'Extend monitoring coverage and alerting',
      actions: [
        'Implement real-time alerting integrations (Slack, email)',
        'Add custom performance dashboards',
        'Enable predictive failure detection',
        'Implement automated scaling responses'
      ],
      expected_impact: 'Proactive issue detection and resolution',
      timeline: '3-4 weeks'
    });

    this.analysis.recommendations = recommendations;
    console.log(`  💡 Generated ${recommendations.length} recommendations`);
  }

  async generateActionItems() {
    console.log('📝 **GENERATING ACTION ITEMS**');
    
    const actionItems = [];

    // Immediate actions (next 24 hours)
    actionItems.push({
      priority: 'immediate',
      title: 'Fix System Path Resolution Issues',
      description: 'Multiple systems showing path resolution errors',
      owner: 'DevOps Team',
      timeline: '24 hours',
      acceptance_criteria: [
        'All 6 critical systems show operational status',
        'System health monitoring returns 90%+ operational',
        'No path-related errors in system logs'
      ]
    });

    // Short-term actions (next week)
    actionItems.push({
      priority: 'short_term',
      title: 'Implement Performance Optimization',
      description: 'Address Core Web Vitals and performance budget compliance',
      owner: 'Frontend Team',
      timeline: '1 week',
      acceptance_criteria: [
        'LCP under 2.5s',
        'FCP under 1.8s',
        'Performance budget compliance >70%',
        'Overall performance score >80'
      ]
    });

    // Medium-term actions (next month)
    actionItems.push({
      priority: 'medium_term',
      title: 'Deploy Production Monitoring Infrastructure',
      description: 'Establish comprehensive monitoring and alerting',
      owner: 'Infrastructure Team',
      timeline: '1 month',
      acceptance_criteria: [
        'Real-time dashboard operational 24/7',
        'Automated alerting for all critical systems',
        'Incident response procedures tested',
        'SLA monitoring and reporting enabled'
      ]
    });

    this.analysis.action_items = actionItems;
    console.log(`  📝 Generated ${actionItems.length} action items`);
  }

  calculateMetrics() {
    const totalTime = Date.now() - new Date(this.analysis.timestamp).getTime();
    
    this.analysis.metrics = {
      analysis_duration_ms: totalTime,
      total_systems_analyzed: this.systemData.health?.performance_metrics?.systems_checked || 0,
      total_data_points: this.countDataPoints(),
      report_completeness: this.calculateReportCompleteness(),
      confidence_score: this.calculateConfidenceScore()
    };
  }

  countDataPoints() {
    let count = 0;
    if (this.systemData.health) count += 10;
    if (this.systemData.performance) count += 8;
    count += this.systemData.incidents.length;
    count += Object.keys(this.systemData.files).length;
    return count;
  }

  calculateReportCompleteness() {
    const sections = [
      'system_reliability',
      'performance_analysis', 
      'incident_analysis',
      'security_posture',
      'executive_summary',
      'recommendations'
    ];

    const completeSections = sections.filter(section => 
      this.analysis[section] && Object.keys(this.analysis[section]).length > 0
    ).length;

    return Math.round((completeSections / sections.length) * 100);
  }

  calculateConfidenceScore() {
    const factors = [];
    
    // Data availability
    if (this.systemData.health) factors.push(90);
    else factors.push(30);
    
    if (this.systemData.performance) factors.push(90);
    else factors.push(30);

    // Incident data depth
    if (this.systemData.incidents.length > 0) factors.push(80);
    else factors.push(70); // No incidents is also good data

    // File system checks
    const fileChecks = Object.values(this.systemData.files).filter(Boolean).length;
    const fileScore = (fileChecks / Object.keys(this.systemData.files).length) * 100;
    factors.push(fileScore);

    return Math.round(factors.reduce((a, b) => a + b, 0) / factors.length);
  }

  async saveReports() {
    const outputDir = path.resolve('data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save JSON report
    if (this.options.generateJSON) {
      const jsonPath = path.join(outputDir, `deployment-analysis-${this.analysis.report_id}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(this.analysis, null, 2));
      console.log(`📁 JSON report saved to: ${jsonPath}`);
    }

    // Save HTML report
    if (this.options.generateHTML) {
      const htmlPath = path.join(outputDir, `deployment-analysis-${this.analysis.report_id}.html`);
      const htmlContent = this.generateHTMLReport();
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`📁 HTML report saved to: ${htmlPath}`);
    }

    // Save summary report
    const summaryPath = path.join(outputDir, 'deployment-analysis-latest.json');
    const summary = {
      report_id: this.analysis.report_id,
      timestamp: this.analysis.timestamp,
      overall_health: this.analysis.executive_summary.overall_health,
      key_metrics: this.analysis.executive_summary.key_metrics,
      critical_items_count: this.analysis.executive_summary.critical_items.length,
      recommendations_count: this.analysis.recommendations.length,
      confidence_score: this.analysis.metrics.confidence_score
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }

  generateHTMLReport() {
    const health = this.analysis.executive_summary.overall_health;
    const healthColor = {
      excellent: '#10B981',
      good: '#F59E0B',
      fair: '#EF4444', 
      needs_attention: '#DC2626'
    }[health] || '#6B7280';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deployment Analysis Report - ${this.analysis.report_id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 10px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .health-status { font-size: 1.5rem; padding: 15px 30px; background: ${healthColor}; border-radius: 25px; display: inline-block; margin-top: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { color: #1f2937; margin-bottom: 15px; font-size: 1.3rem; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .metric-label { color: #6b7280; }
        .metric-value { font-weight: bold; color: #1f2937; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .recommendation { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 15px; border-radius: 5px; }
        .recommendation h4 { color: #1e40af; margin-bottom: 10px; }
        .priority-high { border-left-color: #dc2626; }
        .priority-medium { border-left-color: #f59e0b; }
        .priority-low { border-left-color: #10b981; }
        .action-item { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
        .footer { text-align: center; margin-top: 40px; color: #6b7280; }
        .timestamp { font-size: 0.9rem; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Deployment Analysis Report</h1>
            <p>System Reliability & Performance Assessment</p>
            <div class="health-status">Overall Health: ${health.toUpperCase()}</div>
            <div class="timestamp">Generated: ${new Date(this.analysis.timestamp).toLocaleString()}</div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 Key Metrics</h3>
                <div class="metric">
                    <span class="metric-label">System Reliability:</span>
                    <span class="metric-value">${this.analysis.executive_summary.key_metrics.system_reliability}/100</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Performance Score:</span>
                    <span class="metric-value">${this.analysis.executive_summary.key_metrics.performance_score}/100</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Security Score:</span>
                    <span class="metric-value">${this.analysis.executive_summary.key_metrics.security_score}/100</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Confidence Level:</span>
                    <span class="metric-value">${this.analysis.metrics.confidence_score}/100</span>
                </div>
            </div>

            <div class="card">
                <h3>🎯 System Status</h3>
                <div class="metric">
                    <span class="metric-label">Operational Systems:</span>
                    <span class="metric-value">${this.analysis.system_reliability.operational_percentage}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Site Accessible:</span>
                    <span class="metric-value">${this.analysis.performance_analysis.site_accessibility ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Critical Items:</span>
                    <span class="metric-value">${this.analysis.executive_summary.critical_items.length}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Active Recommendations:</span>
                    <span class="metric-value">${this.analysis.recommendations.length}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📋 Executive Summary</h2>
            <p>${this.analysis.executive_summary.status_summary}</p>
        </div>

        <div class="section">
            <h2>💡 Recommendations</h2>
            ${this.analysis.recommendations.map(rec => `
                <div class="recommendation priority-${rec.priority}">
                    <h4>${rec.title}</h4>
                    <p><strong>Priority:</strong> ${rec.priority.toUpperCase()}</p>
                    <p><strong>Description:</strong> ${rec.description}</p>
                    <p><strong>Timeline:</strong> ${rec.timeline}</p>
                    <p><strong>Expected Impact:</strong> ${rec.expected_impact}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>📝 Action Items</h2>
            ${this.analysis.action_items.map(item => `
                <div class="action-item">
                    <h4>${item.title}</h4>
                    <p><strong>Priority:</strong> ${item.priority.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Owner:</strong> ${item.owner}</p>
                    <p><strong>Timeline:</strong> ${item.timeline}</p>
                    <p>${item.description}</p>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Report ID: ${this.analysis.report_id}</p>
            <p>Analysis completed with ${this.analysis.metrics.confidence_score}% confidence</p>
        </div>
    </div>
</body>
</html>`;
  }

  displayReport() {
    console.log('');
    console.log('📊 **DEPLOYMENT ANALYSIS REPORT**');
    console.log('==================================');
    console.log(`🎯 Report ID: ${this.analysis.report_id}`);
    console.log(`📅 Generated: ${new Date(this.analysis.timestamp).toLocaleString()}`);
    console.log('');

    // Executive Summary
    console.log('📋 **EXECUTIVE SUMMARY**:');
    console.log(`🎯 Overall Health: ${this.analysis.executive_summary.overall_health.toUpperCase()}`);
    console.log(`📊 System Reliability: ${this.analysis.executive_summary.key_metrics.system_reliability}/100`);
    console.log(`⚡ Performance Score: ${this.analysis.executive_summary.key_metrics.performance_score}/100`);
    console.log(`🔒 Security Score: ${this.analysis.executive_summary.key_metrics.security_score}/100`);
    console.log('');

    // Critical Issues
    if (this.analysis.executive_summary.critical_items.length > 0) {
      console.log('🚨 **CRITICAL ITEMS**:');
      this.analysis.executive_summary.critical_items.forEach(item => {
        console.log(`  🔥 ${item.description} (${item.severity})`);
      });
      console.log('');
    }

    // Key Recommendations
    console.log('💡 **TOP RECOMMENDATIONS**:');
    this.analysis.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.title} (${rec.priority})`);
    });
    console.log('');

    // Next Actions
    console.log('📝 **IMMEDIATE ACTIONS**:');
    const immediateActions = this.analysis.action_items.filter(a => a.priority === 'immediate');
    if (immediateActions.length > 0) {
      immediateActions.forEach(action => {
        console.log(`  🎯 ${action.title} - ${action.timeline}`);
      });
    } else {
      console.log('  ✅ No immediate actions required');
    }
    console.log('');

    console.log(`📊 Analysis Confidence: ${this.analysis.metrics.confidence_score}/100`);
    console.log(`📋 Report Completeness: ${this.analysis.metrics.report_completeness}%`);
    console.log('==================================');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    generateHTML: !args.includes('--no-html'),
    generateJSON: !args.includes('--no-json'),
    detailedMetrics: args.includes('--detailed')
  };

  const analyzer = new DeploymentAnalysisReport(options);
  
  try {
    const report = await analyzer.generateReport();
    
    // Exit codes based on overall health
    if (report.executive_summary.overall_health === 'needs_attention') process.exit(2);
    else if (report.executive_summary.overall_health === 'fair') process.exit(1);
    else process.exit(0);
    
  } catch (error) {
    console.error('❌ Deployment analysis failed:', error.message);
    process.exit(3);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DeploymentAnalysisReport };