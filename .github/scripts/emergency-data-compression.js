#!/usr/bin/env node

/**
 * Emergency Data Compression Tool
 * 
 * CRITICAL: Compresses oversized data files to prevent repository bloat
 * Targets activity files >100KB, watch-me-work >1MB, intelligence files >500KB
 * 
 * This is an emergency response to the P0 Critical data architecture issue.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmergencyDataCompressor {
    constructor() {
        this.dataDir = path.join(__dirname, '..', '..', 'data');
        this.compressionStats = {
            filesProcessed: 0,
            totalSizeBefore: 0,
            totalSizeAfter: 0,
            compressionRatio: 0
        };
    }

    async compressActivityFile(filePath) {
        try {
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            const originalSize = (await fs.stat(filePath)).size;
            
            const compressed = {
                collectionTimestamp: data.collectionTimestamp || new Date().toISOString(),
                analysisPeriodDays: data.analysisPeriodDays || 30,
                userProfile: { status: "compressed" },
                repositories: this.compressRepositoryData(data.repositories),
                crossRepoActivity: this.compressActivityData(data.crossRepoActivity),
                localRepositoryMetrics: {
                    line_contributions: data.localRepositoryMetrics?.line_contributions || {},
                    commit_frequency: data.localRepositoryMetrics?.commit_frequency || {}
                },
                languageAnalysis: {
                    primary_languages: data.languageAnalysis?.primary_languages?.slice(0, 10) || [],
                    language_distribution: data.languageAnalysis?.language_distribution?.slice(0, 10) || []
                },
                compressionNote: "Compressed by emergency data compression tool"
            };

            await fs.writeFile(filePath, JSON.stringify(compressed, null, 2));
            const newSize = (await fs.stat(filePath)).size;
            
            this.compressionStats.filesProcessed++;
            this.compressionStats.totalSizeBefore += originalSize;
            this.compressionStats.totalSizeAfter += newSize;
            
            const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
            console.log(`✅ Compressed ${path.basename(filePath)}: ${this.formatBytes(originalSize)} → ${this.formatBytes(newSize)} (${reduction}% reduction)`);
            
        } catch (error) {
            console.error(`❌ Failed to compress ${filePath}:`, error.message);
        }
    }

    compressRepositoryData(repoData) {
        if (!repoData || !repoData.data) return { data: [], summary: repoData?.summary || {} };
        
        return {
            data: repoData.data.slice(0, 50).map(repo => ({
                name: repo.name,
                description: repo.description?.substring(0, 200) || null,
                language: repo.language,
                stars: repo.stargazers_count,
                updated: repo.updated_at,
                size: repo.size,
                topics: repo.topics?.slice(0, 5) || [],
                private: repo.private,
                fork: repo.fork,
                default_branch: repo.default_branch
            })),
            summary: repoData.summary || {}
        };
    }

    compressActivityData(activityData) {
        if (!activityData || !activityData.recent_activity) return activityData;
        
        return {
            ...activityData,
            recent_activity: activityData.recent_activity.slice(0, 100).map(activity => ({
                type: activity.type,
                repo: activity.repo?.name,
                created_at: activity.created_at,
                action: activity.payload?.action || activity.type
            }))
        };
    }

    async compressWatchMeWorkData(filePath) {
        try {
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            const originalSize = (await fs.stat(filePath)).size;
            
            const compressed = {
                timestamp: data.timestamp || new Date().toISOString(),
                summary: {
                    total_repos: data.repositories?.length || 0,
                    active_repos: data.repositories?.filter(r => r.recent_activity)?.length || 0,
                    total_commits: data.total_commits || 0,
                    top_languages: data.language_distribution?.slice(0, 10) || []
                },
                recent_activity: data.recent_activity?.slice(0, 50) || [],
                activity_summary: data.activity_summary || {},
                compressionNote: "Compressed by emergency data compression tool"
            };

            await fs.writeFile(filePath, JSON.stringify(compressed, null, 2));
            const newSize = (await fs.stat(filePath)).size;
            
            this.compressionStats.filesProcessed++;
            this.compressionStats.totalSizeBefore += originalSize;
            this.compressionStats.totalSizeAfter += newSize;
            
            const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
            console.log(`✅ Compressed ${path.basename(filePath)}: ${this.formatBytes(originalSize)} → ${this.formatBytes(newSize)} (${reduction}% reduction)`);
            
        } catch (error) {
            console.error(`❌ Failed to compress ${filePath}:`, error.message);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async findOversizedFiles() {
        const oversizedFiles = [];
        
        // Find activity files >100KB
        const activityDir = path.join(this.dataDir, 'activity');
        try {
            const activityFiles = await fs.readdir(activityDir);
            for (const file of activityFiles) {
                if (file.endsWith('.json') && !file.includes('.original')) {
                    const filePath = path.join(activityDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.size > 100 * 1024) { // 100KB
                        oversizedFiles.push({ path: filePath, size: stats.size, type: 'activity' });
                    }
                }
            }
        } catch (error) {
            console.warn(`Could not read activity directory: ${error.message}`);
        }

        // Find watch-me-work files >1MB
        try {
            const dataFiles = await fs.readdir(this.dataDir);
            for (const file of dataFiles) {
                if (file.startsWith('watch-me-work') && file.endsWith('.json')) {
                    const filePath = path.join(this.dataDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.size > 1024 * 1024) { // 1MB
                        oversizedFiles.push({ path: filePath, size: stats.size, type: 'watch-me-work' });
                    }
                }
            }
        } catch (error) {
            console.warn(`Could not read data directory: ${error.message}`);
        }

        // Find intelligence files >500KB
        const intelligenceDir = path.join(this.dataDir, 'intelligence');
        try {
            const intelligenceFiles = await fs.readdir(intelligenceDir);
            for (const file of intelligenceFiles) {
                if (file.endsWith('.json') && !file.includes('.original')) {
                    const filePath = path.join(intelligenceDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.size > 500 * 1024) { // 500KB
                        oversizedFiles.push({ path: filePath, size: stats.size, type: 'intelligence' });
                    }
                }
            }
        } catch (error) {
            console.warn(`Could not read intelligence directory: ${error.message}`);
        }

        return oversizedFiles;
    }

    async run() {
        console.log('🚨 **EMERGENCY DATA COMPRESSION INITIATED**');
        console.log('Target: Compress all oversized data files to prevent repository bloat');
        console.log('');

        const oversizedFiles = await this.findOversizedFiles();
        
        if (oversizedFiles.length === 0) {
            console.log('✅ No oversized files found - all files within size limits');
            return;
        }

        console.log(`🎯 Found ${oversizedFiles.length} oversized files requiring compression:`);
        
        for (const file of oversizedFiles) {
            console.log(`  • ${path.basename(file.path)} (${this.formatBytes(file.size)}) - ${file.type}`);
        }
        
        console.log('');
        console.log('🔄 Starting compression process...');
        
        for (const file of oversizedFiles) {
            if (file.type === 'activity' || file.type === 'intelligence') {
                await this.compressActivityFile(file.path);
            } else if (file.type === 'watch-me-work') {
                await this.compressWatchMeWorkData(file.path);
            }
        }

        // Calculate final statistics
        if (this.compressionStats.filesProcessed > 0) {
            this.compressionStats.compressionRatio = 
                ((this.compressionStats.totalSizeBefore - this.compressionStats.totalSizeAfter) / 
                 this.compressionStats.totalSizeBefore * 100).toFixed(1);
            
            console.log('');
            console.log('📊 **COMPRESSION SUMMARY:**');
            console.log(`  • Files processed: ${this.compressionStats.filesProcessed}`);
            console.log(`  • Total size before: ${this.formatBytes(this.compressionStats.totalSizeBefore)}`);
            console.log(`  • Total size after: ${this.formatBytes(this.compressionStats.totalSizeAfter)}`);
            console.log(`  • Total reduction: ${this.compressionStats.compressionRatio}%`);
            console.log(`  • Space saved: ${this.formatBytes(this.compressionStats.totalSizeBefore - this.compressionStats.totalSizeAfter)}`);
            console.log('');
            console.log('✅ **EMERGENCY COMPRESSION COMPLETE** - Repository bloat eliminated');
        }
    }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const compressor = new EmergencyDataCompressor();
    compressor.run().catch(console.error);
}

export { EmergencyDataCompressor };