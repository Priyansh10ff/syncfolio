"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Dialog, DiffView, EmptyState, Field, Input, Tag, Textarea, useToast } from "@/components/ui";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { diffRecords, type FieldChange } from "@/lib/diff";
import { useHotkey } from "@/lib/hotkeys";
import type { ReviewItem } from "@/lib/dashboard";

const SOURCE: Record<ReviewItem["source"], { label: string; tone: "thread" | "neutral" }> = {
  ai_chat: { label: "ai_chat", tone: "thread" },
  github_scan: { label: "github", tone: "neutral" },
  external_sync: { label: "external", tone: "neutral" },
};

type Action = "create" | "update" | "delete";

function split(item: ReviewItem) {
  const { __action, __target_id, ...fields } = item.payload as Record<string, unknown>;
  void __target_id;
  return { action: (__action as Action) ?? "update", fields };
}

function changesFor(item: ReviewItem): FieldChange[] {
  const { action, fields } = split(item);
  if (action === "create") return diffRecords(null, fields);
  if (action === "delete") return diffRecords(item.before, null);
  return diffRecords(item.before, { ...(item.before ?? {}), ...fields });
}

/**
 * The review queue: every automated proposal rendered as a diff.
 * Keyboard: j/k move, a approve, r reject, e edit, s toggle portfolio sync.
 */
export function ReviewQueue({
  initialItems,
  portfolioEnabled,
  autoSync,
  empty,
}: {
  initialItems: ReviewItem[];
  portfolioEnabled: boolean;
  autoSync: boolean;
  empty: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [seen, setSeen] = useState(initialItems);
  const [active, setActive] = useState(0);
  const [sync, setSync] = useState(autoSync);
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Server refreshes (new proposals from a note or scan) replace local state.
  if (initialItems !== seen) {
    setSeen(initialItems);
    setItems(initialItems);
    setActive(0);
  }

  const current = items[Math.min(active, items.length - 1)];
  const hasItems = items.length > 0 && !editing;

  async function undo(id: string) {
    try {
      await api("/api/updates/undo", "POST", { id });
      toast({ message: "undone", tone: "ok" });
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    }
    router.refresh();
  }

  async function resolve(item: ReviewItem | undefined, decision: "approve" | "reject") {
    if (!item || busy) return;
    setBusy(item.id);
    const index = items.findIndex((i) => i.id === item.id);
    setItems((all) => all.filter((i) => i.id !== item.id));
    setActive((a) => Math.max(0, Math.min(a, items.length - 2)));
    try {
      const res = await api<{ portfolio?: { synced: boolean; published?: boolean } }>("/api/updates/apply", "POST", {
        id: item.id,
        decision,
        ...(portfolioEnabled && decision === "approve" ? { sync_portfolio: sync } : {}),
      });
      const where = `${item.target_table} / ${item.targetLabel}`;
      if (decision === "approve") {
        const published = res.portfolio?.synced && res.portfolio.published ? " · portfolio published" : "";
        toast({ message: `approved · ${where}${published}`, tone: "ok", action: { label: "undo", onClick: () => undo(item.id) } });
      } else {
        toast({ message: `rejected · ${where}` });
      }
      router.refresh();
    } catch (e) {
      setItems((all) => [...all.slice(0, index), item, ...all.slice(index)]);
      toast({ message: (e as Error).message, tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  useHotkey("j", () => setActive((a) => Math.min(a + 1, items.length - 1)), { description: "Next proposal", group: "Review", enabled: hasItems });
  useHotkey("k", () => setActive((a) => Math.max(a - 1, 0)), { description: "Previous proposal", group: "Review", enabled: hasItems });
  useHotkey("a", () => resolve(current, "approve"), { description: "Approve", group: "Review", enabled: hasItems });
  useHotkey("r", () => resolve(current, "reject"), { description: "Reject", group: "Review", enabled: hasItems });
  useHotkey("e", () => current && split(current).action !== "delete" && setEditing(current), { description: "Edit before approving", group: "Review", enabled: hasItems });
  useHotkey("s", () => setSync((v) => !v), { description: "Toggle sync to portfolio", group: "Review", enabled: hasItems && portfolioEnabled });

  if (items.length === 0) return <EmptyState>{empty}</EmptyState>;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const { action } = split(item);
        const source = SOURCE[item.source];
        const isActive = i === active;
        return (
          <div key={item.id} onClick={() => setActive(i)}>
            <DiffView
              active={isActive}
              title={
                <>
                  {item.target_table} <span className="text-faint">/</span> {item.targetLabel}
                </>
              }
              summary={item.diff_summary}
              meta={
                <>
                  <Tag tone={source.tone}>{source.label}</Tag>
                  <Tag tone={action === "create" ? "add" : action === "delete" ? "del" : "neutral"}>{action}</Tag>
                </>
              }
              changes={changesFor(item)}
              footer={
                <>
                  {portfolioEnabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSync((v) => !v);
                      }}
                      className={cn("mr-auto font-mono text-[11px]", sync ? "text-ink" : "text-muted")}
                      aria-pressed={sync}
                    >
                      sync to portfolio: <span className={sync ? "text-add" : "text-muted"}>{sync ? "on" : "off"}</span>
                      {isActive && <span className="text-faint"> [s]</span>}
                    </button>
                  )}
                  {action !== "delete" && (
                    <Button size="sm" variant="ghost" shortcut={isActive ? "e" : undefined} onClick={() => setEditing(item)}>
                      edit
                    </Button>
                  )}
                  <Button size="sm" variant="danger" shortcut={isActive ? "r" : undefined} loading={busy === item.id} onClick={() => resolve(item, "reject")}>
                    reject
                  </Button>
                  <Button size="sm" variant="primary" shortcut={isActive ? "a" : undefined} loading={busy === item.id} onClick={() => resolve(item, "approve")}>
                    approve
                  </Button>
                </>
              }
            />
          </div>
        );
      })}
      <EditProposal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={(row) => {
          setItems((all) => all.map((i) => (i.id === row.id ? { ...i, payload: row.payload } : i)));
          setEditing(null);
          toast({ message: "proposal updated", tone: "ok" });
        }}
      />
    </div>
  );
}

