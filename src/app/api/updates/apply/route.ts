import { authed, dbFail, HttpError, parseBody } from "@/lib/api/route";
import { applyInput } from "@/lib/schema/inputs";
import { applyProposal, maybeSyncPortfolio } from "@/lib/updates/apply";
import type { PendingUpdateRow } from "@/lib/schema/pending-update-row";

/**
 * POST /api/updates/apply — the single path from `pending_updates` into
 * real tables. Body: { id, decision: "approve" | "reject", sync_portfolio? }.
 * `sync_portfolio` defaults to the profile's portfolio_auto_sync setting.
 */
export const POST = authed(async (ctx) => {
  const { id, decision, sync_portfolio } = await parseBody(ctx.req, applyInput);

  const { data: pending } = await ctx.supabase
    .from("pending_updates")
    .select("*")
    .eq("id", id)
    .eq("profile_id", ctx.profileId)
    .maybeSingle<PendingUpdateRow>();
  if (!pending) throw new HttpError(404, "Update not found");
  if (pending.status !== "pending") throw new HttpError(409, "Already resolved");

  const resolved_at = new Date().toISOString();

  if (decision === "reject") {
    const { error } = await ctx.supabase
      .from("pending_updates")
      .update({ status: "rejected", resolved_at })
      .eq("id", id);
    dbFail(error);
    return { ok: true };
  }

  const applied = await applyProposal(ctx, pending);

  const { error } = await ctx.supabase
    .from("pending_updates")
    .update({
      status: "approved",
      resolved_at,
      applied_row_id: applied.appliedRowId,
      previous: applied.previous,
    })
    .eq("id", id);
  dbFail(error);

  const portfolio = await maybeSyncPortfolio(ctx, sync_portfolio);
  return { ok: true, portfolio };
});
