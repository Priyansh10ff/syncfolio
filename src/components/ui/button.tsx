import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Kbd } from "./kbd";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-thread text-thread-ink border border-thread hover:brightness-110",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-2",
  ghost: "text-muted border border-transparent hover:text-ink hover:bg-surface-2",
  danger: "bg-surface text-del border border-line hover:border-del",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2 text-xs gap-1.5",
  md: "h-8 px-3 text-[13px] gap-2",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Shortcut hint shown inside the button, e.g. "a" or "⌘K". Display only. */
  shortcut?: string;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", shortcut, loading, className, children, disabled, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-sm font-mono whitespace-nowrap select-none",
        "transition-colors duration-100 disabled:opacity-40 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? <span className="animate-pulse">…</span> : children}
      {shortcut && !loading && (
        <Kbd className={variant === "primary" ? "border-thread-ink/40 text-thread-ink/80" : undefined}>
          {shortcut}
        </Kbd>
      )}
    </button>
  );
});
