import { cn } from "@/lib/cn";

/** Terse mono empty state, e.g. "no projects. press g to scan github". */
export function EmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs text-muted py-3", className)}>
      <span className="text-faint select-none">{"// "}</span>
      {children}
    </p>
  );
}
