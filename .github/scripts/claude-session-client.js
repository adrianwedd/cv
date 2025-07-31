#!/usr/bin/env node

/**
 * Claude Session-Based API Client
 * 
 * Uses Claude.ai session cookies for direct API access without OAuth complexity.
 * This bypasses the restricted OAuth implementation and uses the same endpoints
 * that the Claude web interface uses.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const https = require('https');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    if (value && !value.startsWith('#')) {
                        process.env[key.trim()] = value;
                    }
                }
            });
        }
    } catch (error) {
        // .env file not found or invalid, continue with existing env vars
    }
}

// Load .env on module import
loadEnv();

/**
 * Claude Session API Client using sessionKey cookie
 */
class ClaudeSessionClient {
    constructor(config = {}) {
        // Store all cookies for full session authentication
        this.cookies = config.cookies || [];
        this.cookieString = this.buildCookieHeader(this.cookies);
        
        // Extract specific values from cookies
        this.sessionKey = config.sessionKey || this.extractSessionKey(this.cookies);
        this.orgId = config.orgId || this.extractCookieValue(this.cookies, 'lastActiveOrg') || '1287541f-a020-4755-bbb0-8945a1be4fa5';
        this.userId = config.userId || this.extractCookieValue(this.cookies, 'ajs_user_id') || 'f71a8285-af11-4a58-ae8a-0020ecb210e8';
        
        // Claude.ai API endpoints (internal)
        this.baseUrl = 'https://claude.ai';
        this.apiUrl = `${this.baseUrl}/api`;
        
        // Advanced fingerprinting evasion headers
        this.defaultHeaders = this.generateRealisticHeaders();
        
        // Initialize conversation tracking
        this.conversationId = null;
        this.messageHistory = [];
    }

    /**
     * Generate realistic browser headers with fingerprinting evasion
     */
    generateRealisticHeaders() {
        // Randomize some header values to avoid fingerprinting
        const chromeVersions = ['131', '130', '129', '128'];
        const chromeVersion = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
        
        const platforms = ['"macOS"', '"Windows"', '"Linux"'];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        
        const userAgents = [
            `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`,
            `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`,
            `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36`
        ];
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        
        // Vary accept-language slightly
        const languages = [
            'en-US,en;q=0.9',
            'en-US,en;q=0.9,es;q=0.8',
            'en-US,en;q=0.9,fr;q=0.8',
            'en-GB,en;q=0.9,en-US;q=0.8'
        ];
        const acceptLanguage = languages[Math.floor(Math.random() * languages.length)];
        
        return {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': acceptLanguage,
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'Origin': 'https://claude.ai',
            'Pragma': 'no-cache',
            'Referer': 'https://claude.ai/chat',
            'Sec-Ch-Ua': `"Google Chrome";v="${chromeVersion}", "Chromium";v="${chromeVersion}", "Not_A Brand";v="24"`,
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': platform,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': userAgent,
            // Add some entropy to header order
            ...(Math.random() > 0.5 ? { 'DNT': '1' } : {}),
            ...(Math.random() > 0.7 ? { 'Upgrade-Insecure-Requests': '1' } : {})
        };
    }

    /**
     * Extract sessionKey from cookie array
     */
    extractSessionKey(cookies) {
        if (!cookies || !Array.isArray(cookies)) {
            throw new Error('No cookies provided. Please provide Claude.ai session cookies.');
        }
        
        const sessionCookie = cookies.find(cookie => cookie.name === 'sessionKey');
        if (!sessionCookie) {
            throw new Error('No sessionKey cookie found. Please ensure you are logged into Claude.ai.');
        }
        
        return sessionCookie.value;
    }

    /**
     * Extract specific cookie value
     */
    extractCookieValue(cookies, cookieName) {
        if (!cookies || !Array.isArray(cookies)) return null;
        
        const cookie = cookies.find(c => c.name === cookieName);
        return cookie ? cookie.value : null;
    }

