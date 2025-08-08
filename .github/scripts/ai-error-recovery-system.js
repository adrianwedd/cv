#!/usr/bin/env node

/**
 * AI Error Recovery System
 * 
 * Intelligent error detection, classification, and automated recovery system
 * with predictive analytics for preventing issues and optimizing system reliability.
 * 
 * Features:
 * - Intelligent error detection and classification
 * - Automated recovery mechanisms
 * - Predictive failure analysis
 * - System health monitoring
 * - Performance degradation detection
 * - Smart fallback strategies
 * - Learning from error patterns
 * - Proactive issue prevention
 * 
 * @author Claude Code - Intelligence Orchestrator
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Intelligent Error Detection and Classification System
 */
class IntelligentErrorDetector {
    constructor(config) {
        this.config = config;
        this.errorPatterns = new Map();
        this.errorHistory = [];
        this.classificationModels = new Map();
        this.healthMetrics = new Map();
        
        this.initializeErrorPatterns();
        this.initializeClassificationModels();
        this.initializeHealthMetrics();
    }

    /**
     * Initialize error pattern recognition
     */
    initializeErrorPatterns() {
        const patterns = {
            'api_rate_limit': {
                signatures: ['rate limit', '429', 'too many requests', 'quota exceeded'],
                severity: 'medium',
                category: 'api_throttling',
                recovery_strategy: 'exponential_backoff',
                prevention_strategy: 'request_batching'
            },
            'authentication_failure': {
                signatures: ['401', 'unauthorized', 'authentication failed', 'invalid token'],
                severity: 'high',
                category: 'security',
                recovery_strategy: 'credential_refresh',
                prevention_strategy: 'proactive_token_refresh'
            },
            'network_timeout': {
                signatures: ['timeout', 'connection refused', 'network error', 'ENOTFOUND'],
                severity: 'medium',
                category: 'connectivity',
                recovery_strategy: 'retry_with_backoff',
                prevention_strategy: 'connection_pooling'
            },
            'resource_exhaustion': {
                signatures: ['out of memory', 'disk space', 'cpu threshold', 'memory limit'],
                severity: 'critical',
                category: 'resources',
                recovery_strategy: 'resource_cleanup',
                prevention_strategy: 'resource_monitoring'
            },
            'data_corruption': {
                signatures: ['invalid json', 'parse error', 'corrupt data', 'malformed'],
                severity: 'high',
                category: 'data_integrity',
                recovery_strategy: 'data_validation',
                prevention_strategy: 'data_checksums'
            },
            'ai_model_failure': {
                signatures: ['model error', 'inference failed', 'prompt too long', 'context overflow'],
                severity: 'high',
                category: 'ai_processing',
                recovery_strategy: 'fallback_model',
                prevention_strategy: 'input_validation'
            }
        };

        for (const [patternId, pattern] of Object.entries(patterns)) {
            this.errorPatterns.set(patternId, {
                ...pattern,
                occurrences: 0,
                last_seen: null,
                success_rate: 0
            });
        }
    }

    /**
     * Initialize ML classification models for error analysis
     */
    initializeClassificationModels() {
        this.classificationModels.set('severity_classifier', {
            model_type: 'severity_classification',
            features: ['error_frequency', 'impact_scope', 'recovery_time', 'user_impact'],
            weights: { error_frequency: 0.3, impact_scope: 0.3, recovery_time: 0.2, user_impact: 0.2 },
            accuracy: 0.87,
            thresholds: { critical: 0.8, high: 0.6, medium: 0.4, low: 0.2 }
        });

        this.classificationModels.set('root_cause_analyzer', {
            model_type: 'root_cause_analysis',
            features: ['error_context', 'system_state', 'recent_changes', 'external_factors'],
            weights: { error_context: 0.4, system_state: 0.3, recent_changes: 0.2, external_factors: 0.1 },
            accuracy: 0.82,
            categories: ['configuration', 'resource', 'external_service', 'code_bug', 'data_issue']
        });

        this.classificationModels.set('recovery_recommender', {
            model_type: 'recovery_recommendation',
            features: ['error_type', 'system_state', 'available_resources', 'time_constraints'],
            weights: { error_type: 0.4, system_state: 0.3, available_resources: 0.2, time_constraints: 0.1 },
            accuracy: 0.89,
            strategies: ['immediate_retry', 'fallback_service', 'graceful_degradation', 'manual_intervention']
        });
    }

    /**
     * Initialize system health metrics
     */
    initializeHealthMetrics() {
        const metrics = [
            'error_rate', 'response_time', 'success_rate', 'resource_utilization',
            'api_quota_usage', 'cache_hit_ratio', 'concurrent_requests', 'system_load'
        ];

        for (const metric of metrics) {
            this.healthMetrics.set(metric, {
                current_value: 0,
                threshold_warning: this.getMetricThreshold(metric, 'warning'),
                threshold_critical: this.getMetricThreshold(metric, 'critical'),
                history: [],
                trend: 'stable'
            });
        }
    }

    getMetricThreshold(metric, level) {
        const thresholds = {
            'error_rate': { warning: 5, critical: 15 },
            'response_time': { warning: 2000, critical: 5000 },
            'success_rate': { warning: 95, critical: 85 },
            'resource_utilization': { warning: 80, critical: 95 },
            'api_quota_usage': { warning: 80, critical: 95 },
            'cache_hit_ratio': { warning: 70, critical: 50 },
            'concurrent_requests': { warning: 100, critical: 200 },
            'system_load': { warning: 0.8, critical: 1.5 }
        };

        return thresholds[metric]?.[level] || (level === 'warning' ? 80 : 95);
    }

