const puppeteer = require('puppeteer');

(async () => {
    
    
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const verification = await page.evaluate(() => {
        const header = document.querySelector('.header');
        const name = document.querySelector('.name');
        const sectionContent = document.querySelector('.section-content');
        const statItem = document.querySelector('.stat-item');
        const navigation = document.querySelector('.navigation');
        
        const results = {
            nameDisplay: {
                fontSize: window.getComputedStyle(name).fontSize,
                height: name.offsetHeight,
                isVisible: name.offsetHeight > 0,
                rect: name.getBoundingClientRect(),
                isFullyVisible: (() => {
                    const nameRect = name.getBoundingClientRect();
                    const headerRect = header.getBoundingClientRect();
                    return nameRect.top >= 0 && nameRect.bottom <= window.innerHeight;
                })()
            },
            
            headerFixes: {
                height: header.offsetHeight,
                hasMinHeight: header.offsetHeight >= 150,
                position: window.getComputedStyle(header).position,
                transform: window.getComputedStyle(header).transform,
                hasNoParallax: window.getComputedStyle(header).transform === 'none'
            },
            
            glassmorphism: {
                sectionBackdrop: window.getComputedStyle(sectionContent).backdropFilter,
                sectionBackground: window.getComputedStyle(sectionContent).background,
                hasBlur: window.getComputedStyle(sectionContent).backdropFilter.includes('blur'),
                hasSaturation: window.getComputedStyle(sectionContent).backdropFilter.includes('saturate'),
                statItemBackdrop: statItem ? window.getComputedStyle(statItem).backdropFilter : 'none',
                navBackdrop: window.getComputedStyle(navigation).backdropFilter
            }
        };
        
        return results;
    });
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Test scrolling
    
    
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(r => setTimeout(r, 1000));
    
    const scrollCheck = await page.evaluate(() => {
        const header = document.querySelector('.header');
        const headerRect = header.getBoundingClientRect();
        return {
            headerTop: headerRect.top,
            isSticky: headerRect.top === 0,
            transform: window.getComputedStyle(header).transform
        };
    });
    
    
    
    
    
    
    // Take screenshot
    await page.screenshot({
        path: 'critical-fixes-verified.png',
        fullPage: false
    });
    
    
    
    // Summary
    const allFixed = 
        verification.nameDisplay.isFullyVisible &&
        verification.headerFixes.hasNoParallax &&
        verification.glassmorphism.hasBlur;
    
    );
    if (allFixed) {
        
        
        
        
    } else {
        
    }
    );
    
    
})();