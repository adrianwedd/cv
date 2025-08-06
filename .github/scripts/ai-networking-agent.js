#!/usr/bin/env node

/**
 * AI-Powered Professional Networking Agent
 * 
 * Intelligent professional networking automation with strategic relationship building.
 * Leverages AI to analyze profiles, suggest connections, and optimize networking strategy.
 * 
 * FEATURES:
 * - Strategic connection recommendations based on career goals
 * - AI-powered profile analysis and compatibility scoring
 * - Professional relationship mapping and network optimization
 * - Ethical networking with consent and respectful automation
 * - Industry trend analysis and networking opportunity identification
 */

import { EthicalLinkedInExtractor } from './linkedin-playwright-extractor.js';
import { ClaudeBrowserClient } from './claude-browser-client.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export class AINetworkingAgent {
    constructor(options = {}) {
        this.options = {
            userConsent: false,           // User consent for networking operations
            maxRecommendations: 10,       // Maximum connection recommendations per session
            rateLimitMs: 60000,          // 1 minute between major operations
            analysisDepth: 'comprehensive', // Analysis depth (basic/detailed/comprehensive)
            networkingStrategy: 'quality', // Strategy focus (quantity/quality/balanced)
            industryFocus: [],           // Target industries for networking
            careerStage: 'mid-level',    // Career stage for personalized recommendations
            auditLogging: true,          // Complete operation logging
            ...options
        };
        
        this.linkedInExtractor = new EthicalLinkedInExtractor({
            userConsent: this.options.userConsent,
            rateLimitMs: this.options.rateLimitMs * 2, // Slower for networking
            auditLogging: this.options.auditLogging
        });
        
        this.claudeClient = new ClaudeBrowserClient({
            headless: true,
            userConsent: this.options.userConsent,
            rateLimitMs: 45000, // Conservative rate limiting for networking analysis
            auditLogging: this.options.auditLogging
        });
        
        this.operationLog = [];
        this.sessionStart = Date.now();
        this.networkingSession = {
            analyzed_profiles: 0,
            recommendations_generated: 0,
            strategy_insights: []
        };
    }

    /**
     * Load user's professional profile and career goals
     */
    async loadUserProfile() {
        this.log('user-profile-load-start');
        
        try {
            const cvPath = path.join(process.cwd(), 'data', 'base-cv.json');
            const cvData = JSON.parse(await fs.readFile(cvPath, 'utf8'));
            
            // Extract networking-relevant information
            const userProfile = {
                personal_info: cvData.personal_info,
                current_role: cvData.experience?.[0] || {},
                skills: cvData.skills?.map(skill => skill.name || skill) || [],
                industry: this.extractIndustryFromExperience(cvData.experience),
                career_level: this.determineCareerLevel(cvData.experience),
                networking_goals: this.inferNetworkingGoals(cvData),
                target_companies: this.extractTargetCompanies(cvData),
                professional_interests: this.extractProfessionalInterests(cvData)
            };
            
            this.log('user-profile-load-complete', { 
                hasPersonalInfo: !!userProfile.personal_info,
                skillsCount: userProfile.skills.length,
                industry: userProfile.industry,
                careerLevel: userProfile.career_level
            });
            
            return userProfile;
            
        } catch (error) {
            this.log('user-profile-load-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Analyze potential connection's profile for compatibility
     */
    async analyzeConnectionProfile(profileUrl, userProfile) {
        await this.verifyUserConsent('profile-analysis');
        
        this.log('connection-analysis-start', { 
            url: this.sanitizeUrl(profileUrl) 
        });
        
        try {
            // Extract target profile data
            const targetProfile = await this.linkedInExtractor.extractCompleteProfile(profileUrl);
            
            // Perform AI-powered compatibility analysis
            const compatibilityAnalysis = await this.performCompatibilityAnalysis(
                userProfile, 
                targetProfile
            );
            
            // Calculate networking score
            const networkingScore = this.calculateNetworkingScore(
                userProfile, 
                targetProfile, 
                compatibilityAnalysis
            );
            
            // Generate connection strategy
            const connectionStrategy = await this.generateConnectionStrategy(
                userProfile,
                targetProfile,
                compatibilityAnalysis
            );
            
            const analysis = {
                target_profile: {
                    name: targetProfile.name,
                    headline: targetProfile.headline,
                    location: targetProfile.location,
                    experience_count: targetProfile.experience?.length || 0,
                    skills_count: targetProfile.skills?.length || 0
                },
                compatibility: compatibilityAnalysis,
                networking_score: networkingScore,
                connection_strategy: connectionStrategy,
                analysis_metadata: {
                    analysis_date: new Date().toISOString(),
                    depth: this.options.analysisDepth,
                    strategy_focus: this.options.networkingStrategy
                }
            };
            
            this.networkingSession.analyzed_profiles++;
            
            this.log('connection-analysis-complete', { 
                networkingScore: networkingScore.overall,
                compatibility: compatibilityAnalysis.compatibility_level,
                recommendConnection: networkingScore.overall >= 70
            });
            
            return analysis;
            
        } catch (error) {
            this.log('connection-analysis-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Perform AI-powered compatibility analysis between profiles
     */
    async performCompatibilityAnalysis(userProfile, targetProfile) {
        this.log('compatibility-analysis-start');
        
        try {
            const prompt = `
Analyze professional compatibility between two LinkedIn profiles for strategic networking:

USER PROFILE:
- Name: ${userProfile.personal_info?.name}
- Current Role: ${userProfile.current_role?.position} at ${userProfile.current_role?.company}
- Industry: ${userProfile.industry}
- Career Level: ${userProfile.career_level}
- Key Skills: ${userProfile.skills?.slice(0, 10).join(', ')}
- Professional Interests: ${userProfile.professional_interests?.join(', ')}

TARGET PROFILE:
- Name: ${targetProfile.name}
- Headline: ${targetProfile.headline}
- Location: ${targetProfile.location}
- Experience: ${targetProfile.experience?.length || 0} positions
- Skills: ${targetProfile.skills?.slice(0, 10).map(s => s.name).join(', ')}

Please analyze:
1. Professional alignment and mutual value potential
2. Shared interests, skills, or industry connections
3. Career advancement opportunities for both parties
4. Potential collaboration or mentorship possibilities
5. Industry influence and network value assessment

Provide compatibility score (0-100) and detailed reasoning.
Focus on authentic, professional relationship building opportunities.
`;

            const response = await this.claudeClient.sendMessage(prompt);
            
            // Parse AI response and extract structured data
            const compatibilityData = this.parseCompatibilityResponse(response);
            
            this.log('compatibility-analysis-complete', { 
                compatibilityScore: compatibilityData.score,
                level: compatibilityData.compatibility_level
            });
            
            return compatibilityData;
            
        } catch (error) {
            this.log('compatibility-analysis-error', { error: error.message });
            
            // Fallback to rule-based analysis
            return this.performRuleBasedCompatibilityAnalysis(userProfile, targetProfile);
        }
    }

    /**
     * Calculate comprehensive networking score
     */
    calculateNetworkingScore(userProfile, targetProfile, compatibilityAnalysis) {
        const scores = {
            professional_alignment: 0,
            skill_overlap: 0,
            industry_relevance: 0,
            career_value: 0,
            geographic_proximity: 0,
            mutual_benefit: 0
        };
        
        // Professional alignment (25% weight)
        if (this.hasProfessionalAlignment(userProfile, targetProfile)) {
            scores.professional_alignment = 85;
        } else if (this.hasIndustryAlignment(userProfile, targetProfile)) {
            scores.professional_alignment = 65;
        } else {
            scores.professional_alignment = 30;
        }
        
        // Skill overlap (20% weight)
        const skillOverlap = this.calculateSkillOverlap(userProfile.skills, targetProfile.skills);
        scores.skill_overlap = Math.min(skillOverlap * 20, 100);
        
        // Industry relevance (20% weight)
        if (this.isTargetIndustryRelevant(userProfile, targetProfile)) {
            scores.industry_relevance = 90;
        } else if (this.hasAdjacentIndustryExperience(userProfile, targetProfile)) {
            scores.industry_relevance = 70;
        } else {
            scores.industry_relevance = 40;
        }
        
        // Career advancement value (15% weight)
        scores.career_value = this.assessCareerValue(userProfile, targetProfile);
        
        // Geographic proximity (10% weight)
        scores.geographic_proximity = this.calculateGeographicRelevance(
            userProfile.personal_info?.location,
            targetProfile.location
        );
        
        // Mutual benefit potential (10% weight)
        scores.mutual_benefit = compatibilityAnalysis.score || 70;
        
        // Calculate weighted overall score
        const weights = {
            professional_alignment: 0.25,
            skill_overlap: 0.20,
            industry_relevance: 0.20,
            career_value: 0.15,
            geographic_proximity: 0.10,
            mutual_benefit: 0.10
        };
        
        const overall = Object.entries(scores).reduce(
            (total, [key, score]) => total + (score * weights[key]),
            0
        );
        
        return {
            overall: Math.round(overall),
            breakdown: scores,
            recommendation: this.getNetworkingRecommendation(overall),
            priority: this.getConnectionPriority(overall)
        };
    }

    /**
     * Generate AI-powered connection strategy
     */
    async generateConnectionStrategy(userProfile, targetProfile, compatibilityAnalysis) {
        this.log('connection-strategy-start');
        
        try {
            const prompt = `
Generate a professional connection strategy for LinkedIn networking:

USER CONTEXT:
- ${userProfile.personal_info?.name} (${userProfile.current_role?.position})
- Career Level: ${userProfile.career_level}
- Industry: ${userProfile.industry}
- Networking Goals: ${userProfile.networking_goals?.join(', ')}

TARGET CONTACT:
- ${targetProfile.name}
- ${targetProfile.headline}
- Compatibility Score: ${compatibilityAnalysis.score}/100

Please provide:
1. Personalized connection message template (150 characters max)
2. Conversation starters and mutual interest topics
3. Follow-up strategy for relationship building
4. Potential collaboration opportunities
5. Timeline and touchpoint recommendations

Focus on authentic, value-driven relationship building.
Avoid generic connection requests.
`;

            const response = await this.claudeClient.sendMessage(prompt);
            
            const strategy = this.parseConnectionStrategy(response);
            
            this.log('connection-strategy-complete', { 
                hasMessage: !!strategy.connection_message,
                hasFollowUp: !!strategy.follow_up_strategy
            });
            
            return strategy;
            
        } catch (error) {
            this.log('connection-strategy-error', { error: error.message });
            
            return this.generateRuleBasedConnectionStrategy(userProfile, targetProfile);
        }
    }

    /**
     * Generate comprehensive networking recommendations
     */
    async generateNetworkingRecommendations(userProfile, targetProfiles = []) {
        await this.verifyUserConsent('networking-recommendations');
        
        this.log('networking-recommendations-start', { 
            targetProfilesCount: targetProfiles.length 
        });
        
        try {
            const analyses = [];
            
            // Analyze each target profile
            for (const profileUrl of targetProfiles.slice(0, this.options.maxRecommendations)) {
                try {
                    const analysis = await this.analyzeConnectionProfile(profileUrl, userProfile);
                    analyses.push(analysis);
                    
                    // Respect rate limiting
                    await this.enforceRateLimit();
                    
                } catch (error) {
                    this.log('profile-analysis-skipped', { 
                        url: this.sanitizeUrl(profileUrl),
                        error: error.message 
                    });
                }
            }
            
            // Sort by networking score
            analyses.sort((a, b) => b.networking_score.overall - a.networking_score.overall);
            
            // Generate strategic insights
            const strategicInsights = await this.generateStrategicInsights(userProfile, analyses);
            
            const recommendations = {
                user_profile: userProfile,
                connection_analyses: analyses,
                strategic_insights: strategicInsights,
                networking_summary: {
                    total_analyzed: analyses.length,
                    high_priority: analyses.filter(a => a.networking_score.priority === 'high').length,
                    medium_priority: analyses.filter(a => a.networking_score.priority === 'medium').length,
                    low_priority: analyses.filter(a => a.networking_score.priority === 'low').length,
                    average_score: analyses.reduce((sum, a) => sum + a.networking_score.overall, 0) / analyses.length
                },
                session_metadata: {
                    generation_date: new Date().toISOString(),
                    strategy_focus: this.options.networkingStrategy,
                    analysis_depth: this.options.analysisDepth,
                    session_id: this.sessionStart
                }
            };
            
            this.networkingSession.recommendations_generated = analyses.length;
            
            this.log('networking-recommendations-complete', { 
                recommendationsCount: analyses.length,
                averageScore: recommendations.networking_summary.average_score.toFixed(1),
                highPriority: recommendations.networking_summary.high_priority
            });
            
            return recommendations;
            
        } catch (error) {
            this.log('networking-recommendations-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate strategic networking insights
     */
    async generateStrategicInsights(userProfile, analyses) {
        this.log('strategic-insights-start');
        
        try {
            const topConnections = analyses.slice(0, 5);
            const industries = [...new Set(analyses.map(a => this.extractIndustryFromProfile(a.target_profile)))];
            const avgScore = analyses.reduce((sum, a) => sum + a.networking_score.overall, 0) / analyses.length;
            
            const prompt = `
Generate strategic networking insights based on connection analysis:

USER PROFILE:
- ${userProfile.personal_info?.name}
- Industry: ${userProfile.industry}
- Career Level: ${userProfile.career_level}
- Goals: ${userProfile.networking_goals?.join(', ')}

ANALYSIS RESULTS:
- Total profiles analyzed: ${analyses.length}
- Average networking score: ${avgScore.toFixed(1)}/100
- Industries represented: ${industries.join(', ')}
- Top connections: ${topConnections.map(c => c.target_profile.name).join(', ')}

Please provide:
1. Overall networking strategy assessment
2. Industry diversification recommendations
3. Priority connection sequencing
4. Network gap analysis and opportunities
5. Long-term relationship building strategy

Focus on actionable insights for professional growth.
`;

            const response = await this.claudeClient.sendMessage(prompt);
            
            const insights = {
                strategy_assessment: this.extractStrategyAssessment(response),
                industry_analysis: {
                    represented_industries: industries,
                    diversification_score: Math.min(industries.length * 15, 100),
                    recommendations: this.generateIndustryRecommendations(industries, userProfile)
                },
                priority_sequence: this.generatePrioritySequence(analyses),
                network_gaps: this.identifyNetworkGaps(userProfile, analyses),
                ai_insights: response
            };
            
            this.networkingSession.strategy_insights.push(insights);
            
            this.log('strategic-insights-complete', { 
                industriesCount: industries.length,
                diversificationScore: insights.industry_analysis.diversification_score
            });
            
            return insights;
            
        } catch (error) {
            this.log('strategic-insights-error', { error: error.message });
            
            return this.generateRuleBasedInsights(userProfile, analyses);
        }
    }

    /**
     * Save networking recommendations and insights
     */
    async saveNetworkingRecommendations(recommendations) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(
            process.cwd(), 
            'data', 
            'networking', 
            `networking-recommendations-${timestamp}.json`
        );
        
        try {
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(recommendations, null, 2));
            
            this.log('recommendations-saved', { path: reportPath });
            return reportPath;
            
        } catch (error) {
            this.log('recommendations-save-error', { error: error.message });
            throw error;
        }
    }

    // Utility and analysis methods
    extractIndustryFromExperience(experience) {
        if (!experience || !Array.isArray(experience)) return 'Technology';
        
        const currentRole = experience[0];
        const company = currentRole?.company?.toLowerCase() || '';
        
        // Industry classification based on company/role patterns
        if (company.includes('homes') || company.includes('housing')) return 'Government/Public Housing';
        if (company.includes('tech') || company.includes('software')) return 'Technology';
        if (company.includes('consulting')) return 'Consulting';
        if (company.includes('finance') || company.includes('bank')) return 'Financial Services';
        
        return 'Technology'; // Default fallback
    }

    determineCareerLevel(experience) {
        if (!experience || !Array.isArray(experience)) return 'entry-level';
        
        const totalYears = experience.reduce((years, exp) => {
            const period = exp.period || '';
            const match = period.match(/(\d+)\s*year/i);
            return years + (match ? parseInt(match[1]) : 1);
        }, 0);
        
        if (totalYears >= 10) return 'senior-level';
        if (totalYears >= 5) return 'mid-level';
        return 'entry-level';
    }

    inferNetworkingGoals(cvData) {
        const goals = [];
        
        if (cvData.personal_info?.availability === 'Open to opportunities') {
            goals.push('career_advancement');
        }
        
        if (cvData.skills?.some(skill => 
            typeof skill === 'object' && skill.name?.toLowerCase().includes('ai')
        )) {
            goals.push('ai_community_building');
        }
        
        goals.push('industry_insights', 'professional_development');
        
        return goals;
    }

    extractTargetCompanies(cvData) {
        // Extract companies from experience that might be networking targets
        const companies = cvData.experience?.map(exp => exp.company) || [];
        return [...new Set(companies)].slice(0, 5);
    }

    extractProfessionalInterests(cvData) {
        const interests = [];
        
        const techSkills = cvData.skills?.filter(skill => {
            const skillName = (skill.name || skill).toLowerCase();
            return skillName.includes('ai') || 
                   skillName.includes('machine learning') || 
                   skillName.includes('python') ||
                   skillName.includes('automation');
        }) || [];
        
        if (techSkills.length > 0) {
            interests.push('artificial_intelligence', 'automation', 'machine_learning');
        }
        
        interests.push('systems_integration', 'cybersecurity', 'digital_transformation');
        
        return interests;
    }

    hasProfessionalAlignment(userProfile, targetProfile) {
        const userIndustry = userProfile.industry?.toLowerCase() || '';
        const targetHeadline = targetProfile.headline?.toLowerCase() || '';
        
        return targetHeadline.includes(userIndustry.split('/')[0]) ||
               targetHeadline.includes('systems') ||
               targetHeadline.includes('technology') ||
               targetHeadline.includes('ai');
    }

    hasIndustryAlignment(userProfile, targetProfile) {
        const userIndustry = userProfile.industry?.toLowerCase() || '';
        const targetHeadline = targetProfile.headline?.toLowerCase() || '';
        
        return userIndustry.split('/').some(industry => 
            targetHeadline.includes(industry.trim())
        );
    }

    calculateSkillOverlap(userSkills, targetSkills) {
        if (!targetSkills || !Array.isArray(targetSkills)) return 0;
        
        const userSkillsNormalized = userSkills.map(s => s.toLowerCase());
        const targetSkillsNormalized = targetSkills.map(s => 
            (s.name || s).toLowerCase()
        );
        
        const overlap = userSkillsNormalized.filter(skill => 
            targetSkillsNormalized.includes(skill)
        ).length;
        
        return overlap / Math.max(userSkillsNormalized.length, targetSkillsNormalized.length) * 100;
    }

    isTargetIndustryRelevant(userProfile, targetProfile) {
        const relevantKeywords = ['technology', 'software', 'ai', 'systems', 'engineering', 'data'];
        const targetHeadline = targetProfile.headline?.toLowerCase() || '';
        
        return relevantKeywords.some(keyword => targetHeadline.includes(keyword));
    }

    hasAdjacentIndustryExperience(userProfile, targetProfile) {
        const adjacentKeywords = ['consulting', 'project', 'analysis', 'management', 'digital'];
        const targetHeadline = targetProfile.headline?.toLowerCase() || '';
        
        return adjacentKeywords.some(keyword => targetHeadline.includes(keyword));
    }

    assessCareerValue(userProfile, targetProfile) {
        const userLevel = userProfile.career_level;
        const targetExperience = targetProfile.experience?.length || 0;
        
        // Higher value for connections with more experience or complementary levels
        if (userLevel === 'entry-level' && targetExperience > 5) return 85;
        if (userLevel === 'mid-level' && targetExperience > 3) return 75;
        if (userLevel === 'senior-level' && targetExperience > 7) return 70;
        
        return 60;
    }

    calculateGeographicRelevance(userLocation, targetLocation) {
        if (!userLocation || !targetLocation) return 50;
        
        const userLoc = userLocation.toLowerCase();
        const targetLoc = targetLocation.toLowerCase();
        
        // Same city/state
        if (userLoc === targetLoc) return 100;
        
        // Same country/region
        if (userLoc.includes('australia') && targetLoc.includes('australia')) return 80;
        if (userLoc.includes('tasmania') && targetLoc.includes('australia')) return 85;
        
        // Remote-friendly
        if (targetLoc.includes('remote') || userLoc.includes('remote')) return 90;
        
        return 40; // Different regions
    }

    getNetworkingRecommendation(score) {
        if (score >= 80) return 'Highly recommended - Strong alignment and mutual value';
        if (score >= 70) return 'Recommended - Good potential for professional relationship';
        if (score >= 60) return 'Consider - Moderate networking value';
        return 'Low priority - Limited alignment detected';
    }

    getConnectionPriority(score) {
        if (score >= 80) return 'high';
        if (score >= 65) return 'medium';
        return 'low';
    }

    // Parsing and response processing methods
    parseCompatibilityResponse(response) {
        // Extract compatibility score and reasoning from AI response
        const scoreMatch = response.match(/(\d+)\/100|(\d+)%/);
        const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 70;
        
        let compatibility_level = 'moderate';
        if (score >= 80) compatibility_level = 'high';
        else if (score >= 60) compatibility_level = 'good';
        else if (score < 40) compatibility_level = 'low';
        
        return {
            score,
            compatibility_level,
            reasoning: response,
            analysis_date: new Date().toISOString()
        };
    }

    parseConnectionStrategy(response) {
        // Extract structured strategy from AI response
        const lines = response.split('\n');
        
        return {
            connection_message: this.extractConnectionMessage(response),
            conversation_starters: this.extractConversationStarters(response),
            follow_up_strategy: this.extractFollowUpStrategy(response),
            collaboration_opportunities: this.extractCollaborationOpportunities(response),
            timeline: this.extractTimeline(response),
            full_strategy: response
        };
    }

    extractConnectionMessage(response) {
        const messageMatch = response.match(/connection message[:\s]*["']?([^"'\n]{50,150})["']?/i);
        return messageMatch ? messageMatch[1].trim() : 
            "Hi [Name], I noticed your work in [Industry/Field] and would love to connect to discuss [Mutual Interest]. Best regards!";
    }

    extractConversationStarters(response) {
        const starters = [];
        const starterSection = response.match(/conversation starters?[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        
        if (starterSection) {
            const lines = starterSection[1].split('\n');
            lines.forEach(line => {
                if (line.trim() && !line.match(/^\d+\./) && line.length > 20) {
                    starters.push(line.trim());
                }
            });
        }
        
        return starters.length > 0 ? starters : [
            "Your experience with [Technology/Industry] caught my attention",
            "I'd love to learn about your approach to [Professional Area]",
            "Your insights on [Industry Topic] would be valuable"
        ];
    }

    extractFollowUpStrategy(response) {
        const followUpMatch = response.match(/follow.?up.*?strategy[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        return followUpMatch ? followUpMatch[1].trim() : 
            "Schedule follow-up message within 1-2 weeks with relevant industry insights or collaboration opportunities";
    }

    extractCollaborationOpportunities(response) {
        const collabMatch = response.match(/collaboration.*?opportunities[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        return collabMatch ? collabMatch[1].trim() : 
            "Explore opportunities for knowledge sharing, project collaboration, or professional development";
    }

    extractTimeline(response) {
        const timelineMatch = response.match(/timeline[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        return timelineMatch ? timelineMatch[1].trim() : 
            "Initial connection -> 1-2 weeks follow-up -> Monthly professional updates";
    }

    // Fallback methods for when AI fails
    performRuleBasedCompatibilityAnalysis(userProfile, targetProfile) {
        let score = 50; // Base score
        
        // Industry alignment
        if (this.hasProfessionalAlignment(userProfile, targetProfile)) score += 20;
        else if (this.hasIndustryAlignment(userProfile, targetProfile)) score += 10;
        
        // Skill overlap
        const skillOverlap = this.calculateSkillOverlap(userProfile.skills, targetProfile.skills);
        score += Math.min(skillOverlap, 20);
        
        // Career level compatibility
        if (userProfile.career_level === 'mid-level' && targetProfile.experience?.length > 3) score += 10;
        
        return {
            score: Math.min(score, 100),
            compatibility_level: score >= 70 ? 'high' : score >= 50 ? 'moderate' : 'low',
            reasoning: 'Rule-based compatibility analysis',
            analysis_date: new Date().toISOString()
        };
    }

    generateRuleBasedConnectionStrategy(userProfile, targetProfile) {
        return {
            connection_message: `Hi ${targetProfile.name}, I'm ${userProfile.personal_info?.name} and noticed your work in ${targetProfile.headline}. Would love to connect!`,
            conversation_starters: [
                `Your experience with ${targetProfile.headline} is impressive`,
                "I'd love to learn about your professional journey",
                "Your industry insights would be valuable"
            ],
            follow_up_strategy: "Follow up within 2 weeks with relevant professional content",
            collaboration_opportunities: "Explore knowledge sharing and professional development opportunities",
            timeline: "Initial connection -> 2 weeks follow-up -> Monthly check-ins",
            full_strategy: "Basic rule-based connection strategy"
        };
    }

    generateRuleBasedInsights(userProfile, analyses) {
        const industries = [...new Set(analyses.map(a => this.extractIndustryFromProfile(a.target_profile)))];
        const avgScore = analyses.reduce((sum, a) => sum + a.networking_score.overall, 0) / analyses.length;
        
        return {
            strategy_assessment: `Analyzed ${analyses.length} profiles with average score ${avgScore.toFixed(1)}/100`,
            industry_analysis: {
                represented_industries: industries,
                diversification_score: Math.min(industries.length * 15, 100),
                recommendations: ['Expand to adjacent industries', 'Focus on high-scoring connections']
            },
            priority_sequence: this.generatePrioritySequence(analyses),
            network_gaps: ['Senior leadership connections', 'Cross-industry relationships'],
            ai_insights: 'Rule-based analysis completed due to AI limitations'
        };
    }

    generatePrioritySequence(analyses) {
        return analyses
            .filter(a => a.networking_score.priority === 'high')
            .slice(0, 3)
            .map(a => ({
                name: a.target_profile.name,
                score: a.networking_score.overall,
                reason: a.networking_score.recommendation
            }));
    }

    identifyNetworkGaps(userProfile, analyses) {
        const gaps = [];
        
        if (analyses.filter(a => a.networking_score.priority === 'high').length < 3) {
            gaps.push('Limited high-priority connections');
        }
        
        const industries = [...new Set(analyses.map(a => this.extractIndustryFromProfile(a.target_profile)))];
        if (industries.length < 3) {
            gaps.push('Limited industry diversification');
        }
        
        const seniorConnections = analyses.filter(a => 
            a.target_profile.experience_count > 5
        ).length;
        if (seniorConnections < 2) {
            gaps.push('Insufficient senior-level connections');
        }
        
        return gaps;
    }

    extractIndustryFromProfile(profile) {
        const headline = profile.headline?.toLowerCase() || '';
        
        if (headline.includes('software') || headline.includes('engineer')) return 'Technology';
        if (headline.includes('consultant')) return 'Consulting';
        if (headline.includes('manager') || headline.includes('director')) return 'Management';
        if (headline.includes('analyst')) return 'Analysis';
        
        return 'Professional Services';
    }

    extractStrategyAssessment(response) {
        const assessmentMatch = response.match(/strategy.*?assessment[:\s]*\n(.*?)(?=\n\d+\.|$)/is);
        return assessmentMatch ? assessmentMatch[1].trim() : 
            'Strategic networking approach shows good potential for professional growth';
    }

    generateIndustryRecommendations(industries, userProfile) {
        const recommendations = [];
        
        if (!industries.includes('Technology') && userProfile.skills?.some(s => 
            s.toLowerCase().includes('ai') || s.toLowerCase().includes('python')
        )) {
            recommendations.push('Target more technology industry connections');
        }
        
        if (!industries.includes('Consulting')) {
            recommendations.push('Consider consulting professionals for diverse perspectives');
        }
        
        if (industries.length < 3) {
            recommendations.push('Diversify across at least 3-4 industries for broader network');
        }
        
        return recommendations;
    }

    // Utility methods
    async verifyUserConsent(operation) {
        if (!this.options.userConsent) {
            throw new Error(`User consent required for networking ${operation}`);
        }
        
        this.log('consent-verified', { operation });
        return true;
    }

    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceStart = now - this.sessionStart;
        
        if (timeSinceStart < this.options.rateLimitMs) {
            const waitTime = this.options.rateLimitMs - timeSinceStart;
            this.log('rate-limit-enforced', { waitTimeMs: waitTime });
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.sessionStart = Date.now();
    }

    sanitizeUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        } catch {
            return 'invalid-url';
        }
    }

    log(operation, data = null) {
        if (!this.options.auditLogging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            data,
            sessionId: this.sessionStart
        };
        
        this.operationLog.push(logEntry);
        console.log(`[NETWORKING-AUDIT] ${operation}`, data ? JSON.stringify(data, null, 2) : '');
    }

    getAuditTrail() {
        return {
            sessionId: this.sessionStart,
            totalOperations: this.operationLog.length,
            networking_session: this.networkingSession,
            ethicalCompliance: {
                userConsent: this.options.userConsent,
                rateLimited: true,
                auditLogged: true
            },
            operations: this.operationLog
        };
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🤝 AI-Powered Professional Networking Agent');
    console.log('Usage: node ai-networking-agent.js [analyze|recommend] [profile-urls...]');
    
    const command = process.argv[2] || 'help';
    const profileUrls = process.argv.slice(3).filter(arg => !arg.startsWith('--'));
    
    const agent = new AINetworkingAgent({
        userConsent: true,
        networkingStrategy: process.argv.includes('--quality') ? 'quality' : 'balanced',
        analysisDepth: process.argv.includes('--comprehensive') ? 'comprehensive' : 'detailed',
        maxRecommendations: parseInt(process.argv.find(arg => arg.startsWith('--max='))?.split('=')[1]) || 10
    });
    
    try {
        switch (command) {
            case 'analyze':
                if (profileUrls.length === 0) {
                    console.log('❌ At least one profile URL required for analysis');
                    console.log('Example: node ai-networking-agent.js analyze https://linkedin.com/in/target-profile');
                    process.exit(1);
                }
                
                console.log('🔍 Analyzing professional networking opportunities...');
                console.log(`📋 Target profiles: ${profileUrls.length}`);
                
                const userProfile = await agent.loadUserProfile();
                const analysis = await agent.analyzeConnectionProfile(profileUrls[0], userProfile);
                
                console.log('✅ Analysis completed');
                console.log(`📊 Networking Score: ${analysis.networking_score.overall}/100`);
                console.log(`🎯 Priority: ${analysis.networking_score.priority}`);
                console.log(`💡 Recommendation: ${analysis.networking_score.recommendation}`);
                break;
                
            case 'recommend':
                if (profileUrls.length === 0) {
                    console.log('❌ At least one profile URL required for recommendations');
                    console.log('Example: node ai-networking-agent.js recommend https://linkedin.com/in/profile1 https://linkedin.com/in/profile2');
                    process.exit(1);
                }
                
                console.log('🚀 Generating networking recommendations...');
                console.log(`📋 Analyzing ${profileUrls.length} profiles`);
                
                const userProf = await agent.loadUserProfile();
                const recommendations = await agent.generateNetworkingRecommendations(userProf, profileUrls);
                
                const reportPath = await agent.saveNetworkingRecommendations(recommendations);
                
                console.log('✅ Networking recommendations completed');
                console.log(`📊 Profiles analyzed: ${recommendations.networking_summary.total_analyzed}`);
                console.log(`🎯 High priority: ${recommendations.networking_summary.high_priority}`);
                console.log(`📈 Average score: ${recommendations.networking_summary.average_score.toFixed(1)}/100`);
                console.log(`📄 Report saved: ${reportPath}`);
                break;
                
            default:
                console.log('🤝 AI-Powered Professional Networking Agent Commands:');
                console.log('');
                console.log('  analyze [url]           - Analyze single connection opportunity');
                console.log('  recommend [urls...]     - Generate comprehensive networking recommendations');
                console.log('');
                console.log('Options:');
                console.log('  --quality              - Focus on quality over quantity');
                console.log('  --comprehensive        - Detailed analysis mode');
                console.log('  --max=N               - Maximum recommendations (default: 10)');
                console.log('');
                console.log('Examples:');
                console.log('  node ai-networking-agent.js analyze https://linkedin.com/in/target-profile');
                console.log('  node ai-networking-agent.js recommend https://linkedin.com/in/profile1 https://linkedin.com/in/profile2 --quality');
        }
        
    } catch (error) {
        console.error('❌ Networking agent error:', error.message);
        
        if (error.message.includes('consent')) {
            console.log('\n📝 Ethical networking requirements:');
            console.log('1. Only analyze publicly available LinkedIn profiles');
            console.log('2. Respect LinkedIn Terms of Service');
            console.log('3. Focus on authentic professional relationship building');
            console.log('4. Use recommendations for genuine networking purposes');
        }
    }
}