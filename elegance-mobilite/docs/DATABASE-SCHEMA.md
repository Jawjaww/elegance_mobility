# Schéma de Base de Données - Élégance Mobilité

> **Source de vérité:** `supabase/migrations/20260201234023_supabase/migrations/init.sql.sql`  
> **Date d'analyse:** Février 2026  
> **Lignes:** 3590

---

## 📋 Vue d'Ensemble

Ce document décrit le schéma complet de la base de données PostgreSQL pour l'application Élégance Mobilité.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE BDD                            │
├─────────────────────────────────────────────────────────────────┤
│  Auth (Supabase)  │  Public Schema (Métier)                     │
│  ───────────────  │  ─────────────────────                      │
│  auth.users       │  users, drivers, vehicles                   │
│  (identité)       │  rides, ride_stops, ride_status_history     │
│                   │  rates, options, promo_codes                │
│                   │  audit_logs, corporate_discounts            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Types Énumérés (ENUMs)

```sql
discount_type_enum    -- percentage | fixed
driver_status         -- pending_validation | active | inactive | on_vacation | suspended | incomplete
promo_type_enum       -- percentage | fixed_amount
reward_type_enum      -- bonus | commission_increase
ride_status           -- pending | scheduled | in-progress | completed | client-canceled | driver-canceled | admin-canceled | no-show | delayed
vehicle_type_enum     -- STANDARD | PREMIUM | VAN | ELECTRIC
```

---

## 📊 Tables Principales

### 1. **users** (Profils Utilisateurs)
```sql
id              uuid PK         -- Référence auth.users
first_name      text
last_name       text
phone           text
created_at      timestamptz     -- DEFAULT now()
updated_at      timestamptz     -- DEFAULT now()
```
**RLS:** Enabled  
**Relations:** `id` → `auth.users(id)`

---

### 2. **drivers** (Chauffeurs)
```sql
id                      uuid PK         -- DEFAULT gen_random_uuid()
user_id                 uuid NOT NULL   -- → users(id) UNIQUE
first_name              text
last_name               text            -- DEFAULT ''
phone                   text
status                  driver_status   -- DEFAULT 'inactive'
avatar_url              text
current_vehicle_id      uuid            -- → vehicles(id)

-- Documents VTC
vtc_card_number         text            -- DEFAULT 'À compléter'
driving_license_number  text            -- DEFAULT 'À compléter'
vtc_card_expiry_date    date            -- DEFAULT '2025-12-31'
driving_license_expiry_date date        -- DEFAULT '2025-12-31'
insurance_number        text
insurance_expiry_date   date

-- Métriques
rating                  numeric(0-5)
total_rides             integer         -- DEFAULT 0

-- Préférences
languages_spoken        text[]
preferred_zones         text[]
availability_hours      jsonb

-- Entreprise
company_name            text            -- DEFAULT 'À compléter'
company_phone           text            -- DEFAULT 'À compléter'
employee_phone          text            -- DEFAULT 'À compléter'
employee_name           text            -- DEFAULT 'À compléter'

-- Adresse
date_of_birth           date
address_line1           text
address_line2           text
city                    text
postal_code             text

-- Urgence
emergency_contact_name  text
emergency_contact_phone text

-- Métadonnées
document_urls           jsonb           -- DEFAULT '{}'
created_at              timestamptz     -- DEFAULT now()
updated_at              timestamptz     -- DEFAULT now()
```

**Contraintes:**
- `drivers_rating_check` : rating BETWEEN 0 AND 5
- `proper_phone` : Format téléphone valide
- `required_fields` : Champs obligatoires pour complétude
- `future_*_expiry` : Dates d'expiration dans le futur

**Indexes:**
- `drivers_user_id_idx`, `drivers_status_idx`
- `drivers_driving_license_number_key` (UNIQUE)
- `drivers_vtc_card_number_key` (UNIQUE)

---

