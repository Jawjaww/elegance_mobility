MIGRATION: Consolidation des types et conversion vers export statique (Mobile/Tauri)

## Statut global

**BUILD STATIQUE OK** — `npm run build` passe (54/54 pages, `output: "export"`)

## Objectif

- Faire de `src/lib/types/database.types.ts` la source de vérité pour les enums et types persistants.
- Éliminer les duplications et adapter les imports pour que le projet soit stable et maintenable.
- Convertir les API routes en services client (Supabase browser) pour rester compatible avec `output: "export"`.

---

## Étapes terminées

### ✅ Étape 1 — Audit

- Tous les imports `@/lib/types/*` et toutes les `route.ts` ont été listés et vérifiés.

### ✅ Étape 2 — Renommage legacy types

- `src/lib/types/types.ts` → `src/lib/types/compat.types.ts` (re-exports mis à jour).

### ✅ Étape 3 — Extraction VehicleOptions / runtime constants

- `src/lib/vehicle.ts` exporte `VehicleType`, `VEHICLE_TYPES`, `VehicleOptions` (permissif).
- `VehicleStep.tsx` et `OptionsStep.tsx` importent depuis `@/lib/vehicle`.

### ✅ Étape 6 — Vérifications TypeScript

- `npx tsc --noEmit` passe sans erreur.

### ✅ Étape 7 — Conversion API routes → services client

Routes supprimées (server-side) et remplacées par des services client :

- `src/app/api/driver/accept-ride/route.ts` → `src/services/rideService.ts`
- `src/app/api/dashboard/metrics/route.ts` → `src/services/dashboardService.ts`
- `src/app/api/directions/route.ts` → `src/services/directionsService.ts`
- `src/app/api/auth/logout/route.ts` → `src/services/authService.ts`
- `src/app/api/auth/admin/route.ts` — supprimé (logique client dans les pages)
- `src/app/auth/callback/route.ts` — supprimé (auth Supabase gérée côté client)
- `src/app/auth/verify-email/route.ts` — supprimé (idem)
- `src/app/api/_disabled_dashboard/metrics/route.ts` — supprimé

### ✅ Étape 8 — Correction des routes dynamiques (Suspense + static export)

Pages corrigées pour compatibilité `output: "export"` :

- `useSearchParams()` → contenu extrait dans composant enfant + `<Suspense>` wrapper :
  - `src/app/(client-portal)/my-account/reservations/edit/page.tsx`
  - `src/app/(client-portal)/my-account/reservations/edit-confirmation/page.tsx`
  - `src/app/backoffice-portal/rides/assign/page.tsx`
- `dynamicParams: true` supprimé de `[id]/edit/edit-confirmation/page.tsx`
- `React.Suspense` inutile retiré des pages n'utilisant que `useRouter()` :
  - `reservation-success/page.tsx`, `reservation/page.tsx`, `driver-portal/login/page.tsx`
- `src/app/auth/login/page.tsx` et `auth/forgot-password/page.tsx` avaient déjà le bon pattern
- Middleware désactivé (`middleware.ts.unused`)

---

## Étapes restantes

### ⬜ Étape 3b — Créer `adapters.ts` (optionnel)

- `src/lib/types/adapters.ts` pour fonctions `adaptVehicleType`/`adaptVehicleOptions`.
- Nécessaire seulement si du code legacy requiert une conversion runtime vers les enums `database.types`.

### ⬜ Étape 4 — Remplacement complet des imports legacy

- Rechercher `from '@/lib/types/compat.types'` et remplacer par imports ciblés.
- Utiliser `import type { ... }` quand c'est purement du typage.

### ⬜ Étape 5 — Supprimer `compat.types.ts`

- Quand tous les imports pointent vers les fichiers dédiés, supprimer `src/lib/types/compat.types.ts`.

### ⬜ Tests & PR

- Tester manuellement les pages critiques (réservation, accept-ride flow, login, backoffice).
- Commit par paquet logique (types, services, Suspense fixes).
- PR avec note expliquant la migration Tauri mobile-first.

---

## Commandes utiles

```bash
# Type check
npx tsc --noEmit

# Build statique
npm run build

# Lister imports legacy
rg "from '@/lib/types/compat" -n

# Dev local
npm run dev
```

## Notes & recommandations

- Préférer `import type { ... }` quand possible pour alléger le bundle client.
- `database.types.ts` = source de vérité pour les enums persistants (vehicle_type_enum, etc.).
- Pour Tauri : tout est client-side, pas de cookies/session serveur, auth via Supabase `createBrowserClient`.
