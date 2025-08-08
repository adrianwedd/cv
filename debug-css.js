const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    const cssDebug = await page.evaluate(() => {
        const aboutSection = document.querySelector('#about');
        const mainContent = document.querySelector('main');
        
        return {
            aboutSection: aboutSection ? {
                visibility: window.getComputedStyle(aboutSection).visibility,
                opacity: window.getComputedStyle(aboutSection).opacity,
                color: window.getComputedStyle(aboutSection).color,
                backgroundColor: window.getComputedStyle(aboutSection).backgroundColor,
                position: window.getComputedStyle(aboutSection).position,
                zIndex: window.getComputedStyle(aboutSection).zIndex,
                transform: window.getComputedStyle(aboutSection).transform,
                display: window.getComputedStyle(aboutSection).display,
                overflow: window.getComputedStyle(aboutSection).overflow
            } : null,
            
            mainContent: mainContent ? {
                visibility: window.getComputedStyle(mainContent).visibility,
                opacity: window.getComputedStyle(mainContent).opacity,
                color: window.getComputedStyle(mainContent).color,
                backgroundColor: window.getComputedStyle(mainContent).backgroundColor,
                position: window.getComputedStyle(mainContent).position,
                transform: window.getComputedStyle(mainContent).transform,
                display: window.getComputedStyle(mainContent).display,
                height: mainContent.offsetHeight
            } : null,
            
            // Check if content is being clipped or hidden
            bodyStyles: {
                height: window.getComputedStyle(document.body).height,
                overflow: window.getComputedStyle(document.body).overflow,
                backgroundColor: window.getComputedStyle(document.body).backgroundColor
            },
            
            // Check viewport and scroll
            viewport: {
                innerHeight: window.innerHeight,
                scrollY: window.scrollY,
                scrollHeight: document.documentElement.scrollHeight
            }
        };
    });
    
    
    );
    
    await browser.close();
})();