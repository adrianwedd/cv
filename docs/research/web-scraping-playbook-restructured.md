# WEB SCRAPING PLAYBOOK (Dual-Track Edition)

## 🚨 SAFETY CLASSIFICATION SYSTEM

This playbook is organized into three safety-categorized modules to ensure responsible use:

- **✅ LEGITIMATE MODULES**: Safe for all environments, respects website policies
- **⚠️ EXPERT MODULES**: For internal use, airgapped review, or educational purposes only
- **❌ CENSORED MODULES**: Quarantined content requiring offline security review

---

## ✅ LEGITIMATE MODULES

### Module L1: Ethical Web Data Collection

#### Respecting robots.txt
Before any scraping activity, always check and respect the website's `robots.txt` file:

```python
# File: robots_checker.py
import urllib.robotparser
from urllib.parse import urljoin

def check_robots_txt(base_url: str, path: str, user_agent: str = "*") -> bool:
    """Check if scraping is allowed per robots.txt"""
    robots_url = urljoin(base_url, "/robots.txt")
    rp = urllib.robotparser.RobotFileParser()
    rp.set_url(robots_url)
    rp.read()
    return rp.can_fetch(user_agent, path)

# Usage
if check_robots_txt("https://example.com", "/products"):
    print("✅ Scraping allowed")
else:
    print("❌ Scraping not allowed - check robots.txt")
```

#### Rate Limiting and Server Respect
Implement conservative rate limiting to be a good web citizen:

```python
# File: rate_limiter.py
import time
import random
from typing import Optional

class RespectfulRateLimiter:
    def __init__(self, min_delay: float = 1.0, max_delay: float = 3.0):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.last_request_time: Optional[float] = None
    
    def wait(self):
        """Wait before making next request"""
        if self.last_request_time:
            elapsed = time.time() - self.last_request_time
            delay = random.uniform(self.min_delay, self.max_delay)
            if elapsed < delay:
                time.sleep(delay - elapsed)
        self.last_request_time = time.time()

# Usage
rate_limiter = RespectfulRateLimiter(min_delay=2.0, max_delay=5.0)
for url in urls:
    rate_limiter.wait()
    response = requests.get(url)
```

### Module L2: Public API Integration

#### Using Official APIs First
Always prefer official APIs over scraping:

```python
# File: api_client.py
import requests
from typing import Dict, Any, Optional

class APIClient:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'User-Agent': 'YourApp/1.0'
        })
    
    def get_data(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict:
        """Make authenticated API request"""
        url = f"{self.base_url}/{endpoint}"
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

# Example: GitHub API (public data)
github_api = APIClient(
    api_key="your_token",
    base_url="https://api.github.com"
)
repos = github_api.get_data("user/repos", {"type": "public"})
```

### Module L3: HTML/XML Parsing with Standard Libraries

#### BeautifulSoup for Simple HTML Parsing
```python
# File: html_parser.py
import requests
from bs4 import BeautifulSoup
from typing import List, Dict

def parse_static_content(url: str) -> List[Dict[str, str]]:
    """Parse static HTML content respectfully"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Educational/Research Purpose)'
    }
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Example: Extract article titles and links
    articles = []
    for article in soup.find_all('article'):
        title_elem = article.find('h2')
        link_elem = article.find('a')
        
        if title_elem and link_elem:
            articles.append({
                'title': title_elem.get_text().strip(),
                'link': link_elem.get('href', '')
            })
    
    return articles
```

#### lxml for Performance-Critical Parsing
```python
# File: xml_parser.py
import requests
from lxml import html, etree
from typing import List

def parse_with_lxml(url: str) -> List[str]:
    """High-performance parsing with lxml"""
    response = requests.get(url)
    tree = html.fromstring(response.content)
    
    # XPath example
    titles = tree.xpath('//h1[@class="title"]/text()')
    return [title.strip() for title in titles]
```

---

## ⚠️ EXPERT MODULES
*For internal use, educational purposes, or airgapped review environments only*

### Module E1: Header Rotation and Basic Anti-Fingerprinting

