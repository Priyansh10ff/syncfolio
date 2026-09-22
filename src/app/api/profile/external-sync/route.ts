import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/profile/external-sync
 *
 * For the other direction of sync: someone edited their portfolio (or
 * resume-adjacent data) directly, outside Loom, and wants that change
 * reflected back. The external site authenticates with the same public
 * token and posts one or more proposed changes, in the same shape the
 * AI update layer produces. Nothing here writes to the live profile —
 * every change lands in `pending_updates` with source "external_sync"
 * and waits for approval on /dashboard/sync (Phase 5).
 *
 * Body: { token: string, changes: Array<{
 *   target_table: "experience" | "projects" | "skills" | "education" | "profiles",
 *   action: "create" | "update",
 *   target_id: string | null,
 *   payload: Record<string, unknown>,
 *   diff_summary: string,
 * }> }
 */
export async function POST(req: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "External sync isn't configured on this server (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 501 }
    );
  }

  const body = await req.json();
  const { token, changes } = body;

  if (!token || !Array.isArray(changes) || changes.length === 0) {
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

  const rows = changes.map((c: any) => ({
    profile_id: profileRow.id,
    source: "external_sync" as const,
    target_table: c.target_table,
    payload: { ...c.payload, __action: c.action, __target_id: c.target_id ?? null },
    diff_summary: c.diff_summary ?? "External change",
    status: "pending" as const,
  }));

  const { error } = await admin.from("pending_updates").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, queued: rows.length });
}
