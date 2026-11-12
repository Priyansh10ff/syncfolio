import { cn } from "@/lib/cn";

/** Uppercase mono section heading with an optional count and right-side actions. */
export function SectionHeader({
  title,
  count,
  actions,
  className,
  id,
}: {
  title: string;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-line pb-1.5", className)}>
      <h2 id={id} className="font-mono text-label uppercase text-muted">
        {title}
        {count !== undefined && <span className="text-faint"> [{count}]</span>}
      </h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Page title block used at the top of every dashboard screen. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-6 mb-8">
      <div className="min-w-0">
        <h1 className="font-mono text-lg font-medium tracking-tight">{title}</h1>
        {description && <p className="text-[13px] text-muted mt-1 max-w-prose">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
