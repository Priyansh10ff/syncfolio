import { NextResponse } from "next/server";
import { authed } from "@/lib/api/route";
import { loadProfile } from "@/lib/profile";

/**
 * GET /api/profile — the signed-in user's live profile and settings.
 *
 * External sites read the published portfolio from /api/portfolio
 * instead. Old `?token=` links are redirected there so existing
 * integrations keep working.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.has("token")) {
    const target = new URL("/api/portfolio", url.origin);
    target.searchParams.set("token", url.searchParams.get("token")!);
    return NextResponse.redirect(target, 308);
  }
  return liveProfile(req);
}

const liveProfile = authed(async (ctx) => {
  const loaded = await loadProfile(ctx.supabase, ctx.profileId);
  return loaded ?? { error: "Not found" };
});
