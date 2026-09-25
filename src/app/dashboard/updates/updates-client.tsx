"use client";

import { useState } from "react";
import { PendingUpdateRow } from "@/lib/schema/pending-update-row";

type PendingRow = PendingUpdateRow;

export default function UpdatesClient({
  initialPending,
}: {
  initialPending: PendingRow[];
}) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<PendingRow[]>(initialPending);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [clarification, setClarification] = useState<string | null>(null);

  async function submit() {
    if (!note.trim()) return;
    setLoading(true);
    setError(null);
    setClarification(null);

    const res = await fetch("/api/updates/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.not_configured) {
        setNotConfigured(true);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } else if (data.clarification_needed) {
      setClarification(data.clarification_needed);
    } else {
      setPending([...data.pending, ...pending]);
      setNote("");
    }
    setLoading(false);
  }

  async function resolve(id: string, decision: "approve" | "reject") {
    setPending((p) => p.filter((row) => row.id !== id));
    await fetch("/api/updates/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {notConfigured && (
        <div className="text-sm border border-[var(--loom-line)] rounded px-3 py-2 bg-[var(--loom-thread-soft)]">
          AI updates need a model provider configured — Claude, GPT, Gemini, or a
          local model. See the Configuration section in the README. Until then,
          add and edit everything by hand on the{" "}
          <a href="/dashboard/profile" className="underline">
            Profile page
          </a>{" "}
          — that always works.
        </div>
      )}
      <div className="flex flex-col gap-2">
        <textarea
          className="border border-[var(--loom-line)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--loom-thread)]"
          rows={3}
          placeholder="e.g. Added Redis caching to Patchwork, cut p95 latency 40%"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={loading || !note.trim()}
          className="self-start bg-[var(--loom-thread)] text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Draft update"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {clarification && (
          <p className="text-sm text-[var(--loom-muted)]">{clarification}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          Pending review
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-[var(--loom-muted)]">Nothing waiting on you.</p>
        )}
        {pending.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between border border-[var(--loom-line)] rounded px-3 py-2"
          >
            <div>
              <div className="text-sm">{row.diff_summary}</div>
              <div className="text-xs text-[var(--loom-muted)]">{row.target_table}</div>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => resolve(row.id, "approve")}
                className="text-[var(--loom-thread)] hover:underline"
              >
                Approve
              </button>
              <button
                onClick={() => resolve(row.id, "reject")}
                className="text-[var(--loom-muted)] hover:underline"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
