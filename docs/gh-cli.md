# 📋 GitHub CLI Commands for Issue Management

  Issue Tracking & Analysis

## List issues by status and labels

  gh issue list --state open --label bug
  gh issue list --state open --label "status: needs-verification"
  gh issue list --state open --label enhancement

## View specific issue details

  gh issue view [number]                    # Basic details
  gh issue view [number] --comments         # Include comments  
  gh issue view [number] --web             # Open in browser

## Search issues

  gh issue list --search "is:open label:ci-cd"
  gh issue list --assignee @me

  Issue Management

## Create new issues

  gh issue create --title "fix: Critical CI failure" --body "Description" --label bug,ci-cd
  gh issue create --template bug_report.md

## Update existing issues

  gh issue edit [number] --add-label "status: in-progress"
  gh issue edit [number] --remove-label "status: needs-verification"
  gh issue edit [number] --assignee @me
  gh issue edit [number] --milestone "v2.1"

## Comment on issues

  gh issue comment [number] --body "Working on this fix"
  gh issue comment [number] --body "Fixed in commit abc123"

## Close issues

  gh issue close [number] --comment "Resolved in PR #X"

  Workflow & CI Commands

## Check workflow status

  gh workflow list
  gh run list --limit 10
  gh run view [run-id] --log

## Trigger workflows

  gh workflow run cv-enhancement.yml
  gh workflow run activity-tracker.yml --ref main

## Cancel failed runs

  gh run cancel [run-id]
