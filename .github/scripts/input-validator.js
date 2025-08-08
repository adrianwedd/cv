/**
 * Enterprise Input Validation & XSS Prevention System
 * 
 * Comprehensive security layer for all user inputs and data processing
 * - XSS prevention with HTML sanitization
 * - SQL injection prevention
 * - Command injection prevention
 * - JSON schema validation
 * - File upload security
 * - Path traversal prevention
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

/**
 * XSS Prevention Patterns
 */
const XSS_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi,
    /<form[\s\S]*?>[\s\S]*?<\/form>/gi,
    /on\w+\s*=\s*"[^"]*"/gi,
    /on\w+\s*=\s*'[^']*'/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /<meta[\s\S]*?http-equiv[\s\S]*?>/gi,
    /<link[\s\S]*?rel\s*=\s*["']?stylesheet["']?[\s\S]*?>/gi
];

/**
 * SQL Injection Patterns
 */
const SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)|(\b(UNION|OR|AND)\s+\b)/gi,
    /('|\\\\')|(;)|(--)|(\#)|(%27)|(%3B)|(%23)/gi,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR|ONCLICK)\b)/gi
];

/**
 * Command Injection Patterns
 */
const COMMAND_INJECTION_PATTERNS = [
    /(\||&|;|`|\$\(|\${)/g,
    /(wget|curl|nc|netcat|cat|chmod|chown|rm|mv|cp)/gi,
    /(exec|system|eval|require|import)/gi
];

class InputValidator {
    constructor() {
        this.schemas = new Map();
        this.validationCache = new Map();
        this.suspiciousAttempts = new Map();
        
        // Initialize default schemas
        this.initializeSchemas();
    }
    
    /**
     * Initialize validation schemas for different data types
     */
    initializeSchemas() {
        // CV Data Schema
        this.schemas.set('cvData', {
            type: 'object',
            required: ['metadata', 'personal_info'],
            properties: {
                metadata: {
                    type: 'object',
                    required: ['version', 'last_updated'],
                    properties: {
                        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
                        last_updated: { type: 'string', format: 'date-time' }
                    }
                },
                personal_info: {
                    type: 'object',
                    required: ['name', 'title'],
                    properties: {
                        name: { type: 'string', maxLength: 100, pattern: '^[a-zA-Z\\s\\-\\.]+$' },
                        title: { type: 'string', maxLength: 200 },
                        email: { type: 'string', format: 'email', maxLength: 254 },
                        location: { type: 'string', maxLength: 100 }
                    }
                }
            }
        });
        
        // Activity Data Schema
        this.schemas.set('activityData', {
            type: 'object',
            properties: {
                summary: {
                    type: 'object',
                    properties: {
                        total_commits: { type: 'integer', minimum: 0, maximum: 1000000 },
                        active_days: { type: 'integer', minimum: 0, maximum: 365 },
                        repositories_count: { type: 'integer', minimum: 0, maximum: 10000 }
                    }
                }
            }
        });
        
        // User Input Schema
        this.schemas.set('userInput', {
            type: 'object',
            properties: {
                content: { type: 'string', maxLength: 5000 },
                source: { type: 'string', maxLength: 100 },
                timestamp: { type: 'string', format: 'date-time' }
            }
        });
    }
    
    /**
     * Validate and sanitize input with comprehensive security checks
     */
    async validateInput(input, type = 'general', context = {}) {
        const startTime = Date.now();
        const inputId = this.generateInputId(input, type);
        
        // Check cache first
        if (this.validationCache.has(inputId)) {
            const cached = this.validationCache.get(inputId);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
                return cached.result;
            }
        }
        
        const result = {
            valid: true,
            sanitized: null,
            errors: [],
            warnings: [],
            securityLevel: 'safe',
            processingTime: 0,
            metadata: {
                inputLength: typeof input === 'string' ? input.length : JSON.stringify(input).length,
                validationType: type,
                timestamp: new Date().toISOString()
            }
        };
        
        try {
            // Step 1: Basic type and format validation
            const typeValidation = this.validateInputType(input, type);
            if (!typeValidation.valid) {
                result.valid = false;
                result.errors.push(...typeValidation.errors);
                return result;
            }
            
            // Step 2: XSS Prevention
            const xssValidation = this.preventXSS(input);
            if (xssValidation.risk > 0) {
                result.securityLevel = xssValidation.risk > 7 ? 'high-risk' : 'medium-risk';
                result.warnings.push(`XSS risk detected (level ${xssValidation.risk})`);
                
                if (xssValidation.risk > 8) {
                    result.valid = false;
                    result.errors.push('High-risk XSS patterns detected');
                    this.logSuspiciousActivity(context, 'XSS_ATTEMPT', input);
                    return result;
                }
            }
            
            // Step 3: SQL Injection Prevention
            const sqlValidation = this.preventSQLInjection(input);
            if (sqlValidation.risk > 0) {
                result.securityLevel = sqlValidation.risk > 5 ? 'high-risk' : 'medium-risk';
                result.warnings.push(`SQL injection risk detected (level ${sqlValidation.risk})`);
                
                if (sqlValidation.risk > 7) {
                    result.valid = false;
                    result.errors.push('SQL injection patterns detected');
                    this.logSuspiciousActivity(context, 'SQL_INJECTION_ATTEMPT', input);
                    return result;
                }
            }
            
            // Step 4: Command Injection Prevention
            const commandValidation = this.preventCommandInjection(input);
            if (commandValidation.risk > 0) {
                result.securityLevel = commandValidation.risk > 3 ? 'high-risk' : 'medium-risk';
                result.warnings.push(`Command injection risk detected (level ${commandValidation.risk})`);
                
                if (commandValidation.risk > 5) {
                    result.valid = false;
                    result.errors.push('Command injection patterns detected');
                    this.logSuspiciousActivity(context, 'COMMAND_INJECTION_ATTEMPT', input);
                    return result;
                }
            }
            
            // Step 5: Schema Validation
            const schemaValidation = this.validateSchema(input, type);
            if (!schemaValidation.valid) {
                result.valid = false;
                result.errors.push(...schemaValidation.errors);
            }
            
            // Step 6: Content Sanitization
            result.sanitized = this.sanitizeContent(input, type, {
                xssRisk: xssValidation.risk,
                sqlRisk: sqlValidation.risk,
                commandRisk: commandValidation.risk
            });
            
            // Step 7: Path Traversal Prevention (for file paths)
            if (type === 'filepath' && this.detectPathTraversal(input)) {
                result.valid = false;
                result.errors.push('Path traversal attempt detected');
                this.logSuspiciousActivity(context, 'PATH_TRAVERSAL_ATTEMPT', input);
                return result;
            }
            
        } catch (error) {
            result.valid = false;
            result.errors.push(`Validation error: ${error.message}`);
            result.securityLevel = 'error';
        }
        
        result.processingTime = Date.now() - startTime;
        
        // Cache the result
        this.validationCache.set(inputId, {
            result,
            timestamp: Date.now()
        });
        
        // Clean up cache if too large
        if (this.validationCache.size > 1000) {
            this.cleanupCache();
        }
        
        return result;
    }
    
    /**
     * Validate input type and basic format
     */
    validateInputType(input, type) {
        const result = { valid: true, errors: [] };
        
        switch (type) {
            case 'string':
                if (typeof input !== 'string') {
                    result.valid = false;
                    result.errors.push('Input must be a string');
                }
                break;
                
            case 'json':
                if (typeof input === 'string') {
                    try {
                        JSON.parse(input);
                    } catch (e) {
                        result.valid = false;
                        result.errors.push('Invalid JSON format');
                    }
                } else if (typeof input !== 'object') {
                    result.valid = false;
                    result.errors.push('Input must be valid JSON');
                }
                break;
                
            case 'filepath':
                if (typeof input !== 'string' || input.includes('\\0') || input.length > 260) {
                    result.valid = false;
                    result.errors.push('Invalid file path format');
                }
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (typeof input !== 'string' || !emailRegex.test(input)) {
                    result.valid = false;
                    result.errors.push('Invalid email format');
                }
                break;
                
            case 'url':
                try {
                    new URL(input);
                } catch (e) {
                    result.valid = false;
                    result.errors.push('Invalid URL format');
                }
                break;
        }
        
        return result;
    }
    
    /**
     * XSS Prevention with risk scoring
     */
    preventXSS(input) {
        let risk = 0;
        const detectedPatterns = [];
        const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
        
        XSS_PATTERNS.forEach((pattern, index) => {
            const matches = inputStr.match(pattern);
            if (matches) {
                risk += matches.length * (index < 3 ? 3 : index < 6 ? 2 : 1);
                detectedPatterns.push(pattern.source);
            }
        });
        
        // Additional checks for obfuscated XSS
        if (inputStr.includes('eval(') || inputStr.includes('Function(')) risk += 5;
        if (inputStr.includes('String.fromCharCode')) risk += 3;
        if (inputStr.includes('unescape') || inputStr.includes('decodeURI')) risk += 2;
        if (inputStr.match(/&#x[0-9a-f]+;/gi)) risk += 1;
        
        return { risk, patterns: detectedPatterns };
    }
    
    /**
     * SQL Injection Prevention with risk scoring
     */
    preventSQLInjection(input) {
        let risk = 0;
        const detectedPatterns = [];
        const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
        
        SQL_INJECTION_PATTERNS.forEach((pattern, index) => {
            const matches = inputStr.match(pattern);
            if (matches) {
                risk += matches.length * (index === 0 ? 4 : index === 1 ? 3 : 2);
                detectedPatterns.push(pattern.source);
            }
        });
        
        return { risk, patterns: detectedPatterns };
    }
    
    /**
     * Command Injection Prevention with risk scoring
     */
    preventCommandInjection(input) {
        let risk = 0;
        const detectedPatterns = [];
        const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
        
        COMMAND_INJECTION_PATTERNS.forEach((pattern, index) => {
            const matches = inputStr.match(pattern);
            if (matches) {
                risk += matches.length * (index === 0 ? 3 : 2);
                detectedPatterns.push(pattern.source);
            }
        });
        
        return { risk, patterns: detectedPatterns };
    }
    
    /**
     * Detect path traversal attempts
     */
    detectPathTraversal(filepath) {
        const dangerous = [
            '../', '..\\',
            '/./', '\\.\\',
            '/etc/', '\\etc\\',
            '/proc/', '\\proc\\',
            '/sys/', '\\sys\\',
            '/var/', '\\var\\',
            '/tmp/', '\\tmp\\',
            '~/', '~\\',
            '%2e%2e%2f', '%2e%2e%5c',
            '..%2f', '..%5c'
        ];
        
        const normalizedPath = path.normalize(filepath.toLowerCase());
        return dangerous.some(pattern => normalizedPath.includes(pattern.toLowerCase()));
    }
    
    /**
     * Validate against JSON schema
     */
    validateSchema(input, type) {
        const result = { valid: true, errors: [] };
        
        if (!this.schemas.has(type)) {
            return result; // No schema defined, skip validation
        }
        
        const schema = this.schemas.get(type);
        
        try {
            // Simple schema validation (in production, use a library like ajv)
            const validation = this.simpleSchemaValidation(input, schema);
            result.valid = validation.valid;
            result.errors = validation.errors;
        } catch (error) {
            result.valid = false;
            result.errors.push(`Schema validation error: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Simple schema validation (replace with ajv in production)
     */
    simpleSchemaValidation(data, schema) {
        const errors = [];
        
        if (schema.type === 'object' && typeof data !== 'object') {
            errors.push('Expected object type');
            return { valid: false, errors };
        }
        
        if (schema.required) {
            schema.required.forEach(field => {
                if (!data.hasOwnProperty(field)) {
                    errors.push(`Missing required field: ${field}`);
                }
            });
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    /**
     * Sanitize content based on risk assessment
     */
    sanitizeContent(input, type, risks = {}) {
        if (typeof input !== 'string') {
            return input; // Only sanitize strings
        }
        
        let sanitized = input;
        
        // HTML entity encoding for high XSS risk
        if (risks.xssRisk > 5) {
            sanitized = sanitized
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }
        
        // Remove SQL keywords for high SQL risk
        if (risks.sqlRisk > 5) {
            sanitized = sanitized.replace(/(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)/gi, '[FILTERED]');
        }
        
        // Remove command injection patterns
        if (risks.commandRisk > 3) {
            sanitized = sanitized.replace(/[|&;`$()]/g, '');
        }
        
        // Normalize whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        
        // Limit length
        if (sanitized.length > 10000) {
            sanitized = sanitized.substring(0, 10000) + '...[TRUNCATED]';
        }
        
        return sanitized;
    }
    
    /**
     * Log suspicious activity for security monitoring
     */
    logSuspiciousActivity(context, type, input) {
        const identifier = context.ip || context.userId || 'unknown';
        
        if (!this.suspiciousAttempts.has(identifier)) {
            this.suspiciousAttempts.set(identifier, []);
        }
        
        const attempts = this.suspiciousAttempts.get(identifier);
        attempts.push({
            type,
            input: input.length > 500 ? input.substring(0, 500) + '...[TRUNCATED]' : input,
            timestamp: new Date().toISOString(),
            context
        });
        
        // Keep only last 100 attempts per identifier
        if (attempts.length > 100) {
            attempts.splice(0, attempts.length - 100);
        }
        
        // Log to security monitoring system
        console.warn(`🚨 SECURITY ALERT: ${type} from ${identifier}`, {
            input: input.substring(0, 200),
            context
        });
    }
    
    /**
     * Generate unique input ID for caching
     */
    generateInputId(input, type) {
        const content = typeof input === 'string' ? input : JSON.stringify(input);
        return crypto
            .createHash('sha256')
            .update(`${type}:${content}`)
            .digest('hex')
            .substring(0, 16);
    }
    
    /**
     * Clean up validation cache
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, entry] of this.validationCache.entries()) {
            if (now - entry.timestamp > 300000) { // 5 minutes
                this.validationCache.delete(key);
            }
        }
    }
    
    /**
     * Get security statistics
     */
    getSecurityStats() {
        return {
            cacheSize: this.validationCache.size,
            suspiciousAttempts: Array.from(this.suspiciousAttempts.entries()).map(([id, attempts]) => ({
                identifier: id,
                count: attempts.length,
                lastAttempt: attempts[attempts.length - 1]?.timestamp
            })),
            schemas: Array.from(this.schemas.keys()),
            uptime: process.uptime()
        };
    }
}

module.exports = InputValidator;