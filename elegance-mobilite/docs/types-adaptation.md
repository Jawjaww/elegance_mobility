# Adaptation des Types avec Database.types.ts

## Structure Générée par Supabase

```bash
npx supabase gen types typescript --project-id iodsddzustunlahxafif --schema public
Changements Nécessaires
1. Structure des Tables
La nouvelle structure utilise Tables :

// Ancien
Database['public']['rides']

// Nouveau
Database['public']['Tables']['rides']
2. Types Communs à Exporter
Créer un fichier common-types.ts pour réexporter les types fréquemment utilisés :

import type { Database } from './database.types'

// Types des Tables
export type User = Database['public']['Tables']['users']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type Driver = Database['public']['Tables']['drivers']['Row']
export type Ride = Database['public']['Tables']['rides']['Row']

// Types d'Énumération
export type VehicleType = Database['public']['Enums']['vehicle_type_enum']
export type RideStatus = Database['public']['Enums']['ride_status']
export type DriverStatus = Database['public']['Enums']['driver_status']

// Helpers pour les rôles
export type AppRole = 'app_customer' | 'app_driver' | 'app_admin' | 'app_super_admin'

// Helpers de vérification des rôles
export function isAdmin(user?: User | null): boolean {
  return user?.role === 'app_admin' || user?.role === 'app_super_admin'
}

export function isDriver(user?: User | null): boolean {
  return user?.role === 'app_driver'
}

export function isCustomer(user?: User | null): boolean {
  return user?.role === 'app_customer'
}
3. Correction des Imports
Dans tous les fichiers qui importent les types, changer :

// Avant
import { User } from '@/lib/types/database.types'

// Après
import { User } from '@/lib/types/common-types'
4. Liste des Fichiers à Mettre à Jour
Composants :

ClientLayout.tsx
ClientMobileNav.tsx
UserMenu.tsx
RoleGuard.tsx
DriverDashboardClient.tsx
Pages :

app/(client-portal)/layout.tsx
app/(client-portal)/my-account/reservations/reservations-client.tsx
app/backoffice-portal/page.tsx
app/auth/callback/route.ts
Services et Stores :

lib/services/statusService.ts
lib/stores/driversStore.ts
lib/database/server.ts
5. Avantages
Types plus précis générés directement depuis la base de données
Support des types Insert et Update pour chaque table
Énumérations correctement typées
Relations entre tables documentées
6. Prochaines Étapes
Créer le fichier common-types.ts
Mettre à jour les imports dans tous les fichiers listés
Tester la compilation TypeScript
Vérifier que tous les types correspondent à la structure de la base de données
```
