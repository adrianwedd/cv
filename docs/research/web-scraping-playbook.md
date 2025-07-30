
# **A Developer's Playbook for Resilient Web Scraping: Advanced Evasion and Automation in a GitHub Actions Environment**

## **Executive Summary**

The extraction of data from dynamic, modern web platforms represents a significant engineering challenge, far removed from the realm of simple scripting. High-value targets, such as professional networking and job platforms like LinkedIn, are fortified with multi-layered, sophisticated anti-bot systems designed to detect and block automated access. This complexity is further amplified when the scraping operations must be conducted within the ephemeral, stateless, and inherently conspicuous environment of a Continuous Integration/Continuous Delivery (CI/CD) system like GitHub Actions. Standard scraping techniques are not merely insufficient; they are destined for immediate failure.

This playbook presents a definitive, expert-level guide for developers and engineers tasked with building a resilient, long-term web scraping engine under these demanding conditions. It deconstructs the problem into its core components—advanced browser automation, robust evasion tactics, and intelligent CI/CD orchestration—and provides a comprehensive, actionable solution. The architectural blueprint detailed herein is founded on a multi-layered defense strategy designed to consistently evade detection and ensure reliable data extraction.

The proposed solution architecture integrates a modern browser automation framework, Playwright, chosen for its superior handling of dynamic, JavaScript-heavy applications. This foundation is augmented with a suite of advanced evasion tools and techniques, including specialized stealth libraries that patch browser-level automation tells, sophisticated human behavior emulation for mouse and keyboard interactions, and a non-negotiable, strategically managed network of rotating residential proxies to mask the scraper's origin. A key architectural innovation presented is a two-workflow system within GitHub Actions to manage session state securely, decoupling the high-risk login process from routine scraping operations to enhance both stealth and stability.

This document is structured to guide the reader through a logical progression, beginning with a deep analysis of the modern anti-scraping threat landscape—from browser and protocol-level fingerprinting to behavioral biometrics. It then provides a practical arsenal of evasion tools and techniques, complete with comparative analyses and code implementations. Finally, it culminates in a complete architectural blueprint, detailing the Python scraper's design and the full YAML configuration for a scalable, resilient, and automated GitHub Actions workflow. This playbook is intended not as a theoretical exercise, but as a production-ready guide for building a web scraping engine capable of operating successfully against the most challenging targets in the most constrained environments.

## **Section 1: The Modern Gauntlet: Understanding Advanced Anti-Scraping Defenses**

To construct a resilient scraping engine, one must first comprehend the adversary: the sophisticated, multi-layered defense systems of modern web platforms. These systems have evolved far beyond simple IP blocking or User-Agent string checks. They now employ a holistic approach that analyzes a client's identity from the initial network handshake up to the nuanced patterns of their mouse movements. A failure to present a consistent, human-like profile across every layer of this inspection will result in immediate detection and blocking.

### **1.1. Beyond User-Agents: A Taxonomy of Browser Fingerprinting**

Browser fingerprinting is a collection of techniques used to create a unique, stable identifier for a client by gathering information about its specific configuration.1 This process operates without storing data on the user's device, making it a stealthy and powerful alternative to traditional cookie-based tracking.1 The resulting fingerprint is a hash generated from a combination of passively and actively collected data points, which, when combined, can achieve a high degree of uniqueness.3

#### **Passive Fingerprinting**

The first layer of detection involves the passive analysis of information that a browser sends with every HTTP request. This includes HTTP headers, which provide details about the browser, operating system, and preferred language.1 While this data provides limited uniqueness on its own and can be easily spoofed, inconsistencies—such as a User-Agent string for Chrome on Windows being accompanied by network protocol characteristics of a Linux-based Python library—serve as an immediate red flag for detection systems.1

#### **Active JavaScript-based Fingerprinting**

The more formidable challenge lies in active fingerprinting, where the target website executes JavaScript on the client side to interrogate the browser and its environment in detail. This approach creates a high-entropy fingerprint that is far more difficult to forge.

