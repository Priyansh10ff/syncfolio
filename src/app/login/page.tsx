"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function sendLink() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard/profile` },
    });
    if (!error) setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="font-display text-2xl">Sign in to Loom</h1>
        {sent ? (
          <p className="text-sm text-[var(--loom-muted)]">
            Check {email} for a sign-in link.
          </p>
        ) : (
          <>
            <input
              type="email"
              className="border border-[var(--loom-line)] rounded px-3 py-2 text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={sendLink}
              className="bg-[var(--loom-thread)] text-white rounded px-3 py-2 text-sm"
            >
              Send magic link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
