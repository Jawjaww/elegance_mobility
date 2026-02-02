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
├── 20240101000000_init_schema.sql                    # 🏗️ Schéma complet VTC
├── 20250202220000_fix_security_rls_and_functions.sql # 🔒 Corrections sécurité
└── 20250202230000_add_vtc_nice_to_have.sql          # ✨ Fonctionnalités VTC complètes
```

### Schéma de base (20240101000000_init_schema.sql)

Tables métiers essentielles pour un service VTC :

| Domaine | Tables | Description |
|---------|--------|-------------|
| **Auth** | `users`, `user_profiles` | Authentification et profils |
| **Chauffeurs** | `drivers`, `driver_documents`, `driver_rewards` | KYC complet VTC |
| **Véhicules** | `vehicles`, `vehicle_documents` | Gestion parc auto |
| **Courses** | `rides`, `ride_stops`, `ride_status_history` | Réservations et suivi |
| **Tarification** | `rates`, `options`, `promo_codes`, `promo_usages`, `corporate_discounts`, `seasonal_promotions` | Pricing flexible |
| **Audit** | `audit_logs`, `status_reason_categories` | Logs et monitoring |

### Fonctionnalités additionnelles (20250202230000_add_vtc_nice_to_have.sql)

Tables pour une expérience VTC complète :

| Table | Description | Use Case |
|-------|-------------|----------|
| `payments` | Transactions Stripe/espèces/corporate | Paiement intégré |
| `driver_locations` | GPS temps réel des chauffeurs | Tracking client |
| `notifications` | Push/email/sms/in-app | Communication |
| `reviews` | Avis détaillés client↔chauffeur | Confiance & qualité |
| `favorite_addresses` | Adresses favorites (max 10) | Clients réguliers |

---

## ✅ Vérification du Setup

### Script de vérification complet

```bash
# Vérifier toutes les fonctionnalités
./scripts/verify-setup.sh

# Vérifier la conformité VTC spécifique
./scripts/verify-vtc-compliance.sh
```

### Résultats attendus

```
✅ RLS activé sur les tables critiques
✅ 18+ politiques RLS créées
✅ 50+ fonctions avec search_path fixé
✅ Conformité réglementaire VTC (France)
✅ Fonctionnalités de paiement
✅ Tracking GPS temps réel
```

---

## 🔒 Sécurité - Vérifications

### ✅ Statut des corrections

| Vérification | Statut | Commande |
|-------------|--------|----------|
| RLS activé | ✅ 6+ tables | `SELECT relname, relrowsecurity FROM pg_class` |
| Politiques créées | ✅ 18+ | `SELECT COUNT(*) FROM pg_policies` |
| Search path fixé | ✅ 50+ fonctions | `SELECT proname, proconfig FROM pg_proc` |
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
| `payments` | ✅ | ✅ | 2 |
| `driver_locations` | ✅ | ✅ | 3 |
| `notifications` | ✅ | ✅ | 2 |
| `reviews` | ✅ | ✅ | 4 |

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

## 🚗 Spécificités VTC

### Conformité Réglementaire (France)

Le schéma est **conforme à la réglementation VTC française** :

| Exigence | Implémentation |
|----------|----------------|
| Carte professionnelle VTC | `drivers.vtc_card_number` |
| Permis de conduire | `drivers.driving_license_number` |
| Assurance | `drivers.insurance_number` |
| Dates d'expiration | Contrôles automatiques |
| Validation KYC | Workflow `pending_validation` → `active` |

### Workflow Chauffeur

```
Inscription (incomplete)
    ↓
Complète profil (pending_validation)
    ↓
Validation Admin (active)
    ↓
Acceptation de courses
```

### Fonctions métier VTC

| Fonction | Description |
|----------|-------------|
| `calculate_ride_price()` | Calcul automatique du prix |
| `can_driver_accept_rides(uuid)` | Vérifie disponibilité |
| `check_driver_profile_completeness(uuid)` | Vérifie KYC (38% → 100%) |
| `create_pending_driver(...)` | Création avec validation |
| `calculate_driver_rating(uuid)` | Note moyenne du chauffeur |
| `mark_notification_read(uuid)` | Marquer notification lue |

👉 Voir [`DATABASE-VTC-ANALYSIS.md`](./DATABASE-VTC-ANALYSIS.md) pour l'analyse complète.

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
- [Analyse VTC](./DATABASE-VTC-ANALYSIS.md)