    /**
     * Build cookie string from cookie array
     */
    buildCookieHeader(cookies) {
        if (!cookies || !Array.isArray(cookies)) return '';
        
        return cookies
            .filter(cookie => cookie.value && !cookie.value.includes('undefined'))
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
    }

    /**
     * Make authenticated request to Claude API
     */
    async makeRequest(messages, options = {}) {
        if (!this.sessionKey) {
            throw new Error('No session key available. Please provide valid Claude.ai cookies.');
        }

        try {
            // Create or get conversation
            if (!this.conversationId && messages.length > 0) {
                await this.createConversation();
            }

            // Send message and stream response
            const response = await this.sendMessage(messages, options);
            return response;

        } catch (error) {
            console.error('❌ Claude session request failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new conversation using the claude.ai frontend flow
     */
    async createConversation() {
        // Random delay to mimic human behavior
        await this.randomDelay(500, 2000);
        
        const conversationData = {
            uuid: crypto.randomUUID(),
            name: '',
            summary: '',
            model: 'claude-3-5-sonnet-20241022',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            // Use the actual endpoint that claude.ai frontend uses
            const response = await this.makeHttpRequest(
                `${this.apiUrl}/organizations/${this.orgId}/chat_conversations`,
                {
                    method: 'POST',
                    headers: {
                        ...this.defaultHeaders,
                        'Content-Length': JSON.stringify(conversationData).length.toString(),
                        'Cookie': this.cookieString
                    }
                },
                JSON.stringify(conversationData)
            );

            console.log(`🔍 Response status: ${response.statusCode}`);
            console.log(`🔍 Response headers:`, response.headers);
            console.log(`🔍 Response body preview:`, response.body.substring(0, 200));
            
            if (response.statusCode !== 200) {
                throw new Error(`HTTP ${response.statusCode}: ${response.body.substring(0, 500)}`);
            }
            
            const result = JSON.parse(response.body);
            this.conversationId = result.uuid;
            console.log(`💬 Created conversation: ${this.conversationId}`);
            
            return result;

        } catch (error) {
            console.error('❌ Failed to create conversation:', error.message);
            throw error;
        }
    }

    /**
     * Send message to Claude and stream response
     */
    async sendMessage(messages, options = {}) {
        if (!this.conversationId) {
            throw new Error('No active conversation. Create conversation first.');
        }

        // Convert messages to Claude format
        const prompt = this.formatMessages(messages);
        
        const messageData = {
            completion: {
                prompt: prompt,
                timezone: 'Australia/Tasmania',
                model: 'claude-3-5-sonnet-20241022',
                ...options
            },
            organization_uuid: this.orgId,
            conversation_uuid: this.conversationId,
            text: prompt,
            attachments: []
        };

        try {
            const response = await this.makeHttpRequest(
                `${this.apiUrl}/organizations/${this.orgId}/chat_conversations/${this.conversationId}/completion`,
                {
                    method: 'POST',
                    headers: {
                        ...this.defaultHeaders,
                        'Accept': 'text/event-stream',
                        'Cookie': `sessionKey=${this.sessionKey}`
                    }
                },
                JSON.stringify(messageData)
            );

            // Parse streaming response
            const result = this.parseStreamingResponse(response.body);
            
            // Track message history
            this.messageHistory.push({
                role: 'user',
                content: prompt,
                timestamp: new Date().toISOString()
            });
            
            this.messageHistory.push({
                role: 'assistant', 
                content: result.content,
                timestamp: new Date().toISOString()
            });

            return {
                content: [{ text: result.content }],
                usage: result.usage || { input_tokens: 0, output_tokens: 0 },
                model: 'claude-3-5-sonnet-20241022',
                conversation_id: this.conversationId
            };

        } catch (error) {
            console.error('❌ Failed to send message:', error.message);
            throw error;
        }
    }

    /**
     * Format messages for Claude API
     */
    formatMessages(messages) {
        if (typeof messages === 'string') {
            return messages;
        }
        
        if (Array.isArray(messages)) {
            return messages
                .map(msg => {
                    if (msg.role === 'system') {
                        return `System: ${msg.content}`;
                    } else if (msg.role === 'user') {
                        return `Human: ${msg.content}`;
                    } else if (msg.role === 'assistant') {
                        return `Assistant: ${msg.content}`;
                    }
                    return msg.content;
                })
                .join('\n\n');
        }
        
        return String(messages);
    }

    /**
     * Parse streaming response from Claude
     */
    parseStreamingResponse(responseBody) {
        try {
            // Claude returns event-stream format
            const lines = responseBody.split('\n').filter(line => line.trim());
            let content = '';
            let usage = { input_tokens: 0, output_tokens: 0 };

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        
                        if (data.completion) {
                            content += data.completion;
                        }
                        
                        if (data.usage) {
                            usage = data.usage;
                        }
                    } catch (parseError) {
                        // Skip invalid JSON lines
                        continue;
                    }
                }
            }

            return { content, usage };

        } catch (error) {
            // Fallback: return response as-is
            return { 
                content: responseBody, 
                usage: { input_tokens: 0, output_tokens: 0 } 
            };
        }
    }

