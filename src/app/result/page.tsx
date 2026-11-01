"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Share2, Trophy } from "lucide-react";
import { getOrCreateGuestToken } from "@/lib/guest-session";

type ResultData = { score: number; total: number; game: string; verified: boolean; sessionId?: string };
type LeaderEntry = { displayName: string; score: number; completedAt?: string };

export default function ResultPage() {
  const [result, setResult] = useState<ResultData>({ score: 0, total: 10, game: "bollywood", verified: false });
  const [copied, setCopied] = useState(false);
  const [best, setBest] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const { score, total, game, verified, sessionId } = result;
  const percentage = total ? Math.round(score / (total * 100) * 100) : 0;
  const title = percentage >= 80 ? "Absolute legend!" : percentage >= 50 ? "Nice run!" : "Warm-up round!";

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const parsed = {
      score: Math.max(0, Number(query.get("score") ?? 0)),
      total: Math.max(1, Number(query.get("total") ?? 10)),
      game: query.get("game") === "trivia" ? "trivia" : "bollywood",
      verified: query.get("verified") === "1",
      sessionId: query.get("session") ?? undefined,
    } satisfies ResultData;
    setResult(parsed);
    const key = `cc-best-${parsed.game}${parsed.verified ? "-verified" : ""}`;
    const previous = Number(window.localStorage.getItem(key) ?? 0);
    if (parsed.score > previous) window.localStorage.setItem(key, String(parsed.score));
    setBest(Math.max(previous, parsed.score));

    fetch(`/api/leaderboard?game=${parsed.game}&limit=5`)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.entries ?? []))
      .catch(() => setLeaderboard([]));
  }, []);

  async function share() {
    let url = `${window.location.origin}/play/${game}?challenge=1`;
    const text = `I scored ${score} points on Campus Clash. Can you beat me?`;
    try {
      if (verified && sessionId) {
        const res = await fetch("/api/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, guestToken: getOrCreateGuestToken() }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          url = `${window.location.origin}/play/${game}?challenge=${data.token}`;
        }
      }
      if (navigator.share) await navigator.share({ title: "Campus Clash challenge", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <main className="min-h-screen glow-bg grid place-items-center px-5 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="text-sm text-white/45 hover:text-white">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Home
        </Link>
        <section className="mt-7 rounded-[2rem] border border-white/10 bg-panel p-7 text-center shadow-2xl sm:p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-lemon/10 text-4xl">🏆</div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-violet-200">ROUND COMPLETE</p>
          <h1 className="display mt-2 text-4xl font-bold">{title}</h1>
          {verified && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
              Verified score
            </p>
          )}
          <div className="mt-7">
            <div className="display text-6xl font-bold text-white">
              {score}
              <span className="text-2xl text-white/30">/{total * 100}</span>
            </div>
            <p className="mt-2 text-sm text-white/45">Your score</p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-2xl font-bold">{percentage}%</div>
              <div className="mt-1 text-xs text-white/40">Accuracy</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-2xl font-bold">{best}</div>
              <div className="mt-1 text-xs text-white/40">Personal best</div>
            </div>
          </div>
          <button
            onClick={() => void share()}
            className="mt-7 flex w-full items-center justify-center rounded-2xl bg-violet px-5 py-4 font-bold shadow-glow hover:bg-violet-500"
          >
            <Share2 className="mr-2 h-4 w-4" />
            {copied ? "Challenge copied!" : "Challenge a friend"}
          </button>
          <Link
            href={`/play/${game}`}
            className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold hover:bg-white/10"
          >
            Play again <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </section>

        {leaderboard.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-panel/80 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-violet-200">
              <Trophy className="h-4 w-4" /> Top verified scores
            </div>
            <ul className="space-y-2 text-sm">
              {leaderboard.map((entry, i) => (
                <li key={`${entry.displayName}-${i}`} className="flex justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span>
                    #{i + 1} {entry.displayName}
                  </span>
                  <span className="font-bold">{entry.score}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-5 text-center text-xs text-white/30">
          {verified
            ? "Score saved in Supabase with server-side validation."
            : "Demo result on this device only until Supabase env vars are set."}
        </p>
      </div>
    </main>
  );
}
