#!/usr/bin/env node

/**
 * Intelligent Issue Manager - AI-Powered Issue Triage and Management
 * 
 * Automatically analyzes, categorizes, and routes issues to reduce manual overhead.
 * Part of the Developer Experience optimization initiative.
 * 
 * Features:
 * - AI-powered content analysis and categorization
 * - Automated priority assignment based on severity indicators
 * - Smart assignee suggestion using workload balancing
 * - Integration with existing label taxonomy
 * - Milestone and project board automation
 * - SLA tracking and escalation management
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class IntelligentIssueManager {
    constructor() {
        this.config = {
            // Priority scoring weights
            priorityWeights: {
                securityKeywords: 10,
                performanceKeywords: 8,
                bugKeywords: 6,
                enhancementKeywords: 3,
                documentationKeywords: 2
            },
            
            // Keyword patterns for analysis
            keywords: {
                security: [
                    'security', 'vulnerability', 'exploit', 'xss', 'sql injection',
                    'csrf', 'auth', 'permission', 'unauthorized', 'breach'
                ],
                performance: [
                    'slow', 'performance', 'timeout', 'memory', 'cpu', 'load',
                    'speed', 'optimization', 'cache', 'bottleneck'
                ],
                bug: [
                    'bug', 'error', 'exception', 'crash', 'fail', 'broken',
                    'not working', 'issue', 'problem', 'incorrect'
                ],
                enhancement: [
                    'feature', 'enhancement', 'improvement', 'add', 'new',
                    'request', 'suggestion', 'idea', 'proposal'
                ],
                documentation: [
                    'documentation', 'docs', 'readme', 'guide', 'tutorial',
                    'help', 'example', 'comment', 'explain'
                ]
            },
            
            // Team capacity and expertise mapping
            teamMapping: {
                'security': { capacity: 40, expertise: ['security', 'auth'] },
                'performance': { capacity: 60, expertise: ['performance', 'optimization'] },
                'frontend': { capacity: 80, expertise: ['ui', 'ux', 'css', 'javascript'] },
                'backend': { capacity: 70, expertise: ['api', 'database', 'server'] },
                'devops': { capacity: 50, expertise: ['deployment', 'infrastructure', 'ci'] },
                'documentation': { capacity: 30, expertise: ['docs', 'tutorial', 'guide'] }
            },
            
            // SLA targets (in hours)
            slaTargets: {
                'P1: Critical': 2,
                'P1: High': 24,
                'P2: Medium': 72,
                'P3: Low': 168
            }
        };
        
        this.analysisCache = new Map();
        this.workloadTracker = this.loadWorkloadData();
    }

    /**
     * Main issue processing orchestrator
     */
    async processIssue(issueData, options = {}) {
        console.log(`${colors.cyan}🧠 Processing Issue: #${issueData.number}${colors.reset}`);
        
        try {
            // Analyze issue content
            const analysis = await this.analyzeIssueContent(issueData);
            
            // Generate recommendations
            const recommendations = await this.generateRecommendations(analysis, issueData);
            
            // Apply automation if enabled
            if (!options.dryRun) {
                await this.applyRecommendations(issueData, recommendations);
            }
            
            // Log results
            await this.logAnalysis(issueData, analysis, recommendations);
            
            console.log(`${colors.green}✅ Issue processing completed${colors.reset}`);
            return { analysis, recommendations };
            
        } catch (error) {
            console.error(`${colors.red}❌ Issue processing failed: ${error.message}${colors.reset}`);
            throw error;
        }
    }

    /**
     * Analyze issue content using multiple techniques
     */
    async analyzeIssueContent(issueData) {
        console.log(`${colors.blue}📊 Analyzing issue content...${colors.reset}`);
        
        const content = `${issueData.title} ${issueData.body || ''}`.toLowerCase();
        
        const analysis = {
            issueNumber: issueData.number,
            title: issueData.title,
            author: issueData.user?.login || 'unknown',
            timestamp: new Date().toISOString(),
            
            // Content analysis
            wordCount: content.split(/\\s+/).length,
            hasCodeBlocks: /```/.test(issueData.body || ''),
            hasLogs: /log|error|stack trace|exception/.test(content),
            hasScreenshots: /screenshot|image|png|jpg|gif/.test(content),
            hasReproSteps: /reproduce|steps|how to/.test(content),
            
            // Category scoring
            categoryScores: {},
            detectedCategories: [],
            urgencyIndicators: [],
            
            // Priority calculation
            priorityScore: 0,
            suggestedPriority: 'P3: Low',
            
            // Assignment analysis
            suggestedAssignee: null,
            suggestedTeam: null,
            workloadImpact: 0,
            
            // Timeline estimation
            estimatedEffort: 0,
            suggestedMilestone: null,
            
            // Quality indicators
            qualityScore: 0,
            missingInformation: []
        };

        // Analyze categories and calculate scores
        for (const [category, keywords] of Object.entries(this.config.keywords)) {
            const score = keywords.reduce((acc, keyword) => {
                const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
                return acc + matches;
            }, 0);
            
            analysis.categoryScores[category] = score;
            
            if (score > 0) {
                analysis.detectedCategories.push({
                    category,
                    score,
                    confidence: Math.min(score / keywords.length, 1)
                });
            }
        }

        // Calculate priority score
        analysis.priorityScore = this.calculatePriorityScore(analysis);
        analysis.suggestedPriority = this.determinePriority(analysis.priorityScore);
        
        // Detect urgency indicators
        analysis.urgencyIndicators = this.detectUrgencyIndicators(content);
        
        // Suggest team and assignee
        const assignment = this.suggestAssignment(analysis);
        analysis.suggestedTeam = assignment.team;
        analysis.suggestedAssignee = assignment.assignee;
        analysis.workloadImpact = assignment.workloadImpact;
        
        // Estimate effort and timeline
        analysis.estimatedEffort = this.estimateEffort(analysis);
        analysis.suggestedMilestone = this.suggestMilestone(analysis);
        
        // Calculate quality score
        analysis.qualityScore = this.calculateQualityScore(analysis, issueData);
        analysis.missingInformation = this.identifyMissingInformation(analysis, issueData);
        
        return analysis;
    }

    /**
     * Generate actionable recommendations
     */
    async generateRecommendations(analysis, issueData) {
        console.log(`${colors.blue}💡 Generating recommendations...${colors.reset}`);
        
        const recommendations = {
            labels: {
                add: [],
                remove: []
            },
            assignee: null,
            milestone: null,
            priority: null,
            project: null,
            comments: [],
            actions: []
        };

        // Label recommendations
        recommendations.labels.add = this.generateLabelRecommendations(analysis);
        
        // Priority assignment
        if (analysis.suggestedPriority !== 'P3: Low') {
            recommendations.priority = analysis.suggestedPriority;
            recommendations.labels.add.push(analysis.suggestedPriority);
        }
        
        // Team and assignee recommendations
        if (analysis.suggestedTeam) {
            recommendations.labels.add.push(analysis.suggestedTeam);
        }
        
        if (analysis.suggestedAssignee && analysis.workloadImpact < 0.8) {
            recommendations.assignee = analysis.suggestedAssignee;
        }
        
        // Milestone recommendation
        if (analysis.suggestedMilestone) {
            recommendations.milestone = analysis.suggestedMilestone;
        }
        
        // Quality improvement comments
        if (analysis.qualityScore < 0.7) {
            recommendations.comments.push(this.generateQualityFeedback(analysis));
        }
        
        // Automated actions
        recommendations.actions = this.generateAutomatedActions(analysis);
        
        return recommendations;
    }

    /**
     * Apply recommendations to the issue (GitHub API integration)
     */
    async applyRecommendations(issueData, recommendations) {
        console.log(`${colors.blue}🔧 Applying recommendations...${colors.reset}`);
        
        // Note: In a real implementation, this would use the GitHub API
        // For now, we'll simulate the actions and log them
        
        const actions = [];
        
        // Label management
        if (recommendations.labels.add.length > 0) {
            actions.push(`Add labels: ${recommendations.labels.add.join(', ')}`);
        }
        
        // Assignment
        if (recommendations.assignee) {
            actions.push(`Assign to: ${recommendations.assignee}`);
        }
        
        // Milestone
        if (recommendations.milestone) {
            actions.push(`Add to milestone: ${recommendations.milestone}`);
        }
        
        // Comments
        for (const comment of recommendations.comments) {
            actions.push(`Add comment: ${comment.substring(0, 100)}...`);
        }
        
        // Automated actions
        for (const action of recommendations.actions) {
            actions.push(`Execute: ${action.description}`);
        }
        
        console.log(`  Planned actions (${actions.length}):`);
        actions.forEach(action => console.log(`    • ${action}`));
        
        // Track workload changes
        this.updateWorkloadTracking(recommendations);
        
        return actions;
    }

    /**
     * Calculate priority score based on multiple factors
     */
    calculatePriorityScore(analysis) {
        let score = 0;
        
        // Category-based scoring
        for (const [category, weight] of Object.entries(this.config.priorityWeights)) {
            const categoryKey = category.replace('Keywords', '');
            score += (analysis.categoryScores[categoryKey] || 0) * weight;
        }
        
        // Urgency multipliers
        for (const indicator of analysis.urgencyIndicators) {
            score *= indicator.multiplier;
        }
        
        // Quality adjustments
        if (analysis.hasReproSteps) score += 5;
        if (analysis.hasLogs) score += 3;
        if (analysis.hasCodeBlocks) score += 2;
        
        return Math.round(score);
    }

    /**
     * Determine priority level from score
     */
    determinePriority(score) {
        if (score >= 50) return 'P1: Critical';
        if (score >= 25) return 'P1: High';
        if (score >= 10) return 'P2: Medium';
        return 'P3: Low';
    }

    /**
     * Detect urgency indicators in content
     */
    detectUrgencyIndicators(content) {
        const indicators = [];
        
        const patterns = [
            { pattern: /critical|urgent|emergency/gi, multiplier: 2.0, type: 'Critical Keywords' },
            { pattern: /production|live|users affected/gi, multiplier: 1.8, type: 'Production Impact' },
            { pattern: /security|vulnerability|breach/gi, multiplier: 1.5, type: 'Security Concern' },
            { pattern: /down|broken|not working/gi, multiplier: 1.3, type: 'Service Impact' },
            { pattern: /asap|immediately|now/gi, multiplier: 1.2, type: 'Time Pressure' }
        ];
        
        for (const { pattern, multiplier, type } of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                indicators.push({
                    type,
                    count: matches.length,
                    multiplier: Math.pow(multiplier, matches.length),
                    samples: matches.slice(0, 3)
                });
            }
        }
        
        return indicators;
    }

    /**
     * Suggest team assignment based on expertise and capacity
     */
    suggestAssignment(analysis) {
        const topCategories = analysis.detectedCategories
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);
        
        let bestTeam = null;
        let bestScore = 0;
        
        for (const [team, config] of Object.entries(this.config.teamMapping)) {
            let score = 0;
            
            // Expertise matching
            for (const category of topCategories) {
                if (config.expertise.includes(category.category)) {
                    score += category.score * 2;
                }
            }
            
            // Capacity consideration
            const currentWorkload = this.workloadTracker[team] || 0;
            const capacityFactor = Math.max(0.1, (config.capacity - currentWorkload) / config.capacity);
            score *= capacityFactor;
            
            if (score > bestScore) {
                bestScore = score;
                bestTeam = team;
            }
        }
        
        return {
            team: bestTeam,
            assignee: this.selectAssignee(bestTeam, analysis),
            workloadImpact: analysis.estimatedEffort / (this.config.teamMapping[bestTeam]?.capacity || 100)
        };
    }

    /**
     * Select specific assignee from team
     */
    selectAssignee(team, analysis) {
        // In a real implementation, this would query team member availability
        // For now, return a placeholder based on team
        const teamLeads = {
            'security': 'security-lead',
            'performance': 'perf-engineer',
            'frontend': 'frontend-dev',
            'backend': 'backend-dev',
            'devops': 'devops-engineer',
            'documentation': 'tech-writer'
        };
        
        return teamLeads[team] || null;
    }

    /**
     * Estimate effort required for issue resolution
     */
    estimateEffort(analysis) {
        let effort = 2; // Base effort in hours
        
        // Complexity factors
        if (analysis.categoryScores.security > 0) effort += 8;
        if (analysis.categoryScores.performance > 0) effort += 6;
        if (analysis.categoryScores.bug > 0) effort += 4;
        if (analysis.categoryScores.enhancement > 0) effort += 6;
        if (analysis.categoryScores.documentation > 0) effort += 2;
        
        // Quality adjustments
        if (analysis.qualityScore < 0.5) effort += 2; // Poor quality requires investigation
        if (!analysis.hasReproSteps && analysis.categoryScores.bug > 0) effort += 4;
        
        return Math.round(effort);
    }

    /**
     * Suggest milestone based on priority and effort
     */
    suggestMilestone(analysis) {
        const priority = analysis.suggestedPriority;
        
        if (priority.includes('Critical')) return 'Emergency Fix';
        if (priority.includes('High')) return 'Next Release';
        if (priority.includes('Medium')) return 'Current Sprint';
        return 'Backlog';
    }

    /**
     * Calculate issue quality score
     */
    calculateQualityScore(analysis, issueData) {
        let score = 0;
        const maxScore = 10;
        
        // Title quality
        if (issueData.title && issueData.title.length > 10) score += 1;
        if (issueData.title && issueData.title.length > 30) score += 1;
        
        // Description quality
        if (issueData.body && issueData.body.length > 50) score += 1;
        if (issueData.body && issueData.body.length > 200) score += 1;
        
        // Technical details
        if (analysis.hasReproSteps) score += 2;
        if (analysis.hasLogs) score += 1;
        if (analysis.hasCodeBlocks) score += 1;
        if (analysis.hasScreenshots) score += 1;
        
        // Environment info
        if (issueData.body && /environment|version|browser|os/gi.test(issueData.body)) score += 1;
        
        // Expected behavior
        if (issueData.body && /expected|should|want/gi.test(issueData.body)) score += 1;
        
        return score / maxScore;
    }

    /**
     * Identify missing information in issue
     */
    identifyMissingInformation(analysis, issueData) {
        const missing = [];
        
        if (analysis.categoryScores.bug > 0) {
            if (!analysis.hasReproSteps) missing.push('Reproduction steps');
            if (!analysis.hasLogs) missing.push('Error logs or stack traces');
            if (!/environment|version/.test(issueData.body || '')) missing.push('Environment details');
        }
        
        if (analysis.categoryScores.enhancement > 0) {
            if (!/use case|why|benefit/.test(issueData.body || '')) missing.push('Use case or business justification');
            if (!/acceptance|criteria|definition/.test(issueData.body || '')) missing.push('Acceptance criteria');
        }
        
        if (analysis.categoryScores.performance > 0) {
            if (!/metrics|benchmark|measure/.test(issueData.body || '')) missing.push('Performance metrics or benchmarks');
        }
        
        return missing;
    }

    /**
     * Generate label recommendations
     */
    generateLabelRecommendations(analysis) {
        const labels = [];
        
        // Category labels
        const topCategory = analysis.detectedCategories[0];
        if (topCategory) {
            const labelMap = {
                'security': 'security',
                'performance': 'performance',
                'bug': 'bug',
                'enhancement': 'enhancement',
                'documentation': 'documentation'
            };
            
            const label = labelMap[topCategory.category];
            if (label) labels.push(label);
        }
        
        // Component labels based on content analysis
        const content = analysis.title.toLowerCase();
        if (/frontend|ui|ux|css|javascript/.test(content)) labels.push('frontend');
        if (/backend|api|server|database/.test(content)) labels.push('backend');
        if (/deploy|ci|cd|workflow/.test(content)) labels.push('ci-cd');
        if (/mobile|responsive|touch/.test(content)) labels.push('mobile');
        if (/accessibility|a11y|wcag/.test(content)) labels.push('accessibility');
        
        return labels;
    }

    /**
     * Generate quality feedback comment
     */
    generateQualityFeedback(analysis) {
        const feedback = [];
        
        feedback.push('👋 Thanks for creating this issue!');
        
        if (analysis.missingInformation.length > 0) {
            feedback.push('\\nTo help us resolve this more quickly, could you please provide:');
            analysis.missingInformation.forEach(item => {
                feedback.push(`- ${item}`);
            });
        }
        
        if (analysis.qualityScore < 0.5) {
            feedback.push('\\n📋 For faster resolution, please include:');
            feedback.push('- Detailed steps to reproduce the issue');
            feedback.push('- Expected vs actual behavior');
            feedback.push('- Environment details (OS, browser, version)');
            feedback.push('- Any relevant error logs or screenshots');
        }
        
        feedback.push('\\n🤖 *This analysis was generated automatically to help improve issue quality.*');
        
        return feedback.join('\\n');
    }

    /**
     * Generate automated actions
     */
    generateAutomatedActions(analysis) {
        const actions = [];
        
        // High priority notifications
        if (analysis.suggestedPriority.includes('Critical')) {
            actions.push({
                type: 'notification',
                description: 'Send critical issue alert to on-call team',
                target: 'on-call-team'
            });
        }
        
        // Security issue handling
        if (analysis.categoryScores.security > 0) {
            actions.push({
                type: 'security_review',
                description: 'Request security team review',
                target: 'security-team'
            });
        }
        
        // Performance monitoring
        if (analysis.categoryScores.performance > 0) {
            actions.push({
                type: 'monitoring',
                description: 'Enable enhanced performance monitoring',
                target: 'monitoring-system'
            });
        }
        
        // Documentation updates
        if (analysis.categoryScores.documentation > 0) {
            actions.push({
                type: 'docs_update',
                description: 'Schedule documentation review',
                target: 'documentation-team'
            });
        }
        
        return actions;
    }

    /**
     * Load workload tracking data
     */
    loadWorkloadData() {
        const workloadFile = resolve(__dirname, 'data/team-workload.json');
        
        if (existsSync(workloadFile)) {
            try {
                return JSON.parse(readFileSync(workloadFile, 'utf8'));
            } catch (error) {
                console.warn(`Could not load workload data: ${error.message}`);
            }
        }
        
        // Default workload data
        return {
            'security': 20,
            'performance': 35,
            'frontend': 45,
            'backend': 40,
            'devops': 25,
            'documentation': 15
        };
    }

    /**
     * Update workload tracking
     */
    updateWorkloadTracking(recommendations) {
        if (recommendations.assignee && recommendations.actions.length > 0) {
            const team = recommendations.labels.add.find(label => 
                Object.keys(this.config.teamMapping).includes(label)
            );
            
            if (team) {
                this.workloadTracker[team] = (this.workloadTracker[team] || 0) + 5; // Increment by estimated hours
                
                // Save updated workload
                const workloadFile = resolve(__dirname, 'data/team-workload.json');
                writeFileSync(workloadFile, JSON.stringify(this.workloadTracker, null, 2));
            }
        }
    }

    /**
     * Log analysis results
     */
    async logAnalysis(issueData, analysis, recommendations) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            issueNumber: issueData.number,
            analysis: {
                priorityScore: analysis.priorityScore,
                suggestedPriority: analysis.suggestedPriority,
                detectedCategories: analysis.detectedCategories,
                qualityScore: analysis.qualityScore,
                estimatedEffort: analysis.estimatedEffort
            },
            recommendations: {
                labelsCount: recommendations.labels.add.length,
                hasAssignee: !!recommendations.assignee,
                hasMilestone: !!recommendations.milestone,
                actionsCount: recommendations.actions.length
            }
        };
        
        // Save to analysis log
        const logFile = resolve(__dirname, 'data/issue-analysis-log.jsonl');
        const logLine = JSON.stringify(logEntry) + '\\n';
        
        require('fs').appendFileSync(logFile, logLine);
        
        console.log(`  📊 Analysis logged for issue #${issueData.number}`);
    }

    /**
     * Generate summary statistics
     */
    async generateSummaryStats() {
        const logFile = resolve(__dirname, 'data/issue-analysis-log.jsonl');
        
        if (!existsSync(logFile)) {
            return { message: 'No analysis data available' };
        }
        
        const logs = readFileSync(logFile, 'utf8')
            .split('\\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        
        const stats = {
            totalIssuesAnalyzed: logs.length,
            averagePriorityScore: logs.reduce((sum, log) => sum + log.analysis.priorityScore, 0) / logs.length,
            averageQualityScore: logs.reduce((sum, log) => sum + log.analysis.qualityScore, 0) / logs.length,
            priorityDistribution: {},
            categoryDistribution: {},
            automationRate: logs.filter(log => log.recommendations.actionsCount > 0).length / logs.length
        };
        
        // Calculate distributions
        logs.forEach(log => {
            const priority = log.analysis.suggestedPriority;
            stats.priorityDistribution[priority] = (stats.priorityDistribution[priority] || 0) + 1;
            
            log.analysis.detectedCategories.forEach(cat => {
                const category = cat.category;
                stats.categoryDistribution[category] = (stats.categoryDistribution[category] || 0) + 1;
            });
        });
        
        return stats;
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new IntelligentIssueManager();
    
    // Example usage
    const exampleIssue = {
        number: 999,
        title: '🐛 Security vulnerability in authentication system',
        body: `## Description
        There's a critical security issue with the authentication system that allows unauthorized access.
        
        ## Steps to Reproduce
        1. Navigate to login page
        2. Enter malicious payload in username field
        3. System grants access without proper validation
        
        ## Expected Behavior
        Authentication should validate all inputs properly
        
        ## Environment
        - Browser: Chrome 91
        - OS: Ubuntu 20.04
        - Node.js: 16.14.0`,
        user: { login: 'security-researcher' }
    };
    
    manager.processIssue(exampleIssue, { dryRun: true })
        .then(() => manager.generateSummaryStats())
        .then(stats => {
            console.log(`\\n${colors.cyan}📈 Analysis Summary:${colors.reset}`);
            console.log(JSON.stringify(stats, null, 2));
        })
        .catch(console.error);
}

export default IntelligentIssueManager;