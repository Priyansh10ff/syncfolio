# Syncfolio — Product Overview

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

## What Syncfolio is

Syncfolio keeps one structured profile — experience, projects, skills,
education — and treats it as the single source of truth. Every other
output reads from it:

- **The resume** is generated from the profile, not maintained beside it.
- **The portfolio** pulls a published copy of the profile over a JSON API
  and gets notified by webhook when a new version is published.
- **Updates** come in as plain English. A note like *"shipped Redis
  caching on Patchwork, cut p95 latency 40%"* is turned into a precise,
  structured change to the right project.

Nothing automated ever writes directly. Every suggestion — from the AI,
from a GitHub scan, or from an edit made on the portfolio itself — lands
in a review queue and waits for the user to approve or reject it.

## Resume and portfolio are separate, and both optional

Resume and Portfolio are two independent modules on top of the same
profile. Turn on one, the other, or both. A student who only needs a PDF
never sees portfolio settings; someone who only wants their site fed by
an API never sees the resume page.

They share data but not presentation:

- **Per-item visibility.** Every experience, project, skill and education
  entry has two switches: *on resume* and *on portfolio*. A small
  coursework project can live on the portfolio without taking a line on a
  one-page resume.
- **Different depth.** The resume uses short bullets and metrics. The
  portfolio can also carry a long write-up, a cover image and a slug for
  each project. Neither output needs the other's fields.
- **Different timing.** The resume always reflects the live profile. The
  portfolio serves the last *published* version, so a change can land on
  the resume today and reach the portfolio later, or never.

### Optional auto-sync to the portfolio

When an update is approved, a **sync to portfolio** switch decides what
happens next:

- **On:** the change is published to the portfolio right away and the
  webhook fires.
- **Off:** the change updates the profile and the resume only. The
  Portfolio page lists it as an unpublished change until the user
  publishes manually.

The default for the switch is a setting; it can be flipped per update.

## Who it is for

**Primary: students and early-career developers.** People who ship a lot
of small and medium projects, apply to internships and jobs constantly,
and need their resume and portfolio to reflect last week's work, not last
semester's.

**Secondary: developers who already have a portfolio site.** Syncfolio does
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
| **Resume** (optional module) | Live preview and one-click PDF generated from the items marked *on resume*. |
| **Portfolio** (optional module) | Publishes the items marked *on portfolio* to a token-authenticated JSON endpoint, with optional auto-sync on approval, manual publish, and a change webhook so the site revalidates only what changed. |
| **Sync** | Review queue for GitHub repo scans and for edits pushed back from the portfolio. |

## A typical flow

1. Sign in with a magic link. A profile is created automatically.
2. Fill in the profile once, by hand, or let a GitHub scan propose
   existing public repos as projects.
3. Turn on the modules you need: Resume, Portfolio, or both.
4. If using the portfolio, point the site at `/api/portfolio?token=...`,
   set a webhook, and choose whether approvals auto-sync.
5. From then on, drop a one-line note in **Updates** whenever something
   changes. Approve the drafted diff, with sync to portfolio on or off.
6. The resume PDF is current immediately. The portfolio updates either
   at once (auto-sync) or the next time you publish.

## What Syncfolio is not

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
