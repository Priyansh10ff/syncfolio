import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfileId } from "@/lib/current-profile-id";
import { getProfile } from "@/lib/profile";
import { fetchPublicRepos, diffReposAgainstProfile } from "@/lib/github/scan";

export async function POST() {
  const profileId = await getCurrentProfileId();
  if (!profileId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const supabase = await createClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", profileId)
    .single();

  if (!profileRow?.github_username) {
    return NextResponse.json(
      { error: "Add a GitHub username first." },
      { status: 400 }
    );
  }

  let repos;
  try {
    repos = await fetchPublicRepos(profileRow.github_username);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GitHub scan failed" },
      { status: 502 }
    );
  }

  const profile = await getProfile();
  const proposals = diffReposAgainstProfile(repos, profile);

  // Skip repos already sitting in the pending queue from an earlier scan.
  const { data: alreadyQueued } = await supabase
    .from("pending_updates")
    .select("payload")
    .eq("profile_id", profileId)
    .eq("source", "github_scan")
    .eq("status", "pending");

  const queuedUrls = new Set(
    (alreadyQueued ?? [])
      .map((row: any) => row.payload?.links?.[0]?.url)
      .filter(Boolean)
  );

  const freshProposals = proposals.filter(
    (p) => !queuedUrls.has((p.payload.links as any[])?.[0]?.url)
  );

  if (freshProposals.length === 0) {
    return NextResponse.json({ pending: [], message: "Nothing new since last scan." });
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pending: data });
}
