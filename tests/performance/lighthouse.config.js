/**
 * Lighthouse CI Configuration
 * Performance testing configuration with Core Web Vitals monitoring
 */

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8000/',
        'http://localhost:8000/career-intelligence.html',
        'http://localhost:8000/watch-me-work.html'
      ],
      startServerCommand: 'cd .. && python -m http.server 8000',
      startServerReadyPattern: 'Serving HTTP',
      startServerReadyTimeout: 10000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        skipAudits: [
          'canonical',
          'structured-data',
          'robots-txt'
        ]
      }
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Load performance
        'speed-index': ['error', { maxNumericValue: 2000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        
        // Resource optimization
        'unused-css-rules': ['warn', { maxLength: 1 }],
        'unused-javascript': ['warn', { maxLength: 1 }],
        'render-blocking-resources': ['warn', { maxLength: 1 }],
        
        // Best practices
        'uses-responsive-images': 'error',
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'warn',
        
        // Accessibility requirements
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'link-name': 'error',
        'meta-viewport': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    }
  }
};