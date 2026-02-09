const { test, suite } = require('node:test');
const assert = require('assert');
const { CVContentEnhancer, ClaudeApiClient } = require('./claude-enhancer.js');

suite('ClaudeApiClient', () => {
    let client;

    test.beforeEach(() => {
        client = new ClaudeApiClient('mock_api_key');
    });

    test('should generate different cache keys for different source content', () => {
        const messages = [{ role: 'user', content: 'test prompt' }];
        const temperature = 0.5;
        const maxTokens = 100;

        const requestPayload = { messages, temperature, maxTokens };

        const key1 = client.generateCacheKey(requestPayload, 'source content 1');
        const key2 = client.generateCacheKey(requestPayload, 'source content 2');
        const key3 = client.generateCacheKey(requestPayload, 'source content 1');

        assert.notStrictEqual(key1, key2, 'Keys should be different for different source content');
        assert.strictEqual(key1, key3, 'Keys should be the same for identical source content');
    });

    test('should generate different cache keys for different messages', () => {
        const temperature = 0.5;
        const maxTokens = 100;
        const sourceContent = 'some source';

        const messages1 = [{ role: 'user', content: 'prompt 1' }];
        const messages2 = [{ role: 'user', content: 'prompt 2' }];

        const requestPayload1 = { messages: messages1, temperature, maxTokens };
        const requestPayload2 = { messages: messages2, temperature, maxTokens };

        const key1 = client.generateCacheKey(requestPayload1, sourceContent);
        const key2 = client.generateCacheKey(requestPayload2, sourceContent);

        assert.notStrictEqual(key1, key2, 'Keys should be different for different messages');
    });
});

suite('CVContentEnhancer', () => {
    let enhancer;

    test.beforeEach(() => {
        process.env.ANTHROPIC_API_KEY = 'mock_key';
        enhancer = new CVContentEnhancer();
        // Disable XML prompts so the legacy path is used (avoids xmlIntegrator dependency)
        enhancer.useXMLPrompts = false;
        // Mock the makeRequest to return valid JSON matching expected response shape
        enhancer.client.makeRequest = async (_messages, _options, _sourceContent) => {
            const mockResponse = JSON.stringify({
                enhanced_summary: "Enhanced professional summary for testing.",
                strategic_improvements: { positioning_shift: "test" },
                ats_keywords: ["testing"],
                confidence_score: 0.9
            });
            return { content: [{ text: mockResponse }], usage: { input_tokens: 10, output_tokens: 5 } };
        };
        enhancer.loadCurrentCVData = async () => ({ professional_summary: "Original summary." });
        enhancer.loadActivityMetrics = async () => ({});
    });

    test.afterEach(() => {
        delete process.env.ANTHROPIC_API_KEY;
    });

    test('should enhance professional summary', async () => {
        const result = await enhancer.enhanceProfessionalSummary({}, {});
        assert.strictEqual(typeof result.enhanced, 'string');
        assert.ok(result.enhanced.length > 0, 'Enhanced summary should not be empty');
        assert.strictEqual(result.enhancement_applied, true);
    });
});
