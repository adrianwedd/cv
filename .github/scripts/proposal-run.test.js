'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const original = 'Systems builder who develops reliable software and tests it carefully.';
const replacement = 'Systems builder who develops reliable software and verifies it carefully.';
const runId = 'current-fixture-run';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'proposal-run-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const scripts = path.join(root, '.github', 'scripts');
  const data = path.join(root, 'data');
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(data);
  for (const file of ['enhance.js', 'verify-proposals.js', 'run-proposals.js']) {
    if (fs.existsSync(path.join(__dirname, file))) fs.copyFileSync(path.join(__dirname, file), path.join(scripts, file));
  }
  const base = JSON.stringify({ professional_summary: original, experience: [], projects: [] });
  fs.writeFileSync(path.join(data, 'base-cv.json'), base);
  fs.writeFileSync(path.join(data, 'ai-enhancements.json'), JSON.stringify({
    status: 'SUCCESS', run_id: 'old-run', completed: true, sections: {
      professional_summary: { verdict: 'improved', original, text: replacement, rationale: 'fixture edit' },
    },
  }));
  fs.writeFileSync(path.join(data, 'proposal-review.json'), JSON.stringify({ status: 'SUCCESS', run_id: 'old-run', results: [{ verdict: 'accepted' }] }));
  // Allowlist env only: no inherited application keys, routes or Node preload.
  const env = { PATH: process.env.PATH, CV_PROPOSAL_RUN_ID: runId, GITHUB_OUTPUT: path.join(root, 'github-output') };
  const run = (file, options = {}) => spawnSync(process.execPath, [path.join(scripts, file)], { env, encoding: 'utf8', ...options });
  const read = (file) => JSON.parse(fs.readFileSync(path.join(data, file), 'utf8'));
  return { root, scripts, data, base, run, read };
}

for (const mode of ['early exit', 'timeout']) {
  test(`interrupted writer (${mode}) must not replay prior SUCCESS or review`, (t) => {
    const f = fixture(t);
    fs.writeFileSync(path.join(f.scripts, 'interrupted.js'), mode === 'timeout' ? 'setInterval(() => {}, 1000);' : 'process.exit(1);');
    const writer = f.run('interrupted.js', { timeout: 100 });
    assert.notEqual(writer.status, 0);
    const gate = f.run('verify-proposals.js');
    assert.equal(gate.status, 0, gate.stderr);
    assert.match(gate.stdout, /APPLIED=0/);
    assert.equal(fs.readFileSync(path.join(f.data, 'base-cv.json'), 'utf8'), f.base);
    const review = f.read('proposal-review.json');
    assert.equal(review.run_id, runId);
    assert.equal(review.status, 'SKIPPED');
    assert.deepEqual(review.results, []);
  });
}

function runManaged(f, timeout = 2000) {
  fs.writeFileSync(path.join(f.scripts, 'managed.js'), `require('./run-proposals').runProposals({ timeout: ${timeout} });`);
  return f.run('managed.js');
}

for (const mode of ['early exit', 'timeout', 'success then nonzero exit', 'malformed artifact', 'wrong run']) {
  test(`lifecycle supervisor records FAILED for ${mode}`, (t) => {
    const f = fixture(t);
    const artifact = `const fs = require('fs'); const path = require('path'); const file = path.resolve(__dirname, '../../data/ai-enhancements.json');`;
    const sources = {
      'early exit': 'process.exit(1);',
      timeout: 'setInterval(() => {}, 1000);',
      'success then nonzero exit': `${artifact} fs.writeFileSync(file, JSON.stringify({status:'SUCCESS', run_id:process.env.CV_PROPOSAL_RUN_ID, completed:false, sections:{}})); process.exit(1);`,
      'malformed artifact': `${artifact} fs.writeFileSync(file, '{');`,
      'wrong run': `${artifact} fs.writeFileSync(file, JSON.stringify({status:'SUCCESS', run_id:'old-run', completed:false, sections:{}}));`,
    };
    fs.writeFileSync(path.join(f.scripts, 'enhance.js'), sources[mode]);
    const result = runManaged(f, mode === 'timeout' ? 100 : 2000);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /ENHANCEMENT_STATUS=FAILED/);
    const proposal = f.read('ai-enhancements.json');
    assert.equal(proposal.status, 'FAILED');
    assert.equal(proposal.run_id, runId);
    assert.equal(proposal.completed, false);
    assert.deepEqual(proposal.sections, {});
    assert.deepEqual(f.read('proposal-review.json').results, []);
    assert.match(f.run('verify-proposals.js').stdout, /APPLIED=0/);
    assert.equal(fs.readFileSync(path.join(f.data, 'base-cv.json'), 'utf8'), f.base);
  });
}

