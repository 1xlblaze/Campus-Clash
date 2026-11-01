"use client";

import { useEffect, useState } from "react";

const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

type DiceRollProps = {
  rolling: boolean;
  value: number;
  onRoll: () => void;
  disabled?: boolean;
  label?: string;
};

export function DiceRoll({ rolling, value, onRoll, disabled, label = "Roll dice" }: DiceRollProps) {
  const [display, setDisplay] = useState(Math.min(6, Math.max(1, value)));

  useEffect(() => {
    if (!rolling) {
      setDisplay(value > 6 ? Math.min(12, value) : Math.min(6, Math.max(1, value)));
      return;
    }
    const tick = window.setInterval(() => setDisplay(1 + Math.floor(Math.random() * 6)), 80);
    return () => window.clearInterval(tick);
  }, [rolling, value]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`grid h-20 w-20 place-items-center rounded-2xl border-2 border-white/20 bg-gradient-to-br from-white to-zinc-200 text-5xl shadow-lg transition ${rolling ? "animate-pulse scale-105" : ""}`}
      >
        {value > 6 ? (
          <span className="text-3xl font-black text-ink">{Math.min(12, value)}</span>
        ) : (
          FACES[display - 1]
        )}
      </div>
      <button
        type="button"
        disabled={disabled || rolling}
        onClick={onRoll}
        className="rounded-2xl bg-lemon px-6 py-3 text-sm font-extrabold text-ink shadow-lg transition hover:scale-[1.02] disabled:opacity-50"
      >
        {rolling ? "Rolling…" : label}
      </button>
    </div>
  );
}
