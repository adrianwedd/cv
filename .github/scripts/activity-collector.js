#!/usr/bin/env node
/**
 * Evidence ingestion: collect real cross-repo GitHub activity.
 *
 * Writes:
 *   data/github-activity.json   — full evidence snapshot, including the
 *                                 commit_timeline / languages / heatmap shape
 *                                 rendered by assets/activity-viz.js
 *   data/activity-summary.json  — compact summary consumed by the website
 *
 * Deliberately measures the account, not this repository: the CV repo's own
 * git log is dominated by automation commits and is not professional evidence.
 *
 * Usage: node activity-collector.js   (needs GITHUB_TOKEN)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(REPO_ROOT, 'data');
const USER = 'adrianwedd';
const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS) || 30;

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('FATAL: GITHUB_TOKEN is required');
  process.exit(1);
}

async function gh(url, accept = 'application/vnd.github+json') {
  const res = await fetch(url.startsWith('http') ? url : `https://api.github.com${url}`, {
    headers: { Authorization: `token ${TOKEN}`, Accept: accept, 'User-Agent': 'cv-activity-collector' },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function graphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'cv-activity-collector' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 300)}`);
  return json.data;
}

function isoDay(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const now = new Date();
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86400e3);

  // 1. Accurate contribution calendar + per-repo commit totals (GraphQL, one call).
  //    The calendar covers ~9 months so the heatmap/timeline have real depth.
  const from = new Date(now.getTime() - 270 * 86400e3);
  const data = await graphql(`
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          contributionCalendar { weeks { contributionDays { date contributionCount } } }
          commitContributionsByRepository(maxRepositories: 25) {
            repository { name }
            contributions { totalCount }
          }
        }
      }
    }`, { login: USER, from: from.toISOString(), to: now.toISOString() });

  const cc = data.user.contributionsCollection;
  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

  // Heatmap: weekly buckets (matches the shape activity-viz.js renders).
  const weekly = new Map();
  for (const d of days) {
    const date = new Date(d.date + 'T00:00:00Z');
    const weekStart = new Date(date.getTime() - date.getUTCDay() * 86400e3);
    const key = isoDay(weekStart);
    weekly.set(key, (weekly.get(key) || 0) + d.contributionCount);
  }
  const heatmap = [...weekly.entries()].sort().map(([date, count]) => ({ date, count }));

  // Commit timeline per repo per week: from public push events (real, partial —
  // the events API covers roughly the last 90 days).
  const events = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await gh(`/users/${USER}/events/public?per_page=100&page=${page}`);
    events.push(...batch);
    if (batch.length < 100) break;
  }
  const timeline = new Map();
  for (const ev of events) {
    if (ev.type !== 'PushEvent') continue;
    const date = new Date(ev.created_at);
    const weekStart = isoDay(new Date(date.getTime() - date.getUTCDay() * 86400e3));
    const repo = ev.repo.name.split('/')[1];
    if (!timeline.has(weekStart)) timeline.set(weekStart, {});
    const bucket = timeline.get(weekStart);
    bucket[repo] = (bucket[repo] || 0) + (ev.payload?.size || 1);
  }
  const commit_timeline = [...timeline.entries()].sort().map(([week, repos]) => ({ week, repos }));

  // 2. Repository inventory + language mix.
  const repos = await gh(`/users/${USER}/repos?per_page=100&sort=pushed`);
  const languages = {};
  for (const r of repos) {
    if (r.language) languages[r.language] = (languages[r.language] || 0) + (r.size || 1);
  }
  const activeRepos = repos.filter((r) => new Date(r.pushed_at) >= since);

  // 3. Commits authored in the lookback window (search API, cross-repo, real count).
  const search = await gh(
    `/search/commits?q=author:${USER}+committer-date:%3E${isoDay(since)}&per_page=1`,
    'application/vnd.github.cloak-preview+json'
  );

  const snapshot = {
    generated_at: now.toISOString(),
    lookback_period_days: LOOKBACK_DAYS,
    summary: {
      total_commits: search.total_count || 0,
      commit_contributions_9mo: cc.totalCommitContributions,
      active_repositories: activeRepos.length,
      total_repositories: repos.length,
      total_stars: repos.reduce((s, r) => s + (r.stargazers_count || 0), 0),
      tracking_status: 'active',
    },
    top_commit_repositories: cc.commitContributionsByRepository.map((e) => ({
      name: e.repository.name, commits: e.contributions.totalCount,
    })),
    commit_timeline,
    languages,
    heatmap,
    repositories: activeRepos.map((r) => ({
      name: r.name,
      description: r.description || '',
      language: r.language,
      last_push: r.pushed_at?.slice(0, 10),
      stars: r.stargazers_count,
    })),
  };

  fs.writeFileSync(path.join(DATA_DIR, 'github-activity.json'), JSON.stringify(snapshot, null, 2) + '\n');

  // Compact website summary — key names are load-bearing for assets/modules.
  const active_days = days.filter((d) => new Date(d.date) >= since && d.contributionCount > 0).length;
  const summary = {
    last_updated: now.toISOString(),
    lookback_period_days: LOOKBACK_DAYS,
    summary: {
      total_commits: snapshot.summary.total_commits,
      active_days,
      net_lines_contributed: 0,
      tracking_status: 'active',
    },
  };
  fs.writeFileSync(path.join(DATA_DIR, 'activity-summary.json'), JSON.stringify(summary, null, 2) + '\n');

  console.log(`Collected: ${snapshot.summary.total_commits} commits/${LOOKBACK_DAYS}d, ` +
    `${active_days} active days, ${activeRepos.length} active repos, ${repos.length} total`);
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
