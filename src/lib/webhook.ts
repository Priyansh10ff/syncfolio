import { createClient } from "@/lib/supabase/server";

type WebhookPayload = {
  section: "profile" | "experience" | "projects" | "skills" | "education";
  action: "create" | "update" | "delete";
  id?: string;
};

/**
 * Notifies the user's portfolio site that something changed, and what.
 * Fire-and-forget — a slow or failing webhook never blocks the dashboard
 * action that triggered it. The payload names the section (and id, where
 * relevant) so the receiving site can revalidate just that page instead
 * of rebuilding everything.
 */
export async function triggerWebhook(profileId: string, payload: WebhookPayload) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("webhook_url")
      .eq("id", profileId)
      .single();

    if (!data?.webhook_url) return;

    fetch(data.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, changed_at: new Date().toISOString() }),
    }).catch(() => {
      // Best-effort. The dashboard action already succeeded; a webhook
      // miss just means the external site stays stale until next change
      // or its own poll/rebuild.
    });
  } catch {
    // Same — never let webhook plumbing break the actual write.
  }
}
