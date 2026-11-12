"use client";

import { useState } from "react";
import { Button, InlineField, Input } from "@/components/ui";
import type { Link } from "@/lib/schema/profile";
import { validateField, type FieldSpec } from "./specs";

type Save = (value: unknown) => Promise<void>;

/** Picks the right editor for a field kind. Every editor saves on its own. */
export function FieldEditor({ spec, value, onSave }: { spec: FieldSpec; value: unknown; onSave: Save }) {
  switch (spec.kind) {
    case "list":
      return <ListEditor label={spec.label} items={(value as string[]) ?? []} onSave={onSave} />;
    case "links":
      return <LinksEditor links={(value as Link[]) ?? []} onSave={onSave} />;
    case "tags":
      return (
        <InlineField
          label={spec.label}
          mono
          value={((value as string[]) ?? []).join(", ")}
          placeholder="comma, separated"
          onSave={(v) => onSave(v.split(",").map((t) => t.trim()).filter(Boolean))}
        />
      );
    case "bool":
      return (
        <label className="inline-flex items-center gap-2 font-mono text-[13px] cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => void onSave(e.target.checked)} />
          {value ? "yes" : "no"}
        </label>
      );
    case "select":
      return (
        <select
          aria-label={spec.label}
          value={(value as string) ?? ""}
          onChange={(e) => void onSave(e.target.value || null)}
          className="h-7 rounded-sm border border-line bg-surface px-2 font-mono text-[13px] text-ink"
        >
          <option value="">—</option>
          {spec.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <InlineField
          label={spec.label}
          mono={spec.kind === "month"}
          multiline={spec.kind === "long"}
          value={(value as string | null) ?? ""}
          placeholder={spec.placeholder ?? "empty"}
          validate={(v) => validateField(spec, v)}
          onSave={(v) => onSave(v === "" ? null : v)}
        />
      );
  }
}

/** Bullets / metrics: edit in place, reorder with ↑ ↓, remove, add. */
export function ListEditor({ label, items, onSave }: { label: string; items: string[]; onSave: Save }) {
  const [draft, setDraft] = useState("");
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return onSave(next);
  };

  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="group flex items-start gap-2">
            <span aria-hidden className="font-mono text-faint pt-0.5 select-none">•</span>
            <div className="flex-1 min-w-0">
              <InlineField
                label={`${label} ${i + 1}`}
                value={item}
                onSave={(v) => onSave(v ? items.map((x, j) => (j === i ? v : x)) : items.filter((_, j) => j !== i))}
              />
            </div>
            <span className="flex gap-0.5 opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 font-mono text-[11px]">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="px-1 text-muted hover:text-ink disabled:opacity-30">↑</button>
              <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="px-1 text-muted hover:text-ink disabled:opacity-30">↓</button>
              <button type="button" aria-label="Remove" onClick={() => onSave(items.filter((_, j) => j !== i))} className="px-1 text-muted hover:text-del">×</button>
            </span>
          </li>
        ))}
      </ul>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          await onSave([...items, draft.trim()]);
          setDraft("");
        }}
        className="flex items-center gap-2"
      >
        <span aria-hidden className="font-mono text-thread">+</span>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`add ${label === "metrics" ? "a metric" : "a bullet"}`} aria-label={`Add to ${label}`} className="h-7 border-transparent bg-transparent focus:bg-surface" mono={false} />
      </form>
    </div>
  );
}

/** Label → URL pairs. */
export function LinksEditor({ links, onSave }: { links: Link[]; onSave: Save }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!/^https?:\/\/\S+$/.test(url)) return setError("Use a full URL, https://…");
    setError(null);
    await onSave([...links, { label: label.trim() || new URL(url).hostname, url }]);
    setLabel("");
    setUrl("");
  }

  return (
    <div className="flex flex-col gap-1.5">
      {links.map((l, i) => (
        <div key={l.url + i} className="flex items-center gap-2 font-mono text-[13px]">
          <span className="text-ink">{l.label}</span>
          <span className="text-faint">→</span>
          <a href={l.url} target="_blank" rel="noreferrer" className="text-muted hover:text-thread truncate">{l.url}</a>
          <button type="button" aria-label={`Remove ${l.label}`} onClick={() => onSave(links.filter((_, j) => j !== i))} className="ml-auto text-muted hover:text-del">×</button>
        </div>
      ))}
      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <div className="w-32 shrink-0">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" aria-label="Link label" className="h-7" />
        </div>
        <div className="flex-1 min-w-48">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" aria-label="Link URL" invalid={!!error} className="h-7" />
        </div>
        <Button size="sm" type="submit">add link</Button>
      </form>
      {error && <p className="font-mono text-xs text-del">{error}</p>}
    </div>
  );
}
