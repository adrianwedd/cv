# Data Models

This section describes the JSON data models used throughout the AI-enhanced CV system. These files serve as the central data store and communication medium between different components of the pipeline.

## Overview

The system relies on a set of structured JSON files, primarily located in the `data/` directory. These files store curated CV information, collected GitHub activity evidence, AI content proposals, and verification verdicts. Understanding their structure is crucial for comprehending the system's data flow and for making modifications or extensions.

## Core Data Files

### 1. `base-cv.json`

This file is the source of truth for all CV content: personal details, experience, projects, skills, and achievements. It is human-curated; the only automated writes are verified AI proposals merged in by `verify-proposals.js`.

```json
{
  "metadata": {
    "version": "string",
    "last_updated": "datetime" (ISO 8601),
    "data_source": "string",
    "enhancement_ready": "boolean"
  },
  "personal_info": {
    "name": "string",
    "title": "string",
    "location": "string",
    "phone": "string",
    "email": "string",
    "website": "url",
    "github": "url",
    "linkedin": "url",
    "tagline": "string",
    "availability": "string"
  },
  "professional_summary": "string",
  "experience": [
    {
      "position": "string",
      "company": "string",
      "period": "string",
      "description": "string",
      "achievements": ["string"],
      "technologies": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "subtitle": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "url",
      "github": "url",
      "status": "string",
      "period": "string",
      "highlights": ["string"]
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "string",
      "tier": "string" (Primary | Secondary),
      "description": "string"
    }
  ],
  "achievements": [
    {
      "icon": "string" (emoji),
      "title": "string",
      "description": "string",
      "date": "string",
      "category": "string",
      "url": "url"
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "period": "string",
      "description": "string",
      "key_areas": ["string"]
    }
  ],
  "certifications": [],
  "languages": ["..."],
  "interests": ["string"]
}
```

> Note: `subtitle`, `url`, `github`, `status`, `period`, and `highlights` are optional per-project fields (not every project sets all of them). `certifications` is currently an empty array.

### 2. `github-activity.json`

The full cross-repo activity evidence snapshot written by `activity-collector.js`, and the data source for the frontend activity panels (`assets/activity-viz.js`). **All metrics are sourced from real GitHub API data** (GraphQL contribution calendar, repository inventory, public push events, commit search).

```json
{
  "generated_at": "datetime" (ISO 8601),
  "lookback_period_days": "number",
  "summary": {
    "total_commits": "number",
    "commit_contributions_9mo": "number",
    "active_repositories": "number",
    "total_repositories": "number",
    "total_stars": "number",
    "tracking_status": "string"
  },
  "top_commit_repositories": [
    { "name": "string", "commits": "number" }
  ],
  "commit_timeline": [
    { "week": "date" (YYYY-MM-DD), "repos": { "<repo>": "number" } }
  ],
  "languages": { "<language>": "number" (aggregate repo size) },
  "heatmap": [
    { "date": "date" (YYYY-MM-DD, week start), "count": "number" }
  ],
  "repositories": [
    {
      "name": "string",
      "description": "string",
      "language": "string",
      "last_push": "date",
      "stars": "number"
    }
  ]
}
```

### 3. `activity-summary.json`

A compact website summary derived from the same collection run. Its key names are load-bearing for `assets/modules/`.

```json
{
  "last_updated": "datetime" (ISO 8601),
  "lookback_period_days": "number",
  "summary": {
    "total_commits": "number",
    "active_days": "number",
    "net_lines_contributed": "number",
    "tracking_status": "string"
  }
}
```

> **Note**: Earlier versions emitted richer `professional_metrics`, `skill_analysis`, `data_files`, and `cv_integration` blocks. The current file is trimmed to the keys shown above.

### 4. `ai-enhancements.json`

The AI proposal artifact written by `enhance.js`. It contains **proposals only** — it is never rendered by the frontend and never applied directly to `base-cv.json`; only `verify-proposals.js` may promote its content.

