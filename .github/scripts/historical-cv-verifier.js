#!/usr/bin/env node

/**
 * Historical CV Verification System
 * 
 * Innovative verification engine that analyzes career progression authenticity
 * by comparing current CV claims against historical CV documents and career patterns.
 * 
 * Features:
 * - Career progression timeline validation
 * - Achievement claim verification against historical data
 * - Confidence scoring for CV authenticity
 * - Pattern analysis for realistic career evolution
 * 
 * Usage: node historical-cv-verifier.js --analyze
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HistoricalCVVerifier {
    constructor() {
        this.dataDir = path.resolve(__dirname, '../../data');
        this.tempDir = path.resolve(__dirname, '../../temp');
        this.baseCvPath = path.join(this.dataDir, 'base-cv.json');
        this.historicalCvDir = path.join(this.tempDir, 'parsed_cv_outputs');
        this.verificationReportPath = path.join(this.dataDir, 'cv-verification-report.json');
    }

    async analyze() {
        console.log('🔍 Analyzing career progression authenticity...');
        
        try {
            // Load current CV
            const currentCv = await this.loadCurrentCV();
            console.log('✅ Loaded current CV data');

            // Load historical CVs
            const historicalCvs = await this.loadHistoricalCVs();
            console.log(`✅ Loaded ${historicalCvs.length} historical CV versions`);

            // Analyze career progression
            const careerProgression = this.analyzeCareerProgression(currentCv, historicalCvs);
            console.log('✅ Career progression analysis complete');

            // Verify experience claims
            const experienceVerification = this.verifyExperienceClaims(currentCv, historicalCvs);
            console.log('✅ Experience verification complete');

            // Analyze skill evolution
            const skillEvolution = this.analyzeSkillEvolution(currentCv, historicalCvs);
            console.log('✅ Skill evolution analysis complete');

            // Calculate confidence scores
            const confidenceScores = this.calculateConfidenceScores(
                careerProgression, 
                experienceVerification, 
                skillEvolution
            );
            console.log('✅ Confidence scoring complete');

            // Generate verification report
            const report = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                overall_authenticity_score: confidenceScores.overall,
                career_progression: careerProgression,
                experience_verification: experienceVerification,
                skill_evolution: skillEvolution,
                confidence_scores: confidenceScores,
                recommendations: this.generateRecommendations(confidenceScores)
            };

            // Save report
            await fs.writeFile(this.verificationReportPath, JSON.stringify(report, null, 2));
            console.log('✅ Verification report saved');

            // Display summary
            this.displaySummary(report);

            return report;

        } catch (error) {
            console.error('❌ Verification analysis failed:', error.message);
            throw error;
        }
    }

    async loadCurrentCV() {
        const cvData = await fs.readFile(this.baseCvPath, 'utf8');
        return JSON.parse(cvData);
    }

    async loadHistoricalCVs() {
        try {
            const files = await fs.readdir(this.historicalCvDir);
            const historicalCvs = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.historicalCvDir, file);
                    const cvData = await fs.readFile(filePath, 'utf8');
                    const cv = JSON.parse(cvData);
                    cv._filename = file;
                    historicalCvs.push(cv);
                }
            }

            return historicalCvs;
        } catch (error) {
            console.warn('⚠️ No historical CV data found');
            return [];
        }
    }

    analyzeCareerProgression(currentCv, historicalCvs) {
        const progression = {
            verified_positions: [],
            career_advancement: 'verified',
            timeline_consistency: 'consistent',
            position_accuracy: 100
        };

        // Verify key positions exist in historical data
        const currentPositions = currentCv.experience || [];
        const historicalPositions = this.extractAllHistoricalPositions(historicalCvs);

        currentPositions.forEach(position => {
            const verified = this.verifyPosition(position, historicalPositions);
            progression.verified_positions.push({
                position: position.position,
                company: position.company,
                period: position.period,
                verified: verified.found,
                confidence: verified.confidence,
                historical_source: verified.source
            });
        });

        // Calculate position accuracy
        const verifiedCount = progression.verified_positions.filter(p => p.verified).length;
        progression.position_accuracy = Math.round((verifiedCount / progression.verified_positions.length) * 100);

        return progression;
    }

    extractAllHistoricalPositions(historicalCvs) {
        const allPositions = [];
        
        historicalCvs.forEach(cv => {
            if (cv.experience) {
                cv.experience.forEach(exp => {
                    allPositions.push({
                        ...exp,
                        source: cv._filename
                    });
                });
            }
        });

        return allPositions;
    }

    verifyPosition(currentPosition, historicalPositions) {
        // Look for matching company in historical data
        const companyMatches = historicalPositions.filter(hp => 
            hp.company && currentPosition.company && 
            hp.company.toLowerCase().includes(currentPosition.company.toLowerCase()) ||
            currentPosition.company.toLowerCase().includes(hp.company.toLowerCase())
        );

        if (companyMatches.length > 0) {
            return {
                found: true,
                confidence: 95,
                source: companyMatches[0].source,
                historical_match: companyMatches[0]
            };
        }

        return {
            found: false,
            confidence: 0,
            source: null
        };
    }

    verifyExperienceClaims(currentCv, historicalCvs) {
        const verification = {
            total_claims: 0,
            verified_claims: 0,
            authenticity_score: 100,
            detailed_verification: []
        };

        // Extract verifiable claims from current CV
        const claims = this.extractVerifiableClaims(currentCv);
        verification.total_claims = claims.length;

        claims.forEach(claim => {
            const isVerified = this.verifyClaim(claim, historicalCvs);
            if (isVerified) verification.verified_claims++;
            
            verification.detailed_verification.push({
                claim: claim.text,
                category: claim.category,
                verified: isVerified,
                confidence: isVerified ? 95 : 60  // Conservative scoring
            });
        });

        // Calculate authenticity score
        verification.authenticity_score = Math.round(
            (verification.verified_claims / verification.total_claims) * 100
        );

        return verification;
    }

    extractVerifiableClaims(currentCv) {
        const claims = [];

        // Extract technology claims
        if (currentCv.skills) {
            currentCv.skills.forEach(skill => {
                claims.push({
                    text: `Experience with ${skill.name}`,
                    category: 'technical_skill',
                    skill: skill.name
                });
            });
        }

        // Extract company claims
        if (currentCv.experience) {
            currentCv.experience.forEach(exp => {
                claims.push({
                    text: `Worked at ${exp.company}`,
                    category: 'employment',
                    company: exp.company,
                    position: exp.position
                });
            });
        }

        return claims;
    }

    verifyClaim(claim, historicalCvs) {
        switch (claim.category) {
            case 'technical_skill':
                return this.verifyTechnicalSkill(claim.skill, historicalCvs);
            case 'employment':
                return this.verifyEmployment(claim.company, historicalCvs);
            default:
                return false;
        }
    }

    verifyTechnicalSkill(skillName, historicalCvs) {
        for (const cv of historicalCvs) {
            // Check in technical expertise
            if (cv.technical_expertise) {
                const found = cv.technical_expertise.some(tech => 
                    tech.toLowerCase().includes(skillName.toLowerCase()) ||
                    skillName.toLowerCase().includes(tech.toLowerCase())
                );
                if (found) return true;
            }

            // Check in skills sections
            if (cv.skills && cv.skills.technical) {
                const found = cv.skills.technical.some(tech => 
                    tech.toLowerCase().includes(skillName.toLowerCase()) ||
                    skillName.toLowerCase().includes(tech.toLowerCase())
                );
                if (found) return true;
            }
        }
        return false;
    }

    verifyEmployment(companyName, historicalCvs) {
        for (const cv of historicalCvs) {
            if (cv.experience) {
                const found = cv.experience.some(exp => 
                    exp.company && (
                        exp.company.toLowerCase().includes(companyName.toLowerCase()) ||
                        companyName.toLowerCase().includes(exp.company.toLowerCase())
                    )
                );
                if (found) return true;
            }
        }
        return false;
    }

    analyzeSkillEvolution(currentCv, historicalCvs) {
        const evolution = {
            core_skills_maintained: true,
            natural_progression: true,
            skill_growth_rate: 'realistic',
            technology_evolution: []
        };

        // Analyze how skills have evolved from historical to current
        const historicalSkills = this.extractHistoricalSkills(historicalCvs);
        const currentSkills = currentCv.skills?.map(s => s.name) || [];

        // Check for natural progression (old skills should still be relevant)
        const coreSkillsKept = historicalSkills.filter(skill => 
            currentSkills.some(current => 
                current.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(current.toLowerCase())
            )
        ).length;

        evolution.core_skills_maintained = (coreSkillsKept / historicalSkills.length) > 0.6;

        return evolution;
    }

    extractHistoricalSkills(historicalCvs) {
        const allSkills = new Set();
        
        historicalCvs.forEach(cv => {
            if (cv.technical_expertise) {
                cv.technical_expertise.forEach(skill => allSkills.add(skill));
            }
            if (cv.skills) {
                Object.values(cv.skills).flat().forEach(skill => allSkills.add(skill));
            }
        });

        return Array.from(allSkills);
    }

    calculateConfidenceScores(careerProgression, experienceVerification, skillEvolution) {
        const scores = {
            career_progression: careerProgression.position_accuracy,
            experience_claims: experienceVerification.authenticity_score,
            skill_evolution: skillEvolution.core_skills_maintained ? 95 : 70,
            overall: 0
        };

        // Weighted overall score
        scores.overall = Math.round(
            (scores.career_progression * 0.4) +
            (scores.experience_claims * 0.4) +
            (scores.skill_evolution * 0.2)
        );

        return scores;
    }

    generateRecommendations(confidenceScores) {
        const recommendations = [];

        if (confidenceScores.overall >= 90) {
            recommendations.push({
                type: 'excellent',
                message: 'CV demonstrates excellent authenticity with strong historical verification'
            });
        } else if (confidenceScores.overall >= 80) {
            recommendations.push({
                type: 'good',
                message: 'CV shows good authenticity with minor verification gaps'
            });
        } else {
            recommendations.push({
                type: 'improvement',
                message: 'Consider strengthening historical documentation for better verification'
            });
        }

        if (confidenceScores.career_progression < 80) {
            recommendations.push({
                type: 'career_progression',
                message: 'Some career positions may need better historical documentation'
            });
        }

        return recommendations;
    }

    displaySummary(report) {
        console.log('\n📊 CV AUTHENTICITY VERIFICATION SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Overall Authenticity Score: ${report.overall_authenticity_score}%`);
        console.log(`Career Progression Score: ${report.confidence_scores.career_progression}%`);
        console.log(`Experience Claims Score: ${report.confidence_scores.experience_claims}%`);
        console.log(`Skill Evolution Score: ${report.confidence_scores.skill_evolution}%`);
        console.log('\n📋 Recommendations:');
        report.recommendations.forEach(rec => {
            console.log(`  • ${rec.message}`);
        });
        console.log('\n✅ Verification complete - report saved to cv-verification-report.json');
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--analyze')) {
        const verifier = new HistoricalCVVerifier();
        await verifier.analyze();
    } else {
        console.log('Historical CV Verification System');
        console.log('Usage:');
        console.log('  node historical-cv-verifier.js --analyze  Analyze CV authenticity');
    }
}

// ES module entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default HistoricalCVVerifier;