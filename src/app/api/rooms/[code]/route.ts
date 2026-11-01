import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Params) {
  const { code } = await params;
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Online play requires Supabase" }, { status: 503 });
  }
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.rpc("cc_get_game_room", {
    p_room_code: code,
    p_player_token: token,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: Params) {
  const { code } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Online play requires Supabase" }, { status: 503 });
  }
  const body = (await request.json()) as {
    playerToken?: string;
    state?: unknown;
    turnSeat?: "p1" | "p2";
    status?: "waiting" | "playing" | "finished";
  };
  if (!body.playerToken || body.playerToken.length < 16) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.rpc("cc_sync_game_room", {
    p_room_code: code,
    p_player_token: body.playerToken,
    p_state: body.state ?? {},
    p_turn_seat: body.turnSeat ?? "p1",
    p_status: body.status ?? "playing",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
