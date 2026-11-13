# Proposal run safety contract (issue #399)

`run-proposals.js` owns the proposal subprocess lifecycle. The workflow and
`npm run enhance` use this entry point, not the unsupervised writer.

- Before starting the writer, replace the old proposal artifact with a current
  `FAILED`, `completed: false` receipt, and clear the old review to `SKIPPED`
  with no results. The writer also invalidates these files before reading data
  or calling a provider.
- Each invocation has a unique `run_id`. CI uses `github.run_id` plus
  `github.run_attempt`; local supervision generates a UUID unless
  `CV_PROPOSAL_RUN_ID` is explicitly supplied. Do not reuse IDs for new runs.
- The writer always leaves `completed: false`. Only the supervisor may set it
  true, after observing exit zero and a matching, valid SUCCESS or SKIPPED
  artifact. A timeout, signal, nonzero exit, missing/malformed artifact, or
  mismatched run becomes FAILED, with no applicable sections. Provider failure
  details are retained; a later skip cannot upgrade a failure.
- The supervisor writes measured `status` and `run_id` step outputs. Proposal
  failure returns normally so curated validation and rendering can continue;
  operational failures in the supervisor still fail the step.
- Verification requires the independently supplied `CV_PROPOSAL_RUN_ID`, a
  matching artifact ID, `completed: true`, and SUCCESS. Missing IDs, legacy
  artifacts, incomplete runs, FAILED, and SKIPPED apply zero changes. It clears
  prior review results even on a skipped/invalid run. A timestamp is not proof
  of a completed current run.
- `proposal-review.json` carries its own status and current run ID. SKIPPED
  means no current proposal review occurred, not that old accepted results
  have been re-reviewed. The evidence/content guards are unchanged.

For an explicitly authorised local AI run, give supervision and verification
one fresh `CV_PROPOSAL_RUN_ID`. Alternatively, use the supervisor's printed
`PROPOSAL_RUN_ID` as the expected ID for verification. Running `enhance.js`
directly cannot produce a completed artifact eligible for application.

## Offline verification

From the repository root:

```
npm --prefix .github/scripts test
npm --prefix .github/scripts run lint
npm test
git diff --check
```

The regression seeds a prior SUCCESS proposal and accepted review, then runs
writers that exit early or time out. Before the fix both cases applied one
stale proposal; after the fix both apply zero and leave the fixture CV bytes
unchanged. Additional sandbox tests exercise the real writer with mocked
success, malformed JSON, partial provider failure, failure followed by skip,
a thrown call, and interruption after a successful first section. No-provider
coverage uses the real client with an allowlisted environment and a network
tripwire. Tests check the measured workflow output receipt as well.

Curated-build tests perform real filesystem HTML and ATS-template rendering
from a sandbox copy of the curated CV after FAILED and SKIPPED proposals,
asserting that inline CV data is curated and source bytes are unchanged.
Browser/PDF execution is not required or exercised; existing generator tests
mock PDF calls. No application provider calls, production-data writes,
hosted CI, GitHub writes, or deployment are needed for these checks.

Local results (Node 26.7.0, npm 12.0.2): scripts 32 passed / 0 failed;
ESLint passed with zero warnings; root JSON validation 200 passed / 0 failed;
career-spine checks 120 passed / 0 failed; `git diff --check` passed.
Production `data/`, `index.html`, and `assets/` have no diff. Hosted workflow
execution and real browser/PDF generation remain intentionally untested.
