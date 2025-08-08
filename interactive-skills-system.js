/**
 * Interactive Skills Visualization System
 * Features: Animated skill bars, proficiency radar, technology clustering
 */

class InteractiveSkillsSystem {
    constructor() {
        this.skillsData = null;
        this.activeFilter = 'all';
        this.animatedBars = new Set();
        this.radarChart = null;
        this.skillsContainer = document.getElementById('skills-container');
        
        this.init();
    }

    async init() {
        
        
        await this.loadSkillsData();
        this.createSkillsInterface();
        this.setupFilterSystem();
        this.setupAnimations();
        this.createRadarChart();
        this.setupTooltipSystem();
        
        
    }

    async loadSkillsData() {
        try {
            // Try to load from CV data first
            const response = await fetch('data/base-cv.json');
            const cvData = await response.json();
            
            // Merge with activity data for real proficiency scores
            const activityResponse = await fetch('data/activity-summary.json');
            const activityData = await activityResponse.json();
            
            this.skillsData = this.mergeSkillsData(cvData.skills, activityData);
            
        } catch (error) {
            console.warn('Using default skills data');
            this.skillsData = this.getDefaultSkillsData();
        }
    }

    mergeSkillsData(cvSkills, activityData) {
        const skillProficiency = activityData?.skill_analysis?.skill_proficiency || {};
        
        return cvSkills.map(skill => ({
            ...skill,
            realProficiency: skillProficiency[skill.name]?.proficiency_score || skill.level,
            recentActivity: skillProficiency[skill.name]?.metrics?.recent_commits || 0,
            projectCount: skillProficiency[skill.name]?.metrics?.repository_count || 0,
            trend: this.calculateTrend(skillProficiency[skill.name])
        }));
    }

    calculateTrend(skillData) {
        if (!skillData) return 'stable';
        
        const recent = skillData.metrics?.recent_commits || 0;
        const total = skillData.metrics?.total_commits || 1;
        const ratio = recent / total;
        
        if (ratio > 0.3) return 'rising';
        if (ratio < 0.1) return 'declining';
        return 'stable';
    }

