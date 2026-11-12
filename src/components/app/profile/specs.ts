import type { Education, Experience, Project, Skill } from "@/lib/schema/profile";

export type FieldKind = "text" | "long" | "month" | "list" | "tags" | "links" | "bool" | "select";

export type FieldSpec = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: readonly string[];
  /** Only shown when the portfolio module is on. */
  portfolioOnly?: boolean;
  hint?: string;
};

export type Table = "experience" | "projects" | "skills" | "education";
export type AnyRow = (Experience | Project | Skill | Education) & Record<string, unknown>;

export type SectionSpec = {
  table: Table;
  title: string;
  singular: string;
  /** Primary label and secondary meta for the collapsed row. */
  label: (row: AnyRow) => string;
  meta: (row: AnyRow) => string;
  fields: FieldSpec[];
  /** Fields asked for when adding a row. */
  create: string[];
};

const range = (row: AnyRow) => `${row.start_date ?? "?"} → ${row.end_date ?? "present"}`;

export const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export const SECTIONS: SectionSpec[] = [
  {
    table: "experience",
    title: "experience",
    singular: "role",
    label: (r) => `${r.role} · ${r.org}`,
    meta: range,
    create: ["role", "org", "start_date"],
    fields: [
      { key: "role", label: "role", kind: "text", required: true },
      { key: "org", label: "org", kind: "text", required: true },
      { key: "location", label: "location", kind: "text" },
      { key: "start_date", label: "start", kind: "month", required: true, placeholder: "YYYY-MM" },
      { key: "end_date", label: "end", kind: "month", placeholder: "present" },
      { key: "bullets", label: "bullets", kind: "list" },
      { key: "tags", label: "tags", kind: "tags" },
    ],
  },
  {
    table: "projects",
    title: "projects",
    singular: "project",
    label: (r) => String(r.name),
    meta: (r) => String(r.description || ""),
    create: ["name", "description"],
    fields: [
      { key: "name", label: "name", kind: "text", required: true },
      { key: "description", label: "one-liner", kind: "long" },
      { key: "bullets", label: "bullets", kind: "list" },
      { key: "metrics", label: "metrics", kind: "list", hint: "numbers you can stand behind" },
      { key: "tags", label: "tags", kind: "tags" },
      { key: "links", label: "links", kind: "links" },
      { key: "featured", label: "featured", kind: "bool" },
      { key: "slug", label: "slug", kind: "text", portfolioOnly: true, placeholder: "my-project" },
      { key: "long_description", label: "write-up", kind: "long", portfolioOnly: true, hint: "markdown, portfolio only" },
      { key: "cover_image_url", label: "cover image", kind: "text", portfolioOnly: true, placeholder: "https://…" },
    ],
  },
  {
    table: "skills",
    title: "skills",
    singular: "skill",
    label: (r) => String(r.name),
    meta: (r) => [r.category, r.level].filter(Boolean).join(" · "),
    create: ["name", "category"],
    fields: [
      { key: "name", label: "name", kind: "text", required: true },
      { key: "category", label: "category", kind: "text", placeholder: "language, framework, tool…" },
      { key: "level", label: "level", kind: "select", options: ["learning", "comfortable", "strong"] },
    ],
  },
  {
    table: "education",
    title: "education",
    singular: "entry",
    label: (r) => `${r.institution}${r.degree ? ` · ${r.degree}` : ""}`,
    meta: range,
    create: ["institution", "degree", "start_date"],
    fields: [
      { key: "institution", label: "institution", kind: "text", required: true },
      { key: "degree", label: "degree", kind: "text" },
      { key: "start_date", label: "start", kind: "month", required: true, placeholder: "YYYY-MM" },
      { key: "end_date", label: "end", kind: "month", placeholder: "present" },
      { key: "notes", label: "notes", kind: "long" },
    ],
  },
];

export function validateField(spec: FieldSpec, value: string): string | null {
  if (spec.required && !value) return "Required";
  if (spec.kind === "month" && value && !MONTH.test(value)) return "Use YYYY-MM";
  if (spec.key === "cover_image_url" && value && !/^https?:\/\//.test(value)) return "Must start with http(s)://";
  if (spec.key === "slug" && value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return "lowercase-with-dashes";
  return null;
}
