#!/usr/bin/env node
/**
 * Provider-neutral AI client.
 *
 * One function — chat() — with explicit outcome semantics:
 *   SUCCESS  the model returned usable text
 *   SKIPPED  no provider credentials configured (not an error)
 *   FAILED   the provider was called and did not deliver
 *
 * Providers (selected via AI_PROVIDER, or auto-detected from available credentials):
 *   openrouter  OPENROUTER_API_KEY   (CI default; any model id OpenRouter serves)
 *   ollama      OLLAMA_HOST          (local dev; defaults to http://localhost:11434)
 *   gemini      GEMINI_API_KEY       (native Generative Language REST API)
 *
 * No SDKs, no retries beyond one; failures are returned, never thrown or masked.
 */

'use strict';

const DEFAULT_MODELS = {
  openrouter: 'deepseek/deepseek-v4-flash',
  ollama: 'deepseek-v4-flash:cloud',
  gemini: 'gemini-2.5-flash',
};

function detectProvider(env = process.env) {
  if (env.AI_PROVIDER) return env.AI_PROVIDER;
  if (env.OPENROUTER_API_KEY) return 'openrouter';
  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.OLLAMA_HOST) return 'ollama';
  return null;
}

async function post(url, headers, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON error body */ }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {object} opts
 * @param {string} opts.system   system prompt
 * @param {string} opts.prompt   user prompt
 * @param {number} [opts.maxTokens=1200]
 * @param {number} [opts.temperature=0.4]
 * @param {string} [opts.model]  override the provider default
 * @returns {Promise<{status:'SUCCESS'|'SKIPPED'|'FAILED', text:string|null,
 *                    provider:string|null, model:string|null,
 *                    usage:{input:number,output:number}|null, error:string|null}>}
 */
async function chat({ system, prompt, maxTokens = 1200, temperature = 0.4, model } = {}) {
  const provider = detectProvider();
  if (!provider) {
    return { status: 'SKIPPED', text: null, provider: null, model: null, usage: null,
      error: 'no AI provider configured (set OPENROUTER_API_KEY, GEMINI_API_KEY, or OLLAMA_HOST)' };
  }
  const resolvedModel = model || process.env.AI_MODEL || DEFAULT_MODELS[provider];
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 120000;
  const base = { status: 'FAILED', text: null, provider, model: resolvedModel, usage: null, error: null };

  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await post(url, {}, {
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }, timeoutMs);
      if (!res.ok) return { ...base, error: `HTTP ${res.status}: ${res.text.slice(0, 300)}` };
      const text = res.json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? null;
      if (!text) return { ...base, error: `empty response: ${res.text.slice(0, 300)}` };
      const u = res.json.usageMetadata || {};
      return { ...base, status: 'SUCCESS', text,
        usage: { input: u.promptTokenCount || 0, output: u.candidatesTokenCount || 0 } };
    }

    // openrouter and ollama both speak OpenAI-style chat completions
    const url = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : `${(process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '')}/v1/chat/completions`;
    const headers = provider === 'openrouter'
      ? { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
      : {};
    const res = await post(url, headers, {
      model: resolvedModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }, timeoutMs);
    if (!res.ok) return { ...base, error: `HTTP ${res.status}: ${res.text.slice(0, 300)}` };
    if (res.json?.error) return { ...base, error: JSON.stringify(res.json.error).slice(0, 300) };
    const choice = res.json?.choices?.[0];
    const text = choice?.message?.content || null;
    if (!text) return { ...base, error: `empty response (finish: ${choice?.finish_reason}): ${res.text.slice(0, 300)}` };
    const u = res.json.usage || {};
    return { ...base, status: 'SUCCESS', text,
      usage: { input: u.prompt_tokens || 0, output: u.completion_tokens || 0 } };
  } catch (err) {
    return { ...base, error: String(err).slice(0, 300) };
  }
}

module.exports = { chat, detectProvider, DEFAULT_MODELS };
