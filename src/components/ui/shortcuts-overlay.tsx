"use client";

import { useState } from "react";
import { formatKeys, useHotkey, useShortcutList } from "@/lib/hotkeys";
import { Dialog } from "./dialog";
import { Kbd } from "./kbd";

/** `?` opens a list of every shortcut registered on the current screen. */
export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const list = useShortcutList();

  useHotkey("?", () => setOpen((o) => !o), { description: "Show keyboard shortcuts", group: "General" });

  const groups = new Map<string, typeof list>();
  for (const s of list) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} label="Keyboard shortcuts">
      <div className="px-4 py-3 border-b border-line font-mono text-label uppercase text-muted">
        keyboard shortcuts
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {Array.from(groups.entries()).map(([group, items]) => (
          <section key={group}>
            <h3 className="font-mono text-label uppercase text-faint mb-1.5">{group}</h3>
            <dl className="flex flex-col gap-1">
              {items.map((s) => (
                <div key={s.keys + s.description} className="flex items-center justify-between gap-4 text-[13px]">
                  <dt className="text-ink">{s.description}</dt>
                  <dd className="flex gap-1">
                    {formatKeys(s.keys)
                      .split(" then ")
                      .map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
