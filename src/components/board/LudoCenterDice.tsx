"use client";

import { useEffect, useState } from "react";

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const v = Math.min(6, Math.max(1, value));
  const dots = PIPS[v];

  return (
    <div
      className={`relative aspect-square w-[min(18vw,72px)] rounded-[14px] border border-white/90 bg-gradient-to-br from-white via-amber-50 to-amber-100 shadow-[inset_0_2px_8px_rgba(255,255,255,.9),0_10px_28px_rgba(0,0,0,.45)] transition-transform duration-300 ${
        rolling ? "animate-ludo-dice-tumble" : "hover:scale-[1.03]"
      }`}
    >
      <div className="absolute inset-[14%] grid grid-cols-3 grid-rows-3 gap-[2px]">
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const on = dots.some(([r, c]) => r === row && c === col);
          return (
            <div key={i} className="flex items-center justify-center">
              {on ? <span className="h-[70%] w-[70%] rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-inner" /> : null}
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-inset ring-white/60" />
    </div>
  );
}

type Props = {
  value: number;
  rolling: boolean;
  disabled: boolean;
  onRoll: () => void;
  activeColor?: string;
};

export function LudoCenterDice({ value, rolling, disabled, onRoll, activeColor = "#FFD166" }: Props) {
  const [display, setDisplay] = useState(Math.min(6, Math.max(1, value || 1)));

  useEffect(() => {
    if (!rolling) {
      setDisplay(Math.min(6, Math.max(1, value || 1)));
      return;
    }
    const tick = window.setInterval(() => setDisplay(1 + Math.floor(Math.random() * 6)), 70);
    return () => window.clearInterval(tick);
  }, [rolling, value]);

  return (
    <div
      className="pointer-events-auto absolute z-[8] overflow-hidden rounded-[1.1rem] border-2 border-amber-950/30 shadow-[0_0_0_3px_rgba(255,215,0,.12),0_12px_40px_rgba(0,0,0,.5)]"
      style={{
        top: "calc(3% + (100% - 6%) * 6 / 15)",
        left: "calc(3% + (100% - 6%) * 6 / 15)",
        width: "calc((100% - 6%) * 3 / 15)",
        height: "calc((100% - 6%) * 3 / 15)",
      }}
    >
      {/* Ludo King–style center pinwheel */}
      <div className="absolute inset-0 bg-amber-900/20">
        <div className="absolute left-0 top-0 h-1/2 w-1/2 bg-gradient-to-br from-red-500 to-red-700" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
        <div className="absolute right-0 top-0 h-1/2 w-1/2 bg-gradient-to-bl from-emerald-400 to-emerald-700" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)" }} />
        <div className="absolute bottom-0 right-0 h-1/2 w-1/2 bg-gradient-to-tl from-yellow-300 to-amber-500" style={{ clipPath: "polygon(100% 100%, 0 100%, 100% 0)" }} />
        <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-gradient-to-tr from-sky-400 to-blue-700" style={{ clipPath: "polygon(0 100%, 0 0, 100% 100%)" }} />
        <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-amber-100/95 to-amber-200/90 shadow-inner" />
      </div>

      <button
        type="button"
        disabled={disabled || rolling}
        onClick={onRoll}
        className={`relative flex h-full w-full flex-col items-center justify-center gap-0.5 transition disabled:cursor-not-allowed disabled:opacity-75 ${
          !disabled && !rolling ? "hover:brightness-105" : ""
        }`}
        style={{
          boxShadow: !disabled && !rolling ? `0 0 24px ${activeColor}55` : undefined,
        }}
      >
        <DiceFace value={display} rolling={rolling} />
        <span
          className={`mt-0.5 text-[8px] font-extrabold uppercase tracking-[0.2em] ${
            disabled ? "text-amber-950/40" : "text-amber-950/75"
          }`}
        >
          {rolling ? "Rolling…" : disabled ? "Hold" : "Roll"}
        </span>
      </button>
    </div>
  );
}
