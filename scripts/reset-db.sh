#!/bin/bash
# Reset local Supabase schema via infra-supabase (source of truth for migrations).
# Usage: ./scripts/reset-db.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/../../infra-supabase" && pwd)"

if [ ! -d "${INFRA_DIR}/supabase/migrations" ]; then
  echo "❌ infra-supabase not found at ${INFRA_DIR}"
  echo "   Clone the workspace with infra-supabase as a sibling of elegance-mobilite."
  exit 1
fi

echo "🔄 Resetting local DB from infra-supabase (schema source of truth)..."
cd "${INFRA_DIR}"
./scripts/prepare-db-change.sh

echo ""
echo "✨ Done. Types synced into elegance-mobilite and vector-elegans if present in workspace."
