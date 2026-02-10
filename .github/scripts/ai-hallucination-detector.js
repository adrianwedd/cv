#!/usr/bin/env node

/**
 * AI Hallucination Detection & Validation Engine
 *
 * Advanced system for detecting and preventing AI-generated false claims in CV content.
 * This system provides comprehensive validation using multiple detection strategies:
 *
 * - Quantitative claim validation against GitHub metrics
 * - Timeline coherence analysis
 * - Generic language detection (signs of AI generation)
 * - Impossible claim detection (physics/logic violations)
 * - Consistency verification across content sections
 * - External fact-checking integration
 *
 * Part of the CV Enhancement Pipeline's quality assurance layer.
 *
 * @author Adrian Wedd
 * @version 2.1.0
 */

const fs = require('fs').promises;
const path = require('path');
const _crypto = require('crypto');

/**
 * Advanced AI Hallucination Detection System
 *
 * Multi-layered validation engine that ensures AI-generated content
 * maintains factual accuracy and professional credibility
 */
class AIHallucinationDetector {
    constructor() {
        // Determine the correct data directory path
        const currentDir = process.cwd();
        if (currentDir.includes('.github/scripts')) {
            this.dataDir = path.join(currentDir, '../../data');
        } else {
            this.dataDir = path.join(currentDir, 'data');
        }
        this.cacheDir = path.join(this.dataDir, 'validation-cache');
        this.detectionResults = {
            overall_confidence: 0,
            validation_timestamp: new Date().toISOString(),
            detection_layers: {
                quantitative_validation: { passed: 0, failed: 0, warnings: [] },
                timeline_coherence: { passed: 0, failed: 0, warnings: [] },
                generic_language: { score: 0, flags: [] },
                impossible_claims: { detected: [], severity: 'none' },
                consistency_check: { coherent: true, conflicts: [] }
            },
            flagged_content: [],
            recommendations: [],
            urgent_reviews: []
        };

        // AI hallucination patterns and thresholds
        this.hallucinationPatterns = {
            // Impossible technical claims
            impossible_performance: [
                /(\d+)00%\s+(?:improvement|increase|boost)/gi,  // >1000% improvements
                /(\d{4,})\s*x\s+(?:faster|quicker|speedier)/gi, // Implausible speed increases
                /reduced.*from\s+hours?\s+to\s+seconds?/gi,      // Impossible time reductions
                /(\d+)\s*billion\s+(?:users?|requests?)/gi      // Impossible scale claims
            ],

            // Generic AI language patterns
            generic_ai_phrases: [
                /leveraging\s+(?:cutting-edge|state-of-the-art|advanced)/gi,
                /innovative\s+solutions?\s+that\s+deliver/gi,
                /robust\s+and\s+scalable\s+(?:architecture|system)/gi,
                /seamlessly\s+integrat(?:ed?|ing)/gi,
                /comprehensive\s+(?:framework|solution|approach)/gi,
                /end-to-end\s+(?:solution|implementation)/gi
            ],

            // Timeline impossibilities
            timeline_violations: [
                /within\s+(\d+)\s+(?:day|week)s?\s+.*(?:complete|built|developed)/gi,
                /single\s+day.*(?:architected|designed|built)/gi,
                /overnight.*(?:transformation|migration|rebuild)/gi
            ],

            // Quantitative exaggerations
            suspicious_metrics: [
                /(\d+)%\s+(?:reduction|decrease).*(?:latency|time|cost)/gi,
                /saved\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|billion)?/gi,
                /increased.*by\s+(\d+)%/gi,
                /(\d+)x\s+(?:more\s+)?(?:efficient|faster|better)/gi
            ],

            // AI meta-commentary patterns (leaked prompt artifacts)
            meta_commentary: [
                /\bAI[- ]enhanced\b/gi,
                /\boptimized\s+for\b/gi,
                /\benhanced\s+by\s+AI\b/gi,
                /\bleveraging\s+AI\b/gi,
                /\[NOTE:/gi,
                /\[TODO:/gi,
                /\bTODO:/gi,
                /\bNOTE:/gi,
                /\[AI\b/gi,
                /\bgenerated\s+by\s+(?:AI|Claude|GPT|LLM)/gi,
                /\boptimized\s+by\s+(?:AI|Claude|GPT|LLM)/gi,
                /\bas\s+an\s+AI\s+(?:language\s+)?model\b/gi,
                /\bI(?:'m| am)\s+an?\s+AI\b/gi,
                /\bprompt\s+(?:engineering|instructions?|template)\b/gi,
                /\bhere(?:'s| is)\s+(?:a|an|the)\s+(?:revised|updated|improved|enhanced)\s+version\b/gi,
                /\bI've\s+(?:revised|updated|improved|enhanced|rewritten)\b/gi,
                /\bplease\s+(?:review|note|see)\s+(?:the\s+)?(?:following|below|above)\b/gi
            ]
        };

        // Credibility scoring weights
        this.scoringWeights = {
            quantitative_accuracy: 0.35,
            timeline_coherence: 0.25,
            generic_language_penalty: 0.15,
            impossible_claims_penalty: 0.25
        };
    }

    /**
     * Main hallucination detection pipeline
     */
    async detectHallucinations() {
        console.log('🛡️ **AI HALLUCINATION DETECTION INITIATED**');
        console.log('🔍 Multi-layer validation of AI-generated content...');
        console.log('');

        try {
            // Ensure cache directory exists
            await this.ensureCacheDirectory();

            // Load data sources
            const aiContent = await this.loadAIEnhancements();
            const githubData = await this.loadGitHubData();
            const cvData = await this.loadCVData();

            // Even if no AI enhancements exist, validate the base CV directly
            if (!aiContent || Object.keys(aiContent).length === 0) {
                console.log('⚠️ No AI-enhanced content found — validating base CV directly');

                if (!cvData || Object.keys(cvData).length === 0) {
                    console.log('⚠️ No base CV data found either — nothing to validate');
                    return this.generateEmptyReport();
                }

                // Run validation layers against the base CV data itself
                console.log('📊 **DETECTION LAYERS ANALYSIS (base CV)**');

                await this.detectGenericLanguage(cvData);
                await this.detectImpossibleClaims(cvData);
                await this.detectMetaCommentary(cvData);
                await this.validateBaseCVIntegrity(cvData);

                this.calculateOverallConfidenceForBaseCVOnly();
                await this.generateRecommendations();
                await this.saveDetectionResults();
                this.displayValidationSummary();

                return this.detectionResults;
            }

            console.log('📊 **DETECTION LAYERS ANALYSIS**');

            // Layer 1: Quantitative Validation
            await this.validateQuantitativeClaims(aiContent, githubData);

            // Layer 2: Timeline Coherence Analysis
            await this.analyzeTimelineCoherence(aiContent, cvData);

            // Layer 3: Generic Language Detection
            await this.detectGenericLanguage(aiContent);

            // Layer 4: Impossible Claims Detection
            await this.detectImpossibleClaims(aiContent);

            // Layer 5: Consistency Verification
            await this.verifyConsistency(aiContent, cvData);

            // Layer 6: Meta-commentary detection
            await this.detectMetaCommentary(aiContent);

            // Also validate the base CV if it exists
            if (cvData && Object.keys(cvData).length > 0) {
                await this.validateBaseCVIntegrity(cvData);
            }

            // Calculate overall confidence score
            this.calculateOverallConfidence();

            // Generate recommendations
            await this.generateRecommendations();

            // Save results
            await this.saveDetectionResults();

            // Display summary
            this.displayValidationSummary();

            return this.detectionResults;

        } catch (error) {
            console.error('❌ Hallucination detection failed:', error.message);
            throw error;
        }
    }

    /**
     * Layer 1: Validate quantitative claims against actual data
     */
    async validateQuantitativeClaims(aiContent, githubData) {
        console.log('1️⃣ Validating quantitative claims...');

        const claims = this.extractQuantitativeClaims(aiContent);
        let validClaims = 0;
        let invalidClaims = 0;

        for (const claim of claims) {
            const validation = await this.validateClaimAgainstData(claim, githubData);

            if (validation.isValid) {
                validClaims++;
                console.log(`   ✅ Valid: ${claim.text}`);
            } else {
                invalidClaims++;
                console.log(`   ❌ Invalid: ${claim.text} (Actual: ${validation.actualValue})`);

                this.detectionResults.flagged_content.push({
                    type: 'quantitative_discrepancy',
                    content: claim.text,
                    expected: claim.value,
                    actual: validation.actualValue,
                    severity: validation.severity
                });
            }
        }

        this.detectionResults.detection_layers.quantitative_validation = {
            passed: validClaims,
            failed: invalidClaims,
            accuracy_rate: validClaims / (validClaims + invalidClaims) || 0
        };

        console.log(`   📊 Quantitative validation: ${validClaims} valid, ${invalidClaims} invalid`);
    }

    /**
     * Layer 2: Analyze timeline coherence and logical flow
     */
    async analyzeTimelineCoherence(aiContent, cvData) {
        console.log('2️⃣ Analyzing timeline coherence...');

        const timelineEvents = this.extractTimelineEvents(aiContent, cvData);
        const violations = [];

        // Check for impossible timeframes
        for (const event of timelineEvents) {
            if (this.isTimelineViolation(event)) {
                violations.push({
                    type: 'impossible_timeframe',
                    description: event.description,
                    timeframe: event.timeframe,
                    violation: 'Insufficient time for claimed accomplishment'
                });
            }
        }

        // Check chronological consistency
        const chronologyIssues = this.checkChronology(timelineEvents);
        violations.push(...chronologyIssues);

        this.detectionResults.detection_layers.timeline_coherence = {
            passed: timelineEvents.length - violations.length,
            failed: violations.length,
            violations: violations
        };

        console.log(`   ⏰ Timeline analysis: ${violations.length} violations detected`);

        if (violations.length > 0) {
            this.detectionResults.flagged_content.push(...violations);
        }
    }

    /**
     * Layer 3: Detect generic AI language patterns
     */
    async detectGenericLanguage(aiContent) {
        console.log('3️⃣ Detecting generic AI language patterns...');

        const textContent = this.extractAllText(aiContent);
        let genericScore = 0;
        const detectedPatterns = [];

        // Check generic AI patterns
        const genericPatterns = this.hallucinationPatterns.generic_ai_phrases || [];
        for (const pattern of genericPatterns) {
            const matches = textContent.match(pattern) || [];
            if (matches.length > 0) {
                genericScore += matches.length * 10; // Each match adds 10 to generic score
                detectedPatterns.push({
                    pattern: pattern.source,
                    matches: matches.length,
                    examples: matches.slice(0, 3)
                });
            }
        }

        this.detectionResults.detection_layers.generic_language = {
            score: genericScore,
            threshold: 50, // Above 50 is concerning
            flags: detectedPatterns
        };

        console.log(`   🤖 Generic language score: ${genericScore}/100 (lower is better)`);

        if (genericScore > 50) {
            this.detectionResults.flagged_content.push({
                type: 'generic_ai_language',
                score: genericScore,
                patterns: detectedPatterns,
                severity: genericScore > 80 ? 'high' : 'medium'
            });
        }
    }

    /**
     * Layer 4: Detect impossible or highly implausible claims
     */
    async detectImpossibleClaims(aiContent) {
        console.log('4️⃣ Detecting impossible claims...');

        const textContent = this.extractAllText(aiContent);
        const impossibleClaims = [];

        // Check each category of impossible patterns
        for (const [category, patterns] of Object.entries(this.hallucinationPatterns)) {
            if (category === 'generic_ai_phrases' || category === 'meta_commentary') continue;

            if (Array.isArray(patterns)) {
                for (const pattern of patterns) {
                    const matches = textContent.match(pattern) || [];
                    for (const match of matches) {
                        impossibleClaims.push({
                            category: category,
                            claim: match,
                            severity: this.assessClaimSeverity(match, category)
                        });
                    }
                }
            }
        }

        this.detectionResults.detection_layers.impossible_claims = {
            detected: impossibleClaims,
            count: impossibleClaims.length,
            severity: this.getOverallSeverity(impossibleClaims)
        };

        console.log(`   🚨 Impossible claims detected: ${impossibleClaims.length}`);

        if (impossibleClaims.length > 0) {
            this.detectionResults.flagged_content.push({
                type: 'impossible_claims',
                claims: impossibleClaims,
                severity: 'high'
            });
        }
    }

    /**
     * Layer 5: Verify consistency across content sections
     */
    async verifyConsistency(aiContent, cvData) {
        console.log('5️⃣ Verifying content consistency...');

        const conflicts = [];

        // Check for conflicting claims across sections
        const extractedData = {
            experience_years: this.extractExperienceYears(aiContent),
            skill_counts: this.extractSkillCounts(aiContent),
            project_counts: this.extractProjectCounts(aiContent)
        };

        // Cross-reference with base CV data
        for (const [key, aiValues] of Object.entries(extractedData)) {
            const baseValue = this.getBaseValue(cvData, key);
            if (baseValue && this.hasSignificantDiscrepancy(aiValues, baseValue)) {
                conflicts.push({
                    type: 'data_inconsistency',
                    field: key,
                    ai_values: aiValues,
                    base_value: baseValue,
                    discrepancy: this.calculateDiscrepancy(aiValues, baseValue)
                });
            }
        }

        this.detectionResults.detection_layers.consistency_check = {
            coherent: conflicts.length === 0,
            conflicts: conflicts,
            consistency_score: Math.max(0, 100 - (conflicts.length * 20))
        };

        console.log(`   🔄 Consistency check: ${conflicts.length} conflicts found`);

        if (conflicts.length > 0) {
            this.detectionResults.flagged_content.push(...conflicts);
        }
    }

    /**
     * Layer 6: Detect AI meta-commentary that leaked into content
     */
    async detectMetaCommentary(content) {
        console.log('6️⃣ Detecting AI meta-commentary leakage...');

        const textContent = this.extractAllText(content);
        const metaFlags = [];

        const metaPatterns = this.hallucinationPatterns.meta_commentary || [];
        for (const pattern of metaPatterns) {
            const matches = textContent.match(pattern) || [];
            for (const match of matches) {
                metaFlags.push({
                    type: 'meta_commentary',
                    match: match,
                    pattern: pattern.source,
                    severity: 'high'
                });
            }
        }

        if (metaFlags.length > 0) {
            console.log(`   🗯️ Meta-commentary leaks found: ${metaFlags.length}`);
            this.detectionResults.flagged_content.push({
                type: 'meta_commentary',
                flags: metaFlags,
                count: metaFlags.length,
                severity: 'high'
            });
        } else {
            console.log('   🗯️ No meta-commentary leaks detected');
        }
    }

    /**
     * Validate the base CV itself for hallucination patterns, independent of AI enhancements
     */
    async validateBaseCVIntegrity(cvData) {
        console.log('7️⃣ Validating base CV integrity...');

        const textContent = this.extractAllText(cvData);
        const issues = [];

        // Check for generic AI language in base CV
        const genericPatterns = this.hallucinationPatterns.generic_ai_phrases || [];
        for (const pattern of genericPatterns) {
            const matches = textContent.match(pattern) || [];
            for (const match of matches) {
                issues.push({
                    type: 'base_cv_generic_language',
                    match: match,
                    severity: 'medium'
                });
            }
        }

        // Check for impossible claims in base CV
        for (const [category, patterns] of Object.entries(this.hallucinationPatterns)) {
            if (category === 'generic_ai_phrases' || category === 'meta_commentary') continue;
            if (!Array.isArray(patterns)) continue;
            for (const pattern of patterns) {
                const matches = textContent.match(pattern) || [];
                for (const match of matches) {
                    issues.push({
                        type: 'base_cv_impossible_claim',
                        category: category,
                        match: match,
                        severity: 'high'
                    });
                }
            }
        }

        // Check for meta-commentary in base CV
        const metaPatterns = this.hallucinationPatterns.meta_commentary || [];
        for (const pattern of metaPatterns) {
            const matches = textContent.match(pattern) || [];
            for (const match of matches) {
                issues.push({
                    type: 'base_cv_meta_commentary',
                    match: match,
                    severity: 'high'
                });
            }
        }

        // Check for future dates in experience
        const currentYear = new Date().getFullYear();
        if (cvData.experience && Array.isArray(cvData.experience)) {
            for (const exp of cvData.experience) {
                if (exp.period) {
                    const yearMatches = exp.period.match(/\b(20\d{2})\b/g);
                    if (yearMatches) {
                        for (const yr of yearMatches) {
                            if (parseInt(yr, 10) > currentYear + 1) {
                                issues.push({
                                    type: 'base_cv_future_date',
                                    field: `experience: ${exp.position}`,
                                    value: exp.period,
                                    severity: 'high'
                                });
                            }
                        }
                    }
                }
            }
        }

        if (issues.length > 0) {
            console.log(`   📄 Base CV issues found: ${issues.length}`);
            this.detectionResults.flagged_content.push({
                type: 'base_cv_integrity',
                issues: issues,
                count: issues.length,
                severity: issues.some(i => i.severity === 'high') ? 'high' : 'medium'
            });
        } else {
            console.log('   📄 Base CV integrity check passed');
        }
    }

    /**
     * Calculate overall confidence score using weighted metrics
     */
    calculateOverallConfidence() {
        const layers = this.detectionResults.detection_layers;

        // Calculate individual layer scores (0-100)
        // When no quantitative claims exist, treat as clean (100) not failed (0)
        const quantRate = layers.quantitative_validation.accuracy_rate;
        const quantScore = (layers.quantitative_validation.passed === 0 && layers.quantitative_validation.failed === 0)
            ? 100 : (quantRate * 100);
        const timelineScore = layers.timeline_coherence.failed === 0 ? 100 :
            Math.max(0, 100 - (layers.timeline_coherence.failed * 25));
        const genericPenalty = Math.min(50, layers.generic_language.score);
        const impossiblePenalty = layers.impossible_claims.count * 30;
        const consistencyScore = layers.consistency_check.consistency_score;

        // Apply weighted scoring
        const overallScore = Math.max(0, Math.min(100,
            (quantScore * this.scoringWeights.quantitative_accuracy) +
            (timelineScore * this.scoringWeights.timeline_coherence) +
            (consistencyScore * this.scoringWeights.quantitative_accuracy) -
            (genericPenalty * this.scoringWeights.generic_language_penalty) -
            (impossiblePenalty * this.scoringWeights.impossible_claims_penalty)
        ));

        // Additional penalty for meta-commentary (hard penalty)
        const metaFlags = this.detectionResults.flagged_content.filter(
            f => f.type === 'meta_commentary'
        );
        const metaCount = metaFlags.reduce((sum, f) => sum + (f.count || 0), 0);
        const metaPenalty = metaCount * 10;

        this.detectionResults.overall_confidence = Math.max(0, Math.round(overallScore - metaPenalty));

        console.log('');
        console.log(`🎯 **OVERALL CONFIDENCE SCORE: ${this.detectionResults.overall_confidence}/100**`);
        console.log('');
    }

    /**
     * Calculate confidence when only base CV is being validated (no AI enhancements)
     */
    calculateOverallConfidenceForBaseCVOnly() {
        const genericPenalty = Math.min(50, this.detectionResults.detection_layers.generic_language.score);
        const impossiblePenalty = (this.detectionResults.detection_layers.impossible_claims.count || 0) * 30;

        // Count meta-commentary and base CV integrity issues
        const metaFlags = this.detectionResults.flagged_content.filter(
            f => f.type === 'meta_commentary'
        );
        const metaCount = metaFlags.reduce((sum, f) => sum + (f.count || 0), 0);
        const metaPenalty = metaCount * 10;

        const baseCVIssues = this.detectionResults.flagged_content.filter(
            f => f.type === 'base_cv_integrity'
        );
        const baseCVHighCount = baseCVIssues.reduce((sum, f) => {
            if (!f.issues) return sum;
            return sum + f.issues.filter(i => i.severity === 'high').length;
        }, 0);
        const baseCVPenalty = baseCVHighCount * 15;

        const overallScore = Math.max(0, 100 - genericPenalty - impossiblePenalty - metaPenalty - baseCVPenalty);
        this.detectionResults.overall_confidence = Math.round(overallScore);

        console.log('');
        console.log(`🎯 **OVERALL CONFIDENCE SCORE: ${this.detectionResults.overall_confidence}/100**`);
        console.log('');
    }

    /**
     * Generate actionable recommendations based on detection results
     */
    async generateRecommendations() {
        const recommendations = [];
        const urgentReviews = [];

        // Critical issues requiring immediate attention
        if (this.detectionResults.overall_confidence < 70) {
            urgentReviews.push({
                priority: 'critical',
                message: 'Low confidence score requires immediate content review',
                action: 'Manual review and fact-checking of all AI-generated content'
            });
        }

        // Specific recommendations based on detection results
        const flaggedCount = this.detectionResults.flagged_content.length;
        if (flaggedCount > 5) {
            recommendations.push({
                category: 'content_quality',
                message: `${flaggedCount} flagged items require attention`,
                action: 'Review and correct flagged content before deployment'
            });
        }

        // Generic language recommendations
        const genericScore = this.detectionResults.detection_layers.generic_language.score;
        if (genericScore > 50) {
            recommendations.push({
                category: 'authenticity',
                message: 'High generic language score indicates AI-generated feel',
                action: 'Revise content to be more specific and personal'
            });
        }

        // Quantitative accuracy recommendations
        const quantAccuracy = this.detectionResults.detection_layers.quantitative_validation.accuracy_rate;
        if (quantAccuracy < 0.8) {
            recommendations.push({
                category: 'accuracy',
                message: 'Low quantitative accuracy detected',
                action: 'Verify all numerical claims against GitHub data'
            });
        }

        // Meta-commentary recommendations
        const metaFlags = this.detectionResults.flagged_content.filter(f => f.type === 'meta_commentary');
        if (metaFlags.length > 0) {
            urgentReviews.push({
                priority: 'high',
                message: 'AI meta-commentary detected in content — prompt artifacts have leaked through',
                action: 'Remove all AI meta-commentary references before deployment'
            });
        }

        this.detectionResults.recommendations = recommendations;
        this.detectionResults.urgent_reviews = urgentReviews;
    }

    /**
     * Helper methods for claim extraction and validation
     */
    extractQuantitativeClaims(aiContent) {
        const claims = [];
        const patterns = [
            /(\d+)\s*(?:years?|months?)\s+(?:of\s+)?experience/gi,
            /(\d+)\+?\s*(?:projects?|repositories?|systems?)/gi,
            /(\d+)\s*(?:programming\s+)?languages?/gi,
            /(\d+)%\s+(?:improvement|increase|reduction|faster)/gi,
            /(\d+)x\s+(?:faster|more|better|improved)/gi
        ];

        const textContent = this.extractAllText(aiContent);

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(textContent)) !== null) {
                claims.push({
                    text: match[0],
                    value: parseInt(match[1]),
                    type: this.classifyClaimType(match[0])
                });
            }
        }

        return claims;
    }

    async validateClaimAgainstData(claim, githubData) {
        const actualValue = this.getActualValue(claim.type, githubData);
        const tolerance = this.getToleranceForClaimType(claim.type);

        const isValid = Math.abs(claim.value - actualValue) <= tolerance;

        return {
            isValid,
            actualValue,
            severity: isValid ? 'none' : (Math.abs(claim.value - actualValue) > tolerance * 2 ? 'high' : 'medium')
        };
    }

    /**
     * Helper methods (implementation details)
     */
    extractAllText(content) {
        if (typeof content === 'string') return content;
        return JSON.stringify(content, null, 2);
    }

    classifyClaimType(claimText) {
        const lower = claimText.toLowerCase();
        if (lower.includes('year') || lower.includes('month')) return 'experience';
        if (lower.includes('project') || lower.includes('repository')) return 'projects';
        if (lower.includes('language')) return 'languages';
        if (lower.includes('%')) return 'performance';
        return 'general';
    }

    getActualValue(claimType, githubData) {
        switch (claimType) {
            case 'projects': return githubData?.repositories?.total_count || githubData?.summary?.total_repos || 0;
            case 'languages': return githubData?.languages?.length || githubData?.summary?.languages?.length || 0;
            default: return 0;
        }
    }

    getToleranceForClaimType(claimType) {
        switch (claimType) {
            case 'experience': return 6; // 6 months tolerance
            case 'projects': return 3;   // 3 project tolerance
            case 'languages': return 2; // 2 language tolerance
            case 'performance': return 20; // 20% tolerance
            default: return 1;
        }
    }

    /**
     * Extract timeline events from AI content and CV data
     */
    extractTimelineEvents(aiContent, cvData) {
        const events = [];

        // Extract from CV experience entries
        const experiences = cvData?.experience || aiContent?.experience || [];
        for (const exp of experiences) {
            if (!exp.period) continue;
            const parsed = this.parsePeriod(exp.period);
            events.push({
                description: `${exp.position || 'Unknown'} at ${exp.company || 'Unknown'}`,
                timeframe: exp.period,
                startYear: parsed.startYear,
                endYear: parsed.endYear,
                position: exp.position || '',
                source: 'experience'
            });
        }

        // Extract from projects
        const projects = cvData?.projects || aiContent?.projects || [];
        for (const proj of projects) {
            if (!proj.period) continue;
            const parsed = this.parsePeriod(proj.period);
            events.push({
                description: `Project: ${proj.name || 'Unknown'}`,
                timeframe: proj.period,
                startYear: parsed.startYear,
                endYear: parsed.endYear,
                source: 'project'
            });
        }

        // Extract from achievements
        const achievements = cvData?.achievements || aiContent?.achievements || [];
        for (const ach of achievements) {
            if (!ach.date) continue;
            const parsed = this.parsePeriod(ach.date);
            events.push({
                description: `Achievement: ${ach.title || 'Unknown'}`,
                timeframe: ach.date,
                startYear: parsed.startYear,
                endYear: parsed.endYear,
                source: 'achievement'
            });
        }

        // Extract timeline claims from text content
        const textContent = this.extractAllText(aiContent);
        const timelinePatterns = this.hallucinationPatterns.timeline_violations || [];
        for (const pattern of timelinePatterns) {
            const matches = textContent.match(pattern) || [];
            for (const match of matches) {
                events.push({
                    description: match,
                    timeframe: match,
                    startYear: null,
                    endYear: null,
                    source: 'text_claim',
                    flagged: true
                });
            }
        }

        return events;
    }

    /**
     * Parse a period string like "2018 - Present" into start/end years
     */
    parsePeriod(periodStr) {
        const currentYear = new Date().getFullYear();
        const years = periodStr.match(/\b(20\d{2}|19\d{2})\b/g);
        const isPresent = /present|current|now/i.test(periodStr);

        let startYear = null;
        let endYear = null;

        if (years && years.length >= 1) {
            startYear = parseInt(years[0], 10);
        }
        if (years && years.length >= 2) {
            endYear = parseInt(years[1], 10);
        } else if (isPresent) {
            endYear = currentYear;
        } else if (startYear) {
            endYear = startYear;
        }

        return { startYear, endYear };
    }

    /**
     * Check if a timeline event is a violation (impossible timeframe)
     */
    isTimelineViolation(event) {
        const currentYear = new Date().getFullYear();

        // Events extracted from timeline_violations patterns are inherently flagged
        if (event.flagged) return true;

        // Start date in the far future
        if (event.startYear && event.startYear > currentYear + 1) return true;

        // End date before start date
        if (event.startYear && event.endYear && event.endYear < event.startYear) return true;

        // Unreasonably old start date for a tech career (before 1990)
        if (event.startYear && event.startYear < 1990) return true;

        return false;
    }

    /**
     * Check chronological consistency across all timeline events
     */
    checkChronology(timelineEvents) {
        const issues = [];
        const currentYear = new Date().getFullYear();

        // Check for overlapping full-time positions
        // Skip overlaps where one role is self-employment (Director/Founder/Owner/Consultant)
        const selfEmploymentPattern = /\b(?:director|founder|owner|co-founder|consultant|freelance|self-employed)\b/i;
        const fullTimeExperiences = timelineEvents.filter(e => e.source === 'experience');
        for (let i = 0; i < fullTimeExperiences.length; i++) {
            for (let j = i + 1; j < fullTimeExperiences.length; j++) {
                const a = fullTimeExperiences[i];
                const b = fullTimeExperiences[j];

                // Skip if we cannot parse years
                if (!a.startYear || !a.endYear || !b.startYear || !b.endYear) continue;

                // Allow concurrent roles when one is self-employment/directorship
                if (selfEmploymentPattern.test(a.position || '') || selfEmploymentPattern.test(b.position || '')) continue;

                // Check for overlap (allowing 1 year overlap for transitions)
                const overlapStart = Math.max(a.startYear, b.startYear);
                const overlapEnd = Math.min(a.endYear, b.endYear);
                if (overlapEnd - overlapStart > 1) {
                    issues.push({
                        type: 'chronology_overlap',
                        description: `Significant overlap between "${a.description}" and "${b.description}"`,
                        timeframe: `${a.timeframe} vs ${b.timeframe}`,
                        violation: 'More than 1 year of overlapping full-time positions'
                    });
                }
            }
        }

        // Check that achievements fall within reasonable time
        const achievementEvents = timelineEvents.filter(e => e.source === 'achievement');
        for (const ach of achievementEvents) {
            if (ach.endYear && ach.endYear > currentYear + 1) {
                issues.push({
                    type: 'future_achievement',
                    description: ach.description,
                    timeframe: ach.timeframe,
                    violation: 'Achievement date is in the future'
                });
            }
        }

        return issues;
    }

    /**
     * Assess the severity of a single claim
     */
    assessClaimSeverity(claimText, category) {
        const text = claimText.toLowerCase();

        // Impossible performance claims are always high severity
        if (category === 'impossible_performance') return 'high';

        // Timeline violations are high severity
        if (category === 'timeline_violations') return 'high';

        // Suspicious metrics: severity depends on the magnitude
        if (category === 'suspicious_metrics') {
            const numMatch = claimText.match(/(\d+)/);
            if (numMatch) {
                const num = parseInt(numMatch[1], 10);
                if (num > 500) return 'high';
                if (num > 100) return 'medium';
            }
            // Dollar amounts with million/billion
            if (/million|billion/i.test(text)) return 'high';
            return 'medium';
        }

        return 'medium';
    }

    /**
     * Determine the overall severity from a list of claims
     */
    getOverallSeverity(claims) {
        if (claims.length === 0) return 'none';
        if (claims.some(c => c.severity === 'high')) return 'high';
        if (claims.some(c => c.severity === 'medium')) return 'medium';
        return 'low';
    }

    /**
     * Extract experience years mentioned in AI content
     */
    extractExperienceYears(aiContent) {
        const text = this.extractAllText(aiContent);
        const matches = text.match(/(\d+)\+?\s*(?:years?)\s+(?:of\s+)?experience/gi) || [];
        const values = [];
        for (const match of matches) {
            const num = match.match(/(\d+)/);
            if (num) values.push(parseInt(num[1], 10));
        }
        return values;
    }

    /**
     * Extract skill counts mentioned in AI content
     */
    extractSkillCounts(aiContent) {
        const text = this.extractAllText(aiContent);
        const matches = text.match(/(\d+)\+?\s*(?:skills?|technologies?|tools?|languages?)/gi) || [];
        const values = [];
        for (const match of matches) {
            const num = match.match(/(\d+)/);
            if (num) values.push(parseInt(num[1], 10));
        }
        return values;
    }

    /**
     * Extract project counts mentioned in AI content
     */
    extractProjectCounts(aiContent) {
        const text = this.extractAllText(aiContent);
        const matches = text.match(/(\d+)\+?\s*(?:projects?|repositories?|applications?|systems?)/gi) || [];
        const values = [];
        for (const match of matches) {
            const num = match.match(/(\d+)/);
            if (num) values.push(parseInt(num[1], 10));
        }
        return values;
    }

    /**
     * Get the base value from CV data for a given key
     */
    getBaseValue(cvData, key) {
        if (!cvData) return null;

        switch (key) {
            case 'experience_years': {
                // Calculate from the earliest experience entry to now
                const experiences = cvData.experience || [];
                if (experiences.length === 0) return null;
                let earliest = new Date().getFullYear();
                for (const exp of experiences) {
                    if (exp.period) {
                        const years = exp.period.match(/\b(20\d{2}|19\d{2})\b/g);
                        if (years) {
                            const yr = parseInt(years[0], 10);
                            if (yr < earliest) earliest = yr;
                        }
                    }
                }
                return new Date().getFullYear() - earliest;
            }
            case 'skill_counts': {
                const skills = cvData.skills || [];
                return skills.length;
            }
            case 'project_counts': {
                const projects = cvData.projects || [];
                return projects.length;
            }
            default:
                return null;
        }
    }

    /**
     * Check if there is a significant discrepancy between AI values and base value
     */
    hasSignificantDiscrepancy(aiValues, baseValue) {
        if (!Array.isArray(aiValues) || aiValues.length === 0) return false;
        if (baseValue === null || baseValue === undefined) return false;

        for (const val of aiValues) {
            const diff = Math.abs(val - baseValue);
            // More than 50% discrepancy or more than 5 absolute difference
            if (diff > Math.max(baseValue * 0.5, 5)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculate the discrepancy between AI values and base value
     */
    calculateDiscrepancy(aiValues, baseValue) {
        if (!Array.isArray(aiValues) || aiValues.length === 0) return 0;
        if (baseValue === 0) return aiValues[0] || 0;

        // Return the maximum discrepancy percentage
        let maxDiscrepancy = 0;
        for (const val of aiValues) {
            const pct = Math.abs(val - baseValue) / baseValue * 100;
            if (pct > maxDiscrepancy) maxDiscrepancy = pct;
        }
        return Math.round(maxDiscrepancy);
    }

    /**
     * Data loading methods
     */
    async loadAIEnhancements() {
        try {
            const enhancementsPath = path.join(this.dataDir, 'ai-enhancements.json');
            const content = await fs.readFile(enhancementsPath, 'utf8');
            return JSON.parse(content);
        } catch {
            console.warn('⚠️ AI enhancements data not found');
            return {};
        }
    }

    async loadGitHubData() {
        try {
            const summaryPath = path.join(this.dataDir, 'activity-summary.json');
            const summary = JSON.parse(await fs.readFile(summaryPath, 'utf8'));

            // Load detailed activity data if available
            const latestActivity = summary.data_files?.latest_activity;
            if (latestActivity) {
                const detailedPath = path.join(this.dataDir, 'activity', latestActivity);
                const detailed = JSON.parse(await fs.readFile(detailedPath, 'utf8'));
                return { summary, detailed };
            }

            return { summary };
        } catch {
            console.warn('⚠️ GitHub data not found');
            return {};
        }
    }

    async loadCVData() {
        try {
            const cvPath = path.join(this.dataDir, 'base-cv.json');
            const content = await fs.readFile(cvPath, 'utf8');
            return JSON.parse(content);
        } catch {
            console.warn('⚠️ Base CV data not found');
            return {};
        }
    }

    /**
     * Utility methods
     */
    async ensureCacheDirectory() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch {
            // Directory already exists or creation failed
        }
    }

    generateEmptyReport() {
        return {
            overall_confidence: 100,
            validation_timestamp: new Date().toISOString(),
            message: 'No content to validate (no AI enhancements and no base CV)',
            detection_layers: {},
            flagged_content: [],
            recommendations: []
        };
    }

    async saveDetectionResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsPath = path.join(this.dataDir, `validation-report-${timestamp}.json`);

        await fs.writeFile(resultsPath, JSON.stringify(this.detectionResults, null, 2), 'utf8');

        // Also save as latest report
        const latestPath = path.join(this.dataDir, 'latest-validation-report.json');
        await fs.writeFile(latestPath, JSON.stringify(this.detectionResults, null, 2), 'utf8');

        console.log(`💾 Validation report saved: ${resultsPath}`);
    }

    displayValidationSummary() {
        console.log('📋 **VALIDATION SUMMARY**');
        console.log('========================');
        console.log(`🎯 Overall Confidence: ${this.detectionResults.overall_confidence}/100`);
        console.log(`🚨 Flagged Items: ${this.detectionResults.flagged_content.length}`);
        console.log(`⚠️ Recommendations: ${this.detectionResults.recommendations.length}`);
        console.log(`🔥 Urgent Reviews: ${this.detectionResults.urgent_reviews.length}`);

        if (this.detectionResults.overall_confidence >= 90) {
            console.log('✅ EXCELLENT: Content has high credibility');
        } else if (this.detectionResults.overall_confidence >= 70) {
            console.log('⚠️ GOOD: Minor issues detected, review recommended');
        } else {
            console.log('🚨 CRITICAL: Significant issues detected, immediate review required');
        }

        console.log('');
    }
}

/**
 * Main execution function
 */
async function main() {
    const detector = new AIHallucinationDetector();

    try {
        const results = await detector.detectHallucinations();

        // Exit with error code if critical issues detected
        if (results.overall_confidence < 70) {
            console.error('🚨 CRITICAL VALIDATION FAILURES DETECTED');
            process.exit(1);
        }

        console.log('✅ AI Hallucination detection completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('❌ AI Hallucination detection failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { AIHallucinationDetector };
