import Link from "next/link";

const nav = [
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/updates", label: "Updates" },
  { href: "/dashboard/resume", label: "Resume" },
  { href: "/dashboard/portfolio", label: "Portfolio" },
  { href: "/dashboard/sync", label: "Sync", soon: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-[var(--loom-line)] px-5 py-6 flex flex-col gap-8">
        <div className="font-display text-xl tracking-tight">Loom</div>
        <nav className="flex flex-col gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded px-2 py-1.5 text-[var(--loom-ink)] hover:bg-[var(--loom-thread-soft)] transition-colors"
            >
              <span>{item.label}</span>
              {item.soon && (
                <span className="text-[10px] text-[var(--loom-muted)]">
                  phase 5
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
