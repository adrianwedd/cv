/**
 * Watch Me Work Dashboard - Live Development Activity Tracker
 *
 * Loads pre-generated data from the CI activity tracker pipeline,
 * with fallback to the public GitHub API (rate-limited to 60 req/hr).
 */

const CONFIG = {
    GITHUB_API: 'https://api.github.com',
    USERNAME: 'adrianwedd',
    REFRESH_INTERVAL: 120000, // 2 minutes (static data doesn't change fast)
    MAX_ACTIVITIES: 100,
    STATIC_DATA: {
        ACTIVITY_SUMMARY: 'data/activity-summary.json',
        ACTIVITY_PREFIX: 'data/activity/',
        METRICS_PREFIX: 'data/metrics/',
        TRENDS_PREFIX: 'data/trends/'
    },
    THEME_KEY: 'cv-theme'
};

class WatchMeWorkDashboard {
    constructor() {
        this.isLive = true;
        this.isPaused = false;
        this.activities = [];
        this.repositories = new Map();
        this.recentCommits = [];
        this.recentIssues = [];
        this.filters = {
            commits: true,
            issues: true,
            prs: true,
            comments: true,
            timeRange: '30d',
            repositories: [], // excluded repos (unchecked)
            searchQuery: '',
            onlyActiveRepos: false
        };
        this.lastRefresh = null;
        this.refreshTimer = null;
        this.dataSource = 'unknown';

        this.themePreference = localStorage.getItem(CONFIG.THEME_KEY) || 'dark';

        this.init();
    }

    async init() {
        console.log('Initializing Watch Me Work Dashboard...');

        this.applyTheme(this.themePreference);
        this.setupThemeToggle();

        try {
            this.loadFiltersFromURL();
            this.setupEventListeners();
            this.updateLiveStatus('connecting');

            await this.loadData();
            this.initializeRepoFilters();
            this.syncFilterControlsFromState();
            this.startLiveUpdates();

            this.updateLiveStatus('live');
            console.log(`Dashboard initialized (source: ${this.dataSource})`);
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.updateLiveStatus('error');
        }
    }

