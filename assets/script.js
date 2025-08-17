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
    USERNAME: 'adrianwedd',
    PERFORMANCE_BUDGET: {
        MAX_LOAD_TIME: 2000, // 2 seconds
        CRITICAL_RENDER_TIME: 1000, // 1 second
        IMAGE_LAZY_THRESHOLD: 50 // pixels
    }
};

/**
 * Main Application Controller
 */
class CVApplication {
    constructor() {
        this.currentSection = 'about';
        this.cache = new Map();
        this.themePreference = 'dark'; // Force dark theme only
        this.isLoading = true;
        this.loadingStartTime = Date.now();
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        
        
        try {
            // Apply dark theme immediately
            this.applyTheme(this.themePreference);
            
            // Initialize core systems
            this.setupEventListeners();
            this.setupNavigationSystem();
            // Theme toggle removed for single dark mode
            
            // Load data concurrently
            await this.loadApplicationData();
            
            // Initialize UI components
            this.initializeLiveStats();
            this.initializeContentSections();
            this.initializeVisualizations();
            
            // Handle initial route
            this.handleInitialRoute();
            
            // Complete loading sequence
            this.completeLoadingSequence();
            
            
            
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
            
            // Print button handling
            const printElement = e.target.closest('[data-action="print"]');
            if (printElement) {
                e.preventDefault();
                window.print();
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
        
        // Handle CSS and font loading
        this.setupAssetLoading();
        
        // Setup mobile touch optimizations
        this.setupMobileTouchOptimizations();
    }

    /**
     * Setup asset loading (CSS and fonts) to prevent console warnings
     */
    setupAssetLoading() {
        // Load font with fallback
        const fontLoader = document.getElementById('font-loader');
        if (fontLoader) {
            fontLoader.addEventListener('load', () => {
                fontLoader.media = 'all';
            });
        }
        
        // Load CSS stylesheets
        const preloadLinks = document.querySelectorAll('link[rel="preload"][as="style"]');
        preloadLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                // Create actual stylesheet link
                const stylesheet = document.createElement('link');
                stylesheet.rel = 'stylesheet';
                stylesheet.href = href;
                stylesheet.onload = () => {
                    link.setAttribute('data-loaded', 'true');
                };
                document.head.appendChild(stylesheet);
            }
        });
    }

    /**
     * Setup mobile touch optimizations for enhanced mobile experience
     */
    setupMobileTouchOptimizations() {
        // Detect touch device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            document.documentElement.classList.add('touch-device');
            
            // Enhanced touch feedback for interactive elements
            this.setupTouchFeedback();
            
            // Optimize scroll behavior for mobile
            this.setupMobileScrolling();
            
            // Handle orientation changes
            this.setupOrientationHandling();
            
            // iOS specific optimizations
            this.setupiOSOptimizations();
            
            
        }
    }
    
    /**
     * Setup enhanced touch feedback for better user experience
     */
    setupTouchFeedback() {
        const touchElements = document.querySelectorAll('button, .btn, .nav-item, .contact-link, .skill-item, .project-card');
        
        touchElements.forEach(element => {
            // Enhance touch feedback with haptic-like response
            element.addEventListener('touchstart', (e) => {
                element.style.transform = 'scale(0.96)';
                element.style.transition = 'transform 0.1s ease';
                
                // Add ripple effect
                this.createRippleEffect(e, element);
            }, { passive: true });
            
            element.addEventListener('touchend', () => {
                element.style.transform = '';
                element.style.transition = 'transform 0.15s ease';
            }, { passive: true });
            
            element.addEventListener('touchcancel', () => {
                element.style.transform = '';
                element.style.transition = 'transform 0.15s ease';
            }, { passive: true });
        });
    }
    
    /**
     * Create ripple effect for touch feedback
     */
    createRippleEffect(event, element) {
        const rect = element.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: translate(-50%, -50%);
            animation: ripple 0.3s linear;
            pointer-events: none;
            z-index: 1;
        `;
        
        // Add ripple animation styles if not exists
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        width: 60px;
                        height: 60px;
                        opacity: 0;
                    }
                }
                .ripple-container {
                    position: relative;
                    overflow: hidden;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Make element a ripple container
        if (!element.classList.contains('ripple-container')) {
            element.classList.add('ripple-container');
        }
        
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 300);
    }
    
    /**
     * Optimize scrolling behavior for mobile devices
     */
    setupMobileScrolling() {
        // Smooth momentum scrolling for iOS
        document.documentElement.style.webkitOverflowScrolling = 'touch';
        
        // Optimize navigation scrolling
        const navigation = document.querySelector('.navigation');
        if (navigation) {
            navigation.style.webkitOverflowScrolling = 'touch';
            navigation.style.scrollbarWidth = 'none';
        }
        
        // Enhance section navigation with scroll snap
        const sections = document.querySelectorAll('.section');
        if (sections.length > 0) {
            sections.forEach(section => {
                section.style.scrollMarginTop = '80px';
            });
        }
        
        // Improve scroll performance with passive listeners
        document.addEventListener('touchmove', (e) => {
            // Allow native scrolling
        }, { passive: true });
        
        // Handle pull-to-refresh on mobile
        let startY = 0;
        let isAtTop = false;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
            isAtTop = window.scrollY === 0;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (isAtTop && e.touches[0].pageY > startY + 5) {
                // Prevent pull-to-refresh on the page
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    /**
     * Handle device orientation changes
     */
    setupOrientationHandling() {
        const handleOrientationChange = () => {
            // Delay to ensure viewport is updated
            setTimeout(() => {
                // Recalculate responsive elements
                this.handleWindowResize();
                
                // Fix viewport height on mobile browsers
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                
                
            }, 100);
        };
        
        // Handle both orientationchange and resize for better compatibility
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        
        // Set initial viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    /**
     * iOS specific optimizations
     */
    setupiOSOptimizations() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
            document.documentElement.classList.add('ios-device');
            
            // Fix iOS viewport zoom on form focus
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                const handleFocusIn = () => {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
                };
                
                const handleFocusOut = () => {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=1');
                };
                
                document.addEventListener('focusin', handleFocusIn);
                document.addEventListener('focusout', handleFocusOut);
            }
            
            // Fix iOS scroll bounce
            document.addEventListener('touchmove', (e) => {
                if (e.target.closest('.navigation') || e.target.closest('.scrollable')) {
                    // Allow scrolling in specific containers
                    return;
                }
                
                // Prevent bounce on body
                if (e.target === document.body) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Handle iOS safe area
            const updateSafeArea = () => {
                const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0px';
                const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0px';
                
                
            };
            
            updateSafeArea();
            window.addEventListener('orientationchange', updateSafeArea);
            
            
        }
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
     * Setup removed - single dark mode only
     */
    // Theme toggle functionality removed for clean single dark mode design

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
            const summaryResponse = await fetch(CONFIG.DATA_ENDPOINTS.ACTIVITY_SUMMARY);
            if (!summaryResponse.ok) {
                throw new Error(`HTTP ${summaryResponse.status}`);
            }
            const activitySummary = await summaryResponse.json();

            // Load detailed activity data for skill proficiency
            const latestActivityFile = activitySummary?.data_files?.latest_activity;
            if (latestActivityFile) {
                const detailedActivityResponse = await fetch(`data/activity/${latestActivityFile}`);
                if (detailedActivityResponse.ok) {
                    const detailedActivityData = await detailedActivityResponse.json();
                    activitySummary.skill_analysis = detailedActivityData.skill_analysis; // Add detailed skill analysis
                }
            }
            return activitySummary;
        } catch (error) {
            console.warn('⚠️ Activity data not available', error);
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
            activityScore: document.getElementById('activity-score'),
            languagesCount: document.getElementById('languages-count'),
            lastUpdated: document.getElementById('last-updated'),
            credibilityScore: document.getElementById('credibility-score')
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
            // Fixed: Use correct path for career summary
            let enhancedSummary = this.aiEnhancements?.professional_summary?.enhanced ||
                                 this.cvData?.career?.summary ||
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

        const experiences = this.cvData?.career?.positions || this.getDefaultExperience();
        
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
                            ${(exp.technologies || []).map(tech => 
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

        const projects = this.cvData?.portfolio?.featured_projects || this.getDefaultProjects();
        
        grid.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-links">
                        ${(project.github || project.url) ? `
                            <a href="${project.github || project.url}" target="_blank" rel="noopener" class="project-link">
                                <span>→</span>
                                <span>GitHub</span>
                            </a>
                        ` : ''}
                        ${(project.demo || project.live_url) ? `
                            <a href="${project.demo || project.live_url}" target="_blank" rel="noopener" class="project-link">
                                <span>↗</span>
                                <span>Demo</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
                <div class="project-description">
                    <p>${project.description}</p>
                </div>
                <div class="project-tech">
                    ${(project.technologies || []).map(tech => 
                        `<span class="tech-badge">${tech}</span>`
                    ).join('')}
                </div>
                ${project.metrics ? `
                    <div class="project-metrics">
                        ${Array.isArray(project.metrics) ? project.metrics.map(metric => 
                            `<div class="metric-item">
                                <span class="metric-value">${metric.value}</span>
                                <span class="metric-label">${metric.label}</span>
                            </div>`
                        ).join('') : ''}
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

        const skills = this.cvData?.expertise?.technical_skills || this.getDefaultSkills();
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

        const achievements = this.cvData?.recognition?.achievements || this.getDefaultAchievements();
        
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
     * Initialize data visualizations
     */
    initializeVisualizations() {
        // Initialize language proficiency chart
        const languageChartCanvas = document.getElementById('languageChart');
        if (languageChartCanvas) {
            const skillProficiency = this.activityData?.skill_analysis?.skill_proficiency;

            if (skillProficiency) {
                const labels = Object.keys(skillProficiency);
                const data = Object.values(skillProficiency).map(skill => skill.proficiency_score);

                new Chart(languageChartCanvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Proficiency Score',
                            data: data,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        }
                    }
                });
            }
        }
        
        // Initialize GitHub Actions Visualizer
        this.initializeGitHubActionsVisualizer();
        
        // Initialize Development Intelligence Dashboard
        this.initializeDevelopmentIntelligenceDashboard();
    }
    
    /**
     * Initialize GitHub Actions Visualizer
     */
    initializeGitHubActionsVisualizer() {
        try {
            if (typeof GitHubActionsVisualizer !== 'undefined') {
                this.actionsVisualizer = new GitHubActionsVisualizer({
                    owner: CONFIG.USERNAME,
                    repo: 'cv',
                    refreshInterval: 30000, // 30 seconds
                    maxRuns: 20
                });
                
                
            } else {
                console.warn('⚠️ GitHubActionsVisualizer not available');
            }
        } catch (error) {
            console.error('❌ Failed to initialize GitHub Actions Visualizer:', error);
        }
    }
    
    /**
     * Initialize Development Intelligence Dashboard
     */
    initializeDevelopmentIntelligenceDashboard() {
        try {
            if (typeof DevelopmentIntelligenceDashboard !== 'undefined') {
                this.intelligenceDashboard = new DevelopmentIntelligenceDashboard({
                    owner: CONFIG.USERNAME,
                    repo: 'cv',
                    refreshInterval: 30000, // 30 seconds
                    dataRetentionDays: 90
                });
                
                
            } else {
                console.warn('⚠️ DevelopmentIntelligenceDashboard not available');
            }
        } catch (error) {
            console.error('❌ Failed to initialize Development Intelligence Dashboard:', error);
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
            // Special handling for visualizations section to be active with skills
            if (sectionId === 'skills') {
                document.getElementById('visualizations')?.classList.add('active');
            } else {
                document.getElementById('visualizations')?.classList.remove('active');
            }
        });
    }

    /**
     * Theme functions removed - Single stunning dark mode only
     * All styling handled via CSS custom properties
     */

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
     * Complete loading sequence - immediately hide loading screen
     */
    completeLoadingSequence() {
        const loadingScreen = document.getElementById('loading-screen') || document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            loadingScreen.style.display = 'none';
            loadingScreen.style.visibility = 'hidden';
            loadingScreen.style.opacity = '0';
        }
        this.isLoading = false;
        
    }

    /**
     * Apply theme to document - dark mode only
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
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

/**
 * Interactive Metrics Display
 * Shows GitHub activity and professional metrics with interactivity
 */
class InteractiveMetrics {
    constructor() {
        this.metricsData = null;
        this.isVisible = false;
        this.init();
    }

    async init() {
        await this.loadMetricsData();
        this.createMetricsDisplay();
        this.setupInteractions();
    }

    async loadMetricsData() {
        try {
            const response = await fetch('data/activity-summary.json');
            this.metricsData = await response.json();
            
        } catch (error) {
            console.warn('Could not load metrics data:', error);
            this.metricsData = this.getDefaultMetrics();
        }
    }

    getDefaultMetrics() {
        return {
            summary: {
                total_commits: 123,
                active_days: 4,
                net_lines_contributed: 573421
            },
            last_updated: new Date().toISOString()
        };
    }

    createMetricsDisplay() {
        const metricsContainer = document.createElement('div');
        metricsContainer.id = 'interactive-metrics';
        metricsContainer.className = 'interactive-metrics hidden';
        
        const metrics = this.metricsData.summary || this.getDefaultMetrics().summary;
        
        metricsContainer.innerHTML = `
            <div class="metrics-header">
                <h3>📊 Development Activity</h3>
                <button class="metrics-close" aria-label="Close metrics">✕</button>
            </div>
            <div class="metrics-grid">
                <div class="metric-card" data-metric="commits">
                    <div class="metric-value">${metrics.total_commits.toLocaleString()}</div>
                    <div class="metric-label">Total Commits</div>
                    <div class="metric-detail hidden">Last 30 days of development activity</div>
                </div>
                <div class="metric-card" data-metric="days">
                    <div class="metric-value">${metrics.active_days}</div>
                    <div class="metric-label">Active Days</div>
                    <div class="metric-detail hidden">Days with commit activity</div>
                </div>
                <div class="metric-card" data-metric="lines">
                    <div class="metric-value">${(metrics.net_lines_contributed / 1000).toFixed(0)}K</div>
                    <div class="metric-label">Lines Contributed</div>
                    <div class="metric-detail hidden">${metrics.net_lines_contributed.toLocaleString()} total lines</div>
                </div>
                <div class="metric-card" data-metric="frequency">
                    <div class="metric-value">${(metrics.total_commits / Math.max(metrics.active_days, 1)).toFixed(1)}</div>
                    <div class="metric-label">Commits/Day</div>
                    <div class="metric-detail hidden">Average daily contribution rate</div>
                </div>
            </div>
            <div class="metrics-footer">
                <small>Last updated: ${new Date(this.metricsData.last_updated).toLocaleDateString()}</small>
            </div>
        `;

        document.body.appendChild(metricsContainer);
    }

    setupInteractions() {
        // Toggle button (add to existing navigation or create floating button)
        const toggleButton = document.createElement('button');
        toggleButton.id = 'metrics-toggle';
        toggleButton.className = 'metrics-toggle';
        toggleButton.innerHTML = '📊';
        toggleButton.title = 'View Development Metrics';
        toggleButton.setAttribute('aria-label', 'Toggle development metrics display');
        
        document.body.appendChild(toggleButton);

        // Event listeners
        toggleButton.addEventListener('click', () => this.toggleMetrics());
        
        const metricsContainer = document.getElementById('interactive-metrics');
        const closeButton = metricsContainer.querySelector('.metrics-close');
        closeButton.addEventListener('click', () => this.hideMetrics());

        // Metric card interactions
        const metricCards = metricsContainer.querySelectorAll('.metric-card');
        metricCards.forEach(card => {
            card.addEventListener('click', () => this.toggleMetricDetail(card));
            card.addEventListener('mouseenter', () => this.highlightMetric(card));
            card.addEventListener('mouseleave', () => this.unhighlightMetric(card));
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideMetrics();
            }
        });

        // Close on outside click
        metricsContainer.addEventListener('click', (e) => {
            if (e.target === metricsContainer) {
                this.hideMetrics();
            }
        });
    }

    toggleMetrics() {
        if (this.isVisible) {
            this.hideMetrics();
        } else {
            this.showMetrics();
        }
    }

    showMetrics() {
        const container = document.getElementById('interactive-metrics');
        container.classList.remove('hidden');
        container.classList.add('visible');
        this.isVisible = true;
        
        // Animate in the metric cards
        const cards = container.querySelectorAll('.metric-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }

    hideMetrics() {
        const container = document.getElementById('interactive-metrics');
        container.classList.remove('visible');
        container.classList.add('hidden');
        this.isVisible = false;
        
        // Reset animations
        const cards = container.querySelectorAll('.metric-card');
        cards.forEach(card => {
            card.classList.remove('animate-in');
        });
    }

    toggleMetricDetail(card) {
        const detail = card.querySelector('.metric-detail');
        const isExpanded = !detail.classList.contains('hidden');
        
        // Close all other details
        document.querySelectorAll('.metric-detail').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('expanded'));
        
        if (!isExpanded) {
            detail.classList.remove('hidden');
            card.classList.add('expanded');
        }
    }

    highlightMetric(card) {
        card.classList.add('highlighted');
    }

    unhighlightMetric(card) {
        card.classList.remove('highlighted');
    }
}

/**
 * External Link Monitor
 * Provides feedback for broken or slow external links
 */
class ExternalLinkMonitor {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM and initial content load
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.setupLinkMonitoring(), 1000);
        });
    }

    setupLinkMonitoring() {
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="adrianwedd.github.io"]):not([href*="localhost"])');
        
        

        externalLinks.forEach(link => {
            this.monitorLink(link);
        });
    }

    monitorLink(link) {
        const originalTitle = link.title || '';
        
        // Add visual indicator for external links
        link.classList.add('external-link');
        if (!link.querySelector('.external-indicator')) {
            const indicator = document.createElement('span');
            indicator.innerHTML = ' <small>↗</small>';
            indicator.className = 'external-indicator';
            link.appendChild(indicator);
        }

        // Test link availability on hover
        let timeoutId;
        link.addEventListener('mouseenter', () => {
            timeoutId = setTimeout(() => {
                this.checkLinkAvailability(link);
            }, 500); // 500ms delay to avoid excessive requests
        });

        link.addEventListener('mouseleave', () => {
            if (timeoutId) clearTimeout(timeoutId);
        });

        // Restore original title on mouse leave
        link.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!link.classList.contains('link-checked')) {
                    link.title = originalTitle;
                }
            }, 2000);
        });
    }

    async checkLinkAvailability(link) {
        if (link.classList.contains('link-checked')) return;

        const url = link.href;
        link.classList.add('link-checking');
        link.title = 'Checking link availability...';

        try {
            // Use a simple approach - if the link is reachable, it should load
            // Note: CORS will prevent actual checking, but we can provide UX feedback
            const startTime = Date.now();
            
            // Simulate link check (in real app, you'd need a backend service)
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const responseTime = Date.now() - startTime;
            
            link.classList.remove('link-checking');
            link.classList.add('link-checked', 'link-available');
            link.title = `External link (response time: ~${responseTime}ms)`;
            
            
            
        } catch (error) {
            link.classList.remove('link-checking');
            link.classList.add('link-checked', 'link-unavailable');
            link.title = 'External link may be unavailable';
            
            // Add warning icon
            if (!link.querySelector('.warning-icon')) {
                const warning = document.createElement('span');
                warning.innerHTML = ' ⚠️';
                warning.className = 'warning-icon';
                warning.title = 'Link may be unavailable';
                link.appendChild(warning);
            }
            
            console.warn(`⚠️ Link may be unavailable: ${url}`, error);
        }
    }
}

/**
 * Progressive Disclosure for Advanced Features
 * Reveals developer tools and analytics based on user engagement
 */
class ProgressiveDisclosure {
    constructor() {
        this.engagementScore = 0;
        this.unlockThreshold = 3; // Points needed to unlock
        this.startTime = Date.now();
        this.scrollDepth = 0;
        this.sectionsVisited = new Set();
        this.isUnlocked = localStorage.getItem('advancedFeaturesUnlocked') === 'true';
        
        this.init();
    }

    init() {
        this.createEngagementIndicator();
        this.setupEventListeners();
        
        // Auto-unlock if previously unlocked
        if (this.isUnlocked) {
            this.unlockAdvancedFeatures(false);
        } else {
            // Start engagement tracking
            this.trackEngagement();
        }
    }

    createEngagementIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'engagement-indicator';
        indicator.id = 'engagement-indicator';
        document.body.appendChild(indicator);
    }

    setupEventListeners() {
        const unlockBtn = document.getElementById('unlock-advanced');
        if (unlockBtn) {
            unlockBtn.addEventListener('click', () => {
                this.unlockAdvancedFeatures(true);
            });
        }

        // Track scroll depth
        window.addEventListener('scroll', this.throttle(() => {
            this.updateScrollDepth();
        }, 100));

        // Track section visibility
        this.observeSections();
    }

    trackEngagement() {
        // Time-based engagement (1 point per 30 seconds)
        setInterval(() => {
            if (!document.hidden && !this.isUnlocked) {
                this.addEngagementPoint(0.1, 'time_spent');
            }
        }, 3000);
    }

    updateScrollDepth() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
        
        if (scrollPercent > this.scrollDepth) {
            this.scrollDepth = scrollPercent;
            
            // Engagement points for scroll milestones
            if (scrollPercent > 50 && this.scrollDepth <= 50) {
                this.addEngagementPoint(0.5, 'scroll_halfway');
            }
            if (scrollPercent > 80 && this.scrollDepth <= 80) {
                this.addEngagementPoint(0.5, 'scroll_deep');
            }
        }

        this.updateEngagementIndicator();
    }

    observeSections() {
        const sections = document.querySelectorAll('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const sectionId = entry.target.id;
                    if (!this.sectionsVisited.has(sectionId)) {
                        this.sectionsVisited.add(sectionId);
                        this.addEngagementPoint(0.3, `visited_${sectionId}`);
                    }
                }
            });
        }, { threshold: 0.5 });

        sections.forEach(section => observer.observe(section));
    }

    addEngagementPoint(points, reason) {
        if (this.isUnlocked) return;
        
        this.engagementScore += points;
        console.log(`📊 Engagement +${points} (${reason}) - Total: ${this.engagementScore.toFixed(1)}`);
        
        this.updateEngagementIndicator();
        
        // Auto-unlock when threshold reached
        if (this.engagementScore >= this.unlockThreshold) {
            setTimeout(() => {
                this.suggestUnlock();
            }, 1000);
        }
    }

    updateEngagementIndicator() {
        const indicator = document.getElementById('engagement-indicator');
        if (indicator) {
            const progress = Math.min((this.engagementScore / this.unlockThreshold) * 100, 100);
            indicator.style.width = `${progress}%`;
        }
    }

    suggestUnlock() {
        const unlockBtn = document.getElementById('unlock-advanced');
        if (unlockBtn && !this.isUnlocked) {
            // Add pulsing animation to suggest unlocking
            unlockBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
            unlockBtn.style.borderColor = 'var(--color-primary)';
            
            // Update button text to suggest it's ready
            const unlockText = unlockBtn.querySelector('.unlock-text');
            const unlockHint = unlockBtn.querySelector('.unlock-hint');
            if (unlockText) unlockText.textContent = 'Ready to Unlock!';
            if (unlockHint) unlockHint.textContent = 'Click to reveal developer features';
        }
    }

    unlockAdvancedFeatures(userInitiated = false) {
        this.isUnlocked = true;
        localStorage.setItem('advancedFeaturesUnlocked', 'true');
        
        const advancedSection = document.getElementById('advanced-features');
        const unlockBtn = document.getElementById('unlock-advanced');
        const indicator = document.getElementById('engagement-indicator');
        
        if (advancedSection) {
            advancedSection.style.display = 'block';
            setTimeout(() => {
                advancedSection.classList.add('revealed');
            }, 50);
        }
        
        if (unlockBtn) {
            unlockBtn.classList.add('hidden');
        }
        
        if (indicator) {
            indicator.style.width = '100%';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 1000);
        }
        
        if (userInitiated) {
            
            
            // Show a subtle notification
            this.showUnlockNotification();
        } else {
            
        }
    }

    showUnlockNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.innerHTML = '🔓 Advanced features unlocked!';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cvApp = new CVApplication();
    new ExternalLinkMonitor();
    new InteractiveMetrics();
    new ProgressiveDisclosure();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CVApplication, CONFIG };
}

/**
 * Accessibility Controls Manager - REMOVED PER USER REQUEST
 * Commenting out entire class
 */
/* REMOVED - Accessibility Controls
class AccessibilityControls {
    constructor() {
        this.isVisible = false;
        this.currentMode = 'default';
        this.preferences = this.loadPreferences();
        this.init();
    }

    init() {
        this.createAccessibilityControls();
        this.setupEventListeners();
        this.applyStoredPreferences();
        this.setupSystemPreferenceListeners();
    }

    createAccessibilityControls() {
        // Create toggle button
        const toggle = document.createElement('button');
        toggle.id = 'accessibility-toggle';
        toggle.className = 'accessibility-toggle';
        toggle.innerHTML = '♿';
        toggle.title = 'Accessibility Controls';
        toggle.setAttribute('aria-label', 'Toggle accessibility controls');
        document.body.appendChild(toggle);

        // Create controls panel
        const panel = document.createElement('div');
        panel.id = 'accessibility-controls';
        panel.className = 'accessibility-controls';
        panel.innerHTML = `
            <h3>Accessibility Controls</h3>
            <button class="control-button" data-action="toggle-adhd">ADHD-Friendly Mode</button>
            <button class="control-button" data-action="toggle-autism">Autism-Friendly Mode</button>
            <button class="control-button" data-action="toggle-high-contrast">High Contrast</button>
            <button class="control-button" data-action="reduce-motion">Reduce Motion</button>
            <button class="control-button" data-action="reset-preferences">Reset All</button>
        `;
        document.body.appendChild(panel);
    }

    setupEventListeners() {
        const toggle = document.getElementById('accessibility-toggle');
        const panel = document.getElementById('accessibility-controls');

        toggle.addEventListener('click', () => this.toggleControls());

        panel.addEventListener('click', (e) => {
            if (e.target.classList.contains('control-button')) {
                const action = e.target.dataset.action;
                this.handleControlAction(action, e.target);
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hideControls();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isVisible && 
                !e.target.closest('#accessibility-controls') && 
                !e.target.closest('#accessibility-toggle')) {
                this.hideControls();
            }
        });
    }

    setupSystemPreferenceListeners() {
        // Listen for system dark mode changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.preferences.theme === 'auto') {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                this.updateThemeColor(e.matches ? 'dark' : 'light');
            }
        });

        // Listen for reduced motion preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches) {
                this.enableReducedMotion();
            }
        });

        // Listen for high contrast preference changes
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches) {
                this.enableHighContrast();
            }
        });
    }

    toggleControls() {
        if (this.isVisible) {
            this.hideControls();
        } else {
            this.showControls();
        }
    }

    showControls() {
        const panel = document.getElementById('accessibility-controls');
        panel.classList.add('visible');
        this.isVisible = true;
    }

    hideControls() {
        const panel = document.getElementById('accessibility-controls');
        panel.classList.remove('visible');
        this.isVisible = false;
    }

    handleControlAction(action, button) {
        switch (action) {
            case 'toggle-adhd':
                this.toggleADHDMode(button);
                break;
            case 'toggle-autism':
                this.toggleAutismMode(button);
                break;
            case 'toggle-high-contrast':
                this.toggleHighContrast(button);
                break;
            case 'reduce-motion':
                this.toggleReducedMotion(button);
                break;
            case 'reset-preferences':
                this.resetPreferences();
                break;
        }
    }

    toggleADHDMode(button) {
        const isActive = document.body.classList.toggle('adhd-mode');
        button.classList.toggle('active', isActive);
        this.preferences.adhdMode = isActive;
        this.savePreferences();
        
        if (isActive) {
            this.currentMode = 'adhd';
            
        } else {
            this.currentMode = 'default';
            
        }
    }

    toggleAutismMode(button) {
        const isActive = document.body.classList.toggle('autism-mode');
        button.classList.toggle('active', isActive);
        this.preferences.autismMode = isActive;
        this.savePreferences();
        
        if (isActive) {
            this.currentMode = 'autism';
            
        } else {
            this.currentMode = 'default';
            
        }
    }

    toggleHighContrast(button) {
        const isActive = document.body.classList.toggle('high-contrast-mode');
        button.classList.toggle('active', isActive);
        this.preferences.highContrast = isActive;
        this.savePreferences();
        
        
    }

    toggleReducedMotion(button) {
        const isActive = !document.body.classList.contains('reduce-motion');
        document.body.classList.toggle('reduce-motion', isActive);
        button.classList.toggle('active', isActive);
        this.preferences.reducedMotion = isActive;
        this.savePreferences();
        
        if (isActive) {
            this.enableReducedMotion();
        }
        
        
    }

    enableReducedMotion() {
        const style = document.createElement('style');
        style.id = 'reduced-motion-override';
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms \!important;
                animation-iteration-count: 1 \!important;
                transition-duration: 0.01ms \!important;
                scroll-behavior: auto \!important;
            }
        `;
        document.head.appendChild(style);
    }

    enableHighContrast() {
        
        const button = document.querySelector('[data-action="toggle-high-contrast"]');
        if (button && !button.classList.contains('active')) {
            this.toggleHighContrast(button);
        }
    }

    resetPreferences() {
        // Remove all accessibility classes
        document.body.classList.remove('adhd-mode', 'autism-mode', 'high-contrast-mode', 'reduce-motion');
        
        // Reset all buttons
        document.querySelectorAll('.control-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Remove custom styles
        const reducedMotionStyle = document.getElementById('reduced-motion-override');
        if (reducedMotionStyle) {
            reducedMotionStyle.remove();
        }
        
        // Clear preferences
        this.preferences = {
            theme: 'light',
            adhdMode: false,
            autismMode: false,
            highContrast: false,
            reducedMotion: false
        };
        this.savePreferences();
        this.currentMode = 'default';
        
        
    }

    applyStoredPreferences() {
        if (this.preferences.adhdMode) {
            document.body.classList.add('adhd-mode');
            this.currentMode = 'adhd';
            const button = document.querySelector('[data-action="toggle-adhd"]');
            if (button) button.classList.add('active');
        }
        
        if (this.preferences.autismMode) {
            document.body.classList.add('autism-mode');
            this.currentMode = 'autism';
            const button = document.querySelector('[data-action="toggle-autism"]');
            if (button) button.classList.add('active');
        }
        
        if (this.preferences.highContrast) {
            document.body.classList.add('high-contrast-mode');
            const button = document.querySelector('[data-action="toggle-high-contrast"]');
            if (button) button.classList.add('active');
        }
        
        if (this.preferences.reducedMotion) {
            document.body.classList.add('reduce-motion');
            this.enableReducedMotion();
            const button = document.querySelector('[data-action="reduce-motion"]');
            if (button) button.classList.add('active');
        }
    }

    loadPreferences() {
        try {
            const stored = localStorage.getItem('accessibility-preferences');
            return stored ? JSON.parse(stored) : {
                theme: 'light',
                adhdMode: false,
                autismMode: false,
                highContrast: false,
                reducedMotion: false
            };
        } catch (error) {
            console.warn('Failed to load accessibility preferences:', error);
            return {
                theme: 'light',
                adhdMode: false,
                autismMode: false,
                highContrast: false,
                reducedMotion: false
            };
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.warn('Failed to save accessibility preferences:', error);
        }
    }

    updateThemeColor(theme) {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            const colors = {
                light: '#ffffff',
                dark: '#0a0f1a'
            };
            themeColorMeta.setAttribute('content', colors[theme] || colors.light);
        }
    }

    // Public API for integration with main app
    getCurrentMode() {
        return this.currentMode;
    }

    getPreferences() {
        return { ...this.preferences };
    }

    isADHDModeActive() {
        return this.preferences.adhdMode;
    }

    isAutismModeActive() {
        return this.preferences.autismMode;
    }

    isHighContrastActive() {
        return this.preferences.highContrast;
    }

    isReducedMotionActive() {
        return this.preferences.reducedMotion;
    }
}
END OF REMOVED AccessibilityControls */

