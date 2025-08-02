/**
 * ATS Analyzer - Advanced ATS Compatibility Analysis
 * Provides real-time scoring, keyword analysis, and optimization recommendations
 */

class ATSAnalyzer {
    constructor() {
        // Comprehensive ATS keyword database organized by category
        this.keywordDatabase = {
            technical_skills: [
                'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
                'React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
                'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
                'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions',
                'AWS', 'Azure', 'Google Cloud', 'Terraform', 'Ansible'
            ],
            ai_ml: [
                'Machine Learning', 'Deep Learning', 'Neural Networks', 'AI', 'Artificial Intelligence',
                'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy',
                'Natural Language Processing', 'NLP', 'Computer Vision', 'OpenCV',
                'Data Science', 'Data Analysis', 'Statistics', 'MLOps', 'Model Training',
                'Feature Engineering', 'Hyperparameter Tuning', 'Cross-validation'
            ],
            soft_skills: [
                'Leadership', 'Project Management', 'Team Collaboration', 'Communication',
                'Problem Solving', 'Critical Thinking', 'Mentoring', 'Strategic Planning',
                'Innovation', 'Creativity', 'Adaptability', 'Time Management',
                'Stakeholder Management', 'Cross-functional', 'Agile', 'Scrum'
            ],
            methodologies: [
                'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'Test-Driven Development',
                'Microservices', 'RESTful APIs', 'GraphQL', 'Event-Driven Architecture',
                'Domain-Driven Design', 'Clean Architecture', 'SOLID Principles'
            ],
            certifications: [
                'AWS Certified', 'Azure Certified', 'Google Cloud Certified',
                'PMP', 'Scrum Master', 'Product Owner', 'CISSP', 'CompTIA'
            ],
            industries: [
                'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'Enterprise',
                'Startup', 'Healthcare', 'Finance', 'Banking', 'Insurance', 'Retail'
            ]
        };

        // ATS parsing patterns and weights
        this.atsWeights = {
            keyword_density: 0.30,
            section_structure: 0.25,
            format_compatibility: 0.20,
            content_quality: 0.15,
            completeness: 0.10
        };

        // Common ATS parsing issues
        this.parsingIssues = [
            'special_characters',
            'complex_formatting',
            'images_graphics',
            'tables',
            'columns',
            'headers_footers',
            'unusual_fonts'
        ];
    }

    /**
     * Perform comprehensive ATS analysis
     */
    analyzeCV(cvData, format = 'ats-text') {
        const analysis = {
            overall_score: 0,
            category_scores: {},
            keyword_analysis: {},
            recommendations: [],
            format_compatibility: {},
            parsing_warnings: [],
            optimization_suggestions: []
        };

        try {
            // Extract text content for analysis
            const textContent = this.extractTextContent(cvData);
            
            // Analyze each scoring category
            analysis.category_scores.keyword_density = this.analyzeKeywordDensity(textContent);
            analysis.category_scores.section_structure = this.analyzeSectionStructure(cvData);
            analysis.category_scores.format_compatibility = this.analyzeFormatCompatibility(format);
            analysis.category_scores.content_quality = this.analyzeContentQuality(cvData, textContent);
            analysis.category_scores.completeness = this.analyzeCompleteness(cvData);

            // Calculate overall score
            analysis.overall_score = this.calculateOverallScore(analysis.category_scores);

            // Detailed keyword analysis
            analysis.keyword_analysis = this.performKeywordAnalysis(textContent);

            // Generate recommendations
            analysis.recommendations = this.generateRecommendations(analysis);

            // Format-specific compatibility
            analysis.format_compatibility = this.assessFormatCompatibility(format, cvData);

            // Identify parsing warnings
            analysis.parsing_warnings = this.identifyParsingWarnings(cvData, format);

            // Generate optimization suggestions
            analysis.optimization_suggestions = this.generateOptimizationSuggestions(analysis);

        } catch (error) {
            console.error('ATS Analysis failed:', error);
            analysis.error = error.message;
        }

        return analysis;
    }

