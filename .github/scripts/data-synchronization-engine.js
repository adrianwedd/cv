#!/usr/bin/env node
/**
 * Data Synchronization Engine - Real-time Data Consistency Framework
 * Manages data refresh, caching, and synchronization across the CV system
 */

import { readFile, writeFile, readdir, mkdir, stat, access } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DataSynchronizationEngine {
    constructor() {
        this.cacheConfig = {
            maxAge: 5 * 60 * 1000, // 5 minutes
            compressionThreshold: 1024, // 1KB
            checksumAlgorithm: 'sha256',
            syncIntervals: {
                critical: 30 * 1000, // 30 seconds
                normal: 5 * 60 * 1000, // 5 minutes
                background: 30 * 60 * 1000 // 30 minutes
            }
        };
        this.dataIndex = new Map();
        this.syncStatus = new Map();
        this.cacheManager = new CacheManager();
        this.checksumRegistry = new Map();
        this.dependencies = new Map();
        this.setupDataDependencies();
    }

    setupDataDependencies() {
        // Define data file dependencies for cascade updates
        this.dependencies.set('base-cv.json', [
            'optimized/base-cv-optimized.json',
            'optimized/base-cv-min.json',
            'data-index.json'
        ]);
        
        this.dependencies.set('activity-summary.json', [
            'optimized/activity-summary-optimized.json',
            'watch-me-work-data.json',
            'data-index.json'
        ]);
        
        this.dependencies.set('ai-enhancements.json', [
            'optimized/chunks/critical.json',
            'data-index.json'
        ]);
    }

    async initializeDataIndex() {
        console.log('📋 Initializing data index...');
        
        const dataPath = join(__dirname, '../../data');
        await this.ensureDirectoryExists(dataPath);
        
        const files = await readdir(dataPath, { withFileTypes: true });
        
        for (const file of files) {
            if (file.isFile() && file.name.endsWith('.json')) {
                await this.indexDataFile(join(dataPath, file.name));
            } else if (file.isDirectory()) {
                // Recursively index subdirectories
                await this.indexDirectory(join(dataPath, file.name));
            }
        }

        await this.saveDataIndex();
        console.log(`✅ Indexed ${this.dataIndex.size} data files`);
    }

    async indexDataFile(filePath) {
        try {
            const stats = await stat(filePath);
            const content = await readFile(filePath, 'utf-8');
            const checksum = this.calculateChecksum(content);
            
            const fileInfo = {
                path: filePath,
                size: stats.size,
                lastModified: stats.mtime.toISOString(),
                checksum,
                type: this.identifyDataType(filePath, content),
                priority: this.determinePriority(filePath),
                dependencies: this.dependencies.get(filePath.split('/').pop()) || [],
                cached: false,
                lastSync: null,
                syncStatus: 'pending'
            };

            this.dataIndex.set(filePath, fileInfo);
            this.checksumRegistry.set(filePath, checksum);
        } catch (error) {
            console.warn(`⚠️ Failed to index ${filePath}: ${error.message}`);
        }
    }

    async indexDirectory(dirPath) {
        try {
            const files = await readdir(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                const fullPath = join(dirPath, file.name);
                
                if (file.isFile() && file.name.endsWith('.json')) {
                    await this.indexDataFile(fullPath);
                } else if (file.isDirectory()) {
                    await this.indexDirectory(fullPath);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Failed to index directory ${dirPath}: ${error.message}`);
        }
    }

    identifyDataType(filePath, content) {
        const filename = filePath.split('/').pop();
        
        if (filename.includes('base-cv')) return 'core_cv_data';
        if (filename.includes('activity')) return 'activity_data';
        if (filename.includes('ai-enhancement')) return 'enhancement_data';
        if (filename.includes('protected-content')) return 'protection_data';
        if (filename.includes('optimization')) return 'optimization_data';
        if (filename.includes('cache')) return 'cache_data';
        if (filename.includes('backup')) return 'backup_data';
        
        try {
            const data = JSON.parse(content);
            if (data.metadata && data.profile) return 'core_cv_data';
            if (data.github_stats) return 'activity_data';
            if (data.enhancements) return 'enhancement_data';
            if (data.protection_rules) return 'protection_data';
        } catch {}
        
        return 'unknown';
    }

    determinePriority(filePath) {
        const filename = filePath.split('/').pop();
        
        if (filename.includes('base-cv') || filename.includes('activity-summary')) return 'critical';
        if (filename.includes('ai-enhancement') || filename.includes('protected-content')) return 'high';
        if (filename.includes('optimization') || filename.includes('cache')) return 'normal';
        if (filename.includes('backup') || filename.includes('archive')) return 'low';
        
        return 'normal';
    }

    async saveDataIndex() {
        const indexPath = join(__dirname, '../../data/data-index.json');
        
        const index = {
            timestamp: new Date().toISOString(),
            total_files: this.dataIndex.size,
            file_types: this.getFileTypeStats(),
            priority_distribution: this.getPriorityStats(),
            cache_status: this.getCacheStats(),
            sync_intervals: this.cacheConfig.syncIntervals,
            files: Array.from(this.dataIndex.entries()).map(([path, info]) => ({
                path: path.replace(join(__dirname, '../../'), ''),
                ...info
            }))
        };

        await writeFile(indexPath, JSON.stringify(index, null, 2));
    }

    getFileTypeStats() {
        const stats = {};
        for (const [, info] of this.dataIndex) {
            stats[info.type] = (stats[info.type] || 0) + 1;
        }
        return stats;
    }

    getPriorityStats() {
        const stats = {};
        for (const [, info] of this.dataIndex) {
            stats[info.priority] = (stats[info.priority] || 0) + 1;
        }
        return stats;
    }

    getCacheStats() {
        let cached = 0, total = 0;
        for (const [, info] of this.dataIndex) {
            total++;
            if (info.cached) cached++;
        }
        return { cached, total, percentage: total > 0 ? Math.round((cached / total) * 100) : 0 };
    }

    async detectDataChanges() {
        console.log('🔍 Detecting data changes...');
        
        const changes = [];
        const currentTime = new Date().toISOString();

        for (const [filePath, indexedInfo] of this.dataIndex) {
            try {
                const stats = await stat(filePath);
                const currentModified = stats.mtime.toISOString();
                
                if (currentModified !== indexedInfo.lastModified) {
                    const content = await readFile(filePath, 'utf-8');
                    const currentChecksum = this.calculateChecksum(content);
                    
                    if (currentChecksum !== indexedInfo.checksum) {
                        changes.push({
                            file: filePath,
                            type: 'modified',
                            lastModified: currentModified,
                            previousChecksum: indexedInfo.checksum,
                            currentChecksum,
                            priority: indexedInfo.priority,
                            dependencies: indexedInfo.dependencies
                        });
                        
                        // Update index
                        indexedInfo.lastModified = currentModified;
                        indexedInfo.checksum = currentChecksum;
                        indexedInfo.syncStatus = 'pending';
                    }
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    changes.push({
                        file: filePath,
                        type: 'deleted',
                        priority: indexedInfo.priority
                    });
                }
            }
        }

        if (changes.length > 0) {
            console.log(`📝 Detected ${changes.length} data changes`);
            await this.processDataChanges(changes);
        }

        return changes;
    }

    async processDataChanges(changes) {
        console.log('⚡ Processing data changes...');
        
        // Sort changes by priority
        const priorityOrder = { 'critical': 0, 'high': 1, 'normal': 2, 'low': 3 };
        changes.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        for (const change of changes) {
            await this.processChange(change);
            
            // Process dependencies if file was modified
            if (change.type === 'modified' && change.dependencies.length > 0) {
                await this.processDependencies(change.dependencies, change.file);
            }
        }

        await this.saveDataIndex();
    }

    async processChange(change) {
        console.log(`🔄 Processing ${change.type} change: ${change.file.split('/').pop()}`);
        
        const fileInfo = this.dataIndex.get(change.file);
        if (!fileInfo) return;

        switch (change.type) {
            case 'modified':
                await this.syncModifiedFile(change.file, fileInfo);
                break;
            case 'deleted':
                await this.handleDeletedFile(change.file, fileInfo);
                break;
        }

        fileInfo.lastSync = new Date().toISOString();
        fileInfo.syncStatus = 'completed';
    }

    async syncModifiedFile(filePath, fileInfo) {
        // Update cache if file is cached
        if (fileInfo.cached) {
            await this.cacheManager.invalidateCache(filePath);
            await this.cacheManager.cacheFile(filePath);
        }

        // Trigger optimization if needed
        if (fileInfo.type === 'core_cv_data') {
            await this.triggerOptimization(filePath);
        }

        console.log(`✅ Synced modified file: ${filePath.split('/').pop()}`);
    }

    async handleDeletedFile(filePath, fileInfo) {
        // Remove from cache
        if (fileInfo.cached) {
            await this.cacheManager.removeFromCache(filePath);
        }

        // Remove from index
        this.dataIndex.delete(filePath);
        this.checksumRegistry.delete(filePath);

        console.log(`🗑️  Removed deleted file from tracking: ${filePath.split('/').pop()}`);
    }

    async processDependencies(dependencies, sourceFile) {
        console.log(`🔗 Processing ${dependencies.length} dependencies for ${sourceFile.split('/').pop()}`);
        
        for (const depPath of dependencies) {
            const fullDepPath = join(__dirname, '../../data', depPath);
            
            try {
                // Check if dependency exists
                await access(fullDepPath);
                
                // Trigger regeneration/update of dependency
                await this.updateDependency(fullDepPath, sourceFile);
                
            } catch (error) {
                console.warn(`⚠️ Dependency not found or failed to update: ${depPath}`);
            }
        }
    }

    async updateDependency(depPath, sourceFile) {
        const depInfo = this.dataIndex.get(depPath);
        if (!depInfo) return;

        // Mark dependency for update
        depInfo.syncStatus = 'pending';
        depInfo.lastSync = new Date().toISOString();

        // If it's an optimized file, trigger optimization
        if (depPath.includes('optimized/')) {
            await this.triggerOptimization(sourceFile);
        }

        console.log(`🔄 Updated dependency: ${depPath.split('/').pop()}`);
    }

    async triggerOptimization(sourceFile) {
        // This would integrate with existing optimization systems
        console.log(`🚀 Triggering optimization pipeline for: ${sourceFile.split('/').pop()}`);
    }

    calculateChecksum(content) {
        return createHash(this.cacheConfig.checksumAlgorithm)
            .update(content)
            .digest('hex');
    }

    async ensureDirectoryExists(dirPath) {
        try {
            await access(dirPath);
        } catch {
            await mkdir(dirPath, { recursive: true });
        }
    }

    async startContinuousSync() {
        console.log('🔄 Starting continuous data synchronization...');
        
        const syncIntervals = this.cacheConfig.syncIntervals;
        
        // Critical files sync
        setInterval(async () => {
            await this.syncByPriority('critical');
        }, syncIntervals.critical);

        // Normal files sync
        setInterval(async () => {
            await this.syncByPriority('normal');
        }, syncIntervals.normal);

        // Background files sync
        setInterval(async () => {
            await this.syncByPriority('low');
        }, syncIntervals.background);

        console.log('✅ Continuous synchronization started');
    }

    async syncByPriority(priority) {
        const filesToSync = Array.from(this.dataIndex.entries())
            .filter(([, info]) => info.priority === priority && info.syncStatus === 'pending');

        if (filesToSync.length === 0) return;

        console.log(`🔄 Syncing ${filesToSync.length} ${priority} priority files`);

        for (const [filePath, fileInfo] of filesToSync) {
            try {
                await this.syncModifiedFile(filePath, fileInfo);
                fileInfo.syncStatus = 'completed';
                fileInfo.lastSync = new Date().toISOString();
            } catch (error) {
                console.error(`❌ Failed to sync ${filePath}: ${error.message}`);
                fileInfo.syncStatus = 'failed';
            }
        }
    }

    async generateSyncReport() {
        const report = {
            timestamp: new Date().toISOString(),
            sync_status: {
                total_files: this.dataIndex.size,
                pending: 0,
                completed: 0,
                failed: 0
            },
            cache_performance: await this.cacheManager.getPerformanceStats(),
            sync_intervals: this.cacheConfig.syncIntervals,
            data_freshness: this.calculateDataFreshness(),
            recommendations: this.generateSyncRecommendations()
        };

        // Calculate sync status
        for (const [, info] of this.dataIndex) {
            if (info.syncStatus === 'pending') report.sync_status.pending++;
            else if (info.syncStatus === 'completed') report.sync_status.completed++;
            else if (info.syncStatus === 'failed') report.sync_status.failed++;
        }

        const reportPath = join(__dirname, '../../data/sync-performance-report.json');
        await writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📊 Sync report generated: ${reportPath}`);
        return report;
    }

    calculateDataFreshness() {
        const now = Date.now();
        const freshness = {
            fresh: 0,    // < 5 minutes
            stale: 0,    // 5 minutes - 1 hour  
            old: 0,      // 1 hour - 1 day
            outdated: 0  // > 1 day
        };

        for (const [, info] of this.dataIndex) {
            if (!info.lastSync) {
                freshness.outdated++;
                continue;
            }

            const age = now - new Date(info.lastSync).getTime();
            if (age < 5 * 60 * 1000) freshness.fresh++;
            else if (age < 60 * 60 * 1000) freshness.stale++;
            else if (age < 24 * 60 * 60 * 1000) freshness.old++;
            else freshness.outdated++;
        }

        return freshness;
    }

    generateSyncRecommendations() {
        const recommendations = [];
        const freshness = this.calculateDataFreshness();
        
        if (freshness.outdated > 0) {
            recommendations.push({
                priority: 'high',
                type: 'data_freshness',
                title: 'Update Outdated Data Files',
                description: `${freshness.outdated} files haven't been synced in over 24 hours`,
                action: 'Run full data synchronization'
            });
        }

        if (freshness.stale > freshness.fresh) {
            recommendations.push({
                priority: 'medium',
                type: 'sync_frequency',
                title: 'Increase Sync Frequency',
                description: 'More files are stale than fresh',
                action: 'Consider reducing sync intervals'
            });
        }

        return recommendations;
    }

    async run() {
        console.log('🔄 Data Synchronization Engine - Real-time Data Consistency Framework');
        console.log('==================================================================\n');

        try {
            await this.initializeDataIndex();
            await this.detectDataChanges();
            
            const report = await this.generateSyncReport();
            
            console.log('\n📊 SYNCHRONIZATION SUMMARY');
            console.log('==========================');
            console.log(`Total Files: ${report.sync_status.total_files}`);
            console.log(`Pending: ${report.sync_status.pending}`);
            console.log(`Completed: ${report.sync_status.completed}`);
            console.log(`Failed: ${report.sync_status.failed}`);
            console.log(`\nData Freshness:`);
            console.log(`  Fresh: ${report.data_freshness.fresh}`);
            console.log(`  Stale: ${report.data_freshness.stale}`);
            console.log(`  Old: ${report.data_freshness.old}`);
            console.log(`  Outdated: ${report.data_freshness.outdated}`);
            
            if (report.recommendations.length > 0) {
                console.log(`\nRecommendations: ${report.recommendations.length}`);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Synchronization failed:', error);
            return false;
        }
    }
}

// Cache Manager class for advanced caching functionality
class CacheManager {
    constructor() {
        this.cacheDir = join(__dirname, '../../data/cache');
        this.compressionEnabled = true;
        this.performanceStats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            compressionRatio: 0
        };
    }

    async cacheFile(filePath) {
        // Placeholder for cache implementation
        console.log(`💾 Caching file: ${filePath.split('/').pop()}`);
        this.performanceStats.hits++;
    }

    async invalidateCache(filePath) {
        console.log(`🔄 Invalidating cache: ${filePath.split('/').pop()}`);
        this.performanceStats.evictions++;
    }

    async removeFromCache(filePath) {
        console.log(`🗑️  Removing from cache: ${filePath.split('/').pop()}`);
    }

    async getPerformanceStats() {
        const total = this.performanceStats.hits + this.performanceStats.misses;
        return {
            ...this.performanceStats,
            hit_rate: total > 0 ? Math.round((this.performanceStats.hits / total) * 100) : 0
        };
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const engine = new DataSynchronizationEngine();
    const success = await engine.run();
    process.exit(success ? 0 : 1);
}

export default DataSynchronizationEngine;