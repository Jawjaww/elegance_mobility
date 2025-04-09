# Architecture de l'Authentification

## Structure des fichiers

```
src/
├── lib/
│   └── database/
│       ├── client.ts      # Client Supabase côté client
│       ├── server.ts      # Client Supabase côté serveur
│       └── roles.ts       # Gestion des rôles et permissions
```

## Responsabilités

### roles.ts
- Définit les types de rôles
- Fournit les fonctions de vérification des rôles
- Centralise la logique d'autorisation

### server.ts
- Crée le client Supabase pour les Server Components
- Gère les cookies de manière sécurisée
- Fournit getServerSession pour la vérification côté serveur

### utils/supabase/client.ts
- Instance unique du client Supabase pour le navigateur
- Point d'entrée unique pour toutes les opérations Supabase côté client

## Middleware

Le middleware (src/middleware.ts) protège les routes en :
- Vérifiant l'authentification
- Validant les rôles
- Gérant les redirections

## Bonnes pratiques

2. Utiliser getServerSession pour les vérifications côté serveur
3. Ne pas créer de nouveaux fichiers d'authentification
4. Centraliser toute la logique d'autorisation dans roles.ts
5. Utiliser le client de utils/supabase/client.ts pour toutes les opérations Supabase

## Exemple d'utilisation

```tsx
// Client Component
function MyComponent() {
  
}

// Server Component
async function MyServerComponent() {
  const session = await getServerSession();
  return session ? <ProtectedContent /> : null;
}