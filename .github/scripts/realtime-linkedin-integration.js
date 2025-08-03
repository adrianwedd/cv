#!/usr/bin/env node

/**
 * Real-Time LinkedIn Data Integration System
 * 
 * Monitors LinkedIn profile changes and provides live updates for CV enhancement.
 * Implements event-driven architecture with ethical rate limiting and data validation.
 * 
 * FEATURES:
 * - Real-time profile change detection and notification
 * - Event-driven CV updates with intelligent merging
 * - Professional activity timeline generation
 * - Achievement tracking and milestone recognition
 * - Integration with existing CV enhancement pipeline
 */

import { EthicalLinkedInExtractor } from './linkedin-playwright-extractor.js';
import { LinkedInProfileSynchronizer } from './linkedin-profile-synchronizer.js';
import { EthicalGeminiClient } from './gemini-client.js';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

export class RealTimeLinkedInIntegration extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            userConsent: false,           // User consent for real-time monitoring
            monitoringInterval: 300000,   // 5 minutes between checks
            changeDetectionThreshold: 5,  // Minimum character difference to trigger update
            maxUpdatesPerHour: 12,        // Safety limit on automatic updates
            enableNotifications: true,    // Push notifications for changes
            autoSyncChanges: false,       // Automatically sync detected changes
            profileUrl: null,             // LinkedIn profile URL to monitor
            auditLogging: true,           // Complete operation logging
            ...options
        };
        
        this.linkedInExtractor = new EthicalLinkedInExtractor({
            userConsent: this.options.userConsent,
            rateLimitMs: 60000, // 1 minute rate limit for monitoring
            auditLogging: this.options.auditLogging
        });
        
        this.profileSynchronizer = new LinkedInProfileSynchronizer({
            userConsent: this.options.userConsent,
            dryRun: !this.options.autoSyncChanges,
            auditLogging: this.options.auditLogging
        });
        
        this.geminiClient = new EthicalGeminiClient({
            rateLimitMs: 120000, // 2 minutes for AI analysis
            auditLogging: this.options.auditLogging
        });
        
        this.monitoringActive = false;
        this.lastKnownProfile = null;
        this.updateQueue = [];
        this.operationLog = [];
        this.sessionStart = Date.now();
        this.updatesThisHour = 0;
        this.lastHourReset = Date.now();
        
        // Event listeners for change notifications
        this.setupEventListeners();
    }

    /**
     * Initialize real-time monitoring system
     */
    async initialize() {
        await this.verifyUserConsent('real-time-monitoring');
        
        this.log('realtime-integration-init-start', {
            profileUrl: this.sanitizeUrl(this.options.profileUrl),
            monitoringInterval: this.options.monitoringInterval,
            autoSync: this.options.autoSyncChanges
        });
        
        try {
            // Load initial profile state
            await this.loadInitialProfileState();
            
            // Setup monitoring infrastructure
            await this.setupMonitoringInfrastructure();
            
            this.log('realtime-integration-init-complete', {
                hasInitialProfile: !!this.lastKnownProfile,
                monitoringReady: true
            });
            
            return true;
            
        } catch (error) {
            this.log('realtime-integration-init-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Load initial profile state for comparison
     */
    async loadInitialProfileState() {
        this.log('initial-profile-load-start');
        
        try {
            if (!this.options.profileUrl) {
                throw new Error('Profile URL required for real-time monitoring');
            }
            
            // Extract current profile state
            const profileData = await this.linkedInExtractor.extractCompleteProfile(
                this.options.profileUrl
            );
            
            // Create baseline fingerprint for change detection
            const profileFingerprint = this.createProfileFingerprint(profileData);
            
            this.lastKnownProfile = {
                data: profileData,
                fingerprint: profileFingerprint,
                lastUpdated: new Date().toISOString(),
                checkCount: 1
            };
            
            // Save initial state
            await this.saveProfileSnapshot(this.lastKnownProfile, 'initial');
            
            this.log('initial-profile-load-complete', {
                profileLoaded: !!profileData.name,
                fingerprintCreated: true,
                dataPoints: Object.keys(profileData).length
            });
            
            return this.lastKnownProfile;
            
        } catch (error) {
            this.log('initial-profile-load-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Setup monitoring infrastructure and event handling
     */
    async setupMonitoringInfrastructure() {
        this.log('monitoring-infrastructure-setup-start');
        
        try {
            // Create data directories
            const dataDir = path.join(process.cwd(), 'data', 'realtime-linkedin');
            await fs.mkdir(dataDir, { recursive: true });
            
            // Setup change detection directories
            const dirs = ['snapshots', 'changes', 'notifications', 'activity-timeline'];
            for (const dir of dirs) {
                await fs.mkdir(path.join(dataDir, dir), { recursive: true });
            }
            
            // Initialize activity timeline
            await this.initializeActivityTimeline();
            
            this.log('monitoring-infrastructure-setup-complete', {
                dataDirectoriesCreated: dirs.length,
                timelineInitialized: true
            });
            
            return true;
            
        } catch (error) {
            this.log('monitoring-infrastructure-setup-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Start real-time monitoring
     */
    async startMonitoring() {
        if (this.monitoringActive) {
            this.log('monitoring-already-active');
            return;
        }
        
        await this.verifyUserConsent('start-monitoring');
        
        this.log('monitoring-start', {
            profileUrl: this.sanitizeUrl(this.options.profileUrl),
            interval: this.options.monitoringInterval
        });
        
        this.monitoringActive = true;
        
        // Start monitoring loop
        this.monitoringLoop();
        
        // Emit start event
        this.emit('monitoring-started', {
            profileUrl: this.options.profileUrl,
            startTime: new Date().toISOString()
        });
        
        return true;
    }

    /**
     * Stop real-time monitoring
     */
    async stopMonitoring() {
        this.log('monitoring-stop');
        
        this.monitoringActive = false;
        
        if (this.monitoringTimeout) {
            clearTimeout(this.monitoringTimeout);
        }
        
        // Emit stop event
        this.emit('monitoring-stopped', {
            stopTime: new Date().toISOString(),
            totalChecks: this.lastKnownProfile?.checkCount || 0
        });
        
        return true;
    }

    /**
     * Main monitoring loop
     */
    async monitoringLoop() {
        if (!this.monitoringActive) return;
        
        this.log('monitoring-check-start', {
            checkNumber: this.lastKnownProfile?.checkCount || 0
        });
        
        try {
            // Check for profile changes
            const changeDetected = await this.checkForProfileChanges();
            
            if (changeDetected) {
                await this.handleProfileChanges(changeDetected);
            }
            
            // Reset hourly update counter
            this.resetHourlyCounterIfNeeded();
            
        } catch (error) {
            this.log('monitoring-check-error', { error: error.message });
            
            // Emit error event
            this.emit('monitoring-error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
        
        // Schedule next check
        if (this.monitoringActive) {
            this.monitoringTimeout = setTimeout(() => {
                this.monitoringLoop();
            }, this.options.monitoringInterval);
        }
    }

    /**
     * Check for profile changes by comparing current state with last known state
     */
    async checkForProfileChanges() {
        this.log('change-detection-start');
        
        try {
            // Extract current profile state
            const currentProfile = await this.linkedInExtractor.extractCompleteProfile(
                this.options.profileUrl
            );
            
            // Create current fingerprint
            const currentFingerprint = this.createProfileFingerprint(currentProfile);
            
            // Compare with last known state
            const changes = this.detectChanges(
                this.lastKnownProfile.fingerprint,
                currentFingerprint,
                this.lastKnownProfile.data,
                currentProfile
            );
            
            // Update check count
            this.lastKnownProfile.checkCount = (this.lastKnownProfile.checkCount || 0) + 1;
            
            if (changes.hasChanges) {
                this.log('changes-detected', {
                    changeCount: changes.changes.length,
                    changeTypes: changes.changes.map(c => c.type),
                    significance: changes.significance
                });
                
                // Update last known profile
                this.lastKnownProfile = {
                    data: currentProfile,
                    fingerprint: currentFingerprint,
                    lastUpdated: new Date().toISOString(),
                    checkCount: this.lastKnownProfile.checkCount,
                    changes: changes
                };
                
                // Save snapshot
                await this.saveProfileSnapshot(this.lastKnownProfile, 'change-detected');
                
                return changes;
            } else {
                this.log('no-changes-detected', {
                    checkCount: this.lastKnownProfile.checkCount
                });
                
                return null;
            }
            
        } catch (error) {
            this.log('change-detection-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Handle detected profile changes
     */
    async handleProfileChanges(changes) {
        this.log('change-handling-start', {
            changeCount: changes.changes.length,
            significance: changes.significance
        });
        
        try {
            // Generate AI analysis of changes
            const changeAnalysis = await this.analyzeChanges(changes);
            
            // Create change notification
            const notification = await this.createChangeNotification(changes, changeAnalysis);
            
            // Save change record
            await this.saveChangeRecord(changes, changeAnalysis);
            
            // Update activity timeline
            await this.updateActivityTimeline(changes, changeAnalysis);
            
            // Emit change event
            this.emit('profile-changed', {
                changes,
                analysis: changeAnalysis,
                notification,
                timestamp: new Date().toISOString()
            });
            
            // Auto-sync if enabled and within limits
            if (this.shouldAutoSync(changes)) {
                await this.performAutoSync(changes);
            }
            
            // Send notification if enabled
            if (this.options.enableNotifications) {
                await this.sendNotification(notification);
            }
            
            this.log('change-handling-complete', {
                analysisGenerated: !!changeAnalysis,
                notificationCreated: !!notification,
                autoSyncPerformed: this.shouldAutoSync(changes)
            });
            
        } catch (error) {
            this.log('change-handling-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Create profile fingerprint for change detection
     */
    createProfileFingerprint(profileData) {
        const fingerprint = {
            name: profileData.name || '',
            headline: profileData.headline || '',
            about: (profileData.about || '').substring(0, 100),
            location: profileData.location || '',
            experience_count: profileData.experience?.length || 0,
            skills_count: profileData.skills?.length || 0,
            connections: profileData.connections || '',
            
            // Create content hashes for detailed comparison
            experience_hash: this.createContentHash(profileData.experience),
            skills_hash: this.createContentHash(profileData.skills),
            about_hash: this.createContentHash(profileData.about),
            
            // Timestamp
            created: new Date().toISOString()
        };
        
        return fingerprint;
    }

    /**
     * Detect changes between profile states
     */
    detectChanges(oldFingerprint, newFingerprint, oldData, newData) {
        const changes = [];
        
        // Basic field changes
        const basicFields = ['name', 'headline', 'location', 'connections'];
        basicFields.forEach(field => {
            if (oldFingerprint[field] !== newFingerprint[field]) {
                changes.push({
                    type: 'field_update',
                    field,
                    oldValue: oldFingerprint[field],
                    newValue: newFingerprint[field],
                    significance: this.getFieldSignificance(field)
                });
            }
        });
        
        // About section changes
        if (oldFingerprint.about_hash !== newFingerprint.about_hash) {
            const aboutChange = this.analyzeAboutChanges(oldData.about, newData.about);
            if (aboutChange.isSignificant) {
                changes.push({
                    type: 'about_update',
                    field: 'about',
                    change: aboutChange,
                    significance: 'medium'
                });
            }
        }
        
        // Experience changes
        if (oldFingerprint.experience_count !== newFingerprint.experience_count ||
            oldFingerprint.experience_hash !== newFingerprint.experience_hash) {
            
            const experienceChanges = this.analyzeExperienceChanges(
                oldData.experience, 
                newData.experience
            );
            
            experienceChanges.forEach(change => {
                changes.push({
                    type: 'experience_update',
                    field: 'experience',
                    change,
                    significance: 'high'
                });
            });
        }
        
        // Skills changes
        if (oldFingerprint.skills_count !== newFingerprint.skills_count ||
            oldFingerprint.skills_hash !== newFingerprint.skills_hash) {
            
            const skillChanges = this.analyzeSkillChanges(oldData.skills, newData.skills);
            
            skillChanges.forEach(change => {
                changes.push({
                    type: 'skills_update',
                    field: 'skills',
                    change,
                    significance: 'medium'
                });
            });
        }
        
        // Calculate overall significance
        const overallSignificance = this.calculateOverallSignificance(changes);
        
        return {
            hasChanges: changes.length > 0,
            changes,
            significance: overallSignificance,
            detectionTime: new Date().toISOString()
        };
    }

    /**
     * Analyze changes using AI
     */
    async analyzeChanges(changes) {
        this.log('ai-change-analysis-start', {
            changeCount: changes.changes.length
        });
        
        try {
            const prompt = `
Analyze these LinkedIn profile changes for professional significance and CV update recommendations:

DETECTED CHANGES:
${JSON.stringify(changes.changes, null, 2)}

Please provide:
1. Professional impact assessment (high/medium/low)
2. Recommended CV update actions
3. Career milestone identification
4. Strategic networking implications
5. Timeline urgency for updates

Focus on authentic professional development insights.
`;

            const response = await this.geminiClient.generateContent(prompt);
            
            const analysis = {
                ai_assessment: response,
                impact_level: this.extractImpactLevel(response),
                recommended_actions: this.extractRecommendedActions(response),
                career_milestones: this.extractCareerMilestones(response),
                networking_implications: this.extractNetworkingImplications(response),
                update_urgency: this.extractUpdateUrgency(response),
                analysis_date: new Date().toISOString()
            };
            
            this.log('ai-change-analysis-complete', {
                impactLevel: analysis.impact_level,
                actionsRecommended: analysis.recommended_actions?.length || 0
            });
            
            return analysis;
            
        } catch (error) {
            this.log('ai-change-analysis-error', { error: error.message });
            
            // Fallback to rule-based analysis
            return this.performRuleBasedChangeAnalysis(changes);
        }
    }

    /**
     * Create change notification
     */
    async createChangeNotification(changes, analysis) {
        const notification = {
            id: `linkedin-change-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'linkedin_profile_change',
            severity: this.getNotificationSeverity(changes.significance),
            title: this.generateNotificationTitle(changes),
            message: this.generateNotificationMessage(changes, analysis),
            changes: changes.changes.map(c => ({
                type: c.type,
                field: c.field,
                summary: this.getChangeSummary(c)
            })),
            recommended_actions: analysis.recommended_actions || [],
            update_urgency: analysis.update_urgency || 'medium',
            
            // Action buttons
            actions: [
                {
                    id: 'sync_changes',
                    label: 'Sync to CV',
                    type: 'primary',
                    enabled: this.canAutoSync()
                },
                {
                    id: 'view_changes',
                    label: 'Review Changes',
                    type: 'secondary',
                    enabled: true
                },
                {
                    id: 'dismiss',
                    label: 'Dismiss',
                    type: 'tertiary',
                    enabled: true
                }
            ]
        };
        
        return notification;
    }

    /**
     * Save change record for audit trail
     */
    async saveChangeRecord(changes, analysis) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const changeRecord = {
            detection_time: changes.detectionTime,
            changes: changes.changes,
            significance: changes.significance,
            analysis,
            profile_url: this.sanitizeUrl(this.options.profileUrl),
            session_id: this.sessionStart,
            record_id: `change-${timestamp}`
        };
        
        const recordPath = path.join(
            process.cwd(),
            'data',
            'realtime-linkedin',
            'changes',
            `linkedin-change-${timestamp}.json`
        );
        
        try {
            await fs.writeFile(recordPath, JSON.stringify(changeRecord, null, 2));
            
            this.log('change-record-saved', { path: recordPath });
            return recordPath;
            
        } catch (error) {
            this.log('change-record-save-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Update activity timeline with changes
     */
    async updateActivityTimeline(changes, analysis) {
        this.log('timeline-update-start');
        
        try {
            const timelineEntry = {
                id: `linkedin-${Date.now()}`,
                timestamp: new Date().toISOString(),
                source: 'linkedin',
                type: 'profile_update',
                significance: changes.significance,
                changes: changes.changes,
                analysis_summary: analysis.ai_assessment?.substring(0, 200) + '...',
                impact_level: analysis.impact_level,
                career_milestone: analysis.career_milestones?.length > 0
            };
            
            // Load existing timeline
            const timelinePath = path.join(
                process.cwd(),
                'data',
                'realtime-linkedin',
                'activity-timeline',
                'professional-timeline.json'
            );
            
            let timeline = [];
            try {
                const timelineData = await fs.readFile(timelinePath, 'utf8');
                timeline = JSON.parse(timelineData);
            } catch {
                // Timeline doesn't exist yet, start fresh
            }
            
            // Add new entry
            timeline.unshift(timelineEntry);
            
            // Keep only last 100 entries
            timeline = timeline.slice(0, 100);
            
            // Save updated timeline
            await fs.writeFile(timelinePath, JSON.stringify(timeline, null, 2));
            
            this.log('timeline-update-complete', {
                entriesCount: timeline.length,
                newEntryId: timelineEntry.id
            });
            
            return timelineEntry;
            
        } catch (error) {
            this.log('timeline-update-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Perform automatic synchronization if conditions are met
     */
    async performAutoSync(changes) {
        if (!this.options.autoSyncChanges) return false;
        if (!this.canAutoSync()) return false;
        
        this.log('auto-sync-start', {
            changeCount: changes.changes.length,
            significance: changes.significance
        });
        
        try {
            // Perform synchronization
            const syncResult = await this.profileSynchronizer.synchronizeProfile(
                this.options.profileUrl,
                { 
                    dryRun: false,
                    autoApply: true
                }
            );
            
            this.updatesThisHour++;
            
            this.log('auto-sync-complete', {
                changesApplied: syncResult.analysis.changesApplied,
                syncScore: syncResult.analysis.syncScore
            });
            
            // Emit sync event
            this.emit('auto-sync-completed', {
                syncResult,
                triggerChanges: changes,
                timestamp: new Date().toISOString()
            });
            
            return syncResult;
            
        } catch (error) {
            this.log('auto-sync-error', { error: error.message });
            
            // Emit sync error event
            this.emit('auto-sync-error', {
                error: error.message,
                triggerChanges: changes,
                timestamp: new Date().toISOString()
            });
            
            return false;
        }
    }

    /**
     * Send notification (placeholder for notification system integration)
     */
    async sendNotification(notification) {
        this.log('notification-send', {
            notificationId: notification.id,
            severity: notification.severity,
            title: notification.title
        });
        
        // Save notification for dashboard display
        const notificationPath = path.join(
            process.cwd(),
            'data',
            'realtime-linkedin',
            'notifications',
            `notification-${notification.id}.json`
        );
        
        try {
            await fs.writeFile(notificationPath, JSON.stringify(notification, null, 2));
            
            // Emit notification event
            this.emit('notification-created', notification);
            
            return true;
            
        } catch (error) {
            this.log('notification-send-error', { error: error.message });
            return false;
        }
    }

    // Utility and analysis methods
    createContentHash(content) {
        if (!content) return '';
        
        const contentString = typeof content === 'string' ? content : JSON.stringify(content);
        
        // Simple hash function for change detection
        let hash = 0;
        for (let i = 0; i < contentString.length; i++) {
            const char = contentString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return hash.toString(36);
    }

    getFieldSignificance(field) {
        const significance = {
            name: 'high',
            headline: 'high',
            location: 'medium',
            connections: 'low'
        };
        
        return significance[field] || 'medium';
    }

    analyzeAboutChanges(oldAbout, newAbout) {
        if (!oldAbout && !newAbout) return { isSignificant: false };
        
        const oldLength = oldAbout?.length || 0;
        const newLength = newAbout?.length || 0;
        const lengthDiff = Math.abs(oldLength - newLength);
        
        return {
            isSignificant: lengthDiff >= this.options.changeDetectionThreshold,
            lengthChange: newLength - oldLength,
            type: newLength > oldLength ? 'expansion' : 'reduction',
            significance: lengthDiff > 50 ? 'high' : 'medium'
        };
    }

    analyzeExperienceChanges(oldExperience, newExperience) {
        const changes = [];
        
        if (!oldExperience) oldExperience = [];
        if (!newExperience) newExperience = [];
        
        // Check for new positions
        if (newExperience.length > oldExperience.length) {
            changes.push({
                type: 'position_added',
                count: newExperience.length - oldExperience.length,
                newPositions: newExperience.slice(0, newExperience.length - oldExperience.length)
            });
        }
        
        // Check for removed positions
        if (newExperience.length < oldExperience.length) {
            changes.push({
                type: 'position_removed',
                count: oldExperience.length - newExperience.length
            });
        }
        
        // Check for position updates (simplified comparison)
        const commonLength = Math.min(oldExperience.length, newExperience.length);
        for (let i = 0; i < commonLength; i++) {
            const oldPos = oldExperience[i];
            const newPos = newExperience[i];
            
            if (oldPos.title !== newPos.title || oldPos.company !== newPos.company) {
                changes.push({
                    type: 'position_updated',
                    position: i,
                    oldTitle: oldPos.title,
                    newTitle: newPos.title,
                    oldCompany: oldPos.company,
                    newCompany: newPos.company
                });
            }
        }
        
        return changes;
    }

    analyzeSkillChanges(oldSkills, newSkills) {
        const changes = [];
        
        if (!oldSkills) oldSkills = [];
        if (!newSkills) newSkills = [];
        
        const oldSkillNames = oldSkills.map(s => (s.name || s).toLowerCase());
        const newSkillNames = newSkills.map(s => (s.name || s).toLowerCase());
        
        // New skills
        const addedSkills = newSkillNames.filter(skill => !oldSkillNames.includes(skill));
        if (addedSkills.length > 0) {
            changes.push({
                type: 'skills_added',
                skills: addedSkills,
                count: addedSkills.length
            });
        }
        
        // Removed skills
        const removedSkills = oldSkillNames.filter(skill => !newSkillNames.includes(skill));
        if (removedSkills.length > 0) {
            changes.push({
                type: 'skills_removed',
                skills: removedSkills,
                count: removedSkills.length
            });
        }
        
        return changes;
    }

    calculateOverallSignificance(changes) {
        if (changes.length === 0) return 'none';
        
        const highCount = changes.filter(c => c.significance === 'high').length;
        const mediumCount = changes.filter(c => c.significance === 'medium').length;
        
        if (highCount > 0) return 'high';
        if (mediumCount > 1) return 'high';
        if (mediumCount === 1) return 'medium';
        return 'low';
    }

    shouldAutoSync(changes) {
        return this.options.autoSyncChanges &&
               this.canAutoSync() &&
               changes.significance === 'high' &&
               this.updatesThisHour < this.options.maxUpdatesPerHour;
    }

    canAutoSync() {
        return this.updatesThisHour < this.options.maxUpdatesPerHour;
    }

    resetHourlyCounterIfNeeded() {
        const now = Date.now();
        if (now - this.lastHourReset > 3600000) { // 1 hour
            this.updatesThisHour = 0;
            this.lastHourReset = now;
            this.log('hourly-counter-reset', { timestamp: new Date().toISOString() });
        }
    }

    // Notification generation methods
    generateNotificationTitle(changes) {
        const changeCount = changes.changes.length;
        const significance = changes.significance;
        
        if (changeCount === 1) {
            const change = changes.changes[0];
            return `LinkedIn ${change.field} updated`;
        }
        
        return `${changeCount} LinkedIn profile changes detected`;
    }

    generateNotificationMessage(changes, analysis) {
        const changeTypes = [...new Set(changes.changes.map(c => c.type))];
        const impactLevel = analysis.impact_level || 'medium';
        
        let message = `Your LinkedIn profile has been updated with ${changes.changes.length} changes. `;
        
        if (changeTypes.includes('experience_update')) {
            message += 'Professional experience updated. ';
        }
        if (changeTypes.includes('skills_update')) {
            message += 'Skills section modified. ';
        }
        if (changeTypes.includes('field_update')) {
            message += 'Profile information updated. ';
        }
        
        message += `Impact level: ${impactLevel}.`;
        
        if (analysis.recommended_actions && analysis.recommended_actions.length > 0) {
            message += ` Recommended actions available.`;
        }
        
        return message;
    }

    getNotificationSeverity(significance) {
        const severityMap = {
            high: 'warning',
            medium: 'info',
            low: 'info',
            none: 'info'
        };
        
        return severityMap[significance] || 'info';
    }

    getChangeSummary(change) {
        switch (change.type) {
            case 'field_update':
                return `${change.field} changed from "${change.oldValue}" to "${change.newValue}"`;
            case 'experience_update':
                return `Experience section updated: ${change.change.type}`;
            case 'skills_update':
                return `Skills updated: ${change.change.type} (${change.change.count} items)`;
            case 'about_update':
                return `About section updated: ${change.change.type}`;
            default:
                return `${change.type} detected`;
        }
    }

    // AI response parsing methods
    extractImpactLevel(response) {
        const impactMatch = response.match(/impact.*?(high|medium|low)/i);
        return impactMatch ? impactMatch[1].toLowerCase() : 'medium';
    }

    extractRecommendedActions(response) {
        const actions = [];
        const actionSection = response.match(/recommended.*?actions?[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        
        if (actionSection) {
            const lines = actionSection[1].split('\n');
            lines.forEach(line => {
                if (line.trim() && line.length > 10) {
                    actions.push(line.trim().replace(/^[-*]\s*/, ''));
                }
            });
        }
        
        return actions.length > 0 ? actions : ['Review changes and consider CV updates'];
    }

    extractCareerMilestones(response) {
        const milestones = [];
        const milestoneSection = response.match(/milestone[s]?[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        
        if (milestoneSection) {
            const lines = milestoneSection[1].split('\n');
            lines.forEach(line => {
                if (line.trim() && line.length > 10) {
                    milestones.push(line.trim().replace(/^[-*]\s*/, ''));
                }
            });
        }
        
        return milestones;
    }

    extractNetworkingImplications(response) {
        const networkingMatch = response.match(/networking.*?implications?[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        return networkingMatch ? networkingMatch[1].trim() : 
            'Profile changes may enhance networking opportunities';
    }

    extractUpdateUrgency(response) {
        const urgencyMatch = response.match(/urgency.*?(urgent|high|medium|low)/i);
        return urgencyMatch ? urgencyMatch[1].toLowerCase() : 'medium';
    }

    // Fallback analysis methods
    performRuleBasedChangeAnalysis(changes) {
        const hasHighImpactChanges = changes.changes.some(c => 
            c.significance === 'high' || c.type === 'experience_update'
        );
        
        return {
            ai_assessment: 'Rule-based analysis performed due to AI limitations',
            impact_level: hasHighImpactChanges ? 'high' : 'medium',
            recommended_actions: [
                'Review detected changes',
                'Consider CV synchronization',
                'Update professional profiles'
            ],
            career_milestones: [],
            networking_implications: 'Profile updates may affect professional visibility',
            update_urgency: hasHighImpactChanges ? 'high' : 'medium',
            analysis_date: new Date().toISOString()
        };
    }

    // Infrastructure methods
    async initializeActivityTimeline() {
        const timelinePath = path.join(
            process.cwd(),
            'data',
            'realtime-linkedin',
            'activity-timeline',
            'professional-timeline.json'
        );
        
        try {
            // Check if timeline exists
            await fs.access(timelinePath);
        } catch {
            // Create initial timeline
            const initialTimeline = [{
                id: `init-${Date.now()}`,
                timestamp: new Date().toISOString(),
                source: 'system',
                type: 'timeline_initialized',
                significance: 'low',
                changes: [],
                analysis_summary: 'Professional activity timeline initialized',
                impact_level: 'low',
                career_milestone: false
            }];
            
            await fs.writeFile(timelinePath, JSON.stringify(initialTimeline, null, 2));
        }
    }

    async saveProfileSnapshot(profileState, reason) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const snapshotPath = path.join(
            process.cwd(),
            'data',
            'realtime-linkedin',
            'snapshots',
            `profile-snapshot-${timestamp}.json`
        );
        
        const snapshot = {
            reason,
            timestamp: profileState.lastUpdated,
            check_count: profileState.checkCount,
            profile_data: profileState.data,
            fingerprint: profileState.fingerprint,
            changes: profileState.changes || null
        };
        
        try {
            await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
            this.log('snapshot-saved', { path: snapshotPath, reason });
            return snapshotPath;
        } catch (error) {
            this.log('snapshot-save-error', { error: error.message });
            throw error;
        }
    }

    setupEventListeners() {
        // Log all events for debugging
        this.on('monitoring-started', (data) => {
            this.log('event-monitoring-started', data);
        });
        
        this.on('monitoring-stopped', (data) => {
            this.log('event-monitoring-stopped', data);
        });
        
        this.on('profile-changed', (data) => {
            this.log('event-profile-changed', {
                changeCount: data.changes.changes.length,
                significance: data.changes.significance
            });
        });
        
        this.on('auto-sync-completed', (data) => {
            this.log('event-auto-sync-completed', {
                changesApplied: data.syncResult.analysis.changesApplied
            });
        });
        
        this.on('notification-created', (data) => {
            this.log('event-notification-created', {
                notificationId: data.id,
                severity: data.severity
            });
        });
    }

    // Utility methods
    async verifyUserConsent(operation) {
        if (!this.options.userConsent) {
            throw new Error(`User consent required for ${operation}`);
        }
        
        this.log('consent-verified', { operation });
        return true;
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
        console.log(`[REALTIME-AUDIT] ${operation}`, data ? JSON.stringify(data, null, 2) : '');
    }

    getAuditTrail() {
        return {
            sessionId: this.sessionStart,
            totalOperations: this.operationLog.length,
            monitoringActive: this.monitoringActive,
            lastKnownProfile: this.lastKnownProfile ? {
                lastUpdated: this.lastKnownProfile.lastUpdated,
                checkCount: this.lastKnownProfile.checkCount
            } : null,
            updatesThisHour: this.updatesThisHour,
            ethicalCompliance: {
                userConsent: this.options.userConsent,
                rateLimited: true,
                auditLogged: true
            },
            operations: this.operationLog
        };
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('📡 Real-Time LinkedIn Integration System');
    console.log('Usage: node realtime-linkedin-integration.js [start|stop|check] [profile-url] [options]');
    
    const command = process.argv[2] || 'help';
    const profileUrl = process.argv[3];
    const autoSync = process.argv.includes('--auto-sync');
    const notifications = !process.argv.includes('--no-notifications');
    
    const integration = new RealTimeLinkedInIntegration({
        userConsent: true,
        profileUrl: profileUrl,
        autoSyncChanges: autoSync,
        enableNotifications: notifications,
        monitoringInterval: process.argv.includes('--fast') ? 60000 : 300000 // 1 or 5 minutes
    });
    
    try {
        switch (command) {
            case 'start':
                if (!profileUrl) {
                    console.log('❌ Profile URL required for monitoring');
                    console.log('Example: node realtime-linkedin-integration.js start https://linkedin.com/in/your-profile');
                    process.exit(1);
                }
                
                console.log('🚀 Starting real-time LinkedIn monitoring...');
                console.log(`📋 Profile: ${profileUrl}`);
                console.log(`🔄 Auto-sync: ${autoSync ? 'enabled' : 'disabled'}`);
                console.log(`🔔 Notifications: ${notifications ? 'enabled' : 'disabled'}`);
                
                await integration.initialize();
                await integration.startMonitoring();
                
                console.log('✅ Real-time monitoring started');
                console.log('📊 Monitoring every 5 minutes for profile changes');
                console.log('Press Ctrl+C to stop monitoring');
                
                // Keep process alive
                process.on('SIGINT', async () => {
                    console.log('\n🛑 Stopping real-time monitoring...');
                    await integration.stopMonitoring();
                    console.log('✅ Monitoring stopped gracefully');
                    process.exit(0);
                });
                
                break;
                
            case 'check':
                if (!profileUrl) {
                    console.log('❌ Profile URL required for change check');
                    process.exit(1);
                }
                
                console.log('🔍 Performing one-time change check...');
                
                await integration.initialize();
                const changes = await integration.checkForProfileChanges();
                
                if (changes) {
                    console.log('✅ Changes detected');
                    console.log(`📊 Change count: ${changes.changes.length}`);
                    console.log(`📈 Significance: ${changes.significance}`);
                    console.log(`🕐 Detection time: ${changes.detectionTime}`);
                } else {
                    console.log('ℹ️ No changes detected');
                }
                break;
                
            case 'stop':
                console.log('🛑 Stop command - use Ctrl+C to stop active monitoring');
                break;
                
            default:
                console.log('📡 Real-Time LinkedIn Integration Commands:');
                console.log('');
                console.log('  start [url]    - Start continuous monitoring');
                console.log('  check [url]    - Perform one-time change check');
                console.log('  stop          - Stop monitoring (use Ctrl+C)');
                console.log('');
                console.log('Options:');
                console.log('  --auto-sync           - Automatically sync changes to CV');
                console.log('  --no-notifications    - Disable change notifications');
                console.log('  --fast               - Check every minute (vs 5 minutes)');
                console.log('');
                console.log('Examples:');
                console.log('  node realtime-linkedin-integration.js start https://linkedin.com/in/your-profile --auto-sync');
                console.log('  node realtime-linkedin-integration.js check https://linkedin.com/in/your-profile');
        }
        
    } catch (error) {
        console.error('❌ Real-time integration error:', error.message);
        
        if (error.message.includes('consent')) {
            console.log('\n📝 Ethical usage requirements:');
            console.log('1. Only monitor your own LinkedIn profile');
            console.log('2. Respect LinkedIn Terms of Service');
            console.log('3. Use reasonable monitoring intervals');
            console.log('4. Ensure you have permission for profile monitoring');
        }
    }
}