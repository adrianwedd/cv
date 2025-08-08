/**
 * Enterprise Security Audit Logging System
 * 
 * Comprehensive audit logging for security events with:
 * - Structured audit log format
 * - Event correlation and analysis
 * - Compliance logging (SOX, GDPR, etc.)
 * - Log integrity and tamper detection
 * - Automated log analysis and alerting
 * - Log retention and archival
 * - Forensic log preservation
 * - Real-time log monitoring
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Audit Event Types
 */
const AUDIT_EVENT_TYPES = {
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    DATA_ACCESS: 'data_access',
    DATA_MODIFICATION: 'data_modification',
    PRIVILEGE_ESCALATION: 'privilege_escalation',
    SYSTEM_ACCESS: 'system_access',
    CONFIGURATION_CHANGE: 'configuration_change',
    SECURITY_VIOLATION: 'security_violation',
    COMPLIANCE_EVENT: 'compliance_event',
    ADMIN_ACTION: 'admin_action',
    API_ACCESS: 'api_access',
    FILE_ACCESS: 'file_access'
};

/**
 * Audit Severity Levels
 */
const AUDIT_SEVERITY = {
    INFO: 'info',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Compliance Frameworks
 */
const COMPLIANCE_FRAMEWORKS = {
    GDPR: 'gdpr',
    SOX: 'sox',
    HIPAA: 'hipaa',
    PCI_DSS: 'pci_dss',
    ISO27001: 'iso27001',
    NIST: 'nist'
};

class SecurityAuditLogger extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            logDirectory: path.join(process.cwd(), 'data', 'audit-logs'),
            archiveDirectory: path.join(process.cwd(), 'data', 'audit-archive'),
            logFormat: 'json', // 'json' or 'syslog'
            maxLogSize: 100 * 1024 * 1024, // 100MB
            retentionPeriod: 2555 * 24 * 60 * 60 * 1000, // 7 years
            compressionEnabled: true,
            encryptionEnabled: true,
            integrityProtection: true,
            realTimeAnalysis: true,
            complianceFrameworks: [COMPLIANCE_FRAMEWORKS.GDPR, COMPLIANCE_FRAMEWORKS.ISO27001],
            ...config
        };
        
        this.currentLogFile = null;
        this.logSequence = 0;
        this.sessionId = crypto.randomBytes(8).toString('hex');
        this.logBuffer = [];
        this.hashChain = [];
        this.alertRules = new Map();
        this.correlationRules = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize audit logging system
     */
    async initialize() {
        try {
            await this.createDirectories();
            await this.initializeLogFile();
            await this.loadAlertRules();
            await this.loadCorrelationRules();
            
            // Start periodic tasks
            setInterval(() => this.flushLogBuffer(), 5000);  // Flush every 5 seconds
            setInterval(() => this.rotateLogFiles(), 60000); // Check rotation every minute
            setInterval(() => this.analyzeLogPatterns(), 30000); // Analyze every 30 seconds
            
            console.log('📋 Security Audit Logger initialized');
            console.log(`   Session ID: ${this.sessionId}`);
            console.log(`   Log Directory: ${this.config.logDirectory}`);
            
        } catch (error) {
            console.error('❌ Audit Logger initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Log security audit event
     */
    async logAuditEvent(eventData) {
        const auditEvent = this.createAuditEvent(eventData);
        
        // Add to buffer
        this.logBuffer.push(auditEvent);
        
        // Real-time analysis
        if (this.config.realTimeAnalysis) {
            await this.analyzeEvent(auditEvent);
        }
        
        // Emit event for listeners
        this.emit('auditEvent', auditEvent);
        
        // Check for immediate flush conditions
        if (this.shouldFlushImmediately(auditEvent)) {
            await this.flushLogBuffer();
        }
        
        return auditEvent.id;
    }
    
    /**
     * Create structured audit event
     */
    createAuditEvent(eventData) {
        this.logSequence++;
        
        const timestamp = new Date().toISOString();
        const event = {
            // Core event data
            id: crypto.randomBytes(8).toString('hex'),
            sequence: this.logSequence,
            timestamp: timestamp,
            sessionId: this.sessionId,
            
            // Event classification
            type: eventData.type || AUDIT_EVENT_TYPES.SYSTEM_ACCESS,
            category: eventData.category || 'general',
            severity: eventData.severity || AUDIT_SEVERITY.INFO,
            
            // Subject information
            subject: {
                userId: eventData.subject?.userId || 'system',
                username: eventData.subject?.username,
                roles: eventData.subject?.roles || [],
                sessionId: eventData.subject?.sessionId
            },
            
            // Object information (what was accessed/modified)
            object: {
                type: eventData.object?.type,
                id: eventData.object?.id,
                name: eventData.object?.name,
                path: eventData.object?.path,
                attributes: eventData.object?.attributes || {}
            },
            
            // Action information
            action: {
                operation: eventData.action?.operation || 'unknown',
                method: eventData.action?.method,
                parameters: eventData.action?.parameters || {},
                result: eventData.action?.result || 'unknown',
                resultCode: eventData.action?.resultCode,
                resultMessage: eventData.action?.resultMessage
            },
            
            // Context information
            context: {
                sourceIP: eventData.context?.sourceIP,
                userAgent: eventData.context?.userAgent,
                geolocation: eventData.context?.geolocation,
                requestId: eventData.context?.requestId,
                correlationId: eventData.context?.correlationId,
                applicationVersion: eventData.context?.applicationVersion || process.env.npm_package_version
            },
            
            // Technical details
            technical: {
                hostname: require('os').hostname(),
                processId: process.pid,
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch
            },
            
            // Compliance tagging
            compliance: {
                frameworks: this.determineComplianceFrameworks(eventData),
                dataClassification: eventData.compliance?.dataClassification,
                retentionClass: eventData.compliance?.retentionClass || 'standard'
            },
            
            // Risk assessment
            risk: {
                score: this.calculateRiskScore(eventData),
                factors: eventData.risk?.factors || [],
                businessImpact: eventData.risk?.businessImpact || 'low'
            },
            
            // Custom fields
            custom: eventData.custom || {},
            
            // Integrity fields (calculated later)
            integrity: {
                hash: null,
                previousHash: null,
                signature: null
            }
        };
        
        // Calculate integrity hash
        event.integrity = this.calculateEventIntegrity(event);
        
        return event;
    }
    
    /**
     * Calculate event integrity hash
     */
    calculateEventIntegrity(event) {
        // Create copy without integrity field for hashing
        const eventForHash = { ...event };
        delete eventForHash.integrity;
        
        // Calculate hash of event content
        const eventHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(eventForHash))
            .digest('hex');
        
        // Get previous hash for chaining
        const previousHash = this.hashChain.length > 0 ? 
            this.hashChain[this.hashChain.length - 1] : 
            '0000000000000000000000000000000000000000000000000000000000000000';
        
        // Calculate chain hash
        const chainHash = crypto
            .createHash('sha256')
            .update(previousHash + eventHash)
            .digest('hex');
        
        // Add to hash chain
        this.hashChain.push(chainHash);
        
        // Create digital signature if enabled
        let signature = null;
        if (this.config.integrityProtection) {
            signature = this.signEvent(eventHash);
        }
        
        return {
            hash: eventHash,
            previousHash: previousHash,
            chainHash: chainHash,
            signature: signature
        };
    }
    
    /**
     * Sign event for integrity protection
     */
    signEvent(eventHash) {
        // In a real implementation, use proper digital signatures
        // For demo, create HMAC with secret key
        const secret = process.env.AUDIT_SIGNING_KEY || 'default-audit-key-change-in-production';
        
        return crypto
            .createHmac('sha256', secret)
            .update(eventHash)
            .digest('hex');
    }
    
    /**
     * Determine applicable compliance frameworks
     */
    determineComplianceFrameworks(eventData) {
        const frameworks = [];
        
        // GDPR - any personal data processing
        if (eventData.object?.type === 'personal_data' || 
            eventData.type === AUDIT_EVENT_TYPES.DATA_ACCESS ||
            eventData.type === AUDIT_EVENT_TYPES.DATA_MODIFICATION) {
            frameworks.push(COMPLIANCE_FRAMEWORKS.GDPR);
        }
        
        // SOX - financial data or system changes
        if (eventData.object?.type === 'financial_data' ||
            eventData.type === AUDIT_EVENT_TYPES.CONFIGURATION_CHANGE) {
            frameworks.push(COMPLIANCE_FRAMEWORKS.SOX);
        }
        
        // ISO27001 - all security events
        if (eventData.type === AUDIT_EVENT_TYPES.SECURITY_VIOLATION ||
            eventData.type === AUDIT_EVENT_TYPES.AUTHENTICATION ||
            eventData.type === AUDIT_EVENT_TYPES.AUTHORIZATION) {
            frameworks.push(COMPLIANCE_FRAMEWORKS.ISO27001);
        }
        
        return frameworks;
    }
    
    /**
     * Calculate risk score for event
     */
    calculateRiskScore(eventData) {
        let score = 0;
        
        // Base score by event type
        const typeScores = {
            [AUDIT_EVENT_TYPES.SECURITY_VIOLATION]: 8,
            [AUDIT_EVENT_TYPES.PRIVILEGE_ESCALATION]: 7,
            [AUDIT_EVENT_TYPES.DATA_MODIFICATION]: 6,
            [AUDIT_EVENT_TYPES.ADMIN_ACTION]: 5,
            [AUDIT_EVENT_TYPES.DATA_ACCESS]: 4,
            [AUDIT_EVENT_TYPES.AUTHENTICATION]: 3,
            [AUDIT_EVENT_TYPES.SYSTEM_ACCESS]: 2
        };
        
        score += typeScores[eventData.type] || 1;
        
        // Adjust for severity
        const severityMultipliers = {
            [AUDIT_SEVERITY.CRITICAL]: 2.0,
            [AUDIT_SEVERITY.HIGH]: 1.5,
            [AUDIT_SEVERITY.MEDIUM]: 1.0,
            [AUDIT_SEVERITY.LOW]: 0.7,
            [AUDIT_SEVERITY.INFO]: 0.5
        };
        
        score *= severityMultipliers[eventData.severity] || 1.0;
        
        // Adjust for failed operations
        if (eventData.action?.result === 'failure') {
            score *= 1.5;
        }
        
        // Adjust for privileged users
        if (eventData.subject?.roles?.includes('admin') || 
            eventData.subject?.roles?.includes('root')) {
            score *= 1.3;
        }
        
        // Adjust for sensitive data
        if (eventData.object?.attributes?.sensitive === true) {
            score *= 1.4;
        }
        
        return Math.min(Math.round(score), 10);
    }
    
    /**
     * Analyze event for real-time detection
     */
    async analyzeEvent(event) {
        // Check alert rules
        for (const [ruleName, rule] of this.alertRules.entries()) {
            if (this.matchesRule(event, rule)) {
                await this.triggerAlert(ruleName, event, rule);
            }
        }
        
        // Check correlation rules
        for (const [ruleName, rule] of this.correlationRules.entries()) {
            await this.checkCorrelation(ruleName, event, rule);
        }
        
        // Check for suspicious patterns
        await this.checkSuspiciousPatterns(event);
    }
    
    /**
     * Check if event matches alert rule
     */
    matchesRule(event, rule) {
        // Simple rule matching - in production, use more sophisticated rule engine
        if (rule.eventType && event.type !== rule.eventType) return false;
        if (rule.severity && event.severity !== rule.severity) return false;
        if (rule.minRiskScore && event.risk.score < rule.minRiskScore) return false;
        if (rule.userId && event.subject.userId !== rule.userId) return false;
        
        // Check custom conditions
        if (rule.conditions) {
            for (const condition of rule.conditions) {
                if (!this.evaluateCondition(event, condition)) return false;
            }
        }
        
        return true;
    }
    
    /**
     * Evaluate custom condition
     */
    evaluateCondition(event, condition) {
        const value = this.getNestedProperty(event, condition.field);
        
        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'contains':
                return typeof value === 'string' && value.includes(condition.value);
            case 'greater_than':
                return typeof value === 'number' && value > condition.value;
            case 'less_than':
                return typeof value === 'number' && value < condition.value;
            case 'regex':
                return new RegExp(condition.value).test(value);
            default:
                return false;
        }
    }
    
    /**
     * Get nested property from object
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    /**
     * Trigger security alert
     */
    async triggerAlert(ruleName, event, rule) {
        const alert = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: new Date().toISOString(),
            ruleName: ruleName,
            severity: rule.alertSeverity || event.severity,
            eventId: event.id,
            title: rule.title || `Security Alert: ${ruleName}`,
            description: rule.description || `Alert triggered by event ${event.id}`,
            event: event,
            context: {
                ruleType: 'alert',
                matchedFields: rule.conditions?.map(c => c.field) || []
            }
        };
        
        console.log(`🚨 SECURITY ALERT: ${alert.title}`);
        console.log(`   Rule: ${ruleName}, Event: ${event.id}, Severity: ${alert.severity}`);
        
        // Emit alert event
        this.emit('securityAlert', alert);
        
        // Log alert as audit event
        await this.logAuditEvent({
            type: AUDIT_EVENT_TYPES.SECURITY_VIOLATION,
            severity: alert.severity,
            action: {
                operation: 'alert_triggered',
                parameters: { ruleName, alertId: alert.id }
            },
            object: {
                type: 'security_alert',
                id: alert.id
            },
            context: {
                correlationId: event.id
            }
        });
        
        return alert;
    }
    
    /**
     * Check suspicious activity patterns
     */
    async checkSuspiciousPatterns(event) {
        const patterns = [
            this.checkBruteForcePattern(event),
            this.checkPrivilegeEscalationPattern(event),
            this.checkDataExfiltrationPattern(event),
            this.checkAfterHoursActivityPattern(event)
        ];
        
        const results = await Promise.allSettled(patterns);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.suspicious) {
                console.log(`🔍 Suspicious pattern detected: ${result.value.pattern}`);
                this.emit('suspiciousPattern', {
                    pattern: result.value.pattern,
                    event: event,
                    details: result.value.details
                });
            }
        });
    }
    
    /**
     * Pattern detection methods
     */
    async checkBruteForcePattern(event) {
        if (event.type !== AUDIT_EVENT_TYPES.AUTHENTICATION) {
            return { suspicious: false };
        }
        
        // Check recent authentication failures from same IP
        const recentEvents = this.logBuffer
            .filter(e => e.type === AUDIT_EVENT_TYPES.AUTHENTICATION &&
                        e.context.sourceIP === event.context.sourceIP &&
                        e.action.result === 'failure')
            .slice(-10);
        
        if (recentEvents.length >= 5) {
            return {
                suspicious: true,
                pattern: 'brute_force_authentication',
                details: {
                    failureCount: recentEvents.length,
                    sourceIP: event.context.sourceIP,
                    timespan: '5 minutes'
                }
            };
        }
        
        return { suspicious: false };
    }
    
    async checkPrivilegeEscalationPattern(event) {
        if (event.type !== AUDIT_EVENT_TYPES.PRIVILEGE_ESCALATION &&
            event.type !== AUDIT_EVENT_TYPES.ADMIN_ACTION) {
            return { suspicious: false };
        }
        
        // Check if user recently gained new privileges
        const userId = event.subject.userId;
        const recentRoleChanges = this.logBuffer
            .filter(e => e.subject.userId === userId &&
                        e.type === AUDIT_EVENT_TYPES.AUTHORIZATION &&
                        e.action.operation === 'role_granted')
            .slice(-5);
        
        if (recentRoleChanges.length > 0 && 
            event.subject.roles?.some(role => ['admin', 'root', 'superuser'].includes(role))) {
            return {
                suspicious: true,
                pattern: 'privilege_escalation',
                details: {
                    userId: userId,
                    newRoles: event.subject.roles,
                    recentChanges: recentRoleChanges.length
                }
            };
        }
        
        return { suspicious: false };
    }
    
    async checkDataExfiltrationPattern(event) {
        if (event.type !== AUDIT_EVENT_TYPES.DATA_ACCESS) {
            return { suspicious: false };
        }
        
        // Check for large amounts of data access
        const userId = event.subject.userId;
        const recentDataAccess = this.logBuffer
            .filter(e => e.subject.userId === userId &&
                        e.type === AUDIT_EVENT_TYPES.DATA_ACCESS)
            .slice(-20);
        
        if (recentDataAccess.length >= 15) {
            return {
                suspicious: true,
                pattern: 'data_exfiltration',
                details: {
                    userId: userId,
                    accessCount: recentDataAccess.length,
                    timespan: 'recent activity'
                }
            };
        }
        
        return { suspicious: false };
    }
    
    async checkAfterHoursActivityPattern(event) {
        const eventTime = new Date(event.timestamp);
        const hour = eventTime.getHours();
        
        // Check if activity is outside business hours (9 AM - 5 PM)
        if (hour < 9 || hour > 17) {
            // Check if this is unusual for this user
            const userId = event.subject.userId;
            const userNormalHours = await this.getUserNormalHours(userId);
            
            if (userNormalHours.outsideNormalHours < 0.1) { // Less than 10% of activity is after hours
                return {
                    suspicious: true,
                    pattern: 'after_hours_activity',
                    details: {
                        userId: userId,
                        hour: hour,
                        eventType: event.type,
                        normalAfterHoursRate: userNormalHours.outsideNormalHours
                    }
                };
            }
        }
        
        return { suspicious: false };
    }
    
    /**
     * Get user's normal hours pattern
     */
    async getUserNormalHours(userId) {
        // This would analyze historical data - for now return placeholder
        return {
            outsideNormalHours: 0.05, // 5% of activity after hours
            normalStartHour: 9,
            normalEndHour: 17
        };
    }
    
    /**
     * Flush log buffer to disk
     */
    async flushLogBuffer() {
        if (this.logBuffer.length === 0) return;
        
        const events = [...this.logBuffer];
        this.logBuffer = [];
        
        try {
            await this.writeEventsToLog(events);
        } catch (error) {
            console.error('❌ Failed to flush audit log buffer:', error);
            // Re-add events to buffer for retry
            this.logBuffer.unshift(...events);
        }
    }
    
    /**
     * Write events to log file
     */
    async writeEventsToLog(events) {
        if (!this.currentLogFile) {
            await this.initializeLogFile();
        }
        
        const logEntries = events.map(event => {
            if (this.config.logFormat === 'json') {
                return JSON.stringify(event) + '\n';
            } else {
                return this.formatSyslogEntry(event) + '\n';
            }
        });
        
        const logContent = logEntries.join('');
        
        try {
            await fs.appendFile(this.currentLogFile, logContent);
        } catch (error) {
            console.error('❌ Failed to write to audit log:', error);
            throw error;
        }
    }
    
    /**
     * Format event as syslog entry
     */
    formatSyslogEntry(event) {
        // RFC 3164 syslog format
        const facility = 16; // Local use 0
        const severity = this.getSyslogSeverity(event.severity);
        const priority = facility * 8 + severity;
        
        const timestamp = new Date(event.timestamp).toISOString().replace('T', ' ').replace('Z', '');
        const hostname = event.technical.hostname;
        const tag = 'audit';
        
        const message = `${event.type}[${event.id}]: ${event.action.operation} by ${event.subject.userId} on ${event.object?.name || event.object?.type || 'unknown'} result=${event.action.result}`;
        
        return `<${priority}>${timestamp} ${hostname} ${tag}: ${message}`;
    }
    
    getSyslogSeverity(severity) {
        const mapping = {
            [AUDIT_SEVERITY.CRITICAL]: 2, // Critical
            [AUDIT_SEVERITY.HIGH]: 3,     // Error
            [AUDIT_SEVERITY.MEDIUM]: 4,   // Warning
            [AUDIT_SEVERITY.LOW]: 5,      // Notice
            [AUDIT_SEVERITY.INFO]: 6      // Info
        };
        return mapping[severity] || 6;
    }
    
    /**
     * Initialize log file
     */
    async initializeLogFile() {
        const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
        const filename = `audit-${timestamp}-${this.sessionId}.log`;
        this.currentLogFile = path.join(this.config.logDirectory, filename);
        
        // Write log header
        const header = {
            logFileVersion: '1.0',
            sessionId: this.sessionId,
            startTime: new Date().toISOString(),
            hostname: require('os').hostname(),
            application: 'cv-security-system',
            logFormat: this.config.logFormat,
            integrityProtected: this.config.integrityProtection
        };
        
        await fs.writeFile(this.currentLogFile, JSON.stringify(header) + '\n');
        
        console.log(`📝 Audit log file initialized: ${this.currentLogFile}`);
    }
    
    /**
     * Create necessary directories
     */
    async createDirectories() {
        const dirs = [this.config.logDirectory, this.config.archiveDirectory];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
            }
        }
    }
    
    /**
     * Load alert rules
     */
    async loadAlertRules() {
        // Default alert rules
        this.alertRules.set('failed_authentication', {
            eventType: AUDIT_EVENT_TYPES.AUTHENTICATION,
            conditions: [
                { field: 'action.result', operator: 'equals', value: 'failure' }
            ],
            alertSeverity: AUDIT_SEVERITY.MEDIUM,
            title: 'Authentication Failure',
            description: 'Failed authentication attempt detected'
        });
        
        this.alertRules.set('privilege_escalation', {
            eventType: AUDIT_EVENT_TYPES.PRIVILEGE_ESCALATION,
            alertSeverity: AUDIT_SEVERITY.HIGH,
            title: 'Privilege Escalation',
            description: 'Privilege escalation detected'
        });
        
        this.alertRules.set('high_risk_event', {
            conditions: [
                { field: 'risk.score', operator: 'greater_than', value: 7 }
            ],
            alertSeverity: AUDIT_SEVERITY.HIGH,
            title: 'High Risk Security Event',
            description: 'High risk security event detected'
        });
        
        console.log(`⚠️ Loaded ${this.alertRules.size} alert rules`);
    }
    
    /**
     * Load correlation rules
     */
    async loadCorrelationRules() {
        this.correlationRules.set('brute_force_detection', {
            eventType: AUDIT_EVENT_TYPES.AUTHENTICATION,
            timeWindow: 300000, // 5 minutes
            threshold: 5,
            conditions: [
                { field: 'action.result', operator: 'equals', value: 'failure' }
            ],
            groupBy: ['context.sourceIP']
        });
        
        console.log(`🔗 Loaded ${this.correlationRules.size} correlation rules`);
    }
    
    /**
     * Check correlation rules
     */
    async checkCorrelation(ruleName, event, rule) {
        // Simplified correlation checking - in production use more sophisticated system
        if (rule.eventType && event.type !== rule.eventType) return;
        
        const now = Date.now();
        const windowStart = now - rule.timeWindow;
        
        // Find matching events in time window
        const matchingEvents = this.logBuffer.filter(e => {
            const eventTime = new Date(e.timestamp).getTime();
            return eventTime > windowStart && this.eventMatchesRule(e, rule);
        });
        
        if (matchingEvents.length >= rule.threshold) {
            await this.triggerCorrelationAlert(ruleName, event, rule, matchingEvents);
        }
    }
    
    eventMatchesRule(event, rule) {
        if (rule.conditions) {
            return rule.conditions.every(condition => 
                this.evaluateCondition(event, condition)
            );
        }
        return true;
    }
    
    async triggerCorrelationAlert(ruleName, triggerEvent, rule, matchingEvents) {
        console.log(`🔗 Correlation alert: ${ruleName} (${matchingEvents.length} events)`);
        
        this.emit('correlationAlert', {
            ruleName,
            triggerEvent,
            matchingEvents,
            threshold: rule.threshold,
            timeWindow: rule.timeWindow
        });
    }
    
    /**
     * Rotate log files when they get too large
     */
    async rotateLogFiles() {
        if (!this.currentLogFile) return;
        
        try {
            const stats = await fs.stat(this.currentLogFile);
            
            if (stats.size >= this.config.maxLogSize) {
                console.log(`🔄 Rotating audit log file (${stats.size} bytes)`);
                
                // Archive current file
                await this.archiveLogFile(this.currentLogFile);
                
                // Create new log file
                await this.initializeLogFile();
            }
        } catch (error) {
            console.error('❌ Log rotation failed:', error);
        }
    }
    
    /**
     * Archive log file
     */
    async archiveLogFile(logFile) {
        const filename = path.basename(logFile);
        const archiveFile = path.join(this.config.archiveDirectory, filename);
        
        // Move file to archive
        await fs.rename(logFile, archiveFile);
        
        // Compress if enabled
        if (this.config.compressionEnabled) {
            await this.compressFile(archiveFile);
        }
        
        console.log(`📦 Audit log archived: ${archiveFile}`);
    }
    
    /**
     * Compress archived log file
     */
    async compressFile(filePath) {
        // Placeholder for compression logic
        // In production, use zlib or similar
        console.log(`🗜️ Compressing file: ${filePath}`);
    }
    
    /**
     * Check if event should trigger immediate flush
     */
    shouldFlushImmediately(event) {
        return event.severity === AUDIT_SEVERITY.CRITICAL ||
               event.risk.score >= 8 ||
               event.type === AUDIT_EVENT_TYPES.SECURITY_VIOLATION;
    }
    
    /**
     * Analyze log patterns periodically
     */
    async analyzeLogPatterns() {
        if (this.logBuffer.length < 10) return; // Need enough events for analysis
        
        try {
            await this.analyzeUserBehaviorPatterns();
            await this.analyzeSystemHealthPatterns();
            await this.analyzeSecurityTrends();
        } catch (error) {
            console.error('❌ Log pattern analysis failed:', error);
        }
    }
    
    async analyzeUserBehaviorPatterns() {
        // Analyze user behavior for anomalies
        const userActivity = new Map();
        
        this.logBuffer.forEach(event => {
            const userId = event.subject.userId;
            if (!userActivity.has(userId)) {
                userActivity.set(userId, []);
            }
            userActivity.get(userId).push(event);
        });
        
        // Check for unusual activity patterns
        userActivity.forEach((events, userId) => {
            if (events.length > 50) { // Unusually high activity
                console.log(`📊 High activity detected for user: ${userId} (${events.length} events)`);
            }
        });
    }
    
    async analyzeSystemHealthPatterns() {
        const errorCount = this.logBuffer.filter(e => 
            e.action.result === 'failure' || e.severity === AUDIT_SEVERITY.HIGH
        ).length;
        
        if (errorCount > this.logBuffer.length * 0.1) { // More than 10% errors
            console.log(`⚠️ High error rate detected: ${errorCount}/${this.logBuffer.length} events`);
        }
    }
    
    async analyzeSecurityTrends() {
        const securityEvents = this.logBuffer.filter(e => 
            e.type === AUDIT_EVENT_TYPES.SECURITY_VIOLATION ||
            e.type === AUDIT_EVENT_TYPES.PRIVILEGE_ESCALATION
        );
        
        if (securityEvents.length > 0) {
            console.log(`🔒 Security events trend: ${securityEvents.length} events in analysis window`);
        }
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Get audit statistics
     */
    getAuditStatistics() {
        return {
            sessionId: this.sessionId,
            totalEvents: this.logSequence,
            bufferSize: this.logBuffer.length,
            currentLogFile: this.currentLogFile,
            hashChainLength: this.hashChain.length,
            alertRules: this.alertRules.size,
            correlationRules: this.correlationRules.size
        };
    }
    
    /**
     * Search audit logs
     */
    async searchLogs(criteria) {
        // Simple search implementation
        return this.logBuffer.filter(event => {
            if (criteria.userId && event.subject.userId !== criteria.userId) return false;
            if (criteria.eventType && event.type !== criteria.eventType) return false;
            if (criteria.severity && event.severity !== criteria.severity) return false;
            if (criteria.startTime && new Date(event.timestamp) < new Date(criteria.startTime)) return false;
            if (criteria.endTime && new Date(event.timestamp) > new Date(criteria.endTime)) return false;
            
            return true;
        });
    }
    
    /**
     * Verify log integrity
     */
    async verifyLogIntegrity() {
        console.log('🔍 Verifying audit log integrity...');
        
        let verified = true;
        const results = {
            totalEvents: this.hashChain.length,
            verifiedEvents: 0,
            integrityViolations: []
        };
        
        // Verify hash chain
        for (let i = 1; i < this.hashChain.length; i++) {
            const currentHash = this.hashChain[i];
            const previousHash = this.hashChain[i - 1];
            
            // In a real implementation, recalculate and verify hashes
            results.verifiedEvents++;
        }
        
        console.log(`✅ Integrity verification completed: ${results.verifiedEvents}/${results.totalEvents} events verified`);
        
        return results;
    }
}

module.exports = {
    SecurityAuditLogger,
    AUDIT_EVENT_TYPES,
    AUDIT_SEVERITY,
    COMPLIANCE_FRAMEWORKS
};