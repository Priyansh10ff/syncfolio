import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEditableTable, pickEditable } from "@/lib/schema/editable-fields";

/**
 * POST /api/profile/external-sync
 *
 * For the other direction of sync: someone edited their portfolio (or
 * resume-adjacent data) directly, outside Syncfolio, and wants that change
 * reflected back. The external site authenticates with the same public
 * token and posts one or more proposed changes, in the same shape the
 * AI update layer produces. Nothing here writes to the live profile —
 * every change lands in `pending_updates` with source "external_sync"
 * and waits for approval on /dashboard/sync.
 *
 * Body: { token: string, changes: Array<{
 *   target_table: "experience" | "projects" | "skills" | "education" | "profiles",
 *   action: "create" | "update",
 *   target_id: string | null,
 *   payload: Record<string, unknown>,
 *   diff_summary: string,
 * }> }
 */
type ExternalChange = {
  target_table: "experience" | "projects" | "skills" | "education" | "profiles";
  action: "create" | "update";
  target_id: string | null;
  payload: Record<string, unknown>;
  diff_summary?: string;
};

export async function POST(req: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "External sync isn't configured on this server (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 501 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const { token, changes } = body ?? {};

  if (typeof token !== "string" || !Array.isArray(changes) || changes.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("id")
    .eq("public_token", token)
    .single();

  if (!profileRow) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const MAX_CHANGES = 50;
  if (changes.length > MAX_CHANGES) {
    return NextResponse.json(
      { error: `Too many changes in one request (max ${MAX_CHANGES}).` },
      { status: 413 }
    );
  }

  // Validate shape and strip non-editable fields before anything is queued.
  const rows = [];
  for (const [i, c] of (changes as ExternalChange[]).entries()) {
    if (!c || !isEditableTable(c.target_table)) {
      return NextResponse.json({ error: `changes[${i}]: unknown target_table` }, { status: 400 });
    }
    if (c.action !== "create" && c.action !== "update") {
      return NextResponse.json({ error: `changes[${i}]: action must be create or update` }, { status: 400 });
    }
    if (c.action === "create" && c.target_table === "profiles") {
      return NextResponse.json({ error: `changes[${i}]: profiles can only be updated` }, { status: 400 });
    }
    if (c.action === "update" && c.target_table !== "profiles" && typeof c.target_id !== "string") {
      return NextResponse.json({ error: `changes[${i}]: target_id is required for update` }, { status: 400 });
    }
    const payload = pickEditable(
      c.target_table,
      c.payload && typeof c.payload === "object" ? c.payload : {}
    );
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: `changes[${i}]: payload has no editable fields` }, { status: 400 });
    }
    rows.push({
      profile_id: profileRow.id,
      source: "external_sync" as const,
      target_table: c.target_table,
      payload: { ...payload, __action: c.action, __target_id: c.target_id ?? null },
      diff_summary:
        typeof c.diff_summary === "string" && c.diff_summary.trim()
          ? c.diff_summary.slice(0, 200)
          : "External change",
      status: "pending" as const,
    });
  }

  const { error } = await admin.from("pending_updates").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, queued: rows.length });
}
