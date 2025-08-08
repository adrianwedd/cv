/**
 * Jest Setup Configuration
 * Configures testing environment for CV system enterprise testing
 */

// Extend Jest matchers (CommonJS for Jest compatibility)
require('jest-extended');

// ES Module compatibility for browser tests
// Suppress ES module import errors that don't affect browser functionality
global.suppressESModuleErrors = true;

// Node.js fetch polyfill for older versions
if (!global.fetch) {
  try {
    global.fetch = require('node-fetch');
  } catch (error) {
    // Fallback if node-fetch not available
    console.warn('node-fetch not available, using manual HTTP requests');
  }
}

// Set up global test configuration
global.APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8001';
global.TEST_TIMEOUT = 30000; // Optimized for performance
global.RETRY_COUNT = process.env.CI ? 3 : 1; // Retry failed tests in CI

// Mock localStorage for puppeteer tests
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Set up error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global test utilities with bulletproof error handling
global.testUtils = {
  waitFor: (condition, timeout = 10000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkCondition = async () => {
        try {
          if (await condition()) {
            resolve();
          } else if (Date.now() - startTime >= timeout) {
            reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
          } else {
            setTimeout(checkCondition, 200); // Increased interval for stability
          }
        } catch (error) {
          reject(new Error(`Condition check failed: ${error.message}`));
        }
      };
      checkCondition();
    });
  },
  
  retryOperation: async (operation, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
        }
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },
  
  mockFetch: (response, options = {}) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
        ...options
      })
    );
  },
  
  waitForServer: async (url = global.APP_BASE_URL, timeout = 15000) => {
    const startTime = Date.now();
    let lastError = null;
    
    while (Date.now() - startTime < timeout) {
      try {
        // Use http module for more reliable server checking
        const { default: http } = await import('http');
        const urlObj = new URL(url);
        
        await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'GET',
            timeout: 2000
          }, (res) => {
            resolve(res.statusCode < 400);
          });
          
          req.on('error', reject);
          req.on('timeout', () => reject(new Error('Request timeout')));
          req.end();
        });
        
        return true;
      } catch (error) {
        lastError = error;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Server at ${url} not ready after ${timeout}ms. Last error: ${lastError?.message || 'Unknown'}`);
  },
  
  safePageOperation: async (page, operation) => {
    try {
      return await operation(page);
    } catch (error) {
      // Capture screenshot for debugging
      try {
        await page.screenshot({ path: `debug-${Date.now()}.png` });
      } catch (screenshotError) {
        console.warn('Failed to capture debug screenshot:', screenshotError.message);
      }
      throw error;
    }
  },
  
  // Enhanced page error handling with ES module error suppression
  setupPageErrorHandling: async (page) => {
    page.on('pageerror', error => {
      // Suppress ES module errors that don't affect functionality
      if (error.message.includes('Cannot use import statement outside a module') ||
          error.message.includes('Unexpected token \'import\'') ||
          error.message.includes('import declarations may only appear at top level')) {
        console.debug('Suppressed ES module error (non-critical):', error.message);
        return;
      }
      
      // Log other errors normally
      if (!error.message.includes('favicon') && 
          !error.message.includes('Chart.js') &&
          !error.message.includes('manifest')) {
        console.warn('Page error:', error.message);
      }
    });
    
    return page;
  },
  
  // Simple HTTP server for tests
  startTestServer: async (port = 8000, rootDir = null) => {
    const { default: http } = await import('http');
    const { default: fs } = await import('fs');
    const { default: path } = await import('path');
    
    rootDir = rootDir || path.resolve(__dirname, '..');
    
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        let filePath = path.join(rootDir, req.url === '/' ? 'index.html' : req.url);
        
        // Security check
        if (!filePath.startsWith(rootDir)) {
          filePath = path.join(rootDir, 'index.html');
        }
        
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
          }
          
          const ext = path.extname(filePath).toLowerCase();
          const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json'
          };
          
          res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
          res.end(data);
        });
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} in use, server likely already running`);
          resolve(server);
        } else {
          reject(err);
        }
      });
      
      server.listen(port, () => {
        console.log(`✅ Test server started on port ${port}`);
        resolve(server);
      });
    });
  }
};

// Console error handling for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});