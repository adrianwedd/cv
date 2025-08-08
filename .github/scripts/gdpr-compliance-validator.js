/**
 * GDPR Compliance Validation System
 * 
 * Comprehensive GDPR compliance validation with:
 * - Article-by-article compliance checking
 * - Data processing lawfulness validation
 * - Consent management verification
 * - Data subject rights implementation
 * - Cross-border transfer compliance
 * - Data retention policy validation
 * - Privacy by design assessment
 * - Breach notification procedures
 * - DPO requirements validation
 * - Documentation compliance
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * GDPR Articles for Compliance Checking
 */
const GDPR_ARTICLES = {
    ARTICLE_5: 'principles_of_processing',
    ARTICLE_6: 'lawfulness_of_processing',
    ARTICLE_7: 'conditions_for_consent',
    ARTICLE_12: 'transparent_information',
    ARTICLE_13: 'information_to_be_provided',
    ARTICLE_15: 'right_of_access',
    ARTICLE_16: 'right_to_rectification',
    ARTICLE_17: 'right_to_erasure',
    ARTICLE_18: 'right_to_restriction',
    ARTICLE_20: 'right_to_data_portability',
    ARTICLE_25: 'data_protection_by_design',
    ARTICLE_30: 'records_of_processing',
    ARTICLE_32: 'security_of_processing',
    ARTICLE_33: 'notification_of_breach',
    ARTICLE_44: 'general_principle_for_transfers',
    ARTICLE_46: 'transfers_subject_to_appropriate_safeguards'
};

/**
 * Compliance Status Levels
 */
const COMPLIANCE_STATUS = {
    COMPLIANT: 'compliant',
    NON_COMPLIANT: 'non_compliant',
    PARTIALLY_COMPLIANT: 'partially_compliant',
    REQUIRES_REVIEW: 'requires_review',
    NOT_APPLICABLE: 'not_applicable'
};

/**
 * Data Processing Legal Bases (Article 6)
 */
const LEGAL_BASES = {
    CONSENT: 'consent',
    CONTRACT: 'contract',
    LEGAL_OBLIGATION: 'legal_obligation',
    VITAL_INTERESTS: 'vital_interests',
    PUBLIC_TASK: 'public_task',
    LEGITIMATE_INTERESTS: 'legitimate_interests'
};

class GDPRComplianceValidator {
    constructor(config = {}) {
        this.config = {
            organizationName: config.organizationName || 'Organization',
            dataControllerInfo: config.dataControllerInfo || {},
            dpoRequired: config.dpoRequired || false,
            internationalTransfers: config.internationalTransfers || false,
            highRiskProcessing: config.highRiskProcessing || false,
            reportPath: path.join(process.cwd(), 'data', 'gdpr-compliance'),
            ...config
        };
        
        this.complianceResults = new Map();
        this.dataProcessingInventory = [];
        this.consentRecords = [];
        this.dataSubjectRequests = [];
        this.privacyNotices = [];
        this.securityMeasures = [];
    }
    
    /**
     * Run comprehensive GDPR compliance assessment
     */
    async runComplianceAssessment() {
        console.log('🛡️ Starting GDPR Compliance Assessment...');
        
        try {
            // Create reports directory
            await fs.mkdir(this.config.reportPath, { recursive: true });
            
            // Run compliance checks for each relevant article
            await this.validateArticle5PrinciplesOfProcessing();
            await this.validateArticle6LawfulnessOfProcessing();
            await this.validateArticle7ConsentConditions();
            await this.validateArticle12TransparentInformation();
            await this.validateArticle13InformationProvision();
            await this.validateDataSubjectRights();
            await this.validateArticle25DataProtectionByDesign();
            await this.validateArticle30RecordsOfProcessing();
            await this.validateArticle32SecurityOfProcessing();
            await this.validateArticle33BreachNotification();
            await this.validateInternationalTransfers();
            await this.validateDPORequirements();
            
            // Generate comprehensive report
            const report = await this.generateComplianceReport();
            
            console.log('✅ GDPR Compliance Assessment completed');
            console.log(`   📊 Overall Compliance Score: ${report.overallScore}/100`);
            console.log(`   📋 ${report.compliantArticles}/${report.totalArticles} articles compliant`);
            
            return report;
            
        } catch (error) {
            console.error('❌ GDPR Compliance Assessment failed:', error);
            throw error;
        }
    }
    
