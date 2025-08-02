/**
 * Jest Puppeteer Configuration
 * Configures Puppeteer for end-to-end testing
 */

module.exports = {
  launch: {
    headless: process.env.CI ? true : 'new',
    slowMo: process.env.CI ? 0 : 50,
    devtools: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security'
    ],
    defaultViewport: {
      width: 1280,
      height: 720
    }
  },
  browserContext: 'default'
};