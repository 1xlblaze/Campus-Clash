export type CellKind = "go" | "property" | "tax" | "chance" | "jail" | "goto" | "free";

export type Property = {
  id: number;
  name: string;
  price: number;
  rent: number;
  color: string;
  icon: string;
  kind: CellKind;
};

export const GO_SALARY = 200;

export const CHANCE_CARDS = [
  { text: "Dean liked your project. Collect ₹150.", cash: 150 },
  { text: "Hostel mess refund. Collect ₹80.", cash: 80 },
  { text: "Lost ID card. Pay ₹50 fine.", cash: -50 },
  { text: "Won hackathon. Collect ₹200.", cash: 200 },
  { text: "Library overdue. Pay ₹30.", cash: -30 },
  { text: "Advance to GO. Collect ₹200.", advanceGo: true as const },
  { text: "Campus fest volunteer stipend. Collect ₹100.", cash: 100 },
  { text: "Phone repair. Pay ₹75.", cash: -75 },
];

export const BOARD: Property[] = [
  { id: 0, name: "GO", price: 0, rent: 0, color: "#FFD166", icon: "🎓", kind: "go" },
  { id: 1, name: "Hostel A", price: 100, rent: 18, color: "#8066ED", icon: "🛏️", kind: "property" },
  { id: 2, name: "Canteen", price: 120, rent: 22, color: "#8066ED", icon: "🍔", kind: "property" },
  { id: 3, name: "Campus Card", price: 0, rent: 0, color: "#18C6D4", icon: "🃏", kind: "chance" },
  { id: 4, name: "Library", price: 140, rent: 26, color: "#18C6D4", icon: "📚", kind: "property" },
  { id: 5, name: "Exam Tax", price: 0, rent: 120, color: "#FF6B6B", icon: "📝", kind: "tax" },
  { id: 6, name: "Sports Arena", price: 160, rent: 30, color: "#4ADE80", icon: "⚽", kind: "property" },
  { id: 7, name: "Tech Park", price: 180, rent: 34, color: "#4ADE80", icon: "💻", kind: "property" },
  { id: 8, name: "Campus Card", price: 0, rent: 0, color: "#18C6D4", icon: "🃏", kind: "chance" },
  { id: 9, name: "Jail Visit", price: 0, rent: 0, color: "#A4A8BC", icon: "🔒", kind: "jail" },
  { id: 10, name: "Startup Hub", price: 200, rent: 38, color: "#F472B6", icon: "🚀", kind: "property" },
  { id: 11, name: "Festival Ground", price: 220, rent: 42, color: "#F472B6", icon: "🎉", kind: "property" },
  { id: 12, name: "Mess Premium", price: 240, rent: 46, color: "#FB923C", icon: "🍛", kind: "property" },
  { id: 13, name: "WiFi Fee", price: 0, rent: 80, color: "#FF6B6B", icon: "📶", kind: "tax" },
  { id: 14, name: "Audi Max", price: 260, rent: 50, color: "#8066ED", icon: "🎤", kind: "property" },
  { id: 15, name: "Lab Complex", price: 280, rent: 54, color: "#8066ED", icon: "🔬", kind: "property" },
  { id: 16, name: "Campus Card", price: 0, rent: 0, color: "#18C6D4", icon: "🃏", kind: "chance" },
  { id: 17, name: "Alumni Gate", price: 300, rent: 58, color: "#FB923C", icon: "🚪", kind: "property" },
  { id: 18, name: "Back to Class", price: 0, rent: 0, color: "#FF6B6B", icon: "⏪", kind: "goto" },
  { id: 19, name: "Free Food Truck", price: 0, rent: 0, color: "#FFD166", icon: "🚚", kind: "free" },
];

export type Owner = null | "you" | "cpu";

export type MonopolyState = {
  you: { cash: number; pos: number; skipTurns: number };
  cpu: { cash: number; pos: number; skipTurns: number };
  owners: Owner[];
  turn: "you" | "cpu";
  message: string;
  winner: null | "you" | "cpu";
  pendingBuy: null | number;
  chanceDeck: number[];
};

export function createMonopoly(): MonopolyState {
  return {
    you: { cash: 1500, pos: 0, skipTurns: 0 },
    cpu: { cash: 1500, pos: 0, skipTurns: 0 },
    owners: BOARD.map(() => null),
    turn: "you",
    message: "Full campus loop — pass GO for ₹200. Land on 🃏 for surprise cards.",
    winner: null,
    pendingBuy: null,
    chanceDeck: shuffleChance(),
  };
}

