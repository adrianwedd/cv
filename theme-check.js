const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const themeStatus = await page.evaluate(() => {
        return {
            dataTheme: document.documentElement.getAttribute('data-theme'),
            htmlAttributes: Array.from(document.documentElement.attributes).map(attr => 
                ({name: attr.name, value: attr.value})
            ),
            bodyBg: window.getComputedStyle(document.body).backgroundColor,
            cssCustomProperties: {
                colorBackground: window.getComputedStyle(document.body).getPropertyValue('--color-background'),
                colorText: window.getComputedStyle(document.body).getPropertyValue('--color-text-primary')
            },
            cvAppExists: typeof window.cvApp !== 'undefined',
            cvAppTheme: window.cvApp ? window.cvApp.themePreference : 'not available'
        };
    });
    
    
    
    
    
    
    
    
    
    // Check if dark styles are actually being applied
    const darkModeCheck = await page.evaluate(() => {
        // Check if CSS has dark theme rules
        let hasDarkThemeCSS = false;
        for (let sheet of document.styleSheets) {
            try {
                for (let rule of sheet.cssRules) {
                    if (rule.cssText && rule.cssText.includes('[data-theme=dark]')) {
                        hasDarkThemeCSS = true;
                        break;
                    }
                }
            } catch (e) {
                // Skip CORS protected stylesheets
            }
            if (hasDarkThemeCSS) break;
        }
        
        return {
            hasDarkThemeCSS,
            bodyComputedStyles: {
                backgroundColor: window.getComputedStyle(document.body).backgroundColor,
                color: window.getComputedStyle(document.body).color
            }
        };
    });
    
    
    
    await browser.close();
})();