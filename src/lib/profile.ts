import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Profile, emptyProfile } from "@/lib/schema/profile";

async function assembleProfile(
  supabase: SupabaseClient,
  profileRow: any
): Promise<Profile> {
  const [{ data: experience }, { data: projects }, { data: skills }, { data: education }] =
    await Promise.all([
      supabase
        .from("experience")
        .select("*")
        .eq("profile_id", profileRow.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .eq("profile_id", profileRow.id)
        .order("updated_at", { ascending: false }),
      supabase.from("skills").select("*").eq("profile_id", profileRow.id),
      supabase
        .from("education")
        .select("*")
        .eq("profile_id", profileRow.id)
        .order("start_date", { ascending: false }),
    ]);

  return {
    name: profileRow.name ?? "",
    headline: profileRow.headline ?? undefined,
    summary: profileRow.summary ?? undefined,
    location: profileRow.location ?? undefined,
    email: profileRow.email ?? undefined,
    links: profileRow.links ?? [],
    experience: experience ?? [],
    projects: projects ?? [],
    skills: skills ?? [],
    education: education ?? [],
    updated_at: profileRow.updated_at,
  };
}

/** Loads the signed-in user's own profile (dashboard, resume, internal use). */
export async function getProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return emptyProfile();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profileRow) return emptyProfile();
  return assembleProfile(supabase, profileRow);
}

/**
 * Loads a profile by its public capability token — no session required.
 * This is what powers the token-authenticated /api/profile read that
 * external portfolio sites use. Returns null if the token doesn't
 * match anything or the service role key isn't configured.
 */
export async function getProfileByToken(token: string): Promise<Profile | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: profileRow } = await admin
    .from("profiles")
    .select("*")
    .eq("public_token", token)
    .single();

  if (!profileRow) return null;
  return assembleProfile(admin, profileRow);
}

/** Ensures a profiles row exists for the current user, creating one if needed. */
export async function ensureProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (data) return data.id as string;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ user_id: userId, name: "" })
    .select("id")
    .single();

  if (error) throw error;
  return created.id as string;
}
