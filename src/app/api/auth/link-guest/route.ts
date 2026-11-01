import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(`link-guest:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await request.json()) as { guestToken?: string };
  const guestToken = body.guestToken?.trim();
  if (!guestToken || guestToken.length < 16) {
    return NextResponse.json({ error: "Invalid guest token" }, { status: 400 });
  }

  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("cc_link_guest_sessions", {
    p_guest_token: guestToken,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
