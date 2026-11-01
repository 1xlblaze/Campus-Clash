#!/usr/bin/env bash
# Push Supabase (and optional) env vars to a Vercel project.
# Usage:
#   export VERCEL_TOKEN=... VERCEL_ORG_ID=... VERCEL_PROJECT_ID=...
#   export NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   ./scripts/sync-vercel-env.sh
set -euo pipefail

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"
: "${VERCEL_ORG_ID:?Set VERCEL_ORG_ID}"
: "${VERCEL_PROJECT_ID:?Set VERCEL_PROJECT_ID}"
: "${NEXT_PUBLIC_SUPABASE_URL:?Set NEXT_PUBLIC_SUPABASE_URL}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:?Set NEXT_PUBLIC_SUPABASE_ANON_KEY}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v vercel >/dev/null 2>&1; then
  npm install -g vercel@latest
fi

add_var() {
  local name="$1"
  local value="$2"
  local target="$3"
  printf '%s' "$value" | vercel env add "$name" "$target" --force --yes 2>/dev/null || \
    printf '%s' "$value" | vercel env add "$name" "$target" --yes
}

for target in production preview development; do
  add_var NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL" "$target"
  add_var NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$target"
  if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    add_var SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" "$target"
  fi
done

echo "Done. Redeploy on Vercel for env changes to apply to existing deployments."
