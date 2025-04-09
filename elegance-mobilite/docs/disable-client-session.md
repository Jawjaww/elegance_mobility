# Désactivation de la Persistance des Sessions Côté Client

## Problème Actuel
Dans `src/lib/database/client.ts`, nous avons actuellement :
```typescript
persistSession: true,
detectSessionInUrl: true
```

Ceci crée une redondance avec la gestion des sessions côté serveur (SSR).

## Pourquoi Désactiver ?

1. Double Gestion des Sessions
   - Le middleware SSR gère déjà les sessions via des cookies httpOnly sécurisés
   - La persistance côté client crée une duplication inutile
   - Risque de désynchronisation entre client et serveur

2. Sécurité Améliorée
   - Les cookies httpOnly du middleware sont plus sécurisés
   - Protection contre les attaques XSS
   - Validation systématique côté serveur

3. Architecture Next.js + Supabase SSR
   - Best practice : utiliser uniquement la gestion de session SSR
   - Évite les conflits de session
   - Plus cohérent avec l'architecture serveur

## Modification à Apporter

Dans `src/lib/database/client.ts`, modifier la configuration :
```typescript
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,  // Désactiver la persistance côté client
      detectSessionInUrl: false  // Désactiver car géré par le middleware
    }
  }
);
```

## Impact
- Les sessions seront gérées uniquement par le middleware SSR
- Les politiques RLS continueront de fonctionner via les cookies httpOnly
- Amélioration de la sécurité et des performances

## Validation
1. Vérifier que l'authentification fonctionne toujours
2. Confirmer que les réservations sont accessibles
3. S'assurer que la déconnexion fonctionne correctement