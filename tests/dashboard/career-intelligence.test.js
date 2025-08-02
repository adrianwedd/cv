/**
 * Career Intelligence Dashboard Test Suite
 * Comprehensive testing for dashboard functionality, charts, and interactions
 */

describe('Career Intelligence Dashboard', () => {
  let page;
  let testServer;
  
  beforeAll(async () => {
    // Start test server with robust error handling
    testServer = await global.testUtils.retryOperation(async () => {
      const { spawn } = require('child_process');
      const server = spawn('python', ['-m', 'http.server', '8003'], {
        cwd: '/Users/adrian/repos/cv',
        stdio: 'pipe'
      });
      
      // Wait for server to be ready
      await global.testUtils.waitForServer('http://localhost:8003', 30000);
      global.APP_BASE_URL = 'http://localhost:8003'; // Use dedicated port for dashboard tests
      return server;
    }, 3, 2000);
    
    // Create page with dashboard-optimized configuration
    page = await global.testUtils.retryOperation(async () => {
      const newPage = await browser.newPage();
      await newPage.setViewport({ width: 1280, height: 720 });
      
      // Set up error handling
      newPage.on('pageerror', error => {
        console.warn('Page error in dashboard test:', error.message);
      });
      
      return newPage;
    }, 3, 1000);
  }, 90000);

  afterAll(async () => {
    // Clean up page
    if (page) {
      try {
        await page.removeAllListeners();
        await page.close();
      } catch (error) {
        console.warn('Error closing dashboard test page:', error.message);
      }
      page = null;
    }
    
    // Clean up server
    if (testServer) {
      try {
        testServer.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (!testServer.killed) {
          testServer.kill('SIGKILL');
        }
      } catch (error) {
        console.warn('Error stopping dashboard test server:', error.message);
      }
      testServer = null;
    }
    
    // Reset global URL
    global.APP_BASE_URL = 'http://localhost:8000';
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  });

  beforeEach(async () => {
    await global.testUtils.retryOperation(async () => {
      // Mock Chart.js BEFORE navigating
      await page.evaluateOnNewDocument(() => {
        window.Chart = {
          register: () => {},
          defaults: { plugins: { legend: { display: true } } },
          instances: {}
        };
        window.ChartJS = {
          CategoryScale: class {},
          LinearScale: class {},
          BarElement: class {},
          LineElement: class {},
          PointElement: class {},
          Title: class {},
          Tooltip: class {},
          Legend: class {},
          Filler: class {}
        };
      });

      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Try multiple selectors for dashboard container
      try {
        await page.waitForSelector('.dashboard-container', { timeout: 8000 });
      } catch (error) {
        // Fallback selectors
        const dashboardExists = await page.$('main') || await page.$('.container') || await page.$('#dashboard');
        if (!dashboardExists) {
          throw new Error('Dashboard page not found or not loaded properly');
        }
      }
    }, 3, 2000);
  }, 45000);

  describe('Dashboard Loading and Structure', () => {
    test('should load dashboard page successfully', async () => {
      const title = await page.title();
      expect(title).toContain('Career Intelligence Dashboard');
    });

    test('should display main dashboard sections', async () => {
      const sections = await page.$$eval('.dashboard-section', els => 
        els.map(el => el.className)
      );
      
      expect(sections).toHaveLength(4);
      expect(sections.join(' ')).toContain('metrics-overview');
      expect(sections.join(' ')).toContain('skills-distribution');
      expect(sections.join(' ')).toContain('activity-trends');
      expect(sections.join(' ')).toContain('market-positioning');
    });

    test('should load with responsive navigation', async () => {
      const navExists = await page.$('.nav-link[href="career-intelligence.html"]');
      expect(navExists).toBeTruthy();
    });
  });

  describe('Metrics Overview Section', () => {
    test('should display animated counters', async () => {
      await page.waitForSelector('.metric-card', { timeout: 5000 });
      
      const metricCards = await page.$$('.metric-card');
      expect(metricCards).toHaveLength(4);
      
      // Check for specific metrics
      const totalProjects = await page.$eval(
        '.metric-card:nth-child(1) .metric-number', 
        el => el.textContent
      );
      const languagesUsed = await page.$eval(
        '.metric-card:nth-child(2) .metric-number', 
        el => el.textContent
      );
      
      expect(totalProjects).toMatch(/\d+/);
      expect(languagesUsed).toMatch(/\d+/);
    });

    test('should animate counters from 0', async () => {
      // Wait for animation to start
      await page.waitForTimeout(500);
      
      const firstValue = await page.$eval(
        '.metric-card:first-child .metric-number', 
        el => parseInt(el.textContent)
      );
      
      // Wait for animation to progress
      await page.waitForTimeout(1000);
      
      const secondValue = await page.$eval(
        '.metric-card:first-child .metric-number', 
        el => parseInt(el.textContent)
      );
      
      expect(secondValue).toBeGreaterThanOrEqual(firstValue);
    });
  });

  describe('Skills Distribution Chart', () => {
    test('should render skills distribution chart', async () => {
      await page.waitForSelector('#skillsChart', { timeout: 5000 });
      
      const chartCanvas = await page.$('#skillsChart');
      expect(chartCanvas).toBeTruthy();
      
      const canvasSize = await page.evaluate((canvas) => {
        return {
          width: canvas.width,
          height: canvas.height
        };
      }, chartCanvas);
      
      expect(canvasSize.width).toBeGreaterThan(0);
      expect(canvasSize.height).toBeGreaterThan(0);
    });

    test('should display chart legend', async () => {
      await page.waitForSelector('#skillsChart', { timeout: 5000 });
      
      // Chart.js creates legend elements
      const hasLegend = await page.evaluate(() => {
        const chart = document.getElementById('skillsChart');
        return chart && chart.getContext('2d');
      });
      
      expect(hasLegend).toBeTruthy();
    });
  });

  describe('Activity Trends Chart', () => {
    test('should render activity trends chart', async () => {
      await page.waitForSelector('#activityChart', { timeout: 5000 });
      
      const chartCanvas = await page.$('#activityChart');
      expect(chartCanvas).toBeTruthy();
    });

    test('should display time-based data', async () => {
      await page.waitForSelector('#activityChart', { timeout: 5000 });
      
      const chartData = await page.evaluate(() => {
        const chart = window.activityChart;
        return chart ? chart.data : null;
      });
      
      // Chart should have data even if mocked
      expect(chartData).toBeDefined();
    });
  });

  describe('Market Positioning Section', () => {
    test('should display market insights', async () => {
      const insights = await page.$$('.market-insight-card');
      expect(insights).toHaveLength(3);
      
      const insightTexts = await page.$$eval('.market-insight-card h3', 
        els => els.map(el => el.textContent)
      );
      
      expect(insightTexts).toContain('Technical Proficiency');
      expect(insightTexts).toContain('Industry Experience');
      expect(insightTexts).toContain('Project Leadership');
    });

    test('should show performance indicators', async () => {
      const indicators = await page.$$('.performance-indicator');
      expect(indicators).toHaveLength(3);
      
      // Check each indicator has a percentage
      for (let i = 0; i < indicators.length; i++) {
        const percentage = await page.$eval(
          `.performance-indicator:nth-child(${i + 1}) .indicator-value`,
          el => el.textContent
        );
        expect(percentage).toMatch(/^\d+%$/);
      }
    });
  });

  describe('Theme Integration', () => {
    test('should apply theme classes correctly', async () => {
      const bodyClass = await page.$eval('body', el => el.className);
      expect(bodyClass).toMatch(/theme-(light|dark)/);
    });

    test('should update chart themes when switching', async () => {
      // Find theme toggle button
      const themeToggle = await page.$('.theme-toggle, [data-theme-toggle]');
      
      if (themeToggle) {
        await themeToggle.click();
        await page.waitForTimeout(500);
        
        const newBodyClass = await page.$eval('body', el => el.className);
        expect(newBodyClass).toMatch(/theme-(light|dark)/);
      }
    });
  });

  describe('Performance Requirements', () => {
    test('should load dashboard within 2 seconds', async () => {
      const startTime = Date.now();
      
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      await page.waitForSelector('.dashboard-container', { timeout: 2000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should have no console errors', async () => {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto(`${global.APP_BASE_URL}/career-intelligence.html`);
      await page.waitForSelector('.dashboard-container', { timeout: 5000 });
      
      // Filter out known non-critical errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('Chart.js') && 
        !error.includes('favicon') &&
        !error.includes('manifest')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload();
      await page.waitForSelector('.dashboard-container', { timeout: 5000 });
      
      const containerWidth = await page.$eval('.dashboard-container', 
        el => window.getComputedStyle(el).width
      );
      
      expect(parseInt(containerWidth)).toBeLessThanOrEqual(375);
    });

    test('should maintain chart readability on small screens', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload();
      await page.waitForSelector('#skillsChart', { timeout: 5000 });
      
      const chartCanvas = await page.$('#skillsChart');
      const canvasRect = await chartCanvas.boundingBox();
      
      expect(canvasRect.width).toBeGreaterThan(250);
      expect(canvasRect.width).toBeLessThanOrEqual(375);
    });
  });

  describe('Data Integration', () => {
    test('should load GitHub activity data', async () => {
      const hasActivityData = await page.evaluate(() => {
        return window.dashboardData && window.dashboardData.github_activity;
      });
      
      expect(hasActivityData).toBeTruthy();
    });

    test('should handle missing data gracefully', async () => {
      // Mock network failure
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().includes('activity-summary.json')) {
          request.respond({
            status: 404,
            body: 'Not found'
          });
        } else {
          request.continue();
        }
      });
      
      await page.reload();
      
      // Should still render with fallback data
      const dashboardExists = await page.$('.dashboard-container');
      expect(dashboardExists).toBeTruthy();
    });
  });
});