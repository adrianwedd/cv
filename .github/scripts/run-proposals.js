#!/usr/bin/env node
'use strict';

// Own the proposal process lifecycle: a writer artifact is not completed until
// the writer exits cleanly. Reset both receipts before starting any subprocess.
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { spawnSync } = require('child_process');

function runProposals({ dataDir = path.resolve(__dirname, '../../data'), runId = process.env.CV_PROPOSAL_RUN_ID || randomUUID(), timeout = 600000 } = {}) {
  const artifact = path.join(dataDir, 'ai-enhancements.json');
  const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
  const failed = { status: 'FAILED', run_id: runId, completed: false, sections: {}, errors: ['proposal process did not complete'] };
  write(artifact, failed);
  write(path.join(dataDir, 'proposal-review.json'), {
    status: 'SKIPPED', run_id: runId, reason: 'current proposals have not been verified', results: [],
  });
  const child = spawnSync(process.execPath, [path.join(__dirname, 'enhance.js')], {
    env: { ...process.env, CV_PROPOSAL_RUN_ID: runId }, timeout, killSignal: 'SIGKILL', stdio: 'inherit',
  });
  let output;
  try { output = JSON.parse(fs.readFileSync(artifact, 'utf8')); } catch { /* invalid writer output */ }
  if (child.status !== 0 || child.error || output?.run_id !== runId ||
      !['SUCCESS', 'SKIPPED'].includes(output?.status) || output?.completed !== false ||
      !output?.sections || typeof output.sections !== 'object' || Array.isArray(output.sections)) {
    const errors = output?.run_id === runId && Array.isArray(output.errors) ? output.errors : [];
    output = { ...failed, errors: [...errors, child.error?.message || `proposal process failed (exit ${child.status}, signal ${child.signal})`] };
    write(artifact, output);
  } else {
    output.completed = true;
    write(artifact, output);
  }
  console.log(`PROPOSAL_RUN_ID=${runId}`);
  console.log(`ENHANCEMENT_STATUS=${output.status}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `status=${output.status}\nrun_id=${runId}\n`);
  return output;
}

// Proposal failure is a measured outcome, not a reason to stop curated builds.
if (require.main === module) runProposals();
module.exports = { runProposals };
