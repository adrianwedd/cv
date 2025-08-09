#!/usr/bin/env node

/**
 * Quality Monitor with Automatic Cleanup
 * Monitors quality metrics and automatically archives old data
 */

import { promises as fs } from 'fs';
import path from 'path';
import QualityHistoryArchiver from './quality-history-archiver.js';

class QualityMonitorWithCleanup {
    constructor() {
        this.historyFile = path.join(process.cwd(), 'quality-history.json');
        this.reportFile = path.join(process.cwd(), 'quality-report.json');
        this.archiver = new QualityHistoryArchiver();
    }

    async loadHistory() {
        try {
            const content = await fs.readFile(this.historyFile, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            return [];
        }
    }

    async saveHistory(history) {
        await fs.writeFile(
            this.historyFile,
            JSON.stringify(history, null, 2),
            'utf-8'
        );
    }

    async addQualityMeasurement(measurement) {
        // Load existing history
        let history = await this.loadHistory();
        
        // Add new measurement
        history.push({
            timestamp: new Date().toISOString(),
            ...measurement
        });

        // Save updated history
        await this.saveHistory(history);
        
        // Check if cleanup is needed
        if (history.length > 10) {
            console.log('📦 Quality history exceeds 10 entries, triggering automatic archival...');
            await this.performCleanup();
        }
        
        return history.length;
    }

    async performCleanup() {
        console.log('🧹 Starting automatic cleanup...');
        
        try {
            // Initialize archiver
            await this.archiver.init();
            
            // Clean duplicates
            await this.archiver.cleanupDuplicates();
            
            // Load history after deduplication
            const history = await this.archiver.loadHistory();
            
            // Archive old data if needed
            const result = await this.archiver.archiveOldData(history);
            
            if (result.archived) {
                console.log(`✅ Archived ${result.entriesArchived} entries automatically`);
                console.log(`📊 Kept ${result.entriesKept} recent entries for analysis`);
                
                // Generate archive summary
                await this.archiver.generateArchiveSummary();
            } else {
                console.log('ℹ️ No archival needed at this time');
            }
            
            return result;
        } catch (error) {
            console.error('⚠️ Cleanup failed:', error.message);
            // Don't throw - cleanup failure shouldn't break monitoring
            return { archived: false, error: error.message };
        }
    }

    async generateReport() {
        const history = await this.loadHistory();
        
        if (history.length === 0) {
            console.log('No quality history available');
            return null;
        }

        // Get latest measurement
        const latest = history[history.length - 1];
        
        // Calculate trends (if we have at least 2 measurements)
        let trends = {};
        if (history.length >= 2) {
            const previous = history[history.length - 2];
            
            // Core Web Vitals trend
            if (latest.coreWebVitals && previous.coreWebVitals) {
                const scoreChange = latest.coreWebVitals.score - previous.coreWebVitals.score;
                trends.coreWebVitals = {
                    direction: scoreChange > 0 ? 'improving' : scoreChange < 0 ? 'declining' : 'stable',
                    change: scoreChange.toFixed(2)
                };
            }
            
            // Performance trend
            if (latest.performance && previous.performance) {
                const perfChange = latest.performance.score - previous.performance.score;
                trends.performance = {
                    direction: perfChange > 0 ? 'improving' : perfChange < 0 ? 'declining' : 'stable',
                    change: perfChange.toFixed(2)
                };
            }
        }

        // Calculate overall score
        const scores = [];
        if (latest.coreWebVitals?.score) scores.push(latest.coreWebVitals.score);
        if (latest.accessibility?.score) scores.push(latest.accessibility.score);
        if (latest.performance?.score) scores.push(latest.performance.score);
        if (latest.userExperience?.score) scores.push(latest.userExperience.score);
        
        const overallScore = scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        const report = {
            timestamp: new Date().toISOString(),
            overview: {
                overallScore,
                measurementCount: history.length,
                monitoringDuration: this.calculateDuration(history)
            },
            currentMetrics: latest,
            trends,
            recommendations: this.generateRecommendations(latest, trends)
        };

        // Save report
        await fs.writeFile(
            this.reportFile,
            JSON.stringify(report, null, 2),
            'utf-8'
        );

        return report;
    }

    calculateDuration(history) {
        if (history.length < 2) return 'N/A';
        
        const first = new Date(history[0].timestamp);
        const last = new Date(history[history.length - 1].timestamp);
        const durationMs = last - first;
        
        const minutes = Math.round(durationMs / 1000 / 60);
        if (minutes < 60) return `${minutes} minutes`;
        
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `${hours} hours`;
        
        const days = Math.round(hours / 24);
        return `${days} days`;
    }

    generateRecommendations(latest, trends) {
        const recommendations = [];

        // Core Web Vitals recommendations
        if (latest.coreWebVitals) {
            if (latest.coreWebVitals.lcp > 2500) {
                recommendations.push({
                    category: 'Performance',
                    priority: 'High',
                    message: 'Largest Contentful Paint is above 2.5s. Consider optimizing images and server response times.'
                });
            }
            if (latest.coreWebVitals.cls > 0.1) {
                recommendations.push({
                    category: 'User Experience',
                    priority: 'Medium',
                    message: 'Cumulative Layout Shift is high. Review dynamic content loading and reserve space for images.'
                });
            }
        }

        // Accessibility recommendations
        if (latest.accessibility && latest.accessibility.score < 90) {
            recommendations.push({
                category: 'Accessibility',
                priority: 'High',
                message: `Accessibility score is ${latest.accessibility.score.toFixed(1)}. Address issues: ${latest.accessibility.issues?.join(', ') || 'Review WCAG compliance'}`
            });
        }

        // Performance recommendations
        if (latest.performance) {
            if (latest.performance.resourceSize > 2000000) {
                recommendations.push({
                    category: 'Performance',
                    priority: 'Medium',
                    message: 'Page resource size exceeds 2MB. Consider lazy loading and code splitting.'
                });
            }
            if (latest.performance.cacheHitRatio < 0.5) {
                recommendations.push({
                    category: 'Performance',
                    priority: 'Low',
                    message: 'Cache hit ratio is low. Review caching headers and service worker strategy.'
                });
            }
        }

        // Trend-based recommendations
        if (trends.performance?.direction === 'declining') {
            recommendations.push({
                category: 'Monitoring',
                priority: 'Medium',
                message: `Performance score declining (${trends.performance.change} points). Investigate recent changes.`
            });
        }

        return recommendations;
    }

    async run() {
        try {
            console.log('🔍 Quality Monitor with Cleanup Starting...\n');

            // First, perform cleanup if needed
            await this.performCleanup();

            // Generate report
            const report = await this.generateReport();
            
            if (report) {
                console.log('\n📊 Quality Report Generated:');
                console.log(`  - Overall Score: ${report.overview.overallScore}/100`);
                console.log(`  - Measurements: ${report.overview.measurementCount}`);
                console.log(`  - Duration: ${report.overview.monitoringDuration}`);
                
                if (report.recommendations && report.recommendations.length > 0) {
                    console.log('\n💡 Recommendations:');
                    report.recommendations.forEach(rec => {
                        console.log(`  - [${rec.priority}] ${rec.category}: ${rec.message}`);
                    });
                }
            }

            console.log('\n✅ Quality monitoring and cleanup complete!');
            return { success: true, report };

        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Auto-run if executed directly
const monitor = new QualityMonitorWithCleanup();
monitor.run().then(result => {
    process.exit(result.success ? 0 : 1);
});

export default QualityMonitorWithCleanup;