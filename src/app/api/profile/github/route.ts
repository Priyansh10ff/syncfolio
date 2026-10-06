import { authed, dbFail, parseBody } from "@/lib/api/route";
import { githubInput } from "@/lib/schema/inputs";

/** PATCH /api/profile/github — the username scanned on the Sync page. */
export const PATCH = authed(async (ctx) => {
  const { github_username } = await parseBody(ctx.req, githubInput);
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ github_username: github_username || null })
    .eq("id", ctx.profileId);
  dbFail(error);
  return { ok: true };
});
