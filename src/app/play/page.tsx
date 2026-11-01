import Link from "next/link";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { boardGames } from "@/lib/board-games";

export default function PlayPage() {
  return (
    <main className="min-h-screen glow-bg">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Link href="/" className="text-sm text-white/55">
          <ArrowLeft className="mr-2 inline h-4 w-4" />
          Home
        </Link>
        <p className="mt-12 text-xs font-bold uppercase tracking-[.2em] text-lemon">GAME LOBBY</p>
        <h1 className="display mt-3 text-4xl font-bold">Which board are you taking over?</h1>
        <p className="mt-3 text-white/55">Tap a game — dice ready, no login.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boardGames.map((g) => (
            <Link
              key={g.id}
              href={g.href}
              className={`game-card rounded-3xl bg-gradient-to-br ${g.gradient} p-6 transition hover:-translate-y-1`}
            >
              <div className="text-5xl">{g.icon}</div>
              <h2 className="display mt-5 text-2xl font-bold">{g.title}</h2>
              <p className="mt-2 text-sm text-white/50">{g.subtitle}</p>
              <div className="mt-6 flex justify-between text-sm">
                <span className="flex items-center gap-2 text-white/40">
                  <Users className="h-4 w-4" />
                  {g.players}
                </span>
                <span className="font-bold text-lemon">
                  Play <ArrowRight className="ml-1 inline h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
