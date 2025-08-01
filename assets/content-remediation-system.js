/**
 * Content Remediation System
 * 
 * Comprehensive system for detecting, flagging, and remediating AI-generated
 * content that contains unverifiable claims, fabricated metrics, or inconsistencies.
 * Integrates with AI hallucination detection to provide content quality assurance.
 */

class ContentRemediationSystem {
    constructor() {
        this.remediationRules = new Map();
        this.contentSources = new Map();
        this.verificationStrategies = new Map();
        this.remediatedContent = new Map();
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize the remediation system
     */
    async init() {
        console.log('🛠️ Initializing Content Remediation System...');
        
        try {
            this.setupRemediationRules();
            this.setupVerificationStrategies();
            await this.loadContentSources();
            
            this.isInitialized = true;
            console.log('✅ Content Remediation System initialized successfully');
            
        } catch (error) {
            console.error('❌ Content Remediation System initialization failed:', error);
        }
    }

    /**
     * Setup remediation rules for different types of content issues
     */
    setupRemediationRules() {
        // Fabricated Performance Metrics
        this.remediationRules.set('fabricated_metrics', {
            patterns: [
                /increased operational efficiency by.*?(\d+)%/gi,
                /reduced decision-making latency by.*?(\d+)%/gi,
                /improved productivity by.*?(\d+)%/gi,
                /achieved.*?(\d+)%.*?success rate/gi,
                /delivered.*?(\d+)x.*?improvement/gi
            ],
            severity: 'high',
            action: 'replace_with_verified',
            replacements: {
                'operational efficiency': 'system integration and process optimization',
                'decision-making latency': 'workflow automation and streamlined processes',
                'productivity': 'development velocity and code quality',
                'success rate': 'reliable system performance',
                'improvement': 'enhancement and optimization'
            }
        });

        // Generic AI Language
        this.remediationRules.set('generic_ai_language', {
            patterns: [
                /seamlessly integrat(?:ed?|ing)/gi,
                /cutting-edge/gi,
                /state-of-the-art/gi,
                /innovative solutions/gi,
                /paradigm shift/gi,
                /revolutionary/gi,
                /groundbreaking/gi
            ],
            severity: 'medium',
            action: 'replace_with_specific',
            replacements: {
                'seamlessly integrate': 'integrate',
                'cutting-edge': 'modern',
                'state-of-the-art': 'advanced',
                'innovative solutions': 'technical solutions',
                'paradigm shift': 'significant change',
                'revolutionary': 'significant',
                'groundbreaking': 'notable'
            }
        });

        // Unverifiable Claims
        this.remediationRules.set('unverifiable_claims', {
            patterns: [
                /recognized for pioneering/gi,
                /industry-leading/gi,
                /award-winning/gi,
                /internationally acclaimed/gi,
                /globally recognized/gi
            ],
            severity: 'high',
            action: 'remove_or_verify',
            replacements: {
                'recognized for pioneering': 'experienced in developing',
                'industry-leading': 'professional',
                'award-winning': 'well-designed',
                'internationally acclaimed': 'comprehensive',
                'globally recognized': 'established'
            }
        });

        // Impossible Timeline Claims
        this.remediationRules.set('timeline_inconsistencies', {
            patterns: [
                /delivered.*?in record time/gi,
                /completed.*?ahead of schedule/gi,
                /faster than expected/gi
            ],
            severity: 'medium',
            action: 'replace_with_neutral',
            replacements: {
                'in record time': 'efficiently',
                'ahead of schedule': 'on schedule',
                'faster than expected': 'effectively'
            }
        });
    }

    /**
     * Setup verification strategies for different content types
     */
    setupVerificationStrategies() {
        this.verificationStrategies.set('github_metrics', {
            verifyFunction: async (claim) => {
                // Verify against actual GitHub data
                try {
                    const response = await fetch('data/activity-summary.json');
                    const data = await response.json();
                    return this.verifyAgainstGitHubData(claim, data);
                } catch {
                    return { verified: false, reason: 'Unable to load GitHub data' };
                }
            }
        });

        this.verificationStrategies.set('employment_history', {
            verifyFunction: async (claim) => {
                // Verify against base CV data
                try {
                    const response = await fetch('data/base-cv.json');
                    const data = await response.json();
                    return this.verifyAgainstEmploymentHistory(claim, data);
                } catch {
                    return { verified: false, reason: 'Unable to load CV data' };
                }
            }
        });

        this.verificationStrategies.set('project_metrics', {
            verifyFunction: async (claim) => {
                // Verify against project data
                try {
                    const response = await fetch('data/base-cv.json');
                    const data = await response.json();
                    return this.verifyAgainstProjectData(claim, data);
                } catch {
                    return { verified: false, reason: 'Unable to load project data' };
                }
            }
        });
    }

    /**
     * Load content sources for analysis
     */
    async loadContentSources() {
        const sources = [
            { name: 'base_cv', url: 'data/base-cv.json' },
            { name: 'ai_enhancements', url: 'data/ai-enhancements.json' },
            { name: 'activity_summary', url: 'data/activity-summary.json' }
        ];

        for (const source of sources) {
            try {
                const response = await fetch(source.url);
                if (response.ok) {
                    const data = await response.json();
                    this.contentSources.set(source.name, data);
                }
            } catch (error) {
                console.warn(`Failed to load ${source.name}:`, error);
            }
        }
    }

    /**
     * Analyze content for issues using AI hallucination detection results
     */
    async analyzeContent(validationReport) {
        const issues = [];
        
        // Process flagged content from validation report
        if (validationReport.flagged_content) {
            for (const flaggedItem of validationReport.flagged_content) {
                if (flaggedItem.type === 'impossible_claims') {
                    for (const claim of flaggedItem.claims) {
                        issues.push({
                            type: 'fabricated_metrics',
                            content: claim.claim,
                            severity: this.mapSeverity(claim.severity),
                            source: 'ai_hallucination_detection',
                            category: claim.category
                        });
                    }
                }
            }
        }

        // Analyze AI-enhanced content for additional issues
        const aiEnhancements = this.contentSources.get('ai_enhancements');
        if (aiEnhancements) {
            issues.push(...this.analyzeAIEnhancements(aiEnhancements));
        }

        return issues;
    }

    /**
     * Analyze AI enhancements for content quality issues
     */
    analyzeAIEnhancements(aiEnhancements) {
        const issues = [];
        
        // Check professional summary
        if (aiEnhancements.professional_summary?.enhanced) {
            const enhanced = aiEnhancements.professional_summary.enhanced;
            issues.push(...this.checkContentAgainstRules(enhanced, 'professional_summary'));
        }

        // Check other enhanced sections
        const sectionsToCheck = ['skills_enhancement', 'experience_enhancement', 'projects_enhancement'];
        for (const section of sectionsToCheck) {
            if (aiEnhancements[section]?.enhanced) {
                issues.push(...this.checkContentAgainstRules(aiEnhancements[section].enhanced, section));
            }
        }

        return issues;
    }

    /**
     * Check content against remediation rules
     */
    checkContentAgainstRules(content, section) {
        const issues = [];
        
        for (const [ruleType, rule] of this.remediationRules) {
            for (const pattern of rule.patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        issues.push({
                            type: ruleType,
                            content: match,
                            context: this.extractContext(content, match),
                            severity: rule.severity,
                            source: section,
                            action: rule.action,
                            replacement: this.suggestReplacement(match, rule.replacements)
                        });
                    }
                }
            }
        }
        
