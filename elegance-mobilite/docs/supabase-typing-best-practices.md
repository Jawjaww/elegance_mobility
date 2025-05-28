# Bonnes Pratiques de Typage avec Supabase

## Principes Fondamentaux

1. **Utiliser User de Supabase**
   ```typescript
   // ✅ Correct : Import direct de User
   import { User } from '@supabase/supabase-js'
   
   // ❌ À éviter : Extension du type User
   interface ExtendedUser extends User {
     customField: string
   }
   ```

2. **Conserver AppRole pour la Compatibilité**
   ```typescript
   // ✅ Correct : Définition du type AppRole
   export type AppRole = 'app_customer' | 'app_driver' | 'app_admin' | 'app_super_admin'
   
   // ✅ Correct : Utilisation avec User
   function isAdmin(user: User | null): boolean {
     return user?.role === 'app_admin' || user?.role === 'app_super_admin'
   }
   ```

## Migration des Imports

### Cas 1: Composants utilisant DbUser

```typescript
// Avant
import { DbUser } from '@/lib/types/database.types'

interface Props {
  user: DbUser
}

// Après
import { User } from '@supabase/supabase-js'
import type { AppRole } from '@/lib/types/database.types'

interface Props {
  user: User
}
```

### Cas 2: Vérification des Rôles

```typescript
// Avant
function checkUserRole(user: DbUser): boolean {
  return user.role === 'app_admin'
}

// Après
function checkUserRole(user: User | null): boolean {
  return user?.role === 'app_admin'
}
```

## Structure Recommandée

### database.types.ts
```typescript
import { User } from '@supabase/supabase-js'

// Conserver AppRole pour la compatibilité
export type AppRole = 'app_customer' | 'app_driver' | 'app_admin' | 'app_super_admin'

// Utiliser User directement pour auth.users
export interface Database {
  auth: {
    users: {
      Row: User
      Insert: {
        email: string
        user_metadata?: UserMetadata
      }
      Update: Partial<Database['auth']['users']['Insert']>
    }
  }
  // ... reste du schéma
}
```

## Bonnes Pratiques

1. **Importation des Types**
   ```typescript
   // ✅ Préférer
   import { User } from '@supabase/supabase-js'
   import type { AppRole } from '@/lib/types/database.types'

   // ❌ Éviter
   import { DbUser } from '@/lib/types/database.types'
   ```

2. **Vérification des Rôles**
   ```typescript
   // ✅ Correct
   function hasAccess(user: User | null, requiredRole: AppRole): boolean {
     return user?.role === requiredRole
   }
   ```

3. **Props de Composants**
   ```typescript
   // ✅ Correct
   interface HeaderProps {
     user: User
     allowedRoles: AppRole[]
   }
   ```

## À Éviter

1. **Extensions de Type**
   ```typescript
   // ❌ Ne pas faire
   type CustomUser = User & {
     extraField: string
   }
   ```

2. **Redéfinition des Champs**
   ```typescript
   // ❌ Ne pas faire
   interface UserFields {
     id: string // déjà dans User
     email: string // déjà dans User
   }
   ```

## Gestion des Métadonnées

```typescript
// ✅ Correct
interface UserMetadata {
  full_name?: string
  avatar_url?: string
}

function getUserMetadata(user: User | null): UserMetadata {
  return user?.user_metadata || {}
}
```

## Règles de Migration

1. **Remplacer Progressivement**
   - Identifier les utilisations de DbUser
   - Remplacer par User de @supabase/supabase-js
   - Conserver les références à AppRole

2. **Mise à Jour des Guards**
   ```typescript
   // ✅ Correct
   function isAdmin(user: User | null): boolean {
     return user?.role === 'app_admin' || user?.role === 'app_super_admin'
   }
   ```

3. **Adaptation des Composants**
   ```typescript
   // ✅ Correct
   interface Props {
     user: User
     role?: AppRole
   }
   ```

## Avantages

1. **Clarté**
   - Types provenant directement de Supabase
   - Moins d'indirection
   - Code plus prévisible

2. **Maintenance**
   - Mise à jour facilitée
   - Moins de types à maintenir
   - Meilleure compatibilité avec les mises à jour Supabase

3. **Performance**
   - Moins de surcharge de types
   - Moins de vérifications TypeScript
   - Bundle size réduit

## Conclusion

- Utiliser User de @supabase/supabase-js directement
- Conserver AppRole pour la compatibilité
- Éviter les abstractions supplémentaires
- Migrer progressivement les imports de DbUser