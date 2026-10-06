import { NextResponse } from "next/server";
import { HttpError, open } from "@/lib/api/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { latestSnapshot } from "@/lib/portfolio/publish";

/**
 * GET /api/portfolio?token=<public_token>
 *
 * The integration point for external portfolio sites. Returns the latest
 * *published* portfolio view — never the live profile, and never rows
 * hidden from the portfolio. Any framework can read this at build or
 * request time.
 */
export const GET = open(async (req) => {
  const admin = createAdminClient();
  if (!admin) {
    throw new HttpError(501, "Public reads aren't configured on this server (missing SUPABASE_SERVICE_ROLE_KEY).");
  }

  const token = new URL(req.url).searchParams.get("token");
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) throw new HttpError(404, "Invalid token");

  const { data: profile } = await admin
    .from("profiles")
    .select("id, portfolio_enabled")
    .eq("public_token", token)
    .maybeSingle();
  if (!profile || !profile.portfolio_enabled) throw new HttpError(404, "Invalid token");

  const snapshot = await latestSnapshot(admin, profile.id);
  if (!snapshot) throw new HttpError(404, "Nothing published yet");

  return NextResponse.json(
    { ...snapshot.data, published_at: snapshot.published_at },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
});
