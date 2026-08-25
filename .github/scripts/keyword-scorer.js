#!/usr/bin/env node
/**
 * CV Keyword Scorer — CI gate for the CV enhancement pipeline
 * Runs after enhance.js as an ATS-coverage report and floor check.
 * Keywords listed here MUST be evidence-backed (see data/career-spine.json):
 * the scorer must never create pressure to claim technologies Adrian does
 * not use. Retired claims (Anthropic SDK, LangChain/LangGraph as current
 * stack, penetration testing, ISO 27001) are deliberately absent.
 *
 * Exit 0: score >= threshold
 * Exit 1: score below threshold (blocks deployment)
 *
 * Usage:
 *   node keyword-scorer.js                    # score current base-cv.json
 *   node keyword-scorer.js --threshold 45     # custom threshold (default 40)
 *   node keyword-scorer.js --report           # detailed report, always exit 0
 *   node keyword-scorer.js --gaps             # output JSON gaps for enhancer
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  {
    name: 'Programming Languages', weight: 1.5,
    keywords: ['Python','R','Java','JavaScript','TypeScript','Scala','SQL','Rust','Go','PowerShell','Bash','BASIC'],
  },
  {
    name: 'ML/AI Frameworks', weight: 2,
    keywords: ['PyTorch','Hugging Face','Pandas','NumPy','MCP','Claude API','Whisper','MusicGen'],
  },
  {
    name: 'Cloud & Infrastructure', weight: 1.5,
    keywords: ['AWS','Azure','GCP','Google Cloud','Docker','Kubernetes','MLflow','Airflow',
      'GitHub Actions','CI/CD','Linux','Windows Server','Cloudflare','FastAPI'],
  },
  {
    name: 'ML/AI Techniques', weight: 2,
    keywords: ['Machine Learning','Deep Learning','Neural Networks','Natural Language Processing','NLP',
      'Computer Vision','Large Language Models','LLM','GPT',
      'Transformer','RAG','Retrieval-Augmented Generation','Prompt Engineering','RLHF'],
  },
  {
    name: 'AI Safety & Evaluation', weight: 2.5,
    keywords: ['AI Safety','Red-teaming','Adversarial Testing','Evaluation Framework',
      'Hallucination Detection','Content Safety','Model Evaluation','Failure Analysis',
      'Risk Assessment','AI Governance','Responsible AI','AI Ethics','Robustness',
      'Interpretability','Bias Detection','Prompt Injection','Jailbreak','RLHF'],
  },
  {
    name: 'Cybersecurity', weight: 2,
    keywords: ['Cybersecurity','Threat Modeling','Network Security','IDAM','ACSC ISM',
      'Essential Eight','Information Security','Security Policy','Operational Security'],
  },
  {
    name: 'MLOps & Deployment', weight: 1.5,
    keywords: ['CI/CD','Model Monitoring','REST API','FastAPI','GitHub Actions','Automation',
      'Agentic','Multi-agent','Orchestration','Docker'],
  },
];

function extractText(cvPath) {
  const cv = JSON.parse(fs.readFileSync(cvPath, 'utf8'));
  const parts = [];
  const walk = obj => {
    if (typeof obj === 'string') { parts.push(obj); return; }
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj && typeof obj === 'object') Object.values(obj).forEach(walk);
  };
  walk(cv);
  return parts.join(' ');
}

function analyse(text) {
  const lower = text.toLowerCase();
  let weightedScore = 0, maxWeighted = 0;
  const results = CATEGORIES.map(cat => {
    const found = cat.keywords.filter(k => lower.includes(k.toLowerCase()));
    const missing = cat.keywords.filter(k => !lower.includes(k.toLowerCase()));
    weightedScore += found.length * cat.weight;
    maxWeighted += cat.keywords.length * cat.weight;
    return { name: cat.name, weight: cat.weight, found, missing, pct: Math.round(found.length / cat.keywords.length * 100) };
  });
  return {
    percentage: Math.round(weightedScore / maxWeighted * 100),
    results,
    topMissing: results
      .filter(c => c.weight >= 2)
      .sort((a,b) => b.weight - a.weight)
      .flatMap(c => c.missing.slice(0,3).map(kw => ({ kw, category: c.name, weight: c.weight }))),
  };
}

const args = process.argv.slice(2);
const threshold = parseInt((args.find((a,i) => args[i-1] === '--threshold') || '40'), 10);
const isReport = args.includes('--report');
const isGaps = args.includes('--gaps');

const cvPath = path.resolve(__dirname, '../../data/base-cv.json');
const text = extractText(cvPath);
const { percentage, results, topMissing } = analyse(text);

if (isGaps) {
  // Output JSON for enhance.js to consume (gaps are advisory: enhance.js
  // instructs the model to cover them "only where truthful")
  console.log(JSON.stringify({ ats_score: percentage, top_missing: topMissing.slice(0,15) }, null, 2));
  process.exit(0);
}

const grade = percentage >= 70 ? '🟢 Excellent' : percentage >= 50 ? '🔵 Good' : percentage >= 35 ? '🟡 Fair' : '🔴 Below threshold';
console.log(`\n[keyword-scorer] ATS Score: ${percentage}% ${grade}`);

if (isReport || process.env.CI) {
  results.forEach(cat => {
    const bar = '█'.repeat(Math.round(cat.pct/5)) + '░'.repeat(20 - Math.round(cat.pct/5));
    console.log(`  ${cat.name.padEnd(26)} [${bar}] ${cat.pct}%`);
    if (cat.missing.length && cat.weight >= 2) {
      console.log(`    Missing: ${cat.missing.slice(0,5).join(', ')}`);
    }
  });
  if (topMissing.length) {
    console.log(`\n  Top missing (high-value): ${topMissing.slice(0,8).map(m=>m.kw).join(', ')}`);
  }
}

if (!isReport && percentage < threshold) {
  console.error(`\n[keyword-scorer] ❌ Score ${percentage}% is below threshold ${threshold}% — build blocked`);
  process.exit(1);
}

console.log(`[keyword-scorer] ✅ Score ${percentage}% meets threshold ${threshold}%\n`);
process.exit(0);
