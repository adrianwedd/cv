#!/usr/bin/env node

/**
 * Security Sanitizer Script
 * Removes exposed API keys and secrets from data files
 */

const fs = require('fs');
const path = require('path');

const EXPOSED_SECRETS = [
  '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',
  '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'
];

// Files to sanitize
const FILES_TO_SANITIZE = [
  '../../data/watch-me-work-data.json',
  '../../data/watch-me-work-data-full-2025-08-02T09-08-15-532Z.json'
];

function sanitizeSecret(content, secret) {
  const maskedSecret = `[REDACTED-${secret.substring(0, 8)}]`;
  return content.replace(new RegExp(secret, 'g'), maskedSecret);
}

function sanitizeFile(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ File not found: ${fullPath}`);
      return;
    }

    console.log(`🔒 Sanitizing secrets in: ${filePath}`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let sanitized = false;

    EXPOSED_SECRETS.forEach(secret => {
      if (content.includes(secret)) {
        console.log(`  🚨 Found exposed secret: ${secret.substring(0, 8)}...`);
        content = sanitizeSecret(content, secret);
        sanitized = true;
      }
    });

    if (sanitized) {
      // Create backup
      const backupPath = `${fullPath}.backup`;
      fs.writeFileSync(backupPath, fs.readFileSync(fullPath));
      console.log(`  💾 Created backup: ${backupPath}`);

      // Write sanitized content
      fs.writeFileSync(fullPath, content);
      console.log(`  ✅ Sanitized and saved: ${filePath}`);
    } else {
      console.log(`  ✅ No secrets found in: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error sanitizing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔒 Security Sanitizer - Removing Exposed API Keys');
  console.log('================================================\n');

  FILES_TO_SANITIZE.forEach(sanitizeFile);

  console.log('\n🔒 Security Sanitization Complete');
  console.log('⚠️  Next steps:');
  console.log('  1. Revoke exposed API keys from LangSmith console');
  console.log('  2. Verify no secrets remain in repository');
  console.log('  3. Add stronger secret detection to CI/CD');
}

if (require.main === module) {
  main();
}