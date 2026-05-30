export const meta = {
  name: 'repo-qa-and-doc-correctness',
  description: 'High-dimensional QA audit of the CV repo across 9 dimensions, then apply doc corrections based on verified findings',
  phases: [
    { title: 'Audit', detail: 'parallel read-only audit across 9 dimensions, running real lint/test/validate commands' },
    { title: 'DocFix', detail: 'apply doc corrections to disjoint doc file-sets based on verified discrepancies' },
  ],
}

const REPO = '/Users/adrian/repos/cv'

const CONSTRAINTS = `
PROJECT CONSTRAINTS (from CLAUDE.md — these are ground truth for judging correctness):
- Static site: index.html fetches data/base-cv.json and renders via DOM API (NO innerHTML). A pre-commit hook blocks innerHTML.
- assets/script.js is the main CV page JS (DOM methods only: createElement/textContent/appendChild).
- watch-me-work.html is a redirect stub -> adrianwedd.com/activity/ (dashboard migrated away).
- assets/styles.css uses CSS custom properties named --color-*, --radius-*, --spacing-* defined in :root. Gotchas: --radius-sm (not --border-radius-sm), --color-background-card (not --color-card-background).
- CI: two GitHub Actions workflows run Node scripts in .github/scripts/. activity-tracker.yml (20:00 UTC, activity-analyzer.js). cv-enhancement.yml (21:00 UTC, claude-enhancer.js -> cv-generator.js -> deploy). Both share concurrency group 'cv-pipeline'.
- Validation gate: ai-hallucination-detector.js (exits 1 if confidence < 70%) and content-guardian.js --validate block deployment.
- Deployment: GitHub Pages serves main branch root. .nojekyll present. pages-build-deployment showing "failed" is expected/harmless.
- Content integrity: base-cv.json must contain only verifiable claims (no fabricated metrics/certs).
- Link security: all target="_blank" need rel="noopener noreferrer"; window.open needs 'noopener,noreferrer' 3rd arg.
- Env (CI): ANTHROPIC_API_KEY, GITHUB_TOKEN (auto), TIMEZONE=Australia/Tasmania.
- Toolchain present: node v25, npm 11, python 3.14. Repo root: ${REPO}
`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'summary', 'commandsRun', 'issues', 'docDiscrepancies'],
  properties: {
    dimension: { type: 'string' },
    summary: { type: 'string', description: 'high-level health assessment of this dimension' },
    commandsRun: {
      type: 'array',
      description: 'every shell command you ran for ground truth, with a one-line result',
      items: {
        type: 'object', additionalProperties: false,
        required: ['cmd', 'result'],
        properties: { cmd: { type: 'string' }, result: { type: 'string' } },
      },
    },
    issues: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['severity', 'file', 'title', 'detail', 'recommendation'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'string', description: 'line number or range, or "" if N/A' },
          title: { type: 'string' },
          detail: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
    docDiscrepancies: {
      type: 'array',
      description: 'places where documentation states something that contradicts verified reality of the code/config/structure',
      items: {
        type: 'object', additionalProperties: false,
        required: ['docFile', 'claim', 'reality', 'suggestedFix'],
        properties: {
          docFile: { type: 'string', description: 'the doc file making the inaccurate claim (or "" if you only found a code issue)' },
          claim: { type: 'string' },
          reality: { type: 'string', description: 'what the code/config/structure actually is, verified by you' },
          suggestedFix: { type: 'string' },
        },
      },
    },
  },
}

