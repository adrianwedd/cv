# Activity Dashboard Migration: cv.adrianwedd.com → adrianwedd.com/activity

**Date:** 2026-03-18
**Status:** Draft

## Summary

Move the live GitHub activity dashboard from `cv.adrianwedd.com/watch-me-work.html` to `adrianwedd.com/activity/`. Restyle with Tailwind to match adrianwedd.com's botanical design language. Data sourced directly from the GitHub API (no pre-generated files). CV repo retains a meta redirect for existing links.

## Motivation

The activity dashboard is a portfolio piece, not CV content. It belongs on the personal site where it's discoverable alongside projects, blog posts, and other work. Moving it also removes a build dependency — the CV pipeline no longer needs to generate activity data files for the dashboard.

**Trade-off acknowledged:** The current dashboard tries CI-generated static data first, then falls back to the live API. The new version drops static data entirely, making it fully dependent on the 60 req/hr unauthenticated rate limit. This is acceptable — the dashboard is a live view, not a critical page.

## Architecture

### New files in adrianwedd.com

The adrianwedd.com repo already has `src/components/islands/GitHubActivity.tsx` — a Preact island that fetches from the same GitHub events API, processes events, and renders an activity stream with stats. The new `/activity/` page should **extend this existing component** rather than introduce a parallel vanilla JS rendering approach. This keeps the codebase consistent (Preact islands for interactive content).

| File | Purpose |
|------|---------|
| `src/pages/activity.astro` | Astro page — BaseLayout wrapper, static shell, SEO metadata. File produces `/activity/` route (Astro auto-creates directory per `trailingSlash: 'always'` config). |
| `src/components/islands/ActivityDashboard.tsx` | Extended Preact island — builds on existing `GitHubActivity.tsx` patterns. Adds filtering, repo grid, metrics bar, detail modal. |

The existing `GitHubActivity.tsx` stays for its current usage context (embedded on `/now/` page via `client:idle`). **Prerequisite refactoring:** `GitHubActivity.tsx` currently has no exported helpers — all API fetching, caching, and event processing logic is module-private. Before building `ActivityDashboard.tsx`, extract shared logic (fetch, cache, event processing, relative time formatting) into `src/lib/github-activity.ts`. Both components then import from this shared module.

### Data flow

```
Browser → GitHub REST API (api.github.com)
  → /users/adrianwedd/events/public?per_page=100 (activity stream)
  → /users/adrianwedd/repos?per_page=100&sort=updated&page=N (paginated, up to 5 pages)
```

Metrics (commits, active days, repos, languages) are **derived from event and repo data** — no separate profile endpoint call.

- **Rate limit:** 60 requests/hour (unauthenticated). Displayed in UI.
- **Refresh interval:** 120 seconds.
- **Caching:** `sessionStorage` with 5-minute TTL. Cleared on session end. Avoids stale data across sessions while conserving rate limit within a session. Must handle `astro:after-swap` lifecycle event for View Transition re-initialisation (Preact islands handle this automatically).
- **Pagination:** Repos fetched up to 5 pages (500 repos max) to avoid missing repos for active accounts.
- **Error state:** Graceful degradation — show "Rate limited, retrying in Xs" message.

### Dashboard sections

All sections carry over from the current watch-me-work.html, restyled:

1. **Metrics bar** — 4 cards: commits (30d), active days, repositories, languages. Uses `bg-surface-raised` background, `text-accent` for values.
2. **Activity stream** — Chronological event list with filters (type, time range, repository, search). Events styled as a timeline with `border-border` separators.
3. **Repository grid** — Cards showing repo name, language, last activity, status. Grid/list toggle. Uses `bg-surface-alt` card backgrounds.
4. **Activity detail modal** — Overlay for event details. Uses `bg-surface-raised` with shadow.

### Design tokens

Inherits adrianwedd.com's botanical palette (no Footnotes palette):

