/**
 * Only allow same-origin, in-app paths as post-login redirects, so a
 * crafted `?next=https://evil.example` can't bounce users off-site.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard/profile") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
