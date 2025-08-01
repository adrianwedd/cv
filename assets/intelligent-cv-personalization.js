/**
 * Intelligent CV Personalization Engine
 * 
 * Advanced AI-powered system for dynamic CV adaptation based on job descriptions,
 * industry analysis, and skills gap assessment. Provides intelligent recommendations
 * and real-time content optimization for maximum job matching effectiveness.
 * 
 * Features:
 * - Job description analysis and requirement extraction
 * - Dynamic CV content adaptation and optimization
 * - Skills gap analysis with learning pathway recommendations
 * - Industry-specific customization and formatting
 * - Real-time compatibility scoring and improvement suggestions
 */

class IntelligentCVPersonalization {
    constructor() {
        this.cvData = null;
        this.jobAnalysis = null;
        this.personalizationHistory = new Map();
        this.skillsDatabase = new Map();
        this.industryProfiles = new Map();
        this.isInitialized = false;
        
        // AI analysis configuration
        this.analysisConfig = {
            confidenceThreshold: 0.7,
            maxSuggestions: 10,
            adaptationStrength: 0.8,
            industryWeights: {
                'tech': { technical: 0.8, leadership: 0.6, innovation: 0.9 },
                'finance': { analytical: 0.9, compliance: 0.8, leadership: 0.7 },
                'healthcare': { empathy: 0.9, precision: 0.8, teamwork: 0.7 },
                'consulting': { communication: 0.9, analytical: 0.8, adaptability: 0.8 }
            }
        };
        
        this.init();
    }

    /**
     * Initialize the personalization engine
     */
    async init() {
        console.log('🧠 Initializing Intelligent CV Personalization Engine...');
        
        try {
            await this.loadCVData();
            await this.loadSkillsDatabase();
            await this.loadIndustryProfiles();
            this.setupPersonalizationInterface();
            
            this.isInitialized = true;
            console.log('✅ Intelligent CV Personalization Engine initialized successfully');
            
        } catch (error) {
            console.error('❌ Personalization Engine initialization failed:', error);
        }
    }

