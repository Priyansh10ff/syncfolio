import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";
import { getProfile } from "@/lib/profile";
import { parseUpdateText } from "@/lib/ai/parse-update";

export async function POST(req: Request) {
  const profileId = await getCurrentProfileId();
  if (!profileId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { note } = await req.json();
  if (!note || typeof note !== "string" || !note.trim()) {
    return NextResponse.json({ error: "Empty note" }, { status: 400 });
  }

  const profile = await getProfile();

  let result;
  try {
    result = await parseUpdateText(note, profile);
  } catch (err) {
    if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error:
            "AI updates aren't set up yet. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or LOCAL_AI_BASE_URL for a local model — see the Configuration section in README.md. You can still add and edit everything by hand on the Profile page.",
          not_configured: true,
        },
        { status: 501 }
      );
    }
    const message = err instanceof Error ? err.message : "Couldn't parse that update.";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (result.updates.length === 0) {
    return NextResponse.json({
      pending: [],
      clarification_needed: result.clarification_needed,
    });
  }

  const supabase = await createClient();
  const rows = result.updates.map((u) => ({
    profile_id: profileId,
    source: "ai_chat" as const,
    target_table: u.target_table,
    payload: { ...u.payload, __action: u.action, __target_id: u.target_id },
    diff_summary: u.diff_summary,
    status: "pending" as const,
  }));

  const { data, error } = await supabase.from("pending_updates").insert(rows).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pending: data, clarification_needed: null });
}
