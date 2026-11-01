"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Dice5, GraduationCap, Trophy, Users } from "lucide-react";
import { boardGames } from "@/lib/board-games";

export default function HomePage() {
  return (
    <main className="min-h-screen glow-bg">
      <div className="mx-auto max-w-6xl px-5 pb-16">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet shadow-glow text-xl">🎲</span>
            <span className="display text-xl font-bold">
              campus<span className="text-violet-300">clash</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            <a href="#games" className="hover:text-white">
              Board games
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <Link href="/account" className="hover:text-white">
              Account
            </Link>
          </nav>
          <Link
            href="/play"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Play now <ArrowUpRight className="ml-1 inline h-4 w-4" />
          </Link>
        </header>

        <section className="grid items-center gap-10 py-14 md:grid-cols-[1.05fr_.95fr] md:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lemon/30 bg-lemon/10 px-3 py-1.5 text-xs font-semibold text-lemon">
              <Dice5 className="h-3.5 w-3.5" /> LUDO · SNAKES · MONOPOLY
            </div>
            <h1 className="display max-w-2xl text-5xl font-bold leading-[1.04] sm:text-6xl md:text-7xl">
              Board games.
              <br />
              <span className="bg-gradient-to-r from-lemon via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                Campus energy.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/60 sm:text-lg">
              Real classics — not another quiz app. Roll dice, buy property, climb ladders, and talk smack with
              friends. No signup wall.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/play/ludo"
                className="rounded-2xl bg-violet px-6 py-3.5 font-bold shadow-glow transition hover:-translate-y-0.5 hover:bg-violet-500"
              >
                Start with Ludo <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="/play"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold hover:bg-white/10"
              >
                All games
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-6 text-xs text-white/45">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan" /> You vs CPU or pass & play
              </span>
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-lemon" /> Instant rematch
              </span>
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-violet-300" /> Campus Monopoly included
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-full bg-lemon/15 blur-3xl" />
            <div className="relative grid gap-3">
              {boardGames.map((g, i) => (
                <Link
                  key={g.id}
                  href={g.href}
                  className={`game-card flex items-center gap-4 rounded-3xl bg-gradient-to-r ${g.gradient} p-5 transition hover:-translate-y-0.5`}
                  style={{ transform: `rotate(${i === 1 ? -1 : i === 2 ? 1 : 0}deg)` }}
                >
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-black/20 text-4xl">
                    {g.icon}
                  </span>
                  <div>
                    <h3 className="display text-xl font-bold">{g.title}</h3>
                    <p className="text-sm text-white/55">{g.subtitle}</p>
                  </div>
                  <ArrowUpRight className="ml-auto h-5 w-5 text-white/40" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="games" className="scroll-mt-8 py-10">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan">THE LINEUP</p>
          <h2 className="display mt-2 text-3xl font-bold sm:text-4xl">Pick a table. Own the night.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {boardGames.map((g) => (
              <Link
                key={g.id}
                href={g.href}
                className={`game-card group rounded-3xl bg-gradient-to-br ${g.gradient} p-6 transition hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-5xl">{g.icon}</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{g.tag}</span>
                </div>
                <h3 className="display mt-6 text-2xl font-bold">{g.title}</h3>
                <p className="mt-2 text-sm text-white/55">{g.subtitle}</p>
                <p className="mt-4 text-xs font-semibold text-violet-200">{g.players}</p>
                <span className="mt-6 inline-flex items-center text-sm font-bold text-lemon group-hover:gap-2">
                  Play <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="how" className="py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-200">SIMPLE AS CHAI</p>
            <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">Open. Roll. Rival.</h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              { e: "🎲", t: "Choose a game", d: "Ludo, Snakes & Ladders, or Campus Monopoly — all tuned for mobile." },
              { e: "⚔️", t: "Beat the CPU", d: "Smart-enough rivals so solo sessions still feel alive." },
              { e: "🔁", t: "Instant rematch", d: "One tap to run it back. Bring a friend on the same screen later." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border border-white/10 bg-panel/70 p-6">
                <span className="text-3xl">{x.e}</span>
                <h3 className="mt-6 text-lg font-bold">{x.t}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row">
          <span>© {new Date().getFullYear()} Campus Clash</span>
          <span>Board games beat boring quizzes. Every time.</span>
        </footer>
      </div>
    </main>
  );
}
