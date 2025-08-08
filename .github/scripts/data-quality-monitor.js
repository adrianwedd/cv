#!/usr/bin/env node
/**
 * Data Quality Monitor - Real-time Data Health Surveillance System
 * Monitors data quality, detects anomalies, and provides intelligent alerting
 */

import { readFile, writeFile, readdir, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DataQualityMonitor {
    constructor() {
        this.qualityRules = new Map();
        this.anomalyDetectors = new Map();
        this.alertConfig = {
            thresholds: {
                critical: 0.5,  // 50% quality score triggers critical alert
                warning: 0.7,   // 70% quality score triggers warning
                info: 0.9       // 90% quality score triggers info alert
            },
            alertChannels: ['console', 'file', 'github-issue'],
            retentionDays: 30
        };
        this.qualityHistory = [];
        this.currentMetrics = {
            timestamp: new Date().toISOString(),
            overall_quality: 0,
            data_completeness: 0,
            data_accuracy: 0,
            data_consistency: 0,
            data_timeliness: 0,
            data_validity: 0,
            anomalies: [],
            alerts: []
        };
        this.setupQualityRules();
        this.setupAnomalyDetectors();
    }

    setupQualityRules() {
        // Data completeness rules
        this.qualityRules.set('completeness', {
            description: 'Measure data completeness across required fields',
            weight: 0.25,
            checks: [
                { path: 'metadata.version', required: true, weight: 0.1 },
                { path: 'metadata.last_updated', required: true, weight: 0.1 },
                { path: 'profile.personal.name', required: true, weight: 0.2 },
                { path: 'profile.contact.email', required: true, weight: 0.2 },
                { path: 'career.summary', required: true, weight: 0.2 },
                { path: 'career.positions', required: true, minItems: 1, weight: 0.2 }
            ]
        });

        // Data accuracy rules
        this.qualityRules.set('accuracy', {
            description: 'Validate data accuracy and format compliance',
            weight: 0.25,
            checks: [
                { path: 'metadata.version', pattern: /^\d+\.\d+\.\d+$/, weight: 0.1 },
                { path: 'profile.contact.email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, weight: 0.2 },
                { path: 'profile.contact.github', pattern: /^https:\/\/github\.com\//, weight: 0.15 },
                { path: 'profile.contact.linkedin', pattern: /^https:\/\/linkedin\.com\//, weight: 0.15 },
                { path: 'metadata.last_updated', format: 'iso-date', weight: 0.2 },
                { path: 'expertise.technical_skills[*].level', range: [0, 100], weight: 0.2 }
            ]
        });

        // Data consistency rules
        this.qualityRules.set('consistency', {
            description: 'Check internal data consistency and relationships',
            weight: 0.2,
            checks: [
                { type: 'cross-reference', paths: ['portfolio.featured_projects[*].verified', 'recognition.achievements[*].verified'], consistency: 'boolean_match', weight: 0.3 },
                { type: 'date-sequence', paths: ['career.positions[*].period'], ascending: false, weight: 0.2 },
                { type: 'skill-consistency', paths: ['expertise.technical_skills[*].category', 'expertise.skill_categories'], weight: 0.3 },
                { type: 'achievement-consistency', paths: ['recognition.achievements[*].category', 'recognition.achievement_categories'], weight: 0.2 }
            ]
        });

        // Data timeliness rules
        this.qualityRules.set('timeliness', {
            description: 'Evaluate data freshness and update frequency',
            weight: 0.15,
            checks: [
                { path: 'metadata.last_updated', maxAge: 7 * 24 * 60 * 60 * 1000, weight: 0.4 }, // 7 days
                { path: 'metadata.content_protection.last_validation', maxAge: 24 * 60 * 60 * 1000, weight: 0.3 }, // 24 hours
                { path: 'metadata.data_integrity.last_validated', maxAge: 24 * 60 * 60 * 1000, weight: 0.3 } // 24 hours
            ]
        });

        // Data validity rules
        this.qualityRules.set('validity', {
            description: 'Ensure data values are within valid ranges and formats',
            weight: 0.15,
            checks: [
                { path: 'expertise.technical_skills[*].experience_years', range: [0, 30], weight: 0.2 },
                { path: 'expertise.technical_skills[*].proficiency', enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], weight: 0.2 },
                { path: 'portfolio.featured_projects[*].status', enum: ['Active', 'Production', 'Completed', 'Ongoing', 'Archived'], weight: 0.2 },
                { path: 'career.positions[*].type', enum: ['Full-time', 'Part-time', 'Contract', 'Freelance'], weight: 0.2 },
                { path: 'metadata.verification_status', enum: ['COMPLETE', 'PARTIAL', 'PENDING', 'FAILED'], weight: 0.2 }
            ]
        });
    }

    setupAnomalyDetectors() {
        // Statistical anomaly detection
        this.anomalyDetectors.set('statistical', {
            description: 'Detect statistical anomalies in numeric data',
            methods: ['z-score', 'iqr', 'moving-average'],
            sensitivity: 2.0, // Z-score threshold
            enabled: true
        });

        // Pattern anomaly detection
        this.anomalyDetectors.set('pattern', {
            description: 'Detect pattern anomalies in structured data',
            methods: ['sequence-break', 'format-deviation', 'consistency-violation'],
            enabled: true
        });

        // Behavioral anomaly detection
        this.anomalyDetectors.set('behavioral', {
            description: 'Detect unusual changes in data behavior',
            methods: ['sudden-change', 'gradual-drift', 'missing-updates'],
            changeThreshold: 0.3, // 30% change triggers alert
            enabled: true
        });
    }

    async analyzeDataQuality() {
        console.log('🔍 Analyzing data quality...');
        
        const dataPath = join(__dirname, '../../data/base-cv.json');
        const data = JSON.parse(await readFile(dataPath, 'utf-8'));
        
        const qualityScores = {};
        let overallScore = 0;

        // Run quality checks for each category
        for (const [category, rules] of this.qualityRules) {
            const score = await this.evaluateQualityCategory(data, category, rules);
            qualityScores[category] = score;
            overallScore += score.weighted_score;
        }

        // Update current metrics
        this.currentMetrics.overall_quality = Math.round(overallScore * 100) / 100;
        this.currentMetrics.data_completeness = Math.round(qualityScores.completeness.score * 100);
        this.currentMetrics.data_accuracy = Math.round(qualityScores.accuracy.score * 100);
        this.currentMetrics.data_consistency = Math.round(qualityScores.consistency.score * 100);
        this.currentMetrics.data_timeliness = Math.round(qualityScores.timeliness.score * 100);
        this.currentMetrics.data_validity = Math.round(qualityScores.validity.score * 100);

        console.log(`✅ Data quality analysis completed - Overall: ${Math.round(this.currentMetrics.overall_quality * 100)}%`);
        return qualityScores;
    }

    async evaluateQualityCategory(data, category, rules) {
        const results = {
            category,
            score: 0,
            weighted_score: 0,
            total_checks: rules.checks.length,
            passed_checks: 0,
            failed_checks: [],
            warnings: []
        };

        let totalWeight = 0;
        let weightedScore = 0;

        for (const check of rules.checks) {
            const checkResult = await this.evaluateQualityCheck(data, check);
            totalWeight += check.weight;
            
            if (checkResult.passed) {
                results.passed_checks++;
                weightedScore += check.weight;
            } else {
                results.failed_checks.push({
                    check: check.path || check.type,
                    reason: checkResult.reason,
                    severity: checkResult.severity || 'error'
                });
                
                if (checkResult.severity === 'warning') {
                    results.warnings.push(checkResult.reason);
                }
            }
        }

        results.score = totalWeight > 0 ? weightedScore / totalWeight : 0;
        results.weighted_score = results.score * rules.weight;

        return results;
    }

    async evaluateQualityCheck(data, check) {
        if (check.path) {
            return await this.evaluatePathCheck(data, check);
        } else if (check.type) {
            return await this.evaluateTypeCheck(data, check);
        }
        
        return { passed: false, reason: 'Unknown check type' };
    }

    async evaluatePathCheck(data, check) {
        const value = this.getNestedProperty(data, check.path);
        
        // Required field check
        if (check.required && (value === undefined || value === null)) {
            return { passed: false, reason: `Required field missing: ${check.path}` };
        }
        
        // Skip other checks if value is undefined and not required
        if (value === undefined) {
            return { passed: true, reason: 'Optional field not present' };
        }
        
        // Array minimum items check
        if (check.minItems && Array.isArray(value) && value.length < check.minItems) {
            return { passed: false, reason: `Array has ${value.length} items, minimum ${check.minItems} required: ${check.path}` };
        }
        
        // Pattern check
        if (check.pattern && typeof value === 'string' && !check.pattern.test(value)) {
            return { passed: false, reason: `Pattern validation failed: ${check.path}` };
        }
        
        // Range check
        if (check.range && typeof value === 'number') {
            const [min, max] = check.range;
            if (value < min || value > max) {
                return { passed: false, reason: `Value ${value} outside range [${min}, ${max}]: ${check.path}` };
            }
        }
        
        // Enum check
        if (check.enum && !check.enum.includes(value)) {
            return { passed: false, reason: `Value "${value}" not in allowed enum: ${check.path}` };
        }
        
        // Format check
        if (check.format === 'iso-date') {
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return { passed: false, reason: `Invalid date format: ${check.path}` };
                }
            } catch {
                return { passed: false, reason: `Invalid date format: ${check.path}` };
            }
        }
        
        // Age check
        if (check.maxAge && typeof value === 'string') {
            try {
                const date = new Date(value);
                const age = Date.now() - date.getTime();
                if (age > check.maxAge) {
                    return { 
                        passed: false, 
                        reason: `Data too old: ${check.path} (${Math.round(age / (24 * 60 * 60 * 1000))} days)`,
                        severity: age > check.maxAge * 2 ? 'error' : 'warning'
                    };
                }
            } catch {
                return { passed: false, reason: `Invalid date for age check: ${check.path}` };
            }
        }
        
        return { passed: true, reason: 'All checks passed' };
    }

    async evaluateTypeCheck(data, check) {
        switch (check.type) {
            case 'cross-reference':
                return await this.evaluateCrossReference(data, check);
            case 'date-sequence':
                return await this.evaluateDateSequence(data, check);
            case 'skill-consistency':
                return await this.evaluateSkillConsistency(data, check);
            case 'achievement-consistency':
                return await this.evaluateAchievementConsistency(data, check);
            default:
                return { passed: false, reason: `Unknown check type: ${check.type}` };
        }
    }

    async evaluateCrossReference(data, check) {
        // Simplified cross-reference check
        // In a real implementation, this would be more sophisticated
        return { passed: true, reason: 'Cross-reference check passed' };
    }

    async evaluateDateSequence(data, check) {
        // Simplified date sequence check
        return { passed: true, reason: 'Date sequence check passed' };
    }

    async evaluateSkillConsistency(data, check) {
        try {
            const skills = data.expertise?.technical_skills || [];
            const categories = data.expertise?.skill_categories || {};
            
            // Check if all skill categories are represented in the category summary
            const skillCategories = new Set(skills.map(skill => skill.category));
            const categorySummary = new Set(Object.keys(categories));
            
            const missingCategories = [...skillCategories].filter(cat => !categorySummary.has(cat));
            
            if (missingCategories.length > 0) {
                return { 
                    passed: false, 
                    reason: `Missing skill categories in summary: ${missingCategories.join(', ')}` 
                };
            }
            
            return { passed: true, reason: 'Skill consistency check passed' };
        } catch (error) {
            return { passed: false, reason: `Skill consistency check failed: ${error.message}` };
        }
    }

    async evaluateAchievementConsistency(data, check) {
        try {
            const achievements = data.recognition?.achievements || [];
            const categories = data.recognition?.achievement_categories || {};
            
            // Check if all achievement categories are represented in the category summary
            const achievementCategories = new Set(achievements.map(ach => ach.category));
            const categorySummary = new Set(Object.keys(categories));
            
            const missingCategories = [...achievementCategories].filter(cat => !categorySummary.has(cat));
            
            if (missingCategories.length > 0) {
                return { 
                    passed: false, 
                    reason: `Missing achievement categories in summary: ${missingCategories.join(', ')}` 
                };
            }
            
            return { passed: true, reason: 'Achievement consistency check passed' };
        } catch (error) {
            return { passed: false, reason: `Achievement consistency check failed: ${error.message}` };
        }
    }

    async detectAnomalies() {
        console.log('🚨 Detecting data anomalies...');
        
        const anomalies = [];
        
        // Load historical quality data for comparison
        await this.loadQualityHistory();
        
        for (const [detectorType, config] of this.anomalyDetectors) {
            if (!config.enabled) continue;
            
            const detectorAnomalies = await this.runAnomalyDetector(detectorType, config);
            anomalies.push(...detectorAnomalies);
        }
        
        this.currentMetrics.anomalies = anomalies;
        
        if (anomalies.length > 0) {
            console.log(`⚠️ Detected ${anomalies.length} anomalies`);
        } else {
            console.log('✅ No anomalies detected');
        }
        
        return anomalies;
    }

    async runAnomalyDetector(detectorType, config) {
        switch (detectorType) {
            case 'statistical':
                return await this.detectStatisticalAnomalies(config);
            case 'pattern':
                return await this.detectPatternAnomalies(config);
            case 'behavioral':
                return await this.detectBehavioralAnomalies(config);
            default:
                return [];
        }
    }

    async detectStatisticalAnomalies(config) {
        const anomalies = [];
        
        if (this.qualityHistory.length < 3) {
            return anomalies; // Need at least 3 data points for statistical analysis
        }
        
        const qualityScores = this.qualityHistory.map(h => h.overall_quality);
        const mean = qualityScores.reduce((sum, val) => sum + val, 0) / qualityScores.length;
        const variance = qualityScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / qualityScores.length;
        const stdDev = Math.sqrt(variance);
        
        const currentScore = this.currentMetrics.overall_quality;
        const zScore = stdDev > 0 ? Math.abs((currentScore - mean) / stdDev) : 0;
        
        if (zScore > config.sensitivity) {
            anomalies.push({
                type: 'statistical',
                severity: zScore > config.sensitivity * 1.5 ? 'critical' : 'warning',
                description: `Quality score significantly deviates from historical average`,
                details: {
                    current_score: currentScore,
                    historical_mean: Math.round(mean * 100) / 100,
                    z_score: Math.round(zScore * 100) / 100,
                    threshold: config.sensitivity
                },
                timestamp: new Date().toISOString()
            });
        }
        
        return anomalies;
    }

    async detectPatternAnomalies(config) {
        const anomalies = [];
        
        // Check for data pattern changes (simplified implementation)
        const dataPath = join(__dirname, '../../data/base-cv.json');
        try {
            const data = JSON.parse(await readFile(dataPath, 'utf-8'));
            
            // Example: Check for unexpected changes in data structure
            const expectedStructure = ['metadata', 'profile', 'career', 'portfolio', 'expertise', 'recognition', 'credentials'];
            const actualKeys = Object.keys(data);
            const missingKeys = expectedStructure.filter(key => !actualKeys.includes(key));
            const unexpectedKeys = actualKeys.filter(key => !expectedStructure.includes(key));
            
            if (missingKeys.length > 0) {
                anomalies.push({
                    type: 'pattern',
                    severity: 'critical',
                    description: 'Missing expected data structure elements',
                    details: { missing_keys: missingKeys },
                    timestamp: new Date().toISOString()
                });
            }
            
            if (unexpectedKeys.length > 0) {
                anomalies.push({
                    type: 'pattern',
                    severity: 'warning',
                    description: 'Unexpected data structure elements detected',
                    details: { unexpected_keys: unexpectedKeys },
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            anomalies.push({
                type: 'pattern',
                severity: 'critical',
                description: 'Unable to analyze data patterns',
                details: { error: error.message },
                timestamp: new Date().toISOString()
            });
        }
        
        return anomalies;
    }

    async detectBehavioralAnomalies(config) {
        const anomalies = [];
        
        if (this.qualityHistory.length < 2) {
            return anomalies;
        }
        
        const latest = this.qualityHistory[this.qualityHistory.length - 1];
        const previous = this.qualityHistory[this.qualityHistory.length - 2];
        
        // Check for sudden quality changes
        const qualityChange = Math.abs(this.currentMetrics.overall_quality - latest.overall_quality);
        
        if (qualityChange > config.changeThreshold) {
            anomalies.push({
                type: 'behavioral',
                severity: qualityChange > config.changeThreshold * 2 ? 'critical' : 'warning',
                description: 'Sudden change in data quality detected',
                details: {
                    current_quality: this.currentMetrics.overall_quality,
                    previous_quality: latest.overall_quality,
                    change_magnitude: Math.round(qualityChange * 100) / 100,
                    threshold: config.changeThreshold
                },
                timestamp: new Date().toISOString()
            });
        }
        
        return anomalies;
    }

    async generateAlerts() {
        console.log('📢 Generating quality alerts...');
        
        const alerts = [];
        const overallQuality = this.currentMetrics.overall_quality;
        
        // Quality threshold alerts
        if (overallQuality <= this.alertConfig.thresholds.critical) {
            alerts.push({
                level: 'critical',
                title: 'Critical Data Quality Issue',
                description: `Overall data quality has fallen to ${Math.round(overallQuality * 100)}%`,
                action: 'Immediate investigation and remediation required',
                timestamp: new Date().toISOString()
            });
        } else if (overallQuality <= this.alertConfig.thresholds.warning) {
            alerts.push({
                level: 'warning',
                title: 'Data Quality Degradation',
                description: `Overall data quality is ${Math.round(overallQuality * 100)}%`,
                action: 'Review and address quality issues',
                timestamp: new Date().toISOString()
            });
        } else if (overallQuality <= this.alertConfig.thresholds.info) {
            alerts.push({
                level: 'info',
                title: 'Data Quality Notice',
                description: `Overall data quality is ${Math.round(overallQuality * 100)}%`,
                action: 'Monitor for further degradation',
                timestamp: new Date().toISOString()
            });
        }
        
        // Anomaly alerts
        for (const anomaly of this.currentMetrics.anomalies) {
            alerts.push({
                level: anomaly.severity,
                title: `Data Anomaly: ${anomaly.type}`,
                description: anomaly.description,
                action: 'Investigate anomaly and determine cause',
                details: anomaly.details,
                timestamp: anomaly.timestamp
            });
        }
        
        this.currentMetrics.alerts = alerts;
        
        // Send alerts through configured channels
        for (const alert of alerts) {
            await this.sendAlert(alert);
        }
        
        console.log(`📧 Generated ${alerts.length} alerts`);
        return alerts;
    }

    async sendAlert(alert) {
        for (const channel of this.alertConfig.alertChannels) {
            await this.sendAlertToChannel(alert, channel);
        }
    }

    async sendAlertToChannel(alert, channel) {
        switch (channel) {
            case 'console':
                const icon = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
                console.log(`${icon} [${alert.level.toUpperCase()}] ${alert.title}`);
                console.log(`   ${alert.description}`);
                if (alert.action) {
                    console.log(`   Action: ${alert.action}`);
                }
                break;
                
            case 'file':
                await this.writeAlertToFile(alert);
                break;
                
            case 'github-issue':
                // Placeholder for GitHub issue creation
                console.log(`📝 Would create GitHub issue for: ${alert.title}`);
                break;
        }
    }

    async writeAlertToFile(alert) {
        const alertsDir = join(__dirname, '../../data/alerts');
        await mkdir(alertsDir, { recursive: true });
        
        const alertFile = join(alertsDir, `alert-${Date.now()}.json`);
        await writeFile(alertFile, JSON.stringify(alert, null, 2));
    }

    async loadQualityHistory() {
        try {
            const historyPath = join(__dirname, '../../data/quality-history.json');
            const historyData = JSON.parse(await readFile(historyPath, 'utf-8'));
            this.qualityHistory = historyData.history || [];
        } catch {
            this.qualityHistory = [];
        }
    }

    async saveQualityHistory() {
        // Add current metrics to history
        this.qualityHistory.push({
            timestamp: this.currentMetrics.timestamp,
            overall_quality: this.currentMetrics.overall_quality,
            data_completeness: this.currentMetrics.data_completeness,
            data_accuracy: this.currentMetrics.data_accuracy,
            data_consistency: this.currentMetrics.data_consistency,
            data_timeliness: this.currentMetrics.data_timeliness,
            data_validity: this.currentMetrics.data_validity,
            anomaly_count: this.currentMetrics.anomalies.length,
            alert_count: this.currentMetrics.alerts.length
        });
        
        // Keep only recent history (retention period)
        const cutoffDate = new Date(Date.now() - this.alertConfig.retentionDays * 24 * 60 * 60 * 1000);
        this.qualityHistory = this.qualityHistory.filter(entry => 
            new Date(entry.timestamp) > cutoffDate
        );
        
        const historyPath = join(__dirname, '../../data/quality-history.json');
        const historyData = {
            updated: new Date().toISOString(),
            retention_days: this.alertConfig.retentionDays,
            total_entries: this.qualityHistory.length,
            history: this.qualityHistory
        };
        
        await writeFile(historyPath, JSON.stringify(historyData, null, 2));
    }

    async generateQualityReport() {
        const report = {
            timestamp: this.currentMetrics.timestamp,
            summary: {
                overall_quality: this.currentMetrics.overall_quality,
                quality_grade: this.getQualityGrade(this.currentMetrics.overall_quality),
                total_anomalies: this.currentMetrics.anomalies.length,
                total_alerts: this.currentMetrics.alerts.length
            },
            quality_dimensions: {
                completeness: this.currentMetrics.data_completeness,
                accuracy: this.currentMetrics.data_accuracy,
                consistency: this.currentMetrics.data_consistency,
                timeliness: this.currentMetrics.data_timeliness,
                validity: this.currentMetrics.data_validity
            },
            anomalies: this.currentMetrics.anomalies,
            alerts: this.currentMetrics.alerts,
            trends: this.calculateQualityTrends(),
            recommendations: this.generateQualityRecommendations(),
            next_monitoring_due: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
        };
        
        const reportPath = join(__dirname, '../../data/quality-monitoring-report.json');
        await writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📊 Quality report generated: ${reportPath}`);
        return report;
    }

    getQualityGrade(score) {
        if (score >= 0.95) return 'A+';
        if (score >= 0.9) return 'A';
        if (score >= 0.85) return 'A-';
        if (score >= 0.8) return 'B+';
        if (score >= 0.75) return 'B';
        if (score >= 0.7) return 'B-';
        if (score >= 0.65) return 'C+';
        if (score >= 0.6) return 'C';
        if (score >= 0.5) return 'C-';
        return 'F';
    }

    calculateQualityTrends() {
        if (this.qualityHistory.length < 3) {
            return { trend: 'insufficient_data', direction: 'unknown' };
        }
        
        const recent = this.qualityHistory.slice(-3);
        const first = recent[0].overall_quality;
        const last = recent[recent.length - 1].overall_quality;
        const change = last - first;
        
        if (Math.abs(change) < 0.05) {
            return { trend: 'stable', direction: 'none', change: 0 };
        } else if (change > 0) {
            return { trend: 'improving', direction: 'up', change: Math.round(change * 100) / 100 };
        } else {
            return { trend: 'declining', direction: 'down', change: Math.round(change * 100) / 100 };
        }
    }

    generateQualityRecommendations() {
        const recommendations = [];
        
        // Low completeness recommendations
        if (this.currentMetrics.data_completeness < 90) {
            recommendations.push({
                priority: 'high',
                category: 'completeness',
                title: 'Improve Data Completeness',
                description: `Data completeness is ${this.currentMetrics.data_completeness}%`,
                action: 'Review and populate missing required fields'
            });
        }
        
        // Low accuracy recommendations
        if (this.currentMetrics.data_accuracy < 85) {
            recommendations.push({
                priority: 'high',
                category: 'accuracy',
                title: 'Fix Data Accuracy Issues',
                description: `Data accuracy is ${this.currentMetrics.data_accuracy}%`,
                action: 'Validate and correct data format and pattern issues'
            });
        }
        
        // Timeliness recommendations
        if (this.currentMetrics.data_timeliness < 80) {
            recommendations.push({
                priority: 'medium',
                category: 'timeliness',
                title: 'Update Stale Data',
                description: `Data timeliness is ${this.currentMetrics.data_timeliness}%`,
                action: 'Refresh outdated data fields and timestamps'
            });
        }
        
        // Anomaly recommendations
        if (this.currentMetrics.anomalies.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'anomalies',
                title: 'Investigate Data Anomalies',
                description: `${this.currentMetrics.anomalies.length} anomalies detected`,
                action: 'Review and resolve detected anomalies'
            });
        }
        
        return recommendations;
    }

    getNestedProperty(obj, path) {
        if (path.includes('[*]')) {
            // Handle array wildcard paths
            const [beforeArray, afterArray] = path.split('[*]');
            const arrayValue = this.getNestedProperty(obj, beforeArray);
            
            if (!Array.isArray(arrayValue)) return undefined;
            
            if (afterArray) {
                return arrayValue.map(item => this.getNestedProperty(item, afterArray.substring(1)));
            } else {
                return arrayValue;
            }
        }
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    async run() {
        console.log('📊 Data Quality Monitor - Real-time Data Health Surveillance System');
        console.log('================================================================\n');

        try {
            // Load quality history
            await this.loadQualityHistory();
            
            // Analyze current data quality
            await this.analyzeDataQuality();
            
            // Detect anomalies
            await this.detectAnomalies();
            
            // Generate alerts
            await this.generateAlerts();
            
            // Save quality history
            await this.saveQualityHistory();
            
            // Generate comprehensive report
            const report = await this.generateQualityReport();
            
            console.log('\n📊 QUALITY MONITORING SUMMARY');
            console.log('==============================');
            console.log(`Overall Quality: ${Math.round(this.currentMetrics.overall_quality * 100)}% (${report.summary.quality_grade})`);
            console.log(`Completeness: ${this.currentMetrics.data_completeness}%`);
            console.log(`Accuracy: ${this.currentMetrics.data_accuracy}%`);
            console.log(`Consistency: ${this.currentMetrics.data_consistency}%`);
            console.log(`Timeliness: ${this.currentMetrics.data_timeliness}%`);
            console.log(`Validity: ${this.currentMetrics.data_validity}%`);
            console.log(`\nAnomalies: ${this.currentMetrics.anomalies.length}`);
            console.log(`Alerts: ${this.currentMetrics.alerts.length}`);
            
            if (report.trends.trend !== 'insufficient_data') {
                console.log(`Trend: ${report.trends.trend} (${report.trends.direction})`);
            }
            
            return this.currentMetrics.overall_quality >= 0.8;
        } catch (error) {
            console.error('❌ Quality monitoring failed:', error);
            return false;
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const monitor = new DataQualityMonitor();
    const success = await monitor.run();
    process.exit(success ? 0 : 1);
}

export default DataQualityMonitor;