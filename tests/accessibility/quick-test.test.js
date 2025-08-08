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
      
      
      // Check for main element
      const main = await page.$('main');
      expect(main).toBeTruthy();
      
      
      // Get page content
      const content = await page.$eval('body', el => el.textContent.substring(0, 100));
      expect(content.length).toBeGreaterThan(0);
      
      
    } finally {
      await page.close();
    }
  }, 15000);
});