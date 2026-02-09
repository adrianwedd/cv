# Repository Guidelines

## Project Structure

- `index.html`: main CV site entrypoint.
- `watch-me-work.html`: live activity dashboard page.
- `assets/`: front-end code and static assets (`script.js`, `styles.css`, `watch-me-work.js`, CSS/images).
- `data/`: runtime content and generated reports (JSON) consumed by the site (for example `data/base-cv.json`).
- `.github/workflows/`: GitHub Actions pipelines (activity tracking + CV enhancement/deploy).
- `.github/scripts/`: Node-based pipeline tooling (analyzers, generators, validators, tests).
- `docs/`: documentation artifacts (may include generated output like `docs/jsdoc_output/`).
- `tests/`: repository-level tests (if present, keep focused on user-visible behavior and safety checks).

## Build, Test, And Development Commands

- `npm run dev`: serve locally via Python on `http://localhost:8000`.
- `npm run serve`: serve locally via `serve`.
- `npm run validate:json`: validate top-level `data/*.json` parses cleanly.
- `npm run scripts:install`: install workflow script deps in `.github/scripts/`.
- `npm run scripts:test`: run `.github/scripts` tests (`node --test`).
- `npm run scripts:lint`: lint `.github/scripts` with ESLint.

## Coding Style & Naming Conventions

- Match existing style in the file you touch (JS in `assets/` is typically 4-space indented; YAML is 2-space).
- Prefer DOM APIs (`createElement`, `textContent`) over HTML string injection. Avoid `innerHTML/outerHTML/insertAdjacentHTML`.
- Keep JSON deterministic: stable key order where practical, 2-space indentation, no trailing commas.
- Use descriptive names: `kebab-case` for files, `camelCase` for JS variables/functions, `PascalCase` for classes.

## Testing Guidelines

- Workflow scripts use Node’s built-in test runner: run via `cd .github/scripts && npm test`.
- Keep tests hermetic: mock network/file system where feasible; assert on outputs and safety gates.
- Name test files `*.test.js` alongside the module under test (as in `.github/scripts/*test.js`).

## Commit & Pull Request Guidelines

- Commits commonly use a short, imperative summary, often with emoji and/or conventional prefixes (examples: `docs: ...`, `feat(...): ...`, `fix: ...`).
- PRs should include: what changed, why, how to test (commands), and links to any issues. Include screenshots for UI/CSS changes.

## Security & Configuration

- Treat `ANTHROPIC_API_KEY` as required for AI enhancement runs; never commit secrets.
- When adding links opened in a new tab, set `rel="noopener noreferrer"` to avoid reverse-tabnabbing.
