const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { waitUntil: 'networkidle2' });
    
    const navStatus = await page.evaluate(() => {
        const nav = document.querySelector('.navigation') || document.querySelector('nav');
        const navItems = document.querySelectorAll('.nav-item');
        
        if (!nav) return { error: 'No navigation element found' };
        
        const styles = window.getComputedStyle(nav);
        
        return {
            navigation: {
                exists: true,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                position: styles.position,
                height: nav.offsetHeight,
                width: nav.offsetWidth,
                backgroundColor: styles.backgroundColor,
                zIndex: styles.zIndex
            },
            navItems: {
                count: navItems.length,
                firstItem: navItems[0] ? {
                    text: navItems[0].innerText,
                    display: window.getComputedStyle(navItems[0]).display,
                    visibility: window.getComputedStyle(navItems[0]).visibility,
                    color: window.getComputedStyle(navItems[0]).color
                } : null
            },
            navContainer: document.querySelector('.nav-items') ? {
                display: window.getComputedStyle(document.querySelector('.nav-items')).display,
                height: document.querySelector('.nav-items').offsetHeight
            } : null
        };
    });
    
    console.log('Navigation Status:', JSON.stringify(navStatus, null, 2));
    
    await browser.close();
})();