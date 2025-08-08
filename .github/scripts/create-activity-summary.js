#!/usr/bin/env node

/**
 * Create Activity Summary - Generate standardized activity summary from latest data
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

async function createActivitySummary() {
  console.log('📊 Creating Activity Summary from Latest Data\n');

  const activityDir = path.join(ROOT_DIR, 'data', 'activity');
  
  // Find the most recent activity file
  const files = await fs.readdir(activityDir);
  const activityFiles = files
    .filter(f => f.startsWith('github-activity') && f.endsWith('.json') && !f.includes('original'))
    .sort()
    .reverse();

  if (activityFiles.length === 0) {
    console.log('No activity files found');
    return;
  }

  // Read the most recent activity file
  const latestFile = path.join(activityDir, activityFiles[0]);
  const activityData = JSON.parse(await fs.readFile(latestFile, 'utf-8'));

  // Create standardized summary
  const summary = {
    timestamp: new Date().toISOString(),
    analysis_period: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    },
    repositories: [],
    github_stats: {
      total_commits: 0,
      total_repos: 0,
      total_stars: 0,
      languages: {}
    }
  };

  // Extract repository data
  if (activityData.activity_overview?.repositories) {
    const repos = activityData.activity_overview.repositories;
    
    // Handle both array and object structures
    const repoList = Array.isArray(repos) ? repos : 
                     repos.recent ? repos.recent : 
                     Object.values(repos).flat();

    if (Array.isArray(repoList)) {
      summary.repositories = repoList.slice(0, 10).map(repo => ({
        name: repo.name || repo.repo || 'Unknown',
        commits: repo.commits || repo.commit_count || 0,
        language: repo.language || repo.primary_language || 'Unknown',
        stars: repo.stars || 0,
        forks: repo.forks || 0
      }));
    }
  }

  // Extract GitHub stats
  if (activityData.professional_metrics?.github) {
    const metrics = activityData.professional_metrics.github;
    summary.github_stats.total_commits = metrics.total_commits || metrics.commits_30d || 0;
    summary.github_stats.total_repos = metrics.active_repos || metrics.total_repos || 0;
    summary.github_stats.total_stars = metrics.total_stars || 0;
  }

  // Extract language distribution
  if (activityData.skills_analysis?.technical?.languages) {
    const langs = activityData.skills_analysis.technical.languages;
    if (Array.isArray(langs)) {
      langs.forEach(lang => {
        summary.github_stats.languages[lang] = true;
      });
    } else if (typeof langs === 'object') {
      summary.github_stats.languages = langs;
    }
  }

  // Ensure we have some basic stats
  if (summary.github_stats.total_repos === 0 && summary.repositories.length > 0) {
    summary.github_stats.total_repos = summary.repositories.length;
  }

  if (summary.github_stats.total_commits === 0) {
    summary.github_stats.total_commits = summary.repositories.reduce((sum, r) => sum + r.commits, 0);
  }

  // Save the summary
  const summaryPath = path.join(ROOT_DIR, 'data', 'activity-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log('✅ Activity summary created successfully');
  console.log(`   - Repositories: ${summary.repositories.length}`);
  console.log(`   - Total Commits: ${summary.github_stats.total_commits}`);
  console.log(`   - Total Repos: ${summary.github_stats.total_repos}`);

  return summary;
}

// Execute
createActivitySummary().catch(console.error);