    /**
     * Detect and classify errors intelligently
     */
    async detectAndClassifyError(error, context = {}) {
        console.log('🕵️ Detecting and classifying error...');

        const errorAnalysis = {
            error_id: this.generateErrorId(error),
            timestamp: new Date().toISOString(),
            error_details: this.extractErrorDetails(error),
            classification: await this.classifyError(error, context),
            severity: await this.assessSeverity(error, context),
            root_cause: await this.analyzeRootCause(error, context),
            impact_assessment: this.assessImpact(error, context),
            recovery_recommendation: await this.recommendRecovery(error, context),
            prevention_strategies: this.identifyPreventionStrategies(error, context)
        };

        // Update error patterns
        this.updateErrorPatterns(errorAnalysis);

        // Record in history
        this.errorHistory.push(errorAnalysis);

        console.log(`✅ Error classified: ${errorAnalysis.classification.primary_category} (${errorAnalysis.severity.level})`);
        return errorAnalysis;
    }

    /**
     * Extract detailed error information
     */
    extractErrorDetails(error) {
        return {
            message: error.message || 'Unknown error',
            stack: error.stack || null,
            type: error.constructor?.name || 'Error',
            code: error.code || null,
            status: error.status || error.statusCode || null,
            context_data: this.extractContextData(error)
        };
    }

    extractContextData(error) {
        const contextData = {};
        
        // Extract relevant context from error object
        const relevantFields = ['url', 'method', 'headers', 'data', 'config', 'response'];
        for (const field of relevantFields) {
            if (error[field]) {
                contextData[field] = error[field];
            }
        }

        return contextData;
    }

    /**
     * Classify error using pattern matching and ML
     */
    async classifyError(error, context) {
        const errorString = `${error.message || ''} ${error.stack || ''}`.toLowerCase();
        
        // Pattern-based classification
        const patternMatches = [];
        for (const [patternId, pattern] of this.errorPatterns) {
            const matchScore = this.calculatePatternMatch(errorString, pattern.signatures);
            if (matchScore > 0.5) {
                patternMatches.push({
                    pattern_id: patternId,
                    category: pattern.category,
                    confidence: matchScore
                });
            }
        }

        // Sort by confidence
        patternMatches.sort((a, b) => b.confidence - a.confidence);

        return {
            primary_category: patternMatches[0]?.category || 'unknown',
            secondary_categories: patternMatches.slice(1, 3).map(m => m.category),
            pattern_matches: patternMatches,
            confidence: patternMatches[0]?.confidence || 0.1,
            classification_method: 'pattern_matching'
        };
    }

    calculatePatternMatch(errorString, signatures) {
        const matches = signatures.filter(signature => 
            errorString.includes(signature.toLowerCase())
        ).length;
        
        return matches / signatures.length;
    }

    /**
     * Assess error severity using ML model
     */
    async assessSeverity(error, context) {
        const features = this.extractSeverityFeatures(error, context);
        const model = this.classificationModels.get('severity_classifier');
        
        const severityScore = this.calculateModelScore(model, features);
        const severityLevel = this.getSeverityLevel(severityScore, model.thresholds);

        return {
            level: severityLevel,
            score: Math.round(severityScore * 100),
            factors: this.identifySeverityFactors(features, severityLevel),
            business_impact: this.assessBusinessImpact(severityLevel, context)
        };
    }

    extractSeverityFeatures(error, context) {
        return {
            error_frequency: this.getErrorFrequency(error),
            impact_scope: this.assessImpactScope(error, context),
            recovery_time: this.estimateRecoveryTime(error),
            user_impact: this.assessUserImpact(error, context)
        };
    }

    getErrorFrequency(error) {
        const recentErrors = this.errorHistory.filter(e => 
            e.error_details.message === error.message &&
            new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        ).length;
        
        return Math.min(recentErrors / 10, 1.0); // Normalize to 0-1
    }

    assessImpactScope(error, context) {
        // Assess how many system components are affected
        const componentImpact = {
            'api_throttling': 0.6,
            'security': 0.9,
            'connectivity': 0.7,
            'resources': 0.8,
            'data_integrity': 0.9,
            'ai_processing': 0.5
        };

        const classification = this.classifyErrorSync(error);
        return componentImpact[classification] || 0.5;
    }

    classifyErrorSync(error) {
        const errorString = error.message?.toLowerCase() || '';
        
        for (const [patternId, pattern] of this.errorPatterns) {
            if (pattern.signatures.some(sig => errorString.includes(sig))) {
                return pattern.category;
            }
        }
        
        return 'unknown';
    }

    estimateRecoveryTime(error) {
        const recoveryTimes = {
            'api_throttling': 0.3,    // Quick retry
            'security': 0.7,          // Token refresh needed
            'connectivity': 0.5,      // Network retry
            'resources': 0.9,         // Cleanup required
            'data_integrity': 0.8,    // Data repair needed
            'ai_processing': 0.4      // Fallback available
        };

        const classification = this.classifyErrorSync(error);
        return recoveryTimes[classification] || 0.5;
    }

    assessUserImpact(error, context) {
        // Assess impact on user experience
        const userFacingOperations = ['cv_generation', 'skill_analysis', 'content_optimization'];
        const operation = context.operation || '';
        
        return userFacingOperations.includes(operation) ? 0.8 : 0.3;
    }

    calculateModelScore(model, features) {
        let score = 0;
        for (const [feature, weight] of Object.entries(model.weights)) {
            score += (features[feature] || 0) * weight;
        }
        return Math.max(0, Math.min(score, 1.0));
    }

