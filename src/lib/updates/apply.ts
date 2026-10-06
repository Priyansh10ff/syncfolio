import { HttpError, type AuthedContext } from "@/lib/api/route";
import {
  isEditableTable,
  pickEditable,
  REQUIRED_ON_CREATE,
  TRACKED_TABLES,
  type EditableTable,
} from "@/lib/schema/editable-fields";
import type { PendingUpdateRow } from "@/lib/schema/pending-update-row";
import { publishPortfolio } from "@/lib/portfolio/publish";

export type ProposalAction = "create" | "update" | "delete";

/** Where a proposal came from → the `source` recorded on rows it creates. */
const ROW_SOURCE: Record<PendingUpdateRow["source"], "ai" | "external"> = {
  ai_chat: "ai",
  github_scan: "external",
  external_sync: "external",
};

type Applied = {
  table: EditableTable;
  action: ProposalAction;
  appliedRowId: string;
  previous: Record<string, unknown> | null;
};

/** Splits a stored payload into its control keys and its field values. */
export function readPayload(payload: Record<string, unknown>) {
  const { __action, __target_id, ...fields } = payload;
  return {
    action: __action as unknown,
    targetId: typeof __target_id === "string" && __target_id ? __target_id : null,
    fields,
  };
}

/** Loads one row for undo bookkeeping, scoped to the caller's profile. */
async function currentRow(ctx: AuthedContext, table: EditableTable, id: string) {
  const query =
    table === "profiles"
      ? ctx.supabase.from("profiles").select("*").eq("id", ctx.profileId)
      : ctx.supabase.from(table).select("*").eq("id", id).eq("profile_id", ctx.profileId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new HttpError(500, error.message);
  return data as Record<string, unknown> | null;
}

/**
 * Applies one pending proposal to the live tables. Only allowlisted
 * fields are written. Returns what's needed to undo it later.
 */
export async function applyProposal(ctx: AuthedContext, pending: PendingUpdateRow): Promise<Applied> {
  const table = pending.target_table;
  if (!isEditableTable(table)) throw new HttpError(400, "Unknown target table");

  const { action, targetId, fields: raw } = readPayload(pending.payload);
  if (action !== "create" && action !== "update" && action !== "delete") {
    throw new HttpError(400, "Unknown action");
  }

  const now = new Date().toISOString();
  const tracked = TRACKED_TABLES.has(table);

  if (action === "delete") {
    if (table === "profiles") throw new HttpError(422, "A profile can't be deleted from a proposal.");
    if (!targetId) throw new HttpError(400, "Missing target_id for delete");
    const previous = await currentRow(ctx, table, targetId);
    if (!previous) throw new HttpError(404, "The row this proposal deletes no longer exists.");
    const { error } = await ctx.supabase
      .from(table)
      .delete()
      .eq("id", targetId)
      .eq("profile_id", ctx.profileId);
    if (error) throw new HttpError(500, error.message);
    return { table, action, appliedRowId: targetId, previous };
  }

  const fields = pickEditable(table, raw);
  if (Object.keys(fields).length === 0) {
    throw new HttpError(422, "This proposal has no fields that can be applied.");
  }

  if (action === "create") {
    if (table === "profiles") {
      throw new HttpError(422, "A profile already exists — profile changes must be updates.");
    }
    const missing = REQUIRED_ON_CREATE[table].filter(
      (key) => fields[key] === undefined || fields[key] === null || fields[key] === ""
    );
    if (missing.length) {
      throw new HttpError(422, `Can't create ${table} row — missing ${missing.join(", ")}.`);
    }
    const { data, error } = await ctx.supabase
      .from(table)
      .insert({
        ...fields,
        profile_id: ctx.profileId,
        ...(tracked ? { source: ROW_SOURCE[pending.source], updated_at: now } : {}),
      })
      .select("id")
      .single();
    if (error) throw new HttpError(500, error.message);
    return { table, action, appliedRowId: data.id, previous: null };
  }

  // update
  if (table === "profiles") {
    const previous = await currentRow(ctx, table, ctx.profileId);
    const { error } = await ctx.supabase
      .from("profiles")
      .update({ ...fields, updated_at: now })
      .eq("id", ctx.profileId);
    if (error) throw new HttpError(500, error.message);
    return { table, action, appliedRowId: ctx.profileId, previous };
  }

  if (!targetId) throw new HttpError(400, "Missing target_id for update");
  const previous = await currentRow(ctx, table, targetId);
  if (!previous) throw new HttpError(404, "The row this update targets no longer exists.");
  const { error } = await ctx.supabase
    .from(table)
    .update(tracked ? { ...fields, updated_at: now } : fields)
    .eq("id", targetId)
    .eq("profile_id", ctx.profileId);
  if (error) throw new HttpError(500, error.message);
  return { table, action, appliedRowId: targetId, previous };
}

/** Reverses an applied proposal using what was recorded at approval time. */
export async function revertProposal(ctx: AuthedContext, row: PendingUpdateRow) {
  const table = row.target_table;
  if (!isEditableTable(table)) throw new HttpError(400, "Unknown target table");
  const { action } = readPayload(row.payload);
  const id = row.applied_row_id;
  if (!id) throw new HttpError(409, "This change was applied before undo existed and can't be undone.");

  const now = new Date().toISOString();
  const tracked = TRACKED_TABLES.has(table);

  if (action === "create") {
    if (table === "profiles") throw new HttpError(409, "Can't undo this change.");
    const { error } = await ctx.supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("profile_id", ctx.profileId);
    if (error) throw new HttpError(500, error.message);
    return;
  }

  if (!row.previous) throw new HttpError(409, "No earlier version was recorded, so this can't be undone.");
  const restore = pickEditable(table, row.previous);

  if (action === "update") {
    const query =
      table === "profiles"
        ? ctx.supabase.from("profiles").update({ ...restore, updated_at: now }).eq("id", ctx.profileId)
        : ctx.supabase
            .from(table)
            .update(tracked ? { ...restore, updated_at: now } : restore)
            .eq("id", id)
            .eq("profile_id", ctx.profileId);
    const { error } = await query;
    if (error) throw new HttpError(500, error.message);
    return;
  }

  if (action === "delete") {
    if (table === "profiles") throw new HttpError(409, "Can't undo this change.");
    const { error } = await ctx.supabase.from(table).insert({
      ...restore,
      id,
      profile_id: ctx.profileId,
      ...(tracked ? { source: row.previous.source ?? "manual", updated_at: now } : {}),
    });
    if (error) throw new HttpError(500, error.message);
    return;
  }

  throw new HttpError(400, "Unknown action");
}

/**
 * Publishes the portfolio after an approval or undo when the portfolio
 * module is on and sync was requested (or is the default).
 */
export async function maybeSyncPortfolio(ctx: AuthedContext, requested: boolean | undefined) {
  const sync = ctx.settings.portfolio_enabled && (requested ?? ctx.settings.portfolio_auto_sync);
  if (!sync) return { synced: false as const };
  const { published, snapshot } = await publishPortfolio(ctx.supabase, ctx.profileId);
  return { synced: true as const, published, published_at: snapshot?.published_at ?? null };
}