### 3. **vehicles** (Véhicules)
```sql
id                      uuid PK         -- DEFAULT gen_random_uuid()
driver_id               uuid            -- → drivers(id) ON DELETE CASCADE
make                    text NOT NULL   -- Marque
model                   text NOT NULL   -- Modèle
year                    integer
license_plate           text NOT NULL   -- Plaque d'immatriculation UNIQUE
color                   text
vehicle_type            vehicle_type_enum -- DEFAULT 'STANDARD'
seats                   integer         -- DEFAULT 4
is_primary              boolean         -- DEFAULT false
photos                  jsonb           -- DEFAULT '[]'
documents               jsonb           -- DEFAULT '{}'

-- Métadonnées VTC
owner_user_id           uuid
owner_name              text
registration_number     text
vin                     text
fuel_type               text
first_registration_date date
insurance_number        text
validation_status       text            -- DEFAULT 'pending'
submitted_by            uuid
submitted_at            timestamptz

created_at              timestamptz     -- DEFAULT now()
updated_at              timestamptz     -- DEFAULT now()
```

**Indexes:**
- `idx_vehicles_driver_id`, `idx_vehicles_license_plate`
- `idx_vehicles_owner_user_id`

---

### 4. **rides** (Courses)
```sql
id                  uuid PK         -- DEFAULT gen_random_uuid()
user_id             uuid            -- → users(id)
driver_id           uuid            -- → drivers(id)
override_vehicle_id uuid            -- Véhicule spécifique

status              ride_status     -- DEFAULT 'pending'

-- Points de départ
pickup_address      text NOT NULL
pickup_lat          numeric
pickup_lon          numeric
pickup_time         timestamptz NOT NULL
pickup_notes        text

-- Points d'arrivée
dropoff_address     text NOT NULL
dropoff_lat         numeric
dropoff_lon         numeric

-- Calculs
distance            numeric         -- En km
duration            integer         -- En minutes
vehicle_type        text NOT NULL
options             text[]          -- DEFAULT '{}'

-- Tarification
estimated_price     numeric
final_price         numeric
price               numeric(10,2)

created_at          timestamptz     -- DEFAULT now()
updated_at          timestamptz     -- DEFAULT now()
```

**Indexes:** Principalement via FK

---

### 5. **ride_stops** (Arrêts Intermédiaires)
```sql
id                  uuid PK
ride_id             uuid NOT NULL   -- → rides(id) ON DELETE CASCADE
stop_order          integer NOT NULL
address             text NOT NULL
lat                 numeric
lon                 numeric
estimated_arrival   timestamptz
estimated_wait_time integer
notes               text
created_at          timestamptz     -- DEFAULT now()
updated_at          timestamptz     -- DEFAULT now()
```

---

### 6. **ride_status_history** (Historique des Statuts)
```sql
id                  uuid PK
ride_id             uuid NOT NULL   -- → rides(id) ON DELETE CASCADE
status              varchar NOT NULL
previous_status     varchar
changed_by          uuid            -- Qui a changé le statut
changed_at          timestamptz     -- DEFAULT now()

-- Raison du changement
delay_reason        varchar(50)
delay_minutes       integer
notes               text
reason_category     varchar(50)     -- → status_reason_categories(category_code)

-- Impact
financial_impact    numeric(10,2)
external_intervention boolean       -- DEFAULT false

-- Localisation
location_lat        numeric(10,6)
location_lon        numeric(10,6)

-- Confirmations
requires_followup   boolean         -- DEFAULT false
confirmed_by_client boolean         -- DEFAULT false
confirmed_by_driver boolean         -- DEFAULT false
```

---

### 7. **rates** (Tarifs)
```sql
id              integer PK      -- AUTO_INCREMENT
vehicle_type    vehicle_type_enum NOT NULL UNIQUE
price_per_km    numeric(10,2) NOT NULL
base_price      numeric(10,2) NOT NULL
min_price       numeric(10,2) NOT NULL DEFAULT 0
created_at      timestamptz     -- DEFAULT now()
updated_at      timestamptz     -- DEFAULT now()
```

**Contraintes:**
- `rates_base_price_check` : base_price >= 0
- `rates_price_per_km_check` : price_per_km >= 0

---

### 8. **options** (Options de Course)
```sql
id              uuid PK
name            text NOT NULL UNIQUE
description     text NOT NULL
price           numeric(10,2) NOT NULL
available       boolean         -- DEFAULT true
created_at      timestamptz     -- DEFAULT now()
updated_at      timestamptz     -- DEFAULT now()
```

**Contrainte:** `options_price_check` : price >= 0

---

