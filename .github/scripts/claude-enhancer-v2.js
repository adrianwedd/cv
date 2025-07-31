#!/usr/bin/env node

/**
 * Claude CV Content Enhancer v2.0 (Modular Architecture)
 * 
 * Streamlined main entry point that orchestrates modular enhancement components.
 * This replaces the monolithic claude-enhancer.js with a clean, maintainable architecture.
 * 
 * Architecture:
 * - claude-api-client.js: Handles all Claude API communication
 * - content-enhancers.js: Specialized enhancers for each CV section
 * - enhancement-orchestrator.js: Coordinates the enhancement process
 * 
 * Environment Variables:
 * - ANTHROPIC_API_KEY: Claude API key
 * - AI_BUDGET: Token budget (sufficient|limited|insufficient)
 * - CREATIVITY_LEVEL: Enhancement style (conservative|balanced|creative|innovative)
 * - ACTIVITY_SCORE: GitHub activity score for context
 * 
 * @author Adrian Wedd
 * @version 2.0.0
 */

const path = require('path');
const { EnhancementOrchestrator } = require('./enhancer-modules/enhancement-orchestrator');

// Configuration from environment variables and defaults
const CONFIG = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_BUDGET: process.env.AI_BUDGET || 'sufficient',
    CREATIVITY_LEVEL: process.env.CREATIVITY_LEVEL || 'balanced',
    ACTIVITY_SCORE: parseFloat(process.env.ACTIVITY_SCORE) || 50,
    ENHANCEMENT_MODE: process.env.ENHANCEMENT_MODE || 'comprehensive',
    
    // API Configuration
    API_VERSION: '2023-06-01',
    MODEL: 'claude-3-5-sonnet-20241022',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.7,
    
    // Paths
    OUTPUT_DIR: 'data',
    CACHE_DIR: 'data/ai-cache',
    
    // Token Budgets by Creativity Level
    TOKEN_BUDGETS: {
        conservative: { daily: 15000, session: 4000 },
        balanced: { daily: 25000, session: 7000 },
        creative: { daily: 40000, session: 12000 },
        innovative: { daily: 60000, session: 18000 }
    }
};

/**
 * Validate configuration and environment
 */
function validateConfiguration() {
    if (!CONFIG.ANTHROPIC_API_KEY) {
        console.error('❌ ANTHROPIC_API_KEY environment variable required');
        console.error('💡 Set your Claude API key: export ANTHROPIC_API_KEY="your-key-here"');
        process.exit(1);
    }
    
    if (CONFIG.AI_BUDGET === 'insufficient') {
        console.warn('⚠️ AI budget insufficient - using minimal enhancement mode');
        CONFIG.ENHANCEMENT_MODE = 'minimal';
    }
    
    // Adjust token limits based on creativity level
    const budget = CONFIG.TOKEN_BUDGETS[CONFIG.CREATIVITY_LEVEL] || CONFIG.TOKEN_BUDGETS.balanced;
    CONFIG.MAX_TOKENS = Math.min(CONFIG.MAX_TOKENS, budget.session / 4); // Reserve for multiple sections
    
    console.log('🔧 **CONFIGURATION VALIDATED**');
    console.log(`   🤖 Model: ${CONFIG.MODEL}`);
    console.log(`   🎨 Creativity: ${CONFIG.CREATIVITY_LEVEL}`);
    console.log(`   💰 Budget: ${CONFIG.AI_BUDGET}`);
    console.log(`   📊 Activity Score: ${CONFIG.ACTIVITY_SCORE}/100`);
    console.log(`   🎯 Mode: ${CONFIG.ENHANCEMENT_MODE}`);
    console.log('');
}

/**
 * Display usage information
 */
