/**
 * Jest Puppeteer Configuration
 * Configures Puppeteer for end-to-end testing
 */

module.exports = {
  launch: {
    headless: process.env.CI ? true : 'new',
    slowMo: process.env.CI ? 0 : 50,
    devtools: false,
    timeout: 60000, // Increased timeout for CI stability
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-networking',
      '--disable-ipc-flooding-protection',
      '--force-color-profile=srgb',
      '--memory-pressure-off',
      '--max_old_space_size=4096'
    ],
    defaultViewport: {
      width: 1280,
      height: 720
    },
    ignoreDefaultArgs: ['--disable-extensions'],
    ignoreHTTPSErrors: true
  },
  browserContext: 'default',
  // Server configuration disabled - tests will handle server setup manually
  // to avoid port conflicts and improve reliability
};