# GitHub Actions Workflows

This document serves as the comprehensive and authoritative reference for all GitHub Actions workflows within this project. It details the purpose, triggers, environment variables, and jobs for each workflow, providing a centralized source of truth for understanding the automated processes that power the AI-enhanced CV system.

### Workflows Overview

| Workflow Name | Purpose |
|---|---|
| `📈 Activity Tracker` (`activity-tracker.yml`) | Continuously tracks and analyzes GitHub activity. |
| `🚀 CV Auto-Enhancement Pipeline` (`cv-enhancement.yml`) | Orchestrates the entire CV enhancement process, from initial intelligence analysis to AI-powered content optimization, dynamic website generation, and deployment to GitHub Pages. |
| `🎭 Granular Workflow Visualization` (`cv-enhancement-visualized.yml`) | A specialized version of the CV Auto-Enhancement Pipeline, designed to provide granular visualization of each job and step within the GitHub Actions UI. |

---

## `📈 Activity Tracker` (`activity-tracker.yml`)

This workflow is dedicated to continuously tracking and analyzing GitHub activity, providing up-to-date metrics for the CV system.

### Purpose
To provide continuous, real-time GitHub activity data for the AI-enhanced CV system, ensuring that professional development metrics are always current.

### Triggers
*   **`schedule`**: Runs automatically at specified intervals.
    *   **Cron Schedule**: `0 */2 * * *` (Runs every 2 hours).
*   **`workflow_dispatch`**: Allows manual triggering of the workflow from the GitHub Actions UI.

### Environment Variables
*   `TIMEZONE`: Timezone used for timestamping (`Australia/Tasmania`).

### Jobs

#### 1. `📊 GitHub Activity Intelligence Collection` (`activity-intelligence`)
This job collects raw GitHub activity data and processes it into structured metrics.

*   **Runs on**: `ubuntu-latest`
*   **Permissions**:
    *   `contents: write`: To commit updated activity data files.
*   **Steps**:
    *   **`🚀 Activity Tracker Initialization`**: Displays initial workflow parameters.
    *   **`📥 Repository Checkout`**: Checks out the repository code.
    *   **`🔧 Install Activity Analysis Dependencies (Pre-cache)`**: Installs Node.js dependencies for the analysis scripts, ensuring `package-lock.json` is generated for caching.
    *   **`📦 Setup Node.js Environment`**: Sets up the Node.js environment for subsequent steps, leveraging npm cache.
    *   **`📊 Comprehensive Repository Activity Analysis`**: Performs local Git log analysis to extract commit counts, active days, and lines of code changes.
    *   **`🌐 GitHub API Activity Collection`**: Collects detailed GitHub API data, including user profile, repositories, events, and organization data.
    *   **`🎯 Professional Development Metrics`**: Calculates various professional development scores (Activity, Diversity, Impact) and trends based on collected data.
    *   **`📈 Activity Trend Analysis`**: Analyzes activity patterns over different time periods to identify trends.
    *   **`🔄 Update Master Activity Summary`**: Compiles all collected and processed data into a master `activity-summary.json` file.
    *   **`🚀 Commit Activity Data`**: Commits the updated activity data files back to the repository.
    *   **`📊 Activity Tracking Summary`**: Provides a summary of the activity tracking execution.
    *   **`📈 Workflow Performance Report`**: Generates a detailed summary report visible in the GitHub Actions UI.

---

## `🚀 CV Auto-Enhancement Pipeline` (`cv-enhancement.yml`)

This workflow orchestrates the entire CV enhancement process, from initial intelligence analysis to AI-powered content optimization, dynamic website generation, and deployment to GitHub Pages.

### Purpose
To provide intelligent, continuous CV enhancement using GitHub activity analysis and Claude AI optimization, ensuring an up-to-date and compelling professional profile.

### Triggers
*   **`schedule`**: Runs automatically at specified intervals for continuous enhancement.
    *   **Cron Schedule**: `0 14,20,2,8 * * *` (Runs every 6 hours).
*   **`workflow_dispatch`**: Allows manual triggering of the workflow from the GitHub Actions UI, with customizable inputs.
    *   **`enhancement_mode`**: Defines the overall enhancement strategy.
        *   `comprehensive` (default)
        *   `activity-only`
        *   `ai-only`
        *   `emergency-update`
    *   **`force_refresh`**: Boolean (default: `false`). Forces a complete data refresh.
    *   **`ai_creativity`**: Defines the AI enhancement creativity level.
        *   `conservative`
        *   `balanced` (default)
        *   `creative`
        *   `innovative`

### Environment Variables
*   `CV_SYSTEM_VERSION`: Current version of the CV system (`v2.0`).
*   `TIMEZONE`: Timezone used for timestamping (`Australia/Tasmania`).

### Jobs

#### 1. `🧠 CV Intelligence Pre-Analysis` (`cv-intelligence-analysis`)
This job performs initial analysis and determines the optimal enhancement strategy based on various factors.

