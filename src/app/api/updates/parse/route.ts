import { authed, dbFail, HttpError, parseBody } from "@/lib/api/route";
import { noteInput } from "@/lib/schema/inputs";
import { loadProfile } from "@/lib/profile";
import { parseUpdateText } from "@/lib/ai/parse-update";

/** POST /api/updates/parse — turns a plain-English note into queued proposals. */
export const POST = authed(async (ctx) => {
  const { note } = await parseBody(ctx.req, noteInput);
  const loaded = await loadProfile(ctx.supabase, ctx.profileId);
  if (!loaded) throw new HttpError(404, "Profile not found");

  let result;
  try {
    result = await parseUpdateText(note, loaded.profile);
  } catch (err) {
    if (err instanceof Error && err.message === "AI_NOT_CONFIGURED") {
      throw new HttpError(
        501,
        "AI updates aren't set up yet. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or LOCAL_AI_BASE_URL for a local model — see the Configuration section in README.md. You can still add and edit everything by hand on the Profile page.",
        { not_configured: true }
      );
    }
    console.error(err);
    throw new HttpError(502, err instanceof Error ? err.message : "Couldn't parse that update.");
  }

  // Drop proposals that can't be valid: updates/deletes need a real id from this profile.
  const knownIds = new Set(
    [
      ...loaded.profile.experience,
      ...loaded.profile.projects,
      ...loaded.profile.skills,
      ...loaded.profile.education,
    ].map((r) => r.id)
  );
  const updates = result.updates.filter((u) => {
    if (u.action === "create") return u.target_table !== "profiles";
    if (u.target_table === "profiles") return u.action === "update";
    return u.target_id !== null && knownIds.has(u.target_id);
  });

  if (updates.length === 0) {
    return {
      pending: [],
      clarification_needed:
        result.clarification_needed ??
        (result.updates.length ? "I couldn't match that to anything in your profile. Can you be more specific?" : null),
    };
  }

  const { data, error } = await ctx.supabase
    .from("pending_updates")
    .insert(
      updates.map((u) => ({
        profile_id: ctx.profileId,
        source: "ai_chat" as const,
        target_table: u.target_table,
        payload: { ...u.payload, __action: u.action, __target_id: u.target_id },
        diff_summary: u.diff_summary,
        status: "pending" as const,
      }))
    )
    .select();
  dbFail(error);

  return { pending: data, clarification_needed: null };
});
