#!/usr/bin/env node

/**
 * LangSmith Monitoring Diagnostics
 * Comprehensive test and troubleshooting for LangSmith integration
 */

const { Client } = require('langsmith');
const axios = require('axios');
require('dotenv').config({ path: '../.env.langsmith' });

class LangSmithDiagnostics {
    constructor() {
        this.apiKey = process.env.LANGSMITH_API_KEY;
        this.endpoint = process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com';
        this.project = process.env.LANGSMITH_PROJECT || 'adrianwedd-cv';
        
        this.client = null;
        this.results = {
            apiKey: false,
            connectivity: false,
            authentication: false,
            projectExists: false,
            canCreateRuns: false,
            proxyRunning: false
        };
    }

    async runDiagnostics() {
        console.log('🔍 LangSmith Monitoring Diagnostics');
        console.log('=====================================\n');

        await this.checkApiKey();
        await this.checkConnectivity();
        await this.checkAuthentication();
        await this.checkProjectAccess();
        await this.testRunCreation();
        await this.checkProxyStatus();
        await this.generateReport();
    }

    async checkApiKey() {
        console.log('1️⃣ Checking API Key Configuration...');
        
        if (!this.apiKey) {
            console.log('   ❌ LANGSMITH_API_KEY not found');
            console.log('   💡 Set LANGSMITH_API_KEY in .env.langsmith');
            return;
        }
        
        if (this.apiKey.length < 40) {
            console.log('   ⚠️  API key appears too short (may be invalid)');
        }
        
        if (!this.apiKey.startsWith('lsv2_')) {
            console.log('   ⚠️  API key doesn\'t match expected format (lsv2_...)');
        }
        
        console.log(`   ✅ API Key found: ${this.apiKey.substring(0, 10)}...`);
        this.results.apiKey = true;
    }

    async checkConnectivity() {
        console.log('\\n2️⃣ Testing Network Connectivity...');
        
        try {
            const response = await axios.get(this.endpoint, { timeout: 5000 });
            console.log(`   ✅ Connected to ${this.endpoint}`);
            this.results.connectivity = true;
        } catch (error) {
            console.log(`   ❌ Cannot connect to ${this.endpoint}`);
            console.log(`   Error: ${error.message}`);
            
            if (error.code === 'ENOTFOUND') {
                console.log('   💡 Check your internet connection and DNS settings');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('   💡 The LangSmith service may be down');
            }
        }
    }

