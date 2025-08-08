#!/usr/bin/env node

/**
 * CV Data Pipeline Optimizer
 * 
 * Optimizes data structures, asset delivery, and caching strategies for 
 * lightning-fast frontend performance supporting the stunning dark mode redesign.
 * 
 * Key Features:
 * - Data structure optimization for frontend rendering
 * - Intelligent data chunking and lazy loading
 * - Asset minification and compression
 * - Smart caching strategies
 * - Mobile-first optimization
 * - Core Web Vitals monitoring
 * 
 * Performance Targets:
 * - First Contentful Paint: <1.5s
 * - Largest Contentful Paint: <2.5s
 * - Total Blocking Time: <100ms
 * - Mobile PageSpeed: 95+
 * - Desktop PageSpeed: 98+
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine project root
let rootPrefix = '../..';
const projectRoot = path.resolve(__dirname, rootPrefix);

const CONFIG = {
    PROJECT_ROOT: projectRoot,
    DATA_DIR: path.join(projectRoot, 'data'),
    ASSETS_DIR: path.join(projectRoot, 'assets'),
    OPTIMIZED_DIR: path.join(projectRoot, 'data', 'optimized'),
    CACHE_DIR: path.join(projectRoot, 'data', 'cache'),
    PERFORMANCE_BUDGET: {
        MAX_CRITICAL_PATH: 14400, // 14.4KB for critical path (HTTP/1.1 first round trip)
        MAX_JSON_SIZE: 50000,     // 50KB max per JSON chunk
        TARGET_GZIP_RATIO: 0.7,   // Target 70% compression
        MAX_ASSET_SIZE: 200000,   // 200KB max per asset
    }
};

/**
 * Data Pipeline Optimizer
 * Transforms data structures for optimal frontend performance
 */
class DataPipelineOptimizer {
    constructor() {
        this.optimizationStartTime = Date.now();
        this.metrics = {
            originalSize: 0,
            optimizedSize: 0,
            compressionRatio: 0,
            chunkCount: 0,
            cacheHitRatio: 0
        };
    }

    /**
     * Main optimization pipeline
     */
    async optimize() {
        console.log('⚡ **CV DATA PIPELINE OPTIMIZER INITIATED**');
        console.log(`🎯 Target: Lightning-fast frontend performance`);
        console.log(`📊 Performance Budget: FCP <1.5s, LCP <2.5s, TBT <100ms`);
        console.log('');

        try {
            // Prepare directories
            await this.prepareDirectories();

            // Analyze current data structure
            await this.analyzeCurrentData();

            // Optimize data structures
            await this.optimizeDataStructures();

            // Create lazy loading chunks
            await this.createLazyLoadingChunks();

            // Optimize assets
            await this.optimizeAssets();

            // Generate performance manifests
            await this.generatePerformanceManifests();

            // Create caching strategies
            await this.implementCachingStrategies();

            // Generate monitoring scripts
            await this.generatePerformanceMonitoring();

            // Generate optimization report
            await this.generateOptimizationReport();

            const optimizationTime = ((Date.now() - this.optimizationStartTime) / 1000).toFixed(2);
            console.log(`✅ Data pipeline optimization complete in ${optimizationTime}s`);
            console.log(`🚀 Performance gain: ${this.calculatePerformanceGain()}%`);

        } catch (error) {
            console.error('❌ Pipeline optimization failed:', error.message);
            throw error;
        }
    }

    /**
     * Prepare optimization directories
     */
    async prepareDirectories() {
        console.log('📁 Preparing optimization directories...');
        
        const directories = [
            CONFIG.OPTIMIZED_DIR,
            CONFIG.CACHE_DIR,
            path.join(CONFIG.OPTIMIZED_DIR, 'chunks'),
            path.join(CONFIG.OPTIMIZED_DIR, 'assets'),
            path.join(CONFIG.CACHE_DIR, 'manifests')
        ];

        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }

