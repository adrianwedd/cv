#!/usr/bin/env node

/**
 * AI-Powered Recommendation Engine
 * 
 * Advanced recommendation system providing intelligent project suggestions,
 * career progression paths, content optimization recommendations, and
 * personalized learning paths based on AI analysis and market intelligence.
 * 
 * Features:
 * - Project recommendation based on skill alignment
 * - Career progression path analysis
 * - Content optimization suggestions
 * - Learning path personalization
 * - Market opportunity identification
 * - Competitive positioning analysis
 * - Performance optimization recommendations
 * 
 * @author Claude Code - Intelligence Orchestrator
 * @version 1.0.0
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Project Recommendation Engine
 * Analyzes skills, market trends, and career goals to suggest optimal projects
 */
class ProjectRecommendationEngine {
    constructor(config) {
        this.config = config;
        this.projectDatabase = new Map();
        this.skillProjectMapping = new Map();
        this.marketTrends = new Map();
        
        this.initializeProjectDatabase();
        this.initializeSkillMappings();
    }

    /**
     * Initialize comprehensive project database with market relevance
     */
    initializeProjectDatabase() {
        const projectCategories = {
            'AI/ML Projects': [
                {
                    name: 'Computer Vision Pipeline',
                    skills: ['python', 'opencv', 'tensorflow', 'pytorch'],
                    complexity: 85,
                    marketDemand: 90,
                    timeToComplete: '2-3 months',
                    careerImpact: 'high',
                    description: 'End-to-end computer vision system with model training, deployment, and monitoring'
                },
                {
                    name: 'NLP Content Analyzer',
                    skills: ['python', 'transformers', 'spacy', 'fastapi'],
                    complexity: 75,
                    marketDemand: 85,
                    timeToComplete: '1-2 months',
                    careerImpact: 'high',
                    description: 'Natural language processing system for content analysis and sentiment detection'
                },
                {
                    name: 'MLOps Automation Platform',
                    skills: ['python', 'docker', 'kubernetes', 'mlflow'],
                    complexity: 90,
                    marketDemand: 95,
                    timeToComplete: '3-4 months',
                    careerImpact: 'very_high',
                    description: 'Complete MLOps platform with automated model training, deployment, and monitoring'
                }
            ],
            'Web Development Projects': [
                {
                    name: 'Real-time Analytics Dashboard',
                    skills: ['react', 'typescript', 'websockets', 'redis'],
                    complexity: 70,
                    marketDemand: 80,
                    timeToComplete: '1-2 months',
                    careerImpact: 'medium',
                    description: 'Interactive dashboard with real-time data visualization and user analytics'
                },
                {
                    name: 'Microservices Architecture',
                    skills: ['node.js', 'docker', 'kubernetes', 'postgresql'],
                    complexity: 85,
                    marketDemand: 90,
                    timeToComplete: '2-3 months',
                    careerImpact: 'high',
                    description: 'Scalable microservices system with API gateway, service mesh, and monitoring'
                }
            ],
            'Cloud Infrastructure Projects': [
                {
                    name: 'Multi-Cloud Deployment Pipeline',
                    skills: ['aws', 'terraform', 'docker', 'jenkins'],
                    complexity: 80,
                    marketDemand: 90,
                    timeToComplete: '2-3 months',
                    careerImpact: 'high',
                    description: 'Automated deployment pipeline supporting multiple cloud providers with IaC'
                },
                {
                    name: 'Serverless Data Processing',
                    skills: ['aws lambda', 'python', 'dynamodb', 'api gateway'],
                    complexity: 75,
                    marketDemand: 85,
                    timeToComplete: '1-2 months',
                    careerImpact: 'medium',
                    description: 'Event-driven serverless architecture for large-scale data processing'
                }
            ],
            'Data Engineering Projects': [
                {
                    name: 'Real-time Data Lake',
                    skills: ['kafka', 'spark', 'hdfs', 'python'],
                    complexity: 90,
                    marketDemand: 85,
                    timeToComplete: '3-4 months',
                    careerImpact: 'very_high',
                    description: 'Scalable data lake with real-time ingestion, processing, and analytics capabilities'
                }
            ]
        };

        for (const [category, projects] of Object.entries(projectCategories)) {
            for (const project of projects) {
                this.projectDatabase.set(project.name.toLowerCase(), {
                    ...project,
                    category,
                    id: this.generateProjectId(project.name),
                    alignmentScore: 0 // Will be calculated based on user skills
                });
            }
        }
    }

    /**
     * Initialize skill-to-project mappings
     */
    initializeSkillMappings() {
        for (const [projectName, project] of this.projectDatabase) {
            for (const skill of project.skills) {
                if (!this.skillProjectMapping.has(skill)) {
                    this.skillProjectMapping.set(skill, []);
                }
                this.skillProjectMapping.get(skill).push(projectName);
            }
        }
    }

    /**
     * Generate project recommendations based on skill analysis
     */
    async generateProjectRecommendations(skillAnalysis, preferences = {}) {
        console.log('🚀 Generating AI-powered project recommendations...');

        const userSkills = this.extractUserSkills(skillAnalysis);
        const skillLevels = this.extractSkillLevels(skillAnalysis);
        const marketAlignment = skillAnalysis.market_alignment || {};

        // Calculate project alignment scores
        const alignedProjects = this.calculateProjectAlignment(userSkills, skillLevels);
        
        // Apply preference filters
        const filteredProjects = this.applyPreferences(alignedProjects, preferences);
        
        // Generate recommendations by category
        const recommendations = {
            immediate_opportunities: this.getImmediateOpportunities(filteredProjects, skillLevels),
            skill_building_projects: this.getSkillBuildingProjects(filteredProjects, skillAnalysis),
            career_advancement_projects: this.getCareerAdvancementProjects(filteredProjects, marketAlignment),
            innovation_projects: this.getInnovationProjects(filteredProjects),
            portfolio_diversification: this.getPortfolioDiversification(filteredProjects, userSkills)
        };

        // Generate implementation roadmap
        recommendations.implementation_roadmap = this.generateImplementationRoadmap(recommendations);
        
        // Add success metrics and tracking
        recommendations.success_metrics = this.generateSuccessMetrics(recommendations);

        console.log(`✅ Generated ${Object.values(recommendations).flat().length} project recommendations`);
        return recommendations;
    }

    /**
     * Extract user skills from analysis
     */
    extractUserSkills(skillAnalysis) {
        return (skillAnalysis.analyzed_skills || [])
            .map(skill => skill.name.toLowerCase())
            .filter(skill => skill);
    }

