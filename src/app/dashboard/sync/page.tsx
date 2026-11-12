import { EmptyState, PageHeader, SectionHeader } from "@/components/ui";
import { History } from "@/components/app/history";
import { ReviewQueue } from "@/components/app/review-queue";
import { Tabs } from "@/components/app/tabs";
import { getDashboardContext, getHistory, getReviewItems } from "@/lib/dashboard";
import { GithubScan } from "./sync-client";

const SOURCES = ["github_scan", "external_sync"] as const;

export default async function SyncPage() {
  const ctx = await getDashboardContext();
  const [items, history] = await Promise.all([getReviewItems(ctx, [...SOURCES]), getHistory(ctx, [...SOURCES])]);
  const token = ctx.row.public_token;

  return (
    <>
      <PageHeader title="sync" description="Proposals from your GitHub and from edits made on your own site. Same rules: nothing lands until you approve." />
      <div className="flex flex-col gap-12">
        <section id="github" className="flex flex-col gap-4">
          <SectionHeader title="github" />
          <p className="text-[13px] text-muted max-w-prose">Public, non-fork repos that aren&apos;t linked from a project yet become proposals. Reject one and it won&apos;t come back.</p>
          <GithubScan initialUsername={ctx.row.github_username} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="queue" count={items.length} />
          <Tabs
            tabs={[
              {
                id: "queue",
                label: "review",
                count: items.length,
                panel: (
                  <ReviewQueue
                    initialItems={items}
                    portfolioEnabled={ctx.settings.portfolio_enabled}
                    autoSync={ctx.settings.portfolio_auto_sync}
                    empty="nothing from github or your site. scan above, or push edits from your portfolio"
                  />
                ),
              },
              { id: "history", label: "history", panel: <History rows={history} /> },
            ]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeader title="edits from your site" />
          {ctx.settings.portfolio_enabled ? (
            <>
              <p className="text-[13px] text-muted max-w-prose">Changed something directly on your portfolio? Send it back as a proposal with your public token. It lands in the queue above — it never writes on its own.</p>
              <pre className="font-mono text-[12px] leading-6 bg-surface border border-line rounded-sm p-4 overflow-x-auto">{`curl -X POST $SYNCFOLIO_URL/api/profile/external-sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "${token}",
    "changes": [{
      "target_table": "profiles",
      "action": "update",
      "payload": { "headline": "Full-stack developer" },
      "diff_summary": "Headline edited on my site"
    }]
  }'`}</pre>
            </>
          ) : (
            <EmptyState>the portfolio module is off, so external edits are disabled</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
