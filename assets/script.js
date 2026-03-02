/**
 * Adrian Wedd CV - Interactive JavaScript Application
 *
 * Entry point that orchestrates module imports and application lifecycle.
 */
import { setupThemeToggle } from './modules/theme.js';
import { loadCVData, loadActivityData, loadAIEnhancements, loadGitHubStats } from './modules/data-loader.js';
import { formatDateTime } from './modules/utils.js';
import { initializeAboutSection } from './modules/sections/about.js';
import { initializeExperienceSection } from './modules/sections/experience.js';
import { initializeProjectsSection } from './modules/sections/projects.js';
import { initializeSkillsSection } from './modules/sections/skills.js';
import { initializeAchievementsSection } from './modules/sections/achievements.js';
import { initializeEducationSection } from './modules/sections/education.js';
import { initializeInterestsSection } from './modules/sections/interests.js';

/**
 * Main Application Controller
 */
class CVApplication {
    constructor() {
        this._lastRefresh = 0;
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Set initial theme and wire up toggle
            setupThemeToggle();

            // Initialize core systems
            this.setupEventListeners();

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

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Visibility change for tab switching
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshLiveData();
            }
        });

        // Print button
        const printBtn = document.getElementById('print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => window.print());
        }
    }

    /**
     * Load application data from various sources
     */
    async loadApplicationData() {
        const dataPromises = [
            loadCVData(),
            loadActivityData(),
            loadAIEnhancements(),
            loadGitHubStats()
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
     * Update footer timestamp
     */
    updateFooterTimestamp() {
        const footerUpdated = document.getElementById('footer-last-updated');
        if (footerUpdated) {
            const timestamp = this.aiEnhancements?.last_updated || this.activityData?.last_updated || new Date().toISOString();
            footerUpdated.textContent = formatDateTime(timestamp);
        }
    }

    /**
     * Initialize content sections
     */
    initializeContentSections() {
        initializeAboutSection(this.cvData, this.aiEnhancements);
        initializeExperienceSection(this.cvData);
        initializeProjectsSection(this.cvData);
        initializeSkillsSection(this.cvData);
        initializeAchievementsSection(this.cvData);
        initializeEducationSection(this.cvData);
        initializeInterestsSection(this.cvData);
    }

    /**
     * Refresh live data
     */
    async refreshLiveData() {
        const now = Date.now();
        if (now - this._lastRefresh < 60000) return;
        this._lastRefresh = now;
        try {
            this.activityData = await loadActivityData();
            this.updateFooterTimestamp();
        } catch (error) {
            console.warn('Failed to refresh live data:', error);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CVApplication();
});
