#!/usr/bin/env node

/**
 * Claude API Usage Monitor & Budget Tracker
 * 
 * Monitors API usage, tracks costs, manages budgets, and provides usage analytics
 * for both API key and Claude Max OAuth authentication methods.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Usage Monitor and Budget Tracker
 */
class UsageMonitor {
    constructor(config = {}) {
        this.config = {
            dataDir: config.dataDir || path.join(process.cwd(), 'data'),
            usageFile: config.usageFile || 'usage-tracking.json',
            budgetFile: config.budgetFile || 'budget-config.json',
            alertThresholds: config.alertThresholds || [50, 75, 90, 95], // percentage thresholds
            ...config
        };
        
        this.usageData = {
            daily: {},
            monthly: {},
            sessions: [],
            totals: {
                requests: 0,
                input_tokens: 0,
                output_tokens: 0,
                cache_tokens: 0,
                estimated_cost: 0
            }
        };
        
        this.budgetConfig = {
            monthly_budget: 100, // USD
            daily_budget: 5, // USD
            token_limits: {
                daily: 50000,
                monthly: 1000000
            },
            auth_method: 'api_key', // 'api_key' or 'oauth_max'
            subscription_tier: null // 'pro', 'max_5x', 'max_20x'
        };
        
        // Claude Max subscription limits (resets every 5 hours)
        this.maxSubscriptionLimits = {
            pro: {
                messages_per_5h: 45,
                code_prompts_per_5h: 10,
                monthly_cost: 20
            },
            max_5x: {
                messages_per_5h: 225,
                code_prompts_per_5h: 50,
                monthly_cost: 100
            },
            max_20x: {
                messages_per_5h: 900,
                code_prompts_per_5h: 200,
                monthly_cost: 200
            }
        };
        
        // API pricing (per 1M tokens)
        this.apiPricing = {
            'claude-3-5-sonnet-20241022': {
                input: 3.00,   // $3 per 1M input tokens
                output: 15.00, // $15 per 1M output tokens
                cache_write: 3.75, // $3.75 per 1M cache write tokens
                cache_read: 0.30   // $0.30 per 1M cache read tokens
            },
            'claude-3-5-haiku-20241022': {
                input: 0.25,   // $0.25 per 1M input tokens
                output: 1.25,  // $1.25 per 1M output tokens
                cache_write: 0.30,
                cache_read: 0.03
            }
        };
    }

    /**
     * Initialize usage monitoring
     */
    async initialize() {
        await this.loadUsageData();
        await this.loadBudgetConfig();
        console.log('📊 Usage monitoring initialized');
    }

    /**
     * Record API usage
     */
    async recordUsage(sessionData) {
        const today = this.getDateKey();
        const month = this.getMonthKey();
        const timestamp = new Date().toISOString();
        
        const usage = {
            timestamp,
            model: sessionData.model || 'claude-3-5-sonnet-20241022',
            requests: sessionData.requests || 1,
            input_tokens: sessionData.input_tokens || 0,
            output_tokens: sessionData.output_tokens || 0,
            cache_creation_tokens: sessionData.cache_creation_tokens || 0,
            cache_read_tokens: sessionData.cache_read_tokens || 0,
            auth_method: sessionData.auth_method || this.budgetConfig.auth_method,
            session_type: sessionData.session_type || 'enhancement',
            enhancement_mode: sessionData.enhancement_mode || 'unknown',
            success: sessionData.success !== false
        };
        
        // Calculate estimated cost
        usage.estimated_cost = this.calculateCost(usage);
        
        // Update daily totals
        if (!this.usageData.daily[today]) {
            this.usageData.daily[today] = this.createEmptyUsageRecord();
        }
        this.updateUsageRecord(this.usageData.daily[today], usage);
        
        // Update monthly totals
        if (!this.usageData.monthly[month]) {
            this.usageData.monthly[month] = this.createEmptyUsageRecord();
        }
        this.updateUsageRecord(this.usageData.monthly[month], usage);
        
        // Update overall totals
        this.updateUsageRecord(this.usageData.totals, usage);
        
        // Store session details
        this.usageData.sessions.push(usage);
        
        // Keep only last 100 sessions to prevent file bloat
        if (this.usageData.sessions.length > 100) {
            this.usageData.sessions = this.usageData.sessions.slice(-100);
        }
        
        // Check budget alerts
        await this.checkBudgetAlerts(today, month);
        
        // Save updated data
        await this.saveUsageData();
        
        return usage;
    }

