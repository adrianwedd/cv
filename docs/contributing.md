# Contribution Guidelines

We welcome contributions to the AI-enhanced CV system! By following these guidelines, you can help ensure the quality, consistency, and maintainability of the project.

## Getting Started

To set up your local development environment, follow these steps:

1.  **Fork the Repository**: Fork the `adrianwedd/cv` repository to your GitHub account.
2.  **Clone Your Fork**: Clone your forked repository to your local machine:

    ```bash
    git clone https://github.com/YOUR_USERNAME/cv.git
    cd cv
    ```
3.  **Install Dependencies**: Navigate to the `scripts` directory and install the Node.js dependencies:

    ```bash
    cd .github/scripts
    npm install
    cd ../..
    ```
4.  **Set up Environment Variables**: The scripts require certain environment variables to function correctly. Create a `.env` file in the project root (or set them in your shell environment):

    ```
    GITHUB_TOKEN=your_github_personal_access_token
    ANTHROPIC_API_KEY=your_claude_api_key
    # Optional: CUSTOM_DOMAIN=your.custom.domain
    ```
    *   **GitHub Token**: Generate a [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `repo` scope.
    *   **Claude API Key**: Obtain an API key from [Anthropic](https://www.anthropic.com/).

## Running Scripts Locally

You can run the core scripts locally for development and testing:

*   **Analyze GitHub Activity**:

    ```bash
    node .github/scripts/activity-analyzer.js
    ```
*   **Enhance CV Content with AI**:

    ```bash
    node .github/scripts/claude-enhancer.js
    ```
*   **Generate CV Website**:

    ```bash
    node .github/scripts/cv-generator.js
    ```

## Code Style and Linting

We use ESLint and Prettier to maintain consistent code style and quality. Please ensure your code adheres to these standards.

*   **Linting**: Check for code quality issues:

    ```bash
    cd .github/scripts
    npm run lint
    ```
*   **Formatting**: Automatically format your code:

    ```bash
    cd .github/scripts
    npm run format
    ```

## Running Tests

Unit tests are implemented using Node.js's native test runner. Please run tests before submitting a pull request.

*   **Execute Tests**:

    ```bash
    cd .github/scripts
    npm test
    ```

## Submitting Pull Requests

1.  **Create a New Branch**: Create a new branch for your feature or bug fix:

    ```bash
    git checkout -b feature/your-feature-name
    ```
2.  **Make Changes**: Implement your changes, ensuring they adhere to the code style and pass all tests.
3.  **Commit Changes**: Write clear, concise commit messages. Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat: Add new feature`, `fix: Resolve bug`).
4.  **Push to Your Fork**: Push your changes to your forked repository:

    ```bash
    git push origin feature/your-feature-name
    ```
5.  **Create a Pull Request**: Open a pull request from your forked repository to the `main` branch of the upstream `adrianwedd/cv` repository. Provide a clear description of your changes and link to any relevant issues.

## Issue Management

This project uses a structured approach to issue management. Please refer to the `GROOMER` prompt (documented in `@GROOMER.md`) for details on issue categorization, prioritization, and lifecycle.

*   **Bug Reports**: Use the `bug` label.
*   **Feature Requests**: Use the `enhancement` label.
*   **Documentation Issues**: Use the `documentation` label.
*   **CI/CD Issues**: Use the `ci-cd` label.

Thank you for contributing to the AI-enhanced CV system!
