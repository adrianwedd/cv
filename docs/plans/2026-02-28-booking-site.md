# Booking Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `book.adrianwedd.com` — a custom 30-min booking page backed by Google Calendar and a Cloudflare Worker API.

**Architecture:** Static frontend (GitHub Pages) calls a Cloudflare Worker for slot availability and booking. The Worker authenticates as a Google service account, queries the Calendar freebusy API, and creates events + sends email on booking.

**Tech Stack:** Vanilla HTML/CSS/JS (frontend), Cloudflare Workers + Wrangler (backend), Google Calendar API v3, Resend (email), Vitest for Worker tests.

---

## Prerequisites (Manual — Adrian does these before starting)

1. **Google Cloud:** Create project → enable Calendar API → create service account → download JSON key → share your calendar with the service account email (Editor role)
2. **Resend:** Sign up at resend.com → create API key → verify `adrianwedd.com` domain → note the `from` address (e.g. `book@adrianwedd.com`)
3. **Cloudflare:** Ensure `adrianwedd.com` is on Cloudflare (it is) — you'll add DNS records in Task 8

---

### Task 1: Create repos and scaffold projects

**Files:**
- Create: `~/repos/book.adrianwedd.com/index.html` (frontend repo)
- Create: `~/repos/book-api/src/index.js` (Worker repo)
- Create: `~/repos/book-api/wrangler.toml`
- Create: `~/repos/book-api/package.json`

**Step 1: Create frontend repo**

```bash
mkdir ~/repos/book.adrianwedd.com
cd ~/repos/book.adrianwedd.com
git init
gh repo create adrianwedd/book.adrianwedd.com --public --source=. --push
```

**Step 2: Create Worker project**

```bash
mkdir ~/repos/book-api
cd ~/repos/book-api
npm create cloudflare@latest . -- --type=hello-world --no-git
# Select: JavaScript, no TypeScript, no deploy yet
git init
gh repo create adrianwedd/book-api --private --source=. --push
```

**Step 3: Install test dependencies**

```bash
cd ~/repos/book-api
npm install --save-dev vitest @cloudflare/vitest-pool-workers
```

**Step 4: Create `wrangler.toml`**

```toml
name = "book-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
CALENDAR_ID = "primary"
TIMEZONE = "Australia/Tasmania"
FRONTEND_ORIGIN = "https://book.adrianwedd.com"
```

**Step 5: Add test script to `package.json`**

Edit `package.json` scripts section:
```json
{
  "scripts": {
    "test": "vitest run",
    "dev": "wrangler dev"
  }
}
```

**Step 6: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: { wrangler: { configPath: './wrangler.toml' } },
    },
  },
});
```

**Step 7: Commit**

```bash
cd ~/repos/book-api
git add -A && git commit -m "chore: scaffold Cloudflare Worker project"
```

---

### Task 2: Google service account JWT auth helper

**Files:**
- Create: `~/repos/book-api/src/google-auth.js`
- Create: `~/repos/book-api/src/google-auth.test.js`

**Step 1: Write the failing test**

```js
// src/google-auth.test.js
import { describe, it, expect } from 'vitest';
import { pemToBuffer } from './google-auth.js';

describe('pemToBuffer', () => {
  it('strips PEM headers and decodes base64', () => {
    // Construct a PEM string: standard header, base64("hello"), standard footer
    const header = '-'.repeat(5) + 'BEGIN RSA KEY' + '-'.repeat(5);
    const footer = '-'.repeat(5) + 'END RSA KEY'   + '-'.repeat(5);
    const pem = `${header}\naGVsbG8=\n${footer}`;
    const buf = pemToBuffer(pem);
    expect(buf instanceof ArrayBuffer).toBe(true);
    expect(new TextDecoder().decode(buf)).toBe('hello');
  });
});
```

**Step 2: Run to verify it fails**

```bash
cd ~/repos/book-api && npm test
```
Expected: FAIL — `google-auth.js` not found.

**Step 3: Implement `src/google-auth.js`**

```js
export function pemToBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

