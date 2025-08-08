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
        
        

        await this.checkApiKey();
        await this.checkConnectivity();
        await this.checkAuthentication();
        await this.checkProjectAccess();
        await this.testRunCreation();
        await this.checkProxyStatus();
        await this.generateReport();
    }

    async checkApiKey() {
        
        
        if (!this.apiKey) {
            
            
            return;
        }
        
        if (this.apiKey.length < 40) {
            ');
        }
        
        if (!this.apiKey.startsWith('lsv2_')) {
            ');
        }
        
        }...`);
        this.results.apiKey = true;
    }

    async checkConnectivity() {
        
        
        try {
            const response = await axios.get(this.endpoint, { timeout: 5000 });
            
            this.results.connectivity = true;
        } catch (error) {
            
            
            
            if (error.code === 'ENOTFOUND') {
                
            } else if (error.code === 'ECONNREFUSED') {
                
            }
        }
    }

    async checkAuthentication() {
        
        
        if (!this.apiKey || !this.results.connectivity) {
            ');
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
            
            
            
            this.results.authentication = true;
            
        } catch (error) {
            
            
            
            
            if (error.response?.status === 401) {
                
                
            } else if (error.response?.status === 403) {
                
            }
        }
    }

    async checkProjectAccess() {
        
        
        if (!this.results.authentication) {
            ');
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
            
            
            
            this.results.projectExists = true;
            
        } catch (error) {
            
            
            
            if (error.response?.status === 404) {
                
                this.results.projectExists = false; // Will be created
            }
        }
    }

    async testRunCreation() {
        
        
        if (!this.client || !this.results.authentication) {
            ');
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
            
            
            
            
            this.results.canCreateRuns = true;
            
        } catch (error) {
            
            
            
            if (error.response?.status === 422) {
                
            } else if (error.response?.status === 403) {
                
            }
        }
    }

    async checkProxyStatus() {
        
        
        try {
            const response = await axios.get('http://localhost:8080/health', { timeout: 3000 });
            
            
            this.results.proxyRunning = true;
        } catch (error) {
            
            
            ');
            
        }
    }

    async generateReport() {
        
        
        
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
            
        });
        
        
        
        if (passed === total) {
            
            
        } else {
            
        }
        
        // Specific recommendations
        if (!this.results.apiKey || !this.results.authentication) {
            
            
            
            
        }
        
        if (!this.results.proxyRunning) {
            
            
        }
        
        if (this.results.canCreateRuns) {
            
            
            
            
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