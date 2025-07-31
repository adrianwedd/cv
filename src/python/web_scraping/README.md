# Web Scraping Utilities

This directory contains Python scripts for web scraping, primarily utilizing Playwright.

## `basic_scraper.py`

This script demonstrates basic web scraping using Playwright with `playwright-stealth` to mimic human behavior and avoid bot detection. It includes random delays and simulated scrolling.

**Installation:**
To run this script, you need to install Playwright and `playwright-stealth`:

```bash
pip install playwright playwright-stealth
playwright install
```

**Usage:**

```bash
python basic_scraper.py
```

Modify the `target_url` variable within the script to test different websites.