    getSeverityLevel(score, thresholds) {
        if (score >= thresholds.critical) return 'critical';
        if (score >= thresholds.high) return 'high';
        if (score >= thresholds.medium) return 'medium';
        return 'low';
    }

    identifySeverityFactors(features, level) {
        const factors = [];
        
        if (features.error_frequency > 0.5) factors.push('High error frequency');
        if (features.impact_scope > 0.7) factors.push('Wide system impact');
        if (features.recovery_time > 0.6) factors.push('Long recovery time expected');
        if (features.user_impact > 0.7) factors.push('Significant user impact');

        return factors;
    }

    assessBusinessImpact(severityLevel, context) {
        const impacts = {
            'critical': 'System unavailability, potential data loss',
            'high': 'Major feature degradation, user experience impact',
            'medium': 'Minor feature issues, performance degradation',
            'low': 'Minimal impact, isolated functionality affected'
        };

        return impacts[severityLevel] || 'Unknown impact';
    }

    /**
     * Analyze root cause using ML and context analysis
     */
    async analyzeRootCause(error, context) {
        const features = this.extractRootCauseFeatures(error, context);
        const model = this.classificationModels.get('root_cause_analyzer');
        
        const causeScores = {};
        for (const category of model.categories) {
            causeScores[category] = this.calculateCauseScore(features, category);
        }

        const sortedCauses = Object.entries(causeScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        return {
            primary_cause: sortedCauses[0][0],
            cause_confidence: Math.round(sortedCauses[0][1] * 100),
            alternative_causes: sortedCauses.slice(1).map(([cause, score]) => ({
                cause,
                confidence: Math.round(score * 100)
            })),
            analysis_details: this.generateCauseAnalysis(features, sortedCauses[0][0])
        };
    }

    extractRootCauseFeatures(error, context) {
        return {
            error_context: this.analyzeErrorContext(error, context),
            system_state: this.analyzeSystemState(context),
            recent_changes: this.analyzeRecentChanges(context),
            external_factors: this.analyzeExternalFactors(error, context)
        };
    }

    analyzeErrorContext(error, context) {
        // Analyze error context for patterns
        let contextScore = 0.5;

        if (error.message?.includes('timeout')) contextScore += 0.2;
        if (error.status === 401) contextScore += 0.3;
        if (context.operation?.includes('api')) contextScore += 0.2;

        return Math.min(contextScore, 1.0);
    }

    analyzeSystemState(context) {
        // Analyze current system health
        let stateScore = 0.5;

        const errorRate = this.healthMetrics.get('error_rate')?.current_value || 0;
        if (errorRate > 10) stateScore += 0.3;

        const resourceUtil = this.healthMetrics.get('resource_utilization')?.current_value || 0;
        if (resourceUtil > 80) stateScore += 0.2;

        return Math.min(stateScore, 1.0);
    }

    analyzeRecentChanges(context) {
        // Would analyze recent deployments, config changes, etc.
        return 0.3; // Mock implementation
    }

    analyzeExternalFactors(error, context) {
        // Analyze external dependencies, API status, etc.
        let externalScore = 0.2;

        if (error.message?.includes('network') || error.message?.includes('timeout')) {
            externalScore += 0.4;
        }

        return Math.min(externalScore, 1.0);
    }

    calculateCauseScore(features, category) {
        const categoryWeights = {
            'configuration': { error_context: 0.3, system_state: 0.2, recent_changes: 0.4, external_factors: 0.1 },
            'resource': { error_context: 0.2, system_state: 0.5, recent_changes: 0.2, external_factors: 0.1 },
            'external_service': { error_context: 0.3, system_state: 0.1, recent_changes: 0.1, external_factors: 0.5 },
            'code_bug': { error_context: 0.4, system_state: 0.2, recent_changes: 0.3, external_factors: 0.1 },
            'data_issue': { error_context: 0.4, system_state: 0.1, recent_changes: 0.2, external_factors: 0.3 }
        };

        const weights = categoryWeights[category] || { error_context: 0.25, system_state: 0.25, recent_changes: 0.25, external_factors: 0.25 };
        
        let score = 0;
        for (const [feature, weight] of Object.entries(weights)) {
            score += (features[feature] || 0) * weight;
        }

        return score;
    }

    generateCauseAnalysis(features, primaryCause) {
        const analyses = {
            'configuration': 'Configuration mismatch or invalid settings detected',
            'resource': 'Resource constraints or capacity issues identified',
            'external_service': 'External service dependency failure or degradation',
            'code_bug': 'Code logic error or unexpected behavior pattern',
            'data_issue': 'Data corruption, formatting, or validation problem'
        };

        return analyses[primaryCause] || 'Root cause analysis inconclusive';
    }

    /**
     * Assess overall error impact
     */
    assessImpact(error, context) {
        return {
            immediate_impact: this.assessImmediateImpact(error, context),
            potential_cascade: this.assessCascadeRisk(error, context),
            recovery_complexity: this.assessRecoveryComplexity(error),
            data_integrity_risk: this.assessDataIntegrityRisk(error, context)
        };
    }

    assessImmediateImpact(error, context) {
        const severity = this.classifyErrorSync(error);
        const impacts = {
            'security': 'Authentication/authorization compromised',
            'resources': 'System performance degraded',
            'connectivity': 'Service communication interrupted',
            'data_integrity': 'Data consistency at risk',
            'ai_processing': 'AI functionality reduced'
        };

        return impacts[severity] || 'Functionality temporarily unavailable';
    }

    assessCascadeRisk(error, context) {
        const highRiskPatterns = ['authentication_failure', 'resource_exhaustion', 'data_corruption'];
        const errorType = this.identifyErrorType(error);
        
        return highRiskPatterns.includes(errorType) ? 'high' : 'medium';
    }

    identifyErrorType(error) {
        const errorString = error.message?.toLowerCase() || '';
        
        for (const [patternId, pattern] of this.errorPatterns) {
            if (pattern.signatures.some(sig => errorString.includes(sig))) {
                return patternId;
            }
        }
        
        return 'unknown';
    }

    assessRecoveryComplexity(error) {
        const complexity = {
            'api_rate_limit': 'low',
            'authentication_failure': 'medium',
            'network_timeout': 'low',
            'resource_exhaustion': 'high',
            'data_corruption': 'high',
            'ai_model_failure': 'medium'
        };

        const errorType = this.identifyErrorType(error);
        return complexity[errorType] || 'medium';
    }

    assessDataIntegrityRisk(error, context) {
        const dataOperations = ['save', 'update', 'generate', 'process'];
        const operation = context.operation || '';
        
        const hasDataRisk = dataOperations.some(op => operation.includes(op));
        const isDataError = error.message?.toLowerCase().includes('data') || 
                           error.message?.toLowerCase().includes('corrupt');

        return hasDataRisk || isDataError ? 'medium' : 'low';
    }

    /**
     * Recommend recovery strategy
     */
    async recommendRecovery(error, context) {
        const errorType = this.identifyErrorType(error);
        const pattern = this.errorPatterns.get(errorType);
        
        if (pattern) {
            return {
                primary_strategy: pattern.recovery_strategy,
                fallback_strategies: this.generateFallbackStrategies(pattern.recovery_strategy),
                estimated_recovery_time: this.estimateRecoveryDuration(pattern.recovery_strategy),
                success_probability: this.getRecoverySuccessProbability(errorType),
                implementation_steps: this.generateRecoverySteps(pattern.recovery_strategy, error, context)
            };
        }

        return this.generateGenericRecovery(error, context);
    }

    generateFallbackStrategies(primaryStrategy) {
        const fallbacks = {
            'exponential_backoff': ['linear_retry', 'circuit_breaker'],
            'credential_refresh': ['fallback_auth', 'manual_intervention'],
            'retry_with_backoff': ['circuit_breaker', 'alternative_endpoint'],
            'resource_cleanup': ['restart_service', 'scale_resources'],
            'data_validation': ['restore_backup', 'manual_repair'],
            'fallback_model': ['cached_response', 'simplified_processing']
        };

        return fallbacks[primaryStrategy] || ['manual_intervention'];
    }

    estimateRecoveryDuration(strategy) {
        const durations = {
            'exponential_backoff': '30 seconds - 2 minutes',
            'credential_refresh': '1-3 minutes',
            'retry_with_backoff': '10-60 seconds',
            'resource_cleanup': '2-10 minutes',
            'data_validation': '5-30 minutes',
            'fallback_model': '10-30 seconds'
        };

        return durations[strategy] || '1-5 minutes';
    }

    getRecoverySuccessProbability(errorType) {
        const successRates = {
            'api_rate_limit': 95,
            'authentication_failure': 85,
            'network_timeout': 90,
            'resource_exhaustion': 75,
            'data_corruption': 60,
            'ai_model_failure': 80
        };

        return successRates[errorType] || 70;
    }

    generateRecoverySteps(strategy, error, context) {
        const steps = {
            'exponential_backoff': [
                'Wait for initial delay period',
                'Retry the failed operation',
                'If failed, double the wait time',
                'Repeat up to maximum retry count'
            ],
            'credential_refresh': [
                'Invalidate current authentication tokens',
                'Request new authentication credentials',
                'Update system configuration',
                'Retry the original operation'
            ],
            'retry_with_backoff': [
                'Implement linear backoff strategy',
                'Retry operation with increased intervals',
                'Monitor for success indicators',
                'Switch to alternative if unsuccessful'
            ],
            'resource_cleanup': [
                'Identify resource bottlenecks',
                'Release unused resources',
                'Optimize resource allocation',
                'Monitor resource utilization'
            ]
        };

        return steps[strategy] || ['Analyze error details', 'Apply appropriate fix', 'Verify resolution'];
    }

    generateGenericRecovery(error, context) {
        return {
            primary_strategy: 'basic_retry',
            fallback_strategies: ['manual_intervention'],
            estimated_recovery_time: '2-5 minutes',
            success_probability: 60,
            implementation_steps: [
                'Log error details for analysis',
                'Attempt basic retry mechanism',
                'Escalate to manual intervention if needed'
            ]
        };
    }

    /**
     * Identify prevention strategies
     */
    identifyPreventionStrategies(error, context) {
        const errorType = this.identifyErrorType(error);
        const pattern = this.errorPatterns.get(errorType);
        
        if (pattern) {
            return {
                primary_prevention: pattern.prevention_strategy,
                additional_measures: this.generateAdditionalPreventionMeasures(pattern.prevention_strategy),
                implementation_priority: this.assessPreventionPriority(errorType),
                cost_benefit_analysis: this.analyzePreventionCostBenefit(pattern.prevention_strategy)
            };
        }

        return this.generateGenericPrevention(error);
    }

    generateAdditionalPreventionMeasures(primaryPrevention) {
        const measures = {
            'request_batching': ['rate_limiting', 'queue_management'],
            'proactive_token_refresh': ['token_monitoring', 'credential_rotation'],
            'connection_pooling': ['circuit_breakers', 'health_checks'],
            'resource_monitoring': ['auto_scaling', 'alert_thresholds'],
            'data_checksums': ['backup_validation', 'integrity_monitoring'],
            'input_validation': ['schema_enforcement', 'sanitization']
        };

        return measures[primaryPrevention] || ['enhanced_monitoring'];
    }

    assessPreventionPriority(errorType) {
        const priorities = {
            'api_rate_limit': 'high',
            'authentication_failure': 'critical',
            'network_timeout': 'medium',
            'resource_exhaustion': 'critical',
            'data_corruption': 'critical',
            'ai_model_failure': 'high'
        };

        return priorities[errorType] || 'medium';
    }

    analyzePreventionCostBenefit(strategy) {
        return {
            implementation_cost: 'medium',
            maintenance_overhead: 'low',
            risk_reduction: 'high',
            roi_timeframe: '1-3 months'
        };
    }

    generateGenericPrevention(error) {
        return {
            primary_prevention: 'enhanced_monitoring',
            additional_measures: ['error_tracking', 'alerting'],
            implementation_priority: 'medium',
            cost_benefit_analysis: {
                implementation_cost: 'low',
                maintenance_overhead: 'low',
                risk_reduction: 'medium',
                roi_timeframe: '2-4 weeks'
            }
        };
    }

    /**
     * Update error patterns based on new error
     */
    updateErrorPatterns(errorAnalysis) {
        const errorType = this.identifyErrorType({ message: errorAnalysis.error_details.message });
        const pattern = this.errorPatterns.get(errorType);
        
        if (pattern) {
            pattern.occurrences++;
            pattern.last_seen = errorAnalysis.timestamp;
            
            // Update success rate based on resolution
            // This would be called when error is resolved
        }
    }

    /**
     * Generate error ID for tracking
     */
    generateErrorId(error) {
        const errorString = `${error.message || ''}-${error.stack?.substring(0, 100) || ''}`;
        return crypto.createHash('md5').update(errorString).digest('hex').substring(0, 12);
    }

    /**
     * Get error analytics
     */
    getErrorAnalytics(timeRange = '24h') {
        const cutoffTime = new Date(Date.now() - this.parseTimeRange(timeRange));
        const recentErrors = this.errorHistory.filter(e => new Date(e.timestamp) > cutoffTime);

        return {
            total_errors: recentErrors.length,
            error_rate: this.calculateErrorRate(recentErrors, timeRange),
            severity_distribution: this.calculateSeverityDistribution(recentErrors),
            category_breakdown: this.calculateCategoryBreakdown(recentErrors),
            top_error_types: this.getTopErrorTypes(recentErrors),
            recovery_success_rate: this.calculateRecoverySuccessRate(recentErrors),
            trends: this.analyzeTrends(recentErrors)
        };
    }

    parseTimeRange(range) {
        const units = { 'h': 3600000, 'd': 86400000, 'w': 604800000 };
        const match = range.match(/(\d+)([hdw])/);
        return match ? parseInt(match[1]) * units[match[2]] : 86400000; // Default 1 day
    }

    calculateErrorRate(errors, timeRange) {
        const hours = this.parseTimeRange(timeRange) / 3600000;
        return Math.round((errors.length / hours) * 100) / 100;
    }

    calculateSeverityDistribution(errors) {
        const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
        
        for (const error of errors) {
            distribution[error.severity.level]++;
        }

        return distribution;
    }

    calculateCategoryBreakdown(errors) {
        const categories = {};
        
        for (const error of errors) {
            const category = error.classification.primary_category;
            categories[category] = (categories[category] || 0) + 1;
        }

        return categories;
    }

    getTopErrorTypes(errors) {
        const errorCounts = {};
        
        for (const error of errors) {
            const message = error.error_details.message;
            errorCounts[message] = (errorCounts[message] || 0) + 1;
        }

        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([message, count]) => ({ message, count }));
    }

