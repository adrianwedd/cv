const puppeteer = require('puppeteer');

(async () => {
    
    
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // Test local version first
    
    await page.goto('file://' + __dirname + '/index.html', {
        waitUntil: 'networkidle0'
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Check for beautiful UI elements
    const beautyCheck = await page.evaluate(() => {
        const checks = {
            // Beautiful CSS loaded
            beautifulCSS: !!document.querySelector('link[href*="styles-beautiful"]'),
            
            // Background animation
            bgAnimation: !!document.querySelector('.bg-animation'),
            gradientOrbs: document.querySelectorAll('.gradient-orb').length,
            
            // Particles
            particles: !!document.querySelector('.particles'),
            particleCount: document.querySelectorAll('.particle').length,
            
            // Custom cursor
            customCursor: !!document.querySelector('.custom-cursor'),
            cursorFollower: !!document.querySelector('.cursor-follower'),
            
            // Visual effects
            glassmorphism: (() => {
                const card = document.querySelector('.section-content');
                if (!card) return false;
                const styles = window.getComputedStyle(card);
                return styles.backdropFilter && styles.backdropFilter !== 'none';
            })(),
            
            // Animations
            animatedElements: document.querySelectorAll('[class*="animate"]').length,
            
            // Enhanced styles
            gradientText: (() => {
                const name = document.querySelector('.name');
                if (!name) return false;
                const styles = window.getComputedStyle(name);
                return styles.backgroundImage && styles.backgroundImage.includes('gradient');
            })()
        };
        
        return checks;
    });
    
    
    
    
    
    
    `);
    
    
    
    
    
    // Test animations
    
    
    // Trigger scroll animations
    await page.evaluate(() => {
        window.scrollTo(0, 500);
    });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => {
        window.scrollTo(0, 1000);
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Test hover effects
    
    const button = await page.$('.contact-link');
    if (button) {
        await button.hover();
        await new Promise(r => setTimeout(r, 500));
    }
    
    // Take screenshot
    await page.screenshot({ 
        path: 'beautiful-ui-test.png',
        fullPage: false
    });
    
    
    // Performance check
    const performance = await page.evaluate(() => {
        const perf = window.performance.getEntriesByType('navigation')[0];
        return {
            domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart),
            loadComplete: Math.round(perf.loadEventEnd - perf.loadEventStart),
            totalTime: Math.round(perf.loadEventEnd - perf.fetchStart)
        };
    });
    
    
    
    
    
    
    
    // Test production URL
    
    await page.goto('https://adrianwedd.github.io/cv/', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    const productionCheck = await page.evaluate(() => {
        return {
            beautifulCSS: !!document.querySelector('link[href*="styles-beautiful"]'),
            bgAnimation: !!document.querySelector('.bg-animation'),
            particles: !!document.querySelector('.particles')
        };
    });
    
    
    
    
    
    
    
    await page.screenshot({ 
        path: 'beautiful-ui-production.png',
        fullPage: false
    });
    
    
    
    
    
    // Keep browser open for manual inspection
    
    
})();