const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 ABSOLUTE VERIFICATION - Opening visible browser...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,  // VISIBLE browser
        defaultViewport: null,
        args: ['--window-size=1400,900']
    });
    
    const page = await browser.newPage();
    
    // Log everything
    page.on('console', msg => console.log('Console:', msg.text()));
    page.on('error', err => console.error('Error:', err));
    page.on('pageerror', err => console.error('Page Error:', err));
    
    console.log('Loading https://adrianwedd.github.io/cv/');
    console.log('You should see the site in a browser window...\n');
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
    });
    
    // Wait for any transitions
    await new Promise(r => setTimeout(r, 3000));
    
    // Take fresh screenshot
    await page.screenshot({ 
        path: 'absolute-proof.png',
        fullPage: true 
    });
    
    // Get comprehensive status
    const status = await page.evaluate(() => {
        const checks = {
            url: window.location.href,
            title: document.title,
            theme: document.documentElement.getAttribute('data-theme'),
            
            // Check loading screen
            loadingScreen: (() => {
                const ls = document.querySelector('.loading-screen');
                if (!ls) return 'NOT FOUND';
                const styles = window.getComputedStyle(ls);
                return {
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    zIndex: styles.zIndex
                };
            })(),
            
            // Check navigation
            navigation: (() => {
                const nav = document.querySelector('.navigation');
                const items = document.querySelectorAll('.nav-item');
                if (!nav) return 'NOT FOUND';
                return {
                    height: nav.offsetHeight,
                    width: nav.offsetWidth,
                    itemCount: items.length,
                    itemTexts: Array.from(items).map(i => i.innerText.trim())
                };
            })(),
            
            // Check main content
            content: {
                h1: document.querySelector('h1')?.innerText,
                bodyBgColor: window.getComputedStyle(document.body).backgroundColor,
                bodyTextColor: window.getComputedStyle(document.body).color,
                sectionsCount: document.querySelectorAll('.section').length
            },
            
            // Check if anything is blocking view
            topElement: (() => {
                const el = document.elementFromPoint(window.innerWidth/2, 100);
                return el ? {
                    tag: el.tagName,
                    class: el.className,
                    text: el.innerText?.substring(0, 50)
                } : null;
            })()
        };
        
        return checks;
    });
    
    console.log('='.repeat(50));
    console.log('COMPREHENSIVE STATUS REPORT:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(status, null, 2));
    console.log('='.repeat(50));
    
    console.log('\n📸 Screenshot saved as absolute-proof.png');
    console.log('👀 Keeping browser open for 15 seconds for visual inspection...');
    
    await new Promise(r => setTimeout(r, 15000));
    
    await browser.close();
    console.log('\n✅ Verification complete.');
})();