const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { waitUntil: 'networkidle2' });
    
    const visibility = await page.evaluate(() => {
        // Check all major content containers
        const containers = [
            '.container',
            '.header',
            '.nav-container',
            '.content',
            'main',
            '#about',
            '.section'
        ];
        
        const results = {};
        
        containers.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                const styles = window.getComputedStyle(el);
                results[selector] = {
                    exists: true,
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    height: el.offsetHeight,
                    hasContent: el.innerText?.length > 0
                };
            } else {
                results[selector] = { exists: false };
            }
        });
        
        // Check if ANY content is visible
        const anyVisible = document.body.innerText.includes('Adrian Wedd');
        
        return {
            containers: results,
            bodyText: document.body.innerText.substring(0, 200),
            anyVisible,
            totalHeight: document.body.scrollHeight
        };
    });
    
    
    Object.entries(visibility.containers).forEach(([selector, status]) => {
        if (status.exists) {
            
        }
    });
    
    
    
    
    
    await browser.close();
})();