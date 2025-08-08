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
    
    console.log('🔗 DASHBOARD LINKS VERIFICATION:');
    console.log('===============================================');
    console.log('✅ Dashboards link present:', dashboardLinks.dashboardsExists);
    console.log('✅ Watch Me Work link present:', dashboardLinks.watchMeWorkExists);
    console.log('📄 Dashboards text:', dashboardLinks.dashboardsText);
    console.log('🎬 Watch Me Work text:', dashboardLinks.watchMeWorkText);
    console.log('🔗 Dashboards URL:', dashboardLinks.dashboardsHref);
    console.log('🎬 Watch Me Work URL:', dashboardLinks.watchMeWorkHref);
    console.log('📊 Total contact links:', dashboardLinks.totalContactLinks);
    console.log('===============================================');
    
    if (dashboardLinks.dashboardsExists && dashboardLinks.watchMeWorkExists) {
        console.log('🎉 PERFECT! Both dashboard links are present and working!');
    } else {
        console.log('❌ MISSING LINKS - Still need to be fixed');
    }
    
    await browser.close();
})();