import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { GameRoomType } from "@/lib/multiplayer/types";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Online play requires Supabase" }, { status: 503 });
  }
  const body = (await request.json()) as {
    gameType?: GameRoomType;
    hostToken?: string;
    initialState?: unknown;
  };
  const gameType = body.gameType;
  if (!gameType || !["ludo", "snakes", "monopoly"].includes(gameType)) {
    return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
  }
  if (!body.hostToken || body.hostToken.length < 16) {
    return NextResponse.json({ error: "Invalid host token" }, { status: 400 });
  }
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.rpc("cc_create_game_room", {
    p_game_type: gameType,
    p_host_token: body.hostToken,
    p_initial_state: body.initialState ?? {},
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
