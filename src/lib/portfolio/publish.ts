import type { SupabaseClient } from "@supabase/supabase-js";
import { loadProfile } from "@/lib/profile";
import { toPortfolioView, type PortfolioView } from "@/lib/modules";
import { sendPublishWebhook } from "@/lib/webhook";

export type Section = "profile" | "experience" | "projects" | "skills" | "education";
export type ChangeAction = "create" | "update" | "delete";
export type PortfolioChange = { section: Section; action: ChangeAction; id?: string };

export type Snapshot = {
  id: string;
  data: PortfolioView;
  changes: PortfolioChange[];
  published_at: string;
};

const ROW_SECTIONS = ["experience", "projects", "skills", "education"] as const;
const BASICS = ["name", "headline", "summary", "location", "email", "links"] as const;

/** Stable comparison key for a row — ignores updated_at so a no-op save isn't a change. */
function fingerprint(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updated_at, ...rest } = value as Record<string, unknown>;
    return JSON.stringify(rest, Object.keys(rest).sort());
  }
  return JSON.stringify(value ?? null);
}

/** Everything that differs between two portfolio views, per section and row. */
export function diffViews(prev: PortfolioView | null, next: PortfolioView): PortfolioChange[] {
  const changes: PortfolioChange[] = [];

  const basicsChanged = BASICS.some(
    (key) => fingerprint(prev?.[key]) !== fingerprint(next[key])
  );
  if (!prev || basicsChanged) {
    changes.push({ section: "profile", action: prev ? "update" : "create" });
  }

  for (const section of ROW_SECTIONS) {
    const before = new Map<string, unknown>(
      (prev?.[section] ?? []).map((r: { id: string }) => [r.id, r])
    );
    const after = new Map<string, unknown>(next[section].map((r: { id: string }) => [r.id, r]));

    for (const [id, row] of after) {
      if (!before.has(id)) changes.push({ section, action: "create", id });
      else if (fingerprint(before.get(id)) !== fingerprint(row)) {
        changes.push({ section, action: "update", id });
      }
    }
    for (const id of before.keys()) {
      if (!after.has(id)) changes.push({ section, action: "delete", id });
    }
  }

  return changes;
}

/** The most recent published snapshot, or null if nothing has been published. */
export async function latestSnapshot(
  client: SupabaseClient,
  profileId: string
): Promise<Snapshot | null> {
  const { data } = await client
    .from("portfolio_snapshots")
    .select("id, data, changes, published_at")
    .eq("profile_id", profileId)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle<Snapshot>();
  return data ?? null;
}

/** Changes in the live portfolio view that haven't been published yet. */
export async function unpublishedChanges(
  supabase: SupabaseClient,
  profileId: string
): Promise<{ changes: PortfolioChange[]; last_published_at: string | null }> {
  const [loaded, last] = await Promise.all([
    loadProfile(supabase, profileId),
    latestSnapshot(supabase, profileId),
  ]);
  if (!loaded) return { changes: [], last_published_at: null };
  return {
    changes: diffViews(last?.data ?? null, toPortfolioView(loaded.profile)),
    last_published_at: last?.published_at ?? null,
  };
}

/**
 * Freezes the current portfolio view as a new snapshot and fires the
 * webhook once with everything that changed. No-op (published: false)
 * when nothing differs from the last snapshot.
 */
export async function publishPortfolio(
  supabase: SupabaseClient,
  profileId: string
): Promise<{ published: boolean; snapshot: Snapshot | null }> {
  const [loaded, last] = await Promise.all([
    loadProfile(supabase, profileId),
    latestSnapshot(supabase, profileId),
  ]);
  if (!loaded) throw new Error("Profile not found");

  const view = toPortfolioView(loaded.profile);
  const changes = diffViews(last?.data ?? null, view);
  if (last && changes.length === 0) return { published: false, snapshot: last };

  const { data: snapshot, error } = await supabase
    .from("portfolio_snapshots")
    .insert({ profile_id: profileId, data: view, changes })
    .select("id, data, changes, published_at")
    .single<Snapshot>();
  if (error) throw new Error(error.message);

  await sendPublishWebhook(supabase, profileId, {
    published_at: snapshot.published_at,
    changes,
  });
  return { published: true, snapshot };
}
