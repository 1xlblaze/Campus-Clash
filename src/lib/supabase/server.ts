import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./config";

/** Stateless client for guest RPC calls (no user cookie). */
export function createSupabaseServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cookie-aware client — use in route handlers so auth.uid() is set in RPCs. */
export async function createSupabaseRouteClient() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* set from a Server Component */
        }
      },
    },
  });
}
