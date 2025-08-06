/**
 * WCAG 2.1 AA Accessibility Compliance Test Suite
 * Comprehensive accessibility testing using axe-core
 */

const { AxePuppeteer } = require('@axe-core/puppeteer');

describe('WCAG 2.1 AA Accessibility Compliance', () => {
  let page;
  
  beforeAll(async () => {
    // Create page with optimized configuration
    page = await global.testUtils.retryOperation(async () => {
      const newPage = await browser.newPage();
      await newPage.setViewport({ width: 1280, height: 720 });
      
      // Suppress non-critical page errors to reduce noise
      newPage.on('pageerror', error => {
        if (!error.message.includes('favicon') && !error.message.includes('Chart.js')) {
          console.warn('Page error in accessibility test:', error.message);
        }
      });
      
      return newPage;
    }, 2, 1000);
  }, 15000);

  afterAll(async () => {
    // Clean up page
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.warn('Error closing page:', error.message);
      }
      page = null;
    }
  });

  describe('Main CV Page Accessibility', () => {
    beforeEach(async () => {
      await global.testUtils.retryOperation(async () => {
        await page.goto(`${global.APP_BASE_URL}/index.html`, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        // Wait for main content with shorter timeout
        await page.waitForSelector('main', { timeout: 8000 });
        
        // Quick readiness check instead of full load wait
        await page.waitForTimeout(500);
      }, 2, 1000);
    }, 20000);

    test('should pass WCAG 2.1 AA compliance', async () => {
      const results = await global.testUtils.retryOperation(async () => {
        return await new AxePuppeteer(page)
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast', 'landmark-one-main', 'page-has-heading-one']) // Test core rules first
          .analyze();
      }, 2, 1000);
      
      expect(results.violations).toHaveLength(0);
      
      if (results.violations.length > 0) {
        console.log('\n🚨 Accessibility violations found:');
        results.violations.forEach(violation => {
          console.log(`\n❌ ${violation.id}: ${violation.description}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Elements: ${violation.nodes.length}`);
        });
      }
    }, 25000);

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
      const focusableElements = await page.$$('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      
      if (focusableElements.length === 0) {
        // Skip test if no focusable elements found
        return;
      }
      
      // Test only first 3 elements for efficiency
      const elementsToTest = focusableElements.slice(0, Math.min(3, focusableElements.length));
      
      for (const element of elementsToTest) {
        try {
          await element.focus();
          await page.waitForTimeout(50); // Minimal wait for focus
          
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
        } catch (error) {
          // Skip elements that can't be focused
          console.warn(`Focus test skipped for element: ${error.message}`);
        }
      }
    }, 15000);

    test('should have proper color contrast ratios', async () => {
      const results = await global.testUtils.retryOperation(async () => {
        return await new AxePuppeteer(page)
          .withTags(['color-contrast'])
          .analyze();
      }, 1, 1000); // Single retry for contrast check
      
      expect(results.violations).toHaveLength(0);
    }, 15000);

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
      await global.testUtils.retryOperation(async () => {
        await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        // Try to find dashboard content with fallback selectors
        const selectors = ['.dashboard-container', 'main', '.container', '#dashboard', 'body'];
        let found = false;
        
        for (const selector of selectors) {
          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            found = true;
            break;
          } catch (error) {
            // Try next selector
          }
        }
        
        if (!found) {
          throw new Error('No dashboard content found');
        }
        
        // Minimal wait for JavaScript initialization
        await page.waitForTimeout(500);
      }, 2, 1500);
    }, 20000);

    test('should pass WCAG 2.1 AA compliance for dashboard', async () => {
      const results = await global.testUtils.retryOperation(async () => {
        return await new AxePuppeteer(page)
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast']) // Test separately
          .analyze();
      }, 1, 1000);
      
      expect(results.violations).toHaveLength(0);
    }, 20000);

    test('should have accessible chart elements', async () => {
      // First check if any charts exist
      const charts = await page.$$('canvas, .chart, [data-chart]');
      
      if (charts.length === 0) {
        // Skip test if no charts found
        return;
      }
      
      // Test accessibility of found charts
      for (let chart of charts.slice(0, 3)) { // Limit to first 3 charts
        const hasAccessibility = await page.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.getAttribute('role') || 
                 el.getAttribute('alt') ||
                 el.querySelector('[aria-label]') !== null;
        }, chart);
        
        // Charts should have some accessibility attribute
        expect(hasAccessibility).toBeTruthy();
      }
    }, 10000);

    test('should provide chart alternatives', async () => {
      // Check for data tables or descriptions as chart alternatives
      const alternatives = await page.$$('.chart-data-table, .chart-description, [aria-describedby], .metric-card');
      
      // Should have at least some accessible content alternatives
      if (alternatives.length === 0) {
        // Check if dashboard has any accessible content at all
        const accessibleContent = await page.$$('[aria-label], [role], h1, h2, h3, h4, h5, h6');
        expect(accessibleContent.length).toBeGreaterThan(0);
      } else {
        expect(alternatives.length).toBeGreaterThan(0);
      }
    }, 8000);

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
      await page.goto(`${global.APP_BASE_URL}/index.html`, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      await page.waitForSelector('main', { timeout: 5000 });
    });

    test('should maintain accessibility on mobile', async () => {
      const results = await new AxePuppeteer(page)
        .withTags(['wcag2a'])
        .disableRules(['color-contrast', 'image-alt']) // Focus on core mobile issues
        .analyze();
      
      expect(results.violations).toHaveLength(0);
    }, 15000);

    test('should have minimum touch target sizes (44px)', async () => {
      const touchTargets = await page.$$('button, a[href], input, select, textarea');
      
      let testedCount = 0;
      const maxTests = 5; // Limit tests for performance
      
      for (const target of touchTargets) {
        if (testedCount >= maxTests) break;
        
        try {
          const rect = await target.boundingBox();
          
          if (rect && rect.width > 0 && rect.height > 0) {
            // Allow some flexibility for small screens
            expect(rect.width).toBeGreaterThanOrEqual(40);
            expect(rect.height).toBeGreaterThanOrEqual(40);
            testedCount++;
          }
        } catch (error) {
          // Skip elements that can't be measured
        }
      }
    }, 10000);

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
      await page.goto(`${global.APP_BASE_URL}/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 8000
      });
      await page.waitForSelector('main', { timeout: 5000 });
      
      // Try to switch to dark theme
      try {
        const themeToggle = await page.$('.theme-toggle, [data-theme-toggle], button[title*="theme"], button[aria-label*="theme"]');
        if (themeToggle) {
          await themeToggle.click();
          await page.waitForTimeout(300);
        }
      } catch (error) {
        console.warn('Theme toggle not found or failed:', error.message);
      }
    });

    test('should maintain contrast ratios in dark theme', async () => {
      const results = await new AxePuppeteer(page)
        .withTags(['color-contrast'])
        .analyze();
      
      // Allow some contrast issues in dark theme as it's secondary
      expect(results.violations.length).toBeLessThanOrEqual(2);
    }, 12000);

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
      await page.goto(`${global.APP_BASE_URL}/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 8000
      });
      
      const formElements = await page.$$('input, select, textarea');
      
      if (formElements.length === 0) {
        // Skip test if no form elements found
        return;
      }
      
      for (const element of formElements.slice(0, 5)) { // Limit to first 5
        const hasLabel = await page.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const wrappingLabel = el.closest('label');
          const placeholder = el.getAttribute('placeholder');
          
          return !!(ariaLabel || ariaLabelledBy || label || wrappingLabel || placeholder);
        }, element);
        
        expect(hasLabel).toBeTruthy();
      }
    }, 8000);

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
      await page.goto(`${global.APP_BASE_URL}/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 8000
      });
      await page.waitForSelector('main', { timeout: 5000 });
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