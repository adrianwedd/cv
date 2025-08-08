
/**
 * GitHub Integration - Lazy Loaded Chunk
 * Live GitHub activity and statistics
 */

export class GitHubIntegration {
    constructor() {
        this.username = 'adrianwedd';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        this.init();
    }

    async init() {
        
        
        try {
            await this.loadGitHubStats();
            this.updateLiveStats();
        } catch (error) {
            console.warn('GitHub integration failed:', error);
        }
    }

    async loadGitHubStats() {
        try {
            const response = await fetch(`https://api.github.com/users/${this.username}`);
            if (response.ok) {
                const userData = await response.json();
                this.cache.set('github-user', userData);
                return userData;
            }
        } catch (error) {
            console.warn('Failed to load GitHub stats:', error);
            return null;
        }
    }

    updateLiveStats() {
        const userData = this.cache.get('github-user');
        if (!userData) return;

        // Update live stats in UI
        const statsContainer = document.querySelector('.github-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat">
                    <span class="stat-value">${userData.public_repos}</span>
                    <span class="stat-label">Repositories</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${userData.followers}</span>
                    <span class="stat-label">Followers</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${userData.following}</span>
                    <span class="stat-label">Following</span>
                </div>
            `;
        }
    }
}