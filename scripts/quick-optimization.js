#!/usr/bin/env node

/**
 * Quick Performance Optimization - Phase 1 Emergency Implementation
 * Target: Remove tests/node_modules (275MB) and other bloat immediately
 */

import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function quickOptimization() {
    console.log('🚀 Quick Performance Optimization Starting...');
    
    let totalSaved = 0;
    let optimizations = 0;
    
    try {
        // Get baseline  
        const { stdout: beforeSize } = await execAsync('du -sk .');
        const sizeBefore = parseInt(beforeSize.split('\t')[0]) * 1024; // Convert KB to bytes
        console.log(`📊 Baseline: ${(sizeBefore/1024/1024).toFixed(1)}MB`);
        
        // 1. Remove tests/node_modules (275MB bloat)
        if (fs.existsSync('./tests/node_modules')) {
            console.log('🗑️ Removing tests/node_modules...');
            await execAsync('rm -rf ./tests/node_modules');
            
            // Create .gitignore to prevent recreation
            const gitignoreContent = 'node_modules/\ncoverage/\ntest-results/\n';
            await fs.promises.writeFile('./tests/.gitignore', gitignoreContent);
            
            optimizations++;
            console.log('✅ Removed tests/node_modules');
        }
        
        // 2. Clean up large PNG files (screenshots, etc.)
        const pngFiles = [
            './critical-fixes-verified.png',
            './brutal-reality-check.png', 
            './final-perfect-verification.png',
            './final-beautiful-ui.png',
            './absolute-proof.png'
        ];
        
        for (const file of pngFiles) {
            if (fs.existsSync(file)) {
                const stats = await fs.promises.stat(file);
                await fs.promises.unlink(file);
                totalSaved += stats.size;
                optimizations++;
                console.log(`🗑️ Removed ${file} (${(stats.size/1024).toFixed(1)}KB)`);
            }
        }
        
        // 3. Compress large JSON files in data/ 
        const dataFiles = await fs.promises.readdir('./data', { recursive: true });
        for (const file of dataFiles) {
            if (file.endsWith('.json')) {
                const filepath = `./data/${file}`;
                if (fs.existsSync(filepath)) {
                    try {
                        const stats = await fs.promises.stat(filepath);
                        if (stats.size > 100 * 1024) { // >100KB
                            const content = await fs.promises.readFile(filepath, 'utf8');
                            const parsed = JSON.parse(content);
                            const minified = JSON.stringify(parsed);
                            
                            if (minified.length < content.length * 0.9) {
                                await fs.promises.writeFile(filepath, minified);
                                const saved = content.length - minified.length;
                                totalSaved += saved;
                                optimizations++;
                                console.log(`🗜️ Compressed ${file} (${(saved/1024).toFixed(1)}KB saved)`);
                            }
                        }
                    } catch (error) {
                        // Skip problematic files
                    }
                }
            }
        }
        
        // 4. Clean temp files
        const tempPatterns = [
            './temp/*',
            './tests/test-results/*',
            './tests/coverage/*'
        ];
        
        for (const pattern of tempPatterns) {
            try {
                // Safely escape the pattern for shell execution
                const safePath = pattern.replace('*', '').replace(/[;&|`$(){}[\]\\]/g, '\\$&');
                const { stdout } = await execAsync(`find "${safePath}" -type f 2>/dev/null || true`);
                const files = stdout.split('\n').filter(f => f.trim());
                
                for (const file of files) {
                    try {
                        const stats = await fs.promises.stat(file);
                        await fs.promises.unlink(file);
                        totalSaved += stats.size;
                        optimizations++;
                    } catch (error) {
                        // Skip files that can't be deleted
                    }
                }
                
                if (files.length > 0) {
                    console.log(`🧹 Cleaned ${files.length} temp files from ${pattern}`);
                }
            } catch (error) {
                // Skip patterns that cause errors
            }
        }
        
        // Get final size
        const { stdout: afterSize } = await execAsync('du -sk .');
        const sizeAfter = parseInt(afterSize.split('\t')[0]) * 1024;
        const totalReduction = sizeBefore - sizeAfter;
        const percentageReduction = (totalReduction / sizeBefore) * 100;
        
        const targetMet = sizeAfter <= (400 * 1024 * 1024); // 400MB
        
        console.log('\n🎯 OPTIMIZATION COMPLETE!');
        console.log(`📊 Before: ${(sizeBefore/1024/1024).toFixed(1)}MB`);
        console.log(`📊 After: ${(sizeAfter/1024/1024).toFixed(1)}MB`);
        console.log(`📈 Reduction: ${(totalReduction/1024/1024).toFixed(1)}MB (${percentageReduction.toFixed(1)}%)`);
        console.log(`✅ Optimizations Applied: ${optimizations}`);
        console.log(`🎯 Target Met: ${targetMet ? '✅ YES' : '❌ NO'}`);
        
        // Create summary report
        const report = {
            timestamp: new Date().toISOString(),
            before: { size: sizeBefore, formatted: `${(sizeBefore/1024/1024).toFixed(1)}MB` },
            after: { size: sizeAfter, formatted: `${(sizeAfter/1024/1024).toFixed(1)}MB` },
            reduction: { 
                bytes: totalReduction, 
                formatted: `${(totalReduction/1024/1024).toFixed(1)}MB`,
                percentage: percentageReduction.toFixed(1)
            },
            optimizations,
            targetMet,
            target: '400MB'
        };
        
        await fs.promises.writeFile('./optimization-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n📋 Report saved to: optimization-report.json');
        
        return report;
        
    } catch (error) {
        console.error('❌ Optimization failed:', error.message);
        throw error;
    }
}

// Deploy simple monitoring
async function deploySimpleMonitoring() {
    console.log('📊 Deploying Simple Monitoring...');
    
    const monitorScript = `#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function monitor() {
    try {
        const { stdout } = await execAsync('du -sk .');
        const size = parseInt(stdout.split('\\t')[0]) * 1024;
        const sizeMB = (size / 1024 / 1024).toFixed(1);
        
        const { stdout: jsonCount } = await execAsync('find . -name "*.json" -type f | wc -l');
        const jsonFiles = parseInt(jsonCount.trim());
        
        const timestamp = new Date().toLocaleString();
        
        console.log(\`📊 \${timestamp} | Size: \${sizeMB}MB | JSON Files: \${jsonFiles} | Target: 400MB\`);
        
        if (size > 450 * 1024 * 1024) {
            console.log('🚨 WARNING: Repository size exceeds 450MB threshold');
        }
        
    } catch (error) {
        console.error('❌ Monitor error:', error.message);
    }
}

console.log('📊 Performance Monitor Started (30s intervals)');
monitor(); // Initial run
setInterval(monitor, 30000);
`;

    await fs.promises.writeFile('./simple-monitor.js', monitorScript);
    
    console.log('📊 Simple monitoring deployed: node simple-monitor.js');
}

// Execute optimization
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        const report = await quickOptimization();
        await deploySimpleMonitoring();
        
        console.log('\n🚀 Quick Optimization Phase 1 Complete!');
        console.log('📊 Start monitoring: node simple-monitor.js');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Quick optimization failed:', error);
        process.exit(1);
    }
}