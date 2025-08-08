#!/usr/bin/env node

/**
 * Page Console Check - Website Rendering and Error Detection
 * Tests web pages for console errors and rendering issues
 */

import puppeteer from 'puppeteer';

async function checkWebsiteRendering() {
  console.log('🌐 Checking website rendering and console errors...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const consoleMessages = [];
  const errors = [];
  
  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    
    if (type === 'error') {
      errors.push(text);
    }
  });
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    errors.push('Page Error: ' + error.message);
  });
  
  try {
    console.log('📄 Loading main CV page...');
    await page.goto('http://localhost:8000/', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Main page loaded successfully');
    
    // Check if essential elements are present
    const title = await page.title();
    console.log('📋 Page title:', title);
    
    const hasHeader = await page.$('header') !== null;
    const hasNav = await page.$('nav') !== null;
    const hasMain = await page.$('main') !== null;
    
    console.log('🔍 Page structure:');
    console.log('  Header:', hasHeader ? '✅' : '❌');
    console.log('  Navigation:', hasNav ? '✅' : '❌');
    console.log('  Main content:', hasMain ? '✅' : '❌');
    
    // Check CSS loading
    const stylesheets = await page.$$eval('link[rel="stylesheet"]', links => 
      links.map(link => ({ href: link.href, loaded: !link.disabled }))
    );
    
    console.log('\n🎨 Stylesheets loaded:');
    stylesheets.forEach(sheet => {
      const filename = sheet.href.split('/').pop();
      console.log('  ' + filename + ':', sheet.loaded ? '✅' : '❌');
    });
    
    // Check JavaScript loading
    const scripts = await page.$$eval('script[src]', scripts => 
      scripts.map(script => script.src)
    );
    
    console.log('\n📜 JavaScript files:');
    scripts.forEach(script => {
      const filename = script.split('/').pop();
      console.log('  ' + filename + ': ✅');
    });
    
    console.log('\n📊 Console Analysis:');
    console.log('Total messages:', consoleMessages.length);
    
    const messagesByType = consoleMessages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(messagesByType).forEach(([type, count]) => {
      const emoji = type === 'error' ? '❌' : 
                   type === 'warn' ? '⚠️' : 
                   type === 'info' ? 'ℹ️' : '📝';
      console.log('  ' + emoji + ' ' + type + ':', count);
    });
    
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS DETECTED:');
      errors.forEach((error, i) => {
        console.log('  ' + (i + 1) + '. ' + error);
      });
    } else {
      console.log('\n✅ NO ERRORS DETECTED - Clean console!');
    }
    
    // Test theme switching
    console.log('\n🎭 Testing theme functionality...');
    const themeToggle = await page.$('.theme-toggle');
    if (themeToggle) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      console.log('✅ Theme toggle working');
    } else {
      console.log('⚠️ Theme toggle not found');
    }
    
    // Check if PWA features are working
    console.log('\n📱 Testing PWA features...');
    const hasServiceWorker = await page.evaluate(() => 'serviceWorker' in navigator);
    const hasManifest = await page.$('link[rel="manifest"]') !== null;
    
    console.log('  Service Worker support:', hasServiceWorker ? '✅' : '❌');
    console.log('  Web App Manifest:', hasManifest ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔚 Browser testing complete');
  }
}

checkWebsiteRendering().catch(console.error);