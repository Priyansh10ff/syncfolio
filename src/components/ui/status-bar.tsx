import { cn } from "@/lib/cn";

export type StatusItem = {
  id: string;
  label: React.ReactNode;
  tone?: "ok" | "warn" | "error" | "muted";
};

const DOT = {
  ok: "bg-add",
  warn: "bg-thread",
  error: "bg-del",
  muted: "bg-faint",
} as const;

/** vim/tmux-style status line pinned to the bottom of the app shell. */
export function StatusBar({ items, right }: { items: StatusItem[]; right?: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="h-7 shrink-0 flex items-center justify-between gap-4 px-3 border-t border-line bg-surface font-mono text-[11px] text-muted"
    >
      <ul className="flex items-center gap-0 min-w-0 overflow-hidden">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center whitespace-nowrap">
            {i > 0 && <span className="px-2 text-faint" aria-hidden>·</span>}
            {item.tone && <span aria-hidden className={cn("inline-block w-1.5 h-1.5 mr-1.5", DOT[item.tone])} />}
            {item.label}
          </li>
        ))}
      </ul>
      {right && <div className="flex items-center gap-3 shrink-0">{right}</div>}
    </div>
  );
}
