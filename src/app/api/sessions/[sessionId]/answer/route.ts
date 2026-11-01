import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { sessionId } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`answer:${ip}`, 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as {
    guestToken?: string;
    questionId?: string;
    selectedKey?: string | null;
    responseMs?: number;
  };

  if (!body.guestToken || !body.questionId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isSupabaseConfigured() || sessionId === "demo") {
    return NextResponse.json({ error: "Verified mode unavailable" }, { status: 503 });
  }

  const supabase = await createSupabaseRouteClient();
  const { data, error } = await supabase.rpc("cc_submit_answer", {
    p_session_id: sessionId,
    p_guest_token: body.guestToken,
    p_question_id: body.questionId,
    p_selected_key: body.selectedKey ?? "",
    p_response_ms: body.responseMs ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
