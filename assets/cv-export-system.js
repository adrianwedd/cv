/**
 * Advanced Multi-Format CV Export System
 * Universal compatibility for recruiters, ATS systems, and professional contexts
 * 
 * Features:
 * - Multiple export formats: PDF, DOCX, LaTeX, ATS-optimized text, JSON
 * - Professional styling and formatting consistency
 * - Interactive export interface with real-time preview
 * - ATS optimization with keyword highlighting
 * - Client-side generation for privacy
 * - Performance optimized with progressive loading
 */

// Configuration and constants
const EXPORT_CONFIG = {
    FORMATS: {
        PDF: 'pdf',
        DOCX: 'docx', 
        LATEX: 'latex',
        ATS_TEXT: 'ats-text',
        JSON: 'json',
        HTML: 'html'
    },
    ATS_KEYWORDS: [
        // Programming Languages
        'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C++',
        // AI/ML Technologies
        'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Neural Networks',
        'Natural Language Processing', 'Computer Vision', 'AI', 'Artificial Intelligence',
        // Web Technologies
        'React', 'Node.js', 'Vue.js', 'HTML', 'CSS', 'REST API', 'GraphQL',
        // Cloud & DevOps
        'AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions',
        // Databases
        'PostgreSQL', 'MongoDB', 'Redis', 'Database Design',
        // Soft Skills
        'Leadership', 'Project Management', 'Team Collaboration', 'Problem Solving',
        'Communication', 'Mentoring', 'Strategic Planning'
    ],
    STYLE_THEMES: {
        PROFESSIONAL: 'professional',
        MODERN: 'modern',
        MINIMAL: 'minimal',
        EXECUTIVE: 'executive'
    }
};

/**
 * Main CV Export System Class
 */
class CVExportSystem {
    constructor() {
        this.cvData = null;
        this.exportSettings = {
            format: EXPORT_CONFIG.FORMATS.PDF,
            theme: EXPORT_CONFIG.STYLE_THEMES.PROFESSIONAL,
            includeProjects: true,
            includeAchievements: true,
            atsOptimized: false,
            customSections: []
        };
        this.atsScore = 0;
        this.exportHistory = [];
        
        this.init();
    }

    /**
     * Initialize the export system
     */
    async init() {
        console.log('🚀 Initializing CV Export System...');
        
        try {
            await this.loadCVData();
            this.setupExportInterface();
            this.initializePreviewSystem();
            this.setupEventListeners();
            
            console.log('✅ CV Export System initialized successfully');
        } catch (error) {
            console.error('❌ Export system initialization failed:', error);
            this.handleError(error);
        }
    }

    /**
     * Load CV data from the base JSON file
     */
    async loadCVData() {
        try {
            const response = await fetch('data/base-cv.json');
            if (!response.ok) {
                throw new Error(`Failed to load CV data: HTTP ${response.status}`);
            }
            
            this.cvData = await response.json();
            
            // Validate CV data structure
            if (!this.cvData.personal_info || !this.cvData.experience) {
                throw new Error('Invalid CV data structure');
            }
            
            console.log('📄 CV data loaded successfully');
        } catch (error) {
            console.error('Failed to load CV data:', error);
            
            // Set minimal fallback data to allow system to function
            this.cvData = this.getFallbackCVData();
            console.warn('Using fallback CV data');
        }
    }

    /**
     * Setup the export interface
     */
    setupExportInterface() {
        // Create export button if it doesn't exist
        if (!document.getElementById('cv-export-toggle')) {
            this.createExportButton();
        }
        
        // Create export modal
        this.createExportModal();
    }

    /**
     * Create the floating export button
     */
    createExportButton() {
        const exportButton = document.createElement('button');
        exportButton.id = 'cv-export-toggle';
        exportButton.className = 'cv-export-toggle';
        exportButton.innerHTML = `
            <span class="export-icon">📄</span>
            <span class="export-text">Export CV</span>
        `;
        exportButton.setAttribute('aria-label', 'Open CV export options');
        exportButton.setAttribute('title', 'Export CV in multiple formats');
        
        document.body.appendChild(exportButton);
    }

