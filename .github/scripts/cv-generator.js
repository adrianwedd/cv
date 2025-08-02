#!/usr/bin/env node

/**
 * CV Website Generator
 * 
 * Generates the complete CV website by combining base CV data, GitHub activity
 * metrics, and AI enhancements into a production-ready static site.
 * 
 * Features:
 * - Dynamic content compilation from multiple data sources
 * - Responsive HTML generation with optimized assets
 * - GitHub Pages deployment preparation
 * - SEO optimization and meta tag generation
 * - Performance optimization and asset bundling
 * 
 * Usage: node cv-generator.js
 * Output: ./dist/ directory with complete website
 */

const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const path = require('path');
const Handlebars = require('handlebars');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

// Determine root directory by checking for project-specific files
// We look for index.html as the definitive indicator of project root
let rootPrefix = '.';

// Check if index.html exists in current directory (we're in project root)
if (require('fs').existsSync(path.join(process.cwd(), 'index.html'))) {
    rootPrefix = '.';
} else if (require('fs').existsSync(path.join(process.cwd(), '../../index.html'))) {
    // We're likely in .github/scripts
    rootPrefix = '../..';
} else {
    // Try to find index.html by walking up the directory tree
    let currentDir = process.cwd();
    let levelsUp = 0;
    while (levelsUp < 5) {
        if (require('fs').existsSync(path.join(currentDir, 'index.html'))) {
            rootPrefix = '../'.repeat(levelsUp) || '.';
            break;
        }
        currentDir = path.dirname(currentDir);
        levelsUp++;
    }
}

// Configuration
const CONFIG = {
    INPUT_DIR: rootPrefix,
    OUTPUT_DIR: path.join(rootPrefix, 'dist'),
    DATA_DIR: path.join(rootPrefix, 'data'),
    ASSETS_DIR: path.join(rootPrefix, 'assets'),
    TEMPLATE_FILE: 'template.html',
    SITE_URL: 'https://adrianwedd.github.io/cv',
    GITHUB_USERNAME: 'adrianwedd'
};

/**
 * CV Website Generator
 * 
 * Compiles all CV data sources into a production-ready website
 */
class CVGenerator {
    constructor() {
        this.generationStartTime = Date.now();
        this.cvData = {};
        this.activityData = {};
        this.aiEnhancements = {};
    }

    /**
     * Generate complete CV website
     */
    async generate() {
        console.log('🎨 **CV WEBSITE GENERATOR INITIATED**');
        console.log(`📁 Output directory: ${CONFIG.OUTPUT_DIR}`);
        console.log('');

        try {
            // Prepare output directory
            await this.prepareOutputDirectory();

            // Load all data sources
            await this.loadDataSources();

            // Generate website components
            await this.generateHTML();
            await this.copyAssets();
            await this.copyNetworkingDashboard();
            await this.generatePDF();
            await this.generateATSCV();
            await this.generateDOCXCV(); // New call for DOCX CV
            await this.generateLaTeXCV(); // New call for LaTeX CV
            await this.generateSitemap();
            await this.generateRobotsTxt();
            await this.generateManifest();

            // Generate additional files for GitHub Pages
            await this.generateGitHubPagesFiles();

            const generationTime = ((Date.now() - this.generationStartTime) / 1000).toFixed(2);
            console.log(`✅ CV website generated in ${generationTime}s`);
            console.log(`🌐 Website ready at: ${CONFIG.OUTPUT_DIR}/`);
            console.log(`🚀 Deploy to: ${CONFIG.SITE_URL}`);

        } catch (genError) {
            console.error('❌ Website generation failed:', genError.message);
            throw genError;
        }
    }

    /**
     * Prepare output directory
     */
    async prepareOutputDirectory() {
        console.log('📁 Preparing output directory...');
        
        try {
            // Remove existing directory
            await fs.rm(CONFIG.OUTPUT_DIR, { recursive: true, force: true });
            
            // Create fresh directory
            await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
            
            console.log(`✅ Output directory prepared: ${CONFIG.OUTPUT_DIR}`);
        } catch (error) {
            console.error('❌ Failed to prepare output directory:', error.message);
            throw error;
        }
    }

