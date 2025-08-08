const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const errors = [];
    const consoleMessages = [];
    
    page.on('error', error => {
        errors.push(`Page error: ${error.message}`);
    });
    
    page.on('pageerror', error => {
        errors.push(`Page script error: ${error.message}`);
    });
    
    page.on('console', msg => {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    page.on('response', response => {
        if (!response.ok() && response.url().includes('script')) {
            errors.push(`Script load error: ${response.status()} ${response.url()}`);
        }
    });
    
    console.log('Loading page and checking for JS errors...\n');
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('=== ERRORS ===');
    if (errors.length > 0) {
        errors.forEach(error => console.log('❌', error));
    } else {
        console.log('✅ No JavaScript errors detected');
    }
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
        if (msg.includes('error') || msg.includes('Error') || msg.includes('failed')) {
            console.log('🔥', msg);
        } else if (msg.includes('warn')) {
            console.log('⚠️', msg);
        } else {
            console.log('📝', msg);
        }
    });
    
    console.log('\n=== SCRIPT LOADING CHECK ===');
    const scriptCheck = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return {
            scripts: scripts.map(s => ({
                src: s.src,
                loaded: s.readyState === 'complete' || s.readyState === 'loaded'
            })),
            cvAppInWindow: 'CVApplication' in window,
            configInWindow: 'CONFIG' in window,
            domContentLoaded: document.readyState
        };
    });
    
    console.log('Scripts:', scriptCheck.scripts);
    console.log('CVApplication in window:', scriptCheck.cvAppInWindow);
    console.log('CONFIG in window:', scriptCheck.configInWindow);
    console.log('DOM ready state:', scriptCheck.domContentLoaded);
    
    await browser.close();
})();