    /**
     * Calculate estimated cost for API usage
     */
    calculateCost(usage) {
        if (usage.auth_method === 'oauth_max') {
            // Claude Max subscriptions are fixed monthly cost
            return 0; // No per-token cost
        }
        
        const pricing = this.apiPricing[usage.model] || this.apiPricing['claude-3-5-sonnet-20241022'];
        
        const inputCost = (usage.input_tokens / 1000000) * pricing.input;
        const outputCost = (usage.output_tokens / 1000000) * pricing.output;
        const cacheWriteCost = (usage.cache_creation_tokens / 1000000) * pricing.cache_write;
        const cacheReadCost = (usage.cache_read_tokens / 1000000) * pricing.cache_read;
        
        return inputCost + outputCost + cacheWriteCost + cacheReadCost;
    }

    /**
     * Check if usage exceeds budget thresholds
     */
    async checkBudgetAlerts(today, month) {
        const dailyUsage = this.usageData.daily[today];
        const monthlyUsage = this.usageData.monthly[month];
        
        const alerts = [];
        
        // Check daily budget
        if (dailyUsage && this.budgetConfig.daily_budget > 0) {
            const dailyPercent = (dailyUsage.estimated_cost / this.budgetConfig.daily_budget) * 100;
            
            for (const threshold of this.config.alertThresholds) {
                if (dailyPercent >= threshold && !dailyUsage.alerts_sent?.includes(threshold)) {
                    alerts.push({
                        type: 'daily_budget',
                        threshold,
                        percentage: Math.round(dailyPercent),
                        used: dailyUsage.estimated_cost,
                        limit: this.budgetConfig.daily_budget
                    });
                    
                    // Mark alert as sent
                    if (!dailyUsage.alerts_sent) dailyUsage.alerts_sent = [];
                    dailyUsage.alerts_sent.push(threshold);
                }
            }
        }
        
        // Check monthly budget
        if (monthlyUsage && this.budgetConfig.monthly_budget > 0) {
            const monthlyPercent = (monthlyUsage.estimated_cost / this.budgetConfig.monthly_budget) * 100;
            
            for (const threshold of this.config.alertThresholds) {
                if (monthlyPercent >= threshold && !monthlyUsage.alerts_sent?.includes(threshold)) {
                    alerts.push({
                        type: 'monthly_budget',
                        threshold,
                        percentage: Math.round(monthlyPercent),
                        used: monthlyUsage.estimated_cost,
                        limit: this.budgetConfig.monthly_budget
                    });
                    
                    if (!monthlyUsage.alerts_sent) monthlyUsage.alerts_sent = [];
                    monthlyUsage.alerts_sent.push(threshold);
                }
            }
        }
        
        // Check token limits
        if (this.budgetConfig.token_limits.daily > 0) {
            const dailyTokens = dailyUsage ? dailyUsage.input_tokens + dailyUsage.output_tokens : 0;
            const tokenPercent = (dailyTokens / this.budgetConfig.token_limits.daily) * 100;
            
            for (const threshold of this.config.alertThresholds) {
                if (tokenPercent >= threshold && !dailyUsage?.token_alerts_sent?.includes(threshold)) {
                    alerts.push({
                        type: 'daily_tokens',
                        threshold,
                        percentage: Math.round(tokenPercent),
                        used: dailyTokens,
                        limit: this.budgetConfig.token_limits.daily
                    });
                    
                    if (!dailyUsage.token_alerts_sent) dailyUsage.token_alerts_sent = [];
                    dailyUsage.token_alerts_sent.push(threshold);
                }
            }
        }
        
        // Log alerts
        for (const alert of alerts) {
            this.logAlert(alert);
        }
        
        return alerts;
    }

    /**
     * Log budget alert
     */
    logAlert(alert) {
        const emoji = alert.percentage >= 95 ? '🚨' : alert.percentage >= 90 ? '⚠️' : '💡';
        
        switch (alert.type) {
            case 'daily_budget':
                console.log(`${emoji} Daily budget alert: ${alert.percentage}% used ($${alert.used.toFixed(2)}/$${alert.limit})`);
                break;
            case 'monthly_budget':
                console.log(`${emoji} Monthly budget alert: ${alert.percentage}% used ($${alert.used.toFixed(2)}/$${alert.limit})`);
                break;
            case 'daily_tokens':
                console.log(`${emoji} Daily token limit alert: ${alert.percentage}% used (${alert.used.toLocaleString()}/${alert.limit.toLocaleString()} tokens)`);
                break;
        }
        
        if (alert.percentage >= 95) {
            console.log('🛑 Consider switching to activity-only mode to avoid budget overrun');
        }
    }

