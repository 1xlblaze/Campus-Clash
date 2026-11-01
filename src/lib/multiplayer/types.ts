export type PlayMode = "cpu" | "local" | "online";

export type OnlineRole = "host" | "guest";

export type GameRoomType = "ludo" | "snakes" | "monopoly";

export type GameRoomRow = {
  id: string;
  room_code: string;
  game_type: GameRoomType;
  state: unknown;
  status: "waiting" | "playing" | "finished";
  turn_seat: "p1" | "p2";
  host_token_hash: string;
  guest_token_hash: string | null;
  updated_at: string;
};

export function randomRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
