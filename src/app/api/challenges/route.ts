import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`challenge:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { sessionId?: string; guestToken?: string };
  if (!body.sessionId || !body.guestToken) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isSupabaseConfigured() || body.sessionId === "demo") {
    return NextResponse.json({ error: "Verified challenges require Supabase" }, { status: 503 });
  }

  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.rpc("cc_create_challenge", {
    p_session_id: body.sessionId,
    p_guest_token: body.guestToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
