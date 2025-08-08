/**
 * Enterprise Test Configuration
 * Bulletproof test environment with proper mocking and isolation
 */

// Test Environment Configuration
const TEST_CONFIG = {
  // Disable real API calls during testing
  DISABLE_EXTERNAL_APIS: true,
  
  // Mock authentication responses
  MOCK_AUTH_SUCCESS: true,
  
  // Test timeouts (in milliseconds) - Aggressive timeouts to prevent hanging
  UNIT_TEST_TIMEOUT: 5000,      // 5 seconds for unit tests
  INTEGRATION_TIMEOUT: 15000,   // 15 seconds for integration tests
  E2E_TIMEOUT: 60000,          // 60 seconds for E2E tests (manual only)
  API_TIMEOUT: 2000,           // 2 seconds for mocked API calls
  
  // Test data paths
  TEST_DATA_DIR: './test-data',
  MOCK_DATA_DIR: './test-data/mocks',
  
  // Coverage thresholds
  COVERAGE_THRESHOLD: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80
  },
  
  // Test execution control
  FAST_TESTS_ONLY: process.env.TEST_MODE === 'unit',
  DISABLE_BROWSER_TESTS: process.env.DISABLE_BROWSER === 'true',
  DISABLE_NETWORK_TESTS: process.env.DISABLE_NETWORK === 'true'
};

// Environment setup for tests
function setupTestEnvironment() {
  // Override API endpoints for testing
  process.env.NODE_ENV = 'test';
  process.env.ANTHROPIC_API_KEY = 'test-key-mock';
  process.env.GITHUB_TOKEN = 'test-token-mock';
  
  // Disable real network requests
  process.env.DISABLE_NETWORK = 'true';
  
  // Set test-specific paths
  process.env.TEST_MODE = 'true';
}

// Mock API responses
const MOCK_RESPONSES = {
  claude: {
    success: {
      content: [{
        text: "Enhanced professional content"
      }],
      usage: {
        input_tokens: 100,
        output_tokens: 200
      }
    },
    auth_error: {
      type: "error",
      error: {
        type: "authentication_error",
        message: "invalid x-api-key"
      }
    }
  },
  
  github: {
    user: {
      login: "adrianwedd",
      public_repos: 50,
      followers: 25
    },
    repos: [
      {
        name: "cv",
        language: "JavaScript",
        stargazers_count: 10,
        updated_at: "2025-08-02T00:00:00Z"
      }
    ]
  }
};

// Export configuration
export {
  TEST_CONFIG,
  setupTestEnvironment,
  MOCK_RESPONSES
};