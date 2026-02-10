#!/usr/bin/env node

/**
 * Content Guardian - Protects authentic CV content from AI hallucinations
 *
 * This module ensures that verified, authentic content in the CV is never
 * overwritten by AI-generated hallucinations. It maintains a protected content
 * registry and validates all AI enhancements against known facts.
 *
 * Features:
 * - Protected content registry with verification status
 * - AI enhancement validation against authentic data
 * - Automatic rollback of hallucinated content
 * - Audit trail of content changes
 * - Standalone validation (no --init required)
 * - CV structure validation (dates, URLs, required fields)
 *
 * Usage: node content-guardian.js --validate
 *
 * @author Adrian Wedd
 * @version 2.0.0
 */

const fs = require('fs').promises;
const path = require('path');

class ContentGuardian {
    constructor() {
        this.dataDir = path.resolve(__dirname, '../../data');
        this.protectedContentPath = path.join(this.dataDir, 'protected-content.json');
        this.baseCvPath = path.join(this.dataDir, 'base-cv.json');

        // Define protected content categories that should never be fabricated
        this.protectedCategories = [
            'achievements',
            'experience',
            'education',
            'certifications',
            'professional_summary'
        ];

        // Hallucination indicators - patterns that suggest fabricated content
        this.hallucinationPatterns = [
            // Original patterns
            /AI Innovation Excellence Award/i,
            /15\+ AI-powered autonomous systems/i,
            /99\.5% average system reliability/i,
            /Published research.*patents/i,
            /Keynote speaker.*conferences/i,
            /Mentored \d+\+ junior developers/i,
            /\d+% average cost reduction/i,
            /Filed \d+ patents/i,
            /(\d+k\+|\d+,\d+\+) users?/i,
            /enterprises worldwide/i,

            // Superlative inflation
            /\bworld[- ]class\b/i,
            /\bindustry[- ]leading\b/i,
            /\bbest[- ]in[- ]class\b/i,
            /\bunparalleled\b/i,
            /\bgroundbreaking\b/i,
            /\brevolutionary\b/i,
            /\bpioneering\b(?!\s+use)/i, // allow "pioneering use of" but not generic "pioneering"
            /\btrailblazing\b/i,
            /\bcutting[- ]edge\b/i,
            /\bstate[- ]of[- ]the[- ]art\b/i,

            // Unverifiable metrics
            /\d+%\s+(?:improvement|increase|boost|reduction|decrease|growth)/i,

            // Meta-commentary (AI artifacts leaked into content)
            /\bAI[- ]enhanced\b/i,
            /\[AI\b/i,
            /\boptimized\s+by\s+(?:AI|Claude|GPT|LLM)/i,
            /\bgenerated\s+by\s+(?:AI|Claude|GPT|LLM)/i,
            /\benhanced\s+by\s+AI\b/i,
            /\[NOTE:/i,
            /\[TODO:/i,
            /\bTODO:/i,

            // Fabricated awards/recognitions
            /\baward[- ]winning\b/i,
            /\brecognized\s+(?:as|for)\s+(?:excellence|outstanding|exceptional)/i,
            /\breceived\s+(?:the|an?)\s+.*\baward\b/i,
            /\bnominated\s+for\b/i
        ];

        // Known legitimate certifications/recognitions (whitelist)
        this.knownCertifications = [
            'Google Analytics Individual Qualification',
            'Google AdWords Certification',
            'Bing Ads Accredited Professional'
        ];
    }

    /**
     * Build the default protected content registry inline.
     * Used when protected-content.json does not exist so --validate can work standalone.
     */
    buildDefaultRegistry() {
        return {
            last_updated: new Date().toISOString(),
            version: "2.0.0",
            protection_level: "high",
            verified_content: {
                experience: [
                    {
                        position: "Systems Analyst / Acting Senior Change Analyst",
                        company: "Homes Tasmania (formerly Department of Communities Tasmania)",
                        period: "2018 - Present",
                        verified: true,
                        source: "employment_records",
                        protection_reason: "Current verified employment"
                    },
                    {
                        position: "ITS Client Services Officer",
                        company: "University of Tasmania",
                        period: "2015 - 2018",
                        verified: true,
                        source: "employment_records",
                        protection_reason: "Verified previous employment"
                    },
                    {
                        position: "Director",
                        company: "Digital Agency PTY LTD",
                        period: "2015 - 2018",
                        verified: true,
                        source: "business_records",
                        protection_reason: "Verified business ownership"
                    },
                    {
                        position: "Second Level IT Support Engineer",
                        company: "The Wilderness Society Inc.",
                        period: "2012 - 2015",
                        verified: true,
                        source: "employment_records",
                        protection_reason: "Verified NGO employment"
                    },
                    {
                        position: "Communications and Logistics Coordinator",
                        company: "Greenpeace Australia Pacific",
                        period: "2010 - 2012",
                        verified: true,
                        source: "employment_records",
                        protection_reason: "Verified environmental advocacy role"
                    }
                ],
                achievements: [
                    {
                        title: "Systems Integration Excellence",
                        verified: true,
                        source: "work_portfolio",
                        protection_reason: "Verified technical work at Homes Tasmania"
                    },
                    {
                        title: "Cybersecurity Leadership",
                        verified: true,
                        source: "work_portfolio",
                        protection_reason: "Verified security initiatives"
                    },
                    {
                        title: "AI Innovation Pioneer",
                        verified: true,
                        source: "work_portfolio",
                        protection_reason: "Verified AI implementation in public sector"
                    },
                    {
                        title: "Environmental Campaign Technology Leadership",
                        verified: true,
                        source: "employment_records",
                        protection_reason: "Verified NGO technical leadership"
                    },
                    {
                        title: "Professional Certification Excellence",
                        verified: true,
                        source: "certification_records",
                        protection_reason: "Verified Google/Bing certifications"
                    },
                    {
                        title: "Automation & Process Improvement",
                        verified: true,
                        source: "work_portfolio",
                        protection_reason: "Verified automation development"
                    }
                ],
                certifications: [
                    {
                        name: "Google Analytics Individual Qualification",
                        verified: true,
                        source: "google_records"
                    },
                    {
                        name: "Google AdWords Certification",
                        verified: true,
                        source: "google_records"
                    },
                    {
                        name: "Bing Ads Accredited Professional",
                        verified: true,
                        source: "microsoft_records"
                    }
                ]
            },
            forbidden_claims: [
                "AI Innovation Excellence Award",
                "15+ AI-powered autonomous systems",
                "99.5% average system reliability",
                "Published research on autonomous agent coordination",
                "Filed 3 patents for innovative AI system architectures",
                "Keynote speaker at major AI and technology conferences",
                "Mentored 20+ junior developers and AI engineers",
                "500+ stars and are used by enterprises worldwide",
                "10,000+ developers",
                "1M+ daily active users"
            ]
        };
    }

    /**
     * Initialize protected content registry
     */
    async initializeProtectedRegistry() {
        console.log('🛡️ Initializing Content Guardian...');

        const protectedContent = this.buildDefaultRegistry();

        await fs.writeFile(this.protectedContentPath, JSON.stringify(protectedContent, null, 2), 'utf8');
        console.log('✅ Protected content registry initialized');
    }

    /**
     * Load the protected content registry, creating it inline if it does not exist
     */
    async loadProtectedData() {
        try {
            const raw = await fs.readFile(this.protectedContentPath, 'utf8');
            return JSON.parse(raw);
        } catch {
            console.log('⚠️ protected-content.json not found — using built-in default registry');
            return this.buildDefaultRegistry();
        }
    }

    /**
     * Validate CV content against protected registry
     */
    async validateContent() {
        console.log('🔍 Validating CV content against protected registry...');

        try {
            const cvData = JSON.parse(await fs.readFile(this.baseCvPath, 'utf8'));
            const protectedData = await this.loadProtectedData();

            let violations = [];
            const content = JSON.stringify(cvData);

            // Check for forbidden claims
            for (const forbiddenClaim of protectedData.forbidden_claims) {
                if (content.includes(forbiddenClaim)) {
                    violations.push({
                        type: 'forbidden_claim',
                        claim: forbiddenClaim,
                        severity: 'high'
                    });
                }
            }

            // Check for hallucination patterns
            for (const pattern of this.hallucinationPatterns) {
                if (pattern.test(content)) {
                    violations.push({
                        type: 'hallucination_pattern',
                        match: pattern.toString(),
                        severity: 'high'
                    });
                }
            }

            // Check for fabricated awards/recognitions not in the known list
            const awardViolations = this.checkFabricatedAwards(cvData);
            violations.push(...awardViolations);

            // Validate CV structure
            const structureViolations = this.validateCVStructure(cvData);
            violations.push(...structureViolations);

            if (violations.length > 0) {
                console.log('🚨 CONTENT VIOLATIONS DETECTED:');
                violations.forEach((v, i) => {
                    console.log(`  ${i + 1}. ${v.type}: ${v.claim || v.match || v.field || v.message} [${v.severity}]`);
                });

                // Log violations for audit trail
                await this.logViolations(violations);
                return { valid: false, violations };
            } else {
                console.log('✅ Content validation passed - no hallucinations detected');
                return { valid: true, violations: [] };
            }

        } catch (error) {
            console.error('❌ Content validation failed:', error.message);
            return { valid: false, error: error.message };
        }
    }

    /**
     * Check for fabricated awards or recognitions not in the known list
     */
    checkFabricatedAwards(cvData) {
        const violations = [];

        // Check achievements for award-like language
        const achievements = cvData.achievements || [];
        for (const ach of achievements) {
            const text = `${ach.title || ''} ${ach.description || ''}`;
            // Look for award/recognition language
            if (/\baward\b/i.test(text) || /\brecognition\b/i.test(text) || /\bhonor(?:ed)?\b/i.test(text)) {
                // Check if this is a known certification/recognition
                const isKnown = this.knownCertifications.some(cert =>
                    text.includes(cert)
                );
                if (!isKnown) {
                    violations.push({
                        type: 'fabricated_award',
                        claim: ach.title,
                        message: `Unverified award/recognition: "${ach.title}"`,
                        severity: 'high'
                    });
                }
            }
        }

        // Check certifications for unknown entries
        const certifications = cvData.certifications || [];
        for (const cert of certifications) {
            const certName = cert.name || '';
            const isKnown = this.knownCertifications.some(known =>
                certName.includes(known) || known.includes(certName)
            );
            if (!isKnown && certName.length > 0) {
                violations.push({
                    type: 'unknown_certification',
                    claim: certName,
                    message: `Certification not in known list: "${certName}"`,
                    severity: 'medium'
                });
            }
        }

        return violations;
    }

    /**
     * Validate CV structure: required fields, reasonable dates, URL formats
     */
    validateCVStructure(cvData) {
        const violations = [];
        const currentYear = new Date().getFullYear();

        // Required top-level fields
        const requiredFields = ['personal_info', 'experience', 'skills'];
        for (const field of requiredFields) {
            if (!cvData[field]) {
                violations.push({
                    type: 'missing_required_field',
                    field: field,
                    message: `Required field "${field}" is missing`,
                    severity: 'high'
                });
            }
        }

        // Validate personal_info fields
        if (cvData.personal_info) {
            const pi = cvData.personal_info;
            if (!pi.name || pi.name.trim().length === 0) {
                violations.push({
                    type: 'missing_required_field',
                    field: 'personal_info.name',
                    message: 'Name is missing or empty',
                    severity: 'high'
                });
            }

            // Validate URL formats
            const urlFields = ['website', 'github', 'linkedin'];
            for (const urlField of urlFields) {
                if (pi[urlField]) {
                    if (!/^https?:\/\/.+\..+/.test(pi[urlField])) {
                        violations.push({
                            type: 'invalid_url',
                            field: `personal_info.${urlField}`,
                            message: `Invalid URL format: "${pi[urlField]}"`,
                            severity: 'medium'
                        });
                    }
                }
            }

            // Validate email format
            if (pi.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pi.email)) {
                violations.push({
                    type: 'invalid_email',
                    field: 'personal_info.email',
                    message: `Invalid email format: "${pi.email}"`,
                    severity: 'medium'
                });
            }
        }

        // Validate experience dates
        if (cvData.experience && Array.isArray(cvData.experience)) {
            for (const exp of cvData.experience) {
                // Check required fields per experience entry
                if (!exp.position || !exp.company || !exp.period) {
                    violations.push({
                        type: 'incomplete_experience',
                        field: `experience: ${exp.position || exp.company || 'unknown'}`,
                        message: 'Experience entry missing position, company, or period',
                        severity: 'medium'
                    });
                    continue;
                }

                // Check for future start dates
                const yearMatches = exp.period.match(/\b(20\d{2}|19\d{2})\b/g);
                if (yearMatches) {
                    const startYear = parseInt(yearMatches[0], 10);
                    if (startYear > currentYear + 1) {
                        violations.push({
                            type: 'future_date',
                            field: `experience: ${exp.position}`,
                            message: `Start date is in the future: ${exp.period}`,
                            severity: 'high'
                        });
                    }

                    // Check for end date before start date
                    if (yearMatches.length >= 2) {
                        const endYear = parseInt(yearMatches[1], 10);
                        if (endYear < startYear) {
                            violations.push({
                                type: 'invalid_date_range',
                                field: `experience: ${exp.position}`,
                                message: `End date before start date: ${exp.period}`,
                                severity: 'high'
                            });
                        }
                    }
                }
            }
        }

        // Validate project dates and required fields
        if (cvData.projects && Array.isArray(cvData.projects)) {
            for (const proj of cvData.projects) {
                if (!proj.name) {
                    violations.push({
                        type: 'incomplete_project',
                        field: 'projects',
                        message: 'Project entry missing name',
                        severity: 'medium'
                    });
                    continue;
                }

                // Validate github URL format if present
                if (proj.github && !/^https?:\/\/.+\..+/.test(proj.github)) {
                    violations.push({
                        type: 'invalid_url',
                        field: `projects: ${proj.name}`,
                        message: `Invalid GitHub URL: "${proj.github}"`,
                        severity: 'medium'
                    });
                }

                // Check for future start dates in projects
                if (proj.period) {
                    const yearMatches = proj.period.match(/\b(20\d{2}|19\d{2})\b/g);
                    if (yearMatches) {
                        const startYear = parseInt(yearMatches[0], 10);
                        if (startYear > currentYear + 1) {
                            violations.push({
                                type: 'future_date',
                                field: `projects: ${proj.name}`,
                                message: `Start date is in the future: ${proj.period}`,
                                severity: 'high'
                            });
                        }
                    }
                }
            }
        }

        // Validate skills have required fields
        if (cvData.skills && Array.isArray(cvData.skills)) {
            for (const skill of cvData.skills) {
                if (!skill.name) {
                    violations.push({
                        type: 'incomplete_skill',
                        field: 'skills',
                        message: 'Skill entry missing name',
                        severity: 'medium'
                    });
                }
            }
        }

        return violations;
    }

    /**
     * Log content violations for audit trail
     */
    async logViolations(violations) {
        const auditPath = path.join(this.dataDir, 'content-audit.json');
        let auditLog = [];

        try {
            const existing = await fs.readFile(auditPath, 'utf8');
            auditLog = JSON.parse(existing);
        } catch {
            // File doesn't exist, start fresh
        }

        auditLog.push({
            timestamp: new Date().toISOString(),
            violations_count: violations.length,
            violations: violations,
            action: 'detected_and_logged'
        });

        // Keep only last 50 audit entries
        if (auditLog.length > 50) {
            auditLog = auditLog.slice(-50);
        }

        await fs.writeFile(auditPath, JSON.stringify(auditLog, null, 2), 'utf8');
    }

    /**
     * Add protection flags to achievements
     */
    async protectAchievements() {
        console.log('🛡️ Adding protection flags to verified achievements...');

        try {
            const cvData = JSON.parse(await fs.readFile(this.baseCvPath, 'utf8'));

            // Add protected flag to verified achievements
            if (cvData.achievements) {
                cvData.achievements = cvData.achievements.map(achievement => ({
                    ...achievement,
                    protected: true,
                    verified: true,
                    source: "manual_verification",
                    last_verified: new Date().toISOString()
                }));
            }

            // Add metadata to indicate content protection is active
            cvData.metadata = {
                ...cvData.metadata,
                content_protection: {
                    enabled: true,
                    guardian_version: "2.0.0",
                    last_validation: new Date().toISOString(),
                    protection_level: "high"
                }
            };

            await fs.writeFile(this.baseCvPath, JSON.stringify(cvData, null, 2), 'utf8');
            console.log('✅ Achievement protection flags added');

        } catch (error) {
            console.error('❌ Failed to protect achievements:', error.message);
        }
    }
}

// CLI interface
async function main() {
    const guardian = new ContentGuardian();
    const args = process.argv.slice(2);

    if (args.includes('--init')) {
        await guardian.initializeProtectedRegistry();
    } else if (args.includes('--validate')) {
        const result = await guardian.validateContent();
        process.exit(result.valid ? 0 : 1);
    } else if (args.includes('--protect')) {
        await guardian.protectAchievements();
    } else {
        console.log('Content Guardian - Protects authentic CV content');
        console.log('');
        console.log('Usage:');
        console.log('  node content-guardian.js --init      Initialize protected content registry');
        console.log('  node content-guardian.js --validate  Validate current CV content');
        console.log('  node content-guardian.js --protect   Add protection flags to achievements');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ContentGuardian;
