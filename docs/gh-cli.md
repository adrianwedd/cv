# 📋 GitHub CLI Commands for Project Management

This document provides a quick reference for essential GitHub CLI (`gh`) commands used to manage issues, workflows, and interact with the repository. These commands are particularly useful for maintaining project health, tracking progress, and automating tasks.

## 🔑 Authentication & Authorization

Before using `gh` commands that interact with private repositories or require elevated permissions (like adding issues to projects), ensure you are properly authenticated.

*   **Refresh Authorization Scopes**:

    ```bash
    gh auth refresh -s project
    ```
    *Purpose*: Updates your GitHub CLI authentication to include the `project` scope, necessary for managing issues within GitHub Projects.

## 📝 Issue Management

GitHub Issues are used for tracking bugs, features, and tasks. Effective issue management is crucial for project organization and collaboration.

### List & View Issues

*   **List Issues by Status and Labels**:

    ```bash
    gh issue list --state open --label bug
    gh issue list --state open --label "status: needs-verification"
    gh issue list --state open --label enhancement
    gh issue list --state all --label "P1: High"
    ```
    *Purpose*: Filter issues to quickly find relevant items.

*   **View Specific Issue Details**:

    ```bash
    gh issue view <issue_number>             # Basic details
    gh issue view <issue_number> --comments  # Include comments
    gh issue view <issue_number> --web       # Open in browser
    gh issue view <issue_number> --json body # View raw body content (useful for grooming)
    ```
    *Purpose*: Get comprehensive information about an issue.

*   **Search Issues**:

    ```bash
    gh issue list --search "is:open label:ci-cd"
    gh issue list --assignee @me
    ```
    *Purpose*: Perform advanced searches across issue titles, bodies, and metadata.

*   **List Available Labels**:

    ```bash
    gh label list
    ```
    *Purpose*: See all predefined labels in the repository for consistent tagging.

### Create & Update Issues

*   **Create New Issues**:

    ```bash
    # Basic creation
    gh issue create --title "fix: Critical CI failure" --body "Description" --label bug,ci-cd

    # Using a template
    gh issue create --template bug_report.md

    # Using a body file for complex descriptions (recommended for grooming)
    gh issue create --title "feat: New Feature" --body-file /path/to/temp/issue_body.txt --label "enhancement,P1: High"
    ```
    *Purpose*: Log new bugs, features, or tasks.

*   **Update Existing Issues**:

    ```bash
    # Add/remove labels
    gh issue edit <issue_number> --add-label "status: in-progress"
    gh issue edit <issue_number> --remove-label "status: needs-verification"

    # Assign/unassign people
    gh issue edit <issue_number> --assignee @me
    gh issue edit <issue_number> --remove-assignee monalisa

    # Set milestone
    gh issue edit <issue_number> --milestone "v2.1"

    # Update issue body from file (useful for grooming)
    gh issue edit <issue_number> --body-file /path/to/temp/updated_body.txt
    ```
    *Purpose*: Modify issue details, status, and assignments.

*   **Comment on Issues**:

    ```bash
    # Simple comment
    gh issue comment <issue_number> --body "Working on this fix"

    # Comment with content from a file (recommended for detailed updates)
    gh issue comment <issue_number> --body-file /path/to/temp/comment_text.txt
    ```
    *Purpose*: Provide updates, ask questions, or add context to an issue.

*   **Close Issues**:

    ```bash
    gh issue close <issue_number> --reason "completed" --comment "Resolved in PR #X"
    # Reasons: completed | not planned
    ```
    *Purpose*: Mark an issue as resolved or no longer relevant.

## 🚀 Workflow & CI Commands

These commands help monitor and manage GitHub Actions workflows, which automate the CI/CD pipeline.

*   **Check Workflow Status**:

    ```bash
    gh workflow list
    gh run list --limit 10
    gh run view <run-id> --log
    ```
    *Purpose*: Monitor the status and logs of CI/CD runs.

*   **Trigger Workflows**:

    ```bash
    gh workflow run cv-enhancement.yml
    gh workflow run activity-tracker.yml --ref main
    ```
    *Purpose*: Manually trigger workflows for testing or on-demand execution.

*   **Cancel Failed Runs**:

    ```bash
    gh run cancel <run-id>
    ```
    *Purpose*: Stop a running or queued workflow run.