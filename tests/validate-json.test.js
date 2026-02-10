/**
 * JSON validation tests for data/base-cv.json
 *
 * Run with: node validate-json.test.js
 * Exits 0 on success, 1 on any failure.
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '..', 'data', 'base-cv.json');

let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    passes++;
    console.log(`  PASS: ${message}`);
  } else {
    failures++;
    console.error(`  FAIL: ${message}`);
  }
}

// ── Load and parse ──────────────────────────────────────────────

console.log('\n=== JSON Validation Tests ===\n');

let data;
try {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  data = JSON.parse(raw);
  passes++;
  console.log('  PASS: base-cv.json is valid JSON');
} catch (err) {
  console.error(`  FAIL: base-cv.json is not valid JSON — ${err.message}`);
  process.exit(1);
}

// ── Schema: required top-level fields ───────────────────────────

console.log('\n--- Top-level schema ---');

const requiredTopLevel = [
  'metadata',
  'personal_info',
  'professional_summary',
  'experience',
  'projects',
  'skills',
  'achievements',
  'education',
  'certifications'
];

for (const field of requiredTopLevel) {
  assert(data[field] !== undefined, `top-level field "${field}" exists`);
}

// ── personal_info required fields ───────────────────────────────

console.log('\n--- personal_info ---');

const requiredPersonal = ['name', 'title', 'location', 'email', 'github', 'linkedin'];
for (const field of requiredPersonal) {
  assert(
    data.personal_info && data.personal_info[field],
    `personal_info.${field} exists and is non-empty`
  );
}

// ── Experience entries ──────────────────────────────────────────

console.log('\n--- experience entries ---');

assert(Array.isArray(data.experience) && data.experience.length > 0, 'experience is a non-empty array');

for (let i = 0; i < (data.experience || []).length; i++) {
  const exp = data.experience[i];
  const label = `experience[${i}] (${exp.company || 'unknown'})`;
  assert(typeof exp.position === 'string' && exp.position.length > 0, `${label} has position`);
  assert(typeof exp.company === 'string' && exp.company.length > 0, `${label} has company`);
  assert(typeof exp.period === 'string' && exp.period.length > 0, `${label} has period`);
  assert(Array.isArray(exp.achievements) && exp.achievements.length > 0, `${label} has achievements array`);
}

// ── Project entries ─────────────────────────────────────────────

console.log('\n--- project entries ---');

assert(Array.isArray(data.projects) && data.projects.length > 0, 'projects is a non-empty array');

for (let i = 0; i < (data.projects || []).length; i++) {
  const proj = data.projects[i];
  const label = `projects[${i}] (${proj.name || 'unknown'})`;
  assert(typeof proj.name === 'string' && proj.name.length > 0, `${label} has name`);
  assert(typeof proj.description === 'string' && proj.description.length > 0, `${label} has description`);
  assert(Array.isArray(proj.technologies) && proj.technologies.length > 0, `${label} has technologies array`);
  assert(
    typeof proj.github === 'string' && /^https:\/\//.test(proj.github),
    `${label} has valid github URL`
  );
}

// ── Skill entries ───────────────────────────────────────────────

console.log('\n--- skill entries ---');

assert(Array.isArray(data.skills) && data.skills.length > 0, 'skills is a non-empty array');

const validTiers = ['Primary', 'Secondary'];
for (let i = 0; i < (data.skills || []).length; i++) {
  const skill = data.skills[i];
  const label = `skills[${i}] (${skill.name || 'unknown'})`;
  assert(typeof skill.name === 'string' && skill.name.length > 0, `${label} has name`);
  assert(typeof skill.category === 'string' && skill.category.length > 0, `${label} has category`);
  assert(validTiers.includes(skill.tier), `${label} tier is Primary or Secondary (got "${skill.tier}")`);
}

// ── No innerHTML in string values ───────────────────────────────

console.log('\n--- security checks ---');

function checkForInnerHTML(obj, path) {
  if (typeof obj === 'string') {
    if (/innerHTML/i.test(obj)) {
      return path;
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = checkForInnerHTML(obj[i], `${path}[${i}]`);
      if (result) return result;
    }
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const result = checkForInnerHTML(obj[key], `${path}.${key}`);
      if (result) return result;
    }
  }
  return null;
}

const innerHTMLFound = checkForInnerHTML(data, 'root');
assert(!innerHTMLFound, `no innerHTML patterns in string values${innerHTMLFound ? ` (found at ${innerHTMLFound})` : ''}`);

// ── All URLs are valid format ───────────────────────────────────

console.log('\n--- URL validation ---');

function findURLs(obj, path, results) {
  if (typeof obj === 'string' && /^https?:\/\//.test(obj)) {
    results.push({ url: obj, path });
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      findURLs(obj[i], `${path}[${i}]`, results);
    }
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      findURLs(obj[key], `${path}.${key}`, results);
    }
  }
}

const urls = [];
findURLs(data, 'root', urls);
for (const { url, path: urlPath } of urls) {
  try {
    new URL(url);
    assert(url.startsWith('https://'), `URL at ${urlPath} uses https (${url})`);
  } catch {
    assert(false, `URL at ${urlPath} is valid format (${url})`);
  }
}

// ── No hallucination patterns ───────────────────────────────────

console.log('\n--- hallucination detection ---');

const hallucinationPatterns = [
  'world-class',
  'industry-leading',
  'unparalleled',
  'AI Innovation Excellence Award',
  'revolutionary',
  'groundbreaking',
  'best-in-class',
  'cutting-edge',
  'state-of-the-art',
  'unrivaled'
];

const fullText = JSON.stringify(data).toLowerCase();
for (const pattern of hallucinationPatterns) {
  assert(
    !fullText.includes(pattern.toLowerCase()),
    `no hallucination pattern: "${pattern}"`
  );
}

// ── Experience dates not in the future ──────────────────────────

console.log('\n--- date validation ---');

const currentYear = new Date().getFullYear();
for (let i = 0; i < (data.experience || []).length; i++) {
  const exp = data.experience[i];
  // Extract start year from period like "2018 - Present"
  const yearMatch = exp.period && exp.period.match(/(\d{4})/);
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1], 10);
    assert(startYear <= currentYear, `experience[${i}] start year ${startYear} is not in the future`);
  }
}

// ── Professional summary checks ─────────────────────────────────

console.log('\n--- professional summary ---');

const summary = data.professional_summary;
assert(typeof summary === 'string' && summary.length > 0, 'professional summary is non-empty');
assert(typeof summary === 'string' && summary.length < 2000, `professional summary under 2000 chars (got ${summary ? summary.length : 0})`);

// ── Results ─────────────────────────────────────────────────────

console.log(`\n=== Results: ${passes} passed, ${failures} failed ===\n`);
process.exit(failures > 0 ? 1 : 0);
