"use client";

import { useEffect, type RefObject } from "react";
import { clamp01, revealProgress, sceneVars, type SceneName } from "./scenes";

/** Max height of a pinned stage — must match `.ld-stage` in landing.css. */
const STAGE_MAX = 900;

function setVars(el: HTMLElement, vars: Record<string, number>) {
  for (const key in vars) el.style.setProperty(`--${key}`, vars[key].toFixed(4));
}

/**
 * Drives every scroll-linked effect under `rootRef` by writing CSS custom
 * properties, once per animation frame:
 *  - `[data-ld-hero]`  → --hp, hero scroll progress (parallax)
 *  - `[data-ld-pin]`   → the scene's vars from scenes.ts
 *  - `.ld-rv, .ld-tilt` → --v, scroll-in progress
 * With reduced motion every value is left at its CSS default (the finished
 * state), so nothing moves.
 */
export function useScrollScenes(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hero = root.querySelector<HTMLElement>("[data-ld-hero]");
    const pins = Array.from(root.querySelectorAll<HTMLElement>("[data-ld-pin]"));
    const reveals = Array.from(root.querySelectorAll<HTMLElement>(".ld-rv, .ld-tilt"));

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;

      if (hero) {
        const r = hero.getBoundingClientRect();
        setVars(hero, { hp: clamp01(-r.top / r.height) });
      }

      for (const pin of pins) {
        const r = pin.getBoundingClientRect();
        const span = r.height - Math.min(vh, STAGE_MAX);
        // span ≤ 0 means the scene is unpinned (small screens): show it finished.
        const p = span > 0 ? clamp01(-r.top / span) : 1;
        setVars(pin, sceneVars(pin.dataset.ldPin as SceneName, p));
      }

      for (const el of reveals) {
        el.style.setProperty("--v", revealProgress(el.getBoundingClientRect().top, vh).toFixed(4));
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rootRef]);
}
