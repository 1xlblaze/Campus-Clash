import {
  globalTrackIndex,
  HOME_PATH,
  PLAYER_META,
  SAFE_GLOBAL,
  TURN_ORDER,
  TRACK_LEN,
  type LudoColor,
} from "./geometry";

export type LudoSetup = "quick2" | "local4" | "cpu4" | "online2";

export type LudoToken = { id: number; distance: number };

export type LudoState = {
  setup: LudoSetup;
  playerCount: 2 | 4;
  order: LudoColor[];
  humanColors: LudoColor[];
  tokens: Record<LudoColor, LudoToken[]>;
  turn: LudoColor;
  lastRoll: number;
  message: string;
  winner: LudoColor | null;
  mustRoll: boolean;
  pickToken: boolean;
  streak: number;
};

const FINISH = TRACK_LEN + HOME_PATH.red.length;

function yard() {
  return [0, 1, 2, 3].map((id) => ({ id, distance: -1 }));
}

function emptyTokens(): Record<LudoColor, LudoToken[]> {
  return { red: yard(), green: yard(), yellow: yard(), blue: yard() };
}

export function createLudo(setup: LudoSetup = "quick2"): LudoState {
  const playerCount = setup === "local4" || setup === "cpu4" ? 4 : 2;
  const order =
    playerCount === 2
      ? (["red", "yellow"] as LudoColor[])
      : TURN_ORDER;
  const humanColors: LudoColor[] =
    setup === "local4"
      ? TURN_ORDER
      : setup === "cpu4"
        ? ["red"]
        : ["red"];

  return {
    setup,
    playerCount,
    order,
    humanColors,
    tokens: emptyTokens(),
    turn: "red",
    lastRoll: 0,
    message: "Roll — you need a 6 to open a token.",
    winner: null,
    mustRoll: true,
    pickToken: false,
    streak: 0,
  };
}

export function isHumanTurn(state: LudoState) {
  return state.humanColors.includes(state.turn);
}

export function displayName(state: LudoState, color: LudoColor) {
  if (state.setup === "local4") return `P${TURN_ORDER.indexOf(color) + 1} ${PLAYER_META[color].label}`;
  if (state.humanColors.includes(color) && color === "red") return "You";
  if (state.humanColors.includes(color)) return PLAYER_META[color].label;
  return `CPU ${PLAYER_META[color].label}`;
}

export function turnPhrase(state: LudoState, color: LudoColor) {
  if (color === "red" && state.humanColors.includes("red") && state.setup !== "local4") return "Your turn";
  return `${displayName(state, color)}'s turn`;
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

function nextInOrder(state: LudoState, extraRoll: boolean): LudoColor {
  if (extraRoll) return state.turn;
  const idx = state.order.indexOf(state.turn);
  return state.order[(idx + 1) % state.order.length];
}

function applyCapture(state: LudoState, mover: LudoColor, moved: LudoToken): LudoState {
  if (moved.distance < 0 || moved.distance >= TRACK_LEN) return state;
  const g = globalTrackIndex(mover, moved.distance);
  if (g === null || SAFE_GLOBAL.has(g)) return state;

  const tokens = { ...state.tokens };
  let captured = false;
  for (const color of state.order) {
    if (color === mover) continue;
    tokens[color] = tokens[color].map((t) => {
      if (t.distance < 0 || t.distance >= TRACK_LEN) return t;
      if (globalTrackIndex(color, t.distance) === g) {
        captured = true;
        return { ...t, distance: -1 };
      }
      return t;
    });
  }
  if (!captured) return state;
  return { ...state, tokens, message: "Capture! Token sent back to yard.", streak: state.streak + 1 };
}

export function ludoRoll(state: LudoState, roll: number): LudoState {
  if (state.winner || !state.mustRoll || state.pickToken) return state;
  const color = state.turn;
  const list = state.tokens[color];
  const movable = list.filter((t) => canMoveToken(t, roll));
  const who = displayName(state, color);

  if (movable.length === 0) {
    const msg = roll === 6 ? `${who} rolled 6 — no move. Roll again.` : `${who} rolled ${roll} — no move.`;
    if (roll === 6) {
      return { ...state, lastRoll: roll, message: msg, mustRoll: true };
    }
    return {
      ...state,
      lastRoll: roll,
      message: msg,
      turn: nextInOrder(state, false),
      mustRoll: true,
      pickToken: false,
    };
  }

  if (movable.length > 1 && isHumanTurn(state)) {
    return {
      ...state,
      lastRoll: roll,
      message: `${who} rolled ${roll} — tap a token.`,
      mustRoll: false,
      pickToken: true,
    };
  }

  const id = isHumanTurn(state) ? movable[0].id : cpuPickToken(state, roll);
  return applyLudoMove(state, id, roll);
}

export function applyLudoMove(state: LudoState, tokenId: number, roll: number): LudoState {
  const color = state.turn;
  const list = state.tokens[color].map((t) => ({ ...t }));
  const t = list.find((x) => x.id === tokenId);
  if (!t || !canMoveToken(t, roll)) return state;

  if (t.distance === -1) t.distance = 0;
  else t.distance += roll;

  const tokens = { ...state.tokens, [color]: list };
  let next: LudoState = {
    ...state,
    tokens,
    lastRoll: roll,
    message: roll === 6 && t.distance === 0 ? "Token out! Roll again." : `Moved ${roll} steps.`,
    pickToken: false,
    mustRoll: roll === 6,
    turn: nextInOrder(state, roll === 6),
  };

  next = applyCapture(next, color, t);

  if (allFinished(list)) {
    const winMsg =
      color === "red" && state.humanColors.includes("red")
        ? "You win! All four tokens home."
        : `${displayName(state, color)} wins!`;
    return { ...next, winner: color, message: winMsg, mustRoll: false, pickToken: false };
  }

  return next;
}

export function cpuPickToken(state: LudoState, roll: number): number {
  const color = state.turn;
  const movable = state.tokens[color].filter((t) => canMoveToken(t, roll));
  if (!movable.length) return 0;

  const score = (t: LudoToken) => {
    let s = 0;
    const nd = t.distance === -1 ? 0 : t.distance + roll;
    if (t.distance === -1) s += 8;
    if (nd >= FINISH) s += 120;
    if (nd >= TRACK_LEN) s += 35;
    if (nd >= 0 && nd < TRACK_LEN) {
      const g = globalTrackIndex(color, nd);
      if (g !== null && !SAFE_GLOBAL.has(g)) {
        for (const opp of state.order) {
          if (opp === color) continue;
          for (const o of state.tokens[opp]) {
            if (o.distance < 0 || o.distance >= TRACK_LEN) continue;
            if (globalTrackIndex(opp, o.distance) === g) s += 70;
          }
        }
      }
    }
    return s + nd;
  };

  return movable.sort((a, b) => score(b) - score(a))[0].id;
}

export function movableTokenIds(state: LudoState, roll: number): number[] {
  return state.tokens[state.turn].filter((t) => canMoveToken(t, roll)).map((t) => t.id);
}

export function ludoTurnSeat(turn: LudoColor): "p1" | "p2" {
  return turn === "red" ? "p1" : "p2";
}

export function isBotTurn(state: LudoState) {
  return !state.humanColors.includes(state.turn);
}
