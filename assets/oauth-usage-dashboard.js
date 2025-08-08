/**
 * OAuth Usage Dashboard JavaScript
 * Real-time monitoring and cost optimization interface
 */

class OAuthUsageDashboard {
    constructor() {
        this.dataRefreshInterval = 30000; // 30 seconds
        this.refreshTimer = null;
        this.charts = {};
        this.isLoading = false;
        
        // Initialize dashboard
        this.init();
    }

    /**
     * Initialize dashboard
     */
    async init() {
        
        
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.refreshData();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            // Initialize charts
            this.initializeCharts();
            
            
            
        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Period/range controls
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchPeriod(e.target.dataset.period);
            });
        });
        
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartRange(e.target.dataset.range);
            });
        });
        
        // Configuration
        document.getElementById('save-config')?.addEventListener('click', () => {
            this.saveConfiguration();
        });
        
        document.getElementById('reset-config')?.addEventListener('click', () => {
            this.resetConfiguration();
        });
        
        // Tier selection
        document.querySelectorAll('input[name="tier"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateTierSelection(e.target.value);
            });
        });
    }

    /**
     * Refresh dashboard data
     */
    async refreshData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        this.setRefreshButtonLoading(true);
        
        try {
            
            
            // Simulate API call (replace with actual data fetching)
            const usageData = await this.fetchUsageData();
            
            // Update UI components
            this.updateUsageStats(usageData.stats);
            this.updateCostAnalysis(usageData.costs);
            this.updateAlerts(usageData.alerts);
            this.updateRecommendations(usageData.recommendations);
            
            // Update status indicators
            this.updateStatusIndicators(usageData.status);
            
            // Update timestamp
            document.getElementById('last-updated').textContent = new Date().toLocaleString();
            
            
            
        } catch (error) {
            console.error('❌ Failed to refresh data:', error);
            this.showError('Failed to refresh data');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
            this.setRefreshButtonLoading(false);
        }
    }

    /**
     * Fetch usage data (mock implementation)
     */
    async fetchUsageData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API calls
        return {
            stats: {
                quota: {
                    used: Math.floor(Math.random() * 50),
                    limit: 50,
                    percentage: Math.floor(Math.random() * 100)
                },
                requests: Math.floor(Math.random() * 100),
                successRate: 95 + Math.floor(Math.random() * 5),
                avgResponseTime: 800 + Math.floor(Math.random() * 400),
                nextReset: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
            },
            costs: {
                monthly: 100,
                comparison: {
                    oauth: 100,
                    apiKey: 150,
                    savings: 50,
                    recommendation: 'oauth'
                }
            },
            status: {
                connection: 'online',
                auth: 'authenticated',
                quota: 'normal'
            },
            alerts: [],
            recommendations: [
                {
                    category: 'optimization',
                    priority: 'medium',
                    message: 'Good quota utilization - consider consistent usage patterns',
                    impact: 'efficiency'
                }
            ]
        };
    }

    /**
     * Update usage statistics display
     */
    updateUsageStats(stats) {
        // Quota usage
        document.getElementById('quota-usage').textContent = stats.quota.used;
        document.getElementById('quota-limit').textContent = `/ ${stats.quota.limit}`;
        document.getElementById('quota-percentage').textContent = `(${stats.quota.percentage}%)`;
        
        const quotaProgress = document.getElementById('quota-progress');
        if (quotaProgress) {
            quotaProgress.style.width = `${stats.quota.percentage}%`;
            
            // Update color based on usage
            quotaProgress.className = 'progress-fill';
            if (stats.quota.percentage > 90) quotaProgress.classList.add('critical');
            else if (stats.quota.percentage > 75) quotaProgress.classList.add('warning');
        }
        
        // Success rate
        document.getElementById('success-rate').textContent = `${stats.successRate}%`;
        document.getElementById('total-requests').textContent = `${stats.requests} requests`;
        
        const successProgress = document.getElementById('success-progress');
        if (successProgress) {
            successProgress.style.width = `${stats.successRate}%`;
        }
        
        // Reset countdown
        if (stats.nextReset) {
            this.startCountdown(stats.nextReset);
        }
    }

    /**
     * Start countdown to next reset
     */
    startCountdown(resetTime) {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const reset = new Date(resetTime).getTime();
            const difference = reset - now;
            
            if (difference > 0) {
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                
                document.getElementById('reset-countdown').textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    
                document.getElementById('reset-time').textContent = 
                    `Next reset: ${new Date(resetTime).toLocaleString()}`;
            } else {
                document.getElementById('reset-countdown').textContent = '00:00:00';
                document.getElementById('reset-time').textContent = 'Quota reset!';
            }
        };
        
        // Update immediately and then every second
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    /**
     * Update cost analysis display
     */
    updateCostAnalysis(costs) {
        // Monthly cost
        document.getElementById('monthly-cost').textContent = `$${costs.monthly}`;
        
        // Cost comparison
        if (costs.comparison) {
            document.getElementById('oauth-cost').textContent = `$${costs.comparison.oauth}`;
            document.getElementById('api-cost').textContent = `$${costs.comparison.apiKey}`;
            
            // Savings indicator
            const savingsIndicator = document.getElementById('savings-indicator');
            const savingsIcon = savingsIndicator.querySelector('.savings-icon');
            const savingsText = savingsIndicator.querySelector('.savings-text');
            
            if (costs.comparison.savings > 0) {
                savingsIcon.textContent = '💰';
                savingsText.textContent = `Saving $${costs.comparison.savings}/month with OAuth`;
                savingsIndicator.className = 'savings-indicator positive';
            } else {
                savingsIcon.textContent = '⚠️';
                savingsText.textContent = `API key could save $${Math.abs(costs.comparison.savings)}/month`;
                savingsIndicator.className = 'savings-indicator negative';
            }
            
            // Update badges
            const apiBadge = document.getElementById('api-badge');
            if (costs.comparison.recommendation === 'api_key') {
                apiBadge.textContent = 'Recommended';
                apiBadge.className = 'method-badge recommended';
            } else {
                apiBadge.textContent = 'Alternative';
                apiBadge.className = 'method-badge';
            }
        }
    }

    /**
     * Update alerts display
     */
    updateAlerts(alerts) {
        const alertsList = document.getElementById('active-alerts');
        const alertCount = document.getElementById('alert-count');
        
        alertCount.textContent = alerts.length;
        
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="no-alerts">
                    <span class="check-icon" aria-hidden="true">✅</span>
                    <span>No active alerts</span>
                </div>
            `;
        } else {
            alertsList.innerHTML = alerts.map(alert => `
                <div class="alert-item ${alert.severity}">
                    <span class="alert-icon" aria-hidden="true">${alert.severity === 'critical' ? '🚨' : '⚠️'}</span>
                    <div class="alert-content">
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-time">${new Date(alert.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Update recommendations display
     */
    updateRecommendations(recommendations) {
        const recsList = document.getElementById('recommendations-list');
        
        if (recommendations.length === 0) {
            recsList.innerHTML = `
                <div class="no-recommendations">
                    <span class="check-icon" aria-hidden="true">✅</span>
                    <span>All optimizations applied</span>
                </div>
            `;
        } else {
            recsList.innerHTML = recommendations.map(rec => `
                <div class="recommendation-item ${rec.priority}">
                    <span class="rec-icon" aria-hidden="true">${rec.priority === 'high' ? '🔥' : '💡'}</span>
                    <div class="rec-content">
                        <div class="rec-message">${rec.message}</div>
                        <div class="rec-impact">Impact: ${rec.impact}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * Update status indicators
     */
    updateStatusIndicators(status) {
        // Connection status
        const connectionStatus = document.getElementById('connection-status');
        const connectionDot = connectionStatus.querySelector('.status-dot');
        const connectionText = connectionStatus.querySelector('.status-text');
        
        if (status.connection === 'online') {
            connectionDot.className = 'status-dot online';
            connectionText.textContent = 'Connected';
        } else {
            connectionDot.className = 'status-dot offline';
            connectionText.textContent = 'Disconnected';
        }
        
        // Auth status
        document.getElementById('auth-status').querySelector('.auth-text').textContent = 
            status.auth === 'authenticated' ? 'Authenticated' : 'Authentication required';
            
        // Quota status
        document.getElementById('quota-status').querySelector('.quota-text').textContent = 
            status.quota === 'normal' ? 'Quota normal' : 'Quota warning';
    }

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Set refresh button loading state
     */
    setRefreshButtonLoading(loading) {
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            if (loading) {
                refreshBtn.classList.add('loading');
            } else {
                refreshBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Simple error notification - could be enhanced with toast notifications
        console.error('Dashboard Error:', message);
        alert(message);
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            if (!this.isLoading) {
                this.refreshData();
            }
        }, this.dataRefreshInterval);
        
        `);
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
     * Initialize charts
     */
    initializeCharts() {
        // Usage trends chart
        const usageChartCanvas = document.getElementById('usage-chart');
        if (usageChartCanvas) {
            this.charts.usage = new Chart(usageChartCanvas, {
                type: 'line',
                data: {
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                        label: 'Requests',
                        data: Array.from({length: 24}, () => Math.floor(Math.random() * 10)),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    /**
     * Switch cost period
     */
    switchPeriod(period) {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
        
        // Update cost display based on period
        
    }

    /**
     * Switch chart range
     */
    switchChartRange(range) {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });
        
        // Update chart data based on range
        
    }

    /**
     * Save configuration
     */
    async saveConfiguration() {
        try {
            const config = this.gatherConfiguration();
            
            // Save configuration (implement actual saving)
            
            
            // Show success message
            alert('Configuration saved successfully!');
            
        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
            alert('Failed to save configuration');
        }
    }

    /**
     * Reset configuration to defaults
     */
    resetConfiguration() {
        if (confirm('Reset all settings to defaults?')) {
            // Reset form values
            document.querySelector('input[name="tier"][value="max_5x"]').checked = true;
            document.getElementById('enable-alerts').checked = true;
            
            const thresholdInputs = document.querySelectorAll('.threshold-input');
            const defaults = [50, 75, 90, 95];
            thresholdInputs.forEach((input, index) => {
                input.value = defaults[index] || 0;
            });
            
            
        }
    }

    /**
     * Gather current configuration
     */
    gatherConfiguration() {
        const selectedTier = document.querySelector('input[name="tier"]:checked')?.value;
        const alertsEnabled = document.getElementById('enable-alerts')?.checked;
        const thresholds = Array.from(document.querySelectorAll('.threshold-input')).map(input => 
            parseInt(input.value) || 0
        );
        
        return {
            tier: selectedTier,
            alertsEnabled,
            thresholds
        };
    }

    /**
     * Update tier selection
     */
    updateTierSelection(tier) {
        
        
        // Update quota limits and costs based on tier
        // This would typically trigger a data refresh
    }

    /**
     * Cleanup when dashboard is destroyed
     */
    destroy() {
        this.stopAutoRefresh();
        
        // Cleanup charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.oauthDashboard = new OAuthUsageDashboard();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.oauthDashboard) {
        window.oauthDashboard.destroy();
    }
});