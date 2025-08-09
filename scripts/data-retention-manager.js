#!/usr/bin/env node
/**
 * Data Retention Manager - Intelligent Time-Series Data Management
 * Implements 7-day metrics retention, 30-day analytics retention
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class DataRetentionManager {
    constructor() {
        this.config = {
            // Retention policies in milliseconds
            metrics: 7 * 24 * 60 * 60 * 1000,      // 7 days
            analytics: 30 * 24 * 60 * 60 * 1000,   // 30 days
            cache: 24 * 60 * 60 * 1000,            // 1 day
            
            // File patterns
            patterns: {
                activity: /^github-activity-\d{8}-\d{2}-\d+\.json$/,
                enhancement: /^ai-enhancement-.*\.json$/,
                analysis: /^activity-analysis-.*\.json$/,
                cache: /^[a-f0-9]{16}\.json$/
            },

            // Compression thresholds
            compressionThreshold: 5000, // 5KB
            archiveThreshold: 50       // Keep max 50 files per type
        };

        this.stats = {
            filesArchived: 0,
            filesDeleted: 0,
            sizeReduced: 0,
            filesCompressed: 0
        };
    }

    /**
     * Main retention management process
     */
    async manageRetention() {
        console.log('🗂️  Starting Data Retention Management...\n');
        
        const dataDir = path.join(rootDir, '.github/scripts/data');
        
        // Clean activity files (7-day retention)
        await this.cleanActivityFiles(path.join(dataDir, 'activity'));
        
        // Clean enhancement files (7-day retention)
        await this.cleanEnhancementFiles(dataDir);
        
        // Clean cache files (1-day retention)
        await this.cleanCacheFiles(path.join(dataDir, 'ai-cache'));
        
        // Archive dashboard data
        await this.archiveDashboardData();
        
        // Compress remaining files
        await this.compressLargeFiles(dataDir);
    }

    /**
     * Clean activity files with intelligent archiving
     */
    async cleanActivityFiles(activityDir) {
        console.log('📈 Managing activity files...');
        
        try {
            const files = await fs.readdir(activityDir);
            const activityFiles = files
                .filter(f => this.config.patterns.activity.test(f))
                .map(f => ({ name: f, path: path.join(activityDir, f) }));

            // Sort by modification time (newest first)
            const fileStats = await Promise.all(
                activityFiles.map(async (file) => {
                    const stats = await fs.stat(file.path);
                    return { ...file, mtime: stats.mtime, size: stats.size };
                })
            );
            fileStats.sort((a, b) => b.mtime - a.mtime);

            // Keep last 10 files, archive older files beyond retention
            const now = Date.now();
            const keepCount = 10;
            
            for (let i = 0; i < fileStats.length; i++) {
                const file = fileStats[i];
                const age = now - file.mtime.getTime();
                
                if (i >= keepCount && age > this.config.metrics) {
                    console.log(`  Removing old activity file: ${file.name}`);
                    await fs.unlink(file.path);
                    this.stats.filesDeleted++;
                    this.stats.sizeReduced += file.size;
                }
            }
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`  Warning: Could not manage activity files: ${error.message}`);
            }
        }
    }

    /**
     * Clean enhancement and analysis files
     */
    async cleanEnhancementFiles(dataDir) {
        console.log('🤖 Managing AI enhancement files...');
        
        const now = Date.now();
        
        try {
            const files = await fs.readdir(dataDir);
            
            for (const file of files) {
                if (this.config.patterns.enhancement.test(file) || 
                    this.config.patterns.analysis.test(file)) {
                    
                    const filePath = path.join(dataDir, file);
                    const stats = await fs.stat(filePath);
                    const age = now - stats.mtime.getTime();
                    
                    if (age > this.config.metrics) {
                        console.log(`  Removing old enhancement file: ${file}`);
                        await fs.unlink(filePath);
                        this.stats.filesDeleted++;
                        this.stats.sizeReduced += stats.size;
                    }
                }
            }
        } catch (error) {
            console.warn(`  Warning: Could not manage enhancement files: ${error.message}`);
        }
    }

    /**
     * Clean cache files (aggressive 1-day retention)
     */
    async cleanCacheFiles(cacheDir) {
        console.log('🗄️  Managing cache files...');
        
        const now = Date.now();
        
        try {
            const files = await fs.readdir(cacheDir);
            
            for (const file of files) {
                if (this.config.patterns.cache.test(file)) {
                    const filePath = path.join(cacheDir, file);
                    const stats = await fs.stat(filePath);
                    const age = now - stats.mtime.getTime();
                    
                    if (age > this.config.cache) {
                        console.log(`  Removing old cache file: ${file}`);
                        await fs.unlink(filePath);
                        this.stats.filesDeleted++;
                        this.stats.sizeReduced += stats.size;
                    }
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`  Warning: Could not manage cache files: ${error.message}`);
            }
        }
    }

    /**
     * Archive large dashboard files
     */
    async archiveDashboardData() {
        console.log('📊 Managing dashboard data...');
        
        const dashboardDir = path.join(rootDir, '.github/dashboards');
        const archiveDir = path.join(rootDir, 'archive/dashboards');
        
        try {
            await fs.mkdir(archiveDir, { recursive: true });
            const files = await fs.readdir(dashboardDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(dashboardDir, file);
                    const stats = await fs.stat(filePath);
                    
                    // Archive files larger than 10KB or older than 30 days
                    const age = Date.now() - stats.mtime.getTime();
                    if (stats.size > 10000 || age > this.config.analytics) {
                        const archivePath = path.join(archiveDir, file);
                        
                        // Compress before archiving
                        const content = await fs.readFile(filePath, 'utf8');
                        const compressed = JSON.stringify(JSON.parse(content));
                        
                        await fs.writeFile(archivePath, compressed);
                        await fs.unlink(filePath);
                        
                        console.log(`  Archived dashboard file: ${file}`);
                        this.stats.filesArchived++;
                    }
                }
            }
        } catch (error) {
            console.warn(`  Warning: Could not manage dashboard data: ${error.message}`);
        }
    }

    /**
     * Compress large files to reduce I/O overhead
     */
    async compressLargeFiles(dataDir) {
        console.log('🗜️  Compressing large files...');
        
        try {
            const files = await fs.readdir(dataDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(dataDir, file);
                    const stats = await fs.stat(filePath);
                    
                    if (stats.size > this.config.compressionThreshold) {
                        const content = await fs.readFile(filePath, 'utf8');
                        
                        try {
                            const parsed = JSON.parse(content);
                            const compressed = JSON.stringify(parsed);
                            
                            if (compressed.length < content.length) {
                                await fs.writeFile(filePath, compressed);
                                const savings = content.length - compressed.length;
                                console.log(`  Compressed ${file}: ${savings} bytes saved`);
                                this.stats.filesCompressed++;
                                this.stats.sizeReduced += savings;
                            }
                        } catch (parseError) {
                            console.warn(`  Warning: Could not parse ${file}: ${parseError.message}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`  Warning: Could not compress files: ${error.message}`);
        }
    }

    /**
     * Generate retention report
     */
    generateReport() {
        console.log('\n📋 Data Retention Report:');
        console.log(`  Files deleted: ${this.stats.filesDeleted}`);
        console.log(`  Files archived: ${this.stats.filesArchived}`);
        console.log(`  Files compressed: ${this.stats.filesCompressed}`);
        console.log(`  Total size reduced: ${(this.stats.sizeReduced / 1024).toFixed(1)}KB`);
    }

    /**
     * Run complete data retention management
     */
    async run() {
        const startTime = Date.now();
        
        await this.manageRetention();
        
        const duration = Date.now() - startTime;
        
        this.generateReport();
        console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log('\n✅ Data Retention Management Complete!');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new DataRetentionManager();
    manager.run().catch(console.error);
}

export default DataRetentionManager;