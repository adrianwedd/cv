#!/usr/bin/env node

/**
 * Watch Me Work Data Processor
 * 
 * Processes GitHub activity data for the Watch Me Work dashboard.
 * Runs in GitHub Actions environment with authenticated API access
 * to generate static JSON files that the client-side dashboard can consume.
 * 
 * This solves the rate limiting issues by pre-processing data server-side
 * and serving it statically to avoid client-side GitHub API calls.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Watch Me Work Data Processor
 */
class WatchMeWorkDataProcessor {
    constructor(config = {}) {
        this.config = {
            username: config.username || 'adrianwedd',
            dataDir: config.dataDir || path.join(process.cwd(), 'data'),
            outputFile: 'watch-me-work-data.json',
            lookbackDays: config.lookbackDays || 90, // Extend to 90 days for better streak calculation
            maxActivities: config.maxActivities || 100,
            maxCommits: config.maxCommits || 200, // Increase for better streak data
            maxIssues: config.maxIssues || 50,
            ...config
        };

        this.githubToken = process.env.GITHUB_TOKEN;
        if (!this.githubToken) {
            throw new Error('GITHUB_TOKEN environment variable is required');
        }

        this.apiBase = 'https://api.github.com';
        this.rateLimitRemaining = 5000; // Track API rate limit
    }

    /**
     * Process all data for the Watch Me Work dashboard
     */
    async processWatchMeWorkData() {
        console.log('🎬 Processing Watch Me Work dashboard data...');
        
        try {
            const startTime = new Date();
            
            // Calculate date ranges
            const since = new Date(Date.now() - this.config.lookbackDays * 24 * 60 * 60 * 1000);
            
            console.log(`📅 Processing data since: ${since.toISOString()}`);
            console.log(`👤 Username: ${this.config.username}`);
            
            // Load data in parallel where possible
            const [userActivity, repositories, userInfo] = await Promise.all([
                this.loadUserActivity(),
                this.loadRepositories(),
                this.loadUserInfo()
            ]);
            
            console.log(`📊 Loaded ${userActivity.length} activities, ${repositories.length} repositories`);
            
            // Process detailed data for repositories
            const recentCommits = await this.loadRecentCommits(repositories, since);
            const issuesAndPRs = await this.loadIssuesAndPRs(repositories, since);
            
            console.log(`📝 Loaded ${recentCommits.length} commits, ${issuesAndPRs.length} issues/PRs`);
            
            // Process and structure data
            const dashboardData = {
                metadata: {
                    generated_at: new Date().toISOString(),
                    username: this.config.username,
                    lookback_days: this.config.lookbackDays,
                    data_freshness: 'live',
                    api_calls_made: this.getApiCallsCount(),
                    rate_limit_remaining: this.rateLimitRemaining
                },
                user: {
                    login: userInfo.login,
                    name: userInfo.name,
                    bio: userInfo.bio,
                    public_repos: userInfo.public_repos,
                    followers: userInfo.followers,
                    following: userInfo.following
                },
                metrics: this.calculateMetrics(userActivity, recentCommits, issuesAndPRs),
                activities: this.processActivities(userActivity),
                repositories: this.processRepositories(repositories, recentCommits, issuesAndPRs),
                recent_commits: recentCommits,
                recent_issues: issuesAndPRs,
                timeline: this.buildTimeline(userActivity, recentCommits, issuesAndPRs)
            };
            
            // Save processed data
            const outputPath = path.join(this.config.dataDir, this.config.outputFile);
            await this.saveData(outputPath, dashboardData);
            
            const processingTime = new Date() - startTime;
            console.log(`✅ Watch Me Work data processed in ${processingTime}ms`);
            console.log(`📁 Data saved to: ${outputPath}`);
            console.log(`🔍 Generated ${dashboardData.activities.length} activities, ${dashboardData.repositories.length} repositories`);
            
            return dashboardData;
            
        } catch (error) {
            console.error('❌ Failed to process Watch Me Work data:', error);
            throw error;
        }
    }

