

# To run this script, ensure you have playwright and playwright-stealth installed:
# pip install playwright playwright-stealth
# playwright install

from playwright.sync_api import sync_playwright
from playwright_stealth import stealth_sync
import time
import random

def basic_scraper(url):
    print(f"Attempting to scrape: {url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) # Set to False for headful mode
        stealth_sync(browser) # Apply stealth techniques
        
        page = browser.new_page()
        
        try:
            # Mimic human-like navigation
            page.goto(url, wait_until="domcontentloaded")
            time.sleep(random.uniform(2, 5)) # Random delay

            # Simulate scrolling
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(random.uniform(1, 3))
            page.evaluate("window.scrollTo(0, 0)")

            # Extract title and a paragraph
            title = page.title()
            first_paragraph = page.locator("p").first.text_content()

            print(f"\nTitle: {title}")
            print(f"First paragraph: {first_paragraph[:200]}...")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    # Example usage: Replace with a target URL for testing
    target_url = "https://www.example.com"
    basic_scraper(target_url)

