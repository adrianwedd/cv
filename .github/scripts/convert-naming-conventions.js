#!/usr/bin/env node

/**
 * Naming Convention Converter
 * 
 * Converts JSON files from snake_case to camelCase keys as part of Issue #112
 * standardization effort. Handles nested objects and arrays while preserving
 * data integrity.
 * 
 * Usage: node convert-naming-conventions.js [--dry-run] [file1.json] [file2.json]
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Convert snake_case string to camelCase
 */
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Recursively convert object keys from snake_case to camelCase
 */
function convertObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => convertObjectKeys(item));
    }
    
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = snakeToCamel(key);
        converted[camelKey] = convertObjectKeys(value);
    }
    
    return converted;
}

/**
 * Convert a single JSON file
 */
async function convertJSONFile(filePath, dryRun = false) {
    try {
        console.log(`🔄 Processing: ${filePath}`);
        
        // Read file
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Convert keys
        const converted = convertObjectKeys(data);
        
        // Count changes
        const originalStr = JSON.stringify(data);
        const convertedStr = JSON.stringify(converted);
        const snakeMatches = originalStr.match(/"[a-z_]+_[a-z_]*":/g) || [];
        const changesCount = snakeMatches.length;
        
        if (changesCount === 0) {
            console.log(`  ✅ No snake_case keys found - already compliant`);
            return;
        }
        
        console.log(`  📊 Found ${changesCount} snake_case keys to convert`);
        
        if (dryRun) {
            console.log(`  🔍 DRY RUN - Would convert:`);
            snakeMatches.slice(0, 5).forEach(match => {
                const key = match.replace(/[":]/g, '');
                console.log(`    ${key} → ${snakeToCamel(key)}`);
            });
            if (snakeMatches.length > 5) {
                console.log(`    ... and ${snakeMatches.length - 5} more`);
            }
        } else {
            // Create backup
            const backupPath = filePath + '.backup';
            await fs.copyFile(filePath, backupPath);
            console.log(`  💾 Backup created: ${backupPath}`);
            
            // Write converted file
            const convertedJson = JSON.stringify(converted, null, 2);
            await fs.writeFile(filePath, convertedJson, 'utf8');
            console.log(`  ✅ Converted and saved: ${filePath}`);
        }
        
    } catch (error) {
        console.error(`  ❌ Failed to process ${filePath}:`, error.message);
    }
}

/**
 * Main execution function
 */
async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const files = args.filter(arg => !arg.startsWith('--'));
    
    console.log('🔧 **NAMING CONVENTION CONVERTER**');
    console.log('Converting snake_case JSON keys to camelCase');
    
    if (dryRun) {
        console.log('🔍 **DRY RUN MODE** - No files will be modified');
    }
    
    console.log('');
    
    // Default files if none specified
    const targetFiles = files.length > 0 ? files : [
        '../../data/activity-summary.json',
        '../../data/base-cv.json',
        '../../data/ai-enhancements.json'
    ];
    
    console.log(`📁 Target files (${targetFiles.length}):`);
    targetFiles.forEach(file => console.log(`  - ${file}`));
    console.log('');
    
    // Process each file
    for (const file of targetFiles) {
        const fullPath = path.resolve(__dirname, file);
        
        try {
            await fs.access(fullPath);
            await convertJSONFile(fullPath, dryRun);
        } catch (error) {
            console.log(`  ⚠️ Skipping ${file} - File not found`);
        }
        
        console.log('');
    }
    
    if (!dryRun) {
        console.log('✅ **CONVERSION COMPLETE**');
        console.log('');
        console.log('🔧 **Next Steps:**');
        console.log('1. Update JavaScript code to use camelCase property access');
        console.log('2. Test all functionality with converted data structures');
        console.log('3. Remove .backup files after verification');
        console.log('4. Update documentation with new structure examples');
    } else {
        console.log('🔍 **DRY RUN COMPLETE**');
        console.log('');
        console.log('🚀 **To apply changes, run:**');
        console.log('node convert-naming-conventions.js');
    }
}

// Export for testing
module.exports = { convertObjectKeys, snakeToCamel };

// Execute if called directly
if (require.main === module) {
    main().catch(console.error);
}