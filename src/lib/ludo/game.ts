export type LudoToken = { id: number; steps: number }; // steps on track, -1 = yard, 100+ = finished

export type LudoState = {
  you: LudoToken[];
  cpu: LudoToken[];
  turn: "you" | "cpu";
  lastRoll: number;
  message: string;
  winner: null | "you" | "cpu";
  mustRoll: boolean;
  movesLeft: number;
};

const TRACK = 28;

export function createLudo(): LudoState {
  return {
    you: [
      { id: 0, steps: -1 },
      { id: 1, steps: -1 },
    ],
    cpu: [
      { id: 0, steps: -1 },
      { id: 1, steps: -1 },
    ],
    turn: "you",
    lastRoll: 0,
    message: "Roll a 6 to bring a token out!",
    winner: null,
    mustRoll: true,
    movesLeft: 0,
  };
}

function finished(tokens: LudoToken[]) {
  return tokens.every((t) => t.steps >= TRACK + 4);
}

function canMove(token: LudoToken, roll: number): boolean {
  if (token.steps >= TRACK + 4) return false;
  if (token.steps === -1) return roll === 6;
  return token.steps + roll <= TRACK + 4;
}

export function ludoRoll(state: LudoState, roll: number): LudoState {
  if (state.winner || !state.mustRoll) return state;
  const side = state.turn;
  const tokens = side === "you" ? [...state.you] : [...state.cpu];
  const movable = tokens.filter((t) => canMove(t, roll));
  let message = `${side === "you" ? "You" : "CPU"} rolled ${roll}.`;
  let mustRoll = false;
  let movesLeft = 0;

  if (movable.length === 0) {
    message += roll === 6 ? " No move — roll again." : " No legal move.";
    if (roll === 6 && side === "you") {
      return { ...state, lastRoll: roll, message, mustRoll: true, turn: "you" };
    }
    return {
      ...state,
      lastRoll: roll,
      message,
      turn: side === "you" ? "cpu" : "you",
      mustRoll: true,
    };
  }

  if (side === "you" && movable.length > 1) {
    return {
      ...state,
      lastRoll: roll,
      message: "Pick a token to move.",
      mustRoll: false,
      movesLeft: roll,
    };
  }

  const token = movable[0];
  return applyLudoMove(state, token.id, roll);
}

export function applyLudoMove(state: LudoState, tokenId: number, roll: number): LudoState {
  const side = state.turn;
  const key = side === "you" ? "you" : "cpu";
  const oppKey = side === "you" ? "cpu" : "you";
  const tokens = state[key].map((t) => ({ ...t }));
  const opp = state[oppKey].map((t) => ({ ...t }));
  const t = tokens.find((x) => x.id === tokenId);
  if (!t || !canMove(t, roll)) return state;

  if (t.steps === -1) t.steps = 0;
  else t.steps += roll;

  let message = `Token moved ${roll}!`;
  const land = t.steps;
  if (land < TRACK) {
    const captured = opp.find((o) => o.steps === land && o.steps >= 0);
    if (captured) {
      captured.steps = -1;
      message = "Capture! Rival sent home.";
    }
  }

  const next: LudoState = {
    ...state,
    [key]: tokens,
    [oppKey]: opp,
    lastRoll: roll,
    message,
    mustRoll: roll === 6,
    turn: roll === 6 ? side : side === "you" ? "cpu" : "you",
    movesLeft: 0,
  } as LudoState;

  if (finished(tokens)) {
    return { ...next, winner: side, message: `${side === "you" ? "You" : "CPU"} wins the race!`, mustRoll: false };
  }
  return next;
}

export function cpuPickToken(state: LudoState, roll: number): number {
  const movable = state.cpu.filter((t) => canMove(t, roll));
  const onTrack = movable.filter((t) => t.steps >= 0);
  if (onTrack.length) return onTrack[0].id;
  return movable[0]?.id ?? 0;
}

export function trackPosition(steps: number): { x: number; y: number } | null {
  if (steps < 0 || steps >= TRACK) return null;
  const perSide = 7;
  if (steps < perSide) return { x: steps, y: 0 };
  if (steps < perSide * 2) return { x: 6, y: steps - perSide + 1 };
  if (steps < perSide * 3) return { x: 6 - (steps - perSide * 2), y: 6 };
  return { x: 0, y: 6 - (steps - perSide * 3) };
}

export { TRACK };

export function ludoTurnSeat(turn: "you" | "cpu"): "p1" | "p2" {
  return turn === "you" ? "p1" : "p2";
}
