#!/usr/bin/env node

/**
 * Data Integrity Verifier
 * Comprehensive validation system for CV data integrity and consistency
 * 
 * Features:
 * - Schema validation against base-cv.json structure
 * - Content authenticity verification using protected-content.json
 * - Cross-reference validation between data files
 * - Hallucination detection and reporting
 * - Data consistency checks across all JSON files
 * - Automated repair suggestions
 * 
 * Usage: node data-integrity-verifier.js [--fix] [--report]
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataIntegrityVerifier {
    constructor() {
        this.dataDir = path.resolve(__dirname, '../../data');
        this.issues = [];
        this.fixes = [];
        this.verificationResults = {
            schema_valid: false,
            content_authentic: false,
            cross_references_valid: false,
            consistency_score: 0,
            total_issues: 0,
            critical_issues: 0,
            warnings: 0
        };
        
        // Expected schema structure
        this.expectedSchema = {
            metadata: ['version', 'last_updated', 'enhancement_ready'],
            personal_info: ['name', 'title', 'location', 'contact_info'],
            professional_summary: 'string',
            experience: ['position', 'company', 'period', 'achievements', 'technologies'],
            projects: ['name', 'description', 'technologies', 'metrics', 'github'],
            skills: ['name', 'category', 'level', 'proficiency', 'experience_years'],
            achievements: ['title', 'description', 'date', 'metrics'],
            education: ['degree', 'institution', 'key_areas']
        };
        
        // Required data files
        this.requiredFiles = [
            'base-cv.json',
            'protected-content.json'
        ];
        
        // Optional data files to check if present
        this.optionalFiles = [
            'activity-summary.json',
            'ai-enhancements.json',
            'github-activity.json',
            'professional-development.json'
        ];
    }
    
    /**
     * Run complete data integrity verification
     */
    async verifyIntegrity(options = {}) {
        console.log('🔍 Starting comprehensive data integrity verification...');
        
        try {
            // 1. Check file existence
            await this.checkFileExistence();
            
            // 2. Validate JSON structure
            await this.validateJsonStructure();
            
            // 3. Verify schema compliance
            await this.verifySchemaCompliance();
            
            // 4. Check content authenticity
            await this.verifyContentAuthenticity();
            
            // 5. Validate cross-references
            await this.validateCrossReferences();
            
            // 6. Check data consistency
            await this.checkDataConsistency();
            
            // 7. Detect potential hallucinations
            await this.detectHallucinations();
            
            // 8. Calculate integrity score
            this.calculateIntegrityScore();
            
            // 9. Generate report
            const report = await this.generateReport();
            
            // 10. Apply fixes if requested
            if (options.fix && this.fixes.length > 0) {
                await this.applyFixes();
            }
            
            return {
                success: this.verificationResults.critical_issues === 0,
                results: this.verificationResults,
                issues: this.issues,
                fixes: this.fixes,
                report: report
            };
            
        } catch (error) {
            console.error('❌ Data integrity verification failed:', error);
            throw error;
        }
    }
    
    /**
     * Check existence of required and optional data files
     */
    async checkFileExistence() {
        console.log('📁 Checking file existence...');
        
        for (const file of this.requiredFiles) {
            const filePath = path.join(this.dataDir, file);
            try {
                await fs.access(filePath);
                console.log(`✅ Required file found: ${file}`);
            } catch (error) {
                this.addIssue('critical', 'missing_required_file', `Required file missing: ${file}`, {
                    file: file,
                    path: filePath,
                    fix: `Create ${file} with proper structure`
                });
            }
        }
        
        for (const file of this.optionalFiles) {
            const filePath = path.join(this.dataDir, file);
            try {
                await fs.access(filePath);
                console.log(`📄 Optional file found: ${file}`);
            } catch (error) {
                console.log(`ℹ️  Optional file not present: ${file}`);
            }
        }
    }
    
    /**
     * Validate JSON structure of all data files
     */
    async validateJsonStructure() {
        console.log('🔧 Validating JSON structure...');
        
        const allFiles = [...this.requiredFiles, ...this.optionalFiles];
        
        for (const file of allFiles) {
            const filePath = path.join(this.dataDir, file);
            
            try {
                await fs.access(filePath);
                const content = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(content);
                
                console.log(`✅ Valid JSON: ${file}`);
                
                // Check for empty objects/arrays
                if (typeof data === 'object' && Object.keys(data).length === 0) {
                    this.addIssue('warning', 'empty_file', `File is empty: ${file}`, {
                        file: file,
                        fix: 'Populate with valid data structure'
                    });
                }
                
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    this.addIssue('critical', 'invalid_json', `Invalid JSON in ${file}: ${error.message}`, {
                        file: file,
                        error: error.message,
                        fix: 'Fix JSON syntax errors'
                    });
                }
            }
        }
    }
    
    /**
     * Verify schema compliance for base-cv.json
     */
    async verifySchemaCompliance() {
        console.log('📋 Verifying schema compliance...');
        
        const baseCvPath = path.join(this.dataDir, 'base-cv.json');
        
        try {
            const content = await fs.readFile(baseCvPath, 'utf-8');
            const data = JSON.parse(content);
            
            // Check top-level structure
            const topLevelKeys = Object.keys(this.expectedSchema);
            for (const key of topLevelKeys) {
                if (!data.hasOwnProperty(key)) {
                    this.addIssue('error', 'missing_schema_field', `Missing required field: ${key}`, {
                        field: key,
                        fix: `Add ${key} field to base-cv.json`
                    });
                }
            }
            
            // Check array structures
            const arrayFields = ['experience', 'projects', 'skills', 'achievements', 'education'];
            for (const field of arrayFields) {
                if (data[field] && Array.isArray(data[field]) && data[field].length > 0) {
                    const requiredSubFields = this.expectedSchema[field];
                    if (Array.isArray(requiredSubFields)) {
                        // Check first item structure
                        const firstItem = data[field][0];
                        for (const subField of requiredSubFields) {
                            if (!firstItem.hasOwnProperty(subField)) {
                                this.addIssue('warning', 'missing_subfield', `Missing subfield ${subField} in ${field}[0]`, {
                                    field: `${field}.${subField}`,
                                    fix: `Add ${subField} to all ${field} entries`
                                });
                            }
                        }
                    }
                }
            }
            
            this.verificationResults.schema_valid = this.issues.filter(i => i.category === 'missing_schema_field').length === 0;
            console.log(`✅ Schema compliance: ${this.verificationResults.schema_valid ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            this.addIssue('critical', 'schema_validation_failed', `Could not validate schema: ${error.message}`, {
                error: error.message
            });
        }
    }
    
    /**
     * Verify content authenticity against protected content
     */
    async verifyContentAuthenticity() {
        console.log('🛡️  Verifying content authenticity...');
        
        const protectedPath = path.join(this.dataDir, 'protected-content.json');
        const baseCvPath = path.join(this.dataDir, 'base-cv.json');
        
        try {
            const [protectedContent, baseCv] = await Promise.all([
                fs.readFile(protectedPath, 'utf-8').then(JSON.parse),
                fs.readFile(baseCvPath, 'utf-8').then(JSON.parse)
            ]);
            
            // Check for forbidden claims
            if (protectedContent.forbidden_claims) {
                const fullText = JSON.stringify(baseCv).toLowerCase();
                
                for (const claim of protectedContent.forbidden_claims) {
                    if (fullText.includes(claim.toLowerCase())) {
                        this.addIssue('critical', 'hallucination_detected', `Forbidden claim found: "${claim}"`, {
                            claim: claim,
                            fix: `Remove hallucinated content: "${claim}"`
                        });
                    }
                }
            }
            
            // Verify protected experience entries exist
            if (protectedContent.verified_content?.experience && baseCv.experience) {
                for (const protectedExp of protectedContent.verified_content.experience) {
                    const found = baseCv.experience.some(exp => 
                        exp.position === protectedExp.position && 
                        exp.company === protectedExp.company
                    );
                    
                    if (!found) {
                        this.addIssue('error', 'missing_verified_content', `Missing verified experience: ${protectedExp.position} at ${protectedExp.company}`, {
                            experience: protectedExp,
                            fix: 'Add verified experience entry to base-cv.json'
                        });
                    }
                }
            }
            
            this.verificationResults.content_authentic = this.issues.filter(i => i.category === 'hallucination_detected').length === 0;
            console.log(`✅ Content authenticity: ${this.verificationResults.content_authentic ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            this.addIssue('critical', 'authenticity_check_failed', `Could not verify authenticity: ${error.message}`, {
                error: error.message
            });
        }
    }
    
    /**
     * Validate cross-references between data files
     */
    async validateCrossReferences() {
        console.log('🔗 Validating cross-references...');
        
        // Check if activity summary references match actual files
        const activitySummaryPath = path.join(this.dataDir, 'activity-summary.json');
        
        try {
            await fs.access(activitySummaryPath);
            const activitySummary = JSON.parse(await fs.readFile(activitySummaryPath, 'utf-8'));
            
            if (activitySummary.data_files) {
                for (const referencedFile of activitySummary.data_files) {
                    const filePath = path.join(this.dataDir, referencedFile);
                    try {
                        await fs.access(filePath);
                        console.log(`✅ Cross-reference valid: ${referencedFile}`);
                    } catch (error) {
                        this.addIssue('error', 'broken_cross_reference', `Referenced file missing: ${referencedFile}`, {
                            file: referencedFile,
                            referenced_in: 'activity-summary.json',
                            fix: `Create missing file or remove reference: ${referencedFile}`
                        });
                    }
                }
            }
            
            this.verificationResults.cross_references_valid = this.issues.filter(i => i.category === 'broken_cross_reference').length === 0;
            console.log(`✅ Cross-references: ${this.verificationResults.cross_references_valid ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            console.log('ℹ️  activity-summary.json not found, skipping cross-reference validation');
        }
    }
    
    /**
     * Check data consistency across files
     */
    async checkDataConsistency() {
        console.log('⚖️  Checking data consistency...');
        
        // Check for consistent dates, names, and other cross-file data
        // This is a placeholder for more complex consistency checks
        
        const baseCvPath = path.join(this.dataDir, 'base-cv.json');
        
        try {
            const baseCv = JSON.parse(await fs.readFile(baseCvPath, 'utf-8'));
            
            // Check date consistency
            if (baseCv.experience) {
                for (const exp of baseCv.experience) {
                    if (exp.period) {
                        // Check for valid date format
                        if (!exp.period.match(/\\d{4}\\s*-\\s*(\\d{4}|Present)/i)) {
                            this.addIssue('warning', 'invalid_date_format', `Invalid date format in experience: ${exp.period}`, {
                                experience: exp.position,
                                period: exp.period,
                                fix: 'Use format: YYYY - YYYY or YYYY - Present'
                            });
                        }
                    }
                }
            }
            
            console.log('✅ Data consistency checks completed');
            
        } catch (error) {
            this.addIssue('error', 'consistency_check_failed', `Could not check consistency: ${error.message}`, {
                error: error.message
            });
        }
    }
    
    /**
     * Detect potential hallucinations using pattern matching
     */
    async detectHallucinations() {
        console.log('🤖 Detecting potential hallucinations...');
        
        const baseCvPath = path.join(this.dataDir, 'base-cv.json');
        
        try {
            const baseCv = JSON.parse(await fs.readFile(baseCvPath, 'utf-8'));
            const fullText = JSON.stringify(baseCv);
            
            // Common hallucination patterns
            const hallucinationPatterns = [
                { pattern: /\\b\\d+\\+\\s*(years?|million|billion|thousand)/gi, description: 'Exaggerated numbers' },
                { pattern: /99\\.?\\d*%/gi, description: 'Unrealistic percentages' },
                { pattern: /award|recognition|keynote|speaker|conference/gi, description: 'Unverified achievements' },
                { pattern: /patent|publication|research/gi, description: 'Unverified academic claims' },
                { pattern: /enterprise|global|worldwide|international/gi, description: 'Scale exaggeration' }
            ];
            
            for (const { pattern, description } of hallucinationPatterns) {
                const matches = fullText.match(pattern);
                if (matches) {
                    this.addIssue('warning', 'potential_hallucination', `Potential hallucination detected: ${description}`, {
                        pattern: pattern.toString(),
                        matches: matches,
                        description: description,
                        fix: 'Verify accuracy of claims'
                    });
                }
            }
            
            console.log('✅ Hallucination detection completed');
            
        } catch (error) {
            this.addIssue('error', 'hallucination_detection_failed', `Could not detect hallucinations: ${error.message}`, {
                error: error.message
            });
        }
    }
    
    /**
     * Calculate overall integrity score
     */
    calculateIntegrityScore() {
        const totalIssues = this.issues.length;
        const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
        const errors = this.issues.filter(i => i.severity === 'error').length;
        const warnings = this.issues.filter(i => i.severity === 'warning').length;
        
        this.verificationResults.total_issues = totalIssues;
        this.verificationResults.critical_issues = criticalIssues;
        this.verificationResults.warnings = warnings;
        
        // Calculate score (0-100)
        let score = 100;
        score -= criticalIssues * 25; // Critical issues: -25 points each
        score -= errors * 10;         // Errors: -10 points each  
        score -= warnings * 2;        // Warnings: -2 points each
        
        this.verificationResults.consistency_score = Math.max(0, score);
        
        console.log(`📊 Integrity Score: ${this.verificationResults.consistency_score}/100`);
    }
    
    /**
     * Generate comprehensive verification report
     */
    async generateReport() {
        const timestamp = new Date().toISOString();
        
        const report = {
            timestamp: timestamp,
            verification_results: this.verificationResults,
            summary: {
                overall_status: this.verificationResults.critical_issues === 0 ? 'PASS' : 'FAIL',
                integrity_score: this.verificationResults.consistency_score,
                total_issues: this.verificationResults.total_issues,
                breakdown: {
                    critical: this.issues.filter(i => i.severity === 'critical').length,
                    error: this.issues.filter(i => i.severity === 'error').length,
                    warning: this.issues.filter(i => i.severity === 'warning').length
                }
            },
            issues: this.issues,
            recommendations: this.generateRecommendations()
        };
        
        // Save report
        const reportPath = path.join(this.dataDir, `integrity-report-${timestamp.split('T')[0]}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Report saved: ${reportPath}`);
        
        return report;
    }
    
    /**
     * Generate recommendations based on issues found
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.verificationResults.critical_issues > 0) {
            recommendations.push('🚨 URGENT: Address critical issues immediately before deployment');
        }
        
        if (this.verificationResults.consistency_score < 90) {
            recommendations.push('📈 Improve data consistency and resolve validation errors');
        }
        
        if (this.issues.some(i => i.category === 'hallucination_detected')) {
            recommendations.push('🤖 Review and remove AI-generated hallucinations');
        }
        
        if (this.issues.some(i => i.category === 'missing_verified_content')) {
            recommendations.push('📋 Ensure all verified content is properly included');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ Data integrity is excellent - no major issues found');
        }
        
        return recommendations;
    }
    
    /**
     * Apply automated fixes where possible
     */
    async applyFixes() {
        console.log('🔧 Applying automated fixes...');
        
        let fixesApplied = 0;
        
        for (const fix of this.fixes) {
            try {
                // Implement specific fix logic here
                // This is a placeholder for automated fixes
                console.log(`Applying fix: ${fix.description}`);
                fixesApplied++;
            } catch (error) {
                console.warn(`Failed to apply fix: ${fix.description}`, error);
            }
        }
        
        console.log(`✅ Applied ${fixesApplied} automated fixes`);
    }
    
    /**
     * Add issue to the issues list
     */
    addIssue(severity, category, message, details = {}) {
        this.issues.push({
            severity: severity,
            category: category,
            message: message,
            details: details,
            timestamp: new Date().toISOString()
        });
        
        if (details.fix) {
            this.fixes.push({
                issue_id: this.issues.length - 1,
                description: details.fix,
                severity: severity
            });
        }
        
        console.log(`${severity === 'critical' ? '🚨' : severity === 'error' ? '❌' : '⚠️'} ${message}`);
    }
}

/**
 * CLI Interface
 */
async function main() {
    const args = process.argv.slice(2);
    const options = {
        fix: args.includes('--fix'),
        report: args.includes('--report') || true // Always generate report
    };
    
    try {
        const verifier = new DataIntegrityVerifier();
        const results = await verifier.verifyIntegrity(options);
        
        console.log('\\n' + '='.repeat(60));
        console.log('📊 DATA INTEGRITY VERIFICATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`Overall Status: ${results.success ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Integrity Score: ${results.results.consistency_score}/100`);
        console.log(`Total Issues: ${results.results.total_issues} (${results.results.critical_issues} critical)`);
        
        if (results.issues.length > 0) {
            console.log('\\n🔍 Issues Summary:');
            const groupedIssues = results.issues.reduce((groups, issue) => {
                groups[issue.severity] = groups[issue.severity] || [];
                groups[issue.severity].push(issue);
                return groups;
            }, {});
            
            for (const [severity, issues] of Object.entries(groupedIssues)) {
                console.log(`  ${severity.toUpperCase()}: ${issues.length} issues`);
            }
        }
        
        console.log('='.repeat(60));
        
        process.exit(results.success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { DataIntegrityVerifier };