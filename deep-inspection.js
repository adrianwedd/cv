const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set viewport to standard desktop
    await page.setViewport({ width: 1366, height: 768 });
    
    // Navigate with longer timeout
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',  // Wait for all network requests to finish
        timeout: 60000 
    });
    
    // Wait for any animations/transitions
    await new Promise(r => setTimeout(r, 5000));
    
    // Deep inspection of every element
    const deepCheck = await page.evaluate(() => {
        const issues = [];
        
        // Check if loading screen is truly gone
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            const styles = window.getComputedStyle(loadingScreen);
            if (styles.display !== 'none' || styles.visibility !== 'hidden' || parseFloat(styles.opacity) > 0) {
                issues.push(`Loading screen still visible: display=${styles.display}, visibility=${styles.visibility}, opacity=${styles.opacity}`);
            }
        }
        
        // Check dark mode
        const theme = document.documentElement.getAttribute('data-theme');
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        if (theme !== 'dark' || !bodyBg.includes('10, 10, 10')) {
            issues.push(`Dark mode not active: theme=${theme}, bg=${bodyBg}`);
        }
        
        // Check navigation
        const nav = document.querySelector('.navigation');
        if (!nav) {
            issues.push('Navigation element missing');
        } else {
            const navStyles = window.getComputedStyle(nav);
            if (navStyles.display === 'none' || navStyles.visibility === 'hidden') {
                issues.push(`Navigation hidden: display=${navStyles.display}, visibility=${navStyles.visibility}`);
            }
            
            if (nav.offsetHeight < 50) {
                issues.push(`Navigation too small: height=${nav.offsetHeight}px`);
            }
        }
        
        // Check navigation items
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems.length !== 5) {
            issues.push(`Wrong nav item count: ${navItems.length} (should be 5)`);
        }
        
        navItems.forEach((item, i) => {
            const styles = window.getComputedStyle(item);
            if (styles.display === 'none' || styles.visibility === 'hidden') {
                issues.push(`Nav item ${i} hidden: ${item.innerText}`);
            }
            
            // Check if clickable
            if (item.offsetWidth === 0 || item.offsetHeight === 0) {
                issues.push(`Nav item ${i} has no size: ${item.innerText}`);
            }
        });
        
        // Check main content visibility
        const mainContent = document.querySelector('.main-content') || document.querySelector('main');
        if (!mainContent) {
            issues.push('Main content element missing');
        } else {
            const styles = window.getComputedStyle(mainContent);
            if (styles.display === 'none' || styles.visibility === 'hidden') {
                issues.push('Main content hidden');
            }
        }
        
        // Check sections
        const sections = document.querySelectorAll('.section');
        if (sections.length === 0) {
            issues.push('No sections found');
        }
        
        // Check if content is actually visible to user
        const h1 = document.querySelector('h1');
        if (!h1 || !h1.innerText.includes('Adrian Wedd')) {
            issues.push('Main heading missing or wrong');
        }
        
        // Check for any error elements
        const errors = document.querySelectorAll('[class*="error"], .error-message, .loading-error');
        if (errors.length > 0) {
            issues.push(`Error elements present: ${errors.length}`);
        }
        
        // Check if navigation is functional
        const aboutLink = document.querySelector('.nav-item[data-section="about"]');
        if (!aboutLink) {
            issues.push('About navigation link missing');
        }
        
        return {
            issues,
            stats: {
                navHeight: nav ? nav.offsetHeight : 0,
                navItems: navItems.length,
                sections: sections.length,
                theme: theme,
                bodyBg: bodyBg,
                loadingDisplay: loadingScreen ? window.getComputedStyle(loadingScreen).display : 'not found'
            }
        };
    });
    
    
    
    deepCheck.issues.forEach((issue, i) => {
        
    });
    
    
    
    await browser.close();
    
    // Return if there are issues
    return deepCheck.issues.length === 0;
})();