"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "ok" | "error";

export type ToastInput = {
  message: string;
  tone?: Tone;
  /** e.g. { label: "undo", onClick } */
  action?: { label: string; onClick: () => void };
  /** ms; 0 keeps it until dismissed. Default 4000 (8000 with an action). */
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

const MARK: Record<Tone, string> = { neutral: "›", ok: "✓", error: "×" };
const TONE: Record<Tone, string> = { neutral: "text-muted", ok: "text-add", error: "text-del" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-2), { ...input, id }]);
      const duration = input.duration ?? (input.action ? 8000 : 4000);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-4 bottom-10 z-50 flex flex-col gap-2 w-[min(380px,calc(100vw-2rem))]"
      >
        {items.map((t) => {
          const tone = t.tone ?? "neutral";
          return (
            <div
              key={t.id}
              role={tone === "error" ? "alert" : "status"}
              className="flex items-start gap-2 bg-surface border border-line-strong rounded-sm px-3 py-2 font-mono text-xs animate-fade"
            >
              <span aria-hidden className={cn("shrink-0", TONE[tone])}>
                {MARK[tone]}
              </span>
              <span className="flex-1 text-ink">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  className="text-thread hover:underline shrink-0"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Dismiss"
                className="text-faint hover:text-ink shrink-0"
                onClick={() => dismiss(t.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>");
  return toast;
}
