# Processus d'Inscription et Validation des Chauffeurs

> **Source de vérité:** `infra-supabase` migrations + `driver_status` enum  
> **Mise à jour:** Août 2026 — flux unifié sur `drivers.status` (`draft` → `pending_review` → `active` | `rejected`).  
> Les sections historiques ci-dessous parlant de `incomplete` / `submission_status` sont **obsolètes** ; préférer `AGENTS.md` (racine) et `database.types.ts`.

---

## 📋 Vue d'Ensemble

Le processus d'inscription et de validation des chauffeurs est **entièrement automatisé** via des triggers PostgreSQL, avec validation administrative finale.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   INSCRIPTION   │────▶│  AUTO-COMPLETION │────▶│   VALIDATION    │
│  (/auth/signup) │     │   (Trigger SQL)  │     │    (Admin)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   user crée dans          Profil vérifié          Approbation
   auth.users              par triggers            manuelle
   portal_type=driver      incomplete ↔
                           pending_validation
```

---

## 🔄 Workflow Détaillé

### 1. Inscription du Chauffeur

**Route:** `/auth/signup/driver`

```typescript
// Appel Supabase Auth
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      portal_type: 'driver',      // ← Déclenche le trigger
      first_name,
      last_name
    }
  }
})
```

**Actions automatiques (Trigger SQL):**
1. Création dans `auth.users` avec `raw_app_meta_data.role = 'app_driver'`
2. Création dans `public.users` (via trigger)
3. Création dans `public.drivers` avec `status = 'incomplete'`

---

### 2. Complétion du Profil (Auto-Progression)

**Fonction:** `auto_update_driver_status()` (trigger sur `drivers`)

```sql
-- Logique du trigger:
IF status = 'incomplete' AND profil_complet THEN
    status := 'pending_validation'::driver_status;
ELSIF status = 'pending_validation' AND profil_incomplet THEN
    status := 'incomplete'::driver_status;
END IF;
```

**Critères de complétude** (`check_driver_profile_completeness`):
- Prénom, nom, téléphone renseignés
- Date de naissance présente
- Véhicule créé dans `vehicles`
- Documents uploadés (permis, carte VTC, assurance)

---

### 3. Validation Administrative

**Interface:** `/backoffice-portal/drivers`

**Actions admin possibles:**
| Action | Statut résultat | Conséquence |
|--------|----------------|-------------|
| **Approuver** | `active` | Chauffeur peut accepter des courses |
| **Rejeter** | `inactive` | Compte désactivé avec raison |
| **Suspendre** | `suspended` | Temporairement bloqué |

---

## 🚦 Statuts du Chauffeur (driver_status)

L'énumération `public.driver_status` contient **6 statuts**:

| Statut | Description | Transition possible |
|--------|-------------|---------------------|
| `incomplete` | Profil créé mais incomplet | → `pending_validation` (auto) |
| `pending_validation` | En attente de validation admin | → `active` ou `inactive` |
| `active` | Validé et opérationnel | → `inactive`, `suspended`, `on_vacation` |
| `inactive` | Désactivé (rejeté ou désactivé) | → `active` (réactivation) |
| `suspended` | Suspendu par admin | → `active` (levée de suspension) |
| `on_vacation` | En congés (ne reçoit pas de courses) | → `active` (retour) |

**SQL:**
```sql
CREATE TYPE public.driver_status AS ENUM (
    'pending_validation', 
    'active', 
    'inactive', 
    'on_vacation', 
    'suspended', 
    'incomplete'
);
```

---

## 🛡️ Sécurité et Permissions (RLS)

### Politiques sur `drivers`

```sql
-- Admins : accès complet
CREATE POLICY "drivers_admin_access" ON drivers
FOR ALL USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' 
    IN ('app_admin', 'app_super_admin')
);

-- Chauffeur : accès à son propre profil
CREATE POLICY "drivers_own_access" ON drivers
FOR ALL USING (user_id = auth.uid());

