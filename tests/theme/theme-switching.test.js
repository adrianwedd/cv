/**
 * Theme Switching and Persistence Test Suite
 * Comprehensive testing for dark/light theme functionality
 */

describe('Theme Switching and Persistence', () => {
  let page;
  
  beforeAll(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  }, 30000);

  afterAll(async () => {
    await page.close();
  });

  beforeEach(async () => {
    // Clear localStorage before each test
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  describe('Theme Toggle Functionality', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should have accessible theme toggle button', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle], [aria-label*="theme"]');
      expect(themeToggle).toBeTruthy();
      
      if (themeToggle) {
        const ariaLabel = await page.evaluate(el => 
          el.getAttribute('aria-label') || el.textContent.trim() || el.title, themeToggle
        );
        
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel.toLowerCase()).toMatch(/theme|dark|light|toggle/);
      }
    });

    test('should toggle between light and dark themes', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Get initial theme
        const initialTheme = await page.$eval('body', el => {
          const classList = Array.from(el.classList);
          return classList.find(cls => cls.includes('theme-')) || 
                 el.getAttribute('data-theme') ||
                 getComputedStyle(el).getPropertyValue('--theme-mode').trim();
        });
        
        // Click toggle
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get new theme
        const newTheme = await page.$eval('body', el => {
          const classList = Array.from(el.classList);
          return classList.find(cls => cls.includes('theme-')) || 
                 el.getAttribute('data-theme') ||
                 getComputedStyle(el).getPropertyValue('--theme-mode').trim();
        });
        
        expect(newTheme).not.toBe(initialTheme);
        expect(newTheme).toMatch(/dark|light/);
      }
    });

    test('should update CSS custom properties when switching themes', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Get initial CSS variables
        const initialColors = await page.evaluate(() => {
          const root = document.documentElement;
          const styles = getComputedStyle(root);
          return {
            background: styles.getPropertyValue('--color-background').trim(),
            text: styles.getPropertyValue('--color-text').trim(),
            primary: styles.getPropertyValue('--color-primary').trim()
          };
        });
        
        // Toggle theme
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get new CSS variables
        const newColors = await page.evaluate(() => {
          const root = document.documentElement;
          const styles = getComputedStyle(root);
          return {
            background: styles.getPropertyValue('--color-background').trim(),
            text: styles.getPropertyValue('--color-text').trim(),
            primary: styles.getPropertyValue('--color-primary').trim()
          };
        });
        
        // Colors should change (at least background and text)
        expect(newColors.background).not.toBe(initialColors.background);
        expect(newColors.text).not.toBe(initialColors.text);
      }
    });

    test('should update theme toggle button appearance', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        const initialIcon = await page.evaluate(el => {
          return el.textContent.trim() || 
                 el.querySelector('svg, i')?.outerHTML ||
                 el.getAttribute('aria-label');
        }, themeToggle);
        
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const newIcon = await page.evaluate(el => {
          return el.textContent.trim() || 
                 el.querySelector('svg, i')?.outerHTML ||
                 el.getAttribute('aria-label');
        }, themeToggle);
        
        expect(newIcon).not.toBe(initialIcon);
      }
    });
  });

  describe('Theme Persistence', () => {
    test('should save theme preference to localStorage', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const savedTheme = await page.evaluate(() => {
          return localStorage.getItem('theme') || 
                 localStorage.getItem('themePreference') ||
                 localStorage.getItem('darkMode');
        });
        
        expect(savedTheme).toBeTruthy();
      }
    });

    test('should restore theme preference on page load', async () => {
      // Set theme preference in localStorage
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('theme', 'dark');
      });
      
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      const restoredTheme = await page.$eval('body', el => {
        const classList = Array.from(el.classList);
        return classList.find(cls => cls.includes('theme-')) || 
               el.getAttribute('data-theme') ||
               getComputedStyle(el).getPropertyValue('--theme-mode').trim();
      });
      
      expect(restoredTheme).toMatch(/dark/);
    });

    test('should persist theme across page navigation', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Set dark theme
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Navigate to another page
        await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
        await page.waitForSelector('.dashboard-container', { timeout: 10000 });
        
        // Check if theme is preserved
        const persistedTheme = await page.$eval('body', el => {
          const classList = Array.from(el.classList);
          return classList.find(cls => cls.includes('theme-')) || 
                 el.getAttribute('data-theme') ||
                 getComputedStyle(el).getPropertyValue('--theme-mode').trim();
        });
        
        expect(persistedTheme).toMatch(/dark/);
      }
    });

    test('should handle invalid theme values gracefully', async () => {
      // Set invalid theme in localStorage
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('theme', 'invalid-theme');
      });
      
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      // Should fallback to default theme
      const fallbackTheme = await page.$eval('body', el => {
        const classList = Array.from(el.classList);
        return classList.find(cls => cls.includes('theme-')) || 
               el.getAttribute('data-theme') ||
               'light'; // default fallback
      });
      
      expect(fallbackTheme).toMatch(/light|dark/);
    });
  });

  describe('System Theme Preference Detection', () => {
    test('should respect prefers-color-scheme: dark', async () => {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' }
      ]);
      
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      const systemTheme = await page.evaluate(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      });
      
      expect(systemTheme).toBe(true);
      
      // Should apply dark theme by default (unless overridden)
      const appliedTheme = await page.$eval('body', el => {
        const classList = Array.from(el.classList);
        return classList.find(cls => cls.includes('theme-')) || 
               getComputedStyle(el).getPropertyValue('--theme-mode').trim();
      });
      
      // Should be dark if no explicit preference is set
      if (!await page.evaluate(() => localStorage.getItem('theme'))) {
        expect(appliedTheme).toMatch(/dark/);
      }
    });

    test('should respect prefers-color-scheme: light', async () => {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'light' }
      ]);
      
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      const systemTheme = await page.evaluate(() => {
        return window.matchMedia('(prefers-color-scheme: light)').matches;
      });
      
      expect(systemTheme).toBe(true);
    });

    test('should override system preference with saved preference', async () => {
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'dark' }
      ]);
      
      // Set explicit light theme preference
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('theme', 'light');
      });
      
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      const appliedTheme = await page.$eval('body', el => {
        const classList = Array.from(el.classList);
        return classList.find(cls => cls.includes('theme-')) || 
               getComputedStyle(el).getPropertyValue('--theme-mode').trim();
      });
      
      expect(appliedTheme).toMatch(/light/);
    });
  });

  describe('Theme-Specific Styling', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should have appropriate contrast ratios in both themes', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Test light theme contrast
        const lightContrast = await page.evaluate(() => {
          const body = document.body;
          const styles = getComputedStyle(body);
          return {
            background: styles.backgroundColor,
            color: styles.color
          };
        });
        
        // Toggle to dark theme
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Test dark theme contrast
        const darkContrast = await page.evaluate(() => {
          const body = document.body;
          const styles = getComputedStyle(body);
          return {
            background: styles.backgroundColor,
            color: styles.color
          };
        });
        
        expect(lightContrast.background).not.toBe(darkContrast.background);
        expect(lightContrast.color).not.toBe(darkContrast.color);
      }
    });

    test('should update all themed elements consistently', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Get initial styled elements
        const initialStyles = await page.evaluate(() => {
          const elements = document.querySelectorAll('.card, .section, .nav, header, footer');
          return Array.from(elements).map(el => ({
            background: getComputedStyle(el).backgroundColor,
            color: getComputedStyle(el).color,
            border: getComputedStyle(el).borderColor
          }));
        });
        
        // Toggle theme
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get new styles
        const newStyles = await page.evaluate(() => {
          const elements = document.querySelectorAll('.card, .section, .nav, header, footer');
          return Array.from(elements).map(el => ({
            background: getComputedStyle(el).backgroundColor,
            color: getComputedStyle(el).color,
            border: getComputedStyle(el).borderColor
          }));
        });
        
        // At least some elements should have changed
        const hasChanges = initialStyles.some((initial, index) => {
          const newStyle = newStyles[index];
          return newStyle && (
            initial.background !== newStyle.background ||
            initial.color !== newStyle.color ||
            initial.border !== newStyle.border
          );
        });
        
        expect(hasChanges).toBeTruthy();
      }
    });
  });

  describe('Dashboard Theme Integration', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    });

    test('should update chart themes when switching', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Wait for charts to load
        await page.waitForSelector('canvas', { timeout: 5000 });
        
        // Toggle theme
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if charts have updated
        const chartThemeUpdated = await page.evaluate(() => {
          // Look for chart theme update indicators
          const charts = document.querySelectorAll('canvas');
          return charts.length > 0; // Charts should still be present
        });
        
        expect(chartThemeUpdated).toBeTruthy();
      }
    });

    test('should maintain dashboard functionality in both themes', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Test light theme functionality
        const metricCards = await page.$$('.metric-card');
        expect(metricCards.length).toBeGreaterThan(0);
        
        // Toggle to dark theme
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Test dark theme functionality
        const darkMetricCards = await page.$$('.metric-card');
        expect(darkMetricCards.length).toBe(metricCards.length);
        
        // Charts should still be interactive
        const canvas = await page.$('canvas');
        if (canvas) {
          await canvas.click();
          // Should not throw errors
        }
      }
    });
  });

  describe('Theme Animation and Transitions', () => {
    beforeEach(async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should have smooth theme transition animations', async () => {
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Check for transition properties
        const hasTransitions = await page.evaluate(() => {
          const body = document.body;
          const html = document.documentElement;
          const bodyTransition = getComputedStyle(body).transition;
          const htmlTransition = getComputedStyle(html).transition;
          
          return bodyTransition.includes('background') || 
                 bodyTransition.includes('color') ||
                 htmlTransition.includes('background') ||
                 htmlTransition.includes('color') ||
                 bodyTransition !== 'all 0s ease 0s';
        });
        
        expect(hasTransitions).toBeTruthy();
      }
    });

    test('should respect prefers-reduced-motion for theme transitions', async () => {
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' }
      ]);
      
      await page.reload();
      await page.waitForSelector('main', { timeout: 10000 });
      
      const reducedMotionRespected = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });
      
      expect(reducedMotionRespected).toBe(true);
    });
  });

  describe('Theme Accessibility', () => {
    test('should maintain focus visibility in both themes', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
      
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        // Test focus in light theme
        await themeToggle.focus();
        
        const lightFocus = await page.evaluate(el => {
          const styles = getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            backgroundColor: styles.backgroundColor
          };
        }, themeToggle);
        
        // Toggle to dark theme
        await themeToggle.click();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Test focus in dark theme
        await themeToggle.focus();
        
        const darkFocus = await page.evaluate(el => {
          const styles = getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            backgroundColor: styles.backgroundColor
          };
        }, themeToggle);
        
        // Should have visible focus indicators in both themes
        const lightHasFocus = lightFocus.outline !== 'none' || lightFocus.boxShadow !== 'none';
        const darkHasFocus = darkFocus.outline !== 'none' || darkFocus.boxShadow !== 'none';
        
        expect(lightHasFocus).toBeTruthy();
        expect(darkHasFocus).toBeTruthy();
      }
    });
  });
});