    /**
     * Get current usage statistics
     */
    getCurrentUsage() {
        const today = this.getDateKey();
        const month = this.getMonthKey();
        
        const dailyUsage = this.usageData.daily[today] || this.createEmptyUsageRecord();
        const monthlyUsage = this.usageData.monthly[month] || this.createEmptyUsageRecord();
        
        return {
            today: {
                ...dailyUsage,
                budget_percentage: this.budgetConfig.daily_budget > 0 ? 
                    Math.round((dailyUsage.estimated_cost / this.budgetConfig.daily_budget) * 100) : null,
                token_percentage: this.budgetConfig.token_limits.daily > 0 ?
                    Math.round(((dailyUsage.input_tokens + dailyUsage.output_tokens) / this.budgetConfig.token_limits.daily) * 100) : null
            },
            month: {
                ...monthlyUsage,
                budget_percentage: this.budgetConfig.monthly_budget > 0 ? 
                    Math.round((monthlyUsage.estimated_cost / this.budgetConfig.monthly_budget) * 100) : null,
                token_percentage: this.budgetConfig.token_limits.monthly > 0 ?
                    Math.round(((monthlyUsage.input_tokens + monthlyUsage.output_tokens) / this.budgetConfig.token_limits.monthly) * 100) : null
            },
            totals: this.usageData.totals,
            budget_config: this.budgetConfig,
            recent_sessions: this.usageData.sessions.slice(-10)
        };
    }