    /**
     * Load all data sources with validation and fallback mechanisms
     */
    async loadDataSources() {
        console.log('📊 Loading data sources...');

        try {
            // Load base CV data
            try {
                const cvDataPath = path.join(CONFIG.DATA_DIR, 'base-cv.json');
                const cvDataContent = await fs.readFile(cvDataPath, 'utf8');
                this.cvData = JSON.parse(cvDataContent);
                this.validateCVData();
                console.log('✅ Base CV data loaded and validated');
            } catch {
                console.warn('⚠️ Base CV data not found, using defaults');
                this.cvData = this.getDefaultCVData();
            }

            // Load activity data with validation
            try {
                const activityPath = path.join(CONFIG.DATA_DIR, 'activity-summary.json');
                const activityContent = await fs.readFile(activityPath, 'utf8');
                this.activityData = JSON.parse(activityContent);
                this.validateActivityData();
                console.log('✅ Activity data loaded and validated');
            } catch (error) {
                console.warn('⚠️ Activity data not found, using fallback');
                this.activityData = this.getDefaultActivityData();
            }

            // Load AI enhancements
            try {
                const aiPath = path.join(CONFIG.DATA_DIR, 'ai-enhancements.json');
                const aiContent = await fs.readFile(aiPath, 'utf8');
                this.aiEnhancements = JSON.parse(aiContent);
                console.log('✅ AI enhancements loaded');
            } catch (error) {
                console.warn('⚠️ AI enhancements not found');
                this.aiEnhancements = {};
            }

            // Log data integrity status
            this.logDataIntegrityStatus();

        } catch (error) {
            console.error('❌ Failed to load data sources:', error.message);
            throw error;
        }
    }

    /**
     * Validate CV data structure and content
     */
    validateCVData() {
        if (!this.cvData.personal_info) {
            console.warn('⚠️ Missing personal_info in CV data');
            this.cvData.personal_info = {};
        }

        if (!this.cvData.skills || !Array.isArray(this.cvData.skills)) {
            console.warn('⚠️ Missing or invalid skills array in CV data');
            this.cvData.skills = [];
        }

        if (!this.cvData.projects || !Array.isArray(this.cvData.projects)) {
            console.warn('⚠️ Missing or invalid projects array in CV data');
            this.cvData.projects = [];
        }
    }

    /**
     * Validate activity data and sanitize metrics
     */
    validateActivityData() {
        // Ensure summary object exists
        if (!this.activityData.summary) {
            console.warn('⚠️ Missing summary in activity data');
            this.activityData.summary = {};
        }

        const summary = this.activityData.summary;

        // Validate and sanitize commit count
        if (typeof summary.total_commits !== 'number' || summary.total_commits < 0) {
            console.warn(`⚠️ Invalid commit count: ${summary.total_commits}, setting to 0`);
            summary.total_commits = 0;
        }

        // Validate and sanitize lines contributed
        if (typeof summary.net_lines_contributed !== 'number' || summary.net_lines_contributed < 0) {
            console.warn(`⚠️ Invalid lines contributed: ${summary.net_lines_contributed}, setting to 0`);
            summary.net_lines_contributed = 0;
        }

        // Validate active days
        if (typeof summary.active_days !== 'number' || summary.active_days < 0) {
            console.warn(`⚠️ Invalid active days: ${summary.active_days}, setting to 0`);
            summary.active_days = 0;
        }

        // Ensure reasonable limits (data integrity check)
        const maxReasonableCommits = 1000; // 1000 commits in 30 days is extremely high but possible
        const maxReasonableLines = 1000000; // 1M lines in 30 days is unrealistic

        if (summary.total_commits > maxReasonableCommits) {
            console.warn(`⚠️ Unrealistic commit count: ${summary.total_commits}, capping at ${maxReasonableCommits}`);
            summary.total_commits = maxReasonableCommits;
        }

        if (summary.net_lines_contributed > maxReasonableLines) {
            console.warn(`⚠️ Unrealistic lines contributed: ${summary.net_lines_contributed}, capping at ${maxReasonableLines}`);
            summary.net_lines_contributed = maxReasonableLines;
        }
    }

    /**
     * Get default activity data when real data is unavailable
     */
    getDefaultActivityData() {
        return {
            last_updated: new Date().toISOString(),
            tracker_version: "fallback",
            analysis_depth: "basic",
            lookback_period_days: 30,
            summary: {
                total_commits: 0,
                active_days: 0,
                net_lines_contributed: 0,
                tracking_status: "fallback"
            },
            cv_integration: {
                ready_for_enhancement: false,
                data_freshness: new Date().toISOString(),
                next_cv_update: "Requires GitHub data collection"
            }
        };
    }

