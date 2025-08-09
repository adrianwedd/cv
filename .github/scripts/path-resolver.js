/**
 * Enterprise Path Resolution System
 * Bulletproof path handling for consistent file access across all environments
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PathResolver {
  constructor() {
    // Detect project root from multiple possible locations
    this.projectRoot = this.findProjectRoot();
    this.validatePaths();
  }

  findProjectRoot() {
    const possibleRoots = [
      process.cwd(),
      path.resolve(__dirname, '../..'),
      path.resolve(__dirname, '../../..'),
      path.resolve(process.cwd(), '../..'),
    ];

    for (const root of possibleRoots) {
      if (this.isProjectRoot(root)) {
        console.log(`✅ Project root found: ${root}`);
        return root;
      }
    }

    throw new Error('❌ Could not locate project root directory');
  }

  isProjectRoot(dir) {
    try {
      const packageJsonPath = path.join(dir, 'package.json');
      const claudeMdPath = path.join(dir, 'docs/CLAUDE.md');
      const githubDir = path.join(dir, '.github');
      
      return fs.existsSync(packageJsonPath) && 
             fs.existsSync(claudeMdPath) && 
             fs.existsSync(githubDir);
    } catch {
      return false;
    }
  }

  validatePaths() {
    const criticalPaths = this.getCriticalPaths();
    const missing = [];

    for (const [name, fullPath] of Object.entries(criticalPaths)) {
      if (!fs.existsSync(fullPath)) {
        missing.push(`${name}: ${fullPath}`);
      }
    }

    if (missing.length > 0) {
      console.warn('⚠️ Missing paths detected:');
      missing.forEach(path => console.warn(`  - ${path}`));
    }
  }

  getCriticalPaths() {
    return {
      // Data directories
      dataDir: path.join(this.projectRoot, 'data'),
      activityDir: path.join(this.projectRoot, 'data/activity'),
      metricsDir: path.join(this.projectRoot, 'data/metrics'),
      trendsDir: path.join(this.projectRoot, 'data/trends'),
      
      // Scripts and tests
      scriptsDir: path.join(this.projectRoot, '.github/scripts'),
      testsDir: path.join(this.projectRoot, 'tests'),
      
      // Output directories
      distDir: path.join(this.projectRoot, 'dist'),
      assetsDir: path.join(this.projectRoot, 'assets'),
      
      // Coverage directories
      scriptsCoverage: path.join(this.projectRoot, '.github/scripts/coverage'),
      testsCoverage: path.join(this.projectRoot, 'tests/coverage'),
      
      // Core files
      baseCv: path.join(this.projectRoot, 'data/base-cv.json'),
      activitySummary: path.join(this.projectRoot, 'data/activity-summary.json'),
      aiEnhancements: path.join(this.projectRoot, 'data/ai-enhancements.json'),
    };
  }

  // Ensure directory exists, create if missing
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    }
    return dirPath;
  }

  // Resolve path relative to project root
  resolve(...pathSegments) {
    return path.resolve(this.projectRoot, ...pathSegments);
  }

  // Get path relative to project root for display
  relative(fullPath) {
    return path.relative(this.projectRoot, fullPath);
  }

  // Safe file existence check
  exists(filePath) {
    try {
      return fs.existsSync(this.resolve(filePath));
    } catch {
      return false;
    }
  }

  // Get standardized test paths for different environments
  getTestPaths() {
    return {
      // Node.js native tests (foundation layer)
      nodeTests: {
        dir: this.resolve('.github/scripts'),
        pattern: '*.test.js',
        coverage: this.ensureDir(this.resolve('.github/scripts/coverage')),
        runner: 'node --test'
      },
      
      // Jest/Puppeteer tests (advanced layer)
      browserTests: {
        dir: this.resolve('tests'),
        pattern: '**/*.test.js',
        coverage: this.ensureDir(this.resolve('tests/coverage')),
        runner: 'jest'
      }
    };
  }

  // Create all necessary directories for testing
  initializeTestEnvironment() {
    const paths = this.getCriticalPaths();
    const testPaths = this.getTestPaths();
    
    // Ensure all critical directories exist
    Object.values(paths).forEach(dirPath => {
      if (dirPath.includes('/')) {
        this.ensureDir(path.dirname(dirPath));
      }
    });
    
    // Ensure test directories exist
    this.ensureDir(testPaths.nodeTests.coverage);
    this.ensureDir(testPaths.browserTests.coverage);
    
    console.log('✅ Test environment initialized');
    return this;
  }
}

// Export singleton instance
const pathResolver = new PathResolver();
export default pathResolver;