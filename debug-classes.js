const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 8000));
    
    const classDebug = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.section')).map(section => ({
            id: section.id,
            classList: Array.from(section.classList),
            hasVisible: section.classList.contains('visible'),
            hasActive: section.classList.contains('active'),
            hasScrollAnimate: section.classList.contains('scroll-animate'),
            hasInView: section.classList.contains('in-view'),
            computedOpacity: window.getComputedStyle(section).opacity,
            computedTransform: window.getComputedStyle(section).transform
        }));
    });
    
    console.log('SECTION CLASSES DEBUG:');
    classDebug.forEach(section => {
        console.log(`\n${section.id}:`);
        console.log(`  Classes: ${section.classList.join(', ')}`);
        console.log(`  Visible: ${section.hasVisible}, Active: ${section.hasActive}`);
        console.log(`  Scroll Animate: ${section.hasScrollAnimate}, In View: ${section.hasInView}`);
        console.log(`  Opacity: ${section.computedOpacity}, Transform: ${section.computedTransform}`);
    });
    
    await browser.close();
})();