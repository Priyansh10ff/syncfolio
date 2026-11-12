import { z } from "zod";
import { authed, dbFail, HttpError, parseBody } from "@/lib/api/route";
import { isEditableTable, pickEditable } from "@/lib/schema/editable-fields";
import type { PendingUpdateRow } from "@/lib/schema/pending-update-row";
import { readPayload } from "@/lib/updates/apply";

const editPendingInput = z
  .object({ id: z.string().uuid(), payload: z.record(z.string(), z.unknown()) })
  .strict();

/** GET /api/updates/pending — unresolved proposals from every source. */
export const GET = authed(async (ctx) => {
  const { data, error } = await ctx.supabase
    .from("pending_updates")
    .select("*")
    .eq("profile_id", ctx.profileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  dbFail(error);
  return { pending: data };
});

/**
 * PATCH /api/updates/pending — edit a proposal's fields before approving it.
 * Body: { id, payload }. Only allowlisted fields for the target table are
 * kept; the action and target stay as proposed.
 */
export const PATCH = authed(async (ctx) => {
  const { id, payload } = await parseBody(ctx.req, editPendingInput);

  const { data: row } = await ctx.supabase
    .from("pending_updates")
    .select("*")
    .eq("id", id)
    .eq("profile_id", ctx.profileId)
    .maybeSingle<PendingUpdateRow>();
  if (!row) throw new HttpError(404, "Update not found");
  if (row.status !== "pending") throw new HttpError(409, "Already resolved");
  if (!isEditableTable(row.target_table)) throw new HttpError(400, "Unknown target table");

  const { action, targetId } = readPayload(row.payload);
  if (action === "delete") throw new HttpError(422, "A delete has no fields to edit.");

  const fields = pickEditable(row.target_table, payload);
  if (Object.keys(fields).length === 0) throw new HttpError(422, "Nothing editable in that payload.");

  const nextPayload = { ...fields, __action: action, __target_id: targetId };
  const { data, error } = await ctx.supabase
    .from("pending_updates")
    .update({ payload: nextPayload })
    .eq("id", id)
    .select("*")
    .single();
  dbFail(error);
  return { row: data };
});
