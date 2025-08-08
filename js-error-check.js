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
    
    
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    
    if (errors.length > 0) {
        errors.forEach(error => );
    } else {
        
    }
    
    
    consoleMessages.forEach(msg => {
        if (msg.includes('error') || msg.includes('Error') || msg.includes('failed')) {
            
        } else if (msg.includes('warn')) {
            
        } else {
            
        }
    });
    
    
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
    
    
    
    
    
    
    await browser.close();
})();