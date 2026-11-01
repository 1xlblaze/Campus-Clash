"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DiceRoll } from "@/components/board/DiceRoll";
import {
  BOARD,
  buyProperty,
  cpuShouldBuy,
  createMonopoly,
  rollMove,
  type MonopolyState,
} from "@/lib/monopoly/game";

export default function MonopolyPage() {
  const [game, setGame] = useState<MonopolyState>(createMonopoly);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);

  const roll = useCallback(() => {
    if (game.winner || rolling || game.turn !== "you" || game.pendingBuy !== null) return;
    setRolling(true);
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    const total = a + b;
    window.setTimeout(() => {
      setDice(total);
      setGame((g) => rollMove(g, total));
      setRolling(false);
    }, 700);
  }, [game, rolling]);

  useEffect(() => {
    if (game.winner || game.turn !== "cpu" || game.pendingBuy !== null || rolling) return;
    if (game.pendingBuy === null && game.turn === "cpu") {
      const t = window.setTimeout(() => {
        setRolling(true);
        const total = 2 + Math.floor(Math.random() * 11);
        window.setTimeout(() => {
          setDice(total);
          setGame((g) => rollMove(g, total));
          setRolling(false);
        }, 700);
      }, 1000);
      return () => window.clearTimeout(t);
    }
  }, [game.turn, game.pendingBuy, game.winner, rolling]);

  useEffect(() => {
    if (game.turn !== "cpu" || game.pendingBuy === null) return;
    const t = window.setTimeout(() => {
      setGame((g) => buyProperty(g, cpuShouldBuy(g)));
    }, 600);
    return () => window.clearTimeout(t);
  }, [game.turn, game.pendingBuy]);

  const cell = BOARD[game.you.pos];

  return (
    <main className="min-h-screen board-felt glow-bg px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/play" className="text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Games
        </Link>
        <h1 className="display mt-4 text-3xl font-bold">Campus Monopoly</h1>
        <p className="mt-2 text-sm text-white/55">{game.message}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-violet/30 bg-violet/10 p-3">
            <div className="text-xs text-white/45">You</div>
            <div className="text-xl font-bold">₹{game.you.cash}</div>
            <div className="text-xs text-white/50">{BOARD[game.you.pos].name}</div>
          </div>
          <div className="rounded-2xl border border-cyan/30 bg-cyan/10 p-3">
            <div className="text-xs text-white/45">CPU Dean</div>
            <div className="text-xl font-bold">₹{game.cpu.cash}</div>
            <div className="text-xs text-white/50">{BOARD[game.cpu.pos].name}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-4">
          {BOARD.map((c) => {
            const owner = game.owners[c.id];
            const here = game.you.pos === c.id || game.cpu.pos === c.id;
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-2 text-center transition ${here ? "border-lemon ring-2 ring-lemon/40" : "border-white/10"} bg-panel/80`}
                style={{ borderTopColor: c.color, borderTopWidth: 4 }}
              >
                <div className="text-lg">{c.icon}</div>
                <div className="text-[10px] font-bold leading-tight">{c.name}</div>
                {c.price > 0 && <div className="text-[9px] text-white/40">₹{c.price}</div>}
                {owner && (
                  <div className={`text-[9px] font-bold ${owner === "you" ? "text-violet-300" : "text-cyan-300"}`}>
                    {owner === "you" ? "Yours" : "CPU"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {game.pendingBuy !== null && game.turn === "you" && !game.winner && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setGame((g) => buyProperty(g, true))}
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-ink"
            >
              Buy {BOARD[game.pendingBuy].name} (₹{BOARD[game.pendingBuy].price})
            </button>
            <button
              type="button"
              onClick={() => setGame((g) => buyProperty(g, false))}
              className="rounded-2xl border border-white/20 px-5 py-3 font-semibold"
            >
              Skip
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-2">
          {game.winner ? (
            <button
              type="button"
              onClick={() => setGame(createMonopoly())}
              className="rounded-2xl bg-lemon px-8 py-3 font-extrabold text-ink"
            >
              New empire
            </button>
          ) : (
            <>
              <p className="text-xs text-white/40">Two dice · {cell.icon} current tile</p>
              <DiceRoll
                rolling={rolling}
                value={Math.min(12, Math.max(2, dice))}
                onRoll={roll}
                disabled={game.turn !== "you" || game.pendingBuy !== null}
                label="Roll & move"
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
