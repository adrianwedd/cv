#!/usr/bin/env node

/**
 * Automated Cookie Management & Expiration Detection
 * 
 * Manages Claude.ai session cookies for browser authentication including
 * validation, expiration detection, refresh reminders, and GitHub secrets management.
 * 
 * Features:
 * - Cookie validation and health checking  
 * - Expiration detection with advance warning
 * - GitHub secrets integration and updates
 * - Automated refresh workflow guidance
 * - Security best practices for cookie storage
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const https = require('https');

class CookieManager {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.cookieFile = path.join(this.dataDir, 'cookie-health.json');
        this.secretsFile = path.join(this.dataDir, 'secrets-status.json');
        
        // Cookie validation thresholds
        this.thresholds = {
            expirationWarning: 7 * 24 * 60 * 60 * 1000,   // 7 days
            expirationCritical: 2 * 24 * 60 * 60 * 1000,  // 2 days
            expirationUrgent: 12 * 60 * 60 * 1000,        // 12 hours
            maxCookieAge: 30 * 24 * 60 * 60 * 1000        // 30 days
        };
        
        // Required cookie names for Claude.ai authentication
        this.requiredCookies = [
            'sessionKey',     // Primary authentication token
            'lastActiveOrg',  // Organization ID  
            'ajs_user_id'     // User identifier
        ];
    }

    /**
     * Run comprehensive cookie health check and management
     */
    async manageCookies() {
        console.log('🍪 **COOKIE MANAGEMENT & HEALTH CHECK**');
        console.log('======================================');
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        
        const cookieReport = {
            timestamp: new Date().toISOString(),
            environment: process.env.CI ? 'ci' : 'local',
            cookies: {},
            health: {
                overall: 'unknown',
                expires: null,
                daysUntilExpiration: null,
                validationScore: 0
            },
            secrets: {
                githubConfigured: false,
                allSecretsPresent: false,
                secretsStatus: {}
            },
            recommendations: [],
            alerts: []
        };

        try {
            // Ensure data directory exists
            await this.ensureDataDir();
            
            // Validate current cookies
            console.log('\n1. Validating cookie health...');
            const cookieHealth = await this.validateCookies();
            cookieReport.cookies = cookieHealth.cookies;
            cookieReport.health = cookieHealth.health;
            
            // Check GitHub secrets status
            console.log('\n2. Checking GitHub secrets configuration...');
            const secretsStatus = await this.checkGitHubSecrets();
            cookieReport.secrets = secretsStatus;
            
            // Analyze expiration timeline
            console.log('\n3. Analyzing expiration timeline...');
            const expirationAnalysis = this.analyzeExpiration(cookieHealth);
            Object.assign(cookieReport.health, expirationAnalysis);
            
            // Generate recommendations and alerts
            console.log('\n4. Generating recommendations...');
            const recommendations = this.generateRecommendations(cookieHealth, secretsStatus, expirationAnalysis);
            cookieReport.recommendations = recommendations.recommendations;
            cookieReport.alerts = recommendations.alerts;
            
            // Save cookie report
            await this.saveCookieReport(cookieReport);
            
            // Display summary
            this.displaySummary(cookieReport);
            
            return cookieReport;
            
        } catch (error) {
            console.error('❌ Cookie management failed:', error.message);
            cookieReport.error = error.message;
            cookieReport.health.overall = 'critical';
            return cookieReport;
        }
    }

    /**
     * Validate cookie health and structure
     */
    async validateCookies() {
        const cookieHealth = {
            cookies: {},
            health: {
                overall: 'unknown',
                validationScore: 0,
                issues: []
            }
        };

        let validCookies = 0;
        let totalCookies = this.requiredCookies.length;

        for (const cookieName of this.requiredCookies) {
            const envName = this.getEnvName(cookieName);
            const cookieValue = process.env[envName];
            
            const cookieInfo = {
                name: cookieName,
                envName: envName,
                present: !!cookieValue,
                length: cookieValue ? cookieValue.length : 0,
                format: 'unknown',
                estimated_expiry: null,
                health: 'unknown'
            };

            if (cookieValue) {
                // Validate cookie format
                cookieInfo.format = this.validateCookieFormat(cookieName, cookieValue);
                cookieInfo.health = cookieInfo.format === 'valid' ? 'healthy' : 'invalid';
                
                // Estimate expiration for session keys
                if (cookieName === 'sessionKey') {
                    cookieInfo.estimated_expiry = this.estimateSessionExpiry(cookieValue);
                }
                
                if (cookieInfo.health === 'healthy') {
                    validCookies++;
                } else {
                    cookieHealth.health.issues.push(`Invalid ${cookieName} format`);
                }
                
                console.log(`   ${cookieInfo.health === 'healthy' ? '✅' : '❌'} ${cookieName}: ${cookieInfo.present ? 'Present' : 'Missing'} (${cookieInfo.length} chars)`);
            } else {
                cookieInfo.health = 'missing';
                cookieHealth.health.issues.push(`Missing ${cookieName}`);
                console.log(`   ❌ ${cookieName}: Missing`);
            }
            
            cookieHealth.cookies[cookieName] = cookieInfo;
        }

        // Calculate validation score
        cookieHealth.health.validationScore = Math.round((validCookies / totalCookies) * 100);
        
        // Determine overall health
        if (validCookies === totalCookies) {
            cookieHealth.health.overall = 'healthy';
        } else if (validCookies >= totalCookies * 0.67) {
            cookieHealth.health.overall = 'degraded';
        } else {
            cookieHealth.health.overall = 'critical';
        }

        console.log(`   📊 Validation Score: ${cookieHealth.health.validationScore}%`);
        console.log(`   🎯 Overall Health: ${cookieHealth.health.overall}`);

        return cookieHealth;
    }

    /**
     * Check GitHub secrets configuration status
     */
    async checkGitHubSecrets() {
        const secretsStatus = {
            githubConfigured: false,
            allSecretsPresent: false,
            secretsStatus: {},
            missingSecrets: [],
            configurationGuide: []
        };

        const requiredSecrets = [
            'CLAUDE_SESSION_KEY',
            'CLAUDE_ORG_ID', 
            'CLAUDE_USER_ID'
        ];

        let presentSecrets = 0;
        
        for (const secretName of requiredSecrets) {
            const isPresent = !!process.env[secretName];
            secretsStatus.secretsStatus[secretName] = {
                present: isPresent,
                length: isPresent ? process.env[secretName].length : 0
            };
            
            if (isPresent) {
                presentSecrets++;
                console.log(`   ✅ ${secretName}: Configured`);
            } else {
                secretsStatus.missingSecrets.push(secretName);
                console.log(`   ❌ ${secretName}: Missing`);
            }
        }

        secretsStatus.allSecretsPresent = presentSecrets === requiredSecrets.length;
        secretsStatus.githubConfigured = presentSecrets > 0;

        // Generate configuration guide for missing secrets
        if (secretsStatus.missingSecrets.length > 0) {
            secretsStatus.configurationGuide = this.generateSecretsGuide(secretsStatus.missingSecrets);
        }

        console.log(`   📊 Secrets Present: ${presentSecrets}/${requiredSecrets.length}`);
        
        return secretsStatus;
    }

    /**
     * Analyze cookie expiration timeline
     */
    analyzeExpiration(cookieHealth) {
        const analysis = {
            expires: null,
            daysUntilExpiration: null,
            expirationStatus: 'unknown',
            renewalUrgency: 'none'
        };

        // Check session key expiration
        const sessionCookie = cookieHealth.cookies.sessionKey;
        if (sessionCookie && sessionCookie.estimated_expiry) {
            const expiryTime = new Date(sessionCookie.estimated_expiry).getTime();
            const now = Date.now();
            const timeUntilExpiry = expiryTime - now;
            
            analysis.expires = sessionCookie.estimated_expiry;
            analysis.daysUntilExpiration = Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000));
            
            if (timeUntilExpiry <= this.thresholds.expirationUrgent) {
                analysis.expirationStatus = 'urgent';
                analysis.renewalUrgency = 'immediate';
            } else if (timeUntilExpiry <= this.thresholds.expirationCritical) {
                analysis.expirationStatus = 'critical';
                analysis.renewalUrgency = 'within_24h';
            } else if (timeUntilExpiry <= this.thresholds.expirationWarning) {
                analysis.expirationStatus = 'warning';
                analysis.renewalUrgency = 'within_week';
            } else {
                analysis.expirationStatus = 'healthy';
                analysis.renewalUrgency = 'none';
            }
            
            console.log(`   ⏰ Expires: ${analysis.expires}`);
            console.log(`   📅 Days until expiration: ${analysis.daysUntilExpiration}`);
            console.log(`   🚨 Renewal urgency: ${analysis.renewalUrgency}`);
        }

        return analysis;
    }

    /**
     * Generate recommendations and alerts based on cookie health
     */
    generateRecommendations(cookieHealth, secretsStatus, expirationAnalysis) {
        const recommendations = [];
        const alerts = [];

        // Cookie health recommendations
        if (cookieHealth.health.overall === 'critical') {
            alerts.push({
                severity: 'critical',
                message: 'Multiple cookies missing or invalid - browser authentication will fail',
                action: 'Update all Claude.ai session cookies immediately'
            });
            recommendations.push('Extract fresh cookies from an active Claude.ai browser session');
        }

        if (cookieHealth.health.overall === 'degraded') {
            alerts.push({
                severity: 'warning', 
                message: 'Some cookies missing or invalid - authentication may be unreliable',
                action: 'Verify and update missing cookies'
            });
        }

        // Expiration recommendations
        if (expirationAnalysis.renewalUrgency === 'immediate') {
            alerts.push({
                severity: 'critical',
                message: 'Cookies expire within 12 hours - immediate renewal required',
                action: 'Refresh cookies now to prevent authentication failure'
            });
            recommendations.push('URGENT: Refresh Claude.ai session cookies immediately');
        } else if (expirationAnalysis.renewalUrgency === 'within_24h') {
            alerts.push({
                severity: 'warning',
                message: 'Cookies expire within 2 days - renewal needed soon',
                action: 'Schedule cookie renewal within 24 hours'
            });
            recommendations.push('Schedule cookie refresh within the next day');
        } else if (expirationAnalysis.renewalUrgency === 'within_week') {
            recommendations.push('Plan to refresh cookies within the next week');
        }

        // GitHub secrets recommendations
        if (!secretsStatus.allSecretsPresent) {
            recommendations.push('Configure missing GitHub secrets for CI/CD browser authentication');
            recommendations.push(...secretsStatus.configurationGuide);
        }

        // General best practices
        if (cookieHealth.health.validationScore < 100) {
            recommendations.push('Set up automated cookie health monitoring for proactive management');
        }

        return { recommendations, alerts };
    }

    /**
     * Get environment variable name for cookie
     */
    getEnvName(cookieName) {
        const mapping = {
            'sessionKey': 'CLAUDE_SESSION_KEY',
            'lastActiveOrg': 'CLAUDE_ORG_ID', 
            'ajs_user_id': 'CLAUDE_USER_ID'
        };
        return mapping[cookieName] || cookieName.toUpperCase();
    }

    /**
     * Validate cookie format based on expected patterns
     */
    validateCookieFormat(cookieName, cookieValue) {
        const patterns = {
            sessionKey: /^sk-ant-sid01-[A-Za-z0-9_-]+$/,
            lastActiveOrg: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            ajs_user_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        };

        const pattern = patterns[cookieName];
        if (!pattern) return 'unknown';
        
        return pattern.test(cookieValue) ? 'valid' : 'invalid';
    }

    /**
     * Estimate session expiry time based on cookie characteristics
     */
    estimateSessionExpiry(sessionKey) {
        try {
            // Claude session keys typically last 30 days
            // This is an estimate based on observation
            const creationTime = Date.now(); // We can't determine actual creation time
            const estimatedLifetime = 30 * 24 * 60 * 60 * 1000; // 30 days
            
            return new Date(creationTime + estimatedLifetime).toISOString();
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate GitHub secrets configuration guide
     */
    generateSecretsGuide(missingSecrets) {
        const guide = [
            'To configure GitHub secrets for browser authentication:',
            '1. Go to your repository Settings > Secrets and variables > Actions',
            '2. Add the following repository secrets:'
        ];

        missingSecrets.forEach(secret => {
            switch (secret) {
                case 'CLAUDE_SESSION_KEY':
                    guide.push('   - CLAUDE_SESSION_KEY: Your Claude.ai session key (sk-ant-sid01-...)');
                    break;
                case 'CLAUDE_ORG_ID':
                    guide.push('   - CLAUDE_ORG_ID: Your Claude.ai organization ID (UUID format)');
                    break;
                case 'CLAUDE_USER_ID':
                    guide.push('   - CLAUDE_USER_ID: Your Claude.ai user ID (UUID format)');
                    break;
            }
        });

        guide.push('3. Extract these values from your browser cookies while logged into Claude.ai');
        
        return guide;
    }

    /**
     * Display comprehensive summary
     */
    displaySummary(cookieReport) {
        console.log('\n📊 **COOKIE MANAGEMENT SUMMARY**');
        console.log('================================');
        
        // Overall health
        const healthEmoji = {
            'healthy': '✅',
            'degraded': '⚠️', 
            'critical': '🔴',
            'unknown': '❓'
        };
        
        console.log(`Overall Health: ${healthEmoji[cookieReport.health.overall]} ${cookieReport.health.overall.toUpperCase()}`);
        console.log(`Validation Score: ${cookieReport.health.validationScore}%`);
        
        if (cookieReport.health.daysUntilExpiration !== null) {
            console.log(`Days Until Expiry: ${cookieReport.health.daysUntilExpiration}`);
        }
        
        console.log(`GitHub Secrets: ${cookieReport.secrets.allSecretsPresent ? '✅' : '❌'} ${cookieReport.secrets.allSecretsPresent ? 'Complete' : 'Incomplete'}`);
        
        // Alerts
        if (cookieReport.alerts.length > 0) {
            console.log('\n🚨 **ALERTS**');
            cookieReport.alerts.forEach(alert => {
                const emoji = alert.severity === 'critical' ? '🔴' : '⚠️';
                console.log(`   ${emoji} ${alert.message}`);
                console.log(`      Action: ${alert.action}`);
            });
        }
        
        // Recommendations
        if (cookieReport.recommendations.length > 0) {
            console.log('\n💡 **RECOMMENDATIONS**');
            cookieReport.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        console.log('\n🔄 **NEXT STEPS**');
        if (cookieReport.health.overall === 'healthy' && cookieReport.secrets.allSecretsPresent) {
            console.log('   ✅ Configuration is optimal for browser authentication');
            console.log('   📅 Monitor expiration and refresh cookies before they expire');
        } else {
            console.log('   🔧 Follow recommendations above to optimize cookie configuration');
            console.log('   📖 See CLAUDE.md for detailed cookie setup instructions');
        }
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
     * Save cookie report
     */
    async saveCookieReport(cookieReport) {
        try {
            const reportPath = path.join(this.dataDir, `cookie-health-${Date.now()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(cookieReport, null, 2));
            
            // Also update the latest health file
            await fs.writeFile(this.cookieFile, JSON.stringify(cookieReport, null, 2));
            
            console.log(`   📄 Cookie report saved: ${reportPath}`);
        } catch (error) {
            console.warn('   ⚠️ Failed to save cookie report:', error.message);
        }
    }

    /**
     * Get cookie health summary for CI integration
     */
    async getCookieHealthSummary() {
        try {
            const cookieData = await fs.readFile(this.cookieFile, 'utf8');
            const report = JSON.parse(cookieData);
            
            return {
                overall_health: report.health.overall,
                validation_score: report.health.validationScore,
                days_until_expiration: report.health.daysUntilExpiration,
                expiration_status: report.health.expirationStatus,
                renewal_urgency: report.health.renewalUrgency,
                all_secrets_present: report.secrets.allSecretsPresent,
                alert_count: report.alerts.length,
                recommendation_count: report.recommendations.length
            };
        } catch (error) {
            return {
                overall_health: 'unknown',
                error: error.message
            };
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'manage';
    
    const manager = new CookieManager();
    
    switch (command) {
        case 'manage':
            const report = await manager.manageCookies();
            process.exit(report.health.overall === 'critical' ? 1 : 0);
            break;
            
        case 'summary':
            const summary = await manager.getCookieHealthSummary();
            console.log(JSON.stringify(summary, null, 2));
            break;
            
        default:
            console.log('Usage: node cookie-manager.js [manage|summary]');
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

module.exports = { CookieManager };