#!/usr/bin/env node

/**
 * Template Regression Tester
 * 
 * Ensures templated HTML output maintains compatibility with existing functionality.
 * Compares old vs new output to detect breaking changes during Issue #7 refactor.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');

class TemplateRegressionTester {
    constructor() {
        this.testResults = [];
        this.baselineFile = path.join(__dirname, 'data', 'baseline-output.json');
        this.comparisonMetrics = [
            'elementCount',
            'metaTagCount',
            'structuredDataPresent',
            'sectionCount',
            'cssClassConsistency',
            'javaScriptReferences',
            'contentLength',
            'accessibilityFeatures'
        ];
    }

    /**
     * Generate baseline from current HTML output
     */
    async generateBaseline(htmlFilePath) {
        console.log('📊 **GENERATING BASELINE FOR REGRESSION TESTING**\n');
        
        try {
            const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
            const metrics = await this.extractMetrics(htmlContent);
            
            // Save baseline
            await fs.mkdir(path.dirname(this.baselineFile), { recursive: true });
            await fs.writeFile(this.baselineFile, JSON.stringify(metrics, null, 2));
            
            console.log('✅ Baseline generated successfully');
            console.log(`📄 Saved to: ${this.baselineFile}`);
            this.displayMetrics(metrics, 'BASELINE METRICS');
            
            return metrics;
        } catch (error) {
            console.error('❌ Baseline generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Compare current output against baseline
     */
    async compareAgainstBaseline(htmlFilePath) {
        console.log('🔍 **REGRESSION TESTING AGAINST BASELINE**\n');
        
        try {
            // Load baseline
            const baselineContent = await fs.readFile(this.baselineFile, 'utf8');
            const baseline = JSON.parse(baselineContent);
            
            // Extract current metrics
            const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
            const current = await this.extractMetrics(htmlContent);
            
            // Compare metrics
            const comparison = await this.compareMetrics(baseline, current);
            
            this.displayComparison(baseline, current, comparison);
            
            return {
                passed: comparison.criticalFailures === 0,
                comparison,
                baseline,
                current
            };
            
        } catch (error) {
            console.error('❌ Regression testing failed:', error.message);
            throw error;
        }
    }

    /**
     * Extract comprehensive metrics from HTML
     */
    async extractMetrics(htmlContent) {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        const metrics = {
            timestamp: new Date().toISOString(),
            
            // Basic structure
            elementCount: document.querySelectorAll('*').length,
            sectionCount: document.querySelectorAll('section, .section').length,
            contentLength: document.body?.textContent?.length || 0,
            
            // Meta tags
            metaTagCount: document.querySelectorAll('meta').length,
            metaTags: Array.from(document.querySelectorAll('meta')).map(meta => ({
                name: meta.getAttribute('name'),
                property: meta.getAttribute('property'),
                content: meta.getAttribute('content')?.substring(0, 100) + '...'
            })),
            
            // Structured data
            structuredDataPresent: document.querySelectorAll('script[type="application/ld+json"]').length > 0,
            structuredDataCount: document.querySelectorAll('script[type="application/ld+json"]').length,
            
            // CSS and styling
            cssLinks: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => 
                link.getAttribute('href')
            ),
            cssClassCount: new Set(
                Array.from(document.querySelectorAll('[class]'))
                    .flatMap(el => el.className.split(/\s+/))
                    .filter(cls => cls.trim())
            ).size,
            
            // JavaScript
            scriptTags: Array.from(document.querySelectorAll('script[src]')).map(script =>
                script.getAttribute('src')
            ),
            
            // Content sections
            sections: {
                header: !!document.querySelector('header, .header'),
                nav: !!document.querySelector('nav, .nav'),
                main: !!document.querySelector('main, .main'),
                footer: !!document.querySelector('footer, .footer'),
                about: !!document.querySelector('#about, .about'),
                experience: !!document.querySelector('#experience, .experience'),
                projects: !!document.querySelector('#projects, .projects'),
                skills: !!document.querySelector('#skills, .skills'),
                achievements: !!document.querySelector('#achievements, .achievements')
            },
            
            // Accessibility
            accessibility: {
                altTags: document.querySelectorAll('img[alt]').length,
                totalImages: document.querySelectorAll('img').length,
                headingHierarchy: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName),
                landmarks: document.querySelectorAll('[role], main, nav, header, footer').length
            },
            
            // Performance indicators
            performance: {
                preconnectLinks: document.querySelectorAll('link[rel="preconnect"]').length,
                prefetchLinks: document.querySelectorAll('link[rel="prefetch"]').length,
                inlineStyles: document.querySelectorAll('style').length,
                inlineStyleLength: Array.from(document.querySelectorAll('style'))
                    .reduce((total, style) => total + style.textContent.length, 0)
            },
            
            // Content hash (for detecting major changes)
            contentHash: crypto.createHash('md5')
                .update(document.body?.textContent?.replace(/\s+/g, ' ').trim() || '')
                .digest('hex').substring(0, 8)
        };
        
        return metrics;
    }

    /**
     * Compare current metrics against baseline
     */
    async compareMetrics(baseline, current) {
        const comparison = {
            criticalFailures: 0,
            warnings: 0,
            improvements: 0,
            details: []
        };

        // Critical checks (must pass)
        const criticalChecks = [
            {
                name: 'Element Count Stability',
                check: () => Math.abs(current.elementCount - baseline.elementCount) <= baseline.elementCount * 0.1,
                message: `Element count changed: ${baseline.elementCount} → ${current.elementCount}`
            },
            {
                name: 'Section Integrity',
                check: () => current.sectionCount >= baseline.sectionCount,
                message: `Section count decreased: ${baseline.sectionCount} → ${current.sectionCount}`
            },
            {
                name: 'Meta Tags Present',
                check: () => current.metaTagCount >= baseline.metaTagCount * 0.9,
                message: `Meta tags significantly reduced: ${baseline.metaTagCount} → ${current.metaTagCount}`
            },
            {
                name: 'Structured Data',
                check: () => current.structuredDataPresent === baseline.structuredDataPresent,
                message: `Structured data presence changed: ${baseline.structuredDataPresent} → ${current.structuredDataPresent}`
            },
            {
                name: 'Essential Sections',
                check: () => {
                    const essentialSections = ['about', 'experience', 'projects', 'skills'];
                    return essentialSections.every(section => 
                        current.sections[section] === baseline.sections[section]
                    );
                },
                message: 'Essential sections structure changed'
            }
        ];

        // Run critical checks
        for (const check of criticalChecks) {
            if (!check.check()) {
                comparison.criticalFailures++;
                comparison.details.push({
                    type: 'critical',
                    name: check.name,
                    message: check.message
                });
            }
        }

        // Warning checks (should investigate)
        const warningChecks = [
            {
                name: 'Content Length Change',
                check: () => Math.abs(current.contentLength - baseline.contentLength) <= baseline.contentLength * 0.2,
                message: `Content length significantly changed: ${baseline.contentLength} → ${current.contentLength}`
            },
            {
                name: 'CSS Class Count',
                check: () => Math.abs(current.cssClassCount - baseline.cssClassCount) <= baseline.cssClassCount * 0.3,
                message: `CSS classes significantly changed: ${baseline.cssClassCount} → ${current.cssClassCount}`
            },
            {
                name: 'Script References',
                check: () => current.scriptTags.length >= baseline.scriptTags.length,
                message: `Script tags reduced: ${baseline.scriptTags.length} → ${current.scriptTags.length}`
            }
        ];

        // Run warning checks
        for (const check of warningChecks) {
            if (!check.check()) {
                comparison.warnings++;
                comparison.details.push({
                    type: 'warning',
                    name: check.name,
                    message: check.message
                });
            }
        }

        // Improvement checks (good changes)
        const improvementChecks = [
            {
                name: 'Accessibility Improvements',
                check: () => current.accessibility.landmarks > baseline.accessibility.landmarks,
                message: `Accessibility landmarks increased: ${baseline.accessibility.landmarks} → ${current.accessibility.landmarks}`
            },
            {
                name: 'Performance Optimizations',
                check: () => current.performance.preconnectLinks > baseline.performance.preconnectLinks,
                message: `Preconnect links added: ${baseline.performance.preconnectLinks} → ${current.performance.preconnectLinks}`
            }
        ];

        // Run improvement checks
        for (const check of improvementChecks) {
            if (check.check()) {
                comparison.improvements++;
                comparison.details.push({
                    type: 'improvement',
                    name: check.name,
                    message: check.message
                });
            }
        }

        return comparison;
    }

    /**
     * Display metrics in formatted table
     */
    displayMetrics(metrics, title) {
        console.log(`\n📊 **${title}**`);
        console.log('================================\n');
        
        console.log('📄 **Structure:**');
        console.log(`   Elements: ${metrics.elementCount}`);
        console.log(`   Sections: ${metrics.sectionCount}`);
        console.log(`   Content Length: ${metrics.contentLength.toLocaleString()} chars`);
        
        console.log('\n🏷️ **Meta & SEO:**');
        console.log(`   Meta Tags: ${metrics.metaTagCount}`);
        console.log(`   Structured Data: ${metrics.structuredDataCount} scripts`);
        
        console.log('\n🎨 **Styling & Scripts:**');
        console.log(`   CSS Links: ${metrics.cssLinks.length}`);
        console.log(`   CSS Classes: ${metrics.cssClassCount}`);
        console.log(`   Script Tags: ${metrics.scriptTags.length}`);
        
        console.log('\n♿ **Accessibility:**');
        console.log(`   Images with Alt: ${metrics.accessibility.altTags}/${metrics.accessibility.totalImages}`);
        console.log(`   Landmarks: ${metrics.accessibility.landmarks}`);
        
        console.log('\n⚡ **Performance:**');
        console.log(`   Preconnect Links: ${metrics.performance.preconnectLinks}`);
        console.log(`   Inline Styles: ${metrics.performance.inlineStyles} (${metrics.performance.inlineStyleLength} chars)`);
        
        console.log(`\n🔍 **Content Hash:** ${metrics.contentHash}`);
    }

    /**
     * Display comparison results
     */
    displayComparison(baseline, current, comparison) {
        console.log('\n🔍 **REGRESSION TEST RESULTS**');
        console.log('=====================================\n');
        
        // Overall status
        if (comparison.criticalFailures === 0) {
            console.log('✅ **PASSED**: No critical regressions detected');
        } else {
            console.log(`❌ **FAILED**: ${comparison.criticalFailures} critical regressions`);
        }
        
        if (comparison.warnings > 0) {
            console.log(`⚠️ **WARNINGS**: ${comparison.warnings} items need investigation`);
        }
        
        if (comparison.improvements > 0) {
            console.log(`🎉 **IMPROVEMENTS**: ${comparison.improvements} enhancements detected`);
        }
        
        // Detailed results
        console.log('\n📋 **DETAILED RESULTS:**\n');
        
        for (const detail of comparison.details) {
            let emoji;
            switch (detail.type) {
                case 'critical': emoji = '🚨'; break;
                case 'warning': emoji = '⚠️'; break;
                case 'improvement': emoji = '✨'; break;
                default: emoji = 'ℹ️';
            }
            
            console.log(`${emoji} **${detail.name}**: ${detail.message}`);
        }
        
        // Summary table
        console.log('\n📊 **COMPARISON SUMMARY:**');
        console.log('| Metric | Baseline | Current | Change |');
        console.log('|--------|----------|---------|--------|');
        console.log(`| Elements | ${baseline.elementCount} | ${current.elementCount} | ${this.formatChange(baseline.elementCount, current.elementCount)} |`);
        console.log(`| Sections | ${baseline.sectionCount} | ${current.sectionCount} | ${this.formatChange(baseline.sectionCount, current.sectionCount)} |`);
        console.log(`| Meta Tags | ${baseline.metaTagCount} | ${current.metaTagCount} | ${this.formatChange(baseline.metaTagCount, current.metaTagCount)} |`);
        console.log(`| CSS Classes | ${baseline.cssClassCount} | ${current.cssClassCount} | ${this.formatChange(baseline.cssClassCount, current.cssClassCount)} |`);
        console.log(`| Content Length | ${baseline.contentLength} | ${current.contentLength} | ${this.formatChange(baseline.contentLength, current.contentLength)} |`);
    }

    /**
     * Format change indicator
     */
    formatChange(baseline, current) {
        const diff = current - baseline;
        if (diff === 0) return '→';
        if (diff > 0) return `+${diff}`;
        return `${diff}`;
    }
}

// CLI Interface
async function main() {
    const tester = new TemplateRegressionTester();
    const command = process.argv[2];
    const htmlFile = process.argv[3] || path.join(__dirname, '../../dist/index.html');
    
    console.log('🧪 Template Regression Tester');
    console.log('==============================\n');
    
    try {
        switch (command) {
            case 'baseline':
                await tester.generateBaseline(htmlFile);
                break;
                
            case 'test':
                const result = await tester.compareAgainstBaseline(htmlFile);
                process.exit(result.passed ? 0 : 1);
                break;
                
            default:
                console.log('Usage:');
                console.log('  node template-regression-tester.js baseline [html-file]  # Generate baseline');
                console.log('  node template-regression-tester.js test [html-file]      # Test against baseline');
                console.log('');
                console.log('Examples:');
                console.log('  node template-regression-tester.js baseline              # Use default dist/index.html');
                console.log('  node template-regression-tester.js test ./new-output.html');
                break;
        }
    } catch (error) {
        console.error('❌ Testing error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { TemplateRegressionTester };