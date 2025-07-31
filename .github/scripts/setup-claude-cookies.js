#!/usr/bin/env node

/**
 * Setup Claude Cookies in GitHub Secrets
 * 
 * This script helps you save Claude.ai session cookies to GitHub secrets
 * for use in GitHub Actions workflows.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
                        process.env[key.trim()] = value.replace(/^['"]|['"]$/g, ''); // Remove quotes
                    }
                }
            });
        }
    } catch (error) {
        console.error('⚠️ Error loading .env file:', error.message);
    }
}

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupCookies() {
    console.log('🍪 **CLAUDE COOKIES SETUP FOR GITHUB SECRETS**\n');
    
    // Load existing .env if available
    loadEnv();
    
    // Check if we have cookies in env
    const hasEnvCookies = process.env.CLAUDE_SESSION_KEY && process.env.CLAUDE_ORG_ID;
    
    if (hasEnvCookies) {
        console.log('✅ Found cookies in .env file');
        const useEnv = await question('Use cookies from .env file? (y/n): ');
        if (useEnv.toLowerCase() !== 'y') {
            console.log('Please update .env file with fresh cookies and run again.');
            process.exit(0);
        }
    } else {
        console.log('❌ No cookies found in .env file');
        console.log('Please create .env file with cookies first (see .env.example)');
        process.exit(1);
    }
    
    // Determine repository
    let repo = process.argv[2];
    if (!repo) {
        try {
            // Get current repo from git
            const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
            const match = remoteUrl.match(/github\.com[:/]([^/]+\/[^/.]+)/);
            if (match) {
                repo = match[1];
                console.log(`\n📦 Detected repository: ${repo}`);
                const confirm = await question('Is this correct? (y/n): ');
                if (confirm.toLowerCase() !== 'y') {
                    repo = await question('Enter repository (owner/name): ');
                }
            }
        } catch (error) {
            repo = await question('Enter repository (owner/name): ');
        }
    }
    
    console.log(`\n🔧 Setting up cookies for: ${repo}`);
    
    // Define the secrets to create
    const secrets = [
        {
            name: 'CLAUDE_SESSION_KEY',
            value: process.env.CLAUDE_SESSION_KEY,
            description: 'Claude.ai session key cookie'
        },
        {
            name: 'CLAUDE_ORG_ID',
            value: process.env.CLAUDE_ORG_ID,
            description: 'Claude.ai organization ID'
        },
        {
            name: 'CLAUDE_USER_ID',
            value: process.env.CLAUDE_USER_ID,
            description: 'Claude.ai user ID'
        }
    ];
    
    // Optionally add more cookies
    if (process.env.CLAUDE_CF_BM) {
        secrets.push({
            name: 'CLAUDE_CF_BM',
            value: process.env.CLAUDE_CF_BM,
            description: 'Cloudflare bot management cookie'
        });
    }
    
    if (process.env.CLAUDE_COOKIES_JSON) {
        secrets.push({
            name: 'CLAUDE_COOKIES_JSON',
            value: process.env.CLAUDE_COOKIES_JSON,
            description: 'Full cookies JSON array'
        });
    }
    
    // Show what will be created
    console.log('\n📋 Secrets to create/update:');
    secrets.forEach(secret => {
        const maskedValue = secret.value ? 
            secret.value.substring(0, 10) + '...' + secret.value.substring(secret.value.length - 5) : 
            'Not set';
        console.log(`   ${secret.name}: ${maskedValue} (${secret.description})`);
    });
    
    const proceed = await question('\nProceed with creating/updating these secrets? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
        console.log('❌ Setup cancelled');
        process.exit(0);
    }
    
    // Create secrets
    console.log('\n🚀 Creating GitHub secrets...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const secret of secrets) {
        if (!secret.value) {
            console.log(`⏭️  Skipping ${secret.name} (no value)`);
            continue;
        }
        
        try {
            console.log(`📝 Setting ${secret.name}...`);
            
            // Use gh CLI to set secret
            execSync(`gh secret set ${secret.name} --repo ${repo}`, {
                input: secret.value,
                encoding: 'utf8'
            });
            
            console.log(`✅ ${secret.name} saved successfully`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to set ${secret.name}: ${error.message}`);
            errorCount++;
        }
    }
    
    // Summary
    console.log('\n📊 **SUMMARY**');
    console.log(`✅ Successfully created: ${successCount} secrets`);
    if (errorCount > 0) {
        console.log(`❌ Failed: ${errorCount} secrets`);
    }
    
    // Show how to use in workflows
    console.log('\n📖 **USAGE IN WORKFLOWS**\n');
    console.log('Add these environment variables to your workflow steps:');
    console.log('```yaml');
    console.log('env:');
    console.log('  CLAUDE_SESSION_KEY: ${{ secrets.CLAUDE_SESSION_KEY }}');
    console.log('  CLAUDE_ORG_ID: ${{ secrets.CLAUDE_ORG_ID }}');
    console.log('  CLAUDE_USER_ID: ${{ secrets.CLAUDE_USER_ID }}');
    if (process.env.CLAUDE_COOKIES_JSON) {
        console.log('  CLAUDE_COOKIES_JSON: ${{ secrets.CLAUDE_COOKIES_JSON }}');
    }
    console.log('```');
    
    // Verify secrets
    console.log('\n🔍 **VERIFY SECRETS**\n');
    console.log('To verify your secrets were created:');
    console.log(`gh secret list --repo ${repo}`);
    
    rl.close();
}

// Main execution
setupCookies().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
});