*   **Runs on**: `ubuntu-latest`
*   **Outputs**:
    *   `enhancement-strategy`: The determined strategy (e.g., `comprehensive`, `full-rebuild`).
    *   `activity-score`: The calculated GitHub activity score.
    *   `content-health`: Assessment of CV content health.
    *   `ai-budget`: Status of the AI token budget.
*   **Steps**:
    *   **`🚀 CV Enhancement System Initialization`**: Displays initial workflow parameters.
    *   **`📥 Repository Checkout`**: Checks out the repository code.
    *   **`🎯 Enhancement Strategy Determination`**: Determines the overall enhancement strategy based on inputs and internal logic.
    *   **`📊 GitHub Activity Analysis`**: Analyzes GitHub activity for CV enhancement, calculating an activity score.
    *   **`🔍 Content Health Assessment`**: Assesses the health and completeness of CV content files.
    *   **`💰 AI Budget Analysis`**: Analyzes the available AI token budget and determines if it's sufficient for enhancement.

#### 2. `🎯 CV Enhancement Execution` (`cv-enhancement-pipeline`)
This job executes the main CV enhancement process, leveraging the outputs from the pre-analysis job.

*   **Runs on**: `ubuntu-latest`
*   **Needs**: `cv-intelligence-analysis` (ensures pre-analysis completes successfully).
*   **Permissions**:
    *   `contents: write`: To commit enhanced CV data.
    *   `pages: write`: For deploying to GitHub Pages.
    *   `id-token: write`: For OIDC authentication with GitHub Pages.
*   **Steps**:
    *   **`🚀 CV Enhancement Pipeline Initialization`**: Displays initial workflow parameters and outputs from the pre-analysis job.
    *   **`📥 Repository Checkout`**: Checks out the repository code.
    *   **`🔧 Install Dependencies (Pre-cache)`**: Installs Node.js dependencies for the enhancement scripts.
    *   **`✅ Run Unit Tests`**: Executes unit tests for the `.github/scripts` components.
    *   **`📦 Setup Node.js Environment`**: Sets up the Node.js environment.
    *   **`🌐 Install Browser Dependencies`**: Installs necessary browser dependencies for Puppeteer (used in PDF generation).
    *   **`📊 GitHub Activity Data Collection`**: Collects comprehensive GitHub activity data (if not `ai-only` mode).
    *   **`🔍 Comprehensive GitHub Data Mining`**: Initiates comprehensive GitHub data mining and narrative generation (for `comprehensive` or `full-rebuild` strategies).
    *   **`🤖 Claude AI Content Enhancement`**: Initiates AI-powered content enhancement using Claude (if AI budget is sufficient).
    *   **`🔍 AI Claim Verification`**: Verifies AI-generated claims against GitHub data.
    *   **`📊 Professional Metrics Calculation`**: Calculates professional development metrics.
    *   **`🎨 Dynamic CV Website Generation`**: Generates the dynamic CV website.
    *   **`✅ Validate & Lint Generated Assets`**: Validates JSON files and lints JavaScript assets.
    *   **`📄 Generate PDF Asset`**: Generates the PDF version of the CV using Puppeteer.
    *   **`🚀 Deploy to GitHub Pages`**: Deploys the generated website to GitHub Pages.
    *   **`📈 Usage Analytics Recording`**: Records usage analytics for the enhancement session.
    *   **`🚀 Commit Enhanced CV Data`**: Commits the updated CV data back to the repository.
    *   **`🎯 Enhancement Summary`**: Provides a summary of the CV enhancement execution.
    *   **`📊 Workflow Summary Report`**: Generates a detailed summary report visible in the GitHub Actions UI.

---

## `🎭 Granular Workflow Visualization` (`cv-enhancement-visualized.yml`)

This workflow is a specialized version of the `cv-enhancement.yml` pipeline, designed to provide granular visualization of each job and step within the GitHub Actions UI. It leverages advanced GitHub Actions features to bubble up status, URLs, and metrics directly into the workflow graph, enhancing transparency and operational insight.

### Purpose
To demonstrate and implement best practices for GitHub Actions workflow visualization, providing real-time, actionable insights into the CV enhancement pipeline's status, performance, and cost.

### Triggers
*   **`workflow_dispatch`**: Manual triggering from the GitHub Actions UI.
    *   **`enhancement_mode`**: (Same as `cv-enhancement.yml`)
    *   **`force_refresh`**: (Same as `cv-enhancement.yml`)
    *   **`ai_creativity`**: (Same as `cv-enhancement.yml`)

### Environment Variables
*   `CV_SYSTEM_VERSION`: Current version of the CV system (`v2.0`).
*   `TIMEZONE`: Timezone used for timestamping (`Australia/Tasmania`).

### Jobs

#### 1. `🧠 CV Intelligence Pre-Analysis (Visualized)` (`cv-intelligence-analysis-visualized`)
This job performs initial analysis and determines the optimal enhancement strategy, with enhanced visualization.

