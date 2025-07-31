import asyncio
import os
import re
import random
from playwright.async_api import async_playwright, Page, BrowserContext, Playwright
from urllib.parse import urlparse

# --- Configuration (can be moved to a config file later) ---
DEFAULT_TIMEOUT = 60000 # 60 seconds
DEFAULT_RETRY_ATTEMPTS = 3
DEFAULT_RETRY_DELAY_MS = 1000

# --- Human Behavior Emulation ---
class HumanEmulator:
    @staticmethod
    async def human_like_typing(page: Page, selector: str, text: str, min_delay: float = 0.08, max_delay: float = 0.25, error_rate: float = 0.02):
        """Types text into an element with human-like delays and optional typos."""
        await page.locator(selector).click()
        for i, char in enumerate(text):
            # Simulate typos and backspaces
            if random.random() < error_rate and i > 0:
                await page.keyboard.press("Backspace")
                await asyncio.sleep(random.uniform(0.05, 0.15))
                await page.keyboard.type(random.choice("abcdefghijklmnopqrstuvwxyz")) # Type a wrong character
                await asyncio.sleep(random.uniform(0.05, 0.15))
                await page.keyboard.press("Backspace")
                await asyncio.sleep(random.uniform(0.05, 0.15))

            delay = random.uniform(min_delay, max_delay)
            await page.keyboard.type(char, delay=delay * 1000)
            await asyncio.sleep(delay / 2)

    @staticmethod
    async def bezier_mouse_move(page: Page, start_x, start_y, end_x, end_y, duration_ms=800):
        """Moves the mouse along a randomized Bézier curve with jitter."""
        # Ensure start_x and start_y are within the visible viewport
        viewport_width = await page.evaluate("window.innerWidth")
        viewport_height = await page.evaluate("window.innerHeight")
        
        start_x = max(0, min(start_x, viewport_width))
        start_y = max(0, min(start_y, viewport_height))

        control_1_x = start_x + (end_x - start_x) * 0.25 + random.uniform(-75, 75)
        control_1_y = start_y + (end_y - start_y) * 0.25 + random.uniform(-75, 75)
        control_2_x = start_x + (end_x - start_x) * 0.75 + random.uniform(-75, 75)
        control_2_y = start_y + (end_y - start_y) * 0.75 + random.uniform(-75, 75)
          
        num_points = int(duration_ms / 20)
        points = []
        for i in range(num_points + 1):
            t = i / num_points
            x = (1-t)**3*start_x + 3*(1-t)**2*t*control_1_x + 3*(1-t)*t**2*control_2_x + t**3*end_x
            y = (1-t)**3*start_y + 3*(1-t)**2*t*control_1_y + 3*(1-t)*t**2*control_2_y + t**3*end_y
            jitter_x = random.uniform(-1.5, 1.5)
            jitter_y = random.uniform(-1.5, 1.5)
            points.append((x + jitter_x, y + jitter_y))

        for x, y in points:
            await page.mouse.move(x, y)
            await asyncio.sleep(random.uniform(0.015, 0.025))
        await page.mouse.move(end_x, end_y)

    @staticmethod
    async def move_and_click(page: Page, selector: str, duration_ms=800):
        """Moves to an element with a human-like path and then clicks it."""
        element = page.locator(selector)
        await element.wait_for(state="visible", timeout=10000)
        box = await element.bounding_box()
        if not box: raise Exception(f"Element '{selector}' not found.")
          
        # Start from a random point within the visible viewport for more human-like movement
        start_pos_x = random.uniform(0, await page.evaluate("window.innerWidth"))
        start_pos_y = random.uniform(0, await page.evaluate("window.innerHeight"))

        target_x = box['x'] + random.uniform(0.3, 0.7) * box['width']
        target_y = box['y'] + random.uniform(0.3, 0.7) * box['height']
          
        await HumanEmulator.bezier_mouse_move(page, start_pos_x, start_pos_y, target_x, target_y, duration_ms)
        await page.mouse.down()
        await asyncio.sleep(random.uniform(0.06, 0.18))
        await page.mouse.up()

    @staticmethod
    async def scroll_human_like(page: Page, scroll_amount: int = 500, duration_ms: int = 1000):
        """Scrolls the page with human-like variations in speed and pauses."""
        current_scroll_y = await page.evaluate("window.scrollY")
        target_scroll_y = current_scroll_y + scroll_amount
        
        start_time = asyncio.get_event_loop().time()
        end_time = start_time + (duration_ms / 1000)
        
        while asyncio.get_event_loop().time() < end_time and await page.evaluate("window.scrollY") < target_scroll_y:
            # Simulate variable scroll speed
            scroll_step = random.uniform(20, 80)
            await page.evaluate(f"window.scrollBy(0, {scroll_step})")
            await asyncio.sleep(random.uniform(0.05, 0.15)) # Small pause between scrolls
            
            # Occasionally simulate a brief stop or slight reverse scroll
            if random.random() < 0.1: # 10% chance
                await asyncio.sleep(random.uniform(0.2, 0.5))
                if random.random() < 0.5: # 50% chance to scroll back slightly
                    await page.evaluate(f"window.scrollBy(0, {-random.uniform(10, 30)})")
                    await asyncio.sleep(random.uniform(0.05, 0.1))
        
        # Ensure it reaches the target scroll amount if not already there
        await page.evaluate(f"window.scrollTo(0, {target_scroll_y})")
        print(f"Scrolled human-like by {scroll_amount} pixels.")

