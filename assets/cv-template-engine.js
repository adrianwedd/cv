/**
 * CV Template Engine
 * Advanced templating system for multi-format CV generation
 * Supports ATS optimization, keyword injection, and format-specific styling
 */

class CVTemplateEngine {
    constructor(cvData) {
        this.cvData = cvData;
        this.atsKeywords = [
            // Technical Skills
            'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Docker', 'Kubernetes',
            'AWS', 'Azure', 'PostgreSQL', 'MongoDB', 'Redis', 'Git', 'CI/CD', 'DevOps',
            
            // AI/ML Keywords
            'Machine Learning', 'Deep Learning', 'Neural Networks', 'TensorFlow', 'PyTorch',
            'Natural Language Processing', 'Computer Vision', 'AI', 'Artificial Intelligence',
            'Data Science', 'MLOps', 'Model Training', 'Algorithm Development',
            
            // Soft Skills
            'Leadership', 'Project Management', 'Team Collaboration', 'Problem Solving',
            'Communication', 'Mentoring', 'Strategic Planning', 'Innovation', 'Research',
            
            // Industry Terms
            'Software Architecture', 'System Design', 'API Development', 'Microservices',
            'Cloud Computing', 'Security', 'Performance Optimization', 'Scalability',
            'Agile', 'Scrum', 'Cross-functional', 'Stakeholder Management'
        ];
        
        this.formatConfigs = {
            pdf: {
                pageSize: 'A4',
                margins: { top: 20, right: 20, bottom: 20, left: 20 },
                fonts: { primary: 'Inter', secondary: 'Georgia' },
                maxPages: 3
            },
            docx: {
                pageSize: 'A4',
                margins: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 },
                fonts: { primary: 'Calibri', secondary: 'Times New Roman' },
                maxPages: 4
            },
            latex: {
                documentClass: 'moderncv',
                style: 'banking',
                color: 'blue',
                geometry: 'scale=0.75'
            },
            atsText: {
                maxLineLength: 80,
                sectionSeparator: '\n\n',
                keywordDensity: 0.02
            },
            html: {
                responsive: true,
                theme: 'professional',
                printOptimized: true
            }
        };
    }

    /**
     * Generate CV content for specific format
     */
    generateCV(format, options = {}) {
        const config = { ...this.formatConfigs[format], ...options };
        
        switch (format) {
            case 'pdf':
                return this.generatePDF(config);
            case 'docx':
                return this.generateDOCX(config);
            case 'latex':
                return this.generateLaTeX(config);
            case 'ats-text':
                return this.generateATSText(config);
            case 'html':
                return this.generateHTML(config);
            case 'json':
                return this.generateJSON(config);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Generate ATS-optimized text format
     */
    generateATSText(config) {
        const sections = [];
        
        // Header with contact information
        sections.push(this.generateATSHeader());
        
        // Professional summary with keyword optimization
        sections.push(this.generateATSSummary());
        
        // Core competencies (skills optimized for ATS)
        sections.push(this.generateATSSkills());
        
        // Professional experience
        sections.push(this.generateATSExperience());
        
        // Projects (if included)
        if (config.includeProjects !== false) {
            sections.push(this.generateATSProjects());
        }
        
        // Education
        sections.push(this.generateATSEducation());
        
        // Achievements (if included)
        if (config.includeAchievements !== false && this.cvData.achievements) {
            sections.push(this.generateATSAchievements());
        }
        
        // Certifications
        if (this.cvData.certifications?.length > 0) {
            sections.push(this.generateATSCertifications());
        }
        
        // Add keyword optimization
        const content = sections.join(config.sectionSeparator || '\n\n');
        return this.optimizeForATS(content, config);
    }

    /**
     * Generate ATS header section
     */
    generateATSHeader() {
        const info = this.cvData.personal_info;
        return `${info.name}
${info.title}

CONTACT INFORMATION
Email: ${info.email}
Location: ${info.location}
Website: ${info.website || ''}
LinkedIn: ${info.linkedin || ''}
GitHub: ${info.github || ''}`;
    }

    /**
     * Generate ATS-optimized professional summary
     */
    generateATSSummary() {
        let summary = this.cvData.professional_summary;
        
        // Inject relevant keywords naturally
        summary = this.injectKeywords(summary, [
            'Software Architecture', 'AI Engineer', 'Machine Learning', 'Python',
            'JavaScript', 'Cloud Computing', 'Leadership', 'Innovation'
        ]);
        
        return `PROFESSIONAL SUMMARY
${summary}`;
    }

    /**
     * Generate ATS skills section with keyword optimization
     */
    generateATSSkills() {
        const skillsByCategory = this.groupSkillsByCategory();
        let skillsText = 'CORE COMPETENCIES\n\n';
        
        Object.entries(skillsByCategory).forEach(([category, skills]) => {
            skillsText += `${category.toUpperCase()}\n`;
            skillsText += skills.map(skill => 
                `• ${skill.name} (${skill.proficiency} - ${skill.experience_years} years)`
            ).join('\n') + '\n\n';
        });
        
        return skillsText.trim();
    }

    /**
     * Generate ATS experience section
     */
    generateATSExperience() {
        let experienceText = 'PROFESSIONAL EXPERIENCE\n\n';
        
        this.cvData.experience.forEach(exp => {
            experienceText += `${exp.position}\n`;
            experienceText += `${exp.company} | ${exp.location || ''} | ${exp.period}\n\n`;
            
            if (exp.description) {
                experienceText += `${exp.description}\n\n`;
            }
            
            if (exp.achievements && exp.achievements.length > 0) {
                experienceText += 'KEY ACHIEVEMENTS:\n';
                exp.achievements.forEach(achievement => {
                    experienceText += `• ${achievement}\n`;
                });
                experienceText += '\n';
            }
            
            if (exp.technologies && exp.technologies.length > 0) {
                experienceText += `TECHNOLOGIES: ${exp.technologies.join(', ')}\n\n`;
            }
            
            experienceText += '---\n\n';
        });
        
        return experienceText.replace(/---\n\n$/, '').trim();
    }

    /**
     * Generate ATS projects section
     */
    generateATSProjects() {
        if (!this.cvData.projects || this.cvData.projects.length === 0) return '';
        
        let projectsText = 'KEY PROJECTS\n\n';
        
        this.cvData.projects.forEach(project => {
            projectsText += `${project.name}\n`;
            if (project.subtitle) {
                projectsText += `${project.subtitle}\n`;
            }
            projectsText += `${project.description}\n\n`;
            
            if (project.technologies && project.technologies.length > 0) {
                projectsText += `TECHNOLOGIES: ${project.technologies.join(', ')}\n`;
            }
            
            if (project.metrics && project.metrics.length > 0) {
                projectsText += 'METRICS:\n';
                project.metrics.forEach(metric => {
                    projectsText += `• ${metric.label}: ${metric.value}\n`;
                });
            }
            
            if (project.github) {
                projectsText += `REPOSITORY: ${project.github}\n`;
            }
            
            projectsText += '\n---\n\n';
        });
        
        return projectsText.replace(/---\n\n$/, '').trim();
    }

    /**
     * Generate ATS education section
     */
    generateATSEducation() {
        let educationText = 'EDUCATION\n\n';
        
        this.cvData.education.forEach(edu => {
            educationText += `${edu.degree}\n`;
            educationText += `${edu.institution} | ${edu.period}\n`;
            
            if (edu.key_areas && edu.key_areas.length > 0) {
                educationText += `KEY AREAS: ${edu.key_areas.join(', ')}\n`;
            }
            
            if (edu.certifications && edu.certifications.length > 0) {
                educationText += 'CERTIFICATIONS:\n';
                edu.certifications.forEach(cert => {
                    educationText += `• ${cert}\n`;
                });
            }
            
            educationText += '\n';
        });
        
        return educationText.trim();
    }

    /**
     * Generate ATS achievements section
     */
    generateATSAchievements() {
        let achievementsText = 'KEY ACHIEVEMENTS\n\n';
        
        this.cvData.achievements.forEach(achievement => {
            achievementsText += `${achievement.title} (${achievement.date})\n`;
            achievementsText += `${achievement.description}\n`;
            
            if (achievement.impact) {
                achievementsText += `IMPACT: ${achievement.impact}\n`;
            }
            
            achievementsText += '\n';
        });
        
        return achievementsText.trim();
    }

    /**
     * Generate ATS certifications section
     */
    generateATSCertifications() {
        let certsText = 'CERTIFICATIONS\n\n';
        
        this.cvData.certifications.forEach(cert => {
            certsText += `${cert.name}\n`;
            certsText += `${cert.issuer} | ${cert.date}\n`;
            if (cert.credential_id) {
                certsText += `Credential ID: ${cert.credential_id}\n`;
            }
            certsText += `Status: ${cert.status}\n\n`;
        });
        
        return certsText.trim();
    }

    /**
     * Generate HTML format with professional styling
     */
    generateHTML(config) {
        const theme = config.theme || 'professional';
        const responsive = config.responsive !== false;
        
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.cvData.personal_info.name} - CV</title>
    <style>${this.getHTMLStyles(theme, responsive)}</style>
</head>
<body class="cv-${theme}">`;

        // Header
        html += this.generateHTMLHeader();
        
        // Professional Summary
        html += this.generateHTMLSection('Professional Summary', 
            `<p class="summary">${this.cvData.professional_summary}</p>`);
        
        // Experience
        html += this.generateHTMLExperience();
        
        // Skills
        html += this.generateHTMLSkills();
        
        // Projects (if included)
        if (config.includeProjects !== false) {
            html += this.generateHTMLProjects();
        }
        
        // Education
        html += this.generateHTMLEducation();
        
        // Achievements (if included)
        if (config.includeAchievements !== false && this.cvData.achievements) {
            html += this.generateHTMLAchievements();
        }
        
        html += `</body></html>`;
        return html;
    }

    /**
     * Generate LaTeX format
     */
    generateLaTeX(config) {
        let latex = `\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{${config.style || 'banking'}}
\\moderncvcolor{${config.color || 'blue'}}

\\usepackage[utf8]{inputenc}
\\usepackage[${config.geometry || 'scale=0.75'}]{geometry}

% Personal data
\\name{${this.cvData.personal_info.name.split(' ')[0]}}{${this.cvData.personal_info.name.split(' ').slice(1).join(' ')}}
\\title{${this.cvData.personal_info.title}}
\\address{${this.cvData.personal_info.location}}
\\email{${this.cvData.personal_info.email}}`;

        if (this.cvData.personal_info.website) {
            latex += `\n\\homepage{${this.cvData.personal_info.website}}`;
        }

        latex += `\n\n\\begin{document}
\\makecvtitle

\\section{Professional Summary}
${this.cvData.professional_summary}

\\section{Experience}`;

        // Add experience entries
        this.cvData.experience.forEach(exp => {
            latex += `\n\\cventry{${exp.period}}{${exp.position}}{${exp.company}}{}{}{
${exp.description}`;
            
            if (exp.achievements && exp.achievements.length > 0) {
                latex += `\n\\begin{itemize}`;
                exp.achievements.forEach(achievement => {
                    latex += `\n\\item ${this.escapeLaTeX(achievement)}`;
                });
                latex += `\n\\end{itemize}`;
            }
            
            if (exp.technologies && exp.technologies.length > 0) {
                latex += `\n\\textbf{Technologies:} ${exp.technologies.join(', ')}`;
            }
            
            latex += `\n}`;
        });

        // Add skills section
        latex += `\n\n\\section{Technical Skills}`;
        const skillsByCategory = this.groupSkillsByCategory();
        Object.entries(skillsByCategory).forEach(([category, skills]) => {
            const skillNames = skills.map(s => s.name).join(', ');
            latex += `\n\\cvitem{${category}}{${skillNames}}`;
        });

        // Add projects if included
        if (config.includeProjects !== false && this.cvData.projects) {
            latex += `\n\n\\section{Key Projects}`;
            this.cvData.projects.forEach(project => {
                latex += `\n\\cvitem{${project.name}}{${this.escapeLaTeX(project.description)}}`;
            });
        }

        // Add education
        latex += `\n\n\\section{Education}`;
        this.cvData.education.forEach(edu => {
            latex += `\n\\cventry{${edu.period}}{${edu.degree}}{${edu.institution}}{}{}{`;
            if (edu.key_areas && edu.key_areas.length > 0) {
                latex += `Key Areas: ${edu.key_areas.join(', ')}`;
            }
            latex += `}`;
        });

        latex += `\n\n\\end{document}`;
        return latex;
    }

    /**
     * Generate JSON format with enhanced metadata
     */
    generateJSON(config) {
        const enhancedData = {
            ...this.cvData,
            metadata: {
                ...this.cvData.metadata,
                export_timestamp: new Date().toISOString(),
                export_format: 'json',
                export_config: config,
                ats_score: this.calculateATSScore(),
                keyword_density: this.calculateKeywordDensity(),
                estimated_pages: this.estimatePages('json')
            }
        };
        
        return JSON.stringify(enhancedData, null, 2);
    }

    /**
     * Optimize content for ATS systems
     */
    optimizeForATS(content, config) {
        let optimizedContent = content;
        
        // Ensure keyword density is appropriate
        const targetDensity = config.keywordDensity || 0.02;
        const currentDensity = this.calculateKeywordDensity(content);
        
        if (currentDensity < targetDensity) {
            optimizedContent = this.boostKeywordDensity(content, targetDensity);
        }
        
        // Add keyword section for maximum ATS compatibility
        const detectedKeywords = this.extractMatchingKeywords(content);
        if (detectedKeywords.length > 0) {
            optimizedContent += `\n\nKEYWORDS: ${detectedKeywords.join(', ')}`;
        }
        
        // Ensure proper formatting for ATS parsing
        optimizedContent = this.formatForATS(optimizedContent, config);
        
        return optimizedContent;
    }

    /**
     * Inject keywords naturally into text
     */
    injectKeywords(text, keywords) {
        let injectedText = text;
        
        keywords.forEach(keyword => {
            if (!injectedText.toLowerCase().includes(keyword.toLowerCase())) {
                // Find a natural place to inject the keyword
                const sentences = injectedText.split('. ');
                if (sentences.length > 1) {
                    // Add keyword to a relevant sentence
                    const relevantIndex = Math.floor(sentences.length / 2);
                    sentences[relevantIndex] = this.injectKeywordNaturally(sentences[relevantIndex], keyword);
                    injectedText = sentences.join('. ');
                }
            }
        });
        
        return injectedText;
    }

    /**
     * Inject keyword naturally into a sentence
     */
    injectKeywordNaturally(sentence, keyword) {
        // Simple natural injection - in production, this would be more sophisticated
        if (sentence.includes('experience') || sentence.includes('expertise')) {
            return sentence.replace('experience', `experience in ${keyword}`);
        } else if (sentence.includes('specializing')) {
            return sentence.replace('specializing', `specializing in ${keyword} and`);
        } else {
            return `${sentence}, leveraging ${keyword}`;
        }
    }

    /**
     * Calculate ATS compatibility score
     */
    calculateATSScore() {
        let score = 0;
        const content = this.generateATSText({}).toLowerCase();
        
        // Keyword matching (40 points max)
        const matchingKeywords = this.extractMatchingKeywords(content);
        score += Math.min(matchingKeywords.length * 2, 40);
        
        // Structure scoring (30 points max)
        score += this.scoreStructure();
        
        // Content completeness (30 points max)
        score += this.scoreCompleteness();
        
        return Math.min(score, 100);
    }

    /**
     * Calculate keyword density in content
     */
    calculateKeywordDensity(content = null) {
        if (!content) {
            content = this.generateATSText({});
        }
        
        const words = content.toLowerCase().split(/\s+/);
        const keywordMatches = this.extractMatchingKeywords(content);
        
        return keywordMatches.length / words.length;
    }

    /**
     * Extract matching keywords from content
     */
    extractMatchingKeywords(content) {
        const lowerContent = content.toLowerCase();
        return this.atsKeywords.filter(keyword => 
            lowerContent.includes(keyword.toLowerCase())
        );
    }

    /**
     * Group skills by category
     */
    groupSkillsByCategory() {
        const grouped = {};
        
        this.cvData.skills.forEach(skill => {
            const category = skill.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(skill);
        });
        
        return grouped;
    }

    /**
     * Score CV structure for ATS compatibility
     */
    scoreStructure() {
        let score = 0;
        
        if (this.cvData.personal_info) score += 5;
        if (this.cvData.professional_summary) score += 5;
        if (this.cvData.experience?.length > 0) score += 10;
        if (this.cvData.skills?.length > 0) score += 5;
        if (this.cvData.education?.length > 0) score += 5;
        
        return score;
    }

    /**
     * Score CV completeness
     */
    scoreCompleteness() {
        let score = 0;
        
        if (this.cvData.projects?.length > 0) score += 5;
        if (this.cvData.achievements?.length > 0) score += 5;
        if (this.cvData.certifications?.length > 0) score += 5;
        if (this.cvData.volunteer_work?.length > 0) score += 3;
        if (this.cvData.languages?.length > 0) score += 2;
        
        // Bonus for comprehensive experience descriptions
        const hasDetailedExperience = this.cvData.experience?.some(exp => 
            exp.achievements && exp.achievements.length > 2
        );
        if (hasDetailedExperience) score += 10;
        
        return score;
    }

    /**
     * Boost keyword density by natural injection
     */
    boostKeywordDensity(content, targetDensity) {
        const currentKeywords = this.extractMatchingKeywords(content);
        const words = content.split(/\s+/);
        const currentDensity = currentKeywords.length / words.length;
        
        if (currentDensity >= targetDensity) return content;
        
        const neededKeywords = Math.ceil((targetDensity * words.length) - currentKeywords.length);
        const unusedKeywords = this.atsKeywords.filter(kw => 
            !currentKeywords.includes(kw)
        );
        
        let boostedContent = content;
        const keywordsToAdd = unusedKeywords.slice(0, neededKeywords);
        
        // Add a natural keyword section
        if (keywordsToAdd.length > 0) {
            boostedContent += `\n\nADDITIONAL COMPETENCIES
${keywordsToAdd.join(' • ')}`;
        }
        
        return boostedContent;
    }

    /**
     * Format content specifically for ATS parsing
     */
    formatForATS(content, config) {
        let formatted = content;
        
        // Ensure consistent line length
        if (config.maxLineLength) {
            formatted = this.wrapLines(formatted, config.maxLineLength);
        }
        
        // Remove special characters that might confuse ATS
        formatted = formatted.replace(/[""'']/g, '"');
        formatted = formatted.replace(/[–—]/g, '-');
        
        // Ensure section headers are clearly marked
        formatted = formatted.replace(/^([A-Z][A-Z\s]+)$/gm, '\n$1\n');
        
        return formatted;
    }

    /**
     * Wrap lines to specified length
     */
    wrapLines(text, maxLength) {
        return text.split('\n').map(line => {
            if (line.length <= maxLength) return line;
            
            const words = line.split(' ');
            const wrappedLines = [];
            let currentLine = '';
            
            words.forEach(word => {
                if ((currentLine + word).length <= maxLength) {
                    currentLine += (currentLine ? ' ' : '') + word;
                } else {
                    if (currentLine) wrappedLines.push(currentLine);
                    currentLine = word;
                }
            });
            
            if (currentLine) wrappedLines.push(currentLine);
            return wrappedLines.join('\n');
        }).join('\n');
    }

    /**
     * Escape special LaTeX characters
     */
    escapeLaTeX(text) {
        return text
            .replace(/\\/g, '\\textbackslash ')
            .replace(/[{}]/g, '\\$&')
            .replace(/[#$%&_^]/g, '\\$&')
            .replace(/~/g, '\\textasciitilde ')
            .replace(/\|/g, '\\textbar ');
    }

    /**
     * Generate HTML header section
     */
    generateHTMLHeader() {
        const info = this.cvData.personal_info;
        return `
    <header class="cv-header">
        <div class="header-content">
            <h1 class="name">${info.name}</h1>
            <h2 class="title">${info.title}</h2>
            <p class="tagline">${info.tagline || ''}</p>
            <div class="contact-info">
                <span class="contact-item">📧 ${info.email}</span>
                <span class="contact-item">📍 ${info.location}</span>
                ${info.website ? `<span class="contact-item">🌐 ${info.website}</span>` : ''}
                ${info.linkedin ? `<span class="contact-item">💼 LinkedIn</span>` : ''}
                ${info.github ? `<span class="contact-item">⚡ GitHub</span>` : ''}
            </div>
        </div>
    </header>`;
    }

    /**
     * Generate HTML section wrapper
     */
    generateHTMLSection(title, content) {
        return `
    <section class="cv-section">
        <h3 class="section-title">${title}</h3>
        <div class="section-content">
            ${content}
        </div>
    </section>`;
    }

    /**
     * Generate HTML experience section
     */
    generateHTMLExperience() {
        const experienceHTML = this.cvData.experience.map(exp => `
        <div class="experience-item">
            <div class="experience-header">
                <h4 class="position">${exp.position}</h4>
                <div class="company-period">
                    <span class="company">${exp.company}</span>
                    <span class="period">${exp.period}</span>
                </div>
            </div>
            <p class="description">${exp.description}</p>
            ${exp.achievements && exp.achievements.length > 0 ? `
                <ul class="achievements">
                    ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                </ul>
            ` : ''}
            ${exp.technologies && exp.technologies.length > 0 ? `
                <div class="technologies">
                    <strong>Technologies:</strong> ${exp.technologies.join(', ')}
                </div>
            ` : ''}
        </div>`).join('');
        
        return this.generateHTMLSection('Professional Experience', experienceHTML);
    }

    /**
     * Generate HTML skills section
     */
    generateHTMLSkills() {
        const skillsByCategory = this.groupSkillsByCategory();
        const skillsHTML = Object.entries(skillsByCategory).map(([category, skills]) => `
        <div class="skill-category">
            <h4 class="category-title">${category}</h4>
            <div class="skills-list">
                ${skills.map(skill => `
                    <div class="skill-item">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-level">${skill.proficiency}</span>
                    </div>
                `).join('')}
            </div>
        </div>`).join('');
        
        return this.generateHTMLSection('Technical Skills', skillsHTML);
    }

    /**
     * Generate HTML projects section
     */
    generateHTMLProjects() {
        if (!this.cvData.projects || this.cvData.projects.length === 0) return '';
        
        const projectsHTML = this.cvData.projects.map(project => `
        <div class="project-item">
            <h4 class="project-name">${project.name}</h4>
            ${project.subtitle ? `<p class="project-subtitle">${project.subtitle}</p>` : ''}
            <p class="project-description">${project.description}</p>
            ${project.technologies && project.technologies.length > 0 ? `
                <div class="project-technologies">
                    <strong>Technologies:</strong> ${project.technologies.join(', ')}
                </div>
            ` : ''}
            ${project.metrics && project.metrics.length > 0 ? `
                <div class="project-metrics">
                    ${project.metrics.map(metric => `
                        <span class="metric">${metric.label}: ${metric.value}</span>
                    `).join('')}
                </div>
            ` : ''}
        </div>`).join('');
        
        return this.generateHTMLSection('Key Projects', projectsHTML);
    }

    /**
     * Generate HTML education section
     */
    generateHTMLEducation() {
        const educationHTML = this.cvData.education.map(edu => `
        <div class="education-item">
            <h4 class="degree">${edu.degree}</h4>
            <div class="institution-period">
                <span class="institution">${edu.institution}</span>
                <span class="period">${edu.period}</span>
            </div>
            ${edu.key_areas && edu.key_areas.length > 0 ? `
                <div class="key-areas">
                    <strong>Key Areas:</strong> ${edu.key_areas.join(', ')}
                </div>
            ` : ''}
        </div>`).join('');
        
        return this.generateHTMLSection('Education', educationHTML);
    }

    /**
     * Generate HTML achievements section
     */
    generateHTMLAchievements() {
        const achievementsHTML = this.cvData.achievements.map(achievement => `
        <div class="achievement-item">
            <div class="achievement-header">
                <span class="achievement-icon">${achievement.icon || '🏆'}</span>
                <h4 class="achievement-title">${achievement.title}</h4>
                <span class="achievement-date">${achievement.date}</span>
            </div>
            <p class="achievement-description">${achievement.description}</p>
        </div>`).join('');
        
        return this.generateHTMLSection('Key Achievements', achievementsHTML);
    }

    /**
     * Get HTML styles for different themes
     */
    getHTMLStyles(theme, responsive) {
        let styles = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .cv-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #2563eb;
        }
        
        .name {
            font-size: 2.5em;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 1.3em;
            color: #2563eb;
            font-weight: 500;
            margin-bottom: 10px;
        }
        
        .tagline {
            color: #666;
            font-style: italic;
            margin-bottom: 20px;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 0.9em;
            color: #666;
        }
        
        .cv-section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 1.4em;
            color: #1a1a1a;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .experience-item, .project-item, .education-item {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .experience-header, .institution-period {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .position, .project-name, .degree {
            font-size: 1.2em;
            color: #1a1a1a;
            margin: 0;
        }
        
        .company, .institution {
            color: #2563eb;
            font-weight: 500;
        }
        
        .period {
            color: #666;
            font-size: 0.9em;
        }
        
        .description, .project-description {
            color: #4a5568;
            margin-bottom: 15px;
            line-height: 1.7;
        }
        
        .achievements {
            margin: 15px 0;
            padding-left: 20px;
        }
        
        .achievements li {
            margin-bottom: 8px;
            color: #4a5568;
        }
        
        .technologies, .project-technologies, .key-areas {
            font-size: 0.9em;
            color: #666;
            margin-top: 10px;
        }
        
        .skill-category {
            margin-bottom: 20px;
        }
        
        .category-title {
            color: #2563eb;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        
        .skills-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .skill-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .skill-name {
            font-weight: 500;
        }
        
        .skill-level {
            color: #2563eb;
            font-size: 0.9em;
        }
        
        .project-metrics {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        
        .metric {
            background: #f8fafc;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            color: #374151;
        }
        
        .achievement-item {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .achievement-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        
        .achievement-icon {
            font-size: 1.5em;
        }
        
        .achievement-title {
            color: #1a1a1a;
            margin: 0;
        }
        
        .achievement-date {
            color: #666;
            font-size: 0.9em;
        }
        
        .achievement-description {
            color: #4a5568;
            line-height: 1.6;
        }`;

        // Theme-specific styles
        if (theme === 'modern') {
            styles += `
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .cv-header {
                border-bottom-color: white;
            }
            .section-title {
                color: white;
                border-bottom-color: rgba(255,255,255,0.3);
            }
            .position, .project-name, .degree, .name {
                color: white;
            }`;
        } else if (theme === 'minimal') {
            styles += `
            body {
                font-family: 'Georgia', serif;
                color: #2d3748;
            }
            .name {
                font-weight: normal;
            }
            .cv-header {
                border-bottom: 1px solid #e2e8f0;
            }`;
        } else if (theme === 'executive') {
            styles += `
            body {
                background: #1a1a1a;
                color: #e2e8f0;
            }
            .cv-header {
                border-bottom-color: #4a5568;
            }
            .section-title {
                color: #e2e8f0;
                border-bottom-color: #4a5568;
            }
            .position, .project-name, .degree, .name {
                color: #e2e8f0;
            }`;
        }

        // Responsive styles
        if (responsive) {
            styles += `
            @media (max-width: 768px) {
                body {
                    padding: 20px 10px;
                }
                .name {
                    font-size: 2em;
                }
                .contact-info {
                    flex-direction: column;
                    gap: 10px;
                }
                .experience-header, .institution-period {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                }
                .skills-list {
                    grid-template-columns: 1fr;
                }
            }`;
        }

        return styles;
    }

    /**
     * Estimate number of pages for different formats
     */
    estimatePages(format) {
        const contentLength = JSON.stringify(this.cvData).length;
        
        switch (format) {
            case 'pdf':
                return Math.ceil(contentLength / 2500); // ~2500 chars per page
            case 'docx':
                return Math.ceil(contentLength / 3000); // ~3000 chars per page
            case 'ats-text':
                return Math.ceil(contentLength / 4000); // ~4000 chars per page
            case 'html':
                return 1; // Single page
            case 'latex':
                return Math.ceil(contentLength / 2800); // ~2800 chars per page
            case 'json':
                return 1; // Data format
            default:
                return 1;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CVTemplateEngine;
}

// Make available globally
window.CVTemplateEngine = CVTemplateEngine;