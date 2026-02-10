// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Playwright smoke tests for the CV site.
 *
 * These serve index.html via a local static server and verify
 * core rendering, security, and theme behaviour.
 */

test.describe('CV Site Smoke Tests', () => {

  test('page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected network warnings (activity-summary, ai-enhancements may 404)
    const realErrors = errors.filter(
      (e) => !e.includes('HTTP 404') && !e.includes('Failed to fetch')
    );
    expect(realErrors).toEqual([]);
  });

  test('title contains "Adrian Wedd"', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Adrian Wedd/);
  });

  test('JSON data loads successfully', async ({ page }) => {
    const fetchErrors = [];
    page.on('response', (response) => {
      if (response.url().includes('base-cv.json') && !response.ok()) {
        fetchErrors.push(`base-cv.json returned ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(fetchErrors).toEqual([]);
  });

  test('no innerHTML usage in script.js', async () => {
    const scriptPath = path.resolve(__dirname, '..', 'assets', 'script.js');
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).not.toMatch(/\.innerHTML\s*=/);
  });

  test('all external links have rel containing "noopener"', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const unsafeLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[target="_blank"]');
      const unsafe = [];
      links.forEach((link) => {
        const rel = link.getAttribute('rel') || '';
        if (!rel.includes('noopener')) {
          unsafe.push({ href: link.getAttribute('href'), rel });
        }
      });
      return unsafe;
    });

    expect(unsafeLinks).toEqual([]);
  });

  test('dark theme is default', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Dark is default when no data-theme attribute is set
    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(dataTheme).toBeNull();

    // Verify background is dark (rgb values should be low)
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // Parse rgb(r, g, b) and check brightness is low
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const brightness = (parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3])) / 3;
      expect(brightness).toBeLessThan(50);
    }
  });

  test('curvature field canvas exists', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#curvature-bg');
    await expect(canvas).toBeAttached();
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  test('experience section renders entries', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for JS to populate the timeline
    const timelineItems = page.locator('#experience-timeline .timeline-item');
    await expect(timelineItems.first()).toBeVisible({ timeout: 5000 });

    const count = await timelineItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('projects section renders entries', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const projectCards = page.locator('#projects-grid .project-card');
    await expect(projectCards.first()).toBeVisible({ timeout: 5000 });

    const count = await projectCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('skills section renders entries', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const skillCategories = page.locator('#skills-container .skill-category');
    await expect(skillCategories.first()).toBeVisible({ timeout: 5000 });

    const count = await skillCategories.count();
    expect(count).toBeGreaterThan(0);
  });
});
