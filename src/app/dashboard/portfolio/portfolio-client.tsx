"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function PortfolioClient({
  publicToken,
  webhookUrl,
}: {
  publicToken: string | null;
  webhookUrl: string | null;
}) {
  const [token, setToken] = useState(publicToken);
  const [webhook, setWebhook] = useState(webhookUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const apiUrl = token ? `${origin}/api/profile?token=${token}` : "";

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
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          Your data endpoint
        </h2>
        <p className="text-sm text-[var(--loom-muted)]">
          Any framework — Next.js, Astro, Hugo, plain HTML+fetch — can pull this
          at build time or request time.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs border border-[var(--loom-line)] rounded px-3 py-2 bg-white overflow-x-auto whitespace-nowrap">
            {apiUrl || "Sign in to get your endpoint"}
          </code>
          <button
            onClick={copy}
            disabled={!apiUrl}
            className="shrink-0 border border-[var(--loom-line)] rounded p-2 hover:bg-[var(--loom-thread-soft)] disabled:opacity-40"
            aria-label="Copy"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <button
          onClick={regenerateToken}
          className="self-start text-xs text-[var(--loom-muted)] hover:underline"
        >
          Regenerate token (invalidates the current URL)
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          Publish webhook
        </h2>
        <p className="text-sm text-[var(--loom-muted)]">
          Called on every change, with what changed — a Vercel deploy hook, or
          your own API route that revalidates just the affected page.
        </p>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 text-sm border border-[var(--loom-line)] rounded px-3 py-2 bg-white"
            placeholder="https://your-portfolio.com/api/loom-webhook"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
          />
          <button
            onClick={saveWebhook}
            disabled={saving}
            className="shrink-0 bg-[var(--loom-thread)] text-white rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {saved ? "Saved" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          Example: Next.js receiver
        </h2>
        <p className="text-sm text-[var(--loom-muted)]">
          A minimal route that revalidates only the changed section on your
          portfolio, instead of rebuilding the whole site.
        </p>
        <pre className="text-xs border border-[var(--loom-line)] rounded p-3 bg-white overflow-x-auto">
{`// app/api/loom-webhook/route.ts
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { section } = await req.json();
  revalidatePath(\`/\${section}\`); // e.g. /projects, /experience
  return Response.json({ ok: true });
}`}
        </pre>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          Edited your portfolio directly?
        </h2>
        <p className="text-sm text-[var(--loom-muted)]">
          Have your site POST changes to{" "}
          <code className="text-xs">/api/profile/external-sync</code> with the
          same token. They land as pending suggestions — nothing overwrites your
          data silently. Review queue lands in Phase 5.
        </p>
      </section>
    </div>
  );
}
