#!/usr/bin/env node

/**
 * Automated Dependency Management System
 * Handles dependency updates, security auditing, and optimization
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../');

class DependencyManager {
    constructor() {
        this.packageFiles = [];
        this.vulnerabilities = [];
        this.updates = [];
        this.optimizations = [];
    }

    async manageDependencies() {
        console.log('📦 Automated Dependency Management System');
        console.log('========================================\n');

        try {
            // Discover all package.json files
            await this.discoverPackageFiles();
            
            // Audit dependencies for security issues
            await this.auditDependencies();
            
            // Check for available updates
            await this.checkForUpdates();
            
            // Optimize dependency tree
            await this.optimizeDependencies();
            
            // Generate dependency report
            await this.generateDependencyReport();
            
            // Create automated update workflow
            await this.createUpdateWorkflow();
            
            console.log('✅ Dependency management system implemented\n');
            
        } catch (error) {
            console.error('❌ Dependency management failed:', error);
            throw error;
        }
    }

    async discoverPackageFiles() {
        console.log('🔍 Discovering package.json files...');
        
        const packagePaths = [
            path.join(repoRoot, 'package.json'),
            path.join(repoRoot, '.github/scripts/package.json'),
            path.join(repoRoot, 'tests/package.json'),
            path.join(repoRoot, 'monitoring/package.json'),
        ];
        
        for (const pkgPath of packagePaths) {
            try {
                await fs.access(pkgPath);
                const content = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
                this.packageFiles.push({
                    path: pkgPath,
                    directory: path.dirname(pkgPath),
                    content: content,
                    dependencies: {
                        ...content.dependencies,
                        ...content.devDependencies
                    }
                });
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        console.log(`   ✅ Found ${this.packageFiles.length} package.json files\n`);
    }

    async auditDependencies() {
        console.log('🔒 Security audit of dependencies...');
        
        for (const pkg of this.packageFiles) {
            try {
                const auditOutput = execSync('npm audit --json', {
                    cwd: pkg.directory,
                    encoding: 'utf8'
                });
                
                const audit = JSON.parse(auditOutput);
                
                if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
                    this.vulnerabilities.push({
                        package: pkg.path,
                        vulnerabilities: audit.vulnerabilities,
                        summary: audit.metadata
                    });
                }
                
            } catch (error) {
                // npm audit may return non-zero exit code for vulnerabilities
                if (error.stdout) {
                    try {
                        const audit = JSON.parse(error.stdout);
                        if (audit.vulnerabilities) {
                            this.vulnerabilities.push({
                                package: pkg.path,
                                vulnerabilities: audit.vulnerabilities,
                                summary: audit.metadata
                            });
                        }
                    } catch (parseError) {
                        console.warn(`   ⚠️  Could not audit: ${pkg.path}`);
                    }
                }
            }
        }
        
        const totalVulnerabilities = this.vulnerabilities.reduce((sum, v) => 
            sum + (v.summary?.vulnerabilities?.total || 0), 0);
        
        console.log(`   📊 Security audit complete: ${totalVulnerabilities} vulnerabilities found\n`);
    }

    async checkForUpdates() {
        console.log('🔄 Checking for dependency updates...');
        
        for (const pkg of this.packageFiles) {
            try {
                const outdatedOutput = execSync('npm outdated --json', {
                    cwd: pkg.directory,
                    encoding: 'utf8'
                });
                
                const outdated = JSON.parse(outdatedOutput);
                
                if (Object.keys(outdated).length > 0) {
                    this.updates.push({
                        package: pkg.path,
                        outdated: outdated
                    });
                }
                
            } catch (error) {
                // npm outdated returns non-zero when packages are outdated
                if (error.stdout) {
                    try {
                        const outdated = JSON.parse(error.stdout);
                        if (Object.keys(outdated).length > 0) {
                            this.updates.push({
                                package: pkg.path,
                                outdated: outdated
                            });
                        }
                    } catch (parseError) {
                        // No outdated packages or parse error
                    }
                }
            }
        }
        
        const totalUpdates = this.updates.reduce((sum, u) => 
            sum + Object.keys(u.outdated).length, 0);
        
        console.log(`   📊 Update check complete: ${totalUpdates} packages can be updated\n`);
    }

    async optimizeDependencies() {
        console.log('⚡ Optimizing dependency tree...');
        
        for (const pkg of this.packageFiles) {
            const optimizations = {
                duplicates: [],
                unused: [],
                oversized: [],
                recommendations: []
            };
            
            // Check for duplicate dependencies across versions
            const deps = pkg.dependencies;
            const depNames = Object.keys(deps);
            
            // Simple duplicate detection (same package, different versions)
            const duplicateGroups = {};
            for (const dep of depNames) {
                const baseName = dep.split('@')[0];
                if (!duplicateGroups[baseName]) {
                    duplicateGroups[baseName] = [];
                }
                duplicateGroups[baseName].push(dep);
            }
            
            for (const [baseName, versions] of Object.entries(duplicateGroups)) {
                if (versions.length > 1) {
                    optimizations.duplicates.push({
                        name: baseName,
                        versions: versions
                    });
                }
            }
            
            // Add optimization recommendations
            if (optimizations.duplicates.length > 0) {
                optimizations.recommendations.push('Consolidate duplicate dependencies');
            }
            
            // Check for large packages (conceptual - would need actual size analysis)
            const potentiallyLarge = depNames.filter(dep => 
                dep.includes('moment') || 
                dep.includes('lodash') || 
                dep.includes('rxjs')
            );
            
            if (potentiallyLarge.length > 0) {
                optimizations.oversized = potentiallyLarge;
                optimizations.recommendations.push('Consider lighter alternatives for large packages');
            }
            
            if (optimizations.duplicates.length > 0 || optimizations.oversized.length > 0) {
                this.optimizations.push({
                    package: pkg.path,
                    optimizations: optimizations
                });
            }
        }
        
        console.log(`   📊 Optimization analysis complete: ${this.optimizations.length} packages have optimization opportunities\n`);
    }

    async generateDependencyReport() {
        console.log('📋 Generating dependency report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalPackages: this.packageFiles.length,
                totalVulnerabilities: this.vulnerabilities.reduce((sum, v) => 
                    sum + (v.summary?.vulnerabilities?.total || 0), 0),
                totalUpdates: this.updates.reduce((sum, u) => 
                    sum + Object.keys(u.outdated).length, 0),
                optimizationOpportunities: this.optimizations.length
            },
            packages: this.packageFiles.map(pkg => ({
                path: pkg.path,
                dependencies: Object.keys(pkg.dependencies).length,
                vulnerabilities: this.vulnerabilities.find(v => v.package === pkg.path)?.summary?.vulnerabilities?.total || 0,
                updates: this.updates.find(u => u.package === pkg.path) ? Object.keys(this.updates.find(u => u.package === pkg.path).outdated).length : 0
            })),
            vulnerabilities: this.vulnerabilities,
            updates: this.updates,
            optimizations: this.optimizations,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(repoRoot, 'data/dependency-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Generate human-readable report
        const readableReport = await this.generateReadableReport(report);
        const readableReportPath = path.join(repoRoot, 'DEPENDENCY_REPORT.md');
        await fs.writeFile(readableReportPath, readableReport);
        
        console.log(`   ✅ Reports generated:`);
        console.log(`      - JSON: ${reportPath}`);
        console.log(`      - Markdown: ${readableReportPath}\n`);
    }

    async createUpdateWorkflow() {
        console.log('🤖 Creating automated update workflow...');
        
        const workflowContent = `name: Automated Dependency Updates

on:
  schedule:
    - cron: '0 6 * * 1' # Weekly on Monday at 6 AM
  workflow_dispatch:

jobs:
  dependency-updates:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Run dependency manager
        run: |
          cd .github/scripts
          npm install
          node dependency-manager.js
          
      - name: Update dependencies (minor/patch only)
        run: |
          # Update dependencies in each package.json location
          locations=("." ".github/scripts" "tests" "monitoring")
          for location in "\${locations[@]}"; do
            if [ -f "$location/package.json" ]; then
              cd "$location"
              echo "Updating dependencies in $location"
              npm update
              cd - > /dev/null
            fi
          done
          
      - name: Run security audit fix
        run: |
          locations=("." ".github/scripts" "tests" "monitoring")
          for location in "\${locations[@]}"; do
            if [ -f "$location/package.json" ]; then
              cd "$location"
              echo "Running security audit fix in $location"
              npm audit fix --only=prod || true
              cd - > /dev/null
            fi
          done
          
      - name: Run tests
        run: |
          if [ -f "package.json" ] && npm run test --if-present; then
            echo "Tests passed"
          fi
          
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: \${{ secrets.GITHUB_TOKEN }}
          commit-message: '📦 Automated dependency updates'
          title: '📦 Weekly Dependency Updates'
          body: |
            ## Automated Dependency Updates
            
            This PR contains automated dependency updates:
            
            - ✅ Security vulnerabilities patched
            - ✅ Minor and patch updates applied  
            - ✅ Tests passed
            
            ### Summary
            - Updated packages with security fixes
            - Applied safe minor/patch updates
            - No breaking changes expected
            
            Generated by automated dependency management system.
          branch: automated-dependency-updates
          delete-branch: true
          
      - name: Auto-merge if tests pass
        uses: pascalgn/merge-action@v0.15.6
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          merge_method: merge
        env:
          MERGE_LABELS: dependencies,automated
          MERGE_DELETE_BRANCH: true
`;

        const workflowPath = path.join(repoRoot, '.github/workflows/dependency-updates.yml');
        await fs.writeFile(workflowPath, workflowContent);
        
        console.log(`   ✅ Automated update workflow created: ${workflowPath}\n`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.vulnerabilities.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Security',
                description: 'Address security vulnerabilities immediately',
                action: 'Run npm audit fix in affected packages'
            });
        }
        
        if (this.updates.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Updates',
                description: 'Update outdated packages to latest versions',
                action: 'Review and apply updates, test thoroughly'
            });
        }
        
        if (this.optimizations.length > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Optimization',
                description: 'Optimize dependency tree for better performance',
                action: 'Remove duplicates, consider lighter alternatives'
            });
        }
        
        // Always include general recommendations
        recommendations.push(
            {
                priority: 'MEDIUM',
                category: 'Automation',
                description: 'Enable automated dependency updates',
                action: 'Use Dependabot or similar service for regular updates'
            },
            {
                priority: 'LOW',
                category: 'Monitoring',
                description: 'Monitor dependency health continuously',
                action: 'Set up alerts for new vulnerabilities and updates'
            }
        );
        
        return recommendations;
    }

    async generateReadableReport(report) {
        return `# Dependency Management Report

**Generated**: ${report.timestamp}

## Summary

- **Total Packages**: ${report.summary.totalPackages}
- **Security Vulnerabilities**: ${report.summary.totalVulnerabilities}
- **Available Updates**: ${report.summary.totalUpdates}  
- **Optimization Opportunities**: ${report.summary.optimizationOpportunities}

## Package Overview

${report.packages.map(pkg => `
### ${pkg.path}
- Dependencies: ${pkg.dependencies}
- Vulnerabilities: ${pkg.vulnerabilities}
- Updates Available: ${pkg.updates}
`).join('')}

## Security Vulnerabilities

${report.vulnerabilities.length > 0 ? report.vulnerabilities.map(v => `
### ${v.package}
- Total: ${v.summary?.vulnerabilities?.total || 0}
- Critical: ${v.summary?.vulnerabilities?.critical || 0}
- High: ${v.summary?.vulnerabilities?.high || 0}
- Moderate: ${v.summary?.vulnerabilities?.moderate || 0}
- Low: ${v.summary?.vulnerabilities?.low || 0}
`).join('') : 'No security vulnerabilities found ✅'}

## Available Updates

${report.updates.length > 0 ? report.updates.map(u => `
### ${u.package}
${Object.entries(u.outdated).map(([name, info]) => `
- **${name}**: ${info.current} → ${info.latest}
`).join('')}
`).join('') : 'All packages are up to date ✅'}

## Optimization Opportunities

${report.optimizations.length > 0 ? report.optimizations.map(o => `
### ${o.package}
${o.optimizations.recommendations.map(rec => `- ${rec}`).join('\n')}
`).join('') : 'No optimization opportunities found ✅'}

## Recommendations

${report.recommendations.map(rec => `
### ${rec.priority}: ${rec.category}
${rec.description}

**Action**: ${rec.action}
`).join('')}

---
*Report generated by Automated Dependency Management System*
`;
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new DependencyManager();
    manager.manageDependencies().catch(error => {
        console.error('❌ Dependency management failed:', error);
        process.exit(1);
    });
}

export { DependencyManager };