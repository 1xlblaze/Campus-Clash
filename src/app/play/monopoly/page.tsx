"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { DiceRoll } from "@/components/board/DiceRoll";
import { PlayModeGate } from "@/components/board/PlayModeGate";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { getOrCreateGuestToken } from "@/lib/guest-session";
import type { PlayMode } from "@/lib/multiplayer/types";
import {
  BOARD,
  buyProperty,
  cpuShouldBuy,
  createMonopoly,
  labelSide,
  rollMove,
  sideToSeat,
  type MonopolyState,
} from "@/lib/monopoly/game";

export default function MonopolyPage() {
  const [screen, setScreen] = useState<"gate" | "play">("gate");
  const [mode, setMode] = useState<PlayMode>("cpu");
  const [onlineMeta, setOnlineMeta] = useState<{ roomCode: string; role: "host" | "guest" } | null>(null);
  const [game, setGame] = useState<MonopolyState>(createMonopoly);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(2);
  const [roomBanner, setRoomBanner] = useState<string | null>(null);

  const online = useOnlineRoom(onlineMeta?.roomCode ?? null, onlineMeta?.role ?? null);
  const mySeat = onlineMeta?.role === "guest" ? "p2" : onlineMeta?.role === "host" ? "p1" : null;

  useEffect(() => {
    if (mode === "online" && online?.remoteState) setGame(online.remoteState as MonopolyState);
  }, [mode, online?.remoteState]);

  const start = (m: PlayMode, o?: { roomCode: string; role: "host" | "guest" }) => {
    setMode(m);
    setOnlineMeta(o ?? null);
    const initial = createMonopoly();
    setGame(initial);
    setRoomBanner(o ? `Room ${o.roomCode.toUpperCase()}` : null);
    setScreen("play");
    if (m === "online" && o?.role === "host") {
      void fetch(`/api/rooms/${o.roomCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerToken: getOrCreateGuestToken(),
          state: initial,
          turnSeat: "p1",
          status: "playing",
        }),
      });
    }
  };

  const canRoll =
    !game.winner &&
    !rolling &&
    game.pendingBuy === null &&
    (mode === "local" ||
      (mode === "cpu" && game.turn === "you") ||
      (mode === "online" &&
        Boolean(online?.isMyTurn) &&
        ((onlineMeta?.role === "host" && game.turn === "you") ||
          (onlineMeta?.role === "guest" && game.turn === "cpu"))));

  const canBuy =
    game.pendingBuy !== null &&
    !game.winner &&
    (mode === "local" ||
      (mode === "cpu" && game.turn === "you") ||
      (mode === "online" &&
        Boolean(online?.isMyTurn) &&
        ((onlineMeta?.role === "host" && game.turn === "you") ||
          (onlineMeta?.role === "guest" && game.turn === "cpu"))));

  const syncOnline = (next: MonopolyState) => {
    if (mode === "online" && onlineMeta) {
      void online?.publish(next, sideToSeat(next.turn), next.winner ? "finished" : "playing");
    }
  };

  const roll = useCallback(() => {
    if (!canRoll) return;
    setRolling(true);
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    const total = a + b;
    window.setTimeout(() => {
      setDice(total);
      setGame((g) => {
        const next = rollMove(g, total);
        syncOnline(next);
        return next;
      });
      setRolling(false);
    }, 700);
  }, [canRoll, rolling, mode, online, onlineMeta]);

  useEffect(() => {
    if (mode !== "cpu" || game.winner || game.turn !== "cpu" || game.pendingBuy !== null || rolling) return;
    const t = window.setTimeout(() => roll(), 1000);
    return () => window.clearTimeout(t);
  }, [mode, game.turn, game.pendingBuy, game.winner, rolling, roll]);

  useEffect(() => {
    if (mode !== "cpu" || game.turn !== "cpu" || game.pendingBuy === null) return;
    const t = window.setTimeout(() => setGame((g) => buyProperty(g, cpuShouldBuy(g))), 600);
    return () => window.clearTimeout(t);
  }, [mode, game.turn, game.pendingBuy]);

  if (screen === "gate") {
    return (
      <main className="min-h-screen board-felt glow-bg grid place-items-center px-4 py-10">
        <Link href="/play" className="absolute left-5 top-6 text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Lobby
        </Link>
        <PlayModeGate gameType="monopoly" title="Campus Monopoly" initialState={createMonopoly()} onStart={start} />
      </main>
    );
  }

  return (
    <main className="min-h-screen board-felt glow-bg px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/play" className="text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Lobby
        </Link>
        <h1 className="display mt-4 text-3xl font-bold">Campus Monopoly</h1>
        {roomBanner && <p className="mt-1 font-mono text-xs text-cyan">{roomBanner}</p>}
        <p className="mt-2 text-sm text-white/55">{game.message}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-violet/30 bg-violet/10 p-3">
            <div className="text-xs text-white/45">{labelSide("you", mode, mySeat)}</div>
            <div className="text-xl font-bold">₹{game.you.cash}</div>
            <div className="text-xs text-white/50">{BOARD[game.you.pos].name}</div>
          </div>
          <div className="rounded-2xl border border-cyan/30 bg-cyan/10 p-3">
            <div className="text-xs text-white/45">{labelSide("cpu", mode, mySeat)}</div>
            <div className="text-xl font-bold">₹{game.cpu.cash}</div>
            <div className="text-xs text-white/50">{BOARD[game.cpu.pos].name}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {BOARD.map((c) => {
            const owner = game.owners[c.id];
            const here = game.you.pos === c.id || game.cpu.pos === c.id;
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-2 text-center text-[10px] ${here ? "border-lemon ring-2 ring-lemon/30" : "border-white/10"} bg-panel/80`}
                style={{ borderTopColor: c.color, borderTopWidth: 4 }}
              >
                <div className="text-base">{c.icon}</div>
                <div className="font-bold leading-tight">{c.name}</div>
                {c.kind === "property" && <div className="text-white/40">₹{c.price}</div>}
                {c.kind === "chance" && <div className="text-cyan-300">Draw</div>}
                {owner && (
                  <div className={`font-bold ${owner === "you" ? "text-violet-300" : "text-cyan-300"}`}>
                    {owner === "you" ? labelSide("you", mode, mySeat) : labelSide("cpu", mode, mySeat)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {game.pendingBuy !== null && canBuy && !game.winner && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setGame((g) => {
                  const next = buyProperty(g, true);
                  syncOnline(next);
                  return next;
                })
              }
              className="rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-ink"
            >
              Buy {BOARD[game.pendingBuy].name}
            </button>
            <button
              type="button"
              onClick={() =>
                setGame((g) => {
                  const next = buyProperty(g, false);
                  syncOnline(next);
                  return next;
                })
              }
              className="rounded-2xl border border-white/20 px-5 py-3 font-semibold"
            >
              Skip
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-2">
          {game.winner ? (
            <button type="button" onClick={() => setScreen("gate")} className="rounded-2xl bg-lemon px-8 py-3 font-extrabold text-ink">
              New deal
            </button>
          ) : (
            <>
              <p className="text-xs text-white/40">Two dice · Pass GO +₹200 · 🃏 Campus Cards</p>
              <DiceRoll
                rolling={rolling}
                value={Math.min(12, dice)}
                onRoll={roll}
                disabled={!canRoll}
                label="Roll & move"
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