export async function buildJwt(clientEmail, privateKeyPem, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=+$/, '');
  const claimSet = btoa(JSON.stringify({
    iss: clientEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).replace(/=+$/, '');
  const sigInput = new TextEncoder().encode(`${header}.${claimSet}`);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBuffer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, sigInput);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${claimSet}.${sigB64}`;
}

export async function getAccessToken(serviceAccountJson, scope) {
  const parsed = typeof serviceAccountJson === 'string'
    ? JSON.parse(serviceAccountJson)
    : serviceAccountJson;
  // parsed.private_key is the RSA key field from the service account JSON
  const jwt = await buildJwt(parsed.client_email, parsed['private_key'], scope);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token;
}
```

**Step 4: Run tests to verify passing**

```bash
npm test
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/google-auth.js src/google-auth.test.js
git commit -m "feat: Google service account JWT auth helper"
```

---

### Task 3: Slot generation logic

**Files:**
- Create: `~/repos/book-api/src/slots.js`
- Create: `~/repos/book-api/src/slots.test.js`

**Step 1: Write the failing test**

```js
// src/slots.test.js
import { describe, it, expect } from 'vitest';
import { generateCandidates, filterSlots } from './slots.js';

describe('generateCandidates', () => {
  it('generates slots 9am-4pm on a weekday', () => {
    const slots = generateCandidates('2026-03-02'); // Monday
    expect(slots[0]).toBe('2026-03-02T09:00:00+11:00');
    expect(slots[slots.length - 1]).toBe('2026-03-02T16:00:00+11:00');
    expect(slots.length).toBe(8); // 9,10,11,12,13,14,15,16
  });

  it('returns empty array for weekends', () => {
    expect(generateCandidates('2026-03-07')).toEqual([]); // Saturday
  });
});

describe('filterSlots', () => {
  it('removes slots overlapping busy periods', () => {
    const candidates = [
      '2026-03-02T09:00:00+11:00',
      '2026-03-02T10:00:00+11:00',
    ];
    const busy = [
      { start: '2026-03-02T09:00:00+11:00', end: '2026-03-02T10:00:00+11:00' },
    ];
    expect(filterSlots(candidates, busy)).toEqual(['10:00']);
  });

  it('returns all slots when calendar is free', () => {
    expect(filterSlots(['2026-03-02T09:00:00+11:00'], [])).toEqual(['09:00']);
  });
});
```

**Step 2: Run to verify failure**

```bash
npm test
```
Expected: FAIL — `slots.js` not found.

**Step 3: Implement `src/slots.js`**

```js
const OFFSET = '+11:00'; // AEDT (Tasmania summer). Change to +10:00 for winter.
const SLOT_MS = 30 * 60 * 1000;

export function generateCandidates(dateStr) {
  const d = new Date(`${dateStr}T00:00:00${OFFSET}`);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return []; // weekend
  const slots = [];
  for (let h = 9; h <= 16; h++) {
    slots.push(`${dateStr}T${String(h).padStart(2, '0')}:00:00${OFFSET}`);
  }
  return slots;
}

export function filterSlots(candidates, busyPeriods) {
  return candidates
    .filter(slot => {
      const start = new Date(slot).getTime();
      const end = start + SLOT_MS;
      return !busyPeriods.some(b => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return start < bEnd && end > bStart;
      });
    })
    .map(slot => slot.slice(11, 16)); // "HH:MM"
}
```

**Step 4: Run tests**

```bash
npm test
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/slots.js src/slots.test.js
git commit -m "feat: slot generation and freebusy filtering"
```

---

### Task 4: Email helper (plain text, no user input in markup)

**Files:**
- Create: `~/repos/book-api/src/email.js`

**Step 1: Implement `src/email.js`**

User-supplied strings (`name`, `note`) are sent as plain text via Resend's `text` field, not embedded in markup, to avoid injection risk.

```js
export async function sendConfirmation({ resendKey, to, name, slot, note }) {
  const timeStr = new Date(slot).toLocaleString('en-AU', {
    timeZone: 'Australia/Tasmania',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  const body = [
    `Hi ${name},`,
    '',
    `Your 30-minute call with Adrian Wedd is confirmed for:`,
    `  ${timeStr}`,
    '',
    note ? `Your note: ${note}` : '',
    '',
    'A Google Calendar invite has been sent. See you then.',
    '',
    '-- Adrian Wedd | adrianwedd.com',
  ].filter(line => line !== undefined).join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Adrian Wedd <book@adrianwedd.com>',
      to: [to],
      subject: `Call confirmed: ${timeStr}`,
      text: body,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${await res.text()}`);
}
```

**Step 2: Commit**

```bash
git add src/email.js
git commit -m "feat: email confirmation helper (plain text)"
```

---

### Task 5: Main Worker handler

**Files:**
- Modify: `~/repos/book-api/src/index.js`

**Step 1: Replace `src/index.js`**

```js
import { getAccessToken } from './google-auth.js';
import { generateCandidates, filterSlots } from './slots.js';
import { sendConfirmation } from './email.js';

