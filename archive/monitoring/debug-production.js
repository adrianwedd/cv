// Debug script to test production site
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => ));
    page.on('error', err => console.error('PAGE ERROR:', err.message));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
    
    
    await page.goto('https://adrianwedd.github.io/cv/', { waitUntil: 'networkidle2' });
    
    // Check if dark theme is applied
    const theme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
    });
    
    // Get computed styles
    const styles = await page.evaluate(() => {
        const body = document.body;
        const computed = window.getComputedStyle(body);
        return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            dataTheme: document.documentElement.getAttribute('data-theme'),
            htmlClasses: document.documentElement.className,
            bodyClasses: body.className,
            cvAppExists: typeof window.cvApp !== 'undefined',
            loadingScreenHidden: document.querySelector('.loading-screen')?.classList.contains('hidden')
        };
    });
    
    
    
    
    
    
    
    
    // Check for JavaScript errors
    const jsErrors = await page.evaluate(() => {
        try {
            if (window.cvApp) {
                return {
                    hasApp: true,
                    theme: window.cvApp.themePreference,
                    isLoading: window.cvApp.isLoading
                };
            }
            return { hasApp: false };
        } catch (e) {
            return { error: e.message };
        }
    });
    
    
    
    await browser.close();
})();