- Dark: `#1a181c` surface, `#e2ddd8` text, `#c48b6e` accent
- Light: `#f7f4f1` surface, `#1a181c` text, `#8a5e42` accent
- Theme: uses `.light` class on `<html>` (adrianwedd.com pattern), NOT `data-theme` attribute (CV repo pattern). localStorage key is `theme` (not `cv-theme`).

No curvature field. No custom CSS file — Tailwind utility classes only.

### Navigation integration

- Add "Activity" link to `navLinks` array in `src/components/Header.astro`. Current order: Projects, Blog, Gallery, Audio, About, Services, Contact, Search. Insert at position 2 (after Projects, before Blog) — activity is portfolio-adjacent content.
- Add keyboard shortcut `g v` (go → view activity) to the `routes` object in `BaseLayout.astro`. Also add corresponding `<kbd>` entry to the shortcut overlay HTML. Note: `v` breaks the first-letter mnemonic (`a` is taken by About), but "view" is a reasonable alternative.
- Add sitemap rule to `getSitemapMeta()` in `astro.config.mjs`: `if (pathname === '/activity/') return { priority: 0.7, changefreq: 'weekly' };`

### Changes in CV repo

| Change | File | Detail |
|--------|------|--------|
| Redirect stub | `watch-me-work.html` | Replace content with `<meta http-equiv="refresh" content="0;url=https://adrianwedd.com/activity/">` plus a fallback link |
| Update link | `index.html` | "Watch Me Work" href → `https://adrianwedd.com/activity/` |
| Remove from sitemap | `.github/scripts/cv-generator.js` | Remove watch-me-work.html from sitemap generation |
| Update copyAssets | `.github/scripts/cv-generator.js` | Replace watch-me-work.html copy (line 681-684) with redirect stub copy to dist. Also remove watch-me-work.css copy (lines 625-628) and watch-me-work.js from the JS copy list (line 668). |
| Delete CSS | `assets/watch-me-work.css` | No longer needed |
| Delete JS | `assets/watch-me-work.js` | No longer needed |

### Files NOT changed in CV repo

- `activity-tracker.yml` — stays, feeds the CV page's activity section
- `data/activity/`, `data/metrics/`, `data/trends/` — stay, used by CV page
- `assets/activity-viz.js` — stays, used by CV page's activity section
- `curvature-field.js`, `curvature-init.js` — stay, used by CV page

## SEO

- `adrianwedd.com/activity/` gets canonical URL, proper OG tags, Twitter card
- `cv.adrianwedd.com/watch-me-work.html` serves instant redirect (HTTP-equiv refresh + `<link rel="canonical">` pointing to new URL)
- Google treats meta refresh with 0 delay as a 301 for ranking purposes

## Security

- No CSP headers are currently configured in adrianwedd.com (Astro does not set them by default). The existing `GitHubActivity.tsx` already fetches from `api.github.com` without issues. If CSP is added in the future, `connect-src` must include `https://api.github.com`.
- No `unsafe-inline` needed — all JS in external files or Preact islands
- Client-side JS uses DOM API only (no `innerHTML`). Note: Astro's `set:html` directive in templates is fine — the no-innerHTML rule applies to client-side JS only.

## Testing

- Manual: verify dashboard loads at `adrianwedd.com/activity/`, all 4 sections render, filters work
- Manual: verify `cv.adrianwedd.com/watch-me-work.html` redirects correctly
- Manual: verify theme toggle works (dark/light)
- Manual: verify View Transitions — navigate away and back, dashboard re-initialises
- Lighthouse: accessibility score >= 90
- Link check: lychee (already in adrianwedd.com CI) catches any broken references

## Out of scope

- Authentication for higher GitHub API rate limits
- Pre-generated data file syncing from CV repo
- Porting curvature field animation
- Analytics event tracking (can be added later)
- URL filter state preservation via query params (can be added later)
- Code preview panel (existed in watch-me-work.js but rarely used)