    /**
     * Get usage recommendations based on current patterns
     */
    getUsageRecommendations() {
        const usage = this.getCurrentUsage();
        const recommendations = [];
        
        // Budget recommendations
        if (usage.today.budget_percentage > 80) {
            recommendations.push({
                type: 'budget_warning',
                message: 'Daily budget usage is high. Consider using activity-only mode for remaining enhancements today.',
                priority: 'high'
            });
        }
        
        if (usage.month.budget_percentage > 75) {
            recommendations.push({
                type: 'monthly_budget',
                message: 'Monthly budget usage is high. Consider upgrading to Claude Max for predictable costs.',
                priority: 'medium'
            });
        }
        
        // Authentication method recommendations
        if (this.budgetConfig.auth_method === 'api_key' && usage.month.estimated_cost > 50) {
            recommendations.push({
                type: 'auth_upgrade',
                message: 'Consider Claude Max Pro ($20/month) or Max 5x ($100/month) for better value.',
                priority: 'medium'
            });
        }
        
        // Usage pattern recommendations
        const recentSessions = usage.recent_sessions;
        const failureRate = recentSessions.length > 0 ? 
            recentSessions.filter(s => !s.success).length / recentSessions.length : 0;
        
        if (failureRate > 0.3) {
            recommendations.push({
                type: 'reliability',
                message: 'High failure rate detected. Check error handling and consider fallback modes.',
                priority: 'high'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate usage report
     */
    generateReport() {
        const usage = this.getCurrentUsage();
        const recommendations = this.getUsageRecommendations();
        
        console.log('📊 **CLAUDE API USAGE REPORT**\n');
        
        // Today's usage
        console.log('📅 **TODAY\'S USAGE:**');
        console.log(`   Requests: ${usage.today.requests}`);
        console.log(`   Tokens: ${(usage.today.input_tokens + usage.today.output_tokens).toLocaleString()} (${usage.today.input_tokens.toLocaleString()} in + ${usage.today.output_tokens.toLocaleString()} out)`);
        console.log(`   Cost: $${usage.today.estimated_cost.toFixed(4)}`);
        
        if (usage.today.budget_percentage !== null) {
            console.log(`   Budget: ${usage.today.budget_percentage}% of daily limit ($${this.budgetConfig.daily_budget})`);
        }
        
        // Monthly usage
        console.log('\n📅 **THIS MONTH\'S USAGE:**');
        console.log(`   Requests: ${usage.month.requests}`);
        console.log(`   Tokens: ${(usage.month.input_tokens + usage.month.output_tokens).toLocaleString()}`);
        console.log(`   Cost: $${usage.month.estimated_cost.toFixed(2)}`);
        
        if (usage.month.budget_percentage !== null) {
            console.log(`   Budget: ${usage.month.budget_percentage}% of monthly limit ($${this.budgetConfig.monthly_budget})`);
        }
        
        // Authentication method
        console.log('\n🔐 **AUTHENTICATION:**');
        console.log(`   Method: ${this.budgetConfig.auth_method === 'oauth_max' ? 'Claude Max OAuth' : 'API Key'}`);
        
        if (this.budgetConfig.subscription_tier) {
            const tier = this.maxSubscriptionLimits[this.budgetConfig.subscription_tier];
            console.log(`   Subscription: ${this.budgetConfig.subscription_tier.toUpperCase()} ($${tier.monthly_cost}/month)`);
        }
        
        // Recommendations
        if (recommendations.length > 0) {
            console.log('\n💡 **RECOMMENDATIONS:**');
            recommendations.forEach((rec, i) => {
                const icon = rec.priority === 'high' ? '🚨' : rec.priority === 'medium' ? '⚠️' : '💡';
                console.log(`   ${icon} ${rec.message}`);
            });
        }
        
        // Recent activity
        if (usage.recent_sessions.length > 0) {
            console.log('\n📈 **RECENT ACTIVITY:**');
            usage.recent_sessions.slice(-5).forEach(session => {
                const successIcon = session.success ? '✅' : '❌';
                const timestamp = new Date(session.timestamp).toLocaleTimeString();
                console.log(`   ${successIcon} ${timestamp}: ${session.enhancement_mode} (${session.input_tokens + session.output_tokens} tokens)`);
            });
        }
    }

    /**
     * Utility methods
     */
    createEmptyUsageRecord() {
        return {
            requests: 0,
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_tokens: 0,
            cache_read_tokens: 0,
            estimated_cost: 0,
            sessions: 0
        };
    }

    updateUsageRecord(record, usage) {
        record.requests += usage.requests;
        record.input_tokens += usage.input_tokens;
        record.output_tokens += usage.output_tokens;
        record.cache_creation_tokens += usage.cache_creation_tokens || 0;
        record.cache_read_tokens += usage.cache_read_tokens || 0;
        record.estimated_cost += usage.estimated_cost;
        record.sessions = (record.sessions || 0) + 1;
    }

    getDateKey() {
        return new Date().toISOString().split('T')[0];
    }

    getMonthKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    /**
     * Data persistence
     */
    async loadUsageData() {
        try {
            const usageFile = path.join(this.config.dataDir, this.config.usageFile);
            const data = await fs.readFile(usageFile, 'utf8');
            this.usageData = { ...this.usageData, ...JSON.parse(data) };
        } catch (error) {
            // File doesn't exist yet, use defaults
        }
    }

    async saveUsageData() {
        try {
            const usageFile = path.join(this.config.dataDir, this.config.usageFile);
            await fs.mkdir(this.config.dataDir, { recursive: true });
            await fs.writeFile(usageFile, JSON.stringify(this.usageData, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save usage data:', error.message);
        }
    }

    async loadBudgetConfig() {
        try {
            const budgetFile = path.join(this.config.dataDir, this.config.budgetFile);
            const data = await fs.readFile(budgetFile, 'utf8');
            this.budgetConfig = { ...this.budgetConfig, ...JSON.parse(data) };
        } catch (error) {
            // File doesn't exist yet, use defaults
        }
    }

    async saveBudgetConfig() {
        try {
            const budgetFile = path.join(this.config.dataDir, this.config.budgetFile);
            await fs.mkdir(this.config.dataDir, { recursive: true });
            await fs.writeFile(budgetFile, JSON.stringify(this.budgetConfig, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save budget config:', error.message);
        }
    }
}

/**
 * CLI interface
 */
async function main() {
    const command = process.argv[2];
    const monitor = new UsageMonitor();
    await monitor.initialize();
    
    switch (command) {
        case 'report':
            monitor.generateReport();
            break;
            
        case 'status':
            const usage = monitor.getCurrentUsage();
            console.log('📊 Current Usage Status:');
            console.log(`Today: ${usage.today.requests} requests, $${usage.today.estimated_cost.toFixed(4)}`);
            console.log(`Month: ${usage.month.requests} requests, $${usage.month.estimated_cost.toFixed(2)}`);
            break;
            
        case 'config':
            const setting = process.argv[3];
            const value = process.argv[4];
            
            if (setting && value) {
                if (setting === 'daily_budget') monitor.budgetConfig.daily_budget = parseFloat(value);
                else if (setting === 'monthly_budget') monitor.budgetConfig.monthly_budget = parseFloat(value);
                else if (setting === 'auth_method') monitor.budgetConfig.auth_method = value;
                else if (setting === 'subscription_tier') monitor.budgetConfig.subscription_tier = value;
                
                await monitor.saveBudgetConfig();
                console.log(`✅ Updated ${setting} to ${value}`);
            } else {
                console.log('Current budget configuration:');
                console.log(JSON.stringify(monitor.budgetConfig, null, 2));
            }
            break;
            
        default:
            console.log('📊 **CLAUDE API USAGE MONITOR**\n');
            console.log('Usage:');
            console.log('  node usage-monitor.js report   - Generate usage report');
            console.log('  node usage-monitor.js status   - Show current status');
            console.log('  node usage-monitor.js config [setting] [value] - Configure budgets');
            console.log('');
            console.log('Configuration examples:');
            console.log('  node usage-monitor.js config daily_budget 5.00');
            console.log('  node usage-monitor.js config monthly_budget 100.00');
            console.log('  node usage-monitor.js config auth_method oauth_max');
            console.log('  node usage-monitor.js config subscription_tier max_5x');
            break;
    }
}

module.exports = { UsageMonitor };

if (require.main === module) {
    main().catch(console.error);
}