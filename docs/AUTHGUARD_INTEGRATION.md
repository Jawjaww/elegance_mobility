# 🎯 Guide d'intégration AuthGuard

## Option 1 : Migration Progressive (RECOMMANDÉ)

Gardez les Server Components actuels et ajoutez l'AuthGuard en parallèle pour tester :

```tsx
// src/app/layout.tsx
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ClientProviders } from "@/components/ClientProviders";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <ClientProviders>
          {/* AuthGuard gère les redirections client-side */}
          <AuthGuard>{children}</AuthGuard>
        </ClientProviders>
      </body>
    </html>
  );
}
```

**Avantages :**

- Les layouts serveur existants continuent de fonctionner
- L'AuthGuard ajoute la protection client-side pour Tauri
- Migration progressive route par route

---

## Option 2 : Migration Complète (Tauri-Ready)

Remplacez tous les Server Components par des composants client :

### 1. Convertir les layouts de portails

**Avant (Server Component) :**

```tsx
// src/app/(client-portal)/layout.tsx
export default async function ClientPortalLayout({ children }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  // ...
}
```

**Après (Client Component) :**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";
import { useRouter } from "next/navigation";

export default function ClientPortalLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/auth/login");
      else setUser(data.user);
    });
  }, []);

  if (!user) return <div>Chargement...</div>;

  return <ClientLayout>{children}</ClientLayout>;
}
```

### 2. Activer l'export statique

```js
// next.config.mjs
export default {
  output: "export",
  images: { unoptimized: true },
  // ...
};
```

### 3. Build et test

```bash
npm run build
# → Doit produire un dossier /out avec HTML statique
```

---

## Option 3 : Hybrid Mode (Temporaire)

Pour les besoins de développement, vous pouvez garder les deux systèmes :

- Server Components pour Next.js SSR (production web)
- AuthGuard pour Tauri (app native)

Utiliser une variable d'environnement pour basculer :

```tsx
export default function RootLayout({ children }) {
  const isTauriMode = process.env.NEXT_PUBLIC_TAURI_MODE === "true";

  return (
    <html>
      <body>
        {isTauriMode ? (
          <AuthGuard>{children}</AuthGuard>
        ) : (
          children // Les layouts serveur gèrent l'auth
        )}
      </body>
    </html>
  );
}
```

---

## Tests recommandés

1. **Login/Logout :**
   - Se connecter → doit rediriger vers le bon portail
   - Se déconnecter → doit rediriger vers /auth/login

2. **Refresh de page :**
   - Recharger une page protégée → doit rester connecté (localStorage)

3. **Token expiration :**
   - Attendre l'expiration du token → `onAuthStateChange` doit gérer le refresh

4. **Accès direct :**
   - Taper `/my-account` sans être connecté → doit rediriger vers login
   - Taper `/backoffice-portal` en tant que customer → doit rediriger vers /my-account

---

## Migration vers Tauri (après stabilisation)

Une fois l'AuthGuard testé en mode web :

```bash
npm install -D @tauri-apps/cli
npx tauri init
```

Config `tauri.conf.json` :

```json
{
  "build": {
    "distDir": "../out",
    "devPath": "http://localhost:3000"
  }
}
```

Lancer l'app native :

```bash
npm run tauri dev
```

---

## Troubleshooting

**Problème :** Boucle de redirection

- **Cause :** `onAuthStateChange` déclenche une redirection à chaque refresh
- **Solution :** Vérifier le pathname avant de rediriger (déjà implémenté dans AuthGuard)

**Problème :** `app_metadata.role` est undefined

- **Cause :** Utilisation de `getSession()` au lieu de `getUser()`
- **Solution :** Toujours utiliser `supabase.auth.getUser()` pour récupérer les métadonnées

**Problème :** Page blanche au démarrage

- **Cause :** AuthGuard bloque le rendu pendant la vérification
- **Solution :** Afficher un loader (déjà implémenté avec `isChecking`)
