import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/profile/basics — updates name, headline, summary, location, email, links. */
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json();
  const { name, headline, summary, location, email, links } = body;

  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      headline,
      summary,
      location,
      email,
      links,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