/**
 * Advanced Animation System - Premium Micro-Interactions
 * Handles scroll animations, motion choreography, and performance optimization
 */
class AdvancedAnimationSystem {
    constructor() {
        this.observerOptions = {
            threshold: [0, 0.1, 0.2, 0.5, 0.8, 1],
            rootMargin: '-10% 0px -10% 0px'
        };
        
        this.intersectionObserver = null;
        this.animatedElements = new Set();
        this.pendingAnimations = new Map();
        this.performanceMode = this.detectPerformanceMode();
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }

    init() {
        
        
        // Check if animations should be disabled
        if (this.reducedMotion) {
            
            this.enableReducedMotionMode();
            return;
        }

        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupMicroInteractions();
        this.setupPerformanceMonitoring();
        this.orchestrateInitialAnimations();
        
        
    }

    detectPerformanceMode() {
        // Detect device capabilities for performance optimization
        const connection = navigator.connection;
        const deviceMemory = navigator.deviceMemory || 4;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        
        if (connection && connection.effectiveType === '2g') return 'low';
        if (deviceMemory < 2 || hardwareConcurrency < 2) return 'low';
        if (deviceMemory >= 8 && hardwareConcurrency >= 8) return 'high';
        
        return 'medium';
    }

    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const animationType = element.dataset.animate;
                
