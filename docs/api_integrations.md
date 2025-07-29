# API Integrations

This section details the external API integrations used by the AI-enhanced CV system, including authentication methods, key endpoints, and important considerations for their usage.

## GitHub API

The GitHub API is central to the system's ability to collect real-time activity data and professional metrics. The `activity-analyzer.js` script interacts with this API.

### Authentication

Authentication to the GitHub API is performed using a Personal Access Token (PAT) provided via the `GITHUB_TOKEN` environment variable. This token should have the necessary scopes to read user and repository data.

*   **Environment Variable**: `GITHUB_TOKEN`
*   **Scope Requirements**: Typically `public_repo` or `repo` (for private repositories) and `read:user`.

### Key Endpoints Used

The `GitHubApiClient` in `activity-analyzer.js` makes requests to the following primary endpoints:

*   **`/users/:username`**: Retrieves public profile information for a specified user.
    *   Example: `https://api.github.com/users/adrianwedd`
*   **`/users/:username/repos`**: Fetches a list of public repositories for a user.
    *   Parameters: `per_page=100`, `sort=updated`.
    *   Example: `https://api.github.com/users/adrianwedd/repos?per_page=100&sort=updated`
*   **`/users/:username/events/public`**: Retrieves public activity events for a user.
    *   Parameters: `per_page=100`.
    *   Example: `https://api.github.com/users/adrianwedd/events/public?per_page=30`

### Rate Limiting Considerations

The GitHub API has strict rate limits. The `GitHubApiClient` includes built-in logic to handle rate limiting gracefully:

*   **`x-ratelimit-remaining`**: Tracks the number of requests remaining in the current rate limit window.
*   **`x-ratelimit-reset`**: Indicates the Unix timestamp when the current rate limit window resets.
*   **Automatic Backoff**: The client pauses requests if the remaining limit is low, waiting until the reset time to avoid hitting the limit and incurring errors.

## Claude API

The Claude API is utilized by the `claude-enhancer.js` script to perform AI-powered content optimization and generate strategic insights for the CV.

### Authentication

Authentication to the Claude API is performed using an API key provided via the `ANTHROPIC_API_KEY` environment variable.

*   **Environment Variable**: `ANTHROPIC_API_KEY`

### Key Endpoints Used

The `ClaudeApiClient` in `claude-enhancer.js` primarily interacts with the following endpoint:

*   **`/v1/messages`**: The main endpoint for interacting with Claude models to generate text completions based on a series of messages.
    *   Method: `POST`
    *   Headers: `Content-Type: application/json`, `x-api-key: <API_KEY>`, `anthropic-version: 2023-06-01`.
    *   Body: Contains `model`, `max_tokens`, `temperature`, and `messages` array.

### Token Usage and Cost Management

Interactions with the Claude API consume tokens, which have associated costs. The `ClaudeApiClient` includes mechanisms to track and optimize token usage:

*   **Token Tracking**: `input_tokens`, `output_tokens`, `cache_creation_tokens`, and `cache_read_tokens` are tracked.
*   **Caching**: Responses from identical API requests are cached to reduce redundant API calls and save on token usage. The cache key is content-aware, ensuring that changes in source data invalidate the cache.
*   **AI Budget**: The workflow incorporates an AI budget mechanism (`AI_BUDGET` environment variable) to control the scope of AI enhancement based on available token budget.

### Prompt Engineering Principles

The `claude-enhancer.js` script employs sophisticated prompt engineering to guide the Claude AI in generating high-quality, relevant CV content. Key principles include:

*   **Role-Playing**: Assigning specific roles to the AI (e.g., "professional CV enhancement specialist," "technical skills assessment expert").
*   **Context Provision**: Providing rich context from GitHub activity metrics and existing CV data to inform the AI's responses.
*   **Clear Requirements**: Explicitly defining the desired output format, tone, and content constraints.
*   **Quantifiable Achievements**: Encouraging the AI to incorporate measurable impacts where possible.
*   **Creativity Control**: Utilizing the `CREATIVITY_LEVEL` parameter to adjust the AI's generation style.