    /**
     * Extract skill levels mapping
     */
    extractSkillLevels(skillAnalysis) {
        const levels = new Map();
        
        for (const skill of skillAnalysis.analyzed_skills || []) {
            levels.set(skill.name.toLowerCase(), {
                level: skill.proficiency_level,
                score: skill.proficiency_score || 0,
                confidence: skill.confidence || 0
            });
        }
        
        return levels;
    }

    /**
     * Calculate alignment score for each project
     */
    calculateProjectAlignment(userSkills, skillLevels) {
        const alignedProjects = [];

        for (const [projectName, project] of this.projectDatabase) {
            const alignmentScore = this.calculateIndividualAlignment(project, userSkills, skillLevels);
            
            alignedProjects.push({
                ...project,
                alignmentScore,
                skillGaps: this.identifySkillGaps(project, userSkills, skillLevels),
                readinessLevel: this.assessReadinessLevel(project, userSkills, skillLevels)
            });
        }

        return alignedProjects.sort((a, b) => b.alignmentScore - a.alignmentScore);
    }

    /**
     * Calculate alignment score for individual project
     */
    calculateIndividualAlignment(project, userSkills, skillLevels) {
        const requiredSkills = project.skills;
        let alignmentScore = 0;
        let totalWeight = 0;

        for (const skill of requiredSkills) {
            const skillLower = skill.toLowerCase();
            const userHasSkill = userSkills.includes(skillLower);
            const skillLevel = skillLevels.get(skillLower);
            
            let skillScore = 0;
            
            if (userHasSkill && skillLevel) {
                // Score based on proficiency level
                const levelScores = {
                    'Expert': 100,
                    'Advanced': 85,
                    'Intermediate': 65,
                    'Beginner': 40,
                    'Novice': 20
                };
                skillScore = levelScores[skillLevel.level] || 0;
                
                // Adjust for confidence
                skillScore *= (skillLevel.confidence / 100);
            }
            
            // Weight core technologies higher
            const weight = this.isCoreTechnology(skill) ? 1.5 : 1.0;
            alignmentScore += skillScore * weight;
            totalWeight += weight;
        }

        // Normalize to 0-100 scale
        const normalizedScore = totalWeight > 0 ? (alignmentScore / totalWeight) : 0;
        
        // Bonus for having all required skills
        const skillCoverage = requiredSkills.filter(skill => 
            userSkills.includes(skill.toLowerCase())
        ).length / requiredSkills.length;
        
        const coverageBonus = skillCoverage === 1.0 ? 15 : skillCoverage > 0.7 ? 10 : 0;
        
        return Math.min(normalizedScore + coverageBonus, 100);
    }

    /**
     * Check if skill is considered core technology
     */
    isCoreTechnology(skill) {
        const coreTechnologies = [
            'python', 'javascript', 'react', 'aws', 'docker', 
            'kubernetes', 'tensorflow', 'pytorch'
        ];
        return coreTechnologies.includes(skill.toLowerCase());
    }

    /**
     * Identify skill gaps for project
     */
    identifySkillGaps(project, userSkills, skillLevels) {
        const gaps = [];
        
        for (const requiredSkill of project.skills) {
            const skillLower = requiredSkill.toLowerCase();
            const hasSkill = userSkills.includes(skillLower);
            const skillLevel = skillLevels.get(skillLower);
            
            if (!hasSkill) {
                gaps.push({
                    skill: requiredSkill,
                    type: 'missing',
                    severity: this.isCoreTechnology(requiredSkill) ? 'high' : 'medium',
                    estimatedLearningTime: this.estimateSkillLearningTime(requiredSkill)
                });
            } else if (skillLevel && ['Novice', 'Beginner'].includes(skillLevel.level)) {
                gaps.push({
                    skill: requiredSkill,
                    type: 'insufficient_level',
                    currentLevel: skillLevel.level,
                    targetLevel: 'Intermediate',
                    severity: 'medium',
                    estimatedImprovementTime: this.estimateImprovementTime(skillLevel.level, 'Intermediate')
                });
            }
        }
        
        return gaps;
    }

    /**
     * Assess readiness level for project
     */
    assessReadinessLevel(project, userSkills, skillLevels) {
        const alignmentScore = project.alignmentScore || 0;
        const skillGaps = this.identifySkillGaps(project, userSkills, skillLevels);
        const criticalGaps = skillGaps.filter(gap => gap.severity === 'high').length;
        
        if (alignmentScore >= 80 && criticalGaps === 0) return 'ready';
        if (alignmentScore >= 60 && criticalGaps <= 1) return 'mostly_ready';
        if (alignmentScore >= 40 && criticalGaps <= 2) return 'preparation_needed';
        return 'significant_preparation_needed';
    }

    /**
     * Estimate learning time for new skill
     */
    estimateSkillLearningTime(skill) {
        const learningTimes = {
            'python': '40-60 hours',
            'javascript': '30-50 hours',
            'react': '25-40 hours',
            'docker': '20-35 hours',
            'kubernetes': '50-80 hours',
            'tensorflow': '60-100 hours',
            'aws': '40-80 hours'
        };
        
        return learningTimes[skill.toLowerCase()] || '30-50 hours';
    }

    /**
     * Estimate improvement time between skill levels
     */
    estimateImprovementTime(currentLevel, targetLevel) {
        const improvements = {
            'Novice->Beginner': '15-25 hours',
            'Beginner->Intermediate': '25-40 hours',
            'Intermediate->Advanced': '40-80 hours',
            'Advanced->Expert': '80-120 hours'
        };
        
        return improvements[`${currentLevel}->${targetLevel}`] || '25-50 hours';
    }

    /**
     * Apply user preferences to filter projects
     */
    applyPreferences(projects, preferences) {
        let filtered = [...projects];
        
        // Filter by complexity preference
        if (preferences.maxComplexity) {
            filtered = filtered.filter(p => p.complexity <= preferences.maxComplexity);
        }
        
        // Filter by time commitment
        if (preferences.maxTimeCommitment) {
            filtered = filtered.filter(p => this.parseTimeCommitment(p.timeToComplete) <= preferences.maxTimeCommitment);
        }
        
        // Filter by categories
        if (preferences.preferredCategories && preferences.preferredCategories.length > 0) {
            filtered = filtered.filter(p => preferences.preferredCategories.includes(p.category));
        }
        
        return filtered;
    }

    /**
     * Parse time commitment to months
     */
    parseTimeCommitment(timeString) {
        const match = timeString.match(/(\d+)-?(\d+)?\s*months?/);
        return match ? parseInt(match[1]) : 2;
    }