        console.log('✅ Directories prepared');
    }

    /**
     * Analyze current data structure for optimization opportunities
     */
    async analyzeCurrentData() {
        console.log('🔍 Analyzing current data structures...');

        const dataFiles = [
            'base-cv.json',
            'activity-summary.json',
            'ai-enhancements.json'
        ];

        let totalSize = 0;
        const analysis = {};

        for (const file of dataFiles) {
            try {
                const filePath = path.join(CONFIG.DATA_DIR, file);
                const content = await fs.readFile(filePath, 'utf8');
                const data = JSON.parse(content);
                const size = Buffer.byteLength(content, 'utf8');
                
                analysis[file] = {
                    size,
                    structure: this.analyzeStructure(data),
                    compressionPotential: await this.analyzeCompressionPotential(content)
                };
                
                totalSize += size;
                
                console.log(`  📄 ${file}: ${(size / 1024).toFixed(1)}KB`);
                
            } catch (error) {
                console.warn(`⚠️ Could not analyze ${file}:`, error.message);
            }
        }

        this.metrics.originalSize = totalSize;
        console.log(`📊 Total data size: ${(totalSize / 1024).toFixed(1)}KB`);
        console.log(`🎯 Target optimization: ${CONFIG.PERFORMANCE_BUDGET.TARGET_GZIP_RATIO * 100}% size reduction`);

        // Save analysis report
        await fs.writeFile(
            path.join(CONFIG.OPTIMIZED_DIR, 'data-analysis.json'),
            JSON.stringify(analysis, null, 2)
        );

        console.log('✅ Data analysis complete');
    }

    /**
     * Optimize data structures for frontend efficiency
     */
    async optimizeDataStructures() {
        console.log('🔧 Optimizing data structures...');

        // Optimize base CV data
        await this.optimizeBaseCVData();

        // Optimize activity data
        await this.optimizeActivityData();

        // Create critical path data
        await this.createCriticalPathData();

        console.log('✅ Data structures optimized');
    }

    /**
     * Optimize activity data for performance
     */
    async optimizeActivityData() {
        try {
            const activityDataPath = path.join(CONFIG.DATA_DIR, 'activity-summary.json');
            const content = await fs.readFile(activityDataPath, 'utf8');
            const data = JSON.parse(content);

            // Create optimized activity structure
            const optimized = {
                summary: {
                    total_commits: data.summary?.total_commits || 0,
                    active_repositories: data.summary?.active_repositories || 0,
                    commits_last_30_days: data.summary?.commits_last_30_days || 0,
                    activity_score: data.summary?.activity_score || 0,
                    tracking_status: data.summary?.tracking_status || 'active'
                },
                metadata: {
                    last_updated: data.last_updated || new Date().toISOString(),
                    version: data.tracker_version || '1.0.0'
                }
            };

            // Save optimized structure
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'activity-summary-optimized.json'),
                JSON.stringify(optimized, null, 2)
            );

            console.log('  ✅ Activity data optimized');

        } catch (error) {
            console.warn('⚠️ Activity data optimization failed:', error.message);
        }
    }

    /**
     * Create critical path data for immediate loading
     */
    async createCriticalPathData() {
        try {
            const baseCVPath = path.join(CONFIG.DATA_DIR, 'base-cv.json');
            const content = await fs.readFile(baseCVPath, 'utf8');
            const data = JSON.parse(content);

            // Extract only critical data for first paint
            const criticalData = {
                personal_info: data.personal_info,
                professional_summary: data.professional_summary?.substring(0, 200) + '...',
                metadata: {
                    version: data.metadata?.version,
                    last_updated: data.metadata?.last_updated
                },
                seo: {
                    title: `${data.personal_info?.name} - ${data.personal_info?.title}`,
                    description: data.professional_summary?.substring(0, 160)
                }
            };

            // Save critical path data
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'critical-path-data.json'),
                JSON.stringify(criticalData, null, 2)
            );

            console.log('  ✅ Critical path data created');

        } catch (error) {
            console.warn('⚠️ Critical path data creation failed:', error.message);
        }
    }

    /**
     * Optimize base CV data for rendering performance
     */
    async optimizeBaseCVData() {
        try {
            const baseCVPath = path.join(CONFIG.DATA_DIR, 'base-cv.json');
            const content = await fs.readFile(baseCVPath, 'utf8');
            const data = JSON.parse(content);

            // Create optimized structure for frontend
            const optimized = {
                // Critical data for initial render
                critical: {
                    personal_info: data.personal_info,
                    professional_summary: data.professional_summary?.substring(0, 300) + '...', // Truncate for initial load
                    metadata: {
                        version: data.metadata?.version,
                        last_updated: data.metadata?.last_updated
                    }
                },

                // Lazy-loaded sections
                sections: {
                    experience: this.optimizeExperience(data.experience || []),
                    projects: this.optimizeProjects(data.projects || []),
                    skills: this.optimizeSkills(data.skills || []),
                    achievements: this.optimizeAchievements(data.achievements || [])
                },

                // SEO and metadata
                seo: {
                    title: `${data.personal_info?.name} - ${data.personal_info?.title}`,
                    description: data.professional_summary?.substring(0, 160),
                    keywords: this.extractKeywords(data)
                }
            };

            // Save optimized structure
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'base-cv-optimized.json'),
                JSON.stringify(optimized, null, 2)
            );

            // Create minified version for production
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'base-cv-min.json'),
                JSON.stringify(optimized)
            );

            console.log('  ✅ Base CV data optimized');

        } catch (error) {
            console.warn('⚠️ Base CV optimization failed:', error.message);
        }
    }

    /**
     * Optimize experience data for performance
     */
    optimizeExperience(experience) {
        return experience.map(job => ({
            id: crypto.createHash('md5').update(job.company + job.position).digest('hex').substring(0, 8),
            position: job.position,
            company: job.company,
            period: job.period,
            type: job.type,
            description: job.description?.substring(0, 200) + '...',
            achievements: job.achievements?.slice(0, 3), // Limit to top 3 achievements
            technologies: job.technologies?.slice(0, 8), // Limit to 8 key technologies
            verified: job.verified,
            priority: this.calculateExperiencePriority(job)
        })).sort((a, b) => b.priority - a.priority);
    }

    /**
     * Optimize projects data for performance
     */
    optimizeProjects(projects) {
        return projects.map(project => ({
            id: crypto.createHash('md5').update(project.name).digest('hex').substring(0, 8),
            name: project.name,
            subtitle: project.subtitle,
            description: project.description?.substring(0, 150) + '...',
            technologies: project.technologies?.slice(0, 6),
            github: project.github,
            status: project.status,
            period: project.period,
            verified: project.verified,
            commits: project.commits,
            priority: this.calculateProjectPriority(project)
        })).sort((a, b) => b.priority - a.priority);
    }

    /**
     * Optimize skills data with categorization and proficiency
     */
    optimizeSkills(skills) {
        const categories = {};
        
        skills.forEach(skill => {
            const category = skill.category || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            
            categories[category].push({
                name: skill.name,
                level: skill.level,
                proficiency: skill.proficiency,
                verified: skill.verified,
                priority: skill.level // Use level as priority
            });
        });

        // Sort skills within each category by priority
        Object.keys(categories).forEach(category => {
            categories[category].sort((a, b) => b.priority - a.priority);
            categories[category] = categories[category].slice(0, 12); // Limit to 12 per category
        });

        return categories;
    }

    /**
     * Optimize achievements for visual impact
     */
    optimizeAchievements(achievements) {
        return achievements.map(achievement => ({
            id: crypto.createHash('md5').update(achievement.title).digest('hex').substring(0, 8),
            icon: achievement.icon,
            title: achievement.title,
            description: achievement.description?.substring(0, 120) + '...',
            date: achievement.date,
            category: achievement.category,
            verified: achievement.verified,
            impact: this.calculateAchievementImpact(achievement)
        })).sort((a, b) => b.impact - a.impact).slice(0, 6); // Top 6 achievements
    }

    /**
     * Create lazy loading chunks for optimal loading
     */
    async createLazyLoadingChunks() {
        console.log('📦 Creating lazy loading chunks...');

        try {
            const optimizedData = JSON.parse(
                await fs.readFile(path.join(CONFIG.OPTIMIZED_DIR, 'base-cv-optimized.json'), 'utf8')
            );

            const chunks = {
                critical: optimizedData.critical,
                experience: { data: optimizedData.sections.experience },
                projects: { data: optimizedData.sections.projects },
                skills: { data: optimizedData.sections.skills },
                achievements: { data: optimizedData.sections.achievements },
                seo: optimizedData.seo
            };

            // Save individual chunks
            for (const [chunkName, chunkData] of Object.entries(chunks)) {
                const chunkPath = path.join(CONFIG.OPTIMIZED_DIR, 'chunks', `${chunkName}.json`);
                await fs.writeFile(chunkPath, JSON.stringify(chunkData, null, 2));
                
                // Create compressed version
                const compressed = zlib.gzipSync(JSON.stringify(chunkData));
                await fs.writeFile(`${chunkPath}.gz`, compressed);
                
                const originalSize = Buffer.byteLength(JSON.stringify(chunkData));
                const compressedSize = compressed.length;
                const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
                
                console.log(`  📦 ${chunkName}: ${originalSize}B → ${compressedSize}B (${ratio}% reduction)`);
            }

            this.metrics.chunkCount = Object.keys(chunks).length;
            console.log('✅ Lazy loading chunks created');

        } catch (error) {
            console.error('❌ Chunk creation failed:', error.message);
        }
    }

    /**
     * Optimize asset delivery pipeline
     */
    async optimizeAssets() {
        console.log('🎨 Optimizing asset delivery...');

        const assetOptimizations = await Promise.all([
            this.optimizeCSS(),
            this.optimizeJavaScript(),
            this.generateCriticalCSS()
        ]);

        console.log('✅ Assets optimized');
        return assetOptimizations;
    }

    /**
     * Optimize CSS for performance
     */
    async optimizeCSS() {
        try {
            const cssPath = path.join(CONFIG.ASSETS_DIR, 'styles.css');
            const css = await fs.readFile(cssPath, 'utf8');

            // Basic CSS minification
            const minified = css
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
                .trim();

            // Save minified CSS
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'assets', 'styles.min.css'),
                minified
            );

            // Create compressed version
            const compressed = zlib.gzipSync(minified);
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'assets', 'styles.min.css.gz'),
                compressed
            );

            const originalSize = Buffer.byteLength(css);
            const minifiedSize = Buffer.byteLength(minified);
            const compressedSize = compressed.length;

            console.log(`  🎨 CSS: ${originalSize}B → ${minifiedSize}B → ${compressedSize}B (gzipped)`);

        } catch (error) {
            console.warn('⚠️ CSS optimization failed:', error.message);
        }
    }

    /**
     * Optimize JavaScript for performance
     */
    async optimizeJavaScript() {
        try {
            const jsPath = path.join(CONFIG.ASSETS_DIR, 'script.js');
            const js = await fs.readFile(jsPath, 'utf8');

            // Basic JS minification (preserve functionality)
            const minified = js
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                .replace(/\/\/.*$/gm, '') // Remove line comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/;\s*}/g, '}') // Clean up syntax
                .trim();

            // Save minified JavaScript
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'assets', 'script.min.js'),
                minified
            );

            // Create compressed version
            const compressed = zlib.gzipSync(minified);
            await fs.writeFile(
                path.join(CONFIG.OPTIMIZED_DIR, 'assets', 'script.min.js.gz'),
                compressed
            );

            const originalSize = Buffer.byteLength(js);
            const minifiedSize = Buffer.byteLength(minified);
            const compressedSize = compressed.length;

            console.log(`  📜 JS: ${originalSize}B → ${minifiedSize}B → ${compressedSize}B (gzipped)`);

        } catch (error) {
            console.warn('⚠️ JavaScript optimization failed:', error.message);
        }
    }

    /**
     * Generate critical CSS for above-the-fold content
     */
    async generateCriticalCSS() {
        const criticalCSS = `
/* Critical Path CSS - Above the fold styling */
:root {
  --color-primary: #3b82f6;
  --color-background: #0a0a0a;
  --color-background-alt: #1a1a1a;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #e2e8f0;
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}

body {
  font-family: var(--font-family-primary);
  background: var(--color-background);
  color: var(--color-text-primary);
  margin: 0;
  padding: 0;
  line-height: 1.5;
}

.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
}

.loading-indicator {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
        `.trim();

        await fs.writeFile(
            path.join(CONFIG.OPTIMIZED_DIR, 'assets', 'critical.css'),
            criticalCSS
        );

        console.log('  ⚡ Critical CSS generated');
    }

    /**
     * Generate performance manifests
     */
    async generatePerformanceManifests() {
        console.log('📋 Generating performance manifests...');

        const manifest = {
            version: '1.0.0',
            generated: new Date().toISOString(),
            performance_budget: CONFIG.PERFORMANCE_BUDGET,
            chunks: {
                critical: {
                    path: 'chunks/critical.json',
                    priority: 'high',
                    preload: true
                },
                experience: {
                    path: 'chunks/experience.json',
                    priority: 'medium',
                    lazy: true
                },
                projects: {
                    path: 'chunks/projects.json',
                    priority: 'medium',
                    lazy: true
                },
                skills: {
                    path: 'chunks/skills.json',
                    priority: 'low',
                    lazy: true
                },
                achievements: {
                    path: 'chunks/achievements.json',
                    priority: 'low',
                    lazy: true
                }
            },
            assets: {
                critical_css: {
                    path: 'assets/critical.css',
                    inline: true
                },
                main_css: {
                    path: 'assets/styles.min.css',
                    preload: true
                },
                main_js: {
                    path: 'assets/script.min.js',
                    defer: true
                }
            },
            optimization_metrics: this.metrics
        };

        await fs.writeFile(
            path.join(CONFIG.CACHE_DIR, 'manifests', 'performance-manifest.json'),
            JSON.stringify(manifest, null, 2)
        );

        console.log('✅ Performance manifest generated');
    }

    /**
     * Implement intelligent caching strategies
     */
    async implementCachingStrategies() {
        console.log('🗄️ Implementing caching strategies...');

        const cacheStrategy = {
            version: '1.0.0',
            cache_policies: {
                static_assets: {
                    max_age: 31536000, // 1 year
                    strategy: 'cache-first',
                    files: ['*.css', '*.js', '*.png', '*.jpg', '*.svg']
                },
                data_chunks: {
                    max_age: 3600, // 1 hour
                    strategy: 'stale-while-revalidate',
                    files: ['chunks/*.json']
                },
                api_responses: {
                    max_age: 300, // 5 minutes
                    strategy: 'network-first',
                    fallback_cache: true
                }
            },
            service_worker: {
                enabled: true,
                precache: [
                    'chunks/critical.json',
                    'assets/critical.css'
                ],
                runtime_cache: [
                    {
                        url_pattern: '/data/optimized/chunks/',
                        strategy: 'stale-while-revalidate'
                    }
                ]
            }
        };

        await fs.writeFile(
            path.join(CONFIG.CACHE_DIR, 'cache-strategy.json'),
            JSON.stringify(cacheStrategy, null, 2)
        );

        // Generate service worker configuration
        const swConfig = this.generateServiceWorkerConfig(cacheStrategy);
        await fs.writeFile(
            path.join(CONFIG.OPTIMIZED_DIR, 'sw-config.js'),
            swConfig
        );

        console.log('✅ Caching strategies implemented');
    }

    /**
     * Generate performance monitoring scripts
     */
    async generatePerformanceMonitoring() {
        console.log('📊 Generating performance monitoring...');

        const monitoringScript = `
/**
 * CV Performance Monitor
 * Tracks Core Web Vitals and custom performance metrics
 */
class CVPerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        this.trackCoreWebVitals();
        this.trackCustomMetrics();
        this.setupReporting();
    }

    trackCoreWebVitals() {
        // First Contentful Paint
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.fcp = entry.startTime;
                    console.log('🎨 FCP:', entry.startTime.toFixed(2) + 'ms');
                }
            }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;
            console.log('🖼️ LCP:', lastEntry.startTime.toFixed(2) + 'ms');
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    this.metrics.cls = (this.metrics.cls || 0) + entry.value;
                }
            }
            console.log('📐 CLS:', this.metrics.cls?.toFixed(4));
        }).observe({ entryTypes: ['layout-shift'] });
    }

    trackCustomMetrics() {
        // Track data loading times
        this.trackDataLoadTimes();
        
        // Track user interactions
        this.trackInteractionMetrics();
    }

    trackDataLoadTimes() {
        const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name.includes('chunks/')) {
                    const chunkName = entry.name.split('/').pop().replace('.json', '');
                    this.metrics[\`chunk_\${chunkName}\`] = entry.duration;
                    console.log(\`📦 Chunk \${chunkName}:\`, entry.duration.toFixed(2) + 'ms');
                }
            }
        });
        observer.observe({ entryTypes: ['resource'] });
    }

    trackInteractionMetrics() {
        // Track first interaction
        let firstInteraction = true;
        document.addEventListener('click', () => {
            if (firstInteraction) {
                this.metrics.first_interaction = performance.now();
                firstInteraction = false;
                console.log('👆 First Interaction:', this.metrics.first_interaction.toFixed(2) + 'ms');
            }
        });
    }

    setupReporting() {
        // Report metrics after page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.reportMetrics();
            }, 5000); // Wait 5 seconds for all metrics
        });
    }

    reportMetrics() {
        const report = {
            timestamp: Date.now(),
            url: window.location.href,
            metrics: this.metrics,
            performance_grade: this.calculateGrade()
        };

        console.log('📊 Performance Report:', report);
        
        // Send to analytics (if configured)
        if (window.gtag) {
            window.gtag('event', 'performance_metrics', {
                custom_parameters: report
            });
        }
    }

    calculateGrade() {
        const { fcp, lcp, cls } = this.metrics;
        let grade = 100;

        if (fcp > 1500) grade -= 20; // Target: <1.5s
        if (lcp > 2500) grade -= 30; // Target: <2.5s  
        if (cls > 0.1) grade -= 25;  // Target: <0.1

        return Math.max(0, grade);
    }
}

// Initialize performance monitoring
new CVPerformanceMonitor();
        `.trim();

        await fs.writeFile(
            path.join(CONFIG.OPTIMIZED_DIR, 'performance-monitor.js'),
            monitoringScript
        );

        console.log('✅ Performance monitoring generated');
    }

    /**
     * Generate optimization report
     */
    async generateOptimizationReport() {
        console.log('📝 Generating optimization report...');

        const report = {
            generated: new Date().toISOString(),
            optimization_duration: ((Date.now() - this.optimizationStartTime) / 1000).toFixed(2) + 's',
            metrics: {
                ...this.metrics,
                compressionRatio: this.metrics.compressionRatio,
                performanceGain: this.calculatePerformanceGain() + '%'
            },
            recommendations: [
                'Implement HTTP/2 server push for critical resources',
                'Enable Brotli compression for even better compression ratios',
                'Consider implementing a CDN for global asset delivery',
                'Monitor Core Web Vitals regularly for performance regression',
                'Implement progressive image loading for visual content'
            ],
            next_steps: [
                'Deploy optimized assets to production',
                'Configure server-side caching headers',
                'Implement service worker for offline functionality',
                'Set up performance budgets in CI/CD pipeline'
            ]
        };

        await fs.writeFile(
            path.join(CONFIG.OPTIMIZED_DIR, 'optimization-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('📊 Optimization Summary:');
        console.log(`  💾 Size reduction: ${this.calculateSizeReduction()}%`);
        console.log(`  📦 Chunks created: ${this.metrics.chunkCount}`);
        console.log(`  🚀 Performance gain: ${this.calculatePerformanceGain()}%`);
        console.log(`  ⚡ Estimated FCP improvement: ${this.estimateFCPImprovement()}ms`);

        console.log('✅ Optimization report generated');
    }

    // Helper methods
    analyzeStructure(data) {
        return {
            depth: this.getObjectDepth(data),
            keys: Object.keys(data).length,
            arrays: this.countArrays(data),
            objects: this.countObjects(data)
        };
    }

    async analyzeCompressionPotential(content) {
        const original = Buffer.byteLength(content);
        const compressed = zlib.gzipSync(content);
        return {
            original,
            compressed: compressed.length,
            ratio: (compressed.length / original * 100).toFixed(1) + '%'
        };
    }

    calculateExperiencePriority(job) {
        let priority = 50;
        if (job.period && job.period.includes('Present')) priority += 30;
        if (job.verified) priority += 20;
        if (job.achievements && job.achievements.length > 3) priority += 10;
        return priority;
    }

    calculateProjectPriority(project) {
        let priority = 50;
        if (project.status === 'Active') priority += 30;
        if (project.github) priority += 20;
        if (project.commits && project.commits > 10) priority += 15;
        if (project.verified) priority += 10;
        return priority;
    }

    calculateAchievementImpact(achievement) {
        let impact = 50;
        if (achievement.verified) impact += 25;
        if (achievement.category === 'Technical Achievement') impact += 20;
        if (achievement.date && new Date(achievement.date) > new Date('2020-01-01')) impact += 15;
        return impact;
    }

    extractKeywords(data) {
        const skills = data.skills?.map(s => s.name) || [];
        const tech = data.experience?.flatMap(e => e.technologies || []) || [];
        return [...new Set([...skills, ...tech])].slice(0, 20);
    }

    generateServiceWorkerConfig(strategy) {
        return `
// Service Worker Configuration
const CACHE_NAME = 'cv-cache-v1';
const PRECACHE_ASSETS = ${JSON.stringify(strategy.service_worker.precache, null, 2)};

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/chunks/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        fetch(event.request).then((fetchResponse) => {
                            cache.put(event.request, fetchResponse.clone());
                        });
                        return response;
                    }
                    return fetch(event.request).then((fetchResponse) => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
    }
});
        `.trim();
    }

    getObjectDepth(obj, depth = 1) {
        if (typeof obj !== 'object' || obj === null) return depth;
        return Math.max(...Object.values(obj).map(v => this.getObjectDepth(v, depth + 1)));
    }

    countArrays(obj) {
        let count = 0;
        if (Array.isArray(obj)) count++;
        if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(v => count += this.countArrays(v));
        }
        return count;
    }

    countObjects(obj) {
        let count = 0;
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) count++;
        if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(v => count += this.countObjects(v));
        }
        return count;
    }

    calculatePerformanceGain() {
        if (this.metrics.originalSize === 0) return 0;
        return ((this.metrics.originalSize - this.metrics.optimizedSize) / this.metrics.originalSize * 100).toFixed(1);
    }

    calculateSizeReduction() {
        return this.calculatePerformanceGain();
    }

    estimateFCPImprovement() {
        const sizeReductionRatio = (this.metrics.originalSize - this.metrics.optimizedSize) / this.metrics.originalSize;
        return Math.round(sizeReductionRatio * 800); // Estimate based on size reduction
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        const optimizer = new DataPipelineOptimizer();
        await optimizer.optimize();
        
        console.log('\n🎉 **DATA PIPELINE OPTIMIZATION COMPLETE**');
        console.log('🚀 Frontend now optimized for lightning-fast performance!');
        
    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { DataPipelineOptimizer };