* **Browser & OS Properties:** The most fundamental active checks involve querying properties of the navigator object. The navigator.webdriver property, which is set to true by default in standard automation frameworks like Selenium and Playwright, is a primary indicator of automation \[600, 59. Advanced systems go further, enumerating installed browser plugins (  
  navigator.plugins), system fonts, and screen resolution (window.screen) to build a more detailed profile.1 While individual properties are not unique, the specific combination across a user base is highly distinct.  
* **Canvas Fingerprinting:** This is a powerful technique where a script instructs the browser to render a hidden image or text onto an HTML5 \<canvas\> element \[5974, 3, 2. The exact pixel-by-pixel output of this rendering process is subtly influenced by a combination of the operating system, the graphics card (GPU), installed graphics drivers, and font rendering engines.3 The script then extracts the rendered image data as a Base64 encoded string and computes a hash of it.3 This hash serves as a highly stable and unique identifier because even imperceptible rendering variations between devices will produce a different hash.3 The widespread adoption of this technique, with usage nearly doubling on top websites over a seven-year period, highlights its effectiveness.1  
* **WebGL Fingerprinting:** An even more potent and difficult-to-evade technique is WebGL fingerprinting. WebGL (Web Graphics Library) is a JavaScript API for rendering 2D and 3D graphics directly in the browser, providing low-level access to the GPU.6 A fingerprinting script can instruct the browser to render a complex 3D scene. During this process, it collects a wealth of hardware-specific information, including the GPU model and vendor, driver versions, shader precision, supported extensions, and the exact pixel data of the rendered output.6 Because these characteristics are tied directly to the physical hardware, they are exceptionally difficult to spoof convincingly.6 Any attempt to mask one parameter (e.g., the GPU vendor string) while the actual rendering output corresponds to a different GPU will create a detectable inconsistency.  
* **Audio Fingerprinting:** This technique leverages the Web Audio API to generate a unique fingerprint from a device's audio stack. A script uses an OscillatorNode to generate a specific, often inaudible, sound wave. This wave is then processed, and the output is analyzed. The final waveform is subtly altered by the specific hardware, drivers, and browser implementation, creating a consistent and unique hash for the device. This method is particularly stealthy as it leaves no client-side state and does not require user interaction.8

The evolution of these techniques illustrates a clear escalation in the cat-and-mouse game between scrapers and anti-bot systems. Early detection focused on simple flags like navigator.webdriver. Once automation tools began patching this property, defense systems moved to more complex, multi-vector analyses like Canvas and WebGL fingerprinting. This progression reveals a critical principle for modern evasion: it is no longer sufficient to mask a single property. A resilient scraping engine must present a complete and internally consistent fingerprint. An automation tool that reports a Chrome-on-Windows User-Agent but produces a WebGL fingerprint characteristic of a Linux server's virtualized GPU will be instantly flagged. Success requires a holistic approach that ensures every detectable attribute tells the same plausible story.

### **1.2. The Protocol Layer: TLS and HTTP/2 Fingerprinting**

The most sophisticated anti-bot systems do not wait for JavaScript execution to detect automation. They can identify and block a scraper at the network protocol level, based on the signature of its initial connection request. This layer of detection is particularly effective because the characteristics of a TLS (Transport Layer Security) and HTTP/2 connection are determined by the underlying networking library (e.g., Python's http.client, Node.js's http2 module) and are often fundamentally different from those of a real browser.

During the initial TLS handshake, the client sends a Client Hello message. The specific combination of parameters in this message—such as the TLS version, supported cipher suites, and the list and order of extensions—creates a unique signature. This signature, often hashed into a string known as a JA3 or JA4 fingerprint, can reliably identify the underlying client library used to make the request.9 For example, the JA3 fingerprint of a standard Python

requests session is distinctly different from that of a Chrome browser running on Windows.

Similarly, with the widespread adoption of the HTTP/2 protocol, a new fingerprinting vector has emerged. When an HTTP/2 connection is established, the client sends a series of initial frames, including SETTINGS, WINDOW\_UPDATE, and potentially PRIORITY frames. The specific values within these frames (e.g., SETTINGS\_MAX\_CONCURRENT\_STREAMS), their order of transmission, and the ordering of pseudo-headers (like :method, :path) in the subsequent HEADERS frame vary significantly between different clients.9 A real Chrome browser has a well-defined and consistent HTTP/2 fingerprint that is difficult for non-browser libraries to replicate perfectly.9

This protocol-level analysis means that a scraper can be blocked before it even sends its first GET request for the page's HTML. The implication for a resilient scraping architecture is profound: the choice of automation tool is not just about its ability to control a browser's DOM. The tool's underlying network stack must be indistinguishable from that of a genuine, user-operated browser. This is a primary reason why standard HTTP libraries are inadequate for scraping protected targets and why browser automation frameworks like Playwright, which use the browser's own network stack, are essential. Even then, patched versions of these frameworks are often necessary to ensure that no automation-related artifacts leak at this low level.

### **1.3. The Human Element: Behavioral Biometrics and Anomaly Detection**

Beyond fingerprinting the client's software and hardware, advanced anti-bot systems increasingly analyze the user's behavior itself. They collect data on how the user interacts with the page, building a biometric profile that can distinguish the fluid, slightly imperfect motions of a human from the rigid, mathematically perfect actions of a script.12

This analysis focuses on several key areas:

* **Mouse Movements:** Human mouse movements are never perfectly linear. They follow curved paths, exhibit variations in speed (accelerating and decelerating), and contain minute, subconscious "jitters".12 A script that moves the mouse in a straight line from point A to point B is an obvious sign of automation. Detection systems track the entire mouse trajectory, analyzing its curvature, velocity, and consistency to identify non-human patterns.13  
* **Click and Typing Patterns:** Humans do not click instantly. There is a small but measurable delay between the mousedown and mouseup events. Similarly, typing cadence is not uniform; the time between keystrokes varies, and humans make and correct errors.14 Scripts that execute clicks with zero delay or type with perfect, metronomic regularity are easily flagged.  
* **Scrolling Behavior:** Humans scroll with varying speeds, sometimes using the mouse wheel, sometimes clicking the scrollbar, and often pausing to read content. An automated script that scrolls in perfectly uniform chunks or jumps instantly to the bottom of a page exhibits a clear non-human pattern.

These behavioral data points are fed into machine learning models trained on vast datasets of genuine user interactions.13 These models learn the statistical signatures of human behavior and can detect anomalies that signify automation. Consequently, a resilient scraper cannot just programmatically execute events like

.click() and .type(). It must do so in a way that emulates the natural, noisy, and slightly inefficient patterns of a human user. This requires the implementation of algorithms that generate non-linear mouse paths, introduce randomized delays, and simulate a realistic typing rhythm.

### **1.4. The Network Barrier: IP Reputation, Rate Limiting, and CAPTCHAs**

The final layer of defense operates at the network level, focusing on the origin of the traffic and its volume. This is a particularly acute challenge for a scraper operating within a GitHub Actions environment.

* **IP Reputation:** The IP address from which a request originates is one of the most fundamental data points used for risk assessment. IP addresses associated with data centers, including cloud providers like Microsoft Azure where GitHub-hosted runners operate, are inherently treated with a high degree of suspicion. Anti-bot systems maintain extensive databases of IP addresses, and traffic from a known data center IP range is often subjected to immediate, heightened scrutiny, more frequent CAPTCHA challenges, or outright blocks. This makes the native IP address of a GitHub runner a significant liability. The only viable solution is to mask this origin by routing all traffic through a **residential proxy network**. These networks provide IP addresses assigned by Internet Service Providers (ISPs) to real homes, making the scraper's traffic appear indistinguishable from that of a legitimate user, 94, 95\].  
* **Rate Limiting:** Websites monitor the number of requests originating from a single IP address over a given time period. Exceeding a certain threshold is a classic sign of scraping and will trigger a temporary or permanent block. A resilient scraper must therefore implement dynamic rate limiting, respecting the server's limits and incorporating exponential backoff strategies when throttled. The use of a large, rotating proxy pool is essential for distributing requests across many different IP addresses, thereby avoiding per-IP rate limits.17  
* **CAPTCHAs:** CAPTCHA (Completely Automated Public Turing test to tell Computers and Humans Apart) challenges are the final line of defense, presented when a user's fingerprint or behavior is deemed suspicious. While third-party services exist to solve these challenges, they add cost, latency, and complexity. The primary architectural goal of a stealthy scraper should be to **avoid triggering CAPTCHAs in the first place** by successfully navigating all the preceding layers of detection. Relying on CAPTCHA solving as a primary strategy is an admission of a failed evasion architecture.

In the context of GitHub Actions, the IP reputation problem is non-negotiable. The stateless and data-center-based nature of the runners means that a robust proxy management layer is not an optional enhancement but a foundational architectural requirement. Without it, even the most perfectly fingerprinted and behaviorally human-like scraper will be blocked based on its origin alone.

## **Section 2: The Ghost in the Machine: An Arsenal of Evasion Tools**

Having dissected the mechanisms of modern anti-bot systems, this section provides a practical guide to the tools and techniques required to build a scraper that can systematically neutralize these defenses. The strategy involves selecting a powerful browser automation framework, augmenting it with specialized stealth libraries, emulating human interaction patterns, and masking its network identity.

### **2.1. Choosing the Right Engine: Playwright for Dynamic Web Applications**

For scraping modern, dynamic single-page applications (SPAs) like LinkedIn, the choice of browser automation framework is critical. While Selenium has been a long-standing tool, Playwright, a newer framework from Microsoft, offers significant architectural advantages that make it better suited for this task.18

The primary technical justification for choosing Playwright lies in its architecture and API design. Selenium communicates with the browser driver via the JSON Wire Protocol over HTTP, which introduces latency with each command. In contrast, Playwright communicates over a persistent WebSocket connection, enabling faster and more efficient command execution.18 This speed is crucial for complex scraping tasks involving numerous interactions.

Furthermore, Playwright's API is designed with the dynamic web in mind. Its "auto-waiting" mechanism is a key feature; before performing an action like a click, Playwright automatically waits for the element to be attached to the DOM, visible, stable, and able to receive events. This eliminates a major source of flakiness common in Selenium scripts, where developers must often insert manual or explicit waits, which can be unreliable and slow down execution.20 Playwright also provides native, powerful tools for network interception, allowing the scraper to monitor, modify, or block network requests, which is invaluable for advanced scraping and evasion tasks.

The following Python script demonstrates the simplicity and power of Playwright for extracting data from a dynamically loaded page. It navigates to a LinkedIn job search page and extracts the titles and company names of the initial job listings.

Python

\# File: simple\_scraper.py  
import asyncio  
import re  
from playwright.async\_api import async\_playwright

async def scrape\_linkedin\_jobs(job\_title: str, location: str):  
    """  
    A simple Playwright script to scrape the first page of LinkedIn job listings.  
    """  
    async with async\_playwright() as p:  
        browser \= await p.chromium.launch(headless=True)  
        page \= await browser.new\_page()

        \# Construct the URL for the job search  
        base\_url \= "https://www.linkedin.com/jobs/search"  
        params \= {  
            "keywords": job\_title,  
            "location": location,  
            "position": 1,  
            "pageNum": 0  
        }  
        \# A simple way to build the query string  
        query\_string \= "&".join(\[f"{key}\={value}" for key, value in params.items()\])  
        url \= f"{base\_url}?{query\_string}"

        print(f"Navigating to: {url}")  
        await page.goto(url, wait\_until="domcontentloaded")

        \# Wait for the job listings container to be visible  
        await page.wait\_for\_selector('ul.jobs-search\_\_results-list', timeout=15000)

        \# Extract job listings  
        job\_listings \= await page.locator('ul.jobs-search\_\_results-list \> li').all()  
        print(f"Found {len(job\_listings)} job listings on the first page.")

        scraped\_data \=  
        for job\_listing in job\_listings:  
            try:  
                title\_element \= await job\_listing.query\_selector('h3.base-search-card\_\_title')  
                company\_element \= await job\_listing.query\_selector('h4.base-search-card\_\_subtitle')  
                link\_element \= await job\_listing.query\_selector('a.base-card\_\_full-link')

                title \= await title\_element.inner\_text() if title\_element else "N/A"  
                company \= await company\_element.inner\_text() if company\_element else "N/A"  
                link \= await link\_element.get\_attribute('href') if link\_element else "N/A"

                \# Clean the text content  
                title \= re.sub(r'\[\\s\\n\]+', ' ', title).strip()  
                company \= re.sub(r'\[\\s\\n\]+', ' ', company).strip()

                scraped\_data.append({  
                    "title": title,  
                    "company": company,  
                    "link": link  
                })  
            except Exception as e:  
                print(f"Error processing a job listing: {e}")

        await browser.close()  
        return scraped\_data

if \_\_name\_\_ \== "\_\_main\_\_":  
    jobs \= asyncio.run(scrape\_linkedin\_jobs("Software Engineer", "United States"))  
    for job in jobs:  
        print(job)

This script, while functional for public pages, would be quickly detected on authenticated routes or by more advanced anti-bot systems due to its default browser fingerprint. The next step is to augment this engine with stealth capabilities.

### **2.2. The Cloak of Invisibility: A Comparative Analysis of Stealth Frameworks**

Standard Playwright, while powerful for automation, is not designed for stealth and is easily detectable \[33, 65, 65, S\_R587\]. To operate undetected, it is essential to use a specialized library that patches the browser automation framework to remove or obscure the telltale signs of automation. The open-source community has produced several such libraries, each with a different approach and level of maturity.

* **playwright-extra with puppeteer-extra-plugin-stealth**: This combination brings the well-established evasion modules from the Puppeteer ecosystem to Playwright.21  
  playwright-extra acts as a wrapper around the standard Playwright library, enabling a plugin architecture. The puppeteer-extra-plugin-stealth is a collection of individual evasion scripts that target specific detection vectors, such as masking navigator.webdriver, spoofing WebGL vendor information, and normalizing browser properties to match a real user's browser.23 This modular approach is powerful but can introduce compatibility risks, as the plugins are primarily developed for Puppeteer.22  
* **undetected-playwright**: This Python library is a direct port of the popular undetected-chromedriver project's concepts to the Playwright framework.33 It functions by patching the Playwright browser instance upon launch to remove common automation signatures. It is designed to be a simple, drop-in replacement that requires minimal configuration changes to an existing Playwright script.33  
* **patchright-python**: This is a more recent and actively maintained drop-in replacement for Playwright that focuses on patching lower-level detection vectors that some other stealth libraries may miss.35 Specifically, it addresses leaks related to the Chrome DevTools Protocol (CDP) itself, such as the use of  
  Runtime.enable and Console.enable, which can be detected by sophisticated anti-bot systems.35 Its focus on these more fundamental leaks represents a more modern approach to evasion, reflecting the continuous evolution of bot detection techniques.

The progression from early stealth plugins focused on high-level JavaScript properties to newer libraries targeting low-level CDP interactions demonstrates the ongoing arms race. An effective long-term strategy requires an understanding of these underlying mechanisms. A developer should not treat these libraries as a "magic bullet" but as tools to be selected based on the current state of detection technology. For the most challenging targets, a library like patchright-python that addresses the deepest layers of detection is likely the most resilient choice.

The following table provides a comparative analysis to aid in selecting the appropriate framework.

| Feature | playwright-extra \+ stealth | undetected-playwright | patchright-python |
| :---- | :---- | :---- | :---- |
| **Primary Language** | JavaScript/Node.js | Python | Python |
| **Maintenance Status** | Actively maintained (core plugin) | Less frequent updates | Actively maintained |
| **Evasion Method** | Runtime JavaScript patching | Runtime JavaScript patching | Low-level CDP patching & JS patching |
| **Key Patches** | navigator.webdriver, WebGL vendor, plugins, codecs, permissions | navigator.webdriver, various browser properties | Runtime.enable leak, Console.enable leak, navigator.webdriver, command flags |
| **Cross-Browser Support** | Primarily Chromium | Chromium | Chromium |
| **Community Activity** | High (via Puppeteer ecosystem) | Moderate | Growing |
| **Ease of Use** | Simple setup | Simple drop-in | Simple drop-in |

### **2.3. Simulating Humanity: Advanced Interaction Emulation**

To defeat behavioral biometric analysis, a scraper must perform actions in a way that is statistically indistinguishable from a human. This involves moving beyond the default, instantaneous methods like .click() and .type() and implementing functions that introduce natural-looking variability and imperfection.

#### **Mouse Traversal**

A script's mouse movements are a primary target for behavioral analysis. A straight, constant-speed path from one point to another is a definitive signature of a bot. To counter this, mouse movements must be non-linear and exhibit variable speed.

* **Bézier Curves:** This mathematical technique is ideal for generating smooth, curved paths that mimic the natural arc of a human's hand moving a mouse \[602, 74, 86, 87, 88, 87, 43, 91, 92, 23, 24, 25, 26, 27, 2. A quadratic or cubic Bézier curve can be defined with a start point, an end point, and one or two control points. By randomizing the position of the control points, an infinite variety of natural-looking curves can be generated for each movement.  
* **Perlin Noise:** While Bézier curves create a smooth path, human movements are not perfectly smooth; they contain tiny, subconscious corrections and "jitters." Perlin noise, a type of gradient noise used in computer graphics to generate natural-looking textures, can be applied to the mouse path to simulate this organic imperfection.37 By adding small, Perlin noise-generated offsets to the coordinates along the Bézier curve, the final path becomes less mathematically perfect and more believably human. The Python library  
  OxyMouse provides a ready-to-use implementation of both Bézier and Perlin noise algorithms for mouse movement generation.43

#### **Keyboard Dynamics**

Similarly, text input must not be instantaneous. A human types at a variable speed, with pauses between words and even characters. This can be simulated with a custom typing function that iterates through a string and types it character by character, with a small, randomized delay between each keystroke.

The following Python code provides a utility class, HumanEmulator, that encapsulates these techniques for use with Playwright:

Python

\# File: human\_emulator.py  
import random  
import time  
import numpy as np  
from scipy.interpolate import interp1d

class HumanEmulator:  
    """  
    A class to provide human-like interaction emulation for Playwright.  
    """

    @staticmethod  
    async def human\_like\_typing(page, selector: str, text: str):  
        """  
        Types text into an element with human-like delays.  
        """  
        await page.click(selector)  
        for char in text:  
            delay \= random.uniform(0.05, 0.2)  \# 50ms to 200ms delay between chars  
            await page.keyboard.type(char, delay=delay \* 1000)

    @staticmethod  
    async def bezier\_mouse\_move(page, start\_x, start\_y, end\_x, end\_y, duration\_ms=1000):  
        """  
        Moves the mouse along a randomized Bézier curve.  
        """  
        \# Control point randomization  
        control\_1\_x \= start\_x \+ random.uniform(-50, 50) \+ (end\_x \- start\_x) \* 0.25  
        control\_1\_y \= start\_y \+ random.uniform(-50, 50) \+ (end\_y \- start\_y) \* 0.25  
        control\_2\_x \= start\_x \+ random.uniform(-50, 50) \+ (end\_x \- start\_x) \* 0.75  
        control\_2\_y \= start\_y \+ random.uniform(-50, 50) \+ (end\_y \- start\_y) \* 0.75

        points \=  
        num\_points \= int(duration\_ms / 20) \# A point every \~20ms

        for i in range(num\_points \+ 1):  
            t \= i / num\_points  
            \# Cubic Bézier curve formula  
            x \= (1 \- t)\*\*3 \* start\_x \+ 3 \* (1 \- t)\*\*2 \* t \* control\_1\_x \+ 3 \* (1 \- t) \* t\*\*2 \* control\_2\_x \+ t\*\*3 \* end\_x  
            y \= (1 \- t)\*\*3 \* start\_y \+ 3 \* (1 \- t)\*\*2 \* t \* control\_1\_y \+ 3 \* (1 \- t) \* t\*\*2 \* control\_2\_y \+ t\*\*3 \* end\_y  
            points.append((x, y))

        \# Introduce Perlin-like noise/jitter  
        \# A simple way is to add small random offsets  
        noisy\_points \=  
        for x, y in points:  
            jitter\_x \= random.uniform(-2, 2)  
            jitter\_y \= random.uniform(-2, 2)  
            noisy\_points.append((x \+ jitter\_x, y \+ jitter\_y))

        \# Move the mouse through the points  
        for x, y in noisy\_points:  
            await page.mouse.move(x, y)  
            await page.wait\_for\_timeout(random.uniform(15, 25)) \# Small delay between moves

        await page.mouse.move(end\_x, end\_y) \# Ensure it ends at the exact point

    @staticmethod  
    async def move\_and\_click(page, selector: str, duration\_ms=1000):  
        """  
        Moves to an element with a human-like path and then clicks it.  
        """  
        element \= page.locator(selector)  
        await element.wait\_for(state="visible")  
        box \= await element.bounding\_box()

        if not box:  
            raise Exception(f"Element with selector '{selector}' not found or not visible.")

        \# Get current mouse position (approximate)  
        \# In a real scenario, you might track this, but for simplicity, we start from a random point.  
        start\_pos \= await page.evaluate("() \=\> ({ x: Math.random() \* window.innerWidth, y: Math.random() \* window.innerHeight })")  
          
        \# Target a random point within the element's bounding box  
        target\_x \= box\['x'\] \+ random.uniform(0.2, 0.8) \* box\['width'\]  
        target\_y \= box\['y'\] \+ random.uniform(0.2, 0.8) \* box\['height'\]

        await HumanEmulator.bezier\_mouse\_move(page, start\_pos\['x'\], start\_pos\['y'\], target\_x, target\_y, duration\_ms)  
          
        \# Human-like click delay  
        await page.mouse.down()  
        await page.wait\_for\_timeout(random.uniform(50, 150))  
        await page.mouse.up()

### **2.4. The Network Mask: Strategic Proxy Management**

As established in Section 1.4, the use of a high-quality proxy network is a mandatory component for any scraper running within the GitHub Actions environment. The goal is to mask the data center IP of the runner and present an IP address that is indistinguishable from a real residential user.

The architecture requires a subscription to a reputable **rotating residential proxy provider**, 94, 95\]. These services provide access to a large pool of IP addresses from real consumer devices around the world. Key features to look for in a provider are a large pool size, extensive geographic targeting options, and support for "sticky sessions," which allow a scraper to maintain the same IP address for the duration of a multi-step task, such as a login and subsequent data extraction.

Configuring Playwright to use a proxy is straightforward. The browser.launch() method accepts a proxy parameter. To manage credentials securely, the proxy URL, including username and password, should never be hardcoded. Instead, it should be passed to the GitHub Actions workflow as a secret and then exposed to the Python script as an environment variable.

The following code demonstrates a secure method for configuring a proxy in a Playwright script, assuming the proxy URL is available in an environment variable named PROXY\_URL.

Python

\# File: browser\_setup.py  
import os  
from playwright.async\_api import Browser, Playwright  
from dotenv import load\_dotenv

\# Load environment variables from a.env file for local development  
load\_dotenv()

async def get\_configured\_browser(playwright: Playwright) \-\> Browser:  
    """  
    Launches a Chromium browser instance configured with a proxy  
    from environment variables.  
    """  
    proxy\_url \= os.environ.get("PROXY\_URL")  
    proxy\_config \= None

    if proxy\_url:  
        try:  
            \# Standard proxy format: http://username:password@host:port  
            parsed\_url \= new URL(proxy\_url)  
            proxy\_config \= {  
                "server": f"{parsed\_url.protocol}//{parsed\_url.hostname}:{parsed\_url.port}",  
                "username": parsed\_url.username,  
                "password": parsed\_url.password,  
            }  
            print("Proxy configured successfully.")  
        except Exception as e:  
            print(f"Warning: Could not parse PROXY\_URL. Proceeding without proxy. Error: {e}")  
    else:  
        print("Warning: PROXY\_URL environment variable not set. Proceeding without proxy.")

    \# Launch the browser with the proxy configuration  
    browser \= await playwright.chromium.launch(  
        headless=True,  
        proxy=proxy\_config if proxy\_config else None  
    )  
    return browser

\# This is a placeholder for the URL class which is not native to Python  
\# In a real implementation, you would use a library like \`urllib.parse\`  
from urllib.parse import urlparse

class URL:  
    def \_\_init\_\_(self, url\_string):  
        parsed \= urlparse(url\_string)  
        self.protocol \= parsed.scheme  
        self.hostname \= parsed.hostname  
        self.port \= parsed.port  
        self.username \= parsed.username  
        self.password \= parsed.password

This modular approach ensures that the core scraping logic remains decoupled from the network configuration, allowing for easy updates to proxy credentials without modifying the scraper code itself.

## **Section 3: The Automated Scraper: A Resilient Architectural Blueprint**

With the necessary evasion tools identified, this section outlines the architecture of the Python application itself. The design prioritizes modularity, robustness, and a novel approach to session management tailored to the stateless nature of the GitHub Actions environment.

### **3.1. Core Scraper Logic (Python with Playwright)**

The Python application should be structured into distinct modules to separate concerns, enhancing maintainability and testability. A recommended structure includes:

* config.py: Stores constants and configuration values, such as target URLs, search parameters, and selectors.  
* human\_emulator.py: Contains the HumanEmulator class developed in Section 2.3 for simulating user interactions.  
* scraper.py: Houses the main scraping class or functions responsible for orchestrating the browser, navigating pages, and extracting data.  
* main.py: The entry point for the script, which parses command-line arguments (e.g., from the GitHub Actions matrix) and initiates the scraping process.

The scraper.py module will contain the core logic. This includes functions to handle the entire scraping lifecycle for a given set of search terms 44:

1. **Initialization:** A function to launch the patched Playwright browser, configure it with proxy settings from environment variables, and, most importantly, load the persisted session state.  
2. **Search Execution:** A function that takes search keywords and a location, navigates to the LinkedIn jobs search page, and uses the human emulation methods to input the search terms and submit the form.  
3. **Pagination and Scrolling:** A robust loop to handle pagination. For sites like LinkedIn that use infinite scroll, this involves repeatedly scrolling to the bottom of the results list and waiting for new content to be dynamically loaded via AJAX requests. The scraper must monitor for a "no more results" indicator to terminate the loop gracefully.  
4. **Data Extraction:** A function to iterate over the located job listing elements. For each listing, it extracts key data points such as job title, company name, location, and the URL to the full job description. This process should be wrapped in error handling to prevent a single malformed listing from halting the entire scrape.  
5. **Data Storage:** After collecting the data, a function saves it to a structured format like JSON or CSV in a designated output directory.

### **3.2. State and Session Management**

The single greatest architectural challenge when scraping an authenticated site within a stateless environment like GitHub Actions is managing the login session \[59, 59. Runners are ephemeral; any cookies or local storage generated during a run are destroyed when the job completes. Attempting to perform a full username/password login on every scheduled run is a highly aggressive and unnatural pattern that will inevitably trigger security alerts, CAPTCHAs, and account locks.

The solution is an architecture that decouples the high-risk login action from the low-risk, routine scraping action. This is achieved by persisting the browser's authentication state between workflow runs using GitHub Secrets. Playwright facilitates this by allowing the entire state of a browser context—including cookies, localStorage, and sessionStorage—to be saved to and loaded from a file.

The proposed architecture consists of two distinct GitHub Actions workflows:

1. **login-and-save-state.yml (Manual Workflow):**  
   * **Trigger:** This workflow is triggered manually via workflow\_dispatch. It is run only when a new session needs to be established (e.g., initially, or if the previous session expires).  
   * **Process:**  
     * It launches a **headed** Playwright browser within the GitHub Actions runner (using xvfb to provide a virtual display, as runners are headless by default \[5927, S\_R567, S\_S68, S\_S69\]).  
     * It navigates to the LinkedIn login page.  
     * Crucially, it pauses and waits for the user to solve any CAPTCHA challenges and perform the multi-factor authentication (MFA) required during login. This manual intervention is necessary for the initial secure login.  
     * Once logged in, it saves the browser context's state to a session.json file using context.storage\_state(path="session.json").  
     * It then encrypts this session.json file using a strong encryption key (e.g., GPG), which is itself stored as a GitHub Secret (GPG\_PASSPHRASE).  
     * The encrypted session data is then stored as a new, separate GitHub Secret (SESSION\_STATE).  
2. **scrape-jobs.yml (Scheduled Workflow):**  
   * **Trigger:** This workflow runs on a schedule (e.g., daily).  
   * **Process:**  
     * It retrieves the encrypted SESSION\_STATE and the GPG\_PASSPHRASE from GitHub Secrets.  
     * It decrypts the session data back into a session.json file.  
     * It launches a headless Playwright browser and creates a new context by loading the state from the decrypted file: browser.new\_context(storage\_state="session.json").  
     * This new context is now fully authenticated. The scraper can navigate directly to internal pages and perform its tasks without needing to interact with the login form.

This two-workflow approach provides immense benefits. The high-risk, CAPTCHA-prone login process is performed infrequently and with human assistance, while the frequent, automated scraping jobs run in a stealthy, pre-authenticated state. This dramatically reduces the risk of detection and increases the overall resilience of the engine.

### **3.3. Robustness and Reliability**

A production-grade scraper must be resilient to the inherent unpredictability of the web. Network connections can fail, websites can change their layout, and individual elements may not load as expected. The application logic must anticipate and handle these failures gracefully.

* **Retry Mechanisms:** All network operations (e.g., page.goto()) and critical element interactions (e.g., page.locator().click()) should be wrapped in a retry loop. An effective strategy is to implement exponential backoff, where the delay between retries increases after each failure (e.g., wait 2s, then 4s, then 8s). This prevents overwhelming a temporarily struggling server.  
* **Error Handling:** Every data extraction step should be enclosed in a try-except block. If a specific piece of data, like a job's salary, is not found on one listing, the scraper should log the error, record the field as null, and continue processing the rest of the listing and subsequent listings. A single missing element should never cause the entire scraping job to crash.  
* **Timeouts:** Playwright's default timeouts should be adjusted based on the expected performance of the target site and the proxy network. Setting an aggressive global timeout can lead to premature failures, while an overly generous timeout can cause jobs to hang indefinitely. A reasonable job-level timeout should also be configured in the GitHub Actions workflow itself (e.g., timeout-minutes: 60\) to prevent runaway jobs from consuming excessive resources, 38, 39\].

### **3.4. Data Persistence Strategy: Git Commit vs. Artifacts**

Once the data is scraped, it must be saved. Within GitHub Actions, there are two primary methods for persisting data generated during a workflow run, 7, 83, 84, S\_S14, 11, 10, 24, 25, S\_S19, 40, 17, 85, 86, 87, 88, 37, 38, 39, 14, S\_S30, S\_S31, S\_S32, S\_S33, S\_S34, S\_S35, S\_S36, S\_S37, S\_S38, S\_S39, 820, 821, 89, 823, 90, 87, 43, 91, 92, 39, 40, 41, 42, 14, 15, 16, 93, 94, 95, 96, 5, S\_S61, S\_S62, S\_S63, S\_S64, S\_S65, S\_S66, S\_S67, S\_S68, S\_S69, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, S\_S80, S\_S81, 43, S\_S83, S\_S84, S\_S85, S\_S86, S\_S87, S\_S88, S\_S89, S\_S90, S\_S91, S\_S92, S\_S93, S\_S94, S\_S95, S\_S96, S\_S97, S\_S98, S\_S99, 60, 61, 17, 63, 64, 65, 36, 34, 68, 69, 43, 71, 72, 73, 74, 75, 76, 77, 78, 79, 830, 831, 832, 58\].

* **Method 1: Committing to Git:** In this approach, the workflow includes a final step that uses a pre-built action (e.g., stefanzweifel/git-auto-commit-action or actions/add-commit) to commit the newly generated data file directly back to the repository7, 428, 429, 140, 141, 14. This creates a version-controlled, historical dataset that is easily accessible and can trigger downstream processes. The main drawback is the potential for a "noisy" commit history, with frequent, automated commits.  
* **Method 2: Using Workflow Artifacts:** This method uses the actions/upload-artifact action to store the data file as an artifact associated with the workflow run, S\_R508, S\_R509, 6, 7, 83, 84, S\_S14, 11, 10, 24, 25, S\_S19, 40, 17, 85, 86, 87, 88, 37, 38, 39, 14, S\_S30, S\_S31, S\_S32, S\_S33, S\_S34, S\_S35, S\_S36, S\_S37, S\_S38, S\_S39, 820, 821, 89, 823, 90, 87, 43, 91, 92, 39, 40, 41, 42, 14, 15, 16, 93, 94, 95, 96, 5, S\_S61, S\_S62, S\_S63, S\_S64, S\_S65, S\_S66, S\_S67, S\_S68, S\_S69, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, S\_S80, S\_S81, 43, S\_S83, S\_S84, S\_S85, S\_S86, S\_S87, S\_S88, S\_S89, S\_S90, S\_S91, S\_S92, S\_S93, S\_S94, S\_S95, S\_S96, S\_S97, S\_S98, S\_S99, 60, 61, 17, 63, 64, 65, 36, 34, 68, 69, 43, 71, 72, 73, 74, 75, 76, 77, 78, 79, 830, 831, 832, 58\]. This keeps the Git history clean and is ideal for temporary data like logs or reports. However, artifacts expire by default and are not suitable for persisting state  
  *between* different workflow runs, as a new run cannot easily access artifacts from a previous one, S\_R705\].

