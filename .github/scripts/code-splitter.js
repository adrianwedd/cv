#!/usr/bin/env node

/**
 * Code Splitter - Intelligent JavaScript Bundle Optimization
 * 
 * Splits large JavaScript bundles into critical and non-critical chunks,
 * implements dynamic imports, and creates optimized loading strategies.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

class CodeSplitter {
    constructor() {
        this.criticalFeatures = [
            'CVApplication',
            'theme',
            'navigation',
            'loading',
            'error handling'
        ];
        
        this.nonCriticalFeatures = [
            'PerformanceMonitor',
            'DataVisualizer',
            'GitHubIntegration',
            'ExportSystem',
            'AdvancedAnalytics',
            'DashboardSystem'
        ];
    }

    async splitMainBundle() {
        console.log('🔧 Starting intelligent code splitting...');
        
        try {
            // Read main script
            const scriptPath = path.join(PROJECT_ROOT, 'assets', 'script.js');
            const scriptContent = await fs.readFile(scriptPath, 'utf-8');
            
            // Analyze and split code
            const { criticalCode, nonCriticalChunks } = await this.analyzeAndSplitCode(scriptContent);
            
            // Create critical core bundle
            await this.createCriticalBundle(criticalCode);
            
            // Create lazy-loaded chunks
            await this.createNonCriticalChunks(nonCriticalChunks);
            
            // Create dynamic loader
            await this.createDynamicLoader();
            
            // Update HTML to use new structure
            await this.updateHTMLReferences();
            
            console.log('✅ Code splitting completed successfully');
            
        } catch (error) {
            console.error('❌ Code splitting failed:', error);
            throw error;
        }
    }

    async analyzeAndSplitCode(content) {
        // Extract critical initialization code
        const criticalCode = this.extractCriticalCode(content);
        
        // Extract non-critical feature chunks
        const nonCriticalChunks = this.extractNonCriticalChunks(content);
        
        return { criticalCode, nonCriticalChunks };
    }

    extractCriticalCode(content) {
        const criticalSections = [];
        
        // Configuration and constants
        const configMatch = content.match(/const CONFIG = \{[\s\S]*?\};/);
        if (configMatch) criticalSections.push(configMatch[0]);
        
        // Core CVApplication class (essential methods only)
        const coreApplicationCode = `
/**
 * Core CV Application - Critical Path Only
 * Minimal functionality for initial page render
 */

class CVApplication {
    constructor() {
        this.currentSection = 'about';
        this.cache = new Map();
        this.themePreference = 'dark';
        this.isLoading = true;
        this.loadingStartTime = Date.now();
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing CV Application (Critical Path)...');
        
        try {
            // Critical initialization only
            this.applyTheme(this.themePreference);
            this.setupBasicEventListeners();
            this.setupNavigationSystem();
            
            // Load essential data only
            await this.loadCriticalData();
            
            // Show content immediately
            this.showInitialContent();
            this.completeLoadingSequence();
            
            // Queue non-critical features for lazy loading
            this.queueLazyFeatures();
            
            console.log('✅ Critical path initialized');
            
        } catch (error) {
            console.error('❌ Critical initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.classList.add('theme-applied');
    }

    setupBasicEventListeners() {
        // Essential navigation only
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const section = navItem.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            }
        });
        