    /**
     * Get immediate opportunities (high alignment, ready to start)
     */
    getImmediateOpportunities(projects, skillLevels) {
        return projects
            .filter(p => p.readinessLevel === 'ready' && p.alignmentScore >= 70)
            .slice(0, 5)
            .map(project => ({
                ...project,
                recommendationType: 'immediate_opportunity',
                reasoning: `High skill alignment (${Math.round(project.alignmentScore)}%) with existing expertise`,
                successProbability: this.calculateSuccessProbability(project, 'immediate'),
                expectedOutcomes: this.generateExpectedOutcomes(project, 'immediate')
            }));
    }

    /**
     * Get skill building projects (moderate alignment, educational value)
     */
    getSkillBuildingProjects(projects, skillAnalysis) {
        const skillGaps = skillAnalysis.skill_gaps?.high_demand_gaps || [];
        const gapSkills = skillGaps.map(gap => gap.skill.toLowerCase());
        
        return projects
            .filter(p => {
                const hasGapSkill = p.skills.some(skill => gapSkills.includes(skill.toLowerCase()));
                return hasGapSkill && p.readinessLevel === 'preparation_needed';
            })
            .slice(0, 4)
            .map(project => ({
                ...project,
                recommendationType: 'skill_building',
                reasoning: 'Addresses identified skill gaps in high-demand technologies',
                skillsToGain: project.skills.filter(skill => gapSkills.includes(skill.toLowerCase())),
                successProbability: this.calculateSuccessProbability(project, 'skill_building'),
                expectedOutcomes: this.generateExpectedOutcomes(project, 'skill_building')
            }));
    }

    /**
     * Get career advancement projects (high market impact)
     */
    getCareerAdvancementProjects(projects, marketAlignment) {
        return projects
            .filter(p => p.careerImpact === 'very_high' || p.careerImpact === 'high')
            .filter(p => p.marketDemand >= 85)
            .slice(0, 3)
            .map(project => ({
                ...project,
                recommendationType: 'career_advancement',
                reasoning: 'High career impact potential with strong market demand',
                careerBenefits: this.generateCareerBenefits(project),
                successProbability: this.calculateSuccessProbability(project, 'career_advancement'),
                expectedOutcomes: this.generateExpectedOutcomes(project, 'career_advancement')
            }));
    }

    /**
     * Get innovation projects (emerging technologies, high complexity)
     */
    getInnovationProjects(projects) {
        return projects
            .filter(p => p.complexity >= 85)
            .filter(p => this.hasEmergingTech(p.skills))
            .slice(0, 2)
            .map(project => ({
                ...project,
                recommendationType: 'innovation',
                reasoning: 'Cutting-edge technology with innovation potential',
                innovationAspects: this.identifyInnovationAspects(project),
                successProbability: this.calculateSuccessProbability(project, 'innovation'),
                expectedOutcomes: this.generateExpectedOutcomes(project, 'innovation')
            }));
    }

    /**
     * Check if project uses emerging technologies
     */
    hasEmergingTech(skills) {
        const emergingTech = ['rust', 'webassembly', 'quantum', 'edge computing', 'graphql'];
        return skills.some(skill => emergingTech.some(tech => skill.toLowerCase().includes(tech)));
    }

    /**
     * Get portfolio diversification projects
     */
    getPortfolioDiversification(projects, userSkills) {
        const userCategories = new Set();
        
        for (const [, project] of this.projectDatabase) {
            const hasSkills = project.skills.some(skill => userSkills.includes(skill.toLowerCase()));
            if (hasSkills) {
                userCategories.add(project.category);
            }
        }
        
        return projects
            .filter(p => !userCategories.has(p.category))
            .filter(p => p.alignmentScore >= 40)
            .slice(0, 3)
            .map(project => ({
                ...project,
                recommendationType: 'portfolio_diversification',
                reasoning: `Diversify into ${project.category} to broaden technical profile`,
                diversificationBenefits: this.generateDiversificationBenefits(project),
                successProbability: this.calculateSuccessProbability(project, 'diversification'),
                expectedOutcomes: this.generateExpectedOutcomes(project, 'diversification')
            }));
    }

    /**
     * Calculate success probability for project
     */
    calculateSuccessProbability(project, type) {
        const baseScore = project.alignmentScore || 0;
        const complexityPenalty = (project.complexity - 50) * 0.3;
        const readinessBonus = {
            'ready': 20,
            'mostly_ready': 10,
            'preparation_needed': 0,
            'significant_preparation_needed': -15
        }[project.readinessLevel] || 0;
        
        const typeBonus = {
            'immediate': 15,
            'skill_building': 5,
            'career_advancement': 10,
            'innovation': -10,
            'diversification': 0
        }[type] || 0;
        
        const probability = Math.max(20, Math.min(95, 
            baseScore + readinessBonus + typeBonus - complexityPenalty
        ));
        
        return Math.round(probability);
    }

    /**
     * Generate expected outcomes for project
     */
    generateExpectedOutcomes(project, type) {
        const baseOutcomes = [
            'Enhanced technical portfolio',
            'Practical experience with modern technologies',
            'Improved problem-solving capabilities'
        ];
        
        const typeSpecificOutcomes = {
            'immediate': [
                'Quick portfolio enhancement',
                'Immediate skill application',
                'Confidence building'
            ],
            'skill_building': [
                'New technology proficiency',
                'Expanded skill set',
                'Market alignment improvement'
            ],
            'career_advancement': [
                'Leadership experience',
                'High-impact project delivery',
                'Senior role readiness'
            ],
            'innovation': [
                'Thought leadership opportunities',
                'Competitive differentiation',
                'Future technology expertise'
            ],
            'diversification': [
                'Broader technical perspective',
                'Cross-domain expertise',
                'Increased adaptability'
            ]
        };
        
        return [...baseOutcomes, ...(typeSpecificOutcomes[type] || [])];
    }

    /**
     * Generate career benefits
     */
    generateCareerBenefits(project) {
        const benefits = [];
        
        if (project.marketDemand >= 90) {
            benefits.push('High market demand increases job opportunities');
        }
        
        if (project.complexity >= 80) {
            benefits.push('Complex project demonstrates senior-level capabilities');
        }
        
        if (project.careerImpact === 'very_high') {
            benefits.push('Significant portfolio impact for leadership roles');
        }
        
        benefits.push(`${project.category} experience broadens career options`);
        
        return benefits;
    }

    /**
     * Identify innovation aspects
     */
    identifyInnovationAspects(project) {
        const aspects = [];
        
        if (project.complexity >= 90) {
            aspects.push('Cutting-edge technical complexity');
        }
        
        if (project.skills.includes('machine learning') || project.skills.includes('ai')) {
            aspects.push('AI/ML innovation opportunities');
        }
        
        if (project.category === 'Cloud Infrastructure Projects') {
            aspects.push('Next-generation infrastructure patterns');
        }
        
        aspects.push('Opportunity for technical thought leadership');
        
        return aspects;
    }

