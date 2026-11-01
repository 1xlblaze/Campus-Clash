"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/ludo/sounds";
import { ludoStats } from "@/lib/ludo/stats";

type Props = {
  roomCode?: string | null;
};

export function LudoHud({ roomCode }: Props) {
  const [sound, setSound] = useState(true);
  const [stats, setStats] = useState({ wins: 0, games: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSound(isSoundEnabled());
    setStats(ludoStats());
  }, []);

  const shareUrl =
    typeof window !== "undefined"
      ? roomCode
        ? `${window.location.origin}/play/ludo?join=${roomCode}`
        : `${window.location.origin}/play/ludo`
      : "";

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  }

  function copyLink() {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function whatsappShare() {
    const text = roomCode
      ? `Ludo on Campus Clash — room ${roomCode}. Join: ${shareUrl}`
      : `Play Ludo King-style on Campus Clash (free, no download): ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
      <button
        type="button"
        onClick={toggleSound}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold"
      >
        {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        Sound
      </button>
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-white/60">
        Wins {stats.wins} / {stats.games} games
      </span>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={whatsappShare}
        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-200"
      >
        <Share2 className="h-3.5 w-3.5" />
        WhatsApp
      </button>
    </div>
  );
}
