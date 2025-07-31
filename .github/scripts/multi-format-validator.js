#!/usr/bin/env node

/**
 * Multi-Format CV Export Validator
 * 
 * Validates quality and consistency across HTML, PDF, DOCX, LaTeX, and ATS formats.
 * Ensures all export formats maintain content integrity and proper formatting.
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class MultiFormatValidator {
    constructor() {
        this.formats = ['html', 'pdf', 'docx', 'latex', 'ats'];
        this.validationResults = {};
        this.contentBaseline = null;
        
        // Define expected content sections
        this.requiredSections = [
            'personalInfo',
            'professionalSummary', 
            'experience',
            'projects',
            'skills',
            'achievements'
        ];
        
        // Format-specific validators
        this.formatValidators = {
            html: this.validateHTML.bind(this),
            pdf: this.validatePDF.bind(this),
            docx: this.validateDOCX.bind(this),
            latex: this.validateLaTeX.bind(this),
            ats: this.validateATS.bind(this)
        };
    }

    /**
     * Main validation workflow for all formats
     */
    async validateAllFormats(distPath = '../../dist') {
        console.log('📋 **MULTI-FORMAT CV VALIDATOR**\n');
        console.log(`📁 Scanning: ${distPath}`);
        console.log(`🕐 Started: ${new Date().toISOString()}\n`);

        const results = {
            timestamp: new Date().toISOString(),
            distPath,
            formats: {},
            summary: {
                totalFormats: 0,
                validFormats: 0,
                criticalIssues: 0,
                warnings: 0,
                overallScore: 0
            },
            contentConsistency: {
                passed: true,
                issues: []
            }
        };

        try {
            // Step 1: Discover available formats
            const availableFormats = await this.discoverFormats(distPath);
            console.log(`📊 Found formats: ${availableFormats.join(', ')}\n`);

            // Step 2: Validate each format individually
            for (const format of availableFormats) {
                console.log(`🔍 **VALIDATING ${format.toUpperCase()} FORMAT**`);
                console.log('='.repeat(40));
                
                try {
                    const formatResult = await this.formatValidators[format](distPath);
                    results.formats[format] = formatResult;
                    results.summary.totalFormats++;
                    
                    if (formatResult.passed) {
                        results.summary.validFormats++;
                        console.log(`✅ ${format.toUpperCase()}: PASSED (${formatResult.score}/100)`);
                    } else {
                        console.log(`❌ ${format.toUpperCase()}: FAILED (${formatResult.score}/100)`);
                        results.summary.criticalIssues += formatResult.criticalIssues || 0;
                        results.summary.warnings += formatResult.warnings || 0;
                    }
                } catch (error) {
                    console.log(`💥 ${format.toUpperCase()}: ERROR - ${error.message}`);
                    results.formats[format] = {
                        passed: false,
                        score: 0,
                        error: error.message,
                        criticalIssues: 1
                    };
                    results.summary.criticalIssues++;
                }
                
                console.log('');
            }

            // Step 3: Cross-format content consistency check
            console.log('🔍 **CROSS-FORMAT CONSISTENCY CHECK**');
            console.log('=====================================');
            const consistencyResult = await this.validateContentConsistency(results.formats, distPath);
            results.contentConsistency = consistencyResult;
            
            if (consistencyResult.passed) {
                console.log('✅ Content consistency: PASSED');
            } else {
                console.log(`❌ Content consistency: FAILED (${consistencyResult.issues.length} issues)`);
                consistencyResult.issues.forEach(issue => {
                    console.log(`   • ${issue}`);
                });
            }

            // Step 4: Calculate overall score
            const scores = Object.values(results.formats)
                .filter(f => typeof f.score === 'number')
                .map(f => f.score);
            
            if (scores.length > 0) {
                results.summary.overallScore = Math.round(
                    scores.reduce((sum, score) => sum + score, 0) / scores.length
                );
                
                // Penalize for consistency issues
                if (!consistencyResult.passed) {
                    results.summary.overallScore -= Math.min(20, consistencyResult.issues.length * 5);
                }
            }

            // Step 5: Generate final report
            this.generateFinalReport(results);
            
            return results;

        } catch (error) {
            console.error('❌ Multi-format validation failed:', error.message);
            results.error = error.message;
            return results;
        }
    }

    /**
     * Discover available export formats in dist directory
     */
    async discoverFormats(distPath) {
        const formats = [];
        
        try {
            // Check for HTML
            const htmlPath = path.join(distPath, 'index.html');
            if (await this.fileExists(htmlPath)) {
                formats.push('html');
            }

            // Check for PDF
            const pdfPath = path.join(distPath, 'assets', 'adrian-wedd-cv.pdf');
            if (await this.fileExists(pdfPath)) {
                formats.push('pdf');
            }

            // Check for DOCX
            const docxPath = path.join(distPath, 'assets', 'adrian-wedd-cv.docx');
            if (await this.fileExists(docxPath)) {
                formats.push('docx');
            }

            // Check for LaTeX
            const latexPath = path.join(distPath, 'assets', 'adrian-wedd-cv.tex');
            if (await this.fileExists(latexPath)) {
                formats.push('latex');
            }

            // Check for ATS
            const atsPath = path.join(distPath, 'assets', 'adrian-wedd-cv-ats.txt');
            if (await this.fileExists(atsPath)) {
                formats.push('ats');
            }

        } catch (error) {
            console.warn('⚠️ Error discovering formats:', error.message);
        }

        return formats;
    }

    /**
     * Validate HTML format
     */
    async validateHTML(distPath) {
        console.log('🌐 Validating HTML format...');
        
        const issues = [];
        let score = 100;

        try {
            const htmlPath = path.join(distPath, 'index.html');
            const htmlContent = await fs.readFile(htmlPath, 'utf8');
            
            // Extract content baseline for comparison
            this.contentBaseline = this.extractContentBaseline(htmlContent);
            
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // Check document structure
            if (!document.doctype || document.doctype.name !== 'html') {
                issues.push('Missing or invalid HTML5 DOCTYPE');
                score -= 10;
            }

            // Check required sections
            for (const section of this.requiredSections) {
                const sectionElement = document.querySelector(`#${section}, .${section}`);
                if (!sectionElement) {
                    issues.push(`Missing section: ${section}`);
                    score -= 15;
                }
            }

            // Check structured data
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            if (jsonLdScripts.length === 0) {
                issues.push('Missing JSON-LD structured data');
                score -= 10;
            } else {
                try {
                    const structuredData = JSON.parse(jsonLdScripts[0].textContent);
                    if (!structuredData['@type'] || structuredData['@type'] !== 'Person') {
                        issues.push('Invalid structured data schema');
                        score -= 5;
                    }
                } catch (error) {
                    issues.push('Malformed JSON-LD structured data');
                    score -= 10;
                }
            }

            // Check meta tags
            const requiredMeta = ['description', 'author'];
            for (const metaName of requiredMeta) {
                const metaTag = document.querySelector(`meta[name="${metaName}"]`);
                if (!metaTag || !metaTag.getAttribute('content')) {
                    issues.push(`Missing or empty meta tag: ${metaName}`);
                    score -= 5;
                }
            }

            console.log(`   📄 File size: ${(htmlContent.length / 1024).toFixed(2)} KB`);
            console.log(`   📊 Elements: ${document.querySelectorAll('*').length}`);
            console.log(`   🔍 Issues found: ${issues.length}`);

        } catch (error) {
            issues.push(`HTML validation error: ${error.message}`);
            score = 0;
        }

        return {
            passed: score >= 80,
            score,
            issues,
            criticalIssues: issues.filter(i => i.includes('Missing section')).length,
            warnings: issues.length - issues.filter(i => i.includes('Missing section')).length
        };
    }

    /**
     * Validate PDF format
     */
    async validatePDF(distPath) {
        console.log('📄 Validating PDF format...');
        
        const issues = [];
        let score = 100;

        try {
            const pdfPath = path.join(distPath, 'assets', 'adrian-wedd-cv.pdf');
            const pdfStats = await fs.stat(pdfPath);
            
            console.log(`   📄 File size: ${(pdfStats.size / 1024).toFixed(2)} KB`);
            
            // Check file size (reasonable bounds)
            if (pdfStats.size < 50 * 1024) { // Less than 50KB
                issues.push('PDF file suspiciously small');
                score -= 20;
            } else if (pdfStats.size > 10 * 1024 * 1024) { // More than 10MB
                issues.push('PDF file too large');
                score -= 10;
            }

            // Basic PDF header check
            const pdfBuffer = await fs.readFile(pdfPath);
            const pdfHeader = pdfBuffer.slice(0, 5).toString();
            
            if (pdfHeader !== '%PDF-') {
                issues.push('Invalid PDF file format');
                score -= 30;
            } else {
                console.log(`   ✅ Valid PDF header detected`);
            }

            // TODO: When PDF parsing library is available, add content validation
            console.log(`   ⚠️ Content validation requires PDF parsing library`);
            
            console.log(`   🔍 Issues found: ${issues.length}`);

        } catch (error) {
            issues.push(`PDF validation error: ${error.message}`);
            score = 0;
        }

        return {
            passed: score >= 70,
            score,
            issues,
            criticalIssues: issues.filter(i => i.includes('Invalid PDF')).length,
            warnings: issues.length - issues.filter(i => i.includes('Invalid PDF')).length
        };
    }

    /**
     * Validate DOCX format
     */
    async validateDOCX(distPath) {
        console.log('📝 Validating DOCX format...');
        
        const issues = [];
        let score = 100;

        try {
            const docxPath = path.join(distPath, 'assets', 'adrian-wedd-cv.docx');
            const docxStats = await fs.stat(docxPath);
            
            console.log(`   📄 File size: ${(docxStats.size / 1024).toFixed(2)} KB`);
            
            // Check file size (reasonable bounds)
            if (docxStats.size < 20 * 1024) { // Less than 20KB
                issues.push('DOCX file suspiciously small');
                score -= 20;
            } else if (docxStats.size > 5 * 1024 * 1024) { // More than 5MB
                issues.push('DOCX file too large');
                score -= 10;
            }

            // DOCX is a ZIP file, check ZIP signature
            const docxBuffer = await fs.readFile(docxPath);
            const zipSignature = docxBuffer.slice(0, 4);
            
            // ZIP signatures: PK\x03\x04 or PK\x05\x06 or PK\x07\x08
            if (!(zipSignature[0] === 0x50 && zipSignature[1] === 0x4B)) {
                issues.push('Invalid DOCX file format (not a ZIP archive)');
                score -= 30;
            } else {
                console.log(`   ✅ Valid DOCX/ZIP signature detected`);
            }

            // TODO: When DOCX parsing library is available, add content validation
            console.log(`   ⚠️ Content validation requires DOCX parsing library`);
            
            console.log(`   🔍 Issues found: ${issues.length}`);

        } catch (error) {
            issues.push(`DOCX validation error: ${error.message}`);
            score = 0;
        }

        return {
            passed: score >= 70,
            score,
            issues,
            criticalIssues: issues.filter(i => i.includes('Invalid DOCX')).length,
            warnings: issues.length - issues.filter(i => i.includes('Invalid DOCX')).length
        };
    }

    /**
     * Validate LaTeX format
     */
    async validateLaTeX(distPath) {
        console.log('📐 Validating LaTeX format...');
        
        const issues = [];
        let score = 100;

        try {
            const latexPath = path.join(distPath, 'assets', 'adrian-wedd-cv.tex');
            const latexContent = await fs.readFile(latexPath, 'utf8');
            
            console.log(`   📄 File size: ${(latexContent.length / 1024).toFixed(2)} KB`);
            console.log(`   📊 Lines: ${latexContent.split('\n').length}`);
            
            // Check LaTeX document structure
            if (!latexContent.includes('\\documentclass')) {
                issues.push('Missing \\documentclass declaration');
                score -= 20;
            }

            if (!latexContent.includes('\\begin{document}')) {
                issues.push('Missing \\begin{document}');
                score -= 20;
            }

            if (!latexContent.includes('\\end{document}')) {
                issues.push('Missing \\end{document}');
                score -= 20;
            }

            // Check for common CV sections
            const latexSections = ['\\section', '\\subsection', '\\maketitle'];
            let sectionsFound = 0;
            for (const section of latexSections) {
                if (latexContent.includes(section)) {
                    sectionsFound++;
                }
            }

            if (sectionsFound < 2) {
                issues.push('Insufficient document structure (missing sections)');
                score -= 15;
            }

            // Check for personal information
            const personalInfoKeywords = ['name', 'email', 'phone', 'address'];
            let personalInfoFound = 0;
            for (const keyword of personalInfoKeywords) {
                if (latexContent.toLowerCase().includes(keyword)) {
                    personalInfoFound++;
                }
            }

            if (personalInfoFound < 2) {
                issues.push('Missing personal information fields');
                score -= 10;
            }

            // Check for common LaTeX errors
            const braceCount = (latexContent.match(/\{/g) || []).length - (latexContent.match(/\}/g) || []).length;
            if (braceCount !== 0) {
                issues.push(`Unmatched braces (${braceCount > 0 ? '+' : ''}${braceCount})`);
                score -= 15;
            }

            console.log(`   ✅ Document structure: ${sectionsFound}/3 sections found`);
            console.log(`   ✅ Personal info: ${personalInfoFound}/4 fields found`);
            console.log(`   🔍 Issues found: ${issues.length}`);

        } catch (error) {
            issues.push(`LaTeX validation error: ${error.message}`);
            score = 0;
        }

        return {
            passed: score >= 70,
            score,
            issues,
            criticalIssues: issues.filter(i => i.includes('Missing \\') || i.includes('Unmatched')).length,
            warnings: issues.length - issues.filter(i => i.includes('Missing \\') || i.includes('Unmatched')).length
        };
    }

    /**
     * Validate ATS (Applicant Tracking System) plain text format
     */
    async validateATS(distPath) {
        console.log('🤖 Validating ATS format...');
        
        const issues = [];
        let score = 100;

        try {
            const atsPath = path.join(distPath, 'assets', 'adrian-wedd-cv-ats.txt');
            const atsContent = await fs.readFile(atsPath, 'utf8');
            
            console.log(`   📄 File size: ${(atsContent.length / 1024).toFixed(2)} KB`);
            console.log(`   📊 Lines: ${atsContent.split('\n').length}`);
            
            // Check for required ATS sections
            const requiredATSSections = ['SUMMARY', 'SKILLS', 'EXPERIENCE'];
            for (const section of requiredATSSections) {
                if (!atsContent.toUpperCase().includes(section)) {
                    issues.push(`Missing ATS section: ${section}`);
                    score -= 15;
                }
            }

            // Check for contact information
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            if (!emailPattern.test(atsContent)) {
                issues.push('Missing email address');
                score -= 10;
            }

            // Check for excessive formatting (ATS should be plain)
            const problematicChars = ['•', '★', '→', '►'];
            let formattingIssues = 0;
            for (const char of problematicChars) {
                if (atsContent.includes(char)) {
                    formattingIssues++;
                }
            }

            if (formattingIssues > 0) {
                issues.push(`Contains ${formattingIssues} problematic special characters for ATS`);
                score -= formattingIssues * 5;
            }

            // Check for HTML/Markdown remnants
            if (atsContent.includes('<') || atsContent.includes('>') || atsContent.includes('**')) {
                issues.push('Contains HTML/Markdown formatting (should be plain text)');
                score -= 10;
            }

            // Check content density
            const wordCount = atsContent.split(/\s+/).length;
            console.log(`   📝 Word count: ${wordCount}`);
            
            if (wordCount < 200) {
                issues.push('Content too brief for comprehensive ATS parsing');
                score -= 15;
            } else if (wordCount > 2000) {
                issues.push('Content too verbose for ATS optimization');
                score -= 5;
            }

            console.log(`   🔍 Issues found: ${issues.length}`);

        } catch (error) {
            issues.push(`ATS validation error: ${error.message}`);
            score = 0;
        }

        return {
            passed: score >= 75,
            score,
            issues,
            criticalIssues: issues.filter(i => i.includes('Missing') && i.includes('section')).length,
            warnings: issues.length - issues.filter(i => i.includes('Missing') && i.includes('section')).length
        };
    }

    /**
     * Validate content consistency across formats
     */
    async validateContentConsistency(formatResults, distPath) {
        console.log('🔄 Checking content consistency across formats...');
        
        const issues = [];
        
        try {
            // If we have a content baseline from HTML, check other formats
            if (this.contentBaseline && formatResults.ats && formatResults.ats.passed) {
                const atsPath = path.join(distPath, 'assets', 'adrian-wedd-cv-ats.txt');
                const atsContent = await fs.readFile(atsPath, 'utf8');
                
                // Check if key personal info matches
                const htmlName = this.contentBaseline.personalInfo?.name || '';
                const htmlEmail = this.contentBaseline.personalInfo?.email || '';
                
                if (htmlName && !atsContent.includes(htmlName)) {
                    issues.push(`Name inconsistency: HTML has "${htmlName}" but ATS doesn't`);
                }
                
                if (htmlEmail && !atsContent.includes(htmlEmail)) {
                    issues.push(`Email inconsistency: HTML has "${htmlEmail}" but ATS doesn't`);
                }
                
                console.log(`   ✅ Cross-format validation completed`);
            } else {
                console.log(`   ⚠️ Limited consistency check (baseline not available)`);
            }

        } catch (error) {
            issues.push(`Consistency check error: ${error.message}`);
        }

        return {
            passed: issues.length === 0,
            issues
        };
    }

    /**
     * Extract content baseline from HTML for comparison
     */
    extractContentBaseline(htmlContent) {
        try {
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;
            
            return {
                personalInfo: {
                    name: document.querySelector('h1')?.textContent?.trim() || '',
                    email: document.querySelector('a[href^="mailto:"]')?.textContent?.trim() || ''
                },
                sectionsCount: document.querySelectorAll('section, .section').length,
                totalContent: document.body?.textContent?.length || 0
            };
        } catch (error) {
            console.warn('⚠️ Could not extract content baseline:', error.message);
            return null;
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Generate comprehensive final report
     */
    generateFinalReport(results) {
        console.log('\n🎉 **MULTI-FORMAT VALIDATION REPORT**');
        console.log('====================================\n');
        
        // Overall status
        const passed = results.summary.overallScore >= 70 && results.contentConsistency.passed;
        
        if (passed) {
            console.log('✅ **OVERALL STATUS: PASSED**');
            console.log('🎯 Multi-format export system is production ready!');
        } else {
            console.log('❌ **OVERALL STATUS: FAILED**');
            console.log('⚠️ Multi-format export system needs attention');
        }
        
        console.log(`📊 **Overall Score: ${results.summary.overallScore}/100**\n`);

        // Format breakdown
        console.log('📋 **FORMAT BREAKDOWN:**\n');
        
        for (const [format, result] of Object.entries(results.formats)) {
            const status = result.passed ? 'PASSED' : 'FAILED';
            const emoji = result.passed ? '✅' : '❌';
            
            console.log(`${emoji} **${format.toUpperCase()}**: ${status} (${result.score}/100)`);
            
            if (result.issues && result.issues.length > 0) {
                result.issues.slice(0, 3).forEach(issue => {
                    console.log(`   • ${issue}`);
                });
                if (result.issues.length > 3) {
                    console.log(`   • ... and ${result.issues.length - 3} more issues`);
                }
            }
            console.log('');
        }

        // Content consistency
        const consistencyStatus = results.contentConsistency.passed ? 'PASSED' : 'FAILED';
        const consistencyEmoji = results.contentConsistency.passed ? '✅' : '❌';
        
        console.log(`${consistencyEmoji} **CONTENT CONSISTENCY**: ${consistencyStatus}`);
        if (results.contentConsistency.issues.length > 0) {
            results.contentConsistency.issues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }
        console.log('');

        // Summary statistics
        console.log('📊 **SUMMARY STATISTICS:**');
        console.log(`   Formats Found: ${results.summary.totalFormats}`);
        console.log(`   Valid Formats: ${results.summary.validFormats}`);
        console.log(`   Critical Issues: ${results.summary.criticalIssues}`);
        console.log(`   Warnings: ${results.summary.warnings}`);

        // Recommendations
        console.log('\n💡 **RECOMMENDATIONS:**\n');
        
        if (results.summary.overallScore >= 90) {
            console.log('🌟 Excellent! Multi-format system is production-ready.');
        } else if (results.summary.overallScore >= 80) {
            console.log('👍 Good work! Address minor issues for optimal quality.');
        } else if (results.summary.overallScore >= 70) {
            console.log('⚠️ Acceptable but needs improvement.');
        } else {
            console.log('🚨 Significant issues found. Major improvements needed.');
        }
        
        console.log('\n🔗 **NEXT STEPS:**');
        console.log('1. Address critical issues in failing formats');
        console.log('2. Resolve content consistency problems');
        console.log('3. Re-run validation after fixes');
        console.log('4. Consider format-specific optimizations\n');
    }
}

// CLI Interface
async function main() {
    const validator = new MultiFormatValidator();
    const distPath = process.argv[2] || path.join(__dirname, '../../dist');
    
    console.log('📋 Multi-Format CV Validator');
    console.log('============================\n');
    
    try {
        const results = await validator.validateAllFormats(distPath);
        
        // Save results
        const resultsFile = path.join(__dirname, 'data', 'multi-format-validation.json');
        await fs.mkdir(path.dirname(resultsFile), { recursive: true });
        await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
        
        console.log(`📄 Full results saved to: ${resultsFile}`);
        
        // Exit with appropriate code
        const passed = results.summary.overallScore >= 70 && results.contentConsistency.passed;
        process.exit(passed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Multi-format validation error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { MultiFormatValidator };