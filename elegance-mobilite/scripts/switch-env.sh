#!/bin/bash
# Script de basculement entre environnements Supabase local/remote

set -e

ENV_TYPE="${1:-local}"

case "$ENV_TYPE" in
  local|dev)
    echo "🔄 Activation environnement LOCAL (Docker/Supabase)..."
    cp .env.local.development .env.local
    echo "✅ Configuration LOCAL activée"
    echo "📍 URL: http://127.0.0.1:54321"
    ;;
  remote|prod)
    echo "🔄 Activation environnement REMOTE (Production Supabase)..."
    cp .env.local.production .env.local
    echo "✅ Configuration REMOTE activée"
    echo "📍 URL: https://iodsddzustunlahxafif.supabase.co"
    ;;
  *)
    echo "❌ Usage: $0 {local|remote}"
    echo "   local  → Base de données Docker locale"
    echo "   remote → Base de données Supabase distante"
    exit 1
    ;;
esac

echo ""
echo "⚠️  Redémarrez 'npm run dev' pour appliquer les changements"
