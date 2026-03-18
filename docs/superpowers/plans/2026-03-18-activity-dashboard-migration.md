# Activity Dashboard Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the live GitHub activity dashboard from `cv.adrianwedd.com/watch-me-work.html` to `adrianwedd.com/activity/`, restyled with Tailwind to match the portfolio site.

**Architecture:** Extract shared GitHub API logic from the existing `GitHubActivity.tsx` Preact island into a shared module, then build a full-page `ActivityDashboard.tsx` component with metrics, filters, repo grid, and detail modal. The CV repo gets a redirect stub and cleanup. Two independent repos are modified.

**Tech Stack:** Astro 5, Preact, Tailwind CSS, GitHub REST API

**Spec:** `docs/superpowers/specs/2026-03-18-activity-dashboard-migration-design.md`

---

## File Map

### adrianwedd.com repo (`/Users/adrian/repos/adrianwedd.com`)

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/github-activity.ts` | Create | Shared API fetching, caching, event processing, types |
| `src/components/islands/GitHubActivity.tsx` | Modify | Refactor to import from shared module |
| `src/components/islands/ActivityDashboard.tsx` | Create | Full-page dashboard: metrics, filters, stream, repo grid, modal |
| `src/pages/activity.astro` | Create | Astro page wrapper with BaseLayout, SEO metadata |
| `src/components/Header.astro` | Modify (line 5) | Add "Activity" nav link |
| `src/layouts/BaseLayout.astro` | Modify (lines 118, 170) | Add keyboard shortcut `g v` + overlay entry |
| `astro.config.mjs` | Modify (line 43) | Add `/activity/` sitemap rule |

### CV repo (`/Users/adrian/repos/cv`)

| File | Action | Responsibility |
|------|--------|---------------|
| `watch-me-work.html` | Replace | Meta redirect to `adrianwedd.com/activity/` |
| `index.html` | Modify (line 122) | Update link href |
| `.github/scripts/cv-generator.js` | Modify (lines 625-628, 668, 681-684, 762) | Remove old copies, add redirect copy, update sitemap |
| `assets/watch-me-work.css` | Delete | No longer needed |
| `assets/watch-me-work.js` | Delete | No longer needed |

---

## Task 1: Extract shared GitHub API module

**Repo:** adrianwedd.com
**Files:**
- Create: `src/lib/github-activity.ts`
- Modify: `src/components/islands/GitHubActivity.tsx`

- [ ] **Step 1: Create the shared module**

Extract types, constants, and all utility functions from `GitHubActivity.tsx` into a shared module:

```typescript
// src/lib/github-activity.ts

export const USERNAME = 'adrianwedd';
export const EVENTS_URL = `https://api.github.com/users/${USERNAME}/events/public`;
export const REPOS_URL = `https://api.github.com/users/${USERNAME}/repos`;
export const CACHE_KEY = 'adrianwedd_gh_activity';
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: {
    commits?: { message: string; sha: string }[];
    action?: string;
    pull_request?: { title: string; html_url: string; number: number };
    issue?: { title: string; html_url: string; number: number };
    ref?: string;
    ref_type?: string;
  };
}

export interface ProcessedActivity {
  id: string;
  type: string;
  repo: string;
  time: string;
  description: string;
  url?: string;
}

