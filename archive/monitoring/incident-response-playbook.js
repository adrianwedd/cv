/**
 * Enterprise Security Incident Response System
 * 
 * Comprehensive incident response automation with:
 * - Automated incident detection and classification
 * - Response playbooks for different incident types
 * - Forensic evidence collection
 * - Automated containment and mitigation
 * - Communication and notification workflows
 * - Post-incident analysis and reporting
 * - Integration with security monitoring systems
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Incident Types
 */
const INCIDENT_TYPES = {
    DATA_BREACH: 'data_breach',
    MALWARE_INFECTION: 'malware_infection',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    DENIAL_OF_SERVICE: 'denial_of_service',
    PHISHING_ATTACK: 'phishing_attack',
    INSIDER_THREAT: 'insider_threat',
    SYSTEM_COMPROMISE: 'system_compromise',
    CONFIGURATION_BREACH: 'configuration_breach',
    API_ABUSE: 'api_abuse',
    CREDENTIAL_THEFT: 'credential_theft'
};

/**
 * Incident Severity Levels
 */
const INCIDENT_SEVERITY = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
    CATASTROPHIC: 5
};

/**
 * Incident Status
 */
const INCIDENT_STATUS = {
    DETECTED: 'detected',
    INVESTIGATING: 'investigating',
    CONTAINED: 'contained',
    MITIGATED: 'mitigated',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
};

/**
 * Response Team Roles
 */
const RESPONSE_ROLES = {
    INCIDENT_COMMANDER: 'incident_commander',
    SECURITY_ANALYST: 'security_analyst',
    FORENSICS_EXPERT: 'forensics_expert',
    COMMUNICATIONS_LEAD: 'communications_lead',
    TECHNICAL_LEAD: 'technical_lead',
    LEGAL_COUNSEL: 'legal_counsel',
    EXECUTIVE_SPONSOR: 'executive_sponsor'
};