    /**
     * Load user activity from GitHub API
     */
    async loadUserActivity() {
        try {
            console.log('📊 Loading user activity...');
            
            const response = await this.makeGitHubRequest(
                `/users/${this.config.username}/events/public?per_page=100`
            );
            
            return response || [];
        } catch (error) {
            console.warn('⚠️ Could not load user activity:', error.message);
            return [];
        }
    }

    /**
     * Load user repositories with smart filtering
     */
    async loadRepositories() {
        try {
            console.log('📦 Loading repositories...');
            
            const allRepos = await this.makeGitHubRequest(
                `/users/${this.config.username}/repos?per_page=100&sort=updated`
            );
            
            if (!allRepos) return [];
            
            // Filter repositories: only include repos with recent activity (30 days)
            const filteredRepos = [];
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            for (const repo of allRepos) {
                // Skip repos that haven't been updated in the last 30 days
                const repoUpdated = new Date(repo.updated_at);
                if (repoUpdated < thirtyDaysAgo) {
                    continue;
                }
                
                if (!repo.fork) {
                    // Check if non-fork has recent commits by me
                    try {
                        const commits = await this.makeGitHubRequest(
                            `/repos/${repo.full_name}/commits?author=${this.config.username}&since=${thirtyDaysAgo.toISOString()}&per_page=1`
                        );
                        
                        if (commits && commits.length > 0) {
                            filteredRepos.push({
                                ...repo,
                                _isMainRepo: true
                            });
                        }
                        
                        await this.sleep(50);
                    } catch (error) {
                        console.warn(`⚠️ Could not check commits for ${repo.name}:`, error.message);
                    }
                } else {
                    // For forks, check if we have recent commits
                    try {
                        const commits = await this.makeGitHubRequest(
                            `/repos/${repo.full_name}/commits?author=${this.config.username}&since=${thirtyDaysAgo.toISOString()}&per_page=1`
                        );
                        
                        if (commits && commits.length > 0) {
                            // Include fork if we have recent commits
                            filteredRepos.push({
                                ...repo,
                                _isForkWithActivity: true
                            });
                        }
                        
                        // Small delay to avoid rate limiting
                        await this.sleep(50);
                    } catch (error) {
                        console.warn(`⚠️ Could not check fork activity for ${repo.name}:`, error.message);
                    }
                }
            }
            
            console.log(`📦 Filtered ${filteredRepos.length} repositories from ${allRepos.length} total`);
            return filteredRepos;
            
        } catch (error) {
            console.warn('⚠️ Could not load repositories:', error.message);
            return [];
        }
    }

    /**
     * Load user info
     */
    async loadUserInfo() {
        try {
            console.log('👤 Loading user info...');
            
            const userInfo = await this.makeGitHubRequest(`/users/${this.config.username}`);
            return userInfo || {};
        } catch (error) {
            console.warn('⚠️ Could not load user info:', error.message);
            return {};
        }
    }

    /**
     * Load recent commits across repositories
     */
    async loadRecentCommits(repositories, since) {
        console.log('📝 Loading recent commits...');
        
        const commits = [];
        let processedRepos = 0;
        
        for (const repo of repositories) {
            try {
                const repoCommits = await this.makeGitHubRequest(
                    `/repos/${repo.full_name}/commits?author=${this.config.username}&since=${since.toISOString()}&per_page=10`
                );
                
                if (repoCommits && repoCommits.length > 0) {
                    commits.push(...repoCommits.map(commit => ({
                        ...commit,
                        repository: repo.name,
                        repository_full_name: repo.full_name,
                        repository_url: repo.html_url,
                        _activity_type: 'commit'
                    })));
                }
                
                processedRepos++;
                if (processedRepos % 10 === 0) {
                    console.log(`📝 Processed commits for ${processedRepos}/${repositories.length} repositories`);
                }
                
                // Rate limiting protection
                await this.sleep(50);
            } catch (error) {
                console.warn(`⚠️ Could not load commits for ${repo.name}:`, error.message);
            }
        }
        
        // Sort by date and limit
        const sortedCommits = commits
            .sort((a, b) => new Date(b.commit.author.date) - new Date(a.commit.author.date))
            .slice(0, this.config.maxCommits);
            
        console.log(`📝 Loaded ${sortedCommits.length} recent commits`);
        return sortedCommits;
    }

