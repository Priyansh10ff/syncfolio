"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, DataTable, EmptyState, Tag, useToast } from "@/components/ui";
import { api } from "@/lib/api/client";
import { ago } from "@/lib/time";
import type { PendingUpdateRow } from "@/lib/schema/pending-update-row";

const TONE = { approved: "add", rejected: "del", undone: "neutral", pending: "neutral" } as const;

/** Recently resolved proposals; the latest approval can be undone. */
export function History({ rows }: { rows: PendingUpdateRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const latestApproved = rows.find((r) => r.status === "approved")?.id;

  async function undo(id: string) {
    setBusy(true);
    try {
      await api("/api/updates/undo", "POST", { id });
      toast({ message: "undone", tone: "ok" });
      router.refresh();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (rows.length === 0) return <EmptyState>nothing resolved yet</EmptyState>;

  return (
    <DataTable
      label="Resolved proposals"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        { key: "status", header: "status", width: "w-28", render: (r) => <Tag tone={TONE[r.status]}>{r.status}</Tag> },
        { key: "what", header: "change", mono: false, render: (r) => <span className="text-[13px]">{r.diff_summary ?? r.target_table}</span> },
        { key: "when", header: "when", width: "w-28", render: (r) => <span className="text-muted">{ago(r.resolved_at)}</span> },
        {
          key: "undo",
          header: "",
          align: "right",
          width: "w-24",
          render: (r) =>
            r.id === latestApproved ? (
              <Button size="sm" variant="ghost" loading={busy} onClick={() => undo(r.id)}>
                undo
              </Button>
            ) : null,
        },
      ]}
    />
  );
}
