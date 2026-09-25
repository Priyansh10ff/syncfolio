# Manual testing

There's no automated test suite yet (see `CONTRIBUTING.md` — good first
area). Until there is, run this pass after any change that touches more
than one file, and always before deploying. ~15 minutes end to end.

Do this against a **test Supabase project**, not one with real data, the
first time through.

## 0. Setup sanity

- [ ] `npm run build` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run dev` starts with no console errors on `http://localhost:3000`

## 1. Auth

- [ ] `/login` → enter an email → "Check your inbox" message appears
- [ ] Click the magic link from your inbox → lands on `/dashboard/profile`
      signed in
- [ ] Refresh the page — still signed in (session cookie persists)
- [ ] Open dev tools → Application → Cookies — confirm a Supabase auth
      cookie exists and no service-role key or secret appears anywhere
      in client-side storage or the page source

## 2. Profile (manual CRUD)

On `/dashboard/profile`:

- [ ] Fill in name, headline, summary, location, email → **Save basics**
      → refresh the page → values persisted
- [ ] Add an experience entry (role, org, start date) → appears in the
      list immediately, no reload needed
- [ ] Delete that experience entry → disappears immediately
- [ ] Add a project (name, description) → appears in the list
- [ ] Delete it
- [ ] Add a skill → appears; delete it → disappears
- [ ] Reload the page — everything you *didn't* delete is still there

## 3. Resume

On `/dashboard/resume`, with at least a name and one experience/project
saved:

- [ ] Live preview renders (not blank, not an error state)
- [ ] Add a new project on the Profile page, come back to Resume — the
      preview reflects it without any extra step
- [ ] Click **Download PDF** — a PDF downloads, opens correctly, and the
      content matches what's in the preview
- [ ] With an empty profile (new test account, nothing filled in), the
      Resume page shows the "add your name and experience" message
      instead of erroring

## 4. Updates (AI)

Set up **one** AI provider in `.env.local` first (see `.env.example`).

- [ ] With no provider configured: type a note on `/dashboard/updates`
      → submit → see the "not configured" banner, not a crash or a
      silent failure
- [ ] With a provider configured: type something concrete, e.g. "Added
      Redis caching to my trading bot project, cut latency 40%" (adjust
      to match a project you actually have) → **Draft update** → a
      pending item appears with a sensible one-line summary
- [ ] Click **Approve** → the item disappears from the queue → go to
      Profile → the change is actually there (new bullet/metric on the
      right project)
- [ ] Draft another update, click **Reject** → disappears from the
      queue → go to Profile → confirm nothing changed
- [ ] Try a vague note ("stuff happened at work") → confirm it either
      asks for clarification or proposes nothing, rather than
      hallucinating a change

If testing a **local model**: also confirm the error message you get on
a malformed-JSON response is legible (points at `docs/DEPLOYMENT.md`),
not a raw stack trace.

## 5. Portfolio (publish flow)

On `/dashboard/portfolio`:

- [ ] The data endpoint URL is shown with a token (requires
      `SUPABASE_SERVICE_ROLE_KEY` to be set — if it's not, confirm the
      page says so clearly rather than showing a broken URL)
- [ ] Copy the URL, open it in a new incognito tab (no session) — you
      get your profile JSON back
- [ ] Click **Regenerate token** → the old URL now returns 404/invalid,
      the new one works
- [ ] Set a webhook URL pointing at a scratch endpoint you control (e.g.
      [webhook.site](https://webhook.site) for a quick manual check) →
      **Save** → go add a project on the Profile page → confirm the
      webhook receiver got a POST with `{ section: "projects", action:
      "create", ... }`

## 6. Sync

On `/dashboard/sync`:

- [ ] Enter a real GitHub username with at least one public repo not
      already in your profile → **Scan now** → a pending proposal
      appears per new repo
- [ ] Scan again immediately → confirm it does *not* re-propose the same
      repos ("Nothing new since last scan")
- [ ] Approve one proposal → check Profile → the project exists with a
      GitHub link
- [ ] Test `/api/profile/external-sync` manually:
  ```bash
  curl -X POST http://localhost:3000/api/profile/external-sync \
    -H "Content-Type: application/json" \
    -d '{
      "token": "<your public_token>",
      "changes": [{
        "target_table": "skills",
        "action": "create",
        "target_id": null,
        "payload": { "name": "Test skill" },
        "diff_summary": "Manual sync test"
      }]
    }'
  ```
  → confirm a "Test skill" proposal shows up on `/dashboard/sync`, not
  written directly to your skills list

## 7. Isolation checks (the "optional features degrade gracefully" claim)

Worth doing at least once, in a throwaway `.env.local`:

- [ ] Comment out every env var except the two required Supabase ones →
      `npm run build` still succeeds, `npm run dev` still starts, manual
      Profile/Resume flows still work
- [ ] With `SUPABASE_SERVICE_ROLE_KEY` unset, `/dashboard/portfolio`
      degrades with a clear message instead of a crash
- [ ] With no AI provider set, `/dashboard/updates` degrades with a
      clear message instead of a crash

If any of these crash instead of degrading, that's a real bug — the
whole point of the optional-integration design is that removing a key
never takes down the rest of the app.
