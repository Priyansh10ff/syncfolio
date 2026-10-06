/**
 * Columns a write is allowed to set, per table. Used for automated
 * proposals (AI, GitHub scan, external sync) and for undo restores.
 * Anything else in a payload is dropped before it reaches the database,
 * so a proposal can never touch ownership or secrets (id, profile_id,
 * user_id, public_token, webhook_url, github_username, module settings).
 */
const PLACEMENT = ["show_on_resume", "show_on_portfolio", "sort_order"] as const;

export const EDITABLE_FIELDS = {
  profiles: ["name", "headline", "summary", "location", "email", "links"],
  experience: ["role", "org", "location", "start_date", "end_date", "bullets", "tags", ...PLACEMENT],
  projects: [
    "name",
    "description",
    "bullets",
    "links",
    "tags",
    "metrics",
    "featured",
    ...PLACEMENT,
    "slug",
    "long_description",
    "cover_image_url",
  ],
  skills: ["name", "category", "level", ...PLACEMENT],
  education: ["institution", "degree", "start_date", "end_date", "notes", ...PLACEMENT],
} as const;

export type EditableTable = keyof typeof EDITABLE_FIELDS;
export type ContentTable = Exclude<EditableTable, "profiles">;

export const EDITABLE_TABLES = Object.keys(EDITABLE_FIELDS) as EditableTable[];
export const CONTENT_TABLES: ContentTable[] = ["experience", "projects", "skills", "education"];

export function isEditableTable(value: unknown): value is EditableTable {
  return typeof value === "string" && value in EDITABLE_FIELDS;
}

export function isContentTable(value: unknown): value is ContentTable {
  return isEditableTable(value) && value !== "profiles";
}

/** Tables that carry `updated_at` and `source` columns. */
export const TRACKED_TABLES: ReadonlySet<EditableTable> = new Set(["experience", "projects"]);

/** Fields every create needs, per table (NOT NULL columns without defaults). */
export const REQUIRED_ON_CREATE: Record<ContentTable, readonly string[]> = {
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
