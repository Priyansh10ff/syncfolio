import { z } from "zod";
import type { ContentTable } from "./editable-fields";

/**
 * Request-body schemas for every write route. Route handlers parse with
 * these before touching the database, so a malformed body is a 400 with
 * a readable message, never a 500 from Postgres.
 */

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => text(max).min(1, "Required");
const optionalText = (max: number) => text(max).nullish();

export const yearMonth = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM");

const stringList = z.array(text(500)).max(30);

export const linkInput = z.object({
  label: requiredText(60),
  url: z.string().trim().url("Not a valid URL").max(2000),
});

const slug = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

const placement = {
  show_on_resume: z.boolean().optional(),
  show_on_portfolio: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(100_000).optional(),
};

const experienceFields = {
  role: requiredText(120),
  org: requiredText(120),
  location: optionalText(120),
  start_date: yearMonth,
  end_date: yearMonth.nullish(),
  bullets: stringList.optional(),
  tags: z.array(text(40)).max(30).optional(),
  ...placement,
};

const projectFields = {
  name: requiredText(120),
  description: text(500).optional(),
  bullets: stringList.optional(),
  links: z.array(linkInput).max(10).optional(),
  tags: z.array(text(40)).max(30).optional(),
  metrics: z.array(text(200)).max(20).optional(),
  featured: z.boolean().optional(),
  ...placement,
  slug: slug.nullish(),
  long_description: optionalText(20_000),
  cover_image_url: z.string().trim().url("Not a valid URL").max(2000).nullish(),
};

const skillFields = {
  name: requiredText(60),
  category: optionalText(60),
  level: z.enum(["learning", "comfortable", "strong"]).nullish(),
  ...placement,
};

const educationFields = {
  institution: requiredText(160),
  degree: optionalText(160),
  start_date: yearMonth,
  end_date: yearMonth.nullish(),
  notes: optionalText(1000),
  ...placement,
};

const idInput = z.object({ id: z.string().uuid() });

function crud<T extends z.ZodRawShape>(fields: T) {
  const create = z.object(fields).strict();
  const update = idInput.extend(z.object(fields).partial().shape).strict();
  return { create, update };
}

export const CONTENT_INPUTS = {
  experience: crud(experienceFields),
  projects: crud(projectFields),
  skills: crud(skillFields),
  education: crud(educationFields),
} satisfies Record<ContentTable, { create: z.ZodType; update: z.ZodType }>;

export const deleteInput = idInput.strict();

export const basicsInput = z
  .object({
    name: text(120).optional(),
    headline: optionalText(160),
    summary: optionalText(2000),
    location: optionalText(120),
    email: z.union([z.literal(""), z.string().trim().email("Not a valid email")]).nullish(),
    links: z.array(linkInput).max(10).optional(),
  })
  .strict();

export const settingsInput = z
  .object({
    resume_enabled: z.boolean().optional(),
    portfolio_enabled: z.boolean().optional(),
    portfolio_auto_sync: z.boolean().optional(),
  })
  .strict();

export const applyInput = z
  .object({
    id: z.string().uuid(),
    decision: z.enum(["approve", "reject"]),
    sync_portfolio: z.boolean().optional(),
  })
  .strict();

export const undoInput = z
  .object({ id: z.string().uuid(), sync_portfolio: z.boolean().optional() })
  .strict();

export const noteInput = z.object({ note: requiredText(2000) }).strict();

export const webhookInput = z
  .object({
    webhook_url: z.union([z.literal(""), z.string().trim().url("Not a valid URL").max(2000)]).nullish(),
  })
  .strict();

export const githubInput = z
  .object({
    github_username: z
      .union([
        z.literal(""),
        z
          .string()
          .trim()
          .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/, "Not a valid GitHub username"),
      ])
      .nullish(),
  })
  .strict();
