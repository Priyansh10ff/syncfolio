"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, InlineField, Label, useToast } from "@/components/ui";
import { api } from "@/lib/api/client";

const USERNAME = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

/** GitHub username + scan. New public repos arrive in the queue below as proposals. */
export function GithubScan({ initialUsername }: { initialUsername: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [scanning, setScanning] = useState(false);

  async function scan() {
    setScanning(true);
    try {
      const res = await api<{ pending: unknown[]; message?: string }>("/api/sync/github-scan", "POST");
      toast({ message: res.pending.length ? `${res.pending.length} new repo${res.pending.length === 1 ? "" : "s"} proposed` : res.message ?? "nothing new", tone: res.pending.length ? "ok" : "neutral" });
      router.refresh();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      <div className="flex flex-col gap-1 min-w-60 flex-1">
        <Label>github username</Label>
        <InlineField
          label="GitHub username"
          mono
          value={username}
          placeholder="add your username"
          validate={(v) => (v === "" || USERNAME.test(v) ? null : "Not a valid GitHub username")}
          onSave={async (v) => {
            await api("/api/profile/github", "PATCH", { github_username: v });
            setUsername(v);
          }}
        />
      </div>
      <Button variant="primary" onClick={scan} loading={scanning} disabled={!username}>
        scan public repos
      </Button>
    </div>
  );
}
