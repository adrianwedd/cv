#!/usr/bin/env node

/**
 * AI Claim Verification Engine
 * 
 * Verifies AI-generated claims against actual GitHub data to ensure factual accuracy
 * and prevent exaggeration in CV content. This system extracts quantifiable claims
 * from AI-enhanced content and cross-references them with real metrics.
 * 
 * Features:
 * - Quantifiable claim extraction from text
 * - GitHub data comparison and validation
 * - Discrepancy detection and flagging
 * - Confidence scoring for claims
 * - Human review recommendations
 * 
 * Usage: node claim-verifier.js
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Claim Verification System
 * 
 * Analyzes AI-generated content to identify and verify quantifiable claims
 * against actual GitHub activity data
 */
class ClaimVerifier {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.verificationResults = {
            verified_claims: [],
            unverified_claims: [],
            flagged_discrepancies: [],
            confidence_scores: {},
            recommendations: []
        };
    }

    /**
     * Main verification pipeline
     */
    async verifyAllClaims() {
        console.log('🔍 **AI CLAIM VERIFICATION INITIATED**');
        console.log('📊 Analyzing AI-generated content against GitHub data...');
        console.log('');

        try {
            // Load data sources
            const aiEnhancements = await this.loadAIEnhancements();
            const activityData = await this.loadActivityData();
            const githubMetrics = await this.extractGitHubMetrics(activityData);

            // Extract claims from AI-generated content
            const extractedClaims = await this.extractQuantifiableClaims(aiEnhancements);

            // Verify each claim against actual data
            for (const claim of extractedClaims) {
                const verification = await this.verifyClaim(claim, githubMetrics);
                this.categorizeVerification(claim, verification);
            }

            // Generate verification report
            const report = await this.generateVerificationReport();
            await this.saveVerificationResults(report);

            console.log('✅ Claim verification completed');
            console.log(`📊 Results: ${this.verificationResults.verified_claims.length} verified, ${this.verificationResults.unverified_claims.length} unverified, ${this.verificationResults.flagged_discrepancies.length} flagged`);

            return report;

        } catch (error) {
            console.error('❌ Claim verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Load AI enhancements data
     */
    async loadAIEnhancements() {
        try {
            const enhancementsPath = path.join(this.dataDir, 'ai-enhancements.json');
            const content = await fs.readFile(enhancementsPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.warn('⚠️ AI enhancements data not found');
            return {};
        }
    }

    /**
     * Load activity data for verification
     */
    async loadActivityData() {
        try {
            const summaryPath = path.join(this.dataDir, 'activity-summary.json');
            const summaryContent = await fs.readFile(summaryPath, 'utf8');
            const summary = JSON.parse(summaryContent);

            // Also load detailed activity data if available
            const latestActivityFile = summary?.data_files?.latest_activity;
            if (latestActivityFile) {
                const detailedPath = path.join(this.dataDir, 'activity', latestActivityFile);
                try {
                    const detailedContent = await fs.readFile(detailedPath, 'utf8');
                    const detailed = JSON.parse(detailedContent);
                    return { summary, detailed };
                } catch (error) {
                    console.warn('⚠️ Detailed activity data not found, using summary only');
                    return { summary };
                }
            }

            return { summary };
        } catch (error) {
            console.warn('⚠️ Activity data not found');
            return {};
        }
    }

    /**
     * Extract GitHub metrics from activity data
     */
    async extractGitHubMetrics(activityData) {
        const metrics = {
            commits: {
                total: activityData?.summary?.total_commits || 0,
                period_days: activityData?.summary?.lookback_period_days || 30
            },
            repositories: {
                total: activityData?.detailed?.repositories?.summary?.total_count || 0,
                languages: activityData?.detailed?.repositories?.summary?.languages || [],
                stars: activityData?.detailed?.repositories?.summary?.total_stars || 0,
                forks: activityData?.detailed?.repositories?.summary?.total_forks || 0
            },
            activity: {
                active_days: activityData?.summary?.active_days || 0,
                net_lines: activityData?.summary?.net_lines_contributed || 0
            }
        };

        console.log('📈 Extracted GitHub metrics:');
        console.log(`  - Total commits: ${metrics.commits.total}`);
        console.log(`  - Repositories: ${metrics.repositories.total}`);
        console.log(`  - Languages: ${metrics.repositories.languages.length}`);
        console.log(`  - Stars received: ${metrics.repositories.stars}`);
        console.log(`  - Active days: ${metrics.activity.active_days}`);
        console.log('');

        return metrics;
    }

    /**
     * Extract quantifiable claims from AI-generated content
     */
    async extractQuantifiableClaims(aiEnhancements) {
        const claims = [];
        
        // Define patterns for quantifiable claims
        const claimPatterns = [
            // Numbers with descriptors (projects, systems, etc.)
            '(\\d+)\\+?\\s*(projects?|systems?|applications?|repositories?|years?|languages?)',
            // Percentages with context
            '(\\d+)%(?:\\s+|\\s*)(improvement|reduction|increase|efficiency|accuracy|across|while)',
            // Performance improvement claims
            '(reduced|reducing|improving|increasing|optimizing|increased).*?(\\d+)%',
            // Reliability/system percentages
            '(\\d+\\.\\d+|\\d+)%\\s*(system|reliability)',
            // Delivery/creation claims
            '(delivered|created|built|developed)\\s+(\\d+)\\+?\\s*(\\w+)',
            // Scale descriptors
            '(dozens?|hundreds?|thousands?)\\s*of\\s*(\\w+)',
            // Years of experience
            '(\\d+)\\+?\\s*years?\\s*(of\\s+)?(experience|expertise)'
        ];

        // Extract from professional summary
        if (aiEnhancements?.professional_summary?.enhanced) {
            const text = aiEnhancements.professional_summary.enhanced;
            console.log(`🔍 Analyzing professional summary (${text.length} chars)`);
            const summaryClaims = this.extractClaimsFromText(text, 'professional_summary', claimPatterns);
            console.log(`   Found ${summaryClaims.length} claims in professional summary`);
            claims.push(...summaryClaims);
        }

        // Extract from other AI-enhanced sections
        const sections = ['skills_enhancement', 'experience_enhancement', 'project_enhancement'];
        for (const section of sections) {
            if (aiEnhancements[section]?.enhanced) {
                const text = JSON.stringify(aiEnhancements[section].enhanced);
                claims.push(...this.extractClaimsFromText(text, section, claimPatterns));
            }
        }

        console.log(`🔍 Extracted ${claims.length} quantifiable claims for verification`);
        return claims;
    }

    /**
     * Extract claims from text using patterns
     */
    extractClaimsFromText(text, source, patterns) {
        const claims = [];
        
        for (let i = 0; i < patterns.length; i++) {
            // Create fresh regex object for each pattern
            const regex = new RegExp(patterns[i], 'gi');
            let match;
            let patternMatches = 0;
            
            while ((match = regex.exec(text)) !== null) {
                patternMatches++;
                claims.push({
                    text: match[0],
                    source,
                    type: this.categorizeClaimType(match[0]),
                    extracted_value: this.extractNumericValue(match[0]),
                    context: this.getClaimContext(text, match.index, 50)
                });
            }
            
            if (patternMatches > 0) {
                console.log(`     Pattern ${i + 1} matched ${patternMatches} times: ${patterns[i]}`);
            }
        }

        return claims;
    }

    /**
     * Categorize claim type
     */
    categorizeClaimType(claimText) {
        const lowerText = claimText.toLowerCase();
        
        if (lowerText.includes('project') || lowerText.includes('system') || lowerText.includes('application')) {
            return 'project_count';
        } else if (lowerText.includes('language')) {
            return 'language_count';
        } else if (lowerText.includes('year')) {
            return 'experience_duration';
        } else if (lowerText.includes('%')) {
            return 'performance_metric';
        } else if (lowerText.includes('repository') || lowerText.includes('repo')) {
            return 'repository_count';
        } else {
            return 'general_quantity';
        }
    }

    /**
     * Extract numeric value from claim
     */
    extractNumericValue(claimText) {
        const numbers = claimText.match(/\d+/g);
        return numbers ? parseInt(numbers[0]) : null;
    }

    /**
     * Get context around claim
     */
    getClaimContext(text, index, contextLength) {
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + contextLength);
        return text.substring(start, end).trim();
    }

    /**
     * Verify individual claim against GitHub metrics
     */
    async verifyClaim(claim, githubMetrics) {
        const verification = {
            claim,
            verified: false,
            confidence: 0,
            actual_value: null,
            discrepancy: null,
            reasoning: ''
        };

        switch (claim.type) {
            case 'project_count':
            case 'repository_count':
                verification.actual_value = githubMetrics.repositories.total;
                verification.verified = this.isReasonableRange(claim.extracted_value, verification.actual_value, 0.5);
                verification.confidence = this.calculateConfidence(claim.extracted_value, verification.actual_value);
                verification.reasoning = `Claimed ${claim.extracted_value}, actual ${verification.actual_value}`;
                break;

            case 'language_count':
                verification.actual_value = githubMetrics.repositories.languages.length;
                verification.verified = this.isReasonableRange(claim.extracted_value, verification.actual_value, 0.3);
                verification.confidence = this.calculateConfidence(claim.extracted_value, verification.actual_value);
                verification.reasoning = `Claimed ${claim.extracted_value}, actual ${verification.actual_value}`;
                break;

            case 'performance_metric':
                // Performance metrics are harder to verify without specific context
                verification.verified = false;
                verification.confidence = 0.1;
                verification.reasoning = 'Performance metrics require additional context for verification';
                break;

            default:
                verification.verified = false;
                verification.confidence = 0.2;
                verification.reasoning = 'General claims require manual review';
        }

        if (verification.actual_value !== null && claim.extracted_value !== null) {
            verification.discrepancy = Math.abs(claim.extracted_value - verification.actual_value);
        }

        return verification;
    }

    /**
     * Check if claimed value is in reasonable range of actual value
     */
    isReasonableRange(claimed, actual, tolerance) {
        if (claimed === null || actual === null) return false;
        
        const difference = Math.abs(claimed - actual);
        const maxAllowed = Math.max(actual * tolerance, 2); // Allow at least 2 units difference
        
        return difference <= maxAllowed;
    }

    /**
     * Calculate confidence score for claim verification
     */
    calculateConfidence(claimed, actual) {
        if (claimed === null || actual === null) return 0;
        
        const difference = Math.abs(claimed - actual);
        const average = (claimed + actual) / 2;
        const relativeError = average > 0 ? difference / average : 1;
        
        return Math.max(0, 1 - relativeError);
    }

    /**
     * Categorize verification result
     */
    categorizeVerification(claim, verification) {
        if (verification.verified && verification.confidence > 0.7) {
            this.verificationResults.verified_claims.push({ claim, verification });
        } else if (verification.confidence < 0.3 || verification.discrepancy > 5) {
            this.verificationResults.flagged_discrepancies.push({ claim, verification });
        } else {
            this.verificationResults.unverified_claims.push({ claim, verification });
        }

        this.verificationResults.confidence_scores[claim.text] = verification.confidence;
    }

    /**
     * Generate comprehensive verification report
     */
    async generateVerificationReport() {
        const report = {
            verification_timestamp: new Date().toISOString(),
            summary: {
                total_claims_analyzed: this.verificationResults.verified_claims.length + 
                                     this.verificationResults.unverified_claims.length + 
                                     this.verificationResults.flagged_discrepancies.length,
                verified_claims: this.verificationResults.verified_claims.length,
                unverified_claims: this.verificationResults.unverified_claims.length,
                flagged_discrepancies: this.verificationResults.flagged_discrepancies.length,
                overall_confidence: this.calculateOverallConfidence()
            },
            detailed_results: this.verificationResults,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Calculate overall confidence score
     */
    calculateOverallConfidence() {
        const confidenceValues = Object.values(this.verificationResults.confidence_scores);
        if (confidenceValues.length === 0) return 0;
        
        return confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length;
    }

    /**
     * Generate recommendations based on verification results
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.verificationResults.flagged_discrepancies.length > 0) {
            recommendations.push({
                type: 'critical',
                message: `${this.verificationResults.flagged_discrepancies.length} claims have significant discrepancies and should be reviewed`,
                action: 'Review and adjust flagged claims to match actual GitHub data'
            });
        }

        if (this.verificationResults.unverified_claims.length > 0) {
            recommendations.push({
                type: 'warning',
                message: `${this.verificationResults.unverified_claims.length} claims could not be verified automatically`,
                action: 'Consider providing additional context or documentation for these claims'
            });
        }

        const overallConfidence = this.calculateOverallConfidence();
        if (overallConfidence < 0.5) {
            recommendations.push({
                type: 'critical',
                message: `Overall confidence score is low (${(overallConfidence * 100).toFixed(1)}%)`,
                action: 'Revise AI prompts to focus on verifiable achievements and metrics'
            });
        }

        return recommendations;
    }

    /**
     * Save verification results
     */
    async saveVerificationResults(report) {
        try {
            const outputPath = path.join(this.dataDir, 'claim-verification-report.json');
            await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');
            
            console.log(`📄 Verification report saved: ${outputPath}`);
            
            // Also save a summary for quick review
            const summaryPath = path.join(this.dataDir, 'verification-summary.json');
            await fs.writeFile(summaryPath, JSON.stringify({
                last_verification: report.verification_timestamp,
                summary: report.summary,
                urgent_recommendations: report.recommendations.filter(r => r.type === 'critical')
            }, null, 2), 'utf8');
            
        } catch (error) {
            console.error('❌ Failed to save verification results:', error.message);
            throw error;
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        const verifier = new ClaimVerifier();
        const report = await verifier.verifyAllClaims();
        
        console.log('');
        console.log('🎯 **CLAIM VERIFICATION SUMMARY**');
        console.log(`📊 Total claims analyzed: ${report.summary.total_claims_analyzed}`);
        console.log(`✅ Verified claims: ${report.summary.verified_claims}`);
        console.log(`⚠️ Unverified claims: ${report.summary.unverified_claims}`);
        console.log(`🚨 Flagged discrepancies: ${report.summary.flagged_discrepancies}`);
        console.log(`🎯 Overall confidence: ${(report.summary.overall_confidence * 100).toFixed(1)}%`);
        
        if (report.recommendations.length > 0) {
            console.log('');
            console.log('📋 **RECOMMENDATIONS:**');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.type.toUpperCase()}] ${rec.message}`);
                console.log(`   Action: ${rec.action}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Claim verification failed:', error.message);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ClaimVerifier };