import { cn } from "@/lib/cn";
import type { FieldChange } from "@/lib/diff";

const MARK = { add: "+", del: "-", ctx: " " } as const;
const LINE = {
  add: "text-add bg-add-soft",
  del: "text-del bg-del-soft",
  ctx: "text-muted",
} as const;

/**
 * A proposal or unpublished change rendered like a terminal diff.
 *
 *   projects / Patchwork                     [ai_chat]
 *     metrics
 *   +   "cut p95 latency 40%"
 */
export function DiffView({
  title,
  meta,
  summary,
  changes,
  footer,
  active,
  className,
}: {
  /** e.g. "projects / Patchwork" */
  title: React.ReactNode;
  /** Right side of the header — usually <Tag>s. */
  meta?: React.ReactNode;
  /** One-line human summary under the title. */
  summary?: React.ReactNode;
  changes: FieldChange[];
  /** Action row — approve / reject / edit. */
  footer?: React.ReactNode;
  /** Keyboard-selected in a list. */
  active?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "border rounded-sm bg-surface font-mono text-[12.5px] animate-fade",
        active ? "border-thread" : "border-line",
        className
      )}
    >
      <header className="flex items-start justify-between gap-4 px-3 pt-2.5 pb-2 border-b border-line">
        <div className="min-w-0">
          <div className="text-ink truncate">{title}</div>
          {summary && <div className="font-sans text-[13px] text-muted mt-0.5">{summary}</div>}
        </div>
        {meta && <div className="flex items-center gap-2 shrink-0">{meta}</div>}
      </header>

      <div className="py-1.5">
        {changes.length === 0 && <div className="px-3 py-1 text-muted">no field changes</div>}
        {changes.map((change) => (
          <div key={change.field} className="py-0.5">
            <div className="px-3 pl-7 text-muted">{change.field}</div>
            {change.lines.map((line, i) => (
              <div key={i} className={cn("flex gap-3 px-3 whitespace-pre-wrap break-words", LINE[line.kind])}>
                <span aria-hidden className="select-none w-2 shrink-0">
                  {MARK[line.kind]}
                </span>
                <span className="sr-only">{line.kind === "add" ? "added: " : line.kind === "del" ? "removed: " : ""}</span>
                <span className="pl-2 min-w-0">{line.text}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {footer && (
        <footer className="flex items-center justify-end gap-2 px-3 py-2 border-t border-line">{footer}</footer>
      )}
    </article>
  );
}
