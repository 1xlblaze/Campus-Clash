const STORAGE_KEY = "cc-guest-token";

export function getOrCreateGuestToken() {
  if (typeof window === "undefined") return "";
  let token = window.sessionStorage.getItem(STORAGE_KEY);
  if (!token) {
    token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID() + crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

export type PlayQuestion = {
  id: string;
  prompt: string;
  options: string[];
  explanation?: string | null;
};

export type StartSessionResponse = {
  sessionId: string;
  gameId: string;
  questions: PlayQuestion[];
  verifiedMode: boolean;
};
