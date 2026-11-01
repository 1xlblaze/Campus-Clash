import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Online play requires Supabase" }, { status: 503 });
  }
  const body = (await request.json()) as { roomCode?: string; guestToken?: string };
  if (!body.roomCode?.trim() || !body.guestToken || body.guestToken.length < 16) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.rpc("cc_join_game_room", {
    p_room_code: body.roomCode.trim(),
    p_guest_token: body.guestToken,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
