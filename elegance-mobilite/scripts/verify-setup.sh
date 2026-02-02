#!/bin/bash

# Script de vérification du setup Supabase
# Usage : ./scripts/verify-setup.sh

set -e

echo "🔍 Vérification du setup Supabase..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

FAILED=0

# Fonction de vérification SQL
check_sql() {
    local name=$1
    local query=$2
    local expected=$3
    
    echo -n "  $name... "
    result=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tAc "$query" 2>/dev/null || echo "ERROR")
    
    if [ "$result" == "$expected" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC} (attendu: $expected, reçu: $result)"
        FAILED=$((FAILED + 1))
    fi
}

# Vérifier que Supabase est démarré
echo "1. Vérification des services..."
if supabase status &>/dev/null; then
    echo -e "  Services Supabase... ${GREEN}✅${NC}"
else
    echo -e "  Services Supabase... ${RED}❌${NC}"
    echo "👉 Lancez : supabase start"
    exit 1
fi

# Vérifier connexion DB
echo ""
echo "2. Connexion à la base de données..."
if PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT 1" &>/dev/null; then
    echo -e "  Connexion PostgreSQL... ${GREEN}✅${NC}"
else
    echo -e "  Connexion PostgreSQL... ${RED}❌${NC}"
    exit 1
fi

# Vérifier RLS
echo ""
echo "3. Vérification RLS sur les tables critiques..."
check_sql "vehicles" "SELECT relrowsecurity::text FROM pg_class WHERE relname = 'vehicles'" "true"
check_sql "driver_documents" "SELECT relrowsecurity::text FROM pg_class WHERE relname = 'driver_documents'" "true"
check_sql "vehicle_documents" "SELECT relrowsecurity::text FROM pg_class WHERE relname = 'vehicle_documents'" "true"
check_sql "user_profiles" "SELECT relrowsecurity::text FROM pg_class WHERE relname = 'user_profiles'" "true"

# Vérifier politiques
echo ""
echo "4. Vérification des politiques RLS..."
check_sql "politiques vehicles" "SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'vehicles'" "5"
check_sql "politiques driver_documents" "SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'driver_documents'" "5"
check_sql "politiques vehicle_documents" "SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'vehicle_documents'" "4"
check_sql "politiques user_profiles" "SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'user_profiles'" "4"

# Vérifier vue vehicles_public
echo ""
echo "5. Vérification de la vue vehicles_public..."
check_sql "vue existe" "SELECT COUNT(*)::text FROM information_schema.views WHERE table_name = 'vehicles_public'" "1"

# Vérifier que insurance_number est exclue
INSURANCE_COL=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tAc "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'vehicles_public' AND column_name = 'insurance_number'" 2>/dev/null || echo "0")
echo -n "  insurance_number exclue... "
if [ "$INSURANCE_COL" == "0" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    FAILED=$((FAILED + 1))
fi

# Vérifier données seed
echo ""
echo "6. Vérification des données de test..."
check_sql "utilisateurs" "SELECT COUNT(*)::text FROM users" "9"
check_sql "chauffeurs" "SELECT COUNT(*)::text FROM drivers" "3"
check_sql "véhicules" "SELECT COUNT(*)::text FROM vehicles" "3"
check_sql "courses" "SELECT COUNT(*)::text FROM rides" "4"
check_sql "tarifs" "SELECT COUNT(*)::text FROM rates" "4"

# Vérifier fonctions
echo ""
echo "7. Vérification des fonctions critiques..."
echo -n "  is_admin()... "
if PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT is_admin()" &>/dev/null; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "  search_path configuré... "
SEARCH_PATH_COUNT=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tAc "SELECT COUNT(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proconfig IS NOT NULL" 2>/dev/null || echo "0")
if [ "$SEARCH_PATH_COUNT" -ge "30" ]; then
    echo -e "${GREEN}✅ ($SEARCH_PATH_COUNT fonctions)${NC}"
else
    echo -e "${RED}❌ (seulement $SEARCH_PATH_COUNT fonctions)${NC}"
    FAILED=$((FAILED + 1))
fi

# Résumé
echo ""
echo "========================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Toutes les vérifications ont réussi !${NC}"
    echo ""
    echo "🔗 URLs disponibles :"
    echo "   - Studio :  http://localhost:54323"
    echo "   - API :     http://localhost:54321"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $FAILED vérification(s) ont échoué${NC}"
    echo ""
    echo "👉 Essayez : ./scripts/reset-db.sh"
    exit 1
fi
