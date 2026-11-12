import { PageHeader } from "@/components/ui";
import { History } from "@/components/app/history";
import { ReviewQueue } from "@/components/app/review-queue";
import { Tabs } from "@/components/app/tabs";
import { isAIConfigured } from "@/lib/ai/providers/types";
import { getDashboardContext, getHistory, getReviewItems } from "@/lib/dashboard";
import { NoteBox } from "./note-box";

export default async function UpdatesPage() {
  const ctx = await getDashboardContext();
  const [items, history] = await Promise.all([getReviewItems(ctx, ["ai_chat"]), getHistory(ctx, ["ai_chat"])]);

  return (
    <>
      <PageHeader title="updates" description="Say what changed. The model drafts a diff against your profile; nothing is saved until you approve it." />
      <div className="flex flex-col gap-10">
        <NoteBox aiConfigured={isAIConfigured()} />
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
                  empty="queue clear. press / and write what you shipped"
                />
              ),
            },
            { id: "history", label: "history", panel: <History rows={history} /> },
          ]}
        />
      </div>
    </>
  );
}
