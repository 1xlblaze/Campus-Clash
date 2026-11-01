"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Settings2 } from "lucide-react";
import { LudoHud } from "@/components/board/LudoHud";
import { LudoKingBoard } from "@/components/board/LudoKingBoard";
import { LudoModeGate } from "@/components/board/LudoModeGate";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { getOrCreateGuestToken } from "@/lib/guest-session";
import {
  applyLudoMove,
  cpuPickToken,
  createLudo,
  turnPhrase,
  isBotTurn,
  isHumanTurn,
  ludoRoll,
  ludoTurnSeat,
  type LudoSetup,
  type LudoState,
} from "@/lib/ludo/game";
import { ludoSounds } from "@/lib/ludo/sounds";
import { recordLudoGame, recordLudoWin } from "@/lib/ludo/stats";

function LudoPageInner() {
  const params = useSearchParams();
  const [screen, setScreen] = useState<"gate" | "play">("play");
  const [setup, setSetup] = useState<LudoSetup>("quick2");
  const [onlineMeta, setOnlineMeta] = useState<{ roomCode: string; role: "host" | "guest" } | null>(null);
  const [game, setGame] = useState<LudoState>(() => createLudo("quick2"));
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState(1);
  const setupRef = useRef(setup);
  const onlineMetaRef = useRef(onlineMeta);
  const winRecorded = useRef(false);

  const online = useOnlineRoom(onlineMeta?.roomCode ?? null, onlineMeta?.role ?? null);

  useEffect(() => {
    setupRef.current = setup;
    onlineMetaRef.current = onlineMeta;
  }, [setup, onlineMeta]);

  useEffect(() => {
    const join = params.get("join");
    if (join && join.length >= 4) setScreen("gate");
  }, [params]);

  useEffect(() => {
    if (setup !== "online2" || online?.remoteState == null) return;
    setGame(online.remoteState as LudoState);
  }, [setup, online?.remoteState]);

  const start = (s: LudoSetup, o?: { roomCode: string; role: "host" | "guest" }) => {
    setSetup(s);
    setOnlineMeta(o ?? null);
    let initial = createLudo(s);
    if (s === "online2" && o?.role === "guest") {
      initial = { ...initial, humanColors: ["yellow"] };
    }
    setGame(initial);
    winRecorded.current = false;
    recordLudoGame();
    setScreen("play");
    if (s === "online2" && o?.role === "host") {
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

  const canRoll = !game.winner && !rolling && game.mustRoll && !game.pickToken && isHumanTurn(game);

  const syncOnline = useCallback(
    (next: LudoState) => {
      if (setupRef.current === "online2" && onlineMetaRef.current) {
        void online?.publish(next, ludoTurnSeat(next.turn), next.winner ? "finished" : "playing");
      }
    },
    [online]
  );

  const doRoll = useCallback(
    (bot = false) => {
      if (rolling || game.winner) return;
      if (bot) {
        if (!isBotTurn(game) || !game.mustRoll || game.pickToken) return;
      } else if (!canRoll) return;

      setRolling(true);
      const value = 1 + Math.floor(Math.random() * 6);
      ludoSounds.roll();
      if (value === 6) window.setTimeout(() => ludoSounds.six(), 200);

      window.setTimeout(() => {
        setDice(value);
        setGame((g) => {
          const next = ludoRoll(g, value);
          if (next.message.includes("Capture")) ludoSounds.capture();
          else if (!next.pickToken) ludoSounds.move();
          syncOnline(next);
          return next;
        });
        setRolling(false);
      }, 650);
    },
    [canRoll, game, rolling, syncOnline]
  );

  useEffect(() => {
    if (game.winner) {
      if (!winRecorded.current && game.humanColors.includes(game.winner)) {
        recordLudoWin();
        ludoSounds.win();
      }
      winRecorded.current = true;
      return;
    }
    if (!isBotTurn(game) || rolling) return;
    if (game.pickToken) {
      const t = window.setTimeout(() => {
        setGame((g) => {
          const next = applyLudoMove(g, cpuPickToken(g, g.lastRoll), g.lastRoll);
          syncOnline(next);
          return next;
        });
      }, 500);
      return () => window.clearTimeout(t);
    }
    if (!game.mustRoll) return;
    const t = window.setTimeout(() => doRoll(true), game.playerCount === 4 ? 700 : 900);
    return () => window.clearTimeout(t);
  }, [game, rolling, doRoll, syncOnline]);

  const pickToken = (id: number) => {
    if (!game.pickToken || !isHumanTurn(game)) return;
    setGame((g) => {
      const next = applyLudoMove(g, id, g.lastRoll);
      if (next.message.includes("Capture")) ludoSounds.capture();
      else ludoSounds.move();
      syncOnline(next);
      return next;
    });
  };

  if (screen === "gate") {
    return (
      <main className="min-h-screen board-felt glow-bg grid place-items-center px-4 py-10">
        <Link href="/play" className="absolute left-5 top-6 text-sm text-white/50">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Lobby
        </Link>
        <LudoModeGate onStart={start} />
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
        <h1 className="display mt-3 text-center text-2xl font-bold">Campus Ludo King</h1>
        <p className="mt-1 text-center text-xs text-white/45">
          {game.playerCount === 4 ? "4-player table" : "2-player"} · {turnPhrase(game, game.turn)}
        </p>
        <p className="mt-2 text-center text-sm text-violet-100">{game.message}</p>

        <LudoHud roomCode={onlineMeta?.roomCode} />

        <div className="mt-4">
          <LudoKingBoard
            game={game}
            dice={dice}
            rolling={rolling}
            onRoll={() => doRoll(false)}
            rollDisabled={!canRoll}
            onPickToken={pickToken}
            pickEnabled={game.pickToken && isHumanTurn(game)}
          />
        </div>

        {game.winner && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-lg font-bold text-lemon">{game.message}</p>
            <button type="button" onClick={() => start(setup)} className="rounded-2xl bg-lemon px-8 py-3 font-extrabold text-ink">
              Rematch
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LudoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen board-felt glow-bg" />}>
      <LudoPageInner />
    </Suspense>
  );
}
