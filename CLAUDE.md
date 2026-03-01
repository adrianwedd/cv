# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-Enhanced CV system: a static website (`index.html`) driven by JSON data (`data/base-cv.json`), with GitHub Actions workflows that analyze GitHub activity and use Claude AI to keep content current. Deployed to GitHub Pages.

## Architecture

The system has two layers:

**Frontend** — Static HTML/CSS/JS served from the repo root. `index.html` loads `data/base-cv.json` via fetch and renders CV sections using DOM API methods. `watch-me-work.html` is a live activity dashboard that fetches from the GitHub API. Both use `assets/styles.css` (design tokens, dark/light themes) and their respective JS files.

**CI Pipeline** — Two GitHub Actions workflows run Node.js scripts from `.github/scripts/`:
- `activity-tracker.yml` — Runs daily (6 AM AEST). Collects GitHub commit data, language stats, contribution metrics via `activity-analyzer.js`.
- `cv-enhancement.yml` — Runs once daily (8 AM AEST). Uses `claude-enhancer.js` for AI content optimization, `cv-generator.js` for site generation, then deploys to Pages. Validation gate runs `ai-hallucination-detector.js` and `content-guardian.js --validate` — failures block deployment.

Both workflows share a single concurrency group (`cv-pipeline`) to prevent race conditions on shared data files.

## Commands

```bash
# Serve locally
python3 -m http.server 8000
# or: npx serve .

# Validate all JSON data files
npm run validate:json

# Install script dependencies
cd .github/scripts && npm install

# Run pipeline scripts individually (from .github/scripts/)
node activity-analyzer.js                    # needs GITHUB_TOKEN
node claude-enhancer.js                      # needs ANTHROPIC_API_KEY
node cv-generator.js

# Lint scripts
npm run lint                                 # from .github/scripts/

# Run tests
npm test                                     # from .github/scripts/
```

## Key Files

| File | Purpose |
|------|---------|
| `data/base-cv.json` | Source of truth for all CV content. Edit this to update CV data. |
| `assets/script.js` | Main CV page JS. Uses DOM API methods (no innerHTML) to render sections from base-cv.json. |
| `assets/watch-me-work.js` | Dashboard JS. Fetches live GitHub activity via public API. |
| `assets/styles.css` | All styling. Uses CSS custom properties (design tokens) defined in `:root`. |
| `.github/scripts/ai-hallucination-detector.js` | Validates AI-generated claims. Exits 1 if confidence < 70%. |
| `.github/scripts/content-guardian.js` | Blocks fabricated claims. Use `--validate` flag for gate mode. |

## Critical Constraints

**No innerHTML** — All frontend JS uses safe DOM methods (`createElement`, `textContent`, `appendChild`). A pre-commit hook blocks innerHTML usage.

**Content integrity** — `base-cv.json` must contain only verifiable claims. No fabricated metrics, certifications, or project details. The hallucination detector and content guardian run as CI gates.

**CSS variables** — Custom properties follow the naming convention `--color-*`, `--radius-*`, `--spacing-*`. If you add new variables, define them in the `:root` block. Common gotcha: `--radius-sm` not `--border-radius-sm`, `--color-background-card` not `--color-card-background`.

**Workflow data files** — Both workflows write to `data/` and share the `cv-pipeline` concurrency group so they never run simultaneously. Always create referenced files atomically before updating summary files.

**Link security** — All `target="_blank"` links must include `rel="noopener noreferrer"`. `window.open` calls must pass `'noopener,noreferrer'` as the third argument.

## Environment Variables (CI)

- `ANTHROPIC_API_KEY` — Claude AI API access
- `GITHUB_TOKEN` — Provided automatically by GitHub Actions
- `TIMEZONE` — Set to `Australia/Tasmania`
