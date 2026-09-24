import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";
import { PendingUpdateRow } from "@/lib/schema/pending-update-row";
import UpdatesClient from "./updates-client";

export default async function UpdatesPage() {
  const profileId = await getCurrentProfileId();
  let pending: PendingUpdateRow[] = [];

  if (profileId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pending_updates")
      .select("*")
      .eq("profile_id", profileId)
      .eq("status", "pending")
      .eq("source", "ai_chat")
      .order("created_at", { ascending: false });
    pending = data ?? [];
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-1">Updates</h1>
      <p className="text-sm text-[var(--loom-muted)] mb-8">
        Tell it what changed. It drafts the update — you approve before anything is saved.
      </p>
      <UpdatesClient initialPending={pending} />
    </div>
  );
}