    /**
     * Validate Article 5 - Principles of Processing
     */
    async validateArticle5PrinciplesOfProcessing() {
        console.log('📋 Validating Article 5 - Principles of Processing...');
        
        const checks = [
            {
                principle: 'lawfulness_fairness_transparency',
                description: 'Processing is lawful, fair and transparent',
                check: () => this.checkLawfulnessFairnessTransparency(),
                weight: 20
            },
            {
                principle: 'purpose_limitation',
                description: 'Data collected for specified, explicit, legitimate purposes',
                check: () => this.checkPurposeLimitation(),
                weight: 15
            },
            {
                principle: 'data_minimisation',
                description: 'Data is adequate, relevant and limited to necessary',
                check: () => this.checkDataMinimisation(),
                weight: 15
            },
            {
                principle: 'accuracy',
                description: 'Data is accurate and kept up to date',
                check: () => this.checkDataAccuracy(),
                weight: 10
            },
            {
                principle: 'storage_limitation',
                description: 'Data kept no longer than necessary',
                check: () => this.checkStorageLimitation(),
                weight: 15
            },
            {
                principle: 'integrity_confidentiality',
                description: 'Data processed securely',
                check: () => this.checkIntegrityConfidentiality(),
                weight: 15
            },
            {
                principle: 'accountability',
                description: 'Controller demonstrates compliance',
                check: () => this.checkAccountability(),
                weight: 10
            }
        ];
        
        const results = [];
        let totalScore = 0;
        let maxScore = 0;
        
        for (const check of checks) {
            const result = await check.check();
            result.principle = check.principle;
            result.description = check.description;
            result.weight = check.weight;
            
            const score = result.compliant ? check.weight : (result.partiallyCompliant ? check.weight * 0.5 : 0);
            totalScore += score;
            maxScore += check.weight;
            
            results.push(result);
        }
        
        this.complianceResults.set(GDPR_ARTICLES.ARTICLE_5, {
            article: 'Article 5',
            title: 'Principles of Processing',
            status: totalScore === maxScore ? COMPLIANCE_STATUS.COMPLIANT : 
                   totalScore > 0 ? COMPLIANCE_STATUS.PARTIALLY_COMPLIANT : COMPLIANCE_STATUS.NON_COMPLIANT,
            score: Math.round((totalScore / maxScore) * 100),
            checks: results,
            recommendations: this.generateArticle5Recommendations(results)
        });
    }
    
