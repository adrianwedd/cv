const puppeteer = require('puppeteer');

(async () => {
    console.log('🕵️ BRUTAL REALITY CHECK - Testing like an actual user\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,  // Show what user actually sees
        defaultViewport: null,
        args: ['--window-size=1366,768', '--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Test like a real user would
    console.log('1. Loading site with fresh cache...');
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
    });
    
    // Wait and observe like a user would
    console.log('2. Waiting 10 seconds to see what user actually sees...');
    await new Promise(r => setTimeout(r, 10000));
    
    // Take screenshot of what user actually sees
    await page.screenshot({ 
        path: 'brutal-reality-check.png',
        fullPage: true 
    });
    
    // Test actual user interactions
    console.log('3. Testing navigation clicks like a user...');
    const navItems = await page.$$('.nav-item');
    
    for (let i = 0; i < navItems.length; i++) {
        const item = navItems[i];
        const text = await item.evaluate(el => el.textContent.trim());
        console.log(`   Clicking: ${text}`);
        
        await item.click();
        await new Promise(r => setTimeout(r, 1000));
        
        // Check if anything actually happened
        const activeSection = await page.evaluate(() => {
            const activeNavItem = document.querySelector('.nav-item.active');
            const visibleSection = document.querySelector('.section.active');
            return {
                activeNav: activeNavItem ? activeNavItem.textContent.trim() : 'NONE',
                visibleSection: visibleSection ? visibleSection.id : 'NONE'
            };
        });
        
        console.log(`   Result: nav="${activeSection.activeNav}", section="${activeSection.visibleSection}"`);
    }
    
    // Check for any visual problems
    console.log('4. Checking for visual problems...');
    const visualIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check if anything is invisible when it should be visible
        const mainContent = document.querySelector('main') || document.querySelector('.main-content');
        if (!mainContent || mainContent.offsetHeight === 0) {
            issues.push('Main content not visible or has zero height');
        }
        
        // Check if navigation is actually usable
        const nav = document.querySelector('.navigation');
        if (!nav || nav.offsetHeight < 40) {
            issues.push(`Navigation too small or missing: height=${nav ? nav.offsetHeight : 'null'}px`);
        }
        
        // Check if text is readable (not too small, not invisible)
        const h1 = document.querySelector('h1');
        if (!h1 || h1.offsetHeight === 0) {
            issues.push('Main heading not visible or has zero height');
        }
        
        // Check if loading screen is actually gone
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            const styles = window.getComputedStyle(loadingScreen);
            const rect = loadingScreen.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                issues.push(`Loading screen still taking up space: ${rect.width}x${rect.height}`);
            }
        }
        
        // Check for broken images
        const images = document.querySelectorAll('img');
        images.forEach((img, i) => {
            if (!img.complete || img.naturalHeight === 0) {
                issues.push(`Image ${i} failed to load: ${img.src}`);
            }
        });
        
        // Check for any elements that might be covering content
        const body = document.body;
        const bodyRect = body.getBoundingClientRect();
        const elementAtCenter = document.elementFromPoint(bodyRect.width / 2, bodyRect.height / 2);
        
        if (elementAtCenter && elementAtCenter.classList.contains('loading-screen')) {
            issues.push('Loading screen is still covering center of page');
        }
        
        return issues;
    });
    
    console.log('5. Visual Issues Found:');
    if (visualIssues.length === 0) {
        console.log('   ✅ No visual issues detected');
    } else {
        visualIssues.forEach(issue => {
            console.log(`   ❌ ${issue}`);
        });
    }
    
    // Test responsiveness
    console.log('6. Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await new Promise(r => setTimeout(r, 2000));
    
    const mobileIssues = await page.evaluate(() => {
        const issues = [];
        const nav = document.querySelector('.navigation');
        if (nav && nav.scrollWidth > window.innerWidth + 10) {
            issues.push(`Navigation overflows on mobile: ${nav.scrollWidth}px > ${window.innerWidth}px`);
        }
        
        const sections = document.querySelectorAll('.section');
        sections.forEach((section, i) => {
            if (section.scrollWidth > window.innerWidth + 10) {
                issues.push(`Section ${i} overflows on mobile: ${section.scrollWidth}px > ${window.innerWidth}px`);
            }
        });
        
        return issues;
    });
    
    if (mobileIssues.length === 0) {
        console.log('   ✅ Mobile responsive');
    } else {
        mobileIssues.forEach(issue => {
            console.log(`   ❌ ${issue}`);
        });
    }
    
    // Final brutal assessment
    const allIssues = [...visualIssues, ...mobileIssues];
    
    console.log('\n' + '═'.repeat(50));
    console.log('           BRUTAL REALITY CHECK RESULTS');
    console.log('═'.repeat(50));
    
    if (allIssues.length === 0) {
        console.log('🎉 SITE APPEARS TO BE ACTUALLY WORKING');
        console.log('📸 Screenshot saved as brutal-reality-check.png');
    } else {
        console.log('❌ SITE HAS REAL PROBLEMS:');
        allIssues.forEach((issue, i) => {
            console.log(`${i + 1}. ${issue}`);
        });
        console.log('📸 Screenshot of problems saved as brutal-reality-check.png');
    }
    
    console.log('\n👀 Browser kept open for 10 seconds for visual inspection...');
    await new Promise(r => setTimeout(r, 10000));
    
    await browser.close();
    
    return allIssues.length === 0;
})();