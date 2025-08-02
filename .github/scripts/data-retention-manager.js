#!/usr/bin/env node

/**
 * Data Retention Manager
 * Manages timestamped data files to prevent repository bloat
 */

const fs = require('fs');
const path = require('path');

class DataRetentionManager {
  constructor(dataDir = '../../data') {
    this.dataDir = path.resolve(__dirname, dataDir);
    this.retentionPolicies = {
      'activity': { keep: 7, pattern: /^github-activity-\d{8}-\d{4}\.json$/ },
      'metrics': { keep: 7, pattern: /^professional-development-\d{8}-\d{4}\.json$/ },
      'trends': { keep: 7, pattern: /^activity-trends-\d{8}-\d{4}\.json$/ },
      'intelligence': { keep: 3, pattern: /^github-intelligence-.*\.json$/ },
      'narratives': { keep: 3, pattern: /^professional-narratives-.*\.json$/ }
    };
  }

  async cleanupDirectory(dirName) {
    const dirPath = path.join(this.dataDir, dirName);
    const policy = this.retentionPolicies[dirName];
    
    if (!policy || !fs.existsSync(dirPath)) {
      return { cleaned: 0, kept: 0 };
    }

    console.log(`\n🧹 Cleaning ${dirName}/ directory (keep ${policy.keep} most recent)`);
    
    const files = fs.readdirSync(dirPath)
      .filter(file => policy.pattern.test(file))
      .map(file => ({
        name: file,
        path: path.join(dirPath, file),
        mtime: fs.statSync(path.join(dirPath, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Most recent first

    const toKeep = files.slice(0, policy.keep);
    const toRemove = files.slice(policy.keep);

    // Remove old files
    let cleaned = 0;
    for (const file of toRemove) {
      try {
        fs.unlinkSync(file.path);
        console.log(`  🗑️  Removed: ${file.name}`);
        cleaned++;
      } catch (error) {
        console.error(`  ❌ Failed to remove ${file.name}: ${error.message}`);
      }
    }

    console.log(`  ✅ Kept ${toKeep.length} files, removed ${cleaned} files`);
    return { cleaned, kept: toKeep.length };
  }

  async compressLargeFiles() {
    const watchMeWorkPath = path.join(this.dataDir, 'watch-me-work-data.json');
    
    if (!fs.existsSync(watchMeWorkPath)) {
      return { compressed: false, reason: 'File not found' };
    }

    const stats = fs.statSync(watchMeWorkPath);
    const sizeMB = stats.size / (1024 * 1024);
    
    console.log(`\n📊 Analyzing watch-me-work-data.json (${sizeMB.toFixed(1)}MB)`);
    
    if (sizeMB > 5) {
      try {
        const data = JSON.parse(fs.readFileSync(watchMeWorkPath, 'utf8'));
        
        // Archive full data with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archivePath = path.join(this.dataDir, `watch-me-work-data-${timestamp}.json`);
        fs.writeFileSync(archivePath, JSON.stringify(data, null, 2));
        
        // Create compressed version (keep only recent 30 days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        const compressedData = {
          ...data,
          metadata: {
            ...data.metadata,
            compressed_at: new Date().toISOString(),
            original_size_mb: sizeMB,
            lookback_days: 30
          }
        };
        
        // Filter activities to last 30 days only
        if (data.activities && Array.isArray(data.activities)) {
          compressedData.activities = data.activities.filter(activity => {
            const activityDate = new Date(activity.created_at || activity.date);
            return activityDate >= cutoffDate;
          });
        }
        
        fs.writeFileSync(watchMeWorkPath, JSON.stringify(compressedData, null, 2));
        const newSizeMB = fs.statSync(watchMeWorkPath).size / (1024 * 1024);
        
        console.log(`  📦 Archived full data to: watch-me-work-data-${timestamp}.json`);
        console.log(`  🗜️  Compressed from ${sizeMB.toFixed(1)}MB to ${newSizeMB.toFixed(1)}MB`);
        
        return { compressed: true, originalSize: sizeMB, newSize: newSizeMB };
      } catch (error) {
        console.error(`  ❌ Compression failed: ${error.message}`);
        return { compressed: false, reason: error.message };
      }
    }
    
    return { compressed: false, reason: 'File size acceptable' };
  }

  async generateSummaryReport() {
    console.log('\n📋 Data Retention Summary Report');
    console.log('================================');
    
    let totalFiles = 0;
    let totalSize = 0;
    
    for (const [dirName, policy] of Object.entries(this.retentionPolicies)) {
      const dirPath = path.join(this.dataDir, dirName);
      
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        const dirSize = files.reduce((size, file) => {
          return size + fs.statSync(path.join(dirPath, file)).size;
        }, 0);
        
        totalFiles += files.length;
        totalSize += dirSize;
        
        console.log(`  ${dirName}/: ${files.length} files (${(dirSize / 1024 / 1024).toFixed(1)}MB)`);
      }
    }
    
    console.log(`\nTotal: ${totalFiles} JSON files (${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
    return { totalFiles, totalSizeMB: totalSize / 1024 / 1024 };
  }

  async cleanup() {
    console.log('🧹 Starting Data Retention Cleanup');
    
    let totalCleaned = 0;
    let totalKept = 0;
    
    // Cleanup timestamped directories
    for (const dirName of Object.keys(this.retentionPolicies)) {
      const result = await this.cleanupDirectory(dirName);
      totalCleaned += result.cleaned;
      totalKept += result.kept;
    }
    
    // Compress large files
    const compressionResult = await this.compressLargeFiles();
    
    // Generate final report
    const summaryResult = await this.generateSummaryReport();
    
    console.log('\n✅ Cleanup completed');
    console.log(`   📁 Files kept: ${totalKept}`);
    console.log(`   🗑️  Files removed: ${totalCleaned}`);
    if (compressionResult.compressed) {
      console.log(`   🗜️  Large file compressed: ${compressionResult.originalSize.toFixed(1)}MB → ${compressionResult.newSize.toFixed(1)}MB`);
    }
    
    return {
      filesKept: totalKept,
      filesRemoved: totalCleaned,
      compression: compressionResult,
      summary: summaryResult
    };
  }
}

// CLI interface
if (require.main === module) {
  const manager = new DataRetentionManager();
  
  const command = process.argv[2] || 'cleanup';
  
  switch (command) {
    case 'cleanup':
      manager.cleanup().catch(console.error);
      break;
    case 'report':
      manager.generateSummaryReport().catch(console.error);
      break;
    case 'compress':
      manager.compressLargeFiles().catch(console.error);
      break;
    default:
      console.log('Usage: node data-retention-manager.js [cleanup|report|compress]');
      process.exit(1);
  }
}

module.exports = DataRetentionManager;