import { Profile } from "@/lib/schema/profile";

type GitHubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics: string[];
  fork: boolean;
  stargazers_count: number;
  language: string | null;
};

/** Fetches a user's public, non-fork repos, most recently pushed first. */
export async function fetchPublicRepos(username: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=50`,
    { headers: { Accept: "application/vnd.github+json" } }
  );

  if (!res.ok) {
    throw new Error(
      res.status === 404 ? `GitHub user "${username}" not found` : `GitHub API error (${res.status})`
    );
  }

  const repos: GitHubRepo[] = await res.json();
  return repos.filter((r) => !r.fork);
}

/**
 * A repo counts as "already represented" if any existing project links
 * to its GitHub URL. Best-effort — if someone added a project by hand
 * without linking the repo, this will (harmlessly) propose it again;
 * they just reject the duplicate.
 */
function isAlreadyTracked(repo: GitHubRepo, profile: Profile): boolean {
  return profile.projects.some((p) =>
    p.links.some((l) => l.url.replace(/\/$/, "") === repo.html_url.replace(/\/$/, ""))
  );
}

export type GitHubProposal = {
  diff_summary: string;
  payload: Record<string, unknown>;
};

/** Builds create-project proposals for repos not yet reflected in the profile. */
export function diffReposAgainstProfile(
  repos: GitHubRepo[],
  profile: Profile
): GitHubProposal[] {
  return repos
    .filter((r) => !isAlreadyTracked(r, profile))
    .map((r) => ({
      diff_summary: `New public repo: ${r.name}`,
      payload: {
        name: r.name,
        description: r.description ?? "",
        bullets: [],
        links: [
          { label: "GitHub", url: r.html_url },
          ...(r.homepage ? [{ label: "Live", url: r.homepage }] : []),
        ],
        tags: r.topics?.length ? r.topics : r.language ? [r.language] : [],
        metrics: r.stargazers_count > 0 ? [`${r.stargazers_count} GitHub stars`] : [],
        featured: false,
      },
    }));
}