export interface RepoStat {
  name: string;
  commits: number;
  lastActive: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  description: string | null;
  fork: boolean;
  archived: boolean;
}

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function processEvents(events: GitHubEvent[]): {
  activities: ProcessedActivity[];
  repos: RepoStat[];
  commitCount: number;
} {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const repoMap = new Map<string, RepoStat>();
  let commitCount = 0;
  const activities: ProcessedActivity[] = [];

  for (const event of events) {
    const repoShort = event.repo.name.replace(`${USERNAME}/`, '');
    const time = relativeTime(event.created_at);
    const eventTime = new Date(event.created_at).getTime();

    if (event.type === 'PushEvent' && event.payload.commits && eventTime > thirtyDaysAgo) {
      const count = event.payload.commits.length;
      commitCount += count;
      const existing = repoMap.get(repoShort);
      if (existing) {
        existing.commits += count;
      } else {
        repoMap.set(repoShort, { name: repoShort, commits: count, lastActive: time });
      }
    }

    let description = '';
    let url: string | undefined;

    switch (event.type) {
      case 'PushEvent': {
        const commits = event.payload.commits ?? [];
        const msg = commits[0]?.message?.split('\n')[0] ?? 'pushed code';
        const count = commits.length;
        description = count > 1 ? `${count} commits: ${msg}` : msg;
        url = `https://github.com/${event.repo.name}`;
        break;
      }
      case 'PullRequestEvent':
        description = `${event.payload.action} PR #${event.payload.pull_request?.number}: ${event.payload.pull_request?.title}`;
        url = event.payload.pull_request?.html_url;
        break;
      case 'IssuesEvent':
        description = `${event.payload.action} issue #${event.payload.issue?.number}: ${event.payload.issue?.title}`;
        url = event.payload.issue?.html_url;
        break;
      case 'CreateEvent':
        description = `created ${event.payload.ref_type}${event.payload.ref ? ` ${event.payload.ref}` : ''}`;
        url = `https://github.com/${event.repo.name}`;
        break;
      case 'DeleteEvent':
        description = `deleted ${event.payload.ref_type} ${event.payload.ref ?? ''}`;
        break;
      case 'WatchEvent':
        description = 'starred repo';
        url = `https://github.com/${event.repo.name}`;
        break;
      case 'ForkEvent':
        description = 'forked repo';
        url = `https://github.com/${event.repo.name}`;
        break;
      case 'IssueCommentEvent':
        description = `commented on #${event.payload.issue?.number}`;
        url = event.payload.issue?.html_url;
        break;
      default:
        description = event.type.replace('Event', '').toLowerCase();
    }

    activities.push({ id: event.id, type: event.type, repo: repoShort, time, description, url });
  }

  const repos = Array.from(repoMap.values()).sort((a, b) => b.commits - a.commits);
  return { activities, repos, commitCount };
}

/**
 * Convenience wrapper with caps — used by the compact /now/ page widget.
 * The full ActivityDashboard uses processEvents() directly for uncapped results.
 */
export function processEventsCompact(events: GitHubEvent[]): {
  activities: ProcessedActivity[];
  repos: RepoStat[];
  commitCount: number;
} {
  const result = processEvents(events);
  return {
    activities: result.activities.slice(0, 12),
    repos: result.repos.slice(0, 6),
    commitCount: result.commitCount,
  };
}

export function eventIcon(type: string): string {
  switch (type) {
    case 'PushEvent': return '⬆';
    case 'PullRequestEvent': return '⤴';
    case 'IssuesEvent': return '◉';
    case 'CreateEvent': return '+';
    case 'DeleteEvent': return '×';
    case 'WatchEvent': return '★';
    case 'ForkEvent': return '⑂';
    case 'IssueCommentEvent': return '💬';
    default: return '·';
  }
}

type CacheData = { events: GitHubEvent[]; timestamp: number };

export function getCached(): GitHubEvent[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CacheData = JSON.parse(raw);
    if (Date.now() - data.timestamp > CACHE_TTL) return null;
    return data.events;
  } catch {
    return null;
  }
}

export function setCache(events: GitHubEvent[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ events, timestamp: Date.now() }));
  } catch {
    // storage full or unavailable
  }
}

export async function fetchEvents(): Promise<GitHubEvent[]> {
  const cached = getCached();
  if (cached) return cached;

  const res = await fetch(`${EVENTS_URL}?per_page=100`);
  if (res.status === 403) throw new Error('rate-limit');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const events: GitHubEvent[] = await res.json();
  setCache(events);
  return events;
}

export async function fetchAllRepos(): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  const maxPages = 5;
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${REPOS_URL}?per_page=100&sort=updated&page=${page}`);
    if (!res.ok) break;
    const repos: GitHubRepo[] = await res.json();
    allRepos.push(...repos);
    if (repos.length < 100) break;
  }
  return allRepos;
}
```

- [ ] **Step 2: Refactor GitHubActivity.tsx to use shared module**

Replace the inline types, functions, and constants with imports. The component switches to `fetchEvents()` for data loading and `processEventsCompact()` to preserve the 12-activity / 6-repo caps.

Replace the entire `src/components/islands/GitHubActivity.tsx` with:

