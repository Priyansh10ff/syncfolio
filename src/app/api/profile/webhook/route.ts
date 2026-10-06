import { authed, dbFail, parseBody } from "@/lib/api/route";
import { webhookInput } from "@/lib/schema/inputs";

/** PATCH /api/profile/webhook — URL called after each portfolio publish. */
export const PATCH = authed(async (ctx) => {
  const { webhook_url } = await parseBody(ctx.req, webhookInput);
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ webhook_url: webhook_url || null })
    .eq("id", ctx.profileId);
  dbFail(error);
  return { ok: true };
});
