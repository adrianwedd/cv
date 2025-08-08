#!/usr/bin/env node

/**
 * Dashboard Console Check - Test career intelligence dashboard
 */

import puppeteer from 'puppeteer';

async function checkDashboardRendering() {
  console.log('📊 Checking career intelligence dashboard...\n');
  
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
    console.log('📊 Loading career intelligence dashboard...');
    await page.goto('http://localhost:8000/career-intelligence.html', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Dashboard page loaded successfully');
    
    // Check page title
    const title = await page.title();
    console.log('📋 Page title:', title);
    
    // Check if dashboard elements are present
    const hasContainer = await page.$('.dashboard-container') !== null;
    const hasCharts = await page.$('#skillsChart') !== null;
    const hasMetrics = await page.$('.metric-card') !== null;
    
    console.log('🔍 Dashboard structure:');
    console.log('  Container:', hasContainer ? '✅' : '❌');
    console.log('  Charts:', hasCharts ? '✅' : '❌');
    console.log('  Metrics:', hasMetrics ? '✅' : '❌');
    
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
      console.log('\n🚨 DASHBOARD ERRORS:');
      errors.forEach((error, i) => {
        console.log('  ' + (i + 1) + '. ' + error);
      });
    } else {
      console.log('\n✅ NO DASHBOARD ERRORS - Clean console!');
    }
    
  } catch (error) {
    console.error('❌ Error during dashboard testing:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔚 Dashboard testing complete');
  }
}

checkDashboardRendering().catch(console.error);