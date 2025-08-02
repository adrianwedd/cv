/**
 * Jest Puppeteer Configuration
 * Configures Puppeteer for end-to-end testing
 */

module.exports = {
  launch: {
    headless: process.env.CI ? true : 'new',
    slowMo: process.env.CI ? 0 : 50,
    devtools: !process.env.CI,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 1280,
      height: 720
    }
  },
  server: {
    command: 'cd .. && python -m http.server 8000',
    port: 8000,
    launchTimeout: 10000,
    debug: true
  },
  browserContext: 'default'
};