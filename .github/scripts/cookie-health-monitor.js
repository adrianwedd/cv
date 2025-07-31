#!/usr/bin/env node

/**
 * Claude Cookie Health Monitor
 * 
 * Monitors session cookie health, detects expiration, and provides
 * automated refresh alerts and graceful degradation.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { ClaudeBrowserClient } = require('./claude-browser-client');

class CookieHealthMonitor {
    constructor() {
        this.healthPath = path.join(__dirname, 'data', 'cookie-health.json');
        this.alertThresholds = {
            warning: 24 * 60 * 60 * 1000,    // 24 hours before expiry
            critical: 6 * 60 * 60 * 1000,    // 6 hours before expiry  
            expired: 0                        // Already expired
        };
        this.maxFailures = 3; // Max consecutive failures before marking expired
    }

    /**
     * Load existing health data
     */
    async loadHealthData() {
        try {
            const data = await fs.readFile(this.healthPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Return default structure if file doesn't exist
            return {
                last_validated: null,
                consecutive_failures: 0,
                estimated_expiry: null,
                status: 'unknown',
                validation_history: []
            };
        }
    }

    /**
     * Save health data
     */
    async saveHealthData(data) {
        try {
            await fs.mkdir(path.dirname(this.healthPath), { recursive: true });
            await fs.writeFile(this.healthPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Error saving health data:', error.message);
        }
    }

    /**
     * Test cookie validity by making a simple request
     */
    async testCookieValidity() {
        console.log('🧪 Testing cookie validity...');
        
        try {
            const client = new ClaudeBrowserClient({ headless: true, timeout: 15000 });
            await client.initialize();
            
            const response = await client.sendMessage('Hello! Please respond with just "OK" to test authentication.');
            await client.close();
            
            if (response && response.length > 0) {
                console.log('✅ Cookie validation successful');
                return {
                    valid: true,
                    response_time: Date.now(),
                    error: null
                };
            } else {
                console.log('⚠️ Empty response - possible cookie issue');
                return {
                    valid: false,
                    response_time: Date.now(),
                    error: 'Empty response received'
                };
            }
        } catch (error) {
            console.log('❌ Cookie validation failed:', error.message);
            return {
                valid: false,
                response_time: Date.now(),
                error: error.message
            };
        }
    }

    /**
     * Estimate cookie expiration based on failure patterns
     */
    estimateExpiration(healthData) {
        const now = Date.now();
        
        // If we have recent failures, estimate expiration soon
        if (healthData.consecutive_failures >= 2) {
            return now + (6 * 60 * 60 * 1000); // 6 hours from now
        }
        
        // If last validation was successful, estimate 2 weeks from last success
        if (healthData.last_validated && healthData.status === 'healthy') {
            return healthData.last_validated + (14 * 24 * 60 * 60 * 1000); // 2 weeks
        }
        
        // Default: 1 week from now
        return now + (7 * 24 * 60 * 60 * 1000);
    }

    /**
     * Determine health status based on validation results
     */
    determineHealthStatus(validation, healthData) {
        const now = Date.now();
        
        if (!validation.valid) {
            // Failed validation
            if (healthData.consecutive_failures >= this.maxFailures) {
                return 'expired';
            } else {
                return 'failing';
            }
        }
        
        // Successful validation - check time until estimated expiry
        const estimatedExpiry = this.estimateExpiration(healthData);
        const timeUntilExpiry = estimatedExpiry - now;
        
        if (timeUntilExpiry <= this.alertThresholds.expired) {
            return 'expired';
        } else if (timeUntilExpiry <= this.alertThresholds.critical) {
            return 'critical';
        } else if (timeUntilExpiry <= this.alertThresholds.warning) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }

    /**
     * Generate cookie refresh instructions
     */
    generateRefreshInstructions() {
        return `
🍪 **COOKIE REFRESH REQUIRED**

Your Claude.ai session cookies need to be refreshed. Follow these steps:

**Method 1: Quick Console Refresh**
1. Go to https://claude.ai (make sure you're logged in)
2. Open browser console (F12 → Console)
3. Run this code:
   \`\`\`javascript
   const cookies = document.cookie.split(';').reduce((acc, cookie) => {
     const [name, value] = cookie.trim().split('=');
     if (['sessionKey', 'lastActiveOrg', 'ajs_user_id'].includes(name)) {
       acc[name] = value;
     }
     return acc;
   }, {});
   
   console.log('CLAUDE_SESSION_KEY=' + (cookies.sessionKey || 'NOT_FOUND'));
   console.log('CLAUDE_ORG_ID=' + (cookies.lastActiveOrg || 'NOT_FOUND'));  
   console.log('CLAUDE_USER_ID=' + (cookies.ajs_user_id || 'NOT_FOUND'));
   \`\`\`

**Method 2: Developer Tools**
1. Go to https://claude.ai
2. Open DevTools (F12) → Application → Cookies → https://claude.ai
3. Copy values for: sessionKey, lastActiveOrg, ajs_user_id

**Update GitHub Secrets:**
\`\`\`bash
echo "new-session-key-here" | gh secret set CLAUDE_SESSION_KEY
echo "new-org-id-here" | gh secret set CLAUDE_ORG_ID  
echo "new-user-id-here" | gh secret set CLAUDE_USER_ID
\`\`\`

**Or use the helper script:**
\`\`\`bash
node setup-claude-cookies.js
\`\`\`
        `;
    }

    /**
     * Generate status report with recommendations
     */
    generateStatusReport(healthData, validation) {
        const now = Date.now();
        const status = healthData.status;
        const timeUntilExpiry = healthData.estimated_expiry ? 
            Math.max(0, healthData.estimated_expiry - now) : 0;
        
        const hoursUntilExpiry = Math.floor(timeUntilExpiry / (60 * 60 * 1000));
        const daysUntilExpiry = Math.floor(hoursUntilExpiry / 24);

        let statusEmoji = '✅';
        let statusMessage = 'Cookies are healthy';
        let urgency = 'none';

        switch (status) {
            case 'expired':
                statusEmoji = '💀';
                statusMessage = 'Cookies are EXPIRED - refresh immediately';
                urgency = 'critical';
                break;
            case 'critical':
                statusEmoji = '🚨';
                statusMessage = `Cookies expire in ${hoursUntilExpiry} hours - refresh urgently`;
                urgency = 'critical';
                break;
            case 'warning':
                statusEmoji = '⚠️ ';
                statusMessage = `Cookies expire in ${daysUntilExpiry} days - plan refresh`;
                urgency = 'warning';
                break;
            case 'failing':
                statusEmoji = '❌';
                statusMessage = `${healthData.consecutive_failures} consecutive failures - likely expired`;
                urgency = 'critical';
                break;
        }

        return {
            emoji: statusEmoji,
            message: statusMessage,
            urgency,
            time_until_expiry: timeUntilExpiry,
            days_until_expiry: daysUntilExpiry,
            hours_until_expiry: hoursUntilExpiry,
            consecutive_failures: healthData.consecutive_failures,
            last_validated: healthData.last_validated,
            needs_refresh: urgency === 'critical' || status === 'expired'
        };
    }

    /**
     * Main monitoring function
     */
    async monitor() {
        console.log('🍪 **CLAUDE COOKIE HEALTH MONITOR**\n');
        
        try {
            // Load existing health data
            const healthData = await this.loadHealthData();
            
            // Test cookie validity
            const validation = await this.testCookieValidity();
            
            // Update health data
            const now = Date.now();
            
            if (validation.valid) {
                healthData.last_validated = now;
                healthData.consecutive_failures = 0;
            } else {
                healthData.consecutive_failures = (healthData.consecutive_failures || 0) + 1;
            }
            
            // Estimate expiration and determine status
            healthData.estimated_expiry = this.estimateExpiration(healthData);
            healthData.status = this.determineHealthStatus(validation, healthData);
            
            // Add to validation history (keep last 10)
            if (!healthData.validation_history) {
                healthData.validation_history = [];
            }
            healthData.validation_history.push({
                timestamp: now,
                valid: validation.valid,
                error: validation.error,
                status: healthData.status
            });
            healthData.validation_history = healthData.validation_history.slice(-10);
            
            // Save updated health data
            await this.saveHealthData(healthData);
            
            // Generate and display report
            const report = this.generateStatusReport(healthData, validation);
            
            console.log(`${report.emoji} **STATUS**: ${report.message}`);
            console.log(`📊 **DETAILS**:`);
            console.log(`   Consecutive Failures: ${report.consecutive_failures}`);
            console.log(`   Last Validated: ${report.last_validated ? new Date(report.last_validated).toISOString() : 'Never'}`);
            
            if (report.time_until_expiry > 0) {
                console.log(`   Estimated Expiry: ${report.days_until_expiry}d ${report.hours_until_expiry % 24}h`);
            }
            
            // Show refresh instructions if needed
            if (report.needs_refresh) {
                console.log(this.generateRefreshInstructions());
            }
            
            // Exit with appropriate code for CI/CD
            if (report.urgency === 'critical') {
                console.log('🚨 **CRITICAL**: Immediate action required!');
                process.exit(1);
            } else if (report.urgency === 'warning') {
                console.log('⚠️  **WARNING**: Plan cookie refresh soon');
                process.exit(0);
            } else {
                console.log('✅ **HEALTHY**: No action required');
                process.exit(0);
            }
            
        } catch (error) {
            console.error('❌ Monitoring failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Quick status check (for CI/CD)
     */
    async quickStatus() {
        try {
            const healthData = await this.loadHealthData();
            const now = Date.now();
            
            // Simple status based on last validation and failures
            if (!healthData.last_validated) {
                console.log('unknown');
                return;
            }
            
            const daysSinceValidation = (now - healthData.last_validated) / (24 * 60 * 60 * 1000);
            
            if (healthData.consecutive_failures >= this.maxFailures) {
                console.log('expired');
            } else if (daysSinceValidation > 14) {
                console.log('warning');
            } else if (daysSinceValidation > 10) {
                console.log('caution');
            } else {
                console.log('healthy');
            }
        } catch (error) {
            console.log('error');
        }
    }
}

// CLI Interface
async function main() {
    const monitor = new CookieHealthMonitor();
    const command = process.argv[2];
    
    switch (command) {
        case 'status':
            await monitor.quickStatus();
            break;
        case 'monitor':
        default:
            await monitor.monitor();
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CookieHealthMonitor };