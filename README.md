# Loom

Tell it what changed once. Your resume and portfolio update themselves.

Loom is a single dashboard backed by one profile (experience, projects,
skills, education). Everything else — resume PDF, your existing portfolio
site, AI-drafted updates — reads from or writes to that one profile. No
manual copy-pasting the same update into three places.

## Status: Phase 1 (this repo)

Phase 1 is the foundation: auth, database, the profile data model, a
`/api/profile` endpoint any portfolio can consume, and a dashboard to
edit your profile by hand.

- [x] Supabase schema (`supabase/schema.sql`)
- [x] `Profile` zod schema — single source of truth for the data shape
- [x] `/api/profile` — public JSON endpoint (bring your own portfolio)
- [x] Dashboard: manual profile/experience/projects/skills editor
- [x] Email magic-link auth

## Status: Phase 2 (this repo)

Phase 2 adds the AI update layer.

- [x] `/dashboard/updates` — type a plain-English note, Claude drafts a structured diff
- [x] `pending_updates` review queue — nothing writes until you approve it
- [x] `/api/updates/parse` — note → proposed create/update rows (matched against your existing data)
- [x] `/api/updates/apply` — approve writes the change, reject discards it

## Status: Phase 4 (this repo)

Phase 3 added resume generation:

- [x] `/dashboard/resume` — live preview, generated straight from your profile
- [x] `GET /api/resume/pdf` — downloadable PDF, no separate template to maintain

Resume rendering uses `@react-pdf/renderer` (pure JS) rather than LaTeX/Typst —
no binary to install, so it works out of the box on serverless deploys like
Vercel.

Phase 4 adds the portfolio publish flow — letting an existing portfolio in
any stack stay in sync without a full rebuild on every change:

- [x] Public read-only token — `/dashboard/portfolio` shows a capability URL
      (`/api/profile?token=...`) any separately-deployed site can fetch
- [x] Webhook on change — fires `{ section, action, id }` after every write,
      so the receiver can revalidate just that page, not the whole site
- [x] `/api/profile/external-sync` — inbound endpoint for edits made directly
      on the portfolio; lands as a pending suggestion, never a silent overwrite

## Status: Phase 5 (this repo) — feature-complete

Phase 5 adds Sync: the review queue, plus GitHub-scan.

- [x] `/dashboard/sync` — approve/reject queue for everything that isn't a
      direct manual edit or an AI-chat update: GitHub-scan finds, external
      edits pushed back via `/api/profile/external-sync`
- [x] GitHub scan — reads your public, non-fork repos (unauthenticated
      GitHub API, no token needed) and proposes new projects for repos not
      already linked in your profile; re-scanning skips repos already
      queued or already tracked
- [x] `/dashboard/updates` (Phase 2) now shows only AI-chat proposals;
      Sync shows GitHub and external-edit proposals — same underlying
      `pending_updates` table and the same approve/reject endpoint either way

That's the full loop from the original plan: manual editing, AI-parsed
updates, resume export, a portfolio-agnostic data API with change
webhooks, and reconciliation in both directions — nothing writes to your
real profile without you approving it first.

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Run `supabase/schema.sql` in the SQL editor.
3. In Authentication settings, enable Email OTP (magic link) sign-in.
4. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon
   key. `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are both
   optional — manual profile editing, resume generation, and your own
   signed-in `/api/profile` access all work without either. They only gate
   the AI update box and the public token / external-sync endpoints,
   respectively.
5. `npm install`
6. `npm run dev`

## How an update gets applied

1. You type a note on `/dashboard/updates` (e.g. "shipped Redis caching on Patchwork, cut p95 latency 40%").
2. Claude reads your existing profile, matches the note to an existing row or decides it's new, and proposes one or more structured diffs.
3. Each proposal lands in `pending_updates` with a plain-English summary — nothing is written to your real data yet.
4. You approve or reject each one from the same page. Approving writes it to the actual table; rejecting discards it.

## Using your profile data elsewhere

Signed in, your profile is available at `GET /api/profile`. From outside —
a separately deployed portfolio with no session — use the token shown on
`/dashboard/portfolio`:

```
GET /api/profile?token=<your public_token>
```

Any framework — Next.js, Astro, Hugo, plain HTML+fetch — can pull this at
build time or request time. Set a webhook URL on the same page and Loom
will call it after every change with `{ section, action, id }`, so your
site can revalidate just the affected page instead of rebuilding
everything. If your portfolio has its own edit UI and someone changes
something there, POST the change to `/api/profile/external-sync` with the
same token — it queues as a pending suggestion rather than overwriting
Loom's data.

## Repo structure

```
src/
  app/
    api/profile/               → GET: full profile as JSON (session or ?token=)
    api/profile/basics/        → PATCH: name, headline, summary, links
    api/profile/webhook/       → PATCH: save the publish webhook URL
    api/profile/token/         → POST: rotate the public read token
    api/profile/github/        → PATCH: save the GitHub username to scan
    api/profile/external-sync/ → POST: external edits → pending queue
    api/experience/            → POST / DELETE
    api/projects/              → POST / DELETE
    api/skills/                → POST / DELETE
    api/updates/parse/         → note → proposed diffs (via Claude)
    api/updates/apply/         → approve/reject a pending diff (any source)
    api/updates/pending/       → list unresolved diffs
    api/resume/pdf/            → GET: renders the profile to a downloadable PDF
    api/sync/github-scan/      → POST: scan public repos, queue new-project proposals
    auth/callback/             → magic-link session exchange
    dashboard/                 → profile editor, AI updates, resume preview, portfolio settings, sync queue
    login/                     → email sign-in
  lib/
    schema/profile.ts     → canonical Profile shape (zod)
    ai/parse-update.ts    → Claude call + prompt for note → structured diff
    ai/proposed-update.ts → zod schema for a proposed diff
    resume/template.tsx   → the resume layout, shared by preview and PDF download
    github/scan.ts         → fetch public repos, diff against existing projects
    webhook.ts             → fires the configured webhook after a write
    supabase/              → server, browser, and admin (service-role) clients
    profile.ts             → assembles Profile from Supabase tables, by session or public token
supabase/schema.sql        → Postgres schema + RLS policies
```

## Contributing

See `CONTRIBUTING.md` — setup, ground rules, and good first areas.

## License

MIT.
