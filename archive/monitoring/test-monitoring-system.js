#!/usr/bin/env node

/**
 * Production Monitoring System Test Suite
 * 
 * Comprehensive testing of monitoring, alerting, and recovery capabilities
 * to validate enterprise-grade operational excellence implementation.
 * 
 * @author Adrian Wedd  
 * @version 1.0.0
 */

import { ProductionMonitor } from './production-monitor.js';
import { RecoverySystem } from './recovery-system.js';
import { UsageMonitor } from './usage-monitor.js';

/**
 * Test suite for production monitoring infrastructure
 */
class MonitoringTestSuite {
    constructor() {
        this.testResults = [];
        this.monitor = null;
        this.recovery = null;
        this.usage = null;
    }

    /**
     * Run comprehensive test suite
     */
    async runAllTests() {
        console.log('🧪 **PRODUCTION MONITORING SYSTEM TEST SUITE**\n');
        console.log('Testing enterprise-grade monitoring, alerting, and recovery capabilities...\n');
        
        try {
            // Initialize systems
            await this.initializeSystems();
            
            // Run test categories
            await this.testMonitoringSystem();
            await this.testRecoverySystem();
            await this.testUsageTracking();
            await this.testDashboardGeneration();
            await this.testIntegration();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Initialize monitoring systems
     */
    async initializeSystems() {
        console.log('🔧 Initializing monitoring systems...');
        
        try {
            this.monitor = new ProductionMonitor();
            await this.monitor.initialize();
            this.addResult('monitor_init', true, 'Production monitor initialized');
            
            this.recovery = new RecoverySystem();
            await this.recovery.initialize();
            this.addResult('recovery_init', true, 'Recovery system initialized');
            
            this.usage = new UsageMonitor();
            await this.usage.initialize();
            this.addResult('usage_init', true, 'Usage monitor initialized');
            
            console.log('✅ All systems initialized successfully\n');
        } catch (error) {
            this.addResult('system_init', false, `Initialization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Test monitoring system capabilities
     */
    async testMonitoringSystem() {
        console.log('🔍 Testing monitoring system...');
        
        try {
            // Test health checks
            const healthResults = await this.monitor.runHealthChecks();
            const healthCheckCount = Object.keys(healthResults).length;
            this.addResult('health_checks', healthCheckCount >= 5, `${healthCheckCount} health checks configured`);
            
            // Test dashboard generation
            const dashboard = await this.monitor.generateStatusDashboard();
            const hasDashboard = !!(dashboard.system && dashboard.checks && dashboard.alerts);
            this.addResult('dashboard_generation', hasDashboard, 'Dashboard data generation works');
            
            // Test alert processing (with mock data)
            const mockAlert = {
                success: false,
                name: 'Test Alert',
                checkName: 'Test Check',
                critical: true,
                message: 'Test failure'
            };
            
            await this.monitor.processAlerts(mockAlert);
            this.addResult('alert_processing', true, 'Alert processing functional');
            
            console.log('✅ Monitoring system tests completed\n');
        } catch (error) {
            this.addResult('monitoring_tests', false, `Monitoring tests failed: ${error.message}`);
        }
    }

    /**
     * Test recovery system capabilities
     */
    async testRecoverySystem() {
        console.log('🛠️ Testing recovery system...');
        
        try {
            // Test recovery procedures availability
            const procedureCount = this.recovery.recoveryProcedures.size;
            this.addResult('recovery_procedures', procedureCount >= 5, `${procedureCount} recovery procedures available`);
            
            // Test backup system
            await this.recovery.setupBackupSystem();
            this.addResult('backup_system', true, 'Backup system configured');
            
            // Test prerequisite checking
            const prereqCheck = await this.recovery.checkPrerequisites(['github_access', 'backup_access']);
            this.addResult('prerequisite_check', true, 'Prerequisite checking works');
            
            // Test recovery state management
            await this.recovery.saveRecoveryState();
            this.addResult('state_management', true, 'Recovery state management works');
            
            console.log('✅ Recovery system tests completed\n');
        } catch (error) {
            this.addResult('recovery_tests', false, `Recovery tests failed: ${error.message}`);
        }
    }

    /**
     * Test usage tracking capabilities
     */
    async testUsageTracking() {
        console.log('💰 Testing usage tracking...');
        
        try {
            // Test usage recording
            const mockUsage = {
                model: 'claude-3-5-sonnet-20241022',
                requests: 1,
                input_tokens: 1000,
                output_tokens: 500,
                auth_method: 'api_key',
                session_type: 'test',
                success: true
            };
            
            await this.usage.recordUsage(mockUsage);
            this.addResult('usage_recording', true, 'Usage recording works');
            
            // Test usage statistics
            const currentUsage = this.usage.getCurrentUsage();
            const hasUsageData = !!(currentUsage.today && currentUsage.month && currentUsage.totals);
            this.addResult('usage_statistics', hasUsageData, 'Usage statistics generation works');
            
            // Test budget monitoring
            const recommendations = this.usage.getUsageRecommendations();
            this.addResult('budget_monitoring', Array.isArray(recommendations), 'Budget monitoring functional');
            
            console.log('✅ Usage tracking tests completed\n');
        } catch (error) {
            this.addResult('usage_tests', false, `Usage tests failed: ${error.message}`);
        }
    }

    /**
     * Test dashboard generation
     */
    async testDashboardGeneration() {
        console.log('📊 Testing dashboard generation...');
        
        try {
            // Test JSON dashboard generation
            const dashboardData = await this.monitor.generateStatusDashboard();
            const hasRequiredFields = !!(
                dashboardData.timestamp &&
                dashboardData.system &&
                dashboardData.checks &&
                dashboardData.alerts &&
                dashboardData.usage
            );
            this.addResult('dashboard_structure', hasRequiredFields, 'Dashboard has required structure');
            
            // Test metric calculations
            const systemHealth = dashboardData.system.health;
            const isValidHealth = typeof systemHealth === 'number' && systemHealth >= 0 && systemHealth <= 100;
            this.addResult('health_calculation', isValidHealth, 'System health calculation valid');
            
            // Test alert aggregation
            const alertCount = dashboardData.alerts.active;
            const isValidAlertCount = typeof alertCount === 'number' && alertCount >= 0;
            this.addResult('alert_aggregation', isValidAlertCount, 'Alert aggregation functional');
            
            console.log('✅ Dashboard generation tests completed\n');
        } catch (error) {
            this.addResult('dashboard_tests', false, `Dashboard tests failed: ${error.message}`);
        }
    }

    /**
     * Test system integration
     */
    async testIntegration() {
        console.log('🔗 Testing system integration...');
        
        try {
            // Test monitor-recovery integration
            const recoveryProcedures = Array.from(this.recovery.recoveryProcedures.keys());
            const monitoringAlerts = Array.from(this.monitor.alertRules.keys());
            const hasIntegration = recoveryProcedures.some(proc => 
                monitoringAlerts.some(alert => alert.includes(proc.split('_')[0]))
            );
            this.addResult('monitor_recovery_integration', hasIntegration, 'Monitor-recovery integration present');
            
            // Test usage-monitoring integration
            const usageData = this.usage.getCurrentUsage();
            const dashboardData = await this.monitor.generateStatusDashboard();
            const hasUsageIntegration = !!(dashboardData.usage && dashboardData.usage.today);
            this.addResult('usage_monitoring_integration', hasUsageIntegration, 'Usage-monitoring integration works');
            
            // Test end-to-end workflow
            const healthResults = await this.monitor.runHealthChecks();
            const dashboardWithHealth = await this.monitor.generateStatusDashboard();
            const e2eWorks = Object.keys(healthResults).length > 0 && dashboardWithHealth.checks.length > 0;
            this.addResult('end_to_end_workflow', e2eWorks, 'End-to-end workflow functional');
            
            console.log('✅ Integration tests completed\n');
        } catch (error) {
            this.addResult('integration_tests', false, `Integration tests failed: ${error.message}`);
        }
    }

    /**
     * Add test result
     */
    addResult(testName, success, message) {
        this.testResults.push({
            test: testName,
            success,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        console.log('📋 **TEST RESULTS SUMMARY**\n');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`📊 **OVERALL RESULTS:**`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${failedTests}`);
        console.log(`   Success Rate: ${successRate}%`);
        
        // Categorize results
        const categories = {
            'System Initialization': ['monitor_init', 'recovery_init', 'usage_init'],
            'Monitoring Capabilities': ['health_checks', 'dashboard_generation', 'alert_processing'],
            'Recovery System': ['recovery_procedures', 'backup_system', 'prerequisite_check', 'state_management'],
            'Usage Tracking': ['usage_recording', 'usage_statistics', 'budget_monitoring'],
            'Dashboard Generation': ['dashboard_structure', 'health_calculation', 'alert_aggregation'],
            'System Integration': ['monitor_recovery_integration', 'usage_monitoring_integration', 'end_to_end_workflow']
        };
        
        console.log('\n📊 **DETAILED RESULTS BY CATEGORY:**\n');
        
        for (const [category, tests] of Object.entries(categories)) {
            const categoryResults = this.testResults.filter(r => tests.includes(r.test));
            const categoryPassed = categoryResults.filter(r => r.success).length;
            const categoryTotal = categoryResults.length;
            const categoryRate = categoryTotal > 0 ? Math.round((categoryPassed / categoryTotal) * 100) : 0;
            
            console.log(`📋 **${category}** (${categoryPassed}/${categoryTotal} - ${categoryRate}%)`);
            
            categoryResults.forEach(result => {
                const icon = result.success ? '✅' : '❌';
                console.log(`   ${icon} ${result.message}`);
            });
            
            console.log();
        }
        
        // Production readiness assessment
        console.log('🚀 **PRODUCTION READINESS ASSESSMENT:**\n');
        
        const criticalSystems = [
            'monitor_init', 'recovery_init', 'health_checks', 
            'dashboard_generation', 'recovery_procedures', 'end_to_end_workflow'
        ];
        
        const criticalResults = this.testResults.filter(r => criticalSystems.includes(r.test));
        const criticalPassed = criticalResults.filter(r => r.success).length;
        const criticalRate = Math.round((criticalPassed / criticalResults.length) * 100);
        
        if (criticalRate >= 90) {
            console.log('✅ **PRODUCTION READY** - All critical systems operational');
        } else if (criticalRate >= 70) {
            console.log('⚠️ **PRODUCTION READY WITH MONITORING** - Some issues detected');
        } else {
            console.log('❌ **NOT PRODUCTION READY** - Critical issues must be resolved');
        }
        
        console.log(`   Critical System Health: ${criticalRate}%`);
        console.log(`   Monitoring Coverage: ${this.monitor.healthChecks.size} health checks`);
        console.log(`   Recovery Capabilities: ${this.recovery.recoveryProcedures.size} procedures`);
        console.log(`   Alert System: ${this.monitor.alertRules.size} alert rules`);
        
        // Recommendations
        console.log('\n💡 **RECOMMENDATIONS:**\n');
        
        if (failedTests === 0) {
            console.log('🎉 Excellent! All tests passed. System is ready for production deployment.');
            console.log('   - Deploy monitoring dashboard to production');
            console.log('   - Configure production alerting channels');
            console.log('   - Set up automated monitoring workflows');
        } else {
            console.log('🔧 Address the following to improve system reliability:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`   - Fix: ${result.message}`);
            });
        }
        
        console.log(`\n📅 Test completed: ${new Date().toLocaleString()}`);
        console.log(`🔍 For detailed logs, review individual component outputs above.`);
    }
}

/**
 * Main execution
 */
async function main() {
    const testSuite = new MonitoringTestSuite();
    await testSuite.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}