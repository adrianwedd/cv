# Booking Site Design — book.adrianwedd.com
_2026-02-28_

## Overview

A custom booking site at `book.adrianwedd.com` backed by Google Calendar. Users pick a 30-minute slot, fill in their details, and the system creates a Google Calendar event and sends confirmation emails — all without leaving the page.

## Architecture

```
book.adrianwedd.com          api.book.adrianwedd.com
(GitHub Pages)               (Cloudflare Worker)
     │                              │
     │  GET /slots?date=YYYY-MM-DD  │
     │ ─────────────────────────── ▶│─── Google Calendar freebusy API
     │ ◀─────────────────────────── │
     │                              │
     │  POST /book {name,email,     │
     │    slot,note}                │
     │ ─────────────────────────── ▶│─── Google Calendar events.insert
     │                              │─── Resend (confirmation emails)
     │ ◀─────────────────────────── │
```

## Frontend — `book.adrianwedd.com`

Single `index.html`. Same Footnotes dark palette as `dashboard.html` in the job-search repo:
- `--bg: #070a0f`, `--surface: #0d1117`, `--accent: #8ac7d9`

### UX flow (four in-place steps, no page navigation)

1. **Landing** — wordmark, one-line intro, "Pick a time" CTA
2. **Calendar** — month grid; clicking a day calls `GET /slots` and renders available times as pills (e.g. `9:00 am`, `10:00 am` … `4:00 pm`)
3. **Details** — name, email, optional note field
4. **Confirmation** — success state with the booked time, add-to-calendar link

### Slot generation

- Hours 9:00–16:00 AEST (last slot ends 16:30, within 17:00 cutoff)
- 30-min slots; 30-min buffers are enforced by Google Calendar — freebusy API reflects them automatically
- Weekdays only; no slots if the whole day is free but it's a public holiday (out of scope v1)

## Backend — Cloudflare Worker

**Routes:**

`GET /slots?date=YYYY-MM-DD`
- Calls Google Calendar freebusy API for 09:00–17:00 AEST on the given date
- Generates candidate slots every 30 min from 09:00
- Returns slots not overlapping any busy period as `{ slots: ["09:00", "10:00", …] }`

`POST /book`
- Body: `{ name, email, slot (ISO datetime), note? }`
- Creates a Google Calendar event: Adrian + guest as attendees, 30-min duration
- Calls Resend API to send confirmation emails to both parties
- Returns `{ ok: true, eventId }`

**Auth:** Google service account (JSON key stored as Worker secret `GOOGLE_SA_KEY`). Worker mints a JWT, exchanges for an access token on each request.

**Email:** Resend API (`RESEND_API_KEY` secret). Two emails: one to Adrian, one to the booker.

**CORS:** Worker allows `https://book.adrianwedd.com` origin only.

## Repos & Deployment

| Concern | Location |
|---|---|
| Frontend | New repo `adrianwedd/book.adrianwedd.com`, GitHub Pages |
| Worker | New Cloudflare Worker `book-api` via Wrangler |
| Secrets | Cloudflare Worker secrets (not committed) |
| CNAME | `book.adrianwedd.com` → GitHub Pages; `api.book.adrianwedd.com` → Worker |

## One-time Google Setup (manual)

1. Google Cloud project → enable Calendar API
2. Create service account → download JSON key
3. Share Adrian's calendar with the service account email (editor)
4. Create Resend account → get API key

## Out of scope (v1)

- Timezone detection/conversion (assume AEST, display clearly)
- Multiple duration options
- Cancellation / rescheduling flow
- Admin dashboard
