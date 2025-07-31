# GEMINI.md

This file provides guidance to Gemini when working with code in this repository. It reflects my operational principles and key insights gained from past sessions.

## Project Overview

This is an AI-Enhanced CV System that automatically generates and maintains a professional CV website using GitHub activity analysis and Claude AI content optimization. The system runs on GitHub Actions with scheduled workflows for continuous enhancement.

## Architecture

### Core Components
- **Frontend**: Static HTML/CSS/JS website with responsive design (`index.html`, `assets/`)
- **Data Layer**: JSON-based CV data structure (`data/base-cv.json`)
- **Automation Layer**: GitHub Actions workflows for AI enhancement (`.github/workflows/`)
- **Processing Scripts**: Node.js scripts for activity analysis and AI enhancement (`.github/scripts/`)

### Key Files
- `data/base-cv.json` - Core CV data structure (personal info, experience, projects, skills)
- `index.html` - Main CV webpage with structured data and responsive design
- `assets/styles.css` - Modern CSS with design tokens and responsive layouts
- `assets/script.js` - Interactive features, theme switching, and dynamic content loading
- `.github/workflows/cv-enhancement.yml` - Main automation pipeline (runs every 6 hours)

## Development Commands

### GitHub Scripts
```bash
# Navigate to scripts directory
cd .github/scripts

# Install dependencies
npm install

# Run individual components
node activity-analyzer.js    # Analyze GitHub activity
node claude-enhancer.js      # AI content enhancement
node cv-generator.js         # Generate CV website

# Run tests
npm test                     # Run all tests
npm run lint                 # ESLint validation
```

## Gemini Added Memories

### Issue Grooming Process

When tasked with grooming issues, I will follow this systematic procedure:

1.  **List and Select**: I will list all open issues (`gh issue list`) to get an overview, then select one to groom, prioritizing older or higher-priority items.
2.  **Analyze**: I will read the issue's current description (`gh issue view <issue_number> --json body`) and inspect relevant code or documentation to validate the issue and understand its context.
3.  **Groom**:
    *   **Draft**: I will draft an enhanced issue description and a comment summarizing the changes. The description will include:
        *   A clear problem statement.
        *   A "Current Implementation" section with findings from my analysis, referencing specific files/lines.
        *   A "Proposed Solution" or "Implementation Strategy."
        *   "Acceptance Criteria."
        *   An appropriate "Priority" (P0, P1, P2, P3).
    *   **Update**: I will update the issue description (`gh issue edit <issue_number> --body-file <temp_file_path>`) and add a comment (`gh issue comment <issue_number> --body-file <temp_file_path>`) that summarizes the changes, highlights key findings, and explains the rationale.
    *   **Metadata**: I will update labels, assignees, or milestones as appropriate using `gh issue edit <issue_number> --add-label "P1: High"`.
4.  **Housekeeping**:
    *   **Close Redundant Issues**: If an issue is a duplicate or fully encompassed by another, I will close it (`gh issue close <issue_number> --reason "completed"`) and add a comment explaining the redundancy and referencing the primary issue.
    *   **Manage Temp Files**: I will use temporary files in the `temp/` directory for all issue bodies and comments to avoid escaping issues and keep the command history clean. I will delete these temporary files after use.

### Python Development Insights

-   **ModuleNotFoundError**: When running Python scripts as `python <script_name>.py`, `ModuleNotFoundError` can occur if the script tries to import modules from a package (e.g., `from src.python.cloud_storage.rclone_client import RcloneClient`). This is because the current directory is not treated as a package root.
    -   **Solution**: Run the script as a module using `python -m <package_path>.<script_name>` (e.g., `python -m temp.process_cv_documents`). This ensures Python's module import system works correctly.
-   **Environment Variable Persistence**: `export VAR_NAME=value` commands executed via `run_shell_command` do not persist across subsequent `run_shell_command` calls. Each `run_shell_command` executes in a new subshell.
    -   **Solution**: Prepend the `export` command to the same `run_shell_command` that executes the script requiring the variable (e.g., `export CLAUDE_API_KEY="..." && python -m temp.process_cv_documents`).
-   **`replace` Tool Limitations**: The `replace` tool is very sensitive to exact string matching. Replacing large, multi-line blocks can be brittle due to subtle whitespace or character differences.
    -   **Solution**: For significant code changes, especially when refactoring or introducing new logic, consider using `write_file` to completely overwrite the file content with the new version. This is more robust than `replace` for large modifications.

### Git Operations

-   **`temp/` Directory and `.gitignore`**: Files within the `temp/` directory are typically git-ignored. This means `list_directory` and `glob` (by default) will not show them, and `git add` will ignore them unless forced (`git add -f`).
    -   **Solution**: When needing to list or access files in git-ignored directories, use `glob` with `respect_git_ignore=False`. If a temporary file needs to be committed (e.g., `requirements.txt` that was initially placed in `temp/`), move it out of `temp/` before adding.
-   **Staging and Committing Specific Changes**: When other changes are present in the working directory, use `git restore --staged .` to unstage all changes, then `git add <specific_files_or_directories>` to stage only the desired changes before committing. This ensures atomic commits.

### Rclone Troubleshooting

-   **Google Drive "Directory Not Found"**: This error often indicates permission issues or an expired token, especially for shared drives.
    -   **Solution**: Reconnect the rclone remote using `rclone config reconnect <remote_name>:` (e.g., `rclone config reconnect gdrive:`). This is an interactive command that needs to be run by the user in their terminal.
    -   **Flag for Shared Drives**: For shared Google Drive folders, the `--drive-shared-with-me` flag is often necessary for `rclone` commands. Ensure the `rclone_client.py` (or similar wrapper) supports passing arbitrary extra arguments to `rclone` commands.

### Claude API Interaction

-   **API Key vs. OAuth**: For CLI prototypes, using an API key is generally more practical than implementing a full OAuth flow due to the interactive nature of OAuth.
-   **Error Handling in Tests**: Expected API errors (e.g., `Bad Request`) and malformed responses should be explicitly tested in unit tests by mocking the API client. The test should assert that the code handles these scenarios gracefully (e.g., raises the correct exception). Print statements from within these error-handling test cases are normal and indicate the test is working as expected.

