#!/usr/bin/env node

/**
 * Quality Cleanup Integration
 * Simple script to be called after quality measurements to maintain data hygiene
 */

import QualityHistoryArchiver from './quality-history-archiver.js';

async function performQualityCleanup() {
    const archiver = new QualityHistoryArchiver();
    
    console.log('🧹 Checking quality history for cleanup needs...');
    
    try {
        // Initialize archiver
        await archiver.init();
        
        // Get current stats
        const stats = await archiver.getStats();
        console.log(`📊 Current: ${stats.entries} entries, ${stats.fileSize}`);
        
        if (stats.needsArchival) {
            console.log('📦 Archival needed, starting cleanup...');
            
            // Clean duplicates
            const cleanupResult = await archiver.cleanupDuplicates();
            
            // Load history
            const history = await archiver.loadHistory();
            
            // Archive old data
            const archiveResult = await archiver.archiveOldData(history);
            
            if (archiveResult.archived) {
                console.log(`✅ Archived ${archiveResult.entriesArchived} entries`);
                console.log(`📊 Kept ${archiveResult.entriesKept} recent entries`);
                
                // Get final stats
                const finalStats = await archiver.getStats();
                console.log(`💾 Final size: ${finalStats.fileSize}`);
            }
        } else {
            console.log('✅ No cleanup needed');
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('⚠️ Cleanup failed (non-critical):', error.message);
        // Don't fail the overall process
        return { success: false, error: error.message };
    }
}

// Run cleanup
performQualityCleanup().then(result => {
    process.exit(0); // Always exit successfully - cleanup is non-critical
});

export default performQualityCleanup;