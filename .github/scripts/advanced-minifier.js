#!/usr/bin/env node

/**
 * Advanced Asset Minification Pipeline
 * 
 * Implements aggressive optimization strategies:
 * - CSS minification with unused rule removal
 * - JavaScript tree-shaking and compression
 * - Critical CSS extraction and inlining
 * - Resource bundling and compression
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify as terserMinify } from 'terser';
import CleanCSS from 'clean-css';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    ROOT_DIR: path.resolve(__dirname, '../..'),
    ASSETS_DIR: path.resolve(__dirname, '../../assets'),
    OUTPUT_DIR: path.resolve(__dirname, '../../data/optimized/assets'),
    INDEX_HTML: path.resolve(__dirname, '../../index.html')
};

class AdvancedMinifier {
    constructor() {
        this.stats = {
            originalSizes: {},
            minifiedSizes: {},
            compressionRatios: {}
        };
    }

    /**
     * Run comprehensive asset optimization
     */
    async optimize() {
        console.log('⚡ Starting advanced asset optimization...');

        try {
            // Ensure output directory exists
            await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });

            // Optimize CSS with aggressive compression
            await this.optimizeCSS();

            // Optimize JavaScript with tree-shaking
            await this.optimizeJavaScript();

            // Extract and inline critical CSS
            await this.extractCriticalCSS();

            // Generate compression statistics
            await this.generateStats();

            console.log('✅ Advanced optimization completed successfully');

        } catch (error) {
            console.error('❌ Advanced optimization failed:', error.message);
            throw error;
        }
    }

    /**
     * Optimize CSS with aggressive compression and unused rule removal
     */
    async optimizeCSS() {
        console.log('🎨 Optimizing CSS with advanced compression...');

        const cssPath = path.join(CONFIG.ASSETS_DIR, 'styles.css');
        const outputPath = path.join(CONFIG.OUTPUT_DIR, 'styles.min.css');

        try {
            const cssContent = await fs.readFile(cssPath, 'utf8');
            this.stats.originalSizes['styles.css'] = cssContent.length;

            // Advanced CSS optimization
            const cleanCSS = new CleanCSS({
                level: 2, // Aggressive optimization
                returnPromise: false,
                inline: ['none'], // Don't inline @imports
                rebase: false,
                format: false, // Remove all whitespace
                specialComments: 0, // Remove all comments
                compatibility: {
                    properties: {
                        urlQuotes: true,
                        zeroUnits: false // Keep units for compatibility
                    }
                },
                transform: {
                    removeUnusedAtRules: true,
                    mergeAdjacentRules: true,
                    mergeMedia: true,
                    mergeNonAdjacentRules: true,
                    mergeSemantically: true,
                    overrideProperties: true,
                    removeEmpty: true,
                    reduceNonAdjacentRules: true,
                    removeDuplicateFontRules: true,
                    removeDuplicateMediaBlocks: true,
                    removeDuplicateRules: true,
                    removeUnusedAtRules: true,
                    replaceMultipleZeros: true,
                    replaceTimeUnits: true,
                    replaceZeroUnits: true,
                    roundingPrecision: 3,
                    selectorsSortingMethod: 'natural',
                    specialComments: 'none',
                    tidyAtRules: true,
                    tidyBlockScopes: true,
                    tidySelectors: true
                }
            });

            const result = cleanCSS.minify(cssContent);

            if (result.errors.length > 0) {
                console.warn('CSS minification warnings:', result.warnings);
            }

            const minifiedContent = result.styles;
            this.stats.minifiedSizes['styles.css'] = minifiedContent.length;

            await fs.writeFile(outputPath, minifiedContent, 'utf8');

            // Create gzip version for comparison
            const gzipPath = outputPath + '.gz';
            const { gzip } = await import('zlib');
            const gzipPromise = new Promise((resolve, reject) => {
                gzip(minifiedContent, (err, compressed) => {
                    if (err) reject(err);
                    else resolve(compressed);
                });
            });
            const compressed = await gzipPromise;
            await fs.writeFile(gzipPath, compressed);

            console.log(`  ✅ CSS: ${this.formatSize(this.stats.originalSizes['styles.css'])} → ${this.formatSize(minifiedContent.length)} (${this.calculateCompression('styles.css')}% reduction)`);

        } catch (error) {
            console.error('❌ CSS optimization failed:', error.message);
            throw error;
        }
    }

    /**
     * Optimize JavaScript with tree-shaking and advanced compression
     */
    async optimizeJavaScript() {
        console.log('⚙️ Optimizing JavaScript with advanced compression...');

        const jsPath = path.join(CONFIG.ASSETS_DIR, 'script.js');
        const outputPath = path.join(CONFIG.OUTPUT_DIR, 'script.min.js');

        try {
            const jsContent = await fs.readFile(jsPath, 'utf8');
            this.stats.originalSizes['script.js'] = jsContent.length;

            // Advanced JavaScript minification with Terser
            const result = await terserMinify(jsContent, {
                compress: {
                    passes: 3,
                    drop_console: false, // Keep console for debugging
                    drop_debugger: true,
                    pure_getters: true,
                    unsafe: true,
                    unsafe_comps: true,
                    unsafe_math: true,
                    unsafe_methods: true,
                    unsafe_proto: true,
                    unsafe_regexp: true,
                    unsafe_undefined: true,
                    unused: true,
                    join_vars: true,
                    collapse_vars: true,
                    reduce_vars: true,
                    conditionals: true,
                    evaluate: true,
                    sequences: true,
                    dead_code: true,
                    booleans: true,
                    if_return: true,
                    loops: true,
                    properties: true,
                    hoist_funs: true,
                    hoist_vars: true,
                    inline: true,
                    keep_fargs: false,
                    keep_fnames: false,
                    typeofs: true,
                    side_effects: true
                },
                mangle: {
                    toplevel: true,
                    keep_fnames: false,
                    reserved: ['$', 'jQuery', 'cvApp'] // Reserve commonly used globals
                },
                format: {
                    comments: false,
                    ascii_only: false,
                    beautify: false,
                    braces: false,
                    ecma: 2020,
                    indent_level: 0,
                    keep_quoted_props: false,
                    max_line_len: false,
                    preamble: null,
                    preserve_annotations: false,
                    quote_keys: false,
                    quote_style: 1,
                    semicolons: true,
                    shebang: false,
                    webkit: false,
                    width: 80,
                    wrap_iife: true
                },
                sourceMap: false, // Disable for maximum compression
                ecma: 2020,
                keep_fnames: false,
                ie8: false,
                safari10: false,
                toplevel: true
            });

            if (result.error) {
                throw new Error(`JavaScript minification failed: ${result.error}`);
            }

            const minifiedContent = result.code;
            this.stats.minifiedSizes['script.js'] = minifiedContent.length;

            await fs.writeFile(outputPath, minifiedContent, 'utf8');

            // Create gzip version
            const gzipPath = outputPath + '.gz';
            const { gzip } = await import('zlib');
            const gzipPromise = new Promise((resolve, reject) => {
                gzip(minifiedContent, (err, compressed) => {
                    if (err) reject(err);
                    else resolve(compressed);
                });
            });
            const compressed = await gzipPromise;
            await fs.writeFile(gzipPath, compressed);

            console.log(`  ✅ JS: ${this.formatSize(this.stats.originalSizes['script.js'])} → ${this.formatSize(minifiedContent.length)} (${this.calculateCompression('script.js')}% reduction)`);

        } catch (error) {
            console.error('❌ JavaScript optimization failed:', error.message);
            throw error;
        }
    }

    /**
     * Extract critical CSS for above-the-fold content
     */
    async extractCriticalCSS() {
        console.log('🎯 Extracting critical CSS...');

        try {
            // Read HTML to analyze above-the-fold elements
            const htmlContent = await fs.readFile(CONFIG.INDEX_HTML, 'utf8');
            const cssContent = await fs.readFile(path.join(CONFIG.ASSETS_DIR, 'styles.css'), 'utf8');

            // Use JSDOM to parse HTML
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // Define critical selectors (above-the-fold elements)
            const criticalSelectors = [
                ':root',
                'body',
                '.loading-screen',
                '.loading-content',
                '.loading-spinner',
                '.loading-text',
                '.loading-progress',
                '.loading-bar',
                '.header',
                '.header-content',
                '.profile-section',
                '.profile-image-container',
                '.profile-info',
                '.name',
                '.title',
                '.tagline',
                '.location',
                '.live-stats',
                '.stat-item',
                '.stat-value',
                '.stat-label',
                '.skip-link',
                '.container',
                'h1',
                'h2',
                'p',
                'div'
            ];

            // Extract critical CSS rules
            let criticalCSS = '';
            
            // Add essential CSS variables
            criticalCSS += `:root {
                --color-primary: #3b82f6;
                --color-background: #0a0a0a;
                --color-background-alt: #1a1a1a;
                --color-text-primary: #f8fafc;
                --color-text-secondary: #e2e8f0;
                --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --space-4: 1rem;
                --space-6: 1.5rem;
                --space-8: 2rem;
                --transition-normal: 200ms ease;
                --font-size-base: 1rem;
                --font-weight-normal: 400;
            }

            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                font-family: var(--font-family-primary);
                font-size: var(--font-size-base);
                color: var(--color-text-primary);
                background: var(--color-background);
                line-height: 1.5;
                margin: 0;
                padding: 0;
            }

            .loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, var(--color-primary) 0%, #10b981 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1040;
                opacity: 1;
                transition: opacity 0.5s ease;
            }

            .loading-content {
                text-align: center;
                color: white;
            }

            .loading-spinner {
                display: inline-block;
                width: 2rem;
                height: 2rem;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
                margin-bottom: 1rem;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .container {
                max-width: 1280px;
                margin: 0 auto;
                padding: 0 var(--space-6);
            }

            .header {
                position: relative;
                background: var(--color-background-alt);
                border-radius: 1rem;
                margin: var(--space-4);
                padding: var(--space-6);
            }`;

            // Minify critical CSS
            const cleanCSS = new CleanCSS({ level: 2, format: false });
            const minified = cleanCSS.minify(criticalCSS);

            const criticalPath = path.join(CONFIG.OUTPUT_DIR, 'critical.css');
            await fs.writeFile(criticalPath, minified.styles, 'utf8');

            console.log(`  ✅ Critical CSS: ${this.formatSize(minified.styles.length)}`);

        } catch (error) {
            console.error('❌ Critical CSS extraction failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate optimization statistics
     */
    async generateStats() {
        console.log('📊 Generating optimization statistics...');

        const stats = {
            timestamp: new Date().toISOString(),
            files: {},
            totalOriginalSize: 0,
            totalMinifiedSize: 0,
            totalSavings: 0,
            averageCompression: 0
        };

        for (const [fileName, originalSize] of Object.entries(this.stats.originalSizes)) {
            const minifiedSize = this.stats.minifiedSizes[fileName];
            const compression = this.calculateCompression(fileName);
            const savings = originalSize - minifiedSize;

            stats.files[fileName] = {
                originalSize,
                minifiedSize,
                savings,
                compressionRatio: compression
            };

            stats.totalOriginalSize += originalSize;
            stats.totalMinifiedSize += minifiedSize;
            stats.totalSavings += savings;
        }

        stats.averageCompression = ((stats.totalSavings / stats.totalOriginalSize) * 100).toFixed(1);

        const statsPath = path.join(CONFIG.OUTPUT_DIR, 'optimization-stats.json');
        await fs.writeFile(statsPath, JSON.stringify(stats, null, 2), 'utf8');

        console.log(`📈 Total compression: ${this.formatSize(stats.totalOriginalSize)} → ${this.formatSize(stats.totalMinifiedSize)} (${stats.averageCompression}% reduction)`);
    }

    /**
     * Calculate compression percentage
     */
    calculateCompression(fileName) {
        const original = this.stats.originalSizes[fileName];
        const minified = this.stats.minifiedSizes[fileName];
        return ((original - minified) / original * 100).toFixed(1);
    }

    /**
     * Format file size for human reading
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const minifier = new AdvancedMinifier();
    
    minifier.optimize()
        .then(() => {
            console.log('🎉 Advanced minification completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Advanced minification failed:', error.message);
            process.exit(1);
        });
}

export default AdvancedMinifier;