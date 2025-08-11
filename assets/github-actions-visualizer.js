/**
 * GitHub Actions Visualization Dashboard
 * 
 * Advanced CI/CD pipeline visualization with real-time status monitoring,
 * job-level granularity, performance metrics, and drill-down capabilities.
 * 
 * Features:
 * - Real-time workflow status with live updates
 * - Job-level execution details and timing
 * - Success rate analytics and trend analysis
 * - Performance metrics with cost analysis
 * - Interactive timeline with debugging capabilities
 * - Mobile-responsive design with professional aesthetics
 */

class GitHubActionsVisualizer {
    constructor(options = {}) {
        this.config = {
            owner: 'adrianwedd',
            repo: 'cv',
            refreshInterval: 30000, // 30 seconds
            maxRuns: 20,
            apiBase: 'https://api.github.com',
            ...options
        };
        
        this.cache = new Map();
        this.isVisible = false;
        this.refreshTimer = null;
        this.lastUpdateTime = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the visualizer
     */
    async init() {
        
        
        try {
            this.createToggleButton();
            this.createDashboard();
            this.setupEventListeners();
            
            // Initialize analytics extension if available
            this.initializeAnalyticsExtension();
            
            // Initial data load
            await this.loadWorkflowData();
            
            
        } catch (error) {
            console.error('❌ Failed to initialize GitHub Actions Visualizer:', error);
            this.showError('Failed to initialize workflow visualization');
        }
    }
    
    /**
     * Initialize analytics extension
     */
    initializeAnalyticsExtension() {
        try {
            if (typeof GitHubActionsAnalytics !== 'undefined') {
                this.analytics = new GitHubActionsAnalytics(this);
                
            } else {
                
            }
            
            if (typeof GitHubActionsDrillDown !== 'undefined') {
                this.drillDown = new GitHubActionsDrillDown(this);
                
            } else {
                
            }
        } catch (error) {
            console.warn('⚠️ Failed to initialize extensions:', error);
        }
    }
    
    /**
     * Create the toggle button
     */
    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'actions-viz-toggle';
        button.className = 'actions-viz-toggle';
        button.innerHTML = `
            <span class="actions-viz-icon">⚙️</span>
            <span class="actions-viz-label">CI/CD</span>
        `;
        button.title = 'View GitHub Actions Dashboard';
        button.setAttribute('aria-label', 'Open GitHub Actions visualization dashboard');
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .actions-viz-toggle {
                position: fixed;
                bottom: 20px;
                right: 80px;
                z-index: 1000;
                background: linear-gradient(135deg, #28a745, #20c997);
                border: none;
                border-radius: 50px;
                padding: 12px 20px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 90px;
            }
            
            .actions-viz-toggle:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
                background: linear-gradient(135deg, #20c997, #17a2b8);
            }
            
            .actions-viz-toggle:active {
                transform: translateY(0);
            }
            
            .actions-viz-icon {
                font-size: 16px;
                animation: rotate 2s linear infinite;
            }
            
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .actions-viz-label {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                letter-spacing: 0.5px;
            }
            
            @media (max-width: 768px) {
                .actions-viz-toggle {
                    bottom: 15px;
                    right: 15px;
                    padding: 10px 16px;
                    font-size: 12px;
                    min-width: 70px;
                }
                
                .actions-viz-icon {
                    font-size: 14px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(button);
        
        button.addEventListener('click', () => this.toggleDashboard());
    }
    
    /**
     * Create the main dashboard
     */
    createDashboard() {
        const dashboard = document.createElement('div');
        dashboard.id = 'actions-viz-dashboard';
        dashboard.className = 'actions-viz-dashboard';
        dashboard.innerHTML = `
            <div class="actions-viz-backdrop"></div>
            <div class="actions-viz-modal">
                <div class="actions-viz-header">
                    <div class="actions-viz-title">
                        <h2>🔄 GitHub Actions Dashboard</h2>
                        <div class="actions-viz-subtitle">
                            CI/CD Pipeline Visualization & Analytics
                        </div>
                    </div>
                    <div class="actions-viz-controls">
                        <button class="actions-viz-refresh" title="Refresh Data">
                            <span class="refresh-icon">🔄</span>
                        </button>
                        <button class="actions-viz-close" title="Close Dashboard">
                            <span class="close-icon">✕</span>
                        </button>
                    </div>
                </div>
                
                <div class="actions-viz-content">
                    <div class="actions-viz-loading">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Loading workflow data...</div>
                    </div>
                    
                    <div class="actions-viz-main" style="display: none;">
                        <!-- Status Overview -->
                        <div class="actions-viz-section">
                            <h3>🎯 Pipeline Status</h3>
                            <div class="status-grid" id="status-grid">
                                <!-- Status cards will be inserted here -->
                            </div>
                        </div>
                        
                        <!-- Metrics Dashboard -->
                        <div class="actions-viz-section">
                            <h3>📊 Performance Metrics</h3>
                            <div class="metrics-grid" id="metrics-grid">
                                <!-- Metrics cards will be inserted here -->
                            </div>
                        </div>
                        
                        <!-- Recent Runs Timeline -->
                        <div class="actions-viz-section">
                            <h3>⏱️ Recent Workflow Runs</h3>
                            <div class="timeline-container" id="timeline-container">
                                <!-- Timeline will be inserted here -->
                            </div>
                        </div>
                        
                        <!-- Job Details -->
                        <div class="actions-viz-section" id="job-details-section" style="display: none;">
                            <h3>🔍 Job Details</h3>
                            <div class="job-details" id="job-details">
                                <!-- Job details will be inserted here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="actions-viz-error" style="display: none;">
                        <div class="error-icon">⚠️</div>
                        <div class="error-message"></div>
                        <button class="error-retry">Retry</button>
                    </div>
                </div>
                
                <div class="actions-viz-footer">
                    <div class="footer-info">
                        <span class="last-updated">Last updated: <span id="last-updated-time">--</span></span>
                        <span class="auto-refresh">Auto-refresh: 30s</span>
                    </div>
                </div>
            </div>
        `;
        
        this.createDashboardStyles();
        document.body.appendChild(dashboard);
    }
    
    /**
     * Create dashboard styles
     */
    createDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .actions-viz-dashboard {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: none;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            .actions-viz-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
            }
            
            .actions-viz-modal {
                position: relative;
                background: var(--bg-primary, #ffffff);
                margin: 20px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-height: calc(100vh - 40px);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .actions-viz-header {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .actions-viz-title h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
            }
            
            .actions-viz-subtitle {
                font-size: 14px;
                opacity: 0.9;
                margin-top: 4px;
            }
            
            .actions-viz-controls {
                display: flex;
                gap: 12px;
            }
            
            .actions-viz-refresh,
            .actions-viz-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 16px;
            }
            
            .actions-viz-refresh:hover,
            .actions-viz-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.05);
            }
            
            .actions-viz-content {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }
            
            .actions-viz-section {
                margin-bottom: 32px;
            }
            
            .actions-viz-section h3 {
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary, #333333);
            }
            
            .status-grid,
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
            }
            
            .status-card,
            .metric-card {
                background: var(--bg-secondary, #f8f9fa);
                border: 1px solid var(--border-color, #e9ecef);
                border-radius: 12px;
                padding: 20px;
                transition: all 0.3s ease;
            }
            
            .status-card:hover,
            .metric-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            
            .status-card-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .status-icon {
                font-size: 24px;
            }
            
            .status-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary, #333333);
            }
            
            .status-value {
                font-size: 28px;
                font-weight: 700;
                color: var(--text-primary, #333333);
                margin-bottom: 8px;
            }
            
            .status-detail {
                font-size: 14px;
                color: var(--text-secondary, #666666);
            }
            
            .timeline-container {
                background: var(--bg-secondary, #f8f9fa);
                border-radius: 12px;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .timeline-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                border-left: 4px solid transparent;
            }
            
            .timeline-item:hover {
                background: rgba(40, 167, 69, 0.1);
                border-left-color: var(--color-success, #28a745);
            }
            
            .timeline-item.success { border-left-color: #28a745; }
            .timeline-item.failure { border-left-color: #dc3545; }
            .timeline-item.running { border-left-color: #ffc107; }
            
            .timeline-status {
                font-size: 20px;
                min-width: 24px;
            }
            
            .timeline-content {
                flex: 1;
            }
            
            .timeline-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary, #333333);
                margin-bottom: 4px;
            }
            
            .timeline-meta {
                font-size: 12px;
                color: var(--text-secondary, #666666);
            }
            
            .timeline-duration {
                font-size: 12px;
                font-weight: 500;
                color: var(--text-secondary, #666666);
            }
            
            .actions-viz-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                gap: 16px;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--border-color, #e9ecef);
                border-top: 3px solid var(--color-primary, #28a745);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-text {
                font-size: 14px;
                color: var(--text-secondary, #666666);
            }
            
            .actions-viz-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                gap: 16px;
            }
            
            .error-icon {
                font-size: 48px;
            }
            
            .error-message {
                font-size: 16px;
                color: var(--text-primary, #333333);
                text-align: center;
            }
            
            .error-retry {
                background: var(--color-primary, #28a745);
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .error-retry:hover {
                background: var(--color-primary-dark, #1e7e34);
                transform: translateY(-1px);
            }
            
            .actions-viz-footer {
                background: var(--bg-secondary, #f8f9fa);
                border-top: 1px solid var(--border-color, #e9ecef);
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .footer-info {
                display: flex;
                gap: 24px;
                font-size: 12px;
                color: var(--text-secondary, #666666);
            }
            
            .timeline-item.selected {
                background: rgba(40, 167, 69, 0.15);
                border-left-color: var(--color-primary, #28a745);
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
            }
            
            .job-overview {
                background: var(--bg-secondary, #f8f9fa);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                border: 1px solid var(--border-color, #e9ecef);
            }
            
            .job-overview-header h4 {
                margin: 0 0 8px 0;
                color: var(--text-primary, #333333);
            }
            
            .run-meta {
                display: flex;
                gap: 16px;
                font-size: 12px;
                color: var(--text-secondary, #666666);
            }
            
            .job-metrics-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 12px;
                margin-top: 16px;
            }
            
            .metric-card.compact {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: var(--bg-primary, #ffffff);
                border-radius: 8px;
                border: 1px solid var(--border-color, #e9ecef);
            }
            
            .metric-icon {
                font-size: 20px;
            }
            
            .metric-content {
                flex: 1;
            }
            
            .metric-value {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary, #333333);
                margin-bottom: 2px;
            }
            
            .metric-label {
                font-size: 11px;
                color: var(--text-secondary, #666666);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .jobs-timeline,
            .failure-analysis,
            .performance-insights {
                margin-bottom: 24px;
            }
            
            .jobs-timeline h4,
            .failure-analysis h4,
            .performance-insights h4 {
                margin: 0 0 16px 0;
                color: var(--text-primary, #333333);
            }
            
            .job-item {
                background: var(--bg-secondary, #f8f9fa);
                border-radius: 8px;
                margin-bottom: 8px;
                border-left: 3px solid transparent;
                transition: all 0.3s ease;
            }
            
            .job-item.success { border-left-color: #28a745; }
            .job-item.failure { border-left-color: #dc3545; }
            .job-item.in_progress { border-left-color: #ffc107; }
            
            .job-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                cursor: pointer;
            }
            
            .job-status {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .job-name {
                font-weight: 600;
                color: var(--text-primary, #333333);
            }
            
            .job-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 12px;
                color: var(--text-secondary, #666666);
            }
            
            .job-expand {
                background: none;
                border: none;
                color: var(--text-secondary, #666666);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            
            .job-expand:hover {
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #333333);
            }
            
            .job-steps {
                padding: 0 16px 16px 16px;
                border-top: 1px solid var(--border-color, #e9ecef);
            }
            
            .step-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                margin: 4px 0;
                background: var(--bg-primary, #ffffff);
                border-radius: 6px;
                border-left: 2px solid transparent;
            }
            
            .step-item.success { border-left-color: #28a745; }
            .step-item.failure { border-left-color: #dc3545; }
            
            .step-header {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            
            .step-name {
                flex: 1;
                font-size: 13px;
                color: var(--text-primary, #333333);
            }
            
            .step-duration {
                font-size: 11px;
                color: var(--text-secondary, #666666);
            }
            
            .insights-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .insight-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: var(--bg-secondary, #f8f9fa);
                border-radius: 8px;
                border: 1px solid var(--border-color, #e9ecef);
            }
            
            .insight-icon {
                font-size: 24px;
            }
            
            .insight-content {
                flex: 1;
            }
            
            .insight-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary, #333333);
                margin-bottom: 4px;
            }
            
            .insight-value {
                font-size: 12px;
                font-weight: 500;
                color: var(--color-primary, #28a745);
                margin-bottom: 2px;
            }
            
            .insight-detail {
                font-size: 11px;
                color: var(--text-secondary, #666666);
            }
            
            .failed-job {
                background: var(--bg-secondary, #f8f9fa);
                border: 1px solid #dc3545;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
            }
            
            .failed-job-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .failed-job-name {
                font-weight: 600;
                color: var(--text-primary, #333333);
            }
            
            .failure-details {
                font-size: 14px;
            }
            
            .failure-summary {
                color: #dc3545;
                font-weight: 500;
                margin-bottom: 8px;
            }
            
            .failure-recommendations ul {
                margin: 8px 0 0 20px;
                color: var(--text-secondary, #666666);
            }
            
            .drill-down-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                padding: 40px 20px;
                text-align: center;
            }
            
            .drill-down-error .error-icon {
                font-size: 48px;
            }
            
            .drill-down-error .error-message {
                color: var(--text-primary, #333333);
                font-size: 16px;
            }
            
            .error-retry {
                background: var(--color-primary, #28a745);
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .error-retry:hover {
                background: var(--color-primary-dark, #1e7e34);
                transform: translateY(-1px);
            }
            
            @media (max-width: 768px) {
                .actions-viz-modal {
                    margin: 10px;
                    border-radius: 12px;
                }
                
                .actions-viz-header {
                    padding: 16px;
                }
                
                .actions-viz-title h2 {
                    font-size: 20px;
                }
                
                .actions-viz-content {
                    padding: 16px;
                }
                
                .status-grid,
                .metrics-grid {
                    grid-template-columns: 1fr;
                }
                
                .footer-info {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .job-metrics-summary {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .insights-grid {
                    grid-template-columns: 1fr;
                }
                
                .run-meta {
                    flex-direction: column;
                    gap: 4px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const dashboard = document.getElementById('actions-viz-dashboard');
        
        // Close dashboard
        dashboard.querySelector('.actions-viz-close').addEventListener('click', () => {
            this.hideDashboard();
        });
        
        // Backdrop click to close
        dashboard.querySelector('.actions-viz-backdrop').addEventListener('click', () => {
            this.hideDashboard();
        });
        
        // Refresh data
        dashboard.querySelector('.actions-viz-refresh').addEventListener('click', () => {
            this.refreshData();
        });
        
        // Error retry
        dashboard.querySelector('.error-retry').addEventListener('click', () => {
            this.refreshData();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isVisible) {
                if (e.key === 'Escape') {
                    this.hideDashboard();
                } else if (e.key === 'r' || e.key === 'R') {
                    this.refreshData();
                }
            }
        });
    }
    
    /**
     * Toggle dashboard visibility
     */
    toggleDashboard() {
        if (this.isVisible) {
            this.hideDashboard();
        } else {
            this.showDashboard();
        }
    }
    
    /**
     * Show dashboard
     */
    async showDashboard() {
        const dashboard = document.getElementById('actions-viz-dashboard');
        dashboard.style.display = 'block';
        this.isVisible = true;
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        // Refresh data if stale
        if (!this.lastUpdateTime || Date.now() - this.lastUpdateTime > 60000) {
            await this.refreshData();
        }
    }
    
    /**
     * Hide dashboard
     */
    hideDashboard() {
        const dashboard = document.getElementById('actions-viz-dashboard');
        dashboard.style.display = 'none';
        this.isVisible = false;
        
        // Stop auto-refresh
        this.stopAutoRefresh();
    }
    
    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear existing timer
        this.refreshTimer = setInterval(() => {
            if (this.isVisible) {
                this.loadWorkflowData();
            }
        }, this.config.refreshInterval);
    }
    
    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    /**
     * Refresh data manually
     */
    async refreshData() {
        const refreshButton = document.querySelector('.actions-viz-refresh .refresh-icon');
        refreshButton.style.animation = 'rotate 1s linear infinite';
        
        try {
            await this.loadWorkflowData();
        } finally {
            setTimeout(() => {
                refreshButton.style.animation = '';
            }, 1000);
        }
    }
    
    /**
     * Load workflow data from GitHub API
     */
    async loadWorkflowData() {
        try {
            this.showLoading();
            
            // Fetch workflow runs
            const runsResponse = await fetch(
                `${this.config.apiBase}/repos/${this.config.owner}/${this.config.repo}/actions/runs?per_page=${this.config.maxRuns}`
            );
            
            if (!runsResponse.ok) {
                throw new Error(`GitHub API error: ${runsResponse.status}`);
            }
            
            const runsData = await runsResponse.json();
            
            // Process and cache data
            this.cache.set('workflow_runs', runsData.workflow_runs);
            this.lastUpdateTime = Date.now();
            
            // Update UI
            this.renderDashboard(runsData.workflow_runs);
            this.hideLoading();
            
            // Update last updated time
            document.getElementById('last-updated-time').textContent = 
                new Date().toLocaleTimeString();
                
        } catch (error) {
            console.error('Failed to load workflow data:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * Render the complete dashboard
     */
    renderDashboard(runs) {
        this.renderStatusOverview(runs);
        this.renderMetrics(runs);
        this.renderTimeline(runs);
    }
    
    /**
     * Render status overview cards
     */
    renderStatusOverview(runs) {
        const statusGrid = document.getElementById('status-grid');
        
        // Calculate status metrics
        const statusCounts = runs.reduce((acc, run) => {
            const status = run.status === 'completed' ? run.conclusion : run.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        
        const totalRuns = runs.length;
        const successRate = totalRuns > 0 ? 
            Math.round((statusCounts.success || 0) / totalRuns * 100) : 0;
        
        // Current status
        const latestRun = runs[0];
        const currentStatus = latestRun ? 
            (latestRun.status === 'completed' ? latestRun.conclusion : latestRun.status) : 'unknown';
        
        statusGrid.innerHTML = `
            <div class="status-card ${currentStatus}">
                <div class="status-card-header">
                    <span class="status-icon">${this.getStatusIcon(currentStatus)}</span>
                    <span class="status-title">Current Status</span>
                </div>
                <div class="status-value">${this.getStatusText(currentStatus)}</div>
                <div class="status-detail">
                    ${latestRun ? `Last run: ${this.formatTimeAgo(latestRun.updated_at)}` : 'No recent runs'}
                </div>
            </div>
            
            <div class="status-card">
                <div class="status-card-header">
                    <span class="status-icon">📊</span>
                    <span class="status-title">Success Rate</span>
                </div>
                <div class="status-value">${successRate}%</div>
                <div class="status-detail">
                    ${statusCounts.success || 0} successful out of ${totalRuns} runs
                </div>
            </div>
            
            <div class="status-card">
                <div class="status-card-header">
                    <span class="status-icon">⚡</span>
                    <span class="status-title">Active Workflows</span>
                </div>
                <div class="status-value">${statusCounts.in_progress || 0}</div>
                <div class="status-detail">
                    Currently running workflows
                </div>
            </div>
            
            <div class="status-card">
                <div class="status-card-header">
                    <span class="status-icon">❌</span>
                    <span class="status-title">Recent Failures</span>
                </div>
                <div class="status-value">${statusCounts.failure || 0}</div>
                <div class="status-detail">
                    Failed runs in last ${totalRuns} executions
                </div>
            </div>
        `;
    }
    
    /**
     * Render performance metrics
     */
    renderMetrics(runs) {
        const metricsGrid = document.getElementById('metrics-grid');
        
        // Calculate metrics
        const completedRuns = runs.filter(run => run.status === 'completed');
        const avgDuration = completedRuns.length > 0 ? 
            completedRuns.reduce((sum, run) => {
                const duration = new Date(run.updated_at) - new Date(run.created_at);
                return sum + duration;
            }, 0) / completedRuns.length : 0;
        
        const recentRuns = runs.filter(run => {
            const runDate = new Date(run.created_at);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return runDate > dayAgo;
        });
        
        // Workflow frequency
        const workflows = [...new Set(runs.map(run => run.name))];
        
        metricsGrid.innerHTML = `
            <div class="metric-card">
                <div class="status-card-header">
                    <span class="status-icon">⏱️</span>
                    <span class="status-title">Avg Duration</span>
                </div>
                <div class="status-value">${this.formatDuration(avgDuration)}</div>
                <div class="status-detail">
                    Average workflow execution time
                </div>
            </div>
            
            <div class="metric-card">
                <div class="status-card-header">
                    <span class="status-icon">🔄</span>
                    <span class="status-title">Daily Runs</span>
                </div>
                <div class="status-value">${recentRuns.length}</div>
                <div class="status-detail">
                    Workflow executions in last 24h
                </div>
            </div>
            
            <div class="metric-card">
                <div class="status-card-header">
                    <span class="status-icon">🛠️</span>
                    <span class="status-title">Active Workflows</span>
                </div>
                <div class="status-value">${workflows.length}</div>
                <div class="status-detail">
                    Different workflow configurations
                </div>
            </div>
            
            <div class="metric-card">
                <div class="status-card-header">
                    <span class="status-icon">📈</span>
                    <span class="status-title">Deployment Freq</span>
                </div>
                <div class="status-value">${Math.round(recentRuns.length / 7 * 10) / 10}</div>
                <div class="status-detail">
                    Average deployments per day
                </div>
            </div>
        `;
    }
    
    /**
     * Render workflow timeline
     */
    renderTimeline(runs) {
        const timelineContainer = document.getElementById('timeline-container');
        
        const timelineHtml = runs.map(run => {
            const status = run.status === 'completed' ? run.conclusion : run.status;
            const duration = run.status === 'completed' ? 
                new Date(run.updated_at) - new Date(run.created_at) : null;
            
            return `
                <div class="timeline-item ${status}" data-run-id="${run.id}">
                    <span class="timeline-status">${this.getStatusIcon(status)}</span>
                    <div class="timeline-content">
                        <div class="timeline-title">${run.name}</div>
                        <div class="timeline-meta">
                            ${this.formatTimeAgo(run.created_at)} • 
                            Branch: ${run.head_branch || 'main'} • 
                            ${run.actor?.login || 'System'}
                        </div>
                    </div>
                    <div class="timeline-duration">
                        ${duration ? this.formatDuration(duration) : '—'}
                    </div>
                </div>
            `;
        }).join('');
        
        timelineContainer.innerHTML = timelineHtml;
        
        // Add click handlers for drill-down
        timelineContainer.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', () => {
                const runId = item.dataset.runId;
                this.showRunDetails(runId);
            });
        });
    }
    
    /**
     * Show detailed run information
     */
    async showRunDetails(runId) {
        // This would expand to show job-level details
        // For now, just highlight the selected run
        document.querySelectorAll('.timeline-item').forEach(item => {
            item.style.background = '';
        });
        
        const selectedItem = document.querySelector(`[data-run-id="${runId}"]`);
        if (selectedItem) {
            selectedItem.style.background = 'rgba(40, 167, 69, 0.1)';
        }
        
        
        
    }
    
    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            success: '✅',
            failure: '❌',
            cancelled: '⚠️',
            in_progress: '🔄',
            queued: '⏳',
            unknown: '❓'
        };
        return icons[status] || icons.unknown;
    }
    
    /**
     * Get status text
     */
    getStatusText(status) {
        const texts = {
            success: 'Success',
            failure: 'Failed',
            cancelled: 'Cancelled',
            in_progress: 'Running',
            queued: 'Queued',
            unknown: 'Unknown'
        };
        return texts[status] || texts.unknown;
    }
    
    /**
     * Format duration
     */
    formatDuration(milliseconds) {
        if (!milliseconds) return '—';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Format time ago
     */
    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays}d ago`;
        } else if (diffHours > 0) {
            return `${diffHours}h ago`;
        } else if (diffMins > 0) {
            return `${diffMins}m ago`;
        } else {
            return 'Just now';
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        document.querySelector('.actions-viz-loading').style.display = 'flex';
        document.querySelector('.actions-viz-main').style.display = 'none';
        document.querySelector('.actions-viz-error').style.display = 'none';
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        document.querySelector('.actions-viz-loading').style.display = 'none';
        document.querySelector('.actions-viz-main').style.display = 'block';
        document.querySelector('.actions-viz-error').style.display = 'none';
    }
    
    /**
     * Show error state
     */
    showError(message) {
        document.querySelector('.actions-viz-loading').style.display = 'none';
        document.querySelector('.actions-viz-main').style.display = 'none';
        document.querySelector('.actions-viz-error').style.display = 'flex';
        document.querySelector('.error-message').textContent = message;
    }
    
    /**
     * Destroy the visualizer
     */
    destroy() {
        this.stopAutoRefresh();
        
        // Remove elements
        const button = document.getElementById('actions-viz-toggle');
        const dashboard = document.getElementById('actions-viz-dashboard');
        
        if (button) button.remove();
        if (dashboard) dashboard.remove();
        
        
    }
}

// Export for global use
window.GitHubActionsVisualizer = GitHubActionsVisualizer;