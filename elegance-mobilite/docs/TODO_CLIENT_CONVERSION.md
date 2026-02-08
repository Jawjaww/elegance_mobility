# 🚨 Pages à Convertir en Client Components

Les pages suivantes utilisent encore `getServerUser()` et doivent être converties :

## Pages Prioritaires (Car dans les portails client)

### Client Portal

- ✅ `src/app/(client-portal)/layout.tsx` - CONVERTI
- ⚠️ `src/app/(client-portal)/my-account/page.tsx` - À CONVERTIR
- ⚠️ `src/app/(client-portal)/my-account/reservations/page.tsx` - À CONVERTIR
- ⚠️ `src/app/(client-portal)/my-account/settings/page.tsx` - À CONVERTIR

### Backoffice Portal

- ✅ `src/app/backoffice-portal/layout.tsx` - CONVERTI

### Driver Portal

- ⚠️ `src/app/driver-portal/profile/setup/page.tsx` - À CONVERTIR

## Services (Peuvent rester inchangés temporairement)

Ces fichiers utilisent `createServerSupabaseClient` mais sont appelés depuis des composants serveur ou API routes. Ils peuvent rester tels quels pour le moment car les API routes sont compatibles avec l'export statique (elles seront simplement ignorées) :

- `src/lib/services/dashboard.ts` (appelé depuis pages serveur)
- `src/lib/services/profileService.ts` (appelé depuis pages serveur)
- `src/lib/services/metricsService.ts` (appelé depuis pages serveur)

## API Routes (OK - Compatibles export)

Ces routes API utilisent `createServerSupabaseClient` mais c'est normal - elles seront simplement non incluses dans le build export :

- `src/app/auth/verify-email/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/driver/accept-ride/route.ts`

## Fichier `server.ts`

**Statut : CONSERVER** pour les API routes, mais marqué comme obsolète pour les pages.

**Alternative** : Créer une version client des services dans `src/lib/services/*.client.ts`

---

## Pattern de Conversion

**Avant (Server Component) :**

```tsx
import { getServerUser } from "@/lib/database/server";

export default async function Page() {
  const user = await getServerUser();
  // ...
}
```

**Après (Client Component) :**

```tsx
"use client";

import { supabase } from "@/lib/database/client";
import { useEffect, useState } from "react";

export default function Page() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  if (!user) return <div>Chargement...</div>;
  // ...
}
```
