#!/usr/bin/env node

/**
 * Repository Surgeon Master Controller
 * Orchestrates all technical debt elimination systems
 */

import { RepositorySurgeon } from './repository-surgeon.js';
import { AssetVersioningSystem } from './asset-versioning-system.js';  
import { DependencyManager } from './dependency-manager.js';
import { CodeQualityEnforcer } from './code-quality-enforcer.js';
import { DocumentationCurator } from './documentation-curator.js';

class RepositorySurgeonMaster {
    constructor() {
        this.systems = [
            { name: 'Repository Surgeon', class: RepositorySurgeon, method: 'performSurgery' },
            { name: 'Asset Versioning System', class: AssetVersioningSystem, method: 'implementVersioning' },
            { name: 'Dependency Manager', class: DependencyManager, method: 'manageDependencies' },
            { name: 'Code Quality Enforcer', class: CodeQualityEnforcer, method: 'enforceQuality' },
            { name: 'Documentation Curator', class: DocumentationCurator, method: 'curateDocumentation' }
        ];
    }

    async executeComprehensiveSurgery() {
        console.log('🏥 REPOSITORY SURGEON MASTER - COMPREHENSIVE TECHNICAL DEBT ELIMINATION');
        console.log('========================================================================\n');
        
        const startTime = Date.now();
        let successCount = 0;
        const results = [];
        
        for (const system of this.systems) {
            try {
                console.log(`🔧 Executing: ${system.name}`);
                console.log('-'.repeat(50));
                
                const instance = new system.class();
                await instance[system.method]();
                
                results.push({
                    name: system.name,
                    status: 'SUCCESS',
                    timestamp: new Date().toISOString()
                });
                
                successCount++;
                console.log(`✅ ${system.name} completed successfully\n`);
                
            } catch (error) {
                console.error(`❌ ${system.name} failed:`, error.message);
                results.push({
                    name: system.name,
                    status: 'FAILED',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        const duration = Date.now() - startTime;
        
        console.log('🎉 COMPREHENSIVE SURGERY COMPLETE');
        console.log('=================================');
        console.log(`✅ Systems Deployed: ${successCount}/${this.systems.length}`);
        console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`);
        console.log(`📊 Success Rate: ${Math.round((successCount / this.systems.length) * 100)}%`);
        
        if (successCount === this.systems.length) {
            console.log('\n🏆 MISSION ACCOMPLISHED: Repository transformation complete!');
            console.log('📄 Full report: /Users/adrian/repos/cv/REPOSITORY_SURGERY_REPORT.md');
        } else {
            console.log('\n⚠️  Partial success - review failed systems');
        }
        
        return {
            success: successCount === this.systems.length,
            results: results,
            duration: duration,
            successRate: (successCount / this.systems.length) * 100
        };
    }
}

// Execute comprehensive surgery if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const master = new RepositorySurgeonMaster();
    master.executeComprehensiveSurgery().catch(error => {
        console.error('❌ Comprehensive surgery failed:', error);
        process.exit(1);
    });
}

export { RepositorySurgeonMaster };