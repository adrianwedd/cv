#!/usr/bin/env node

/**
 * Performance Validation & Core Web Vitals Measurement
 * 
 * Comprehensive performance testing suite to validate optimizations
 * and measure Core Web Vitals for the CV website.
 */

import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    ROOT_DIR: path.resolve(__dirname, '../..'),
    OUTPUT_DIR: path.resolve(__dirname, '../../data/optimized'),
    INDEX_HTML: path.resolve(__dirname, '../../index.html'),
    PERFORMANCE_BUDGET: {
        LCP: 2500, // Largest Contentful Paint (ms)
        FID: 100,  // First Input Delay (ms)
        CLS: 0.1,  // Cumulative Layout Shift
        FCP: 1800, // First Contentful Paint (ms)
        SI: 3400,  // Speed Index (ms)
        TBT: 200,  // Total Blocking Time (ms)
        TTI: 3800  // Time to Interactive (ms)
    }
};

class PerformanceValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            testUrl: null,
            metrics: {},
            budgetResults: {},
            recommendations: [],
            score: 0
        };
    }

    /**
     * Run comprehensive performance validation
     */
    async validate() {
        console.log('🚀 Starting performance validation...');

        try {
            // Start local server for testing
            const server = await this.startLocalServer();
            this.results.testUrl = 'http://localhost:8000';

            // Launch browser with performance monitoring
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            try {
                // Run performance tests
                await this.measureCoreWebVitals(browser);
                await this.measureResourceMetrics(browser);
                await this.measureLoadingMetrics(browser);
                await this.analyzeNetworkActivity(browser);

                // Calculate performance score
                this.calculatePerformanceScore();

                // Generate recommendations
                this.generateRecommendations();

                // Save results
                await this.saveResults();

                console.log('✅ Performance validation completed');

            } finally {
                await browser.close();
                server.close();
            }

        } catch (error) {
            console.error('❌ Performance validation failed:', error.message);
            throw error;
        }
    }

    /**
     * Measure Core Web Vitals (LCP, FID, CLS)
     */
    async measureCoreWebVitals(browser) {
        console.log('📊 Measuring Core Web Vitals...');

        const page = await browser.newPage();
        
        // Enable performance monitoring
        await page.setCacheEnabled(false);
        await page.setViewport({ width: 1366, height: 768 });

        // Collect Core Web Vitals
        const coreWebVitals = {};

        // Navigate and collect metrics
        await page.goto(this.results.testUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Measure LCP (Largest Contentful Paint)
        const lcp = await page.evaluate(() => {
            return new Promise((resolve) => {
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry?.startTime || 0);
                }).observe({ entryTypes: ['largest-contentful-paint'] });
                
                // Fallback timeout
                setTimeout(() => resolve(0), 5000);
            });
        });

        coreWebVitals.LCP = Math.round(lcp);

        // Measure CLS (Cumulative Layout Shift)
        const cls = await page.evaluate(() => {
            return new Promise((resolve) => {
                let clsValue = 0;
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    resolve(clsValue);
                }).observe({ entryTypes: ['layout-shift'] });
                
                // Wait for layout shifts to settle
                setTimeout(() => resolve(clsValue), 3000);
            });
        });

        coreWebVitals.CLS = Math.round(cls * 1000) / 1000;

        // FID is difficult to measure programmatically, estimate from TBT
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
                TTI: navigation?.loadEventEnd - navigation?.fetchStart || 0,
                domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0,
                loadComplete: navigation?.loadEventEnd - navigation?.fetchStart || 0
            };
        });

        // Estimate FID from Total Blocking Time
        coreWebVitals.FID = Math.min(100, Math.max(0, performanceMetrics.TTI - performanceMetrics.FCP) / 10);
        coreWebVitals.FCP = Math.round(performanceMetrics.FCP);
        coreWebVitals.TTI = Math.round(performanceMetrics.TTI);

        this.results.metrics.coreWebVitals = coreWebVitals;

        // Test mobile performance
        await page.setViewport({ width: 375, height: 667 });
        await page.reload({ waitUntil: 'networkidle2' });

        const mobileLCP = await page.evaluate(() => {
            return new Promise((resolve) => {
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry?.startTime || 0);
                }).observe({ entryTypes: ['largest-contentful-paint'] });
                
                setTimeout(() => resolve(0), 5000);
            });
        });

        this.results.metrics.mobile = {
            LCP: Math.round(mobileLCP)
        };

        await page.close();

        console.log(`  📱 LCP: ${coreWebVitals.LCP}ms (Mobile: ${this.results.metrics.mobile.LCP}ms)`);
        console.log(`  ⚡ FID: ${coreWebVitals.FID}ms (estimated)`);
        console.log(`  📐 CLS: ${coreWebVitals.CLS}`);
    }

    /**
     * Measure resource loading metrics
     */
    async measureResourceMetrics(browser) {
        console.log('📦 Measuring resource metrics...');

        const page = await browser.newPage();
        await page.setCacheEnabled(false);

        const resourceMetrics = {
            totalSize: 0,
            compressedSize: 0,
            requests: 0,
            resourceTypes: {},
            largestResources: []
        };

        // Monitor all network requests
        page.on('response', (response) => {
            const url = response.url();
            const headers = response.headers();
            
            if (!url.includes('localhost:8000')) return;

            const contentLength = parseInt(headers['content-length']) || 0;
            const contentEncoding = headers['content-encoding'];
            
            resourceMetrics.totalSize += contentLength;
            resourceMetrics.requests++;

            // Track by resource type
            const resourceType = this.getResourceTypeFromUrl(url);
            resourceMetrics.resourceTypes[resourceType] = 
                (resourceMetrics.resourceTypes[resourceType] || 0) + contentLength;

            // Track largest resources
            if (contentLength > 5000) { // Only track resources >5KB
                resourceMetrics.largestResources.push({
                    url: url.replace('http://localhost:8000', ''),
                    size: contentLength,
                    type: resourceType,
                    compressed: !!contentEncoding
                });
            }
        });

        await page.goto(this.results.testUrl, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Sort largest resources
        resourceMetrics.largestResources.sort((a, b) => b.size - a.size);
        resourceMetrics.largestResources = resourceMetrics.largestResources.slice(0, 10);

        this.results.metrics.resources = resourceMetrics;

        await page.close();

        console.log(`  📊 Total requests: ${resourceMetrics.requests}`);
        console.log(`  📦 Total size: ${this.formatSize(resourceMetrics.totalSize)}`);
        console.log(`  🏆 Largest resource: ${resourceMetrics.largestResources[0]?.url} (${this.formatSize(resourceMetrics.largestResources[0]?.size || 0)})`);
    }

    /**
     * Measure detailed loading metrics
     */
    async measureLoadingMetrics(browser) {
        console.log('⏱️ Measuring loading performance...');

        const page = await browser.newPage();
        await page.setCacheEnabled(false);
        
        // Start performance measurement
        await page.evaluateOnNewDocument(() => {
            window.performanceMetrics = {
                navigationStart: performance.timeOrigin,
                timings: []
            };
        });

        const startTime = Date.now();
        await page.goto(this.results.testUrl, { timeout: 30000 });

        // Wait for all resources to load
        await page.waitForLoadState?.('networkidle') || 
              page.waitForTimeout(3000);

        const loadingMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paintEntries = performance.getEntriesByType('paint');
            
            return {
                // Navigation timings
                DNS: navigation.domainLookupEnd - navigation.domainLookupStart,
                TCP: navigation.connectEnd - navigation.connectStart,
                SSL: navigation.secureConnectionStart > 0 ? 
                     navigation.connectEnd - navigation.secureConnectionStart : 0,
                TTFB: navigation.responseStart - navigation.fetchStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                loadComplete: navigation.loadEventEnd - navigation.fetchStart,
                
                // Paint timings
                FCP: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                
                // Resource counts
                totalResources: performance.getEntriesByType('resource').length
            };
        });

        // Calculate derived metrics
        loadingMetrics.SI = loadingMetrics.FCP + (loadingMetrics.domContentLoaded - loadingMetrics.FCP) * 0.5; // Speed Index estimate
        loadingMetrics.TBT = Math.max(0, loadingMetrics.domContentLoaded - loadingMetrics.FCP - 50); // TBT estimate

        this.results.metrics.loading = loadingMetrics;

        await page.close();

        console.log(`  🏁 TTFB: ${Math.round(loadingMetrics.TTFB)}ms`);
        console.log(`  🎨 FCP: ${Math.round(loadingMetrics.FCP)}ms`);
        console.log(`  ✅ Load Complete: ${Math.round(loadingMetrics.loadComplete)}ms`);
    }

    /**
     * Analyze network activity patterns
     */
    async analyzeNetworkActivity(browser) {
        console.log('🔍 Analyzing network activity...');

        const page = await browser.newPage();
        
        const networkActivity = {
            requests: [],
            totalTime: 0,
            parallelRequests: 0,
            cacheHits: 0
        };

        page.on('request', (request) => {
            const startTime = Date.now();
            networkActivity.requests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType(),
                startTime
            });
        });

        page.on('response', (response) => {
            const request = networkActivity.requests.find(r => r.url === response.url());
            if (request) {
                request.endTime = Date.now();
                request.status = response.status();
                request.cached = response.fromCache();
                
                if (response.fromCache()) {
                    networkActivity.cacheHits++;
                }
            }
        });

        await page.goto(this.results.testUrl, { waitUntil: 'networkidle0' });

        // Calculate network metrics
        const completedRequests = networkActivity.requests.filter(r => r.endTime);
        networkActivity.totalTime = Math.max(...completedRequests.map(r => r.endTime - r.startTime));
        
        // Estimate parallel requests
        const timeWindows = {};
        completedRequests.forEach(request => {
            const window = Math.floor(request.startTime / 100) * 100;
            timeWindows[window] = (timeWindows[window] || 0) + 1;
        });
        networkActivity.parallelRequests = Math.max(...Object.values(timeWindows));

        this.results.metrics.network = networkActivity;

        await page.close();

        console.log(`  🌐 Network requests: ${completedRequests.length}`);
        console.log(`  ⚡ Cache hit rate: ${Math.round((networkActivity.cacheHits / completedRequests.length) * 100)}%`);
        console.log(`  🔄 Max parallel requests: ${networkActivity.parallelRequests}`);
    }

    /**
     * Calculate overall performance score
     */
    calculatePerformanceScore() {
        const { coreWebVitals, loading } = this.results.metrics;
        
        // Weight different metrics
        const weights = {
            LCP: 25,
            FID: 25,
            CLS: 25,
            FCP: 10,
            TTI: 10,
            TBT: 5
        };

        let totalScore = 0;
        let totalWeight = 0;

        // Score each metric against budget
        for (const [metric, budget] of Object.entries(CONFIG.PERFORMANCE_BUDGET)) {
            const value = coreWebVitals[metric] || loading[metric] || 0;
            const weight = weights[metric] || 0;
            
            if (weight > 0) {
                let score = 100;
                
                if (metric === 'CLS') {
                    // CLS scoring (lower is better)
                    score = Math.max(0, 100 - (value / budget) * 100);
                } else {
                    // Time-based metrics (lower is better)
                    score = Math.max(0, 100 - Math.max(0, (value - budget * 0.5) / (budget * 0.5)) * 100);
                }
                
                totalScore += score * weight;
                totalWeight += weight;
                
                this.results.budgetResults[metric] = {
                    value,
                    budget,
                    score: Math.round(score),
                    status: value <= budget ? 'PASS' : 'FAIL'
                };
            }
        }

        this.results.score = Math.round(totalScore / totalWeight);
        
        console.log(`🎯 Performance Score: ${this.results.score}/100`);
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const { coreWebVitals, resources, loading } = this.results.metrics;

        // LCP recommendations
        if (coreWebVitals.LCP > CONFIG.PERFORMANCE_BUDGET.LCP) {
            recommendations.push({
                type: 'LCP',
                priority: 'high',
                message: `LCP is ${coreWebVitals.LCP}ms (target: ${CONFIG.PERFORMANCE_BUDGET.LCP}ms)`,
                suggestions: [
                    'Optimize largest contentful element',
                    'Implement resource hints (preload)',
                    'Optimize critical rendering path',
                    'Consider image optimization or lazy loading'
                ]
            });
        }

        // FID recommendations  
        if (coreWebVitals.FID > CONFIG.PERFORMANCE_BUDGET.FID) {
            recommendations.push({
                type: 'FID',
                priority: 'high',
                message: `FID is ${coreWebVitals.FID}ms (target: ${CONFIG.PERFORMANCE_BUDGET.FID}ms)`,
                suggestions: [
                    'Reduce JavaScript execution time',
                    'Code splitting and lazy loading',
                    'Optimize third-party scripts',
                    'Use web workers for heavy computations'
                ]
            });
        }

        // CLS recommendations
        if (coreWebVitals.CLS > CONFIG.PERFORMANCE_BUDGET.CLS) {
            recommendations.push({
                type: 'CLS',
                priority: 'high',
                message: `CLS is ${coreWebVitals.CLS} (target: ${CONFIG.PERFORMANCE_BUDGET.CLS})`,
                suggestions: [
                    'Set explicit dimensions for media',
                    'Reserve space for dynamic content',
                    'Avoid inserting content above existing content',
                    'Use CSS aspect-ratio for responsive media'
                ]
            });
        }

        // Resource size recommendations
        const totalSize = resources.totalSize;
        if (totalSize > 500000) { // 500KB
            recommendations.push({
                type: 'BUNDLE_SIZE',
                priority: 'medium',
                message: `Total bundle size is ${this.formatSize(totalSize)}`,
                suggestions: [
                    'Enable compression (gzip/brotli)',
                    'Implement code splitting',
                    'Remove unused dependencies',
                    'Optimize images and assets'
                ]
            });
        }

        // Too many requests
        if (resources.requests > 100) {
            recommendations.push({
                type: 'REQUESTS',
                priority: 'medium',
                message: `High number of requests: ${resources.requests}`,
                suggestions: [
                    'Bundle CSS and JavaScript files',
                    'Use CSS sprites for small images',
                    'Implement HTTP/2 server push',
                    'Consider using a CDN'
                ]
            });
        }

        this.results.recommendations = recommendations;

        if (recommendations.length === 0) {
            console.log('✅ No performance issues detected!');
        } else {
            console.log(`⚠️ Generated ${recommendations.length} performance recommendations`);
        }
    }

    /**
     * Start local HTTP server for testing
     */
    async startLocalServer() {
        const http = await import('http');
        const fs = await import('fs');
        const path = await import('path');
        
        return new Promise((resolve) => {
            const server = http.createServer((req, res) => {
                let filePath = path.join(CONFIG.ROOT_DIR, req.url === '/' ? '/index.html' : req.url);
                
                // Security check
                if (!filePath.startsWith(CONFIG.ROOT_DIR)) {
                    res.writeHead(403);
                    res.end('Forbidden');
                    return;
                }
                
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('Not Found');
                        return;
                    }
                    
                    // Set appropriate content type
                    const ext = path.extname(filePath);
                    const contentTypes = {
                        '.html': 'text/html',
                        '.css': 'text/css',
                        '.js': 'application/javascript',
                        '.json': 'application/json',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.svg': 'image/svg+xml'
                    };
                    
                    res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.writeHead(200);
                    res.end(data);
                });
            });
            
            server.listen(8000, () => {
                console.log('🌐 Local server started on http://localhost:8000');
                resolve(server);
            });
        });
    }

    /**
     * Get resource type from URL
     */
    getResourceTypeFromUrl(url) {
        const pathname = new URL(url).pathname;
        
        if (pathname.match(/\.(css)$/)) return 'style';
        if (pathname.match(/\.(js|mjs)$/)) return 'script';
        if (pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (pathname.match(/\.(woff2?|ttf|eot)$/)) return 'font';
        if (pathname.match(/\.(json)$/)) return 'data';
        if (pathname.match(/\.(html?)$/)) return 'document';
        
        return 'other';
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

    /**
     * Save performance results
     */
    async saveResults() {
        const reportPath = path.join(CONFIG.OUTPUT_DIR, 'performance-report.json');
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2), 'utf8');

        // Create human-readable summary
        const summaryPath = path.join(CONFIG.OUTPUT_DIR, 'performance-summary.txt');
        const summary = this.generateSummary();
        await fs.writeFile(summaryPath, summary, 'utf8');

        console.log(`📊 Performance report saved to ${reportPath}`);
        console.log(`📋 Performance summary saved to ${summaryPath}`);
    }

    /**
     * Generate human-readable summary
     */
    generateSummary() {
        const { score, metrics, budgetResults } = this.results;
        
        let summary = `PERFORMANCE VALIDATION REPORT\n`;
        summary += `Generated: ${this.results.timestamp}\n`;
        summary += `Overall Score: ${score}/100\n\n`;
        
        summary += `CORE WEB VITALS:\n`;
        summary += `LCP (Largest Contentful Paint): ${metrics.coreWebVitals.LCP}ms ${budgetResults.LCP?.status}\n`;
        summary += `FID (First Input Delay): ${metrics.coreWebVitals.FID}ms ${budgetResults.FID?.status}\n`;
        summary += `CLS (Cumulative Layout Shift): ${metrics.coreWebVitals.CLS} ${budgetResults.CLS?.status}\n\n`;
        
        summary += `LOADING METRICS:\n`;
        summary += `First Contentful Paint: ${Math.round(metrics.loading.FCP)}ms\n`;
        summary += `Time to Interactive: ${Math.round(metrics.loading.TTI)}ms\n`;
        summary += `Total Resources: ${metrics.resources.requests}\n`;
        summary += `Total Size: ${this.formatSize(metrics.resources.totalSize)}\n\n`;
        
        if (this.results.recommendations.length > 0) {
            summary += `RECOMMENDATIONS:\n`;
            this.results.recommendations.forEach((rec, i) => {
                summary += `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}\n`;
                rec.suggestions.forEach(suggestion => {
                    summary += `   • ${suggestion}\n`;
                });
            });
        } else {
            summary += `✅ No performance issues detected!\n`;
        }
        
        return summary;
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new PerformanceValidator();
    
    validator.validate()
        .then(() => {
            console.log('🎉 Performance validation completed successfully!');
            console.log(`📊 Final Score: ${validator.results.score}/100`);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Performance validation failed:', error.message);
            process.exit(1);
        });
}

export default PerformanceValidator;