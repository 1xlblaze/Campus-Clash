import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getGame } from "@/lib/games";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`start:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { gameId?: string; guestToken?: string };
  const gameId = body.gameId === "trivia" ? "trivia" : body.gameId === "bollywood" ? "bollywood" : null;
  const guestToken = body.guestToken?.trim();
  if (!gameId || !guestToken || guestToken.length < 16) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const game = getGame(gameId);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    return NextResponse.json({
      sessionId: "demo",
      gameId,
      verifiedMode: false,
      questions: game.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        explanation: q.explanation ?? null,
      })),
    });
  }

  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.rpc("cc_start_session", {
    p_game_id: gameId,
    p_guest_token: guestToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const payload = data as {
    sessionId: string;
    gameId: string;
    questions: { id: string; prompt: string; options: string[]; explanation?: string | null }[];
  };

  return NextResponse.json({
    sessionId: payload.sessionId,
    gameId: payload.gameId,
    verifiedMode: true,
    questions: payload.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: Array.isArray(q.options) ? q.options : [],
      explanation: q.explanation ?? null,
    })),
  });
}
