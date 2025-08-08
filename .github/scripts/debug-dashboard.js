#!/usr/bin/env node

/**
 * Debug Dashboard Loading Issues
 */

import puppeteer from 'puppeteer';

async function debugDashboard() {
  console.log('🔍 Debugging career intelligence dashboard...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console messages with more detail
  page.on('console', async msg => {
    const type = msg.type();
    const text = msg.text();
    const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
    
    console.log(`[${type.toUpperCase()}]:`, text);
    if (args.length > 0) {
      console.log('Args:', args);
    }
  });
  
  // Capture page errors with stack traces
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
    console.log('Stack:', error.stack);
  });
  
  // Track network requests
  let networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType()
    });
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[NETWORK ERROR]: ${response.status()} - ${response.url()}`);
    }
  });
  
  try {
    console.log('📊 Loading dashboard with detailed logging...');
    
    // Start local server first
    const { spawn } = await import('child_process');
    const server = spawn('python', ['-m', 'http.server', '8001'], {
      cwd: '/Users/adrian/repos/cv',
      stdio: 'pipe'
    });
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.goto('http://localhost:8001/career-intelligence.html', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    console.log('\n🌐 Network Requests:');
    networkRequests.forEach(req => {
      console.log(`  ${req.method} ${req.type}: ${req.url}`);
    });
    
    // Check for dashboard-specific elements
    console.log('\n🔍 Dashboard Elements Check:');
    
    const checks = [
      { selector: '.dashboard-main', name: 'Main Dashboard Container' },
      { selector: '#skillsChart', name: 'Skills Chart Canvas' },
      { selector: '.metric-card', name: 'Metric Cards' },
      { selector: '.dashboard-container', name: 'Dashboard Container' }
    ];
    
    for (const check of checks) {
      const element = await page.$(check.selector);
      console.log(`  ${check.name}: ${element ? '✅' : '❌'}`);
    }
    
    // Wait a bit more to see if errors appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    server.kill('SIGTERM');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugDashboard().catch(console.error);