# --- Core Web Scraper Class ---
class WebScraper:
    def __init__(self, headless: bool = True, proxy_url: str = None):
        self.headless = headless
        self.proxy_url = proxy_url
        self.playwright: Playwright = None
        self.browser = None
        self.context: BrowserContext = None
        self.page: Page = None

    async def launch_browser(self) -> Page:
        """Launches a Playwright browser instance with optional proxy and stealth args."""
        self.playwright = await async_playwright().start()
        proxy_config = None

        if self.proxy_url:
            try:
                # Standard proxy format: http://username:password@host:port
                parsed_url = urlparse(self.proxy_url)
                if parsed_url.scheme and parsed_url.hostname and parsed_url.port:
                    proxy_config = {
                        "server": f"{parsed_url.scheme}://{parsed_url.hostname}:{parsed_url.port}",
                        "username": parsed_url.username,
                        "password": parsed_url.password,
                    }
                    print("Proxy configured successfully.")
                else:
                    print(f"Warning: Could not parse PROXY_URL: {self.proxy_url}. Proceeding without proxy.")
            except Exception as e:
                print(f"Warning: Error parsing PROXY_URL. Proceeding without proxy. Error: {e}")
        else:
            print("No PROXY_URL provided. Proceeding without proxy.")
          
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            proxy=proxy_config,
            args=["--disable-blink-features=AutomationControlled"] # Basic stealth
        )
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        return self.page

    async def navigate(self, url: str, wait_until: str = "domcontentloaded", timeout: int = DEFAULT_TIMEOUT):
        """Navigates to a given URL with retry logic."""
        for attempt in range(DEFAULT_RETRY_ATTEMPTS):
            try:
                await self.page.goto(url, wait_until=wait_until, timeout=timeout)
                print(f"Navigated to {url}")
                return
            except Exception as e:
                print(f"Navigation to {url} failed (attempt {attempt + 1}/{DEFAULT_RETRY_ATTEMPTS}): {e}")
                if attempt < DEFAULT_RETRY_ATTEMPTS - 1:
                    await asyncio.sleep(DEFAULT_RETRY_DELAY_MS * (2 ** attempt) / 1000) # Exponential backoff
                else:
                    raise

    async def scroll_to_bottom(self, scroll_pause_time: float = 2.0):
        """Scrolls to the bottom of the page to load dynamic content."""
        last_height = await self.page.evaluate("document.body.scrollHeight")
        while True:
            await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(scroll_pause_time)
            new_height = await self.page.evaluate("document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        print("Scrolled to bottom of the page.")

    async def close_browser(self):
        """Closes the browser instance."""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        print("Browser closed.")

# Example Usage (for testing purposes, not part of the core module)
async def main():
    scraper = WebScraper(headless=False, proxy_url=os.environ.get("PROXY_URL"))
    try:
        page = await scraper.launch_browser()
        await scraper.navigate("https://www.google.com")
        await HumanEmulator.human_like_typing(page, 'textarea[name="q"]', "Playwright web scraping best practices")
        await HumanEmulator.move_and_click(page, 'input[name="btnK"]') # This might need adjustment based on Google's dynamic button names
        await page.wait_for_load_state("networkidle")
        print(f"Current URL: {page.url}")
        await asyncio.sleep(5) # Keep browser open for a few seconds to observe
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        await scraper.close_browser()

if __name__ == "__main__":
    # For local testing, ensure PROXY_URL is set in your environment or a .env file
    # from dotenv import load_dotenv
    # load_dotenv()
    asyncio.run(main())
