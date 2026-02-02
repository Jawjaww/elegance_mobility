# Migrations Supabase - Historique

> **Historique des migrations SQL du projet Élégance Mobilité.**  
> **Source de vérité actuelle:** `supabase/migrations/20260201234023_supabase/migrations/init.sql.sql`

---

## 📋 Vue d'Ensemble

Ce dossier contient l'historique des migrations SQL appliquées à la base de données PostgreSQL.

```
⚠️ RÈGLE IMPORTANTE :
Le fichier init.sql.sql (3590 lignes) est la source de vérité actuelle.
Toute nouvelle migration doit être créée via : supabase migration new <nom>
```

---

## 🗂️ Migrations Historiques

### Ordre Chronologique

| Date | Fichier | Description | Statut |
|------|---------|-------------|--------|
| 2025-02-01 | `20250201_add_get_user_role_rpc.sql` | Fonction RPC `get_user_role()` | ✅ Appliquée |
| 2025-06-13 | `20250613_setup_role_assignment.sql` | Trigger d'assignation des rôles | ✅ Appliquée |
| 2025-06-13 | `20250613_step2_permanent_role_trigger.sql` | Trigger permanent (fallback) | ✅ Appliquée |
| 2025-11-14 | `20251114_add_driver_vehicles_metadata.sql` | Métadonnées véhicules VTC | ✅ Appliquée |
| 2025-11-17 | `20251117_unify_vehicles.sql` | Unification table `vehicles` | ✅ Appliquée |
| 2025-11-17 | `20251117_update_functions_and_triggers.sql` | Màj fonctions post-unification | ✅ Appliquée |

---

## 🔍 Détails des Migrations

### 1. `20250201_add_get_user_role_rpc.sql`
**Date:** 2025-02-01  
**Objectif:** Permettre au client de récupérer son rôle applicatif via RPC

```sql
-- Fonction créée:
get_user_role() RETURNS text

-- Utilisation:
SELECT * FROM public.get_user_role();
-- Retourne: 'app_driver' | 'app_customer' | 'app_admin' | 'app_super_admin'
```

**Dépendances:** Aucune  
**Tables impactées:** Aucune (fonction utilitaire)  
**Note:** Alternative à `getAppRole()` côté client

---

### 2. `20250613_setup_role_assignment.sql`
**Date:** 2025-06-13  
**Objectif:** Trigger pour assigner automatiquement les rôles lors de l'inscription

```sql
-- Fonction créée:
assign_user_role_on_signup() RETURNS trigger

-- Trigger créé:
assign_user_role_trigger BEFORE INSERT ON auth.users

-- Mapping:
-- portal_type='driver'   → raw_app_meta_data.role = 'app_driver'
-- portal_type='customer' → raw_app_meta_data.role = 'app_customer'
-- portal_type='admin'    → raw_app_meta_data.role = 'app_admin'
```

**Dépendances:** Nécessite `portal_type` dans `user_metadata` lors de l'inscription  
**Tables impactées:** `auth.users`  
**Important:** Lève une exception si `portal_type` est absent

---

### 3. `20250613_step2_permanent_role_trigger.sql`
**Date:** 2025-06-13  
**Objectif:** Trigger fallback pour l'assignation des rôles (déprécié)

```sql
-- Fonction créée:
assign_default_app_driver_role() RETURNS trigger

-- Trigger créé:
assign_app_driver_role_trigger BEFORE INSERT ON auth.users

-- Logique:
-- Si driver → 'app_driver'
-- Sinon → 'app_customer'
```

**⚠️ Statut:** DÉPRÉCIÉ - Gardé pour compatibilité  
**Note:** La migration 20250613_setup_role_assignment.sql est la version principale

---

### 4. `20251114_add_driver_vehicles_metadata.sql`
**Date:** 2025-11-14  
**Objectif:** Ajouter les métadonnées essentielles pour véhicules VTC

```sql
-- Colonnes ajoutées à vehicles:
owner_name              text
owner_user_id           uuid
registration_number     text
fuel_type               text
color                   text
first_registration_date date
insurance_number        text
vin                     text
seats                   integer

-- Indexes créés:
idx_vehicles_license_plate_lower
idx_vehicles_registration_number_lower
```