    /**
     * Log data integrity status for monitoring
     */
    logDataIntegrityStatus() {
        const hasRealGitHubData = this.activityData?.summary?.total_commits > 0;
        const hasValidMetrics = this.activityData?.summary?.net_lines_contributed > 0;
        const dataFreshness = this.activityData?.cv_integration?.data_freshness;
        
        if (hasRealGitHubData && hasValidMetrics) {
            console.log(`✅ Data integrity: Excellent - Using verified GitHub data (${this.activityData.summary.total_commits} commits, ${this.activityData.summary.net_lines_contributed} lines)`);
        } else if (hasRealGitHubData) {
            console.log(`⚠️ Data integrity: Good - Using GitHub data with limited metrics`);
        } else {
            console.log(`❌ Data integrity: Fallback - Using placeholder data (GitHub data unavailable)`);
        }

        if (dataFreshness) {
            const freshness = Math.round((Date.now() - new Date(dataFreshness).getTime()) / (1000 * 60));
            console.log(`📅 Data freshness: ${freshness} minutes old`);
        }
    }

    /**
     * Generate HTML file with dynamic content
     */
    async generateHTML() {
        console.log('🎨 Generating HTML...');

        try {
            // Read template HTML
            const templatePath = path.join(CONFIG.INPUT_DIR, CONFIG.TEMPLATE_FILE);
            let htmlContent = await fs.readFile(templatePath, 'utf8');

            // Process template with data
            htmlContent = await this.processHTMLTemplate(htmlContent);

            // Write processed HTML
            const outputPath = path.join(CONFIG.OUTPUT_DIR, 'index.html');
            await fs.writeFile(outputPath, htmlContent, 'utf8');

            console.log('✅ HTML generated successfully');

        } catch (error) {
            console.error('❌ HTML generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Process HTML template with dynamic data using Handlebars.
     */
    async processHTMLTemplate(htmlContent) {
        // Register Handlebars helpers
        Handlebars.registerHelper('json', function(context) {
            return JSON.stringify(context, null, 2);
        });
        Handlebars.registerHelper('groupSkillsByCategory', (skills) => {
            const categories = {};
            skills.forEach(skill => {
                const category = skill.category || 'Other';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(skill);
            });
            return categories;
        });

        const template = Handlebars.compile(htmlContent);

        const personalInfo = this.cvData.personal_info || {};
        const professionalSummary = this.aiEnhancements?.professional_summary?.enhanced || this.cvData.professional_summary;
        const summary = this.activityData?.summary || {};
        const professionalMetrics = this.activityData?.professional_metrics || {};
        const cvIntegration = this.activityData?.cv_integration || {};

        const data = {
            // Meta tags
            metaDescription: (professionalSummary || 'AI Engineer & Software Architect specializing in autonomous systems, machine learning, and innovative technology solutions').substring(0, 160) + '...', 
            ogTitle: `${personalInfo.name || 'Adrian Wedd'} - ${personalInfo.title || 'AI Engineer & Software Architect'}`, 
            ogDescription: (professionalSummary || 'AI Engineer & Software Architect specializing in autonomous systems, machine learning, and innovative technology solutions').substring(0, 160) + '...', 
            twitterTitle: `${personalInfo.name || 'Adrian Wedd'} - ${personalInfo.title || 'AI Engineer & Software Architect'}`, 
            twitterDescription: (professionalSummary || 'AI Engineer & Software Architect specializing in autonomous systems, machine learning, and innovative technology solutions').substring(0, 160) + '...', 
            pageTitle: `${personalInfo.name || 'Adrian Wedd'} - ${personalInfo.title || 'AI Engineer & Software Architect'}`, 
            siteUrl: CONFIG.SITE_URL,

            // Personal Info
            personalInfo: {
                name: personalInfo.name || 'Adrian Wedd',
                title: personalInfo.title || 'AI Engineer & Software Architect',
                location: personalInfo.location || 'Tasmania, Australia',
                github: personalInfo.github || 'https://github.com/adrianwedd',
                linkedin: personalInfo.linkedin || 'https://linkedin.com/in/adrianwedd',
                email: personalInfo.email || 'adrian@adrianwedd.com'
            },

            // Professional Summary
            professionalSummary: professionalSummary,

            // Live Stats
            activityData: {
                summary: {
                    total_commits: summary.total_commits || 0,
                },
                professional_metrics: {
                    scores: {
                        activity_score: professionalMetrics?.scores?.activity_score || Math.round((summary.active_days || 0) * 10),
                    }
                },
                cv_integration: {
                    data_freshness: cvIntegration.data_freshness || new Date().toISOString()
                }
            },
            languageCount: (() => {
                const programmingSkills = (this.cvData.skills || [])
                    .filter(skill => skill.category === 'Programming Languages')
                    .length;
                return programmingSkills > 0 ? programmingSkills : 8;
            })(),
            lastUpdated: new Date(cvIntegration.data_freshness || new Date()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            credibilityScore: (() => {
                let credibilityScore = 100;
                if (!summary.total_commits || summary.total_commits === 0) {
                    credibilityScore -= 20;
                }
                if (!summary.net_lines_contributed || summary.net_lines_contributed === 0) {
                    credibilityScore -= 15;
                }
                if (!professionalMetrics?.scores?.overall_professional_score) {
                    credibilityScore -= 10;
                }
                if (summary.total_commits > 50) {
                    credibilityScore += 5;
                }
                if (summary.net_lines_contributed > 10000) {
                    credibilityScore += 5;
                }
                return Math.min(100, Math.max(60, credibilityScore));
            })(),

            // Sections
            experience: this.cvData.experience || [],
            projects: this.cvData.projects || [],
            skills: this.cvData.skills || [],
            achievements: this.cvData.achievements || [],

            // Footer
            footerLastUpdated: new Date(this.aiEnhancements?.last_updated || new Date()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
        };

        return template(data);
    }

    /**
     * Copy assets to output directory
     */
    async copyAssets() {
        console.log('📦 Copying assets...');

        try {
            const assetsOutputDir = path.join(CONFIG.OUTPUT_DIR, 'assets');
            await fs.mkdir(assetsOutputDir, { recursive: true });

            // Copy CSS
            const cssSource = path.join(CONFIG.ASSETS_DIR, 'styles.css');
            const cssTarget = path.join(assetsOutputDir, 'styles.css');
            await fs.copyFile(cssSource, cssTarget);

            // Copy JavaScript
            const jsSource = path.join(CONFIG.ASSETS_DIR, 'script.js');
            const jsTarget = path.join(assetsOutputDir, 'script.js');
            await fs.copyFile(jsSource, jsTarget);

            // Copy data directory
            const dataOutputDir = path.join(CONFIG.OUTPUT_DIR, 'data');
            await fs.mkdir(dataOutputDir, { recursive: true });

            // Copy JSON data files
            const dataFiles = ['base-cv.json', 'activity-summary.json', 'ai-enhancements.json'];
            
            for (const file of dataFiles) {
                try {
                    const sourcePath = path.join(CONFIG.DATA_DIR, file);
                    const targetPath = path.join(dataOutputDir, file);
                    await fs.copyFile(sourcePath, targetPath);
                } catch (error) {
                    console.warn(`⚠️ Could not copy ${file}:`, error.message);
                }
            }

            // Copy activity data directory if it exists
            try {
                const activitySourceDir = path.join(CONFIG.DATA_DIR, 'activity');
                const activityOutputDir = path.join(dataOutputDir, 'activity');
                
                const activityExists = await fs.access(activitySourceDir).then(() => true).catch(() => false);
                if (activityExists) {
                    await fs.mkdir(activityOutputDir, { recursive: true });
                    
                    // Copy all activity files
                    const activityFiles = await fs.readdir(activitySourceDir);
                    for (const file of activityFiles) {
                        if (file.endsWith('.json')) {
                            const sourcePath = path.join(activitySourceDir, file);
                            const targetPath = path.join(activityOutputDir, file);
                            await fs.copyFile(sourcePath, targetPath);
                        }
                    }
                    console.log(`✅ Activity data directory copied (${activityFiles.length} files)`);
                }
            } catch (error) {
                console.warn('⚠️ Could not copy activity directory:', error.message);
            }

            console.log('✅ Assets copied successfully');

        } catch (error) {
            console.error('❌ Asset copying failed:', error.message);
            throw error;
        }
    }

    /**
     * Copy networking dashboard with dynamic data integration
     */
    async copyNetworkingDashboard() {
        console.log('🔗 Copying networking dashboard...');

        try {
            const dashboardSource = path.join(CONFIG.INPUT_DIR, 'networking-dashboard.html');
            const dashboardTarget = path.join(CONFIG.OUTPUT_DIR, 'networking-dashboard.html');
            
            // Check if networking dashboard exists
            const dashboardExists = await fs.access(dashboardSource).then(() => true).catch(() => false);
            if (!dashboardExists) {
                console.log('⚠️ networking-dashboard.html not found, skipping');
                return;
            }

            // Read dashboard template
            let dashboardContent = await fs.readFile(dashboardSource, 'utf8');
            
            // Update dashboard with latest networking data
            const networkingData = await this.prepareNetworkingData();
            
            // Inject networking data into dashboard
            const dataScript = `
                <script>
                    // LinkedIn Integration Data
                    window.NETWORKING_DATA = ${JSON.stringify(networkingData, null, 2)};
                    
                    // Update dashboard when data loads
                    document.addEventListener('DOMContentLoaded', function() {
                        if (typeof updateNetworkingDashboard === 'function') {
                            updateNetworkingDashboard(window.NETWORKING_DATA);
                        }
                    });
                </script>`;
            
            // Insert data script before closing head tag
            dashboardContent = dashboardContent.replace('</head>', `    ${dataScript}\n</head>`);
            
            // Write updated dashboard
            await fs.writeFile(dashboardTarget, dashboardContent);
            
            console.log('✅ Networking dashboard copied and updated with live data');
            
        } catch (error) {
            console.error('❌ Networking dashboard copying failed:', error.message);
            // Don't throw error - dashboard is optional
            console.log('⚠️ Continuing without networking dashboard');
        }
    }

    /**
     * Prepare networking data for dashboard
     */
    async prepareNetworkingData() {
        const networkingData = {
            last_updated: new Date().toISOString(),
            linkedin_integration: {
                status: 'available',
                sync_enabled: true,
                last_sync: null,
                changes_detected: 0
            },
            professional_metrics: {
                networking_score: 0,
                profile_completeness: 85,
                activity_score: this.activityData?.summary?.activity_score || 50,
                professional_connections: 0
            },
            github_activity: {
                total_repositories: this.activityData?.summary?.total_repositories || 0,
                languages_count: this.activityData?.summary?.top_languages?.length || 0,
                recent_commits: this.activityData?.summary?.commits_last_30_days || 0,
                active_days: this.activityData?.summary?.active_days_last_30 || 0
            },
            ai_insights: {
                recommendations_available: false,
                networking_opportunities: [],
                career_insights: []
            },
            dashboard_config: {
                theme: 'auto',
                refresh_interval: 300000, // 5 minutes
                auto_refresh: true
            }
        };

        // Try to load existing networking data if available
        try {
            const networkingFile = path.join(CONFIG.DATA_DIR, 'networking-data.json');
            const existingData = await fs.readFile(networkingFile, 'utf8');
            const parsed = JSON.parse(existingData);
            
            // Merge with existing data
            Object.assign(networkingData.linkedin_integration, parsed.linkedin_integration || {});
            Object.assign(networkingData.professional_metrics, parsed.professional_metrics || {});
            Object.assign(networkingData.ai_insights, parsed.ai_insights || {});
            
        } catch (error) {
            // No existing networking data - use defaults
            console.log('ℹ️ No existing networking data found, using defaults');
        }

        return networkingData;
    }

    /**
     * Generate sitemap.xml
     */
    async generateSitemap() {
        console.log('🗺️ Generating sitemap...');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${CONFIG.SITE_URL}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${CONFIG.SITE_URL}#about</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${CONFIG.SITE_URL}#experience</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${CONFIG.SITE_URL}#projects</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${CONFIG.SITE_URL}#skills</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${CONFIG.SITE_URL}#achievements</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>${CONFIG.SITE_URL}/networking-dashboard.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
</urlset>`;

        const sitemapPath = path.join(CONFIG.OUTPUT_DIR, 'sitemap.xml');
        await fs.writeFile(sitemapPath, sitemap, 'utf8');

        console.log('✅ Sitemap generated');
    }

    /**
     * Generate robots.txt
     */
    async generateRobotsTxt() {
        console.log('🤖 Generating robots.txt...');

        const robots = `User-agent: *
Allow: /

Sitemap: ${CONFIG.SITE_URL}/sitemap.xml

# Disallow crawler access to data files for privacy
Disallow: /data/
`;

        const robotsPath = path.join(CONFIG.OUTPUT_DIR, 'robots.txt');
        await fs.writeFile(robotsPath, robots, 'utf8');

        console.log('✅ Robots.txt generated');
    }

    /**
     * Generate web manifest
     */
    async generateManifest() {
        console.log('📱 Generating web manifest...');

        const personalInfo = this.cvData.personal_info || {};
        
        const manifest = {
            name: `${personalInfo.name || 'Adrian Wedd'} - Professional CV`,
            short_name: personalInfo.name || 'Adrian Wedd',
            description: this.cvData.professional_summary || 'AI Engineer & Software Architect',
            start_url: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#2563eb',
            orientation: 'portrait-primary',
            icons: [
                {
                    src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>',
                    sizes: '192x192',
                    type: 'image/svg+xml'
                }
            ]
        };

        const manifestPath = path.join(CONFIG.OUTPUT_DIR, 'manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

        console.log('✅ Web manifest generated');
    }

    /**
     * Generate GitHub Pages specific files
     */
    async generateGitHubPagesFiles() {
        console.log('📄 Generating GitHub Pages files...');

        // Generate CNAME file if custom domain is specified
        if (process.env.CUSTOM_DOMAIN) {
            const cnamePath = path.join(CONFIG.OUTPUT_DIR, 'CNAME');
            await fs.writeFile(cnamePath, process.env.CUSTOM_DOMAIN, 'utf8');
            console.log(`✅ CNAME file generated for ${process.env.CUSTOM_DOMAIN}`);
        }

        // Generate .nojekyll to bypass Jekyll processing
        const nojekyllPath = path.join(CONFIG.OUTPUT_DIR, '.nojekyll');
        await fs.writeFile(nojekyllPath, '', 'utf8');
        console.log('✅ .nojekyll file generated');

        // Generate 404.html
        const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - ${this.cvData.personal_info?.name || 'Adrian Wedd'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #2563eb 0%, #10b981 100%);
            color: white;
            text-align: center;
        }
        .container {
            max-width: 600px;
            padding: 2rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .btn {
            display: inline-block;
            padding: 1rem 2rem;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: background 0.3s ease;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 404</h1>
        <p>The page you're looking for doesn't exist, but my CV does!</p>
        <a href="/" class="btn">← Back to CV</a>
    </div>
</body>
</html>`;

        const notFoundPath = path.join(CONFIG.OUTPUT_DIR, '404.html');
        await fs.writeFile(notFoundPath, notFoundHtml, 'utf8');
        console.log('✅ 404.html generated');
    }

    /**
     * Generates a high-quality PDF from the generated HTML.
     */
    async generatePDF() {
        console.log('📄 Generating PDF version of the CV...');
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] }); // --no-sandbox is crucial for running in GitHub Actions
        const page = await browser.newPage();
        
        const htmlPath = path.resolve(path.join(CONFIG.OUTPUT_DIR, 'index.html'));
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

        // Ensure dark/light theme is set for consistency (e.g., light theme for print)
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'light');
        });

