import localFont from "next/font/local";

// Self-hosted from @fontsource packages, like the app's Plex fonts: no
// Google Fonts request and builds work offline. Paths must be literals.

export const landingDisplay = localFont({
  src: [
    { path: "../../../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff2", weight: "500" },
    { path: "../../../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2", weight: "700" },
    { path: "../../../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-ld-display",
  display: "swap",
});

export const landingHand = localFont({
  src: [{ path: "../../../node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2", weight: "700" }],
  variable: "--font-ld-hand",
  display: "swap",
});

export const landingMono = localFont({
  src: [
    { path: "../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2", weight: "400" },
    { path: "../../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-ld-mono",
  display: "swap",
});
