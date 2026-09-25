# Deployment

Three parts: get it running locally, deploy it somewhere, then harden it
for production use. Do them in order — don't skip to deploying before
you've smoke-tested locally.

## 1. Local setup

### 1.1 Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project. Note the
   database password somewhere; you won't need it directly but Supabase
   asks.
2. Once it's provisioned, go to **Project Settings → API**. You'll need:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (under "Project API keys", secret) →
     `SUPABASE_SERVICE_ROLE_KEY` — optional, only if you want the public
     portfolio endpoint working locally too.

### 1.2 Apply the schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the entire contents of `supabase/schema.sql` and run it.
3. Confirm under **Table Editor** that `profiles`, `experience`,
   `projects`, `skills`, `education`, and `pending_updates` all exist.

### 1.3 Enable email sign-in

1. **Authentication → Providers → Email**. Make sure Email is enabled.
2. **Authentication → Email Templates**, confirm the "Magic Link"
   template is on (it is by default).
3. Under **Authentication → URL Configuration**, add
   `http://localhost:3000/auth/callback` to Redirect URLs (add your
   production callback URL here too once you have one — step 2.3).

### 1.4 Configure and run

```bash
git clone <your-fork-url> loom
cd loom
npm install
cp .env.example .env.local
```

Edit `.env.local`: fill in the two `NEXT_PUBLIC_SUPABASE_*` values at
minimum. Add an AI provider block if you want to test Updates (see
`.env.example` for all four options — Claude, GPT, Gemini, or local).

```bash
npm run dev
```

Visit `http://localhost:3000`, click through to `/login`, sign in with
your email, check your inbox for the magic link.

Now run through [`docs/TESTING.md`](TESTING.md) before deploying
anything.

## 2. Deploying

Any Node host works — these are Vercel-specific steps since it's the
path of least resistance for Next.js, but the environment variables are
identical anywhere else.

### 2.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

`.github/workflows/ci.yml` runs `npm run build` and `npm run lint` on
every push and PR — check the Actions tab goes green before continuing.

### 2.2 Import into Vercel

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo.
2. Framework preset should auto-detect Next.js. Leave build settings
   default.
3. Under **Environment Variables**, add everything from your
   `.env.local` — at minimum the two Supabase values. Add the rest
   (`SUPABASE_SERVICE_ROLE_KEY`, AI provider keys) if you're using those
   features. Mark `SUPABASE_SERVICE_ROLE_KEY` and any `*_API_KEY` as
   **sensitive** — Vercel hides sensitive values from the dashboard UI
   after save.
4. Deploy.

### 2.3 Point auth at the deployed URL

1. Copy your Vercel deployment URL (e.g. `https://loom-yourname.vercel.app`).
2. Back in Supabase **Authentication → URL Configuration**:
   - **Site URL** → your Vercel URL
   - **Redirect URLs** → add `https://<your-domain>/auth/callback`
3. Sign in on the deployed site once, end to end, before telling anyone
   it's live.

### 2.4 Local model note

If you're using `AI_PROVIDER=local`, remember your deployed app can't
reach `localhost` on your machine. Either:
- Point `LOCAL_AI_BASE_URL` at a local model server that's actually
  reachable from the internet (a tunnel like `ngrok`, or a model hosted
  on a VPS you control), or
- Switch to a hosted provider (`anthropic` / `openai` / `gemini`) for
  the deployed environment, and keep local for dev only. Vercel env vars
  can differ between Preview/Production and your `.env.local` — this is
  the normal way to do it.

## 3. Production checklist

Run through this before pointing real traffic at it.

- [ ] **RLS is on.** `supabase/schema.sql` enables Row Level Security on
      every table — confirm in Supabase **Authentication → Policies**
      that each table shows policies, not "RLS disabled."
- [ ] **Service role key is server-side only.** Grep your codebase for
      `SUPABASE_SERVICE_ROLE_KEY` — it should only appear in
      `src/lib/supabase/admin.ts`. Never prefix it with `NEXT_PUBLIC_`.
- [ ] **Auth redirect URLs are locked down** to your real domain(s) —
      remove `localhost` entries from the production Supabase project if
      you're using a separate project per environment.
- [ ] **CI is green** on `main` (build + lint).
- [ ] **You've rotated the public token at least once** from
      `/dashboard/portfolio` after initial testing, so any token that
      leaked into logs/screenshots during setup is dead.
- [ ] **Webhook receiver (if used) validates its caller.** Loom doesn't
      sign webhook payloads (see `SECURITY.md`) — if your portfolio's
      webhook endpoint does anything beyond `revalidatePath`, add your
      own shared-secret check.
- [ ] **You've read `SECURITY.md`** for what each secret protects and
      what happens if it leaks.
- [ ] **AI provider costs are bounded**, if using a paid API — there's
      no built-in rate limiting on `/api/updates/parse` beyond requiring
      a signed-in session. Add rate limiting (e.g. Vercel's or a
      middleware check) if this will see real multi-user traffic.
- [ ] **Full manual pass from `docs/TESTING.md`** on the deployed URL,
      not just locally.
