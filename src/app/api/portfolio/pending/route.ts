import { authed, requireModule } from "@/lib/api/route";
import { unpublishedChanges } from "@/lib/portfolio/publish";

/** GET /api/portfolio/pending — live portfolio view vs the last published snapshot. */
export const GET = authed(async (ctx) => {
  requireModule(ctx, "portfolio");
  return unpublishedChanges(ctx.supabase, ctx.profileId);
});
