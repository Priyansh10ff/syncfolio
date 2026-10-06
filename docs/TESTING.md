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
- [ ] Add an education entry (institution, start date) → appears; delete it
- [ ] Add an experience with start date `2024-13` → a readable
      "Use YYYY-MM" error, nothing saved
- [ ] Toggle **R** off on a project → it disappears from the resume
      preview; toggle it back on
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
- [ ] Call `POST /api/updates/undo` with that item's id → the change is
      reverted on Profile (only the most recent approval can be undone)
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
- [ ] Before the first publish, the URL returns 404 "Nothing published yet"
- [ ] Click **Publish** → open the URL in a new incognito tab (no session)
      → you get your portfolio JSON with a `published_at`
- [ ] Turn **P** off on one project on the Profile page → the Portfolio page
      lists it as an unpublished change; the URL still shows it until you
      publish, then it's gone
- [ ] Click **Regenerate token** → the old URL now returns 404/invalid,
      the new one works
- [ ] Set a webhook URL pointing at a scratch endpoint you control (e.g.
      [webhook.site](https://webhook.site) for a quick manual check) →
      **Save** → add a project on the Profile page → **Publish** → confirm
      the receiver got one POST with
      `{ published_at, changes: [{ section: "projects", action: "create", id }] }`
- [ ] With auto-sync on (Settings), approve an AI update → the portfolio
      publishes immediately; with it off, the change waits on the
      Portfolio page

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

## 7. Modules

On `/dashboard/settings`:

- [ ] Turn **Resume** off → it leaves the sidebar, `/dashboard/resume`
      shows "turned off", `/api/resume/pdf` returns 404
- [ ] Try to turn **Portfolio** off too → refused with "keep at least one"
- [ ] Turn Resume back on, turn **Portfolio** off → `/api/portfolio?token=`
      returns 404; turn it back on

## 8. Isolation checks (the "optional features degrade gracefully" claim)

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
