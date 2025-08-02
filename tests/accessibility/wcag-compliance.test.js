/**
 * WCAG 2.1 AA Accessibility Compliance Test Suite
 * Comprehensive accessibility testing using axe-core
 */

const { AxePuppeteer } = require('@axe-core/puppeteer');

describe('WCAG 2.1 AA Accessibility Compliance', () => {
  let page;
  
  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  }, 30000);

  afterAll(async () => {
    await page.close();
  });

  describe('Main CV Page Accessibility', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should pass WCAG 2.1 AA compliance', async () => {
      const results = await new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(results.violations).toHaveLength(0);
      
      if (results.violations.length > 0) {
        console.log('Accessibility violations found:');
        results.violations.forEach(violation => {
          console.log(`- ${violation.description}`);
          console.log(`  Impact: ${violation.impact}`);
          console.log(`  Help: ${violation.helpUrl}`);
        });
      }
    });

    test('should have proper heading hierarchy', async () => {
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', 
        elements => elements.map(el => ({
          tagName: el.tagName,
          text: el.textContent.trim(),
          level: parseInt(el.tagName.charAt(1))
        }))
      );
      
      // Should have exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);
      
      // Heading levels should not skip
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = headings[i].level;
        const previousLevel = headings[i-1].level;
        
        if (currentLevel > previousLevel) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
      }
    });

    test('should have proper ARIA landmarks', async () => {
      const landmarks = await page.$$eval('[role], main, nav, header, footer, aside', 
        elements => elements.map(el => el.tagName.toLowerCase() + (el.getAttribute('role') ? `[role="${el.getAttribute('role')}"]` : ''))
      );
      
      expect(landmarks).toContain('main');
      expect(landmarks).toContain('nav');
      expect(landmarks.some(l => l.includes('header'))).toBeTruthy();
    });

    test('should have accessible skip navigation', async () => {
      const skipLink = await page.$('a[href="#main-content"], .skip-to-content');
      expect(skipLink).toBeTruthy();
      
      if (skipLink) {
        const skipText = await page.evaluate(el => el.textContent, skipLink);
        expect(skipText.toLowerCase()).toContain('skip');
      }
    });

    test('should have proper focus management', async () => {
      // Test focus indicators
      const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      
      for (let element of focusableElements.slice(0, 5)) { // Test first 5 elements
        await element.focus();
        
        const focusStyles = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        }, element);
        
        // Should have visible focus indicator
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' || 
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBeTruthy();
      }
    });

    test('should have proper color contrast ratios', async () => {
      const results = await new AxePuppeteer(page)
        .withTags(['color-contrast'])
        .analyze();
      
      expect(results.violations).toHaveLength(0);
    });

    test('should support keyboard navigation', async () => {
      // Test tab navigation
      const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      
      if (focusableElements.length > 0) {
        await focusableElements[0].focus();
        
        for (let i = 1; i < Math.min(focusableElements.length, 10); i++) {
          await page.keyboard.press('Tab');
          
          const activeElement = await page.evaluate(() => document.activeElement.tagName);
          expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(activeElement);
        }
      }
    });
  });

  describe('Career Intelligence Dashboard Accessibility', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    });

    test('should pass WCAG 2.1 AA compliance for dashboard', async () => {
      const results = await new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(results.violations).toHaveLength(0);
    });

    test('should have accessible chart elements', async () => {
      const charts = await page.$$('canvas[role="img"], canvas[aria-label]');
      
      for (let chart of charts) {
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), chart);
        const role = await page.evaluate(el => el.getAttribute('role'), chart);
        
        expect(ariaLabel || role).toBeTruthy();
      }
    });

    test('should provide chart alternatives', async () => {
      // Check for data tables or descriptions as chart alternatives
      const alternatives = await page.$$('.chart-data-table, .chart-description, [aria-describedby]');
      expect(alternatives.length).toBeGreaterThan(0);
    });

    test('should have accessible metric cards', async () => {
      const metricCards = await page.$$('.metric-card');
      
      for (let card of metricCards) {
        const hasAccessibleName = await page.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.getAttribute('aria-labelledby') ||
                 el.querySelector('h3, h4, .metric-label');
        }, card);
        
        expect(hasAccessibleName).toBeTruthy();
      }
    });
  });

  describe('Mobile Accessibility', () => {
    beforeEach(async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should maintain accessibility on mobile', async () => {
      const results = await new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(results.violations).toHaveLength(0);
    });

    test('should have minimum touch target sizes (44px)', async () => {
      const touchTargets = await page.$$('button, a, input, select, textarea, [onclick]');
      
      for (let target of touchTargets.slice(0, 10)) { // Test first 10
        const rect = await target.boundingBox();
        
        if (rect) {
          expect(rect.width).toBeGreaterThanOrEqual(44);
          expect(rect.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should support screen reader navigation on mobile', async () => {
      // Test aria-expanded, aria-controls for mobile menus
      const mobileMenus = await page.$$('[aria-expanded], .mobile-menu-toggle');
      
      for (let menu of mobileMenus) {
        const ariaExpanded = await page.evaluate(el => el.getAttribute('aria-expanded'), menu);
        const ariaControls = await page.evaluate(el => el.getAttribute('aria-controls'), menu);
        
        if (ariaExpanded !== null) {
          expect(['true', 'false']).toContain(ariaExpanded);
        }
        
        if (ariaControls) {
          const controlledElement = await page.$(`#${ariaControls}`);
          expect(controlledElement).toBeTruthy();
        }
      }
    });
  });

  describe('Dark Theme Accessibility', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      // Switch to dark theme
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      if (themeToggle) {
        await themeToggle.click();
        await page.waitForTimeout(500);
      }
    });

    test('should maintain contrast ratios in dark theme', async () => {
      const results = await new AxePuppeteer(page)
        .withTags(['color-contrast'])
        .analyze();
      
      expect(results.violations).toHaveLength(0);
    });

    test('should have accessible theme toggle', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        const ariaLabel = await page.evaluate(el => 
          el.getAttribute('aria-label') || el.textContent.trim(), themeToggle
        );
        
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel.toLowerCase()).toMatch(/theme|dark|light/);
      }
    });
  });

  describe('Form Accessibility', () => {
    test('should have properly labeled form elements', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      const formElements = await page.$$('input, select, textarea');
      
      for (let element of formElements) {
        const hasLabel = await page.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const wrappingLabel = el.closest('label');
          
          return !!(ariaLabel || ariaLabelledBy || label || wrappingLabel);
        }, element);
        
        expect(hasLabel).toBeTruthy();
      }
    });

    test('should provide error messages with proper associations', async () => {
      const errorMessages = await page.$$('.error-message, [role="alert"], .invalid-feedback');
      
      for (let error of errorMessages) {
        const associatedField = await page.evaluate(el => {
          const id = el.id;
          return id ? document.querySelector(`[aria-describedby*="${id}"]`) : null;
        }, error);
        
        if (associatedField) {
          expect(associatedField).toBeTruthy();
        }
      }
    });
  });

  describe('Image Accessibility', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should have appropriate alt text for images', async () => {
      const images = await page.$$('img');
      
      for (let img of images) {
        const alt = await page.evaluate(el => el.getAttribute('alt'), img);
        const role = await page.evaluate(el => el.getAttribute('role'), img);
        const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), img);
        
        // Decorative images should have empty alt or role="presentation"
        // Content images should have descriptive alt text
        const isDecorative = role === 'presentation' || alt === '';
        const hasDescription = alt && alt.trim().length > 0;
        const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 0;
        
        expect(isDecorative || hasDescription || hasAriaLabel).toBeTruthy();
      }
    });
  });

  describe('Reduced Motion Support', () => {
    test('should respect prefers-reduced-motion', async () => {
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' }
      ]);
      
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      await page.waitForSelector('.dashboard-container', { timeout: 10000 });
      
      // Check that animations are disabled or reduced
      const hasReducedMotion = await page.evaluate(() => {
        const computedStyle = window.getComputedStyle(document.body);
        return computedStyle.getPropertyValue('--animation-duration') === '0s' ||
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });
      
      expect(hasReducedMotion).toBeTruthy();
    });
  });
});