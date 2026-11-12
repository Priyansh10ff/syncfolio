"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Tabs } from "@/components/app/tabs";
import { Button, DataTable, DiffView, EmptyState, InlineField, Input, Kbd, Label, SectionHeader, Tag, useToast } from "@/components/ui";
import { api } from "@/lib/api/client";
import { diffRecords } from "@/lib/diff";
import { useHotkey } from "@/lib/hotkeys";
import { ago } from "@/lib/time";
import type { PortfolioChange } from "@/lib/portfolio/publish";

export type PendingChange = PortfolioChange & {
  key: string;
  label: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

const useOrigin = () =>
  useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );

const snippets = (url: string) => ({
  "next.js": `// app/projects/page.tsx
const res = await fetch("${url}", { next: { tags: ["syncfolio"] } });
const { projects } = await res.json();`,
  astro: `---
// src/pages/projects.astro
const { projects } = await fetch("${url}").then((r) => r.json());
---
{projects.map((p) => <h2>{p.name}</h2>)}`,
  fetch: `const portfolio = await fetch("${url}").then((r) => r.json());
// portfolio.experience, .projects, .skills, .education, .published_at`,
});

export default function PortfolioWorkspace({
  pending,
  history,
  lastPublishedAt,
  publicToken,
  webhookUrl,
  autoSync,
}: {
  pending: PendingChange[];
  history: { id: string; published_at: string; count: number }[];
  lastPublishedAt: string | null;
  publicToken: string;
  webhookUrl: string | null;
  autoSync: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const origin = useOrigin();
  const [token, setToken] = useState(publicToken);
  const [publishing, setPublishing] = useState(false);
  const [rotateText, setRotateText] = useState("");
  const [copied, setCopied] = useState(false);
  const endpoint = `${origin}/api/portfolio?token=${token}`;
  const canPublish = pending.length > 0 || !lastPublishedAt;

  async function publish() {
    if (!canPublish || publishing) return;
    setPublishing(true);
    try {
      const res = await api<{ published: boolean; changes: unknown[] }>("/api/portfolio/publish", "POST");
      toast({ message: res.published ? `published ${res.changes.length} change${res.changes.length === 1 ? "" : "s"}` : "already up to date", tone: "ok" });
      router.refresh();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    } finally {
      setPublishing(false);
    }
  }

  useHotkey("mod+enter", publish, { description: "Publish portfolio", group: "Portfolio", enabled: canPublish, allowInInputs: true });

  async function rotate() {
    try {
      const res = await api<{ public_token: string }>("/api/profile/token", "POST");
      setToken(res.public_token);
      setRotateText("");
      toast({ message: "token rotated — the old URL no longer works", tone: "ok" });
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4" aria-labelledby="sec-publish">
        <SectionHeader
          id="sec-publish"
          title="unpublished"
          count={pending.length}
          actions={
            <Button variant="primary" size="sm" onClick={publish} loading={publishing} disabled={!canPublish} shortcut="⌘↵">
              publish{pending.length ? ` ${pending.length}` : ""}
            </Button>
          }
        />
        <p className="font-mono text-[11px] text-muted">
          {lastPublishedAt ? `last published ${ago(lastPublishedAt)}` : "never published — your endpoint returns 404 until you do"} · auto-sync on approval:{" "}
          <Link href="/dashboard/settings" className={autoSync ? "text-add" : "text-muted"}>{autoSync ? "on" : "off"}</Link>
        </p>
        {pending.length === 0 ? (
          <EmptyState>everything on your site matches your profile</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((c) => (
              <DiffView
                key={c.key}
                title={<>{c.section} <span className="text-faint">/</span> {c.label}</>}
                meta={<Tag tone={c.action === "create" ? "add" : c.action === "delete" ? "del" : "neutral"}>{c.action}</Tag>}
                changes={diffRecords(c.before, c.after, { ignore: ["sort_order", "show_on_resume", "show_on_portfolio"] })}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="sec-endpoint">
        <SectionHeader id="sec-endpoint" title="endpoint" />
        <div className="flex items-stretch gap-2">
          <code className="flex-1 min-w-0 font-mono text-[12px] bg-surface border border-line rounded-sm px-3 py-2 overflow-x-auto whitespace-nowrap">{endpoint}</code>
          <Button onClick={copy}>{copied ? "copied" : "copy"}</Button>
        </div>
        <Tabs
          tabs={Object.entries(snippets(endpoint)).map(([id, code]) => ({
            id,
            label: id,
            panel: <pre className="font-mono text-[12px] leading-6 bg-surface border border-line rounded-sm p-4 overflow-x-auto">{code}</pre>,
          }))}
        />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="sec-webhook">
        <SectionHeader id="sec-webhook" title="webhook" />
        <p className="text-[13px] text-muted max-w-prose">
          Called once per publish with <code className="font-mono text-ink">{"{ published_at, changes: [{ section, action, id }] }"}</code> — revalidate just those pages.
        </p>
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 items-start">
          <Label className="pt-1">url</Label>
          <InlineField
            label="Webhook URL"
            mono
            value={webhookUrl ?? ""}
            placeholder="https://your-site.dev/api/revalidate"
            validate={(v) => (v === "" || /^https?:\/\/\S+$/.test(v) ? null : "Use a full URL")}
            onSave={async (v) => {
              await api("/api/profile/webhook", "PATCH", { webhook_url: v });
              router.refresh();
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="sec-history">
        <SectionHeader id="sec-history" title="publish history" count={history.length} />
        {history.length === 0 ? (
          <EmptyState>no publishes yet</EmptyState>
        ) : (
          <DataTable
            label="Publish history"
            rows={history}
            rowKey={(h) => h.id}
            columns={[
              { key: "when", header: "published", render: (h) => <span title={h.published_at}>{ago(h.published_at)}</span> },
              { key: "count", header: "changes", align: "right", width: "w-28", render: (h) => h.count },
            ]}
          />
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sec-token">
        <SectionHeader id="sec-token" title="public token" />
        <p className="text-[13px] text-muted max-w-prose">Anyone with the endpoint URL can read your published portfolio. Rotating it breaks the old URL immediately — update your site afterwards.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rotateText === "rotate") void rotate();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label htmlFor="rotate" className="font-mono text-[12px] text-muted">type <Kbd>rotate</Kbd> to confirm</label>
          <Input id="rotate" value={rotateText} onChange={(e) => setRotateText(e.target.value)} className="w-32 h-7" autoComplete="off" />
          <Button size="sm" variant="danger" type="submit" disabled={rotateText !== "rotate"}>rotate token</Button>
        </form>
      </section>
    </div>
  );
}
