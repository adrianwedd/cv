/**
 * Enterprise Secrets Management System
 * 
 * Features:
 * - Secure secret storage and retrieval
 * - Secret rotation automation
 * - Access control and auditing
 * - Encryption at rest and in transit
 * - Integration with environment variables
 * - Compliance with security standards
 * - Secret lifecycle management
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Secret Types
 */
const SECRET_TYPES = {
    API_KEY: 'api_key',
    DATABASE_PASSWORD: 'database_password',
    JWT_SECRET: 'jwt_secret',
    OAUTH_TOKEN: 'oauth_token',
    SESSION_KEY: 'session_key',
    ENCRYPTION_KEY: 'encryption_key',
    WEBHOOK_SECRET: 'webhook_secret',
    CERTIFICATE: 'certificate',
    PRIVATE_KEY: 'private_key'
};

/**
 * Secret Sensitivity Levels
 */
const SENSITIVITY_LEVELS = {
    LOW: 1,      // Non-critical API keys
    MEDIUM: 2,   // Database passwords
    HIGH: 3,     // JWT secrets, OAuth tokens
    CRITICAL: 4  // Encryption keys, certificates
};

class SecretsManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            secretsPath: path.join(process.cwd(), 'data', 'secrets'),
            keyDerivationIterations: 100000,
            encryptionAlgorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 16,
            tagLength: 16,
            rotationIntervals: {
                [SECRET_TYPES.API_KEY]: 90 * 24 * 60 * 60 * 1000,        // 90 days
                [SECRET_TYPES.JWT_SECRET]: 30 * 24 * 60 * 60 * 1000,     // 30 days
                [SECRET_TYPES.OAUTH_TOKEN]: 7 * 24 * 60 * 60 * 1000,     // 7 days
                [SECRET_TYPES.SESSION_KEY]: 24 * 60 * 60 * 1000,         // 1 day
                [SECRET_TYPES.ENCRYPTION_KEY]: 365 * 24 * 60 * 60 * 1000 // 1 year
            },
            auditEnabled: true,
            backupEnabled: true,
            ...config
        };
        
        this.masterKey = null;
        this.secrets = new Map();
        this.auditLog = [];
        this.rotationSchedule = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize secrets manager
     */
    async initialize() {
        try {
            await this.createSecretsDirectory();
            await this.initializeMasterKey();
            await this.loadSecrets();
            await this.scheduleRotations();
            
            console.log('🔐 Secrets Manager initialized');
            
        } catch (error) {
            console.error('❌ Secrets Manager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Create secrets directory if it doesn't exist
     */
    async createSecretsDirectory() {
        try {
            await fs.mkdir(this.config.secretsPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }
    
    /**
     * Initialize or load master key
     */
    async initializeMasterKey() {
        const masterKeyEnv = process.env.MASTER_ENCRYPTION_KEY;
        
        if (masterKeyEnv) {
            // Use master key from environment
            this.masterKey = Buffer.from(masterKeyEnv, 'hex');
            
            if (this.masterKey.length !== this.config.keyLength) {
                throw new Error('Invalid master key length');
            }
        } else {
            // Generate new master key
            this.masterKey = crypto.randomBytes(this.config.keyLength);
            
            console.warn('⚠️  Generated new master key. Set MASTER_ENCRYPTION_KEY environment variable.');
            console.warn(`   MASTER_ENCRYPTION_KEY=${this.masterKey.toString('hex')}`);
        }
    }
    
    /**
     * Store a secret securely
     */
    async storeSecret(name, value, options = {}) {
        const secret = {
            name,
            type: options.type || SECRET_TYPES.API_KEY,
            sensitivity: options.sensitivity || SENSITIVITY_LEVELS.MEDIUM,
            value: this.encryptValue(value),
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1,
                description: options.description || '',
                tags: options.tags || [],
                rotateAfter: options.rotateAfter || this.config.rotationIntervals[options.type],
                lastRotated: new Date().toISOString(),
                accessCount: 0,
                lastAccessed: null
            }
        };
        
        // Validate secret
        this.validateSecret(secret);
        
        // Store in memory
        this.secrets.set(name, secret);
        
        // Persist to disk
        await this.persistSecret(secret);
        
        // Schedule rotation
        if (secret.metadata.rotateAfter) {
            this.scheduleRotation(name, secret.metadata.rotateAfter);
        }
        
        // Audit log
        await this.auditAction('SECRET_STORED', { name, type: secret.type, sensitivity: secret.sensitivity });
        
        this.emit('secretStored', { name, type: secret.type });
        
        return {
            name: secret.name,
            type: secret.type,
            stored: true,
            version: secret.metadata.version
        };
    }
    
    /**
     * Retrieve a secret
     */
    async getSecret(name, options = {}) {
        const secret = this.secrets.get(name);
        
        if (!secret) {
            await this.auditAction('SECRET_NOT_FOUND', { name });
            throw new Error(`Secret '${name}' not found`);
        }
        
        // Check access permissions
        if (options.requiredSensitivity && secret.sensitivity > options.requiredSensitivity) {
            await this.auditAction('SECRET_ACCESS_DENIED', { name, reason: 'insufficient_permissions' });
            throw new Error('Insufficient permissions to access this secret');
        }
        
        // Update access tracking
        secret.metadata.accessCount++;
        secret.metadata.lastAccessed = new Date().toISOString();
        
        // Decrypt value
        const decryptedValue = this.decryptValue(secret.value);
        
        // Audit log
        await this.auditAction('SECRET_ACCESSED', { 
            name, 
            type: secret.type,
            accessCount: secret.metadata.accessCount 
        });
        
        this.emit('secretAccessed', { name, type: secret.type });
        
        return {
            name: secret.name,
            type: secret.type,
            value: decryptedValue,
            metadata: {
                createdAt: secret.metadata.createdAt,
                version: secret.metadata.version,
                description: secret.metadata.description,
                tags: secret.metadata.tags
            }
        };
    }
    
    /**
     * Update a secret (creates new version)
     */
    async updateSecret(name, newValue, options = {}) {
        const existingSecret = this.secrets.get(name);
        
        if (!existingSecret) {
            throw new Error(`Secret '${name}' not found`);
        }
        
        // Create updated secret
        const updatedSecret = {
            ...existingSecret,
            value: this.encryptValue(newValue),
            metadata: {
                ...existingSecret.metadata,
                updatedAt: new Date().toISOString(),
                version: existingSecret.metadata.version + 1,
                lastRotated: new Date().toISOString(),
                description: options.description || existingSecret.metadata.description
            }
        };
        
        // Store in memory
        this.secrets.set(name, updatedSecret);
        
        // Persist to disk
        await this.persistSecret(updatedSecret);
        
        // Audit log
        await this.auditAction('SECRET_UPDATED', { 
            name, 
            version: updatedSecret.metadata.version,
            previousVersion: existingSecret.metadata.version 
        });
        
        this.emit('secretUpdated', { name, version: updatedSecret.metadata.version });
        
        return {
            name: updatedSecret.name,
            updated: true,
            version: updatedSecret.metadata.version
        };
    }
    
    /**
     * Delete a secret
     */
    async deleteSecret(name, options = {}) {
        const secret = this.secrets.get(name);
        
        if (!secret) {
            throw new Error(`Secret '${name}' not found`);
        }
        
        // Remove from memory
        this.secrets.delete(name);
        
        // Remove rotation schedule
        if (this.rotationSchedule.has(name)) {
            clearTimeout(this.rotationSchedule.get(name));
            this.rotationSchedule.delete(name);
        }
        
        // Remove from disk (if not keeping backup)
        if (!options.keepBackup) {
            try {
                const secretFile = path.join(this.config.secretsPath, `${name}.encrypted`);
                await fs.unlink(secretFile);
            } catch (error) {
                console.warn(`Failed to delete secret file: ${error.message}`);
            }
        }
        
        // Audit log
        await this.auditAction('SECRET_DELETED', { name, type: secret.type });
        
        this.emit('secretDeleted', { name, type: secret.type });
        
        return { name, deleted: true };
    }
    
    /**
     * Rotate a secret (generate new value)
     */
    async rotateSecret(name, options = {}) {
        const secret = this.secrets.get(name);
        
        if (!secret) {
            throw new Error(`Secret '${name}' not found`);
        }
        
        let newValue;
        
        if (options.newValue) {
            newValue = options.newValue;
        } else {
            // Generate new value based on secret type
            newValue = this.generateSecretValue(secret.type, options);
        }
        
        await this.updateSecret(name, newValue, {
            description: `Rotated on ${new Date().toISOString()}`
        });
        
        // Reschedule next rotation
        if (secret.metadata.rotateAfter) {
            this.scheduleRotation(name, secret.metadata.rotateAfter);
        }
        
        // Audit log
        await this.auditAction('SECRET_ROTATED', { name, type: secret.type });
        
        this.emit('secretRotated', { name, type: secret.type });
        
        return { name, rotated: true, newValue: newValue.substring(0, 8) + '...' };
    }
    
    /**
     * Generate secret value based on type
     */
    generateSecretValue(type, options = {}) {
        switch (type) {
            case SECRET_TYPES.API_KEY:
                return this.generateAPIKey(options.length || 32);
                
            case SECRET_TYPES.JWT_SECRET:
                return crypto.randomBytes(64).toString('hex');
                
            case SECRET_TYPES.DATABASE_PASSWORD:
                return this.generatePassword(options.length || 24, true);
                
            case SECRET_TYPES.ENCRYPTION_KEY:
                return crypto.randomBytes(32).toString('hex');
                
            case SECRET_TYPES.WEBHOOK_SECRET:
                return crypto.randomBytes(32).toString('base64url');
                
            default:
                return crypto.randomBytes(32).toString('hex');
        }
    }
    
    /**
     * Generate API key
     */
    generateAPIKey(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(crypto.randomInt(0, chars.length));
        }
        
        return result;
    }
    
    /**
     * Generate secure password
     */
    generatePassword(length = 24, includeSymbols = true) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let chars = lowercase + uppercase + numbers;
        if (includeSymbols) chars += symbols;
        
        let result = '';
        
        // Ensure at least one character from each category
        result += lowercase[crypto.randomInt(0, lowercase.length)];
        result += uppercase[crypto.randomInt(0, uppercase.length)];
        result += numbers[crypto.randomInt(0, numbers.length)];
        if (includeSymbols) result += symbols[crypto.randomInt(0, symbols.length)];
        
        // Fill the rest randomly
        for (let i = result.length; i < length; i++) {
            result += chars[crypto.randomInt(0, chars.length)];
        }
        
        // Shuffle the result
        return result.split('').sort(() => crypto.randomInt(-1, 2)).join('');
    }
    
    /**
     * Encrypt secret value
     */
    encryptValue(value) {
        const iv = crypto.randomBytes(this.config.ivLength);
        const cipher = crypto.createCipher(this.config.encryptionAlgorithm, this.masterKey);
        cipher.setAAD(iv);
        
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            algorithm: this.config.encryptionAlgorithm
        };
    }
    
    /**
     * Decrypt secret value
     */
    decryptValue(encryptedData) {
        const decipher = crypto.createDecipher(
            encryptedData.algorithm,
            this.masterKey
        );
        
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const tag = Buffer.from(encryptedData.tag, 'hex');
        
        decipher.setAAD(iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    /**
     * Validate secret structure
     */
    validateSecret(secret) {
        if (!secret.name || typeof secret.name !== 'string') {
            throw new Error('Secret name is required and must be a string');
        }
        
        if (!Object.values(SECRET_TYPES).includes(secret.type)) {
            throw new Error(`Invalid secret type: ${secret.type}`);
        }
        
        if (!Object.values(SENSITIVITY_LEVELS).includes(secret.sensitivity)) {
            throw new Error(`Invalid sensitivity level: ${secret.sensitivity}`);
        }
        
        if (!secret.value || !secret.value.encrypted) {
            throw new Error('Secret value is required');
        }
    }
    
    /**
     * Persist secret to disk
     */
    async persistSecret(secret) {
        const filename = `${secret.name}.encrypted`;
        const filepath = path.join(this.config.secretsPath, filename);
        
        const secretData = {
            name: secret.name,
            type: secret.type,
            sensitivity: secret.sensitivity,
            value: secret.value,
            metadata: {
                ...secret.metadata,
                // Remove sensitive data from persisted metadata
                accessCount: undefined,
                lastAccessed: undefined
            }
        };
        
        try {
            await fs.writeFile(filepath, JSON.stringify(secretData, null, 2));
        } catch (error) {
            throw new Error(`Failed to persist secret: ${error.message}`);
        }
    }
    
    /**
     * Load secrets from disk
     */
    async loadSecrets() {
        try {
            const files = await fs.readdir(this.config.secretsPath);
            const secretFiles = files.filter(f => f.endsWith('.encrypted'));
            
            for (const file of secretFiles) {
                const filepath = path.join(this.config.secretsPath, file);
                const data = await fs.readFile(filepath, 'utf8');
                const secretData = JSON.parse(data);
                
                // Add runtime metadata
                secretData.metadata.accessCount = 0;
                secretData.metadata.lastAccessed = null;
                
                this.secrets.set(secretData.name, secretData);
            }
            
            console.log(`📁 Loaded ${secretFiles.length} secrets from disk`);
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Failed to load secrets:', error);
            }
        }
    }
    
    /**
     * Schedule secret rotation
     */
    scheduleRotation(name, interval) {
        // Clear existing schedule
        if (this.rotationSchedule.has(name)) {
            clearTimeout(this.rotationSchedule.get(name));
        }
        
        // Schedule new rotation
        const timeoutId = setTimeout(async () => {
            try {
                await this.rotateSecret(name);
                console.log(`🔄 Auto-rotated secret: ${name}`);
            } catch (error) {
                console.error(`Failed to auto-rotate secret ${name}:`, error);
                
                // Audit the failure
                await this.auditAction('SECRET_ROTATION_FAILED', {
                    name,
                    error: error.message
                });
            }
        }, interval);
        
        this.rotationSchedule.set(name, timeoutId);
    }
    
    /**
     * Schedule all rotations
     */
    async scheduleRotations() {
        for (const [name, secret] of this.secrets.entries()) {
            if (secret.metadata.rotateAfter) {
                const lastRotated = new Date(secret.metadata.lastRotated).getTime();
                const now = Date.now();
                const nextRotation = lastRotated + secret.metadata.rotateAfter;
                
                if (nextRotation > now) {
                    this.scheduleRotation(name, nextRotation - now);
                } else {
                    // Secret is overdue for rotation
                    console.warn(`⚠️ Secret '${name}' is overdue for rotation`);
                    this.scheduleRotation(name, 60000); // Rotate in 1 minute
                }
            }
        }
    }
    
    /**
     * Audit action
     */
    async auditAction(action, details = {}) {
        if (!this.config.auditEnabled) return;
        
        const auditEntry = {
            timestamp: new Date().toISOString(),
            action,
            details,
            source: 'secrets_manager'
        };
        
        this.auditLog.push(auditEntry);
        
        // Persist audit log
        try {
            const auditFile = path.join(this.config.secretsPath, 'audit.log');
            const logLine = JSON.stringify(auditEntry) + '\n';
            await fs.appendFile(auditFile, logLine);
        } catch (error) {
            console.error('Failed to write audit log:', error);
        }
        
        // Keep audit log size manageable
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-5000);
        }
    }
    
    /**
     * Get secret metadata (without values)
     */
    getSecretMetadata(name) {
        const secret = this.secrets.get(name);
        
        if (!secret) {
            return null;
        }
        
        return {
            name: secret.name,
            type: secret.type,
            sensitivity: secret.sensitivity,
            metadata: {
                createdAt: secret.metadata.createdAt,
                updatedAt: secret.metadata.updatedAt,
                version: secret.metadata.version,
                description: secret.metadata.description,
                tags: secret.metadata.tags,
                accessCount: secret.metadata.accessCount,
                lastAccessed: secret.metadata.lastAccessed,
                lastRotated: secret.metadata.lastRotated
            }
        };
    }
    
    /**
     * List all secrets (metadata only)
     */
    listSecrets(options = {}) {
        const secrets = Array.from(this.secrets.values());
        
        let filteredSecrets = secrets;
        
        // Filter by type
        if (options.type) {
            filteredSecrets = filteredSecrets.filter(s => s.type === options.type);
        }
        
        // Filter by sensitivity
        if (options.maxSensitivity) {
            filteredSecrets = filteredSecrets.filter(s => s.sensitivity <= options.maxSensitivity);
        }
        
        // Filter by tag
        if (options.tag) {
            filteredSecrets = filteredSecrets.filter(s => 
                s.metadata.tags && s.metadata.tags.includes(options.tag)
            );
        }
        
        return filteredSecrets.map(secret => ({
            name: secret.name,
            type: secret.type,
            sensitivity: secret.sensitivity,
            createdAt: secret.metadata.createdAt,
            lastAccessed: secret.metadata.lastAccessed,
            version: secret.metadata.version,
            description: secret.metadata.description
        }));
    }
    
    /**
     * Get audit log
     */
    getAuditLog(options = {}) {
        let log = this.auditLog;
        
        if (options.limit) {
            log = log.slice(-options.limit);
        }
        
        if (options.action) {
            log = log.filter(entry => entry.action === options.action);
        }
        
        if (options.since) {
            const since = new Date(options.since);
            log = log.filter(entry => new Date(entry.timestamp) >= since);
        }
        
        return log;
    }
    
    /**
     * Get system health status
     */
    getHealthStatus() {
        const now = Date.now();
        const overdueRotations = [];
        
        for (const [name, secret] of this.secrets.entries()) {
            if (secret.metadata.rotateAfter) {
                const lastRotated = new Date(secret.metadata.lastRotated).getTime();
                const nextRotation = lastRotated + secret.metadata.rotateAfter;
                
                if (now > nextRotation) {
                    overdueRotations.push({
                        name,
                        overdueDays: Math.floor((now - nextRotation) / (24 * 60 * 60 * 1000))
                    });
                }
            }
        }
        
        return {
            totalSecrets: this.secrets.size,
            scheduledRotations: this.rotationSchedule.size,
            overdueRotations: overdueRotations.length,
            overdueDetails: overdueRotations,
            auditLogSize: this.auditLog.length,
            masterKeyStatus: this.masterKey ? 'available' : 'missing',
            health: overdueRotations.length === 0 ? 'healthy' : 'warning'
        };
    }
}

module.exports = { SecretsManager, SECRET_TYPES, SENSITIVITY_LEVELS };