#!/usr/bin/env node
/**
 * Evidence-bounded CV enhancement — VERIFICATION + APPLY stage.
 *
 * Reads the proposals in data/ai-enhancements.json, rejects anything the
 * evidence does not support or that reads worse than what we have, and applies
 * only the surviving proposals to data/base-cv.json. The previous version of a
 * section always wins over a rejected rewrite.
 *
 * Checks per proposal:
 *   1. quantity guard  — every number/percentage/quantifier in the proposed text
 *      must already appear in the original section or the evidence corpus
 *   2. credential guard — no new certifications/degrees/awards/titles
 *   3. beige guard      — corporate-sludge and AI-meta phrases are rejected
 *   4. size guard       — length must stay within 0.4×–1.7× of the original
 *
 * Writes data/proposal-review.json with per-proposal verdicts, applies accepted
 * changes, and prints APPLIED=<n>. Exits 1 only on operational failure (missing
 * files) — rejecting every proposal is a healthy outcome, not an error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(REPO_ROOT, 'data');

const BEIGE_PATTERNS = [
  /results?-driven/i, /proven track record/i, /cutting[- ]edge/i, /transformative/i,
  /push(?:ing|es)? the boundaries/i, /operational excellence/i, /synerg/i,
  /world-class/i, /best-in-class/i, /leverag(?:e|ing) (?:cutting|deep|extensive)/i,
  /passionate about/i, /dynamic professional/i, /seasoned (?:expert|professional|veteran)/i,
  /\*\*Enhanced/i, /here'?s (?:an?|the) (?:enhanced|improved|revised)/i,
  /this (?:enhancement|version|rewrite)/i, /^\s*(?:enhanced|improved) (?:summary|version)\s*:/im,
];

const CREDENTIAL_PATTERNS = [
  /certif(?:ied|ication)/i, /\b(?:PhD|MBA|BSc|MSc|B\.?E\.?|M\.?E\.?)\b/, /accredit/i,
  /award(?:ed|-winning)?/i, /\bpatent/i, /\bfellow(?:ship)?\b/i, /published in\b/i,
];

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

/** Numbers that carry a claim: percentages, counts with +, $ amounts, plain multi-digit figures, "N years". */
function claimTokens(text) {
  const tokens = new Set();
  const re = /\$?\d[\d,.]*\s*(?:%|\+|x\b|years?\b|months?\b|models?\b|prompts?\b|repos(?:itories)?\b|systems?\b|clients?\b|sites?\b|issues?\b)?/gi;
  for (const m of text.matchAll(re)) {
    const tok = normalise(m[0].trim()).replace(/\.$/, '');
    // ignore bare small numbers (list positions, "one of 3") but keep anything quantified
    if (/^\d{1,2}$/.test(tok)) continue;
    tokens.add(tok);
  }
  return tokens;
}

function normalise(text) {
  return text.toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
}

function verifyProposal(id, proposal, corpus) {
  const { original, text } = proposal;
  if (proposal.verdict !== 'improved') return { id, verdict: 'not-applicable' };
  if (typeof text !== 'string' || !text.trim()) return { id, verdict: 'rejected', reason: 'empty proposal' };

  const ratio = text.length / Math.max(original.length, 1);
  if (ratio < 0.4 || ratio > 1.7) {
    return { id, verdict: 'rejected', reason: `size guard: ${Math.round(ratio * 100)}% of original length` };
  }
  for (const p of BEIGE_PATTERNS) {
    if (p.test(text)) return { id, verdict: 'rejected', reason: `beige guard: matches ${p}` };
  }
  const originalNorm = normalise(original);
  const corpusNorm = corpus; // pre-normalised
  for (const p of CREDENTIAL_PATTERNS) {
    if (p.test(text) && !p.test(original)) {
      return { id, verdict: 'rejected', reason: `credential guard: introduces ${p}` };
    }
  }
  for (const tok of claimTokens(text)) {
    if (!originalNorm.includes(tok) && !corpusNorm.includes(tok)) {
      return { id, verdict: 'rejected', reason: `quantity guard: "${tok}" not found in original or evidence` };
    }
  }
  return { id, verdict: 'accepted' };
}

function applyToCV(cv, id, text) {
  const m = id.match(/^(professional_summary)$|^(experience|projects)\[(\d+)\]\.description$/);
  if (!m) throw new Error(`unknown section id: ${id}`);
  if (m[1]) { cv.professional_summary = text; return; }
  cv[m[2]][Number(m[3])].description = text;
}

function main() {
  const cv = readJSON(path.join(DATA_DIR, 'base-cv.json'));
  const proposals = readJSON(path.join(DATA_DIR, 'ai-enhancements.json'));
  if (!cv || !proposals) {
    console.error('FATAL: base-cv.json or ai-enhancements.json missing/invalid');
    process.exit(1);
  }
  if (proposals.status !== 'SUCCESS') {
    console.log(`Nothing to verify: enhancement status is ${proposals.status}`);
    console.log('APPLIED=0');
    return;
  }

  // Evidence corpus: the whole curated CV plus everything under data/ the
  // pipeline collects (activity, narratives, intelligence).
  const corpusParts = [JSON.stringify(cv)];
  for (const f of ['activity-summary.json', 'github-activity.json']) {
    const j = readJSON(path.join(DATA_DIR, f));
    if (j) corpusParts.push(JSON.stringify(j));
  }
  for (const dir of ['narratives', 'intelligence']) {
    try {
      for (const f of fs.readdirSync(path.join(DATA_DIR, dir))) {
        corpusParts.push(fs.readFileSync(path.join(DATA_DIR, dir, f), 'utf8'));
      }
    } catch { /* optional */ }
  }
  const corpus = normalise(corpusParts.join(' '));

  const review = { reviewed_at: new Date().toISOString(), source_generated_at: proposals.generated_at, results: [] };
  let applied = 0;
  for (const [id, proposal] of Object.entries(proposals.sections)) {
    const result = verifyProposal(id, proposal, corpus);
    review.results.push({ ...result, rationale: proposal.rationale });
    if (result.verdict === 'accepted') {
      applyToCV(cv, id, proposal.text.trim());
      applied += 1;
      console.log(`✓ applied  ${id}`);
    } else if (result.verdict === 'rejected') {
      console.log(`✗ rejected ${id} — ${result.reason}`);
    }
  }

  fs.writeFileSync(path.join(DATA_DIR, 'proposal-review.json'), JSON.stringify(review, null, 2) + '\n');
  if (applied > 0) {
    fs.writeFileSync(path.join(DATA_DIR, 'base-cv.json'), JSON.stringify(cv, null, 2) + '\n');
  }
  console.log(`APPLIED=${applied}`);
}

main();