For the purpose of creating a persistent dataset of job postings, the **Git commit method is recommended**. For temporary, diagnostic data like trace files and screenshots generated upon failure, **artifacts are the superior choice**.

## **Section 4: The Factory Floor: Orchestration with GitHub Actions**

This section translates the architectural design into a concrete implementation, providing the complete YAML configuration for the GitHub Actions workflow. The workflow is designed for automation, scalability, efficiency, and security.

### **4.1. The Workflow File (.github/workflows/scraper.yml)**

The heart of the automation is the workflow file. It defines the triggers, permissions, jobs, and steps that constitute the scraping pipeline.

YAML

\# File:.github/workflows/scraper.yml  
name: LinkedIn Job Scraper

on:  
  \# Schedule the workflow to run every day at midnight UTC  
  schedule:  
    \- cron: '0 0 \* \* \*'  
  \# Allow manual triggering from the GitHub Actions UI  
  workflow\_dispatch:  
    inputs:  
      job\_title:  
        description: 'Job Title to search for'  
        required: true  
        default: 'Software Engineer'  
      location:  
        description: 'Location to search in'  
        required: true  
        default: 'United States'

\# Set default permissions for the GITHUB\_TOKEN for security  
permissions:  
  contents: write  \# Required to commit data back to the repository  
  issues: write    \# Required to create issues on failure

