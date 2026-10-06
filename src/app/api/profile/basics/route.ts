import { authed, dbFail, parseBody } from "@/lib/api/route";
import { basicsInput } from "@/lib/schema/inputs";

/** PATCH /api/profile/basics — name, headline, summary, location, email, links. */
export const PATCH = authed(async (ctx) => {
  const fields = await parseBody(ctx.req, basicsInput);
  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      ...fields,
      ...(fields.email === "" ? { email: null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.profileId);
  dbFail(error);
  return { ok: true };
});
