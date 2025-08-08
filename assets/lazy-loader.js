/**
 * CV Lazy Loading System
 * 
 * High-performance lazy loading system for optimized data chunks
 * supporting the stunning dark mode frontend redesign.
 * 
 * Features:
 * - Intelligent chunk loading based on user interaction
 * - Intersection Observer API for viewport-based loading
 * - Smart caching with performance monitoring
 * - Progressive enhancement for no-JS support
 * - Mobile-optimized loading strategies
 */

class CVLazyLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.performanceMetrics = {
            chunksLoaded: 0,
            totalLoadTime: 0,
            cacheHitRate: 0,
            failedLoads: 0
        };
        
        this.config = {
            chunkEndpoint: 'data/optimized/chunks/',
            fallbackEndpoint: 'data/',
            intersectionThreshold: 0.1,
            loadingDelay: 100, // ms
            cacheExpiry: 300000, // 5 minutes
            maxRetries: 2,
            mobileOptimizations: this.isMobile()
        };

        this.init();
    }

    /**
     * Initialize lazy loading system
     */
    init() {
        
        
        // Setup intersection observer
        this.setupIntersectionObserver();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Preload critical chunks
        this.preloadCriticalChunks();
        
        // Setup event listeners
        this.setupEventListeners();
        
        
    }

    /**
     * Setup intersection observer for viewport-based loading
     */
    setupIntersectionObserver() {
        if (!window.IntersectionObserver) {
            console.warn('⚠️ IntersectionObserver not supported, falling back to scroll events');
            this.setupScrollBasedLoading();
            return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadChunkForElement(entry.target);
                }
            });
        }, {
            threshold: this.config.intersectionThreshold,
            rootMargin: '50px'
        });

        // Observe all lazy sections
        document.querySelectorAll('.lazy-section').forEach(section => {
            this.intersectionObserver.observe(section);
        });
    }

    /**
     * Fallback scroll-based loading for older browsers
     */
    setupScrollBasedLoading() {
        let scrollTimer = null;
        
        const handleScroll = () => {
            if (scrollTimer) clearTimeout(scrollTimer);
            
            scrollTimer = setTimeout(() => {
                document.querySelectorAll('.lazy-section:not(.loaded)').forEach(section => {
                    const rect = section.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;
                    
                    if (rect.top < viewportHeight + 50 && rect.bottom > -50) {
                        this.loadChunkForElement(section);
                    }
                });
            }, 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial check
        handleScroll();
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        this.performanceStart = performance.now();
        
        // Track chunk loading performance
        this.trackChunkPerformance();
        
        // Report metrics periodically
        setInterval(() => {
            this.reportPerformanceMetrics();
        }, 30000); // Every 30 seconds
    }

    /**
     * Preload critical chunks for immediate availability
     */
    async preloadCriticalChunks() {
        const criticalChunks = ['critical', 'experience'];
        
        
        
        for (const chunkName of criticalChunks) {
            try {
                await this.loadChunk(chunkName, true); // Skip UI updates for preload
                
            } catch (error) {
                console.warn(`  ⚠️ Failed to preload ${chunkName}:`, error.message);
            }
        }
    }

    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners() {
        // Navigation-based chunk loading
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-section]');
            if (navItem) {
                const section = navItem.dataset.section;
                this.priorityLoadChunk(section);
            }
        });

        // Touch events for mobile optimization
        if (this.config.mobileOptimizations) {
            document.addEventListener('touchstart', (e) => {
                const lazySection = e.target.closest('.lazy-section');
                if (lazySection) {
                    this.loadChunkForElement(lazySection);
                }
            }, { passive: true });
        }
    }

    /**
     * Load chunk for specific element
     */
    async loadChunkForElement(element) {
        if (element.classList.contains('loaded') || element.classList.contains('loading')) {
            return;
        }

        const chunkName = element.dataset.section;
        const endpoint = element.dataset.endpoint;
        
        if (!chunkName) {
            console.warn('⚠️ No chunk name found for element', element);
            return;
        }

        try {
            element.classList.add('loading');
            this.showLoadingState(element);
            
            const data = await this.loadChunk(chunkName);
            await this.renderChunk(element, data, chunkName);
            
            element.classList.remove('loading');
            element.classList.add('loaded');
            
            // Stop observing this element
            if (this.intersectionObserver) {
                this.intersectionObserver.unobserve(element);
            }
            
        } catch (error) {
            console.error(`❌ Failed to load chunk ${chunkName}:`, error);
            element.classList.remove('loading');
            this.showErrorState(element, error);
            this.performanceMetrics.failedLoads++;
        }
    }

    /**
     * Load chunk data with caching and fallback
     */
    async loadChunk(chunkName, skipUI = false) {
        const startTime = performance.now();
        
        // Check cache first
        const cached = this.getCachedChunk(chunkName);
        if (cached) {
            this.performanceMetrics.cacheHitRate++;
            return cached;
        }

        // Check for existing loading promise
        if (this.loadingPromises.has(chunkName)) {
            return await this.loadingPromises.get(chunkName);
        }

        // Create loading promise
        const loadingPromise = this.fetchChunkWithFallback(chunkName);
        this.loadingPromises.set(chunkName, loadingPromise);

        try {
            const data = await loadingPromise;
            
            // Cache the data
            this.cacheChunk(chunkName, data);
            
            // Update performance metrics
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.chunksLoaded++;
            this.performanceMetrics.totalLoadTime += loadTime;
            
            if (!skipUI) {
                }ms`);
            }
            
            return data;
            
        } finally {
            this.loadingPromises.delete(chunkName);
        }
    }

    /**
     * Fetch chunk with optimized endpoint fallback
     */
    async fetchChunkWithFallback(chunkName) {
        // Try optimized endpoint first
        try {
            const optimizedUrl = `${this.config.chunkEndpoint}${chunkName}.json`;
            const response = await fetch(optimizedUrl);
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`⚠️ Optimized chunk ${chunkName} failed, trying fallback`);
        }

        // Fallback to original data structure
        try {
            const fallbackUrl = this.getFallbackUrl(chunkName);
            const response = await fetch(fallbackUrl);
            
            if (response.ok) {
                const data = await response.json();
                return this.transformFallbackData(chunkName, data);
            }
        } catch (error) {
            console.warn(`⚠️ Fallback chunk ${chunkName} failed`);
        }

        throw new Error(`Failed to load chunk: ${chunkName}`);
    }

    /**
     * Get fallback URL for chunk
     */
    getFallbackUrl(chunkName) {
        const fallbackMapping = {
            critical: 'data/base-cv.json',
            experience: 'data/base-cv.json',
            projects: 'data/base-cv.json',
            skills: 'data/base-cv.json',
            achievements: 'data/base-cv.json'
        };

        return fallbackMapping[chunkName] || `${this.config.fallbackEndpoint}base-cv.json`;
    }

    /**
     * Transform fallback data to expected chunk format
     */
    transformFallbackData(chunkName, fullData) {
        const transformers = {
            critical: (data) => ({
                personal_info: data.personal_info,
                professional_summary: data.professional_summary?.substring(0, 300) + '...'
            }),
            experience: (data) => ({ data: data.experience || [] }),
            projects: (data) => ({ data: data.projects || [] }),
            skills: (data) => ({ data: data.skills || [] }),
            achievements: (data) => ({ data: data.achievements || [] })
        };

        const transformer = transformers[chunkName];
        return transformer ? transformer(fullData) : fullData;
    }

    /**
     * Priority load chunk (for user interactions)
     */
    async priorityLoadChunk(chunkName) {
        
        
        try {
            const data = await this.loadChunk(chunkName);
            
            // Find and update the corresponding element
            const element = document.querySelector(`[data-section="${chunkName}"]`);
            if (element && !element.classList.contains('loaded')) {
                await this.loadChunkForElement(element);
            }
            
            return data;
        } catch (error) {
            console.error(`❌ Priority load failed for ${chunkName}:`, error);
            throw error;
        }
    }

    /**
     * Render chunk data into element
     */
    async renderChunk(element, data, chunkName) {
        const renderers = {
            experience: (data) => this.renderExperience(data.data || data),
            projects: (data) => this.renderProjects(data.data || data),
            skills: (data) => this.renderSkills(data.data || data),
            achievements: (data) => this.renderAchievements(data.data || data)
        };

        const renderer = renderers[chunkName];
        if (renderer) {
            const html = renderer(data);
            element.innerHTML = html;
            
            // Trigger any necessary animations
            this.animateChunkEntry(element);
        } else {
            console.warn(`⚠️ No renderer found for chunk: ${chunkName}`);
            element.innerHTML = `<div class="chunk-error">Unable to render ${chunkName}</div>`;
        }
    }

    /**
     * Render experience data
     */
    renderExperience(experience) {
        if (!Array.isArray(experience) || experience.length === 0) {
            return '<div class="empty-state">No experience data available</div>';
        }

        return experience.map(job => `
            <article class="experience-item" data-priority="${job.priority || 0}">
                <header class="experience-header">
                    <h3 class="position">${job.position}</h3>
                    <div class="company">${job.company}</div>
                    <div class="period">${job.period}</div>
                </header>
                <div class="experience-content">
                    <p class="description">${job.description}</p>
                    ${job.achievements ? `
                        <ul class="achievements">
                            ${job.achievements.map(achievement => `
                                <li>${achievement}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                    ${job.technologies ? `
                        <div class="technologies">
                            ${job.technologies.map(tech => `
                                <span class="tech-tag">${tech}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </article>
        `).join('');
    }

    /**
     * Render projects data
     */
    renderProjects(projects) {
        if (!Array.isArray(projects) || projects.length === 0) {
            return '<div class="empty-state">No projects data available</div>';
        }

        return projects.map(project => `
            <article class="project-item" data-priority="${project.priority || 0}">
                <header class="project-header">
                    <h3 class="project-name">${project.name}</h3>
                    ${project.subtitle ? `<div class="project-subtitle">${project.subtitle}</div>` : ''}
                    <div class="project-meta">
                        <span class="status status-${project.status?.toLowerCase()}">${project.status}</span>
                        ${project.period ? `<span class="period">${project.period}</span>` : ''}
                    </div>
                </header>
                <div class="project-content">
                    <p class="description">${project.description}</p>
                    ${project.technologies ? `
                        <div class="technologies">
                            ${project.technologies.map(tech => `
                                <span class="tech-tag">${tech}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${project.github ? `
                        <div class="project-links">
                            <a href="${project.github}" target="_blank" rel="noopener" class="project-link">
                                View on GitHub
                            </a>
                        </div>
                    ` : ''}
                </div>
            </article>
        `).join('');
    }

    /**
     * Render skills data
     */
    renderSkills(skills) {
        if (typeof skills === 'object' && !Array.isArray(skills)) {
            // Skills are categorized
            return Object.entries(skills).map(([category, categorySkills]) => `
                <div class="skills-category">
                    <h3 class="category-title">${category}</h3>
                    <div class="skills-grid">
                        ${categorySkills.map(skill => `
                            <div class="skill-item" data-level="${skill.level || 50}">
                                <div class="skill-name">${skill.name}</div>
                                <div class="skill-level">
                                    <div class="skill-bar">
                                        <div class="skill-progress" style="width: ${skill.level || 50}%"></div>
                                    </div>
                                    <span class="skill-proficiency">${skill.proficiency || 'Intermediate'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        // Skills are a simple array
        if (Array.isArray(skills)) {
            return `
                <div class="skills-grid">
                    ${skills.map(skill => `
                        <div class="skill-item" data-level="${skill.level || 50}">
                            <div class="skill-name">${skill.name}</div>
                            <div class="skill-level">
                                <div class="skill-bar">
                                    <div class="skill-progress" style="width: ${skill.level || 50}%"></div>
                                </div>
                                <span class="skill-proficiency">${skill.proficiency || 'Intermediate'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return '<div class="empty-state">No skills data available</div>';
    }

    /**
     * Render achievements data
     */
    renderAchievements(achievements) {
        if (!Array.isArray(achievements) || achievements.length === 0) {
            return '<div class="empty-state">No achievements data available</div>';
        }

        return achievements.map(achievement => `
            <article class="achievement-item" data-impact="${achievement.impact || 0}">
                <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                <div class="achievement-content">
                    <h3 class="achievement-title">${achievement.title}</h3>
                    <p class="achievement-description">${achievement.description}</p>
                    <div class="achievement-meta">
                        <span class="achievement-date">${achievement.date}</span>
                        <span class="achievement-category">${achievement.category}</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    /**
     * Show loading state
     */
    showLoadingState(element) {
        const loadingHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading ${element.dataset.section}...</div>
            </div>
        `;
        element.innerHTML = loadingHTML;
    }

    /**
     * Show error state
     */
    showErrorState(element, error) {
        const errorHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-message">Failed to load ${element.dataset.section}</div>
                <button class="retry-button" onclick="cvLazyLoader.loadChunkForElement(this.closest('.lazy-section'))">
                    Retry
                </button>
            </div>
        `;
        element.innerHTML = errorHTML;
    }

    /**
     * Animate chunk entry
     */
    animateChunkEntry(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    /**
     * Cache management
     */
    getCachedChunk(chunkName) {
        const cached = this.cache.get(chunkName);
        if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
            return cached.data;
        }
        
        if (cached) {
            this.cache.delete(chunkName); // Remove expired cache
        }
        
        return null;
    }

    cacheChunk(chunkName, data) {
        this.cache.set(chunkName, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Performance monitoring
     */
    trackChunkPerformance() {
        // Track resource timing for chunks
        new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
                if (entry.name.includes('/chunks/') || entry.name.includes('/data/')) {
                    const chunkName = entry.name.split('/').pop().replace('.json', '');
                    }ms`);
                }
            });
        }).observe({ entryTypes: ['resource'] });
    }

    reportPerformanceMetrics() {
        const avgLoadTime = this.performanceMetrics.chunksLoaded > 0 
            ? this.performanceMetrics.totalLoadTime / this.performanceMetrics.chunksLoaded 
            : 0;

        const cacheHitRate = this.performanceMetrics.chunksLoaded > 0
            ? (this.performanceMetrics.cacheHitRate / this.performanceMetrics.chunksLoaded * 100).toFixed(1)
            : 0;

         + 'ms',
            cacheHitRate: cacheHitRate + '%',
            failedLoads: this.performanceMetrics.failedLoads
        });
    }

    /**
     * Utility methods
     */
    isMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}

// Initialize lazy loading system when DOM is ready
let cvLazyLoader;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cvLazyLoader = new CVLazyLoader();
    });
} else {
    cvLazyLoader = new CVLazyLoader();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CVLazyLoader;
}