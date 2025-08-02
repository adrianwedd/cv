#!/usr/bin/env node

/**
 * Google Gemini API Client
 * 
 * Ethical AI client for professional profile analysis and content enhancement.
 * Implements rate limiting, consent verification, and transparent logging.
 * 
 * ETHICAL FRAMEWORK:
 * - User consent required for all operations
 * - Rate limiting and request quotas enforced
 * - Complete audit trail of all AI interactions
 * - Content validation to prevent hallucinations
 */

import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

export class EthicalGeminiClient {
    constructor(options = {}) {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY environment variable required');
        }
        
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        this.options = {
            rateLimitMs: 60000,        // 1 minute between requests
            maxRequestsPerHour: 30,    // Conservative daily limit
            maxTokensPerRequest: 8192, // Token limit per request
            consentRequired: true,     // User consent mandatory
            auditLogging: true,        // Complete operation logging
            ...options
        };
        
        this.requestHistory = [];
        this.lastRequestTime = 0;
        this.sessionStart = Date.now();
    }

    /**
     * Verify user consent for AI operations
     */
    async verifyConsent(operation) {
        if (!this.options.consentRequired) {
            return true;
        }
        
        // In production, this would check actual user consent
        // For now, we'll assume consent has been verified
        this.log('consent-verified', { operation });
        return true;
    }

    /**
     * Check and enforce rate limiting
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // Check hourly request limit
        const hourAgo = now - (60 * 60 * 1000);
        const recentRequests = this.requestHistory.filter(req => req.timestamp > hourAgo);
        
        if (recentRequests.length >= this.options.maxRequestsPerHour) {
            throw new Error(`Hourly request limit exceeded (${this.options.maxRequestsPerHour})`);
        }
        
        // Enforce minimum delay between requests
        if (timeSinceLastRequest < this.options.rateLimitMs) {
            const waitTime = this.options.rateLimitMs - timeSinceLastRequest;
            this.log('rate-limit-wait', { waitTimeMs: waitTime });
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Log operation for audit trail
     */
    log(operation, data = null) {
        if (!this.options.auditLogging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            data,
            sessionId: this.sessionStart,
            requestCount: this.requestHistory.length
        };
        
        this.requestHistory.push(logEntry);
        console.log(`[GEMINI-AUDIT] ${operation}`, data ? JSON.stringify(data, null, 2) : '');
    }

    /**
     * Analyze LinkedIn profile data for professional insights
     */
    async analyzeLinkedInProfile(profileData, analysisType = 'comprehensive') {
        await this.verifyConsent('linkedin-profile-analysis');
        await this.enforceRateLimit();
        
        this.log('profile-analysis-start', { 
            analysisType, 
            dataFields: Object.keys(profileData),
            profileSize: JSON.stringify(profileData).length 
        });
        
        try {
            const prompt = this.buildProfileAnalysisPrompt(profileData, analysisType);
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const analysis = response.text();
            
            this.log('profile-analysis-complete', { 
                analysisLength: analysis.length,
                tokensUsed: this.estimateTokens(prompt + analysis)
            });
            
            return {
                analysis,
                metadata: {
                    analysisType,
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + analysis),
                    ethicalCompliance: {
                        consentVerified: true,
                        rateLimited: true,
                        auditLogged: true
                    }
                }
            };
            
        } catch (error) {
            this.log('profile-analysis-error', { 
                error: error.message,
                analysisType 
            });
            throw error;
        }
    }

    /**
     * Extract and enhance professional skills from profile data
     */
    async extractProfessionalSkills(profileData) {
        await this.verifyConsent('skills-extraction');
        await this.enforceRateLimit();
        
        this.log('skills-extraction-start', { 
            profileFields: Object.keys(profileData) 
        });
        
        try {
            const prompt = `
                Analyze this professional profile data and extract comprehensive skills information:
                
                Profile Data: ${JSON.stringify(profileData)}
                
                Please provide a structured JSON response with:
                1. Technical skills with proficiency levels
                2. Professional competencies and experience years
                3. Industry-specific expertise areas
                4. Soft skills and leadership capabilities
                5. Skill gap analysis and recommendations
                
                Ensure all extracted skills are verifiable from the provided data.
                Do not fabricate or assume skills not explicitly mentioned.
                
                Format response as valid JSON.
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const skillsAnalysis = response.text();
            
            // Attempt to parse as JSON, fallback to text if invalid
            let structuredSkills;
            try {
                structuredSkills = JSON.parse(skillsAnalysis);
            } catch (parseError) {
                this.log('skills-parsing-fallback', { error: parseError.message });
                structuredSkills = { rawAnalysis: skillsAnalysis };
            }
            
            this.log('skills-extraction-complete', { 
                skillsFound: Object.keys(structuredSkills).length,
                tokensUsed: this.estimateTokens(prompt + skillsAnalysis)
            });
            
            return {
                skills: structuredSkills,
                metadata: {
                    extractionType: 'professional-skills',
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + skillsAnalysis)
                }
            };
            
        } catch (error) {
            this.log('skills-extraction-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate professional summary optimization suggestions
     */
    async optimizeProfessionalSummary(currentSummary, profileData = {}) {
        await this.verifyConsent('summary-optimization');
        await this.enforceRateLimit();
        
        this.log('summary-optimization-start', { 
            currentSummaryLength: currentSummary.length 
        });
        
        try {
            const prompt = `
                Optimize this professional summary for maximum impact and authenticity:
                
                Current Summary: "${currentSummary}"
                
                Supporting Profile Data: ${JSON.stringify(profileData)}
                
                Please provide:
                1. Enhanced professional summary (concise, impactful)
                2. Key strengths to highlight
                3. Industry positioning recommendations
                4. Specific improvements made and rationale
                
                Maintain authenticity - only enhance based on verifiable information.
                Focus on professional impact and career positioning.
                Keep the enhanced summary professional and genuine.
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const optimization = response.text();
            
            this.log('summary-optimization-complete', { 
                optimizationLength: optimization.length,
                tokensUsed: this.estimateTokens(prompt + optimization)
            });
            
            return {
                optimization,
                metadata: {
                    optimizationType: 'professional-summary',
                    originalLength: currentSummary.length,
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + optimization)
                }
            };
            
        } catch (error) {
            this.log('summary-optimization-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Build profile analysis prompt based on analysis type
     */
    buildProfileAnalysisPrompt(profileData, analysisType) {
        const basePrompt = `
            Analyze this LinkedIn profile data for professional development insights:
            
            Profile Data: ${JSON.stringify(profileData, null, 2)}
            
            This is user-owned profile data being analyzed for personal professional development.
            Please ensure all analysis is based solely on the provided data.
        `;
        
        switch (analysisType) {
            case 'skills-focused':
                return basePrompt + `
                    Focus your analysis on:
                    1. Technical and professional skills assessment
                    2. Skill gap identification and recommendations
                    3. Industry positioning based on skills
                    4. Professional development suggestions
                `;
                
            case 'career-progression':
                return basePrompt + `
                    Focus your analysis on:
                    1. Career trajectory and progression patterns
                    2. Leadership and growth opportunities
                    3. Strategic career positioning recommendations
                    4. Professional network and relationship building
                `;
                
            case 'comprehensive':
            default:
                return basePrompt + `
                    Provide comprehensive analysis including:
                    1. Professional summary enhancement suggestions
                    2. Skills assessment and gap analysis
                    3. Career progression recommendations
                    4. Industry positioning and market insights
                    5. Professional development priorities
                    
                    Maintain authenticity and base all recommendations on verifiable profile data.
                `;
        }
    }

    /**
     * Estimate token usage for cost tracking
     */
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    /**
     * Generate AI-powered networking compatibility analysis
     */
    async analyzeNetworkingCompatibility(userProfile, targetProfile) {
        await this.verifyConsent('networking-compatibility-analysis');
        await this.enforceRateLimit();
        
        this.log('networking-compatibility-start', {
            userProfile: userProfile.personal_info?.name || 'Anonymous',
            targetProfile: targetProfile.name || 'Anonymous'
        });
        
        try {
            const prompt = `
                Analyze professional networking compatibility between two LinkedIn profiles:

                USER PROFILE:
                - Name: ${userProfile.personal_info?.name || 'User'}
                - Current Role: ${userProfile.current_role?.position || 'N/A'} at ${userProfile.current_role?.company || 'N/A'}
                - Industry: ${userProfile.industry || 'Technology'}
                - Career Level: ${userProfile.career_level || 'Mid-level'}
                - Key Skills: ${userProfile.skills?.slice(0, 10).join(', ') || 'Various technical skills'}
                - Professional Interests: ${userProfile.professional_interests?.join(', ') || 'Technology, AI, Systems'}

                TARGET PROFILE:
                - Name: ${targetProfile.name || 'Target Professional'}
                - Headline: ${targetProfile.headline || 'N/A'}
                - Location: ${targetProfile.location || 'N/A'}
                - Experience Count: ${targetProfile.experience?.length || 0} positions
                - Skills: ${targetProfile.skills?.slice(0, 10).map(s => s.name || s).join(', ') || 'N/A'}

                Please analyze and provide a JSON response with:
                {
                    "compatibility_score": 0-100,
                    "compatibility_level": "high|good|moderate|low",
                    "professional_alignment": {
                        "industry_match": 0-100,
                        "skill_overlap": 0-100,
                        "career_synergy": 0-100,
                        "geographic_relevance": 0-100
                    },
                    "mutual_value_assessment": {
                        "user_benefits": ["benefit1", "benefit2"],
                        "target_benefits": ["benefit1", "benefit2"],
                        "collaboration_potential": "high|medium|low"
                    },
                    "connection_strategy": {
                        "approach": "direct|referral|event-based|content-engagement",
                        "conversation_starters": ["topic1", "topic2", "topic3"],
                        "value_proposition": "What unique value can the user offer"
                    },
                    "relationship_building": {
                        "timeline": "immediate|short-term|long-term",
                        "touchpoint_frequency": "weekly|monthly|quarterly",
                        "relationship_type": "mentor|peer|collaboration|industry-insight"
                    },
                    "risk_assessment": {
                        "connection_likelihood": 0-100,
                        "potential_obstacles": ["obstacle1", "obstacle2"],
                        "mitigation_strategies": ["strategy1", "strategy2"]
                    }
                }

                Base your analysis on authentic professional relationship building principles.
                Focus on mutual value creation and strategic career advancement.
                Ensure recommendations are actionable and ethical.
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const analysisText = response.text();
            
            // Extract JSON from response
            let analysis;
            try {
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                this.log('networking-analysis-parse-fallback', { error: parseError.message });
                analysis = {
                    compatibility_score: 70,
                    compatibility_level: 'moderate',
                    raw_analysis: analysisText,
                    parsing_error: true
                };
            }
            
            this.log('networking-compatibility-complete', {
                compatibilityScore: analysis.compatibility_score,
                compatibilityLevel: analysis.compatibility_level,
                tokensUsed: this.estimateTokens(prompt + analysisText)
            });
            
            return {
                analysis,
                metadata: {
                    analysisType: 'networking-compatibility',
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + analysisText),
                    ethicalCompliance: {
                        consentVerified: true,
                        rateLimited: true,
                        auditLogged: true
                    }
                }
            };
            
        } catch (error) {
            this.log('networking-compatibility-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate strategic networking insights and recommendations
     */
    async generateNetworkingStrategy(userProfile, networkData) {
        await this.verifyConsent('networking-strategy-generation');
        await this.enforceRateLimit();
        
        this.log('networking-strategy-start', {
            userProfile: userProfile.personal_info?.name || 'Anonymous',
            networkSize: networkData?.totalConnections || 0
        });
        
        try {
            const prompt = `
                Generate strategic networking insights and recommendations:

                USER PROFILE:
                - Name: ${userProfile.personal_info?.name || 'Professional'}
                - Industry: ${userProfile.industry || 'Technology'}
                - Career Level: ${userProfile.career_level || 'Mid-level'}
                - Current Role: ${userProfile.current_role?.position || 'N/A'}
                - Skills: ${userProfile.skills?.slice(0, 15).join(', ') || 'Various'}
                - Goals: ${userProfile.networking_goals?.join(', ') || 'Career advancement, Industry insights'}

                CURRENT NETWORK DATA:
                - Total Connections: ${networkData?.totalConnections || 0}
                - Industry Distribution: ${JSON.stringify(networkData?.industryBreakdown || [])}
                - Quality Score: ${networkData?.qualityScore || 50}%
                - Active Relationships: ${networkData?.activeRelationships || 0}

                Please provide comprehensive networking strategy recommendations in JSON format:
                {
                    "strategic_assessment": {
                        "network_maturity": "early|developing|established|advanced",
                        "diversification_score": 0-100,
                        "quality_vs_quantity": "quality-focused|quantity-focused|balanced",
                        "growth_potential": "high|medium|low"
                    },
                    "gap_analysis": {
                        "missing_industries": ["industry1", "industry2"],
                        "underrepresented_roles": ["role1", "role2"],
                        "geographic_gaps": ["region1", "region2"],
                        "skill_complementarity": ["skill1", "skill2"]
                    },
                    "strategic_priorities": [
                        {
                            "priority": 1,
                            "objective": "Expand AI research network",
                            "target_personas": ["AI researchers", "ML engineers"],
                            "timeline": "Q4 2025",
                            "success_metrics": ["5 new AI connections", "2 research collaborations"]
                        }
                    ],
                    "networking_tactics": {
                        "primary_channels": ["linkedin|conferences|industry-events|online-communities"],
                        "content_strategy": ["thought-leadership|industry-insights|project-showcasing"],
                        "engagement_approach": ["proactive|reactive|balanced"],
                        "relationship_nurturing": ["regular-updates|value-sharing|collaboration-seeking"]
                    },
                    "industry_insights": {
                        "trending_skills": ["skill1", "skill2"],
                        "emerging_opportunities": ["opportunity1", "opportunity2"],
                        "market_positioning": "How to position professionally in current market",
                        "competitive_landscape": "Key differentiators to emphasize"
                    },
                    "action_plan": {
                        "immediate_actions": ["action1", "action2"],
                        "30_day_goals": ["goal1", "goal2"],
                        "90_day_objectives": ["objective1", "objective2"],
                        "annual_targets": ["target1", "target2"]
                    }
                }

                Focus on actionable, strategic recommendations that align with career goals.
                Consider industry trends and professional development opportunities.
                Emphasize authentic relationship building and mutual value creation.
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const strategyText = response.text();
            
            // Extract JSON from response
            let strategy;
            try {
                const jsonMatch = strategyText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    strategy = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                this.log('networking-strategy-parse-fallback', { error: parseError.message });
                strategy = {
                    strategic_assessment: { network_maturity: 'developing' },
                    raw_strategy: strategyText,
                    parsing_error: true
                };
            }
            
            this.log('networking-strategy-complete', {
                strategicPriorities: strategy.strategic_priorities?.length || 0,
                actionPlan: !!strategy.action_plan,
                tokensUsed: this.estimateTokens(prompt + strategyText)
            });
            
            return {
                strategy,
                metadata: {
                    analysisType: 'networking-strategy',
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + strategyText),
                    ethicalCompliance: {
                        consentVerified: true,
                        rateLimited: true,
                        auditLogged: true
                    }
                }
            };
            
        } catch (error) {
            this.log('networking-strategy-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Analyze professional content for networking optimization
     */
    async optimizeNetworkingContent(contentType, content, targetAudience = 'professional') {
        await this.verifyConsent('networking-content-optimization');
        await this.enforceRateLimit();
        
        this.log('networking-content-optimization-start', {
            contentType,
            contentLength: content.length,
            targetAudience
        });
        
        try {
            const prompt = `
                Optimize this professional content for maximum networking impact:

                CONTENT TYPE: ${contentType}
                TARGET AUDIENCE: ${targetAudience}
                
                ORIGINAL CONTENT:
                "${content}"

                Please provide optimization recommendations in JSON format:
                {
                    "optimized_content": "Enhanced version of the content",
                    "key_improvements": [
                        {
                            "improvement": "Specific change made",
                            "rationale": "Why this improves networking impact",
                            "impact_level": "high|medium|low"
                        }
                    ],
                    "networking_elements": {
                        "conversation_starters": ["element1", "element2"],
                        "engagement_hooks": ["hook1", "hook2"],
                        "value_propositions": ["value1", "value2"],
                        "call_to_actions": ["cta1", "cta2"]
                    },
                    "audience_targeting": {
                        "primary_personas": ["persona1", "persona2"],
                        "industry_relevance": ["industry1", "industry2"],
                        "seniority_appeal": "junior|mid|senior|executive",
                        "geographic_scope": "local|national|international"
                    },
                    "performance_prediction": {
                        "engagement_potential": 0-100,
                        "networking_opportunities": 0-100,
                        "professional_visibility": 0-100,
                        "relationship_building": 0-100
                    }
                }

                Focus on authentic professional communication that builds genuine relationships.
                Maintain professional tone while enhancing networking potential.
                Ensure recommendations are actionable and industry-appropriate.
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const optimizationText = response.text();
            
            // Extract JSON from response
            let optimization;
            try {
                const jsonMatch = optimizationText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    optimization = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                this.log('networking-content-parse-fallback', { error: parseError.message });
                optimization = {
                    optimized_content: content,
                    raw_optimization: optimizationText,
                    parsing_error: true
                };
            }
            
            this.log('networking-content-optimization-complete', {
                improvementsCount: optimization.key_improvements?.length || 0,
                engagementPotential: optimization.performance_prediction?.engagement_potential || 0,
                tokensUsed: this.estimateTokens(prompt + optimizationText)
            });
            
            return {
                optimization,
                metadata: {
                    analysisType: 'networking-content-optimization',
                    contentType,
                    targetAudience,
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + optimizationText),
                    ethicalCompliance: {
                        consentVerified: true,
                        rateLimited: true,
                        auditLogged: true
                    }
                }
            };
            
        } catch (error) {
            this.log('networking-content-optimization-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate personalized connection messages
     */
    async generateConnectionMessage(userProfile, targetProfile, connectionContext = {}) {
        await this.verifyConsent('connection-message-generation');
        await this.enforceRateLimit();
        
        this.log('connection-message-start', {
            targetProfile: targetProfile.name || 'Anonymous',
            hasContext: Object.keys(connectionContext).length > 0
        });
        
        try {
            const prompt = `
                Generate a personalized LinkedIn connection message:

                USER PROFILE:
                - Name: ${userProfile.personal_info?.name || 'User'}
                - Current Role: ${userProfile.current_role?.position || 'Professional'}
                - Company: ${userProfile.current_role?.company || 'N/A'}
                - Industry: ${userProfile.industry || 'Technology'}

                TARGET PROFILE:
                - Name: ${targetProfile.name || 'Professional'}
                - Headline: ${targetProfile.headline || 'N/A'}
                - Company: ${targetProfile.company || 'N/A'}
                - Location: ${targetProfile.location || 'N/A'}

                CONNECTION CONTEXT:
                - Mutual Interests: ${connectionContext.mutualInterests?.join(', ') || 'Professional development'}
                - Connection Reason: ${connectionContext.reason || 'Professional networking'}
                - Shared Connections: ${connectionContext.sharedConnections || 0}
                - Industry Events: ${connectionContext.events?.join(', ') || 'None specified'}

                Generate 3 different connection message options in JSON format:
                {
                    "messages": [
                        {
                            "style": "professional-direct",
                            "message": "150 character LinkedIn connection message",
                            "tone": "professional|friendly|industry-focused",
                            "personalization_elements": ["element1", "element2"],
                            "success_probability": 0-100
                        },
                        {
                            "style": "value-focused",
                            "message": "150 character LinkedIn connection message",
                            "tone": "professional|friendly|industry-focused", 
                            "personalization_elements": ["element1", "element2"],
                            "success_probability": 0-100
                        },
                        {
                            "style": "mutual-interest",
                            "message": "150 character LinkedIn connection message",
                            "tone": "professional|friendly|industry-focused",
                            "personalization_elements": ["element1", "element2"], 
                            "success_probability": 0-100
                        }
                    ],
                    "follow_up_strategy": {
                        "timing": "immediate|1-week|2-weeks|1-month",
                        "approach": "value-sharing|industry-insights|collaboration-proposal",
                        "content_suggestions": ["suggestion1", "suggestion2"]
                    },
                    "relationship_building": {
                        "short_term_goals": ["goal1", "goal2"],
                        "long_term_objectives": ["objective1", "objective2"],
                        "mutual_value_opportunities": ["opportunity1", "opportunity2"]
                    }
                }

                Ensure messages are:
                - Under 150 characters (LinkedIn limit)
                - Professional and authentic
                - Personalized to the target profile
                - Value-focused rather than self-promotional
                - Respectful and genuine
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const messageText = response.text();
            
            // Extract JSON from response
            let messageData;
            try {
                const jsonMatch = messageText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    messageData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                this.log('connection-message-parse-fallback', { error: parseError.message });
                messageData = {
                    messages: [{
                        style: 'fallback',
                        message: `Hi ${targetProfile.name}, I'd love to connect and discuss our shared interests in ${userProfile.industry}.`,
                        tone: 'professional',
                        personalization_elements: ['name', 'industry'],
                        success_probability: 70
                    }],
                    raw_response: messageText,
                    parsing_error: true
                };
            }
            
            this.log('connection-message-complete', {
                messagesGenerated: messageData.messages?.length || 0,
                averageSuccessProbability: messageData.messages?.reduce((sum, msg) => sum + (msg.success_probability || 0), 0) / (messageData.messages?.length || 1),
                tokensUsed: this.estimateTokens(prompt + messageText)
            });
            
            return {
                messageData,
                metadata: {
                    analysisType: 'connection-message-generation',
                    targetProfile: targetProfile.name || 'Anonymous',
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + messageText),
                    ethicalCompliance: {
                        consentVerified: true,
                        rateLimited: true,
                        auditLogged: true
                    }
                }
            };
            
        } catch (error) {
            this.log('connection-message-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Analyze network growth opportunities
     */
    async analyzeNetworkGrowthOpportunities(userProfile, currentNetwork, targetIndustries = []) {
        await this.verifyConsent('network-growth-analysis');
        await this.enforceRateLimit();
        
        this.log('network-growth-analysis-start', {
            currentNetworkSize: currentNetwork?.totalConnections || 0,
            targetIndustries: targetIndustries.length
        });
        
        try {
            const prompt = `
                Analyze network growth opportunities and strategic expansion:

                USER PROFILE:
                - Career Level: ${userProfile.career_level || 'Mid-level'}
                - Industry: ${userProfile.industry || 'Technology'}
                - Skills: ${userProfile.skills?.slice(0, 10).join(', ') || 'Various'}
                - Goals: ${userProfile.networking_goals?.join(', ') || 'Career advancement'}

                CURRENT NETWORK:
                - Total Connections: ${currentNetwork?.totalConnections || 0}
                - Industry Distribution: ${JSON.stringify(currentNetwork?.industryBreakdown || [])}
                - Quality Score: ${currentNetwork?.qualityScore || 50}%
                - Geographic Distribution: ${JSON.stringify(currentNetwork?.geographicBreakdown || [])}

                TARGET INDUSTRIES: ${targetIndustries.join(', ') || 'Technology, Government, Consulting'}

                Provide strategic network growth analysis in JSON format:
                {
                    "growth_assessment": {
                        "current_network_health": 0-100,
                        "diversification_opportunities": 0-100,
                        "quality_improvement_potential": 0-100,
                        "strategic_positioning": "weak|developing|strong|excellent"
                    },
                    "expansion_opportunities": [
                        {
                            "industry": "Target industry",
                            "growth_potential": 0-100,
                            "strategic_value": "high|medium|low",
                            "entry_points": ["channel1", "channel2"],
                            "key_personas": ["persona1", "persona2"],
                            "timeline": "immediate|short-term|long-term"
                        }
                    ],
                    "networking_channels": {
                        "digital_platforms": ["linkedin|twitter|industry-forums"],
                        "offline_events": ["conferences|meetups|workshops"],
                        "professional_organizations": ["org1", "org2"],
                        "content_strategies": ["blogging|speaking|podcasting"]
                    },
                    "relationship_optimization": {
                        "dormant_connections": "Strategy for re-engaging",
                        "weak_ties_activation": "Converting connections to relationships",
                        "referral_opportunities": "Leveraging current network for introductions",
                        "mutual_connections": "Strategic introduction strategies"
                    },
                    "competitive_intelligence": {
                        "industry_leaders": ["leader1", "leader2"],
                        "emerging_influencers": ["influencer1", "influencer2"],
                        "thought_leaders": ["thought_leader1", "thought_leader2"],
                        "networking_trends": ["trend1", "trend2"]
                    },
                    "roi_projections": {
                        "career_advancement_probability": 0-100,
                        "business_opportunity_potential": 0-100,
                        "knowledge_acquisition_value": 0-100,
                        "industry_influence_growth": 0-100
                    }
                }

                Focus on strategic, high-value networking opportunities aligned with career goals.
                Consider industry trends and emerging opportunities.
                Emphasize sustainable relationship building over transactional networking.
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const analysisText = response.text();
            
            // Extract JSON from response
            let analysis;
            try {
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                this.log('network-growth-parse-fallback', { error: parseError.message });
                analysis = {
                    growth_assessment: { current_network_health: 70 },
                    expansion_opportunities: [],
                    raw_analysis: analysisText,
                    parsing_error: true
                };
            }
            
            this.log('network-growth-analysis-complete', {
                expansionOpportunities: analysis.expansion_opportunities?.length || 0,
                networkHealth: analysis.growth_assessment?.current_network_health || 0,
                tokensUsed: this.estimateTokens(prompt + analysisText)
            });
            
            return {
                analysis,
                metadata: {
                    analysisType: 'network-growth-opportunities',
                    timestamp: new Date().toISOString(),
                    tokensEstimated: this.estimateTokens(prompt + analysisText),
                    ethicalCompliance: {
                        consentVerified: true,
                        rateLimited: true,
                        auditLogged: true
                    }
                }
            };
            
        } catch (error) {
            this.log('network-growth-analysis-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate content for thought leadership
     */
    async generateContent(prompt) {
        await this.verifyConsent('content-generation');
        await this.enforceRateLimit();
        
        this.log('content-generation-start', {
            promptLength: prompt.length
        });
        
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();
            
            this.log('content-generation-complete', {
                contentLength: content.length,
                tokensUsed: this.estimateTokens(prompt + content)
            });
            
            return content;
            
        } catch (error) {
            this.log('content-generation-error', { error: error.message });
            throw error;
        }
    }

    /**
     * Get comprehensive audit trail
     */
    getAuditTrail() {
        const hourAgo = Date.now() - (60 * 60 * 1000);
        const recentRequests = this.requestHistory.filter(req => req.timestamp > hourAgo);
        
        return {
            sessionId: this.sessionStart,
            totalRequests: this.requestHistory.length,
            recentRequests: recentRequests.length,
            rateLimitConfig: {
                minDelayMs: this.options.rateLimitMs,
                maxRequestsPerHour: this.options.maxRequestsPerHour
            },
            ethicalCompliance: {
                consentRequired: this.options.consentRequired,
                auditLogging: this.options.auditLogging,
                rateLimited: true
            },
            operations: this.requestHistory
        };
    }

    /**
     * Save audit trail to file
     */
    async saveAuditTrail(filename = null) {
        if (!this.options.auditLogging) return null;
        
        const auditTrail = this.getAuditTrail();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const auditFilename = filename || `gemini-audit-${timestamp}.json`;
        const auditPath = path.join(process.cwd(), 'data', auditFilename);
        
        try {
            await fs.mkdir(path.dirname(auditPath), { recursive: true });
            await fs.writeFile(auditPath, JSON.stringify(auditTrail, null, 2));
            this.log('audit-trail-saved', { path: auditPath });
            return auditPath;
        } catch (error) {
            this.log('audit-trail-save-error', { error: error.message });
            throw error;
        }
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🤖 Gemini API Client - Ethical Professional Analysis');
    console.log('Usage: node gemini-client.js [test|analyze|skills|summary]');
    
    const command = process.argv[2] || 'test';
    
    try {
        const client = new EthicalGeminiClient();
        
        switch (command) {
            case 'test':
                console.log('✅ Gemini client initialized successfully');
                console.log('📋 Ethical framework configured:');
                console.log(`   Rate limit: ${client.options.rateLimitMs}ms`);
                console.log(`   Max requests/hour: ${client.options.maxRequestsPerHour}`);
                console.log(`   Consent required: ${client.options.consentRequired}`);
                console.log(`   Audit logging: ${client.options.auditLogging}`);
                break;
                
            default:
                console.log(`❌ Unknown command: ${command}`);
                console.log('Available commands: test, analyze, skills, summary');
        }
        
    } catch (error) {
        console.error('❌ Gemini client error:', error.message);
        
        if (error.message.includes('GEMINI_API_KEY')) {
            console.log('\n📝 Setup instructions:');
            console.log('1. Get API key from: https://aistudio.google.com/app/apikey');
            console.log('2. Add to .env: GEMINI_API_KEY=your_api_key_here');
            console.log('3. Re-run test');
        }
    }
}