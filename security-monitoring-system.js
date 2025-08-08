#!/usr/bin/env node

/**
 * CV System Security Monitoring & Alert System
 * 
 * Comprehensive security monitoring for the CV enhancement system
 * including authentication health, vulnerability scanning, and automated alerts
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

class SecurityMonitoringSystem {
    constructor() {
        this.timestamp = new Date().toISOString();
        this.alerts = [];
        this.findings = {
            critical: [],
            high: [],
            medium: [],
            low: [],
            info: []
        };
    }

    async runSecurityScan() {
        
        
        
        

        try {
            // Core security checks
            await this.checkAuthenticationSecurity();
            await this.checkDependencyVulnerabilities();
            await this.checkSecretsExposure();
            await this.checkFilePermissions();
            await this.checkWebsiteSecurityHeaders();
            await this.checkGitSecurityHygiene();
            
            // Generate comprehensive report
            await this.generateSecurityReport();
            await this.createSecurityMetrics();
            
            return this.getSecurityScore();
            
        } catch (error) {
            this.addAlert('critical', 'Security scan failed', error.message);
            console.error('❌ Security scan failed:', error.message);
            return { score: 0, status: 'failed' };
        }
    }

    async checkAuthenticationSecurity() {
        
        
        const authMethods = {
            browser: { configured: false, secure: false },
            oauth: { configured: false, secure: false },
            api: { configured: false, secure: false }
        };

        // Check for environment variable configuration
        const envVars = [
            'CLAUDE_SESSION_KEY', 'CLAUDE_ORG_ID', 'CLAUDE_USER_ID',
            'CLAUDE_OAUTH_TOKEN', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN'
        ];

        let configuredSecrets = 0;
        for (const envVar of envVars) {
            if (process.env[envVar]) {
                configuredSecrets++;
                
            } else {
                
            }
        }

        if (configuredSecrets === 0) {
            this.addFinding('critical', 'No authentication methods configured', 
                'System has no valid authentication configured. All AI enhancement features will fail.');
        } else if (configuredSecrets < 3) {
            this.addFinding('high', 'Limited authentication redundancy', 
                `Only ${configuredSecrets}/6 authentication secrets configured. Consider adding fallback methods.`);
        } else {
            this.addFinding('info', 'Authentication properly configured', 
                `${configuredSecrets}/6 authentication secrets available with redundancy.`);
        }

        // Check for hardcoded credentials in source code
        await this.scanForHardcodedCredentials();
        
        }/100`);
        
    }

    async scanForHardcodedCredentials() {
        
        
        const dangerousPatterns = [
            /api_key\s*=\s*["'][^"']{10,}["']/gi,
            /password\s*=\s*["'][^"']{5,}["']/gi,
            /secret\s*=\s*["'][^"']{10,}["']/gi,
            /token\s*[:=]\s*["'][^"']{10,}["']/gi,
            /(sk-[a-zA-Z0-9-]{20,})/g,
            /(ghp_[a-zA-Z0-9]{36})/g
        ];

        try {
            const files = await this.getJavaScriptFiles();
            let credentialIssues = 0;

            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    
                    // Skip test files with mock credentials
                    if (file.includes('.test.') || file.includes('test-')) {
                        continue;
                    }

                    for (const pattern of dangerousPatterns) {
                        const matches = content.match(pattern);
                        if (matches) {
                            // Filter out obvious test/mock values
                            const realMatches = matches.filter(match => 
                                !match.includes('mock') && 
                                !match.includes('test') && 
                                !match.includes('dummy') &&
                                !match.includes('example')
                            );
                            
                            if (realMatches.length > 0) {
                                credentialIssues++;
                                this.addFinding('high', `Potential hardcoded credential in ${path.basename(file)}`, 
                                    `Found ${realMatches.length} potential credential(s). Review manually.`);
                            }
                        }
                    }
                } catch (error) {
                    
                }
            }

            if (credentialIssues === 0) {
                
                this.addFinding('info', 'Clean credential scanning', 'No hardcoded credentials found in source code.');
            } else {
                
            }

        } catch (error) {
            this.addFinding('medium', 'Credential scanning failed', `Could not complete credential scan: ${error.message}`);
        }
    }

    async checkDependencyVulnerabilities() {
        
        
        try {
            // Run npm audit
            const auditResult = execSync('cd .github/scripts && npm audit --json', { encoding: 'utf-8' });
            const auditData = JSON.parse(auditResult);
            
            const vulnCounts = {
                critical: auditData.metadata?.vulnerabilities?.critical || 0,
                high: auditData.metadata?.vulnerabilities?.high || 0,
                moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
                low: auditData.metadata?.vulnerabilities?.low || 0
            };

            
            
            
            
            

            if (vulnCounts.critical > 0) {
                this.addFinding('critical', 'Critical dependency vulnerabilities', 
                    `${vulnCounts.critical} critical vulnerabilities require immediate attention.`);
            }
            if (vulnCounts.high > 0) {
                this.addFinding('high', 'High severity dependency vulnerabilities', 
                    `${vulnCounts.high} high severity vulnerabilities should be fixed soon.`);
            }
            if (vulnCounts.moderate > 0) {
                this.addFinding('medium', 'Moderate dependency vulnerabilities', 
                    `${vulnCounts.moderate} moderate vulnerabilities detected.`);
            }

            if (vulnCounts.critical === 0 && vulnCounts.high === 0) {
                this.addFinding('info', 'Clean dependency scan', 'No critical or high severity vulnerabilities detected.');
            }

        } catch (error) {
            if (error.status === 1) {
                // npm audit returns exit code 1 when vulnerabilities are found
                ');
                this.addFinding('medium', 'Dependency vulnerabilities present', 'Run npm audit for details.');
            } else {
                
                this.addFinding('medium', 'Dependency scan failed', `Could not complete npm audit: ${error.message}`);
            }
        }

        
    }

    async checkSecretsExposure() {
        
        
        // Check git history for accidentally committed secrets
        try {
            const gitLog = execSync('git log --oneline -n 50', { encoding: 'utf-8' });
            const suspiciousCommits = gitLog.split('\n').filter(line => 
                line.toLowerCase().includes('secret') ||
                line.toLowerCase().includes('token') ||
                line.toLowerCase().includes('key') ||
                line.toLowerCase().includes('password')
            );

            if (suspiciousCommits.length > 0) {
                
                this.addFinding('medium', 'Suspicious commit messages', 
                    `${suspiciousCommits.length} commits contain credential-related keywords. Manual review recommended.`);
            } else {
                
            }

            // Check for .env files that might be tracked
            const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' });
            const envFiles = trackedFiles.split('\n').filter(file => 
                file.includes('.env') && !file.includes('.env.example')
            );

            if (envFiles.length > 0) {
                
                this.addFinding('high', 'Environment files tracked', 
                    'Environment files should not be committed to version control.');
            } else {
                
            }

        } catch (error) {
            this.addFinding('low', 'Git history scan failed', `Could not scan git history: ${error.message}`);
        }

        
    }

    async checkFilePermissions() {
        
        
        try {
            const sensitiveFiles = [
                '.github/scripts/package.json',
                '.github/workflows/cv-enhancement.yml'
            ];

            for (const file of sensitiveFiles) {
                try {
                    const stats = await fs.stat(file);
                    const mode = (stats.mode & parseInt('777', 8)).toString(8);
                    
                    if (mode !== '644') {
                        this.addFinding('medium', `Unusual permissions on ${file}`, 
                            `File permissions: ${mode}. Consider setting to 644.`);
                    }
                } catch (error) {
                    // File might not exist, which is fine
                }
            }

            

        } catch (error) {
            this.addFinding('low', 'File permissions audit failed', error.message);
        }

        
    }

    async checkWebsiteSecurityHeaders() {
        
        
        // Check if security headers are implemented in HTML
        try {
            const indexHtml = await fs.readFile('index.html', 'utf-8');
            
            const securityHeaders = [
                'X-Content-Type-Options',
                'X-Frame-Options', 
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Content-Security-Policy'
            ];

            let implementedHeaders = 0;
            for (const header of securityHeaders) {
                if (indexHtml.includes(header)) {
                    implementedHeaders++;
                    
                } else {
                    
                }
            }

            if (implementedHeaders === securityHeaders.length) {
                this.addFinding('info', 'All security headers implemented', 
                    'Website includes all essential security headers.');
            } else {
                this.addFinding('medium', 'Missing security headers', 
                    `${securityHeaders.length - implementedHeaders} security headers missing from website.`);
            }

             * 100)}/100`);

        } catch (error) {
            this.addFinding('medium', 'Security headers check failed', `Could not analyze HTML: ${error.message}`);
        }

        
    }

    async checkGitSecurityHygiene() {
        
        
        try {
            // Check for .gitignore completeness
            const gitignoreContent = await fs.readFile('.gitignore', 'utf-8');
            
            const essentialIgnores = ['.env', 'node_modules', '.DS_Store', '*.log'];
            let missingIgnores = [];
            
            for (const ignore of essentialIgnores) {
                if (!gitignoreContent.includes(ignore)) {
                    missingIgnores.push(ignore);
                }
            }

            if (missingIgnores.length > 0) {
                this.addFinding('medium', 'Incomplete .gitignore', 
                    `Missing important ignores: ${missingIgnores.join(', ')}`);
            } else {
                this.addFinding('info', 'Complete .gitignore', 'All essential patterns are ignored.');
            }

            // Check for commit message security keywords
            const recentCommits = execSync('git log --oneline -n 10', { encoding: 'utf-8' });
            if (recentCommits.toLowerCase().includes('fix security') || 
                recentCommits.toLowerCase().includes('security patch')) {
                this.addFinding('info', 'Recent security commits', 'Security fixes detected in recent commits.');
            }

            

        } catch (error) {
            this.addFinding('low', 'Git hygiene check failed', error.message);
        }

        
    }

    async generateSecurityReport() {
        
        
        const report = {
            timestamp: this.timestamp,
            summary: {
                total_findings: this.getTotalFindings(),
                critical_count: this.findings.critical.length,
                high_count: this.findings.high.length,
                medium_count: this.findings.medium.length,
                low_count: this.findings.low.length,
                info_count: this.findings.info.length
            },
            score: this.getSecurityScore(),
            findings: this.findings,
            alerts: this.alerts,
            recommendations: this.generateRecommendations()
        };

        // Save report to data directory
        await fs.mkdir('data', { recursive: true });
        await fs.writeFile('data/security-report.json', JSON.stringify(report, null, 2));
        
        
        
        

        return report;
    }

    async createSecurityMetrics() {
        const metrics = {
            timestamp: this.timestamp,
            authentication_health: this.calculateAuthScore(),
            dependency_security: this.calculateDependencyScore(),
            secrets_hygiene: this.calculateSecretsScore(),
            website_security: this.calculateWebsiteScore(),
            overall_score: this.getSecurityScore().overall,
            risk_level: this.getRiskLevel()
        };

        await fs.writeFile('data/security-metrics.json', JSON.stringify(metrics, null, 2));
        
    }

    // Helper methods
    async getJavaScriptFiles() {
        const files = [];
        
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        await scanDir(fullPath);
                    } else if (entry.isFile() && entry.name.endsWith('.js')) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Directory might not be accessible
            }
        }
        
        await scanDir('.');
        return files;
    }

    addFinding(severity, title, description) {
        this.findings[severity].push({
            title,
            description,
            timestamp: new Date().toISOString()
        });
    }

    addAlert(severity, title, description) {
        this.alerts.push({
            severity,
            title,
            description,
            timestamp: new Date().toISOString()
        });
    }

    getTotalFindings() {
        return Object.values(this.findings).reduce((sum, findings) => sum + findings.length, 0);
    }

    calculateAuthScore(configuredSecrets = 0) {
        if (configuredSecrets >= 4) return 100;
        if (configuredSecrets >= 2) return 75;
        if (configuredSecrets >= 1) return 50;
        return 0;
    }

    calculateDependencyScore() {
        const critical = this.findings.critical.filter(f => f.title.includes('dependency')).length;
        const high = this.findings.high.filter(f => f.title.includes('dependency')).length;
        
        if (critical > 0) return 0;
        if (high > 0) return 40;
        return 100;
    }

    calculateSecretsScore() {
        const secrets = this.findings.high.filter(f => f.title.includes('secret') || f.title.includes('credential')).length;
        return Math.max(0, 100 - (secrets * 25));
    }

    calculateWebsiteScore() {
        const webFindings = this.findings.medium.filter(f => f.title.includes('security headers')).length;
        return Math.max(0, 100 - (webFindings * 20));
    }

    getSecurityScore() {
        const weights = {
            authentication: 0.3,
            dependencies: 0.25,
            secrets: 0.25,
            website: 0.2
        };

        const scores = {
            authentication: this.calculateAuthScore(),
            dependencies: this.calculateDependencyScore(),
            secrets: this.calculateSecretsScore(),
            website: this.calculateWebsiteScore()
        };

        const overall = Math.round(
            (scores.authentication * weights.authentication) +
            (scores.dependencies * weights.dependencies) +
            (scores.secrets * weights.secrets) +
            (scores.website * weights.website)
        );

        return {
            overall,
            breakdown: scores,
            status: this.getSecurityStatus(overall)
        };
    }

    getSecurityStatus(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'fair';
        if (score >= 40) return 'poor';
        return 'critical';
    }

    getRiskLevel() {
        const critical = this.findings.critical.length;
        const high = this.findings.high.length;
        
        if (critical > 0) return 'critical';
        if (high > 2) return 'high';
        if (high > 0) return 'medium';
        return 'low';
    }

    generateRecommendations() {
        const recs = [];
        
        if (this.findings.critical.length > 0) {
            recs.push({
                priority: 'critical',
                action: 'Address all critical security findings immediately',
                timeline: 'Within 24 hours'
            });
        }

        if (this.findings.high.length > 0) {
            recs.push({
                priority: 'high',
                action: 'Fix high severity security issues',
                timeline: 'Within 1 week'
            });
        }

        // Environment variables check
        const envConfigured = process.env.GITHUB_TOKEN || process.env.ANTHROPIC_API_KEY;
        if (!envConfigured) {
            recs.push({
                priority: 'high',
                action: 'Configure authentication secrets in GitHub repository settings',
                timeline: 'Before next deployment'
            });
        }

        recs.push({
            priority: 'medium',
            action: 'Schedule monthly security reviews',
            timeline: 'Ongoing'
        });

        return recs;
    }
}

// CLI execution
async function main() {
    if (process.argv[2] === 'monitor') {
        const monitor = new SecurityMonitoringSystem();
        const result = await monitor.runSecurityScan();
        
        
        
        `);
        }`);
        
        
        // Exit with appropriate code
        process.exit(result.overall < 60 ? 1 : 0);
    }
    
    
    
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    main().catch(error => {
        console.error('Security monitoring failed:', error);
        process.exit(1);
    });
}

export default SecurityMonitoringSystem;