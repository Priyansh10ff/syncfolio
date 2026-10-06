import { z } from "zod";
import { HttpError, open } from "@/lib/api/route";
import { createAdminClient } from "@/lib/supabase/admin";
import { EDITABLE_TABLES, pickEditable } from "@/lib/schema/editable-fields";

/**
 * POST /api/profile/external-sync
 *
 * The other direction of sync: a change made directly on the portfolio
 * site is sent back here. The site authenticates with the public token.
 * Nothing writes to the live profile — each change lands in
 * `pending_updates` (source "external_sync") for review on /dashboard/sync.
 */
const changeSchema = z
  .object({
    target_table: z.enum(EDITABLE_TABLES as [string, ...string[]]),
    action: z.enum(["create", "update", "delete"]),
    target_id: z.string().uuid().nullish(),
    payload: z.record(z.string(), z.unknown()).default({}),
    diff_summary: z.string().trim().max(200).optional(),
  })
  .refine((c) => !(c.target_table === "profiles" && c.action !== "update"), {
    message: "profiles can only be updated",
  })
  .refine((c) => c.action === "create" || c.target_table === "profiles" || !!c.target_id, {
    message: "target_id is required for update and delete",
  });

const bodySchema = z.object({
  token: z.string().uuid("Invalid token"),
  changes: z.array(changeSchema).min(1).max(50),
});

export const POST = open(async (req) => {
  const admin = createAdminClient();
  if (!admin) {
    throw new HttpError(501, "External sync isn't configured on this server (missing SUPABASE_SERVICE_ROLE_KEY).");
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(400, `${issue.path.join(".")}: ${issue.message}`);
  }
  const { token, changes } = parsed.data;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, portfolio_enabled")
    .eq("public_token", token)
    .maybeSingle();
  if (!profile) throw new HttpError(401, "Invalid token");
  if (!profile.portfolio_enabled) throw new HttpError(404, "The portfolio module is turned off.");

  const rows = changes.map((c, i) => {
    const table = c.target_table as (typeof EDITABLE_TABLES)[number];
    const payload = c.action === "delete" ? {} : pickEditable(table, c.payload);
    if (c.action !== "delete" && Object.keys(payload).length === 0) {
      throw new HttpError(400, `changes.${i}.payload: no editable fields`);
    }
    return {
      profile_id: profile.id,
      source: "external_sync" as const,
      target_table: table,
      payload: { ...payload, __action: c.action, __target_id: c.target_id ?? null },
      diff_summary: c.diff_summary || "External change",
      status: "pending" as const,
    };
  });

  const { error } = await admin.from("pending_updates").insert(rows);
  if (error) throw new HttpError(500, error.message);

  return { ok: true, queued: rows.length };
});
