# 🚗 ELEGANCE MOBILITÉ - PLAN DE DÉVELOPPEMENT

> Dernière mise à jour : 2026-02-03  
> Statut : Phase 1 - Fondation en cours

---

## 📋 SOMMAIRE

1. [Architecture du Flux](#architecture-du-flux)
2. [Phases de Réalisation](#phases-de-réalisation)
3. [État Actuel](#état-actuel)
4. [Prochaines Étapes](#prochaines-étapes)

---

## 🏗️ ARCHITECTURE DU FLUX

```
┌─────────────┐     Créer course      ┌─────────────┐
│   CLIENT    │ ─────────────────────> │   SUPABASE  │
│  (Portal)   │                        │   (rides)   │
└─────────────┘                        └──────┬──────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                         ▼                    ▼                    ▼
                   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                   │   DRIVER    │     │  BACKOFFICE │     │   CLIENT    │
                   │  (Realtime) │     │  (Pending)  │     │  (Status)   │
                   └──────┬──────┘     └──────┬──────┘     └─────────────┘
                          │                     │
                          │ Accepter            │ Assigner
                          ▼                     ▼
                   ┌─────────────────────────────────────┐
                   │     SUPABASE (ride assigned)        │
                   │     - driver_id = X                 │
                   │     - status = 'accepted'           │
                   └─────────────────────────────────────┘
```

### Statuts d'une Course

```
pending → accepted → picked_up → in_progress → completed
   ↑         ↑           ↑            ↑            ↑
  Créé   Driver     Client       En route     Arrivé
         accepte    pris          vers B
                    en charge
```

---

## 🎯 PHASES DE RÉALISATION

### ✅ PHASE 0 : Refactoring Driver Dashboard (TERMINÉ)

- [x] Refonte complète du driver dashboard
- [x] Nouveau store driver (`src/lib/driver/`)
- [x] Composants Map, Header, Stats, OnlineToggle
- [x] Style moderne avec tuiles vectorielles
- [x] Build TypeScript clean

**Fichiers créés/modifiés :**
- `src/lib/driver/store.ts` - Store Zustand
- `src/lib/driver/hooks.ts` - Hooks useDriverLocation, useRealtimeRides
- `src/lib/driver/types.ts` - Types TypeScript
- `src/lib/driver/utils.ts` - Utilitaires
- `src/components/driver/Map.tsx` - Carte moderne

---

### 🔄 PHASE 1 : Fondation (EN COURS)

#### 1.1 Vérifier Création de Course Client
**Statut** : À tester  
**Fichiers concernés** :
- `src/app/(public-portal)/reservation/page.tsx`
- `src/lib/services/reservationService.ts`

**Critères de validation :**
- [ ] Un client peut créer une course
- [ ] Le `status` par défaut est `pending`
- [ ] Le `driver_id` est NULL à la création
- [ ] Les données sont bien enregistrées en DB

#### 1.2 Fonction SQL d'Acceptation
**Statut** : À créer  
**Fichier** : `supabase/migrations/20260203_add_accept_ride_function.sql`

```sql
-- Fonction pour qu'un driver accepte une course
CREATE OR REPLACE FUNCTION accept_ride(
  p_ride_id UUID,
  p_driver_id UUID
) RETURNS BOOLEAN
```

**Critères de validation :**
- [ ] Vérifier que la course est `pending`
- [ ] Vérifier que le driver est `online`
- [ ] Mettre à jour `driver_id` et `status`
- [ ] Retourner TRUE/FALSE avec raison si échec

#### 1.3 API Driver - Accepter Course
**Statut** : À créer  
**Fichier** : `src/app/api/driver/accept-ride/route.ts`

**Critères de validation :**
- [ ] Endpoint POST fonctionnel
- [ ] Vérification auth driver
- [ ] Appel de la fonction SQL
- [ ] Gestion des erreurs

---

### ⏳ PHASE 2 : Affichage Temps Réel

#### 2.1 Driver Dashboard - Liste Courses Disponibles
**Statut** : À développer  
**Fichiers** :
- `src/components/driver/AvailableRides.tsx` (NOUVEAU)
- `src/app/driver-portal/rides/available/page.tsx` (MODIFICATION)

**Features :**
- [ ] Hook Supabase Realtime sur table `rides`
- [ ] Filtrer par `status = 'pending'`
- [ ] Calcul distance driver → pickup
- [ ] Affichage liste avec : adresse, prix, distance
- [ ] Bouton "Accepter" par course

#### 2.2 Backoffice - Vue Courses en Attente
**Statut** : À développer  
**Fichier** : `src/app/backoffice-portal/rides/pending/page.tsx`

**Features :**
- [ ] Tableau de toutes les courses `pending`
- [ ] Filtres : date, zone, prix
- [ ] Bouton "Assigner manuellement" un driver
- [ ] Sélecteur de driver disponible

#### 2.3 Client - Suivi de Course
**Statut** : À développer  
**Fichier** : `src/app/(client-portal)/my-account/reservations/[id]/track/page.tsx`

**Features :**
- [ ] Afficher si driver assigné
- [ ] Si assigné : nom, photo, véhicule du driver
- [ ] Statut en temps réel de la course

---

### ⏳ PHASE 3 : Realtime & Notifications

#### 3.1 Supabase Realtime
**Statut** : À configurer

**Channels à créer :**
- [ ] `rides` : nouveau ride → notify drivers
- [ ] `rides:driver_id` : mon ride accepté → notify client
- [ ] `driver_locations` : position driver → update carte client

#### 3.2 Notifications Push
**Statut** : À intégrer

- [ ] Notification driver : "Nouvelle course disponible !"
- [ ] Notification client : "Votre chauffeur arrive"

---

## 📊 ÉTAT ACTUEL

### ✅ Ce qui fonctionne

| Fonctionnalité | Statut | Notes |
|---------------|--------|-------|
| Build TypeScript | ✅ | Aucune erreur |
| Auth (login/signup) | ✅ | Tous les rôles |
| Création course client | ⚠️ | À vérifier |
| Driver Dashboard UI | ✅ | Map, stats, toggle online |
| Driver Store | ✅ | Zustand persisté |
| GPS Tracking | ✅ | Envoi à Supabase |

### ❌ Ce qui ne fonctionne pas encore

| Fonctionnalité | Statut | Priorité |
|---------------|--------|----------|
| Accepter une course | ❌ | CRITIQUE |
| Liste courses pending | ❌ | CRITIQUE |
| Assigner driver (backoffice) | ❌ | HAUTE |
| Suivi client | ❌ | MOYENNE |
| Realtime notifications | ❌ | MOYENNE |

---

## 🚀 PROCHAINES ÉTAPES IMMÉDIATES

### 1. Commiter le refactoring actuel
```bash
git add -A
git commit -m "refactor(driver): complete dashboard redesign with modern map

- New driver architecture (src/lib/driver/)
- Modern vector map with Stadia tiles
- New components: Map, Header, Stats, Sheet
- Build passes with 0 TS errors
- GPS tracking with Supabase"
```

### 2. Tester la création de course
```bash
# Se connecter en tant que client
# Créer une course
# Vérifier en DB que status=pending et driver_id=NULL
```

### 3. Créer la fonction SQL
```sql
-- Fichier : supabase/migrations/20260203_ride_assignment.sql
```

### 4. Créer l'API d'acceptation
```typescript
// Fichier : src/app/api/driver/accept-ride/route.ts
```

### 5. Intégrer dans le driver dashboard
```typescript
// Modifier : src/components/driver/RideRequest.tsx
// Ajouter l'appel API au clic "Accepter"
```

---

## 📝 WORKFLOW DE DÉVELOPPEMENT

### Pour chaque tâche :

1. **Créer une branche** : `git checkout -b feature/xxx`
2. **Développer** avec tests locaux
3. **Build TypeScript** : `npm run build` (doit passer)
4. **Test fonctionnel** : vérifier le comportement
5. **Mettre à jour PLAN.md** : cocher les cases
6. **Commiter** : message conventionnel
7. **Pousser** et créer PR si nécessaire

### Conventions de commit

```
feat(driver): add ride acceptance API
fix(db): resolve 409 conflict on location upsert
docs(plan): update phase 2 progress
```

---

## 🔧 COMMANDES UTILES

```bash
# Build
npm run build

# Test TypeScript
npx tsc --noEmit

# Dev server
npm run dev

# Supabase migrations
npx supabase migration new xxx
npx supabase db push
```

---

## 👥 RÔLES & PERMISSIONS

| Action | Client | Driver | Backoffice |
|--------|--------|--------|------------|
| Créer course | ✅ | ❌ | ✅ |
| Accepter course | ❌ | ✅ | ✅ |
| Voir courses | Ses courses | Pending + Ses courses | Toutes |
| Modifier course | ❌ | Son statut | ✅ |
| Voir positions | Son driver | Tous | Tous |

---

*Document maintenu par l'équipe dev. Dernière MAJ : 2026-02-03*
