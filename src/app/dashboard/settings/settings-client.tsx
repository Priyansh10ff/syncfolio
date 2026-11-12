"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SectionHeader, ThemeToggle, useToast } from "@/components/ui";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { ProfileSettings } from "@/lib/schema/profile";

const OPTIONS: { key: keyof ProfileSettings; label: string; hint: string }[] = [
  { key: "resume_enabled", label: "resume", hint: "Live A4 preview and PDF built from rows marked R." },
  { key: "portfolio_enabled", label: "portfolio", hint: "Publishes rows marked P to an endpoint your own site reads." },
  { key: "portfolio_auto_sync", label: "auto-sync on approval", hint: "Approving an update also publishes the portfolio. Off: changes wait for you to publish." },
];

function Switch({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cn("relative inline-block w-9 h-5 rounded-sm border transition-colors", on ? "border-thread bg-thread-soft" : "border-line-strong")}>
      <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-xs transition-all", on ? "left-[18px] bg-thread" : "left-0.5 bg-faint")} />
    </span>
  );
}

export default function SettingsClient({ initial, email }: { initial: ProfileSettings; email: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [settings, setSettings] = useState(initial);

  async function toggle(key: keyof ProfileSettings) {
    try {
      const next = await api<ProfileSettings>("/api/settings", "PATCH", { [key]: !settings[key] });
      setSettings(next);
      router.refresh();
    } catch (e) {
      toast({ message: (e as Error).message, tone: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-2" aria-labelledby="sec-modules">
        <SectionHeader id="sec-modules" title="modules" />
        <p className="text-[13px] text-muted">Resume and portfolio sit on the same profile. Use one or both — at least one stays on.</p>
        <ul className="flex flex-col">
          {OPTIONS.map(({ key, label, hint }) => {
            const disabled = key === "portfolio_auto_sync" && !settings.portfolio_enabled;
            return (
              <li key={key} className="border-b border-line/70">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  disabled={disabled}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between gap-6 py-3 text-left disabled:opacity-40"
                >
                  <span>
                    <span className="block font-mono text-[13px] text-ink">{label}</span>
                    <span className="block text-[13px] text-muted">{hint}</span>
                  </span>
                  <Switch on={settings[key]} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sec-look">
        <SectionHeader id="sec-look" title="appearance" />
        <div className="flex items-center justify-between py-1">
          <span className="text-[13px] text-muted">Dark or light. Saved in this browser.</span>
          <ThemeToggle />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="sec-account">
        <SectionHeader id="sec-account" title="account" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[13px]">{email ?? "signed in"}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="font-mono text-[12px] text-muted hover:text-del">sign out</button>
          </form>
        </div>
      </section>
    </div>
  );
}