    /**
     * Generate diversification benefits
     */
    generateDiversificationBenefits(project) {
        return [
            `Entry into ${project.category} domain`,
            'Broader technical perspective',
            'Increased market versatility',
            'Cross-domain problem-solving experience'
        ];
    }

    /**
     * Generate implementation roadmap
     */
    generateImplementationRoadmap(recommendations) {
        const allProjects = [
            ...recommendations.immediate_opportunities,
            ...recommendations.skill_building_projects,
            ...recommendations.career_advancement_projects,
            ...recommendations.innovation_projects,
            ...recommendations.portfolio_diversification
        ];

        // Sort by priority and readiness
        const prioritizedProjects = allProjects
            .sort((a, b) => {
                const priorityOrder = {
                    'immediate_opportunity': 4,
                    'career_advancement': 3,
                    'skill_building': 2,
                    'diversification': 1,
                    'innovation': 1
                };
                
                return priorityOrder[b.recommendationType] - priorityOrder[a.recommendationType];
            })
            .slice(0, 8); // Top 8 recommendations

        const roadmapPhases = {
            'Phase 1 (Next 3 months)': [],
            'Phase 2 (3-6 months)': [],
            'Phase 3 (6-12 months)': []
        };

        // Distribute projects across phases
        prioritizedProjects.forEach((project, index) => {
            if (index < 2 && project.readinessLevel === 'ready') {
                roadmapPhases['Phase 1 (Next 3 months)'].push(project);
            } else if (index < 5) {
                roadmapPhases['Phase 2 (3-6 months)'].push(project);
            } else {
                roadmapPhases['Phase 3 (6-12 months)'].push(project);
            }
        });

        return roadmapPhases;
    }

    /**
     * Generate success metrics
     */
    generateSuccessMetrics(recommendations) {
        const allProjects = Object.values(recommendations).flat()
            .filter(item => item.name); // Filter out non-project items
        
        return {
            portfolio_impact_score: this.calculatePortfolioImpact(allProjects),
            skill_advancement_potential: this.calculateSkillAdvancement(allProjects),
            market_alignment_improvement: this.calculateMarketImprovement(allProjects),
            career_progression_acceleration: this.calculateCareerAcceleration(allProjects),
            success_probability_average: this.calculateAverageSuccessProbability(allProjects),
            estimated_completion_timeline: this.calculateCompletionTimeline(allProjects)
        };
    }

    calculatePortfolioImpact(projects) {
        const impactWeights = {
            'very_high': 25,
            'high': 20,
            'medium': 10,
            'low': 5
        };
        
        const totalImpact = projects.reduce((sum, project) => {
            return sum + (impactWeights[project.careerImpact] || 0);
        }, 0);
        
        return Math.min(100, totalImpact);
    }

    calculateSkillAdvancement(projects) {
        const uniqueSkills = new Set();
        projects.forEach(project => {
            project.skills.forEach(skill => uniqueSkills.add(skill));
        });
        
        return Math.min(100, uniqueSkills.size * 8); // 8 points per unique skill
    }

    calculateMarketImprovement(projects) {
        const averageMarketDemand = projects.reduce((sum, project) => {
            return sum + (project.marketDemand || 50);
        }, 0) / projects.length;
        
        return Math.round(averageMarketDemand);
    }

    calculateCareerAcceleration(projects) {
        const highImpactProjects = projects.filter(p => 
            ['very_high', 'high'].includes(p.careerImpact)
        ).length;
        
        return Math.min(100, highImpactProjects * 20); // 20 points per high-impact project
    }

    calculateAverageSuccessProbability(projects) {
        if (projects.length === 0) return 0;
        
        const averageProbability = projects.reduce((sum, project) => {
            return sum + (project.successProbability || 0);
        }, 0) / projects.length;
        
        return Math.round(averageProbability);
    }

    calculateCompletionTimeline(projects) {
        const timelineMonths = projects.map(project => {
            return this.parseTimeCommitment(project.timeToComplete || '2 months');
        });
        
        const totalMonths = timelineMonths.reduce((sum, months) => sum + months, 0);
        const parallelMonths = Math.max(...timelineMonths);
        
        return {
            sequential_completion: `${totalMonths} months`,
            parallel_completion: `${parallelMonths} months`,
            recommended_approach: totalMonths > 12 ? 'parallel' : 'sequential'
        };
    }

    /**
     * Generate project ID
     */
    generateProjectId(name) {
        return crypto.createHash('md5').update(name).digest('hex').substring(0, 8);
    }
}

/**
 * Career Progression Path Analyzer
 * Analyzes current position and provides intelligent career advancement recommendations
 */
class CareerProgressionAnalyzer {
    constructor(config) {
        this.config = config;
        this.careerLevels = new Map();
        this.progressionPaths = new Map();
        this.marketIntelligence = new Map();
        
        this.initializeCareerLevels();
        this.initializeProgressionPaths();
    }

    /**
     * Initialize career progression levels
     */
    initializeCareerLevels() {
        const levels = {
            'junior_developer': {
                level: 1,
                title: 'Junior Developer',
                experience: '0-2 years',
                keySkills: ['Programming fundamentals', 'Version control', 'Basic frameworks'],
                responsibilities: ['Feature implementation', 'Bug fixes', 'Code reviews'],
                compensation_range: '$45,000-$70,000'
            },
            'mid_developer': {
                level: 2,
                title: 'Mid-Level Developer',
                experience: '2-5 years',
                keySkills: ['Advanced programming', 'System design basics', 'Testing'],
                responsibilities: ['Feature ownership', 'Technical documentation', 'Mentoring juniors'],
                compensation_range: '$70,000-$100,000'
            },
            'senior_developer': {
                level: 3,
                title: 'Senior Developer',
                experience: '5-8 years',
                keySkills: ['System architecture', 'Performance optimization', 'Team collaboration'],
                responsibilities: ['Architecture decisions', 'Code quality standards', 'Technical leadership'],
                compensation_range: '$100,000-$140,000'
            },
            'tech_lead': {
                level: 4,
                title: 'Technical Lead',
                experience: '6-10 years',
                keySkills: ['Team leadership', 'Project management', 'Strategic thinking'],
                responsibilities: ['Team guidance', 'Technical strategy', 'Cross-team collaboration'],
                compensation_range: '$120,000-$170,000'
            },
            'senior_tech_lead': {
                level: 5,
                title: 'Senior Technical Lead / Principal Engineer',
                experience: '8-12 years',
                keySkills: ['Advanced architecture', 'Organizational influence', 'Innovation'],
                responsibilities: ['Multi-team leadership', 'Technology vision', 'Strategic initiatives'],
                compensation_range: '$150,000-$220,000'
            },
            'engineering_manager': {
                level: 5,
                title: 'Engineering Manager',
                experience: '7-12 years',
                keySkills: ['People management', 'Strategic planning', 'Business acumen'],
                responsibilities: ['Team management', 'Performance management', 'Budget planning'],
                compensation_range: '$140,000-$200,000'
            },
            'director_engineering': {
                level: 6,
                title: 'Director of Engineering',
                experience: '10-15 years',
                keySkills: ['Executive leadership', 'Organizational strategy', 'Business alignment'],
                responsibilities: ['Department leadership', 'Strategic planning', 'Executive reporting'],
                compensation_range: '$180,000-$300,000'
            }
        };

        for (const [key, levelData] of Object.entries(levels)) {
            this.careerLevels.set(key, levelData);
        }
    }