```json
{
  "status": "string" (SUCCESS | SKIPPED | FAILED),
  "generated_at": "datetime" (ISO 8601),
  "provider": "string" (e.g. "openrouter"),
  "model": "string",
  "usage": { "input": "number", "output": "number" } (measured token counts),
  "sections": {
    "<section id>": {
      "verdict": "string" (improved | unchanged),
      "text": "string" (the full proposed replacement),
      "rationale": "string",
      "original": "string" (the current text)
    }
  },
  "errors": ["string"]
}
```

Section ids are `professional_summary`, `experience[i].description`, and `projects[i].description`.

### 5. `proposal-review.json`

The verification record written by `verify-proposals.js`: one verdict per proposal, stating whether it was applied to `base-cv.json` and why not otherwise.

```json
{
  "reviewed_at": "datetime" (ISO 8601),
  "source_generated_at": "datetime" (matches ai-enhancements.json),
  "results": [
    {
      "id": "string" (section id),
      "verdict": "string" (accepted | rejected | unchanged),
      "reason": "string" (present for rejections),
      "rationale": "string" (the proposer's rationale)
    }
  ]
}
```

### 6. Integrity & Verification Files

The `data/` directory also holds several files produced by the validation gates and data-collection steps. These are **generated** outputs (not source-of-truth), unless noted otherwise:

*   `protected-content.json` — Source-of-truth list of protected/verified claims used by `content-guardian.js`.
*   `placeholder-replacement-validation.json` — Validation report for placeholder-metric replacement during generation.
*   `validation-cache/` — Cached validation artifacts.

Generated snapshot directories such as `intelligence/` and `narratives/` hold time-stamped artifacts from the data-mining and narrative-generation steps.

## Relationships

*   `base-cv.json` is the curated source of truth and the only content the site renders.
*   `github-activity.json` and `activity-summary.json` are collected evidence: they inform the AI proposals, bound the verification corpus, and drive the frontend activity panels.
*   `ai-enhancements.json` holds AI proposals; `proposal-review.json` records which of them `verify-proposals.js` accepted into `base-cv.json`.
*   `cv-generator.js` consumes `base-cv.json` and the activity data to produce the final CV outputs — it does not read `ai-enhancements.json`.

## Python Data Models

This section outlines the data structures used by the **experimental/standalone** Python utilities within the `src/python/` directory. These modules are not invoked by any GitHub Actions workflow, JavaScript script, or the frontend — they are not part of the production CV data pipeline (whose source of truth is `base-cv.json`, consumed by JS). The models below describe data exchange for those standalone utilities only.

### 1. Logging Utilities (`src/python/utils/logging_utils.py`)

While `logging_utils.py` primarily handles logging to files and console, the log entries themselves follow a structured format:

```
YYYY-MM-DD HH:MM:SS,ms - LOGGER_NAME - LEVEL - MESSAGE
```

### 2. External API Wrappers (`src/python/api_wrappers/external_apis.py`)

The data models for the external API wrappers are determined by the respective third-party APIs (Abstract API for firmographics, Intellizence for funding data). The wrappers return JSON objects directly from the API responses.

**Example (Abstract API - Company Info):**
```json
{
  "name": "string",
  "domain": "string",
  "legal_name": "string",
  "description": "string",
  "founded": "number" (year),
  "employees": "number",
  "industry": "string",
  "type": "string",
  "country": "string",
  "website_url": "url",
  "logo_url": "url"
}
```

**Example (Intellizence API - Funding Data):**
```json
[
  {
    "company_name": "string",
    "funding_round": "string",
    "amount": "number",
    "currency": "string",
    "date": "date" (YYYY-MM-DD),
    "investors": ["string"],
    "valuation": "number"
  }
]
```

### 3. Configuration Management (`src/python/config_manager/config_manager.py`)

The `ConfigManager` class handles configurations typically stored in `.ini` files. The structure is section-based, with key-value pairs.

**Example (`config.ini`):**
```ini
[API_SETTINGS]
api_key = your_api_key
base_url = https://api.example.com

[APP_SETTINGS]
debug_mode = True
max_retries = 5
```

### 4. Data Validation Utilities (`src/python/data_validation/data_validator.py`)

`data_validator.py` does not define a specific data model for persistence. Instead, its methods operate on various data types (strings, numbers, lists, dictionaries) and return boolean values indicating validation success or failure. It logs warnings for validation failures.
