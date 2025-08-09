#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function monitor() {
    try {
        const { stdout } = await execAsync('du -sk .');
        const size = parseInt(stdout.split('\t')[0]) * 1024;
        const sizeMB = (size / 1024 / 1024).toFixed(1);
        
        const { stdout: jsonCount } = await execAsync('find . -name "*.json" -type f | wc -l');
        const jsonFiles = parseInt(jsonCount.trim());
        
        const timestamp = new Date().toLocaleString();
        
        console.log(`📊 ${timestamp} | Size: ${sizeMB}MB | JSON Files: ${jsonFiles} | Target: 400MB`);
        
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
