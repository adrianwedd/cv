const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('🔍 Final Production Check...\n');
    
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
    
    console.log('✅ Dark Mode:', results.darkMode.active ? 'YES ✓' : 'NO ✗');
    console.log('✅ Loading Hidden:', results.loadingScreen.hidden ? 'YES ✓' : 'NO ✗');
    console.log('✅ Navigation Visible:', results.navigation.visible ? 'YES ✓' : 'NO ✗');
    console.log('✅ Navigation Height:', results.navigation.height + 'px');
    console.log('✅ Navigation Items:', results.navigation.itemCount);
    
    if (results.navigation.items.length > 0) {
        console.log('\nNavigation Items:');
        results.navigation.items.forEach(item => {
            console.log(`  - ${item.text}: ${item.visible ? '✓' : '✗'} (${item.color})`);
        });
    }
    
    console.log('\n' + '='.repeat(40));
    console.log(allGood ? '🎉 SITE IS FIXED!' : '⚠️ ISSUES REMAIN');
    
    await browser.close();
})();