import { authed, dbFail } from "@/lib/api/route";

/** GET /api/updates/pending — unresolved proposals from every source. */
export const GET = authed(async (ctx) => {
  const { data, error } = await ctx.supabase
    .from("pending_updates")
    .select("*")
    .eq("profile_id", ctx.profileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  dbFail(error);
  return { pending: data };
});
