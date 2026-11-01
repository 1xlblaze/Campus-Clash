"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Settings2 } from "lucide-react";
import { LudoKingBoard } from "@/components/board/LudoKingBoard";
import { PlayModeGate } from "@/components/board/PlayModeGate";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { getOrCreateGuestToken } from "@/lib/guest-session";
import type { PlayMode } from "@/lib/multiplayer/types";
import {
  applyLudoMove,
  createLudo,
  ludoRoll,
  ludoTurnSeat,
  type LudoState,
} from "@/lib/ludo/game";

export default function LudoPage() {
  const [screen, setScreen] = useState<"gate" | "play">("play");
  const [mode, setMode] = useState<PlayMode>("cpu");
  const [onlineMeta, setOnlineMeta] = useState<{ roomCode: string; role: "host" | "guest" } | null>(null);
  const [game, setGame] = useState<LudoState>(createLudo);
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
    if (mode === "online" && online?.remoteState != null) setGame(online.remoteState as LudoState);
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

  const isYourTurn =
    mode === "local" ||
    (mode === "cpu" && game.turn === "you") ||
    (mode === "online" &&
      Boolean(online?.isMyTurn) &&
      ((onlineMeta?.role === "host" && game.turn === "you") ||
        (onlineMeta?.role === "guest" && game.turn === "cpu")));

  const canRoll = !game.winner && !rolling && game.mustRoll && !game.pickToken && isYourTurn;

  const syncOnline = useCallback(
    (next: LudoState) => {
      if (modeRef.current === "online" && onlineMetaRef.current) {
        void online?.publish(next, ludoTurnSeat(next.turn), next.winner ? "finished" : "playing");
      }
    },
    [online]
  );

  const doRoll = useCallback(
    (forCpu = false) => {
      if (rolling || game.winner) return;
      if (forCpu) {
        if (modeRef.current !== "cpu" || game.turn !== "cpu" || !game.mustRoll || game.pickToken) return;
      } else if (!canRoll) return;

      setRolling(true);
      const value = 1 + Math.floor(Math.random() * 6);
      window.setTimeout(() => {
        setDice(value);
        setGame((g) => {
          const next = ludoRoll(g, value);
          syncOnline(next);
          return next;
        });
        setRolling(false);
      }, 650);
    },
    [canRoll, game.mustRoll, game.pickToken, game.turn, game.winner, rolling, syncOnline]
  );

  useEffect(() => {
    if (mode !== "cpu" || game.winner || game.turn !== "cpu" || !game.mustRoll || game.pickToken || rolling) return;
    const t = window.setTimeout(() => doRoll(true), 900);
    return () => window.clearTimeout(t);
  }, [mode, game.turn, game.mustRoll, game.pickToken, game.winner, rolling, doRoll]);

  const pickToken = (id: number) => {
    if (!game.pickToken || !isYourTurn) return;
    setGame((g) => {
      const next = applyLudoMove(g, id, g.lastRoll);
      syncOnline(next);
      return next;
    });
  };

  const youLabel = mode === "local" ? "Player 1 (Red)" : mode === "cpu" ? "You (Red)" : onlineMeta?.role === "guest" ? "Host (Red)" : "You (Red)";
  const cpuLabel = mode === "local" ? "Player 2 (Yellow)" : mode === "cpu" ? "CPU (Yellow)" : onlineMeta?.role === "guest" ? "You (Yellow)" : "Guest (Yellow)";
  const turnLabel = game.turn === "you" ? youLabel.split(" (")[0] : cpuLabel.split(" (")[0];

  if (screen === "gate") {
    return (
      <main className="min-h-screen board-felt glow-bg grid place-items-center px-4 py-10">
        <Link href="/play" className="absolute left-5 top-6 text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Lobby
        </Link>
        <PlayModeGate gameType="ludo" title="Ludo King" initialState={createLudo()} onStart={start} />
      </main>
    );
  }

  return (
    <main className="min-h-screen board-felt glow-bg px-3 py-5">
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
        <h1 className="display mt-3 text-center text-2xl font-bold">Ludo King</h1>
        <p className="mt-1 text-center text-xs text-white/45">
          {mode === "cpu" ? "Vs CPU" : mode === "local" ? "Pass & play" : "Online"} · 4 tokens · classic board
        </p>
        {roomBanner && <p className="mt-1 text-center font-mono text-xs text-cyan">{roomBanner}</p>}
        <p className="mt-2 text-center text-sm text-violet-100">{game.message}</p>
        <p className="text-center text-xs text-white/40">{turnLabel}&apos;s turn</p>

        <div className="mt-4">
          <LudoKingBoard
            game={game}
            dice={dice}
            rolling={rolling}
            onRoll={() => doRoll(false)}
            rollDisabled={!canRoll}
            onPickToken={pickToken}
            pickEnabled={game.pickToken && isYourTurn}
            youLabel={youLabel}
            cpuLabel={cpuLabel}
          />
        </div>

        {game.winner && (
          <div className="mt-6 flex justify-center">
            <button type="button" onClick={() => start("cpu")} className="rounded-2xl bg-lemon px-8 py-3 font-extrabold text-ink">
              Play again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
