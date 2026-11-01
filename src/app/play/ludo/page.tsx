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
  applyLudoMove,
  cpuPickToken,
  createLudo,
  ludoRoll,
  ludoTurnSeat,
  trackPosition,
  type LudoState,
} from "@/lib/ludo/game";

export default function LudoPage() {
  const [screen, setScreen] = useState<"gate" | "play">("gate");
  const [mode, setMode] = useState<PlayMode>("cpu");
  const [onlineMeta, setOnlineMeta] = useState<{ roomCode: string; role: "host" | "guest" } | null>(null);
  const [game, setGame] = useState<LudoState>(createLudo);
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);
  const [roomBanner, setRoomBanner] = useState<string | null>(null);

  const online = useOnlineRoom(onlineMeta?.roomCode ?? null, onlineMeta?.role ?? null);

  useEffect(() => {
    if (mode === "online" && online?.remoteState) setGame(online.remoteState as LudoState);
  }, [mode, online?.remoteState]);

  const start = (m: PlayMode, o?: { roomCode: string; role: "host" | "guest" }) => {
    setMode(m);
    setOnlineMeta(o ?? null);
    const initial = createLudo();
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
    game.mustRoll &&
    (mode === "local" ||
      (mode === "cpu" && game.turn === "you") ||
      (mode === "online" && Boolean(online?.isMyTurn)));

  const canPick =
    !game.mustRoll &&
    !game.winner &&
    (mode === "local" ||
      (mode === "cpu" && game.turn === "you") ||
      (mode === "online" && Boolean(online?.isMyTurn)));

  const syncOnline = (next: LudoState) => {
    if (mode === "online" && onlineMeta) {
      void online?.publish(next, ludoTurnSeat(next.turn), next.winner ? "finished" : "playing");
    }
  };

  const doRoll = useCallback(() => {
    if (!canRoll) return;
    setRolling(true);
    const value = 1 + Math.floor(Math.random() * 6);
    window.setTimeout(() => {
      setDice(value);
      setGame((g) => {
        let next = ludoRoll(g, value);
        if (mode === "cpu" && next.turn === "cpu" && !next.mustRoll && !next.winner) {
          const tid = cpuPickToken(next, value);
          next = applyLudoMove(next, tid, value);
        }
        syncOnline(next);
        return next;
      });
      setRolling(false);
    }, 650);
  }, [canRoll, mode, online, onlineMeta]);

  useEffect(() => {
    if (mode !== "cpu" || game.winner || game.turn !== "cpu" || !game.mustRoll || rolling) return;
    const t = window.setTimeout(() => {
      setRolling(true);
      const value = 1 + Math.floor(Math.random() * 6);
      window.setTimeout(() => {
        setDice(value);
        setGame((g) => {
          let next = ludoRoll(g, value);
          if (!next.mustRoll && next.turn === "cpu" && !next.winner) {
            next = applyLudoMove(next, cpuPickToken(next, value), value);
          }
          return next;
        });
        setRolling(false);
      }, 650);
    }, 800);
    return () => window.clearTimeout(t);
  }, [mode, game, rolling]);

  const pickToken = (id: number) => {
    if (!canPick) return;
    setGame((g) => {
      const next = applyLudoMove(g, id, g.lastRoll);
      syncOnline(next);
      return next;
    });
  };

  const p1Label = mode === "local" ? "Player 1" : mode === "cpu" ? "You" : onlineMeta?.role === "guest" ? "Host" : "You";
  const p2Label = mode === "local" ? "Player 2" : mode === "cpu" ? "CPU" : onlineMeta?.role === "guest" ? "You" : "Guest";

  if (screen === "gate") {
    return (
      <main className="min-h-screen board-felt glow-bg grid place-items-center px-4 py-10">
        <Link href="/play" className="absolute left-5 top-6 text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Lobby
        </Link>
        <PlayModeGate gameType="ludo" title="Ludo Rush" initialState={createLudo()} onStart={start} />
      </main>
    );
  }

  return (
    <main className="min-h-screen board-felt glow-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        <Link href="/play" className="text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Lobby
        </Link>
        <h1 className="display mt-4 text-3xl font-bold">Ludo Rush</h1>
        {roomBanner && <p className="mt-1 font-mono text-xs text-cyan">{roomBanner}</p>}
        <p className="mt-2 text-sm text-white/55">
          {game.turn === "you" ? p1Label : p2Label}&apos;s turn · {game.message}
        </p>

        <div className="relative mx-auto mt-6 aspect-square max-w-sm rounded-3xl border-4 border-white/15 bg-gradient-to-br from-violet/30 to-cyan/20 p-3 shadow-2xl">
          <div className="absolute inset-3 grid grid-cols-7 grid-rows-7 gap-1 rounded-2xl bg-panel/90">
            {Array.from({ length: 49 }).map((_, i) => {
              const x = i % 7;
              const y = Math.floor(i / 7);
              const isPath = y === 0 || x === 6 || y === 6 || x === 0 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
              return (
                <div key={i} className={`relative rounded-md ${isPath ? "bg-white/10" : "bg-white/5"}`}>
                  <BoardTokens game={game} x={x} y={y} />
                </div>
              );
            })}
          </div>
          <YardTokens game={game} side="you" className="left-4 top-4" color="#8066ED" />
          <YardTokens game={game} side="cpu" className="right-4 bottom-4" color="#18C6D4" />
        </div>

        {!game.mustRoll && canPick && (
          <div className="mt-4 flex justify-center gap-2">
            {(game.turn === "you" ? game.you : game.cpu).map((t) => (
              <button key={t.id} type="button" onClick={() => pickToken(t.id)} className="rounded-xl bg-violet px-4 py-2 text-sm font-bold">
                Move {t.id + 1}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {game.winner ? (
            <button type="button" onClick={() => setScreen("gate")} className="rounded-2xl bg-lemon px-8 py-3 font-extrabold text-ink">
              Rematch
            </button>
          ) : (
            <DiceRoll rolling={rolling} value={dice} onRoll={doRoll} disabled={!canRoll} />
          )}
        </div>
      </div>
    </main>
  );
}

function BoardTokens({ game, x, y }: { game: LudoState; x: number; y: number }) {
  const all = [
    ...game.you.map((t) => ({ ...t, color: "#8066ED" })),
    ...game.cpu.map((t) => ({ ...t, color: "#18C6D4" })),
  ];
  return (
    <>
      {all.map((t, idx) => {
        const pos = trackPosition(t.steps);
        if (!pos || pos.x !== x || pos.y !== y) return null;
        return <span key={idx} className="absolute inset-1 m-auto h-4 w-4 rounded-full border-2 border-white" style={{ background: t.color }} />;
      })}
    </>
  );
}

function YardTokens({
  game,
  side,
  className,
  color,
}: {
  game: LudoState;
  side: "you" | "cpu";
  className: string;
  color: string;
}) {
  const tokens = (side === "you" ? game.you : game.cpu).filter((t) => t.steps === -1);
  if (!tokens.length) return null;
  return (
    <div className={`absolute ${className} flex gap-1`}>
      {tokens.map((t) => (
        <span key={t.id} className="h-5 w-5 rounded-full border-2 border-white" style={{ background: color }} />
      ))}
    </div>
  );
}
