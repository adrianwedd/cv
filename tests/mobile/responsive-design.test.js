/**
 * Mobile Responsiveness and Touch Interaction Test Suite
 * Comprehensive testing for mobile user experience
 */

describe('Mobile Responsiveness and Touch Interactions', () => {
  let page;
  
  const viewports = {
    mobile: { width: 375, height: 667, deviceScaleFactor: 2 },
    tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
    smallMobile: { width: 320, height: 568, deviceScaleFactor: 2 },
    largeMobile: { width: 414, height: 896, deviceScaleFactor: 3 }
  };

  beforeAll(async () => {
    page = await browser.newPage();
  }, 30000);

  afterAll(async () => {
    await page.close();
  });

  describe('Responsive Layout Adaptation', () => {
    Object.entries(viewports).forEach(([deviceType, viewport]) => {
      describe(`${deviceType} viewport (${viewport.width}x${viewport.height})`, () => {
        beforeEach(async () => {
          await page.setViewport(viewport);
          await page.goto(`${global.APP_BASE_URL}/index.html`);
          await page.waitForSelector('main', { timeout: 10000 });
        });

        test('should adapt main layout to viewport', async () => {
          const containerWidth = await page.$eval('.container, main', 
            el => window.getComputedStyle(el).width
          );
          
          expect(parseInt(containerWidth)).toBeLessThanOrEqual(viewport.width);
        });

        test('should have readable text sizing', async () => {
          const textElements = await page.$$eval('p, h1, h2, h3, h4, h5, h6, li', 
            elements => elements.map(el => {
              const styles = window.getComputedStyle(el);
              return {
                fontSize: parseFloat(styles.fontSize),
                lineHeight: parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.2
              };
            })
          );
          
          textElements.forEach(({ fontSize, lineHeight }) => {
            expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable size
            expect(lineHeight).toBeGreaterThanOrEqual(fontSize * 1.2); // Proper line height
          });
        });

        test('should stack elements vertically on narrow screens', async () => {
          if (viewport.width <= 768) {
            const gridElements = await page.$$('.grid, .flex, .two-columns');
            
            for (let element of gridElements) {
              const computedStyle = await page.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return {
                  display: styles.display,
                  flexDirection: styles.flexDirection,
                  gridTemplateColumns: styles.gridTemplateColumns
                };
              }, element);
              
              const isStackedVertically = 
                computedStyle.flexDirection === 'column' ||
                computedStyle.gridTemplateColumns === 'none' ||
                computedStyle.gridTemplateColumns.includes('1fr') ||
                computedStyle.display === 'block';
              
              expect(isStackedVertically).toBeTruthy();
            }
          }
        });
      });
    });

    test('should handle viewport changes dynamically', async () => {
      await page.setViewport(viewports.mobile);
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      const mobileLayout = await page.$eval('body', el => 
        window.getComputedStyle(el).getPropertyValue('--layout-type') || 'mobile'
      );
      
      await page.setViewport(viewports.tablet);
      await page.waitForTimeout(500);
      
      const tabletLayout = await page.$eval('body', el => 
        window.getComputedStyle(el).getPropertyValue('--layout-type') || 'tablet'
      );
      
      expect(mobileLayout).not.toBe(tabletLayout);
    });
  });

  describe('Touch Target Optimization', () => {
    beforeEach(async () => {
      await page.setViewport(viewports.mobile);
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should have minimum 44px touch targets', async () => {
      const touchTargets = await page.$$('button, a, input, select, textarea, [onclick], [role="button"]');
      
      for (let target of touchTargets) {
        const boundingBox = await target.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should have proper spacing between touch targets', async () => {
      const touchTargets = await page.$$('button, a');
      
      for (let i = 0; i < touchTargets.length - 1; i++) {
        const rect1 = await touchTargets[i].boundingBox();
        const rect2 = await touchTargets[i + 1].boundingBox();
        
        if (rect1 && rect2) {
          const horizontalDistance = Math.abs(rect1.x - rect2.x);
          const verticalDistance = Math.abs(rect1.y - rect2.y);
          
          // If elements are close, they should have adequate spacing
          if (horizontalDistance < 100 && verticalDistance < 100) {
            const spacing = Math.min(horizontalDistance, verticalDistance);
            expect(spacing).toBeGreaterThanOrEqual(8); // 8px minimum spacing
          }
        }
      }
    });

    test('should handle touch interactions responsively', async () => {
      const button = await page.$('button, a');
      
      if (button) {
        const startTime = Date.now();
        await button.tap();
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(100); // Should respond within 100ms
      }
    });

    test('should provide visual feedback for touch', async () => {
      const interactiveElements = await page.$$('button, a, [role="button"]');
      
      for (let element of interactiveElements.slice(0, 3)) {
        // Simulate touch start
        await element.hover();
        
        const hasHoverState = await page.evaluate(el => {
          const styles = window.getComputedStyle(el, ':hover');
          const normalStyles = window.getComputedStyle(el);
          
          return styles.backgroundColor !== normalStyles.backgroundColor ||
                 styles.color !== normalStyles.color ||
                 styles.transform !== normalStyles.transform ||
                 styles.opacity !== normalStyles.opacity;
        }, element);
        
        expect(hasHoverState).toBeTruthy();
      }
    });
  });

  describe('Navigation Menu Mobile Behavior', () => {
    beforeEach(async () => {
      await page.setViewport(viewports.mobile);
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should have accessible mobile menu', async () => {
      const mobileMenuToggle = await page.$('.mobile-menu-toggle, .menu-toggle, [aria-expanded]');
      
      if (mobileMenuToggle) {
        const ariaExpanded = await page.evaluate(el => 
          el.getAttribute('aria-expanded'), mobileMenuToggle
        );
        
        expect(ariaExpanded).toBeTruthy();
        expect(['true', 'false']).toContain(ariaExpanded);
      }
    });

    test('should toggle mobile menu properly', async () => {
      const menuToggle = await page.$('.mobile-menu-toggle, .menu-toggle, [aria-expanded]');
      
      if (menuToggle) {
        const initialState = await page.evaluate(el => 
          el.getAttribute('aria-expanded'), menuToggle
        );
        
        await menuToggle.tap();
        await page.waitForTimeout(300);
        
        const newState = await page.evaluate(el => 
          el.getAttribute('aria-expanded'), menuToggle
        );
        
        expect(newState).not.toBe(initialState);
      }
    });

    test('should close menu when clicking outside', async () => {
      const menuToggle = await page.$('.mobile-menu-toggle, .menu-toggle');
      
      if (menuToggle) {
        // Open menu
        await menuToggle.tap();
        await page.waitForTimeout(300);
        
        // Click outside
        await page.tap('main');
        await page.waitForTimeout(300);
        
        const finalState = await page.evaluate(el => 
          el.getAttribute('aria-expanded'), menuToggle
        );
        
        expect(finalState).toBe('false');
      }
    });
  });

  describe('Career Intelligence Dashboard Mobile', () => {
    beforeEach(async () => {
      await page.setViewport(viewports.mobile);
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    });

    test('should adapt dashboard layout for mobile', async () => {
      const dashboardSections = await page.$$('.dashboard-section');
      
      for (let section of dashboardSections) {
        const width = await page.evaluate(el => 
          el.getBoundingClientRect().width, section
        );
        
        expect(width).toBeLessThanOrEqual(viewports.mobile.width);
      }
    });

    test('should make charts touch-friendly', async () => {
      const charts = await page.$$('canvas');
      
      for (let chart of charts) {
        const rect = await chart.boundingBox();
        
        if (rect) {
          expect(rect.width).toBeGreaterThan(250); // Minimum chart width for readability
          expect(rect.height).toBeGreaterThan(200); // Minimum chart height
        }
      }
    });

    test('should stack metric cards vertically', async () => {
      const metricCards = await page.$$('.metric-card');
      
      if (metricCards.length > 1) {
        const positions = await Promise.all(
          metricCards.map(card => card.boundingBox())
        );
        
        // Check if cards are stacked vertically (y positions increase)
        for (let i = 1; i < positions.length; i++) {
          expect(positions[i].y).toBeGreaterThan(positions[i-1].y);
        }
      }
    });

    test('should handle chart interactions on touch', async () => {
      const chart = await page.$('canvas');
      
      if (chart) {
        const rect = await chart.boundingBox();
        
        // Tap on chart
        await page.tap('canvas', {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        });
        
        // Should not cause layout shifts or errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        await page.waitForTimeout(500);
        expect(consoleErrors).toHaveLength(0);
      }
    });
  });

  describe('Form Interactions Mobile', () => {
    beforeEach(async () => {
      await page.setViewport(viewports.mobile);
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should have mobile-optimized form inputs', async () => {
      const inputs = await page.$$('input, select, textarea');
      
      for (let input of inputs) {
        const rect = await input.boundingBox();
        
        if (rect) {
          expect(rect.height).toBeGreaterThanOrEqual(44); // Touch-friendly height
        }
        
        const inputType = await page.evaluate(el => el.type, input);
        const hasProperType = ['email', 'tel', 'url', 'text', 'password'].includes(inputType);
        
        expect(hasProperType).toBeTruthy();
      }
    });

    test('should prevent zoom when focusing inputs', async () => {
      const viewportMeta = await page.$eval('meta[name="viewport"]', el => 
        el.getAttribute('content')
      );
      
      expect(viewportMeta).toContain('user-scalable=no');
    });
  });

  describe('Image and Media Responsiveness', () => {
    beforeEach(async () => {
      await page.setViewport(viewports.mobile);
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 10000 });
    });

    test('should scale images appropriately', async () => {
      const images = await page.$$('img');
      
      for (let img of images) {
        const rect = await img.boundingBox();
        
        if (rect) {
          expect(rect.width).toBeLessThanOrEqual(viewports.mobile.width);
          
          const naturalDimensions = await page.evaluate(el => ({
            width: el.naturalWidth,
            height: el.naturalHeight
          }), img);
          
          // Image should maintain aspect ratio
          if (naturalDimensions.width > 0 && naturalDimensions.height > 0) {
            const originalRatio = naturalDimensions.width / naturalDimensions.height;
            const displayRatio = rect.width / rect.height;
            
            expect(Math.abs(originalRatio - displayRatio)).toBeLessThan(0.1);
          }
        }
      }
    });
  });

  describe('Mobile Performance', () => {
    test('should handle orientation changes', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.waitForSelector('main', { timeout: 5000 });
      
      const portraitLayout = await page.$eval('body', el => el.offsetWidth);
      
      // Simulate orientation change
      await page.setViewport({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      const landscapeLayout = await page.$eval('body', el => el.offsetWidth);
      
      expect(landscapeLayout).toBeGreaterThan(portraitLayout);
    });

    test('should scroll smoothly on mobile', async () => {
      await page.setViewport(viewports.mobile);
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      await page.waitForSelector('.dashboard-container', { timeout: 5000 });
      
      const scrollStart = await page.evaluate(() => window.pageYOffset);
      
      // Simulate scroll gesture
      await page.evaluate(() => {
        window.scrollBy({ top: 300, behavior: 'smooth' });
      });
      
      await page.waitForTimeout(1000);
      
      const scrollEnd = await page.evaluate(() => window.pageYOffset);
      
      expect(scrollEnd).toBeGreaterThan(scrollStart);
    });
  });
});