    createSkillsInterface() {
        if (!this.skillsContainer) return;

        const skillsHTML = `
            <div class="skills-header">
                <div class="skills-filters">
                    <button class="skill-filter active" data-filter="all">All Skills</button>
                    ${this.getCategories().map(category => 
                        `<button class="skill-filter" data-filter="${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${category}</button>`
                    ).join('')}
                </div>
                <div class="skills-view-toggle">
                    <button class="view-toggle active" data-view="grid">Grid</button>
                    <button class="view-toggle" data-view="radar">Radar</button>
                </div>
            </div>
            
            <div class="skills-content">
                <div class="skills-grid-view active">
                    ${this.createSkillsGrid()}
                </div>
                <div class="skills-radar-view">
                    <div class="radar-container">
                        <canvas id="skills-radar-chart"></canvas>
                    </div>
                    <div class="radar-legend">
                        <h4>Proficiency Levels</h4>
                        <div class="legend-items">
                            <div class="legend-item">
                                <div class="legend-color expert"></div>
                                <span>Expert (80-100%)</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color advanced"></div>
                                <span>Advanced (60-79%)</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color intermediate"></div>
                                <span>Intermediate (40-59%)</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color beginner"></div>
                                <span>Beginner (20-39%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.skillsContainer.innerHTML = skillsHTML;
    }

    createSkillsGrid() {
        const categories = this.groupSkillsByCategory();
        
        return Object.entries(categories).map(([category, skills]) => `
            <div class="skill-category" data-category="${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}">
                <h3 class="skill-category-title">
                    <span class="category-icon">${this.getCategoryIcon(category)}</span>
                    ${category}
                    <span class="category-count">${skills.length}</span>
                </h3>
                <div class="skill-items">
                    ${skills.map(skill => this.createSkillItem(skill)).join('')}
                </div>
            </div>
        `).join('');
    }

    createSkillItem(skill) {
        const proficiencyLevel = this.getProficiencyLevel(skill.realProficiency);
        const trendIcon = this.getTrendIcon(skill.trend);
        
        return `
            <div class="skill-item interactive-skill" 
                 data-skill="${skill.name}" 
                 data-category="${skill.category}"
                 data-proficiency="${skill.realProficiency}">
                
                <div class="skill-header">
                    <div class="skill-name-section">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-trend ${skill.trend}" title="Trend: ${skill.trend}">
                            ${trendIcon}
                        </span>
                    </div>
                    <div class="skill-score">
                        <span class="skill-percentage">${Math.round(skill.realProficiency)}%</span>
                        <span class="skill-level ${proficiencyLevel}">${proficiencyLevel}</span>
                    </div>
                </div>
                
                <div class="skill-progress-container">
                    <div class="skill-progress-track">
                        <div class="skill-progress-fill ${proficiencyLevel}" 
                             data-progress="${skill.realProficiency}"
                             style="width: 0%">
                            <div class="progress-shimmer"></div>
                        </div>
                    </div>
                </div>
                
                <div class="skill-metadata">
                    <div class="skill-stats">
                        ${skill.projectCount > 0 ? `<span class="stat-item">📁 ${skill.projectCount} projects</span>` : ''}
                        ${skill.recentActivity > 0 ? `<span class="stat-item">⚡ ${skill.recentActivity} recent commits</span>` : ''}
                    </div>
                    ${skill.description ? `<div class="skill-description">${skill.description}</div>` : ''}
                </div>
            </div>
        `;
    }

    setupFilterSystem() {
        const filterButtons = document.querySelectorAll('.skill-filter');
        const viewToggle = document.querySelectorAll('.view-toggle');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                
                this.activeFilter = button.dataset.filter;
                this.filterSkills(this.activeFilter);
            });
        });
        
        viewToggle.forEach(button => {
            button.addEventListener('click', () => {
                viewToggle.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                
                this.switchView(button.dataset.view);
            });
        });
    }

    filterSkills(filter) {
        const skillCategories = document.querySelectorAll('.skill-category');
        
        skillCategories.forEach(category => {
            const categoryName = category.dataset.category;
            const shouldShow = filter === 'all' || categoryName === filter;
            
            if (shouldShow) {
                category.style.display = 'block';
                category.classList.add('filter-visible');
                
                // Re-animate skill bars
                setTimeout(() => {
                    this.animateSkillBars(category);
                }, 100);
            } else {
                category.style.display = 'none';
                category.classList.remove('filter-visible');
            }
        });
    }

    switchView(view) {
        const gridView = document.querySelector('.skills-grid-view');
        const radarView = document.querySelector('.skills-radar-view');
        
        if (view === 'radar') {
            gridView.classList.remove('active');
            radarView.classList.add('active');
            
            // Initialize or update radar chart
            setTimeout(() => {
                this.updateRadarChart();
            }, 300);
        } else {
            radarView.classList.remove('active');
            gridView.classList.add('active');
        }
    }

    setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillCategory = entry.target;
                    if (!this.animatedBars.has(skillCategory)) {
                        this.animateSkillBars(skillCategory);
                        this.animatedBars.add(skillCategory);
                    }
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.skill-category').forEach(category => {
            observer.observe(category);
        });
    }

    animateSkillBars(category) {
        const skillItems = category.querySelectorAll('.interactive-skill');
        
        skillItems.forEach((item, index) => {
            const progressBar = item.querySelector('.skill-progress-fill');
            const targetWidth = progressBar.dataset.progress;
            
            setTimeout(() => {
                progressBar.style.transition = 'width 1s ease-out';
                progressBar.style.width = `${targetWidth}%`;
                
                // Add completion animation
                setTimeout(() => {
                    progressBar.classList.add('animation-complete');
                }, 1000);
                
            }, index * 150); // Stagger animations
        });
    }

    createRadarChart() {
        const canvas = document.getElementById('skills-radar-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Get top skills for radar
        const topSkills = this.skillsData
            .sort((a, b) => b.realProficiency - a.realProficiency)
            .slice(0, 8);
            
        const labels = topSkills.map(skill => skill.name);
        const data = topSkills.map(skill => skill.realProficiency);
        
        if (typeof Chart !== 'undefined') {
            this.radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Proficiency',
                        data: data,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 0.8)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: 'rgba(226, 232, 240, 0.5)'
                            },
                            pointLabels: {
                                font: {
                                    size: 14,
                                    weight: 'medium'
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false
                    }
                }
            });
        }
    }

    updateRadarChart() {
        if (!this.radarChart) {
            this.createRadarChart();
        }
    }

    setupTooltipSystem() {
        const skillItems = document.querySelectorAll('.interactive-skill');
        
        skillItems.forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                this.showSkillTooltip(e.target, item.dataset.skill);
            });
            
            item.addEventListener('mouseleave', () => {
                this.hideSkillTooltip();
            });
        });
    }

    showSkillTooltip(element, skillName) {
        const skill = this.skillsData.find(s => s.name === skillName);
        if (!skill) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <strong>${skill.name}</strong>
                <span class="tooltip-proficiency">${Math.round(skill.realProficiency)}%</span>
            </div>
            <div class="tooltip-body">
                <div class="tooltip-stats">
                    <div class="stat">Projects: ${skill.projectCount}</div>
                    <div class="stat">Recent Activity: ${skill.recentActivity} commits</div>
                    <div class="stat">Trend: <span class="trend-${skill.trend}">${skill.trend}</span></div>
                </div>
                ${skill.description ? `<div class="tooltip-description">${skill.description}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
    }

    hideSkillTooltip() {
        const tooltips = document.querySelectorAll('.skill-tooltip');
        tooltips.forEach(tooltip => {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        });
    }

    // Helper methods
    getCategories() {
        return [...new Set(this.skillsData.map(skill => skill.category))];
    }

    groupSkillsByCategory() {
        return this.skillsData.reduce((categories, skill) => {
            const category = skill.category || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(skill);
            return categories;
        }, {});
    }

    getProficiencyLevel(score) {
        if (score >= 80) return 'expert';
        if (score >= 60) return 'advanced';
        if (score >= 40) return 'intermediate';
        return 'beginner';
    }

    getCategoryIcon(category) {
        const icons = {
            'Programming Languages': '💻',
            'Frameworks': '🏗️',
            'Tools': '🔧',
            'Cloud Platforms': '☁️',
            'Databases': '🗄️',
            'DevOps': '⚙️',
            'AI & Data Science': '🤖',
            'Frontend': '🎨',
            'Backend': '🔙',
            'Mobile': '📱'
        };
        return icons[category] || '🔹';
    }

    getTrendIcon(trend) {
        const icons = {
            rising: '📈',
            stable: '➖',
            declining: '📉'
        };
        return icons[trend] || '➖';
    }

    getDefaultSkillsData() {
        return [
            { name: 'Python', category: 'Programming Languages', level: 95, realProficiency: 95, recentActivity: 45, projectCount: 8, trend: 'rising' },
            { name: 'JavaScript', category: 'Programming Languages', level: 90, realProficiency: 90, recentActivity: 32, projectCount: 12, trend: 'stable' },
            { name: 'TypeScript', category: 'Programming Languages', level: 85, realProficiency: 85, recentActivity: 28, projectCount: 6, trend: 'rising' },
            // ... more default skills
        ];
    }

    // Public API
    updateSkill(skillName, newProficiency) {
        const skill = this.skillsData.find(s => s.name === skillName);
        if (skill) {
            skill.realProficiency = newProficiency;
            this.refreshSkillDisplay(skill);
        }
    }

    refreshSkillDisplay(skill) {
        const skillElement = document.querySelector(`[data-skill="${skill.name}"]`);
        if (skillElement) {
            const progressBar = skillElement.querySelector('.skill-progress-fill');
            const percentageDisplay = skillElement.querySelector('.skill-percentage');
            
            progressBar.style.width = `${skill.realProficiency}%`;
            percentageDisplay.textContent = `${Math.round(skill.realProficiency)}%`;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.interactiveSkills = new InteractiveSkillsSystem();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InteractiveSkillsSystem;
}