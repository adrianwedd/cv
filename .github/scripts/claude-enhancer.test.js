import { test } from 'node:test';
import assert from 'assert';
import { CVContentEnhancer, ClaudeApiClient, CONFIG } from './claude-enhancer.js';
import crypto from 'crypto';

test('ClaudeApiClient - should generate different cache keys for different source content', () => {
    const client = new ClaudeApiClient('mock_api_key');
    
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

test('ClaudeApiClient - should generate different cache keys for different messages', () => {
    const client = new ClaudeApiClient('mock_api_key');
    
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

test('CVContentEnhancer - should enhance professional summary', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock_key';
    const enhancer = new CVContentEnhancer();
    
    // Mock the makeRequest to avoid actual API calls during testing
    enhancer.client.makeRequest = async (messages, options, sourceContent) => {
        return { content: [{ text: `Enhanced: ${messages[0].content}` }], usage: { input_tokens: 10, output_tokens: 5 } };
    };
    enhancer.loadCurrentCVData = async () => ({ professional_summary: "Original summary." });
    enhancer.loadActivityMetrics = async () => ({});

    const result = await enhancer.enhanceProfessionalSummary({}, {});
    assert(result.enhanced, 'Should have enhanced content');
    assert.strictEqual(typeof result.enhanced, 'string');
    assert.strictEqual(result.enhancement_applied, true);
    
    delete process.env.ANTHROPIC_API_KEY;
});