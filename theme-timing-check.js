const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Checking theme application timing...\n');
    
    // Track theme changes over time
    let themeHistory = [];
    
    const checkTheme = async () => {
        return await page.evaluate(() => ({
            timestamp: Date.now(),
            dataTheme: document.documentElement.getAttribute('data-theme'),
            bodyBg: window.getComputedStyle(document.body).backgroundColor,
            cvAppExists: typeof window.cvApp !== 'undefined'
        }));
    };
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'domcontentloaded'
    });
    
    // Check theme every 500ms for 10 seconds
    for (let i = 0; i < 20; i++) {
        const status = await checkTheme();
        themeHistory.push(status);
        await new Promise(r => setTimeout(r, 500));
        
        // Log significant changes
        if (i > 0) {
            const prev = themeHistory[i-1];
            const curr = themeHistory[i];
            
            if (prev.dataTheme !== curr.dataTheme) {
                console.log(`🎨 Theme changed: ${prev.dataTheme} → ${curr.dataTheme} at ${i * 0.5}s`);
            }
            
            if (prev.bodyBg !== curr.bodyBg) {
                console.log(`🎨 Background changed: ${prev.bodyBg} → ${curr.bodyBg} at ${i * 0.5}s`);
            }
            
            if (prev.cvAppExists !== curr.cvAppExists) {
                console.log(`⚙️ CVApp loaded at ${i * 0.5}s`);
            }
        }
    }
    
    console.log('\n=== FINAL STATUS ===');
    const final = themeHistory[themeHistory.length - 1];
    console.log('data-theme:', final.dataTheme);
    console.log('Background:', final.bodyBg);
    console.log('CVApp exists:', final.cvAppExists);
    
    // Check if theme is being applied through CSS only
    const cssCheck = await page.evaluate(() => {
        // Check what CSS rules are being applied to body
        const bodyStyles = window.getComputedStyle(document.body);
        return {
            appliedBg: bodyStyles.backgroundColor,
            appliedColor: bodyStyles.color,
            rootStyles: window.getComputedStyle(document.documentElement),
            hasThemeAttribute: document.documentElement.hasAttribute('data-theme')
        };
    });
    
    console.log('\n=== CSS APPLICATION ===');
    console.log('Applied background:', cssCheck.appliedBg);
    console.log('Applied text color:', cssCheck.appliedColor);
    console.log('Has data-theme attribute:', cssCheck.hasThemeAttribute);
    
    await browser.close();
})();