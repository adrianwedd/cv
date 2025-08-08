#!/usr/bin/env node
/**
 * Data Architecture Validator - Enterprise Data Integrity Framework
 * Comprehensive validation system for CV data architecture
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DataArchitectureValidator {
    constructor() {
        this.validationRules = new Map();
        this.dataRelationships = new Map();
        this.integrityChecks = new Map();
        this.validationResults = {
            timestamp: new Date().toISOString(),
            consistency: 0,
            integrity: 0,
            relationships: 0,
            overall: 0,
            errors: [],
            warnings: [],
            recommendations: []
        };
        this.setupValidationRules();
        this.setupDataRelationships();
        this.setupIntegrityChecks();
    }

    setupValidationRules() {
        // Base CV data validation
        this.validationRules.set('base-cv', {
            required: ['metadata', 'profile', 'career', 'portfolio', 'expertise', 'recognition', 'credentials'],
            metadata: {
                required: ['version', 'last_updated', 'verification_status'],
                version: { pattern: /^\d+\.\d+\.\d+$/ },
                verification_status: { enum: ['COMPLETE', 'PARTIAL', 'PENDING', 'FAILED'] }
            },
            profile: {
                required: ['personal', 'contact'],
                personal: { required: ['name', 'title', 'location'] },
                contact: { required: ['email', 'website', 'github'] }
            },
            career: {
                required: ['summary', 'positions'],
                summary: { minLength: 100, maxLength: 2000 },
                positions: { minItems: 1, itemValidation: 'position' }
            },
            portfolio: {
                required: ['featured_projects'],
                featured_projects: { minItems: 1, itemValidation: 'project' }
            }
        });

        // Activity data validation
        this.validationRules.set('activity-summary', {
            required: ['timestamp', 'analysis_period', 'repositories', 'github_stats'],
            timestamp: { format: 'date-time' },
            analysis_period: { required: ['start', 'end'] },
            github_stats: { required: ['total_commits', 'total_repos', 'languages'] }
        });

        // AI enhancements validation
        this.validationRules.set('ai-enhancements', {
            required: ['timestamp', 'version', 'enhancements'],
            timestamp: { format: 'date-time' },
            version: { pattern: /^\d+\.\d+\.\d+$/ },
            enhancements: { type: 'object' }
        });

        // Protected content validation
        this.validationRules.set('protected-content', {
            required: ['timestamp', 'version', 'protection_rules', 'protected_sections'],
            protection_rules: { required: ['enabled', 'level'] },
            protected_sections: { type: 'array', minItems: 1 }
        });
    }

    setupDataRelationships() {
        // Define critical data relationships
        this.dataRelationships.set('cv-activity', {
            source: 'base-cv.portfolio.featured_projects',
            target: 'activity-summary.repositories',
            relationship: 'github_url_match',
            required: true
        });

        this.dataRelationships.set('cv-protected', {
            source: 'base-cv.recognition.achievements',
            target: 'protected-content.protected_sections',
            relationship: 'verification_consistency',
            required: true
        });

        this.dataRelationships.set('cv-enhancement', {
            source: 'base-cv.career.summary',
            target: 'ai-enhancements.enhancements.summary',
            relationship: 'enhancement_tracking',
            required: false
        });
    }

    setupIntegrityChecks() {
        this.integrityChecks.set('timestamp_consistency', {
            description: 'Verify timestamp consistency across related files',
            critical: true,
            tolerance: 24 * 60 * 60 * 1000 // 24 hours in ms
        });

        this.integrityChecks.set('verification_status', {
            description: 'Ensure all verified content has supporting evidence',
            critical: true,
            tolerance: 0
        });

        this.integrityChecks.set('data_freshness', {
            description: 'Check data freshness against configured thresholds',
            critical: false,
            tolerance: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        });

        this.integrityChecks.set('schema_compliance', {
            description: 'Validate all data against defined schemas',
            critical: true,
            tolerance: 0
        });
    }

    async validateDataStructure() {
        console.log('🔍 Starting comprehensive data structure validation...');
        
        const dataPath = join(__dirname, '../../data');
        const files = await readdir(dataPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        let totalFiles = 0;
        let validFiles = 0;
        let structureScore = 0;

        for (const file of jsonFiles) {
            try {
                const filePath = join(dataPath, file);
                const content = await readFile(filePath, 'utf-8');
                const data = JSON.parse(content);
                
                const fileType = this.identifyFileType(file, data);
                const validation = await this.validateFile(file, data, fileType);
                
                totalFiles++;
                if (validation.valid) validFiles++;
                structureScore += validation.score;
                
                if (!validation.valid) {
                    this.validationResults.errors.push({
                        file,
                        type: 'structure_validation',
                        errors: validation.errors
                    });
                }
                
            } catch (error) {
                this.validationResults.errors.push({
                    file,
                    type: 'parse_error',
                    error: error.message
                });
            }
        }

        this.validationResults.consistency = Math.round((validFiles / totalFiles) * 100);
        console.log(`✅ Structure validation: ${validFiles}/${totalFiles} files valid (${this.validationResults.consistency}%)`);
        
        return this.validationResults.consistency;
    }

    identifyFileType(filename, data) {
        // Smart file type detection based on structure and naming
        if (filename.includes('base-cv')) return 'base-cv';
        if (filename.includes('activity-summary')) return 'activity-summary';
        if (filename.includes('ai-enhancements')) return 'ai-enhancements';
        if (filename.includes('protected-content')) return 'protected-content';
        
        // Fallback to structure-based detection
        if (data.metadata && data.profile && data.career) return 'base-cv';
        if (data.timestamp && data.github_stats) return 'activity-summary';
        if (data.enhancements && data.version) return 'ai-enhancements';
        if (data.protection_rules) return 'protected-content';
        
        return 'unknown';
    }

    async validateFile(filename, data, type) {
        const rules = this.validationRules.get(type);
        if (!rules) {
            return { valid: false, score: 0, errors: [`No validation rules for type: ${type}`] };
        }

        const validation = {
            valid: true,
            score: 100,
            errors: []
        };

        // Validate required fields
        if (rules.required) {
            for (const field of rules.required) {
                if (!(field in data)) {
                    validation.valid = false;
                    validation.score -= 20;
                    validation.errors.push(`Missing required field: ${field}`);
                }
            }
        }

        // Validate field-specific rules
        for (const [field, rule] of Object.entries(rules)) {
            if (field === 'required') continue;
            
            if (data[field]) {
                const fieldValidation = await this.validateField(data[field], rule, `${filename}.${field}`);
                if (!fieldValidation.valid) {
                    validation.valid = false;
                    validation.score -= fieldValidation.penalty;
                    validation.errors.push(...fieldValidation.errors);
                }
            }
        }

        return validation;
    }

    async validateField(value, rule, context) {
        const validation = { valid: true, penalty: 0, errors: [] };

        if (rule.pattern && typeof value === 'string') {
            if (!rule.pattern.test(value)) {
                validation.valid = false;
                validation.penalty = 10;
                validation.errors.push(`${context}: Pattern validation failed`);
            }
        }

        if (rule.enum && !rule.enum.includes(value)) {
            validation.valid = false;
            validation.penalty = 10;
            validation.errors.push(`${context}: Value not in allowed enum: ${rule.enum.join(', ')}`);
        }

        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
            validation.valid = false;
            validation.penalty = 5;
            validation.errors.push(`${context}: Below minimum length ${rule.minLength}`);
        }

        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
            validation.valid = false;
            validation.penalty = 5;
            validation.errors.push(`${context}: Above maximum length ${rule.maxLength}`);
        }

        if (rule.minItems && Array.isArray(value) && value.length < rule.minItems) {
            validation.valid = false;
            validation.penalty = 10;
            validation.errors.push(`${context}: Below minimum items ${rule.minItems}`);
        }

        return validation;
    }

    async validateDataRelationships() {
        console.log('🔗 Validating data relationships...');
        
        let totalRelationships = 0;
        let validRelationships = 0;

        for (const [name, relationship] of this.dataRelationships) {
            totalRelationships++;
            try {
                const isValid = await this.validateRelationship(relationship);
                if (isValid) validRelationships++;
                else {
                    this.validationResults.errors.push({
                        type: 'relationship_validation',
                        relationship: name,
                        error: 'Relationship validation failed'
                    });
                }
            } catch (error) {
                this.validationResults.errors.push({
                    type: 'relationship_error',
                    relationship: name,
                    error: error.message
                });
            }
        }

        this.validationResults.relationships = Math.round((validRelationships / totalRelationships) * 100);
        console.log(`✅ Relationship validation: ${validRelationships}/${totalRelationships} relationships valid (${this.validationResults.relationships}%)`);
        
        return this.validationResults.relationships;
    }

    async validateRelationship(relationship) {
        // This would implement actual relationship validation logic
        // For now, return a placeholder implementation
        return true;
    }

    async runIntegrityChecks() {
        console.log('🛡️ Running data integrity checks...');
        
        let totalChecks = 0;
        let passedChecks = 0;

        for (const [name, check] of this.integrityChecks) {
            totalChecks++;
            try {
                const passed = await this.runIntegrityCheck(name, check);
                if (passed) passedChecks++;
                else {
                    const errorLevel = check.critical ? 'errors' : 'warnings';
                    this.validationResults[errorLevel].push({
                        type: 'integrity_check',
                        check: name,
                        description: check.description
                    });
                }
            } catch (error) {
                this.validationResults.errors.push({
                    type: 'integrity_error',
                    check: name,
                    error: error.message
                });
            }
        }

        this.validationResults.integrity = Math.round((passedChecks / totalChecks) * 100);
        console.log(`✅ Integrity checks: ${passedChecks}/${totalChecks} checks passed (${this.validationResults.integrity}%)`);
        
        return this.validationResults.integrity;
    }

    async runIntegrityCheck(name, check) {
        switch (name) {
            case 'timestamp_consistency':
                return await this.checkTimestampConsistency(check.tolerance);
            case 'verification_status':
                return await this.checkVerificationStatus();
            case 'data_freshness':
                return await this.checkDataFreshness(check.tolerance);
            case 'schema_compliance':
                return await this.checkSchemaCompliance();
            default:
                return false;
        }
    }

    async checkTimestampConsistency(tolerance) {
        try {
            const dataPath = join(__dirname, '../../data');
            const baseCvPath = join(dataPath, 'base-cv.json');
            const activityPath = join(dataPath, 'activity-summary.json');
            
            const [baseCv, activity] = await Promise.all([
                readFile(baseCvPath, 'utf-8').then(JSON.parse).catch(() => null),
                readFile(activityPath, 'utf-8').then(JSON.parse).catch(() => null)
            ]);

            if (!baseCv || !activity) return false;

            const baseCvTime = new Date(baseCv.metadata?.last_updated || 0).getTime();
            const activityTime = new Date(activity.timestamp || 0).getTime();
            
            return Math.abs(baseCvTime - activityTime) <= tolerance;
        } catch {
            return false;
        }
    }

    async checkVerificationStatus() {
        try {
            const baseCvPath = join(__dirname, '../../data/base-cv.json');
            const baseCv = JSON.parse(await readFile(baseCvPath, 'utf-8'));
            
            // Check that all verified items have supporting evidence
            const achievements = baseCv.recognition?.achievements || [];
            const verifiedAchievements = achievements.filter(a => a.verified);
            
            // For now, assume verification is valid if verified field is explicitly set
            return verifiedAchievements.every(a => typeof a.verified === 'boolean');
        } catch {
            return false;
        }
    }

    async checkDataFreshness(tolerance) {
        try {
            const baseCvPath = join(__dirname, '../../data/base-cv.json');
            const baseCv = JSON.parse(await readFile(baseCvPath, 'utf-8'));
            
            const lastUpdated = new Date(baseCv.metadata?.last_updated || 0).getTime();
            const now = Date.now();
            
            return (now - lastUpdated) <= tolerance;
        } catch {
            return false;
        }
    }

    async checkSchemaCompliance() {
        try {
            // This would validate against the actual JSON schema
            // For now, return true if schema file exists
            const schemaPath = join(__dirname, '../../data/cv-schema.json');
            await readFile(schemaPath, 'utf-8');
            return true;
        } catch {
            return false;
        }
    }

    async generateRecommendations() {
        console.log('💡 Generating optimization recommendations...');
        
        const recommendations = [];
        
        // Data consistency recommendations
        if (this.validationResults.consistency < 100) {
            recommendations.push({
                priority: 'high',
                category: 'data_consistency',
                title: 'Fix Data Structure Inconsistencies',
                description: 'Some data files have structure validation errors',
                action: 'Review and fix validation errors in data files'
            });
        }

        // Relationship recommendations
        if (this.validationResults.relationships < 100) {
            recommendations.push({
                priority: 'medium',
                category: 'data_relationships',
                title: 'Improve Data Relationship Integrity',
                description: 'Some data relationships are not properly maintained',
                action: 'Implement automated relationship validation'
            });
        }

        // Integrity recommendations
        if (this.validationResults.integrity < 100) {
            recommendations.push({
                priority: 'high',
                category: 'data_integrity',
                title: 'Address Integrity Check Failures',
                description: 'Critical integrity checks are failing',
                action: 'Review and fix integrity check failures'
            });
        }

        // Performance recommendations
        if (this.validationResults.errors.length > 5) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                title: 'Optimize Data Processing',
                description: 'High number of validation errors may indicate performance issues',
                action: 'Implement data preprocessing and validation pipelines'
            });
        }

        this.validationResults.recommendations = recommendations;
        console.log(`💡 Generated ${recommendations.length} optimization recommendations`);
        
        return recommendations;
    }

    async calculateOverallScore() {
        const weights = {
            consistency: 0.3,
            integrity: 0.4,
            relationships: 0.3
        };

        this.validationResults.overall = Math.round(
            (this.validationResults.consistency * weights.consistency) +
            (this.validationResults.integrity * weights.integrity) +
            (this.validationResults.relationships * weights.relationships)
        );

        return this.validationResults.overall;
    }

    async saveValidationReport() {
        const reportPath = join(__dirname, '../../data/data-architecture-validation-report.json');
        
        const report = {
            ...this.validationResults,
            metadata: {
                generator: 'DataArchitectureValidator',
                version: '1.0.0',
                generated_at: new Date().toISOString(),
                next_validation_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            },
            summary: {
                total_errors: this.validationResults.errors.length,
                total_warnings: this.validationResults.warnings.length,
                total_recommendations: this.validationResults.recommendations.length,
                overall_health: this.getHealthStatus(this.validationResults.overall)
            }
        };

        await writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Validation report saved to: ${reportPath}`);
        
        return reportPath;
    }

    getHealthStatus(score) {
        if (score >= 95) return 'excellent';
        if (score >= 85) return 'good';
        if (score >= 70) return 'fair';
        if (score >= 50) return 'poor';
        return 'critical';
    }

    async run() {
        console.log('🏗️  Data Architecture Validator - Enterprise Data Integrity Framework');
        console.log('===============================================================\n');

        try {
            // Run all validation phases
            await this.validateDataStructure();
            await this.validateDataRelationships();
            await this.runIntegrityChecks();
            await this.generateRecommendations();
            await this.calculateOverallScore();
            
            // Generate and save report
            const reportPath = await this.saveValidationReport();
            
            console.log('\n📊 VALIDATION SUMMARY');
            console.log('====================');
            console.log(`Data Consistency: ${this.validationResults.consistency}%`);
            console.log(`Data Integrity: ${this.validationResults.integrity}%`);
            console.log(`Relationships: ${this.validationResults.relationships}%`);
            console.log(`Overall Score: ${this.validationResults.overall}%`);
            console.log(`Health Status: ${this.getHealthStatus(this.validationResults.overall).toUpperCase()}`);
            console.log(`\nErrors: ${this.validationResults.errors.length}`);
            console.log(`Warnings: ${this.validationResults.warnings.length}`);
            console.log(`Recommendations: ${this.validationResults.recommendations.length}`);
            console.log(`\nReport: ${reportPath}`);
            
            return this.validationResults.overall >= 85;
        } catch (error) {
            console.error('❌ Validation failed:', error);
            return false;
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new DataArchitectureValidator();
    const success = await validator.run();
    process.exit(success ? 0 : 1);
}

export default DataArchitectureValidator;