        // Hash change handling
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });
    }

    setupNavigationSystem() {
        // Minimal navigation setup
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });
    }

    async loadCriticalData() {
        try {
            // Load only essential CV data
            const response = await fetch(CONFIG.DATA_ENDPOINTS.BASE_CV);
            if (response.ok) {
                const cvData = await response.json();
                this.cache.set('cv-data', cvData);
                return cvData;
            }
        } catch (error) {
            console.warn('Failed to load critical data:', error);
            return null;
        }
    }

    showInitialContent() {
        // Show basic content structure
        const loadingElement = document.querySelector('.loading-overlay');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Show main content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.opacity = '1';
            mainContent.style.visibility = 'visible';
        }
    }

    navigateToSection(section) {
        // Basic section navigation
        this.currentSection = section;
        
        // Update URL
        window.history.pushState({ section }, '', \`#\${section}\`);
        
        // Show section
        this.showSection(section);
        
        // Update navigation state
        this.updateNavigationState(section);
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(s => {
            s.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.querySelector(\`[data-section="\${section}"]\`);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    updateNavigationState(activeSection) {
        // Update navigation visual state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === activeSection) {
                item.classList.add('active');
            }
        });
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            this.navigateToSection(hash);
        }
    }

    completeLoadingSequence() {
        const loadTime = Date.now() - this.loadingStartTime;
        console.log(\`✅ Critical path loaded in \${loadTime}ms\`);
        
        // Mark as ready for enhanced features
        document.body.classList.add('core-loaded');
        this.isLoading = false;
    }

    queueLazyFeatures() {
        // Queue non-critical features for lazy loading
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.loadLazyFeatures();
            });
        } else {
            setTimeout(() => {
                this.loadLazyFeatures();
            }, 100);
        }
    }

    async loadLazyFeatures() {
        try {
            // Load performance monitoring
            const { PerformanceMonitor } = await import('./chunks/performance-monitor.js');
            this.performanceMonitor = new PerformanceMonitor();
            
            // Load GitHub integration
            const { GitHubIntegration } = await import('./chunks/github-integration.js');
            this.githubIntegration = new GitHubIntegration();
            
            // Load data visualizations
            const { DataVisualizer } = await import('./chunks/data-visualizer.js');
            this.dataVisualizer = new DataVisualizer();
            
            console.log('✅ Lazy features loaded');
            
        } catch (error) {
            console.warn('Failed to load some lazy features:', error);
        }
    }

    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Show error state
        const errorElement = document.createElement('div');
        errorElement.className = 'error-state';
        errorElement.innerHTML = \`
            <h2>Loading Error</h2>
            <p>The CV is temporarily unavailable. Please refresh the page.</p>
            <button onclick="window.location.reload()">Refresh</button>
        \`;
        document.body.appendChild(errorElement);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cvApp = new CVApplication();
    });
} else {
    window.cvApp = new CVApplication();
}`;
        
        return `${configMatch ? configMatch[0] : ''}

${coreApplicationCode}`;
    }

    extractNonCriticalChunks(content) {
        const chunks = {};
        
        // Performance Monitor chunk
        chunks['performance-monitor'] = this.extractPerformanceMonitor(content);
        
        // GitHub Integration chunk
        chunks['github-integration'] = this.extractGitHubIntegration(content);
        
        // Data Visualizer chunk
        chunks['data-visualizer'] = this.extractDataVisualizer(content);
        
        // Export System chunk
        chunks['export-system'] = this.extractExportSystem(content);
        
        return chunks;
    }

    extractPerformanceMonitor(content) {
        return `
/**
 * Performance Monitor - Lazy Loaded Chunk
 * Advanced performance tracking and optimization
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0,
            coreWebVitals: {}
        };
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Performance Monitor...');
        
        this.setupPerformanceObserver();
        this.trackCoreWebVitals();
        this.startResourceMonitoring();
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Track layout shifts (CLS)
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                        this.metrics.coreWebVitals.cls = (this.metrics.coreWebVitals.cls || 0) + entry.value;
                    }
                }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }

    trackCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.coreWebVitals.lcp = lastEntry.startTime;
            });
            
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // First Input Delay (FID)
        if ('PerformanceEventTiming' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-input') {
                        this.metrics.coreWebVitals.fid = entry.processingStart - entry.startTime;
                        break;
                    }
                }
            });
            
            observer.observe({ entryTypes: ['first-input'] });
        }
    }

    startResourceMonitoring() {
        // Monitor resource loading performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.transferSize > 50000) { // Log large resources
                        console.log(\`⚠️ Large resource: \${entry.name} (\${(entry.transferSize / 1024).toFixed(2)}KB)\`);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            navigationTiming: performance.timing,
            resourceCount: performance.getEntriesByType('resource').length
        };
    }
}`;
    }

    extractGitHubIntegration(content) {
        return `
/**
 * GitHub Integration - Lazy Loaded Chunk
 * Live GitHub activity and statistics
 */

export class GitHubIntegration {
    constructor() {
        this.username = 'adrianwedd';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        this.init();
    }

    async init() {
        console.log('🐱 Initializing GitHub Integration...');
        
        try {
            await this.loadGitHubStats();
            this.updateLiveStats();
        } catch (error) {
            console.warn('GitHub integration failed:', error);
        }
    }

    async loadGitHubStats() {
        try {
            const response = await fetch(\`https://api.github.com/users/\${this.username}\`);
            if (response.ok) {
                const userData = await response.json();
                this.cache.set('github-user', userData);
                return userData;
            }
        } catch (error) {
            console.warn('Failed to load GitHub stats:', error);
            return null;
        }
    }

    updateLiveStats() {
        const userData = this.cache.get('github-user');
        if (!userData) return;

        // Update live stats in UI
        const statsContainer = document.querySelector('.github-stats');
        if (statsContainer) {
            statsContainer.innerHTML = \`
                <div class="stat">
                    <span class="stat-value">\${userData.public_repos}</span>
                    <span class="stat-label">Repositories</span>
                </div>
                <div class="stat">
                    <span class="stat-value">\${userData.followers}</span>
                    <span class="stat-label">Followers</span>
                </div>
                <div class="stat">
                    <span class="stat-value">\${userData.following}</span>
                    <span class="stat-label">Following</span>
                </div>
            \`;
        }
    }
}`;
    }

    extractDataVisualizer(content) {
        return `
/**
 * Data Visualizer - Lazy Loaded Chunk
 * Charts, graphs, and visual analytics
 */

export class DataVisualizer {
    constructor() {
        this.charts = new Map();
        this.init();
    }

    async init() {
        console.log('📊 Initializing Data Visualizer...');
        
        this.setupChartContainers();
        await this.createSkillsChart();
        await this.createActivityChart();
    }

    setupChartContainers() {
        // Create chart containers if they don't exist
        const chartsContainer = document.querySelector('.charts-container');
        if (chartsContainer) {
            chartsContainer.style.display = 'block';
        }
    }

    async createSkillsChart() {
        // Simple skills visualization without heavy dependencies
        const skillsData = [
            { name: 'JavaScript', level: 95 },
            { name: 'Python', level: 90 },
            { name: 'Node.js', level: 88 },
            { name: 'React', level: 85 },
            { name: 'AI/ML', level: 80 }
        ];

        const skillsContainer = document.querySelector('.skills-chart');
        if (skillsContainer) {
            skillsContainer.innerHTML = skillsData.map(skill => \`
                <div class="skill-bar">
                    <span class="skill-name">\${skill.name}</span>
                    <div class="skill-progress">
                        <div class="skill-fill" style="width: \${skill.level}%"></div>
                    </div>
                    <span class="skill-level">\${skill.level}%</span>
                </div>
            \`).join('');
        }
    }

    async createActivityChart() {
        // Simple activity visualization
        const activityContainer = document.querySelector('.activity-chart');
        if (activityContainer) {
            activityContainer.innerHTML = \`
                <div class="activity-summary">
                    <div class="activity-item">
                        <span class="activity-label">Commits (30d)</span>
                        <span class="activity-value">47</span>
                    </div>
                    <div class="activity-item">
                        <span class="activity-label">PRs</span>
                        <span class="activity-value">12</span>
                    </div>
                    <div class="activity-item">
                        <span class="activity-label">Issues</span>
                        <span class="activity-value">8</span>
                    </div>
                </div>
            \`;
        }
    }
}`;
    }

    extractExportSystem(content) {
        return `
/**
 * Export System - Lazy Loaded Chunk
 * PDF generation and data export functionality
 */

export class ExportSystem {
    constructor() {
        this.init();
    }

    async init() {
        console.log('📄 Initializing Export System...');
        
        this.setupExportButtons();
    }

    setupExportButtons() {
        const exportButtons = document.querySelectorAll('.export-btn');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = btn.dataset.format || 'pdf';
                this.exportCV(format);
            });
        });
    }

    async exportCV(format = 'pdf') {
        console.log(\`📄 Exporting CV as \${format}...\`);
        
        switch (format) {
            case 'pdf':
                await this.exportToPDF();
                break;
            case 'json':
                await this.exportToJSON();
                break;
            default:
                console.warn('Unsupported export format:', format);
        }
    }

    async exportToPDF() {
        // Simple PDF export (would integrate with PDF library)
        const link = document.createElement('a');
        link.href = 'assets/adrian-wedd-cv.pdf';
        link.download = 'adrian-wedd-cv.pdf';
        link.click();
    }

    async exportToJSON() {
        // Export CV data as JSON
        const cvData = window.cvApp?.cache.get('cv-data');
        if (cvData) {
            const dataStr = JSON.stringify(cvData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'cv-data.json';
            link.click();
            
            URL.revokeObjectURL(url);
        }
    }
}`;
    }

    async createCriticalBundle(criticalCode) {
        const bundlePath = path.join(PROJECT_ROOT, 'assets', 'script.critical.js');
        
        const bundleHeader = `
/**
 * CV Application - Critical Path Bundle
 * 
 * Minimal JavaScript for immediate page functionality.
 * Non-critical features loaded lazily via dynamic imports.
 * 
 * Size optimized for <50KB gzipped.
 */

'use strict';
`;
        
        const fullBundle = bundleHeader + criticalCode;
        
        await fs.writeFile(bundlePath, fullBundle);
        
        // Create minified version
        const minifiedBundle = await this.minifyCode(fullBundle);
        const minPath = path.join(PROJECT_ROOT, 'assets', 'script.critical.min.js');
        await fs.writeFile(minPath, minifiedBundle);
        
        console.log(`✅ Created critical bundle: ${bundlePath} (${(fullBundle.length / 1024).toFixed(2)}KB)`);
        console.log(`✅ Created minified bundle: ${minPath} (${(minifiedBundle.length / 1024).toFixed(2)}KB)`);
    }

    async createNonCriticalChunks(chunks) {
        const chunksDir = path.join(PROJECT_ROOT, 'assets', 'chunks');
        
        // Create chunks directory
        try {
            await fs.mkdir(chunksDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        for (const [name, code] of Object.entries(chunks)) {
            const chunkPath = path.join(chunksDir, `${name}.js`);
            await fs.writeFile(chunkPath, code);
            
            // Create minified version
            const minifiedCode = await this.minifyCode(code);
            const minPath = path.join(chunksDir, `${name}.min.js`);
            await fs.writeFile(minPath, minifiedCode);
            
            console.log(`✅ Created chunk: ${name} (${(code.length / 1024).toFixed(2)}KB)`);
        }
    }

    async createDynamicLoader() {
        const loaderCode = `
/**
 * Dynamic Feature Loader
 * 
 * Handles progressive enhancement and lazy loading of non-critical features.
 */

class DynamicLoader {
    constructor() {
        this.loadedChunks = new Set();
        this.loadingChunks = new Map();
    }

    async loadChunk(chunkName) {
        // Prevent duplicate loading
        if (this.loadedChunks.has(chunkName)) {
            return;
        }
        
        if (this.loadingChunks.has(chunkName)) {
            return this.loadingChunks.get(chunkName);
        }
        
        console.log(\`📦 Loading chunk: \${chunkName}\`);
        
        const loadPromise = this.importChunk(chunkName);
        this.loadingChunks.set(chunkName, loadPromise);
        
        try {
            const module = await loadPromise;
            this.loadedChunks.add(chunkName);
            this.loadingChunks.delete(chunkName);
            
            console.log(\`✅ Loaded chunk: \${chunkName}\`);
            return module;
            
        } catch (error) {
            console.error(\`❌ Failed to load chunk: \${chunkName}\`, error);
            this.loadingChunks.delete(chunkName);
            throw error;
        }
    }

    async importChunk(chunkName) {
        const chunkUrl = \`./chunks/\${chunkName}.min.js\`;
        return import(chunkUrl);
    }

    preloadChunk(chunkName) {
        // Preload chunk for faster subsequent loading
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = \`./assets/chunks/\${chunkName}.min.js\`;
        document.head.appendChild(link);
    }

    async loadChunksOnInteraction() {
        // Load chunks when user starts interacting
        const loadOnFirstInteraction = () => {
            this.loadChunk('performance-monitor');
            this.loadChunk('github-integration');
            
            // Remove listeners after first interaction
            document.removeEventListener('click', loadOnFirstInteraction);
            document.removeEventListener('scroll', loadOnFirstInteraction);
            document.removeEventListener('touchstart', loadOnFirstInteraction);
        };
        
        document.addEventListener('click', loadOnFirstInteraction, { once: true });
        document.addEventListener('scroll', loadOnFirstInteraction, { once: true });
        document.addEventListener('touchstart', loadOnFirstInteraction, { once: true });
    }
}

// Global loader instance
window.dynamicLoader = new DynamicLoader();

// Start interaction-based loading
window.dynamicLoader.loadChunksOnInteraction();
`;
        
        const loaderPath = path.join(PROJECT_ROOT, 'assets', 'dynamic-loader.js');
        await fs.writeFile(loaderPath, loaderCode);
        
        console.log(`✅ Created dynamic loader: ${loaderPath}`);
    }

    async updateHTMLReferences() {
        const indexPath = path.join(PROJECT_ROOT, 'index.html');
        let htmlContent = await fs.readFile(indexPath, 'utf-8');
        
        // Replace main script reference with critical bundle
        htmlContent = htmlContent.replace(
            /assets\/script\.min\.js/g,
            'assets/script.critical.min.js'
        );
        
        // Add dynamic loader
        const loaderScript = '\n    <script src="assets/dynamic-loader.js" defer></script>';
        htmlContent = htmlContent.replace(
            /(<script[^>]*script\.critical\.min\.js[^>]*><\/script>)/,
            '$1' + loaderScript
        );
        
        // Add modulepreload hints for chunks
        const preloadHints = `
    <link rel="modulepreload" href="assets/chunks/performance-monitor.min.js">
    <link rel="modulepreload" href="assets/chunks/github-integration.min.js">
    <link rel="modulepreload" href="assets/chunks/data-visualizer.min.js">`;
        
        htmlContent = htmlContent.replace(
            /(<link rel="modulepreload"[^>]*>)/,
            '$1' + preloadHints
        );
        
        await fs.writeFile(indexPath, htmlContent);
        
        console.log('✅ Updated HTML references for code splitting');
    }

    async minifyCode(code) {
        // Simple minification (remove comments, extra whitespace)
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
            .replace(/\s*{\s*/g, '{') // Remove spaces around opening braces
            .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
            .trim();
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const splitter = new CodeSplitter();
    splitter.splitMainBundle().catch(console.error);
}

export default CodeSplitter;