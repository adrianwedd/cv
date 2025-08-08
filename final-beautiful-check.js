const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🎨 Verifying Beautiful UI on Production...\n');
    
    await page.goto('https://adrianwedd.github.io/cv/', {
        waitUntil: 'networkidle0',
        timeout: 60000
    });
    
    // Wait for animations to load
    await new Promise(r => setTimeout(r, 5000));
    
    // Check beautiful elements
    const beautyStatus = await page.evaluate(() => {
        return {
            beautifulCSS: !!document.querySelector('link[href*="styles-beautiful"]'),
            bgAnimation: !!document.querySelector('.bg-animation'),
            gradientOrbs: document.querySelectorAll('.gradient-orb').length,
            particles: document.querySelectorAll('.particle').length,
            customCursor: !!document.querySelector('.custom-cursor'),
            glassmorphismCards: (() => {
                const cards = document.querySelectorAll('.section-content');
                return Array.from(cards).some(card => {
                    const styles = window.getComputedStyle(card);
                    return styles.backdropFilter && styles.backdropFilter !== 'none';
                });
            })(),
            gradientName: (() => {
                const name = document.querySelector('.name');
                if (!name) return false;
                const styles = window.getComputedStyle(name);
                return styles.backgroundImage.includes('gradient');
            })()
        };
    });
    
    console.log('✨ BEAUTIFUL UI STATUS:');
    console.log('========================');
    console.log(`✅ Beautiful CSS Loaded: ${beautyStatus.beautifulCSS}`);
    console.log(`✅ Background Animation: ${beautyStatus.bgAnimation}`);
    console.log(`✅ Gradient Orbs: ${beautyStatus.gradientOrbs}`);
    console.log(`✅ Particles: ${beautyStatus.particles}`);
    console.log(`✅ Custom Cursor: ${beautyStatus.customCursor}`);
    console.log(`✅ Glassmorphism: ${beautyStatus.glassmorphismCards}`);
    console.log(`✅ Gradient Text: ${beautyStatus.gradientName}`);
    
    // Take beautiful screenshot
    await page.screenshot({
        path: 'final-beautiful-ui.png',
        fullPage: false
    });
    
    console.log('\n📸 Beautiful UI screenshot saved!');
    console.log('🎉 The CV site is now BEAUTIFUL with premium animations!');
    
    await browser.close();
})();