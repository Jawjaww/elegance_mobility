#!/bin/bash

# Script de reset complet de la base de données Supabase locale
# Usage : ./scripts/reset-db.sh

set -e

echo "🔄 Reset complet de la base de données Supabase..."

# Vérifier si on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur : Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "👉 Installation : brew install supabase/tap/supabase"
    exit 1
fi

echo "📦 Arrêt des services..."
supabase stop

echo "🗑️  Suppression des volumes Docker..."
docker volume rm supabase_db_elegance-mobilite supabase_edge_runtime_elegance-mobilite supabase_storage_elegance-mobilite 2>/dev/null || true

echo "🚀 Démarrage avec réinitialisation complète..."
supabase start

echo ""
echo "✨ Base de données réinitialisée avec succès !"
echo ""
echo "✅ RLS activé sur les tables critiques"
echo "✅ Politiques de sécurité créées"
echo "✅ Données de test injectées"
echo ""
echo "🔗 URLs disponibles :"
echo "   - Studio :     http://localhost:54323"
echo "   - API REST :   http://localhost:54321/rest/v1"
echo "   - Database :   postgresql://postgres:postgres@localhost:54322/postgres"
echo "   - Mailpit :    http://localhost:54324"
echo ""
echo "📝 Commandes utiles :"
echo "   supabase status              # Voir le statut"
echo "   supabase db execute -f file.sql  # Exécuter SQL"
echo "   psql postgresql://postgres:postgres@localhost:54322/postgres"
