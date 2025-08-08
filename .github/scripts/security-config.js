/**
 * Enterprise Security Configuration
 * Comprehensive security hardening for AI-Enhanced CV System
 * 
 * Features:
 * - Content Security Policy with strict directives
 * - Security headers management
 * - Input validation and sanitization
 * - Rate limiting configuration
 * - CORS policy management
 * - Token security standards
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Security Configuration Class
 */
class SecurityConfig {
    constructor() {
        this.config = {
            // CSP Configuration
            contentSecurityPolicy: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for dynamic script loading
                    "cdn.jsdelivr.net",
                    "fonts.googleapis.com",
                    "fonts.gstatic.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for dynamic styles
                    "fonts.googleapis.com",
                    "fonts.gstatic.com"
                ],
                fontSrc: [
                    "'self'",
                    "fonts.gstatic.com",
                    "data:"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "*.githubusercontent.com",
                    "api.github.com",
                    "shields.io",
                    "img.shields.io"
                ],
                connectSrc: [
                    "'self'",
                    "api.github.com",
                    "fonts.googleapis.com",
                    "fonts.gstatic.com",
                    "claude.ai",
                    "api.anthropic.com"
                ],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: true,
                blockAllMixedContent: true
            },
            
            // Security Headers
            securityHeaders: {
                'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Resource-Policy': 'cross-origin'
            },
            
