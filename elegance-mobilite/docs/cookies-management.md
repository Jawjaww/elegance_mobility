# Gestion des Cookies dans Next.js 15 avec Supabase

## Vue d'ensemble

Dans Next.js 15, la gestion des cookies avec Supabase utilise les nouvelles méthodes `getAll` et `setAll` pour une meilleure cohérence et sécurité.

## Fonctionnement

1. **Création du client Supabase**
```typescript
const supabase = createServerClient(url, key, {
  cookies: {
    // Lire tous les cookies existants
    getAll: () => request.cookies.getAll(),
    // Écrire les nouveaux cookies
    setAll: (cookies) => cookies.forEach(c => response.cookies.set(c.name, c.value))
  }
})
```

2. **Gestion automatique des sessions**
- Supabase utilise ces méthodes pour :
  - Lire le token de session
  - Rafraîchir le token si nécessaire
  - Mettre à jour les cookies de session

3. **Avantages**
- Gestion centralisée des cookies
- Support natif de Next.js 15
- Pas besoin de manipuler les cookies manuellement

## Implémentation

1. **Dans le middleware**
- Utiliser `request.cookies` pour lire
- Utiliser `response.cookies` pour écrire
- Supabase gère automatiquement la session

2. **Dans les composants serveur**
- Même approche avec `cookies()` de next/headers
- Les cookies sont automatiquement synchronisés

## Best Practices

1. **Toujours utiliser getAll/setAll**
   - ✅ `getAll()` pour lire
   - ✅ `setAll()` pour écrire
   - ❌ Éviter `get()`/`set()` (dépréciés)

2. **Options de cookies**
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
}
```

3. **Gestion des erreurs**
- Toujours vérifier la session
- Rediriger vers /auth/login si nécessaire