/**
 * Columns an automated proposal (AI, GitHub scan, external sync) is
 * allowed to set, per table. Anything else in a payload is dropped
 * before it reaches the database — so a proposal can never touch
 * ownership or secrets (profile_id, user_id, public_token, webhook_url,
 * github_username, id) no matter where it came from.
 */
export const EDITABLE_FIELDS = {
  profiles: ["name", "headline", "summary", "location", "email", "links"],
  experience: ["role", "org", "location", "start_date", "end_date", "bullets", "tags"],
  projects: ["name", "description", "bullets", "links", "tags", "metrics", "featured"],
  skills: ["name", "category", "level"],
  education: ["institution", "degree", "start_date", "end_date", "notes"],
} as const;

export type EditableTable = keyof typeof EDITABLE_FIELDS;

export const EDITABLE_TABLES = Object.keys(EDITABLE_FIELDS) as EditableTable[];

export function isEditableTable(value: unknown): value is EditableTable {
  return typeof value === "string" && value in EDITABLE_FIELDS;
}

/** Tables that carry `updated_at` and `source` columns. */
export const TRACKED_TABLES: ReadonlySet<EditableTable> = new Set(["experience", "projects"]);

/** Fields every create needs, per table (matches NOT NULL columns without defaults). */
export const REQUIRED_ON_CREATE: Record<Exclude<EditableTable, "profiles">, readonly string[]> = {
  experience: ["role", "org", "start_date"],
  projects: ["name"],
  skills: ["name"],
  education: ["institution", "start_date"],
};

/** Returns only the allowlisted fields of `payload` for `table`. */
export function pickEditable(
  table: EditableTable,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const allowed: readonly string[] = EDITABLE_FIELDS[table];
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowed.includes(key))
  );
}