*   **Runs on**: `ubuntu-latest`
*   **Outputs**: (Same as `cv-intelligence-analysis`)
*   **Steps**:
    *   **`🚀 CV Enhancement System Initialization (Visualized)`**: Displays initial workflow parameters and sets job summary.
    *   **`📥 Repository Checkout`**: Checks out the repository code.
    *   **`🎯 Enhancement Strategy Determination (Visualized)`**: Determines the overall enhancement strategy and updates job summary with strategy.
    *   **`📊 GitHub Activity Analysis (Visualized)`**: Analyzes GitHub activity and updates job summary with activity score.
    *   **`🔍 Content Health Assessment (Visualized)`**: Assesses content health and updates job summary.
    *   **`💰 AI Budget Analysis (Visualized)`**: Analyzes AI budget and updates job summary.
    *   **`✅ Job Summary Output`**: Finalizes job summary with key outputs.

#### 2. `🎯 CV Enhancement Execution (Visualized)` (`cv-enhancement-pipeline-visualized`)
This job executes the main CV enhancement process with granular visualization for each step.

*   **Runs on**: `ubuntu-latest`
*   **Needs**: `cv-intelligence-analysis-visualized`
*   **Permissions**: (Same as `cv-enhancement-pipeline`)
*   **Steps**:
    *   **`🚀 CV Enhancement Pipeline Initialization (Visualized)`**: Displays initial workflow parameters and sets job summary.
    *   **`📥 Repository Checkout`**: Checks out the repository code.
    *   **`🔧 Install Dependencies (Visualized)`**: Installs Node.js dependencies and updates job summary.
    *   **`✅ Run Unit Tests (Visualized)`**: Executes unit tests and updates job summary with test results.
    *   **`📦 Setup Node.js Environment (Visualized)`**: Sets up the Node.js environment and updates job summary.
    *   **`🌐 Install Browser Dependencies (Visualized)`**: Installs browser dependencies and updates job summary.
    *   **`📊 GitHub Activity Data Collection (Visualized)`**: Collects GitHub activity data and updates job summary.
    *   **`🔍 Comprehensive GitHub Data Mining (Visualized)`**: Initiates data mining and updates job summary.
    *   **`🤖 Claude AI Content Enhancement (Visualized)`**: Initiates AI enhancement and updates job summary with token usage.
    *   **`🔍 AI Claim Verification (Visualized)`**: Verifies AI claims and updates job summary with verification status.
    *   **`📊 Professional Metrics Calculation (Visualized)`**: Calculates metrics and updates job summary.
    *   **`🎨 Dynamic CV Website Generation (Visualized)`**: Generates website and updates job summary with build status.
    *   **`✅ Validate & Lint Generated Assets (Visualized)`**: Validates assets and updates job summary with linting results.
    *   **`📄 Generate PDF Asset (Visualized)`**: Generates PDF and updates job summary with PDF status.
    *   **`🚀 Deploy to GitHub Pages (Visualized)`**: Deploys to GitHub Pages and updates job summary with deployment URL.
    *   **`📈 Usage Analytics Recording (Visualized)`**: Records usage analytics for the enhancement session.
    *   **`🚀 Commit Enhanced CV Data (Visualized)`**: Commits data and updates job summary with commit details.
    *   **`🎯 Enhancement Summary (Visualized)`**: Provides final summary and updates job summary.
    *   **`✅ Job Summary Output`**: Finalizes job summary with key outputs and badges.

---

## Integrating Python Utilities in Workflows

The project now includes a suite of Python utilities (`src/python/`) that can be leveraged within GitHub Actions workflows to enhance functionality, improve data processing, and provide more robust solutions.

**General Approach:**
To use Python scripts within a GitHub Actions job, you typically need to:
1.  **Set up Python:** Use `actions/setup-python@v5` to set up a Python environment.
2.  **Install Dependencies:** Install any Python dependencies using `pip` (e.g., from a `requirements.txt` file).
3.  **Run Python Script:** Execute your Python script using `python your_script.py`.

**Example Integration (Conceptual):**
```yaml
- name: 🐍 Setup Python Environment
  uses: actions/setup-python@v5
  with:
    python-version: '3.x' # Specify your Python version

- name: 📦 Install Python Dependencies
  run: pip install -r requirements.txt # If you have a requirements.txt

- name: 📊 Run Python Data Validation
  run: python src/python/data_validation/data_validator.py # Example usage
```

**Potential Enhancements using Python Utilities:**
*   **`logging_utils.py`**: Integrate for more structured and persistent logging within workflow steps, especially for complex data processing or API interactions.
*   **`api_wrappers/external_apis.py`**: Utilize for more robust and maintainable interactions with external APIs (e.g., firmographics, funding data) directly from Python scripts within the workflow.
*   **`config_manager/config_manager.py`**: Externalize workflow configurations into `.ini` files managed by this utility, allowing for easier updates without modifying the workflow YAML directly.
*   **`data_validation/data_validator.py`**: Implement dedicated Python steps to validate the integrity and format of collected data before it's used in subsequent stages, enhancing data quality assurance.