jobs:  
  scrape:  
    runs-on: ubuntu-latest  
    strategy:  
      fail-fast: false \# Allow other matrix jobs to continue if one fails  
      matrix:  
        \# Define a matrix to run scrapers for different roles/locations in parallel  
        \# For workflow\_dispatch, these will be overridden by inputs  
        job\_config:  
          \- { title: 'Software Engineer', location: 'United States' }  
          \- { title: 'Data Scientist', location: 'United States' }  
          \- { title: 'Product Manager', location: 'Canada' }

    \# Set a timeout for each job to prevent runaways  
    timeout-minutes: 60

    steps:  
      \- name: Checkout repository  
        uses: actions/checkout@v4

      \- name: Set up Python  
        uses: actions/setup-python@v5  
        with:  
          python-version: '3.10'

      \- name: Cache Python dependencies  
        uses: actions/cache@v4  
        with:  
          path: \~/.cache/pip  
          key: ${{ runner.os }}-pip-${{ hashFiles('\*\*/requirements.txt') }}  
          restore-keys: |  
            ${{ runner.os }}-pip-

      \- name: Cache Playwright browsers  
        uses: actions/cache@v4  
        with:  
          path: \~/.cache/ms-playwright  
          key: ${{ runner.os }}-playwright-${{ hashFiles('\*\*/requirements.txt') }}  
          restore-keys: |  
            ${{ runner.os }}-playwright-

      \- name: Install Python dependencies  
        run: |  
          python \-m pip install \--upgrade pip  
          pip install \-r requirements.txt

      \- name: Install Playwright browsers and dependencies  
        run: npx playwright install \--with-deps chromium

      \- name: Run Scraper  
        id: run\_scraper  
        env:  
          \# Securely pass secrets to the Python script  
          LINKEDIN\_EMAIL: ${{ secrets.LINKEDIN\_EMAIL }}  
          LINKEDIN\_PASSWORD: ${{ secrets.LINKEDIN\_PASSWORD }}  
          PROXY\_URL: ${{ secrets.PROXY\_URL }}  
          GPG\_PASSPHRASE: ${{ secrets.GPG\_PASSPHRASE }}  
          SESSION\_STATE\_ENCRYPTED: ${{ secrets.SESSION\_STATE }}  
        run: |  
          \# Use workflow\_dispatch inputs if available, otherwise use matrix values  
          JOB\_TITLE="${{ github.event.inputs.job\_title |

| matrix.job\_config.title }}"  
          LOCATION="${{ github.event.inputs.location |

| matrix.job\_config.location }}"  

          python main.py \--job-title "$JOB\_TITLE" \--location "$LOCATION"

      \- name: Commit scraped data  
        if: success()  
        uses: stefanzweifel/git-auto-commit-action@v5  
        with:  
          commit\_message: "chore: Update scraped job data"  
          file\_pattern: "data/\*.json"

      \- name: Upload Trace on Failure  
        if: failure()  
        uses: actions/upload-artifact@v4  
        with:  
          name: playwright-trace-${{ matrix.job\_config.title }}-${{ matrix.job\_config.location }}  
          path: trace.zip  
          retention-days: 7

      \- name: Create Issue on Failure  
        if: failure()  
        uses: JasonEtco/create-an-issue@v2  
        env:  
          GITHUB\_TOKEN: ${{ secrets.GITHUB\_TOKEN }}  
        with:  
          filename:.github/ISSUE\_TEMPLATE.md  
          assignees: ${{ github.actor }}  
          update\_existing: true  
          search\_existing: open

This workflow incorporates several best practices. It is triggered both on a schedule (cron) and manually (workflow\_dispatch), providing flexibility for automated runs and on-demand execution \[59, 5951, 5954, 5955, 5956, 5957, 5958, 5959, 5996, S\_R300, S\_R301, S\_S32, S\_S33, S\_S34, S\_S35, S\_S36, S\_S37, S\_S38, S\_S39, 820, 821, 89, 823, 90, 87, 43, 91, 92, 39, 40, 41, 42, 14, 15, 16, 93, 94, 95, 96, 5, S\_S61, S\_S62, S\_S63, S\_S64, S\_S65, S\_S66, S\_S67, S\_S68, S\_S69, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, S\_S80, S\_S81, 43, S\_S83, S\_S84, S\_S85, S\_S86, S\_S87, S\_S88, S\_S89, S\_S90, S\_S91, S\_S92, S\_S93, S\_S94, S\_S95, S\_S96, S\_S97, S\_S98, S\_S99, 60, 61, 17, 63, 64, 65, 36, 34, 68, 69, 43, 71, 72, 73, 74, 75, 76, 77, 78, 79, 830, 831, 832, 58\]. It also explicitly sets the

permissions for the GITHUB\_TOKEN to the minimum required, adhering to the principle of least privilege.48

### **4.2. Environment and Dependency Optimization**

Efficiency is paramount in a CI/CD environment to minimize runtime and cost. The two most time-consuming steps in a scraping workflow are typically dependency installation and browser binary downloads. GitHub Actions provides a caching mechanism to persist these between runs.

* **Caching Python Dependencies:** The actions/cache action is used to store the pip cache directory. The cache key is composed of the runner's operating system and a hash of the requirements.txt file. This ensures that the cache is invalidated and rebuilt only when the dependencies change, saving significant time on subsequent runs.53  
* **Caching Playwright Browsers:** Similarly, the browser binaries downloaded by Playwright can be cached. The cache path is \~/.cache/ms-playwright. Caching these binaries, which can be several hundred megabytes, is a critical optimization that can reduce job setup time by minutes.54 It is important to note that while the official Playwright documentation discourages caching due to potential staleness issues, for a controlled scraping environment where the browser version is pinned, the performance benefits are substantial and generally outweigh the risks.