for (const mode of ['success', 'no provider', 'malformed output', 'partial failure', 'failure then skip', 'throw', 'interruption']) {
  test(`actual proposal writer with mocked AI: ${mode}`, (t) => {
    const f = fixture(t);
    fs.mkdirSync(path.join(f.scripts, 'ai'));
    fs.writeFileSync(path.join(f.scripts, 'keyword-scorer.js'), "console.log('{}');");
    if (mode === 'no provider') {
      // Guard in the actual writer process, not only its supervisor.
      fs.writeFileSync(path.join(f.scripts, 'ai/client.js'),
        "global.fetch = () => { process.exit(90); };\n" + fs.readFileSync(path.join(__dirname, 'ai/client.js'), 'utf8').replace(/^#![^\n]*\n/, ''));
    } else {
      const success = { status: 'SUCCESS', provider: 'mock', model: 'fixture', usage: { input: 3, output: 4 }, text: JSON.stringify({ verdict: 'improved', text: replacement, rationale: 'fixture edit' }) };
      const failed = { status: 'FAILED', provider: 'mock', model: 'fixture', error: 'fixture provider failure' };
      const skipped = { status: 'SKIPPED', error: 'fixture skip' };
      let results = [success];
      if (mode === 'malformed output') results = [{ ...success, text: 'not JSON' }];
      if (mode === 'partial failure' || mode === 'failure then skip' || mode === 'interruption') {
        const cv = JSON.parse(f.base);
        cv.projects = [{ name: 'Fixture', description: original }];
        f.base = JSON.stringify(cv);
        fs.writeFileSync(path.join(f.data, 'base-cv.json'), f.base);
        results = mode === 'partial failure' ? [success, failed] : [failed, skipped];
      }
      fs.writeFileSync(path.join(f.scripts, 'ai/client.js'), mode === 'throw'
        ? "exports.chat = async () => { throw new Error('mock interrupted call'); };"
        : mode === 'interruption'
          ? `let calls = 0; exports.chat = async () => { if (calls++ === 0) return ${JSON.stringify(success)}; setInterval(() => {}, 1000); return new Promise(() => {}); };`
          : `const results = ${JSON.stringify(results)}; exports.chat = async () => results.shift();`);
    }
    const result = runManaged(f, mode === 'interruption' ? 300 : 2000);
    assert.equal(result.status, 0, result.stderr);
    const proposal = f.read('ai-enhancements.json');
    const expected = mode === 'success' ? 'SUCCESS' : mode === 'no provider' ? 'SKIPPED' : 'FAILED';
    assert.equal(proposal.status, expected);
    assert.equal(proposal.run_id, runId);
    assert.equal(proposal.completed, expected !== 'FAILED');
    assert.equal(fs.readFileSync(path.join(f.root, 'github-output'), 'utf8'), `status=${expected}\nrun_id=${runId}\n`);
    if (mode === 'interruption') assert.match(result.stdout, /professional_summary: improved/);
    assert.equal(fs.readFileSync(path.join(f.data, 'base-cv.json'), 'utf8'), f.base);
    const gate = f.run('verify-proposals.js');
    assert.equal(gate.status, 0, gate.stderr);
    assert.match(gate.stdout, mode === 'success' ? /APPLIED=1/ : /APPLIED=0/);
    const review = f.read('proposal-review.json');
    assert.equal(review.run_id, runId);
    assert.equal(review.status, mode === 'success' ? 'SUCCESS' : 'SKIPPED');
    if (mode === 'success') {
      assert.equal(f.read('base-cv.json').professional_summary, replacement);
      assert.equal(proposal.usage.input, 3);
    } else {
      assert.deepEqual(review.results, []);
      assert.equal(fs.readFileSync(path.join(f.data, 'base-cv.json'), 'utf8'), f.base);
    }
  });
}

for (const mode of ['missing expected run', 'same run incomplete', 'legacy artifact']) {
  test(`verifier fails closed for ${mode}`, (t) => {
    const f = fixture(t);
    const proposal = f.read('ai-enhancements.json');
    proposal.run_id = runId;
    if (mode === 'same run incomplete') proposal.completed = false;
    if (mode === 'legacy artifact') { delete proposal.run_id; delete proposal.completed; }
    fs.writeFileSync(path.join(f.data, 'ai-enhancements.json'), JSON.stringify(proposal));
    const result = mode === 'missing expected run'
      ? f.run('verify-proposals.js', { env: { PATH: process.env.PATH } })
      : f.run('verify-proposals.js');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /APPLIED=0/);
    assert.equal(f.read('proposal-review.json').status, 'SKIPPED');
    assert.deepEqual(f.read('proposal-review.json').results, []);
    assert.equal(fs.readFileSync(path.join(f.data, 'base-cv.json'), 'utf8'), f.base);
  });
}

for (const status of ['SKIPPED', 'FAILED']) {
  test(`curated HTML and ATS render without AI after ${status}`, (t) => {
    const f = fixture(t);
    const repo = path.resolve(__dirname, '../..');
    fs.copyFileSync(path.join(repo, 'index.html'), path.join(f.root, 'index.html'));
    fs.copyFileSync(path.join(__dirname, 'ats-template.html'), path.join(f.scripts, 'ats-template.html'));
    fs.copyFileSync(path.join(repo, 'data/base-cv.json'), path.join(f.data, 'base-cv.json'));
    const curated = fs.readFileSync(path.join(f.data, 'base-cv.json'), 'utf8');
    fs.writeFileSync(path.join(f.data, 'ai-enhancements.json'), JSON.stringify({ status, run_id: runId, completed: status === 'SKIPPED', sections: {} }));
    assert.match(f.run('verify-proposals.js').stdout, /APPLIED=0/);
    fs.writeFileSync(path.join(f.scripts, 'render.js'), `
      const { CVGenerator } = require(${JSON.stringify(path.join(__dirname, 'cv-generator.js'))});
      const fs = require('fs');
      (async () => {
        const generator = new CVGenerator();
        await generator.prepareOutputDirectory();
        await generator.loadDataSources();
        await generator.generateHTML();
        fs.writeFileSync('dist/ats.html', await generator.buildATSHTML());
      })().catch(() => process.exit(1));
    `);
    const render = f.run('render.js', { cwd: f.root });
    assert.equal(render.status, 0, render.stderr);
    const html = fs.readFileSync(path.join(f.root, 'dist/index.html'), 'utf8');
    const inline = html.match(/window\.__CV_DATA__ = (.*);/);
    assert.ok(inline, 'actual renderer must inline curated data');
    assert.equal(JSON.parse(inline[1]).professional_summary, JSON.parse(curated).professional_summary);
    assert.ok(fs.readFileSync(path.join(f.root, 'dist/ats.html'), 'utf8').includes(JSON.parse(curated).personal_info.name));
    assert.equal(fs.readFileSync(path.join(f.data, 'base-cv.json'), 'utf8'), curated);
  });
}
