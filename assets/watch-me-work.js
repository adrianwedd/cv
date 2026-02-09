/**
 * Watch Me Work Dashboard - Live Development Activity Tracker
 * 
 * Real-time dashboard displaying GitHub activity across all repositories,
 * including commits, issues, pull requests, and live development metrics.
 * 
 * Features:
 * - Live GitHub API integration
 * - Real-time activity stream
 * - Cross-repository insights
 * - Interactive filtering and search
 * - Live metrics and statistics
 * - Code preview and diff display
 */

// Configuration
const CONFIG = {
    GITHUB_API: 'https://api.github.com',
    USERNAME: 'adrianwedd',
    REFRESH_INTERVAL: 30000, // 30 seconds
    MAX_ACTIVITIES: 100,
    REPOSITORIES: [
        'cv', 'ticketsmith', 'agentic-research-engine', 
        'ai-career-advisor', 'multi-agent-research'
    ],
    COLORS: {
        commit: '#22c55e',
        issue: '#f59e0b',
        pr: '#3b82f6',
        comment: '#8b5cf6',
        push: '#10b981',
        fork: '#f97316'
    }
};

/**
 * Main Dashboard Application
 */
class WatchMeWorkDashboard {
    constructor() {
        this.isLive = true;
        this.isPaused = false;
        this.activities = [];
        this.repositories = new Map();
        this.filters = {
            commits: true,
            issues: true,
            prs: true,
            comments: true,
            timeRange: '24h',
            repositories: []
        };
        this.lastRefresh = null;
        this.refreshTimer = null;
        
        this.init();
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        console.log('🎬 Initializing Watch Me Work Dashboard...');
        
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI components
            this.initializeFilters();
            this.updateLiveStatus('connecting');
            
            // Load initial data
            await this.loadInitialData();
            
            // Start live updates
            this.startLiveUpdates();
            
            // Update status
            this.updateLiveStatus('live');
            
            console.log('✅ Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.updateLiveStatus('error');
        }
    }

    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners() {
        // Filter toggle
        const filterToggle = document.getElementById('filter-toggle');
        const filtersPanel = document.getElementById('filters-panel');
        filterToggle?.addEventListener('click', () => {
            filtersPanel.classList.toggle('open');
        });

        // Timeline controls
        const pauseBtn = document.getElementById('pause-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        
        pauseBtn?.addEventListener('click', () => this.togglePause());
        refreshBtn?.addEventListener('click', () => this.refreshData());

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateRepoView(e.target.dataset.view);
            });
        });

        // Modal controls
        const modalClose = document.getElementById('modal-close');
        const modal = document.getElementById('activity-modal');
        modalClose?.addEventListener('click', () => modal.classList.remove('open'));

        // Filter controls
        document.getElementById('filter-commits')?.addEventListener('change', (e) => {
            this.filters.commits = e.target.checked;
            this.applyFilters();
        });
        
        document.getElementById('filter-issues')?.addEventListener('change', (e) => {
            this.filters.issues = e.target.checked;
            this.applyFilters();
        });
        
        document.getElementById('filter-prs')?.addEventListener('change', (e) => {
            this.filters.prs = e.target.checked;
            this.applyFilters();
        });
        
        document.getElementById('filter-comments')?.addEventListener('change', (e) => {
            this.filters.comments = e.target.checked;
            this.applyFilters();
        });

        document.getElementById('time-range')?.addEventListener('change', (e) => {
            this.filters.timeRange = e.target.value;
            this.applyFilters();
        });

        // Close code preview
        document.getElementById('close-preview')?.addEventListener('click', () => {
            document.getElementById('code-preview').style.display = 'none';
        });
    }

    /**
     * Initialize filter components
     */
    initializeFilters() {
        const repoFilters = document.getElementById('repo-filters');
        if (!repoFilters) return;

        CONFIG.REPOSITORIES.forEach(repo => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.repo = repo;
            checkbox.checked = true;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + repo));

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.filters.repositories = this.filters.repositories.filter(r => r !== repo);
                } else {
                    this.filters.repositories.push(repo);
                }
                this.applyFilters();
            });

            repoFilters.appendChild(label);
        });
    }

    /**
     * Load initial dashboard data
     */
    async loadInitialData() {
        console.log('📊 Loading initial dashboard data...');
        
        const promises = [
            this.loadUserActivity(),
            this.loadRepositoryData(),
            this.loadRecentCommits(),
            this.loadIssuesAndPRs()
        ];

        try {
            const results = await Promise.allSettled(promises);
            
            // Process results
            this.processUserActivity(results[0].status === 'fulfilled' ? results[0].value : []);
            this.processRepositoryData(results[1].status === 'fulfilled' ? results[1].value : []);
            this.processCommitsData(results[2].status === 'fulfilled' ? results[2].value : []);
            this.processIssuesData(results[3].status === 'fulfilled' ? results[3].value : []);
            
            // Update UI
            this.updateMetrics();
            this.updateActivityTimeline();
            this.updateRepositoryGrid();
            
            this.lastRefresh = new Date();
            this.updateFooterTimestamp();
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
        }
    }

    /**
     * Load user activity from GitHub API
     */
    async loadUserActivity() {
        try {
            const response = await fetch(`${CONFIG.GITHUB_API}/users/${CONFIG.USERNAME}/events/public?per_page=100`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Could not load user activity:', error.message);
            return [];
        }
    }

    /**
     * Load repository data
     */
    async loadRepositoryData() {
        try {
            const response = await fetch(`${CONFIG.GITHUB_API}/users/${CONFIG.USERNAME}/repos?per_page=100&sort=updated`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Could not load repository data:', error.message);
            return [];
        }
    }

    /**
     * Load recent commits across repositories
     */
    async loadRecentCommits() {
        const commits = [];
        const since = this.getTimeRangeDate();
        
        for (const repo of CONFIG.REPOSITORIES) {
            try {
                const response = await fetch(
                    `${CONFIG.GITHUB_API}/repos/${CONFIG.USERNAME}/${repo}/commits?author=${CONFIG.USERNAME}&since=${since.toISOString()}&per_page=10`
                );
                
                if (response.ok) {
                    const repoCommits = await response.json();
                    commits.push(...repoCommits.map(commit => ({
                        ...commit,
                        repository: repo
                    })));
                }
                
                // Rate limiting protection
                await this.sleep(100);
            } catch (error) {
                console.warn(`⚠️ Could not load commits for ${repo}:`, error.message);
            }
        }
        
        return commits.sort((a, b) => new Date(b.commit.author.date) - new Date(a.commit.author.date));
    }

    /**
     * Load issues and pull requests
     */
    async loadIssuesAndPRs() {
        const issues = [];
        const since = this.getTimeRangeDate();
        
        for (const repo of CONFIG.REPOSITORIES) {
            try {
                // Load issues
                const issuesResponse = await fetch(
                    `${CONFIG.GITHUB_API}/repos/${CONFIG.USERNAME}/${repo}/issues?state=all&since=${since.toISOString()}&per_page=20`
                );
                
                if (issuesResponse.ok) {
                    const repoIssues = await issuesResponse.json();
                    issues.push(...repoIssues.map(issue => ({
                        ...issue,
                        repository: repo,
                        type: issue.pull_request ? 'pull_request' : 'issue'
                    })));
                }
                
                // Rate limiting protection
                await this.sleep(100);
            } catch (error) {
                console.warn(`⚠️ Could not load issues for ${repo}:`, error.message);
            }
        }
        
        return issues.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    /**
     * Process user activity data
     */
    processUserActivity(events) {
        this.activities = events.map(event => ({
            id: event.id,
            type: event.type,
            repo: event.repo?.name || 'unknown',
            created_at: event.created_at,
            payload: event.payload,
            actor: event.actor,
            public: event.public
        }));
    }

    /**
     * Process repository data
     */
    processRepositoryData(repos) {
        this.repositories.clear();
        
        repos.forEach(repo => {
            this.repositories.set(repo.name, {
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                updated_at: repo.updated_at,
                html_url: repo.html_url,
                private: repo.private
            });
        });
    }

    /**
     * Process commits data
     */
    processCommitsData(commits) {
        this.recentCommits = commits.map(commit => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author,
            repository: commit.repository,
            html_url: commit.html_url,
            created_at: commit.commit.author.date
        }));
    }

    /**
     * Process issues and PRs data
     */
    processIssuesData(issues) {
        this.recentIssues = issues.map(issue => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            state: issue.state,
            type: issue.type,
            repository: issue.repository,
            html_url: issue.html_url,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            labels: issue.labels
        }));
    }

    /**
     * Update live metrics display
     */
    updateMetrics() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Commits today
        const commitsToday = this.recentCommits?.filter(commit => 
            new Date(commit.created_at) >= todayStart
        ).length || 0;
        
        // Streak calculation (simplified)
        const streakDays = this.calculateStreakDays();
        
        // Velocity score (commits + issues + PRs in last 7 days)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const velocityScore = (
            (this.recentCommits?.filter(c => new Date(c.created_at) >= weekAgo).length || 0) * 3 +
            (this.recentIssues?.filter(i => new Date(i.updated_at) >= weekAgo).length || 0) * 2
        );
        
        // Focus time (estimated from commit frequency)
        const focusTime = Math.min(8, Math.max(0, commitsToday * 1.5));
        
        // Update UI
        this.updateElement('commits-today', commitsToday);
        this.updateElement('streak-days', streakDays);
        this.updateElement('velocity-score', velocityScore);
        this.updateElement('focus-time', `${focusTime.toFixed(1)}h`);
    }

    /**
     * Calculate activity streak days
     */
    calculateStreakDays() {
        if (!this.recentCommits || this.recentCommits.length === 0) return 0;
        
        const commitDates = new Set();
        this.recentCommits.forEach(commit => {
            const date = new Date(commit.created_at);
            const dateString = date.toISOString().split('T')[0];
            commitDates.add(dateString);
        });
        
        const sortedDates = Array.from(commitDates).sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        
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
     * Update activity timeline
     */
    updateActivityTimeline() {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        const filteredActivities = this.getFilteredActivities();
        container.textContent = '';

        if (filteredActivities.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'timeline-empty';
            const iconDiv = document.createElement('div');
            iconDiv.className = 'empty-icon';
            iconDiv.textContent = '\u{1F4ED}';
            const p1 = document.createElement('p');
            p1.textContent = 'No recent activity found';
            const p2 = document.createElement('p');
            p2.className = 'empty-subtitle';
            p2.textContent = 'Try adjusting your filters or time range';
            empty.appendChild(iconDiv);
            empty.appendChild(p1);
            empty.appendChild(p2);
            container.appendChild(empty);
            return;
        }

        filteredActivities.forEach(activity => {
            const icon = this.getActivityIcon(activity.type);
            const color = CONFIG.COLORS[activity.type] || '#6b7280';
            const timeAgo = this.getTimeAgo(activity.created_at);

            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.dataset.activityId = activity.id;

            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.style.backgroundColor = color;
            marker.textContent = icon;

            const content = document.createElement('div');
            content.className = 'timeline-content';

            const header = document.createElement('div');
            header.className = 'timeline-header';
            const typeSpan = document.createElement('span');
            typeSpan.className = 'activity-type';
            typeSpan.textContent = this.formatActivityType(activity.type);
            const repoSpan = document.createElement('span');
            repoSpan.className = 'activity-repo';
            repoSpan.textContent = activity.repo;
            const timeSpan = document.createElement('span');
            timeSpan.className = 'activity-time';
            timeSpan.textContent = timeAgo;
            header.appendChild(typeSpan);
            header.appendChild(repoSpan);
            header.appendChild(timeSpan);

            const desc = document.createElement('div');
            desc.className = 'timeline-description';
            desc.textContent = this.formatActivityDescription(activity);

            content.appendChild(header);
            content.appendChild(desc);
            item.appendChild(marker);
            item.appendChild(content);

            item.addEventListener('click', () => this.showActivityDetails(activity));
            container.appendChild(item);
        });
    }

    /**
     * Update repository grid
     */
    updateRepositoryGrid() {
        const grid = document.getElementById('repo-grid');
        if (!grid) return;

        const repoArray = Array.from(this.repositories.values())
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        grid.textContent = '';

        repoArray.forEach(repo => {
            const lastUpdate = this.getTimeAgo(repo.updated_at);
            const recentActivity = this.getRepoRecentActivity(repo.name);

            const card = document.createElement('div');
            card.className = 'repo-card';
            card.dataset.repo = repo.name;

            // Header
            const header = document.createElement('div');
            header.className = 'repo-header';
            const h3 = document.createElement('h3');
            h3.className = 'repo-name';
            const link = document.createElement('a');
            link.href = repo.html_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = repo.name;
            h3.appendChild(link);
            const stats = document.createElement('div');
            stats.className = 'repo-stats';
            const starStat = document.createElement('span');
            starStat.className = 'repo-stat';
            starStat.textContent = '\u2B50 ' + repo.stars;
            const forkStat = document.createElement('span');
            forkStat.className = 'repo-stat';
            forkStat.textContent = '\u{1F374} ' + repo.forks;
            stats.appendChild(starStat);
            stats.appendChild(forkStat);
            header.appendChild(h3);
            header.appendChild(stats);

            // Description
            const descDiv = document.createElement('div');
            descDiv.className = 'repo-description';
            descDiv.textContent = repo.description || 'No description available';

            // Meta
            const meta = document.createElement('div');
            meta.className = 'repo-meta';
            if (repo.language) {
                const lang = document.createElement('span');
                lang.className = 'repo-language';
                lang.textContent = repo.language;
                meta.appendChild(lang);
            }
            const updated = document.createElement('span');
            updated.className = 'repo-updated';
            updated.textContent = 'Updated ' + lastUpdate;
            meta.appendChild(updated);

            // Activity
            const activityDiv = document.createElement('div');
            activityDiv.className = 'repo-activity';
            const summary = document.createElement('div');
            summary.className = 'activity-summary';
            summary.textContent = recentActivity.commits + ' commits, ' + recentActivity.issues + ' issues';
            const indicator = document.createElement('div');
            indicator.className = 'activity-indicator ' + (recentActivity.total > 0 ? 'active' : 'inactive');
            indicator.textContent = recentActivity.total > 0 ? '\u{1F7E2}' : '\u26AA';
            activityDiv.appendChild(summary);
            activityDiv.appendChild(indicator);

            card.appendChild(header);
            card.appendChild(descDiv);
            card.appendChild(meta);
            card.appendChild(activityDiv);

            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    this.showRepositoryDetails(repo.name);
                }
            });

            grid.appendChild(card);
        });
    }

    /**
     * Get recent activity for a repository
     */
    getRepoRecentActivity(repoName) {
        const commits = this.recentCommits?.filter(c => c.repository === repoName).length || 0;
        const issues = this.recentIssues?.filter(i => i.repository === repoName).length || 0;
        
        return {
            commits,
            issues,
            total: commits + issues
        };
    }

    /**
     * Get filtered activities based on current filters
     */
    getFilteredActivities() {
        const timeRange = this.getTimeRangeDate();
        
        return this.activities.filter(activity => {
            // Time range filter
            if (new Date(activity.created_at) < timeRange) return false;
            
            // Activity type filters
            if (activity.type === 'PushEvent' && !this.filters.commits) return false;
            if (activity.type === 'IssuesEvent' && !this.filters.issues) return false;
            if (activity.type === 'PullRequestEvent' && !this.filters.prs) return false;
            if (activity.type === 'IssueCommentEvent' && !this.filters.comments) return false;
            
            // Repository filters
            if (this.filters.repositories.length > 0) {
                const repoName = activity.repo.split('/')[1];
                if (this.filters.repositories.includes(repoName)) return false;
            }
            
            return true;
        }).slice(0, CONFIG.MAX_ACTIVITIES);
    }

    /**
     * Get time range date based on filter
     */
    getTimeRangeDate() {
        const now = new Date();
        const ranges = {
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        return new Date(now.getTime() - (ranges[this.filters.timeRange] || ranges['24h']));
    }

    /**
     * Apply current filters and refresh display
     */
    applyFilters() {
        this.updateActivityTimeline();
        this.updateRepositoryGrid();
    }

    /**
     * Start live updates
     */
    startLiveUpdates() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.refreshTimer = setInterval(() => {
            if (!this.isPaused && this.isLive) {
                this.refreshData();
            }
        }, CONFIG.REFRESH_INTERVAL);
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            pauseBtn.textContent = '\u25B6\uFE0F Resume';
            this.updateLiveStatus('paused');
        } else {
            pauseBtn.textContent = '\u23F8\uFE0F Pause';
            this.updateLiveStatus('live');
        }
    }

    /**
     * Refresh all data
     */
    async refreshData() {
        if (this.isPaused) return;
        
        this.updateLiveStatus('refreshing');
        
        try {
            await this.loadInitialData();
            this.updateLiveStatus('live');
        } catch (error) {
            console.error('❌ Refresh failed:', error);
            this.updateLiveStatus('error');
        }
    }

    /**
     * Update live status indicator
     */
    updateLiveStatus(status) {
        const indicator = document.getElementById('live-indicator');
        const statusText = document.getElementById('status-text');
        const lastActivityTime = document.getElementById('last-activity-time');
        
        if (!indicator || !statusText) return;
        
        // Remove all status classes
        indicator.className = 'status-indicator';
        
        switch (status) {
            case 'live':
                indicator.classList.add('live');
                statusText.textContent = 'Live';
                break;
            case 'paused':
                indicator.classList.add('paused');
                statusText.textContent = 'Paused';
                break;
            case 'refreshing':
                indicator.classList.add('refreshing');
                statusText.textContent = 'Refreshing...';
                break;
            case 'connecting':
                indicator.classList.add('connecting');
                statusText.textContent = 'Connecting...';
                break;
            case 'error':
                indicator.classList.add('error');
                statusText.textContent = 'Error';
                break;
        }
        
        // Update last activity time
        if (lastActivityTime && this.activities.length > 0) {
            const latestActivity = this.activities[0];
            lastActivityTime.textContent = this.getTimeAgo(latestActivity.created_at);
        }
    }

    /**
     * Show activity details in modal
     */
    showActivityDetails(activity) {
        const modal = document.getElementById('activity-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        if (!modal || !title || !body) return;

        title.textContent = this.formatActivityType(activity.type) + ' - ' + activity.repo;
        body.textContent = '';

        const details = document.createElement('div');
        details.className = 'activity-details';

        const rows = [
            ['Type', this.formatActivityType(activity.type)],
            ['Repository', activity.repo],
            ['Time', new Date(activity.created_at).toLocaleString()],
            ['Actor', activity.actor?.display_login || 'Unknown']
        ];

        rows.forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'detail-row';
            const strong = document.createElement('strong');
            strong.textContent = label + ':';
            row.appendChild(strong);
            row.appendChild(document.createTextNode(' ' + value));
            details.appendChild(row);
        });

        const contentDiv = document.createElement('div');
        contentDiv.className = 'detail-content';
        const detailsLabel = document.createElement('strong');
        detailsLabel.textContent = 'Details:';
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(activity.payload, null, 2);
        contentDiv.appendChild(detailsLabel);
        contentDiv.appendChild(pre);
        details.appendChild(contentDiv);

        body.appendChild(details);
        modal.classList.add('open');
    }

    /**
     * Show repository details
     */
    showRepositoryDetails(repoName) {
        const repo = this.repositories.get(repoName);
        if (!repo) return;
        
        // For now, just open the repository in a new tab
        window.open(repo.html_url, '_blank', 'noopener,noreferrer');
    }

    /**
     * Update repository view (grid/list)
     */
    updateRepoView(view) {
        const grid = document.getElementById('repo-grid');
        if (!grid) return;
        
        grid.className = view === 'list' ? 'repo-list' : 'repo-grid';
    }

    /**
     * Update footer timestamp
     */
    updateFooterTimestamp() {
        const timestamp = document.getElementById('footer-timestamp');
        if (timestamp && this.lastRefresh) {
            timestamp.textContent = this.lastRefresh.toLocaleString();
        }
    }

    // Utility methods
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

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

    formatActivityType(type) {
        const types = {
            'PushEvent': 'Push',
            'IssuesEvent': 'Issue',
            'PullRequestEvent': 'Pull Request',
            'IssueCommentEvent': 'Comment',
            'CreateEvent': 'Create',
            'DeleteEvent': 'Delete',
            'ForkEvent': 'Fork',
            'WatchEvent': 'Watch',
            'ReleaseEvent': 'Release'
        };
        return types[type] || type;
    }

    formatActivityDescription(activity) {
        switch (activity.type) {
            case 'PushEvent':
                const commits = activity.payload?.commits?.length || 0;
                return `Pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
            case 'IssuesEvent':
                return `${activity.payload?.action || 'Updated'} issue #${activity.payload?.issue?.number}`;
            case 'PullRequestEvent':
                return `${activity.payload?.action || 'Updated'} PR #${activity.payload?.pull_request?.number}`;
            case 'IssueCommentEvent':
                return `Commented on #${activity.payload?.issue?.number}`;
            default:
                return activity.payload?.action || 'Activity';
        }
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WatchMeWorkDashboard();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WatchMeWorkDashboard, CONFIG };
}