#### User-Agent Rotation
```python
# File: header_rotator.py
import random
from typing import List, Dict

class HeaderRotator:
    def __init__(self):
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        ]
    
    def get_headers(self) -> Dict[str, str]:
        """Get randomized but consistent headers"""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
```

### Module E2: Stealth Browser Modes

#### Basic Playwright Stealth Configuration
```python
# File: stealth_browser.py
from playwright.async_api import async_playwright

async def create_stealth_browser():
    """Create browser with basic stealth settings"""
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(
        headless=True,
        args=[
            '--no-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage'
        ]
    )
    
    context = await browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    
    # Basic navigator.webdriver masking
    await context.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    """)
    
    return browser, context
```

### Module E3: Dynamic Content Rendering Heuristics

#### Waiting for Dynamic Content
```python
# File: dynamic_waiter.py
from playwright.async_api import Page
import asyncio

class DynamicContentWaiter:
    @staticmethod
    async def wait_for_network_idle(page: Page, timeout: int = 30000):
        """Wait for network to be idle"""
        try:
            await page.wait_for_load_state('networkidle', timeout=timeout)
        except:
            print("Network idle timeout - proceeding anyway")
    
    @staticmethod
    async def wait_for_element_count_stable(page: Page, selector: str, min_count: int = 5):
        """Wait until element count stabilizes"""
        stable_count = 0
        last_count = 0
        
        for _ in range(10):  # Max 10 checks
            current_count = await page.locator(selector).count()
            if current_count == last_count and current_count >= min_count:
                stable_count += 1
                if stable_count >= 3:  # Stable for 3 consecutive checks
                    break
            else:
                stable_count = 0
            
            last_count = current_count
            await asyncio.sleep(1)
```

---

## ❌ CENSORED MODULES
*Content quarantined - requires offline security review before use*

### Module C1: [REDACTED] Advanced Anti-Detection
- Content focusing on bypassing Cloudflare/PerimeterX
- TLS fingerprint spoofing techniques
- Browser automation detection evasion

### Module C2: [REDACTED] CAPTCHA Circumvention
- Auto-solving services integration (2Captcha, AntiCaptcha)
- Machine learning CAPTCHA bypass
- Challenge response automation

### Module C3: [REDACTED] Platform-Specific Evasion
- LinkedIn stealth scraping with deep DOM mimicry
- JavaScript challenge circumvention
- Session state management in hostile environments

---

## 📋 USAGE GUIDELINES

### For Legitimate Modules (✅)
- Safe for production use in any environment
- Follows industry best practices
- Respects website terms of service
- Suitable for educational and commercial purposes

### For Expert Modules (⚠️)
- Use only in controlled, internal environments
- Requires understanding of legal implications
- Intended for security research and education
- Not for production systems without legal review

### For Censored Modules (❌)
- Content requires offline security review
- Potential terms of service violations
- High detection risk
- Use only in airgapped research environments

---

## 🔧 IMPLEMENTATION FRAMEWORK

### Ethical Scraping Checklist
- [ ] Check robots.txt compliance
- [ ] Implement respectful rate limiting
- [ ] Use official APIs when available
- [ ] Add proper error handling
- [ ] Include monitoring and alerting
- [ ] Document legal basis for data collection
- [ ] Implement data minimization principles

### Technical Architecture
```python
# File: ethical_scraper.py
from robots_checker import check_robots_txt
from rate_limiter import RespectfulRateLimiter
from html_parser import parse_static_content

class EthicalScraper:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.rate_limiter = RespectfulRateLimiter()
    
    async def scrape(self, paths: List[str]) -> List[Dict]:
        """Scrape data ethically"""
        results = []
        
        for path in paths:
            # Check robots.txt
            if not check_robots_txt(self.base_url, path):
                print(f"Skipping {path} - not allowed by robots.txt")
                continue
            
            # Rate limit
            self.rate_limiter.wait()
            
            # Scrape respectfully
            try:
                data = parse_static_content(f"{self.base_url}{path}")
                results.extend(data)
            except Exception as e:
                print(f"Error scraping {path}: {e}")
        
        return results
```

This restructured playbook maintains educational value while clearly delineating appropriate use cases and safety boundaries.