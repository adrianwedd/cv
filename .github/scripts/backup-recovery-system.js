#!/usr/bin/env node
/**
 * Backup and Recovery System - Enterprise Data Protection Framework
 * Automated backup creation, validation, and recovery procedures
 */

import { readFile, writeFile, readdir, mkdir, copyFile, stat, access, rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createHash } from 'crypto';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BackupRecoverySystem {
    constructor() {
        this.backupConfig = {
            retentionPolicies: {
                hourly: { keep: 24, schedule: '0 * * * *' },      // Keep 24 hourly backups
                daily: { keep: 30, schedule: '0 0 * * *' },       // Keep 30 daily backups
                weekly: { keep: 12, schedule: '0 0 * * 0' },      // Keep 12 weekly backups
                monthly: { keep: 12, schedule: '0 0 1 * *' }      // Keep 12 monthly backups
            },
            compressionEnabled: true,
            encryptionEnabled: false, // Would require encryption key management
            verificationEnabled: true,
            incrementalBackups: true,
            maxBackupSize: 100 * 1024 * 1024, // 100MB
            backupSources: [
                'data/base-cv.json',
                'data/activity-summary.json',
                'data/ai-enhancements.json',
                'data/protected-content.json',
                'data/cv-schema.json',
                'data/optimized/',
                'data/cache/'
            ]
        };
        this.backupRegistry = new Map();
        this.recoveryPoints = new Map();
        this.backupMetrics = {
            totalBackups: 0,
            totalSize: 0,
            lastBackup: null,
            successfulBackups: 0,
            failedBackups: 0,
            averageBackupTime: 0,
            compressionRatio: 0
        };
    }

    async initializeBackupSystem() {
        console.log('🔧 Initializing backup system...');
        
        const backupRoot = join(__dirname, '../../data/backups');
        await this.ensureDirectoryExists(backupRoot);
        
        // Create backup type directories
        for (const type of Object.keys(this.backupConfig.retentionPolicies)) {
            await this.ensureDirectoryExists(join(backupRoot, type));
        }
        
        // Initialize recovery point directory
        await this.ensureDirectoryExists(join(backupRoot, 'recovery-points'));
        
        // Load existing backup registry
        await this.loadBackupRegistry();
        
        console.log('✅ Backup system initialized');
    }

    async loadBackupRegistry() {
        try {
            const registryPath = join(__dirname, '../../data/backup-registry.json');
            const registryData = JSON.parse(await readFile(registryPath, 'utf-8'));
            
            if (registryData.backups) {
                for (const backup of registryData.backups) {
                    this.backupRegistry.set(backup.id, backup);
                }
            }
            
            this.backupMetrics = { ...this.backupMetrics, ...registryData.metrics };
            
            console.log(`📋 Loaded ${this.backupRegistry.size} backup entries from registry`);
        } catch (error) {
            console.log('📋 Creating new backup registry');
            this.backupRegistry.clear();
        }
    }

    async saveBackupRegistry() {
        const registryPath = join(__dirname, '../../data/backup-registry.json');
        
        const registryData = {
            updated: new Date().toISOString(),
            metrics: this.backupMetrics,
            total_backups: this.backupRegistry.size,
            backup_sources: this.backupConfig.backupSources,
            retention_policies: this.backupConfig.retentionPolicies,
            backups: Array.from(this.backupRegistry.values())
        };
        
        await writeFile(registryPath, JSON.stringify(registryData, null, 2));
    }

    async createBackup(type = 'manual', sources = null) {
        const startTime = Date.now();
        console.log(`💾 Creating ${type} backup...`);
        
        const backupId = `${type}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
        const backupDir = join(__dirname, '../../data/backups', type, backupId);
        
        await this.ensureDirectoryExists(backupDir);
        
        const backupInfo = {
            id: backupId,
            type,
            timestamp: new Date().toISOString(),
            sources: sources || this.backupConfig.backupSources,
            status: 'in_progress',
            files: [],
            totalSize: 0,
            compressedSize: 0,
            checksums: {},
            errors: []
        };
        
        try {
            // Backup each source
            for (const source of backupInfo.sources) {
                await this.backupSource(source, backupDir, backupInfo);
            }
            
            // Create backup manifest
            await this.createBackupManifest(backupDir, backupInfo);
            
            // Verify backup integrity
            if (this.backupConfig.verificationEnabled) {
                const verified = await this.verifyBackup(backupDir, backupInfo);
                if (!verified) {
                    throw new Error('Backup verification failed');
                }
            }
            
            backupInfo.status = 'completed';
            backupInfo.duration = Date.now() - startTime;
            backupInfo.compressionRatio = backupInfo.totalSize > 0 ? 
                (backupInfo.totalSize - backupInfo.compressedSize) / backupInfo.totalSize : 0;
            
            // Update metrics
            this.backupMetrics.totalBackups++;
            this.backupMetrics.successfulBackups++;
            this.backupMetrics.totalSize += backupInfo.compressedSize;
            this.backupMetrics.lastBackup = backupInfo.timestamp;
            this.backupMetrics.averageBackupTime = 
                (this.backupMetrics.averageBackupTime * (this.backupMetrics.successfulBackups - 1) + backupInfo.duration) / 
                this.backupMetrics.successfulBackups;
            this.backupMetrics.compressionRatio = 
                (this.backupMetrics.compressionRatio * (this.backupMetrics.successfulBackups - 1) + backupInfo.compressionRatio) / 
                this.backupMetrics.successfulBackups;
            
            // Register backup
            this.backupRegistry.set(backupId, backupInfo);
            await this.saveBackupRegistry();
            
            console.log(`✅ Backup completed: ${backupId} (${Math.round(backupInfo.duration / 1000)}s)`);
            console.log(`   Files: ${backupInfo.files.length}`);
            console.log(`   Size: ${this.formatBytes(backupInfo.totalSize)} -> ${this.formatBytes(backupInfo.compressedSize)}`);
            console.log(`   Compression: ${Math.round(backupInfo.compressionRatio * 100)}%`);
            
            return backupInfo;
            
        } catch (error) {
            backupInfo.status = 'failed';
            backupInfo.error = error.message;
            backupInfo.duration = Date.now() - startTime;
            
            this.backupMetrics.failedBackups++;
            this.backupRegistry.set(backupId, backupInfo);
            await this.saveBackupRegistry();
            
            console.error(`❌ Backup failed: ${error.message}`);
            throw error;
        }
    }

    async backupSource(source, backupDir, backupInfo) {
        const sourcePath = join(__dirname, '../../', source);
        
        try {
            const sourceStats = await stat(sourcePath);
            
            if (sourceStats.isFile()) {
                await this.backupFile(sourcePath, backupDir, backupInfo, source);
            } else if (sourceStats.isDirectory()) {
                await this.backupDirectory(sourcePath, backupDir, backupInfo, source);
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`⚠️ Source not found: ${source}`);
            } else {
                backupInfo.errors.push(`Failed to backup ${source}: ${error.message}`);
                throw error;
            }
        }
    }

    async backupFile(sourceFile, backupDir, backupInfo, relativePath) {
        const fileName = relativePath.replace(/\//g, '_');
        let destFile = join(backupDir, fileName);
        
        // Read and checksum source file
        const content = await readFile(sourceFile, 'utf-8');
        const checksum = createHash('sha256').update(content).digest('hex');
        const originalSize = Buffer.byteLength(content, 'utf-8');
        
        backupInfo.checksums[relativePath] = checksum;
        backupInfo.totalSize += originalSize;
        
        // Compress if enabled and file is large enough
        if (this.backupConfig.compressionEnabled && originalSize > 1024) {
            destFile += '.gz';
            await this.compressFile(sourceFile, destFile);
            const compressedStats = await stat(destFile);
            backupInfo.compressedSize += compressedStats.size;
        } else {
            await copyFile(sourceFile, destFile);
            backupInfo.compressedSize += originalSize;
        }
        
        backupInfo.files.push({
            source: relativePath,
            destination: fileName + (destFile.endsWith('.gz') ? '.gz' : ''),
            checksum,
            originalSize,
            compressed: destFile.endsWith('.gz')
        });
    }

    async backupDirectory(sourceDir, backupDir, backupInfo, relativePath) {
        const files = await readdir(sourceDir, { withFileTypes: true });
        
        for (const file of files) {
            const filePath = join(sourceDir, file.name);
            const fileRelativePath = join(relativePath, file.name);
            
            if (file.isFile()) {
                await this.backupFile(filePath, backupDir, backupInfo, fileRelativePath);
            } else if (file.isDirectory()) {
                await this.backupDirectory(filePath, backupDir, backupInfo, fileRelativePath);
            }
        }
    }

    async compressFile(sourceFile, destFile) {
        const gzip = createGzip();
        const source = createReadStream(sourceFile);
        const destination = createWriteStream(destFile);
        
        await pipeline(source, gzip, destination);
    }

    async decompressFile(sourceFile, destFile) {
        const gunzip = createGunzip();
        const source = createReadStream(sourceFile);
        const destination = createWriteStream(destFile);
        
        await pipeline(source, gunzip, destination);
    }

    async createBackupManifest(backupDir, backupInfo) {
        const manifestPath = join(backupDir, 'backup-manifest.json');
        
        const manifest = {
            ...backupInfo,
            created_by: 'BackupRecoverySystem',
            version: '1.0.0',
            backup_config: {
                compression_enabled: this.backupConfig.compressionEnabled,
                verification_enabled: this.backupConfig.verificationEnabled,
                encryption_enabled: this.backupConfig.encryptionEnabled
            }
        };
        
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    }

    async verifyBackup(backupDir, backupInfo) {
        console.log('🔍 Verifying backup integrity...');
        
        try {
            // Verify manifest exists
            const manifestPath = join(backupDir, 'backup-manifest.json');
            await access(manifestPath);
            
            // Verify all backed up files exist and have correct checksums
            for (const fileInfo of backupInfo.files) {
                const backupFilePath = join(backupDir, fileInfo.destination);
                await access(backupFilePath);
                
                // For compressed files, decompress and verify checksum
                if (fileInfo.compressed) {
                    const tempFile = backupFilePath + '.temp';
                    await this.decompressFile(backupFilePath, tempFile);
                    
                    const content = await readFile(tempFile, 'utf-8');
                    const checksum = createHash('sha256').update(content).digest('hex');
                    
                    await rm(tempFile);
                    
                    if (checksum !== fileInfo.checksum) {
                        throw new Error(`Checksum mismatch for ${fileInfo.source}`);
                    }
                } else {
                    const content = await readFile(backupFilePath, 'utf-8');
                    const checksum = createHash('sha256').update(content).digest('hex');
                    
                    if (checksum !== fileInfo.checksum) {
                        throw new Error(`Checksum mismatch for ${fileInfo.source}`);
                    }
                }
            }
            
            console.log('✅ Backup verification passed');
            return true;
        } catch (error) {
            console.error(`❌ Backup verification failed: ${error.message}`);
            return false;
        }
    }

    async createRecoveryPoint(description = 'Manual recovery point') {
        console.log('🎯 Creating recovery point...');
        
        const recoveryPointId = `rp-${Date.now()}`;
        const backupInfo = await this.createBackup('recovery-point');
        
        const recoveryPoint = {
            id: recoveryPointId,
            timestamp: new Date().toISOString(),
            description,
            backup_id: backupInfo.id,
            data_state_hash: await this.calculateDataStateHash(),
            verified: true
        };
        
        this.recoveryPoints.set(recoveryPointId, recoveryPoint);
        
        // Save recovery points registry
        const recoveryPath = join(__dirname, '../../data/recovery-points.json');
        const recoveryData = {
            updated: new Date().toISOString(),
            total_points: this.recoveryPoints.size,
            points: Array.from(this.recoveryPoints.values())
        };
        
        await writeFile(recoveryPath, JSON.stringify(recoveryData, null, 2));
        
        console.log(`✅ Recovery point created: ${recoveryPointId}`);
        return recoveryPoint;
    }

    async calculateDataStateHash() {
        const dataFiles = [];
        
        for (const source of this.backupConfig.backupSources) {
            const sourcePath = join(__dirname, '../../', source);
            
            try {
                const stats = await stat(sourcePath);
                if (stats.isFile()) {
                    const content = await readFile(sourcePath, 'utf-8');
                    dataFiles.push(content);
                }
            } catch (error) {
                // Skip missing files
            }
        }
        
        const combinedContent = dataFiles.join('|');
        return createHash('sha256').update(combinedContent).digest('hex');
    }

    async restoreFromBackup(backupId, targetPath = null) {
        console.log(`🔄 Restoring from backup: ${backupId}`);
        
        const backupInfo = this.backupRegistry.get(backupId);
        if (!backupInfo) {
            throw new Error(`Backup not found: ${backupId}`);
        }
        
        if (backupInfo.status !== 'completed') {
            throw new Error(`Cannot restore from incomplete backup: ${backupId}`);
        }
        
        const backupDir = join(__dirname, '../../data/backups', backupInfo.type, backupId);
        const restoreTarget = targetPath || join(__dirname, '../../');
        
        // Verify backup before restoration
        if (this.backupConfig.verificationEnabled) {
            const verified = await this.verifyBackup(backupDir, backupInfo);
            if (!verified) {
                throw new Error('Backup verification failed - cannot restore');
            }
        }
        
        // Create restoration backup of current state
        const preRestoreBackup = await this.createBackup('pre-restore');
        
        try {
            // Restore each file
            for (const fileInfo of backupInfo.files) {
                await this.restoreFile(backupDir, restoreTarget, fileInfo);
            }
            
            console.log(`✅ Restoration completed from backup: ${backupId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Restoration failed: ${error.message}`);
            console.log(`🔄 Attempting to restore from pre-restoration backup: ${preRestoreBackup.id}`);
            
            // Try to restore from pre-restore backup
            try {
                await this.restoreFromBackup(preRestoreBackup.id, targetPath);
                console.log('✅ Successfully restored to pre-restoration state');
            } catch (rollbackError) {
                console.error('❌ Failed to rollback to pre-restoration state');
            }
            
            throw error;
        }
    }

    async restoreFile(backupDir, targetDir, fileInfo) {
        const backupFilePath = join(backupDir, fileInfo.destination);
        const targetFilePath = join(targetDir, fileInfo.source);
        
        // Ensure target directory exists
        const targetFileDir = dirname(targetFilePath);
        await this.ensureDirectoryExists(targetFileDir);
        
        if (fileInfo.compressed) {
            await this.decompressFile(backupFilePath, targetFilePath);
        } else {
            await copyFile(backupFilePath, targetFilePath);
        }
        
        // Verify restored file checksum
        const content = await readFile(targetFilePath, 'utf-8');
        const checksum = createHash('sha256').update(content).digest('hex');
        
        if (checksum !== fileInfo.checksum) {
            throw new Error(`Restored file checksum mismatch: ${fileInfo.source}`);
        }
    }

    async cleanupOldBackups() {
        console.log('🧹 Cleaning up old backups...');
        
        let cleanedCount = 0;
        let reclaimedSpace = 0;
        
        for (const [type, policy] of Object.entries(this.backupConfig.retentionPolicies)) {
            const typeBackups = Array.from(this.backupRegistry.values())
                .filter(backup => backup.type === type)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Remove backups beyond retention limit
            const toRemove = typeBackups.slice(policy.keep);
            
            for (const backup of toRemove) {
                try {
                    const backupDir = join(__dirname, '../../data/backups', backup.type, backup.id);
                    await rm(backupDir, { recursive: true, force: true });
                    
                    reclaimedSpace += backup.compressedSize || 0;
                    cleanedCount++;
                    
                    this.backupRegistry.delete(backup.id);
                } catch (error) {
                    console.warn(`⚠️ Failed to remove backup ${backup.id}: ${error.message}`);
                }
            }
        }
        
        if (cleanedCount > 0) {
            await this.saveBackupRegistry();
            console.log(`✅ Cleaned up ${cleanedCount} old backups, reclaimed ${this.formatBytes(reclaimedSpace)}`);
        }
        
        return { cleanedCount, reclaimedSpace };
    }

    async generateBackupReport() {
        const report = {
            timestamp: new Date().toISOString(),
            backup_system: {
                status: 'operational',
                retention_policies: this.backupConfig.retentionPolicies,
                compression_enabled: this.backupConfig.compressionEnabled,
                verification_enabled: this.backupConfig.verificationEnabled
            },
            metrics: this.backupMetrics,
            backup_distribution: this.getBackupDistribution(),
            storage_analysis: await this.getStorageAnalysis(),
            recovery_points: this.recoveryPoints.size,
            health_score: this.calculateBackupHealthScore(),
            recommendations: this.generateBackupRecommendations()
        };
        
        const reportPath = join(__dirname, '../../data/backup-recovery-report.json');
        await writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📊 Backup report generated: ${reportPath}`);
        return report;
    }

    getBackupDistribution() {
        const distribution = {};
        
        for (const backup of this.backupRegistry.values()) {
            distribution[backup.type] = (distribution[backup.type] || 0) + 1;
        }
        
        return distribution;
    }

    async getStorageAnalysis() {
        let totalStorage = 0;
        let compressedStorage = 0;
        
        for (const backup of this.backupRegistry.values()) {
            totalStorage += backup.totalSize || 0;
            compressedStorage += backup.compressedSize || 0;
        }
        
        return {
            total_original_size: totalStorage,
            total_compressed_size: compressedStorage,
            compression_savings: totalStorage - compressedStorage,
            compression_ratio: totalStorage > 0 ? (totalStorage - compressedStorage) / totalStorage : 0,
            formatted_sizes: {
                total_original: this.formatBytes(totalStorage),
                total_compressed: this.formatBytes(compressedStorage),
                savings: this.formatBytes(totalStorage - compressedStorage)
            }
        };
    }

    calculateBackupHealthScore() {
        let score = 100;
        
        // Deduct points for failed backups
        if (this.backupMetrics.failedBackups > 0) {
            const failureRate = this.backupMetrics.failedBackups / this.backupMetrics.totalBackups;
            score -= failureRate * 50;
        }
        
        // Deduct points for old backups
        if (this.backupMetrics.lastBackup) {
            const daysSinceLastBackup = (Date.now() - new Date(this.backupMetrics.lastBackup)) / (1000 * 60 * 60 * 24);
            if (daysSinceLastBackup > 1) {
                score -= Math.min(daysSinceLastBackup * 5, 30);
            }
        }
        
        // Deduct points for insufficient backup coverage
        const expectedTypes = Object.keys(this.backupConfig.retentionPolicies);
        const actualTypes = new Set(Array.from(this.backupRegistry.values()).map(b => b.type));
        const missingTypes = expectedTypes.filter(type => !actualTypes.has(type));
        score -= missingTypes.length * 10;
        
        return Math.max(0, Math.round(score));
    }

    generateBackupRecommendations() {
        const recommendations = [];
        
        // Backup frequency recommendations
        if (this.backupMetrics.lastBackup) {
            const daysSinceLastBackup = (Date.now() - new Date(this.backupMetrics.lastBackup)) / (1000 * 60 * 60 * 24);
            if (daysSinceLastBackup > 1) {
                recommendations.push({
                    priority: 'high',
                    type: 'backup_frequency',
                    title: 'Schedule More Frequent Backups',
                    description: `Last backup was ${Math.round(daysSinceLastBackup)} days ago`,
                    action: 'Create new backup or enable automated scheduling'
                });
            }
        }
        
        // Storage optimization recommendations
        const storageUsed = this.backupMetrics.totalSize;
        if (storageUsed > this.backupConfig.maxBackupSize) {
            recommendations.push({
                priority: 'medium',
                type: 'storage_optimization',
                title: 'Optimize Backup Storage',
                description: `Using ${this.formatBytes(storageUsed)} of backup storage`,
                action: 'Run backup cleanup or increase compression'
            });
        }
        
        // Recovery point recommendations
        if (this.recoveryPoints.size === 0) {
            recommendations.push({
                priority: 'medium',
                type: 'recovery_points',
                title: 'Create Recovery Points',
                description: 'No recovery points available for quick restoration',
                action: 'Create recovery points before major changes'
            });
        }
        
        // Verification recommendations
        if (!this.backupConfig.verificationEnabled) {
            recommendations.push({
                priority: 'high',
                type: 'verification',
                title: 'Enable Backup Verification',
                description: 'Backup verification is disabled',
                action: 'Enable verification to ensure backup integrity'
            });
        }
        
        return recommendations;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async ensureDirectoryExists(dirPath) {
        try {
            await mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }

    async run() {
        console.log('🛡️  Backup and Recovery System - Enterprise Data Protection Framework');
        console.log('===================================================================\n');

        try {
            await this.initializeBackupSystem();
            
            // Create a backup
            const backup = await this.createBackup('automated');
            
            // Create recovery point
            await this.createRecoveryPoint('System health check recovery point');
            
            // Cleanup old backups
            await this.cleanupOldBackups();
            
            // Generate report
            const report = await this.generateBackupReport();
            
            console.log('\n📊 BACKUP SYSTEM SUMMARY');
            console.log('=========================');
            console.log(`Health Score: ${report.health_score}/100`);
            console.log(`Total Backups: ${report.metrics.totalBackups}`);
            console.log(`Successful: ${report.metrics.successfulBackups}`);
            console.log(`Failed: ${report.metrics.failedBackups}`);
            console.log(`Storage Used: ${report.storage_analysis.formatted_sizes.total_compressed}`);
            console.log(`Compression Savings: ${report.storage_analysis.formatted_sizes.savings} (${Math.round(report.storage_analysis.compression_ratio * 100)}%)`);
            console.log(`Recovery Points: ${report.recovery_points}`);
            
            if (report.recommendations.length > 0) {
                console.log(`\nRecommendations: ${report.recommendations.length}`);
            }
            
            return report.health_score >= 80;
        } catch (error) {
            console.error('❌ Backup system failed:', error);
            return false;
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const system = new BackupRecoverySystem();
    
    if (args[0] === 'restore' && args[1]) {
        // Restore from specific backup
        try {
            await system.initializeBackupSystem();
            await system.restoreFromBackup(args[1]);
            console.log('✅ Restoration completed successfully');
            process.exit(0);
        } catch (error) {
            console.error('❌ Restoration failed:', error.message);
            process.exit(1);
        }
    } else {
        // Normal backup operation
        const success = await system.run();
        process.exit(success ? 0 : 1);
    }
}

export default BackupRecoverySystem;