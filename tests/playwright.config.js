/**
 * Playwright Configuration for Cross-Browser Testing
 * Enterprise-grade browser compatibility testing
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './cross-browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.APP_BASE_URL || 'http://localhost:8000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Disabled to reduce CI costs - only Chrome testing for now
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 12'] },
    // },
    // {
    //   name: 'tablet',
    //   use: { ...devices['iPad Pro'] },
    // }
  ],

  webServer: {
    command: 'cd .. && python3 -m http.server 8000',
    port: 8000,
    timeout: 20000,
    reuseExistingServer: true, // Always reuse existing server since CI starts it separately
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env
    }
  },
});