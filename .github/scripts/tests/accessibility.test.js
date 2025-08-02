const assert = require('assert');
const { test, suite, beforeEach, afterEach } = require('node:test');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

suite('Accessibility Tests (WCAG 2.1 AA)', () => {
    let browser;
    let page;
    const testUrl = path.join(__dirname, '..', '..', '..', 'index.html');

    test.beforeEach(async () => {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        
        // Load the CV page
        await page.goto(`file://${testUrl}`, { waitUntil: 'networkidle0' });
    });

    test.afterEach(async () => {
        if (page) await page.close();
        if (browser) await browser.close();
    });

    test('should have proper heading hierarchy', async () => {
        const headings = await page.evaluate(() => {
            const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            return headingElements.map(h => ({
                tag: h.tagName.toLowerCase(),
                text: h.textContent.trim(),
                level: parseInt(h.tagName[1])
            }));
        });

        // Should have exactly one h1
        const h1Count = headings.filter(h => h.tag === 'h1').length;
        assert.strictEqual(h1Count, 1, 'Should have exactly one h1 element');

        // Check heading hierarchy (no skipped levels)
        for (let i = 1; i < headings.length; i++) {
            const currentLevel = headings[i].level;
            const previousLevel = headings[i - 1].level;
            assert(currentLevel <= previousLevel + 1, 
                `Heading hierarchy violation: h${previousLevel} followed by h${currentLevel}`);
        }
    });

    test('should have proper ARIA labels and roles', async () => {
        const ariaElements = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('[aria-label], [aria-labelledby], [role]'));
            return elements.map(el => ({
                tag: el.tagName.toLowerCase(),
                ariaLabel: el.getAttribute('aria-label'),
                ariaLabelledBy: el.getAttribute('aria-labelledby'),
                role: el.getAttribute('role'),
                hasText: el.textContent.trim().length > 0
            }));
        });

        // Verify that elements with ARIA labels are meaningful
        ariaElements.forEach(el => {
            if (el.ariaLabel) {
                assert(el.ariaLabel.length > 0, `Empty aria-label on ${el.tag} element`);
            }
            if (el.role && el.role === 'button') {
                assert(el.ariaLabel || el.hasText, 
                    `Button with role="button" should have aria-label or text content`);
            }
        });
    });

    test('should have sufficient color contrast', async () => {
        // Simple contrast check - in production you'd use axe-core or similar
        const contrastIssues = await page.evaluate(() => {
            const issues = [];
            const elements = Array.from(document.querySelectorAll('*'));
            
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const backgroundColor = style.backgroundColor;
                
                // Basic check for common contrast issues
                if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
                    issues.push({
                        element: el.tagName.toLowerCase(),
                        issue: 'Low contrast: gray text on white background'
                    });
                }
            });
            
            return issues;
        });

        assert.strictEqual(contrastIssues.length, 0, 
            `Color contrast issues found: ${JSON.stringify(contrastIssues)}`);
    });

    test('should have proper focus management', async () => {
        // Test keyboard navigation
        const focusableElements = await page.evaluate(() => {
            const focusables = Array.from(document.querySelectorAll(
                'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
            ));
            return focusables.map(el => ({
                tag: el.tagName.toLowerCase(),
                type: el.type || null,
                href: el.href || null,
                tabindex: el.tabIndex
            }));
        });

        // Should have focusable elements
        assert(focusableElements.length > 0, 'Should have focusable elements');

        // Test that first focusable element can receive focus
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => {
            return document.activeElement ? document.activeElement.tagName.toLowerCase() : null;
        });
        
        assert(focusedElement, 'Should be able to focus on an element');
    });

    test('should have proper semantic HTML structure', async () => {
        const semanticElements = await page.evaluate(() => {
            const semantic = [
                'header', 'nav', 'main', 'section', 'article', 
                'aside', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
            ];
            
            const found = {};
            semantic.forEach(tag => {
                found[tag] = document.querySelectorAll(tag).length;
            });
            
            return found;
        });

        // Should have main content area
        assert(semanticElements.main > 0, 'Should have a main element');
        
        // Should have proper heading structure
        assert(semanticElements.h1 === 1, 'Should have exactly one h1');
        assert(semanticElements.h2 > 0, 'Should have at least one h2');
    });

    test('should be responsive and mobile-accessible', async () => {
        // Test mobile viewport
        await page.setViewport({ width: 375, height: 667 }); // iPhone SE
        await new Promise(resolve => setTimeout(resolve, 500)); // Allow reflow

        const mobileMetrics = await page.evaluate(() => {
            return {
                hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
                smallestClickTarget: Math.min(...Array.from(document.querySelectorAll('button, a'))
                    .map(el => Math.min(el.offsetWidth, el.offsetHeight))),
                viewportWidth: window.innerWidth
            };
        });

        // Should not have horizontal scroll on mobile
        assert(!mobileMetrics.hasHorizontalScroll, 
            'Should not have horizontal scroll on mobile viewport');

        // Click targets should be at least 44px (iOS guidelines)
        if (mobileMetrics.smallestClickTarget > 0) {
            assert(mobileMetrics.smallestClickTarget >= 44, 
                `Click targets should be at least 44px, found ${mobileMetrics.smallestClickTarget}px`);
        }
    });

    test('should have proper alt text for images', async () => {
        const images = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                alt: img.alt,
                hasAlt: img.hasAttribute('alt'),
                isDecorative: img.getAttribute('role') === 'presentation' || img.alt === ''
            }));
        });

        images.forEach((img, index) => {
            assert(img.hasAlt, `Image ${index + 1} should have alt attribute`);
            if (!img.isDecorative) {
                assert(img.alt && img.alt.length > 0, 
                    `Non-decorative image ${index + 1} should have meaningful alt text`);
            }
        });
    });

    test('should have skip navigation link', async () => {
        const skipLink = await page.evaluate(() => {
            const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]'))
                .filter(link => link.textContent.toLowerCase().includes('skip'));
            
            return skipLinks.length > 0 ? {
                exists: true,
                text: skipLinks[0].textContent.trim(),
                href: skipLinks[0].href
            } : { exists: false };
        });

        assert(skipLink.exists, 'Should have a skip navigation link');
        assert(skipLink.text.length > 0, 'Skip link should have meaningful text');
    });
});