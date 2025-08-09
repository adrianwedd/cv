/**
 * Mobile Dashboard JavaScript
 * Handles mobile-specific interactions, gestures, and data loading
 */

class MobileDashboardManager {
    constructor() {
        this.currentTab = this.getCurrentTab();
        this.isOnline = navigator.onLine;
        this.init();
    }
    
    init() {
        this.setupTabNavigation();
        this.setupPullToRefresh();
        this.setupTouchFeedback();
        this.setupOfflineHandling();
        this.loadDashboardData();
        
        
    }
    
    getCurrentTab() {
        const path = window.location.pathname;
        if (path.includes('cv-dashboard')) return 'cv';
        if (path.includes('activity-dashboard')) return 'activity';
        if (path.includes('skills-dashboard')) return 'skills';
        if (path.includes('projects-dashboard')) return 'projects';
        if (path.includes('analytics-dashboard')) return 'analytics';
        return 'hub';
    }
    
    setupTabNavigation() {
        const tabs = document.querySelectorAll('.mobile-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === this.currentTab) {
                tab.classList.add('active');
            }
        });
    }
    
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        const threshold = 80;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0 && diff < threshold) {
                e.preventDefault();
                document.body.style.transform = `translateY(${diff * 0.4}px)`;
                document.body.style.transition = 'none';
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (isPulling && currentY - startY > threshold) {
                this.refreshData();
            }
            
            document.body.style.transform = '';
            document.body.style.transition = 'transform 0.3s ease';
            isPulling = false;
        });
    }
    
    setupTouchFeedback() {
        const touchElements = document.querySelectorAll('.action-btn, .mobile-tab, .project-item, .skill-item');
        
        touchElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.style.transform = 'scale(0.95)';
                element.style.transition = 'transform 0.1s ease';
            }, { passive: true });
            
            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.style.transform = '';
                    element.style.transition = 'transform 0.2s ease';
                }, 50);
            });
        });
    }
    
    setupOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showConnectionStatus('online');
            this.refreshData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showConnectionStatus('offline');
        });
    }
    
    showConnectionStatus(status) {
        const indicator = document.createElement('div');
        indicator.className = 'connection-indicator';
        indicator.textContent = status === 'online' ? '🌐 Back online' : '📴 Offline mode';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${status === 'online' ? '#10b981' : '#f59e0b'};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    }
    
    async loadDashboardData() {
        try {
            // Load data based on current dashboard
            switch (this.currentTab) {
                case 'cv':
                    await this.loadCVData();
                    break;
                case 'activity':
                    await this.loadActivityData();
                    break;
                case 'skills':
                    await this.loadSkillsData();
                    break;
                case 'projects':
                    await this.loadProjectsData();
                    break;
                case 'analytics':
                    await this.loadAnalyticsData();
                    break;
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load data. Please try again.');
        }
    }
    
    async loadCVData() {
        // Load CV overview data
        const elements = {
            commits: document.getElementById('commits-stat'),
            score: document.getElementById('score-stat'),
            languages: document.getElementById('languages-stat')
        };
        
        // Simulate loading or fetch from API
        if (elements.commits) elements.commits.textContent = '309';
        if (elements.score) elements.score.textContent = '80%';
        if (elements.languages) elements.languages.textContent = '5';
    }
    
    async loadActivityData() {
        // Load activity timeline data
        
    }
    
    async loadSkillsData() {
        // Load skills and proficiency data
        
    }
    
    async loadProjectsData() {
        // Load projects portfolio data
        
    }
    
    async loadAnalyticsData() {
        // Load career analytics data
        
    }
    
    refreshData() {
        
        this.loadDashboardData();
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileDashboard = new MobileDashboardManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);