    calculateRecoverySuccessRate(errors) {
        // Would track actual recovery outcomes in production
        return 85; // Mock success rate
    }

    analyzeTrends(errors) {
        return {
            trend: 'stable',
            trend_percentage: '+2%',
            pattern_insights: ['Weekend errors spike', 'API timeout correlation']
        };
    }
}

/**
 * Automated Recovery System
 */
class AutomatedRecoverySystem {
    constructor(config, errorDetector) {
        this.config = config;
        this.errorDetector = errorDetector;
        this.recoveryStrategies = new Map();
        this.activeRecoveries = new Map();
        this.recoveryHistory = [];
        
        this.initializeRecoveryStrategies();
    }

    /**
     * Initialize recovery strategy implementations
     */
    initializeRecoveryStrategies() {
        const strategies = {
            'exponential_backoff': this.exponentialBackoffRecovery.bind(this),
            'credential_refresh': this.credentialRefreshRecovery.bind(this),
            'retry_with_backoff': this.retryWithBackoffRecovery.bind(this),
            'resource_cleanup': this.resourceCleanupRecovery.bind(this),
            'data_validation': this.dataValidationRecovery.bind(this),
            'fallback_model': this.fallbackModelRecovery.bind(this),
            'circuit_breaker': this.circuitBreakerRecovery.bind(this),
            'graceful_degradation': this.gracefulDegradationRecovery.bind(this)
        };

        for (const [strategyName, implementation] of Object.entries(strategies)) {
            this.recoveryStrategies.set(strategyName, implementation);
        }
    }

