# Loom

Tell it what changed once. Your resume and portfolio update themselves.

Loom is a dashboard backed by one profile — experience, projects, skills,
education. Everything else reads from or writes to that one place: a
generated resume PDF, your existing portfolio (any stack), and an AI layer
that turns a casual note into a structured update. Nothing writes to your
real data without you approving it first.

## Features

- **Profile** — the source of truth. Add, edit, and delete everything by
  hand; nothing else in Loom requires this to work any differently.
- **Updates** — type what changed in plain English ("shipped Redis caching
  on Patchwork, cut p95 latency 40%"). An LLM matches it against your
  existing data and drafts a diff. You approve or reject before anything
  is written.
- **Resume** — a live preview and a one-click PDF, generated straight from
  your profile. No template file to keep in sync by hand.
- **Portfolio** — a public, token-authenticated JSON endpoint
  (`/api/profile`) any framework can read, plus a webhook that fires with
  exactly what changed so your site can revalidate one page instead of
  rebuilding everything.
- **Sync** — the review queue for anything that isn't manual editing or an
  AI-chat update: a scan of your public GitHub repos proposing new
  projects, and an inbound endpoint for edits made directly on your
  portfolio to flow back for review.

Every automated suggestion — AI-parsed, GitHub-scanned, or synced from
elsewhere — lands in a `pending_updates` queue and waits for a human
approval before touching real data.

## Bring your own model

The Updates feature works with Claude, GPT, Gemini, or a fully local model
— Ollama, LM Studio, llama.cpp's server, vLLM, anything that speaks the
OpenAI chat-completions format. Pick one in `.env.local`; see
[Configuration](#configuration) below. Everything except this one feature
works with no AI provider configured at all.

## Quick start

```bash
git clone <your-fork-url> loom
cd loom
npm install
cp .env.example .env.local   # fill in at least the two Supabase values
npm run dev
```

Open `http://localhost:3000`. For the full setup — including the Supabase
schema, auth configuration, and a first end-to-end smoke test — see
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Configuration

Two environment variables are required; everything else is opt-in and
degrades gracefully when absent. Full reference with defaults and
examples: [`.env.example`](.env.example).

| Variable | Required | Enables |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Everything — auth, database |
| `AI_PROVIDER` + one provider's keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `LOCAL_AI_BASE_URL`/`LOCAL_AI_MODEL`) | No | `/dashboard/updates` natural-language parsing |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Public `/api/profile?token=` reads, `/api/profile/external-sync` |
| GitHub username (set in-app on `/dashboard/sync`) | No | GitHub repo scanning — no key needed, public API only |

## How data flows

```
                      ┌─────────────┐
  you, by hand ───────▶             │
                      │   Profile    │──▶ /dashboard/resume ──▶ PDF
  AI chat (any model)─▶  (Postgres,  │
       ▲              │   Supabase)  │──▶ /api/profile?token= ──▶ your portfolio (any stack)
       │              │             │          │
  GitHub scan ─────────▶             │          ▼
       ▲              └─────────────┘     webhook on change
       │                     ▲            (revalidate one page,
  external edit ─────────────┘             not a full rebuild)
  (from your portfolio,
   via /api/profile/external-sync)
```

AI chat, GitHub scan, and external edits never write directly — they all
land in `pending_updates` and go through `/dashboard/updates` or
`/dashboard/sync` for a human approve/reject.

## API reference

**`GET /api/profile`** — the full profile as JSON. Signed-in requests
return your own profile; `?token=<public_token>` (shown on
`/dashboard/portfolio`) authenticates an external site with no session.

**Webhook** (configured on `/dashboard/portfolio`) — POSTed after every
write: `{ section, action, id?, changed_at }`. `section` is one of
`profile | experience | projects | skills | education`; `action` is
`create | update | delete`. Use it to call `revalidatePath` (or
equivalent) for just that section instead of rebuilding the whole site.

**`POST /api/profile/external-sync`** — the other direction. Body:
`{ token, changes: [{ target_table, action, target_id, payload, diff_summary }] }`.
Queues each change for review on `/dashboard/sync`; never writes directly.

Full route list: [Repo structure](#repo-structure) below.

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
    api/updates/parse/         → note → proposed diffs (via configured AI provider)
    api/updates/apply/         → approve/reject a pending diff (any source)
    api/updates/pending/       → list unresolved diffs
    api/resume/pdf/            → GET: renders the profile to a downloadable PDF
    api/sync/github-scan/      → POST: scan public repos, queue new-project proposals
    auth/callback/             → magic-link session exchange
    dashboard/                 → profile editor, AI updates, resume preview, portfolio settings, sync queue
    login/                     → email sign-in
  lib/
    schema/profile.ts          → canonical Profile shape (zod)
    ai/parse-update.ts         → prompt + orchestration for note → structured diff
    ai/proposed-update.ts      → zod schema for a proposed diff
    ai/providers/               → Anthropic, OpenAI, Gemini, local, custom — pick at runtime
    resume/template.tsx        → the resume layout, shared by preview and PDF download
    github/scan.ts              → fetch public repos, diff against existing projects
    webhook.ts                  → fires the configured webhook after a write
    supabase/                   → server, browser, and admin (service-role) clients
    profile.ts                  → assembles Profile from Supabase tables, by session or public token
supabase/schema.sql             → Postgres schema + RLS policies
docs/
  DEPLOYMENT.md                 → step-by-step: local setup, hosted deploy, going to production
  TESTING.md                    → manual test pass for every feature before you ship
```

## Testing and deployment

- [`docs/TESTING.md`](docs/TESTING.md) — a manual pass through every
  feature, what "working" looks like for each, and what to check before
  you consider it production-ready.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — local setup, deploying to
  Vercel (or any Node host), and the production checklist (RLS, secrets,
  rotating the public token, etc).

## Design notes

- Resume rendering uses `@react-pdf/renderer` (pure JS) instead of
  LaTeX/Typst — no binary to install, so it works on serverless deploys
  like Vercel out of the box.
- No portfolio app is bundled here on purpose — Loom is portfolio-agnostic
  by design. Point any existing site (any framework) at `/api/profile`.
- `pending_updates` is the one write path for anything automated. If
  you're adding a new suggestion source, write to that table, not
  directly to `experience` / `projects` / `skills` / `education` — see
  `CONTRIBUTING.md`.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) — setup, ground rules, and good
first areas.

## Security

See [`SECURITY.md`](SECURITY.md) for the token/webhook trust model and
how to report a vulnerability.

## License

MIT — see [`LICENSE`](LICENSE).