    /**
     * Initialize career progression paths
     */
    initializeProgressionPaths() {
        const paths = {
            'technical_track': {
                name: 'Technical Leadership Track',
                description: 'Focus on technical expertise and architectural leadership',
                progression: [
                    'junior_developer',
                    'mid_developer', 
                    'senior_developer',
                    'tech_lead',
                    'senior_tech_lead'
                ],
                skills_emphasis: ['Technical depth', 'Architecture', 'Innovation', 'Technical mentoring'],
                career_ceiling: 'CTO / VP Engineering'
            },
            'management_track': {
                name: 'Engineering Management Track',
                description: 'Focus on people leadership and organizational management',
                progression: [
                    'junior_developer',
                    'mid_developer',
                    'senior_developer',
                    'engineering_manager',
                    'director_engineering'
                ],
                skills_emphasis: ['People management', 'Strategic thinking', 'Business acumen', 'Organizational leadership'],
                career_ceiling: 'VP Engineering / CTO'
            },
            'hybrid_track': {
                name: 'Hybrid Leadership Track',
                description: 'Balance of technical expertise and people leadership',
                progression: [
                    'junior_developer',
                    'mid_developer',
                    'senior_developer',
                    'tech_lead',
                    'engineering_manager'
                ],
                skills_emphasis: ['Technical leadership', 'Team building', 'Cross-functional collaboration', 'Strategic execution'],
                career_ceiling: 'Director Engineering / VP'
            }
        };

        for (const [key, pathData] of Object.entries(paths)) {
            this.progressionPaths.set(key, pathData);
        }
    }

    /**
     * Analyze career progression opportunities
     */
    async analyzeCareerProgression(context, skillAnalysis, preferences = {}) {
        console.log('📈 Analyzing career progression opportunities...');

        const currentLevel = this.assessCurrentLevel(context, skillAnalysis);
        const progressionPaths = this.identifyProgressionPaths(currentLevel, preferences);
        const nextLevelRequirements = this.analyzeNextLevelRequirements(currentLevel, progressionPaths);
        const timelineEstimation = this.estimateProgressionTimeline(currentLevel, nextLevelRequirements);
        const marketOpportunities = await this.analyzeMarketOpportunities(currentLevel, skillAnalysis);

        const analysis = {
            current_position: currentLevel,
            available_paths: progressionPaths,
            next_level_requirements: nextLevelRequirements,
            progression_timeline: timelineEstimation,
            market_opportunities: marketOpportunities,
            development_priorities: this.generateDevelopmentPriorities(nextLevelRequirements),
            success_metrics: this.generateProgressionMetrics(progressionPaths),
            action_plan: this.generateActionPlan(nextLevelRequirements, timelineEstimation)
        };

        console.log(`✅ Career progression analysis completed - Current: ${currentLevel.title}`);
        return analysis;
    }

    /**
     * Assess current career level
     */
    assessCurrentLevel(context, skillAnalysis) {
        const activityScore = context.activityMetrics?.summary?.activity_score || 50;
        const skillProfile = this.analyzeSkillProfile(skillAnalysis);
        const experienceIndicators = this.analyzeExperienceIndicators(context);

        // Calculate level score based on multiple factors
        let levelScore = 0;
        
        // Activity-based assessment
        if (activityScore > 80) levelScore += 2;
        else if (activityScore > 60) levelScore += 1;
        
        // Skill-based assessment
        const expertSkills = skillProfile.expert_count || 0;
        const advancedSkills = skillProfile.advanced_count || 0;
        
        levelScore += Math.min(expertSkills * 2, 4);
        levelScore += Math.min(advancedSkills, 3);
        
        // Experience-based assessment
        const totalProjects = context.cvData?.projects?.length || 0;
        if (totalProjects > 10) levelScore += 2;
        else if (totalProjects > 5) levelScore += 1;

        // Map level score to career level
        const levelMapping = [
            { threshold: 0, level: 'junior_developer' },
            { threshold: 3, level: 'mid_developer' },
            { threshold: 6, level: 'senior_developer' },
            { threshold: 9, level: 'tech_lead' },
            { threshold: 12, level: 'senior_tech_lead' }
        ];

        const currentLevelKey = levelMapping
            .reverse()
            .find(mapping => levelScore >= mapping.threshold)?.level || 'junior_developer';

        const currentLevelData = this.careerLevels.get(currentLevelKey);
        
        return {
            ...currentLevelData,
            key: currentLevelKey,
            assessment_score: levelScore,
            confidence: this.calculateAssessmentConfidence(skillAnalysis, context),
            strengths: this.identifyCurrentStrengths(skillAnalysis, activityScore),
            development_areas: this.identifyDevelopmentAreas(skillAnalysis, currentLevelKey)
        };
    }

    /**
     * Analyze skill profile distribution
     */
    analyzeSkillProfile(skillAnalysis) {
        const distribution = skillAnalysis.proficiency_distribution?.counts || {};
        
        return {
            expert_count: distribution.Expert || 0,
            advanced_count: distribution.Advanced || 0,
            intermediate_count: distribution.Intermediate || 0,
            total_skills: Object.values(distribution).reduce((sum, count) => sum + count, 0),
            profile_strength: this.calculateProfileStrength(distribution)
        };
    }

    calculateProfileStrength(distribution) {
        const weights = { Expert: 5, Advanced: 3, Intermediate: 2, Beginner: 1, Novice: 0.5 };
        let weightedScore = 0;
        let totalCount = 0;

        for (const [level, count] of Object.entries(distribution)) {
            weightedScore += (weights[level] || 0) * count;
            totalCount += count;
        }

        return totalCount > 0 ? Math.round((weightedScore / totalCount) * 20) : 0;
    }

