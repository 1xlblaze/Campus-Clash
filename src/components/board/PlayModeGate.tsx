"use client";

import { useState } from "react";
import { Cpu, Users, Wifi } from "lucide-react";
import type { PlayMode } from "@/lib/multiplayer/types";
import { createOnlineRoom, joinOnlineRoom } from "@/hooks/useOnlineRoom";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  gameType: "ludo" | "snakes" | "monopoly";
  title: string;
  initialState: unknown;
  onStart: (mode: PlayMode, online?: { roomCode: string; role: "host" | "guest" }) => void;
};

export function PlayModeGate({ gameType, title, initialState, onStart }: Props) {
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function hostOnline() {
    if (!isSupabaseConfigured()) {
      setErr("Online needs Supabase env vars on the server.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const room = await createOnlineRoom(gameType, initialState);
      onStart("online", { roomCode: room.roomCode, role: "host" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setBusy(false);
    }
  }

  async function joinOnline() {
    if (!joinCode.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await joinOnlineRoom(joinCode.trim());
      onStart("online", { roomCode: joinCode.trim().toUpperCase(), role: "guest" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-panel/90 p-8 text-center shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-200">How do you play?</p>
      <h2 className="display mt-3 text-3xl font-bold">{title}</h2>
      <div className="mt-8 grid gap-3">
        <button
          type="button"
          onClick={() => onStart("cpu")}
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10"
        >
          <Cpu className="h-8 w-8 text-cyan" />
          <div>
            <div className="font-bold">Vs CPU</div>
            <div className="text-sm text-white/45">Solo — smart rival</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onStart("local")}
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10"
        >
          <Users className="h-8 w-8 text-lemon" />
          <div>
            <div className="font-bold">Pass & play</div>
            <div className="text-sm text-white/45">Two humans, one screen</div>
          </div>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void hostOnline()}
          className="flex items-center gap-4 rounded-2xl border border-violet/40 bg-violet/15 px-5 py-4 text-left hover:bg-violet/25 disabled:opacity-50"
        >
          <Wifi className="h-8 w-8 text-violet-300" />
          <div>
            <div className="font-bold">Online — host room</div>
            <div className="text-sm text-white/45">Share a 6-letter code</div>
          </div>
        </button>
      </div>
      <div className="mt-6 flex gap-2">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Room code"
          maxLength={6}
          className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-center font-mono tracking-widest"
        />
        <button
          type="button"
          disabled={busy || joinCode.length < 4}
          onClick={() => void joinOnline()}
          className="shrink-0 rounded-xl bg-cyan px-4 py-3 font-bold text-ink disabled:opacity-50"
        >
          Join
        </button>
      </div>
      {err && <p className="mt-4 text-sm text-rose-300">{err}</p>}
    </div>
  );
}
