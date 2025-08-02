#!/usr/bin/env node

/**
 * Simple PR Failure Analysis
 * 
 * Analyzes GitHub CI failures without requiring Claude authentication
 * Provides structured analysis and recommendations based on common patterns.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const { execSync } = require('child_process');

/**
 * Simple PR failure analyzer
 */
class PRFailureAnalyzer {
    constructor() {
        this.commonFailures = {
            'markdown-link-check': {
                type: 'Link Validation',
                description: 'Broken or unreachable links in documentation',
                solutions: [
                    'Check for 404 links in markdown files',
                    'Update staging URLs to production URLs',
                    'Fix typos in link references',
                    'Remove or replace dead external links'
                ]
            },
            'accessibility': {
                type: 'WCAG Compliance',
                description: 'Accessibility standards violations',
                solutions: [
                    'Add missing ARIA labels and roles',
                    'Ensure proper color contrast ratios',
                    'Add alt text to images',
                    'Verify keyboard navigation works',
                    'Check focus indicators are visible'
                ]
            },
            'cross-browser': {
                type: 'Browser Compatibility',
                description: 'Code doesn\'t work across all browsers',
                solutions: [
                    'Check for modern JS features needing polyfills',
                    'Verify CSS works in Safari/Firefox/Chrome',
                    'Test browser-specific DOM APIs',
                    'Add vendor prefixes if needed'
                ]
            },
            'mobile': {
                type: 'Mobile Responsiveness',
                description: 'Mobile display or interaction issues',
                solutions: [
                    'Check responsive CSS breakpoints',
                    'Verify touch targets are 44px minimum',
                    'Test mobile navigation and modals',
                    'Ensure text is readable on small screens'
                ]
            },
            'dashboard': {
                type: 'Dashboard Functionality',
                description: 'Dashboard features not working properly',
                solutions: [
                    'Check JavaScript console for errors',
                    'Verify data loading and API calls',
                    'Test chart rendering and interactions',
                    'Ensure mobile dashboard functionality'
                ]
            },
            'performance': {
                type: 'Performance Issues',
                description: 'Page load time or Core Web Vitals failures',
                solutions: [
                    'Optimize image sizes and formats',
                    'Minimize JavaScript bundles',
                    'Check for slow API calls',
                    'Verify page load times under 3 seconds'
                ]
            }
        };
    }

    /**
     * Get PR information and failing checks
     */
    async analyzePR(prNumber) {
        try {
            console.log(`🔍 Analyzing PR #${prNumber}...`);
            
            const prData = JSON.parse(execSync(
                `gh pr view ${prNumber} --json title,body,state,url,mergeable,statusCheckRollup,headRefName,baseRefName`,
                { encoding: 'utf8' }
            ));

            // Get failing checks
            const failingChecks = prData.statusCheckRollup.filter(
                check => check.conclusion === 'FAILURE'
            );

            const analysis = {
                pr: {
                    number: prNumber,
                    title: prData.title,
                    branch: `${prData.headRefName} → ${prData.baseRefName}`,
                    url: prData.url,
                    mergeable: prData.mergeable
                },
                failing: failingChecks.length,
                checks: failingChecks.map(check => ({
                    name: check.name,
                    conclusion: check.conclusion,
                    url: check.detailsUrl,
                    category: this.categorizeFailure(check.name)
                })),
                recommendations: this.generateRecommendations(failingChecks),
                autoMergeReady: failingChecks.length === 0
            };

            return analysis;

        } catch (error) {
            throw new Error(`Failed to analyze PR #${prNumber}: ${error.message}`);
        }
    }

    /**
     * Categorize failure type
     */
    categorizeFailure(checkName) {
        const name = checkName.toLowerCase();
        
        if (name.includes('markdown') || name.includes('link')) return 'markdown-link-check';
        if (name.includes('accessibility') || name.includes('wcag')) return 'accessibility';
        if (name.includes('cross-browser') || name.includes('browser')) return 'cross-browser';
        if (name.includes('mobile') || name.includes('responsive')) return 'mobile';
        if (name.includes('dashboard')) return 'dashboard';
        if (name.includes('performance') || name.includes('vitals')) return 'performance';
        
        return 'other';
    }

