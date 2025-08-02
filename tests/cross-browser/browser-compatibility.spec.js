/**
 * Cross-Browser Compatibility Test Suite
 * Testing functionality across different browsers and devices
 */

const { test, expect } = require('@playwright/test');

test.describe('Cross-Browser Compatibility', () => {
  
  test.describe('Core Functionality', () => {
    test('should load main CV page across all browsers', async ({ page }) => {
      await page.goto('/');
      
      // Wait for main content to load
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
      
      // Check title
      await expect(page).toHaveTitle(/Adrian Wedd/);
      
      // Verify key sections are present
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('.professional-summary, .summary')).toBeVisible();
      await expect(page.locator('.experience, .work-experience')).toBeVisible();
    });

    test('should load career intelligence dashboard', async ({ page }) => {
      await page.goto('/career-intelligence.html');
      
      // Wait for dashboard to load
      await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 });
      
      // Check for metric cards
      await expect(page.locator('.metric-card')).toHaveCount(4);
      
      // Verify charts are present
      await expect(page.locator('canvas')).toHaveCount(2, { timeout: 5000 });
    });

    test('should handle navigation between pages', async ({ page }) => {
      await page.goto('/');
      
      // Find navigation link to dashboard
      const dashboardLink = page.locator('a[href*="career-intelligence"]').first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 });
      }
      
      // Navigate back
      await page.goBack();
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Theme Functionality', () => {
    test('should toggle theme across browsers', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      
      // Find theme toggle
      const themeToggle = page.locator('.theme-toggle, [data-theme-toggle]').first();
      
      if (await themeToggle.isVisible()) {
        // Get initial theme
        const initialClass = await page.locator('body').getAttribute('class');
        
        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        // Verify theme changed
        const newClass = await page.locator('body').getAttribute('class');
        expect(newClass).not.toBe(initialClass);
      }
    });

    test('should persist theme preference', async ({ page }) => {
      await page.goto('/');
      
      const themeToggle = page.locator('.theme-toggle, [data-theme-toggle]').first();
      
      if (await themeToggle.isVisible()) {
        // Set dark theme
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        // Reload page
        await page.reload();
        await expect(page.locator('main')).toBeVisible();
        
        // Theme should be preserved
        const bodyClass = await page.locator('body').getAttribute('class');
        expect(bodyClass).toMatch(/dark|theme-dark/);
      }
    });
  });

  test.describe('Form and Input Handling', () => {
    test('should handle form inputs consistently', async ({ page }) => {
      await page.goto('/');
      
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          await input.focus();
          
          // Check focus styles are applied
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toBeVisible();
        }
      }
    });

    test('should validate input types on mobile browsers', async ({ page, browserName }) => {
      // Skip on non-mobile browsers
      test.skip(browserName === 'chromium' || browserName === 'firefox' || browserName === 'webkit');
      
      await page.goto('/');
      
      const emailInputs = page.locator('input[type="email"]');
      const telInputs = page.locator('input[type="tel"]');
      
      if (await emailInputs.count() > 0) {
        await expect(emailInputs.first()).toHaveAttribute('type', 'email');
      }
      
      if (await telInputs.count() > 0) {
        await expect(telInputs.first()).toHaveAttribute('type', 'tel');
      }
    });
  });

  test.describe('JavaScript Functionality', () => {
    test('should execute JavaScript without errors', async ({ page }) => {
      const jsErrors = [];
      page.on('pageerror', error => jsErrors.push(error.message));
      
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      
      // Navigate to dashboard to test more JS
      await page.goto('/career-intelligence.html');
      await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 });
      
      // Wait for potential JS execution
      await page.waitForTimeout(2000);
      
      // Filter out non-critical errors
      const criticalErrors = jsErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('Chart.js') &&
        !error.includes('manifest')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should handle missing Chart.js gracefully', async ({ page }) => {
      // Block Chart.js to test graceful degradation
      await page.route('**/chart.js', route => route.abort());
      await page.route('**/Chart.min.js', route => route.abort());
      
      await page.goto('/career-intelligence.html');
      
      // Dashboard should still load
      await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 });
      
      // Metric cards should be visible
      await expect(page.locator('.metric-card')).toHaveCount(4);
    });
  });

  test.describe('CSS and Layout', () => {
    test('should render consistent layouts', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      
      // Check that basic layout elements are positioned correctly
      const header = page.locator('header');
      const main = page.locator('main');
      
      if (await header.isVisible()) {
        const headerBox = await header.boundingBox();
        const mainBox = await main.boundingBox();
        
        expect(headerBox.y).toBeLessThan(mainBox.y);
      }
    });

    test('should handle CSS Grid and Flexbox', async ({ page }) => {
      await page.goto('/career-intelligence.html');
      await expect(page.locator('.dashboard-container')).toBeVisible();
      
      // Check that grid/flex layouts work
      const dashboardSections = page.locator('.dashboard-section');
      const sectionCount = await dashboardSections.count();
      
      expect(sectionCount).toBeGreaterThan(0);
      
      // Verify sections are properly positioned
      for (let i = 0; i < Math.min(sectionCount, 2); i++) {
        const section = dashboardSections.nth(i);
        await expect(section).toBeVisible();
        
        const box = await section.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    });

    test('should handle custom CSS properties', async ({ page }) => {
      await page.goto('/');
      
      // Check that CSS custom properties are working
      const computedStyles = await page.evaluate(() => {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        return {
          primaryColor: styles.getPropertyValue('--color-primary').trim(),
          backgroundColor: styles.getPropertyValue('--color-background').trim(),
          textColor: styles.getPropertyValue('--color-text').trim()
        };
      });
      
      // At least some custom properties should be defined
      const hasCustomProperties = Object.values(computedStyles).some(value => value.length > 0);
      expect(hasCustomProperties).toBeTruthy();
    });
  });

  test.describe('Media Queries and Responsiveness', () => {
    test('should adapt to different viewport sizes', async ({ page }) => {
      await page.goto('/');
      
      // Test desktop view
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect(page.locator('main')).toBeVisible();
      const desktopLayout = await page.locator('body').getAttribute('class');
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      const mobileLayout = await page.locator('body').getAttribute('class');
      
      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      const tabletLayout = await page.locator('body').getAttribute('class');
      
      // Layouts should adapt (at least one should be different)
      const allSame = desktopLayout === mobileLayout && mobileLayout === tabletLayout;
      expect(allSame).toBeFalsy();
    });

    test('should maintain readability at all sizes', async ({ page }) => {
      await page.goto('/');
      
      const viewports = [
        { width: 320, height: 568 },  // Small mobile
        { width: 375, height: 667 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1280, height: 720 }  // Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);
        
        // Check font sizes are reasonable
        const fontSize = await page.evaluate(() => {
          const body = document.body;
          return parseInt(getComputedStyle(body).fontSize);
        });
        
        expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
      }
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5 second timeout for cross-browser
    });

    test('should handle multiple page loads', async ({ page }) => {
      // Load pages multiple times to test for memory leaks
      for (let i = 0; i < 3; i++) {
        await page.goto('/');
        await expect(page.locator('main')).toBeVisible();
        
        await page.goto('/career-intelligence.html');
        await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 });
      }
      
      // Should still be responsive after multiple loads
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Accessibility Across Browsers', () => {
    test('should maintain focus visibility', async ({ page }) => {
      await page.goto('/');
      
      // Find focusable elements
      const focusableElements = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const count = await focusableElements.count();
      
      if (count > 0) {
        // Test first few elements
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = focusableElements.nth(i);
          await element.focus();
          
          // Element should be focused
          const isFocused = await element.evaluate(el => el === document.activeElement);
          expect(isFocused).toBeTruthy();
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Tab through elements
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused);
      
      await page.keyboard.press('Tab');
      const secondFocused = await page.evaluate(() => document.activeElement.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'SELECT']).toContain(secondFocused);
    });
  });

  test.describe('Browser-Specific Features', () => {
    test('should handle touch events on mobile browsers', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit' && process.platform !== 'darwin'); // Skip Safari on non-Mac
      
      await page.goto('/');
      
      const touchTargets = page.locator('button, a, [role="button"]');
      const count = await touchTargets.count();
      
      if (count > 0) {
        const firstTarget = touchTargets.first();
        await firstTarget.tap();
        
        // Should handle tap without errors
        await page.waitForTimeout(500);
      }
    });

    test('should work with browser back/forward', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('main')).toBeVisible();
      
      await page.goto('/career-intelligence.html');
      await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 });
      
      await page.goBack();
      await expect(page.locator('main')).toBeVisible();
      
      await page.goForward();
      await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 });
    });
  });
});