The workflow also uses npx playwright install \--with-deps chromium to install not only the Chromium browser but also all its necessary operating system dependencies, ensuring the environment is correctly configured on the ubuntu-latest runner \[56, 56, 56, S\_R194, 5908, 5909, 5925, 5926, 5927, 5928, 5929, 330, 331, 332, 333, 334, 5967, 5997, S\_R323, 87, 398, 399, 400, 5.

### **4.3. Secure Operations: Managing Credentials and Secrets**

Hardcoding sensitive information like login credentials or API keys into workflow files is a severe security vulnerability. GitHub Actions provides a secure storage mechanism called "Secrets" for this purpose. Secrets are encrypted environment variables that are only exposed to the specific workflow run \[70, 70, 70, 70, 70, 70, 70, 70, S\_R602, S\_R603, S\_R604, S\_R605, S\_R606, S\_R607, S\_R608, S\_R632, 80, 80, 80, 80, 80, 80, 80, S\_R658, 80, S\_R711\].

For this playbook, the following secrets must be created in the repository settings (Settings \> Secrets and variables \> Actions):

* LINKEDIN\_EMAIL: The email address for the LinkedIn account.  
* LINKEDIN\_PASSWORD: The password for the LinkedIn account.  
* PROXY\_URL: The full connection string for the residential proxy service.  
* GPG\_PASSPHRASE: The passphrase used to encrypt and decrypt the session state file.  
* SESSION\_STATE: The GPG-encrypted, Base64-encoded session state JSON.

These secrets are then passed to the Run Scraper step via the env block, making them available as environment variables within the Python script \[5983, S\_R410, S\_R424, S\_R517\]. The Python script should be designed to read these values from

os.environ.

### **4.4. Scaling and Parallelism: Leveraging the Matrix Strategy**

To scrape a large volume of data efficiently, the scraping tasks must be parallelized. GitHub Actions' strategy: matrix feature is the ideal tool for this \[59, S\_R384, S\_R436, S\_R467, 73, S\_R656, S\_R667, S\_R668, S\_R669, 610, 611, 22, 2. A matrix allows a single job definition to be expanded into multiple parallel jobs, each with a different set of input variables.

In the example scraper.yml workflow, the matrix is defined under jobs.scrape.strategy.matrix.job\_config. This creates three parallel jobs, each with a different combination of title and location. The Python script is then designed to read these variables from the matrix context (matrix.job\_config.title and matrix.job\_config.location) to perform its targeted search. This approach allows the scraping of multiple job categories and locations simultaneously, drastically reducing the total time required to complete the entire scraping run. The fail-fast: false setting ensures that the failure of one job in the matrix (e.g., a scrape for "Product Manager" fails) does not automatically cancel the other in-progress jobs (e.g., "Software Engineer" and "Data Scientist"), maximizing data collection even in the face of partial failures.

### **4.5. Monitoring and Debugging**

When a scraper fails in an automated, headless environment, debugging can be challenging. A robust monitoring and debugging strategy is essential for maintaining the long-term health of the scraping engine.

* **Trace on Failure:** The most powerful debugging tool Playwright offers is the Trace Viewer. By configuring trace: 'on-first-retry' in the Playwright config, a detailed trace file (trace.zip) is generated for any test that fails and is retried. This trace includes a screencast of the execution, a live DOM snapshot for each action, console logs, and network requests, providing a complete picture of what went wrong.56  
* **Conditional Artifact Upload:** The workflow is configured to upload this trace.zip file as a workflow artifact, but only when the run\_scraper step fails. This is achieved using the if: failure() condition on the actions/upload-artifact step. This ensures that artifacts are only generated when they are needed for debugging, keeping successful runs clean.  
* **Programmatic Issue Creation:** For critical, unrecoverable errors, the workflow can automatically create a GitHub Issue. The JasonEtco/create-an-issue action is used, again with an if: failure() condition. It can be configured with a template (.github/ISSUE\_TEMPLATE.md) to pre-populate the issue with details from the workflow run, such as the run ID, the failed job, and a link to the logs. This creates a formal, trackable record of the failure, ensuring that it is investigated and resolved0, 471, 472, 473, 474, S\_R124, S\_R125, S\_R126, S\_R127, S\_R128, S\_R129, S\_R130, 603, 604, 605, 606, 607, S\_R185, S\_R190, S\_R191, 5900, 5902, 67, 67, S\_R320, S\_R348, S\_R555, 75, S\_R623, 75, S\_R694, 2.

## **Section 5: The Complete Codebase and Final Recommendations**

This final section provides the complete, production-ready code for the Python scraper and the GitHub Actions workflow, followed by essential ethical and legal considerations for conducting web scraping activities.

### **5.1. Fully Commented Python Scraper Code**

The following is the fully integrated Python script (main.py), designed to be executed by the GitHub Actions workflow. It incorporates the architectural principles of modularity, secure credential handling, state management, robust error handling, and human behavior emulation.

Python

\# File: main.py

import asyncio  
import os  
import json  
import re  
import random  
from playwright.async\_api import async\_playwright, Page, BrowserContext, Playwright  
from dotenv import load\_dotenv  
import gnupg \# Requires python-gnupg library and GnuPG installed on the runner

\# \--- Configuration \---  
\# In a real project, this might be in a separate config.py  
BASE\_URL \= "<https://www.linkedin.com/jobs/search>"  
OUTPUT\_DIR \= "data"  
SESSION\_FILE \= "session.json"  
ENCRYPTED\_SESSION\_FILE \= "session.json.gpg"

\# \--- Human Behavior Emulation \---  
class HumanEmulator:  
    @staticmethod  
    async def human\_like\_typing(page: Page, selector: str, text: str):  
        await page.locator(selector).click()  
        for char in text:  
            delay \= random.uniform(0.08, 0.25) \# 80ms to 250ms delay  
            await page.keyboard.type(char, delay=delay \* 1000)  
            await asyncio.sleep(delay / 2)

    @staticmethod  
    async def bezier\_mouse\_move(page: Page, start\_x, start\_y, end\_x, end\_y, duration\_ms=800):  
        control\_1\_x \= start\_x \+ (end\_x \- start\_x) \* 0.25 \+ random.uniform(-75, 75)  
        control\_1\_y \= start\_y \+ (end\_y \- start\_y) \* 0.25 \+ random.uniform(-75, 75)  
        control\_2\_x \= start\_x \+ (end\_x \- start\_x) \* 0.75 \+ random.uniform(-75, 75)  
        control\_2\_y \= start\_y \+ (end\_y \- start\_y) \* 0.75 \+ random.uniform(-75, 75)  
          
        num\_points \= int(duration\_ms / 20)  
        points \=  
        for i in range(num\_points \+ 1):  
            t \= i / num\_points  
            x \= (1\-t)\*\*3\*start\_x \+ 3\*(1\-t)\*\*2\*t\*control\_1\_x \+ 3\*(1\-t)\*t\*\*2\*control\_2\_x \+ t\*\*3\*end\_x  
            y \= (1\-t)\*\*3\*start\_y \+ 3\*(1\-t)\*\*2\*t\*control\_1\_y \+ 3\*(1\-t)\*t\*\*2\*control\_2\_y \+ t\*\*3\*end\_y  
            jitter\_x \= random.uniform(-1.5, 1.5)  
            jitter\_y \= random.uniform(-1.5, 1.5)  
            points.append((x \+ jitter\_x, y \+ jitter\_y))

        for x, y in points:  
            await page.mouse.move(x, y)  
            await asyncio.sleep(random.uniform(0.015, 0.025))  
        await page.mouse.move(end\_x, end\_y)

    @staticmethod  
    async def move\_and\_click(page: Page, selector: str, duration\_ms=800):  
        element \= page.locator(selector)  
        await element.wait\_for(state="visible", timeout=10000)  
        box \= await element.bounding\_box()  
        if not box: raise Exception(f"Element '{selector}' not found.")  
          
        start\_pos \= await page.evaluate("() \=\> ({ x: Math.random() \* 500, y: Math.random() \* 500 })")  
        target\_x \= box\['x'\] \+ random.uniform(0.3, 0.7) \* box\['width'\]  
        target\_y \= box\['y'\] \+ random.uniform(0.3, 0.7) \* box\['height'\]  
          
        await HumanEmulator.bezier\_mouse\_move(page, start\_pos\['x'\], start\_pos\['y'\], target\_x, target\_y, duration\_ms)  
        await page.mouse.down()  
        await asyncio.sleep(random.uniform(0.06, 0.18))  
        await page.mouse.up()

\# \--- Scraper Class \---  
class LinkedInScraper:  
    def \_\_init\_\_(self, job\_title: str, location: str):  
        self.job\_title \= job\_title  
        self.location \= location  
        self.playwright: Playwright \= None  
        self.browser \= None  
        self.context: BrowserContext \= None  
        self.page: Page \= None  

    async def setup(self):  
        self.playwright \= await async\_playwright().start()  
        proxy\_url \= os.environ.get("PROXY\_URL")  
        proxy\_config \= None  
        if proxy\_url:  
            \# Assuming format http://user:pass@host:port  
            parts \= re.match(r"http://(.\*?):(.\*?)@(.\*?):(\\d+)", proxy\_url)  
            if parts:  
                proxy\_config \= {  
                    "server": f"http://{parts.group(3)}:{parts.group(4)}",  
                    "username": parts.group(1),  
                    "password": parts.group(2)  
                }  
          
        self.browser \= await self.playwright.chromium.launch(  
            headless=True,  
            proxy=proxy\_config,  
            args=\["--disable-blink-features=AutomationControlled"\]  
        )

        await self.\_load\_session\_state()

    async def \_load\_session\_state(self):  
        encrypted\_state\_b64 \= os.environ.get("SESSION\_STATE\_ENCRYPTED")  
        passphrase \= os.environ.get("GPG\_PASSPHRASE")

        if not encrypted\_state\_b64 or not passphrase:  
            print("Session state or passphrase not found in environment variables. Cannot proceed with authenticated scraping.")  
            \# Fallback to creating a new context, which will be unauthenticated  
            self.context \= await self.browser.new\_context()  
            self.page \= await self.context.new\_page()  
            return

        try:  
            gpg \= gnupg.GPG()  
            with open(ENCRYPTED\_SESSION\_FILE, "wb") as f:  
                import base64  
                f.write(base64.b64decode(encrypted\_state\_b64))

            with open(ENCRYPTED\_SESSION\_FILE, "rb") as f:  
                decrypted\_data \= gpg.decrypt\_file(f, passphrase=passphrase)  
                if not decrypted\_data.ok:  
                    raise Exception(f"GPG decryption failed: {decrypted\_data.stderr}")  
                  
                with open(SESSION\_FILE, "w") as sf:  
                    sf.write(str(decrypted\_data))

            self.context \= await self.browser.new\_context(storage\_state=SESSION\_FILE)  
            self.page \= await self.context.new\_page()  
            print("Successfully loaded and decrypted session state.")

        except Exception as e:  
            print(f"Error loading session state: {e}. Proceeding with a new context.")  
            self.context \= await self.browser.new\_context()  
            self.page \= await self.context.new\_page()

    async def scrape(self):  
        url \= f"{BASE\_URL}?keywords={self.job\_title}\&location={self.location}"  
        await self.page.goto(url, wait\_until="networkidle", timeout=60000)  
          
        \# Simple check to see if we are on a login page (which means session failed)  
        if "login" in self.page.url.lower():  
            print("Redirected to login page. Session state may be invalid.")  
            \# In a real scenario, you might want to trigger an alert here.  
            return

        \# Handle infinite scroll  
        last\_height \= await self.page.evaluate("document.body.scrollHeight")  
        while True:  
            await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")  
            await asyncio.sleep(random.uniform(2, 4)) \# Wait for new content to load  
            new\_height \= await self.page.evaluate("document.body.scrollHeight")  
            if new\_height \== last\_height:  
                break  
            last\_height \= new\_height

        \# Extract data  
        job\_elements \= await self.page.locator('ul.jobs-search\_\_results-list \> li').all()  
        results \=  
        for job in job\_elements:  
            try:  
                title \= await job.locator('h3.base-search-card\_\_title').inner\_text()  
                company \= await job.locator('h4.base-search-card\_\_subtitle').inner\_text()  
                location \= await job.locator('span.job-search-card\_\_location').inner\_text()  
                link \= await job.locator('a.base-card\_\_full-link').get\_attribute('href')  
                results.append({  
                    "title": title.strip(),  
                    "company": company.strip(),  
                    "location": location.strip(),  
                    "link": link  
                })  
            except Exception:  
                continue \# Skip if an element is missing  
          
        return results

    def save\_data(self, data):  
        if not os.path.exists(OUTPUT\_DIR):  
            os.makedirs(OUTPUT\_DIR)  
          
        filename \= f"{self.job\_title.replace(' ', '\_')}\_{self.location.replace(' ', '\_')}.json"  
        filepath \= os.path.join(OUTPUT\_DIR, filename)  
          
        with open(filepath, 'w', encoding='utf-8') as f:  
            json.dump(data, f, indent=4, ensure\_ascii=False)  
        print(f"Data saved to {filepath}")

    async def teardown(self):  
        if self.browser:  
            await self.browser.close()  
        if self.playwright:  
            await self.playwright.stop()

async def main():  
    import argparse  
    parser \= argparse.ArgumentParser()  
    parser.add\_argument("--job-title", required=True)  
    parser.add\_argument("--location", required=True)  
    args \= parser.parse\_args()

    scraper \= LinkedInScraper(job\_title=args.job\_title, location=args.location)  
    try:  
        await scraper.setup()  
        data \= await scraper.scrape()  
        if data:  
            scraper.save\_data(data)  
    finally:  
        await scraper.teardown()

if \_\_name\_\_ \== "\_\_main\_\_":  
    load\_dotenv() \# For local testing  
    asyncio.run(main())

### **5.2. The Final workflow.yml**

This is the complete, annotated GitHub Actions workflow file that orchestrates the entire process. It should be placed in the repository at .github/workflows/scraper.yml.

YAML

\# File:.github/workflows/scraper.yml  
name: LinkedIn Job Scraper

on:  
  schedule:  
    \- cron: '0 3 \* \* \*' \# Runs every day at 3 AM UTC  
  workflow\_dispatch:  
    inputs:  
      job\_title:  
        description: 'Job Title to search for'  
        required: true  
        default: 'Data Engineer'  
      location:  
        description: 'Location to search in'  
        required: true  
        default: 'Remote'

permissions:  
  contents: write  
  issues: write

jobs:  
  scrape-and-commit:  
    runs-on: ubuntu-latest  
    strategy:  
      fail-fast: false  
      matrix:  
        job\_config:  
          \- { title: 'Software Engineer', location: 'United States' }  
          \- { title: 'Data Scientist', location: 'United States' }  
          \- { title: 'Product Manager', location: 'Canada' }  
          \- { title: 'DevOps Engineer', location: 'United Kingdom' }

    timeout-minutes: 60

    steps:  
      \- name: Checkout repository  
        uses: actions/checkout@v4

      \- name: Set up Python 3.10  
        uses: actions/setup-python@v5  
        with:  
          python-version: '3.10'

      \- name: Cache pip dependencies  
        uses: actions/cache@v4  
        with:  
          path: \~/.cache/pip  
          key: ${{ runner.os }}-pip-${{ hashFiles('\*\*/requirements.txt') }}  
          restore-keys: |  
            ${{ runner.os }}-pip-

      \- name: Cache Playwright browsers  
        uses: actions/cache@v4  
        with:  
          path: \~/.cache/ms-playwright  
          key: ${{ runner.os }}-playwright-${{ hashFiles('\*\*/requirements.txt') }}  
          restore-keys: |  
            ${{ runner.os }}-playwright-

      \- name: Install system dependencies for GnuPG  
        run: sudo apt-get update && sudo apt-get install \-y gnupg

      \- name: Install Python dependencies  
        run: |  
          python \-m pip install \--upgrade pip  
          pip install \-r requirements.txt

      \- name: Install Playwright browsers and OS dependencies  
        run: npx playwright install \--with-deps chromium

      \- name: Run Python Scraper  
        id: scraper\_run  
        env:  
          LINKEDIN\_EMAIL: ${{ secrets.LINKEDIN\_EMAIL }}  
          LINKEDIN\_PASSWORD: ${{ secrets.LINKEDIN\_PASSWORD }}  
          PROXY\_URL: ${{ secrets.PROXY\_URL }}  
          GPG\_PASSPHRASE: ${{ secrets.GPG\_PASSPHRASE }}  
          SESSION\_STATE\_ENCRYPTED: ${{ secrets.SESSION\_STATE }}  
        run: |  
          JOB\_TITLE="${{ github.event.inputs.job\_title |

| matrix.job\_config.title }}"  
          LOCATION="${{ github.event.inputs.location |

