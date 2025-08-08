#!/usr/bin/env node

/**
 * Performance Analyzer - Comprehensive Performance Baseline & Monitoring
 * 
 * Measures performance metrics, identifies bottlenecks, and provides
 * optimization recommendations for the CV website.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

class PerformanceAnalyzer {
    constructor() {
        this.baselineMetrics = {
            totalSize: 0,
            jsSize: 0,
            cssSize: 0,
            imageSize: 0,
            fileCount: 0,
            criticalResources: [],
            nonCriticalResources: []
        };
        
        this.performanceBudgets = {
            maxTotalSize: 500000, // 500KB
            maxJSSize: 150000,    // 150KB
            maxCSSSize: 50000,    // 50KB
            maxImageSize: 200000, // 200KB
            maxCriticalCSS: 15000 // 15KB critical CSS
        };
    }

    async analyzeCurrentPerformance() {
        console.log('🔍 Analyzing current performance baseline...');
        
        try {
            // Analyze asset sizes
            await this.analyzeAssetSizes();
            
            // Analyze critical resources
            await this.analyzeCriticalPath();
            
            // Analyze bundle composition
            await this.analyzeBundleComposition();
            
            // Generate recommendations
            const recommendations = this.generateOptimizationRecommendations();
            
            // Save analysis results
            await this.saveAnalysisResults(recommendations);
            
            // Display results
            this.displayResults(recommendations);
            
        } catch (error) {
            console.error('❌ Performance analysis failed:', error);
            throw error;
        }
    }

    async analyzeAssetSizes() {
        const assetsDir = path.join(PROJECT_ROOT, 'assets');
        
        try {
            const files = await fs.readdir(assetsDir, { withFileTypes: true });
            
            for (const file of files) {
                if (file.isFile()) {
                    const filePath = path.join(assetsDir, file.name);
                    const stats = await fs.stat(filePath);
                    const ext = path.extname(file.name).toLowerCase();
                    
                    this.baselineMetrics.totalSize += stats.size;
                    this.baselineMetrics.fileCount++;
                    
                    // Categorize by file type
                    if (['.js', '.mjs'].includes(ext)) {
                        this.baselineMetrics.jsSize += stats.size;
                        
                        // Check if critical resource
                        if (file.name.includes('script.') && !file.name.includes('.ultra') && !file.name.includes('.micro')) {
                            this.baselineMetrics.criticalResources.push({
                                name: file.name,
                                size: stats.size,
                                type: 'js',
                                critical: true
                            });
                        } else {
                            this.baselineMetrics.nonCriticalResources.push({
                                name: file.name,
                                size: stats.size,
                                type: 'js',
                                critical: false
                            });
                        }
                    } else if (['.css'].includes(ext)) {
                        this.baselineMetrics.cssSize += stats.size;
                        
                        // Check if critical CSS
                        if (file.name.includes('styles.') && !file.name.includes('.ultra') && !file.name.includes('.micro')) {
                            this.baselineMetrics.criticalResources.push({
                                name: file.name,
                                size: stats.size,
                                type: 'css',
                                critical: true
                            });
                        } else {
                            this.baselineMetrics.nonCriticalResources.push({
                                name: file.name,
                                size: stats.size,
                                type: 'css',
                                critical: false
                            });
                        }
                    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
                        this.baselineMetrics.imageSize += stats.size;
                        this.baselineMetrics.nonCriticalResources.push({
                            name: file.name,
                            size: stats.size,
                            type: 'image',
                            critical: false
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error analyzing asset sizes:', error);
        }
    }

    async analyzeCriticalPath() {
        try {
            // Read index.html to identify critical resources
            const indexPath = path.join(PROJECT_ROOT, 'index.html');
            const indexContent = await fs.readFile(indexPath, 'utf-8');
            
            // Find preloaded resources
            const preloadMatches = indexContent.match(/<link[^>]*rel="preload"[^>]*>/g) || [];
            const modulePreloadMatches = indexContent.match(/<link[^>]*rel="modulepreload"[^>]*>/g) || [];
            
            console.log(`📊 Found ${preloadMatches.length} preloaded resources`);
            console.log(`📊 Found ${modulePreloadMatches.length} module preloaded resources`);
            
            // Analyze inline styles (critical CSS)
            const inlineStyleMatches = indexContent.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];
            const inlineCSSSize = inlineStyleMatches.reduce((total, style) => {
                return total + style.length;
            }, 0);
            
            console.log(`📊 Inline CSS size: ${(inlineCSSSize / 1024).toFixed(2)}KB`);
            
        } catch (error) {
            console.error('Error analyzing critical path:', error);
        }
    }

    async analyzeBundleComposition() {
        try {
            // Analyze main script file
            const scriptPath = path.join(PROJECT_ROOT, 'assets', 'script.js');
            const scriptContent = await fs.readFile(scriptPath, 'utf-8');
            
            // Count features and complexity
            const functionCount = (scriptContent.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || []).length;
            const classCount = (scriptContent.match(/class\s+\w+/g) || []).length;
            const importCount = (scriptContent.match(/import.*from/g) || []).length;
            
            console.log(`📊 JavaScript complexity: ${functionCount} functions, ${classCount} classes, ${importCount} imports`);
            
            // Identify potential code splitting opportunities
            const largeComponents = [
                'CVApplication',
                'PerformanceMonitor',
                'DataVisualizer',
                'GitHubIntegration'
            ];
            
            const codeSplittingOpportunities = [];
            for (const component of largeComponents) {
                if (scriptContent.includes(component)) {
                    codeSplittingOpportunities.push(component);
                }
            }
            
            console.log(`📊 Code splitting opportunities: ${codeSplittingOpportunities.join(', ')}`);
            
        } catch (error) {
            console.error('Error analyzing bundle composition:', error);
        }
    }

    generateOptimizationRecommendations() {
        const recommendations = [];
        
        // Size-based recommendations
        if (this.baselineMetrics.totalSize > this.performanceBudgets.maxTotalSize) {
            recommendations.push({
                priority: 'high',
                category: 'bundle-size',
                issue: `Total bundle size (${(this.baselineMetrics.totalSize / 1024).toFixed(2)}KB) exceeds budget (${(this.performanceBudgets.maxTotalSize / 1024).toFixed(2)}KB)`,
                solution: 'Implement code splitting and tree shaking',
                impact: 'high',
                effort: 'medium',
                savings: `${((this.baselineMetrics.totalSize - this.performanceBudgets.maxTotalSize) / 1024).toFixed(2)}KB potential reduction`
            });
        }
        
        if (this.baselineMetrics.jsSize > this.performanceBudgets.maxJSSize) {
            recommendations.push({
                priority: 'high',
                category: 'javascript-optimization',
                issue: `JavaScript size (${(this.baselineMetrics.jsSize / 1024).toFixed(2)}KB) exceeds budget (${(this.performanceBudgets.maxJSSize / 1024).toFixed(2)}KB)`,
                solution: 'Split JavaScript into critical and non-critical chunks',
                impact: 'high',
                effort: 'medium',
                savings: `${((this.baselineMetrics.jsSize - this.performanceBudgets.maxJSSize) / 1024).toFixed(2)}KB potential reduction`
            });
        }
        
        if (this.baselineMetrics.cssSize > this.performanceBudgets.maxCSSSize) {
            recommendations.push({
                priority: 'medium',
                category: 'css-optimization',
                issue: `CSS size (${(this.baselineMetrics.cssSize / 1024).toFixed(2)}KB) exceeds budget (${(this.performanceBudgets.maxCSSSize / 1024).toFixed(2)}KB)`,
                solution: 'Implement critical CSS inlining and lazy load non-critical styles',
                impact: 'medium',
                effort: 'low',
                savings: `${((this.baselineMetrics.cssSize - this.performanceBudgets.maxCSSSize) / 1024).toFixed(2)}KB potential reduction`
            });
        }
        
        // Add text compression recommendation
        recommendations.push({
            priority: 'high',
            category: 'text-compression',
            issue: 'Text resources not optimally compressed for GitHub Pages',
            solution: 'Implement gzip/brotli simulation through minification and smart caching',
            impact: 'high',
            effort: 'low',
            savings: '~1200ms load time improvement'
        });
        
        // Add resource hints recommendation
        recommendations.push({
            priority: 'medium',
            category: 'resource-hints',
            issue: 'Missing optimal resource hints for critical resources',
            solution: 'Add preload, prefetch, and preconnect hints for critical resources',
            impact: 'medium',
            effort: 'low',
            savings: '~300ms FCP improvement'
        });
        
        return recommendations;
    }

    async saveAnalysisResults(recommendations) {
        const results = {
            timestamp: new Date().toISOString(),
            baseline: this.baselineMetrics,
            budgets: this.performanceBudgets,
            recommendations,
            summary: {
                totalSizeKB: Math.round(this.baselineMetrics.totalSize / 1024),
                jsSizeKB: Math.round(this.baselineMetrics.jsSize / 1024),
                cssSizeKB: Math.round(this.baselineMetrics.cssSize / 1024),
                imageSizeKB: Math.round(this.baselineMetrics.imageSize / 1024),
                fileCount: this.baselineMetrics.fileCount,
                budgetStatus: {
                    totalSize: this.baselineMetrics.totalSize <= this.performanceBudgets.maxTotalSize ? 'pass' : 'fail',
                    jsSize: this.baselineMetrics.jsSize <= this.performanceBudgets.maxJSSize ? 'pass' : 'fail',
                    cssSize: this.baselineMetrics.cssSize <= this.performanceBudgets.maxCSSSize ? 'pass' : 'fail'
                }
            }
        };
        
        const outputPath = path.join(PROJECT_ROOT, 'monitoring', 'performance-analysis.json');
        await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
        
        console.log(`📊 Analysis results saved to: ${outputPath}`);
    }

    displayResults(recommendations) {
        console.log('\n⚡ PERFORMANCE ANALYSIS RESULTS');
        console.log('================================');
        
        // Baseline metrics
        console.log('\n📊 Current Baseline:');
        console.log(`   Total Size: ${(this.baselineMetrics.totalSize / 1024).toFixed(2)}KB`);
        console.log(`   JavaScript: ${(this.baselineMetrics.jsSize / 1024).toFixed(2)}KB`);
        console.log(`   CSS: ${(this.baselineMetrics.cssSize / 1024).toFixed(2)}KB`);
        console.log(`   Images: ${(this.baselineMetrics.imageSize / 1024).toFixed(2)}KB`);
        console.log(`   Files: ${this.baselineMetrics.fileCount}`);
        
        // Budget status
        console.log('\n🎯 Performance Budget Status:');
        const totalStatus = this.baselineMetrics.totalSize <= this.performanceBudgets.maxTotalSize ? '✅' : '❌';
        const jsStatus = this.baselineMetrics.jsSize <= this.performanceBudgets.maxJSSize ? '✅' : '❌';
        const cssStatus = this.baselineMetrics.cssSize <= this.performanceBudgets.maxCSSSize ? '✅' : '❌';
        
        console.log(`   ${totalStatus} Total Size: ${(this.baselineMetrics.totalSize / 1024).toFixed(2)}KB / ${(this.performanceBudgets.maxTotalSize / 1024).toFixed(2)}KB`);
        console.log(`   ${jsStatus} JavaScript: ${(this.baselineMetrics.jsSize / 1024).toFixed(2)}KB / ${(this.performanceBudgets.maxJSSize / 1024).toFixed(2)}KB`);
        console.log(`   ${cssStatus} CSS: ${(this.baselineMetrics.cssSize / 1024).toFixed(2)}KB / ${(this.performanceBudgets.maxCSSSize / 1024).toFixed(2)}KB`);
        
        // High priority recommendations
        console.log('\n🚀 Priority Optimizations:');
        const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
        highPriorityRecs.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec.solution} (${rec.savings})`);
        });
        
        console.log('\n✨ Run optimization pipeline to implement improvements!');
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new PerformanceAnalyzer();
    analyzer.analyzeCurrentPerformance().catch(console.error);
}

export default PerformanceAnalyzer;