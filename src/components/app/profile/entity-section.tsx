"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, EmptyState, Field, Input, SectionHeader, Tag, Textarea, ToggleChip, useToast } from "@/components/ui";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { ProfileSettings } from "@/lib/schema/profile";
import { FieldEditor } from "./field-editors";
import { validateField, type AnyRow, type SectionSpec } from "./specs";

const SOURCE_TAG: Record<string, string> = { ai: "ai", external: "gh/ext" };

/**
 * One profile section (experience, projects, skills, education) as a dense
 * list. A row expands into click-to-edit fields that save on their own.
 */
export function EntitySection({
  spec,
  initialRows,
  settings,
}: {
  spec: SectionSpec;
  initialRows: AnyRow[];
  settings: ProfileSettings;
}) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const url = `/api/${spec.table}`;

  const replace = (row: AnyRow) => setRows((all) => all.map((r) => (r.id === row.id ? row : r)));

  async function patch(id: string, fields: Record<string, unknown>) {
    const { row } = await api<{ row: AnyRow }>(url, "PATCH", { id, ...fields });
    replace(row);
    router.refresh();
  }

  async function safePatch(id: string, fields: Record<string, unknown>) {
    try {
      await patch(id, fields);
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    }
  }

  async function remove(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete((c) => (c === id ? null : c)), 3000);
      return;
    }
    try {
      await api(url, "DELETE", { id });
      setRows((all) => all.filter((r) => r.id !== id));
      toast({ message: `${spec.singular} deleted` });
      router.refresh();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    }
  }

  /** Swap with a neighbour, then renumber sort_order for the whole section. */
  async function move(index: number, d: -1 | 1) {
    const next = [...rows];
    [next[index], next[index + d]] = [next[index + d], next[index]];
    setRows(next);
    try {
      await Promise.all(
        next.map((r, i) => (r.sort_order === i ? null : api(url, "PATCH", { id: r.id, sort_order: i }))).filter(Boolean)
      );
      setRows(next.map((r, i) => ({ ...r, sort_order: i })));
      router.refresh();
    } catch (e) {
      setRows(rows);
      toast({ message: (e as Error).message, tone: "error" });
    }
  }

  const fields = spec.fields.filter((f) => !f.portfolioOnly || settings.portfolio_enabled);

  return (
    <section aria-labelledby={`sec-${spec.table}`} className="flex flex-col gap-2">
      <SectionHeader
        id={`sec-${spec.table}`}
        title={spec.title}
        count={rows.length}
        actions={
          <Button size="sm" variant="ghost" onClick={() => setAdding((a) => !a)}>
            {adding ? "cancel" : `+ ${spec.singular}`}
          </Button>
        }
      />

      {adding && (
        <AddRow
          spec={spec}
          onCreate={async (fields) => {
            const { row } = await api<{ row: AnyRow }>(url, "POST", { ...fields, sort_order: rows.length });
            setRows((all) => [...all, row]);
            setAdding(false);
            setOpen(row.id);
            router.refresh();
          }}
        />
      )}

      {rows.length === 0 && !adding && <EmptyState>no {spec.title} yet</EmptyState>}

      <ul className="flex flex-col">
        {rows.map((row, i) => {
          const isOpen = open === row.id;
          const source = typeof row.source === "string" ? SOURCE_TAG[row.source] : undefined;
          return (
            <li key={row.id} className={cn("border-b border-line/70", isOpen && "bg-surface/60")}>
              <div className="group flex items-center gap-3 py-2 pl-1">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`row-${row.id}`}
                  onClick={() => setOpen(isOpen ? null : row.id)}
                  className="flex-1 min-w-0 flex items-baseline gap-3 text-left"
                >
                  <span aria-hidden className="font-mono text-faint w-3">{isOpen ? "▾" : "▸"}</span>
                  <span className="font-mono text-[13px] text-ink truncate">{spec.label(row)}</span>
                  {source && <Tag tone="thread">{source}</Tag>}
                  <span className="text-[12px] text-muted truncate hidden sm:inline">{spec.meta(row)}</span>
                </button>
                <span className="flex items-center gap-1 font-mono text-[11px] opacity-50 group-hover:opacity-100 group-focus-within:opacity-100">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="px-1 text-muted hover:text-ink disabled:opacity-30">↑</button>
                  <button type="button" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="px-1 text-muted hover:text-ink disabled:opacity-30">↓</button>
                </span>
                <span className="flex gap-1">
                  {settings.resume_enabled && (
                    <ToggleChip label="R" title="Show on resume" on={row.show_on_resume !== false} onChange={(v) => safePatch(row.id, { show_on_resume: v })} />
                  )}
                  {settings.portfolio_enabled && (
                    <ToggleChip label="P" title="Show on portfolio" on={row.show_on_portfolio !== false} onChange={(v) => safePatch(row.id, { show_on_portfolio: v })} />
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className={cn("font-mono text-[11px] px-1", confirmDelete === row.id ? "text-del" : "text-faint hover:text-del")}
                  aria-label={confirmDelete === row.id ? `Confirm delete ${spec.label(row)}` : `Delete ${spec.label(row)}`}
                >
                  {confirmDelete === row.id ? "delete?" : "×"}
                </button>
              </div>
              {isOpen && (
                <div id={`row-${row.id}`} className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2 pb-4 pl-7 pr-2 animate-fade">
                  {fields.map((f) => (
                    <div key={f.key} className="contents">
                      <span className="font-mono text-label uppercase text-muted pt-1">
                        {f.label}
                        {f.portfolioOnly && <span className="text-faint"> · P</span>}
                      </span>
                      <div className="min-w-0">
                        <FieldEditor spec={f} value={row[f.key]} onSave={(v) => patch(row.id, { [f.key]: v })} />
                        {f.hint && <p className="font-mono text-[11px] text-faint mt-0.5">{f.hint}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AddRow({ spec, onCreate }: { spec: SectionSpec; onCreate: (fields: Record<string, string>) => Promise<void> }) {
  const createFields = spec.fields.filter((f) => spec.create.includes(f.key));
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const f of createFields) {
      const err = validateField(f, (values[f.key] ?? "").trim());
      if (err) nextErrors[f.key] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setFormError(null);
    try {
      const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
      await onCreate(body);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-dashed border-line-strong rounded-sm p-4 flex flex-col gap-3 animate-fade">
      <div className="grid gap-3 sm:grid-cols-3">
        {createFields.map((f, i) => (
          <Field key={f.key} label={`${f.label}${f.required ? "" : " (optional)"}`} error={errors[f.key]}>
            {(a) =>
              f.kind === "long" ? (
                <Textarea {...a} rows={1} value={values[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : (
                <Input {...a} autoFocus={i === 0} value={values[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              )
            }
          </Field>
        ))}
      </div>
      {formError && <p className="font-mono text-xs text-del">{formError}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" loading={saving} shortcut="↵">
          add {spec.singular}
        </Button>
      </div>
    </form>
  );
}
