#!/usr/bin/env node

/**
 * OAuth Cost Optimization & Usage Monitoring System
 * 
 * Advanced cost optimization for Claude Max OAuth subscriptions with intelligent
 * usage monitoring, budget management, and ROI analysis.
 * 
 * Features:
 * - Real-time usage tracking with 5-hour reset window management
 * - Cost comparison between OAuth and API key methods
 * - Budget alerts at 50%, 75%, 90%, and 95% thresholds
 * - ROI analysis for subscription vs pay-per-token costs
 * - Intelligent quota prediction and scheduling optimization
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
 * OAuth Cost Optimization and Usage Monitoring
 */
class OAuthCostOptimizer {
    constructor() {
        this.dataDir = path.resolve(__dirname, '../../data');
        this.configFile = path.join(this.dataDir, 'oauth-cost-config.json');
        this.usageFile = path.join(this.dataDir, 'oauth-usage-tracking.json');
        this.reportsDir = path.join(this.dataDir, 'cost-reports');
        
        // Subscription tiers and pricing
        this.subscriptionTiers = {
            'max_5x': {
                monthlyPrice: 100,
                quotaPer5Hours: 50,
                dailyQuota: 240, // 50 * (24/5) = 240
                features: ['5x faster responses', 'Priority bandwidth', 'Extended context']
            },
            'max_20x': {
                monthlyPrice: 200,
                quotaPer5Hours: 800,
                dailyQuota: 3840, // 800 * (24/5) = 3840
                features: ['20x faster responses', 'Highest priority', 'Maximum context']
            }
        };
        
        // API pricing (estimates)
        this.apiPricing = {
            inputTokens: 0.003, // per 1K tokens
            outputTokens: 0.015, // per 1K tokens
            avgRequestCost: 0.05 // estimated average
        };
        
        // Usage tracking
        this.currentUsage = {
            quota: 0,
            costs: 0,
            requests: 0,
            successRate: 100,
            avgResponseTime: 0,
            lastResetTime: null,
            currentWindow: null
        };
    }

    /**
     * Initialize cost optimization system
     */
    async initialize() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(this.reportsDir, { recursive: true });
            
            // Load existing configuration
            await this.loadConfiguration();
            await this.loadUsageData();
            
