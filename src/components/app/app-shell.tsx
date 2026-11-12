"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Providers } from "@/components/providers";
import { CommandPalette, Grain, Kbd, openCommandPalette, StatusBar, ThemeToggle, type Command, type StatusItem } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useHotkey } from "@/lib/hotkeys";
import { applyTheme, readTheme } from "@/lib/theme";
import { ago } from "@/lib/time";
import type { ShellStatus } from "@/lib/dashboard";

type NavItem = { href: string; label: string; keys: string; count?: number };

function navItems(status: ShellStatus): NavItem[] {
  const { settings, counts } = status;
  return [
    { href: "/dashboard/profile", label: "profile", keys: "g p" },
    { href: "/dashboard/updates", label: "updates", keys: "g u", count: counts.updates },
    ...(settings.resume_enabled ? [{ href: "/dashboard/resume", label: "resume", keys: "g r" }] : []),
    ...(settings.portfolio_enabled
      ? [{ href: "/dashboard/portfolio", label: "portfolio", keys: "g o", count: counts.unpublished }]
      : []),
    { href: "/dashboard/sync", label: "sync", keys: "g y", count: counts.sync },
    { href: "/dashboard/settings", label: "settings", keys: "g ," },
  ];
}

function statusItems(s: ShellStatus): StatusItem[] {
  const pending = s.counts.updates + s.counts.sync;
  return [
    { id: "ai", label: s.aiProvider ? `ai: ${s.aiProvider}` : "ai: not configured", tone: s.aiProvider ? "ok" : "warn" },
    { id: "saved", label: `profile saved ${ago(s.profileUpdatedAt)}` },
    { id: "pending", label: pending ? `${pending} pending` : "queue clear", tone: pending ? "warn" : "muted" },
    s.settings.portfolio_enabled
      ? s.counts.unpublished
        ? { id: "pub", label: `${s.counts.unpublished} unpublished`, tone: "warn" }
        : { id: "pub", label: `portfolio published ${ago(s.lastPublishedAt)}`, tone: s.lastPublishedAt ? "ok" : "muted" }
      : { id: "pub", label: "portfolio off", tone: "muted" },
  ];
}

/** Registers the g-prefixed navigation shortcuts. Must render inside <Providers>. */
function NavHotkeys({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const go = (href: string) => () => router.push(href);
  const find = (label: string) => items.find((i) => i.label === label);
  useHotkey("g p", go("/dashboard/profile"), { description: "Go to profile", group: "Navigation" });
  useHotkey("g u", go("/dashboard/updates"), { description: "Go to updates", group: "Navigation" });
  useHotkey("g r", go("/dashboard/resume"), { description: "Go to resume", group: "Navigation", enabled: !!find("resume") });
  useHotkey("g o", go("/dashboard/portfolio"), { description: "Go to portfolio", group: "Navigation", enabled: !!find("portfolio") });
  useHotkey("g y", go("/dashboard/sync"), { description: "Go to sync", group: "Navigation" });
  useHotkey("g ,", go("/dashboard/settings"), { description: "Go to settings", group: "Navigation" });
  return null;
}

export function AppShell({ status, children }: { status: ShellStatus; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = useMemo(() => navItems(status), [status]);

  const commands: Command[] = useMemo(
    () => [
      ...items.map((i) => ({ id: `go-${i.label}`, group: "go", label: i.label[0].toUpperCase() + i.label.slice(1), keys: i.keys, run: () => router.push(i.href) })),
      { id: "new-update", group: "updates", label: "Write an update", keywords: "note ai shipped", run: () => router.push("/dashboard/updates#note") },
      ...(status.settings.resume_enabled
        ? [{ id: "pdf", group: "resume", label: "Download resume PDF", keywords: "cv export", run: () => { window.open("/api/resume/pdf", "_self"); } }]
        : []),
      ...(status.settings.portfolio_enabled
        ? [{ id: "publish", group: "portfolio", label: "Review and publish portfolio", keywords: "sync push", run: () => router.push("/dashboard/portfolio") }]
        : []),
      { id: "scan", group: "sync", label: "Scan GitHub for new repos", run: () => router.push("/dashboard/sync#github") },
      { id: "theme", group: "app", label: "Toggle light / dark theme", run: () => applyTheme(readTheme() === "dark" ? "light" : "dark") },
      { id: "setup", group: "app", label: "Run first-time setup", run: () => router.push("/dashboard/welcome") },
      { id: "home", group: "app", label: "Open landing page", run: () => router.push("/") },
    ],
    [items, router, status.settings]
  );

  return (
    <Providers>
      <NavHotkeys items={items} />
      <div className="sf-texture h-dvh flex flex-col">
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <aside className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-line flex md:flex-col gap-4 md:gap-8 px-3 py-3 md:py-5 bg-bg/70 backdrop-blur">
            <Link href="/" className="font-mono text-[13px] font-medium px-2 shrink-0 self-center md:self-auto">
              syncfolio<span className="text-thread">_</span>
            </Link>
            <nav aria-label="App" className="flex md:flex-col font-mono text-[13px] overflow-x-auto">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-3 px-2 py-1.5 rounded-sm whitespace-nowrap",
                      active ? "bg-surface-2 text-ink shadow-[inset_2px_0_0_var(--sf-thread)]" : "text-muted hover:text-ink"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.count ? <span className="text-thread">[{item.count}]</span> : null}
                  </Link>
                );
              })}
            </nav>
            <div className="hidden md:flex mt-auto flex-col gap-3 px-2">
              <button
                type="button"
                onClick={openCommandPalette}
                className="flex items-center justify-between font-mono text-[11px] text-muted hover:text-ink"
              >
                <span>commands</span>
                <Kbd>⌘K</Kbd>
              </button>
              <div className="self-start"><ThemeToggle /></div>
              <form action="/auth/signout" method="post">
                <button type="submit" className="font-mono text-[11px] text-muted hover:text-del">
                  sign out
                </button>
              </form>
            </div>
          </aside>
          <main id="main" className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-5 md:px-10 py-8 md:py-10">{children}</div>
          </main>
        </div>
        <StatusBar
          items={statusItems(status)}
          right={
            <span className="hidden sm:flex items-center gap-1.5">
              <Kbd>?</Kbd> shortcuts
            </span>
          }
        />
      </div>
      <CommandPalette commands={commands} />
      <Grain />
    </Providers>
  );
}