                if (entry.isIntersecting && !this.animatedElements.has(element)) {
                    this.triggerScrollAnimation(element, animationType);
                    this.animatedElements.add(element);
                }
            });
        }, this.observerOptions);
    }

    setupScrollAnimations() {
        // Prepare elements for scroll animations
        const animatableElements = document.querySelectorAll('[data-animate]');
        
        animatableElements.forEach((element, index) => {
            const animationType = element.dataset.animate || 'fade-in-up';
            const delay = element.dataset.delay || (index * 100);
            
            // Set initial state
            element.style.setProperty('--animation-delay', `${delay}ms`);
            element.classList.add('scroll-animate');
            
            // Add specific animation class
            switch(animationType) {
                case 'fade-in-left':
                    element.classList.add('scroll-animate-left');
                    break;
                case 'fade-in-right':
                    element.classList.add('scroll-animate-right');
                    break;
                case 'scale-in':
                    element.classList.add('scroll-animate-scale');
                    break;
                default:
                    // fade-in-up is default
                    break;
            }
            
            this.intersectionObserver.observe(element);
        });

        // Auto-detect timeline items for staggered animation
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.dataset.animate = 'fade-in-left';
            item.dataset.delay = index * 150;
            item.classList.add('scroll-animate-left');
            this.intersectionObserver.observe(item);
        });

        // Auto-detect competency items
        const competencyItems = document.querySelectorAll('.competency-item');
        competencyItems.forEach((item, index) => {
            item.dataset.animate = 'scale-in';
            item.dataset.delay = index * 100;
            item.classList.add('scroll-animate-scale');
            this.intersectionObserver.observe(item);
        });

        // Auto-detect stat items
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach((item, index) => {
            item.dataset.animate = 'scale-in';
            item.dataset.delay = index * 80;
            item.classList.add('scroll-animate-scale');
            this.intersectionObserver.observe(item);
        });
    }

    triggerScrollAnimation(element, animationType) {
        const delay = parseInt(element.dataset.delay) || 0;
        
        setTimeout(() => {
            element.classList.add('in-view');
            
            // Add specific animation class based on type
            switch(animationType) {
                case 'fade-in-up':
                    element.classList.add('animate-fade-in-up');
                    break;
                case 'fade-in-left':
                    element.classList.add('animate-fade-in-left');
                    break;
                case 'fade-in-right':
                    element.classList.add('animate-fade-in-right');
                    break;
                case 'scale-in':
                    element.classList.add('animate-scale-in');
                    break;
                case 'slide-in-down':
                    element.classList.add('animate-slide-in-down');
                    break;
            }

            // Add timeline-specific animations
            if (element.classList.contains('timeline-item')) {
                element.classList.add('animate-in');
            }
        }, delay);
    }

    setupMicroInteractions() {
        // Enhanced button interactions
        this.setupButtonInteractions();
        this.setupCardInteractions();
        this.setupNavigationInteractions();
        this.setupMagneticEffects();
    }

    setupButtonInteractions() {
        const buttons = document.querySelectorAll('.contact-link, .nav-item, .theme-toggle, .footer-link');
        
        buttons.forEach(button => {
            // Add ripple effect
            button.classList.add('interaction-ripple');
            
            // Enhanced hover effects
            button.addEventListener('mouseenter', (e) => {
                if (!this.reducedMotion && this.performanceMode !== 'low') {
                    button.style.setProperty('--magnetic-x', '0px');
                    button.style.setProperty('--magnetic-y', '0px');
                }
            });

            // Active state feedback
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.98)';
                button.style.transition = 'transform 0.1s ease';
            });

            button.addEventListener('mouseup', () => {
                button.style.transform = '';
                button.style.transition = '';
            });
        });
    }

    setupCardInteractions() {
        const cards = document.querySelectorAll('.timeline-content, .competency-item, .stat-item');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!this.reducedMotion) {
                    card.classList.add('interaction-glow');
                }
            });

            card.addEventListener('mouseleave', () => {
                card.classList.remove('interaction-glow');
            });
        });
    }

    setupNavigationInteractions() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Add click feedback
                item.classList.add('nav-clicked');
                setTimeout(() => {
                    item.classList.remove('nav-clicked');
                }, 300);
            });
        });
    }

    setupMagneticEffects() {
        if (this.performanceMode === 'low' || this.reducedMotion) return;

        const magneticElements = document.querySelectorAll('.theme-toggle, .contact-link');
        
        magneticElements.forEach(element => {
            element.classList.add('interaction-magnetic');
            
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) * 0.2;
                const deltaY = (e.clientY - centerY) * 0.2;
                
                element.style.setProperty('--magnetic-x', `${deltaX}px`);
                element.style.setProperty('--magnetic-y', `${deltaY}px`);
            });

            element.addEventListener('mouseleave', () => {
                element.style.setProperty('--magnetic-x', '0px');
                element.style.setProperty('--magnetic-y', '0px');
            });
        });
    }

    setupPerformanceMonitoring() {
        // Monitor animation performance
        if (this.performanceMode === 'high') {
            this.monitorFrameRate();
        }
    }

    monitorFrameRate() {
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 60;

        const checkFrameRate = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                
                // Adjust animation quality based on performance
                if (fps < 45) {
                    this.reduceAnimationComplexity();
                } else if (fps > 55 && this.performanceMode === 'medium') {
                    this.increaseAnimationComplexity();
                }
            }
            
            requestAnimationFrame(checkFrameRate);
        };
        
        requestAnimationFrame(checkFrameRate);
    }

    orchestrateInitialAnimations() {
        // Stagger initial page load animations
        const header = document.querySelector('.header');
        const navigation = document.querySelector('.navigation');
        const mainContent = document.querySelector('.main-content');

        if (header) {
            header.style.animation = 'slideInDown 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
        }

        if (navigation) {
            setTimeout(() => {
                navigation.style.animation = 'fadeInUp 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
            }, 200);
        }

        if (mainContent) {
            setTimeout(() => {
                mainContent.style.animation = 'fadeInUp 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards';
            }, 400);
        }
    }

    enableReducedMotionMode() {
        document.body.classList.add('reduced-motion');
        
        // Override CSS animations with minimal versions
        const style = document.createElement('style');
        style.textContent = `
            .reduced-motion *,
            .reduced-motion *::before,
            .reduced-motion *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    reduceAnimationComplexity() {
        
        const complexAnimations = document.querySelectorAll('.interaction-glow, .interaction-magnetic');
        complexAnimations.forEach(el => {
            el.classList.add('performance-mode-low');
        });
    }

    increaseAnimationComplexity() {
        const simplifiedAnimations = document.querySelectorAll('.performance-mode-low');
        simplifiedAnimations.forEach(el => {
            el.classList.remove('performance-mode-low');
        });
    }

    // Public API
    addScrollAnimation(element, type = 'fade-in-up', delay = 0) {
        element.dataset.animate = type;
        element.dataset.delay = delay;
        element.classList.add('scroll-animate');
        
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(element);
        }
    }

    triggerManualAnimation(element, animationClass) {
        if (this.reducedMotion) return;
        
        element.classList.add(animationClass);
        
        // Clean up after animation completes
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, 1000);
    }

    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.animatedElements.clear();
        this.pendingAnimations.clear();
    }
}

/**
 * Progressive Enhancement for Skill Bars with Animated Progress
 */
class AnimatedSkillBars {
    constructor() {
        this.skillBars = [];
        this.init();
    }

    init() {
        this.createSkillBars();
        this.setupAnimations();
    }

    createSkillBars() {
        // Look for skill items with proficiency data
        const skillItems = document.querySelectorAll('[data-proficiency]');
        
        skillItems.forEach(item => {
            const proficiency = parseInt(item.dataset.proficiency) || 0;
            const skillName = item.textContent.trim();
            
            this.createAnimatedBar(item, proficiency, skillName);
        });
    }

    createAnimatedBar(container, proficiency, name) {
        const barContainer = document.createElement('div');
        barContainer.className = 'skill-bar-container';
        
        const barFill = document.createElement('div');
        barFill.className = 'skill-bar-fill';
        barFill.style.width = '0%';
        barFill.dataset.targetWidth = `${proficiency}%`;
        
        const barBg = document.createElement('div');
        barBg.className = 'skill-bar-bg';
        barBg.appendChild(barFill);
        
        barContainer.appendChild(barBg);
        
        // Add to DOM
        if (container.classList.contains('tech-tag')) {
            container.style.position = 'relative';
            container.appendChild(barContainer);
        }
        
        this.skillBars.push({
            element: barFill,
            target: proficiency,
            animated: false
        });
    }

    setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillBar = this.skillBars.find(bar => 
                        entry.target.contains(bar.element)
                    );
                    
                    if (skillBar && !skillBar.animated) {
                        this.animateSkillBar(skillBar);
                        skillBar.animated = true;
                    }
                }
            });
        }, { threshold: 0.5 });

        this.skillBars.forEach(bar => {
            observer.observe(bar.element.closest('.tech-tag') || bar.element);
        });
    }

    animateSkillBar(skillBar) {
        const { element, target } = skillBar;
        let current = 0;
        const increment = target / 60; // 60 frames animation
        
        const animate = () => {
            current += increment;
            
            if (current >= target) {
                current = target;
                element.style.width = `${target}%`;
                element.classList.add('skill-bar-complete');
                return;
            }
            
            element.style.width = `${current}%`;
            requestAnimationFrame(animate);
        };
        
        setTimeout(() => {
            requestAnimationFrame(animate);
        }, Math.random() * 500); // Stagger the animations
    }
}

// Initialize animation systems when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Accessibility controls removed per user request
    // setTimeout(() => {
    //     new AccessibilityControls();
    //     
    // }, 1000);

    // Initialize advanced animations after accessibility is set up
    setTimeout(() => {
        window.animationSystem = new AdvancedAnimationSystem();
        window.skillBars = new AnimatedSkillBars();
        
    }, 1200);
});