    /**
     * Get conversation history
     */
    async getConversations() {
        try {
            const response = await this.makeHttpRequest(
                `${this.apiUrl}/organizations/${this.orgId}/chat_conversations`,
                {
                    method: 'GET',
                    headers: {
                        ...this.defaultHeaders,
                        'Cookie': this.cookieString
                    }
                }
            );

            return JSON.parse(response.body);

        } catch (error) {
            console.error('❌ Failed to get conversations:', error.message);
            throw error;
        }
    }

    /**
     * Warmup session with browser-like requests
     */
    async warmupSession() {
        console.log('🔥 Warming up session with browser-like behavior...');
        
        try {
            // Simulate visiting the main page first
            await this.randomDelay(1000, 3000);
            
            // Make a simple GET request to establish session
            await this.makeHttpRequest('https://claude.ai/api/auth/current_user', {
                method: 'GET',
                headers: {
                    ...this.defaultHeaders,
                    'Cookie': this.cookieString,
                    'Accept': 'application/json',
                    'Referer': 'https://claude.ai/'
                }
            });
            
            console.log('🔥 Session warmed up');
            
        } catch (error) {
            console.log('⚠️ Warmup failed, proceeding anyway:', error.message);
        }
    }

    /**
     * Test session authentication with advanced evasion
     */
    async testSession() {
        try {
            console.log('🧪 Testing Claude session authentication...');
            console.log(`🔑 Session Key: ${this.sessionKey.substring(0, 20)}...`);
            console.log(`🏢 Organization: ${this.orgId}`);
            console.log(`👤 User ID: ${this.userId}`);
            
            // Warmup session first
            await this.warmupSession();
            
            // Random delay to simulate human behavior
            await this.randomDelay(2000, 5000);
            
            const response = await this.makeRequest([
                { role: 'user', content: 'Hello! Please respond with a brief greeting to confirm the session is working.' }
            ]);

            console.log('✅ Session test successful!');
            console.log(`📝 Response: ${response.content[0].text.substring(0, 100)}...`);
            console.log(`💬 Conversation ID: ${this.conversationId}`);
            
            return response;

        } catch (error) {
            console.error('❌ Session test failed:', error.message);
            throw error;
        }
    }

