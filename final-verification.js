const puppeteer = require('puppeteer');

(async () => {
    console.log('🔍 Final Verification of Critical Fixes\n');
    console.log('=======================================');
    
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
    
    console.log('📝 NAME DISPLAY:');
    console.log('================');
    console.log(`Font Size: ${verification.nameDisplay.fontSize}`);
    console.log(`Height: ${verification.nameDisplay.height}px`);
    console.log(`Visible: ${verification.nameDisplay.isVisible ? '✅' : '❌'}`);
    console.log(`Fully Visible: ${verification.nameDisplay.isFullyVisible ? '✅' : '❌'}`);
    console.log(`Position: Top=${verification.nameDisplay.rect.top}, Height=${verification.nameDisplay.rect.height}`);
    
    console.log('\n📐 HEADER FIXES:');
    console.log('================');
    console.log(`Height: ${verification.headerFixes.height}px`);
    console.log(`Min Height OK: ${verification.headerFixes.hasMinHeight ? '✅' : '❌'}`);
    console.log(`Position: ${verification.headerFixes.position}`);
    console.log(`Transform: ${verification.headerFixes.transform}`);
    console.log(`No Parallax: ${verification.headerFixes.hasNoParallax ? '✅' : '❌'}`);
    
    console.log('\n💎 GLASSMORPHISM:');
    console.log('==================');
    console.log(`Section Backdrop: ${verification.glassmorphism.sectionBackdrop}`);
    console.log(`Has Blur: ${verification.glassmorphism.hasBlur ? '✅' : '❌'}`);
    console.log(`Has Saturation: ${verification.glassmorphism.hasSaturation ? '✅' : '❌'}`);
    console.log(`Stat Item Backdrop: ${verification.glassmorphism.statItemBackdrop}`);
    console.log(`Navigation Backdrop: ${verification.glassmorphism.navBackdrop}`);
    
    // Test scrolling
    console.log('\n📜 SCROLL TEST:');
    console.log('===============');
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
    
    console.log(`Header Top: ${scrollCheck.headerTop}px`);
    console.log(`Is Sticky: ${scrollCheck.isSticky ? '✅' : '❌'}`);
    console.log(`Transform on Scroll: ${scrollCheck.transform}`);
    console.log(`No Parallax on Scroll: ${scrollCheck.transform === 'none' ? '✅' : '❌'}`);
    
    // Take screenshot
    await page.screenshot({
        path: 'critical-fixes-verified.png',
        fullPage: false
    });
    
    console.log('\n📸 Screenshot saved as critical-fixes-verified.png');
    
    // Summary
    const allFixed = 
        verification.nameDisplay.isFullyVisible &&
        verification.headerFixes.hasNoParallax &&
        verification.glassmorphism.hasBlur;
    
    console.log('\n' + '='.repeat(50));
    if (allFixed) {
        console.log('🎉 ALL CRITICAL FIXES VERIFIED SUCCESSFULLY!');
        console.log('✅ Name is fully visible');
        console.log('✅ No parallax on header');
        console.log('✅ True glassmorphism with blur');
    } else {
        console.log('⚠️ Some issues may still need attention');
    }
    console.log('='.repeat(50));
    
    console.log('\n👀 Browser staying open for manual inspection...');
})();