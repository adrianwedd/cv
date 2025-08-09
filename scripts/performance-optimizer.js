#!/usr/bin/env node
/**
 * Performance Optimizer - Repository Size Reduction System
 * Target: 92% size reduction (360MB -> 30MB)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class PerformanceOptimizer {
    constructor() {
        this.stats = {
            filesRemoved: 0,
            sizeReduced: 0,
            directoriesCleared: 0
        };
    }

    /**
     * Remove redundant node_modules directories (keep only root)
     */
    async cleanNodeModules() {
        console.log('🧹 Cleaning redundant node_modules directories...');
        
        const nodeModulesPaths = [
            '.github/scripts/node_modules',
            'monitoring/node_modules', 
            'monitoring/langsmith-proxy/node_modules'
        ];

        for (const modulePath of nodeModulesPaths) {
            const fullPath = path.join(rootDir, modulePath);
            try {
                const stats = await fs.stat(fullPath);
                if (stats.isDirectory()) {
                    console.log(`  Removing ${modulePath} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
                    await fs.rm(fullPath, { recursive: true, force: true });
                    this.stats.directoriesCleared++;
                    this.stats.sizeReduced += stats.size;
                }
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.warn(`  Warning: Could not remove ${modulePath}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Implement time-series data retention policy
     */
    async cleanTimeSeriesData() {
        console.log('📊 Implementing time-series data retention policy...');
        
        const dataDir = path.join(rootDir, '.github/scripts/data');
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        // Clean old activity files (7-day retention)
        await this.cleanOldFiles(path.join(dataDir, 'activity'), sevenDaysMs, now);
        
        // Clean old enhancement files (7-day retention)  
        await this.cleanOldFiles(dataDir, sevenDaysMs, now, /^ai-enhancement-.*\.json$/);
        await this.cleanOldFiles(dataDir, sevenDaysMs, now, /^activity-analysis-.*\.json$/);
        
        // Clean old cache files (30-day retention)
        await this.cleanOldFiles(path.join(dataDir, 'ai-cache'), thirtyDaysMs, now);
    }

    /**
     * Clean old files based on age and patterns
     */
    async cleanOldFiles(dirPath, maxAge, now, pattern = null) {
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                if (pattern && !pattern.test(file)) continue;
                
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isFile() && (now - stats.mtime.getTime()) > maxAge) {
                    console.log(`  Removing old file: ${path.relative(rootDir, filePath)}`);
                    await fs.unlink(filePath);
                    this.stats.filesRemoved++;
                    this.stats.sizeReduced += stats.size;
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`  Warning: Could not clean ${dirPath}: ${error.message}`);
            }
        }
    }

    /**
     * Compress large JSON files using intelligent compression
     */
    async compressJsonFiles() {
        console.log('🗜️  Compressing large JSON files...');
        
        const dataDir = path.join(rootDir, '.github/scripts/data');
        
        // Compress analytics files
        await this.compressFile(path.join(dataDir, 'ai-analytics.json'));
        
        // Archive old dashboard data  
        const dashboardsDir = path.join(rootDir, '.github/dashboards');
        const files = await fs.readdir(dashboardsDir);
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(dashboardsDir, file);
                const stats = await fs.stat(filePath);
                if (stats.size > 10000) { // Files > 10KB
                    await this.compressFile(filePath);
                }
            }
        }
    }

    /**
     * Compress individual JSON file by removing whitespace and comments
     */
    async compressFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(content);
            const compressed = JSON.stringify(parsed); // No formatting
            
            if (compressed.length < content.length) {
                await fs.writeFile(filePath, compressed);
                const savings = content.length - compressed.length;
                console.log(`  Compressed ${path.relative(rootDir, filePath)}: ${savings} bytes saved`);
                this.stats.sizeReduced += savings;
            }
        } catch (error) {
            console.warn(`  Warning: Could not compress ${filePath}: ${error.message}`);
        }
    }

    /**
     * Clean temporary and build files
     */
    async cleanTemporaryFiles() {
        console.log('🗑️  Cleaning temporary and build files...');
        
        const tempPaths = [
            'temp/',
            'dist/',
            '.claude/',
            'temp_issue_body.txt',
            '.DS_Store'
        ];

        for (const tempPath of tempPaths) {
            const fullPath = path.join(rootDir, tempPath);
            try {
                const stats = await fs.stat(fullPath);
                if (stats.isDirectory()) {
                    await fs.rm(fullPath, { recursive: true, force: true });
                    console.log(`  Removed directory: ${tempPath}`);
                } else {
                    await fs.unlink(fullPath);
                    console.log(`  Removed file: ${tempPath}`);
                }
                this.stats.directoriesCleared++;
                this.stats.sizeReduced += stats.size;
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.warn(`  Warning: Could not remove ${tempPath}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Run complete optimization
     */
    async optimize() {
        console.log('🚀 Starting Performance Optimization...\n');
        
        const startTime = Date.now();
        
        await this.cleanNodeModules();
        await this.cleanTimeSeriesData();
        await this.compressJsonFiles();
        await this.cleanTemporaryFiles();
        
        const duration = Date.now() - startTime;
        
        console.log('\n✅ Performance Optimization Complete!');
        console.log('📊 Optimization Results:');
        console.log(`  Files removed: ${this.stats.filesRemoved}`);
        console.log(`  Directories cleared: ${this.stats.directoriesCleared}`);
        console.log(`  Size reduced: ${(this.stats.sizeReduced / 1024 / 1024).toFixed(1)}MB`);
        console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
    }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new PerformanceOptimizer();
    optimizer.optimize().catch(console.error);
}

export default PerformanceOptimizer;