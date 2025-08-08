const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 ULTIMATE PRODUCTION VERIFICATION\n');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 5000));
    
    const ultimateCheck = await page.evaluate(() => {
        const checks = {
            theme: {
                attribute: document.documentElement.getAttribute('data-theme'),
                expected: 'dark',
                pass: document.documentElement.getAttribute('data-theme') === 'dark'
            },
            loadingScreen: {
                display: window.getComputedStyle(document.querySelector('.loading-screen')).display,
                visibility: window.getComputedStyle(document.querySelector('.loading-screen')).visibility,
                opacity: window.getComputedStyle(document.querySelector('.loading-screen')).opacity,
                expected: 'display:none, visibility:hidden, opacity:0',
                pass: window.getComputedStyle(document.querySelector('.loading-screen')).display === 'none' &&
                      window.getComputedStyle(document.querySelector('.loading-screen')).visibility === 'hidden' &&
                      window.getComputedStyle(document.querySelector('.loading-screen')).opacity === '0'
            },
            navigation: {
                height: document.querySelector('.navigation').offsetHeight,
                itemCount: document.querySelectorAll('.nav-item').length,
                visible: window.getComputedStyle(document.querySelector('.navigation')).display !== 'none',
                expected: 'height>50px, 5 items, visible',
                pass: document.querySelector('.navigation').offsetHeight > 50 && 
                      document.querySelectorAll('.nav-item').length === 5 &&
                      window.getComputedStyle(document.querySelector('.navigation')).display !== 'none'
            },
            content: {
                h1Text: document.querySelector('h1')?.innerText,
                sectionsCount: document.querySelectorAll('.section').length,
                bodyBg: window.getComputedStyle(document.body).backgroundColor,
                expected: 'Adrian Wedd, 5 sections, dark background',
                pass: document.querySelector('h1')?.innerText.includes('Adrian Wedd') &&
                      document.querySelectorAll('.section').length === 5 &&
                      window.getComputedStyle(document.body).backgroundColor.includes('10, 10, 10')
            },
            application: {
                cvAppExists: typeof window.cvApp !== 'undefined',
                isNotLoading: window.cvApp ? !window.cvApp.isLoading : false,
                themePreference: window.cvApp ? window.cvApp.themePreference : null,
                expected: 'cvApp exists, not loading, theme=dark',
                pass: typeof window.cvApp !== 'undefined' && 
                      window.cvApp && !window.cvApp.isLoading &&
                      window.cvApp.themePreference === 'dark'
            }
        };
        
        return checks;
    });
    
    console.log('═══════════════════════════════════════');
    console.log('           VERIFICATION RESULTS        ');
    console.log('═══════════════════════════════════════');
    
    let allPassed = true;
    
    Object.entries(ultimateCheck).forEach(([category, check]) => {
        const status = check.pass ? '✅ PASS' : '❌ FAIL';
        console.log(`\n${category.toUpperCase()}: ${status}`);
        console.log(`  Expected: ${check.expected}`);
        
        if (category === 'theme') {
            console.log(`  Actual: ${check.attribute}`);
        } else if (category === 'loadingScreen') {
            console.log(`  Actual: display:${check.display}, visibility:${check.visibility}, opacity:${check.opacity}`);
        } else if (category === 'navigation') {
            console.log(`  Actual: height:${check.height}px, items:${check.itemCount}, visible:${check.visible}`);
        } else if (category === 'content') {
            console.log(`  Actual: "${check.h1Text}", ${check.sectionsCount} sections, bg:${check.bodyBg}`);
        } else if (category === 'application') {
            console.log(`  Actual: cvApp:${check.cvAppExists}, loading:${!check.isNotLoading}, theme:${check.themePreference}`);
        }
        
        if (!check.pass) allPassed = false;
    });
    
    console.log('\n═══════════════════════════════════════');
    if (allPassed) {
        console.log('🎉 ALL VERIFICATION CHECKS PASSED!');
        console.log('🚀 PRODUCTION SITE IS PERFECT!');
    } else {
        console.log('⚠️  SOME CHECKS FAILED');
        console.log('❌ PRODUCTION SITE NEEDS MORE WORK');
    }
    console.log('═══════════════════════════════════════');
    
    await browser.close();
})();