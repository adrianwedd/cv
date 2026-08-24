## `GitHub Activity Tracker` (`activity-tracker.yml`)

Evidence ingestion, stage 1 of the CV pipeline. This workflow collects real cross-account GitHub activity via `activity-collector.js` — **not** this repo's own git log, which is dominated by automation commits.

### Triggers & Scheduling
*   **Cron Schedule**: `0 20 * * *` (Daily at 20:00 UTC / ~6 AM AEST / ~7 AM AEDT). The daily run is cheap (no AI) and commits only when the evidence materially changed.
*   **`workflow_dispatch`**: Manual trigger from the GitHub Actions UI.
*   **Concurrency**: Shares the `cv-pipeline` concurrency group with `cv-enhancement.yml` so the two workflows never run simultaneously and avoid races on shared `data/` files.

### Jobs

#### 1. `Collect and compare activity evidence` (`collect`)

*   **Runs on**: `ubuntu-latest`
*   **Permissions**:
    *   `contents: write`: To commit updated activity data files.
*   **Steps** (in order):
    *   **`Checkout`** / **`Setup Node.js`**: Standard environment setup.
    *   **`Snapshot previous evidence`**: Saves the current `data/github-activity.json` for comparison.
    *   **`Collect cross-repo activity`**: Runs `activity-collector.js` (GraphQL contribution calendar + REST repo/event/commit-search data), writing `data/github-activity.json` and `data/activity-summary.json`.
    *   **`Detect material change`**: Compares the new snapshot against the previous one. "Material" means commit volume changed by ±25% *and* ≥10 commits, the active-repository count changed, or the language mix changed.
    *   **`Commit evidence update`**: Commits the updated evidence files — only when the change was material.
    *   **`Restore unchanged evidence`**: If nothing material changed, restores the previous snapshot so no churn commit is produced.
    *   **`Trigger CV enhancement pipeline`**: On material change, sends a `repository_dispatch` event of type `cv-evidence-changed` to start `cv-enhancement.yml`. This requires the `PERSONAL_ACCESS_TOKEN` secret — the default `GITHUB_TOKEN` cannot start other workflows.
    *   **`Summary`**: Reports the run outcome in the Actions UI.

## `CV Enhancement Pipeline` (`cv-enhancement.yml`)

This workflow orchestrates the CV enhancement process: evidence ingestion, AI content proposals, verification, validation, website/PDF generation, and deployment to GitHub Pages. Every stage reports an explicit outcome (SUCCESS / SKIPPED / FAILED); a failed stage is reported honestly, never laundered into downstream success.

### Purpose
To keep the CV current using GitHub activity evidence and AI-proposed, verification-gated content improvements — ensuring an up-to-date professional profile without fabricated claims.

### Triggers
*   **`schedule`**: `0 21 * * 1` (Weekly, Mondays at 21:00 UTC) — a maintenance run.
*   **`repository_dispatch`** (type `cv-evidence-changed`): Sent by the activity tracker when GitHub evidence materially changed.
*   **`workflow_dispatch`**: Manual triggering from the GitHub Actions UI.
    *   **`dry_run`**: Boolean (default: `false`). Generate proposals only — do not apply, render, or publish.

### Environment Variables
*   `TIMEZONE`: Timezone used for timestamping (`Australia/Tasmania`).
*   `AI_PROVIDER`: AI provider selection (default `openrouter`).
*   `AI_MODEL`: Model selection (default `deepseek/deepseek-v4-flash`).

### Jobs

#### 1. `Enhance, Validate, Publish` (`pipeline`)

*   **Runs on**: `ubuntu-latest`
*   **Permissions**:
    *   `contents: write`: To commit enhanced CV data and the generated assets back to `main`. (This is the only permission declared — there is no `pages: write` or `id-token: write`, because deployment is a git commit to `main` rather than an OIDC GitHub Pages deploy.)
*   **Steps** (in order):
    *   **`Checkout`** / **`Setup Node.js`** / **`Install dependencies`**: Standard environment setup (`npm ci`).
    *   **`Unit tests`**: Executes the `.github/scripts` test suite (`cv-generator.test.js`, `verify-proposals.test.js`).
    *   **`Browser libraries (PDF rendering)`**: Installs the browser dependencies Puppeteer needs for PDF generation.
    *   **`Ingest — GitHub data mining and narratives`**: Runs `github-data-miner.js` and `narrative-generator.js` to refresh the evidence corpus.
    *   **`Propose — evidence-bounded AI enhancement`**: Runs `enhance.js`, which asks the configured AI provider for per-section rewrites and writes them to `data/ai-enhancements.json` as **proposals only** — never applied directly. Without an API key this stage reports SKIPPED and the pipeline continues from curated content.
    *   **`Verify — apply only evidence-supported proposals`**: Runs `verify-proposals.js` (skipped on `dry_run`), which rejects proposals with unsupported numbers, new credentials, corporate filler, or drastic length changes, applies survivors to `data/base-cv.json`, and records verdicts in `data/proposal-review.json`.
    *   **`Validate — content integrity gate`**: The deployment-blocking validation gate: `tests/validate-json.test.js`, `ai-hallucination-detector.js` (fails if confidence < 70), `content-guardian.js --validate`, and `keyword-scorer.js` (soft gate).
    *   **`Render — website and PDFs`**: Runs `cv-generator.js` to generate the website and PDF assets into `dist/`.
    *   **`Lint generated JavaScript`**: Lints the generated output.
    *   **`Publish — commit if content changed`**: Copies the built `dist/` output back into the working tree on `main` and commits it (GitHub Pages serves `main` root; this is not a GitHub Pages deploy action). The commit message states each stage's real outcome, and a run that changes no content does not commit.
    *   **`Run summary`**: Generates a summary report visible in the GitHub Actions UI.

### Integrating Python Utilities in Workflows

The project includes a suite of Python utilities (`src/python/`) that could be leveraged within GitHub Actions workflows; none are currently wired in.

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
