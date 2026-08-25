/**
 * Drift guard for data/career-spine.json — the canonical claims export.
 *
 * Checks:
 *   1. schema shape: unique ids, valid statuses, claim text present
 *   2. retired claims stay retired: their banned phrasings must not appear
 *      anywhere in base-cv.json
 *   3. load-bearing verified facts stay consistent between the spine and
 *      base-cv.json (Homes tenure, freelance start, failurefirst metrics)
 *
 * Run with: node career-spine.test.js — exits 0 on success, 1 on any failure.
 */

const fs = require('fs');
const path = require('path');

const DATA = path.resolve(__dirname, '..', 'data');
const spine = JSON.parse(fs.readFileSync(path.join(DATA, 'career-spine.json'), 'utf8'));
const cvRaw = fs.readFileSync(path.join(DATA, 'base-cv.json'), 'utf8');
const cv = JSON.parse(cvRaw);

let failures = 0;
let passes = 0;
function assert(condition, message) {
  if (condition) { passes++; console.log(`  PASS: ${message}`); }
  else { failures++; console.error(`  FAIL: ${message}`); }
}

console.log('\n=== career-spine.json Tests ===\n');

// ── 1. Schema shape ─────────────────────────────────────────────
const VALID_STATUSES = ['verified', 'qualified', 'retired', 'unresolved'];
assert(/^\d+\.\d+\.\d+$/.test(spine.schema_version), 'schema_version is semver');
assert(Array.isArray(spine.claims) && spine.claims.length > 0, 'claims array is non-empty');

const ids = spine.claims.map(c => c.id);
assert(new Set(ids).size === ids.length, 'claim ids are unique');
for (const c of spine.claims) {
  assert(typeof c.id === 'string' && /^[a-z]+(\.[a-z0-9-]+)+$/.test(c.id), `id "${c.id}" is dotted-kebab`);
  assert(VALID_STATUSES.includes(c.status), `"${c.id}" has valid status (${c.status})`);
  assert(typeof c.claim === 'string' && c.claim.length > 10, `"${c.id}" has claim text`);
  if (c.status === 'verified') {
    assert(Array.isArray(c.evidence) && c.evidence.length > 0, `verified "${c.id}" cites evidence`);
  }
}

// ── 2. Retired phrasings stay out of base-cv.json ───────────────
const cvNorm = cvRaw.toLowerCase();
const BANNED = [
  ['ret.45-years', '45 years across the stack'],
  ['ret.pentest', 'penetration testing'],
  ['ret.pentest', 'pentest'],
  ['ret.pentest', 'seven years leading cybersecurity'],
  ['ret.iso27001', 'iso 27001'],
  ['ret.langgraph-stack', 'langgraph'],
  ['ret.langgraph-stack', 'langchain'],
  ['ret.langgraph-stack', 'anthropic sdk'],
];
for (const [id, phrase] of BANNED) {
  assert(!cvNorm.includes(phrase.toLowerCase()), `base-cv.json does not contain retired phrase "${phrase}" (${id})`);
}
const cinematic = ['dead drop', 'covert operation', 'counter-surveillance'];
for (const phrase of cinematic) {
  assert(!cvNorm.includes(phrase), `base-cv.json does not contain unevidenced phrase "${phrase}"`);
}

// ── 3. Verified facts consistent with base-cv.json ──────────────
const homes = cv.experience.find(e => /Homes Tasmania/.test(e.company));
assert(homes && homes.period === 'May 2018 - Feb 2026', 'Homes Tasmania period matches emp.homes.tenure');
const freelance = cv.experience.find(e => /Freelance/.test(e.position));
assert(freelance && /^Jan 2025/.test(freelance.period), 'Freelance period matches emp.freelance.start');

const ffai = spine.claims.find(c => c.id === 'proj.ffai.metrics');
const nums = (ffai.claim.match(/[\d,]+/g) || []).map(n => n.replace(/,/g, ''));
for (const n of ['257', '142068', '346']) {
  assert(nums.includes(n), `proj.ffai.metrics carries canonical figure ${n}`);
}
// any FFAI figure quoted in base-cv must match the spine's generation
assert(!/18,?000\+|120\+ models|\b230 models\b|141,?691/.test(cvRaw), 'base-cv.json carries no superseded failurefirst figures');

console.log(`\n${passes} passed, ${failures} failed\n`);
process.exit(failures ? 1 : 0);
