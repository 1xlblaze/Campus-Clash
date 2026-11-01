"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOrCreateGuestToken } from "@/lib/guest-session";
import type { OnlineRole } from "@/lib/multiplayer/types";

export function useOnlineRoom(roomCode: string | null, role: OnlineRole | null) {
  const playerToken = useMemo(
    () => (typeof window !== "undefined" ? getOrCreateGuestToken() : ""),
    []
  );
  const [remoteState, setRemoteState] = useState<unknown>(null);
  const [turnSeat, setTurnSeat] = useState<"p1" | "p2">("p1");
  const [status, setStatus] = useState("waiting");

  const refresh = useCallback(async () => {
    if (!roomCode || !playerToken) return;
    const res = await fetch(`/api/rooms/${roomCode}?token=${encodeURIComponent(playerToken)}`);
    const data = await res.json();
    if (!res.ok) return;
    setRemoteState(data.state);
    setTurnSeat(data.turnSeat);
    setStatus(data.status);
  }, [roomCode, playerToken]);

  const publish = useCallback(
    async (state: unknown, nextTurn: "p1" | "p2", nextStatus: "playing" | "finished" = "playing") => {
      if (!roomCode) return;
      await fetch(`/api/rooms/${roomCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerToken, state, turnSeat: nextTurn, status: nextStatus }),
      });
      await refresh();
    },
    [roomCode, playerToken, refresh]
  );

  useEffect(() => {
    if (!roomCode || !role || !isSupabaseConfigured()) return;
    void refresh();
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `room_code=eq.${roomCode.toUpperCase()}`,
        },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomCode, role, refresh]);

  const isMyTurn =
    Boolean(role) &&
    ((role === "host" && turnSeat === "p1") || (role === "guest" && turnSeat === "p2"));

  return { roomCode, role, playerToken, remoteState, turnSeat, status, publish, refresh, isMyTurn };
}

export async function createOnlineRoom(gameType: string, initialState: unknown) {
  const hostToken = getOrCreateGuestToken();
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameType, hostToken, initialState }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not create room");
  return { ...data, role: "host" as const };
}

export async function joinOnlineRoom(roomCode: string) {
  const guestToken = getOrCreateGuestToken();
  const res = await fetch("/api/rooms/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, guestToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not join room");
  return { ...data, role: "guest" as const };
}
