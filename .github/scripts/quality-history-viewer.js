#!/usr/bin/env node

/**
 * Quality History Viewer
 * View current and archived quality history data
 */

import { promises as fs } from 'fs';
import path from 'path';

class QualityHistoryViewer {
    constructor() {
        this.historyFile = path.join(process.cwd(), 'quality-history.json');
        this.archiveDir = path.join(process.cwd(), 'data', 'archives', 'quality');
    }

    async viewCurrent() {
        try {
            const content = await fs.readFile(this.historyFile, 'utf-8');
            const history = JSON.parse(content);
            
            console.log('\n📊 Current Quality History:');
            console.log(`Entries: ${history.length}`);
            
            if (history.length > 0) {
                const first = new Date(history[0].timestamp);
                const last = new Date(history[history.length - 1].timestamp);
                console.log(`Period: ${first.toLocaleString()} to ${last.toLocaleString()}`);
                
                console.log('\n📈 Latest Metrics:');
                const latest = history[history.length - 1];
                this.displayMetrics(latest);
            }
            
            return history;
        } catch (error) {
            console.log('No current history found');
            return [];
        }
    }

    async viewArchives() {
        try {
            const files = await fs.readdir(this.archiveDir);
            const archiveFiles = files.filter(f => 
                f.startsWith('quality-history-') && f.endsWith('.json')
            );
            
            if (archiveFiles.length === 0) {
                console.log('\n📁 No archives found');
                return [];
            }
            
            console.log(`\n📁 Archives (${archiveFiles.length} files):`);
            
            let totalEntries = 0;
            const archives = [];
            
            for (const file of archiveFiles) {
                const filePath = path.join(this.archiveDir, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(content);
                const stats = await fs.stat(filePath);
                
                totalEntries += data.length;
                archives.push({ file, data, stats });
                
                if (data.length > 0) {
                    const first = new Date(data[0].timestamp);
                    const last = new Date(data[data.length - 1].timestamp);
                    console.log(`  - ${file}`);
                    console.log(`    Entries: ${data.length}, Size: ${(stats.size / 1024).toFixed(2)} KB`);
                    console.log(`    Period: ${first.toLocaleDateString()} to ${last.toLocaleDateString()}`);
                }
            }
            
            console.log(`\nTotal archived entries: ${totalEntries}`);
            
            return archives;
        } catch (error) {
            console.log('Error reading archives:', error.message);
            return [];
        }
    }

    async viewSummary() {
        try {
            const summaryPath = path.join(this.archiveDir, 'archive-summary.json');
            const content = await fs.readFile(summaryPath, 'utf-8');
            const summary = JSON.parse(content);
            
            console.log('\n📋 Archive Summary:');
            console.log(`Generated: ${new Date(summary.generated).toLocaleString()}`);
            console.log(`Archives: ${summary.archiveCount}`);
            
            return summary;
        } catch (error) {
            console.log('No archive summary found');
            return null;
        }
    }

    displayMetrics(data) {
        if (data.coreWebVitals) {
            console.log('  Core Web Vitals:');
            console.log(`    - Score: ${data.coreWebVitals.score}/100`);
            console.log(`    - FCP: ${data.coreWebVitals.fcp.toFixed(0)}ms`);
            console.log(`    - LCP: ${data.coreWebVitals.lcp.toFixed(0)}ms`);
            console.log(`    - CLS: ${data.coreWebVitals.cls.toFixed(3)}`);
        }
        
        if (data.performance) {
            console.log('  Performance:');
            console.log(`    - Score: ${data.performance.score.toFixed(1)}/100`);
            console.log(`    - Load Time: ${data.performance.loadTime.toFixed(0)}ms`);
            console.log(`    - Cache Hit: ${(data.performance.cacheHitRatio * 100).toFixed(1)}%`);
        }
        
        if (data.accessibility) {
            console.log('  Accessibility:');
            console.log(`    - Score: ${data.accessibility.score.toFixed(1)}/100`);
            console.log(`    - WCAG: ${data.accessibility.wcagCompliance}`);
            console.log(`    - Issues: ${data.accessibility.issues?.join(', ') || 'None'}`);
        }
        
        if (data.userExperience) {
            console.log('  User Experience:');
            console.log(`    - Score: ${data.userExperience.score.toFixed(1)}/100`);
            console.log(`    - Mobile: ${data.userExperience.mobileExperience.toFixed(1)}/100`);
        }
    }

    async analyzeAllData() {
        // Load current
        const current = await this.viewCurrent();
        
        // Load archives
        const archives = await this.viewArchives();
        
        // Combine all data
        let allData = [...current];
        for (const archive of archives) {
            allData = allData.concat(archive.data);
        }
        
        // Sort by timestamp
        allData.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        if (allData.length === 0) {
            console.log('\n📊 No quality data available');
            return;
        }
        
        console.log('\n📊 Overall Analysis:');
        console.log(`Total measurements: ${allData.length}`);
        
        // Time range
        const firstTime = new Date(allData[0].timestamp);
        const lastTime = new Date(allData[allData.length - 1].timestamp);
        console.log(`Period: ${firstTime.toLocaleDateString()} to ${lastTime.toLocaleDateString()}`);
        
        // Calculate averages
        const avgScores = {
            coreWebVitals: [],
            performance: [],
            accessibility: [],
            userExperience: []
        };
        
        allData.forEach(entry => {
            if (entry.coreWebVitals?.score) avgScores.coreWebVitals.push(entry.coreWebVitals.score);
            if (entry.performance?.score) avgScores.performance.push(entry.performance.score);
            if (entry.accessibility?.score) avgScores.accessibility.push(entry.accessibility.score);
            if (entry.userExperience?.score) avgScores.userExperience.push(entry.userExperience.score);
        });
        
        console.log('\n📈 Average Scores:');
        Object.entries(avgScores).forEach(([key, values]) => {
            if (values.length > 0) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);
                console.log(`  ${key}: ${avg.toFixed(1)} (min: ${min}, max: ${max})`);
            }
        });
        
