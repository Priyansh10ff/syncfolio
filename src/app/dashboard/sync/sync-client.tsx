"use client";

import { useState } from "react";

type PendingRow = {
  id: string;
  target_table: string;
  source: string;
  diff_summary: string;
};

const sourceLabel: Record<string, string> = {
  github_scan: "GitHub",
  external_sync: "External edit",
};

export default function SyncClient({
  initialPending,
  initialGithubUsername,
}: {
  initialPending: PendingRow[];
  initialGithubUsername: string | null;
}) {
  const [pending, setPending] = useState(initialPending);
  const [username, setUsername] = useState(initialGithubUsername ?? "");
  const [savingUsername, setSavingUsername] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveUsername() {
    setSavingUsername(true);
    await fetch("/api/profile/github", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ github_username: username }),
    });
    setSavingUsername(false);
  }

  async function scan() {
    setScanning(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/sync/github-scan", { method: "POST" });
    const data = await res.json();
    setScanning(false);

    if (!res.ok) {
      setError(data.error ?? "Scan failed.");
      return;
    }
    if (data.pending?.length) {
      setPending([...data.pending, ...pending]);
    } else {
      setMessage(data.message ?? "Nothing new.");
    }
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
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-[var(--loom-muted)] uppercase tracking-wide">
          GitHub
        </h2>
        <p className="text-sm text-[var(--loom-muted)]">
          Scans your public, non-fork repos and proposes new projects for the
          ones not already linked in your profile.
        </p>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 text-sm border border-[var(--loom-line)] rounded px-3 py-2 bg-white"
            placeholder="GitHub username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={saveUsername}
          />
          <button
            onClick={scan}
            disabled={scanning || !username.trim()}
            className="shrink-0 bg-[var(--loom-thread)] text-white rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {scanning ? "Scanning…" : "Scan now"}
          </button>
        </div>
        {savingUsername && (
          <p className="text-xs text-[var(--loom-muted)]">Saving…</p>
        )}
        {message && <p className="text-sm text-[var(--loom-muted)]">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="flex flex-col gap-3">
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
              <div className="text-xs text-[var(--loom-muted)]">
                {sourceLabel[row.source] ?? row.source} · {row.target_table}
              </div>
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
      </section>
    </div>
  );
}
