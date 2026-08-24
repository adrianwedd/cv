#!/usr/bin/env node
/**
 * Evidence-bounded CV enhancement — PROPOSAL stage.
 *
 * Reads the curated CV plus collected evidence (activity summary, mined
 * narratives, ATS keyword gaps) and asks the configured AI provider to propose
 * better wording for a fixed set of text fields. Proposals are written to
 * data/ai-enhancements.json for the verification stage — this script NEVER
 * modifies base-cv.json and its output is never rendered directly.
 *
 * Outcome semantics (also written to the output file and printed as the last line):
 *   SUCCESS  every attempted section produced a proposal or an explicit "unchanged"
 *   SKIPPED  no AI provider configured — output file records the skip
 *   FAILED   one or more provider calls failed; exit code 1
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chat } = require('./ai/client');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(REPO_ROOT, 'data');

const SYSTEM_PROMPT = `You are an editorial assistant improving one section of a real person's CV. Hard rules:
- NEVER invent achievements, metrics, numbers, scale, credentials, leadership claims, technologies, or dates that are not present in the section or the supplied evidence.
- The existing text is human-written and often deliberately voiced. If it is already strong, return verdict "unchanged" — this is the expected outcome for good text.
- Only propose "improved" when framing, clarity, or relevance genuinely improves while preserving the author's voice. Corporate beige ("results-driven", "proven track record", "cutting-edge") is a regression, not an improvement.
- No meta-commentary inside the proposed text.
Respond with ONLY a JSON object: {"verdict":"improved"|"unchanged","text":"<the full replacement text>","rationale":"<one sentence>"}`;

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function latestIn(dir) {
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
    return files.length ? readJSON(path.join(dir, files[files.length - 1])) : null;
  } catch { return null; }
}

function keywordGaps() {
  try {
    const out = execFileSync('node', [path.join(__dirname, 'keyword-scorer.js'), '--gaps'],
      { cwd: REPO_ROOT, encoding: 'utf8', timeout: 60000 });
    return JSON.parse(out);
  } catch { return null; }
}

function collectTargets(cv) {
  const targets = [{ id: 'professional_summary', label: 'Professional summary', text: cv.professional_summary }];
  (cv.experience || []).forEach((e, i) => {
    if (e.description) targets.push({ id: `experience[${i}].description`, label: `Experience: ${e.position} @ ${e.company} (${e.period})`, text: e.description });
  });
  (cv.projects || []).forEach((p, i) => {
    if (p.description) targets.push({ id: `projects[${i}].description`, label: `Project: ${p.name}`, text: p.description });
  });
  return targets;
}

function parseProposal(raw) {
  const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim();
  const parsed = JSON.parse(stripped);
  if (!['improved', 'unchanged'].includes(parsed.verdict) || typeof parsed.text !== 'string') {
    throw new Error(`malformed proposal: ${stripped.slice(0, 120)}`);
  }
  return parsed;
}

async function main() {
  const cv = readJSON(path.join(DATA_DIR, 'base-cv.json'));
  if (!cv) {
    console.error('FATAL: data/base-cv.json missing or invalid');
    process.exit(1);
  }
  const activity = readJSON(path.join(DATA_DIR, 'activity-summary.json'));
  const narratives = latestIn(path.join(DATA_DIR, 'narratives'));
  const gaps = keywordGaps();

  const evidence = [
    activity ? `GitHub activity (last ${activity.lookback_period_days} days): ${JSON.stringify(activity.summary)}` : null,
    narratives ? `Mined professional narratives: ${JSON.stringify(narratives).slice(0, 4000)}` : null,
    gaps ? `ATS keyword gaps worth covering only where truthful: ${JSON.stringify(gaps).slice(0, 1500)}` : null,
  ].filter(Boolean).join('\n\n') || 'No additional evidence collected this run.';

  const targets = collectTargets(cv);
  const output = {
    status: 'SUCCESS',
    generated_at: new Date().toISOString(),
    provider: null,
    model: null,
    usage: { input: 0, output: 0 },
    sections: {},
    errors: [],
  };

  for (const t of targets) {
    const res = await chat({
      system: SYSTEM_PROMPT,
      prompt: `Evidence:\n${evidence}\n\nCV section — ${t.label}:\n"""\n${t.text}\n"""\n\nPropose the best version of this section's text.`,
      maxTokens: 1000,
    });
    output.provider = res.provider;
    output.model = res.model;

    if (res.status === 'SKIPPED') {
      output.status = 'SKIPPED';
      output.errors.push(res.error);
      break;
    }
    if (res.status === 'FAILED') {
      output.status = 'FAILED';
      output.errors.push(`${t.id}: ${res.error}`);
      console.error(`✗ ${t.id}: ${res.error}`);
      continue;
    }
    output.usage.input += res.usage.input;
    output.usage.output += res.usage.output;
    try {
      const proposal = parseProposal(res.text);
      output.sections[t.id] = { ...proposal, original: t.text };
      console.log(`${proposal.verdict === 'improved' ? '±' : '='} ${t.id}: ${proposal.verdict}`);
    } catch (err) {
      output.status = 'FAILED';
      output.errors.push(`${t.id}: ${err.message}`);
      console.error(`✗ ${t.id}: ${err.message}`);
    }
  }

  fs.writeFileSync(path.join(DATA_DIR, 'ai-enhancements.json'), JSON.stringify(output, null, 2) + '\n');
  const improved = Object.values(output.sections).filter((s) => s.verdict === 'improved').length;
  console.log(`\nSections: ${Object.keys(output.sections).length}/${targets.length} assessed, ${improved} improvement(s) proposed`);
  console.log(`Tokens: ${output.usage.input} in / ${output.usage.output} out (${output.provider ?? 'none'}:${output.model ?? '-'})`);
  console.log(`ENHANCEMENT_STATUS=${output.status}`);
  process.exit(output.status === 'FAILED' ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  console.log('ENHANCEMENT_STATUS=FAILED');
  process.exit(1);
});
