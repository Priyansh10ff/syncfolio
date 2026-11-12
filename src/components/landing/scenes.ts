/**
 * Pure timing for the landing page's pinned scenes. Each function maps a
 * scene's scroll progress `p` (0 → 1 while it is pinned) to the CSS
 * custom properties landing.css reads. Every value is 0–1.
 */

export type SceneName = "desk" | "inbox" | "folders";
export type SceneVars = Record<string, number>;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Progress through [a, b], clamped. */
const segment = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/** Smoothstep — eases both ends of a segment. */
const ease = (x: number) => x * x * (3 - 2 * x);

/** 1 once a value has effectively arrived, else 0 (for step-like counters). */
const arrived = (x: number) => (x > 0.98 ? 1 : 0);

export function sceneVars(scene: SceneName, p: number): SceneVars {
  const seg = (a: number, b: number) => segment(p, a, b);

  switch (scene) {
    case "desk":
      return {
        p,
        cam: ease(seg(0.04, 0.28)), // camera pulls back from the sticky note
        note: ease(seg(0.3, 0.42)), // note peels off the desk
        type: seg(0.34, 0.47), // its text types into the laptop
        diff: ease(seg(0.47, 0.55)),
        appr: seg(0.57, 0.61),
        stamp: ease(seg(0.6, 0.65)), // old PDFs stamped STALE
        stale: ease(seg(0.66, 0.8)), // …and slid off the desk
        fresh: ease(seg(0.68, 0.84)), // new resume slides out
        hl: seg(0.84, 0.92),
        ph: ease(seg(0.86, 0.94)), // phone shows "published"
        c1: 1 - seg(0.22, 0.3),
        c2: seg(0.3, 0.36) * (1 - seg(0.54, 0.6)),
        c3: seg(0.58, 0.64) * (1 - seg(0.78, 0.84)),
        c4: seg(0.82, 0.88),
      };
    case "inbox": {
      const i1 = ease(seg(0.08, 0.32));
      const i2 = ease(seg(0.32, 0.56));
      const i3 = ease(seg(0.56, 0.8));
      return {
        p,
        i1,
        i2,
        i3,
        b1: arrived(i1) * (1 - arrived(i2)),
        b2: arrived(i2) * (1 - arrived(i3)),
        b3: arrived(i3),
      };
    }
    case "folders":
      return { p, f1: ease(seg(0.12, 0.5)), f2: ease(seg(0.4, 0.82)) };
  }
}

/** Scroll-in progress for a revealed element: 0 below the fold → 1 once well inside. */
export function revealProgress(top: number, viewportHeight: number) {
  return clamp01((viewportHeight * 0.98 - top) / (viewportHeight * 0.55));
}