    /**
     * Load recent issues and pull requests
     */
    async loadIssuesAndPRs(repositories, since) {
        console.log('🐛 Loading recent issues and PRs...');
        
        const issues = [];
        let processedRepos = 0;
        
        for (const repo of repositories) {
            try {
                const repoIssues = await this.makeGitHubRequest(
                    `/repos/${repo.full_name}/issues?state=all&since=${since.toISOString()}&per_page=20`
                );
                
                if (repoIssues && repoIssues.length > 0) {
                    issues.push(...repoIssues.map(issue => ({
                        ...issue,
                        repository: repo.name,
                        repository_full_name: repo.full_name,
                        repository_url: repo.html_url,
                        type: issue.pull_request ? 'pull_request' : 'issue',
                        _activity_type: issue.pull_request ? 'pull_request' : 'issue'
                    })));
                }
                
                processedRepos++;
                if (processedRepos % 10 === 0) {
                    console.log(`🐛 Processed issues for ${processedRepos}/${repositories.length} repositories`);
                }
                
                // Rate limiting protection
                await this.sleep(50);
            } catch (error) {
                console.warn(`⚠️ Could not load issues for ${repo.name}:`, error.message);
            }
        }
        
        // Sort by updated date and limit
        const sortedIssues = issues
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, this.config.maxIssues);
            
