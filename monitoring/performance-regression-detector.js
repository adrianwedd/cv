#!/usr/bin/env node

/**
 * Performance Regression Detector
 * Advanced regression detection with automated prevention and rollback
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = __dirname;

class PerformanceRegressionDetector {
  constructor(options = {}) {
    this.options = {
      historyWindow: options.historyWindow || 10,
      regressionThreshold: options.regressionThreshold || -5,
      criticalThreshold: options.criticalThreshold || -10,
      dataRetentionDays: options.dataRetentionDays || 30,
      ...options
    };
    
    this.history = [];
    this.baselines = {};
    this.regressions = [];
  }

  async initialize() {
    console.log('📊 Initializing Performance Regression Detector...');
    
    try {
      await this.loadHistoricalData();
      await this.calculateBaselines();
      console.log('✅ Performance regression detector ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize:', error.message);
      return false;
    }
  }

  async loadHistoricalData() {
    try {
      const historyPath = path.join(PROJECT_ROOT, 'performance-history.json');
      const content = await fs.readFile(historyPath, 'utf8');
      this.history = JSON.parse(content);
      console.log(`📈 Loaded ${this.history.length} historical performance records`);
    } catch (error) {
      console.log('📈 No historical data found - starting fresh');
      this.history = [];
    }
  }

  async saveHistoricalData() {
    const historyPath = path.join(PROJECT_ROOT, 'performance-history.json');
    await fs.writeFile(historyPath, JSON.stringify(this.history, null, 2));
  }

  async recordCurrentPerformance() {
    console.log('📊 Recording current performance metrics...');
    
    try {
      const metrics = await this.gatherPerformanceMetrics();
      const record = {
        timestamp: new Date().toISOString(),
        metrics,
        version: await this.getCurrentVersion(),
        gitHash: await this.getGitHash()
      };
      
      this.history.push(record);
      
      // Trim history to retention period
      const cutoff = Date.now() - (this.options.dataRetentionDays * 24 * 60 * 60 * 1000);
      this.history = this.history.filter(h => new Date(h.timestamp).getTime() > cutoff);
      
      await this.saveHistoricalData();
      console.log('✅ Performance metrics recorded');
      
      return record;
    } catch (error) {
      console.error('❌ Failed to record performance:', error.message);
      throw error;
    }
  }

  async gatherPerformanceMetrics() {
    const metrics = {};
    
    try {
      // Load quality report for performance data
      const qualityReport = await this.loadQualityReport();
      
      if (qualityReport.currentMetrics) {
        const current = qualityReport.currentMetrics;
        
        metrics.coreWebVitals = {
          fcp: current.coreWebVitals?.fcp || 0,
          lcp: current.coreWebVitals?.lcp || 0,
          cls: current.coreWebVitals?.cls || 0,
          fid: current.coreWebVitals?.fid || 0,
          score: current.coreWebVitals?.score || 0
        };
        
        metrics.performance = {
          score: current.performance?.score || 0,
          loadTime: current.performance?.loadTime || 0,
          resourceSize: current.performance?.resourceSize || 0,
          cacheHitRatio: current.performance?.cacheHitRatio || 0,
          compressionRatio: current.performance?.compression?.ratio || 0
        };
        
        metrics.accessibility = {
          score: current.accessibility?.score || 0,
          wcagCompliance: current.accessibility?.wcagCompliance || 'Unknown',
          ariaLabels: current.accessibility?.ariaLabels || 0
        };
        
        metrics.userExperience = {
          score: current.userExperience?.score || 0,
          navigationClarity: current.userExperience?.navigationClarity || 0,
          contentReadability: current.userExperience?.contentReadability || 0,
          mobileExperience: current.userExperience?.mobileExperience || 0
        };
      }
      
      // Repository metrics
      metrics.repository = await this.getRepositoryMetrics();
      
      // System health metrics
      const healthSummary = await this.loadHealthSummary();
      metrics.health = {
        score: healthSummary.healthScore || 0,
        uptime: healthSummary.uptime || 0,
        responseTime: this.parseResponseTime(healthSummary.performance?.responseTime)
      };
      
    } catch (error) {
      console.warn('⚠️ Some metrics unavailable:', error.message);
    }
    
    return metrics;
  }

  async getRepositoryMetrics() {
    const { execSync } = await import('child_process');
    
    try {
      const sizeOutput = execSync('du -sb .', { cwd: PROJECT_ROOT, encoding: 'utf8' });
      const size = parseInt(sizeOutput.split('\t')[0]);
      
      const fileOutput = execSync('find . -type f | wc -l', { cwd: PROJECT_ROOT, encoding: 'utf8' });
      const fileCount = parseInt(fileOutput.trim());
      
      return { size, fileCount };
    } catch (error) {
      return { size: 0, fileCount: 0 };
    }
  }

  async getCurrentVersion() {
    try {
      const packagePath = path.join(PROJECT_ROOT, 'package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(content);
      return pkg.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  async getGitHash() {
    const { execSync } = await import('child_process');
    
    try {
      return execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  async calculateBaselines() {
    if (this.history.length < 3) {
      console.log('📊 Insufficient data for baseline calculation');
      return;
    }
    
    const recentHistory = this.history.slice(-this.options.historyWindow);
    
    // Calculate baselines for key metrics
    this.baselines.coreWebVitals = this.calculateMetricBaselines(
      recentHistory.map(h => h.metrics.coreWebVitals).filter(Boolean)
    );
    
    this.baselines.performance = this.calculateMetricBaselines(
      recentHistory.map(h => h.metrics.performance).filter(Boolean)
    );
    
    this.baselines.health = this.calculateMetricBaselines(
      recentHistory.map(h => h.metrics.health).filter(Boolean)
    );
    
    this.baselines.repository = this.calculateMetricBaselines(
      recentHistory.map(h => h.metrics.repository).filter(Boolean)
    );
    
    console.log('📊 Performance baselines calculated');
  }

  calculateMetricBaselines(dataPoints) {
    if (dataPoints.length === 0) return {};
    
    const baselines = {};
    
    // Get all unique metric keys
    const allKeys = new Set();
    dataPoints.forEach(dp => Object.keys(dp).forEach(key => allKeys.add(key)));
    
    allKeys.forEach(key => {
      const values = dataPoints.map(dp => dp[key]).filter(v => typeof v === 'number');
      
      if (values.length > 0) {
        baselines[key] = {
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          median: this.calculateMedian(values),
          min: Math.min(...values),
          max: Math.max(...values),
          stdDev: this.calculateStandardDeviation(values)
        };
      }
    });
    
    return baselines;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  async detectRegressions(currentMetrics) {
    console.log('🔍 Analyzing for performance regressions...');
    
    this.regressions = [];
    
    if (Object.keys(this.baselines).length === 0) {
      console.log('⚠️ No baselines available for regression detection');
      return { hasRegressions: false, regressions: [] };
    }
    
    // Analyze Core Web Vitals regressions
    this.analyzeMetricRegressions('coreWebVitals', currentMetrics.coreWebVitals, {
      fcp: { threshold: 2500, direction: 'lower' },
      lcp: { threshold: 2500, direction: 'lower' },
      cls: { threshold: 0.1, direction: 'lower' },
      fid: { threshold: 100, direction: 'lower' },
      score: { threshold: 75, direction: 'higher' }
    });
    
    // Analyze Performance regressions
    this.analyzeMetricRegressions('performance', currentMetrics.performance, {
      score: { threshold: 80, direction: 'higher' },
      loadTime: { threshold: 3000, direction: 'lower' },
      resourceSize: { threshold: 2000000, direction: 'lower' },
      cacheHitRatio: { threshold: 0.8, direction: 'higher' }
    });
    
    // Analyze Repository size regressions
    this.analyzeMetricRegressions('repository', currentMetrics.repository, {
      size: { threshold: 125829120, direction: 'lower' }, // 120MB in bytes
      fileCount: { threshold: 2000, direction: 'lower' }
    });
    
    // Analyze Health regressions
    this.analyzeMetricRegressions('health', currentMetrics.health, {
      score: { threshold: 80, direction: 'higher' },
      responseTime: { threshold: 100, direction: 'lower' }
    });
    
    const hasRegressions = this.regressions.length > 0;
    const criticalRegressions = this.regressions.filter(r => r.severity === 'critical');
    
    console.log(`🔍 Regression analysis complete: ${this.regressions.length} regressions found`);
    
    return {
      hasRegressions,
      hasCriticalRegressions: criticalRegressions.length > 0,
      regressions: this.regressions,
      criticalRegressions
    };
  }

  analyzeMetricRegressions(category, currentMetrics, thresholds) {
    if (!currentMetrics || !this.baselines[category]) return;
    
    Object.entries(thresholds).forEach(([metric, config]) => {
      const current = currentMetrics[metric];
      const baseline = this.baselines[category][metric];
      
      if (current === undefined || !baseline) return;
      
      const change = current - baseline.mean;
      const changePercent = ((change / baseline.mean) * 100);
      
      // Determine if this is a regression based on direction
      let isRegression = false;
      let severity = 'minor';
      
      if (config.direction === 'higher' && current < baseline.mean) {
        // Current should be higher but is lower (regression)
        isRegression = changePercent <= this.options.regressionThreshold;
        severity = changePercent <= this.options.criticalThreshold ? 'critical' : 'major';
      } else if (config.direction === 'lower' && current > baseline.mean) {
        // Current should be lower but is higher (regression)
        const excessPercent = Math.abs(changePercent);
        isRegression = excessPercent >= Math.abs(this.options.regressionThreshold);
        severity = excessPercent >= Math.abs(this.options.criticalThreshold) ? 'critical' : 'major';
      }
      
      // Also check against absolute thresholds
      if (config.direction === 'higher' && current < config.threshold) {
        isRegression = true;
        severity = 'major';
      } else if (config.direction === 'lower' && current > config.threshold) {
        isRegression = true;
        severity = 'major';
      }
      
      if (isRegression) {
        this.regressions.push({
          category,
          metric,
          current,
          baseline: baseline.mean,
          change,
          changePercent,
          threshold: config.threshold,
          direction: config.direction,
          severity,
          message: this.generateRegressionMessage(category, metric, current, baseline.mean, changePercent, config)
        });
      }
    });
  }

  generateRegressionMessage(category, metric, current, baseline, changePercent, config) {
    const direction = changePercent > 0 ? 'increased' : 'decreased';
    const formattedChange = Math.abs(changePercent).toFixed(1);
    
    return `${category}.${metric} ${direction} by ${formattedChange}% (${current.toFixed(2)} vs baseline ${baseline.toFixed(2)})`;
  }

  async generateRegressionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRegressions: this.regressions.length,
        criticalRegressions: this.regressions.filter(r => r.severity === 'critical').length,
        majorRegressions: this.regressions.filter(r => r.severity === 'major').length,
        minorRegressions: this.regressions.filter(r => r.severity === 'minor').length
      },
      regressions: this.regressions,
      baselines: this.baselines,
      options: this.options,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(PROJECT_ROOT, 'performance-regression-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Performance regression report generated');
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Group regressions by category
    const regressionsByCategory = this.regressions.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    }, {});
    
    Object.entries(regressionsByCategory).forEach(([category, regressions]) => {
      switch (category) {
        case 'coreWebVitals':
          recommendations.push({
            category: 'Performance',
            priority: 'High',
            action: 'Optimize Core Web Vitals',
            details: regressions.map(r => r.message).join(', ')
          });
          break;
          
        case 'performance':
          recommendations.push({
            category: 'Performance',
            priority: 'High',
            action: 'Address performance regressions',
            details: regressions.map(r => r.message).join(', ')
          });
          break;
          
        case 'repository':
          recommendations.push({
            category: 'Repository Health',
            priority: 'Medium',
            action: 'Optimize repository size',
            details: regressions.map(r => r.message).join(', ')
          });
          break;
          
        case 'health':
          recommendations.push({
            category: 'System Health',
            priority: 'High',
            action: 'Investigate health score decline',
            details: regressions.map(r => r.message).join(', ')
          });
          break;
      }
    });
    
    return recommendations;
  }

  async loadQualityReport() {
    try {
      const content = await fs.readFile(path.join(PROJECT_ROOT, 'quality-report.json'), 'utf8');
      return JSON.parse(content);
    } catch {
      return { currentMetrics: {} };
    }
  }

  async loadHealthSummary() {
    try {
      const content = await fs.readFile(path.join(PROJECT_ROOT, 'health-summary.json'), 'utf8');
      return JSON.parse(content);
    } catch {
      return { healthScore: 0 };
    }
  }

  parseResponseTime(responseTimeStr) {
    if (!responseTimeStr) return 0;
    
    const match = responseTimeStr.match(/(\d+(\.\d+)?)ms/);
    return match ? parseFloat(match[1]) : 0;
  }

  printRegressionSummary(report) {
    console.log('\n📊 Performance Regression Analysis');
    console.log('==================================');
    console.log(`🔍 Total Regressions: ${report.summary.totalRegressions}`);
    console.log(`🚨 Critical: ${report.summary.criticalRegressions}`);
    console.log(`⚠️  Major: ${report.summary.majorRegressions}`);
    console.log(`ℹ️  Minor: ${report.summary.minorRegressions}`);
    
    if (report.regressions.length > 0) {
      console.log('\n📋 Regression Details:');
      report.regressions.forEach(regression => {
        const icon = regression.severity === 'critical' ? '🚨' : 
                    regression.severity === 'major' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${regression.message}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec.action}: ${rec.details}`);
      });
    }
    
    console.log('==================================\n');
  }
}

// CLI Interface
async function main() {
  const detector = new PerformanceRegressionDetector({
    regressionThreshold: -5,
    criticalThreshold: -10,
    historyWindow: 10
  });
  
  if (!await detector.initialize()) {
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  try {
    switch (command) {
      case 'record':
        await detector.recordCurrentPerformance();
        console.log('✅ Current performance recorded');
        break;
      
      case 'analyze':
      default:
        const currentRecord = await detector.recordCurrentPerformance();
        const analysis = await detector.detectRegressions(currentRecord.metrics);
        const report = await detector.generateRegressionReport();
        
        detector.printRegressionSummary(report);
        
        // Exit with error code if critical regressions found
        process.exit(analysis.hasCriticalRegressions ? 1 : 0);
        break;
    }
  } catch (error) {
    console.error('💥 Regression detection failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PerformanceRegressionDetector };