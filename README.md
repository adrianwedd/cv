# Adrian Wedd - AI-Enhanced CV

A professional CV website driven by real GitHub activity evidence, with AI-proposed content improvements that are verified before they can touch the CV. Runs on GitHub Actions and deploys to GitHub Pages.

**Live site**: [cv.adrianwedd.com](https://cv.adrianwedd.com)

## How It Works

1. **Activity Tracker** (`activity-tracker.yml`) runs daily, collecting cross-repo GitHub activity evidence via `activity-collector.js`. It commits only on material change, and then triggers the enhancement pipeline via `repository_dispatch`
2. **CV Enhancement Pipeline** (`cv-enhancement.yml`) runs weekly (Mondays 21:00 UTC), on evidence dispatch, or manually. Stages: ingest → propose (`enhance.js` writes proposals to `data/ai-enhancements.json`) → verify (`verify-proposals.js` applies only evidence-supported proposals to `base-cv.json`) → validate → render (`cv-generator.js`) → publish
3. **Validation gate** blocks deployment if the hallucination detector or content guardian finds issues

## Project Structure

```
cv/
├── index.html                    # Main CV webpage
├── watch-me-work.html            # Redirect stub → adrianwedd.com/activity/ (dashboard migrated)
├── assets/
│   ├── styles.css                # CSS with dark/light themes
│   └── script.js                 # Interactive features
├── data/
│   └── base-cv.json              # Core CV data
├── .github/
│   ├── workflows/
│   │   ├── cv-enhancement.yml    # AI enhancement pipeline
│   │   └── activity-tracker.yml  # GitHub activity collection
│   └── scripts/
│       ├── activity-collector.js # Cross-repo GitHub evidence collection
│       ├── ai/client.js          # Provider-neutral AI client (openrouter/ollama/gemini)
│       ├── enhance.js            # AI proposal stage
│       ├── verify-proposals.js   # Proposal verification + apply stage
│       ├── cv-generator.js       # Website generator
│       ├── ai-hallucination-detector.js  # Content validation
│       └── content-guardian.js   # Prevents fabricated claims
└── package.json
```

## Local Development

```bash
# Serve locally
python3 -m http.server 8000
# or
npx serve .

# Validate JSON data
npm run validate:json

# Run pipeline scripts
cd .github/scripts && npm install
node activity-collector.js # requires GITHUB_TOKEN
node enhance.js            # requires OPENROUTER_API_KEY (or GEMINI_API_KEY / OLLAMA_HOST)
node verify-proposals.js
node cv-generator.js
```

## Configuration

GitHub secrets:
- `OPENROUTER_API_KEY` - default AI provider (optional: without it the enhancement stage is skipped and the site still builds from curated content)
- `GEMINI_API_KEY` - alternate AI provider
- `PERSONAL_ACCESS_TOKEN` - lets the activity tracker's `repository_dispatch` start the enhancement workflow
- `GITHUB_TOKEN` - provided automatically by GitHub Actions

## Content Integrity

The system includes safeguards against AI hallucination:
- **Proposal verification** (`verify-proposals.js`) rejects AI proposals with unsupported numbers, new credentials, corporate filler, or drastic length changes before they can reach `base-cv.json`
- **Hallucination detector** validates claims against actual GitHub metrics
- **Content guardian** maintains a registry of verified claims and blocks fabricated ones
- The detector and guardian run as gates in the CI pipeline - failures block deployment

## License

MIT
