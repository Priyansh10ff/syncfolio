import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";

export async function POST(req: Request) {
  const profileId = await getCurrentProfileId();
  if (!profileId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const supabase = await createClient();
  const { error } = await supabase.from("skills").insert({
    profile_id: profileId,
    name: body.name,
    category: body.category ?? null,
    level: body.level ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const profileId = await getCurrentProfileId();
  if (!profileId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await req.json();
  const supabase = await createClient();
  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
