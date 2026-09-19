import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";

export async function POST(req: Request) {
  const profileId = await getCurrentProfileId();
  if (!profileId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const supabase = await createClient();
  const { error } = await supabase.from("experience").insert({
    profile_id: profileId,
    role: body.role,
    org: body.org,
    location: body.location ?? null,
    start_date: body.start_date,
    end_date: body.end_date ?? null,
    bullets: body.bullets ?? [],
    tags: body.tags ?? [],
    source: "loom",
    updated_at: new Date().toISOString(),
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
    .from("experience")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
