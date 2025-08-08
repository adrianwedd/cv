const puppeteer = require('puppeteer');

(async () => {
    
    
    const browser = await puppeteer.launch({ 
        headless: false,  // Show browser
        defaultViewport: null
    });
    
    const page = await browser.newPage();
    
    // Log all console messages
    page.on('console', msg => {
        );
    });
    
    page.on('error', err => {
        console.error('Page error:', err);
    });
    
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
    });
    
    // Wait a bit for any animations
    await new Promise(r => setTimeout(r, 2000));
    
    // Take a screenshot
    await page.screenshot({ 
        path: 'live-site-screenshot.png',
        fullPage: true 
    });
    
    
    // Check what's actually visible
    const status = await page.evaluate(() => {
        const loadingScreen = document.querySelector('.loading-screen') || document.getElementById('loading-screen');
        const mainContent = document.querySelector('.main');
        
        return {
            loadingScreen: {
                exists: !!loadingScreen,
                display: loadingScreen ? window.getComputedStyle(loadingScreen).display : null,
                opacity: loadingScreen ? window.getComputedStyle(loadingScreen).opacity : null,
                visibility: loadingScreen ? window.getComputedStyle(loadingScreen).visibility : null,
                classList: loadingScreen ? Array.from(loadingScreen.classList) : [],
                innerText: loadingScreen ? loadingScreen.innerText.substring(0, 50) : null
            },
            mainContent: {
                exists: !!mainContent,
                display: mainContent ? window.getComputedStyle(mainContent).display : null,
                visibility: mainContent ? window.getComputedStyle(mainContent).visibility : null
            },
            theme: document.documentElement.getAttribute('data-theme'),
            title: document.title,
            h1Text: document.querySelector('h1')?.innerText,
            bodyBg: window.getComputedStyle(document.body).backgroundColor
        };
    });
    
    
    
    
    
    
    
    
    
    
    await new Promise(r => setTimeout(r, 10000));
    
    await browser.close();
})();