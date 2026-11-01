"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DiceRoll } from "@/components/board/DiceRoll";
import {
  cellPosition,
  createSnakesGame,
  LADDERS,
  moveSnakes,
  SNAKES,
  type SnakesPlayer,
} from "@/lib/snakes/game";

export default function SnakesPage() {
  const [game, setGame] = useState(createSnakesGame);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);

  const roll = useCallback(() => {
    if (game.winner || rolling || game.turn !== 0) return;
    setRolling(true);
    const value = 1 + Math.floor(Math.random() * 6);
    window.setTimeout(() => {
      setDice(value);
      setGame((g) => moveSnakes(g, value));
      setRolling(false);
    }, 700);
  }, [game.turn, game.winner, rolling]);

  useEffect(() => {
    if (game.winner || game.turn !== 1 || rolling) return;
    const t = window.setTimeout(() => {
      setRolling(true);
      const value = 1 + Math.floor(Math.random() * 6);
      window.setTimeout(() => {
        setDice(value);
        setGame((g) => moveSnakes(g, value));
        setRolling(false);
      }, 700);
    }, 900);
    return () => window.clearTimeout(t);
  }, [game.turn, game.winner, rolling]);

  const reset = () => {
    setGame(createSnakesGame());
    setDice(1);
  };

  return (
    <main className="min-h-screen board-felt glow-bg px-4 py-6">
      <div className="mx-auto max-w-lg">
        <Link href="/play" className="text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Games
        </Link>
        <h1 className="display mt-4 text-3xl font-bold">Snakes & Ladders</h1>
        <p className="mt-1 text-sm text-white/50">{game.players[game.turn].name}&apos;s turn · First to 100 wins</p>

        <div className="mt-4 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3 text-center text-sm font-semibold text-violet-100">
          {game.winner ? `🎉 ${game.players.find((p) => p.id === game.winner)?.name} wins!` : `Last roll: ${dice}`}
        </div>

        <div className="relative mt-5 aspect-square w-full max-w-md mx-auto rounded-3xl border-4 border-amber-900/40 bg-gradient-to-br from-amber-100/95 to-amber-200/90 p-2 shadow-2xl">
          <div className="grid h-full w-full grid-cols-10 grid-rows-10 gap-0.5">
            {Array.from({ length: 100 }, (_, i) => 100 - i).map((n) => {
              const { row, col } = cellPosition(n);
              const isLadder = LADDERS[n];
              const isSnake = SNAKES[n];
              const tokens = game.players.filter((p) => p.pos === n || (p.pos === 0 && n === 1));
              return (
                <div
                  key={n}
                  style={{ gridRow: row, gridColumn: col }}
                  className={`relative flex items-center justify-center rounded-sm text-[9px] font-bold text-amber-950/70 ${
                    isLadder ? "bg-emerald-300/80" : isSnake ? "bg-rose-300/80" : "bg-white/60"
                  }`}
                >
                  {n}
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {tokens.map((t) => (
                      <TokenDot key={t.id} player={t} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            {game.players.map((p) => (
              <div key={p.id} className="text-sm">
                <span className="inline-block h-3 w-3 rounded-full mr-1" style={{ background: p.color }} />
                {p.name}: <b>{p.pos}</b>
              </div>
            ))}
          </div>
          {!game.winner ? (
            <DiceRoll rolling={rolling} value={dice} onRoll={roll} disabled={game.turn !== 0} />
          ) : (
            <button type="button" onClick={reset} className="rounded-2xl bg-violet px-5 py-3 font-bold">
              Play again
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function TokenDot({ player }: { player: SnakesPlayer }) {
  return (
    <span
      className="h-2.5 w-2.5 rounded-full border border-white shadow"
      style={{ backgroundColor: player.color }}
      title={player.name}
    />
  );
}
