"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Kbd } from "@/components/ui";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { useHotkey } from "@/lib/hotkeys";

type ParseResponse = { pending: unknown[]; clarification_needed: string | null };

/**
 * The note prompt: one sentence in, drafted proposals out. Enter submits,
 * Shift+Enter adds a line, "/" focuses it from anywhere on the page.
 * A clarifying question from the model is answered on the same line.
 */
export function NoteBox({ aiConfigured }: { aiConfigured: boolean }) {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");
  const [context, setContext] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(!aiConfigured);
  const [loading, setLoading] = useState(false);
  const [drafted, setDrafted] = useState<number | null>(null);

  useHotkey("/", () => ref.current?.focus(), { description: "Write an update", group: "Updates" });

  async function submit() {
    const text = note.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setDrafted(null);
    const full = context ? `${context}\n(answer to "${question}": ${text})` : text;
    try {
      const res = await api<ParseResponse>("/api/updates/parse", "POST", { note: full });
      if (res.clarification_needed && res.pending.length === 0) {
        setContext(full);
        setQuestion(res.clarification_needed);
        setNote("");
      } else {
        setContext(null);
        setQuestion(null);
        setNote("");
        setDrafted(res.pending.length);
        router.refresh();
      }
    } catch (e) {
      const err = e as Error & { data?: { not_configured?: boolean } };
      if (err.data?.not_configured) setNotConfigured(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="note" className="flex flex-col gap-2">
      {notConfigured && (
        <p className="font-mono text-xs text-thread border border-line bg-surface rounded-sm px-3 py-2">
          no AI model configured — set ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY or LOCAL_AI_BASE_URL. You can still edit everything on the profile page.
        </p>
      )}
      {question && (
        <div className="font-mono text-[13px] border border-line bg-surface rounded-sm px-3 py-2 flex flex-col gap-1">
          <span className="text-thread">? {question}</span>
          <button type="button" className="self-start text-[11px] text-muted hover:text-ink" onClick={() => { setContext(null); setQuestion(null); }}>
            start over
          </button>
        </div>
      )}
      <div className={cn("flex items-start gap-3 border rounded-sm bg-surface px-4 py-3 transition-colors", loading ? "border-thread" : "border-line-strong focus-within:border-thread")}>
        <span aria-hidden className="font-mono text-thread text-lg leading-7">›</span>
        <label htmlFor="note-input" className="sr-only">What changed?</label>
        <textarea
          id="note-input"
          ref={ref}
          rows={1}
          value={note}
          disabled={loading || notConfigured}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={question ? "answer here" : "shipped redis caching on patchwork, p95 down 40%"}
          className="flex-1 resize-none bg-transparent outline-none font-mono text-[15px] leading-7 field-sizing-content min-h-7 max-h-40"
        />
        <span className="font-mono text-[11px] text-muted leading-7 shrink-0">
          {loading ? <span className="animate-pulse">drafting…</span> : <><Kbd>↵</Kbd> draft</>}
        </span>
      </div>
      <div className="flex justify-between font-mono text-[11px] text-muted min-h-4">
        <span>{error ? <span className="text-del">{error}</span> : drafted !== null ? (drafted ? `${drafted} proposal${drafted === 1 ? "" : "s"} drafted ↓` : "nothing to change") : "nothing saves until you approve"}</span>
        <span className="hidden sm:inline"><Kbd>/</Kbd> to focus · <Kbd>⇧↵</Kbd> new line</span>
      </div>
    </section>
  );
}