    /**
     * Create the export modal interface
     */
    createExportModal() {
        const modal = document.createElement('div');
        modal.id = 'cv-export-modal';
        modal.className = 'cv-export-modal';
        modal.innerHTML = `
            <div class="export-modal-backdrop"></div>
            <div class="export-modal-content">
                <div class="export-modal-header">
                    <h2>🚀 Export Your CV</h2>
                    <p>Choose format and customization options for your professional CV</p>
                    <button class="export-modal-close" aria-label="Close export modal">×</button>
                </div>
                
                <div class="export-modal-body">
                    <div class="export-options-grid">
                        <!-- Format Selection -->
                        <div class="export-section">
                            <h3>📋 Export Format</h3>
                            <div class="format-grid">
                                <div class="format-option" data-format="pdf">
                                    <div class="format-icon">📄</div>
                                    <div class="format-info">
                                        <div class="format-name">PDF</div>
                                        <div class="format-desc">Professional document for sharing</div>
                                    </div>
                                    <div class="format-features">
                                        <span class="feature-tag">Universal</span>
                                        <span class="feature-tag">Print-ready</span>
                                    </div>
                                </div>
                                
                                <div class="format-option" data-format="docx">
                                    <div class="format-icon">📝</div>
                                    <div class="format-info">
                                        <div class="format-name">DOCX</div>
                                        <div class="format-desc">Editable Word document</div>
                                    </div>
                                    <div class="format-features">
                                        <span class="feature-tag">Editable</span>
                                        <span class="feature-tag">Customizable</span>
                                    </div>
                                </div>
                                
                                <div class="format-option" data-format="ats-text">
                                    <div class="format-icon">🤖</div>
                                    <div class="format-info">
                                        <div class="format-name">ATS Optimized</div>
                                        <div class="format-desc">Machine-readable format</div>
                                    </div>
                                    <div class="format-features">
                                        <span class="feature-tag">ATS-friendly</span>
                                        <span class="feature-tag">Keywords</span>
                                    </div>
                                </div>
                                
                                <div class="format-option" data-format="latex">
                                    <div class="format-icon">📐</div>
                                    <div class="format-info">
                                        <div class="format-name">LaTeX</div>
                                        <div class="format-desc">Academic/technical format</div>
                                    </div>
                                    <div class="format-features">
                                        <span class="feature-tag">Academic</span>
                                        <span class="feature-tag">Typography</span>
                                    </div>
                                </div>
                                
                                <div class="format-option" data-format="json">
                                    <div class="format-icon">🔧</div>
                                    <div class="format-info">
                                        <div class="format-name">JSON</div>
                                        <div class="format-desc">Structured data format</div>
                                    </div>
                                    <div class="format-features">
                                        <span class="feature-tag">Data</span>
                                        <span class="feature-tag">API-ready</span>
                                    </div>
                                </div>
                                
                                <div class="format-option" data-format="html">
                                    <div class="format-icon">🌐</div>
                                    <div class="format-info">
                                        <div class="format-name">HTML</div>
                                        <div class="format-desc">Web-ready format</div>
                                    </div>
                                    <div class="format-features">
                                        <span class="feature-tag">Web</span>
                                        <span class="feature-tag">Interactive</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Theme Selection -->
                        <div class="export-section">
                            <h3>🎨 Style Theme</h3>
                            <div class="theme-grid">
                                <div class="theme-option active" data-theme="professional">
                                    <div class="theme-preview professional-preview"></div>
                                    <div class="theme-name">Professional</div>
                                </div>
                                <div class="theme-option" data-theme="modern">
                                    <div class="theme-preview modern-preview"></div>
                                    <div class="theme-name">Modern</div>
                                </div>
                                <div class="theme-option" data-theme="minimal">
                                    <div class="theme-preview minimal-preview"></div>
                                    <div class="theme-name">Minimal</div>
                                </div>
                                <div class="theme-option" data-theme="executive">
                                    <div class="theme-preview executive-preview"></div>
                                    <div class="theme-name">Executive</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Content Options -->
                        <div class="export-section">
                            <h3>📚 Content Options</h3>
                            <div class="content-options">
                                <label class="option-checkbox">
                                    <input type="checkbox" name="includeProjects" checked>
                                    <span class="checkbox-custom"></span>
                                    <span class="option-label">Include Projects Portfolio</span>
                                </label>
                                <label class="option-checkbox">
                                    <input type="checkbox" name="includeAchievements" checked>
                                    <span class="checkbox-custom"></span>
                                    <span class="option-label">Include Achievements</span>
                                </label>
                                <label class="option-checkbox">
                                    <input type="checkbox" name="includeCertifications" checked>
                                    <span class="checkbox-custom"></span>
                                    <span class="option-label">Include Certifications</span>
                                </label>
                                <label class="option-checkbox">
                                    <input type="checkbox" name="includeVolunteer" checked>
                                    <span class="checkbox-custom"></span>
                                    <span class="option-label">Include Volunteer Work</span>
                                </label>
                                <label class="option-checkbox">
                                    <input type="checkbox" name="atsOptimized">
                                    <span class="checkbox-custom"></span>
                                    <span class="option-label">ATS Optimization Mode</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- ATS Score Display -->
                        <div class="export-section">
                            <h3>🎯 ATS Compatibility</h3>
                            <div class="ats-score-container">
                                <div class="ats-score-circle">
                                    <div class="score-value" id="ats-score-value">85</div>
                                    <div class="score-label">ATS Score</div>
                                </div>
                                <div class="ats-insights">
                                    <div class="insight-item">
                                        <span class="insight-icon">✅</span>
                                        <span class="insight-text">Keywords well distributed</span>
                                    </div>
                                    <div class="insight-item">
                                        <span class="insight-icon">⚠️</span>
                                        <span class="insight-text">Consider adding more industry terms</span>
                                    </div>
                                    <div class="insight-item">
                                        <span class="insight-icon">📊</span>
                                        <span class="insight-text">Format structure optimized</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Preview Section -->
                    <div class="export-preview-section">
                        <h3>👁️ Live Preview</h3>
                        <div class="preview-container">
                            <div class="preview-content" id="export-preview">
                                <div class="preview-loading">
                                    <div class="loading-spinner"></div>
                                    <div class="loading-text">Generating preview...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="export-modal-footer">
                    <div class="export-info">
                        <span class="export-size">Est. size: <span id="export-size">2.3 MB</span></span>
                        <span class="export-pages">Pages: <span id="export-pages">3</span></span>
                    </div>
                    <div class="export-actions">
                        <button class="btn-secondary" id="export-preview-btn">
                            <span class="btn-icon">👁️</span>
                            Preview
                        </button>
                        <button class="btn-primary" id="export-download-btn">
                            <span class="btn-icon">⬇️</span>
                            Download CV
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Setup event listeners for the export system
     */
    setupEventListeners() {
        // Export button click
        const exportToggle = document.getElementById('cv-export-toggle');
        exportToggle?.addEventListener('click', () => this.showExportModal());
        
        // Modal controls
        const modal = document.getElementById('cv-export-modal');
        const closeButton = modal?.querySelector('.export-modal-close');
        const backdrop = modal?.querySelector('.export-modal-backdrop');
        
        closeButton?.addEventListener('click', () => this.hideExportModal());
        backdrop?.addEventListener('click', () => this.hideExportModal());
        
        // Format selection
        modal?.addEventListener('click', (e) => {
            const formatOption = e.target.closest('.format-option');
            if (formatOption) {
                this.selectFormat(formatOption.dataset.format);
            }
            
            const themeOption = e.target.closest('.theme-option');
            if (themeOption) {
                this.selectTheme(themeOption.dataset.theme);
            }
        });
        
        // Content options
        modal?.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.updateContentOptions();
                this.updatePreview();
            }
        });
        
        // Export actions
        const previewBtn = document.getElementById('export-preview-btn');
        const downloadBtn = document.getElementById('export-download-btn');
        
        previewBtn?.addEventListener('click', () => this.previewCV());
        downloadBtn?.addEventListener('click', () => this.downloadCV());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.classList.contains('active')) {
                this.hideExportModal();
            }
        });
    }

    /**
     * Show the export modal
     */
    showExportModal() {
        const modal = document.getElementById('cv-export-modal');
        modal?.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update ATS score and preview
        this.calculateATSScore();
        this.updatePreview();
        
        // Focus management
        const firstFocusable = modal?.querySelector('.format-option');
        firstFocusable?.focus();
    }

    /**
     * Hide the export modal
     */
    hideExportModal() {
        const modal = document.getElementById('cv-export-modal');
        modal?.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Select export format
     */
    selectFormat(format) {
        // Update active state
        const formatOptions = document.querySelectorAll('.format-option');
        formatOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.format === format);
        });
        
        this.exportSettings.format = format;
        this.updatePreview();
        this.calculateATSScore();
        
        // Update format-specific options
        this.updateFormatSpecificOptions(format);
    }

    /**
     * Select style theme
     */
    selectTheme(theme) {
        // Update active state
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });
        
        this.exportSettings.theme = theme;
        this.updatePreview();
    }

    /**
     * Update content options from checkboxes
     */
    updateContentOptions() {
        const modal = document.getElementById('cv-export-modal');
        const checkboxes = modal?.querySelectorAll('input[type="checkbox"]');
        
        checkboxes?.forEach(checkbox => {
            this.exportSettings[checkbox.name] = checkbox.checked;
        });
    }

    /**
     * Update format-specific options
     */
    updateFormatSpecificOptions(format) {
        const atsSection = document.querySelector('.export-section:last-child');
        
        if (format === EXPORT_CONFIG.FORMATS.ATS_TEXT) {
            atsSection?.classList.add('highlighted');
            this.exportSettings.atsOptimized = true;
        } else {
            atsSection?.classList.remove('highlighted');
        }
    }

    /**
     * Calculate ATS compatibility score using advanced analyzer
     */
    calculateATSScore() {
        if (!this.cvData) return;
        
        try {
            // Check if advanced ATS analyzer is available
            if (typeof ATSAnalyzer !== 'undefined') {
                const analyzer = new ATSAnalyzer();
                const analysis = analyzer.analyzeCV(this.cvData, this.exportSettings.format);
                
                this.atsScore = analysis.overall_score;
                this.atsAnalysis = analysis; // Store full analysis for detailed insights
                this.updateATSScoreDisplay();
                this.updateDetailedATSInsights(analysis);
            } else {
                console.warn('ATSAnalyzer not available, using basic scoring');
                this.atsScore = this.calculateBasicATSScore();
                this.updateATSScoreDisplay();
            }
            
        } catch (error) {
            console.error('ATS scoring failed:', error);
            // Fallback to basic scoring
            this.atsScore = this.calculateBasicATSScore();
            this.updateATSScoreDisplay();
        }
    }

    /**
     * Fallback basic ATS scoring
     */
    calculateBasicATSScore() {
        let score = 0;
        let maxScore = 100;
        
        // Check keyword density
        const content = this.extractTextContent();
        const keywordMatches = this.countKeywordMatches(content);
        score += Math.min(keywordMatches * 2, 30); // Max 30 points for keywords
        
        // Check structure score
        score += this.calculateStructureScore(); // Max 25 points
        
        // Check format compatibility  
        score += this.calculateFormatScore(); // Max 20 points
        
        // Check content completeness
        score += this.calculateCompletenessScore(); // Max 25 points
        
        return Math.min(score, maxScore);
    }

    /**
     * Extract text content for ATS analysis
     */
    extractTextContent() {
        if (!this.cvData) return '';
        
        let content = '';
        content += this.cvData.professional_summary + ' ';
        content += this.cvData.experience?.map(exp => exp.description + ' ' + exp.achievements?.join(' ')).join(' ') + ' ';
        content += this.cvData.skills?.map(skill => skill.name + ' ' + skill.description).join(' ') + ' ';
        content += this.cvData.projects?.map(proj => proj.description + ' ' + proj.technologies?.join(' ')).join(' ') + ' ';
        
        return content.toLowerCase();
    }

    /**
     * Count keyword matches for ATS scoring
     */
    countKeywordMatches(content) {
        return EXPORT_CONFIG.ATS_KEYWORDS.filter(keyword => 
            content.includes(keyword.toLowerCase())
        ).length;
    }

    /**
     * Calculate structure score for ATS compatibility
     */
    calculateStructureScore() {
        let score = 0;
        
        // Check for required sections
        if (this.cvData.personal_info) score += 5;
        if (this.cvData.professional_summary) score += 5;
        if (this.cvData.experience?.length > 0) score += 5;
        if (this.cvData.skills?.length > 0) score += 5;
        if (this.cvData.education?.length > 0) score += 5;
        
        return score;
    }

    /**
     * Calculate format compatibility score
     */
    calculateFormatScore() {
        const format = this.exportSettings.format;
        
        switch (format) {
            case EXPORT_CONFIG.FORMATS.ATS_TEXT:
                return 20; // Perfect for ATS
            case EXPORT_CONFIG.FORMATS.PDF:
                return 15; // Good for ATS
            case EXPORT_CONFIG.FORMATS.DOCX:
                return 18; // Very good for ATS
            case EXPORT_CONFIG.FORMATS.HTML:
                return 10; // Moderate for ATS
            default:
                return 5; // Limited ATS compatibility
        }
    }

    /**
     * Calculate content completeness score
     */
    calculateCompletenessScore() {
        let score = 0;
        
        if (this.exportSettings.includeProjects) score += 5;
        if (this.exportSettings.includeAchievements) score += 5;
        if (this.exportSettings.includeCertifications) score += 5;
        if (this.cvData.certifications?.length > 0) score += 5;
        if (this.cvData.volunteer_work?.length > 0) score += 5;
        
        return score;
    }

    /**
     * Update ATS score display
     */
    updateATSScoreDisplay() {
        const scoreElement = document.getElementById('ats-score-value');
        if (scoreElement) {
            scoreElement.textContent = this.atsScore;
            
            // Update score circle color based on score
            const circle = scoreElement.parentElement;
            circle.className = 'ats-score-circle';
            
            if (this.atsScore >= 80) circle.classList.add('score-excellent');
            else if (this.atsScore >= 60) circle.classList.add('score-good');
            else if (this.atsScore >= 40) circle.classList.add('score-fair');
            else circle.classList.add('score-poor');
        }
        
        this.updateATSInsights();
    }

    /**
     * Update detailed ATS insights from analysis
     */
    updateDetailedATSInsights(analysis) {
        if (!analysis) {
            this.updateBasicATSInsights();
            return;
        }

        const insights = [];
        
        // Overall compatibility
        if (analysis.overall_score >= 80) {
            insights.push({ 
                icon: '✅', 
                text: `Excellent ATS compatibility (${analysis.overall_score}/100)`,
                type: 'success'
            });
        } else if (analysis.overall_score >= 60) {
            insights.push({ 
                icon: '👍', 
                text: `Good ATS compatibility (${analysis.overall_score}/100)`,
                type: 'good'
            });
        } else {
            insights.push({ 
                icon: '⚠️', 
                text: `ATS compatibility needs improvement (${analysis.overall_score}/100)`,
                type: 'warning'
            });
        }

        // Keyword analysis insights
        if (analysis.keyword_analysis && analysis.keyword_analysis.by_category) {
            const totalKeywords = Object.values(analysis.keyword_analysis.by_category)
                .reduce((sum, cat) => sum + cat.found.length, 0);
            insights.push({ 
                icon: '🎯', 
                text: `${totalKeywords} relevant keywords detected`,
                type: 'info'
            });
        }

        // Format compatibility
        if (analysis.format_compatibility) {
            const compatibility = analysis.format_compatibility.compatibility || 'Unknown';
            insights.push({ 
                icon: '📄', 
                text: `Format compatibility: ${compatibility}`,
                type: 'info'
            });
        }

        // Top recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            const topRec = analysis.recommendations[0];
            insights.push({ 
                icon: '💡', 
                text: topRec.description || 'Optimization opportunities available',
                type: 'recommendation'
            });
        }

        // Update insights display
        this.displayInsights(insights);
    }

    /**
     * Update basic ATS insights (fallback)
     */
    updateBasicATSInsights() {
        const insights = [];
        
        if (this.atsScore >= 80) {
            insights.push({ icon: '✅', text: 'Excellent ATS compatibility', type: 'success' });
            insights.push({ icon: '🎯', text: 'Keywords well optimized', type: 'success' });
        } else if (this.atsScore >= 60) {
            insights.push({ icon: '👍', text: 'Good ATS compatibility', type: 'good' });
            insights.push({ icon: '📝', text: 'Consider adding more keywords', type: 'info' });
        } else {
            insights.push({ icon: '⚠️', text: 'ATS compatibility needs improvement', type: 'warning' });
            insights.push({ icon: '🔧', text: 'Optimize format and keywords', type: 'warning' });
        }
        
        insights.push({ 
            icon: '📊', 
            text: `${this.countKeywordMatches(this.extractTextContent())} industry keywords found`,
            type: 'info'
        });
        
        this.displayInsights(insights);
    }

    /**
     * Display insights in the UI
     */
    displayInsights(insights) {
        const insightsContainer = document.querySelector('.ats-insights');
        if (insightsContainer) {
            insightsContainer.innerHTML = insights.map(insight => `
                <div class="insight-item ${insight.type || ''}">
                    <span class="insight-icon">${insight.icon}</span>
                    <span class="insight-text">${insight.text}</span>
                </div>
            `).join('');
        }
    }

    /**
     * Legacy method name for compatibility
     */
    updateATSInsights() {
        if (this.atsAnalysis) {
            this.updateDetailedATSInsights(this.atsAnalysis);
        } else {
            this.updateBasicATSInsights();
        }
    }

    /**
     * Initialize preview system
     */
    initializePreviewSystem() {
        this.updatePreview();
    }

    /**
     * Update live preview
     */
    async updatePreview() {
        const previewContainer = document.getElementById('export-preview');
        if (!previewContainer || !this.cvData) return;
        
        previewContainer.innerHTML = `
            <div class="preview-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Updating preview...</div>
            </div>
        `;
        
        try {
            // Simulate preview generation
            setTimeout(() => {
                const previewContent = this.generatePreviewContent();
                previewContainer.innerHTML = previewContent;
                this.updateExportMetrics();
            }, 500);
            
        } catch (error) {
            console.error('Preview generation failed:', error);
            previewContainer.innerHTML = `
                <div class="preview-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">Preview generation failed</div>
                </div>
            `;
        }
    }

    /**
     * Generate preview content based on current settings
     */
    generatePreviewContent() {
        const format = this.exportSettings.format;
        const theme = this.exportSettings.theme;
        
        switch (format) {
            case EXPORT_CONFIG.FORMATS.PDF:
                return this.generatePDFPreview();
            case EXPORT_CONFIG.FORMATS.DOCX:
                return this.generateDOCXPreview();
            case EXPORT_CONFIG.FORMATS.ATS_TEXT:
                return this.generateATSPreview();
            case EXPORT_CONFIG.FORMATS.LATEX:
                return this.generateLaTeXPreview();
            case EXPORT_CONFIG.FORMATS.JSON:
                return this.generateJSONPreview();
            case EXPORT_CONFIG.FORMATS.HTML:
                return this.generateHTMLPreview();
            default:
                return this.generateDefaultPreview();
        }
    }

    /**
     * Generate PDF preview
     */
    generatePDFPreview() {
        return `
            <div class="preview-pdf ${this.exportSettings.theme}">
                <div class="pdf-page">
                    <div class="pdf-header">
                        <h1>${this.cvData.personal_info.name}</h1>
                        <h2>${this.cvData.personal_info.title}</h2>
                        <div class="contact-info">
                            <span>${this.cvData.personal_info.email}</span>
                            <span>${this.cvData.personal_info.location}</span>
                        </div>
                    </div>
                    
                    <div class="pdf-section">
                        <h3>Professional Summary</h3>
                        <p>${this.cvData.professional_summary.substring(0, 200)}...</p>
                    </div>
                    
                    <div class="pdf-section">
                        <h3>Experience</h3>
                        ${this.cvData.experience.slice(0, 2).map(exp => `
                            <div class="experience-item">
                                <h4>${exp.position}</h4>
                                <div class="company">${exp.company}</div>
                                <div class="period">${exp.period}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="pdf-section">
                        <h3>Key Skills</h3>
                        <div class="skills-grid">
                            ${this.cvData.skills.slice(0, 8).map(skill => `
                                <span class="skill-tag">${skill.name}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate DOCX preview
     */
    generateDOCXPreview() {
        return `
            <div class="preview-docx ${this.exportSettings.theme}">
                <div class="docx-document">
                    <div class="docx-header">
                        <h1>${this.cvData.personal_info.name}</h1>
                        <p class="title">${this.cvData.personal_info.title}</p>
                        <p class="contact">${this.cvData.personal_info.email} | ${this.cvData.personal_info.location}</p>
                    </div>
                    
                    <div class="docx-content">
                        <h2>Professional Summary</h2>
                        <p>${this.cvData.professional_summary.substring(0, 150)}...</p>
                        
                        <h2>Experience</h2>
                        <ul>
                            ${this.cvData.experience.slice(0, 3).map(exp => `
                                <li><strong>${exp.position}</strong> at ${exp.company} (${exp.period})</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate ATS-optimized text preview
     */
    generateATSPreview() {
        const keywords = this.countKeywordMatches(this.extractTextContent());
        
        return `
            <div class="preview-ats">
                <div class="ats-header">
                    <h3>🤖 ATS-Optimized Format</h3>
                    <div class="ats-stats">
                        <span class="stat">Keywords: ${keywords}</span>
                        <span class="stat">Score: ${this.atsScore}/100</span>
                    </div>
                </div>
                
                <div class="ats-content">
                    <div class="ats-section">
                        <strong>NAME:</strong> ${this.cvData.personal_info.name}
                    </div>
                    <div class="ats-section">
                        <strong>TITLE:</strong> ${this.cvData.personal_info.title}
                    </div>
                    <div class="ats-section">
                        <strong>CONTACT:</strong> ${this.cvData.personal_info.email}
                    </div>
                    <div class="ats-section">
                        <strong>SUMMARY:</strong> ${this.cvData.professional_summary.substring(0, 200)}...
                    </div>
                    <div class="ats-section">
                        <strong>SKILLS:</strong> ${this.cvData.skills.slice(0, 10).map(s => s.name).join(', ')}
                    </div>
                </div>
                
                <div class="ats-keywords">
                    <h4>🎯 Detected Keywords:</h4>
                    <div class="keyword-cloud">
                        ${EXPORT_CONFIG.ATS_KEYWORDS.filter(keyword => 
                            this.extractTextContent().includes(keyword.toLowerCase())
                        ).slice(0, 15).map(keyword => `
                            <span class="keyword-tag">${keyword}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate LaTeX preview
     */
    generateLaTeXPreview() {
        return `
            <div class="preview-latex">
                <div class="latex-code">
                    <pre><code>\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}

\\begin{document}

\\title{${this.cvData.personal_info.name}}
\\author{${this.cvData.personal_info.title}}
\\date{}
\\maketitle

\\section{Professional Summary}
${this.cvData.professional_summary.substring(0, 150)}...

\\section{Experience}
\\begin{itemize}
${this.cvData.experience.slice(0, 2).map(exp => `
    \\item \\textbf{${exp.position}} - ${exp.company} (${exp.period})
`).join('')}
\\end{itemize}

\\end{document}</code></pre>
                </div>
            </div>
        `;
    }

    /**
     * Generate JSON preview
     */
    generateJSONPreview() {
        const previewData = {
            personal_info: this.cvData.personal_info,
            professional_summary: this.cvData.professional_summary.substring(0, 100) + '...',
            experience: this.cvData.experience.slice(0, 2),
            skills: this.cvData.skills.slice(0, 5)
        };
        
        return `
            <div class="preview-json">
                <pre><code>${JSON.stringify(previewData, null, 2)}</code></pre>
            </div>
        `;
    }

    /**
     * Generate HTML preview
     */
    generateHTMLPreview() {
        return `
            <div class="preview-html ${this.exportSettings.theme}">
                <div class="html-document">
                    <header>
                        <h1>${this.cvData.personal_info.name}</h1>
                        <p class="tagline">${this.cvData.personal_info.tagline}</p>
                    </header>
                    
                    <section class="summary">
                        <h2>About</h2>
                        <p>${this.cvData.professional_summary.substring(0, 200)}...</p>
                    </section>
                    
                    <section class="experience">
                        <h2>Experience</h2>
                        ${this.cvData.experience.slice(0, 2).map(exp => `
                            <div class="exp-item">
                                <h3>${exp.position}</h3>
                                <p class="company">${exp.company} • ${exp.period}</p>
                            </div>
                        `).join('')}
                    </section>
                </div>
            </div>
        `;
    }

    /**
     * Generate default preview
     */
    generateDefaultPreview() {
        return `
            <div class="preview-default">
                <div class="preview-placeholder">
                    <div class="placeholder-icon">📄</div>
                    <div class="placeholder-text">Preview will appear here</div>
                </div>
            </div>
        `;
    }

    /**
     * Update export metrics (size, pages)
     */
    updateExportMetrics() {
        const format = this.exportSettings.format;
        let estimatedSize = '2.3 MB';
        let estimatedPages = 3;
        
        // Estimate based on format and content
        switch (format) {
            case EXPORT_CONFIG.FORMATS.PDF:
                estimatedSize = '1.8 MB';
                estimatedPages = 3;
                break;
            case EXPORT_CONFIG.FORMATS.DOCX:
                estimatedSize = '845 KB';
                estimatedPages = 3;
                break;
            case EXPORT_CONFIG.FORMATS.ATS_TEXT:
                estimatedSize = '12 KB';
                estimatedPages = 2;
                break;
            case EXPORT_CONFIG.FORMATS.LATEX:
                estimatedSize = '25 KB';
                estimatedPages = 3;
                break;
            case EXPORT_CONFIG.FORMATS.JSON:
                estimatedSize = '18 KB';
                estimatedPages = 1;
                break;
            case EXPORT_CONFIG.FORMATS.HTML:
                estimatedSize = '125 KB';
                estimatedPages = 1;
                break;
        }
        
        // Adjust for content options
        if (!this.exportSettings.includeProjects) {
            estimatedPages -= 1;
            estimatedSize = (parseFloat(estimatedSize) * 0.7).toFixed(1) + estimatedSize.slice(-2);
        }
        
        const sizeElement = document.getElementById('export-size');
        const pagesElement = document.getElementById('export-pages');
        
        if (sizeElement) sizeElement.textContent = estimatedSize;
        if (pagesElement) pagesElement.textContent = estimatedPages;
    }

    /**
     * Preview CV in new window
     */
    async previewCV() {
        try {
            const content = await this.generateFullContent();
            const previewWindow = window.open('', '_blank', 'width=800,height=1000');
            
            if (previewWindow) {
                previewWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>CV Preview - ${this.cvData.personal_info.name}</title>
                        <style>${await this.getPreviewStyles()}</style>
                    </head>
                    <body>
                        ${content}
                    </body>
                    </html>
                `);
                previewWindow.document.close();
            } else {
                alert('Please allow popups to view the preview');
            }
        } catch (error) {
            console.error('Preview failed:', error);
            alert('Preview generation failed. Please try again.');
        }
    }

    /**
     * Download CV in selected format
     */
    async downloadCV() {
        const downloadBtn = document.getElementById('export-download-btn');
        const originalContent = downloadBtn.innerHTML;
        
        try {
            // Update button state
            downloadBtn.innerHTML = `
                <span class="btn-icon">⏳</span>
                Generating...
            `;
            downloadBtn.disabled = true;
            
            const format = this.exportSettings.format;
            const content = await this.generateFullContent();
            
            switch (format) {
                case EXPORT_CONFIG.FORMATS.PDF:
                    await this.downloadPDF(content);
                    break;
                case EXPORT_CONFIG.FORMATS.DOCX:
                    await this.downloadDOCX(content);
                    break;
                case EXPORT_CONFIG.FORMATS.ATS_TEXT:
                    this.downloadText(content);
                    break;
                case EXPORT_CONFIG.FORMATS.LATEX:
                    this.downloadLaTeX(content);
                    break;
                case EXPORT_CONFIG.FORMATS.JSON:
                    this.downloadJSON();
                    break;
                case EXPORT_CONFIG.FORMATS.HTML:
                    this.downloadHTML(content);
                    break;
            }
            
            // Track export
            this.trackExport(format);
            
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        } finally {
            // Restore button state
            downloadBtn.innerHTML = originalContent;
            downloadBtn.disabled = false;
        }
    }

    /**
     * Generate full content for export using template engine
     */
    async generateFullContent() {
        if (!this.cvData) {
            throw new Error('CV data not loaded');
        }
        
        const format = this.exportSettings.format;
        
        try {
            // Check if template engine is available
            if (typeof CVTemplateEngine !== 'undefined') {
                const templateEngine = new CVTemplateEngine(this.cvData);
                switch (format) {
                    case EXPORT_CONFIG.FORMATS.ATS_TEXT:
                        return templateEngine.generateCV('ats-text', this.exportSettings);
                    case EXPORT_CONFIG.FORMATS.HTML:
                        return templateEngine.generateCV('html', {
                            ...this.exportSettings,
                            theme: this.exportSettings.theme,
                            responsive: true
                        });
                    case EXPORT_CONFIG.FORMATS.LATEX:
                        return templateEngine.generateCV('latex', this.exportSettings);
                    case EXPORT_CONFIG.FORMATS.JSON:
                        return templateEngine.generateCV('json', this.exportSettings);
                    default:
                        // Fallback to HTML template for PDF and DOCX
                        return templateEngine.generateCV('html', {
                            ...this.exportSettings,
                            theme: this.exportSettings.theme,
                            responsive: false
                        });
                }
            } else {
                console.warn('CVTemplateEngine not available, using basic template');
                return this.generateBasicTemplate();
            }
        } catch (error) {
            console.error('Template generation failed:', error);
            // Fallback to basic template
            return this.generateBasicTemplate();
        }
    }

    /**
     * Fallback basic template
     */
    generateBasicTemplate() {
        return `
            <div class="cv-export ${this.exportSettings.theme}">
                <header class="cv-header">
                    <h1>${this.cvData.personal_info.name}</h1>
                    <h2>${this.cvData.personal_info.title}</h2>
                    <div class="contact-info">
                        <span>${this.cvData.personal_info.email}</span>
                        <span>${this.cvData.personal_info.location}</span>
                        <span>${this.cvData.personal_info.website}</span>
                    </div>
                </header>

                <section class="cv-summary">
                    <h3>Professional Summary</h3>
                    <p>${this.cvData.professional_summary}</p>
                </section>

                <section class="cv-experience">
                    <h3>Experience</h3>
                    ${this.cvData.experience.map(exp => `
                        <div class="experience-item">
                            <h4>${exp.position}</h4>
                            <div class="company-info">
                                <span class="company">${exp.company}</span>
                                <span class="period">${exp.period}</span>
                            </div>
                            <p class="description">${exp.description}</p>
                            ${exp.achievements ? `
                                <ul class="achievements">
                                    ${exp.achievements.map(achievement => `
                                        <li>${achievement}</li>
                                    `).join('')}
                                </ul>
                            ` : ''}
                            ${exp.technologies ? `
                                <div class="technologies">
                                    <strong>Technologies:</strong> ${exp.technologies.join(', ')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>

                ${this.exportSettings.includeProjects ? `
                    <section class="cv-projects">
                        <h3>Key Projects</h3>
                        ${this.cvData.projects.map(project => `
                            <div class="project-item">
                                <h4>${project.name}</h4>
                                <p class="project-description">${project.description}</p>
                                ${project.technologies ? `
                                    <div class="project-technologies">
                                        <strong>Technologies:</strong> ${project.technologies.join(', ')}
                                    </div>
                                ` : ''}
                                ${project.metrics ? `
                                    <div class="project-metrics">
                                        ${project.metrics.map(metric => `
                                            <span class="metric">${metric.label}: ${metric.value}</span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                <section class="cv-skills">
                    <h3>Technical Skills</h3>
                    <div class="skills-grid">
                        ${this.cvData.skills.map(skill => `
                            <div class="skill-item">
                                <span class="skill-name">${skill.name}</span>
                                <span class="skill-level">${skill.proficiency}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>

                ${this.exportSettings.includeAchievements && this.cvData.achievements ? `
                    <section class="cv-achievements">
                        <h3>Key Achievements</h3>
                        ${this.cvData.achievements.map(achievement => `
                            <div class="achievement-item">
                                <span class="achievement-icon">${achievement.icon}</span>
                                <div class="achievement-content">
                                    <h4>${achievement.title}</h4>
                                    <p>${achievement.description}</p>
                                    <span class="achievement-date">${achievement.date}</span>
                                </div>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                <section class="cv-education">
                    <h3>Education</h3>
                    ${this.cvData.education.map(edu => `
                        <div class="education-item">
                            <h4>${edu.degree}</h4>
                            <div class="institution">${edu.institution}</div>
                            <div class="period">${edu.period}</div>
                            ${edu.key_areas ? `
                                <div class="key-areas">
                                    <strong>Key Areas:</strong> ${edu.key_areas.join(', ')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>
            </div>
        `;
    }

    /**
     * Get preview styles for full content
     */
    async getPreviewStyles() {
        return `
            body {
                font-family: 'Inter', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #fff;
            }

            .cv-export {
                background: white;
                padding: 40px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }

            .cv-header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #2563eb;
            }

            .cv-header h1 {
                font-size: 2.5em;
                margin: 0;
                color: #1a1a1a;
            }

            .cv-header h2 {
                font-size: 1.3em;
                color: #2563eb;
                margin: 10px 0;
                font-weight: 500;
            }

            .contact-info {
                display: flex;
                justify-content: center;
                gap: 20px;
                flex-wrap: wrap;
                margin-top: 15px;
                font-size: 0.95em;
                color: #666;
            }

            section {
                margin-bottom: 35px;
            }

            section h3 {
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

            .experience-item:last-child,
            .project-item:last-child,
            .education-item:last-child {
                border-bottom: none;
            }

            .experience-item h4, .project-item h4, .education-item h4 {
                font-size: 1.2em;
                color: #1a1a1a;
                margin: 0 0 8px 0;
            }

            .company-info, .institution {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                font-weight: 500;
                color: #2563eb;
            }

            .period {
                font-size: 0.9em;
                color: #666;
                font-weight: normal;
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

            .technologies, .project-technologies {
                font-size: 0.9em;
                color: #666;
                font-style: italic;
            }

            .skills-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
            }

            .skill-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #f1f5f9;
            }

            .skill-name {
                font-weight: 500;
            }

            .skill-level {
                font-size: 0.9em;
                color: #2563eb;
                font-weight: 500;
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

            .achievement-icon {
                font-size: 1.5em;
                flex-shrink: 0;
            }

            .achievement-content h4 {
                margin: 0 0 8px 0;
                color: #1a1a1a;
            }

            .achievement-content p {
                margin: 0 0 8px 0;
                color: #4a5568;
                line-height: 1.6;
            }

            .achievement-date {
                font-size: 0.9em;
                color: #666;
                font-weight: 500;
            }

            .key-areas {
                margin-top: 10px;
                font-size: 0.95em;
                color: #4a5568;
            }

            /* Theme variations */
            .cv-export.modern {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .cv-export.modern .cv-header {
                border-bottom-color: white;
            }

            .cv-export.modern h3 {
                color: white;
                border-bottom-color: rgba(255,255,255,0.3);
            }

            .cv-export.minimal {
                font-family: 'Georgia', serif;
                color: #2d3748;
            }

            .cv-export.minimal .cv-header h1 {
                font-weight: normal;
            }

            .cv-export.executive {
                background: #1a1a1a;
                color: #e2e8f0;
            }

            .cv-export.executive .cv-header {
                border-bottom-color: #4a5568;
            }

            .cv-export.executive h3 {
                color: #e2e8f0;
                border-bottom-color: #4a5568;
            }

            @media print {
                body {
                    padding: 0;
                }
                
                .cv-export {
                    box-shadow: none;
                    padding: 20px;
                }
            }
        `;
    }

    // Download methods for different formats
    async downloadPDF(content) {
        // For a full implementation, you'd use a library like jsPDF or Puppeteer
        // For now, we'll create a simple HTML-to-PDF solution
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>CV - ${this.cvData.personal_info.name}</title>
                <style>${await this.getPreviewStyles()}</style>
                <style>
                    @media print {
                        @page { margin: 0.5in; }
                        body { -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                ${content}
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    async downloadDOCX(content) {
        // For DOCX, you'd typically use a library like docx or html-docx-js
        // This is a simplified version
        const docxContent = this.convertToWordFormat(content);
        this.downloadFile(docxContent, `${this.cvData.personal_info.name}_CV.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    downloadText(content) {
        const textContent = this.convertToATSFormat();
        this.downloadFile(textContent, `${this.cvData.personal_info.name}_CV_ATS.txt`, 'text/plain');
    }

    downloadLaTeX(content) {
        const latexContent = this.convertToLaTeXFormat();
        this.downloadFile(latexContent, `${this.cvData.personal_info.name}_CV.tex`, 'text/plain');
    }

    downloadJSON() {
        const jsonContent = JSON.stringify(this.cvData, null, 2);
        this.downloadFile(jsonContent, `${this.cvData.personal_info.name}_CV.json`, 'application/json');
    }

    downloadHTML(content) {
        const fullHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CV - ${this.cvData.personal_info.name}</title>
                <style>${this.getExportStyles()}</style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
        this.downloadFile(fullHTML, `${this.cvData.personal_info.name}_CV.html`, 'text/html');
    }

    /**
     * Convert content to ATS-optimized format
     */
    convertToATSFormat() {
        return `
${this.cvData.personal_info.name}
${this.cvData.personal_info.title}

CONTACT INFORMATION
Email: ${this.cvData.personal_info.email}
Location: ${this.cvData.personal_info.location}
Website: ${this.cvData.personal_info.website}
LinkedIn: ${this.cvData.personal_info.linkedin}
GitHub: ${this.cvData.personal_info.github}

PROFESSIONAL SUMMARY
${this.cvData.professional_summary}

EXPERIENCE
${this.cvData.experience.map(exp => `
${exp.position}
${exp.company} | ${exp.period}
${exp.description}

Key Achievements:
${exp.achievements ? exp.achievements.map(achievement => `• ${achievement}`).join('\n') : ''}

Technologies: ${exp.technologies ? exp.technologies.join(', ') : ''}
`).join('\n')}

TECHNICAL SKILLS
${this.cvData.skills.map(skill => `${skill.name} (${skill.proficiency})`).join(' | ')}

${this.exportSettings.includeProjects ? `
KEY PROJECTS
${this.cvData.projects.map(project => `
${project.name}
${project.description}
Technologies: ${project.technologies ? project.technologies.join(', ') : ''}
${project.metrics ? project.metrics.map(metric => `${metric.label}: ${metric.value}`).join(' | ') : ''}
`).join('\n')}
` : ''}

${this.exportSettings.includeAchievements ? `
ACHIEVEMENTS
${this.cvData.achievements ? this.cvData.achievements.map(achievement => `
${achievement.title} (${achievement.date})
${achievement.description}
`).join('\n') : ''}
` : ''}

EDUCATION
${this.cvData.education.map(edu => `
${edu.degree}
${edu.institution} | ${edu.period}
${edu.key_areas ? `Key Areas: ${edu.key_areas.join(', ')}` : ''}
`).join('\n')}

KEYWORDS: ${EXPORT_CONFIG.ATS_KEYWORDS.filter(keyword => 
    this.extractTextContent().includes(keyword.toLowerCase())
).join(', ')}
        `.trim();
    }

    /**
     * Convert content to LaTeX format
     */
    convertToLaTeXFormat() {
        return `
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}

\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.75]{geometry}

\\name{${this.cvData.personal_info.name.split(' ')[0]}}{${this.cvData.personal_info.name.split(' ').slice(1).join(' ')}}
\\title{${this.cvData.personal_info.title}}
\\address{${this.cvData.personal_info.location}}
\\email{${this.cvData.personal_info.email}}
\\homepage{${this.cvData.personal_info.website}}

\\begin{document}
\\makecvtitle

\\section{Professional Summary}
${this.cvData.professional_summary}

\\section{Experience}
${this.cvData.experience.map(exp => `
\\cventry{${exp.period}}{${exp.position}}{${exp.company}}{}{}{
${exp.description}
\\begin{itemize}
${exp.achievements ? exp.achievements.map(achievement => `\\item ${achievement}`).join('\n') : ''}
\\end{itemize}
Technologies: ${exp.technologies ? exp.technologies.join(', ') : ''}
}
`).join('')}

\\section{Technical Skills}
${this.cvData.skills.map(skill => `
\\cvitem{${skill.category}}{${skill.name} (${skill.proficiency})}
`).join('')}

${this.exportSettings.includeProjects ? `
\\section{Key Projects}
${this.cvData.projects.map(project => `
\\cvitem{${project.name}}{${project.description}}
`).join('')}
` : ''}

\\section{Education}
${this.cvData.education.map(edu => `
\\cventry{${edu.period}}{${edu.degree}}{${edu.institution}}{}{}{
${edu.key_areas ? `Key Areas: ${edu.key_areas.join(', ')}` : ''}
}
`).join('')}

\\end{document}
        `.trim();
    }

    /**
     * Convert content to Word-compatible format
     */
    convertToWordFormat(content) {
        // This would require a proper DOCX library
        // For now, return HTML that can be saved as DOC
        return content;
    }

    /**
     * Get export-specific styles
     */
    getExportStyles() {
        // Return compressed CSS for exports
        return `body{font-family:Inter,Arial,sans-serif;line-height:1.6;color:#333;max-width:800px;margin:0 auto;padding:20px;background:#fff}.cv-export{background:white;padding:40px}.cv-header{text-align:center;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #2563eb}.cv-header h1{font-size:2.5em;margin:0;color:#1a1a1a}.cv-header h2{font-size:1.3em;color:#2563eb;margin:10px 0;font-weight:500}`;
    }

    /**
     * Generic file download helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Track export for analytics
     */
    trackExport(format) {
        this.exportHistory.push({
            format: format,
            timestamp: new Date().toISOString(),
            settings: { ...this.exportSettings }
        });
        
        // Store in localStorage for persistence
        localStorage.setItem('cv-export-history', JSON.stringify(this.exportHistory));
        
        console.log(`📊 Export tracked: ${format}`);
    }

    /**
     * Handle errors gracefully
     */
    handleError(error) {
        console.error('CV Export System Error:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'export-error-toast';
        errorMessage.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">Export system error. Please refresh and try again.</span>
                <button class="error-close">×</button>
            </div>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        }, 5000);
        
        // Close button
        errorMessage.querySelector('.error-close')?.addEventListener('click', () => {
            if (errorMessage.parentNode) {
                errorMessage.parentNode.removeChild(errorMessage);
            }
        });
    }

    /**
     * Get fallback CV data when loading fails
     */
    getFallbackCVData() {
        return {
            personal_info: {
                name: "Adrian Wedd",
                title: "AI Engineer & Software Architect",
                email: "contact@example.com",
                location: "Hobart, Tasmania",
                website: "https://example.com"
            },
            professional_summary: "Experienced software engineer specializing in AI systems and full-stack development.",
            experience: [
                {
                    position: "Software Engineer",
                    company: "Technology Company",
                    period: "2020 - Present",
                    description: "Full-stack development and AI system implementation.",
                    achievements: ["Built scalable applications", "Implemented AI solutions"],
                    technologies: ["JavaScript", "Python", "React", "Node.js"]
                }
            ],
            skills: [
                { name: "JavaScript", category: "Programming", proficiency: "Expert" },
                { name: "Python", category: "Programming", proficiency: "Advanced" },
                { name: "React", category: "Frontend", proficiency: "Expert" },
                { name: "Node.js", category: "Backend", proficiency: "Advanced" }
            ],
            projects: [
                {
                    name: "AI-Enhanced CV System",
                    description: "Automated CV generation with AI content optimization.",
                    technologies: ["JavaScript", "AI", "GitHub Actions"]
                }
            ],
            education: [
                {
                    degree: "Bachelor of Computer Science",
                    institution: "University of Technology",
                    period: "2016-2020"
                }
            ]
        };
    }
}

// Initialize the export system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.cvExportSystem) {
        window.cvExportSystem = new CVExportSystem();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CVExportSystem;
}