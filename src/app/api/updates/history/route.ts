import { authed, dbFail } from "@/lib/api/route";

/** GET /api/updates/history — the 50 most recently resolved proposals. */
export const GET = authed(async (ctx) => {
  const { data, error } = await ctx.supabase
    .from("pending_updates")
    .select("id, source, target_table, payload, diff_summary, status, resolved_at, created_at")
    .eq("profile_id", ctx.profileId)
    .neq("status", "pending")
    .order("resolved_at", { ascending: false, nullsFirst: false })
    .limit(50);
  dbFail(error);
  return { history: data };
});
