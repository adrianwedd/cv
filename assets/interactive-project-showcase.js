/**
 * Interactive Project Showcase System
 * 
 * Advanced portfolio showcase with interactive project cards, technology visualization,
 * GitHub integration, filtering, search, and professional presentation.
 * 
 * Features:
 * - Interactive project cards with expandable details
 * - Real-time GitHub repository statistics
 * - Advanced filtering and search capabilities
 * - Technology stack visualization with skill indicators
 * - Professional animations and micro-interactions
 * - Mobile-responsive design with accessibility support
 */

class InteractiveProjectShowcase {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.categories = new Set();
        this.technologies = new Set();
        this.currentFilter = 'all';
        this.currentSort = 'featured';
        this.searchQuery = '';
        this.expandedProject = null;
        this.githubCache = new Map();
        this.isInitialized = false;
        
        // Animation and interaction settings
        this.animationDuration = 300;
        this.staggerDelay = 100;
        this.debounceDelay = 300;
        
        this.init();
    }

    /**
     * Initialize the showcase system
     */
    async init() {
        console.log('🚀 Initializing Interactive Project Showcase...');
        
        try {
            await this.loadProjectData();
            this.setupEventListeners();
            this.createShowcaseInterface();
            this.renderProjects();
            
            this.isInitialized = true;
            console.log('✅ Interactive Project Showcase initialized successfully');
            
        } catch (error) {
            console.error('❌ Project Showcase initialization failed:', error);
            this.renderError(error);
        }
    }

    /**
     * Load project data from CV JSON
     */
    async loadProjectData() {
        try {
            const response = await fetch('data/base-cv.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const cvData = await response.json();
            this.projects = cvData.projects || [];
            this.filteredProjects = [...this.projects];
            
            // Extract categories and technologies
            this.projects.forEach(project => {
                if (project.status) this.categories.add(project.status);
                if (project.technologies) {
                    project.technologies.forEach(tech => this.technologies.add(tech));
                }
            });
            
            // Fetch GitHub statistics for projects with GitHub links
            await this.fetchGitHubStatistics();
            
        } catch (error) {
            console.error('Error loading project data:', error);
            throw error;
        }
    }

    /**
     * Fetch GitHub repository statistics
     */
    async fetchGitHubStatistics() {
        const githubProjects = this.projects.filter(project => 
            project.github && project.github.includes('github.com')
        );

        const promises = githubProjects.map(async (project) => {
            try {
                const repoPath = project.github.replace('https://github.com/', '');
                const response = await fetch(`https://api.github.com/repos/${repoPath}`);
                
                if (response.ok) {
                    const repoData = await response.json();
                    this.githubCache.set(project.name, {
                        stars: repoData.stargazers_count,
                        forks: repoData.forks_count,
                        language: repoData.language,
                        updated: new Date(repoData.updated_at),
                        size: repoData.size,
                        issues: repoData.open_issues_count
                    });
                }
            } catch (error) {
                console.warn(`Failed to fetch GitHub data for ${project.name}:`, error);
            }
        });

        await Promise.allSettled(promises);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.project-filter-btn')) {
                this.handleFilterChange(e.target.dataset.filter);
            }
            
            if (e.target.matches('.project-sort-btn')) {
                this.handleSortChange(e.target.dataset.sort);
            }
            
            if (e.target.matches('.project-card, .project-card *')) {
                const card = e.target.closest('.project-card');
                if (card) this.handleProjectClick(card.dataset.projectName);
            }
            
            if (e.target.matches('.project-modal-close, .project-modal-backdrop')) {
                this.closeProjectModal();
            }
        });

        // Search input
        document.addEventListener('input', (e) => {
            if (e.target.matches('.project-search-input')) {
                this.debounce(() => {
                    this.handleSearchInput(e.target.value);
                }, this.debounceDelay)();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.expandedProject) {
                this.closeProjectModal();
            }
        });

        // Intersection Observer for animations
        this.setupIntersectionObserver();
    }

    /**
     * Create the showcase interface
     */
    createShowcaseInterface() {
        const projectsSection = document.getElementById('projects-grid');
        if (!projectsSection) {
            console.error('Projects grid container not found');
            return;
        }

        // Clear existing loading content
        projectsSection.innerHTML = '';

        // Create showcase controls
        const controlsHTML = `
            <div class="project-showcase-controls">
                <div class="project-search-container">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input 
                            type="text" 
                            class="project-search-input" 
                            placeholder="Search projects, technologies..."
                            aria-label="Search projects"
                        >
                    </div>
                </div>
                
                <div class="project-filters">
                    <div class="filter-group">
                        <label class="filter-label">Filter by Status:</label>
                        <div class="filter-buttons">
                            <button class="project-filter-btn active" data-filter="all">All</button>
                            ${Array.from(this.categories).map(category => 
                                `<button class="project-filter-btn" data-filter="${category}">${category}</button>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="sort-group">
                        <label class="sort-label">Sort by:</label>
                        <div class="sort-buttons">
                            <button class="project-sort-btn active" data-sort="featured">Featured</button>
                            <button class="project-sort-btn" data-sort="recent">Most Recent</button>
                            <button class="project-sort-btn" data-sort="activity">GitHub Activity</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Create projects grid
        const gridHTML = `
            <div class="project-showcase-grid" id="project-showcase-grid">
                <!-- Projects will be rendered here -->
            </div>
        `;

        projectsSection.innerHTML = controlsHTML + gridHTML;
    }

    /**
     * Render projects in the grid
     */
    renderProjects() {
        const grid = document.getElementById('project-showcase-grid');
        if (!grid) return;

        if (this.filteredProjects.length === 0) {
            grid.innerHTML = `
                <div class="no-projects-message">
                    <span class="empty-icon">📂</span>
                    <h3>No projects found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
            return;
        }

        // Render project cards
        const cardsHTML = this.filteredProjects.map((project, index) => 
            this.createProjectCard(project, index)
        ).join('');

        grid.innerHTML = cardsHTML;

        // Animate cards in
        this.animateCardsIn();
    }

    /**
     * Create individual project card
     */
    createProjectCard(project, index) {
        const githubStats = this.githubCache.get(project.name);
        const statusClass = project.status ? project.status.toLowerCase().replace(/\s+/g, '-') : 'default';
        
        return `
            <div class="project-card" 
                 data-project-name="${project.name}" 
                 style="animation-delay: ${index * this.staggerDelay}ms">
                
                <!-- Card Header -->
                <div class="project-card-header">
                    <div class="project-title-section">
                        <h3 class="project-title">${project.name}</h3>
                        <p class="project-subtitle">${project.subtitle || ''}</p>
                    </div>
                    <div class="project-status">
                        <span class="status-badge status-${statusClass}">${project.status || 'Project'}</span>
                    </div>
                </div>

                <!-- Card Content -->
                <div class="project-card-content">
                    <p class="project-description">${project.description}</p>
                    
                    <!-- Technology Stack -->
                    <div class="project-technologies">
                        <div class="tech-stack-label">Tech Stack:</div>
                        <div class="tech-stack">
                            ${(project.technologies || []).slice(0, 4).map(tech => 
                                `<span class="tech-tag">${tech}</span>`
                            ).join('')}
                            ${project.technologies && project.technologies.length > 4 ? 
                                `<span class="tech-more">+${project.technologies.length - 4} more</span>` : ''
                            }
                        </div>
                    </div>

                    <!-- Project Metrics -->
                    ${project.metrics ? `
                        <div class="project-metrics">
                            ${project.metrics.slice(0, 3).map(metric => `
                                <div class="metric-item">
                                    <span class="metric-value">${metric.value}</span>
                                    <span class="metric-label">${metric.label}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- GitHub Statistics -->
                    ${githubStats ? `
                        <div class="github-stats">
                            <div class="github-stat">
                                <span class="stat-icon">⭐</span>
                                <span class="stat-value">${githubStats.stars}</span>
                            </div>
                            <div class="github-stat">
                                <span class="stat-icon">🍴</span>
                                <span class="stat-value">${githubStats.forks}</span>
                            </div>
                            <div class="github-stat">
                                <span class="stat-icon">📅</span>
                                <span class="stat-value">${this.formatDate(githubStats.updated)}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Card Actions -->
                <div class="project-card-actions">
                    ${project.github ? `
                        <a href="${project.github}" target="_blank" rel="noopener" class="project-link github-link">
                            <span class="link-icon">📱</span>
                            <span class="link-text">GitHub</span>
                        </a>
                    ` : ''}
                    ${project.demo ? `
                        <a href="${project.demo}" target="_blank" rel="noopener" class="project-link demo-link">
                            <span class="link-icon">🚀</span>
                            <span class="link-text">Live Demo</span>
                        </a>
                    ` : ''}
                    <button class="project-link details-link">
                        <span class="link-icon">📖</span>
                        <span class="link-text">View Details</span>
                    </button>
                </div>

                <!-- Hover Overlay -->
                <div class="project-card-overlay">
                    <div class="overlay-content">
                        <span class="overlay-text">Click to explore</span>
                        <span class="overlay-arrow">→</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle project card click for detailed view
     */
    handleProjectClick(projectName) {
        const project = this.projects.find(p => p.name === projectName);
        if (!project) return;

        this.expandedProject = project;
        this.createProjectModal(project);
    }

    /**
     * Create detailed project modal
     */
    createProjectModal(project) {
        const githubStats = this.githubCache.get(project.name);
        
        const modalHTML = `
            <div class="project-modal" id="project-modal">
                <div class="project-modal-backdrop"></div>
                <div class="project-modal-content">
                    <button class="project-modal-close" aria-label="Close modal">×</button>
                    
                    <div class="modal-header">
                        <div class="modal-title-section">
                            <h2 class="modal-title">${project.name}</h2>
                            <p class="modal-subtitle">${project.subtitle || ''}</p>
                        </div>
                        <div class="modal-period">${project.period || ''}</div>
                    </div>

                    <div class="modal-body">
                        <!-- Detailed Description -->
                        <div class="modal-section">
                            <h3 class="modal-section-title">Project Overview</h3>
                            <p class="modal-description">${project.detailed_description || project.description}</p>
                        </div>

                        <!-- Key Features -->
                        ${project.key_features ? `
                            <div class="modal-section">
                                <h3 class="modal-section-title">Key Features</h3>
                                <ul class="feature-list">
                                    ${project.key_features.map(feature => 
                                        `<li class="feature-item">${feature}</li>`
                                    ).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        <!-- Technology Deep Dive -->
                        <div class="modal-section">
                            <h3 class="modal-section-title">Technology Stack</h3>
                            <div class="tech-stack-detailed">
                                ${(project.technologies || []).map(tech => `
                                    <div class="tech-item-detailed">
                                        <span class="tech-name">${tech}</span>
                                        <div class="tech-bar">
                                            <div class="tech-fill" style="width: ${this.getTechExpertise(tech)}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Comprehensive Metrics -->
                        ${project.metrics ? `
                            <div class="modal-section">
                                <h3 class="modal-section-title">Project Impact</h3>
                                <div class="metrics-detailed">
                                    ${project.metrics.map(metric => `
                                        <div class="metric-detailed">
                                            <div class="metric-value-large">${metric.value}</div>
                                            <div class="metric-label-large">${metric.label}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- GitHub Repository Insights -->
                        ${githubStats ? `
                            <div class="modal-section">
                                <h3 class="modal-section-title">Repository Statistics</h3>
                                <div class="github-insights">
                                    <div class="github-insight">
                                        <div class="insight-icon">⭐</div>
                                        <div class="insight-content">
                                            <div class="insight-value">${githubStats.stars}</div>
                                            <div class="insight-label">Stars</div>
                                        </div>
                                    </div>
                                    <div class="github-insight">
                                        <div class="insight-icon">🍴</div>
                                        <div class="insight-content">
                                            <div class="insight-value">${githubStats.forks}</div>
                                            <div class="insight-label">Forks</div>
                                        </div>
                                    </div>
                                    <div class="github-insight">
                                        <div class="insight-icon">🐛</div>
                                        <div class="insight-content">
                                            <div class="insight-value">${githubStats.issues}</div>
                                            <div class="insight-label">Open Issues</div>
                                        </div>
                                    </div>
                                    <div class="github-insight">
                                        <div class="insight-icon">📊</div>
                                        <div class="insight-content">
                                            <div class="insight-value">${this.formatSize(githubStats.size)}</div>
                                            <div class="insight-label">Repository Size</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="modal-footer">
                        ${project.github ? `
                            <a href="${project.github}" target="_blank" rel="noopener" class="modal-action github-action">
                                <span class="action-icon">📱</span>
                                <span class="action-text">View on GitHub</span>
                            </a>
                        ` : ''}
                        ${project.demo ? `
                            <a href="${project.demo}" target="_blank" rel="noopener" class="modal-action demo-action">
                                <span class="action-icon">🚀</span>
                                <span class="action-text">View Live Demo</span>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Animate in
        requestAnimationFrame(() => {
            const modal = document.getElementById('project-modal');
            modal.classList.add('modal-visible');
        });

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close project modal
     */
    closeProjectModal() {
        const modal = document.getElementById('project-modal');
        if (!modal) return;

        modal.classList.remove('modal-visible');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            this.expandedProject = null;
        }, this.animationDuration);
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(filter) {
        this.currentFilter = filter;
        this.applyFilters();
        this.updateFilterButtons();
    }

    /**
     * Handle sort changes
     */
    handleSortChange(sort) {
        this.currentSort = sort;
        this.applySorting();
        this.updateSortButtons();
    }

    /**
     * Handle search input
     */
    handleSearchInput(query) {
        this.searchQuery = query.toLowerCase();
        this.applyFilters();
    }

    /**
     * Apply current filters to projects
     */
    applyFilters() {
        this.filteredProjects = this.projects.filter(project => {
            // Status filter
            const statusMatch = this.currentFilter === 'all' || 
                               project.status === this.currentFilter;

            // Search filter
            const searchMatch = !this.searchQuery || 
                               project.name.toLowerCase().includes(this.searchQuery) ||
                               project.description.toLowerCase().includes(this.searchQuery) ||
                               (project.technologies || []).some(tech => 
                                   tech.toLowerCase().includes(this.searchQuery));

            return statusMatch && searchMatch;
        });

        this.applySorting();
        this.renderProjects();
    }

    /**
     * Apply current sorting to filtered projects
     */
    applySorting() {
        switch (this.currentSort) {
            case 'recent':
                this.filteredProjects.sort((a, b) => {
                    const dateA = new Date(a.period?.split(' - ')[1] || '2020');
                    const dateB = new Date(b.period?.split(' - ')[1] || '2020');
                    return dateB - dateA;
                });
                break;
                
            case 'activity':
                this.filteredProjects.sort((a, b) => {
                    const statsA = this.githubCache.get(a.name);
                    const statsB = this.githubCache.get(b.name);
                    const scoreA = statsA ? (statsA.stars * 2 + statsA.forks) : 0;
                    const scoreB = statsB ? (statsB.stars * 2 + statsB.forks) : 0;
                    return scoreB - scoreA;
                });
                break;
                
            case 'featured':
            default:
                // Keep original order (presumably curated/featured order)
                break;
        }
    }

    /**
     * Update filter button states
     */
    updateFilterButtons() {
        document.querySelectorAll('.project-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    /**
     * Update sort button states
     */
    updateSortButtons() {
        document.querySelectorAll('.project-sort-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === this.currentSort);
        });
    }

    /**
     * Animate cards into view
     */
    animateCardsIn() {
        const cards = document.querySelectorAll('.project-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = `opacity ${this.animationDuration}ms ease, transform ${this.animationDuration}ms ease`;
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * this.staggerDelay);
        });
    }

    /**
     * Setup intersection observer for scroll animations
     */
    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Observe project cards when they're created
        const observeCards = () => {
            document.querySelectorAll('.project-card').forEach(card => {
                observer.observe(card);
            });
        };

        // Observe after renders
        setTimeout(observeCards, 100);
    }

    /**
     * Get technology expertise level (mock data for visualization)
     */
    getTechExpertise(tech) {
        const expertise = {
            'Python': 95, 'JavaScript': 90, 'TypeScript': 85, 'React': 90,
            'Node.js': 90, 'Docker': 90, 'TensorFlow': 85, 'PyTorch': 80,
            'FastAPI': 85, 'PostgreSQL': 85, 'Redis': 80, 'MongoDB': 80,
            'Kubernetes': 80, 'AWS': 85, 'LangChain': 85, 'GraphQL': 75
        };
        return expertise[tech] || 70;
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        const now = Date.now();
        const diff = now - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days} days ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    }

    /**
     * Format repository size
     */
    formatSize(sizeKB) {
        if (sizeKB < 1024) return `${sizeKB} KB`;
        const sizeMB = Math.round(sizeKB / 1024 * 10) / 10;
        return `${sizeMB} MB`;
    }

    /**
     * Debounce utility
     */
    debounce(func, wait) {
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

    /**
     * Render error state
     */
    renderError(error) {
        const grid = document.getElementById('project-showcase-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <h3>Unable to load projects</h3>
                <p>Please try refreshing the page. If the problem persists, contact support.</p>
                <details class="error-details">
                    <summary>Technical Details</summary>
                    <pre>${error.message}</pre>
                </details>
            </div>
        `;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.projectShowcase = new InteractiveProjectShowcase();
    });
} else {
    window.projectShowcase = new InteractiveProjectShowcase();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveProjectShowcase;
}