import type { CSSProperties, ReactNode } from "react";

export const REPO_URL = "https://github.com/Priyansh10ff/syncfolio";
export const DOCS_URL = `${REPO_URL}/tree/main/docs`;
export const SELF_HOST_URL = `${REPO_URL}/blob/main/docs/DEPLOYMENT.md`;
export const START_URL = "/login";

/** Inline style that also sets CSS custom properties (e.g. { "--r": "6deg" }). */
export function sx(style: Record<string, string | number>): CSSProperties {
  return style as CSSProperties;
}

export function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="5" width="20" height="22" rx="2" fill="#fffdf8" transform="rotate(-6 13 16)" />
      <rect x="9" y="4" width="20" height="20" rx="2" fill="#ffd84d" transform="rotate(5 19 14)" />
      <path d="M14 13h10M14 18h7" stroke="#2a2416" strokeWidth="2" transform="rotate(5 19 14)" />
    </svg>
  );
}

/** Film grain over the whole page. */
export function Grain() {
  return (
    <svg className="ld-grain" aria-hidden="true">
      <filter id="ld-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ld-noise)" />
    </svg>
  );
}

/** The numbered edge of the cutting mat. */
export function Ruler() {
  return (
    <div className="ld-ruler ld-mono" aria-hidden="true">
      {Array.from({ length: 21 }, (_, i) => (
        <span key={i}>{i}</span>
      ))}
    </div>
  );
}

export function Sticky({
  color,
  className = "",
  style,
  children,
}: {
  color: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={`ld-sticky ${className}`} style={{ background: color, boxSizing: "border-box", ...style }}>
      {children}
    </div>
  );
}

/** A printed PDF on the desk: filename, skeleton lines, optional extras. */
export function StalePrint({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <>
      <div className="ld-mono ld-muted-ink">{name}</div>
      <div className="ld-skel" style={{ height: 8, margin: "14px 0 6px", width: "55%" }} />
      <div className="ld-skel" style={{ width: "90%" }} />
      <div className="ld-skel" style={{ width: "76%" }} />
      {children}
    </>
  );
}

/** The two-line AI diff shown on the laptop screens. */
export function DiffLines({ withLabels = false }: { withLabels?: boolean }) {
  return (
    <>
      <div className="ld-mono ld-diffline">+ {withLabels && "metrics "}&quot;cut p95 latency 40%&quot;</div>
      <div className="ld-mono ld-diffline">+ {withLabels && "bullets "}&quot;Added Redis caching&quot;</div>
    </>
  );
}
