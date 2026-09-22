import { createClient } from "@/lib/supabase/server";
import PortfolioClient from "./portfolio-client";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let publicToken: string | null = null;
  let webhookUrl: string | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("public_token, webhook_url")
      .eq("user_id", user.id)
      .single();
    publicToken = data?.public_token ?? null;
    webhookUrl = data?.webhook_url ?? null;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-1">Portfolio</h1>
      <p className="text-sm text-[var(--loom-muted)] mb-8">
        Point your existing portfolio — any stack — at your data. No bundled
        portfolio app here on purpose.
      </p>
      <PortfolioClient publicToken={publicToken} webhookUrl={webhookUrl} />
    </div>
  );
}
