import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";
import { triggerWebhook } from "@/lib/webhook";

export async function POST(req: Request) {
  const profileId = await getCurrentProfileId();
  if (!profileId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({
    profile_id: profileId,
    name: body.name,
    description: body.description ?? "",
    bullets: body.bullets ?? [],
    links: body.links ?? [],
    tags: body.tags ?? [],
    metrics: body.metrics ?? [],
    featured: body.featured ?? false,
    source: "loom",
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  triggerWebhook(profileId, { section: "projects", action: "create" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const profileId = await getCurrentProfileId();
  if (!profileId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await req.json();
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  triggerWebhook(profileId, { section: "projects", action: "delete", id });
  return NextResponse.json({ ok: true });
}