    /**
     * Analyze experience indicators
     */
    analyzeExperienceIndicators(context) {
        const projects = context.cvData?.projects || [];
        const experience = context.cvData?.experience || [];
        
        return {
            project_count: projects.length,
            experience_roles: experience.length,
            leadership_indicators: this.extractLeadershipIndicators(context),
            technical_depth: this.assessTechnicalDepth(context)
        };
    }

    extractLeadershipIndicators(context) {
        const indicators = [];
        const experienceText = JSON.stringify(context.cvData?.experience || []).toLowerCase();
        
        const leadershipKeywords = [
            'led team', 'managed', 'supervised', 'mentored', 'coordinated',
            'architected', 'designed system', 'technical lead', 'team lead'
        ];

        for (const keyword of leadershipKeywords) {
            if (experienceText.includes(keyword)) {
                indicators.push(keyword);
            }
        }

        return indicators;
    }

    assessTechnicalDepth(context) {
        const languages = context.activityMetrics?.summary?.top_languages || [];
        const projects = context.cvData?.projects || [];
        
        return {
            language_diversity: languages.length,
            project_complexity: projects.filter(p => 
                p.description?.toLowerCase().includes('architecture') ||
                p.description?.toLowerCase().includes('system')
            ).length,
            depth_score: Math.min(languages.length * 10 + projects.length * 5, 100)
        };
    }

    /**
     * Calculate assessment confidence
     */
    calculateAssessmentConfidence(skillAnalysis, context) {
        let confidence = 60; // Base confidence

        // Increase confidence based on data availability
        if (skillAnalysis.analysis_metadata?.confidence_score > 80) confidence += 15;
        if (context.activityMetrics?.summary?.activity_score > 70) confidence += 10;
        if (context.cvData?.experience?.length > 0) confidence += 10;
        if (context.cvData?.projects?.length > 3) confidence += 5;

        return Math.min(confidence, 95);
    }

    /**
     * Identify current strengths
     */
    identifyCurrentStrengths(skillAnalysis, activityScore) {
        const strengths = [];

        if (activityScore > 75) {
            strengths.push('Consistent technical delivery and activity');
        }

        const expertSkills = (skillAnalysis.analyzed_skills || [])
            .filter(skill => skill.proficiency_level === 'Expert');
        
        if (expertSkills.length > 0) {
            strengths.push(`Expert-level proficiency in ${expertSkills.length} technologies`);
        }

        const marketAlignment = skillAnalysis.market_alignment?.alignment_score || 0;
        if (marketAlignment > 70) {
            strengths.push('Strong market-aligned skill set');
        }

        return strengths;
    }

    /**
     * Identify development areas
     */
    identifyDevelopmentAreas(skillAnalysis, currentLevelKey) {
        const areas = [];
        const currentLevel = this.careerLevels.get(currentLevelKey);

        // Check skill gaps for current level
        const beginnerSkills = (skillAnalysis.analyzed_skills || [])
            .filter(skill => ['Beginner', 'Novice'].includes(skill.proficiency_level));

        if (beginnerSkills.length > 0) {
            areas.push(`Strengthen proficiency in ${beginnerSkills.length} foundational skills`);
        }

        // Check for next-level requirements
        if (currentLevel.level < 4 && !this.hasLeadershipSkills(skillAnalysis)) {
            areas.push('Develop leadership and mentoring capabilities');
        }

        if (currentLevel.level >= 3 && !this.hasArchitectureSkills(skillAnalysis)) {
            areas.push('Build system architecture and design expertise');
        }

        return areas;
    }

    hasLeadershipSkills(skillAnalysis) {
        const leadershipSkills = ['team leadership', 'mentoring', 'project management'];
        const skillNames = (skillAnalysis.analyzed_skills || [])
            .map(skill => skill.name.toLowerCase());

        return leadershipSkills.some(skill => 
            skillNames.some(name => name.includes(skill))
        );
    }

    hasArchitectureSkills(skillAnalysis) {
        const architectureSkills = ['system design', 'architecture', 'scalability'];
        const skillNames = (skillAnalysis.analyzed_skills || [])
            .map(skill => skill.name.toLowerCase());

        return architectureSkills.some(skill =>
            skillNames.some(name => name.includes(skill))
        );
    }

    /**
     * Identify progression paths
     */
    identifyProgressionPaths(currentLevel, preferences) {
        const availablePaths = [];

        for (const [pathKey, pathData] of this.progressionPaths) {
            const currentIndex = pathData.progression.indexOf(currentLevel.key);
            
            if (currentIndex >= 0 && currentIndex < pathData.progression.length - 1) {
                const nextLevelKey = pathData.progression[currentIndex + 1];
                const nextLevel = this.careerLevels.get(nextLevelKey);

                availablePaths.push({
                    ...pathData,
                    path_key: pathKey,
                    current_position: currentIndex,
                    next_level: nextLevel,
                    progression_available: true,
                    suitability_score: this.calculatePathSuitability(pathKey, currentLevel, preferences)
                });
            }
        }

        return availablePaths.sort((a, b) => b.suitability_score - a.suitability_score);
    }

    /**
     * Calculate path suitability score
     */
    calculatePathSuitability(pathKey, currentLevel, preferences) {
        let score = 50; // Base score

        // Preference-based scoring
        if (preferences.leadership_preference === 'high' && pathKey === 'management_track') {
            score += 30;
        } else if (preferences.technical_preference === 'high' && pathKey === 'technical_track') {
            score += 30;
        } else if (pathKey === 'hybrid_track') {
            score += 15; // Hybrid is generally appealing
        }

        // Current level alignment
        if (currentLevel.assessment_score > 8 && pathKey === 'technical_track') {
            score += 10; // High performers often suit technical track
        }

        // Experience-based adjustment
        if (currentLevel.level >= 3) {
            score += 10; // Senior levels have clearer path preferences
        }

        return Math.min(score, 100);
    }

    /**
     * Analyze next level requirements
     */
    analyzeNextLevelRequirements(currentLevel, progressionPaths) {
        const requirements = {};

        for (const path of progressionPaths) {
            if (path.next_level) {
                const nextLevel = path.next_level;
                const skillGaps = this.identifySkillGaps(currentLevel, nextLevel);
                const experienceGaps = this.identifyExperienceGaps(currentLevel, nextLevel);

                requirements[path.path_key] = {
                    target_level: nextLevel,
                    skill_requirements: skillGaps,
                    experience_requirements: experienceGaps,
                    development_time: this.estimateDevelopmentTime(skillGaps, experienceGaps),
                    critical_success_factors: this.identifyCriticalFactors(path.path_key, nextLevel)
                };
            }
        }

        return requirements;
    }

