#!/usr/bin/env node

/**
 * OAuth Usage Monitoring Dashboard Generator
 * 
 * Creates real-time usage monitoring dashboard for OAuth cost optimization
 * with live metrics, cost tracking, and alert management.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Usage Monitoring Dashboard Generator
 */
class UsageMonitorDashboard {
    constructor() {
        this.outputDir = path.resolve(__dirname, '../../');
        this.dataDir = path.resolve(__dirname, '../../data');
        this.assetsDir = path.resolve(__dirname, '../../assets');
    }

    /**
     * Generate usage monitoring dashboard
     */
    async generateDashboard() {
        try {
            console.log('📊 Generating OAuth Usage Monitoring Dashboard...');
            
            // Create dashboard HTML
            const dashboardHtml = this.createDashboardHTML();
            await fs.writeFile(
                path.join(this.outputDir, 'oauth-usage-dashboard.html'),
                dashboardHtml
            );
            
            // Create dashboard CSS
            const dashboardCSS = this.createDashboardCSS();
            await fs.writeFile(
                path.join(this.assetsDir, 'oauth-usage-dashboard.css'),
                dashboardCSS
            );
            
            // Create dashboard JavaScript
            const dashboardJS = this.createDashboardJS();
            await fs.writeFile(
                path.join(this.assetsDir, 'oauth-usage-dashboard.js'),
                dashboardJS
            );
            
            console.log('✅ OAuth Usage Monitoring Dashboard generated');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to generate dashboard:', error);
            return false;
        }
    }

    /**
     * Create dashboard HTML
     */
    createDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OAuth Usage Dashboard - Adrian Wedd CV</title>
    <meta name="description" content="Real-time OAuth usage monitoring and cost optimization dashboard">
    
    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Styles -->
    <link rel="stylesheet" href="assets/styles.css">
    <link rel="stylesheet" href="assets/oauth-usage-dashboard.css">
    
    <!-- Chart.js for visualizations -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js" defer></script>
    
    <!-- Icon -->
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💰</text></svg>">
    
    <!-- Open Graph -->
    <meta property="og:title" content="OAuth Usage Dashboard - Adrian Wedd CV">
    <meta property="og:description" content="Real-time OAuth usage monitoring and cost optimization">
    <meta property="og:type" content="website">
    
    <!-- Theme and accessibility -->
    <meta name="color-scheme" content="light dark">
    <meta name="theme-color" content="#2563eb">
</head>
<body class="usage-dashboard">
    <!-- Skip to main content -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Navigation -->
    <nav class="usage-nav" role="navigation" aria-label="Usage Dashboard Navigation">
        <div class="nav-container">
            <div class="nav-brand">
                <a href="index.html" class="brand-link" aria-label="Return to main CV">
                    <span class="icon" aria-hidden="true">💰</span>
                    <span class="brand-text">OAuth Usage</span>
                </a>
            </div>
            
            <div class="nav-links">
                <a href="index.html" class="nav-link">
                    <span class="link-icon" aria-hidden="true">👤</span>
                    <span>CV Home</span>
                </a>
                <a href="career-intelligence.html" class="nav-link">
                    <span class="link-icon" aria-hidden="true">📊</span>
                    <span>Analytics</span>
                </a>
                <button id="refresh-data" class="nav-link refresh-btn" aria-label="Refresh usage data">
                    <span class="link-icon" aria-hidden="true">🔄</span>
                    <span>Refresh</span>
                </button>
            </div>
        </div>
    </nav>
    
    <!-- Main Content -->
    <main id="main-content" class="usage-main" role="main">
        <!-- Header -->
        <header class="usage-header">
            <div class="header-content">
                <h1 class="usage-title">
                    <span class="title-icon" aria-hidden="true">💰</span>
                    OAuth Usage Dashboard
                </h1>
                <p class="usage-subtitle">Real-time cost optimization and quota monitoring</p>
                
                <!-- Status Indicators -->
                <div class="status-bar">
                    <div class="status-item" id="connection-status">
                        <span class="status-dot" aria-hidden="true"></span>
                        <span class="status-text">Connecting...</span>
                    </div>
                    <div class="status-item" id="auth-status">
                        <span class="status-icon" aria-hidden="true">🔐</span>
                        <span class="auth-text">Checking auth...</span>
                    </div>
                    <div class="status-item" id="quota-status">
                        <span class="quota-icon" aria-hidden="true">📊</span>
                        <span class="quota-text">Loading quota...</span>
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Quick Stats Grid -->
        <section class="stats-overview" aria-labelledby="stats-title">
            <h2 id="stats-title" class="section-title">Current Usage Overview</h2>
            