const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function corsHeaders(origin, allowed) {
  return {
    'Access-Control-Allow-Origin': origin === allowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleSlots(request, env) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'date must be YYYY-MM-DD' }, 400);
  }
  const candidates = generateCandidates(date);
  if (!candidates.length) return json({ slots: [] });

  const token = await getAccessToken(env.GOOGLE_SA_KEY, CAL_SCOPE);
  const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: candidates[0],
      timeMax: `${date}T17:00:00+11:00`,
      timeZone: 'Australia/Tasmania',
      items: [{ id: env.CALENDAR_ID || 'primary' }],
    }),
  });
  if (!fbRes.ok) throw new Error(`freebusy: ${await fbRes.text()}`);
  const fb = await fbRes.json();
  const busy = Object.values(fb.calendars)[0]?.busy ?? [];
  return json({ slots: filterSlots(candidates, busy) });
}

async function handleBook(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { name, email, slot, note } = body;
  if (!name || !email || !slot) return json({ error: 'name, email and slot are required' }, 400);

  const token = await getAccessToken(env.GOOGLE_SA_KEY, CAL_SCOPE);
  const startDt = new Date(slot);
  const endDt = new Date(startDt.getTime() + 30 * 60 * 1000);

  const evRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.CALENDAR_ID || 'primary')}/events`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `30-min call: ${name}`,
        description: note || '',
        start: { dateTime: startDt.toISOString(), timeZone: 'Australia/Tasmania' },
        end:   { dateTime: endDt.toISOString(),   timeZone: 'Australia/Tasmania' },
        attendees: [{ email }, { email: 'adrian@adrianwedd.com' }],
        sendUpdates: 'all',
      }),
    }
  );
  if (!evRes.ok) throw new Error(`event create: ${await evRes.text()}`);
  const event = await evRes.json();

  await sendConfirmation({
    resendKey: env.RESEND_API_KEY,
    to: email,
    name,
    slot,
    note,
  });

  return json({ ok: true, eventId: event.id });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env.FRONTEND_ORIGIN || 'https://book.adrianwedd.com');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const { pathname } = new URL(request.url);
    let res;
    try {
      if (request.method === 'GET' && pathname === '/slots') {
        res = await handleSlots(request, env);
      } else if (request.method === 'POST' && pathname === '/book') {
        res = await handleBook(request, env);
      } else {
        res = new Response('Not found', { status: 404 });
      }
    } catch (err) {
      console.error(err.message);
      res = json({ error: 'Internal error' }, 500);
    }
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  },
};
```

**Step 2: Store secrets**

```bash
cd ~/repos/book-api
# Paste the full service account JSON when prompted:
wrangler secret put GOOGLE_SA_KEY
# Paste Resend API key:
wrangler secret put RESEND_API_KEY
```

**Step 3: Smoke test locally**

```bash
wrangler dev
# In another terminal:
curl "http://localhost:8787/slots?date=2026-03-03"
# Expected: {"slots":["09:00","10:00",...]}
```

**Step 4: Commit**

```bash
git add src/index.js
git commit -m "feat: GET /slots and POST /book Worker endpoints"
```

---

### Task 6: Deploy the Worker

**Step 1: Deploy**

```bash
cd ~/repos/book-api
wrangler deploy
```
Expected output: `Deployed book-api (https://book-api.<subdomain>.workers.dev)`

**Step 2: Smoke test against production URL**

```bash
curl "https://book-api.<subdomain>.workers.dev/slots?date=2026-03-03"
```
Expected: JSON with a `slots` array.

**Step 3: Push to git**

```bash
git push
```

---

### Task 7: Frontend — `index.html`

**Files:**
- Create: `~/repos/book.adrianwedd.com/index.html`

**Step 1: Write the page**

