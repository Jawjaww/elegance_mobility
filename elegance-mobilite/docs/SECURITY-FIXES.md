# Corrections de Sécurité - Supabase

## ✅ Statut des vérifications

Dernière vérification : 2 février 2026

| Test | Statut | Détails |
|------|--------|---------|
| RLS activé sur tables critiques | ✅ | 6/6 tables sécurisées |
| Politiques RLS créées | ✅ | 18 politiques actives |
| Search path fonctions | ✅ | 40+ fonctions corrigées |
| Vue vehicles_public | ✅ | Exclut insurance_number |
| Fonctions opérationnelles | ✅ | Tous les tests passent |

---

## Résumé des changements

Cette mise à jour corrige les problèmes de sécurité identifiés par l'audit Supabase.

## 1. Row Level Security (RLS)

### Tables sécurisées

| Table | RLS Activé | RLS Forcé | Statut |
|-------|-----------|-----------|--------|
| `vehicles` | ✅ | ✅ | Sécurisé |
| `driver_documents` | ✅ | ✅ | Sécurisé |
| `vehicle_documents` | ✅ | ✅ | Sécurisé |
| `user_profiles` | ✅ | ✅ | Sécurisé |
| `drivers` | ✅ | ❌ | Sécurisé |
| `rides` | ✅ | ❌ | Sécurisé |

### Commande de vérification

```sql
SELECT 
    c.relname as table,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('vehicles', 'driver_documents', 'vehicle_documents', 'user_profiles')
AND c.relkind = 'r';
```

## 2. Politiques RLS (18 politiques)

### `vehicles` (5 politiques)
- `drivers_view_own_vehicles` - SELECT par chauffeur propriétaire
- `drivers_insert_own_vehicles` - INSERT par chauffeur
- `drivers_update_own_vehicles` - UPDATE par chauffeur propriétaire
- `drivers_delete_own_vehicles` - DELETE par chauffeur propriétaire
- `admin_all_access_vehicles` - ALL pour admins

### `driver_documents` (5 politiques)
- `drivers_view_own_documents` - SELECT
- `drivers_insert_own_documents` - INSERT
- `drivers_update_own_documents` - UPDATE
- `drivers_delete_own_documents` - DELETE
- `admin_all_access_driver_documents` - ALL pour admins

### `vehicle_documents` (4 politiques)
- `drivers_view_vehicle_documents` - SELECT
- `drivers_insert_vehicle_documents` - INSERT
- `drivers_update_vehicle_documents` - UPDATE
- `admin_all_access_vehicle_documents` - ALL pour admins

### `user_profiles` (4 politiques)
- `users_view_own_profile` - SELECT son propre profil
- `users_update_own_profile` - UPDATE son propre profil
- `admin_view_all_profiles` - SELECT tous profils (admin)
- `admin_update_all_profiles` - UPDATE tous profils (admin)

### Commande de vérification

```sql
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 3. Colonnes sensibles protégées

### `insurance_number` masquée

- `vehicles.insurance_number` - Accessible uniquement via API directe (RLS protégé)
- `drivers.insurance_number` - Accessible uniquement par propriétaire et admins

### Vue sécurisée `vehicles_public`

Exclut la colonne sensible `insurance_number` :

```sql
-- Colonnes exposées (22 colonnes)
id, driver_id, make, model, year, license_plate, color, 
vehicle_type, seats, is_primary, photos, created_at, updated_at,
owner_user_id, owner_name, registration_number, vin, fuel_type,
first_registration_date, validation_status, submitted_by, submitted_at

-- Colonne EXCLUE
insurance_number ❌
```

### Commande de vérification

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'vehicles_public' 
AND table_schema = 'public';
```

## 4. Search Path des fonctions

### Fonctions critiques corrigées

| Fonction | Search Path |
|----------|-------------|
| `is_admin()` | public, auth |
| `is_super_admin()` | public, auth |
| `assign_user_role_on_signup()` | public, auth |
| `can_driver_accept_rides(uuid)` | public |
| `check_driver_profile_completeness(uuid)` | public |
| `create_pending_driver(...)` | public, auth |
| `handle_new_user()` | public, auth |

### Total : 40+ fonctions corrigées

### Commande de vérification

```sql
SELECT 
    p.proname as function_name,
    p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proconfig IS NOT NULL
ORDER BY p.proname;
```

## 5. Tests de validation

### Test des fonctions

```sql
-- Vérifier que les fonctions s'exécutent
SELECT is_admin();
SELECT is_super_admin();
SELECT check_is_admin();

-- Tester avec un driver existant
SELECT * FROM check_driver_profile_completeness(
    (SELECT user_id FROM drivers LIMIT 1)
);
```

### Test RLS (simulation)

```sql
-- En tant qu'utilisateur anonyme (devrait échouer)
SET ROLE anon;
SELECT * FROM vehicles; -- ❌ Accès refusé

-- En tant qu'utilisateur authentifié (avec RLS)
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
SELECT * FROM vehicles; -- ✅ Voir ses propres véhicules uniquement
```

## 6. Migration

### Local

```bash
# Reset complet (migrations + seed)
supabase db reset

# Vérifier le statut
supabase status
```

### Production

```bash
# Pousser les migrations
supabase db push

# Vérifier les migrations appliquées
supabase migration list
```

## 7. Recommandations supplémentaires (Dashboard)

### À configurer manuellement dans Supabase Dashboard :

| Problème | Solution | Emplacement |
|----------|----------|-------------|
| Password breach detection | Activer "Check compromised passwords" | Auth > Policies > Passwords |
| MFA | Activer SMS ou TOTP | Auth > Providers > Phone / MFA |
| PostgreSQL version | Upgrade vers la dernière version | Project Settings > Database |

## 8. Dépannage

### Erreur : "relation does not exist"

```bash
# Redémarrer Supabase
supabase stop
supabase start
```

### Erreur : "policy already exists"

Les anciennes politiques sont automatiquement supprimées par la migration avec `DROP POLICY IF EXISTS`.

### Vérifier les logs

```bash
# Logs de la base de données
supabase db logs

# Logs complets
supabase logs
```

## Références

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
