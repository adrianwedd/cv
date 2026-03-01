# CV Full Overhaul — Design Document

> **Date:** 2026-03-02
> **Status:** Approved
> **Context:** Active job search across AI safety, cybersecurity, AI training, and dev roles. CV needs to work as both a submission artifact (ATS) and a professional web presence.

## Goal

Make the CV system job-search-ready: a tight ATS PDF for submissions, polished web presence for click-throughs, and clean codebase that demonstrates engineering quality.

## Components

### 1. ATS-Optimised Short PDF

Separate 2-3 page PDF (`adrian-wedd-cv-short.pdf`) generated from `base-cv.json` by `cv-generator.js`.

**Content (in order):**
- Header: name, title, location, phone, email, LinkedIn URL, GitHub URL
- Summary: 3-4 sentences (trimmed About)
- Core Competencies: keep as-is
- Experience: 3 most recent roles (Freelance, Homes Tas, UTAS), 2-3 bullets each, no tech tags
- Key Projects: top 3 (book, Failure-First, Cygnet) as bullet points
- Skills: flat comma-separated list by category, no Primary/Secondary
- Education: 2 entries (AI/ML Study, CS Foundation)

**Excluded:** Interests, achievements beyond the book, curvature field, theme toggle, DJ/multimedia era, "First Code at Age 6"

**Keywords to include in skills list:** Python, JavaScript, TypeScript, AI Safety, Red-Teaming, LLM Integration, Cybersecurity, Penetration Testing, IDAM, Prompt Engineering, RAG, LangChain, Claude API, Anthropic SDK, FastAPI, Docker, GitHub Actions, CI/CD, Multi-Agent Systems, Adversarial Testing, Content Safety, Hallucination Detection

**Deployment:** Both PDFs linked from site. Short version at direct URL for application forms.

### 2. Web Hygiene

- **Favicon:** SVG favicon + `favicon.ico` (16x16, 32x32) + `apple-touch-icon.png` (180x180). Generated from initials "AW" or primary colour.
- **robots.txt:** Allow all, point to sitemap.
- **sitemap.xml:** Two entries (main page + watch-me-work). Updated by pipeline with `<lastmod>`.
- **manifest.json:** Minimal PWA metadata (name, short_name, theme_color, background_color, icons).

### 3. Accessibility + Contrast Audit

**ARIA landmarks:**
- `role="banner"` on header, `role="main"` on content, `role="contentinfo"` on footer
- `aria-label` on each section
- `aria-label` on interactive elements (theme toggle, contact links, PDF download)
- Proper list roles on skills items
- All links have discernible text

**WCAG AA contrast audit:**
- Check both dark and light themes
- Fix any failing contrast ratios
- Document results

### 4. LinkedIn Profile Sync

Update `../job-search/linkedin-profile.md` to match current `base-cv.json`:
- Remove VERITAS and NeuroConnect references
- Update repo count
- Add DJ/Multimedia/Freelance era
- Add book to Featured section
- Sync skills list
- Refresh headline for broad search (AI safety + cybersecurity + dev)

### 5. Script.js Modularisation (Issue #210)

Split 26KB monolith into ES modules:
- `script.js` — entry point, data fetch, initialization
- `sections/experience.js` — experience rendering
- `sections/projects.js` — projects rendering
- `sections/skills.js` — skills rendering
- `sections/education.js` — education rendering
- `sections/interests.js` — interests rendering
- `sections/achievements.js` — achievements rendering
- `utils/dom.js` — sanitizeURL, createElement helpers
- `utils/theme.js` — theme toggle

Loading: ES modules with `type="module"`. No bundler. Update `cv-generator.js` to handle module structure.

### 6. Lighthouse Performance Pass

Run after all other work. Target: 90+ across Performance, Accessibility, Best Practices, SEO.

Likely fixes:
- `<meta name="description">`
- `<link rel="canonical">`
- og-image.png compression (currently 118KB)
- Font preload hints if applicable

## Priority Order

1. ATS short PDF (highest job-search impact)
2. LinkedIn profile sync (highest application-surface impact)
3. Web hygiene (low effort, high polish)
4. Accessibility + contrast audit
5. Script.js modularisation
6. Lighthouse performance pass (final validation)

## Architecture Notes

- All changes stay within the existing static-site architecture
- No new build tools or bundlers
- Pipeline generates both PDFs in the same step
- ES modules loaded natively by browser (no transpilation)
