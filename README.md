# Adrian Wedd - AI-Enhanced CV

A professional CV website that uses GitHub activity analysis and Claude AI to keep content current. Runs on GitHub Actions with scheduled workflows.

**Live site**: [adrianwedd.github.io/cv](https://adrianwedd.github.io/cv)

## How It Works

1. **Activity Tracker** (`activity-tracker.yml`) runs daily, collecting GitHub commit data, language stats, and contribution metrics
2. **CV Enhancement Pipeline** (`cv-enhancement.yml`) runs twice daily, using Claude AI to optimize content and regenerate the website
3. **Validation gate** blocks deployment if the hallucination detector or content guardian finds issues

## Project Structure

```
cv/
├── index.html                    # Main CV webpage
├── watch-me-work.html            # Live activity dashboard
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
│       ├── activity-analyzer.js  # GitHub metrics processor
│       ├── claude-enhancer.js    # AI content enhancement
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

# Run enhancement scripts
cd .github/scripts && npm install
node activity-analyzer.js
node claude-enhancer.js    # requires ANTHROPIC_API_KEY
node cv-generator.js
```

## Configuration

Required GitHub secrets:
- `ANTHROPIC_API_KEY` - Claude AI API access
- `GITHUB_TOKEN` - provided automatically by GitHub Actions

## Content Integrity

The system includes safeguards against AI hallucination:
- **Hallucination detector** validates claims against actual GitHub metrics
- **Content guardian** maintains a registry of verified claims and blocks fabricated ones
- Both run as gates in the CI pipeline - failures block deployment

## License

MIT
