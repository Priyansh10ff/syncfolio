import { PageHeader } from "@/components/ui";
import { getDashboardContext, getPublishHistory, latestSnapshot } from "@/lib/dashboard";
import { toPortfolioView, type PortfolioView } from "@/lib/modules";
import { diffViews } from "@/lib/portfolio/publish";
import ModuleOff from "../module-off";
import PortfolioWorkspace, { type PendingChange } from "./portfolio-client";

type Rows = Record<string, unknown>[];

function rowsOf(view: PortfolioView | null | undefined, section: string): Rows {
  return ((view as unknown as Record<string, Rows> | null | undefined)?.[section] ?? []) as Rows;
}

function basics(view: PortfolioView | null | undefined) {
  if (!view) return null;
  const { name, headline, summary, location, email, links } = view;
  return { name, headline, summary, location, email, links };
}

const label = (row: Record<string, unknown> | null) =>
  String(row?.name ?? row?.role ?? row?.institution ?? "row");

export default async function PortfolioPage() {
  const ctx = await getDashboardContext();
  if (!ctx.settings.portfolio_enabled) return <ModuleOff name="Portfolio" />;

  const [last, history] = await Promise.all([latestSnapshot(ctx.supabase, ctx.profileId), getPublishHistory(ctx)]);
  const live = toPortfolioView(ctx.profile);
  const prev = last?.data ?? null;

  const pending: PendingChange[] = diffViews(prev, live).map((c) => {
    if (c.section === "profile") {
      return { ...c, key: "profile", label: "basics", before: basics(prev), after: basics(live) };
    }
    const before = rowsOf(prev, c.section).find((r) => r.id === c.id) ?? null;
    const after = rowsOf(live, c.section).find((r) => r.id === c.id) ?? null;
    return { ...c, key: `${c.section}-${c.id}`, label: label(after ?? before), before, after };
  });

  return (
    <>
      <PageHeader
        title="portfolio"
        description="Your site reads the last published version. Edits wait here until you publish — or publish themselves on approval when auto-sync is on."
      />
      <PortfolioWorkspace
        pending={pending}
        history={history.map((h) => ({ id: h.id, published_at: h.published_at, count: h.changes.length }))}
        lastPublishedAt={last?.published_at ?? null}
        publicToken={ctx.row.public_token}
        webhookUrl={ctx.row.webhook_url}
        autoSync={ctx.settings.portfolio_auto_sync}
      />
    </>
  );
}
