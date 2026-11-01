import {
  globalTrackIndex,
  HOME_PATH,
  SAFE_GLOBAL,
  TRACK_LEN,
  TRACK_START,
  type Side,
} from "./geometry";

export type LudoToken = { id: number; distance: number }; // -1 yard, 0–57 path, 58 finished

export type LudoState = {
  you: LudoToken[];
  cpu: LudoToken[];
  turn: Side;
  lastRoll: number;
  message: string;
  winner: Side | null;
  mustRoll: boolean;
  pickToken: boolean;
};

const FINISH = TRACK_LEN + HOME_PATH.you.length; // 58

export function createLudo(): LudoState {
  const yard = () => [0, 1, 2, 3].map((id) => ({ id, distance: -1 }));
  return {
    you: yard(),
    cpu: yard(),
    turn: "you",
    lastRoll: 0,
    message: "Roll the dice — need a 6 to open a token.",
    winner: null,
    mustRoll: true,
    pickToken: false,
  };
}

function allFinished(tokens: LudoToken[]) {
  return tokens.every((t) => t.distance >= FINISH);
}

export function isFinished(t: LudoToken) {
  return t.distance >= FINISH;
}

function canMoveToken(token: LudoToken, roll: number): boolean {
  if (isFinished(token)) return false;
  if (token.distance === -1) return roll === 6;
  return token.distance + roll <= FINISH;
}

function applyCapture(state: LudoState, mover: Side, movedToken: LudoToken): LudoState {
  if (movedToken.distance < 0 || movedToken.distance >= TRACK_LEN) return state;
  const g = globalTrackIndex(mover, movedToken.distance);
  if (g === null || SAFE_GLOBAL.has(g)) return state;

  const opp: Side = mover === "you" ? "cpu" : "you";
  const oppTokens = state[opp].map((t) => ({ ...t }));
  let captured = false;
  for (const t of oppTokens) {
    if (t.distance < 0 || t.distance >= TRACK_LEN) continue;
    const og = globalTrackIndex(opp, t.distance);
    if (og === g) {
      t.distance = -1;
      captured = true;
    }
  }
  if (!captured) return state;
  return { ...state, [opp]: oppTokens, message: "Capture! Token sent to yard." };
}

export function ludoRoll(state: LudoState, roll: number): LudoState {
  if (state.winner || !state.mustRoll || state.pickToken) return state;
  const side = state.turn;
  const tokens = side === "you" ? state.you : state.cpu;
  const movable = tokens.filter((t) => canMoveToken(t, roll));
  const who = side === "you" ? "You" : "CPU";

  if (movable.length === 0) {
    const msg =
      roll === 6
        ? `${who} rolled 6 — no move. Roll again.`
        : `${who} rolled ${roll} — no legal move.`;
    if (roll === 6) {
      return { ...state, lastRoll: roll, message: msg, mustRoll: true, turn: side };
    }
    return {
      ...state,
      lastRoll: roll,
      message: msg,
      turn: side === "you" ? "cpu" : "you",
      mustRoll: true,
      pickToken: false,
    };
  }

  if (movable.length > 1 && side === "you") {
    return {
      ...state,
      lastRoll: roll,
      message: `You rolled ${roll} — tap a token to move.`,
      mustRoll: false,
      pickToken: true,
    };
  }

  const id = side === "cpu" ? cpuPickToken(state, roll) : movable[0].id;
  return applyLudoMove(state, id, roll);
}

export function applyLudoMove(state: LudoState, tokenId: number, roll: number): LudoState {
  const side = state.turn;
  const key = side;
  const tokens = state[key].map((t) => ({ ...t }));
  const t = tokens.find((x) => x.id === tokenId);
  if (!t || !canMoveToken(t, roll)) return state;

  if (t.distance === -1) t.distance = 0;
  else t.distance += roll;

  let next: LudoState = {
    ...state,
    [key]: tokens,
    lastRoll: roll,
    message: roll === 6 && t.distance === 0 ? "Token is out! Roll again." : `Moved ${roll} steps.`,
    pickToken: false,
    mustRoll: roll === 6,
    turn: roll === 6 ? side : side === "you" ? "cpu" : "you",
  };

  next = applyCapture(next, side, t);

  if (allFinished(tokens)) {
    return {
      ...next,
      winner: side,
      message: side === "you" ? "You win! All tokens home." : "CPU wins!",
      mustRoll: false,
      pickToken: false,
    };
  }

  return next;
}

export function cpuPickToken(state: LudoState, roll: number): number {
  const movable = state.cpu.filter((t) => canMoveToken(t, roll));
  if (!movable.length) return 0;

  const score = (t: LudoToken) => {
    let s = 0;
    const nd = t.distance === -1 ? 0 : t.distance + roll;
    if (t.distance === -1) s += 5;
    if (nd >= FINISH) s += 100;
    if (nd >= TRACK_LEN) s += 40;
    if (nd >= 0 && nd < TRACK_LEN) {
      const g = globalTrackIndex("cpu", nd);
      if (g !== null && !SAFE_GLOBAL.has(g)) {
        for (const o of state.you) {
          if (o.distance < 0 || o.distance >= TRACK_LEN) continue;
          if (globalTrackIndex("you", o.distance) === g) s += 60;
        }
      }
    }
    return s + nd;
  };

  return movable.sort((a, b) => score(b) - score(a))[0].id;
}

export function ludoTurnSeat(turn: Side): "p1" | "p2" {
  return turn === "you" ? "p1" : "p2";
}

export function movableTokenIds(state: LudoState, roll: number): number[] {
  const tokens = state.turn === "you" ? state.you : state.cpu;
  return tokens.filter((t) => canMoveToken(t, roll)).map((t) => t.id);
}
