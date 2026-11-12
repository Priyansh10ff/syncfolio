"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Keyboard shortcuts.
 *
 * Key syntax:
 *   "j", "?", "escape"       single key (case-insensitive)
 *   "mod+k"                   ⌘ on macOS, Ctrl elsewhere
 *   "shift+enter", "alt+up"   modifiers joined with +
 *   "g p"                     a two-key sequence (second key within 800ms)
 *
 * Shortcuts don't fire while typing in an input/textarea/select/
 * contenteditable unless `allowInInputs` is set (useful for mod+k, escape).
 */

export type HotkeyOptions = {
  /** Shown in the ? overlay. Omit to keep a shortcut out of the list. */
  description?: string;
  /** Overlay group heading, e.g. "Navigation". */
  group?: string;
  enabled?: boolean;
  allowInInputs?: boolean;
};

type Registration = HotkeyOptions & {
  id: number;
  keys: string;
  handler: (e: KeyboardEvent) => void;
};

export type ShortcutInfo = { keys: string; description: string; group: string };

type Ctx = {
  register: (r: Registration) => () => void;
  list: ShortcutInfo[];
};

const HotkeysContext = createContext<Ctx | null>(null);

const SEQUENCE_TIMEOUT = 800;

export function isMac() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Normalises a KeyboardEvent to the "mod+shift+k" form used in registrations. */
function eventToCombo(e: KeyboardEvent): string {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase().replace(/^arrow/, "");
  const parts: string[] = [];
  if (isMac() ? e.metaKey : e.ctrlKey) parts.push("mod");
  if (e.altKey) parts.push("alt");
  // Shift is implied by printable symbols like "?" — only record it for named keys and letters.
  if (e.shiftKey && (e.key.length > 1 || /[a-z]/i.test(e.key))) parts.push("shift");
  parts.push(key);
  return parts.join("+");
}

function normalise(combo: string) {
  return combo
    .trim()
    .toLowerCase()
    .split(" ")
    .map((step) => {
      const parts = step.split("+");
      const key = parts.pop()!;
      const mods = ["mod", "alt", "shift"].filter((m) => parts.includes(m));
      return [...mods, key].join("+");
    })
    .join(" ");
}

export function HotkeysProvider({ children }: { children: React.ReactNode }) {
  const regs = useRef(new Map<number, Registration>());
  const [list, setList] = useState<ShortcutInfo[]>([]);
  const pending = useRef<{ key: string; at: number } | null>(null);

  const refreshList = useCallback(() => {
    const seen = new Set<string>();
    const next: ShortcutInfo[] = [];
    for (const r of regs.current.values()) {
      if (!r.description || r.enabled === false) continue;
      const id = `${r.keys}|${r.description}`;
      if (seen.has(id)) continue;
      seen.add(id);
      next.push({ keys: r.keys, description: r.description, group: r.group ?? "General" });
    }
    setList(next);
  }, []);

  const register = useCallback(
    (r: Registration) => {
      regs.current.set(r.id, { ...r, keys: normalise(r.keys) });
      refreshList();
      return () => {
        regs.current.delete(r.id);
        refreshList();
      };
    },
    [refreshList]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.isComposing) return;
      const combo = eventToCombo(e);
      const typing = isTypingTarget(e.target);
      const now = Date.now();
      const prev = pending.current && now - pending.current.at < SEQUENCE_TIMEOUT ? pending.current.key : null;
      const candidates = prev ? [`${prev} ${combo}`, combo] : [combo];

      // Later registrations win (a dialog's escape beats the page's).
      const all = Array.from(regs.current.values()).reverse();
      for (const keys of candidates) {
        const match = all.find(
          (r) => r.keys === keys && r.enabled !== false && (!typing || r.allowInInputs)
        );
        if (match) {
          e.preventDefault();
          pending.current = null;
          match.handler(e);
          return;
        }
      }

      const startsSequence = !typing && all.some((r) => r.enabled !== false && r.keys.startsWith(`${combo} `));
      pending.current = startsSequence ? { key: combo, at: now } : null;
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ register, list }), [register, list]);
  return <HotkeysContext.Provider value={value}>{children}</HotkeysContext.Provider>;
}

let nextId = 1;

/** Registers a shortcut for as long as the calling component is mounted. */
export function useHotkey(keys: string, handler: (e: KeyboardEvent) => void, options: HotkeyOptions = {}) {
  const ctx = useContext(HotkeysContext);
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const { description, group, enabled = true, allowInInputs = false } = options;

  useEffect(() => {
    if (!ctx) return;
    return ctx.register({
      id: nextId++,
      keys,
      handler: (e) => handlerRef.current(e),
      description,
      group,
      enabled,
      allowInInputs,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.register, keys, description, group, enabled, allowInInputs]);
}

/** Every described shortcut currently registered, for the ? overlay. */
export function useShortcutList(): ShortcutInfo[] {
  return useContext(HotkeysContext)?.list ?? [];
}

/** Display form of a key string: "mod+k" → "⌘K" on macOS, "Ctrl K" elsewhere. */
export function formatKeys(keys: string): string {
  const mac = isMac();
  return keys
    .split(" ")
    .map((step) => {
      const parts = step.split("+");
      const hasModifier = parts.length > 1;
      return parts
        .map((part) => {
          if (part === "mod") return mac ? "⌘" : "Ctrl";
          if (part === "alt") return mac ? "⌥" : "Alt";
          if (part === "shift") return mac ? "⇧" : "Shift";
          if (part === "enter") return "↵";
          if (part === "escape") return "Esc";
          if (part === "up") return "↑";
          if (part === "down") return "↓";
          if (part.length === 1) return hasModifier ? part.toUpperCase() : part;
          return part[0].toUpperCase() + part.slice(1);
        })
        .join(mac ? "" : " ");
    })
    .join(" then ");
}
