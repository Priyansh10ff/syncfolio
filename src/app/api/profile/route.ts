import { NextResponse } from "next/server";
import { getProfile, getProfileByToken } from "@/lib/profile";

/**
 * GET /api/profile
 * GET /api/profile?token=<public_token>
 *
 * This is the integration point for any external portfolio site.
 * Signed-in requests (from this app's own dashboard) return the
 * caller's own profile. A separately deployed site — which has no
 * session — passes its `token` from Settings > Publish instead.
 * Either way the response is the same JSON shape, so any framework
 * can pull this at build time or request time and render it however
 * it wants.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  const profile = token ? await getProfileByToken(token) : await getProfile();

  if (!profile) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  return NextResponse.json(profile, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
