"use client";

import { LudoCenterDice } from "@/components/board/LudoCenterDice";
import {
  BOARD_SIZE,
  COLORS,
  isCenterDice,
  isPathCell,
  isSafeCell,
  PLAYER_META,
  quadrantHomeClass,
  tintedPathClass,
  tokenCell,
  type LudoColor,
} from "@/lib/ludo/geometry";
import type { LudoState } from "@/lib/ludo/game";
import { displayName, movableTokenIds } from "@/lib/ludo/game";

type Props = {
  game: LudoState;
  dice: number;
  rolling: boolean;
  onRoll: () => void;
  rollDisabled: boolean;
  onPickToken: (id: number) => void;
  pickEnabled: boolean;
};

export function LudoKingBoard({
  game,
  dice,
  rolling,
  onRoll,
  rollDisabled,
  onPickToken,
  pickEnabled,
}: Props) {
  const highlight = game.pickToken ? new Set(movableTokenIds(game, game.lastRoll)) : new Set<number>();
  const active = new Set(game.order);
  const turnColor = PLAYER_META[game.turn].color;

  const tokens: { color: LudoColor; id: number; r: number; c: number }[] = [];
  for (const color of COLORS) {
    if (!active.has(color)) continue;
    game.tokens[color].forEach((t) => {
      const cell = tokenCell(color, t.distance, t.id);
      if (!cell) return;
      tokens.push({ color, id: t.id, r: cell[0], c: cell[1] });
    });
  }

  const byCell = new Map<string, typeof tokens>();
  for (const t of tokens) {
    const k = `${t.r},${t.c}`;
    const arr = byCell.get(k) ?? [];
    arr.push(t);
    byCell.set(k, arr);
  }

  return (
    <div className="mx-auto w-full max-w-[min(100vw-2rem,440px)]">
      <div
        className="ludo-board-shell relative aspect-square w-full overflow-hidden rounded-[1.25rem] border-[5px] border-amber-700/80"
        style={{
          background: "linear-gradient(145deg, #1e5c34 0%, #0f3d22 50%, #0a2818 100%)",
        }}
      >
        <div
          className="absolute inset-[3%] grid gap-[1px] rounded-xl bg-black/25 p-[3px] shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
            const r = Math.floor(i / BOARD_SIZE);
            const c = i % BOARD_SIZE;
            const home = quadrantHomeClass(r, c);
            const path = isPathCell(r, c);
            const center = isCenterDice(r, c);
            const safe = isSafeCell(r, c);
            let bg = home ?? (path ? tintedPathClass(r, c) : "bg-emerald-950/50");
            if (center) bg = "bg-transparent";

            return (
              <div
                key={i}
                className={`relative ${bg} ${safe && path ? "shadow-[inset_0_0_0_1px_rgba(251,191,36,.45)]" : ""} ${path ? "shadow-[inset_0_1px_0_rgba(255,255,255,.25)]" : ""}`}
              >
                {safe && path && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] text-amber-700 drop-shadow-sm">
                    ★
                  </span>
                )}
                {byCell.get(`${r},${c}`)?.map((t, idx) => {
                  const meta = PLAYER_META[t.color];
                  const isTurn = game.turn === t.color;
                  const canTap = pickEnabled && isTurn && highlight.has(t.id);
                  return (
                    <button
                      key={`${t.color}-${t.id}`}
                      type="button"
                      disabled={!canTap}
                      onClick={() => canTap && onPickToken(t.id)}
                      className={`absolute z-[12] h-[44%] w-[44%] rounded-full border-2 border-white shadow-[0_3px_8px_rgba(0,0,0,.35)] transition-transform ${meta.tokenClass} ${
                        canTap ? "z-20 scale-110 animate-pulse ring-4 ring-lemon ring-offset-1 ring-offset-transparent" : ""
                      } ${isTurn && !game.winner ? "ring-2 ring-white/90" : ""}`}
                      style={{
                        left: `${6 + (idx % 2) * 40}%`,
                        top: `${6 + Math.floor(idx / 2) * 40}%`,
                        background: meta.color,
                      }}
                      aria-label={`${displayName(game, t.color)} token ${t.id + 1}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <LudoCenterDice
          value={dice}
          rolling={rolling}
          disabled={rollDisabled}
          onRoll={onRoll}
          activeColor={turnColor}
        />
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] font-semibold">
        {game.order.map((c) => (
          <span
            key={c}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              game.turn === c
                ? "border-lemon/40 bg-lemon/15 text-white shadow-[0_0_12px_rgba(255,209,102,.2)]"
                : "border-transparent text-white/45"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: PLAYER_META[c].color }} />
            {displayName(game, c)}
          </span>
        ))}
      </div>
    </div>
  );
}
