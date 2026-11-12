"use client";

import { HotkeysProvider } from "@/lib/hotkeys";
import { ToastProvider, ShortcutsOverlay } from "@/components/ui";

/** Client-side app context: keyboard shortcuts, toasts, and the ? overlay. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HotkeysProvider>
      <ToastProvider>
        {children}
        <ShortcutsOverlay />
      </ToastProvider>
    </HotkeysProvider>
  );
}
