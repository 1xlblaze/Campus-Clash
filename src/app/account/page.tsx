"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getOrCreateGuestToken } from "@/lib/guest-session";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "sign-in" | "sign-up";

export default function AccountPage() {
  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseReady) return;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabaseReady]);

  async function linkGuestPlay() {
    const guestToken = getOrCreateGuestToken();
    const res = await fetch("/api/auth/link-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestToken }),
    });
    const data = await res.json();
    if (res.ok && typeof data.linkedSessions === "number" && data.linkedSessions > 0) {
      setMessage(`Linked ${data.linkedSessions} guest round(s) to your account.`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseReady) return;
    setBusy(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });
        if (error) throw error;
        setMessage("Check your email to confirm, or sign in if confirmation is disabled.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await linkGuestPlay();
        setMessage("Signed in. Guest scores on this device were linked when possible.");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabaseReady) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMessage("Signed out.");
  }

  return (
    <main className="min-h-screen glow-bg px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-white/45 hover:text-white">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Home
        </Link>
        <h1 className="display mt-6 text-3xl font-bold">Your account</h1>
        <p className="mt-2 text-sm text-white/55">
          Play as a guest first. Sign in anytime to save verified scores and show up on leaderboards with your
          display name.
        </p>

        {!supabaseReady && (
          <p className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Add Supabase env vars to enable accounts. Demo play still works without signing in.
          </p>
        )}

        {supabaseReady && userEmail && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-panel p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-200">Signed in</p>
            <p className="mt-2 font-semibold">{userEmail}</p>
            {userId && <p className="mt-1 text-xs text-white/35">ID {userId.slice(0, 8)}…</p>}
            <button
              type="button"
              onClick={() => void linkGuestPlay()}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Link guest rounds on this device
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 w-full rounded-2xl bg-violet py-3 text-sm font-bold hover:bg-violet-500"
            >
              Sign out
            </button>
          </section>
        )}

        {supabaseReady && !userEmail && (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-panel p-6">
            <div className="flex gap-2 rounded-2xl bg-white/5 p-1 text-sm">
              <button
                type="button"
                className={`flex-1 rounded-xl py-2 font-semibold ${mode === "sign-in" ? "bg-violet text-white" : "text-white/60"}`}
                onClick={() => setMode("sign-in")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl py-2 font-semibold ${mode === "sign-up" ? "bg-violet text-white" : "text-white/60"}`}
                onClick={() => setMode("sign-up")}
              >
                Sign up
              </button>
            </div>
            {mode === "sign-up" && (
              <label className="block text-sm">
                <span className="text-white/50">Display name</span>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2.5 outline-none focus:border-violet"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={40}
                  placeholder="Campus legend"
                />
              </label>
            )}
            <label className="block text-sm">
              <span className="text-white/50">Email</span>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2.5 outline-none focus:border-violet"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/50">Password</span>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink px-3 py-2.5 outline-none focus:border-violet"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center rounded-2xl bg-violet py-3.5 font-bold hover:bg-violet-500 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "sign-up" ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-center text-sm text-white/65">{message}</p>}
      </div>
    </main>
  );
}
