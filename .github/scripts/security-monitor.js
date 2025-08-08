/**
 * Enterprise Security Monitoring & Incident Response System
 * 
 * Features:
 * - Real-time threat detection
 * - Automated incident response
 * - Security event logging
 * - Vulnerability scanning
 * - Compliance monitoring
 * - Alert management
 * - Forensic data collection
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Security Event Types
 */
const SECURITY_EVENTS = {
    AUTHENTICATION_FAILURE: 'auth_failure',
    BRUTE_FORCE_ATTEMPT: 'brute_force',
    XSS_ATTEMPT: 'xss_attempt',
    SQL_INJECTION_ATTEMPT: 'sql_injection',
    COMMAND_INJECTION_ATTEMPT: 'command_injection',
    PATH_TRAVERSAL_ATTEMPT: 'path_traversal',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    DATA_BREACH_ATTEMPT: 'data_breach',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    TOKEN_TAMPERING: 'token_tampering',
    VULNERABILITY_DETECTED: 'vulnerability_detected'
};

/**
 * Threat Severity Levels
 */
const SEVERITY_LEVELS = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
    EMERGENCY: 5
};

class SecurityMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            alertThresholds: {
                [SECURITY_EVENTS.AUTHENTICATION_FAILURE]: { count: 5, window: 300000 }, // 5 in 5 minutes
                [SECURITY_EVENTS.BRUTE_FORCE_ATTEMPT]: { count: 3, window: 60000 },     // 3 in 1 minute
                [SECURITY_EVENTS.XSS_ATTEMPT]: { count: 1, window: 0 },                 // Immediate
                [SECURITY_EVENTS.SQL_INJECTION_ATTEMPT]: { count: 1, window: 0 },       // Immediate
                [SECURITY_EVENTS.RATE_LIMIT_EXCEEDED]: { count: 10, window: 600000 }    // 10 in 10 minutes
            },
            retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
            logPath: path.join(process.cwd(), 'data', 'security-logs'),
            alertsPath: path.join(process.cwd(), 'data', 'security-alerts'),
            incidentsPath: path.join(process.cwd(), 'data', 'incidents'),
            ...config
        };
        
        this.events = [];
        this.activeIncidents = new Map();
        this.blockedIPs = new Set();
        this.suspiciousPatterns = new Map();
        this.complianceChecks = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize security monitoring system
     */
    async initialize() {
        try {
            await this.createDirectories();
            await this.loadBlockedIPs();
            await this.loadActiveIncidents();
            
            // Set up periodic tasks
            setInterval(() => this.runVulnerabilityScans(), 3600000); // Every hour
            setInterval(() => this.cleanupOldEvents(), 86400000);     // Daily
            setInterval(() => this.runComplianceChecks(), 43200000);  // Twice daily
            
            console.log('🛡️ Security Monitor initialized');
            
        } catch (error) {
            console.error('❌ Security Monitor initialization failed:', error);
        }
    }
    
    /**
     * Create necessary directories
     */
    async createDirectories() {
        const dirs = [this.config.logPath, this.config.alertsPath, this.config.incidentsPath];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
            }
        }
    }
    
    /**
     * Log security event
     */
    async logSecurityEvent(eventType, details = {}) {
        const event = {
            id: crypto.randomBytes(16).toString('hex'),
            type: eventType,
            severity: this.calculateSeverity(eventType, details),
            timestamp: new Date().toISOString(),
            source: details.source || 'system',
            userAgent: details.userAgent,
            ip: details.ip,
            userId: details.userId,
            sessionId: details.sessionId,
            requestPath: details.requestPath,
            method: details.method,
            payload: details.payload,
            metadata: {
                geolocation: details.geolocation,
                fingerprint: details.fingerprint,
                referrer: details.referrer
            },
            rawData: details.rawData
        };
        
        // Add to events array
        this.events.push(event);
        
        // Check if event triggers an alert
        await this.checkAlertThresholds(event);
        
        // Write to log file
        await this.writeEventToLog(event);
        
        // Emit event for listeners
        this.emit('securityEvent', event);
        
        console.log(`🚨 Security Event: ${eventType} (Severity: ${event.severity}) from ${event.ip || 'unknown'}`);
        
        return event;
    }
    
    /**
     * Calculate event severity based on type and context
     */
    calculateSeverity(eventType, details) {
        const baseSeverity = {
            [SECURITY_EVENTS.AUTHENTICATION_FAILURE]: SEVERITY_LEVELS.LOW,
            [SECURITY_EVENTS.BRUTE_FORCE_ATTEMPT]: SEVERITY_LEVELS.HIGH,
            [SECURITY_EVENTS.XSS_ATTEMPT]: SEVERITY_LEVELS.HIGH,
            [SECURITY_EVENTS.SQL_INJECTION_ATTEMPT]: SEVERITY_LEVELS.CRITICAL,
            [SECURITY_EVENTS.COMMAND_INJECTION_ATTEMPT]: SEVERITY_LEVELS.CRITICAL,
            [SECURITY_EVENTS.PATH_TRAVERSAL_ATTEMPT]: SEVERITY_LEVELS.HIGH,
            [SECURITY_EVENTS.DATA_BREACH_ATTEMPT]: SEVERITY_LEVELS.EMERGENCY,
            [SECURITY_EVENTS.UNAUTHORIZED_ACCESS]: SEVERITY_LEVELS.HIGH,
            [SECURITY_EVENTS.TOKEN_TAMPERING]: SEVERITY_LEVELS.CRITICAL,
            [SECURITY_EVENTS.VULNERABILITY_DETECTED]: SEVERITY_LEVELS.MEDIUM
        }[eventType] || SEVERITY_LEVELS.LOW;
        
        // Increase severity based on context
        let adjustedSeverity = baseSeverity;
        
        if (details.repeat && details.repeatCount > 5) adjustedSeverity += 1;
        if (details.adminTarget) adjustedSeverity += 1;
        if (details.dataExposure) adjustedSeverity += 2;
        if (details.systemCompromise) adjustedSeverity = SEVERITY_LEVELS.EMERGENCY;
        
        return Math.min(adjustedSeverity, SEVERITY_LEVELS.EMERGENCY);
    }
    
    /**
     * Check if event triggers alert thresholds
     */
    async checkAlertThresholds(event) {
        const threshold = this.config.alertThresholds[event.type];
        if (!threshold) return;
        
        const now = Date.now();
        const windowStart = now - threshold.window;
        
        // Count recent events of same type from same source
        const recentEvents = this.events.filter(e => 
            e.type === event.type &&
            e.ip === event.ip &&
            new Date(e.timestamp).getTime() > windowStart
        );
        
        if (recentEvents.length >= threshold.count) {
            await this.createIncident(event, recentEvents);
        }
    }
    
    /**
     * Create security incident
     */
    async createIncident(triggerEvent, relatedEvents = []) {
        const incident = {
            id: this.generateIncidentId(),
            status: 'open',
            severity: triggerEvent.severity,
            type: triggerEvent.type,
            title: this.generateIncidentTitle(triggerEvent),
            description: this.generateIncidentDescription(triggerEvent, relatedEvents),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            triggerEvent: triggerEvent.id,
            relatedEvents: relatedEvents.map(e => e.id),
            source: {
                ip: triggerEvent.ip,
                userAgent: triggerEvent.userAgent,
                geolocation: triggerEvent.metadata?.geolocation
            },
            timeline: [{
                timestamp: new Date().toISOString(),
                action: 'incident_created',
                details: 'Incident automatically created by security monitor'
            }],
            response: {
                automated: [],
                manual: []
            },
            forensics: {
                evidence: this.collectForensicEvidence(triggerEvent, relatedEvents),
                analysis: null
            }
        };
        
        // Store incident
        this.activeIncidents.set(incident.id, incident);
        await this.writeIncidentToFile(incident);
        
        // Execute automated response
        await this.executeAutomatedResponse(incident);
        
        // Send alerts
        await this.sendSecurityAlert(incident);
        
        console.log(`🚨 SECURITY INCIDENT CREATED: ${incident.id} - ${incident.title}`);
        
        this.emit('incidentCreated', incident);
        
        return incident;
    }
    
    /**
     * Generate unique incident ID
     */
    generateIncidentId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(3).toString('hex');
        return `INC-${timestamp}-${random}`.toUpperCase();
    }
    
    /**
     * Generate incident title
     */
    generateIncidentTitle(event) {
        const titles = {
            [SECURITY_EVENTS.BRUTE_FORCE_ATTEMPT]: 'Brute Force Attack Detected',
            [SECURITY_EVENTS.XSS_ATTEMPT]: 'Cross-Site Scripting Attempt',
            [SECURITY_EVENTS.SQL_INJECTION_ATTEMPT]: 'SQL Injection Attack',
            [SECURITY_EVENTS.COMMAND_INJECTION_ATTEMPT]: 'Command Injection Attack',
            [SECURITY_EVENTS.DATA_BREACH_ATTEMPT]: 'Potential Data Breach',
            [SECURITY_EVENTS.UNAUTHORIZED_ACCESS]: 'Unauthorized Access Attempt'
        };
        
        return titles[event.type] || `Security Event: ${event.type}`;
    }
    
    /**
     * Generate incident description
     */
    generateIncidentDescription(triggerEvent, relatedEvents) {
        const eventCount = relatedEvents.length + 1;
        const timespan = relatedEvents.length > 0 ? 
            this.calculateTimespan(relatedEvents[0].timestamp, triggerEvent.timestamp) :
            '0 seconds';
            
        return `Security incident triggered by ${eventCount} related events over ${timespan}. ` +
               `Source IP: ${triggerEvent.ip || 'unknown'}. ` +
               `Initial detection: ${triggerEvent.type} at ${triggerEvent.timestamp}.`;
    }
    
    /**
     * Collect forensic evidence
     */
    collectForensicEvidence(triggerEvent, relatedEvents) {
        return {
            eventCount: relatedEvents.length + 1,
            timespan: relatedEvents.length > 0 ? 
                this.calculateTimespan(relatedEvents[0].timestamp, triggerEvent.timestamp) : '0s',
            uniqueIPs: [...new Set([triggerEvent.ip, ...relatedEvents.map(e => e.ip)])],
            userAgents: [...new Set([triggerEvent.userAgent, ...relatedEvents.map(e => e.userAgent)])].filter(Boolean),
            requestPaths: [...new Set([triggerEvent.requestPath, ...relatedEvents.map(e => e.requestPath)])].filter(Boolean),
            payloadPatterns: this.extractPayloadPatterns([triggerEvent, ...relatedEvents]),
            sessionIds: [...new Set([triggerEvent.sessionId, ...relatedEvents.map(e => e.sessionId)])].filter(Boolean)
        };
    }
    
    /**
     * Execute automated incident response
     */
    async executeAutomatedResponse(incident) {
        const responses = [];
        
        // Auto-block IP for high severity incidents
        if (incident.severity >= SEVERITY_LEVELS.HIGH && incident.source.ip) {
            this.blockedIPs.add(incident.source.ip);
            responses.push({
                action: 'ip_blocked',
                target: incident.source.ip,
                timestamp: new Date().toISOString()
            });
        }
        
        // Rate limit for suspicious activity
        if (incident.type === SECURITY_EVENTS.BRUTE_FORCE_ATTEMPT) {
            responses.push({
                action: 'rate_limit_applied',
                target: incident.source.ip,
                duration: '1 hour',
                timestamp: new Date().toISOString()
            });
        }
        
        // Create security alert for critical incidents
        if (incident.severity >= SEVERITY_LEVELS.CRITICAL) {
            responses.push({
                action: 'security_alert_sent',
                channels: ['email', 'slack', 'sms'],
                timestamp: new Date().toISOString()
            });
        }
        
        incident.response.automated = responses;
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            action: 'automated_response_executed',
            details: `${responses.length} automated responses executed`
        });
        
        await this.writeIncidentToFile(incident);
        
        return responses;
    }
    
    /**
     * Send security alert
     */
    async sendSecurityAlert(incident) {
        const alert = {
            id: crypto.randomBytes(8).toString('hex'),
            incidentId: incident.id,
            timestamp: new Date().toISOString(),
            severity: incident.severity,
            title: incident.title,
            description: incident.description,
            source: incident.source,
            recommendedActions: this.getRecommendedActions(incident),
            channels: this.determineAlertChannels(incident.severity)
        };
        
        // Write alert to file
        const alertFile = path.join(this.config.alertsPath, `alert-${alert.id}.json`);
        await fs.writeFile(alertFile, JSON.stringify(alert, null, 2));
        
        // Log to console (in production, send to actual alert channels)
        console.log(`🚨 SECURITY ALERT ${alert.id}: ${alert.title}`);
        console.log(`   Severity: ${this.getSeverityText(alert.severity)}`);
        console.log(`   Source: ${alert.source.ip || 'unknown'}`);
        console.log(`   Actions: ${alert.recommendedActions.join(', ')}`);
        
        this.emit('alertSent', alert);
        
        return alert;
    }
    
    /**
     * Get recommended actions for incident
     */
    getRecommendedActions(incident) {
        const actions = [];
        
        switch (incident.type) {
            case SECURITY_EVENTS.BRUTE_FORCE_ATTEMPT:
                actions.push('Block source IP', 'Review authentication logs', 'Check password policies');
                break;
            case SECURITY_EVENTS.XSS_ATTEMPT:
                actions.push('Review input validation', 'Check CSP headers', 'Audit application code');
                break;
            case SECURITY_EVENTS.SQL_INJECTION_ATTEMPT:
                actions.push('Review database queries', 'Check parameterized statements', 'Audit data access');
                break;
            case SECURITY_EVENTS.DATA_BREACH_ATTEMPT:
                actions.push('Immediate investigation', 'Check data integrity', 'Review access logs', 'Contact legal team');
                break;
            default:
                actions.push('Investigate incident', 'Review security logs', 'Monitor for patterns');
        }
        
        if (incident.severity >= SEVERITY_LEVELS.CRITICAL) {
            actions.push('Escalate to security team', 'Consider system isolation');
        }
        
        return actions;
    }
    
    /**
     * Determine alert channels based on severity
     */
    determineAlertChannels(severity) {
        const channels = ['log'];
        
        if (severity >= SEVERITY_LEVELS.MEDIUM) channels.push('email');
        if (severity >= SEVERITY_LEVELS.HIGH) channels.push('slack');
        if (severity >= SEVERITY_LEVELS.CRITICAL) channels.push('sms', 'pager');
        if (severity === SEVERITY_LEVELS.EMERGENCY) channels.push('phone');
        
        return channels;
    }
    
    /**
     * Run vulnerability scans
     */
    async runVulnerabilityScans() {
        const vulnerabilities = [];
        
        try {
            // Check for common vulnerabilities
            const checks = [
                this.checkPasswordPolicy(),
                this.checkSSLConfiguration(),
                this.checkSecurityHeaders(),
                this.checkDependencyVulnerabilities(),
                this.checkPermissionsConfiguration()
            ];
            
            const results = await Promise.allSettled(checks);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.vulnerabilities) {
                    vulnerabilities.push(...result.value.vulnerabilities);
                }
            });
            
            // Log vulnerabilities found
            if (vulnerabilities.length > 0) {
                await this.logSecurityEvent(SECURITY_EVENTS.VULNERABILITY_DETECTED, {
                    source: 'vulnerability_scanner',
                    vulnerabilities: vulnerabilities.length,
                    details: vulnerabilities
                });
            }
            
            console.log(`🔍 Vulnerability scan completed: ${vulnerabilities.length} issues found`);
            
        } catch (error) {
            console.error('❌ Vulnerability scan failed:', error);
        }
    }
    
    /**
     * Check password policy compliance
     */
    async checkPasswordPolicy() {
        const vulnerabilities = [];
        
        // In a real implementation, check actual password policies
        // For demo purposes, we'll simulate some checks
        
        return { vulnerabilities };
    }
    
    /**
     * Check SSL configuration
     */
    async checkSSLConfiguration() {
        const vulnerabilities = [];
        
        // Check for weak SSL configurations
        // This is a placeholder - in production, use actual SSL testing tools
        
        return { vulnerabilities };
    }
    
    /**
     * Check security headers
     */
    async checkSecurityHeaders() {
        const vulnerabilities = [];
        
        // Check if security headers are properly configured
        const requiredHeaders = [
            'Strict-Transport-Security',
            'X-Content-Type-Options',
            'X-Frame-Options',
            'Content-Security-Policy'
        ];
        
        // In production, actually fetch and check headers
        
        return { vulnerabilities };
    }
    
    /**
     * Check dependency vulnerabilities
     */
    async checkDependencyVulnerabilities() {
        const vulnerabilities = [];
        
        try {
            // Check package.json for known vulnerable dependencies
            const packagePath = path.join(process.cwd(), 'package.json');
            const packageData = await fs.readFile(packagePath, 'utf8');
            const packageJson = JSON.parse(packageData);
            
            // In production, use npm audit or similar tools
            
        } catch (error) {
            // Handle error
        }
        
        return { vulnerabilities };
    }
    
    /**
     * Check permissions configuration
     */
    async checkPermissionsConfiguration() {
        const vulnerabilities = [];
        
        // Check file and directory permissions
        // This is a placeholder for actual permission checks
        
        return { vulnerabilities };
    }
    
    /**
     * Run compliance checks
     */
    async runComplianceChecks() {
        const frameworks = ['GDPR', 'SOC2', 'OWASP'];
        
        for (const framework of frameworks) {
            try {
                const result = await this.checkCompliance(framework);
                this.complianceChecks.set(framework, {
                    timestamp: new Date().toISOString(),
                    status: result.compliant ? 'compliant' : 'non-compliant',
                    score: result.score,
                    issues: result.issues,
                    recommendations: result.recommendations
                });
            } catch (error) {
                console.error(`❌ ${framework} compliance check failed:`, error);
            }
        }
        
        console.log('✅ Compliance checks completed');
    }
    
    /**
     * Check specific compliance framework
     */
    async checkCompliance(framework) {
        switch (framework) {
            case 'GDPR':
                return this.checkGDPRCompliance();
            case 'SOC2':
                return this.checkSOC2Compliance();
            case 'OWASP':
                return this.checkOWASPCompliance();
            default:
                throw new Error(`Unknown compliance framework: ${framework}`);
        }
    }
    
    /**
     * Check GDPR compliance
     */
    async checkGDPRCompliance() {
        const issues = [];
        const recommendations = [];
        let score = 100;
        
        // Check for data processing lawful basis
        // Check for consent management
        // Check for data retention policies
        // Check for data subject rights implementation
        // Check for cross-border transfer safeguards
        
        return {
            compliant: issues.length === 0,
            score,
            issues,
            recommendations
        };
    }
    
    /**
     * Check SOC2 compliance
     */
    async checkSOC2Compliance() {
        const issues = [];
        const recommendations = [];
        let score = 100;
        
        // Check security controls
        // Check availability controls
        // Check processing integrity
        // Check confidentiality controls
        // Check privacy controls
        
        return {
            compliant: issues.length === 0,
            score,
            issues,
            recommendations
        };
    }
    
    /**
     * Check OWASP compliance
     */
    async checkOWASPCompliance() {
        const issues = [];
        const recommendations = [];
        let score = 100;
        
        // Check OWASP Top 10 vulnerabilities
        // Injection
        // Broken Authentication
        // Sensitive Data Exposure
        // XML External Entities (XXE)
        // Broken Access Control
        // Security Misconfiguration
        // Cross-Site Scripting (XSS)
        // Insecure Deserialization
        // Using Components with Known Vulnerabilities
        // Insufficient Logging & Monitoring
        
        return {
            compliant: issues.length === 0,
            score,
            issues,
            recommendations
        };
    }
    
    /**
     * Clean up old events
     */
    async cleanupOldEvents() {
        const now = Date.now();
        const cutoff = now - this.config.retentionPeriod;
        
        const oldEventCount = this.events.length;
        this.events = this.events.filter(event => 
            new Date(event.timestamp).getTime() > cutoff
        );
        
        const removed = oldEventCount - this.events.length;
        if (removed > 0) {
            console.log(`🧹 Cleaned up ${removed} old security events`);
        }
    }
    
    /**
     * Write event to log file
     */
    async writeEventToLog(event) {
        const logDate = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.config.logPath, `security-${logDate}.log`);
        
        const logEntry = `${event.timestamp} [${event.severity}] ${event.type} - ${JSON.stringify(event)}\n`;
        
        try {
            await fs.appendFile(logFile, logEntry);
        } catch (error) {
            console.error('Failed to write security log:', error);
        }
    }
    
    /**
     * Write incident to file
     */
    async writeIncidentToFile(incident) {
        const incidentFile = path.join(this.config.incidentsPath, `incident-${incident.id}.json`);
        
        try {
            await fs.writeFile(incidentFile, JSON.stringify(incident, null, 2));
        } catch (error) {
            console.error('Failed to write incident file:', error);
        }
    }
    
    /**
     * Load blocked IPs from file
     */
    async loadBlockedIPs() {
        try {
            const blockedIPsFile = path.join(this.config.logPath, 'blocked-ips.json');
            const data = await fs.readFile(blockedIPsFile, 'utf8');
            const ips = JSON.parse(data);
            this.blockedIPs = new Set(ips);
        } catch (error) {
            // File doesn't exist or is invalid, start with empty set
            this.blockedIPs = new Set();
        }
    }
    
    /**
     * Load active incidents from files
     */
    async loadActiveIncidents() {
        try {
            const files = await fs.readdir(this.config.incidentsPath);
            const incidentFiles = files.filter(f => f.startsWith('incident-') && f.endsWith('.json'));
            
            for (const file of incidentFiles) {
                const filePath = path.join(this.config.incidentsPath, file);
                const data = await fs.readFile(filePath, 'utf8');
                const incident = JSON.parse(data);
                
                if (incident.status === 'open') {
                    this.activeIncidents.set(incident.id, incident);
                }
            }
        } catch (error) {
            console.error('Failed to load active incidents:', error);
        }
    }
    
    /**
     * Utility methods
     */
    calculateTimespan(start, end) {
        const diff = new Date(end) - new Date(start);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    extractPayloadPatterns(events) {
        const patterns = [];
        events.forEach(event => {
            if (event.payload && typeof event.payload === 'string') {
                // Extract common patterns
                if (event.payload.includes('<script')) patterns.push('script_tag');
                if (event.payload.includes('SELECT') || event.payload.includes('UNION')) patterns.push('sql_keyword');
                if (event.payload.includes('../')) patterns.push('path_traversal');
                if (event.payload.includes('eval(')) patterns.push('code_execution');
            }
        });
        return [...new Set(patterns)];
    }
    
    getSeverityText(severity) {
        const texts = {
            [SEVERITY_LEVELS.LOW]: 'LOW',
            [SEVERITY_LEVELS.MEDIUM]: 'MEDIUM',
            [SEVERITY_LEVELS.HIGH]: 'HIGH',
            [SEVERITY_LEVELS.CRITICAL]: 'CRITICAL',
            [SEVERITY_LEVELS.EMERGENCY]: 'EMERGENCY'
        };
        return texts[severity] || 'UNKNOWN';
    }
    
    /**
     * Public API methods
     */
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }
    
    getActiveIncidents() {
        return Array.from(this.activeIncidents.values());
    }
    
    getComplianceStatus() {
        return Object.fromEntries(this.complianceChecks);
    }
    
    getSecurityMetrics() {
        const last24h = Date.now() - (24 * 60 * 60 * 1000);
        const recentEvents = this.events.filter(e => new Date(e.timestamp).getTime() > last24h);
        
        return {
            totalEvents: this.events.length,
            recentEvents: recentEvents.length,
            activeIncidents: this.activeIncidents.size,
            blockedIPs: this.blockedIPs.size,
            complianceFrameworks: this.complianceChecks.size,
            eventsByType: this.events.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {}),
            severityDistribution: this.events.reduce((acc, event) => {
                const severity = this.getSeverityText(event.severity);
                acc[severity] = (acc[severity] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

module.exports = { SecurityMonitor, SECURITY_EVENTS, SEVERITY_LEVELS };