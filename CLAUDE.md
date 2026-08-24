# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Evidence-driven CV system: a static website (`index.html`) driven by JSON data (`data/base-cv.json`), with GitHub Actions workflows that collect real GitHub activity, propose AI content improvements bounded by evidence, verify them, and deploy to GitHub Pages (cv.adrianwedd.com).

## Architecture

**Frontend** — Static HTML/CSS/JS served from the repo root. `index.html` loads `data/base-cv.json` (inlined as `window.__CV_DATA__` in production builds) and renders CV sections using DOM API methods. `assets/activity-viz.js` renders the activity panels from `data/github-activity.json`. `watch-me-work.html` is a redirect stub pointing to `adrianwedd.com/activity/`. Uses `assets/styles.css` (design tokens, dark/light themes).

**Pipeline** — Five separated stages with explicit outcome semantics (SUCCESS / SKIPPED / FAILED). A failed stage is reported, never laundered into downstream success.

1. **Evidence ingestion** — `activity-tracker.yml` (daily, cheap, no AI) runs `activity-collector.js`: cross-repo GitHub activity via GraphQL + REST. It measures the whole account, NOT this repo's git log (which is automation churn). Commits only on *material* change (commit volume ±25% and ≥10, active-repo count, or language mix), and then triggers the enhancement pipeline via `repository_dispatch: cv-evidence-changed` (needs `PERSONAL_ACCESS_TOKEN`; the default `GITHUB_TOKEN` cannot start workflows).
2. **Proposal** — `cv-enhancement.yml` (weekly Mondays 21:00 UTC, on evidence dispatch, or manual) runs `github-data-miner.js` + `narrative-generator.js`, then `enhance.js`: asks the AI provider for per-section rewrites of `professional_summary` and experience/project descriptions. Output goes to `data/ai-enhancements.json` as PROPOSALS ONLY — never rendered directly, never touching base-cv.json.
3. **Verification** — `verify-proposals.js` rejects proposals with unsupported numbers (quantity guard), new credentials, corporate beige/meta-commentary, or drastic length change, then applies survivors to `data/base-cv.json`. Rejecting everything is a healthy outcome; the previous good version always beats a worse rewrite. `data/proposal-review.json` records per-proposal verdicts.
4. **Validation gate (hard)** — `tests/validate-json.test.js`, `ai-hallucination-detector.js` (exits 1 below confidence 70), `content-guardian.js --validate`, `keyword-scorer.js --threshold 35 --report`. Failures block deploy.
5. **Render + publish** — `cv-generator.js` builds `dist/` (site + two puppeteer PDFs: full `adrian-wedd-cv.pdf` and ATS `adrian-wedd-cv-short.pdf` from `ats-template.html`), output is copied back into the working tree and committed with an honest message stating each stage's real outcome. Timestamp-only runs do not commit.

**AI layer** — `.github/scripts/ai/client.js` is provider-neutral (no SDKs): `openrouter` (CI default, `OPENROUTER_API_KEY`, model `deepseek/deepseek-v4-flash`), `ollama` (local dev, `OLLAMA_HOST`), `gemini` (`GEMINI_API_KEY`). Selected via `AI_PROVIDER`/`AI_MODEL` or auto-detected. Anthropic is intentionally not a provider — that integration was retired.

**Deployment** — GitHub Pages serves from `main` branch root. `.nojekyll` prevents Jekyll processing; the auto-triggered `pages-build-deployment` workflow showing "failed" is expected and harmless. Both pipeline workflows share the `cv-pipeline` concurrency group.

## Commands

```bash
# Serve locally
python3 -m http.server 8000

# Root: validate JSON data / schema tests
npm run validate:json
npm test

# Scripts (from .github/scripts/, after npm ci)
node activity-collector.js                   # needs GITHUB_TOKEN
node enhance.js                              # needs OPENROUTER_API_KEY (or GEMINI_API_KEY / OLLAMA_HOST)
node verify-proposals.js
node cv-generator.js                         # needs puppeteer Chrome (npx puppeteer browsers install chrome)
npm test                                     # cv-generator + verify-proposals suites
npm run lint
```

## Key Files

| File | Purpose |
|------|---------|
| `data/base-cv.json` | Source of truth for all CV content. Human-curated; verified AI proposals are merged in here by the pipeline. |
| `data/ai-enhancements.json` | Latest AI proposal artifact (status + per-section verdicts). Not rendered. |
| `data/github-activity.json` | Cross-repo activity evidence; feeds `assets/activity-viz.js`. |
| `.github/scripts/ai/client.js` | Provider-neutral chat client with SUCCESS/SKIPPED/FAILED semantics. |
| `.github/scripts/enhance.js` | Proposal stage (evidence-bounded prompts). |
| `.github/scripts/verify-proposals.js` | Verification + apply stage (quantity/credential/beige/size guards). |
| `.github/scripts/cv-generator.js` | Site + PDF renderer. |
| `assets/script.js` | Main CV page entrypoint (ES module); orchestrates `assets/modules/`. DOM-API-only rendering. |

## Critical Constraints

**No innerHTML** — All frontend JS uses safe DOM methods (`createElement`, `textContent`, `appendChild`). Enforced by `tests/smoke.test.js`.

**Content integrity** — `base-cv.json` must contain only verifiable claims. AI output reaches it exclusively through `verify-proposals.js`; nothing in the frontend or generator may read enhanced text from anywhere else. The hallucination detector and content guardian run as hard CI gates on every deploy.

**Honest telemetry** — Never record estimated token counts, hardcoded "success" outcomes, or unconditional ✅ summaries. Statuses must be measured. This repo previously spent 13 months committing "Enhanced with Claude AI" while every API call failed with HTTP 400 — do not recreate that failure mode.

**No churn commits** — A pipeline run that changes no content must not commit. Timestamps in generated output derive from data, not the wall clock.

**CSS variables** — Custom properties follow `--color-*`, `--radius-*`, and the spacing scale `--space-*` (no `--spacing-*` prefix). Define new variables in `:root`. Gotchas: `--radius-sm` not `--border-radius-sm`, `--color-background-card` not `--color-card-background`.

**Link security** — All `target="_blank"` links must include `rel="noopener noreferrer"`. `window.open` calls must pass `'noopener,noreferrer'`.

## Environment Variables (CI)

- `OPENROUTER_API_KEY` — default AI provider (repo secret). Absent → enhancement reports SKIPPED and the pipeline still validates, renders, and deploys curated content.
- `GEMINI_API_KEY` — alternate provider (repo secret).
- `AI_PROVIDER` / `AI_MODEL` — provider/model selection (workflow env; default `openrouter` / `deepseek/deepseek-v4-flash`).
- `PERSONAL_ACCESS_TOKEN` — lets the activity tracker's `repository_dispatch` actually start the enhancement workflow.
- `GITHUB_TOKEN` — provided automatically.
- `TIMEZONE` — `Australia/Tasmania`.