    /**
     * Extract text content from CV data
     */
    extractTextContent(cvData) {
        let content = '';
        
        // Personal info
        if (cvData.personal_info) {
            content += `${cvData.personal_info.name} ${cvData.personal_info.title} `;
        }

        // Professional summary
        if (cvData.professional_summary) {
            content += cvData.professional_summary + ' ';
        }

        // Experience
        if (cvData.experience) {
            cvData.experience.forEach(exp => {
                content += `${exp.position} ${exp.company} ${exp.description || ''} `;
                if (exp.achievements) {
                    content += exp.achievements.join(' ') + ' ';
                }
                if (exp.technologies) {
                    content += exp.technologies.join(' ') + ' ';
                }
            });
        }

        // Skills
        if (cvData.skills) {
            cvData.skills.forEach(skill => {
                content += `${skill.name} ${skill.description || ''} `;
            });
        }

        // Projects
        if (cvData.projects) {
            cvData.projects.forEach(project => {
                content += `${project.name} ${project.description} `;
                if (project.technologies) {
                    content += project.technologies.join(' ') + ' ';
                }
            });
        }

        // Education
        if (cvData.education) {
            cvData.education.forEach(edu => {
                content += `${edu.degree} ${edu.institution} `;
                if (edu.key_areas) {
                    content += edu.key_areas.join(' ') + ' ';
                }
            });
        }

        return content.toLowerCase();
    }