            <div class="stats-grid">
                <!-- Quota Usage -->
                <div class="stat-card primary" role="article">
                    <div class="stat-header">
                        <h3>Quota Usage</h3>
                        <span class="stat-icon" aria-hidden="true">⚡</span>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="quota-usage">--</div>
                        <div class="stat-meta">
                            <span class="quota-limit" id="quota-limit">/ --</span>
                            <span class="quota-percentage" id="quota-percentage">(-%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="quota-progress"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Monthly Cost -->
                <div class="stat-card" role="article">
                    <div class="stat-header">
                        <h3>Monthly Cost</h3>
                        <span class="stat-icon" aria-hidden="true">💵</span>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="monthly-cost">$--</div>
                        <div class="stat-trend" id="cost-trend">
                            <span class="trend-indicator" aria-hidden="true">→</span>
                            <span class="trend-text">Fixed</span>
                        </div>
                    </div>
                </div>
                
                <!-- Success Rate -->
                <div class="stat-card" role="article">
                    <div class="stat-header">
                        <h3>Success Rate</h3>
                        <span class="stat-icon" aria-hidden="true">✅</span>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value" id="success-rate">--%</div>
                        <div class="stat-meta">
                            <span id="total-requests">-- requests</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill success" id="success-progress"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Next Reset -->
                <div class="stat-card" role="article">
                    <div class="stat-header">
                        <h3>Quota Reset</h3>
                        <span class="stat-icon" aria-hidden="true">⏰</span>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value countdown" id="reset-countdown">--:--:--</div>
                        <div class="stat-meta">
                            <span id="reset-time">Next reset: --</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Cost Analysis -->
        <section class="cost-section" aria-labelledby="cost-title">
            <h2 id="cost-title" class="section-title">Cost Analysis & Optimization</h2>
            
            <div class="cost-grid">
                <!-- Cost Comparison -->
                <div class="cost-card" role="article">
                    <div class="card-header">
                        <h3>OAuth vs API Key Costs</h3>
                        <div class="cost-period">
                            <button class="period-btn active" data-period="monthly">Monthly</button>
                            <button class="period-btn" data-period="yearly">Yearly</button>
                        </div>
                    </div>
                    <div class="cost-comparison" id="cost-comparison">
                        <div class="comparison-item oauth">
                            <div class="comparison-header">
                                <span class="method-name">OAuth (Current)</span>
                                <span class="method-badge recommended">Current</span>
                            </div>
                            <div class="method-cost" id="oauth-cost">$--</div>
                            <div class="method-details">
                                <span id="oauth-details">-- requests included</span>
                            </div>
                        </div>
                        
                        <div class="comparison-vs">vs</div>
                        
                        <div class="comparison-item api">
                            <div class="comparison-header">
                                <span class="method-name">API Key</span>
                                <span class="method-badge" id="api-badge">Alternative</span>
                            </div>
                            <div class="method-cost" id="api-cost">$--</div>
                            <div class="method-details">
                                <span id="api-details">Pay per request</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="savings-indicator" id="savings-indicator">
                        <span class="savings-icon" aria-hidden="true">💰</span>
                        <span class="savings-text">Calculating savings...</span>
                    </div>
                </div>
                
                <!-- Usage Trends Chart -->
                <div class="cost-card chart-card" role="img" aria-labelledby="usage-chart-title">
                    <div class="card-header">
                        <h3 id="usage-chart-title">Usage Trends</h3>
                        <div class="chart-controls">
                            <button class="chart-btn active" data-range="24h">24H</button>
                            <button class="chart-btn" data-range="7d">7D</button>
                            <button class="chart-btn" data-range="30d">30D</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="usage-chart" aria-label="OAuth usage trends over time"></canvas>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Alerts & Recommendations -->
        <section class="alerts-section" aria-labelledby="alerts-title">
            <h2 id="alerts-title" class="section-title">Alerts & Recommendations</h2>
            
            <div class="alerts-grid">
                <!-- Active Alerts -->
                <div class="alerts-card" role="region" aria-labelledby="active-alerts-title">
                    <div class="card-header">
                        <h3 id="active-alerts-title">Active Alerts</h3>
                        <div class="alert-count" id="alert-count">0</div>
                    </div>
                    <div class="alerts-list" id="active-alerts">
                        <div class="no-alerts">
                            <span class="check-icon" aria-hidden="true">✅</span>
                            <span>No active alerts</span>
                        </div>
                    </div>
                </div>
                
                <!-- Optimization Recommendations -->
                <div class="recommendations-card" role="region" aria-labelledby="recommendations-title">
                    <div class="card-header">
                        <h3 id="recommendations-title">Optimization Recommendations</h3>
                        <button class="refresh-recs" id="refresh-recommendations" aria-label="Refresh recommendations">
                            <span aria-hidden="true">🔄</span>
                        </button>
                    </div>
                    <div class="recommendations-list" id="recommendations-list">
                        <div class="loading-recommendations">
                            <span class="loading-icon" aria-hidden="true">⏳</span>
                            <span>Analyzing usage patterns...</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Configuration -->
        <section class="config-section" aria-labelledby="config-title">
            <h2 id="config-title" class="section-title">Configuration & Settings</h2>
            
            <div class="config-card">
                <div class="config-group">
                    <h3>Subscription Tier</h3>
                    <div class="tier-selector">
                        <label class="tier-option">
                            <input type="radio" name="tier" value="max_5x" checked>
                            <span class="tier-info">
                                <span class="tier-name">Claude Max 5x</span>
                                <span class="tier-details">$100/month • 50 requests/5h</span>
                            </span>
                        </label>
                        <label class="tier-option">
                            <input type="radio" name="tier" value="max_20x">
                            <span class="tier-info">
                                <span class="tier-name">Claude Max 20x</span>
                                <span class="tier-details">$200/month • 800 requests/5h</span>
                            </span>
                        </label>
                    </div>
                </div>
                
                <div class="config-group">
                    <h3>Alert Settings</h3>
                    <div class="alert-settings">
                        <label class="setting-item">
                            <input type="checkbox" id="enable-alerts" checked>
                            <span>Enable budget alerts</span>
                        </label>
                        <div class="threshold-settings">
                            <label>Alert thresholds:</label>
                            <div class="threshold-inputs">
                                <input type="number" value="50" min="0" max="100" class="threshold-input"> %
                                <input type="number" value="75" min="0" max="100" class="threshold-input"> %
                                <input type="number" value="90" min="0" max="100" class="threshold-input"> %
                                <input type="number" value="95" min="0" max="100" class="threshold-input"> %
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="config-actions">
                    <button class="btn-primary" id="save-config">Save Configuration</button>
                    <button class="btn-secondary" id="reset-config">Reset to Defaults</button>
                </div>
            </div>
        </section>
        
        <!-- Footer -->
        <footer class="usage-footer">
            <div class="footer-content">
                <p class="footer-text">
                    Last updated: <span id="last-updated">--</span> | 
                    <a href="index.html" class="footer-link">Return to CV</a> |
                    <a href="career-intelligence.html" class="footer-link">Analytics</a>
                </p>
            </div>
        </footer>
    </main>
    
    <!-- Loading Overlay -->
    <div id="loading-overlay" class="loading-overlay" aria-live="polite">
        <div class="loading-content">
            <div class="loading-spinner" aria-hidden="true"></div>
            <div class="loading-text">Loading usage data...</div>
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="assets/oauth-usage-dashboard.js" defer></script>
</body>
</html>`;
    }

    /**
     * Create dashboard CSS
     */
    createDashboardCSS() {
        return `/**
 * OAuth Usage Dashboard Styles
 * Professional cost optimization monitoring interface
 */

/* Dashboard Layout */
.usage-dashboard {
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1f2937);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

/* Navigation */
.usage-nav {
    background: var(--bg-secondary, #f8fafc);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
}

.nav-brand .brand-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--text-primary, #1f2937);
    font-weight: 600;
}

.nav-links {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: var(--text-secondary, #64748b);
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s ease;
}

.nav-link:hover {
    background: var(--bg-hover, #e2e8f0);
    color: var(--text-primary, #1f2937);
}

.refresh-btn.loading .link-icon {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Main Content */
.usage-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

/* Header */
.usage-header {
    text-align: center;
    margin-bottom: 3rem;
}

.usage-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
}

.usage-subtitle {
    font-size: 1.25rem;
    color: var(--text-secondary, #64748b);
    margin: 0 0 2rem 0;
}

/* Status Bar */
.status-bar {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.5rem;
    font-size: 0.875rem;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-gray, #94a3b8);
}

.status-dot.online { background: var(--color-success, #10b981); }
.status-dot.offline { background: var(--color-error, #ef4444); }

/* Stats Overview */
.section-title {
    font-size: 1.875rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.stat-card {
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.75rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
}

.stat-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary, #2563eb);
}

.stat-card.primary {
    background: linear-gradient(135deg, var(--color-primary, #2563eb) 0%, var(--color-primary-dark, #1d4ed8) 100%);
    color: white;
    border: none;
}

.stat-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 1rem;
}

.stat-header h3 {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    opacity: 0.9;
}

.stat-icon {
    font-size: 1.5rem;
    opacity: 0.8;
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.5rem;
}

.stat-meta {
    font-size: 0.875rem;
    opacity: 0.8;
    margin-bottom: 1rem;
}

/* Progress Bar */
.progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.stat-card.primary .progress-bar {
    background: rgba(255, 255, 255, 0.2);
}

.progress-fill {
    height: 100%;
    background: var(--color-primary, #2563eb);
    border-radius: 2px;
    transition: width 0.5s ease;
    width: 0%;
}

.stat-card.primary .progress-fill {
    background: rgba(255, 255, 255, 0.8);
}

.progress-fill.success {
    background: var(--color-success, #10b981);
}

/* Countdown */
.countdown {
    font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
    letter-spacing: 0.05em;
}

/* Cost Section */
.cost-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
}

.cost-card {
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.75rem;
    padding: 1.5rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.card-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
}

/* Cost Comparison */
.cost-comparison {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.comparison-item {
    flex: 1;
    text-align: center;
    padding: 1rem;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.5rem;
}

.comparison-item.oauth {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: var(--color-primary, #2563eb);
}

.comparison-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.method-name {
    font-weight: 500;
}

.method-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background: var(--bg-tertiary, #e2e8f0);
    color: var(--text-secondary, #64748b);
}

.method-badge.recommended {
    background: var(--color-success, #10b981);
    color: white;
}

.method-cost {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
}

.method-details {
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
}

.comparison-vs {
    font-weight: 600;
    color: var(--text-secondary, #64748b);
}

.savings-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-success, #f0fdf4);
    border: 1px solid var(--color-success-light, #bbf7d0);
    border-radius: 0.5rem;
    font-weight: 500;
}

/* Chart Card */
.chart-card {
    grid-column: span 2;
}

.chart-container {
    position: relative;
    height: 300px;
}

/* Period/Range Controls */
.period-btn,
.chart-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--bg-secondary, #f8fafc);
    color: var(--text-secondary, #64748b);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.period-btn:hover,
.chart-btn:hover {
    background: var(--bg-hover, #e2e8f0);
}

.period-btn.active,
.chart-btn.active {
    background: var(--color-primary, #2563eb);
    color: white;
    border-color: var(--color-primary, #2563eb);
}

.cost-period,
.chart-controls {
    display: flex;
    gap: 0.5rem;
}

/* Alerts Section */
.alerts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
}

.alerts-card,
.recommendations-card {
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.75rem;
    padding: 1.5rem;
}

.alert-count {
    background: var(--color-error, #ef4444);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    min-width: 2rem;
    text-align: center;
}

.alerts-list,
.recommendations-list {
    space-y: 1rem;
}

.no-alerts,
.loading-recommendations {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    text-align: center;
    color: var(--text-secondary, #64748b);
    justify-content: center;
}

/* Configuration */
.config-card {
    background: var(--bg-secondary, #f8fafc);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.75rem;
    padding: 2rem;
    margin-bottom: 3rem;
}

.config-group {
    margin-bottom: 2rem;
}

.config-group h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
}

.tier-selector {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.tier-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tier-option:hover {
    background: var(--bg-hover, #e2e8f0);
}

.tier-option input[type="radio"] {
    margin: 0;
}

.tier-info {
    flex: 1;
}

.tier-name {
    display: block;
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.tier-details {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
}

/* Alert Settings */
.alert-settings {
    space-y: 1rem;
}

.setting-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.threshold-settings {
    margin-top: 1rem;
    margin-left: 1.5rem;
}

.threshold-inputs {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.5rem;
}

.threshold-input {
    width: 60px;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 0.25rem;
}

/* Actions */
.config-actions {
    display: flex;
    gap: 1rem;
}

.btn-primary,
.btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}

.btn-primary {
    background: var(--color-primary, #2563eb);
    color: white;
}

.btn-primary:hover {
    background: var(--color-primary-dark, #1d4ed8);
}

.btn-secondary {
    background: var(--bg-tertiary, #e2e8f0);
    color: var(--text-primary, #1f2937);
}

.btn-secondary:hover {
    background: var(--bg-hover, #d1d5db);
}

/* Footer */
.usage-footer {
    margin-top: 4rem;
    padding: 2rem 0;
    border-top: 1px solid var(--border-color, #e2e8f0);
    text-align: center;
}

.footer-text {
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
}

.footer-link {
    color: var(--color-primary, #2563eb);
    text-decoration: none;
}

.footer-link:hover {
    text-decoration: underline;
}

/* Loading Overlay */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.loading-content {
    background: var(--bg-secondary, #f8fafc);
    padding: 2rem;
    border-radius: 0.75rem;
    text-align: center;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color, #e2e8f0);
    border-top: 4px solid var(--color-primary, #2563eb);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
}

/* Responsive Design */
@media (max-width: 768px) {
    .usage-main {
        padding: 1rem 0.5rem;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .cost-grid {
        grid-template-columns: 1fr;
    }
    
    .chart-card {
        grid-column: span 1;
    }
    
    .alerts-grid {
        grid-template-columns: 1fr;
    }
    
    .cost-comparison {
        flex-direction: column;
        gap: 1rem;
    }
    
    .comparison-vs {
        transform: rotate(90deg);
    }
    
    .nav-links {
        gap: 0.5rem;
    }
    
    .nav-link span:not(.link-icon) {
        display: none;
    }
    
    .status-bar {
        gap: 1rem;
    }
    
    .usage-title {
        font-size: 2rem;
    }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    .usage-dashboard {
        --bg-primary: #0f172a;
        --bg-secondary: #1e293b;
        --bg-tertiary: #334155;
        --bg-hover: #475569;
        --text-primary: #f1f5f9;
        --text-secondary: #94a3b8;
        --border-color: #334155;
        --bg-success: #064e3b;
        --color-success-light: #065f46;
    }
    
    .stat-card.primary {
        background: linear-gradient(135deg, var(--color-primary, #2563eb) 0%, var(--color-primary-dark, #1d4ed8) 100%);
    }
    
    .comparison-item.oauth {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        color: white;
    }
}`;
    }

    /**
     * Create dashboard JavaScript
     */
    createDashboardJS() {
        return `/**
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
        console.log('🚀 Initializing OAuth Usage Dashboard');
        
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.refreshData();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            // Initialize charts
            this.initializeCharts();
            
            console.log('✅ Dashboard initialized successfully');
            
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
            console.log('🔄 Refreshing usage data...');
            
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
            
            console.log('✅ Data refreshed successfully');
            
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
        document.getElementById('quota-limit').textContent = \`/ \${stats.quota.limit}\`;
        document.getElementById('quota-percentage').textContent = \`(\${stats.quota.percentage}%)\`;
        
        const quotaProgress = document.getElementById('quota-progress');
        if (quotaProgress) {
            quotaProgress.style.width = \`\${stats.quota.percentage}%\`;
            
            // Update color based on usage
            quotaProgress.className = 'progress-fill';
            if (stats.quota.percentage > 90) quotaProgress.classList.add('critical');
            else if (stats.quota.percentage > 75) quotaProgress.classList.add('warning');
        }
        
        // Success rate
        document.getElementById('success-rate').textContent = \`\${stats.successRate}%\`;
        document.getElementById('total-requests').textContent = \`\${stats.requests} requests\`;
        
        const successProgress = document.getElementById('success-progress');
        if (successProgress) {
            successProgress.style.width = \`\${stats.successRate}%\`;
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
                    \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
                    
                document.getElementById('reset-time').textContent = 
                    \`Next reset: \${new Date(resetTime).toLocaleString()}\`;
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
        document.getElementById('monthly-cost').textContent = \`$\${costs.monthly}\`;
        
        // Cost comparison
        if (costs.comparison) {
            document.getElementById('oauth-cost').textContent = \`$\${costs.comparison.oauth}\`;
            document.getElementById('api-cost').textContent = \`$\${costs.comparison.apiKey}\`;
            
            // Savings indicator
            const savingsIndicator = document.getElementById('savings-indicator');
            const savingsIcon = savingsIndicator.querySelector('.savings-icon');
            const savingsText = savingsIndicator.querySelector('.savings-text');
            
            if (costs.comparison.savings > 0) {
                savingsIcon.textContent = '💰';
                savingsText.textContent = \`Saving $\${costs.comparison.savings}/month with OAuth\`;
                savingsIndicator.className = 'savings-indicator positive';
            } else {
                savingsIcon.textContent = '⚠️';
                savingsText.textContent = \`API key could save $\${Math.abs(costs.comparison.savings)}/month\`;
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
            alertsList.innerHTML = \`
                <div class="no-alerts">
                    <span class="check-icon" aria-hidden="true">✅</span>
                    <span>No active alerts</span>
                </div>
            \`;
        } else {
            alertsList.innerHTML = alerts.map(alert => \`
                <div class="alert-item \${alert.severity}">
                    <span class="alert-icon" aria-hidden="true">\${alert.severity === 'critical' ? '🚨' : '⚠️'}</span>
                    <div class="alert-content">
                        <div class="alert-message">\${alert.message}</div>
                        <div class="alert-time">\${new Date(alert.timestamp).toLocaleString()}</div>
                    </div>
                </div>
            \`).join('');
        }
    }

    /**
     * Update recommendations display
     */
    updateRecommendations(recommendations) {
        const recsList = document.getElementById('recommendations-list');
        
        if (recommendations.length === 0) {
            recsList.innerHTML = \`
                <div class="no-recommendations">
                    <span class="check-icon" aria-hidden="true">✅</span>
                    <span>All optimizations applied</span>
                </div>
            \`;
        } else {
            recsList.innerHTML = recommendations.map(rec => \`
                <div class="recommendation-item \${rec.priority}">
                    <span class="rec-icon" aria-hidden="true">\${rec.priority === 'high' ? '🔥' : '💡'}</span>
                    <div class="rec-content">
                        <div class="rec-message">\${rec.message}</div>
                        <div class="rec-impact">Impact: \${rec.impact}</div>
                    </div>
                </div>
            \`).join('');
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
        
        console.log(\`🔄 Auto-refresh started (every \${this.dataRefreshInterval/1000}s)\`);
    }

    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('⏹️ Auto-refresh stopped');
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
                    labels: Array.from({length: 24}, (_, i) => \`\${i}:00\`),
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
        console.log(\`Switched to \${period} view\`);
    }

    /**
     * Switch chart range
     */
    switchChartRange(range) {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });
        
        // Update chart data based on range
        console.log(\`Switched chart to \${range} range\`);
    }

    /**
     * Save configuration
     */
    async saveConfiguration() {
        try {
            const config = this.gatherConfiguration();
            
            // Save configuration (implement actual saving)
            console.log('💾 Saving configuration:', config);
            
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
            
            console.log('🔄 Configuration reset to defaults');
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
        console.log(\`Tier updated to: \${tier}\`);
        
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
        
        console.log('🧹 Dashboard cleaned up');
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
});`;
    }
}

/**
 * Main execution function
 */
async function main() {
    const generator = new UsageMonitorDashboard();
    
    console.log('📊 OAuth Usage Dashboard Generator');
    console.log('===================================');
    
    const success = await generator.generateDashboard();
    
    if (success) {
        console.log('✅ OAuth Usage Dashboard generated successfully');
        console.log('📄 Files created:');
        console.log('   - oauth-usage-dashboard.html');
        console.log('   - assets/oauth-usage-dashboard.css');
        console.log('   - assets/oauth-usage-dashboard.js');
    } else {
        console.log('❌ Failed to generate OAuth Usage Dashboard');
        process.exit(1);
    }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { UsageMonitorDashboard };