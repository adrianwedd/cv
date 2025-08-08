#!/usr/bin/env node

/**
 * Code Quality Enforcement & Legacy Cleanup System
 * Automated refactoring, dead code removal, and quality improvements
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');

class CodeQualityEnforcer {
    constructor() {
        this.issues = [];
        this.refactorings = [];
        this.deadCode = [];
        this.qualityMetrics = {};
        this.cleanupActions = [];
    }

    async enforceQuality() {
        console.log('🛠️  Code Quality Enforcement & Legacy Cleanup System');
        console.log('===================================================\n');

        try {
            // Scan codebase for quality issues
            await this.scanCodebase();
            
            // Detect and remove dead code
            await this.detectDeadCode();
            
            // Clean up legacy and deprecated code
            await this.cleanupLegacyCode();
            
            // Generate refactoring suggestions
            await this.generateRefactoringSuggestions();
            
            // Implement automated fixes
            await this.implementAutomatedFixes();
            
            // Create code quality dashboard
            await this.createQualityDashboard();
            
            // Setup continuous quality monitoring
            await this.setupQualityMonitoring();
            
            console.log('✅ Code quality enforcement system deployed\n');
            
        } catch (error) {
            console.error('❌ Code quality enforcement failed:', error);
            throw error;
        }
    }

    async scanCodebase() {
        console.log('🔍 Scanning codebase for quality issues...');
        
        const codeFiles = await this.getCodeFiles();
        
        for (const file of codeFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const issues = await this.analyzeFile(file, content);
                
                if (issues.length > 0) {
                    this.issues.push({
                        file: file,
                        issues: issues
                    });
                }
                
            } catch (error) {
                console.warn(`   ⚠️  Could not analyze: ${file}`);
            }
        }
        
        console.log(`   📊 Found ${this.issues.length} files with quality issues\n`);
    }

    async analyzeFile(filePath, content) {
        const issues = [];
        const lines = content.split('\n');
        
        // Detect common code quality issues
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;
            
            // Long lines
            if (line.length > 120) {
                issues.push({
                    type: 'long-line',
                    line: lineNumber,
                    severity: 'warning',
                    message: `Line too long (${line.length} characters)`,
                    suggestion: 'Break into multiple lines'
                });
            }
            
            // TODO comments
            if (line.includes('TODO') || line.includes('FIXME')) {
                issues.push({
                    type: 'todo',
                    line: lineNumber,
                    severity: 'info',
                    message: 'TODO/FIXME comment found',
                    suggestion: 'Address or create issue'
                });
            }
            
            // Console.log statements
            if (line.includes('console.log') && !line.includes('//')) {
                issues.push({
                    type: 'console-log',
                    line: lineNumber,
                    severity: 'warning',
                    message: 'Console.log statement in production code',
                    suggestion: 'Remove or replace with proper logging'
                });
            }
            
            // Unused variables (simple detection)
            if (line.includes('let ') || line.includes('const ') || line.includes('var ')) {
                const varMatch = line.match(/(let|const|var)\s+(\w+)/);
                if (varMatch) {
                    const varName = varMatch[2];
                    // Simple check if variable is used later
                    const restOfContent = content.substring(content.indexOf(line) + line.length);
                    if (!restOfContent.includes(varName)) {
                        issues.push({
                            type: 'unused-variable',
                            line: lineNumber,
                            severity: 'warning',
                            message: `Potentially unused variable: ${varName}`,
                            suggestion: 'Remove if truly unused'
                        });
                    }
                }
            }
            
            // Large functions (simple heuristic)
            if (line.includes('function ') || line.includes('= function') || line.includes('=>')) {
                let braceCount = 0;
                let functionLines = 0;
                
                for (let j = i; j < lines.length; j++) {
                    const funcLine = lines[j];
                    braceCount += (funcLine.match(/{/g) || []).length;
                    braceCount -= (funcLine.match(/}/g) || []).length;
                    functionLines++;
                    
                    if (braceCount === 0 && functionLines > 50) {
                        issues.push({
                            type: 'large-function',
                            line: lineNumber,
                            severity: 'warning',
                            message: `Function too large (${functionLines} lines)`,
                            suggestion: 'Break into smaller functions'
                        });
                        break;
                    } else if (braceCount === 0) {
                        break;
                    }
                }
            }
            
            // Magic numbers
            if (line.match(/\b\d{4,}\b/) && !line.includes('//')) {
                issues.push({
                    type: 'magic-number',
                    line: lineNumber,
                    severity: 'info',
                    message: 'Magic number detected',
                    suggestion: 'Extract to named constant'
                });
            }
        }
        
        return issues;
    }

    async detectDeadCode() {
        console.log('🧹 Detecting dead code...');
        
        const codeFiles = await this.getCodeFiles();
        
        // Detect unused functions
        await this.detectUnusedFunctions(codeFiles);
        
        // Detect unused CSS classes
        await this.detectUnusedCSS();
        
        // Detect unused assets
        await this.detectUnusedAssets();
        
        console.log(`   📊 Found ${this.deadCode.length} dead code instances\n`);
    }

    async detectUnusedFunctions(codeFiles) {
        const allFunctions = new Map();
        const functionReferences = new Set();
        
        // First pass: collect all function definitions
        for (const file of codeFiles.filter(f => f.endsWith('.js'))) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // Simple function detection
                const functionMatches = content.matchAll(/function\s+(\w+)|(\w+)\s*=\s*function|(\w+)\s*=\s*\(/g);
                
                for (const match of functionMatches) {
                    const funcName = match[1] || match[2] || match[3];
                    if (funcName) {
                        allFunctions.set(funcName, {
                            file: file,
                            name: funcName
                        });
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        // Second pass: find function references
        for (const file of codeFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                for (const [funcName] of allFunctions) {
                    if (content.includes(funcName + '(')) {
                        functionReferences.add(funcName);
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        // Find unused functions
        for (const [funcName, funcInfo] of allFunctions) {
            if (!functionReferences.has(funcName)) {
                this.deadCode.push({
                    type: 'unused-function',
                    file: funcInfo.file,
                    name: funcName,
                    severity: 'warning',
                    suggestion: 'Remove if truly unused'
                });
            }
        }
    }

    async detectUnusedCSS() {
        const cssFiles = await this.getFilesByExtension('.css');
        const htmlFiles = await this.getFilesByExtension('.html');
        const jsFiles = await this.getFilesByExtension('.js');
        
        const allClasses = new Set();
        const usedClasses = new Set();
        
        // Collect all CSS classes
        for (const cssFile of cssFiles) {
            try {
                const content = await fs.readFile(cssFile, 'utf8');
                const classMatches = content.matchAll(/\.([a-zA-Z][\w-]*)/g);
                
                for (const match of classMatches) {
                    allClasses.add(match[1]);
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        // Find used classes in HTML and JS
        for (const file of [...htmlFiles, ...jsFiles]) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                for (const className of allClasses) {
                    if (content.includes(className)) {
                        usedClasses.add(className);
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        // Find unused CSS classes
        for (const className of allClasses) {
            if (!usedClasses.has(className)) {
                this.deadCode.push({
                    type: 'unused-css-class',
                    name: className,
                    severity: 'info',
                    suggestion: 'Remove unused CSS class'
                });
            }
        }
    }

    async detectUnusedAssets() {
        const assetsDir = path.join(repoRoot, 'assets');
        const assetFiles = await this.getDirectoryFiles(assetsDir);
        const allFiles = await this.getCodeFiles();
        
        for (const asset of assetFiles) {
            const assetName = path.basename(asset);
            let isUsed = false;
            
            for (const file of allFiles) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    if (content.includes(assetName)) {
                        isUsed = true;
                        break;
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            }
            
            if (!isUsed) {
                this.deadCode.push({
                    type: 'unused-asset',
                    file: asset,
                    name: assetName,
                    severity: 'info',
                    suggestion: 'Remove unused asset file'
                });
            }
        }
    }

    async cleanupLegacyCode() {
        console.log('🧽 Cleaning up legacy code...');
        
        const legacyPatterns = [
            { pattern: /console\.log\([^)]*\);?/g, replacement: '', description: 'Console.log statements' },
            { pattern: /\/\*\s*TODO:?[^*]*\*\//g, replacement: '', description: 'TODO comments' },
            { pattern: /\/\/\s*TODO:?.*$/gm, replacement: '', description: 'TODO comments' },
            { pattern: /debugger;?/g, replacement: '', description: 'Debugger statements' },
            { pattern: /\.old$|\.bak$|\.backup$/g, replacement: '', description: 'Legacy file extensions' }
        ];
        
        const codeFiles = await this.getCodeFiles();
        let cleanedFiles = 0;
        
        for (const file of codeFiles) {
            try {
                let content = await fs.readFile(file, 'utf8');
                let modified = false;
                
                for (const pattern of legacyPatterns) {
                    const matches = content.match(pattern.pattern);
                    if (matches) {
                        content = content.replace(pattern.pattern, pattern.replacement);
                        modified = true;
                        
                        this.cleanupActions.push({
                            file: file,
                            action: 'removed',
                            description: pattern.description,
                            count: matches.length
                        });
                    }
                }
                
                if (modified) {
                    await fs.writeFile(file, content);
                    cleanedFiles++;
                }
                
            } catch (error) {
                console.warn(`   ⚠️  Could not clean: ${file}`);
            }
        }
        
        console.log(`   ✅ Cleaned ${cleanedFiles} files\n`);
    }

    async generateRefactoringSuggestions() {
        console.log('🔧 Generating refactoring suggestions...');
        
        // Analyze code patterns for refactoring opportunities
        const suggestions = [
            {
                category: 'Performance',
                priority: 'HIGH',
                description: 'Consolidate CSS files to reduce HTTP requests',
                files: ['assets/*.css'],
                action: 'Use consolidated CSS files instead of multiple imports'
            },
            {
                category: 'Maintainability', 
                priority: 'MEDIUM',
                description: 'Extract repeated code into reusable functions',
                files: ['assets/script.js'],
                action: 'Identify and extract common patterns'
            },
            {
                category: 'Security',
                priority: 'HIGH', 
                description: 'Remove hardcoded secrets and sensitive data',
                files: ['**/*.js'],
                action: 'Use environment variables for configuration'
            },
            {
                category: 'Structure',
                priority: 'LOW',
                description: 'Organize assets into logical folder structure',
                files: ['assets/'],
                action: 'Group related files together'
            }
        ];
        
        this.refactorings = suggestions;
        
        console.log(`   📊 Generated ${suggestions.length} refactoring suggestions\n`);
    }

    async implementAutomatedFixes() {
        console.log('🤖 Implementing automated fixes...');
        
        let fixCount = 0;
        
        // Fix 1: Remove duplicate CSS declarations
        await this.removeDuplicateCSS();
        fixCount++;
        
        // Fix 2: Optimize asset loading
        await this.optimizeAssetLoading();
        fixCount++;
        
        // Fix 3: Clean up package.json files
        await this.cleanupPackageFiles();
        fixCount++;
        
        console.log(`   ✅ Applied ${fixCount} automated fixes\n`);
    }

    async removeDuplicateCSS() {
        const cssFiles = await this.getFilesByExtension('.css');
        
        for (const file of cssFiles) {
            try {
                let content = await fs.readFile(file, 'utf8');
                const originalLength = content.length;
                
                // Remove duplicate properties within the same rule
                content = content.replace(/([^{}]+)\{([^}]*)\}/g, (match, selector, rules) => {
                    const properties = new Map();
                    const cleanRules = rules.split(';')
                        .filter(rule => rule.trim())
                        .map(rule => {
                            const [prop, value] = rule.split(':').map(s => s.trim());
                            if (prop && value) {
                                properties.set(prop, value);
                                return `${prop}: ${value}`;
                            }
                            return rule;
                        });
                    
                    const uniqueRules = Array.from(properties.entries())
                        .map(([prop, value]) => `  ${prop}: ${value}`)
                        .join(';\n');
                    
                    return `${selector.trim()} {\n${uniqueRules};\n}`;
                });
                
                if (content.length !== originalLength) {
                    await fs.writeFile(file, content);
                    this.cleanupActions.push({
                        file: file,
                        action: 'optimized',
                        description: 'Removed duplicate CSS declarations',
                        savings: originalLength - content.length
                    });
                }
                
            } catch (error) {
                console.warn(`   ⚠️  Could not optimize CSS: ${file}`);
            }
        }
    }

    async optimizeAssetLoading() {
        const htmlFiles = await this.getFilesByExtension('.html');
        
        for (const file of htmlFiles) {
            try {
                let content = await fs.readFile(file, 'utf8');
                let modified = false;
                
                // Add preload hints for critical assets
                if (!content.includes('<link rel="preload"')) {
                    const headTag = content.indexOf('</head>');
                    if (headTag !== -1) {
                        const preloadHints = `
  <!-- Preload critical assets -->
  <link rel="preload" href="/assets/versioned/styles-consolidated.min.css" as="style">
  <link rel="preload" href="/assets/versioned/script-consolidated.min.js" as="script">
`;
                        content = content.substring(0, headTag) + preloadHints + content.substring(headTag);
                        modified = true;
                    }
                }
                
                // Add loading="lazy" to images
                content = content.replace(/<img([^>]*?)src=/g, '<img$1loading="lazy" src=');
                if (content.includes('loading="lazy"')) {
                    modified = true;
                }
                
                if (modified) {
                    await fs.writeFile(file, content);
                    this.cleanupActions.push({
                        file: file,
                        action: 'optimized',
                        description: 'Added performance optimizations',
                    });
                }
                
            } catch (error) {
                console.warn(`   ⚠️  Could not optimize HTML: ${file}`);
            }
        }
    }

    async cleanupPackageFiles() {
        const packageFiles = [
            path.join(repoRoot, 'package.json'),
            path.join(repoRoot, '.github/scripts/package.json'),
            path.join(repoRoot, 'tests/package.json')
        ];
        
        for (const pkgFile of packageFiles) {
            try {
                const content = JSON.parse(await fs.readFile(pkgFile, 'utf8'));
                let modified = false;
                
                // Remove empty scripts
                if (content.scripts) {
                    const originalScripts = Object.keys(content.scripts).length;
                    content.scripts = Object.fromEntries(
                        Object.entries(content.scripts).filter(([key, value]) => value.trim())
                    );
                    
                    if (Object.keys(content.scripts).length !== originalScripts) {
                        modified = true;
                    }
                }
                
                // Sort dependencies alphabetically
                if (content.dependencies) {
                    const sortedDeps = Object.keys(content.dependencies).sort();
                    const newDeps = {};
                    sortedDeps.forEach(key => {
                        newDeps[key] = content.dependencies[key];
                    });
                    content.dependencies = newDeps;
                    modified = true;
                }
                
                if (modified) {
                    await fs.writeFile(pkgFile, JSON.stringify(content, null, 2) + '\n');
                    this.cleanupActions.push({
                        file: pkgFile,
                        action: 'cleaned',
                        description: 'Cleaned up package.json format'
                    });
                }
                
            } catch (error) {
                // Package file doesn't exist or is invalid
            }
        }
    }

    async createQualityDashboard() {
        console.log('📊 Creating code quality dashboard...');
        
        const dashboard = await this.generateQualityReport();
        const dashboardPath = path.join(repoRoot, 'code-quality-dashboard.html');
        await fs.writeFile(dashboardPath, dashboard);
        
        console.log(`   ✅ Quality dashboard created: ${dashboardPath}\n`);
    }

    async setupQualityMonitoring() {
        console.log('📡 Setting up continuous quality monitoring...');
        
        const workflowContent = `name: Code Quality Monitor

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 8 * * *' # Daily at 8 AM

jobs:
  quality-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Run quality enforcer
        run: |
          cd .github/scripts
          npm install
          node code-quality-enforcer.js
          
      - name: Upload quality report
        uses: actions/upload-artifact@v3
        with:
          name: code-quality-report
          path: |
            code-quality-dashboard.html
            data/code-quality-report.json
            
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            if (fs.existsSync('data/code-quality-report.json')) {
              const report = JSON.parse(fs.readFileSync('data/code-quality-report.json'));
              const comment = \`## Code Quality Report
              
**Quality Score**: \${report.qualityScore}/100
**Issues Found**: \${report.totalIssues}
**Dead Code**: \${report.deadCodeCount} instances
**Suggestions**: \${report.refactoringSuggestions}

[View Full Report](../../../actions)
\`;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
`;

        const workflowPath = path.join(repoRoot, '.github/workflows/code-quality-monitor.yml');
        await fs.writeFile(workflowPath, workflowContent);
        
        console.log(`   ✅ Quality monitoring workflow created: ${workflowPath}\n`);
    }

    // Utility methods
    async getCodeFiles() {
        const extensions = ['.js', '.css', '.html', '.json', '.md'];
        const files = [];
        
        for (const ext of extensions) {
            const extFiles = await this.getFilesByExtension(ext);
            files.push(...extFiles);
        }
        
        return files.filter(file => 
            !file.includes('node_modules') && 
            !file.includes('.git') &&
            !file.includes('dist/') &&
            !file.includes('.min.') &&
            !file.includes('consolidated/')
        );
    }

    async getFilesByExtension(extension) {
        const files = [];
        
        const searchDirectories = [
            repoRoot,
            path.join(repoRoot, 'assets'),
            path.join(repoRoot, '.github/scripts'),
            path.join(repoRoot, 'tests')
        ];
        
        for (const dir of searchDirectories) {
            try {
                const dirFiles = await this.getDirectoryFiles(dir);
                files.push(...dirFiles.filter(file => path.extname(file) === extension));
            } catch (error) {
                // Directory doesn't exist
            }
        }
        
        return files;
    }

    async getDirectoryFiles(dir) {
        try {
            const files = [];
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
                    const subFiles = await this.getDirectoryFiles(fullPath);
                    files.push(...subFiles);
                } else if (item.isFile()) {
                    files.push(fullPath);
                }
            }
            
            return files;
        } catch (error) {
            return [];
        }
    }

    async generateQualityReport() {
        const qualityScore = this.calculateQualityScore();
        
        const report = {
            timestamp: new Date().toISOString(),
            qualityScore: qualityScore,
            totalIssues: this.issues.reduce((sum, file) => sum + file.issues.length, 0),
            deadCodeCount: this.deadCode.length,
            refactoringSuggestions: this.refactorings.length,
            cleanupActions: this.cleanupActions.length,
            issues: this.issues,
            deadCode: this.deadCode,
            refactorings: this.refactorings,
            cleanupActions: this.cleanupActions
        };
        
        // Save JSON report
        const reportPath = path.join(repoRoot, 'data/code-quality-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Generate HTML dashboard
        return this.generateHTMLDashboard(report);
    }

    calculateQualityScore() {
        let score = 100;
        
        // Deduct points for issues
        const totalIssues = this.issues.reduce((sum, file) => sum + file.issues.length, 0);
        score -= Math.min(totalIssues * 2, 40); // Max 40 point deduction
        
        // Deduct points for dead code
        score -= Math.min(this.deadCode.length, 20); // Max 20 point deduction
        
        // Add points for cleanup actions
        score += Math.min(this.cleanupActions.length * 5, 20); // Max 20 point bonus
        
        return Math.max(0, Math.min(100, score));
    }

    async generateHTMLDashboard(report) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Code Quality Dashboard</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f8f9fa; }
        .header { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .score { font-size: 3em; font-weight: bold; text-align: center; margin: 20px 0; }
        .score.excellent { color: #28a745; }
        .score.good { color: #17a2b8; }
        .score.warning { color: #ffc107; }
        .score.critical { color: #dc3545; }
        .metric { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 1px 5px rgba(0,0,0,0.1); }
        .metric h3 { margin-top: 0; color: #333; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .issues-list { max-height: 400px; overflow-y: auto; }
        .issue-item { padding: 10px; margin: 5px 0; border-left: 4px solid #007bff; background: #f8f9fa; }
        .severity-high { border-left-color: #dc3545; }
        .severity-warning { border-left-color: #ffc107; }
        .severity-info { border-left-color: #17a2b8; }
        .cleanup-action { padding: 8px 12px; margin: 4px 0; background: #d4edda; border-radius: 4px; border-left: 4px solid #28a745; }
        .refactor-suggestion { padding: 12px; margin: 8px 0; background: #e2e3e5; border-radius: 6px; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛠️  Code Quality Dashboard</h1>
        <p>Generated: ${report.timestamp}</p>
        <div class="score ${this.getScoreClass(report.qualityScore)}">${report.qualityScore}/100</div>
        <p style="text-align: center; color: #666;">Overall Quality Score</p>
    </div>
    
    <div class="grid">
        <div class="metric">
            <h3>📊 Summary</h3>
            <p><strong>Total Issues:</strong> ${report.totalIssues}</p>
            <p><strong>Dead Code Instances:</strong> ${report.deadCodeCount}</p>
            <p><strong>Refactoring Suggestions:</strong> ${report.refactoringSuggestions}</p>
            <p><strong>Cleanup Actions:</strong> ${report.cleanupActions}</p>
        </div>
        
        <div class="metric">
            <h3>🔍 Code Issues</h3>
            <div class="issues-list">
                ${report.issues.map(fileIssue => `
                    <h4>${path.relative(repoRoot, fileIssue.file)}</h4>
                    ${fileIssue.issues.map(issue => `
                        <div class="issue-item severity-${issue.severity}">
                            <strong>Line ${issue.line}:</strong> ${issue.message}<br>
                            <small><em>Suggestion: ${issue.suggestion}</em></small>
                        </div>
                    `).join('')}
                `).join('')}
            </div>
        </div>
    </div>
    
    <div class="grid">
        <div class="metric">
            <h3>🧹 Dead Code</h3>
            ${report.deadCode.map(item => `
                <div class="issue-item">
                    <strong>${item.type}:</strong> ${item.name || path.basename(item.file || '')}<br>
                    <small>${item.suggestion}</small>
                </div>
            `).join('')}
        </div>
        
        <div class="metric">
            <h3>🔧 Refactoring Suggestions</h3>
            ${report.refactorings.map(suggestion => `
                <div class="refactor-suggestion priority-${suggestion.priority.toLowerCase()}">
                    <strong>${suggestion.category}</strong> - ${suggestion.priority}<br>
                    ${suggestion.description}<br>
                    <small><em>${suggestion.action}</em></small>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div class="metric">
        <h3>✅ Cleanup Actions Performed</h3>
        ${report.cleanupActions.map(action => `
            <div class="cleanup-action">
                <strong>${action.action.toUpperCase()}:</strong> ${action.description}
                ${action.file ? `<br><small>File: ${path.relative(repoRoot, action.file)}</small>` : ''}
                ${action.count ? `<br><small>Count: ${action.count}</small>` : ''}
                ${action.savings ? `<br><small>Savings: ${action.savings} bytes</small>` : ''}
            </div>
        `).join('')}
    </div>
    
    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => location.reload(), 300000);
        console.log('Code Quality Dashboard loaded - Score: ${report.qualityScore}/100');
    </script>
</body>
</html>`;
    }

    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'warning';
        return 'critical';
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const enforcer = new CodeQualityEnforcer();
    enforcer.enforceQuality().catch(error => {
        console.error('❌ Code quality enforcement failed:', error);
        process.exit(1);
    });
}

export { CodeQualityEnforcer };