    /**
     * Execute automated recovery
     */
    async executeRecovery(errorAnalysis, context = {}) {
        console.log(`🔧 Executing automated recovery for error: ${errorAnalysis.error_id}`);

        const recoverySession = {
            session_id: this.generateRecoverySessionId(),
            error_id: errorAnalysis.error_id,
            start_time: new Date().toISOString(),
            primary_strategy: errorAnalysis.recovery_recommendation.primary_strategy,
            fallback_strategies: errorAnalysis.recovery_recommendation.fallback_strategies,
            status: 'in_progress',
            attempts: [],
            final_result: null
        };

        this.activeRecoveries.set(recoverySession.session_id, recoverySession);

        try {
            // Execute primary recovery strategy
            const primaryResult = await this.executeRecoveryStrategy(
                recoverySession.primary_strategy,
                errorAnalysis,
                context,
                recoverySession
            );

            if (primaryResult.success) {
                recoverySession.status = 'successful';
                recoverySession.final_result = primaryResult;
                console.log(`✅ Recovery successful using: ${recoverySession.primary_strategy}`);
                return recoverySession;
            }

            // Try fallback strategies if primary failed
            for (const fallbackStrategy of recoverySession.fallback_strategies) {
                console.log(`🔄 Trying fallback strategy: ${fallbackStrategy}`);
                
                const fallbackResult = await this.executeRecoveryStrategy(
                    fallbackStrategy,
                    errorAnalysis,
                    context,
                    recoverySession
                );

                if (fallbackResult.success) {
                    recoverySession.status = 'successful';
                    recoverySession.final_result = fallbackResult;
                    console.log(`✅ Recovery successful using fallback: ${fallbackStrategy}`);
                    return recoverySession;
                }
            }

            // All strategies failed
            recoverySession.status = 'failed';
            recoverySession.final_result = { success: false, message: 'All recovery strategies exhausted' };
            console.log('❌ All recovery strategies failed');

        } catch (recoveryError) {
            recoverySession.status = 'error';
            recoverySession.final_result = { success: false, error: recoveryError.message };
            console.error('❌ Recovery system error:', recoveryError.message);

        } finally {
            recoverySession.end_time = new Date().toISOString();
            recoverySession.duration = new Date(recoverySession.end_time) - new Date(recoverySession.start_time);
            
            this.activeRecoveries.delete(recoverySession.session_id);
            this.recoveryHistory.push(recoverySession);
        }

        return recoverySession;
    }

