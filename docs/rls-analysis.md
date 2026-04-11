# Politiques RLS (Row Level Security) - Référence Complète

> **Source de vérité:** `init.sql.sql` - Toutes les CREATE POLICY  
> **Date de mise à jour:** Février 2026

---

## 📋 Vue d'Ensemble

Ce document liste **toutes les politiques RLS** définies dans la base de données, organisées par table.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRINCIPE RLS                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Toutes les tables ont RLS activé (ENABLE ROW LEVEL SECURITY) │
│  2. Par défaut : aucun accès sans policy explicite              │
│  3. Rôle vérifié via : auth.jwt() -> 'app_metadata' ->> 'role'  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tables avec RLS

### 1. **drivers** (Chauffeurs)

| Policy | Opération | Rôle/Condition | Description |
|--------|-----------|----------------|-------------|
| `Admins can insert drivers` | INSERT | Admin/Super Admin | Création de chauffeurs |
| `Admins can update all drivers` | UPDATE | Admin/Super Admin | Modification complète |
| `Admins can view all drivers` | SELECT | Admin/Super Admin | Lecture totale |
| `drivers_admin_access` | ALL | Admin/Super Admin | Accès complet admin |
| `drivers_own_access` | ALL | Propriétaire | Chauffeur accède à son profil |
| `Drivers can check own completeness` | SELECT | Propriétaire | Vérifier complétude |

**SQL:**
```sql
-- Admin check
((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) 
  = ANY (ARRAY['app_admin'::text, 'app_super_admin'::text])

-- Propriétaire
user_id = auth.uid()
```

---

### 2. **rides** (Courses)

| Policy | Opération | Condition | Description |
|--------|-----------|-----------|-------------|
| `rides_admin_all` | ALL | Admin/Super Admin | Gestion complète |
| `rides_create_customer` | INSERT | Propriétaire | Client crée course |
| `rides_own_customer` | SELECT | Propriétaire | Client voit ses courses |
| `rides_update_by_customer` | UPDATE | Propriétaire + statuts autorisés | Client modifie (pending, client-canceled) |
| `rides_available_for_drivers` | SELECT | Chauffeur + pending | Chauffeur voit courses dispos |
| `rides_assigned_to_driver` | SELECT | Chauffeur assigné | Chauffeur voit ses courses |
| `rides_accept_by_driver` | UPDATE | Chauffeur + conditions | Chauffeur accepte course |
| `rides_update_assigned` | UPDATE | Chauffeur assigné | Chauffeur modifie sa course |

**SQL Exemples:**
```sql
-- Client: création
user_id = auth.uid()

-- Chauffeur: courses disponibles
driver_id IS NULL 
  AND status = 'pending'::ride_status 
  AND role = 'app_driver'

-- Chauffeur: accepter course
driver_id IS NULL 
  AND status = 'pending' 
  AND role = 'app_driver'
-- OU
 driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
```

---

### 3. **users** (Profils)

| Policy | Opération | Condition | Description |
|--------|-----------|-----------|-------------|
| `Admins can view all users` | SELECT | Admin/Super Admin | Vue totale |
| `Admins can update all users` | UPDATE | Admin/Super Admin | Modification totale |
| `admin_full_access` | ALL | Admin | Accès admin |
| `admin_full_access_users` | ALL | Admin | Accès admin (dup) |
| `Users can create own profile` | INSERT | Propriétaire | Création profil |
| `Users can view own profile` | SELECT | Propriétaire | Lecture profil |
| `Users can view their own profile` | SELECT | Propriétaire | Lecture (dup) |
| `user_read_own` | SELECT | Propriétaire | Lecture (dup) |
| `Enable users to update their own profile` | UPDATE | Propriétaire | Modification |
| `Users can update own profile` | UPDATE | Propriétaire | Modification (dup) |
| `Users can update own basic info` | UPDATE | Propriétaire | Modification (dup) |
| `Allow user updates` | UPDATE | Propriétaire + validation | Avec check_user_role_update() |

**Note:** Plusieurs policies dupliquées à nettoyer.

---

