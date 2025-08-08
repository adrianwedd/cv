const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
    });
    
    const results = await page.evaluate(() => {
        const nav = document.querySelector('.navigation');
        const navItems = document.querySelectorAll('.nav-item');
        const loadingScreen = document.querySelector('.loading-screen');
        
        return {
            darkMode: {
                active: document.documentElement.getAttribute('data-theme') === 'dark',
                bgColor: window.getComputedStyle(document.body).backgroundColor
            },
            loadingScreen: {
                hidden: loadingScreen ? window.getComputedStyle(loadingScreen).display === 'none' : true
            },
            navigation: {
                visible: nav ? window.getComputedStyle(nav).display !== 'none' : false,
                height: nav ? nav.offsetHeight : 0,
                itemCount: navItems.length,
                items: Array.from(navItems).map(item => ({
                    text: item.innerText.trim(),
                    color: window.getComputedStyle(item).color,
                    visible: window.getComputedStyle(item).display !== 'none'
                }))
            },
            content: {
                h1Text: document.querySelector('h1')?.innerText,
                visible: !!document.querySelector('.section')
            }
        };
    });
    
    // Check results
    const allGood = 
        results.darkMode.active &&
        results.loadingScreen.hidden &&
        results.navigation.visible &&
        results.navigation.itemCount === 5 &&
        results.content.visible;
    
    
    
    
    
    
    
    if (results.navigation.items.length > 0) {
        
        results.navigation.items.forEach(item => {
            `);
        });
    }
    
    );
    
    
    await browser.close();
})();