        return issues;
    }

    /**
     * Remediate identified content issues
     */
    async remediateContent(issues) {
        const remediationResults = {
            processed: 0,
            remediated: 0,
            skipped: 0,
            errors: 0,
            changes: []
        };

        for (const issue of issues) {
            try {
                const result = await this.processIssue(issue);
                remediationResults.processed++;
                
                if (result.remediated) {
                    remediationResults.remediated++;
                    remediationResults.changes.push(result);
                } else {
                    remediationResults.skipped++;
                }
                
            } catch (error) {
                console.error(`Error processing issue:`, error);
                remediationResults.errors++;
            }
        }

        return remediationResults;
    }

    /**
     * Process individual content issue
     */
    async processIssue(issue) {
        const result = {
            issue: issue,
            remediated: false,
            action_taken: 'none',
            original_content: issue.content,
            remediated_content: null,
            verification_result: null
        };

        switch (issue.action) {
            case 'replace_with_verified':
                const verification = await this.verifyContent(issue);
                result.verification_result = verification;
                
                if (!verification.verified) {
                    result.remediated_content = issue.replacement || this.createGenericReplacement(issue);
                    result.action_taken = 'replaced_unverified';
                    result.remediated = true;
                }
                break;

            case 'replace_with_specific':
                result.remediated_content = issue.replacement;
                result.action_taken = 'replaced_generic';
                result.remediated = true;
                break;

            case 'remove_or_verify':
                const verifyResult = await this.verifyContent(issue);
                result.verification_result = verifyResult;
                
                if (!verifyResult.verified) {
                    result.remediated_content = '';
                    result.action_taken = 'removed_unverified';
                    result.remediated = true;
                }
                break;

            case 'replace_with_neutral':
                result.remediated_content = issue.replacement;
                result.action_taken = 'neutralized';
                result.remediated = true;
                break;
        }

        return result;
    }

    /**
     * Verify content against available data sources
     */
    async verifyContent(issue) {
        // Attempt verification using appropriate strategy
        for (const [strategyName, strategy] of this.verificationStrategies) {
            try {
                const result = await strategy.verifyFunction(issue.content);
                if (result.verified !== undefined) {
                    return {
                        verified: result.verified,
                        strategy: strategyName,
                        reason: result.reason,
                        evidence: result.evidence
                    };
                }
            } catch (error) {
                console.warn(`Verification strategy ${strategyName} failed:`, error);
            }
        }

        return {
            verified: false,
            strategy: 'none',
            reason: 'No verification strategy available',
            confidence: 0
        };
    }

    /**
     * Generate remediation report
     */
    generateRemediationReport(issues, remediationResults) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_issues: issues.length,
                high_severity: issues.filter(i => i.severity === 'high').length,
                medium_severity: issues.filter(i => i.severity === 'medium').length,
                low_severity: issues.filter(i => i.severity === 'low').length,
                processed: remediationResults.processed,
                remediated: remediationResults.remediated,
                success_rate: Math.round((remediationResults.remediated / remediationResults.processed) * 100)
            },
            issues_by_type: this.groupIssuesByType(issues),
            remediation_changes: remediationResults.changes,
            content_quality_score: this.calculateContentQualityScore(issues, remediationResults),
            recommendations: this.generateRecommendations(issues, remediationResults)
        };

        return report;
    }

    /**
     * Generate clean, verified content
     */
    generateCleanContent() {
        const baseCv = this.contentSources.get('base_cv');
        if (!baseCv) return null;

        return {
            professional_summary: this.createCleanProfessionalSummary(baseCv),
            experience: this.createCleanExperience(baseCv),
            projects: this.createCleanProjects(baseCv),
            achievements: this.createCleanAchievements(baseCv)
        };
    }

    /**
     * Create clean professional summary based on verified information
     */
    createCleanProfessionalSummary(cvData) {
        const personalInfo = cvData.personal_info;
        const experience = cvData.experience;
        const skills = cvData.skills;

        return `${personalInfo.title} with ${this.calculateYearsOfExperience(experience)} years of experience in systems analysis, software development, and AI implementation. Based in ${personalInfo.location}, I specialize in systems integration, cybersecurity, and automation solutions for government and enterprise environments. My expertise spans the full development lifecycle, from requirements analysis to production deployment, with a focus on creating reliable, secure, and efficient systems that serve vulnerable communities and complex organizational needs.`;
    }

    /**
     * Create clean experience descriptions without fabricated metrics
     */
    createCleanExperience(cvData) {
        return cvData.experience.map(role => ({
            ...role,
            achievements: role.achievements.map(achievement => 
                this.cleanAchievementText(achievement)
            )
        }));
    }

    /**
     * Create clean project descriptions
     */
    createCleanProjects(cvData) {
        return cvData.projects.map(project => ({
            ...project,
            description: this.cleanProjectDescription(project.description),
            detailed_description: project.detailed_description ? 
                this.cleanProjectDescription(project.detailed_description) : null
        }));
    }

    /**
     * Create clean achievements without unverifiable claims
     */
    createCleanAchievements(cvData) {
        return cvData.achievements.map(achievement => ({
            ...achievement,
            description: this.cleanAchievementText(achievement.description)
        }));
    }

    /**
     * Clean achievement text by removing fabricated metrics
     */
    cleanAchievementText(text) {
        let cleaned = text;
        
        // Remove specific fabricated metrics patterns
        cleaned = cleaned.replace(/increased operational efficiency by.*?\d+%/gi, 'improved operational efficiency');
        cleaned = cleaned.replace(/reduced decision-making latency by.*?\d+%/gi, 'streamlined decision-making processes');
        cleaned = cleaned.replace(/achieved.*?\d+%.*?success rate/gi, 'achieved strong results');
        cleaned = cleaned.replace(/delivered.*?\d+x.*?improvement/gi, 'delivered significant improvements');
        
        // Remove generic AI language
        cleaned = cleaned.replace(/seamlessly integrat(?:ed?|ing)/gi, 'integrated');
        cleaned = cleaned.replace(/cutting-edge/gi, 'modern');
        cleaned = cleaned.replace(/state-of-the-art/gi, 'advanced');
        
        return cleaned.trim();
    }

    /**
     * Clean project description text
     */
    cleanProjectDescription(text) {
        return this.cleanAchievementText(text);
    }

    /**
     * Helper methods
     */
    calculateYearsOfExperience(experience) {
        const currentYear = new Date().getFullYear();
        const earliestYear = Math.min(...experience.map(role => {
            const startYear = parseInt(role.period.split(' - ')[0]);
            return isNaN(startYear) ? currentYear : startYear;
        }));
        return currentYear - earliestYear;
    }

    extractContext(content, match) {
        const index = content.indexOf(match);
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + match.length + 50);
        return content.substring(start, end);
    }

    suggestReplacement(match, replacements) {
        for (const [pattern, replacement] of Object.entries(replacements)) {
            if (match.toLowerCase().includes(pattern.toLowerCase())) {
                return replacement;
            }
        }
        return null;
    }

    createGenericReplacement(issue) {
        return 'professional implementation and optimization';
    }

    mapSeverity(severity) {
        const mapping = { 'low': 'medium', 'medium': 'medium', 'high': 'high' };
        return mapping[severity] || 'medium';
    }

    groupIssuesByType(issues) {
        const grouped = {};
        for (const issue of issues) {
            if (!grouped[issue.type]) grouped[issue.type] = [];
            grouped[issue.type].push(issue);
        }
        return grouped;
    }

    calculateContentQualityScore(issues, results) {
        const totalWeight = issues.length;
        if (totalWeight === 0) return 100;
        
        const severityWeights = { high: 3, medium: 2, low: 1 };
        const weightedIssues = issues.reduce((sum, issue) => 
            sum + (severityWeights[issue.severity] || 1), 0);
        
        const baseScore = 100 - (weightedIssues / totalWeight * 20);
        const remediationBonus = (results.remediated / results.processed) * 10;
        
        return Math.min(100, Math.max(0, baseScore + remediationBonus));
    }

    generateRecommendations(issues, results) {
        const recommendations = [];
        
        if (issues.filter(i => i.type === 'fabricated_metrics').length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'content_accuracy',
                message: 'Replace fabricated performance metrics with verified achievements',
                action: 'Use only verifiable accomplishments and measurable outcomes'
            });
        }
        
        if (issues.filter(i => i.type === 'generic_ai_language').length > 3) {
            recommendations.push({
                priority: 'medium',
                category: 'content_quality',
                message: 'Reduce generic AI language patterns',
                action: 'Use specific, concrete language over generic terms'
            });
        }
        
        if (results.success_rate < 80) {
            recommendations.push({
                priority: 'high',
                category: 'process_improvement',
                message: 'Improve content verification processes',
                action: 'Implement better verification strategies before content publication'
            });
        }
        
        return recommendations;
    }

    verifyAgainstGitHubData(claim, githubData) {
        // Implementation for GitHub data verification
        return { verified: false, reason: 'GitHub verification not implemented' };
    }

    verifyAgainstEmploymentHistory(claim, cvData) {
        // Implementation for employment verification
        return { verified: false, reason: 'Employment verification not implemented' };
    }

    verifyAgainstProjectData(claim, cvData) {
        // Implementation for project data verification
        return { verified: false, reason: 'Project verification not implemented' };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentRemediationSystem;
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.ContentRemediationSystem = ContentRemediationSystem;
}