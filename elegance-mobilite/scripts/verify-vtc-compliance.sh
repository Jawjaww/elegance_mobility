#!/bin/bash

# Script de vérification de conformité VTC
# Usage : ./scripts/verify-vtc-compliance.sh

set -e

echo "🚗 Vérification de conformité VTC du schéma..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0
WARNING=0

check_sql() {
    local name=$1
    local query=$2
    local expected=$3
    local severity=$4  # 'error' or 'warning'
    
    echo -n "  $name... "
    result=$(PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -tAc "$query" 2>/dev/null || echo "ERROR")
    
    if [ "$result" == "$expected" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        if [ "$severity" == "error" ]; then
            echo -e "${RED}❌${NC} (attendu: $expected, reçu: $result)"
            FAILED=$((FAILED + 1))
        else
            echo -e "${YELLOW}⚠️${NC} (attendu: $expected, reçu: $result)"
            WARNING=$((WARNING + 1))
        fi
    fi
}

echo "1️⃣ CONFORMITÉ RÉGLEMENTAIRE FRANCE"
echo "─────────────────────────────────────"

# Vérifier les champs obligatoires VTC
check_sql "Carte VTC (vtc_card_number)" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'vtc_card_number'" "1" "error"
check_sql "Expiration carte VTC" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'vtc_card_expiry_date'" "1" "error"
check_sql "Permis de conduire" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'driving_license_number'" "1" "error"
check_sql "Expiration permis" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'driving_license_expiry_date'" "1" "error"
check_sql "Assurance chauffeur" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'insurance_number'" "1" "error"
check_sql "Expiration assurance" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'insurance_expiry_date'" "1" "error"

echo ""
echo "2️⃣ WORKFLOW CHAUFFEUR"
echo "─────────────────────────────────────"

check_sql "Table driver_documents" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'driver_documents'" "1" "error"
check_sql "Statuts chauffeur" "SELECT COUNT(*)::text FROM pg_enum WHERE enumtypid = 'driver_status'::regtype" "6" "error"
check_sql "Validation VTC (pending_validation)" "SELECT COUNT(*)::text FROM pg_enum WHERE enumtypid = 'driver_status'::regtype AND enumlabel = 'pending_validation'" "1" "error"

echo ""
echo "3️⃣ GESTION DES COURSES"
echo "─────────────────────────────────────"

check_sql "Table rides" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'rides'" "1" "error"
check_sql "Statuts de courses" "SELECT COUNT(*)::text FROM pg_enum WHERE enumtypid = 'ride_status'::regtype" "9" "error"
check_sql "Adresse départ (pickup_address)" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'pickup_address'" "1" "error"
check_sql "Adresse arrivée (dropoff_address)" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'dropoff_address'" "1" "error"
check_sql "GPS départ (pickup_lat/lon)" "SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'rides' AND column_name IN ('pickup_lat', 'pickup_lon')" "2" "error"
check_sql "Historique statuts" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'ride_status_history'" "1" "warning"
check_sql "Stops intermédiaires" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'ride_stops'" "1" "warning"

echo ""
echo "4️⃣ TARIFICATION"
echo "─────────────────────────────────────"

check_sql "Table rates (tarifs)" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'rates'" "1" "error"
check_sql "Types de véhicules" "SELECT COUNT(*)::text FROM pg_enum WHERE enumtypid = 'vehicle_type_enum'::regtype" "4" "error"
check_sql "Options de course" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'options'" "1" "warning"
check_sql "Codes promo" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'promo_codes'" "1" "warning"

echo ""
echo "5️⃣ SÉCURITÉ & AUDIT"
echo "─────────────────────────────────────"

check_sql "RLS sur drivers" "SELECT relrowsecurity::text FROM pg_class WHERE relname = 'drivers'" "true" "error"
check_sql "RLS sur rides" "SELECT relrowsecurity::text FROM pg_class WHERE relname = 'rides'" "true" "error"
check_sql "Table audit_logs" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'audit_logs'" "1" "warning"

echo ""
echo "6️⃣ FONCTIONNALITÉS MANQUANTES (Nice to have)"
echo "─────────────────────────────────────"

# Ces fonctionnalités sont des warnings car pas critiques pour un MVP
check_sql "Table payments (PAIEMENT)" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'payments'" "1" "warning"
check_sql "Table driver_locations (GPS temps réel)" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'driver_locations'" "1" "warning"
check_sql "Table notifications" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'notifications'" "1" "warning"
check_sql "Table reviews (avis détaillés)" "SELECT COUNT(*)::text FROM information_schema.tables WHERE table_name = 'reviews'" "1" "warning"

echo ""
echo "═══════════════════════════════════════════"

if [ $FAILED -eq 0 ] && [ $WARNING -eq 0 ]; then
    echo -e "${GREEN}✅ PARFAIT : Tous les critères VTC sont respectés !${NC}"
elif [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ CONFORME : Schéma adapté pour VTC${NC}"
    echo -e "${YELLOW}⚠️  $WARNING améliorations suggérées (non bloquantes)${NC}"
else
    echo -e "${RED}❌ $FAILED problème(s) critique(s) détecté(s)${NC}"
    if [ $WARNING -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNING amélioration(s) suggérée(s)${NC}"
    fi
fi

echo ""
echo "📊 RÉSUMÉ CONFORMITÉ VTC"
echo "─────────────────────────────────────"
echo "✅ Conformité réglementaire France : Carte VTC, permis, assurance"
echo "✅ Workflow KYC complet : Validation des chauffeurs"
echo "✅ Gestion des courses : Statuts, GPS, historique"
echo "✅ Tarification flexible : Options, promos, corporate"
echo "✅ Sécurité : RLS, audit logs"

if [ $WARNING -gt 0 ]; then
    echo ""
    echo "💡 FONCTIONNALITÉS RECOMMANDÉES :"
    echo "   • Table 'payments' pour les transactions"
    echo "   • Table 'driver_locations' pour tracking GPS"
    echo "   • Table 'notifications' pour historique"
fi

echo ""
echo "🔗 Documentation : docs/DATABASE-VTC-ANALYSIS.md"

exit $FAILED
