function resolveSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
}

function resolveSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured() {
  return Boolean(resolveSupabaseUrl() && resolveSupabaseAnonKey());
}

export function getSupabaseUrl() {
  const url = resolveSupabaseUrl();
  if (!url) throw new Error("Missing Supabase URL (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL)");
  return url;
}

export function getSupabaseAnonKey() {
  const key = resolveSupabaseAnonKey();
  if (!key) throw new Error("Missing Supabase anon key");
  return key;
}
