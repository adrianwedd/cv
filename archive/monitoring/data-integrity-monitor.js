#!/usr/bin/env node

/**
 * Data Integrity Monitor - Real-time Data Health Monitoring System
 * 
 * Provides continuous monitoring of data integrity with automated
 * alerts and recovery suggestions.
 * 
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

class DataIntegrityMonitor {
  constructor() {
    this.alerts = [];
    this.metrics = {
      checksums: new Map(),
      sizes: new Map(),
      timestamps: new Map()
    };
    this.thresholds = {
      maxFileSizeMB: 10,
      maxDirectorySizeMB: 50,
      maxFileAgeDays: 30,
      minIntegrityScore: 80
    };
  }

  async monitor() {
    console.log('🔍 Data Integrity Monitor - Starting Real-time Monitoring\n');

    const report = {
      timestamp: new Date().toISOString(),
      status: 'HEALTHY',
      integrity_score: 100,
      alerts: [],
      metrics: {
        total_files: 0,
        total_size_mb: 0,
        corrupted_files: 0,
        missing_files: 0,
        outdated_files: 0
      },
      recommendations: [],
      critical_files: [],
      performance: {
        scan_time_ms: 0,
        files_per_second: 0
      }
    };

    const startTime = Date.now();

    try {
      // 1. Check critical files
      report.critical_files = await this.checkCriticalFiles();

      // 2. Scan data directory
      const scanResults = await this.scanDataDirectory();
      report.metrics = { ...report.metrics, ...scanResults };

      // 3. Verify checksums
      const checksumResults = await this.verifyChecksums();
      report.metrics.corrupted_files = checksumResults.corrupted;

      // 4. Check for anomalies
      const anomalies = await this.detectAnomalies();
      report.alerts.push(...anomalies);

      // 5. Monitor size limits
      const sizeAlerts = await this.checkSizeLimits();
      report.alerts.push(...sizeAlerts);

      // 6. Check data freshness
      const freshnessAlerts = await this.checkDataFreshness();
      report.alerts.push(...freshnessAlerts);

      // 7. Validate relationships
      const relationshipIssues = await this.validateDataRelationships();
      report.alerts.push(...relationshipIssues);

      // Calculate integrity score
      report.integrity_score = this.calculateIntegrityScore(report);

      // Determine status
      if (report.integrity_score < 50) {
        report.status = 'CRITICAL';
      } else if (report.integrity_score < 80) {
        report.status = 'WARNING';
      } else {
        report.status = 'HEALTHY';
      }

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);

      // Performance metrics
      const endTime = Date.now();
      report.performance.scan_time_ms = endTime - startTime;
      report.performance.files_per_second = 
        (report.metrics.total_files / (report.performance.scan_time_ms / 1000)).toFixed(2);

      // Save report
      const reportPath = path.join(ROOT_DIR, 'data', 'integrity-monitor-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

      // Display results
      this.displayReport(report);

      return report;

    } catch (error) {
      console.error('❌ Monitoring Error:', error.message);
      report.status = 'ERROR';
      report.alerts.push({
        type: 'system_error',
        severity: 'critical',
        message: error.message
      });
      return report;
    }
  }

  async checkCriticalFiles() {
    console.log('📁 Checking Critical Files...\n');

    const criticalFiles = [
      { path: 'data/base-cv.json', required: true },
      { path: 'data/activity-summary.json', required: true },
      { path: 'data/protected-content.json', required: false },
      { path: 'index.html', required: true },
      { path: 'assets/styles.css', required: true },
      { path: 'assets/script.js', required: true }
    ];

    const results = [];

    for (const file of criticalFiles) {
      const filePath = path.join(ROOT_DIR, file.path);
      const result = {
        file: file.path,
        status: 'OK',
        size_kb: 0,
        last_modified: null,
        checksum: null
      };

      try {
        const stats = await fs.stat(filePath);
        result.size_kb = (stats.size / 1024).toFixed(2);
        result.last_modified = stats.mtime.toISOString();

        // Calculate checksum for JSON files
        if (file.path.endsWith('.json')) {
          const content = await fs.readFile(filePath, 'utf-8');
          result.checksum = this.calculateChecksum(content);
        }

      } catch (error) {
        if (file.required) {
          result.status = 'MISSING';
          this.alerts.push({
            type: 'missing_critical_file',
            severity: 'critical',
            file: file.path
          });
        } else {
          result.status = 'OPTIONAL_MISSING';
        }
      }

      results.push(result);
    }

    const criticalCount = results.filter(r => r.status === 'OK').length;
    console.log(`   ✓ ${criticalCount}/${criticalFiles.filter(f => f.required).length} critical files present\n`);

    return results;
  }

  async scanDataDirectory() {
    const dataDir = path.join(ROOT_DIR, 'data');
    const metrics = {
      total_files: 0,
      total_size_mb: 0,
      file_types: {},
      largest_files: []
    };

    const files = await this.getAllFiles(dataDir);
    metrics.total_files = files.length;

    for (const file of files) {
      const stats = await fs.stat(file);
      const sizeMB = stats.size / 1024 / 1024;
      metrics.total_size_mb += sizeMB;

      // Track file types
      const ext = path.extname(file);
      metrics.file_types[ext] = (metrics.file_types[ext] || 0) + 1;

      // Track largest files
      metrics.largest_files.push({
        path: file.replace(ROOT_DIR, ''),
        size_mb: sizeMB.toFixed(2)
      });

      // Store metrics
      this.metrics.sizes.set(file, stats.size);
      this.metrics.timestamps.set(file, stats.mtime);
    }

    // Sort and limit largest files
    metrics.largest_files.sort((a, b) => parseFloat(b.size_mb) - parseFloat(a.size_mb));
    metrics.largest_files = metrics.largest_files.slice(0, 5);

    metrics.total_size_mb = parseFloat(metrics.total_size_mb.toFixed(2));

    return metrics;
  }

  async verifyChecksums() {
    console.log('🔐 Verifying File Checksums...\n');

    const results = {
      verified: 0,
      corrupted: 0,
      issues: []
    };

    // Check JSON files
    const dataDir = path.join(ROOT_DIR, 'data');
    const jsonFiles = await this.getFilesByExtension(dataDir, '.json');

    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const checksum = this.calculateChecksum(content);

        // Check if file has embedded checksum
        try {
          const data = JSON.parse(content);
          if (data.metadata?.data_integrity?.checksum) {
            if (data.metadata.data_integrity.checksum !== checksum) {
              results.corrupted++;
              results.issues.push({
                file: file.replace(ROOT_DIR, ''),
                issue: 'checksum_mismatch'
              });
            } else {
              results.verified++;
            }
          }
        } catch {
          // Not valid JSON or no checksum field
        }

        // Store current checksum
        this.metrics.checksums.set(file, checksum);

      } catch (error) {
        results.issues.push({
          file: file.replace(ROOT_DIR, ''),
          issue: 'read_error',
          error: error.message
        });
      }
    }

    console.log(`   ✓ Verified: ${results.verified}, Corrupted: ${results.corrupted}\n`);
    return results;
  }

  async detectAnomalies() {
    const anomalies = [];

    // Check for duplicate files
    const checksumMap = new Map();
    for (const [file, checksum] of this.metrics.checksums) {
      if (checksumMap.has(checksum)) {
        anomalies.push({
          type: 'duplicate_file',
          severity: 'low',
          files: [checksumMap.get(checksum), file].map(f => f.replace(ROOT_DIR, ''))
        });
      } else {
        checksumMap.set(checksum, file);
      }
    }

    // Check for empty files
    for (const [file, size] of this.metrics.sizes) {
      if (size === 0) {
        anomalies.push({
          type: 'empty_file',
          severity: 'medium',
          file: file.replace(ROOT_DIR, '')
        });
      }
    }

    // Check for unusually large files
    for (const [file, size] of this.metrics.sizes) {
      const sizeMB = size / 1024 / 1024;
      if (sizeMB > this.thresholds.maxFileSizeMB) {
        anomalies.push({
          type: 'oversized_file',
          severity: 'medium',
          file: file.replace(ROOT_DIR, ''),
          size_mb: sizeMB.toFixed(2)
        });
      }
    }

    return anomalies;
  }

  async checkSizeLimits() {
    const alerts = [];
    const dataDir = path.join(ROOT_DIR, 'data');
    const totalSize = await this.getDirectorySize(dataDir);
    const sizeMB = totalSize / 1024 / 1024;

    if (sizeMB > this.thresholds.maxDirectorySizeMB) {
      alerts.push({
        type: 'directory_size_exceeded',
        severity: 'high',
        directory: 'data',
        size_mb: sizeMB.toFixed(2),
        limit_mb: this.thresholds.maxDirectorySizeMB
      });
    }

    // Check individual subdirectories
    const subdirs = ['activity', 'metrics', 'backups', 'archive'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(dataDir, subdir);
      try {
        const subdirSize = await this.getDirectorySize(subdirPath);
        const subdirSizeMB = subdirSize / 1024 / 1024;
        
        if (subdirSizeMB > 10) {
          alerts.push({
            type: 'subdirectory_large',
            severity: 'medium',
            directory: subdir,
            size_mb: subdirSizeMB.toFixed(2)
          });
        }
      } catch {
        // Directory doesn't exist
      }
    }

    return alerts;
  }

  async checkDataFreshness() {
    const alerts = [];
    const now = Date.now();
    const maxAge = this.thresholds.maxFileAgeDays * 24 * 60 * 60 * 1000;

    // Check critical files for staleness
    const criticalFiles = [
      'data/base-cv.json',
      'data/activity-summary.json'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(ROOT_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        const age = now - stats.mtime.getTime();
        
        if (age > maxAge) {
          alerts.push({
            type: 'stale_data',
            severity: 'medium',
            file: file,
            age_days: Math.floor(age / (24 * 60 * 60 * 1000))
          });
        }
      } catch {
        // File doesn't exist
      }
    }

    return alerts;
  }

  async validateDataRelationships() {
    const issues = [];

    try {
      // Check CV and activity data consistency
      const cvPath = path.join(ROOT_DIR, 'data', 'base-cv.json');
      const activityPath = path.join(ROOT_DIR, 'data', 'activity-summary.json');

      const cvData = JSON.parse(await fs.readFile(cvPath, 'utf-8'));
      const activityData = JSON.parse(await fs.readFile(activityPath, 'utf-8'));

      // Check GitHub profile consistency
      if (cvData.profile?.contact?.github) {
        const githubUsername = cvData.profile.contact.github.split('/').pop();
        const hasMatchingRepo = activityData.repositories?.some(repo => 
          repo.name?.toLowerCase().includes(githubUsername.toLowerCase())
        );

        if (!hasMatchingRepo && activityData.repositories?.length > 0) {
          issues.push({
            type: 'data_inconsistency',
            severity: 'low',
            description: 'GitHub username may not match activity data'
          });
        }
      }

      // Check for skills mentioned in CV but not in activity
      if (cvData.expertise?.programming_languages && activityData.github_stats?.languages) {
        const cvLanguages = cvData.expertise.programming_languages.map(l => l.toLowerCase());
        const activityLanguages = Object.keys(activityData.github_stats.languages).map(l => l.toLowerCase());
        
        const missingInActivity = cvLanguages.filter(lang => 
          !activityLanguages.some(aLang => aLang.includes(lang) || lang.includes(aLang))
        );

        if (missingInActivity.length > 3) {
          issues.push({
            type: 'skills_mismatch',
            severity: 'low',
            description: `${missingInActivity.length} skills in CV not reflected in activity`
          });
        }
      }

    } catch (error) {
      issues.push({
        type: 'validation_error',
        severity: 'medium',
        description: error.message
      });
    }

    return issues;
  }

  calculateIntegrityScore(report) {
    let score = 100;

    // Deduct for alerts
    report.alerts.forEach(alert => {
      switch (alert.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });

    // Deduct for corrupted files
    score -= report.metrics.corrupted_files * 15;

    // Deduct for missing critical files
    const missingCritical = report.critical_files.filter(f => f.status === 'MISSING').length;
    score -= missingCritical * 25;

    return Math.max(0, Math.min(100, score));
  }

  generateRecommendations(report) {
    const recommendations = [];

    if (report.integrity_score < 80) {
      recommendations.push('Run data-architect.js backup to create a safety backup');
    }

    if (report.metrics.total_size_mb > this.thresholds.maxDirectorySizeMB) {
      recommendations.push('Run data-architect.js optimize to reduce data directory size');
    }

    if (report.metrics.corrupted_files > 0) {
      recommendations.push('Restore corrupted files from backup using data-architect.js restore');
    }

    const staleAlerts = report.alerts.filter(a => a.type === 'stale_data');
    if (staleAlerts.length > 0) {
      recommendations.push('Update stale data files - run CV enhancement workflow');
    }

    const oversizedAlerts = report.alerts.filter(a => a.type === 'oversized_file');
    if (oversizedAlerts.length > 0) {
      recommendations.push('Compress or archive oversized files to improve performance');
    }

    if (recommendations.length === 0) {
      recommendations.push('Data integrity is excellent - no actions required');
    }

    return recommendations;
  }

  displayReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATA INTEGRITY MONITORING REPORT');
    console.log('='.repeat(60));

    // Status indicator
    const statusEmoji = {
      'HEALTHY': '✅',
      'WARNING': '⚠️',
      'CRITICAL': '🚨',
      'ERROR': '❌'
    };

    console.log(`\nStatus: ${statusEmoji[report.status]} ${report.status}`);
    console.log(`Integrity Score: ${report.integrity_score}%`);
    console.log(`Scan Time: ${report.performance.scan_time_ms}ms`);

    // Metrics
    console.log('\n📈 Metrics:');
    console.log(`   • Total Files: ${report.metrics.total_files}`);
    console.log(`   • Total Size: ${report.metrics.total_size_mb} MB`);
    console.log(`   • Corrupted Files: ${report.metrics.corrupted_files}`);
    console.log(`   • Missing Files: ${report.metrics.missing_files}`);

    // Alerts
    if (report.alerts.length > 0) {
      console.log('\n⚠️ Alerts:');
      const criticalAlerts = report.alerts.filter(a => a.severity === 'critical');
      const highAlerts = report.alerts.filter(a => a.severity === 'high');
      const mediumAlerts = report.alerts.filter(a => a.severity === 'medium');
      const lowAlerts = report.alerts.filter(a => a.severity === 'low');

      if (criticalAlerts.length > 0) {
        console.log(`   🚨 Critical: ${criticalAlerts.length}`);
        criticalAlerts.forEach(a => console.log(`      - ${a.type}: ${a.message || a.file || ''}`));
      }
      if (highAlerts.length > 0) {
        console.log(`   🔴 High: ${highAlerts.length}`);
      }
      if (mediumAlerts.length > 0) {
        console.log(`   🟡 Medium: ${mediumAlerts.length}`);
      }
      if (lowAlerts.length > 0) {
        console.log(`   🟢 Low: ${lowAlerts.length}`);
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });

    console.log('\n' + '='.repeat(60));
  }

  // Utility methods

  calculateChecksum(data) {
    return createHash('sha256').update(data).digest('hex');
  }

  async getAllFiles(dir, files = []) {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dir, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.')) {
        await this.getAllFiles(itemPath, files);
      } else if (item.isFile()) {
        files.push(itemPath);
      }
    }

    return files;
  }

  async getFilesByExtension(dir, ext) {
    const allFiles = await this.getAllFiles(dir);
    return allFiles.filter(file => path.extname(file) === ext);
  }

  async getDirectorySize(dir) {
    let totalSize = 0;

    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return totalSize;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new DataIntegrityMonitor();
  monitor.monitor();
}

export default DataIntegrityMonitor;