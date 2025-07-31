#!/usr/bin/env node

/**
 * Position Description Ingester
 * 
 * Analyzes job descriptions to extract key requirements, skills, and context
 * for tailoring CV content to specific opportunities. This enables the AI
 * enhancement system to emphasize relevant experience and skills.
 * 
 * Features:
 * - Parse job descriptions from various formats (text, URL, PDF)
 * - Extract key skills, technologies, and requirements
 * - Analyze company culture and values alignment
 * - Generate targeting insights for CV customization
 * - Store processed job descriptions for reuse
 * 
 * Usage: 
 *   node position-description-ingester.js --text "job description text"
 *   node position-description-ingester.js --url "https://company.com/job"
 *   node position-description-ingester.js --file "job-description.pdf"
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PositionDescriptionIngester {
    constructor() {
        this.dataDir = path.resolve(__dirname, '../../data');
        this.positionsDir = path.join(this.dataDir, 'positions');
        this.outputDir = path.join(this.dataDir, 'targeting');
        
        // Skill categories for classification
        this.skillCategories = {
            'programming': [
                'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'rust', 'go', 'php',
                'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css'
            ],
            'frameworks': [
                'react', 'vue', 'angular', 'django', 'flask', 'spring', 'express', 'fastapi',
                'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'bootstrap'
            ],
            'cloud_platforms': [
                'aws', 'azure', 'gcp', 'google cloud', 'digitalocean', 'heroku', 'vercel'
            ],
            'devops': [
                'docker', 'kubernetes', 'jenkins', 'github actions', 'ci/cd', 'terraform',
                'ansible', 'puppet', 'chef', 'vagrant', 'monitoring', 'logging'
            ],
            'databases': [
                'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
                'dynamodb', 'sqlite', 'oracle', 'sql server'
            ],
            'ai_ml': [
                'machine learning', 'artificial intelligence', 'deep learning', 'nlp',
                'computer vision', 'data science', 'neural networks', 'transformers',
                'llm', 'generative ai', 'gpt', 'claude', 'openai'
            ],
            'systems': [
                'linux', 'unix', 'windows server', 'networking', 'security', 'cybersecurity',
                'system administration', 'infrastructure', 'performance tuning'
            ],
            'methodologies': [
                'agile', 'scrum', 'kanban', 'devops', 'microservices', 'api design',
                'system design', 'architecture', 'testing', 'tdd', 'bdd'
            ]
        };
        
        // Experience level indicators
        this.experienceLevels = {
            'entry': ['junior', 'entry', 'graduate', 'associate', '0-2 years', 'new grad'],
            'mid': ['mid', 'intermediate', '2-5 years', '3-7 years', 'experienced'],
            'senior': ['senior', 'lead', 'principal', '5+ years', '7+ years', 'expert'],
            'management': ['manager', 'director', 'head of', 'vp', 'chief', 'team lead']
        };
        
        // Company culture indicators
        this.cultureIndicators = {
            'innovation': ['innovative', 'cutting-edge', 'pioneering', 'disruptive', 'startup'],
            'growth': ['scaling', 'growing', 'expanding', 'fast-paced', 'dynamic'],
            'collaboration': ['team', 'collaborative', 'cross-functional', 'partnership'],
            'impact': ['mission', 'purpose', 'social impact', 'meaningful', 'change'],
            'stability': ['established', 'stable', 'mature', 'enterprise', 'fortune']
        };
    }

    /**
     * Initialize the ingestion system
     */
    async initialize() {
        console.log('🎯 Initializing Position Description Ingester...');
        
        // Create directories if they don't exist
        await fs.mkdir(this.positionsDir, { recursive: true });
        await fs.mkdir(this.outputDir, { recursive: true });
        
        console.log('✅ Directory structure initialized');
    }

    /**
     * Ingest job description from text
     */
    async ingestFromText(jobText, metadata = {}) {
        console.log('📝 Processing job description from text...');
        
        const analysis = await this.analyzeJobDescription(jobText, metadata);
        const jobId = this.generateJobId(jobText, metadata);
        
        await this.saveJobAnalysis(jobId, analysis);
        await this.generateTargetingInsights(jobId, analysis);
        
        console.log(`✅ Job analysis completed: ${jobId}`);
        return { jobId, analysis };
    }
    
    /**
     * Ingest job description from URL
     */
    async ingestFromUrl(url) {
        console.log(`🌐 Processing job description from URL: ${url}`);
        
        try {
            // For now, this is a placeholder for web scraping functionality
            // In the future, this could use Playwright or similar tools
            console.log('⚠️ URL ingestion requires web scraping implementation');
            console.log('💡 For now, please copy the job description text and use --text option');
            
            return { jobId: null, analysis: null, error: 'URL ingestion not yet implemented' };
        } catch (error) {
            console.error('❌ Failed to ingest from URL:', error.message);
            return { jobId: null, analysis: null, error: error.message };
        }
    }
    
    /**
     * Ingest job description from file
     */
    async ingestFromFile(filePath) {
        console.log(`📄 Processing job description from file: ${filePath}`);
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const metadata = {
                source: 'file',
                file_path: filePath,
                file_name: path.basename(filePath)
            };
            
            return await this.ingestFromText(content, metadata);
        } catch (error) {
            console.error('❌ Failed to read file:', error.message);
            return { jobId: null, analysis: null, error: error.message };
        }
    }

    /**
     * Analyze job description content
     */
    async analyzeJobDescription(text, metadata = {}) {
        const analysis = {
            metadata: {
                analyzed_at: new Date().toISOString(),
                source: metadata.source || 'text',
                ingester_version: '1.0.0',
                ...metadata
            },
            raw_text: text,
            extracted_data: {},
            targeting_insights: {}
        };

        // Extract basic information
        analysis.extracted_data = {
            job_title: this.extractJobTitle(text),
            company: this.extractCompany(text),
            location: this.extractLocation(text),
            experience_level: this.classifyExperienceLevel(text),
            employment_type: this.extractEmploymentType(text),
            salary_range: this.extractSalaryRange(text)
        };

        // Extract skills and technologies
        analysis.extracted_data.required_skills = this.extractSkills(text, 'required');
        analysis.extracted_data.preferred_skills = this.extractSkills(text, 'preferred');
        analysis.extracted_data.technology_stack = this.categorizeSkills(
            [...analysis.extracted_data.required_skills, ...analysis.extracted_data.preferred_skills]
        );

        // Extract responsibilities and requirements
        analysis.extracted_data.key_responsibilities = this.extractResponsibilities(text);
        analysis.extracted_data.qualifications = this.extractQualifications(text);
        
        // Analyze company culture
        analysis.extracted_data.culture_indicators = this.analyzeCulture(text);
        
        // Generate matching insights
        analysis.targeting_insights = await this.generateMatchingInsights(analysis.extracted_data);

        return analysis;
    }

    /**
     * Extract job title from text
     */
    extractJobTitle(text) {
        // Look for common job title patterns
        const titlePatterns = [
            /(?:position|role|job|title):\s*([^\n]+)/i,
            /^([^\n]+(?:engineer|developer|analyst|manager|director|specialist|coordinator))/i,
            /job title:\s*([^\n]+)/i
        ];

        for (const pattern of titlePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        // Fallback: look for capitalized words that might be job titles
        const lines = text.split('\n').slice(0, 5); // Check first few lines
        for (const line of lines) {
            if (line.length < 100 && /[A-Z]/.test(line) && 
                (line.includes('Engineer') || line.includes('Developer') || 
                 line.includes('Analyst') || line.includes('Manager'))) {
                return line.trim();
            }
        }

        return 'Unknown Position';
    }

    /**
     * Extract company name from text
     */
    extractCompany(text) {
        const companyPatterns = [
            /company:\s*([^\n]+)/i,
            /employer:\s*([^\n]+)/i,
            /organization:\s*([^\n]+)/i,
            /(?:at|join)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+is|,|\.|$)/
        ];

        for (const pattern of companyPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return 'Unknown Company';
    }

    /**
     * Extract location from text
     */
    extractLocation(text) {
        const locationPatterns = [
            /location:\s*([^\n]+)/i,
            /based in:\s*([^\n]+)/i,
            /(?:remote|hybrid|onsite).*?([A-Z][a-z]+,\s*[A-Z]{2,})/,
            /([A-Z][a-z]+,\s*(?:Australia|USA|UK|Canada|Germany))/i
        ];

        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return 'Location not specified';
    }

    /**
     * Extract employment type from text
     */
    extractEmploymentType(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('full-time') || lowerText.includes('full time')) {
            return 'full-time';
        } else if (lowerText.includes('part-time') || lowerText.includes('part time')) {
            return 'part-time';
        } else if (lowerText.includes('contract') || lowerText.includes('contractor')) {
            return 'contract';
        } else if (lowerText.includes('freelance') || lowerText.includes('consultant')) {
            return 'freelance';
        } else if (lowerText.includes('intern') || lowerText.includes('internship')) {
            return 'internship';
        }
        
        return 'not specified';
    }

    /**
     * Extract salary range from text
     */
    extractSalaryRange(text) {
        const salaryPatterns = [
            /\$[\d,]+\s*-\s*\$[\d,]+/g,
            /salary:\s*([^\n]+)/i,
            /compensation:\s*([^\n]+)/i,
            /[\d,]+k?\s*-\s*[\d,]+k?\s*(?:AUD|USD|per year|annually)/i
        ];

        for (const pattern of salaryPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[0].trim();
            }
        }

        return 'not specified';
    }

    /**
     * Classify experience level
     */
    classifyExperienceLevel(text) {
        const lowerText = text.toLowerCase();
        
        for (const [level, indicators] of Object.entries(this.experienceLevels)) {
            for (const indicator of indicators) {
                if (lowerText.includes(indicator)) {
                    return level;
                }
            }
        }
        
        return 'unspecified';
    }

    /**
     * Extract skills from text
     */
    extractSkills(text, type = 'all') {
        const skills = new Set();
        const lowerText = text.toLowerCase();
        
        // Check all skill categories
        for (const [category, skillList] of Object.entries(this.skillCategories)) {
            for (const skill of skillList) {
                if (lowerText.includes(skill.toLowerCase())) {
                    skills.add(skill);
                }
            }
        }
        
        return Array.from(skills);
    }

    /**
     * Categorize skills by type
     */
    categorizeSkills(skills) {
        const categorized = {};
        
        for (const [category, skillList] of Object.entries(this.skillCategories)) {
            categorized[category] = skills.filter(skill => 
                skillList.some(s => s.toLowerCase() === skill.toLowerCase())
            );
        }
        
        return categorized;
    }

    /**
     * Extract key responsibilities
     */
    extractResponsibilities(text) {
        const responsibilities = [];
        const lines = text.split('\n');
        
        let inResponsibilities = false;
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (/responsibilities|duties|role includes/i.test(trimmed)) {
                inResponsibilities = true;
                continue;
            }
            
            if (inResponsibilities) {
                if (/requirements|qualifications|skills/i.test(trimmed)) {
                    break;
                }
                
                if (trimmed.match(/^[-•*]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
                    responsibilities.push(trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, ''));
                }
            }
        }
        
        return responsibilities;
    }

    /**
     * Extract qualifications
     */
    extractQualifications(text) {
        const qualifications = [];
        const lines = text.split('\n');
        
        let inQualifications = false;
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (/requirements|qualifications|must have|essential/i.test(trimmed)) {
                inQualifications = true;
                continue;
            }
            
            if (inQualifications) {
                if (/benefits|compensation|about us/i.test(trimmed)) {
                    break;
                }
                
                if (trimmed.match(/^[-•*]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
                    qualifications.push(trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, ''));
                }
            }
        }
        
        return qualifications;
    }

    /**
     * Analyze company culture indicators
     */
    analyzeCulture(text) {
        const cultureScore = {};
        const lowerText = text.toLowerCase();
        
        for (const [culture, indicators] of Object.entries(this.cultureIndicators)) {
            let score = 0;
            for (const indicator of indicators) {
                if (lowerText.includes(indicator)) {
                    score++;
                }
            }
            cultureScore[culture] = score;
        }
        
        // Find dominant culture traits
        const sortedCulture = Object.entries(cultureScore)
            .sort(([,a], [,b]) => b - a)
            .filter(([,score]) => score > 0);
            
        return {
            scores: cultureScore,
            dominant_traits: sortedCulture.slice(0, 3).map(([trait]) => trait)
        };
    }

    /**
     * Generate matching insights
     */
    async generateMatchingInsights(extractedData) {
        // Load current CV data for comparison
        let cvData = {};
        try {
            const cvPath = path.join(this.dataDir, 'base-cv.json');
            const content = await fs.readFile(cvPath, 'utf8');
            cvData = JSON.parse(content);
        } catch {
            console.warn('⚠️ Could not load CV data for matching analysis');
        }

        const insights = {
            skill_matches: this.analyzeSkillMatches(extractedData, cvData),
            experience_alignment: this.analyzeExperienceAlignment(extractedData, cvData),
            culture_fit: this.analyzeCultureFit(extractedData, cvData),
            enhancement_recommendations: this.generateEnhancementRecommendations(extractedData, cvData)
        };

        return insights;
    }

    /**
     * Analyze skill matches between job and CV
     */
    analyzeSkillMatches(jobData, cvData) {
        const cvSkills = new Set();
        
        // Extract skills from CV
        if (cvData.skills) {
            cvData.skills.forEach(skill => cvSkills.add(skill.name.toLowerCase()));
        }
        
        const requiredMatches = jobData.required_skills.filter(skill => 
            cvSkills.has(skill.toLowerCase())
        );
        
        const preferredMatches = jobData.preferred_skills.filter(skill => 
            cvSkills.has(skill.toLowerCase())
        );
        
        const missingRequired = jobData.required_skills.filter(skill => 
            !cvSkills.has(skill.toLowerCase())
        );

        return {
            required_matches: requiredMatches,
            preferred_matches: preferredMatches,
            missing_required: missingRequired,
            match_percentage: requiredMatches.length / Math.max(jobData.required_skills.length, 1) * 100
        };
    }

    /**
     * Analyze experience alignment
     */
    analyzeExperienceAlignment(jobData, cvData) {
        const alignment = {
            level_match: false,
            relevant_experience: [],
            transferable_skills: []
        };

        // Check experience level alignment
        if (cvData.experience) {
            const totalYears = cvData.experience.reduce((total, exp) => {
                const years = this.calculateYears(exp.period);
                return total + years;
            }, 0);

            alignment.level_match = this.matchesExperienceLevel(jobData.experience_level, totalYears);
            alignment.total_years = totalYears;
        }

        return alignment;
    }

    /**
     * Analyze culture fit
     */
    analyzeCultureFit(jobData, cvData) {
        const cultureFit = {
            alignment_score: 0,
            matching_values: [],
            recommendations: []
        };

        // This is a simplified culture analysis
        // In practice, this would involve more sophisticated matching
        if (jobData.culture_indicators?.dominant_traits) {
            cultureFit.identified_culture = jobData.culture_indicators.dominant_traits;
        }

        return cultureFit;
    }

    /**
     * Generate enhancement recommendations
     */
    generateEnhancementRecommendations(jobData, cvData) {
        const recommendations = [];

        // Skill gap recommendations
        if (jobData.required_skills) {
            recommendations.push({
                type: 'skills',
                priority: 'high',
                action: 'Emphasize matching skills in professional summary',
                skills: jobData.required_skills.slice(0, 5)
            });
        }

        // Experience emphasis
        recommendations.push({
            type: 'experience',
            priority: 'medium',
            action: 'Highlight relevant experience that matches job responsibilities',
            focus_areas: jobData.key_responsibilities?.slice(0, 3) || []
        });

        return recommendations;
    }

    /**
     * Generate unique job ID
     */
    generateJobId(text, metadata) {
        const content = text + JSON.stringify(metadata);
        const hash = crypto.createHash('md5').update(content).digest('hex');
        const timestamp = new Date().toISOString().slice(0, 10);
        return `job-${timestamp}-${hash.slice(0, 8)}`;
    }

    /**
     * Save job analysis results
     */
    async saveJobAnalysis(jobId, analysis) {
        const filePath = path.join(this.positionsDir, `${jobId}.json`);
        await fs.writeFile(filePath, JSON.stringify(analysis, null, 2), 'utf8');
        console.log(`💾 Job analysis saved: ${filePath}`);
    }

    /**
     * Generate targeting insights file
     */
    async generateTargetingInsights(jobId, analysis) {
        const insights = {
            job_id: jobId,
            generated_at: new Date().toISOString(),
            targeting_profile: {
                position: analysis.extracted_data.job_title,
                company: analysis.extracted_data.company,
                key_skills: analysis.extracted_data.required_skills.slice(0, 10),
                experience_level: analysis.extracted_data.experience_level,
                culture_traits: analysis.extracted_data.culture_indicators?.dominant_traits || []
            },
            cv_customization: analysis.targeting_insights
        };

        const insightsPath = path.join(this.outputDir, `targeting-${jobId}.json`);
        await fs.writeFile(insightsPath, JSON.stringify(insights, null, 2), 'utf8');
        
        // Also save as latest targeting insights
        const latestPath = path.join(this.outputDir, 'latest-targeting.json');
        await fs.writeFile(latestPath, JSON.stringify(insights, null, 2), 'utf8');
        
        console.log(`🎯 Targeting insights saved: ${insightsPath}`);
    }

    /**
     * Helper methods
     */
    calculateYears(period) {
        // Simple year calculation - in practice this would be more sophisticated
        const yearMatch = period.match(/(\d{4})\s*-\s*(\d{4}|Present)/);
        if (yearMatch) {
            const start = parseInt(yearMatch[1]);
            const end = yearMatch[2] === 'Present' ? new Date().getFullYear() : parseInt(yearMatch[2]);
            return end - start;
        }
        return 0;
    }

    matchesExperienceLevel(jobLevel, totalYears) {
        const levelRanges = {
            'entry': [0, 2],
            'mid': [2, 7],
            'senior': [7, Infinity],
            'management': [5, Infinity]
        };

        if (levelRanges[jobLevel]) {
            const [min, max] = levelRanges[jobLevel];
            return totalYears >= min && totalYears <= max;
        }

        return false;
    }
}