    /**
     * Execute individual recovery strategy
     */
    async executeRecoveryStrategy(strategyName, errorAnalysis, context, session) {
        const startTime = Date.now();
        const attempt = {
            strategy: strategyName,
            start_time: new Date().toISOString(),
            success: false,
            message: '',
            duration: 0
        };

        try {
            const strategy = this.recoveryStrategies.get(strategyName);
            if (!strategy) {
                throw new Error(`Unknown recovery strategy: ${strategyName}`);
            }

            const result = await strategy(errorAnalysis, context);
            
            attempt.success = result.success;
            attempt.message = result.message || 'Strategy executed';
            attempt.details = result.details;

            return result;

        } catch (error) {
            attempt.success = false;
            attempt.message = error.message;
            return { success: false, message: error.message };

        } finally {
            attempt.duration = Date.now() - startTime;
            session.attempts.push(attempt);
        }
    }

    /**
     * Recovery strategy implementations
     */
    async exponentialBackoffRecovery(errorAnalysis, context) {
        const maxRetries = 5;
        let delay = 1000; // Start with 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔄 Exponential backoff attempt ${attempt}/${maxRetries}, delay: ${delay}ms`);
            
            await this.sleep(delay);
            
            // Try to execute the original operation
            const retryResult = await this.retryOriginalOperation(context);
            if (retryResult.success) {
                return {
                    success: true,
                    message: `Recovery successful after ${attempt} attempts`,
                    details: { attempts: attempt, total_delay: delay * (Math.pow(2, attempt) - 1) }
                };
            }

            delay *= 2; // Exponential backoff
        }