    /**
     * Generate recommendations based on failure patterns
     */
    generateRecommendations(failingChecks) {
        const recommendations = [];
        const categories = new Set();

        failingChecks.forEach(check => {
            const category = this.categorizeFailure(check.name);
            categories.add(category);
        });

        categories.forEach(category => {
            const pattern = this.commonFailures[category];
            if (pattern) {
                recommendations.push({
                    category: pattern.type,
                    description: pattern.description,
                    solutions: pattern.solutions,
                    priority: this.getPriority(category)
                });
            }
        });

        return recommendations.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get priority for different failure types
     */
    getPriority(category) {
        const priorities = {
            'markdown-link-check': 1, // Easy fix
            'dashboard': 2,           // Important functionality
            'mobile': 3,             // User experience
            'accessibility': 4,       // Important but complex
            'cross-browser': 5,      // Complex compatibility
            'performance': 6         // Optimization
        };
        return priorities[category] || 10;
    }

    /**
     * Generate detailed report
     */
    generateReport(analysis) {
        console.log(`\n📊 **PR #${analysis.pr.number} ANALYSIS REPORT**\n`);
        
        console.log(`**Title**: ${analysis.pr.title}`);
        console.log(`**Branch**: ${analysis.pr.branch}`);
        console.log(`**URL**: ${analysis.pr.url}`);
        console.log(`**Mergeable**: ${analysis.pr.mergeable ? '✅ Yes' : '❌ No'}`);
        console.log(`**Status**: ${analysis.autoMergeReady ? '✅ Ready to merge' : `❌ ${analysis.failing} failing checks`}\n`);

        if (analysis.failing === 0) {
            console.log('🎉 **All checks passing!** This PR is ready for automatic merge.\n');
            return;
        }

        console.log(`🚨 **FAILING CHECKS (${analysis.failing})**\n`);
        analysis.checks.forEach(check => {
            console.log(`❌ **${check.name}**`);
            console.log(`   Category: ${this.commonFailures[check.category]?.type || 'Other'}`);
            console.log(`   Details: ${check.url}\n`);
        });

        console.log(`🛠️ **RECOMMENDATIONS** (Priority Order)\n`);
        analysis.recommendations.forEach((rec, index) => {
            console.log(`**${index + 1}. ${rec.category}**`);
            console.log(`   ${rec.description}\n`);
            console.log(`   **Actions to take:**`);
            rec.solutions.forEach(solution => {
                console.log(`   - ${solution}`);
            });
            console.log('');
        });

        console.log(`🎯 **NEXT STEPS**\n`);
        console.log(`1. **Fix Priority 1 Issues**: Start with ${analysis.recommendations[0]?.category || 'first category'}`);
        console.log(`2. **Test Locally**: Verify fixes work before pushing`);
        console.log(`3. **Push Changes**: CI will re-run automatically`);
        console.log(`4. **Monitor CI**: Wait for all checks to pass`);
        console.log(`5. **Auto-Merge**: PR will merge automatically when ready\n`);
    }

    /**
     * Post GitHub comment with analysis
     */
    async postAnalysisComment(prNumber, analysis) {
        const comment = this.buildComment(analysis);
        
        try {
            execSync(
                `gh pr comment ${prNumber} --body "${comment.replace(/"/g, '\\"')}"`,
                { encoding: 'utf8' }
            );
            console.log(`💬 Posted analysis comment to PR #${prNumber}`);
        } catch (error) {
            console.error(`❌ Failed to post comment: ${error.message}`);
        }
    }

    /**
     * Build GitHub comment
     */
    buildComment(analysis) {
        if (analysis.autoMergeReady) {
            return `🎉 **Automated Analysis: Ready to Merge**

All CI checks are passing! This PR is ready for automatic merge.

**Status**: ✅ Ready
**Failing Checks**: 0

---
🤖 *Automated analysis by PR Failure Analyzer*`;
        }

        const failingChecks = analysis.checks.map(check => 
            `- ❌ **${check.name}**: [View Details](${check.url})`
        ).join('\n');

        const recommendations = analysis.recommendations.map((rec, index) => 
            `**${index + 1}. ${rec.category}**
   ${rec.description}
   
   Actions to take:
${rec.solutions.map(s => `   - ${s}`).join('\n')}`
        ).join('\n\n');

        return `🔍 **Automated PR Analysis**

## 🚨 Failing Checks (${analysis.failing})

${failingChecks}

## 🛠️ Fix Recommendations (Priority Order)

${recommendations}

## 🎯 Next Steps

1. **Fix Priority 1 Issues**: Start with ${analysis.recommendations[0]?.category || 'first category'}
2. **Test Locally**: Verify fixes work before pushing
3. **Push Changes**: CI will re-run automatically  
4. **Monitor CI**: Wait for all checks to pass
5. **Auto-Merge**: PR will merge automatically when ready

**Auto-Merge Status**: ❌ Blocked (${analysis.failing} failing checks)

---
🤖 *Automated analysis by PR Failure Analyzer*`;
    }
}

/**
 * CLI interface
 */
async function main() {
    const command = process.argv[2];
    const prNumbers = process.argv.slice(3).map(n => parseInt(n)).filter(n => n > 0);
    
    const analyzer = new PRFailureAnalyzer();
    
    try {
        switch (command) {
            case 'analyze':
                if (prNumbers.length === 0) {
                    console.error('❌ Usage: node analyze-pr-failures.js analyze <pr_number> [pr_number2] ...');
                    process.exit(1);
                }
                
                for (const prNumber of prNumbers) {
                    const analysis = await analyzer.analyzePR(prNumber);
                    analyzer.generateReport(analysis);
                    await analyzer.postAnalysisComment(prNumber, analysis);
                    
                    if (prNumbers.length > 1) {
                        console.log('─'.repeat(80));
                    }
                }
                break;
                
            case 'check':
                if (prNumbers.length !== 1) {
                    console.error('❌ Usage: node analyze-pr-failures.js check <pr_number>');
                    process.exit(1);
                }
                
                const analysis = await analyzer.analyzePR(prNumbers[0]);
                analyzer.generateReport(analysis);
                break;
                
            case 'summary':
                if (prNumbers.length === 0) {
                    console.error('❌ Usage: node analyze-pr-failures.js summary <pr_number> [pr_number2] ...');
                    process.exit(1);
                }
                
                console.log('📊 **MULTI-PR SUMMARY**\n');
                let readyCount = 0;
                let blockedCount = 0;
                
                for (const prNumber of prNumbers) {
                    const analysis = await analyzer.analyzePR(prNumber);
                    if (analysis.autoMergeReady) {
                        console.log(`✅ PR #${prNumber}: Ready to merge`);
                        readyCount++;
                    } else {
                        console.log(`❌ PR #${prNumber}: ${analysis.failing} failing checks`);
                        blockedCount++;
                    }
                }
                
                console.log(`\n🎯 **SUMMARY**: ${readyCount} ready, ${blockedCount} blocked`);
                break;
                
            default:
                console.log('🔍 **PR FAILURE ANALYZER**\n');
                console.log('Simple analysis of pull request CI failures\n');
                console.log('Usage:');
                console.log('  node analyze-pr-failures.js analyze <pr_number> [...]  - Full analysis with comments');
                console.log('  node analyze-pr-failures.js check <pr_number>          - Quick analysis without comments');
                console.log('  node analyze-pr-failures.js summary <pr_number> [...]  - Multi-PR status summary');
                console.log('');
                console.log('Examples:');
                console.log('  node analyze-pr-failures.js analyze 183 184            - Analyze PRs 183 and 184');
                console.log('  node analyze-pr-failures.js check 183                  - Quick check of PR 183');
                console.log('  node analyze-pr-failures.js summary 183 184 185        - Status summary of multiple PRs');
                break;
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

module.exports = { PRFailureAnalyzer };

if (require.main === module) {
    main().catch(console.error);
}