class IncidentResponsePlaybook extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            playbooksPath: path.join(process.cwd(), 'data', 'incident-playbooks'),
            evidencePath: path.join(process.cwd(), 'data', 'forensic-evidence'),
            reportsPath: path.join(process.cwd(), 'data', 'incident-reports'),
            communicationChannels: {
                email: config.emailConfig || {},
                slack: config.slackConfig || {},
                sms: config.smsConfig || {}
            },
            escalationMatrix: config.escalationMatrix || this.getDefaultEscalationMatrix(),
            retentionPeriod: 2555 * 24 * 60 * 60 * 1000, // 7 years
            ...config
        };
        
        this.activeIncidents = new Map();
        this.responseTeam = new Map();
        this.playbooks = new Map();
        this.evidenceChain = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize incident response system
     */
    async initialize() {
        try {
            await this.createDirectories();
            await this.loadPlaybooks();
            await this.initializeResponseTeam();
            
            console.log('🚨 Incident Response System initialized');
            
        } catch (error) {
            console.error('❌ Incident Response System initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Create necessary directories
     */
    async createDirectories() {
        const dirs = [
            this.config.playbooksPath,
            this.config.evidencePath,
            this.config.reportsPath,
            path.join(this.config.evidencePath, 'chain-of-custody'),
            path.join(this.config.reportsPath, 'post-incident')
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
            }
        }
    }
    
    /**
     * Handle security incident
     */
    async handleIncident(incidentData) {
        const incident = this.createIncident(incidentData);
        
        console.log(`🚨 SECURITY INCIDENT: ${incident.id} - ${incident.type} (Severity: ${incident.severity})`);
        
        try {
            // Store incident
            this.activeIncidents.set(incident.id, incident);
            
            // Execute response playbook
            await this.executeResponsePlaybook(incident);
            
            // Notify stakeholders
            await this.notifyStakeholders(incident);
            
            // Start evidence collection
            await this.startEvidenceCollection(incident);
            
            // Update incident log
            await this.updateIncidentLog(incident, 'Incident response initiated');
            
            this.emit('incidentCreated', incident);
            
            return incident;
            
        } catch (error) {
            console.error(`❌ Failed to handle incident ${incident.id}:`, error);
            throw error;
        }
    }
    
    /**
     * Create incident record
     */
    createIncident(incidentData) {
        return {
            id: this.generateIncidentId(),
            type: incidentData.type || INCIDENT_TYPES.UNAUTHORIZED_ACCESS,
            severity: this.calculateIncidentSeverity(incidentData),
            status: INCIDENT_STATUS.DETECTED,
            title: incidentData.title || this.generateIncidentTitle(incidentData.type),
            description: incidentData.description || '',
            source: {
                ip: incidentData.source?.ip,
                userAgent: incidentData.source?.userAgent,
                geolocation: incidentData.source?.geolocation,
                system: incidentData.source?.system
            },
            detection: {
                timestamp: new Date().toISOString(),
                method: incidentData.detection?.method || 'automated',
                confidence: incidentData.detection?.confidence || 0.8,
                alertIds: incidentData.detection?.alertIds || []
            },
            timeline: [{
                timestamp: new Date().toISOString(),
                event: 'incident_detected',
                description: 'Security incident detected and logged',
                actor: 'system'
            }],
            assignee: {
                incidentCommander: null,
                responseTeam: []
            },
            containment: {
                status: 'pending',
                actions: [],
                timestamp: null
            },
            mitigation: {
                status: 'pending',
                actions: [],
                timestamp: null
            },
            evidence: {
                collected: [],
                chainOfCustody: []
            },
            communications: {
                internal: [],
                external: [],
                regulatory: []
            },
            metrics: {
                detectionTime: null,
                responseTime: null,
                containmentTime: null,
                resolutionTime: null,
                businessImpact: incidentData.businessImpact || 'unknown'
            },
            metadata: incidentData.metadata || {}
        };
    }
    
    /**
     * Execute response playbook for incident type
     */
    async executeResponsePlaybook(incident) {
        const playbook = this.playbooks.get(incident.type);
        
        if (!playbook) {
            console.warn(`No playbook found for incident type: ${incident.type}`);
            return;
        }
        
        console.log(`📋 Executing ${incident.type} response playbook...`);
        
        try {
            // Execute playbook phases
            for (const phase of playbook.phases) {
                await this.executePlaybookPhase(incident, phase);
            }
            
        } catch (error) {
            console.error(`❌ Playbook execution failed for incident ${incident.id}:`, error);
            await this.updateIncidentLog(incident, `Playbook execution failed: ${error.message}`);
        }
    }
    
    /**
     * Execute a single playbook phase
     */
    async executePlaybookPhase(incident, phase) {
        console.log(`   📌 Executing phase: ${phase.name}`);
        
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            event: `phase_started`,
            description: `Started ${phase.name} phase`,
            actor: 'system'
        });
        
        // Execute phase actions
        for (const action of phase.actions) {
            try {
                await this.executePlaybookAction(incident, action);
            } catch (error) {
                console.error(`❌ Action failed: ${action.name} - ${error.message}`);
                incident.timeline.push({
                    timestamp: new Date().toISOString(),
                    event: `action_failed`,
                    description: `Action failed: ${action.name} - ${error.message}`,
                    actor: 'system'
                });
            }
        }
        
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            event: `phase_completed`,
            description: `Completed ${phase.name} phase`,
            actor: 'system'
        });
    }
    
    /**
     * Execute a specific playbook action
     */
    async executePlaybookAction(incident, action) {
        switch (action.type) {
            case 'containment':
                await this.executeContainmentAction(incident, action);
                break;
            case 'investigation':
                await this.executeInvestigationAction(incident, action);
                break;
            case 'mitigation':
                await this.executeMitigationAction(incident, action);
                break;
            case 'communication':
                await this.executeCommunicationAction(incident, action);
                break;
            case 'evidence_collection':
                await this.executeEvidenceCollectionAction(incident, action);
                break;
            case 'system_action':
                await this.executeSystemAction(incident, action);
                break;
            default:
                console.warn(`Unknown action type: ${action.type}`);
        }
    }
    
    /**
     * Execute containment action
     */
    async executeContainmentAction(incident, action) {
        console.log(`   🔒 Executing containment: ${action.name}`);
        
        switch (action.action) {
            case 'block_ip':
                if (incident.source?.ip) {
                    await this.blockIP(incident.source.ip, action.duration || '24h');
                    incident.containment.actions.push({
                        type: 'ip_blocked',
                        target: incident.source.ip,
                        timestamp: new Date().toISOString()
                    });
                }
                break;
                
            case 'disable_user':
                if (action.userId) {
                    await this.disableUser(action.userId);
                    incident.containment.actions.push({
                        type: 'user_disabled',
                        target: action.userId,
                        timestamp: new Date().toISOString()
                    });
                }
                break;
                
            case 'isolate_system':
                if (action.systemId) {
                    await this.isolateSystem(action.systemId);
                    incident.containment.actions.push({
                        type: 'system_isolated',
                        target: action.systemId,
                        timestamp: new Date().toISOString()
                    });
                }
                break;
                
            case 'rotate_credentials':
                await this.rotateCredentials(action.credentials || []);
                incident.containment.actions.push({
                    type: 'credentials_rotated',
                    timestamp: new Date().toISOString()
                });
                break;
        }
        
        if (incident.containment.status === 'pending') {
            incident.containment.status = 'active';
            incident.containment.timestamp = new Date().toISOString();
            incident.status = INCIDENT_STATUS.CONTAINED;
        }
    }
    
    /**
     * Execute investigation action
     */
    async executeInvestigationAction(incident, action) {
        console.log(`   🔍 Executing investigation: ${action.name}`);
        
        incident.status = INCIDENT_STATUS.INVESTIGATING;
        
        switch (action.action) {
            case 'collect_logs':
                await this.collectSystemLogs(incident, action.sources || []);
                break;
                
            case 'analyze_traffic':
                await this.analyzeNetworkTraffic(incident, action.timeframe || '1h');
                break;
                
            case 'check_integrity':
                await this.checkSystemIntegrity(incident, action.systems || []);
                break;
                
            case 'scan_malware':
                await this.scanForMalware(incident, action.targets || []);
                break;
        }
    }
    
    /**
     * Execute mitigation action
     */
    async executeMitigationAction(incident, action) {
        console.log(`   🛡️ Executing mitigation: ${action.name}`);
        
        switch (action.action) {
            case 'patch_vulnerability':
                await this.patchVulnerability(action.vulnerability);
                break;
                
            case 'update_rules':
                await this.updateSecurityRules(action.rules || []);
                break;
                
            case 'restore_backup':
                await this.restoreFromBackup(action.backupId, action.target);
                break;
                
            case 'rebuild_system':
                await this.rebuildSystem(action.systemId);
                break;
        }
        
        incident.mitigation.actions.push({
            type: action.action,
            details: action,
            timestamp: new Date().toISOString()
        });
        
        incident.mitigation.status = 'active';
        incident.mitigation.timestamp = new Date().toISOString();
        incident.status = INCIDENT_STATUS.MITIGATED;
    }
    
    /**
     * Start evidence collection
     */
    async startEvidenceCollection(incident) {
        console.log(`🔬 Starting evidence collection for incident ${incident.id}`);
        
        const evidenceId = crypto.randomBytes(8).toString('hex');
        const evidencePackage = {
            id: evidenceId,
            incidentId: incident.id,
            collectionStart: new Date().toISOString(),
            collector: 'automated_system',
            items: [],
            chainOfCustody: [{
                timestamp: new Date().toISOString(),
                action: 'collection_started',
                actor: 'automated_system',
                description: 'Evidence collection initiated'
            }],
            integrity: {
                hash: null,
                algorithm: 'sha256'
            }
        };
        
        // Collect different types of evidence
        await this.collectNetworkEvidence(evidencePackage);
        await this.collectSystemEvidence(evidencePackage);
        await this.collectLogEvidence(evidencePackage);
        await this.collectFileSystemEvidence(evidencePackage);
        
        // Calculate integrity hash
        evidencePackage.integrity.hash = this.calculateEvidenceHash(evidencePackage);
        
        // Store evidence
        this.evidenceChain.set(evidenceId, evidencePackage);
        incident.evidence.collected.push(evidenceId);
        
        // Save to disk
        await this.saveEvidencePackage(evidencePackage);
        
        console.log(`✅ Evidence collection completed: ${evidenceId}`);
        
        return evidencePackage;
    }
    
    /**
     * Collect network evidence
     */
    async collectNetworkEvidence(evidencePackage) {
        const networkEvidence = {
            type: 'network',
            timestamp: new Date().toISOString(),
            data: {
                activeConnections: await this.getActiveConnections(),
                networkInterfaces: await this.getNetworkInterfaces(),
                routingTable: await this.getRoutingTable(),
                arpTable: await this.getARPTable(),
                dnsCache: await this.getDNSCache()
            }
        };
        
        evidencePackage.items.push(networkEvidence);
    }
    
    /**
     * Collect system evidence
     */
    async collectSystemEvidence(evidencePackage) {
        const systemEvidence = {
            type: 'system',
            timestamp: new Date().toISOString(),
            data: {
                processes: await this.getRunningProcesses(),
                services: await this.getSystemServices(),
                users: await this.getSystemUsers(),
                environmentVariables: await this.getEnvironmentVariables(),
                systemInfo: await this.getSystemInfo()
            }
        };
        
        evidencePackage.items.push(systemEvidence);
    }
    
    /**
     * Notify stakeholders about incident
     */
    async notifyStakeholders(incident) {
        const notifications = this.determineNotifications(incident);
        
        for (const notification of notifications) {
            try {
                await this.sendNotification(incident, notification);
                
                incident.communications.internal.push({
                    timestamp: new Date().toISOString(),
                    channel: notification.channel,
                    recipients: notification.recipients,
                    message: notification.message,
                    status: 'sent'
                });
                
            } catch (error) {
                console.error(`❌ Failed to send notification via ${notification.channel}:`, error);
                
                incident.communications.internal.push({
                    timestamp: new Date().toISOString(),
                    channel: notification.channel,
                    recipients: notification.recipients,
                    message: notification.message,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }
    
    /**
     * Determine required notifications based on incident
     */
    determineNotifications(incident) {
        const notifications = [];
        const escalationRules = this.config.escalationMatrix[incident.severity];
        
        if (!escalationRules) return notifications;
        
        // Internal notifications
        if (escalationRules.internal) {
            notifications.push({
                channel: 'email',
                recipients: escalationRules.internal.emails || [],
                message: this.generateIncidentNotification(incident, 'internal'),
                priority: 'high'
            });
            
            if (escalationRules.internal.slack) {
                notifications.push({
                    channel: 'slack',
                    recipients: escalationRules.internal.slack.channels || [],
                    message: this.generateIncidentNotification(incident, 'slack'),
                    priority: 'high'
                });
            }
        }
        
        // Executive notifications for high severity
        if (incident.severity >= INCIDENT_SEVERITY.HIGH && escalationRules.executive) {
            notifications.push({
                channel: 'sms',
                recipients: escalationRules.executive.phones || [],
                message: this.generateIncidentNotification(incident, 'sms'),
                priority: 'critical'
            });
        }
        
        // Regulatory notifications for data breaches
        if (incident.type === INCIDENT_TYPES.DATA_BREACH && escalationRules.regulatory) {
            notifications.push({
                channel: 'email',
                recipients: escalationRules.regulatory.contacts || [],
                message: this.generateIncidentNotification(incident, 'regulatory'),
                priority: 'regulatory'
            });
        }
        
        return notifications;
    }
    
    /**
     * Generate incident notification message
     */
    generateIncidentNotification(incident, type) {
        const messages = {
            internal: `🚨 SECURITY INCIDENT ALERT
            
Incident ID: ${incident.id}
Type: ${incident.type.replace(/_/g, ' ').toUpperCase()}
Severity: ${this.getSeverityText(incident.severity)}
Status: ${incident.status.toUpperCase()}
Detection Time: ${incident.detection.timestamp}

Description: ${incident.description}

Source: ${incident.source?.ip || 'Unknown'}
System: ${incident.source?.system || 'Unknown'}

Immediate actions have been initiated. Response team has been notified.

This is an automated alert from the Security Incident Response System.`,

            slack: `🚨 *Security Incident Alert* 

*ID:* ${incident.id}
*Type:* ${incident.type.replace(/_/g, ' ').toUpperCase()}
*Severity:* ${this.getSeverityText(incident.severity)}
*Status:* ${incident.status.toUpperCase()}
*Time:* ${new Date(incident.detection.timestamp).toLocaleString()}

*Description:* ${incident.description}

Response procedures are being executed automatically.`,

            sms: `SECURITY INCIDENT: ${incident.id} - ${incident.type.toUpperCase()} (${this.getSeverityText(incident.severity)}) detected at ${new Date(incident.detection.timestamp).toLocaleString()}. Response initiated. Check security dashboard for details.`,

            regulatory: `Regulatory Notification - Security Incident

We are writing to inform you of a security incident that may have regulatory implications.

Incident Details:
- ID: ${incident.id}
- Type: ${incident.type.replace(/_/g, ' ').toUpperCase()}
- Detection Time: ${incident.detection.timestamp}
- Current Status: ${incident.status.toUpperCase()}

Our incident response team has been activated and is following established procedures. We will provide updates as our investigation progresses.

This notification is being sent in accordance with regulatory requirements and our incident response procedures.`
        };
        
        return messages[type] || messages.internal;
    }
    
    /**
     * Load response playbooks
     */
    async loadPlaybooks() {
        // Load default playbooks
        this.loadDefaultPlaybooks();
        
        // Try to load custom playbooks from disk
        try {
            const files = await fs.readdir(this.config.playbooksPath);
            const playbookFiles = files.filter(f => f.endsWith('.json'));
            
            for (const file of playbookFiles) {
                try {
                    const filepath = path.join(this.config.playbooksPath, file);
                    const data = await fs.readFile(filepath, 'utf8');
                    const playbook = JSON.parse(data);
                    
                    this.playbooks.set(playbook.type, playbook);
                } catch (error) {
                    console.warn(`Failed to load playbook ${file}:`, error);
                }
            }
        } catch (error) {
            // Playbooks directory doesn't exist or is empty
        }
        
        console.log(`📋 Loaded ${this.playbooks.size} incident response playbooks`);
    }
    
    /**
     * Load default incident response playbooks
     */
    loadDefaultPlaybooks() {
        // Data breach playbook
        this.playbooks.set(INCIDENT_TYPES.DATA_BREACH, {
            type: INCIDENT_TYPES.DATA_BREACH,
            name: 'Data Breach Response',
            phases: [
                {
                    name: 'Immediate Response',
                    actions: [
                        {
                            type: 'containment',
                            name: 'Block suspected source',
                            action: 'block_ip',
                            duration: '24h'
                        },
                        {
                            type: 'investigation',
                            name: 'Collect initial evidence',
                            action: 'collect_logs',
                            sources: ['web', 'database', 'auth']
                        }
                    ]
                },
                {
                    name: 'Investigation',
                    actions: [
                        {
                            type: 'investigation',
                            name: 'Analyze access patterns',
                            action: 'analyze_traffic',
                            timeframe: '24h'
                        },
                        {
                            type: 'investigation',
                            name: 'Check data integrity',
                            action: 'check_integrity',
                            systems: ['database']
                        }
                    ]
                },
                {
                    name: 'Mitigation',
                    actions: [
                        {
                            type: 'containment',
                            name: 'Rotate credentials',
                            action: 'rotate_credentials',
                            credentials: ['api_keys', 'database_passwords']
                        },
                        {
                            type: 'communication',
                            name: 'Notify regulatory authorities',
                            recipients: ['regulatory'],
                            template: 'data_breach_notification'
                        }
                    ]
                }
            ]
        });
        
        // Unauthorized access playbook
        this.playbooks.set(INCIDENT_TYPES.UNAUTHORIZED_ACCESS, {
            type: INCIDENT_TYPES.UNAUTHORIZED_ACCESS,
            name: 'Unauthorized Access Response',
            phases: [
                {
                    name: 'Containment',
                    actions: [
                        {
                            type: 'containment',
                            name: 'Block source IP',
                            action: 'block_ip'
                        },
                        {
                            type: 'containment',
                            name: 'Disable compromised user',
                            action: 'disable_user'
                        }
                    ]
                },
                {
                    name: 'Investigation',
                    actions: [
                        {
                            type: 'evidence_collection',
                            name: 'Collect authentication logs',
                            sources: ['auth_logs', 'access_logs']
                        }
                    ]
                }
            ]
        });
        
        // Add more playbooks...
    }
    
    /**
     * Initialize response team
     */
    async initializeResponseTeam() {
        // Load response team configuration
        this.responseTeam.set(RESPONSE_ROLES.INCIDENT_COMMANDER, {
            name: 'Security Team Lead',
            email: 'security-lead@company.com',
            phone: '+1-555-0100',
            escalation: true
        });
        
        this.responseTeam.set(RESPONSE_ROLES.SECURITY_ANALYST, {
            name: 'Security Analyst',
            email: 'security-analyst@company.com',
            phone: '+1-555-0101',
            escalation: false
        });
        
        // Add more team members...
    }
    
    /**
     * Default escalation matrix
     */
    getDefaultEscalationMatrix() {
        return {
            [INCIDENT_SEVERITY.LOW]: {
                internal: {
                    emails: ['security-team@company.com']
                }
            },
            [INCIDENT_SEVERITY.MEDIUM]: {
                internal: {
                    emails: ['security-team@company.com', 'it-team@company.com'],
                    slack: {
                        channels: ['#security-alerts']
                    }
                }
            },
            [INCIDENT_SEVERITY.HIGH]: {
                internal: {
                    emails: ['security-team@company.com', 'management@company.com'],
                    slack: {
                        channels: ['#security-alerts', '#management']
                    }
                },
                executive: {
                    phones: ['+1-555-0200']
                }
            },
            [INCIDENT_SEVERITY.CRITICAL]: {
                internal: {
                    emails: ['security-team@company.com', 'management@company.com', 'legal@company.com'],
                    slack: {
                        channels: ['#security-alerts', '#management', '#crisis-response']
                    }
                },
                executive: {
                    phones: ['+1-555-0200', '+1-555-0201']
                },
                regulatory: {
                    contacts: ['privacy-officer@company.com']
                }
            }
        };
    }
    
    /**
     * Utility methods
     */
    
    generateIncidentId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        return `INC-${timestamp}-${random}`.toUpperCase();
    }
    
    calculateIncidentSeverity(incidentData) {
        let severity = INCIDENT_SEVERITY.LOW;
        
        // Base severity on incident type
        const typeSeverity = {
            [INCIDENT_TYPES.DATA_BREACH]: INCIDENT_SEVERITY.CRITICAL,
            [INCIDENT_TYPES.SYSTEM_COMPROMISE]: INCIDENT_SEVERITY.HIGH,
            [INCIDENT_TYPES.UNAUTHORIZED_ACCESS]: INCIDENT_SEVERITY.MEDIUM,
            [INCIDENT_TYPES.DENIAL_OF_SERVICE]: INCIDENT_SEVERITY.HIGH,
            [INCIDENT_TYPES.MALWARE_INFECTION]: INCIDENT_SEVERITY.HIGH
        };
        
        severity = typeSeverity[incidentData.type] || INCIDENT_SEVERITY.MEDIUM;
        
        // Adjust based on business impact
        if (incidentData.businessImpact === 'critical') {
            severity = Math.min(severity + 1, INCIDENT_SEVERITY.CATASTROPHIC);
        } else if (incidentData.businessImpact === 'high') {
            severity = Math.min(severity + 0.5, INCIDENT_SEVERITY.CATASTROPHIC);
        }
        
        // Adjust based on affected systems
        if (incidentData.affectedSystems?.includes('production')) {
            severity = Math.min(severity + 1, INCIDENT_SEVERITY.CATASTROPHIC);
        }
        
        return Math.round(severity);
    }
    
    generateIncidentTitle(type) {
        const titles = {
            [INCIDENT_TYPES.DATA_BREACH]: 'Potential Data Breach Detected',
            [INCIDENT_TYPES.UNAUTHORIZED_ACCESS]: 'Unauthorized Access Attempt',
            [INCIDENT_TYPES.SYSTEM_COMPROMISE]: 'System Compromise Detected',
            [INCIDENT_TYPES.DENIAL_OF_SERVICE]: 'Denial of Service Attack',
            [INCIDENT_TYPES.MALWARE_INFECTION]: 'Malware Infection Detected'
        };
        
        return titles[type] || 'Security Incident Detected';
    }
    
    getSeverityText(severity) {
        const texts = {
            [INCIDENT_SEVERITY.LOW]: 'LOW',
            [INCIDENT_SEVERITY.MEDIUM]: 'MEDIUM',
            [INCIDENT_SEVERITY.HIGH]: 'HIGH',
            [INCIDENT_SEVERITY.CRITICAL]: 'CRITICAL',
            [INCIDENT_SEVERITY.CATASTROPHIC]: 'CATASTROPHIC'
        };
        return texts[severity] || 'UNKNOWN';
    }
    
    async updateIncidentLog(incident, message) {
        incident.timeline.push({
            timestamp: new Date().toISOString(),
            event: 'log_entry',
            description: message,
            actor: 'system'
        });
        
        // Save incident to disk
        await this.saveIncident(incident);
    }
    
    async saveIncident(incident) {
        const filename = `incident-${incident.id}.json`;
        const filepath = path.join(this.config.reportsPath, filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(incident, null, 2));
        } catch (error) {
            console.error(`Failed to save incident ${incident.id}:`, error);
        }
    }
    
    // Placeholder implementations for security actions
    async blockIP(ip, duration) { console.log(`🚫 Blocking IP: ${ip} for ${duration}`); }
    async disableUser(userId) { console.log(`👤 Disabling user: ${userId}`); }
    async isolateSystem(systemId) { console.log(`🔒 Isolating system: ${systemId}`); }
    async rotateCredentials(credentials) { console.log(`🔄 Rotating credentials: ${credentials.join(', ')}`); }
    async collectSystemLogs(incident, sources) { console.log(`📋 Collecting logs from: ${sources.join(', ')}`); }
    async analyzeNetworkTraffic(incident, timeframe) { console.log(`🌐 Analyzing network traffic for ${timeframe}`); }
    async checkSystemIntegrity(incident, systems) { console.log(`✅ Checking integrity of: ${systems.join(', ')}`); }
    async scanForMalware(incident, targets) { console.log(`🦠 Scanning for malware on: ${targets.join(', ')}`); }
    async patchVulnerability(vulnerability) { console.log(`🔧 Patching vulnerability: ${vulnerability}`); }
    async updateSecurityRules(rules) { console.log(`📝 Updating security rules: ${rules.length} rules`); }
    async restoreFromBackup(backupId, target) { console.log(`💾 Restoring ${target} from backup ${backupId}`); }
    async rebuildSystem(systemId) { console.log(`🏗️ Rebuilding system: ${systemId}`); }
    async sendNotification(incident, notification) { console.log(`📧 Sending ${notification.channel} notification for incident ${incident.id}`); }
    
    // Evidence collection placeholders
    async getActiveConnections() { return []; }
    async getNetworkInterfaces() { return []; }
    async getRoutingTable() { return []; }
    async getARPTable() { return []; }
    async getDNSCache() { return []; }
    async getRunningProcesses() { return []; }
    async getSystemServices() { return []; }
    async getSystemUsers() { return []; }
    async getEnvironmentVariables() { return {}; }
    async getSystemInfo() { return {}; }
    
    async collectLogEvidence(evidencePackage) {
        // Collect system and application logs
        const logEvidence = {
            type: 'logs',
            timestamp: new Date().toISOString(),
            data: {
                systemLogs: [],
                applicationLogs: [],
                securityLogs: []
            }
        };
        evidencePackage.items.push(logEvidence);
    }
    
    async collectFileSystemEvidence(evidencePackage) {
        // Collect file system metadata
        const fsEvidence = {
            type: 'filesystem',
            timestamp: new Date().toISOString(),
            data: {
                recentFiles: [],
                permissions: [],
                metadata: []
            }
        };
        evidencePackage.items.push(fsEvidence);
    }
    
    calculateEvidenceHash(evidencePackage) {
        const content = JSON.stringify(evidencePackage.items);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    async saveEvidencePackage(evidencePackage) {
        const filename = `evidence-${evidencePackage.id}.json`;
        const filepath = path.join(this.config.evidencePath, filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(evidencePackage, null, 2));
        } catch (error) {
            console.error(`Failed to save evidence package ${evidencePackage.id}:`, error);
        }
    }
}

module.exports = {
    IncidentResponsePlaybook,
    INCIDENT_TYPES,
    INCIDENT_SEVERITY,
    INCIDENT_STATUS,
    RESPONSE_ROLES
};