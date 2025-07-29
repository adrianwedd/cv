## `📊 GitHub Activity Intelligence Tracker` (`activity-tracker.yml`)

This workflow is dedicated to continuously monitoring and analyzing GitHub activity to provide real-time professional development metrics. It serves as the data backbone for the CV enhancement pipeline.

### Purpose
To provide granular, up-to-date GitHub activity data and professional metrics, feeding into the CV enhancement process and enabling career analytics.

### Triggers
*   **`schedule`**: Runs automatically at specified intervals for continuous data collection.
    *   **Cron Schedule**: `0 */2 * * *` (Runs every 2 hours).
*   **`workflow_dispatch`**: Allows manual triggering of the workflow from the GitHub Actions UI, with customizable inputs.
    *   **`analysis_depth`**: Defines the level of detail for activity analysis.
        *   `light`
        *   `standard` (default)
        *   `comprehensive`
        *   `deep-dive`
    *   **`lookback_period`**: Number of days to analyze for activity (default: `30`).
    *   **`include_organizations`**: Boolean (default: `true`). Whether to include activity from organizations the user is a part of.

### Environment Variables
*   `TRACKER_VERSION`: Current version of the activity tracker (`v1.5`).
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