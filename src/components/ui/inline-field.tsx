"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Accessible name, e.g. "Headline". */
  label: string;
  value: string;
  /** Persist the new value. Throw (or reject) with a message to show an error. */
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  mono?: boolean;
  /** Return an error message to block saving, or null. */
  validate?: (value: string) => string | null;
  className?: string;
};

/**
 * Click-to-edit text that saves itself. Enter (⌘/Ctrl+Enter when
 * multiline) or blur saves; Escape cancels. A saved row flashes once.
 */
export function InlineField({
  label,
  value,
  onSave,
  placeholder = "empty",
  multiline,
  mono,
  validate,
  className,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function cancel() {
    setDraft(value);
    setError(null);
    setEditing(false);
    requestAnimationFrame(() => viewRef.current?.focus());
  }

  async function commit() {
    if (saving) return;
    const next = draft.trim();
    if (next === value.trim()) {
      setEditing(false);
      setError(null);
      return;
    }
    const invalid = validate?.(next) ?? null;
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setError(null);
      setEditing(false);
      setFlash((n) => n + 1);
      requestAnimationFrame(() => viewRef.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void commit();
    }
  }

  const text = cn("text-[13px]", mono && "font-mono");

  if (editing) {
    const shared = {
      ref: inputRef,
      "aria-label": label,
      "aria-invalid": !!error || undefined,
      value: draft,
      disabled: saving,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
      onKeyDown,
      onBlur: () => void commit(),
      className: cn(
        "w-full rounded-sm border bg-surface px-1.5 py-0.5 outline-none",
        error ? "border-del" : "border-thread",
        text
      ),
    };
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {multiline ? <textarea rows={3} {...shared} /> : <input {...shared} />}
        {error && <p className="font-mono text-xs text-del">{error}</p>}
      </div>
    );
  }

  return (
    <button
      ref={viewRef}
      key={flash}
      type="button"
      aria-label={`${label}: ${value || "empty"}. Press Enter to edit.`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        "w-full text-left rounded-sm px-1.5 py-0.5 -mx-1.5 border border-transparent",
        "hover:border-line focus-visible:border-line cursor-text",
        flash > 0 && "animate-flash",
        multiline && "whitespace-pre-wrap",
        text,
        className
      )}
    >
      {value ? value : <span className="text-muted">{placeholder}</span>}
    </button>
  );
}
