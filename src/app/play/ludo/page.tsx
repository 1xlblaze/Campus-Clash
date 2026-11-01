"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DiceRoll } from "@/components/board/DiceRoll";
import {
  applyLudoMove,
  cpuPickToken,
  createLudo,
  ludoRoll,
  trackPosition,
  type LudoState,
} from "@/lib/ludo/game";

export default function LudoPage() {
  const [game, setGame] = useState<LudoState>(createLudo);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);

  const doRoll = useCallback(() => {
    if (game.winner || rolling || game.turn !== "you" || !game.mustRoll) return;
    setRolling(true);
    const value = 1 + Math.floor(Math.random() * 6);
    window.setTimeout(() => {
      setDice(value);
      setGame((g) => ludoRoll(g, value));
      setRolling(false);
    }, 650);
  }, [game, rolling]);

  useEffect(() => {
    if (game.winner || game.turn !== "cpu" || !game.mustRoll || rolling) return;
    const t = window.setTimeout(() => {
      setRolling(true);
      const value = 1 + Math.floor(Math.random() * 6);
      window.setTimeout(() => {
        setDice(value);
        setGame((g) => {
          let next = ludoRoll(g, value);
          if (!next.mustRoll && next.turn === "cpu" && next.movesLeft === 0 && !next.winner) {
            const tid = cpuPickToken(next, value);
            next = applyLudoMove(next, tid, value);
          }
          return next;
        });
        setRolling(false);
      }, 650);
    }, 800);
    return () => window.clearTimeout(t);
  }, [game.turn, game.mustRoll, game.winner, rolling]);

  const pickToken = (id: number) => {
    if (game.turn !== "you" || game.mustRoll) return;
    setGame((g) => applyLudoMove(g, id, g.lastRoll));
  };

  return (
    <main className="min-h-screen board-felt glow-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        <Link href="/play" className="text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Games
        </Link>
        <h1 className="display mt-4 text-3xl font-bold">Ludo Rush</h1>
        <p className="mt-2 text-sm text-white/55">{game.message}</p>

        <div className="relative mx-auto mt-6 aspect-square max-w-sm rounded-3xl border-4 border-white/15 bg-gradient-to-br from-violet/30 to-cyan/20 p-3 shadow-2xl">
          <div className="absolute inset-3 grid grid-cols-7 grid-rows-7 gap-1 rounded-2xl bg-panel/90">
            {Array.from({ length: 49 }).map((_, i) => {
              const x = i % 7;
              const y = Math.floor(i / 7);
              const isPath =
                y === 0 || x === 6 || y === 6 || x === 0 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
              return (
                <div
                  key={i}
                  className={`rounded-md ${isPath ? "bg-white/10" : "bg-white/5"} relative flex items-center justify-center`}
                >
                  <BoardTokens game={game} x={x} y={y} />
                </div>
              );
            })}
          </div>
          <div className="absolute left-3 top-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] pointer-events-none">
            <YardTokens game={game} side="you" className="left-1 top-1" />
            <YardTokens game={game} side="cpu" className="right-1 bottom-1" />
          </div>
        </div>

        {!game.mustRoll && game.turn === "you" && !game.winner && (
          <div className="mt-4 flex justify-center gap-2">
            {game.you.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickToken(t.id)}
                className="rounded-xl bg-violet px-4 py-2 text-sm font-bold"
              >
                Move token {t.id + 1}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {game.winner ? (
            <button
              type="button"
              onClick={() => setGame(createLudo())}
              className="rounded-2xl bg-lemon px-8 py-3 font-extrabold text-ink"
            >
              Rematch
            </button>
          ) : (
            <DiceRoll
              rolling={rolling}
              value={dice}
              onRoll={doRoll}
              disabled={game.turn !== "you" || !game.mustRoll}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function BoardTokens({ game, x, y }: { game: LudoState; x: number; y: number }) {
  const all = [
    ...game.you.map((t) => ({ ...t, side: "you" as const, color: "#8066ED" })),
    ...game.cpu.map((t) => ({ ...t, side: "cpu" as const, color: "#18C6D4" })),
  ];
  return (
    <>
      {all.map((t) => {
        const pos = trackPosition(t.steps);
        if (!pos || pos.x !== x || pos.y !== y) return null;
        return (
          <span
            key={`${t.side}-${t.id}`}
            className="h-4 w-4 rounded-full border-2 border-white shadow-lg"
            style={{ background: t.color }}
          />
        );
      })}
    </>
  );
}

function YardTokens({
  game,
  side,
  className,
}: {
  game: LudoState;
  side: "you" | "cpu";
  className: string;
}) {
  const tokens = side === "you" ? game.you : game.cpu;
  const color = side === "you" ? "#8066ED" : "#18C6D4";
  const home = tokens.filter((t) => t.steps === -1);
  if (!home.length) return null;
  return (
    <div className={`absolute ${className} flex gap-1`}>
      {home.map((t) => (
        <span key={t.id} className="h-5 w-5 rounded-full border-2 border-white" style={{ background: color }} />
      ))}
    </div>
  );
}
