import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";

const WRITABLE_TABLES = ["experience", "projects", "skills", "education", "profiles"] as const;

export async function POST(req: Request) {
  const profileId = await getCurrentProfileId();
  if (!profileId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id, decision } = await req.json();
  if (!id || (decision !== "approve" && decision !== "reject")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: pending, error: fetchError } = await supabase
    .from("pending_updates")
    .select("*")
    .eq("id", id)
    .eq("profile_id", profileId)
    .single();

  if (fetchError || !pending) {
    return NextResponse.json({ error: "Update not found" }, { status: 404 });
  }

  if (pending.status !== "pending") {
    return NextResponse.json({ error: "Already resolved" }, { status: 409 });
  }

  if (decision === "reject") {
    await supabase.from("pending_updates").update({ status: "rejected" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  const table = pending.target_table as (typeof WRITABLE_TABLES)[number];
  if (!WRITABLE_TABLES.includes(table)) {
    return NextResponse.json({ error: "Unknown target table" }, { status: 400 });
  }

  const { __action, __target_id, ...fields } = pending.payload as Record<string, unknown> & {
    __action: "create" | "update";
    __target_id: string | null;
  };

  let writeError = null;

  if (__action === "create") {
    const insertRow =
      table === "profiles" ? fields : { ...fields, profile_id: profileId, updated_at: new Date().toISOString() };
    const { error } = await supabase.from(table).insert(insertRow);
    writeError = error;
  } else {
    if (!__target_id) {
      return NextResponse.json({ error: "Missing target_id for update" }, { status: 400 });
    }
    const updateFields =
      table === "profiles" ? fields : { ...fields, updated_at: new Date().toISOString() };
    const query =
      table === "profiles"
        ? supabase.from(table).update(updateFields).eq("id", profileId)
        : supabase.from(table).update(updateFields).eq("id", __target_id).eq("profile_id", profileId);
    const { error } = await query;
    writeError = error;
  }

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  await supabase.from("pending_updates").update({ status: "approved" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