        console.log(`🐛 Loaded ${sortedIssues.length} recent issues/PRs`);
        return sortedIssues;
    }

    /**
     * Calculate dashboard metrics
     */
    calculateMetrics(activities, commits, issues) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Commits today (for backward compatibility)
        const commitsToday = commits.filter(commit => 
            new Date(commit.commit.author.date) >= todayStart
        ).length;
        
        // Commits this week (main metric)
        const commitsThisWeek = commits.filter(c => new Date(c.commit.author.date) >= weekAgo).length;
        
        // Calculate streak days with better accuracy
        const streakDays = this.calculateStreakDays(commits);
        
        // Velocity score (commits + issues + PRs in last 7 days)
        const weeklyCommits = commitsThisWeek;
        const weeklyIssues = issues.filter(i => new Date(i.updated_at) >= weekAgo).length;
        const velocityScore = weeklyCommits * 3 + weeklyIssues * 2;
        
        // Focus time estimate based on weekly activity
        const focusTime = Math.min(40, Math.max(0, commitsThisWeek * 2));
        
        // Activity distribution
        const activityTypes = {};
        activities.forEach(activity => {
            activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
        });
        
        return {
            commits_today: commitsToday,
            commits_this_week: commitsThisWeek,
            streak_days: streakDays,
            velocity_score: velocityScore,
            focus_time: parseFloat(focusTime.toFixed(1)),
            weekly_commits: weeklyCommits,
            weekly_issues: weeklyIssues,
            total_activities: activities.length,
            activity_distribution: activityTypes,
            last_commit_date: commits.length > 0 ? commits[0].commit.author.date : null,
            last_issue_date: issues.length > 0 ? issues[0].updated_at : null
        };
    }

    /**
     * Calculate streak days from commits
     */
    calculateStreakDays(commits) {
        if (!commits || commits.length === 0) return 0;
        
        const commitDates = new Set();
        commits.forEach(commit => {
            const date = new Date(commit.commit.author.date);
            const dateString = date.toISOString().split('T')[0];
            commitDates.add(dateString);
        });
        
        const sortedDates = Array.from(commitDates).sort().reverse();
        let streak = 0;
        
        for (let i = 0; i < sortedDates.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            const expectedDateString = expectedDate.toISOString().split('T')[0];
            
            if (sortedDates[i] === expectedDateString) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Process activities for dashboard consumption
     */
    processActivities(activities) {
        return activities.slice(0, this.config.maxActivities).map(activity => ({
            id: activity.id,
            type: activity.type,
            repo: activity.repo?.name || 'unknown',
            repo_full_name: activity.repo?.name || 'unknown',
            created_at: activity.created_at,
            payload: activity.payload,
            actor: activity.actor,
            public: activity.public,
            _formatted_description: this.formatActivityDescription(activity),
            _icon: this.getActivityIcon(activity.type),
            _color: this.getActivityColor(activity.type)
        }));
    }

    /**
     * Process repositories for dashboard consumption
     */
    processRepositories(repositories, commits, issues) {
        return repositories.map(repo => {
            const repoCommits = commits.filter(c => c.repository === repo.name);
            const repoIssues = issues.filter(i => i.repository === repo.name);
            
            return {
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                updated_at: repo.updated_at,
                html_url: repo.html_url,
                private: repo.private,
                fork: repo.fork,
                _is_main_repo: repo._isMainRepo || false,
                _is_fork_with_activity: repo._isForkWithActivity || false,
                recent_activity: {
                    commits: repoCommits.length,
                    issues: repoIssues.length,
                    total: repoCommits.length + repoIssues.length,
                    last_commit: repoCommits.length > 0 ? repoCommits[0].commit.author.date : null,
                    last_issue: repoIssues.length > 0 ? repoIssues[0].updated_at : null
                }
            };
        });
    }

    /**
     * Build unified timeline from all activities
     */
    buildTimeline(activities, commits, issues) {
        const timeline = [];
        
        // Add activities
        activities.forEach(activity => {
            timeline.push({
                id: `activity-${activity.id}`,
                type: 'github_activity',
                subtype: activity.type,
                timestamp: activity.created_at,
                repo: activity.repo?.name || 'unknown',
                data: activity,
                _formatted: this.formatActivityDescription(activity),
                _icon: this.getActivityIcon(activity.type),
                _color: this.getActivityColor(activity.type)
            });
        });
        
        // Add commits
        commits.forEach(commit => {
            timeline.push({
                id: `commit-${commit.sha}`,
                type: 'commit',
                subtype: 'push',
                timestamp: commit.commit.author.date,
                repo: commit.repository,
                data: commit,
                _formatted: `Committed: ${commit.commit.message.split('\n')[0]}`,
                _icon: '📝',
                _color: '#22c55e'
            });
        });
        
        // Add issues/PRs
        issues.forEach(issue => {
            timeline.push({
                id: `issue-${issue.id}`,
                type: issue.type,
                subtype: issue.pull_request ? 'pull_request' : 'issue',
                timestamp: issue.updated_at,
                repo: issue.repository,
                data: issue,
                _formatted: `${issue.type === 'pull_request' ? 'PR' : 'Issue'} #${issue.number}: ${issue.title}`,
                _icon: issue.pull_request ? '🔄' : '🐛',
                _color: issue.pull_request ? '#3b82f6' : '#f59e0b'
            });
        });
        
        // Sort by timestamp (newest first) and limit
        return timeline
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, this.config.maxActivities);
    }

    /**
     * Make authenticated GitHub API request
     */
    async makeGitHubRequest(endpoint) {
        const url = `${this.apiBase}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Watch-Me-Work-Dashboard/1.0'
                }
            });
            
            // Update rate limit tracking
            this.rateLimitRemaining = parseInt(response.headers.get('x-ratelimit-remaining')) || this.rateLimitRemaining;
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn(`⚠️ GitHub API request failed for ${endpoint}:`, error.message);
            return null;
        }
    }

    /**
     * Save processed data to file
     */
    async saveData(filePath, data) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    /**
     * Get total API calls made (rough estimate)
     */
    getApiCallsCount() {
        // This is a rough estimate - in production you'd track this more precisely
        return Math.max(0, 5000 - this.rateLimitRemaining);
    }

    /**
     * Format activity description
     */
    formatActivityDescription(activity) {
        switch (activity.type) {
            case 'PushEvent':
                const commits = activity.payload?.commits?.length || 0;
                const commitMessages = activity.payload?.commits?.map(c => c.message?.split('\n')[0]).slice(0, 2) || [];
                let desc = `Pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
                if (commitMessages.length > 0) {
                    desc += `: ${commitMessages[0]}`;
                    if (commits > 1) desc += ` (and ${commits - 1} more)`;
                }
                return desc;
            case 'IssuesEvent':
                const action = activity.payload?.action || 'updated';
                const issueNumber = activity.payload?.issue?.number || '';
                const issueTitle = activity.payload?.issue?.title?.slice(0, 60) || '';
                return `${action.charAt(0).toUpperCase() + action.slice(1)} issue #${issueNumber}${issueTitle ? `: ${issueTitle}` : ''}`;
            case 'PullRequestEvent':
                const prAction = activity.payload?.action || 'updated';
                const prNumber = activity.payload?.pull_request?.number || '';
                const prTitle = activity.payload?.pull_request?.title?.slice(0, 60) || '';
                return `${prAction.charAt(0).toUpperCase() + prAction.slice(1)} PR #${prNumber}${prTitle ? `: ${prTitle}` : ''}`;
            case 'IssueCommentEvent':
                const commentIssue = activity.payload?.issue?.number || '';
                const commentTitle = activity.payload?.issue?.title?.slice(0, 50) || '';
                return `Commented on issue #${commentIssue}${commentTitle ? `: ${commentTitle}` : ''}`;
            case 'CreateEvent':
                const refType = activity.payload?.ref_type || 'repository';
                const refName = activity.payload?.ref || '';
                return `Created ${refType}${refName ? ` "${refName}"` : ''}`;
            case 'DeleteEvent':
                const deletedRefType = activity.payload?.ref_type || 'branch';
                const deletedRef = activity.payload?.ref || '';
                return `Deleted ${deletedRefType}${deletedRef ? ` "${deletedRef}"` : ''}`;
            case 'ForkEvent':
                return 'Forked repository';
            case 'WatchEvent':
                return 'Starred repository';
            case 'ReleaseEvent':
                const releaseName = activity.payload?.release?.name || activity.payload?.release?.tag_name || '';
                return `Published release${releaseName ? ` "${releaseName}"` : ''}`;
            default:
                return `${activity.type.replace('Event', '')} activity`;
        }
    }

    /**
     * Get activity icon
     */
    getActivityIcon(type) {
        const icons = {
            'PushEvent': '📝',
            'IssuesEvent': '🐛',
            'PullRequestEvent': '🔄',
            'IssueCommentEvent': '💬',
            'CreateEvent': '🎯',
            'DeleteEvent': '🗑️',
            'ForkEvent': '🍴',
            'WatchEvent': '👁️',
            'ReleaseEvent': '🚀'
        };
        return icons[type] || '📋';
    }

    /**
     * Get activity color
     */
    getActivityColor(type) {
        const colors = {
            'PushEvent': '#22c55e',
            'IssuesEvent': '#f59e0b',
            'PullRequestEvent': '#3b82f6',
            'IssueCommentEvent': '#8b5cf6',
            'CreateEvent': '#10b981',
            'DeleteEvent': '#ef4444',
            'ForkEvent': '#f97316',
            'WatchEvent': '#6b7280',
            'ReleaseEvent': '#ec4899'
        };
        return colors[type] || '#6b7280';
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * CLI interface
 */
async function main() {
    const processor = new WatchMeWorkDataProcessor();
    
    try {
        const data = await processor.processWatchMeWorkData();
        
        console.log('\n✅ **WATCH ME WORK DATA PROCESSING COMPLETE**');
        console.log(`📊 Generated data for ${data.activities.length} activities`);
        console.log(`📦 Processed ${data.repositories.length} repositories`);
        console.log(`📝 Found ${data.recent_commits.length} recent commits`);
        console.log(`🐛 Found ${data.recent_issues.length} recent issues/PRs`);
        console.log(`🎯 Built timeline with ${data.timeline.length} events`);
        console.log(`📈 API calls used: ~${data.metadata.api_calls_made}`);
        console.log(`⏱️  Data freshness: live`);
        
    } catch (error) {
        console.error('❌ Watch Me Work data processing failed:', error);
        process.exit(1);
    }
}

module.exports = { WatchMeWorkDataProcessor };

if (require.main === module) {
    main().catch(console.error);
}