/**
 * Quick validation test to check server and puppeteer setup
 */

describe('Quick Accessibility Setup Test', () => {
  test('should be able to access page and run basic checks', async () => {
    const page = await browser.newPage();
    
    try {
      await page.goto(`${global.APP_BASE_URL}/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      // Basic page validation
      const title = await page.title();
      expect(title).toBeTruthy();
      console.log('✅ Page title:', title);
      
      // Check for main element
      const main = await page.$('main');
      expect(main).toBeTruthy();
      console.log('✅ Main element found');
      
      // Get page content
      const content = await page.$eval('body', el => el.textContent.substring(0, 100));
      expect(content.length).toBeGreaterThan(0);
      console.log('✅ Page content loaded:', content.length, 'characters');
      
    } finally {
      await page.close();
    }
  }, 15000);
});