The frontend uses DOM methods exclusively (createElement, textContent, appendChild) — no innerHTML on user-supplied content. All user data goes to the API via JSON, never into the DOM.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Book a call · Adrian Wedd</title>
  <style>
    :root {
      --bg: #070a0f;
      --surface: #0d1117;
      --border: #1e2733;
      --border-subtle: #141b24;
      --text: #e9eef6;
      --text-muted: #6b7d8f;
      --text-dim: #3a4a5a;
      --accent: #8ac7d9;
      --accent-dim: rgba(138,199,217,0.12);
      --green: #3fb950;
      --green-dim: rgba(63,185,80,0.12);
      --radius: 6px;
      --mono: 'JetBrains Mono','Fira Mono',monospace;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px; line-height: 1.6; min-height: 100vh;
    }
    .site-header {
      border-bottom: 1px solid var(--border);
      padding: 20px 32px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .wordmark { font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
    .wordmark span { color: var(--text); }
    .back-link { font-size: 12px; color: var(--text-muted); text-decoration: none; }
    .back-link:hover { color: var(--accent); }
    .container { max-width: 820px; margin: 0 auto; padding: 48px 32px; }
    .label { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 12px; }
    .step { display: none; }
    .step.active { display: block; }

    /* Calendar */
    .cal-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .cal-nav { background: none; border: 1px solid var(--border); color: var(--text-muted); border-radius: var(--radius); width: 28px; height: 28px; cursor: pointer; font-size: 14px; }
    .cal-nav:hover { border-color: var(--accent); color: var(--accent); }
    .cal-month { font-size: 15px; font-weight: 600; flex: 1; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 28px; }
    .cal-dow { text-align: center; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); padding: 6px 0; }
    .cal-day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: var(--radius); font-size: 13px; border: 1px solid transparent; cursor: default; }
    .cal-day.available { cursor: pointer; }
    .cal-day.available:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
    .cal-day.selected { background: var(--accent); color: var(--bg); font-weight: 600; }
    .cal-day.today { border-color: var(--border); }
    .cal-day.past, .cal-day.weekend { color: var(--text-dim); }

    /* Slots */
    .slots-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
    .slot-pill { padding: 8px 16px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; font-family: var(--mono); cursor: pointer; background: var(--surface); color: var(--text); transition: all 0.15s; }
    .slot-pill:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
    .slot-pill.selected { background: var(--accent); color: var(--bg); border-color: var(--accent); font-weight: 600; }
    .slots-msg { color: var(--text-muted); font-size: 13px; }

    /* Form */
    .booking-summary { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; margin-bottom: 24px; font-size: 13px; display: flex; align-items: center; gap: 12px; }
    .summary-time { font-family: var(--mono); color: var(--accent); font-weight: 600; }
    .summary-change { margin-left: auto; color: var(--text-muted); cursor: pointer; font-size: 12px; background: none; border: none; }
    .summary-change:hover { color: var(--accent); }
    .form-group { margin-bottom: 20px; }
    .form-label { font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px; }
    .form-input, .form-textarea { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font-size: 14px; padding: 10px 12px; outline: none; transition: border-color 0.15s; font-family: inherit; }
    .form-input:focus, .form-textarea:focus { border-color: var(--accent); }
    .form-textarea { resize: vertical; min-height: 80px; }
    .btn { padding: 10px 24px; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; border: none; letter-spacing: 0.04em; }
    .btn-primary { background: var(--accent); color: var(--bg); }
    .btn-primary:hover { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-error { color: #f85149; font-size: 12px; margin-left: 12px; display: none; }

    /* Confirmation */
    .confirm-check { font-size: 32px; margin-bottom: 16px; }
    .confirm-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .confirm-detail { color: var(--text-muted); margin-bottom: 24px; }
    .confirm-time { background: var(--green-dim); border: 1px solid rgba(63,185,80,0.25); border-radius: var(--radius); padding: 16px; margin-bottom: 24px; font-family: var(--mono); font-size: 15px; color: var(--green); }
  </style>
</head>
<body>
<header class="site-header">
  <div class="wordmark">Adrian <span>Wedd</span></div>
  <a href="https://adrianwedd.com" class="back-link">← adrianwedd.com</a>
</header>
<div class="container">

  <!-- Step 1: Calendar + slot picker -->
  <div class="step active" id="step-calendar">
    <div class="label">Book a 30-minute call</div>
    <p style="color:var(--text-muted);margin-bottom:28px;font-size:13px;">All times are AEST (UTC+11).</p>
    <div class="cal-header">
      <button class="cal-nav" id="prev-month" aria-label="Previous month">&#8249;</button>
      <div class="cal-month" id="cal-month-label"></div>
      <button class="cal-nav" id="next-month" aria-label="Next month">&#8250;</button>
    </div>
    <div class="cal-grid" id="cal-grid" role="grid"></div>
    <div id="slots-section" style="display:none">
      <div class="label" id="slots-label"></div>
      <div id="slots-container"></div>
    </div>
  </div>

  <!-- Step 2: Details form -->
  <div class="step" id="step-details">
    <div class="label">Your details</div>
    <div class="booking-summary">
      <span>30 min call</span>
      <span class="summary-time" id="summary-time"></span>
      <button class="summary-change" id="change-time">Change</button>
    </div>
    <form id="booking-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-name">Name</label>
        <input class="form-input" type="text" id="f-name" required autocomplete="name" placeholder="Your name">
      </div>
      <div class="form-group">
        <label class="form-label" for="f-email">Email</label>
        <input class="form-input" type="email" id="f-email" required autocomplete="email" placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label class="form-label" for="f-note">What would you like to discuss? <span style="color:var(--text-dim)">(optional)</span></label>
        <textarea class="form-textarea" id="f-note" placeholder="Brief context helps me prepare…"></textarea>
      </div>
      <div style="display:flex;align-items:center">
        <button class="btn btn-primary" type="submit" id="submit-btn">Confirm booking</button>
        <span class="form-error" id="submit-error" role="alert"></span>
      </div>
    </form>
  </div>

  <!-- Step 3: Confirmation -->
  <div class="step" id="step-confirm">
    <div class="confirm-check">&#10003;</div>
    <div class="confirm-title">You&rsquo;re booked.</div>
    <div class="confirm-detail" id="confirm-detail"></div>
    <div class="confirm-time" id="confirm-time"></div>
    <a href="https://adrianwedd.com" style="color:var(--accent);font-size:13px;">&#8592; Back to adrianwedd.com</a>
  </div>

</div>
<script>
  // All user-supplied values are sent to the API via JSON fetch.
  // They are never written into DOM markup — only via textContent.
  const API = 'https://api.book.adrianwedd.com';
  const OFFSET = '+11:00';
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const SLOT_MS = 30 * 60 * 1000;

  let yr, mo, selectedDate, selectedSlot, selectedSlotIso;

  // ---- Calendar ----
  function renderCalendar() {
    const label = document.getElementById('cal-month-label');
    label.textContent = MONTHS[mo] + ' ' + yr;
    const grid = document.getElementById('cal-grid');
    grid.textContent = '';

    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-dow';
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDow = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < firstDow; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day';
      grid.appendChild(el);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(yr, mo, d);
      const dow = date.getDay();
      const isPast = date < today;
      const isWeekend = dow === 0 || dow === 6;
      const isToday = date.getTime() === today.getTime();
      const dateStr = yr + '-' + String(mo+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const isSelected = dateStr === selectedDate;

      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = d;
      el.setAttribute('role', 'gridcell');

      if (isSelected) {
        el.classList.add('selected');
      } else if (isPast || isWeekend) {
        el.classList.add(isPast ? 'past' : 'weekend');
      } else {
        el.classList.add('available');
        if (isToday) el.classList.add('today');
        el.addEventListener('click', () => selectDate(dateStr));
      }
      grid.appendChild(el);
    }
  }

  async function selectDate(dateStr) {
    selectedDate = dateStr;
    selectedSlot = null;
    selectedSlotIso = null;
    renderCalendar();

    const section = document.getElementById('slots-section');
    const slotsLabel = document.getElementById('slots-label');
    const container = document.getElementById('slots-container');
    const d = new Date(dateStr + 'T12:00:00');
    slotsLabel.textContent = 'Available times — ' +
      d.toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long' });
    section.style.display = 'block';
    container.textContent = '';
    const loading = document.createElement('div');
    loading.className = 'slots-msg';
    loading.textContent = 'Loading…';
    container.appendChild(loading);

    let slots;
    try {
      const res = await fetch(API + '/slots?date=' + dateStr);
      if (!res.ok) throw new Error(res.status);
      ({ slots } = await res.json());
    } catch {
      container.textContent = '';
      const err = document.createElement('div');
      err.className = 'slots-msg';
      err.textContent = 'Failed to load availability. Try again.';
      container.appendChild(err);
      return;
    }

    container.textContent = '';
    if (!slots.length) {
      const empty = document.createElement('div');
      empty.className = 'slots-msg';
      empty.textContent = 'No availability on this day.';
      container.appendChild(empty);
      return;
    }

    const pillGrid = document.createElement('div');
    pillGrid.className = 'slots-grid';
    slots.forEach(hhmm => {
      const pill = document.createElement('button');
      pill.className = 'slot-pill';
      pill.type = 'button';
      pill.textContent = fmt(hhmm);
      pill.addEventListener('click', () => {
        document.querySelectorAll('.slot-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        selectedSlot = hhmm;
        selectedSlotIso = dateStr + 'T' + hhmm + ':00' + OFFSET;
        setTimeout(() => showStep('step-details'), 300);
      });
      pillGrid.appendChild(pill);
    });
    container.appendChild(pillGrid);
  }

  function fmt(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return (h % 12 || 12) + ':' + String(m).padStart(2,'0') + ' ' + (h >= 12 ? 'pm' : 'am');
  }

  document.getElementById('prev-month').addEventListener('click', () => {
    mo--; if (mo < 0) { mo = 11; yr--; } renderCalendar();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    mo++; if (mo > 11) { mo = 0; yr++; } renderCalendar();
  });

  // ---- Steps ----
  function showStep(id) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'step-details') {
      const d = new Date(selectedDate + 'T12:00:00');
      const el = document.getElementById('summary-time');
      el.textContent = d.toLocaleDateString('en-AU', {weekday:'short',day:'numeric',month:'short'}) + ' at ' + fmt(selectedSlot) + ' AEST';
    }
  }

  document.getElementById('change-time').addEventListener('click', () => showStep('step-calendar'));

  // ---- Form ----
  document.getElementById('booking-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errEl = document.getElementById('submit-error');
    btn.disabled = true;
    btn.textContent = 'Booking…';
    errEl.style.display = 'none';

    const name = document.getElementById('f-name').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const note = document.getElementById('f-note').value.trim();

    try {
      const res = await fetch(API + '/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, slot: selectedSlotIso, note }),
      });
      if (!res.ok) throw new Error(await res.text());

      const timeStr = new Date(selectedSlotIso).toLocaleString('en-AU', {
        timeZone: 'Australia/Tasmania',
        weekday:'long', day:'numeric', month:'long', year:'numeric',
        hour:'numeric', minute:'2-digit', timeZoneName:'short',
      });

      // Use textContent — never user input in markup
      const detail = document.getElementById('confirm-detail');
      const confirmTime = document.getElementById('confirm-time');
      detail.textContent = 'A calendar invite has been sent to ' + email + '.';
      confirmTime.textContent = timeStr;
      showStep('step-confirm');
    } catch {
      errEl.textContent = 'Booking failed — please try again.';
      errEl.style.display = 'inline';
      btn.disabled = false;
      btn.textContent = 'Confirm booking';
    }
  });

  // ---- Init ----
  const now = new Date();
  yr = now.getFullYear();
  mo = now.getMonth();
  renderCalendar();