### 9. **promo_codes** (Codes Promo)
```sql
id              uuid PK
code            text NOT NULL UNIQUE
description     text NOT NULL
promo_type      promo_type_enum NOT NULL
value           numeric NOT NULL
min_ride_value  numeric
max_discount    numeric
start_date      timestamptz NOT NULL
end_date        timestamptz NOT NULL
max_uses        integer
uses_per_user   integer
active          boolean         -- DEFAULT true
created_at      timestamptz     -- DEFAULT now()
updated_at      timestamptz     -- DEFAULT now()
```

---

### 10. **promo_usages** (Utilisation des Promos)
```sql
id              uuid PK
promo_code_id   uuid            -- → promo_codes(id)
user_id         uuid            -- → users(id)
ride_id         uuid            -- → rides(id)
discount_amount numeric NOT NULL
used_at         timestamptz     -- DEFAULT now()
created_at      timestamptz     -- DEFAULT now()
updated_at      timestamptz     -- DEFAULT now()
```

---

### 11. **seasonal_promotions** (Promotions Saisonnières)
```sql
id                  uuid PK
name                text NOT NULL
description         text NOT NULL
discount_percentage numeric NOT NULL
vehicle_types       vehicle_type_enum[]
zones               text[]
time_slots          jsonb
start_date          timestamptz NOT NULL
end_date            timestamptz NOT NULL
active              boolean         -- DEFAULT true
created_at          timestamptz     -- DEFAULT now()
updated_at          timestamptz     -- DEFAULT now()
```

---

### 12. **corporate_discounts** (Remises Entreprises)
```sql
id                  uuid PK
name                text NOT NULL
company_id          uuid            -- → users(id)
discount_type       discount_type_enum NOT NULL
percentage          numeric NOT NULL
min_monthly_rides   integer
total_budget        numeric
remaining_budget    numeric
start_date          timestamptz NOT NULL
end_date            timestamptz
active              boolean         -- DEFAULT true
created_at          timestamptz     -- DEFAULT now()
updated_at          timestamptz     -- DEFAULT now()
```

---

### 13. **driver_rewards** (Récompenses Chauffeurs)
```sql
id              uuid PK
driver_id       uuid            -- → drivers(id)
reward_type     reward_type_enum NOT NULL
value           numeric NOT NULL
rides_threshold integer
valid_from      timestamptz NOT NULL
valid_until     timestamptz NOT NULL
is_claimed      boolean         -- DEFAULT false
claimed_at      timestamptz
created_at      timestamptz     -- DEFAULT now()
updated_at      timestamptz     -- DEFAULT now()
```

---

### 14. **driver_documents** (Documents Chauffeur)
```sql
id                  uuid PK
driver_id           uuid            -- → drivers(id) ON DELETE CASCADE
document_type       text NOT NULL   -- CHECK: driving_license, vtc_card, insurance, ...
file_url            text NOT NULL
file_name           text
file_size           integer
upload_date         timestamptz     -- DEFAULT now()
expiry_date         date
validation_status   text            -- DEFAULT 'pending' (pending, approved, rejected)
rejection_reason    text
created_at          timestamptz     -- DEFAULT now()
```

**Indexes:** `idx_driver_documents_driver_id`, `idx_driver_documents_type`

---

### 15. **vehicle_documents** (Documents Véhicule)
```sql
id                  uuid PK
vehicle_id          uuid            -- → vehicles(id) ON DELETE CASCADE
document_type       text NOT NULL
file_url            text NOT NULL
file_name           text
file_size           bigint
upload_date         timestamptz     -- DEFAULT now()
validation_status   text            -- DEFAULT 'pending'
rejection_reason    text
uploaded_by         uuid
```

---

### 16. **audit_logs** (Logs d'Audit)
```sql
id                  uuid PK
event_type          text NOT NULL
service             text NOT NULL
ride_id             uuid            -- → rides(id)
calculated_price    numeric(10,2)
metadata            jsonb
created_at          timestamptz     -- DEFAULT now()
updated_at          timestamptz     -- DEFAULT now()
```

**Indexes:**
- `idx_audit_logs_ride_id`
- `idx_audit_logs_event_type`
- `idx_audit_logs_created_at` (DESC)

---

### 17. **user_profiles** (Profils Étendus)
```sql
id              bigint PK       -- GENERATED ALWAYS AS IDENTITY
user_id         uuid NOT NULL   -- → auth.users(id)
app_metadata    jsonb
role            text
created_at      timestamptz     -- DEFAULT now()
updated_at      timestamptz     -- DEFAULT now()
```

---