        // Trend analysis
        if (allData.length >= 2) {
            const recent = allData.slice(-5); // Last 5 measurements
            const older = allData.slice(0, 5); // First 5 measurements
            
            console.log('\n📈 Trend Analysis (First 5 vs Last 5):');
            
            ['coreWebVitals', 'performance', 'accessibility', 'userExperience'].forEach(metric => {
                const oldAvg = older
                    .filter(d => d[metric]?.score)
                    .map(d => d[metric].score)
                    .reduce((a, b, i, arr) => a + b / arr.length, 0);
                    
                const newAvg = recent
                    .filter(d => d[metric]?.score)
                    .map(d => d[metric].score)
                    .reduce((a, b, i, arr) => a + b / arr.length, 0);
                
                if (oldAvg && newAvg) {
                    const change = newAvg - oldAvg;
                    const trend = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
                    console.log(`  ${metric}: ${trend} ${change > 0 ? '+' : ''}${change.toFixed(1)} points`);
                }
            });
        }
    }

    async run(options = {}) {
        console.log('🔍 Quality History Viewer\n');
        console.log('=' .repeat(50));
        
        if (options.current !== false) {
            await this.viewCurrent();
        }
        
        if (options.archives !== false) {
            await this.viewArchives();
        }
        
        if (options.summary !== false) {
            await this.viewSummary();
        }
        
        if (options.analyze) {
            await this.analyzeAllData();
        }
        
        console.log('\n' + '=' .repeat(50));
        console.log('✅ View complete');
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    current: !args.includes('--no-current'),
    archives: !args.includes('--no-archives'),
    summary: !args.includes('--no-summary'),
    analyze: args.includes('--analyze') || args.includes('-a')
};

// Auto-run
const viewer = new QualityHistoryViewer();
viewer.run(options).then(() => {
    process.exit(0);
});

export default QualityHistoryViewer;