</script>
</body>
</html>
```

**Step 2: Preview locally**

```bash
cd ~/repos/book.adrianwedd.com
python3 -m http.server 8001
```
Open `http://localhost:8001` — verify calendar renders and month navigation works. (Slot loading will fail locally since the Worker isn't proxied — that's expected.)

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: booking site frontend"
```

---

### Task 8: Deploy frontend + configure DNS

**Step 1: Add CNAME and push**

```bash
cd ~/repos/book.adrianwedd.com
echo "book.adrianwedd.com" > CNAME
git add CNAME && git commit -m "chore: CNAME for custom domain"
git push -u origin main
```

**Step 2: Enable GitHub Pages**

In GitHub: repo Settings → Pages → Source: Deploy from branch `main` / `/ (root)`.

**Step 3: Add Cloudflare DNS for frontend**

In Cloudflare dashboard → DNS → Add record:
```
Type:  CNAME
Name:  book
Target: adrianwedd.github.io
Proxy: OFF (grey cloud)
```

**Step 4: Route Worker to `api.book.adrianwedd.com`**

Add to `wrangler.toml`:
```toml
[[routes]]
pattern = "api.book.adrianwedd.com/*"
zone_name = "adrianwedd.com"
```

```bash
cd ~/repos/book-api
wrangler deploy
git add wrangler.toml && git commit -m "chore: route Worker to api.book.adrianwedd.com"
git push
```

Cloudflare DNS (auto-created by Wrangler, but verify):
```
Type:  CNAME
Name:  api.book
Target: book-api.<subdomain>.workers.dev
Proxy: ON
```

**Step 5: End-to-end smoke test (wait ~5 min for DNS)**

```bash
curl https://api.book.adrianwedd.com/slots?date=2026-03-03
# Expected: {"slots":["09:00","10:00",...]}
```

Open `https://book.adrianwedd.com` in a browser, pick a weekday, verify slots load, book a test slot, verify Google Calendar event appears and email arrives.

**Step 6: Add the booking URL to the Braintrust application**

Booking calendar URL: `https://book.adrianwedd.com`

---

## Done — v1 scope complete

Future (out of scope): timezone auto-detection, cancellation/rescheduling, admin view.
