import { createClient } from "@/lib/supabase/server";

/** Resolves the signed-in user's profile_id, or null if not signed in / no profile yet. */
export async function getCurrentProfileId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return data?.id ?? null;
}
