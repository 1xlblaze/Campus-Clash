/** Cell index 1–100, boustrophedon from bottom-left (1) to top-left (100). */

export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

export const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78,
};

export function cellPosition(n: number): { row: number; col: number } {
  const row = 10 - Math.floor((n - 1) / 10);
  const idxInRow = (n - 1) % 10;
  const col = row % 2 === 0 ? idxInRow + 1 : 10 - idxInRow;
  return { row, col };
}

export function applySnakesLadders(pos: number): { next: number; kind?: "ladder" | "snake" } {
  if (LADDERS[pos]) return { next: LADDERS[pos], kind: "ladder" };
  if (SNAKES[pos]) return { next: SNAKES[pos], kind: "snake" };
  return { next: pos };
}

export type SnakesPlayer = { id: "you" | "rival"; name: string; pos: number; color: string };

export function snakesTurnSeat(turn: 0 | 1): "p1" | "p2" {
  return turn === 0 ? "p1" : "p2";
}

export function createSnakesGame(mode: "cpu" | "local" | "online" = "cpu") {
  return {
    players: [
      { id: "you" as const, name: mode === "local" ? "Player 1" : "You", pos: 0, color: "#8066ED" },
      { id: "rival" as const, name: mode === "local" ? "Player 2" : mode === "cpu" ? "CPU" : "Guest", pos: 0, color: "#18C6D4" },
    ],
    turn: 0 as 0 | 1,
    winner: null as null | "you" | "rival",
  };
}

export function moveSnakes(
  state: ReturnType<typeof createSnakesGame>,
  roll: number
): ReturnType<typeof createSnakesGame> & { event?: string; roll: number } {
  if (state.winner) return { ...state, roll };
  const p = state.players[state.turn];
  let next = Math.min(100, p.pos + roll);
  let event = `${p.name} rolled ${roll}`;
  if (next === 100) {
    const players = state.players.map((x, i) => (i === state.turn ? { ...x, pos: 100 } : x)) as SnakesPlayer[];
    return { ...state, players, winner: p.id, event: `${p.name} wins!`, roll };
  }
  const applied = applySnakesLadders(next);
  if (applied.kind === "ladder") event = `${p.name} hit a ladder 🪜 → ${applied.next}!`;
  if (applied.kind === "snake") event = `${p.name} slid down a snake 🐍 → ${applied.next}`;
  next = applied.next;
  const players = state.players.map((x, i) => (i === state.turn ? { ...x, pos: next } : x)) as SnakesPlayer[];
  const winner = next >= 100 ? p.id : null;
  return {
    players,
    turn: winner ? state.turn : ((state.turn ^ 1) as 0 | 1),
    winner,
    event,
    roll,
  };
}

/** Simple AI: always rolls (handled externally). */
