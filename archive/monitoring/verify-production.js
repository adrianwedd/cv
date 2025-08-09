const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    
    
    await page.goto('https://adrianwedd.github.io/cv/', { waitUntil: 'networkidle2' });
    
    // Comprehensive checks
    const results = await page.evaluate(() => {
        const checks = {
            loadingScreen: {
                exists: !!document.querySelector('.loading-screen'),
                hidden: document.querySelector('.loading-screen')?.style.display === 'none',
                hasHiddenClass: document.querySelector('.loading-screen')?.classList.contains('hidden')
            },
            darkMode: {
                htmlTheme: document.documentElement.getAttribute('data-theme'),
                backgroundColor: window.getComputedStyle(document.body).backgroundColor,
                isActuallyDark: window.getComputedStyle(document.body).backgroundColor.includes('15, 23, 42')
            },
            content: {
                nameVisible: !!document.querySelector('h1')?.textContent,
                name: document.querySelector('h1')?.textContent,
                sectionsCount: document.querySelectorAll('.section').length,
                navItemsCount: document.querySelectorAll('.nav-item').length
            },
            application: {
                cvAppLoaded: typeof window.cvApp !== 'undefined',
                isLoading: window.cvApp?.isLoading,
                currentSection: window.cvApp?.currentSection
            }
        };
        return checks;
    });
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    // Overall status
    const allGood = 
        results.loadingScreen.hidden && 
        results.darkMode.htmlTheme === 'dark' &&
        results.darkMode.isActuallyDark &&
        results.application.cvAppLoaded &&
        !results.application.isLoading;
    
    );
    
    
    await browser.close();
})();