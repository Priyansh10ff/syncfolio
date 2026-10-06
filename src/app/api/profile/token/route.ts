import { authed, dbFail } from "@/lib/api/route";

/** POST /api/profile/token — rotates the public token; the old one stops working at once. */
export const POST = authed(async (ctx) => {
  const { data, error } = await ctx.supabase
    .from("profiles")
    .update({ public_token: crypto.randomUUID() })
    .eq("id", ctx.profileId)
    .select("public_token")
    .single();
  dbFail(error);
  return { public_token: data!.public_token };
});
