import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get("game") === "trivia" ? "trivia" : "bollywood";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 10)));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ entries: [], verifiedMode: false });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("cc_leaderboard", {
    p_game_id: gameId,
    p_limit: limit,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ entries: data ?? [], verifiedMode: true, gameId });
}