const DIMENSIONS = [
  {
    key: 'frontend',
    label: 'frontend',
    prompt: `Meticulously QA the FRONTEND of this repo at ${REPO}: index.html, assets/script.js, assets/styles.css, watch-me-work.html, manifest.json, robots.txt, sitemap.xml, favicon/icon references.
Check, with evidence:
1. innerHTML usage anywhere in frontend JS (grep for innerHTML, outerHTML, insertAdjacentHTML, document.write) — these are FORBIDDEN. Report each.
2. Every target="_blank" link has rel="noopener noreferrer"; every window.open has 'noopener,noreferrer' 3rd arg.
3. CSS custom property naming: confirm vars used in styles.css/inline match the --color-*/--radius-*/--spacing-* convention and are actually defined in :root. Flag any referenced-but-undefined var or naming-convention violation (e.g. --border-radius-sm).
4. script.js renders sections matching the actual shape of data/base-cv.json — read base-cv.json and verify the keys script.js reads actually exist (flag references to missing keys, and base-cv keys never rendered).
5. watch-me-work.html is truly just a redirect stub to adrianwedd.com/activity/.
6. Broken/relative asset references in index.html (CSS/JS/img paths), manifest.json icon paths, sitemap.xml URLs, robots.txt sanity.
7. Accessibility/correctness quick wins (missing alt, lang attr, duplicate IDs).
Run grep-based commands for hard evidence. Return structured findings.`,
  },
  {
    key: 'node-scripts',
    label: 'node-ci-scripts',
    prompt: `Meticulously QA the NODE CI SCRIPTS at ${REPO}/.github/scripts/ (activity-analyzer.js, claude-enhancer.js, claude-enhancer-v2.js, cv-generator.js, ai-hallucination-detector.js, content-guardian.js, claim-verifier.js, github-data-miner.js, keyword-scorer.js, narrative-generator.js, position-description-ingester.js) and enhancer-modules/*.js.
Do the following with evidence:
1. Run the linter: cd ${REPO}/.github/scripts && npm run lint 2>&1 | tail -40. Report failures/warnings (config is --max-warnings=0).
2. Syntax-check each top-level script: for f in *.js; do node --check "$f"; done — report any that fail.
3. Look for correctness bugs: unhandled promise rejections, swallowed errors (empty catch / catch that only console.logs then continues silently), incorrect async usage, off-by-one, hardcoded paths that will not exist in CI, require() of missing modules.
4. Confirm the validation-gate scripts behave as documented: ai-hallucination-detector.js exits 1 when confidence < 70%; content-guardian.js supports a --validate flag. Verify by reading the code (cite line numbers).
5. Check enhancer-modules are actually imported/used (dead modules?) and claude-enhancer.js vs claude-enhancer-v2.js — which is real, is v2 dead code?
6. Secrets/env handling: which env vars each script requires; any that would crash if unset.
Return structured findings; doc discrepancies go in docDiscrepancies (e.g. script_reference.md describing scripts that do not exist or wrong behavior).`,
  },
  {
    key: 'node-tests',
    label: 'node-tests',
    prompt: `Meticulously QA the NODE TEST SUITE at ${REPO}/.github/scripts/ and ${REPO}/tests/.
With evidence:
1. Run scripts tests: cd ${REPO}/.github/scripts && npm test 2>&1 | tail -60. Report pass/fail per file (activity-analyzer.test.js, claude-enhancer.test.js, cv-generator.test.js).
2. Run the root/tests JSON validation: cd ${REPO}/tests && node validate-json.test.js 2>&1 | tail -40, and from ${REPO}: npm run validate:json 2>&1 | tail -30.
3. Attempt the playwright smoke test dry: cd ${REPO}/tests && npx playwright test smoke.test.js --list 2>&1 | tail -20 (do NOT try to install browsers; just report whether it can list/what it needs).
4. The test-xml-*.js and test-claude-code-integration.sh files in scripts/ — are they wired into the npm test script? If orphaned, note it.
5. Assess coverage gaps: which major scripts (claude-enhancer, ai-hallucination-detector, content-guardian, cv-generator) lack tests.
Report what actually passed/failed (real output), not assumptions. Doc discrepancies (e.g. docs/testing.md describing tests/commands that do not work) go in docDiscrepancies.`,
  },
  {
    key: 'python',
    label: 'python-src',
    prompt: `Meticulously QA the PYTHON codebase at ${REPO}/src/python/ (modules: api_clients, api_wrappers, cloud_storage, config_manager, data_processing, data_validation, decision_making, document_parsing, formatting, nlp, utils, web_scraping, plus top-level web_scraper.py, prompt_builder.py, proxy_manager.py, session_manager.py).
With evidence:
1. Byte-compile everything: cd ${REPO}/src/python && python3 -m compileall -q . 2>&1 | tail -40 — report syntax errors.
2. Discover & run tests: cd ${REPO}/src/python && python3 -m pytest -q 2>&1 | tail -60 (if pytest missing, try python3 -m unittest discover -p 'test_*.py' 2>&1 | tail -60). Report results honestly, including import/collection errors.
3. Check requirements.txt vs actual imports — missing deps, unused deps.
4. Is this Python code actually USED by the CI pipeline / frontend, or is it a separate/experimental subsystem? Determine by grepping workflows and JS for references to src/python. State clearly whether it is wired in or orphaned — this matters for doc accuracy.
5. Note __pycache__/.pyc files committed (should they be gitignored?).
6. Correctness bugs in the modules you can spot-check (bare excepts, mutable defaults, resource leaks).
Doc discrepancies (README.md files in src/python/*, docs/data_models.md, docs/api_integrations.md describing this code) go in docDiscrepancies with verified reality.`,
  },
  {
    key: 'workflows',
    label: 'gh-actions',
    prompt: `Meticulously QA the GITHUB ACTIONS workflows at ${REPO}/.github/workflows/ (activity-tracker.yml, cv-enhancement.yml, dependency-audit.yml).
With evidence:
1. YAML validity: for f in ${REPO}/.github/workflows/*.yml; do python3 -c "import yaml,sys; yaml.safe_load(open(sys.argv[1]))" "$f" && echo "OK $f"; done 2>&1.
2. Verify the documented facts: cron schedules (activity-tracker ~20:00 UTC, cv-enhancement ~21:00 UTC), shared concurrency group named 'cv-pipeline', the script invocation order (claude-enhancer -> cv-generator -> validation gate -> deploy). Cite the exact lines. Flag any drift from CLAUDE.md/docs/workflows.md.
3. Check action versions for deprecation (actions/checkout, setup-node, upload-pages-artifact, deploy-pages, etc.) and pin/SHA hygiene.
4. Secrets referenced (ANTHROPIC_API_KEY etc.) — consistency with documented env. Any referenced secret never set / any step that runs scripts needing env not provided.
5. Permissions blocks (contents/pages/id-token) correctness for Pages deploy; commit-back-to-main steps and whether they could fight the concurrency group.
6. Any steps referencing files/paths that do not exist in the repo.
Doc discrepancies (CLAUDE.md, docs/workflows.md, docs/deployment.md) go in docDiscrepancies with the verified cron/group/order values.`,
  },
  {
    key: 'data',
    label: 'data-integrity',
    prompt: `Meticulously QA the DATA files at ${REPO}/data/ (base-cv.json and all *.json, plus nested dirs activity/, intelligence/, metrics/, narratives/, trends/, ai-cache/).
With evidence:
1. Validate all JSON parse: find ${REPO}/data -name '*.json' -print0 | xargs -0 -I{} node -e "try{JSON.parse(require('fs').readFileSync('{}','utf8'));}catch(e){console.error('FAIL','{}',e.message)}" 2>&1 | grep -i fail || echo "all parse OK".
2. base-cv.json: assess structure/completeness, check for placeholder/template leftovers (e.g. "TODO", "PLACEHOLDER", "Lorem", "example.com", "[INSERT", "{{"), check for obviously fabricated/unverifiable metrics that would violate the content-integrity rule. Cross-check key claims against protected-content.json / content-audit.json / verification-summary.json.
3. Consistency between base-cv.json and what the frontend script.js expects (read script.js key access) — but focus on data side: missing/empty required sections.
4. Stale data: timestamps in activity-summary.json / github-activity.json / verification dates — note if wildly stale vs repo activity.
5. Are large generated data files appropriate to commit, or should some be gitignored?
Doc discrepancies (docs/data_models.md describing the JSON schema) go in docDiscrepancies with the verified actual schema.`,
  },
  {
    key: 'config-tooling',
    label: 'config-tooling',
    prompt: `Meticulously QA BUILD/CONFIG/TOOLING at ${REPO}: all package.json (root, .github/scripts/, tests/) + package-lock alignment, .pre-commit-config.yaml, eslint.config.js, jsdoc.json, mkdocs.yml, .gitignore (currently modified — git diff it), .env files committed, CNAME, .nojekyll.
With evidence:
1. git diff .gitignore — what changed and is it correct?
2. SECURITY CRITICAL: are any .env files tracked in git? Run: cd ${REPO} && git ls-files | grep -E '[.]env$'. If tracked, read them and report any real-looking secrets/keys as severity=critical. Also scan tracked files for committed secrets: git grep -nE 'sk-ant-|ghp_|gho_|AKIA' $(git rev-list --max-count=1 HEAD) 2>/dev/null or simpler grep across tracked files. Report findings.
3. Stray/committed artifacts that should be gitignored: *.log files at root (api_wrappers.log, config_manager.log, etc.), .DS_Store and .pyc (run: cd ${REPO} && git ls-files | grep -E 'DS_Store|[.]pyc$'), node_modules tracked?, coverage/, test-results/, dist/.
4. package.json scripts: do the referenced commands/files exist? engines/node version sanity. Root devDeps vs what scripts assume.
5. .pre-commit-config.yaml: do the configured hooks reference scripts/patterns that exist (the innerHTML blocker)?
6. mkdocs.yml nav: do all referenced doc paths exist? (this is a doc-structure discrepancy source).
7. CNAME vs homepage in package.json vs sitemap.xml domain consistency (cv.adrianwedd.com vs adrianwedd.com).
Report security issues as critical. Doc/config discrepancies go in docDiscrepancies.`,
  },
  {
    key: 'docs-audit',
    label: 'docs-correctness-audit',
    prompt: `You are the DOCUMENTATION CORRECTNESS auditor for ${REPO}. Do NOT edit anything — only audit. Your docDiscrepancies output drives the fix phase, so be exhaustive and precise.
Read these docs and verify every concrete claim against the actual repo (file existence, command correctness, paths, behavior, architecture):
- README.md, CLAUDE.md, AGENTS.md
- docs/index.md, docs/architecture.md, docs/deployment.md, docs/workflows.md, docs/script_reference.md, docs/testing.md, docs/data_models.md, docs/api_integrations.md, docs/contributing.md, docs/prompt_construction.md, docs/gh-cli.md
- src/python/*/README.md, .github/scripts/docs/*.md, prompts/claude/v2.0/README.md
- mkdocs.yml (nav must point to existing files)
For EACH doc, verify: (a) every referenced file/path exists (use ls/test -f), (b) every documented command actually works as written or at least references real scripts, (c) described architecture matches reality (e.g. "watch-me-work.html is a redirect stub" — confirm; activity dashboard migrated to adrianwedd.com), (d) cron times / concurrency group / script order match the workflow YAML, (e) no references to deleted/renamed components, (f) version numbers / counts (e.g. "N scripts") are accurate.
Run real commands (ls, grep, test -f, node --check) to confirm. Put EVERY inaccuracy into docDiscrepancies with docFile, the inaccurate claim (quote it), the verified reality, and a precise suggestedFix. Keep issues[] for doc problems that are not simple factual fixes (e.g. whole sections describing removed features).`,
  },
  {
    key: 'security-git',
    label: 'security-git-hygiene',
    prompt: `Meticulously QA SECURITY & GIT HYGIENE for ${REPO} (complementary to other agents — focus on cross-cutting concerns).
With evidence:
1. Secrets exposure: cd ${REPO} && git ls-files | grep -iE 'env|secret|key|credential|token'. For any tracked .env, inspect content and report real secrets as severity=critical. Search git-tracked files for live key patterns: git grep -nE 'sk-ant-|ghp_|gho_|AKIA|-----BEGIN' 2>/dev/null. Report exactly which files.
2. Dependency vulnerabilities: cd ${REPO}/.github/scripts && npm audit 2>&1 | tail -25 ; and cd ${REPO}/tests && npm audit 2>&1 | tail -15. Summarize high/critical counts (do NOT fix).
3. The dependency-audit.yml workflow — does it actually do what its name implies? Read it.
4. Outbound calls / injection surface in the Node scripts that build prompts from external GitHub data or position descriptions (prompt injection into claude-enhancer / position-description-ingester) — note risk, not exhaustive.
5. .gitignore coverage gaps that let logs/caches/artifacts get committed.
6. Any eval(), child_process exec with interpolated input, or unsafe shell in JS/py scripts: cd ${REPO} && grep -rn --include=*.js --include=*.py -E 'eval[(]|child_process|execSync|exec[(]' .github/scripts src 2>/dev/null | head -40.
Report concisely; security issues clearly severity-rated. Doc discrepancies (e.g. AGENTS.md/CLAUDE.md security claims) in docDiscrepancies.`,
  },
]

