#!/usr/bin/env node

/**
 * Template Output Validator
 * 
 * Validates that templated HTML output matches expected structure and content.
 * Provides comprehensive testing framework for Issue #7 templating refactor.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class TemplateValidator {
    constructor() {
        this.testResults = [];
        this.validationRules = [
            'hasValidHTML5Structure',
            'hasRequiredMetaTags', 
            'hasStructuredData',
            'hasDynamicContent',
            'hasValidCSS',
            'hasValidJavaScript',
            'hasAccessibilityFeatures',
            'hasPerformanceOptimizations'
        ];
    }

    /**
     * Main validation workflow
     */
    async validate(htmlFilePath) {
        console.log('🧪 **TEMPLATE OUTPUT VALIDATOR**\n');
        console.log(`📄 Validating: ${htmlFilePath}`);
        
        try {
            const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // Run all validation rules
            for (const rule of this.validationRules) {
                const result = await this[rule](document, htmlContent);
                this.testResults.push({
                    rule,
                    passed: result.passed,
                    message: result.message,
                    details: result.details || null
                });
            }

            this.generateReport();
            return this.getOverallResult();

        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            return { passed: false, error: error.message };
        }
    }

    /**
     * Validate HTML5 document structure
     */
    async hasValidHTML5Structure(document) {
        const issues = [];
        
        // Check DOCTYPE
        if (!document.doctype || document.doctype.name !== 'html') {
            issues.push('Missing or invalid HTML5 DOCTYPE');
        }

        // Check basic structure
        const html = document.querySelector('html');
        const head = document.querySelector('head');
        const body = document.querySelector('body');

        if (!html) issues.push('Missing <html> element');
        if (!head) issues.push('Missing <head> element');
        if (!body) issues.push('Missing <body> element');

        // Check language attribute
        if (!html?.getAttribute('lang')) {
            issues.push('Missing lang attribute on <html>');
        }

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? '✅ Valid HTML5 structure' : '❌ HTML5 structure issues',
            details: issues
        };
    }

    /**
     * Validate required meta tags
     */
    async hasRequiredMetaTags(document) {
        const requiredMeta = [
            { name: 'viewport', content: 'width=device-width' },
            { name: 'description', minLength: 50 },
            { property: 'og:title', required: true },
            { property: 'og:description', required: true },
            { name: 'twitter:card', required: true }
        ];

        const issues = [];
        
        for (const meta of requiredMeta) {
            let element;
            if (meta.name) {
                element = document.querySelector(`meta[name="${meta.name}"]`);
            } else if (meta.property) {
                element = document.querySelector(`meta[property="${meta.property}"]`);
            }

            if (!element) {
                issues.push(`Missing meta tag: ${meta.name || meta.property}`);
                continue;
            }

            const content = element.getAttribute('content');
            if (!content) {
                issues.push(`Empty content for: ${meta.name || meta.property}`);
                continue;
            }

            if (meta.content && !content.includes(meta.content)) {
                issues.push(`Invalid content for: ${meta.name || meta.property}`);
            }

            if (meta.minLength && content.length < meta.minLength) {
                issues.push(`Content too short for: ${meta.name || meta.property} (${content.length} < ${meta.minLength})`);
            }
        }

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? '✅ All required meta tags present' : '❌ Meta tag issues',
            details: issues
        };
    }

    /**
     * Validate structured data (JSON-LD)
     */
    async hasStructuredData(document) {
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        
        if (jsonLdScripts.length === 0) {
            return {
                passed: false,
                message: '❌ No structured data found',
                details: ['Missing JSON-LD script tags']
            };
        }

        const issues = [];
        let validStructuredData = 0;

        for (let i = 0; i < jsonLdScripts.length; i++) {
            const script = jsonLdScripts[i];
            try {
                const data = JSON.parse(script.textContent);
                
                // Validate Person schema
                if (data['@type'] === 'Person') {
                    const requiredFields = ['name', 'jobTitle', 'email'];
                    for (const field of requiredFields) {
                        if (!data[field]) {
                            issues.push(`Missing ${field} in Person schema`);
                        }
                    }
                    validStructuredData++;
                }
            } catch (error) {
                issues.push(`Invalid JSON in structured data script ${i + 1}: ${error.message}`);
            }
        }

        return {
            passed: issues.length === 0 && validStructuredData > 0,
            message: issues.length === 0 ? '✅ Valid structured data' : '❌ Structured data issues',
            details: issues
        };
    }

    /**
     * Validate dynamic content placeholders are populated
     */
    async hasDynamicContent(document) {
        const issues = [];
        
        // Check for unpopulated Handlebars templates
        const htmlContent = document.documentElement.outerHTML;
        const handlebarsPatterns = [
            /\{\{[^}]*\}\}/g,  // {{variable}}
            /\{\{\{[^}]*\}\}\}/g, // {{{variable}}}
            /\{\{#[^}]*\}\}/g,    // {{#each}}
            /\{\{\/[^}]*\}\}/g    // {{/each}}
        ];

        for (const pattern of handlebarsPatterns) {
            const matches = htmlContent.match(pattern);
            if (matches) {
                issues.push(`Unpopulated Handlebars templates found: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? ` (+${matches.length - 3} more)` : ''}`);
            }
        }

        // Check for placeholder text
        const placeholderPatterns = [
            'YOUR_NAME_HERE',
            'your-email@example.com',
            'Your Professional Summary',
            'Add your experience here'
        ];

        for (const placeholder of placeholderPatterns) {
            if (htmlContent.includes(placeholder)) {
                issues.push(`Placeholder text found: ${placeholder}`);
            }
        }

        // Check for essential content sections
        const requiredSections = [
            { selector: '.professional-summary', name: 'Professional Summary' },
            { selector: '.experience', name: 'Experience Section' },
            { selector: '.skills', name: 'Skills Section' },
            { selector: '.projects', name: 'Projects Section' }
        ];

        for (const section of requiredSections) {
            const element = document.querySelector(section.selector);
            if (!element || element.textContent.trim().length < 50) {
                issues.push(`Missing or empty ${section.name}`);
            }
        }

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? '✅ Dynamic content properly populated' : '❌ Dynamic content issues',
            details: issues
        };
    }

    /**
     * Validate CSS loading and basic styles
     */
    async hasValidCSS(document) {
        const issues = [];
        
        // Check for CSS link tags
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        if (cssLinks.length === 0) {
            issues.push('No CSS stylesheets found');
        }

        // Check for style elements (should be minimal)
        const styleElements = document.querySelectorAll('style');
        if (styleElements.length > 2) {
            issues.push(`Too many inline styles (${styleElements.length}), consider consolidating`);
        }

        // Check for font loading
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        if (fontLinks.length === 0) {
            issues.push('No web font loading detected');
        }

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? '✅ CSS configuration valid' : '⚠️ CSS configuration issues',
            details: issues
        };
    }

    /**
     * Validate JavaScript loading
     */
    async hasValidJavaScript(document) {
        const issues = [];
        
        // Check for script tags
        const scripts = document.querySelectorAll('script[src]');
        if (scripts.length === 0) {
            issues.push('No external JavaScript files found');
        }

        // Check for essential scripts
        const scriptSrcs = Array.from(scripts).map(s => s.getAttribute('src'));
        if (!scriptSrcs.some(src => src.includes('script.js'))) {
            issues.push('Main script.js not found');
        }

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? '✅ JavaScript loading valid' : '⚠️ JavaScript loading issues',
            details: issues
        };
    }

    /**
     * Validate accessibility features
     */
    async hasAccessibilityFeatures(document) {
        const issues = [];
        
        // Check for alt attributes on images
        const images = document.querySelectorAll('img');
        for (const img of images) {
            if (!img.getAttribute('alt')) {
                issues.push(`Image missing alt attribute: ${img.getAttribute('src') || 'unknown'}`);
            }
        }

        // Check for heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            issues.push('No heading elements found');
        } else {
            const h1Count = document.querySelectorAll('h1').length;
            if (h1Count !== 1) {
                issues.push(`Should have exactly one h1 element, found ${h1Count}`);
            }
        }

        // Check for skip links or landmarks
        const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], main, nav');
        if (landmarks.length === 0) {
            issues.push('No semantic landmarks or roles found');
        }

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? '✅ Accessibility features present' : '⚠️ Accessibility improvements needed',
            details: issues
        };
    }

    /**
     * Validate performance optimizations
     */
    async hasPerformanceOptimizations(document) {
        const issues = [];
        
        // Check for preconnect hints
        const preconnects = document.querySelectorAll('link[rel="preconnect"]');
        if (preconnects.length === 0) {
            issues.push('No preconnect hints found for external resources');
        }

        // Check for font-display optimization
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        for (const link of fontLinks) {
            const href = link.getAttribute('href');
            if (!href.includes('display=swap')) {
                issues.push('Font loading without display=swap optimization');
            }
        }

        // Check for meta viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            issues.push('Missing responsive viewport meta tag');
        }

        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? '✅ Performance optimizations present' : '⚠️ Performance improvements available',
            details: issues
        };
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n📊 **VALIDATION REPORT**\n');
        
        let passed = 0;
        let failed = 0;

        for (const result of this.testResults) {
            console.log(result.message);
            if (result.details && result.details.length > 0) {
                result.details.forEach(detail => {
                    console.log(`   • ${detail}`);
                });
            }
            
            if (result.passed) {
                passed++;
            } else {
                failed++;
            }
        }

        console.log('\n📈 **SUMMARY**');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
        
        if (failed === 0) {
            console.log('\n🎉 **All validations passed! Template output is excellent.**');
        } else if (failed <= 2) {
            console.log('\n⚠️ **Minor issues found. Template output is good with room for improvement.**');
        } else {
            console.log('\n🚨 **Multiple issues found. Template output needs attention.**');
        }
    }

    /**
     * Get overall validation result
     */
    getOverallResult() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const successRate = passedTests / totalTests;

        return {
            passed: successRate >= 0.8, // 80% pass rate minimum
            passedTests,
            totalTests,
            successRate,
            criticalIssues: this.testResults.filter(r => !r.passed && r.rule.includes('Structure')),
            warnings: this.testResults.filter(r => !r.passed && !r.rule.includes('Structure'))
        };
    }
}

// CLI Interface
async function main() {
    const validator = new TemplateValidator();
    const htmlFile = process.argv[2] || path.join(__dirname, '../../dist/index.html');
    
    console.log('🧪 Template Output Validator');
    console.log('============================\n');
    
    try {
        const result = await validator.validate(htmlFile);
        
        // Exit with appropriate code
        process.exit(result.passed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Validation error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { TemplateValidator };