        const pdfPath = path.join(CONFIG.OUTPUT_DIR, 'assets', 'adrian-wedd-cv.pdf');
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        await browser.close();
        console.log(`✅ PDF generated successfully at: ${pdfPath}`);
    }

    /**
     * Generates an ATS-optimized plain text version of the CV.
     */
    async generateATSCV() {
        console.log('📝 Generating ATS-optimized plain text CV...');

        const personalInfo = this.cvData.personal_info || {};
        const professionalSummary = this.aiEnhancements?.professional_summary?.enhanced || this.cvData.professional_summary || '';
        const skills = this.cvData.skills || [];
        const experience = this.cvData.experience || [];
        const projects = this.cvData.projects || [];

        let atsContent = '';

        // 1. Contact Information
        atsContent += `${personalInfo.name || ''}\n`;
        atsContent += `${personalInfo.title || ''}\n`;
        atsContent += `${personalInfo.email || ''} | ${personalInfo.linkedin || ''} | ${personalInfo.github || ''}\n\n`;

        // 2. Summary
        if (professionalSummary) {
            atsContent += `SUMMARY\n`;
            atsContent += `${this.stripHtml(professionalSummary)}\n\n`;
        }

        // 3. Skills
        if (skills.length > 0) {
            atsContent += `SKILLS\n`;
            atsContent += skills.map(skill => skill.name).join(', ') + '\n\n';
        }

        // 4. Experience
        if (experience.length > 0) {
            atsContent += `EXPERIENCE\n`;
            experience.forEach(job => {
                atsContent += `${job.position}, ${job.company} (${job.period})\n`;
                atsContent += `${this.stripHtml(job.description)}\n`;
                if (job.achievements && job.achievements.length > 0) {
                    job.achievements.forEach(achievement => {
                        atsContent += `- ${this.stripHtml(achievement)}\n`;
                    });
                }
                atsContent += `\n`;
            });
        }

        // 5. Projects
        if (projects.length > 0) {
            atsContent += `PROJECTS\n`;
            projects.forEach(project => {
                atsContent += `${project.name}\n`;
                atsContent += `${this.stripHtml(project.description)}\n`;
                if (project.technologies && project.technologies.length > 0) {
                    atsContent += `Technologies: ${project.technologies.join(', ')}\n`;
                }
                atsContent += `\n`;
            });
        }

        const atsPath = path.join(CONFIG.OUTPUT_DIR, 'assets', 'adrian-wedd-cv-ats.txt');
        await fs.writeFile(atsPath, atsContent, 'utf8');

        console.log(`✅ ATS-optimized CV generated successfully at: ${atsPath}`);
    }

    // Helper to strip HTML/Markdown and specific AI meta-commentary
    stripHtml(text) {
        if (!text) return '';
        let cleaned = text;

        // Remove common HTML tags
        cleaned = cleaned.replace(/<[^>]*>?/gm, '');

        // Remove Markdown formatting
        cleaned = cleaned.replace(/\*\*/g, ''); // Bold
        cleaned = cleaned.replace(/#/g, '');    // Headers
        cleaned = cleaned.replace(/-/g, '');    // List items (simple dash)
        cleaned = cleaned.replace(/\n\n+/g, '\n'); // Collapse multiple newlines

        // Remove specific AI meta-commentary patterns
        cleaned = cleaned.replace(/^Here's an enhanced professional summary:\s*/i, '');
        cleaned = cleaned.replace(/^\*\*Enhanced Summary:\*\*\s*/i, '');
        cleaned = cleaned.replace(/\n\nThis enhancement:[\s\S]*$/i, '');
        cleaned = cleaned.replace(/The numbers provided are placeholders[\s\S]*$/i, '');
        cleaned = cleaned.replace(/\n\nThis enhancement:\n[\s\S]*?(?=\n\n[A-Z]|$)/, ''); // More robust removal of "This enhancement" block
        cleaned = cleaned.replace(/\n\n[A-Z][a-z]+:/g, ''); // Remove lines like "Concludes with:"

        return cleaned.trim();
    }

    /**
     * Generates a DOCX version of the CV.
     */
    async generateDOCXCV() {
        console.log('📄 Generating DOCX version of the CV...');

        const personalInfo = this.cvData.personal_info || {};
        const professionalSummary = this.aiEnhancements?.professional_summary?.enhanced || this.cvData.professional_summary || '';
        const skills = this.cvData.skills || [];
        const experience = this.cvData.experience || [];
        const projects = this.cvData.projects || [];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: personalInfo.name || '',
                        heading: HeadingLevel.TITLE,
                    }),
                    new Paragraph({
                        text: personalInfo.title || '',
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun(`${personalInfo.email || ''} | `),
                            new TextRun(`${personalInfo.linkedin || ''} | `),
                            new TextRun(`${personalInfo.github || ''}`),
                        ],
                    }),
                    new Paragraph({
                        text: '',
                    }),

                    // Summary
                    ...(professionalSummary ? [
                        new Paragraph({
                            text: 'SUMMARY',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph({
                            text: this.stripHtml(professionalSummary),
                        }),
                        new Paragraph({
                            text: '',
                        }),
                    ] : []),

                    // Experience
                    ...(experience.length > 0 ? [
                        new Paragraph({
                            text: 'EXPERIENCE',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...experience.flatMap(job => [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `${job.position}, ${job.company} (${job.period})`, bold: true }),
                                ],
                            }),
                            new Paragraph({
                                text: this.stripHtml(job.description),
                            }),
                            ...(job.achievements && job.achievements.length > 0 ? job.achievements.map(achievement => new Paragraph({
                                children: [new TextRun({ text: `- ${this.stripHtml(achievement)}` })],
                            })) : []),
                            new Paragraph({
                                text: '',
                            }),
                        ]),
                    ] : []),

                    // Skills
                    ...(skills.length > 0 ? [
                        new Paragraph({
                            text: 'SKILLS',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph({
                            text: skills.map(skill => skill.name).join(', '),
                        }),
                        new Paragraph({
                            text: '',
                        }),
                    ] : []),

                    // Projects
                    ...(projects.length > 0 ? [
                        new Paragraph({
                            text: 'PROJECTS',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...projects.flatMap(project => [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: project.name, bold: true }),
                                ],
                            }),
                            new Paragraph({
                                text: this.stripHtml(project.description),
                            }),
                            ...(project.technologies && project.technologies.length > 0 ? [
                                new Paragraph({
                                    children: [new TextRun({ text: `Technologies: ${project.technologies.join(', ')}` })],
                                }),
                            ] : []),
                            new Paragraph({
                                text: '',
                            }),
                        ]),
                    ] : []),
                ],
            }],
        });

        const docxPath = path.join(CONFIG.OUTPUT_DIR, 'assets', 'adrian-wedd-cv.docx');
        await Packer.toBuffer(doc).then(buffer => {
            fs.writeFile(docxPath, buffer);
            console.log(`✅ DOCX generated successfully at: ${docxPath}`);
        });
    }

    /**
     * Generates a LaTeX version of the CV.
     */
    async generateLaTeXCV() {
        console.log('📝 Generating LaTeX version of the CV...');

        const personalInfo = this.cvData.personal_info || {};
        const professionalSummary = this.aiEnhancements?.professional_summary?.enhanced || this.cvData.professional_summary || '';
        const skills = this.cvData.skills || [];
        const experience = this.cvData.experience || [];
        const projects = this.cvData.projects || [];

        let latexContent = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{enumitem}
\\setlist[itemize]{noitemsep, topsep=0pt, parsep=0pt, partopsep=0pt}

\\begin{document}

\\section*{${personalInfo.name || ''}}
\\subsection*{${personalInfo.title || ''}}
${personalInfo.email || ''} | ${personalInfo.linkedin || ''} | ${personalInfo.github || ''}

`;

        // Summary
        if (professionalSummary) {
            latexContent += `\\section*{Summary}\n`;
            latexContent += `${this.stripHtml(professionalSummary)}\n\n`;
        }

        // Experience
        if (experience.length > 0) {
            latexContent += `\\section*{Experience}\n`;
            experience.forEach(job => {
                latexContent += `\\subsection*{${job.position}, ${job.company} (${job.period})}\n`;
                latexContent += `${this.stripHtml(job.description)}\n`;
                if (job.achievements && job.achievements.length > 0) {
                    latexContent += `\\begin{itemize}\n`;
                    job.achievements.forEach(achievement => {
                        latexContent += `    \\item ${this.stripHtml(achievement)}\n`;
                    });
                    latexContent += `\\end{itemize}\n`;
                }
                latexContent += `\n`;
            });
        }

        // Skills
        if (skills.length > 0) {
            latexContent += `\\section*{Skills}\n`;
            latexContent += `${skills.map(skill => skill.name).join(', ')}\n\n`;
        }

        // Projects
        if (projects.length > 0) {
            latexContent += `\\section*{Projects}\n`;
            projects.forEach(project => {
                latexContent += `\\subsection*{${project.name}}\n`;
                latexContent += `${this.stripHtml(project.description)}\n`;
                if (project.technologies && project.technologies.length > 0) {
                    latexContent += `Technologies: ${project.technologies.join(', ')}\n`;
                }
                latexContent += `\n`;
            });
        }

        latexContent += `\\end{document}\n`;

        const latexPath = path.join(CONFIG.OUTPUT_DIR, 'assets', 'adrian-wedd-cv.tex');
        await fs.writeFile(latexPath, latexContent, 'utf8');

        console.log(`✅ LaTeX generated successfully at: ${latexPath}`);
    }

    /**
     * Get default CV data if no data files are available
     */
    getDefaultCVData() {
        return {
            personal_info: {
                name: "Adrian Wedd",
                title: "AI Engineer & Software Architect",
                location: "Tasmania, Australia",
                github: "https://github.com/adrianwedd",
                linkedin: "https://linkedin.com/in/adrianwedd"
            },
            professional_summary: "AI Engineer and Software Architect specializing in autonomous systems, machine learning, and innovative technology solutions.",
            experience: [],
            projects: [],
            skills: [],
            achievements: []
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        const generator = new CVGenerator();
        await generator.generate();
        
        console.log('\n🎉 **CV WEBSITE GENERATION COMPLETE**');
        console.log(`🌐 Website ready for deployment at: ${CONFIG.OUTPUT_DIR}/`);
        console.log(`🚀 Target URL: ${CONFIG.SITE_URL}`);
        
    } catch (error) {
        console.error('❌ Generation failed:', error.message);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CVGenerator, CONFIG };
