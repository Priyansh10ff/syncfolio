"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfileSettings } from "@/lib/schema/profile";

const OPTIONS: { key: keyof ProfileSettings; label: string; hint: string }[] = [
  {
    key: "resume_enabled",
    label: "Resume",
    hint: "Live preview and PDF built from rows marked for the resume.",
  },
  {
    key: "portfolio_enabled",
    label: "Portfolio",
    hint: "Publishes rows marked for the portfolio to a JSON endpoint your site reads.",
  },
  {
    key: "portfolio_auto_sync",
    label: "Auto-sync approved updates to the portfolio",
    hint: "When on, approving an update also publishes the portfolio. When off, changes wait until you publish.",
  },
];

export default function SettingsClient({ initial }: { initial: ProfileSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof ProfileSettings) {
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: !settings[key] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setSettings(data);
    router.refresh(); // updates the sidebar
  }

  return (
    <div className="flex flex-col gap-4">
      {OPTIONS.map(({ key, label, hint }) => {
        const disabled = key === "portfolio_auto_sync" && !settings.portfolio_enabled;
        return (
          <label
            key={key}
            className={`flex items-start gap-3 border border-[var(--sf-line)] rounded px-3 py-2 ${
              disabled ? "opacity-50" : ""
            }`}
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={settings[key]}
              disabled={disabled}
              onChange={() => toggle(key)}
            />
            <span>
              <span className="block text-sm">{label}</span>
              <span className="block text-xs text-[var(--sf-muted)]">{hint}</span>
            </span>
          </label>
        );
      })}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
