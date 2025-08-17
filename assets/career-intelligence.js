/**
 * Career Intelligence Dashboard
 * Clean version without syntax errors
 */

class CareerIntelligence {
    constructor() {
        this.data = {};
        this.charts = {};
        this.isMobile = window.innerWidth < 768;
        this.performanceStart = performance.now();
        console.log('Career Intelligence initialized');
    }

    async init() {
        try {
            console.log('Initializing Career Intelligence Dashboard...');
            await this.loadData();
            this.hideLoading();
            
            const loadTime = performance.now() - this.performanceStart;
            console.log('Career intelligence loaded in ' + loadTime + 'ms');
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
        }
    }

    async loadData() {
        console.log('Loading career intelligence data...');
        
        try {
            // Load base CV data
            this.data.cv = await this.fetchJSON('data/base-cv.json');
            console.log('Career data loaded successfully');
        } catch (error) {
            console.warn('Failed to load career data:', error);
        }
    }

    async fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch ' + url + ': ' + response.status);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch JSON:', url, error);
            return null;
        }
    }

    hideLoading() {
        const loadingElement = document.querySelector('.loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.careerIntelligence = new CareerIntelligence();
        window.careerIntelligence.init();
    });
} else {
    window.careerIntelligence = new CareerIntelligence();
    window.careerIntelligence.init();
}