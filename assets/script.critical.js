
/**
 * CV Application - Critical Path Bundle
 * 
 * Minimal JavaScript for immediate page functionality.
 * Non-critical features loaded lazily via dynamic imports.
 * 
 * Size optimized for <50KB gzipped.
 */

'use strict';
const CONFIG = {
    DATA_ENDPOINTS: {
        BASE_CV: 'data/base-cv.json',
        ACTIVITY_SUMMARY: 'data/activity-summary.json',
        AI_ENHANCEMENTS: 'data/ai-enhancements.json',
        GITHUB_API: 'https://api.github.com/users/adrianwedd'
    },
    CACHE_DURATION: 300000, // 5 minutes
    ANIMATION_DURATION: 300,
    USERNAME: 'adrianwedd',
    PERFORMANCE_BUDGET: {
        MAX_LOAD_TIME: 2000, // 2 seconds
        CRITICAL_RENDER_TIME: 1000, // 1 second
        IMAGE_LAZY_THRESHOLD: 50 // pixels
    }
};


/**
 * Core CV Application - Critical Path Only
 * Minimal functionality for initial page render
 */

class CVApplication {
    constructor() {
        this.currentSection = 'about';
        this.cache = new Map();
        this.themePreference = 'dark';
        this.isLoading = true;
        this.loadingStartTime = Date.now();
        
        this.init();
    }

    async init() {
        ...');
        
        try {
            // Critical initialization only
            this.applyTheme(this.themePreference);
            this.setupBasicEventListeners();
            this.setupNavigationSystem();
            
            // Load essential data only
            await this.loadCriticalData();
            
            // Show content immediately
            this.showInitialContent();
            this.completeLoadingSequence();
            
            // Queue non-critical features for lazy loading
            this.queueLazyFeatures();
            
            
            
        } catch (error) {
            console.error('❌ Critical initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.classList.add('theme-applied');
    }

    setupBasicEventListeners() {
        // Essential navigation only
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
        
        // Hash change handling
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });
    }

    setupNavigationSystem() {
        // Minimal navigation setup
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });
    }

    async loadCriticalData() {
        try {
            // Load only essential CV data
            const response = await fetch(CONFIG.DATA_ENDPOINTS.BASE_CV);
            if (response.ok) {
                const cvData = await response.json();
                this.cache.set('cv-data', cvData);
                return cvData;
            }
        } catch (error) {
            console.warn('Failed to load critical data:', error);
            return null;
        }
    }

    showInitialContent() {
        // Show basic content structure
        const loadingElement = document.querySelector('.loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Show main content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.opacity = '1';
            mainContent.style.visibility = 'visible';
        }
    }

    navigateToSection(section) {
        // Basic section navigation
        this.currentSection = section;
        
        // Update URL
        window.history.pushState({ section }, '', `#${section}`);
        
        // Show section
        this.showSection(section);
        
        // Update navigation state
        this.updateNavigationState(section);
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => {
            s.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.querySelector(`[data-section="${section}"]`);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    updateNavigationState(activeSection) {
        // Update navigation visual state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === activeSection) {
                item.classList.add('active');
            }
        });
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            this.navigateToSection(hash);
        }
    }

    completeLoadingSequence() {
        const loadTime = Date.now() - this.loadingStartTime;
        
        
        // Mark as ready for enhanced features
        document.body.classList.add('core-loaded');
        this.isLoading = false;
    }

    queueLazyFeatures() {
        // Queue non-critical features for lazy loading
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.loadLazyFeatures();
            });
        } else {
            setTimeout(() => {
                this.loadLazyFeatures();
            }, 100);
        }
    }

    async loadLazyFeatures() {
        try {
            // Load performance monitoring
            const { PerformanceMonitor } = await import('./chunks/performance-monitor.js');
            this.performanceMonitor = new PerformanceMonitor();
            
            // Load GitHub integration
            const { GitHubIntegration } = await import('./chunks/github-integration.js');
            this.githubIntegration = new GitHubIntegration();
            
            // Load data visualizations
            const { DataVisualizer } = await import('./chunks/data-visualizer.js');
            this.dataVisualizer = new DataVisualizer();
            
            
            
        } catch (error) {
            console.warn('Failed to load some lazy features:', error);
        }
    }

    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Show error state
        const errorElement = document.createElement('div');
        errorElement.className = 'error-state';
        errorElement.innerHTML = `
            <h2>Loading Error</h2>
            <p>The CV is temporarily unavailable. Please refresh the page.</p>
            <button onclick="window.location.reload()">Refresh</button>
        `;
        document.body.appendChild(errorElement);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cvApp = new CVApplication();
    });
} else {
    window.cvApp = new CVApplication();
}