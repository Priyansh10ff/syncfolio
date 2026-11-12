import { cn } from "@/lib/cn";

/** A keyboard key, e.g. <Kbd>j</Kbd>. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-xs",
        "border border-line-strong font-mono text-[10px] leading-none text-muted",
        className
      )}
    >
      {children}
    </kbd>
  );
}
