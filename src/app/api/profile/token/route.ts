import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/profile/token — rotates the public read token. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .update({ public_token: crypto.randomUUID() })
    .eq("user_id", user.id)
    .select("public_token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ public_token: data.public_token });
}
