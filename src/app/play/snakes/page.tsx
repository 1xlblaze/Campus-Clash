"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Settings2 } from "lucide-react";
import { DiceRoll } from "@/components/board/DiceRoll";
import { PlayModeGate } from "@/components/board/PlayModeGate";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { getOrCreateGuestToken } from "@/lib/guest-session";
import type { PlayMode } from "@/lib/multiplayer/types";
import {
  cellPosition,
  createSnakesGame,
  LADDERS,
  moveSnakes,
  SNAKES,
  snakesTurnSeat,
  type SnakesPlayer,
} from "@/lib/snakes/game";

type SnakesState = ReturnType<typeof createSnakesGame>;

export default function SnakesPage() {
  const [screen, setScreen] = useState<"gate" | "play">("play");
  const [mode, setMode] = useState<PlayMode>("cpu");
  const [onlineMeta, setOnlineMeta] = useState<{ roomCode: string; role: "host" | "guest" } | null>(null);
  const [game, setGame] = useState<SnakesState>(() => createSnakesGame("cpu"));
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);
  const [roomBanner, setRoomBanner] = useState<string | null>(null);
  const modeRef = useRef(mode);
  const onlineMetaRef = useRef(onlineMeta);

  const online = useOnlineRoom(onlineMeta?.roomCode ?? null, onlineMeta?.role ?? null);

  useEffect(() => {
    modeRef.current = mode;
    onlineMetaRef.current = onlineMeta;
  }, [mode, onlineMeta]);

  useEffect(() => {
    if (mode !== "online" || online?.remoteState == null) return;
    setGame(online.remoteState as SnakesState);
  }, [mode, online?.remoteState]);

  const start = (m: PlayMode, o?: { roomCode: string; role: "host" | "guest" }) => {
    setMode(m);
    setOnlineMeta(o ?? null);
    const initial = createSnakesGame(m === "local" ? "local" : "cpu");
    setGame(initial);
    setRoomBanner(o ? `Room ${o.roomCode.toUpperCase()} — share with friend` : null);
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
    (mode === "local" ||
      (mode === "cpu" && game.turn === 0) ||
      (mode === "online" && Boolean(online?.isMyTurn)));

  const runRoll = useCallback((forCpu: boolean) => {
    if (game.winner || rolling) return;
    if (forCpu) {
      if (modeRef.current !== "cpu" || game.turn !== 1) return;
    } else if (!canRoll) {
      return;
    }

    setRolling(true);
    const value = 1 + Math.floor(Math.random() * 6);
    window.setTimeout(() => {
      setDice(value);
      setGame((g) => {
        const next = moveSnakes(g, value);
        if (modeRef.current === "online" && onlineMetaRef.current) {
          const seat = snakesTurnSeat(next.turn);
          void online?.publish(next, seat, next.winner ? "finished" : "playing");
        }
        return next;
      });
      setRolling(false);
    }, 650);
  }, [canRoll, game.turn, game.winner, online, rolling]);

  useEffect(() => {
    if (mode !== "cpu" || game.winner || game.turn !== 1 || rolling) return;
    const t = window.setTimeout(() => runRoll(true), 900);
    return () => window.clearTimeout(t);
  }, [mode, game.turn, game.winner, rolling, runRoll]);

  if (screen === "gate") {
    return (
      <main className="min-h-screen board-felt glow-bg grid place-items-center px-4 py-10">
        <Link href="/play" className="absolute left-5 top-6 text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Lobby
        </Link>
        <PlayModeGate gameType="snakes" title="Snakes & Ladders" initialState={createSnakesGame("cpu")} onStart={start} />
      </main>
    );
  }

  return (
    <main className="min-h-screen board-felt glow-bg px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <Link href="/play" className="text-sm text-white/50">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            Lobby
          </Link>
          <button type="button" onClick={() => setScreen("gate")} className="text-sm text-white/50">
            <Settings2 className="mr-1 inline h-4 w-4" />
            Modes
          </button>
        </div>
        <h1 className="display mt-4 text-3xl font-bold">Snakes & Ladders</h1>
        <p className="mt-1 text-xs text-white/40">
          {mode === "cpu" ? "Vs CPU" : mode === "local" ? "Pass & play" : "Online"} ·{" "}
          {game.players[game.turn].name}&apos;s turn
          {mode === "online" && !online?.isMyTurn ? " (waiting…)" : ""}
        </p>
        {roomBanner && <p className="mt-1 text-xs font-mono text-cyan">{roomBanner}</p>}

        <div className="mt-4 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3 text-center text-sm font-semibold text-violet-100">
          {game.winner ? `🎉 ${game.players.find((p) => p.id === game.winner)?.name} wins!` : `Dice: ${dice}`}
        </div>

        <div className="relative mx-auto mt-5 aspect-square w-full max-w-md rounded-3xl border-4 border-amber-900/40 bg-gradient-to-br from-amber-100/95 to-amber-200/90 p-2 shadow-2xl">
          <div className="grid h-full w-full grid-cols-10 grid-rows-10 gap-0.5">
            {Array.from({ length: 100 }, (_, i) => 100 - i).map((n) => {
              const { row, col } = cellPosition(n);
              const tokens = game.players.filter((p) => p.pos === n || (p.pos === 0 && n === 1));
              return (
                <div
                  key={n}
                  style={{ gridRow: row, gridColumn: col }}
                  className={`relative flex items-center justify-center rounded-sm text-[9px] font-bold text-amber-950/70 ${
                    LADDERS[n] ? "bg-emerald-300/80" : SNAKES[n] ? "bg-rose-300/80" : "bg-white/60"
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
          <div className="flex gap-4 text-sm">
            {game.players.map((p) => (
              <span key={p.id}>
                <span className="mr-1 inline-block h-3 w-3 rounded-full" style={{ background: p.color }} />
                {p.name}: <b>{p.pos}</b>
              </span>
            ))}
          </div>
          {!game.winner ? (
            <DiceRoll rolling={rolling} value={dice} onRoll={() => runRoll(false)} disabled={!canRoll} />
          ) : (
            <button type="button" onClick={() => start("cpu")} className="rounded-2xl bg-violet px-5 py-3 font-bold">
              Play again
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function TokenDot({ player }: { player: SnakesPlayer }) {
  return <span className="h-2.5 w-2.5 rounded-full border border-white shadow" style={{ backgroundColor: player.color }} />;
}