### 4. **vehicles** (Véhicules)

| Policy | Opération | Condition | Description |
|--------|-----------|-----------|-------------|
| `Admins can view all driver vehicles` | SELECT | Admin/Super Admin | Vue totale |
| `Drivers can manage own vehicles` | ALL | Propriétaire | Gestion de ses véhicules |

**SQL:**
```sql
-- Propriétaire via sous-requête
driver_id IN (
  SELECT drivers.id 
  FROM drivers 
  WHERE drivers.user_id = auth.uid()
)
```

---

### 5. **driver_documents** (Documents)

| Policy | Opération | Condition | Description |
|--------|-----------|-----------|-------------|
| `Admins can view all driver documents` | SELECT | Admin/Super Admin | Vue totale |
| `Drivers can manage own documents` | ALL | Propriétaire | Gestion de ses documents |

---

### 6. **rates** (Tarifs)

| Policy | Opération | Condition | Description |
|--------|-----------|-----------|-------------|
| `allow_read_rates` | SELECT | Authenticated | Lecture publique |
| `Allow SELECT for authenticated users` | SELECT | Authenticated | Lecture (dup) |
| `Allow SELECT for all authenticated and service role` | SELECT | Auth + Service | Lecture avec service_role |
| `Allow INSERT for authenticated users` | INSERT | Authenticated | Création |
| `Allow UPDATE for authenticated users` | UPDATE | Authenticated | Modification |
| `Allow DELETE for authenticated users` | DELETE | Authenticated | Suppression |

**Note:** RLS très permissive sur rates (à revoir?).

---

### 7. **options** (Options de course)

| Policy | Opération | Condition | Description |
|--------|-----------|-----------|-------------|
| `allow_read_options` | SELECT | Authenticated | Lecture publique |

---

### 8. **seasonal_promotions** (Promos saisonnières)

| Policy | Opération | Condition | Description |
|--------|-----------|-----------|-------------|
| `Allow SELECT for authenticated users` | SELECT | Authenticated | Lecture |
| `Allow INSERT for authenticated users` | INSERT | Authenticated | Création |
| `Allow UPDATE for authenticated users` | UPDATE | Authenticated | Modification |
| `Allow DELETE for authenticated users` | DELETE | Authenticated | Suppression |

---

## 🔍 Helpers SQL pour RLS

### Fonctions Utilisées dans les Policies

```sql
-- Vérifie si admin
public.is_admin() RETURNS BOOLEAN

-- Vérifie si super admin  
public.is_super_admin() RETURNS BOOLEAN

-- Vérifie le rôle utilisateur
public.get_user_app_role() RETURNS TEXT
```

### Extraction du Rôle dans JWT

```sql
-- Méthode standard
(auth.jwt() -> 'app_metadata'::text) ->> 'role'::text

-- Méthode alternative
(auth.jwt() ->> 'app_metadata'::text)::jsonb ->> 'role'::text
```

---

## 🧪 Tests des Policies

```sql
-- Vérifier les policies d'une table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'rides';

-- Vérifier si RLS est activé
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('drivers', 'rides', 'vehicles');
```

---

## ⚠️ Observations et Recommandations

### 1. Policies Dupliquées sur `users`
Plusieurs policies identiques ou similaires :
- `Users can view own profile` × 3
- `Users can update own profile` × 3

**Recommandation:** Nettoyer les doublons.

### 2. `rates` et `seasonal_promotions` Très Permissives
Toutes les opérations autorisées pour `authenticated`.

**Recommandation:** Restreindre aux admins pour INSERT/UPDATE/DELETE.

### 3. Complexité de `rides_accept_by_driver`
La policy est complexe avec OR et sous-requêtes.

**Recommandation:** Simplifier ou documenter clairement.

---

## 📚 Documentation Connexe

- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Structure complète des tables
- [driver-workflow.md](./driver-workflow.md) - Workflow chauffeur avec RLS
- [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) - Système de rôles

---

**Total des policies:** 47 (y compris doublons)  
**Tables avec RLS:** 18  
**Dernière mise à jour:** Février 2026