// CLI interface
async function main() {
    const ingester = new PositionDescriptionIngester();
    await ingester.initialize();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--text')) {
        const textIndex = args.indexOf('--text');
        const jobText = args[textIndex + 1];
        if (!jobText) {
            console.error('❌ Please provide job description text after --text');
            process.exit(1);
        }
        
        const result = await ingester.ingestFromText(jobText, { source: 'cli_text' });
        console.log(`\n✅ Processing complete. Job ID: ${result.jobId}`);
        
    } else if (args.includes('--url')) {
        const urlIndex = args.indexOf('--url');
        const url = args[urlIndex + 1];
        if (!url) {
            console.error('❌ Please provide URL after --url');
            process.exit(1);
        }
        
        const result = await ingester.ingestFromUrl(url);
        if (result.error) {
            console.error(`❌ ${result.error}`);
            process.exit(1);
        }
        
    } else if (args.includes('--file')) {
        const fileIndex = args.indexOf('--file');
        const filePath = args[fileIndex + 1];
        if (!filePath) {
            console.error('❌ Please provide file path after --file');
            process.exit(1);
        }
        
        const result = await ingester.ingestFromFile(filePath);
        if (result.error) {
            console.error(`❌ ${result.error}`);
            process.exit(1);
        }
        console.log(`\n✅ Processing complete. Job ID: ${result.jobId}`);
        
    } else {
        console.log('Position Description Ingester');
        console.log('');
        console.log('Usage:');
        console.log('  node position-description-ingester.js --text "job description text"');
        console.log('  node position-description-ingester.js --url "https://company.com/job"');
        console.log('  node position-description-ingester.js --file "job-description.txt"');
        console.log('');
        console.log('The ingester will analyze the job description and generate targeting');
        console.log('insights to help customize your CV for the specific opportunity.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PositionDescriptionIngester;