#!/usr/bin/env bash
# Sync elegance-mobilite/.env.local Supabase keys from `supabase status -o env`.
# Usage (from repo root or elegance-mobilite):
#   ./scripts/sync-local-supabase-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA="$(cd "$ROOT/../infra-supabase" 2>/dev/null && pwd || true)"
ENV_FILE="$ROOT/.env.local"

if [[ ! -d "$INFRA" ]]; then
  echo "infra-supabase not found next to elegance-mobilite"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

STATUS_ENV="$(cd "$INFRA" && supabase status -o env)"
API_URL="$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^API_URL="\(.*\)"/\1/p')"
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^ANON_KEY="\(.*\)"/\1/p')"
SERVICE_ROLE_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -n 's/^SERVICE_ROLE_KEY="\(.*\)"/\1/p')"

if [[ -z "$API_URL" || -z "$ANON_KEY" || -z "$SERVICE_ROLE_KEY" ]]; then
  echo "Could not read API_URL / ANON_KEY / SERVICE_ROLE_KEY from supabase status"
  exit 1
fi

TMP="$(mktemp)"
awk -v url="$API_URL" -v anon="$ANON_KEY" -v svc="$SERVICE_ROLE_KEY" '
  BEGIN { u=0; a=0; s=0 }
  /^NEXT_PUBLIC_SUPABASE_URL=/ { print "NEXT_PUBLIC_SUPABASE_URL=" url; u=1; next }
  /^NEXT_PUBLIC_SUPABASE_ANON_KEY=/ { print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" anon; a=1; next }
  /^SUPABASE_SERVICE_ROLE_KEY=/ { print "SUPABASE_SERVICE_ROLE_KEY=" svc; s=1; next }
  { print }
  END {
    if (!u) print "NEXT_PUBLIC_SUPABASE_URL=" url
    if (!a) print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" anon
    if (!s) print "SUPABASE_SERVICE_ROLE_KEY=" svc
  }
' "$ENV_FILE" > "$TMP"

mv "$TMP" "$ENV_FILE"
echo "Updated $ENV_FILE with local Supabase URL + keys from infra-supabase."
echo "Restart Next.js (npm run dev) and re-login so the session JWT matches."
