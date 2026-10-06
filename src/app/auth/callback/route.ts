import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";
import { safeNextPath } from "@/lib/safe-next";

/**
 * Magic-link landing route. Exchanges the one-time code for a session
 * cookie, makes sure the user has a profiles row, then continues to the
 * page they were originally headed to.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid`);
  }

  try {
    await ensureProfile(data.user.id);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=profile_create_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
