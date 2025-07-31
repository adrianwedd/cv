#!/usr/bin/env node

/**
 * Claude API Client Module
 * 
 * Handles all Claude API communication, caching, rate limiting, and error handling.
 * Extracted from the monolithic claude-enhancer.js for better modularity.
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { sleep } = require('../utils/apiClient');

/**
 * Claude API Client with advanced caching and error handling
 */
class ClaudeApiClient {
    constructor(config) {
        this.apiKey = config.ANTHROPIC_API_KEY;
        this.model = config.MODEL || 'claude-3-5-sonnet-20241022';
        this.apiVersion = config.API_VERSION || '2023-06-01';
        this.cacheDir = config.CACHE_DIR || 'data/ai-cache';
        this.maxTokens = config.MAX_TOKENS || 4000;
        this.temperature = config.TEMPERATURE || 0.7;
        this.requestCount = 0;
        this.tokenUsage = { input: 0, output: 0 };
    }

    /**
     * Make a request to Claude API with comprehensive error handling
     */
    async makeRequest(messages, options = {}, sourceContent = '') {
        if (!this.apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        const requestOptions = {
            model: options.model || this.model,
            max_tokens: options.max_tokens || this.maxTokens,
            temperature: options.temperature || this.temperature,
            messages: messages
        };

        // Generate cache key
        const cacheKey = this.generateCacheKey(requestOptions, sourceContent);
        
        try {
            // Check cache first
            const cachedResponse = await this.getCachedResponse(cacheKey);
            if (cachedResponse) {
                console.log('📋 Using cached response');
                return cachedResponse;
            }

            console.log(`🤖 Making Claude API request (${++this.requestCount})`);
            
            // Make API request
            const response = await this.httpRequest(
                'https://api.anthropic.com/v1/messages',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': this.apiVersion
                    }
                },
                JSON.stringify(requestOptions)
            );

            if (!response || !response.body) {
                throw new Error('Invalid response from Claude API');
            }

            const result = JSON.parse(response.body);
            
            if (result.error) {
                throw new Error(`Claude API error: ${result.error.message}`);
            }

            // Track token usage
            if (result.usage) {
                this.tokenUsage.input += result.usage.input_tokens || 0;
                this.tokenUsage.output += result.usage.output_tokens || 0;
            }

            // Cache the response
            await this.cacheResponse(cacheKey, result);
            
            return result;

        } catch (error) {
            console.error('❌ Claude API request failed:', error.message);
            throw error;
        }
    }

    /**
     * HTTP request with retry logic
     */
    async httpRequest(url, options, data, maxRetries = 3, retryDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await new Promise((resolve, reject) => {
                    const req = https.request(url, options, (res) => {
                        let body = '';
                        res.on('data', chunk => body += chunk);
                        res.on('end', () => {
                            if (res.statusCode >= 200 && res.statusCode < 300) {
                                resolve({ body, statusCode: res.statusCode });
                            } else {
                                reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                            }
                        });
                    });

                    req.on('error', reject);
                    
                    if (data) {
                        req.write(data);
                    }
                    
                    req.end();
                });
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                
                console.log(`⚠️ Request failed, retrying in ${retryDelay}ms... (${i + 1}/${maxRetries})`);
                await sleep(retryDelay);
                retryDelay *= 2; // Exponential backoff
            }
        }
    }

    /**
     * Generate cache key for request
     */
    generateCacheKey(requestOptions, sourceContent) {
        const contentHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(requestOptions) + sourceContent)
            .digest('hex')
            .substring(0, 16);
        
        return contentHash;
    }

    /**
     * Get cached response if available
     */
    async getCachedResponse(cacheKey) {
        try {
            const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
            const cacheContent = await fs.readFile(cachePath, 'utf8');
            const cached = JSON.parse(cacheContent);
            
            // Check if cache is still fresh (24 hours)
            const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
            if (cacheAge < 24 * 60 * 60 * 1000) {
                return cached.response;
            }
        } catch {
            // Cache miss or invalid cache
        }
        
        return null;
    }

    /**
     * Cache API response
     */
    async cacheResponse(cacheKey, response) {
        try {
            await this.ensureCacheDir();
            
            const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
            const cacheData = {
                timestamp: new Date().toISOString(),
                response: response
            };
            
            await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
        } catch {
            // Non-critical error - continue without caching
            console.warn('⚠️ Failed to cache response');
        }
    }

    /**
     * Ensure cache directory exists
     */
    async ensureCacheDir() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch {
            // Directory already exists or creation failed
        }
    }

    /**
     * Get current token usage statistics
     */
    getTokenUsage() {
        return {
            ...this.tokenUsage,
            total: this.tokenUsage.input + this.tokenUsage.output,
            requests: this.requestCount
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsage() {
        this.requestCount = 0;
        this.tokenUsage = { input: 0, output: 0 };
    }
}

module.exports = { ClaudeApiClient };