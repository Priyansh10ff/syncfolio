/**
 * Field-level diff between two records, for rendering proposals and
 * unpublished changes as a terminal-style diff. Pure — no React.
 */

export type DiffLine = { kind: "add" | "del" | "ctx"; text: string };
export type FieldChange = { field: string; lines: DiffLine[] };

/** Keys that are bookkeeping, never shown in a diff. */
const ALWAYS_IGNORED = new Set(["id", "profile_id", "user_id", "updated_at", "created_at", "source"]);

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/** Renders one value as a single display line. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value && "url" in value) {
    const link = value as { label?: string; url: string };
    return link.label ? `${link.label} → ${link.url}` : link.url;
  }
  return JSON.stringify(value);
}

function diffArrays(before: unknown[], after: unknown[]): DiffLine[] {
  const key = (v: unknown) => JSON.stringify(v);
  const beforeKeys = new Set(before.map(key));
  const afterKeys = new Set(after.map(key));
  const lines: DiffLine[] = [];
  for (const item of before) {
    if (!afterKeys.has(key(item))) lines.push({ kind: "del", text: formatValue(item) });
  }
  for (const item of after) {
    lines.push({ kind: beforeKeys.has(key(item)) ? "ctx" : "add", text: formatValue(item) });
  }
  return lines;
}

/**
 * Compares `before` and `after` field by field.
 * - `before` null → everything in `after` is an addition (create).
 * - `after` null → everything in `before` is a removal (delete).
 * - Otherwise only fields whose values differ are returned.
 * Field order follows `fields` when given, else `after`'s then `before`'s keys.
 */
export function diffRecords(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  options: { fields?: readonly string[]; ignore?: readonly string[] } = {}
): FieldChange[] {
  const ignore = new Set([...ALWAYS_IGNORED, ...(options.ignore ?? [])]);
  const keys =
    options.fields ??
    Array.from(new Set([...Object.keys(after ?? {}), ...Object.keys(before ?? {})]));

  const changes: FieldChange[] = [];
  for (const field of keys) {
    if (ignore.has(field) || field.startsWith("__")) continue;
    const b = before?.[field];
    const a = after?.[field];
    if (JSON.stringify(b ?? null) === JSON.stringify(a ?? null)) continue;
    if (isEmpty(b) && isEmpty(a)) continue;

    let lines: DiffLine[];
    if (Array.isArray(b) || Array.isArray(a)) {
      lines = diffArrays(Array.isArray(b) ? b : [], Array.isArray(a) ? a : []);
    } else {
      lines = [];
      if (!isEmpty(b)) lines.push({ kind: "del", text: formatValue(b) });
      if (!isEmpty(a)) lines.push({ kind: "add", text: formatValue(a) });
    }
    if (lines.some((l) => l.kind !== "ctx")) changes.push({ field, lines });
  }
  return changes;
}