-- Voir son propre profil (vérifie complétude)
CREATE POLICY "Drivers can check own completeness" ON drivers
FOR SELECT USING (auth.uid() = user_id);
```

---

## ⚙️ Fonctions SQL Utilisées

### `check_driver_profile_completeness(uuid)`
Vérifie si tous les champs obligatoires sont remplis.

**Retour:**
```sql
is_complete BOOLEAN,
completion_percentage INTEGER,
missing_fields TEXT[]
```

### `can_driver_accept_rides(uuid)`
Vérifie si un chauffeur peut accepter une course.

**Retour:**
```sql
can_accept BOOLEAN,
reason TEXT,
profile_status TEXT,
validation_status TEXT
```

**Logique:**
- `incomplete` → ❌ Refusé (profil incomplet)
- `pending_validation` → ❌ Refusé (en attente admin)
- `inactive` → ❌ Refusé (désactivé)
- `suspended` → ❌ Refusé (suspendu)
- `on_vacation` → ❌ Refusé (en vacances)
- `active` + profil complet → ✅ Accepté

---

## 📋 Contraintes de Validation (SQL)

```sql
-- Téléphone valide
proper_phone: phone ~ '^[0-9+\s()-]+$'

-- Dates d'expiration dans le futur
future_vtc_expiry: vtc_card_expiry_date > CURRENT_DATE
future_license_expiry: driving_license_expiry_date > CURRENT_DATE
future_insurance_expiry: insurance_expiry_date > CURRENT_DATE

-- Note requise
required_fields: first_name IS NOT NULL AND last_name IS NOT NULL 
                 AND phone IS NOT NULL AND ...

-- Rating entre 0 et 5
valid_rating: rating >= 0 AND rating <= 5
```

---

## 🔄 Triggers Actifs

```sql
-- Auto-update du statut selon complétude
auto_update_driver_status() 
  BEFORE UPDATE ON drivers

-- Mise à jour du statut quand documents changent
handle_driver_status_updates()
  AFTER INSERT/UPDATE/DELETE ON driver_documents
  AFTER INSERT/UPDATE/DELETE ON vehicles
```

---

## 🎯 Interface Utilisateur

| Route | Usage | Accès |
|-------|-------|-------|
| `/auth/signup/driver` | Formulaire d'inscription | Public |
| `/driver-portal/pending` | Page d'attente validation | Chauffeur `pending_validation` |
| `/driver-portal/dashboard` | Dashboard chauffeur | Chauffeur `active` uniquement |
| `/backoffice-portal/drivers` | Gestion chauffeurs | Admin/Super Admin |

---

## 📝 Exemple de Flux Complet

```typescript
// 1. Inscription
const { data } = await supabase.auth.signUp({
  email: "chauffeur@example.com",
  password: "motdepasse",
  options: { data: { portal_type: 'driver', first_name: 'Jean', last_name: 'Dupont' }}
});
// → Status: 'incomplete' (automatique)

// 2. Complétion profil
await supabase.from('drivers').update({
  phone: '+33123456789',
  vtc_card_number: 'VTC123456',
  driving_license_number: 'DL789012',
  date_of_birth: '1985-03-15'
}).eq('user_id', userId);
// → Status: 'pending_validation' (auto si complet)

// 3. Upload documents
await supabase.storage.from('documents').upload(...);
// → Trigger vérifie complétude

// 4. Validation admin (dans backoffice)
// Admin clique "Approuver"
// → Status: 'active'
// → Chauffeur peut accepter des courses
```

---

## 📚 Documentation Connexe

- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Structure complète de la BDD
- [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) - Système de rôles
- [GITOPS-WORKFLOW.md](./GITOPS-WORKFLOW.md) - Workflow de modification

---

**Dernière mise à jour:** Février 2026  
**Mainteneur:** Équipe Élégance Mobilité