// ---- Phase 1: parallel read-only audit ----
phase('Audit')
log(`Fanning out ${DIMENSIONS.length} read-only audit agents across QA dimensions...`)

const audits = (await parallel(
  DIMENSIONS.map(d => () =>
    agent(CONSTRAINTS + '\n\n' + d.prompt, {
      label: `audit:${d.label}`,
      phase: 'Audit',
      schema: FINDINGS_SCHEMA,
    })
  )
)).filter(Boolean)

const allDiscrepancies = audits.flatMap(a =>
  (a.docDiscrepancies || [])
    .filter(x => x && x.docFile && x.suggestedFix)
    .map(x => ({ ...x, fromDimension: a.dimension }))
)
const allIssues = audits.flatMap(a => (a.issues || []).map(i => ({ ...i, dimension: a.dimension })))

log(`Audit complete: ${allIssues.length} issues, ${allDiscrepancies.length} doc discrepancies found. Routing doc fixes...`)

// ---- Phase 2: apply doc corrections in disjoint file-sets (no write conflicts) ----
phase('DocFix')

const DOC_GROUPS = [
  {
    key: 'root',
    label: 'docfix:root-docs',
    owns: 'README.md, CLAUDE.md, AGENTS.md (repo root only), agents/10xDEV.md, agents/GROOMER.md',
  },
  {
    key: 'docs-core',
    label: 'docfix:docs-folder',
    owns: 'everything directly under docs/ EXCEPT docs/research/ docs/plans/ docs/superpowers/ : docs/index.md, docs/architecture.md, docs/deployment.md, docs/workflows.md, docs/script_reference.md, docs/testing.md, docs/data_models.md, docs/api_integrations.md, docs/contributing.md, docs/prompt_construction.md, docs/gh-cli.md, plus mkdocs.yml',
  },
  {
    key: 'sub-readmes',
    label: 'docfix:sub-readmes',
    owns: 'src/python/*/README.md, .github/scripts/docs/*.md, prompts/claude/v2.0/README.md, docs/research/README.md',
  },
]

