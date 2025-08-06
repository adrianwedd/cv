#!/usr/bin/env node

import { execSync } from 'child_process';

const content = execSync('curl -s https://adrianwedd.github.io/cv', { encoding: 'utf8' });

console.log('=== DEBUGGING VERIFIER PATTERNS ===');
console.log('');

// Test meta description
const metaDescPattern = /<meta[^>]*name=["']description["']/;
const metaDescResult = metaDescPattern.test(content);
console.log('Meta description pattern test:', metaDescResult);
console.log('Meta description includes test:', content.includes('name="description"'));

// Test canonical URL  
const canonicalPattern = /<link[^>]*rel=["']canonical["']/;
const canonicalResult = canonicalPattern.test(content);
console.log('Canonical URL pattern test:', canonicalResult);
console.log('Canonical URL includes test:', content.includes('rel="canonical"'));

// Test viewport
const viewportPattern = /<meta[^>]*name=["']viewport["']/;
const viewportResult = viewportPattern.test(content);
console.log('Viewport pattern test:', viewportResult);
console.log('Viewport includes test:', content.includes('name="viewport"'));

// Test security headers
console.log('Security headers test:', content.includes('X-Content-Type-Options'));
console.log('CSP test:', content.includes('Content-Security-Policy'));

// Test structured data
console.log('Structured data test:', content.includes('application/ld+json'));

console.log('');
console.log('=== SAMPLE CONTENT SNIPPETS ===');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('name="description"') || line.includes('rel="canonical"') || line.includes('name="viewport"')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});