    setupEventListeners() {
        const filterToggle = document.getElementById('filter-toggle');
        const filtersPanel = document.getElementById('filters-panel');
        filterToggle?.addEventListener('click', () => {
            filtersPanel.classList.toggle('open');
        });

        document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.refreshData());

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateRepoView(e.target.dataset.view);
            });
        });

        const modalClose = document.getElementById('modal-close');
        const modal = document.getElementById('activity-modal');
        modalClose?.addEventListener('click', () => modal.classList.remove('open'));

        ['commits', 'issues', 'prs', 'comments'].forEach(type => {
            document.getElementById(`filter-${type}`)?.addEventListener('change', (e) => {
                this.filters[type] = e.target.checked;
                this.applyFilters();
            });
        });

        document.getElementById('time-range')?.addEventListener('change', (e) => {
            this.filters.timeRange = e.target.value;
            this.applyFilters();
        });

        const searchInput = document.getElementById('search-query');
        let searchDebounce;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchDebounce);
            const val = String(e.target.value || '');
            searchDebounce = setTimeout(() => {
                this.filters.searchQuery = val;
                this.applyFilters();
            }, 120);
        });

        document.getElementById('filter-active-repos')?.addEventListener('change', (e) => {
            this.filters.onlyActiveRepos = !!e.target.checked;
            this.applyFilters();
        });

        document.getElementById('close-preview')?.addEventListener('click', () => {
            document.getElementById('code-preview').style.display = 'none';
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.themePreference = this.themePreference === 'dark' ? 'light' : 'dark';
                this.applyTheme(this.themePreference);
                localStorage.setItem(CONFIG.THEME_KEY, this.themePreference);
                const icon = document.querySelector('.theme-icon');
                if (icon) icon.textContent = this.themePreference === 'dark' ? '\u2600' : '\u263E';
            });

            if (themeIcon) {
                themeIcon.textContent = this.themePreference === 'dark' ? '\u2600' : '\u263E';
            }
        }
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    /**
     * Load data: try static CI data first, fall back to live API
     */
    async loadData() {
        try {
            await this.loadStaticData();
            this.dataSource = 'static';
        } catch (error) {
            console.warn('Static data unavailable, trying live API...', error.message);
            try {
                await this.loadLiveData();
                this.dataSource = 'api';
            } catch (apiError) {
                console.error('Both data sources failed:', apiError.message);
                this.dataSource = 'none';
            }
        }

        this.updateMetrics();
        this.updateActivityTimeline();
        this.updateRepositoryGrid();
        this.lastRefresh = new Date();
        this.updateFooterTimestamp();
    }

    /**
     * Load pre-generated static data from CI pipeline
     */
    async loadStaticData() {
        const summaryResp = await fetch(CONFIG.STATIC_DATA.ACTIVITY_SUMMARY);
        if (!summaryResp.ok) throw new Error(`Summary: HTTP ${summaryResp.status}`);
        const summary = await summaryResp.json();

        // Load detailed activity file
        const activityFile = summary.data_files?.latest_activity;
        if (!activityFile) throw new Error('No activity file reference');

        const activityResp = await fetch(CONFIG.STATIC_DATA.ACTIVITY_PREFIX + activityFile);
        if (!activityResp.ok) throw new Error(`Activity: HTTP ${activityResp.status}`);
        const activityData = await activityResp.json();

        // Load metrics
        const metricsFile = summary.data_files?.latest_metrics;
        let metricsData = null;
        if (metricsFile) {
            try {
                const metricsResp = await fetch(CONFIG.STATIC_DATA.METRICS_PREFIX + metricsFile);
                if (metricsResp.ok) metricsData = await metricsResp.json();
            } catch (_) { /* optional */ }
        }

        // Load trends
        const trendsFile = summary.data_files?.latest_trends;
        let trendsData = null;
        if (trendsFile) {
            try {
                const trendsResp = await fetch(CONFIG.STATIC_DATA.TRENDS_PREFIX + trendsFile);
                if (trendsResp.ok) trendsData = await trendsResp.json();
            } catch (_) { /* optional */ }
        }

        // Process static data into dashboard format
        this.processStaticData(summary, activityData, metricsData, trendsData);
    }

    processStaticData(summary, activityData, metricsData, trendsData) {
        // Process events from the activity data
        const events = activityData.recent_activity?.events || [];
        this.activities = events.map(event => ({
            id: event.id,
            type: event.type,
            repo: event.repo?.name || 'unknown',
            created_at: event.created_at,
            payload: event.payload,
            actor: event.actor,
            public: event.public
        }));

        // Process repositories
        const repos = activityData.repositories?.data || [];
        this.repositories.clear();
        repos.forEach(repo => {
            if (repo.name) {
                this.repositories.set(repo.name, {
                    name: repo.name,
                    full_name: repo.full_name,
                    description: repo.description,
                    language: repo.language,
                    stars: repo.stargazers_count || 0,
                    forks: repo.forks_count || 0,
                    updated_at: repo.updated_at,
                    html_url: repo.html_url,
                    private: repo.private
                });
            }
        });

        // Store summary and metrics for metric display
        this.summaryData = summary.summary || {};
        this.metricsData = metricsData;
        this.trendsData = trendsData;
        this.languageData = activityData.repositories?.summary?.languages || [];

        // Build commit list from events
        this.recentCommits = [];
        this.activities.filter(a => a.type === 'PushEvent').forEach(event => {
            const commits = event.payload?.commits || [];
            const repoName = event.repo?.split('/')[1] || event.repo;
            commits.forEach(c => {
                this.recentCommits.push({
                    sha: c.sha,
                    message: c.message,
                    author: { date: event.created_at },
                    repository: repoName,
                    html_url: c.url,
                    created_at: event.created_at
                });
            });
        });

        // Build issues list from events
        this.recentIssues = [];
        this.activities.filter(a => a.type === 'IssuesEvent' || a.type === 'PullRequestEvent').forEach(event => {
            const issue = event.payload?.issue || event.payload?.pull_request;
            if (issue) {
                const repoName = event.repo?.split('/')[1] || event.repo;
                this.recentIssues.push({
                    id: issue.id,
                    number: issue.number,
                    title: issue.title,
                    state: issue.state,
                    type: event.type === 'PullRequestEvent' ? 'pull_request' : 'issue',
                    repository: repoName,
                    html_url: issue.html_url,
                    created_at: issue.created_at,
                    updated_at: issue.updated_at,
                    labels: issue.labels || []
                });
            }
        });
    }

    /**
     * Fallback: load from live GitHub API
     */
    async loadLiveData() {
        const [events, repos] = await Promise.all([
            this.fetchJSON(`${CONFIG.GITHUB_API}/users/${CONFIG.USERNAME}/events/public?per_page=100`, { cacheMode: 'etag' }),
            this.fetchAllRepos()
        ]);

        this.activities = (events || []).map(event => ({
            id: event.id,
            type: event.type,
            repo: event.repo?.name || 'unknown',
            created_at: event.created_at,
            payload: event.payload,
            actor: event.actor,
            public: event.public
        }));

        this.repositories.clear();
        (repos || []).forEach(repo => {
            this.repositories.set(repo.name, {
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count || 0,
                forks: repo.forks_count || 0,
                updated_at: repo.updated_at,
                html_url: repo.html_url,
                private: repo.private
            });
        });

        this.recentCommits = [];
        this.recentIssues = [];
        this.summaryData = {};
        this.metricsData = null;
        this.trendsData = null;
    }

    async fetchAllRepos() {
        const allRepos = [];
        let page = 1;
        const maxPages = 5; // safety cap: 500 repos
        while (page <= maxPages) {
            const url = `${CONFIG.GITHUB_API}/users/${CONFIG.USERNAME}/repos?per_page=100&sort=updated&page=${page}`;
            const batch = await this.fetchJSON(url, { cacheMode: 'etag' });
            if (!batch || batch.length === 0) break;
            allRepos.push(...batch);
            if (batch.length < 100) break;
            page++;
        }
        return allRepos;
    }

    async fetchJSON(url, { cacheMode = 'none', ttlMs = 5 * 60 * 1000 } = {}) {
        if (cacheMode !== 'etag') {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        }

        const cacheKey = `wmw:${this.hashString(url)}`;
        const etagKey = `${cacheKey}:etag`;
        const bodyKey = `${cacheKey}:body`;
        const timeKey = `${cacheKey}:time`;

        const cachedEtag = localStorage.getItem(etagKey) || '';
        const cachedBody = localStorage.getItem(bodyKey) || '';
        const cachedTime = Number(localStorage.getItem(timeKey) || '0');
        const isFresh = cachedTime && (Date.now() - cachedTime) < ttlMs;

        const headers = new Headers();
        // For public endpoints, unauthenticated requests are fine but rate-limited.
        headers.set('Accept', 'application/vnd.github+json');
        if (cachedEtag && isFresh) headers.set('If-None-Match', cachedEtag);

        let response;
        try {
            response = await fetch(url, { headers });
        } catch (err) {
            // If offline/blocked, serve stale cache if we have it.
            if (cachedBody) return JSON.parse(cachedBody);
            throw err;
        }

        if (response.status === 304 && cachedBody) {
            return JSON.parse(cachedBody);
        }
        if (!response.ok) {
            if (cachedBody) return JSON.parse(cachedBody);
            throw new Error(`HTTP ${response.status}`);
        }

        const bodyText = await response.text();
        const etag = response.headers.get('ETag') || response.headers.get('Etag') || '';
        if (etag) localStorage.setItem(etagKey, etag);
        localStorage.setItem(bodyKey, bodyText);
        localStorage.setItem(timeKey, String(Date.now()));
        return JSON.parse(bodyText);
    }

    updateMetrics() {
        // Use static summary data when available
        if (this.summaryData?.total_commits != null) {
            this.updateElement('commits-today', this.summaryData.total_commits);
            this.updateElement('streak-days', this.summaryData.active_days || 0);

            this.updateElement('repositories-count', this.repositories.size);

            this.updateElement('languages-count', this.languageData?.length || 0);
            return;
        }

        // Fallback: derive from live API data
        const since = this.getTimeRangeDate();
        const recentActivities = this.activities.filter(a => new Date(a.created_at) >= since);

        // Count pushes as proxy for commits when commit details unavailable
        const pushCount = recentActivities.filter(a => a.type === 'PushEvent').length;
        const commitCount = this.recentCommits.filter(c => new Date(c.created_at) >= since).length;
        this.updateElement('commits-today', commitCount || pushCount);

        // Active days from all activity, not just commits
        this.updateElement('streak-days', this.calculateActiveDays(recentActivities));

        this.updateElement('repositories-count', this.repositories.size);

        // Count unique languages from repos
        const languages = new Set();
        this.repositories.forEach(repo => { if (repo.language) languages.add(repo.language); });
        this.updateElement('languages-count', languages.size);
    }

    calculateActiveDays(activities) {
        if (!activities || activities.length === 0) return 0;
        const dates = new Set();
        activities.forEach(a => {
            dates.add(new Date(a.created_at).toISOString().split('T')[0]);
        });
        return dates.size;
    }

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
            iconDiv.textContent = '\u2014';

            const p1 = document.createElement('p');
            p1.textContent = 'No recent activity found';

            const p2 = document.createElement('p');
            p2.className = 'empty-subtitle';
            p2.textContent = this.dataSource === 'none'
                ? 'Data unavailable — check back later'
                : 'Try adjusting your filters or time range';

            empty.append(iconDiv, p1, p2);
            container.appendChild(empty);
            return;
        }

        filteredActivities.forEach(activity => {
            const icon = this.getActivityIcon(activity.type);
            const timeAgo = this.getTimeAgo(activity.created_at);

            const item = document.createElement('div');
            item.className = 'timeline-item';

            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
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

            header.append(typeSpan, repoSpan, timeSpan);

            const desc = document.createElement('div');
            desc.className = 'timeline-description';
            desc.textContent = this.formatActivityDescription(activity);

            content.append(header, desc);
            item.append(marker, content);

            item.addEventListener('click', () => this.showActivityDetails(activity));
            container.appendChild(item);
        });
    }

    updateRepositoryGrid() {
        const grid = document.getElementById('repo-grid');
        if (!grid) return;

        const repoArray = Array.from(this.repositories.values())
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        grid.textContent = '';

        repoArray.forEach(repo => {
            const recentActivity = this.getRepoRecentActivity(repo.name);
            if (this.filters.onlyActiveRepos && recentActivity.total === 0) return;

            const lastUpdate = this.getTimeAgo(repo.updated_at);

            const card = document.createElement('div');
            card.className = 'repo-card';

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
            starStat.textContent = repo.stars + ' stars';

            const forkStat = document.createElement('span');
            forkStat.className = 'repo-stat';
            forkStat.textContent = repo.forks + ' forks';

            stats.append(starStat, forkStat);
            header.append(h3, stats);

            const descDiv = document.createElement('div');
            descDiv.className = 'repo-description';
            descDiv.textContent = repo.description || 'No description available';

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

            const activityDiv = document.createElement('div');
            activityDiv.className = 'repo-activity';

            const summary = document.createElement('div');
            summary.className = 'activity-summary';
            summary.textContent = recentActivity.commits + ' commits, ' + recentActivity.issues + ' issues';

            const indicator = document.createElement('div');
            indicator.className = 'activity-indicator ' + (recentActivity.total > 0 ? 'active' : 'inactive');
            indicator.textContent = recentActivity.total > 0 ? 'active' : 'idle';

            activityDiv.append(summary, indicator);
            card.append(header, descDiv, meta, activityDiv);

            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    window.open(repo.html_url, '_blank', 'noopener,noreferrer');
                }
            });

            grid.appendChild(card);
        });
    }

    getRepoRecentActivity(repoName) {
        const since = this.getTimeRangeDate();
        // Count push events to this repo (commits array may be empty from public API)
        const pushes = this.activities.filter(a =>
            a.type === 'PushEvent' &&
            (a.repo === repoName || a.repo.endsWith('/' + repoName)) &&
            new Date(a.created_at) >= since
        ).length;
        const commits = this.recentCommits.filter(c => c.repository === repoName && new Date(c.created_at) >= since).length;
        const issues = this.recentIssues.filter(i => i.repository === repoName && new Date(i.updated_at) >= since).length;
        const effectiveCommits = commits || pushes;
        return { commits: effectiveCommits, issues, total: effectiveCommits + issues };
    }

    getFilteredActivities() {
        const timeRange = this.getTimeRangeDate();
        const q = String(this.filters.searchQuery || '').trim().toLowerCase();

        return this.activities.filter(activity => {
            if (new Date(activity.created_at) < timeRange) return false;
            if (activity.type === 'PushEvent' && !this.filters.commits) return false;
            if (activity.type === 'IssuesEvent' && !this.filters.issues) return false;
            if (activity.type === 'PullRequestEvent' && !this.filters.prs) return false;
            if (activity.type === 'IssueCommentEvent' && !this.filters.comments) return false;

            if (this.filters.repositories.length > 0) {
                const repoName = activity.repo.split('/')[1];
                if (this.filters.repositories.includes(repoName)) return false;
            }

            if (q) {
                const haystack = this.activitySearchText(activity);
                if (!haystack.includes(q)) return false;
            }

            return true;
        }).slice(0, CONFIG.MAX_ACTIVITIES);
    }

    getTimeRangeDate() {
        const ranges = {
            '1h': 3600000,
            '6h': 21600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        return new Date(Date.now() - (ranges[this.filters.timeRange] || ranges['30d']));
    }

    applyFilters() {
        this.updateActivityTimeline();
        this.updateRepositoryGrid();
        this.saveFiltersToURL();
    }

    startLiveUpdates() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        this.refreshTimer = setInterval(() => {
            if (!this.isPaused && this.isLive) this.refreshData();
        }, CONFIG.REFRESH_INTERVAL);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        if (this.isPaused) {
            pauseBtn.textContent = 'Resume';
            this.updateLiveStatus('paused');
        } else {
            pauseBtn.textContent = 'Pause';
            this.updateLiveStatus('live');
        }
    }

    async refreshData() {
        if (this.isPaused) return;
        this.updateLiveStatus('refreshing');
        try {
            await this.loadData();
            this.updateLiveStatus('live');
        } catch (error) {
            console.error('Refresh failed:', error);
            this.updateLiveStatus('error');
        }
    }

    updateLiveStatus(status) {
        const indicator = document.getElementById('live-indicator');
        const statusText = document.getElementById('status-text');
        const lastActivityTime = document.getElementById('last-activity-time');

        if (!indicator || !statusText) return;

        indicator.className = 'status-indicator';

        const labels = {
            live: 'Live',
            paused: 'Paused',
            refreshing: 'Refreshing...',
            connecting: 'Connecting...',
            error: 'Error'
        };

        indicator.classList.add(status);
        statusText.textContent = labels[status] || status;

        if (lastActivityTime && this.activities.length > 0) {
            lastActivityTime.textContent = this.getTimeAgo(this.activities[0].created_at);
        }
    }

    showActivityDetails(activity) {
        const modal = document.getElementById('activity-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        if (!modal || !title || !body) return;

        title.textContent = this.formatActivityType(activity.type) + ' - ' + activity.repo;
        body.textContent = '';

        const details = document.createElement('div');
        details.className = 'activity-details';

        [
            ['Type', this.formatActivityType(activity.type)],
            ['Repository', activity.repo],
            ['Time', new Date(activity.created_at).toLocaleString()],
            ['Actor', activity.actor?.display_login || 'Unknown']
        ].forEach(([label, value]) => {
            const row = document.createElement('div');
            row.className = 'detail-row';
            const strong = document.createElement('strong');
            strong.textContent = label + ':';
            row.append(strong, document.createTextNode(' ' + value));
            details.appendChild(row);
        });

        const contentDiv = document.createElement('div');
        contentDiv.className = 'detail-content';
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(activity.payload, null, 2);
        const detailsLabel = document.createElement('strong');
        detailsLabel.textContent = 'Details:';
        contentDiv.append(detailsLabel, pre);
        details.appendChild(contentDiv);

        if (activity.type === 'PushEvent') {
            const linksBox = document.createElement('div');
            linksBox.className = 'detail-content';

            const label = document.createElement('strong');
            label.textContent = 'Commits:';
            linksBox.appendChild(label);

            const commits = activity.payload?.commits || [];
            if (!Array.isArray(commits) || commits.length === 0) {
                const none = document.createElement('div');
                none.textContent = 'No commit list available in event payload.';
                linksBox.appendChild(none);
            } else {
                const list = document.createElement('div');
                list.style.marginTop = '0.5rem';
                list.style.display = 'flex';
                list.style.flexDirection = 'column';
                list.style.gap = '0.35rem';

                commits.slice(0, 10).forEach(c => {
                    const shaFull = String(c.sha || '');
                    const shaShort = shaFull.slice(0, 7);
                    const msg = String(c.message || '').split('\n')[0];

                    const a = document.createElement('a');
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.textContent = `${shaShort} ${msg}`;
                    a.href = this.getCommitHtmlURL(activity.repo, shaFull);
                    list.appendChild(a);
                });

                linksBox.appendChild(list);
            }

            details.appendChild(linksBox);
        }

        body.appendChild(details);
        modal.classList.add('open');
    }

    updateRepoView(view) {
        const grid = document.getElementById('repo-grid');
        if (grid) grid.className = view === 'list' ? 'repo-list' : 'repo-grid';
    }

    updateFooterTimestamp() {
        const timestamp = document.getElementById('footer-timestamp');
        if (timestamp && this.lastRefresh) {
            timestamp.textContent = this.lastRefresh.toLocaleString();
        }
    }

    // Utilities
    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    getActivityIcon(type) {
        const icons = {
            PushEvent: '\u2191',
            IssuesEvent: '\u25CB',
            PullRequestEvent: '\u21C4',
            IssueCommentEvent: '\u2014',
            CreateEvent: '+',
            DeleteEvent: '\u00D7',
            ForkEvent: '\u2442',
            WatchEvent: '\u2022',
            ReleaseEvent: '\u2713'
        };
        return icons[type] || '\u2022';
    }

    formatActivityType(type) {
        const types = {
            PushEvent: 'Push',
            IssuesEvent: 'Issue',
            PullRequestEvent: 'Pull Request',
            IssueCommentEvent: 'Comment',
            CreateEvent: 'Create',
            DeleteEvent: 'Delete',
            ForkEvent: 'Fork',
            WatchEvent: 'Watch',
            ReleaseEvent: 'Release'
        };
        return types[type] || type;
    }

    formatActivityDescription(activity) {
        switch (activity.type) {
            case 'PushEvent': {
                const commits = activity.payload?.commits?.length ||
                    activity.payload?.distinct_size ||
                    activity.payload?.size || 0;
                if (commits === 0) {
                    const branch = (activity.payload?.ref || '').replace('refs/heads/', '');
                    return branch ? `Pushed to ${branch}` : 'Pushed commits';
                }
                return `Pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
            }
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
        const diffInSeconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return new Date(dateString).toLocaleDateString();
    }

    initializeRepoFilters() {
        const repoFilters = document.getElementById('repo-filters');
        if (!repoFilters) return;
        repoFilters.textContent = '';

        const repos = Array.from(this.repositories.keys()).sort((a, b) => a.localeCompare(b));
        repos.forEach(repo => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.repo = repo;
            checkbox.checked = !this.filters.repositories.includes(repo);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + repo));

            checkbox.addEventListener('change', (e) => {
                const isChecked = !!e.target.checked;
                if (isChecked) {
                    this.filters.repositories = this.filters.repositories.filter(r => r !== repo);
                } else if (!this.filters.repositories.includes(repo)) {
                    this.filters.repositories.push(repo);
                }
                this.applyFilters();
            });

            repoFilters.appendChild(label);
        });
    }

    syncFilterControlsFromState() {
        const searchInput = document.getElementById('search-query');
        if (searchInput && String(searchInput.value || '') !== String(this.filters.searchQuery || '')) {
            searchInput.value = String(this.filters.searchQuery || '');
        }
        const activeOnly = document.getElementById('filter-active-repos');
        if (activeOnly) activeOnly.checked = !!this.filters.onlyActiveRepos;
        const timeRange = document.getElementById('time-range');
        if (timeRange && timeRange.value !== this.filters.timeRange) timeRange.value = this.filters.timeRange;
        ['commits', 'issues', 'prs', 'comments'].forEach(type => {
            const el = document.getElementById(`filter-${type}`);
            if (el) el.checked = !!this.filters[type];
        });
    }

    loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        const range = params.get('range');
        if (range) this.filters.timeRange = range;

        const types = (params.get('types') || '').split(',').map(s => s.trim()).filter(Boolean);
        if (types.length) {
            this.filters.commits = types.includes('commits');
            this.filters.issues = types.includes('issues');
            this.filters.prs = types.includes('prs');
            this.filters.comments = types.includes('comments');
        }

        const q = params.get('q');
        if (q != null) this.filters.searchQuery = q;

        const active = params.get('active');
        if (active != null) this.filters.onlyActiveRepos = active === '1' || active === 'true';

        const exclude = (params.get('exclude') || '').split(',').map(s => s.trim()).filter(Boolean);
        if (exclude.length) this.filters.repositories = exclude;
    }

    saveFiltersToURL() {
        const params = new URLSearchParams();
        if (this.filters.timeRange && this.filters.timeRange !== '30d') params.set('range', this.filters.timeRange);

        const types = [];
        if (this.filters.commits) types.push('commits');
        if (this.filters.issues) types.push('issues');
        if (this.filters.prs) types.push('prs');
        if (this.filters.comments) types.push('comments');
        if (types.length && types.length !== 4) params.set('types', types.join(','));

        const q = String(this.filters.searchQuery || '').trim();
        if (q) params.set('q', q);
        if (this.filters.onlyActiveRepos) params.set('active', '1');

        if (this.filters.repositories.length) params.set('exclude', this.filters.repositories.join(','));

        const newQuery = params.toString();
        const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    }

    activitySearchText(activity) {
        const parts = [];
        parts.push(String(activity.type || ''));
        parts.push(String(activity.repo || ''));
        parts.push(this.formatActivityType(activity.type));
        parts.push(this.formatActivityDescription(activity));

        if (activity.type === 'PushEvent') {
            const commits = activity.payload?.commits || [];
            commits.slice(0, 5).forEach(c => parts.push(String(c.message || '').split('\n')[0]));
        } else if (activity.type === 'IssuesEvent') {
            parts.push(String(activity.payload?.issue?.title || ''));
        } else if (activity.type === 'PullRequestEvent') {
            parts.push(String(activity.payload?.pull_request?.title || ''));
        } else if (activity.type === 'IssueCommentEvent') {
            parts.push(String(activity.payload?.issue?.title || ''));
        }

        return parts.join(' ').toLowerCase();
    }

    getCommitHtmlURL(fullRepoName, sha) {
        const safeRepo = String(fullRepoName || '').trim();
        const safeSha = String(sha || '').trim();
        if (!safeRepo || !safeSha) return 'https://github.com';
        return `https://github.com/${safeRepo}/commit/${safeSha}`;
    }

    hashString(str) {
        // FNV-1a 32-bit hash for stable localStorage keys.
        let hash = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 0x01000193) >>> 0;
        }
        return hash.toString(16);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WatchMeWorkDashboard();
});