const discrepancyJson = JSON.stringify(allDiscrepancies, null, 1)

const DOCFIX_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['filesEdited', 'changes', 'skipped', 'notes'],
  properties: {
    filesEdited: { type: 'array', items: { type: 'string' } },
    changes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['file', 'summary'],
        properties: { file: { type: 'string' }, summary: { type: 'string' } },
      },
    },
    skipped: {
      type: 'array', description: 'discrepancies you chose NOT to fix and why',
      items: {
        type: 'object', additionalProperties: false,
        required: ['docFile', 'reason'],
        properties: { docFile: { type: 'string' }, reason: { type: 'string' } },
      },
    },
    notes: { type: 'string' },
  },
}

const docFixResults = (await parallel(
  DOC_GROUPS.map(g => () =>
    agent(
      `You are a documentation-correctness fixer working in ${REPO}. ${CONSTRAINTS}

You OWN exactly these files and may ONLY edit files in this set (do NOT touch any other file — other agents own them; editing outside your set causes conflicts):
${g.owns}

Below is the FULL list of verified documentation discrepancies found by the audit phase (across all docs). Apply fixes ONLY for discrepancies whose docFile falls within YOUR owned set above. For each, before editing: re-verify the discrepancy is real (Read the doc, and confirm the stated reality with a quick command/Read — do NOT trust the report blindly; the audit may occasionally be wrong). Then make a precise, minimal Edit that corrects the inaccuracy while preserving the doc's voice/format. Do not rewrite whole docs. Do not invent new content beyond what's needed for correctness. If a suggested fix is wrong or the claim is actually accurate, skip it and record why.

Also fix any obvious additional factual errors you notice in YOUR owned files while you are in them (broken file paths, wrong commands, stale references), even if not in the list — but verify first.

VERIFIED DISCREPANCIES (JSON):
${discrepancyJson}

Return the structured result of what you edited and what you skipped.`,
      { label: g.label, phase: 'DocFix', schema: DOCFIX_SCHEMA }
    )
  )
)).filter(Boolean)

return {
  auditDimensions: audits.map(a => ({ dimension: a.dimension, summary: a.summary, issueCount: (a.issues || []).length })),
  allIssues,
  docDiscrepancies: allDiscrepancies,
  docFixResults,
}
