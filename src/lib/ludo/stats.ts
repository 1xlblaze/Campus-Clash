const WINS = "cc-ludo-wins";
const GAMES = "cc-ludo-games";

export function recordLudoWin() {
  if (typeof window === "undefined") return;
  const w = Number(localStorage.getItem(WINS) ?? 0) + 1;
  const g = Number(localStorage.getItem(GAMES) ?? 0) + 1;
  localStorage.setItem(WINS, String(w));
  localStorage.setItem(GAMES, String(g));
}

export function recordLudoGame() {
  if (typeof window === "undefined") return;
  const g = Number(localStorage.getItem(GAMES) ?? 0) + 1;
  localStorage.setItem(GAMES, String(g));
}

export function ludoStats() {
  if (typeof window === "undefined") return { wins: 0, games: 0 };
  return {
    wins: Number(localStorage.getItem(WINS) ?? 0),
    games: Number(localStorage.getItem(GAMES) ?? 0),
  };
}
