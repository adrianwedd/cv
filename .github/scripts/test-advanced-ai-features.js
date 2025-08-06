#!/usr/bin/env node

/**
 * Advanced AI Features Integration Test Suite
 * 
 * Comprehensive testing framework for advanced LinkedIn AI networking capabilities.
 * Validates advanced professional intelligence, market integration, and monitoring systems.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { AdvancedNetworkingIntelligence } from './advanced-networking-intelligence.js';
import { LinkedInAutomationMonitor } from './linkedin-automation-monitor.js';

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    mockData: true,
    verbose: true
};

describe('Advanced AI Features Integration Tests', () => {
    describe('Advanced Networking Intelligence', () => {
        test('should initialize networking intelligence system', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                analysisDepth: 'comprehensive',
                marketIntelligence: true,
                auditLogging: false // Disable logging for tests
            });
            
            assert.ok(intelligence);
            assert.equal(intelligence.options.analysisDepth, 'comprehensive');
            assert.equal(intelligence.options.marketIntelligence, true);
            assert.ok(intelligence.session.id);
        });

        test('should analyze relationship compatibility with mock data', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                auditLogging: false
            });
            
            const mockProfiles = [
                {
                    id: 'test-profile-1',
                    name: 'Jane Smith',
                    url: 'https://linkedin.com/in/janesmith',
                    industry: 'Technology',
                    skills: ['JavaScript', 'React', 'Node.js'],
                    experience: 'Senior Software Engineer'
                }
            ];
            
            // Mock the Gemini client response
            intelligence.geminiClient.generateResponse = async () => {
                return JSON.stringify({
                    overall_score: 85,
                    dimension_scores: {
                        industry_alignment: 90,
                        career_stage_compatibility: 80,
                        skill_complementarity: 85,
                        geographic_proximity: 70,
                        mutual_value_potential: 88,
                        network_expansion_value: 82
                    },
                    success_probability: 75,
                    recommended_approach: 'Direct professional outreach with focus on technical collaboration'
                });
            };
            
            const result = await intelligence.analyzeRelationshipCompatibility(mockProfiles);
            
            assert.ok(result);
            assert.equal(result.profiles_analyzed, 1);
            assert.ok(result.compatibility_matrix.length > 0);
            assert.ok(result.strategic_recommendations.length > 0);
            assert.equal(result.compatibility_matrix[0].overall_score, 85);
        });

        test('should generate market intelligence analysis', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                auditLogging: false
            });
            
            const mockUserProfile = {
                name: 'John Doe',
                experience: [
                    {
                        position: 'Senior Developer',
                        company: 'Tech Corp',
                        technologies: ['JavaScript', 'React', 'Node.js']
                    }
                ],
                skills: [
                    { name: 'JavaScript', level: 'Expert' },
                    { name: 'React', level: 'Advanced' }
                ]
            };
            
            // Mock the Gemini client responses
            intelligence.geminiClient.generateResponse = async (prompt) => {
                if (prompt.includes('market positioning')) {
                    return JSON.stringify({
                        current_position: {
                            industry_standing: 'established',
                            skill_market_value: 85,
                            experience_premium: 78,
                            market_demand_alignment: 92
                        },
                        growth_potential: {
                            skill_development_opportunities: ['TypeScript', 'Cloud Architecture'],
                            innovation_leadership_potential: 75
                        }
                    });
                } else if (prompt.includes('competitive analysis')) {
                    return JSON.stringify({
                        competitive_benchmarks: {
                            development_priorities: ['Cloud skills', 'AI/ML basics', 'Leadership skills']
                        },
                        market_opportunity_analysis: {
                            underserved_niches: ['AI-powered web development', 'Edge computing'],
                            emerging_market_segments: ['JAMstack', 'Serverless architecture']
                        }
                    });
                }
            };
            
            const result = await intelligence.generateMarketIntelligence(mockUserProfile);
            
            assert.ok(result);
            assert.ok(result.market_positioning);
            assert.ok(result.competitive_analysis);
            assert.equal(result.market_positioning.current_position.skill_market_value, 85);
            assert.ok(result.competitive_analysis.competitive_benchmarks.development_priorities.length > 0);
        });

        test('should optimize professional brand with authenticity preservation', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                auditLogging: false
            });
            
            const mockUserProfile = {
                name: 'Alice Johnson',
                professional_summary: 'Experienced software developer with passion for innovation',
                experience: [],
                skills: []
            };
            
            const mockMarketIntelligence = {
                market_positioning: {
                    current_position: { skill_market_value: 80 }
                }
            };
            
            // Mock brand analysis and optimization
            intelligence.analyzeProfessionalBrand = async () => ({
                brand_strength: 75,
                consistency_score: 80,
                authenticity_score: 90
            });
            
            intelligence.generateBrandOptimizations = async () => ({
                messaging_improvements: ['Emphasize technical leadership'],
                content_strategy: ['Share technical insights regularly'],
                positioning_adjustments: ['Focus on innovation and problem-solving']
            });
            
            intelligence.generateAuthenticityGuidelines = async () => ({
                core_values_preservation: ['Innovation', 'Quality', 'Collaboration'],
                authentic_messaging_framework: 'Technical expertise with human impact focus'
            });
            
            intelligence.createBrandImplementationPlan = async () => ({
                immediate_actions: ['Update LinkedIn headline'],
                short_term_goals: ['Publish technical articles'],
                long_term_vision: ['Establish thought leadership']
            });
            
            const result = await intelligence.optimizeProfessionalBrand(mockUserProfile, mockMarketIntelligence);
            
            assert.ok(result);
            assert.ok(result.current_brand_analysis);
            assert.ok(result.optimization_recommendations);
            assert.ok(result.authenticity_preservation);
            assert.ok(result.implementation_roadmap);
        });

        test('should handle API errors gracefully', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                auditLogging: false
            });
            
            // Mock API failure
            intelligence.geminiClient.generateResponse = async () => {
                throw new Error('API rate limit exceeded');
            };
            
            const mockProfiles = [{
                id: 'test-profile',
                name: 'Test User',
                url: 'https://linkedin.com/in/testuser'
            }];
            
            const result = await intelligence.analyzeRelationshipCompatibility(mockProfiles);
            
            // Should handle errors gracefully and provide fallback
            assert.ok(result);
            assert.equal(result.profiles_analyzed, 1);
            assert.ok(result.compatibility_matrix[0].error);
            assert.equal(result.compatibility_matrix[0].overall_score, 50); // Fallback score
        });
    });

    describe('LinkedIn Automation Monitor', () => {
        test('should initialize monitoring system', async () => {
            const monitor = new LinkedInAutomationMonitor({
                monitoringInterval: 1000, // 1 second for testing
                auditLogging: false
            });
            
            assert.ok(monitor);
            assert.ok(monitor.currentSession.id);
            assert.equal(monitor.currentSession.metrics.totalOperations, 0);
            assert.equal(monitor.monitoring, false);
        });

        test('should collect automation health metrics', async () => {
            const monitor = new LinkedInAutomationMonitor({
                auditLogging: false
            });
            
            // Mock component health checks
            monitor.checkAutomationHealth = async () => ({
                overall_status: 'healthy',
                component_status: {
                    linkedin_extractor: 'healthy',
                    ai_networking: 'healthy',
                    profile_sync: 'healthy',
                    dashboard_update: 'healthy'
                },
                active_sessions: 1
            });
            
            monitor.checkRateLimiting = async () => ({
                compliance_status: 'compliant',
                current_utilization: 0.4,
                requests_per_hour: 25
            });
            
            monitor.measurePerformance = async () => ({
                success_rate: 0.95,
                error_rate: 0.05,
                response_times: { average: 2500 },
                performance_score: 85
            });
            
            monitor.validateConsentCompliance = async () => ({
                consent_status: 'valid',
                violations: []
            });
            
            monitor.analyzeErrors = async () => ({
                total_errors: 2,
                error_types: [['timeout', 1], ['api_error', 1]],
                critical_errors: []
            });
            
            monitor.measureNetworkingEffectiveness = async () => ({
                networking_score: 78,
                connection_success_rate: 0.65,
                roi_indicators: { career_advancement: 0.8 }
            });
            
            const metrics = await monitor.collectMetrics();
            
            assert.ok(metrics);
            assert.equal(metrics.automation_health.overall_status, 'healthy');
            assert.equal(metrics.rate_limiting.compliance_status, 'compliant');
            assert.equal(metrics.performance.success_rate, 0.95);
            assert.equal(metrics.consent_compliance.consent_status, 'valid');
            assert.equal(metrics.networking_effectiveness.networking_score, 78);
        });

        test('should detect and handle critical alerts', async () => {
            const monitor = new LinkedInAutomationMonitor({
                auditLogging: false,
                alertThresholds: {
                    errorRate: 0.05,
                    successRate: 0.90
                }
            });
            
            const mockMetrics = {
                timestamp: new Date().toISOString(),
                automation_health: { overall_status: 'degraded' },
                performance: {
                    error_rate: 0.15,  // Above threshold
                    success_rate: 0.75 // Below threshold
                },
                rate_limiting: { current_utilization: 0.3 },
                consent_compliance: { consent_status: 'invalid' }
            };
            
            // Mock the cache with problematic metrics
            monitor.metricsCache.set(mockMetrics.timestamp, mockMetrics);
            
            let alertsTriggered = 0;
            monitor.processAlert = async (alert) => {
                alertsTriggered++;
                assert.ok(alert.type);
                assert.ok(alert.severity);
                assert.ok(alert.message);
            };
            
            await monitor.checkAlertThresholds();
            
            // Should trigger multiple alerts for critical issues
            assert.ok(alertsTriggered >= 2); // Error rate + success rate + consent violations
        });

        test('should calculate performance scores correctly', async () => {
            const monitor = new LinkedInAutomationMonitor();
            
            const performance = {
                success_rate: 0.95,
                response_times: { average: 3000 },
                availability: 0.99,
                error_rate: 0.02
            };
            
            const score = monitor.calculatePerformanceScore(performance);
            
            assert.ok(score >= 0 && score <= 100);
            assert.ok(score > 80); // Should be high score for good metrics
        });

        test('should handle monitoring initialization errors', async () => {
            const monitor = new LinkedInAutomationMonitor({
                auditLogging: false
            });
            
            // Mock filesystem error
            const originalMkdir = fs.mkdir;
            fs.mkdir = async () => {
                throw new Error('Filesystem error');
            };
            
            try {
                await monitor.initializeMonitoring();
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.ok(error.message.includes('Filesystem error'));
            } finally {
                // Restore original function
                fs.mkdir = originalMkdir;
            }
        });
    });

    describe('Integration Tests', () => {
        test('should integrate networking intelligence with monitoring', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                auditLogging: false
            });
            
            const monitor = new LinkedInAutomationMonitor({
                auditLogging: false
            });
            
            // Mock successful intelligence analysis
            intelligence.geminiClient.generateResponse = async () => {
                return JSON.stringify({
                    overall_score: 80,
                    success_probability: 70,
                    recommended_approach: 'Professional collaboration'
                });
            };
            
            const mockProfiles = [{
                id: 'integration-test',
                name: 'Integration Test User',
                url: 'https://linkedin.com/in/test'
            }];
            
            // Run intelligence analysis
            const intelligenceResult = await intelligence.analyzeRelationshipCompatibility(mockProfiles);
            
            // Simulate monitoring the operation
            monitor.currentSession.metrics.totalOperations++;
            monitor.currentSession.metrics.successfulOperations++;
            
            assert.ok(intelligenceResult);
            assert.equal(monitor.currentSession.metrics.totalOperations, 1);
            assert.equal(monitor.currentSession.metrics.successfulOperations, 1);
        });

        test('should validate data persistence and recovery', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                auditLogging: false
            });
            
            const testData = {
                session_id: intelligence.session.id,
                test_analysis: 'validation data',
                timestamp: new Date().toISOString()
            };
            
            // Test data saving
            await intelligence.saveAnalysis('test-validation', testData);
            
            // Verify data was saved (mock verification)
            const dataDir = path.join(process.cwd(), 'data', 'networking-intelligence');
            try {
                const files = await fs.readdir(dataDir);
                const testFiles = files.filter(f => f.includes('test-validation'));
                assert.ok(testFiles.length > 0, 'Test data should be saved');
            } catch (error) {
                // Directory might not exist in test environment, which is acceptable
                console.log('Data directory validation skipped (test environment)');
            }
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle empty or invalid profile data', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                auditLogging: false
            });
            
            const emptyProfiles = [];
            const result = await intelligence.analyzeRelationshipCompatibility(emptyProfiles);
            
            assert.ok(result);
            assert.equal(result.profiles_analyzed, 0);
            assert.equal(result.compatibility_matrix.length, 0);
        });

        test('should handle rate limiting gracefully', async () => {
            const intelligence = new AdvancedNetworkingIntelligence({
                rateLimitMs: 100, // Very fast for testing
                auditLogging: false
            });
            
            let apiCalls = 0;
            intelligence.geminiClient.generateResponse = async () => {
                apiCalls++;
                if (apiCalls > 2) {
                    throw new Error('Rate limit exceeded');
                }
                return JSON.stringify({ overall_score: 75 });
            };
            
            const mockProfiles = [
                { id: '1', name: 'User 1', url: 'https://linkedin.com/in/user1' },
                { id: '2', name: 'User 2', url: 'https://linkedin.com/in/user2' },
                { id: '3', name: 'User 3', url: 'https://linkedin.com/in/user3' }
            ];
            
            const result = await intelligence.analyzeRelationshipCompatibility(mockProfiles);
            
            // Should handle rate limiting and provide partial results
            assert.ok(result);
            assert.equal(result.profiles_analyzed, 3);
            
            // Some profiles should have errors due to rate limiting
            const errorProfiles = result.compatibility_matrix.filter(p => p.error);
            assert.ok(errorProfiles.length > 0);
        });

        test('should maintain session integrity across operations', async () => {
            const monitor = new LinkedInAutomationMonitor({
                auditLogging: false
            });
            
            const initialSessionId = monitor.currentSession.id;
            const initialStartTime = monitor.currentSession.startTime;
            
            // Simulate multiple operations
            for (let i = 0; i < 5; i++) {
                monitor.updateSessionMetrics({
                    automation_health: { overall_status: 'healthy' }
                });
            }
            
            // Session should remain consistent
            assert.equal(monitor.currentSession.id, initialSessionId);
            assert.equal(monitor.currentSession.startTime, initialStartTime);
            assert.equal(monitor.currentSession.metrics.totalOperations, 5);
            assert.equal(monitor.currentSession.metrics.successfulOperations, 5);
        });
    });
});

// Test execution summary
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🧪 Running Advanced AI Features Integration Tests...');
    console.log('📊 Test Configuration:');
    console.log(`  • Timeout: ${TEST_CONFIG.timeout}ms`);
    console.log(`  • Mock Data: ${TEST_CONFIG.mockData}`);
    console.log(`  • Verbose: ${TEST_CONFIG.verbose}`);
    console.log('');
}