    /**
     * Load base CV data
     */
    async loadCVData() {
        try {
            const response = await fetch('data/base-cv.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.cvData = await response.json();
            console.log('📄 CV data loaded for personalization');
            
        } catch (error) {
            console.error('Error loading CV data:', error);
            throw error;
        }
    }

    /**
     * Load comprehensive skills database with market data
     */
    async loadSkillsDatabase() {
        // This would typically load from an external API or comprehensive database
        // For now, we'll use a rich internal database
        const skillsData = {
            'Python': {
                category: 'Programming Languages',
                marketDemand: 95,
                salaryImpact: 'high',
                industries: ['tech', 'finance', 'healthcare', 'research'],
                complementarySkills: ['Machine Learning', 'Django', 'FastAPI', 'Data Science'],
                certifications: ['Python Institute PCAP', 'Google Cloud Professional Data Engineer'],
                learningPath: ['Basic Syntax', 'Object-Oriented Programming', 'Web Frameworks', 'Data Science Libraries']
            },
            'Machine Learning': {
                category: 'AI & Data Science',
                marketDemand: 98,
                salaryImpact: 'very high',
                industries: ['tech', 'finance', 'healthcare', 'automotive'],
                complementarySkills: ['Python', 'TensorFlow', 'PyTorch', 'Statistics'],
                certifications: ['AWS Machine Learning Specialty', 'Google Cloud ML Engineer'],
                learningPath: ['Statistics Fundamentals', 'Supervised Learning', 'Deep Learning', 'MLOps']
            },
            'React': {
                category: 'Frontend Development',
                marketDemand: 90,
                salaryImpact: 'high',
                industries: ['tech', 'media', 'e-commerce', 'consulting'],
                complementarySkills: ['JavaScript', 'TypeScript', 'Redux', 'Node.js'],
                certifications: ['Meta Front-End Developer', 'React Developer Certification'],
                learningPath: ['JavaScript Fundamentals', 'React Basics', 'State Management', 'Testing']
            }
            // Extended database would include hundreds of skills
        };

        for (const [skill, data] of Object.entries(skillsData)) {
            this.skillsDatabase.set(skill, data);
        }
        
        console.log('🎯 Skills database loaded with market intelligence');
    }

    /**
     * Load industry-specific profiles and requirements
     */
    async loadIndustryProfiles() {
        const industryData = {
            'technology': {
                keySkills: ['Python', 'JavaScript', 'Machine Learning', 'Cloud Computing', 'DevOps'],
                preferredFormats: ['modern', 'technical'],
                contentEmphasis: ['technical achievements', 'innovation', 'scalability'],
                culturalValues: ['innovation', 'collaboration', 'continuous learning'],
                commonRoles: ['Software Engineer', 'Data Scientist', 'DevOps Engineer', 'Product Manager']
            },
            'finance': {
                keySkills: ['Python', 'R', 'SQL', 'Risk Management', 'Financial Modeling'],
                preferredFormats: ['professional', 'conservative'],
                contentEmphasis: ['quantitative results', 'compliance', 'risk mitigation'],
                culturalValues: ['precision', 'reliability', 'analytical thinking'],
                commonRoles: ['Quantitative Analyst', 'Risk Manager', 'Financial Engineer', 'Data Analyst']
            },
            'healthcare': {
                keySkills: ['Data Analysis', 'Healthcare Informatics', 'Compliance', 'Patient Care Systems'],
                preferredFormats: ['professional', 'detailed'],
                contentEmphasis: ['patient outcomes', 'regulatory compliance', 'system reliability'],
                culturalValues: ['empathy', 'precision', 'continuous improvement'],
                commonRoles: ['Health Informatics Specialist', 'Clinical Data Manager', 'Healthcare Analyst']
            }
        };

        for (const [industry, profile] of Object.entries(industryData)) {
            this.industryProfiles.set(industry, profile);
        }
        
        console.log('🏢 Industry profiles loaded with cultural intelligence');
    }

    /**
     * Analyze job description and extract requirements
     */
    async analyzeJobDescription(jobDescription) {
        console.log('🔍 Analyzing job description for personalization opportunities...');
        
        const analysis = {
            extractedSkills: this.extractSkills(jobDescription),
            industryClassification: this.classifyIndustry(jobDescription),
            seniorityLevel: this.determineSeniorityLevel(jobDescription),
            companySize: this.estimateCompanySize(jobDescription),
            culturalIndicators: this.analyzeCulturalFit(jobDescription),
            compensationIndicators: this.analyzeCompensationLevel(jobDescription),
            requiredExperience: this.extractExperienceRequirements(jobDescription),
            preferredQualifications: this.extractPreferredQualifications(jobDescription)
        };

        // Calculate overall compatibility score
        analysis.compatibilityScore = this.calculateCompatibilityScore(analysis);
        
        // Generate personalization recommendations
        analysis.recommendations = this.generatePersonalizationRecommendations(analysis);
        
        this.jobAnalysis = analysis;
        console.log('✅ Job analysis completed:', analysis);
        
        return analysis;
    }

    /**
     * Extract skills from job description using NLP techniques
     */
    extractSkills(jobDescription) {
        const text = jobDescription.toLowerCase();
        const extractedSkills = [];
        
        // Check against our skills database
        for (const [skill, data] of this.skillsDatabase) {
            const skillLower = skill.toLowerCase();
            const variations = this.generateSkillVariations(skillLower);
            
            for (const variation of variations) {
                if (text.includes(variation)) {
                    extractedSkills.push({
                        skill: skill,
                        confidence: this.calculateSkillConfidence(text, variation),
                        context: this.extractSkillContext(text, variation),
                        marketData: data
                    });
                    break;
                }
            }
        }
        
        // Sort by confidence and remove duplicates
        return extractedSkills
            .filter((item, index, self) => 
                index === self.findIndex(s => s.skill === item.skill))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 20); // Top 20 skills
    }

    /**
     * Generate skill variations for better matching
     */
    generateSkillVariations(skill) {
        const variations = [skill];
        
        // Add common variations
        const skillMap = {
            'javascript': ['js', 'ecmascript', 'node.js', 'nodejs'],
            'python': ['py', 'python3'],
            'machine learning': ['ml', 'artificial intelligence', 'ai', 'deep learning'],
            'react': ['reactjs', 'react.js'],
            'docker': ['containerization', 'containers'],
            'kubernetes': ['k8s', 'container orchestration']
        };
        
        if (skillMap[skill]) {
            variations.push(...skillMap[skill]);
        }
        
        return variations;
    }

