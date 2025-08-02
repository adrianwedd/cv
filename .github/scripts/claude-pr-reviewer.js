#!/usr/bin/env node

/**
 * Claude-Powered PR Review System
 * 
 * Uses Claude OAuth/browser authentication to provide AI-powered analysis
 * of pull request failures and recommendations for resolution.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const { ClaudeAuthManager } = require('./claude-auth-manager');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * PR Review System using Claude AI
 */
class ClaudePRReviewer {
    constructor(config = {}) {
        this.authManager = new ClaudeAuthManager(config);
        this.config = {
            max_tokens: 4000,
            temperature: 0.1,
            ...config
        };
    }

    /**
     * Initialize the reviewer
     */
    async initialize() {
        await this.authManager.initialize();
        console.log('🔍 Claude PR Reviewer initialized');
    }

    /**
     * Get PR information using GitHub CLI
     */
    async getPRInfo(prNumber) {
        try {
            const prData = JSON.parse(execSync(
                `gh pr view ${prNumber} --json title,body,state,url,mergeable,statusCheckRollup,headRefName,baseRefName`,
                { encoding: 'utf8' }
            ));

            // Get failing checks
            const failingChecks = prData.statusCheckRollup.filter(
                check => check.conclusion === 'FAILURE'
            );

            // Get check details for failing checks
            const checkDetails = [];
            for (const check of failingChecks) {
                try {
                    // Extract workflow run ID from details URL
                    const runMatch = check.detailsUrl.match(/runs\/(\d+)/);
                    if (runMatch) {
                        const runId = runMatch[1];
                        const logs = execSync(
                            `gh run view ${runId} --log`,
                            { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
                        );
                        
                        checkDetails.push({
                            name: check.name,
                            conclusion: check.conclusion,
                            detailsUrl: check.detailsUrl,
                            logs: logs.substring(0, 10000) // Limit log size
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not get logs for ${check.name}: ${error.message}`);
                    checkDetails.push({
                        name: check.name,
                        conclusion: check.conclusion,
                        detailsUrl: check.detailsUrl,
                        logs: 'Log retrieval failed'
                    });
                }
            }

            return {
                ...prData,
                failingChecks: checkDetails
            };
        } catch (error) {
            throw new Error(`Failed to get PR info: ${error.message}`);
        }
    }

    /**
     * Generate AI-powered review and recommendations
     */
    async reviewPR(prNumber) {
        console.log(`🔍 Reviewing PR #${prNumber}...`);

        const prInfo = await this.getPRInfo(prNumber);
        
        if (prInfo.failingChecks.length === 0) {
            console.log('✅ No failing checks found - PR is ready to merge!');
            return {
                status: 'success',
                recommendations: [],
                autoMergeReady: true
            };
        }

        console.log(`🔍 Found ${prInfo.failingChecks.length} failing checks, analyzing...`);

        const prompt = this.buildAnalysisPrompt(prInfo);
        
        try {
            const response = await this.authManager.makeRequest([
                {
                    role: 'system',
                    content: `You are an expert DevOps engineer analyzing CI/CD failures. Provide concise, actionable recommendations to fix the issues. Focus on root causes and specific steps to resolve problems.`
                },
                {
                    role: 'user', 
                    content: prompt
                }
            ], {
                max_tokens: this.config.max_tokens,
                temperature: this.config.temperature,
                session_type: 'pr_review',
                enhancement_mode: 'analysis'
            });

            const analysis = response.content[0].text;
            
            // Parse recommendations
            const recommendations = this.parseRecommendations(analysis);
            
            return {
                status: 'failure',
                analysis,
                recommendations,
                prInfo,
                autoMergeReady: false
            };

        } catch (error) {
            console.error('❌ Claude analysis failed:', error.message);
            return {
                status: 'error',
                error: error.message,
                prInfo,
                autoMergeReady: false
            };
        }
    }

    /**
     * Build analysis prompt for Claude
     */
    buildAnalysisPrompt(prInfo) {
        return `# PR Analysis Request

## Pull Request Details
- **Title**: ${prInfo.title}
- **Branch**: ${prInfo.headRefName} → ${prInfo.baseRefName}
- **URL**: ${prInfo.url}
- **State**: ${prInfo.state}
- **Mergeable**: ${prInfo.mergeable}

## Description
${prInfo.body || 'No description provided'}

## Failing CI Checks (${prInfo.failingChecks.length})

${prInfo.failingChecks.map(check => `
### ❌ ${check.name}
**Status**: ${check.conclusion}
**Details**: ${check.detailsUrl}

**Log Sample**:
\`\`\`
${check.logs.substring(0, 2000)}
\`\`\`
`).join('\n')}

## Analysis Request

Please analyze these CI failures and provide:

1. **Root Cause Analysis**: What's actually causing each failure?
2. **Priority Assessment**: Which failures are blocking merge and which are warnings?
3. **Specific Recommendations**: Exact commands, file changes, or configuration updates needed
4. **Quick Fixes**: Any issues that can be resolved immediately
5. **Merge Decision**: Can this PR be safely merged with admin override, or are the failures critical?

Focus on actionable solutions and be specific about file paths, commands, and configuration changes needed.`;
    }

    /**
     * Parse recommendations from Claude response
     */
    parseRecommendations(analysis) {
        const recommendations = [];
        
        // Extract specific action items from the analysis
        const actionPatterns = [
            /(?:fix|update|change|modify|edit|create|delete|add|remove|install|run)\s+[^\n]+/gi,
            /(?:command|file|path|config):\s*[^\n]+/gi,
            /```(?:bash|shell|yaml|json|js)[^`]*```/gi
        ];

        actionPatterns.forEach(pattern => {
            const matches = analysis.match(pattern);
            if (matches) {
                recommendations.push(...matches.map(match => match.trim()));
            }
        });

        return recommendations;
    }

    /**
     * Generate and post PR review comment
     */
    async postReviewComment(prNumber, review) {
        if (review.status === 'success') {
            const comment = `🎉 **Auto-Review: All Checks Passing**

This PR is ready for automatic merge! All CI checks are passing and no issues were detected.

**Auto-Merge Status**: ✅ Ready
**Recommendations**: None - proceed with merge

---
🤖 *AI Review powered by Claude Code*`;

            await this.postComment(prNumber, comment);
            return;
        }

        if (review.status === 'error') {
            const comment = `⚠️ **Auto-Review: Analysis Error**

Failed to analyze this PR due to: ${review.error}

**Manual Review Required**: Please check CI logs manually
**Auto-Merge Status**: ❌ Blocked

---
🤖 *AI Review powered by Claude Code*`;

            await this.postComment(prNumber, comment);
            return;
        }

        // Generate detailed review comment
        const comment = `🔍 **AI-Powered PR Review Analysis**

## 🚨 Failing Checks (${review.prInfo.failingChecks.length})

${review.prInfo.failingChecks.map(check => 
    `- ❌ **${check.name}**: [View Details](${check.detailsUrl})`
).join('\n')}

## 🧠 Claude Analysis

${review.analysis}

## 🛠️ Quick Actions Identified

${review.recommendations.length > 0 ? 
    review.recommendations.slice(0, 5).map(rec => `- ${rec}`).join('\n') :
    'No specific quick actions identified - see full analysis above'
}

## 🚀 Next Steps

1. **Address failing checks** using the recommendations above
2. **Push fixes** to the feature branch
3. **Wait for CI** to complete successfully  
4. **Auto-merge** will trigger automatically once all checks pass

**Auto-Merge Status**: ❌ Blocked (${review.prInfo.failingChecks.length} failing checks)

---
🤖 *AI Review powered by Claude Code*`;

        await this.postComment(prNumber, comment);
    }

    /**
     * Post comment to PR
     */
    async postComment(prNumber, comment) {
        try {
            execSync(
                `gh pr comment ${prNumber} --body "${comment.replace(/"/g, '\\"')}"`,
                { encoding: 'utf8' }
            );
            console.log(`💬 Posted review comment to PR #${prNumber}`);
        } catch (error) {
            console.error(`❌ Failed to post comment: ${error.message}`);
        }
    }

    /**
     * Review multiple PRs
     */
    async reviewMultiplePRs(prNumbers) {
        const results = [];
        
        for (const prNumber of prNumbers) {
            try {
                console.log(`\n🔍 Reviewing PR #${prNumber}...`);
                const review = await this.reviewPR(prNumber);
                await this.postReviewComment(prNumber, review);
                results.push({ prNumber, review });
                
                // Small delay between reviews
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Failed to review PR #${prNumber}: ${error.message}`);
                results.push({ prNumber, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Generate summary report
     */
    generateSummaryReport(results) {
        console.log('\n📊 **PR REVIEW SUMMARY REPORT**\n');
        
        const readyToMerge = results.filter(r => r.review?.autoMergeReady);
        const needsFixes = results.filter(r => r.review && !r.review.autoMergeReady);
        const errors = results.filter(r => r.error);
        
        console.log(`✅ Ready to Merge: ${readyToMerge.length} PRs`);
        readyToMerge.forEach(r => console.log(`   - PR #${r.prNumber}: All checks passing`));
        
        console.log(`🔧 Needs Fixes: ${needsFixes.length} PRs`);
        needsFixes.forEach(r => {
            const failCount = r.review.prInfo?.failingChecks?.length || 0;
            console.log(`   - PR #${r.prNumber}: ${failCount} failing checks`);
        });
        
        console.log(`❌ Review Errors: ${errors.length} PRs`);
        errors.forEach(r => console.log(`   - PR #${r.prNumber}: ${r.error}`));
        
        console.log('\n🎯 **NEXT ACTIONS**');
        if (readyToMerge.length > 0) {
            console.log('- Ready PRs will auto-merge when branch protection allows');
        }
        if (needsFixes.length > 0) {
            console.log('- Review AI recommendations and apply fixes to failing PRs');
        }
        if (errors.length > 0) {
            console.log('- Manually review PRs that failed AI analysis');
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const command = process.argv[2];
    const prNumbers = process.argv.slice(3).map(n => parseInt(n)).filter(n => n > 0);
    
    const reviewer = new ClaudePRReviewer();
    
    try {
        await reviewer.initialize();
        
        switch (command) {
            case 'review':
                if (prNumbers.length === 0) {
                    console.error('❌ Usage: node claude-pr-reviewer.js review <pr_number> [pr_number2] ...');
                    process.exit(1);
                }
                
                const results = await reviewer.reviewMultiplePRs(prNumbers);
                reviewer.generateSummaryReport(results);
                break;
                
            case 'check':
                if (prNumbers.length !== 1) {
                    console.error('❌ Usage: node claude-pr-reviewer.js check <pr_number>');
                    process.exit(1);
                }
                
                const review = await reviewer.reviewPR(prNumbers[0]);
                console.log('\n📊 **REVIEW RESULT**');
                console.log(`Status: ${review.status}`);
                console.log(`Auto-merge ready: ${review.autoMergeReady}`);
                if (review.analysis) {
                    console.log('\nAnalysis:', review.analysis.substring(0, 500) + '...');
                }
                break;
                
            case 'blocked':
                // Find all open PRs with failing checks
                const openPRs = JSON.parse(execSync('gh pr list --json number', { encoding: 'utf8' }));
                const prToCheck = openPRs.map(pr => pr.number);
                
                if (prToCheck.length === 0) {
                    console.log('✅ No open PRs found');
                    break;
                }
                
                console.log(`🔍 Checking ${prToCheck.length} open PRs for issues...`);
                const allResults = await reviewer.reviewMultiplePRs(prToCheck);
                reviewer.generateSummaryReport(allResults);
                break;
                
            default:
                console.log('🔍 **CLAUDE PR REVIEWER**\n');
                console.log('AI-powered analysis of pull request CI failures\n');
                console.log('Usage:');
                console.log('  node claude-pr-reviewer.js review <pr_number> [...]  - Review specific PRs');
                console.log('  node claude-pr-reviewer.js check <pr_number>         - Quick check single PR');
                console.log('  node claude-pr-reviewer.js blocked                   - Review all blocked PRs');
                console.log('');
                console.log('Examples:');
                console.log('  node claude-pr-reviewer.js review 183 184            - Review PRs 183 and 184');
                console.log('  node claude-pr-reviewer.js blocked                   - Check all open PRs');
                console.log('');
                console.log('The reviewer will:');
                console.log('- Analyze CI failure logs with Claude AI');
                console.log('- Provide specific fix recommendations');
                console.log('- Post review comments to GitHub');
                console.log('- Generate actionable summary reports');
                break;
        }
        
    } catch (error) {
        console.error('❌ PR Review failed:', error.message);
        process.exit(1);
    }
}

module.exports = { ClaudePRReviewer };

if (require.main === module) {
    main().catch(console.error);
}