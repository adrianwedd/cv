/**
 * Adrian Wedd CV - Interactive JavaScript Application
 *
 * Minimal, professional CV website with dynamic content loading,
 * GitHub integration, and dark-first theme.
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
        this.cache = new Map();
        // Dark-first: default to dark when no preference stored
        this.themePreference = localStorage.getItem(CONFIG.THEME_KEY) || 'dark';

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Set initial theme
            this.applyTheme(this.themePreference);

            // Initialize core systems
            this.setupEventListeners();
            this.setupThemeToggle();

            // Load data concurrently
            await this.loadApplicationData();

            // Initialize UI components
            this.initializeContentSections();

            // Update footer timestamp
            this.updateFooterTimestamp();


        } catch (error) {
            console.error('Application initialization failed:', error);
        }
    }

    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Visibility change for tab switching
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshLiveData();
            }
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
                themeIcon.textContent = this.themePreference === 'dark' ? 'sun' : 'moon';
            }
        }
    }

    /**
     * Load application data from various sources
     */
    async loadApplicationData() {
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

        } catch (error) {
            console.warn('Some data failed to load:', error);
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
            console.warn('CV data not available, using defaults');
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
            console.warn('Activity data not available');
            return {};
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
            console.warn('AI enhancements not available');
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
            console.warn('GitHub stats not available');
            return {};
        }
    }

    /**
     * Update footer timestamp
     */
    updateFooterTimestamp() {
        const footerUpdated = document.getElementById('footer-last-updated');
        if (footerUpdated) {
            const timestamp = this.aiEnhancements?.last_updated || this.activityData?.last_updated || new Date().toISOString();
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

        timeline.textContent = '';
        for (const exp of experiences) {
            const item = document.createElement('div');
            item.className = 'timeline-item';

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
        const skillCategories = this.groupSkillsByCategory(skills);

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
                const tier = skill.tier || 'Secondary';

                const skillItem = document.createElement('div');
                skillItem.className = 'skill-item';

                const skillHeader = document.createElement('div');
                skillHeader.className = 'skill-header';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'skill-name';
                nameSpan.textContent = skill.name || '';
                const tierSpan = document.createElement('span');
                tierSpan.className = 'skill-level';
                tierSpan.textContent = tier;
                skillHeader.appendChild(nameSpan);
                skillHeader.appendChild(tierSpan);
                skillItem.appendChild(skillHeader);

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

        grid.textContent = '';
        for (const achievement of achievements) {
            const card = document.createElement('div');
            card.className = 'achievement-card';

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
                link.textContent = 'View Details';
                contentDiv.appendChild(link);
            }

            card.appendChild(contentDiv);
            grid.appendChild(card);
        }
    }

    /**
     * Toggle theme between dark and light
     */
    toggleTheme() {
        this.themePreference = this.themePreference === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.themePreference);

        // Save preference
        localStorage.setItem(CONFIG.THEME_KEY, this.themePreference);

        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.themePreference === 'dark' ? 'sun' : 'moon';
        }
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        if (theme === 'dark') {
            // Dark is the :root default, so remove data-theme
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    /**
     * Refresh live data
     */
    async refreshLiveData() {
        try {
            this.activityData = await this.loadActivityData();
            this.updateFooterTimestamp();
        } catch (error) {
            console.warn('Failed to refresh live data:', error);
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
            professional_summary: "AI Safety Engineer and Independent Researcher. Three years empirical research on frontier AI models, focused on red-teaming, evaluation frameworks, and failure-first methodology. Seven years translating complex technical findings into actionable insights for government decision-makers.",
            experience: this.getDefaultExperience(),
            projects: this.getDefaultProjects(),
            skills: this.getDefaultSkills(),
            achievements: this.getDefaultAchievements()
        };
    }

    getDefaultExperience() {
        return [
            {
                position: "Applications Specialist / Acting Senior Change Analyst",
                company: "Homes Tasmania",
                period: "2018 - Present",
                description: "Complex socio-technical systems analysis for Tasmania's housing and community services portfolio. Developed Homes Tasmania's first Generative AI usage policy in 2023.",
                achievements: [
                    "Developed Homes Tasmania's GenAI usage policy, procedure, and training materials",
                    "Led cybersecurity initiatives improving system security",
                    "Systems integration and API development using RESTful APIs and Python"
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
            { name: "Python", category: "Programming Languages", tier: "Primary" },
            { name: "JavaScript / TypeScript", category: "Programming Languages", tier: "Primary" },
            { name: "Frontier AI Models", category: "AI & Safety", tier: "Primary" },
            { name: "Red-Teaming", category: "AI & Safety", tier: "Primary" },
            { name: "Evaluation Frameworks", category: "AI & Safety", tier: "Primary" },
            { name: "Systems Integration", category: "Infrastructure", tier: "Primary" },
            { name: "Cybersecurity", category: "Infrastructure", tier: "Primary" },
            { name: "Risk Assessment", category: "Research Methods", tier: "Primary" },
            { name: "Technical Writing", category: "Research Methods", tier: "Primary" }
        ];
    }

    getDefaultAchievements() {
        return [
            {
                title: "Failure-First Research Program",
                description: "Developed comprehensive failure-first evaluation methodology for agentic AI systems.",
                date: "2022-Present"
            },
            {
                title: "Published Research: Organisational AI Governance",
                description: "Published research on structural barriers to acting on AI safety evidence in organisations.",
                date: "2025"
            },
            {
                title: "AI Governance Policy Development",
                description: "Developed Homes Tasmania's first Generative AI usage policy and training materials.",
                date: "2023"
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