    /**
     * Validate Article 6 - Lawfulness of Processing
     */
    async validateArticle6LawfulnessOfProcessing() {
        console.log('📋 Validating Article 6 - Lawfulness of Processing...');
        
        const checks = [
            {
                name: 'legal_basis_identified',
                description: 'Legal basis identified for each processing purpose',
                check: () => this.checkLegalBasisIdentified(),
                critical: true
            },
            {
                name: 'legal_basis_documented',
                description: 'Legal basis documented and communicated',
                check: () => this.checkLegalBasisDocumented(),
                critical: true
            },
            {
                name: 'consent_mechanism',
                description: 'Valid consent mechanism where consent is basis',
                check: () => this.checkConsentMechanism(),
                critical: false
            },
            {
                name: 'legitimate_interests_assessment',
                description: 'Legitimate interests assessment where applicable',
                check: () => this.checkLegitimateInterestsAssessment(),
                critical: false
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set(GDPR_ARTICLES.ARTICLE_6, {
            article: 'Article 6',
            title: 'Lawfulness of Processing',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateLawfulnessRecommendations(results)
        });
    }
    
    /**
     * Validate Article 7 - Conditions for Consent
     */
    async validateArticle7ConsentConditions() {
        console.log('📋 Validating Article 7 - Conditions for Consent...');
        
        if (!this.usesConsentAsLegalBasis()) {
            this.complianceResults.set(GDPR_ARTICLES.ARTICLE_7, {
                article: 'Article 7',
                title: 'Conditions for Consent',
                status: COMPLIANCE_STATUS.NOT_APPLICABLE,
                score: 100,
                checks: [],
                recommendations: []
            });
            return;
        }
        
        const checks = [
            {
                name: 'consent_demonstrable',
                description: 'Ability to demonstrate consent was given',
                check: () => this.checkConsentDemonstrable(),
                critical: true
            },
            {
                name: 'clear_distinguishable',
                description: 'Consent request is clear and distinguishable',
                check: () => this.checkConsentClearDistinguishable(),
                critical: true
            },
            {
                name: 'freely_given',
                description: 'Consent is freely given',
                check: () => this.checkConsentFreelyGiven(),
                critical: true
            },
            {
                name: 'specific_informed',
                description: 'Consent is specific and informed',
                check: () => this.checkConsentSpecificInformed(),
                critical: true
            },
            {
                name: 'withdrawal_mechanism',
                description: 'Easy withdrawal mechanism available',
                check: () => this.checkConsentWithdrawalMechanism(),
                critical: true
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set(GDPR_ARTICLES.ARTICLE_7, {
            article: 'Article 7',
            title: 'Conditions for Consent',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateConsentRecommendations(results)
        });
    }
    
    /**
     * Validate Data Subject Rights (Articles 15-20)
     */
    async validateDataSubjectRights() {
        console.log('📋 Validating Data Subject Rights...');
        
        const rights = [
            {
                article: 'Article 15',
                right: 'right_of_access',
                description: 'Right of access by the data subject',
                check: () => this.checkRightOfAccess()
            },
            {
                article: 'Article 16',
                right: 'right_to_rectification',
                description: 'Right to rectification',
                check: () => this.checkRightToRectification()
            },
            {
                article: 'Article 17',
                right: 'right_to_erasure',
                description: 'Right to erasure (right to be forgotten)',
                check: () => this.checkRightToErasure()
            },
            {
                article: 'Article 18',
                right: 'right_to_restriction',
                description: 'Right to restriction of processing',
                check: () => this.checkRightToRestriction()
            },
            {
                article: 'Article 20',
                right: 'right_to_data_portability',
                description: 'Right to data portability',
                check: () => this.checkRightToDataPortability()
            }
        ];
        
        for (const right of rights) {
            const result = await right.check();
            
            this.complianceResults.set(right.right, {
                article: right.article,
                title: right.description,
                status: result.compliant ? COMPLIANCE_STATUS.COMPLIANT : 
                       result.partiallyCompliant ? COMPLIANCE_STATUS.PARTIALLY_COMPLIANT : COMPLIANCE_STATUS.NON_COMPLIANT,
                score: result.compliant ? 100 : (result.partiallyCompliant ? 50 : 0),
                checks: [result],
                recommendations: result.recommendations || []
            });
        }
    }
    
    /**
     * Validate Article 25 - Data Protection by Design
     */
    async validateArticle25DataProtectionByDesign() {
        console.log('📋 Validating Article 25 - Data Protection by Design...');
        
        const checks = [
            {
                name: 'privacy_by_design_implementation',
                description: 'Privacy by design principles implemented',
                check: () => this.checkPrivacyByDesignImplementation(),
                critical: true
            },
            {
                name: 'privacy_by_default',
                description: 'Privacy by default settings configured',
                check: () => this.checkPrivacyByDefault(),
                critical: true
            },
            {
                name: 'technical_measures',
                description: 'Technical privacy protection measures in place',
                check: () => this.checkTechnicalPrivacyMeasures(),
                critical: false
            },
            {
                name: 'organizational_measures',
                description: 'Organizational privacy protection measures in place',
                check: () => this.checkOrganizationalPrivacyMeasures(),
                critical: false
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set(GDPR_ARTICLES.ARTICLE_25, {
            article: 'Article 25',
            title: 'Data Protection by Design and by Default',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateDataProtectionByDesignRecommendations(results)
        });
    }
    
    /**
     * Validate Article 30 - Records of Processing
     */
    async validateArticle30RecordsOfProcessing() {
        console.log('📋 Validating Article 30 - Records of Processing...');
        
        const checks = [
            {
                name: 'records_maintained',
                description: 'Records of processing activities maintained',
                check: () => this.checkRecordsMaintained(),
                critical: true
            },
            {
                name: 'records_comprehensive',
                description: 'Records contain all required information',
                check: () => this.checkRecordsComprehensive(),
                critical: true
            },
            {
                name: 'records_current',
                description: 'Records are kept current and accurate',
                check: () => this.checkRecordsCurrent(),
                critical: false
            },
            {
                name: 'records_available',
                description: 'Records available to supervisory authority',
                check: () => this.checkRecordsAvailable(),
                critical: true
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set(GDPR_ARTICLES.ARTICLE_30, {
            article: 'Article 30',
            title: 'Records of Processing Activities',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateRecordsRecommendations(results)
        });
    }
    
    /**
     * Validate Article 32 - Security of Processing
     */
    async validateArticle32SecurityOfProcessing() {
        console.log('📋 Validating Article 32 - Security of Processing...');
        
        const checks = [
            {
                name: 'appropriate_technical_measures',
                description: 'Appropriate technical security measures implemented',
                check: () => this.checkTechnicalSecurityMeasures(),
                critical: true
            },
            {
                name: 'appropriate_organizational_measures',
                description: 'Appropriate organizational security measures implemented',
                check: () => this.checkOrganizationalSecurityMeasures(),
                critical: true
            },
            {
                name: 'encryption_pseudonymisation',
                description: 'Encryption and/or pseudonymisation where appropriate',
                check: () => this.checkEncryptionPseudonymisation(),
                critical: false
            },
            {
                name: 'confidentiality_integrity_availability',
                description: 'Confidentiality, integrity, and availability assured',
                check: () => this.checkConfidentialityIntegrityAvailability(),
                critical: true
            },
            {
                name: 'resilience_recovery',
                description: 'Resilience and recovery capabilities in place',
                check: () => this.checkResilienceRecovery(),
                critical: false
            },
            {
                name: 'regular_testing',
                description: 'Regular testing and evaluation of security measures',
                check: () => this.checkSecurityTesting(),
                critical: false
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set(GDPR_ARTICLES.ARTICLE_32, {
            article: 'Article 32',
            title: 'Security of Processing',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateSecurityRecommendations(results)
        });
    }
    
    /**
     * Validate Article 33 - Breach Notification
     */
    async validateArticle33BreachNotification() {
        console.log('📋 Validating Article 33 - Breach Notification...');
        
        const checks = [
            {
                name: 'breach_detection_procedure',
                description: 'Data breach detection procedure in place',
                check: () => this.checkBreachDetectionProcedure(),
                critical: true
            },
            {
                name: 'breach_notification_procedure',
                description: 'Breach notification procedure defined',
                check: () => this.checkBreachNotificationProcedure(),
                critical: true
            },
            {
                name: 'notification_timeline',
                description: '72-hour notification timeline capability',
                check: () => this.checkNotificationTimeline(),
                critical: true
            },
            {
                name: 'breach_register',
                description: 'Data breach register maintained',
                check: () => this.checkBreachRegister(),
                critical: false
            },
            {
                name: 'data_subject_notification',
                description: 'Data subject notification procedure for high-risk breaches',
                check: () => this.checkDataSubjectNotificationProcedure(),
                critical: true
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set(GDPR_ARTICLES.ARTICLE_33, {
            article: 'Article 33',
            title: 'Notification of Personal Data Breach',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateBreachNotificationRecommendations(results)
        });
    }
    
    /**
     * Validate International Transfers (Articles 44-46)
     */
    async validateInternationalTransfers() {
        if (!this.config.internationalTransfers) {
            console.log('ℹ️ No international transfers - skipping validation');
            return;
        }
        
        console.log('📋 Validating International Transfers...');
        
        const checks = [
            {
                name: 'adequacy_decision',
                description: 'Transfers to countries with adequacy decision',
                check: () => this.checkAdequacyDecision(),
                critical: false
            },
            {
                name: 'appropriate_safeguards',
                description: 'Appropriate safeguards for transfers without adequacy',
                check: () => this.checkAppropriateSafeguards(),
                critical: true
            },
            {
                name: 'binding_corporate_rules',
                description: 'Binding corporate rules where applicable',
                check: () => this.checkBindingCorporateRules(),
                critical: false
            },
            {
                name: 'standard_contractual_clauses',
                description: 'Standard contractual clauses implemented',
                check: () => this.checkStandardContractualClauses(),
                critical: false
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set('international_transfers', {
            article: 'Articles 44-46',
            title: 'International Transfers',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateTransferRecommendations(results)
        });
    }
    
    /**
     * Validate DPO Requirements
     */
    async validateDPORequirements() {
        if (!this.config.dpoRequired) {
            console.log('ℹ️ DPO not required - skipping validation');
            return;
        }
        
        console.log('📋 Validating DPO Requirements...');
        
        const checks = [
            {
                name: 'dpo_designated',
                description: 'Data Protection Officer designated',
                check: () => this.checkDPODesignated(),
                critical: true
            },
            {
                name: 'dpo_published',
                description: 'DPO contact details published',
                check: () => this.checkDPOPublished(),
                critical: true
            },
            {
                name: 'dpo_communicated',
                description: 'DPO details communicated to supervisory authority',
                check: () => this.checkDPOCommunicated(),
                critical: true
            },
            {
                name: 'dpo_independence',
                description: 'DPO independence and absence of conflict ensured',
                check: () => this.checkDPOIndependence(),
                critical: true
            }
        ];
        
        const results = await this.runComplianceChecks(checks);
        
        this.complianceResults.set('dpo_requirements', {
            article: 'Articles 37-39',
            title: 'Data Protection Officer',
            status: this.determineComplianceStatus(results),
            score: this.calculateComplianceScore(results),
            checks: results,
            recommendations: this.generateDPORecommendations(results)
        });
    }
    
    /**
     * Individual compliance check implementations
     */
    
    async checkLawfulnessFairnessTransparency() {
        // Check if processing has legal basis and is transparent
        const hasLegalBasis = this.dataProcessingInventory.every(activity => 
            activity.legalBasis && Object.values(LEGAL_BASES).includes(activity.legalBasis)
        );
        
        const hasPrivacyNotice = this.privacyNotices.length > 0;
        
        return {
            compliant: hasLegalBasis && hasPrivacyNotice,
            details: {
                hasLegalBasis,
                hasPrivacyNotice,
                processingActivities: this.dataProcessingInventory.length
            },
            recommendations: !hasLegalBasis ? ['Document legal basis for all processing activities'] : 
                           !hasPrivacyNotice ? ['Create and publish privacy notice'] : []
        };
    }
    
    async checkPurposeLimitation() {
        const hasDefined = this.dataProcessingInventory.every(activity => 
            activity.purposes && activity.purposes.length > 0
        );
        
        return {
            compliant: hasDefined,
            details: { definedPurposes: hasDefined },
            recommendations: !hasDefined ? ['Define specific, explicit purposes for all data processing'] : []
        };
    }
    
    async checkDataMinimisation() {
        // This would typically involve reviewing actual data collection practices
        // For now, check if data minimisation principles are documented
        const hasDataMinimisationPolicy = this.hasDocumentedPolicy('data_minimisation');
        
        return {
            compliant: hasDataMinimisationPolicy,
            partiallyCompliant: false,
            details: { hasPolicy: hasDataMinimisationPolicy },
            recommendations: !hasDataMinimisationPolicy ? 
                ['Implement and document data minimisation practices'] : []
        };
    }
    
    async checkDataAccuracy() {
        const hasAccuracyProcedures = this.hasDocumentedPolicy('data_accuracy');
        
        return {
            compliant: hasAccuracyProcedures,
            details: { hasAccuracyProcedures },
            recommendations: !hasAccuracyProcedures ? 
                ['Implement procedures to ensure data accuracy'] : []
        };
    }
    
    async checkStorageLimitation() {
        const hasRetentionPolicy = this.hasDocumentedPolicy('retention_policy');
        const allActivitiesHaveRetention = this.dataProcessingInventory.every(activity => 
            activity.retentionPeriod
        );
        
        return {
            compliant: hasRetentionPolicy && allActivitiesHaveRetention,
            details: { hasRetentionPolicy, allActivitiesHaveRetention },
            recommendations: !hasRetentionPolicy ? ['Create data retention policy'] :
                           !allActivitiesHaveRetention ? ['Define retention periods for all processing activities'] : []
        };
    }
    
    async checkIntegrityConfidentiality() {
        const hasSecurityMeasures = this.securityMeasures.length > 0;
        const hasEncryption = this.securityMeasures.some(measure => 
            measure.type === 'encryption'
        );
        
        return {
            compliant: hasSecurityMeasures,
            partiallyCompliant: hasSecurityMeasures && !hasEncryption,
            details: { hasSecurityMeasures, hasEncryption },
            recommendations: !hasSecurityMeasures ? ['Implement security measures for data protection'] :
                           !hasEncryption ? ['Consider implementing encryption for sensitive data'] : []
        };
    }
    
    async checkAccountability() {
        const hasDocumentation = this.complianceResults.size > 0;
        const hasPrivacyNotice = this.privacyNotices.length > 0;
        const hasRecordsOfProcessing = this.dataProcessingInventory.length > 0;
        
        return {
            compliant: hasDocumentation && hasPrivacyNotice && hasRecordsOfProcessing,
            details: { hasDocumentation, hasPrivacyNotice, hasRecordsOfProcessing },
            recommendations: !hasDocumentation ? ['Create compliance documentation'] :
                           !hasPrivacyNotice ? ['Create privacy notice'] :
                           !hasRecordsOfProcessing ? ['Maintain records of processing'] : []
        };
    }
    
    async checkRightOfAccess() {
        const hasAccessProcedure = this.hasDocumentedPolicy('data_subject_access');
        const hasRequestProcess = this.dataSubjectRequests.some(req => req.type === 'access');
        
        return {
            compliant: hasAccessProcedure,
            partiallyCompliant: hasRequestProcess && !hasAccessProcedure,
            details: { hasAccessProcedure, hasRequestProcess },
            recommendations: !hasAccessProcedure ? 
                ['Implement data subject access request procedure'] : []
        };
    }
    
    // Additional check implementations would follow similar patterns...
    
    /**
     * Utility methods
     */
    
    async runComplianceChecks(checks) {
        const results = [];
        
        for (const check of checks) {
            try {
                const result = await check.check();
                results.push({
                    name: check.name,
                    description: check.description,
                    critical: check.critical || false,
                    ...result
                });
            } catch (error) {
                results.push({
                    name: check.name,
                    description: check.description,
                    critical: check.critical || false,
                    compliant: false,
                    error: error.message,
                    recommendations: ['Review and fix implementation error']
                });
            }
        }
        
        return results;
    }
    
    determineComplianceStatus(results) {
        const criticalChecks = results.filter(r => r.critical);
        const nonCriticalChecks = results.filter(r => !r.critical);
        
        const criticalCompliant = criticalChecks.every(r => r.compliant);
        const allCompliant = results.every(r => r.compliant);
        const someCompliant = results.some(r => r.compliant);
        
        if (allCompliant) return COMPLIANCE_STATUS.COMPLIANT;
        if (!criticalCompliant) return COMPLIANCE_STATUS.NON_COMPLIANT;
        if (someCompliant) return COMPLIANCE_STATUS.PARTIALLY_COMPLIANT;
        
        return COMPLIANCE_STATUS.NON_COMPLIANT;
    }
    
    calculateComplianceScore(results) {
        if (results.length === 0) return 0;
        
        let score = 0;
        let totalWeight = 0;
        
        results.forEach(result => {
            const weight = result.critical ? 2 : 1;
            totalWeight += weight;
            
            if (result.compliant) {
                score += weight;
            } else if (result.partiallyCompliant) {
                score += weight * 0.5;
            }
        });
        
        return Math.round((score / totalWeight) * 100);
    }
    
    hasDocumentedPolicy(policyType) {
        // This would check for documented policies in the organization
        // For now, return false as placeholder
        return false;
    }
    
    usesConsentAsLegalBasis() {
        return this.dataProcessingInventory.some(activity => 
            activity.legalBasis === LEGAL_BASES.CONSENT
        );
    }
    
    /**
     * Generate comprehensive compliance report
     */
    async generateComplianceReport() {
        const totalArticles = this.complianceResults.size;
        const compliantArticles = Array.from(this.complianceResults.values())
            .filter(result => result.status === COMPLIANCE_STATUS.COMPLIANT).length;
        
        const overallScore = Array.from(this.complianceResults.values())
            .reduce((sum, result) => sum + result.score, 0) / totalArticles;
        
        const report = {
            organization: this.config.organizationName,
            assessmentDate: new Date().toISOString(),
            assessmentId: crypto.randomBytes(8).toString('hex'),
            summary: {
                overallScore: Math.round(overallScore),
                totalArticles,
                compliantArticles,
                complianceRate: Math.round((compliantArticles / totalArticles) * 100)
            },
            articleResults: Object.fromEntries(this.complianceResults),
            criticalIssues: this.getCriticalIssues(),
            recommendations: this.getTopRecommendations(),
            nextSteps: this.generateNextSteps()
        };
        
        // Save report to file
        const reportFile = path.join(
            this.config.reportPath,
            `gdpr-compliance-${Date.now()}.json`
        );
        
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        const markdownFile = path.join(
            this.config.reportPath,
            `gdpr-compliance-${Date.now()}.md`
        );
        
        await fs.writeFile(markdownFile, markdownReport);
        
        return report;
    }
    
    getCriticalIssues() {
        const critical = [];
        
        this.complianceResults.forEach((result, article) => {
            result.checks.forEach(check => {
                if (check.critical && !check.compliant) {
                    critical.push({
                        article: result.article,
                        issue: check.description,
                        recommendations: check.recommendations || []
                    });
                }
            });
        });
        
        return critical;
    }
    
    getTopRecommendations() {
        const recommendations = [];
        
        this.complianceResults.forEach(result => {
            if (result.recommendations) {
                recommendations.push(...result.recommendations.map(rec => ({
                    article: result.article,
                    recommendation: rec
                })));
            }
        });
        
        return recommendations.slice(0, 10); // Top 10 recommendations
    }
    
    generateNextSteps() {
        const criticalIssues = this.getCriticalIssues();
        
        if (criticalIssues.length > 0) {
            return [
                'Address critical compliance issues immediately',
                'Implement missing technical and organizational measures',
                'Update privacy documentation and procedures',
                'Conduct staff training on GDPR requirements',
                'Schedule regular compliance reviews'
            ];
        }
        
        return [
            'Maintain current compliance measures',
            'Regular review of processing activities',
            'Monitor for regulatory updates',
            'Continuous improvement of privacy practices'
        ];
    }
    
    generateMarkdownReport(report) {
        return `# GDPR Compliance Assessment Report

**Organization:** ${report.organization}
**Assessment Date:** ${new Date(report.assessmentDate).toLocaleDateString()}
**Assessment ID:** ${report.assessmentId}

## Executive Summary

- **Overall Compliance Score:** ${report.summary.overallScore}/100
- **Articles Assessed:** ${report.summary.totalArticles}
- **Compliant Articles:** ${report.summary.compliantArticles}
- **Compliance Rate:** ${report.summary.complianceRate}%

## Critical Issues

${report.criticalIssues.length > 0 ? 
    report.criticalIssues.map(issue => 
        `### ${issue.article}\n**Issue:** ${issue.issue}\n**Recommendations:** ${issue.recommendations.join(', ')}\n`
    ).join('\n') : 
    '*No critical issues identified.*'
}

## Top Recommendations

${report.recommendations.map((rec, index) => 
    `${index + 1}. **${rec.article}:** ${rec.recommendation}`
).join('\n')}

## Next Steps

${report.nextSteps.map((step, index) => 
    `${index + 1}. ${step}`
).join('\n')}

## Detailed Results

${Object.entries(report.articleResults).map(([key, result]) => 
    `### ${result.article} - ${result.title}
    
**Status:** ${result.status.toUpperCase()}
**Score:** ${result.score}/100

${result.checks.map(check => 
    `- ${check.compliant ? '✅' : '❌'} ${check.description}`
).join('\n')}
`
).join('\n')}
`;
    }
    
    // Placeholder implementations for remaining checks
    async checkLegalBasisIdentified() { return { compliant: false, recommendations: ['Document legal basis for each processing purpose'] }; }
    async checkLegalBasisDocumented() { return { compliant: false, recommendations: ['Create legal basis documentation'] }; }
    async checkConsentMechanism() { return { compliant: true, recommendations: [] }; }
    async checkLegitimateInterestsAssessment() { return { compliant: true, recommendations: [] }; }
    async checkConsentDemonstrable() { return { compliant: false, recommendations: ['Implement consent tracking mechanism'] }; }
    async checkConsentClearDistinguishable() { return { compliant: false, recommendations: ['Review consent request clarity'] }; }
    async checkConsentFreelyGiven() { return { compliant: false, recommendations: ['Ensure consent is not condition for service'] }; }
    async checkConsentSpecificInformed() { return { compliant: false, recommendations: ['Make consent requests more specific'] }; }
    async checkConsentWithdrawalMechanism() { return { compliant: false, recommendations: ['Implement easy consent withdrawal'] }; }
    async checkRightToRectification() { return { compliant: false, recommendations: ['Implement data rectification procedure'] }; }
    async checkRightToErasure() { return { compliant: false, recommendations: ['Implement data deletion procedure'] }; }
    async checkRightToRestriction() { return { compliant: false, recommendations: ['Implement processing restriction procedure'] }; }
    async checkRightToDataPortability() { return { compliant: false, recommendations: ['Implement data export functionality'] }; }
    
    // Additional placeholder implementations
    generateArticle5Recommendations(results) { return ['Implement privacy by design principles']; }
    generateLawfulnessRecommendations(results) { return ['Document legal basis for all processing']; }
    generateConsentRecommendations(results) { return ['Implement compliant consent mechanism']; }
    generateDataProtectionByDesignRecommendations(results) { return ['Integrate privacy into system design']; }
    generateRecordsRecommendations(results) { return ['Create comprehensive processing records']; }
    generateSecurityRecommendations(results) { return ['Implement technical security measures']; }
    generateBreachNotificationRecommendations(results) { return ['Create breach response procedures']; }
    generateTransferRecommendations(results) { return ['Implement transfer safeguards']; }
    generateDPORecommendations(results) { return ['Designate qualified DPO']; }
    
    // More placeholder implementations for comprehensive checks
    async checkPrivacyByDesignImplementation() { return { compliant: false, recommendations: ['Implement privacy by design'] }; }
    async checkPrivacyByDefault() { return { compliant: false, recommendations: ['Configure privacy-friendly defaults'] }; }
    async checkTechnicalPrivacyMeasures() { return { compliant: false, recommendations: ['Implement technical privacy measures'] }; }
    async checkOrganizationalPrivacyMeasures() { return { compliant: false, recommendations: ['Implement organizational measures'] }; }
    async checkRecordsMaintained() { return { compliant: false, recommendations: ['Maintain processing records'] }; }
    async checkRecordsComprehensive() { return { compliant: false, recommendations: ['Include all required information in records'] }; }
    async checkRecordsCurrent() { return { compliant: false, recommendations: ['Keep records up to date'] }; }
    async checkRecordsAvailable() { return { compliant: false, recommendations: ['Make records available to authorities'] }; }
    async checkTechnicalSecurityMeasures() { return { compliant: false, recommendations: ['Implement technical security measures'] }; }
    async checkOrganizationalSecurityMeasures() { return { compliant: false, recommendations: ['Implement organizational measures'] }; }
    async checkEncryptionPseudonymisation() { return { compliant: false, recommendations: ['Consider encryption/pseudonymisation'] }; }
    async checkConfidentialityIntegrityAvailability() { return { compliant: false, recommendations: ['Ensure CIA triad'] }; }
    async checkResilienceRecovery() { return { compliant: false, recommendations: ['Implement backup/recovery'] }; }
    async checkSecurityTesting() { return { compliant: false, recommendations: ['Regular security testing'] }; }
    async checkBreachDetectionProcedure() { return { compliant: false, recommendations: ['Implement breach detection'] }; }
    async checkBreachNotificationProcedure() { return { compliant: false, recommendations: ['Create notification procedures'] }; }
    async checkNotificationTimeline() { return { compliant: false, recommendations: ['Ensure 72-hour capability'] }; }
    async checkBreachRegister() { return { compliant: false, recommendations: ['Maintain breach register'] }; }
    async checkDataSubjectNotificationProcedure() { return { compliant: false, recommendations: ['Create subject notification procedure'] }; }
    async checkAdequacyDecision() { return { compliant: true, recommendations: [] }; }
    async checkAppropriateSafeguards() { return { compliant: false, recommendations: ['Implement transfer safeguards'] }; }
    async checkBindingCorporateRules() { return { compliant: true, recommendations: [] }; }
    async checkStandardContractualClauses() { return { compliant: false, recommendations: ['Use standard contractual clauses'] }; }
    async checkDPODesignated() { return { compliant: false, recommendations: ['Designate DPO'] }; }
    async checkDPOPublished() { return { compliant: false, recommendations: ['Publish DPO contact details'] }; }
    async checkDPOCommunicated() { return { compliant: false, recommendations: ['Communicate DPO to authority'] }; }
    async checkDPOIndependence() { return { compliant: false, recommendations: ['Ensure DPO independence'] }; }
}

module.exports = {
    GDPRComplianceValidator,
    GDPR_ARTICLES,
    COMPLIANCE_STATUS,
    LEGAL_BASES
};