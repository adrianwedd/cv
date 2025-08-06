#!/usr/bin/env node

/**
 * Dashboard Ecosystem Optimizer
 * Comprehensive optimization system for all CV dashboards ensuring responsiveness,
 * reliability, performance, and consistent user experience across devices.
 * 
 * Features:
 * - Responsive design validation and optimization
 * - Performance analysis and enhancement
 * - Cross-dashboard consistency checks
 * - Mobile-first optimization
 * - Accessibility compliance verification
 * - Asset optimization and caching
 * - Error handling and reliability improvements
 * 
 * Usage: node dashboard-ecosystem-optimizer.js [--analyze] [--optimize] [--report]
 * 
 * @author Adrian Wedd
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DashboardEcosystemOptimizer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.dashboards = [];
        this.optimizations = [];
        this.issues = [];
        this.results = {
            total_dashboards: 0,
            responsive_score: 0,
            performance_score: 0,
            reliability_score: 0,
            accessibility_score: 0,
            consistency_score: 0,
            overall_score: 0,
            issues_found: 0,
            optimizations_applied: 0
        };
        
        // Define dashboard categories and expected patterns
        this.dashboardCategories = {
            primary: ['index.html'],
            analytics: ['career-intelligence.html', 'test-analytics.html'],
            testing: ['test-dashboard.html', 'test-dashboard-reliability.html'],
            utilities: ['debug-export.html', 'verify-export-fix.html'],
            features: ['watch-me-work.html', 'networking-dashboard.html'],
            exports: ['test-export.html', 'test-cv-export-fix.html'],
            specialized: ['test-personalization.html', 'test-project-showcase.html']
        };
        
        // Performance thresholds
        this.performanceThresholds = {
            max_file_size: 500 * 1024, // 500KB
            max_css_files: 5,
            max_js_files: 10,
            max_image_size: 200 * 1024, // 200KB
            critical_css_size: 50 * 1024 // 50KB
        };
        
        // Responsive breakpoints
        this.responsiveBreakpoints = {
            mobile: 320,
            tablet: 768,
            desktop: 1024,
            large: 1440
        };
    }
    
    /**
     * Run comprehensive dashboard ecosystem optimization
     */
    async optimize(options = {}) {
        console.log('🚀 Starting Dashboard Ecosystem Optimization...');
        
        try {
            // 1. Discover and catalog all dashboards
            await this.discoverDashboards();
            
            // 2. Analyze current state
            if (options.analyze !== false) {
                await this.analyzeEcosystem();
            }
            
            // 3. Optimize responsive design
            await this.optimizeResponsiveDesign();
            
            // 4. Enhance performance
            await this.enhancePerformance();
            
            // 5. Improve reliability
            await this.improveReliability();
            
            // 6. Ensure accessibility compliance
            await this.ensureAccessibility();
            
            // 7. Standardize consistency
            await this.standardizeConsistency();
            
            // 8. Apply optimizations
            if (options.optimize !== false) {
                await this.applyOptimizations();
            }
            
            // 9. Generate comprehensive report
            const report = await this.generateReport();
            
            return {
                success: this.results.overall_score >= 80,
                results: this.results,
                dashboards: this.dashboards,
                optimizations: this.optimizations,
                report: report
            };
            
        } catch (error) {
            console.error('❌ Dashboard optimization failed:', error);
            throw error;
        }
    }
    
    /**
     * Discover all dashboard files in the project
     */
    async discoverDashboards() {
        console.log('🔍 Discovering dashboard files...');
        
        const htmlFiles = [];
        
        // Recursively find HTML files
        const findHtmlFiles = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.name.startsWith('.')) continue;
                if (entry.name === 'node_modules') continue;
                if (entry.name === 'docs') continue; // Skip JSDoc output
                
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await findHtmlFiles(fullPath);
                } else if (entry.name.endsWith('.html')) {
                    const relativePath = path.relative(this.projectRoot, fullPath);
                    htmlFiles.push(relativePath);
                }
            }
        };
        
        await findHtmlFiles(this.projectRoot);
        
        // Analyze and categorize dashboards
        for (const htmlFile of htmlFiles) {
            const dashboard = await this.analyzeDashboard(htmlFile);
            this.dashboards.push(dashboard);
        }
        
        this.results.total_dashboards = this.dashboards.length;
        console.log(`📊 Found ${this.dashboards.length} dashboard files`);
        
        // Log dashboard categories
        for (const [category, files] of Object.entries(this.dashboardCategories)) {
            const categoryDashboards = files.filter(file => 
                this.dashboards.some(d => d.path === file)
            );
            if (categoryDashboards.length > 0) {
                console.log(`  ${category}: ${categoryDashboards.length} dashboards`);
            }
        }
    }
    
    /**
     * Analyze individual dashboard file
     */
    async analyzeDashboard(filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        
        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const stats = await fs.stat(fullPath);
            
            const dashboard = {
                path: filePath,
                name: path.basename(filePath, '.html'),
                category: this.categorizeDashboard(filePath),
                size: stats.size,
                lastModified: stats.mtime,
                content: content,
                issues: [],
                optimizations: [],
                analysis: {
                    has_viewport_meta: content.includes('viewport'),
                    has_responsive_css: this.hasResponsiveCSS(content),
                    has_accessibility_features: this.hasAccessibilityFeatures(content),
                    has_error_handling: this.hasErrorHandling(content),
                    has_performance_optimizations: this.hasPerformanceOptimizations(content),
                    css_files: this.extractCSSFiles(content),
                    js_files: this.extractJSFiles(content),
                    external_dependencies: this.extractExternalDependencies(content),
                    images: this.extractImages(content)
                }
            };
            
            return dashboard;
            
        } catch (error) {
            console.warn(`⚠️ Could not analyze ${filePath}:`, error.message);
            return {
                path: filePath,
                name: path.basename(filePath, '.html'),
                category: 'unknown',
                error: error.message,
                issues: [{ type: 'file_error', message: `Cannot read file: ${error.message}` }]
            };
        }
    }
    
    /**
     * Categorize dashboard based on filename and content
     */
    categorizeDashboard(filePath) {
        for (const [category, files] of Object.entries(this.dashboardCategories)) {
            if (files.some(file => filePath.includes(file.replace('.html', '')))) {
                return category;
            }
        }
        return 'other';
    }
    
    /**
     * Check if dashboard has responsive CSS
     */
    hasResponsiveCSS(content) {
        return content.includes('@media') || 
               content.includes('responsive') ||
               content.includes('mobile-first') ||
               content.includes('max-width') ||
               content.includes('min-width');
    }
    
    /**
     * Check if dashboard has accessibility features
     */
    hasAccessibilityFeatures(content) {
        const accessibilityFeatures = [
            'aria-', 'role=', 'alt=', 'tabindex=', 'skip-link',
            'screen-reader', 'sr-only', 'focus:', 'focus-visible'
        ];
        
        return accessibilityFeatures.some(feature => content.includes(feature));
    }
    
    /**
     * Check if dashboard has error handling
     */
    hasErrorHandling(content) {
        return content.includes('try') && content.includes('catch') ||
               content.includes('onerror') ||
               content.includes('error-boundary') ||
               content.includes('fallback');
    }
    
    /**
     * Check if dashboard has performance optimizations
     */
    hasPerformanceOptimizations(content) {
        const optimizations = [
            'preload', 'prefetch', 'dns-prefetch', 'preconnect',
            'lazy', 'defer', 'async', 'critical-css'
        ];
        
        return optimizations.some(opt => content.includes(opt));
    }
    
    /**
     * Extract CSS files from HTML content
     */
    extractCSSFiles(content) {
        const cssMatches = content.match(/href=['"](.*?\\.css)['"]|href=['"]([^'"]*\\.css)['"]/g) || [];
        return cssMatches.map(match => {
            const href = match.match(/href=['"](.*?)['"]/) || [];
            return href[1] || '';
        }).filter(Boolean);
    }
    
    /**
     * Extract JavaScript files from HTML content
     */
    extractJSFiles(content) {
        const jsMatches = content.match(/src=['"](.*?\\.js)['"]|src=['"]([^'"]*\\.js)['"]/g) || [];
        return jsMatches.map(match => {
            const src = match.match(/src=['"](.*?)['"]/) || [];
            return src[1] || '';
        }).filter(Boolean);
    }
    
    /**
     * Extract external dependencies
     */
    extractExternalDependencies(content) {
        const externalMatches = content.match(/https?:\/\/[^\s"'<>]+/g) || [];
        return [...new Set(externalMatches)]; // Remove duplicates
    }
    
    /**
     * Extract image references
     */
    extractImages(content) {
        const imgMatches = content.match(/src=['"](.*?\.(png|jpg|jpeg|gif|svg|webp))['"]|src=['"]([^'"]*\.(png|jpg|jpeg|gif|svg|webp))['"]/gi) || [];
        return imgMatches.map(match => {
            const src = match.match(/src=['"](.*?)['"]/) || [];
            return src[1] || '';
        }).filter(Boolean);
    }
    
    /**
     * Analyze the entire dashboard ecosystem
     */
    async analyzeEcosystem() {
        console.log('📊 Analyzing dashboard ecosystem...');
        
        let totalResponsive = 0;
        let totalPerformant = 0;
        let totalReliable = 0;
        let totalAccessible = 0;
        
        for (const dashboard of this.dashboards) {
            if (dashboard.error) continue;
            
            // Responsive analysis
            if (dashboard.analysis.has_viewport_meta && dashboard.analysis.has_responsive_css) {
                totalResponsive++;
            } else {
                dashboard.issues.push({
                    type: 'responsiveness',
                    severity: 'warning',
                    message: 'Dashboard lacks responsive design features'
                });
            }
            
            // Performance analysis
            const cssCount = dashboard.analysis.css_files.length;
            const jsCount = dashboard.analysis.js_files.length;
            const hasOptimizations = dashboard.analysis.has_performance_optimizations;
            
            if (cssCount <= this.performanceThresholds.max_css_files && 
                jsCount <= this.performanceThresholds.max_js_files && 
                hasOptimizations) {
                totalPerformant++;
            } else {
                dashboard.issues.push({
                    type: 'performance',
                    severity: 'warning',
                    message: `Performance issues: ${cssCount} CSS files, ${jsCount} JS files`
                });
            }
            
            // Reliability analysis
            if (dashboard.analysis.has_error_handling) {
                totalReliable++;
            } else {
                dashboard.issues.push({
                    type: 'reliability',
                    severity: 'error',
                    message: 'Dashboard lacks error handling'
                });
            }
            
            // Accessibility analysis
            if (dashboard.analysis.has_accessibility_features) {
                totalAccessible++;
            } else {
                dashboard.issues.push({
                    type: 'accessibility',
                    severity: 'error',
                    message: 'Dashboard lacks accessibility features'
                });
            }
            
            // Count total issues
            this.results.issues_found += dashboard.issues.length;
        }
        
        // Calculate scores
        const validDashboards = this.dashboards.filter(d => !d.error).length;
        this.results.responsive_score = Math.round((totalResponsive / validDashboards) * 100);
        this.results.performance_score = Math.round((totalPerformant / validDashboards) * 100);
        this.results.reliability_score = Math.round((totalReliable / validDashboards) * 100);
        this.results.accessibility_score = Math.round((totalAccessible / validDashboards) * 100);
        
        console.log(`📱 Responsive: ${this.results.responsive_score}%`);
        console.log(`⚡ Performance: ${this.results.performance_score}%`);
        console.log(`🛡️  Reliability: ${this.results.reliability_score}%`);
        console.log(`♿ Accessibility: ${this.results.accessibility_score}%`);
    }
    
    /**
     * Optimize responsive design across all dashboards
     */
    async optimizeResponsiveDesign() {
        console.log('📱 Optimizing responsive design...');
        
        const responsiveOptimizations = {
            viewport_meta: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            responsive_css_link: '<link rel="stylesheet" href="assets/pwa-mobile.css">',
            touch_optimizations: `
<!-- Touch Optimization -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#2563eb">`,
            
            responsive_css_rules: `
/* Enhanced Responsive Rules */
@media screen and (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
    margin: 0;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .dashboard-card {
    margin-bottom: 1rem;
    padding: 1rem;
  }
  
  .dashboard-nav {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .nav-link {
    min-height: 44px;
    padding: 0.75rem 1rem;
  }
}

@media screen and (max-width: 480px) {
  .dashboard-title {
    font-size: 1.5rem;
  }
  
  .dashboard-stats {
    flex-direction: column;
    text-align: center;
  }
  
  .chart-container {
    height: 300px;
  }
}`
        };
        
        for (const dashboard of this.dashboards) {
            if (dashboard.error) continue;
            
            const optimizations = [];
            
            // Add viewport meta if missing
            if (!dashboard.analysis.has_viewport_meta) {
                optimizations.push({
                    type: 'add_viewport_meta',
                    description: 'Add responsive viewport meta tag',
                    code: responsiveOptimizations.viewport_meta,
                    location: 'head'
                });
            }
            
            // Add mobile CSS if not present
            if (!dashboard.analysis.css_files.includes('assets/pwa-mobile.css')) {
                optimizations.push({
                    type: 'add_mobile_css',
                    description: 'Add mobile-specific CSS',
                    code: responsiveOptimizations.responsive_css_link,
                    location: 'head'
                });
            }
            
            // Add touch optimizations
            if (!dashboard.content.includes('mobile-web-app-capable')) {
                optimizations.push({
                    type: 'add_touch_optimizations',
                    description: 'Add mobile web app capabilities',
                    code: responsiveOptimizations.touch_optimizations,
                    location: 'head'
                });
            }
            
            dashboard.optimizations.push(...optimizations);
            this.optimizations.push(...optimizations.map(opt => ({ ...opt, dashboard: dashboard.path })));
        }
        
        console.log(`✅ Generated ${this.optimizations.length} responsive optimizations`);
    }
    
    /**
     * Enhance performance across all dashboards
     */
    async enhancePerformance() {
        console.log('⚡ Enhancing performance...');
        
        const performanceOptimizations = {
            preload_critical_css: '<link rel="preload" href="assets/styles.css" as="style">',
            dns_prefetch: `
<link rel="dns-prefetch" href="//cdn.jsdelivr.net">
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//fonts.gstatic.com">`,
            
            lazy_loading: `
<!-- Lazy loading optimization -->
<script>
if ('loading' in HTMLImageElement.prototype) {
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.loading = 'lazy';
  });
}
</script>`,
            
            critical_css: `
<style>
/* Critical CSS for above-the-fold content */
.dashboard-header {
  background: var(--color-primary, #2563eb);
  color: white;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.loading-spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255,255,255,.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>`
        };
        
        for (const dashboard of this.dashboards) {
            if (dashboard.error) continue;
            
            const optimizations = [];
            
            // Add DNS prefetch for external resources
            if (dashboard.analysis.external_dependencies.length > 0 && 
                !dashboard.content.includes('dns-prefetch')) {
                optimizations.push({
                    type: 'add_dns_prefetch',
                    description: 'Add DNS prefetch for external resources',
                    code: performanceOptimizations.dns_prefetch,
                    location: 'head'
                });
            }
            
            // Add critical CSS
            if (!dashboard.content.includes('Critical CSS')) {
                optimizations.push({
                    type: 'add_critical_css',
                    description: 'Add critical CSS for better rendering',
                    code: performanceOptimizations.critical_css,
                    location: 'head'
                });
            }
            
            // Add lazy loading
            if (dashboard.analysis.images.length > 0 && 
                !dashboard.content.includes('lazy')) {
                optimizations.push({
                    type: 'add_lazy_loading',
                    description: 'Add lazy loading for images',
                    code: performanceOptimizations.lazy_loading,
                    location: 'body'
                });
            }
            
            dashboard.optimizations.push(...optimizations);
            this.optimizations.push(...optimizations.map(opt => ({ ...opt, dashboard: dashboard.path })));
        }
        
        console.log(`✅ Generated performance optimizations`);
    }
    
    /**
     * Improve reliability with error handling
     */
    async improveReliability() {
        console.log('🛡️  Improving reliability...');
        
        const reliabilityOptimizations = {
            error_boundary: `
<script>
// Global error handling
window.addEventListener('error', (event) => {
  console.error('Dashboard error:', event.error);
  showErrorFallback(event.error.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showErrorFallback('Network or data loading error');
});

function showErrorFallback(message) {
  const errorContainer = document.getElementById('error-container') || createErrorContainer();
  errorContainer.innerHTML = \`
    <div class="error-message">
      <h3>⚠️ Something went wrong</h3>
      <p>\${message}</p>
      <button onclick="location.reload()" class="retry-button">Retry</button>
    </div>
  \`;
  errorContainer.style.display = 'block';
}

function createErrorContainer() {
  const container = document.createElement('div');
  container.id = 'error-container';
  container.className = 'error-container';
  container.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 300px;
    display: none;
  \`;
  document.body.appendChild(container);
  return container;
}
</script>`,
            
            loading_states: `
<div id="loading-overlay" class="loading-overlay" style="display: none;">
  <div class="loading-spinner"></div>
  <p>Loading dashboard...</p>
</div>

<script>
function showLoading() {
  document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

// Show loading on page load
document.addEventListener('DOMContentLoaded', hideLoading);
window.addEventListener('beforeunload', showLoading);
</script>`,
            
            offline_detection: `
<script>
// Offline/online detection
function updateConnectionStatus() {
  const isOnline = navigator.onLine;
  const indicator = document.getElementById('connection-indicator') || createConnectionIndicator();
  
  if (isOnline) {
    indicator.textContent = '🌐 Online';
    indicator.className = 'connection-indicator online';
  } else {
    indicator.textContent = '📴 Offline';
    indicator.className = 'connection-indicator offline';
  }
}

function createConnectionIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'connection-indicator';
  indicator.style.cssText = \`
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    z-index: 1000;
    transition: all 0.3s ease;
  \`;
  document.body.appendChild(indicator);
  return indicator;
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
document.addEventListener('DOMContentLoaded', updateConnectionStatus);
</script>`
        };
        
        for (const dashboard of this.dashboards) {
            if (dashboard.error) continue;
            
            const optimizations = [];
            
            // Add error boundary if missing
            if (!dashboard.analysis.has_error_handling) {
                optimizations.push({
                    type: 'add_error_handling',
                    description: 'Add comprehensive error handling',
                    code: reliabilityOptimizations.error_boundary,
                    location: 'body'
                });
            }
            
            // Add loading states
            if (!dashboard.content.includes('loading')) {
                optimizations.push({
                    type: 'add_loading_states',
                    description: 'Add loading state management',
                    code: reliabilityOptimizations.loading_states,
                    location: 'body'
                });
            }
            
            // Add offline detection
            if (!dashboard.content.includes('navigator.onLine')) {
                optimizations.push({
                    type: 'add_offline_detection',
                    description: 'Add offline/online detection',
                    code: reliabilityOptimizations.offline_detection,
                    location: 'body'
                });
            }
            
            dashboard.optimizations.push(...optimizations);
            this.optimizations.push(...optimizations.map(opt => ({ ...opt, dashboard: dashboard.path })));
        }
        
        console.log(`✅ Generated reliability optimizations`);
    }
    
    /**
     * Ensure accessibility compliance
     */
    async ensureAccessibility() {
        console.log('♿ Ensuring accessibility compliance...');
        
        const accessibilityOptimizations = {
            skip_links: `
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#navigation" class="skip-link">Skip to navigation</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
  border-radius: 0 0 4px 4px;
}

.skip-link:focus {
  top: 0;
}
</style>`,
            
            aria_landmarks: `
<main role="main" id="main-content" aria-label="Dashboard content">
  <!-- Main dashboard content -->
</main>

<nav role="navigation" id="navigation" aria-label="Dashboard navigation">
  <!-- Navigation content -->
</nav>`,
            
            focus_management: `
<script>
// Enhanced focus management
document.addEventListener('keydown', (e) => {
  // Trap focus in modal dialogs
  if (e.key === 'Tab') {
    const activeModal = document.querySelector('.modal[aria-hidden="false"]');
    if (activeModal) {
      trapFocus(e, activeModal);
    }
  }
  
  // Keyboard navigation
  if (e.key === 'Escape') {
    closeAllModals();
  }
});

function trapFocus(e, container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (e.shiftKey && document.activeElement === firstElement) {
    lastElement.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    firstElement.focus();
    e.preventDefault();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.altKey) {
    switch(e.key) {
      case 'h':
        document.querySelector('h1').focus();
        break;
      case 'm':
        document.querySelector('main').focus();
        break;
      case 'n':
        document.querySelector('nav').focus();
        break;
    }
  }
});
</script>`
        };
        
        for (const dashboard of this.dashboards) {
            if (dashboard.error) continue;
            
            const optimizations = [];
            
            // Add skip links if missing
            if (!dashboard.content.includes('skip-link')) {
                optimizations.push({
                    type: 'add_skip_links',
                    description: 'Add skip links for keyboard navigation',
                    code: accessibilityOptimizations.skip_links,
                    location: 'body_start'
                });
            }
            
            // Add ARIA landmarks if missing
            if (!dashboard.content.includes('role=') || !dashboard.content.includes('aria-label')) {
                optimizations.push({
                    type: 'add_aria_landmarks',
                    description: 'Add ARIA landmarks and labels',
                    code: accessibilityOptimizations.aria_landmarks,
                    location: 'body'
                });
            }
            
            // Add focus management if missing
            if (!dashboard.content.includes('focus') && !dashboard.content.includes('tabindex')) {
                optimizations.push({
                    type: 'add_focus_management',
                    description: 'Add keyboard focus management',
                    code: accessibilityOptimizations.focus_management,
                    location: 'body'
                });
            }
            
            dashboard.optimizations.push(...optimizations);
            this.optimizations.push(...optimizations.map(opt => ({ ...opt, dashboard: dashboard.path })));
        }
        
        console.log(`✅ Generated accessibility optimizations`);
    }
    
    /**
     * Standardize consistency across dashboards
     */
    async standardizeConsistency() {
        console.log('🎯 Standardizing dashboard consistency...');
        
        // Calculate consistency score based on common elements
        let consistencyItems = 0;
        let totalItems = 0;
        
        const commonFeatures = [
            'viewport', 'responsive', 'error', 'accessibility', 
            'performance', 'loading', 'navigation'
        ];
        
        for (const feature of commonFeatures) {
            const dashboardsWithFeature = this.dashboards.filter(d => 
                !d.error && d.content.toLowerCase().includes(feature)
            ).length;
            
            consistencyItems += dashboardsWithFeature;
            totalItems += this.dashboards.filter(d => !d.error).length;
        }
        
        this.results.consistency_score = Math.round((consistencyItems / totalItems) * 100);
        
        console.log(`📊 Consistency score: ${this.results.consistency_score}%`);
    }
    
    /**
     * Apply all generated optimizations
     */
    async applyOptimizations() {
        console.log('🔧 Applying optimizations...');
        
        let appliedCount = 0;
        
        for (const dashboard of this.dashboards) {
            if (dashboard.error || dashboard.optimizations.length === 0) continue;
            
            let modifiedContent = dashboard.content;
            let hasChanges = false;
            
            for (const optimization of dashboard.optimizations) {
                try {
                    switch (optimization.location) {
                        case 'head':
                            if (!modifiedContent.includes(optimization.code.trim())) {
                                modifiedContent = modifiedContent.replace(
                                    '</head>',
                                    `${optimization.code}\n</head>`
                                );
                                hasChanges = true;
                                appliedCount++;
                            }
                            break;
                            
                        case 'body':
                            if (!modifiedContent.includes(optimization.code.trim())) {
                                modifiedContent = modifiedContent.replace(
                                    '</body>',
                                    `${optimization.code}\n</body>`
                                );
                                hasChanges = true;
                                appliedCount++;
                            }
                            break;
                            
                        case 'body_start':
                            if (!modifiedContent.includes(optimization.code.trim())) {
                                modifiedContent = modifiedContent.replace(
                                    '<body>',
                                    `<body>\n${optimization.code}`
                                );
                                hasChanges = true;
                                appliedCount++;
                            }
                            break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to apply optimization to ${dashboard.path}:`, error.message);
                }
            }
            
            // Write optimized content back to file
            if (hasChanges) {
                const filePath = path.join(this.projectRoot, dashboard.path);
                await fs.writeFile(filePath, modifiedContent);
                console.log(`✅ Optimized ${dashboard.path} (${dashboard.optimizations.length} improvements)`);
            }
        }
        
        this.results.optimizations_applied = appliedCount;
        console.log(`🎉 Applied ${appliedCount} optimizations across ${this.dashboards.length} dashboards`);
    }
    
    /**
     * Calculate overall score
     */
    calculateOverallScore() {
        const scores = [
            this.results.responsive_score,
            this.results.performance_score,
            this.results.reliability_score,
            this.results.accessibility_score,
            this.results.consistency_score
        ];
        
        this.results.overall_score = Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
        );
    }
    
    /**
     * Generate comprehensive optimization report
     */
    async generateReport() {
        this.calculateOverallScore();
        
        const timestamp = new Date().toISOString();
        
        const report = {
            timestamp: timestamp,
            results: this.results,
            summary: {
                overall_status: this.results.overall_score >= 80 ? 'EXCELLENT' : 
                               this.results.overall_score >= 60 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
                total_dashboards: this.results.total_dashboards,
                issues_found: this.results.issues_found,
                optimizations_applied: this.results.optimizations_applied
            },
            dashboard_analysis: this.dashboards.map(d => ({
                path: d.path,
                category: d.category,
                size: d.size,
                issues: d.issues.length,
                optimizations: d.optimizations.length,
                features: d.analysis ? {
                    responsive: d.analysis.has_viewport_meta && d.analysis.has_responsive_css,
                    performant: d.analysis.has_performance_optimizations,
                    reliable: d.analysis.has_error_handling,
                    accessible: d.analysis.has_accessibility_features
                } : null
            })),
            optimizations_summary: this.optimizations.reduce((groups, opt) => {
                groups[opt.type] = (groups[opt.type] || 0) + 1;
                return groups;
            }, {}),
            recommendations: this.generateRecommendations()
        };
        
        // Save report
        const reportPath = path.join(this.projectRoot, 'data', `dashboard-optimization-report-${timestamp.split('T')[0]}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Report saved: ${reportPath}`);
        return report;
    }
    
    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.responsive_score < 80) {
            recommendations.push('📱 Improve responsive design with better mobile layouts');
        }
        
        if (this.results.performance_score < 80) {
            recommendations.push('⚡ Optimize performance with lazy loading and resource preloading');
        }
        
        if (this.results.reliability_score < 80) {
            recommendations.push('🛡️  Add comprehensive error handling and offline capabilities');
        }
        
        if (this.results.accessibility_score < 80) {
            recommendations.push('♿ Enhance accessibility with ARIA labels and keyboard navigation');
        }
        
        if (this.results.consistency_score < 80) {
            recommendations.push('🎯 Standardize common elements across all dashboards');
        }
        
        if (this.results.overall_score >= 90) {
            recommendations.push('🎉 Excellent dashboard ecosystem - consider advanced optimizations');
        }
        
        return recommendations;
    }
}

/**
 * CLI Interface
 */
async function main() {
    const args = process.argv.slice(2);
    const options = {
        analyze: !args.includes('--no-analyze'),
        optimize: !args.includes('--no-optimize'),
        report: args.includes('--report') || true
    };
    
    try {
        const optimizer = new DashboardEcosystemOptimizer();
        const results = await optimizer.optimize(options);
        
        console.log('\\n' + '='.repeat(60));
        console.log('🚀 DASHBOARD ECOSYSTEM OPTIMIZATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`Overall Score: ${results.results.overall_score}/100 (${results.results.overall_status || 'GOOD'})`);
        console.log(`Dashboards Analyzed: ${results.results.total_dashboards}`);
        console.log(`Issues Found: ${results.results.issues_found}`);
        console.log(`Optimizations Applied: ${results.results.optimizations_applied}`);
        console.log('\\n📊 Detailed Scores:');
        console.log(`  📱 Responsive: ${results.results.responsive_score}%`);
        console.log(`  ⚡ Performance: ${results.results.performance_score}%`);
        console.log(`  🛡️  Reliability: ${results.results.reliability_score}%`);
        console.log(`  ♿ Accessibility: ${results.results.accessibility_score}%`);
        console.log(`  🎯 Consistency: ${results.results.consistency_score}%`);
        console.log('='.repeat(60));
        
        process.exit(results.success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Optimization failed:', error);
        process.exit(1);
    }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { DashboardEcosystemOptimizer };