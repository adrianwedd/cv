#!/usr/bin/env node

/**
 * Business Metrics Tracker - KPI Monitoring & Executive Dashboard
 * Comprehensive business metrics collection, analysis, and reporting
 * 
 * Features:
 * - Executive KPI dashboard
 * - Business impact measurement
 * - Cost analysis and ROI tracking
 * - Performance-to-business correlation
 * - Stakeholder reporting
 * - Trend analysis and forecasting
 * - SLA compliance metrics
 * 
 * Usage: node business-metrics-tracker.js [--collect] [--analyze] [--report]
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

class BusinessMetricsTracker {
  constructor(options = {}) {
    this.options = {
      reporting_period: options.reporting_period || 'daily', // daily, weekly, monthly
      kpi_targets: options.kpi_targets || {
        system_uptime: 99.9,
        response_time: 2000,
        error_rate: 0.1,
        user_satisfaction: 90,
        cost_efficiency: 85,
        security_score: 95
      },
      business_hours: options.business_hours || {
        start: 9,
        end: 17,
        timezone: 'UTC'
      },
      enable_forecasting: options.enable_forecasting !== false,
      stakeholder_groups: options.stakeholder_groups || ['executives', 'engineering', 'operations'],
      ...options
    };

    this.dataDir = path.resolve('.github/scripts/data');
    this.metricsDir = path.resolve('.github/scripts/data/business-metrics');
    this.reportsDir = path.resolve('.github/scripts/data/business-reports');
    
    this.results = {
      timestamp: new Date().toISOString(),
      reporting_period: this.options.reporting_period,
      kpi_summary: {},
      business_impact: {},
      cost_analysis: {},
      trend_analysis: {},
      forecasts: {},
      sla_compliance: {},
      recommendations: [],
      executive_summary: {}
    };

    this.kpiCategories = {
      'operational_excellence': [
        'system_uptime',
        'response_time',
        'error_rate',
        'incident_resolution_time'
      ],
      'cost_efficiency': [
        'infrastructure_cost',
        'operational_cost',
        'cost_per_user',
        'roi_percentage'
      ],
      'security_governance': [
        'security_score',
        'compliance_percentage',
        'vulnerability_count',
        'incident_count'
      ],
      'user_experience': [
        'user_satisfaction',
        'performance_score',
        'availability_percentage',
        'feature_adoption'
      ],
      'business_growth': [
        'user_engagement',
        'system_usage',
        'feature_usage',
        'business_value'
      ]
    };

    this.initializeDirectories();
  }

  initializeDirectories() {
    [this.dataDir, this.metricsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async track() {
    console.log('📊 **BUSINESS METRICS TRACKER INITIATED**');
    console.log('🎯 KPI monitoring and executive reporting');
    console.log('');

    const startTime = performance.now();

    try {
      // Collect business metrics
      await this.collectBusinessMetrics();
      
      // Calculate KPIs
      await this.calculateKPIs();
      
      // Analyze business impact
      await this.analyzeBusinessImpact();
      
      // Perform cost analysis
      await this.performCostAnalysis();
      
      // Analyze trends
      await this.analyzeTrends();
      
      // Generate forecasts
      if (this.options.enable_forecasting) {
        await this.generateForecasts();
      }
      
      // Check SLA compliance
      await this.checkSLACompliance();
      
      // Generate recommendations
      await this.generateBusinessRecommendations();
      
      // Create executive summary
      await this.createExecutiveSummary();
      
      // Save results
      await this.saveResults();

      const totalTime = Math.round(performance.now() - startTime);
      console.log(`📊 Business metrics analysis completed in ${totalTime}ms`);
      
      return this.results;

    } catch (error) {
      console.error('❌ Business metrics tracking failed:', error.message);
      throw error;
    }
  }

  async collectBusinessMetrics() {
    console.log('📈 Collecting business metrics...');
    
    this.rawMetrics = {
      operational_data: await this.collectOperationalData(),
      performance_data: await this.collectPerformanceData(),
      security_data: await this.collectSecurityData(),
      cost_data: await this.collectCostData(),
      usage_data: await this.collectUsageData()
    };
    
    console.log(`📊 Collected metrics from ${Object.keys(this.rawMetrics).length} data sources`);
  }

  async collectOperationalData() {
    const data = {
      system_uptime: 0,
      incident_count: 0,
      incident_resolution_time: 0,
      deployment_frequency: 0,
      deployment_success_rate: 100
    };

    try {
      // System health data
      const healthPath = path.join(this.dataDir, 'system-health.json');
      if (fs.existsSync(healthPath)) {
        const healthData = JSON.parse(fs.readFileSync(healthPath, 'utf8'));
        data.system_uptime = healthData.performance_metrics?.operational_percentage || 0;
      }

      // Incident data
      const incidentsDir = path.join(this.dataDir, 'incidents');
      if (fs.existsSync(incidentsDir)) {
        const incidentFiles = fs.readdirSync(incidentsDir)
          .filter(file => file.endsWith('.json'));
        
        data.incident_count = incidentFiles.length;
        
        // Calculate average resolution time
        let totalResolutionTime = 0;
        let resolvedIncidents = 0;
        
        for (const file of incidentFiles) {
          try {
            const incident = JSON.parse(fs.readFileSync(path.join(incidentsDir, file), 'utf8'));
            if (incident.status === 'resolved' && incident.resolution_time) {
              totalResolutionTime += incident.resolution_time;
              resolvedIncidents++;
            }
          } catch (error) {
            // Skip malformed files
          }
        }
        
        if (resolvedIncidents > 0) {
          data.incident_resolution_time = totalResolutionTime / resolvedIncidents;
        }
      }

      // Deployment data (from workflow status)
      const workflowPath = path.join(this.dataDir, 'workflow-status.json');
      if (fs.existsSync(workflowPath)) {
        const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
        
        if (workflowData.deployment_metrics) {
          data.deployment_frequency = workflowData.deployment_metrics.deployments_today || 0;
          data.deployment_success_rate = workflowData.deployment_metrics.success_rate || 100;
        }
      }

    } catch (error) {
      console.error('⚠️ Error collecting operational data:', error.message);
    }

    return data;
  }

  async collectPerformanceData() {
    const data = {
      response_time: 0,
      error_rate: 0,
      throughput: 0,
      performance_score: 0
    };

    try {
      // Performance metrics
      const perfPath = path.join(this.dataDir, 'performance-metrics.json');
      if (fs.existsSync(perfPath)) {
        const perfData = JSON.parse(fs.readFileSync(perfPath, 'utf8'));
        data.response_time = perfData.response_time || 0;
        data.performance_score = perfData.performance_score || 0;
      }

      // Deployment verification data
      const verificationDir = path.join(this.dataDir, 'verification');
      if (fs.existsSync(verificationDir)) {
        const verificationFiles = fs.readdirSync(verificationDir)
          .filter(file => file.includes('deployment-verification'))
          .sort()
          .slice(-1); // Most recent

        if (verificationFiles.length > 0) {
          const verificationData = JSON.parse(fs.readFileSync(
            path.join(verificationDir, verificationFiles[0]), 'utf8'
          ));
          
          if (verificationData.performance_metrics) {
            data.response_time = verificationData.performance_metrics.response_time || data.response_time;
            data.performance_score = verificationData.overall_score || data.performance_score;
          }
        }
      }

      // Error rate calculation
      data.error_rate = this.calculateErrorRate();

    } catch (error) {
      console.error('⚠️ Error collecting performance data:', error.message);
    }

    return data;
  }

  calculateErrorRate() {
    try {
      const incidentsDir = path.join(this.dataDir, 'incidents');
      if (!fs.existsSync(incidentsDir)) return 0;

      const recentIncidents = fs.readdirSync(incidentsDir)
        .filter(file => {
          const filePath = path.join(incidentsDir, file);
          const stats = fs.statSync(filePath);
          const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          return ageHours <= 24; // Last 24 hours
        });

      // Simple error rate calculation: incidents per 100 operations
      const estimatedOperations = 1000; // Would be actual operation count in production
      return (recentIncidents.length / estimatedOperations) * 100;

    } catch (error) {
      return 0;
    }
  }

  async collectSecurityData() {
    const data = {
      security_score: 0,
      compliance_percentage: 0,
      vulnerability_count: 0,
      security_incidents: 0
    };

    try {
      // Security analysis data
      const securityPath = path.join(this.dataDir, 'latest-security-analysis.json');
      if (fs.existsSync(securityPath)) {
        const securityData = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
        data.security_score = this.convertSecurityGradeToScore(securityData.security_grade);
        data.security_incidents = securityData.incidents_count || 0;
        
        // Calculate average compliance percentage
        if (securityData.compliance_summary) {
          const complianceValues = Object.values(securityData.compliance_summary)
            .filter(status => typeof status === 'string')
            .map(status => this.convertComplianceStatusToPercentage(status));
          
          if (complianceValues.length > 0) {
            data.compliance_percentage = complianceValues.reduce((sum, val) => sum + val, 0) / complianceValues.length;
          }
        }
      }

      // Vulnerability data from security reports
      const securityDir = path.join(this.dataDir, 'security');
      if (fs.existsSync(securityDir)) {
        const securityReports = fs.readdirSync(securityDir)
          .filter(file => file.includes('security-report'))
          .sort()
          .slice(-1);

        if (securityReports.length > 0) {
          const report = JSON.parse(fs.readFileSync(
            path.join(securityDir, securityReports[0]), 'utf8'
          ));
          
          data.vulnerability_count = report.threats_detected?.length || 0;
        }
      }

    } catch (error) {
      console.error('⚠️ Error collecting security data:', error.message);
    }

    return data;
  }

  convertSecurityGradeToScore(grade) {
    const gradeMap = { 'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 50 };
    return gradeMap[grade] || 0;
  }

  convertComplianceStatusToPercentage(status) {
    const statusMap = {
      'compliant': 100,
      'mostly_compliant': 85,
      'non_compliant': 50
    };
    return statusMap[status] || 0;
  }

  async collectCostData() {
    const data = {
      infrastructure_cost: 0,
      operational_cost: 0,
      total_cost: 0,
      cost_per_user: 0,
      cost_trend: 'stable'
    };

    try {
      // Cost tracking data
      const costPath = path.join(this.dataDir, 'cost-tracking.json');
      if (fs.existsSync(costPath)) {
        const costData = JSON.parse(fs.readFileSync(costPath, 'utf8'));
        
        data.infrastructure_cost = costData.monthly_infrastructure_cost || 0;
        data.operational_cost = costData.monthly_operational_cost || 0;
        data.total_cost = data.infrastructure_cost + data.operational_cost;
      }

      // Usage-based cost calculation
      const usagePath = path.join(this.dataDir, 'usage-tracking.json');
      if (fs.existsSync(usagePath)) {
        const usageData = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
        
        if (usageData.cost_analysis) {
          data.infrastructure_cost += usageData.cost_analysis.estimated_monthly_cost || 0;
          data.total_cost = data.infrastructure_cost + data.operational_cost;
        }
      }

      // Estimate cost per user (simplified)
      const estimatedUsers = 1; // This would be actual user count in production
      data.cost_per_user = data.total_cost / Math.max(1, estimatedUsers);

    } catch (error) {
      console.error('⚠️ Error collecting cost data:', error.message);
    }

    return data;
  }

  async collectUsageData() {
    const data = {
      active_users: 0,
      page_views: 0,
      feature_usage: {},
      engagement_score: 0,
      user_satisfaction: 0
    };

    try {
      // Analytics data
      const analyticsPath = path.join(this.dataDir, 'analytics/analytics-report-2025-08-08.json');
      if (fs.existsSync(analyticsPath)) {
        const analyticsData = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
        
        if (analyticsData.usage_metrics) {
          data.page_views = analyticsData.usage_metrics.total_pageviews || 0;
          data.active_users = analyticsData.usage_metrics.unique_visitors || 0;
        }
        
        if (analyticsData.engagement_metrics) {
          data.engagement_score = analyticsData.engagement_metrics.overall_score || 0;
        }
      }

      // System usage data
      const activityPath = path.join(this.dataDir, 'activity-summary.json');
      if (fs.existsSync(activityPath)) {
        const activityData = JSON.parse(fs.readFileSync(activityPath, 'utf8'));
        
        // Estimate user satisfaction based on system performance and reliability
        data.user_satisfaction = this.calculateUserSatisfaction(activityData);
      }

    } catch (error) {
      console.error('⚠️ Error collecting usage data:', error.message);
    }

    return data;
  }

  calculateUserSatisfaction(activityData) {
    let score = 100;
    
    // Deduct for performance issues
    if (this.rawMetrics.performance_data?.response_time > 3000) {
      score -= 20;
    }
    
    // Deduct for reliability issues
    if (this.rawMetrics.operational_data?.system_uptime < 99) {
      score -= 15;
    }
    
    // Deduct for security issues
    if (this.rawMetrics.security_data?.security_incidents > 0) {
      score -= 10;
    }
    
    // Add for good performance
    if (this.rawMetrics.performance_data?.performance_score > 90) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  async calculateKPIs() {
    console.log('📊 Calculating KPIs...');
    
    this.results.kpi_summary = {};
    
    for (const [category, kpiList] of Object.entries(this.kpiCategories)) {
      this.results.kpi_summary[category] = {};
      
      for (const kpi of kpiList) {
        const kpiResult = await this.calculateKPI(kpi);
        this.results.kpi_summary[category][kpi] = kpiResult;
      }
    }
    
    // Calculate overall category scores
    for (const [category, kpis] of Object.entries(this.results.kpi_summary)) {
      const scores = Object.values(kpis).map(kpi => kpi.score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      this.results.kpi_summary[category]._category_score = {
        score: averageScore,
        status: averageScore >= 90 ? 'excellent' :
                averageScore >= 80 ? 'good' :
                averageScore >= 70 ? 'acceptable' : 'needs_improvement',
        target_met: averageScore >= 80
      };
    }
    
    console.log(`🎯 Calculated KPIs for ${Object.keys(this.results.kpi_summary).length} categories`);
  }

  async calculateKPI(kpiName) {
    const target = this.options.kpi_targets[kpiName] || 100;
    let currentValue = 0;
    let unit = '';
    
    // Map KPI names to raw metrics
    switch (kpiName) {
      case 'system_uptime':
        currentValue = this.rawMetrics.operational_data.system_uptime;
        unit = '%';
        break;
        
      case 'response_time':
        currentValue = this.rawMetrics.performance_data.response_time;
        unit = 'ms';
        break;
        
      case 'error_rate':
        currentValue = this.rawMetrics.performance_data.error_rate;
        unit = '%';
        break;
        
      case 'incident_resolution_time':
        currentValue = this.rawMetrics.operational_data.incident_resolution_time;
        unit = 'minutes';
        break;
        
      case 'security_score':
        currentValue = this.rawMetrics.security_data.security_score;
        unit = 'score';
        break;
        
      case 'compliance_percentage':
        currentValue = this.rawMetrics.security_data.compliance_percentage;
        unit = '%';
        break;
        
      case 'user_satisfaction':
        currentValue = this.rawMetrics.usage_data.user_satisfaction;
        unit = '%';
        break;
        
      case 'cost_efficiency':
        // Calculate efficiency as inverse of cost growth
        currentValue = Math.max(0, 100 - (this.rawMetrics.cost_data.total_cost / 100));
        unit = '%';
        break;
        
      case 'infrastructure_cost':
        currentValue = this.rawMetrics.cost_data.infrastructure_cost;
        unit = '$';
        break;
        
      case 'operational_cost':
        currentValue = this.rawMetrics.cost_data.operational_cost;
        unit = '$';
        break;
        
      case 'cost_per_user':
        currentValue = this.rawMetrics.cost_data.cost_per_user;
        unit = '$';
        break;
        
      default:
        currentValue = 0;
    }
    
    // Calculate KPI score and status
    const variance = ((currentValue - target) / target) * 100;
    let score = 100;
    
    // For metrics where lower is better (response_time, error_rate, costs)
    const lowerIsBetter = ['response_time', 'error_rate', 'incident_resolution_time', 
                          'infrastructure_cost', 'operational_cost', 'cost_per_user'];
    
    if (lowerIsBetter.includes(kpiName)) {
      if (currentValue <= target) {
        score = 100;
      } else {
        score = Math.max(0, 100 - Math.abs(variance));
      }
    } else {
      // Higher is better
      if (currentValue >= target) {
        score = 100;
      } else {
        score = Math.max(0, (currentValue / target) * 100);
      }
    }
    
    return {
      kpi_name: kpiName,
      current_value: currentValue,
      target_value: target,
      variance_percent: variance,
      score: Math.round(score),
      unit: unit,
      status: score >= 90 ? 'excellent' :
              score >= 80 ? 'good' :
              score >= 70 ? 'acceptable' : 'needs_improvement',
      target_met: score >= 80,
      trend: this.calculateKPITrend(kpiName, currentValue)
    };
  }

  calculateKPITrend(kpiName, currentValue) {
    // This would normally compare with historical data
    // For demo, return stable trend
    return {
      direction: 'stable',
      change_percent: 0,
      confidence: 'low'
    };
  }

  async analyzeBusinessImpact() {
    console.log('💼 Analyzing business impact...');
    
    const impact = {
      revenue_impact: this.calculateRevenueImpact(),
      cost_impact: this.calculateCostImpact(),
      risk_assessment: this.assessBusinessRisk(),
      operational_efficiency: this.calculateOperationalEfficiency(),
      customer_impact: this.calculateCustomerImpact()
    };
    
    // Calculate overall business health score
    const impactScores = Object.values(impact).map(i => i.score);
    const overallScore = impactScores.reduce((sum, score) => sum + score, 0) / impactScores.length;
    
    this.results.business_impact = {
      overall_score: overallScore,
      grade: overallScore >= 90 ? 'A' :
             overallScore >= 80 ? 'B' :
             overallScore >= 70 ? 'C' :
             overallScore >= 60 ? 'D' : 'F',
      components: impact
    };
    
    console.log(`💼 Business impact grade: ${this.results.business_impact.grade} (${Math.round(overallScore)}/100)`);
  }

  calculateRevenueImpact() {
    let score = 100;
    const factors = [];
    
    // System availability impact
    const uptime = this.rawMetrics.operational_data.system_uptime;
    if (uptime < 99.9) {
      const downtime = 100 - uptime;
      score -= downtime * 10; // Each 0.1% downtime = 1 point deduction
      factors.push(`${downtime.toFixed(1)}% downtime impact`);
    }
    
    // Performance impact
    const responseTime = this.rawMetrics.performance_data.response_time;
    if (responseTime > 2000) {
      const slowdown = (responseTime - 2000) / 1000;
      score -= Math.min(20, slowdown * 5);
      factors.push(`${Math.round(slowdown)}s response time impact`);
    }
    
    return {
      score: Math.max(0, score),
      factors: factors,
      estimated_revenue_at_risk: this.calculateRevenueAtRisk(score)
    };
  }

  calculateRevenueAtRisk(impactScore) {
    // Simplified revenue impact calculation
    const estimatedMonthlyRevenue = 10000; // Would be actual revenue in production
    const riskPercentage = (100 - impactScore) / 100;
    return Math.round(estimatedMonthlyRevenue * riskPercentage);
  }

  calculateCostImpact() {
    let score = 100;
    const factors = [];
    
    const totalCost = this.rawMetrics.cost_data.total_cost;
    const costTarget = 500; // Monthly cost target
    
    if (totalCost > costTarget) {
      const overage = ((totalCost - costTarget) / costTarget) * 100;
      score -= Math.min(50, overage);
      factors.push(`${overage.toFixed(1)}% over budget`);
    }
    
    // Incident cost impact
    const incidents = this.rawMetrics.operational_data.incident_count;
    if (incidents > 0) {
      score -= incidents * 5;
      factors.push(`${incidents} incidents`);
    }
    
    return {
      score: Math.max(0, score),
      factors: factors,
      cost_efficiency: score >= 80 ? 'efficient' : 'needs_optimization',
      monthly_savings_opportunity: Math.max(0, totalCost - costTarget)
    };
  }

  assessBusinessRisk() {
    let riskScore = 0; // Lower is better for risk
    const risks = [];
    
    // Security risk
    const securityIncidents = this.rawMetrics.security_data.security_incidents;
    if (securityIncidents > 0) {
      riskScore += securityIncidents * 25;
      risks.push(`${securityIncidents} security incidents`);
    }
    
    // Compliance risk
    const compliance = this.rawMetrics.security_data.compliance_percentage;
    if (compliance < 90) {
      const gap = 90 - compliance;
      riskScore += gap;
      risks.push(`${gap}% compliance gap`);
    }
    
    // Operational risk
    const incidentCount = this.rawMetrics.operational_data.incident_count;
    if (incidentCount > 3) {
      riskScore += (incidentCount - 3) * 10;
      risks.push(`High incident rate: ${incidentCount}`);
    }
    
    const riskLevel = riskScore <= 20 ? 'low' :
                     riskScore <= 50 ? 'medium' :
                     riskScore <= 80 ? 'high' : 'critical';
    
    return {
      score: Math.max(0, 100 - riskScore), // Convert to positive score
      risk_level: riskLevel,
      risk_factors: risks,
      mitigation_required: riskScore > 50
    };
  }

  calculateOperationalEfficiency() {
    let score = 100;
    const factors = [];
    
    // Deployment efficiency
    const deploymentSuccess = this.rawMetrics.operational_data.deployment_success_rate;
    if (deploymentSuccess < 100) {
      const failureRate = 100 - deploymentSuccess;
      score -= failureRate * 0.5;
      factors.push(`${failureRate}% deployment failures`);
    }
    
    // Incident resolution efficiency
    const resolutionTime = this.rawMetrics.operational_data.incident_resolution_time;
    if (resolutionTime > 60) { // Target: 1 hour
      const slowness = (resolutionTime - 60) / 60;
      score -= Math.min(30, slowness * 10);
      factors.push(`${Math.round(slowness)}x slower incident resolution`);
    }
    
    return {
      score: Math.max(0, score),
      factors: factors,
      efficiency_grade: score >= 90 ? 'excellent' :
                       score >= 80 ? 'good' :
                       score >= 70 ? 'acceptable' : 'needs_improvement'
    };
  }

  calculateCustomerImpact() {
    let score = 100;
    const factors = [];
    
    // User satisfaction
    const satisfaction = this.rawMetrics.usage_data.user_satisfaction;
    if (satisfaction < 90) {
      const gap = 90 - satisfaction;
      score -= gap * 0.5;
      factors.push(`${gap}% satisfaction gap`);
    }
    
    // Performance impact on user experience
    const perfScore = this.rawMetrics.performance_data.performance_score;
    if (perfScore < 80) {
      const gap = 80 - perfScore;
      score -= gap * 0.3;
      factors.push(`${gap}% performance gap`);
    }
    
    return {
      score: Math.max(0, score),
      factors: factors,
      customer_experience: score >= 90 ? 'excellent' :
                          score >= 80 ? 'good' :
                          score >= 70 ? 'acceptable' : 'poor'
    };
  }

  async performCostAnalysis() {
    console.log('💰 Performing cost analysis...');
    
    const analysis = {
      current_costs: this.rawMetrics.cost_data,
      cost_breakdown: this.calculateCostBreakdown(),
      cost_trends: this.analyzeCostTrends(),
      cost_optimization: this.identifyCostOptimizations(),
      roi_analysis: this.calculateROI()
    };
    
    this.results.cost_analysis = analysis;
    
    console.log(`💰 Cost analysis completed - total monthly cost: $${Math.round(analysis.current_costs.total_cost)}`);
  }

  calculateCostBreakdown() {
    const total = this.rawMetrics.cost_data.total_cost;
    const infrastructure = this.rawMetrics.cost_data.infrastructure_cost;
    const operational = this.rawMetrics.cost_data.operational_cost;
    
    return {
      infrastructure: {
        amount: infrastructure,
        percentage: total > 0 ? (infrastructure / total) * 100 : 0
      },
      operational: {
        amount: operational,
        percentage: total > 0 ? (operational / total) * 100 : 0
      },
      total: total
    };
  }

  analyzeCostTrends() {
    // This would normally analyze historical cost data
    return {
      monthly_change: 0,
      quarterly_projection: this.rawMetrics.cost_data.total_cost * 3,
      yearly_projection: this.rawMetrics.cost_data.total_cost * 12,
      trend_direction: 'stable'
    };
  }

  identifyCostOptimizations() {
    const optimizations = [];
    
    // Infrastructure optimization opportunities
    if (this.rawMetrics.cost_data.infrastructure_cost > 200) {
      optimizations.push({
        category: 'infrastructure',
        opportunity: 'Resource right-sizing',
        estimated_savings: Math.round(this.rawMetrics.cost_data.infrastructure_cost * 0.2),
        effort: 'medium'
      });
    }
    
    // Operational optimization opportunities
    if (this.rawMetrics.operational_data.incident_count > 2) {
      optimizations.push({
        category: 'operational',
        opportunity: 'Incident reduction through automation',
        estimated_savings: Math.round(this.rawMetrics.operational_data.incident_count * 50),
        effort: 'high'
      });
    }
    
    return optimizations;
  }

  calculateROI() {
    const totalCost = this.rawMetrics.cost_data.total_cost;
    const systemValue = this.calculateSystemValue();
    
    const roi = totalCost > 0 ? ((systemValue - totalCost) / totalCost) * 100 : 0;
    
    return {
      total_investment: totalCost,
      system_value: systemValue,
      roi_percentage: roi,
      roi_status: roi > 200 ? 'excellent' :
                  roi > 100 ? 'good' :
                  roi > 50 ? 'acceptable' : 'poor'
    };
  }

  calculateSystemValue() {
    // Simplified system value calculation
    const uptime = this.rawMetrics.operational_data.system_uptime;
    const performance = this.rawMetrics.performance_data.performance_score;
    const security = this.rawMetrics.security_data.security_score;
    
    const valueScore = (uptime * 0.4 + performance * 0.3 + security * 0.3) / 100;
    const estimatedBusinessValue = 2000; // Monthly business value
    
    return Math.round(estimatedBusinessValue * valueScore);
  }

  async analyzeTrends() {
    console.log('📈 Analyzing trends...');
    
    // This would normally analyze historical data
    // For demo, provide trend analysis framework
    
    this.results.trend_analysis = {
      kpi_trends: this.analyzeKPITrends(),
      business_trends: this.analyzeBusinessTrends(),
      cost_trends: this.analyzeCostTrendDetails(),
      performance_trends: this.analyzePerformanceTrends()
    };
  }

  analyzeKPITrends() {
    const trends = {};
    
    for (const [category, kpis] of Object.entries(this.results.kpi_summary)) {
      if (category.startsWith('_')) continue; // Skip meta properties
      
      trends[category] = {
        direction: 'stable',
        strength: 'weak',
        confidence: 'low',
        forecast: 'stable'
      };
    }
    
    return trends;
  }

  analyzeBusinessTrends() {
    return {
      business_impact: {
        direction: 'improving',
        strength: 'medium',
        drivers: ['system_stability', 'performance_optimization']
      },
      cost_efficiency: {
        direction: 'stable',
        strength: 'weak',
        opportunities: ['resource_optimization', 'automation']
      }
    };
  }

  analyzeCostTrendDetails() {
    return {
      infrastructure: {
        direction: 'stable',
        monthly_change: 0,
        optimization_potential: '20%'
      },
      operational: {
        direction: 'stable',
        monthly_change: 0,
        automation_savings: '15%'
      }
    };
  }

  analyzePerformanceTrends() {
    return {
      response_time: {
        direction: 'stable',
        average_change: '0%',
        target_adherence: '100%'
      },
      uptime: {
        direction: 'stable',
        reliability_trend: 'consistent',
        sla_compliance: '99%'
      }
    };
  }

  async generateForecasts() {
    console.log('🔮 Generating forecasts...');
    
    this.results.forecasts = {
      next_month: this.generateMonthlyForecast(),
      next_quarter: this.generateQuarterlyForecast(),
      risk_projections: this.generateRiskProjections(),
      optimization_projections: this.generateOptimizationProjections()
    };
  }

  generateMonthlyForecast() {
    return {
      expected_costs: this.rawMetrics.cost_data.total_cost * 1.05, // 5% growth
      expected_incidents: Math.max(0, this.rawMetrics.operational_data.incident_count - 1),
      expected_uptime: Math.min(100, this.rawMetrics.operational_data.system_uptime + 0.5),
      confidence: 'medium'
    };
  }

  generateQuarterlyForecast() {
    return {
      cost_projection: this.rawMetrics.cost_data.total_cost * 3 * 1.1, // 10% quarterly growth
      performance_projection: 'stable',
      risk_level: 'medium',
      investment_needs: this.identifyInvestmentNeeds()
    };
  }

  generateRiskProjections() {
    return {
      security_risk: 'low',
      operational_risk: 'medium',
      cost_risk: 'low',
      mitigation_timeline: '30 days'
    };
  }

  generateOptimizationProjections() {
    return {
      cost_savings_potential: this.rawMetrics.cost_data.total_cost * 0.15,
      performance_improvement_potential: '10%',
      efficiency_gains: '20%',
      implementation_timeline: '90 days'
    };
  }

  identifyInvestmentNeeds() {
    const needs = [];
    
    if (this.rawMetrics.security_data.security_score < 90) {
      needs.push({
        area: 'security_enhancement',
        priority: 'high',
        estimated_cost: 1000,
        expected_benefit: 'compliance_improvement'
      });
    }
    
    if (this.rawMetrics.operational_data.incident_count > 3) {
      needs.push({
        area: 'automation_tools',
        priority: 'medium',
        estimated_cost: 500,
        expected_benefit: 'incident_reduction'
      });
    }
    
    return needs;
  }

  async checkSLACompliance() {
    console.log('📋 Checking SLA compliance...');
    
    const slaTargets = {
      uptime: 99.9,
      response_time: 2000,
      incident_resolution: 240, // 4 hours
      security_response: 60 // 1 hour
    };
    
    const compliance = {};
    
    for (const [sla, target] of Object.entries(slaTargets)) {
      compliance[sla] = this.checkSLA(sla, target);
    }
    
    // Calculate overall SLA compliance
    const complianceValues = Object.values(compliance).map(c => c.compliance_percentage);
    const overallCompliance = complianceValues.reduce((sum, val) => sum + val, 0) / complianceValues.length;
    
    this.results.sla_compliance = {
      overall_compliance: overallCompliance,
      status: overallCompliance >= 95 ? 'compliant' :
              overallCompliance >= 90 ? 'warning' : 'breach',
      individual_slas: compliance,
      breach_count: Object.values(compliance).filter(c => c.status === 'breach').length
    };
    
    console.log(`📋 Overall SLA compliance: ${Math.round(overallCompliance)}%`);
  }

  checkSLA(slaName, target) {
    let currentValue = 0;
    let compliancePercentage = 0;
    
    switch (slaName) {
      case 'uptime':
        currentValue = this.rawMetrics.operational_data.system_uptime;
        compliancePercentage = Math.min(100, (currentValue / target) * 100);
        break;
        
      case 'response_time':
        currentValue = this.rawMetrics.performance_data.response_time;
        compliancePercentage = currentValue <= target ? 100 : Math.max(0, 100 - ((currentValue - target) / target * 100));
        break;
        
      case 'incident_resolution':
        currentValue = this.rawMetrics.operational_data.incident_resolution_time;
        compliancePercentage = currentValue <= target ? 100 : Math.max(0, 100 - ((currentValue - target) / target * 50));
        break;
        
      case 'security_response':
        // Simplified - assume 30 minute average response time
        currentValue = 30;
        compliancePercentage = currentValue <= target ? 100 : Math.max(0, 100 - ((currentValue - target) / target * 100));
        break;
    }
    
    return {
      sla_name: slaName,
      target_value: target,
      current_value: currentValue,
      compliance_percentage: Math.round(compliancePercentage),
      status: compliancePercentage >= 95 ? 'compliant' :
              compliancePercentage >= 90 ? 'warning' : 'breach',
      breach_severity: compliancePercentage < 80 ? 'critical' :
                      compliancePercentage < 90 ? 'high' : 'none'
    };
  }

  async generateBusinessRecommendations() {
    console.log('💡 Generating business recommendations...');
    
    const recommendations = [];
    
    // Cost optimization recommendations
    if (this.results.cost_analysis.cost_optimization.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'cost_optimization',
        title: 'Implement Cost Optimization Initiatives',
        description: `Potential savings: $${this.results.cost_analysis.cost_optimization.reduce((sum, opt) => sum + opt.estimated_savings, 0)}`,
        actions: this.results.cost_analysis.cost_optimization.map(opt => opt.opportunity),
        expected_impact: 'cost_reduction',
        timeline: '90 days'
      });
    }
    
    // Performance recommendations
    const performanceKPIs = Object.values(this.results.kpi_summary.operational_excellence || {})
      .filter(kpi => kpi.kpi_name && kpi.target_met === false);
    
    if (performanceKPIs.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Address Performance KPI Gaps',
        description: `${performanceKPIs.length} KPIs below target`,
        actions: performanceKPIs.map(kpi => `Improve ${kpi.kpi_name}`),
        expected_impact: 'performance_improvement',
        timeline: '60 days'
      });
    }
    
    // Security recommendations
    if (this.results.business_impact.components.risk_assessment.mitigation_required) {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        title: 'Address Security Risk Factors',
        description: `Risk level: ${this.results.business_impact.components.risk_assessment.risk_level}`,
        actions: ['Implement additional security controls', 'Enhance monitoring', 'Update incident response'],
        expected_impact: 'risk_reduction',
        timeline: '30 days'
      });
    }
    
    // SLA compliance recommendations
    if (this.results.sla_compliance.breach_count > 0) {
      recommendations.push({
        priority: 'high',
        category: 'sla_compliance',
        title: 'Address SLA Breaches',
        description: `${this.results.sla_compliance.breach_count} SLA breaches detected`,
        actions: ['Review SLA targets', 'Implement corrective measures', 'Enhance monitoring'],
        expected_impact: 'compliance_improvement',
        timeline: '45 days'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  async createExecutiveSummary() {
    console.log('📊 Creating executive summary...');
    
    // Calculate key metrics for executive visibility
    const kpiScores = Object.values(this.results.kpi_summary)
      .filter(category => !category._category_score)
      .map(category => category._category_score?.score || 0);
    
    const avgKPIScore = kpiScores.length > 0 ? 
      kpiScores.reduce((sum, score) => sum + score, 0) / kpiScores.length : 0;
    
    this.results.executive_summary = {
      overall_health: {
        score: Math.round(avgKPIScore),
        grade: avgKPIScore >= 90 ? 'A' :
               avgKPIScore >= 80 ? 'B' :
               avgKPIScore >= 70 ? 'C' :
               avgKPIScore >= 60 ? 'D' : 'F',
        status: avgKPIScore >= 80 ? 'healthy' : 'needs_attention'
      },
      key_metrics: {
        system_uptime: `${this.rawMetrics.operational_data.system_uptime}%`,
        response_time: `${this.rawMetrics.performance_data.response_time}ms`,
        monthly_cost: `$${Math.round(this.rawMetrics.cost_data.total_cost)}`,
        security_grade: this.convertScoreToGrade(this.rawMetrics.security_data.security_score),
        incidents_count: this.rawMetrics.operational_data.incident_count
      },
      business_impact: {
        grade: this.results.business_impact.grade,
        revenue_at_risk: `$${this.results.business_impact.components.revenue_impact.estimated_revenue_at_risk}`,
        cost_efficiency: this.results.business_impact.components.cost_impact.cost_efficiency
      },
      top_priorities: this.results.recommendations
        .filter(r => r.priority === 'critical' || r.priority === 'high')
        .slice(0, 3)
        .map(r => r.title),
      sla_compliance: `${Math.round(this.results.sla_compliance.overall_compliance)}%`,
      next_review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    };
  }

  convertScoreToGrade(score) {
    if (score >= 95) return 'A';
    if (score >= 85) return 'B';
    if (score >= 75) return 'C';
    if (score >= 65) return 'D';
    return 'F';
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.reportsDir, `business-metrics-${timestamp}.json`);
    const summaryPath = path.join(this.dataDir, 'latest-business-metrics.json');
    const executivePath = path.join(this.dataDir, 'executive-dashboard.json');
    
    // Full report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Summary for monitoring systems
    const summary = {
      timestamp: this.results.timestamp,
      overall_health_score: this.results.executive_summary.overall_health.score,
      business_grade: this.results.business_impact.grade,
      monthly_cost: this.rawMetrics.cost_data.total_cost,
      sla_compliance: this.results.sla_compliance.overall_compliance,
      critical_recommendations: this.results.recommendations.filter(r => r.priority === 'critical').length
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Executive dashboard data
    fs.writeFileSync(executivePath, JSON.stringify(this.results.executive_summary, null, 2));
    
    console.log(`📁 Business metrics report saved to: ${reportPath}`);
    console.log(`📋 Executive dashboard saved to: ${executivePath}`);
  }

  displayResults() {
    console.log('');
    console.log('📊 **BUSINESS METRICS TRACKING RESULTS**');
    console.log('========================================');
    console.log('');

    // Executive summary
    const summary = this.results.executive_summary;
    const healthColor = summary.overall_health.grade === 'A' ? '🟢' :
                       summary.overall_health.grade === 'B' ? '🟡' :
                       summary.overall_health.grade === 'C' ? '🟠' : '🔴';
    
    console.log(`🎯 **Overall Health**: ${healthColor} ${summary.overall_health.grade} (${summary.overall_health.score}/100)`);
    console.log(`💼 **Business Impact**: Grade ${this.results.business_impact.grade}`);
    console.log(`📋 **SLA Compliance**: ${Math.round(this.results.sla_compliance.overall_compliance)}%`);
    console.log(`💰 **Monthly Cost**: $${Math.round(this.rawMetrics.cost_data.total_cost)}`);
    console.log('');

    // Key metrics
    console.log('📈 **Key Performance Indicators**:');
    console.log(`  • System Uptime: ${summary.key_metrics.system_uptime}`);
    console.log(`  • Response Time: ${summary.key_metrics.response_time}`);
    console.log(`  • Security Grade: ${summary.key_metrics.security_grade}`);
    console.log(`  • Active Incidents: ${summary.key_metrics.incidents_count}`);
    console.log('');

    // Top priorities
    if (summary.top_priorities.length > 0) {
      console.log('🔥 **Top Business Priorities**:');
      for (const priority of summary.top_priorities) {
        console.log(`  • ${priority}`);
      }
      console.log('');
    }

    // Business impact
    if (this.results.business_impact.components.revenue_impact.estimated_revenue_at_risk > 0) {
      console.log(`⚠️ **Revenue at Risk**: $${this.results.business_impact.components.revenue_impact.estimated_revenue_at_risk}/month`);
      console.log('');
    }

    if (summary.overall_health.status === 'healthy') {
      console.log('✅ **Business metrics are healthy - continue current operations**');
    } else {
      console.log('📊 **Business metrics need attention - review recommendations**');
    }
    console.log('');

    console.log('========================================');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    reporting_period: args.find(arg => arg.startsWith('--period='))?.split('=')[1] || 'daily',
    enable_forecasting: !args.includes('--no-forecasting')
  };

  const tracker = new BusinessMetricsTracker(options);

  try {
    const results = await tracker.track();
    tracker.displayResults();

    // Exit with appropriate code based on business health
    const healthScore = results.executive_summary.overall_health.score;
    const criticalRecommendations = results.recommendations.filter(r => r.priority === 'critical').length;
    
    if (criticalRecommendations > 0) {
      console.log('🚨 Critical business issues require immediate attention');
      process.exit(2);
    } else if (healthScore < 70) {
      console.log('⚠️ Business metrics below acceptable threshold');
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Business metrics tracking failed:', error.message);
    process.exit(3);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { BusinessMetricsTracker };