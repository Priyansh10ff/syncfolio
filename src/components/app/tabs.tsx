"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** Minimal mono tab strip; panels stay mounted so their state survives switching. */
export function Tabs({ tabs }: { tabs: { id: string; label: string; count?: number; panel: React.ReactNode }[] }) {
  const [current, setCurrent] = useState(tabs[0]?.id);
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-4 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={current === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setCurrent(t.id)}
            className={cn(
              "font-mono text-label uppercase pb-2 -mb-px border-b-2",
              current === t.id ? "border-thread text-ink" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="text-faint"> [{t.count}]</span>}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={current !== t.id}>
          {t.panel}
        </div>
      ))}
    </div>
  );
}
