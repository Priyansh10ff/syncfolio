# Contributing to Loom

Thanks for taking a look. This is a young project — happy to have help.

## Setup

Follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (local setup section).
You'll need a free Supabase project. An AI provider key and
`SUPABASE_SERVICE_ROLE_KEY` are optional and only needed for the AI
update box and the public/external-sync endpoints respectively — see
`.env.example` for the full list, including local-model options.

## Ground rules

- **Nothing writes to a user's real data without an explicit approve.**
  Every AI-parsed, GitHub-scanned, or externally-synced change goes
  through `pending_updates` and a review step. If you're adding a new
  source of automated suggestions, follow this pattern — don't write
  directly to `experience` / `projects` / `skills` / `education`.
- **Optional integrations degrade gracefully.** The app should build and
  the manual-editing path should work with only the two required
  Supabase env vars set. If you add a feature that needs a new key,
  gate it the way `isAIConfigured()` and `createAdminClient()` do —
  check for the key, fail with a clear message, don't crash the rest
  of the app.
- **The `Profile` zod schema in `src/lib/schema/profile.ts` is the
  contract.** If you change its shape, update `supabase/schema.sql`,
  the resume template, and the `/api/profile` consumers together.
- **AI providers are interchangeable.** `src/lib/ai/providers/` defines
  one `AIProvider` interface (`complete({ system, user, maxTokens })`);
  `parse-update.ts` doesn't know or care which one is active. Adding a
  new provider means adding one file there and registering it in
  `providers/index.ts` — nothing else should need to change.

## Before opening a PR

```bash
npm install
npm run build   # type-checks + catches broken routes
npm run lint
```

Both run in CI on every PR — a red build or lint won't get merged. For
anything touching more than one feature area, also run through
[`docs/TESTING.md`](docs/TESTING.md) before requesting review.

## Good first areas

- Additional resume templates (swap in `src/lib/resume/template.tsx`,
  or add a template picker)
- A public read-only portfolio preview page bundled with Loom itself
  (currently intentionally left out — bring-your-own-portfolio is the
  default)
- More GitHub-scan signal (README-derived bullets, commit-based metrics)
- A real automated test suite (`docs/TESTING.md` is the manual version
  of what this should cover)
- Rate limiting on `/api/updates/parse` for multi-user deployments

## Reporting bugs / proposing features

Open an issue. For anything nontrivial, a short proposal before a big
PR saves both of us time.
