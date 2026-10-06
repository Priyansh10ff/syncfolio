# Syncfolio — Technical Reference

How Syncfolio is put together: stack, folder layout, data model, API surface,
and the rules the codebase follows. For the why and the who, see
[`PRODUCT.md`](PRODUCT.md).

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components for pages, route handlers for the API. Read `node_modules/next/dist/docs/` before relying on older Next.js conventions. |
| Language | TypeScript 5 | Strict mode. |
| UI | React 19, Tailwind CSS 4, lucide-react | Theme tokens live in `src/app/globals.css` as `--sf-*` CSS variables. |
| Database | Supabase Postgres | Row Level Security on every table. |
| Auth | Supabase Auth (email magic link) | Cookie sessions via `@supabase/ssr`. |
| Validation | zod 4 | Every external shape (profile, AI output, sync payloads) has a schema. |
| PDF | `@react-pdf/renderer` | Pure JS, no LaTeX/Typst binary, works on serverless. |
| AI | Pluggable provider layer | Anthropic SDK, plus OpenAI-compatible HTTP for OpenAI, Gemini, local, and custom hosts. |
| CI | GitHub Actions | `npm ci`, `npm run lint`, `npm run build` on push and PR to `main`. |
| Hosting | Vercel or any Node host | No native dependencies. |

## Folder structure

```
.
├── .github/
│   ├── workflows/ci.yml          lint + build on every push/PR
│   ├── ISSUE_TEMPLATE/           bug and feature templates
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── PRODUCT.md                what Syncfolio is, who it's for, why
│   ├── TECHNICAL.md              this file
│   ├── DEPLOYMENT.md             local setup, deploy, production checklist
│   └── TESTING.md                manual test pass
├── public/                       static assets
├── supabase/
│   └── schema.sql                tables, constraints, RLS policies
├── src/
│   ├── middleware.ts             refreshes the Supabase session; guards /dashboard
│   ├── app/
│   │   ├── page.tsx              landing page
│   │   ├── layout.tsx            root layout
│   │   ├── globals.css           Tailwind + theme tokens
│   │   ├── login/                magic-link sign-in
│   │   ├── auth/callback/        code → session exchange, creates profile row
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        sidebar nav + sign out
│   │   │   ├── profile/          manual editor (source of truth)
│   │   │   ├── updates/          AI note box + review queue
│   │   │   ├── resume/           live preview + PDF download (resume module)
│   │   │   ├── portfolio/        publish, unpublished changes, token, webhook (portfolio module)
│   │   │   ├── settings/         module toggles, auto-sync default
│   │   │   └── sync/             GitHub scan + external-sync review queue
│   │   └── api/
│   │       ├── profile/          GET live profile (session only)
│   │       │   ├── basics/       PATCH name, headline, summary, links
│   │       │   ├── token/        POST rotate public token
│   │       │   ├── webhook/      PATCH webhook URL
│   │       │   ├── github/       PATCH GitHub username
│   │       │   └── external-sync/ POST inbound edits → pending queue
│   │       ├── portfolio/        GET published snapshot (?token=)
│   │       │   └── publish/      POST publish live profile → new snapshot
│   │       ├── settings/         PATCH module toggles, auto-sync default
│   │       ├── experience/       POST / PATCH / DELETE
│   │       ├── projects/         POST / PATCH / DELETE
│   │       ├── skills/           POST / PATCH / DELETE
│   │       ├── education/        POST / PATCH / DELETE
│   │       ├── updates/
│   │       │   ├── parse/        note → proposed diffs (AI)
│   │       │   ├── pending/      list unresolved diffs
│   │       │   └── apply/        approve / reject a diff
│   │       ├── sync/github-scan/ scan public repos → pending queue
│   │       └── resume/pdf/       render profile → PDF
│   └── lib/
│       ├── schema/
│       │   ├── profile.ts        canonical Profile shape (zod)
│       │   └── pending-update-row.ts
│       ├── profile.ts            assemble live Profile; ensureProfile
│       ├── modules.ts            module flags; resume/portfolio views of a Profile
│       ├── portfolio/publish.ts  build snapshot, diff vs last, fire webhook
│       ├── current-profile-id.ts resolve signed-in user's profile id
│       ├── webhook.ts            fire-and-forget change notification
│       ├── ai/
│       │   ├── parse-update.ts   system prompt + profile summary + JSON parse
│       │   ├── proposed-update.ts zod schema for AI proposals
│       │   └── providers/        anthropic, openai, gemini, local, custom
│       ├── github/scan.ts        fetch public repos, diff against projects
│       ├── resume/template.tsx   resume layout shared by preview and PDF
│       └── supabase/
│           ├── server.ts         cookie-bound server client (RLS applies)
│           ├── client.ts         browser client
│           └── admin.ts          service-role client (server only)
├── .env.example                  every env var, documented
├── AGENTS.md / CLAUDE.md         instructions for coding agents
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md
```