    /**
     * Analyze keyword density and relevance
     */
    analyzeKeywordDensity(textContent) {
        const words = textContent.split(/\s+/).filter(word => word.length > 2);
        const totalWords = words.length;
        let matchedKeywords = [];
        let categoryMatches = {};

        // Initialize category matches
        Object.keys(this.keywordDatabase).forEach(category => {
            categoryMatches[category] = [];
        });

        // Find keyword matches
        Object.entries(this.keywordDatabase).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                const keywordPattern = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
                const matches = textContent.match(keywordPattern);
                if (matches) {
                    matchedKeywords.push({
                        keyword: keyword,
                        category: category,
                        count: matches.length,
                        density: matches.length / totalWords
                    });
                    categoryMatches[category].push(keyword);
                }
            });
        });

        // Calculate density score
        const totalMatches = matchedKeywords.reduce((sum, kw) => sum + kw.count, 0);
        const overallDensity = totalMatches / totalWords;
        
        // Optimal density is 1.5-3%
        let densityScore;
        if (overallDensity < 0.015) {
            densityScore = (overallDensity / 0.015) * 60; // Low density
        } else if (overallDensity <= 0.03) {
            densityScore = 60 + ((overallDensity - 0.015) / 0.015) * 40; // Optimal range
        } else {
            densityScore = Math.max(100 - (overallDensity - 0.03) * 1000, 40); // Over-optimization penalty
        }

        return {
            score: Math.round(densityScore),
            total_keywords: matchedKeywords.length,
            total_matches: totalMatches,
            overall_density: overallDensity,
            category_matches: categoryMatches,
            top_keywords: matchedKeywords.sort((a, b) => b.count - a.count).slice(0, 20)
        };
    }

    /**
     * Analyze section structure for ATS compatibility
     */
    analyzeSectionStructure(cvData) {
        let score = 0;
        const maxScore = 100;
        const sections = [];

        // Required sections
        const requiredSections = [
            { key: 'personal_info', name: 'Contact Information', weight: 15 },
            { key: 'professional_summary', name: 'Professional Summary', weight: 10 },
            { key: 'experience', name: 'Work Experience', weight: 25 },
            { key: 'skills', name: 'Skills', weight: 15 },
            { key: 'education', name: 'Education', weight: 10 }
        ];

        // Optional but beneficial sections
        const optionalSections = [
            { key: 'projects', name: 'Projects', weight: 10 },
            { key: 'achievements', name: 'Achievements', weight: 8 },
            { key: 'certifications', name: 'Certifications', weight: 7 }
        ];

        // Check required sections
        requiredSections.forEach(section => {
            if (cvData[section.key] && this.hasContent(cvData[section.key])) {
                score += section.weight;
                sections.push({ name: section.name, status: 'present', critical: true });
            } else {
                sections.push({ name: section.name, status: 'missing', critical: true });
            }
        });

        // Check optional sections
        optionalSections.forEach(section => {
            if (cvData[section.key] && this.hasContent(cvData[section.key])) {
                score += section.weight;
                sections.push({ name: section.name, status: 'present', critical: false });
            } else {
                sections.push({ name: section.name, status: 'missing', critical: false });
            }
        });

        return {
            score: Math.min(score, maxScore),
            sections: sections,
            has_required: sections.filter(s => s.critical && s.status === 'present').length,
            missing_required: sections.filter(s => s.critical && s.status === 'missing').length
        };
    }

    /**
     * Analyze format compatibility with ATS systems
     */
    analyzeFormatCompatibility(format) {
        const formatScores = {
            'ats-text': { score: 100, compatibility: 'Excellent' },
            'docx': { score: 95, compatibility: 'Excellent' },
            'pdf': { score: 80, compatibility: 'Good' },
            'html': { score: 70, compatibility: 'Moderate' },
            'latex': { score: 60, compatibility: 'Limited' },
            'json': { score: 40, compatibility: 'Poor' }
        };

        const result = formatScores[format] || { score: 50, compatibility: 'Unknown' };
        
        return {
            score: result.score,
            compatibility: result.compatibility,
            format: format,
            recommendations: this.getFormatRecommendations(format)
        };
    }

    /**
     * Analyze content quality for ATS parsing
     */
    analyzeContentQuality(cvData, textContent) {
        let score = 0;
        const qualityFactors = [];

        // Check for quantified achievements
        const numbers = textContent.match(/\d+(\.\d+)?%?/g) || [];
        const quantifiedScore = Math.min(numbers.length * 5, 30);
        score += quantifiedScore;
        qualityFactors.push({
            factor: 'Quantified Achievements',
            score: quantifiedScore,
            found: numbers.length,
            max_score: 30
        });

        // Check for action verbs
        const actionVerbs = [
            'achieved', 'implemented', 'developed', 'created', 'managed', 'led',
            'designed', 'built', 'optimized', 'improved', 'increased', 'reduced',
            'delivered', 'established', 'launched', 'coordinated', 'executed'
        ];
        
        let actionVerbCount = 0;
        actionVerbs.forEach(verb => {
            if (textContent.includes(verb)) actionVerbCount++;
        });
        
        const actionVerbScore = Math.min(actionVerbCount * 3, 25);
        score += actionVerbScore;
        qualityFactors.push({
            factor: 'Action Verbs',
            score: actionVerbScore,
            found: actionVerbCount,
            max_score: 25
        });

        // Check for industry terminology
        const industryTerms = this.keywordDatabase.industries.filter(term => 
            textContent.includes(term.toLowerCase())
        );
        
        const industryScore = Math.min(industryTerms.length * 8, 20);
        score += industryScore;
        qualityFactors.push({
            factor: 'Industry Terminology',
            score: industryScore,
            found: industryTerms.length,
            max_score: 20
        });

        // Check content length and detail
        const wordCount = textContent.split(/\s+/).length;
        let lengthScore = 0;
        if (wordCount >= 300 && wordCount <= 800) {
            lengthScore = 25; // Optimal length
        } else if (wordCount >= 200 && wordCount < 300) {
            lengthScore = 15; // Too brief
        } else if (wordCount > 800 && wordCount <= 1200) {
            lengthScore = 20; // Slightly long but acceptable
        } else {
            lengthScore = 10; // Too short or too long
        }
        
        score += lengthScore;
        qualityFactors.push({
            factor: 'Content Length',
            score: lengthScore,
            word_count: wordCount,
            max_score: 25
        });

        return {
            score: Math.min(score, 100),
            quality_factors: qualityFactors,
            word_count: wordCount,
            action_verbs: actionVerbCount,
            quantified_achievements: numbers.length
        };
    }

    /**
     * Analyze CV completeness
     */
    analyzeCompleteness(cvData) {
        let score = 0;
        const completenessFactors = [];

        // Check experience detail
        if (cvData.experience && cvData.experience.length > 0) {
            const hasAchievements = cvData.experience.some(exp => 
                exp.achievements && exp.achievements.length > 0
            );
            const hasTechnologies = cvData.experience.some(exp => 
                exp.technologies && exp.technologies.length > 0
            );
            
            let expScore = 20; // Base score for having experience
            if (hasAchievements) expScore += 15;
            if (hasTechnologies) expScore += 10;
            
            score += expScore;
            completenessFactors.push({
                factor: 'Experience Detail',
                score: expScore,
                max_score: 45
            });
        }

        // Check skills comprehensiveness
        if (cvData.skills && cvData.skills.length >= 8) {
            const skillScore = Math.min(cvData.skills.length * 2, 20);
            score += skillScore;
            completenessFactors.push({
                factor: 'Skills Breadth',
                score: skillScore,
                count: cvData.skills.length,
                max_score: 20
            });
        }

        // Check for projects
        if (cvData.projects && cvData.projects.length > 0) {
            const projectScore = Math.min(cvData.projects.length * 8, 15);
            score += projectScore;
            completenessFactors.push({
                factor: 'Project Portfolio',
                score: projectScore,
                count: cvData.projects.length,
                max_score: 15
            });
        }

        // Check for certifications
        if (cvData.certifications && cvData.certifications.length > 0) {
            score += 10;
            completenessFactors.push({
                factor: 'Certifications',
                score: 10,
                count: cvData.certifications.length,
                max_score: 10
            });
        }

        // Check for achievements
        if (cvData.achievements && cvData.achievements.length > 0) {
            score += 10;
            completenessFactors.push({
                factor: 'Achievements',
                score: 10,
                count: cvData.achievements.length,
                max_score: 10
            });
        }

        return {
            score: Math.min(score, 100),
            completeness_factors: completenessFactors
        };
    }

    /**
     * Calculate overall ATS score
     */
    calculateOverallScore(categoryScores) {
        let weightedScore = 0;
        
        Object.entries(this.atsWeights).forEach(([category, weight]) => {
            const categoryScore = categoryScores[category]?.score || 0;
            weightedScore += categoryScore * weight;
        });

        return Math.round(weightedScore);
    }

    /**
     * Perform detailed keyword analysis
     */
    performKeywordAnalysis(textContent) {
        const analysis = {
            by_category: {},
            missing_opportunities: {},
            density_analysis: {},
            recommendations: []
        };

        // Analyze by category
        Object.entries(this.keywordDatabase).forEach(([category, keywords]) => {
            const found = [];
            const missing = [];
            
            keywords.forEach(keyword => {
                if (textContent.includes(keyword.toLowerCase())) {
                    const matches = textContent.match(new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g'));
                    found.push({
                        keyword: keyword,
                        frequency: matches ? matches.length : 0
                    });
                } else {
                    missing.push(keyword);
                }
            });

            analysis.by_category[category] = {
                found: found,
                missing: missing,
                coverage: found.length / keywords.length
            };
        });

        // Identify missing opportunities
        Object.entries(analysis.by_category).forEach(([category, data]) => {
            if (data.coverage < 0.3) { // Less than 30% coverage
                analysis.missing_opportunities[category] = data.missing.slice(0, 10);
            }
        });

        return analysis;
    }

    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Overall score recommendations
        if (analysis.overall_score < 70) {
            recommendations.push({
                type: 'critical',
                category: 'overall',
                title: 'Low ATS Compatibility',
                description: 'Your CV may struggle with ATS systems. Focus on keyword optimization and format compatibility.',
                action: 'Implement high-priority recommendations below'
            });
        }

        // Keyword density recommendations
        const keywordScore = analysis.category_scores.keyword_density?.score || 0;
        if (keywordScore < 60) {
            recommendations.push({
                type: 'high',
                category: 'keywords',
                title: 'Improve Keyword Density',
                description: 'Add more relevant industry keywords naturally throughout your CV.',
                action: 'Include 5-10 more technical skills and industry terms'
            });
        }

        // Section structure recommendations
        const structureScore = analysis.category_scores.section_structure?.score || 0;
        if (structureScore < 80) {
            recommendations.push({
                type: 'high',
                category: 'structure',
                title: 'Improve Section Structure',
                description: 'Ensure all critical sections are present and properly formatted.',
                action: 'Add missing sections and improve existing content'
            });
        }

        // Content quality recommendations
        const contentScore = analysis.category_scores.content_quality?.score || 0;
        if (contentScore < 70) {
            recommendations.push({
                type: 'medium',
                category: 'content',
                title: 'Enhance Content Quality',
                description: 'Add quantified achievements and action verbs to improve parsing.',
                action: 'Include specific metrics and results in experience descriptions'
            });
        }

        return recommendations;
    }

    /**
     * Assess format-specific compatibility
     */
    assessFormatCompatibility(format, cvData) {
        const compatibility = {
            parsing_reliability: 0,
            content_preservation: 0,
            formatting_risk: 0,
            recommendations: []
        };

        switch (format) {
            case 'ats-text':
                compatibility.parsing_reliability = 100;
                compatibility.content_preservation = 95;
                compatibility.formatting_risk = 5;
                break;
            case 'docx':
                compatibility.parsing_reliability = 95;
                compatibility.content_preservation = 90;
                compatibility.formatting_risk = 15;
                compatibility.recommendations.push('Avoid complex tables and graphics');
                break;
            case 'pdf':
                compatibility.parsing_reliability = 80;
                compatibility.content_preservation = 85;
                compatibility.formatting_risk = 30;
                compatibility.recommendations.push('Ensure text is selectable and not image-based');
                break;
            default:
                compatibility.parsing_reliability = 60;
                compatibility.content_preservation = 70;
                compatibility.formatting_risk = 50;
        }

        return compatibility;
    }

    /**
     * Identify potential parsing warnings
     */
    identifyParsingWarnings(cvData, format) {
        const warnings = [];

        // Check for special characters
        const textContent = this.extractTextContent(cvData);
        if (/[^\w\s\-.,()@/]/.test(textContent)) {
            warnings.push({
                type: 'special_characters',
                severity: 'medium',
                message: 'Special characters detected that may cause parsing issues',
                suggestion: 'Replace special characters with standard alternatives'
            });
        }

        // Check for very long lines
        const lines = textContent.split('\n');
        const longLines = lines.filter(line => line.length > 100);
        if (longLines.length > 0) {
            warnings.push({
                type: 'long_lines',
                severity: 'low',
                message: 'Some content lines are very long',
                suggestion: 'Break long descriptions into shorter, clearer sentences'
            });
        }

        // Format-specific warnings
        if (format === 'pdf') {
            warnings.push({
                type: 'pdf_format',
                severity: 'medium',
                message: 'PDF format may have parsing limitations',
                suggestion: 'Consider providing a DOCX version as well'
            });
        }

        return warnings;
    }

    /**
     * Generate optimization suggestions
     */
    generateOptimizationSuggestions(analysis) {
        const suggestions = [];

        // Keyword optimization
        if (analysis.keyword_analysis.missing_opportunities) {
            Object.entries(analysis.keyword_analysis.missing_opportunities).forEach(([category, keywords]) => {
                if (keywords.length > 0) {
                    suggestions.push({
                        type: 'keyword_addition',
                        category: category,
                        priority: this.getCategoryPriority(category),
                        title: `Add ${category.replace('_', ' ')} keywords`,
                        keywords: keywords.slice(0, 5),
                        impact: 'high'
                    });
                }
            });
        }

        // Content structure optimization
        const structureScore = analysis.category_scores.section_structure?.score || 0;
        if (structureScore < 90) {
            suggestions.push({
                type: 'structure_improvement',
                priority: 'high',
                title: 'Improve section organization',
                description: 'Reorganize content into clearly defined sections',
                impact: 'high'
            });
        }

        return suggestions;
    }

    /**
     * Helper methods
     */
    hasContent(value) {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value && value.toString().trim().length > 0;
    }

    getCategoryPriority(category) {
        const priorities = {
            'technical_skills': 'high',
            'ai_ml': 'high',
            'soft_skills': 'medium',
            'methodologies': 'medium',
            'certifications': 'medium',
            'industries': 'low'
        };
        return priorities[category] || 'low';
    }

    getFormatRecommendations(format) {
        const recommendations = {
            'ats-text': ['Perfect for ATS parsing', 'Include keyword section'],
            'docx': ['Use standard fonts', 'Avoid complex formatting'],
            'pdf': ['Ensure text is selectable', 'Avoid image-based text'],
            'html': ['Keep styling simple', 'Avoid complex layouts'],
            'latex': ['May not be parsed by all ATS', 'Consider alternative format'],
            'json': ['Data format only', 'Not suitable for ATS submission']
        };
        return recommendations[format] || ['Unknown format compatibility'];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ATSAnalyzer;
}

// Make available globally
window.ATSAnalyzer = ATSAnalyzer;