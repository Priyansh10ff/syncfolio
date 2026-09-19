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
- [ ] Phase 2 — AI chat updates ("shipped X, add it" → structured diff)
- [ ] Phase 3 — Resume generation (Typst/LaTeX → PDF)
- [ ] Phase 4 — Portfolio publish flow (webhooks, ISR revalidate)
- [ ] Phase 5 — Sync: GitHub-scan suggestions + external-edit reconciliation, review queue

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Run `supabase/schema.sql` in the SQL editor.
3. In Authentication settings, enable Email OTP (magic link) sign-in.
4. Copy `.env.example` to `.env.local` and fill in your Supabase URL + anon key.
5. `npm install`
6. `npm run dev`

## Using your profile data elsewhere

Once signed in, your profile is available as JSON:

```
GET /api/profile
```

Any portfolio — Next.js, Astro, Hugo, plain HTML — can fetch this at
build time or request time. Phase 4 adds a public read-only token so
this works from a separately deployed site without a session, plus a
webhook so your site can trigger a targeted rebuild (not a full
redeploy) when something changes.

## Repo structure

```
src/
  app/
    api/profile/         → GET: full profile as JSON
    api/profile/basics/  → PATCH: name, headline, summary, links
    api/experience/       → POST / DELETE
    api/projects/         → POST / DELETE
    api/skills/           → POST / DELETE
    auth/callback/        → magic-link session exchange
    dashboard/            → profile editor + phase 2-5 stubs
    login/                → email sign-in
  lib/
    schema/profile.ts     → canonical Profile shape (zod)
    supabase/             → server + browser clients
    profile.ts            → assembles Profile from Supabase tables
supabase/schema.sql        → Postgres schema + RLS policies
```

## License

MIT.
