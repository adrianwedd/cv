#!/usr/bin/env node
/**
 * Aggressive Performance Optimizer
 * Target: 80%+ repository size reduction through aggressive data management
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class AggressiveOptimizer {
    constructor() {
        this.stats = {
            filesRemoved: 0,
            sizeReduced: 0,
            directoriesCleared: 0
        };
    }

    /**
     * Aggressively clean time-series activity data
     */
    async cleanActivityData() {
        console.log('🗂️  Aggressive activity data cleanup...');
        
        const activityDir = path.join(rootDir, 'data/activity');
        
        try {
            const files = await fs.readdir(activityDir);
            
            // Keep only the 5 most recent activity files
            const activityFiles = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(activityDir, file);
                    const stats = await fs.stat(filePath);
                    activityFiles.push({ file, path: filePath, mtime: stats.mtime, size: stats.size });
                }
            }
            
            // Sort by modification time (newest first)
            activityFiles.sort((a, b) => b.mtime - a.mtime);
            
            // Remove all but the newest 5 files
            for (let i = 5; i < activityFiles.length; i++) {
                const fileInfo = activityFiles[i];
                console.log(`  Removing old activity: ${fileInfo.file}`);
                await fs.unlink(fileInfo.path);
                this.stats.filesRemoved++;
                this.stats.sizeReduced += fileInfo.size;
            }
            
        } catch (error) {
            console.warn(`  Warning: Could not clean activity data: ${error.message}`);
        }
    }

    /**
     * Remove historical and archive data
     */
    async removeHistoricalData() {
        console.log('📚 Removing historical data and archives...');
        
        const pathsToRemove = [
            'data/activity-analysis-*.json',
            'data/validation-report-*.json', 
            'data/backups',
            'data/archives',
            'data/archive',
            'data/cache-optimized',
            'data/trends',
            'data/metrics',
            'data/intelligence-reports',
            'archive'
        ];

        for (const pattern of pathsToRemove) {
            if (pattern.includes('*')) {
                // Handle wildcard patterns
                const baseDir = path.dirname(path.join(rootDir, pattern));
                const filePattern = path.basename(pattern);
                
                try {
                    const files = await fs.readdir(baseDir);
                    for (const file of files) {
                        if (this.matchesPattern(file, filePattern)) {
                            const fullPath = path.join(baseDir, file);
                            const stats = await fs.stat(fullPath);
                            
                            console.log(`  Removing historical file: ${path.relative(rootDir, fullPath)}`);
                            await fs.unlink(fullPath);
                            this.stats.filesRemoved++;
                            this.stats.sizeReduced += stats.size;
                        }
                    }
                } catch (error) {
                    // Directory doesn't exist or can't be read
                }
            } else {
                // Handle directory patterns
                const fullPath = path.join(rootDir, pattern);
                
                try {
                    const stats = await fs.stat(fullPath);
                    if (stats.isDirectory()) {
                        console.log(`  Removing directory: ${pattern}`);
                        await fs.rm(fullPath, { recursive: true, force: true });
                        this.stats.directoriesCleared++;
                    } else {
                        console.log(`  Removing file: ${pattern}`);
                        await fs.unlink(fullPath);
                        this.stats.filesRemoved++;
                        this.stats.sizeReduced += stats.size;
                    }
                } catch (error) {
                    // File/directory doesn't exist
                }
            }
        }
    }

    /**
     * Compress and consolidate JSON data
     */
    async consolidateJsonData() {
        console.log('🗜️  Consolidating and compressing JSON data...');
        
        const dataDir = path.join(rootDir, 'data');
        
        try {
            const files = await fs.readdir(dataDir);
            
            // Group similar files for potential consolidation
            const reportFiles = files.filter(f => f.includes('report') && f.endsWith('.json'));
            const analysisFiles = files.filter(f => f.includes('analysis') && f.endsWith('.json'));
            
            // Remove redundant reports (keep only latest)
            for (const reportType of ['integrity', 'validation', 'dependency', 'analytics']) {
                const typeFiles = reportFiles.filter(f => f.includes(reportType));
                
                if (typeFiles.length > 1) {
                    // Sort by name (usually contains timestamp) and keep the latest
                    typeFiles.sort().reverse();
                    
                    for (let i = 1; i < typeFiles.length; i++) {
                        const filePath = path.join(dataDir, typeFiles[i]);
                        console.log(`  Removing old report: ${typeFiles[i]}`);
                        
                        try {
                            const stats = await fs.stat(filePath);
                            await fs.unlink(filePath);
                            this.stats.filesRemoved++;
                            this.stats.sizeReduced += stats.size;
                        } catch (error) {
                            // File already deleted or doesn't exist
                        }
                    }
                }
            }
            
            // Compress remaining large files
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(dataDir, file);
                    
                    try {
                        const stats = await fs.stat(filePath);
                        if (stats.size > 1024) { // Files > 1KB
                            const content = await fs.readFile(filePath, 'utf8');
                            const parsed = JSON.parse(content);
                            const compressed = JSON.stringify(parsed);
                            
                            if (compressed.length < content.length) {
                                await fs.writeFile(filePath, compressed);
                                const savings = content.length - compressed.length;
                                this.stats.sizeReduced += savings;
                            }
                        }
                    } catch (error) {
                        // Skip files that can't be processed
                    }
                }
            }
            
        } catch (error) {
            console.warn(`  Warning: Could not consolidate data: ${error.message}`);
        }
    }

    /**
     * Remove large binary assets
     */
    async optimizeAssets() {
        console.log('🖼️  Optimizing large assets...');
        
        const assetPaths = [
            'live-site-screenshot.png',
            'visualization_chart.png',
            'assets/images',
            'assets/*.png',
            'assets/*.jpg'
        ];

        for (const assetPath of assetPaths) {
            const fullPath = path.join(rootDir, assetPath);
            
            try {
                const stats = await fs.stat(fullPath);
                
                if (stats.size > 100000) { // Files > 100KB
                    console.log(`  Removing large asset: ${assetPath} (${(stats.size / 1024).toFixed(0)}KB)`);
                    
                    if (stats.isDirectory()) {
                        await fs.rm(fullPath, { recursive: true, force: true });
                        this.stats.directoriesCleared++;
                    } else {
                        await fs.unlink(fullPath);
                        this.stats.filesRemoved++;
                    }
                    this.stats.sizeReduced += stats.size;
                }
            } catch (error) {
                // File doesn't exist
            }
        }
    }

    /**
     * Run git optimization
     */
    async optimizeGit() {
        console.log('🔧 Optimizing git repository...');
        
        const commands = [
            'git reflog expire --expire=now --all',
            'git gc --prune=now --aggressive',
            'git repack -ad'
        ];

        for (const command of commands) {
            try {
                console.log(`  Running: ${command}`);
                execSync(command, { stdio: 'pipe', cwd: rootDir });
            } catch (error) {
                console.warn(`    Warning: ${command} failed`);
            }
        }
    }

    /**
     * Helper method to match filename patterns with wildcards
     */
    matchesPattern(filename, pattern) {
        const regex = pattern.replace(/\*/g, '.*');
        return new RegExp(`^${regex}$`).test(filename);
    }

    /**
     * Generate summary report
     */
    generateReport() {
        console.log('\n📊 Aggressive Optimization Summary:');
        console.log(`  Files removed: ${this.stats.filesRemoved}`);
        console.log(`  Directories cleared: ${this.stats.directoriesCleared}`);
        console.log(`  Size reduced: ${(this.stats.sizeReduced / 1024 / 1024).toFixed(1)}MB`);
    }

    /**
     * Run complete aggressive optimization
     */
    async run() {
        console.log('⚡ Starting Aggressive Repository Optimization...\n');
        
        const startTime = Date.now();
        
        await this.cleanActivityData();
        await this.removeHistoricalData();
        await this.consolidateJsonData();
        await this.optimizeAssets();
        await this.optimizeGit();
        
        const duration = Date.now() - startTime;
        
        this.generateReport();
        console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log('\n✅ Aggressive optimization complete!');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new AggressiveOptimizer();
    optimizer.run().catch(console.error);
}

export default AggressiveOptimizer;