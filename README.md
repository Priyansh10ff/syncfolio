# Syncfolio

Tell it what changed once. Your resume and portfolio update themselves.

Syncfolio is a dashboard backed by one profile — experience, projects, skills,
education. Everything else reads from or writes to that one place: a
generated resume PDF, your existing portfolio (any stack), and an AI layer
that turns a casual note into a structured update. Nothing writes to your
real data without you approving it first.

## Features

- **Profile** — the source of truth. Add, edit, and delete everything by
  hand; nothing else in Syncfolio requires this to work any differently.
  Each row has two switches: show on resume, show on portfolio.
- **Updates** — type what changed in plain English ("shipped Redis caching
  on Patchwork, cut p95 latency 40%"). An LLM matches it against your
  existing data and drafts a diff. You approve or reject before anything
  is written, and can undo the last approval.
- **Resume** (optional module) — a live preview and a one-click PDF,
  generated from the rows marked for the resume.
- **Portfolio** (optional module) — publishes the rows marked for the
  portfolio to a token-authenticated JSON endpoint (`/api/portfolio`) any
  framework can read. Approved updates can auto-sync, or wait until you
  publish. A webhook fires once per publish listing what changed, so your
  site revalidates only those pages.
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
git clone <your-fork-url> syncfolio
cd syncfolio
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
| `SUPABASE_SERVICE_ROLE_KEY` | No | Public `/api/portfolio?token=` reads, `/api/profile/external-sync` |
| GitHub username (set in-app on `/dashboard/sync`) | No | GitHub repo scanning — no key needed, public API only |

## How data flows

```
                      ┌─────────────┐
  you, by hand ───────▶             │──▶ resume view ──▶ /dashboard/resume ──▶ PDF
                      │   Profile    │
  AI chat (any model)─▶   (live)     │──▶ portfolio view ──▶ publish ──▶ snapshot
       ▲              │             │     (auto on approval,        │
  GitHub scan ─────────▶             │      or manual)               ├─▶ /api/portfolio?token=
       ▲              └─────────────┘                               └─▶ webhook (once per publish)
       │                     ▲
  external edit ─────────────┘
  (from your portfolio, via /api/profile/external-sync)
```

AI chat, GitHub scan, and external edits never write directly — they all
land in `pending_updates` and go through `/dashboard/updates` or
`/dashboard/sync` for a human approve/reject.

## API reference

**`GET /api/portfolio?token=<public_token>`** — the latest published
portfolio as JSON, for external sites with no session. Returns only rows
marked for the portfolio. 404 until you publish once. (Old
`/api/profile?token=` links redirect here.)

**Webhook** (configured on `/dashboard/portfolio`) — POSTed once per
publish: `{ published_at, changes: [{ section, action, id? }] }`.
`section` is one of `profile | experience | projects | skills | education`;
`action` is `create | update | delete`. Use it to call `revalidatePath`
(or equivalent) for just those sections instead of rebuilding the site.

**`POST /api/profile/external-sync`** — the other direction. Body:
`{ token, changes: [{ target_table, action, target_id, payload, diff_summary }] }`
(`action`: `create | update | delete`, max 50 changes). Queues each change
for review on `/dashboard/sync`; never writes directly.

Full route list: [Repo structure](#repo-structure) below.

## Repo structure

```
src/
  app/
    api/profile/               → GET: live profile + settings (session)
    api/portfolio/             → GET: published portfolio (?token=)
    api/portfolio/pending/     → GET: unpublished changes
    api/portfolio/publish/     → POST: publish a snapshot, fire the webhook
    api/settings/              → GET / PATCH: modules and auto-sync default
    api/profile/basics/        → PATCH: name, headline, summary, links
    api/profile/webhook/       → PATCH: save the publish webhook URL
    api/profile/token/         → POST: rotate the public read token
    api/profile/github/        → PATCH: save the GitHub username to scan
    api/profile/external-sync/ → POST: external edits → pending queue
    api/experience/            → POST / PATCH / DELETE
    api/projects/              → POST / PATCH / DELETE
    api/skills/                → POST / PATCH / DELETE
    api/education/             → POST / PATCH / DELETE
    api/updates/parse/         → note → proposed diffs (via configured AI provider)
    api/updates/apply/         → approve/reject a pending diff (any source)
    api/updates/pending/       → list unresolved diffs
    api/updates/undo/          → POST: undo the most recent approval
    api/updates/history/       → GET: recently resolved diffs
    api/resume/pdf/            → GET: renders the profile to a downloadable PDF
    api/sync/github-scan/      → POST: scan public repos, queue new-project proposals
    auth/callback/             → magic-link session exchange, creates the profile row
    auth/signout/              → POST: sign out
    dashboard/                 → profile editor, AI updates, resume preview, portfolio settings, sync queue
    login/                     → email sign-in
  lib/
    schema/profile.ts          → canonical Profile shape (zod)
    ai/parse-update.ts         → prompt + orchestration for note → structured diff
    ai/proposed-update.ts      → zod schema for a proposed diff
    ai/providers/               → Anthropic, OpenAI, Gemini, local, custom — pick at runtime
    resume/template.tsx        → the resume layout, shared by preview and PDF download
    github/scan.ts              → fetch public repos, diff against existing projects
    webhook.ts                  → fires the configured webhook after a publish
    modules.ts                  → resume view and portfolio view of the profile
    portfolio/publish.ts        → diff vs last snapshot, publish, webhook
    updates/apply.ts            → apply / revert a proposal (allowlisted fields)
    api/                        → route helpers: auth, body parsing, CRUD factory
    supabase/                   → server, browser, and admin (service-role) clients
    profile.ts                  → assembles Profile from Supabase tables, by session or public token
supabase/schema.sql             → Postgres schema + RLS policies (fresh setups)
supabase/migrations/            → incremental changes for existing databases
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
- No portfolio app is bundled here on purpose — Syncfolio is portfolio-agnostic
  by design. Point any existing site (any framework) at `/api/portfolio`.
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
