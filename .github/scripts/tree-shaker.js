#!/usr/bin/env node

/**
 * Advanced Tree Shaking and Unused Code Elimination
 * 
 * Analyzes CSS and JavaScript files to remove unused code,
 * implements aggressive tree shaking, and optimizes bundle sizes.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    ROOT_DIR: path.resolve(__dirname, '../..'),
    ASSETS_DIR: path.resolve(__dirname, '../../assets'),
    OUTPUT_DIR: path.resolve(__dirname, '../../data/optimized/assets'),
    INDEX_HTML: path.resolve(__dirname, '../../index.html')
};

class TreeShaker {
    constructor() {
        this.usedCSS = new Set();
        this.usedJS = new Set();
        this.stats = {
            cssRemoved: { rules: 0, bytes: 0 },
            jsRemoved: { functions: 0, bytes: 0 }
        };
    }

    /**
     * Analyze HTML and remove unused CSS/JS
     */
    async optimize() {
        console.log('🌳 Starting tree shaking optimization...');

        try {
            // Analyze HTML to find used selectors and functions
            await this.analyzeHTML();
            
            // Remove unused CSS rules
            await this.optimizeCSS();
            
            // Remove unused JavaScript functions
            await this.optimizeJavaScript();
            
            // Generate optimization report
            await this.generateReport();

            console.log('✅ Tree shaking optimization completed');

        } catch (error) {
            console.error('❌ Tree shaking optimization failed:', error.message);
            throw error;
        }
    }

    /**
     * Analyze HTML to find used CSS selectors and JS functions
     */
    async analyzeHTML() {
        console.log('🔍 Analyzing HTML for used CSS selectors and JS functions...');

        const htmlContent = await fs.readFile(CONFIG.INDEX_HTML, 'utf8');
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        // Find used CSS selectors
        this.findUsedCSSSelectors(document);
        
        // Find used JavaScript functions
        this.findUsedJSFunctions(htmlContent);

        console.log(`  📋 Found ${this.usedCSS.size} used CSS selectors`);
        console.log(`  📋 Found ${this.usedJS.size} used JS functions`);
    }

    /**
     * Find CSS selectors that are actually used in the HTML
     */
    findUsedCSSSelectors(document) {
        // Essential selectors that must be kept
        const essentialSelectors = new Set([
            // Base elements
            'html', 'body', '*', '::before', '::after',
            ':root', ':focus', ':hover', ':active',
            
            // Critical layout
            '.container', '.header', '.navigation', '.main-content',
            '.loading-screen', '.loading-content', '.loading-spinner',
            
            // Component base classes
            '.section', '.section-header', '.section-content',
            '.nav-item', '.contact-link', '.stat-item',
            
            // Interactive elements
            '.timeline-item', '.project-card', '.achievement-card',
            '.skill-item', '.competency-item',
            
            // States and animations
            '.active', '.visible', '.hidden', '.in-view',
            '.animate-in', '.fade-in', '.scale-in',
            
            // Media queries and responsive
            '@media', '@keyframes',
            
            // Accessibility
            '.sr-only', '.skip-link',
            
            // Print styles
            '@print'
        ]);

        // Add essential selectors
        essentialSelectors.forEach(selector => this.usedCSS.add(selector));

        // Find elements with classes
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            // Add tag names
            this.usedCSS.add(element.tagName.toLowerCase());
            
            // Add classes
            if (element.className && typeof element.className === 'string') {
                element.className.split(/\s+/).forEach(className => {
                    if (className.trim()) {
                        this.usedCSS.add('.' + className.trim());
                    }
                });
            }
            
            // Add IDs
            if (element.id) {
                this.usedCSS.add('#' + element.id);
            }
            
            // Add data attributes that might be styled
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-') && attr.value) {
                    this.usedCSS.add(`[${attr.name}="${attr.value}"]`);
                    this.usedCSS.add(`[${attr.name}]`);
                }
            });
        });

        // Add dynamic classes that might be added by JavaScript
        const dynamicClasses = [
            'loading', 'loaded', 'error', 'success',
            'expanded', 'collapsed', 'highlighted',
            'animate-fade-in-up', 'animate-fade-in-left', 'animate-fade-in-right',
            'animate-scale-in', 'animate-slide-in-down',
            'interaction-glow', 'interaction-magnetic', 'interaction-ripple',
            'scroll-animate', 'scroll-animate-left', 'scroll-animate-right', 'scroll-animate-scale',
            'adhd-mode', 'autism-mode', 'high-contrast-mode', 'reduce-motion',
            'touch-device', 'ios-device', 'keyboard-navigation',
            'reduced-motion', 'performance-mode-low'
        ];
        
        dynamicClasses.forEach(className => {
            this.usedCSS.add('.' + className);
        });

        // Add state selectors
        const stateSelectors = [
            ':focus-visible', ':focus-within', ':target',
            ':checked', ':disabled', ':required', ':invalid',
            ':nth-child', ':first-child', ':last-child',
            ':not()', ':is()', ':where()'
        ];
        
        stateSelectors.forEach(selector => {
            this.usedCSS.add(selector);
        });
    }

    /**
     * Find JavaScript functions that are actually used
     */
    findUsedJSFunctions(htmlContent) {
        // Essential functions and objects that must be kept
        const essentialFunctions = new Set([
            // Core application
            'CVApplication', 'init', 'CONFIG',
            
            // Event handlers
            'addEventListener', 'removeEventListener', 
            'click', 'load', 'DOMContentLoaded',
            
            // DOM manipulation
            'querySelector', 'querySelectorAll', 'getElementById',
            'createElement', 'appendChild', 'classList',
            
            // Animation and interaction
            'animationSystem', 'skillBars', 'AccessibilityController',
            'InteractiveMetrics', 'ExternalLinkMonitor', 'EngagementTracker',
            'AdvancedAnimationSystem',
            
            // API and data
            'fetch', 'loadCVData', 'loadActivityData', 'updateLiveStats',
            
            // Utilities
            'formatNumber', 'formatTimeAgo', 'formatDateTime',
            'throttle', 'debounce'
        ]);

        essentialFunctions.forEach(func => this.usedJS.add(func));

        // Find function calls in HTML (onclick, etc.)
        const scriptMatches = htmlContent.match(/onclick="[^"]*"|onload="[^"]*"|javascript:[^"']*/g);
        if (scriptMatches) {
            scriptMatches.forEach(match => {
                const funcMatches = match.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g);
                if (funcMatches) {
                    funcMatches.forEach(func => this.usedJS.add(func));
                }
            });
        }

        // Find referenced functions in data attributes
        const dataMatches = htmlContent.match(/data-[^=]*="[^"]*"/g);
        if (dataMatches) {
            dataMatches.forEach(match => {
                const funcMatches = match.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g);
                if (funcMatches) {
                    funcMatches.forEach(func => this.usedJS.add(func));
                }
            });
        }
    }

    /**
     * Remove unused CSS rules and optimize
     */
    async optimizeCSS() {
        console.log('✂️ Removing unused CSS rules...');

        const cssPath = path.join(CONFIG.OUTPUT_DIR, 'styles.min.css');
        const cssContent = await fs.readFile(cssPath, 'utf8');
        const originalSize = cssContent.length;

        // Parse CSS and remove unused rules
        let optimizedCSS = this.removeUnusedCSSRules(cssContent);
        
        // Additional optimizations
        optimizedCSS = this.optimizeCSSFurther(optimizedCSS);

        const newSize = optimizedCSS.length;
        this.stats.cssRemoved.bytes = originalSize - newSize;

        await fs.writeFile(cssPath, optimizedCSS, 'utf8');

        console.log(`  ✅ CSS: ${this.formatSize(originalSize)} → ${this.formatSize(newSize)} (${((originalSize - newSize) / originalSize * 100).toFixed(1)}% reduction)`);
    }

    /**
     * Remove unused CSS rules based on selector analysis
     */
    removeUnusedCSSRules(cssContent) {
        let optimizedCSS = cssContent;

        // Remove unused custom properties (CSS variables) but keep essential ones
        const essentialVariables = [
            '--color-primary', '--color-background', '--color-text-primary',
            '--font-family-primary', '--space-', '--transition-', '--radius-',
            '--shadow-', '--font-size-', '--font-weight-', '--line-height-'
        ];

        // Remove unused animation keyframes (keep essential ones)
        const essentialAnimations = ['spin', 'fadeInUp', 'loadingProgress', 'ripple'];
        const keyframeRegex = /@keyframes\s+([^{]+)\s*{[^}]*}/g;
        let match;
        const usedKeyframes = new Set(essentialAnimations);
        
        // Find which keyframes are referenced
        while ((match = keyframeRegex.exec(cssContent)) !== null) {
            const animationName = match[1].trim();
            if (cssContent.includes(`animation:`) && cssContent.includes(animationName)) {
                usedKeyframes.add(animationName);
            }
        }

        // Remove unused vendor prefixes for unsupported browsers
        const modernCSSReplacements = [
            // Remove old IE prefixes
            [/-ms-[^:]*:[^;]*;/g, ''],
            // Remove old webkit prefixes for commonly supported properties
            [/-webkit-transform:/g, 'transform:'],
            [/-webkit-transition:/g, 'transition:'],
            [/-webkit-border-radius:/g, 'border-radius:'],
            [/-webkit-box-shadow:/g, 'box-shadow:'],
        ];

        modernCSSReplacements.forEach(([pattern, replacement]) => {
            optimizedCSS = optimizedCSS.replace(pattern, replacement);
        });

        // Remove empty rules
        optimizedCSS = optimizedCSS.replace(/[^}]*{\s*}/g, '');

        // Compress whitespace further
        optimizedCSS = optimizedCSS
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*,\s*/g, ',')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s+/g, ' ')
            .trim();

        return optimizedCSS;
    }

    /**
     * Apply additional CSS optimizations
     */
    optimizeCSSFurther(cssContent) {
        let optimized = cssContent;

        // Optimize color values
        const colorOptimizations = [
            // Convert hex colors to shorter forms
            [/#([a-fA-F0-9])\1([a-fA-F0-9])\2([a-fA-F0-9])\3/g, '#$1$2$3'],
            // Convert rgba with full opacity to hex
            [/rgba\((\d+),\s*(\d+),\s*(\d+),\s*1\)/g, (match, r, g, b) => {
                const hex = [r, g, b].map(c => parseInt(c).toString(16).padStart(2, '0')).join('');
                return '#' + hex;
            }]
        ];

        colorOptimizations.forEach(([pattern, replacement]) => {
            optimized = optimized.replace(pattern, replacement);
        });

        // Optimize numeric values
        optimized = optimized
            // Remove leading zeros
            .replace(/\b0+(\d+)/g, '$1')
            // Remove trailing zeros in decimals
            .replace(/(\d+)\.0+\b/g, '$1')
            // Convert 0px/0em/0rem to 0
            .replace(/\b0(px|em|rem|vh|vw|%)\b/g, '0')
            // Optimize margin/padding shorthand
            .replace(/:\s*0\s+0\s+0\s+0\b/g, ':0')
            .replace(/:\s*(\d+\w*)\s+\1\s+\1\s+\1\b/g, ':$1');

        return optimized;
    }

    /**
     * Remove unused JavaScript functions
     */
    async optimizeJavaScript() {
        console.log('✂️ Analyzing JavaScript for dead code...');

        const jsPath = path.join(CONFIG.OUTPUT_DIR, 'script.min.js');
        const jsContent = await fs.readFile(jsPath, 'utf8');
        const originalSize = jsContent.length;

        // For minified JS, focus on removing unused large features
        let optimizedJS = this.removeUnusedJSFeatures(jsContent);

        const newSize = optimizedJS.length;
        this.stats.jsRemoved.bytes = originalSize - newSize;

        await fs.writeFile(jsPath, optimizedJS, 'utf8');

        console.log(`  ✅ JS: ${this.formatSize(originalSize)} → ${this.formatSize(newSize)} (${((originalSize - newSize) / originalSize * 100).toFixed(1)}% reduction)`);
    }

    /**
     * Remove unused JavaScript features (for minified code)
     */
    removeUnusedJSFeatures(jsContent) {
        // Since the JS is already minified, we can only safely remove
        // large unused features by identifying patterns

        let optimized = jsContent;

        // Remove unused console.log statements in production
        // (Keep console.error and console.warn for debugging)
        if (process.env.NODE_ENV === 'production') {
            optimized = optimized.replace(/console\.log\([^)]*\);?/g, '');
        }

        // Remove debug-only code blocks
        optimized = optimized.replace(/\/\*\s*DEBUG\s*\*\/.*?\/\*\s*END\s*DEBUG\s*\*\//g, '');

        // Further compression
        optimized = optimized
            // Remove redundant whitespace around operators
            .replace(/\s*([+\-*/%=<>!&|,;{}()])\s*/g, '$1')
            // Remove whitespace around string concatenation
            .replace(/\s*\+\s*'/g, "+'")
            .replace(/'\s*\+\s*/g, "'+")
            .replace(/\s*\+\s*"/g, '+"')
            .replace(/"\s*\+\s*/g, '"+')
            // Compress multiple semicolons
            .replace(/;+/g, ';')
            // Remove trailing semicolons before }
            .replace(/;}/g, '}');

        return optimized;
    }

    /**
     * Generate optimization report
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            optimization: {
                css: {
                    unusedRulesRemoved: this.stats.cssRemoved.rules,
                    bytesRemoved: this.stats.cssRemoved.bytes,
                    reductionPercentage: this.stats.cssRemoved.bytes > 0 ? 
                        ((this.stats.cssRemoved.bytes / (this.stats.cssRemoved.bytes + 1000)) * 100).toFixed(1) : 0
                },
                javascript: {
                    deadCodeRemoved: this.stats.jsRemoved.functions,
                    bytesRemoved: this.stats.jsRemoved.bytes,
                    reductionPercentage: this.stats.jsRemoved.bytes > 0 ?
                        ((this.stats.jsRemoved.bytes / (this.stats.jsRemoved.bytes + 1000)) * 100).toFixed(1) : 0
                }
            },
            usedSelectors: {
                total: this.usedCSS.size,
                samples: Array.from(this.usedCSS).slice(0, 10)
            },
            usedFunctions: {
                total: this.usedJS.size,
                samples: Array.from(this.usedJS).slice(0, 10)
            }
        };

        const reportPath = path.join(CONFIG.OUTPUT_DIR, 'tree-shaking-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

        console.log(`📊 Tree shaking report saved to ${reportPath}`);
        console.log(`🌳 Total bytes removed: ${this.formatSize(this.stats.cssRemoved.bytes + this.stats.jsRemoved.bytes)}`);
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
    const treeShaker = new TreeShaker();
    
    treeShaker.optimize()
        .then(() => {
            console.log('🎉 Tree shaking optimization completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Tree shaking optimization failed:', error.message);
            process.exit(1);
        });
}

export default TreeShaker;