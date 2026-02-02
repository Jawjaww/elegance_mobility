#!/bin/bash

# Script de reset de la base de données Supabase locale
# Usage : ./scripts/reset-db.sh

set -e

echo "🔄 Reset de la base de données Supabase..."

# Vérifier si on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur : Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "👉 Installation : npm install -g supabase"
    exit 1
fi

echo "📦 Arrêt des services..."
supabase stop

echo "🗑️  Suppression des données..."
supabase db reset

echo "✅ Base de données réinitialisée avec succès !"
echo ""
echo "📊 Pour peupler avec des données de test :"
echo "   supabase db seed"
echo ""
echo "🚀 Démarrage des services..."
supabase start

echo ""
echo "✨ Base de données prête !"
echo ""
echo "🔗 URLs :"
echo "   - Studio : http://localhost:54323"
echo "   - API : http://localhost:54321"
echo "   - DB : postgresql://postgres:postgres@localhost:54322/postgres"
