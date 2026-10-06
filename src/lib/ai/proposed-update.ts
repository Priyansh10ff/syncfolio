import { z } from "zod";

/**
 * What the AI is allowed to propose. Kept intentionally narrow — a
 * proposal is always "create a new row", "patch an existing row by id"
 * or "delete an existing row by id" in one of the editable tables. Nothing here writes to the DB by
 * itself; it only shapes what lands in `pending_updates` for review.
 */
export const proposedUpdateSchema = z.object({
  target_table: z.enum(["experience", "projects", "skills", "education", "profiles"]),
  action: z.enum(["create", "update", "delete"]),
  target_id: z.string().nullable(), // required for "update" and "delete"
  payload: z.record(z.string(), z.unknown()).default({}), // empty for "delete"
  diff_summary: z.string(), // one-line, human-readable, shown in the review UI
});

export const parseResultSchema = z.object({
  updates: z.array(proposedUpdateSchema),
  clarification_needed: z.string().nullable(), // set if the AI couldn't confidently parse
});

export type ProposedUpdate = z.infer<typeof proposedUpdateSchema>;
export type ParseResult = z.infer<typeof parseResultSchema>;
