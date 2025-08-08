const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://adrianwedd.github.io/cv/', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const dashboardLinks = await page.evaluate(() => {
        const dashboards = document.querySelector('.contact-link.dashboard');
        const watchMeWork = document.querySelector('.contact-link.work');
        
        return {
            dashboardsExists: !!dashboards,
            watchMeWorkExists: !!watchMeWork,
            dashboardsText: dashboards ? dashboards.textContent.trim() : null,
            watchMeWorkText: watchMeWork ? watchMeWork.textContent.trim() : null,
            dashboardsHref: dashboards ? dashboards.href : null,
            watchMeWorkHref: watchMeWork ? watchMeWork.href : null,
            totalContactLinks: document.querySelectorAll('.contact-link').length
        };
    });
    
    
    
    
    
    
    
    
    
    
    
    
    if (dashboardLinks.dashboardsExists && dashboardLinks.watchMeWorkExists) {
        
    } else {
        
    }
    
    await browser.close();
})();