    /**
     * Identify skill gaps between levels
     */
    identifySkillGaps(currentLevel, nextLevel) {
        const currentSkills = currentLevel.keySkills || [];
        const nextSkills = nextLevel.keySkills || [];

        const gaps = nextSkills.filter(skill => 
            !currentSkills.some(current => 
                current.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(current.toLowerCase())
            )
        );

        return gaps.map(skill => ({
            skill,
            importance: 'high',
            development_approach: this.getSkillDevelopmentApproach(skill)
        }));
    }

    getSkillDevelopmentApproach(skill) {
        const approaches = {
            'system architecture': 'Technical courses, architecture reviews, design practice',
            'team leadership': 'Leadership training, mentoring opportunities, team projects',
            'performance optimization': 'Advanced technical training, performance audits',
            'strategic thinking': 'Business courses, cross-functional projects, strategic planning',
            'people management': 'Management training, HR collaboration, team building'
        };

        const skillLower = skill.toLowerCase();
        return Object.entries(approaches)
            .find(([key]) => skillLower.includes(key))?.[1] || 
            'Professional development courses and hands-on practice';
    }

    /**
     * Identify experience gaps between levels
     */
    identifyExperienceGaps(currentLevel, nextLevel) {
        const currentResponsibilities = currentLevel.responsibilities || [];
        const nextResponsibilities = nextLevel.responsibilities || [];

        const gaps = nextResponsibilities.filter(responsibility =>
            !currentResponsibilities.some(current =>
                current.toLowerCase().includes(responsibility.toLowerCase()) ||
                responsibility.toLowerCase().includes(current.toLowerCase())
            )
        );

        return gaps.map(responsibility => ({
            responsibility,
            experience_type: 'hands-on',
            acquisition_method: this.getExperienceAcquisitionMethod(responsibility)
        }));
    }

    getExperienceAcquisitionMethod(responsibility) {
        const methods = {
            'architecture decisions': 'Lead architecture review sessions, design system components',
            'technical leadership': 'Mentor junior developers, lead technical initiatives',
            'team guidance': 'Take on team lead responsibilities, guide project delivery',
            'strategic planning': 'Participate in planning sessions, contribute to roadmaps',
            'performance management': 'Shadow current managers, take on performance review responsibilities'
        };

        const responsibilityLower = responsibility.toLowerCase();
        return Object.entries(methods)
            .find(([key]) => responsibilityLower.includes(key))?.[1] ||
            'Seek opportunities to practice this responsibility with mentorship';
    }

    /**
     * Estimate development time
     */
    estimateDevelopmentTime(skillGaps, experienceGaps) {
        const skillTime = skillGaps.length * 3; // 3 months per skill gap
        const experienceTime = experienceGaps.length * 2; // 2 months per experience gap
        
        const totalMonths = Math.max(skillTime, experienceTime);
        
        return {
            skill_development: `${skillTime} months`,
            experience_acquisition: `${experienceTime} months`,
            total_estimate: `${totalMonths} months`,
            parallel_development: totalMonths > 6 ? 'recommended' : 'optional'
        };
    }

    /**
     * Identify critical success factors
     */
    identifyCriticalFactors(pathKey, nextLevel) {
        const generalFactors = [
            'Consistent performance in current role',
            'Demonstrated growth mindset and learning agility',
            'Strong relationships with peers and leadership'
        ];

        const pathSpecificFactors = {
            'technical_track': [
                'Technical thought leadership and innovation',
                'Mentoring and knowledge sharing',
                'Architecture and system design excellence'
            ],
            'management_track': [
                'People management and team building skills',
                'Strategic thinking and business alignment',
                'Communication and stakeholder management'
            ],
            'hybrid_track': [
                'Balance of technical expertise and leadership',
                'Cross-functional collaboration skills',
                'Ability to translate technical concepts to business'
            ]
        };

        return [...generalFactors, ...(pathSpecificFactors[pathKey] || [])];
    }

    /**
     * Estimate progression timeline
     */
    estimateProgressionTimeline(currentLevel, nextLevelRequirements) {
        const timelines = {};

        for (const [pathKey, requirements] of Object.entries(nextLevelRequirements)) {
            const developmentMonths = parseInt(requirements.development_time.total_estimate);
            const readinessAssessment = this.assessReadinessForLevel(currentLevel, requirements);

            timelines[pathKey] = {
                minimum_timeline: `${Math.max(developmentMonths, 6)} months`,
                realistic_timeline: `${developmentMonths + 6} months`,
                accelerated_timeline: `${Math.max(developmentMonths - 3, 3)} months`,
                readiness_level: readinessAssessment.level,
                acceleration_factors: readinessAssessment.accelerators,
                risk_factors: readinessAssessment.risks
            };
        }

        return timelines;
    }

    assessReadinessForLevel(currentLevel, requirements) {
        const skillReadiness = requirements.skill_requirements.length <= 2 ? 'high' : 'medium';
        const experienceReadiness = requirements.experience_requirements.length <= 1 ? 'high' : 'medium';
        
        const overallReadiness = skillReadiness === 'high' && experienceReadiness === 'high' ? 'high' :
                                skillReadiness === 'medium' || experienceReadiness === 'medium' ? 'medium' : 'low';

        return {
            level: overallReadiness,
            accelerators: this.identifyAccelerators(currentLevel),
            risks: this.identifyProgressionRisks(currentLevel, requirements)
        };
    }

    identifyAccelerators(currentLevel) {
        const accelerators = [];

        if (currentLevel.assessment_score > 10) {
            accelerators.push('Strong current performance');
        }

        if (currentLevel.strengths.length > 2) {
            accelerators.push('Multiple identified strengths');
        }

        if (currentLevel.confidence > 80) {
            accelerators.push('High confidence in assessment');
        }

        return accelerators;
    }

    identifyProgressionRisks(currentLevel, requirements) {
        const risks = [];

        if (requirements.skill_requirements.length > 3) {
            risks.push('Significant skill development required');
        }

        if (requirements.experience_requirements.length > 2) {
            risks.push('Multiple experience gaps to address');
        }

        if (currentLevel.development_areas.length > 2) {
            risks.push('Multiple current development areas need attention');
        }

        return risks;
    }

    /**
     * Analyze market opportunities
     */
    async analyzeMarketOpportunities(currentLevel, skillAnalysis) {
        const marketData = await this.getMarketIntelligence(currentLevel);
        const skillAlignment = skillAnalysis.market_alignment || {};

        return {
            job_market_health: marketData.demand_level,
            salary_growth_potential: marketData.salary_trends,
            skill_market_alignment: skillAlignment.alignment_score || 0,
            emerging_opportunities: this.identifyEmergingOpportunities(currentLevel),
            location_factors: this.analyzeLocationFactors(),
            industry_trends: this.getIndustryTrends()
        };
    }

