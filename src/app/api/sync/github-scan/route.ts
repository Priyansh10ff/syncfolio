import { authed, dbFail, HttpError } from "@/lib/api/route";
import { loadProfile } from "@/lib/profile";
import { fetchPublicRepos, diffReposAgainstProfile } from "@/lib/github/scan";

/** POST /api/sync/github-scan — queue new public repos as project proposals. */
export const POST = authed(async (ctx) => {
  const { supabase, profileId } = ctx;
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", profileId)
    .single();

  if (!profileRow?.github_username) throw new HttpError(400, "Add a GitHub username first.");

  let repos;
  try {
    repos = await fetchPublicRepos(profileRow.github_username);
  } catch (err) {
    throw new HttpError(502, err instanceof Error ? err.message : "GitHub scan failed");
  }

  const loaded = await loadProfile(supabase, profileId);
  if (!loaded) throw new HttpError(404, "Profile not found");
  const proposals = diffReposAgainstProfile(repos, loaded.profile);

  // Skip repos already queued, or already rejected, from an earlier scan.
  const { data: alreadyQueued } = await supabase
    .from("pending_updates")
    .select("payload")
    .eq("profile_id", profileId)
    .eq("source", "github_scan")
    .in("status", ["pending", "rejected"]);

  const queuedUrls = new Set(
    (alreadyQueued ?? [])
      .map((row: { payload: Record<string, unknown> }) => {
        const links = row.payload?.links as Array<{ url: string }> | undefined;
        return links?.[0]?.url;
      })
      .filter(Boolean)
  );

  const freshProposals = proposals.filter((p) => {
    const links = p.payload.links as Array<{ url: string }> | undefined;
    return !queuedUrls.has(links?.[0]?.url);
  });

  if (freshProposals.length === 0) {
    return { pending: [], message: "Nothing new since last scan." };
  }

  const rows = freshProposals.map((p) => ({
    profile_id: profileId,
    source: "github_scan" as const,
    target_table: "projects" as const,
    payload: { ...p.payload, __action: "create", __target_id: null },
    diff_summary: p.diff_summary,
    status: "pending" as const,
  }));

  const { data, error } = await supabase.from("pending_updates").insert(rows).select();
  dbFail(error);
  return { pending: data };
});
