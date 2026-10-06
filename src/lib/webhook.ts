import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortfolioChange } from "@/lib/portfolio/publish";

export type PublishWebhookPayload = {
  published_at: string;
  changes: PortfolioChange[];
};

/**
 * Notifies the user's portfolio site that a new version was published,
 * listing every section/row that changed so the site can revalidate
 * only those pages. Fired once per publish, never per edit. Best-effort:
 * a slow or failing receiver never fails the publish (5s timeout).
 */
export async function sendPublishWebhook(
  supabase: SupabaseClient,
  profileId: string,
  payload: PublishWebhookPayload
) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("webhook_url")
      .eq("id", profileId)
      .single();
    if (!data?.webhook_url) return;

    await fetch(data.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      // The site stays on its previous version until the next publish.
    });
  } catch {
    // Never let webhook plumbing break the publish itself.
  }
}
