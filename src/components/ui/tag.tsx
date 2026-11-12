import { cn } from "@/lib/cn";

type Tone = "neutral" | "thread" | "add" | "del";

const TONES: Record<Tone, string> = {
  neutral: "text-muted",
  thread: "text-thread",
  add: "text-add",
  del: "text-del",
};

/** Inline mono tag rendered as `[label]`. */
export function Tag({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span title={title} className={cn("font-mono text-label uppercase whitespace-nowrap", TONES[tone], className)}>
      [{children}]
    </span>
  );
}
