import { authed, dbFail, HttpError, parseBody } from "@/lib/api/route";
import { settingsInput } from "@/lib/schema/inputs";

/** GET /api/settings — module switches and the auto-sync default. */
export const GET = authed(async (ctx) => ctx.settings);

/** PATCH /api/settings — at least one of resume / portfolio must stay on. */
export const PATCH = authed(async (ctx) => {
  const changes = await parseBody(ctx.req, settingsInput);
  const next = { ...ctx.settings, ...changes };
  if (!next.resume_enabled && !next.portfolio_enabled) {
    throw new HttpError(422, "Keep at least one of Resume or Portfolio turned on.");
  }
  const { error } = await ctx.supabase.from("profiles").update(next).eq("id", ctx.profileId);
  dbFail(error);
  return next;
});
