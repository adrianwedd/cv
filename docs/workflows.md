## `📊 GitHub Activity Intelligence Tracker` (`activity-tracker.yml`)

This workflow collects GitHub activity data and processes it into structured metrics.

### Triggers & Scheduling
*   **Cron Schedule**: `0 20 * * *` (Daily at 20:00 UTC / ~6 AM AEST / ~7 AM AEDT).
*   **Concurrency**: Shares the `cv-pipeline` concurrency group with `cv-enhancement.yml` so the two workflows never run simultaneously and avoid races on shared `data/` files.

### Jobs

#### 1. `📊 GitHub Activity Intelligence Collection` (`activity-intelligence`)
This job collects raw GitHub activity data and processes it into structured metrics. Note: collection is performed **inline** in the workflow steps (git/curl/jq); the standalone `activity-analyzer.js` script is not invoked by this workflow.

*   **Runs on**: `ubuntu-latest`
*   **Permissions**:
    *   `contents: write`: To commit updated activity data files.
*   **Steps** (in order):
    *   **`📥 Repository Checkout`**: Checks out the repository code.
    *   **`📦 Setup Node.js Environment`**: Sets up the Node.js environment for subsequent steps, leveraging npm cache.
    *   **`🔧 Install Activity Analysis Dependencies`**: Installs Node.js dependencies via `npm ci` (runs after Node setup).
    *   **`📊 Comprehensive Repository Activity Analysis`**: Performs local Git log analysis to extract commit counts, active days, and lines of code changes.
    *   **`🌐 GitHub API Activity Collection`**: Collects detailed GitHub API data, including user profile, repositories, events, and organization data.
    *   **`📈 Activity Trend Analysis`**: Analyzes activity patterns over different time periods to identify trends.
    *   **`🔄 Update Master Activity Summary`**: Compiles all collected and processed data into a master `activity-summary.json` file.
    *   **`🚀 Commit Activity Data`**: Commits the updated activity data files back to the repository.
    *   **`📊 Repository Metrics Summary`**: Provides a summary of repository metrics for the run.

### Integrating Python Utilities in Workflows

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

## `🚀 CV Auto-Enhancement Pipeline` (`cv-enhancement.yml`)

This workflow orchestrates the entire CV enhancement process, from initial intelligence analysis to AI-powered content optimization, dynamic website generation, and deployment to GitHub Pages.

### Purpose
To provide intelligent, continuous CV enhancement using GitHub activity analysis and Claude AI optimization, ensuring an up-to-date and compelling professional profile.

### Triggers
*   **`schedule`**: Runs automatically at specified intervals for continuous enhancement.
    *   **Cron Schedule**: `0 21 * * *` (Daily at 21:00 UTC / ~8 AM AEDT / ~7 AM AEST).
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
    *   `contents: write`: To commit enhanced CV data and the generated assets back to `main`. (This is the only permission declared — there is no `pages: write` or `id-token: write`, because deployment is a git commit to `main` rather than an OIDC GitHub Pages deploy.)
*   **Steps** (in order):
    *   **`🚀 CV Enhancement Pipeline Initialization`**: Displays initial workflow parameters and outputs from the pre-analysis job.
    *   **`📥 Repository Checkout`**: Checks out the repository code.
    *   **`📦 Setup Node.js Environment`**: Sets up the Node.js environment.
    *   **`🔧 Install Dependencies`**: Installs Node.js dependencies via `npm ci`.
    *   **`✅ Run Unit Tests`**: Executes unit tests for the `.github/scripts` components (runs after Node setup and dependency install).
    *   **`🌐 Install Browser Dependencies`**: Installs necessary browser dependencies for Puppeteer (used in PDF generation).
    *   **`📊 GitHub Activity Data Collection`**: Collects comprehensive GitHub activity data (if not `ai-only` mode).
    *   **`🔍 Comprehensive GitHub Data Mining`**: Initiates comprehensive GitHub data mining and narrative generation (for `comprehensive` or `full-rebuild` strategies).
    *   **`🤖 Claude AI Content Enhancement`**: Initiates AI-powered content enhancement using Claude (if AI budget is sufficient).
    *   **`Content Validation Gate`**: The deployment-blocking validation gate, combining `ai-hallucination-detector.js` (fails if confidence < 70), `content-guardian.js --validate`, and `keyword-scorer.js` (soft gate). This step runs **between** the enhancer and the generator. (It is conditionally skipped when the pre-analysis `ai-budget` output is `insufficient`.)
    *   **`🎨 Dynamic CV Website Generation`**: Runs `cv-generator.js` to generate the dynamic CV website into `dist/`.
    *   **`📄 Verify PDF Asset Generation`**: Verifies that a PDF asset exists (this step checks for an existing PDF; it does not itself generate one).
    *   **`🚀 Deploy Generated Assets to Main Branch`**: Copies the built `dist/` output back into the working tree on `main` and commits it (GitHub Pages serves `main` root). This is not a GitHub Pages deploy action.
    *   **`📈 Usage Analytics Recording`**: Records usage analytics for the enhancement session.
    *   **`🚀 Commit Enhanced CV Data`**: Commits the updated CV data back to the repository.
    *   **`🎯 Enhancement Summary`**: Provides a summary of the CV enhancement execution.
    *   **`📊 Workflow Summary Report`**: Generates a detailed summary report visible in the GitHub Actions UI.

### Integrating Python Utilities in Workflows

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