### 18. **status_reason_categories** (Catégories de Motifs)
```sql
id                  integer PK      -- AUTO_INCREMENT
category_code       varchar(50) NOT NULL UNIQUE
description         text NOT NULL
requires_notes      boolean         -- DEFAULT false
requires_approval   boolean         -- DEFAULT false
```

---

## ⚡ Fonctions SQL Importantes

### Gestion des Rôles
```sql
assign_user_role_on_signup()      -- Trigger: Assigne app_driver/app_customer/app_admin
```

### Gestion Chauffeurs
```sql
check_driver_profile_completeness(uuid)   -- Vérifie si le profil est complet
auto_update_driver_status()              -- Auto-update: incomplete ↔ pending_validation
can_driver_accept_rides(uuid)            -- Vérifie si un driver peut accepter des courses
```

### Calcul des Prix
```sql
calculate_ride_price(distance, vehicle_type, options, user_id, pickup_time)
before_insert_calculate_ride_price()      -- Trigger INSERT
before_update_calculate_ride_price()      -- Trigger UPDATE
```

### Helpers RLS
```sql
get_user_app_role()              -- Récupère le rôle depuis JWT
is_admin() / is_super_admin()    -- Vérifie les privilèges
```

---

## 🛡️ Politiques RLS (Row Level Security)

### drivers
- `drivers_admin_access` : Full access pour app_admin/app_super_admin
- `drivers_own_access` : Accès à son propre profil
- `Admins can view all drivers` : SELECT admin
- `Drivers can check own completeness` : SELECT pour soi-même

### rides
- `rides_admin_all` : Full access admin
- `rides_own_customer` : Client voit ses courses
- `rides_create_customer` : Client crée des courses
- `rides_accept_by_driver` : Driver accepte une course
- `rides_assigned_to_driver` : Driver voit ses courses assignées
- `rides_available_for_drivers` : Driver voit courses disponibles
- `rides_update_assigned` : Driver met à jour ses courses

### vehicles
- `Admins can view all driver vehicles`
- `Drivers can manage own vehicles`

### rates / options
- `allow_read_rates` : Lecture pour authenticated
- `allow_read_options` : Lecture pour authenticated

---

## 🔗 Relations Clés

```
auth.users ─┬─► users ─┬─► drivers ─┬─► vehicles
            │          │            ├─► driver_documents
            │          │            └─► driver_rewards
            │          └─► rides ────┬─► ride_stops
            │                        ├─► ride_status_history
            │                        └─► audit_logs
            └─► user_profiles
```

---

## 📁 Workflow GitOps

### Ne Jamais Modifier Directement
❌ **INTERDIT:** Modifier `init.sql.sql` directement

### ✅ Workflow Correct
1. **Créer une branche:**
   ```bash
   git checkout -b feature/ajout-table-x
   ```

2. **Créer une migration:**
   ```bash
   supabase migration new ajout_colonne_y
   # Éditer supabase/migrations/YYYYMMDDHHMMSS_ajout_colonne_y.sql
   ```

3. **Tester localement:**
   ```bash
   supabase db reset
   supabase db push
   ```

4. **Créer une PR:**
   - Décrire les changements
   - Inclure le SQL généré
   - Review par l'équipe

5. **Déployer:**
   ```bash
   supabase db push --project-ref ioddsdzustunlahxafif
   ```

6. **Mettre à jour les types:**
   ```bash
   supabase gen types typescript --linked --schema public > src/lib/types/database.types.ts
   ```

---

## 🔄 Mise à Jour du Schéma

```bash
# 1. Extraire le schéma depuis Supabase
supabase db dump --project-ref ioddsdzustunlahxafif > backup.sql

# 2. Mettre à jour la source de vérité locale
supabase migration new init_update

# 3. Générer les types TypeScript
supabase gen types typescript --linked --schema public > src/lib/types/database.types.ts

# 4. Vérifier la compilation
npm run type-check
```

---

## 📚 Documentation Connexe

- [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) - Système de rôles
- [RLS-POLICIES.md](./rls-analysis.md) - Analyse détaillée des policies
- [TRIGGER-ASSIGN-ROLE.md](./trigger-assign-user-role.md) - Trigger d'assignation des rôles

---

**⚠️ Note:** Ce fichier est généré automatiquement depuis `init.sql.sql`.  
**Ne pas modifier manuellement** - Utiliser le workflow GitOps ci-dessus.
