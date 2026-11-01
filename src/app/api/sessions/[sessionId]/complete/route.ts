import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`complete:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { guestToken?: string };
  if (!body.guestToken) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isSupabaseConfigured() || sessionId === "demo") {
    return NextResponse.json({ error: "Verified mode unavailable" }, { status: 503 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("cc_complete_session", {
    p_session_id: sessionId,
    p_guest_token: body.guestToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
