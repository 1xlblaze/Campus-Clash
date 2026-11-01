export type BoardGame = {
  id: "ludo" | "snakes" | "monopoly";
  title: string;
  subtitle: string;
  icon: string;
  tag: string;
  players: string;
  href: string;
  gradient: string;
};

export const boardGames: BoardGame[] = [
  {
    id: "ludo",
    title: "Ludo King",
    subtitle: "4P table, sound, WhatsApp rooms — Ludo King rules.",
    icon: "🎲",
    tag: "Classic",
    players: "You vs CPU",
    href: "/play/ludo",
    gradient: "from-rose-500/25 to-orange-500/10",
  },
  {
    id: "snakes",
    title: "Snakes & Ladders",
    subtitle: "Classic 100-cell board. Solo, same-screen duo, or online.",
    icon: "🪜",
    tag: "Party fav",
    players: "2 players",
    href: "/play/snakes",
    gradient: "from-emerald-500/25 to-teal-500/10",
  },
  {
    id: "monopoly",
    title: "Campus Monopoly",
    subtitle: "20-space loop, chance cards, GO salary. CPU, local, or online.",
    icon: "🏛️",
    tag: "Business",
    players: "You vs CPU",
    href: "/play/monopoly",
    gradient: "from-violet-500/25 to-indigo-500/10",
  },
];

export function getBoardGame(id: string) {
  return boardGames.find((g) => g.id === id);
}
