import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-sm border bg-surface px-2.5 text-[13px] text-ink outline-none transition-colors " +
  "focus:border-thread disabled:opacity-50";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; mono?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, mono = true, className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, "h-8", mono && "font-mono", invalid ? "border-del" : "border-line", className)}
      {...rest}
    />
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; mono?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, mono = false, className, rows = 3, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, "py-1.5 resize-y", mono && "font-mono", invalid ? "border-del" : "border-line", className)}
      {...rest}
    />
  );
});

/** 11px uppercase mono label. */
export function Label({
  children,
  className,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("font-mono text-label uppercase text-muted", className)} {...rest}>
      {children}
    </label>
  );
}

/** Label + control + hint/error, wired up with ids for screen readers. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: (props: { id: string; "aria-describedby"?: string; invalid: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-describedby": describedBy, invalid: !!error })}
      {(error || hint) && (
        <p id={describedBy} className={cn("font-mono text-xs", error ? "text-del" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
