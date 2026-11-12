"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { PortfolioChange } from "@/lib/portfolio/publish";

export default function PortfolioClient({
  publicToken,
  webhookUrl,
  initialChanges,
  initialPublishedAt,
  autoSync,
}: {
  publicToken: string | null;
  webhookUrl: string | null;
  initialChanges: PortfolioChange[];
  initialPublishedAt: string | null;
  autoSync: boolean;
}) {
  const [changes, setChanges] = useState(initialChanges);
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    const res = await fetch("/api/portfolio/publish", { method: "POST" });
    const data = await res.json();
    setPublishing(false);
    if (!res.ok) {
      setPublishError(data.error ?? "Publish failed.");
      return;
    }
    setChanges([]);
    if (data.published_at) setPublishedAt(data.published_at);
  }
  const [token, setToken] = useState(publicToken);
  const [webhook, setWebhook] = useState(webhookUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const apiUrl = token ? `${origin}/api/portfolio?token=${token}` : "";

  async function copy() {
    await navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function regenerateToken() {
    const res = await fetch("/api/profile/token", { method: "POST" });
    const data = await res.json();
    if (res.ok) setToken(data.public_token);
  }

  async function saveWebhook() {
    setSaving(true);
    const res = await fetch("/api/profile/webhook", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhook_url: webhook }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--sf-muted)] uppercase tracking-wide">
          Publish
        </h2>
        <p className="text-sm text-[var(--sf-muted)]">
          {publishedAt
            ? `Last published ${new Date(publishedAt).toLocaleString()}.`
            : "Nothing published yet — your site gets a 404 until you publish once."}{" "}
          Auto-sync on approval is {autoSync ? "on" : "off"}.
        </p>
        {changes.length > 0 ? (
          <ul className="text-xs border border-[var(--sf-line)] rounded px-3 py-2 bg-surface flex flex-col gap-1">
            {changes.map((c, i) => (
              <li key={`${c.section}-${c.id ?? i}`}>
                <span className="text-[var(--sf-muted)]">{c.action}</span> {c.section}
                {c.id ? <span className="text-[var(--sf-muted)]"> · {c.id.slice(0, 8)}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">Everything is published.</p>
        )}
        <button
          onClick={publish}
          disabled={publishing || (changes.length === 0 && !!publishedAt)}
          className="self-start bg-[var(--sf-thread)] text-thread-ink rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {publishing
            ? "Publishing…"
            : `Publish${changes.length ? ` ${changes.length} change${changes.length === 1 ? "" : "s"}` : ""}`}
        </button>
        {publishError && <p className="text-sm text-del">{publishError}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--sf-muted)] uppercase tracking-wide">
          Your data endpoint
        </h2>
        <p className="text-sm text-[var(--sf-muted)]">
          Any framework — Next.js, Astro, Hugo, plain HTML+fetch — can pull this
          at build time or request time.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs border border-[var(--sf-line)] rounded px-3 py-2 bg-surface overflow-x-auto whitespace-nowrap">
            {apiUrl || "Sign in to get your endpoint"}
          </code>
          <button
            onClick={copy}
            disabled={!apiUrl}
            className="shrink-0 border border-[var(--sf-line)] rounded p-2 hover:bg-[var(--sf-thread-soft)] disabled:opacity-40"
            aria-label="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <button
          onClick={regenerateToken}
          className="self-start text-xs text-[var(--sf-muted)] hover:underline"
        >
          Regenerate token (invalidates the current URL)
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--sf-muted)] uppercase tracking-wide">
          Publish webhook
        </h2>
        <p className="text-sm text-[var(--sf-muted)]">
          Called once per publish, listing every section that changed — a
          Vercel deploy hook, or your own API route that revalidates just the
          affected pages.
        </p>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 text-sm border border-[var(--sf-line)] rounded px-3 py-2 bg-surface"
            placeholder="https://your-portfolio.com/api/syncfolio-webhook"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
          />
          <button
            onClick={saveWebhook}
            disabled={saving}
            className="shrink-0 bg-[var(--sf-thread)] text-thread-ink rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {saved ? "Saved" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--sf-muted)] uppercase tracking-wide">
          Example: Next.js receiver
        </h2>
        <p className="text-sm text-[var(--sf-muted)]">
          A minimal route that revalidates only the changed section on your
          portfolio, instead of rebuilding the whole site.
        </p>
        <pre className="text-xs border border-[var(--sf-line)] rounded p-3 bg-surface overflow-x-auto">
{`// app/api/syncfolio-webhook/route.ts
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { changes } = await req.json();
  const sections = new Set(changes.map((c: { section: string }) => c.section));
  for (const section of sections) revalidatePath(\`/\${section}\`); // e.g. /projects
  return Response.json({ ok: true });
}`}
        </pre>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--sf-muted)] uppercase tracking-wide">
          Edited your portfolio directly?
        </h2>
        <p className="text-sm text-[var(--sf-muted)]">
          Have your site POST changes to{" "}
          <code className="text-xs">/api/profile/external-sync</code> with the
          same token. They land as pending suggestions on the Sync page — nothing
          overwrites your data silently.
        </p>
      </section>
    </div>
  );
}