type Draft = Record<string, string | boolean>;

function toDraft(fields: Record<string, unknown>): Draft {
  const draft: Draft = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "boolean") draft[key] = value;
    else if (Array.isArray(value))
      draft[key] = value
        .map((v) => (v && typeof v === "object" && "url" in v ? `${(v as { label: string }).label} | ${(v as { url: string }).url}` : String(v)))
        .join("\n");
    else draft[key] = value == null ? "" : String(value);
  }
  return draft;
}

function fromDraft(draft: Draft, original: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    const was = original[key];
    if (typeof value === "boolean") out[key] = value;
    else if (Array.isArray(was) || key === "links" || key === "bullets" || key === "tags" || key === "metrics") {
      const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
      out[key] =
        key === "links"
          ? lines.map((l) => {
              const [label, url] = l.split("|").map((p) => p.trim());
              return { label: url ? label : "Link", url: url ?? label };
            })
          : lines;
    } else if (typeof was === "number") out[key] = Number(value);
    else out[key] = value === "" && was == null ? null : value;
  }
  return out;
}

/** Edit a proposal's fields before approving it. */
function EditProposal({
  item,
  onClose,
  onSaved,
}: {
  item: ReviewItem | null;
  onClose: () => void;
  onSaved: (row: ReviewItem) => void;
}) {
  const fields = item ? split(item).fields : {};
  const [draft, setDraft] = useState<Draft>({});
  const [forId, setForId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (item && forId !== item.id) {
    setForId(item.id);
    setDraft(toDraft(fields));
    setError(null);
  }

  async function save() {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const { row } = await api<{ row: ReviewItem }>("/api/updates/pending", "PATCH", { id: item.id, payload: fromDraft(draft, fields) });
      onSaved({ ...item, payload: row.payload });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!item} onClose={onClose} label="Edit proposal" className="max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-4 p-4"
      >
        <div className="font-mono text-label uppercase text-muted">
          edit · {item?.target_table} / {item?.targetLabel}
        </div>
        <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {Object.entries(draft).map(([key, value]) =>
            typeof value === "boolean" ? (
              <label key={key} className="flex items-center gap-2 font-mono text-[13px]">
                <input type="checkbox" checked={value} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} />
                {key}
              </label>
            ) : (
              <Field key={key} label={key} hint={value.includes("\n") || ["bullets", "metrics", "tags", "links"].includes(key) ? (key === "links" ? "one per line: label | url" : "one per line") : undefined}>
                {(a) =>
                  value.length > 60 || value.includes("\n") || ["bullets", "metrics", "tags", "links", "summary", "description", "long_description", "notes"].includes(key) ? (
                    <Textarea {...a} rows={4} value={value} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                  ) : (
                    <Input {...a} value={value} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                  )
                }
              </Field>
            )
          )}
        </div>
        {error && <p className="font-mono text-xs text-del">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            save proposal
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
