/**
 * Adrian Wedd CV - Interactive JavaScript Application
 *
 * Modern, responsive CV website with dynamic content loading, GitHub integration,
 * and intelligent user experience features.
 *
 * Features:
 * - Dynamic content loading from JSON data files
 * - Smooth section navigation with URL hash management
 * - Dark/light theme switching with persistence
 * - Live GitHub activity statistics
 * - Progressive enhancement and accessibility
 * - Performance optimized with lazy loading
 */

/**
 * Sanitize a string for safe insertion into HTML.
 * Escapes &, <, >, ", and ' to prevent XSS.
 */
function sanitizeHTML(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Validate a URL string. Returns the URL or empty string.
 * Only allows http, https, and mailto protocols.
 */
function sanitizeURL(url) {
    if (!url) return '';
    const str = String(url).trim();
    if (/^mailto:/i.test(str)) {
        return str;
    }
    try {
        const parsed = new URL(str);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        // invalid URL
    }
    return '';
}

// Configuration
const CONFIG = {
    DATA_ENDPOINTS: {
        BASE_CV: 'data/base-cv.json',
        ACTIVITY_SUMMARY: 'data/activity-summary.json',
        AI_ENHANCEMENTS: 'data/ai-enhancements.json',
        GITHUB_API: 'https://api.github.com/users/adrianwedd'
    },
    CACHE_DURATION: 300000, // 5 minutes
    ANIMATION_DURATION: 300,
    THEME_KEY: 'cv-theme',
    USERNAME: 'adrianwedd'
};

/**
 * Main Application Controller
 */
class CVApplication {
    constructor() {
        this.currentSection = 'about';
        this.cache = new Map();
        this.themePreference = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
        this.isLoading = true;
        this.loadingStartTime = Date.now();

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing CV Application...');

        try {
            // Set initial theme
            this.applyTheme(this.themePreference);

            // Initialize core systems
            this.setupEventListeners();
            this.setupNavigationSystem();
            this.setupThemeToggle();

            // Load data concurrently
            await this.loadApplicationData();

            // Initialize UI components
            this.initializeLiveStats();
            this.initializeContentSections();

            // Handle initial route
            this.handleInitialRoute();

            // Complete loading sequence
            this.completeLoadingSequence();

            console.log('✅ CV Application initialized successfully');

        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners() {
        // Navigation click handling
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const section = navItem.dataset.section;
                if (section) {
                    e.preventDefault();
                    this.navigateToSection(section);
                }
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Enhance keyboard navigation visibility
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Hash change for browser navigation
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Window resize handling
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 150);
        });

        // Visibility change for tab switching
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshLiveData();
            }
        });
    }

    /**
     * Setup navigation system
     */
    setupNavigationSystem() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });
    }

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });

            // Update icon based on current theme
            if (themeIcon) {
                themeIcon.textContent = this.themePreference === 'dark' ? '☀️' : '🌙';
            }
        }
    }

    /**
     * Load application data from various sources
     */
    async loadApplicationData() {
        console.log('📊 Loading application data...');

        const dataPromises = [
            this.loadCVData(),
            this.loadActivityData(),
            this.loadAIEnhancements(),
            this.loadGitHubStats()
        ];

        try {
            const [cvData, activityData, aiData, githubStats] = await Promise.allSettled(dataPromises);

            this.cvData = cvData.status === 'fulfilled' ? cvData.value : {};
            this.activityData = activityData.status === 'fulfilled' ? activityData.value : {};
            this.aiEnhancements = aiData.status === 'fulfilled' ? aiData.value : {};
            this.githubStats = githubStats.status === 'fulfilled' ? githubStats.value : {};

            console.log('✅ Application data loaded successfully');

        } catch (error) {
            console.warn('⚠️ Some data failed to load:', error);
        }
    }

    /**
     * Load CV data from JSON file
     */
    async loadCVData() {
        try {
            const response = await fetch(CONFIG.DATA_ENDPOINTS.BASE_CV);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('⚠️ CV data not available, using defaults');
            return this.getDefaultCVData();
        }
    }

    /**
     * Load GitHub activity data
     */
    async loadActivityData() {
        try {
            const response = await fetch(CONFIG.DATA_ENDPOINTS.ACTIVITY_SUMMARY);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Activity data not available');
            return {};
        }
    }

    /**
     * Load AI credibility score from validation report
     */
    async loadCredibilityScore() {
        try {
            const response = await fetch('data/latest-validation-report.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const validationData = await response.json();
            return validationData.overall_confidence || 0;
        } catch (error) {
            console.warn('⚠️ Credibility score not available');
            return 0;
        }
    }

    /**
     * Get CSS class for credibility score display
     */
    getCredibilityClass(score) {
        if (score >= 90) return 'credibility-excellent';
        if (score >= 70) return 'credibility-good';
        if (score >= 50) return 'credibility-fair';
        return 'credibility-poor';
    }

    /**
     * Load language count from detailed activity data
     */
    async loadLanguageCount() {
        try {
            // Get the latest activity file reference from activity summary
            const latestActivityFile = this.activityData?.data_files?.latest_activity;
            if (!latestActivityFile) {
                throw new Error('No activity file reference found');
            }

            // Fetch the detailed activity data
            const response = await fetch(`data/activity/${latestActivityFile}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const activityData = await response.json();
            // Fixed: correct path to languages array
            const languages = activityData?.repositories?.summary?.languages || [];

            return languages.length;
        } catch (error) {
            console.warn('⚠️ Could not load language count:', error.message);
            return 7; // Fallback based on typical data
        }
    }

    /**
     * Load AI enhancements
     */
    async loadAIEnhancements() {
        try {
            const response = await fetch(CONFIG.DATA_ENDPOINTS.AI_ENHANCEMENTS);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('⚠️ AI enhancements not available');
            return {};
        }
    }

    /**
     * Load GitHub statistics
     */
    async loadGitHubStats() {
        try {
            const response = await fetch(CONFIG.DATA_ENDPOINTS.GITHUB_API);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('⚠️ GitHub stats not available');
            return {};
        }
    }

    /**
     * Initialize live statistics display
     */
    initializeLiveStats() {
        this.updateLiveStats();

        // Refresh stats periodically
        setInterval(() => {
            this.refreshLiveData();
        }, CONFIG.CACHE_DURATION);
    }

    /**
     * Update live statistics in the header
     */
    updateLiveStats() {
        const elements = {
            commitsCount: document.getElementById('commits-count'),
            activeDays: document.getElementById('active-days'),
            languagesCount: document.getElementById('languages-count'),
            lastUpdated: document.getElementById('last-updated'),
            credibilityScore: document.getElementById('credibility-score')
        };

        // Update commits count
        if (elements.commitsCount) {
            const commits = this.activityData?.summary?.total_commits || 0;
            elements.commitsCount.textContent = this.formatNumber(commits);
        }

        // Update active days count
        if (elements.activeDays) {
            const activeDays = this.activityData?.summary?.active_days || 0;
            elements.activeDays.textContent = this.formatNumber(activeDays);
        }

        // Update languages count - load from detailed activity data
        if (elements.languagesCount) {
            this.loadLanguageCount().then(count => {
                elements.languagesCount.textContent = this.formatNumber(count);
            }).catch(() => {
                elements.languagesCount.textContent = "7"; // Fallback based on typical activity data
            });
        }

        // Update last updated time
        if (elements.lastUpdated) {
            const lastUpdate = this.activityData?.last_updated || new Date().toISOString();
            elements.lastUpdated.textContent = this.formatTimeAgo(lastUpdate);
        }

        // Update AI credibility score
        if (elements.credibilityScore) {
            this.loadCredibilityScore().then(score => {
                elements.credibilityScore.textContent = `${score}/100`;
                elements.credibilityScore.className = `stat-value ${this.getCredibilityClass(score)}`;
            }).catch(() => {
                elements.credibilityScore.textContent = "N/A";
                elements.credibilityScore.className = "stat-value";
            });
        }

        // Update footer timestamp
        const footerUpdated = document.getElementById('footer-last-updated');
        if (footerUpdated) {
            const timestamp = this.aiEnhancements?.last_updated || new Date().toISOString();
            footerUpdated.textContent = this.formatDateTime(timestamp);
        }
    }

    /**
     * Initialize content sections
     */
    initializeContentSections() {
        this.initializeAboutSection();
        this.initializeExperienceSection();
        this.initializeProjectsSection();
        this.initializeSkillsSection();
        this.initializeAchievementsSection();
    }

    /**
     * Initialize About section
     */
    initializeAboutSection() {
        const summaryElement = document.getElementById('professional-summary');
        if (summaryElement) {
            let enhancedSummary = this.aiEnhancements?.professional_summary?.enhanced ||
                                 this.cvData?.professional_summary ||
                                 summaryElement.textContent;

            // Clean up AI-generated content that contains explanation text
            if (enhancedSummary && enhancedSummary.includes('**Enhanced Summary:**')) {
                // Extract only the actual enhanced summary content, not the explanation
                const summaryMatch = enhancedSummary.match(/\*\*Enhanced Summary:\*\*\s*([\s\S]*?)(?:\n\nThis enhancement:|$)/);
                if (summaryMatch) {
                    enhancedSummary = summaryMatch[1].trim();
                }
            }

            summaryElement.textContent = enhancedSummary;
        }
    }

    /**
     * Initialize Experience section
     */
    initializeExperienceSection() {
        const timeline = document.getElementById('experience-timeline');
        if (!timeline) return;

        const experiences = this.cvData?.experience || this.getDefaultExperience();

        // Build experience timeline using safe DOM methods
        timeline.textContent = '';
        for (const exp of experiences) {
            const item = document.createElement('div');
            item.className = 'timeline-item';

            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            item.appendChild(marker);

            const content = document.createElement('div');
            content.className = 'timeline-content';

            const header = document.createElement('div');
            header.className = 'timeline-header';
            const title = document.createElement('h3');
            title.className = 'position-title';
            title.textContent = exp.position || '';
            header.appendChild(title);

            const companyInfo = document.createElement('div');
            companyInfo.className = 'company-info';
            const companyName = document.createElement('span');
            companyName.className = 'company-name';
            companyName.textContent = exp.company || '';
            const period = document.createElement('span');
            period.className = 'timeline-period';
            period.textContent = exp.period || '';
            companyInfo.appendChild(companyName);
            companyInfo.appendChild(period);
            header.appendChild(companyInfo);
            content.appendChild(header);

            const desc = document.createElement('div');
            desc.className = 'timeline-description';
            const descP = document.createElement('p');
            descP.textContent = exp.description || '';
            desc.appendChild(descP);

            if (exp.achievements) {
                const ul = document.createElement('ul');
                ul.className = 'achievement-list';
                for (const achievement of exp.achievements) {
                    const li = document.createElement('li');
                    li.textContent = achievement;
                    ul.appendChild(li);
                }
                desc.appendChild(ul);
            }
            content.appendChild(desc);

            if (exp.technologies) {
                const tags = document.createElement('div');
                tags.className = 'tech-tags';
                for (const tech of exp.technologies) {
                    const tag = document.createElement('span');
                    tag.className = 'tech-tag';
                    tag.textContent = tech;
                    tags.appendChild(tag);
                }
                content.appendChild(tags);
            }

            item.appendChild(content);
            timeline.appendChild(item);
        }
    }

    /**
     * Initialize Projects section
     */
    initializeProjectsSection() {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;

        const projects = this.cvData?.projects || this.getDefaultProjects();

        // Build projects grid using safe DOM methods
        grid.textContent = '';
        for (const project of projects) {
            const card = document.createElement('div');
            card.className = 'project-card';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'project-header';
            const titleEl = document.createElement('h3');
            titleEl.className = 'project-title';
            titleEl.textContent = project.name || '';
            headerDiv.appendChild(titleEl);

            const linksDiv = document.createElement('div');
            linksDiv.className = 'project-links';
            if (project.github && sanitizeURL(project.github)) {
                const ghLink = document.createElement('a');
                ghLink.href = sanitizeURL(project.github);
                ghLink.target = '_blank';
                ghLink.rel = 'noopener noreferrer';
                ghLink.className = 'project-link';
                ghLink.textContent = 'GitHub';
                linksDiv.appendChild(ghLink);
            }
            if (project.demo && sanitizeURL(project.demo)) {
                const demoLink = document.createElement('a');
                demoLink.href = sanitizeURL(project.demo);
                demoLink.target = '_blank';
                demoLink.rel = 'noopener noreferrer';
                demoLink.className = 'project-link';
                demoLink.textContent = 'Demo';
                linksDiv.appendChild(demoLink);
            }
            headerDiv.appendChild(linksDiv);
            card.appendChild(headerDiv);

            const descDiv = document.createElement('div');
            descDiv.className = 'project-description';
            const descP = document.createElement('p');
            descP.textContent = project.description || '';
            descDiv.appendChild(descP);
            card.appendChild(descDiv);

            if (project.technologies) {
                const techDiv = document.createElement('div');
                techDiv.className = 'project-tech';
                for (const tech of project.technologies) {
                    const badge = document.createElement('span');
                    badge.className = 'tech-badge';
                    badge.textContent = tech;
                    techDiv.appendChild(badge);
                }
                card.appendChild(techDiv);
            }

            if (project.metrics) {
                const metricsDiv = document.createElement('div');
                metricsDiv.className = 'project-metrics';
                for (const metric of project.metrics) {
                    const metricItem = document.createElement('div');
                    metricItem.className = 'metric-item';
                    const val = document.createElement('span');
                    val.className = 'metric-value';
                    val.textContent = metric.value || '';
                    const label = document.createElement('span');
                    label.className = 'metric-label';
                    label.textContent = metric.label || '';
                    metricItem.appendChild(val);
                    metricItem.appendChild(label);
                    metricsDiv.appendChild(metricItem);
                }
                card.appendChild(metricsDiv);
            }

            grid.appendChild(card);
        }
    }

    /**
     * Initialize Skills section
     */
    initializeSkillsSection() {
        const container = document.getElementById('skills-container');
        if (!container) return;

        const skills = this.cvData?.skills || this.getDefaultSkills();
        const skillProficiency = this.activityData?.skill_analysis?.skill_proficiency || {};

        const skillCategories = this.groupSkillsByCategory(skills);

        // Build skills container using safe DOM methods
        container.textContent = '';
        for (const [category, categorySkills] of Object.entries(skillCategories)) {
            const catDiv = document.createElement('div');
            catDiv.className = 'skill-category';
            const catTitle = document.createElement('h3');
            catTitle.className = 'skill-category-title';
            catTitle.textContent = category;
            catDiv.appendChild(catTitle);

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'skill-items';

            for (const skill of categorySkills) {
                const proficiency = skillProficiency[skill.name] || {};
                const level = Math.min(100, Math.max(0, proficiency.proficiency_score || skill.level || 70));

                const skillItem = document.createElement('div');
                skillItem.className = 'skill-item';

                const skillHeader = document.createElement('div');
                skillHeader.className = 'skill-header';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'skill-name';
                nameSpan.textContent = skill.name || '';
                const levelSpan = document.createElement('span');
                levelSpan.className = 'skill-level';
                levelSpan.textContent = `${Math.round(level)}%`;
                skillHeader.appendChild(nameSpan);
                skillHeader.appendChild(levelSpan);
                skillItem.appendChild(skillHeader);

                const bar = document.createElement('div');
                bar.className = 'skill-bar';
                const progress = document.createElement('div');
                progress.className = 'skill-progress';
                progress.style.width = `${level}%`;
                bar.appendChild(progress);
                skillItem.appendChild(bar);

                if (proficiency.proficiency_level) {
                    const meta = document.createElement('div');
                    meta.className = 'skill-meta';
                    const profLevel = document.createElement('span');
                    profLevel.className = 'proficiency-level';
                    profLevel.textContent = proficiency.proficiency_level;
                    meta.appendChild(profLevel);
                    if (proficiency.metrics?.repository_count) {
                        const projCount = document.createElement('span');
                        projCount.className = 'project-count';
                        projCount.textContent = `${proficiency.metrics.repository_count} projects`;
                        meta.appendChild(projCount);
                    }
                    skillItem.appendChild(meta);
                }

                itemsDiv.appendChild(skillItem);
            }

            catDiv.appendChild(itemsDiv);
            container.appendChild(catDiv);
        }
    }

    /**
     * Initialize Achievements section
     */
    initializeAchievementsSection() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        const achievements = this.cvData?.achievements || this.getDefaultAchievements();

        // Build achievements grid using safe DOM methods
        grid.textContent = '';
        for (const achievement of achievements) {
            const card = document.createElement('div');
            card.className = 'achievement-card';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'achievement-icon';
            iconDiv.textContent = achievement.icon || '';
            card.appendChild(iconDiv);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'achievement-content';

            const titleEl = document.createElement('h3');
            titleEl.className = 'achievement-title';
            titleEl.textContent = achievement.title || '';
            contentDiv.appendChild(titleEl);

            const descEl = document.createElement('p');
            descEl.className = 'achievement-description';
            descEl.textContent = achievement.description || '';
            contentDiv.appendChild(descEl);

            if (achievement.date) {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'achievement-date';
                dateDiv.textContent = achievement.date;
                contentDiv.appendChild(dateDiv);
            }

            if (achievement.link && sanitizeURL(achievement.link)) {
                const link = document.createElement('a');
                link.href = sanitizeURL(achievement.link);
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'achievement-link';
                link.textContent = 'View Details →';
                contentDiv.appendChild(link);
            }

            card.appendChild(contentDiv);
            grid.appendChild(card);
        }
    }

    /**
     * Navigate to specific section
     */
    navigateToSection(sectionId) {
        if (sectionId === this.currentSection) return;

        // Update URL hash
        window.history.pushState(null, null, `#${sectionId}`);

        // Update navigation
        this.updateNavigation(sectionId);

        // Show section with animation
        this.showSection(sectionId);

        this.currentSection = sectionId;
    }

    /**
     * Update navigation active states
     */
    updateNavigation(activeSectionId) {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const isActive = item.dataset.section === activeSectionId;
            item.classList.toggle('active', isActive);
        });
    }

    /**
     * Show section with smooth animation
     */
    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');

        sections.forEach(section => {
            const isTarget = section.id === sectionId;

            if (isTarget) {
                section.classList.add('active');
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                section.classList.remove('active');
            }
        });
    }

    /**
     * Toggle theme between dark and light
     */
    toggleTheme() {
        this.themePreference = this.themePreference === 'light' ? 'dark' : 'light';
        this.applyTheme(this.themePreference);

        // Save preference
        localStorage.setItem(CONFIG.THEME_KEY, this.themePreference);

        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.themePreference === 'dark' ? '☀️' : '🌙';
        }
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Handle initial route from URL hash
     */
    handleInitialRoute() {
        const hash = window.location.hash.substring(1);
        const validSections = ['about', 'experience', 'projects', 'skills', 'achievements'];

        if (hash && validSections.includes(hash)) {
            this.navigateToSection(hash);
        } else {
            this.navigateToSection('about');
        }
    }

    /**
     * Handle hash change events
     */
    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && hash !== this.currentSection) {
            this.showSection(hash);
            this.updateNavigation(hash);
            this.currentSection = hash;
        }
    }

    /**
     * Handle window resize events
     */
    handleWindowResize() {
        // Update any responsive calculations if needed
        console.log('Window resized');
    }

    /**
     * Refresh live data
     */
    async refreshLiveData() {
        try {
            // Reload activity data
            this.activityData = await this.loadActivityData();
            this.updateLiveStats();
        } catch (error) {
            console.warn('⚠️ Failed to refresh live data:', error);
        }
    }

    /**
     * Complete loading sequence
     */
    completeLoadingSequence() {
        const loadingTime = Date.now() - this.loadingStartTime;
        const minLoadingTime = 1500; // Minimum loading time for UX

        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');

                // Remove loading screen after animation
                setTimeout(() => {
                    loadingScreen.remove();
                }, CONFIG.ANIMATION_DURATION);
            }

            this.isLoading = false;
            console.log(`✅ Loading completed in ${loadingTime}ms`);
        }, Math.max(0, minLoadingTime - loadingTime));
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('❌ Initialization error:', error);

        // Remove loading screen and show error state
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.textContent = '';
            const errorContent = document.createElement('div');
            errorContent.className = 'loading-content';
            const icon = document.createElement('div');
            icon.style.cssText = 'font-size: 2rem; margin-bottom: 1rem;';
            icon.textContent = '⚠️';
            const text = document.createElement('div');
            text.className = 'loading-text';
            text.textContent = 'Loading Error';
            const hint = document.createElement('div');
            hint.style.cssText = 'margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;';
            hint.textContent = 'Please refresh the page to try again';
            errorContent.appendChild(icon);
            errorContent.appendChild(text);
            errorContent.appendChild(hint);
            loadingScreen.appendChild(errorContent);
        }
    }

    // Utility methods
    formatNumber(num) {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toString();
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    groupSkillsByCategory(skills) {
        return skills.reduce((categories, skill) => {
            const category = skill.category || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(skill);
            return categories;
        }, {});
    }

    // Default data providers
    getDefaultCVData() {
        return {
            professional_summary: "Systems Analyst and Technology Professional specializing in systems integration, cybersecurity, and applied AI in the public sector.",
            experience: this.getDefaultExperience(),
            projects: this.getDefaultProjects(),
            skills: this.getDefaultSkills(),
            achievements: this.getDefaultAchievements()
        };
    }

    getDefaultExperience() {
        return [
            {
                position: "Systems Analyst / Acting Senior Change Analyst",
                company: "Homes Tasmania",
                period: "2018 - Present",
                description: "Leading systems integration and digital transformation for Tasmania's public housing sector.",
                achievements: [
                    "Enhanced Housing Management System integration using RESTful APIs and SFTP",
                    "Led cybersecurity initiatives improving system security",
                    "Pioneered generative AI adoption for data analysis"
                ],
                technologies: ["Python", "PowerShell", "JavaScript", "RESTful APIs", "Azure"]
            }
        ];
    }

    getDefaultProjects() {
        return [
            {
                name: "ADHDo",
                description: "AI safety system with Claude integration, confidence gating, and multi-tool orchestration.",
                technologies: ["Python", "Claude API", "Safety Systems"],
                github: "https://github.com/adrianwedd/ADHDo"
            },
            {
                name: "Agentic Research Engine",
                description: "Multi-agent evaluation framework with LangGraph orchestration and self-correction loops.",
                technologies: ["Python", "LangGraph", "Multi-Agent Systems"],
                github: "https://github.com/adrianwedd/agentic-research-engine"
            }
        ];
    }

    getDefaultSkills() {
        return [
            { name: "Python", category: "Programming Languages", level: 80 },
            { name: "JavaScript", category: "Programming Languages", level: 75 },
            { name: "TypeScript", category: "Programming Languages", level: 65 },
            { name: "LLM Integration", category: "AI & Automation", level: 80 },
            { name: "AI Safety", category: "AI & Automation", level: 75 },
            { name: "Systems Integration", category: "Infrastructure", level: 85 },
            { name: "Cybersecurity", category: "Infrastructure", level: 75 },
            { name: "Docker", category: "DevOps", level: 70 },
            { name: "GitHub Actions", category: "DevOps", level: 75 },
            { name: "React", category: "Frontend", level: 65 }
        ];
    }

    getDefaultAchievements() {
        return [
            {
                icon: "🏛️",
                title: "Systems Integration Excellence",
                description: "Enhanced Housing Management System integration for Tasmania's public housing sector.",
                date: "2018-2024"
            },
            {
                icon: "🤖",
                title: "AI Innovation Pioneer",
                description: "First to implement generative AI for data analysis in Tasmania's public housing sector.",
                date: "2023-2024"
            },
            {
                icon: "🌿",
                title: "Environmental Campaign Technology",
                description: "Managed IT infrastructure for The Wilderness Society and coordinated Greenpeace campaigns.",
                date: "2010-2015"
            }
        ];
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CVApplication();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CVApplication, CONFIG };
}
