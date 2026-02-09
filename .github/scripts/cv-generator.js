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
    TEMPLATE_FILE: 'index.html',
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
            await this.generatePDF(); // New call
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
     * Process HTML template with dynamic data
     */
    async processHTMLTemplate(htmlContent) {
        // Update meta tags
        htmlContent = this.updateMetaTags(htmlContent);
        
        // Update structured data with GitHub-enhanced skills
        htmlContent = this.updateStructuredDataWithGitHubSkills(htmlContent);
        
        // Update dynamic content placeholders
        htmlContent = this.updateDynamicContent(htmlContent);

        return htmlContent;
    }

    /**
     * Update meta tags with dynamic content
     */
    updateMetaTags(htmlContent) {
        const personalInfo = this.cvData.personal_info || {};
        const name = personalInfo.name || 'Adrian Wedd';
        const title = personalInfo.title || 'AI Engineer & Software Architect';
        const description = this.aiEnhancements?.professional_summary?.enhanced || 
                           this.cvData.professional_summary || 
                           'AI Engineer & Software Architect specializing in autonomous systems, machine learning, and innovative technology solutions';

        // Update title
        htmlContent = htmlContent.replace(
            /<title>.*?<\/title>/,
            `<title>${name} - ${title}</title>`
        );

        // Update meta description
        htmlContent = htmlContent.replace(
            /<meta name="description" content=".*?">/,
            `<meta name="description" content="${description.substring(0, 160)}...">`
        );

        // Update Open Graph tags
        htmlContent = htmlContent.replace(
            /<meta property="og:title" content=".*?">/,
            `<meta property="og:title" content="${name} - ${title}">`
        );

        htmlContent = htmlContent.replace(
            /<meta property="og:description" content=".*?">/,
            `<meta property="og:description" content="${description.substring(0, 160)}...">`
        );

        return htmlContent;
    }


    /**
     * Update dynamic content placeholders with verified GitHub data
     */
    updateDynamicContent(htmlContent) {
        // Update professional summary if enhanced version available
        if (this.aiEnhancements?.professional_summary?.enhanced) {
            const enhancedSummary = this.aiEnhancements.professional_summary.enhanced;
            htmlContent = htmlContent.replace(
                /(<p class="summary-text" id="professional-summary">)[\s\S]*?(<\/p>)/,
                `$1${enhancedSummary}$2`
            );
        }

        // Update GitHub activity metrics with verified data
        htmlContent = this.updateGitHubMetrics(htmlContent);

        // Add generation timestamp
        const now = new Date();
        htmlContent = htmlContent.replace(
            /(<span id="footer-last-updated">).*?(<\/span>)/,
            `$1${now.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}$2`
        );

        return htmlContent;
    }

    /**
     * Update GitHub metrics with verified activity data
     */
    updateGitHubMetrics(htmlContent) {
        const summary = this.activityData?.summary || {};
        const cvIntegration = this.activityData?.cv_integration || {};
        
        // Load latest professional development metrics if available
        let professionalMetrics = {};
        try {
            const metricsFile = this.activityData?.data_files?.latest_metrics;
            if (metricsFile) {
                const metricsPath = path.join(CONFIG.DATA_DIR, 'metrics', metricsFile);
                const fs = require('fs');
                if (fs.existsSync(metricsPath)) {
                    professionalMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load professional metrics:', error.message);
        }

        // Update commits count (30 days)
        const commitsCount = summary.total_commits || 0;
        htmlContent = htmlContent.replace(
            /(<div class="stat-value" id="commits-count">)[^<]*(<\/div>)/,
            `$1${commitsCount}$2`
        );

        // Update activity score
        const activityScore = professionalMetrics?.scores?.activity_score || 
                             Math.round((summary.active_days || 0) * 10);
        htmlContent = htmlContent.replace(
            /(<div class="stat-value" id="activity-score">)[^<]*(<\/div>)/,
            `$1${activityScore}$2`
        );

        // Update languages count (estimated from activity data)
        const languagesCount = this.estimateLanguageCount();
        htmlContent = htmlContent.replace(
            /(<div class="stat-value" id="languages-count">)[^<]*(<\/div>)/,
            `$1${languagesCount}$2`
        );

        // Update last updated with actual GitHub activity timestamp
        if (cvIntegration.data_freshness) {
            const lastUpdated = new Date(cvIntegration.data_freshness).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            htmlContent = htmlContent.replace(
                /(<div class="stat-value" id="last-updated">)[^<]*(<\/div>)/,
                `$1${lastUpdated}$2`
            );
        }

        // Update AI credibility score (based on data verification)
        const credibilityScore = this.calculateCredibilityScore(summary, professionalMetrics);
        htmlContent = htmlContent.replace(
            /(<div class="stat-value" id="credibility-score">)[^<]*(<\/div>)/,
            `$1${credibilityScore}%$2`
        );

        console.log(`✅ GitHub metrics updated: ${commitsCount} commits, ${activityScore} activity score, ${languagesCount} languages`);
        
        return htmlContent;
    }

    /**
     * Estimate language count from available data
     */
    estimateLanguageCount() {
        // Try to get from base CV skills
        const programmingSkills = (this.cvData.skills || [])
            .filter(skill => skill.category === 'Programming Languages')
            .length;
        
        // Use reasonable default if no data available
        return programmingSkills > 0 ? programmingSkills : 8;
    }

    /**
     * Calculate credibility score based on data verification
     */
    calculateCredibilityScore(summary, professionalMetrics) {
        let credibilityScore = 100;
        
        // Deduct points for missing or suspicious data
        if (!summary.total_commits || summary.total_commits === 0) {
            credibilityScore -= 20;
        }
        
        if (!summary.net_lines_contributed || summary.net_lines_contributed === 0) {
            credibilityScore -= 15;
        }
        
        if (!professionalMetrics?.scores?.overall_professional_score) {
            credibilityScore -= 10;
        }
        
        // Add points for comprehensive data
        if (summary.total_commits > 50) {
            credibilityScore += 5;
        }
        
        if (summary.net_lines_contributed > 10000) {
            credibilityScore += 5;
        }
        
        return Math.min(100, Math.max(60, credibilityScore));
    }

    /**
     * Update structured data with GitHub-sourced skills
     */
    updateStructuredDataWithGitHubSkills(htmlContent) {
        const personalInfo = this.cvData.personal_info || {};
        let skills = (this.cvData.skills || []).slice(0, 10).map(skill => skill.name);
        
        // Try to enhance with GitHub language data if available
        try {
            const skillAnalysisFile = this.activityData?.data_files?.latest_activity;
            if (skillAnalysisFile) {
                const activityPath = path.join(CONFIG.DATA_DIR, 'activity', skillAnalysisFile);
                const fs = require('fs');
                if (fs.existsSync(activityPath)) {
                    const activityData = JSON.parse(fs.readFileSync(activityPath, 'utf8'));
                    const skillAnalysis = activityData.skill_analysis;
                    
                    if (skillAnalysis && skillAnalysis.skill_proficiency) {
                        // Get top GitHub-verified skills
                        const githubSkills = Object.keys(skillAnalysis.skill_proficiency)
                            .filter(skill => skillAnalysis.skill_proficiency[skill].proficiency_level !== 'Beginner')
                            .slice(0, 10);
                        
                        // Merge with existing skills, prioritizing GitHub-verified ones
                        if (githubSkills.length > 0) {
                            skills = [...new Set([...githubSkills, ...skills])].slice(0, 10);
                            console.log(`✅ Enhanced skills with GitHub data: ${githubSkills.length} verified skills`);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not enhance skills with GitHub data:', error.message);
        }
        
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": personalInfo.name || "Adrian Wedd",
            "jobTitle": personalInfo.title || "AI Engineer & Software Architect",
            "description": this.aiEnhancements?.professional_summary?.enhanced || this.cvData.professional_summary,
            "url": CONFIG.SITE_URL,
            "sameAs": [
                personalInfo.github || "https://github.com/adrianwedd",
                personalInfo.linkedin || "https://linkedin.com/in/adrianwedd"
            ],
            "knowsAbout": skills,
            "address": {
                "@type": "PostalAddress",
                "addressRegion": "Tasmania",
                "addressCountry": "Australia"
            }
        };

        const structuredDataJson = JSON.stringify(structuredData, null, 2);
        
        return htmlContent.replace(
            /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
            `<script type="application/ld+json">\n${structuredDataJson}\n</script>`
        );
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
            document.documentElement.setAttribute('data-theme', 'light'); // eslint-disable-line no-undef
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