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
    REPOSITORIES: [], // Will be populated dynamically
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
            label.innerHTML = `
                <input type="checkbox" data-repo="${repo}" checked> 
                ${repo}
            `;
            
            const checkbox = label.querySelector('input');
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
     * Load initial dashboard data from pre-processed static file
     */
    async loadInitialData() {
        console.log('📊 Loading initial dashboard data from static source...');
        
        try {
            // Load pre-processed data from static JSON file
            const dashboardData = await this.loadStaticDashboardData();
            
            if (!dashboardData) {
                throw new Error('No dashboard data available');
            }
            
            console.log('✅ Loaded pre-processed dashboard data');
            console.log(`📊 Data generated: ${dashboardData.metadata?.generated_at || 'unknown'}`);
            console.log(`📈 Activities: ${dashboardData.activities?.length || 0}`);
            console.log(`📦 Repositories: ${dashboardData.repositories?.length || 0}`);
            
            // Process loaded data
            this.processDashboardData(dashboardData);
            
            // Update UI
            this.updateMetrics();
            this.updateActivityTimeline();
            this.updateRepositoryGrid();
            
            this.lastRefresh = new Date(dashboardData.metadata?.generated_at || new Date());
            this.updateFooterTimestamp();
            
            // Update repository list for filters
            CONFIG.REPOSITORIES = dashboardData.repositories?.map(repo => repo.name) || [];
            this.initializeFilters();
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.showErrorState(error);
        }
    }

    /**
     * Load static dashboard data from pre-processed JSON file
     */
    async loadStaticDashboardData() {
        try {
            console.log('📁 Loading static dashboard data...');
            
            const response = await fetch('data/watch-me-work-data.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Could not load dashboard data`);
            }
            
            const data = await response.json();
            console.log(`📊 Loaded dashboard data (generated: ${data.metadata?.generated_at || 'unknown'})`);
            
            return data;
        } catch (error) {
            console.warn('⚠️ Could not load static dashboard data:', error.message);
            
            // Fallback: try to load from alternative locations
            const fallbackUrls = [
                './data/watch-me-work-data.json',
                '../data/watch-me-work-data.json'
            ];
            
            for (const url of fallbackUrls) {
                try {
                    console.log(`🔄 Trying fallback location: ${url}`);
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ Loaded from fallback: ${url}`);
                        return data;
                    }
                } catch (fallbackError) {
                    console.warn(`⚠️ Fallback failed for ${url}:`, fallbackError.message);
                }
            }
            
            return null;
        }
    }

    /**
     * Process dashboard data from static file
     */
    processDashboardData(dashboardData) {
        // Extract data components
        this.metadata = dashboardData.metadata || {};
        this.userInfo = dashboardData.user || {};
        this.precomputedMetrics = dashboardData.metrics || {};
        this.activities = dashboardData.activities || [];
        this.repositories = new Map();
        this.recentCommits = dashboardData.recent_commits || [];
        this.recentIssues = dashboardData.recent_issues || [];
        this.timeline = dashboardData.timeline || [];
        
        // Process repositories
        if (dashboardData.repositories) {
            dashboardData.repositories.forEach(repo => {
                this.repositories.set(repo.name, repo);
            });
        }
        
        console.log(`✅ Processed dashboard data: ${this.activities.length} activities, ${this.repositories.size} repositories`);
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
     * Update live metrics display using pre-computed data
     */
    updateMetrics() {
        // Use pre-computed metrics if available, otherwise calculate
        const metrics = this.precomputedMetrics || {};
        
        const commitsThisWeek = metrics.commits_this_week || metrics.commits_today || 0;
        const streakDays = metrics.streak_days || 0;
        const velocityScore = metrics.velocity_score || 0;
        const focusTime = metrics.focus_time || 0;
        
        // Update UI
        this.updateElement('commits-today', commitsThisWeek);
        this.updateElement('streak-days', streakDays);
        this.updateElement('velocity-score', velocityScore);
        this.updateElement('focus-time', `${focusTime}h`);
        
        console.log(`📊 Updated metrics: ${commitsThisWeek} commits this week, ${streakDays} day streak, ${velocityScore} velocity`);
    }

    /**
     * Show error state when data loading fails
     */
    showErrorState(error) {
        console.error('📊 Showing error state:', error);
        
        // Update status
        this.updateLiveStatus('error');
        
        // Show error in timeline
        const container = document.getElementById('timeline-container');
        if (container) {
            container.innerHTML = `
                <div class="timeline-error">
                    <div class="error-icon">⚠️</div>
                    <h3>Data Loading Failed</h3>
                    <p>Could not load dashboard data. This is likely due to:</p>
                    <ul>
                        <li>The data processing pipeline hasn't run yet</li>
                        <li>Network connectivity issues</li>
                        <li>Missing or corrupted data files</li>
                    </ul>
                    <p class="error-detail">Error: ${error.message}</p>
                    <button class="btn-primary" onclick="location.reload()">🔄 Retry</button>
                </div>
            `;
        }
        
        // Show error in repository grid
        const grid = document.getElementById('repo-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="repo-error">
                    <p>📦 Repository data unavailable</p>
                    <p>Please try refreshing the page or check back later.</p>
                </div>
            `;
        }
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
     * Update activity timeline using processed timeline data
     */
    updateActivityTimeline() {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        // Use the pre-built timeline from processed data
        const timelineData = this.timeline || this.activities || [];
        const filteredActivities = this.getFilteredTimelineItems(timelineData);
        
        if (filteredActivities.length === 0) {
            container.innerHTML = `
                <div class="timeline-empty">
                    <div class="empty-icon">📭</div>
                    <p>No recent activity found</p>
                    <p class="empty-subtitle">Try adjusting your filters or time range</p>
                </div>
            `;
            return;
        }

        const timelineHTML = filteredActivities.map(item => {
            const icon = item._icon || this.getActivityIcon(item.type);
            const color = item._color || CONFIG.COLORS[item.type] || '#6b7280';
            const timeAgo = this.getTimeAgo(item.timestamp || item.created_at);
            const description = item._formatted || this.formatActivityDescription(item);
            
            return `
                <div class="timeline-item" data-activity-id="${item.id}">
                    <div class="timeline-marker" style="background-color: ${color}">
                        ${icon}
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="activity-type">${this.formatActivityType(item.type || item.subtype)}</span>
                            <span class="activity-repo">${item.repo}</span>
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                        <div class="timeline-description">
                            ${description}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = timelineHTML;

        // Add click handlers for timeline items
        container.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', () => {
                const activityId = item.dataset.activityId;
                const activity = filteredActivities.find(a => a.id === activityId);
                if (activity) {
                    this.showActivityDetails(activity);
                }
            });
        });
        
        console.log(`🕐 Updated activity timeline with ${filteredActivities.length} items`);
    }

    /**
     * Update repository grid using processed data
     */
    updateRepositoryGrid() {
        const grid = document.getElementById('repo-grid');
        if (!grid) return;

        const repoArray = Array.from(this.repositories.values())
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        if (repoArray.length === 0) {
            grid.innerHTML = `
                <div class="repo-empty">
                    <div class="empty-icon">📦</div>
                    <p>No repositories found</p>
                    <p class="empty-subtitle">Repository data may still be loading</p>
                </div>
            `;
            return;
        }

        const gridHTML = repoArray.map(repo => {
            const lastUpdate = this.getTimeAgo(repo.updated_at);
            const recentActivity = repo.recent_activity || { commits: 0, issues: 0, total: 0 };
            
            return `
                <div class="repo-card" data-repo="${repo.name}">
                    <div class="repo-header">
                        <h3 class="repo-name">
                            <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                            ${repo._is_fork_with_activity ? '<span class="fork-badge">🍴 Active Fork</span>' : ''}
                            ${repo._is_main_repo ? '<span class="main-badge">⭐ Main</span>' : ''}
                        </h3>
                        <div class="repo-stats">
                            <span class="repo-stat">⭐ ${repo.stars || 0}</span>
                            <span class="repo-stat">🍴 ${repo.forks || 0}</span>
                        </div>
                    </div>
                    
                    <div class="repo-description">
                        ${repo.description || 'No description available'}
                    </div>
                    
                    <div class="repo-meta">
                        ${repo.language ? `<span class="repo-language">${repo.language}</span>` : ''}
                        <span class="repo-updated">Updated ${lastUpdate}</span>
                    </div>
                    
                    <div class="repo-activity">
                        <div class="activity-summary">
                            ${recentActivity.commits} commits, ${recentActivity.issues} issues
                        </div>
                        <div class="activity-indicator ${recentActivity.total > 0 ? 'active' : 'inactive'}">
                            ${recentActivity.total > 0 ? '🟢' : '⚪'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = gridHTML;

        // Add click handlers for repo cards
        grid.querySelectorAll('.repo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    const repoName = card.dataset.repo;
                    this.showRepositoryDetails(repoName);
                }
            });
        });
        
        console.log(`📦 Updated repository grid with ${repoArray.length} repositories`);
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
     * Get filtered timeline items based on current filters
     */
    getFilteredTimelineItems(timelineData) {
        const timeRange = this.getTimeRangeDate();
        
        return timelineData.filter(item => {
            const timestamp = new Date(item.timestamp || item.created_at);
            
            // Time range filter
            if (timestamp < timeRange) return false;
            
            // Activity type filters
            const itemType = item.type || item.subtype;
            if ((itemType === 'PushEvent' || itemType === 'commit') && !this.filters.commits) return false;
            if ((itemType === 'IssuesEvent' || itemType === 'issue') && !this.filters.issues) return false;
            if ((itemType === 'PullRequestEvent' || itemType === 'pull_request') && !this.filters.prs) return false;
            if (itemType === 'IssueCommentEvent' && !this.filters.comments) return false;
            
            // Repository filters
            if (this.filters.repositories.length > 0) {
                const repoName = item.repo || (item.repo_full_name && item.repo_full_name.split('/')[1]);
                if (this.filters.repositories.includes(repoName)) return false;
            }
            
            return true;
        }).slice(0, CONFIG.MAX_ACTIVITIES);
    }

    /**
     * Get filtered activities based on current filters (legacy method for compatibility)
     */
    getFilteredActivities() {
        return this.getFilteredTimelineItems(this.activities);
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
            pauseBtn.innerHTML = '▶️ Resume';
            this.updateLiveStatus('paused');
        } else {
            pauseBtn.innerHTML = '⏸️ Pause';
            this.updateLiveStatus('live');
        }
    }

    /**
     * Refresh all data by reloading static data
     */
    async refreshData() {
        if (this.isPaused) return;
        
        this.updateLiveStatus('refreshing');
        
        try {
            console.log('🔄 Refreshing dashboard data...');
            await this.loadInitialData();
            this.updateLiveStatus('live');
            console.log('✅ Dashboard data refreshed successfully');
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
        
        title.textContent = `${this.formatActivityType(activity.type)} - ${activity.repo}`;
        
        body.innerHTML = `
            <div class="activity-details">
                <div class="detail-row">
                    <strong>Type:</strong> ${this.formatActivityType(activity.type)}
                </div>
                <div class="detail-row">
                    <strong>Repository:</strong> <a href="https://github.com/${activity.repo}" target="_blank">${activity.repo}</a>
                </div>
                <div class="detail-row">
                    <strong>Time:</strong> ${new Date(activity.created_at).toLocaleString()}
                </div>
                <div class="detail-row">
                    <strong>Actor:</strong> ${activity.actor?.display_login || 'Unknown'}
                </div>
                <div class="detail-content">
                    <strong>Description:</strong>
                    <p>${this.formatActivityDescription(activity)}</p>
                    ${this.getActivityExtraDetails(activity)}
                </div>
            </div>
        `;
        
        modal.classList.add('open');
    }

    /**
     * Show repository details
     */
    showRepositoryDetails(repoName) {
        const repo = this.repositories.get(repoName);
        if (!repo) return;
        
        // For now, just open the repository in a new tab
        window.open(repo.html_url, '_blank');
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

    getActivityExtraDetails(activity) {
        switch (activity.type) {
            case 'PushEvent':
                const commits = activity.payload?.commits || [];
                if (commits.length === 0) return '';
                
                const commitsList = commits.map(commit => 
                    `<li><code>${commit.sha?.slice(0, 7) || 'unknown'}</code> ${commit.message}</li>`
                ).join('');
                
                return `
                    <div class="commits-list">
                        <strong>Commits:</strong>
                        <ul>${commitsList}</ul>
                    </div>
                `;
                
            case 'IssuesEvent':
            case 'PullRequestEvent':
                const item = activity.payload?.issue || activity.payload?.pull_request;
                if (!item) return '';
                
                return `
                    <div class="issue-details">
                        <strong>Labels:</strong> ${item.labels?.map(l => `<span class="label">${l.name}</span>`).join(' ') || 'None'}
                        ${item.body ? `<div class="body-preview"><strong>Description:</strong><p>${item.body.slice(0, 200)}${item.body.length > 200 ? '...' : ''}</p></div>` : ''}
                    </div>
                `;
                
            case 'ReleaseEvent':
                const release = activity.payload?.release;
                if (!release) return '';
                
                return `
                    <div class="release-details">
                        <strong>Tag:</strong> ${release.tag_name || 'Unknown'}
                        <strong>Downloads:</strong> ${release.assets?.length || 0} assets
                        ${release.body ? `<div class="body-preview"><strong>Release Notes:</strong><p>${release.body.slice(0, 200)}${release.body.length > 200 ? '...' : ''}</p></div>` : ''}
                    </div>
                `;
                
            default:
                return '';
        }
    }

    formatActivityDescription(activity) {
        switch (activity.type) {
            case 'PushEvent':
                const commits = activity.payload?.commits?.length || 0;
                const commitMessages = activity.payload?.commits?.map(c => c.message).slice(0, 2) || [];
                let description = `Pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
                if (commitMessages.length > 0) {
                    description += `: ${commitMessages[0]}`;
                    if (commits > 1) description += ` (and ${commits - 1} more)`;
                }
                return description;
                
            case 'IssuesEvent':
                const action = activity.payload?.action || 'updated';
                const issueTitle = activity.payload?.issue?.title || 'Unknown issue';
                const issueNumber = activity.payload?.issue?.number || '';
                return `${action.charAt(0).toUpperCase() + action.slice(1)} issue #${issueNumber}: ${issueTitle}`;
                
            case 'PullRequestEvent':
                const prAction = activity.payload?.action || 'updated';
                const prTitle = activity.payload?.pull_request?.title || 'Unknown PR';
                const prNumber = activity.payload?.pull_request?.number || '';
                return `${prAction.charAt(0).toUpperCase() + prAction.slice(1)} PR #${prNumber}: ${prTitle}`;
                
            case 'IssueCommentEvent':
                const commentIssue = activity.payload?.issue?.title || 'Unknown issue';
                const commentNumber = activity.payload?.issue?.number || '';
                return `Commented on issue #${commentNumber}: ${commentIssue}`;
                
            case 'CreateEvent':
                const refType = activity.payload?.ref_type || 'repository';
                const refName = activity.payload?.ref || activity.repo?.split('/')[1] || '';
                return `Created ${refType}${refName ? `: ${refName}` : ''}`;
                
            case 'DeleteEvent':
                const deletedRefType = activity.payload?.ref_type || 'branch';
                const deletedRef = activity.payload?.ref || '';
                return `Deleted ${deletedRefType}${deletedRef ? `: ${deletedRef}` : ''}`;
                
            case 'ForkEvent':
                const forkee = activity.payload?.forkee?.full_name || '';
                return `Forked repository${forkee ? ` to ${forkee}` : ''}`;
                
            case 'WatchEvent':
                return 'Starred repository';
                
            case 'ReleaseEvent':
                const releaseName = activity.payload?.release?.name || activity.payload?.release?.tag_name || '';
                return `Published release${releaseName ? `: ${releaseName}` : ''}`;
                
            default:
                return `Activity on ${activity.repo?.split('/')[1] || 'repository'}`;
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