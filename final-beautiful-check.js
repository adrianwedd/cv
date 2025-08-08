const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    
    
    await page.goto('https://adrianwedd.github.io/cv/', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });
    
    // Wait for animations to load
    await new Promise(r => setTimeout(r, 5000));
    
    // Check beautiful elements
    const beautyStatus = await page.evaluate(() => {
        return {
            beautifulCSS: !!document.querySelector('link[href*="styles-beautiful"]'),
            bgAnimation: !!document.querySelector('.bg-animation'),
            gradientOrbs: document.querySelectorAll('.gradient-orb').length,
            particles: document.querySelectorAll('.particle').length,
            customCursor: !!document.querySelector('.custom-cursor'),
            glassmorphismCards: (() => {
                const cards = document.querySelectorAll('.section-content');
                return Array.from(cards).some(card => {
                    const styles = window.getComputedStyle(card);
                    return styles.backdropFilter && styles.backdropFilter !== 'none';
                });
            })(),
            gradientName: (() => {
                const name = document.querySelector('.name');
                if (!name) return false;
                const styles = window.getComputedStyle(name);
                return styles.backgroundImage.includes('gradient');
            })()
        };
    });
    
    
    
    
    
    
    
    
    
    
    
    // Take beautiful screenshot
    await page.screenshot({
        path: 'final-beautiful-ui.png',
        fullPage: false
    });
    
    
    
    
    await browser.close();
})();