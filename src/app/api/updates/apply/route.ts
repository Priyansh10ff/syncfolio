import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";
import { triggerWebhook } from "@/lib/webhook";
import {
  isEditableTable,
  pickEditable,
  REQUIRED_ON_CREATE,
  TRACKED_TABLES,
} from "@/lib/schema/editable-fields";
import type { PendingUpdateRow } from "@/lib/schema/pending-update-row";

/** Maps where a proposal came from to the `source` recorded on the row it creates. */
const ROW_SOURCE: Record<PendingUpdateRow["source"], "ai" | "external"> = {
  ai_chat: "ai",
  github_scan: "external",
  external_sync: "external",
};

/**
 * POST /api/updates/apply — the single path from `pending_updates` into
 * real tables. Body: { id, decision: "approve" | "reject" }.
 */
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
    .single<PendingUpdateRow>();

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

  const table = pending.target_table;
  if (!isEditableTable(table)) {
    return NextResponse.json({ error: "Unknown target table" }, { status: 400 });
  }

  const { __action: action, __target_id: targetId, ...rawFields } = pending.payload as Record<
    string,
    unknown
  > & { __action?: unknown; __target_id?: unknown };

  if (action !== "create" && action !== "update") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const fields = pickEditable(table, rawFields);
  if (Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: "This proposal has no fields that can be applied." },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  let writeError = null;
  let writtenId: string | undefined;

  if (action === "create") {
    if (table === "profiles") {
      return NextResponse.json(
        { error: "A profile already exists — profile changes must be updates." },
        { status: 422 }
      );
    }

    const missing = REQUIRED_ON_CREATE[table].filter(
      (key) => fields[key] === undefined || fields[key] === null || fields[key] === ""
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Can't create ${table} row — missing ${missing.join(", ")}.` },
        { status: 422 }
      );
    }

    const insertRow = {
      ...fields,
      profile_id: profileId,
      ...(TRACKED_TABLES.has(table) ? { source: ROW_SOURCE[pending.source], updated_at: now } : {}),
    };
    const { data, error } = await supabase.from(table).insert(insertRow).select("id").single();
    writeError = error;
    writtenId = data?.id;
  } else if (table === "profiles") {
    const { error } = await supabase
      .from("profiles")
      .update({ ...fields, updated_at: now })
      .eq("id", profileId);
    writeError = error;
  } else {
    if (typeof targetId !== "string" || !targetId) {
      return NextResponse.json({ error: "Missing target_id for update" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from(table)
      .update(TRACKED_TABLES.has(table) ? { ...fields, updated_at: now } : fields)
      .eq("id", targetId)
      .eq("profile_id", profileId)
      .select("id");
    writeError = error;
    if (!error && (!data || data.length === 0)) {
      return NextResponse.json(
        { error: "The row this update targets no longer exists." },
        { status: 404 }
      );
    }
    writtenId = targetId;
  }

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  await supabase.from("pending_updates").update({ status: "approved" }).eq("id", id);
  triggerWebhook(profileId, {
    section: table === "profiles" ? "profile" : table,
    action,
    id: writtenId,
  });
  return NextResponse.json({ ok: true });
}
