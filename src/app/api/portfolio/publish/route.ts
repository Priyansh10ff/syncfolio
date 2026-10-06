import { authed, requireModule } from "@/lib/api/route";
import { publishPortfolio } from "@/lib/portfolio/publish";

/** POST /api/portfolio/publish — freeze a new snapshot and fire the webhook. */
export const POST = authed(async (ctx) => {
  requireModule(ctx, "portfolio");
  const { published, snapshot } = await publishPortfolio(ctx.supabase, ctx.profileId);
  return {
    published,
    published_at: snapshot?.published_at ?? null,
    changes: published ? snapshot?.changes ?? [] : [],
  };
});