    /**
     * Classify industry based on job description content
     */
    classifyIndustry(jobDescription) {
        const text = jobDescription.toLowerCase();
        const industryKeywords = {
            'technology': ['software', 'tech', 'engineering', 'development', 'programming', 'cloud', 'api'],
            'finance': ['financial', 'banking', 'investment', 'trading', 'risk', 'fintech', 'capital'],
            'healthcare': ['health', 'medical', 'patient', 'clinical', 'hospital', 'healthcare', 'pharma'],
            'consulting': ['consulting', 'advisory', 'strategy', 'transformation', 'client', 'engagement']
        };
        
        const scores = {};
        for (const [industry, keywords] of Object.entries(industryKeywords)) {
            scores[industry] = keywords.reduce((score, keyword) => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = text.match(regex) || [];
                return score + matches.length;
            }, 0);
        }
        
        const topIndustry = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)[0];
        
        return {
            primary: topIndustry[0],
            confidence: Math.min(topIndustry[1] / 5, 1), // Normalize to 0-1
            allScores: scores
        };
    }

    /**
     * Determine seniority level from job description
     */
    determineSeniorityLevel(jobDescription) {
        const text = jobDescription.toLowerCase();
        
        const seniorityIndicators = {
            'junior': ['junior', 'entry level', 'graduate', '0-2 years', 'associate'],
            'mid': ['mid level', '2-5 years', 'experienced', 'specialist'],
            'senior': ['senior', '5+ years', 'lead', 'expert', 'principal'],
            'executive': ['director', 'vp', 'chief', 'head of', 'executive', 'c-level']
        };
        
        const scores = {};
        for (const [level, indicators] of Object.entries(seniorityIndicators)) {
            scores[level] = indicators.reduce((score, indicator) => {
                return score + (text.includes(indicator) ? 1 : 0);
            }, 0);
        }
        
        const topLevel = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)[0];
        
        return {
            level: topLevel[0],
            confidence: Math.min(topLevel[1] / 3, 1),
            allScores: scores
        };
    }

    /**
     * Generate personalized CV adaptation recommendations
     */
    generatePersonalizationRecommendations(analysis) {
        const recommendations = [];
        
        // Skills-based recommendations
        const skillsRecs = this.generateSkillsRecommendations(analysis);
        recommendations.push(...skillsRecs);
        
        // Industry-specific recommendations
        const industryRecs = this.generateIndustryRecommendations(analysis);
        recommendations.push(...industryRecs);
        
        // Experience-level recommendations
        const experienceRecs = this.generateExperienceRecommendations(analysis);
        recommendations.push(...experienceRecs);
        
        // Cultural fit recommendations
        const culturalRecs = this.generateCulturalRecommendations(analysis);
        recommendations.push(...culturalRecs);
        
        return recommendations
            .sort((a, b) => b.impact - a.impact)
            .slice(0, this.analysisConfig.maxSuggestions);
    }

    /**
     * Generate skills-based recommendations
     */
    generateSkillsRecommendations(analysis) {
        const recommendations = [];
        const mySkills = new Set(this.cvData.skills?.map(s => s.name) || []);
        
        // Find missing high-impact skills
        const missingSkills = analysis.extractedSkills
            .filter(skill => !mySkills.has(skill.skill))
            .slice(0, 5);
        
        for (const skillData of missingSkills) {
            recommendations.push({
                type: 'skill_gap',
                priority: 'high',
                impact: skillData.confidence * skillData.marketData.marketDemand / 100,
                title: `Add ${skillData.skill} to your skills`,
                description: `This role requires ${skillData.skill}. Consider highlighting related experience or adding this through learning.`,
                action: 'skill_addition',
                data: skillData,
                learningPath: skillData.marketData.learningPath
            });
        }
        
        // Find skills to emphasize
        const skillsToEmphasize = analysis.extractedSkills
            .filter(skill => mySkills.has(skill.skill))
            .slice(0, 3);
        
        for (const skillData of skillsToEmphasize) {
            recommendations.push({
                type: 'skill_emphasis',
                priority: 'medium',
                impact: skillData.confidence * 0.7,
                title: `Emphasize ${skillData.skill} experience`,
                description: `Your ${skillData.skill} experience is highly relevant. Consider moving related projects to the top.`,
                action: 'content_reorder',
                data: skillData
            });
        }
        
        return recommendations;
    }

    /**
     * Generate industry-specific recommendations
     */
    generateIndustryRecommendations(analysis) {
        const recommendations = [];
        const industryProfile = this.industryProfiles.get(analysis.industryClassification.primary);
        
        if (!industryProfile) return recommendations;
        
        // Format recommendations
        const currentFormat = 'modern'; // This would be detected from current CV
        if (!industryProfile.preferredFormats.includes(currentFormat)) {
            recommendations.push({
                type: 'format_adaptation',
                priority: 'medium',
                impact: 0.6,
                title: `Adapt CV format for ${analysis.industryClassification.primary} industry`,
                description: `Consider using a ${industryProfile.preferredFormats[0]} format for better industry alignment.`,
                action: 'format_change',
                data: { targetFormat: industryProfile.preferredFormats[0] }
            });
        }
        
        // Content emphasis recommendations
        for (const emphasis of industryProfile.contentEmphasis) {
            recommendations.push({
                type: 'content_emphasis',
                priority: 'medium',
                impact: 0.5,
                title: `Highlight ${emphasis}`,
                description: `The ${analysis.industryClassification.primary} industry values ${emphasis}. Ensure your CV prominently features relevant examples.`,
                action: 'content_restructure',
                data: { emphasis: emphasis }
            });
        }
        
        return recommendations;
    }

    /**
     * Create personalized CV version
     */
    async createPersonalizedCV(jobAnalysis, recommendations) {
        console.log('🎨 Creating personalized CV version...');
        
        const personalizedCV = JSON.parse(JSON.stringify(this.cvData)); // Deep clone
        
        // Apply skill emphasis recommendations
        const skillRecommendations = recommendations.filter(r => r.type === 'skill_emphasis');
        personalizedCV.skills = this.reorderSkillsByRelevance(personalizedCV.skills, skillRecommendations);
        
        // Apply experience reordering
        personalizedCV.experience = this.reorderExperienceByRelevance(personalizedCV.experience, jobAnalysis);
        
        // Apply project reordering
        personalizedCV.projects = this.reorderProjectsByRelevance(personalizedCV.projects, jobAnalysis);
        
        // Adapt professional summary
        personalizedCV.professional_summary = this.adaptProfessionalSummary(
            personalizedCV.professional_summary, 
            jobAnalysis, 
            recommendations
        );
        
        // Add personalization metadata
        personalizedCV.personalization = {
            jobAnalysis: jobAnalysis,
            recommendations: recommendations,
            createdAt: new Date().toISOString(),
            compatibilityScore: jobAnalysis.compatibilityScore,
            version: 'personalized'
        };
        
        console.log('✅ Personalized CV created with compatibility score:', jobAnalysis.compatibilityScore);
        return personalizedCV;
    }

    /**
     * Setup personalization interface
     */
    setupPersonalizationInterface() {
        // Create floating personalization toggle
        const toggleButton = document.createElement('button');
        toggleButton.id = 'personalization-toggle';
        toggleButton.className = 'personalization-toggle';
        toggleButton.innerHTML = '🎯';
        toggleButton.title = 'AI CV Personalization';
        toggleButton.setAttribute('aria-label', 'Open CV personalization tool');
        
        document.body.appendChild(toggleButton);
        
        // Setup event listeners
        toggleButton.addEventListener('click', () => this.openPersonalizationModal());
        
        // Setup keyboard shortcut (Ctrl/Cmd + P)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p' && e.shiftKey) {
                e.preventDefault();
                this.openPersonalizationModal();
            }
        });
    }

    /**
     * Open personalization modal interface
     */
    openPersonalizationModal() {
        const modalHTML = `
            <div class="personalization-modal" id="personalization-modal">
                <div class="personalization-backdrop"></div>
                <div class="personalization-content">
                    <div class="personalization-header">
                        <h2 class="personalization-title">🎯 AI CV Personalization</h2>
                        <button class="personalization-close" aria-label="Close">×</button>
                    </div>
                    
                    <div class="personalization-body">
                        <!-- Job Description Input -->
                        <div class="personalization-section">
                            <h3 class="section-title">Job Description Analysis</h3>
                            <div class="input-group">
                                <textarea 
                                    id="job-description-input" 
                                    class="job-description-textarea"
                                    placeholder="Paste the job description here for AI-powered CV personalization..."
                                    rows="8"
                                ></textarea>
                                <div class="input-actions">
                                    <button id="analyze-job-btn" class="analyze-btn">
                                        <span class="btn-icon">🧠</span>
                                        <span class="btn-text">Analyze & Personalize</span>
                                    </button>
                                    <button id="clear-job-btn" class="clear-btn">Clear</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Analysis Results -->
                        <div class="analysis-results" id="analysis-results" style="display: none;">
                            <div class="personalization-section">
                                <h3 class="section-title">Analysis Results</h3>
                                <div class="results-grid" id="results-grid">
                                    <!-- Results will be populated here -->
                                </div>
                            </div>
                            
                            <!-- Recommendations -->
                            <div class="personalization-section">
                                <h3 class="section-title">Personalization Recommendations</h3>
                                <div class="recommendations-list" id="recommendations-list">
                                    <!-- Recommendations will be populated here -->
                                </div>
                            </div>
                            
                            <!-- Actions -->
                            <div class="personalization-actions">
                                <button id="apply-personalization-btn" class="apply-btn">
                                    <span class="btn-icon">✨</span>
                                    <span class="btn-text">Apply Personalization</span>
                                </button>
                                <button id="preview-personalized-btn" class="preview-btn">
                                    <span class="btn-icon">👀</span>
                                    <span class="btn-text">Preview Changes</span>
                                </button>
                                <button id="export-personalized-btn" class="export-btn">
                                    <span class="btn-icon">📄</span>
                                    <span class="btn-text">Export Personalized CV</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup modal event listeners
        this.setupModalEventListeners();
        
        // Show modal with animation
        requestAnimationFrame(() => {
            const modal = document.getElementById('personalization-modal');
            modal.classList.add('visible');
        });
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Setup modal event listeners
     */
    setupModalEventListeners() {
        const modal = document.getElementById('personalization-modal');
        const closeBtn = modal.querySelector('.personalization-close');
        const backdrop = modal.querySelector('.personalization-backdrop');
        const analyzeBtn = document.getElementById('analyze-job-btn');
        const clearBtn = document.getElementById('clear-job-btn');
        
        // Close modal events
        closeBtn.addEventListener('click', () => this.closePersonalizationModal());
        backdrop.addEventListener('click', () => this.closePersonalizationModal());
        
        // Job analysis events
        analyzeBtn.addEventListener('click', () => this.handleJobAnalysis());
        clearBtn.addEventListener('click', () => this.clearJobDescription());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePersonalizationModal();
            }
        });
    }

    /**
     * Handle job description analysis
     */
    async handleJobAnalysis() {
        const textarea = document.getElementById('job-description-input');
        const analyzeBtn = document.getElementById('analyze-job-btn');
        const resultsSection = document.getElementById('analysis-results');
        
        const jobDescription = textarea.value.trim();
        if (!jobDescription) {
            this.showToast('Please enter a job description to analyze', 'warning');
            return;
        }
        
        // Show loading state
        analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Analyzing...</span>';
        analyzeBtn.disabled = true;
        
        try {
            // Perform analysis
            const analysis = await this.analyzeJobDescription(jobDescription);
            
            // Display results
            this.displayAnalysisResults(analysis);
            this.displayRecommendations(analysis.recommendations);
            
            // Show results section
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
            
            this.showToast('Job analysis completed successfully!', 'success');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showToast('Analysis failed. Please try again.', 'error');
        } finally {
            // Reset button
            analyzeBtn.innerHTML = '<span class="btn-icon">🧠</span><span class="btn-text">Analyze & Personalize</span>';
            analyzeBtn.disabled = false;
        }
    }

    /**
     * Display analysis results in the modal
     */
    displayAnalysisResults(analysis) {
        const resultsGrid = document.getElementById('results-grid');
        
        resultsGrid.innerHTML = `
            <div class="result-card">
                <div class="result-icon">🎯</div>
                <div class="result-content">
                    <div class="result-label">Compatibility Score</div>
                    <div class="result-value">${Math.round(analysis.compatibilityScore * 100)}%</div>
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-icon">🏢</div>
                <div class="result-content">
                    <div class="result-label">Industry</div>
                    <div class="result-value">${analysis.industryClassification.primary}</div>
                    <div class="result-confidence">${Math.round(analysis.industryClassification.confidence * 100)}% confidence</div>
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-icon">📊</div>
                <div class="result-content">
                    <div class="result-label">Seniority Level</div>
                    <div class="result-value">${analysis.seniorityLevel.level}</div>
                    <div class="result-confidence">${Math.round(analysis.seniorityLevel.confidence * 100)}% confidence</div>
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-icon">🛠️</div>
                <div class="result-content">
                    <div class="result-label">Key Skills Found</div>
                    <div class="result-value">${analysis.extractedSkills.length}</div>
                    <div class="result-detail">Top: ${analysis.extractedSkills.slice(0, 3).map(s => s.skill).join(', ')}</div>
                </div>
            </div>
        `;
    }

    /**
     * Display personalization recommendations
     */
    displayRecommendations(recommendations) {
        const recommendationsList = document.getElementById('recommendations-list');
        
        const recommendationsHTML = recommendations.map(rec => `
            <div class="recommendation-item" data-type="${rec.type}" data-priority="${rec.priority}">
                <div class="recommendation-header">
                    <div class="recommendation-priority priority-${rec.priority}"></div>
                    <h4 class="recommendation-title">${rec.title}</h4>
                    <div class="recommendation-impact">Impact: ${Math.round(rec.impact * 100)}%</div>
                </div>
                <div class="recommendation-description">${rec.description}</div>
                ${rec.learningPath ? `
                    <div class="recommendation-learning">
                        <strong>Learning Path:</strong> ${rec.learningPath.join(' → ')}
                    </div>
                ` : ''}
                <div class="recommendation-actions">
                    <button class="apply-rec-btn" data-action="${rec.action}">Apply</button>
                    <button class="learn-more-btn" data-skill="${rec.data?.skill || ''}">Learn More</button>
                </div>
            </div>
        `).join('');
        
        recommendationsList.innerHTML = recommendationsHTML;
        
        // Setup recommendation action listeners
        this.setupRecommendationActions();
    }

    /**
     * Setup recommendation action event listeners
     */
    setupRecommendationActions() {
        const applyButtons = document.querySelectorAll('.apply-rec-btn');
        const learnMoreButtons = document.querySelectorAll('.learn-more-btn');
        
        applyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleRecommendationAction(action, e.target.closest('.recommendation-item'));
            });
        });
        
        learnMoreButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skill = e.target.dataset.skill;
                if (skill) this.showSkillLearningPath(skill);
            });
        });
    }

    /**
     * Utility methods
     */
    calculateSkillConfidence(text, skill) {
        const occurrences = (text.match(new RegExp(skill, 'gi')) || []).length;
        const contextBonus = text.includes('required') || text.includes('must have') ? 0.3 : 0;
        return Math.min(0.4 + (occurrences * 0.2) + contextBonus, 1);
    }

    extractSkillContext(text, skill) {
        const index = text.indexOf(skill);
        if (index === -1) return '';
        
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + skill.length + 30);
        return text.substring(start, end);
    }

    calculateCompatibilityScore(analysis) {
        const skillMatch = Math.min(analysis.extractedSkills.length / 10, 1) * 0.4;
        const industryMatch = analysis.industryClassification.confidence * 0.3;
        const seniorityMatch = analysis.seniorityLevel.confidence * 0.3;
        
        return skillMatch + industryMatch + seniorityMatch;
    }

    closePersonalizationModal() {
        const modal = document.getElementById('personalization-modal');
        modal.classList.remove('visible');
        
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `personalization-toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('visible');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Additional helper methods would be implemented here...
    reorderSkillsByRelevance(skills, recommendations) { return skills; }
    reorderExperienceByRelevance(experience, analysis) { return experience; }
    reorderProjectsByRelevance(projects, analysis) { return projects; }
    adaptProfessionalSummary(summary, analysis, recommendations) { return summary; }
    generateExperienceRecommendations(analysis) { return []; }
    generateCulturalRecommendations(analysis) { return []; }
    estimateCompanySize(jobDescription) { return 'medium'; }
    analyzeCulturalFit(jobDescription) { return {}; }
    analyzeCompensationLevel(jobDescription) { return {}; }
    extractExperienceRequirements(jobDescription) { return []; }
    extractPreferredQualifications(jobDescription) { return []; }
    handleRecommendationAction(action, element) { console.log('Action:', action); }
    showSkillLearningPath(skill) { console.log('Learning path for:', skill); }
    clearJobDescription() { document.getElementById('job-description-input').value = ''; }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.intelligentPersonalization = new IntelligentCVPersonalization();
    });
} else {
    window.intelligentPersonalization = new IntelligentCVPersonalization();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntelligentCVPersonalization;
}