# Security

## Trust model

- **Session auth** (Supabase email magic link) protects everything under
  `/dashboard` and the CRUD API routes. Row Level Security in
  `supabase/schema.sql` scopes every query to `auth.uid()`.
- **The public read token** (`public_token` on `profiles`, shown on
  `/dashboard/portfolio`) is a capability URL, not a secret login. Anyone
  with the token can read that profile's data via `GET /api/profile?token=`.
  Treat it like an unlisted link: fine to put in a portfolio's build
  config, not something to post publicly if you'd rather it stayed
  private. Rotate it from the Portfolio page if it leaks — this
  invalidates the old URL immediately.
- **`SUPABASE_SERVICE_ROLE_KEY`** bypasses Row Level Security entirely.
  It's used only in the two token-authenticated server routes
  (`/api/profile` token path, `/api/profile/external-sync`) and is never
  sent to the browser. Do not expose it via a `NEXT_PUBLIC_` prefix or
  log it.
- **The webhook URL** you configure is called with a small JSON payload
  (`{ section, action, id, changed_at }`) — no profile data, no secrets.
  Loom does not sign these requests. If you need to verify the sender,
  put a shared-secret query param or header check on your receiving
  endpoint.
- **`/api/profile/external-sync`** accepts the same public token as
  read access and queues changes as `pending_updates` — it never writes
  directly. Worst case for a leaked token is someone filling your review
  queue with junk proposals, which you'd reject.
- **AI provider keys** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
  `GEMINI_API_KEY`, etc.) are server-side only, used exclusively in
  `src/lib/ai/providers/`.

## Reporting a vulnerability

Open a private security advisory on GitHub (Security tab → "Report a
vulnerability") rather than a public issue. If that's not available on
your fork, open an issue with minimal detail asking for a private
channel — don't post exploit details publicly before a fix is out.
