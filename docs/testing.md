# Testing & Validation

This section outlines the testing and validation strategies employed in the AI-enhanced CV system to ensure code quality, data integrity, and reliable operation.

## Unit Testing

Unit tests are implemented for the core JavaScript and Python business logic to ensure individual components function as expected. These tests are executed both locally and as part of the CI/CD pipeline.

### Frameworks

*   **JavaScript**: The project utilizes Node.js's built-in test runner (`node:test`). This lightweight framework provides basic testing capabilities without requiring external dependencies like Jest or Mocha.
*   **Python**: A set of `unittest`-based tests exists under `src/python/`. These are **not** wired into any GitHub Actions workflow or the `npm test` gate — they are a standalone/experimental suite run manually (see below).

### How to Run Tests

To execute the unit tests locally:

*   **JavaScript Tests**: Navigate to the `.github/scripts` directory and run the following command:

    ```bash
    npm test
    ```

    The `test` script in `package.json` runs the Node test runner against an explicit list of test files: `activity-analyzer.test.js`, `claude-enhancer.test.js`, and `cv-generator.test.js` (`node --test --test-concurrency=1 ...`). It does not glob all `*.test.js` files, so any other `*.test.js` files in the directory are not run by `npm test`.

*   **Python Tests**: The test files use absolute imports (`from src.python.<mod> import ...`), so they must be run **from the repository root** — not from inside a module directory. Run all of them with:

    ```bash
    python3 -m pytest src/python
    # or, with unittest, from the repo root:
    python3 -m unittest discover -s . -p "test_*.py"
    ```

    Alternatively, you can run an individual test module directly (also from the repo root):

    ```bash
    python3 -m src.python.utils.test_logging_utils
    ```

    > **Note**: These Python tests are not invoked by any CI workflow; they are a manual/experimental suite.

### Test File Structure and Conventions

*   **JavaScript**: Test files are located alongside their respective source files in the `.github/scripts` directory. Test files are named with the `.test.js` suffix (e.g., `activity-analyzer.test.js`). Tests are structured using `suite()` for test suites and `test()` for individual test cases, as per `node:test` conventions.
*   **Python**: Test files are located within the respective module directories (e.g., `src/python/utils/test_logging_utils.py`). Test files are named with the `test_*.py` prefix (e.g., `test_logging_utils.py`). Tests are structured using `unittest.TestCase` classes and methods starting with `test_`.

`test.beforeEach()` and `test.afterEach()` hooks (for JavaScript) and `setUp()` and `tearDown()` methods (for Python) are used for setup and teardown operations, such as mocking API clients or environment variables.

## CI/CD Validation

Automated validation and linting steps are integrated into the CI/CD pipeline to enforce code quality, prevent syntax errors, and ensure the integrity of generated data assets before deployment.

### ESLint: Code Linting

ESLint is used to statically analyze the JavaScript code for programmatic errors, bugs, stylistic issues, and suspicious constructs. It helps maintain a consistent code style and catches potential issues early in the development cycle.

*   **Configuration**: The ESLint configuration is defined in `eslint.config.js` (the ESLint 9 flat-config format) within the `.github/scripts` directory.
*   **Execution**: The `npm run lint` command is executed as part of the CI pipeline.

### JSON Validation: Ensuring Data Integrity

All JSON data files in `data/` are validated to ensure they are well-formed and syntactically correct. This prevents malformed data from breaking downstream processes or the live CV.

*   **Tool**: The repo-root `npm run validate:json` script uses Node's `JSON.parse` (a one-liner over `data/*.json`), not `jq`.
*   **Execution**: The script iterates through all `.json` files in `data/` and parses each one; any parse error causes a non-zero exit.
*   **Note on `jq`**: `jq` is used elsewhere in `cv-enhancement.yml` for extracting individual metrics from JSON, but it is not the JSON-validation tool.

### (Future) HTML Validation

While not yet fully implemented, a future enhancement will include HTML validation of the generated `dist/index.html` file. This will ensure that the output HTML adheres to web standards and is free of structural errors.
