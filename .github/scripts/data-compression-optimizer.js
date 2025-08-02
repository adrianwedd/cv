#!/usr/bin/env node

/**
 * Data Compression Optimizer
 * Compresses oversized GitHub activity and intelligence files for CI efficiency
 */

const fs = require('fs');
const path = require('path');

class DataCompressionOptimizer {
  constructor(dataDir = '../../data') {
    this.dataDir = path.resolve(__dirname, dataDir);
    this.compressionTargets = {
      activity: {
        pattern: /^github-activity-\d{8}-\d{4}\.json$/,
        maxSizeKB: 100,
        compressFields: this.compressActivityData
      },
      intelligence: {
        pattern: /^github-intelligence-.*\.json$/,
        maxSizeKB: 200,
        compressFields: this.compressIntelligenceData
      }
    };
  }

  compressActivityData(data) {
    // Keep only essential fields for dashboard functionality
    const compressed = {
      collection_timestamp: data.collection_timestamp,
      analysis_period_days: data.analysis_period_days,
      user_profile: data.user_profile?.login ? {
        login: data.user_profile.login,
        public_repos: data.user_profile.public_repos
      } : data.user_profile,
      repositories: {
        total_count: data.repositories?.total_count || 0,
        data: []
      },
      recent_activity: data.recent_activity || [],
      commit_stats: data.commit_stats || {},
      language_stats: data.language_stats || {},
      productivity_metrics: data.productivity_metrics || {}
    };

    // Compress repository data - keep only essential fields
    if (data.repositories?.data && Array.isArray(data.repositories.data)) {
      compressed.repositories.data = data.repositories.data.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        size: repo.size,
        topics: repo.topics?.slice(0, 5) || [], // Limit topics
        commit_count: repo.commit_count,
        recent_commits: repo.recent_commits?.slice(0, 3) || [] // Keep only 3 most recent
      }));
    }

    return compressed;
  }

  compressIntelligenceData(data) {
    // Keep only essential intelligence fields
    const compressed = {
      generated_at: data.generated_at,
      analysis_period: data.analysis_period,
      intelligence_summary: data.intelligence_summary,
      key_insights: data.key_insights?.slice(0, 10) || [], // Limit insights
      recommendations: data.recommendations?.slice(0, 5) || [], // Limit recommendations
      metrics: {
        activity_score: data.metrics?.activity_score,
        consistency_score: data.metrics?.consistency_score,
        innovation_index: data.metrics?.innovation_index,
        collaboration_rating: data.metrics?.collaboration_rating
      },
      trends: {
        weekly_commits: data.trends?.weekly_commits,
        language_distribution: data.trends?.language_distribution,
        repository_growth: data.trends?.repository_growth
      },
      compressed_at: new Date().toISOString(),
      original_size_kb: data.original_size_kb || 'unknown'
    };

    return compressed;
  }

  async compressFile(filePath, compressionConfig) {
    try {
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;
      
      if (sizeKB <= compressionConfig.maxSizeKB) {
        return { compressed: false, reason: 'File size acceptable', sizeKB };
      }

      console.log(`🗜️  Compressing ${path.basename(filePath)} (${sizeKB.toFixed(1)}KB)`);
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      data.original_size_kb = sizeKB;
      
      const compressedData = compressionConfig.compressFields.call(this, data);
      
      // Create backup of original
      const backupPath = filePath.replace('.json', '.original.json');
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      
      // Write compressed version
      fs.writeFileSync(filePath, JSON.stringify(compressedData, null, 2));
      
      const newStats = fs.statSync(filePath);
      const newSizeKB = newStats.size / 1024;
      const compressionRatio = ((sizeKB - newSizeKB) / sizeKB * 100).toFixed(1);
      
      console.log(`  ✅ ${sizeKB.toFixed(1)}KB → ${newSizeKB.toFixed(1)}KB (${compressionRatio}% reduction)`);
      console.log(`  💾 Original backed up to: ${path.basename(backupPath)}`);
      
      return {
        compressed: true,
        originalSize: sizeKB,
        newSize: newSizeKB,
        compressionRatio: parseFloat(compressionRatio),
        backupPath
      };
      
    } catch (error) {
      console.error(`  ❌ Compression failed for ${path.basename(filePath)}: ${error.message}`);
      return { compressed: false, reason: error.message };
    }
  }

  async compressOversizedFiles() {
    console.log('🗜️  Starting Data Compression Optimization');
    
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    let filesCompressed = 0;
    
    for (const [dirName, config] of Object.entries(this.compressionTargets)) {
      const dirPath = path.join(this.dataDir, dirName);
      
      if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directory ${dirName}/ not found, skipping`);
        continue;
      }
      
      console.log(`\n📁 Processing ${dirName}/ directory (max size: ${config.maxSizeKB}KB)`);
      
      const files = fs.readdirSync(dirPath)
        .filter(file => config.pattern.test(file))
        .map(file => path.join(dirPath, file));
      
      for (const filePath of files) {
        const result = await this.compressFile(filePath, config);
        
        if (result.compressed) {
          totalOriginalSize += result.originalSize;
          totalCompressedSize += result.newSize;
          filesCompressed++;
        }
      }
    }
    
    // Compress watch-me-work-data.json if needed
    const watchMeWorkPath = path.join(this.dataDir, 'watch-me-work-data.json');
    if (fs.existsSync(watchMeWorkPath)) {
      const result = await this.compressWatchMeWorkData(watchMeWorkPath);
      if (result.compressed) {
        totalOriginalSize += result.originalSize;
        totalCompressedSize += result.newSize;
        filesCompressed++;
      }
    }
    
    console.log('\n📊 Compression Summary');
    console.log('====================');
    console.log(`Files compressed: ${filesCompressed}`);
    if (filesCompressed > 0) {
      const totalReduction = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1);
      console.log(`Total size reduction: ${totalOriginalSize.toFixed(1)}KB → ${totalCompressedSize.toFixed(1)}KB (${totalReduction}%)`);
      console.log(`Space saved: ${(totalOriginalSize - totalCompressedSize).toFixed(1)}KB`);
    }
    
    return {
      filesCompressed,
      totalOriginalSize,
      totalCompressedSize,
      totalReduction: filesCompressed > 0 ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100) : 0
    };
  }

  async compressWatchMeWorkData(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const sizeMB = stats.size / (1024 * 1024);
      
      if (sizeMB <= 1) {
        return { compressed: false, reason: 'File size acceptable', sizeMB };
      }
      
      console.log(`\n🗜️  Compressing watch-me-work-data.json (${sizeMB.toFixed(1)}MB)`);
      
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Create compressed version
      const compressed = {
        metadata: {
          ...data.metadata,
          compressed_at: new Date().toISOString(),
          original_size_mb: sizeMB,
          compression_applied: true
        },
        user: data.user,
        metrics: data.metrics,
        summary: data.summary || {},
        // Keep only last 30 days of activities
        activities: data.activities ? data.activities.slice(-100) : [], // Last 100 activities
        // Compress repositories data
        repositories: data.repositories ? data.repositories.slice(0, 50).map(repo => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          updated: repo.updated_at,
          commits: repo.commit_count
        })) : []
      };
      
      // Backup original
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(path.dirname(filePath), `watch-me-work-data-full-${timestamp}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      
      // Write compressed version
      fs.writeFileSync(filePath, JSON.stringify(compressed, null, 2));
      
      const newStats = fs.statSync(filePath);
      const newSizeMB = newStats.size / (1024 * 1024);
      const compressionRatio = ((sizeMB - newSizeMB) / sizeMB * 100).toFixed(1);
      
      console.log(`  ✅ ${sizeMB.toFixed(1)}MB → ${newSizeMB.toFixed(1)}MB (${compressionRatio}% reduction)`);
      console.log(`  💾 Full data archived to: ${path.basename(backupPath)}`);
      
      return {
        compressed: true,
        originalSize: sizeMB * 1024, // Convert to KB for consistency
        newSize: newSizeMB * 1024,
        compressionRatio: parseFloat(compressionRatio),
        backupPath
      };
      
    } catch (error) {
      console.error(`  ❌ Watch Me Work compression failed: ${error.message}`);
      return { compressed: false, reason: error.message };
    }
  }

  async generateCompressionReport() {
    console.log('\n📋 Current Data File Analysis');
    console.log('============================');
    
    const directories = ['activity', 'intelligence', 'metrics', 'trends'];
    let totalFiles = 0;
    let totalSize = 0;
    let oversizedFiles = 0;
    
    for (const dir of directories) {
      const dirPath = path.join(this.dataDir, dir);
      
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        const dirStats = files.map(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          return { file, size: stats.size };
        });
        
        const dirSize = dirStats.reduce((sum, f) => sum + f.size, 0);
        const oversized = dirStats.filter(f => f.size > 102400).length; // >100KB
        
        totalFiles += files.length;
        totalSize += dirSize;
        oversizedFiles += oversized;
        
        console.log(`  ${dir}/: ${files.length} files (${(dirSize / 1024 / 1024).toFixed(1)}MB) - ${oversized} oversized`);
      }
    }
    
    // Check watch-me-work-data.json
    const watchPath = path.join(this.dataDir, 'watch-me-work-data.json');
    if (fs.existsSync(watchPath)) {
      const stats = fs.statSync(watchPath);
      console.log(`  watch-me-work-data.json: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
      totalSize += stats.size;
      totalFiles++;
      if (stats.size > 1048576) oversizedFiles++; // >1MB
    }
    
    console.log(`\nTotal: ${totalFiles} files (${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
    console.log(`Oversized files needing compression: ${oversizedFiles}`);
    
    return { totalFiles, totalSizeMB: totalSize / 1024 / 1024, oversizedFiles };
  }
}

// CLI interface
if (require.main === module) {
  const optimizer = new DataCompressionOptimizer();
  
  const command = process.argv[2] || 'compress';
  
  switch (command) {
    case 'compress':
      optimizer.compressOversizedFiles().catch(console.error);
      break;
    case 'report':
      optimizer.generateCompressionReport().catch(console.error);
      break;
    default:
      console.log('Usage: node data-compression-optimizer.js [compress|report]');
      process.exit(1);
  }
}

module.exports = DataCompressionOptimizer;