import type { Education, Experience, Link, Profile, Project, Skill } from "@/lib/schema/profile";

/**
 * Resume and Portfolio are two independent views of the one live
 * profile. Each filters rows by its own visibility flag. Resume code and
 * portfolio code only ever read the profile through these functions.
 */

const PORTFOLIO_ONLY = ["slug", "long_description", "cover_image_url"] as const;

/** What the resume renders: rows marked show_on_resume, no portfolio-only fields. */
export function toResumeView(profile: Profile): Profile {
  return {
    ...profile,
    experience: profile.experience.filter((e) => e.show_on_resume !== false),
    projects: profile.projects
      .filter((p) => p.show_on_resume !== false)
      .map((p) => {
        const copy: Project = { ...p };
        for (const key of PORTFOLIO_ONLY) delete copy[key];
        return copy;
      }),
    skills: profile.skills.filter((s) => s.show_on_resume !== false),
    education: profile.education.filter((e) => e.show_on_resume !== false),
  };
}

type Public<T> = Omit<T, "show_on_resume" | "show_on_portfolio" | "sort_order" | "source">;

/** The JSON shape external portfolio sites receive. */
export type PortfolioView = {
  name: string;
  headline?: string;
  summary?: string;
  location?: string;
  email?: string;
  links: Link[];
  experience: Public<Experience>[];
  projects: Public<Project>[];
  skills: Public<Skill>[];
  education: Public<Education>[];
  updated_at: string;
};

function strip<T extends { show_on_resume?: boolean; show_on_portfolio?: boolean; sort_order?: number }>(
  row: T
): Public<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { show_on_resume, show_on_portfolio, sort_order, source, ...rest } = row as T & {
    source?: unknown;
  };
  return rest as Public<T>;
}

/** What the portfolio publishes: rows marked show_on_portfolio, internal fields removed. */
export function toPortfolioView(profile: Profile): PortfolioView {
  const visible = <T extends { show_on_portfolio?: boolean }>(rows: T[]) =>
    rows.filter((r) => r.show_on_portfolio !== false);

  return {
    name: profile.name,
    headline: profile.headline,
    summary: profile.summary,
    location: profile.location,
    email: profile.email,
    links: profile.links,
    experience: visible(profile.experience).map(strip),
    projects: visible(profile.projects).map(strip),
    skills: visible(profile.skills).map(strip),
    education: visible(profile.education).map(strip),
    updated_at: profile.updated_at,
  };
}