```typescript
import { useState, useEffect } from 'preact/hooks';
import {
  type ProcessedActivity,
  type RepoStat,
  fetchEvents,
  processEventsCompact,
  eventIcon,
  USERNAME,
} from '../../lib/github-activity';

export default function GitHubActivity() {
  const [activities, setActivities] = useState<ProcessedActivity[]>([]);
  const [repos, setRepos] = useState<RepoStat[]>([]);
  const [commitCount, setCommitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const events = await fetchEvents();
        const result = processEventsCompact(events);
        if (!cancelled) {
          setActivities(result.activities);
          setRepos(result.repos);
          setCommitCount(result.commitCount);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error && err.message === 'rate-limit' ? 'rate-limit' : 'fetch-error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ... rest of the JSX stays exactly as-is (lines 216-333 of original)
```

The JSX (loading skeleton, error states, stats bar, activity stream, active repos, footer) is unchanged — it uses the same state variables (`activities`, `repos`, `commitCount`, `loading`, `error`) and the same `eventIcon()` and `USERNAME` imports.

- [ ] **Step 3: Verify the /now/ page still works**

Run: `cd /Users/adrian/repos/adrianwedd.com && npm run build`
Expected: Build succeeds with no errors. The `/now/` page should still render the `GitHubActivity` island.

- [ ] **Step 4: Commit**

```bash
cd /Users/adrian/repos/adrianwedd.com
git add src/lib/github-activity.ts src/components/islands/GitHubActivity.tsx
git commit -m "refactor: extract shared GitHub API module from GitHubActivity island"
```

---

## Task 2: Create the ActivityDashboard Preact island

**Repo:** adrianwedd.com
**Files:**
- Create: `src/components/islands/ActivityDashboard.tsx`

- [ ] **Step 1: Create the full-page dashboard component**

This component provides: 4 metrics cards, activity stream with filters (type, time range, repo, search), repository grid with grid/list toggle, and activity detail modal. All data from GitHub API via the shared module.

