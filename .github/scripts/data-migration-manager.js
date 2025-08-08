#!/usr/bin/env node
/**
 * Data Migration Manager - Zero-Loss Data Evolution Framework
 * Handles schema migrations, data versioning, and rollback capabilities
 */

import { readFile, writeFile, readdir, mkdir, copyFile, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DataMigrationManager {
    constructor() {
        this.migrationConfig = {
            maxBackups: 10,
            migrationHistory: [],
            currentSchemaVersion: '4.0.0',
            supportedVersions: ['3.0.0', '3.1.0', '4.0.0'],
            rollbackWindow: 30 * 24 * 60 * 60 * 1000 // 30 days
        };
        this.migrationStrategies = new Map();
        this.versionRegistry = new Map();
        this.backupRegistry = new Map();
        this.setupMigrationStrategies();
    }

    setupMigrationStrategies() {
        // Migration from 3.0.0 to 3.1.0
        this.migrationStrategies.set('3.0.0->3.1.0', {
            description: 'Add content protection metadata',
            transformations: [
                {
                    path: 'metadata.content_protection',
                    action: 'add',
                    value: {
                        enabled: true,
                        guardian_version: '1.0.0',
                        protection_level: 'medium'
                    }
                }
            ],
            validations: [
                { path: 'metadata.content_protection.enabled', type: 'boolean' }
            ]
        });

        // Migration from 3.1.0 to 4.0.0
        this.migrationStrategies.set('3.1.0->4.0.0', {
            description: 'Restructure profile data and add frontend optimization',
            transformations: [
                {
                    path: 'personal_info',
                    action: 'move',
                    destination: 'profile.personal'
                },
                {
                    path: 'contact_info',
                    action: 'move',
                    destination: 'profile.contact'
                },
                {
                    path: 'metadata.frontend_optimization',
                    action: 'add',
                    value: {
                        payload_size_kb: null,
                        mobile_optimized: true,
                        progressive_loading_enabled: true
                    }
                }
            ],
            validations: [
                { path: 'profile.personal.name', type: 'string', required: true },
                { path: 'profile.contact.email', type: 'string', required: true }
            ]
        });

        // Rollback strategies
        this.migrationStrategies.set('4.0.0->3.1.0', {
            description: 'Rollback profile restructuring',
            transformations: [
                {
                    path: 'profile.personal',
                    action: 'move',
                    destination: 'personal_info'
                },
                {
                    path: 'profile.contact',
                    action: 'move',
                    destination: 'contact_info'
                },
                {
                    path: 'metadata.frontend_optimization',
                    action: 'remove'
                }
            ],
            validations: [
                { path: 'personal_info.name', type: 'string', required: true }
            ]
        });

        this.migrationStrategies.set('3.1.0->3.0.0', {
            description: 'Rollback content protection addition',
            transformations: [
                {
                    path: 'metadata.content_protection',
                    action: 'remove'
                }
            ],
            validations: []
        });
    }

    async detectDataVersions() {
        console.log('🔍 Detecting data file versions...');
        
        const dataPath = join(__dirname, '../../data');
        const files = await readdir(dataPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
            try {
                const filePath = join(dataPath, file);
                const content = await readFile(filePath, 'utf-8');
                const data = JSON.parse(content);
                
                const version = this.extractVersion(data, file);
                const compatibility = this.checkVersionCompatibility(version);
                
                this.versionRegistry.set(file, {
                    currentVersion: version,
                    targetVersion: this.migrationConfig.currentSchemaVersion,
                    compatible: compatibility.compatible,
                    migrationPath: compatibility.migrationPath,
                    requiresMigration: version !== this.migrationConfig.currentSchemaVersion,
                    filePath
                });
                
            } catch (error) {
                console.warn(`⚠️ Failed to detect version for ${file}: ${error.message}`);
            }
        }

        console.log(`✅ Detected versions for ${this.versionRegistry.size} files`);
        return this.versionRegistry;
    }

    extractVersion(data, filename) {
        // Try to extract version from metadata
        if (data.metadata?.version) {
            return data.metadata.version;
        }
        
        if (data.metadata?.schema_version) {
            return data.metadata.schema_version;
        }
        
        // Infer version from structure
        if (data.profile && data.career && data.portfolio) {
            return '4.0.0'; // Current structure
        }
        
        if (data.personal_info && data.contact_info) {
            if (data.metadata?.content_protection) {
                return '3.1.0'; // Has content protection
            } else {
                return '3.0.0'; // Old structure
            }
        }
        
        // Default to oldest supported version
        return '3.0.0';
    }

    checkVersionCompatibility(version) {
        const supported = this.migrationConfig.supportedVersions;
        const target = this.migrationConfig.currentSchemaVersion;
        
        if (!supported.includes(version)) {
            return {
                compatible: false,
                migrationPath: [],
                error: `Unsupported version: ${version}`
            };
        }
        
        if (version === target) {
            return {
                compatible: true,
                migrationPath: []
            };
        }
        
        // Calculate migration path
        const migrationPath = this.calculateMigrationPath(version, target);
        
        return {
            compatible: true,
            migrationPath
        };
    }

    calculateMigrationPath(from, to) {
        // Simple linear migration path for now
        const versions = this.migrationConfig.supportedVersions;
        const fromIndex = versions.indexOf(from);
        const toIndex = versions.indexOf(to);
        
        if (fromIndex === -1 || toIndex === -1) return [];
        
        const path = [];
        
        if (fromIndex < toIndex) {
            // Forward migration
            for (let i = fromIndex; i < toIndex; i++) {
                const fromVer = versions[i];
                const toVer = versions[i + 1];
                path.push(`${fromVer}->${toVer}`);
            }
        } else {
            // Rollback migration
            for (let i = fromIndex; i > toIndex; i--) {
                const fromVer = versions[i];
                const toVer = versions[i - 1];
                path.push(`${fromVer}->${toVer}`);
            }
        }
        
        return path;
    }

    async createBackup(filePath, version, reason = 'pre_migration') {
        console.log(`💾 Creating backup for ${filePath.split('/').pop()}`);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = filePath.split('/').pop();
        const backupName = `${filename}.backup.${version}.${timestamp}`;
        const backupPath = join(__dirname, '../../data/backups', backupName);
        
        await this.ensureDirectoryExists(join(__dirname, '../../data/backups'));
        await copyFile(filePath, backupPath);
        
        // Create backup manifest
        const content = await readFile(filePath, 'utf-8');
        const checksum = createHash('sha256').update(content).digest('hex');
        
        const backupInfo = {
            originalPath: filePath,
            backupPath,
            version,
            reason,
            timestamp: new Date().toISOString(),
            checksum,
            size: (await stat(filePath)).size
        };
        
        this.backupRegistry.set(backupPath, backupInfo);
        await this.saveBackupRegistry();
        
        console.log(`✅ Backup created: ${backupName}`);
        return backupPath;
    }

    async saveBackupRegistry() {
        const registryPath = join(__dirname, '../../data/backup-registry.json');
        const registry = {
            timestamp: new Date().toISOString(),
            total_backups: this.backupRegistry.size,
            backups: Array.from(this.backupRegistry.entries()).map(([path, info]) => ({
                path: path.replace(join(__dirname, '../../'), ''),
                ...info
            }))
        };
        
        await writeFile(registryPath, JSON.stringify(registry, null, 2));
    }

    async migrateFile(filename, migrationPath) {
        console.log(`🔄 Migrating ${filename} through path: ${migrationPath.join(' -> ')}`);
        
        const fileInfo = this.versionRegistry.get(filename);
        if (!fileInfo) throw new Error(`File not found in registry: ${filename}`);
        
        // Create backup before migration
        const backupPath = await this.createBackup(
            fileInfo.filePath, 
            fileInfo.currentVersion,
            'pre_migration'
        );
        
        let data = JSON.parse(await readFile(fileInfo.filePath, 'utf-8'));
        
        // Apply each migration step
        for (const step of migrationPath) {
            const strategy = this.migrationStrategies.get(step);
            if (!strategy) {
                throw new Error(`No migration strategy found for: ${step}`);
            }
            
            console.log(`  📝 Applying migration: ${step} - ${strategy.description}`);
            data = await this.applyMigrationStep(data, strategy);
            
            // Validate after each step
            const validation = await this.validateMigrationStep(data, strategy);
            if (!validation.valid) {
                throw new Error(`Migration validation failed: ${validation.errors.join(', ')}`);
            }
        }
        
        // Update version metadata
        data.metadata = data.metadata || {};
        data.metadata.version = this.migrationConfig.currentSchemaVersion;
        data.metadata.schema_version = this.migrationConfig.currentSchemaVersion;
        data.metadata.last_updated = new Date().toISOString();
        data.metadata.migration_history = data.metadata.migration_history || [];
        data.metadata.migration_history.push({
            from_version: fileInfo.currentVersion,
            to_version: this.migrationConfig.currentSchemaVersion,
            migration_path: migrationPath,
            timestamp: new Date().toISOString(),
            backup_path: backupPath
        });
        
        // Save migrated data
        await writeFile(fileInfo.filePath, JSON.stringify(data, null, 2));
        
        // Update registry
        fileInfo.currentVersion = this.migrationConfig.currentSchemaVersion;
        fileInfo.requiresMigration = false;
        
        console.log(`✅ Migration completed for ${filename}`);
        return true;
    }

    async applyMigrationStep(data, strategy) {
        let migratedData = JSON.parse(JSON.stringify(data)); // Deep clone
        
        for (const transformation of strategy.transformations) {
            migratedData = await this.applyTransformation(migratedData, transformation);
        }
        
        return migratedData;
    }

    async applyTransformation(data, transformation) {
        switch (transformation.action) {
            case 'add':
                return this.addProperty(data, transformation.path, transformation.value);
            case 'remove':
                return this.removeProperty(data, transformation.path);
            case 'move':
                return this.moveProperty(data, transformation.path, transformation.destination);
            case 'rename':
                return this.renameProperty(data, transformation.path, transformation.newName);
            case 'transform':
                return this.transformProperty(data, transformation.path, transformation.transformer);
            default:
                throw new Error(`Unknown transformation action: ${transformation.action}`);
        }
    }

    addProperty(data, path, value) {
        const parts = path.split('.');
        let current = data;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
        return data;
    }

    removeProperty(data, path) {
        const parts = path.split('.');
        let current = data;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                return data; // Property doesn't exist
            }
            current = current[parts[i]];
        }
        
        delete current[parts[parts.length - 1]];
        return data;
    }

    moveProperty(data, sourcePath, destPath) {
        const value = this.getNestedProperty(data, sourcePath);
        if (value !== undefined) {
            data = this.addProperty(data, destPath, value);
            data = this.removeProperty(data, sourcePath);
        }
        return data;
    }

    renameProperty(data, path, newName) {
        const parts = path.split('.');
        const parentPath = parts.slice(0, -1).join('.');
        const oldName = parts[parts.length - 1];
        const newPath = parentPath ? `${parentPath}.${newName}` : newName;
        
        return this.moveProperty(data, path, newPath);
    }

    transformProperty(data, path, transformer) {
        const value = this.getNestedProperty(data, path);
        if (value !== undefined) {
            const transformedValue = transformer(value);
            data = this.addProperty(data, path, transformedValue);
        }
        return data;
    }

    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    async validateMigrationStep(data, strategy) {
        const validation = { valid: true, errors: [] };
        
        for (const rule of strategy.validations) {
            const value = this.getNestedProperty(data, rule.path);
            
            if (rule.required && value === undefined) {
                validation.valid = false;
                validation.errors.push(`Required property missing: ${rule.path}`);
            }
            
            if (value !== undefined && rule.type && typeof value !== rule.type) {
                validation.valid = false;
                validation.errors.push(`Type mismatch for ${rule.path}: expected ${rule.type}, got ${typeof value}`);
            }
        }
        
        return validation;
    }

    async rollbackFile(filename, targetVersion) {
        console.log(`⏪ Rolling back ${filename} to version ${targetVersion}`);
        
        const fileInfo = this.versionRegistry.get(filename);
        if (!fileInfo) throw new Error(`File not found in registry: ${filename}`);
        
        // Find appropriate backup
        const backup = await this.findBackupForVersion(fileInfo.filePath, targetVersion);
        if (!backup) {
            throw new Error(`No backup found for ${filename} at version ${targetVersion}`);
        }
        
        // Create backup of current state
        await this.createBackup(fileInfo.filePath, fileInfo.currentVersion, 'pre_rollback');
        
        // Restore from backup
        await copyFile(backup.backupPath, fileInfo.filePath);
        
        // Update registry
        fileInfo.currentVersion = targetVersion;
        fileInfo.requiresMigration = targetVersion !== this.migrationConfig.currentSchemaVersion;
        
        console.log(`✅ Rollback completed for ${filename}`);
        return true;
    }

    async findBackupForVersion(filePath, version) {
        for (const [, backup] of this.backupRegistry) {
            if (backup.originalPath === filePath && backup.version === version) {
                return backup;
            }
        }
        return null;
    }

    async cleanupOldBackups() {
        console.log('🧹 Cleaning up old backups...');
        
        const cutoffTime = Date.now() - this.migrationConfig.rollbackWindow;
        let cleanedCount = 0;
        
        for (const [backupPath, info] of this.backupRegistry) {
            const backupTime = new Date(info.timestamp).getTime();
            
            if (backupTime < cutoffTime) {
                try {
                    // Remove backup file (implement if needed)
                    this.backupRegistry.delete(backupPath);
                    cleanedCount++;
                } catch (error) {
                    console.warn(`⚠️ Failed to clean backup ${backupPath}: ${error.message}`);
                }
            }
        }
        
        if (cleanedCount > 0) {
            await this.saveBackupRegistry();
            console.log(`✅ Cleaned up ${cleanedCount} old backups`);
        }
        
        return cleanedCount;
    }

    async generateMigrationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            schema_version: this.migrationConfig.currentSchemaVersion,
            supported_versions: this.migrationConfig.supportedVersions,
            migration_summary: {
                total_files: this.versionRegistry.size,
                requires_migration: 0,
                up_to_date: 0,
                incompatible: 0
            },
            file_status: [],
            backup_summary: {
                total_backups: this.backupRegistry.size,
                oldest_backup: null,
                newest_backup: null,
                total_size_mb: 0
            },
            recommendations: []
        };

        // Analyze file versions
        for (const [filename, info] of this.versionRegistry) {
            if (info.requiresMigration) {
                report.migration_summary.requires_migration++;
            } else {
                report.migration_summary.up_to_date++;
            }
            
            if (!info.compatible) {
                report.migration_summary.incompatible++;
            }

            report.file_status.push({
                filename,
                current_version: info.currentVersion,
                target_version: info.targetVersion,
                requires_migration: info.requiresMigration,
                compatible: info.compatible,
                migration_path: info.migrationPath
            });
        }

        // Analyze backups
        let totalSize = 0;
        let oldestTime = null;
        let newestTime = null;

        for (const [, backup] of this.backupRegistry) {
            totalSize += backup.size || 0;
            
            const backupTime = new Date(backup.timestamp);
            if (!oldestTime || backupTime < oldestTime) oldestTime = backupTime;
            if (!newestTime || backupTime > newestTime) newestTime = backupTime;
        }

        report.backup_summary.total_size_mb = Math.round(totalSize / (1024 * 1024) * 100) / 100;
        report.backup_summary.oldest_backup = oldestTime?.toISOString();
        report.backup_summary.newest_backup = newestTime?.toISOString();

        // Generate recommendations
        if (report.migration_summary.requires_migration > 0) {
            report.recommendations.push({
                priority: 'high',
                type: 'migration_required',
                title: 'Data Migration Needed',
                description: `${report.migration_summary.requires_migration} files require migration`,
                action: 'Run migration process for outdated files'
            });
        }

        if (report.backup_summary.total_size_mb > 100) {
            report.recommendations.push({
                priority: 'medium',
                type: 'backup_cleanup',
                title: 'Backup Storage Optimization',
                description: `${report.backup_summary.total_size_mb}MB of backup storage used`,
                action: 'Clean up old backups to free storage space'
            });
        }

        const reportPath = join(__dirname, '../../data/migration-report.json');
        await writeFile(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }

    async ensureDirectoryExists(dirPath) {
        try {
            await mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }

    async run() {
        console.log('🔄 Data Migration Manager - Zero-Loss Data Evolution Framework');
        console.log('===============================================================\n');

        try {
            // Initialize backup directory
            await this.ensureDirectoryExists(join(__dirname, '../../data/backups'));
            
            // Detect versions
            await this.detectDataVersions();
            
            // Check for migrations needed
            const migrationCount = Array.from(this.versionRegistry.values())
                .filter(info => info.requiresMigration).length;
            
            if (migrationCount > 0) {
                console.log(`📝 Found ${migrationCount} files requiring migration`);
                
                // Migrate files that need it
                for (const [filename, info] of this.versionRegistry) {
                    if (info.requiresMigration && info.compatible) {
                        await this.migrateFile(filename, info.migrationPath);
                    }
                }
            } else {
                console.log('✅ All files are up to date');
            }
            
            // Clean up old backups
            await this.cleanupOldBackups();
            
            // Generate report
            const report = await this.generateMigrationReport();
            
            console.log('\n📊 MIGRATION SUMMARY');
            console.log('====================');
            console.log(`Schema Version: ${report.schema_version}`);
            console.log(`Total Files: ${report.migration_summary.total_files}`);
            console.log(`Up to Date: ${report.migration_summary.up_to_date}`);
            console.log(`Requires Migration: ${report.migration_summary.requires_migration}`);
            console.log(`Incompatible: ${report.migration_summary.incompatible}`);
            console.log(`\nBackups: ${report.backup_summary.total_backups} (${report.backup_summary.total_size_mb}MB)`);
            
            if (report.recommendations.length > 0) {
                console.log(`\nRecommendations: ${report.recommendations.length}`);
            }
            
            return report.migration_summary.incompatible === 0;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new DataMigrationManager();
    const success = await manager.run();
    process.exit(success ? 0 : 1);
}

export default DataMigrationManager;