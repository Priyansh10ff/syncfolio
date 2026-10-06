import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/profile";
import { unpublishedChanges } from "@/lib/portfolio/publish";
import PortfolioClient from "./portfolio-client";
import ModuleOff from "../module-off";

export default async function PortfolioPage() {
  const settings = await getSettings();
  if (!settings.portfolio_enabled) return <ModuleOff name="Portfolio" />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: row } = await supabase
    .from("profiles")
    .select("id, public_token, webhook_url")
    .eq("user_id", user!.id)
    .single();

  const pending = row
    ? await unpublishedChanges(supabase, row.id)
    : { changes: [], last_published_at: null };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-1">Portfolio</h1>
      <p className="text-sm text-[var(--sf-muted)] mb-8">
        Your site reads the last published version. Point any stack at it —
        no portfolio app is bundled here on purpose.
      </p>
      <PortfolioClient
        publicToken={row?.public_token ?? null}
        webhookUrl={row?.webhook_url ?? null}
        initialChanges={pending.changes}
        initialPublishedAt={pending.last_published_at}
        autoSync={settings.portfolio_auto_sync}
      />
    </div>
  );
}
