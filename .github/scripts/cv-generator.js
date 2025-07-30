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

console.log(`📂 Current working directory: ${process.cwd()}`);

// Check if index.html exists in current directory (we're in project root)
if (require('fs').existsSync(path.join(process.cwd(), 'index.html'))) {
    rootPrefix = '.';
    console.log('🔍 Found index.html in current directory - we are in project root');
} else if (require('fs').existsSync(path.join(process.cwd(), '../../index.html'))) {
    // We're likely in .github/scripts
    rootPrefix = '../..';
    console.log('🔍 Found index.html two levels up - we are in .github/scripts');
} else {
    // Try to find index.html by walking up the directory tree
    let currentDir = process.cwd();
    let levelsUp = 0;
    while (levelsUp < 5) {
        if (require('fs').existsSync(path.join(currentDir, 'index.html'))) {
            rootPrefix = '../'.repeat(levelsUp) || '.';
            console.log(`🔍 Found index.html ${levelsUp} levels up`);
            break;
        }
        currentDir = path.dirname(currentDir);
        levelsUp++;
    }
}

console.log(`🎯 Using root prefix: "${rootPrefix}"`);
console.log(`📍 Looking for index.html at: ${path.join(rootPrefix, 'index.html')}`);

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

        } catch (error) {
            console.error('❌ Website generation failed:', error.message);
            throw error;
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
     * Load all data sources
     */
    async loadDataSources() {
        console.log('📊 Loading data sources...');

        try {
            // Load base CV data
            try {
                const cvDataPath = path.join(CONFIG.DATA_DIR, 'base-cv.json');
                const cvDataContent = await fs.readFile(cvDataPath, 'utf8');
                this.cvData = JSON.parse(cvDataContent);
                console.log('✅ Base CV data loaded');
            } catch (error) {
                console.warn('⚠️ Base CV data not found, using defaults');
                this.cvData = this.getDefaultCVData();
            }

            // Load activity data
            try {
                const activityPath = path.join(CONFIG.DATA_DIR, 'activity-summary.json');
                const activityContent = await fs.readFile(activityPath, 'utf8');
                this.activityData = JSON.parse(activityContent);
                console.log('✅ Activity data loaded');
            } catch (error) {
                console.warn('⚠️ Activity data not found');
                this.activityData = {};
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

        } catch (error) {
            console.error('❌ Failed to load data sources:', error.message);
            throw error;
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
        
        // Update structured data
        htmlContent = this.updateStructuredData(htmlContent);
        
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
     * Update structured data
     */
    updateStructuredData(htmlContent) {
        const personalInfo = this.cvData.personal_info || {};
        const skills = this.cvData.skills || [];
        
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
            "knowsAbout": skills.slice(0, 10).map(skill => skill.name),
            "address": {
                "@type": "PostalAddress",
                "addressRegion": "Tasmania",
                "addressCountry": "Australia"
            }
        };

        const structuredDataJson = JSON.stringify(structuredData, null, 2);
        
        htmlContent = htmlContent.replace(
            /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
            `<script type="application/ld+json">\n${structuredDataJson}\n</script>`
        );

        return htmlContent;
    }

    /**
     * Update dynamic content placeholders
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