# Loom — Product Overview

> Tell it what changed once. Your resume and portfolio update themselves.

## The problem

A developer's career data lives in too many places at once: a resume PDF,
a portfolio site, a LinkedIn profile, a GitHub profile, a README. Every
time something real happens — a new project ships, a metric improves, a
role changes — each of those has to be updated by hand, separately.

In practice nobody does that. The resume is three months stale, the
portfolio is six months stale, and the best recent work is missing from
both exactly when an application or an interview comes up. The data is
not hard to write. Keeping it consistent across copies is the hard part.

## What Loom is

Loom keeps one structured profile — experience, projects, skills,
education — and treats it as the single source of truth. Every other
output reads from it:

- **The resume** is generated from the profile, not maintained beside it.
- **The portfolio** pulls the profile over a JSON API and gets notified
  by webhook when something changes.
- **Updates** come in as plain English. A note like *"shipped Redis
  caching on Patchwork, cut p95 latency 40%"* is turned into a precise,
  structured change to the right project.

Nothing automated ever writes directly. Every suggestion — from the AI,
from a GitHub scan, or from an edit made on the portfolio itself — lands
in a review queue and waits for the user to approve or reject it.

## Who it is for

**Primary: students and early-career developers.** People who ship a lot
of small and medium projects, apply to internships and jobs constantly,
and need their resume and portfolio to reflect last week's work, not last
semester's.

**Secondary: developers who already have a portfolio site.** Loom does
not ship a portfolio template. It is built to plug into an existing site
in any framework — Next.js, Astro, SvelteKit, plain HTML — through one
endpoint.

**Also: self-hosters and privacy-minded users.** It is open source (MIT),
runs on a free Supabase project, and the AI layer works with a fully
local model, so career data never has to leave the user's machine.

## Why it is built this way

- **One source of truth, many outputs.** Copies drift. A generated
  output cannot drift from the thing it is generated from.
- **Human approval on every automated write.** An AI that edits a resume
  without review will eventually invent a metric. The review queue makes
  the AI a drafting tool, not an author.
- **Portfolio-agnostic.** People already have portfolio sites they like.
  Asking them to migrate is a non-starter; giving them an API is not.
- **Bring your own model.** Claude, GPT, Gemini, any OpenAI-compatible
  host, or a local model. Users pick based on cost, quality, or privacy.
- **Everything optional degrades gracefully.** Only Supabase is required.
  No AI key, no service-role key, no GitHub username — the rest of the
  app still works.

## Core features

| Feature | What it does |
|---|---|
| **Profile** | Manual editor for basics, experience, projects, skills, and education. The source of truth. |
| **Updates** | Natural-language notes become proposed diffs against the existing profile, reviewed before applying. |
| **Resume** | Live preview and one-click PDF generated straight from the profile. |
| **Portfolio** | Token-authenticated JSON endpoint for any external site, plus a change webhook so the site revalidates only what changed. |
| **Sync** | Review queue for GitHub repo scans and for edits pushed back from the portfolio. |

## A typical flow

1. Sign in with a magic link. A profile is created automatically.
2. Fill in the profile once, by hand, or let a GitHub scan propose
   existing public repos as projects.
3. Point the portfolio site at `/api/profile?token=...` and set a webhook.
4. From then on, drop a one-line note in **Updates** whenever something
   changes. Approve the drafted diff.
5. The resume PDF is current immediately. The portfolio gets a webhook
   and revalidates the affected section.

## What Loom is not

- Not a resume template marketplace or a design tool.
- Not a portfolio site builder or host.
- Not an autopilot. It never publishes a change the user has not approved.
- Not a job board or application tracker.

## Tech at a glance

Next.js (App Router) and TypeScript, Supabase (Postgres, Auth, Row Level
Security), Tailwind CSS, zod for every data shape, `@react-pdf/renderer`
for the resume, and a pluggable AI provider layer (Anthropic, OpenAI,
Gemini, local, or any OpenAI-compatible API). Full details are in
[`TECHNICAL.md`](TECHNICAL.md).
