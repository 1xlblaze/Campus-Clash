/** Classic 15×15 Ludo King–style layout (row, col). */

export const BOARD_SIZE = 15;

/** 52 shared outer track cells, clockwise from red start. */
export const GLOBAL_TRACK: ReadonlyArray<readonly [number, number]> = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],
  [14, 7],
  [14, 6],
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],
  [7, 0],
  [6, 0],
  [5, 0],
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 0],
];

export const TRACK_LEN = GLOBAL_TRACK.length; // 52

export const SAFE_GLOBAL = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export type Side = "you" | "cpu";

/** Red vs Yellow (Ludo King 2-player diagonal). */
export const TRACK_START: Record<Side, number> = { you: 0, cpu: 26 };

export const HOME_PATH: Record<Side, ReadonlyArray<readonly [number, number]>> = {
  you: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
  cpu: [
    [7, 8],
    [7, 9],
    [7, 10],
    [7, 11],
    [7, 12],
    [7, 13],
  ],
};

export const YARD: Record<Side, ReadonlyArray<readonly [number, number]>> = {
  you: [
    [2, 2],
    [2, 3],
    [3, 2],
    [3, 3],
  ],
  cpu: [
    [11, 11],
    [11, 12],
    [12, 11],
    [12, 12],
  ],
};

export const PLAYER_META: Record<
  Side,
  { label: string; color: string; homeClass: string; tokenClass: string }
> = {
  you: {
    label: "Red",
    color: "#E53935",
    homeClass: "bg-gradient-to-br from-red-600 to-red-800",
    tokenClass: "bg-red-500 ring-red-200",
  },
  cpu: {
    label: "Yellow",
    color: "#FDD835",
    homeClass: "bg-gradient-to-br from-yellow-400 to-amber-500",
    tokenClass: "bg-yellow-400 ring-yellow-100",
  },
};

export function globalTrackIndex(side: Side, distance: number): number | null {
  if (distance < 0 || distance >= TRACK_LEN) return null;
  return (TRACK_START[side] + distance) % TRACK_LEN;
}

export function tokenCell(side: Side, distance: number, tokenId: number): [number, number] | null {
  if (distance >= 58) return null;
  if (distance === -1) return [...YARD[side][tokenId]] as [number, number];
  if (distance < TRACK_LEN) {
    const g = globalTrackIndex(side, distance);
    if (g === null) return null;
    const c = GLOBAL_TRACK[g];
    return [c[0], c[1]];
  }
  const homeStep = distance - TRACK_LEN;
  if (homeStep >= HOME_PATH[side].length) return [7, 7];
  return [...HOME_PATH[side][homeStep]] as [number, number];
}

export function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

const PATH_SET = new Set(GLOBAL_TRACK.map(([r, c]) => cellKey(r, c)));
for (const side of ["you", "cpu"] as Side[]) {
  for (const [r, c] of HOME_PATH[side]) PATH_SET.add(cellKey(r, c));
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
