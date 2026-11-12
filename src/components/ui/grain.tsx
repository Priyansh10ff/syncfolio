/** Fixed film-grain overlay; purely decorative. */
export function Grain({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full mix-blend-overlay"
      style={{ opacity }}
    >
      <filter id="sf-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#sf-grain)" />
    </svg>
  );
}