    /**
     * Advanced behavioral timing patterns
     */
    async randomDelay(min = 100, max = 1000) {
        // More realistic human-like delays with occasional longer pauses
        let delay = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // 10% chance of longer "thinking" pause
        if (Math.random() < 0.1) {
            delay += Math.floor(Math.random() * 3000) + 1000;
        }
        
        // Add some jitter to avoid regular patterns
        const jitter = Math.floor(Math.random() * 200) - 100;
        delay = Math.max(50, delay + jitter);
        
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Simulate mouse/keyboard activity timing
     */
    async simulateUserActivity() {
        // Simulate random user activity patterns
        const activities = [
            () => this.randomDelay(100, 300),  // Quick action
            () => this.randomDelay(500, 1500), // Reading/thinking
            () => this.randomDelay(200, 800),  // Typing
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        await activity();
    }

    /**
     * HTTP request utility with advanced bot evasion
     */
    async makeHttpRequest(url, options, data) {
        // Add behavioral delay before request
        await this.simulateUserActivity();
        
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            
            // Enhanced request options with TLS/connection fingerprinting evasion
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: options.headers || {},
                // TLS options to mimic real browser
                secureProtocol: 'TLSv1_2_method',
                ciphers: [
                    'ECDHE-RSA-AES128-GCM-SHA256',
                    'ECDHE-RSA-AES256-GCM-SHA384',
                    'ECDHE-RSA-AES128-SHA256',
                    'ECDHE-RSA-AES256-SHA384',
                    'ECDHE-RSA-AES128-SHA',
                    'ECDHE-RSA-AES256-SHA'
                ].join(':'),
                // Connection keep-alive
                agent: false,
                // Disable Nagle's algorithm (like browsers)
                noDelay: true
            };

            const req = https.request(requestOptions, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(data);
            }

            req.end();
        });
    }
}

/**
 * CLI interface for session testing
 */
/**
 * Load cookies from environment variables
 */
function loadCookiesFromEnv() {
    // Try to load from CLAUDE_COOKIES_JSON first (full cookie array)
    if (process.env.CLAUDE_COOKIES_JSON) {
        try {
            return JSON.parse(process.env.CLAUDE_COOKIES_JSON);
        } catch (error) {
            console.warn('⚠️ Invalid CLAUDE_COOKIES_JSON format, falling back to individual cookies');
        }
    }
    
    // Build cookies from individual environment variables
    const cookies = [];
    
    // Essential cookies for Claude.ai authentication
    const essentialCookies = {
        'sessionKey': process.env.CLAUDE_SESSION_KEY,
        'lastActiveOrg': process.env.CLAUDE_ORG_ID,
        'ajs_user_id': process.env.CLAUDE_USER_ID,
        '__cf_bm': process.env.CLAUDE_CF_BM,
        '__ssid': process.env.CLAUDE_SSID,
        'anthropic-device-id': process.env.CLAUDE_DEVICE_ID,
        'activitySessionId': process.env.CLAUDE_ACTIVITY_SESSION_ID
    };
    
    // Add non-empty cookies
    Object.entries(essentialCookies).forEach(([name, value]) => {
        if (value) {
            cookies.push({ name, value });
        }
    });
    
    if (cookies.length === 0) {
        throw new Error('No Claude.ai cookies found in environment variables. Please set CLAUDE_SESSION_KEY at minimum.');
    }
    
    return cookies;
}

async function main() {
    const command = process.argv[2];
    
    try {
        // Load cookies from environment variables
        const cookies = loadCookiesFromEnv();
        
        const client = new ClaudeSessionClient({ cookies });
        
        switch (command) {
            case 'test':
                await client.testSession();
                break;
                
            case 'conversations':
                const conversations = await client.getConversations();
                console.log('📋 Recent conversations:', conversations.slice(0, 5));
                break;
                
            default:
                console.log('🍪 **CLAUDE SESSION CLIENT**\n');
                console.log('Usage:');
                console.log('  node claude-session-client.js test           - Test session authentication');
                console.log('  node claude-session-client.js conversations  - List recent conversations');
                console.log('');
                console.log('Environment variables required:');
                console.log('  CLAUDE_SESSION_KEY - Your sessionKey cookie value');
                console.log('  CLAUDE_ORG_ID - Your lastActiveOrg cookie value');
                console.log('  CLAUDE_USER_ID - Your ajs_user_id cookie value');
                break;
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

module.exports = { ClaudeSessionClient };

if (require.main === module) {
    main().catch(console.error);
}