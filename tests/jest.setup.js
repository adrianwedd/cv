/**
 * Jest Setup Configuration
 * Configures testing environment for CV system enterprise testing
 */

// Extend Jest matchers
require('jest-extended');

// Set up global test configuration
global.APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8002';
global.TEST_TIMEOUT = 60000; // Increased for CI stability
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
  
  waitForServer: async (url = global.APP_BASE_URL, timeout = 30000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Server at ${url} not ready after ${timeout}ms`);
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