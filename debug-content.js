const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    const contentDebug = await page.evaluate(() => {
        return {
            // Check main content containers
            mainContent: {
                exists: !!document.querySelector('main'),
                height: document.querySelector('main')?.offsetHeight || 0,
                display: document.querySelector('main') ? window.getComputedStyle(document.querySelector('main')).display : 'not found'
            },
            
            // Check sections
            sections: Array.from(document.querySelectorAll('.section')).map((section, i) => ({
                id: section.id,
                height: section.offsetHeight,
                display: window.getComputedStyle(section).display,
                innerHTML: section.innerHTML.substring(0, 100) + '...'
            })),
            
            // Check about section specifically
            aboutSection: {
                exists: !!document.querySelector('#about'),
                height: document.querySelector('#about')?.offsetHeight || 0,
                display: document.querySelector('#about') ? window.getComputedStyle(document.querySelector('#about')).display : 'not found',
                classList: document.querySelector('#about')?.className || 'not found',
                content: document.querySelector('#about')?.innerHTML.substring(0, 200) || 'no content'
            },
            
            // Check container
            container: {
                exists: !!document.querySelector('.container'),
                height: document.querySelector('.container')?.offsetHeight || 0,
                display: document.querySelector('.container') ? window.getComputedStyle(document.querySelector('.container')).display : 'not found'
            },
            
            // Check if CVApp initialized content
            cvAppData: {
                exists: typeof window.cvApp !== 'undefined',
                cvData: window.cvApp ? !!window.cvApp.cvData : false,
                initialized: window.cvApp ? !window.cvApp.isLoading : false
            }
        };
    });
    
    
    );
    
    await browser.close();
})();