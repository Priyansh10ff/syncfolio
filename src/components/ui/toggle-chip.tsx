import { cn } from "@/lib/cn";

/** One-letter on/off switch, e.g. the R / P visibility toggles on a profile row. */
export function ToggleChip({
  label,
  title,
  on,
  onChange,
  disabled,
}: {
  label: string;
  /** Full name for screen readers and the tooltip, e.g. "Show on resume". */
  title: string;
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={title}
      title={`${title}: ${on ? "on" : "off"}`}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-xs border font-mono text-[10px] leading-none",
        "transition-colors disabled:opacity-40",
        on ? "border-thread text-thread bg-thread-soft" : "border-line text-faint line-through hover:text-muted"
      )}
    >
      {label}
    </button>
  );
}
