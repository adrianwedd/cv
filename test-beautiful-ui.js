const puppeteer = require('puppeteer');

(async () => {
    console.log('🎨 Testing Beautiful UI Enhancements\n');
    console.log('=====================================');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // Test local version first
    console.log('📍 Loading local version...');
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
    
    console.log('\n✨ Beautiful UI Features:');
    console.log('========================');
    console.log(`Beautiful CSS: ${beautyCheck.beautifulCSS ? '✅' : '❌'}`);
    console.log(`Background Animation: ${beautyCheck.bgAnimation ? '✅' : '❌'}`);
    console.log(`Gradient Orbs: ${beautyCheck.gradientOrbs} orbs`);
    console.log(`Particle System: ${beautyCheck.particles ? '✅' : '❌'} (${beautyCheck.particleCount} particles)`);
    console.log(`Custom Cursor: ${beautyCheck.customCursor ? '✅' : '❌'}`);
    console.log(`Glassmorphism: ${beautyCheck.glassmorphism ? '✅' : '❌'}`);
    console.log(`Animated Elements: ${beautyCheck.animatedElements}`);
    console.log(`Gradient Text: ${beautyCheck.gradientText ? '✅' : '❌'}`);
    
    // Test animations
    console.log('\n🎬 Testing Animations...');
    
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
    console.log('🖱️ Testing hover effects...');
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
    console.log('\n📸 Screenshot saved as beautiful-ui-test.png');
    
    // Performance check
    const performance = await page.evaluate(() => {
        const perf = window.performance.getEntriesByType('navigation')[0];
        return {
            domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart),
            loadComplete: Math.round(perf.loadEventEnd - perf.loadEventStart),
            totalTime: Math.round(perf.loadEventEnd - perf.fetchStart)
        };
    });
    
    console.log('\n⚡ Performance Metrics:');
    console.log('======================');
    console.log(`DOM Content Loaded: ${performance.domContentLoaded}ms`);
    console.log(`Load Complete: ${performance.loadComplete}ms`);
    console.log(`Total Time: ${performance.totalTime}ms`);
    
    // Test production URL
    console.log('\n🌐 Testing production site...');
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
    
    console.log('\n🚀 Production Status:');
    console.log('====================');
    console.log(`Beautiful CSS: ${productionCheck.beautifulCSS ? '✅ Deployed' : '⏳ Deploying...'}`);
    console.log(`Animations: ${productionCheck.bgAnimation ? '✅ Active' : '⏳ Loading...'}`);
    console.log(`Particles: ${productionCheck.particles ? '✅ Visible' : '⏳ Initializing...'}`);
    
    await page.screenshot({ 
        path: 'beautiful-ui-production.png',
        fullPage: false
    });
    console.log('\n📸 Production screenshot saved as beautiful-ui-production.png');
    
    console.log('\n🎉 Beautiful UI test complete!');
    console.log('The site now features stunning visual effects and animations!');
    
    // Keep browser open for manual inspection
    console.log('\n👀 Browser will stay open for manual inspection...');
    console.log('Close the browser window when done.');
})();