    async getMarketIntelligence(currentLevel) {
        // Mock market intelligence (would be real data in production)
        return {
            demand_level: currentLevel.level >= 3 ? 'high' : 'medium',
            salary_trends: 'positive',
            job_growth_rate: '12% annually',
            competition_level: currentLevel.level >= 4 ? 'moderate' : 'low'
        };
    }

    identifyEmergingOpportunities(currentLevel) {
        const opportunities = [
            'AI/ML Engineering roles with traditional development background',
            'Cloud Architecture positions with infrastructure experience',
            'DevOps Leadership combining development and operations'
        ];

        if (currentLevel.level >= 4) {
            opportunities.push('VP Engineering roles at growing startups');
            opportunities.push('Technical Advisor positions');
        }

        return opportunities;
    }

    analyzeLocationFactors() {
        return {
            remote_opportunities: 'expanding',
            hub_locations: ['San Francisco', 'Seattle', 'Austin', 'New York'],
            salary_variance: 'high_based_on_location',
            cost_of_living_impact: 'significant'
        };
    }

    getIndustryTrends() {
        return [
            'Increased demand for AI/ML expertise across all roles',
            'Growing importance of cloud-native development',
            'Rising need for security-aware development practices',
            'Emphasis on sustainable and efficient technology solutions'
        ];
    }

    /**
     * Generate development priorities
     */
    generateDevelopmentPriorities(nextLevelRequirements) {
        const priorities = [];

        for (const [pathKey, requirements] of Object.entries(nextLevelRequirements)) {
            // High-priority skill requirements
            const highPrioritySkills = requirements.skill_requirements
                .filter(req => req.importance === 'high')
                .slice(0, 2); // Top 2 priorities

            for (const skill of highPrioritySkills) {
                priorities.push({
                    priority: 'high',
                    type: 'skill_development',
                    focus: skill.skill,
                    path: pathKey,
                    approach: skill.development_approach,
                    timeline: '2-4 months'
                });
            }

            // Critical experience gaps
            const criticalExperience = requirements.experience_requirements
                .slice(0, 1); // Top 1 priority

            for (const experience of criticalExperience) {
                priorities.push({
                    priority: 'high',
                    type: 'experience_acquisition',
                    focus: experience.responsibility,
                    path: pathKey,
                    approach: experience.acquisition_method,
                    timeline: '3-6 months'
                });
            }
        }

        return priorities
            .sort((a, b) => a.priority === 'high' ? -1 : 1)
            .slice(0, 6); // Top 6 priorities
    }

    /**
     * Generate progression metrics
     */
    generateProgressionMetrics(progressionPaths) {
        const metrics = {};

        for (const path of progressionPaths) {
            const currentSalary = this.parseSalaryRange(path.current_level?.compensation_range);
            const nextSalary = this.parseSalaryRange(path.next_level?.compensation_range);
            const salaryIncrease = nextSalary.average - currentSalary.average;

            metrics[path.path_key] = {
                salary_increase_potential: `$${Math.round(salaryIncrease / 1000)}K`,
                responsibility_expansion: path.next_level?.responsibilities?.length || 0,
                skill_development_required: path.skills_emphasis?.length || 0,
                market_demand: this.assessPathMarketDemand(path.path_key),
                growth_trajectory: this.assessGrowthTrajectory(path)
            };
        }

        return metrics;
    }

    parseSalaryRange(rangeString) {
        if (!rangeString) return { min: 0, max: 0, average: 0 };

        const matches = rangeString.match(/\$(\d+),?(\d+)?-?\$?(\d+),?(\d+)?/);
        if (!matches) return { min: 0, max: 0, average: 0 };

        const min = parseInt(`${matches[1]}${matches[2] || ''}`.replace(',', ''));
        const max = parseInt(`${matches[3]}${matches[4] || ''}`.replace(',', ''));

        return {
            min,
            max,
            average: Math.round((min + max) / 2)
        };
    }

    assessPathMarketDemand(pathKey) {
        const demandLevels = {
            'technical_track': 'very_high',
            'management_track': 'high',
            'hybrid_track': 'high'
        };

        return demandLevels[pathKey] || 'medium';
    }

    assessGrowthTrajectory(path) {
        const trajectoryScores = {
            'technical_track': 85,
            'management_track': 90,
            'hybrid_track': 80
        };

        return trajectoryScores[path.path_key] || 70;
    }

    /**
     * Generate action plan
     */
    generateActionPlan(nextLevelRequirements, timelineEstimation) {
        const actionPlan = {
            immediate_actions: [],
            short_term_goals: [],
            long_term_objectives: []
        };

        for (const [pathKey, requirements] of Object.entries(nextLevelRequirements)) {
            const timeline = timelineEstimation[pathKey];

            // Immediate actions (next 30 days)
            if (requirements.skill_requirements.length > 0) {
                actionPlan.immediate_actions.push({
                    action: `Begin ${requirements.skill_requirements[0].skill} development`,
                    path: pathKey,
                    timeline: '30 days',
                    success_criteria: 'Complete foundational learning and first practice project'
                });
            }

            // Short-term goals (3-6 months)
            for (const skillReq of requirements.skill_requirements.slice(0, 2)) {
                actionPlan.short_term_goals.push({
                    goal: `Achieve proficiency in ${skillReq.skill}`,
                    path: pathKey,
                    timeline: '3-6 months',
                    milestones: this.generateSkillMilestones(skillReq.skill)
                });
            }

            // Long-term objectives (6-12 months)
            actionPlan.long_term_objectives.push({
                objective: `Readiness for ${requirements.target_level.title} role`,
                path: pathKey,
                timeline: timeline?.realistic_timeline || '12 months',
                success_criteria: [
                    'All skill requirements met',
                    'Experience gaps addressed',
                    'Performance review demonstrates readiness'
                ]
            });
        }

        return actionPlan;
    }

    generateSkillMilestones(skill) {
        const genericMilestones = [
            'Complete theoretical learning',
            'Build first practical project',
            'Apply skill in professional context',
            'Demonstrate expertise through results'
        ];

        const specificMilestones = {
            'system architecture': [
                'Study architecture patterns and principles',
                'Design system for existing project',
                'Lead architecture review session',
                'Mentor others on architecture decisions'
            ],
            'team leadership': [
                'Complete leadership training course',
                'Shadow current team lead',
                'Lead small project team',
                'Conduct team performance reviews'
            ]
        };

        const skillLower = skill.toLowerCase();
        return Object.entries(specificMilestones)
            .find(([key]) => skillLower.includes(key))?.[1] || genericMilestones;
    }
}

export { ProjectRecommendationEngine, CareerProgressionAnalyzer };