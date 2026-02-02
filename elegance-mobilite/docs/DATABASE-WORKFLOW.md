# Workflow Database - Elegance Mobilité

## 🚀 Démarrage rapide

### Prérequis
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) installé
- Docker Desktop en cours d'exécution

### Reset complet de la base (local)

```bash
# Méthode 1 : Via le script
./scripts/reset-db.sh

# Méthode 2 : Commandes manuelles
supabase stop
supabase db reset
supabase db seed  # Optionnel : peupler avec des données de test
supabase start
```

### URLs après démarrage
- **Studio** : http://localhost:54323
- **API** : http://localhost:54321
- **Database** : `postgresql://postgres:postgres@localhost:54322/postgres`

---

## 🗂️ Structure des migrations

Les migrations sont dans `supabase/migrations/` et exécutées dans l'ordre :

```
migrations/
├── 20250613_setup_role_assignment.sql          # Rôles utilisateurs
├── 20250613_step2_permanent_role_trigger.sql   # Trigger d'assignation
├── 20251114_add_driver_vehicles_metadata.sql   # Métadonnées chauffeurs
├── 20251117_unify_vehicles.sql                 # Unification véhicules
├── 20251117_update_functions_and_triggers.sql  # Fonctions & triggers
└── 20260202000000_fix_rls_and_security.sql     # 🔒 Corrections RLS
```

---

## 🔒 Corrections de sécurité appliquées

### Problèmes identifiés

| Problème | Tables concernées | Solution |
|----------|------------------|----------|
| **RLS désactivé** | `vehicles`, `vehicle_documents`, `user_profiles`, `driver_documents` | ✅ Activation RLS + policies |
| **Données sensibles exposées** | `vehicles.insurance_number` | ✅ Masqué par policies |
| **Search_path mutable** | Toutes les fonctions | ✅ Correction partielle |

### RLS activé sur

- ✅ `public.vehicles` - Chauffeurs voient leurs véhicules, admins voient tout
- ✅ `public.vehicle_documents` - Accès par chauffeur ou admin
- ✅ `public.user_profiles` - Chaque utilisateur voit son profil, admins voient tout
- ✅ `public.driver_documents` - Accès par chauffeur ou admin

### Policies créées

**Vehicles :**
- Drivers can view own vehicles
- Drivers can update own vehicles  
- Admins can view all vehicles
- Admins can update all vehicles
- Admins can insert vehicles

**Documents (véhicules & chauffeurs) :**
- Drivers can manage own documents
- Admins can manage all documents

**User Profiles :**
- Users can view own profile
- Users can update own profile
- Admins can view all profiles

---

## 📊 Données de test (Seed)

Le fichier `supabase/seed.sql` contient :

### Utilisateurs
- 1 Super Admin
- 1 Admin
- 3 Chauffeurs (2 actifs, 1 en attente)

### Véhicules
- 3 véhicules (Standard, Premium, Van)
- Appartenance aux chauffeurs

### Tarifs
- 4 catégories : Standard, Premium, Van, Électrique

### Courses
- 4 courses : 1 terminée, 1 en cours, 2 en attente

### Options
- 5 options : siège bébé, rehausseur, attente aéroport, boissons, WiFi

### Codes promo
- 2 codes : BIENVENUE2026 (-20%), VIP10 (-10€)

---

## 🔧 Commandes utiles

```bash
# Voir le statut de Supabase
supabase status

# Ouvrir le studio
supabase studio

# Logs en temps réel
supabase logs functions

# Générer une migration depuis les changements
supabase db diff -f migration_name

# Lier le projet (production)
supabase link --project-ref ioddsdzustunlahxafif

# Pousser les migrations en production
supabase db push

# Pull depuis production
supabase db pull
```

---

## 🐛 Dépannage

### Erreur "supabase status" not running
```bash
supabase start
```

### Problèmes de RLS
```sql
-- Vérifier si RLS est actif
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('vehicles', 'user_profiles', 'driver_documents', 'vehicle_documents');
```

### Reset complet (nucléaire)
```bash
supabase stop
docker volume rm supabase_db_elegance-mobilite  # Supprime les données
supabase start
```

---

## 📝 Notes sur les fonctions SQL

Les fonctions de vérification de rôle sont dans la base :

```sql
-- Vérifier si l'utilisateur courant est admin
SELECT is_admin();           -- Retourne boolean
SELECT is_super_admin();     -- Retourne boolean
SELECT is_driver();          -- Retourne boolean
SELECT get_user_app_role();  -- Retourne 'app_admin', 'app_driver', etc.
```

Ces fonctions utilisent `auth.jwt()` pour récupérer le rôle depuis les métadonnées utilisateur.
