import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";
import SyncClient from "./sync-client";

export default async function SyncPage() {
  const profileId = await getCurrentProfileId();
  let pending: any[] = [];
  let githubUsername: string | null = null;

  if (profileId) {
    const supabase = await createClient();
    const [{ data: pendingRows }, { data: profileRow }] = await Promise.all([
      supabase
        .from("pending_updates")
        .select("*")
        .eq("profile_id", profileId)
        .eq("status", "pending")
        .in("source", ["github_scan", "external_sync"])
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("github_username").eq("id", profileId).single(),
    ]);
    pending = pendingRows ?? [];
    githubUsername = profileRow?.github_username ?? null;
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-1">Sync</h1>
      <p className="text-sm text-[var(--loom-muted)] mb-8">
        Suggestions from your GitHub activity and edits made directly on your
        portfolio. Nothing here writes until you approve it.
      </p>
      <SyncClient initialPending={pending} initialGithubUsername={githubUsername} />
    </div>
  );
}
