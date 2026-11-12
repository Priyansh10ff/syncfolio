"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { buttonClassName, EmptyState, Kbd, SectionHeader, ToggleChip, useToast } from "@/components/ui";
import { SECTIONS, type AnyRow } from "@/components/app/profile/specs";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { useHotkey } from "@/lib/hotkeys";
import { toResumeView } from "@/lib/modules";
import type { Profile } from "@/lib/schema/profile";
import { ResumeDocument, type ResumeDensity } from "@/lib/resume/template";

const DENSITY_KEY = "sf-resume-density";
const DENSITY_EVENT = "sf:density";

function readDensity(): ResumeDensity {
  try {
    return localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

function subscribeDensity(onChange: () => void) {
  window.addEventListener(DENSITY_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DENSITY_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Remembered per browser; falls back to "comfortable" if storage is blocked. */
function changeDensity(d: ResumeDensity) {
  try {
    localStorage.setItem(DENSITY_KEY, d);
  } catch {
    // storage blocked: the preference just isn't remembered
  }
  window.dispatchEvent(new Event(DENSITY_EVENT));
}

/**
 * Split view: an outline of every row with its R switch on the left, the
 * live A4 preview on the right. Toggling R updates the preview at once.
 */
export default function ResumeWorkspace({ initial }: { initial: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState(initial);
  const density = useSyncExternalStore(subscribeDensity, readDensity, () => "comfortable" as const);

  const pdfHref = `/api/resume/pdf${density === "compact" ? "?density=compact" : ""}`;
  useHotkey("d", () => window.open(pdfHref, "_self"), { description: "Download PDF", group: "Resume" });
  useHotkey("c", () => changeDensity(density === "compact" ? "comfortable" : "compact"), { description: "Toggle compact layout", group: "Resume" });

  async function toggle(table: (typeof SECTIONS)[number]["table"], id: string, on: boolean) {
    const update = (value: boolean) =>
      setProfile((p) => ({
        ...p,
        [table]: (p[table] as unknown as AnyRow[]).map((r) => (r.id === id ? { ...r, show_on_resume: value } : r)),
      }));
    update(on);
    try {
      await api(`/api/${table}`, "PATCH", { id, show_on_resume: on });
      router.refresh();
    } catch (e) {
      update(!on);
      toast({ message: (e as Error).message, tone: "error" });
    }
  }

  const resume = toResumeView(profile);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6" aria-label="Resume outline">
        <div className="flex flex-col gap-2">
          <SectionHeader title="layout" />
          <div role="radiogroup" aria-label="Density" className="flex gap-1">
            {(["comfortable", "compact"] as const).map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={density === d}
                onClick={() => changeDensity(d)}
                className={cn("flex-1 h-7 rounded-sm border font-mono text-[12px]", density === d ? "border-thread text-ink bg-thread-soft" : "border-line text-muted hover:text-ink")}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        {SECTIONS.map((spec) => {
          const rows = profile[spec.table] as unknown as AnyRow[];
          return (
            <div key={spec.table} className="flex flex-col gap-1">
              <SectionHeader title={spec.title} count={rows.filter((r) => r.show_on_resume !== false).length} />
              {rows.length === 0 && <EmptyState className="py-1">none</EmptyState>}
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2 py-1">
                  <ToggleChip label="R" title={`Show ${spec.label(row)} on resume`} on={row.show_on_resume !== false} onChange={(v) => toggle(spec.table, row.id, v)} />
                  <span className={cn("font-mono text-[12px] truncate", row.show_on_resume === false ? "text-faint line-through" : "text-ink")}>{spec.label(row)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </aside>

      <section aria-label="Preview" className="flex flex-col gap-3 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-muted">A4 · {density} · rows marked R</span>
          <a href={pdfHref} className={cn(buttonClassName({ variant: "primary" }), "gap-2")}>
            download pdf <Kbd className="border-thread-ink/40 text-thread-ink/80">d</Kbd>
          </a>
        </div>
        {resume.name ? (
          <div className="border border-line rounded-sm overflow-hidden bg-surface shadow-[0_30px_60px_-40px_rgba(0,0,0,0.6)]">
            <PDFViewer style={{ width: "100%", height: "78vh", border: "none" }} showToolbar={false}>
              <ResumeDocument profile={resume} density={density} />
            </PDFViewer>
          </div>
        ) : (
          <EmptyState>add your name on the profile page to see a preview</EmptyState>
        )}
      </section>
    </div>
  );
}
