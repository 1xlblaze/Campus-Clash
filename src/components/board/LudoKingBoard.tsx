"use client";

import { DiceRoll } from "@/components/board/DiceRoll";
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
    <div className="mx-auto w-full max-w-[min(100vw-2rem,420px)]">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl border-4 border-amber-900/60 shadow-2xl"
        style={{ background: "#1a472a" }}
      >
        <div
          className="absolute inset-[3%] grid gap-[1px] rounded-xl bg-amber-950/40 p-[2px]"
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
            let bg = home ?? (path ? tintedPathClass(r, c) : "bg-emerald-900/40");
            if (center) bg = "bg-amber-100/95";

            return (
              <div key={i} className={`relative ${bg} ${safe && path ? "ring-1 ring-inset ring-amber-400/80" : ""}`}>
                {safe && path && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[7px] text-amber-800/90">
                    ★
                  </span>
                )}
                {center && r === 7 && c === 7 && (
                  <div className="absolute inset-0 z-10 flex scale-[2.1] items-center justify-center">
                    <DiceRoll rolling={rolling} value={dice} onRoll={onRoll} disabled={rollDisabled} label="Roll" />
                  </div>
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
                      className={`absolute h-[42%] w-[42%] rounded-full border-2 border-white/90 shadow-md ring-2 transition-transform ${meta.tokenClass} ${
                        canTap ? "z-20 scale-110 animate-pulse ring-4 ring-lemon" : "z-[5]"
                      } ${isTurn && !game.winner ? "ring-offset-1 ring-offset-lemon/40" : ""}`}
                      style={{
                        left: `${8 + (idx % 2) * 38}%`,
                        top: `${8 + Math.floor(idx / 2) * 38}%`,
                      }}
                      aria-label={`${displayName(game, t.color)} token ${t.id + 1}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] font-semibold">
        {game.order.map((c) => (
          <span
            key={c}
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 ${
              game.turn === c ? "bg-white/15 text-white" : "text-white/45"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PLAYER_META[c].color }} />
            {displayName(game, c)}
          </span>
        ))}
      </div>
    </div>
  );
}
