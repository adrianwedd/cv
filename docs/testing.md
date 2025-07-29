# Testing & Validation

This section outlines the testing and validation strategies employed in the AI-enhanced CV system to ensure code quality, data integrity, and reliable operation.

## Unit Testing

Unit tests are implemented for the core JavaScript business logic to ensure individual components function as expected. These tests are executed both locally and as part of the CI/CD pipeline.

### Framework

The project utilizes Node.js's built-in test runner (`node:test`). This lightweight framework provides basic testing capabilities without requiring external dependencies like Jest or Mocha.

### How to Run Tests

To execute the unit tests locally, navigate to the `.github/scripts` directory and run the following command:

```bash
npm test
```

This command will execute all files ending with `.test.js` within the `.github/scripts` directory.

### Test File Structure and Conventions

*   Test files are located alongside their respective source files in the `.github/scripts` directory.
*   Test files are named with the `.test.js` suffix (e.g., `activity-analyzer.test.js`).
*   Tests are structured using `suite()` for test suites and `test()` for individual test cases, as per `node:test` conventions.
*   `test.beforeEach()` and `test.afterEach()` hooks are used for setup and teardown operations, such as mocking API clients or environment variables.

## CI/CD Validation

Automated validation and linting steps are integrated into the CI/CD pipeline to enforce code quality, prevent syntax errors, and ensure the integrity of generated data assets before deployment.

### ESLint: Code Linting

ESLint is used to statically analyze the JavaScript code for programmatic errors, bugs, stylistic issues, and suspicious constructs. It helps maintain a consistent code style and catches potential issues early in the development cycle.

*   **Configuration**: The ESLint configuration is defined in `.eslintrc.js` within the `.github/scripts` directory.
*   **Execution**: The `npm run lint` command is executed as part of the CI pipeline.

### JSON Validation: Ensuring Data Integrity

All generated JSON data files (e.g., `activity-summary.json`, `ai-enhancements.json`) are validated in the CI pipeline to ensure they are well-formed and syntactically correct. This prevents malformed data from breaking downstream processes or the live CV.

*   **Tool**: `jq` is used for JSON validation.
*   **Execution**: A loop iterates through all `.json` files in the `data/` directory, and `jq . <file>` is used to parse and validate each file. Any parsing error will cause the CI step to fail.

### (Future) HTML Validation

While not yet fully implemented, a future enhancement will include HTML validation of the generated `dist/index.html` file. This will ensure that the output HTML adheres to web standards and is free of structural errors.
