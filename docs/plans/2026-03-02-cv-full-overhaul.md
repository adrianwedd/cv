# CV Full Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the CV system job-search-ready with a short ATS PDF, polished web presence, accessibility, LinkedIn sync, script modularisation, and Lighthouse performance pass.

**Architecture:** Six independent components that build on each other. The ATS PDF adds a second PDF generation path in `cv-generator.js`. Web hygiene adds static files to the repo root (favicon, robots.txt, sitemap.xml, manifest.json) — note that `cv-generator.js` already generates these into `dist/`, but they're missing from the repo root for local dev and for crawlers hitting the live site directly. Script modularisation splits the 26KB `script.js` monolith into ES modules. The pipeline (`cv-generator.js`) must be updated to copy all new module files to `dist/`.

**Tech Stack:** HTML/CSS/JS (ES modules, no bundler), Node.js (cv-generator.js), Puppeteer (PDF generation), GitHub Actions CI/CD.

**Important context files:**
- `assets/script.js` — 749 lines, single-file monolith. Contains `CVApplication` class, `sanitizeURL()`, `CONFIG`, and all section renderers.
- `assets/styles.css` — All styling including `@media print` rules.
- `.github/scripts/cv-generator.js` — Pipeline generator. Already has `generateSitemap()`, `generateRobotsTxt()`, `generateManifest()`, `generatePDF()`.
- `index.html` — Static HTML template. Sections: header, about, experience, projects, activity, skills, achievements, education, interests, footer.
- `data/base-cv.json` — Source of truth for all CV content.
- `../job-search/linkedin-profile.md` — LinkedIn copy-paste doc (out of sync).

---

### Task 1: ATS-Optimised Short PDF Generator

Add a second PDF generation method to `cv-generator.js` that produces a tight 2-3 page ATS-friendly PDF.

**Files:**
- Create: `.github/scripts/ats-template.html` — minimal HTML template for ATS PDF
- Modify: `.github/scripts/cv-generator.js` — add `generateATSPDF()` method
- Modify: `.github/scripts/cv-generator.test.js` — add test for ATS PDF generation

**Step 1: Create the ATS HTML template**

Create `.github/scripts/ats-template.html` with a clean, ATS-parseable layout:
- No CSS custom properties, no canvas, no theme toggle
- System fonts only (no Google Fonts)
- Simple semantic HTML: `<h1>` name, `<h2>` sections, `<ul>` for bullets
- No colour beyond black text on white background
- Minimal inline CSS for layout (no external stylesheet)

The template should have placeholder markers that `cv-generator.js` replaces:
- `{{NAME}}`, `{{TITLE}}`, `{{LOCATION}}`, `{{PHONE}}`, `{{EMAIL}}`, `{{LINKEDIN}}`, `{{GITHUB}}`
- `{{SUMMARY}}` — 3-4 sentence trimmed version
- `{{COMPETENCIES}}` — Core Competencies section
- `{{EXPERIENCE}}` — Most recent 3 roles
- `{{PROJECTS}}` — Top 3 projects as bullets
- `{{SKILLS}}` — Flat comma-separated list
- `{{EDUCATION}}` — 2 entries

