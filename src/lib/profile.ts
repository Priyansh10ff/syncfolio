import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  Profile,
  Link,
  ProfileSettings,
} from "@/lib/schema/profile";

type ProfileRow = {
  id: string;
  name: string | null;
  headline: string | null;
  summary: string | null;
  location: string | null;
  email: string | null;
  links: Link[] | null;
  updated_at: string;
  resume_enabled: boolean;
  portfolio_enabled: boolean;
  portfolio_auto_sync: boolean;
};

/** Loads every content table for a profile, in display order. */
async function assembleProfile(supabase: SupabaseClient, row: ProfileRow): Promise<Profile> {
  const [{ data: experience }, { data: projects }, { data: skills }, { data: education }] =
    await Promise.all([
      supabase
        .from("experience")
        .select("*")
        .eq("profile_id", row.id)
        .order("sort_order", { ascending: true })
        .order("start_date", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .eq("profile_id", row.id)
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false }),
      supabase
        .from("skills")
        .select("*")
        .eq("profile_id", row.id)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("education")
        .select("*")
        .eq("profile_id", row.id)
        .order("sort_order", { ascending: true })
        .order("start_date", { ascending: false }),
    ]);

  return {
    name: row.name ?? "",
    headline: row.headline ?? undefined,
    summary: row.summary ?? undefined,
    location: row.location ?? undefined,
    email: row.email || undefined,
    links: row.links ?? [],
    experience: experience ?? [],
    projects: projects ?? [],
    skills: skills ?? [],
    education: education ?? [],
    updated_at: row.updated_at,
  };
}

function settingsOf(row: ProfileRow): ProfileSettings {
  return {
    resume_enabled: row.resume_enabled,
    portfolio_enabled: row.portfolio_enabled,
    portfolio_auto_sync: row.portfolio_auto_sync,
  };
}

/** The live profile + settings for a known profile id, using the given client. */
export async function loadProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<{ profile: Profile; settings: ProfileSettings } | null> {
  const { data: row } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single<ProfileRow>();
  if (!row) return null;
  return { profile: await assembleProfile(supabase, row), settings: settingsOf(row) };
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