## Data model

All tables live in `supabase/schema.sql`. One auth user owns exactly one
`profiles` row; every other table hangs off `profile_id`.

```
auth.users 1──1 profiles 1──* experience
                         1──* projects
                         1──* skills
                         1──* education
                         1──* pending_updates
                         1──* portfolio_snapshots
```

| Table | Key columns |
|---|---|
| `profiles` | `user_id` (unique), `name`, `headline`, `summary`, `location`, `email`, `links` jsonb, `public_token` uuid (unique), `webhook_url`, `github_username`, `resume_enabled` bool, `portfolio_enabled` bool, `portfolio_auto_sync` bool |
| `experience` | `role`, `org`, `location`, `start_date` (`YYYY-MM`), `end_date` (null = present), `bullets` jsonb, `tags` jsonb, `source`, `show_on_resume`, `show_on_portfolio` |
| `projects` | `name`, `description`, `bullets`, `links`, `tags`, `metrics` (all jsonb), `featured`, `source`, `show_on_resume`, `show_on_portfolio`, portfolio-only: `slug`, `long_description` (markdown), `cover_image_url` |
| `skills` | `name`, `category`, `level` (`learning` / `comfortable` / `strong`), `show_on_resume`, `show_on_portfolio` |
| `education` | `institution`, `degree`, `start_date`, `end_date`, `notes`, `show_on_resume`, `show_on_portfolio` |
| `pending_updates` | `source` (`ai_chat` / `github_scan` / `external_sync`), `target_table`, `payload` jsonb, `diff_summary`, `status` (`pending` / `approved` / `rejected`) |
| `portfolio_snapshots` | `data` jsonb (the published portfolio view), `published_at`, `changes` jsonb (what differed from the previous snapshot) |

### Two modules, one profile

- `resume_enabled` and `portfolio_enabled` switch each module on or off.
  At least one stays on. A disabled module disappears from the nav and
  its routes return `404`.
- `show_on_resume` / `show_on_portfolio` default to `true` and decide
  which rows each output includes.
- The **resume view** is the live profile filtered by `show_on_resume`.
  It never reads portfolio-only fields.
- The **portfolio view** is the live profile filtered by
  `show_on_portfolio`, including portfolio-only fields. It is frozen into
  `portfolio_snapshots` on publish; external sites only ever see the
  latest snapshot.

`source` on content rows records where a row came from (`manual`, `ai`,
`external`). `pending_updates.payload` carries the proposed fields plus
two control keys, `__action` (`create` / `update`) and `__target_id`.

The TypeScript mirror of this model is `src/lib/schema/profile.ts`, with
`ResumeView` and `PortfolioView` derived from it in `lib/modules.ts`.

## How data flows

```
 manual edit ─────────────────────────────────┐
                                              ▼
 AI note ─────▶ updates/parse ──┐          ┌─────────┐ ──▶ resume view ──▶ preview / PDF
 GitHub scan ─▶ sync/github-scan├▶ pending ▶ apply ──▶ │ profile │
 portfolio ───▶ external-sync ──┘  _updates (approve)  │  (live) │ ──▶ portfolio view
                                              │       └─────────┘          │
                                   sync_portfolio?                         │
                                     yes ─────────────▶ publish ◀── manual publish
                                                           │
                                                 portfolio_snapshots
                                                           │
                                     /api/portfolio?token= ◀┴▶ webhook → site revalidates
```

Rules:

1. **Manual edits** from the dashboard write directly (the user is the
   reviewer).
2. **Every automated source** writes only to `pending_updates`. The
   single path from there to real tables is `POST /api/updates/apply`.
3. **The resume is always live.** Any approved or manual change shows in
   the resume immediately.
4. **The portfolio is published, not live.** It changes only when a
   snapshot is published: automatically after an approval with
   `sync_portfolio: true`, or manually from the Portfolio page.
5. **Publishing fires the webhook** once, listing every section that
   changed since the previous snapshot. Ordinary writes never fire it.
6. **Unpublished changes** are the diff between the current portfolio
   view and the latest snapshot, shown on the Portfolio page.

## API reference

