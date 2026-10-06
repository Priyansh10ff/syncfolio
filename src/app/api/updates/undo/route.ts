import { authed, dbFail, HttpError, parseBody } from "@/lib/api/route";
import { undoInput } from "@/lib/schema/inputs";
import { maybeSyncPortfolio, revertProposal } from "@/lib/updates/apply";
import type { PendingUpdateRow } from "@/lib/schema/pending-update-row";

/**
 * POST /api/updates/undo — reverses the most recent approval. Only the
 * latest one can be undone, so a revert never clobbers a later change
 * to the same row. Body: { id, sync_portfolio? }.
 */
export const POST = authed(async (ctx) => {
  const { id, sync_portfolio } = await parseBody(ctx.req, undoInput);

  const { data: latest } = await ctx.supabase
    .from("pending_updates")
    .select("*")
    .eq("profile_id", ctx.profileId)
    .eq("status", "approved")
    .order("resolved_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle<PendingUpdateRow>();

  if (!latest) throw new HttpError(404, "Nothing to undo");
  if (latest.id !== id) throw new HttpError(409, "Only the most recent approval can be undone.");

  await revertProposal(ctx, latest);

  const { error } = await ctx.supabase
    .from("pending_updates")
    .update({ status: "undone", resolved_at: new Date().toISOString() })
    .eq("id", id);
  dbFail(error);

  const portfolio = await maybeSyncPortfolio(ctx, sync_portfolio);
  return { ok: true, portfolio };
});
