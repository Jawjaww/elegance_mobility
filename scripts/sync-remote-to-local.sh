#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/sync-remote-to-local.sh
# Nécessite les variables d'environnement SUPABASE_SERVICE_ROLE_KEY et NEXT_PUBLIC_SUPABASE_URL
# Optionnel: LOCAL_DB_URL (par défaut supabase local)

: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY in .env.local}"
: "${NEXT_PUBLIC_SUPABASE_URL:?Set NEXT_PUBLIC_SUPABASE_URL in .env.local}"
LOCAL_DB_URL="${LOCAL_DB_URL:-postgres://postgres:postgres@localhost:54322/postgres}"
DUMP_DIR="supabase/dumps"
mkdir -p "$DUMP_DIR"

# Construction de la chaîne de connexion distante
REMOTE_DB_URL="postgres://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${NEXT_PUBLIC_SUPABASE_URL#https://}/postgres"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$DUMP_DIR/local_backup_$TIMESTAMP.dump"
REMOTE_SCHEMA="$DUMP_DIR/remote_schema_$TIMESTAMP.sql"
REMOTE_DATA="$DUMP_DIR/remote_data_$TIMESTAMP.sql"

# 1) Backup local DB
pg_dump --format=custom --file="$BACKUP_FILE" "$LOCAL_DB_URL"

# 2) Dump remote schema and data
pg_dump --schema-only --no-owner --no-privileges "$REMOTE_DB_URL" > "$REMOTE_SCHEMA"
pg_dump --data-only --inserts "$REMOTE_DB_URL" > "$REMOTE_DATA"

# 3) Import remote schema into local DB
psql "$LOCAL_DB_URL" -f "$REMOTE_SCHEMA"

# 4) Import remote data (optionnel)
# psql "$LOCAL_DB_URL" -f "$REMOTE_DATA"

# 5) Générer les types TypeScript
supabase gen types typescript --db-url "$LOCAL_DB_URL" --schema public > elegance-mobilite/src/lib/types/database.types.ts

echo "Synchronisation terminée. Vérifiez supabase/dumps et src/lib/types/database.types.ts."
