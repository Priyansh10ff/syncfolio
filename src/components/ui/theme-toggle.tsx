"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme } from "@/lib/theme";

/** Re-renders when <html data-theme> changes (this toggle, or another tab's script). */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Mono text toggle: `theme: dark`. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as const);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Switch to ${next} theme`}
      className="font-mono text-[11px] text-muted hover:text-ink"
    >
      theme: {theme}
    </button>
  );
}
