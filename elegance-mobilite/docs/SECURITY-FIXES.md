# Corrections de Sécurité - Supabase

## Résumé des changements

Cette mise à jour corrige les problèmes de sécurité identifiés par l'audit Supabase.

## Problèmes corrigés

### 1. Row Level Security (RLS) - Tables critiques

| Table | RLS Activé | RLS Forcé | Statut |
|-------|-----------|-----------|--------|
| `vehicles` | ✅ | ✅ | Sécurisé |
| `driver_documents` | ✅ | ✅ | Sécurisé |
| `vehicle_documents` | ✅ | ✅ | Sécurisé |
| `user_profiles` | ✅ | ✅ | Sécurisé |
| `drivers` | ✅ | ❌ | Sécurisé |
| `rides` | ✅ | ❌ | Sécurisé |

### 2. Politiques RLS créées

#### `vehicles`
- `drivers_view_own_vehicles` - Chauffeurs peuvent voir leurs véhicules
- `drivers_insert_own_vehicles` - Chauffeurs peuvent créer leurs véhicules
- `drivers_update_own_vehicles` - Chauffeurs peuvent modifier leurs véhicules
- `drivers_delete_own_vehicles` - Chauffeurs peuvent supprimer leurs véhicules
- `admin_all_access_vehicles` - Admins ont accès complet

#### `driver_documents`
- `drivers_view_own_documents` - Chauffeurs peuvent voir leurs documents
- `drivers_insert_own_documents` - Chauffeurs peuvent ajouter des documents
- `drivers_update_own_documents` - Chauffeurs peuvent modifier leurs documents
- `drivers_delete_own_documents` - Chauffeurs peuvent supprimer leurs documents
- `admin_all_access_driver_documents` - Admins ont accès complet

#### `vehicle_documents`
- `drivers_view_vehicle_documents` - Chauffeurs peuvent voir les documents de leurs véhicules
- `drivers_insert_vehicle_documents` - Chauffeurs peuvent ajouter des documents
- `drivers_update_vehicle_documents` - Chauffeurs peuvent modifier les documents
- `admin_all_access_vehicle_documents` - Admins ont accès complet

#### `user_profiles`
- `users_view_own_profile` - Utilisateurs peuvent voir leur profil
- `users_update_own_profile` - Utilisateurs peuvent modifier leur profil
- `admin_view_all_profiles` - Admins peuvent voir tous les profils
- `admin_update_all_profiles` - Admins peuvent modifier tous les profils

### 3. Colonnes sensibles protégées

- `vehicles.insurance_number` - Accessible uniquement par le propriétaire et les admins
- `drivers.insurance_number` - Accessible uniquement par le chauffeur et les admins

Une vue `vehicles_public` a été créée pour exposer uniquement les colonnes non sensibles.

### 4. Search Path des fonctions

Toutes les fonctions ont maintenant un `search_path` explicite pour éviter les attaques par injection via le search path :

```sql
-- Exemple
ALTER FUNCTION public.is_admin() SET search_path = public, auth;
```

Fonctions corrigées :
- `assign_user_role_on_signup()`
- `can_driver_accept_rides(uuid)`
- `check_driver_profile_completeness(uuid)`
- `create_pending_driver(...)`
- `is_admin()` / `is_super_admin()` / `is_driver()`
- Et 40+ autres fonctions...

## Recommandations supplémentaires

### À configurer dans le dashboard Supabase :

1. **Activer la vérification des mots de passe compromis**
   - Authentication > Policies > Passwords > Check compromised passwords

2. **Activer MFA (Multi-Factor Authentication)**
   - Authentication > Providers > Phone (pour SMS OTP)
   - Ou MFA > App Authenticator (TOTP)

3. **Mettre à jour PostgreSQL**
   - Project Settings > Database > Upgrade to latest version

## Migration

```bash
# Appliquer les corrections
supabase db reset

# Ou sur un projet lié
supabase db push
```

## Vérification

```sql
-- Vérifier RLS sur les tables
SELECT 
    c.relname as table,
    c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('vehicles', 'driver_documents', 'vehicle_documents', 'user_profiles');

-- Vérifier les politiques
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Notes

- Les anciennes politiques obsolètes ont été supprimées
- Toutes les nouvelles politiques sont permissives (PERMISSIVE)
- Le rôle `authenticated` est requis pour toutes les opérations
- Les admins (`app_admin`, `app_super_admin`) ont des droits étendus
