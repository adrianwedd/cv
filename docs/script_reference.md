# Script Reference

This section provides an overview of the main JavaScript classes and their key methods used in the AI-enhanced CV system. For detailed API documentation, please refer to the [JSDoc-generated HTML documentation](jsdoc_output/index.html).

## `ActivityAnalyzer` (`.github/scripts/activity-analyzer.js`)

This class is responsible for collecting and analyzing GitHub activity data to generate professional metrics.

### Key Methods:

*   `analyze()`: Runs the comprehensive activity analysis pipeline.
*   `analyzeUserProfile()`: Analyzes basic user profile statistics.
*   `analyzeRepositories()`: Analyzes user repositories with detailed metrics.
*   `analyzeActivityPatterns()`: Analyzes activity patterns and contribution consistency.
*   `calculateProfessionalMetrics()`: Calculates comprehensive professional development metrics.
*   `analyzeSkillProficiency()`: Analyzes skill proficiency based on language usage and project complexity.

## `ClaudeApiClient` (`.github/scripts/claude-enhancer.js`)

This class provides an enhanced HTTP client for interacting with the Claude API, including caching and token optimization.

### Key Methods:

*   `makeRequest(messages, options, sourceContent)`: Makes a Claude API request with caching and token tracking.
*   `httpRequest(url, options, maxRetries, retryDelay)`: HTTP request wrapper with retry logic and exponential backoff.
*   `generateCacheKey(requestPayload, sourceContent)`: Generates a content-aware cache key for request deduplication.
*   `getCachedResponse(cacheKey)`: Retrieves a cached response.
*   `cacheResponse(cacheKey, response)`: Caches an API response.
*   `getUsageStats()`: Returns token usage statistics.

## `CVContentEnhancer` (`.github/scripts/claude-enhancer.js`)

This class orchestrates the multi-stage AI enhancement pipeline for professional CV content.

### Key Methods:

*   `enhance()`: Runs the comprehensive CV content enhancement pipeline.
*   `enhanceProfessionalSummary(cvData, activityMetrics)`: Enhances the professional summary with AI optimization.
*   `enhanceSkillsSection(cvData, activityMetrics)`: Enhances the skills section with proficiency analysis.
*   `enhanceExperience(cvData, activityMetrics)`: Enhances experience descriptions.
*   `enhanceProjects(cvData, activityMetrics)`: Enhances project descriptions with impact analysis.
*   `generateStrategicInsights(cvData, activityMetrics)`: Generates strategic career insights.

## `CVGenerator` (`.github/scripts/cv-generator.js`)

This class compiles all CV data sources into a production-ready website and various output formats.

### Key Methods:

*   `generate()`: Generates the complete CV website and other formats.
*   `prepareOutputDirectory()`: Prepares the output directory.
*   `loadDataSources()`: Loads all data sources (base CV, activity, AI enhancements).
*   `generateHTML()`: Generates the HTML file with dynamic content.
*   `processHTMLTemplate(htmlContent)`: Processes the HTML template with dynamic data.
*   `copyAssets()`: Copies assets to the output directory.
*   `generateSitemap()`: Generates `sitemap.xml`.
*   `generateRobotsTxt()`: Generates `robots.txt`.
*   `generateManifest()`: Generates web manifest.
*   `generateGitHubPagesFiles()`: Generates GitHub Pages specific files.
*   `generatePDF()`: Generates a high-quality PDF from the generated HTML.

## `CVApplication` (`assets/script.js`)

This is the main application controller for the interactive frontend of the CV.

### Key Methods:

*   `init()`: Initializes the application.
*   `setupEventListeners()`: Sets up event listeners for user interactions.
*   `setupNavigationSystem()`: Sets up the navigation system.
*   `setupThemeToggle()`: Sets up theme toggle functionality.
*   `loadApplicationData()`: Loads application data from various sources.
*   `initializeLiveStats()`: Initializes live statistics display.
*   `updateLiveStats()`: Updates live statistics in the header.
*   `initializeContentSections()`: Initializes content sections.
*   `navigateToSection(sectionId)`: Navigates to a specific section.
*   `toggleTheme()`: Toggles theme between dark and light.
*   `refreshLiveData()`: Refreshes live data.
