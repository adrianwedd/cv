#!/usr/bin/env node

/**
 * Quality History Archiver
 * Intelligently archives quality history data to prevent performance degradation
 * while preserving essential metrics for trend analysis
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QualityHistoryArchiver {
    constructor() {
        this.historyFile = path.join(process.cwd(), 'quality-history.json');
        this.archiveDir = path.join(process.cwd(), 'data', 'archives', 'quality');
        this.maxRecentEntries = 5; // Keep last 5 entries for trend analysis
        this.archiveThreshold = 10; // Archive when more than 10 entries
    }

    async init() {
        // Ensure archive directory exists
        await fs.mkdir(this.archiveDir, { recursive: true });
    }

    async loadHistory() {
        try {
            const content = await fs.readFile(this.historyFile, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.log('No quality history file found or error reading:', error.message);
            return [];
        }
    }

    async archiveOldData(history) {
        if (history.length <= this.archiveThreshold) {
            console.log(`History has ${history.length} entries, below threshold of ${this.archiveThreshold}. No archival needed.`);
            return { archived: false, entriesArchived: 0 };
        }

        // Calculate how many entries to archive
        const entriesToArchive = history.length - this.maxRecentEntries;
        const dataToArchive = history.slice(0, entriesToArchive);
        const dataToKeep = history.slice(entriesToArchive);

        // Create archive filename with timestamp range
        const firstTimestamp = new Date(dataToArchive[0].timestamp);
        const lastTimestamp = new Date(dataToArchive[dataToArchive.length - 1].timestamp);
        const archiveFilename = `quality-history-${firstTimestamp.toISOString().split('T')[0]}-to-${lastTimestamp.toISOString().split('T')[0]}.json`;
        const archivePath = path.join(this.archiveDir, archiveFilename);

        // Check if archive already exists and merge if needed
        let existingArchive = [];
        try {
            const existingContent = await fs.readFile(archivePath, 'utf-8');
            existingArchive = JSON.parse(existingContent);
            console.log(`Merging with existing archive: ${archiveFilename}`);
        } catch (error) {
            // Archive doesn't exist, which is fine
        }

        // Merge and deduplicate based on timestamp
        const mergedArchive = this.deduplicateByTimestamp([...existingArchive, ...dataToArchive]);
        
        // Save archived data
        await fs.writeFile(
            archivePath,
            JSON.stringify(mergedArchive, null, 2),
            'utf-8'
        );

        // Update the main history file with only recent data
        await fs.writeFile(
            this.historyFile,
            JSON.stringify(dataToKeep, null, 2),
            'utf-8'
        );

        console.log(`✅ Archived ${dataToArchive.length} entries to ${archiveFilename}`);
        console.log(`✅ Kept ${dataToKeep.length} recent entries in quality-history.json`);

        return {
            archived: true,
            entriesArchived: dataToArchive.length,
            entriesKept: dataToKeep.length,
            archiveFile: archiveFilename
        };
    }

    deduplicateByTimestamp(entries) {
        const seen = new Set();
        return entries.filter(entry => {
            const timestamp = entry.timestamp;
            if (seen.has(timestamp)) {
                return false;
            }
            seen.add(timestamp);
            return true;
        });
    }

    async generateArchiveSummary() {
        // List all archive files
        const files = await fs.readdir(this.archiveDir);
        const archiveFiles = files.filter(f => f.startsWith('quality-history-') && f.endsWith('.json'));
        
        const summary = {
            generated: new Date().toISOString(),
            archiveCount: archiveFiles.length,
            archives: []
        };

        for (const file of archiveFiles) {
            const filePath = path.join(this.archiveDir, file);
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            
            summary.archives.push({
                filename: file,
                size: `${(stats.size / 1024).toFixed(2)} KB`,
                entries: data.length,
                dateRange: {
                    from: data[0]?.timestamp,
                    to: data[data.length - 1]?.timestamp
                }
            });
        }

        // Save summary
        const summaryPath = path.join(this.archiveDir, 'archive-summary.json');
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
        
        return summary;
    }

    async cleanupDuplicates() {
        // Load current history
        const history = await this.loadHistory();
        
        // Deduplicate
        const deduped = this.deduplicateByTimestamp(history);
        
        if (deduped.length < history.length) {
            await fs.writeFile(
                this.historyFile,
                JSON.stringify(deduped, null, 2),
                'utf-8'
            );
            console.log(`✅ Removed ${history.length - deduped.length} duplicate entries`);
            return { duplicatesRemoved: history.length - deduped.length };
        }
        
        console.log('No duplicate entries found');
        return { duplicatesRemoved: 0 };
    }

    async getStats() {
        const history = await this.loadHistory();
        const historyStats = await fs.stat(this.historyFile);
        
        // Calculate time range
        let timeRange = null;
        if (history.length > 0) {
            const firstTime = new Date(history[0].timestamp);
            const lastTime = new Date(history[history.length - 1].timestamp);
            const durationMs = lastTime - firstTime;
            const durationMinutes = Math.round(durationMs / 1000 / 60);
            
            timeRange = {
                from: firstTime.toISOString(),
                to: lastTime.toISOString(),
                durationMinutes
            };
        }

        return {
            entries: history.length,
            fileSize: `${(historyStats.size / 1024).toFixed(2)} KB`,
            averageEntrySize: history.length > 0 ? 
                `${(historyStats.size / history.length).toFixed(0)} bytes` : 'N/A',
            timeRange,
            needsArchival: history.length > this.archiveThreshold
        };
    }

    async run() {
        try {
            console.log('🔧 Quality History Archiver Starting...\n');
            
            await this.init();
            
            // Get initial stats
            const beforeStats = await this.getStats();
            console.log('📊 Current Status:');
            console.log(`  - Entries: ${beforeStats.entries}`);
            console.log(`  - File Size: ${beforeStats.fileSize}`);
            console.log(`  - Needs Archival: ${beforeStats.needsArchival ? 'Yes' : 'No'}\n`);

            // Clean duplicates first
            const cleanupResult = await this.cleanupDuplicates();
            
            // Load cleaned history
            const history = await this.loadHistory();
            
            // Archive if needed
            const archiveResult = await this.archiveOldData(history);
            
            if (archiveResult.archived) {
                // Generate archive summary
                const summary = await this.generateArchiveSummary();
                console.log(`\n📁 Archive Summary:`);
                console.log(`  - Total Archives: ${summary.archiveCount}`);
                console.log(`  - Latest Archive: ${archiveResult.archiveFile}`);
            }

            // Get final stats
            const afterStats = await this.getStats();
            console.log('\n✨ Final Status:');
            console.log(`  - Entries: ${afterStats.entries}`);
            console.log(`  - File Size: ${afterStats.fileSize}`);
            
            // Calculate savings
            if (archiveResult.archived) {
                const beforeSize = parseFloat(beforeStats.fileSize);
                const afterSize = parseFloat(afterStats.fileSize);
                const savings = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
                console.log(`  - Size Reduction: ${savings}%`);
            }

            console.log('\n✅ Quality History Archival Complete!');
            
            return {
                success: true,
                beforeStats,
                afterStats,
                archiveResult,
                cleanupResult
            };
            
        } catch (error) {
            console.error('❌ Error during archival:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Auto-run if executed directly
const archiver = new QualityHistoryArchiver();
archiver.run().then(result => {
    process.exit(result.success ? 0 : 1);
});

export default QualityHistoryArchiver;