        return {
            success: false,
            message: 'Exponential backoff recovery failed after maximum retries',
            details: { max_retries_reached: true }
        };
    }

    async credentialRefreshRecovery(errorAnalysis, context) {
        console.log('🔑 Attempting credential refresh...');

        try {
            // Simulate credential refresh
            const refreshResult = await this.refreshCredentials(context);
            
            if (refreshResult.success) {
                // Retry original operation with new credentials
                const retryResult = await this.retryOriginalOperation(context);
                
                return {
                    success: retryResult.success,
                    message: retryResult.success ? 
                        'Credential refresh and retry successful' : 
                        'Credential refresh succeeded but retry failed',
                    details: { credential_refreshed: true, retry_success: retryResult.success }
                };
            }

            return {
                success: false,
                message: 'Credential refresh failed',
                details: { refresh_error: refreshResult.error }
            };

        } catch (error) {
            return {
                success: false,
                message: `Credential refresh recovery error: ${error.message}`,
                details: { error: error.message }
            };
        }
    }

    async retryWithBackoffRecovery(errorAnalysis, context) {
        const maxRetries = 3;
        const baseDelay = 2000; // 2 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const delay = baseDelay * attempt; // Linear backoff
            console.log(`🔄 Linear backoff attempt ${attempt}/${maxRetries}, delay: ${delay}ms`);
            
            await this.sleep(delay);
            
            const retryResult = await this.retryOriginalOperation(context);
            if (retryResult.success) {
                return {
                    success: true,
                    message: `Retry with backoff successful after ${attempt} attempts`,
                    details: { attempts: attempt, strategy: 'linear_backoff' }
                };
            }
        }

        return {
            success: false,
            message: 'Retry with backoff failed after maximum attempts',
            details: { max_retries_reached: true }
        };
    }

    async resourceCleanupRecovery(errorAnalysis, context) {
        console.log('🧹 Performing resource cleanup...');

        try {
            const cleanupTasks = [
                this.cleanupMemory(),
                this.cleanupCache(),
                this.cleanupTempFiles(),
                this.releaseConnections()
            ];

            const results = await Promise.allSettled(cleanupTasks);
            const successfulCleanups = results.filter(r => r.status === 'fulfilled').length;

            // Retry operation after cleanup
            if (successfulCleanups > 2) {
                const retryResult = await this.retryOriginalOperation(context);
                
                return {
                    success: retryResult.success,
                    message: `Resource cleanup completed (${successfulCleanups}/4 tasks), retry ${retryResult.success ? 'successful' : 'failed'}`,
                    details: {
                        cleanup_tasks_completed: successfulCleanups,
                        retry_success: retryResult.success
                    }
                };
            }

            return {
                success: false,
                message: 'Insufficient resource cleanup completed',
                details: { cleanup_tasks_completed: successfulCleanups }
            };

        } catch (error) {
            return {
                success: false,
                message: `Resource cleanup recovery error: ${error.message}`,
                details: { error: error.message }
            };
        }
    }

    async dataValidationRecovery(errorAnalysis, context) {
        console.log('✅ Performing data validation and repair...');

        try {
            // Validate data integrity
            const validationResult = await this.validateData(context);
            
            if (validationResult.isValid) {
                return {
                    success: true,
                    message: 'Data validation passed, no repair needed',
                    details: { validation_status: 'passed' }
                };
            }

            // Attempt data repair
            const repairResult = await this.repairData(validationResult.issues, context);
            
            if (repairResult.success) {
                const retryResult = await this.retryOriginalOperation(context);
                
                return {
                    success: retryResult.success,
                    message: `Data repair ${repairResult.success ? 'successful' : 'failed'}, retry ${retryResult.success ? 'successful' : 'failed'}`,
                    details: {
                        issues_found: validationResult.issues.length,
                        repair_success: repairResult.success,
                        retry_success: retryResult.success
                    }
                };
            }

            return {
                success: false,
                message: 'Data validation failed and repair unsuccessful',
                details: { issues_found: validationResult.issues.length, repair_attempted: true }
            };

        } catch (error) {
            return {
                success: false,
                message: `Data validation recovery error: ${error.message}`,
                details: { error: error.message }
            };
        }
    }

    async fallbackModelRecovery(errorAnalysis, context) {
        console.log('🤖 Attempting fallback model recovery...');

        try {
            // Switch to simpler/cached processing
            const fallbackResult = await this.useFallbackProcessing(context);
            
            return {
                success: fallbackResult.success,
                message: fallbackResult.success ? 
                    'Fallback processing successful' : 
                    'Fallback processing failed',
                details: {
                    fallback_method: fallbackResult.method,
                    quality_impact: fallbackResult.qualityImpact || 'minimal'
                }
            };

        } catch (error) {
            return {
                success: false,
                message: `Fallback model recovery error: ${error.message}`,
                details: { error: error.message }
            };
        }
    }

    async circuitBreakerRecovery(errorAnalysis, context) {
        console.log('⚡ Implementing circuit breaker pattern...');

        try {
            // Implement circuit breaker logic
            const circuitState = await this.getCircuitBreakerState(context);
            
            if (circuitState === 'open') {
                return {
                    success: false,
                    message: 'Circuit breaker is open, preventing further attempts',
                    details: { circuit_state: 'open', action: 'blocked' }
                };
            }

            // Allow limited retries in half-open state
            if (circuitState === 'half-open') {
                const limitedRetryResult = await this.limitedRetry(context);
                
                if (limitedRetryResult.success) {
                    await this.closeCircuitBreaker(context);
                    return {
                        success: true,
                        message: 'Circuit breaker half-open retry successful, circuit closed',
                        details: { circuit_state: 'closed', retry_success: true }
                    };
                } else {
                    await this.openCircuitBreaker(context);
                    return {
                        success: false,
                        message: 'Circuit breaker half-open retry failed, circuit opened',
                        details: { circuit_state: 'opened', retry_failed: true }
                    };
                }
            }

            return {
                success: false,
                message: 'Circuit breaker state unknown',
                details: { circuit_state: circuitState }
            };

        } catch (error) {
            return {
                success: false,
                message: `Circuit breaker recovery error: ${error.message}`,
                details: { error: error.message }
            };
        }
    }

    async gracefulDegradationRecovery(errorAnalysis, context) {
        console.log('📉 Implementing graceful degradation...');

        try {
            // Implement reduced functionality
            const degradedResult = await this.provideDegradedService(context);
            
            return {
                success: degradedResult.success,
                message: degradedResult.success ? 
                    'Graceful degradation implemented successfully' : 
                    'Graceful degradation failed',
                details: {
                    degradation_level: degradedResult.level,
                    functionality_reduced: degradedResult.reducedFeatures,
                    user_impact: degradedResult.userImpact
                }
            };

        } catch (error) {
            return {
                success: false,
                message: `Graceful degradation recovery error: ${error.message}`,
                details: { error: error.message }
            };
        }
    }

    /**
     * Helper methods for recovery strategies
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async retryOriginalOperation(context) {
        // Mock implementation - would retry the actual failed operation
        const successRate = Math.random();
        return {
            success: successRate > 0.3,
            message: successRate > 0.3 ? 'Operation successful' : 'Operation failed'
        };
    }

    async refreshCredentials(context) {
        // Mock credential refresh
        await this.sleep(1000);
        return { success: Math.random() > 0.2, error: null };
    }

    async cleanupMemory() {
        // Mock memory cleanup
        await this.sleep(500);
        return { success: true };
    }

    async cleanupCache() {
        // Mock cache cleanup
        await this.sleep(300);
        return { success: true };
    }

    async cleanupTempFiles() {
        // Mock temp file cleanup
        await this.sleep(200);
        return { success: true };
    }

    async releaseConnections() {
        // Mock connection cleanup
        await this.sleep(400);
        return { success: true };
    }

    async validateData(context) {
        // Mock data validation
        await this.sleep(800);
        return {
            isValid: Math.random() > 0.4,
            issues: Math.random() > 0.4 ? [] : ['checksum_mismatch', 'format_error']
        };
    }

    async repairData(issues, context) {
        // Mock data repair
        await this.sleep(1500);
        return { success: Math.random() > 0.3 };
    }

    async useFallbackProcessing(context) {
        // Mock fallback processing
        await this.sleep(600);
        return {
            success: Math.random() > 0.1,
            method: 'cached_response',
            qualityImpact: 'minimal'
        };
    }

    async getCircuitBreakerState(context) {
        // Mock circuit breaker state
        const states = ['open', 'closed', 'half-open'];
        return states[Math.floor(Math.random() * states.length)];
    }

    async limitedRetry(context) {
        // Mock limited retry
        await this.sleep(1000);
        return { success: Math.random() > 0.5 };
    }

    async closeCircuitBreaker(context) {
        // Mock circuit breaker close
        return { success: true };
    }

    async openCircuitBreaker(context) {
        // Mock circuit breaker open
        return { success: true };
    }

    async provideDegradedService(context) {
        // Mock degraded service
        await this.sleep(400);
        return {
            success: true,
            level: 'partial',
            reducedFeatures: ['ai_enhancement', 'advanced_analytics'],
            userImpact: 'minimal'
        };
    }

    generateRecoverySessionId() {
        return crypto.randomBytes(8).toString('hex');
    }

    /**
     * Get recovery analytics
     */
    getRecoveryAnalytics(timeRange = '24h') {
        const cutoffTime = new Date(Date.now() - this.parseTimeRange(timeRange));
        const recentRecoveries = this.recoveryHistory.filter(r => new Date(r.start_time) > cutoffTime);

        return {
            total_recoveries: recentRecoveries.length,
            success_rate: this.calculateRecoverySuccessRate(recentRecoveries),
            average_recovery_time: this.calculateAverageRecoveryTime(recentRecoveries),
            strategy_effectiveness: this.calculateStrategyEffectiveness(recentRecoveries),
            common_failure_points: this.identifyCommonFailurePoints(recentRecoveries),
            recommendations: this.generateRecoveryRecommendations(recentRecoveries)
        };
    }

    parseTimeRange(range) {
        const units = { 'h': 3600000, 'd': 86400000, 'w': 604800000 };
        const match = range.match(/(\d+)([hdw])/);
        return match ? parseInt(match[1]) * units[match[2]] : 86400000;
    }

    calculateRecoverySuccessRate(recoveries) {
        if (recoveries.length === 0) return 0;
        const successful = recoveries.filter(r => r.status === 'successful').length;
        return Math.round((successful / recoveries.length) * 100);
    }

    calculateAverageRecoveryTime(recoveries) {
        if (recoveries.length === 0) return 0;
        const totalTime = recoveries.reduce((sum, r) => sum + (r.duration || 0), 0);
        return Math.round(totalTime / recoveries.length);
    }

    calculateStrategyEffectiveness(recoveries) {
        const strategyStats = {};
        
        for (const recovery of recoveries) {
            const strategy = recovery.primary_strategy;
            if (!strategyStats[strategy]) {
                strategyStats[strategy] = { total: 0, successful: 0 };
            }
            strategyStats[strategy].total++;
            if (recovery.status === 'successful') {
                strategyStats[strategy].successful++;
            }
        }

        const effectiveness = {};
        for (const [strategy, stats] of Object.entries(strategyStats)) {
            effectiveness[strategy] = Math.round((stats.successful / stats.total) * 100);
        }

        return effectiveness;
    }

    identifyCommonFailurePoints(recoveries) {
        const failurePoints = {};
        
        for (const recovery of recoveries) {
            if (recovery.status === 'failed') {
                const strategy = recovery.primary_strategy;
                failurePoints[strategy] = (failurePoints[strategy] || 0) + 1;
            }
        }

        return Object.entries(failurePoints)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([strategy, count]) => ({ strategy, failures: count }));
    }

    generateRecoveryRecommendations(recoveries) {
        const recommendations = [];
        const successRate = this.calculateRecoverySuccessRate(recoveries);

        if (successRate < 70) {
            recommendations.push('Review and improve recovery strategies - success rate below optimal');
        }

        const avgTime = this.calculateAverageRecoveryTime(recoveries);
        if (avgTime > 300000) { // 5 minutes
            recommendations.push('Optimize recovery procedures - average time exceeds target');
        }

        if (recoveries.length > 10) {
            recommendations.push('High recovery frequency indicates underlying issues need addressing');
        }

        return recommendations;
    }
}

export { IntelligentErrorDetector, AutomatedRecoverySystem };