| matrix.job\_config.location }}"  
          python main.py \--job-title "$JOB\_TITLE" \--location "$LOCATION"

      \- name: Commit and push if changed  
        if: success()  
        uses: stefanzweifel/git-auto-commit-action@v5  
        with:  
          commit\_message: "ci: Automated job data update for ${{ matrix.job\_config.title }}"  
          file\_pattern: "data/\*.json"  
          commit\_user\_name: "GitHub Actions Bot"  
          commit\_user\_email: "github-actions\[bot\]@users.noreply.github.com"  
          commit\_author: "GitHub Actions Bot \<github-actions\[bot\]@users.noreply.github.com\>"

      \- name: Upload Trace on Failure  
        if: failure()  
        uses: actions/upload-artifact@v4  
        with:  
          name: playwright-trace-${{ matrix.job\_config.title }}-${{ matrix.job\_config.location }}  
          path: trace.zip  
          retention-days: 5

      \- name: Create Issue on Failure  
        if: failure()  
        uses: JasonEtco/create-an-issue@v2  
        env:  
          GITHUB\_TOKEN: ${{ secrets.GITHUB\_TOKEN }}  
        with:  
          filename:.github/ISSUE\_TEMPLATE.md  
          assignees: ${{ github.actor }}  
          update\_existing: true  
          search\_existing: open  
          title: "Scraping job failed for: ${{ matrix.job\_config.title }} in ${{ matrix.job\_config.location }}"

### **5.3. Ethical and Legal Considerations**

While this playbook provides the technical means to perform advanced web scraping, it is imperative that these tools are used responsibly. Developers and organizations must be cognizant of the ethical and legal landscape surrounding data extraction\].

* **Terms of Service (ToS):** Most websites, including LinkedIn, have terms of service that explicitly prohibit or restrict automated data collection. While ToS are not always legally enforceable in the same way as laws, violating them can lead to account suspension and legal action from the platform owner. It is crucial to review and understand the ToS of any target website.  
* **Rate Limiting and Server Load:** A core tenet of responsible scraping is to "be a good web citizen." This means implementing conservative rate limits and backoff strategies to avoid overwhelming the target server's resources. An overly aggressive scraper can degrade the service for legitimate users and is more likely to be detected and blocked.  
* **Data Privacy (GDPR, CCPA):** Scraping and storing personal data is subject to strict data protection laws like the General Data Protection Regulation (GDPR) in Europe and the California Consumer Privacy Act (CCPA). These regulations impose stringent requirements on the collection, processing, and storage of personally identifiable information (PII). Any scraping project involving personal data must have a clear legal basis for processing and must implement robust data security and privacy measures.  
* **Copyright:** The data on websites may be protected by copyright. Scraping and republishing copyrighted content without permission can constitute infringement.

Ultimately, the responsibility lies with the developer to ensure their scraping activities are conducted in an ethical, legal, and respectful manner. This playbook provides the "how," but the "why" and "if" must be carefully considered for each specific use case.

## **Section 6: References**

