import { NextResponse } from "next/server";
import { getProfile } from "@/lib/profile";

/**
 * GET /api/profile
 *
 * This is the integration point for any external portfolio site.
 * It returns the current user's profile as JSON — any framework
 * (Next.js, Astro, Hugo, plain HTML+fetch) can pull this at build
 * time or request time and render it however it wants.
 *
 * Phase 1: single-user, reads the signed-in user's own profile.
 * Later phases add a public read-only token so this can be called
 * from a separate deployed site without a session.
 */
export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(profile, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
