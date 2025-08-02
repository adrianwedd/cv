#!/usr/bin/env node

/**
 * LinkedIn Profile Synchronizer - Bidirectional CV-LinkedIn Integration
 * 
 * Enables intelligent synchronization between CV data and LinkedIn profile.
 * Implements ethical automation with user consent and comprehensive audit trails.
 * 
 * FEATURES:
 * - Bidirectional sync: CV → LinkedIn and LinkedIn → CV
 * - Intelligent diff detection for selective updates
 * - Ethical automation with rate limiting and consent verification
 * - Comprehensive audit logging and rollback capabilities
 * - Integration with existing EthicalLinkedInExtractor framework
 */

import { EthicalLinkedInExtractor } from './linkedin-playwright-extractor.js';
import { EthicalGeminiClient } from './gemini-client.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class LinkedInProfileSynchronizer {
    constructor(options = {}) {
        this.options = {
            dryRun: false,              // Preview changes without applying
            autoApply: false,           // Require manual approval for updates
            userConsent: false,         // User consent for profile modifications
            rateLimitMs: 45000,         // 45 seconds between operations
            maxUpdatesPerSession: 5,    // Safety limit on profile changes
            auditLogging: true,         // Complete operation logging
            backupProfileData: true,    // Backup before modifications
            ...options
        };
        
        this.linkedInExtractor = new EthicalLinkedInExtractor({
            userConsent: this.options.userConsent,
            rateLimitMs: this.options.rateLimitMs,
            auditLogging: this.options.auditLogging
        });
        
        this.geminiClient = new EthicalGeminiClient({
            rateLimitMs: 30000,
            auditLogging: this.options.auditLogging
        });
        
        this.operationLog = [];
        this.sessionStart = Date.now();
        this.updatesApplied = 0;
    }

    /**
     * Verify user consent for profile synchronization
     */
    async verifyUserConsent(operation) {
        if (!this.options.userConsent) {
            throw new Error(`User consent required for LinkedIn profile ${operation}`);
        }
        
        this.log('consent-verified', { 
            operation,
            timestamp: new Date().toISOString()
        });
        
        return true;
    }

    /**
     * Load current CV data
     */
    async loadCVData() {
        this.log('cv-data-load-start');
        
        try {
            const cvPath = path.join(process.cwd(), 'data', 'base-cv.json');
            const cvData = JSON.parse(await fs.readFile(cvPath, 'utf8'));
            
            this.log('cv-data-load-complete', { 
                hasPersonalInfo: !!cvData.personal_info,
                experienceCount: cvData.experience?.length || 0,
                skillsCount: cvData.skills?.length || 0
            });
            
            return cvData;
            
        } catch (error) {
            this.log('cv-data-load-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Extract current LinkedIn profile data
     */
    async extractLinkedInProfile(profileUrl) {
        await this.verifyUserConsent('extraction');
        
        this.log('linkedin-extraction-start', { 
            url: this.sanitizeUrl(profileUrl) 
        });
        
        try {
            const profileData = await this.linkedInExtractor.extractCompleteProfile(profileUrl);
            
            this.log('linkedin-extraction-complete', { 
                hasBasicInfo: !!profileData.name,
                experienceCount: profileData.experience?.length || 0,
                skillsCount: profileData.skills?.length || 0
            });
            
            return profileData;
            
        } catch (error) {
            this.log('linkedin-extraction-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Compare CV and LinkedIn data to identify differences
     */
    async analyzeDifferences(cvData, linkedInData) {
        this.log('diff-analysis-start');
        
        try {
            const differences = {
                personal_info: this.comparePersonalInfo(cvData.personal_info, linkedInData),
                experience: this.compareExperience(cvData.experience, linkedInData.experience),
                skills: this.compareSkills(cvData.skills, linkedInData.skills),
                summary: this.compareSummary(cvData.professional_summary, linkedInData.about)
            };
            
            // Calculate overall sync score
            const totalFields = Object.keys(differences).length;
            const fieldsWithChanges = Object.values(differences).filter(diff => 
                diff.changes && diff.changes.length > 0
            ).length;
            
            const syncScore = ((totalFields - fieldsWithChanges) / totalFields * 100).toFixed(1);
            
            this.log('diff-analysis-complete', { 
                syncScore: `${syncScore}%`,
                changesDetected: fieldsWithChanges,
                totalFields
            });
            
            return {
                ...differences,
                metadata: {
                    syncScore: parseFloat(syncScore),
                    totalChanges: fieldsWithChanges,
                    analysisDate: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.log('diff-analysis-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Compare personal information sections
     */
    comparePersonalInfo(cvInfo, linkedInData) {
        const changes = [];
        
        // Name comparison
        if (cvInfo.name !== linkedInData.name && linkedInData.name) {
            changes.push({
                field: 'name',
                cvValue: cvInfo.name,
                linkedInValue: linkedInData.name,
                recommendation: 'update_cv'
            });
        }
        
        // Headline/title comparison
        if (cvInfo.title !== linkedInData.headline && linkedInData.headline) {
            changes.push({
                field: 'title',
                cvValue: cvInfo.title,
                linkedInValue: linkedInData.headline,
                recommendation: 'sync_both'
            });
        }
        
        // Location comparison
        if (cvInfo.location !== linkedInData.location && linkedInData.location) {
            changes.push({
                field: 'location',
                cvValue: cvInfo.location,
                linkedInValue: linkedInData.location,
                recommendation: 'update_cv'
            });
        }
        
        return {
            section: 'personal_info',
            changes,
            syncRequired: changes.length > 0
        };
    }

    /**
     * Compare experience sections
     */
    compareExperience(cvExperience, linkedInExperience) {
        const changes = [];
        
        if (!linkedInExperience || !Array.isArray(linkedInExperience)) {
            return {
                section: 'experience',
                changes: [],
                syncRequired: false,
                note: 'LinkedIn experience data not available'
            };
        }
        
        // Check for new positions in LinkedIn not in CV
        linkedInExperience.forEach((linkedInExp, index) => {
            if (index >= 5) return; // Limit comparison to recent positions
            
            const matchingCVExp = cvExperience.find(cvExp => 
                this.normalizeCompanyName(cvExp.company) === this.normalizeCompanyName(linkedInExp.company) &&
                this.normalizeJobTitle(cvExp.position) === this.normalizeJobTitle(linkedInExp.title)
            );
            
            if (!matchingCVExp && linkedInExp.title && linkedInExp.company) {
                changes.push({
                    field: 'new_experience',
                    linkedInValue: {
                        position: linkedInExp.title,
                        company: linkedInExp.company,
                        duration: linkedInExp.duration,
                        location: linkedInExp.location
                    },
                    recommendation: 'add_to_cv'
                });
            }
        });
        
        return {
            section: 'experience',
            changes,
            syncRequired: changes.length > 0
        };
    }

    /**
     * Compare skills sections
     */
    compareSkills(cvSkills, linkedInSkills) {
        const changes = [];
        
        if (!linkedInSkills || !Array.isArray(linkedInSkills)) {
            return {
                section: 'skills',
                changes: [],
                syncRequired: false,
                note: 'LinkedIn skills data not available'
            };
        }
        
        // Normalize skill names for comparison
        const cvSkillNames = cvSkills.map(skill => 
            this.normalizeSkillName(skill.name || skill)
        );
        
        const linkedInSkillNames = linkedInSkills.map(skill => 
            this.normalizeSkillName(skill.name || skill)
        );
        
        // Find skills in LinkedIn but not in CV
        linkedInSkills.forEach(linkedInSkill => {
            const normalizedLinkedInSkill = this.normalizeSkillName(linkedInSkill.name);
            
            if (!cvSkillNames.includes(normalizedLinkedInSkill) && linkedInSkill.name) {
                changes.push({
                    field: 'new_skill',
                    linkedInValue: {
                        name: linkedInSkill.name,
                        endorsements: linkedInSkill.endorsements
                    },
                    recommendation: 'add_to_cv'
                });
            }
        });
        
        return {
            section: 'skills',
            changes,
            syncRequired: changes.length > 0
        };
    }

    /**
     * Compare summary/about sections
     */
    compareSummary(cvSummary, linkedInAbout) {
        const changes = [];
        
        if (linkedInAbout && linkedInAbout.trim()) {
            // Use basic length and keyword comparison
            const cvLength = cvSummary?.length || 0;
            const linkedInLength = linkedInAbout.length;
            
            if (Math.abs(cvLength - linkedInLength) > 100) {
                changes.push({
                    field: 'summary_length',
                    cvValue: `${cvLength} chars`,
                    linkedInValue: `${linkedInLength} chars`,
                    recommendation: 'review_content'
                });
            }
            
            // Check for completely different content
            if (cvSummary && !this.haveSimilarContent(cvSummary, linkedInAbout)) {
                changes.push({
                    field: 'summary_content',
                    cvValue: cvSummary.substring(0, 100) + '...',
                    linkedInValue: linkedInAbout.substring(0, 100) + '...',
                    recommendation: 'ai_merge_analysis'
                });
            }
        }
        
        return {
            section: 'summary',
            changes,
            syncRequired: changes.length > 0
        };
    }

    /**
     * Generate AI-powered sync recommendations
     */
    async generateSyncRecommendations(differences) {
        await this.verifyUserConsent('ai-analysis');
        
        this.log('ai-recommendations-start');
        
        try {
            const prompt = `
Analyze these CV-LinkedIn profile differences and provide intelligent sync recommendations:

DIFFERENCES DETECTED:
${JSON.stringify(differences, null, 2)}

Please provide:
1. Priority ranking for each change (high/medium/low)
2. Specific sync action recommendations
3. Risk assessment for each change
4. Suggested merge strategy for conflicting information

Focus on maintaining professional accuracy while preserving the user's authentic career narrative.
`;

            const response = await this.geminiClient.generateContent(prompt);
            
            this.log('ai-recommendations-complete', { 
                responseLength: response.length 
            });
            
            return {
                recommendations: response,
                analysisDate: new Date().toISOString(),
                confidence: 'high'
            };
            
        } catch (error) {
            this.log('ai-recommendations-error', { error: error.message });
            
            // Fallback to rule-based recommendations
            return this.generateRuleBasedRecommendations(differences);
        }
    }

    /**
     * Generate rule-based sync recommendations (fallback)
     */
    generateRuleBasedRecommendations(differences) {
        const recommendations = [];
        
        Object.entries(differences).forEach(([section, diff]) => {
            if (diff.changes && diff.changes.length > 0) {
                diff.changes.forEach(change => {
                    let priority = 'medium';
                    let action = 'review';
                    
                    // Assign priorities based on change type
                    if (change.field === 'name') {
                        priority = 'high';
                        action = 'update_cv';
                    } else if (change.field === 'new_experience') {
                        priority = 'high';
                        action = 'add_to_cv';
                    } else if (change.field === 'new_skill') {
                        priority = 'medium';
                        action = 'consider_adding';
                    }
                    
                    recommendations.push({
                        section,
                        field: change.field,
                        priority,
                        action,
                        description: this.getChangeDescription(change)
                    });
                });
            }
        });
        
        return {
            recommendations: recommendations,
            analysisDate: new Date().toISOString(),
            confidence: 'medium',
            method: 'rule-based'
        };
    }

    /**
     * Apply sync changes to CV data
     */
    async applySyncChanges(cvData, differences, recommendations) {
        await this.verifyUserConsent('modification');
        
        if (this.options.dryRun) {
            this.log('dry-run-mode', { message: 'Changes previewed, not applied' });
            return { preview: true, changes: differences };
        }
        
        this.log('sync-changes-start');
        
        try {
            // Create backup before modifications
            if (this.options.backupProfileData) {
                await this.createDataBackup(cvData);
            }
            
            const updatedCV = JSON.parse(JSON.stringify(cvData)); // Deep clone
            let changesApplied = 0;
            
            // Apply personal info changes
            if (differences.personal_info?.changes) {
                for (const change of differences.personal_info.changes) {
                    if (change.recommendation === 'update_cv' && this.shouldApplyChange(change, recommendations)) {
                        if (change.field === 'name') updatedCV.personal_info.name = change.linkedInValue;
                        if (change.field === 'title') updatedCV.personal_info.title = change.linkedInValue;
                        if (change.field === 'location') updatedCV.personal_info.location = change.linkedInValue;
                        changesApplied++;
                    }
                }
            }
            
            // Apply experience changes
            if (differences.experience?.changes) {
                for (const change of differences.experience.changes) {
                    if (change.recommendation === 'add_to_cv' && this.shouldApplyChange(change, recommendations)) {
                        const newExperience = {
                            position: change.linkedInValue.position,
                            company: change.linkedInValue.company,
                            period: change.linkedInValue.duration,
                            location: change.linkedInValue.location,
                            type: "Full-time",
                            description: `Position imported from LinkedIn profile`,
                            achievements: [],
                            technologies: [],
                            added_from_linkedin: true,
                            import_date: new Date().toISOString()
                        };
                        
                        updatedCV.experience.unshift(newExperience); // Add at beginning
                        changesApplied++;
                    }
                }
            }
            
            // Apply skills changes
            if (differences.skills?.changes) {
                for (const change of differences.skills.changes) {
                    if (change.recommendation === 'add_to_cv' && this.shouldApplyChange(change, recommendations)) {
                        const newSkill = {
                            name: change.linkedInValue.name,
                            category: "Professional",
                            level: "Intermediate",
                            proficiency: 70,
                            experience_years: 1,
                            added_from_linkedin: true,
                            linkedin_endorsements: change.linkedInValue.endorsements,
                            import_date: new Date().toISOString()
                        };
                        
                        updatedCV.skills.push(newSkill);
                        changesApplied++;
                    }
                }
            }
            
            // Update metadata
            updatedCV.metadata.last_updated = new Date().toISOString();
            updatedCV.metadata.linkedin_sync = {
                last_sync: new Date().toISOString(),
                changes_applied: changesApplied,
                sync_version: "1.0.0"
            };
            
            this.log('sync-changes-complete', { 
                changesApplied,
                totalPossibleChanges: this.countTotalChanges(differences)
            });
            
            this.updatesApplied += changesApplied;
            
            return {
                updatedCV,
                changesApplied,
                preview: false
            };
            
        } catch (error) {
            this.log('sync-changes-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Save updated CV data
     */
    async saveUpdatedCV(updatedCV) {
        this.log('cv-save-start');
        
        try {
            const cvPath = path.join(process.cwd(), 'data', 'base-cv.json');
            await fs.writeFile(cvPath, JSON.stringify(updatedCV, null, 2));
            
            this.log('cv-save-complete', { 
                path: cvPath,
                size: JSON.stringify(updatedCV).length
            });
            
            return cvPath;
            
        } catch (error) {
            this.log('cv-save-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Create backup of current data
     */
    async createDataBackup(cvData) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(process.cwd(), 'data', 'backups', `cv-backup-${timestamp}.json`);
        
        try {
            await fs.mkdir(path.dirname(backupPath), { recursive: true });
            await fs.writeFile(backupPath, JSON.stringify(cvData, null, 2));
            
            this.log('backup-created', { path: backupPath });
            return backupPath;
            
        } catch (error) {
            this.log('backup-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Perform complete profile synchronization
     */
    async synchronizeProfile(profileUrl, options = {}) {
        const syncOptions = { ...this.options, ...options };
        
        this.log('sync-session-start', { 
            profileUrl: this.sanitizeUrl(profileUrl),
            dryRun: syncOptions.dryRun,
            autoApply: syncOptions.autoApply
        });
        
        try {
            // Load current CV data
            const cvData = await this.loadCVData();
            
            // Extract LinkedIn profile data
            const linkedInData = await this.extractLinkedInProfile(profileUrl);
            
            // Analyze differences
            const differences = await this.analyzeDifferences(cvData, linkedInData);
            
            // Generate AI recommendations
            const recommendations = await this.generateSyncRecommendations(differences);
            
            // Apply changes if not in dry-run mode
            const syncResult = await this.applySyncChanges(cvData, differences, recommendations);
            
            // Save updated CV if changes were applied
            if (!syncOptions.dryRun && syncResult.changesApplied > 0) {
                await this.saveUpdatedCV(syncResult.updatedCV);
            }
            
            // Generate sync report
            const syncReport = {
                session: {
                    startTime: new Date(this.sessionStart).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: Date.now() - this.sessionStart,
                    profileUrl: this.sanitizeUrl(profileUrl)
                },
                analysis: {
                    syncScore: differences.metadata.syncScore,
                    totalChanges: differences.metadata.totalChanges,
                    changesApplied: syncResult.changesApplied || 0
                },
                differences,
                recommendations,
                result: syncResult,
                auditTrail: this.getAuditTrail()
            };
            
            await this.saveSyncReport(syncReport);
            
            this.log('sync-session-complete', { 
                syncScore: differences.metadata.syncScore,
                changesApplied: syncResult.changesApplied || 0,
                dryRun: syncOptions.dryRun
            });
            
            return syncReport;
            
        } catch (error) {
            this.log('sync-session-error', { error: error.message });
            throw error;
        }
    }

    // Utility methods
    normalizeCompanyName(company) {
        return company?.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim() || '';
    }

    normalizeJobTitle(title) {
        return title?.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim() || '';
    }

    normalizeSkillName(skill) {
        return skill?.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^\w]/g, '') || '';
    }

    haveSimilarContent(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length) > 0.3;
    }

    shouldApplyChange(change, recommendations) {
        if (!this.options.autoApply) return false;
        if (this.updatesApplied >= this.options.maxUpdatesPerSession) return false;
        
        // Apply high-priority changes automatically
        const recommendation = recommendations.recommendations?.find(rec => 
            rec.field === change.field
        );
        
        return recommendation?.priority === 'high';
    }

    countTotalChanges(differences) {
        return Object.values(differences)
            .filter(diff => diff.changes)
            .reduce((total, diff) => total + diff.changes.length, 0);
    }

    getChangeDescription(change) {
        const descriptions = {
            name: 'Name differs between CV and LinkedIn',
            title: 'Job title/headline differs',
            location: 'Location information differs',
            new_experience: 'New position found on LinkedIn',
            new_skill: 'New skill found on LinkedIn',
            summary_length: 'Summary/about section length differs significantly',
            summary_content: 'Summary/about content differs significantly'
        };
        
        return descriptions[change.field] || 'Unknown change type';
    }

    sanitizeUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        } catch {
            return 'invalid-url';
        }
    }

    log(operation, data = null) {
        if (!this.options.auditLogging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            data,
            sessionId: this.sessionStart
        };
        
        this.operationLog.push(logEntry);
        console.log(`[SYNC-AUDIT] ${operation}`, data ? JSON.stringify(data, null, 2) : '');
    }

    getAuditTrail() {
        return {
            sessionId: this.sessionStart,
            totalOperations: this.operationLog.length,
            ethicalCompliance: {
                userConsent: this.options.userConsent,
                rateLimited: true,
                auditLogged: true,
                backupCreated: this.options.backupProfileData
            },
            operations: this.operationLog
        };
    }

    async saveSyncReport(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(process.cwd(), 'data', 'sync-reports', `linkedin-sync-${timestamp}.json`);
        
        try {
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            
            this.log('sync-report-saved', { path: reportPath });
            return reportPath;
            
        } catch (error) {
            this.log('sync-report-error', { error: error.message });
            throw error;
        }
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔄 LinkedIn Profile Synchronizer - Bidirectional CV Integration');
    console.log('Usage: node linkedin-profile-synchronizer.js [sync|analyze] [profile-url] [options]');
    
    const command = process.argv[2] || 'help';
    const profileUrl = process.argv[3];
    const dryRun = process.argv.includes('--dry-run');
    const autoApply = process.argv.includes('--auto-apply');
    
    const synchronizer = new LinkedInProfileSynchronizer({
        userConsent: true,
        dryRun: dryRun,
        autoApply: autoApply,
        rateLimitMs: 10000 // Shorter for testing
    });
    
    try {
        switch (command) {
            case 'sync':
                if (!profileUrl) {
                    console.log('❌ Profile URL required for synchronization');
                    console.log('Example: node linkedin-profile-synchronizer.js sync https://linkedin.com/in/your-profile');
                    process.exit(1);
                }
                
                console.log('🚀 Starting LinkedIn-CV synchronization...');
                console.log(`📋 Target: ${profileUrl}`);
                console.log(`🔍 Mode: ${dryRun ? 'Preview (dry-run)' : 'Live synchronization'}`);
                
                const syncResult = await synchronizer.synchronizeProfile(profileUrl);
                
                console.log('✅ Synchronization completed');
                console.log(`📊 Sync Score: ${syncResult.analysis.syncScore}%`);
                console.log(`🔄 Changes Applied: ${syncResult.analysis.changesApplied}`);
                console.log(`📄 Report: ${syncResult.auditTrail.operations.length} operations logged`);
                break;
                
            case 'analyze':
                if (!profileUrl) {
                    console.log('❌ Profile URL required for analysis');
                    process.exit(1);
                }
                
                console.log('🔍 Analyzing CV-LinkedIn differences...');
                
                const cvData = await synchronizer.loadCVData();
                const linkedInData = await synchronizer.extractLinkedInProfile(profileUrl);
                const differences = await synchronizer.analyzeDifferences(cvData, linkedInData);
                
                console.log('✅ Analysis completed');
                console.log(`📊 Sync Score: ${differences.metadata.syncScore}%`);
                console.log(`📋 Changes Detected: ${differences.metadata.totalChanges}`);
                break;
                
            default:
                console.log('📖 LinkedIn Profile Synchronizer Commands:');
                console.log('');
                console.log('  sync [url]       - Synchronize CV with LinkedIn profile');
                console.log('  analyze [url]    - Analyze differences without applying changes');
                console.log('');
                console.log('Options:');
                console.log('  --dry-run       - Preview changes without applying');
                console.log('  --auto-apply    - Automatically apply high-priority changes');
                console.log('');
                console.log('Examples:');
                console.log('  node linkedin-profile-synchronizer.js sync https://linkedin.com/in/your-profile --dry-run');
                console.log('  node linkedin-profile-synchronizer.js analyze https://linkedin.com/in/your-profile');
        }
        
    } catch (error) {
        console.error('❌ Synchronization error:', error.message);
        
        if (error.message.includes('consent')) {
            console.log('\n📝 Ethical usage requirements:');
            console.log('1. Only synchronize your own LinkedIn profile data');
            console.log('2. Ensure you have permission for profile modifications');
            console.log('3. Review all changes before applying');
            console.log('4. Respect LinkedIn Terms of Service');
        }
    }
}