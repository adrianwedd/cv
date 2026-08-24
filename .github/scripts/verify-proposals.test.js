'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Deterministic harness for the verification gate, using real historical
 * content from this repo's own regression history:
 *  - the 2025-07 AI output that fabricated "40% efficiency" / "99.9% reliability"
 *  - the 2025-07-30 generic-sludge summary
 *  - the 2026-03 human-written summary (known-good peak)
 * A trustworthy gate must reject the first two shapes and accept an honest edit.
 */

const SCRIPT = path.join(__dirname, 'verify-proposals.js');

const HUMAN_PEAK =
  'Systems builder, AI safety researcher, and adversarial thinker with nearly 45 years across the stack. ' +
  'Seven years leading cybersecurity, penetration testing, and IDAM for Tasmania\'s public housing sector; ' +
  'three years of empirical AI red-teaming across 120+ models and 18,000+ adversarial prompts.';

function runGate(sections, cv) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-test-'));
  const dataDir = path.join(dir, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, 'base-cv.json'), JSON.stringify(cv));
  fs.writeFileSync(path.join(dataDir, 'ai-enhancements.json'), JSON.stringify({
    status: 'SUCCESS', generated_at: new Date().toISOString(), sections,
  }));
  // verify-proposals resolves the repo root relative to its own location, so we
  // run a copy of the script inside the sandbox tree.
  const scriptsDir = path.join(dir, '.github', 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(scriptsDir, 'verify-proposals.js'));
  const out = execFileSync('node', [path.join(scriptsDir, 'verify-proposals.js')], { encoding: 'utf8' });
  const review = JSON.parse(fs.readFileSync(path.join(dataDir, 'proposal-review.json'), 'utf8'));
  const cvAfter = JSON.parse(fs.readFileSync(path.join(dataDir, 'base-cv.json'), 'utf8'));
  fs.rmSync(dir, { recursive: true, force: true });
  return { out, review, cvAfter };
}

const baseCV = { professional_summary: HUMAN_PEAK, experience: [], projects: [] };

test('rejects fabricated metrics (July 2025 regression shape)', () => {
  const { review, cvAfter } = runGate({
    professional_summary: {
      verdict: 'improved',
      original: HUMAN_PEAK,
      text: 'Results-focused engineer who delivered 15+ autonomous systems increasing operational efficiency by 40% while maintaining 99.9% system reliability across 45 years in the field.',
      rationale: 'stronger impact statement',
    },
  }, baseCV);
  assert.strictEqual(review.results[0].verdict, 'rejected');
  assert.match(review.results[0].reason, /quantity guard/);
  assert.strictEqual(cvAfter.professional_summary, HUMAN_PEAK, 'previous good version must be retained');
});

test('rejects corporate beige (2025-07-30 sludge shape)', () => {
  const { review } = runGate({
    professional_summary: {
      verdict: 'improved',
      original: HUMAN_PEAK,
      text: 'Innovative AI Engineer with a proven track record of delivering cutting-edge solutions with nearly 45 years across the stack, spanning 120+ models and 18,000+ adversarial prompts.',
      rationale: 'punchier',
    },
  }, baseCV);
  assert.strictEqual(review.results[0].verdict, 'rejected');
  assert.match(review.results[0].reason, /beige guard/);
});

test('rejects AI meta-commentary leakage', () => {
  const { review } = runGate({
    professional_summary: {
      verdict: 'improved',
      original: HUMAN_PEAK,
      text: "Here's an enhanced version: systems builder with nearly 45 years across the stack.",
      rationale: '',
    },
  }, baseCV);
  assert.strictEqual(review.results[0].verdict, 'rejected');
});

test('rejects new credentials not present in the original', () => {
  const { review } = runGate({
    professional_summary: {
      verdict: 'improved',
      original: HUMAN_PEAK,
      text: 'Certified systems builder and AI safety researcher with nearly 45 years across the stack; seven years leading cybersecurity for Tasmania\'s public housing sector.',
      rationale: '',
    },
  }, baseCV);
  assert.strictEqual(review.results[0].verdict, 'rejected');
  assert.match(review.results[0].reason, /credential guard/);
});

test('rejects drastic length changes', () => {
  const { review } = runGate({
    professional_summary: {
      verdict: 'improved', original: HUMAN_PEAK, text: 'Systems builder.', rationale: '',
    },
  }, baseCV);
  assert.strictEqual(review.results[0].verdict, 'rejected');
  assert.match(review.results[0].reason, /size guard/);
});

test('accepts an honest evidence-bounded rewrite and applies it', () => {
  const proposed = HUMAN_PEAK.replace('adversarial thinker', 'adversarial tester');
  const { review, cvAfter } = runGate({
    professional_summary: {
      verdict: 'improved', original: HUMAN_PEAK, text: proposed, rationale: 'small honest edit',
    },
  }, baseCV);
  assert.strictEqual(review.results[0].verdict, 'accepted');
  assert.strictEqual(cvAfter.professional_summary, proposed);
});

test('"unchanged" proposals are not applied and not errors', () => {
  const { out, cvAfter } = runGate({
    professional_summary: {
      verdict: 'unchanged', original: HUMAN_PEAK, text: HUMAN_PEAK, rationale: 'already strong',
    },
  }, baseCV);
  assert.match(out, /APPLIED=0/);
  assert.strictEqual(cvAfter.professional_summary, HUMAN_PEAK);
});

test('non-SUCCESS enhancement status applies nothing', () => {
  const { out } = runGate.length && (() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-test-'));
    const dataDir = path.join(dir, 'data');
    fs.mkdirSync(dataDir);
    fs.writeFileSync(path.join(dataDir, 'base-cv.json'), JSON.stringify(baseCV));
    fs.writeFileSync(path.join(dataDir, 'ai-enhancements.json'), JSON.stringify({ status: 'FAILED', sections: {} }));
    const scriptsDir = path.join(dir, '.github', 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.copyFileSync(SCRIPT, path.join(scriptsDir, 'verify-proposals.js'));
    const output = execFileSync('node', [path.join(scriptsDir, 'verify-proposals.js')], { encoding: 'utf8' });
    fs.rmSync(dir, { recursive: true, force: true });
    return { out: output };
  })();
  assert.match(out, /APPLIED=0/);
});
