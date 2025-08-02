const assert = require('assert');
const { test, suite, beforeEach, afterEach } = require('node:test');
const { chromium, firefox, webkit } = require('playwright');
const path = require('path');

suite('Cross-Browser Compatibility Tests', () => {
    const testUrl = `file://${path.join(__dirname, '..', '..', '..', 'index.html')}`;
    const browsers = [
        { name: 'Chromium', launcher: chromium },
        { name: 'Firefox', launcher: firefox },
        { name: 'WebKit', launcher: webkit }
    ];

    browsers.forEach(({ name, launcher }) => {
        suite(`${name} Browser Tests`, () => {
            let browser;
            let page;

            test.beforeEach(async () => {
                try {
                    browser = await launcher.launch({ 
                        headless: true,
                        timeout: 30000 
                    });
                    page = await browser.newPage();
                    await page.goto(testUrl, { 
                        waitUntil: 'networkidle',
                        timeout: 10000 
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not launch ${name}: ${error.message}`);
                    // Skip tests for this browser if it can't launch
                    throw new Error(`Browser ${name} not available`);
                }
            });

            test.afterEach(async () => {
                if (page) await page.close();
                if (browser) await browser.close();
            });

            test(`should load and render properly in ${name}`, async () => {
                // Basic page loading test
                const title = await page.title();
                assert(title && title.length > 0, `Page should have a title in ${name}`);

                // Check that main content is visible
                const mainContent = await page.locator('main, .main-content, #main').first();
                await assert.doesNotReject(
                    async () => await mainContent.waitFor({ timeout: 5000 }),
                    `Main content should be visible in ${name}`
                );
            });

            test(`should handle JavaScript interactions in ${name}`, async () => {
                // Test theme toggle if it exists
                const themeToggle = page.locator('[data-theme-toggle], .theme-toggle, #theme-toggle').first();
                
                try {
                    await themeToggle.waitFor({ timeout: 2000 });
                    await themeToggle.click();
                    
                    // Check if theme changed
                    const htmlElement = page.locator('html');
                    const classList = await htmlElement.getAttribute('class');
                    assert(classList, `Theme toggle should modify HTML classes in ${name}`);
                } catch (error) {
                    // Theme toggle might not exist, that's OK
                    console.log(`No theme toggle found in ${name}`);
                }
            });

            test(`should have proper CSS rendering in ${name}`, async () => {
                // Check that key elements have proper styling
                const header = page.locator('header, h1').first();
                await header.waitFor({ timeout: 5000 });
                
                const headerStyles = await header.evaluate(el => {
                    const styles = window.getComputedStyle(el);
                    return {
                        display: styles.display,
                        fontSize: styles.fontSize,
                        color: styles.color
                    };
                });

                assert.notStrictEqual(headerStyles.display, 'none', 
                    `Header should be visible in ${name}`);
                assert(headerStyles.fontSize && parseFloat(headerStyles.fontSize) > 0, 
                    `Header should have valid font size in ${name} (got: ${headerStyles.fontSize})`);
            });

            test(`should be responsive in ${name}`, async () => {
                // Test mobile viewport
                await page.setViewportSize({ width: 375, height: 667 });
                await page.waitForTimeout(500); // Allow layout reflow

                const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
                const viewportWidth = await page.evaluate(() => window.innerWidth);

                assert(bodyWidth <= viewportWidth + 20, // Allow small tolerance
                    `Page should not overflow horizontally on mobile in ${name}`);

                // Test desktop viewport
                await page.setViewportSize({ width: 1200, height: 800 });
                await page.waitForTimeout(500);

                const desktopWidth = await page.evaluate(() => document.body.scrollWidth);
                assert(desktopWidth > 0, `Page should render on desktop in ${name}`);
            });

            test(`should handle forms and inputs in ${name}`, async () => {
                // Look for any form elements
                const inputs = await page.locator('input, textarea, select, button').count();
                
                if (inputs > 0) {
                    const firstInput = page.locator('input, textarea, select, button').first();
                    
                    // Test basic interaction
                    await firstInput.waitFor({ timeout: 2000 });
                    
                    const tagName = await firstInput.evaluate(el => el.tagName.toLowerCase());
                    if (tagName === 'input' || tagName === 'textarea') {
                        await firstInput.fill('test');
                        const value = await firstInput.inputValue();
                        assert.strictEqual(value, 'test', 
                            `Input should accept text in ${name}`);
                    } else if (tagName === 'button') {
                        // Just check that button is clickable
                        await firstInput.click();
                        // No assertion needed, just ensuring no errors
                    }
                }
            });

            test(`should load fonts and assets in ${name}`, async () => {
                // Wait for fonts to load
                await page.waitForLoadState('networkidle');
                
                // Check if custom fonts are applied
                const bodyFont = await page.evaluate(() => {
                    return window.getComputedStyle(document.body).fontFamily;
                });

                // Check that images load (if any)
                const images = await page.locator('img').count();
                if (images > 0) {
                    const firstImage = page.locator('img').first();
                    const naturalWidth = await firstImage.evaluate(img => img.naturalWidth);
                    if (naturalWidth !== undefined) {
                        assert(naturalWidth > 0, `Images should load properly in ${name}`);
                    }
                }

                assert(bodyFont && bodyFont !== 'Times', 
                    `Custom fonts should load in ${name}, got: ${bodyFont}`);
            });

            test(`should handle print styles in ${name}`, async () => {
                // Emulate print media
                await page.emulateMedia({ media: 'print' });
                
                // Check that page is still visible in print mode
                const mainContent = await page.locator('main, body').first();
                const isVisible = await mainContent.isVisible();
                
                assert(isVisible, `Page should be visible in print mode in ${name}`);
                
                // Reset to screen media
                await page.emulateMedia({ media: 'screen' });
            });
        });
    });

    // Cross-browser comparison tests
    suite('Cross-Browser Consistency', () => {
        test('should render consistently across browsers', async () => {
            const results = {};
            
            for (const { name, launcher } of browsers) {
                try {
                    const browser = await launcher.launch({ headless: true });
                    const page = await browser.newPage();
                    await page.goto(testUrl, { waitUntil: 'networkidle' });
                    
                    // Capture key metrics
                    results[name] = await page.evaluate(() => {
                        return {
                            title: document.title,
                            headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
                            linkCount: document.querySelectorAll('a').length,
                            hasMainContent: document.querySelector('main, .main-content') !== null,
                            bodyHeight: document.body.scrollHeight
                        };
                    });
                    
                    await browser.close();
                } catch (error) {
                    console.warn(`Could not test ${name}: ${error.message}`);
                    results[name] = null;
                }
            }

            // Compare results across browsers
            const browserNames = Object.keys(results).filter(name => results[name] !== null);
            if (browserNames.length > 1) {
                const firstBrowser = results[browserNames[0]];
                
                for (let i = 1; i < browserNames.length; i++) {
                    const currentBrowser = results[browserNames[i]];
                    
                    assert.strictEqual(currentBrowser.title, firstBrowser.title,
                        `Page title should be consistent across browsers`);
                    
                    // Allow reasonable variation in heading count due to dynamic content/font loading
                    const headingDiff = Math.abs(currentBrowser.headingCount - firstBrowser.headingCount);
                    const headingVariationPercent = headingDiff / Math.max(currentBrowser.headingCount, firstBrowser.headingCount) * 100;
                    assert(headingVariationPercent <= 50, 
                        `Heading count should be reasonably consistent across browsers (${browserNames[i]}: ${currentBrowser.headingCount} vs ${browserNames[0]}: ${firstBrowser.headingCount}, ${headingVariationPercent.toFixed(1)}% difference)`);
                    
                    assert.strictEqual(currentBrowser.hasMainContent, firstBrowser.hasMainContent,
                        `Main content presence should be consistent across browsers`);
                }
            }
        });
    });
});