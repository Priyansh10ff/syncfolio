"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Grain } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const RESEND_AFTER = 45;

/** Single mono prompt for an email; shows where the link went and a resend timer. */
export default function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const address = (sentTo ?? email).trim();
    if (!address) return;
    setSending(true);
    setError(null);
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const { error } = await createClient().auth.signInWithOtp({ email: address, options: { emailRedirectTo: callback.toString() } });
    setSending(false);
    if (error) return setError(error.message);
    setSentTo(address);
    setWait(RESEND_AFTER);
  }

  return (
    <div className="sf-texture min-h-dvh flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="font-mono text-[13px] font-medium">
          syncfolio<span className="text-thread">_</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md flex flex-col gap-6">
          <h1 className="font-mono text-2xl font-medium tracking-tight">{sentTo ? "check your inbox" : "sign in"}</h1>
          {sentTo ? (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-muted">
                A sign-in link is on its way to <span className="font-mono text-ink">{sentTo}</span>. Open it on this device.
              </p>
              <div className="flex items-center gap-4 font-mono text-[12px]">
                <Button size="sm" onClick={() => send()} disabled={wait > 0} loading={sending}>
                  {wait > 0 ? `resend in ${wait}s` : "resend link"}
                </Button>
                <button type="button" className="text-muted hover:text-ink" onClick={() => { setSentTo(null); setWait(0); }}>
                  use a different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={send} className="flex flex-col gap-3">
              <label htmlFor="email" className="font-mono text-label uppercase text-muted">email</label>
              <div className="flex items-center gap-3 border border-line-strong focus-within:border-thread rounded-sm bg-surface px-4 h-12 transition-colors">
                <span aria-hidden className="font-mono text-thread">›</span>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 bg-transparent outline-none font-mono text-[15px] caret-thread"
                />
              </div>
              <Button type="submit" variant="primary" loading={sending} shortcut="↵" className="h-10">
                send magic link
              </Button>
              <p className="font-mono text-[11px] text-muted">No password. New here? The same link creates your account.</p>
            </form>
          )}
          {error && <p role="alert" className="font-mono text-xs text-del">{error}</p>}
        </div>
      </main>
      <Grain />
    </div>
  );
}
