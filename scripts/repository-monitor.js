#!/usr/bin/env node
/**
 * Repository Monitor - Size Growth Prevention & Performance Alerting
 * Monitors repository health and prevents size bloat
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

class RepositoryMonitor {
    constructor() {
        this.thresholds = {
            // Size thresholds in MB
            repositorySize: 30,
            jsonFileCount: 50,
            dataDirectorySize: 5,
            singleFileSize: 1,
            
            // Performance thresholds
            buildTimeSeconds: 30,
            ciPipelineMinutes: 3,
            
            // Age thresholds in days
            dataRetentionDays: 7,
            cacheRetentionHours: 24
        };

        this.alerts = [];
    }

    /**
     * Monitor repository size and structure
     */
    async monitorRepositorySize() {
        console.log('📊 Monitoring repository size...');
        
        // Get directory sizes
        const sizes = await this.getDirectorySizes();
        const totalSizeMB = sizes.total / 1024 / 1024;
        
        console.log(`  Total repository size: ${totalSizeMB.toFixed(1)}MB`);
        
        if (totalSizeMB > this.thresholds.repositorySize) {
            this.alerts.push({
                level: 'ERROR',
                type: 'REPOSITORY_SIZE',
                message: `Repository size ${totalSizeMB.toFixed(1)}MB exceeds ${this.thresholds.repositorySize}MB threshold`,
                recommendation: 'Run performance optimizer to reduce size'
            });
        }

        // Monitor specific directories
        for (const [dir, sizeBytes] of Object.entries(sizes.directories)) {
            const sizeMB = sizeBytes / 1024 / 1024;
            if (dir === 'data' && sizeMB > this.thresholds.dataDirectorySize) {
                this.alerts.push({
                    level: 'WARNING',
                    type: 'DATA_SIZE',
                    message: `Data directory ${sizeMB.toFixed(1)}MB exceeds ${this.thresholds.dataDirectorySize}MB threshold`,
                    recommendation: 'Run data retention manager'
                });
            }
        }
    }

    /**
     * Monitor JSON file count and sizes
     */
    async monitorJsonFiles() {
        console.log('📄 Monitoring JSON files...');
        
        const jsonFiles = await this.findJsonFiles();
        
        console.log(`  Total JSON files: ${jsonFiles.length}`);
        
        if (jsonFiles.length > this.thresholds.jsonFileCount) {
            this.alerts.push({
                level: 'WARNING',
                type: 'JSON_COUNT',
                message: `${jsonFiles.length} JSON files exceed ${this.thresholds.jsonFileCount} threshold`,
                recommendation: 'Implement data archiving and cleanup'
            });
        }

        // Check for large files
        for (const file of jsonFiles) {
            if (file.sizeMB > this.thresholds.singleFileSize) {
                this.alerts.push({
                    level: 'INFO',
                    type: 'LARGE_FILE',
                    message: `File ${file.relativePath} is ${file.sizeMB.toFixed(1)}MB`,
                    recommendation: 'Consider compressing or archiving large files'
                });
            }
        }
    }

    /**
     * Monitor data age and implement automatic cleanup
     */
    async monitorDataAge() {
        console.log('📅 Monitoring data age...');
        
        const dataDir = path.join(rootDir, '.github/scripts/data');
        const now = Date.now();
        const retentionMs = this.thresholds.dataRetentionDays * 24 * 60 * 60 * 1000;
        
        try {
            const files = await fs.readdir(dataDir, { withFileTypes: true });
            let oldFileCount = 0;
            
            for (const file of files) {
                if (file.isFile() && file.name.endsWith('.json')) {
                    const filePath = path.join(dataDir, file.name);
                    const stats = await fs.stat(filePath);
                    const age = now - stats.mtime.getTime();
                    
                    if (age > retentionMs) {
                        oldFileCount++;
                    }
                }
            }
            
            if (oldFileCount > 0) {
                this.alerts.push({
                    level: 'INFO',
                    type: 'OLD_DATA',
                    message: `${oldFileCount} files older than ${this.thresholds.dataRetentionDays} days`,
                    recommendation: 'Run data retention manager to clean old files'
                });
            }
        } catch (error) {
            console.warn(`  Warning: Could not monitor data age: ${error.message}`);
        }
    }

    /**
     * Monitor build and CI performance
     */
    async monitorPerformance() {
        console.log('⚡ Monitoring performance metrics...');
        
        // Check for package.json to estimate build time
        try {
            const packageJsonPath = path.join(rootDir, 'package.json');
            await fs.access(packageJsonPath);
            
            // Simulate build time check (in real implementation, measure actual builds)
            const estimatedBuildTime = await this.estimateBuildTime();
            
            if (estimatedBuildTime > this.thresholds.buildTimeSeconds) {
                this.alerts.push({
                    level: 'WARNING',
                    type: 'BUILD_PERFORMANCE',
                    message: `Estimated build time ${estimatedBuildTime}s exceeds ${this.thresholds.buildTimeSeconds}s threshold`,
                    recommendation: 'Optimize dependencies and build processes'
                });
            }
        } catch (error) {
            // No package.json or build system detected
        }
    }

    /**
     * Get directory sizes using du command
     */
    async getDirectorySizes() {
        try {
            const duOutput = execSync('du -s * .* 2>/dev/null || true', { 
                cwd: rootDir, 
                encoding: 'utf8' 
            });
            
            const lines = duOutput.trim().split('\n').filter(line => line);
            const directories = {};
            let total = 0;
            
            for (const line of lines) {
                const [sizeKB, dir] = line.split('\t');
                if (sizeKB && dir && !dir.startsWith('.')) {
                    const sizeBytes = parseInt(sizeKB) * 1024;
                    directories[dir] = sizeBytes;
                    total += sizeBytes;
                }
            }
            
            return { total, directories };
        } catch (error) {
            console.warn(`  Warning: Could not measure directory sizes: ${error.message}`);
            return { total: 0, directories: {} };
        }
    }

    /**
     * Find all JSON files and their sizes
     */
    async findJsonFiles() {
        const jsonFiles = [];
        
        async function scanDirectory(dir) {
            try {
                const items = await fs.readdir(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    
                    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
                        await scanDirectory(fullPath);
                    } else if (item.isFile() && item.name.endsWith('.json')) {
                        const stats = await fs.stat(fullPath);
                        jsonFiles.push({
                            fullPath,
                            relativePath: path.relative(rootDir, fullPath),
                            sizeMB: stats.size / 1024 / 1024,
                            mtime: stats.mtime
                        });
                    }
                }
            } catch (error) {
                // Skip directories we can't access
            }
        }
        
        await scanDirectory(rootDir);
        return jsonFiles;
    }

    /**
     * Estimate build time based on complexity
     */
    async estimateBuildTime() {
        try {
            const packageJsonPath = path.join(rootDir, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            // Estimate based on dependency count
            const depCount = Object.keys(packageJson.dependencies || {}).length + 
                           Object.keys(packageJson.devDependencies || {}).length;
            
            // Simple heuristic: 0.5s per dependency + base 5s
            return Math.max(5, depCount * 0.5);
        } catch (error) {
            return 10; // Default estimate
        }
    }

    /**
     * Generate alert summary
     */
    generateAlertSummary() {
        console.log('\n🚨 Alert Summary:');
        
        if (this.alerts.length === 0) {
            console.log('  ✅ No alerts - repository health is good!');
            return;
        }

        const errorAlerts = this.alerts.filter(a => a.level === 'ERROR');
        const warningAlerts = this.alerts.filter(a => a.level === 'WARNING');
        const infoAlerts = this.alerts.filter(a => a.level === 'INFO');

        if (errorAlerts.length > 0) {
            console.log(`  🚨 ${errorAlerts.length} ERROR(S):`);
            errorAlerts.forEach(alert => {
                console.log(`     • ${alert.message}`);
                console.log(`       → ${alert.recommendation}`);
            });
        }

        if (warningAlerts.length > 0) {
            console.log(`  ⚠️  ${warningAlerts.length} WARNING(S):`);
            warningAlerts.forEach(alert => {
                console.log(`     • ${alert.message}`);
                console.log(`       → ${alert.recommendation}`);
            });
        }

        if (infoAlerts.length > 0) {
            console.log(`  ℹ️  ${infoAlerts.length} INFO:`);
            infoAlerts.forEach(alert => {
                console.log(`     • ${alert.message}`);
            });
        }
    }

    /**
     * Generate automated maintenance suggestions
     */
    generateMaintenancePlan() {
        console.log('\n🔧 Automated Maintenance Plan:');
        
        const hasErrors = this.alerts.some(a => a.level === 'ERROR');
        const hasWarnings = this.alerts.some(a => a.level === 'WARNING');
        
        if (hasErrors) {
            console.log('  🚨 IMMEDIATE ACTION REQUIRED:');
            console.log('     1. Run: node scripts/performance-optimizer.js');
            console.log('     2. Run: node scripts/data-retention-manager.js');
            console.log('     3. Check git repository size');
        } else if (hasWarnings) {
            console.log('  ⚠️  RECOMMENDED ACTIONS:');
            console.log('     1. Run: node scripts/data-retention-manager.js');
            console.log('     2. Consider running performance optimizer');
        } else {
            console.log('  ✅ PREVENTIVE MAINTENANCE:');
            console.log('     1. Schedule weekly data cleanup');
            console.log('     2. Monitor for size growth trends');
        }

        console.log('\n  📅 AUTOMATION SCHEDULE:');
        console.log('     • Daily: Monitor repository health');
        console.log('     • Weekly: Run data retention manager');
        console.log('     • Monthly: Run full performance optimization');
    }

    /**
     * Run complete monitoring
     */
    async run() {
        console.log('🔍 Starting Repository Health Monitoring...\n');
        
        const startTime = Date.now();
        
        await this.monitorRepositorySize();
        await this.monitorJsonFiles();
        await this.monitorDataAge();
        await this.monitorPerformance();
        
        const duration = Date.now() - startTime;
        
        this.generateAlertSummary();
        this.generateMaintenancePlan();
        
        console.log(`\n⏱️  Monitoring completed in ${(duration / 1000).toFixed(1)}s`);
        
        // Return exit code based on alert levels
        const hasErrors = this.alerts.some(a => a.level === 'ERROR');
        return hasErrors ? 1 : 0;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const monitor = new RepositoryMonitor();
    monitor.run().then(exitCode => process.exit(exitCode)).catch(console.error);
}

export default RepositoryMonitor;