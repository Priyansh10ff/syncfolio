"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonClassName, Field, Input } from "@/components/ui";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { ProfileSettings } from "@/lib/schema/profile";

type Modules = "resume" | "portfolio" | "both";

const MODULES: { id: Modules; title: string; body: string }[] = [
  { id: "resume", title: "resume", body: "A PDF that's always current." },
  { id: "portfolio", title: "portfolio", body: "Data for the site you already have." },
  { id: "both", title: "both", body: "One profile, two outputs." },
];

const STEPS = ["modules", "you", "github", "done"] as const;

/** First-run setup: modules → name → GitHub scan → done. */
export default function Welcome({
  settings,
  name: initialName,
  headline: initialHeadline,
  githubUsername,
}: {
  settings: ProfileSettings;
  name: string;
  headline: string;
  githubUsername: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [modules, setModules] = useState<Modules>(
    settings.resume_enabled && settings.portfolio_enabled ? "both" : settings.resume_enabled ? "resume" : "portfolio"
  );
  const [name, setName] = useState(initialName);
  const [headline, setHeadline] = useState(initialHeadline);
  const [github, setGithub] = useState(githubUsername);
  const [found, setFound] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
      setStep((s) => s + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const next = {
    modules: () =>
      run(async () => {
        await api("/api/settings", "PATCH", { resume_enabled: modules !== "portfolio", portfolio_enabled: modules !== "resume" });
      }),
    you: () =>
      run(async () => {
        if (!name.trim()) throw new Error("Add your name — it heads your resume.");
        await api("/api/profile/basics", "PATCH", { name: name.trim(), headline: headline.trim() || null });
      }),
    github: () =>
      run(async () => {
        if (!github.trim()) return;
        await api("/api/profile/github", "PATCH", { github_username: github.trim() });
        const res = await api<{ pending: unknown[] }>("/api/sync/github-scan", "POST");
        setFound(res.pending.length);
      }),
  };

  const current = STEPS[step];

  return (
    <div className="max-w-xl mx-auto py-6 flex flex-col gap-8">
      <ol className="flex gap-2 font-mono text-[11px]" aria-label="Setup progress">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={cn("flex-1 border-t-2 pt-1.5", i <= step ? "border-thread text-ink" : "border-line text-faint")}>
            {String(i + 1).padStart(2, "0")} {s}
          </li>
        ))}
      </ol>

      {current === "modules" && (
        <section className="flex flex-col gap-5 animate-fade">
          <h1 className="font-mono text-2xl font-medium tracking-tight">What do you want to keep current?</h1>
          <div role="radiogroup" aria-label="Modules" className="grid gap-2 sm:grid-cols-3">
            {MODULES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={modules === m.id}
                onClick={() => setModules(m.id)}
                className={cn("text-left border rounded-sm p-4 flex flex-col gap-1 transition-colors", modules === m.id ? "border-thread bg-thread-soft" : "border-line hover:border-line-strong bg-surface")}
              >
                <span className="font-mono text-[14px] text-ink">{m.title}</span>
                <span className="text-[13px] text-muted">{m.body}</span>
              </button>
            ))}
          </div>
          <Button variant="primary" className="self-start" loading={busy} onClick={next.modules} shortcut="↵">continue</Button>
        </section>
      )}

      {current === "you" && (
        <form className="flex flex-col gap-5 animate-fade" onSubmit={(e) => { e.preventDefault(); void next.you(); }}>
          <h1 className="font-mono text-2xl font-medium tracking-tight">Who&apos;s this for?</h1>
          <Field label="name">{(a) => <Input {...a} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" mono={false} />}</Field>
          <Field label="headline (optional)">{(a) => <Input {...a} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Full-stack developer" mono={false} />}</Field>
          <Button type="submit" variant="primary" className="self-start" loading={busy} shortcut="↵">continue</Button>
        </form>
      )}

      {current === "github" && (
        <form className="flex flex-col gap-5 animate-fade" onSubmit={(e) => { e.preventDefault(); void next.github(); }}>
          <h1 className="font-mono text-2xl font-medium tracking-tight">Start from your GitHub?</h1>
          <p className="text-[14px] text-muted">Your public repos become project proposals. You approve the ones you want — nothing is added on its own.</p>
          <Field label="github username">{(a) => <Input {...a} autoFocus value={github} onChange={(e) => setGithub(e.target.value)} placeholder="octocat" />}</Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={busy} disabled={!github.trim()}>scan repos</Button>
            <Button variant="ghost" onClick={() => setStep((s) => s + 1)}>skip</Button>
          </div>
        </form>
      )}

      {current === "done" && (
        <section className="flex flex-col gap-5 animate-fade">
          <h1 className="font-mono text-2xl font-medium tracking-tight">You&apos;re set.</h1>
          <p className="text-[14px] text-muted">
            {found ? `${found} repo${found === 1 ? "" : "s"} waiting for review in sync.` : "Add a few rows by hand, or write your first update."}
          </p>
          <div className="flex flex-wrap gap-2">
            {found ? <Link href="/dashboard/sync" className={buttonClassName({ variant: "primary" })}>review repos →</Link> : null}
            <Link href="/dashboard/updates" className={buttonClassName({ variant: found ? "secondary" : "primary" })}>write an update</Link>
            <button type="button" className={buttonClassName({ variant: "ghost" })} onClick={() => router.push("/dashboard/profile")}>open profile</button>
          </div>
        </section>
      )}

      {error && <p role="alert" className="font-mono text-xs text-del">{error}</p>}
    </div>
  );
}
