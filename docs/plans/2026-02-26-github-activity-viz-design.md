# GitHub Activity Visualization — Design

## Location
Between Projects and Skills sections. Section label: `ACTIVITY` (small uppercase, 0.75rem, letter-spacing 0.12em, matching existing section titles).

## Four Panels

### 1. Commit Streamgraph
Stacked area chart showing commit volume over the last 12 months, broken into 3-4 color-coded categories (AI/Research, Client Delivery, Tooling, Other). Smooth curves, no axes — just the flowing shape with subtle month labels along the bottom. Hover reveals tooltip with repo name + count.

### 2. Language Ring
Concentric donut chart showing language proportions across all repos. Animates on scroll-into-view — segments grow from zero. Inner ring shows top 5 languages, outer ring shows the rest. Labels appear on hover/tap.

### 3. Repository Constellation
Canvas-rendered node graph. Each repo is a circle sized by total activity (issues + commits). Nodes positioned by a simple force layout, connected by thin lines when they share technologies. Gentle orbital drift (same geological pace as curvature-field — one full cycle per ~30s). Color intensity indicates recency of last push.

### 4. Contribution Heatmap
52-week grid (GitHub-style) but rendered with the Footnotes palette. Empty cells: `#0d1117`. Activity levels use opacity steps of `--color-primary` (#8ac7d9). No border-radius on cells — square, tight grid. Week/month labels in `--color-text-muted`.

## Data Source
Pre-baked `data/github-activity.json` written by CI. Structure:

```json
{
  "generated_at": "ISO timestamp",
  "commit_timeline": [
    { "week": "2025-03-03", "repos": { "cygnet": 12, "VERITAS": 5, ... } }
  ],
  "languages": { "Python": 45, "JavaScript": 20, "TypeScript": 15, ... },
  "repositories": [
    { "name": "cygnet", "issues": 795, "commits": 438, "technologies": ["Python","FastAPI","React"], "last_push": "2026-02-22", "language": "Python" }
  ],
  "heatmap": [
    { "date": "2025-03-01", "count": 5 }
  ]
}
```

CI generates this from existing activity-analyzer.js output plus GitHub API calls during the pipeline run (authenticated, no rate limit concern).

## Rendering

- **Streamgraph:** SVG, built with DOM API (createElement/setAttribute). No innerHTML.
- **Language Ring:** SVG arcs via `<path>` elements with arc commands.
- **Constellation:** Canvas 2D, same pattern as curvature-field.js. requestAnimationFrame for drift.
- **Heatmap:** DOM grid of `<div>` elements with inline background-color.

No external libraries. All rendering uses safe DOM methods.

## Layout

Desktop (>720px): 2x2 grid within `--max-width-content` (720px).
Tablet (520-720px): 2x2 but tighter.
Mobile (<520px): single column stack.

Each panel has a subtle label (e.g., "commits", "languages", "repos", "activity") in `--color-text-muted`, `--font-size-xs`.

## Print Support

- Canvas panels (constellation) render a static snapshot — freeze animation and ensure the canvas `toDataURL()` is available, or render a fallback SVG version for print.
- Use `@media print` to: set white background, adjust colors for contrast, hide animation, ensure all panels render at fixed size.
- Heatmap cells use solid colors (no opacity on transparent bg — compute final RGB against white for print).

## Style

- Matches existing design tokens exactly.
- Dark-first. Light mode inverts via existing CSS custom properties where possible.
- Entrance animation: panels fade+slide up on scroll intersection, staggered 100ms.
- Constellation drift matches curvature-field geological pace.
- Separated from adjacent sections by `border-top` rules, not cards/boxes.

## Files

- `assets/activity-viz.js` — all four panel renderers + data loading
- `assets/styles.css` — grid layout + print styles (additions to existing file)
- `data/github-activity.json` — pre-baked data (CI-generated)
- `.github/scripts/activity-analyzer.js` — extended to output the new JSON shape