**Tables impactées:** `vehicles`  
**Note:** Script transactionnel (BEGIN/COMMIT)

---

### 5. `20251117_unify_vehicles.sql`
**Date:** 2025-11-17  
**Objectif:** Unifier le modèle de données véhicules

```sql
-- Actions:
1. DROP TABLE IF EXISTS vehicles CASCADE (ancienne version)
2. ALTER TABLE driver_vehicles RENAME TO vehicles
3. Ajout colonnes VTC (owner_user_id, owner_name, registration_number, etc.)
4. CREATE TABLE vehicle_documents (normalisation des documents)
5. Migration des documents JSON vers table normalisée
```

**Tables impactées:** 
- `vehicles` (suppression/recréation)
- `vehicle_documents` (nouvelle)

**⚠️ Destructif:** DROP CASCADE sur l'ancienne table `vehicles`  
**Indexes créés:**
- `idx_vehicles_owner_user_id`
- `idx_vehicles_driver_id`
- `idx_vehicles_license_plate`
- `idx_vehicle_documents_vehicle_id`
- `idx_vehicle_documents_type`

---

### 6. `20251117_update_functions_and_triggers.sql`
**Date:** 2025-11-17  
**Objectif:** Mettre à jour les fonctions après unification de `vehicles`

```sql
-- Fonctions mises à jour:
1. handle_driver_status_updates()          -- Support table vehicles
2. debug_driver_completeness(uuid)         -- Jointure vehicles
3. check_driver_profile_completeness(uuid) -- Jointure vehicles
4. get_driver_completeness_details(uuid)   -- Jointure vehicles

-- Triggers recréés:
1. trigger_driver_status_update_on_vehicle  (sur vehicles)
2. trigger_driver_status_update_on_document (sur driver_documents)
```

**Dépendances:** Nécessite `20251117_unify_vehicles.sql`  
**Tables impactées:** `vehicles`, `driver_documents`, `drivers`

---

## 🔄 Workflow de Migration

### Créer une Nouvelle Migration

```bash
# 1. Créer la migration
supabase migration new nom_descriptif

# 2. Éditer le fichier généré
# supabase/migrations/YYYYMMDDHHMMSS_nom_descriptif.sql

# 3. Tester localement
supabase db reset

# 4. Pousser vers Supabase
supabase db push

# 5. Mettre à jour ce README
```

### Format de Nommage

```
YYYYMMDD_description_breve.sql

Exemples:
✅ 20250201_add_get_user_role_rpc.sql
✅ 20251117_unify_vehicles.sql
❌ add_column.sql
❌ 2025-02-01-modif.sql
```

---

## 📝 Template de Migration

```sql
-- Migration: description_courte
-- Date: YYYY-MM-DD
-- Objectif: Décrire ce que fait cette migration

-- Section 1: Tables
BEGIN;

-- Modifications ici

COMMIT;

-- Section 2: Indexes
CREATE INDEX IF NOT EXISTS idx_nom ON table(colonne);

-- Section 3: RLS
ALTER TABLE table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nom_policy" ON table
    FOR operation
    TO role
    USING (condition);

-- Section 4: Vérification
SELECT 'Migration appliquée' as status;
```

---

## ⚠️ Migrations à Risque

| Migration | Risque | Précaution |
|-----------|--------|------------|
| `20251117_unify_vehicles.sql` | Perte de données | Backup avant exécution |
| `20250613_setup_role_assignment.sql` | Bloque inscriptions | Vérifier `portal_type` dans le code |

---

## 📚 Documentation Liée

- [DATABASE-SCHEMA.md](../DATABASE-SCHEMA.md) - Schéma complet de la BDD
- [GITOPS-WORKFLOW.md](../GITOPS-WORKFLOW.md) - Workflow de déploiement
- [ARCHITECTURE-ROLES.md](../ARCHITECTURE-ROLES.md) - Système de rôles

---

**Dernière mise à jour:** Février 2026  
**Mainteneur:** Équipe Élégance Mobilité
