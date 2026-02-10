// @ts-check
const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'smoke.test.js',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8274',
    headless: true,
  },
  webServer: {
    command: 'python3 -m http.server 8274',
    cwd: path.resolve(__dirname, '..'),
    port: 8274,
    reuseExistingServer: !process.env.CI,
  },
});