function displayUsage() {
    console.log('🎭 **CLAUDE CV CONTENT ENHANCER v2.0**');
    console.log('=====================================');
    console.log('');
    console.log('📋 **Environment Variables:**');
    console.log('   ANTHROPIC_API_KEY     - Your Claude API key (required)');
    console.log('   AI_BUDGET            - sufficient|limited|insufficient (default: sufficient)');
    console.log('   CREATIVITY_LEVEL     - conservative|balanced|creative|innovative (default: balanced)');
    console.log('   ACTIVITY_SCORE       - GitHub activity score 0-100 (default: 50)');
    console.log('   ENHANCEMENT_MODE     - comprehensive|activity-only|ai-only|emergency-update (default: comprehensive)');
    console.log('');
    console.log('💡 **Example Usage:**');
    console.log('   export ANTHROPIC_API_KEY="your-key"');
    console.log('   export CREATIVITY_LEVEL="creative"');
    console.log('   node claude-enhancer-v2.js');
    console.log('');
    console.log('🏗️ **Modular Architecture:**');
    console.log('   📡 claude-api-client.js      - API communication & caching');
    console.log('   🎨 content-enhancers.js     - Specialized section enhancers');
    console.log('   🎭 enhancement-orchestrator.js - Process coordination');
    console.log('');
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Display header and usage info
        displayUsage();
        
        // Validate configuration
        validateConfiguration();
        
        // Initialize OAuth-first authentication manager
        console.log('🔐 **INITIALIZING OAUTH-FIRST AUTHENTICATION**');
        const authManager = new ClaudeAuthManager(CONFIG);
        await authManager.initialize();
        
        // Create enhanced config with auth manager
        const enhancedConfig = {
            ...CONFIG,
            authManager: authManager
        };
        
        // Initialize and run orchestrator with OAuth-first auth
        console.log('🎭 **INITIALIZING ENHANCEMENT ORCHESTRATOR**');
        const orchestrator = new EnhancementOrchestrator(enhancedConfig);
        
        console.log('🚀 **STARTING CV ENHANCEMENT PROCESS**');
        const results = await orchestrator.orchestrateEnhancement();
        
        // Display final results with authentication info
        console.log('✅ **ENHANCEMENT PROCESS COMPLETED SUCCESSFULLY**');
        console.log(`📊 Final Quality Score: ${results.quality_metrics?.content_quality_score || 0}/100`);
        console.log(`🎯 Enhancement Success Rate: ${results.quality_metrics?.enhancement_success_rate || 0}%`);
        console.log(`💰 Total Tokens Used: ${results.token_usage?.total || 0}`);
        
        // Show authentication and cost optimization info
        const authStatus = authManager.getAuthStatus();
        console.log(`🔐 Authentication Method: ${authStatus.current_method.toUpperCase()}${authStatus.fallback_active ? ' (fallback)' : ''}`);
        
        if (authStatus.oauth_usage) {
            console.log(`📊 Claude Max Usage: ${authStatus.oauth_usage.used}${authStatus.oauth_usage.limit ? `/${authStatus.oauth_usage.limit}` : ''} (resets in ${authStatus.oauth_usage.timeUntilReset || 0}m)`);
        }
        
        if (authStatus.usage_stats.oauth_requests > 0) {
            const totalRequests = authStatus.usage_stats.oauth_requests + authStatus.usage_stats.api_key_requests;
            const oauthPercent = Math.round((authStatus.usage_stats.oauth_requests / totalRequests) * 100);
            console.log(`💸 Cost Optimization: ${oauthPercent}% requests via Claude Max subscription`);
        }
        
        console.log('');
        console.log('🎉 **CV CONTENT ENHANCED AND READY FOR DEPLOYMENT**');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ **ENHANCEMENT PROCESS FAILED**');
        console.error(`💥 Error: ${error.message}`);
        
        if (error.stack && process.env.DEBUG) {
            console.error('🔍 Stack trace:', error.stack);
        }
        
        console.error('');
        console.error('🔧 **Troubleshooting:**');
        console.error('   1. Check your ANTHROPIC_API_KEY is valid');
        console.error('   2. Ensure data/base-cv.json exists');
        console.error('   3. Verify activity-summary.json is available');
        console.error('   4. Check network connectivity');
        console.error('   5. Review token budget limits');
        
        process.exit(1);
    }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Enhancement process interrupted by user');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Enhancement process terminated');
    process.exit(143);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled promise rejection:', reason);
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { CONFIG };