    async checkAuthentication() {
        console.log('\\n3️⃣ Testing Authentication...');
        
        if (!this.apiKey || !this.results.connectivity) {
            console.log('   ⏭️  Skipping (prerequisites not met)');
            return;
        }
        
        try {
            this.client = new Client({
                apiKey: this.apiKey,
                apiUrl: this.endpoint
            });
            
            // Test authentication by listing projects
            const response = await axios.get(`${this.endpoint}/tenants/current`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log('   ✅ Authentication successful');
            console.log(`   Organization: ${response.data.display_name || 'N/A'}`);
            this.results.authentication = true;
            
        } catch (error) {
            console.log('   ❌ Authentication failed');
            console.log(`   Status: ${error.response?.status} ${error.response?.statusText}`);
            console.log(`   Error: ${error.response?.data?.detail || error.message}`);
            
            if (error.response?.status === 401) {
                console.log('   💡 API key is invalid or expired');
                console.log('   💡 Generate a new API key at: https://smith.langchain.com/settings');
            } else if (error.response?.status === 403) {
                console.log('   💡 API key lacks required permissions');
            }
        }
    }

    async checkProjectAccess() {
        console.log('\\n4️⃣ Checking Project Access...');
        
        if (!this.results.authentication) {
            console.log('   ⏭️  Skipping (authentication failed)');
            return;
        }
        
        try {
            const response = await axios.get(`${this.endpoint}/sessions`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    project_name: this.project,
                    limit: 1
                },
                timeout: 10000
            });
            
            console.log(`   ✅ Project "${this.project}" is accessible`);
            console.log(`   Found ${response.data.length || 0} existing sessions`);
            this.results.projectExists = true;
            
        } catch (error) {
            console.log(`   ❌ Cannot access project "${this.project}"`);
            console.log(`   Status: ${error.response?.status}`);
            
            if (error.response?.status === 404) {
                console.log('   💡 Project will be created automatically on first run');
                this.results.projectExists = false; // Will be created
            }
        }
    }

    async testRunCreation() {
        console.log('\\n5️⃣ Testing Run Creation...');
        
        if (!this.client || !this.results.authentication) {
            console.log('   ⏭️  Skipping (client not available)');
            return;
        }
        
        try {
            const testRun = await this.client.createRun({
                project_name: this.project,
                name: 'diagnostic_test',
                run_type: 'chain',
                start_time: new Date().toISOString(),
                end_time: new Date().toISOString(),
                inputs: {
                    test: 'LangSmith diagnostics',
                    timestamp: new Date().toISOString()
                },
                outputs: {
                    success: true,
                    message: 'Diagnostic test completed successfully'
                },
                tags: ['diagnostic', 'test', 'cv-monitoring'],
                extra: {
                    diagnostic_version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development'
                }
            });
            
            console.log('   ✅ Successfully created test run');
            console.log(`   Run ID: ${testRun.id}`);
            console.log(`   View at: https://smith.langchain.com/o/adrianwedd/projects/p/${this.project}/r/${testRun.id}`);
            this.results.canCreateRuns = true;
            
        } catch (error) {
            console.log('   ❌ Failed to create test run');
            console.log(`   Error: ${error.message}`);
            
            if (error.response?.status === 422) {
                console.log('   💡 Invalid run data format');
            } else if (error.response?.status === 403) {
                console.log('   💡 Insufficient permissions to create runs');
            }
        }
    }

    async checkProxyStatus() {
        console.log('\\n6️⃣ Checking LangSmith Proxy Status...');
        
        try {
            const response = await axios.get('http://localhost:8080/health', { timeout: 3000 });
            console.log('   ✅ LangSmith proxy is running');
            console.log(`   Status: ${response.data.status}`);
            this.results.proxyRunning = true;
        } catch (error) {
            console.log('   ❌ LangSmith proxy is not running');
            console.log(`   Error: ${error.code}`);
            console.log('   💡 Start with: npm run start (in langsmith-proxy directory)');
            console.log('   💡 Or use Docker: docker-compose up langsmith-proxy');
        }
    }

    async generateReport() {
        console.log('\\n📊 Diagnostic Report');
        console.log('====================');
        
        const checks = [
            { name: 'API Key Configuration', status: this.results.apiKey },
            { name: 'Network Connectivity', status: this.results.connectivity },
            { name: 'Authentication', status: this.results.authentication },
            { name: 'Project Access', status: this.results.projectExists },
            { name: 'Run Creation', status: this.results.canCreateRuns },
            { name: 'Proxy Service', status: this.results.proxyRunning }
        ];
        
        const passed = checks.filter(c => c.status).length;
        const total = checks.length;
        
        checks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`${status} ${check.name}`);
        });
        
        console.log(`\\n🎯 Overall Status: ${passed}/${total} checks passed`);
        
        if (passed === total) {
            console.log('\\n🎉 LangSmith integration is fully operational!');
            console.log('   📊 View dashboard: https://smith.langchain.com/o/adrianwedd/projects/p/adrianwedd-cv');
        } else {
            console.log('\\n⚠️  Issues detected. See recommendations above.');
        }
        
        // Specific recommendations
        if (!this.results.apiKey || !this.results.authentication) {
            console.log('\\n🔑 API Key Issues:');
            console.log('   1. Visit https://smith.langchain.com/settings');
            console.log('   2. Create a new API key');
            console.log('   3. Update .env.langsmith with: LANGSMITH_API_KEY=your_new_key');
        }
        
        if (!this.results.proxyRunning) {
            console.log('\\n🚀 Start Proxy Service:');
            console.log('   cd monitoring/langsmith-proxy && npm start');
        }
        
        if (this.results.canCreateRuns) {
            console.log('\\n✨ Next Steps:');
            console.log('   1. Add browser tracking to index.html');
            console.log('   2. Deploy with: docker-compose up -d');
            console.log('   3. Monitor dashboard for incoming data');
        }
    }
}

// CLI execution
if (require.main === module) {
    const diagnostics = new LangSmithDiagnostics();
    diagnostics.runDiagnostics().catch(error => {
        console.error('\\n💥 Diagnostic failed:', error);
        process.exit(1);
    });
}

module.exports = { LangSmithDiagnostics };