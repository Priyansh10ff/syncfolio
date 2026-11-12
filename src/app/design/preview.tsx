"use client";

import { useState } from "react";
import {
  Button,
  CommandPalette,
  DataTable,
  DiffView,
  EmptyState,
  Field,
  InlineField,
  Input,
  Kbd,
  PageHeader,
  SectionHeader,
  StatusBar,
  Tag,
  Textarea,
  ThemeToggle,
  ToggleChip,
  useToast,
} from "@/components/ui";
import { diffRecords } from "@/lib/diff";
import { useHotkey } from "@/lib/hotkeys";

const before = {
  name: "Patchwork",
  description: "GitHub App detecting breaking API changes",
  metrics: [] as string[],
  bullets: ["GitHub App detecting breaking API changes", "Opens AI-patched PRs"],
};
const after = {
  ...before,
  metrics: ["cut p95 latency 40% via Redis caching"],
  bullets: [...before.bullets, "Added Redis caching layer"],
};

const repos = [
  { name: "patchwork", lang: "TypeScript", stars: 41, pushed: "2026-10-04" },
  { name: "weft", lang: "Python", stars: 12, pushed: "2026-10-05" },
  { name: "skill-barter", lang: "TypeScript", stars: 3, pushed: "2026-09-28" },
];

export default function DesignPreview() {
  const toast = useToast();
  const [headline, setHeadline] = useState("Full-stack AI developer");
  const [summary, setSummary] = useState("");
  const [r, setR] = useState(true);
  const [p, setP] = useState(false);
  const [row, setRow] = useState(0);

  useHotkey("j", () => setRow((i) => Math.min(i + 1, repos.length - 1)), {
    description: "Next row",
    group: "Lists",
  });
  useHotkey("k", () => setRow((i) => Math.max(i - 1, 0)), { description: "Previous row", group: "Lists" });
  useHotkey("a", () => toast({ message: "approved · projects / Patchwork", tone: "ok", action: { label: "undo", onClick: () => {} } }), {
    description: "Approve",
    group: "Review",
  });
  useHotkey("r", () => toast({ message: "rejected · projects / Patchwork" }), { description: "Reject", group: "Review" });
  useHotkey("g p", () => toast({ message: "→ profile" }), { description: "Go to profile", group: "Navigation" });

  const save = (set: (v: string) => void) => async (v: string) => {
    await new Promise((res) => setTimeout(res, 300));
    if (v.toLowerCase() === "fail") throw new Error("server said no");
    set(v);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        <aside className="w-48 shrink-0 border-r border-line px-3 py-4 flex flex-col gap-6">
          <div className="font-mono text-[13px] font-medium">
            syncfolio<span className="text-thread">_</span>
          </div>
          <nav className="flex flex-col font-mono text-[13px]">
            {[
              ["profile", 0],
              ["updates", 3],
              ["resume", null],
              ["portfolio", 2],
              ["sync", 12],
              ["settings", null],
            ].map(([label, count], i) => (
              <a
                key={label as string}
                href="#"
                className={`flex justify-between px-2 py-1 rounded-sm ${
                  i === 1 ? "bg-surface-2 text-ink shadow-[inset_2px_0_0_var(--sf-thread)]" : "text-muted hover:text-ink"
                }`}
              >
                <span>{label}</span>
                {count ? <span className="text-thread">[{count}]</span> : null}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 px-10 py-8 max-w-4xl flex flex-col gap-12">
          <PageHeader
            title="design system"
            description="Every primitive in one place. Press ? for shortcuts, ⌘K / Ctrl K for the palette, j / k to move through the table, a / r on the diff."
            actions={<ThemeToggle />}
          />

          <section className="flex flex-col gap-4">
            <SectionHeader title="Review" count={1} />
            <DiffView
              active
              title={
                <>
                  projects <span className="text-faint">/</span> Patchwork
                </>
              }
              summary="Added 'cut p95 latency 40% via Redis caching' to Patchwork"
              meta={
                <>
                  <Tag tone="thread">ai_chat</Tag>
                  <Tag>update</Tag>
                </>
              }
              changes={diffRecords(before, after)}
              footer={
                <>
                  <span className="mr-auto font-mono text-[11px] text-muted">sync to portfolio: on</span>
                  <Button size="sm" variant="ghost" shortcut="e">
                    edit
                  </Button>
                  <Button size="sm" variant="danger" shortcut="r">
                    reject
                  </Button>
                  <Button size="sm" variant="primary" shortcut="a">
                    approve
                  </Button>
                </>
              }
            />
            <DiffView
              title={
                <>
                  skills <span className="text-faint">/</span> new
                </>
              }
              meta={<Tag tone="add">create</Tag>}
              changes={diffRecords(null, { name: "Rust", category: "language" })}
            />
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Buttons" />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" shortcut="⌘↵">
                publish 3 changes
              </Button>
              <Button>download pdf</Button>
              <Button variant="ghost">cancel</Button>
              <Button variant="danger">rotate token</Button>
              <Button loading>saving</Button>
              <Button disabled>disabled</Button>
              <Button size="sm">small</Button>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Inline edit" />
            <p className="text-[13px] text-muted">Click, type, Enter to save. Type “fail” to see an error.</p>
            <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 items-start">
              <span className="font-mono text-label uppercase text-muted pt-1">headline</span>
              <InlineField label="Headline" value={headline} onSave={save(setHeadline)} />
              <span className="font-mono text-label uppercase text-muted pt-1">summary</span>
              <InlineField label="Summary" value={summary} multiline onSave={save(setSummary)} placeholder="add a summary" />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader
              title="Projects"
              count={3}
              actions={
                <Button size="sm" variant="ghost" shortcut="n">
                  add
                </Button>
              }
            />
            <ul className="flex flex-col">
              {["Patchwork", "Weft", "Skill Barter"].map((name, i) => (
                <li key={name} className="flex items-center justify-between py-1.5 border-b border-line/60 font-mono text-[13px]">
                  <span>
                    {name}
                    {i === 0 && <Tag tone="thread" className="ml-2">ai</Tag>}
                    {i === 1 && <Tag className="ml-2">gh</Tag>}
                  </span>
                  <span className="flex gap-1.5">
                    <ToggleChip label="R" title="Show on resume" on={i === 0 ? r : true} onChange={setR} />
                    <ToggleChip label="P" title="Show on portfolio" on={i === 0 ? p : i !== 2} onChange={setP} />
                  </span>
                </li>
              ))}
            </ul>
            <EmptyState>
              no education yet. press <Kbd>n</Kbd> to add one
            </EmptyState>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Table" />
            <DataTable
              label="GitHub repositories"
              rows={repos}
              rowKey={(r) => r.name}
              activeIndex={row}
              onRowClick={(_, i) => setRow(i)}
              columns={[
                { key: "name", header: "repo", render: (r) => r.name },
                { key: "lang", header: "lang", render: (r) => <span className="text-muted">{r.lang}</span> },
                { key: "stars", header: "★", align: "right", width: "w-16", render: (r) => r.stars },
                { key: "pushed", header: "pushed", width: "w-28", render: (r) => <span className="text-muted">{r.pushed}</span> },
                {
                  key: "add",
                  header: "",
                  align: "right",
                  width: "w-16",
                  render: () => <span className="text-thread">[add]</span>,
                },
              ]}
            />
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Form" />
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <Field label="Role">{(a) => <Input {...a} placeholder="Software engineer intern" />}</Field>
              <Field label="Start" error="Use YYYY-MM">
                {(a) => <Input {...a} defaultValue="2024-13" />}
              </Field>
              <div className="col-span-2">
                <Field label="Note" hint="Plain English. The AI drafts a diff; nothing saves until you approve.">
                  {(a) => <Textarea {...a} placeholder="shipped redis caching on patchwork, p95 down 40%" />}
                </Field>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Type" />
            <div className="flex flex-col gap-2">
              <div className="font-mono text-lg font-medium">IBM Plex Mono — headings, data, labels</div>
              <div className="text-[15px]">IBM Plex Sans — summaries and longer descriptions read in this face.</div>
              <div className="font-mono text-label uppercase text-muted">11px uppercase label</div>
              <div className="flex gap-4 font-mono text-[13px]">
                <span className="text-ink">ink</span>
                <span className="text-muted">muted</span>
                <span className="text-faint">faint</span>
                <span className="text-thread">thread</span>
                <span className="text-add">+ add</span>
                <span className="text-del">- del</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      <StatusBar
        items={[
          { id: "auth", label: "signed in", tone: "ok" },
          { id: "saved", label: "profile saved 2m ago" },
          { id: "pending", label: "3 pending", tone: "warn" },
          { id: "ai", label: "ai: claude-sonnet" },
          { id: "hook", label: "webhook 200 · 4m ago", tone: "ok" },
        ]}
        right={
          <span className="flex items-center gap-1.5">
            <Kbd>?</Kbd> shortcuts
          </span>
        }
      />

      <CommandPalette
        commands={[
          { id: "profile", group: "go", label: "Profile", keys: "g p", run: () => toast({ message: "→ profile" }) },
          { id: "updates", group: "go", label: "Updates", keys: "g u", run: () => toast({ message: "→ updates" }) },
          { id: "publish", group: "portfolio", label: "Publish portfolio", keywords: "sync push", run: () => toast({ message: "published 3 changes", tone: "ok" }) },
          { id: "pdf", group: "resume", label: "Download resume PDF", keywords: "cv", run: () => toast({ message: "downloading…" }) },
          { id: "scan", group: "sync", label: "Scan GitHub", run: () => toast({ message: "scanning…" }) },
        ]}
      />
    </div>
  );
}
