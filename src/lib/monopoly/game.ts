export type Property = {
  id: number;
  name: string;
  price: number;
  rent: number;
  color: string;
  icon: string;
};

export const BOARD: Property[] = [
  { id: 0, name: "GO", price: 0, rent: 0, color: "#FFD166", icon: "🎓" },
  { id: 1, name: "Hostel Block A", price: 120, rent: 20, color: "#8066ED", icon: "🛏️" },
  { id: 2, name: "Canteen Corner", price: 140, rent: 28, color: "#8066ED", icon: "🍔" },
  { id: 3, name: "Library Lane", price: 160, rent: 32, color: "#18C6D4", icon: "📚" },
  { id: 4, name: "Exam Tax", price: 0, rent: 100, color: "#FF6B6B", icon: "📝" },
  { id: 5, name: "Sports Arena", price: 180, rent: 36, color: "#18C6D4", icon: "⚽" },
  { id: 6, name: "Tech Park", price: 200, rent: 40, color: "#4ADE80", icon: "💻" },
  { id: 7, name: "Startup Hub", price: 220, rent: 44, color: "#4ADE80", icon: "🚀" },
  { id: 8, name: "Dean's Office", price: 0, rent: 0, color: "#A4A8BC", icon: "🏛️" },
  { id: 9, name: "Festival Ground", price: 240, rent: 48, color: "#F472B6", icon: "🎉" },
  { id: 10, name: "Audi Max", price: 260, rent: 52, color: "#F472B6", icon: "🎤" },
  { id: 11, name: "Back to Class", price: 0, rent: 0, color: "#FF6B6B", icon: "⏪" },
  { id: 12, name: "Mess Premium", price: 280, rent: 56, color: "#FB923C", icon: "🍛" },
  { id: 13, name: "Lab Complex", price: 300, rent: 60, color: "#FB923C", icon: "🔬" },
  { id: 14, name: "Alumni Gate", price: 320, rent: 64, color: "#8066ED", icon: "🚪" },
  { id: 15, name: "Free WiFi", price: 0, rent: 50, color: "#18C6D4", icon: "📶" },
];

export type Owner = null | "you" | "cpu";

export type MonopolyState = {
  you: { cash: number; pos: number };
  cpu: { cash: number; pos: number };
  owners: Owner[];
  turn: "you" | "cpu";
  message: string;
  winner: null | "you" | "cpu";
  pendingBuy: null | number;
};

export function createMonopoly(): MonopolyState {
  return {
    you: { cash: 1500, pos: 0 },
    cpu: { cash: 1500, pos: 0 },
    owners: BOARD.map(() => null),
    turn: "you",
    message: "Roll to move. Buy property. Drain your rival.",
    winner: null,
    pendingBuy: null,
  };
}

export function rollMove(state: MonopolyState, roll: number): MonopolyState {
  if (state.winner || state.pendingBuy !== null) return state;
  const side = state.turn;
  const player = { ...state[side] };
  player.pos = (player.pos + roll) % BOARD.length;
  const cell = BOARD[player.pos];
  let message = `${side === "you" ? "You" : "CPU"} rolled ${roll} → ${cell.name}`;
  let owners = [...state.owners];
  let pendingBuy: number | null = null;
  let cash = player.cash;

  if (cell.id === 4 || cell.id === 15) {
    cash -= cell.rent;
    message = `Paid ₹${cell.rent} — ${cell.name}`;
  } else if (cell.id === 11) {
    player.pos = 0;
    message = "Back to GO! Skip a beat.";
  } else if (cell.price > 0) {
    const owner = owners[cell.id];
    if (owner === null) pendingBuy = cell.id;
    else if (owner !== side) {
      cash -= cell.rent;
      const updated = {
        ...state,
        [owner]: { ...state[owner], cash: state[owner].cash + cell.rent },
      };
      return {
        ...updated,
        [side]: { ...player, cash },
        owners,
        message: `Rent ₹${cell.rent} → ${owner === "you" ? "you" : "CPU"}`,
        pendingBuy: null,
        turn: side === "you" ? "cpu" : "you",
      } as MonopolyState;
    }
  }

  player.cash = cash;
  let next = {
    ...state,
    [side]: player,
    owners,
    message,
    pendingBuy,
    turn: state.turn,
  } as MonopolyState;

  if (cash < 0) {
    return { ...next, winner: side === "you" ? "cpu" : "you", message: "Bankrupt!", pendingBuy: null };
  }
  if (pendingBuy === null) {
    next = { ...next, turn: side === "you" ? "cpu" : "you" };
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
    s = { ...s, message: buy ? "Not enough cash." : "Passed on the deal." };
  }
  return { ...s, turn: side === "you" ? "cpu" : "you" };
}

export function cpuShouldBuy(state: MonopolyState): boolean {
  if (state.pendingBuy === null) return false;
  const cell = BOARD[state.pendingBuy];
  return state.cpu.cash >= cell.price * 1.2;
}