All dashboard routes require a session and resolve `profile_id` from it.
Token routes use the service-role client and look the profile up by
`public_token`.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/profile` | session | Live profile JSON |
| GET | `/api/portfolio` | `?token=` | Latest published portfolio snapshot |
| GET | `/api/portfolio/pending` | session | Unpublished changes (live view vs last snapshot) |
| POST | `/api/portfolio/publish` | session | Publish a new snapshot and fire the webhook |
| PATCH | `/api/settings` | session | `resume_enabled`, `portfolio_enabled`, `portfolio_auto_sync` |
| PATCH | `/api/profile/basics` | session | Update name, headline, summary, location, email, links |
| POST | `/api/profile/token` | session | Rotate public token |
| PATCH | `/api/profile/webhook` | session | Set webhook URL |
| PATCH | `/api/profile/github` | session | Set GitHub username |
| POST | `/api/profile/external-sync` | token in body | Queue inbound changes |
| POST / PATCH / DELETE | `/api/experience` | session | CRUD |
| POST / PATCH / DELETE | `/api/projects` | session | CRUD |
| POST / PATCH / DELETE | `/api/skills` | session | CRUD |
| POST / PATCH / DELETE | `/api/education` | session | CRUD |
| POST | `/api/updates/parse` | session | Note → proposed diffs |
| GET | `/api/updates/pending` | session | Unresolved diffs |
| POST | `/api/updates/apply` | session | `{ id, decision: "approve" \| "reject", sync_portfolio?: boolean }` (defaults to `portfolio_auto_sync`) |
| POST | `/api/sync/github-scan` | session | Queue new public repos as projects |
| GET | `/api/resume/pdf` | session | Download resume PDF (resume module) |

### Webhook payload

Sent once per publish:

```json
{
  "published_at": "ISO-8601",
  "changes": [
    { "section": "projects", "action": "update", "id": "uuid" },
    { "section": "skills", "action": "create", "id": "uuid" }
  ]
}
```

`section`: `profile | experience | projects | skills | education`.
`action`: `create | update | delete`.

### External sync body

```json
{
  "token": "<public_token>",
  "changes": [
    {
      "target_table": "skills",
      "action": "create",
      "target_id": null,
      "payload": { "name": "Rust" },
      "diff_summary": "Added Rust"
    }
  ]
}
```

## AI layer

- `lib/ai/providers/types.ts` defines one interface:
  `complete({ system, user, maxTokens }) → string`.
- `resolveProviderId()` uses `AI_PROVIDER` if set, otherwise the first
  provider with credentials present.
- `parse-update.ts` sends a compact profile summary (ids + labels) and the
  user's note, strips any code fences, parses JSON, and validates with
  `parseResultSchema`. Invalid output becomes a readable error, not a
  crash.
- The prompt forbids invented facts, requires real ids for updates, and
  returns `clarification_needed` instead of guessing on vague notes.
- Missing provider config throws `AI_NOT_CONFIGURED`, which the Updates
  page shows as a banner. Nothing else depends on AI.

## Auth and security model

- **Session auth.** Magic link → `/auth/callback` exchanges the code,
  creates the `profiles` row if missing, then redirects to the dashboard.
  Middleware refreshes the session on every request and redirects
  unauthenticated `/dashboard` visits to `/login`.
- **RLS.** Every table allows access only where
  `auth.uid()` owns the parent profile. The server client runs as the
  user, so RLS is the last line of defence even if a route has a bug.
- **Service-role key** is used only in `lib/supabase/admin.ts` and only
  for token-authenticated routes. Never exposed with `NEXT_PUBLIC_`.
- **Public token** is a capability: it grants read of the published
  portfolio snapshot and the right to *propose* changes. It never reads
  the live profile or anything hidden from the portfolio. It can never write directly. Rotating
  it on `/dashboard/portfolio` kills the old one instantly.
- **Field allowlists.** Approved payloads are filtered to the editable
  columns of their target table, so a proposal can never set
  `profile_id`, `user_id`, `public_token`, or `webhook_url`.
- **Webhooks** are fire-and-forget and never block a write.

See [`SECURITY.md`](../SECURITY.md) for the full trust model.

## Environment variables

| Variable | Required | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | everything |
| `SUPABASE_SERVICE_ROLE_KEY` | no | `?token=` reads, external sync |
| `AI_PROVIDER` | no | forces a provider |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | no | Claude |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | no | OpenAI |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | no | Gemini |
| `LOCAL_AI_BASE_URL`, `LOCAL_AI_MODEL`, `LOCAL_AI_API_KEY`, `LOCAL_AI_JSON_MODE` | no | Ollama, LM Studio, llama.cpp, vLLM |
| `CUSTOM_AI_BASE_URL`, `CUSTOM_AI_MODEL`, `CUSTOM_AI_API_KEY` | no | OpenRouter, Groq, Together, Azure |

Full commented reference: [`.env.example`](../.env.example).

## Conventions

- **One write path for automation.** New suggestion sources insert into
  `pending_updates`. They never touch content tables directly.
- **zod at every boundary.** Request bodies, AI output, and sync payloads
  are parsed before use.
- **Optional means optional.** Removing any non-Supabase env var must
  leave the app building and running, with a clear message where a
  feature is off.
- **Modules are independent.** Resume code never imports portfolio code
  and the reverse. Both read the profile through `lib/modules.ts`.
- **Shared rendering.** The resume preview and the PDF use the same
  `resume/template.tsx`, so what you see is what downloads.
- **Scope every query by `profile_id`** in addition to RLS.

## Scripts

```bash
npm run dev     # local dev server on :3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```
