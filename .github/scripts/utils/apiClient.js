const https = require('https');

/**
 * Shared HTTP request wrapper with retry logic and exponential backoff.
 * This function is designed to be reusable across different API clients.
 * @param {string} url - The URL to make the HTTP request to.
 * @param {object} options - Request options (method, headers, body).
 * @param {number} [maxRetries=3] - Maximum number of retries for the request.
 * @param {number} [retryDelay=1000] - Initial delay in milliseconds before retrying.
 * @returns {Promise<object>} A promise that resolves with the response body, headers, and status code.
 */
async function httpRequest(url, options, maxRetries = 3, retryDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await new Promise((resolve, reject) => {
                const req = https.request(url, options, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({ body, headers: res.headers, statusCode: res.statusCode });
                        } else if (res.statusCode >= 500 || res.statusCode === 429) { // Retry on 5xx or Too Many Requests
                            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                        }
                    });
                });

                req.on('error', reject);
                req.setTimeout(30000, () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });

                if (options.body) {
                    req.write(options.body);
                }
                req.end();
            });
        } catch (error) {
            if (i < maxRetries - 1) {
                const delay = retryDelay * Math.pow(2, i);
                console.warn(`Retrying ${url} in ${delay}ms due to error: ${error.message}`);
                await sleep(delay);
            } else {
                throw error; // Last retry failed
            }
        }
    }
}

/**
 * Sleep utility for pausing execution.
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { httpRequest, sleep };
