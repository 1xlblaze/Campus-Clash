"use client";

import { useState, type ReactNode } from "react";
import { Cpu, Share2, Users, Volume2, VolumeX, Wifi } from "lucide-react";
import { createOnlineRoom, joinOnlineRoom } from "@/hooks/useOnlineRoom";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createLudo, type LudoSetup } from "@/lib/ludo/game";

type Props = {
  onStart: (
    setup: LudoSetup,
    online?: { roomCode: string; role: "host" | "guest" }
  ) => void;
};

export function LudoModeGate({ onStart }: Props) {
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function hostOnline() {
    if (!isSupabaseConfigured()) {
      setErr("Online needs Supabase on the server.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const room = await createOnlineRoom("ludo", createLudo("online2"));
      onStart("online2", { roomCode: room.roomCode, role: "host" });
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
      onStart("online2", { roomCode: joinCode.trim().toUpperCase(), role: "guest" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-panel/90 p-8 shadow-2xl">
      <p className="text-center text-xs font-bold uppercase tracking-[.2em] text-violet-200">Ludo King modes</p>
      <h2 className="display mt-3 text-center text-3xl font-bold">Pick your table</h2>
      <div className="mt-8 grid gap-3">
        <ModeBtn
          icon={<Cpu className="h-8 w-8 text-cyan" />}
          title="Quick 2P vs CPU"
          sub="Red vs Yellow — instant match"
          onClick={() => onStart("quick2")}
        />
        <ModeBtn
          icon={<Users className="h-8 w-8 text-lemon" />}
          title="4 players — pass & play"
          sub="One phone, four friends, full board"
          onClick={() => onStart("local4")}
        />
        <ModeBtn
          icon={<Users className="h-8 w-8 text-violet-300" />}
          title="4 players — you vs 3 CPU"
          sub="Full Ludo King table solo"
          onClick={() => onStart("cpu4")}
        />
        <ModeBtn
          icon={<Wifi className="h-8 w-8 text-emerald-300" />}
          title="Online 2P — host room"
          sub="Share code on WhatsApp"
          disabled={busy}
          onClick={() => void hostOnline()}
        />
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
      {err && <p className="mt-4 text-center text-sm text-rose-300">{err}</p>}
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
        <Share2 className="h-3.5 w-3.5" />
        Tip: share your campus link — no app download
      </p>
    </div>
  );
}

function ModeBtn({
  icon,
  title,
  sub,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left hover:bg-white/10 disabled:opacity-50"
    >
      {icon}
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm text-white/45">{sub}</div>
      </div>
    </button>
  );
}