function shuffleChance() {
  const d = CHANCE_CARDS.map((_, i) => i);
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function drawCard(state: MonopolyState, side: "you" | "cpu"): MonopolyState {
  const deck = [...state.chanceDeck];
  const idx = deck.shift() ?? 0;
  deck.push(idx);
  const card = CHANCE_CARDS[idx];
  const player = { ...state[side] };
  let message = `🃏 ${card.text}`;
  if ("advanceGo" in card && card.advanceGo) {
    player.pos = 0;
    player.cash += GO_SALARY;
    message += ` (+₹${GO_SALARY})`;
  } else if (card.cash) {
    player.cash += card.cash;
  }
  let next = { ...state, [side]: player, chanceDeck: deck, message } as MonopolyState;
  if (player.cash < 0) {
    next = { ...next, winner: side === "you" ? "cpu" : "you", message: "Bankrupt on a chance card!" };
  }
  return next;
}

export function rollMove(state: MonopolyState, roll: number): MonopolyState {
  if (state.winner || state.pendingBuy !== null) return state;
  const side = state.turn;
  const player = { ...state[side] };
  if (player.skipTurns > 0) {
    player.skipTurns -= 1;
    return {
      ...state,
      [side]: player,
      turn: side === "you" ? "cpu" : "you",
      message: `${side === "you" ? "You" : "Rival"} skip a turn (detention).`,
    };
  }
  const oldPos = player.pos;
  player.pos = (player.pos + roll) % BOARD.length;
  if (player.pos < oldPos || oldPos + roll >= BOARD.length) {
    player.cash += GO_SALARY;
  }
  const cell = BOARD[player.pos];
  let message = `${side === "you" ? "You" : "Rival"} rolled ${roll} → ${cell.name}`;
  let pendingBuy: number | null = null;
  let next = { ...state, [side]: player, message, pendingBuy: null as number | null, turn: state.turn };

  if (cell.kind === "tax") {
    player.cash -= cell.rent;
    message = `Paid ₹${cell.rent} — ${cell.name}`;
  } else if (cell.kind === "goto") {
    player.pos = 0;
    player.skipTurns = 1;
    message = "Back to GO — miss next turn.";
  } else if (cell.kind === "chance") {
    next = drawCard({ ...state, [side]: player }, side);
    if (next.winner) return { ...next, pendingBuy: null };
    return { ...next, turn: side === "you" ? "cpu" : "you", pendingBuy: null };
  } else if (cell.kind === "property") {
    const owner = state.owners[cell.id];
    if (owner === null) pendingBuy = cell.id;
    else if (owner !== side) {
      player.cash -= cell.rent;
      const ownerKey = owner;
      const updated = {
        ...state,
        [ownerKey]: { ...state[ownerKey], cash: state[ownerKey].cash + cell.rent },
      };
      return {
        ...updated,
        [side]: player,
        message: `Rent ₹${cell.rent} paid.`,
        pendingBuy: null,
        turn: side === "you" ? "cpu" : "you",
      } as MonopolyState;
    }
  } else if (cell.kind === "free") {
    player.cash += 50;
    message = "Free samosa voucher — collect ₹50.";
  }

  next = { ...next, [side]: player, message, pendingBuy };
  if (player.cash < 0) {
    return { ...next, winner: side === "you" ? "cpu" : "you", message: "Bankrupt!", pendingBuy: null };
  }
  if (pendingBuy === null) {
    next = { ...next, turn: side === "you" ? "cpu" : "you" };
  } else if (pendingBuy !== null) {
    next = { ...next, turn: side };
  }
  return next;
}

export function buyProperty(state: MonopolyState, buy: boolean): MonopolyState {
  if (state.pendingBuy === null) return state;
  const id = state.pendingBuy;
  const cell = BOARD[id];
  const side = state.turn;
  let s = { ...state, pendingBuy: null as number | null };
  if (buy && state[side].cash >= cell.price) {
    const owners = [...state.owners];
    owners[id] = side;
    s = {
      ...s,
      owners,
      [side]: { ...state[side], cash: state[side].cash - cell.price },
      message: `Bought ${cell.name} for ₹${cell.price}`,
    } as MonopolyState;
  } else {
    s = { ...s, message: buy ? "Not enough cash." : "Passed." };
  }
  return { ...s, turn: side === "you" ? "cpu" : "you" };
}

export function cpuShouldBuy(state: MonopolyState): boolean {
  if (state.pendingBuy === null) return false;
  const cell = BOARD[state.pendingBuy];
  return state.cpu.cash >= cell.price * 1.15;
}

export function seatToSide(seat: "p1" | "p2"): "you" | "cpu" {
  return seat === "p1" ? "you" : "cpu";
}

export function sideToSeat(turn: "you" | "cpu"): "p1" | "p2" {
  return turn === "you" ? "p1" : "p2";
}

export function labelSide(side: "you" | "cpu", mode: "cpu" | "local" | "online", mySeat: "p1" | "p2" | null) {
  if (mode === "cpu") return side === "you" ? "You" : "CPU";
  if (mode === "local") return side === "you" ? "Player 1" : "Player 2";
  if (!mySeat) return side === "you" ? "Host" : "Guest";
  if (mySeat === "p1") return side === "you" ? "You" : "Opponent";
  return side === "cpu" ? "You" : "Opponent";
}