```typescript
// src/components/islands/ActivityDashboard.tsx

import { useState, useEffect, useMemo } from 'preact/hooks';
import {
  type GitHubEvent,
  type GitHubRepo,
  type ProcessedActivity,
  type RepoStat,
  fetchEvents,
  fetchAllRepos,
  processEvents,
  eventIcon,
  relativeTime,
  USERNAME,
} from '../../lib/github-activity';

type TimeRange = '24h' | '7d' | '30d' | 'all';
type ViewMode = 'grid' | 'list';

function filterByTimeRange(activities: ProcessedActivity[], events: GitHubEvent[], range: TimeRange): ProcessedActivity[] {
  if (range === 'all') return activities;
  const now = Date.now();
  const cutoffs: Record<TimeRange, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    all: Infinity,
  };
  const cutoff = now - cutoffs[range];
  const validIds = new Set(
    events.filter((e) => new Date(e.created_at).getTime() > cutoff).map((e) => e.id)
  );
  return activities.filter((a) => validIds.has(a.id));
}

export default function ActivityDashboard() {
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [repoFilter, setRepoFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedActivity, setSelectedActivity] = useState<ProcessedActivity | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [evts, rps] = await Promise.all([fetchEvents(), fetchAllRepos()]);
        if (!cancelled) {
          setEvents(evts);
          setRepos(rps.filter((r) => !r.fork && !r.archived));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'fetch-error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 120_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const processed = useMemo(() => processEvents(events), [events]);

  const activeDays = useMemo(() => {
    const days = new Set(
      events
        .filter((e) => new Date(e.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
        .map((e) => new Date(e.created_at).toDateString())
    );
    return days.size;
  }, [events]);

  const languages = useMemo(() => {
    const langSet = new Set(repos.map((r) => r.language).filter(Boolean));
    return langSet.size;
  }, [repos]);

  const filteredActivities = useMemo(() => {
    let items = filterByTimeRange(processed.activities, events, timeRange);
    if (typeFilter !== 'all') items = items.filter((a) => a.type === typeFilter);
    if (repoFilter !== 'all') items = items.filter((a) => a.repo === repoFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((a) => a.description.toLowerCase().includes(q) || a.repo.toLowerCase().includes(q));
    }
    return items;
  }, [processed.activities, events, typeFilter, timeRange, repoFilter, search]);

  const eventTypes = useMemo(() => {
    const types = new Set(processed.activities.map((a) => a.type));
    return Array.from(types).sort();
  }, [processed.activities]);

  const repoNames = useMemo(() => {
    const names = new Set(processed.activities.map((a) => a.repo));
    return Array.from(names).sort();
  }, [processed.activities]);

  if (loading) {
    return (
      <div class="space-y-6 animate-pulse" role="status" aria-label="Loading activity dashboard">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} class="h-20 rounded-lg bg-surface-alt" />)}
        </div>
        <div class="h-10 rounded bg-surface-alt" />
        {[1, 2, 3, 4, 5].map((i) => <div key={i} class="h-12 rounded bg-surface-alt" />)}
      </div>
    );
  }

  if (error === 'rate-limit') {
    return (
      <div class="rounded-lg border border-border bg-surface-alt p-8 text-center">
        <p class="text-text-muted">GitHub API rate limit reached. Updates hourly.</p>
        <p class="mt-2 text-xs text-text-muted">Try refreshing in a few minutes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class="rounded-lg border border-border bg-surface-alt p-8 text-center">
        <p class="text-text-muted">Unable to load activity right now.</p>
      </div>
    );
  }

  return (
    <div class="space-y-8" aria-live="polite">
      {/* Metrics bar */}
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Commits (30d)', value: processed.commitCount },
          { label: 'Active days', value: activeDays },
          { label: 'Repositories', value: repos.length },
          { label: 'Languages', value: languages },
        ].map((m) => (
          <div key={m.label} class="rounded-lg border border-border bg-surface-raised p-4 text-center">
            <div class="text-2xl font-semibold text-accent">{m.value}</div>
            <div class="mt-1 text-xs text-text-muted">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div class="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter((e.target as HTMLSelectElement).value)}
          class="rounded border border-border bg-surface-alt px-3 py-1.5 text-sm text-text"
          aria-label="Filter by event type"
        >
          <option value="all">All types</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t.replace('Event', '')}</option>
          ))}
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange((e.target as HTMLSelectElement).value as TimeRange)}
          class="rounded border border-border bg-surface-alt px-3 py-1.5 text-sm text-text"
          aria-label="Filter by time range"
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>

        <select
          value={repoFilter}
          onChange={(e) => setRepoFilter((e.target as HTMLSelectElement).value)}
          class="rounded border border-border bg-surface-alt px-3 py-1.5 text-sm text-text"
          aria-label="Filter by repository"
        >
          <option value="all">All repos</option>
          {repoNames.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Search..."
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          class="rounded border border-border bg-surface-alt px-3 py-1.5 text-sm text-text placeholder:text-text-muted"
          aria-label="Search activity"
        />
      </div>

      {/* Activity stream */}
      <div>
        <h2 class="mb-4 text-sm font-medium uppercase tracking-wider text-text-muted">Activity</h2>
        {filteredActivities.length === 0 ? (
          <p class="text-sm text-text-muted italic">No matching activity.</p>
        ) : (
          <ul class="space-y-0">
            {filteredActivities.map((a) => (
              <li key={a.id} class="flex items-start gap-3 border-b border-border py-3 last:border-0">
                <span class="mt-0.5 w-5 shrink-0 text-center text-text-muted" aria-hidden="true">
                  {eventIcon(a.type)}
                </span>
                <button
                  class="min-w-0 flex-1 text-left"
                  onClick={() => setSelectedActivity(a)}
                  aria-label={`View details: ${a.description}`}
                >
                  <span class="font-mono text-xs text-accent">{a.repo}</span>
                  <span class="text-text"> — </span>
                  <span class="text-sm text-text">{a.description}</span>
                </button>
                <span class="shrink-0 text-xs text-text-muted whitespace-nowrap">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Repository grid */}
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-medium uppercase tracking-wider text-text-muted">Repositories</h2>
          <div class="flex gap-1">
            {(['grid', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                class={`rounded px-2 py-1 text-xs ${viewMode === mode ? 'bg-accent text-surface' : 'text-text-muted hover:text-text'}`}
                aria-label={`${mode} view`}
                aria-pressed={viewMode === mode}
              >
                {mode === 'grid' ? '▦' : '☰'}
              </button>
            ))}
          </div>
        </div>
        <div class={viewMode === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'}>
          {repos.slice(0, 18).map((r) => (
            <a
              key={r.full_name}
              href={`https://github.com/${r.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              class="block rounded-lg border border-border bg-surface-alt p-4 transition-colors hover:border-accent"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono text-sm text-accent">{r.name}</span>
                {r.language && <span class="text-xs text-text-muted">{r.language}</span>}
              </div>
              {r.description && (
                <p class="mt-1 text-xs text-text-muted line-clamp-2">{r.description}</p>
              )}
              <div class="mt-2 flex items-center gap-3 text-xs text-text-muted">
                {r.stargazers_count > 0 && <span>★ {r.stargazers_count}</span>}
                <span>{relativeTime(r.pushed_at)}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selectedActivity && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedActivity(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Activity details"
        >
          <div
            class="w-full max-w-md rounded-lg border border-border bg-surface-raised p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-medium text-text">Activity Detail</h3>
              <button onClick={() => setSelectedActivity(null)} class="text-text-muted hover:text-text" aria-label="Close">✕</button>
            </div>
            <dl class="space-y-2 text-sm">
              <div><dt class="text-text-muted">Type</dt><dd class="text-text">{selectedActivity.type.replace('Event', '')}</dd></div>
              <div><dt class="text-text-muted">Repository</dt><dd><a href={`https://github.com/${USERNAME}/${selectedActivity.repo}`} target="_blank" rel="noopener noreferrer" class="font-mono text-accent hover:underline">{selectedActivity.repo}</a></dd></div>
              <div><dt class="text-text-muted">Description</dt><dd class="text-text">{selectedActivity.description}</dd></div>
              <div><dt class="text-text-muted">Time</dt><dd class="text-text">{selectedActivity.time}</dd></div>
              {selectedActivity.url && (
                <div><dt class="text-text-muted">Link</dt><dd><a href={selectedActivity.url} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">View on GitHub</a></dd></div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Footer */}
      <p class="text-xs text-text-muted">
        Live from{' '}
        <a href={`https://github.com/${USERNAME}`} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">
          GitHub
        </a>
        . Refreshes every 2 minutes. Rate limit: 60 requests/hour.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd /Users/adrian/repos/adrianwedd.com && npx astro check 2>&1 | head -20`
Expected: No type errors related to `ActivityDashboard.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/adrian/repos/adrianwedd.com
git add src/components/islands/ActivityDashboard.tsx
git commit -m "feat: add ActivityDashboard Preact island with filters and repo grid"
```

---

## Task 3: Create the Astro page and wire up navigation

**Repo:** adrianwedd.com
**Files:**
- Create: `src/pages/activity.astro`
- Modify: `src/components/Header.astro` (line 5)
- Modify: `src/layouts/BaseLayout.astro` (lines 118, 170)
- Modify: `astro.config.mjs` (line 43)

- [ ] **Step 1: Create the Astro page**

```astro
---
// src/pages/activity.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import ActivityDashboard from '../components/islands/ActivityDashboard';
---

<BaseLayout
  title="Activity - Adrian Wedd"
  description="Live development activity dashboard — real-time commits, pull requests, issues, and repository updates from GitHub."
>
  <main class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <header class="mb-10">
      <h1 class="text-2xl font-semibold text-text">Activity</h1>
      <p class="mt-2 text-sm text-text-muted">
        Live development activity from GitHub. What I'm building right now.
      </p>
    </header>

    <ActivityDashboard client:load />
  </main>
</BaseLayout>
```

- [ ] **Step 2: Add "Activity" to Header nav**

In `src/components/Header.astro`, insert at position 2 in the `navLinks` array (after Projects, before Blog):

```javascript
// Line 5 becomes:
  { href: '/projects/', label: 'Projects' },
  { href: '/activity/', label: 'Activity' },
  { href: '/blog/', label: 'Blog' },
```

- [ ] **Step 3: Add keyboard shortcut**

In `src/layouts/BaseLayout.astro` line 170, add `v` route:

```javascript
var routes = { h: '/', b: '/blog/', p: '/projects/', g: '/gallery/', n: '/now/', a: '/about/', v: '/activity/' };
```

In the shortcut overlay HTML (after line 118, after the `g a` About entry), add:

```html
<kbd class="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-xs text-accent">g v</kbd><span class="text-text">Activity</span>
```

- [ ] **Step 4: Add sitemap rule**

In `astro.config.mjs`, add before the default return in `getSitemapMeta()` (before line 44):

```javascript
  if (pathname === '/activity/') return { priority: 0.7, changefreq: 'weekly' };
```

- [ ] **Step 5: Build and verify**

Run: `cd /Users/adrian/repos/adrianwedd.com && npm run build`
Expected: Build succeeds. Check `dist/activity/index.html` exists.

Run: `cd /Users/adrian/repos/adrianwedd.com && npx serve dist -l 4000 &`
Visit: `http://localhost:4000/activity/`
Expected: Dashboard renders with metrics, activity stream, and repo grid.

- [ ] **Step 6: Commit**

```bash
cd /Users/adrian/repos/adrianwedd.com
git add src/pages/activity.astro src/components/Header.astro src/layouts/BaseLayout.astro astro.config.mjs
git commit -m "feat: add /activity/ page with navigation and keyboard shortcut"
```

---

## Task 4: CV repo cleanup — redirect stub and remove old files

**Repo:** CV (`/Users/adrian/repos/cv`)
**Files:**
- Replace: `watch-me-work.html`
- Modify: `index.html` (line 122)
- Modify: `.github/scripts/cv-generator.js` (lines 625-628, 668, 681-684, 762)
- Delete: `assets/watch-me-work.css`
- Delete: `assets/watch-me-work.js`

- [ ] **Step 1: Replace watch-me-work.html with redirect stub**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=https://adrianwedd.com/activity/">
    <link rel="canonical" href="https://adrianwedd.com/activity/">
    <title>Redirecting to Activity Dashboard</title>
</head>
<body>
    <p>This page has moved to <a href="https://adrianwedd.com/activity/">adrianwedd.com/activity</a>.</p>
</body>
</html>
```

- [ ] **Step 2: Update the link in index.html**

Line 122 — change:
```html
<a href="watch-me-work.html" class="contact-link" aria-label="View live activity dashboard">Watch Me Work</a>
```
To:
```html
<a href="https://adrianwedd.com/activity/" class="contact-link" aria-label="View live activity dashboard" target="_blank" rel="noopener noreferrer">Watch Me Work</a>
```

- [ ] **Step 3: Update cv-generator.js — remove watch-me-work copies**

**Remove lines 625-628** (watch-me-work CSS copy):
```javascript
            // Copy watch-me-work CSS
            const wmwCssSource = path.join(CONFIG.ASSETS_DIR, 'watch-me-work.css');
            const wmwCssTarget = path.join(assetsOutputDir, 'watch-me-work.css');
            await fs.copyFile(wmwCssSource, wmwCssTarget).catch(e => console.warn('⚠️ watch-me-work.css not found:', e.message));
```

**Line 668** — remove `'watch-me-work.js'` from the JS copy list:
```javascript
// Before:
for (const jsFile of ['watch-me-work.js', 'curvature-field.js', ...])
// After:
for (const jsFile of ['curvature-field.js', 'curvature-init.js', 'activity-viz.js', 'linkedin-insight.js', 'analytics-config.js', 'analytics-events.js'])
```

**Lines 681-684** — the watch-me-work.html copy stays but now copies the redirect stub (file content changed in step 1, no code change needed here).

- [ ] **Step 4: Update cv-generator.js — remove from sitemap**

Replace the sitemap generation (lines 753-767) to remove the watch-me-work entry:

```javascript
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${CONFIG.SITE_URL}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>`;
```

- [ ] **Step 5: Delete old CSS and JS files**

```bash
cd /Users/adrian/repos/cv
rm assets/watch-me-work.css assets/watch-me-work.js
```

- [ ] **Step 6: Validate JSON and verify build**

Run: `cd /Users/adrian/repos/cv && npm run validate:json`
Expected: All JSON files pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/adrian/repos/cv
git add watch-me-work.html index.html .github/scripts/cv-generator.js
git rm assets/watch-me-work.css assets/watch-me-work.js
git commit -m "feat: redirect watch-me-work to adrianwedd.com/activity, remove old dashboard files"
```

---

## Task 5: Push both repos and verify

- [ ] **Step 1: Push adrianwedd.com**

```bash
cd /Users/adrian/repos/adrianwedd.com && git push
```

Wait for GitHub Pages deploy to complete.

- [ ] **Step 2: Push CV repo**

```bash
cd /Users/adrian/repos/cv && git push
```

Wait for CV pipeline to complete.

- [ ] **Step 3: Verify live**

- Visit `https://adrianwedd.com/activity/` — dashboard loads with metrics, stream, repo grid
- Visit `https://cv.adrianwedd.com/watch-me-work.html` — redirects to `adrianwedd.com/activity/`
- Visit `https://cv.adrianwedd.com` — "Watch Me Work" link points to `adrianwedd.com/activity/`
- Toggle theme on activity page — dark/light switch works
- Check keyboard shortcut: press `g` then `v` on any adrianwedd.com page — navigates to `/activity/`

- [ ] **Step 4: Lighthouse check**

Run Lighthouse on `https://adrianwedd.com/activity/`
Expected: Accessibility score >= 90
