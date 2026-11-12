"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatKeys, useHotkey } from "@/lib/hotkeys";
import { Dialog } from "./dialog";
import { Kbd } from "./kbd";

export type Command = {
  id: string;
  label: string;
  group?: string;
  /** Extra words that should match, e.g. "cv pdf" for "Download resume". */
  keywords?: string;
  /** Display-only shortcut, e.g. "g p". */
  keys?: string;
  run: () => void;
};

/** Subsequence match score: higher is better, -1 = no match. Rewards prefix and word-start hits. */
export function scoreCommand(query: string, text: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 1000 - t.length;
  const idx = t.indexOf(q);
  if (idx >= 0) return 500 - idx;
  let score = 0;
  let ti = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return -1;
    score += found === 0 || t[found - 1] === " " ? 10 : 1;
    ti = found + 1;
  }
  return score;
}

/** ⌘K / Ctrl+K palette over a list of commands. */
export function CommandPalette({ commands }: { commands: Command[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useHotkey(
    "mod+k",
    () => {
      setOpen((o) => !o);
      setQuery("");
      setActive(0);
    },
    { description: "Open command palette", group: "General", allowInInputs: true }
  );

  const results = useMemo(() => {
    return commands
      .map((c) => ({ c, score: scoreCommand(query, `${c.label} ${c.keywords ?? ""} ${c.group ?? ""}`) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.c);
  }, [commands, query]);

  function run(command: Command | undefined) {
    if (!command) return;
    setOpen(false);
    command.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    }
  }

  const listId = "command-palette-list";

  return (
    <Dialog open={open} onClose={() => setOpen(false)} label="Command palette">
      <div className="flex items-center gap-2 px-3 border-b border-line">
        <span className="font-mono text-thread select-none" aria-hidden>
          ›
        </span>
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          aria-label="Search commands"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="type a command"
          className="flex-1 h-10 bg-transparent outline-none font-mono text-[13px]"
        />
      </div>
      <ul id={listId} role="listbox" className="max-h-[50vh] overflow-y-auto py-1">
        {results.length === 0 && <li className="px-3 py-2 font-mono text-xs text-muted">no matches</li>}
        {results.map((c, i) => (
          <li
            key={c.id}
            id={`cmd-${c.id}`}
            role="option"
            aria-selected={i === active}
            onMouseMove={() => setActive(i)}
            onClick={() => run(c)}
            className={cn(
              "flex items-center justify-between gap-4 px-3 py-1.5 cursor-pointer text-[13px]",
              i === active ? "bg-surface-2 shadow-[inset_2px_0_0_var(--sf-thread)]" : ""
            )}
          >
            <span>
              {c.group && <span className="font-mono text-label uppercase text-faint mr-2">{c.group}</span>}
              {c.label}
            </span>
            {c.keys && (
              <span className="flex gap-1">
                {formatKeys(c.keys)
                  .split(" then ")
                  .map((k, j) => (
                    <Kbd key={j}>{k}</Kbd>
                  ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
