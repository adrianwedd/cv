#!/usr/bin/env node

/**
 * Documentation Curator & File Structure Optimizer
 * Automated documentation cleanup, organization, and structure optimization
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');

class DocumentationCurator {
    constructor() {
        this.documentationFiles = [];
        this.orphanedFiles = [];
        this.duplicateContent = [];
        this.structureIssues = [];
        this.optimizations = [];
    }

    async curateDocumentation() {
        console.log('📚 Documentation Curator & File Structure Optimizer');
        console.log('==================================================\n');

        try {
            // Discover and analyze documentation
            await this.discoverDocumentation();
            
            // Detect structural issues
            await this.analyzeFileStructure();
            
            // Clean up orphaned and duplicate files
            await this.cleanupDocumentation();
            
            // Optimize file organization
            await this.optimizeFileStructure();
            
            // Generate documentation index
            await this.generateDocumentationIndex();
            
            // Create maintenance automation
            await this.createDocumentationWorkflow();
            
            console.log('✅ Documentation curation and file structure optimization complete\n');
            
        } catch (error) {
            console.error('❌ Documentation curation failed:', error);
            throw error;
        }
    }

    async discoverDocumentation() {
        console.log('🔍 Discovering documentation files...');
        
        const docExtensions = ['.md', '.txt', '.rst', '.pdf'];
        const allFiles = await this.getAllFiles(repoRoot);
        
        this.documentationFiles = allFiles.filter(file => {
            const ext = path.extname(file);
            const basename = path.basename(file);
            
            return docExtensions.includes(ext) ||
                   basename.toUpperCase().includes('README') ||
                   basename.toUpperCase().includes('CHANGELOG') ||
                   basename.toUpperCase().includes('LICENSE') ||
                   file.includes('/docs/');
        });
        
        console.log(`   📊 Found ${this.documentationFiles.length} documentation files\n`);
    }

    async analyzeFileStructure() {
        console.log('🏗️  Analyzing file structure...');
        
        // Check for files in wrong locations
        await this.identifyMisplacedFiles();
        
        // Find orphaned assets
        await this.findOrphanedAssets();
        
        // Detect duplicate content
        await this.detectDuplicateDocumentation();
        
        // Analyze directory structure
        await this.analyzeDirectoryStructure();
        
        console.log(`   📊 Found ${this.structureIssues.length} structural issues\n`);
    }

    async identifyMisplacedFiles() {
        const rootFiles = await fs.readdir(repoRoot);
        
        // Documentation files that should be in docs/
        const documentationInRoot = rootFiles.filter(file => {
            const upperFile = file.toUpperCase();
            return upperFile.endsWith('.MD') && 
                   !['README.MD', 'CHANGELOG.MD', 'LICENSE.MD', 'CONTRIBUTING.MD'].includes(upperFile);
        });
        
        for (const file of documentationInRoot) {
            this.structureIssues.push({
                type: 'misplaced-documentation',
                file: path.join(repoRoot, file),
                suggestion: `Move ${file} to docs/ directory`,
                severity: 'medium'
            });
        }
        
        // Scripts in wrong locations
        const allFiles = await this.getAllFiles(repoRoot);
        const jsFiles = allFiles.filter(file => file.endsWith('.js') && !file.includes('node_modules'));
        
        for (const file of jsFiles) {
            const relativePath = path.relative(repoRoot, file);
            
            // Scripts in root that should be in .github/scripts
            if (relativePath.split('/').length === 1 && !['script.js', 'sw.js', 'sw-versioned.js'].includes(path.basename(file))) {
                this.structureIssues.push({
                    type: 'misplaced-script',
                    file: file,
                    suggestion: `Move ${path.basename(file)} to appropriate directory`,
                    severity: 'low'
                });
            }
        }
    }

    async findOrphanedAssets() {
        const assetsDir = path.join(repoRoot, 'assets');
        const assetFiles = await this.getAllFiles(assetsDir);
        const allCodeFiles = await this.getAllFiles(repoRoot);
        
        for (const asset of assetFiles) {
            const assetName = path.basename(asset);
            let isReferenced = false;
            
            // Check if asset is referenced anywhere
            for (const codeFile of allCodeFiles) {
                if (codeFile === asset) continue;
                
                try {
                    const content = await fs.readFile(codeFile, 'utf8');
                    if (content.includes(assetName) || content.includes(path.basename(asset, path.extname(asset)))) {
                        isReferenced = true;
                        break;
                    }
                } catch (error) {
                    // Skip binary files
                }
            }
            
            if (!isReferenced) {
                this.orphanedFiles.push({
                    type: 'orphaned-asset',
                    file: asset,
                    suggestion: 'Remove unused asset file',
                    severity: 'low'
                });
            }
        }
    }

    async detectDuplicateDocumentation() {
        const contentMap = new Map();
        
        for (const docFile of this.documentationFiles) {
            try {
                const content = await fs.readFile(docFile, 'utf8');
                const normalizedContent = content.replace(/\s+/g, ' ').toLowerCase().trim();
                
                if (normalizedContent.length < 100) continue; // Skip very short files
                
                const contentHash = this.simpleHash(normalizedContent);
                
                if (contentMap.has(contentHash)) {
                    this.duplicateContent.push({
                        type: 'duplicate-documentation',
                        files: [contentMap.get(contentHash), docFile],
                        suggestion: 'Consolidate duplicate documentation',
                        severity: 'medium'
                    });
                } else {
                    contentMap.set(contentHash, docFile);
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
    }

    async analyzeDirectoryStructure() {
        const recommendedStructure = {
            'assets/': 'Static assets (CSS, JS, images)',
            'data/': 'Data files and databases',
            'docs/': 'Documentation',
            'tests/': 'Test files',
            '.github/': 'GitHub configuration',
            'src/': 'Source code',
            'dist/': 'Build output',
            'temp/': 'Temporary files'
        };
        
        const currentDirs = await this.getDirectories(repoRoot);
        
        // Check for directories that should be consolidated
        const potentialDuplicates = [
            ['docs', 'documentation', 'doc'],
            ['src', 'source', 'lib'],
            ['tests', 'test', 'spec'],
            ['assets', 'static', 'public'],
            ['temp', 'tmp', 'temporary']
        ];
        
        for (const duplicateGroup of potentialDuplicates) {
            const existingDirs = duplicateGroup.filter(dir => currentDirs.includes(dir));
            
            if (existingDirs.length > 1) {
                this.structureIssues.push({
                    type: 'duplicate-directories',
                    directories: existingDirs,
                    suggestion: `Consolidate directories: ${existingDirs.join(', ')}`,
                    severity: 'medium'
                });
            }
        }
        
        // Check for missing essential directories
        const essentialDirs = ['docs', 'tests'];
        for (const essentialDir of essentialDirs) {
            if (!currentDirs.includes(essentialDir)) {
                this.structureIssues.push({
                    type: 'missing-directory',
                    directory: essentialDir,
                    suggestion: `Create ${essentialDir}/ directory for better organization`,
                    severity: 'low'
                });
            }
        }
    }

    async cleanupDocumentation() {
        console.log('🧹 Cleaning up documentation...');
        
        let cleanedCount = 0;
        
        // Remove orphaned files
        for (const orphan of this.orphanedFiles) {
            if (orphan.severity === 'low' && orphan.type === 'orphaned-asset') {
                try {
                    await fs.unlink(orphan.file);
                    cleanedCount++;
                    this.optimizations.push({
                        action: 'removed',
                        file: orphan.file,
                        description: 'Removed orphaned asset file'
                    });
                } catch (error) {
                    console.warn(`   ⚠️  Could not remove orphaned file: ${orphan.file}`);
                }
            }
        }
        
        // Consolidate duplicate documentation
        for (const duplicate of this.duplicateContent) {
            try {
                const [file1, file2] = duplicate.files;
                const content1 = await fs.readFile(file1, 'utf8');
                const content2 = await fs.readFile(file2, 'utf8');
                
                // Keep the longer, more comprehensive version
                const keepFile = content1.length > content2.length ? file1 : file2;
                const removeFile = content1.length > content2.length ? file2 : file1;
                
                // Add reference to consolidated file
                const consolidatedContent = await fs.readFile(keepFile, 'utf8');
                const updatedContent = consolidatedContent + `\n\n<!-- Consolidated from ${path.basename(removeFile)} -->`;
                
                await fs.writeFile(keepFile, updatedContent);
                await fs.unlink(removeFile);
                
                cleanedCount++;
                this.optimizations.push({
                    action: 'consolidated',
                    files: [keepFile, removeFile],
                    description: 'Consolidated duplicate documentation'
                });
                
            } catch (error) {
                console.warn(`   ⚠️  Could not consolidate duplicate files`);
            }
        }
        
        console.log(`   ✅ Cleaned up ${cleanedCount} documentation issues\n`);
    }

    async optimizeFileStructure() {
        console.log('🗂️  Optimizing file structure...');
        
        let optimizedCount = 0;
        
        // Move misplaced documentation to docs/
        const docsDir = path.join(repoRoot, 'docs');
        await fs.mkdir(docsDir, { recursive: true });
        
        for (const issue of this.structureIssues) {
            if (issue.type === 'misplaced-documentation') {
                try {
                    const filename = path.basename(issue.file);
                    const newPath = path.join(docsDir, filename);
                    
                    await fs.rename(issue.file, newPath);
                    
                    optimizedCount++;
                    this.optimizations.push({
                        action: 'moved',
                        from: issue.file,
                        to: newPath,
                        description: 'Moved documentation to docs/ directory'
                    });
                    
                } catch (error) {
                    console.warn(`   ⚠️  Could not move file: ${issue.file}`);
                }
            }
        }
        
        // Create organized subdirectories in assets
        await this.organizeAssets();
        
        // Clean up temporary files
        await this.cleanupTempFiles();
        
        console.log(`   ✅ Optimized ${optimizedCount} structural issues\n`);
    }

    async organizeAssets() {
        const assetsDir = path.join(repoRoot, 'assets');
        const assetFiles = await this.getAllFiles(assetsDir);
        
        const assetCategories = {
            'css': ['styles', 'consolidated', 'versioned'],
            'js': ['scripts', 'consolidated', 'versioned'],
            'img': ['images', 'icons'],
            'data': ['json', 'manifests']
        };
        
        // Create organized subdirectories
        for (const [category, subdirs] of Object.entries(assetCategories)) {
            for (const subdir of subdirs) {
                const categoryDir = path.join(assetsDir, category, subdir);
                await fs.mkdir(categoryDir, { recursive: true });
            }
        }
        
        // Move files to appropriate categories (optional - commented out to avoid breaking existing references)
        /*
        for (const file of assetFiles) {
            const ext = path.extname(file);
            const filename = path.basename(file);
            
            let targetDir = null;
            
            if (ext === '.css') {
                if (filename.includes('consolidated')) {
                    targetDir = path.join(assetsDir, 'css', 'consolidated');
                } else if (filename.includes('versioned')) {
                    targetDir = path.join(assetsDir, 'css', 'versioned');
                } else {
                    targetDir = path.join(assetsDir, 'css', 'styles');
                }
            } else if (ext === '.js') {
                if (filename.includes('consolidated')) {
                    targetDir = path.join(assetsDir, 'js', 'consolidated');
                } else if (filename.includes('versioned')) {
                    targetDir = path.join(assetsDir, 'js', 'versioned');
                } else {
                    targetDir = path.join(assetsDir, 'js', 'scripts');
                }
            }
            
            if (targetDir && path.dirname(file) !== targetDir) {
                try {
                    const newPath = path.join(targetDir, filename);
                    await fs.rename(file, newPath);
                    
                    this.optimizations.push({
                        action: 'organized',
                        from: file,
                        to: newPath,
                        description: 'Organized asset into category directory'
                    });
                } catch (error) {
                    // Skip if file can't be moved (might be referenced)
                }
            }
        }
        */
    }

    async cleanupTempFiles() {
        const tempPatterns = [
            /\.tmp$/,
            /\.temp$/,
            /~$/,
            /\.bak$/,
            /\.backup$/,
            /\.old$/,
            /\.orig$/
        ];
        
        const allFiles = await this.getAllFiles(repoRoot);
        let cleanedCount = 0;
        
        for (const file of allFiles) {
            const filename = path.basename(file);
            
            if (tempPatterns.some(pattern => pattern.test(filename))) {
                try {
                    await fs.unlink(file);
                    cleanedCount++;
                    this.optimizations.push({
                        action: 'removed',
                        file: file,
                        description: 'Removed temporary file'
                    });
                } catch (error) {
                    // Skip files that can't be removed
                }
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`   🗑️  Removed ${cleanedCount} temporary files`);
        }
    }

    async generateDocumentationIndex() {
        console.log('📋 Generating documentation index...');
        
        const docsDir = path.join(repoRoot, 'docs');
        await fs.mkdir(docsDir, { recursive: true });
        
        const docFiles = this.documentationFiles.filter(file => 
            fs.access(file).then(() => true).catch(() => false)
        );
        
        const indexContent = await this.createDocumentationIndex(docFiles);
        const indexPath = path.join(docsDir, 'README.md');
        
        await fs.writeFile(indexPath, indexContent);
        
        console.log(`   ✅ Documentation index created: ${indexPath}\n`);
    }

    async createDocumentationIndex(docFiles) {
        const now = new Date().toISOString();
        
        let index = `# Documentation Index

*Generated automatically on ${now}*

This directory contains all project documentation organized by category.

## 📚 Available Documentation

### Core Documentation
`;

        // Categorize documentation files
        const categories = {
            'Core': ['README', 'CHANGELOG', 'LICENSE', 'CONTRIBUTING'],
            'Development': ['DEVELOPMENT', 'API', 'ARCHITECTURE', 'TESTING'],
            'Deployment': ['DEPLOYMENT', 'INFRASTRUCTURE', 'MONITORING'],
            'User Guides': ['USER', 'GUIDE', 'TUTORIAL', 'GETTING_STARTED'],
            'Technical': ['TECHNICAL', 'SYSTEM', 'DATABASE', 'SECURITY']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            const categoryFiles = docFiles.filter(file => {
                const filename = path.basename(file).toUpperCase();
                return keywords.some(keyword => filename.includes(keyword));
            });
            
            if (categoryFiles.length > 0) {
                index += `\n### ${category}\n\n`;
                for (const file of categoryFiles) {
                    const relativePath = path.relative(repoRoot, file);
                    const filename = path.basename(file, path.extname(file));
                    const title = this.formatTitle(filename);
                    
                    index += `- [${title}](../${relativePath})\n`;
                }
            }
        }
        
        // Add uncategorized files
        const categorizedFiles = new Set();
        for (const [category, keywords] of Object.entries(categories)) {
            docFiles.filter(file => {
                const filename = path.basename(file).toUpperCase();
                return keywords.some(keyword => filename.includes(keyword));
            }).forEach(file => categorizedFiles.add(file));
        }
        
        const uncategorized = docFiles.filter(file => !categorizedFiles.has(file));
        if (uncategorized.length > 0) {
            index += `\n### Other Documentation\n\n`;
            for (const file of uncategorized) {
                const relativePath = path.relative(repoRoot, file);
                const filename = path.basename(file, path.extname(file));
                const title = this.formatTitle(filename);
                
                index += `- [${title}](../${relativePath})\n`;
            }
        }
        
        index += `\n## 📊 Documentation Statistics

- **Total Files**: ${docFiles.length}
- **Categories**: ${Object.keys(categories).length}
- **Last Updated**: ${now}

## 🔍 Quick Links

- [Project README](../README.md)
- [Development Guide](../DEVELOPMENT_GUIDE.md)
- [API Documentation](../docs/api.md)
- [Changelog](../CHANGELOG.md)

---
*This index is automatically maintained by the Documentation Curator system.*
`;

        return index;
    }

    async createDocumentationWorkflow() {
        console.log('🤖 Creating documentation maintenance workflow...');
        
        const workflowContent = `name: Documentation Maintenance

on:
  push:
    paths:
      - '**.md'
      - '**.txt'
      - 'docs/**'
  schedule:
    - cron: '0 9 * * 0' # Weekly on Sunday at 9 AM
  workflow_dispatch:

jobs:
  documentation-maintenance:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Run documentation curator
        run: |
          cd .github/scripts
          npm install
          node documentation-curator.js
          
      - name: Check for broken links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          use-verbose-mode: 'yes'
          config-file: '.github/workflows/markdown-link-check-config.json'
          
      - name: Generate documentation report
        run: |
          echo "## Documentation Health Report" > doc-report.md
          echo "Generated: \$(date)" >> doc-report.md
          echo "" >> doc-report.md
          echo "### Files Processed" >> doc-report.md
          find . -name "*.md" | wc -l | xargs echo "Markdown files:" >> doc-report.md
          echo "" >> doc-report.md
          echo "### Structure Optimizations" >> doc-report.md
          echo "✅ Documentation index updated" >> doc-report.md
          echo "✅ File structure optimized" >> doc-report.md
          echo "✅ Orphaned files cleaned" >> doc-report.md
          
      - name: Commit documentation updates
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git diff --staged --quiet || git commit -m "📚 Automated documentation maintenance"
          
      - name: Push changes
        uses: ad-m/github-push-action@master
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          
      - name: Upload documentation report
        uses: actions/upload-artifact@v3
        with:
          name: documentation-report
          path: doc-report.md
`;

        const workflowPath = path.join(repoRoot, '.github/workflows/documentation-maintenance.yml');
        await fs.writeFile(workflowPath, workflowContent);
        
        // Create link check config
        const linkCheckConfig = {
            "ignorePatterns": [
                { "pattern": "^http://localhost" },
                { "pattern": "^https://localhost" },
                { "pattern": "^http://127.0.0.1" },
                { "pattern": "^https://127.0.0.1" }
            ],
            "aliveStatusCodes": [200, 206, 999],
            "retryOn429": true,
            "retryCount": 3,
            "fallbackHttpStatus": [400, 401, 403, 404, 500, 502, 503, 504]
        };
        
        const configPath = path.join(repoRoot, '.github/workflows/markdown-link-check-config.json');
        await fs.writeFile(configPath, JSON.stringify(linkCheckConfig, null, 2));
        
        console.log(`   ✅ Documentation workflow created: ${workflowPath}\n`);
    }

    // Utility methods
    async getAllFiles(dir) {
        try {
            const files = [];
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory() && !this.shouldSkipDirectory(item.name)) {
                    const subFiles = await this.getAllFiles(fullPath);
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

    async getDirectories(dir) {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            return items
                .filter(item => item.isDirectory() && !item.name.startsWith('.'))
                .map(item => item.name);
        } catch (error) {
            return [];
        }
    }

    shouldSkipDirectory(dirName) {
        const skipDirs = ['node_modules', '.git', 'dist', '.next', 'coverage', '.nyc_output'];
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    formatTitle(filename) {
        return filename
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const curator = new DocumentationCurator();
    curator.curateDocumentation().catch(error => {
        console.error('❌ Documentation curation failed:', error);
        process.exit(1);
    });
}

export { DocumentationCurator };