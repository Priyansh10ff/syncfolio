import { authed, dbFail, HttpError, parseBody } from "@/lib/api/route";
import { CONTENT_INPUTS, deleteInput } from "@/lib/schema/inputs";
import { TRACKED_TABLES, type ContentTable } from "@/lib/schema/editable-fields";

/**
 * POST / PATCH / DELETE handlers for one content table. Manual edits
 * from the dashboard — the user is the reviewer, so these write
 * directly. They never publish the portfolio; that happens from the
 * Portfolio page or via auto-sync on an approved update.
 */
export function contentRoutes(table: ContentTable) {
  const inputs = CONTENT_INPUTS[table];
  const tracked = TRACKED_TABLES.has(table);

  const POST = authed(async (ctx) => {
    const fields = await parseBody(ctx.req, inputs.create);
    const { data: row, error } = await ctx.supabase
      .from(table)
      .insert({
        ...fields,
        profile_id: ctx.profileId,
        ...(tracked ? { source: "manual", updated_at: new Date().toISOString() } : {}),
      })
      .select("*")
      .single();
    dbFail(error);
    return { row };
  });

  const PATCH = authed(async (ctx) => {
    const { id, ...fields } = await parseBody(ctx.req, inputs.update);
    if (Object.keys(fields).length === 0) throw new HttpError(400, "Nothing to update");

    const { data: row, error } = await ctx.supabase
      .from(table)
      .update(tracked ? { ...fields, updated_at: new Date().toISOString() } : fields)
      .eq("id", id)
      .eq("profile_id", ctx.profileId)
      .select("*")
      .maybeSingle();
    dbFail(error);
    if (!row) throw new HttpError(404, "Not found");
    return { row };
  });

  const DELETE = authed(async (ctx) => {
    const { id } = await parseBody(ctx.req, deleteInput);
    const { data, error } = await ctx.supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("profile_id", ctx.profileId)
      .select("id");
    dbFail(error);
    if (!data?.length) throw new HttpError(404, "Not found");
    return { ok: true };
  });

  return { POST, PATCH, DELETE };
}
