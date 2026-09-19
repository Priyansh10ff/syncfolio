import { z } from "zod";

/**
 * Canonical Loom profile shape.
 * This is the single source of truth's shape — the DB, the /api/profile
 * response, the resume generator, and any external portfolio all read
 * data that conforms to this schema.
 */

export const linkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

export const experienceSchema = z.object({
  id: z.string(),
  role: z.string(),
  org: z.string(),
  location: z.string().optional(),
  start_date: z.string(), // ISO "YYYY-MM"
  end_date: z.string().nullable(), // null = present
  bullets: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  updated_at: z.string(),
  source: z.enum(["loom", "external", "ai"]).default("loom"),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  bullets: z.array(z.string()).default([]),
  links: z.array(linkSchema).default([]),
  tags: z.array(z.string()).default([]),
  metrics: z.array(z.string()).default([]), // e.g. "cut latency 40%"
  featured: z.boolean().default(false),
  updated_at: z.string(),
  source: z.enum(["loom", "external", "ai"]).default("loom"),
});

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(), // e.g. "language", "framework", "tool"
  level: z.enum(["learning", "comfortable", "strong"]).optional(),
});

export const educationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  notes: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email().optional(),
  links: z.array(linkSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillSchema).default([]),
  education: z.array(educationSchema).default([]),
  updated_at: z.string(),
});

export type Link = z.infer<typeof linkSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Profile = z.infer<typeof profileSchema>;

export function emptyProfile(): Profile {
  return {
    name: "",
    links: [],
    experience: [],
    projects: [],
    skills: [],
    education: [],
    updated_at: new Date().toISOString(),
  };
}
