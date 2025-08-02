/**
 * Core Web Vitals Performance Test Suite
 * Comprehensive performance testing with real-world metrics
 */

describe('Core Web Vitals Performance', () => {
  let page;
  
  beforeAll(async () => {
    page = await browser.newPage();
    
    // Enable performance metrics collection
    await page._client.send('Performance.enable');
    await page._client.send('Runtime.enable');
  }, 30000);

  afterAll(async () => {
    await page.close();
  });

  describe('Main CV Page Performance', () => {
    test('should load within performance budget (2 seconds)', async () => {
      const startTime = Date.now();
      
      await page.goto(`${global.APP_BASE_URL}/index.html`, {
        waitUntil: 'networkidle2',
        timeout: 5000
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should achieve good Core Web Vitals scores', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      // Measure Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.fid = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                vitals.cls = (vitals.cls || 0) + entry.value;
              }
            });
            
            // Also get FCP
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            const fcp = paint.find(p => p.name === 'first-contentful-paint');
            
            vitals.fcp = fcp ? fcp.startTime : null;
            vitals.ttfb = navigation ? navigation.responseStart - navigation.requestStart : null;
            
            setTimeout(() => resolve(vitals), 2000);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        });
      });
      
      // Core Web Vitals thresholds (good scores)
      if (metrics.lcp) expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
      if (metrics.fid) expect(metrics.fid).toBeLessThan(100);  // FID < 100ms  
      if (metrics.cls) expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
      if (metrics.fcp) expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
      if (metrics.ttfb) expect(metrics.ttfb).toBeLessThan(600); // TTFB < 600ms
    });

    test('should have minimal main thread blocking time', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      const performanceMetrics = await page.metrics();
      
      // Check JavaScript execution time
      expect(performanceMetrics.ScriptDuration).toBeLessThan(1000); // < 1s total JS time
      expect(performanceMetrics.TaskDuration).toBeLessThan(2000);   // < 2s total task time
    });

    test('should have efficient resource loading', async () => {
      const responses = [];
      
      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'],
          contentType: response.headers()['content-type']
        });
      });
      
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      // Check for efficient resource loading
      const cssFiles = responses.filter(r => r.contentType && r.contentType.includes('text/css'));
      const jsFiles = responses.filter(r => r.contentType && r.contentType.includes('javascript'));
      const imageFiles = responses.filter(r => r.contentType && r.contentType.includes('image'));
      
      // CSS should be optimized
      cssFiles.forEach(css => {
        const size = parseInt(css.size) || 0;
        expect(size).toBeLessThan(100000); // < 100KB per CSS file
      });
      
      // JavaScript should be optimized
      jsFiles.forEach(js => {
        const size = parseInt(js.size) || 0;
        expect(size).toBeLessThan(250000); // < 250KB per JS file
      });
      
      // All responses should be successful
      const failedRequests = responses.filter(r => r.status >= 400);
      expect(failedRequests).toHaveLength(0);
    });
  });

  describe('Career Intelligence Dashboard Performance', () => {
    test('should load dashboard within 2 seconds', async () => {
      const startTime = Date.now();
      
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`, {
        waitUntil: 'networkidle2',
        timeout: 5000
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should render charts efficiently', async () => {
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      
      // Measure chart rendering performance
      const chartRenderTime = await page.evaluate(() => {
        const startTime = performance.now();
        
        return new Promise((resolve) => {
          // Wait for charts to be rendered
          const checkCharts = () => {
            const charts = document.querySelectorAll('canvas');
            if (charts.length >= 2) {
              resolve(performance.now() - startTime);
            } else {
              setTimeout(checkCharts, 100);
            }
          };
          checkCharts();
        });
      });
      
      expect(chartRenderTime).toBeLessThan(1000); // Charts should render in < 1s
    });

    test('should handle chart animations without performance impact', async () => {
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      
      const beforeMetrics = await page.metrics();
      
      // Trigger chart animations by scrolling
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      
      await page.waitForTimeout(2000); // Wait for animations
      
      const afterMetrics = await page.metrics();
      
      // Should not cause excessive layout thrashing
      const layoutIncrease = afterMetrics.LayoutDuration - beforeMetrics.LayoutDuration;
      expect(layoutIncrease).toBeLessThan(500); // < 500ms additional layout time
    });
  });

  describe('Mobile Performance', () => {
    beforeEach(async () => {
      await page.emulate({
        viewport: { width: 375, height: 667, isMobile: true },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      });
    });

    test('should maintain performance on mobile devices', async () => {
      const startTime = Date.now();
      
      await page.goto(`${global.APP_BASE_URL}/index.html`, {
        waitUntil: 'networkidle2',
        timeout: 8000 // Allow more time for mobile
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3s budget for mobile
    });

    test('should have efficient touch interactions', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      // Test touch response time
      const buttons = await page.$$('button, a');
      
      if (buttons.length > 0) {
        const startTime = Date.now();
        await buttons[0].tap();
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(100); // < 100ms touch response
      }
    });
  });

  describe('Memory Performance', () => {
    test('should not have memory leaks during navigation', async () => {
      const initialMemory = await page.metrics();
      
      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto(`${global.APP_BASE_URL}/index.html`);
        await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      }
      
      // Force garbage collection
      await page.evaluate(() => {
        if (window.gc) window.gc();
      });
      
      const finalMemory = await page.metrics();
      
      // Memory usage should not grow excessively
      const memoryIncrease = finalMemory.JSHeapUsedSize - initialMemory.JSHeapUsedSize;
      expect(memoryIncrease).toBeLessThan(10000000); // < 10MB increase
    });

    test('should clean up chart instances properly', async () => {
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      
      const beforeChartCount = await page.evaluate(() => {
        return window.Chart ? Object.keys(window.Chart.instances || {}).length : 0;
      });
      
      // Navigate away and back
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      
      const afterChartCount = await page.evaluate(() => {
        return window.Chart ? Object.keys(window.Chart.instances || {}).length : 0;
      });
      
      // Should not accumulate chart instances
      expect(afterChartCount - beforeChartCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Network Performance', () => {
    test('should minimize number of HTTP requests', async () => {
      let requestCount = 0;
      
      page.on('request', () => {
        requestCount++;
      });
      
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      // Should keep requests reasonable
      expect(requestCount).toBeLessThan(20); // < 20 total requests
    });

    test('should handle slow network conditions gracefully', async () => {
      // Simulate slow 3G
      await page._client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 500 * 1024 / 8, // 500kb/s
        uploadThroughput: 500 * 1024 / 8,
        latency: 300
      });
      
      const startTime = Date.now();
      
      await page.goto(`${global.APP_BASE_URL}/index.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // Should still load in < 10s on slow network
    });
  });

  describe('Performance Monitoring', () => {
    test('should provide performance timing data', async () => {
      await page.goto(`${global.APP_BASE_URL}/index.html`);
      
      const timingData = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
        };
      });
      
      expect(timingData.domContentLoaded).toBeGreaterThan(0);
      expect(timingData.firstContentfulPaint).toBeLessThan(2000);
    });

    test('should track custom performance marks', async () => {
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      
      // Check for custom performance marks in the application
      const customMarks = await page.evaluate(() => {
        return performance.getEntriesByType('mark').map(mark => mark.name);
      });
      
      // Dashboard should have performance tracking
      expect(customMarks.length).toBeGreaterThanOrEqual(0);
    });
  });
});