Template structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{NAME}} - {{TITLE}}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 0; padding: 20mm; }
    h1 { font-size: 18pt; margin: 0 0 4pt; }
    h2 { font-size: 13pt; border-bottom: 1px solid #000; padding-bottom: 2pt; margin: 12pt 0 6pt; text-transform: uppercase; }
    h3 { font-size: 11pt; margin: 6pt 0 2pt; }
    .contact { font-size: 10pt; margin-bottom: 8pt; }
    .contact a { color: #000; }
    .role-header { display: flex; justify-content: space-between; align-items: baseline; }
    .period { font-size: 10pt; color: #444; }
    .company { font-size: 10pt; color: #444; }
    ul { margin: 2pt 0 6pt; padding-left: 18pt; }
    li { margin-bottom: 2pt; }
    .skills-list { font-size: 10pt; }
    .projects-list li { margin-bottom: 4pt; }
    p { margin: 2pt 0; }
  </style>
</head>
<body>
  <h1>{{NAME}}</h1>
  <div class="subtitle">{{TITLE}}</div>
  <div class="contact">
    {{LOCATION}} | {{PHONE}} | <a href="mailto:{{EMAIL}}">{{EMAIL}}</a> | <a href="{{LINKEDIN}}">LinkedIn</a> | <a href="{{GITHUB}}">GitHub</a>
  </div>

  <h2>Summary</h2>
  <p>{{SUMMARY}}</p>

  <h2>Core Competencies</h2>
  {{COMPETENCIES}}

  <h2>Experience</h2>
  {{EXPERIENCE}}

  <h2>Key Projects</h2>
  <ul class="projects-list">{{PROJECTS}}</ul>

  <h2>Technical Skills</h2>
  <div class="skills-list">{{SKILLS}}</div>

  <h2>Education</h2>
  {{EDUCATION}}
</body>
</html>
```

**Step 2: Write the test for ATS PDF generation**

Add to `.github/scripts/cv-generator.test.js`:

```javascript
test('should generate ATS PDF template with correct placeholders', async () => {
    mockFs();
    const generator = new CVGenerator();
    generator.cvData = {
        personal_info: { name: 'Test User', title: 'Test Title', location: 'Test City', phone: '+1234', email: 'test@test.com', linkedin: 'https://linkedin.com/in/test', github: 'https://github.com/test' },
        professional_summary: 'Test summary.',
        experience: [{ position: 'Dev', company: 'Co', period: '2020-2025', description: 'Did things.', achievements: ['Built stuff'], technologies: ['JS'] }],
        projects: [{ name: 'Proj1', description: 'A project.' }],
        skills: [{ name: 'Python', category: 'Languages' }],
        education: [{ degree: 'CS', institution: 'Uni', period: '2015-2020' }]
    };
    const html = generator.buildATSHTML();
    assert(html.includes('Test User'));
    assert(html.includes('Test Title'));
    assert(html.includes('Test summary'));
    assert(!html.includes('{{'));
});
```

**Step 3: Run the test to verify it fails**

Run: `cd .github/scripts && node --test cv-generator.test.js`
Expected: FAIL — `generator.buildATSHTML is not a function`

**Step 4: Implement `buildATSHTML()` and `generateATSPDF()` in cv-generator.js**

Add two methods to the `CVGenerator` class:

`buildATSHTML()` — reads the ATS template, replaces all placeholders with data from `this.cvData`:
- `{{SUMMARY}}` — first 3 sentences of `professional_summary`
- `{{EXPERIENCE}}` — first 3 entries from `experience` array, each with: `<div class="role-header"><h3>Position</h3><span class="period">Period</span></div><div class="company">Company</div><ul>` + first 3 achievements as `<li>` + `</ul>`
- `{{PROJECTS}}` — first 3 entries: `<li><strong>Name</strong> — Description</li>`
- `{{SKILLS}}` — all skills grouped by category as: `<strong>Category:</strong> Skill1, Skill2, Skill3<br>`
- `{{EDUCATION}}` — all education entries: `<h3>Degree</h3><div class="company">Institution</div><div class="period">Period</div>`
- `{{COMPETENCIES}}` — read from the static Core Competencies in index.html or hardcode: AI Safety & Evaluation, Frontier AI Models, Risk Assessment, Policy Translation

`generateATSPDF()` — uses Puppeteer to render `buildATSHTML()` to PDF with tighter margins (15mm) and A4 format. Saves to `dist/assets/adrian-wedd-cv-short.pdf`.

**Step 5: Call `generateATSPDF()` from `generate()`**

Add `await this.generateATSPDF();` after `await this.generatePDF();` in the `generate()` method.

**Step 6: Run the test to verify it passes**

Run: `cd .github/scripts && node --test cv-generator.test.js`
Expected: PASS

**Step 7: Add the short PDF link to index.html**

In `index.html`, find the existing PDF link and add a second link next to it for the ATS version. Look for the `<a>` with `class="contact-link pdf"` and add:
```html
<a href="assets/adrian-wedd-cv-short.pdf" class="contact-link pdf-short" target="_blank" rel="noopener noreferrer">Short PDF</a>
```

**Step 8: Update copyAssets() to copy the short PDF**

In `cv-generator.js` `copyAssets()`, the PDF is already generated into `dist/assets/` by `generateATSPDF()`, so no additional copy needed. But ensure the `assets/` directory in dist exists before PDF generation runs (it does — `copyAssets` is called before `generatePDF` in the current flow... actually checking: `generate()` calls `generateHTML()`, then `copyAssets()`, then `generatePDF()`. So `dist/assets/` exists by the time PDFs generate. Good.)

**Step 9: Commit**

```bash
git add .github/scripts/ats-template.html .github/scripts/cv-generator.js .github/scripts/cv-generator.test.js index.html
git commit -m "feat: add ATS-optimised short PDF generation (2-3 pages)"
```

---

### Task 2: LinkedIn Profile Sync

Update the LinkedIn copy-paste document to match current CV state.

**Files:**
- Modify: `../job-search/linkedin-profile.md`

**Step 1: Update the About/Summary section**

Remove references to VERITAS and NeuroConnect. Update repo count from "15+" to "8 active". Add mention of the book. Update the current projects list to match base-cv.json projects.

**Step 2: Update the Experience section**

Add "DJ / Multimedia Artist / Freelance Technologist" as entry #7 (~2000-2010) with 3-4 bullets matching base-cv.json. Update Freelance entry description to match current CV (transition from government, small client base by design).

**Step 3: Update the Featured section**

Add the book as #1 in Featured:
```markdown
1. **This Wasn't in the Brochure** — https://thiswasntinthebrochure.wtf
   _(Pin as "Link")_
```

Move existing items down.

**Step 4: Refresh the headline**

Current: `AI Systems Engineer · LLM Red-Teaming & Adversarial Evaluation · RAG Pipelines · Voice AI · Agentic Systems · Open to Remote Contract`

Proposed (broader for multi-role search): `AI Safety Researcher & Developer · Red-Teaming · Cybersecurity · LLM Evaluation · Adversarial Testing · Open to Remote`

**Step 5: Sync skills list**

Update the ordered skills list to match current CV skills, including: Penetration Testing, IDAM, Essential Eight, Content Safety, Hallucination Detection.

**Step 6: Commit**

```bash
cd ../job-search
git add linkedin-profile.md
git commit -m "sync: update LinkedIn profile copy to match current CV content"
```

---

### Task 3: Web Hygiene — Favicon, robots.txt, sitemap.xml, manifest.json

Add missing web files to repo root for local dev and direct-access scenarios.

**Files:**
- Create: `favicon.svg` — SVG favicon with "AW" initials
- Create: `robots.txt` — allow all, point to sitemap
- Create: `sitemap.xml` — main page + watch-me-work
- Create: `manifest.json` — minimal PWA metadata
- Modify: `index.html` — update favicon link, add manifest link

**Step 1: Create favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#070a0f"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#8ac7d9" text-anchor="middle">AW</text>
</svg>
```

**Step 2: Create robots.txt**

```
User-agent: *
Allow: /

Sitemap: https://cv.adrianwedd.com/sitemap.xml

# Disallow crawler access to data files for privacy
Disallow: /data/
```

**Step 3: Create sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cv.adrianwedd.com</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cv.adrianwedd.com/watch-me-work.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

Note: The pipeline's `generateSitemap()` overwrites this in `dist/` with a timestamped version. The repo-root version is for local dev and as a template.

**Step 4: Create manifest.json**

```json
{
  "name": "Adrian Wedd - AI Safety Researcher & Developer",
  "short_name": "Adrian Wedd",
  "description": "AI Safety Researcher & Developer",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#070a0f",
  "theme_color": "#8ac7d9",
  "icons": [
    {
      "src": "favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

**Step 5: Update index.html favicon and manifest links**

Replace the existing inline SVG favicon with:
```html
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="manifest" href="manifest.json">
```

**Step 6: Update cv-generator.js to copy new root files**

In `copyAssets()`, add:
```javascript
// Copy root web files
for (const file of ['favicon.svg', 'robots.txt', 'sitemap.xml', 'manifest.json']) {
    try {
        const src = path.join(CONFIG.INPUT_DIR, file);
        const dst = path.join(CONFIG.OUTPUT_DIR, file);
        await fs.copyFile(src, dst);
    } catch (e) {
        console.warn(`⚠️ ${file} not found:`, e.message);
    }
}
```

Also update `generateSitemap()` to include `watch-me-work.html` as a proper URL (not just hash fragments), and remove the hash-fragment-only URLs which are not real pages.

**Step 7: Commit**

```bash
git add favicon.svg robots.txt sitemap.xml manifest.json index.html .github/scripts/cv-generator.js
git commit -m "feat: add favicon, robots.txt, sitemap.xml, manifest.json for web hygiene"
```

---

### Task 4: Accessibility — ARIA Landmarks + WCAG AA Contrast Audit

**Files:**
- Modify: `index.html` — add ARIA roles and labels
- Modify: `assets/script.js` — add ARIA attributes to JS-rendered content
- Modify: `assets/styles.css` — fix any contrast issues found

**Step 1: Add ARIA landmarks to index.html**

Add to existing elements:
- `<header class="header" id="header">` → add `role="banner"`
- `<main class="main-content">` → add `role="main"`
- `<footer class="footer">` → add `role="contentinfo"`
- Each `<section>` → add `aria-label` matching its heading:
  - `<section id="about" aria-label="About">`
  - `<section id="experience" aria-label="Experience">`
  - `<section id="projects" aria-label="Projects">`
  - `<section id="skills" aria-label="Skills">`
  - `<section id="achievements" aria-label="Achievements">`
  - `<section id="education" aria-label="Education">`
  - `<section id="interests" aria-label="Interests">`

**Step 2: Add aria-labels to interactive elements**

- Theme toggle button: `aria-label="Toggle dark and light theme"`
- Each contact link: `aria-label="Email Adrian Wedd"`, `aria-label="Phone"`, `aria-label="View PDF"`, etc.
- Print button if exists: `aria-label="Print CV"`

**Step 3: Add ARIA to JS-rendered content in script.js**

In `initializeSkillsSection()`: add `role="list"` to `itemsDiv` and `role="listitem"` to each `skillItem`.

In `initializeInterestsSection()`: the `<ul>` already implies list semantics — no change needed.

In `initializeProjectsSection()`: add `role="article"` to each project card.

**Step 4: Run WCAG AA contrast audit**

Use the browser to check contrast ratios. Key pairs to verify:

Dark theme (`:root`):
- Text `#e9eef6` on background `#070a0f` — should be 15.8:1 (passes)
- Primary `#8ac7d9` on background `#070a0f` — check ratio
- Secondary text / muted text — check ratio
- Tech tags, skill levels — check ratio

Light theme (`[data-theme="light"]`):
- Check the equivalent pairs

Use `https://webaim.org/resources/contrastchecker/` or browser DevTools audit.

Fix any failing ratios by adjusting the CSS custom properties in `:root` or `[data-theme="light"]`.

**Step 5: Commit**

```bash
git add index.html assets/script.js assets/styles.css
git commit -m "feat: add ARIA landmarks, labels, and WCAG AA contrast compliance"
```

---

### Task 5: Script.js Modularisation (Issue #210)

Split the 749-line `assets/script.js` into ES modules.

**Files:**
- Modify: `assets/script.js` — becomes thin entry point
- Create: `assets/modules/config.js` — CONFIG object
- Create: `assets/modules/utils.js` — sanitizeURL, formatDateTime, groupSkillsByCategory
- Create: `assets/modules/theme.js` — theme toggle logic
- Create: `assets/modules/data-loader.js` — all fetch/load methods
- Create: `assets/modules/sections/about.js` — initializeAboutSection
- Create: `assets/modules/sections/experience.js` — initializeExperienceSection
- Create: `assets/modules/sections/projects.js` — initializeProjectsSection
- Create: `assets/modules/sections/skills.js` — initializeSkillsSection
- Create: `assets/modules/sections/achievements.js` — initializeAchievementsSection
- Create: `assets/modules/sections/education.js` — initializeEducationSection
- Create: `assets/modules/sections/interests.js` — initializeInterestsSection
- Create: `assets/modules/defaults.js` — all getDefault* methods
- Modify: `index.html` — change `<script>` to `<script type="module">`
- Modify: `.github/scripts/cv-generator.js` — update `copyAssets()` to copy module files

**Step 1: Create `assets/modules/` directory structure**

```
assets/modules/
  config.js
  utils.js
  theme.js
  data-loader.js
  defaults.js
  sections/
    about.js
    experience.js
    projects.js
    skills.js
    achievements.js
    education.js
    interests.js
```

**Step 2: Extract `config.js`**

```javascript
export const CONFIG = {
    DATA_ENDPOINTS: {
        BASE_CV: 'data/base-cv.json',
        ACTIVITY_SUMMARY: 'data/activity-summary.json',
        AI_ENHANCEMENTS: 'data/ai-enhancements.json',
        GITHUB_API: 'https://api.github.com/users/adrianwedd'
    },
    THEME_KEY: 'cv-theme',
    USERNAME: 'adrianwedd'
};
```

**Step 3: Extract `utils.js`**

```javascript
export function sanitizeURL(url) {
    if (!url) return '';
    const str = String(url).trim();
    if (/^mailto:/i.test(str)) return str;
    try {
        const parsed = new URL(str);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch { /* invalid URL */ }
    return '';
}

export function formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export function groupSkillsByCategory(skills) {
    return skills.reduce((categories, skill) => {
        const category = skill.category || 'Other';
        if (!categories[category]) categories[category] = [];
        categories[category].push(skill);
        return categories;
    }, {});
}
```

**Step 4: Extract `theme.js`**

```javascript
import { CONFIG } from './config.js';

export function setupThemeToggle(themePreference, onToggle) {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    if (themeToggle) {
        themeToggle.addEventListener('click', onToggle);
        if (themeIcon) themeIcon.textContent = themePreference === 'dark' ? '☀' : '☾';
    }
}

export function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

export function getStoredTheme() {
    return localStorage.getItem(CONFIG.THEME_KEY) || 'dark';
}

export function storeTheme(theme) {
    localStorage.setItem(CONFIG.THEME_KEY, theme);
}
```

**Step 5: Extract `data-loader.js`**

Move `loadCVData`, `loadActivityData`, `loadAIEnhancements`, `loadGitHubStats` as standalone exported async functions. Each checks `window.__*_DATA__` first, then fetches.

```javascript
import { CONFIG } from './config.js';

export async function loadCVData() {
    if (window.__CV_DATA__) return window.__CV_DATA__;
    const response = await fetch(CONFIG.DATA_ENDPOINTS.BASE_CV);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}
// ... same pattern for others
```

**Step 6: Extract `defaults.js`**

Move all `getDefault*()` methods as standalone exports.

**Step 7: Extract each section renderer into `sections/*.js`**

Each file exports a single function, e.g.:
```javascript
// sections/experience.js
export function initializeExperienceSection(cvData, defaults) {
    const timeline = document.getElementById('experience-timeline');
    if (!timeline) return;
    const experiences = cvData?.experience || defaults;
    // ... rest of rendering logic
}
```

Each section renderer takes the data it needs as parameters (not `this`).

**Step 8: Rewrite `script.js` as thin entry point**

```javascript
import { CONFIG } from './modules/config.js';
import { setupThemeToggle, applyTheme, getStoredTheme, storeTheme } from './modules/theme.js';
import { formatDateTime } from './modules/utils.js';
import { loadCVData, loadActivityData, loadAIEnhancements, loadGitHubStats } from './modules/data-loader.js';
import { getDefaultExperience, getDefaultProjects, getDefaultSkills, getDefaultAchievements, getDefaultCVData } from './modules/defaults.js';
import { initializeAboutSection } from './modules/sections/about.js';
import { initializeExperienceSection } from './modules/sections/experience.js';
import { initializeProjectsSection } from './modules/sections/projects.js';
import { initializeSkillsSection } from './modules/sections/skills.js';
import { initializeAchievementsSection } from './modules/sections/achievements.js';
import { initializeEducationSection } from './modules/sections/education.js';
import { initializeInterestsSection } from './modules/sections/interests.js';

class CVApplication {
    constructor() {
        this.themePreference = getStoredTheme();
        this.init();
    }

    async init() {
        try {
            applyTheme(this.themePreference);
            this.setupEventListeners();
            setupThemeToggle(this.themePreference, () => this.toggleTheme());
            await this.loadApplicationData();
            this.initializeContentSections();
            this.updateFooterTimestamp();
        } catch (error) {
            console.error('Application initialization failed:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') document.body.classList.add('keyboard-navigation');
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.refreshLiveData();
        });
        const printBtn = document.getElementById('print-btn');
        if (printBtn) printBtn.addEventListener('click', () => window.print());
    }

    async loadApplicationData() {
        const [cvData, activityData, aiData, githubStats] = await Promise.allSettled([
            loadCVData().catch(() => getDefaultCVData()),
            loadActivityData().catch(() => ({})),
            loadAIEnhancements().catch(() => ({})),
            loadGitHubStats().catch(() => ({}))
        ]);
        this.cvData = cvData.status === 'fulfilled' ? cvData.value : {};
        this.activityData = activityData.status === 'fulfilled' ? activityData.value : {};
        this.aiEnhancements = aiData.status === 'fulfilled' ? aiData.value : {};
        this.githubStats = githubStats.status === 'fulfilled' ? githubStats.value : {};
    }

    initializeContentSections() {
        initializeAboutSection(this.cvData, this.aiEnhancements);
        initializeExperienceSection(this.cvData, getDefaultExperience());
        initializeProjectsSection(this.cvData, getDefaultProjects());
        initializeSkillsSection(this.cvData, getDefaultSkills());
        initializeAchievementsSection(this.cvData, getDefaultAchievements());
        initializeEducationSection(this.cvData);
        initializeInterestsSection(this.cvData);
    }

    toggleTheme() {
        this.themePreference = this.themePreference === 'dark' ? 'light' : 'dark';
        applyTheme(this.themePreference);
        storeTheme(this.themePreference);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) themeIcon.textContent = this.themePreference === 'dark' ? '☀' : '☾';
    }

    updateFooterTimestamp() {
        const el = document.getElementById('footer-last-updated');
        if (el) {
            const ts = this.aiEnhancements?.last_updated || this.activityData?.last_updated || new Date().toISOString();
            el.textContent = formatDateTime(ts);
        }
    }

    async refreshLiveData() {
        try {
            this.activityData = await loadActivityData();
            this.updateFooterTimestamp();
        } catch (error) {
            console.warn('Failed to refresh live data:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new CVApplication());
```

**Step 9: Update index.html script tag**

Change:
```html
<script src="assets/script.js"></script>
```
To:
```html
<script type="module" src="assets/script.js"></script>
```

**Step 10: Update cv-generator.js copyAssets()**

Add module copying after the main script copy:

```javascript
// Copy JS modules
const modulesSourceDir = path.join(CONFIG.ASSETS_DIR, 'modules');
const modulesOutputDir = path.join(assetsOutputDir, 'modules');
const modulesExist = await fs.access(modulesSourceDir).then(() => true).catch(() => false);
if (modulesExist) {
    await fs.mkdir(path.join(modulesOutputDir, 'sections'), { recursive: true });
    const moduleFiles = await fs.readdir(modulesSourceDir);
    for (const file of moduleFiles) {
        const srcPath = path.join(modulesSourceDir, file);
        const stat = await fs.stat(srcPath);
        if (stat.isFile() && file.endsWith('.js')) {
            await fs.copyFile(srcPath, path.join(modulesOutputDir, file));
        }
    }
    // Copy sections subdirectory
    const sectionsDir = path.join(modulesSourceDir, 'sections');
    const sectionsExist = await fs.access(sectionsDir).then(() => true).catch(() => false);
    if (sectionsExist) {
        const sectionFiles = await fs.readdir(sectionsDir);
        for (const file of sectionFiles) {
            if (file.endsWith('.js')) {
                await fs.copyFile(
                    path.join(sectionsDir, file),
                    path.join(modulesOutputDir, 'sections', file)
                );
            }
        }
    }
    console.log('✅ JS modules copied');
}
```

**Step 11: Handle the CJS export at the bottom of script.js**

The old `script.js` had:
```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CVApplication, CONFIG };
}
```
Remove this — ES modules don't use `module.exports`. The `cv-generator.test.js` doesn't import from `script.js` so this won't break tests.

**Step 12: Test locally**

Run: `python3 -m http.server 8000`
Open: `http://localhost:8000`
Verify: All sections render, theme toggle works, no console errors.

**Step 13: Commit**

```bash
git add assets/script.js assets/modules/ index.html .github/scripts/cv-generator.js
git commit -m "refactor: modularise script.js into ES modules (closes #210)"
```

---

### Task 6: Lighthouse Performance Pass

Run Lighthouse and fix whatever scores below 90.

**Files:**
- Potentially modify: `index.html`, `assets/styles.css`, `assets/modules/*.js`

**Step 1: Run Lighthouse**

Open Chrome, navigate to `http://localhost:8000`, run Lighthouse (Performance, Accessibility, Best Practices, SEO).

Or via CLI: `npx lighthouse http://localhost:8000 --output=json --output-path=./lighthouse.json`

**Step 2: Fix flagged issues**

Common fixes expected:
- **SEO:** Meta description may be truncated or missing — already present, should pass.
- **Accessibility:** Should now pass with ARIA work from Task 4.
- **Best Practices:** May flag mixed content, CSP issues, or deprecated APIs.
- **Performance:** May flag LCP (largest contentful paint) or CLS. The curvature-field canvas could impact FCP.

For og-image.png (118KB): compress to <50KB using:
```bash
npx sharp-cli -i assets/og-image.png -o assets/og-image.png --quality 80
```
Or use `sips` on macOS:
```bash
sips -s format png -s formatOptions 80 assets/og-image.png --out assets/og-image.png
```

**Step 3: Add font preload hint if Lighthouse flags it**

If Lighthouse flags font loading as render-blocking, add before the Google Fonts `<link>`:
```html
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap" as="style">
```

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "perf: Lighthouse fixes — compress og-image, font preload, a11y cleanup"
```

---

### Task 7: Final Integration — Push, Pipeline, Verify

**Step 1: Push all changes**

```bash
git push origin main
```

**Step 2: Trigger pipeline**

```bash
gh workflow run cv-enhancement.yml --ref main
```

**Step 3: Monitor pipeline**

```bash
gh run watch <run-id> --exit-status
```

If the flaky test fails, re-trigger once.

**Step 4: Pull pipeline commit**

```bash
git pull origin main
```

**Step 5: Verify live site**

Check:
- Both PDFs accessible: `cv.adrianwedd.com/assets/adrian-wedd-cv.pdf` and `cv.adrianwedd.com/assets/adrian-wedd-cv-short.pdf`
- Short PDF is 2-3 pages
- Favicon shows in browser tab
- `cv.adrianwedd.com/robots.txt` returns correct content
- `cv.adrianwedd.com/sitemap.xml` returns correct content
- All sections render with ARIA attributes (check with DevTools)
- Theme toggle works
- No console errors

**Step 6: Close issue #210**

```bash
gh issue close 210 --comment "Resolved in script modularisation — script.js split into ES modules"
```

**Step 7: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup after full overhaul"
git push origin main
```