            // Rate Limiting
            rateLimiting: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                maxRequests: 100, // per window
                skipSuccessfulRequests: false,
                skipFailedRequests: false,
                standardHeaders: true,
                legacyHeaders: false
            },
            
            // CORS Configuration
            cors: {
                origin: [
                    'https://adrianwedd.github.io',
                    'http://localhost:3000',
                    'http://localhost:8000'
                ],
                methods: ['GET', 'POST', 'OPTIONS'],
                allowedHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Requested-With',
                    'Accept',
                    'Origin'
                ],
                credentials: false,
                maxAge: 86400 // 24 hours
            },
            
            // Token Security
            tokenSecurity: {
                algorithms: ['HS256'],
                issuer: 'adrianwedd-cv',
                audience: 'cv-system',
                expiresIn: '1h',
                clockTolerance: 60
            },
            
            // Input Validation Rules
            validationRules: {
                maxStringLength: 1000,
                allowedFileTypes: ['.json', '.md', '.html', '.css', '.js'],
                maxFileSize: 5 * 1024 * 1024, // 5MB
                allowedCharacters: /^[a-zA-Z0-9\s\-_.@#$%&*()+=!?,:;'"<>{}[\]|\\\/~`^]+$/,
                sanitizationRules: {
                    stripHtml: true,
                    trimWhitespace: true,
                    normalizeUnicode: true
                }
            }
        };
        
        this.nonces = new Map();
        this.rateLimitStore = new Map();
    }
    
    /**
     * Generate CSP string from configuration
     */
    generateCSP() {
        const csp = this.config.contentSecurityPolicy;
        const nonce = this.generateNonce();
        
        // Add nonce to script-src and style-src
        csp.scriptSrc.push(`'nonce-${nonce}'`);
        csp.styleSrc.push(`'nonce-${nonce}'`);
        
        const directives = [];
        
        for (const [directive, sources] of Object.entries(csp)) {
            if (directive === 'upgradeInsecureRequests' || directive === 'blockAllMixedContent') {
                if (sources) {
                    directives.push(directive.replace(/([A-Z])/g, '-$1').toLowerCase());
                }
            } else {
                const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
                directives.push(`${kebabDirective} ${sources.join(' ')}`);
            }
        }
        
        return {
            csp: directives.join('; '),
            nonce
        };
    }
    
    /**
     * Generate cryptographically secure nonce
     */
    generateNonce() {
        const nonce = crypto.randomBytes(16).toString('base64');
        this.nonces.set(nonce, Date.now());
        
        // Clean up old nonces
        const now = Date.now();
        for (const [key, timestamp] of this.nonces.entries()) {
            if (now - timestamp > 3600000) { // 1 hour
                this.nonces.delete(key);
            }
        }
        
        return nonce;
    }
    
    /**
     * Validate input against security rules
     */
    validateInput(input, type = 'string') {
        if (!input) return { valid: false, error: 'Input is required' };
        
        const rules = this.config.validationRules;
        
        switch (type) {
            case 'string':
                if (input.length > rules.maxStringLength) {
                    return { valid: false, error: 'String too long' };
                }
                if (!rules.allowedCharacters.test(input)) {
                    return { valid: false, error: 'Contains invalid characters' };
                }
                break;
                
            case 'filename':
                const ext = path.extname(input).toLowerCase();
                if (!rules.allowedFileTypes.includes(ext)) {
                    return { valid: false, error: 'File type not allowed' };
                }
                break;
                
            case 'json':
                try {
                    JSON.parse(input);
                } catch (e) {
                    return { valid: false, error: 'Invalid JSON format' };
                }
                break;
        }
        
        return { valid: true, sanitized: this.sanitizeInput(input) };
    }
    
    /**
     * Sanitize input according to rules
     */
    sanitizeInput(input) {
        const rules = this.config.validationRules.sanitizationRules;
        let sanitized = input;
        
        if (rules.stripHtml) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }
        
        if (rules.trimWhitespace) {
            sanitized = sanitized.trim();
        }
        
        if (rules.normalizeUnicode) {
            sanitized = sanitized.normalize('NFC');
        }
        
        // Escape dangerous characters
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
            
        return sanitized;
    }
    
    /**
     * Check rate limiting
     */
    checkRateLimit(identifier) {
        const now = Date.now();
        const windowStart = now - this.config.rateLimiting.windowMs;
        
        if (!this.rateLimitStore.has(identifier)) {
            this.rateLimitStore.set(identifier, []);
        }
        
        const requests = this.rateLimitStore.get(identifier);
        
        // Clean up old requests
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        this.rateLimitStore.set(identifier, validRequests);
        
        if (validRequests.length >= this.config.rateLimiting.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: windowStart + this.config.rateLimiting.windowMs
            };
        }
        
        // Add current request
        validRequests.push(now);
        
        return {
            allowed: true,
            remaining: this.config.rateLimiting.maxRequests - validRequests.length,
            resetTime: windowStart + this.config.rateLimiting.windowMs
        };
    }
    
    /**
     * Generate secure token
     */
    generateSecureToken(payload = {}) {
        const secret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        
        const now = Math.floor(Date.now() / 1000);
        const tokenPayload = {
            ...payload,
            iss: this.config.tokenSecurity.issuer,
            aud: this.config.tokenSecurity.audience,
            iat: now,
            exp: now + 3600, // 1 hour
            jti: crypto.randomBytes(16).toString('hex')
        };
        
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
        
        const signature = crypto
            .createHmac('sha256', secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
            
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    
    /**
     * Validate JWT token
     */
    validateToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return { valid: false, error: 'Invalid token format' };
            }
            
            const [encodedHeader, encodedPayload, signature] = parts;
            const secret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
            
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(`${encodedHeader}.${encodedPayload}`)
                .digest('base64url');
                
            if (signature !== expectedSignature) {
                return { valid: false, error: 'Invalid signature' };
            }
            
            const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < now) {
                return { valid: false, error: 'Token expired' };
            }
            
            if (payload.nbf && payload.nbf > now) {
                return { valid: false, error: 'Token not yet valid' };
            }
            
            return { valid: true, payload };
            
        } catch (error) {
            return { valid: false, error: 'Token validation failed' };
        }
    }
    
    /**
     * Generate security report
     */
    generateSecurityReport() {
        return {
            timestamp: new Date().toISOString(),
            csp: this.generateCSP(),
            headers: this.config.securityHeaders,
            rateLimiting: {
                ...this.config.rateLimiting,
                activeConnections: this.rateLimitStore.size
            },
            validation: {
                rules: this.config.validationRules,
                activeNonces: this.nonces.size
            },
            recommendations: [
                'Regularly rotate JWT secrets',
                'Monitor rate limiting patterns',
                'Update CSP directives as needed',
                'Review and audit security logs',
                'Test security measures periodically'
            ]
        };
    }
    
    /**
     * Export configuration for middleware
     */
    getMiddlewareConfig() {
        return {
            headers: this.config.securityHeaders,
            csp: this.generateCSP(),
            cors: this.config.cors,
            rateLimiting: this.config.rateLimiting
        };
    }
}

module.exports = SecurityConfig;