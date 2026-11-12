import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { loadProfile } from "@/lib/profile";
import { resolveProviderId } from "@/lib/ai/providers/types";
import { latestSnapshot, unpublishedChanges } from "@/lib/portfolio/publish";
import type { Profile, ProfileSettings } from "@/lib/schema/profile";
import type { PendingUpdateRow } from "@/lib/schema/pending-update-row";
import { readPayload } from "@/lib/updates/apply";

export type DashboardContext = {
  supabase: SupabaseClient;
  profileId: string;
  profile: Profile;
  settings: ProfileSettings;
  row: {
    public_token: string;
    webhook_url: string | null;
    github_username: string | null;
    updated_at: string;
  };
};

/** Session + profile for a dashboard page. Redirects to /login when signed out. */
export async function getDashboardContext(): Promise<DashboardContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("profiles")
    .select("id, public_token, webhook_url, github_username, updated_at")
    .eq("user_id", user.id)
    .single();
  if (!row) redirect("/login?error=profile_create_failed");

  const loaded = await loadProfile(supabase, row.id);
  if (!loaded) redirect("/login?error=profile_create_failed");

  return { supabase, profileId: row.id, profile: loaded.profile, settings: loaded.settings, row };
}

export type ShellStatus = {
  settings: ProfileSettings;
  counts: { updates: number; sync: number; unpublished: number };
  aiProvider: string | null;
  profileUpdatedAt: string;
  lastPublishedAt: string | null;
  isEmpty: boolean;
};

/** Everything the app shell's sidebar and status bar show. */
export async function getShellStatus(ctx: DashboardContext): Promise<ShellStatus> {
  const { supabase, profileId, settings, profile } = ctx;
  const [{ data: pending }, publish] = await Promise.all([
    supabase.from("pending_updates").select("source").eq("profile_id", profileId).eq("status", "pending"),
    settings.portfolio_enabled
      ? unpublishedChanges(supabase, profileId)
      : Promise.resolve({ changes: [], last_published_at: null }),
  ]);

  const rows = pending ?? [];
  return {
    settings,
    counts: {
      updates: rows.filter((r) => r.source === "ai_chat").length,
      sync: rows.filter((r) => r.source !== "ai_chat").length,
      unpublished: publish.changes.length,
    },
    aiProvider: resolveProviderId(),
    profileUpdatedAt: latestEdit(profile),
    lastPublishedAt: publish.last_published_at,
    isEmpty: isProfileEmpty(profile),
  };
}

/** True for a brand-new profile: nothing to show yet, so offer the first-run setup. */
export function isProfileEmpty(profile: Profile) {
  return (
    !profile.name &&
    profile.experience.length === 0 &&
    profile.projects.length === 0 &&
    profile.skills.length === 0 &&
    profile.education.length === 0
  );
}

function latestEdit(profile: Profile) {
  const stamps = [profile.updated_at, ...profile.experience.map((e) => e.updated_at), ...profile.projects.map((p) => p.updated_at)];
  return stamps.filter(Boolean).sort().at(-1) ?? profile.updated_at;
}

export type ReviewItem = PendingUpdateRow & {
  /** The row as it is now (null for creates, or when the target no longer exists). */
  before: Record<string, unknown> | null;
  /** Human label for the target, e.g. "Patchwork". */
  targetLabel: string;
};

const LABEL_KEYS = ["name", "role", "institution"] as const;

function labelOf(row: Record<string, unknown> | null | undefined, fallback: string) {
  if (!row) return fallback;
  for (const key of LABEL_KEYS) if (typeof row[key] === "string" && row[key]) return row[key] as string;
  return fallback;
}

/** Attaches the current version of each proposal's target row, for rendering diffs. */
export function withBefore(rows: PendingUpdateRow[], profile: Profile): ReviewItem[] {
  return rows.map((row) => {
    const { action, targetId, fields } = readPayload(row.payload);
    let before: Record<string, unknown> | null = null;

    if (row.target_table === "profiles") {
      const { name, headline, summary, location, email, links } = profile;
      before = { name, headline, summary, location, email, links };
    } else if (action !== "create" && targetId) {
      const list = profile[row.target_table] as unknown as Array<Record<string, unknown>>;
      before = list.find((r) => r.id === targetId) ?? null;
    }

    const targetLabel =
      row.target_table === "profiles"
        ? "basics"
        : action === "create"
          ? labelOf(fields, "new")
          : labelOf(before, "missing row");

    return { ...row, before, targetLabel };
  });
}

/** Pending proposals for one screen, newest first, with their before-rows. */
export async function getReviewItems(ctx: DashboardContext, sources: PendingUpdateRow["source"][]) {
  const { data } = await ctx.supabase
    .from("pending_updates")
    .select("*")
    .eq("profile_id", ctx.profileId)
    .eq("status", "pending")
    .in("source", sources)
    .order("created_at", { ascending: false });
  return withBefore((data ?? []) as PendingUpdateRow[], ctx.profile);
}

/** Recently resolved proposals for the history tab. */
export async function getHistory(ctx: DashboardContext, sources: PendingUpdateRow["source"][]) {
  const { data } = await ctx.supabase
    .from("pending_updates")
    .select("*")
    .eq("profile_id", ctx.profileId)
    .neq("status", "pending")
    .in("source", sources)
    .order("resolved_at", { ascending: false, nullsFirst: false })
    .limit(30);
  return (data ?? []) as PendingUpdateRow[];
}

/** Publish history for the portfolio page. */
export async function getPublishHistory(ctx: DashboardContext) {
  const { data } = await ctx.supabase
    .from("portfolio_snapshots")
    .select("id, published_at, changes")
    .eq("profile_id", ctx.profileId)
    .order("published_at", { ascending: false })
    .limit(10);
  return (data ?? []) as { id: string; published_at: string; changes: unknown[] }[];
}

export { latestSnapshot };
