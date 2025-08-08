#!/usr/bin/env node

/**
 * Authentication Health Monitor & Cost Tracker
 * 
 * Monitors authentication method performance, tracks costs, and provides
 * insights for optimizing AI enhancement operations.
 * 
 * Features:
 * - Real-time authentication health monitoring
 * - Cost tracking and savings calculation
 * - Cookie expiration detection and alerts
 * - Performance analytics and recommendations
 * - CI/CD integration with workflow artifacts
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { BrowserFirstClient } = require('./enhancer-modules/browser-first-client');

class AuthHealthMonitor {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.healthFile = path.join(this.dataDir, 'auth-health.json');
        this.costTrackingFile = path.join(this.dataDir, 'cost-tracking.json');
        this.sessionId = crypto.randomUUID();
        this.startTime = Date.now();
        
        // Health thresholds
        this.thresholds = {
            cookieExpirationWarning: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
            cookieExpirationCritical: 24 * 60 * 60 * 1000,     // 1 day in ms
            failureRateWarning: 0.2,  // 20%
            failureRateCritical: 0.5, // 50%
            responseTimeWarning: 30000, // 30 seconds
            responseTimeCritical: 60000 // 60 seconds
        };
    }

    /**
     * Run comprehensive authentication health check
     */
    async runHealthCheck() {
        console.log('🏥 **AUTHENTICATION HEALTH MONITOR**');
        console.log('====================================');
        console.log(`📋 Session ID: ${this.sessionId}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        
        const healthReport = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            environment: process.env.CI ? 'ci' : 'local',
            authMethods: {},
            costAnalysis: {},
            recommendations: [],
            overallHealth: 'unknown',
            alerts: []
        };

        try {
            // Ensure data directory exists
            await this.ensureDataDir();
            
            // Test browser authentication
            console.log('\n1. Testing browser authentication...');
            const browserHealth = await this.testBrowserAuthentication();
            healthReport.authMethods.browser = browserHealth;
            
            // Test API key authentication
            console.log('\n2. Testing API key authentication...');
            const apiKeyHealth = await this.testAPIKeyAuthentication();
            healthReport.authMethods.apiKey = apiKeyHealth;
            
            // Analyze cost implications
            console.log('\n3. Analyzing cost implications...');
            const costAnalysis = await this.analyzeCosts(browserHealth, apiKeyHealth);
            healthReport.costAnalysis = costAnalysis;
            
            // Generate recommendations
            console.log('\n4. Generating recommendations...');
            const recommendations = this.generateRecommendations(browserHealth, apiKeyHealth, costAnalysis);
            healthReport.recommendations = recommendations;
            
            // Determine overall health
            healthReport.overallHealth = this.calculateOverallHealth(browserHealth, apiKeyHealth);
            
            // Generate alerts
            healthReport.alerts = this.generateAlerts(browserHealth, apiKeyHealth, costAnalysis);
            
            // Save health report
            await this.saveHealthReport(healthReport);
            
            // Update cost tracking
            await this.updateCostTracking(costAnalysis);
            
            console.log('\n📊 **HEALTH SUMMARY**');
            console.log('=====================');
            console.log(`Overall Health: ${this.getHealthEmoji(healthReport.overallHealth)} ${healthReport.overallHealth.toUpperCase()}`);
            console.log(`Browser Auth: ${this.getHealthEmoji(browserHealth.status)} ${browserHealth.status}`);
            console.log(`API Key Auth: ${this.getHealthEmoji(apiKeyHealth.status)} ${apiKeyHealth.status}`);
            console.log(`Cost Efficiency: ${costAnalysis.efficiency}%`);
            
            if (healthReport.alerts.length > 0) {
                console.log('\n🚨 **ALERTS**');
                healthReport.alerts.forEach(alert => {
                    console.log(`   ${alert.severity === 'critical' ? '🔴' : '⚠️'} ${alert.message}`);
                });
            }
            
            if (recommendations.length > 0) {
                console.log('\n💡 **RECOMMENDATIONS**');
                recommendations.forEach((rec, index) => {
                    console.log(`   ${index + 1}. ${rec}`);
                });
            }
            
            return healthReport;
            
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            healthReport.error = error.message;
            healthReport.overallHealth = 'critical';
            return healthReport;
        }
    }

    /**
     * Test browser authentication health
     */
    async testBrowserAuthentication() {
        const startTime = Date.now();
        const health = {
            method: 'browser',
            status: 'unknown',
            available: false,
            responseTime: 0,
            credentials: {},
            error: null,
            lastSuccess: null,
            costSavings: 0
        };

        try {
            console.log('   🍪 Testing browser credentials...');
            
            // Check credential availability
            health.credentials = {
                hasSessionKey: !!(process.env.CLAUDE_SESSION_KEY),
                hasOrgId: !!(process.env.CLAUDE_ORG_ID),
                hasUserId: !!(process.env.CLAUDE_USER_ID),
                sessionKeyLength: process.env.CLAUDE_SESSION_KEY ? process.env.CLAUDE_SESSION_KEY.length : 0
            };
            
            if (!health.credentials.hasSessionKey || !health.credentials.hasOrgId) {
                health.status = 'unavailable';
                health.error = 'Missing required browser credentials';
                console.log('   ❌ Browser credentials missing');
                return health;
            }
            
            console.log('   ✅ Browser credentials available');
            
            // Test browser client initialization
            const browserClient = new BrowserFirstClient();
            await browserClient.initialize();
            
            health.responseTime = Date.now() - startTime;
            
            if (browserClient.authMethod === 'browser_authenticated') {
                health.status = 'healthy';
                health.available = true;
                health.lastSuccess = new Date().toISOString();
                
                // Get cost savings information
                const authStatus = browserClient.getAuthStatus();
                health.costSavings = authStatus.estimatedMonthlySavings;
                
                console.log('   ✅ Browser authentication healthy');
            } else {
                health.status = 'degraded';
                health.error = 'Browser authentication failed to initialize';
                console.log('   ⚠️ Browser authentication degraded');
            }
            
            await browserClient.close();
            
        } catch (error) {
            health.status = 'critical';
            health.error = error.message;
            health.responseTime = Date.now() - startTime;
            console.log(`   ❌ Browser authentication critical: ${error.message}`);
        }
        
        return health;
    }

    /**
     * Test API key authentication health
     */
    async testAPIKeyAuthentication() {
        const health = {
            method: 'api_key',
            status: 'unknown',
            available: false,
            credentials: {},
            error: null,
            estimatedCost: 0
        };

        try {
            console.log('   🔑 Testing API key credentials...');
            
            health.credentials = {
                hasAPIKey: !!(process.env.ANTHROPIC_API_KEY),
                keyLength: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0
            };
            
            if (!health.credentials.hasAPIKey) {
                health.status = 'unavailable';
                health.error = 'Missing API key';
                console.log('   ❌ API key missing');
                return health;
            }
            
            health.status = 'healthy';
            health.available = true;
            health.estimatedCost = this.calculateAPIKeyCost();
            
            console.log('   ✅ API key authentication available');
            
        } catch (error) {
            health.status = 'critical';
            health.error = error.message;
            console.log(`   ❌ API key authentication critical: ${error.message}`);
        }
        
        return health;
    }

    /**
     * Analyze cost implications of different authentication methods
     */
    async analyzeCosts(browserHealth, apiKeyHealth) {
        const analysis = {
            currentMethod: 'unknown',
            browserSavings: 0,
            apiKeyCost: 0,
            efficiency: 0,
            monthlyProjection: {},
            recommendations: []
        };

        try {
            // Determine current active method
            if (browserHealth.available) {
                analysis.currentMethod = 'browser';
                analysis.browserSavings = parseFloat(browserHealth.costSavings) || 0;
            } else if (apiKeyHealth.available) {
                analysis.currentMethod = 'api_key';
                analysis.apiKeyCost = apiKeyHealth.estimatedCost || 0;
            }
            
            // Calculate efficiency
            const totalPotentialCost = analysis.browserSavings + analysis.apiKeyCost;
            if (totalPotentialCost > 0) {
                analysis.efficiency = Math.round((analysis.browserSavings / totalPotentialCost) * 100);
            }
            
            // Monthly projection
            analysis.monthlyProjection = {
                browserCost: 0, // Browser is free
                apiKeyCost: analysis.apiKeyCost,
                totalSavings: analysis.browserSavings,
                currency: 'USD'
            };
            
            console.log(`   💰 Current method: ${analysis.currentMethod}`);
            console.log(`   📊 Cost efficiency: ${analysis.efficiency}%`);
            console.log(`   💡 Monthly savings potential: $${analysis.browserSavings}`);
            
        } catch (error) {
            console.warn('   ⚠️ Cost analysis failed:', error.message);
        }
        
        return analysis;
    }

    /**
     * Generate actionable recommendations based on health status
     */
    generateRecommendations(browserHealth, apiKeyHealth, costAnalysis) {
        const recommendations = [];
        
        // Browser authentication recommendations
        if (!browserHealth.available && browserHealth.credentials.hasSessionKey) {
            recommendations.push('Browser credentials detected but authentication failed - refresh Claude session cookies');
        }
        
        if (!browserHealth.credentials.hasSessionKey) {
            recommendations.push('Configure Claude browser authentication for FREE AI enhancement');
        }
        
        if (browserHealth.responseTime > this.thresholds.responseTimeWarning) {
            recommendations.push('Browser authentication response time is slow - check network connectivity');
        }
        
        // API key recommendations
        if (!apiKeyHealth.available && !browserHealth.available) {
            recommendations.push('CRITICAL: No authentication method available - configure either browser auth or API key');
        }
        
        // Cost optimization recommendations
        if (costAnalysis.currentMethod === 'api_key' && costAnalysis.browserSavings > 0) {
            recommendations.push(`Switch to browser authentication to save $${costAnalysis.browserSavings}/month`);
        }
        
        if (costAnalysis.efficiency < 50) {
            recommendations.push('Low cost efficiency - prioritize browser authentication setup');
        }
        
        return recommendations;
    }

    /**
     * Calculate overall health status
     */
    calculateOverallHealth(browserHealth, apiKeyHealth) {
        if (browserHealth.status === 'healthy') return 'healthy';
        if (apiKeyHealth.status === 'healthy') return 'degraded';
        if (browserHealth.status === 'degraded' || apiKeyHealth.status === 'degraded') return 'degraded';
        return 'critical';
    }

    /**
     * Generate alerts based on health thresholds
     */
    generateAlerts(browserHealth, apiKeyHealth, costAnalysis) {
        const alerts = [];
        
        // Critical alerts
        if (!browserHealth.available && !apiKeyHealth.available) {
            alerts.push({
                severity: 'critical',
                message: 'No authentication method available - AI enhancement will fail',
                action: 'Configure browser authentication or API key immediately'
            });
        }
        
        // Warning alerts
        if (browserHealth.responseTime > this.thresholds.responseTimeWarning) {
            alerts.push({
                severity: 'warning',
                message: `Browser authentication slow (${browserHealth.responseTime}ms)`,
                action: 'Check network connectivity and cookie validity'
            });
        }
        
        if (costAnalysis.efficiency < 50 && costAnalysis.browserSavings > 0) {
            alerts.push({
                severity: 'warning',
                message: `Low cost efficiency (${costAnalysis.efficiency}%) - missing $${costAnalysis.browserSavings}/month in savings`,
                action: 'Enable browser authentication for cost optimization'
            });
        }
        
        return alerts;
    }

    /**
     * Calculate estimated API key cost for typical usage
     */
    calculateAPIKeyCost() {
        // Conservative estimate based on typical CV enhancement usage
        const monthlyRequests = 30; // Daily enhancements
        const avgTokensPerRequest = 25000; // Conservative estimate
        const costPerMToken = 3; // Claude 3.5 Sonnet pricing
        
        return ((monthlyRequests * avgTokensPerRequest * costPerMToken) / 1000000);
    }

    /**
     * Get emoji for health status
     */
    getHealthEmoji(status) {
        const emojis = {
            'healthy': '✅',
            'degraded': '⚠️',
            'critical': '🔴',
            'unavailable': '❌',
            'unknown': '❓'
        };
        return emojis[status] || '❓';
    }

    /**
     * Ensure data directory exists
     */
    async ensureDataDir() {
        try {
            await fs.access(this.dataDir);
        } catch {
            await fs.mkdir(this.dataDir, { recursive: true });
        }
    }

    /**
     * Save health report to file
     */
    async saveHealthReport(healthReport) {
        try {
            const reportPath = path.join(this.dataDir, `auth-health-${Date.now()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(healthReport, null, 2));
            
            // Also update the latest health file
            await fs.writeFile(this.healthFile, JSON.stringify(healthReport, null, 2));
            
            console.log(`   📄 Health report saved: ${reportPath}`);
        } catch (error) {
            console.warn('   ⚠️ Failed to save health report:', error.message);
        }
    }

    /**
     * Update cost tracking data
     */
    async updateCostTracking(costAnalysis) {
        try {
            let costData = { history: [] };
            
            // Load existing cost data
            try {
                const existing = await fs.readFile(this.costTrackingFile, 'utf8');
                costData = JSON.parse(existing);
            } catch {
                // File doesn't exist, use default
            }
            
            // Add current analysis
            costData.history.push({
                timestamp: new Date().toISOString(),
                ...costAnalysis
            });
            
            // Keep only last 30 days of data
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            costData.history = costData.history.filter(entry => 
                new Date(entry.timestamp).getTime() > thirtyDaysAgo
            );
            
            await fs.writeFile(this.costTrackingFile, JSON.stringify(costData, null, 2));
            console.log('   💰 Cost tracking updated');
            
        } catch (error) {
            console.warn('   ⚠️ Failed to update cost tracking:', error.message);
        }
    }

    /**
     * Get authentication health summary for CI integration
     */
    async getHealthSummary() {
        try {
            const healthData = await fs.readFile(this.healthFile, 'utf8');
            const report = JSON.parse(healthData);
            
            return {
                overallHealth: report.overallHealth,
                browserAvailable: report.authMethods.browser?.available || false,
                apiKeyAvailable: report.authMethods.apiKey?.available || false,
                costEfficiency: report.costAnalysis?.efficiency || 0,
                monthySavings: report.costAnalysis?.monthlyProjection?.totalSavings || 0,
                alertCount: report.alerts?.length || 0,
                recommendationCount: report.recommendations?.length || 0
            };
        } catch (error) {
            return {
                overallHealth: 'unknown',
                error: error.message
            };
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'health-check';
    
    const monitor = new AuthHealthMonitor();
    
    switch (command) {
        case 'health-check':
            const report = await monitor.runHealthCheck();
            process.exit(report.overallHealth === 'critical' ? 1 : 0);
            break;
            
        case 'summary':
            const summary = await monitor.getHealthSummary();
            console.log(JSON.stringify(summary, null, 2));
            break;
            
        default:
            console.log('Usage: node auth-health-monitor.js [health-check|summary]');
            process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { AuthHealthMonitor };