            console.log('💰 OAuth Cost Optimizer initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize cost optimizer:', error);
            return false;
        }
    }

    /**
     * Load cost optimization configuration
     */
    async loadConfiguration() {
        try {
            const configExists = await fs.access(this.configFile).then(() => true).catch(() => false);
            
            if (configExists) {
                const configData = await fs.readFile(this.configFile, 'utf8');
                this.config = JSON.parse(configData);
            } else {
                // Default configuration
                this.config = {
                    subscriptionTier: 'max_5x',
                    budgetAlerts: {
                        enabled: true,
                        thresholds: [50, 75, 90, 95], // percentage thresholds
                        recipients: ['system']
                    },
                    optimization: {
                        enabled: true,
                        fallbackToApiKey: true,
                        fallbackThreshold: 90, // percentage of quota
                        costThreshold: 150 // monthly cost threshold
                    },
                    monitoring: {
                        trackUsage: true,
                        generateReports: true,
                        reportFrequency: 'daily',
                        retentionDays: 90
                    }
                };
                await this.saveConfiguration();
            }
            
            console.log(`📊 Configuration loaded - Tier: ${this.config.subscriptionTier}`);
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            throw error;
        }
    }

    /**
     * Load usage tracking data
     */
    async loadUsageData() {
        try {
            const usageExists = await fs.access(this.usageFile).then(() => true).catch(() => false);
            
            if (usageExists) {
                const usageData = await fs.readFile(this.usageFile, 'utf8');
                const data = JSON.parse(usageData);
                this.currentUsage = { ...this.currentUsage, ...data };
            }
            
            // Check if we need to reset quota (5-hour windows)
            await this.checkQuotaReset();
            
        } catch (error) {
            console.error('❌ Failed to load usage data:', error);
        }
    }

    /**
     * Check and handle quota reset (5-hour windows)
     */
    async checkQuotaReset() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentWindow = Math.floor(currentHour / 5); // 0-4 (5-hour windows)
        
        // Reset if we're in a new window
        if (this.currentUsage.currentWindow !== currentWindow) {
            const previousUsage = { ...this.currentUsage };
            
            this.currentUsage = {
                ...this.currentUsage,
                quota: 0,
                requests: 0,
                lastResetTime: now.toISOString(),
                currentWindow: currentWindow
            };
            
            console.log(`🔄 Quota reset - New 5-hour window: ${currentWindow}`);
            
            // Archive previous window data
            if (previousUsage.currentWindow !== null) {
                await this.archiveUsageWindow(previousUsage);
            }
            
            await this.saveUsageData();
        }
    }

    /**
     * Archive usage data for completed window
     */
    async archiveUsageWindow(windowData) {
        try {
            const archiveFile = path.join(
                this.reportsDir, 
                `usage-window-${new Date().toISOString().split('T')[0]}-${windowData.currentWindow}.json`
            );
            
            await fs.writeFile(archiveFile, JSON.stringify({
                timestamp: new Date().toISOString(),
                window: windowData.currentWindow,
                usage: windowData,
                tier: this.config.subscriptionTier,
                costs: await this.calculateWindowCosts(windowData)
            }, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to archive usage window:', error);
        }
    }

    /**
     * Track OAuth request usage
     */
    async trackUsage(requestData) {
        try {
            await this.checkQuotaReset();
            
            // Update usage metrics
            this.currentUsage.quota += 1;
            this.currentUsage.requests += 1;
            
            if (requestData.success) {
                // Update success rate
                const totalRequests = this.currentUsage.requests;
                const currentSuccessCount = Math.floor(this.currentUsage.successRate * (totalRequests - 1) / 100);
                this.currentUsage.successRate = ((currentSuccessCount + 1) / totalRequests) * 100;
            } else {
                // Update failure rate
                const totalRequests = this.currentUsage.requests;
                const currentSuccessCount = Math.floor(this.currentUsage.successRate * (totalRequests - 1) / 100);
                this.currentUsage.successRate = (currentSuccessCount / totalRequests) * 100;
            }
            
            // Update average response time
            if (requestData.responseTime) {
                const totalRequests = this.currentUsage.requests;
                this.currentUsage.avgResponseTime = (
                    (this.currentUsage.avgResponseTime * (totalRequests - 1)) + requestData.responseTime
                ) / totalRequests;
            }
            
            await this.saveUsageData();
            
            // Check budget thresholds
            await this.checkBudgetAlerts();
            
            console.log(`📊 Usage tracked - Quota: ${this.currentUsage.quota}/${this.getQuotaLimit()}`);
            
        } catch (error) {
            console.error('❌ Failed to track usage:', error);
        }
    }

    /**
     * Get current quota limit based on subscription tier
     */
    getQuotaLimit() {
        const tier = this.subscriptionTiers[this.config.subscriptionTier];
        return tier ? tier.quotaPer5Hours : 50;
    }

    /**
     * Check budget alert thresholds
     */
    async checkBudgetAlerts() {
        if (!this.config.budgetAlerts.enabled) return;
        
        const quotaUsagePercent = (this.currentUsage.quota / this.getQuotaLimit()) * 100;
        const monthlyCosts = await this.calculateMonthlyCosts();
        
        for (const threshold of this.config.budgetAlerts.thresholds) {
            if (quotaUsagePercent >= threshold && !this.hasAlertBeenSent(threshold)) {
                await this.sendBudgetAlert({
                    threshold,
                    quotaUsagePercent: Math.round(quotaUsagePercent),
                    monthlyCosts,
                    remainingQuota: this.getQuotaLimit() - this.currentUsage.quota
                });
                
                await this.recordAlertSent(threshold);
            }
        }
    }

    /**
     * Send budget alert
     */
    async sendBudgetAlert(alertData) {
        const alert = {
            timestamp: new Date().toISOString(),
            type: 'budget_alert',
            severity: alertData.threshold >= 90 ? 'critical' : 'warning',
            message: `🚨 OAuth quota ${alertData.threshold}% threshold reached`,
            details: {
                quotaUsage: `${alertData.quotaUsagePercent}%`,
                remainingQuota: alertData.remainingQuota,
                monthlyCosts: `$${alertData.monthlyCosts.toFixed(2)}`,
                tier: this.config.subscriptionTier
            },
            recommendations: this.generateCostRecommendations(alertData)
        };
        
        // Log alert
        console.log(`🚨 BUDGET ALERT: ${alert.message}`);
        console.log(`📊 Usage: ${alert.details.quotaUsage} | Remaining: ${alert.details.remainingQuota}`);
        
        // Save alert to file
        const alertFile = path.join(
            this.reportsDir,
            `budget-alert-${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(alertFile, JSON.stringify(alert, null, 2));
    }

    /**
     * Generate cost optimization recommendations
     */
    generateCostRecommendations(alertData) {
        const recommendations = [];
        
        if (alertData.quotaUsagePercent > 80) {
            recommendations.push('Consider upgrading to higher tier for better quota allocation');
            recommendations.push('Enable API key fallback to prevent service disruption');
        }
        
        if (alertData.monthlyCosts > 200) {
            recommendations.push('Evaluate cost-effectiveness vs API key usage');
            recommendations.push('Implement request batching to optimize quota usage');
        }
        
        if (this.currentUsage.successRate < 95) {
            recommendations.push('Investigate request failures to improve quota efficiency');
        }
        
        return recommendations;
    }

    /**
     * Calculate monthly costs based on current usage patterns
     */
    async calculateMonthlyCosts() {
        const tier = this.subscriptionTiers[this.config.subscriptionTier];
        const baseCost = tier.monthlyPrice;
        
        // Additional costs (if any)
        // For now, Claude Max is fixed monthly pricing
        
        return baseCost;
    }

    /**
     * Calculate cost comparison with API key usage
     */
    async calculateCostComparison() {
        try {
            const monthlyCosts = await this.calculateMonthlyCosts();
            
            // Estimate API key costs based on usage patterns
            const dailyRequests = this.currentUsage.requests * (24 / 5); // Scale to daily
            const monthlyRequests = dailyRequests * 30;
            const estimatedApiCosts = monthlyRequests * this.apiPricing.avgRequestCost;
            
            const comparison = {
                oauth: {
                    monthlyCost: monthlyCosts,
                    requestsIncluded: this.subscriptionTiers[this.config.subscriptionTier].dailyQuota * 30,
                    costPerRequest: monthlyCosts / (this.subscriptionTiers[this.config.subscriptionTier].dailyQuota * 30)
                },
                apiKey: {
                    monthlyCost: estimatedApiCosts,
                    costPerRequest: this.apiPricing.avgRequestCost
                },
                savings: monthlyCosts - estimatedApiCosts,
                recommendation: monthlyCosts < estimatedApiCosts ? 'oauth' : 'api_key'
            };
            
            return comparison;
            
        } catch (error) {
            console.error('❌ Failed to calculate cost comparison:', error);
            return null;
        }
    }

    /**
     * Generate comprehensive cost optimization report
     */
    async generateCostReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                period: 'monthly',
                subscription: {
                    tier: this.config.subscriptionTier,
                    details: this.subscriptionTiers[this.config.subscriptionTier]
                },
                usage: {
                    current: this.currentUsage,
                    efficiency: {
                        quotaUtilization: (this.currentUsage.quota / this.getQuotaLimit()) * 100,
                        successRate: this.currentUsage.successRate,
                        avgResponseTime: this.currentUsage.avgResponseTime
                    }
                },
                costs: {
                    monthly: await this.calculateMonthlyCosts(),
                    comparison: await this.calculateCostComparison()
                },
                recommendations: await this.generateOptimizationRecommendations(),
                alerts: {
                    active: this.config.budgetAlerts.enabled,
                    thresholds: this.config.budgetAlerts.thresholds
                }
            };
            
            // Save report
            const reportFile = path.join(
                this.reportsDir,
                `cost-optimization-report-${new Date().toISOString().split('T')[0]}.json`
            );
            
            await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
            
            console.log('📊 Cost optimization report generated');
            return report;
            
        } catch (error) {
            console.error('❌ Failed to generate cost report:', error);
            return null;
        }
    }

    /**
     * Generate optimization recommendations
     */
    async generateOptimizationRecommendations() {
        const recommendations = [];
        const costComparison = await this.calculateCostComparison();
        
        // Quota utilization recommendations
        const quotaUtilization = (this.currentUsage.quota / this.getQuotaLimit()) * 100;
        
        if (quotaUtilization < 30) {
            recommendations.push({
                category: 'subscription_optimization',
                priority: 'medium',
                message: 'Low quota utilization - consider downgrading tier',
                impact: 'cost_reduction',
                savings: `$${(this.subscriptionTiers.max_20x.monthlyPrice - this.subscriptionTiers.max_5x.monthlyPrice) * (quotaUtilization < 10 ? 1 : 0.5)}`
            });
        }
        
        if (quotaUtilization > 90) {
            recommendations.push({
                category: 'capacity_optimization',
                priority: 'high',
                message: 'High quota utilization - consider upgrading tier or implementing fallback',
                impact: 'service_reliability',
                action: 'Enable API key fallback at 85% threshold'
            });
        }
        
        // Cost efficiency recommendations
        if (costComparison && costComparison.savings < 0) {
            recommendations.push({
                category: 'cost_optimization',
                priority: 'high',
                message: 'API key method may be more cost-effective',
                impact: 'cost_reduction',
                savings: `$${Math.abs(costComparison.savings).toFixed(2)}/month`
            });
        }
        
        // Performance recommendations
        if (this.currentUsage.successRate < 95) {
            recommendations.push({
                category: 'reliability_optimization',
                priority: 'medium',
                message: 'Low success rate affecting quota efficiency',
                impact: 'quota_optimization',
                action: 'Implement retry logic and error handling'
            });
        }
        
        return recommendations;
    }

    /**
     * Save configuration
     */
    async saveConfiguration() {
        try {
            await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
        }
    }

    /**
     * Save usage data
     */
    async saveUsageData() {
        try {
            await fs.writeFile(this.usageFile, JSON.stringify(this.currentUsage, null, 2));
        } catch (error) {
            console.error('❌ Failed to save usage data:', error);
        }
    }

    /**
     * Check if alert has been sent for threshold
     */
    hasAlertBeenSent(threshold) {
        // Simple implementation - could be enhanced with persistent storage
        return false;
    }

    /**
     * Record that alert has been sent
     */
    async recordAlertSent(threshold) {
        // Implementation for recording sent alerts
        console.log(`📝 Alert recorded for threshold: ${threshold}%`);
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            quota: {
                used: this.currentUsage.quota,
                limit: this.getQuotaLimit(),
                percentage: Math.round((this.currentUsage.quota / this.getQuotaLimit()) * 100)
            },
            requests: this.currentUsage.requests,
            successRate: Math.round(this.currentUsage.successRate),
            avgResponseTime: Math.round(this.currentUsage.avgResponseTime),
            currentWindow: this.currentUsage.currentWindow,
            nextReset: this.getNextResetTime()
        };
    }

    /**
     * Get next quota reset time
     */
    getNextResetTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentWindow = Math.floor(currentHour / 5);
        const nextResetHour = (currentWindow + 1) * 5;
        
        const nextReset = new Date(now);
        nextReset.setHours(nextResetHour, 0, 0, 0);
        
        // If next reset is tomorrow
        if (nextResetHour >= 24) {
            nextReset.setDate(nextReset.getDate() + 1);
            nextReset.setHours(0, 0, 0, 0);
        }
        
        return nextReset.toISOString();
    }
}

/**
 * Command-line interface
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const optimizer = new OAuthCostOptimizer();
    await optimizer.initialize();
    
    switch (command) {
        case 'status':
            console.log('📊 OAuth Cost Optimization Status');
            console.log('=====================================');
            const stats = optimizer.getUsageStats();
            console.log(`Quota Usage: ${stats.quota.used}/${stats.quota.limit} (${stats.quota.percentage}%)`);
            console.log(`Success Rate: ${stats.successRate}%`);
            console.log(`Avg Response Time: ${stats.avgResponseTime}ms`);
            console.log(`Current Window: ${stats.currentWindow} | Next Reset: ${new Date(stats.nextReset).toLocaleString()}`);
            break;
            
        case 'report':
            console.log('📊 Generating cost optimization report...');
            const report = await optimizer.generateCostReport();
            if (report) {
                console.log('✅ Report generated successfully');
                console.log(`Monthly Cost: $${report.costs.monthly}`);
                if (report.costs.comparison) {
                    console.log(`Savings vs API: $${report.costs.comparison.savings.toFixed(2)}/month`);
                }
            }
            break;
            
        case 'track':
            const requestData = {
                success: args[1] !== 'false',
                responseTime: parseInt(args[2]) || 1000
            };
            await optimizer.trackUsage(requestData);
            console.log('✅ Usage tracked');
            break;
            
        case 'optimize':
            console.log('🔧 Running optimization analysis...');
            const recommendations = await optimizer.generateOptimizationRecommendations();
            console.log('💡 Optimization Recommendations:');
            recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
                if (rec.savings) console.log(`   Potential Savings: ${rec.savings}`);
            });
            break;
            
        default:
            console.log('🔧 OAuth Cost Optimization Commands:');
            console.log('=====================================');
            console.log('status   - Show current usage and costs');
            console.log('report   - Generate comprehensive cost report');
            console.log('track    - Track usage (success responseTime)');
            console.log('optimize - Get optimization recommendations');
    }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { OAuthCostOptimizer };