/** Classic 15×15 Ludo King–style layout (row, col). */

export const BOARD_SIZE = 15;

export type LudoColor = "red" | "green" | "yellow" | "blue";

export const COLORS: LudoColor[] = ["red", "green", "yellow", "blue"];

export const TURN_ORDER: LudoColor[] = ["red", "green", "yellow", "blue"];

/** Legacy online mapping */
export type Side = "you" | "cpu";

export const GLOBAL_TRACK: ReadonlyArray<readonly [number, number]> = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0],
];

export const TRACK_LEN = GLOBAL_TRACK.length;

export const SAFE_GLOBAL = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const TRACK_START: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const HOME_PATH: Record<LudoColor, ReadonlyArray<readonly [number, number]>> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 8], [7, 9], [7, 10], [7, 11], [7, 12], [7, 13]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

export const YARD: Record<LudoColor, ReadonlyArray<readonly [number, number]>> = {
  red: [[2, 2], [2, 3], [3, 2], [3, 3]],
  green: [[2, 11], [2, 12], [3, 11], [3, 12]],
  yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
  blue: [[11, 2], [11, 3], [12, 2], [12, 3]],
};

export const PLAYER_META: Record<
  LudoColor,
  { label: string; color: string; tokenClass: string; short: string }
> = {
  red: { label: "Red", short: "R", color: "#E53935", tokenClass: "bg-red-500 ring-red-200" },
  green: { label: "Green", short: "G", color: "#43A047", tokenClass: "bg-emerald-500 ring-emerald-200" },
  yellow: { label: "Yellow", short: "Y", color: "#FDD835", tokenClass: "bg-yellow-400 ring-yellow-100" },
  blue: { label: "Blue", short: "B", color: "#1E88E5", tokenClass: "bg-sky-500 ring-sky-200" },
};

export function colorFromSide(side: Side): LudoColor {
  return side === "you" ? "red" : "yellow";
}

export function globalTrackIndex(color: LudoColor, distance: number): number | null {
  if (distance < 0 || distance >= TRACK_LEN) return null;
  return (TRACK_START[color] + distance) % TRACK_LEN;
}

export function tokenCell(color: LudoColor, distance: number, tokenId: number): [number, number] | null {
  if (distance >= 58) return null;
  if (distance === -1) return [...YARD[color][tokenId]] as [number, number];
  if (distance < TRACK_LEN) {
    const g = globalTrackIndex(color, distance);
    if (g === null) return null;
    return [...GLOBAL_TRACK[g]] as [number, number];
  }
  const homeStep = distance - TRACK_LEN;
  if (homeStep >= HOME_PATH[color].length) return [7, 7];
  return [...HOME_PATH[color][homeStep]] as [number, number];
}

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

const PATH_SET = new Set(GLOBAL_TRACK.map(([r, c]) => cellKey(r, c)));
for (const color of COLORS) {
  for (const [r, c] of HOME_PATH[color]) PATH_SET.add(cellKey(r, c));
}

export function isPathCell(r: number, c: number) {
  return PATH_SET.has(cellKey(r, c));
}

export function isSafeCell(r: number, c: number) {
  for (let i = 0; i < GLOBAL_TRACK.length; i++) {
    if (!SAFE_GLOBAL.has(i)) continue;
    const [tr, tc] = GLOBAL_TRACK[i];
    if (tr === r && tc === c) return true;
  }
  return false;
}

export function quadrantHomeClass(r: number, c: number): string | null {
  if (r <= 5 && c <= 5) return "bg-gradient-to-br from-red-700/90 to-red-900";
  if (r <= 5 && c >= 9) return "bg-gradient-to-br from-emerald-600/80 to-emerald-900/90";
  if (r >= 9 && c >= 9) return "bg-gradient-to-br from-yellow-400/90 to-amber-600";
  if (r >= 9 && c <= 5) return "bg-gradient-to-br from-sky-500/80 to-blue-900/90";
  return null;
}

export function isCenterDice(r: number, c: number) {
  return r >= 6 && r <= 8 && c >= 6 && c <= 8;
}

export function tintedPathClass(r: number, c: number): string {
  if (r === 7 && c >= 1 && c <= 5) return "bg-red-400/85";
  if (r === 7 && c >= 8 && c <= 13) return "bg-yellow-300/90";
  if (c === 7 && r >= 1 && r <= 5) return "bg-emerald-400/75";
  if (c === 7 && r >= 8 && r <= 13) return "bg-sky-400/75";
  return "bg-amber-50/95";
}

export function activeColors(playerCount: 2 | 4): LudoColor[] {
  return playerCount === 2 ? ["red", "yellow"] : COLORS;
}
