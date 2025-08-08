#!/usr/bin/env node

/**
 * Calculate CSP hashes for inline scripts
 */

import crypto from 'crypto';
import { promises as fs } from 'fs';

async function calculateHashes() {
  console.log('🔐 Calculating CSP hashes for inline scripts...\n');
  
  try {
    const htmlContent = await fs.readFile('/Users/adrian/repos/cv/index.html', 'utf8');
    
    // Extract inline scripts (handle multiline better)
    const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
    let match;
    let scriptIndex = 1;
    const hashes = [];
    
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
      const scriptContent = match[1].trim();
      if (scriptContent) {
        const hash = crypto
          .createHash('sha256')
          .update(scriptContent, 'utf8')
          .digest('base64');
        
        console.log(`Script ${scriptIndex}:`);
        console.log(`Content (first 100 chars): ${scriptContent.substring(0, 100)}...`);
        console.log(`Hash: 'sha256-${hash}'`);
        console.log('');
        
        hashes.push(`'sha256-${hash}'`);
        scriptIndex++;
      }
    }
    
    console.log('All hashes for CSP:');
    console.log(hashes.join(' '));
    
    // Generate suggested CSP
    const csp = `script-src 'self' ${hashes.join(' ')} cdn.jsdelivr.net`;
    console.log('\nSuggested script-src CSP directive:');
    console.log(csp);
    
  } catch (error) {
    console.error('Error calculating hashes:', error.message);
  }
}

calculateHashes().catch(console.error);