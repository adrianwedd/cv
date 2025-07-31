# Script Reference

This section provides an overview of the main JavaScript and Python classes and their key methods used throughout the AI-enhanced CV system. For more detailed API documentation, please refer to the [JSDoc-generated HTML documentation](jsdoc_output/index.html) for JavaScript components.

## JavaScript Components

### `ActivityAnalyzer` (`.github/scripts/activity-analyzer.js`)

**Role**: Responsible for collecting and analyzing GitHub activity data to generate professional metrics.

### Key Methods:

*   `analyze()`: Runs the comprehensive activity analysis pipeline.
*   `analyzeUserProfile()`: Analyzes basic user profile statistics.
*   `analyzeRepositories()`: Analyzes user repositories with detailed metrics.
*   `analyzeActivityPatterns()`: Analyzes activity patterns and contribution consistency.
*   `calculateProfessionalMetrics()`: Calculates comprehensive professional development metrics.
*   `analyzeSkillProficiency()`: Analyzes skill proficiency based on language usage and project complexity.

### `ClaudeApiClient` (`.github/scripts/claude-enhancer.js`)

**Role**: Provides an enhanced HTTP client for interacting with the Claude API, including caching and token optimization.

### Key Methods:

*   `makeRequest(messages, options, sourceContent)`: Makes a Claude API request with caching and token tracking.
*   `httpRequest(url, options, maxRetries, retryDelay)`: HTTP request wrapper with retry logic and exponential backoff.
*   `generateCacheKey(requestPayload, sourceContent)`: Generates a content-aware cache key for request deduplication.
*   `getCachedResponse(cacheKey)`: Retrieves a cached response.
*   `cacheResponse(cacheKey, response)`: Caches an API response.
*   `getUsageStats()`: Returns token usage statistics.

### `CVContentEnhancer` (`.github/scripts/claude-enhancer.js`)

**Role**: Orchestrates the multi-stage AI enhancement pipeline for professional CV content.

### Key Methods:

*   `enhance()`: Runs the comprehensive CV content enhancement pipeline.
*   `enhanceProfessionalSummary(cvData, activityMetrics)`: Enhances the professional summary with AI optimization.
*   `enhanceSkillsSection(cvData, activityMetrics)`: Enhances the skills section with proficiency analysis.
*   `enhanceExperience(cvData, activityMetrics)`: Enhances experience descriptions.
*   `enhanceProjects(cvData, activityMetrics)`: Enhances project descriptions with impact analysis.
*   `generateStrategicInsights(cvData, activityMetrics)`: Generates strategic career insights.

### `CVGenerator` (`.github/scripts/cv-generator.js`)

**Role**: Compiles all CV data sources into a production-ready website with verified GitHub metrics integration.

### Key Methods:

*   `generate()`: Runs the complete CV website generation pipeline with GitHub data integration.
*   `loadDataSources()`: Loads and validates all data sources including activity data, CV data, and AI enhancements.
*   `validateActivityData()`: Validates and sanitizes GitHub activity metrics for data integrity.
*   `updateGitHubMetrics(htmlContent)`: Replaces placeholder metrics with verified GitHub data.
*   `updateStructuredDataWithGitHubSkills(htmlContent)`: Enhances structured data with GitHub-verified skills.
*   `calculateCredibilityScore(summary, professionalMetrics)`: Calculates data integrity score based on GitHub metrics completeness.
*   `generateHTML()`: Generates the HTML file with dynamic content.
*   `processHTMLTemplate(htmlContent)`: Processes the HTML template with dynamic data.
*   `copyAssets()`: Copies assets to the output directory.
*   `generateSitemap()`: Generates `sitemap.xml`.
*   `generateRobotsTxt()`: Generates `robots.txt`.
*   `generateManifest()`: Generates web manifest.
*   `generateGitHubPagesFiles()`: Generates GitHub Pages specific files.
*   `generatePDF()`: Generates a high-quality PDF from the generated HTML.

### GitHub Data Integration Capabilities (within `CVGenerator`):

*   **Real-time Metrics**: Displays actual GitHub commit counts, activity scores, and contribution data
*   **Data Validation**: Comprehensive validation and sanitization of all GitHub metrics
*   **Fallback Mechanisms**: Graceful degradation when GitHub data is unavailable
*   **Credibility Scoring**: Transparency scoring based on data verification and completeness
*   **Skills Enhancement**: Structured data enhanced with GitHub-verified programming languages

### `CVApplication` (`assets/script.js`)

**Role**: The main application controller for the interactive frontend of the CV.

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

## Python Components

### `ConfigManager` (`src/python/config_manager/config_manager.py`)

**Role**: Manages application configurations from `.ini` files and environment variables.

### Key Methods:

*   `__init__(config_file=None)`: Initializes the ConfigManager, optionally loading from a file.
*   `get(section, option, default=None)`: Retrieves a configuration value, prioritizing environment variables.
*   `get_int(section, option, default=None)`: Retrieves an integer configuration value.
*   `get_boolean(section, option, default=None)`: Retrieves a boolean configuration value.

### `DataValidator` (`src/python/data_validation/data_validator.py`)

**Role**: Provides static methods for common data validation tasks.

### Key Methods:

*   `is_not_empty(value, field_name="Value")`: Checks if a value is not None and not empty.
*   `is_type(value, expected_type, field_name="Value")`: Checks if a value is of the expected type.
*   `is_in_range(value, min_val, max_val, field_name="Value")`: Checks if a numeric value is within a specified range.
*   `matches_regex(value, pattern, field_name="Value")`: Checks if a string matches a regex pattern.
*   `is_email(value, field_name="Email")`: Checks if a string is a valid email format.
*   `is_url(value, field_name="URL")`: Checks if a string is a valid URL format.

### Logging Utilities (`src/python/utils/logging_utils.py`)

**Role**: Provides functions for setting up and managing application logging.

### Key Functions:

*   `setup_logger(name, log_file, level=logging.INFO)`: Sets up a logger that writes to a file and the console.

### `MetricsCollector` (`src/python/utils/logging_utils.py`)

**Role**: A simple class to collect and store application metrics.

### Key Methods:

*   `__init__()`: Initializes the MetricsCollector.
*   `collect(name, value)`: Collects a single metric.
*   `get_metrics()`: Returns all collected metrics.
*   `save_metrics(file_path)`: Saves the collected metrics to a JSON file.

### External API Wrappers (`src/python/api_wrappers/external_apis.py`)

**Role**: Provides wrappers for interacting with third-party APIs (e.g., firmographics, funding data).

### Key Classes:

*   `AbstractApiWrapper`: Wrapper for the Abstract API for firmographics data.
    *   `get_company_info(domain)`: Fetches company information by domain.
*   `IntellizenceApiWrapper`: Wrapper for the Intellizence Startup Funding Dataset API.
    *   `get_funding_data(query_params=None)`: Fetches funding data based on query parameters.