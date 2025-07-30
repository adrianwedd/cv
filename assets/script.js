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
                e.preventDefault();
                const section = navItem.dataset.section;
                if (section) {
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
            activityScore: document.getElementById('activity-score'),
            languagesCount: document.getElementById('languages-count'),
            lastUpdated: document.getElementById('last-updated')
        };

        // Update commits count
        if (elements.commitsCount) {
            const commits = this.activityData?.summary?.total_commits || 0;
            elements.commitsCount.textContent = this.formatNumber(commits);
        }

        // Update activity score - calculate from available data
        if (elements.activityScore) {
            const commits = this.activityData?.summary?.total_commits || 0;
            const activeDays = this.activityData?.summary?.active_days || 0;
            const lookbackDays = this.activityData?.lookback_period_days || 30;
            
            // Calculate a basic activity score (0-100 scale)
            const activityScore = Math.min(100, Math.round((commits * 3 + activeDays * 5) / 2));
            elements.activityScore.textContent = `${activityScore}/100`;
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
            const enhancedSummary = this.aiEnhancements?.professional_summary?.enhanced ||
                                   this.cvData?.professional_summary ||
                                   summaryElement.textContent;
            
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
        
        timeline.innerHTML = experiences.map(exp => `
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3 class="position-title">${exp.position}</h3>
                        <div class="company-info">
                            <span class="company-name">${exp.company}</span>
                            <span class="timeline-period">${exp.period}</span>
                        </div>
                    </div>
                    <div class="timeline-description">
                        <p>${exp.description}</p>
                        ${exp.achievements ? `
                            <ul class="achievement-list">
                                ${exp.achievements.map(achievement => 
                                    `<li>${achievement}</li>`
                                ).join('')}
                            </ul>
                        ` : ''}
                    </div>
                    ${exp.technologies ? `
                        <div class="tech-tags">
                            ${exp.technologies.map(tech => 
                                `<span class="tech-tag">${tech}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Initialize Projects section
     */
    initializeProjectsSection() {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;

        const projects = this.cvData?.projects || this.getDefaultProjects();
        
        grid.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-links">
                        ${project.github ? `
                            <a href="${project.github}" target="_blank" rel="noopener" class="project-link">
                                <span>🔗</span>
                                <span>GitHub</span>
                            </a>
                        ` : ''}
                        ${project.demo ? `
                            <a href="${project.demo}" target="_blank" rel="noopener" class="project-link">
                                <span>🚀</span>
                                <span>Demo</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
                <div class="project-description">
                    <p>${project.description}</p>
                </div>
                <div class="project-tech">
                    ${project.technologies.map(tech => 
                        `<span class="tech-badge">${tech}</span>`
                    ).join('')}
                </div>
                ${project.metrics ? `
                    <div class="project-metrics">
                        ${project.metrics.map(metric => 
                            `<div class="metric-item">
                                <span class="metric-value">${metric.value}</span>
                                <span class="metric-label">${metric.label}</span>
                            </div>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
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
        
        container.innerHTML = Object.entries(skillCategories).map(([category, categorySkills]) => `
            <div class="skill-category">
                <h3 class="skill-category-title">${category}</h3>
                <div class="skill-items">
                    ${categorySkills.map(skill => {
                        const proficiency = skillProficiency[skill.name] || {};
                        const level = proficiency.proficiency_score || skill.level || 70;
                        
                        return `
                            <div class="skill-item">
                                <div class="skill-header">
                                    <span class="skill-name">${skill.name}</span>
                                    <span class="skill-level">${Math.round(level)}%</span>
                                </div>
                                <div class="skill-bar">
                                    <div class="skill-progress" style="width: ${level}%"></div>
                                </div>
                                ${proficiency.proficiency_level ? `
                                    <div class="skill-meta">
                                        <span class="proficiency-level">${proficiency.proficiency_level}</span>
                                        ${proficiency.metrics?.repository_count ? `
                                            <span class="project-count">${proficiency.metrics.repository_count} projects</span>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Initialize Achievements section
     */
    initializeAchievementsSection() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        const achievements = this.cvData?.achievements || this.getDefaultAchievements();
        
        grid.innerHTML = achievements.map(achievement => `
            <div class="achievement-card">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <h3 class="achievement-title">${achievement.title}</h3>
                    <p class="achievement-description">${achievement.description}</p>
                    ${achievement.date ? `
                        <div class="achievement-date">${achievement.date}</div>
                    ` : ''}
                    ${achievement.link ? `
                        <a href="${achievement.link}" target="_blank" rel="noopener" class="achievement-link">
                            View Details →
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
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
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                    <div class="loading-text">Loading Error</div>
                    <div style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
                        Please refresh the page to try again
                    </div>
                </div>
            `;
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
            professional_summary: "AI Engineer and Software Architect specializing in autonomous systems, machine learning, and innovative technology solutions.",
            experience: this.getDefaultExperience(),
            projects: this.getDefaultProjects(),
            skills: this.getDefaultSkills(),
            achievements: this.getDefaultAchievements()
        };
    }

    getDefaultExperience() {
        return [
            {
                position: "AI Engineer & Software Architect",
                company: "Independent Consultant",
                period: "2020 - Present",
                description: "Specializing in autonomous systems, machine learning, and innovative AI solutions for complex technical challenges.",
                achievements: [
                    "Developed advanced AI systems for autonomous decision-making",
                    "Architected scalable software solutions for real-time processing",
                    "Led research initiatives in human-AI collaboration"
                ],
                technologies: ["Python", "TensorFlow", "PyTorch", "JavaScript", "Docker", "Kubernetes"]
            }
        ];
    }

    getDefaultProjects() {
        return [
            {
                name: "TicketSmith",
                description: "Ecosystem-aware AI automation platform for Jira & Confluence with intelligent workflow optimization.",
                technologies: ["LangChain", "React", "FastAPI", "Docker"],
                github: "https://github.com/adrianwedd/ticketsmith",
                metrics: [
                    { value: "95%", label: "Automation Rate" },
                    { value: "40%", label: "Time Saved" }
                ]
            },
            {
                name: "Agentic Research Engine",
                description: "Next-generation multi-agent research system with genuine learning and dynamic collaboration.",
                technologies: ["Python", "AI/ML", "Multi-Agent Systems"],
                metrics: [
                    { value: "10x", label: "Research Speed" },
                    { value: "85%", label: "Accuracy Rate" }
                ]
            }
        ];
    }

    getDefaultSkills() {
        return [
            { name: "Python", category: "Programming Languages", level: 95 },
            { name: "JavaScript", category: "Programming Languages", level: 90 },
            { name: "TypeScript", category: "Programming Languages", level: 85 },
            { name: "Machine Learning", category: "AI & Data Science", level: 90 },
            { name: "Deep Learning", category: "AI & Data Science", level: 85 },
            { name: "TensorFlow", category: "AI & Data Science", level: 80 },
            { name: "React", category: "Frontend", level: 85 },
            { name: "Node.js", category: "Backend", level: 90 },
            { name: "Docker", category: "DevOps", level: 85 },
            { name: "Kubernetes", category: "DevOps", level: 75 },
            { name: "AWS", category: "Cloud Platforms", level: 80 },
            { name: "System Architecture", category: "Software Design", level: 95 }
        ];
    }

    getDefaultAchievements() {
        return [
            {
                icon: "🏆",
                title: "AI Innovation Excellence",
                description: "Recognition for groundbreaking work in autonomous AI systems and human-machine collaboration.",
                date: "2024"
            },
            {
                icon: "🚀",
                title: "Open Source Contributor",
                description: "Active contribution to various open-source projects in AI, automation, and developer tools.",
                date: "2020-2024"
            },
            {
                icon: "🎯",
                title: "Technical Leadership",
                description: "Successfully led multiple high-impact technical projects from conception to deployment.",
                date: "2021-2024"
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