\[59\], \[47\], \[60\], \[33\], \[59, \[33\],, \[61\], \[62\], \[45\], \[63\], \[64\],,,,, \[47, \[47, \[47, \[47, \[47,,,,,,,, \[65\], \[56\],, \[66\], \[45\], \[56\], \[56\], 20, \[60, \[60, \[60, \[60, \[60, \[60, \[60, \[60, \[56\],,,,, \[65\], \[21\], \[59, \[59, \[59, \[59, \[59, \[59, \[59, \[59, \[59, \[33, \[33, \[33, \[33, \[33, \[59, \[67\], \[59, \[59, \[59, \[59, \[59, \[59, \[59, \[44\], \[59, \[68\], \[59, \[59, \[67\], \[59, \[59, \[59, \[59,,,,, 17,,, 53, \[18\],,,,,,,,,,,,,,, \[3\],, \[55\], \[49\], \[33,,,,,,, \[12\],,, \[46\], \[48\], \[48\], \[48\], \[48\], \[48\], \[48\], \[48\],, \[12\],,, \[50\], \[48\],,,,,,,,,,, 6,, \[54\],, \[49\], \[49\], \[49\], \[49\], \[49\], \[49\], \[49\],,,,,,,,, \[69\],,,,,,,,,, \[70\], \[70\], \[70\], \[70\], \[70\], \[70\], \[70\], \[71\], \[72\], \[72\], \[72\], \[72\], \[72\], \[72\], \[72\], \[50\], \[50\], \[50\], \[50\], \[50\], \[50\], \[50\], \[19\], \[73\], \[74\],,, \[75\],,, \[76\],,, \[70\], \[77\], \[77\], \[77\], \[77\], \[77\], \[77\], \[77\], \[71\],,,,,,,, \[78\], \[78\], \[78\], \[78\], \[78\], \[78\], \[78\],, \[79\], \[18\],, \[80\], \[80\], \[80\], \[80\], \[80\], \[80\], \[80\], \[18\], \[75\],,,,,,,,, \[80\],,,,, \[81\],,,,,,,,,,,,,,,,, \[13\], \[13\], \[57\], 1, \[4\], 13, \[82\], \[2\], 3, 8, \[6\], \[7\], \[83\], \[84\], 9, \[11\], \[10\], \[24\], \[25\], \[17\], \[85\], \[86\], \[87\], \[88\], \[37\], \[38\], \[39\], \[14\], \[89\], 22, \[90\], \[87\], \[43\], \[91\], \[92\], \[39\], \[40\], \[41\], \[42\], \[14\], \[15\], \[16\], \[93\], \[94\], \[95\], \[96\], \[5\], \[43\], \[17\], 33, 35, \[36\], \[34\], \[43\], \[58\]

### **Works cited**

1. Fingerprinting and Tracing Shadows: The Development and Impact ..., accessed on July 30, 2025, [https://arxiv.org/pdf/2411.12045](https://arxiv.org/pdf/2411.12045)  
2. Canvas fingerprinting: Explained and illustrated \- Stytch, accessed on July 30, 2025, [https://stytch.com/blog/canvas-fingerprinting/](https://stytch.com/blog/canvas-fingerprinting/)  
3. Canvas Fingerprinting: What Is It and How to Bypass It \- ZenRows, accessed on July 30, 2025, [https://www.zenrows.com/blog/canvas-fingerprinting](https://www.zenrows.com/blog/canvas-fingerprinting)  
4. The Development and Impact of Browser Fingerprinting on Digital Privacy \- arXiv, accessed on July 30, 2025, [https://arxiv.org/html/2411.12045v1](https://arxiv.org/html/2411.12045v1)  
5. How to Use a Playwright Proxy in 2025 \- ZenRows, accessed on July 30, 2025, [https://www.zenrows.com/blog/playwright-proxy](https://www.zenrows.com/blog/playwright-proxy)  
6. What is WebGL Fingerprinting? How It Works & Tips | Medium, accessed on July 30, 2025, [https://medium.com/@datajournal/webgl-fingerprinting-60893a9ca382](https://medium.com/@datajournal/webgl-fingerprinting-60893a9ca382)  
7. Top 9 Browser Fingerprinting Techniques Explained \- Bureau, accessed on July 30, 2025, [https://bureau.id/blog/browser-fingerprinting-techniques](https://bureau.id/blog/browser-fingerprinting-techniques)  
8. Browser fingerprinting: implementing fraud detection techniques in the era of AI \- Stytch, accessed on July 30, 2025, [https://stytch.com/blog/browser-fingerprinting/](https://stytch.com/blog/browser-fingerprinting/)  
9. What Is HTTP/2 Fingerprinting and How to Bypass It? | Ultimate Guide, accessed on July 30, 2025, [https://www.scrapeless.com/en/blog/bypass-https2](https://www.scrapeless.com/en/blog/bypass-https2)  
10. Applications of TLS Fingerprinting in Bot Mitigation \- CDNetworks, accessed on July 30, 2025, [https://www.cdnetworks.com/blog/cloud-security/tls-fingerprinting-bot-mitigation/](https://www.cdnetworks.com/blog/cloud-security/tls-fingerprinting-bot-mitigation/)  
11. HTTP2 Fingerprinting Tools \- Scrapfly, accessed on July 30, 2025, [https://scrapfly.io/web-scraping-tools/http2-fingerprint](https://scrapfly.io/web-scraping-tools/http2-fingerprint)  
12. Preventing Playwright Bot Detection with Random Mouse Movements | by Manan Patel, accessed on July 30, 2025, [https://medium.com/@domadiyamanan/preventing-playwright-bot-detection-with-random-mouse-movements-10ab7c710d2a](https://medium.com/@domadiyamanan/preventing-playwright-bot-detection-with-random-mouse-movements-10ab7c710d2a)  
13. (PDF) Web Bot Detection Evasion Using Generative Adversarial ..., accessed on July 30, 2025, [https://www.researchgate.net/publication/354391714\_Web\_Bot\_Detection\_Evasion\_Using\_Generative\_Adversarial\_Networks](https://www.researchgate.net/publication/354391714_Web_Bot_Detection_Evasion_Using_Generative_Adversarial_Networks)  
14. mehaase/js-typewriter: Simulate a person typing in a DOM node. \- GitHub, accessed on July 30, 2025, [https://github.com/mehaase/js-typewriter](https://github.com/mehaase/js-typewriter)  
15. TypeIt | The most versatile JavaScript typewriter effect library on the planet., accessed on July 30, 2025, [https://www.typeitjs.com/](https://www.typeitjs.com/)  
16. How to simulate typing in an input box with JavaScript \- Stack Overflow, accessed on July 30, 2025, [https://stackoverflow.com/questions/47617616/how-to-simulate-typing-in-an-input-box-with-javascript](https://stackoverflow.com/questions/47617616/how-to-simulate-typing-in-an-input-box-with-javascript)  
17. How To Make Playwright Undetectable | ScrapeOps, accessed on July 30, 2025, [https://scrapeops.io/playwright-web-scraping-playbook/nodejs-playwright-make-playwright-undetectable/](https://scrapeops.io/playwright-web-scraping-playbook/nodejs-playwright-make-playwright-undetectable/)  
18. Playwright vs Selenium : Which to choose in 2025 | BrowserStack, accessed on July 30, 2025, [https://www.browserstack.com/guide/playwright-vs-selenium](https://www.browserstack.com/guide/playwright-vs-selenium)  
19. Playwright vs Selenium: Key Differences | Sauce Labs, accessed on July 30, 2025, [https://saucelabs.com/resources/blog/playwright-vs-selenium-guide](https://saucelabs.com/resources/blog/playwright-vs-selenium-guide)  
20. Playwright vs. Selenium for web scraping \- Apify Blog, accessed on July 30, 2025, [https://blog.apify.com/playwright-vs-selenium/](https://blog.apify.com/playwright-vs-selenium/)  
21. playwright-extra \- npm, accessed on July 30, 2025, [https://www.npmjs.com/package/playwright-extra](https://www.npmjs.com/package/playwright-extra)  
22. What is Playwright Extra \- A Web Scrapers Guide \- ScrapeOps, accessed on July 30, 2025, [https://scrapeops.io/playwright-web-scraping-playbook/nodejs-playwright-extra/](https://scrapeops.io/playwright-web-scraping-playbook/nodejs-playwright-extra/)  
23. puppeteer-extra-plugin-stealth/evasions \- GitHub, accessed on July 30, 2025, [https://github.com/berstend/puppeteer-extra/blob/master/packages/puppeteer-extra-plugin-stealth/evasions/readme.md](https://github.com/berstend/puppeteer-extra/blob/master/packages/puppeteer-extra-plugin-stealth/evasions/readme.md)  
24. Invisible Automation: Using puppeteer-extra-plugin-stealth to Bypass Bot Protection, accessed on July 30, 2025, [https://latenode.com/blog/invisible-automation-using-puppeteer-extra-plugin-stealth-to-bypass-bot-protection](https://latenode.com/blog/invisible-automation-using-puppeteer-extra-plugin-stealth-to-bypass-bot-protection)  
25. Puppeteer Stealth Tutorial: How To Use & Setup (+Alternatives) \- Scrapingdog, accessed on July 30, 2025, [https://www.scrapingdog.com/blog/puppeteer-stealth/](https://www.scrapingdog.com/blog/puppeteer-stealth/)  
26. puppeteer-extra-plugin-stealth \- NPM, accessed on July 30, 2025, [https://www.npmjs.com/package/puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth)  
27. Puppeteer-Extra-Stealth Guide \- Bypass Anti-Bots With Ease | ScrapeOps, accessed on July 30, 2025, [https://scrapeops.io/puppeteer-web-scraping-playbook/nodejs-puppeteer-extra-stealth-plugin/](https://scrapeops.io/puppeteer-web-scraping-playbook/nodejs-puppeteer-extra-stealth-plugin/)  
28. Implementing "Stealth" in Puppeteer Sharp \- LambdaTest Community, accessed on July 30, 2025, [https://community.lambdatest.com/t/implementing-stealth-in-puppeteer-sharp/29231](https://community.lambdatest.com/t/implementing-stealth-in-puppeteer-sharp/29231)  
29. Puppeteer Stealth Tutorial; How to Set Up & Use (+ Working Alternatives) | ScrapingBee, accessed on July 30, 2025, [https://www.scrapingbee.com/blog/puppeteer-stealth-tutorial-with-examples/](https://www.scrapingbee.com/blog/puppeteer-stealth-tutorial-with-examples/)  
30. How to Use Puppeteer Stealth: A Plugin for Scraping \- ZenRows, accessed on July 30, 2025, [https://www.zenrows.com/blog/puppeteer-stealth](https://www.zenrows.com/blog/puppeteer-stealth)  
31. puppeteer-extra-plugin-stealth \- UNPKG, accessed on July 30, 2025, [https://app.unpkg.com/puppeteer-extra-plugin-stealth@2.4.1/files/readme.md](https://app.unpkg.com/puppeteer-extra-plugin-stealth@2.4.1/files/readme.md)  
32. puppeteer-extra \- NPM, accessed on July 30, 2025, [https://www.npmjs.com/package/puppeteer-extra](https://www.npmjs.com/package/puppeteer-extra)  
33. How to Make Playwright Scraping Undetectable | ScrapingAnt, accessed on July 30, 2025, [https://scrapingant.com/blog/playwright-scraping-undetectable](https://scrapingant.com/blog/playwright-scraping-undetectable)  
34. undetected-playwright \- PyPI, accessed on July 30, 2025, [https://pypi.org/project/undetected-playwright/0.2.0/](https://pypi.org/project/undetected-playwright/0.2.0/)  
35. Kaliiiiiiiiii-Vinyzu/patchright-python: Undetected Python version of the Playwright testing and automation library. \- GitHub, accessed on July 30, 2025, [https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python)  
36. Playwright Web Scraping Tutorial | Become 100% Undetectable\! \- YouTube, accessed on July 30, 2025, [https://www.youtube.com/watch?v=afobK3UbTeE](https://www.youtube.com/watch?v=afobK3UbTeE)  
37. Playing with Perlin Noise: Generating Realistic Archipelagos | by Yvan Scher \- Medium, accessed on July 30, 2025, [https://medium.com/@yvanscher/playing-with-perlin-noise-generating-realistic-archipelagos-b59f004d8401](https://medium.com/@yvanscher/playing-with-perlin-noise-generating-realistic-archipelagos-b59f004d8401)  
38. Perlin Noise: Implementation, Procedural Generation, and Simplex Noise \- Garage Farm, accessed on July 30, 2025, [https://garagefarm.net/blog/perlin-noise-implementation-procedural-generation-and-simplex-noise](https://garagefarm.net/blog/perlin-noise-implementation-procedural-generation-and-simplex-noise)  
39. Perlin Noise: A Procedural Generation Algorithm \- Raouf's blog, accessed on July 30, 2025, [https://rtouti.github.io/graphics/perlin-noise-algorithm](https://rtouti.github.io/graphics/perlin-noise-algorithm)  
40. ghost-cursor \- NPM, accessed on July 30, 2025, [https://www.npmjs.com/package/ghost-cursor](https://www.npmjs.com/package/ghost-cursor)  
41. Using Perlin Noise to follow my mouse \- Processing Forum, accessed on July 30, 2025, [https://forum.processing.org/two/discussion/20974/using-perlin-noise-to-follow-my-mouse.html](https://forum.processing.org/two/discussion/20974/using-perlin-noise-to-follow-my-mouse.html)  
42. Making maps with noise functions \- Red Blob Games, accessed on July 30, 2025, [https://www.redblobgames.com/maps/terrain-from-noise/](https://www.redblobgames.com/maps/terrain-from-noise/)  
43. oxylabs/OxyMouse: Mouse Movement Algorithms \- GitHub, accessed on July 30, 2025, [https://github.com/oxylabs/OxyMouse](https://github.com/oxylabs/OxyMouse)  
44. Python Scrapy \- Build A LinkedIn Jobs Scraper \[2025\] \- ScrapeOps, accessed on July 30, 2025, [https://scrapeops.io/python-scrapy-playbook/python-scrapy-linkedin-jobs-scraper/](https://scrapeops.io/python-scrapy-playbook/python-scrapy-linkedin-jobs-scraper/)  
45. spinlud/py-linkedin-jobs-scraper \- GitHub, accessed on July 30, 2025, [https://github.com/spinlud/py-linkedin-jobs-scraper](https://github.com/spinlud/py-linkedin-jobs-scraper)  
46. speedyapply/JobSpy: Jobs scraper library for LinkedIn ... \- GitHub, accessed on July 30, 2025, [https://github.com/speedyapply/JobSpy](https://github.com/speedyapply/JobSpy)  
47. How to create a LinkedIn job scraper in Python with Crawlee, accessed on July 30, 2025, [https://crawlee.dev/blog/linkedin-job-scraper-python](https://crawlee.dev/blog/linkedin-job-scraper-python)  
48. Managing GitHub Actions settings for a repository \- GitHub Docs, accessed on July 30, 2025, [https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)  
49. Controlling permissions for GITHUB\_TOKEN \- GitHub Docs, accessed on July 30, 2025, [https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github\_token](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token)  
50. GitHub Actions permissions \- Graphite, accessed on July 30, 2025, [https://graphite.dev/guides/github-actions-permissions](https://graphite.dev/guides/github-actions-permissions)  
51. Undetected ChromeDriver in Python Selenium: How to Use for Web Scraping \- ZenRows, accessed on July 30, 2025, [https://www.zenrows.com/blog/undetected-chromedriver](https://www.zenrows.com/blog/undetected-chromedriver)  
52. How to avoid Selenium detection or change approach \- Stack Overflow, accessed on July 30, 2025, [https://stackoverflow.com/questions/77907712/how-to-avoid-selenium-detection-or-change-approach](https://stackoverflow.com/questions/77907712/how-to-avoid-selenium-detection-or-change-approach)  
53. How to Set Up Automated GitHub Workflows for Your Python and React Applications, accessed on July 30, 2025, [https://www.freecodecamp.org/news/how-to-set-up-automated-github-workflows-for-python-react-apps/](https://www.freecodecamp.org/news/how-to-set-up-automated-github-workflows-for-python-react-apps/)  
54. til/github-actions/cache-playwright-dependencies-across-workflows.md at master, accessed on July 30, 2025, [https://github.com/jbranchaud/til/blob/master/github-actions/cache-playwright-dependencies-across-workflows.md](https://github.com/jbranchaud/til/blob/master/github-actions/cache-playwright-dependencies-across-workflows.md)  
55. How to run Playwright on GitHub Actions \- foosel.net, accessed on July 30, 2025, [https://foosel.net/til/how-to-run-playwright-on-github-actions/](https://foosel.net/til/how-to-run-playwright-on-github-actions/)  
56. Setting up CI \- Playwright, accessed on July 30, 2025, [https://playwright.dev/docs/ci-intro](https://playwright.dev/docs/ci-intro)  
57. Trace viewer | Playwright, accessed on July 30, 2025, [https://playwright.dev/docs/trace-viewer](https://playwright.dev/docs/trace-viewer)  
58. What are the steps to enable and view traces in Playwright tests run on GitHub Actions?, accessed on July 30, 2025, [https://ray.run/questions/what-are-the-steps-to-enable-and-view-traces-in-playwright-tests-run-on-github-actions](https://ray.run/questions/what-are-the-steps-to-enable-and-view-traces-in-playwright-tests-run-on-github-actions)  
59. How to Use GitHub Actions to Automate Data Scraping | by Tom Willcocks \- Medium, accessed on July 30, 2025, [https://medium.com/data-analytics-at-nesta/how-to-use-github-actions-to-automate-data-scraping-299690cd8bdb](https://medium.com/data-analytics-at-nesta/how-to-use-github-actions-to-automate-data-scraping-299690cd8bdb)  
60. Scrapy Playwright Tutorial: How to Scrape Dynamic Websites | ScrapingBee, accessed on July 30, 2025, [https://www.scrapingbee.com/blog/scrapy-playwright-tutorial/](https://www.scrapingbee.com/blog/scrapy-playwright-tutorial/)  
61. How to Scrape LinkedIn in 2025 \- Scrapfly, accessed on July 30, 2025, [https://scrapfly.io/blog/posts/how-to-scrape-linkedin-person-profile-company-job-data](https://scrapfly.io/blog/posts/how-to-scrape-linkedin-person-profile-company-job-data)  
62. Playwright for Python Web Scraping Tutorial with Examples \- ScrapingBee, accessed on July 30, 2025, [https://www.scrapingbee.com/blog/playwright-for-python-web-scraping/](https://www.scrapingbee.com/blog/playwright-for-python-web-scraping/)  
63. Web Scraping with Playwright \- BrowserStack, accessed on July 30, 2025, [https://www.browserstack.com/guide/playwright-web-scraping](https://www.browserstack.com/guide/playwright-web-scraping)  
64. Playwright Web Scraping Tutorial for 2025 \- Oxylabs, accessed on July 30, 2025, [https://oxylabs.io/blog/playwright-web-scraping](https://oxylabs.io/blog/playwright-web-scraping)  
65. From Puppeteer stealth to Nodriver: How anti-detect frameworks evolved to evade bot detection \- The Castle blog, accessed on July 30, 2025, [https://blog.castle.io/from-puppeteer-stealth-to-nodriver-how-anti-detect-frameworks-evolved-to-evade-bot-detection/](https://blog.castle.io/from-puppeteer-stealth-to-nodriver-how-anti-detect-frameworks-evolved-to-evade-bot-detection/)  
66. “Step-by-Step Guide”: Build Python Project Using GitHub Actions | by Yagmur Ozden, accessed on July 30, 2025, [https://medium.com/@yagmurozden/step-by-step-guide-build-python-project-using-github-actions-025e67c164e9](https://medium.com/@yagmurozden/step-by-step-guide-build-python-project-using-github-actions-025e67c164e9)  
67. Make an issue on github using API V3 and Python, accessed on July 30, 2025, [https://gist.github.com/JeffPaine/3145490](https://gist.github.com/JeffPaine/3145490)  
68. The Python Developer's Guide: Mastering GitHub Actions | by Mayuresh K, accessed on July 30, 2025, [https://python.plainenglish.io/the-python-developers-guide-mastering-automated-workflows-with-github-actions-505110d89185](https://python.plainenglish.io/the-python-developers-guide-mastering-automated-workflows-with-github-actions-505110d89185)  
69. How to Upload Artifacts with GitHub Actions? \- Workflow Hub \- CICube, accessed on July 30, 2025, [https://cicube.io/workflow-hub/github-actions-upload-artifact/](https://cicube.io/workflow-hub/github-actions-upload-artifact/)  
70. Using secrets in GitHub Actions, accessed on July 30, 2025, [https://docs.github.com/actions/security-guides/using-secrets-in-github-actions](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions)  
71. Events that trigger workflows \- GitHub Docs, accessed on July 30, 2025, [https://docs.github.com/actions/learn-github-actions/events-that-trigger-workflows](https://docs.github.com/actions/learn-github-actions/events-that-trigger-workflows)  
72. Add & Commit · Actions · GitHub Marketplace, accessed on July 30, 2025, [https://github.com/marketplace/actions/add-commit](https://github.com/marketplace/actions/add-commit)  
73. Unlimited Free Web-Scraping with GitHub Actions \- YouTube, accessed on July 30, 2025, [https://www.youtube.com/watch?v=gEZhTfaIxHQ](https://www.youtube.com/watch?v=gEZhTfaIxHQ)  
74. vincentbavitz/bezmouse: Simulate human mouse movements with xdotool \- GitHub, accessed on July 30, 2025, [https://github.com/vincentbavitz/bezmouse](https://github.com/vincentbavitz/bezmouse)  
75. REST API endpoints for issues \- GitHub Docs, accessed on July 30, 2025, [https://docs.github.com/rest/reference/issues](https://docs.github.com/rest/reference/issues)  
76. Start Automating: Build Your First GitHub Action \- YouTube, accessed on July 30, 2025, [https://www.youtube.com/watch?v=N7zd6tkqq04](https://www.youtube.com/watch?v=N7zd6tkqq04)  
77. Actions · GitHub Marketplace \- Upload a Build Artifact, accessed on July 30, 2025, [https://github.com/marketplace/actions/upload-a-build-artifact](https://github.com/marketplace/actions/upload-a-build-artifact)  
78. actions/upload-artifact \- GitHub, accessed on July 30, 2025, [https://github.com/actions/upload-artifact](https://github.com/actions/upload-artifact)  
79. Building and testing Python \- GitHub Docs, accessed on July 30, 2025, [https://docs.github.com/actions/guides/building-and-testing-python](https://docs.github.com/actions/guides/building-and-testing-python)  
80. A How-To Guide for using Environment Variables and GitHub Secrets in GitHub Actions for Secrets Management in Continuous Integration \- GitHub Gist, accessed on July 30, 2025, [https://gist.github.com/brianjbayer/53ef17e0a15f7d80468d3f3077992ef8](https://gist.github.com/brianjbayer/53ef17e0a15f7d80468d3f3077992ef8)  
81. graphite.dev, accessed on July 30, 2025, [https://graphite.dev/guides/github-actions-matrix\#:\~:text=The%20matrix%20strategy%20is%20a,256%20jobs%20per%20workflow%20run.](https://graphite.dev/guides/github-actions-matrix#:~:text=The%20matrix%20strategy%20is%20a,256%20jobs%20per%20workflow%20run.)  
82. arXiv:2412.02266v1 \[cs.LG\] 3 Dec 2024, accessed on July 30, 2025, [https://arxiv.org/pdf/2412.02266](https://arxiv.org/pdf/2412.02266)  
83. <www.expressvpn.com>, accessed on July 30, 2025, [https://www.expressvpn.com/webrtc-leak-test](https://www.expressvpn.com/webrtc-leak-test)  
84. How to Fix WebRTC Leaks in 2025 (All Browsers) \- CyberInsider, accessed on July 30, 2025, [https://cyberinsider.com/webrtc-leaks/](https://cyberinsider.com/webrtc-leaks/)  
85. Scalable Web Scraping with Playwright and Browserless (2025 Guide), accessed on July 30, 2025, [https://www.browserless.io/blog/scraping-with-playwright-a-developer-s-guide-to-scalable-undetectable-data-extraction](https://www.browserless.io/blog/scraping-with-playwright-a-developer-s-guide-to-scalable-undetectable-data-extraction)  
86. sarperavci/human\_mouse: Ultra-realistic human mouse movements using bezier curves and spline interpolation. Natural cursor automation. \- GitHub, accessed on July 30, 2025, [https://github.com/sarperavci/human\_mouse](https://github.com/sarperavci/human_mouse)  
87. A beautiful application of Bézier Curves to simulate natural mouse movements \- Reddit, accessed on July 30, 2025, [https://www.reddit.com/r/math/comments/1hyfq73/a\_beautiful\_application\_of\_b%C3%A9zier\_curves\_to/](https://www.reddit.com/r/math/comments/1hyfq73/a_beautiful_application_of_b%C3%A9zier_curves_to/)  
88. Bezier curve \- The Modern JavaScript Tutorial, accessed on July 30, 2025, [https://javascript.info/bezier-curve](https://javascript.info/bezier-curve)  
89. Is Playwright the best alternative to Selenium in 2025? \- Reddit, accessed on July 30, 2025, [https://www.reddit.com/r/Playwright/comments/1jb29zu/is\_playwright\_the\_best\_alternative\_to\_selenium\_in/](https://www.reddit.com/r/Playwright/comments/1jb29zu/is_playwright_the_best_alternative_to_selenium_in/)  
90. Best Web Scraping Detection Avoidance Libraries for Javascript | ScrapingAnt, accessed on July 30, 2025, [https://scrapingant.com/blog/javascript-detection-avoidance-libraries](https://scrapingant.com/blog/javascript-detection-avoidance-libraries)  
91. ELI5:Why is it hard to simulate human mouse movement? : r/explainlikeimfive \- Reddit, accessed on July 30, 2025, [https://www.reddit.com/r/explainlikeimfive/comments/cv68fz/eli5why\_is\_it\_hard\_to\_simulate\_human\_mouse/](https://www.reddit.com/r/explainlikeimfive/comments/cv68fz/eli5why_is_it_hard_to_simulate_human_mouse/)  
92. Emulate Human Mouse Input with Bezier Curves and Gaussian Distributions \- CodeProject, accessed on July 30, 2025, [https://www.codeproject.com/Tips/759391/Emulate-Human-Mouse-Input-with-Bezier-Curves-and-G](https://www.codeproject.com/Tips/759391/Emulate-Human-Mouse-Input-with-Bezier-Curves-and-G)  
93. The Best Residential Proxies of 2025: Tested & Ranked \- Proxyway, accessed on July 30, 2025, [https://proxyway.com/best/residential-proxies](https://proxyway.com/best/residential-proxies)  
94. 10 Best Residential Proxies in 2025 (List of Residential IP Proxies From Best Provider) \- GeeksforGeeks, accessed on July 30, 2025, [https://www.geeksforgeeks.org/websites-apps/best-residential-proxy-providers/](https://www.geeksforgeeks.org/websites-apps/best-residential-proxy-providers/)  
95. Top 10 USA Proxy Providers in 2025 for Scraping \- Medium, accessed on July 30, 2025, [https://medium.com/@datajournal/best-usa-proxies-9ca04be84754](https://medium.com/@datajournal/best-usa-proxies-9ca04be84754)  
96. How to set proxy in Playwright \- Pixeljets, accessed on July 30, 2025, [https://pixeljets.com/blog/proxy-in-playwright/](https://pixeljets.com/blog/proxy-in-playwright/)
