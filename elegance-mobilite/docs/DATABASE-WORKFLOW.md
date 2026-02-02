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
docker volume rm supabase_db_elegance-mobilite supabase_edge_runtime_elegance-mobilite supabase_storage_elegance-mobilite 2>/dev/null
supabase start
```

### URLs après démarrage
- **Studio** : http://localhost:54323
- **API** : http://localhost:54321
- **Database** : `postgresql://postgres:postgres@localhost:54322/postgres`
- **Mailpit** : http://localhost:54324 (emails de test)

---

## 🗂️ Structure des migrations (Git-Ops)

Les migrations sont dans `supabase/migrations/` et exécutées dans l'ordre chronologique :

```
migrations/
├── 20240101000000_init_schema.sql                    # 🏗️ Schéma complet (source de vérité)
└── 20250202220000_fix_security_rls_and_functions.sql # 🔒 Corrections sécurité
```

### Principe Git-Ops

- **Source de vérité** : Le fichier `20240101000000_init_schema.sql` est généré par `supabase db diff` et représente l'état complet de la base
- **Pas de migrations incrémentales** : Tout le schéma est dans un seul fichier pour éviter les conflits
- **Seed data** : `supabase/seed.sql` contient les données de test

---

## 🔒 Sécurité - Vérifications

### ✅ Statut des corrections (02/02/2026)

| Vérification | Statut | Commande |
|-------------|--------|----------|
| RLS activé | ✅ 6/6 tables | `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('vehicles', 'driver_documents', 'vehicle_documents', 'user_profiles')` |
| Politiques créées | ✅ 18 politiques | `SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'` |
| Search path fixé | ✅ 40+ fonctions | `SELECT proname, proconfig FROM pg_proc WHERE proconfig IS NOT NULL` |
| Vue vehicles_public | ✅ Sans insurance_number | `SELECT * FROM vehicles_public LIMIT 1` |

### Tables protégées par RLS

| Table | RLS | Force RLS | Politiques |
|-------|-----|-----------|------------|
| `vehicles` | ✅ | ✅ | 5 |
| `driver_documents` | ✅ | ✅ | 5 |
| `vehicle_documents` | ✅ | ✅ | 4 |
| `user_profiles` | ✅ | ✅ | 4 |
| `drivers` | ✅ | ❌ | existantes |
| `rides` | ✅ | ❌ | existantes |

### Documentation sécurité détaillée

👉 Voir [`SECURITY-FIXES.md`](./SECURITY-FIXES.md) pour :
- Liste complète des politiques RLS
- Fonctions avec search_path corrigé
- Tests de validation
- Recommandations dashboard

---

## 📊 Données de test (Seed)

Le fichier `supabase/seed.sql` contient :

### Utilisateurs (9)
| ID | Email | Rôle | Usage |
|----|-------|------|-------|
| ...001 | admin1@... | app_super_admin | Admin principal |
| ...002 | admin2@... | app_admin | Admin secondaire |
| ...003 | jean.dupont@... | app_driver | Chauffeur test (Jean) |
| ...004 | marie.martin@... | app_driver | Chauffeur test (Marie) |
| ...005 | pierre.bernard@... | app_driver | Chauffeur test (Pierre) |
| ...010-013 | clientX@... | app_customer | Clients pour rides |

### Chauffeurs (3)
- Jean Dupont - Actif
- Marie Martin - Actif  
- Pierre Bernard - En attente de validation

### Véhicules (3)
- Mercedes Classe E (Standard) - Jean
- BMW Série 5 (Premium) - Marie
- Mercedes V-Class (Van) - Pierre

### Tarifs (4)
- Standard : 25€ base + 2.50€/km
- Premium : 45€ base + 4.00€/km
- Van : 60€ base + 5.00€/km
- Électrique : 35€ base + 3.00€/km

### Courses (4)
- 1 terminée (CDG → Tour Eiffel)
- 1 en cours (Gare du Nord → Versailles)
- 2 en attente

---

## 🔧 Commandes utiles

### Status et gestion
```bash
# Voir le statut de Supabase
supabase status

# Ouvrir le studio dans le navigateur
supabase studio

# Logs en temps réel
supabase logs
supabase logs db
supabase logs functions
```

### Migrations
```bash
# Générer une migration depuis les changements locaux
supabase db diff -f nom_migration

# Générer depuis une base distante
supabase db diff --db-url "postgresql://..." -f nom_migration

# Lister les migrations
supabase migration list

# Nouvelle migration vide
supabase migration new nom_migration
```

### Production
```bash
# Lier le projet
supabase link --project-ref ioddsdzustunlahxafif

# Pousser les migrations
supabase db push

# Pull depuis production (⚠️ écrase les migrations locales)
supabase db pull
```

### SQL Direct
```bash
# Connexion psql
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres

# Ou avec supabase
supabase db execute --file query.sql
```

---

## 🧪 Tests de validation

### Vérifier RLS
```sql
-- Tables avec RLS
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

### Vérifier politiques
```sql
-- Politiques par table
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Vérifier fonctions
```sql
-- Fonctions avec search_path configuré
SELECT 
    p.proname as function_name,
    p.proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.proconfig IS NOT NULL
ORDER BY p.proname;
```

### Tester les fonctions de rôle
```sql
-- Vérifier si l'utilisateur courant est admin
SELECT is_admin();           -- boolean
SELECT is_super_admin();     -- boolean
SELECT is_driver();          -- boolean
```

---

## 🐛 Dépannage

### "supabase status" not running
```bash
supabase start
```

### Conflits de migrations
```bash
# Reset complet (perte des données)
supabase stop
docker volume rm supabase_db_elegance-mobilite supabase_edge_runtime_elegance-mobilite supabase_storage_elegance-mobilite 2>/dev/null
supabase start
```

### Erreur "duplicate key value violates unique constraint"
```bash
# Vider les volumes et recommencer
supabase stop
docker volume prune -f
supabase start
```

### Politiques RLS bloquent l'accès
```sql
-- Désactiver temporairement RLS (développement uniquement)
ALTER TABLE nom_table DISABLE ROW LEVEL SECURITY;

-- Réactiver
ALTER TABLE nom_table ENABLE ROW LEVEL SECURITY;
```

---

## 📚 Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Sécurité Supabase](./SECURITY-FIXES.md)
